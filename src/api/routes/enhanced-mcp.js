/**
 * Enhanced MCP and Multimodel API Routes
 * Provides endpoints for advanced coding agent capabilities
 */

const express = require('express');
const router = express.Router();
const MultiModelOrchestrator = require('../../mcp/enhanced-multimodel-orchestrator');
const WorkflowIntegrationManager = require('../../mcp/workflow-integration-manager');

// Initialize managers
const orchestrator = new MultiModelOrchestrator();
const workflowManager = new WorkflowIntegrationManager();

/**
 * @route GET /api/enhanced-mcp/models
 * @desc Get available AI models and their capabilities
 */
router.get('/models', async (req, res) => {
    try {
        const stats = orchestrator.getModelStatistics();
        const health = await orchestrator.healthCheck();
        
        res.json({
            success: true,
            models: stats,
            health: health,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Error fetching model statistics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch model statistics',
            message: error.message
        });
    }
});

/**
 * @route POST /api/enhanced-mcp/agent-request
 * @desc Process a coding agent request with optimal model selection
 */
router.post('/agent-request', async (req, res) => {
    try {
        const { task, content, priority = 'normal', requirements = {} } = req.body;
        
        if (!task || !content) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: task, content'
            });
        }
        
        const result = await orchestrator.processAgentRequest({
            task,
            content,
            priority,
            requirements
        });
        
        res.json({
            success: true,
            ...result,
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('Error processing agent request:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process agent request',
            message: error.message
        });
    }
});

/**
 * @route POST /api/enhanced-mcp/workflow/execute
 * @desc Execute a comprehensive coding workflow
 */
router.post('/workflow/execute', async (req, res) => {
    try {
        const { workflowType, parameters } = req.body;
        
        if (!workflowType || !parameters) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: workflowType, parameters'
            });
        }
        
        // Start workflow execution (async)
        const workflowPromise = workflowManager.executeCodeAgentWorkflow(workflowType, parameters);
        
        // Return immediately with workflow ID for tracking
        res.json({
            success: true,
            message: 'Workflow started',
            workflowType,
            timestamp: new Date()
        });
        
        // Handle workflow completion in background
        workflowPromise.then(result => {
            console.log(`Workflow ${result.workflowId} completed:`, result);
        }).catch(error => {
            console.error(`Workflow failed:`, error);
        });
        
    } catch (error) {
        console.error('Error starting workflow:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to start workflow',
            message: error.message
        });
    }
});

/**
 * @route GET /api/enhanced-mcp/workflow/status
 * @desc Get status of all workflows
 */
router.get('/workflow/status', async (req, res) => {
    try {
        const status = workflowManager.getWorkflowStatus();
        
        res.json({
            success: true,
            ...status,
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('Error fetching workflow status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch workflow status',
            message: error.message
        });
    }
});

/**
 * @route POST /api/enhanced-mcp/workflow/full-stack
 * @desc Quick endpoint for full-stack development workflow
 */
router.post('/workflow/full-stack', async (req, res) => {
    try {
        const { requirements, technology_stack = 'Node.js + React + MongoDB', database_type = 'MongoDB' } = req.body;
        
        if (!requirements) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: requirements'
            });
        }
        
        const result = await workflowManager.executeCodeAgentWorkflow('full-stack-development', {
            requirements,
            technology_stack,
            database_type
        });
        
        res.json({
            success: true,
            ...result,
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('Error executing full-stack workflow:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to execute full-stack workflow',
            message: error.message
        });
    }
});

/**
 * @route POST /api/enhanced-mcp/workflow/code-review
 * @desc Quick endpoint for code review workflow
 */
router.post('/workflow/code-review', async (req, res) => {
    try {
        const { code_path, focus_areas = ['security', 'performance', 'maintainability'] } = req.body;
        
        if (!code_path) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: code_path'
            });
        }
        
        const result = await workflowManager.executeCodeAgentWorkflow('code-review-and-optimization', {
            code_path,
            focus_areas
        });
        
        res.json({
            success: true,
            ...result,
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('Error executing code review workflow:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to execute code review workflow',
            message: error.message
        });
    }
});

/**
 * @route POST /api/enhanced-mcp/workflow/bug-fix
 * @desc Quick endpoint for bug diagnosis and fix workflow
 */
router.post('/workflow/bug-fix', async (req, res) => {
    try {
        const { bug_description, error_logs = '', affected_files = [] } = req.body;
        
        if (!bug_description) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: bug_description'
            });
        }
        
        const result = await workflowManager.executeCodeAgentWorkflow('bug-diagnosis-and-fix', {
            bug_description,
            error_logs,
            affected_files
        });
        
        res.json({
            success: true,
            ...result,
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('Error executing bug fix workflow:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to execute bug fix workflow',
            message: error.message
        });
    }
});

/**
 * @route POST /api/enhanced-mcp/optimize
 * @desc Optimize model selection based on performance history
 */
router.post('/optimize', async (req, res) => {
    try {
        orchestrator.optimizeModelSelection();
        
        res.json({
            success: true,
            message: 'Model selection optimization completed',
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('Error optimizing model selection:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to optimize model selection',
            message: error.message
        });
    }
});

/**
 * @route GET /api/enhanced-mcp/health
 * @desc Health check for MCP servers and models
 */
router.get('/health', async (req, res) => {
    try {
        const modelsHealth = await orchestrator.healthCheck();
        const mcpHealth = await workflowManager.healthCheckMCPServers();
        
        const overallHealth = modelsHealth.overall === 'healthy' && 
                             Object.values(mcpHealth.servers).every(s => s.status === 'healthy') 
                             ? 'healthy' : 'degraded';
        
        res.json({
            success: true,
            status: overallHealth,
            models: modelsHealth,
            mcpServers: mcpHealth,
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('Error checking health:', error);
        res.status(500).json({
            success: false,
            error: 'Health check failed',
            message: error.message
        });
    }
});

/**
 * @route GET /api/enhanced-mcp/capabilities
 * @desc Get comprehensive system capabilities
 */
router.get('/capabilities', async (req, res) => {
    try {
        const modelStats = orchestrator.getModelStatistics();
        const workflowStatus = workflowManager.getWorkflowStatus();
        
        const capabilities = {
            models: {
                available: Object.keys(modelStats),
                totalCapabilities: Array.from(new Set(
                    Object.values(modelStats).flatMap(m => m.capabilities)
                )),
                providers: Array.from(new Set(
                    Object.values(orchestrator.models).map(m => m.provider)
                ))
            },
            workflows: {
                available: [
                    'full-stack-development',
                    'code-review-and-optimization', 
                    'bug-diagnosis-and-fix',
                    'feature-development',
                    'system-architecture'
                ],
                statistics: workflowStatus.statistics
            },
            mcpServers: {
                available: Array.from(workflowManager.mcpServers.keys()),
                capabilities: Array.from(new Set(
                    Array.from(workflowManager.mcpServers.values()).flatMap(s => s.capabilities)
                ))
            }
        };
        
        res.json({
            success: true,
            capabilities,
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('Error fetching capabilities:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch capabilities',
            message: error.message
        });
    }
});

module.exports = router;