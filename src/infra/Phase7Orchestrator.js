/**
 * Phase 7 Integration: Event-Driven Architecture & Service Mesh
 * 
 * Integrates Event Bus, Service Mesh, Event Sourcing, and Distributed Transactions
 * into the existing enterprise infrastructure
 */

const { getEventBus } = require('./EventBus');
const { getServiceMesh } = require('./ServiceMesh');
const { getEventStore } = require('./EventStore');
const { getTransactionCoordinator } = require('./DistributedTransactionCoordinator');

class Phase7Orchestrator {
  constructor(options = {}) {
    this.config = {
      enableEventBus: options.enableEventBus !== false,
      enableServiceMesh: options.enableServiceMesh !== false,
      enableEventSourcing: options.enableEventSourcing !== false,
      enableDistributedTransactions: options.enableDistributedTransactions !== false,
      autoRegisterServices: options.autoRegisterServices !== false,
      ...options
    };

    this.components = {
      eventBus: null,
      serviceMesh: null,
      eventStore: null,
      transactionCoordinator: null
    };

    this.initialized = false;
  }

  /**
   * Initialize Phase 7 components
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    console.log('🎯 Initializing Phase 7: Event-Driven Architecture & Service Mesh...');

    try {
      // Initialize Event Bus
      if (this.config.enableEventBus) {
        this.components.eventBus = getEventBus({
          enablePersistence: true,
          enableRetries: true,
          enableMetrics: true,
          enableTracing: true
        });
        console.log('✅ Event Bus initialized');
      }

      // Initialize Service Mesh
      if (this.config.enableServiceMesh) {
        this.components.serviceMesh = getServiceMesh({
          enableSecurityPolicies: true,
          enableTrafficManagement: true,
          enableLoadBalancing: true,
          enableCircuitBreaker: true,
          meshId: 'echotune-mesh-v7'
        });
        console.log('✅ Service Mesh initialized');
      }

      // Initialize Event Store
      if (this.config.enableEventSourcing) {
        this.components.eventStore = getEventStore({
          enableSnapshots: true,
          enableProjections: true,
          enableOptimisticConcurrency: true,
          snapshotFrequency: 100
        });
        console.log('✅ Event Store initialized');
      }

      // Initialize Transaction Coordinator
      if (this.config.enableDistributedTransactions) {
        this.components.transactionCoordinator = getTransactionCoordinator({
          enableSagaPattern: true,
          enable2PC: true,
          enableCompensation: true,
          defaultTimeout: 30000
        });
        console.log('✅ Distributed Transaction Coordinator initialized');
      }

      // Auto-register core services if enabled
      if (this.config.autoRegisterServices) {
        await this.registerCoreServices();
      }

      // Set up inter-component integration
      await this.setupIntegration();

      this.initialized = true;
      console.log('🚀 Phase 7 initialization complete');

    } catch (error) {
      console.error('❌ Phase 7 initialization failed:', error);
      throw error;
    }
  }

  /**
   * Register core services with the service mesh
   */
  async registerCoreServices() {
    if (!this.components.serviceMesh) {
      return;
    }

    const coreServices = [
      {
        name: 'spotify-api',
        instances: [{ url: 'http://localhost:3000', weight: 1 }],
        healthCheck: () => this.pingService('spotify-api'),
        metadata: { type: 'api', domain: 'music' }
      },
      {
        name: 'database-service',
        instances: [{ url: 'internal://database', weight: 1 }],
        healthCheck: () => this.pingService('database'),
        metadata: { type: 'database', domain: 'persistence' }
      },
      {
        name: 'chat-service',
        instances: [{ url: 'http://localhost:3000', weight: 1 }],
        healthCheck: () => this.pingService('chat'),
        metadata: { type: 'ai', domain: 'conversation' }
      },
      {
        name: 'recommendation-engine',
        instances: [{ url: 'internal://ml', weight: 1 }],
        healthCheck: () => this.pingService('ml'),
        metadata: { type: 'ml', domain: 'recommendations' }
      }
    ];

    for (const service of coreServices) {
      this.components.serviceMesh.registerService(service.name, service);
      
      // Apply default security policies
      this.components.serviceMesh.applySecurityPolicy(service.name, {
        allowedClients: ['echotune-frontend', 'echotune-api'],
        requireMutualTLS: false, // Disabled for initial setup
        authentication: 'optional',
        rateLimit: { maxRequests: 1000, windowMs: 60000 }
      });

      // Apply default traffic policies
      this.components.serviceMesh.applyTrafficPolicy(service.name, {
        loadBalancing: 'round-robin',
        timeout: 30000,
        retries: 3,
        circuitBreaker: true
      });
    }

    console.log(`🔗 Registered ${coreServices.length} core services with service mesh`);
  }

