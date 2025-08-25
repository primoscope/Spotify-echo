/**
 * Agent Router for Multi-LLM Orchestration
 * Intelligently routes requests to appropriate models based on task type and policies
 */

const { VertexInvoker, AIRequest } = require('../providers/vertexInvoker');
const BaseLLMProvider = require('../../chat/llm-providers/base-provider');
const { ValidationError, ModelUnavailableError } = require('../errors');
const aiMetrics = require('../../metrics/ai-metrics');

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
    this.initialized = false;
    
    // Initialize asynchronously
    this.initializationPromise = this.initialize();
  }

  /**
   * Initialize router with providers and policies
   */
  async initialize() {
    if (this.initialized) return;
    
    await this.initializeProviders();
    this.initializePolicies();
    this.initialized = true;
  }

  /**
   * Ensure router is initialized before use
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await this.initializationPromise;
    }
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

    // OpenAI provider
    try {
      const { default: OpenAIProvider } = await import('../../chat/llm-providers/openai-provider.js');
      const openaiProvider = new OpenAIProvider({
        apiKey: process.env.OPENAI_API_KEY
      });
      if (openaiProvider.isAvailable()) {
        await openaiProvider.initialize();
        this.providers.set('openai', openaiProvider);
        console.log('✅ OpenAI provider initialized');
      }
    } catch (error) {
      console.warn('⚠️  OpenAI provider initialization failed:', error.message);
    }

    // Anthropic/Claude provider
    try {
      const { default: AnthropicProvider } = await import('../../chat/llm-providers/anthropic-provider.js');
      const anthropicProvider = new AnthropicProvider({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
      if (anthropicProvider.isAvailable()) {
        await anthropicProvider.initialize();
        this.providers.set('anthropic', anthropicProvider);
        console.log('✅ Anthropic provider initialized');
      }
    } catch (error) {
      console.warn('⚠️  Anthropic provider initialization failed:', error.message);
    }

    // Vertex AI Anthropic (Claude Opus 4.1)
    try {
      const { default: VertexAnthropicProvider } = await import('../../chat/llm-providers/vertex-anthropic-provider.js');
      const vertexAnthropicProvider = new VertexAnthropicProvider({
        projectId: process.env.GCP_PROJECT_ID
      });
      if (vertexAnthropicProvider.isAvailable()) {
        await vertexAnthropicProvider.initialize();
        this.providers.set('vertex-anthropic', vertexAnthropicProvider);
        console.log('✅ Vertex AI Anthropic provider initialized');
      }
    } catch (error) {
      console.warn('⚠️  Vertex AI Anthropic provider initialization failed:', error.message);
    }

    // Gemini provider
    try {
      const { default: GeminiProvider } = await import('../../chat/llm-providers/gemini-provider.js');
      const geminiProvider = new GeminiProvider({
        apiKey: process.env.GEMINI_API_KEY
      });
      if (geminiProvider.isAvailable()) {
        await geminiProvider.initialize();
        this.providers.set('gemini', geminiProvider);
        console.log('✅ Gemini provider initialized');
      }
    } catch (error) {
      console.warn('⚠️  Gemini provider initialization failed:', error.message);
    }

    // Perplexity provider  
    try {
      const { default: PerplexityProvider } = await import('../../chat/llm-providers/perplexity-provider.js');
      const perplexityProvider = new PerplexityProvider({
        apiKey: process.env.PERPLEXITY_API_KEY
      });
      if (perplexityProvider.isAvailable()) {
        await perplexityProvider.initialize();
        this.providers.set('perplexity', perplexityProvider);
        console.log('✅ Perplexity provider initialized');
      }
    } catch (error) {
      console.warn('⚠️  Perplexity provider initialization failed:', error.message);
    }

    // Grok4 provider
    try {
      const { default: Grok4Provider } = await import('../../chat/llm-providers/grok4-provider.js');
      const grok4Provider = new Grok4Provider({
        apiKey: process.env.XAI_API_KEY
      });
      if (grok4Provider.isAvailable()) {
        await grok4Provider.initialize();
        this.providers.set('grok4', grok4Provider);
        console.log('✅ Grok4 provider initialized');
      }
    } catch (error) {
      console.warn('⚠️  Grok4 provider initialization failed:', error.message);
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
      primary: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022', costTier: 'premium' },
      fallback: { provider: 'vertex', model: 'text-bison@latest', costTier: 'standard' },
      backup: { provider: 'openai', model: 'gpt-4o-mini', costTier: 'economy' }
    });

    this.policies.set('embeddings', {
      primary: { provider: 'vertex', model: 'textembedding-gecko@latest', costTier: 'economy' },
      fallback: { provider: 'openai', model: 'text-embedding-3-small', costTier: 'economy' },
      backup: { provider: 'mock', model: 'mock-embedding', costTier: 'free' }
    });

    this.policies.set('rerank', {
      primary: { provider: 'gemini', model: 'gemini-2.5-pro', costTier: 'standard' },
      fallback: { provider: 'vertex', model: 'text-bison@latest', costTier: 'standard' },
      backup: { provider: 'openai', model: 'gpt-4o-mini', costTier: 'economy' }
    });

    this.policies.set('classification', {
      primary: { provider: 'gemini', model: 'gemini-1.5-flash', costTier: 'economy' },
      fallback: { provider: 'vertex', model: 'text-bison@latest', costTier: 'economy' },
      backup: { provider: 'openai', model: 'gpt-4o-mini', costTier: 'economy' }
    });

    // Dynamic policies based on performance
    this.policies.set('low-latency', {
      criteria: { maxLatency: 2000, costTier: 'any' },
      primary: { provider: 'openai', model: 'gpt-4o-mini' },
      fallback: { provider: 'gemini', model: 'gemini-1.5-flash' },
      backup: { provider: 'mock', model: 'mock-model' }
    });

    this.policies.set('low-cost', {
      criteria: { maxCost: 0.001, latencyTier: 'any' },
      primary: { provider: 'gemini', model: 'gemini-1.5-flash' },
      fallback: { provider: 'vertex', model: 'text-bison@001' },
      backup: { provider: 'mock', model: 'mock-model' }
    });

    this.policies.set('high-quality', {
      criteria: { costTier: 'any', latencyTier: 'any' },
      primary: { provider: 'vertex-anthropic', model: 'claude-opus-4-1' },
      fallback: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
      backup: { provider: 'vertex', model: 'text-bison@latest' }
    });

    // Enhanced routing strategies from requirements
    this.policies.set('balanced', {
      criteria: { balanceLatencyAndCost: true },
      primary: { provider: 'gemini', model: 'gemini-2.5-pro', costTier: 'standard' },
      fallback: { provider: 'openai', model: 'gpt-4o-mini', costTier: 'economy' },
      backup: { provider: 'vertex', model: 'text-bison@latest', costTier: 'standard' }
    });

    this.policies.set('cost-aware', {
      criteria: { optimizeForCost: true },
      primary: { provider: 'gemini', model: 'gemini-1.5-flash', costTier: 'economy' },
      fallback: { provider: 'vertex', model: 'text-bison@001', costTier: 'economy' },
      backup: { provider: 'openai', model: 'gpt-4o-mini', costTier: 'economy' }
    });

    this.policies.set('ensemble', {
      criteria: { useMultipleProviders: true, aggregateResults: true },
      primary: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
      fallback: { provider: 'gemini', model: 'gemini-2.5-pro' },
      backup: { provider: 'openai', model: 'gpt-4o' },
      ensemble: {
        enabled: true,
        providers: ['anthropic', 'gemini', 'openai'],
        aggregationMethod: 'weighted_average',
        weights: { anthropic: 0.5, gemini: 0.3, openai: 0.2 }
      }
    });
  }

  /**
   * Route request to appropriate provider and model
   * @param {AIRequest|Object} request - Request to route
   * @param {Object} routingOptions - Routing preferences
   * @returns {Promise<Object>} Response from selected provider
   */
  async route(request, routingOptions = {}) {
    // Ensure router is initialized
    await this.ensureInitialized();
    
    // Normalize request
    const normalizedRequest = this.normalizeRequest(request);
    
    // Choose provider and model
    const routing = await this.chooseProvider(normalizedRequest, routingOptions);
    
    // Log routing decision
    this.logRoutingDecision(normalizedRequest, routing, routingOptions);
    
    // Handle ensemble routing if enabled
    if (routing.ensemble && routing.ensemble.enabled) {
      return await this.executeEnsembleRequest(normalizedRequest, routing);
    }
    
    // Execute single provider request
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
      ensemble: policy.ensemble || null,
      rationale: primaryChoice.rationale
    };
  }

  /**
   * Select best available provider for given policy
   */
  async selectBestProvider(policyChoice, request) {
    if (!policyChoice) {
      throw new ModelUnavailableError('No policy choice provided', 'unknown');
    }

    const providerName = policyChoice.provider;
    const provider = this.providers.get(providerName);
    
    if (!provider || !provider.isAvailable()) {
      // Try to find an alternative available provider
      const availableProviders = Array.from(this.providers.entries())
        .filter(([_, p]) => p.isAvailable());
      
      if (availableProviders.length === 0) {
        throw new ModelUnavailableError(
          'No providers are available',
          policyChoice.model
        );
      }

      // Use the first available provider as fallback
      const [fallbackName, fallbackProvider] = availableProviders[0];
      console.warn(`⚠️ Provider ${providerName} not available, using fallback: ${fallbackName}`);
      
      return {
        provider: fallbackName,
        model: policyChoice.model,
        providerInstance: fallbackProvider,
        performance: this.getDefaultPerformance(),
        rationale: `Fallback to ${fallbackName} due to ${providerName} unavailability`
      };
    }

    // Get performance data
    const performanceKey = `${providerName}:${policyChoice.model}`;
    const performance = this.performanceCache.get(performanceKey) || this.getDefaultPerformance();

    return {
      provider: providerName,
      model: policyChoice.model,
      providerInstance: provider,
      performance,
      rationale: `Selected ${providerName} for ${request.type} based on policy`
    };
  }

  /**
   * Get default performance metrics
   */
  getDefaultPerformance() {
    return {
      averageLatency: 1000,
      successRate: 1.0,
      averageCost: 0.001
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
   * Execute ensemble request across multiple providers
   */
  async executeEnsembleRequest(request, routing) {
    const ensemble = routing.ensemble;
    const results = [];
    const errors = [];

    // Execute requests in parallel across ensemble providers
    const promises = ensemble.providers.map(async (providerName) => {
      try {
        const provider = this.providers.get(providerName);
        if (!provider || !provider.isAvailable()) {
          throw new Error(`Provider ${providerName} not available`);
        }

        const providerRouting = {
          ...routing,
          provider: providerName,
          model: routing.model // Use same model across providers where possible
        };

        const result = await this.executeRequest(request, providerRouting);
        return {
          provider: providerName,
          result,
          success: true
        };
      } catch (error) {
        errors.push({ provider: providerName, error });
        return {
          provider: providerName,
          error,
          success: false
        };
      }
    });

    const ensembleResults = await Promise.allSettled(promises);
    
    // Collect successful results
    const successfulResults = ensembleResults
      .filter(result => result.status === 'fulfilled' && result.value.success)
      .map(result => result.value);

    if (successfulResults.length === 0) {
      throw new Error(`All ensemble providers failed: ${errors.map(e => e.error.message).join(', ')}`);
    }

    // Aggregate results based on ensemble method
    return this.aggregateEnsembleResults(successfulResults, ensemble);
  }

  /**
   * Aggregate ensemble results using specified method
   */
  aggregateEnsembleResults(results, ensemble) {
    const { aggregationMethod, weights } = ensemble;

    switch (aggregationMethod) {
      case 'weighted_average':
        return this.weightedAverageAggregation(results, weights);
      case 'consensus':
        return this.consensusAggregation(results);
      case 'best_confidence':
        return this.bestConfidenceAggregation(results);
      default:
        // Default: return result from first successful provider
        return results[0].result;
    }
  }

  /**
   * Weighted average aggregation for ensemble results
   */
  weightedAverageAggregation(results, weights) {
    const aggregatedResult = {
      content: '',
      confidence: 0,
      providers_used: results.map(r => r.provider),
      aggregation_method: 'weighted_average',
      individual_results: results.map(r => ({
        provider: r.provider,
        content: r.result.content || r.result.text,
        confidence: r.result.confidence || 0.8
      }))
    };

    // Combine text content with weights
    let combinedContent = '';
    let totalWeight = 0;
    let totalConfidence = 0;

    results.forEach(result => {
      const provider = result.provider;
      const weight = weights[provider] || (1 / results.length);
      const content = result.result.content || result.result.text || '';
      const confidence = result.result.confidence || 0.8;

      if (combinedContent && content) {
        combinedContent += `\n\n--- ${provider} (weight: ${weight}) ---\n${content}`;
      } else {
        combinedContent = content;
      }

      totalWeight += weight;
      totalConfidence += confidence * weight;
    });

    aggregatedResult.content = combinedContent;
    aggregatedResult.confidence = totalConfidence / totalWeight;

    return aggregatedResult;
  }

  /**
   * Consensus aggregation - find common elements
   */
  consensusAggregation(results) {
    // For simplicity, return the result with highest confidence
    // In a real implementation, this would analyze semantic similarity
    const bestResult = results.reduce((best, current) => {
      const currentConfidence = current.result.confidence || 0.8;
      const bestConfidence = best.result.confidence || 0.8;
      return currentConfidence > bestConfidence ? current : best;
    });

    return {
      ...bestResult.result,
      aggregation_method: 'consensus',
      providers_consulted: results.map(r => r.provider)
    };
  }

  /**
   * Best confidence aggregation
   */
  bestConfidenceAggregation(results) {
    const bestResult = results.reduce((best, current) => {
      const currentConfidence = current.result.confidence || 0.8;
      const bestConfidence = best.result.confidence || 0.8;
      return currentConfidence > bestConfidence ? current : best;
    });

    return {
      ...bestResult.result,
      aggregation_method: 'best_confidence',
      selected_provider: bestResult.provider,
      all_providers: results.map(r => r.provider)
    };
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
    // Ensure router is initialized
    await this.ensureInitialized();
    
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