const request = require('supertest');
const express = require('express');

// Mock the dependencies
jest.mock('../../src/chat/llm-provider-manager', () => ({
  getProviderStatus: jest.fn(() => ({
    providers: {
      mock: {
        name: 'Mock Provider',
        available: true,
        status: 'connected',
        model: 'mock-model',
        performance: {
          averageLatency: 150,
          successRate: 100,
          totalRequests: 42
        }
      },
      openai: {
        name: 'OpenAI',
        available: false,
        status: 'error',
        model: null,
        performance: null
      }
    },
    current: 'mock'
  })),
  testProvider: jest.fn(() => Promise.resolve(true)),
  currentProvider: 'mock',
  providerConfigs: new Map()
}));

jest.mock('../../src/chat/llm-telemetry', () => ({
  getCurrentMetrics: jest.fn(() => ({
    providers: {
      mock: {
        averageLatency: 150,
        successRate: 100,
        totalRequests: 42,
        totalFailures: 0,
        lastRequestTime: new Date().toISOString(),
        recentLatencies: [120, 140, 160, 150, 130]
      },
      openai: {
        averageLatency: null,
        successRate: null,
        totalRequests: 0,
        totalFailures: 5,
        lastRequestTime: null,
        recentLatencies: []
      }
    },
    aggregated: {
      totalRequests: 42,
      totalSuccesses: 42,
      totalFailures: 5,
      averageLatency: 150,
      startTime: new Date().toISOString()
    }
  }))
}));

const app = express();
app.use(express.json());

// Import the router after mocking
const providersRouter = require('../../src/api/routes/providers');
app.use('/api/providers', providersRouter);

describe('Enhanced Providers API', () => {
  describe('GET /api/providers/health', () => {
    it('should return enhanced health data with telemetry', async () => {
      const response = await request(app)
        .get('/api/providers/health')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        status: 'healthy', // 1/2 providers connected = 50% >= 50% threshold
        providers: {
          mock: {
            name: 'Mock Provider',
            available: true,
            status: 'connected',
            model: 'mock-model',
            performance: {
              averageLatency: 150,
              successRate: 100,
              totalRequests: 42
            },
            telemetry: {
              averageLatency: 150,
              successRate: 100,
              requests: 42,
              errors: 0,
              lastRequestTime: expect.any(String),
              recentLatencies: [120, 140, 160, 150, 130]
            }
          },
          openai: {
            name: 'OpenAI',
            available: false,
            status: 'error',
            model: null,
            performance: null,
            telemetry: {
              averageLatency: null,
              successRate: null,
              requests: 0,
              errors: 5,
              lastRequestTime: null,
              recentLatencies: []
            }
          }
        },
        aggregated: {
          totalRequests: 42,
          totalSuccesses: 42,
          totalFailures: 5,
          averageLatency: 150,
          startTime: expect.any(String)
        },
        timestamp: expect.any(String)
      });
    });

    it('should handle telemetry errors gracefully', async () => {
      // Mock telemetry to throw error
      require('../../src/chat/llm-telemetry').getCurrentMetrics.mockImplementationOnce(() => {
        throw new Error('Telemetry unavailable');
      });

      const response = await request(app)
        .get('/api/providers/health')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Failed to get providers health'
      });
    });

    it('should determine overall status correctly', async () => {
      // Test degraded status (< 50% providers healthy)
      require('../../src/chat/llm-provider-manager').getProviderStatus.mockReturnValueOnce({
        providers: {
          mock: { status: 'error', available: false },
          openai: { status: 'connected', available: true },
          gemini: { status: 'error', available: false }
        },
        current: 'openai'
      });

      const response = await request(app)
        .get('/api/providers/health')
        .expect(200);

      expect(response.body.status).toBe('degraded'); // 1/3 = 33% < 50%
    });
  });

  describe('GET /api/providers', () => {
    it('should list all providers with performance data', async () => {
      const response = await request(app)
        .get('/api/providers')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.providers).toHaveLength(2);
      expect(response.body.current).toBe('mock');
      
      const mockProvider = response.body.providers.find(p => p.id === 'mock');
      expect(mockProvider).toEqual({
        id: 'mock',
        name: 'Mock Provider',
        available: true,
        status: 'connected',
        model: 'mock-model',
        performance: {
          averageLatency: 150,
          successRate: 100,
          requests: 42
        }
      });
    });
  });

  describe('POST /api/providers/switch', () => {
    it('should switch provider successfully', async () => {
      const response = await request(app)
        .post('/api/providers/switch')
        .send({ provider: 'mock', model: 'mock-model' })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        current: {
          provider: 'mock',
          model: 'mock-model'
        }
      });
    });

    it('should reject unknown provider', async () => {
      const response = await request(app)
        .post('/api/providers/switch')
        .send({ provider: 'unknown' })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'unknown provider'
      });
    });

    it('should reject unavailable provider', async () => {
      const response = await request(app)
        .post('/api/providers/switch')
        .send({ provider: 'openai' })
        .expect(409);

      expect(response.body).toEqual({
        success: false,
        error: 'provider unavailable'
      });
    });
  });
});