  /**
   * Set up integration between components
   */
  async setupIntegration() {
    // Event Bus <-> Event Store integration
    if (this.components.eventBus && this.components.eventStore) {
      this.components.eventBus.on('deadLetter', (event) => {
        // Store dead letter events for audit
        this.components.eventStore.appendToStream(
          `dead-letter:${event.originalEventType}`,
          [{
            type: 'DeadLetterReceived',
            data: event,
            metadata: { source: 'event-bus' }
          }]
        );
      });
    }

    // Service Mesh <-> Event Bus integration
    if (this.components.serviceMesh && this.components.eventBus) {
      this.components.serviceMesh.on('serviceRegistered', (service) => {
        this.components.eventBus.publish('ServiceRegistered', {
          serviceName: service.name,
          instances: service.instances.length,
          timestamp: service.registeredAt
        });
      });
    }

    // Transaction Coordinator <-> Event Store integration
    if (this.components.transactionCoordinator && this.components.eventStore) {
      this.components.transactionCoordinator.on('transactionStarted', (transaction) => {
        this.components.eventStore.appendToStream(
          `transaction:${transaction.id}`,
          [{
            type: 'TransactionStarted',
            data: {
              transactionId: transaction.id,
              type: transaction.type,
              participants: transaction.participants
            }
          }]
        );
      });

      this.components.transactionCoordinator.on('transactionCommitted', (transaction) => {
        this.components.eventStore.appendToStream(
          `transaction:${transaction.id}`,
          [{
            type: 'TransactionCommitted',
            data: {
              transactionId: transaction.id,
              completedAt: new Date().toISOString()
            }
          }]
        );
      });
    }

    console.log('🔗 Inter-component integration configured');
  }

  /**
   * Ping service for health checks
   */
  async pingService(serviceName) {
    // Simplified health check implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(Math.random() > 0.1); // 90% healthy rate
      }, Math.random() * 50);
    });
  }

  /**
   * Publish event through the event bus
   */
  async publishEvent(eventType, data, options = {}) {
    if (!this.components.eventBus) {
      throw new Error('Event Bus not initialized');
    }

    return await this.components.eventBus.publish(eventType, data, options);
  }

  /**
   * Subscribe to events
   */
  subscribeToEvent(eventType, handler, options = {}) {
    if (!this.components.eventBus) {
      throw new Error('Event Bus not initialized');
    }

    return this.components.eventBus.subscribe(eventType, handler, options);
  }

  /**
   * Call service through mesh
   */
  async callService(targetService, method, path, options = {}) {
    if (!this.components.serviceMesh) {
      throw new Error('Service Mesh not initialized');
    }

    return await this.components.serviceMesh.callService(targetService, method, path, options);
  }

  /**
   * Start distributed transaction
   */
  async startTransaction(transactionRequest) {
    if (!this.components.transactionCoordinator) {
      throw new Error('Transaction Coordinator not initialized');
    }

    return await this.components.transactionCoordinator.startTransaction(transactionRequest);
  }

  /**
   * Store events using event sourcing
   */
  async storeEvents(streamId, events, expectedVersion = -1) {
    if (!this.components.eventStore) {
      throw new Error('Event Store not initialized');
    }

    return await this.components.eventStore.appendToStream(streamId, events, expectedVersion);
  }

  /**
   * Get comprehensive health status
   */
  async getHealthStatus() {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      phase: 'Phase 7: Event-Driven Architecture & Service Mesh',
      components: {}
    };

    try {
      if (this.components.eventBus) {
        health.components.eventBus = await this.components.eventBus.healthCheck();
      }

      if (this.components.serviceMesh) {
        health.components.serviceMesh = await this.components.serviceMesh.healthCheck();
      }

      if (this.components.eventStore) {
        health.components.eventStore = await this.components.eventStore.healthCheck();
      }

      if (this.components.transactionCoordinator) {
        health.components.transactionCoordinator = await this.components.transactionCoordinator.healthCheck();
      }

      // Check if any component is unhealthy
      const unhealthyComponents = Object.entries(health.components)
        .filter(([name, status]) => status.status !== 'healthy')
        .map(([name]) => name);

      if (unhealthyComponents.length > 0) {
        health.status = 'degraded';
        health.unhealthyComponents = unhealthyComponents;
      }

    } catch (error) {
      health.status = 'error';
      health.error = error.message;
    }

    return health;
  }

  /**
   * Get metrics from all components
   */
  getMetrics() {
    const metrics = {
      timestamp: new Date().toISOString(),
      components: {}
    };

    if (this.components.eventBus) {
      metrics.components.eventBus = this.components.eventBus.getMetrics();
    }

    if (this.components.serviceMesh) {
      metrics.components.serviceMesh = this.components.serviceMesh.getTopology();
    }

    if (this.components.eventStore) {
      metrics.components.eventStore = this.components.eventStore.getStatistics();
    }

    if (this.components.transactionCoordinator) {
      metrics.components.transactionCoordinator = this.components.transactionCoordinator.getStatistics();
    }

    return metrics;
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('🛑 Shutting down Phase 7 components...');

    const shutdownPromises = [];

    if (this.components.transactionCoordinator) {
      shutdownPromises.push(this.components.transactionCoordinator.shutdown());
    }

    if (this.components.eventStore) {
      shutdownPromises.push(this.components.eventStore.shutdown());
    }

    if (this.components.serviceMesh) {
      shutdownPromises.push(this.components.serviceMesh.shutdown());
    }

    if (this.components.eventBus) {
      shutdownPromises.push(this.components.eventBus.shutdown());
    }

    await Promise.all(shutdownPromises);
    
    this.initialized = false;
    console.log('✅ Phase 7 shutdown complete');
  }
}

// Singleton instance
let phase7Instance = null;

/**
 * Get or create Phase 7 Orchestrator instance
 */
function getPhase7Orchestrator(options = {}) {
  if (!phase7Instance) {
    phase7Instance = new Phase7Orchestrator(options);
  }
  return phase7Instance;
}

module.exports = {
  Phase7Orchestrator,
  getPhase7Orchestrator
};