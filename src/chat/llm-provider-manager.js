const fs = require('fs').promises;
const path = require('path');
const modelRegistry = require('./model-registry');
const llmTelemetry = require('./llm-telemetry');
const KeyPool = require('./utils/key-pool');

/**
 * Enhanced LLM Provider Manager
 * Implements automatic API key refresh, provider failover, and circuit breaker patterns
 */
class LLMProviderManager {
  constructor() {
    this.providers = new Map();
    this.providerConfigs = new Map();
    this.keyRefreshHandlers = new Map();
    this.fallbackOrder = ['gemini', 'perplexity', 'grok4', 'openai', 'openrouter', 'mock']; // Prioritize new providers
    this.currentProvider = 'gemini'; // Default to Gemini
    this.initialized = false;
    const coalesceEnv = (...names) => {
      for (const name of names) {
        const v = process.env[name];
        if (typeof v === 'string' && v.trim().length > 0) return v;
      }
      return '';
    };
    this.keyPools = {

      gemini: new KeyPool(coalesceEnv('GEMINI_API_KEYS', 'GEMINI_API', 'GEMINI_API_KEY').split(/[\s,]+/).filter(Boolean)),
      openrouter: new KeyPool(coalesceEnv('OPENROUTER_API_KEYS', 'OPENROUTER_API_KEY', 'OPENROUTER_API').split(/[\s,]+/).filter(Boolean)),
      perplexity: new KeyPool(coalesceEnv('PERPLEXITY_API_KEYS', 'PERPLEXITY_API_KEY').split(/[\s,]+/).filter(Boolean)),
      grok4: new KeyPool(coalesceEnv('XAI_API_KEYS', 'XAI_API_KEY').split(/[\s,]+/).filter(Boolean)),

    };

    // Circuit breaker state
    this.circuitBreakers = new Map(); // providerId -> CircuitBreakerState
    this.requestCorrelations = new Map(); // correlationId -> request metadata
  }

  /**
   * Initialize provider manager with automatic key refresh and enhanced systems
   */
  async initialize() {
    try {
      // Load provider configurations
      await this.loadProviderConfigs();

      // Initialize providers
      await this.initializeProviders();

      // Setup key refresh monitoring
      this.setupKeyRefreshMonitoring();

      // Initialize enhanced systems
      await modelRegistry.initialize();
      llmTelemetry.initialize();

      // Register providers with telemetry system
      for (const [providerId, provider] of this.providers) {
        llmTelemetry.registerProvider(providerId, provider);
      }

      this.initialized = true;
      console.log('✅ LLM Provider Manager initialized with enhanced features');

      // Initialize circuit breakers for all providers
      this.initializeCircuitBreakers();
    } catch (error) {
      console.error('❌ Failed to initialize LLM Provider Manager:', error);
      throw error;
    }
  }

  /**
   * Initialize circuit breakers for all providers
   */
  initializeCircuitBreakers() {
    const providerIds = ['gemini', 'openai', 'openrouter', 'mock'];

    for (const providerId of providerIds) {
      this.circuitBreakers.set(providerId, {
        state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
        failureCount: 0,
        successCount: 0,
        lastFailureTime: null,
        openUntil: null,
        consecutiveLatencyFailures: 0,
        recentLatencies: [], // Last 10 request latencies
        config: {
          failureThreshold: 5, // Open circuit after 5 failures
          latencyThreshold: 2000, // 2x of 800ms target = 1600ms, using 2000ms for safety
          consecutiveLatencyThreshold: 5, // Open circuit after 5 consecutive high-latency requests
          timeout: 60000, // Stay open for 1 minute initially
          halfOpenMaxRequests: 3, // Allow 3 test requests in half-open state
        },
      });
    }

    console.log(`🔒 Initialized circuit breakers for ${providerIds.length} providers`);
  }

