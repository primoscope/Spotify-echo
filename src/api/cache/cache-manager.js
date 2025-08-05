const NodeCache = require('node-cache');

/**
 * Advanced Caching System for EchoTune AI
 * 
 * Provides intelligent caching for:
 * - Spotify API responses
 * - Music recommendations
 * - User data and preferences
 * - Audio features and analysis
 * - Chat responses (when appropriate)
 */

class CacheManager {
    constructor() {
        // Multiple cache instances for different data types
        this.caches = {
            // Short-term cache for API responses (5 minutes)
            api: new NodeCache({ 
                stdTTL: 300, 
                checkperiod: 60,
                maxKeys: 1000,
                useClones: false
            }),
            
            // Medium-term cache for recommendations (15 minutes)
            recommendations: new NodeCache({ 
                stdTTL: 900, 
                checkperiod: 120,
                maxKeys: 500,
                useClones: false
            }),
            
            // Long-term cache for user data (1 hour)
            user: new NodeCache({ 
                stdTTL: 3600, 
                checkperiod: 300,
                maxKeys: 200,
                useClones: false
            }),
            
            // Audio features cache (6 hours - this data rarely changes)
            audio_features: new NodeCache({ 
                stdTTL: 21600, 
                checkperiod: 1800,
                maxKeys: 2000,
                useClones: false
            }),
            
            // Chat context cache (10 minutes)
            chat: new NodeCache({ 
                stdTTL: 600, 
                checkperiod: 120,
                maxKeys: 100,
                useClones: false
            })
        };

        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            errors: 0
        };

