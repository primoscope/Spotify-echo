/**
 * Redis Manager for EchoTune AI
 * Simplified, production-ready Redis operations
 */

const Redis = require('redis');

class RedisManager {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.keyPrefix = process.env.REDIS_KEY_PREFIX || 'echotune:';
  }

  async connect() {
    if (this.client && this.isConnected) {
      return this.client;
    }

    try {
      this.client = Redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT) || 5000
        }
      });

      this.client.on('error', (err) => {
        console.error('Redis error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        this.isConnected = true;
      });

      await this.client.connect();
      return this.client;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async set(key, value, ttl = null) {
    try {
      await this.connect();
      const fullKey = this.keyPrefix + key;
      const serializedValue = JSON.stringify(value);
      
      if (ttl) {
        return await this.client.setEx(fullKey, ttl, serializedValue);
      } else {
        return await this.client.set(fullKey, serializedValue);
      }
    } catch (error) {
      console.error('Redis set error:', error);
      throw error;
    }
  }

  async get(key) {
    try {
      await this.connect();
      const fullKey = this.keyPrefix + key;
      const value = await this.client.get(fullKey);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async del(key) {
    try {
      await this.connect();
      const fullKey = this.keyPrefix + key;
      return await this.client.del(fullKey);
    } catch (error) {
      console.error('Redis del error:', error);
      return 0;
    }
  }

  async ping() {
    try {
      await this.connect();
      return await this.client.ping();
    } catch (error) {
      console.error('Redis ping error:', error);
      return null;
    }
  }

  // Music-specific cache methods
  async cacheAudioFeatures(trackId, features) {
    const ttl = parseInt(process.env.CACHE_AUDIO_FEATURES_TTL) || 86400;
    return await this.set(`audio_features:${trackId}`, features, ttl);
  }

  async getAudioFeatures(trackId) {
    return await this.get(`audio_features:${trackId}`);
  }

  async cacheRecommendations(userId, recommendations) {
    const ttl = parseInt(process.env.CACHE_RECOMMENDATIONS_TTL) || 3600;
    return await this.set(`recommendations:${userId}`, recommendations, ttl);
  }

  async getRecommendations(userId) {
    return await this.get(`recommendations:${userId}`);
  }

  async cacheUserProfile(userId, profile) {
    const ttl = parseInt(process.env.CACHE_USER_PROFILES_TTL) || 7200;
    return await this.set(`user_profile:${userId}`, profile, ttl);
  }

  async getUserProfile(userId) {
    return await this.get(`user_profile:${userId}`);
  }

  async cacheSpotifyAPI(endpoint, data) {
    const ttl = parseInt(process.env.CACHE_SPOTIFY_API_TTL) || 300;
    return await this.set(`spotify_api:${endpoint}`, data, ttl);
  }

  async getSpotifyAPICache(endpoint) {
    return await this.get(`spotify_api:${endpoint}`);
  }

  async close() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

module.exports = new RedisManager();
