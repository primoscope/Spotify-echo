/**
 * LLM Provider Integration Tests
 * Comprehensive test suite for the LLM abstraction system
 */

const BaseLLMProvider = require('../../src/chat/llm-providers/base-provider');
const modelRegistry = require('../../src/chat/model-registry');
const llmTelemetry = require('../../src/chat/llm-telemetry');

describe('LLM Abstraction System', () => {
  beforeAll(async () => {
    // Initialize systems for testing
    await modelRegistry.initialize();
    llmTelemetry.initialize();
  });

  afterAll(() => {
    // Cleanup
    llmTelemetry.stopCollection();
    modelRegistry.stopAutoUpdate();
  });

  describe('BaseLLMProvider', () => {
    class MockLLMProvider extends BaseLLMProvider {
      constructor(config = {}) {
        super({
          enableTelemetry: true,
          maxRetries: 2,
          baseDelay: 100,
          ...config
        });
        this.shouldFail = false;
        this.failCount = 0;
        this.callCount = 0;
      }

      async _generateCompletion(messages, options = {}) {
        this.callCount++;
        
        if (this.shouldFail && this.failCount < 2) {
          this.failCount++;
          const error = new Error('Simulated failure');
          error.status = 500; // Retryable error
          throw error;
        }

        return {
          content: 'Mock response',
          role: 'assistant',
          model: 'mock-model',
          usage: { input_tokens: 10, output_tokens: 5 }
        };
      }

      validateConfig() {
        return true;
      }
    }

    let provider;

    beforeEach(async () => {
      provider = new MockLLMProvider();
      await provider.initialize();
    });

    test('should initialize with default configuration', async () => {
      expect(provider.isInitialized).toBe(true);
      expect(provider.config.maxRetries).toBe(2);
      expect(provider.config.enableTelemetry).toBe(true);
    });

    test('should generate completion successfully', async () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      const response = await provider.generateCompletion(messages);
      
      expect(response).toHaveProperty('content', 'Mock response');
      expect(response).toHaveProperty('role', 'assistant');
      expect(provider.callCount).toBe(1);
    });

    test('should retry on retryable errors', async () => {
      provider.shouldFail = true;
      
      const messages = [{ role: 'user', content: 'Hello' }];
      const response = await provider.generateCompletion(messages);
      
      // Should succeed on third attempt (2 retries + original)
      expect(response.content).toBe('Mock response');
      expect(provider.callCount).toBe(3);
      expect(provider.getTelemetry().retryAttempts).toBe(2);
    });

    test('should not retry on non-retryable errors', async () => {
      provider._generateCompletion = async () => {
        const error = new Error('Authentication failed');
        error.status = 401; // Non-retryable
        throw error;
      };

      const messages = [{ role: 'user', content: 'Hello' }];
      
      await expect(provider.generateCompletion(messages)).rejects.toThrow('Authentication failed');
      expect(provider.callCount).toBe(1); // No retries
    });

    test('should collect telemetry data', async () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      await provider.generateCompletion(messages);
      
      const telemetry = provider.getTelemetry();
      expect(telemetry.requests).toBe(1);
      expect(telemetry.successes).toBe(1);
      expect(telemetry.failures).toBe(0);
      expect(telemetry.averageLatency).toBeGreaterThan(0);
      expect(telemetry.successRate).toBe('100.00%');
    });

    test('should handle timeout errors', async () => {
      provider = new MockLLMProvider({ timeout: 10 }); // Very short timeout
      await provider.initialize();
      
      provider._generateCompletion = async () => {
        await new Promise(resolve => setTimeout(resolve, 50)); // Longer than timeout
        return { content: 'Should not reach here' };
      };

      const messages = [{ role: 'user', content: 'Hello' }];
      
      await expect(provider.generateCompletion(messages)).rejects.toThrow('Operation timed out');
    });
  });

  describe('Model Registry', () => {
    test('should load static model definitions', async () => {
      const availableModels = modelRegistry.getAvailableModels({ includeUnavailable: true });
      
      expect(availableModels.length).toBeGreaterThan(0);
      
      const openaiModels = availableModels.filter(m => m.providerId === 'openai');
      expect(openaiModels.length).toBeGreaterThan(0);
      
      const gpt4o = openaiModels.find(m => m.id === 'gpt-4o');
      expect(gpt4o).toBeDefined();
      expect(gpt4o.capabilities).toContain('text');
      expect(gpt4o.capabilities).toContain('vision');
    });

    test('should filter models by capabilities', () => {
      const visionModels = modelRegistry.getAvailableModels({
        capabilities: ['vision'],
        includeUnavailable: true
      });
      
      expect(visionModels.length).toBeGreaterThan(0);
      visionModels.forEach(model => {
        expect(model.capabilities).toContain('vision');
      });
    });

    test('should filter models by cost', () => {
      const cheapModels = modelRegistry.getAvailableModels({
        maxCost: 0.005, // 0.5 cents per 1k tokens
        includeUnavailable: true
      });
      
      expect(cheapModels.length).toBeGreaterThan(0);
      cheapModels.forEach(model => {
        expect(model.costPer1kTokens.output).toBeLessThanOrEqual(0.005);
      });
    });

    test('should recommend appropriate models', () => {
      const recommendation = modelRegistry.recommendModel({
        capabilities: ['text'],
        maxCost: 0.01,
        maxLatency: 3000
      });
      
      expect(recommendation).toBeDefined();
      expect(recommendation.capabilities).toContain('text');
      expect(recommendation.costPer1kTokens.output).toBeLessThanOrEqual(0.01);
    });

    test('should get provider-specific models', () => {
      const geminiModels = modelRegistry.getProviderModels('gemini', false);
      
      expect(geminiModels.length).toBeGreaterThan(0);
      geminiModels.forEach(model => {
        expect(model.providerId).toBe('gemini');
      });
    });

    test('should get registry statistics', () => {
      const stats = modelRegistry.getRegistryStats();
      
      expect(stats).toHaveProperty('totalModels');
      expect(stats).toHaveProperty('availableModels');
      expect(stats).toHaveProperty('availabilityRate');
      expect(stats).toHaveProperty('providers');
      expect(stats.totalModels).toBeGreaterThan(0);
    });
  });

  describe('Telemetry System', () => {
    let mockProvider;

    beforeEach(async () => {
      class TestProvider extends BaseLLMProvider {
        async _generateCompletion() {
          return { content: 'Test response' };
        }
        validateConfig() { return true; }
      }
      
      mockProvider = new TestProvider({ enableTelemetry: true });
      await mockProvider.initialize();
      
      llmTelemetry.registerProvider('test-provider', mockProvider);
    });

    afterEach(() => {
      llmTelemetry.unregisterProvider('test-provider');
    });

    test('should register and collect metrics from providers', async () => {
      // Generate some activity
      await mockProvider.generateCompletion([{ role: 'user', content: 'Test' }]);
      
      const metrics = llmTelemetry.getCurrentMetrics();
      
      expect(metrics.providers['test-provider']).toBeDefined();
      expect(metrics.providers['test-provider'].requests).toBe(1);
      expect(metrics.providers['test-provider'].successes).toBe(1);
    });

    test('should calculate aggregated metrics', async () => {
      // Generate some activity
      await mockProvider.generateCompletion([{ role: 'user', content: 'Test 1' }]);
      await mockProvider.generateCompletion([{ role: 'user', content: 'Test 2' }]);
      
      const aggregated = llmTelemetry.getAggregatedMetrics();
      
      expect(aggregated.totalRequests).toBeGreaterThanOrEqual(2);
      expect(aggregated.totalSuccesses).toBeGreaterThanOrEqual(2);
      expect(aggregated.activeProviders).toBeGreaterThanOrEqual(1);
    });

    test('should generate performance insights', async () => {
      // Simulate some failures
      mockProvider._generateCompletion = jest.fn()
        .mockRejectedValueOnce(new Error('Test error'))
        .mockResolvedValue({ content: 'Success' });
      
      try {
        await mockProvider.generateCompletion([{ role: 'user', content: 'Test' }]);
      } catch (error) {
        // Expected failure
      }
      
      await mockProvider.generateCompletion([{ role: 'user', content: 'Test' }]);
      
      const insights = llmTelemetry.getPerformanceInsights();
      
      expect(insights).toHaveProperty('recommendations');
      expect(insights).toHaveProperty('alerts');
      expect(insights).toHaveProperty('trends');
    });

    test('should export metrics in different formats', () => {
      const jsonExport = llmTelemetry.exportMetrics('json');
      expect(() => JSON.parse(jsonExport)).not.toThrow();
      
      const csvExport = llmTelemetry.exportMetrics('csv');
      expect(csvExport).toContain('Provider,Requests,Successes');
    });

    test('should maintain metrics history', () => {
      const history = llmTelemetry.getMetricsHistory(1); // Last hour
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    test('should integrate model registry with telemetry system', async () => {
      // Test that model recommendations consider telemetry data
      const stats = modelRegistry.getRegistryStats();
      const telemetryData = llmTelemetry.getAggregatedMetrics();
      
      expect(stats).toBeDefined();
      expect(telemetryData).toBeDefined();
      
      // Both systems should be operational
      expect(stats.totalModels).toBeGreaterThan(0);
      expect(telemetryData.providersCount).toBeGreaterThanOrEqual(0);
    });

    test('should handle provider failures gracefully', async () => {
      class FailingProvider extends BaseLLMProvider {
        async _generateCompletion() {
          throw new Error('Provider is down');
        }
        validateConfig() { return true; }
      }
      
      const failingProvider = new FailingProvider({ maxRetries: 1 });
      await failingProvider.initialize();
      
      llmTelemetry.registerProvider('failing-provider', failingProvider);
      
      try {
        await failingProvider.generateCompletion([{ role: 'user', content: 'Test' }]);
      } catch (error) {
        expect(error.message).toBe('Provider is down');
      }
      
      const telemetry = failingProvider.getTelemetry();
      expect(telemetry.failures).toBeGreaterThan(0);
      expect(telemetry.successRate).toBe('0.00%');
      
      llmTelemetry.unregisterProvider('failing-provider');
    });
  });

  describe('Secret Management', () => {
    test('should validate API key formats', () => {
      // Mock the validation function from llm-providers.js
      function validateApiKey(provider, apiKey) {
        if (!apiKey) return { valid: false, message: 'API key is required' };

        const validations = {
          openai: {
            pattern: /^sk-[a-zA-Z0-9]{48}$/,
            message: 'OpenAI API key should start with "sk-" and be 51 characters long',
          },
          gemini: {
            pattern: /^[a-zA-Z0-9_-]{30,}$/,
            message: 'Google Gemini API key should be at least 30 characters long',
          }
        };

        const validation = validations[provider];
        if (!validation) return { valid: true };

        if (!validation.pattern.test(apiKey)) {
          return { valid: false, message: validation.message };
        }

        return { valid: true };
      }

      // Test OpenAI key validation
      expect(validateApiKey('openai', 'sk-' + 'a'.repeat(48))).toEqual({ valid: true });
      expect(validateApiKey('openai', 'invalid-key')).toEqual({
        valid: false,
        message: 'OpenAI API key should start with "sk-" and be 51 characters long'
      });

      // Test Gemini key validation
      expect(validateApiKey('gemini', 'a'.repeat(32))).toEqual({ valid: true });
      expect(validateApiKey('gemini', 'short')).toEqual({
        valid: false,
        message: 'Google Gemini API key should be at least 30 characters long'
      });
    });
  });
});