/**
 * Session Management Infrastructure
 * Phase 5A: Extracted from server.js for enterprise-grade session handling
 * Provides Redis-backed session store with memory fallback
 */

const session = require('express-session');
const { initializeRedis } = require('../utils/redis');

class SessionManager {
  constructor() {
    this.redisManager = null;
    this.sessionConfig = null;
  }

  /**
   * Initialize session configuration with Redis store or memory fallback
   */
  async initialize() {
    try {
      // Initialize Redis for session storage
      this.redisManager = await this.initializeRedisSession();
      
      // Base session configuration
      this.sessionConfig = {
        secret: process.env.SESSION_SECRET || 'fallback-dev-secret-change-in-production',
        name: 'echotune.session',
        resave: false,
        saveUninitialized: false,
        rolling: true,
        cookie: {
          secure: process.env.NODE_ENV === 'production',
          httpOnly: true,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        },
      };

      // Add Redis store if available
      if (this.redisManager && this.redisManager.useRedis && this.redisManager.store) {
        this.sessionConfig.store = this.redisManager.store;
        console.log('💾 Session store configured with Redis');
      } else {
        console.log('💾 Session store using memory fallback');
        if (process.env.NODE_ENV === 'production') {
          console.warn('⚠️ WARNING: Using memory store for sessions in production is not recommended');
          console.warn('   💡 Configure REDIS_URL for proper session persistence');
        }
      }

      return this.sessionConfig;
    } catch (error) {
      console.warn('⚠️ Session initialization failed:', error.message);
      
      // Fallback to basic memory session
      this.sessionConfig = {
        secret: process.env.SESSION_SECRET || 'fallback-dev-secret-change-in-production',
        name: 'echotune.session',
        resave: false,
        saveUninitialized: false,
        rolling: true,
        cookie: {
          secure: false, // Disable secure cookies on error
          httpOnly: true,
          maxAge: 7 * 24 * 60 * 60 * 1000,
          sameSite: 'lax',
        },
      };

      return this.sessionConfig;
    }
  }

  /**
   * Configure session middleware for Express app
   * @param {Express} app - Express application instance
   */
  configureSessionMiddleware(app) {
    if (!this.sessionConfig) {
      throw new Error('SessionManager not initialized. Call initialize() first.');
    }

    app.use(session(this.sessionConfig));
    console.log('🔐 Session middleware configured');
  }

  /**
   * Initialize Redis session store
   * @private
   */
  async initializeRedisSession() {
    try {
      const redisManager = await initializeRedis();
      
      if (redisManager && redisManager.useRedis) {
        console.log('💾 Redis session store initialized');
        return redisManager;
      } else {
        console.log('💾 Redis not available, using memory session store');
        return null;
      }
    } catch (error) {
      console.warn('⚠️ Redis session setup failed:', error.message);
      return null;
    }
  }

  /**
   * Get session statistics
   */
  getSessionInfo() {
    return {
      configured: !!this.sessionConfig,
      store: this.redisManager?.useRedis ? 'redis' : 'memory',
      secure: this.sessionConfig?.cookie?.secure || false,
      maxAge: this.sessionConfig?.cookie?.maxAge || 0,
    };
  }
}

// Singleton instance
let sessionManager = null;

/**
 * Get the singleton SessionManager instance
 */
function getSessionManager() {
  if (!sessionManager) {
    sessionManager = new SessionManager();
  }
  return sessionManager;
}

module.exports = {
  SessionManager,
  getSessionManager,
};