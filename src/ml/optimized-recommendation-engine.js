// Enhanced Recommendation Engine with Architectural Optimizations
// File: src/ml/optimized-recommendation-engine.js

const Redis = require('ioredis');
const LRU = require('lru-cache');

/**
 * Optimized Real-time Recommendation Engine for EchoTune AI
 * Implements architectural improvements identified in Claude Opus analysis
 */
class OptimizedRecommendationEngine {
  constructor() {
    // Multi-layer caching architecture
    this.cacheManager = new EnhancedCacheManager();
    
    // Optimized algorithm weights based on performance analysis
    this.weights = {
      content_based: 0.35,      // Reduced from 0.4 for better balance
      collaborative: 0.40,      // Increased for improved accuracy  
      context_aware: 0.20,      // Maintained for situational relevance
      trending: 0.05           // Reduced overhead for trending content
    };

    // Matrix factorization for O(k) collaborative filtering
    this.factorDimensions = 50;
    this.userFactors = new Map();
    this.itemFactors = new Map();
    this.globalBias = 0;
    this.learningRate = 0.01;

    // Performance monitoring
    this.metrics = {
      requestCount: 0,
      cacheHits: 0,
      avgResponseTime: 0,
      lastOptimization: Date.now()
    };

    this.initialized = false;
  }

  /**
   * Initialize with performance-optimized settings
   */
  async initialize() {
    try {
      console.log('🎯 Initializing Optimized Recommendation Engine...');
      
      // Initialize caching layer
      await this.cacheManager.initialize();
      
      // Load pre-computed user and item factors
      await this.loadFactorMatrices();
      
      // Start background optimization
      this.startBackgroundOptimization();
      
      this.initialized = true;
      console.log('✅ Optimized Recommendation Engine initialized');
      return true;
    } catch (error) {
      console.error('Optimization engine initialization failed:', error);
      return false;
    }
  }

  /**
   * Generate recommendations with enhanced performance
   */
  async generateRecommendations(userId, options = {}) {
    const startTime = Date.now();
    
    try {
      const {
        limit = 20,
        context = {},
        mood = null,
        activity = null,
        timeOfDay = null,
        useCache = true
      } = options;

      // Check cache first (L1 -> L2 -> L3)
      if (useCache) {
        const cached = await this.cacheManager.getRecommendations(userId, context);
        if (cached) {
          this.updateMetrics(startTime, true);
          return cached;
        }
      }

      // Parallel data fetching with optimized queries
      const [userProfile, contextualData] = await Promise.all([
        this.getOptimizedUserProfile(userId),
        this.getContextualData(context, mood, activity, timeOfDay)
      ]);

      // Parallel recommendation computation
      const recommendationPromises = [
        this.getOptimizedCollaborativeRecommendations(userId, userProfile),
        this.getContentBasedRecommendations(userProfile, contextualData),
        this.getContextAwareRecommendations(contextualData),
        this.getTrendingRecommendations(contextualData, limit * 0.1) // 10% trending
      ];

      const [collaborative, content, contextual, trending] = await Promise.all(
        recommendationPromises
      );

      // Weighted combination with optimized scoring
      const recommendations = this.combineRecommendations({
        collaborative,
        content,
        contextual,
        trending
      }, limit);

      // Cache results with TTL based on context
      const cacheResult = {
        recommendations,
        userProfile: userProfile.summary,
        context: contextualData,
        generatedAt: new Date().toISOString()
      };

      await this.cacheManager.setRecommendations(userId, context, cacheResult);
      
      this.updateMetrics(startTime, false);
      
      return {
        success: true,
        ...cacheResult
      };

    } catch (error) {
      console.error('Optimized recommendation generation error:', error);
      return {
        success: false,
        error: error.message,
        fallback: await this.getFallbackRecommendations(userId, options)
      };
    }
  }

