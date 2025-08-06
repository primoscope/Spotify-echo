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
  // Determine the best available provider based on API keys
  defaultProvider: process.env.DEFAULT_LLM_PROVIDER || 
                  (process.env.GEMINI_API_KEY ? 'gemini' : 
                   process.env.OPENAI_API_KEY ? 'openai' : 
                   process.env.OPENROUTER_API_KEY ? 'openrouter' : 'mock'),
  defaultModel: process.env.DEFAULT_LLM_MODEL || 'gemini-1.5-flash',
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

/**
 * Submit feedback on chatbot responses
 * POST /api/chat/feedback
 */
router.post('/feedback', requireAuth, chatRateLimit, async (req, res) => {
  try {
    const { sessionId, messageId, feedback, rating, comment, context } = req.body;

    if (!sessionId || (!feedback && !rating)) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'sessionId and either feedback or rating are required'
      });
    }

    // Validate feedback
    const validFeedback = ['helpful', 'not_helpful', 'accurate', 'inaccurate', 'relevant', 'irrelevant'];
    if (feedback && !validFeedback.includes(feedback)) {
      return res.status(400).json({
        error: 'Invalid feedback',
        message: `Feedback must be one of: ${validFeedback.join(', ')}`
      });
    }

    const db = require('../../database/mongodb').getDb();
    const chatFeedbackCollection = db.collection('chat_feedback');

    // Create feedback document
    const feedbackDoc = {
      userId: req.userId,
      sessionId,
      messageId: messageId || null,
      feedback: feedback || null,
      rating: rating || null,
      comment: comment || null,
      context: context || {},
      timestamp: new Date()
    };

    const result = await chatFeedbackCollection.insertOne(feedbackDoc);

    // Update the chat session with feedback
    const chatSessionsCollection = db.collection('chat_sessions');
    await chatSessionsCollection.updateOne(
      { session_id: sessionId, user_id: req.userId },
      {
        $push: {
          feedback: {
            feedbackId: result.insertedId,
            messageId,
            feedback,
            rating,
            timestamp: new Date()
          }
        },
        $set: { updated_at: new Date() }
      }
    );

    res.json({
      success: true,
      feedbackId: result.insertedId,
      message: 'Chat feedback recorded successfully'
    });

  } catch (error) {
    console.error('Error recording chat feedback:', error);
    res.status(500).json({
      error: 'Failed to record chat feedback',
      message: error.message
    });
  }
});

/**
 * Get context chips for enhanced chat interaction
 * GET /api/chat/context-chips
 */
