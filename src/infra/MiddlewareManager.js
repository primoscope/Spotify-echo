/**
 * Middleware Organization System for EchoTune AI
 * Centralizes and organizes all middleware with proper ordering and configuration
 */
const { getContainer } = require('./DIContainer');
const { getFeatureFlags } = require('./FeatureFlags');

/**
 * Middleware categories with execution order
 */
const MIDDLEWARE_CATEGORIES = {
  // Pre-processing middleware (runs first)
  PREPROCESSING: 'preprocessing',
  
  // Security middleware
  SECURITY: 'security',
  
  // Request processing
  REQUEST_PROCESSING: 'request_processing',
  
  // Authentication and authorization
  AUTH: 'auth',
  
  // Rate limiting
  RATE_LIMITING: 'rate_limiting',
  
  // Logging and monitoring
  MONITORING: 'monitoring',
  
  // Body parsing
  PARSING: 'parsing',
  
  // Custom application middleware
  APPLICATION: 'application',
  
  // Route-specific middleware
  ROUTING: 'routing',
  
  // Error handling (runs last)
  ERROR_HANDLING: 'error_handling'
};

/**
 * Middleware Manager for organizing and applying middleware
 */
class MiddlewareManager {
  constructor() {
    this.middlewareStack = new Map();
    this.globalMiddleware = [];
    this.routeMiddleware = new Map();
    this.featureFlags = getFeatureFlags();
    
    // Initialize categories
    Object.values(MIDDLEWARE_CATEGORIES).forEach(category => {
      this.middlewareStack.set(category, []);
    });
  }

  /**
   * Register middleware in a specific category
   * @param {string} category - Middleware category
   * @param {string} name - Middleware name
   * @param {Function} middleware - Middleware function
   * @param {Object} options - Configuration options
   */
  register(category, name, middleware, options = {}) {
    if (!this.middlewareStack.has(category)) {
      throw new Error(`Invalid middleware category: ${category}`);
    }

    const middlewareConfig = {
      name,
      middleware,
      priority: options.priority || 0,
      enabled: options.enabled !== false,
      featureFlag: options.featureFlag,
      condition: options.condition,
      routes: options.routes || [],
      ...options
    };

    this.middlewareStack.get(category).push(middlewareConfig);
    
    // Sort by priority (higher priority runs first)
    this.middlewareStack.get(category).sort((a, b) => b.priority - a.priority);
  }

  /**
   * Register route-specific middleware
   * @param {string} route - Route pattern
   * @param {Function} middleware - Middleware function
   * @param {Object} options - Configuration options
   */
  registerRouteMiddleware(route, middleware, options = {}) {
    if (!this.routeMiddleware.has(route)) {
      this.routeMiddleware.set(route, []);
    }

    this.routeMiddleware.get(route).push({
      middleware,
      ...options
    });
  }

  /**
   * Apply all middleware to an Express app
   * @param {Object} app - Express app instance
   */
  async applyMiddleware(app) {
    const container = getContainer();

    // Apply middleware in category order
    for (const category of Object.values(MIDDLEWARE_CATEGORIES)) {
      const middlewareList = this.middlewareStack.get(category);
      
      for (const config of middlewareList) {
        if (await this._shouldApplyMiddleware(config)) {
          try {
            console.log(`📎 Applying ${category} middleware: ${config.name}`);
            
            // If it's a factory function, resolve it
            let middleware = config.middleware;
            if (typeof middleware === 'function' && middleware.length === 0) {
              // Likely a factory function
              middleware = await middleware();
            }
            
            // Apply specific routes or globally
            if (config.routes.length > 0) {
              config.routes.forEach(route => {
                app.use(route, middleware);
              });
            } else {
              app.use(middleware);
            }
          } catch (error) {
            console.error(`❌ Failed to apply middleware ${config.name}:`, error);
            
            // Don't fail the entire app for optional middleware
            if (!config.optional) {
              throw error;
            }
          }
        }
      }
    }

    // Apply route-specific middleware
    for (const [route, middlewareList] of this.routeMiddleware) {
      middlewareList.forEach(({ middleware, ...options }) => {
        app.use(route, middleware);
      });
    }
  }

