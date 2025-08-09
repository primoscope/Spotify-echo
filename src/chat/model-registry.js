/**
 * Dynamic Model Registry for LLM Providers
 * Centralized system for managing models across all providers with auto-discovery
 */

class ModelRegistry {
  constructor() {
    this.models = new Map();
    this.capabilities = new Map();
    this.lastUpdated = null;
    this.updateInterval = null;
  }

  /**
   * Initialize the model registry
   */
  async initialize() {
    try {
      await this.loadModelDefinitions();
      await this.discoverModels();
      this.startAutoUpdate();
      console.log('✅ Model Registry initialized');
      return true;
    } catch (error) {
      console.error('Model Registry initialization failed:', error);
      return false;
    }
  }

  /**
   * Load model definitions from configuration and providers
   */
  async loadModelDefinitions() {
    // Static model definitions with known capabilities
    const staticModels = {
      // OpenAI Models
      openai: {
        'gpt-4o': {
          name: 'GPT-4o',
          description: 'Most advanced multimodal model with vision and advanced reasoning',
          capabilities: ['text', 'vision', 'function-calling', 'json-mode'],
          maxTokens: 128000,
          contextWindow: 128000,
          costPer1kTokens: { input: 0.0025, output: 0.01 },
          latencyTier: 'medium',
          qualityTier: 'highest',
        },
        'gpt-4o-mini': {
          name: 'GPT-4o Mini',
          description: 'Faster, cost-efficient model with good performance',
          capabilities: ['text', 'vision', 'function-calling', 'json-mode'],
          maxTokens: 128000,
          contextWindow: 128000,
          costPer1kTokens: { input: 0.000375, output: 0.00125 },
          latencyTier: 'fast',
          qualityTier: 'high',
        },
        'gpt-4-turbo': {
          name: 'GPT-4 Turbo',
          description: 'High-performance model with latest knowledge cutoff',
          capabilities: ['text', 'vision', 'function-calling', 'json-mode'],
          maxTokens: 4096,
          contextWindow: 128000,
          costPer1kTokens: { input: 0.01, output: 0.03 },
          latencyTier: 'medium',
          qualityTier: 'highest',
        },
        'gpt-3.5-turbo': {
          name: 'GPT-3.5 Turbo',
          description: 'Fast and cost-effective for most tasks',
          capabilities: ['text', 'function-calling', 'json-mode'],
          maxTokens: 4096,
          contextWindow: 16385,
          costPer1kTokens: { input: 0.001, output: 0.002 },
          latencyTier: 'fast',
          qualityTier: 'good',
        },
      },

      // Google Gemini Models
      gemini: {
        'gemini-2.0-flash-exp': {
          name: 'Gemini 2.0 Flash (Experimental)',
          description: 'Latest experimental model with cutting-edge capabilities',
          capabilities: ['text', 'vision', 'audio', 'function-calling', 'code-execution'],
          maxTokens: 8192,
          contextWindow: 1000000,
          costPer1kTokens: { input: 0.0, output: 0.0 }, // Free during preview
          latencyTier: 'fast',
          qualityTier: 'experimental',
          experimental: true,
        },
        'gemini-1.5-pro': {
          name: 'Gemini 1.5 Pro',
          description: 'Advanced reasoning and coding with massive context window',
          capabilities: ['text', 'vision', 'audio', 'function-calling', 'code-execution'],
          maxTokens: 8192,
          contextWindow: 2000000,
          costPer1kTokens: { input: 0.001, output: 0.004 },
          latencyTier: 'medium',
          qualityTier: 'highest',
        },
        'gemini-1.5-flash': {
          name: 'Gemini 1.5 Flash',
          description: 'Fast and efficient for most tasks',
          capabilities: ['text', 'vision', 'function-calling'],
          maxTokens: 8192,
          contextWindow: 1000000,
          costPer1kTokens: { input: 0.000375, output: 0.00125 },
          latencyTier: 'fast',
          qualityTier: 'high',
        },
      },

      // OpenRouter Models (Multi-provider access)
      openrouter: {
        'anthropic/claude-3.5-sonnet': {
          name: 'Claude 3.5 Sonnet',
          description: "Anthropic's most advanced model for complex reasoning",
          capabilities: ['text', 'vision', 'function-calling', 'artifacts'],
          maxTokens: 8192,
          contextWindow: 200000,
          costPer1kTokens: { input: 0.003, output: 0.015 },
          latencyTier: 'medium',
          qualityTier: 'highest',
        },
        'anthropic/claude-3-haiku': {
          name: 'Claude 3 Haiku',
          description: 'Fastest Claude model for quick responses',
          capabilities: ['text', 'vision'],
          maxTokens: 4096,
          contextWindow: 200000,
          costPer1kTokens: { input: 0.00025, output: 0.00125 },
          latencyTier: 'very-fast',
          qualityTier: 'good',
        },
        'meta-llama/llama-3.1-405b-instruct': {
          name: 'Llama 3.1 405B',
          description: "Meta's largest open-source model",
          capabilities: ['text', 'function-calling'],
          maxTokens: 4096,
          contextWindow: 131072,
          costPer1kTokens: { input: 0.003, output: 0.003 },
          latencyTier: 'slow',
          qualityTier: 'highest',
          openSource: true,
        },
      },

      // Mock provider for testing
      mock: {
        'mock-fast': {
          name: 'Mock Fast Model',
          description: 'Fast mock responses for testing',
          capabilities: ['text'],
          maxTokens: 4096,
          contextWindow: 4096,
          costPer1kTokens: { input: 0, output: 0 },
          latencyTier: 'very-fast',
          qualityTier: 'testing',
        },
      },
    };

    // Store models in registry
    for (const [providerId, providerModels] of Object.entries(staticModels)) {
      const providerMap = new Map();
      for (const [modelId, modelInfo] of Object.entries(providerModels)) {
        providerMap.set(modelId, {
          ...modelInfo,
          provider: providerId,
          available: false, // Will be updated during discovery
          lastTested: null,
          performanceMetrics: {
            avgLatency: null,
            successRate: null,
            tokensPerSecond: null,
          },
        });
      }
      this.models.set(providerId, providerMap);
    }
  }

