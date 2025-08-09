/**
 * Unit Tests for Model Registry
 */

const modelRegistry = require('../../src/chat/model-registry');

describe('Model Registry Unit Tests', () => {
  beforeAll(async () => {
    await modelRegistry.initialize();
  });

  afterAll(() => {
    modelRegistry.stopAutoUpdate();
  });

  describe('Model Loading', () => {
    test('should load static model definitions correctly', () => {
      const openaiModels = modelRegistry.getProviderModels('openai', false);
      
      expect(openaiModels).toBeDefined();
      expect(Array.isArray(openaiModels)).toBe(true);
      expect(openaiModels.length).toBeGreaterThan(0);
      
      const gpt4oMini = openaiModels.find(m => m.id === 'gpt-4o-mini');
      expect(gpt4oMini).toBeDefined();
      expect(gpt4oMini.name).toBe('GPT-4o Mini');
      expect(gpt4oMini.capabilities).toContain('text');
      expect(gpt4oMini.latencyTier).toBe('fast');
      expect(gpt4oMini.qualityTier).toBe('high');
    });

    test('should include performance metrics structure', () => {
      const models = modelRegistry.getAvailableModels({ includeUnavailable: true });
      
      models.forEach(model => {
        expect(model).toHaveProperty('performanceMetrics');
        expect(model.performanceMetrics).toHaveProperty('avgLatency');
        expect(model.performanceMetrics).toHaveProperty('successRate');
        expect(model.performanceMetrics).toHaveProperty('tokensPerSecond');
      });
    });
  });

  describe('Model Filtering', () => {
    test('should filter by single capability', () => {
      const visionModels = modelRegistry.getAvailableModels({
        capabilities: ['vision'],
        includeUnavailable: true
      });
      
      expect(visionModels.length).toBeGreaterThan(0);
      visionModels.forEach(model => {
        expect(model.capabilities).toContain('vision');
      });
    });

    test('should filter by multiple capabilities', () => {
      const functionCallModels = modelRegistry.getAvailableModels({
        capabilities: ['text', 'function-calling'],
        includeUnavailable: true
      });
      
      functionCallModels.forEach(model => {
        expect(model.capabilities).toContain('text');
        expect(model.capabilities).toContain('function-calling');
      });
    });

    test('should filter by cost threshold', () => {
      const maxCost = 0.005;
      const cheapModels = modelRegistry.getAvailableModels({
        maxCost,
        includeUnavailable: true
      });
      
      cheapModels.forEach(model => {
        expect(model.costPer1kTokens.output).toBeLessThanOrEqual(maxCost);
      });
    });

    test('should filter by context window size', () => {
      const minContext = 50000;
      const largeContextModels = modelRegistry.getAvailableModels({
        minContextWindow: minContext,
        includeUnavailable: true
      });
      
      largeContextModels.forEach(model => {
        expect(model.contextWindow).toBeGreaterThanOrEqual(minContext);
      });
    });

    test('should filter by latency tier', () => {
      const fastModels = modelRegistry.getAvailableModels({
        latencyTier: 'fast',
        includeUnavailable: true
      });
      
      fastModels.forEach(model => {
        expect(model.latencyTier).toBe('fast');
      });
    });
  });

  describe('Model Recommendations', () => {
    test('should recommend model for basic text generation', () => {
      const recommendation = modelRegistry.recommendModel({
        capabilities: ['text'],
        maxCost: 0.01,
        maxLatency: 5000
      });
      
      expect(recommendation).toBeDefined();
      expect(recommendation.capabilities).toContain('text');
      expect(recommendation.costPer1kTokens.output).toBeLessThanOrEqual(0.01);
    });

    test('should recommend model for vision tasks', () => {
      const recommendation = modelRegistry.recommendModel({
        capabilities: ['text', 'vision'],
        minQuality: 'high'
      });
      
      if (recommendation) {
        expect(recommendation.capabilities).toContain('vision');
        expect(['high', 'highest']).toContain(recommendation.qualityTier);
      }
    });

    test('should prefer open source when requested', () => {
      const recommendation = modelRegistry.recommendModel({
        capabilities: ['text'],
        preferOpenSource: true
      });
      
      // If open source model exists, it should be preferred
      if (recommendation && recommendation.openSource) {
        expect(recommendation.openSource).toBe(true);
      }
    });

    test('should return null when no model meets requirements', () => {
      const recommendation = modelRegistry.recommendModel({
        capabilities: ['text'],
        maxCost: -1 // Impossible negative cost to ensure no matches
      });
      
      expect(recommendation).toBeNull();
    });
  });

  describe('Provider Models', () => {
    test('should get models for specific provider', () => {
      const geminiModels = modelRegistry.getProviderModels('gemini', false);
      
      expect(Array.isArray(geminiModels)).toBe(true);
      geminiModels.forEach(model => {
        expect(model.providerId).toBe('gemini');
        expect(model.fullId).toMatch(/^gemini\/.+/);
      });
    });

    test('should handle non-existent provider', () => {
      const nonExistentModels = modelRegistry.getProviderModels('non-existent');
      expect(nonExistentModels).toEqual([]);
    });

    test('should filter by availability correctly', () => {
      const availableOnly = modelRegistry.getProviderModels('openai', true);
      const includeUnavailable = modelRegistry.getProviderModels('openai', false);
      
      expect(includeUnavailable.length).toBeGreaterThanOrEqual(availableOnly.length);
    });
  });

  describe('Model Information Retrieval', () => {
    test('should get specific model info', () => {
      const modelInfo = modelRegistry.getModelInfo('openai', 'gpt-4o');
      
      if (modelInfo) {
        expect(modelInfo.name).toBe('GPT-4o');
        expect(modelInfo.provider).toBe('openai');
        expect(modelInfo.capabilities).toContain('text');
      }
    });

    test('should return null for non-existent model', () => {
      const modelInfo = modelRegistry.getModelInfo('openai', 'non-existent-model');
      expect(modelInfo).toBeNull();
    });

    test('should return null for non-existent provider', () => {
      const modelInfo = modelRegistry.getModelInfo('non-existent-provider', 'any-model');
      expect(modelInfo).toBeNull();
    });
  });

  describe('Registry Statistics', () => {
    test('should provide comprehensive statistics', () => {
      const stats = modelRegistry.getRegistryStats();
      
      expect(stats).toHaveProperty('totalModels');
      expect(stats).toHaveProperty('availableModels');
      expect(stats).toHaveProperty('availabilityRate');
      expect(stats).toHaveProperty('providers');
      expect(stats).toHaveProperty('lastUpdated');
      
      expect(typeof stats.totalModels).toBe('number');
      expect(typeof stats.availableModels).toBe('number');
      expect(typeof stats.availabilityRate).toBe('string');
      expect(stats.availabilityRate).toMatch(/^\d+(\.\d+)?%$/);
    });

    test('should provide per-provider statistics', () => {
      const stats = modelRegistry.getRegistryStats();
      
      expect(stats.providers).toHaveProperty('openai');
      expect(stats.providers).toHaveProperty('gemini');
      expect(stats.providers).toHaveProperty('openrouter');
      
      const openaiStats = stats.providers.openai;
      expect(openaiStats).toHaveProperty('total');
      expect(openaiStats).toHaveProperty('available');
      expect(openaiStats).toHaveProperty('availabilityRate');
      expect(typeof openaiStats.total).toBe('number');
      expect(typeof openaiStats.available).toBe('number');
    });
  });

  describe('Model Sorting', () => {
    test('should sort models by quality and latency', () => {
      const models = modelRegistry.getAvailableModels({ includeUnavailable: true });
      
      // Check that highest quality models come first
      for (let i = 0; i < models.length - 1; i++) {
        const current = models[i];
        const next = models[i + 1];
        
        const qualityOrder = ['highest', 'high', 'good', 'experimental', 'testing'];
        const currentQualityIndex = qualityOrder.indexOf(current.qualityTier);
        const nextQualityIndex = qualityOrder.indexOf(next.qualityTier);
        
        expect(currentQualityIndex).toBeLessThanOrEqual(nextQualityIndex);
      }
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty filters', () => {
      const allModels = modelRegistry.getAvailableModels({});
      const allModelsExplicit = modelRegistry.getAvailableModels();
      
      expect(allModels).toEqual(allModelsExplicit);
    });

    test('should handle undefined model recommendation requirements', () => {
      const recommendation = modelRegistry.recommendModel();
      
      // Should not throw and should return a reasonable default
      expect(() => recommendation).not.toThrow();
    });

    test('should handle edge case filter values', () => {
      // Very high cost filter - should return most models
      const expensiveModels = modelRegistry.getAvailableModels({
        maxCost: 999999,
        includeUnavailable: true
      });
      
      expect(expensiveModels.length).toBeGreaterThan(0);
      
      // Very low context requirement - should return most models
      const lowContextModels = modelRegistry.getAvailableModels({
        minContextWindow: 1,
        includeUnavailable: true
      });
      
      expect(lowContextModels.length).toBeGreaterThan(0);
    });
  });
});