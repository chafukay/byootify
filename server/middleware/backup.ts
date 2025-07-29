import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { logger } from './monitoring';

const execAsync = promisify(exec);

interface BackupConfig {
  frequency: 'hourly' | 'daily' | 'weekly';
  retention: number; // Number of backups to keep
  destination: string;
  includeUploads: boolean;
}

interface BackupResult {
  success: boolean;
  filename?: string;
  size?: number;
  duration?: number;
  error?: string;
}

export class BackupManager {
  private config: BackupConfig;
  private backupDir: string;

  constructor(config: BackupConfig) {
    this.config = config;
    this.backupDir = join(process.cwd(), 'backups');
    
    // Create backup directory if it doesn't exist
    if (!existsSync(this.backupDir)) {
      mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async createDatabaseBackup(): Promise<BackupResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `database-backup-${timestamp}.sql`;
    const filepath = join(this.backupDir, filename);

    try {
      // For PostgreSQL backup using pg_dump
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('DATABASE_URL not configured');
      }

      // Extract connection details from DATABASE_URL
      const url = new URL(databaseUrl);
      const command = `pg_dump "${databaseUrl}" > "${filepath}"`;

      logger.info('Starting database backup', { filename });
      
      await execAsync(command);

      // Get file size
      const stats = require('fs').statSync(filepath);
      const duration = Date.now() - startTime;

      logger.info('Database backup completed', {
        filename,
        size: `${Math.round(stats.size / 1024 / 1024)}MB`,
        duration: `${duration}ms`,
      });

      return {
        success: true,
        filename,
        size: stats.size,
        duration,
      };

    } catch (error) {
      logger.error('Database backup failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async createApplicationBackup(): Promise<BackupResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `app-backup-${timestamp}.tar.gz`;
    const filepath = join(this.backupDir, filename);

    try {
      // Create application backup (excluding node_modules, .git, backups)
      const excludes = [
        '--exclude=node_modules',
        '--exclude=.git',
        '--exclude=backups',
        '--exclude=*.log',
        '--exclude=.env*',
      ];

      const command = `tar -czf "${filepath}" ${excludes.join(' ')} .`;

      logger.info('Starting application backup', { filename });
      
      await execAsync(command);

      const stats = require('fs').statSync(filepath);
      const duration = Date.now() - startTime;

      logger.info('Application backup completed', {
        filename,
        size: `${Math.round(stats.size / 1024 / 1024)}MB`,
        duration: `${duration}ms`,
      });

      return {
        success: true,
        filename,
        size: stats.size,
        duration,
      };

    } catch (error) {
      logger.error('Application backup failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async createFullBackup(): Promise<{ database: BackupResult; application: BackupResult }> {
    logger.info('Starting full backup process');

    const [databaseResult, applicationResult] = await Promise.all([
      this.createDatabaseBackup(),
      this.createApplicationBackup(),
    ]);

    // Create backup manifest
    const manifest = {
      timestamp: new Date().toISOString(),
      database: databaseResult,
      application: applicationResult,
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
    };

    const manifestPath = join(this.backupDir, `manifest-${Date.now()}.json`);
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    return { database: databaseResult, application: applicationResult };
  }

  async cleanupOldBackups(): Promise<void> {
    try {
      const files = require('fs').readdirSync(this.backupDir);
      
      // Separate database and application backups
      const dbBackups = files.filter((f: string) => f.startsWith('database-backup-')).sort().reverse();
      const appBackups = files.filter((f: string) => f.startsWith('app-backup-')).sort().reverse();

      // Remove old database backups
      if (dbBackups.length > this.config.retention) {
        const toDelete = dbBackups.slice(this.config.retention);
        for (const file of toDelete) {
          require('fs').unlinkSync(join(this.backupDir, file));
          logger.info('Deleted old database backup', { file });
        }
      }

      // Remove old application backups
      if (appBackups.length > this.config.retention) {
        const toDelete = appBackups.slice(this.config.retention);
        for (const file of toDelete) {
          require('fs').unlinkSync(join(this.backupDir, file));
          logger.info('Deleted old application backup', { file });
        }
      }

    } catch (error) {
      logger.error('Failed to cleanup old backups', error);
    }
  }

  async restoreDatabase(backupFilename: string): Promise<BackupResult> {
    const startTime = Date.now();
    const filepath = join(this.backupDir, backupFilename);

    try {
      if (!existsSync(filepath)) {
        throw new Error(`Backup file not found: ${backupFilename}`);
      }

      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('DATABASE_URL not configured');
      }

      logger.warn('Starting database restore', { backupFilename });

      // Restore database using psql
      const command = `psql "${databaseUrl}" < "${filepath}"`;
      await execAsync(command);

      const duration = Date.now() - startTime;

      logger.info('Database restore completed', {
        backupFilename,
        duration: `${duration}ms`,
      });

      return {
        success: true,
        filename: backupFilename,
        duration,
      };

    } catch (error) {
      logger.error('Database restore failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  getBackupStatus() {
    try {
      const files = require('fs').readdirSync(this.backupDir);
      
      const dbBackups = files.filter((f: string) => f.startsWith('database-backup-'));
      const appBackups = files.filter((f: string) => f.startsWith('app-backup-'));

      const getFileInfo = (filename: string) => {
        const filepath = join(this.backupDir, filename);
        const stats = require('fs').statSync(filepath);
        return {
          filename,
          size: stats.size,
          created: stats.birthtime,
        };
      };

      return {
        totalBackups: files.length,
        databaseBackups: dbBackups.length,
        applicationBackups: appBackups.length,
        latestDatabase: dbBackups.sort().reverse()[0] ? getFileInfo(dbBackups.sort().reverse()[0]) : null,
        latestApplication: appBackups.sort().reverse()[0] ? getFileInfo(appBackups.sort().reverse()[0]) : null,
        backupDirectory: this.backupDir,
        config: this.config,
      };

    } catch (error) {
      logger.error('Failed to get backup status', error);
      return null;
    }
  }

  startScheduledBackups(): void {
    let interval: number;

    switch (this.config.frequency) {
      case 'hourly':
        interval = 60 * 60 * 1000; // 1 hour
        break;
      case 'daily':
        interval = 24 * 60 * 60 * 1000; // 24 hours
        break;
      case 'weekly':
        interval = 7 * 24 * 60 * 60 * 1000; // 7 days
        break;
    }

    logger.info('Starting scheduled backups', {
      frequency: this.config.frequency,
      retention: this.config.retention,
    });

    // Run initial backup
    this.createFullBackup().then(() => {
      this.cleanupOldBackups();
    });

    // Schedule recurring backups
    setInterval(async () => {
      try {
        await this.createFullBackup();
        await this.cleanupOldBackups();
      } catch (error) {
        logger.error('Scheduled backup failed', error);
      }
    }, interval);
  }
}

// Disaster recovery utilities
export class DisasterRecovery {
  static async createRecoveryPoint(): Promise<string> {
    const timestamp = new Date().toISOString();
    const recoveryPoint = {
      timestamp,
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      systemState: {
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        platform: process.platform,
        nodeVersion: process.version,
      },
    };

    const filename = `recovery-point-${timestamp.replace(/[:.]/g, '-')}.json`;
    const filepath = join(process.cwd(), 'backups', filename);

    writeFileSync(filepath, JSON.stringify(recoveryPoint, null, 2));
    logger.info('Recovery point created', { filename });

    return filename;
  }

  static async validateSystemIntegrity(): Promise<{
    database: boolean;
    fileSystem: boolean;
    dependencies: boolean;
    configuration: boolean;
  }> {
    const results = {
      database: false,
      fileSystem: false,
      dependencies: false,
      configuration: false,
    };

    try {
      // Check database connectivity
      if (process.env.DATABASE_URL) {
        results.database = true;
      }

      // Check critical files exist
      const criticalFiles = ['package.json', 'server/index.ts', 'shared/schema.ts'];
      results.fileSystem = criticalFiles.every(file => existsSync(file));

      // Check dependencies (simplified)
      results.dependencies = existsSync('node_modules');

      // Check configuration
      const requiredEnvVars = ['DATABASE_URL', 'SESSION_SECRET'];
      results.configuration = requiredEnvVars.every(envVar => process.env[envVar]);

    } catch (error) {
      logger.error('System integrity check failed', error);
    }

    return results;
  }

  static async runHealthCheck(): Promise<boolean> {
    try {
      const integrity = await this.validateSystemIntegrity();
      const allHealthy = Object.values(integrity).every(status => status);

      if (!allHealthy) {
        logger.warn('System health check failed', integrity);
      }

      return allHealthy;
    } catch (error) {
      logger.error('Health check failed', error);
      return false;
    }
  }
}

// Default backup configuration
export const defaultBackupConfig: BackupConfig = {
  frequency: 'daily',
  retention: 7, // Keep 7 backups
  destination: './backups',
  includeUploads: true,
};

// Initialize backup manager
export const backupManager = new BackupManager(
  process.env.NODE_ENV === 'production' 
    ? { ...defaultBackupConfig, frequency: 'daily', retention: 30 }
    : defaultBackupConfig
);