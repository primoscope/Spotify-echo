/**
 * EchoTune AI - Phase 10 API Routes
 * Advanced AI/ML Capabilities & Real-Time Recommendations API endpoints
 */

const express = require('express');
const router = express.Router();

// Middleware to check if Phase 10 orchestrator is available
const checkPhase10Availability = (req, res, next) => {
  if (!req.app.locals.phase10Orchestrator) {
    return res.status(503).json({
      error: 'Phase 10: Advanced AI/ML Capabilities not available',
      message: 'Phase 10 orchestrator is not initialized',
      available_endpoints: [],
      fallback: true
    });
  }
  next();
};

// Apply middleware to all routes
router.use(checkPhase10Availability);

/**
 * Phase 10 Overview and Management Endpoints
 */

// GET /api/phase10/overview - Complete Phase 10 system overview
router.get('/overview', async (req, res) => {
  try {
    const orchestrator = req.app.locals.phase10Orchestrator;
    const overview = orchestrator.getStatus();
    
    res.json({
      phase: 'Phase 10: Advanced AI/ML Capabilities & Real-Time Recommendations',
      overview,
      services: {
        recommendation: overview.services.list.includes('recommendation'),
        inference: overview.services.list.includes('inference'),
        personalization: overview.services.list.includes('personalization'),
        modelManagement: overview.services.list.includes('model_management')
      },
      endpoints: {
        total: 30,
        categories: ['recommendations', 'inference', 'personalization', 'models', 'analytics', 'management']
      },
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get Phase 10 overview',
      message: error.message,
      timestamp: new Date()
    });
  }
});

// GET /api/phase10/health/comprehensive - Comprehensive health check
router.get('/health/comprehensive', async (req, res) => {
  try {
    const orchestrator = req.app.locals.phase10Orchestrator;
    const status = orchestrator.getStatus();
    
    const healthData = {
      overall: {
        status: status.status,
        healthy: status.services.healthy === status.services.total,
        score: status.services.total > 0 ? (status.services.healthy / status.services.total) : 0
      },
      services: status.services,
      metrics: status.metrics,
      performance: {
        averageLatency: status.metrics.averageLatency,
        totalRequests: status.metrics.totalRequests,
        optimizationLevel: status.metrics.optimizationEvents > 0 ? 'active' : 'passive'
      },
      integrations: {
        patterns: status.integrationPatterns.length,
        crossServiceOptimization: status.configuration.enableCrossServiceOptimization
      },
      timestamp: new Date()
    };
    
    res.json(healthData);
  } catch (error) {
    res.status(500).json({
      error: 'Health check failed',
      message: error.message,
      timestamp: new Date()
    });
  }
});

// GET /api/phase10/services - Service management and status
router.get('/services', async (req, res) => {
  try {
    const orchestrator = req.app.locals.phase10Orchestrator;
    const status = orchestrator.getStatus();
    
    res.json({
      services: status.services,
      health: status.metrics.serviceHealth,
      configuration: status.configuration,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get services status',
      message: error.message,
      timestamp: new Date()
    });
  }
});

/**
 * Advanced Recommendation Engine Endpoints
 */

// GET /api/phase10/recommendations/status - Recommendation engine status
router.get('/recommendations/status', async (req, res) => {
  try {
    const orchestrator = req.app.locals.phase10Orchestrator;
    
    if (!orchestrator.recommendationEngine) {
      return res.status(404).json({
        error: 'Recommendation engine not available',
        service: 'AdvancedRecommendationEngine',
        status: 'disabled'
      });
    }
    
    const status = orchestrator.recommendationEngine.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get recommendation engine status',
      message: error.message,
      timestamp: new Date()
    });
  }
});

// POST /api/phase10/recommendations/generate - Generate intelligent recommendations
router.post('/recommendations/generate', async (req, res) => {
  try {
    const { userId, context = {} } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required',
        message: 'userId parameter is missing from request body'
      });
    }
    
    const orchestrator = req.app.locals.phase10Orchestrator;
    const result = await orchestrator.getIntelligentRecommendations(userId, context);
    
    res.json({
      success: true,
      userId,
      recommendations: result.recommendations,
      personalization: result.personalization,
      metadata: result.metadata,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate recommendations',
      message: error.message,
      timestamp: new Date()
    });
  }
});

