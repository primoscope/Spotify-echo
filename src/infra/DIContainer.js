/**
 * Dependency Injection Container for EchoTune AI
 * Manages service lifecycle and dependency resolution
 */
class DIContainer {
  constructor() {
    this.services = new Map();
    this.singletons = new Map();
    this.initializing = new Set();
  }

  /**
   * Register a service factory function
   * @param {string} name - Service name
   * @param {Function} factory - Factory function that creates the service
   * @param {Object} options - Configuration options
   * @param {boolean} options.singleton - Whether service should be singleton (default: true)
   * @param {Array<string>} options.dependencies - Array of dependency names
   */
  register(name, factory, options = {}) {
    const config = {
      singleton: options.singleton !== false,
      dependencies: options.dependencies || [],
      factory,
      ...options
    };

    this.services.set(name, config);
    return this;
  }

  /**
   * Register a singleton service instance
   * @param {string} name - Service name
   * @param {*} instance - Service instance
   */
  registerInstance(name, instance) {
    this.singletons.set(name, instance);
    return this;
  }

  /**
   * Get a service instance
   * @param {string} name - Service name
   * @returns {*} Service instance
   */
  async get(name) {
    // Check if already instantiated as singleton
    if (this.singletons.has(name)) {
      return this.singletons.get(name);
    }

    // Check if service is registered
    if (!this.services.has(name)) {
      throw new Error(`Service '${name}' is not registered`);
    }

    const config = this.services.get(name);

    // Prevent circular dependencies
    if (this.initializing.has(name)) {
      throw new Error(`Circular dependency detected for service '${name}'`);
    }

    this.initializing.add(name);

    try {
      // Resolve dependencies
      const dependencies = await Promise.all(
        config.dependencies.map(dep => this.get(dep))
      );

      // Create service instance
      const instance = await config.factory(...dependencies);

      // Store as singleton if configured
      if (config.singleton) {
        this.singletons.set(name, instance);
      }

      return instance;
    } finally {
      this.initializing.delete(name);
    }
  }

  /**
   * Check if a service is registered
   * @param {string} name - Service name
   * @returns {boolean}
   */
  has(name) {
    return this.services.has(name) || this.singletons.has(name);
  }

  /**
   * Clear all services (useful for testing)
   */
  clear() {
    this.services.clear();
    this.singletons.clear();
    this.initializing.clear();
  }

  /**
   * Get all registered service names
   * @returns {Array<string>}
   */
  getServiceNames() {
    return [...new Set([...this.services.keys(), ...this.singletons.keys()])];
  }

  /**
   * Initialize all registered services
   * Useful for warming up the container at startup
   */
  async initializeAll() {
    const names = this.getServiceNames();
    await Promise.all(names.map(name => this.get(name)));
  }

  /**
   * Create a child container that inherits from this one
   * @returns {DIContainer}
   */
  createChild() {
    const child = new DIContainer();
    
    // Copy services (not instances, to allow different scoping)
    for (const [name, config] of this.services) {
      child.services.set(name, { ...config });
    }
    
    return child;
  }
}

// Global container instance
const globalContainer = new DIContainer();

/**
 * Configure the global DI container with core services
 */
function configureCoreServices() {
  // Configuration Service
  globalContainer.register('config', () => {
    const { getConfigService } = require('../config/ConfigurationService');
    return getConfigService().load();
  });

  // Health Check Service
  globalContainer.register('healthCheck', () => {
    const HealthCheckService = require('../services/HealthCheckService');
    return new HealthCheckService();
  }, { dependencies: ['config'] });

  // Performance Service
  globalContainer.register('performance', () => {
    const PerformanceService = require('../services/PerformanceService');
    return new PerformanceService();
  }, { dependencies: ['config'] });

  // Redis Manager
  globalContainer.register('redis', async () => {
    const { initializeRedis } = require('../utils/redis');
    return await initializeRedis();
  }, { dependencies: ['config'] });

  // Database Manager
  globalContainer.register('database', async (config) => {
    const databaseManager = require('../database/database-manager');
    await databaseManager.initialize();
    return databaseManager;
  }, { dependencies: ['config'] });

  // Security Manager
  globalContainer.register('security', (config) => {
    const SecurityManager = require('../api/security/security-manager');
    return new SecurityManager();
  }, { dependencies: ['config'] });

  // Cache Manager
  globalContainer.register('cache', async (config, redis) => {
    const cacheManager = require('../api/cache/cache-manager');
    await cacheManager.initialize();
    return cacheManager;
  }, { dependencies: ['config', 'redis'] });

  // Performance Monitor
  globalContainer.register('performanceMonitor', () => {
    return require('../api/monitoring/performance-monitor');
  });

  // Logger
  globalContainer.register('logger', () => {
    return require('../api/utils/logger');
  });
}

/**
 * Get the global DI container
 * @returns {DIContainer}
 */
function getContainer() {
  return globalContainer;
}

/**
 * Create a new DI container
 * @returns {DIContainer}
 */
function createContainer() {
  return new DIContainer();
}

module.exports = {
  DIContainer,
  getContainer,
  createContainer,
  configureCoreServices
};