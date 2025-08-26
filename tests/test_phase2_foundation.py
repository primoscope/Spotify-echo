"""
Test suite for Phase 2.1 Foundation workstreams
Tests FBK, CF, EMB, and FST implementations
"""

import asyncio
import tempfile
import numpy as np
import pandas as pd
import os
import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Import modules to test
from events.processing.enrichment import EnrichmentEngine, DeadLetterQueue, RawEvent
from events.gateway.http_gateway import EventGateway
from reco.ml.pipelines.cf_trainer import CollaborativeFilteringTrainer, CFConfig
from reco.ml.pipelines.content_embedder import ContentFeatureEmbedder, EmbedderConfig
from feature_store.registry.feature_registry import FeatureRegistry, FeatureGroup, FeatureSchema
from feature_store.serving.feature_server import FeatureStore, FeatureRequest
from reco.service.ranking.hybrid import HybridRecommendationPipeline, HybridConfig, RecommendationCandidate
from reco.jobs.trending_detector import TrendingDetectorJob, TrendingConfig
from experiments.evaluation.multi_metric_evaluator import (
    ExperimentEvaluationEngine, MetricDefinition, GuardrailDefinition, MetricType, GuardrailType
)


def test_event_enrichment():
    """Test event enrichment pipeline"""
    print("Testing event enrichment...")
    
    engine = EnrichmentEngine()
    
    # Test valid event
    raw_event = RawEvent(
        user_id="test_user",
        item_id="test_track",
        event_type="play",
        timestamp="2024-01-01T00:00:00Z",
        raw_data={
            'user_agent': 'Mozilla/5.0 Mobile',
            'referrer': 'https://open.spotify.com'
        }
    )
    
    enriched = engine.enrich_event(raw_event)
    assert enriched is not None
    assert enriched.user_id == "test_user"
    assert enriched.session_id is not None
    assert enriched.device_type == "mobile"
    assert enriched.schema_version == 2
    
    print("✓ Event enrichment working")


def test_dlq_handling():
    """Test dead letter queue functionality"""
    print("Testing DLQ handling...")
    
    dlq = DeadLetterQueue()
    
    # Create a failing event
    bad_event = RawEvent(
        user_id="",  # Invalid - empty user_id
        item_id="test_track",
        event_type="invalid_type",
        timestamp="invalid_timestamp",
        raw_data={}
    )
    
    dlq.enqueue(bad_event, "Validation failed")
    
    # Check DLQ metrics
    metrics = dlq.metrics.get_metrics()
    assert metrics['counters']['feedback.dlq.count'] == 1
    
    print("✓ DLQ handling working")


async def test_event_gateway():
    """Test event gateway HTTP processing"""
    print("Testing event gateway...")
    
    gateway = EventGateway()
    
    event_data = {
        'item_id': 'track123',
        'event_type': 'play'
    }
    
    request_context = {
        'client_ip': '127.0.0.1',
        'headers': {
            'authorization': 'Bearer test_token_12345',
            'user-agent': 'Mozilla/5.0'
        }
    }
    
    # Set feature flag for testing
    os.environ['ENABLE_FEEDBACK_EVENTS'] = 'true'
    
    result = await gateway.ingest_event(event_data, request_context)
    assert result['status'] in ['success', 'queued']
    assert 'request_id' in result
    
    print("✓ Event gateway working")


def test_collaborative_filtering():
    """Test collaborative filtering trainer"""
    print("Testing collaborative filtering...")
    
    # Create synthetic interaction data
    np.random.seed(42)
    interactions_data = []
    
    for i in range(100):
        interactions_data.append({
            'user_id': f'user_{i % 20}',
            'item_id': f'track_{i % 30}',
            'rating': np.random.randint(1, 6)
        })
    
    interactions_df = pd.DataFrame(interactions_data)
    
    # Set feature flag
    os.environ['ENABLE_HYBRID_RECO'] = 'true'
    
    config = CFConfig(n_factors=16, iterations=5)
    trainer = CollaborativeFilteringTrainer(config)
    
    artifacts = trainer.train(interactions_df)
    
    assert artifacts is not None
    assert artifacts.user_factors.shape[1] == 16  # n_factors
    assert artifacts.metrics.coverage_users > 0
    assert artifacts.metrics.coverage_items > 0
    
    # Test recommendations
    recommendations = trainer.recommend_items("user_0", n_recommendations=5)
    assert len(recommendations) == 5
    assert all(isinstance(score, float) for _, score in recommendations)
    
    print("✓ Collaborative filtering working")


