/**
 * EchoTune AI - Advanced Rate Limiting with Token Buckets
 * Phase 1 Epic E03: API Performance & Rate Limiting
 * 
 * Implements adaptive token bucket rate limiting with:
 * - Priority-based token allocation
 * - Burst handling and queue management
 * - Circuit breaker integration
 * - Real-time metrics and monitoring
 */

const { EventEmitter } = require('events');

class TokenBucket extends EventEmitter {
  constructor(capacity, refillRate, initialTokens = null) {
    super();
    this.capacity = capacity;
    this.refillRate = refillRate; // tokens per second
    this.tokens = initialTokens !== null ? initialTokens : capacity;
    this.lastRefill = Date.now();
    this.queue = [];
    this.maxQueueSize = capacity * 2;
  }

  /**
   * Attempt to consume tokens from the bucket
   */
  consume(tokens = 1, priority = 'normal') {
    this.refill();
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      this.emit('consumed', { tokens, remaining: this.tokens, priority });
      return { allowed: true, tokens: this.tokens, waitTime: 0 };
    }
    
    // Calculate wait time based on refill rate
    const waitTime = Math.ceil((tokens - this.tokens) / this.refillRate * 1000);
    
    // For high priority requests, allow small overdraft
    if (priority === 'high' && tokens <= 2) {
      this.tokens = Math.max(0, this.tokens - tokens);
      this.emit('overdraft', { tokens, priority, remaining: this.tokens });
      return { allowed: true, tokens: this.tokens, waitTime: 0, overdraft: true };
    }
    
    this.emit('rejected', { tokens, waitTime, priority, remaining: this.tokens });
    return { allowed: false, tokens: this.tokens, waitTime };
  }

  /**
   * Add request to queue for delayed processing
   */
  enqueue(request, priority = 'normal') {
    if (this.queue.length >= this.maxQueueSize) {
      this.emit('queue_overflow', { queueSize: this.queue.length, priority });
      return false;
    }
    
    const queueItem = {
      ...request,
      priority,
      timestamp: Date.now(),
      id: this.generateRequestId()
    };
    
    // Insert based on priority
    if (priority === 'high') {
      this.queue.unshift(queueItem);
    } else {
      this.queue.push(queueItem);
    }
    
    this.emit('queued', { id: queueItem.id, priority, queueSize: this.queue.length });
    return queueItem.id;
  }

  /**
   * Process queued requests
   */
  processQueue() {
    const processed = [];
    
    while (this.queue.length > 0 && this.tokens >= 1) {
      const request = this.queue.shift();
      const result = this.consume(request.tokens || 1, request.priority);
      
      if (result.allowed) {
        processed.push(request);
        this.emit('dequeued', { 
          id: request.id, 
          waitTime: Date.now() - request.timestamp,
          queueSize: this.queue.length 
        });
      } else {
        // Put it back at the front
        this.queue.unshift(request);
        break;
      }
    }
    
    return processed;
  }

  /**
   * Refill tokens based on time elapsed
   */
  refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const tokensToAdd = elapsed * this.refillRate;
    
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
      this.lastRefill = now;
      this.emit('refilled', { tokens: this.tokens, added: tokensToAdd });
    }
  }

  /**
   * Generate unique request ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get bucket status
   */
  getStatus() {
    this.refill();
    return {
      tokens: this.tokens,
      capacity: this.capacity,
      refillRate: this.refillRate,
      queueSize: this.queue.length,
      utilization: 1 - (this.tokens / this.capacity)
    };
  }
}

class AdaptiveRateLimiter {
  constructor(config = {}) {
    this.config = {
      // Default rate limits by endpoint type
      api: { capacity: 100, refillRate: 2 }, // 100 tokens, 2/sec
      auth: { capacity: 10, refillRate: 0.1 }, // 10 tokens, 1 per 10 sec
      spotify: { capacity: 50, refillRate: 1.5 }, // Respect Spotify limits
      heavy: { capacity: 20, refillRate: 0.5 }, // For heavy operations
      ...config
    };
    
    this.buckets = new Map();
    this.metrics = {
      requests: 0,
      allowed: 0,
      rejected: 0,
      queued: 0,
      overdrafts: 0
    };
    
    // Start queue processing interval
    this.queueProcessor = setInterval(() => {
      this.processAllQueues();
    }, 100);
  }

  /**
   * Get or create bucket for a key
   */
  getBucket(key, type = 'api') {
    if (!this.buckets.has(key)) {
      const config = this.config[type] || this.config.api;
      const bucket = new TokenBucket(config.capacity, config.refillRate);
      
      // Set up event listeners for metrics
      bucket.on('consumed', (data) => {
        this.metrics.allowed++;
        this.updateBucketUsage(key, data.remaining / bucket.capacity);
      });
      
      bucket.on('rejected', () => {
        this.metrics.rejected++;
      });
      
      bucket.on('queued', () => {
        this.metrics.queued++;
      });
      
      bucket.on('overdraft', () => {
        this.metrics.overdrafts++;
      });
      
      this.buckets.set(key, bucket);
    }
    
    return this.buckets.get(key);
  }

