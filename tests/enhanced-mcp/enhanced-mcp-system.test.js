/**
 * Enhanced MCP System Tests
 * Tests the multimodel orchestrator and workflow integration
 */

const request = require('supertest');
const MultiModelOrchestrator = require('../../src/mcp/enhanced-multimodel-orchestrator');
const WorkflowIntegrationManager = require('../../src/mcp/workflow-integration-manager');

describe('Enhanced MCP System', () => {
    describe('MultiModel Orchestrator', () => {
        let orchestrator;
        
        beforeEach(() => {
            orchestrator = new MultiModelOrchestrator();
        });
        
        afterEach(() => {
            // Clean up any listeners
            orchestrator.removeAllListeners();
        });
        
        test('should initialize with multiple AI models', () => {
            const stats = orchestrator.getModelStatistics();
            
            expect(Object.keys(stats)).toHaveLength(6);
            expect(stats).toHaveProperty('gpt-5');
            expect(stats).toHaveProperty('gpt-5-chat');
            expect(stats).toHaveProperty('gpt-5-turbo');
            expect(stats).toHaveProperty('gpt-4-turbo');
            expect(stats).toHaveProperty('gemini-2.0-flash-exp');
            expect(stats).toHaveProperty('claude-3.5-sonnet');
        });
        
        test('should select optimal model for code generation', () => {
            const modelId = orchestrator.selectOptimalModel('code-generation');
            
            expect(modelId).toBeDefined();
            expect(typeof modelId).toBe('string');
            
            const model = orchestrator.models.get(modelId);
            expect(model.capabilities).toContain('code-generation');
        });
        
        test('should select model based on cost constraints', () => {
            const modelId = orchestrator.selectOptimalModel('code-generation', {
                maxCostPerToken: 0.00003
            });
            
            const model = orchestrator.models.get(modelId);
            expect(model.costPerToken).toBeLessThanOrEqual(0.00003);
        });
        
        test('should throw error when no suitable model found', () => {
            expect(() => {
                orchestrator.selectOptimalModel('non-existent-task');
            }).toThrow('No suitable model found for task: non-existent-task');
        });
        
        test('should process agent request successfully', async () => {
            const request = {
                task: 'code-generation',
                content: 'Create a simple Node.js function',
                requirements: {}
            };
            
            const result = await orchestrator.processAgentRequest(request);
            
            expect(result.success).toBe(true);
            expect(result.modelUsed).toBeDefined();
            expect(result.response).toBeDefined();
            expect(result.metadata).toHaveProperty('latency');
            expect(result.metadata).toHaveProperty('estimatedCost');
        });
        
        test('should create task-specific prompts', () => {
            const content = 'Test code content';
            
            const codeGenPrompt = orchestrator.createTaskSpecificPrompt('code-generation', content, 'gpt-5');
            const reviewPrompt = orchestrator.createTaskSpecificPrompt('code-review', content, 'claude-3.5-sonnet');
            
            expect(codeGenPrompt).toContain('expert software engineer');
            expect(codeGenPrompt).toContain(content);
            expect(reviewPrompt).toContain('code review');
            expect(reviewPrompt).toContain('thorough');
        });
        
        test('should perform health check', async () => {
            const health = await orchestrator.healthCheck();
            
            expect(health).toHaveProperty('timestamp');
            expect(health).toHaveProperty('overall');
            expect(health).toHaveProperty('models');
            expect(['healthy', 'degraded', 'unhealthy']).toContain(health.overall);
        });
        
        test('should optimize model selection', () => {
            // Simulate some usage
            const model = orchestrator.models.get('gpt-5');
            model.totalRequests = 10;
            model.averageLatency = 6000; // High latency
            
            orchestrator.optimizeModelSelection();
            
            // Should have penalized high-latency model
            expect(model.priority).toBeGreaterThan(0);
        });
    });
    
    describe('Workflow Integration Manager', () => {
        let workflowManager;
        
        beforeEach(() => {
            workflowManager = new WorkflowIntegrationManager();
        });
        
        afterEach(() => {
            workflowManager.removeAllListeners();
        });
        
        test('should initialize with MCP servers', () => {
            const mcpServers = workflowManager.mcpServers;
            
            expect(mcpServers.size).toBeGreaterThan(0);
            expect(mcpServers.has('filesystem')).toBe(true);
            expect(mcpServers.has('browser')).toBe(true);
            expect(mcpServers.has('sequential-thinking')).toBe(true);
        });
        
        test('should execute code review workflow', async () => {
            const parameters = {
                code_path: './src/test-file.js',
                focus_areas: ['security', 'performance']
            };
            
            const result = await workflowManager.executeCodeAgentWorkflow('code-review-and-optimization', parameters);
            
            expect(result.success).toBe(true);
            expect(result.workflowId).toBeDefined();
            expect(result.result).toHaveProperty('analysis');
            expect(result.result).toHaveProperty('security');
            expect(result.result).toHaveProperty('performance');
            expect(result.result).toHaveProperty('report');
        }, 30000); // Extended timeout for workflow execution
        
        test('should get workflow status', () => {
            const status = workflowManager.getWorkflowStatus();
            
            expect(status).toHaveProperty('active');
            expect(status).toHaveProperty('completed');
            expect(status).toHaveProperty('statistics');
            expect(Array.isArray(status.active)).toBe(true);
            expect(Array.isArray(status.completed)).toBe(true);
        });
        
        test('should execute MCP task', async () => {
            const result = await workflowManager.executeMCPTask('filesystem', {
                operation: 'read-project',
                path: './src'
            });
            
            expect(result.success).toBe(true);
            expect(result.serverId).toBe('filesystem');
            expect(result.operation).toBe('read-project');
        });
        
        test('should perform MCP health check', async () => {
            const health = await workflowManager.healthCheckMCPServers();
            
            expect(health).toHaveProperty('timestamp');
            expect(health).toHaveProperty('servers');
            expect(Object.keys(health.servers).length).toBeGreaterThan(0);
        });
        
        test('should handle workflow execution errors', async () => {
            const parameters = {}; // Invalid parameters
            
            await expect(
                workflowManager.executeCodeAgentWorkflow('invalid-workflow-type', parameters)
            ).rejects.toThrow('Unknown workflow type: invalid-workflow-type');
        });
    });
    
    describe('Integration Tests', () => {
        test('should integrate orchestrator and workflow manager', async () => {
            const orchestrator = new MultiModelOrchestrator();
            const workflowManager = new WorkflowIntegrationManager();
            
            // Test that they can work together
            const modelStats = orchestrator.getModelStatistics();
            const workflowStats = workflowManager.getWorkflowStatus();
            
            expect(Object.keys(modelStats).length).toBeGreaterThan(0);
            expect(workflowStats.statistics).toBeDefined();
        });
        
        test('should handle event communication between components', (done) => {
            const orchestrator = new MultiModelOrchestrator();
            
            orchestrator.on('request-completed', (data) => {
                expect(data).toHaveProperty('modelId');
                expect(data).toHaveProperty('task');
                expect(data.success).toBe(true);
                done();
            });
            
            // Trigger event by processing a request
            orchestrator.processAgentRequest({
                task: 'code-generation',
                content: 'Test content'
            });
        });
    });
    
    describe('Performance Tests', () => {
        test('should handle multiple concurrent requests', async () => {
            const orchestrator = new MultiModelOrchestrator();
            
            const requests = Array(5).fill().map((_, i) => 
                orchestrator.processAgentRequest({
                    task: 'code-generation',
                    content: `Test request ${i}`
                })
            );
            
            const results = await Promise.all(requests);
            
            expect(results).toHaveLength(5);
            results.forEach(result => {
                expect(result.success).toBe(true);
            });
        });
        
        test('should track performance metrics', async () => {
            const orchestrator = new MultiModelOrchestrator();
            
            await orchestrator.processAgentRequest({
                task: 'code-generation',
                content: 'Test content for metrics'
            });
            
            const stats = orchestrator.getModelStatistics();
            const usedModels = Object.values(stats).filter(m => m.totalRequests > 0);
            
            expect(usedModels.length).toBeGreaterThan(0);
            expect(usedModels[0].averageLatency).toBeGreaterThan(0);
        });
    });
});