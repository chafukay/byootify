import compression from 'compression';
import { Request, Response, NextFunction } from 'express';
import { LRUCache } from 'lru-cache';

// Response compression
export const compressionMiddleware = compression({
  filter: (req: Request, res: Response) => {
    // Don't compress responses if the request is for an image or already compressed
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // Compression level (1-9, 6 is good balance)
  threshold: 1024, // Only compress if response is larger than 1KB
});

// Response caching
interface CacheOptions {
  ttl: number; // Time to live in milliseconds
  max: number; // Maximum number of items
}

export class ResponseCache {
  private cache: LRUCache<string, any>;

  constructor(options: CacheOptions) {
    this.cache = new LRUCache({
      max: options.max,
      ttl: options.ttl,
    });
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Only cache GET requests
      if (req.method !== 'GET') {
        return next();
      }

      // Skip caching for authenticated requests that might have user-specific data
      const skipCache = req.path.includes('/api/auth/') || 
                       req.path.includes('/api/bookings/my') ||
                       req.path.includes('/api/analytics/');
      
      if (skipCache) {
        return next();
      }

      const key = `${req.method}:${req.path}:${JSON.stringify(req.query)}`;
      const cachedResponse = this.cache.get(key);

      if (cachedResponse) {
        if (!res.headersSent) {
          res.set('X-Cache', 'HIT');
        }
        return res.json(cachedResponse);
      }

      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function(data: any) {
        if (res.statusCode === 200) {
          this.cache.set(key, data);
        }
        if (!res.headersSent) {
          res.set('X-Cache', 'MISS');
        }
        return originalJson.call(this, data);
      }.bind(this);

      next();
    };
  }

  clear(pattern?: string) {
    if (pattern) {
      // Clear keys matching pattern
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
}

// Create cache instances
export const apiCache = new ResponseCache({
  ttl: 5 * 60 * 1000, // 5 minutes
  max: 500, // 500 items max
});

export const staticCache = new ResponseCache({
  ttl: 60 * 60 * 1000, // 1 hour
  max: 100,
});

// Database query optimization middleware
export const dbOptimizationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Add query hints for common endpoints
  const optimizationHints = {
    '/api/professionals': {
      select: ['id', 'businessName', 'location', 'rating', 'reviewCount'],
      orderBy: 'rating DESC',
      limit: 20,
    },
    '/api/services': {
      select: ['id', 'name', 'price', 'duration', 'isActive'],
      where: 'isActive = true',
    },
  };

  const hint = optimizationHints[req.path as keyof typeof optimizationHints];
  if (hint) {
    (req as any).dbHint = hint;
  }

  next();
};

// Performance monitoring
export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime.bigint();
  const startMemory = process.memoryUsage();

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const endMemory = process.memoryUsage();
    
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;

    // Log slow requests (>1000ms)
    if (duration > 1000) {
      console.warn('Slow request detected:', {
        method: req.method,
        url: req.url,
        duration: `${duration.toFixed(2)}ms`,
        memoryDelta: `${Math.round(memoryDelta / 1024 / 1024)}MB`,
        timestamp: new Date().toISOString(),
      });
    }

    // Add performance headers only if response hasn't been sent
    if (!res.headersSent) {
      res.set({
        'X-Response-Time': `${duration.toFixed(2)}ms`,
        'X-Memory-Usage': `${Math.round(endMemory.heapUsed / 1024 / 1024)}MB`,
      });
    }
  });

  next();
};

// Asset optimization
export const assetOptimization = (req: Request, res: Response, next: NextFunction) => {
  // Set appropriate cache headers for static assets
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|webp)$/)) {
    // Cache static assets for 1 year
    res.set({
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Expires': new Date(Date.now() + 31536000000).toUTCString(),
    });
  } else if (req.path.match(/\.(html|json)$/)) {
    // Cache HTML/JSON for 1 hour with revalidation
    res.set({
      'Cache-Control': 'public, max-age=3600, must-revalidate',
    });
  }

  next();
};

// Connection pooling optimization
export const connectionPoolStats = () => {
  return {
    getStats: () => {
      // This would integrate with your database connection pool
      return {
        totalConnections: 10,
        idleConnections: 5,
        activeConnections: 5,
        waitingRequests: 0,
      };
    },
    
    optimize: () => {
      // Adjust pool size based on current load
      const stats = this.getStats();
      if (stats.waitingRequests > 5) {
        console.log('High database load detected, consider increasing pool size');
      }
    },
  };
};

// Memory usage monitoring
export const memoryMonitor = {
  start: () => {
    setInterval(() => {
      const usage = process.memoryUsage();
      const used = Math.round(usage.heapUsed / 1024 / 1024);
      const total = Math.round(usage.heapTotal / 1024 / 1024);
      
      // Log memory warnings
      if (used > 400) { // 400MB threshold
        console.warn(`High memory usage: ${used}MB / ${total}MB`);
      }
      
      // Force garbage collection if memory usage is too high
      if (used > 800 && global.gc) {
        console.log('Running garbage collection...');
        global.gc();
      }
    }, 30000); // Check every 30 seconds
  },
};