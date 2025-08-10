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
    this.redisClient = null;
    this.redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.keyPrefix = options.keyPrefix || 'rl:';

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
      if (!this.redisClient || !this.redisClient.isOpen) {
        throw new Error('Redis client not available');
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
      if (!this.redisClient || !this.redisClient.isOpen) {
        throw new Error('Redis client not available');
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
          res.set('Retry-After', Math.ceil(ttl / 1000));

          return res.status(this.statusCode).json({
            error: 'Too Many Requests',
            message: this.message,
            retryAfter: Math.ceil(ttl / 1000),
          });
        }

        // Skip counting for certain responses if configured
        const originalSend = res.send;
        res.send = function (body) {
          const shouldSkip =
            (this.skipSuccessfulRequests && res.statusCode < 400) ||
            (this.skipFailedRequests && res.statusCode >= 400);

          if (shouldSkip) {
            // Decrement the counter since we don't want to count this request
            this.redisClient?.decr(key).catch(() => {}); // Ignore errors
          }

          return originalSend.call(this, body);
        }.bind(this);

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
