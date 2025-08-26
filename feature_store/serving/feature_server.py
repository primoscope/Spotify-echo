"""
Feature Serving Layer

High-performance feature retrieval for real-time ML inference.
Implements caching, batch fetching, and online/offline consistency.

Part of FST workstream - Phase 2.1 Foundation
"""

import asyncio
import json
import logging
import time
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Union, Tuple
from dataclasses import dataclass, asdict
import hashlib
import os

import redis
import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class FeatureRequest:
    """Request for feature retrieval"""
    entity_id: str
    entity_type: str  # 'user', 'item', 'session'
    feature_names: List[str]
    feature_view: Optional[str] = None
    request_id: Optional[str] = None
    
    def __post_init__(self):
        if self.request_id is None:
            self.request_id = self._generate_request_id()
    
    def _generate_request_id(self) -> str:
        """Generate unique request ID"""
        data = f"{self.entity_id}_{self.entity_type}_{time.time()}"
        return hashlib.md5(data.encode()).hexdigest()[:12]


@dataclass
class FeatureResponse:
    """Response from feature retrieval"""
    entity_id: str
    entity_type: str
    features: Dict[str, Any]
    metadata: Dict[str, Any]
    cache_hit: bool
    retrieval_time_ms: float
    request_id: str
    timestamp: str
    
    def __post_init__(self):
        if not hasattr(self, 'timestamp') or self.timestamp is None:
            self.timestamp = datetime.now(timezone.utc).isoformat()


class FeatureCache:
    """Redis-based feature cache with TTL and statistics"""
    
    def __init__(self, redis_url: str = None, default_ttl: int = 3600):
        self.redis_url = redis_url or os.getenv('REDIS_URL', 'redis://localhost:6379')
        self.default_ttl = default_ttl
        self.redis_client = None
        self.stats = CacheStats()
        self._connect()
    
    def _connect(self):
        """Connect to Redis"""
        try:
            self.redis_client = redis.from_url(self.redis_url, decode_responses=True)
            # Test connection
            self.redis_client.ping()
            logger.info("Connected to Redis feature cache")
        except Exception as e:
            logger.warning(f"Failed to connect to Redis: {e}. Using mock cache.")
            self.redis_client = MockRedis()
    
    async def get_features(self, entity_id: str, entity_type: str, 
                          feature_names: List[str]) -> Dict[str, Any]:
        """Get features from cache"""
        start_time = time.time()
        
        try:
            # Generate cache keys
            cache_keys = [
                self._generate_cache_key(entity_id, entity_type, feature_name)
                for feature_name in feature_names
            ]
            
            # Batch get from Redis
            cached_values = self.redis_client.mget(cache_keys)
            
            # Parse results
            features = {}
            cache_hits = 0
            
            for i, (feature_name, cached_value) in enumerate(zip(feature_names, cached_values)):
                if cached_value is not None:
                    try:
                        features[feature_name] = json.loads(cached_value)
                        cache_hits += 1
                    except json.JSONDecodeError:
                        logger.warning(f"Failed to parse cached value for {feature_name}")
            
            # Update stats
            self.stats.record_get(len(feature_names), cache_hits, time.time() - start_time)
            
            return features
            
        except Exception as e:
            logger.error(f"Cache get error: {e}")
            self.stats.record_error()
            return {}
    
    async def set_features(self, entity_id: str, entity_type: str,
                          features: Dict[str, Any], ttl: int = None) -> bool:
        """Set features in cache"""
        try:
            ttl = ttl or self.default_ttl
            
            # Prepare key-value pairs
            cache_data = {}
            for feature_name, feature_value in features.items():
                cache_key = self._generate_cache_key(entity_id, entity_type, feature_name)
                cache_data[cache_key] = json.dumps(feature_value)
            
            # Batch set with TTL
            pipe = self.redis_client.pipeline()
            pipe.mset(cache_data)
            
            # Set TTL for each key
            for cache_key in cache_data.keys():
                pipe.expire(cache_key, ttl)
            
            pipe.execute()
            
            self.stats.record_set(len(features))
            return True
            
        except Exception as e:
            logger.error(f"Cache set error: {e}")
            self.stats.record_error()
            return False
    
    def _generate_cache_key(self, entity_id: str, entity_type: str, feature_name: str) -> str:
        """Generate cache key for feature"""
        return f"feature:{entity_type}:{entity_id}:{feature_name}"
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        return self.stats.get_stats()
    
    def clear_cache(self, pattern: str = None) -> int:
        """Clear cache entries matching pattern"""
        try:
            if pattern:
                keys = self.redis_client.keys(pattern)
                if keys:
                    return self.redis_client.delete(*keys)
            else:
                return self.redis_client.flushdb()
            return 0
        except Exception as e:
            logger.error(f"Cache clear error: {e}")
            return 0