def test_content_embedder():
    """Test content feature embedder"""
    print("Testing content embedder...")
    
    # Create synthetic track data
    np.random.seed(42)
    tracks_data = []
    
    genres = ['pop', 'rock', 'jazz', 'electronic']
    
    for i in range(50):
        track_data = {
            'item_id': f'track_{i}',
            'audio_features': {
                'tempo': np.random.uniform(60, 200),
                'danceability': np.random.uniform(0, 1),
                'energy': np.random.uniform(0, 1),
                'valence': np.random.uniform(0, 1),
                'key': np.random.randint(0, 12),
                'mode': np.random.randint(0, 2),
                'acousticness': np.random.uniform(0, 1),
                'instrumentalness': np.random.uniform(0, 1),
                'liveness': np.random.uniform(0, 1),
                'loudness': np.random.uniform(-30, 0),
                'speechiness': np.random.uniform(0, 1),
                'time_signature': 4
            },
            'genres': [np.random.choice(genres)],
            'artist_name': f'Artist_{i % 10}',
            'artist_popularity': np.random.randint(0, 100),
            'album_popularity': np.random.randint(0, 100),
            'duration_ms': np.random.randint(30000, 300000),
            'explicit': np.random.choice([True, False]),
            'release_date': '2020-01-01'
        }
        tracks_data.append(track_data)
    
    tracks_df = pd.DataFrame(tracks_data)
    
    # Set feature flag
    os.environ['ENABLE_HYBRID_RECO'] = 'true'
    
    config = EmbedderConfig(embedding_dim=32, use_pca=False)
    embedder = ContentFeatureEmbedder(config)
    
    # Fit and transform
    fit_metrics = embedder.fit(tracks_df)
    assert fit_metrics['coverage_ratio'] > 0.8
    
    embeddings = embedder.transform(tracks_df.head(5))
    assert len(embeddings) == 5
    assert embeddings[0].embedding.shape[0] == 32
    
    print("✓ Content embedder working")


def test_feature_registry():
    """Test feature registry functionality"""
    print("Testing feature registry...")
    
    with tempfile.TemporaryDirectory() as temp_dir:
        registry = FeatureRegistry(temp_dir)
        
        # Create test feature group
        feature_group = FeatureGroup(
            name="test_features",
            description="Test feature group",
            entity="user",
            features=[
                FeatureSchema("feature1", "float", "Test feature 1"),
                FeatureSchema("feature2", "int", "Test feature 2")
            ]
        )
        
        # Register feature group
        success = registry.register_feature_group(feature_group)
        assert success
        
        # Retrieve feature group
        retrieved = registry.get_feature_group("test_features")
        assert retrieved is not None
        assert retrieved.name == "test_features"
        assert len(retrieved.features) == 2
        
        # Search features
        results = registry.search_features("test")
        assert "test_features" in results['feature_groups']
        
        print("✓ Feature registry working")


async def test_feature_serving():
    """Test feature serving functionality"""
    print("Testing feature serving...")
    
    feature_store = FeatureStore()
    
    # Test feature request
    request = FeatureRequest(
        entity_id="test_user",
        entity_type="user",
        feature_names=["user_engagement.play_count_7d", "nonexistent.feature"]
    )
    
    response = await feature_store.get_features(request)
    
    assert response.entity_id == "test_user"
    assert response.entity_type == "user"
    assert isinstance(response.features, dict)
    assert response.retrieval_time_ms > 0
    
    # Test batch requests
    batch_requests = [
        FeatureRequest("user1", "user", ["user_engagement.play_count_7d"]),
        FeatureRequest("track1", "item", ["item_audio.tempo"])
    ]
    
    batch_responses = await feature_store.get_features_batch(batch_requests)
    assert len(batch_responses) == 2
    
    print("✓ Feature serving working")


