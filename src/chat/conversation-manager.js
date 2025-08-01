const { v4: uuidv4 } = require('uuid');
const mongoManager = require('../database/mongodb');

/**
 * Conversation Manager for EchoTune AI
 * Handles chat sessions, message history, and context management
 */
class ConversationManager {
  constructor() {
    this.activeSessions = new Map();
    this.maxSessionHistory = 50;
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
  }

  /**
   * Start a new conversation session
   */
  async startSession(userId, options = {}) {
    const sessionId = uuidv4();
    const session = {
      sessionId,
      userId,
      startTime: new Date(),
      lastActivity: new Date(),
      messages: [],
      context: {
        userProfile: null,
        currentPlaylist: null,
        lastRecommendations: null,
        musicPreferences: {},
        conversationGoals: [],
        ...options.context
      },
      metadata: {
        llmProvider: options.llmProvider || 'openai',
        model: options.model || 'gpt-3.5-turbo',
        language: options.language || 'en',
        sessionType: options.sessionType || 'general'
      }
    };

    // Load user profile and context
    await this.loadUserContext(session);

    this.activeSessions.set(sessionId, session);
    
    // Save to database
    await this.saveSessionToDatabase(session);

    console.log(`🆕 Started new conversation session ${sessionId} for user ${userId}`);
    return session;
  }

  /**
   * Get existing session or create new one
   */
  async getOrCreateSession(userId, sessionId = null, options = {}) {
    if (sessionId && this.activeSessions.has(sessionId)) {
      const session = this.activeSessions.get(sessionId);
      if (session.userId === userId) {
        session.lastActivity = new Date();
        return session;
      }
    }

    // Try to load from database if sessionId provided
    if (sessionId) {
      const dbSession = await this.loadSessionFromDatabase(sessionId, userId);
      if (dbSession) {
        this.activeSessions.set(sessionId, dbSession);
        return dbSession;
      }
    }

    // Create new session
    return await this.startSession(userId, options);
  }

  /**
   * Add message to conversation
   */
  async addMessage(sessionId, message, options = {}) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const messageObj = {
      id: uuidv4(),
      role: message.role,
      content: message.content,
      timestamp: new Date(),
      metadata: {
        tokens: options.tokens || 0,
        model: options.model || session.metadata.model,
        responseTime: options.responseTime || 0,
        ...options.metadata
      }
    };

    session.messages.push(messageObj);
    session.lastActivity = new Date();

    // Trim old messages if exceeding limit
    if (session.messages.length > this.maxSessionHistory) {
      const systemMessages = session.messages.filter(m => m.role === 'system');
      const otherMessages = session.messages.filter(m => m.role !== 'system');
      
      // Keep system messages and recent messages
      const keepCount = this.maxSessionHistory - systemMessages.length;
      session.messages = [
        ...systemMessages,
        ...otherMessages.slice(-keepCount)
      ];
    }

    // Save to database
    await this.saveMessageToDatabase(sessionId, messageObj);

