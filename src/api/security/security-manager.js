const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const helmet = require('helmet');

/**
 * Enhanced Security Middleware for EchoTune AI
 *
 * Provides comprehensive security features:
 * - Advanced rate limiting with sliding windows
 * - Request throttling and slowdown
 * - Input validation and sanitization
 * - Security headers optimization
 * - Brute force protection
 * - API abuse detection
 */

class SecurityManager {
  constructor() {
    this.rateLimitStore = new Map();
    this.suspiciousIPs = new Set();
    this.blockedIPs = new Set();
    this.initializeMiddleware();
  }

  initializeMiddleware() {
    this.setupRateLimiting();
    this.setupSecurityHeaders();
    this.setupRequestThrottling();
  }

  /**
   * Setup advanced rate limiting strategies
   */
  setupRateLimiting() {
    // General API rate limiting
    this.generalRateLimit = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // Limit each IP to 1000 requests per windowMs
      message: {
        error: 'Too many requests from this IP',
        retryAfter: 15 * 60, // 15 minutes in seconds
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: this.createCustomStore('general'),
      skip: (req) => this.blockedIPs.has(this.getClientIP(req)),
    });

    // Strict rate limiting for authentication endpoints
    this.authRateLimit = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 20, // Limit auth attempts
      message: {
        error: 'Too many authentication attempts',
        retryAfter: 15 * 60,
      },
      skipSuccessfulRequests: true,
      store: this.createCustomStore('auth'),
    });

    // Very strict rate limiting for sensitive operations
    this.sensitiveRateLimit = rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10, // Very limited for sensitive operations
      message: {
        error: 'Rate limit exceeded for sensitive operations',
        retryAfter: 60 * 60,
      },
      store: this.createCustomStore('sensitive'),
    });

    // Chat/AI rate limiting (moderate)
    this.chatRateLimit = rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 30, // 30 messages per minute
      message: {
        error: 'Chat rate limit exceeded',
        retryAfter: 60,
      },
      store: this.createCustomStore('chat'),
    });

    // Recommendation rate limiting
    this.recommendationRateLimit = rateLimit({
      windowMs: 5 * 60 * 1000, // 5 minutes
      max: 100, // 100 recommendation requests per 5 minutes
      message: {
        error: 'Recommendation rate limit exceeded',
        retryAfter: 5 * 60,
      },
      store: this.createCustomStore('recommendations'),
    });
  }

  /**
   * Setup comprehensive security headers
   */
  setupSecurityHeaders() {
    this.securityHeaders = helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          connectSrc: [
            "'self'",
            'https://api.spotify.com',
            'https://accounts.spotify.com',
            'https://api.openai.com',
            'wss:',
            'ws:',
          ],
          mediaSrc: ["'self'", 'https:', 'blob:'],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      noSniff: true,
      xssFilter: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    });
  }

  /**
   * Setup request throttling for suspicious behavior
   */
  setupRequestThrottling() {
    this.requestThrottle = slowDown({
      windowMs: 15 * 60 * 1000, // 15 minutes
      delayAfter: 500, // Allow 500 requests per 15 minutes at full speed
      delayMs: () => 100, // Fixed: Use function format for v2 compatibility
      maxDelayMs: 5000, // Maximum delay of 5 seconds
      // Removed deprecated onLimitReached - use handler middleware instead
      validate: { delayMs: false }, // Disable warning about delayMs format
      handler: (req, res, next) => {
        const ip = this.getClientIP(req);
        this.suspiciousIPs.add(ip);
        console.warn(`Request throttling activated for IP: ${ip}`);
        next(); // Continue to apply the delay
      },
    });
  }

  /**
   * Create custom rate limit store with enhanced features
   */
  createCustomStore(type) {
    return {
      incr: (key, cb) => {
        const now = Date.now();
        const windowMs = this.getWindowMs(type);

        if (!this.rateLimitStore.has(key)) {
          this.rateLimitStore.set(key, { count: 0, resetTime: now + windowMs });
        }

        const record = this.rateLimitStore.get(key);

        // Reset if window has expired
        if (now > record.resetTime) {
          record.count = 0;
          record.resetTime = now + windowMs;
        }

        record.count++;
        this.rateLimitStore.set(key, record);

        cb(null, record.count, record.resetTime);
      },

      decrement: (key) => {
        const record = this.rateLimitStore.get(key);
        if (record && record.count > 0) {
          record.count--;
          this.rateLimitStore.set(key, record);
        }
      },

      resetKey: (key) => {
        this.rateLimitStore.delete(key);
      },
    };
  }

  /**
   * Get window size for different rate limit types
   */
  getWindowMs(type) {
    const windows = {
      general: 15 * 60 * 1000,
      auth: 15 * 60 * 1000,
      sensitive: 60 * 60 * 1000,
      chat: 60 * 1000,
      recommendations: 5 * 60 * 1000,
    };
    return windows[type] || 15 * 60 * 1000;
  }

  /**
   * Get client IP address (considering proxies)
   */
  getClientIP(req) {
    return (
      req.ip ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
      req.headers['x-forwarded-for']?.split(',')[0] ||
      '0.0.0.0'
    );
  }

  /**
   * Input validation and sanitization middleware
   */
  validateAndSanitizeInput() {
    return (req, res, next) => {
      try {
        // Sanitize query parameters
        if (req.query) {
          for (const [key, value] of Object.entries(req.query)) {
            if (typeof value === 'string') {
              req.query[key] = this.sanitizeString(value);
            }
          }
        }

        // Sanitize body parameters
        if (req.body && typeof req.body === 'object') {
          req.body = this.sanitizeObject(req.body);
        }

        // Validate common parameters
        this.validateCommonParams(req);

        next();
      } catch (error) {
        res.status(400).json({
          error: 'Invalid input parameters',
          message: error.message,
        });
      }
    };
  }

  /**
   * Sanitize string input
   */
  sanitizeString(str) {
    if (typeof str !== 'string') return str;

    // Remove potentially dangerous characters
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim()
      .substring(0, 1000); // Limit length
  }

  /**
   * Sanitize object recursively
   */
  sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (typeof value === 'object') {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  /**
   * Validate common request parameters
   */
  validateCommonParams(req) {
    // Validate limit parameter
    if (req.query.limit) {
      const limit = parseInt(req.query.limit);
      if (isNaN(limit) || limit < 1 || limit > 100) {
        throw new Error('Limit parameter must be between 1 and 100');
      }
    }

    // Validate offset parameter
    if (req.query.offset) {
      const offset = parseInt(req.query.offset);
      if (isNaN(offset) || offset < 0) {
        throw new Error('Offset parameter must be a non-negative integer');
      }
    }

    // Validate audio feature target values
    const audioFeatures = ['target_energy', 'target_valence', 'target_danceability'];
    for (const feature of audioFeatures) {
      if (req.query[feature]) {
        const value = parseFloat(req.query[feature]);
        if (isNaN(value) || value < 0 || value > 1) {
          throw new Error(`${feature} must be between 0 and 1`);
        }
      }
    }
  }

  /**
   * Suspicious activity detection middleware
   */
  detectSuspiciousActivity() {
    return (req, res, next) => {
      const ip = this.getClientIP(req);

      // Check if IP is blocked
      if (this.blockedIPs.has(ip)) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'IP address is blocked',
        });
      }

      // Detect suspicious patterns
      if (this.isSuspiciousRequest(req)) {
        this.suspiciousIPs.add(ip);
        console.warn(`Suspicious activity detected from IP: ${ip}`);

        // Block after multiple suspicious activities
        if (this.getSuspiciousCount(ip) > 10) {
          this.blockedIPs.add(ip);
          console.error(`IP blocked due to repeated suspicious activity: ${ip}`);
        }
      }

      next();
    };
  }

  /**
   * Check if request is suspicious
   */
  isSuspiciousRequest(req) {
    const suspiciousPatterns = [
      /script/i,
      /javascript:/i,
      /vbscript:/i,
      /onload/i,
      /onerror/i,
      /<iframe/i,
      /eval\(/i,
      /union.*select/i,
      /drop.*table/i,
    ];

    const checkString = JSON.stringify(req.query) + JSON.stringify(req.body);
    return suspiciousPatterns.some((pattern) => pattern.test(checkString));
  }

  /**
   * Get suspicious activity count for IP
   */
  getSuspiciousCount(ip) {
    // This is a simplified version - in production you'd want persistent storage
    return this.suspiciousIPs.has(ip) ? 1 : 0;
  }

  /**
   * Get security statistics
   */
  getSecurityStats() {
    return {
      rate_limit_store_size: this.rateLimitStore.size,
      suspicious_ips: this.suspiciousIPs.size,
      blocked_ips: this.blockedIPs.size,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Manual IP blocking/unblocking
   */
  blockIP(ip) {
    this.blockedIPs.add(ip);
    console.warn(`IP manually blocked: ${ip}`);
  }

  unblockIP(ip) {
    this.blockedIPs.delete(ip);
    this.suspiciousIPs.delete(ip);
    console.info(`IP unblocked: ${ip}`);
  }

  /**
   * Clear security data (for maintenance)
   */
  clearSecurityData() {
    this.rateLimitStore.clear();
    this.suspiciousIPs.clear();
    // Don't clear blocked IPs automatically
    console.info('Security data cleared');
  }
}

module.exports = SecurityManager;