  /**
   * Load provider configurations from environment and config files
   */
  async loadProviderConfigs() {
    // Base configurations from environment
    const coalesceEnv = (...names) => {
      for (const name of names) {
        const v = process.env[name];
        if (typeof v === 'string' && v.trim().length > 0) return v;
      }
      return undefined;
    };
    const configs = {
      mock: {
        name: 'Demo Mode (Mock)',
        apiKey: 'mock-key',
        status: 'connected',
        available: true,
        refreshable: false,
      },
      gemini: {
        name: 'Google Gemini',
        apiKey: coalesceEnv('GEMINI_API_KEY', 'GEMINI_API', 'GEMINI_API_KEYS'),
        model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
        refreshable: true,
        refreshEndpoint: 'https://oauth2.googleapis.com/token',
      },
      openai: {
        name: 'OpenAI GPT',
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        refreshable: false, // OpenAI keys don't expire
      },
      azure: {
        name: 'Azure OpenAI',
        apiKey: process.env.AZURE_OPENAI_API_KEY,
        endpoint: process.env.AZURE_OPENAI_ENDPOINT,
        deployment: process.env.AZURE_OPENAI_DEPLOYMENT,
        refreshable: true,
        refreshEndpoint: `${process.env.AZURE_OPENAI_ENDPOINT}/oauth2/token`,
      },
      openrouter: {
        name: 'OpenRouter',
        apiKey: coalesceEnv('OPENROUTER_API_KEY', 'OPENROUTER_API', 'OPENROUTER_API_KEYS'),
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku',
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        refreshable: true,
        refreshEndpoint: 'https://openrouter.ai/api/v1/auth/refresh',
      },
      perplexity: {
        name: 'Perplexity AI',
        apiKey: process.env.PERPLEXITY_API_KEY,
        model: process.env.PERPLEXITY_MODEL || 'sonar-pro',
        endpoint: 'https://api.perplexity.ai/v1/chat/completions',
        refreshable: false, // Perplexity keys don't auto-refresh
      },
      grok4: {
        name: 'Grok-4 xAI',
        apiKey: process.env.XAI_API_KEY,
        openRouterKey: process.env.OPENROUTER_API_KEY,
        model: process.env.GROK4_MODEL || 'grok-4',
        endpoint: 'https://api.x.ai/v1/chat/completions',
        useOpenRouter: process.env.GROK4_USE_OPENROUTER === 'true',
        refreshable: false,
      },
    };

    // Load additional config from file if exists
    try {
      const configPath = path.join(process.cwd(), 'config', 'llm-providers.json');
      const fileConfig = JSON.parse(await fs.readFile(configPath, 'utf8'));

      // Merge configurations
      Object.keys(fileConfig).forEach((key) => {
        if (configs[key]) {
          configs[key] = { ...configs[key], ...fileConfig[key] };
        } else {
          configs[key] = fileConfig[key];
        }
      });
    } catch (error) {
      // Config file is optional
      console.log('No additional LLM provider config file found (optional)');
    }

    // Determine availability
    Object.keys(configs).forEach((key) => {
      const config = configs[key];
      if (key === 'mock') {
        config.available = true;
        config.status = 'connected';
      } else if (key === 'grok4') {
        // Grok-4 can use either xAI direct or OpenRouter
        config.available = !!(config.apiKey || config.openRouterKey);
        config.status = config.available ? 'unknown' : 'no_key';
      } else {
        config.available = !!config.apiKey;
        config.status = config.available ? 'unknown' : 'no_key';
      }
    });

    this.providerConfigs = new Map(Object.entries(configs));
  }

  /**
   * Initialize providers based on configurations
   */
  async initializeProviders() {
    const MockProvider = require('./llm-providers/mock-provider');
    const GeminiProvider = require('./llm-providers/gemini-provider');
    const OpenAIProvider = require('./llm-providers/openai-provider');
    const PerplexityProvider = require('./llm-providers/perplexity-provider');
    const Grok4Provider = require('./llm-providers/grok4-provider');

    for (const [key, config] of this.providerConfigs) {
      try {
        let provider;

        switch (key) {
          case 'mock':
            provider = new MockProvider();
            break;
          case 'gemini':
            if (config.available) {
              provider = new GeminiProvider({ apiKey: config.apiKey, model: config.model });
            }
            break;
          case 'openai':
            if (config.available) {
              provider = new OpenAIProvider({ apiKey: config.apiKey, model: config.model });
            }
            break;
          case 'azure':
            if (config.available && config.endpoint && config.deployment) {
              provider = new OpenAIProvider({
                apiKey: config.apiKey,
                baseURL: config.endpoint,
                defaultQuery: { 'api-version': '2023-12-01-preview' },
              });
            }
            break;
          case 'openrouter':
            if (config.available) {
              provider = new OpenAIProvider({
                apiKey: config.apiKey,
                baseURL: 'https://openrouter.ai/api/v1',
                model: config.model,
              });
            }
            break;
          case 'perplexity':
            if (config.available) {
              provider = new PerplexityProvider({ 
                apiKey: config.apiKey, 
                model: config.model,
                baseURL: config.endpoint,
              });
            }
            break;
          case 'grok4':
            if (config.available || config.openRouterKey) {
              provider = new Grok4Provider({
                apiKey: config.apiKey,
                openRouterKey: config.openRouterKey,
                model: config.model,
                useOpenRouter: config.useOpenRouter,
                baseURL: config.endpoint,
              });
            }
            break;
        }

        if (provider) {
          this.providers.set(key, provider);

          // Test provider connection
          await this.testProvider(key);
        }
      } catch (error) {
        console.error(`Failed to initialize provider ${key}:`, error.message);
        config.status = 'error';
        config.error = error.message;
      }
    }
  }