  /**
   * Optimized collaborative filtering using matrix factorization
   */
  async getOptimizedCollaborativeRecommendations(userId, userProfile) {
    try {
      // Check if user factors exist, initialize if new user
      if (!this.userFactors.has(userId)) {
        await this.initializeUserFactors(userId, userProfile);
      }

      const userVector = this.userFactors.get(userId);
      const recommendations = [];

      // Efficient similarity computation using pre-computed item factors
      for (const [itemId, itemVector] of this.itemFactors) {
        if (!userProfile.listenedTracks.has(itemId)) {
          const score = this.computeDotProduct(userVector, itemVector) + this.globalBias;
          
          recommendations.push({
            trackId: itemId,
            score: score,
            source: 'collaborative',
            weight: this.weights.collaborative
          });
        }
      }

      // Sort and return top recommendations
      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.floor(50 * this.weights.collaborative));

    } catch (error) {
      console.error('Optimized collaborative filtering error:', error);
      return [];
    }
  }

  /**
   * Enhanced content-based filtering with audio feature optimization
   */
  async getContentBasedRecommendations(userProfile, contextualData) {
    try {
      // Compute target features based on user preferences and context
      const targetFeatures = this.computeOptimizedTargetFeatures(userProfile, contextualData);
      
      // Use cached audio features for faster lookup
      const candidateTracks = await this.cacheManager.getCandidateTracks(userProfile.genres);
      
      const recommendations = candidateTracks.map(track => {
        const similarity = this.computeOptimizedContentSimilarity(
          track.audioFeatures, 
          targetFeatures
        );
        
        return {
          trackId: track.id,
          trackName: track.name,
          artistName: track.artist,
          score: similarity,
          source: 'content',
          weight: this.weights.content_based,
          audioFeatures: track.audioFeatures
        };
      });

      return recommendations
        .filter(rec => rec.score > 0.6) // Quality threshold
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.floor(50 * this.weights.content_based));

    } catch (error) {
      console.error('Content-based recommendation error:', error);
      return [];
    }
  }

  /**
   * Context-aware recommendations with environmental factors
   */
  async getContextAwareRecommendations(contextualData) {
    try {
      const { mood, activity, timeOfDay, weather, location } = contextualData;
      
      // Context-specific feature adjustments
      const contextWeights = this.getContextWeights(mood, activity, timeOfDay);
      
      // Fetch context-appropriate tracks from cache
      const contextTracks = await this.cacheManager.getContextualTracks(contextWeights);
      
      const recommendations = contextTracks.map(track => ({
        trackId: track.id,
        score: this.computeContextScore(track, contextWeights),
        source: 'context',
        weight: this.weights.context_aware,
        contextMatch: this.getContextMatch(track, contextualData)
      }));

      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.floor(30 * this.weights.context_aware));

    } catch (error) {
      console.error('Context-aware recommendation error:', error);
      return [];
    }
  }

  /**
   * Optimized recommendation combination with smart weighting
   */
  combineRecommendations(sources, limit) {
    const combined = new Map();
    
    // Combine all sources with weighted scoring
    Object.entries(sources).forEach(([source, recommendations]) => {
      recommendations.forEach(rec => {
        const existingScore = combined.get(rec.trackId)?.score || 0;
        const weightedScore = rec.score * rec.weight;
        
        combined.set(rec.trackId, {
          ...rec,
          score: existingScore + weightedScore,
          sources: [...(combined.get(rec.trackId)?.sources || []), source]
        });
      });
    });

    // Apply diversity and novelty filters
    const finalRecommendations = Array.from(combined.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit * 2) // Get more for filtering
      .filter(this.diversityFilter.bind(this))
      .slice(0, limit);

    return finalRecommendations.map((rec, index) => ({
      ...rec,
      rank: index + 1,
      confidence: this.calculateConfidence(rec),
      reason: this.generateRecommendationReason(rec)
    }));
  }

  /**
   * Real-time learning from user feedback
   */
  async updateFromFeedback(userId, trackId, rating, timestamp = Date.now()) {
    try {
      const userVector = this.userFactors.get(userId);
      const itemVector = this.itemFactors.get(trackId);
      
      if (!userVector || !itemVector) {
        console.warn(`Missing factors for user ${userId} or track ${trackId}`);
        return false;
      }

      // Compute prediction and error
      const prediction = this.computeDotProduct(userVector, itemVector) + this.globalBias;
      const error = rating - prediction;
      
      // Stochastic Gradient Descent update
      for (let f = 0; f < this.factorDimensions; f++) {
        const userFeature = userVector[f];
        const itemFeature = itemVector[f];
        
        // Update factors with regularization
        userVector[f] += this.learningRate * (error * itemFeature - 0.01 * userFeature);
        itemVector[f] += this.learningRate * (error * userFeature - 0.01 * itemFeature);
      }
      
      // Update global bias
      this.globalBias += this.learningRate * error;
      
      // Update factors in memory
      this.userFactors.set(userId, userVector);
      this.itemFactors.set(trackId, itemVector);
      
      // Invalidate cache for this user
      await this.cacheManager.invalidateUserCache(userId);
      
      return true;
    } catch (error) {
      console.error('Real-time learning update error:', error);
      return false;
    }
  }

  /**
   * Performance monitoring and metrics
   */
  updateMetrics(startTime, cacheHit) {
    const responseTime = Date.now() - startTime;
    this.metrics.requestCount++;
    
    if (cacheHit) {
      this.metrics.cacheHits++;
    }
    
    // Running average of response time
    this.metrics.avgResponseTime = (
      (this.metrics.avgResponseTime * (this.metrics.requestCount - 1) + responseTime) /
      this.metrics.requestCount
    );
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    const cacheHitRate = this.metrics.cacheHits / this.metrics.requestCount;
    
    return {
      ...this.metrics,
      cacheHitRate: cacheHitRate || 0,
      uptime: Date.now() - this.metrics.lastOptimization,
      memoryUsage: process.memoryUsage()
    };
  }

  /**
   * Background optimization processes
   */
  startBackgroundOptimization() {
    // Periodic cache optimization
    setInterval(() => {
      this.cacheManager.optimizeCache();
    }, 300000); // 5 minutes

    // Factor matrix recomputation
    setInterval(() => {
      this.recomputeFactorMatrices();
    }, 3600000); // 1 hour

    // Performance analysis
    setInterval(() => {
      this.analyzePerformance();
    }, 900000); // 15 minutes
  }

  /**
   * Helper methods for optimized computations
   */
  computeDotProduct(vectorA, vectorB) {
    let product = 0;
    for (let i = 0; i < vectorA.length; i++) {
      product += vectorA[i] * vectorB[i];
    }
    return product;
  }

  computeOptimizedContentSimilarity(trackFeatures, targetFeatures) {
    const featureWeights = {
      danceability: 0.25,
      energy: 0.25, 
      valence: 0.20,
      acousticness: 0.15,
      instrumentalness: 0.10,
      tempo: 0.05
    };

    let similarity = 0;
    for (const [feature, weight] of Object.entries(featureWeights)) {
      const diff = Math.abs(trackFeatures[feature] - targetFeatures[feature]);
      similarity += (1 - diff) * weight;
    }

    return Math.max(0, similarity);
  }

  diversityFilter(recommendation, index, array) {
    // Ensure diversity in genres, artists, and audio features
    const seenArtists = new Set();
    const seenGenres = new Set();
    
    return array.slice(0, index).every(prev => {
      if (seenArtists.has(recommendation.artistName)) return false;
      if (seenGenres.has(recommendation.genre)) return false;
      
      seenArtists.add(prev.artistName);
      seenGenres.add(prev.genre);
      return true;
    });
  }

  calculateConfidence(recommendation) {
    const sourceCount = recommendation.sources.length;
    const scoreNormalized = Math.min(recommendation.score, 1.0);
    
    return Math.min(0.95, scoreNormalized * (0.5 + sourceCount * 0.25));
  }

  generateRecommendationReason(recommendation) {
    const reasons = [];
    
    if (recommendation.sources.includes('collaborative')) {
      reasons.push('Users with similar taste enjoy this');
    }
    if (recommendation.sources.includes('content')) {
      reasons.push('Matches your music preferences');
    }
    if (recommendation.sources.includes('context')) {
      reasons.push(`Perfect for ${recommendation.contextMatch}`);
    }
    
    return reasons.join(', ') || 'Recommended for you';
  }
}

