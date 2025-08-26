/**
 * Service Registry
 * 
 * Centralized service discovery and management system
 * Provides service registration, health monitoring, and discovery capabilities
 */

const { EventEmitter } = require('events');

class ServiceRegistry extends EventEmitter {
  constructor() {
    super();
    this.services = new Map(); // Registered services
    this.dependencies = new Map(); // Service dependencies
    this.healthChecks = new Map(); // Health check functions
    this.metrics = new Map(); // Service metrics
    this.config = {
      healthCheckInterval: 30000, // 30 seconds
      unhealthyThreshold: 3, // Mark unhealthy after 3 failed checks
      maxServiceInstances: 10
    };
    this.healthCheckTimer = null;
    this.startHealthMonitoring();
  }

  /**
   * Register a service with the registry
   */
  registerService(serviceName, serviceConfig) {
    const service = {
      name: serviceName,
      version: serviceConfig.version || '1.0.0',
      type: serviceConfig.type || 'http', // http, grpc, tcp, etc.
      endpoints: serviceConfig.endpoints || [],
      instances: serviceConfig.instances || [],
      dependencies: serviceConfig.dependencies || [],
      metadata: serviceConfig.metadata || {},
      healthCheck: serviceConfig.healthCheck,
      status: 'initializing',
      registeredAt: new Date(),
      lastHealthCheck: null,
      healthCheckFailures: 0,
      config: serviceConfig
    };

    this.services.set(serviceName, service);
    
    // Register dependencies
    if (service.dependencies.length > 0) {
      this.dependencies.set(serviceName, service.dependencies);
    }

    // Register health check
    if (service.healthCheck) {
      this.healthChecks.set(serviceName, service.healthCheck);
    }

    // Initialize metrics
    this.metrics.set(serviceName, {
      requestCount: 0,
      errorCount: 0,
      avgResponseTime: 0,
      uptime: 0,
      lastRequest: null,
      totalRequests: 0
    });

    console.log(`📋 Service registered: ${serviceName} v${service.version}`);
    this.emit('serviceRegistered', service);
    
    // Mark as healthy initially
    this.updateServiceStatus(serviceName, 'healthy');
    
    return service;
  }

  /**
   * Unregister a service
   */
  unregisterService(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) {
      return false;
    }

    this.services.delete(serviceName);
    this.dependencies.delete(serviceName);
    this.healthChecks.delete(serviceName);
    this.metrics.delete(serviceName);

    console.log(`📋 Service unregistered: ${serviceName}`);
    this.emit('serviceUnregistered', service);
    
