/**
 * Enhanced MCP API Endpoints Integration Tests
 * Tests the enhanced MCP endpoints with environment-aware behavior
 */

const request = require('supertest');
const express = require('express');

// Create mocks before requiring the actual modules
const mockOrchestrator = {
  getModelStatistics: jest.fn(),
  healthCheck: jest.fn(),
  optimizeModelSelection: jest.fn(),
  models: {}
};

const mockWorkflowManager = {
  getWorkflowStatus: jest.fn(),
  healthCheckMCPServers: jest.fn(),
  executeCodeAgentWorkflow: jest.fn(),
  mcpServers: new Map()
};

// Mock the modules
jest.mock('../../src/mcp/enhanced-multimodel-orchestrator', () => {
  return jest.fn().mockImplementation(() => mockOrchestrator);
});

jest.mock('../../src/mcp/workflow-integration-manager', () => {
  return jest.fn().mockImplementation(() => mockWorkflowManager);
});

const enhancedMcpRouter = require('../../src/api/routes/enhanced-mcp');

describe('Enhanced MCP API Endpoints', () => {
  let app;

  beforeEach(() => {
    // Create Express app with MCP routes
    app = express();
    app.use(express.json());
    app.use('/api/enhanced-mcp', enhancedMcpRouter);

    // Setup mock implementations
    mockOrchestrator.getModelStatistics.mockReturnValue({
      'gpt-4': { provider: 'openai', capabilities: ['text-generation', 'code-analysis'] },
      'gemini-pro': { provider: 'google', capabilities: ['text-generation', 'multimodal'] }
    });

    mockOrchestrator.healthCheck.mockResolvedValue({
      overall: 'healthy',
      models: {
        'gpt-4': { status: 'healthy', latency: 120 },
        'gemini-pro': { status: 'healthy', latency: 95 }
      }
    });

    mockWorkflowManager.getWorkflowStatus.mockReturnValue({
      statistics: {
        totalExecutions: 15,
        successRate: 0.93,
        averageExecutionTime: 2500
      }
    });

    mockWorkflowManager.healthCheckMCPServers.mockResolvedValue({
      servers: {
        mcpHealth: { status: 'healthy' },
        mcpOrchestrator: { status: 'healthy' },
        mcpWorkflow: { status: 'healthy' },
        browserbase: { status: process.env.BROWSERBASE_API_KEY ? 'healthy' : 'skipped' }
      }
    });

    mockWorkflowManager.executeCodeAgentWorkflow.mockResolvedValue({
      workflowId: 'test-workflow-123',
      status: 'completed',
      results: { success: true }
    });

    mockOrchestrator.models = {
      'gpt-4': { provider: 'openai' },
      'gemini-pro': { provider: 'google' }
    };
    // Setup MCP servers map
    mockWorkflowManager.mcpServers = new Map([
      ['mcpHealth', { capabilities: ['health-monitoring'] }],
      ['mcpOrchestrator', { capabilities: ['server-orchestration'] }],
      ['mcpWorkflow', { capabilities: ['workflow-execution'] }]
    ]);

    // Add Browserbase server conditionally
    if (process.env.BROWSERBASE_API_KEY && process.env.BROWSERBASE_PROJECT_ID) {
      mockWorkflowManager.mcpServers.set('browserbase', { 
        capabilities: ['browser-automation', 'cloud-browser'] 
      });
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/enhanced-mcp/health', () => {
    it('should return healthy status when all systems are operational', async () => {
      // Mock healthCheckMCPServers to return all healthy statuses (including browserbase as healthy, not skipped)
      mockWorkflowManager.healthCheckMCPServers.mockResolvedValue({
        servers: {
          mcpHealth: { status: 'healthy' },
          mcpOrchestrator: { status: 'healthy' },
          mcpWorkflow: { status: 'healthy' },
          browserbase: { status: 'healthy' } // Set as healthy for this test
        }
      });

      const response = await request(app)
        .get('/api/enhanced-mcp/health')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        status: 'healthy',
        models: {
          overall: 'healthy'
        },
        mcpServers: {
          servers: expect.objectContaining({
            mcpHealth: { status: 'healthy' },
            mcpOrchestrator: { status: 'healthy' },
            mcpWorkflow: { status: 'healthy' }
          })
        }
      });

      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return degraded status when Browserbase is skipped due to missing environment', async () => {
      // Reset to default mock behavior (Browserbase skipped)
      mockWorkflowManager.healthCheckMCPServers.mockResolvedValue({
        servers: {
          mcpHealth: { status: 'healthy' },
          mcpOrchestrator: { status: 'healthy' },
          mcpWorkflow: { status: 'healthy' },
          browserbase: { status: 'skipped' }
        }
      });

      const response = await request(app)
        .get('/api/enhanced-mcp/health')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        status: 'degraded', // Should be degraded because Browserbase is skipped
        models: {
          overall: 'healthy'
        },
        mcpServers: {
          servers: expect.objectContaining({
            mcpHealth: { status: 'healthy' },
            mcpOrchestrator: { status: 'healthy' },
            mcpWorkflow: { status: 'healthy' },
            browserbase: { status: 'skipped' }
          })
        }
      });
    });

    it('should handle Browserbase server status based on environment', async () => {
      const response = await request(app)
        .get('/api/enhanced-mcp/health')
        .expect(200);

      const browserbaseStatus = response.body.mcpServers.servers.browserbase;
      
      if (process.env.BROWSERBASE_API_KEY && process.env.BROWSERBASE_PROJECT_ID) {
        expect(browserbaseStatus.status).toBe('healthy');
      } else {
        expect(browserbaseStatus.status).toBe('skipped');
      }
    });

    it('should return degraded status when some systems are unhealthy', async () => {
      mockOrchestrator.healthCheck.mockResolvedValue({
        overall: 'degraded',
        models: {
          'gpt-4': { status: 'healthy', latency: 120 },
          'gemini-pro': { status: 'error', latency: null }
        }
      });

      const response = await request(app)
        .get('/api/enhanced-mcp/health')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        status: 'degraded',
        models: {
          overall: 'degraded'
        }
      });
    });
  });

  describe('GET /api/enhanced-mcp/capabilities', () => {
    it('should return comprehensive system capabilities', async () => {
      const response = await request(app)
        .get('/api/enhanced-mcp/capabilities')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        capabilities: {
          models: {
            available: expect.arrayContaining(['gpt-4', 'gemini-pro']),
            totalCapabilities: expect.arrayContaining(['text-generation', 'code-analysis', 'multimodal']),
            providers: expect.arrayContaining(['openai', 'google'])
          },
          workflows: {
            available: expect.arrayContaining([
              'full-stack-development',
              'code-review-and-optimization',
              'bug-diagnosis-and-fix'
            ]),
            statistics: {
              totalExecutions: 15,
              successRate: 0.93,
              averageExecutionTime: 2500
            }
          },
          mcpServers: {
            available: expect.arrayContaining(['mcpHealth', 'mcpOrchestrator', 'mcpWorkflow']),
            capabilities: expect.arrayContaining(['health-monitoring', 'server-orchestration', 'workflow-execution'])
          }
        }
      });

      expect(response.body).toHaveProperty('timestamp');
    });

    it('should include Browserbase capabilities when available', async () => {
      if (process.env.BROWSERBASE_API_KEY && process.env.BROWSERBASE_PROJECT_ID) {
        const response = await request(app)
          .get('/api/enhanced-mcp/capabilities')
          .expect(200);

        expect(response.body.capabilities.mcpServers.available).toContain('browserbase');
        expect(response.body.capabilities.mcpServers.capabilities).toEqual(
          expect.arrayContaining(['browser-automation', 'cloud-browser'])
        );
      } else {
        // When Browserbase is not available, it should still work without it
        const response = await request(app)
          .get('/api/enhanced-mcp/capabilities')
          .expect(200);

        expect(response.body.capabilities.mcpServers.available).not.toContain('browserbase');
      }
    });
  });

  describe('POST /api/enhanced-mcp/workflow/full-stack', () => {
    it('should execute full-stack development workflow', async () => {
      const requestBody = {
        requirements: 'Build a user authentication system',
        technology_stack: 'Node.js + React + MongoDB',
        database_type: 'MongoDB'
      };

      const response = await request(app)
        .post('/api/enhanced-mcp/workflow/full-stack')
        .send(requestBody)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        workflowId: 'test-workflow-123',
        status: 'completed',
        results: { success: true }
      });

      expect(mockWorkflowManager.executeCodeAgentWorkflow).toHaveBeenCalledWith(
        'full-stack-development',
        expect.objectContaining(requestBody)
      );
    });

    it('should return 400 for missing requirements', async () => {
      const response = await request(app)
        .post('/api/enhanced-mcp/workflow/full-stack')
        .send({ technology_stack: 'Node.js + React + MongoDB' })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Missing required field: requirements'
      });
    });
  });

  describe('POST /api/enhanced-mcp/workflow/code-review', () => {
    it('should execute code review workflow', async () => {
      const requestBody = {
        code_path: '/src/components/UserAuth.js',
        focus_areas: ['security', 'performance']
      };

      const response = await request(app)
        .post('/api/enhanced-mcp/workflow/code-review')
        .send(requestBody)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        workflowId: 'test-workflow-123',
        status: 'completed'
      });

      expect(mockWorkflowManager.executeCodeAgentWorkflow).toHaveBeenCalledWith(
        'code-review-and-optimization',
        expect.objectContaining(requestBody)
      );
    });

    it('should return 400 for missing code_path', async () => {
      const response = await request(app)
        .post('/api/enhanced-mcp/workflow/code-review')
        .send({ focus_areas: ['security'] })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Missing required field: code_path'
      });
    });
  });

  describe('POST /api/enhanced-mcp/workflow/bug-fix', () => {
    it('should execute bug fix workflow', async () => {
      const requestBody = {
        bug_description: 'User login fails with 500 error',
        error_logs: 'TypeError: Cannot read property "id" of null',
        affected_files: ['/src/auth/login.js', '/src/models/User.js']
      };

      const response = await request(app)
        .post('/api/enhanced-mcp/workflow/bug-fix')
        .send(requestBody)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        workflowId: 'test-workflow-123',
        status: 'completed'
      });

      expect(mockWorkflowManager.executeCodeAgentWorkflow).toHaveBeenCalledWith(
        'bug-diagnosis-and-fix',
        expect.objectContaining(requestBody)
      );
    });

    it('should return 400 for missing bug_description', async () => {
      const response = await request(app)
        .post('/api/enhanced-mcp/workflow/bug-fix')
        .send({ error_logs: 'Some error occurred' })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Missing required field: bug_description'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle orchestrator errors gracefully', async () => {
      mockOrchestrator.healthCheck.mockRejectedValue(new Error('Orchestrator connection failed'));

      const response = await request(app)
        .get('/api/enhanced-mcp/health')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Health check failed',
        message: 'Orchestrator connection failed'
      });
    });

    it('should handle workflow manager errors gracefully', async () => {
      mockWorkflowManager.executeCodeAgentWorkflow.mockRejectedValue(
        new Error('Workflow execution failed')
      );

      const response = await request(app)
        .post('/api/enhanced-mcp/workflow/full-stack')
        .send({ requirements: 'Build an app' })
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Failed to execute full-stack workflow',
        message: 'Workflow execution failed'
      });
    });
  });

  describe('Environment-Aware Testing', () => {
    it('should gracefully handle missing Browserbase environment variables', () => {
      // This test verifies that the application doesn't crash when Browserbase envs are missing
      expect(() => {
        const testApp = express();
        testApp.use(express.json());
        testApp.use('/api/enhanced-mcp', enhancedMcpRouter);
      }).not.toThrow();
    });

    it('should include appropriate logging for missing environment variables', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await request(app)
          .get('/api/enhanced-mcp/health')
          .expect(200);

        // The absence of Browserbase should be handled gracefully without errors
        expect(consoleSpy).not.toHaveBeenCalledWith(
          expect.stringMatching(/error.*browserbase/i)
        );
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });
});