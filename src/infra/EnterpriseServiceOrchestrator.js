/**
 * Enterprise Service Orchestrator
 * 
 * Central orchestration layer for managing all enterprise services
 * Provides service lifecycle, coordination, and inter-service communication
 */

const { EventEmitter } = require('events');
const { APIGateway } = require('./APIGateway');
const { ServiceRegistry } = require('./ServiceRegistry');
const { ConfigurationManager } = require('./ConfigurationManager');
const { DatabaseService } = require('../services/DatabaseService');
const { ObservabilityService } = require('../services/ObservabilityService');

class EnterpriseServiceOrchestrator extends EventEmitter {
  constructor(options = {}) {
    super();
    this.services = new Map(); // Registered enterprise services
    this.serviceInstances = new Map(); // Service instances
    this.dependencies = new Map(); // Service dependencies
    this.startupOrder = []; // Service startup order
    this.shutdownOrder = []; // Service shutdown order
    this.config = {
      startupTimeout: options.startupTimeout || 60000, // 1 minute
      shutdownTimeout: options.shutdownTimeout || 30000, // 30 seconds
      healthCheckInterval: options.healthCheckInterval || 30000, // 30 seconds
      retryAttempts: options.retryAttempts || 3,
      enableServiceMesh: options.enableServiceMesh !== false
    };
    this.state = 'stopped'; // stopped, starting, running, stopping
    this.healthCheckTimer = null;
    this.initialized = false;
  }

  /**
   * Initialize the service orchestrator
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      console.log('🎛️ Initializing Enterprise Service Orchestrator...');
      
      // Register core enterprise services
      await this.registerCoreServices();
      
      // Calculate startup order based on dependencies
      this.calculateStartupOrder();
      
      this.initialized = true;
      console.log('🎛️ Enterprise Service Orchestrator initialized');
      this.emit('initialized');
    } catch (error) {
      console.error('❌ Enterprise Service Orchestrator initialization failed:', error);
      throw error;
    }
  }

  /**
   * Register core enterprise services
   */
  async registerCoreServices() {
    // Configuration Manager (no dependencies)
    this.registerService('configuration', {
      factory: () => new ConfigurationManager(),
      dependencies: [],
      priority: 1,
      healthCheck: (instance) => instance.initialized,
      essential: true
    });

    // Observability Service (depends on configuration)
    this.registerService('observability', {
      factory: (deps) => new ObservabilityService(deps.configuration?.get('observability')),
      dependencies: ['configuration'],
      priority: 2,
      healthCheck: (instance) => instance.initialized,
      essential: true
    });

    // Service Registry (depends on configuration and observability)
    this.registerService('serviceRegistry', {
      factory: (deps) => new ServiceRegistry(deps.configuration?.get('serviceRegistry')),
      dependencies: ['configuration', 'observability'],
      priority: 3,
      healthCheck: (instance) => instance.services.size >= 0,
      essential: true
    });

    // Database Service (depends on configuration and observability)
    this.registerService('database', {
      factory: (deps) => new DatabaseService(deps.configuration?.get('database')),
      dependencies: ['configuration', 'observability'],
      priority: 4,
      healthCheck: (instance) => instance.initialized,
      essential: true
    });

    // API Gateway (depends on service registry and observability)
    this.registerService('apiGateway', {
      factory: (deps) => new APIGateway(deps.configuration?.get('apiGateway')),
      dependencies: ['serviceRegistry', 'observability', 'configuration'],
      priority: 5,
      healthCheck: (instance) => instance.services.size >= 0,
      essential: false
    });

    console.log('🎛️ Core enterprise services registered');
  }

  /**
   * Register a service with the orchestrator
   */
  registerService(name, serviceConfig) {
    if (this.services.has(name)) {
      throw new Error(`Service ${name} is already registered`);
    }

    const service = {
      name,
      factory: serviceConfig.factory,
      dependencies: serviceConfig.dependencies || [],
      priority: serviceConfig.priority || 10,
      healthCheck: serviceConfig.healthCheck,
      essential: serviceConfig.essential || false,
      retryPolicy: serviceConfig.retryPolicy || { maxRetries: this.config.retryAttempts },
      timeout: serviceConfig.timeout || this.config.startupTimeout,
      instance: null,
      state: 'registered', // registered, starting, running, stopping, stopped, error
      registeredAt: new Date(),
      startedAt: null,
      lastHealthCheck: null,
      healthCheckFailures: 0
    };

    this.services.set(name, service);
    this.dependencies.set(name, serviceConfig.dependencies || []);
    
    console.log(`🎛️ Service registered: ${name} (priority: ${service.priority})`);
    this.emit('serviceRegistered', service);
    
    return service;
  }

