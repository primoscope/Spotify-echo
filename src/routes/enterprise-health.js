/**
 * Enterprise Health Monitoring Routes
 * 
 * Enhanced health check endpoints for Phase 6 enterprise services
 * Provides comprehensive system status, metrics, and diagnostic information
 */

const express = require('express');
const { getPhase6Integration } = require('../infra/Phase6ServerIntegration');

const router = express.Router();

/**
 * Enhanced enterprise health check
 */
router.get('/enterprise', (req, res) => {
  try {
    const integration = getPhase6Integration();
    
    if (!integration.initialized) {
      return res.status(503).json({
        status: 'unavailable',
        message: 'Enterprise services not initialized',
        timestamp: new Date().toISOString(),
        phase: 'Phase 6 - Enterprise'
      });
    }

    const systemStatus = integration.getSystemStatus();
    const services = integration.getServices();
    const middlewareConfig = integration.getMiddlewareConfig();

    const healthData = {
      overall: systemStatus.overall,
      health: systemStatus.health,
      services: {
        total: systemStatus.totalServices,
        healthy: systemStatus.healthyServices,
        details: systemStatus.services
      },
      middleware: {
        total: Object.keys(middlewareConfig).length,
        enabled: Object.values(middlewareConfig).filter(mw => mw.enabled).length,
        security: Object.values(middlewareConfig).filter(mw => 
          mw.description?.includes('security') || 
          mw.description?.includes('Security') ||
          mw.description?.includes('rate')
        ).length
      },
      capabilities: {
        apiGateway: !!services.apiGateway,
        serviceRegistry: !!services.serviceRegistry,
        observability: !!services.observability,
        database: !!services.database,
        configuration: !!services.configuration
      },
      uptime: systemStatus.uptime,
      timestamp: new Date().toISOString(),
      phase: 'Phase 6 - Enterprise Services'
    };

    const httpStatus = systemStatus.health === 'healthy' ? 200 : 503;
    res.status(httpStatus).json(healthData);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Enterprise health check failed',
      error: error.message,
      timestamp: new Date().toISOString(),
      phase: 'Phase 6 - Enterprise'
    });
  }
});

/**
 * Enterprise metrics endpoint
 */
router.get('/enterprise/metrics', (req, res) => {
  try {
    const integration = getPhase6Integration();
    
    if (!integration.initialized) {
      return res.status(503).json({
        status: 'unavailable',
        message: 'Enterprise services not initialized for metrics collection'
      });
    }

    const metricsData = integration.createMetricsEndpoint()(req, res);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Enterprise metrics collection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Service registry status
 */
router.get('/enterprise/services', (req, res) => {
  try {
    const integration = getPhase6Integration();
    const services = integration.getServices();

    const serviceStatus = {};
    
    for (const [name, service] of Object.entries(services)) {
      serviceStatus[name] = {
        available: !!service,
        initialized: service?.initialized,
        type: service?.constructor?.name || 'Unknown',
        status: service?.state || service?.status || 'running'
      };
    }

    res.json({
      services: serviceStatus,
      count: Object.keys(services).length,
      timestamp: new Date().toISOString(),
      phase: 'Phase 6 - Service Registry'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Service registry status failed',
      error: error.message
    });
  }
});

/**
 * Configuration status endpoint
 */
router.get('/enterprise/config', (req, res) => {
  try {
    const integration = getPhase6Integration();
    const services = integration.getServices();
    const middlewareConfig = integration.getMiddlewareConfig();

    const configData = {
      middleware: middlewareConfig,
      services: Object.keys(services),
      environment: process.env.NODE_ENV || 'development',
      features: {
        trustProxy: process.env.NODE_ENV === 'production',
        compression: true,
        security: true,
        rateLimit: true,
        cors: true,
        monitoring: true
      },
      phase: 'Phase 6 - Configuration'
    };

    res.json(configData);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Configuration status failed',
      error: error.message
    });
  }
});

/**
 * Architecture overview endpoint
 */
router.get('/enterprise/architecture', (req, res) => {
  try {
    const integration = getPhase6Integration();
    const systemStatus = integration.getSystemStatus();

    const architectureInfo = {
      transformation: {
        phase: 'Phase 6 - Enterprise Architecture',
        startingLines: 1321, // Original server.js
        currentLines: 650,   // Current server.js
        reduction: '50.8%',
        extracted: {
          lines: 6572,
          files: 24,
          services: 5
        }
      },
      services: {
        core: [
          'Configuration Manager',
          'Service Registry',
          'API Gateway',
          'Database Service',
          'Observability Service'
        ],
        infrastructure: [
          'Dependency Injection Container',
          'Feature Flags System',
          'Middleware Manager',
          'Session Manager',
          'Socket Service'
        ]
      },
      capabilities: {
        serviceOrchestration: true,
        healthMonitoring: true,
        configurationManagement: true,
        middlewareManagement: true,
        observability: true,
        apiGateway: true,
        serviceDiscovery: true,
        dependencyInjection: true
      },
      status: systemStatus,
      timestamp: new Date().toISOString()
    };

    res.json(architectureInfo);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Architecture overview failed',
      error: error.message
    });
  }
});

module.exports = router;