  /**
   * Check if middleware should be applied based on conditions
   * @private
   */
  async _shouldApplyMiddleware(config) {
    // Check if middleware is enabled
    if (!config.enabled) {
      return false;
    }

    // Check feature flag
    if (config.featureFlag) {
      const isEnabled = await this.featureFlags.isEnabled(config.featureFlag);
      if (!isEnabled) {
        return false;
      }
    }

    // Check custom condition
    if (config.condition && typeof config.condition === 'function') {
      return await config.condition();
    }

    return true;
  }

  /**
   * Get middleware configuration for debugging
   */
  getMiddlewareConfig() {
    const config = {};
    for (const [category, middlewareList] of this.middlewareStack) {
      config[category] = middlewareList.map(m => ({
        name: m.name,
        enabled: m.enabled,
        priority: m.priority,
        featureFlag: m.featureFlag,
        routes: m.routes
      }));
    }
    return config;
  }
}

/**
 * Configure default middleware stack
 */
function configureDefaultMiddleware(middlewareManager) {
  // PREPROCESSING
  middlewareManager.register(MIDDLEWARE_CATEGORIES.PREPROCESSING, 'requestId', () => {
    return require('../middleware/requestId');
  }, { priority: 100 });

  middlewareManager.register(MIDDLEWARE_CATEGORIES.PREPROCESSING, 'metrics', () => {
    return require('../middleware/metrics');
  }, { priority: 90 });

  // SECURITY
  middlewareManager.register(MIDDLEWARE_CATEGORIES.SECURITY, 'helmet', () => {
    const applyHelmet = require('../security/helmet');
    return (req, res, next) => {
      // Apply helmet configuration
      const app = { use: (middleware) => middleware(req, res, next) };
      applyHelmet(app);
    };
  }, { priority: 100 });

  middlewareManager.register(MIDDLEWARE_CATEGORIES.SECURITY, 'securityHeaders', () => {
    const { securityHeaders } = require('../api/middleware');
    return securityHeaders;
  }, { priority: 90 });

  middlewareManager.register(MIDDLEWARE_CATEGORIES.SECURITY, 'trustProxy', () => {
    return (req, res, next) => {
      const { getConfigService } = require('../config/ConfigurationService');
      const config = getConfigService().load();
      if (config.server.trustProxy) {
        req.app.set('trust proxy', 1);
      }
      next();
    };
  }, { priority: 80 });

  // REQUEST_PROCESSING
  middlewareManager.register(MIDDLEWARE_CATEGORIES.REQUEST_PROCESSING, 'compression', () => {
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
  }, { priority: 100 });

  middlewareManager.register(MIDDLEWARE_CATEGORIES.REQUEST_PROCESSING, 'cors', () => {
    const { corsMiddleware } = require('../api/middleware');
    return corsMiddleware;
  }, { priority: 90 });

  // RATE_LIMITING
  middlewareManager.register(MIDDLEWARE_CATEGORIES.RATE_LIMITING, 'globalRateLimit', () => {
    const { rateLimiters } = require('../middleware/redis-rate-limiter');
    return rateLimiters.global;
  }, { priority: 100 });

  // MONITORING
  middlewareManager.register(MIDDLEWARE_CATEGORIES.MONITORING, 'requestLogger', () => {
    const { requestLogger } = require('../api/middleware');
    return requestLogger;
  }, { priority: 100 });

  middlewareManager.register(MIDDLEWARE_CATEGORIES.MONITORING, 'performanceMonitor', async () => {
    const container = getContainer();
    const performanceMonitor = await container.get('performanceMonitor');
    return performanceMonitor.requestTracker();
  }, { priority: 90 });

  middlewareManager.register(MIDDLEWARE_CATEGORIES.MONITORING, 'slowRequestLogger', () => {
    const { middleware: slowRequestMiddleware } = require('../middleware/slow-request-logger');
    return slowRequestMiddleware;
  }, { priority: 80 });

  middlewareManager.register(MIDDLEWARE_CATEGORIES.MONITORING, 'responseTime', () => {
    return (req, res, next) => {
      const start = process.hrtime.bigint();
      res.on('finish', () => {
        const end = process.hrtime.bigint();
        const ms = Number(end - start) / 1e6;
        try {
          res.setHeader('X-Response-Time', `${ms.toFixed(0)}ms`);
        } catch {}
        
        const logger = require('../api/utils/logger');
        logger.info('request', {
          method: req.method,
          path: req.path,
          status: res.statusCode,
          ms: Math.round(ms),
        });
      });
      next();
    };
  }, { priority: 70 });

  // PARSING
  middlewareManager.register(MIDDLEWARE_CATEGORIES.PARSING, 'requestSizeLimit', () => {
    const { requestSizeLimit } = require('../api/middleware');
    return requestSizeLimit;
  }, { priority: 100 });

  middlewareManager.register(MIDDLEWARE_CATEGORIES.PARSING, 'jsonParser', () => {
    const express = require('express');
    const { getConfigService } = require('../config/ConfigurationService');
    const config = getConfigService().load();
    
    return express.json({
      limit: config.server.maxRequestSize,
      verify: (req, res, buf) => {
        req.rawBody = buf;
      },
    });
  }, { priority: 90 });

  middlewareManager.register(MIDDLEWARE_CATEGORIES.PARSING, 'urlencodedParser', () => {
    const express = require('express');
    const { getConfigService } = require('../config/ConfigurationService');
    const config = getConfigService().load();
    
    return express.urlencoded({
      extended: true,
      limit: config.server.maxRequestSize,
    });
  }, { priority: 80 });

  middlewareManager.register(MIDDLEWARE_CATEGORIES.PARSING, 'sanitizeInput', () => {
    const { sanitizeInput } = require('../api/middleware');
    return sanitizeInput;
  }, { priority: 70 });

  // APPLICATION
  middlewareManager.register(MIDDLEWARE_CATEGORIES.APPLICATION, 'ensureDatabase', () => {
    const { ensureDatabase } = require('../api/middleware');
    return ensureDatabase;
  }, { priority: 100 });

  middlewareManager.register(MIDDLEWARE_CATEGORIES.APPLICATION, 'extractUser', () => {
    const { extractUser } = require('../api/middleware');
    return extractUser;
  }, { priority: 90 });

  middlewareManager.register(MIDDLEWARE_CATEGORIES.APPLICATION, 'featureFlags', () => {
    const { featureFlagMiddleware } = require('./FeatureFlags');
    return featureFlagMiddleware();
  }, { priority: 80 });

  // ERROR_HANDLING
  middlewareManager.register(MIDDLEWARE_CATEGORIES.ERROR_HANDLING, 'errorHandler', () => {
    const { errorHandler } = require('../api/middleware');
    return errorHandler;
  }, { priority: 100 });

  middlewareManager.register(MIDDLEWARE_CATEGORIES.ERROR_HANDLING, 'securityErrorHandler', () => {
    return require('../middleware/errorHandler');
  }, { priority: 90 });
}

// Global middleware manager instance
const globalMiddlewareManager = new MiddlewareManager();

/**
 * Get the global middleware manager
 */
function getMiddlewareManager() {
  return globalMiddlewareManager;
}

/**
 * Create a new middleware manager
 */
function createMiddlewareManager() {
  return new MiddlewareManager();
}

module.exports = {
  MiddlewareManager,
  MIDDLEWARE_CATEGORIES,
  getMiddlewareManager,
  createMiddlewareManager,
  configureDefaultMiddleware
};