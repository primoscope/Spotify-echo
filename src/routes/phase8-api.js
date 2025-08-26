/**
 * Phase 8 API Routes - Advanced Security, Auto-Scaling, Multi-Region & ML Integration
 * 
 * Provides comprehensive REST API endpoints for all Phase 8 enterprise services:
 * - Zero-Trust Security (mTLS, policies, threat detection)
 * - Auto-Scaling (dynamic scaling, metrics)
 * - Multi-Region (deployment, failover, replication)
 * - ML Pipelines (training, inference, monitoring)
 * - Orchestration (health, metrics, management)
 */

const express = require('express');
const router = express.Router();

/**
 * Phase 8 Enterprise API Routes
 */

// ================================
// ZERO-TRUST SECURITY ROUTES
// ================================

/**
 * Security Overview and Metrics
 */
router.get('/security/metrics', async (req, res) => {
  try {
    const orchestrator = req.app.locals.phase8Orchestrator;
    if (!orchestrator?.services?.has('security')) {
      return res.status(503).json({ error: 'Security service not available' });
    }
    
    const securityService = orchestrator.services.get('security');
    const metrics = securityService.getSecurityMetrics();
    
    res.json({
      success: true,
      service: 'zero-trust-security',
      timestamp: new Date(),
      metrics
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Register Service Identity for Zero-Trust
 */
router.post('/security/identities', async (req, res) => {
  try {
    const { serviceId, metadata } = req.body;
    
    if (!serviceId) {
      return res.status(400).json({ error: 'serviceId is required' });
    }
    
    const orchestrator = req.app.locals.phase8Orchestrator;
    const securityService = orchestrator.services.get('security');
    
    const identity = await securityService.registerServiceIdentity(serviceId, metadata);
    
    res.status(201).json({
      success: true,
      serviceId,
      identity: {
        serviceId: identity.serviceId,
        registeredAt: identity.registeredAt,
        metadata: identity.metadata,
        certificateCount: identity.certificates.size,
        policiesApplied: identity.policies.size
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Authenticate Service with mTLS
 */
router.post('/security/authenticate', async (req, res) => {
  try {
    const { serviceId, clientCertificate, sourceIP } = req.body;
    
    const orchestrator = req.app.locals.phase8Orchestrator;
    const securityService = orchestrator.services.get('security');
    
    const authResult = await securityService.authenticateService(serviceId, clientCertificate, {
      sourceIP,
      tlsEnabled: true
    });
    
    res.json({
      success: true,
      authentication: authResult
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

/**
 * Create Security Policy
 */
router.post('/security/policies', async (req, res) => {
  try {
    const { policyId, policy } = req.body;
    
    const orchestrator = req.app.locals.phase8Orchestrator;
    const securityService = orchestrator.services.get('security');
    
    const createdPolicy = await securityService.createSecurityPolicy(policyId, policy);
    
    res.status(201).json({
      success: true,
      policy: createdPolicy
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Threat Detection Status
 */
router.get('/security/threats', async (req, res) => {
  try {
    const orchestrator = req.app.locals.phase8Orchestrator;
    const securityService = orchestrator.services.get('security');
    const metrics = securityService.getSecurityMetrics();
    
    res.json({
      success: true,
      threats: {
        active: metrics.overview.activeThreat,
        detected: metrics.metrics.threatsDetected,
        riskLevel: metrics.health.threatLevel
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================================
// AUTO-SCALING ROUTES
// ================================

/**
 * Auto-Scaling Metrics and Status
 */
router.get('/autoscaling/metrics', async (req, res) => {
  try {
    const orchestrator = req.app.locals.phase8Orchestrator;
    if (!orchestrator?.services?.has('autoScaling')) {
      return res.status(503).json({ error: 'Auto-scaling service not available' });
    }
    
    const autoScalingService = orchestrator.services.get('autoScaling');
    const metrics = autoScalingService.getScalingMetrics();
    
    res.json({
      success: true,
      service: 'auto-scaling',
      timestamp: new Date(),
      metrics
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Register Service for Auto-Scaling
 */
router.post('/autoscaling/services', async (req, res) => {
  try {
    const { serviceId, config } = req.body;
    
    if (!serviceId) {
      return res.status(400).json({ error: 'serviceId is required' });
    }
    
    const orchestrator = req.app.locals.phase8Orchestrator;
    const autoScalingService = orchestrator.services.get('autoScaling');
    
    const serviceConfig = await autoScalingService.registerService(serviceId, config);
    
    res.status(201).json({
      success: true,
      serviceId,
      config: {
        name: serviceConfig.name,
        minReplicas: serviceConfig.minReplicas,
        maxReplicas: serviceConfig.maxReplicas,
        targetMetrics: serviceConfig.targetMetrics,
        scalingBehavior: serviceConfig.scalingBehavior
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Trigger Scaling Evaluation
 */
router.post('/autoscaling/evaluate/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params;
    
    const orchestrator = req.app.locals.phase8Orchestrator;
    const autoScalingService = orchestrator.services.get('autoScaling');
    
    const scalingDecision = await autoScalingService.evaluateScaling(serviceId);
    
    res.json({
      success: true,
      serviceId,
      scalingDecision
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Scaling History
 */
router.get('/autoscaling/history', async (req, res) => {
  try {
    const orchestrator = req.app.locals.phase8Orchestrator;
    const autoScalingService = orchestrator.services.get('autoScaling');
    const metrics = autoScalingService.getScalingMetrics();
    
    res.json({
      success: true,
      history: metrics.recentScaling,
      predictions: metrics.predictions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================================
// MULTI-REGION ROUTES
// ================================

/**
 * Multi-Region Metrics and Status
 */
router.get('/multiregion/metrics', async (req, res) => {
  try {
    const orchestrator = req.app.locals.phase8Orchestrator;
    if (!orchestrator?.services?.has('multiRegion')) {
      return res.status(503).json({ error: 'Multi-region service not available' });
    }
    
    const multiRegionService = orchestrator.services.get('multiRegion');
    const metrics = multiRegionService.getMultiRegionMetrics();
    
    res.json({
      success: true,
      service: 'multi-region',
      timestamp: new Date(),
      metrics
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Deploy to Multiple Regions
 */
router.post('/multiregion/deploy', async (req, res) => {
  try {
    const { serviceName, version, regions, strategy } = req.body;
    
    if (!serviceName || !version) {
      return res.status(400).json({ error: 'serviceName and version are required' });
    }
    
    const orchestrator = req.app.locals.phase8Orchestrator;
    const multiRegionService = orchestrator.services.get('multiRegion');
    
    const deployment = await multiRegionService.deployToRegions({
      serviceName,
      version,
      regions,
      strategy: strategy || 'rolling'
    });
    
    res.status(201).json({
      success: true,
      deployment
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Setup Cross-Region Replication
 */
router.post('/multiregion/replication', async (req, res) => {
  try {
    const { sourceRegion, targetRegions, config } = req.body;
    
    if (!sourceRegion || !targetRegions) {
      return res.status(400).json({ error: 'sourceRegion and targetRegions are required' });
    }
    
    const orchestrator = req.app.locals.phase8Orchestrator;
    const multiRegionService = orchestrator.services.get('multiRegion');
    
    const replicationStream = await multiRegionService.setupReplication(sourceRegion, targetRegions, config);
    
    res.status(201).json({
      success: true,
      replication: {
        replicationId: replicationStream.replicationId,
        sourceRegion: replicationStream.sourceRegion,
        targetRegions: replicationStream.targetRegions,
        status: replicationStream.status
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Trigger Manual Failover
 */
router.post('/multiregion/failover', async (req, res) => {
  try {
    const { failedRegion, reason } = req.body;
    
    if (!failedRegion) {
      return res.status(400).json({ error: 'failedRegion is required' });
    }
    
    const orchestrator = req.app.locals.phase8Orchestrator;
    const multiRegionService = orchestrator.services.get('multiRegion');
    
    const failoverResult = await multiRegionService.handleRegionFailover(failedRegion, reason);
    
    res.json({
      success: true,
      failover: failoverResult
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Optimize Traffic Routing
 */
router.post('/multiregion/optimize-routing', async (req, res) => {
  try {
    const orchestrator = req.app.locals.phase8Orchestrator;
    const multiRegionService = orchestrator.services.get('multiRegion');
    
    const optimization = await multiRegionService.optimizeTrafficRouting();
    
    res.json({
      success: true,
      optimization
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================================
// ML PIPELINE ROUTES
// ================================

/**
 * ML Pipeline Metrics and Status
 */
router.get('/ml/metrics', async (req, res) => {
  try {
    const orchestrator = req.app.locals.phase8Orchestrator;
    if (!orchestrator?.services?.has('mlPipelines')) {
      return res.status(503).json({ error: 'ML pipeline service not available' });
    }
    
    const mlPipelineService = orchestrator.services.get('mlPipelines');
    const metrics = mlPipelineService.getMLMetrics();
    
    res.json({
      success: true,
      service: 'ml-pipelines',
      timestamp: new Date(),
      metrics
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Create ML Pipeline
 */
router.post('/ml/pipelines', async (req, res) => {
  try {
    const pipelineConfig = req.body;
    
    if (!pipelineConfig.name || !pipelineConfig.type) {
      return res.status(400).json({ error: 'Pipeline name and type are required' });
    }
    
    const orchestrator = req.app.locals.phase8Orchestrator;
    const mlPipelineService = orchestrator.services.get('mlPipelines');
    
    const pipeline = await mlPipelineService.createPipeline(pipelineConfig);
    
    res.status(201).json({
      success: true,
      pipeline: {
        pipelineId: pipeline.pipelineId,
        name: pipeline.name,
        type: pipeline.type,
        status: pipeline.status,
        stages: pipeline.stages.map(s => s.name),
        triggers: pipeline.triggers
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Execute ML Pipeline
 */
router.post('/ml/pipelines/:pipelineId/execute', async (req, res) => {
  try {
    const { pipelineId } = req.params;
    const { triggerEvent } = req.body;
    
    const orchestrator = req.app.locals.phase8Orchestrator;
    const mlPipelineService = orchestrator.services.get('mlPipelines');
    
    const pipelineRun = await mlPipelineService.executePipeline(pipelineId, triggerEvent);
    
    res.json({
      success: true,
      execution: {
        runId: pipelineRun.runId,
        pipelineId: pipelineRun.pipelineId,
        status: pipelineRun.status,
        startedAt: pipelineRun.startedAt,
        stages: pipelineRun.stages.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Setup Inference Endpoint
 */
router.post('/ml/inference/endpoints', async (req, res) => {
  try {
    const { modelId, config } = req.body;
    
    if (!modelId) {
      return res.status(400).json({ error: 'modelId is required' });
    }
    
    const orchestrator = req.app.locals.phase8Orchestrator;
    const mlPipelineService = orchestrator.services.get('mlPipelines');
    
    const inferenceServer = await mlPipelineService.setupInferenceEndpoint(modelId, config);
    
    res.status(201).json({
      success: true,
      endpoint: {
        endpointId: inferenceServer.endpointId,
        modelId: inferenceServer.modelId,
        url: inferenceServer.url,
        status: inferenceServer.status,
        config: inferenceServer.config
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Make Prediction
 */
router.post('/ml/inference/:endpointId/predict', async (req, res) => {
  try {
    const { endpointId } = req.params;
    const { inputData, requestId } = req.body;
    
    if (!inputData) {
      return res.status(400).json({ error: 'inputData is required' });
    }
    
    const orchestrator = req.app.locals.phase8Orchestrator;
    const mlPipelineService = orchestrator.services.get('mlPipelines');
    
    const prediction = await mlPipelineService.predict(endpointId, inputData, requestId);
    
    res.json({
      success: true,
      prediction
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Model Performance Monitoring
 */
router.get('/ml/monitoring/performance', async (req, res) => {
  try {
    const orchestrator = req.app.locals.phase8Orchestrator;
    const mlPipelineService = orchestrator.services.get('mlPipelines');
    
    const driftResults = await mlPipelineService.monitorModelPerformance();
    
    res.json({
      success: true,
      monitoring: {
        timestamp: new Date(),
        modelsMonitored: driftResults.length,
        driftDetected: driftResults.filter(r => r.overallDriftScore > 0.1).length,
        results: driftResults
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================================
// PHASE 8 ORCHESTRATION ROUTES
// ================================

/**
 * Phase 8 Overview and Health
 */
router.get('/overview', async (req, res) => {
  try {
    const orchestrator = req.app.locals.phase8Orchestrator;
    if (!orchestrator) {
      return res.status(503).json({ error: 'Phase 8 orchestrator not available' });
    }
    
    const metrics = orchestrator.getPhase8Metrics();
    
    res.json({
      success: true,
      phase: 'Phase 8 - Advanced Enterprise Services',
      timestamp: new Date(),
      ...metrics
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Comprehensive Health Check
 */
router.get('/health/comprehensive', async (req, res) => {
  try {
    const orchestrator = req.app.locals.phase8Orchestrator;
    
    await orchestrator.performComprehensiveHealthCheck();
    const metrics = orchestrator.getPhase8Metrics();
    
    res.json({
      success: true,
      health: metrics.health,
      services: metrics.services,
      integrations: metrics.integrations,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Service Management
 */
router.get('/services', async (req, res) => {
  try {
    const orchestrator = req.app.locals.phase8Orchestrator;
    const metrics = orchestrator.getPhase8Metrics();
    
    res.json({
      success: true,
      services: {
        overview: metrics.overview,
        details: metrics.services,
        integrations: metrics.integrations
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Integration Status
 */
router.get('/integrations', async (req, res) => {
  try {
    const orchestrator = req.app.locals.phase8Orchestrator;
    const metrics = orchestrator.getPhase8Metrics();
    
    const integrationDetails = Array.from(orchestrator.integrations.values()).map(integration => ({
      name: integration.name,
      status: integration.status,
      events: integration.events,
      createdAt: integration.createdAt
    }));
    
    res.json({
      success: true,
      integrations: {
        total: orchestrator.integrations.size,
        active: metrics.overview.activeIntegrations,
        details: integrationDetails
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * System Metrics Aggregation
 */
router.get('/metrics/aggregated', async (req, res) => {
  try {
    const orchestrator = req.app.locals.phase8Orchestrator;
    await orchestrator.aggregateMetrics();
    
    const metrics = orchestrator.getPhase8Metrics();
    
    res.json({
      success: true,
      timestamp: new Date(),
      aggregation: metrics.metrics
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Alert Management
 */
router.get('/alerts', async (req, res) => {
  try {
    const orchestrator = req.app.locals.phase8Orchestrator;
    const metrics = orchestrator.getPhase8Metrics();
    
    res.json({
      success: true,
      alerts: {
        recent: metrics.health.alerts,
        count: orchestrator.alerts.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;