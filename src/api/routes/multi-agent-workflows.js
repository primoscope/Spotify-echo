/**
 * Multi-Agent Workflow API Routes
 * Exposes orchestrated Perplexity + Grok-4 workflows
 */
const express = require('express');
const router = express.Router();
const MultiAgentOrchestrator = require('../../utils/multi-agent-orchestrator');

// Initialize orchestrator
const orchestrator = new MultiAgentOrchestrator();
// Lazy initialization - will happen on first use

/**
 * Ensure orchestrator is initialized
 */
async function ensureInitialized() {
  if (!orchestrator.initialized) {
    await orchestrator.initialize();
  }
}

/**
 * @swagger
 * /api/workflow/music-discovery:
 *   post:
 *     summary: Multi-agent music discovery workflow
 *     description: Combines research and analysis for personalized music recommendations
 *     tags: [Workflow, Music]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *                 description: Music discovery query
 *               userPreferences:
 *                 type: object
 *                 properties:
 *                   genres:
 *                     type: array
 *                     items:
 *                       type: string
 *                   artists:
 *                     type: array
 *                     items:
 *                       type: string
 *                   mood:
 *                     type: string
 *                   energy:
 *                     type: string
 */
router.post('/music-discovery', async (req, res) => {
  try {
    await ensureInitialized();
    
    const { query, userPreferences = {} } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required',
      });
    }

    console.log('🎵 Starting music discovery workflow:', query);
    
    const result = await orchestrator.musicDiscoveryWorkflow(query, userPreferences);

    res.json({
      success: result.success,
      workflowId: result.workflowId,
      recommendations: result.recommendations,
      workflow: result.results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Music discovery workflow error:', error);
    res.status(500).json({
      success: false,
      error: 'Music discovery workflow failed',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/workflow/code-analysis:
 *   post:
 *     summary: Multi-agent code analysis workflow
 *     description: Combines research and analysis for comprehensive code review
 *     tags: [Workflow, Analysis]
 */
router.post('/code-analysis', async (req, res) => {
  try {
    await ensureInitialized();
    
    const { codeSnapshot, analysisType = 'comprehensive' } = req.body;

    if (!codeSnapshot) {
      return res.status(400).json({
        success: false,
        error: 'Code snapshot is required',
      });
    }

    console.log('🔍 Starting code analysis workflow:', analysisType);
    
    const result = await orchestrator.codeAnalysisWorkflow(codeSnapshot, analysisType);

    res.json({
      success: result.success,
      workflowId: result.workflowId,
      summary: result.summary,
      workflow: result.results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Code analysis workflow error:', error);
    res.status(500).json({
      success: false,
      error: 'Code analysis workflow failed',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/workflow/research-driven-development:
 *   post:
 *     summary: Research-driven development workflow
 *     description: Combines research and analysis for feature development planning
 *     tags: [Workflow, Development]
 */
router.post('/research-driven-development', async (req, res) => {
  try {
    await ensureInitialized();
    
    const { feature, requirements } = req.body;

    if (!feature || !requirements) {
      return res.status(400).json({
        success: false,
        error: 'Feature name and requirements are required',
      });
    }

    console.log('🏗️ Starting research-driven development workflow:', feature);
    
    const result = await orchestrator.researchDrivenDevelopment(feature, requirements);

    res.json({
      success: result.success,
      workflowId: result.workflowId,
      plan: result.plan,
      workflow: result.results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Research-driven development workflow error:', error);
    res.status(500).json({
      success: false,
      error: 'Research-driven development workflow failed',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/workflow/history:
 *   get:
 *     summary: Get workflow execution history
 *     description: Returns recent workflow executions and analytics
 *     tags: [Workflow]
 */
router.get('/history', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const history = orchestrator.getWorkflowHistory(parseInt(limit));

    res.json({
      success: true,
      history,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Workflow history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get workflow history',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/workflow/capabilities:
 *   get:
 *     summary: Get workflow capabilities
 *     description: Returns available workflow types and provider status
 *     tags: [Workflow]
 */
router.get('/capabilities', async (req, res) => {
  try {
    const capabilities = {
      workflows: [
        {
          name: 'music-discovery',
          description: 'Personalized music recommendations using research + analysis',
          requirements: ['query'],
          optional: ['userPreferences'],
        },
        {
          name: 'code-analysis',
          description: 'Comprehensive code review with best practices research',
          requirements: ['codeSnapshot'],
          optional: ['analysisType'],
        },
        {
          name: 'research-driven-development',
          description: 'Feature development planning with research insights',
          requirements: ['feature', 'requirements'],
          optional: [],
        },
      ],
      providers: {
        research: orchestrator.providers.get('research')?.isAvailable() || false,
        analysis: orchestrator.providers.get('analysis')?.isAvailable() || false,
      },
      analytics: orchestrator.generateWorkflowAnalytics(),
    };

    res.json({
      success: true,
      capabilities,
    });

  } catch (error) {
    console.error('Workflow capabilities error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get workflow capabilities',
    });
  }
});

module.exports = router;