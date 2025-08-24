// Basic cache manager for smoke testing
// This is a minimal implementation to allow server startup

const LRU = require('lru-cache');

class CacheManager {
  constructor() {
    this.cache = new LRU({
      max: parseInt(process.env.CACHE_MAX_ITEMS) || 500,
      ttl: parseInt(process.env.CACHE_TTL_MS) || 60000 // 1 minute
    });
    this.initialized = false;
  }

  initialize() {
    if (this.initialized) return;
    console.log('📦 Cache manager initialized');
    this.initialized = true;
  }

  get(key) {
    return this.cache.get(key);
  }

  set(key, value, ttl) {
    return this.cache.set(key, value, { ttl });
  }

  del(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }

  // Metrics for monitoring
  getStats() {
    return {
      size: this.cache.size,
      max: this.cache.max,
      calculatedSize: this.cache.calculatedSize,
      hits: this.cache.hits || 0,
      misses: this.cache.misses || 0
    };
  }
}

module.exports = new CacheManager();