class CacheStats:
    """Cache performance statistics"""
    
    def __init__(self):
        self.total_gets = 0
        self.cache_hits = 0
        self.total_sets = 0
        self.errors = 0
        self.get_times = []
        
    def record_get(self, requested: int, hits: int, duration: float):
        """Record cache get operation"""
        self.total_gets += requested
        self.cache_hits += hits
        self.get_times.append(duration)
    
    def record_set(self, count: int):
        """Record cache set operation"""
        self.total_sets += count
    
    def record_error(self):
        """Record cache error"""
        self.errors += 1
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        hit_rate = self.cache_hits / self.total_gets if self.total_gets > 0 else 0.0
        avg_get_time = np.mean(self.get_times) if self.get_times else 0.0
        p95_get_time = np.percentile(self.get_times, 95) if self.get_times else 0.0
        
        return {
            'total_gets': self.total_gets,
            'cache_hits': self.cache_hits,
            'hit_rate': hit_rate,
            'total_sets': self.total_sets,
            'errors': self.errors,
            'avg_get_time_ms': avg_get_time * 1000,
            'p95_get_time_ms': p95_get_time * 1000
        }


class FeatureStore:
    """Main feature store serving interface"""
    
    def __init__(self, cache: FeatureCache = None, offline_store=None):
        self.cache = cache or FeatureCache()
        self.offline_store = offline_store or MockOfflineStore()
        self.metrics = ServingMetrics()
        
    async def get_features(self, request: FeatureRequest) -> FeatureResponse:
        """Get features for entity"""
        start_time = time.time()
        
        try:
            # Try cache first
            cached_features = await self.cache.get_features(
                request.entity_id, 
                request.entity_type, 
                request.feature_names
            )
            
            # Identify missing features
            missing_features = [
                name for name in request.feature_names 
                if name not in cached_features
            ]
            
            # Fetch missing features from offline store
            offline_features = {}
            if missing_features:
                offline_features = await self.offline_store.get_features(
                    request.entity_id,
                    request.entity_type,
                    missing_features
                )
                
                # Cache the retrieved features
                if offline_features:
                    await self.cache.set_features(
                        request.entity_id,
                        request.entity_type,
                        offline_features
                    )
            
            # Combine cached and offline features
            all_features = {**cached_features, **offline_features}
            
            # Check for still missing features
            still_missing = [
                name for name in request.feature_names
                if name not in all_features
            ]
            
            retrieval_time_ms = (time.time() - start_time) * 1000
            cache_hit = len(cached_features) > 0
            
            # Record metrics
            self.metrics.record_request(
                len(request.feature_names),
                len(cached_features),
                len(still_missing),
                retrieval_time_ms
            )
            
            # Create response
            response = FeatureResponse(
                entity_id=request.entity_id,
                entity_type=request.entity_type,
                features=all_features,
                metadata={
                    'cached_features': len(cached_features),
                    'offline_features': len(offline_features),
                    'missing_features': still_missing,
                    'feature_view': request.feature_view
                },
                cache_hit=cache_hit,
                retrieval_time_ms=retrieval_time_ms,
                request_id=request.request_id,
                timestamp=datetime.now(timezone.utc).isoformat()
            )
            
            if still_missing:
                logger.warning(f"Missing features for {request.entity_id}: {still_missing}")
            
            return response
            
        except Exception as e:
            self.metrics.record_error()
            logger.error(f"Feature retrieval error: {e}")
            
            # Return empty response on error
            return FeatureResponse(
                entity_id=request.entity_id,
                entity_type=request.entity_type,
                features={},
                metadata={'error': str(e)},
                cache_hit=False,
                retrieval_time_ms=(time.time() - start_time) * 1000,
                request_id=request.request_id,
                timestamp=datetime.now(timezone.utc).isoformat()
            )
    
    async def get_features_batch(self, requests: List[FeatureRequest]) -> List[FeatureResponse]:
        """Get features for multiple entities in batch"""
        start_time = time.time()
        
        # Process requests concurrently
        tasks = [self.get_features(request) for request in requests]
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Handle exceptions
        valid_responses = []
        for i, response in enumerate(responses):
            if isinstance(response, Exception):
                logger.error(f"Batch request {i} failed: {response}")
                # Create error response
                error_response = FeatureResponse(
                    entity_id=requests[i].entity_id,
                    entity_type=requests[i].entity_type,
                    features={},
                    metadata={'error': str(response)},
                    cache_hit=False,
                    retrieval_time_ms=0.0,
                    request_id=requests[i].request_id,
                    timestamp=datetime.now(timezone.utc).isoformat()
                )
                valid_responses.append(error_response)
            else:
                valid_responses.append(response)
        
        batch_time_ms = (time.time() - start_time) * 1000
        self.metrics.record_batch_request(len(requests), batch_time_ms)
        
        logger.info(f"Processed batch of {len(requests)} requests in {batch_time_ms:.2f}ms")
        
        return valid_responses
    
    def get_serving_metrics(self) -> Dict[str, Any]:
        """Get feature serving metrics"""
        cache_stats = self.cache.get_stats()
        serving_stats = self.metrics.get_stats()
        
        return {
            'cache': cache_stats,
            'serving': serving_stats,
            'combined': {
                'total_requests': serving_stats['total_requests'],
                'cache_hit_rate': cache_stats['hit_rate'],
                'avg_latency_ms': serving_stats['avg_latency_ms'],
                'p95_latency_ms': serving_stats['p95_latency_ms'],
                'error_rate': serving_stats['error_rate']
            }
        }


