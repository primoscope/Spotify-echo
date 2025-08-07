#!/usr/bin/env node

/**
 * Simple Redis Configuration for EchoTune AI
 * Focuses on local Redis setup with optimal caching for music recommendation system
 */

const Redis = require('redis');
const path = require('path');
const fs = require('fs').promises;

class SimpleRedisSetup {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  /**
   * Connect to local Redis
   */
  async connectToLocal() {
    try {
      console.log('🔗 Connecting to local Redis...');
      
      this.client = Redis.createClient({
        url: 'redis://localhost:6379',
        socket: {
          connectTimeout: 5000,
          lazyConnect: false
        },
        legacyMode: false
      });

      this.client.on('error', (err) => {
        console.error('❌ Redis error:', err.message);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connected');
        this.isConnected = true;
      });

      await this.client.connect();
      
      // Test connection
      const pong = await this.client.ping();
      if (pong === 'PONG') {
        console.log('✅ Redis connection test successful');
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error.message);
      return false;
    }
  }

  /**
   * Set up optimal Redis configuration for music caching
   */
  async setupMusicCache() {
    console.log('🎵 Setting up music-specific cache configuration...');
    
    try {
      // Set up cache namespaces with TTL
      const cacheTypes = {
        'echotune:audio_features': 86400, // 24 hours
        'echotune:recommendations': 3600, // 1 hour
        'echotune:user_profiles': 7200,   // 2 hours
        'echotune:spotify_api': 300,      // 5 minutes
        'echotune:sessions': 86400,       // 24 hours
        'echotune:analytics': 3600        // 1 hour
      };

      for (const [prefix, ttl] of Object.entries(cacheTypes)) {
        await this.client.hSet(`${prefix}:config`, {
          ttl: ttl.toString(),
          created: new Date().toISOString(),
          type: prefix.split(':')[1]
        });
        console.log(`✅ Configured cache: ${prefix} (TTL: ${ttl}s)`);
      }

      // Test music-specific operations
      console.log('🧪 Testing music cache operations...');
      
      // Test audio features caching
      const testAudioFeatures = {
        danceability: 0.735,
        energy: 0.578,
        valence: 0.636,
        tempo: 98.002
      };
      
      await this.client.setEx('echotune:audio_features:test_track', 60, JSON.stringify(testAudioFeatures));
      const cached = await this.client.get('echotune:audio_features:test_track');
      
      if (cached && JSON.parse(cached).danceability === 0.735) {
        console.log('✅ Audio features caching test passed');
      }
      
      // Test recommendations caching
      const testRecs = [
        { track_id: 'track1', score: 0.95 },
        { track_id: 'track2', score: 0.88 }
      ];
      
      await this.client.setEx('echotune:recommendations:test_user', 60, JSON.stringify(testRecs));
      const cachedRecs = await this.client.get('echotune:recommendations:test_user');
      
      if (cachedRecs && JSON.parse(cachedRecs).length === 2) {
        console.log('✅ Recommendations caching test passed');
      }
      
      // Clean up test data
      await this.client.del('echotune:audio_features:test_track');
      await this.client.del('echotune:recommendations:test_user');
      
      return true;
      
    } catch (error) {
      console.error('❌ Failed to setup music cache:', error.message);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    try {
      console.log('📊 Cache Statistics:');
      
      const info = await this.client.info('memory');
      const usedMemory = info.split('\n').find(line => line.startsWith('used_memory_human:'));
      console.log(`   Memory Usage: ${usedMemory ? usedMemory.split(':')[1].trim() : 'N/A'}`);
      
      // Count keys by namespace
      const namespaces = ['audio_features', 'recommendations', 'user_profiles', 'spotify_api', 'sessions', 'analytics'];
      
      for (const namespace of namespaces) {
        const pattern = `echotune:${namespace}:*`;
        const keys = await this.client.keys(pattern);
        console.log(`   ${namespace}: ${keys.length} keys`);
      }
      
    } catch (error) {
      console.error('❌ Failed to get cache stats:', error.message);
    }
  }

  /**
   * Update environment configuration
   */
  async updateEnvConfig() {
    const envPath = path.join(process.cwd(), '.env');
    
    try {
      let envContent = await fs.readFile(envPath, 'utf-8');
      
      // Update Redis section
      const redisConfig = `
# =============================================================================
# 🟥 REDIS CONFIGURATION (Local Development)
# =============================================================================

# Redis connection (local development)
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# Redis credentials (for reference)
REDIS_API_KEY=Akrcxmqn76rmat64psye0uy4wljhcpu90zr72rqsi6l2bdx6q3
REDIS_USERNAME=echotune
REDIS_PASSWORD=DapperMan77$$

# Redis performance configuration
REDIS_KEY_PREFIX=echotune:
REDIS_DEFAULT_TTL=3600
REDIS_MAX_RETRIES=3
REDIS_RETRY_DELAY=100
REDIS_CONNECT_TIMEOUT=5000

# Cache configuration for different data types
CACHE_AUDIO_FEATURES_TTL=86400
CACHE_RECOMMENDATIONS_TTL=3600
CACHE_USER_PROFILES_TTL=7200
CACHE_SPOTIFY_API_TTL=300
CACHE_SESSIONS_TTL=86400
CACHE_ANALYTICS_TTL=3600

`;

      // Replace or add Redis configuration
      const redisSection = /# =============================================================================\s*\n# 🟥 REDIS CONFIGURATION.*?\n# =============================================================================[\s\S]*?(?=\n# =============================================================================|\n$)/;
      
      if (redisSection.test(envContent)) {
        envContent = envContent.replace(redisSection, redisConfig.trim());
        console.log('✅ Updated Redis configuration in .env');
      } else {
        envContent += '\n' + redisConfig;
        console.log('✅ Added Redis configuration to .env');
      }
      
      await fs.writeFile(envPath, envContent);
      return true;
      
    } catch (error) {
      console.error('❌ Failed to update .env:', error.message);
      return false;
    }
  }

  /**
   * Create utility module for application use
   */
  async createUtilityModule() {
    const utilityPath = path.join(process.cwd(), 'src', 'utils', 'redis-manager.js');
    
    const utilityCode = `/**
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
    return await this.set(\`audio_features:\${trackId}\`, features, ttl);
  }

  async getAudioFeatures(trackId) {
    return await this.get(\`audio_features:\${trackId}\`);
  }

  async cacheRecommendations(userId, recommendations) {
    const ttl = parseInt(process.env.CACHE_RECOMMENDATIONS_TTL) || 3600;
    return await this.set(\`recommendations:\${userId}\`, recommendations, ttl);
  }

  async getRecommendations(userId) {
    return await this.get(\`recommendations:\${userId}\`);
  }

  async cacheUserProfile(userId, profile) {
    const ttl = parseInt(process.env.CACHE_USER_PROFILES_TTL) || 7200;
    return await this.set(\`user_profile:\${userId}\`, profile, ttl);
  }

  async getUserProfile(userId) {
    return await this.get(\`user_profile:\${userId}\`);
  }

  async cacheSpotifyAPI(endpoint, data) {
    const ttl = parseInt(process.env.CACHE_SPOTIFY_API_TTL) || 300;
    return await this.set(\`spotify_api:\${endpoint}\`, data, ttl);
  }

  async getSpotifyAPICache(endpoint) {
    return await this.get(\`spotify_api:\${endpoint}\`);
  }

  async close() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

module.exports = new RedisManager();
`;

    await fs.mkdir(path.dirname(utilityPath), { recursive: true });
    await fs.writeFile(utilityPath, utilityCode);
    console.log('✅ Created Redis utility module');
  }

  async close() {
    if (this.client) {
      await this.client.quit();
    }
  }
}

/**
 * Main setup function
 */
async function main() {
  console.log('🚀 EchoTune AI Redis Setup (Simplified)');
  
  const redis = new SimpleRedisSetup();
  
  try {
    // Connect to local Redis
    const connected = await redis.connectToLocal();
    if (!connected) {
      throw new Error('Failed to connect to Redis');
    }
    
    // Set up music cache
    await redis.setupMusicCache();
    
    // Update environment
    await redis.updateEnvConfig();
    
    // Create utility module
    await redis.createUtilityModule();
    
    // Show stats
    await redis.getCacheStats();
    
    console.log('\n✅ Redis setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Test connection: npm run validate:redis');
    console.log('2. Check health: npm run redis:health');
    console.log('3. View stats: npm run redis:stats');
    console.log('\n🎵 Ready to continue with the next roadmap tasks!');
    
    await redis.close();
    
  } catch (error) {
    console.error('❌ Redis setup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = SimpleRedisSetup;