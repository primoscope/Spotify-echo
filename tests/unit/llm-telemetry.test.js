/**
 * Unit Tests for LLM Telemetry System
 */

const llmTelemetry = require('../../src/chat/llm-telemetry');
const BaseLLMProvider = require('../../src/chat/llm-providers/base-provider');

describe('LLM Telemetry Unit Tests', () => {
  let mockProvider1, mockProvider2;

  beforeAll(() => {
    llmTelemetry.initialize({ 
      collectionIntervalMs: 100, // Fast collection for testing
      historyRetentionHours: 1
    });
  });

  afterAll(() => {
    llmTelemetry.stopCollection();
  });

  beforeEach(async () => {
    // Create mock providers
    class MockProvider extends BaseLLMProvider {
      constructor(name, config = {}) {
        super({ enableTelemetry: true, ...config });
        this.providerName = name;
        this.shouldFail = false;
        this.latency = 100;
      }

      async _generateCompletion(messages, options = {}) {
        await new Promise(resolve => setTimeout(resolve, this.latency));
        
        if (this.shouldFail) {
          throw new Error(`${this.providerName} simulated failure`);
        }

        return {
          content: `Response from ${this.providerName}`,
          role: 'assistant',
          model: `${this.providerName}-model`
        };
      }

      validateConfig() { return true; }
    }

    mockProvider1 = new MockProvider('provider1');
    mockProvider2 = new MockProvider('provider2');
    
    await mockProvider1.initialize();
    await mockProvider2.initialize();

    // Reset telemetry
    llmTelemetry.resetMetrics();
  });

  afterEach(() => {
    llmTelemetry.unregisterProvider('provider1');
    llmTelemetry.unregisterProvider('provider2');
  });

  describe('Provider Registration', () => {
    test('should register providers correctly', () => {
      llmTelemetry.registerProvider('provider1', mockProvider1);
      
      const metrics = llmTelemetry.getProviderMetrics('provider1');
      expect(metrics).toBeDefined();
      expect(metrics.current).toBeNull(); // No activity yet
      expect(Array.isArray(metrics.history)).toBe(true);
    });

    test('should unregister providers correctly', () => {
      llmTelemetry.registerProvider('provider1', mockProvider1);
      llmTelemetry.unregisterProvider('provider1');
      
      const metrics = llmTelemetry.getProviderMetrics('provider1');
      expect(metrics).toBeNull();
    });
  });

  describe('Metrics Collection', () => {
    beforeEach(() => {
      llmTelemetry.registerProvider('provider1', mockProvider1);
      llmTelemetry.registerProvider('provider2', mockProvider2);
    });

    test('should collect current metrics from registered providers', async () => {
      // Generate some activity
      await mockProvider1.generateCompletion([{ role: 'user', content: 'Test 1' }]);
      await mockProvider2.generateCompletion([{ role: 'user', content: 'Test 2' }]);
      
      const currentMetrics = llmTelemetry.getCurrentMetrics();
      
      expect(currentMetrics).toHaveProperty('timestamp');
      expect(currentMetrics).toHaveProperty('providers');
      expect(currentMetrics).toHaveProperty('aggregated');
      
      expect(currentMetrics.providers.provider1).toBeDefined();
      expect(currentMetrics.providers.provider2).toBeDefined();
      
      expect(currentMetrics.providers.provider1.requests).toBe(1);
      expect(currentMetrics.providers.provider2.requests).toBe(1);
    });

    test('should handle provider errors during collection', async () => {
      // Mock a provider that throws during getTelemetry
      mockProvider1.getTelemetry = jest.fn().mockImplementation(() => {
        throw new Error('Telemetry error');
      });
      
      const currentMetrics = llmTelemetry.getCurrentMetrics();
      
      expect(currentMetrics.providers.provider1).toBeDefined();
      expect(currentMetrics.providers.provider1.error).toBe('Telemetry error');
    });
  });

  describe('Aggregated Metrics', () => {
    beforeEach(() => {
      llmTelemetry.registerProvider('provider1', mockProvider1);
      llmTelemetry.registerProvider('provider2', mockProvider2);
    });

    test('should calculate aggregated metrics correctly', async () => {
      // Generate different amounts of activity
      await mockProvider1.generateCompletion([{ role: 'user', content: 'Test 1' }]);
      await mockProvider1.generateCompletion([{ role: 'user', content: 'Test 2' }]);
      await mockProvider2.generateCompletion([{ role: 'user', content: 'Test 3' }]);
      
      const aggregated = llmTelemetry.getAggregatedMetrics();
      
      expect(aggregated.totalRequests).toBe(3);
      expect(aggregated.totalSuccesses).toBe(3);
      expect(aggregated.totalFailures).toBe(0);
      expect(aggregated.averageLatency).toBeGreaterThan(0);
      expect(aggregated.successRate).toBe('100.00%');
      expect(aggregated.failureRate).toBe('0.00%');
      expect(aggregated.activeProviders).toBe(2);
    });

    test('should handle failures in aggregation', async () => {
      // Simulate failures
      mockProvider1.shouldFail = true;
      
      try {
        await mockProvider1.generateCompletion([{ role: 'user', content: 'Test' }]);
      } catch (error) {
        // Expected failure
      }
      
      await mockProvider2.generateCompletion([{ role: 'user', content: 'Test' }]);
      
      const aggregated = llmTelemetry.getAggregatedMetrics();
      
      expect(aggregated.totalRequests).toBe(2);
      expect(aggregated.totalSuccesses).toBe(1);
      expect(aggregated.totalFailures).toBe(1);
      expect(aggregated.successRate).toBe('50.00%');
      expect(aggregated.failureRate).toBe('50.00%');
    });
  });

  describe('Performance Insights', () => {
    beforeEach(() => {
      llmTelemetry.registerProvider('provider1', mockProvider1);
    });

    test('should generate latency recommendations', async () => {
      // Set high latency
      mockProvider1.latency = 6000; // 6 seconds
      await mockProvider1.generateCompletion([{ role: 'user', content: 'Test' }]);
      
      const insights = llmTelemetry.getPerformanceInsights();
      
      const latencyRecommendation = insights.recommendations.find(
        r => r.type === 'performance' && r.provider === 'provider1'
      );
      
      expect(latencyRecommendation).toBeDefined();
      expect(latencyRecommendation.message).toContain('High latency detected');
    });

    test('should generate reliability alerts', async () => {
      // Simulate low success rate
      mockProvider1.shouldFail = true;
      
      // Generate multiple failures
      for (let i = 0; i < 3; i++) {
        try {
          await mockProvider1.generateCompletion([{ role: 'user', content: `Test ${i}` }]);
        } catch (error) {
          // Expected failures
        }
      }
      
      // One success
      mockProvider1.shouldFail = false;
      await mockProvider1.generateCompletion([{ role: 'user', content: 'Success' }]);
      
      const insights = llmTelemetry.getPerformanceInsights();
      
      const reliabilityAlert = insights.alerts.find(
        a => a.type === 'reliability' || a.type === 'critical'
      );
      
      expect(reliabilityAlert).toBeDefined();
    });

    test('should generate retry recommendations', async () => {
      // Simulate high retry scenario
      mockProvider1.config.maxRetries = 3;
      mockProvider1.shouldFail = true;
      
      // This will cause retries before final failure
      try {
        await mockProvider1.generateCompletion([{ role: 'user', content: 'Test' }]);
      } catch (error) {
        // Expected failure after retries
      }
      
      const insights = llmTelemetry.getPerformanceInsights();
      
      const retryRecommendation = insights.recommendations.find(
        r => r.message.includes('retry')
      );
      
      // Should detect high retry rate if retries > 10% of requests
      if (mockProvider1.getTelemetry().retryAttempts > 0) {
        expect(retryRecommendation).toBeDefined();
      }
    });
  });

  describe('Metrics Export', () => {
    beforeEach(() => {
      llmTelemetry.registerProvider('provider1', mockProvider1);
    });

    test('should export metrics as JSON', async () => {
      await mockProvider1.generateCompletion([{ role: 'user', content: 'Test' }]);
      
      const jsonExport = llmTelemetry.exportMetrics('json');
      
      expect(() => JSON.parse(jsonExport)).not.toThrow();
      
      const parsed = JSON.parse(jsonExport);
      expect(parsed).toHaveProperty('aggregated');
      expect(parsed).toHaveProperty('providers');
      expect(parsed).toHaveProperty('exportTime');
      expect(parsed.providers.provider1).toBeDefined();
    });

    test('should export metrics as CSV', async () => {
      await mockProvider1.generateCompletion([{ role: 'user', content: 'Test' }]);
      
      const csvExport = llmTelemetry.exportMetrics('csv');
      
      expect(typeof csvExport).toBe('string');
      expect(csvExport).toContain('Provider,Requests,Successes');
      expect(csvExport).toContain('provider1');
      expect(csvExport).toContain('TOTAL');
    });

    test('should return object for unknown format', async () => {
      const objectExport = llmTelemetry.exportMetrics('unknown');
      
      expect(typeof objectExport).toBe('object');
      expect(objectExport).toHaveProperty('aggregated');
      expect(objectExport).toHaveProperty('providers');
    });
  });

  describe('Metrics History', () => {
    beforeEach(() => {
      llmTelemetry.registerProvider('provider1', mockProvider1);
    });

    test('should maintain metrics history', async () => {
      await mockProvider1.generateCompletion([{ role: 'user', content: 'Test' }]);
      
      // Force collection
      llmTelemetry.collectMetrics();
      
      const history = llmTelemetry.getMetricsHistory(1); // Last hour
      
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
      
      const latest = history[history.length - 1];
      expect(latest).toHaveProperty('timestamp');
      expect(latest).toHaveProperty('providers');
      expect(latest).toHaveProperty('aggregated');
    });

    test('should filter history by time range', () => {
      // Add some mock history
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      
      llmTelemetry.metricsHistory = [
        { timestamp: twoHoursAgo.toISOString(), providers: {}, aggregated: {} },
        { timestamp: oneHourAgo.toISOString(), providers: {}, aggregated: {} },
        { timestamp: now.toISOString(), providers: {}, aggregated: {} }
      ];
      
      const lastHour = llmTelemetry.getMetricsHistory(1);
      expect(lastHour.length).toBe(2); // Should exclude the 2-hour-old entry
    });
  });

  describe('Provider Metrics', () => {
    beforeEach(() => {
      llmTelemetry.registerProvider('provider1', mockProvider1);
    });

    test('should get provider-specific metrics', async () => {
      await mockProvider1.generateCompletion([{ role: 'user', content: 'Test' }]);
      
      const providerMetrics = llmTelemetry.getProviderMetrics('provider1');
      
      expect(providerMetrics).toBeDefined();
      expect(providerMetrics.current).toBeDefined();
      expect(providerMetrics.current.requests).toBe(1);
      expect(Array.isArray(providerMetrics.history)).toBe(true);
    });

    test('should return null for non-existent provider', () => {
      const providerMetrics = llmTelemetry.getProviderMetrics('non-existent');
      expect(providerMetrics).toBeNull();
    });

    test('should maintain provider metrics history', async () => {
      await mockProvider1.generateCompletion([{ role: 'user', content: 'Test 1' }]);
      
      // Force collection to update history
      llmTelemetry.collectMetrics();
      
      await mockProvider1.generateCompletion([{ role: 'user', content: 'Test 2' }]);
      
      // Force another collection
      llmTelemetry.collectMetrics();
      
      const providerMetrics = llmTelemetry.getProviderMetrics('provider1');
      
      expect(providerMetrics.history.length).toBeGreaterThanOrEqual(1);
      
      const latestHistory = providerMetrics.history[providerMetrics.history.length - 1];
      expect(latestHistory.requests).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Metrics Reset', () => {
    beforeEach(() => {
      llmTelemetry.registerProvider('provider1', mockProvider1);
      llmTelemetry.registerProvider('provider2', mockProvider2);
    });

    test('should reset all metrics', async () => {
      // Generate some activity
      await mockProvider1.generateCompletion([{ role: 'user', content: 'Test' }]);
      await mockProvider2.generateCompletion([{ role: 'user', content: 'Test' }]);
      
      llmTelemetry.collectMetrics();
      
      // Verify metrics exist
      const beforeReset = llmTelemetry.getAggregatedMetrics();
      expect(beforeReset.totalRequests).toBeGreaterThan(0);
      
      // Reset
      llmTelemetry.resetMetrics();
      
      // Verify metrics are reset
      const afterReset = llmTelemetry.getAggregatedMetrics();
      expect(afterReset.totalRequests).toBe(0);
      expect(afterReset.totalSuccesses).toBe(0);
      expect(afterReset.totalFailures).toBe(0);
      
      // Verify history is cleared
      const history = llmTelemetry.getMetricsHistory();
      expect(history.length).toBe(0);
      
      // Verify provider metrics are reset
      const provider1Telemetry = mockProvider1.getTelemetry();
      expect(provider1Telemetry.requests).toBe(0);
    });
  });
});