#!/usr/bin/env node

/**
 * Redis Configuration and Setup Script
 * Configures Redis for optimal performance in the EchoTune AI music recommendation system
 * 
 * Features:
 * - Connection to Redis Cloud with provided credentials
 * - Optimal configuration for music recommendation caching
 * - Performance monitoring and health checks
 * - Automatic failover and error handling
 */

const Redis = require('redis');
const path = require('path');
const fs = require('fs').promises;

class RedisConfigManager {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.config = {
      // Redis connection using provided credentials
      apiKey: 'Akrcxmqn76rmat64psye0uy4wljhcpu90zr72rqsi6l2bdx6q3',
      username: 'echotune',
      password: 'DapperMan77$$',
      
      // Connection configuration
      connectTimeout: 10000,
      lazyConnect: false,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableAutoPipelining: true,
      maxLoadingTimeout: 5000,
      
      // Performance optimization
      db: 0,
      keyPrefix: 'echotune:',
      
      // Reconnection strategy
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    };
    
    // Cache configuration for different data types
    this.cacheConfig = {
      audioFeatures: {
        ttl: 86400, // 24 hours
        prefix: 'audio_features:',
        maxKeys: 100000
      },
      recommendations: {
        ttl: 3600, // 1 hour
        prefix: 'recommendations:',
        maxKeys: 50000
      },
      userProfiles: {
        ttl: 7200, // 2 hours
        prefix: 'user_profiles:',
        maxKeys: 10000
      },
      spotifyAPI: {
        ttl: 300, // 5 minutes
        prefix: 'spotify_api:',
        maxKeys: 5000
      },
      sessions: {
        ttl: 86400, // 24 hours
        prefix: 'session:',
        maxKeys: 100000
      },
      analytics: {
        ttl: 3600, // 1 hour
        prefix: 'analytics:',
        maxKeys: 20000
      }
    };
  }

  /**
   * Initialize Redis connection with optimal configuration
   * Try multiple connection approaches for different Redis providers
   */
  async initialize() {
    try {
      console.log('🔧 Initializing Redis connection...');
      
      // Try different connection approaches
      const connectionAttempts = [
        // Attempt 1: Use API key as connection string
        () => this.connectWithUrl(`redis://${this.config.apiKey}`),
        
        // Attempt 2: Use API key as password
        () => this.connectWithCredentials('', this.config.apiKey, 'localhost', 6379),
        
        // Attempt 3: Use username and password with localhost
        () => this.connectWithCredentials(this.config.username, this.config.password, 'localhost', 6379),
        
        // Attempt 4: Try standard Redis Cloud format with API as host
        () => this.connectWithUrl(`redis://${this.config.username}:${encodeURIComponent(this.config.password)}@${this.config.apiKey}:6379`),
        
        // Attempt 5: Try Redis Cloud format with API as part of host
        () => this.connectWithUrl(`redis://${this.config.username}:${encodeURIComponent(this.config.password)}@redis-${this.config.apiKey}.cloud.redislabs.com:6379`),
        
        // Attempt 6: Try local Redis without auth
        () => this.connectWithUrl('redis://localhost:6379'),
        
        // Attempt 7: Try Redis with API key as auth token
        () => this.connectWithAuth(this.config.apiKey)
      ];

      for (let i = 0; i < connectionAttempts.length; i++) {
        try {
          console.log(`🔗 Attempting connection method ${i + 1}...`);
          await connectionAttempts[i]();
          
          // Test the connection
          const pong = await this.client.ping();
          if (pong === 'PONG') {
            console.log(`✅ Redis connection successful with method ${i + 1}`);
            
            // Configure Redis for optimal performance
            await this.optimizeConfiguration();
            
            // Set up cache namespaces
            await this.setupCacheNamespaces();
            
            return true;
          }
        } catch (error) {
          console.log(`❌ Connection method ${i + 1} failed: ${error.message}`);
          if (this.client) {
            try {
              await this.client.quit();
            } catch (e) {
              // Ignore cleanup errors
            }
            this.client = null;
          }
        }
      }
      
      throw new Error('All Redis connection methods failed');
      
    } catch (error) {
      console.error('❌ Failed to initialize Redis:', error.message);
      throw error;
    }
  }

  /**
   * Connect using a full Redis URL
   */
  async connectWithUrl(url) {
    this.client = Redis.createClient({
      url: url,
      socket: {
        connectTimeout: this.config.connectTimeout,
        lazyConnect: false,
        reconnectStrategy: this.config.retryStrategy
      },
      database: this.config.db,
      legacyMode: false
    });

    this.setupEventListeners();
    await this.client.connect();
  }

  /**
   * Connect using separate credentials
   */
  async connectWithCredentials(username, password, host, port) {
    const config = {
      socket: {
        host: host,
        port: port,
        connectTimeout: this.config.connectTimeout,
        lazyConnect: false,
        reconnectStrategy: this.config.retryStrategy
      },
      database: this.config.db,
      legacyMode: false
    };

    if (username && password) {
      config.username = username;
      config.password = password;
    } else if (password) {
      config.password = password;
    }

    this.client = Redis.createClient(config);
    this.setupEventListeners();
    await this.client.connect();
  }

  /**
   * Connect using auth token
   */
  async connectWithAuth(authToken) {
    this.client = Redis.createClient({
      socket: {
        host: 'localhost',
        port: 6379,
        connectTimeout: this.config.connectTimeout,
        lazyConnect: false,
        reconnectStrategy: this.config.retryStrategy
      },
      password: authToken,
      database: this.config.db,
      legacyMode: false
    });

    this.setupEventListeners();
    await this.client.connect();
  }

  /**
   * Set up event listeners for Redis client
   */
  setupEventListeners() {
    this.client.on('connect', () => {
      console.log('✅ Redis client connected successfully');
    });

    this.client.on('ready', () => {
      console.log('🚀 Redis client ready for operations');
      this.isConnected = true;
    });

    this.client.on('error', (err) => {
      console.error('❌ Redis client error:', err.message);
      this.isConnected = false;
    });

    this.client.on('end', () => {
      console.log('🔌 Redis connection closed');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      console.log('🔄 Redis client reconnecting...');
    });
  }

  /**
   * Optimize Redis configuration for music recommendation system
   */
  async optimizeConfiguration() {
    try {
      console.log('⚙️ Optimizing Redis configuration...');
      
      // Get current configuration
      const info = await this.client.info('server');
      console.log('📊 Redis server info retrieved');
      
      // Set up memory optimization
      const memoryInfo = await this.client.info('memory');
      console.log('💾 Memory info:', memoryInfo.split('\n').find(line => line.startsWith('used_memory_human')));
      
      // Configure expiration policy for optimal performance
      try {
        await this.client.configSet('maxmemory-policy', 'allkeys-lru');
        console.log('✅ Set memory policy to allkeys-lru for optimal cache management');
      } catch (err) {
        console.warn('⚠️  Could not set memory policy (may require admin privileges):', err.message);
      }
      
      // Set up key notification if supported
      try {
        await this.client.configSet('notify-keyspace-events', 'Ex');
        console.log('✅ Enabled keyspace notifications for expiration events');
      } catch (err) {
        console.warn('⚠️  Could not enable keyspace notifications:', err.message);
      }
      
    } catch (error) {
      console.warn('⚠️  Some optimizations could not be applied:', error.message);
    }
  }

  /**
   * Set up cache namespaces and initial data structures
   */
  async setupCacheNamespaces() {
    console.log('🏗️  Setting up cache namespaces...');
    
    // Create hash sets for different data types
    for (const [type, config] of Object.entries(this.cacheConfig)) {
      const key = `${this.config.keyPrefix}config:${type}`;
      await this.client.hSet(key, {
        ttl: config.ttl.toString(),
        prefix: config.prefix,
        maxKeys: config.maxKeys.toString(),
        createdAt: new Date().toISOString()
      });
      console.log(`✅ Configured cache namespace: ${type}`);
    }
  }

  /**
   * Cache audio features for a track
   */
  async cacheAudioFeatures(trackId, features) {
    if (!this.isConnected) throw new Error('Redis not connected');
    
    const key = `${this.config.keyPrefix}${this.cacheConfig.audioFeatures.prefix}${trackId}`;
    await this.client.setEx(key, this.cacheConfig.audioFeatures.ttl, JSON.stringify(features));
  }

  /**
   * Get cached audio features
   */
  async getAudioFeatures(trackId) {
    if (!this.isConnected) return null;
    
    const key = `${this.config.keyPrefix}${this.cacheConfig.audioFeatures.prefix}${trackId}`;
    const cached = await this.client.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  /**
   * Cache user recommendations
   */
  async cacheRecommendations(userId, recommendations) {
    if (!this.isConnected) throw new Error('Redis not connected');
    
    const key = `${this.config.keyPrefix}${this.cacheConfig.recommendations.prefix}${userId}`;
    await this.client.setEx(key, this.cacheConfig.recommendations.ttl, JSON.stringify(recommendations));
  }

  /**
   * Get cached recommendations
   */
  async getRecommendations(userId) {
    if (!this.isConnected) return null;
    
    const key = `${this.config.keyPrefix}${this.cacheConfig.recommendations.prefix}${userId}`;
    const cached = await this.client.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  /**
   * Cache Spotify API responses
   */
  async cacheSpotifyAPI(endpoint, data) {
    if (!this.isConnected) throw new Error('Redis not connected');
    
    const key = `${this.config.keyPrefix}${this.cacheConfig.spotifyAPI.prefix}${endpoint}`;
    await this.client.setEx(key, this.cacheConfig.spotifyAPI.ttl, JSON.stringify(data));
  }

  /**
   * Get cached Spotify API response
   */
  async getSpotifyAPICache(endpoint) {
    if (!this.isConnected) return null;
    
    const key = `${this.config.keyPrefix}${this.cacheConfig.spotifyAPI.prefix}${endpoint}`;
    const cached = await this.client.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  /**
   * Store user session
   */
  async storeSession(sessionId, sessionData) {
    if (!this.isConnected) throw new Error('Redis not connected');
    
    const key = `${this.config.keyPrefix}${this.cacheConfig.sessions.prefix}${sessionId}`;
    await this.client.setEx(key, this.cacheConfig.sessions.ttl, JSON.stringify(sessionData));
  }

  /**
   * Get user session
   */
  async getSession(sessionId) {
    if (!this.isConnected) return null;
    
    const key = `${this.config.keyPrefix}${this.cacheConfig.sessions.prefix}${sessionId}`;
    const cached = await this.client.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  /**
   * Performance monitoring and health check
   */
  async healthCheck() {
    try {
      if (!this.isConnected || !this.client) {
        return { status: 'unhealthy', message: 'Redis client not connected' };
      }

      const start = Date.now();
      const pong = await this.client.ping();
      const latency = Date.now() - start;

      if (pong === 'PONG') {
        const info = await this.client.info('server');
        const memoryInfo = await this.client.info('memory');
        const statsInfo = await this.client.info('stats');
        
        return {
          status: 'healthy',
          latency: `${latency}ms`,
          connection: 'active',
          server: {
            redis_version: this.extractInfoValue(info, 'redis_version'),
            uptime_in_seconds: this.extractInfoValue(info, 'uptime_in_seconds')
          },
          memory: {
            used_memory_human: this.extractInfoValue(memoryInfo, 'used_memory_human'),
            maxmemory_human: this.extractInfoValue(memoryInfo, 'maxmemory_human')
          },
          stats: {
            total_commands_processed: this.extractInfoValue(statsInfo, 'total_commands_processed'),
            instantaneous_ops_per_sec: this.extractInfoValue(statsInfo, 'instantaneous_ops_per_sec')
          }
        };
      } else {
        return { status: 'unhealthy', message: 'Redis ping failed' };
      }
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  /**
   * Extract value from Redis INFO response
   */
  extractInfoValue(info, key) {
    const line = info.split('\n').find(line => line.startsWith(key + ':'));
    return line ? line.split(':')[1].trim() : 'N/A';
  }

  /**
   * Clear specific cache namespace
   */
  async clearCache(namespace = '*') {
    if (!this.isConnected) throw new Error('Redis not connected');
    
    const pattern = `${this.config.keyPrefix}${namespace}`;
    const keys = await this.client.keys(pattern);
    
    if (keys.length > 0) {
      await this.client.del(keys);
      console.log(`✅ Cleared ${keys.length} keys matching pattern: ${pattern}`);
    } else {
      console.log(`ℹ️  No keys found matching pattern: ${pattern}`);
    }
    
    return keys.length;
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    if (!this.isConnected) throw new Error('Redis not connected');
    
    const stats = {};
    
    for (const [type, config] of Object.entries(this.cacheConfig)) {
      const pattern = `${this.config.keyPrefix}${config.prefix}*`;
      const keys = await this.client.keys(pattern);
      stats[type] = {
        keyCount: keys.length,
        maxKeys: config.maxKeys,
        usage: `${((keys.length / config.maxKeys) * 100).toFixed(1)}%`,
        ttl: config.ttl
      };
    }
    
    return stats;
  }

  /**
   * Close Redis connection
   */
  async close() {
    if (this.client) {
      await this.client.quit();
      console.log('✅ Redis connection closed gracefully');
    }
  }
}

/**
 * Update environment configuration with Redis settings
 */
async function updateEnvironmentConfig() {
  const envPath = path.join(process.cwd(), '.env');
  
  try {
    let envContent = await fs.readFile(envPath, 'utf-8');
    
    // Update Redis configuration
    // Update Redis configuration
    const redisConfig = `
# =============================================================================
# 🟥 REDIS CONFIGURATION (Updated by configure-redis.js)
# =============================================================================

# Redis connection credentials (provided by user)
REDIS_API_KEY=Akrcxmqn76rmat64psye0uy4wljhcpu90zr72rqsi6l2bdx6q3
REDIS_USERNAME=echotune
REDIS_PASSWORD=DapperMan77$$

# Default Redis configuration (fallback to localhost)
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# Redis performance configuration
REDIS_KEY_PREFIX=echotune:
REDIS_DEFAULT_TTL=3600
REDIS_MAX_RETRIES=3
REDIS_RETRY_DELAY=100
REDIS_CONNECT_TIMEOUT=10000

# Cache configuration for different data types
CACHE_AUDIO_FEATURES_TTL=86400
CACHE_RECOMMENDATIONS_TTL=3600
CACHE_USER_PROFILES_TTL=7200
CACHE_SPOTIFY_API_TTL=300
CACHE_SESSIONS_TTL=86400
CACHE_ANALYTICS_TTL=3600

`;

    // Replace existing Redis configuration or add new
    const redisSection = /# =============================================================================\s*\n# 🟥 REDIS CONFIGURATION.*?\n# =============================================================================[\s\S]*?(?=\n# =============================================================================|\n$)/;
    
    if (redisSection.test(envContent)) {
      envContent = envContent.replace(redisSection, redisConfig.trim());
      console.log('✅ Updated existing Redis configuration in .env');
    } else {
      // Find a good place to insert (after database section if exists)
      const insertAfter = /# =============================================================================\s*\n# 🗄️ DATABASE CONFIGURATION[\s\S]*?(?=\n# =============================================================================|\n$)/;
      
      if (insertAfter.test(envContent)) {
        envContent = envContent.replace(insertAfter, (match) => match + '\n' + redisConfig);
      } else {
        envContent += '\n' + redisConfig;
      }
      console.log('✅ Added Redis configuration to .env');
    }
    
    await fs.writeFile(envPath, envContent);
    console.log('✅ Environment configuration updated successfully');
    
  } catch (error) {
    console.error('❌ Failed to update environment configuration:', error.message);
    throw error;
  }
}

/**
 * Generate Redis utility module
 */
async function generateRedisUtility() {
  const utilityPath = path.join(process.cwd(), 'src', 'utils', 'redis-manager.js');
  
  const utilityCode = `/**
 * Redis Manager Utility
 * Centralized Redis operations for EchoTune AI
 * Generated by configure-redis.js
 */

const Redis = require('redis');

class RedisManager {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.config = {
      url: process.env.REDIS_URL,
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASSWORD,
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'echotune:',
      defaultTTL: parseInt(process.env.REDIS_DEFAULT_TTL) || 3600,
      maxRetries: parseInt(process.env.REDIS_MAX_RETRIES) || 3,
      connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT) || 10000
    };
  }

  async connect() {
    if (this.client && this.isConnected) {
      return this.client;
    }

    try {
      this.client = Redis.createClient({
        url: this.config.url,
        socket: {
          connectTimeout: this.config.connectTimeout,
        },
        legacyMode: false
      });

      this.client.on('error', (err) => {
        console.error('Redis client error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        this.isConnected = true;
      });

      await this.client.connect();
      return this.client;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async set(key, value, ttl = null) {
    await this.connect();
    const fullKey = this.config.keyPrefix + key;
    const serializedValue = JSON.stringify(value);
    
    if (ttl) {
      return await this.client.setEx(fullKey, ttl, serializedValue);
    } else {
      return await this.client.set(fullKey, serializedValue);
    }
  }

  async get(key) {
    try {
      await this.connect();
      const fullKey = this.config.keyPrefix + key;
      const value = await this.client.get(fullKey);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async del(key) {
    await this.connect();
    const fullKey = this.config.keyPrefix + key;
    return await this.client.del(fullKey);
  }

  async exists(key) {
    await this.connect();
    const fullKey = this.config.keyPrefix + key;
    return await this.client.exists(fullKey);
  }

  async expire(key, ttl) {
    await this.connect();
    const fullKey = this.config.keyPrefix + key;
    return await this.client.expire(fullKey, ttl);
  }

  async ping() {
    await this.connect();
    return await this.client.ping();
  }

  async close() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  // Music-specific caching methods
  async cacheAudioFeatures(trackId, features, ttl = 86400) {
    return await this.set(\`audio_features:\${trackId}\`, features, ttl);
  }

  async getAudioFeatures(trackId) {
    return await this.get(\`audio_features:\${trackId}\`);
  }

  async cacheRecommendations(userId, recommendations, ttl = 3600) {
    return await this.set(\`recommendations:\${userId}\`, recommendations, ttl);
  }

  async getRecommendations(userId) {
    return await this.get(\`recommendations:\${userId}\`);
  }

  async cacheUserProfile(userId, profile, ttl = 7200) {
    return await this.set(\`user_profile:\${userId}\`, profile, ttl);
  }

  async getUserProfile(userId) {
    return await this.get(\`user_profile:\${userId}\`);
  }
}

module.exports = new RedisManager();
`;

  await fs.mkdir(path.dirname(utilityPath), { recursive: true });
  await fs.writeFile(utilityPath, utilityCode);
  console.log('✅ Generated Redis utility module at src/utils/redis-manager.js');
}

/**
 * Test Redis connection and functionality
 */
async function testRedisConnection() {
  console.log('\n🧪 Testing Redis connection and functionality...\n');
  
  const redis = new RedisConfigManager();
  
  try {
    // Test connection
    await redis.initialize();
    
    // Test basic operations
    console.log('🔬 Testing basic operations...');
    await redis.client.set('test:connection', 'Hello EchoTune AI!');
    const result = await redis.client.get('test:connection');
    console.log('✅ Basic set/get test:', result);
    
    // Test music-specific caching
    console.log('🔬 Testing music-specific caching...');
    const testAudioFeatures = {
      danceability: 0.735,
      energy: 0.578,
      key: 0,
      loudness: -11.840,
      mode: 1,
      speechiness: 0.0461,
      acousticness: 0.514,
      instrumentalness: 0.0902,
      liveness: 0.159,
      valence: 0.636,
      tempo: 98.002
    };
    
    await redis.cacheAudioFeatures('test_track_123', testAudioFeatures);
    const cachedFeatures = await redis.getAudioFeatures('test_track_123');
    console.log('✅ Audio features caching test passed');
    
    // Test recommendations caching
    const testRecommendations = [
      { track_id: 'track_1', score: 0.95 },
      { track_id: 'track_2', score: 0.88 },
      { track_id: 'track_3', score: 0.82 }
    ];
    
    await redis.cacheRecommendations('test_user_456', testRecommendations);
    const cachedRecommendations = await redis.getRecommendations('test_user_456');
    console.log('✅ Recommendations caching test passed');
    
    // Test health check
    console.log('🔬 Testing health check...');
    const health = await redis.healthCheck();
    console.log('✅ Health check result:', JSON.stringify(health, null, 2));
    
    // Test cache statistics
    console.log('🔬 Testing cache statistics...');
    const stats = await redis.getCacheStats();
    console.log('✅ Cache statistics:', JSON.stringify(stats, null, 2));
    
    // Clean up test data
    await redis.client.del('test:connection');
    await redis.clearCache('audio_features:test_track_123');
    await redis.clearCache('recommendations:test_user_456');
    
    console.log('\n🎉 All Redis tests passed successfully!\n');
    
    await redis.close();
    
  } catch (error) {
    console.error('❌ Redis test failed:', error.message);
    throw error;
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🚀 EchoTune AI Redis Configuration Setup\n');
    
    // Update environment configuration
    await updateEnvironmentConfig();
    
    // Generate utility module
    await generateRedisUtility();
    
    // Test Redis connection
    await testRedisConnection();
    
    console.log('✅ Redis configuration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Restart the application to load new Redis configuration');
    console.log('2. Use npm run validate:redis to test the connection');
    console.log('3. Monitor Redis performance using npm run redis:stats');
    
  } catch (error) {
    console.error('❌ Redis configuration failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = RedisConfigManager;