/**
 * API Middleware for EchoTune AI
 * Authentication, rate limiting, CORS, and other middleware functions
 */

const cors = require('cors');
const { verifyJWT, verifyRefreshToken: _verifyRefreshToken } = require('../utils/auth-helpers');
const { getRedisManager } = require('../utils/redis');

/**
 * Production authentication middleware
 * Verifies JWT tokens and maintains session state
 */
function requireAuth(req, res, next) {
  // Development fallback mode
  if (process.env.NODE_ENV !== 'production' && process.env.AUTH_DEVELOPMENT_MODE === 'true') {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      if (token) {
        req.userId = token;
        req.user = { id: token, display_name: `Dev User ${token}` };
        return next();
      }
    }
    return res.status(401).json({
      error: 'Authorization required',
      message: 'Please provide an authorization header',
    });
  }

  // Production JWT-based authentication
  const authHeader = req.headers.authorization;
  const token = req.cookies?.access_token || (authHeader && authHeader.replace('Bearer ', ''));

  if (!token) {
    return res.status(401).json({
      error: 'Authorization required',
      message: 'Please login to access this resource',
      code: 'AUTH_REQUIRED'
    });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('JWT_SECRET not configured');
    return res.status(500).json({
      error: 'Authentication service unavailable',
      message: 'Server configuration error'
    });
  }

  const decoded = verifyJWT(token, jwtSecret);
  if (!decoded) {
    return res.status(401).json({
      error: 'Invalid or expired token',
      message: 'Please login again',
      code: 'TOKEN_INVALID'
    });
  }

  req.userId = decoded.id;
  req.user = decoded;
  next();
}

/**
 * Extract user information from request (optional)
 */
function extractUser(req, res, next) {
  // Development fallback mode
  if (process.env.NODE_ENV !== 'production' && process.env.AUTH_DEVELOPMENT_MODE === 'true') {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      if (token) {
        req.userId = token;
        req.user = { id: token, display_name: `Dev User ${token}` };
      }
    }
    return next();
  }

  // Production JWT extraction
  const authHeader = req.headers.authorization;
  const token = req.cookies?.access_token || (authHeader && authHeader.replace('Bearer ', ''));

  if (token && process.env.JWT_SECRET) {
    const decoded = verifyJWT(token, process.env.JWT_SECRET);
    if (decoded) {
      req.userId = decoded.id;
      req.user = decoded;
    }
  }

  next();
}

/**
 * Create rate limiter with Redis backing or in-memory fallback
 */
function createRateLimit(options = {}) {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes default
  const max = options.max || 100;
  const windowSeconds = Math.floor(windowMs / 1000);
  
  // In-memory fallback for when Redis is not available
  const requests = new Map();

  return async (req, res, next) => {
    try {
      const redisManager = getRedisManager();
      const key = options.keyGenerator ? 
        options.keyGenerator(req) : 
        `rate_limit:${req.ip || req.connection.remoteAddress}`;

      let rateLimitResult;

      if (redisManager.useRedis && redisManager.isConnected) {
        // Use Redis-backed rate limiting
        rateLimitResult = await redisManager.rateLimit(key, max, windowSeconds);
      } else {
        // Fallback to in-memory rate limiting
        const now = Date.now();
        const cutoff = now - windowMs;
        
        // Clean old entries
        for (const [k, v] of requests.entries()) {
          if (v.resetTime < cutoff) {
            requests.delete(k);
          }
        }

        const requestInfo = requests.get(key) || { count: 0, resetTime: now + windowMs };
        
        if (requestInfo.count >= max) {
          rateLimitResult = {
            allowed: false,
            count: requestInfo.count,
            limit: max,
            resetTime: requestInfo.resetTime,
            remaining: 0
          };
        } else {
          requestInfo.count++;
          requests.set(key, requestInfo);
          rateLimitResult = {
            allowed: true,
            count: requestInfo.count,
            limit: max,
            resetTime: requestInfo.resetTime,
            remaining: Math.max(0, max - requestInfo.count)
          };
        }
      }

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': rateLimitResult.limit,
        'X-RateLimit-Remaining': rateLimitResult.remaining,
        'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime / 1000)
      });

      if (!rateLimitResult.allowed) {
        return res.status(429).json({
          error: 'Too many requests',
          message: options.message || 'Too many requests, please try again later.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining
        });
      }

      next();
    } catch (error) {
      console.error('Rate limiting error:', error.message);
      // Fail open on rate limiting errors
      next();
    }
  };
}

/**
 * Database connection middleware
 */
function ensureDatabase(req, res, next) {
  // Database connection is handled at startup
  // This middleware can be used for per-request database checks if needed
  next();
}

/**
 * Request logging middleware
 */
function requestLogger(req, res, next) {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} ${req.method} ${req.path}`);

  // Track response time
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });

  next();
}

/**
 * CORS middleware
 */
const corsMiddleware = cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    // Allow localhost for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }

    // Allow production domains
    const allowedDomains = ['https://primosphere.studio', 'https://www.primosphere.studio'];

    if (allowedDomains.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
});

/**
 * Error handling middleware
 */
function errorHandler(err, req, res, _next) {
  console.error('Error:', err);

  // Default error response
  let statusCode = 500;
  let message = 'Internal server error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized access';
  } else if (err.message) {
    message = err.message;
  }

  res.status(statusCode).json({
    error: err.name || 'Error',
    message: message,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Security headers middleware with enhanced protection
 */
function securityHeaders(req, res, next) {
  const isProduction = process.env.NODE_ENV === 'production';
  const { getSecurityHeaders } = require('../utils/auth-helpers');
  
  const headers = getSecurityHeaders(isProduction);
  
  // Apply all security headers
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  next();
}

/**
 * Input sanitization middleware
 */
function sanitizeInput(req, res, next) {
  // Basic XSS protection for text inputs
  function sanitizeValue(value) {
    if (typeof value === 'string') {
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }
    return value;
  }

  function sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return sanitizeValue(obj);
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        sanitized[key] = value.map(sanitizeObject);
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = sanitizeValue(value);
      }
    }
    return sanitized;
  }

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
}

/**
 * Request size limiting middleware
 */
function requestSizeLimit(req, res, next) {
  const maxSize = 10485760; // 10MB default

  if (req.headers['content-length'] && parseInt(req.headers['content-length']) > maxSize) {
    return res.status(413).json({
      error: 'Payload Too Large',
      message: `Request size exceeds ${maxSize} bytes`,
    });
  }

  next();
}

/**
 * Specialized rate limiters for different endpoints
 */
const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 auth attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later',
  keyGenerator: (req) => `auth:${req.ip || 'unknown'}`
});

const apiRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes  
  max: 100, // 100 API requests per 15 minutes
  message: 'Too many API requests, please slow down',
  keyGenerator: (req) => `api:${req.user?.id || req.ip || 'unknown'}`
});

const spotifyRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Higher limit for Spotify operations
  message: 'Too many Spotify API requests, please slow down',
  keyGenerator: (req) => `spotify:${req.user?.id || req.ip || 'unknown'}`
});

const chatRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 chat messages per minute
  message: 'Too many chat messages, please slow down',
  keyGenerator: (req) => `chat:${req.user?.id || req.ip || 'unknown'}`
});

module.exports = {
  requireAuth,
  extractUser,
  createRateLimit,
  ensureDatabase,
  requestLogger,
  corsMiddleware,
  errorHandler,
  securityHeaders,
  sanitizeInput,
  requestSizeLimit,
  // Specialized rate limiters
  authRateLimit,
  apiRateLimit,
  spotifyRateLimit,
  chatRateLimit,
};