class ServingMetrics:
    """Feature serving performance metrics"""
    
    def __init__(self):
        self.total_requests = 0
        self.total_features_requested = 0
        self.total_cache_hits = 0
        self.total_missing = 0
        self.errors = 0
        self.latencies = []
        self.batch_requests = 0
        self.batch_latencies = []
    
    def record_request(self, features_requested: int, cache_hits: int, 
                      missing: int, latency_ms: float):
        """Record single request metrics"""
        self.total_requests += 1
        self.total_features_requested += features_requested
        self.total_cache_hits += cache_hits
        self.total_missing += missing
        self.latencies.append(latency_ms)
    
    def record_batch_request(self, batch_size: int, latency_ms: float):
        """Record batch request metrics"""
        self.batch_requests += 1
        self.batch_latencies.append(latency_ms)
    
    def record_error(self):
        """Record error"""
        self.errors += 1
    
    def get_stats(self) -> Dict[str, Any]:
        """Get serving statistics"""
        cache_hit_rate = (self.total_cache_hits / self.total_features_requested 
                         if self.total_features_requested > 0 else 0.0)
        error_rate = self.errors / self.total_requests if self.total_requests > 0 else 0.0
        avg_latency = np.mean(self.latencies) if self.latencies else 0.0
        p95_latency = np.percentile(self.latencies, 95) if self.latencies else 0.0
        
        return {
            'total_requests': self.total_requests,
            'total_features_requested': self.total_features_requested,
            'cache_hit_rate': cache_hit_rate,
            'total_missing': self.total_missing,
            'errors': self.errors,
            'error_rate': error_rate,
            'avg_latency_ms': avg_latency,
            'p95_latency_ms': p95_latency,
            'batch_requests': self.batch_requests,
            'avg_batch_latency_ms': np.mean(self.batch_latencies) if self.batch_latencies else 0.0
        }


# Mock implementations for development/testing
class MockRedis:
    """Mock Redis implementation for testing"""
    
    def __init__(self):
        self.data = {}
        self.ttls = {}
    
    def ping(self):
        return True
    
    def mget(self, keys):
        return [self.data.get(key) for key in keys]
    
    def mset(self, mapping):
        self.data.update(mapping)
        return True
    
    def expire(self, key, ttl):
        self.ttls[key] = time.time() + ttl
        return True
    
    def delete(self, *keys):
        count = 0
        for key in keys:
            if key in self.data:
                del self.data[key]
                self.ttls.pop(key, None)
                count += 1
        return count
    
    def flushdb(self):
        count = len(self.data)
        self.data.clear()
        self.ttls.clear()
        return count
    
    def keys(self, pattern):
        # Simple pattern matching for wildcards
        if '*' in pattern:
            prefix = pattern.replace('*', '')
            return [key for key in self.data.keys() if key.startswith(prefix)]
        return [pattern] if pattern in self.data else []
    
    def pipeline(self):
        return MockPipeline(self)


