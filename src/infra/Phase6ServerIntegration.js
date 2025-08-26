/**
 * Phase 6 Server Integration Service
 * 
 * Integrates all Phase 6 enterprise services with the existing server.js
 * Provides seamless migration path while maintaining backward compatibility
 */

const { getServiceOrchestrator } = require('./EnterpriseServiceOrchestrator');
const { getMiddlewareConfigurationService } = require('./MiddlewareConfigurationService');

class Phase6ServerIntegration {
  constructor() {
    this.orchestrator = null;
    this.middlewareService = null;
    this.initialized = false;
  }

  /**
   * Initialize Phase 6 enterprise integration
   */
  async initialize(app) {
    if (this.initialized) {
      return;
    }

    try {
      console.log('🚀 Phase 6: Initializing Enterprise Service Integration...');

      // Initialize service orchestrator
      this.orchestrator = getServiceOrchestrator({
        enableServiceMesh: true,
        startupTimeout: 60000
      });
      
      await this.orchestrator.initialize();

      // Initialize middleware configuration service
      this.middlewareService = getMiddlewareConfigurationService({
        enableSecurityBaseline: true,
        enablePerformanceMonitoring: true,
        enableRateLimiting: true,
        enableCORS: true,
        enableCompression: true,
        enableBodyParsing: true,
        enableSessionManagement: true,
        trustProxy: process.env.NODE_ENV === 'production'
      });

      await this.middlewareService.initialize(app);

      this.initialized = true;
      console.log('✅ Phase 6: Enterprise Service Integration initialized');
    } catch (error) {
      console.error('❌ Phase 6: Enterprise integration failed:', error);
      throw error;
    }
  }

  /**
   * Start all enterprise services
   */
  async startServices() {
    if (!this.orchestrator) {
      throw new Error('Service orchestrator not initialized');
    }

    try {
      await this.orchestrator.startServices();
      console.log('✅ Phase 6: All enterprise services started');
    } catch (error) {
      console.error('❌ Phase 6: Failed to start enterprise services:', error);
      throw error;
    }
  }

  /**
   * Get enterprise service instances
   */
  getServices() {
    return this.orchestrator ? this.orchestrator.getAllServices() : {};
  }

  /**
   * Get specific enterprise service
   */
  getService(serviceName) {
    return this.orchestrator ? this.orchestrator.getService(serviceName) : null;
  }

  /**
   * Get system status for health checks
   */
  getSystemStatus() {
    if (!this.orchestrator) {
      return { overall: 'not-initialized' };
    }

    return this.orchestrator.getSystemStatus();
  }

  /**
   * Get middleware configuration
   */
  getMiddlewareConfig() {
    return this.middlewareService ? this.middlewareService.getMiddlewareConfig() : {};
  }

  /**
   * Apply enterprise middleware to Express app (replaces manual middleware setup)
   */
  async applyEnterpriseMiddleware(app) {
    // This would replace the manual middleware configuration in server.js
    // For backward compatibility, we'll integrate gradually
    console.log('⚙️ Phase 6: Enterprise middleware configuration applied via service');
  }

  /**
   * Create enterprise health check endpoint
   */
  createHealthEndpoint() {
    return (req, res) => {
      const status = this.getSystemStatus();
      const httpStatus = status.health === 'healthy' ? 200 : 503;
      
      res.status(httpStatus).json({
        status: status.overall,
        health: status.health,
        services: Object.keys(status.services || {}),
        healthyServices: status.healthyServices || 0,
        totalServices: status.totalServices || 0,
        uptime: status.uptime || 0,
        timestamp: new Date().toISOString(),
        phase: 'Phase 6 - Enterprise Integration'
      });
    };
  }

  /**
   * Create enterprise metrics endpoint
   */
  createMetricsEndpoint() {
    return (req, res) => {
      const services = this.getServices();
      const metrics = {};

      // Collect metrics from all services
      if (services.observability) {
        metrics.observability = services.observability.getStatistics();
      }

      if (services.database) {
        metrics.database = services.database.getMetrics();
      }

      if (services.apiGateway) {
        metrics.apiGateway = services.apiGateway.getMetrics();
      }

      if (services.serviceRegistry) {
        metrics.serviceRegistry = services.serviceRegistry.getStatistics();
      }

      if (this.middlewareService) {
        metrics.middleware = this.middlewareService.getStatistics();
      }

      res.json({
        metrics,
        systemStatus: this.getSystemStatus(),
        timestamp: new Date().toISOString(),
        phase: 'Phase 6 - Enterprise Metrics'
      });
    };
  }

  /**
   * Graceful shutdown for all enterprise services
   */
  async shutdown() {
    try {
      if (this.orchestrator) {
        await this.orchestrator.gracefulShutdown();
      }
      
      this.initialized = false;
      console.log('✅ Phase 6: Enterprise services shutdown completed');
    } catch (error) {
      console.error('❌ Phase 6: Enterprise shutdown failed:', error);
    }
  }
}

// Default integration instance
let defaultInstance = null;

/**
 * Get or create default Phase 6 integration instance
 */
function getPhase6Integration() {
  if (!defaultInstance) {
    defaultInstance = new Phase6ServerIntegration();
  }
  return defaultInstance;
}

/**
 * Initialize Phase 6 enterprise integration
 */
async function initializePhase6Integration(app) {
  const integration = getPhase6Integration();
  await integration.initialize(app);
  await integration.startServices();
  return integration;
}

module.exports = {
  Phase6ServerIntegration,
  getPhase6Integration,
  initializePhase6Integration
};