        // Set up event listeners for statistics
        this.setupEventListeners();
    }

    setupEventListeners() {
        Object.values(this.caches).forEach(cache => {
            cache.on('hit', () => this.stats.hits++);
            cache.on('miss', () => this.stats.misses++);
            cache.on('set', () => this.stats.sets++);
            cache.on('del', () => this.stats.deletes++);
            cache.on('error', () => this.stats.errors++);
        });
    }

    /**
     * Get data from cache
     */
    get(cacheType, key) {
        try {
            const cache = this.caches[cacheType];
            if (!cache) {
                throw new Error(`Invalid cache type: ${cacheType}`);
            }
            
            const value = cache.get(key);
            if (value !== undefined) {
                // Add cache metadata
                return {
                    data: value,
                    cached: true,
                    cache_type: cacheType,
                    timestamp: new Date().toISOString()
                };
            }
            
            return null;
        } catch (error) {
            console.error('Cache get error:', error);
            this.stats.errors++;
            return null;
        }
    }

    /**
     * Set data in cache
     */
    set(cacheType, key, value, ttl = null) {
        try {
            const cache = this.caches[cacheType];
            if (!cache) {
                throw new Error(`Invalid cache type: ${cacheType}`);
            }
            
            const success = ttl ? cache.set(key, value, ttl) : cache.set(key, value);
            return success;
        } catch (error) {
            console.error('Cache set error:', error);
            this.stats.errors++;
            return false;
        }
    }

    /**
     * Delete data from cache
     */
    delete(cacheType, key) {
        try {
            const cache = this.caches[cacheType];
            if (!cache) {
                throw new Error(`Invalid cache type: ${cacheType}`);
            }
            
            return cache.del(key);
        } catch (error) {
            console.error('Cache delete error:', error);
            this.stats.errors++;
            return false;
        }
    }

    /**
     * Clear entire cache or specific cache type
     */
    clear(cacheType = null) {
        try {
            if (cacheType) {
                const cache = this.caches[cacheType];
                if (cache) {
                    cache.flushAll();
                    return true;
                }
                return false;
            } else {
                // Clear all caches
                Object.values(this.caches).forEach(cache => cache.flushAll());
                return true;
            }
        } catch (error) {
            console.error('Cache clear error:', error);
            this.stats.errors++;
            return false;
        }
    }

    /**
     * Cache wrapper for Spotify API calls
     */
    async wrapSpotifyApiCall(key, apiCall, ttl = 300) {
        const cached = this.get('api', key);
        if (cached) {
            return cached.data;
        }

        const result = await apiCall();
        this.set('api', key, result, ttl);
        return result;
    }

    /**
     * Cache wrapper for recommendations
     */
    async wrapRecommendationCall(key, recommendationCall, ttl = 900) {
        const cached = this.get('recommendations', key);
        if (cached) {
            return {
                ...cached.data,
                cached: true,
                cache_age: new Date().getTime() - new Date(cached.timestamp).getTime()
            };
        }

        const result = await recommendationCall();
        this.set('recommendations', key, result, ttl);
        return {
            ...result,
            cached: false
        };
    }

    /**
     * Cache wrapper for user data
     */
    async wrapUserDataCall(userId, dataCall, ttl = 3600) {
        const key = `user_${userId}`;
        const cached = this.get('user', key);
        if (cached) {
            return cached.data;
        }

        const result = await dataCall();
        this.set('user', key, result, ttl);
        return result;
    }

    /**
     * Cache audio features for tracks
     */
    async cacheAudioFeatures(trackIds, audioFeaturesCall) {
        const uncachedTrackIds = [];
        const results = {};

        // Check which tracks are already cached
        for (const trackId of trackIds) {
            const cached = this.get('audio_features', trackId);
            if (cached) {
                results[trackId] = cached.data;
            } else {
                uncachedTrackIds.push(trackId);
            }
        }

        // Fetch uncached tracks
        if (uncachedTrackIds.length > 0) {
            try {
                const newFeatures = await audioFeaturesCall(uncachedTrackIds);
                
                // Cache the new features
                for (const [trackId, features] of Object.entries(newFeatures)) {
                    this.set('audio_features', trackId, features);
                    results[trackId] = features;
                }
            } catch (error) {
                console.error('Error fetching audio features:', error);
                throw error;
            }
        }

        return results;
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const cacheStats = {};
        
        for (const [type, cache] of Object.entries(this.caches)) {
            const stats = cache.getStats();
            cacheStats[type] = {
                keys: stats.keys,
                hits: stats.hits,
                misses: stats.misses,
                ksize: stats.ksize,
                vsize: stats.vsize
            };
        }

        return {
            global: this.stats,
            by_cache: cacheStats,
            hit_rate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Generate cache key for recommendations
     */
    generateRecommendationKey(params) {
        const keyParts = [
            'rec',
            params.userId || 'anonymous',
            params.seed_artists || '',
            params.seed_genres || '',
            params.seed_tracks || '',
            params.target_energy || '',
            params.target_valence || '',
            params.limit || 20
        ];
        
        return keyParts.join('_').replace(/[^a-zA-Z0-9_]/g, '');
    }

    /**
     * Generate cache key for chat context
     */
    generateChatKey(userId, conversationId = null) {
        return `chat_${userId}_${conversationId || 'default'}`;
    }

    /**
     * Cache chat context for conversation continuity
     */
    setChatContext(userId, context, conversationId = null) {
        const key = this.generateChatKey(userId, conversationId);
        return this.set('chat', key, context);
    }

    /**
     * Get chat context for conversation continuity
     */
    getChatContext(userId, conversationId = null) {
        const key = this.generateChatKey(userId, conversationId);
        const cached = this.get('chat', key);
        return cached ? cached.data : null;
    }

    /**
     * Invalidate user-specific caches (useful when user data changes)
     */
    invalidateUserCaches(userId) {
        const userKey = `user_${userId}`;
        this.delete('user', userKey);
        
        // Also clear user's recommendations
        const recKeys = this.caches.recommendations.keys();
        const userRecKeys = recKeys.filter(key => key.includes(userId));
        userRecKeys.forEach(key => this.delete('recommendations', key));
        
        // Clear user's chat context
        const chatKeys = this.caches.chat.keys();
        const userChatKeys = chatKeys.filter(key => key.includes(`chat_${userId}`));
        userChatKeys.forEach(key => this.delete('chat', key));
    }

    /**
     * Preload cache with frequently accessed data
     */
    async preloadCache() {
        try {
            // This could be used to preload popular tracks, genres, etc.
            console.log('Cache preloading started...');
            
            // Add preloading logic here based on your app's needs
            // For example: popular genres, trending tracks, etc.
            
            console.log('Cache preloading completed');
        } catch (error) {
            console.error('Cache preloading error:', error);
        }
    }
}

// Singleton instance
const cacheManager = new CacheManager();

module.exports = cacheManager;