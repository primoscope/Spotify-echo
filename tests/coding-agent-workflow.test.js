/**
 * Test Suite for Coding Agent Workflow Analysis & Optimization
 * 
 * Comprehensive tests for all MCP server components
 */

const request = require('supertest');
const fs = require('fs').promises;
const path = require('path');

const CodingAgentAnalyzer = require('../mcp-server/coding-agent-analyzer');
const WorkflowValidator = require('../mcp-server/workflow-validator');
const CodingAgentMCPServer = require('../mcp-server/coding-agent-mcp-server');

describe('Coding Agent Workflow Analysis & Optimization', () => {
  let analyzer, validator, server, app;
  const testDataDir = path.join(__dirname, 'test-data');

  beforeAll(async () => {
    // Create test data directory
    try {
      await fs.mkdir(testDataDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Create test workflow files
    await createTestWorkflowFiles();

    // Initialize components
    analyzer = new CodingAgentAnalyzer({ basePath: process.cwd() });
    validator = new WorkflowValidator({ basePath: process.cwd() });
    server = new CodingAgentMCPServer({ basePath: process.cwd(), port: 0 }); // Use random port
    
    // Start server for API tests
    const serverInstance = await server.start();
    app = server.app;
  });

  afterAll(async () => {
    // Clean up
    await server.stop();
    
    // Clean up test data
    try {
      await fs.rmdir(testDataDir, { recursive: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('CodingAgentAnalyzer', () => {
    test('should initialize correctly', () => {
      expect(analyzer).toBeInstanceOf(CodingAgentAnalyzer);
      expect(analyzer.basePath).toBe(process.cwd());
    });

    test('should analyze workflows successfully', async () => {
      const results = await analyzer.analyze();
      
      expect(results).toHaveProperty('workflows');
      expect(results).toHaveProperty('copilotConfigs');
      expect(results).toHaveProperty('customInstructions');
      expect(results).toHaveProperty('issues');
      expect(results).toHaveProperty('recommendations');
      
      expect(Array.isArray(results.workflows)).toBe(true);
      expect(results.workflows.length).toBeGreaterThan(0);
    });

    test('should identify agent-related workflows', async () => {
      const results = await analyzer.analyze();
      const agentWorkflows = results.workflows.filter(w => w.isAgentRelated);
      
      expect(agentWorkflows.length).toBeGreaterThan(0);
    });

    test('should detect workflow issues', async () => {
      const results = await analyzer.analyze();
      
      expect(Array.isArray(results.issues)).toBe(true);
      // Should have some issues for testing purposes
    });

    test('should generate recommendations', async () => {
      const results = await analyzer.analyze();
      
      expect(Array.isArray(results.recommendations)).toBe(true);
    });

    test('should generate comprehensive report', () => {
      const report = analyzer.generateReport();
      
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('details');
      expect(report.summary).toHaveProperty('totalWorkflows');
      expect(report.summary).toHaveProperty('agentWorkflows');
    });
  });

  describe('WorkflowValidator', () => {
    test('should initialize correctly', () => {
      expect(validator).toBeInstanceOf(WorkflowValidator);
    });

    test('should validate all workflows', async () => {
      const results = await validator.validateAll();
      
      expect(results).toHaveProperty('summary');
      expect(results).toHaveProperty('details');
      expect(results.summary).toHaveProperty('overallScore');
      expect(results.summary).toHaveProperty('totalWorkflows');
    });

    test('should validate syntax correctly', async () => {
      await validator.validateSyntax();
      
      expect(Array.isArray(validator.testResults.syntax)).toBe(true);
      expect(validator.testResults.syntax.length).toBeGreaterThan(0);
    });

    test('should validate logic correctly', async () => {
      await validator.validateSyntax(); // Need syntax results first
      await validator.validateLogic();
      
      expect(Array.isArray(validator.testResults.logic)).toBe(true);
    });

    test('should validate security', async () => {
      await validator.validateSyntax();
      await validator.validateSecurity();
      
      expect(Array.isArray(validator.testResults.security)).toBe(true);
    });

    test('should validate performance', async () => {
      await validator.validateSyntax();
      await validator.validatePerformance();
      
      expect(Array.isArray(validator.testResults.performance)).toBe(true);
    });

    test('should provide recommendations', async () => {
      const results = await validator.validateAll();
      
      expect(Array.isArray(results.recommendations)).toBe(true);
    });
  });

  describe('CodingAgentMCPServer API', () => {
    test('should respond to health check', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'Coding Agent Workflow MCP Server');
    });

    test('should return server info', async () => {
      const response = await request(app).get('/mcp/info');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'Coding Agent Workflow Analyzer');
      expect(response.body).toHaveProperty('capabilities');
      expect(Array.isArray(response.body.capabilities)).toBe(true);
    });

    test('should handle analysis request', async () => {
      const response = await request(app).post('/analyze');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('analysis');
      expect(response.body).toHaveProperty('summary');
    });

    test('should handle validation request', async () => {
      const response = await request(app).post('/validate');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('validation');
    });

    test('should provide optimization recommendations', async () => {
      // First run analysis
      await request(app).post('/analyze');
      
      const response = await request(app).get('/optimize');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('optimizations');
    });

    test('should handle PR trigger', async () => {
      const triggerData = {
        prNumber: 123,
        prTitle: 'Test PR',
        prBody: 'Test PR body',
        changedFiles: ['.github/workflows/test.yml'],
        action: 'analyze',
        user: 'test-user'
      };

      const response = await request(app)
        .post('/trigger')
        .send(triggerData);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('trigger');
    });

    test('should provide status information', async () => {
      const response = await request(app).get('/status');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('status');
    });

    test('should generate comprehensive report', async () => {
      const response = await request(app).get('/report');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('report');
    });

    test('should handle automated fixes', async () => {
      // First run analysis to get issues
      await request(app).post('/analyze');
      
      const response = await request(app)
        .post('/fix')
        .send({ fixType: 'safe' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('fixes');
    });
  });

  describe('Integration Tests', () => {
    test('should work end-to-end for workflow analysis', async () => {
      // Run full analysis
      const analysisResponse = await request(app).post('/analyze');
      expect(analysisResponse.status).toBe(200);

      // Run validation
      const validationResponse = await request(app).post('/validate');
      expect(validationResponse.status).toBe(200);

      // Get optimization plan
      const optimizationResponse = await request(app).get('/optimize');
      expect(optimizationResponse.status).toBe(200);

      // Generate report
      const reportResponse = await request(app).get('/report');
      expect(reportResponse.status).toBe(200);

      // Verify data consistency
      expect(reportResponse.body.report).toHaveProperty('analysis');
      expect(reportResponse.body.report).toHaveProperty('validation');
      expect(reportResponse.body.report).toHaveProperty('recommendations');
    });

    test('should handle error cases gracefully', async () => {
      // Test invalid PR trigger data
      const invalidTriggerResponse = await request(app)
        .post('/trigger')
        .send({ invalid: 'data' });
      
      // Should handle gracefully without crashing
      expect(invalidTriggerResponse.status).toBe(200);
    });

    test('should maintain consistency across multiple requests', async () => {
      // Run analysis twice
      const firstAnalysis = await request(app).post('/analyze');
      const secondAnalysis = await request(app).post('/analyze');
      
      expect(firstAnalysis.status).toBe(200);
      expect(secondAnalysis.status).toBe(200);
      
      // Results should be reasonably consistent (allowing for workflow file changes during tests)
      const firstCount = firstAnalysis.body.summary.totalWorkflows;
      const secondCount = secondAnalysis.body.summary.totalWorkflows;
      
      expect(Math.abs(firstCount - secondCount)).toBeLessThanOrEqual(1);
    });
  });

  describe('Performance Tests', () => {
    test('should complete analysis within reasonable time', async () => {
      const startTime = Date.now();
      
      const response = await request(app).post('/analyze');
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
    });

    test('should handle concurrent requests', async () => {
      const promises = [
        request(app).get('/health'),
        request(app).get('/status'),
        request(app).get('/mcp/info')
      ];

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});

/**
 * Helper function to create test workflow files
 */
async function createTestWorkflowFiles() {
  const testWorkflow = `
name: Test Agent Workflow
on:
  pull_request:
    branches: [main]
  workflow_dispatch:
    inputs:
      action:
        description: 'Action to perform'
        required: true
        default: 'analyze'
jobs:
  test-agent:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Test step
        run: echo "Testing agent workflow"
`;

  const testWorkflowPath = path.join(process.cwd(), '.github', 'workflows', 'test-agent.yml');
  
  try {
    // Create directory structure if needed
    await fs.mkdir(path.dirname(testWorkflowPath), { recursive: true });
    
    // Write test workflow (only if it doesn't exist to avoid conflicts)
    try {
      await fs.access(testWorkflowPath);
    } catch {
      await fs.writeFile(testWorkflowPath, testWorkflow);
    }
  } catch (error) {
    console.warn('Could not create test workflow file:', error.message);
  }
}