/**
 * Enterprise Middleware Configuration Service
 * 
 * Centralized middleware management with intelligent ordering,
 * conditional application, and enterprise-grade security
 */

const { EventEmitter } = require('events');

class MiddlewareConfigurationService extends EventEmitter {
  constructor(options = {}) {
    super();
    this.middleware = new Map(); // Registered middleware
    this.chains = new Map(); // Middleware chains for different routes
    this.config = {
      enableSecurityBaseline: options.enableSecurityBaseline !== false,
      enablePerformanceMonitoring: options.enablePerformanceMonitoring !== false,
      enableRateLimiting: options.enableRateLimiting !== false,
      enableCORS: options.enableCORS !== false,
      enableCompression: options.enableCompression !== false,
      enableBodyParsing: options.enableBodyParsing !== false,
      enableSessionManagement: options.enableSessionManagement !== false,
      trustProxy: options.trustProxy || false
    };
    this.initialized = false;
    this.app = null;
  }

  /**
   * Initialize middleware configuration service
   */
  async initialize(app) {
    if (this.initialized || !app) {
      return;
    }

    this.app = app;
    
    try {
      // Configure trust proxy settings
      this.configureTrustProxy();
      
      // Register core middleware in proper order
      await this.registerCoreMiddleware();
      
      // Apply middleware chains
      await this.applyMiddlewareChains();

      this.initialized = true;
      console.log('⚙️ Middleware configuration service initialized');
      this.emit('initialized');
    } catch (error) {
      console.error('❌ Middleware configuration failed:', error);
      throw error;
    }
  }

  /**
   * Configure trust proxy settings
   */
  configureTrustProxy() {
    if (this.config.trustProxy || process.env.NODE_ENV === 'production') {
      this.app.set('trust proxy', 1);
      console.log('🔧 Trust proxy enabled for production deployment');
    }
  }

  /**
   * Register core middleware in proper execution order
   */
  async registerCoreMiddleware() {
    // 1. Request ID and Observability (highest priority)
    if (this.config.enablePerformanceMonitoring) {
      this.registerMiddleware('requestId', {
        handler: require('../middleware/requestId'),
        priority: 1,
        global: true,
        description: 'Generate unique request IDs for tracing'
      });

      this.registerMiddleware('metrics', {
        handler: require('../middleware/metrics'),
        priority: 2,
        global: true,
        description: 'Collect request metrics'
      });
    }

    // 2. Security Baseline (critical security headers)
    if (this.config.enableSecurityBaseline) {
      this.registerMiddleware('helmet', {
        handler: this.createHelmetMiddleware(),
        priority: 10,
        global: true,
        description: 'Security headers with Helmet'
      });

      this.registerMiddleware('rateLimiting', {
        handler: this.createRateLimitingMiddleware(),
        priority: 11,
        global: true,
        description: 'Rate limiting protection'
      });
    }

    // 3. CORS Configuration
    if (this.config.enableCORS) {
      this.registerMiddleware('cors', {
        handler: this.createCORSMiddleware(),
        priority: 20,
        global: true,
        description: 'Cross-Origin Resource Sharing'
      });
    }

    // 4. Body Parsing
    if (this.config.enableBodyParsing) {
      this.registerMiddleware('bodyParser', {
        handler: this.createBodyParsingMiddleware(),
        priority: 30,
        global: true,
        description: 'Request body parsing'
      });
    }

    // 5. Session Management
    if (this.config.enableSessionManagement) {
      this.registerMiddleware('session', {
        handler: this.createSessionMiddleware(),
        priority: 40,
        global: true,
        description: 'Session management'
      });
    }

    // 6. Compression
    if (this.config.enableCompression) {
      this.registerMiddleware('compression', {
        handler: this.createCompressionMiddleware(),
        priority: 50,
        global: true,
        description: 'Response compression'
      });
    }

    // 7. Performance Monitoring
    if (this.config.enablePerformanceMonitoring) {
      this.registerMiddleware('performanceMonitor', {
        handler: this.createPerformanceMonitoringMiddleware(),
        priority: 60,
        global: true,
        description: 'Request performance tracking'
      });

      this.registerMiddleware('slowRequestLogger', {
        handler: this.createSlowRequestMiddleware(),
        priority: 61,
        global: true,
        description: 'Slow request logging'
      });
    }

    // 8. Security Validation and Sanitization
    if (this.config.enableSecurityBaseline) {
      this.registerMiddleware('securityValidation', {
        handler: this.createSecurityValidationMiddleware(),
        priority: 70,
        global: true,
        description: 'Input validation and sanitization'
      });

      this.registerMiddleware('suspiciousActivityDetection', {
        handler: this.createSuspiciousActivityMiddleware(),
        priority: 71,
        global: true,
        description: 'Suspicious activity detection'
      });
    }

    console.log(`⚙️ Registered ${this.middleware.size} core middleware components`);
  }

