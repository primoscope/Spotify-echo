const { GoogleGenerativeAI } = require('@google/generative-ai');
const BaseLLMProvider = require('./base-provider');
const NodeCache = require('node-cache');

// Enhanced Gemini modules
const GeminiClient = require('../../ai/providers/gemini/client');
const GeminiSafety = require('../../ai/providers/gemini/safety');
const GeminiStreaming = require('../../ai/providers/gemini/streaming');
const GeminiCostModel = require('../../ai/providers/gemini/cost-model');
const GeminiTransformer = require('../../ai/providers/gemini/transformer');

/**
 * Enhanced Google Gemini LLM Provider
 * Supports multimodal, function calling, caching, and comprehensive observability
 */
class GeminiProvider extends BaseLLMProvider {
  constructor(config) {
    super(config);
    this.name = 'gemini';
    
    // Enhanced configuration
    this.config = {
      ...this.config,
      useVertex: config.useVertex || process.env.GEMINI_USE_VERTEX === 'true',
      model: config.model || process.env.GEMINI_MODEL || 'gemini-2.5-pro',
      fallbackModel: process.env.GEMINI_MODEL_FALLBACK || 'gemini-1.5-flash',
      safetyMode: process.env.GEMINI_SAFETY_MODE || 'BLOCK_MEDIUM_AND_ABOVE',
      functionCallingEnabled: process.env.GEMINI_FUNCTION_CALLING_ENABLED === 'true',
      codeAssistEnabled: process.env.GEMINI_CODE_ASSIST_ENABLED === 'true',
      cacheTTL: parseInt(process.env.GEMINI_CACHE_TTL_MS || '600000'), // 10 minutes
      ...config
    };

    // Initialize enhanced modules
    this.client = new GeminiClient(this.config);
    this.safety = new GeminiSafety();
    this.streaming = new GeminiStreaming(this.safety);
    this.costModel = new GeminiCostModel();
    this.transformer = new GeminiTransformer();
    
    // Setup caching with LRU
    this.cache = new NodeCache({
      stdTTL: this.config.cacheTTL / 1000, // Convert to seconds
      maxKeys: 1000,
      useClones: false
    });

    this.defaultModel = this.config.model;
    this.supportedModels = [
      'gemini-2.5-pro',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro',
      'gemini-pro-vision',
    ];

    // Metrics tracking
    this.metrics = {
      requests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      multimodalRequests: 0,
      functionCalls: 0,
      safetyBlocks: 0,
      fallbackUsage: 0
    };
  }

  async initialize() {
    try {
      // Call super.initialize() to set up base provider properties
      await super.initialize();

      // Initialize enhanced Gemini client
      await this.client.initialize();
      
      console.log(`✅ Enhanced Gemini provider initialized`);
      console.log(`   Model: ${this.defaultModel}`);
      console.log(`   Client: ${this.client.getClientInfo().type}`);
      console.log(`   Safety: ${this.config.safetyMode}`);
      console.log(`   Function calling: ${this.config.functionCallingEnabled ? 'enabled' : 'disabled'}`);
      console.log(`   Caching: ${this.config.cacheTTL}ms TTL`);
      
    } catch (error) {
      console.error('❌ Failed to initialize enhanced Gemini provider:', error.message);
      this.isInitialized = false; // Ensure it's marked as not initialized on error
      throw error;
    }
  }

  validateConfig() {
    if (this.config.useVertex) {
      // For Vertex, we rely on application-default credentials or other GCP auth methods
      return !!(this.config.projectId || process.env.GCP_PROJECT_ID);
    } else {
      return !!(this.config.apiKey || process.env.GEMINI_API_KEY);
    }
  }

  getCapabilities() {
    return {
      streaming: true,
      functionCalling: this.config.functionCallingEnabled,
      multimodal: true,
      maxTokens: this.getMaxTokensForModel(this.defaultModel),
      supportedModels: this.supportedModels,
      features: [
        'chat', 
        'completion', 
        'streaming', 
        'vision', 
        'multimodal',
        ...(this.config.functionCallingEnabled ? ['function_calling'] : []),
        ...(this.config.codeAssistEnabled ? ['code_assist'] : [])
      ],
      supportsMultimodal: true,
      supportsExtendedThinking: false,
      maxContextTokens: this.getMaxTokensForModel(this.defaultModel),
      costProfile: 'medium' // For routing decisions
    };
  }