  /**
   * Calculate service startup order based on dependencies
   */
  calculateStartupOrder() {
    const visited = new Set();
    const tempMark = new Set();
    const order = [];

    const visit = (serviceName) => {
      if (tempMark.has(serviceName)) {
        throw new Error(`Circular dependency detected involving service: ${serviceName}`);
      }
      
      if (visited.has(serviceName)) {
        return;
      }

      tempMark.add(serviceName);
      
      const dependencies = this.dependencies.get(serviceName) || [];
      for (const dep of dependencies) {
        if (!this.services.has(dep)) {
          throw new Error(`Service ${serviceName} depends on unregistered service: ${dep}`);
        }
        visit(dep);
      }
      
      tempMark.delete(serviceName);
      visited.add(serviceName);
      order.push(serviceName);
    };

    // Visit all services
    for (const serviceName of this.services.keys()) {
      if (!visited.has(serviceName)) {
        visit(serviceName);
      }
    }

    // Sort by priority within dependency order
    this.startupOrder = order.sort((a, b) => {
      const serviceA = this.services.get(a);
      const serviceB = this.services.get(b);
      return serviceA.priority - serviceB.priority;
    });

    // Shutdown order is reverse of startup order
    this.shutdownOrder = [...this.startupOrder].reverse();

    console.log(`🎛️ Service startup order calculated: ${this.startupOrder.join(' → ')}`);
  }

  /**
   * Start all services
   */
  async startServices() {
    if (this.state !== 'stopped') {
      throw new Error(`Cannot start services from state: ${this.state}`);
    }

    this.state = 'starting';
    console.log('🎛️ Starting enterprise services...');

    try {
      // Start services in dependency order
      for (const serviceName of this.startupOrder) {
        await this.startService(serviceName);
      }

      // Start health monitoring
      this.startHealthMonitoring();

      this.state = 'running';
      console.log('✅ All enterprise services started successfully');
      this.emit('servicesStarted');
    } catch (error) {
      this.state = 'error';
      console.error('❌ Service startup failed:', error);
      
      // Attempt to stop any services that were started
      await this.stopServices();
      throw error;
    }
  }

