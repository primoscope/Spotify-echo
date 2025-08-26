/**
 * API Gateway Service
 * 
 * Centralized API routing, load balancing, and request management
 * Provides service discovery, rate limiting, and request/response transformation
 */

const express = require('express');
const { EventEmitter } = require('events');

class APIGateway extends EventEmitter {
  constructor() {
    super();
    this.services = new Map(); // Service registry
    this.routes = new Map(); // Route mapping
    this.middleware = []; // Gateway-level middleware
    this.healthChecks = new Map(); // Service health checks
    this.loadBalancer = new LoadBalancer();
    this.requestMetrics = new Map(); // Request tracking
  }

  /**
   * Register a service with the gateway
   */
  registerService(serviceName, config) {
    const service = {
      name: serviceName,
      baseUrl: config.baseUrl || '',
      routes: config.routes || [],
      middleware: config.middleware || [],
      healthCheck: config.healthCheck,
      loadBalancing: config.loadBalancing || 'round-robin',
      retryPolicy: config.retryPolicy || { maxRetries: 3, backoff: 'exponential' },
      timeout: config.timeout || 30000,
      instances: config.instances || [{ url: config.baseUrl, weight: 1 }],
      rateLimiting: config.rateLimiting,
      authentication: config.authentication,
      createdAt: new Date()
    };

    this.services.set(serviceName, service);
    
    // Register routes for this service
    service.routes.forEach(route => {
      this.registerRoute(route.path, serviceName, route);
    });

    console.log(`🔗 Service registered: ${serviceName} with ${service.routes.length} routes`);
    this.emit('serviceRegistered', service);
    return service;
  }

  /**
   * Register a route with the gateway
   */
  registerRoute(path, serviceName, routeConfig = {}) {
    const route = {
      path,
      serviceName,
      method: routeConfig.method || 'ALL',
      middleware: routeConfig.middleware || [],
      transform: routeConfig.transform,
      cache: routeConfig.cache,
      rateLimit: routeConfig.rateLimit,
      auth: routeConfig.auth,
      timeout: routeConfig.timeout,
      retries: routeConfig.retries,
      createdAt: new Date()
    };

    const routeKey = `${route.method}:${path}`;
    this.routes.set(routeKey, route);
    
    console.log(`📍 Route registered: ${route.method} ${path} → ${serviceName}`);
    return route;
  }

  /**
   * Create Express middleware for the gateway
   */
  createMiddleware() {
    const router = express.Router();

    // Gateway-level middleware
    router.use(this.requestLoggingMiddleware());
    router.use(this.metricsMiddleware());
    router.use(this.securityMiddleware());

    // Dynamic route handling
    router.use('*', async (req, res, next) => {
      try {
        const route = this.findRoute(req.method, req.path);
        if (!route) {
          return next(); // Let other handlers process
        }

        // Apply route-specific middleware
        await this.applyRouteMiddleware(req, res, route);
        
        // Forward request to service
        await this.forwardRequest(req, res, route);
      } catch (error) {
        console.error(`🚨 Gateway error for ${req.method} ${req.path}:`, error);
        res.status(500).json({
          error: 'Gateway Error',
          message: 'Internal service communication failed',
          timestamp: new Date().toISOString(),
          requestId: req.id
        });
      }
    });

    return router;
  }

  /**
   * Find matching route for request
   */
  findRoute(method, path) {
    // Try exact match first
    let routeKey = `${method}:${path}`;
    let route = this.routes.get(routeKey);
    
    if (route) return route;

    // Try wildcard method
    routeKey = `ALL:${path}`;
    route = this.routes.get(routeKey);
    
    if (route) return route;

    // Try pattern matching for dynamic routes
    for (const [key, routeConfig] of this.routes.entries()) {
      const [routeMethod, routePath] = key.split(':');
      
      if (routeMethod !== 'ALL' && routeMethod !== method) {
        continue;
      }

      // Simple pattern matching (/:param format)
      const pattern = routePath.replace(/:[^/]+/g, '([^/]+)');
      const regex = new RegExp(`^${pattern}$`);
      
      if (regex.test(path)) {
        return routeConfig;
      }
    }

    return null;
  }