def test_hybrid_blending():
    """Test hybrid recommendation blending"""
    print("Testing hybrid blending...")
    
    # Create synthetic CF candidates
    cf_candidates = []
    for i in range(10):
        candidate = RecommendationCandidate(
            item_id=f'track_{i}',
            cf_score=np.random.uniform(0.1, 1.0),
            artist_id=f'artist_{i % 3}',  # 3 artists
            genre='pop' if i % 2 == 0 else 'rock',
            release_date='2023-01-01' if i < 5 else '2024-01-01',
            features={'tempo': 120 + i, 'danceability': 0.5 + i * 0.05}
        )
        cf_candidates.append(candidate)
    
    # Create synthetic content candidates
    content_candidates = []
    for i in range(15):
        candidate = RecommendationCandidate(
            item_id=f'track_{i}',
            content_score=np.random.uniform(0.2, 0.9),
            artist_id=f'artist_{i % 4}',  # 4 artists
            genre='jazz' if i % 3 == 0 else 'electronic',
            release_date='2023-06-01',
            features={'tempo': 100 + i * 2, 'danceability': 0.3 + i * 0.03}
        )
        content_candidates.append(candidate)
    
    # Set feature flag
    os.environ['ENABLE_HYBRID_RECO'] = 'true'
    
    config = HybridConfig(blend_alpha=0.7, diversity_weight=0.3, recency_weight=0.2)
    pipeline = HybridRecommendationPipeline(config)
    
    # Test end-to-end recommendation
    recommendations, metrics = pipeline.recommend(
        user_id="test_user",
        cf_candidates=cf_candidates,
        content_candidates=content_candidates,
        n_recommendations=10
    )
    
    assert len(recommendations) <= 10
    assert metrics.latency_ms < 120  # Performance budget
    assert metrics.candidates_processed > 0
    assert metrics.final_recommendations == len(recommendations)
    
    # Test diversity constraints
    artist_counts = {}
    for rec in recommendations:
        artist_counts[rec.artist_id] = artist_counts.get(rec.artist_id, 0) + 1
    
    max_artist_ratio = max(artist_counts.values()) / len(recommendations)
    assert max_artist_ratio <= config.max_artist_ratio
    
    print("✓ Hybrid blending working")


def test_trending_detection():
    """Test trending detection job"""
    print("Testing trending detection...")
    
    # Set feature flag
    os.environ['ENABLE_TRENDING_DETECTION'] = 'true'
    
    config = TrendingConfig(
        baseline_window_hours=168,  # 7 days
        recent_window_hours=24,     # 1 day
        z_score_threshold=1.5,      # Lower threshold for testing
        max_trending_items=20
    )
    
    detector = TrendingDetectorJob(config)
    
    # Run trending detection
    end_time = datetime.now(timezone.utc)
    trending_items, metrics = detector.run_trending_detection(end_time)
    
    assert metrics.job_duration_seconds < 300  # Performance budget (5 min)
    assert metrics.items_candidate_count > 0
    assert len(trending_items) <= config.max_trending_items
    
    # Verify trending items have required fields
    for item in trending_items:
        assert item.item_id is not None
        assert item.z_score >= config.z_score_threshold
        assert item.velocity > 0  # Only positive trending
        assert item.confidence >= 0 and item.confidence <= 1
    
    # Test API response format
    api_response = detector.get_trending_api_response(trending_items)
    assert 'trending_items' in api_response
    assert 'metadata' in api_response
    assert api_response['metadata']['total_count'] == len(trending_items)
    
    print("✓ Trending detection working")