    return messageObj;
  }

  /**
   * Get conversation history
   */
  getConversationHistory(sessionId, options = {}) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return [];
    }

    const { limit = 20, excludeSystem = false } = options;
    let messages = session.messages;

    if (excludeSystem) {
      messages = messages.filter(m => m.role !== 'system');
    }

    return messages.slice(-limit);
  }

  /**
   * Update session context
   */
  async updateSessionContext(sessionId, contextUpdate) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    session.context = {
      ...session.context,
      ...contextUpdate
    };

    session.lastActivity = new Date();

    // Save context update to database
    await this.updateSessionInDatabase(sessionId, { context: session.context });

    return session.context;
  }

  /**
   * Load user context for session
   */
  async loadUserContext(session) {
    try {
      const db = mongoManager.getDb();
      
      // Load user profile
      const userProfileCollection = db.collection('user_profiles');
      const userProfile = await userProfileCollection.findOne({ _id: session.userId });
      
      if (userProfile) {
        session.context.userProfile = userProfile;
        session.context.musicPreferences = userProfile.preferences || {};
      }

      // Load recent listening history
      const listeningHistoryCollection = db.collection('listening_history');
      const recentHistory = await listeningHistoryCollection
        .find({ user_id: session.userId })
        .sort({ played_at: -1 })
        .limit(20)
        .toArray();

      session.context.recentListeningHistory = recentHistory;

      // Load recent recommendations
      const recommendationsCollection = db.collection('recommendations');
      const recentRecommendations = await recommendationsCollection
        .findOne(
          { user_id: session.userId },
          { sort: { created_at: -1 } }
        );

      if (recentRecommendations) {
        session.context.lastRecommendations = recentRecommendations;
      }

    } catch (error) {
      console.error('Error loading user context:', error);
    }
  }

  /**
   * Get messages formatted for LLM
   */
  getMessagesForLLM(sessionId, options = {}) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return [];
    }

    const { includeContext = true, maxMessages = 10 } = options;
    
    let messages = [];

    // Add system message with context
    if (includeContext) {
      const systemMessage = this.buildSystemMessage(session);
      messages.push(systemMessage);
    }

    // Add conversation history
    const history = this.getConversationHistory(sessionId, { 
      limit: maxMessages,
      excludeSystem: true 
    });

    messages.push(...history.map(msg => ({
      role: msg.role,
      content: msg.content
    })));

    return messages;
  }

  /**
   * Build system message with user context
   */
  buildSystemMessage(session) {
    const context = session.context;
    let systemContent = `You are EchoTune AI, an intelligent music assistant that helps users discover new music, create playlists, and explore their musical tastes.

Current user context:`;

    if (context.userProfile) {
      systemContent += `\n- User: ${context.userProfile.display_name}`;
      if (context.userProfile.preferences?.favorite_genres?.length > 0) {
        systemContent += `\n- Favorite genres: ${context.userProfile.preferences.favorite_genres.join(', ')}`;
      }
    }

    if (context.recentListeningHistory?.length > 0) {
      const recentTracks = context.recentListeningHistory.slice(0, 5);
      systemContent += `\n- Recent tracks: ${recentTracks.map(t => `${t.track_name} by ${t.artist_name}`).join(', ')}`;
    }

    if (context.lastRecommendations) {
      systemContent += `\n- Last recommendation type: ${context.lastRecommendations.recommendation_type}`;
    }

    if (context.musicPreferences) {
      const prefs = context.musicPreferences;
      if (prefs.preferred_artists?.length > 0) {
        systemContent += `\n- Preferred artists: ${prefs.preferred_artists.slice(0, 3).map(a => a.artist).join(', ')}`;
      }
    }

    systemContent += `\n\nBe conversational, helpful, and enthusiastic about music. Use this context to provide personalized recommendations and responses.`;

    return {
      role: 'system',
      content: systemContent
    };
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions() {
    const now = new Date();
    const expiredSessions = [];

    for (const [sessionId, session] of this.activeSessions.entries()) {
      const timeSinceActivity = now - session.lastActivity;
      if (timeSinceActivity > this.sessionTimeout) {
        expiredSessions.push(sessionId);
      }
    }

    expiredSessions.forEach(sessionId => {
      console.log(`🧹 Cleaning up expired session ${sessionId}`);
      this.activeSessions.delete(sessionId);
    });

    return expiredSessions.length;
  }

  /**
   * Save session to database
   */
  async saveSessionToDatabase(session) {
    try {
      const db = mongoManager.getDb();
      const chatSessionsCollection = db.collection('chat_sessions');
      
      await chatSessionsCollection.insertOne({
        _id: session.sessionId,
        user_id: session.userId,
        start_time: session.startTime,
        last_activity: session.lastActivity,
        context: session.context,
        metadata: session.metadata,
        message_count: session.messages.length
      });

    } catch (error) {
      console.error('Error saving session to database:', error);
    }
  }

  /**
   * Load session from database
   */
  async loadSessionFromDatabase(sessionId, userId) {
    try {
      const db = mongoManager.getDb();
      const chatSessionsCollection = db.collection('chat_sessions');
      const chatHistoryCollection = db.collection('chat_history');
      
      const sessionData = await chatSessionsCollection.findOne({
        _id: sessionId,
        user_id: userId
      });

      if (!sessionData) {
        return null;
      }

      // Load messages
      const messages = await chatHistoryCollection
        .find({ session_id: sessionId })
        .sort({ timestamp: 1 })
        .toArray();

      const session = {
        sessionId: sessionData._id,
        userId: sessionData.user_id,
        startTime: sessionData.start_time,
        lastActivity: new Date(),
        messages: messages.map(msg => ({
          id: msg._id,
          role: msg.message_type,
          content: msg.content,
          timestamp: msg.timestamp,
          metadata: msg.metadata || {}
        })),
        context: sessionData.context || {},
        metadata: sessionData.metadata || {}
      };

      // Reload user context
      await this.loadUserContext(session);

      return session;

    } catch (error) {
      console.error('Error loading session from database:', error);
      return null;
    }
  }

  /**
   * Save message to database
   */
  async saveMessageToDatabase(sessionId, message) {
    try {
      const db = mongoManager.getDb();
      const chatHistoryCollection = db.collection('chat_history');
      const session = this.activeSessions.get(sessionId);
      
      await chatHistoryCollection.insertOne({
        _id: message.id,
        user_id: session.userId,
        session_id: sessionId,
        message_type: message.role,
        content: message.content,
        timestamp: message.timestamp,
        metadata: message.metadata
      });

    } catch (error) {
      console.error('Error saving message to database:', error);
    }
  }

  /**
   * Update session in database
   */
  async updateSessionInDatabase(sessionId, updates) {
    try {
      const db = mongoManager.getDb();
      const chatSessionsCollection = db.collection('chat_sessions');
      
      await chatSessionsCollection.updateOne(
        { _id: sessionId },
        { 
          $set: {
            ...updates,
            last_activity: new Date()
          }
        }
      );

    } catch (error) {
      console.error('Error updating session in database:', error);
    }
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return null;
    }

    const userMessages = session.messages.filter(m => m.role === 'user');
    const assistantMessages = session.messages.filter(m => m.role === 'assistant');
    const totalTokens = session.messages.reduce((sum, m) => sum + (m.metadata.tokens || 0), 0);

    return {
      sessionId,
      userId: session.userId,
      startTime: session.startTime,
      duration: new Date() - session.startTime,
      messageCount: session.messages.length,
      userMessages: userMessages.length,
      assistantMessages: assistantMessages.length,
      totalTokens,
      averageResponseTime: assistantMessages.reduce((sum, m) => sum + (m.metadata.responseTime || 0), 0) / assistantMessages.length || 0
    };
  }

  /**
   * Export conversation for user
   */
  async exportConversation(sessionId, format = 'json') {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const exportData = {
      sessionId: session.sessionId,
      userId: session.userId,
      startTime: session.startTime,
      messages: session.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      })),
      stats: this.getSessionStats(sessionId)
    };

    if (format === 'json') {
      return JSON.stringify(exportData, null, 2);
    } else if (format === 'text') {
      let text = `EchoTune AI Conversation\nSession: ${sessionId}\nDate: ${session.startTime.toISOString()}\n\n`;
      
      for (const msg of session.messages) {
        if (msg.role !== 'system') {
          text += `${msg.role.toUpperCase()}: ${msg.content}\n\n`;
        }
      }
      
      return text;
    }

    return exportData;
  }

  /**
   * Start periodic cleanup
   */
  startPeriodicCleanup(intervalMinutes = 15) {
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, intervalMinutes * 60 * 1000);

    console.log(`🔄 Started periodic session cleanup (every ${intervalMinutes} minutes)`);
  }
}

module.exports = ConversationManager;