  /**
   * Test provider connection and update status
   */
  async testProvider(providerId) {
    try {
      const provider = this.providers.get(providerId);
      const config = this.providerConfigs.get(providerId);

      if (!provider || !config) {
        throw new Error('Provider not found');
      }

      if (providerId === 'mock') {
        config.status = 'connected';
        return true;
      }

      // Test with simple message
      const messages = [{ role: 'user', content: 'Hello' }];
      const response = await provider.generateCompletion(messages, { maxTokens: 5 });

      if (response && response.content) {
        config.status = 'connected';
        config.lastTested = new Date().toISOString();
        return true;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error(`Provider ${providerId} test failed:`, error.message);
      const config = this.providerConfigs.get(providerId);
      if (config) {
        config.status = 'error';
        config.error = error.message;

        // If it's an auth or rate error, rotate key using KeyPool
        const msg = String(error.message || '').toLowerCase();
        if (providerId === 'gemini' && this.keyPools.gemini) {
          if (
            msg.includes('401') ||
            msg.includes('403') ||
            msg.includes('auth') ||
            msg.includes('429') ||
            msg.includes('rate')
          ) {
            this.keyPools.gemini.reportFailure(config.apiKey, error.message);
            const next = this.keyPools.gemini.getCurrentKey();
            if (next && next !== config.apiKey) {
              console.warn('Rotating Gemini API key');
              config.apiKey = next;
              await this.reinitializeProvider(providerId);
              return await this.testProvider(providerId);
            }
          }
        }
        if (providerId === 'openrouter' && this.keyPools.openrouter) {
          if (
            msg.includes('401') ||
            msg.includes('403') ||
            msg.includes('auth') ||
            msg.includes('429') ||
            msg.includes('rate')
          ) {
            this.keyPools.openrouter.reportFailure(config.apiKey, error.message);
            const next = this.keyPools.openrouter.getCurrentKey();
            if (next && next !== config.apiKey) {
              console.warn('Rotating OpenRouter API key');
              config.apiKey = next;
              await this.reinitializeProvider(providerId);
              return await this.testProvider(providerId);
            }
          }
        }

        // If it's an auth error, try to refresh key
        if (this.isAuthError(error) && config.refreshable) {
          console.log(`Attempting to refresh API key for ${providerId}...`);
          await this.refreshProviderKey(providerId);
        }
      }
      return false;
    }
  }

  /**
   * Setup automatic key refresh monitoring
   */
  setupKeyRefreshMonitoring() {
    // Check provider health every 5 minutes
    setInterval(
      async () => {
        await this.monitorProviderHealth();
      },
      5 * 60 * 1000
    );

    // Setup specific refresh handlers
    this.setupRefreshHandlers();
  }

  /**
   * Monitor provider health and refresh keys if needed
   */
  async monitorProviderHealth() {
    for (const [providerId, config] of this.providerConfigs) {
      if (!config.available || providerId === 'mock') continue;

      try {
        const isHealthy = await this.testProvider(providerId);

        if (!isHealthy && config.refreshable) {
          console.log(`Provider ${providerId} unhealthy, attempting key refresh...`);
          await this.refreshProviderKey(providerId);
        }
      } catch (error) {
        console.error(`Health check failed for ${providerId}:`, error.message);
      }
    }
  }

  /**
   * Setup provider-specific refresh handlers
   */
  setupRefreshHandlers() {
    // Gemini refresh handler
    this.keyRefreshHandlers.set('gemini', async (providedConfig) => {
      // Google API keys don't typically expire, but we can validate them
      try {
        const response = await fetch(
          `${providedConfig.endpoint}/${providedConfig.model}:generateContent?key=${providedConfig.apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: 'test' }] }],
            }),
          }
        );

        if (response.status === 401 || response.status === 403) {
          throw new Error('API key invalid or expired');
        }

        return { success: true, newKey: providedConfig.apiKey };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // OpenRouter refresh handler
    this.keyRefreshHandlers.set('openrouter', async (_config) => {
      try {
        // OpenRouter doesn't have a standard refresh endpoint
        // We would need to implement their specific auth flow
        console.warn('OpenRouter key refresh not implemented - please update manually');
        return { success: false, error: 'Manual refresh required' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Azure refresh handler
    this.keyRefreshHandlers.set('azure', async (_config) => {
      try {
        // Azure OpenAI uses AAD tokens that can be refreshed
        if (process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET) {
          const tokenResponse = await fetch(_config.refreshEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'client_credentials',
              client_id: process.env.AZURE_CLIENT_ID,
              client_secret: process.env.AZURE_CLIENT_SECRET,
              scope: 'https://cognitiveservices.azure.com/.default',
            }),
          });

          const tokenData = await tokenResponse.json();

          if (tokenData.access_token) {
            return { success: true, newKey: tokenData.access_token };
          } else {
            throw new Error('No access token received');
          }
        } else {
          throw new Error('Azure credentials not configured');
        }
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
  }

  /**
   * Refresh API key for a specific provider
   */
  async refreshProviderKey(providerId) {
    try {
      const config = this.providerConfigs.get(providerId);
      const refreshHandler = this.keyRefreshHandlers.get(providerId);

      if (!config || !refreshHandler) {
        throw new Error('Provider or refresh handler not found');
      }

      const result = await refreshHandler(config);

      if (result.success && result.newKey) {
        // Update configuration
        config.apiKey = result.newKey;
        config.status = 'connected';
        config.lastRefreshed = new Date().toISOString();

        // Reinitialize provider with new key
        await this.reinitializeProvider(providerId);

        console.log(`✅ Successfully refreshed API key for ${providerId}`);
        return true;
      } else {
        throw new Error(result.error || 'Key refresh failed');
      }
    } catch (error) {
      console.error(`Failed to refresh key for ${providerId}:`, error.message);

      // Mark provider as unavailable
      const config = this.providerConfigs.get(providerId);
      if (config) {
        config.status = 'key_expired';
        config.available = false;
        config.error = error.message;
      }

      return false;
    }
  }

  /**
   * Reinitialize provider with new configuration
   */
  async reinitializeProvider(providerId) {
    const config = this.providerConfigs.get(providerId);

    switch (providerId) {
      case 'gemini': {
        const GeminiProvider = require('./llm-providers/gemini-provider');
        this.providers.set(
          providerId,
          new GeminiProvider({ apiKey: config.apiKey, model: config.model })
        );
        break;
      }
      case 'openai': {
        const OpenAIProvider = require('./llm-providers/openai-provider');
        this.providers.set(
          providerId,
          new OpenAIProvider({ apiKey: config.apiKey, model: config.model })
        );
        break;
      }
      case 'azure': {
        const AzureProvider = require('./llm-providers/openai-provider');
        this.providers.set(
          providerId,
          new AzureProvider({
            apiKey: config.apiKey,
            baseURL: config.endpoint,
            defaultQuery: { 'api-version': '2023-12-01-preview' },
          })
        );
        break;
      }
      case 'openrouter': {
        const OpenRouterProvider = require('./llm-providers/openai-provider');
        this.providers.set(
          providerId,
          new OpenRouterProvider({
            apiKey: config.apiKey,
            baseURL: 'https://openrouter.ai/api/v1',
            model: config.model,
          })
        );
        break;
      }
    }

    // Test the reinitialized provider
    await this.testProvider(providerId);
  }

  /**
   * Check if error is authentication-related
   */
  isAuthError(error) {
    const authErrors = [
      'unauthorized',
      'forbidden',
      'invalid_api_key',
      'api_key_expired',
      'authentication_failed',
      '401',
      '403',
    ];

    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code?.toLowerCase() || '';

    return authErrors.some(
      (authError) => errorMessage.includes(authError) || errorCode.includes(authError)
    );
  }

  /**
   * Generate correlation ID for request tracking
   */
  generateCorrelationId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `llm_${timestamp}_${random}`;
  }

  /**
   * Check if provider is available (circuit breaker check)
   */
  isProviderAvailable(providerId) {
    const breaker = this.circuitBreakers.get(providerId);
    if (!breaker) return true; // No circuit breaker = available

    return breaker.state !== 'OPEN';
  }

  shouldAttemptRecovery(breaker) {
    if (!breaker || breaker.state !== 'OPEN') return false;
    if (!breaker.openUntil) return false;
    return Date.now() >= breaker.openUntil;
  }

  /**
   * Record request latency and check for circuit breaker conditions
   */
  recordRequestLatency(providerId, latency, success, requestId = null) {
    const breaker = this.circuitBreakers.get(providerId);
    if (!breaker) return;

    // Emit telemetry event
    llmTelemetry.recordRequest(providerId, {
      latency,
      success,
      requestId,
      timestamp: Date.now()
    });

    // Update recent latencies (keep last 10)
    breaker.recentLatencies.push(latency);
    if (breaker.recentLatencies.length > 10) {
      breaker.recentLatencies.shift();
    }

    if (success) {
      breaker.successCount++;
      breaker.failureCount = Math.max(0, breaker.failureCount - 1); // Gradually recover

      // Check latency threshold
      if (latency > breaker.config.latencyThreshold) {
        breaker.consecutiveLatencyFailures++;
        console.warn(
          `⚠️ Provider ${providerId} slow response (${latency}ms > ${breaker.config.latencyThreshold}ms)`
        );

        if (breaker.consecutiveLatencyFailures >= breaker.config.consecutiveLatencyThreshold) {
          console.warn(
            `⚠️ Provider ${providerId} consistently slow (${latency}ms > ${breaker.config.latencyThreshold}ms)`
          );
          this.openCircuit(providerId, breaker);
        }
      } else {
        breaker.consecutiveLatencyFailures = 0; // Reset on good latency
      }
    } else {
      breaker.failureCount++;
      breaker.consecutiveLatencyFailures = 0; // Reset latency count on general failure

      if (breaker.failureCount >= breaker.config.failureThreshold) {
        this.openCircuit(providerId, breaker);
      }
    }
  }

  /**
   * Open circuit breaker with exponential backoff
   */
  openCircuit(providerId, breaker) {
    breaker.state = 'OPEN';
    breaker.lastFailureTime = Date.now();

    // Exponential backoff: 1min, 5min, 15min, then 15min max
    const backoffMultiplier = Math.min(Math.pow(2, breaker.failureCount), 15);
    const backoffMs = Math.min(60000 * backoffMultiplier, 15 * 60000); // Max 15 minutes

    breaker.openUntil = Date.now() + backoffMs;

    console.warn(
      `🚨 Circuit breaker OPEN for ${providerId}, retry in ${Math.round(backoffMs / 60000)}min`
    );

    // Emit circuit breaker event
    llmTelemetry.recordCircuitBreakerEvent(providerId, 'OPEN', {
      failureCount: breaker.failureCount,
      backoffMs
    });

    // Auto-transition to half-open after timeout
    setTimeout(() => {
      if (breaker.state === 'OPEN' && Date.now() >= breaker.openUntil) {
        breaker.state = 'HALF_OPEN';
        breaker.successCount = 0;
        console.log(`🟡 Circuit breaker HALF_OPEN for ${providerId}`);
        
        llmTelemetry.recordCircuitBreakerEvent(providerId, 'HALF_OPEN');
      }
    }, backoffMs);
  }

  /**
   * Get the best available provider
   */
  async getBestProvider() {
    // Try current provider first
    if (this.providers.has(this.currentProvider)) {
      const config = this.providerConfigs.get(this.currentProvider);
      if (config?.status === 'connected') {
        return this.currentProvider;
      }
    }

    // Find first available provider in fallback order
    for (const providerId of this.fallbackOrder) {
      const config = this.providerConfigs.get(providerId);
      if (config?.available && config?.status === 'connected') {
        this.currentProvider = providerId;
        return providerId;
      }
    }

    // Fallback to mock if nothing else works
    this.currentProvider = 'mock';
    return 'mock';
  }

  /**
   * Send message with automatic provider management and model selection
   */
  async sendMessage(message, options = {}) {
    const providerId = options.provider || (await this.getBestProvider());
    let modelId = options.model;

    // Use model registry to get optimal model if not specified
    if (!modelId && providerId !== 'mock') {
      const recommendation = modelRegistry.recommendModel({
        capabilities: options.capabilities || ['text'],
        maxCost: options.maxCost || 0.02,
        maxLatency: options.maxLatency || 10000,
      });

      if (recommendation && recommendation.providerId === providerId) {
        modelId = recommendation.id;
      }
    }

    const provider = this.providers.get(providerId);
    const config = this.providerConfigs.get(providerId);

    if (!provider) {
      throw new Error(`Provider ${providerId} not available`);
    }

    const correlationId = this.generateCorrelationId();
    const startMs = Date.now();

    try {
      const response = await provider.generateCompletion([{ role: 'user', content: message }], {
        ...options,
        model: modelId,
      });
      const latency = Date.now() - startMs;

      // Update last used timestamp
      if (config) {
        config.lastUsed = new Date().toISOString();
      }

      return {
        response: response.content,
        provider: providerId,
        model: modelId || config?.model,
        metadata: {
          ...(response.metadata || {}),
          correlationId,
          latency,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error(`Provider ${providerId} failed:`, error.message);

      // If auth error and refreshable, try to refresh
      if (this.isAuthError(error) && config?.refreshable) {
        const refreshed = await this.refreshProviderKey(providerId);
        if (refreshed) {
          // Retry with refreshed key
          const newProvider = this.providers.get(providerId);
          const retryResponse = await newProvider.generateCompletion(
            [{ role: 'user', content: message }],
            { ...options, model: modelId }
          );
          const latency = Date.now() - startMs;
          return {
            response: retryResponse.content,
            provider: providerId,
            model: modelId || config?.model,
            refreshed: true,
            metadata: {
              ...(retryResponse.metadata || {}),
              correlationId,
              latency,
              timestamp: new Date().toISOString(),
            },
          };
        }
      }

      // Try fallback provider
      if (providerId !== 'mock') {
        console.log(`Falling back to mock provider due to ${providerId} failure`);
        const mockProvider = this.providers.get('mock');
        const fallbackResponse = await mockProvider.generateCompletion([
          { role: 'user', content: message },
        ]);
        const latency = Date.now() - startMs;
        return {
          response: fallbackResponse.content,
          provider: 'mock',
          fallback: true,
          originalProvider: providerId,
          metadata: {
            ...(fallbackResponse.metadata || {}),
            correlationId,
            latency,
            timestamp: new Date().toISOString(),
          },
        };
      }

      throw error;
    }
  }

  /**
   * Get provider status information with enhanced telemetry
   */
  getProviderStatus() {
    const status = {};

    for (const [providerId, config] of this.providerConfigs) {
      // Get telemetry data if available
      const telemetryData = llmTelemetry.getProviderMetrics(providerId);

      // Get circuit breaker status
      const breaker = this.circuitBreakers.get(providerId);

      status[providerId] = {
        name: config.name,
        available: config.available,
        status: config.status,
        model: config.model,
        lastTested: config.lastTested,
        lastUsed: config.lastUsed,
        lastRefreshed: config.lastRefreshed,
        refreshable: config.refreshable,
        error: config.error,
        telemetry: telemetryData?.current || null,
        performance: {
          averageLatency: telemetryData?.current?.averageLatency || null,
          successRate: telemetryData?.current?.successRate || null,
          totalRequests: telemetryData?.current?.requests || 0,
        },
        circuitBreaker: breaker
          ? {
              state: breaker.state,
              failureCount: breaker.failureCount,
              successCount: breaker.successCount,
              consecutiveLatencyFailures: breaker.consecutiveLatencyFailures,
              openUntil: breaker.openUntil ? new Date(breaker.openUntil).toISOString() : null,
              lastFailureTime: breaker.lastFailureTime
                ? new Date(breaker.lastFailureTime).toISOString()
                : null,
              recentLatencies: breaker.recentLatencies.slice(-5), // Last 5 latencies
              thresholds: {
                latency: breaker.config.latencyThreshold,
                failures: breaker.config.failureThreshold,
                consecutiveLatency: breaker.config.consecutiveLatencyThreshold,
              },
            }
          : null,
      };
    }

    return {
      providers: status,
      current: this.currentProvider,
      fallbackOrder: this.fallbackOrder,
      modelRegistry: modelRegistry.getRegistryStats(),
      telemetryOverview: llmTelemetry.getAggregatedMetrics(),
    };
  }

  /**
   * Get enhanced insights including model recommendations
   */
  getProviderInsights() {
    const telemetryInsights = llmTelemetry.getPerformanceInsights();
    const registryStats = modelRegistry.getRegistryStats();

    return {
      performance: telemetryInsights,
      models: {
        totalAvailable: registryStats.totalModels,
        currentlyOnline: registryStats.availableModels,
        recommendations: this.getModelRecommendations(),
      },
      health: this.getSystemHealth(),
    };
  }

  /**
   * Get model recommendations for common tasks
   */
  getModelRecommendations() {
    return {
      textGeneration: modelRegistry.recommendModel({
        capabilities: ['text'],
        maxCost: 0.005,
        latencyTier: 'fast',
      }),
      codeGeneration: modelRegistry.recommendModel({
        capabilities: ['text', 'function-calling'],
        minQuality: 'high',
        maxLatency: 5000,
      }),
      imageAnalysis: modelRegistry.recommendModel({
        capabilities: ['text', 'vision'],
        maxCost: 0.01,
        minQuality: 'high',
      }),
      longForm: modelRegistry.recommendModel({
        capabilities: ['text'],
        minContextWindow: 100000,
        minQuality: 'highest',
      }),
    };
  }

  /**
   * Get system health summary
   */
  getSystemHealth() {
    const aggregated = llmTelemetry.getAggregatedMetrics();
    const insights = llmTelemetry.getPerformanceInsights();

    return {
      overall: this.calculateHealthScore(aggregated, insights),
      activeProviders: aggregated.activeProviders,
      totalRequests: aggregated.totalRequests,
      successRate: aggregated.successRate,
      criticalAlerts: insights.alerts.filter((a) => a.severity === 'critical').length,
      recommendations: insights.recommendations.length,
    };
  }

  /**
   * Calculate overall system health score
   */
  calculateHealthScore(aggregated, insights) {
    let score = 100;

    // Reduce score for low success rate
    const successRate = parseFloat(aggregated.successRate) || 0;
    if (successRate < 95) score -= (95 - successRate) * 2;

    // Reduce score for critical alerts
    const criticalAlerts = insights.alerts.filter((a) => a.severity === 'critical').length;
    score -= criticalAlerts * 20;

    // Reduce score for high alerts
    const highAlerts = insights.alerts.filter((a) => a.severity === 'high').length;
    score -= highAlerts * 10;

    // Reduce score if no providers are active
    if (aggregated.activeProviders === 0) score = 0;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get telemetry data for a provider
   */
  async getTelemetryData(providerId) {
    return await llmTelemetry.getProviderMetrics(providerId);
  }

  /**
   * Switch to a specific provider
   */
  async switchProvider(providerId, model = null) {
    if (!this.providers.has(providerId)) {
      throw new Error(`Provider ${providerId} not available`);
    }

    const breaker = this.circuitBreakers.get(providerId);
    if (breaker && breaker.state === 'OPEN') {
      throw new Error(`Provider ${providerId} circuit breaker is open`);
    }

    this.currentProvider = providerId;
    const provider = this.providers.get(providerId);
    
    if (model && provider.setModel) {
      provider.setModel(model);
    }

    console.log(`🔄 Switched to provider: ${providerId}${model ? ` (model: ${model})` : ''}`);
    
    return {
      provider: providerId,
      model: model || provider.model || provider.defaultModel
    };
  }
}

// Singleton instance
const llmProviderManager = new LLMProviderManager();

// Constructor-compatible default export with singleton delegation
function LLMProviderManagerExport(...args) {
  return new LLMProviderManager(...args);
}
// Delegate commonly used members to the singleton for app runtime
['getProviderStatus', 'testProvider', 'initialize', 'initializeCircuitBreakers', 'sendMessage', 'getBestProvider', 'getTelemetryData', 'switchProvider', 'recordRequestLatency'].forEach((method) => {
  LLMProviderManagerExport[method] = (...args) => llmProviderManager[method](...args);
});
Object.defineProperty(LLMProviderManagerExport, 'currentProvider', {
  get: () => llmProviderManager.currentProvider,
  set: (v) => {
    llmProviderManager.currentProvider = v;
  },
});
Object.defineProperty(LLMProviderManagerExport, 'providerConfigs', {
  get: () => llmProviderManager.providerConfigs,
});

module.exports = LLMProviderManagerExport;
module.exports.LLMProviderManager = LLMProviderManager;
module.exports.instance = llmProviderManager;