  /**
   * Discover available models from active providers
   */
  async discoverModels() {
    try {
      // Don't try to initialize provider manager during discovery to avoid circular dependency
      // Instead, we'll mark models as available based on environment variables
      const availableProviders = this.getAvailableProviders();

      for (const [providerId] of this.models) {
        if (availableProviders.includes(providerId)) {
          await this.discoverProviderModels(providerId);
        }
      }

      this.lastUpdated = new Date().toISOString();
    } catch (error) {
      console.error('Model discovery failed:', error);
    }
  }

  /**
   * Get available providers based on environment configuration
   */
  getAvailableProviders() {
    const availableProviders = ['mock']; // Mock is always available

    if (process.env.OPENAI_API_KEY) {
      availableProviders.push('openai');
    }

    if (process.env.GEMINI_API_KEY) {
      availableProviders.push('gemini');
    }

    if (process.env.OPENROUTER_API_KEY) {
      availableProviders.push('openrouter');
    }

    if (process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT) {
      availableProviders.push('azure');
    }

    return availableProviders;
  }

  /**
   * Discover models for a specific provider
   */
  async discoverProviderModels(providerId) {
    const providerModels = this.models.get(providerId);
    if (!providerModels) return;

    // For now, mark models as available based on provider availability
    // In a production system, you would test each model individually
    for (const [modelId, modelInfo] of providerModels) {
      try {
        // Simple availability check - if provider has API key, assume models are available
        const isAvailable = this.isProviderConfigured(providerId);
        modelInfo.available = isAvailable;
        modelInfo.lastTested = new Date().toISOString();

        if (isAvailable) {
          console.log(`✅ Model ${providerId}/${modelId} marked as available`);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to check model ${providerId}/${modelId}:`, error.message);
        modelInfo.available = false;
        modelInfo.error = error.message;
      }
    }
  }

  /**
   * Check if a provider is properly configured
   */
  isProviderConfigured(providerId) {
    switch (providerId) {
      case 'mock':
        return true;
      case 'openai':
        return !!process.env.OPENAI_API_KEY;
      case 'gemini':
        return !!process.env.GEMINI_API_KEY;
      case 'openrouter':
        return !!process.env.OPENROUTER_API_KEY;
      case 'azure':
        return !!(process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT);
      default:
        return false;
    }
  }

  /**
   * Test if a specific model is available
   */
  async testModelAvailability(providerId, modelId) {
    try {
      const testPrompt = 'Respond with: OK';
      const startTime = Date.now();

      const response = await this.testModelResponse(providerId, modelId, testPrompt);
      const latency = Date.now() - startTime;

      // Update performance metrics
      const modelInfo = this.getModelInfo(providerId, modelId);
      if (modelInfo) {
        modelInfo.performanceMetrics.avgLatency = latency;
        modelInfo.performanceMetrics.lastResponse = response;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Test model response (for future use when integrated with actual providers)
   */
  async testModelResponse(providerId, modelId, _prompt) {
    // This method is placeholder for future integration with provider manager
    // For now, we'll just simulate a response
    return {
      content: `Test response from ${providerId}/${modelId}`,
      latency: Math.random() * 1000 + 500, // Random latency between 500-1500ms
    };
  }

  /**
   * Get all available models
   */
  getAvailableModels(filters = {}) {
    const availableModels = [];

    for (const [providerId, providerModels] of this.models) {
      for (const [modelId, modelInfo] of providerModels) {
        if (modelInfo.available || filters.includeUnavailable) {
          // Apply filters
          if (
            filters.capabilities &&
            !filters.capabilities.every((cap) => modelInfo.capabilities.includes(cap))
          ) {
            continue;
          }

          if (filters.maxCost && modelInfo.costPer1kTokens.output > filters.maxCost) {
            continue;
          }

          if (filters.minContextWindow && modelInfo.contextWindow < filters.minContextWindow) {
            continue;
          }

          if (filters.latencyTier && modelInfo.latencyTier !== filters.latencyTier) {
            continue;
          }

          availableModels.push({
            id: modelId,
            providerId,
            fullId: `${providerId}/${modelId}`,
            ...modelInfo,
          });
        }
      }
    }

    return availableModels.sort((a, b) => {
      // Sort by quality tier, then by latency
      const qualityOrder = ['highest', 'high', 'good', 'experimental', 'testing'];
      const latencyOrder = ['very-fast', 'fast', 'medium', 'slow'];

      const qualityDiff = qualityOrder.indexOf(a.qualityTier) - qualityOrder.indexOf(b.qualityTier);
      if (qualityDiff !== 0) return qualityDiff;

      return latencyOrder.indexOf(a.latencyTier) - latencyOrder.indexOf(b.latencyTier);
    });
  }

  /**
   * Get models for a specific provider
   */
  getProviderModels(providerId, availableOnly = true) {
    const providerModels = this.models.get(providerId);
    if (!providerModels) return [];

    const models = [];
    for (const [modelId, modelInfo] of providerModels) {
      if (!availableOnly || modelInfo.available) {
        models.push({
          id: modelId,
          providerId,
          fullId: `${providerId}/${modelId}`,
          ...modelInfo,
        });
      }
    }

    return models;
  }

  /**
   * Get specific model information
   */
  getModelInfo(providerId, modelId) {
    const providerModels = this.models.get(providerId);
    if (!providerModels) return null;

    const modelInfo = providerModels.get(modelId);
    return modelInfo || null;
  }

  /**
   * Recommend best model for a task
   */
  recommendModel(taskRequirements = {}) {
    const {
      capabilities = ['text'],
      maxLatency = 5000,
      maxCost = 0.01,
      preferOpenSource = false,
    } = taskRequirements;

    const availableModels = this.getAvailableModels({
      capabilities,
      maxCost,
    });

    let bestModel = null;
    let bestScore = -1;

    for (const model of availableModels) {
      let score = 0;

      // Quality scoring
      const qualityScores = { testing: 1, good: 2, high: 3, highest: 4, experimental: 2 };
      score += qualityScores[model.qualityTier] || 0;

      // Latency scoring
      const latencyScores = { 'very-fast': 4, fast: 3, medium: 2, slow: 1 };
      score += latencyScores[model.latencyTier] || 0;

      // Cost scoring (inverse - lower cost is better)
      score += Math.max(0, 10 - model.costPer1kTokens.output * 1000);

      // Open source preference
      if (preferOpenSource && model.openSource) {
        score += 2;
      }

      // Performance metrics
      if (model.performanceMetrics.avgLatency && model.performanceMetrics.avgLatency < maxLatency) {
        score += 1;
      }

      if (score > bestScore) {
        bestScore = score;
        bestModel = model;
      }
    }

    return bestModel;
  }

  /**
   * Start automatic model discovery updates
   */
  startAutoUpdate(intervalMs = 30 * 60 * 1000) {
    // 30 minutes
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(async () => {
      try {
        await this.discoverModels();
        console.log('📊 Model registry updated automatically');
      } catch (error) {
        console.error('Auto-update failed:', error);
      }
    }, intervalMs);
  }

  /**
   * Stop automatic updates
   */
  stopAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Get registry statistics
   */
  getRegistryStats() {
    let totalModels = 0;
    let availableModels = 0;
    const providerStats = {};

    for (const [providerId, providerModels] of this.models) {
      const providerModelCount = providerModels.size;
      const providerAvailableCount = Array.from(providerModels.values()).filter(
        (model) => model.available
      ).length;

      totalModels += providerModelCount;
      availableModels += providerAvailableCount;

      providerStats[providerId] = {
        total: providerModelCount,
        available: providerAvailableCount,
        availabilityRate:
          providerModelCount > 0
            ? ((providerAvailableCount / providerModelCount) * 100).toFixed(1) + '%'
            : '0%',
      };
    }

    return {
      totalModels,
      availableModels,
      availabilityRate:
        totalModels > 0 ? ((availableModels / totalModels) * 100).toFixed(1) + '%' : '0%',
      providers: providerStats,
      lastUpdated: this.lastUpdated,
    };
  }
}

// Singleton instance
const modelRegistry = new ModelRegistry();

module.exports = modelRegistry;