  /**
   * Check if request is allowed (middleware function)
   */
  createMiddleware(keyGenerator, options = {}) {
    return (req, res, next) => {
      this.metrics.requests++;
      
      const key = keyGenerator(req);
      const type = this.determineEndpointType(req, options);
      const priority = this.determinePriority(req, options);
      const tokens = options.tokens || 1;
      
      const bucket = this.getBucket(key, type);
      const result = bucket.consume(tokens, priority);
      
      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': bucket.capacity,
        'X-RateLimit-Remaining': Math.floor(bucket.tokens),
        'X-RateLimit-Reset': Math.ceil(Date.now() / 1000) + Math.ceil(bucket.capacity / bucket.refillRate)
      });
      
      if (result.allowed) {
        if (result.overdraft) {
          res.set('X-RateLimit-Overdraft', 'true');
        }
        next();
      } else {
        // Try to queue if enabled
        if (options.enableQueue && priority !== 'low') {
          const queueId = bucket.enqueue({ req, res, next, tokens }, priority);
          if (queueId) {
            res.set('X-RateLimit-Queued', queueId);
            // Don't call next() - request is queued
            return;
          }
        }
        
        res.set('Retry-After', Math.ceil(result.waitTime / 1000));
        res.status(429).json({
          error: 'Rate limit exceeded',
          waitTime: result.waitTime,
          type: type,
          priority: priority
        });
      }
    };
  }

  /**
   * Determine endpoint type based on request
   */
  determineEndpointType(req, options) {
    if (options.type) return options.type;
    
    const path = req.path.toLowerCase();
    
    if (path.includes('/auth/') || path.includes('/login')) return 'auth';
    if (path.includes('/api/spotify/')) return 'spotify';
    if (path.includes('/api/recommendations/') || path.includes('/api/analyze/')) return 'heavy';
    
    return 'api';
  }

  /**
   * Determine request priority
   */
  determinePriority(req, options) {
    if (options.priority) return options.priority;
    
    // High priority for health checks and critical endpoints
    if (req.path === '/health' || req.path === '/metrics') return 'high';
    
    // High priority for authenticated users with premium tokens
    if (req.user && req.user.premium) return 'high';
    
    // Medium priority for authenticated requests
    if (req.user || req.headers.authorization) return 'normal';
    
    // Low priority for anonymous requests
    return 'low';
  }

  /**
   * Process all queued requests
   */
  processAllQueues() {
    for (const [key, bucket] of this.buckets) {
      const processed = bucket.processQueue();
      
      processed.forEach(request => {
        // Execute the original request
        request.next();
      });
    }
  }

  /**
   * Update bucket usage metrics
   */
  updateBucketUsage(key, usage) {
    // This would integrate with the metrics system
    const { helpers } = require('../instrumentation/metrics');
    if (helpers && helpers.updateRateBucketUsage) {
      const [route, priority] = key.split(':');
      helpers.updateRateBucketUsage(route, priority || 'normal', usage);
    }
  }

  /**
   * Get comprehensive metrics
   */
  getMetrics() {
    const bucketMetrics = {};
    
    for (const [key, bucket] of this.buckets) {
      bucketMetrics[key] = bucket.getStatus();
    }
    
    return {
      global: this.metrics,
      buckets: bucketMetrics,
      totalBuckets: this.buckets.size
    };
  }

  /**
   * Clean up expired buckets
   */
  cleanup() {
    const now = Date.now();
    const maxIdle = 30 * 60 * 1000; // 30 minutes
    
    for (const [key, bucket] of this.buckets) {
      if (now - bucket.lastRefill > maxIdle && bucket.queue.length === 0) {
        this.buckets.delete(key);
      }
    }
  }

  /**
   * Shutdown rate limiter
   */
  shutdown() {
    if (this.queueProcessor) {
      clearInterval(this.queueProcessor);
    }
    this.buckets.clear();
  }
}

// Circuit breaker for external API calls
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.timeout = options.timeout || 60000; // 1 minute
    this.resetTimeout = options.resetTimeout || 30000; // 30 seconds
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute(fn, ...args) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime < this.resetTimeout) {
        throw new Error('Circuit breaker is OPEN');
      } else {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
      }
    }

    try {
      const result = await Promise.race([
        fn(...args),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), this.timeout)
        )
      ]);

      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  onSuccess() {
    this.failureCount = 0;
    
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= 3) {
        this.state = 'CLOSED';
      }
    }
  }

  /**
   * Handle failed execution
   */
  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      
      // Record circuit breaker event
      const { helpers } = require('../instrumentation/metrics');
      if (helpers && helpers.recordCircuitBreakerEvent) {
        helpers.recordCircuitBreakerEvent('external_api');
      }
    }
  }

  /**
   * Get circuit breaker status
   */
  getStatus() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime
    };
  }
}

module.exports = {
  TokenBucket,
  AdaptiveRateLimiter,
  CircuitBreaker
};