// POST /api/phase10/recommendations/feedback - Process user feedback
router.post('/recommendations/feedback', async (req, res) => {
  try {
    const { userId, feedback } = req.body;
    
    if (!userId || !feedback) {
      return res.status(400).json({
        error: 'User ID and feedback are required',
        message: 'userId and feedback parameters are missing from request body'
      });
    }
    
    const orchestrator = req.app.locals.phase10Orchestrator;
    
    if (!orchestrator.recommendationEngine) {
      return res.status(404).json({
        error: 'Recommendation engine not available'
      });
    }
    
    const result = await orchestrator.recommendationEngine.updateUserPreferences(userId, feedback);
    
    res.json({
      success: result,
      userId,
      feedback: feedback.type,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to process feedback',
      message: error.message,
      timestamp: new Date()
    });
  }
});

/**
 * Real-Time Inference Service Endpoints
 */

// GET /api/phase10/inference/status - Inference service status
router.get('/inference/status', async (req, res) => {
  try {
    const orchestrator = req.app.locals.phase10Orchestrator;
    
    if (!orchestrator.inferenceService) {
      return res.status(404).json({
        error: 'Inference service not available',
        service: 'RealTimeInferenceService',
        status: 'disabled'
      });
    }
    
    const status = orchestrator.inferenceService.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get inference service status',
      message: error.message,
      timestamp: new Date()
    });
  }
});

// POST /api/phase10/inference/predict - Real-time model inference
router.post('/inference/predict', async (req, res) => {
  try {
    const { modelName, input, options = {} } = req.body;
    
    if (!modelName || !input) {
      return res.status(400).json({
        error: 'Model name and input are required',
        message: 'modelName and input parameters are missing from request body'
      });
    }
    
    const orchestrator = req.app.locals.phase10Orchestrator;
    
    if (!orchestrator.inferenceService) {
      return res.status(404).json({
        error: 'Inference service not available'
      });
    }
    
    const result = await orchestrator.inferenceService.predict(modelName, input, options);
    
    res.json({
      success: true,
      modelName,
      prediction: result,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Inference failed',
      message: error.message,
      timestamp: new Date()
    });
  }
});

// POST /api/phase10/inference/batch - Batch inference
router.post('/inference/batch', async (req, res) => {
  try {
    const { modelName, inputs, options = {} } = req.body;
    
    if (!modelName || !Array.isArray(inputs) || inputs.length === 0) {
      return res.status(400).json({
        error: 'Model name and inputs array are required',
        message: 'modelName and inputs parameters are missing or invalid'
      });
    }
    
    const orchestrator = req.app.locals.phase10Orchestrator;
    
    if (!orchestrator.inferenceService) {
      return res.status(404).json({
        error: 'Inference service not available'
      });
    }
    
    const results = await orchestrator.inferenceService.batchPredict(modelName, inputs, options);
    
    res.json({
      success: true,
      modelName,
      inputCount: inputs.length,
      predictions: results,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Batch inference failed',
      message: error.message,
      timestamp: new Date()
    });
  }
});

/**
 * Personalization Engine Endpoints
 */

// GET /api/phase10/personalization/status - Personalization engine status
router.get('/personalization/status', async (req, res) => {
  try {
    const orchestrator = req.app.locals.phase10Orchestrator;
    
    if (!orchestrator.personalizationEngine) {
      return res.status(404).json({
        error: 'Personalization engine not available',
        service: 'PersonalizationEngineService',
        status: 'disabled'
      });
    }
    
    const status = orchestrator.personalizationEngine.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get personalization engine status',
      message: error.message,
      timestamp: new Date()
    });
  }
});

// GET /api/phase10/personalization/profile/:userId - Get user personalization profile
router.get('/personalization/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const orchestrator = req.app.locals.phase10Orchestrator;
    
    if (!orchestrator.personalizationEngine) {
      return res.status(404).json({
        error: 'Personalization engine not available'
      });
    }
    
    const profile = await orchestrator.personalizationEngine.getUserPersonalizationProfile(userId);
    
    if (!profile) {
      return res.status(404).json({
        error: 'User profile not found',
        userId
      });
    }
    
    res.json({
      success: true,
      profile,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get user profile',
      message: error.message,
      timestamp: new Date()
    });
  }
});

// POST /api/phase10/personalization/interaction - Process user interaction
router.post('/personalization/interaction', async (req, res) => {
  try {
    const { userId, interaction } = req.body;
    
    if (!userId || !interaction) {
      return res.status(400).json({
        error: 'User ID and interaction are required',
        message: 'userId and interaction parameters are missing from request body'
      });
    }
    
    const orchestrator = req.app.locals.phase10Orchestrator;
    const result = await orchestrator.processUserInteraction(userId, interaction);
    
    res.json({
      success: result.processed,
      userId,
      interaction: interaction.type,
      services: result.services,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to process interaction',
      message: error.message,
      timestamp: new Date()
    });
  }
});