    return true;
  }

  /**
   * Discover services by criteria
   */
  discoverServices(criteria = {}) {
    const services = [];
    
    for (const [name, service] of this.services.entries()) {
      let matches = true;

      // Filter by type
      if (criteria.type && service.type !== criteria.type) {
        matches = false;
      }

      // Filter by status
      if (criteria.status && service.status !== criteria.status) {
        matches = false;
      }

      // Filter by tag
      if (criteria.tag && !service.metadata.tags?.includes(criteria.tag)) {
        matches = false;
      }

      // Filter by dependency
      if (criteria.dependsOn && !service.dependencies.includes(criteria.dependsOn)) {
        matches = false;
      }

      if (matches) {
        services.push({
          name,
          ...service,
          instances: this.getHealthyInstances(name)
        });
      }
    }

    return services;
  }

  /**
   * Get service by name
   */
  getService(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) {
      return null;
    }

    return {
      ...service,
      instances: this.getHealthyInstances(serviceName),
      metrics: this.metrics.get(serviceName)
    };
  }

  /**
   * Get healthy instances of a service
   */
  getHealthyInstances(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) {
      return [];
    }

    return service.instances.filter(instance => 
      instance.status === 'healthy' || instance.status === undefined
    );
  }

  /**
   * Add service instance
   */
  addServiceInstance(serviceName, instance) {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service not found: ${serviceName}`);
    }

    if (service.instances.length >= this.config.maxServiceInstances) {
      throw new Error(`Maximum instances reached for service: ${serviceName}`);
    }

    const newInstance = {
      id: instance.id || `${serviceName}-${Date.now()}`,
      url: instance.url,
      weight: instance.weight || 1,
      metadata: instance.metadata || {},
      status: 'healthy',
      addedAt: new Date(),
      ...instance
    };

    service.instances.push(newInstance);
    
    console.log(`📋 Instance added to ${serviceName}: ${newInstance.id}`);
    this.emit('instanceAdded', serviceName, newInstance);
    
    return newInstance;
  }

  /**
   * Remove service instance
   */
  removeServiceInstance(serviceName, instanceId) {
    const service = this.services.get(serviceName);
    if (!service) {
      return false;
    }

    const index = service.instances.findIndex(instance => instance.id === instanceId);
    if (index === -1) {
      return false;
    }

    const removedInstance = service.instances.splice(index, 1)[0];
    
    console.log(`📋 Instance removed from ${serviceName}: ${instanceId}`);
    this.emit('instanceRemoved', serviceName, removedInstance);
    
    return true;
  }

  /**
   * Update service status
   */
  updateServiceStatus(serviceName, status) {
    const service = this.services.get(serviceName);
    if (!service) {
      return false;
    }

    const oldStatus = service.status;
    service.status = status;
    service.lastHealthCheck = new Date();

    if (oldStatus !== status) {
      console.log(`📋 Service status changed: ${serviceName} ${oldStatus} → ${status}`);
      this.emit('statusChanged', serviceName, status, oldStatus);
    }

    return true;
  }

  /**
   * Record service metrics
   */
  recordMetrics(serviceName, metrics) {
    const serviceMetrics = this.metrics.get(serviceName);
    if (!serviceMetrics) {
      return false;
    }

    // Update metrics
    if (metrics.requestCount) {
      serviceMetrics.requestCount += metrics.requestCount;
      serviceMetrics.totalRequests += metrics.requestCount;
    }

    if (metrics.errorCount) {
      serviceMetrics.errorCount += metrics.errorCount;
    }

    if (metrics.responseTime) {
      // Calculate rolling average
      const totalTime = serviceMetrics.avgResponseTime * (serviceMetrics.totalRequests - (metrics.requestCount || 1));
      serviceMetrics.avgResponseTime = (totalTime + metrics.responseTime) / serviceMetrics.totalRequests;
    }

    serviceMetrics.lastRequest = new Date();
    this.metrics.set(serviceName, serviceMetrics);

    return true;
  }

  /**
   * Get dependency graph
   */
  getDependencyGraph() {
    const graph = {
      nodes: [],
      edges: []
    };

    // Add nodes (services)
    for (const [name, service] of this.services.entries()) {
      graph.nodes.push({
        id: name,
        label: name,
        version: service.version,
        status: service.status,
        type: service.type
      });
    }

    // Add edges (dependencies)
    for (const [serviceName, deps] of this.dependencies.entries()) {
      deps.forEach(dep => {
        graph.edges.push({
          from: serviceName,
          to: dep,
          label: 'depends on'
        });
      });
    }

    return graph;
  }

  /**
   * Check for circular dependencies
   */
  checkCircularDependencies() {
    const visited = new Set();
    const recStack = new Set();
    const circular = [];

    const dfs = (serviceName, path = []) => {
      if (recStack.has(serviceName)) {
        const cycleStart = path.indexOf(serviceName);
        circular.push([...path.slice(cycleStart), serviceName]);
        return;
      }

      if (visited.has(serviceName)) {
        return;
      }

      visited.add(serviceName);
      recStack.add(serviceName);

      const deps = this.dependencies.get(serviceName) || [];
      deps.forEach(dep => {
        dfs(dep, [...path, serviceName]);
      });

      recStack.delete(serviceName);
    };

    for (const serviceName of this.services.keys()) {
      if (!visited.has(serviceName)) {
        dfs(serviceName);
      }
    }

    return circular;
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    if (this.healthCheckTimer) {
      return;
    }

    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthChecks();
    }, this.config.healthCheckInterval);

    console.log(`📋 Health monitoring started (interval: ${this.config.healthCheckInterval}ms)`);
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
      console.log('📋 Health monitoring stopped');
    }
  }

  /**
   * Perform health checks for all services
   */
  async performHealthChecks() {
    const healthChecks = [];

    for (const [serviceName, healthCheck] of this.healthChecks.entries()) {
      healthChecks.push(this.performHealthCheck(serviceName, healthCheck));
    }

    await Promise.allSettled(healthChecks);
  }

  /**
   * Perform health check for a specific service
   */
  async performHealthCheck(serviceName, healthCheck) {
    try {
      const isHealthy = await healthCheck();
      const service = this.services.get(serviceName);
      
      if (isHealthy) {
        service.healthCheckFailures = 0;
        this.updateServiceStatus(serviceName, 'healthy');
      } else {
        service.healthCheckFailures++;
        if (service.healthCheckFailures >= this.config.unhealthyThreshold) {
          this.updateServiceStatus(serviceName, 'unhealthy');
        }
      }
    } catch (error) {
      const service = this.services.get(serviceName);
      service.healthCheckFailures++;
      
      if (service.healthCheckFailures >= this.config.unhealthyThreshold) {
        this.updateServiceStatus(serviceName, 'unhealthy');
      }
      
      console.warn(`📋 Health check failed for ${serviceName}:`, error.message);
    }
  }

  /**
   * Get registry statistics
   */
  getStatistics() {
    const stats = {
      totalServices: this.services.size,
      healthyServices: 0,
      unhealthyServices: 0,
      totalInstances: 0,
      healthyInstances: 0,
      totalDependencies: 0,
      circularDependencies: this.checkCircularDependencies().length,
      uptime: process.uptime(),
      lastHealthCheck: new Date()
    };

    for (const service of this.services.values()) {
      if (service.status === 'healthy') {
        stats.healthyServices++;
      } else if (service.status === 'unhealthy') {
        stats.unhealthyServices++;
      }

      stats.totalInstances += service.instances.length;
      stats.healthyInstances += service.instances.filter(i => i.status === 'healthy').length;
      stats.totalDependencies += service.dependencies.length;
    }

    return stats;
  }

  /**
   * Export registry configuration
   */
  exportConfig() {
    const config = {
      services: {},
      dependencies: Object.fromEntries(this.dependencies),
      timestamp: new Date().toISOString()
    };

    for (const [name, service] of this.services.entries()) {
      config.services[name] = {
        version: service.version,
        type: service.type,
        endpoints: service.endpoints,
        instances: service.instances,
        dependencies: service.dependencies,
        metadata: service.metadata
      };
    }

    return config;
  }

  /**
   * Import registry configuration
   */
  importConfig(config) {
    // Clear existing services
    this.services.clear();
    this.dependencies.clear();
    this.healthChecks.clear();
    this.metrics.clear();

    // Import services
    for (const [name, serviceConfig] of Object.entries(config.services)) {
      this.registerService(name, serviceConfig);
    }

    console.log(`📋 Imported ${Object.keys(config.services).length} services from configuration`);
    this.emit('configImported', config);
  }
}

module.exports = { ServiceRegistry };