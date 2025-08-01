const OpenAIProvider = require('./llm-providers/openai-provider');
const GeminiProvider = require('./llm-providers/gemini-provider');
const CustomAPIProvider = require('./llm-providers/custom-provider');
const MockLLMProvider = require('./llm-providers/mock-provider');
const ConversationManager = require('./conversation-manager');
const RecommendationEngine = require('../ml/recommendation-engine');
const SpotifyAudioFeaturesService = require('../spotify/audio-features');

/**
 * Main Chatbot Class for EchoTune AI
 * Coordinates LLM providers, conversation management, and music functionality
 */
class EchoTuneChatbot {
  constructor(config = {}) {
    this.config = config;
    this.providers = new Map();
    this.currentProvider = null;
    this.conversationManager = new ConversationManager();
    this.recommendationEngine = new RecommendationEngine();
    this.spotifyService = new SpotifyAudioFeaturesService();
    
    // Initialize providers based on config
    this.initializeProviders();
    
    // Start session cleanup
    this.conversationManager.startPeriodicCleanup();
  }

  /**
   * Initialize all available LLM providers
   */
  initializeProviders() {
    const providerConfigs = this.config.llmProviders || {};
    let hasConfiguredProvider = false;

    // OpenAI Provider
    if (providerConfigs.openai?.apiKey) {
      const openaiProvider = new OpenAIProvider(providerConfigs.openai);
      this.providers.set('openai', openaiProvider);
      hasConfiguredProvider = true;
    }

    // Gemini Provider
    if (providerConfigs.gemini?.apiKey) {
      const geminiProvider = new GeminiProvider(providerConfigs.gemini);
      this.providers.set('gemini', geminiProvider);
      hasConfiguredProvider = true;
    }

    // Azure OpenAI Provider
    if (providerConfigs.azure?.apiKey) {
      const azureConfig = CustomAPIProvider.createAzureConfig(providerConfigs.azure);
      const azureProvider = new CustomAPIProvider(azureConfig);
      this.providers.set('azure', azureProvider);
      hasConfiguredProvider = true;
    }

    // OpenRouter Provider
    if (providerConfigs.openrouter?.apiKey) {
      const openrouterConfig = CustomAPIProvider.createOpenRouterConfig(providerConfigs.openrouter);
      const openrouterProvider = new CustomAPIProvider(openrouterConfig);
      this.providers.set('openrouter', openrouterProvider);
      hasConfiguredProvider = true;
    }

    // Custom API Providers
    if (providerConfigs.custom && Array.isArray(providerConfigs.custom)) {
      providerConfigs.custom.forEach((customConfig, index) => {
        const config = CustomAPIProvider.createCustomConfig(customConfig);
        const customProvider = new CustomAPIProvider(config);
        this.providers.set(`custom_${index}`, customProvider);
        hasConfiguredProvider = true;
      });
    }

    // Add Mock Provider as fallback if no real providers are configured
    if (!hasConfiguredProvider || this.config.enableMockProvider) {
      const mockProvider = new MockLLMProvider({ enabledByDefault: !hasConfiguredProvider });
      this.providers.set('mock', mockProvider);
      console.log(`🎭 Mock provider added ${!hasConfiguredProvider ? '(no API keys configured)' : '(demo mode enabled)'}`);
    }

    // Set default provider
    this.currentProvider = this.config.defaultProvider || 
                          (hasConfiguredProvider ? 'openai' : 'mock');
    
    console.log(`🤖 Initialized ${this.providers.size} LLM providers`);
  }

  /**
   * Initialize all providers
   */
  async initialize() {
    const initPromises = Array.from(this.providers.entries()).map(async ([name, provider]) => {
      try {
        await provider.initialize();
        console.log(`✅ ${name} provider ready`);
      } catch (error) {
        console.error(`❌ Failed to initialize ${name} provider:`, error.message);
      }
    });

    await Promise.allSettled(initPromises);
    
    const availableProviders = Array.from(this.providers.entries())
      .filter(([, provider]) => provider.isAvailable())
      .map(([name]) => name);

    console.log(`🎯 Available providers: ${availableProviders.join(', ')}`);
    
    if (availableProviders.length === 0) {
      console.warn('⚠️ No LLM providers are available. The system may not function properly.');
      // Don't throw error, let mock provider handle it
    }

    // Use first available provider if current is not available
    if (!availableProviders.includes(this.currentProvider)) {
      if (availableProviders.length > 0) {
        this.currentProvider = availableProviders[0];
        console.log(`🔄 Switched to ${this.currentProvider} provider`);
      } else {
        console.log('🎭 Using mock provider for demo functionality');
      }
    }
  }

