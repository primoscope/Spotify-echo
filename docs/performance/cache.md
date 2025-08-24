# Cache Integration

## Overview

The application uses an LRU (Least Recently Used) cache with integrated metrics to improve performance and reduce external API calls.

## Configuration

Cache behavior is controlled by environment variables:

- `CACHE_MAX_ITEMS`: Maximum number of items to store (default: 500)
- `CACHE_TTL_MS`: Time-to-live for cache entries in milliseconds (default: 60000)

## Usage

### Basic Operations

```javascript
const cache = require('../infra/cache');

// Initialize cache (call once at startup)
cache.initialize();

// Get item from cache
const value = cache.get('user:123');

// Set item in cache
cache.set('user:123', userData);

// Set with custom TTL (5 minutes)
cache.set('temp:data', tempData, { ttl: 5 * 60 * 1000 });

// Delete item
cache.del('user:123');

// Clear all cache
cache.clear();
```

### Instrumented Get-or-Set

The recommended pattern for most use cases:

```javascript
const { instrumentedGetOrSet, buildCacheKey } = require('../infra/cache');

async function getUserProfile(userId) {
  const cacheKey = buildCacheKey('user_profile', userId);
  
  return await instrumentedGetOrSet(
    cacheKey,
    async () => {
      // This function is only called on cache miss
      const response = await fetch(`/api/users/${userId}`);
      return response.json();
    },
    {
      ttl: 5 * 60 * 1000, // 5 minutes
      service: 'user-service',
      operation: 'get_profile'
    }
  );
}
```

### Cache Key Building

Use the helper to build consistent cache keys:

```javascript
const { buildCacheKey } = require('../infra/cache');

// Build hierarchical cache keys
const userKey = buildCacheKey('user', userId);                    // user:123
const sessionKey = buildCacheKey('session', userId, sessionId);   // session:123:abc456
const apiKey = buildCacheKey('api', 'spotify', 'recommendations', // api:spotify:recommendations:user123
  `user${userId}`);
```

## Metrics Integration

The cache automatically tracks metrics that are exposed via `/internal/metrics`:

- `cache_hits_total{cache}`: Number of cache hits
- `cache_misses_total{cache}`: Number of cache misses  
- `cache_hit_ratio{cache}`: Current cache hit ratio (0.0 to 1.0)

### Monitoring Cache Performance

```bash
# Check cache metrics
curl -s http://localhost:3000/internal/metrics | grep cache_

# Example output:
# cache_hits_total{cache="default"} 145
# cache_misses_total{cache="default"} 23
# cache_hit_ratio{cache="default"} 0.8630434782608696
```

## Cache Statistics

Get detailed cache statistics:

```javascript
const stats = cache.getStats();
console.log(stats);
// {
//   size: 42,              // Current number of items
//   maxSize: 500,          // Maximum capacity
//   ttl: 60000,            // Default TTL in ms
//   rss: 1024,             // Approximate memory usage
//   load: 67               // Total items loaded (including expired)
// }
```

## Common Patterns

### API Response Caching

```javascript
async function getSpotifyRecommendations(userId, params) {
  const cacheKey = buildCacheKey('spotify_recs', userId, 
    JSON.stringify(params));
    
  return await instrumentedGetOrSet(
    cacheKey,
    async () => {
      const response = await spotifyAPI.getRecommendations(params);
      return response.data;
    },
    {
      ttl: 30 * 60 * 1000, // 30 minutes
      service: 'spotify',
      operation: 'recommendations'
    }
  );
}
```

### User Session Caching

```javascript
async function getUserSession(sessionId) {
  const cacheKey = buildCacheKey('session', sessionId);
  
  let session = cache.get(cacheKey);
  
  if (!session) {
    session = await database.getSession(sessionId);
    if (session) {
      // Cache for 1 hour
      cache.set(cacheKey, session, { ttl: 60 * 60 * 1000 });
    }
  }
  
  return session;
}
```

### Computed Data Caching

```javascript
async function getPlaylistAnalytics(playlistId) {
  const cacheKey = buildCacheKey('analytics', 'playlist', playlistId);
  
  return await instrumentedGetOrSet(
    cacheKey,
    async () => {
      // Expensive computation
      const tracks = await getPlaylistTracks(playlistId);
      const analytics = await analyzeAudioFeatures(tracks);
      return analytics;
    },
    {
      ttl: 24 * 60 * 60 * 1000, // 24 hours for analytics
      service: 'analytics',
      operation: 'playlist_analysis'
    }
  );
}
```

## Cache Invalidation

### Manual Invalidation

```javascript
// Invalidate user data when updated
async function updateUserProfile(userId, updates) {
  await database.updateUser(userId, updates);
  
  // Invalidate cached user data
  cache.del(buildCacheKey('user_profile', userId));
  cache.del(buildCacheKey('user_preferences', userId));
}
```

### Pattern-based Invalidation

```javascript
// Clear all user-related cache entries
function invalidateUserCache(userId) {
  const patterns = [
    buildCacheKey('user_profile', userId),
    buildCacheKey('user_preferences', userId),
    buildCacheKey('user_playlists', userId),
    buildCacheKey('user_recommendations', userId)
  ];
  
  patterns.forEach(key => cache.del(key));
}
```

## Best Practices

1. **Use consistent key patterns**: Always use `buildCacheKey()` for consistency
2. **Set appropriate TTLs**: Balance freshness vs. performance
3. **Monitor hit ratios**: Aim for >70% hit ratio for frequently accessed data
4. **Handle cache misses gracefully**: Always have fallback logic
5. **Cache at the right level**: Cache expensive operations, not cheap ones
6. **Consider data size**: Don't cache very large objects
7. **Invalidate proactively**: Remove stale data when the source changes

## Environment Variables

```bash
# Cache configuration
CACHE_MAX_ITEMS=1000          # Increase for high-traffic applications
CACHE_TTL_MS=300000           # 5 minutes default TTL

# Development settings
CACHE_MAX_ITEMS=100           # Smaller cache for development
CACHE_TTL_MS=30000            # Shorter TTL for development
```

## Integration with Other Components

The cache integrates with:

- **Metrics system**: Automatic hit/miss tracking
- **Logging system**: Debug logs for cache operations
- **Health checks**: Cache statistics in health endpoints

## Performance Considerations

- **Memory usage**: Monitor cache size vs. available memory
- **TTL tuning**: Adjust based on data update frequency
- **Key distribution**: Avoid hotspots with good key design
- **Eviction policy**: LRU automatically handles memory pressure

## Debugging

Enable debug logging to see cache operations:

```bash
# Set log level to debug
LOG_LEVEL=debug npm start

# Or check cache stats programmatically
const stats = cache.getStats();
console.log('Cache utilization:', stats.size / stats.maxSize);
```