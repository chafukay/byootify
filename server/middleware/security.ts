import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { body, validationResult } from 'express-validator';
import type { Request, Response, NextFunction } from 'express';

// Rate limiting configurations
// Adjust rate limits for development vs production
const isDevelopment = process.env.NODE_ENV === 'development';

export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 100, // Higher limit in development
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 50 : 5, // Higher limit in development
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
  skipSuccessfulRequests: true,
});

export const apiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: isDevelopment ? 300 : 60, // Higher limit in development
  message: {
    error: 'API rate limit exceeded, please try again later.',
  },
});

export const strictRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit sensitive operations
  message: {
    error: 'Rate limit exceeded for sensitive operations.',
  },
});

// Security headers configuration
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com"],
      connectSrc: ["'self'", "https://api.stripe.com", "wss:", "ws:"],
      frameSrc: ["'self'", "https://js.stripe.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// Input validation middleware
export const validateBooking = [
  body('professionalId').isNumeric().withMessage('Professional ID must be numeric'),
  body('serviceId').isNumeric().withMessage('Service ID must be numeric'),
  body('date').isISO8601().withMessage('Date must be valid ISO 8601 format'),
  body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Time must be in HH:MM format'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes must be under 500 characters'),
];

export const validateReview = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').isLength({ min: 10, max: 1000 }).withMessage('Comment must be 10-1000 characters'),
  body('professionalId').isNumeric().withMessage('Professional ID must be numeric'),
];

export const validateProfessional = [
  body('businessName').isLength({ min: 2, max: 100 }).withMessage('Business name must be 2-100 characters'),
  body('location').isLength({ min: 2, max: 200 }).withMessage('Location must be 2-200 characters'),
  body('phoneNumber').isMobilePhone('any').withMessage('Invalid phone number'),
  body('specialties').isArray({ min: 1 }).withMessage('At least one specialty required'),
  body('bio').optional().isLength({ max: 1000 }).withMessage('Bio must be under 1000 characters'),
];

export const validatePayment = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('currency').isIn(['usd', 'eur', 'gbp']).withMessage('Invalid currency'),
];

// Validation error handler
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

// SQL injection prevention
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeValue = (value: any): any => {
    if (typeof value === 'string') {
      // Remove potentially dangerous characters
      return value.replace(/[<>\"'%;()&+]/g, '');
    }
    if (typeof value === 'object' && value !== null) {
      const sanitized: any = {};
      for (const key in value) {
        sanitized[key] = sanitizeValue(value[key]);
      }
      return sanitized;
    }
    return value;
  };

  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }
  if (req.params) {
    req.params = sanitizeValue(req.params);
  }

  next();
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
    };
    
    // Log to console in development, would use proper logging service in production
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${logData.timestamp}] ${logData.method} ${logData.url} ${logData.status} in ${logData.duration}`);
    }
  });
  
  next();
};

// Error tracking middleware
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Log error details
  console.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
    userId: (req as any).user?.claims?.sub,
  });

  // Don't leak sensitive information in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack }),
  });
};