/**
 * EchoTune AI - Security Hardening Suite
 * Phase 1 Epic E02: Security & Dependency Hardening
 * 
 * Comprehensive security implementation with:
 * - HTTP security headers (CSP, HSTS, etc.)
 * - Rate limiting with token buckets
 * - Input validation and sanitization
 * - Threat detection patterns
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

class SecurityHardening {
  constructor(config = {}) {
    this.config = {
      enableCSP: true,
      enableHSTS: true,
      enableRateLimit: true,
      enableSlowDown: true,
      trustProxy: false,
      corsOrigins: ['http://localhost:3000'],
      ...config
    };
    
    this.threatPatterns = this.initializeThreatPatterns();
    this.rateLimiters = new Map();
    this.securityEvents = [];
  }

  /**
   * Initialize comprehensive security middleware stack
   */
  initializeSecurityMiddleware() {
    const middlewares = [];

    // Basic security headers with Helmet
    middlewares.push(this.createHelmetMiddleware());

    // Custom CSP configuration
    if (this.config.enableCSP) {
      middlewares.push(this.createCSPMiddleware());
    }

    // Rate limiting
    if (this.config.enableRateLimit) {
      middlewares.push(this.createRateLimitMiddleware());
    }

    // Slow down middleware for brute force protection
    if (this.config.enableSlowDown) {
      middlewares.push(this.createSlowDownMiddleware());
    }

    // Request validation and threat detection
    middlewares.push(this.createThreatDetectionMiddleware());

    // Security event logging
    middlewares.push(this.createSecurityLoggingMiddleware());

    return middlewares;
  }

  /**
   * Create Helmet middleware with EchoTune-specific configuration
   */
  createHelmetMiddleware() {
    return helmet({
      contentSecurityPolicy: false, // We'll handle CSP separately
      hsts: this.config.enableHSTS ? {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      } : false,
      crossOriginEmbedderPolicy: false, // Allow Spotify embeds
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    });
  }

  /**
   * Create Content Security Policy middleware
   */
  createCSPMiddleware() {
    return (req, res, next) => {
      const nonce = this.generateNonce();
      res.locals.nonce = nonce;

      const cspDirectives = {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          `'nonce-${nonce}'`,
          'https://api.spotify.com',
          'https://sdk.scdn.co',
          'https://open.spotify.com'
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com'
        ],
        imgSrc: [
          "'self'",
          'data:',
          'https://i.scdn.co',
          'https://mosaic.scdn.co',
          'https://lineup-images.scdn.co'
        ],
        connectSrc: [
          "'self'",
          'https://api.spotify.com',
          'https://accounts.spotify.com',
          'wss://dealer.spotify.com',
          'https://api.openai.com',
          'https://generativelanguage.googleapis.com'
        ],
        mediaSrc: [
          "'self'",
          'https://p.scdn.co',
          'https://audio.scdn.co'
        ],
        frameSrc: [
          'https://open.spotify.com',
          'https://accounts.spotify.com'
        ],
        fontSrc: [
          "'self'",
          'https://fonts.gstatic.com'
        ],
        upgradeInsecureRequests: []
      };

      const cspString = Object.entries(cspDirectives)
        .map(([directive, sources]) => 
          `${directive.replace(/([A-Z])/g, '-$1').toLowerCase()} ${sources.join(' ')}`
        )
        .join('; ');

      res.setHeader('Content-Security-Policy', cspString);
      next();
    };
  }

  /**
   * Create adaptive rate limiting middleware
   */
  createRateLimitMiddleware() {
    // General API rate limiter
    const generalLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        this.logSecurityEvent('rate_limit_exceeded', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.path
        });
        res.status(429).json({
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
        });
      }
    });

    // Strict rate limiter for auth endpoints
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5, // Very strict for auth endpoints
      skipSuccessfulRequests: true,
      message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: '15 minutes'
      }
    });

    // Spotify API rate limiter (respects Spotify's limits)
    const spotifyLimiter = rateLimit({
      windowMs: 30 * 1000, // 30 seconds
      max: 20, // Spotify allows ~100 requests per minute
      message: {
        error: 'Spotify API rate limit exceeded, please slow down.',
        retryAfter: '30 seconds'
      }
    });

    return (req, res, next) => {
      // Apply different rate limits based on route
      if (req.path.startsWith('/auth/') || req.path.startsWith('/login')) {
        return authLimiter(req, res, next);
      } else if (req.path.startsWith('/api/spotify/')) {
        return spotifyLimiter(req, res, next);
      } else {
        return generalLimiter(req, res, next);
      }
    };
  }

  /**
   * Create slow down middleware for brute force protection
   */
  createSlowDownMiddleware() {
    return slowDown({
      windowMs: 15 * 60 * 1000, // 15 minutes
      delayAfter: 10, // Allow 10 requests per windowMs without delay
      delayMs: 500, // Add 500ms delay per request after delayAfter
      maxDelayMs: 20000, // Maximum delay of 20 seconds
      onLimitReached: (req, res, options) => {
        this.logSecurityEvent('slow_down_triggered', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.path,
          delay: options.delay
        });
      }
    });
  }

  /**
   * Create threat detection middleware
   */
  createThreatDetectionMiddleware() {
    return (req, res, next) => {
      const threats = this.detectThreats(req);
      
      if (threats.length > 0) {
        this.logSecurityEvent('threat_detected', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.path,
          threats: threats,
          headers: this.sanitizeHeaders(req.headers)
        });

        // Block high-severity threats
        const highSeverityThreats = threats.filter(t => t.severity === 'high');
        if (highSeverityThreats.length > 0) {
          return res.status(403).json({
            error: 'Request blocked due to security policy',
            reference: this.generateSecurityReference()
          });
        }
      }

      next();
    };
  }

  /**
   * Create security event logging middleware
   */
  createSecurityLoggingMiddleware() {
    return (req, res, next) => {
      // Log security-relevant request info
      const originalSend = res.send;
      res.send = function(data) {
        // Log failed authentication attempts
        if (res.statusCode === 401 || res.statusCode === 403) {
          this.logSecurityEvent('access_denied', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            endpoint: req.path,
            statusCode: res.statusCode,
            method: req.method
          });
        }

        originalSend.call(this, data);
      }.bind(this);

      next();
    };
  }

  /**
   * Initialize threat detection patterns
   */
  initializeThreatPatterns() {
    return [
      {
        name: 'sql_injection',
        pattern: /('|(\\')|(;|%3B)|(--)|(%2D%2D)|(\*|%2A)|(\?|%3F)|(\||%7C)|(&|%26))/i,
        severity: 'high',
        description: 'Potential SQL injection attempt'
      },
      {
        name: 'xss_attempt',
        pattern: /(<script|javascript:|onload=|onerror=|eval\(|alert\()/i,
        severity: 'high',
        description: 'Potential XSS attempt'
      },
      {
        name: 'path_traversal',
        pattern: /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\\)/i,
        severity: 'high',
        description: 'Potential path traversal attempt'
      },
      {
        name: 'command_injection',
        pattern: /(\||%7C|&|%26|;|%3B|`|%60|\$\(|\${)/i,
        severity: 'medium',
        description: 'Potential command injection attempt'
      },
      {
        name: 'suspicious_user_agent',
        pattern: /(curl|wget|python|perl|ruby|scanner|bot|crawler)/i,
        severity: 'low',
        description: 'Suspicious user agent detected'
      }
    ];
  }

  /**
   * Detect threats in incoming requests
   */
  detectThreats(req) {
    const threats = [];
    const checkableFields = [
      req.url,
      req.query ? JSON.stringify(req.query) : '',
      req.body ? JSON.stringify(req.body) : '',
      req.get('User-Agent') || ''
    ].join(' ');

    for (const pattern of this.threatPatterns) {
      if (pattern.pattern.test(checkableFields)) {
        threats.push({
          type: pattern.name,
          severity: pattern.severity,
          description: pattern.description,
          field: this.identifyThreatField(req, pattern.pattern)
        });
      }
    }

    return threats;
  }

  /**
   * Identify which field contains the threat
   */
  identifyThreatField(req, pattern) {
    if (pattern.test(req.url)) return 'url';
    if (req.query && pattern.test(JSON.stringify(req.query))) return 'query';
    if (req.body && pattern.test(JSON.stringify(req.body))) return 'body';
    if (pattern.test(req.get('User-Agent') || '')) return 'user_agent';
    return 'unknown';
  }

  /**
   * Log security events for monitoring
   */
  logSecurityEvent(eventType, details) {
    const event = {
      timestamp: new Date().toISOString(),
      type: eventType,
      severity: this.getEventSeverity(eventType),
      details: details,
      id: this.generateSecurityReference()
    };

    this.securityEvents.push(event);

    // Log to console (in production, send to SIEM)
    console.warn(`🚨 Security Event [${event.id}]: ${eventType}`, details);

    // Keep only recent events to prevent memory issues
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-500);
    }
  }

  /**
   * Get event severity based on type
   */
  getEventSeverity(eventType) {
    const severityMap = {
      'threat_detected': 'high',
      'rate_limit_exceeded': 'medium',
      'access_denied': 'medium',
      'slow_down_triggered': 'low'
    };
    return severityMap[eventType] || 'medium';
  }

  /**
   * Generate security reference ID for tracking
   */
  generateSecurityReference() {
    return `SEC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate cryptographic nonce for CSP
   */
  generateNonce() {
    const crypto = require('crypto');
    return crypto.randomBytes(16).toString('base64');
  }

  /**
   * Sanitize headers for logging (remove sensitive data)
   */
  sanitizeHeaders(headers) {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    
    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = '***REDACTED***';
      }
    }
    
    return sanitized;
  }

  /**
   * Get security metrics for monitoring
   */
  getSecurityMetrics() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const recentEvents = this.securityEvents.filter(
      event => now - new Date(event.timestamp).getTime() < oneHour
    );

    const eventsByType = recentEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {});

    const eventsBySeverity = recentEvents.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {});

    return {
      totalEvents: recentEvents.length,
      eventsByType,
      eventsBySeverity,
      timeWindow: '1 hour',
      lastEvent: this.securityEvents[this.securityEvents.length - 1]?.timestamp
    };
  }

  /**
   * Health check for security systems
   */
  getSecurityHealth() {
    const metrics = this.getSecurityMetrics();
    const health = {
      status: 'healthy',
      checks: {
        csp: this.config.enableCSP ? 'enabled' : 'disabled',
        hsts: this.config.enableHSTS ? 'enabled' : 'disabled',
        rateLimit: this.config.enableRateLimit ? 'enabled' : 'disabled',
        threatDetection: 'active',
        patterns: this.threatPatterns.length
      },
      metrics: metrics
    };

    // Mark as unhealthy if too many high-severity events
    if (metrics.eventsBySeverity.high > 10) {
      health.status = 'warning';
      health.reason = 'High number of security events detected';
    }

    return health;
  }
}

module.exports = SecurityHardening;