  /**
   * Start or continue a conversation
   */
  async startConversation(userId, options = {}) {
    const { sessionId, provider, model } = options;
    
    // Switch provider if requested
    if (provider && this.providers.has(provider)) {
      this.currentProvider = provider;
    }

    const sessionOptions = {
      llmProvider: this.currentProvider,
      model: model || this.config.defaultModel,
      ...options
    };

    const session = await this.conversationManager.getOrCreateSession(
      userId, 
      sessionId, 
      sessionOptions
    );

    return {
      sessionId: session.sessionId,
      provider: this.currentProvider,
      capabilities: this.getProviderCapabilities(),
      context: session.context
    };
  }

  /**
   * Send a message and get response
   */
  async sendMessage(sessionId, message, options = {}) {
    const startTime = Date.now();
    
    try {
      // Get session
      const session = this.conversationManager.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found. Please start a new conversation.');
      }

      // Switch provider if requested
      if (options.provider && this.providers.has(options.provider)) {
        this.currentProvider = options.provider;
      }

      const provider = this.providers.get(this.currentProvider);
      if (!provider || !provider.isAvailable()) {
        throw new Error(`Provider ${this.currentProvider} is not available`);
      }

      // Add user message to conversation
      await this.conversationManager.addMessage(sessionId, {
        role: 'user',
        content: message
      });

      // Check for special commands
      const commandResponse = await this.handleSpecialCommands(message, session, options);
      if (commandResponse) {
        await this.conversationManager.addMessage(sessionId, {
          role: 'assistant',
          content: commandResponse.content
        }, {
          responseTime: Date.now() - startTime,
          ...commandResponse.metadata
        });

        return {
          response: commandResponse.content,
          sessionId,
          provider: this.currentProvider,
          metadata: commandResponse.metadata,
          responseTime: Date.now() - startTime
        };
      }

      // Get conversation history for LLM
      const messages = this.conversationManager.getMessagesForLLM(sessionId, {
        maxMessages: options.maxHistory || 10
      });

      // Generate response
      const llmResponse = await provider.generateCompletion(messages, {
        model: options.model || session.metadata.model,
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 1500,
        functions: this.getMusicFunctions(),
        ...options.llmOptions
      });

      if (llmResponse.error) {
        throw new Error(llmResponse.message);
      }

      // Handle function calls if present
      let finalResponse = llmResponse.content;
      let functionResults = null;

      if (llmResponse.functionCall || llmResponse.toolCalls) {
        functionResults = await this.handleFunctionCalls(
          llmResponse.functionCall || llmResponse.toolCalls,
          session,
          options
        );
        
        if (functionResults) {
          // Generate follow-up response with function results
          const followUpMessages = [
            ...messages,
            {
              role: 'assistant',
              content: llmResponse.content,
              function_call: llmResponse.functionCall
            },
            {
              role: 'function',
              content: JSON.stringify(functionResults),
              name: llmResponse.functionCall?.name
            }
          ];

          const followUpResponse = await provider.generateCompletion(followUpMessages, {
            model: options.model || session.metadata.model,
            temperature: 0.7,
            maxTokens: 1000
          });

          finalResponse = followUpResponse.content || finalResponse;
        }
      }

      // Add assistant message to conversation
      const responseMetadata = {
        responseTime: Date.now() - startTime,
        provider: this.currentProvider,
        model: llmResponse.model,
        tokens: llmResponse.usage?.totalTokens || 0,
        functionCalls: functionResults ? 1 : 0
      };

      await this.conversationManager.addMessage(sessionId, {
        role: 'assistant',
        content: finalResponse
      }, responseMetadata);

      return {
        response: finalResponse,
        sessionId,
        provider: this.currentProvider,
        functionResults,
        metadata: responseMetadata
      };

    } catch (error) {
      console.error('Error in sendMessage:', error);
      
      const errorResponse = 'I apologize, but I encountered an error while processing your message. Please try again or rephrase your request.';
      
      try {
        await this.conversationManager.addMessage(sessionId, {
          role: 'assistant',
          content: errorResponse
        }, {
          responseTime: Date.now() - startTime,
          error: error.message
        });
      } catch (dbError) {
        console.error('Error saving error message:', dbError);
      }

      return {
        response: errorResponse,
        sessionId,
        error: error.message,
        metadata: {
          responseTime: Date.now() - startTime,
          error: true
        }
      };
    }
  }

  /**
   * Stream a response (for real-time chat)
   */
  async* streamMessage(sessionId, message, options = {}) {
    const startTime = Date.now();
    
    try {
      const session = this.conversationManager.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const provider = this.providers.get(this.currentProvider);
      if (!provider || !provider.isAvailable()) {
        throw new Error(`Provider ${this.currentProvider} is not available`);
      }

      // Add user message
      await this.conversationManager.addMessage(sessionId, {
        role: 'user',
        content: message
      });

      // Get conversation history
      const messages = this.conversationManager.getMessagesForLLM(sessionId);

      let fullResponse = '';
      
      // Stream response
      for await (const chunk of provider.generateStreamingCompletion(messages, options)) {
        if (chunk.error) {
          yield { error: chunk.message, type: 'error' };
          return;
        }

        if (chunk.content) {
          fullResponse += chunk.content;
          yield {
            content: chunk.content,
            type: 'chunk',
            isPartial: chunk.isPartial
          };
        }
      }

      // Save complete response
      await this.conversationManager.addMessage(sessionId, {
        role: 'assistant',
        content: fullResponse
      }, {
        responseTime: Date.now() - startTime,
        provider: this.currentProvider,
        streaming: true
      });

      yield {
        type: 'complete',
        totalTime: Date.now() - startTime
      };

    } catch (error) {
      yield { 
        error: error.message, 
        type: 'error' 
      };
    }
  }

  /**
   * Handle special commands
   */
  async handleSpecialCommands(message, session) {
    const lowerMessage = message.toLowerCase().trim();

    // Playlist creation command
    if (lowerMessage.startsWith('/create playlist')) {
      return await this.handleCreatePlaylistCommand(message, session);
    }

    // Get recommendations command
    if (lowerMessage.startsWith('/recommend')) {
      return await this.handleRecommendCommand(message, session);
    }

    // Analyze listening habits command
    if (lowerMessage.startsWith('/analyze')) {
      return await this.handleAnalyzeCommand(message, session);
    }

    // Help command
    if (lowerMessage === '/help' || lowerMessage === 'help') {
      return {
        content: this.getHelpMessage(),
        metadata: { command: 'help' }
      };
    }

    // Switch provider command
    if (lowerMessage.startsWith('/provider')) {
      const providerName = lowerMessage.split(' ')[1];
      return await this.handleProviderSwitch(providerName);
    }

    return null; // No special command found
  }

  /**
   * Handle function calls from LLM
   */
  async handleFunctionCalls(functionCall, session, options) {
    try {
      const functionName = functionCall.name;
      const args = JSON.parse(functionCall.arguments || '{}');

      switch (functionName) {
        case 'search_tracks':
          return await this.searchTracks(args, session);
        
        case 'create_playlist':
          return await this.createPlaylist(args, session, options);
        
        case 'get_recommendations':
          return await this.getRecommendations(args, session);
        
        case 'analyze_listening_habits':
          return await this.analyzeListeningHabits(args, session);
        
        default:
          return { error: `Unknown function: ${functionName}` };
      }
    } catch (error) {
      console.error('Error handling function call:', error);
      return { error: error.message };
    }
  }

  /**
   * Search for tracks
   */
  async searchTracks(args) {
    // This would integrate with Spotify API to search tracks
    // For now, return mock data
    return {
      tracks: [
        {
          id: 'track1',
          name: 'Example Song',
          artists: ['Example Artist'],
          preview_url: 'https://example.com/preview.mp3'
        }
      ],
      total: 1,
      query: args.query
    };
  }

  /**
   * Create a playlist
   */
  async createPlaylist(args) {
    // This would integrate with Spotify API to create playlists
    return {
      playlist: {
        id: 'playlist123',
        name: args.name,
        description: args.description,
        tracks_count: args.tracks?.length || 0
      },
      success: true
    };
  }

  /**
   * Get personalized recommendations
   */
  async getRecommendations(args, session) {
    try {
      const recommendations = await this.recommendationEngine.generateRecommendations(
        session.userId,
        {
          limit: args.limit || 10,
          mood: args.target_features?.mood,
          activity: args.target_features?.activity
        }
      );

      return {
        recommendations: recommendations.recommendations,
        total: recommendations.recommendations.length,
        algorithm: 'hybrid'
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Analyze listening habits
   */
  async analyzeListeningHabits() {
    // This would analyze user's listening data
    return {
      analysis: {
        top_genres: ['Pop', 'Rock', 'Electronic'],
        top_artists: ['Artist 1', 'Artist 2'],
        listening_time: '50 hours',
        most_active_time: 'Evening'
      },
      insights: 'You have diverse musical taste with a preference for upbeat tracks.'
    };
  }

  /**
   * Get available providers and their capabilities
   */
  getAvailableProviders() {
    return Array.from(this.providers.entries())
      .filter(([, provider]) => provider.isAvailable())
      .map(([name, provider]) => ({
        name,
        capabilities: provider.getCapabilities(),
        isActive: name === this.currentProvider
      }));
  }

  /**
   * Switch LLM provider
   */
  async switchProvider(providerName) {
    if (!this.providers.has(providerName)) {
      throw new Error(`Provider ${providerName} not found`);
    }

    const provider = this.providers.get(providerName);
    if (!provider.isAvailable()) {
      throw new Error(`Provider ${providerName} is not available`);
    }

    this.currentProvider = providerName;
    console.log(`🔄 Switched to ${providerName} provider`);
    
    return {
      provider: providerName,
      capabilities: provider.getCapabilities()
    };
  }

  /**
   * Get current provider capabilities
   */
  getProviderCapabilities() {
    const provider = this.providers.get(this.currentProvider);
    return provider ? provider.getCapabilities() : null;
  }

  /**
   * Get music-related functions for LLM
   */
  getMusicFunctions() {
    const provider = this.providers.get(this.currentProvider);
    if (provider && provider.getMusicFunctions) {
      return provider.getMusicFunctions();
    }
    return [];
  }

  /**
   * Get help message
   */
  getHelpMessage() {
    return `🎵 EchoTune AI Help

I'm your personal music assistant! Here's what I can help you with:

**Music Discovery:**
- "Recommend some upbeat songs for working out"
- "Find me some calm acoustic music"
- "What's similar to [song name]?"

**Playlist Creation:**
- "Create a playlist for studying"
- "Make a road trip playlist"
- "/create playlist [name] with [mood/genre]"

**Music Analysis:**
- "Analyze my listening habits"
- "What are my top genres?"
- "/analyze [week/month/year]"

**Commands:**
- /help - Show this help message
- /recommend [criteria] - Get recommendations
- /analyze [period] - Analyze listening data
- /provider [name] - Switch AI provider

**Available Providers:**
${this.getAvailableProviders().map(p => `- ${p.name} ${p.isActive ? '(active)' : ''}`).join('\n')}

Just ask me anything about music and I'll help you discover your next favorite song! 🎶`;
  }

  /**
   * Get conversation statistics
   */
  getStats() {
    const activeSessionsCount = this.conversationManager.activeSessions.size;
    const providersStatus = this.getAvailableProviders();
    
    return {
      activeSessions: activeSessionsCount,
      currentProvider: this.currentProvider,
      availableProviders: providersStatus.length,
      providers: providersStatus
    };
  }
}

module.exports = EchoTuneChatbot;