  getMaxTokensForModel(model) {
    const tokenLimits = {
      'gemini-2.5-pro': 2000000,
      'gemini-pro': 32768,
      'gemini-pro-vision': 16384,
      'gemini-1.5-pro': 1048576,
      'gemini-1.5-flash': 1048576,
    };
    return tokenLimits[model] || 32768;
  }

  async _generateCompletion(messages, options = {}) {
    try {
      // This check is now handled by the BaseLLMProvider's executeWithRetry
      // this.metrics.requests++; // This is now handled by the base class telemetry

      // Check cache first (if enabled)
      const cacheKey = this.generateCacheKey(messages, options);
      if (this.config.cacheTTL > 0) {
        const cached = this.cache.get(cacheKey);
        if (cached) {
          this.metrics.cacheHits++;
          return {
            ...cached,
            metadata: {
              ...cached.metadata,
              cacheHit: true,
              provider: 'gemini'
            }
          };
        }
        this.metrics.cacheMisses++;
      }

      // Validate multimodal content
      const validationIssues = this.transformer.validateMultimodalContent(messages);
      if (validationIssues.length > 0) {
        throw new Error(`Multimodal validation failed: ${validationIssues.map(i => i.error).join(', ')}`);
      }

      // Check for multimodal content
      const images = this.transformer.extractImages(messages);
      if (images.length > 0) {
        this.metrics.multimodalRequests++;
      }

      // Transform messages to Gemini format
      const geminiMessages = this.transformer.transformMessages(messages);
      
      // Determine model to use
      const modelName = this.selectModel(options, images.length > 0);
      
      // Create generation config
      const generationConfig = this.transformer.createGenerationConfig(options);
      
      // Get model instance
      const model = this.client.getGenerativeModel({
        model: modelName,
        generationConfig,
        safetySettings: this.safety.getSafetySettings(options.safetyMode)
      });

      let response;
      const startTime = Date.now();
      
      try {
        if (geminiMessages.length === 1) {
          // Single message - use generateContent
          response = await model.generateContent(geminiMessages[0].parts);
        } else {
          // Multiple messages - use chat
          const chat = model.startChat({
            history: geminiMessages.slice(0, -1),
          });
          const lastMessage = geminiMessages[geminiMessages.length - 1];
          response = await chat.sendMessage(lastMessage.parts);
        }
      } catch (error) {
        // Try fallback model if primary fails
        if (modelName !== this.config.fallbackModel) {
          console.warn(`Primary model ${modelName} failed, trying fallback ${this.config.fallbackModel}`);
          this.metrics.fallbackUsage++;
          
          const fallbackModel = this.client.getGenerativeModel({
            model: this.config.fallbackModel,
            generationConfig,
            safetySettings: this.safety.getSafetySettings(options.safetyMode)
          });
          
          if (geminiMessages.length === 1) {
            response = await fallbackModel.generateContent(geminiMessages[0].parts);
          } else {
            const chat = fallbackModel.startChat({
              history: geminiMessages.slice(0, -1),
            });
            const lastMessage = geminiMessages[geminiMessages.length - 1];
            response = await chat.sendMessage(lastMessage.parts);
          }
        } else {
          throw error;
        }
      }

      const latency = Date.now() - startTime;

      // Process safety ratings
      const candidate = response.response.candidates?.[0];
      if (candidate) {
        const safetyInfo = this.safety.processSafetyRatings(candidate);
        if (safetyInfo.blocked) {
          this.metrics.safetyBlocks++;
          throw new Error(this.safety.formatSafetyError(safetyInfo));
        }
      }

      const content = response.response.text();
      
      // Calculate token usage and cost
      const inputTokens = this.costModel.estimateTokens(
        geminiMessages.map(m => m.parts.map(p => p.text || '').join(' ')).join(' ')
      );
      const outputTokens = this.costModel.estimateTokens(content);
      const imageTokens = images.reduce((sum, img) => 
        sum + this.costModel.estimateImageTokens(img.size), 0
      );

      const costInfo = this.costModel.recordUsage(modelName, inputTokens, outputTokens, imageTokens);

      const result = {
        content,
        role: 'assistant',
        model: modelName,
        usage: {
          promptTokens: inputTokens,
          completionTokens: outputTokens,
          totalTokens: inputTokens + outputTokens,
          imageTokens,
          cost: costInfo.currentCost
        },
        metadata: {
          provider: 'gemini',
          model: modelName,
          latency,
          cacheHit: false,
          safety: this.safety.getSafetyStats(),
          multimodal: images.length > 0,
          fallbackUsed: modelName !== options.model && modelName !== this.defaultModel
        },
      };

      // Cache the result (if enabled)
      if (this.config.cacheTTL > 0) {
        this.cache.set(cacheKey, result);
      }

      return result;

    } catch (error) {
      console.error('Gemini completion error:', error);
      throw error;
    }
  }

