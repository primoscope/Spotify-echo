/**
 * Vertex AI Polymorphic Invocation Layer
 * Provides unified interface for Vertex AI model invocations with metrics, retry, and fallback
 */

const { GoogleAuth } = require('google-auth-library');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const fs = require('fs').promises;

const {
  ValidationError,
  TransientError,
  RateLimitError,
  ModelUnavailableError,
  EndpointError,
  ErrorClassifier,
  CircuitBreaker
} = require('../errors');

const aiMetrics = require('../../metrics/ai-metrics');
const BaseLLMProvider = require('../../chat/llm-providers/base-provider');

/**
 * Generic AI Request structure
 */
class AIRequest {
  constructor(type, model, payload, options = {}) {
    this.id = uuidv4();
    this.type = type; // 'text-generation', 'embeddings', 'rerank'
    this.model = model;
    this.payload = payload;
    this.options = {
      temperature: 0.7,
      topK: 40,
      topP: 0.8,
      maxTokens: 1024,
      ...options
    };
    this.timestamp = new Date().toISOString();
    this.userId = options.userId ? this.hashUserId(options.userId) : null;
    this.traceId = options.traceId || uuidv4();
  }

  hashUserId(userId) {
    return crypto.createHash('sha256').update(userId).digest('hex').substring(0, 16);
  }
}

/**
 * Normalized AI Response structure
 */
class AIResponse {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.requestId = data.requestId;
    this.text = data.text || '';
    this.tokens = data.tokens || null;
    this.embedding = data.embedding || null;
    this.scores = data.scores || null;
    this.latencyMs = data.latencyMs || 0;
    this.costEstimateUsd = data.costEstimateUsd || 0;
    this.model = data.model;
    this.provider = 'vertex-ai';
    this.metadata = data.metadata || {};
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Vertex AI Invoker - Main invocation class
 */
class VertexInvoker extends BaseLLMProvider {
  constructor(options = {}) {
    super({
      maxRetries: parseInt(process.env.AI_RETRY_MAX_ATTEMPTS) || 3,
      baseDelay: parseInt(process.env.AI_RETRY_BASE_DELAY) || 1000,
      timeout: parseInt(process.env.AI_TIMEOUT_MS) || 30000,
      enableTelemetry: process.env.AI_ENABLE_METRICS !== 'false',
      ...options
    });

    this.projectId = options.projectId || process.env.GCP_PROJECT_ID;
    this.location = options.location || process.env.GCP_VERTEX_LOCATION || 'us-central1';
    this.registryPath = options.registryPath || process.env.VERTEX_REGISTRY_PATH || 'config/ai/vertex_registry.json';
    this.pricingPath = options.pricingPath || process.env.AI_PRICING_TABLE_PATH || 'config/ai/pricing.json';

    this.auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });

    this.registry = null;
    this.pricing = null;
    this.endpoints = new Map();
    this.circuitBreakers = new Map();

