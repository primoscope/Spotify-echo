const express = require('express');
const EchoTuneChatbot = require('../../chat/chatbot');
const { requireAuth, createRateLimit } = require('../middleware');

const router = express.Router();

// Initialize chatbot with configuration
const chatbotConfig = {
  llmProviders: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo'
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash'
    },
    azure: {
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      deployment: process.env.AZURE_OPENAI_DEPLOYMENT
    },
    openrouter: {
      apiKey: process.env.OPENROUTER_API_KEY,
      model: process.env.OPENROUTER_MODEL || process.env.DEFAULT_LLM_MODEL || 'deepseek/deepseek-r1-0528:free'
    }
  },
  defaultProvider: process.env.DEFAULT_LLM_PROVIDER || 'mock', // Use mock as default fallback
  defaultModel: process.env.DEFAULT_LLM_MODEL || 'mock-music-assistant',
  enableMockProvider: true // Always enable mock provider for demo functionality
};

let chatbot = null;

// Initialize chatbot
async function initializeChatbot() {
  if (!chatbot) {
    chatbot = new EchoTuneChatbot(chatbotConfig);
    await chatbot.initialize();
    console.log('🤖 Chatbot initialized successfully');
  }
  return chatbot;
}

// Rate limiting for chat endpoints
const chatRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window per IP
  message: 'Too many chat requests, please slow down'
});

/**
 * Start a new conversation or get existing session
 * POST /api/chat/start
 */
router.post('/start', requireAuth, chatRateLimit, async (req, res) => {
  try {
    const chatbotInstance = await initializeChatbot();
    const { sessionId, provider, model } = req.body;

    const session = await chatbotInstance.startConversation(req.userId, {
      sessionId,
      provider,
      model
    });

    res.json({
      success: true,
      session,
      message: 'Conversation started successfully'
    });

  } catch (error) {
    console.error('Error starting conversation:', error);
    res.status(500).json({
      error: 'Failed to start conversation',
      message: error.message
    });
  }
});

/**
 * Send a message to the chatbot
 * POST /api/chat/message
 */
router.post('/message', requireAuth, chatRateLimit, async (req, res) => {
  try {
    const chatbotInstance = await initializeChatbot();
    const { sessionId, message, provider, model, temperature, maxTokens } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'sessionId and message are required'
      });
    }

    const response = await chatbotInstance.sendMessage(sessionId, message, {
      provider,
      model,
      temperature,
      maxTokens
    });

    res.json({
      success: true,
      ...response
    });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      error: 'Failed to send message',
      message: error.message
    });
  }
});

/**
 * Stream a conversation (Server-Sent Events)
 * POST /api/chat/stream
 */
router.post('/stream', requireAuth, chatRateLimit, async (req, res) => {
  try {
    const chatbotInstance = await initializeChatbot();
    const { sessionId, message, provider, model } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'sessionId and message are required'
      });
    }

    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': req.headers.origin || '*',
      'Access-Control-Allow-Credentials': 'true'
    });

    // Send initial connection event
    res.write('event: connected\n');
    res.write('data: {"message": "Connected to chat stream"}\n\n');

    try {
      for await (const chunk of chatbotInstance.streamMessage(sessionId, message, { provider, model })) {
        if (chunk.error) {
          res.write('event: error\n');
          res.write(`data: ${JSON.stringify({ error: chunk.error })}\n\n`);
          break;
        } else if (chunk.type === 'chunk') {
          res.write('event: message\n');
          res.write(`data: ${JSON.stringify({ content: chunk.content, isPartial: chunk.isPartial })}\n\n`);
        } else if (chunk.type === 'complete') {
          res.write('event: complete\n');
          res.write(`data: ${JSON.stringify({ totalTime: chunk.totalTime })}\n\n`);
          break;
        }
      }
    } catch (streamError) {
      res.write('event: error\n');
      res.write(`data: ${JSON.stringify({ error: streamError.message })}\n\n`);
    }

    res.end();

  } catch (error) {
    console.error('Error in stream endpoint:', error);
    res.status(500).json({
      error: 'Failed to initialize stream',
      message: error.message
    });
  }
});

/**
 * Get conversation history
 * GET /api/chat/history/:sessionId
 */
router.get('/history/:sessionId', requireAuth, async (req, res) => {
  try {
    const chatbotInstance = await initializeChatbot();
    const { sessionId } = req.params;
    const { limit = 50, excludeSystem = true } = req.query;

    const history = chatbotInstance.conversationManager.getConversationHistory(sessionId, {
      limit: parseInt(limit),
      excludeSystem: excludeSystem === 'true'
    });

    res.json({
      success: true,
      sessionId,
      messages: history,
      count: history.length
    });

  } catch (error) {
    console.error('Error getting conversation history:', error);
    res.status(500).json({
      error: 'Failed to get conversation history',
      message: error.message
    });
  }
});

/**
 * Get available LLM providers
 * GET /api/chat/providers
 */
router.get('/providers', async (req, res) => {
  try {
    const chatbotInstance = await initializeChatbot();
    const providers = chatbotInstance.getAvailableProviders();

    res.json({
      success: true,
      providers,
      currentProvider: chatbotInstance.currentProvider
    });

  } catch (error) {
    console.error('Error getting providers:', error);
    res.status(500).json({
      error: 'Failed to get providers',
      message: error.message
    });
  }
});

/**
 * Switch LLM provider
 * POST /api/chat/provider
 */
router.post('/provider', requireAuth, async (req, res) => {
  try {
    const chatbotInstance = await initializeChatbot();
    const { provider } = req.body;

    if (!provider) {
      return res.status(400).json({
        error: 'Missing provider name'
      });
    }

    const result = await chatbotInstance.switchProvider(provider);

    res.json({
      success: true,
      ...result,
      message: `Switched to ${provider} provider`
    });

  } catch (error) {
    console.error('Error switching provider:', error);
    res.status(400).json({
      error: 'Failed to switch provider',
      message: error.message
    });
  }
});

/**
 * Export conversation
 * GET /api/chat/export/:sessionId
 */
router.get('/export/:sessionId', requireAuth, async (req, res) => {
  try {
    const chatbotInstance = await initializeChatbot();
    const { sessionId } = req.params;
    const { format = 'json' } = req.query;

    const exportData = await chatbotInstance.conversationManager.exportConversation(sessionId, format);

    if (format === 'text') {
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="conversation-${sessionId}.txt"`);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="conversation-${sessionId}.json"`);
    }

    res.send(exportData);

  } catch (error) {
    console.error('Error exporting conversation:', error);
    res.status(500).json({
      error: 'Failed to export conversation',
      message: error.message
    });
  }
});

/**
 * Get chatbot statistics
 * GET /api/chat/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const chatbotInstance = await initializeChatbot();
    const stats = chatbotInstance.getStats();

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error getting chatbot stats:', error);
    res.status(500).json({
      error: 'Failed to get statistics',
      message: error.message
    });
  }
});

/**
 * Health check for chat service
 * GET /api/chat/health
 */
router.get('/health', async (req, res) => {
  try {
    const chatbotInstance = await initializeChatbot();
    const providers = chatbotInstance.getAvailableProviders();
    const activeProviders = providers.filter(p => p.isActive).length;

    res.json({
      status: 'healthy',
      chatbot: {
        initialized: !!chatbotInstance,
        activeProviders,
        totalProviders: providers.length,
        currentProvider: chatbotInstance.currentProvider
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;