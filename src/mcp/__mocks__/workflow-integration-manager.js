// Mock for workflow-integration-manager
class MockWorkflowIntegrationManager {
  constructor() {
    this.mcpServers = new Map();
  }
  
  getWorkflowStatus() {
    return {
      statistics: {
        totalExecutions: 15,
        successRate: 0.93,
        averageExecutionTime: 2500
      }
    };
  }
  
  async healthCheckMCPServers() {
    return {
      servers: {
        mcpHealth: { status: 'healthy' },
        mcpOrchestrator: { status: 'healthy' },
        mcpWorkflow: { status: 'healthy' },
        browserbase: { status: process.env.BROWSERBASE_API_KEY ? 'healthy' : 'skipped' }
      }
    };
  }
  
  async executeCodeAgentWorkflow(workflowType, context) {
    return {
      workflowId: 'test-workflow-123',
      status: 'completed',
      results: { success: true }
    };
  }
  
  async executeWorkflow(workflowType, context) {
    return this.executeCodeAgentWorkflow(workflowType, context);
  }
}

module.exports = MockWorkflowIntegrationManager;