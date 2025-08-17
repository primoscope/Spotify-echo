const BaseLLMProvider = require('./base-provider');

/**
 * Perplexity AI Provider
 * OpenAI-compatible API with real-time web research capabilities
 * Supports Sonar models for citation-grounded responses
 */
class PerplexityProvider extends BaseLLMProvider {
  constructor(config) {
    super(config);
    this.baseURL = config.baseURL || 'https://api.perplexity.ai/v1';
    this.defaultModel = config.model || 'sonar-pro';
    this.supportedModels = [
      'sonar-small',
      'sonar-medium', 
      'sonar-large',
      'sonar-pro',
      'grok-4', // Grok-4 available via Perplexity Pro
    ];
    this.apiKey = config.apiKey;
  }

  async initialize() {
    try {
      if (!this.apiKey) {
        throw new Error('Perplexity API key not provided');
      }

      // Validate API key with a simple test request
      await this.validateConnection();
      
      this.isInitialized = true;
      console.log(`✅ Perplexity provider initialized with model: ${this.defaultModel}`);
    } catch (error) {
      console.error('❌ Failed to initialize Perplexity provider:', error.message);
      throw error;
    }
  }

  validateConfig() {
    return !!this.apiKey;
  }

  getCapabilities() {
    return {
      streaming: false, // Currently not supported by Perplexity API
      functionCalling: false,
      webSearch: true, // Key capability
      citations: true, // Key capability  
      maxTokens: this.getMaxTokensForModel(this.defaultModel),
      supportedModels: this.supportedModels,
      features: ['chat', 'completion', 'research', 'citations', 'real-time-data'],
    };
  }

  getMaxTokensForModel(model) {
    const tokenLimits = {
      'sonar-small': 4000,
      'sonar-medium': 8000,
      'sonar-large': 16000,
      'sonar-pro': 32000,
      'grok-4': 256000, // Large context window for Grok-4
    };
    return tokenLimits[model] || 8000;
  }

  async _generateCompletion(messages, options = {}) {
    const model = options.model || this.defaultModel;
    
    const requestBody = {
      model: model,
      messages: this.formatMessages(messages),
      max_tokens: options.maxTokens || 2000,
      temperature: options.temperature ?? 0.7,
      top_p: options.topP ?? 0.8,
      stream: false,
    };

    // Add research-specific options
    if (options.searchMode === 'research') {
      requestBody.search_domain_filter = options.searchDomain || [];
      requestBody.search_recency_filter = options.searchRecency || 'auto';
    }

    const response = await this.makeAPIRequest('/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Perplexity API error ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return this.parsePerplexityResponse(data);
  }

  parsePerplexityResponse(data) {
    const choice = data.choices?.[0];
    if (!choice) {
      throw new Error('Invalid response format from Perplexity API');
    }

    return {
      content: choice.message?.content || '',
      role: 'assistant',
      model: data.model || this.defaultModel,
      usage: data.usage || {},
      metadata: {
        citations: data.citations || [],
        sources: data.sources || [],
        search_results: data.search_results || [],
      },
    };
  }

  /**
   * Research-specific method for Perplexity's web search capabilities
   */
  async research(query, options = {}) {
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful research assistant. Provide comprehensive, well-sourced answers with citations.',
      },
      {
        role: 'user', 
        content: query,
      },
    ];

    const researchOptions = {
      ...options,
      searchMode: 'research',
      model: options.model || 'sonar-pro', // Use research-optimized model
    };

    return this._generateCompletion(messages, researchOptions);
  }

  /**
   * Music-specific research for EchoTune context
   */
  async musicResearch(query, options = {}) {
    const musicContext = `
You are a music research expert for EchoTune AI. Research the following music-related query and provide:
1. Current trends and developments  
2. Artist information and recent releases
3. Genre analysis and cultural context
4. Streaming data and popularity metrics (when available)
5. Recommendations based on findings

Always cite your sources and focus on recent, accurate information.
`;

    const messages = [
      { role: 'system', content: musicContext },
      { role: 'user', content: query },
    ];

    const musicOptions = {
      ...options,
      searchMode: 'research',
      searchRecency: 'month', // Focus on recent music data
      model: options.model || 'sonar-pro',
    };

    return this._generateCompletion(messages, musicOptions);
  }

  async validateConnection() {
    const testMessages = [
      { role: 'user', content: 'Hello, are you working?' },
    ];

    try {
      await this._generateCompletion(testMessages, { maxTokens: 10 });
      return true;
    } catch (error) {
      if (error.message.includes('401') || error.message.includes('authentication')) {
        throw new Error('Invalid Perplexity API key');
      }
      throw error;
    }
  }

  async makeAPIRequest(endpoint, options) {
    const url = `${this.baseURL}${endpoint}`;
    const fetch = (await import('node-fetch')).default;
    
    return fetch(url, {
      ...options,
      timeout: this.config.timeout || 30000,
    });
  }

  /**
   * Enhanced error handling for Perplexity-specific errors
   */
  isRetryableError(error) {
    const message = error.message?.toLowerCase() || '';
    
    // Perplexity-specific retryable errors
    if (message.includes('rate limit') || message.includes('quota exceeded')) {
      return true;
    }
    
    // Use base class retry logic for general errors
    return super.isRetryableError(error);
  }

  formatMessages(messages) {
    return messages.map((msg) => ({
      role: msg.role === 'system' ? 'system' : msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }));
  }
}

module.exports = PerplexityProvider;