class MockPipeline:
    """Mock Redis pipeline"""
    
    def __init__(self, redis_mock):
        self.redis_mock = redis_mock
        self.commands = []
    
    def mset(self, mapping):
        self.commands.append(('mset', mapping))
        return self
    
    def expire(self, key, ttl):
        self.commands.append(('expire', key, ttl))
        return self
    
    def execute(self):
        results = []
        for command in self.commands:
            if command[0] == 'mset':
                result = self.redis_mock.mset(command[1])
                results.append(result)
            elif command[0] == 'expire':
                result = self.redis_mock.expire(command[1], command[2])
                results.append(result)
        self.commands.clear()
        return results


class MockOfflineStore:
    """Mock offline feature store for testing"""
    
    def __init__(self):
        # Pre-populate with some mock data
        self.data = {
            ('user_123', 'user'): {
                'user_engagement.play_count_7d': 150,
                'user_engagement.skip_rate_7d': 0.25,
                'user_engagement.like_rate_7d': 0.15,
                'cf_embeddings.user_embedding': np.random.randn(64).tolist()
            },
            ('track_456', 'item'): {
                'item_audio.tempo': 120.5,
                'item_audio.danceability': 0.8,
                'item_audio.energy': 0.75,
                'item_metadata.genre_primary': 'pop',
                'item_metadata.artist_popularity': 85,
                'content_embeddings.content_embedding': np.random.randn(128).tolist()
            }
        }
    
    async def get_features(self, entity_id: str, entity_type: str, 
                          feature_names: List[str]) -> Dict[str, Any]:
        """Get features from offline store"""
        # Simulate some latency
        await asyncio.sleep(0.01)
        
        key = (entity_id, entity_type)
        entity_features = self.data.get(key, {})
        
        # Return requested features that exist
        result = {
            name: entity_features[name]
            for name in feature_names
            if name in entity_features
        }
        
        return result


# Feature flag check
def is_feature_store_enabled() -> bool:
    """Check if feature store is enabled via feature flag"""
    return os.getenv('ENABLE_HYBRID_RECO', 'false').lower() == 'true'


if __name__ == "__main__":
    # Example usage
    async def demo_feature_serving():
        # Create feature store
        feature_store = FeatureStore()
        
        # Single feature request
        request = FeatureRequest(
            entity_id="user_123",
            entity_type="user",
            feature_names=[
                "user_engagement.play_count_7d",
                "user_engagement.skip_rate_7d",
                "cf_embeddings.user_embedding"
            ],
            feature_view="recommendation_serving"
        )
        
        print("Single request:")
        response = await feature_store.get_features(request)
        print(f"  Entity: {response.entity_id}")
        print(f"  Features retrieved: {len(response.features)}")
        print(f"  Cache hit: {response.cache_hit}")
        print(f"  Latency: {response.retrieval_time_ms:.2f}ms")
        print(f"  Features: {list(response.features.keys())}")
        
        # Batch requests
        batch_requests = [
            FeatureRequest("user_123", "user", ["user_engagement.play_count_7d"]),
            FeatureRequest("track_456", "item", ["item_audio.tempo", "item_metadata.genre_primary"]),
            FeatureRequest("user_456", "user", ["user_engagement.like_rate_7d"])
        ]
        
        print("\nBatch request:")
        batch_responses = await feature_store.get_features_batch(batch_requests)
        for i, response in enumerate(batch_responses):
            print(f"  Request {i+1}: {len(response.features)} features, {response.retrieval_time_ms:.2f}ms")
        
        # Show metrics
        print("\nServing metrics:")
        metrics = feature_store.get_serving_metrics()
        print(json.dumps(metrics, indent=2))
    
    # Run demo
    asyncio.run(demo_feature_serving())