/**
 * Tests for streaming chat SSE functionality
 */

const request = require('supertest');
const express = require('express');
const chatRoutes = require('../../src/api/routes/chat');

// Mock dependencies
jest.mock('../../src/chat/chatbot');
jest.mock('../../src/api/middleware', () => ({
  requireAuth: (req, res, next) => next(),
  createRateLimit: () => (req, res, next) => next(),
}));

const app = express();
app.use(express.json());
app.use('/api/chat', chatRoutes);

describe('Streaming Chat API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/chat/stream', () => {
    it('should return SSE headers for streaming endpoint', async () => {
      const response = await request(app)
        .get('/api/chat/stream')
        .query({
          sessionId: 'test-session',
          message: 'Hello, test message'
        });

      expect(response.headers['content-type']).toBe('text/event-stream');
      expect(response.headers['cache-control']).toBe('no-cache');
      expect(response.headers['connection']).toBe('keep-alive');
    });

    it('should require sessionId and message parameters', async () => {
      const response = await request(app)
        .get('/api/chat/stream')
        .query({
          sessionId: 'test-session'
          // Missing message parameter
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required fields');
    });

    it('should include X-Request-ID header in response', async () => {
      const requestId = 'test-request-123';
      const response = await request(app)
        .get('/api/chat/stream')
        .set('x-request-id', requestId)
        .query({
          sessionId: 'test-session',
          message: 'Hello'
        });

      expect(response.headers['x-request-id']).toBeDefined();
    });
  });

  describe('GET /api/chat/providers/health', () => {
    it('should return provider health information', async () => {
      const response = await request(app)
        .get('/api/chat/providers/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.providers).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
    });

    it('should include provider metrics in health response', async () => {
      const response = await request(app)
        .get('/api/chat/providers/health');

      expect(response.status).toBe(200);
      const providers = response.body.providers;
      
      // Check if provider health data has expected structure
      Object.keys(providers).forEach(providerId => {
        const provider = providers[providerId];
        expect(provider).toHaveProperty('state');
        expect(provider).toHaveProperty('health');
        expect(provider).toHaveProperty('avgLatency');
        expect(provider).toHaveProperty('successRate');
      });
    });
  });

  describe('POST /api/chat/providers/switch', () => {
    it('should allow switching providers', async () => {
      const response = await request(app)
        .post('/api/chat/providers/switch')
        .send({
          provider: 'gemini',
          model: 'gemini-1.5-flash'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.provider).toBe('gemini');
    });

    it('should require provider parameter', async () => {
      const response = await request(app)
        .post('/api/chat/providers/switch')
        .send({
          model: 'some-model'
          // Missing provider parameter
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Provider is required');
    });
  });
});

describe('Provider Manager Tests', () => {
  const LLMProviderManager = require('../../src/chat/llm-provider-manager');

  let providerManager;

  beforeEach(() => {
    providerManager = new LLMProviderManager();
  });

  describe('recordRequestLatency', () => {
    it('should record telemetry data with success', () => {
      const providerId = 'test-provider';
      const latency = 500;
      const success = true;
      const requestId = 'test-request-123';

      // Mock the circuit breaker
      providerManager.circuitBreakers.set(providerId, {
        state: 'CLOSED',
        failureCount: 0,
        successCount: 0,
        consecutiveLatencyFailures: 0,
        recentLatencies: [],
        config: {
          latencyThreshold: 2000,
          failureThreshold: 5,
          consecutiveLatencyThreshold: 5
        }
      });

      // This should not throw an error
      expect(() => {
        providerManager.recordRequestLatency(providerId, latency, success, requestId);
      }).not.toThrow();

      const breaker = providerManager.circuitBreakers.get(providerId);
      expect(breaker.successCount).toBe(1);
      expect(breaker.recentLatencies).toContain(latency);
    });

    it('should handle circuit breaker state changes', () => {
      const providerId = 'test-provider';
      
      // Set up circuit breaker with low thresholds for testing
      providerManager.circuitBreakers.set(providerId, {
        state: 'CLOSED',
        failureCount: 4, // Close to threshold
        successCount: 0,
        consecutiveLatencyFailures: 0,
        recentLatencies: [],
        config: {
          latencyThreshold: 2000,
          failureThreshold: 5, // Will trigger after one more failure
          consecutiveLatencyThreshold: 5
        }
      });

      // Record a failure - should trigger circuit breaker
      providerManager.recordRequestLatency(providerId, 500, false);

      const breaker = providerManager.circuitBreakers.get(providerId);
      expect(breaker.failureCount).toBe(5);
    });
  });

  describe('getTelemetryData', () => {
    it('should return telemetry metrics for a provider', async () => {
      const providerId = 'test-provider';
      const telemetryData = await providerManager.getTelemetryData(providerId);

      expect(telemetryData).toBeDefined();
      expect(telemetryData).toHaveProperty('avgLatency');
      expect(telemetryData).toHaveProperty('p50Latency');
      expect(telemetryData).toHaveProperty('p95Latency');
      expect(telemetryData).toHaveProperty('successRate');
      expect(telemetryData).toHaveProperty('requestCount');
    });
  });

  describe('switchProvider', () => {
    it('should switch to available provider', async () => {
      const providerId = 'gemini';
      
      // Mock available providers
      providerManager.providers.set(providerId, {
        name: 'Gemini',
        model: 'gemini-1.5-flash'
      });
      
      providerManager.circuitBreakers.set(providerId, {
        state: 'CLOSED'
      });

      const result = await providerManager.switchProvider(providerId);
      
      expect(result.provider).toBe(providerId);
      expect(providerManager.currentProvider).toBe(providerId);
    });

    it('should reject switching to provider with open circuit breaker', async () => {
      const providerId = 'openai';
      
      providerManager.providers.set(providerId, {
        name: 'OpenAI'
      });
      
      providerManager.circuitBreakers.set(providerId, {
        state: 'OPEN'
      });

      await expect(providerManager.switchProvider(providerId))
        .rejects.toThrow('circuit breaker is open');
    });
  });
});

describe('Telemetry System Tests', () => {
  const llmTelemetry = require('../../src/chat/llm-telemetry');

  beforeEach(() => {
    // Reset telemetry state
    llmTelemetry.resetMetrics();
  });

  describe('recordRequest', () => {
    it('should record request data', () => {
      const providerId = 'test-provider';
      const data = {
        latency: 750,
        success: true,
        requestId: 'test-123',
        timestamp: Date.now()
      };

      // Register provider first
      llmTelemetry.registerProvider(providerId, {
        getTelemetry: () => ({ requests: 0, successes: 0 })
      });

      expect(() => {
        llmTelemetry.recordRequest(providerId, data);
      }).not.toThrow();
    });
  });

  describe('getProviderMetrics', () => {
    it('should calculate metrics correctly', async () => {
      const providerId = 'test-provider';
      
      // Register provider
      llmTelemetry.registerProvider(providerId, {
        getTelemetry: () => ({ requests: 0, successes: 0 })
      });

      // Record some test data
      const testData = [
        { latency: 100, success: true, timestamp: Date.now() },
        { latency: 200, success: true, timestamp: Date.now() },
        { latency: 300, success: false, timestamp: Date.now() },
        { latency: 400, success: true, timestamp: Date.now() }
      ];

      testData.forEach(data => {
        llmTelemetry.recordRequest(providerId, data);
      });

      const metrics = await llmTelemetry.getProviderMetrics(providerId);
      
      expect(metrics.requestCount).toBe(4);
      expect(metrics.successRate).toBe(75); // 3 out of 4 successful
      expect(metrics.avgLatency).toBe(250); // (100+200+300+400)/4
    });
  });
});

module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/api/routes/chat.js',
    'src/chat/llm-provider-manager.js',
    'src/chat/llm-telemetry.js'
  ],
  coverageReporters: ['text', 'lcov'],
  testMatch: [
    '**/tests/**/*.test.js'
  ]
};