/**
 * Redis Client Factory and Utilities for EchoTune AI
 * Session storage, rate limiting, and caching with development fallback
 */

const redis = require('redis');
const NodeCache = require('node-cache');

class RedisManager {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.fallbackCache = new NodeCache({ stdTTL: 600, checkperiod: 120 }); // 10min TTL, check every 2min
    this.useRedis = false;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
    };
  }

  /**
   * Initialize Redis connection with fallback
   * @returns {Promise<boolean>} True if Redis connected, false if using fallback
   */
  async initialize() {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      console.log('⚠️ REDIS_URL not configured, using in-memory fallback');
      return false;
    }

    try {
      // Create Redis client with connection options
      this.client = redis.createClient({
        url: redisUrl,
        password: process.env.REDIS_PASSWORD,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        connectTimeout: 10000,
        commandTimeout: 5000,
      });

      // Set up error handling
      this.client.on('error', (err) => {
        console.error('Redis connection error:', err.message);
        this.stats.errors++;
        this.isConnected = false;
        this.useRedis = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connected successfully');
        this.isConnected = true;
        this.useRedis = true;
      });

      this.client.on('reconnecting', () => {
        console.log('🔄 Redis reconnecting...');
      });

      this.client.on('end', () => {
        console.log('🔌 Redis connection closed');
        this.isConnected = false;
        this.useRedis = false;
      });

      // Attempt connection
      await this.client.connect();

      // Test connection with ping
      await this.client.ping();

      return true;
    } catch (error) {
      console.warn('⚠️ Redis connection failed, using in-memory fallback:', error.message);
      this.useRedis = false;
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Get value from cache (Redis or fallback)
   * @param {string} key - Cache key
   * @returns {Promise<any>} Cached value or null
   */
  async get(key) {
    try {
      if (this.useRedis && this.isConnected) {
        const value = await this.client.get(key);
        if (value !== null) {
          this.stats.hits++;
          return JSON.parse(value);
        } else {
          this.stats.misses++;
          return null;
        }
      } else {
        // Use fallback cache
        const value = this.fallbackCache.get(key);
        if (value !== undefined) {
          this.stats.hits++;
          return value;
        } else {
          this.stats.misses++;
          return null;
        }
      }
    } catch (error) {
      console.error('Cache get error:', error.message);
      this.stats.errors++;
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds (default: 600)
   * @returns {Promise<boolean>} Success status
   */
  async set(key, value, ttl = 600) {
    try {
      if (this.useRedis && this.isConnected) {
        await this.client.setEx(key, ttl, JSON.stringify(value));
      } else {
        // Use fallback cache
        this.fallbackCache.set(key, value, ttl);
      }
      this.stats.sets++;
      return true;
    } catch (error) {
      console.error('Cache set error:', error.message);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Delete key from cache
   * @param {string} key - Cache key to delete
   * @returns {Promise<boolean>} Success status
   */
  async del(key) {
    try {
      if (this.useRedis && this.isConnected) {
        await this.client.del(key);
      } else {
        this.fallbackCache.del(key);
      }
      this.stats.deletes++;
      return true;
    } catch (error) {
      console.error('Cache delete error:', error.message);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Check if key exists
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} True if key exists
   */
  async exists(key) {
    try {
      if (this.useRedis && this.isConnected) {
        return (await this.client.exists(key)) === 1;
      } else {
        return this.fallbackCache.has(key);
      }
    } catch (error) {
      console.error('Cache exists check error:', error.message);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Increment counter with expiration
   * @param {string} key - Counter key
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<number>} Current count
   */
  async incr(key, ttl = 3600) {
    try {
      if (this.useRedis && this.isConnected) {
        const count = await this.client.incr(key);
        if (count === 1) {
          // Set expiration only on first increment
          await this.client.expire(key, ttl);
        }
        return count;
      } else {
        // Simulate increment with fallback cache
        let count = this.fallbackCache.get(key) || 0;
        count++;
        this.fallbackCache.set(key, count, ttl);
        return count;
      }
    } catch (error) {
      console.error('Cache increment error:', error.message);
      this.stats.errors++;
      return 1; // Return 1 as safe fallback
    }
  }

  /**
   * Rate limiting check
   * @param {string} key - Rate limit key
   * @param {number} limit - Maximum requests
   * @param {number} windowSeconds - Time window in seconds
   * @returns {Promise<Object>} Rate limit status
   */
  async rateLimit(key, limit, windowSeconds) {
    try {
      const count = await this.incr(key, windowSeconds);
      const allowed = count <= limit;

      return {
        allowed,
        count,
        limit,
        resetTime: Date.now() + windowSeconds * 1000,
        remaining: Math.max(0, limit - count),
      };
    } catch (error) {
      console.error('Rate limit error:', error.message);
      this.stats.errors++;
      // Fail open for rate limiting errors
      return {
        allowed: true,
        count: 1,
        limit,
        resetTime: Date.now() + windowSeconds * 1000,
        remaining: limit - 1,
      };
    }
  }

  /**
   * Store session data
   * @param {string} sessionId - Session identifier
   * @param {Object} sessionData - Session data
   * @param {number} ttl - Time to live in seconds (default: 24 hours)
   * @returns {Promise<boolean>} Success status
   */
  async setSession(sessionId, sessionData, ttl = 86400) {
    const key = `session:${sessionId}`;
    return await this.set(key, sessionData, ttl);
  }

  /**
   * Get session data
   * @param {string} sessionId - Session identifier
   * @returns {Promise<Object|null>} Session data or null
   */
  async getSession(sessionId) {
    const key = `session:${sessionId}`;
    return await this.get(key);
  }

  /**
   * Delete session
   * @param {string} sessionId - Session identifier
   * @returns {Promise<boolean>} Success status
   */
  async deleteSession(sessionId) {
    const key = `session:${sessionId}`;
    return await this.del(key);
  }

  /**
   * Cache Spotify user data
   * @param {string} userId - Spotify user ID
   * @param {Object} userData - User data
   * @param {number} ttl - Time to live in seconds (default: 1 hour)
   * @returns {Promise<boolean>} Success status
   */
  async cacheSpotifyUser(userId, userData, ttl = 3600) {
    const key = `spotify:user:${userId}`;
    return await this.set(key, userData, ttl);
  }

  /**
   * Get cached Spotify user data
   * @param {string} userId - Spotify user ID
   * @returns {Promise<Object|null>} User data or null
   */
  async getCachedSpotifyUser(userId) {
    const key = `spotify:user:${userId}`;
    return await this.get(key);
  }

  /**
   * Cache audio features
   * @param {string} trackId - Spotify track ID
   * @param {Object} features - Audio features
   * @param {number} ttl - Time to live in seconds (default: 24 hours)
   * @returns {Promise<boolean>} Success status
   */
  async cacheAudioFeatures(trackId, features, ttl = 86400) {
    const key = `spotify:audio_features:${trackId}`;
    return await this.set(key, features, ttl);
  }

  /**
   * Get cached audio features
   * @param {string} trackId - Spotify track ID
   * @returns {Promise<Object|null>} Audio features or null
   */
  async getCachedAudioFeatures(trackId) {
    const key = `spotify:audio_features:${trackId}`;
    return await this.get(key);
  }

  /**
   * Clear cache by pattern (Redis only)
   * @param {string} pattern - Key pattern (e.g., 'spotify:*')
   * @returns {Promise<number>} Number of keys deleted
   */
  async clearPattern(pattern) {
    try {
      if (this.useRedis && this.isConnected) {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(keys);
          return keys.length;
        }
      } else {
        // For fallback cache, clear all if pattern is '*'
        if (pattern === '*') {
          this.fallbackCache.flushAll();
          return 1;
        }
        // Limited pattern support for fallback
        const keys = this.fallbackCache.keys();
        const matchingKeys = keys.filter((key) => {
          const regex = new RegExp(pattern.replace(/\*/g, '.*'));
          return regex.test(key);
        });
        matchingKeys.forEach((key) => this.fallbackCache.del(key));
        return matchingKeys.length;
      }
      return 0;
    } catch (error) {
      console.error('Cache clear pattern error:', error.message);
      this.stats.errors++;
      return 0;
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    return {
      ...this.stats,
      connected: this.isConnected,
      using_redis: this.useRedis,
      fallback_stats: this.useRedis
        ? null
        : {
            keys: this.fallbackCache.keys().length,
            hits: this.fallbackCache.getStats().hits,
            misses: this.fallbackCache.getStats().misses,
          },
    };
  }

  /**
   * Health check
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      if (this.useRedis && this.isConnected) {
        await this.client.ping();
        return {
          status: 'healthy',
          type: 'redis',
          connected: true,
          stats: this.getStats(),
        };
      } else {
        return {
          status: 'healthy',
          type: 'memory_fallback',
          connected: false,
          stats: this.getStats(),
          message: 'Using in-memory cache fallback',
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        type: 'redis',
        connected: false,
        error: error.message,
        stats: this.getStats(),
      };
    }
  }

  /**
   * Close Redis connection
   * @returns {Promise<void>}
   */
  async close() {
    if (this.client && this.isConnected) {
      await this.client.quit();
    }
    this.fallbackCache.flushAll();
    this.isConnected = false;
    this.useRedis = false;
  }

  /**
   * Graceful shutdown
   * @returns {Promise<void>}
   */
  async shutdown() {
    console.log('🔄 Shutting down Redis manager...');
    await this.close();
    console.log('✅ Redis manager shutdown complete');
  }
}

// Singleton instance
let redisManager = null;

/**
 * Get Redis manager singleton instance
 * @returns {RedisManager} Redis manager instance
 */
function getRedisManager() {
  if (!redisManager) {
    redisManager = new RedisManager();
  }
  return redisManager;
}

/**
 * Initialize Redis manager
 * @returns {Promise<RedisManager>} Initialized Redis manager
 */
async function initializeRedis() {
  const manager = getRedisManager();
  await manager.initialize();
  return manager;
}

module.exports = {
  RedisManager,
  getRedisManager,
  initializeRedis,
};
