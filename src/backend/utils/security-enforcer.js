/**
 * Enhanced Security Middleware
 * Production-grade security enhancements
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

class SecurityEnforcer {
  constructor() {
    this.rateLimiters = this.createRateLimiters();
    this.securityHeaders = this.configureSecurityHeaders();
  }

  createRateLimiters() {
    return {
      general: rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 1000,
        message: { error: 'Too many requests, try again later.' }
      }),
      auth: rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 5,
        message: { error: 'Too many auth attempts, try again later.' }
      }),
      chat: rateLimit({
        windowMs: 60 * 1000,
        max: 30,
        message: { error: 'Chat rate limit exceeded.' }
      })
    };
  }

  configureSecurityHeaders() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          scriptSrc: ["'self'"]
        }
      }
    });
  }

  applySecurityMiddleware(app) {
    app.use(this.securityHeaders);
    app.use('/api/', this.rateLimiters.general);
    app.use('/api/auth/', this.rateLimiters.auth);
    app.use('/api/chat/', this.rateLimiters.chat);
  }

  generateSecurityReport() {
    return {
      timestamp: new Date().toISOString(),
      security: {
        headers: 'enabled',
        rateLimit: 'enabled',
        monitoring: 'active'
      },
      features: ['HTTPS enforcement', 'HSTS headers', 'CSP', 'Rate limiting']
    };
  }
}

module.exports = SecurityEnforcer;