def test_experiment_evaluation():
    """Test experiment evaluation and guardrails"""
    print("Testing experiment evaluation...")
    
    # Set feature flag
    os.environ['ENABLE_EXPERIMENT_EVALUATION'] = 'true'
    
    evaluator = ExperimentEvaluationEngine()
    
    # Test metric registration
    custom_metric = MetricDefinition(
        name="custom_metric",
        metric_type=MetricType.ENGAGEMENT,
        description="Custom test metric",
        min_sample_size=10
    )
    evaluator.register_metric(custom_metric)
    
    # Test guardrail registration
    custom_guardrail = GuardrailDefinition(
        name="custom_guardrail",
        metric_name="custom_metric",
        guardrail_type=GuardrailType.THRESHOLD,
        threshold=0.5,
        severity="warning"
    )
    evaluator.register_guardrail(custom_guardrail)
    
    # Run evaluation
    start_time = datetime.now(timezone.utc) - timedelta(days=1)
    end_time = datetime.now(timezone.utc)
    
    evaluation = evaluator.evaluate_experiment(
        experiment_id="test_experiment",
        start_time=start_time,
        end_time=end_time
    )
    
    assert evaluation.experiment_id == "test_experiment"
    assert evaluation.duration_seconds < 600  # Performance budget (10 min)
    assert len(evaluation.metrics) > 0
    assert len(evaluation.recommendations) > 0
    
    # Check for expected metrics
    metric_names = {m.metric_name for m in evaluation.metrics}
    expected_metrics = {'ctr', 'latency_p95', 'diversity_score', 'engagement_rate'}
    assert expected_metrics.issubset(metric_names)
    
    # Test statistical tests
    assert len(evaluation.statistical_tests) > 0
    for metric_name, test_result in evaluation.statistical_tests.items():
        assert 'treatment_value' in test_result
        assert 'control_value' in test_result
        assert 'effect_size' in test_result
        assert 'statistically_significant' in test_result
    
    print("✓ Experiment evaluation working")


def test_performance_budgets():
    """Test that components meet performance budgets"""
    print("Testing performance budgets...")
    
    # Test event enrichment budget (< 50ms per event)
    engine = EnrichmentEngine()
    
    import time
    start_time = time.time()
    
    for i in range(10):
        raw_event = RawEvent(
            user_id=f"user_{i}",
            item_id=f"track_{i}",
            event_type="play",
            timestamp="2024-01-01T00:00:00Z",
            raw_data={'user_agent': 'test'}
        )
        engine.enrich_event(raw_event)
    
    avg_time_ms = ((time.time() - start_time) / 10) * 1000
    assert avg_time_ms < 50, f"Event enrichment too slow: {avg_time_ms:.2f}ms"
    
    print(f"✓ Event enrichment performance: {avg_time_ms:.2f}ms < 50ms budget")


async def run_all_tests():
    """Run all tests"""
    print("=" * 60)
    print("Phase 2.1 Foundation Tests")
    print("=" * 60)
    
    try:
        # FBK workstream tests
        test_event_enrichment()
        test_dlq_handling() 
        await test_event_gateway()
        
        # CF workstream tests
        test_collaborative_filtering()
        
        # EMB workstream tests
        test_content_embedder()
        
        # FST workstream tests
        test_feature_registry()
        await test_feature_serving()
        
        # HYB workstream tests
        test_hybrid_blending()
        
        # TRD workstream tests
        test_trending_detection()
        
        # EXP workstream tests
        test_experiment_evaluation()
        
        # Performance tests
        test_performance_budgets()
        
        print("=" * 60)
        print("✅ ALL TESTS PASSED")
        print("=" * 60)
        print("\nPhase 2.1 Foundation + Week 3-4 Core Models completed!")
        print("\nImplemented workstreams:")
        print("✓ FBK - Event enrichment & DLQ handling")
        print("✓ CF - Collaborative filtering trainer") 
        print("✓ EMB - Content feature embedder")
        print("✓ FST - Feature store partial implementation")
        print("✓ HYB - Hybrid blending & diversity re-ranking")
        print("✓ TRD - Trending detection job")
        print("✓ EXP - Multi-metric evaluation & guardrails")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    # Run tests
    success = asyncio.run(run_all_tests())
    
    if not success:
        sys.exit(1)
    
    print("\nNext steps:")
    print("1. Week 5-6 Advanced Features: PWA push notifications & background sync")
    print("2. Enhanced guardrail enforcement with auto-disable capabilities") 
    print("3. Advanced diversity algorithms and seasonal trending adjustments")
    print("4. UI/UX overhaul and modern frontend interfaces")