  /**
   * Register middleware component
   */
  registerMiddleware(name, config) {
    const middleware = {
      name,
      handler: config.handler,
      priority: config.priority || 100,
      global: config.global || false,
      routes: config.routes || [],
      methods: config.methods || [],
      conditions: config.conditions || [],
      description: config.description || '',
      enabled: config.enabled !== false,
      registeredAt: new Date()
    };

    this.middleware.set(name, middleware);
    
    console.log(`⚙️ Middleware registered: ${name} (priority: ${middleware.priority})`);
    this.emit('middlewareRegistered', middleware);
    
    return middleware;
  }

  /**
   * Apply middleware chains to Express app
   */
  async applyMiddlewareChains() {
    // Sort middleware by priority
    const sortedMiddleware = Array.from(this.middleware.values())
      .filter(mw => mw.enabled)
      .sort((a, b) => a.priority - b.priority);

    // Apply global middleware first
    for (const middleware of sortedMiddleware) {
      if (middleware.global) {
        await this.applyMiddleware(middleware);
      }
    }

    // Apply route-specific middleware
    for (const middleware of sortedMiddleware) {
      if (!middleware.global && middleware.routes.length > 0) {
        await this.applyRouteSpecificMiddleware(middleware);
      }
    }

    console.log(`⚙️ Applied ${sortedMiddleware.length} middleware components to Express app`);
  }

  /**
   * Apply global middleware
   */
  async applyMiddleware(middleware) {
    try {
      if (typeof middleware.handler === 'function') {
        this.app.use(middleware.handler);
      } else if (Array.isArray(middleware.handler)) {
        middleware.handler.forEach(handler => this.app.use(handler));
      }
      
      console.log(`✅ Applied global middleware: ${middleware.name}`);
    } catch (error) {
      console.error(`❌ Failed to apply middleware ${middleware.name}:`, error);
    }
  }

  /**
   * Apply route-specific middleware
   */
  async applyRouteSpecificMiddleware(middleware) {
    try {
      for (const route of middleware.routes) {
        if (middleware.methods.length > 0) {
          for (const method of middleware.methods) {
            this.app[method.toLowerCase()](route, middleware.handler);
          }
        } else {
          this.app.use(route, middleware.handler);
        }
      }
      
      console.log(`✅ Applied route-specific middleware: ${middleware.name}`);
    } catch (error) {
      console.error(`❌ Failed to apply route-specific middleware ${middleware.name}:`, error);
    }
  }

  /**
   * Create Helmet security middleware
   */
  createHelmetMiddleware() {
    const applyHelmet = require('../security/helmet');
    return (req, res, next) => {
      applyHelmet(this.app);
      next();
    };
  }

  /**
   * Create rate limiting middleware
   */
  createRateLimitingMiddleware() {
    const createRateLimiter = require('../security/rateLimit');
    return createRateLimiter();
  }

  /**
   * Create CORS middleware
   */
  createCORSMiddleware() {
    const cors = require('cors');
    
    return cors({
      origin: process.env.NODE_ENV === 'production' 
        ? [`https://${process.env.DOMAIN || 'primosphere.studio'}`]
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    });
  }

  /**
   * Create body parsing middleware
   */
  createBodyParsingMiddleware() {
    const express = require('express');
    
    return [
      express.json({ 
        limit: '10mb',
        verify: (req, res, buf) => {
          req.rawBody = buf;
        }
      }),
      express.urlencoded({ 
        extended: true, 
        limit: '10mb' 
      })
    ];
  }