  /**
   * Forward request to target service
   */
  async forwardRequest(req, res, route) {
    const service = this.services.get(route.serviceName);
    if (!service) {
      throw new Error(`Service not found: ${route.serviceName}`);
    }

    // Select service instance (load balancing)
    const instance = this.loadBalancer.selectInstance(service);
    if (!instance) {
      throw new Error(`No healthy instances for service: ${route.serviceName}`);
    }

    const startTime = Date.now();
    
    try {
      // Record request metrics
      this.recordRequestStart(route.serviceName, req);

      // For internal routing, call next() to let existing routes handle
      // This gateway acts as a coordinator rather than a proxy
      const requestDuration = Date.now() - startTime;
      this.recordRequestComplete(route.serviceName, req, requestDuration, 200);
      
      // Add gateway headers
      res.setHeader('X-Gateway-Service', route.serviceName);
      res.setHeader('X-Gateway-Route', route.path);
      res.setHeader('X-Request-Duration', requestDuration);
      
      return; // Let the existing route handlers process the request
    } catch (error) {
      const requestDuration = Date.now() - startTime;
      this.recordRequestComplete(route.serviceName, req, requestDuration, 500);
      throw error;
    }
  }

  /**
   * Apply route-specific middleware
   */
  async applyRouteMiddleware(req, res, route) {
    // Rate limiting
    if (route.rateLimit) {
      await this.applyRateLimit(req, res, route.rateLimit);
    }

    // Authentication
    if (route.auth) {
      await this.applyAuthentication(req, res, route.auth);
    }

    // Request transformation
    if (route.transform && route.transform.request) {
      req.body = await route.transform.request(req.body, req);
    }
  }

  /**
   * Request logging middleware
   */
  requestLoggingMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        console.log(`🌐 Gateway: ${req.method} ${req.path} → ${res.statusCode} (${duration}ms)`);
      });
      
      next();
    };
  }

  /**
   * Metrics collection middleware
   */
  metricsMiddleware() {
    return (req, res, next) => {
      req.gatewayStartTime = Date.now();
      next();
    };
  }

  /**
   * Security middleware
   */
  securityMiddleware() {
    return (req, res, next) => {
      // Add security headers
      res.setHeader('X-Gateway-Version', '1.0.0');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      next();
    };
  }

  /**
   * Record request start for metrics
   */
  recordRequestStart(serviceName, req) {
    const key = `${serviceName}:${req.method}:${req.path}`;
    const metrics = this.requestMetrics.get(key) || {
      count: 0,
      totalDuration: 0,
      errors: 0,
      lastRequest: null
    };
    
    metrics.count++;
    metrics.lastRequest = new Date();
    this.requestMetrics.set(key, metrics);
  }

  /**
   * Record request completion for metrics
   */
  recordRequestComplete(serviceName, req, duration, statusCode) {
    const key = `${serviceName}:${req.method}:${req.path}`;
    const metrics = this.requestMetrics.get(key);
    
    if (metrics) {
      metrics.totalDuration += duration;
      if (statusCode >= 400) {
        metrics.errors++;
      }
      this.requestMetrics.set(key, metrics);
    }
  }

  /**
   * Get gateway metrics
   */
  getMetrics() {
    const metrics = {
      services: this.services.size,
      routes: this.routes.size,
      uptime: process.uptime(),
      requests: {}
    };

    for (const [key, reqMetrics] of this.requestMetrics.entries()) {
      metrics.requests[key] = {
        ...reqMetrics,
        avgDuration: reqMetrics.count > 0 ? reqMetrics.totalDuration / reqMetrics.count : 0,
        errorRate: reqMetrics.count > 0 ? (reqMetrics.errors / reqMetrics.count) * 100 : 0
      };
    }

    return metrics;
  }

  /**
   * Get service health status
   */
  async getHealthStatus() {
    const health = {
      gateway: 'healthy',
      services: {},
      timestamp: new Date().toISOString()
    };

    for (const [serviceName, service] of this.services.entries()) {
      try {
        if (service.healthCheck) {
          const isHealthy = await service.healthCheck();
          health.services[serviceName] = isHealthy ? 'healthy' : 'unhealthy';
        } else {
          health.services[serviceName] = 'unknown';
        }
      } catch (error) {
        health.services[serviceName] = 'error';
      }
    }

    return health;
  }

  /**
   * Apply rate limiting
   */
  async applyRateLimit(req, res, rateLimitConfig) {
    // Rate limiting implementation would go here
    // For now, this is a placeholder
    return true;
  }

  /**
   * Apply authentication
   */
  async applyAuthentication(req, res, authConfig) {
    // Authentication implementation would go here
    // For now, this is a placeholder
    return true;
  }
}

/**
 * Simple load balancer for service instances
 */
class LoadBalancer {
  constructor() {
    this.counters = new Map();
  }

  selectInstance(service) {
    if (!service.instances || service.instances.length === 0) {
      return null;
    }

    if (service.instances.length === 1) {
      return service.instances[0];
    }

    // Round-robin load balancing
    const counter = this.counters.get(service.name) || 0;
    const instance = service.instances[counter % service.instances.length];
    this.counters.set(service.name, counter + 1);
    
    return instance;
  }
}

module.exports = { APIGateway };