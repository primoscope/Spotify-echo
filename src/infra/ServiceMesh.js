/**
 * Service Mesh Communication Layer
 * 
 * Provides advanced inter-service communication with service discovery,
 * load balancing, security policies, and traffic management
 */

const { EventEmitter } = require('events');
const { v4: uuidv4 } = require('uuid');
const { createBreaker } = require('./resilience/breaker');

class ServiceMesh extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      enableSecurityPolicies: options.enableSecurityPolicies !== false,
      enableTrafficManagement: options.enableTrafficManagement !== false,
      enableMutualTLS: options.enableMutualTLS !== false,
      defaultTimeout: options.defaultTimeout || 30000,
      enableRetries: options.enableRetries !== false,
      enableCircuitBreaker: options.enableCircuitBreaker !== false,
      enableLoadBalancing: options.enableLoadBalancing !== false,
      enableTracing: options.enableTracing !== false,
      meshId: options.meshId || 'echotune-mesh',
      ...options
    };

    // Service registry and policies
    this.services = new Map(); // Service instances
    this.securityPolicies = new Map(); // Security policies per service
    this.trafficPolicies = new Map(); // Traffic management policies
    this.loadBalancers = new Map(); // Load balancer instances
    this.circuitBreakers = new Map(); // Circuit breakers per service
    
    // Metrics and monitoring
    this.metrics = {
      requestsTotal: 0,
      requestsSuccessful: 0,
      requestsFailed: 0,
      averageLatency: 0,
      circuitBreakerTrips: 0,
      securityViolations: 0
    };
    
    this.activeConnections = new Map(); // Track active connections
    this.requestTraces = new Map(); // Request tracing
    
    console.log(`🕸️ Service Mesh initialized: ${this.config.meshId}`);
  }

  /**
   * Register a service with the mesh
   */
  registerService(serviceName, config) {
    const service = {
      name: serviceName,
      instances: config.instances || [],
      version: config.version || '1.0.0',
      protocol: config.protocol || 'http',
      healthCheck: config.healthCheck,
      metadata: config.metadata || {},
      registeredAt: new Date().toISOString(),
      lastHealthCheck: null,
      status: 'unknown'
    };

    this.services.set(serviceName, service);
    
    // Create load balancer for service
    if (this.config.enableLoadBalancing) {
      this.loadBalancers.set(serviceName, new ServiceLoadBalancer(service.instances));
    }
    
    // Create circuit breaker for service
    if (this.config.enableCircuitBreaker) {
      this.circuitBreakers.set(serviceName, createBreaker(`mesh-${serviceName}`, {
        failureThreshold: 5,
        resetTimeoutMs: 30000
      }));
    }
    
    console.log(`🔗 Service registered in mesh: ${serviceName} with ${service.instances.length} instances`);
    this.emit('serviceRegistered', service);
    
    return service;
  }

  /**
   * Apply security policy to a service
   */
  applySecurityPolicy(serviceName, policy) {
    const securityPolicy = {
      id: uuidv4(),
      serviceName,
      allowedClients: policy.allowedClients || [],
      deniedClients: policy.deniedClients || [],
      requireMutualTLS: policy.requireMutualTLS !== false,
      allowedMethods: policy.allowedMethods || ['GET', 'POST', 'PUT', 'DELETE'],
      rateLimit: policy.rateLimit,
      authentication: policy.authentication || 'required',
      authorization: policy.authorization || {},
      createdAt: new Date().toISOString()
    };

    this.securityPolicies.set(serviceName, securityPolicy);
    console.log(`🔒 Security policy applied to ${serviceName}`);
    
    return securityPolicy.id;
  }

  /**
   * Apply traffic management policy
   */
  applyTrafficPolicy(serviceName, policy) {
    const trafficPolicy = {
      id: uuidv4(),
      serviceName,
      loadBalancing: policy.loadBalancing || 'round-robin',
      timeout: policy.timeout || this.config.defaultTimeout,
      retries: policy.retries || 3,
      circuitBreaker: policy.circuitBreaker !== false,
      canaryDeployment: policy.canaryDeployment,
      rateLimiting: policy.rateLimiting,
      trafficSplitting: policy.trafficSplitting,
      createdAt: new Date().toISOString()
    };

    this.trafficPolicies.set(serviceName, trafficPolicy);
    console.log(`🚦 Traffic policy applied to ${serviceName}`);
    
    return trafficPolicy.id;
  }

  /**
   * Make a service-to-service call through the mesh
   */
  async callService(targetService, method, path, options = {}) {
    const requestId = uuidv4();
    const startTime = Date.now();
    
    try {
      // Create request context
      const context = {
        requestId,
        sourceService: options.sourceService || 'unknown',
        targetService,
        method,
        path,
        startTime,
        headers: options.headers || {},
        data: options.data,
        timeout: options.timeout || this.config.defaultTimeout
      };

      // Apply security policies
      await this.enforceSecurityPolicy(context);
      
      // Apply traffic management
      const response = await this.executeWithTrafficManagement(context);
      
      // Record metrics
      this.recordSuccessMetrics(requestId, Date.now() - startTime);
      
      return response;
      
    } catch (error) {
      this.recordFailureMetrics(requestId, Date.now() - startTime, error);
      throw error;
    }
  }

  /**
   * Enforce security policies
   */
  async enforceSecurityPolicy(context) {
    if (!this.config.enableSecurityPolicies) {
      return;
    }

    const policy = this.securityPolicies.get(context.targetService);
    if (!policy) {
      return; // No policy defined
    }

    // Check allowed clients
    if (policy.allowedClients.length > 0 && 
        !policy.allowedClients.includes(context.sourceService)) {
      this.metrics.securityViolations++;
      throw new Error(`Access denied: ${context.sourceService} not in allowed clients for ${context.targetService}`);
    }

    // Check denied clients
    if (policy.deniedClients.includes(context.sourceService)) {
      this.metrics.securityViolations++;
      throw new Error(`Access denied: ${context.sourceService} is denied access to ${context.targetService}`);
    }

    // Check allowed methods
    if (!policy.allowedMethods.includes(context.method.toUpperCase())) {
      this.metrics.securityViolations++;
      throw new Error(`Method not allowed: ${context.method} for ${context.targetService}`);
    }

    // Apply rate limiting if configured
    if (policy.rateLimit) {
      await this.applyRateLimit(context, policy.rateLimit);
    }

    console.log(`✅ Security policy enforced for ${context.requestId}`);
  }

  /**
   * Execute request with traffic management
   */
  async executeWithTrafficManagement(context) {
    const service = this.services.get(context.targetService);
    if (!service) {
      throw new Error(`Service not found in mesh: ${context.targetService}`);
    }

    const trafficPolicy = this.trafficPolicies.get(context.targetService);
    const timeout = trafficPolicy?.timeout || context.timeout;

    // Get target instance through load balancer
    const targetInstance = this.selectServiceInstance(context.targetService);
    if (!targetInstance) {
      throw new Error(`No healthy instances available for ${context.targetService}`);
    }

    // Apply circuit breaker if enabled
    if (this.config.enableCircuitBreaker) {
      const breaker = this.circuitBreakers.get(context.targetService);
      if (breaker) {
        return await breaker(async () => {
          return await this.executeRequest(targetInstance, context, timeout);
        });
      }
    }

    return await this.executeRequest(targetInstance, context, timeout);
  }

  /**
   * Select service instance using load balancing
   */
  selectServiceInstance(serviceName) {
    if (!this.config.enableLoadBalancing) {
      const service = this.services.get(serviceName);
      return service?.instances[0];
    }

    const loadBalancer = this.loadBalancers.get(serviceName);
    return loadBalancer?.getNextInstance();
  }

  /**
   * Execute the actual request
   */
  async executeRequest(instance, context, timeout) {
    // This is a simplified implementation
    // In a real service mesh, this would make actual HTTP/gRPC calls
    console.log(`🔄 Executing request ${context.requestId} to ${instance.url}${context.path}`);
    
    // Simulate request execution
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Request timeout: ${context.requestId}`));
      }, timeout);

      // Simulate async processing
      setTimeout(() => {
        clearTimeout(timer);
        resolve({
          status: 200,
          data: { message: 'Success', requestId: context.requestId },
          headers: { 'x-mesh-processed': 'true' }
        });
      }, Math.random() * 100); // Random delay up to 100ms
    });
  }

  /**
   * Apply rate limiting
   */
  async applyRateLimit(context, rateLimitConfig) {
    // Simplified rate limiting implementation
    const key = `${context.sourceService}:${context.targetService}`;
    const now = Date.now();
    const windowMs = rateLimitConfig.windowMs || 60000; // 1 minute default
    const maxRequests = rateLimitConfig.maxRequests || 100;

    // In a real implementation, this would use Redis or similar
    if (!this.rateLimitStore) {
      this.rateLimitStore = new Map();
    }

    const entry = this.rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs };
    
    if (now > entry.resetTime) {
      entry.count = 1;
      entry.resetTime = now + windowMs;
    } else {
      entry.count++;
    }

    this.rateLimitStore.set(key, entry);

    if (entry.count > maxRequests) {
      throw new Error(`Rate limit exceeded for ${key}: ${entry.count}/${maxRequests}`);
    }
  }

  /**
   * Record success metrics
   */
  recordSuccessMetrics(requestId, latency) {
    this.metrics.requestsTotal++;
    this.metrics.requestsSuccessful++;
    this.metrics.averageLatency = 
      (this.metrics.averageLatency * (this.metrics.requestsSuccessful - 1) + latency) / 
      this.metrics.requestsSuccessful;
  }

  /**
   * Record failure metrics
   */
  recordFailureMetrics(requestId, latency, error) {
    this.metrics.requestsTotal++;
    this.metrics.requestsFailed++;
    
    if (error.circuitBreakerOpen) {
      this.metrics.circuitBreakerTrips++;
    }
  }

  /**
   * Get mesh topology
   */
  getTopology() {
    return {
      meshId: this.config.meshId,
      services: Array.from(this.services.entries()).map(([name, service]) => ({
        name,
        instances: service.instances.length,
        version: service.version,
        status: service.status,
        hasSecurityPolicy: this.securityPolicies.has(name),
        hasTrafficPolicy: this.trafficPolicies.has(name),
        hasLoadBalancer: this.loadBalancers.has(name),
        hasCircuitBreaker: this.circuitBreakers.has(name)
      })),
      totalConnections: this.activeConnections.size,
      metrics: this.metrics
    };
  }

  /**
   * Health check for the service mesh
   */
  async healthCheck() {
    const unhealthyServices = [];
    
    for (const [serviceName, service] of this.services.entries()) {
      if (service.healthCheck) {
        try {
          const isHealthy = await service.healthCheck();
          service.status = isHealthy ? 'healthy' : 'unhealthy';
          service.lastHealthCheck = new Date().toISOString();
          
          if (!isHealthy) {
            unhealthyServices.push(serviceName);
          }
        } catch (error) {
          service.status = 'error';
          service.lastHealthCheck = new Date().toISOString();
          unhealthyServices.push(serviceName);
        }
      }
    }

    return {
      status: unhealthyServices.length === 0 ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      unhealthyServices,
      topology: this.getTopology()
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('🛑 Shutting down Service Mesh...');
    
    // Close all active connections
    for (const connection of this.activeConnections.values()) {
      try {
        await connection.close();
      } catch (error) {
        console.error('Error closing connection:', error);
      }
    }
    
    this.removeAllListeners();
    console.log('✅ Service Mesh shutdown complete');
  }
}

/**
 * Simple load balancer implementation
 */
class ServiceLoadBalancer {
  constructor(instances) {
    this.instances = instances || [];
    this.currentIndex = 0;
    this.algorithm = 'round-robin';
  }

  getNextInstance() {
    if (this.instances.length === 0) {
      return null;
    }

    const instance = this.instances[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.instances.length;
    return instance;
  }

  updateInstances(instances) {
    this.instances = instances;
    this.currentIndex = 0;
  }
}

// Singleton instance
let serviceMeshInstance = null;

/**
 * Get or create Service Mesh instance
 */
function getServiceMesh(options = {}) {
  if (!serviceMeshInstance) {
    serviceMeshInstance = new ServiceMesh(options);
  }
  return serviceMeshInstance;
}

module.exports = {
  ServiceMesh,
  ServiceLoadBalancer,
  getServiceMesh
};