router.get('/context-chips', requireAuth, async (req, res) => {
  try {
    const { category } = req.query;
    
    // Define available context chips
    const contextChips = {
      moods: [
        { id: 'happy', label: 'Happy', emoji: '😊', description: 'Upbeat and positive music' },
        { id: 'sad', label: 'Sad', emoji: '😢', description: 'Melancholic and emotional tracks' },
        { id: 'energetic', label: 'Energetic', emoji: '⚡', description: 'High-energy and motivating' },
        { id: 'calm', label: 'Calm', emoji: '😌', description: 'Peaceful and relaxing vibes' },
        { id: 'romantic', label: 'Romantic', emoji: '💕', description: 'Love songs and romantic ballads' },
        { id: 'angry', label: 'Angry', emoji: '😤', description: 'Aggressive and intense music' },
        { id: 'nostalgic', label: 'Nostalgic', emoji: '🌅', description: 'Throwback and classic hits' },
        { id: 'confident', label: 'Confident', emoji: '💪', description: 'Empowering and bold tracks' }
      ],
      genres: [
        { id: 'pop', label: 'Pop', emoji: '🎵', description: 'Popular and mainstream hits' },
        { id: 'rock', label: 'Rock', emoji: '🎸', description: 'Guitar-driven rock music' },
        { id: 'hip-hop', label: 'Hip-Hop', emoji: '🎤', description: 'Rap and urban beats' },
        { id: 'electronic', label: 'Electronic', emoji: '🎛️', description: 'EDM and electronic dance music' },
        { id: 'jazz', label: 'Jazz', emoji: '🎷', description: 'Smooth jazz and improvisation' },
        { id: 'classical', label: 'Classical', emoji: '🎼', description: 'Orchestral and classical compositions' },
        { id: 'country', label: 'Country', emoji: '🤠', description: 'Country and folk music' },
        { id: 'r&b', label: 'R&B', emoji: '🎹', description: 'Rhythm and blues, soul music' }
      ],
      activities: [
        { id: 'workout', label: 'Workout', emoji: '🏋️', description: 'High-energy gym music' },
        { id: 'study', label: 'Study', emoji: '📚', description: 'Focus and concentration music' },
        { id: 'party', label: 'Party', emoji: '🎉', description: 'Dance and party anthems' },
        { id: 'sleep', label: 'Sleep', emoji: '😴', description: 'Soothing bedtime music' },
        { id: 'commute', label: 'Commute', emoji: '🚗', description: 'Travel and road trip music' },
        { id: 'cooking', label: 'Cooking', emoji: '👨‍🍳', description: 'Kitchen vibes and cooking music' },
        { id: 'relaxation', label: 'Relaxation', emoji: '🧘', description: 'Meditation and chill music' },
        { id: 'work', label: 'Work', emoji: '💼', description: 'Productive work background music' }
      ],
      times: [
        { id: 'morning', label: 'Morning', emoji: '🌅', description: 'Fresh start morning music' },
        { id: 'afternoon', label: 'Afternoon', emoji: '☀️', description: 'Midday energy boost' },
        { id: 'evening', label: 'Evening', emoji: '🌆', description: 'Wind-down evening vibes' },
        { id: 'night', label: 'Night', emoji: '🌙', description: 'Late night mood music' }
      ]
    };

    // Return specific category or all chips
    const response = category && contextChips[category] 
      ? { [category]: contextChips[category] }
      : contextChips;

    // Get user's frequently used chips
    const db = require('../../database/mongodb').getDb();
    const chatSessionsCollection = db.collection('chat_sessions');
    
    const userSessions = await chatSessionsCollection
      .find({ user_id: req.userId })
      .sort({ updated_at: -1 })
      .limit(50)
      .toArray();

    // Analyze context usage
    const contextUsage = {};
    userSessions.forEach(session => {
      if (session.context) {
        Object.keys(session.context).forEach(key => {
          contextUsage[key] = (contextUsage[key] || 0) + 1;
        });
      }
    });

    res.json({
      success: true,
      contextChips: response,
      userFrequent: Object.entries(contextUsage)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([key, count]) => ({ id: key, usageCount: count }))
    });

  } catch (error) {
    console.error('Error getting context chips:', error);
    res.status(500).json({
      error: 'Failed to get context chips',
      message: error.message
    });
  }
});

/**
 * Enhanced send message with context persistence
 * POST /api/chat/message
 */
