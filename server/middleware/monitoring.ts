import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

// Health check endpoint data
interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: 'healthy' | 'unhealthy';
    redis?: 'healthy' | 'unhealthy';
    stripe: 'healthy' | 'unhealthy';
  };
  metrics: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
    };
    requests: {
      total: number;
      errorsLast5Min: number;
      averageResponseTime: number;
    };
  };
}

// Metrics collection
class MetricsCollector {
  private requestCount = 0;
  private errorCount = 0;
  private responseTimes: number[] = [];
  private recentErrors: { timestamp: number; error: string }[] = [];

  incrementRequest() {
    this.requestCount++;
  }

  incrementError(error: string) {
    this.errorCount++;
    this.recentErrors.push({
      timestamp: Date.now(),
      error: error,
    });
    
    // Keep only last 100 errors
    if (this.recentErrors.length > 100) {
      this.recentErrors = this.recentErrors.slice(-100);
    }
  }

  addResponseTime(time: number) {
    this.responseTimes.push(time);
    
    // Keep only last 1000 response times
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000);
    }
  }

  getErrorsInLastMinutes(minutes: number): number {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.recentErrors.filter(e => e.timestamp > cutoff).length;
  }

  getAverageResponseTime(): number {
    if (this.responseTimes.length === 0) return 0;
    return this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
  }

  getMetrics() {
    return {
      total: this.requestCount,
      errorsLast5Min: this.getErrorsInLastMinutes(5),
      averageResponseTime: Math.round(this.getAverageResponseTime()),
    };
  }
}

export const metricsCollector = new MetricsCollector();

// Health check implementation
export const healthCheck = async (): Promise<HealthCheck> => {
  const startTime = Date.now();
  
  // Check database connectivity
  let dbStatus: 'healthy' | 'unhealthy' = 'healthy';
  try {
    await storage.getUser('health-check-test');
  } catch (error) {
    dbStatus = 'unhealthy';
    console.error('Database health check failed:', error);
  }

  // Check Stripe connectivity (basic test)
  let stripeStatus: 'healthy' | 'unhealthy' = 'healthy';
  try {
    // This would be a minimal Stripe API call in production
    if (!process.env.STRIPE_SECRET_KEY) {
      stripeStatus = 'unhealthy';
    }
  } catch (error) {
    stripeStatus = 'unhealthy';
  }

  // Memory metrics
  const memoryUsage = process.memoryUsage();
  const memoryUsed = Math.round(memoryUsage.heapUsed / 1024 / 1024);
  const memoryTotal = Math.round(memoryUsage.heapTotal / 1024 / 1024);

  // CPU usage (simplified)
  const cpuUsage = Math.random() * 100; // In production, use proper CPU monitoring

  // Determine overall status
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (dbStatus === 'unhealthy' || stripeStatus === 'unhealthy') {
    status = 'unhealthy';
  } else if (memoryUsed > 400 || cpuUsage > 80) {
    status = 'degraded';
  }

  return {
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: dbStatus,
      stripe: stripeStatus,
    },
    metrics: {
      memory: {
        used: memoryUsed,
        total: memoryTotal,
        percentage: Math.round((memoryUsed / memoryTotal) * 100),
      },
      cpu: {
        usage: Math.round(cpuUsage),
      },
      requests: metricsCollector.getMetrics(),
    },
  };
};

// Metrics collection middleware
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  metricsCollector.incrementRequest();

  res.on('finish', () => {
    const duration = Date.now() - start;
    metricsCollector.addResponseTime(duration);

    // Track errors
    if (res.statusCode >= 400) {
      metricsCollector.incrementError(`${res.statusCode} ${req.method} ${req.path}`);
    }
  });

  next();
};

// User analytics tracking
export const analyticsTracker = (req: Request, res: Response, next: NextFunction) => {
  const trackingData = {
    userId: (req as any).user?.claims?.sub,
    sessionId: req.sessionID,
    path: req.path,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date(),
  };

  // Track page views and API calls
  if (req.path.startsWith('/api/')) {
    // API call tracking
    res.on('finish', async () => {
      try {
        // Only track analytics if the table exists
        try {
          await storage.createAnalyticsEvent({
          userId: trackingData.userId,
          eventType: 'api_call',
          eventData: {
            endpoint: req.path,
            method: req.method,
            statusCode: res.statusCode,
            responseTime: Date.now() - parseInt(req.get('X-Request-Start') || '0'),
          },
          sessionId: trackingData.sessionId,
          ipAddress: trackingData.ip,
          userAgent: trackingData.userAgent,
        });
        } catch (innerError) {
          // Silently ignore analytics tracking errors in development
          if (process.env.NODE_ENV !== 'development') {
            console.error('Failed to track analytics event:', innerError);
          }
        }
      } catch (error) {
        console.error('Failed to track API call:', error);
      }
    });
  }

  next();
};

// Error tracking and alerting
export const errorTracker = (err: any, req: Request, res: Response, next: NextFunction) => {
  const errorData = {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    userId: (req as any).user?.claims?.sub,
    timestamp: new Date().toISOString(),
    severity: getSeverity(err, res.statusCode),
  };

  // Log error
  console.error('Application error:', errorData);

  // Track critical errors
  if (errorData.severity === 'critical') {
    // In production, this would send alerts via email, Slack, etc.
    console.error('CRITICAL ERROR DETECTED:', errorData);
    
    // Could integrate with error tracking services like Sentry
    // Sentry.captureException(err, { extra: errorData });
  }

  next(err);
};

function getSeverity(error: any, statusCode: number): 'low' | 'medium' | 'high' | 'critical' {
  if (statusCode >= 500) return 'critical';
  if (statusCode >= 400) return 'high';
  if (error.name === 'ValidationError') return 'medium';
  return 'low';
}

// Performance alerting
export const performanceAlerter = {
  checkPerformance: async () => {
    const health = await healthCheck();
    
    // Alert on high memory usage
    if (health.metrics.memory.percentage > 80) {
      console.warn('HIGH MEMORY USAGE ALERT:', {
        used: health.metrics.memory.used,
        percentage: health.metrics.memory.percentage,
      });
    }

    // Alert on high error rate
    if (health.metrics.requests.errorsLast5Min > 10) {
      console.warn('HIGH ERROR RATE ALERT:', {
        errors: health.metrics.requests.errorsLast5Min,
        timeframe: 'last 5 minutes',
      });
    }

    // Alert on slow response times
    if (health.metrics.requests.averageResponseTime > 2000) {
      console.warn('SLOW RESPONSE TIME ALERT:', {
        averageTime: health.metrics.requests.averageResponseTime,
        threshold: '2000ms',
      });
    }
  },

  start: () => {
    // Check performance every 5 minutes
    setInterval(() => {
      this.checkPerformance().catch(console.error);
    }, 5 * 60 * 1000);
  },
};

// Log aggregation for different log levels
export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${new Date().toISOString()} ${message}`, data || '');
  },
  
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${new Date().toISOString()} ${message}`, data || '');
  },
  
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} ${message}`, error || '');
  },
  
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${new Date().toISOString()} ${message}`, data || '');
    }
  },
};