  async *generateStreamingCompletion(messages, options = {}) {
    try {
      if (!this.isAvailable()) {
        throw new Error('Gemini provider not initialized or configured');
      }

      this.metrics.requests++;

      // Validate and transform messages
      const validationIssues = this.transformer.validateMultimodalContent(messages);
      if (validationIssues.length > 0) {
        yield* this.streaming.processStreamingResponse([{
          error: `Multimodal validation failed: ${validationIssues.map(i => i.error).join(', ')}`
        }], options);
        return;
      }

      const images = this.transformer.extractImages(messages);
      if (images.length > 0) {
        this.metrics.multimodalRequests++;
      }

      const geminiMessages = this.transformer.transformMessages(messages);
      const modelName = this.selectModel(options, images.length > 0);
      const generationConfig = this.transformer.createGenerationConfig(options);

      const model = this.client.getGenerativeModel({
        model: modelName,
        generationConfig,
        safetySettings: this.safety.getSafetySettings(options.safetyMode)
      });

      let stream;
      try {
        if (geminiMessages.length === 1) {
          stream = await model.generateContentStream(geminiMessages[0].parts);
        } else {
          const chat = model.startChat({
            history: geminiMessages.slice(0, -1),
          });
          const lastMessage = geminiMessages[geminiMessages.length - 1];
          stream = await chat.sendMessageStream(lastMessage.parts);
        }
      } catch (error) {
        // Fallback to non-streaming on stream failure
        console.warn('Streaming failed, falling back to regular completion:', error.message);
        const completion = await this.generateCompletion(messages, options);
        yield* this.streaming.mockStream(completion.content);
        return;
      }

      // Process the streaming response
      yield* this.streaming.processStreamingResponse(stream, {
        ...options,
        model: modelName
      });

    } catch (error) {
      console.error('Gemini streaming error:', error);
      yield {
        content: `Streaming error: ${error.message}`,
        role: 'assistant',
        isError: true,
        isPartial: false,
        metadata: {
          provider: 'gemini',
          error: error.message
        }
      };
    }
  }

  // Helper methods
  selectModel(options, hasImages = false) {
    // Model selection logic
    if (options.model && this.supportedModels.includes(options.model)) {
      return options.model;
    }

    // For multimodal content, prefer vision-capable models
    if (hasImages) {
      if (this.supportedModels.includes('gemini-pro-vision')) {
        return 'gemini-pro-vision';
      }
    }

    return this.defaultModel;
  }

  generateCacheKey(messages, options) {
    const keyData = {
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      model: options.model || this.defaultModel,
      temperature: options.temperature,
      maxTokens: options.maxTokens
    };
    
    return `gemini:${JSON.stringify(keyData)}`;
  }