/**
 * Enhanced Cache Manager with multi-layer architecture
 */
class EnhancedCacheManager {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.localCache = new LRU({ max: 1000, ttl: 300000 }); // 5 minutes
    
    this.cacheTTL = {
      recommendations: 900,     // 15 minutes
      userProfiles: 3600,      // 1 hour
      audioFeatures: 21600,    // 6 hours
      contextualTracks: 1800,  // 30 minutes
      candidateTracks: 7200    // 2 hours
    };
  }

  async initialize() {
    try {
      await this.redis.ping();
      console.log('✅ Redis cache connected');
      return true;
    } catch (error) {
      console.warn('⚠️ Redis unavailable, using local cache only');
      return false;
    }
  }

  async getRecommendations(userId, context = {}) {
    const cacheKey = this.generateCacheKey('rec', userId, context);
    
    // L1: Local cache
    let result = this.localCache.get(cacheKey);
    if (result) return result;
    
    // L2: Redis cache
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        result = JSON.parse(cached);
        this.localCache.set(cacheKey, result);
        return result;
      }
    } catch (error) {
      console.warn('Redis cache read error:', error.message);
    }
    
    return null;
  }

  async setRecommendations(userId, context, recommendations) {
    const cacheKey = this.generateCacheKey('rec', userId, context);
    const ttl = this.cacheTTL.recommendations;
    
    // Store in local cache
    this.localCache.set(cacheKey, recommendations);
    
    // Store in Redis with TTL
    try {
      await this.redis.setex(cacheKey, ttl, JSON.stringify(recommendations));
    } catch (error) {
      console.warn('Redis cache write error:', error.message);
    }
  }

  generateCacheKey(type, userId, context = {}) {
    const contextHash = this.hashObject(context);
    return `${type}:${userId}:${contextHash}`;
  }

  hashObject(obj) {
    return require('crypto')
      .createHash('md5')
      .update(JSON.stringify(obj))
      .digest('hex')
      .substring(0, 8);
  }

  async invalidateUserCache(userId) {
    const pattern = `*:${userId}:*`;
    
    // Clear local cache
    for (const key of this.localCache.keys()) {
      if (key.includes(userId)) {
        this.localCache.delete(key);
      }
    }
    
    // Clear Redis cache
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.warn('Redis cache invalidation error:', error.message);
    }
  }

  async optimizeCache() {
    // Remove expired entries and analyze hit rates
    const stats = {
      localCacheSize: this.localCache.size,
      evictions: 0,
      hitRate: 0
    };
    
    // LRU cache automatically evicts, just gather stats
    return stats;
  }
}

module.exports = OptimizedRecommendationEngine;