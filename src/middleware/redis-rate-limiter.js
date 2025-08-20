/**
 * Redis-backed Rate Limiting Middleware
 * Replaces in-memory rate limiting with Redis for scalability
 */

const Redis = require('redis');

class RedisRateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
    this.max = options.max || 100;
    this.keyGenerator = options.keyGenerator || ((req) => req.ip);
    this.message = options.message || 'Too many requests, please try again later';
    this.statusCode = options.statusCode || 429;
    this.skipSuccessfulRequests = options.skipSuccessfulRequests || false;
    this.skipFailedRequests = options.skipFailedRequests || false;
    this.onLimitReached = options.onLimitReached || (() => {});

    // Redis configuration
    this.useRedis = true; // Will be set to false if Redis is not available
    this.redisClient = null;
    this.redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.keyPrefix = options.keyPrefix || 'rl:';

    // In-memory fallback storage
    this.memoryStore = new Map();

    // Performance tracking
    this.stats = {
      totalRequests: 0,
      limitedRequests: 0,
      errors: 0,
    };
  }

  /**
   * Initialize Redis connection
   */
  async initialize() {
    // Skip Redis initialization if URL looks like a placeholder
    if (this.redisUrl.includes('username:password@host:port')) {
      console.log('⚠️ Redis URL is a placeholder, using in-memory rate limiting');
      this.useRedis = false;
      return;
    }

    try {
      this.redisClient = Redis.createClient({
        url: this.redisUrl,
        socket: {
          connectTimeout: 10000,
          reconnectStrategy: (retries) => Math.min(retries * 50, 500),
        },
      });

      this.redisClient.on('error', (err) => {
        console.error('Redis Rate Limiter error:', err);
        this.stats.errors++;
      });

      this.redisClient.on('connect', () => {
        console.log('✅ Redis Rate Limiter connected');
      });

      await this.redisClient.connect();
      return true;
    } catch (error) {
      console.error('❌ Redis Rate Limiter initialization failed:', error);
      return false;
    }
  }

  /**
   * Get current count for a key
   */
  async getCurrentCount(key) {
    try {
      if (!this.redisClient || !this.redisClient.isOpen) {
        throw new Error('Redis client not available');
      }

      const current = await this.redisClient.get(key);
      return current ? parseInt(current, 10) : 0;
    } catch (error) {
      console.error('Redis rate limiter get error:', error);
      this.stats.errors++;
      return 0;
    }
  }

  /**
   * Increment counter for a key
   */
  async incrementCount(key) {
    try {
      if (!this.useRedis || !this.redisClient || !this.redisClient.isOpen) {
        // Use in-memory fallback
        const now = Date.now();
        const windowStart = now - this.windowMs;
        
        if (!this.memoryStore.has(key)) {
          this.memoryStore.set(key, []);
        }
        
        const timestamps = this.memoryStore.get(key);
        // Clean old timestamps
        const validTimestamps = timestamps.filter(ts => ts > windowStart);
        
        // Add current timestamp
        validTimestamps.push(now);
        this.memoryStore.set(key, validTimestamps);
        
        return validTimestamps.length;
      }

      const count = await this.redisClient.incr(key);

      // Set expiration on first increment
      if (count === 1) {
        await this.redisClient.pExpire(key, this.windowMs);
      }

      return count;
    } catch (error) {
      console.error('Redis rate limiter increment error:', error);
      this.stats.errors++;
      return 1; // Failsafe - assume first request
    }
  }

  /**
   * Get TTL for a key
   */
  async getTTL(key) {
    try {
      if (!this.useRedis || !this.redisClient || !this.redisClient.isOpen) {
        // For in-memory, return remaining time in window
        return Math.max(0, this.windowMs - 1000); // Return 1 second less than window
      }

      const ttl = await this.redisClient.pTTL(key);
      return Math.max(0, ttl);
    } catch (error) {
      console.error('Redis rate limiter TTL error:', error);
      return this.windowMs;
    }
  }

  /**
   * Create Express middleware
   */
  createMiddleware() {
    return async (req, res, next) => {
      try {
        this.stats.totalRequests++;

        const key = this.keyPrefix + this.keyGenerator(req);
        const count = await this.incrementCount(key);
        const ttl = await this.getTTL(key);

        // Add rate limit headers
        res.set({
          'X-RateLimit-Limit': this.max,
          'X-RateLimit-Remaining': Math.max(0, this.max - count),
          'X-RateLimit-Reset': new Date(Date.now() + ttl).toISOString(),
        });

        if (count > this.max) {
          this.stats.limitedRequests++;

          // Call limit reached callback
          this.onLimitReached(req, res);

          // Set Retry-After header
          if (!res.headersSent) {
            res.set('Retry-After', Math.ceil(ttl / 1000));
            
            return res.status(this.statusCode).json({
              error: 'Too Many Requests',
              message: this.message,
              retryAfter: Math.ceil(ttl / 1000),
            });
          }
          return; // Headers already sent, can't respond
        }

        // Skip response interception if using memory-based rate limiting
        // (The skipSuccessfulRequests/skipFailedRequests features only work with Redis)
        if (this.useRedis && this.redisClient) {
          // Skip counting for certain responses if configured
          const originalSend = res.send;
          const limiterRef = this;
          res.send = function (body) {
            // Only modify behavior if headers haven't been sent yet
            if (!res.headersSent) {
              const shouldSkip =
                (limiterRef.skipSuccessfulRequests && res.statusCode < 400) ||
                (limiterRef.skipFailedRequests && res.statusCode >= 400);

              if (shouldSkip) {
                // Decrement the counter since we don't want to count this request
                limiterRef.redisClient?.decr(key).catch(() => {}); // Ignore errors
              }
            }

            return originalSend.call(this, body);
          };
        }

        next();
      } catch (error) {
        console.error('Rate limiter middleware error:', error);
        this.stats.errors++;
        // In case of Redis errors, allow the request to continue
        next();
      }
    };
  }

  /**
   * Get rate limiter statistics
   */
  getStats() {
    return {
      ...this.stats,
      connected: this.redisClient?.isOpen || false,
      configuration: {
        windowMs: this.windowMs,
        max: this.max,
        keyPrefix: this.keyPrefix,
      },
    };
  }

  /**
   * Reset stats (for testing)
   */
  resetStats() {
    this.stats = {
      totalRequests: 0,
      limitedRequests: 0,
      errors: 0,
    };
  }

  /**
   * Close Redis connection
   */
  async close() {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.redisClient = null;
    }
  }
}