  getMetrics() {
    return {
      ...this.metrics,
      costModel: this.costModel.getUsageStats(),
      safety: this.safety.getSafetyStats(),
      cache: {
        keys: this.cache.keys().length,
        hits: this.metrics.cacheHits,
        misses: this.metrics.cacheMisses,
        hitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) || 0
      }
    };
  }

  // Enhanced capabilities for multimodal support
  async handleMultimodalQuery(messages, options = {}) {
    // Specialized method for multimodal content
    const images = this.transformer.extractImages(messages);
    
    if (images.length === 0) {
      // No images, use regular completion
      return await this.generateCompletion(messages, options);
    }

    // Ensure we're using a vision-capable model
    const visionOptions = {
      ...options,
      model: this.selectModel(options, true)
    };

    return await this.generateCompletion(messages, visionOptions);
  }

  formatMessagesForGemini(messages) {
    const geminiMessages = [];

    for (const message of messages) {
      if (message.role === 'system') {
        // Gemini doesn't have system role, prepend to first user message
        continue;
      }

      const geminiRole = message.role === 'assistant' ? 'model' : 'user';

      geminiMessages.push({
        role: geminiRole,
        parts: [{ text: message.content }],
      });
    }

    // Prepend system message to first user message if exists
    const systemMessage = messages.find((m) => m.role === 'system');
    if (systemMessage && geminiMessages.length > 0 && geminiMessages[0].role === 'user') {
      geminiMessages[0].parts[0].text = `${systemMessage.content}\n\nUser: ${geminiMessages[0].parts[0].text}`;
    }

    return geminiMessages;
  }

  /**
   * Create music-specific system prompt for Gemini
   */
  createMusicSystemPrompt() {
    return {
      role: 'system',
      content: `You are EchoTune AI, an intelligent music assistant that helps users discover new music, create playlists, and explore their musical tastes. You have access to Spotify's extensive music catalog and can analyze audio features to make personalized recommendations.

Your capabilities include:
- Analyzing user listening history and preferences
- Recommending songs based on mood, activity, or specific criteria
- Creating personalized playlists
- Explaining music characteristics and audio features
- Helping users discover new artists and genres
- Providing insights about their listening habits

Key audio features you can work with:
- Energy (0-1): How energetic and intense the track feels
- Valence (0-1): The musical positivity (happy vs sad)
- Danceability (0-1): How suitable the track is for dancing
- Acousticness (0-1): How acoustic vs electronic the track is
- Tempo (BPM): The speed of the track

Be conversational, enthusiastic about music, and ask clarifying questions to provide better recommendations. Consider the user's mood and context when making suggestions. Respond naturally and avoid being overly technical unless requested.`,
    };
  }

  /**
   * Handle music-related queries with structured responses
   */
  async handleMusicQuery(query, context = {}) {
    const systemPrompt = this.createMusicSystemPrompt();

    let conversationContext = '';
    if (context.userProfile) {
      conversationContext += `User's favorite genres: ${context.userProfile.favorite_genres?.join(', ') || 'Not specified'}\n`;
    }

    if (context.recentTracks) {
      conversationContext += `Recent tracks: ${context.recentTracks
        .slice(0, 5)
        .map((t) => `${t.track_name} by ${t.artist_name}`)
        .join(', ')}\n`;
    }

    const messages = [
      systemPrompt,
      {
        role: 'user',
        content: `${conversationContext}\n\nUser query: ${query}`,
      },
    ];

    return await this.generateCompletion(messages, {
      temperature: 0.7,
      maxTokens: 1000,
    });
  }

  /**
   * Generate playlist description based on tracks
   */
  async generatePlaylistDescription(tracks, theme = '') {
    const trackList = tracks
      .slice(0, 10)
      .map((t) => `${t.track_name} by ${t.artist_name}`)
      .join(', ');

    const prompt = `Create a creative and engaging description for a music playlist. 
    
Theme: ${theme || 'Mixed music selection'}
Tracks included: ${trackList}

Write a short, catchy description (2-3 sentences) that captures the mood and vibe of this playlist. Make it sound appealing to potential listeners.`;

    const response = await this.generateCompletion([{ role: 'user', content: prompt }], {
      temperature: 0.8,
      maxTokens: 200,
    });

    return response.content || `A carefully curated playlist featuring ${tracks.length} tracks`;
  }

  /**
   * Generate music insights and analysis
   */
  async generateListeningInsights(analytics) {
    const prompt = `Analyze the following music listening data and provide interesting insights:

Top Genres: ${analytics.topGenres?.map((g) => `${g.genre} (${g.count} plays)`).join(', ') || 'Not available'}
Top Artists: ${analytics.topArtists?.map((a) => `${a.artist} (${a.plays} plays)`).join(', ') || 'Not available'}
Average Audio Features: ${JSON.stringify(analytics.averageFeatures || {})}
Listening Patterns: ${analytics.patterns || 'Not available'}

Provide insights about:
1. Musical taste and preferences
2. Listening behavior patterns
3. Recommendations for music discovery
4. Interesting observations about their music choices

Keep it conversational and engaging, highlighting the most interesting aspects.`;

    const response = await this.generateCompletion([{ role: 'user', content: prompt }], {
      temperature: 0.7,
      maxTokens: 500,
    });

    return response.content;
  }

  estimateTokens(text) {
    // Gemini token estimation (similar to other models)
    return Math.ceil(text.length / 4);
  }
}

module.exports = GeminiProvider;