    this.validateConfiguration();
  }

  validateConfiguration() {
    if (!this.projectId) {
      throw new ValidationError(
        'GCP_PROJECT_ID is required for Vertex AI invocation',
        'GCP_PROJECT_ID'
      );
    }
  }

  async initialize() {
    await super.initialize();
    await this.loadRegistry();
    await this.loadPricing();
    await this.discoverEndpoints();
  }

  /**
   * Load model registry
   */
  async loadRegistry() {
    try {
      const registryData = await fs.readFile(this.registryPath, 'utf8');
      this.registry = JSON.parse(registryData);
    } catch (error) {
      throw new ValidationError(
        `Failed to load Vertex AI registry: ${error.message}`,
        'registryPath',
        this.registryPath
      );
    }
  }

  /**
   * Load pricing configuration
   */
  async loadPricing() {
    try {
      const pricingData = await fs.readFile(this.pricingPath, 'utf8');
      this.pricing = JSON.parse(pricingData);
    } catch (error) {
      console.warn(`Failed to load pricing data: ${error.message}`);
      this.pricing = { fallback_estimation: {} }; // Use fallback
    }
  }

  /**
   * Discover available endpoints
   */
  async discoverEndpoints() {
    try {
      const authClient = await this.auth.getClient();
      const endpointsPath = `projects/${this.projectId}/locations/${this.location}/endpoints`;
      
      const response = await authClient.request({
        url: `https://aiplatform.googleapis.com/v1/${endpointsPath}`,
        method: 'GET'
      });

      const endpoints = response.data.endpoints || [];
      
      // Cache EchoTune endpoints
      endpoints
        .filter(endpoint => 
          endpoint.labels?.service === 'echotune' ||
          endpoint.displayName?.startsWith('echotune-')
        )
        .forEach(endpoint => {
          const key = endpoint.displayName?.replace('echotune-', '') || endpoint.name.split('/').pop();
          this.endpoints.set(key, {
            name: endpoint.name,
            displayName: endpoint.displayName,
            state: endpoint.state,
            labels: endpoint.labels || {}
          });
        });

      console.log(`Discovered ${this.endpoints.size} Vertex AI endpoints`);
      
    } catch (error) {
      console.warn(`Failed to discover endpoints: ${error.message}`);
    }
  }

  /**
   * Main invocation method
   * @param {AIRequest} request - Structured AI request
   * @returns {Promise<AIResponse>} Normalized response
   */
  async invoke(request) {
    if (!(request instanceof AIRequest)) {
      throw new ValidationError(
        'Request must be an instance of AIRequest',
        'request',
        typeof request
      );
    }

    const startTime = Date.now();
    let response = null;
    let error = null;

    try {
      // Resolve endpoint and model
      const { endpoint, model } = await this.resolveEndpointAndModel(request);
      
      // Get circuit breaker for this endpoint
      const circuitBreaker = this.getCircuitBreaker(endpoint.name);
      
      // Execute with circuit breaker protection
      const rawResponse = await circuitBreaker.execute(async () => {
        return await this.executeRequest(request, endpoint, model);
      });

      // Parse and normalize response
      response = await this.parseResponse(rawResponse, request, model);
      response.latencyMs = Date.now() - startTime;
      
      // Estimate cost
      response.costEstimateUsd = this.estimateCost(request, response, model);
      
      // Record metrics
      this.recordMetrics(request, response, null);
      
      // Structured logging
      this.logInvocation(request, response, null);
      
      return response;
      
    } catch (err) {
      error = ErrorClassifier.createError(err);
      const latency = Date.now() - startTime;
      
      // Record failure metrics
      this.recordMetrics(request, null, error, latency);
      
      // Structured logging
      this.logInvocation(request, null, error, latency);
      
      throw error;
    }
  }

  /**
   * Resolve endpoint and model from request
   * @param {AIRequest} request - AI request
   * @returns {Object} Endpoint and model info
   */
  async resolveEndpointAndModel(request) {
    // Override from environment variables
    const modelOverride = this.getModelOverride(request.type);
    const finalModel = modelOverride || request.model;
    
    // Find model configuration
    const modelConfig = this.findModelConfig(finalModel);
    if (!modelConfig) {
      throw new ModelUnavailableError(
        `Model configuration not found: ${finalModel}`,
        finalModel
      );
    }

    // Find endpoint for model
    const endpointKey = this.findEndpointForModel(finalModel);
    if (!endpointKey) {
      throw new EndpointError(
        `No endpoint found for model: ${finalModel}`,
        null,
        'RESOLVE'
      );
    }

    const endpoint = this.endpoints.get(endpointKey);
    if (!endpoint || endpoint.state !== 'DEPLOYED') {
      throw new EndpointError(
        `Endpoint not available: ${endpointKey} (state: ${endpoint?.state || 'NOT_FOUND'})`,
        endpointKey,
        'UNAVAILABLE'
      );
    }

    return { endpoint, model: modelConfig };
  }

  /**
   * Get model override from environment variables
   */
  getModelOverride(type) {
    switch (type) {
      case 'text-generation':
        return process.env.VERTEX_PRIMARY_TEXT_MODEL;
      case 'embeddings':
        return process.env.VERTEX_EMBED_MODEL;
      case 'rerank':
        return process.env.VERTEX_RECOMMENDER_MODEL;
      default:
        return null;
    }
  }

  /**
   * Find model configuration in registry
   */
  findModelConfig(modelId) {
    if (!this.registry) return null;
    
    for (const category of Object.values(this.registry.models)) {
      for (const variant of Object.values(category)) {
        if (variant.modelId === modelId) {
          return variant;
        }
      }
    }
    return null;
  }

  /**
   * Find endpoint key for model
   */
  findEndpointForModel(modelId) {
    if (!this.registry) return null;
    
    for (const [endpointKey, endpointConfig] of Object.entries(this.registry.endpoints)) {
      if (endpointConfig.modelId === modelId) {
        return endpointKey;
      }
    }
    return null;
  }

  /**
   * Execute the actual request to Vertex AI
   */
  async executeRequest(request, endpoint, model) {
    const authClient = await this.auth.getClient();
    
    // Build request payload based on type
    const payload = this.buildRequestPayload(request, model);
    
    const response = await authClient.request({
      url: `https://aiplatform.googleapis.com/v1/${endpoint.name}:predict`,
      method: 'POST',
      data: payload,
      timeout: this.config.timeout
    });

    return response.data;
  }

  /**
   * Build request payload for Vertex AI
   */
  buildRequestPayload(request, model) {
    const basePayload = {
      parameters: {
        temperature: request.options.temperature,
        maxOutputTokens: request.options.maxTokens,
        topK: request.options.topK,
        topP: request.options.topP
      }
    };

    switch (request.type) {
      case 'text-generation':
        return {
          instances: [{
            prompt: request.payload.prompt || request.payload.content
          }],
          ...basePayload
        };

      case 'embeddings':
        return {
          instances: Array.isArray(request.payload.content) 
            ? request.payload.content.map(text => ({ content: text }))
            : [{ content: request.payload.content }]
        };

      case 'rerank':
        return {
          instances: [{
            query: request.payload.query,
            documents: request.payload.documents || []
          }],
          ...basePayload
        };

      default:
        throw new ValidationError(
          `Unsupported request type: ${request.type}`,
          'type',
          request.type
        );
    }
  }

  /**
   * Parse and normalize response
   */
  async parseResponse(rawResponse, request, model) {
    const response = new AIResponse({
      requestId: request.id,
      model: model.modelId
    });

    if (!rawResponse.predictions || rawResponse.predictions.length === 0) {
      throw new ValidationError('Empty response from Vertex AI');
    }

    const prediction = rawResponse.predictions[0];

    switch (request.type) {
      case 'text-generation':
        response.text = prediction.content || prediction.candidates?.[0]?.content || '';
        response.tokens = {
          input: this.estimateTokens(request.payload.prompt || request.payload.content || ''),
          output: this.estimateTokens(response.text)
        };
        break;

      case 'embeddings':
        response.embedding = prediction.embeddings?.values || prediction.values || null;
        response.tokens = {
          input: this.estimateTokens(request.payload.content || ''),
          output: 0
        };
        break;

      case 'rerank':
        response.scores = prediction.scores || [];
        response.tokens = {
          input: this.estimateTokens(
            (request.payload.query || '') + 
            (request.payload.documents || []).join(' ')
          ),
          output: 0
        };
        break;
    }

    response.metadata = {
      modelVersion: rawResponse.modelVersion || model.modelId,
      safetyRatings: prediction.safetyRatings || [],
      citationMetadata: prediction.citationMetadata || null,
      rawPrediction: prediction
    };

    return response;
  }

  /**
   * Estimate cost based on usage and pricing
   */
  estimateCost(request, response, model) {
    if (!this.pricing || !response.tokens) {
      return 0;
    }

    const modelPricing = this.findModelPricing(model.modelId);
    if (!modelPricing) {
      return 0;
    }

    const inputCost = (response.tokens.input / 1000) * modelPricing.inputCostPer1KTokens;
    const outputCost = (response.tokens.output / 1000) * modelPricing.outputCostPer1KTokens;
    
    return inputCost + outputCost;
  }

  /**
   * Find pricing for model
   */
  findModelPricing(modelId) {
    if (!this.pricing) return null;
    
    for (const category of Object.values(this.pricing.pricing)) {
      if (category[modelId]) {
        return category[modelId];
      }
    }
    
    // Fallback estimation
    return this.pricing.fallback_estimation || {
      inputCostPer1KTokens: 0.000125,
      outputCostPer1KTokens: 0.000125
    };
  }

  /**
   * Get or create circuit breaker for endpoint
   */
  getCircuitBreaker(endpointName) {
    if (!this.circuitBreakers.has(endpointName)) {
      this.circuitBreakers.set(endpointName, new CircuitBreaker({
        failureThreshold: 5,
        resetTimeout: 60000,
        monitorTimeout: 30000
      }));
    }
    return this.circuitBreakers.get(endpointName);
  }

  /**
   * Record metrics for monitoring
   */
  recordMetrics(request, response, error, latency = null) {
    if (!this.config.enableTelemetry) return;

    try {
      const finalLatency = latency || response?.latencyMs || 0;
      const labels = {
        provider: 'vertex-ai',
        model: request.model,
        type: request.type,
        status: error ? 'error' : 'success'
      };

      if (error) {
        labels.error_class = error.constructor.name;
        labels.error_code = error.code;
        aiMetrics.recordFailure(labels);
      } else {
        aiMetrics.recordSuccess(labels);
        aiMetrics.recordLatency(finalLatency, labels);
        
        if (response.costEstimateUsd > 0) {
          aiMetrics.recordCost(response.costEstimateUsd, labels);
        }
      }

    } catch (metricsError) {
      console.warn('Failed to record metrics:', metricsError.message);
    }
  }

  /**
   * Structured logging for invocations
   */
  logInvocation(request, response, error, latency = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      trace_id: request.traceId,
      request_id: request.id,
      model: request.model,
      provider: 'vertex-ai',
      type: request.type,
      latency_ms: latency || response?.latencyMs || 0,
      cost_estimate_usd: response?.costEstimateUsd || 0,
      status: error ? 'error' : 'success',
      user_id_hash: request.userId
    };

    if (error) {
      logEntry.error_class = error.constructor.name;
      logEntry.error_code = error.code;
      logEntry.error_message = error.message;
    }

    if (response?.tokens) {
      logEntry.tokens_input = response.tokens.input;
      logEntry.tokens_output = response.tokens.output;
    }

    console.log(JSON.stringify(logEntry));
  }

  /**
   * Compatibility with existing LLM provider interface
   */
  async _generateCompletion(messages, options = {}) {
    const prompt = this.formatMessagesForPrompt(messages);
    
    const request = new AIRequest(
      'text-generation',
      options.model || process.env.VERTEX_PRIMARY_TEXT_MODEL || 'text-bison@latest',
      { prompt },
      options
    );

    const response = await this.invoke(request);
    
    return {
      content: response.text,
      role: 'assistant',
      model: response.model,
      usage: {
        prompt_tokens: response.tokens?.input || 0,
        completion_tokens: response.tokens?.output || 0,
        total_tokens: (response.tokens?.input || 0) + (response.tokens?.output || 0)
      },
      metadata: {
        latency_ms: response.latencyMs,
        cost_usd: response.costEstimateUsd,
        ...response.metadata
      }
    };
  }

  formatMessagesForPrompt(messages) {
    return messages.map(msg => `${msg.role}: ${msg.content}`).join('\n') + '\nassistant:';
  }

  validateConfig() {
    return Boolean(this.projectId && this.location);
  }

  getCapabilities() {
    return {
      streaming: false,
      functionCalling: false,
      maxTokens: 8192,
      supportedModels: this.registry ? 
        Object.values(this.registry.models).flatMap(category => 
          Object.values(category).map(model => model.modelId)
        ) : []
    };
  }

  isAvailable() {
    return this.isInitialized && this.validateConfig() && this.endpoints.size > 0;
  }
}

module.exports = { VertexInvoker, AIRequest, AIResponse };