/**
 * AI Model Management Endpoints
 */

// GET /api/phase10/models/status - Model management status
router.get('/models/status', async (req, res) => {
  try {
    const orchestrator = req.app.locals.phase10Orchestrator;
    
    if (!orchestrator.modelManagement) {
      return res.status(404).json({
        error: 'Model management not available',
        service: 'AIModelManagementService',
        status: 'disabled'
      });
    }
    
    const status = orchestrator.modelManagement.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get model management status',
      message: error.message,
      timestamp: new Date()
    });
  }
});

// GET /api/phase10/models/metrics/:modelId - Get model performance metrics
router.get('/models/metrics/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;
    const { timeRange = '24h' } = req.query;
    
    const orchestrator = req.app.locals.phase10Orchestrator;
    
    if (!orchestrator.modelManagement) {
      return res.status(404).json({
        error: 'Model management not available'
      });
    }
    
    const metrics = await orchestrator.modelManagement.getModelMetrics(modelId, timeRange);
    
    if (!metrics) {
      return res.status(404).json({
        error: 'Model not found',
        modelId
      });
    }
    
    res.json({
      success: true,
      metrics,
      timeRange,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get model metrics',
      message: error.message,
      timestamp: new Date()
    });
  }
});

/**
 * Analytics and Reporting Endpoints
 */

// GET /api/phase10/analytics - Comprehensive AI analytics
router.get('/analytics', async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    
    const orchestrator = req.app.locals.phase10Orchestrator;
    const analytics = await orchestrator.getAIAnalytics(timeRange);
    
    res.json({
      success: true,
      analytics,
      timeRange,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get AI analytics',
      message: error.message,
      timestamp: new Date()
    });
  }
});

// GET /api/phase10/integrations - Cross-service integration status
router.get('/integrations', async (req, res) => {
  try {
    const orchestrator = req.app.locals.phase10Orchestrator;
    const status = orchestrator.getStatus();
    
    res.json({
      integrationPatterns: status.integrationPatterns,
      crossServiceOptimization: status.configuration.enableCrossServiceOptimization,
      services: status.services,
      coordinationInterval: status.configuration.coordinationInterval,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get integration status',
      message: error.message,
      timestamp: new Date()
    });
  }
});

/**
 * Optimization and Management Endpoints
 */

// POST /api/phase10/optimize/pipeline - Optimize ML pipeline
router.post('/optimize/pipeline', async (req, res) => {
  try {
    const { optimizationParams = {} } = req.body;
    
    const orchestrator = req.app.locals.phase10Orchestrator;
    const result = await orchestrator.optimizeMLPipeline(optimizationParams);
    
    res.json({
      success: result.optimized,
      result,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Pipeline optimization failed',
      message: error.message,
      timestamp: new Date()
    });
  }
});

// GET /api/phase10/report/comprehensive - Complete AI/ML report
router.get('/report/comprehensive', async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    
    const orchestrator = req.app.locals.phase10Orchestrator;
    const status = orchestrator.getStatus();
    const analytics = await orchestrator.getAIAnalytics(timeRange);
    
    const report = {
      phase: 'Phase 10: Advanced AI/ML Capabilities & Real-Time Recommendations',
      summary: {
        services: status.services,
        performance: {
          totalRequests: status.metrics.totalRequests,
          averageLatency: status.metrics.averageLatency,
          optimizationEvents: status.metrics.optimizationEvents
        },
        health: {
          overall: status.services.healthy === status.services.total ? 'healthy' : 'degraded',
          score: status.services.total > 0 ? (status.services.healthy / status.services.total * 100).toFixed(1) + '%' : '0%'
        }
      },
      analytics,
      configuration: status.configuration,
      integrations: {
        patterns: status.integrationPatterns,
        crossServiceOptimization: status.configuration.enableCrossServiceOptimization
      },
      recommendations: [
        'Monitor ML pipeline performance regularly',
        'Optimize cross-service communication',
        'Review personalization effectiveness',
        'Update model performance thresholds'
      ],
      timeRange,
      timestamp: new Date()
    };
    
    res.json(report);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate comprehensive report',
      message: error.message,
      timestamp: new Date()
    });
  }
});

module.exports = router;