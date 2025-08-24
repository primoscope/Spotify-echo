/**
 * Agent Router for Multi-LLM Orchestration
 * Intelligently routes requests to appropriate models based on task type and policies
 */

const { VertexInvoker, AIRequest } = require('../providers/vertexInvoker');
const BaseLLMProvider = require('../../chat/llm-providers/base-provider');
const { ValidationError, ModelUnavailableError } = require('../errors');
const aiMetrics = require('../../metrics/aiMetrics');

class AgentRouter {
  constructor(options = {}) {
    this.config = {
      defaultProvider: 'vertex',
      enableFallback: true,
      costThreshold: 0.01, // USD per request
      latencyThreshold: 5000, // ms
      ...options
    };

    this.providers = new Map();
    this.policies = new Map();
    this.routingHistory = [];
    this.performanceCache = new Map();
    
    this.initializeProviders();
    this.initializePolicies();
  }

  /**
   * Initialize available providers
   */
  async initializeProviders() {
    // Vertex AI Provider
    try {
      const vertexProvider = new VertexInvoker();
      await vertexProvider.initialize();
      this.providers.set('vertex', vertexProvider);
      console.log('✅ Vertex AI provider initialized');
    } catch (error) {
      console.warn('⚠️  Vertex AI provider initialization failed:', error.message);
    }

    // Add existing providers from chat system
    try {
      const { default: OpenAIProvider } = await import('../../chat/llm-providers/openai-provider.js');
      const openaiProvider = new OpenAIProvider({
        apiKey: process.env.OPENAI_API_KEY
      });
      if (openaiProvider.isAvailable()) {
        this.providers.set('openai', openaiProvider);
        console.log('✅ OpenAI provider initialized');
      }
    } catch (error) {
      console.warn('⚠️  OpenAI provider initialization failed:', error.message);
    }

    try {
      const { default: GeminiProvider } = await import('../../chat/llm-providers/gemini-provider.js');
      const geminiProvider = new GeminiProvider({
        apiKey: process.env.GEMINI_API_KEY
      });
      if (geminiProvider.isAvailable()) {
        this.providers.set('gemini', geminiProvider);
        console.log('✅ Gemini provider initialized');
      }
    } catch (error) {
      console.warn('⚠️  Gemini provider initialization failed:', error.message);
    }

    try {
      const AnthropicProvider = require('../../chat/llm-providers/anthropic-provider');
      const anthropicProvider = new AnthropicProvider({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
      await anthropicProvider.initialize();
      if (anthropicProvider.isAvailable()) {
        this.providers.set('anthropic', anthropicProvider);
        console.log('✅ Anthropic provider initialized');
      }
    } catch (error) {
      console.warn('⚠️  Anthropic provider initialization failed:', error.message);
    }

    // Vertex AI Anthropic Provider (Claude Opus 4.1)
    try {
      const VertexAnthropicProvider = require('../../chat/llm-providers/vertex-anthropic-provider');
      const vertexAnthropicProvider = new VertexAnthropicProvider({
        projectId: process.env.GCP_PROJECT_ID,
        location: process.env.GCP_VERTEX_LOCATION || 'us-central1'
      });
      await vertexAnthropicProvider.initialize();
      if (vertexAnthropicProvider.isAvailable()) {
        this.providers.set('vertex-anthropic', vertexAnthropicProvider);
        console.log('✅ Vertex AI Anthropic provider initialized');
      }
    } catch (error) {
      console.warn('⚠️  Vertex AI Anthropic provider initialization failed:', error.message);
    }

    // Mock provider for testing
    try {
      const { default: MockProvider } = await import('../../chat/llm-providers/mock-provider.js');
      const mockProvider = new MockProvider();
      this.providers.set('mock', mockProvider);
      console.log('✅ Mock provider initialized');
    } catch (error) {
      console.warn('⚠️  Mock provider initialization failed:', error.message);
    }

    console.log(`🤖 Agent router initialized with ${this.providers.size} providers`);
  }

  /**
   * Initialize routing policies
   */
  initializePolicies() {
    // Task-based routing policies
    this.policies.set('text-generation', {
      primary: { provider: 'vertex', model: 'text-bison@latest', costTier: 'standard' },
      fallback: { provider: 'openai', model: 'gpt-4o-mini', costTier: 'economy' },
      backup: { provider: 'mock', model: 'mock-model', costTier: 'free' }
    });

    this.policies.set('embeddings', {
      primary: { provider: 'vertex', model: 'textembedding-gecko@latest', costTier: 'economy' },
      fallback: { provider: 'openai', model: 'text-embedding-3-small', costTier: 'economy' },
      backup: { provider: 'mock', model: 'mock-embedding', costTier: 'free' }
    });

    this.policies.set('rerank', {
      primary: { provider: 'vertex', model: 'text-bison@latest', costTier: 'standard' },
      fallback: { provider: 'openai', model: 'gpt-4o-mini', costTier: 'economy' },
      backup: { provider: 'mock', model: 'mock-model', costTier: 'free' }
    });

    this.policies.set('classification', {
      primary: { provider: 'vertex', model: 'text-bison@latest', costTier: 'economy' },
      fallback: { provider: 'openai', model: 'gpt-4o-mini', costTier: 'economy' },
      backup: { provider: 'mock', model: 'mock-model', costTier: 'free' }
    });

    // Dynamic policies based on performance
    this.policies.set('low-latency', {
      criteria: { maxLatency: 2000, costTier: 'any' },
      primary: { provider: 'openai', model: 'gpt-4o-mini' },
      fallback: { provider: 'vertex', model: 'text-bison@001' }
    });

    this.policies.set('low-cost', {
      criteria: { maxCost: 0.001, latencyTier: 'any' },
      primary: { provider: 'vertex', model: 'text-bison@001' },
      fallback: { provider: 'mock', model: 'mock-model' }
    });

    this.policies.set('high-quality', {
      criteria: { costTier: 'any', latencyTier: 'any' },
      primary: { provider: 'vertex', model: 'text-bison@latest' },
      fallback: { provider: 'openai', model: 'gpt-4o' }
    });
  }

  /**
   * Route request to appropriate provider and model
   * @param {AIRequest|Object} request - Request to route
   * @param {Object} routingOptions - Routing preferences
   * @returns {Promise<Object>} Response from selected provider
   */
  async route(request, routingOptions = {}) {
    // Normalize request
    const normalizedRequest = this.normalizeRequest(request);
    
    // Choose provider and model
    const routing = await this.chooseProvider(normalizedRequest, routingOptions);
    
    // Log routing decision
    this.logRoutingDecision(normalizedRequest, routing, routingOptions);
    
    // Execute request
    const startTime = Date.now();
    let response = null;
    let error = null;

    try {
      response = await this.executeRequest(normalizedRequest, routing);
      const latency = Date.now() - startTime;
      
      // Update performance cache
      this.updatePerformanceCache(routing, true, latency, response.costEstimateUsd || 0);
      
      // Record routing metrics
      aiMetrics.recordSuccess({
        provider: routing.provider,
        model: routing.model,
        type: normalizedRequest.type,
        routing_strategy: routing.strategy
      });

      return response;
      
    } catch (err) {
      error = err;
      const latency = Date.now() - startTime;
      
      // Update performance cache
      this.updatePerformanceCache(routing, false, latency, 0);
      
      // Record failure
      aiMetrics.recordFailure({
        provider: routing.provider,
        model: routing.model,
        type: normalizedRequest.type,
        routing_strategy: routing.strategy,
        error_class: err.constructor.name,
        error_code: err.code
      });

      // Try fallback if enabled and available
      if (this.config.enableFallback && routing.fallback) {
        console.warn(`🔄 Primary provider failed, trying fallback: ${err.message}`);
        
        try {
          const fallbackResponse = await this.executeRequest(normalizedRequest, routing.fallback);
          
          // Record fallback success
          aiMetrics.recordSuccess({
            provider: routing.fallback.provider,
            model: routing.fallback.model,
            type: normalizedRequest.type,
            routing_strategy: 'fallback'
          });

          return fallbackResponse;
          
        } catch (fallbackError) {
          console.error(`💥 Fallback also failed: ${fallbackError.message}`);
          aiMetrics.recordFailure({
            provider: routing.fallback.provider,
            model: routing.fallback.model,
            type: normalizedRequest.type,
            routing_strategy: 'fallback',
            error_class: fallbackError.constructor.name,
            error_code: fallbackError.code
          });
        }
      }

      throw error;
    }
  }

  /**
   * Normalize request to standard format
   */
  normalizeRequest(request) {
    if (request instanceof AIRequest) {
      return request;
    }

    // Convert from chat message format
    if (request.messages) {
      const prompt = request.messages.map(m => `${m.role}: ${m.content}`).join('\n');
      return new AIRequest(
        'text-generation',
        request.model || 'auto',
        { prompt, content: prompt },
        request.options || {}
      );
    }

    // Convert from simple prompt format
    if (typeof request === 'string') {
      return new AIRequest(
        'text-generation',
        'auto',
        { prompt: request, content: request },
        {}
      );
    }

    // Already in AIRequest-like format
    return new AIRequest(
      request.type || 'text-generation',
      request.model || 'auto',
      request.payload || { content: request.input || '' },
      request.options || {}
    );
  }

  /**
   * Choose provider and model based on policies and performance
   */
  async chooseProvider(request, routingOptions = {}) {
    const taskType = request.type || 'text-generation';
    
    // Get base policy for task type
    let policy = this.policies.get(taskType);
    if (!policy) {
      policy = this.policies.get('text-generation'); // Default fallback
    }

    // Apply routing preferences
    if (routingOptions.strategy) {
      const strategyPolicy = this.policies.get(routingOptions.strategy);
      if (strategyPolicy) {
        policy = strategyPolicy;
      }
    }

    // Apply performance-based selection
    if (routingOptions.maxLatency || routingOptions.maxCost) {
      policy = this.applyPerformanceConstraints(policy, routingOptions);
    }

    // Select best available provider
    const primaryChoice = await this.selectBestProvider(policy.primary, request);
    const fallbackChoice = policy.fallback ? await this.selectBestProvider(policy.fallback, request) : null;
    const backupChoice = policy.backup ? await this.selectBestProvider(policy.backup, request) : null;

    return {
      provider: primaryChoice.provider,
      model: primaryChoice.model,
      strategy: routingOptions.strategy || 'task-based',
      fallback: fallbackChoice,
      backup: backupChoice,
      rationale: primaryChoice.rationale
    };
  }

  /**
   * Select best available provider for given policy
   */
  async selectBestProvider(policyChoice, request) {
    const providerName = policyChoice.provider;
    const provider = this.providers.get(providerName);
    
    if (!provider || !provider.isAvailable()) {
      throw new ModelUnavailableError(
        `Provider ${providerName} is not available`,
        policyChoice.model
      );
    }

    // Get performance data
    const performanceKey = `${providerName}:${policyChoice.model}`;
    const performance = this.performanceCache.get(performanceKey) || {
      averageLatency: 1000,
      successRate: 1.0,
      averageCost: 0.001
    };

    return {
      provider: providerName,
      model: policyChoice.model,
      providerInstance: provider,
      performance,
      rationale: `Selected ${providerName} for ${request.type} based on policy`
    };
  }

  /**
   * Apply performance constraints to policy
   */
  applyPerformanceConstraints(policy, constraints) {
    const constrainedPolicy = { ...policy };
    
    // Filter choices based on performance cache
    ['primary', 'fallback', 'backup'].forEach(level => {
      if (constrainedPolicy[level]) {
        const choice = constrainedPolicy[level];
        const performanceKey = `${choice.provider}:${choice.model}`;
        const performance = this.performanceCache.get(performanceKey);
        
        if (performance) {
          if (constraints.maxLatency && performance.averageLatency > constraints.maxLatency) {
            delete constrainedPolicy[level];
          }
          if (constraints.maxCost && performance.averageCost > constraints.maxCost) {
            delete constrainedPolicy[level];
          }
        }
      }
    });

    return constrainedPolicy;
  }

  /**
   * Execute request with selected provider
   */
  async executeRequest(request, routing) {
    const provider = this.providers.get(routing.provider);
    
    if (!provider) {
      throw new ModelUnavailableError(
        `Provider ${routing.provider} not found`,
        routing.model
      );
    }

    // Use Vertex AI invoker if available
    if (routing.provider === 'vertex' && provider instanceof VertexInvoker) {
      return await provider.invoke(request);
    }

    // Use standard LLM provider interface
    if (provider instanceof BaseLLMProvider) {
      const messages = this.convertToMessages(request);
      const options = {
        model: routing.model,
        ...request.options
      };
      
      return await provider.generateCompletion(messages, options);
    }

    throw new ValidationError(
      `Provider ${routing.provider} does not implement expected interface`,
      'provider',
      routing.provider
    );
  }

  /**
   * Convert AIRequest to messages format for standard providers
   */
  convertToMessages(request) {
    const content = request.payload.prompt || request.payload.content || '';
    
    if (request.type === 'text-generation') {
      return [{ role: 'user', content }];
    }
    
    return [{ role: 'user', content }];
  }

  /**
   * Update performance cache with execution results
   */
  updatePerformanceCache(routing, success, latency, cost) {
    const key = `${routing.provider}:${routing.model}`;
    const existing = this.performanceCache.get(key) || {
      averageLatency: latency,
      successRate: success ? 1 : 0,
      averageCost: cost,
      sampleCount: 0
    };

    // Exponential moving average
    const alpha = 0.1;
    existing.averageLatency = existing.averageLatency * (1 - alpha) + latency * alpha;
    existing.averageCost = existing.averageCost * (1 - alpha) + cost * alpha;
    existing.sampleCount++;
    
    // Update success rate
    const successWeight = success ? 1 : 0;
    existing.successRate = existing.successRate * (1 - alpha) + successWeight * alpha;

    this.performanceCache.set(key, existing);
  }

  /**
   * Log routing decision with structured data
   */
  logRoutingDecision(request, routing, options) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      request_id: request.id,
      request_type: request.type,
      chosen_provider: routing.provider,
      chosen_model: routing.model,
      routing_strategy: routing.strategy,
      routing_rationale: routing.rationale,
      has_fallback: Boolean(routing.fallback),
      routing_options: options
    };

    // Add to routing history for analysis
    this.routingHistory.push(logEntry);
    
    // Keep last 1000 entries
    if (this.routingHistory.length > 1000) {
      this.routingHistory = this.routingHistory.slice(-1000);
    }

    console.log(JSON.stringify({
      ...logEntry,
      level: 'info',
      component: 'agent-router'
    }));
  }