/**
 * Create Redis-backed rate limiter factory function
 */
function createRedisRateLimit(options = {}) {
  const limiter = new RedisRateLimiter(options);

  // Auto-initialize when first used
  let initialized = false;
  const middleware = async (req, res, next) => {
    if (!initialized) {
      await limiter.initialize();
      initialized = true;
    }

    return limiter.createMiddleware()(req, res, next);
  };

  // Attach limiter instance and stats to middleware
  middleware.limiter = limiter;
  middleware.getStats = () => limiter.getStats();
  middleware.resetStats = () => limiter.resetStats();

  return middleware;
}

/**
 * Pre-configured rate limiters for different routes
 */
const rateLimiters = {
  // Global rate limiter - generous limits
  global: createRedisRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000,
    keyPrefix: 'global:',
    message: 'Too many requests from this IP, please try again later',
  }),

  // API rate limiter - moderate limits
  api: createRedisRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500,
    keyPrefix: 'api:',
    message: 'Too many API requests, please slow down',
  }),

  // Chat rate limiter - stricter limits
  chat: createRedisRateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30,
    keyPrefix: 'chat:',
    message: 'Too many chat messages, please wait before sending more',
  }),

  // Spotify API rate limiter - conservative limits
  spotify: createRedisRateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 50,
    keyPrefix: 'spotify:',
    message: 'Spotify API rate limit exceeded, please try again later',
  }),

  // Auth rate limiter - very strict limits
  auth: createRedisRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    keyPrefix: 'auth:',
    message: 'Too many authentication attempts, please try again later',
  }),
};

module.exports = {
  RedisRateLimiter,
  createRedisRateLimit,
  rateLimiters,
};