  /**
   * Start a specific service
   */
  async startService(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service not found: ${serviceName}`);
    }

    if (service.state === 'running') {
      return service.instance;
    }

    console.log(`🎛️ Starting service: ${serviceName}`);
    service.state = 'starting';

    try {
      // Collect dependencies
      const dependencies = {};
      for (const depName of service.dependencies) {
        const depService = this.services.get(depName);
        if (!depService || depService.state !== 'running') {
          throw new Error(`Dependency ${depName} is not running for service ${serviceName}`);
        }
        dependencies[depName] = depService.instance;
      }

      // Create service instance
      const instance = await this.executeWithTimeout(
        () => service.factory(dependencies),
        service.timeout,
        `Service ${serviceName} startup timeout`
      );

      // Initialize service if it has an initialize method
      if (instance && typeof instance.initialize === 'function') {
        await this.executeWithTimeout(
          () => instance.initialize(),
          service.timeout,
          `Service ${serviceName} initialization timeout`
        );
      }

      service.instance = instance;
      service.state = 'running';
      service.startedAt = new Date();
      service.healthCheckFailures = 0;

      this.serviceInstances.set(serviceName, instance);
      
      console.log(`✅ Service started: ${serviceName}`);
      this.emit('serviceStarted', service);
      
      return instance;
    } catch (error) {
      service.state = 'error';
      console.error(`❌ Failed to start service ${serviceName}:`, error);
      this.emit('serviceStartError', { service, error });
      throw error;
    }
  }

  /**
   * Stop all services
   */
  async stopServices() {
    if (this.state === 'stopped') {
      return;
    }

    this.state = 'stopping';
    console.log('🎛️ Stopping enterprise services...');

    // Stop health monitoring
    this.stopHealthMonitoring();

    try {
      // Stop services in reverse dependency order
      for (const serviceName of this.shutdownOrder) {
        await this.stopService(serviceName);
      }

      this.state = 'stopped';
      console.log('✅ All enterprise services stopped');
      this.emit('servicesStopped');
    } catch (error) {
      console.error('❌ Service shutdown failed:', error);
      this.emit('servicesStopError', error);
    }
  }

  /**
   * Stop a specific service
   */
  async stopService(serviceName) {
    const service = this.services.get(serviceName);
    if (!service || service.state === 'stopped') {
      return;
    }

    console.log(`🎛️ Stopping service: ${serviceName}`);
    service.state = 'stopping';

    try {
      const instance = service.instance;
      
      // Call shutdown method if available
      if (instance && typeof instance.shutdown === 'function') {
        await this.executeWithTimeout(
          () => instance.shutdown(),
          this.config.shutdownTimeout,
          `Service ${serviceName} shutdown timeout`
        );
      } else if (instance && typeof instance.close === 'function') {
        await this.executeWithTimeout(
          () => instance.close(),
          this.config.shutdownTimeout,
          `Service ${serviceName} close timeout`
        );
      }

      service.instance = null;
      service.state = 'stopped';
      this.serviceInstances.delete(serviceName);
      
      console.log(`✅ Service stopped: ${serviceName}`);
      this.emit('serviceStopped', service);
    } catch (error) {
      console.error(`⚠️ Error stopping service ${serviceName}:`, error.message);
      service.state = 'error';
    }
  }

  /**
   * Get service instance
   */
  getService(serviceName) {
    return this.serviceInstances.get(serviceName);
  }

  /**
   * Get all service instances
   */
  getAllServices() {
    return Object.fromEntries(this.serviceInstances);
  }

  /**
   * Get service status
   */
  getServiceStatus(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) {
      return null;
    }

    return {
      name: serviceName,
      state: service.state,
      dependencies: service.dependencies,
      essential: service.essential,
      startedAt: service.startedAt,
      lastHealthCheck: service.lastHealthCheck,
      healthCheckFailures: service.healthCheckFailures
    };
  }

  /**
   * Get overall system status
   */
  getSystemStatus() {
    const services = {};
    let healthyCount = 0;
    let totalCount = 0;

    for (const [name, service] of this.services.entries()) {
      services[name] = this.getServiceStatus(name);
      totalCount++;
      
      if (service.state === 'running' && service.healthCheckFailures === 0) {
        healthyCount++;
      }
    }

    return {
      overall: this.state,
      health: healthyCount === totalCount ? 'healthy' : 'degraded',
      services,
      healthyServices: healthyCount,
      totalServices: totalCount,
      uptime: this.state === 'running' ? process.uptime() : 0
    };
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

    console.log('🎛️ Health monitoring started');
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
      console.log('🎛️ Health monitoring stopped');
    }
  }

  /**
   * Perform health checks on all running services
   */
  async performHealthChecks() {
    for (const [serviceName, service] of this.services.entries()) {
      if (service.state === 'running' && service.healthCheck) {
        await this.performServiceHealthCheck(serviceName, service);
      }
    }
  }

  /**
   * Perform health check on specific service
   */
  async performServiceHealthCheck(serviceName, service) {
    try {
      const isHealthy = await service.healthCheck(service.instance);
      
      if (isHealthy) {
        service.healthCheckFailures = 0;
        service.lastHealthCheck = new Date();
      } else {
        service.healthCheckFailures++;
        console.warn(`⚠️ Health check failed for service ${serviceName} (failures: ${service.healthCheckFailures})`);
        
        if (service.healthCheckFailures >= 3 && service.essential) {
          console.error(`🚨 Essential service ${serviceName} is unhealthy, considering restart`);
          this.emit('serviceUnhealthy', { serviceName, service });
        }
      }
    } catch (error) {
      service.healthCheckFailures++;
      console.error(`❌ Health check error for service ${serviceName}:`, error.message);
    }
  }

  /**
   * Execute function with timeout
   */
  async executeWithTimeout(fn, timeout, errorMessage) {
    return new Promise(async (resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(errorMessage));
      }, timeout);

      try {
        const result = await fn();
        clearTimeout(timer);
        resolve(result);
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });
  }

  /**
   * Graceful shutdown
   */
  async gracefulShutdown() {
    console.log('🎛️ Initiating graceful shutdown...');
    
    try {
      await this.stopServices();
      console.log('✅ Graceful shutdown completed');
    } catch (error) {
      console.error('❌ Graceful shutdown failed:', error);
      process.exit(1);
    }
  }
}

// Default orchestrator instance
let defaultInstance = null;

/**
 * Get or create default service orchestrator instance
 */
function getServiceOrchestrator(options) {
  if (!defaultInstance) {
    defaultInstance = new EnterpriseServiceOrchestrator(options);
  }
  return defaultInstance;
}

/**
 * Initialize and start default service orchestrator
 */
async function initializeServiceOrchestrator(options) {
  const orchestrator = getServiceOrchestrator(options);
  await orchestrator.initialize();
  await orchestrator.startServices();
  return orchestrator;
}

module.exports = {
  EnterpriseServiceOrchestrator,
  getServiceOrchestrator,
  initializeServiceOrchestrator
};