  /**
   * Create session middleware
   */
  createSessionMiddleware() {
    return async (req, res, next) => {
      try {
        const { getSessionManager } = require('./SessionManager');
        const sessionManager = await getSessionManager();
        const sessionMiddleware = sessionManager.getExpressMiddleware();
        sessionMiddleware(req, res, next);
      } catch (error) {
        console.warn('⚠️ Session middleware failed:', error.message);
        next();
      }
    };
  }

  /**
   * Create compression middleware
   */
  createCompressionMiddleware() {
    const compression = require('compression');
    
    return compression({
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
      level: 6,
      threshold: 1024,
    });
  }

  /**
   * Create performance monitoring middleware
   */
  createPerformanceMonitoringMiddleware() {
    const performanceMonitor = require('../api/monitoring/performance-monitor');
    return performanceMonitor.requestTracker();
  }

  /**
   * Create slow request logging middleware
   */
  createSlowRequestMiddleware() {
    const { middleware: slowRequestMiddleware } = require('../middleware/slow-request-logger');
    return slowRequestMiddleware;
  }

  /**
   * Create security validation middleware
   */
  createSecurityValidationMiddleware() {
    const SecurityManager = require('../api/security/security-manager');
    const securityManager = new SecurityManager();
    return securityManager.validateAndSanitizeInput();
  }

  /**
   * Create suspicious activity detection middleware
   */
  createSuspiciousActivityMiddleware() {
    const SecurityManager = require('../api/security/security-manager');
    const securityManager = new SecurityManager();
    return securityManager.detectSuspiciousActivity();
  }

  /**
   * Enable middleware component
   */
  enableMiddleware(name) {
    const middleware = this.middleware.get(name);
    if (middleware) {
      middleware.enabled = true;
      console.log(`⚙️ Middleware enabled: ${name}`);
      this.emit('middlewareEnabled', middleware);
    }
  }

  /**
   * Disable middleware component
   */
  disableMiddleware(name) {
    const middleware = this.middleware.get(name);
    if (middleware) {
      middleware.enabled = false;
      console.log(`⚙️ Middleware disabled: ${name}`);
      this.emit('middlewareDisabled', middleware);
    }
  }

  /**
   * Get middleware configuration
   */
  getMiddlewareConfig() {
    const config = {};
    
    for (const [name, middleware] of this.middleware.entries()) {
      config[name] = {
        priority: middleware.priority,
        global: middleware.global,
        enabled: middleware.enabled,
        description: middleware.description,
        routes: middleware.routes,
        methods: middleware.methods
      };
    }

    return config;
  }

  /**
   * Get middleware statistics
   */
  getStatistics() {
    return {
      totalMiddleware: this.middleware.size,
      enabledMiddleware: Array.from(this.middleware.values()).filter(mw => mw.enabled).length,
      globalMiddleware: Array.from(this.middleware.values()).filter(mw => mw.global).length,
      routeSpecificMiddleware: Array.from(this.middleware.values()).filter(mw => !mw.global).length,
      securityMiddleware: Array.from(this.middleware.values()).filter(mw => 
        mw.name.includes('security') || mw.name.includes('helmet') || mw.name.includes('rate')
      ).length,
      initialized: this.initialized
    };
  }

  /**
   * Export middleware configuration
   */
  exportConfiguration() {
    return {
      config: this.config,
      middleware: Object.fromEntries(
        Array.from(this.middleware.entries()).map(([name, mw]) => [
          name,
          {
            priority: mw.priority,
            global: mw.global,
            enabled: mw.enabled,
            description: mw.description,
            routes: mw.routes,
            methods: mw.methods
          }
        ])
      ),
      timestamp: new Date().toISOString()
    };
  }
}

// Default middleware configuration service instance
let defaultInstance = null;

/**
 * Get or create default middleware configuration service instance
 */
function getMiddlewareConfigurationService(options) {
  if (!defaultInstance) {
    defaultInstance = new MiddlewareConfigurationService(options);
  }
  return defaultInstance;
}

/**
 * Initialize default middleware configuration service
 */
async function initializeMiddlewareConfiguration(app, options) {
  const service = getMiddlewareConfigurationService(options);
  await service.initialize(app);
  return service;
}

module.exports = {
  MiddlewareConfigurationService,
  getMiddlewareConfigurationService,
  initializeMiddlewareConfiguration
};