  /**
   * Get routing analytics
   */
  getAnalytics() {
    const totalRequests = this.routingHistory.length;
    if (totalRequests === 0) {
      return { message: 'No routing history available' };
    }

    // Provider usage statistics
    const providerStats = {};
    const strategyStats = {};
    
    this.routingHistory.forEach(entry => {
      providerStats[entry.chosen_provider] = (providerStats[entry.chosen_provider] || 0) + 1;
      strategyStats[entry.routing_strategy] = (strategyStats[entry.routing_strategy] || 0) + 1;
    });

    // Performance cache summary
    const performanceSummary = {};
    this.performanceCache.forEach((performance, key) => {
      performanceSummary[key] = {
        averageLatency: Math.round(performance.averageLatency),
        successRate: (performance.successRate * 100).toFixed(1) + '%',
        averageCost: performance.averageCost.toFixed(6),
        sampleCount: performance.sampleCount
      };
    });

    return {
      totalRequests,
      providerUsage: providerStats,
      strategyUsage: strategyStats,
      performance: performanceSummary,
      availableProviders: Array.from(this.providers.keys()),
      availablePolicies: Array.from(this.policies.keys())
    };
  }

  /**
   * Health check for all providers
   */
  async healthCheck() {
    const health = {};
    
    for (const [name, provider] of this.providers) {
      try {
        const isAvailable = provider.isAvailable();
        const capabilities = provider.getCapabilities ? provider.getCapabilities() : {};
        
        health[name] = {
          available: isAvailable,
          capabilities,
          status: isAvailable ? 'healthy' : 'unavailable'
        };
        
      } catch (error) {
        health[name] = {
          available: false,
          error: error.message,
          status: 'error'
        };
      }
    }

    return health;
  }

  /**
   * Get available providers and models
   */
  getProviders() {
    const providers = {};
    
    this.providers.forEach((provider, name) => {
      providers[name] = {
        available: provider.isAvailable(),
        capabilities: provider.getCapabilities ? provider.getCapabilities() : {},
        type: provider.constructor.name
      };
    });

    return providers;
  }
}

module.exports = AgentRouter;