router.post('/message', requireAuth, chatRateLimit, async (req, res) => {
  try {
    const chatbotInstance = await initializeChatbot();
    const { 
      sessionId, 
      message, 
      provider, 
      model, 
      temperature, 
      maxTokens,
      context = {} // mood, genre, activity, timeOfDay
    } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'sessionId and message are required'
      });
    }

    // Persist context in database for multi-turn conversations
    await persistConversationContext(sessionId, context, req.userId);

    // Get conversation history for context
    const conversationHistory = chatbotInstance.conversationManager.getConversationHistory(sessionId);
    
    // Create enhanced prompt with context and history
    const enhancedMessage = await createContextualMessage(message, context, conversationHistory, req.userId);

    const response = await chatbotInstance.sendMessage(sessionId, enhancedMessage, {
      provider,
      model,
      temperature,
      maxTokens,
      userId: req.userId,
      originalMessage: message,
      context
    });

    // Generate explanation for the response if it includes recommendations
    if (response.recommendations && response.recommendations.length > 0) {
      response.explanation = await generateChatResponseExplanation(
        response.recommendations,
        context,
        message,
        conversationHistory
      );
    }

    res.json({
      success: true,
      ...response,
      context: context,
      conversationTurn: conversationHistory.length + 1
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
 * Test LLM providers without authentication (for development)
 * POST /api/chat/test
 */
router.post('/test', chatRateLimit, async (req, res) => {
  try {
    const chatbotInstance = await initializeChatbot();
    const { message, provider, model } = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'Missing message',
        message: 'Please provide a message to test'
      });
    }

    // Create a session first
    const testUserId = 'test_user';
    
    // Start a conversation session (this will generate a new sessionId)
    const session = await chatbotInstance.startConversation(testUserId, {
      provider: provider || chatbotInstance.config.defaultProvider,
      model: model || chatbotInstance.config.defaultModel
    });

    console.log('Test session created:', session.sessionId);

    // Send the message using the session ID that was actually created
    const response = await chatbotInstance.sendMessage(session.sessionId, message, {
      provider: provider || chatbotInstance.config.defaultProvider,
      model: model || chatbotInstance.config.defaultModel,
      userId: testUserId
    });

    res.json({
      success: true,
      testMode: true,
      sessionCreated: { sessionId: session.sessionId, provider: session.llmProvider },
      providersAvailable: chatbotInstance.getAvailableProviders().map(p => ({
        id: p.id,
        name: p.name,
        isActive: p.isActive
      })),
      ...response
    });

  } catch (error) {
    console.error('Error in test chat:', error);
    res.status(500).json({
      error: 'Failed to test chat',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Persist conversation context in database
 */
async function persistConversationContext(sessionId, context, userId) {
  try {
    const db = require('../../database/mongodb').getDb();
    const chatSessionsCollection = db.collection('chat_sessions');

    await chatSessionsCollection.updateOne(
      { session_id: sessionId, user_id: userId },
      {
        $set: {
          context: { ...context, lastUpdated: new Date() },
          updated_at: new Date()
        }
      },
      { upsert: true }
    );
  } catch (error) {
    console.error('Error persisting conversation context:', error);
  }
}

/**
 * Create contextual message with history and user preferences
 */
async function createContextualMessage(message, context, history, _userId) {
  try {
    let enhancedMessage = message;

    // Add context information
    const contextParts = [];
    if (context.mood) contextParts.push(`I'm feeling ${context.mood}`);
    if (context.activity) contextParts.push(`I'm ${context.activity}`);
    if (context.genre) contextParts.push(`I like ${context.genre} music`);
    if (context.timeOfDay) {
      const timeDescription = getTimeDescription(context.timeOfDay);
      contextParts.push(`It's ${timeDescription}`);
    }

    if (contextParts.length > 0) {
      enhancedMessage = `Context: ${contextParts.join(', ')}. ${message}`;
    }

    // Add conversation continuity if this isn't the first message
    if (history.length > 0) {
      const lastMessage = history[history.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        enhancedMessage = `Following up on our conversation about music recommendations: ${enhancedMessage}`;
      }
    }

    return enhancedMessage;
  } catch (error) {
    console.error('Error creating contextual message:', error);
    return message;
  }
}

/**
 * Generate explanation for chat response with recommendations
 */
async function generateChatResponseExplanation(recommendations, context, originalMessage, history) {
  try {
    const explanation = {
      summary: '',
      reasoning: [],
      contextFactors: [],
      conversationFlow: ''
    };

    // Base explanation
    explanation.summary = 'I selected these songs based on your request and current context.';

    // Add context-based reasoning
    if (context.mood) {
      explanation.reasoning.push(`Chose ${context.mood} music to match your current mood`);
      explanation.contextFactors.push({
        factor: 'mood',
        value: context.mood,
        influence: 'high'
      });
    }

    if (context.activity) {
      explanation.reasoning.push(`Selected tracks perfect for ${context.activity}`);
      explanation.contextFactors.push({
        factor: 'activity',
        value: context.activity,
        influence: 'high'
      });
    }

    if (context.genre) {
      explanation.reasoning.push(`Focused on ${context.genre} genre as requested`);
      explanation.contextFactors.push({
        factor: 'genre',
        value: context.genre,
        influence: 'high'
      });
    }

    // Analyze conversation flow
    if (history.length > 2) {
      explanation.conversationFlow = 'Building on our previous conversation to refine recommendations';
    } else if (history.length > 0) {
      explanation.conversationFlow = 'First recommendation based on your initial request';
    }

    // Add message-specific reasoning
    if (originalMessage.toLowerCase().includes('similar')) {
      explanation.reasoning.push('Found tracks similar to your preferences');
    }
    if (originalMessage.toLowerCase().includes('new')) {
      explanation.reasoning.push('Included fresh discoveries you might not have heard');
    }
    if (originalMessage.toLowerCase().includes('popular')) {
      explanation.reasoning.push('Featured trending and popular tracks');
    }

    return explanation;
  } catch (error) {
    console.error('Error generating chat response explanation:', error);
    return {
      summary: 'Recommendations generated based on your request',
      reasoning: ['Selected using AI music intelligence'],
      contextFactors: [],
      conversationFlow: ''
    };
  }
}

/**
 * Get human-readable time description
 */
function getTimeDescription(timeOfDay) {
  const hour = parseInt(timeOfDay) || new Date().getHours();
  
  if (hour >= 5 && hour < 12) return 'morning time';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'late night';
}

module.exports = router;