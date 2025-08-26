/**
 * Socket.IO Real-time Service Manager
 * Phase 5B: Extracted from server.js for enterprise real-time capabilities
 * Provides real-time chat and notification functionality
 */

const EchoTuneChatbot = require('../chat/chatbot');

class SocketService {
  constructor() {
    this.io = null;
    this.socketChatbot = null;
    this.isInitialized = false;
  }

  /**
   * Initialize Socket.IO service with chatbot integration
   * @param {Server} io - Socket.IO server instance
   */
  async initialize(io) {
    if (this.isInitialized) {
      console.log('🔗 Socket.IO service already initialized');
      return;
    }

    this.io = io;

    // Initialize chatbot for Socket.IO
    const chatbotConfig = {
      llmProviders: {
        openai: {
          apiKey: process.env.OPENAI_API_KEY,
          model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        },
        gemini: {
          apiKey: process.env.GEMINI_API_KEY,
          model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
        },
        azure: {
          apiKey: process.env.AZURE_OPENAI_API_KEY,
          endpoint: process.env.AZURE_OPENAI_ENDPOINT,
          deployment: process.env.AZURE_OPENAI_DEPLOYMENT,
        },
        openrouter: {
          apiKey: process.env.OPENROUTER_API_KEY,
          model: process.env.OPENROUTER_MODEL || 'deepseek/deepseek-r1-0528:free',
        },
      },
      // Determine the best available provider based on API keys - prioritize Gemini
      defaultProvider:
        process.env.DEFAULT_LLM_PROVIDER ||
        (process.env.GEMINI_API_KEY
          ? 'gemini'
          : process.env.OPENAI_API_KEY
            ? 'openai'
            : process.env.OPENROUTER_API_KEY
              ? 'openrouter'
              : 'mock'),
      defaultModel: process.env.DEFAULT_LLM_MODEL || 'gemini-1.5-flash',
      enableMockProvider: true,
    };

    await this.initializeSocketChatbot(chatbotConfig);
    this.setupEventHandlers();
    this.isInitialized = true;
    
    console.log('🔗 Socket.IO service initialized');
  }

  /**
   * Initialize chatbot for Socket.IO
   * @private
   */
  async initializeSocketChatbot(config) {
    if (!this.socketChatbot) {
      this.socketChatbot = new EchoTuneChatbot(config);
      await this.socketChatbot.initialize();
      console.log('🔗 Socket.IO Chatbot initialized');
    }
    return this.socketChatbot;
  }

  /**
   * Setup Socket.IO event handlers
   * @private
   */
  setupEventHandlers() {
    // Socket.IO connection handling
    this.io.on('connection', async (socket) => {
      console.log(`🔗 Client connected: ${socket.id}`);

      try {
        // Send connection confirmation
        socket.emit('connected', {
          message: 'Connected to EchoTune AI',
          socketId: socket.id,
          timestamp: new Date().toISOString(),
          providers: this.socketChatbot.getAvailableProviders(),
        });

        // Handle chat messages
        socket.on('chat_message', async (data) => {
          await this.handleChatMessage(socket, data);
        });

        // Handle streaming chat messages
        socket.on('chat_stream', async (data) => {
          await this.handleStreamingChat(socket, data);
        });

        // Handle disconnect
        socket.on('disconnect', () => {
          console.log(`🔌 Client disconnected: ${socket.id}`);
        });

      } catch (error) {
        console.error('Socket connection error:', error);
        socket.emit('error', {
          message: 'Connection initialization failed',
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    });
  }

  /**
   * Handle regular chat messages
   * @private
   */
  async handleChatMessage(socket, data) {
    try {
      const { message, sessionId, provider, userId = `socket_${socket.id}` } = data;

      if (!message) {
        socket.emit('error', { message: 'Message is required' });
        return;
      }

      // Emit typing indicator
      socket.emit('typing_start', { timestamp: new Date().toISOString() });

      let activeSessionId = sessionId;

      // Create session if not provided
      if (!activeSessionId) {
        const session = await this.socketChatbot.startConversation(userId, { provider });
        activeSessionId = session.sessionId;
        socket.emit('session_created', { sessionId: activeSessionId });
      }

      // Send message to chatbot
      const response = await this.socketChatbot.sendMessage(activeSessionId, message, {
        provider: provider || this.socketChatbot.config.defaultProvider,
        userId,
      });

      // Stop typing indicator
      socket.emit('typing_stop');

      // Send response
      socket.emit('chat_response', {
        ...response,
        sessionId: activeSessionId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Socket chat error:', error);
      socket.emit('typing_stop');
      socket.emit('error', {
        message: 'Failed to process message',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Handle streaming chat messages
   * @private
   */
  async handleStreamingChat(socket, data) {
    try {
      const { message, sessionId, provider, userId = `socket_${socket.id}` } = data;

      if (!message) {
        socket.emit('error', { message: 'Message is required' });
        return;
      }

      let activeSessionId = sessionId;

      // Create session if not provided
      if (!activeSessionId) {
        const session = await this.socketChatbot.startConversation(userId, { provider });
        activeSessionId = session.sessionId;
        socket.emit('session_created', { sessionId: activeSessionId });
      }

      // Send stream start event
      socket.emit('stream_start', { sessionId: activeSessionId });

      // Stream response
      await this.socketChatbot.streamMessage(activeSessionId, message, {
        provider: provider || this.socketChatbot.config.defaultProvider,
        userId,
        onChunk: (chunk) => {
          socket.emit('stream_chunk', {
            chunk,
            sessionId: activeSessionId,
            timestamp: new Date().toISOString(),
          });
        },
        onComplete: (finalResponse) => {
          socket.emit('stream_complete', {
            response: finalResponse,
            sessionId: activeSessionId,
            timestamp: new Date().toISOString(),
          });
        },
      });
    } catch (error) {
      console.error('Socket streaming error:', error);
      socket.emit('error', {
        message: 'Failed to stream message',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      connected: this.io ? this.io.engine.clientsCount : 0,
      chatbotReady: !!this.socketChatbot,
    };
  }
}

// Singleton instance
let socketService = null;

/**
 * Get the singleton SocketService instance
 */
function getSocketService() {
  if (!socketService) {
    socketService = new SocketService();
  }
  return socketService;
}

module.exports = {
  SocketService,
  getSocketService,
};