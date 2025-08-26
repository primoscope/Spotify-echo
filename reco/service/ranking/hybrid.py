"""
Production Hybrid Blending & Diversity/Recency Re-Ranking

Implements tunable hybrid pipeline combining collaborative filtering and content-based signals
with diversity and recency re-ranking capabilities.

Part of HYB workstream - Phase 2.1 Core Models
"""

import os
import json
import logging
import time
import math
from typing import Dict, Any, List, Tuple, Optional, Union
from dataclasses import dataclass, asdict
from collections import defaultdict
import numpy as np

logger = logging.getLogger(__name__)


@dataclass 
class HybridConfig:
    """Configuration for hybrid recommendation blending"""
    blend_alpha: float = 0.6  # Weight for collaborative filtering vs content (0=content only, 1=CF only)
    diversity_weight: float = 0.2  # Weight for diversity penalty (0=no diversity, 1=max diversity)
    recency_weight: float = 0.1  # Weight for recency boost (0=no recency, 1=max recency)
    max_artist_ratio: float = 0.3  # Maximum fraction of recs from single artist
    recency_decay_days: float = 30.0  # Half-life for recency decay in days
    min_diversity_threshold: float = 0.5  # Minimum diversity score threshold
    enable_mmr: bool = True  # Enable Maximum Marginal Relevance algorithm
    mmr_lambda: float = 0.7  # Balance between relevance and diversity in MMR (0=diversity only, 1=relevance only)


@dataclass
class RecommendationCandidate:
    """Single recommendation candidate with signals"""
    item_id: str
    cf_score: float = 0.0
    content_score: float = 0.0
    hybrid_score: float = 0.0
    final_score: float = 0.0
    artist_id: Optional[str] = None
    genre: Optional[str] = None
    release_date: Optional[str] = None
    features: Optional[Dict[str, Any]] = None


@dataclass
class DiversityMetrics:
    """Diversity metrics for recommendation list"""
    artist_diversity: float  # Inverse Simpson index for artists
    genre_diversity: float  # Inverse Simpson index for genres
    max_artist_ratio: float  # Maximum ratio of single artist
    total_artists: int
    total_genres: int


@dataclass
class HybridMetrics:
    """Metrics for hybrid pipeline performance"""
    blend_ratio_actual: float  # Actual CF vs content ratio used
    diversity_score: float  # Overall diversity score
    recency_boost_applied: int  # Number of items that got recency boost
    latency_ms: float  # Pipeline latency in milliseconds
    candidates_processed: int
    final_recommendations: int


class HybridRecommendationPipeline:
    """Production hybrid recommendation pipeline with re-ranking"""
    
    def __init__(self, config: HybridConfig = None):
        self.config = config or HybridConfig()
        self.metrics = HybridMetrics(
            blend_ratio_actual=0.0,
            diversity_score=0.0, 
            recency_boost_applied=0,
            latency_ms=0.0,
            candidates_processed=0,
            final_recommendations=0
        )
        
        # Feature flag check
        self.enabled = os.getenv('ENABLE_HYBRID_RECO', 'false').lower() == 'true'
        if not self.enabled:
            logger.info("Hybrid recommendations disabled by feature flag")

    def blend_scores(
        self, 
        cf_candidates: List[RecommendationCandidate],
        content_candidates: List[RecommendationCandidate],
        user_id: str
    ) -> List[RecommendationCandidate]:
        """
        Blend collaborative filtering and content-based recommendations
        
        Args:
            cf_candidates: Candidates from collaborative filtering
            content_candidates: Candidates from content-based filtering  
            user_id: User ID for personalization
            
        Returns:
            Blended candidates with hybrid scores
        """
        start_time = time.time()
        
        if not self.enabled:
            logger.warning("Hybrid blending disabled, returning CF candidates only")
            return cf_candidates[:20]  # Return top 20 CF candidates
        
        # Create lookup for efficient merging
        cf_lookup = {c.item_id: c for c in cf_candidates}
        content_lookup = {c.item_id: c for c in content_candidates}
        
        # Get all unique items
        all_items = set(cf_lookup.keys()) | set(content_lookup.keys())
        
        blended_candidates = []
        
        for item_id in all_items:
            cf_candidate = cf_lookup.get(item_id)
            content_candidate = content_lookup.get(item_id)
            
            # Get scores (default to 0 if candidate not present in one system)
            cf_score = cf_candidate.cf_score if cf_candidate else 0.0
            content_score = content_candidate.content_score if content_candidate else 0.0
            
            # Normalize scores to [0,1] range for blending
            cf_score_norm = self._normalize_score(cf_score, cf_candidates, 'cf_score')
            content_score_norm = self._normalize_score(content_score, content_candidates, 'content_score')
            
            # Compute hybrid score
            hybrid_score = (
                self.config.blend_alpha * cf_score_norm + 
                (1 - self.config.blend_alpha) * content_score_norm
            )
            
            # Create blended candidate
            candidate = RecommendationCandidate(
                item_id=item_id,
                cf_score=cf_score,
                content_score=content_score,
                hybrid_score=hybrid_score,
                final_score=hybrid_score  # Will be updated by re-ranking
            )
            
            # Copy metadata from either candidate (prefer CF for metadata)
            source = cf_candidate or content_candidate
            if source:
                candidate.artist_id = source.artist_id
                candidate.genre = source.genre
                candidate.release_date = source.release_date
                candidate.features = source.features
                
            blended_candidates.append(candidate)
        
        # Sort by hybrid score
        blended_candidates.sort(key=lambda x: x.hybrid_score, reverse=True)
        
        # Update metrics
        self.metrics.candidates_processed = len(blended_candidates)
        self.metrics.blend_ratio_actual = self.config.blend_alpha
        self.metrics.latency_ms += (time.time() - start_time) * 1000
        
        return blended_candidates

    def apply_recency_boost(
        self, 
        candidates: List[RecommendationCandidate]
    ) -> List[RecommendationCandidate]:
        """
        Apply recency boost to recently released items
        
        Args:
            candidates: List of recommendation candidates
            
        Returns:
            Candidates with recency boost applied
        """
        if self.config.recency_weight == 0:
            return candidates
            
        boosted_count = 0
        current_date = time.time()
        
        for candidate in candidates:
            if candidate.release_date:
                try:
                    # Parse release date (assuming YYYY-MM-DD format)
                    release_timestamp = time.mktime(
                        time.strptime(candidate.release_date, '%Y-%m-%d')
                    )
                    
                    # Calculate days since release
                    days_since_release = (current_date - release_timestamp) / (24 * 3600)
                    
                    # Apply exponential decay boost
                    recency_factor = math.exp(-days_since_release / self.config.recency_decay_days)
                    recency_boost = self.config.recency_weight * recency_factor
                    
                    # Apply boost to final score
                    candidate.final_score += recency_boost
                    
                    if recency_boost > 0.01:  # Count significant boosts
                        boosted_count += 1
                        
                except (ValueError, TypeError):
                    # Skip invalid dates
                    continue
        
        self.metrics.recency_boost_applied = boosted_count
        return candidates

    def apply_diversity_reranking(
        self, 
        candidates: List[RecommendationCandidate],
        target_size: int = 20
    ) -> List[RecommendationCandidate]:
        """
        Apply diversity re-ranking using Maximum Marginal Relevance (MMR) algorithm
        
        Args:
            candidates: Sorted candidates by relevance score
            target_size: Target number of recommendations
            
        Returns:
            Diversified recommendation list
        """
        if not self.config.enable_mmr or self.config.diversity_weight == 0:
            # Return top candidates without diversity re-ranking
            return candidates[:target_size]
        
        if len(candidates) <= target_size:
            return candidates
            
        # Initialize result list and remaining candidates
        selected = []
        remaining = candidates.copy()
        
        # Select first item (highest relevance)
        if remaining:
            selected.append(remaining.pop(0))
        
        # Iteratively select remaining items using MMR
        while len(selected) < target_size and remaining:
            best_candidate = None
            best_mmr_score = -float('inf')
            best_index = -1
            
            for i, candidate in enumerate(remaining):
                # Calculate MMR score
                relevance_score = candidate.final_score
                
                # Calculate maximum similarity to already selected items
                max_similarity = 0.0
                for selected_candidate in selected:
                    similarity = self._calculate_similarity(candidate, selected_candidate)
                    max_similarity = max(max_similarity, similarity)
                
                # MMR formula: λ * relevance - (1-λ) * max_similarity
                mmr_score = (
                    self.config.mmr_lambda * relevance_score - 
                    (1 - self.config.mmr_lambda) * max_similarity
                )
                
                if mmr_score > best_mmr_score:
                    best_mmr_score = mmr_score
                    best_candidate = candidate
                    best_index = i
            
            # Add best candidate to selection
            if best_candidate:
                selected.append(remaining.pop(best_index))
        
        # Update diversity metrics
        diversity_metrics = self._calculate_diversity_metrics(selected)
        self.metrics.diversity_score = (
            diversity_metrics.artist_diversity + diversity_metrics.genre_diversity
        ) / 2.0
        
        return selected

    def recommend(
        self,
        user_id: str,
        cf_candidates: List[RecommendationCandidate],
        content_candidates: List[RecommendationCandidate],
        n_recommendations: int = 20
    ) -> Tuple[List[RecommendationCandidate], HybridMetrics]:
        """
        End-to-end hybrid recommendation pipeline
        
        Args:
            user_id: User ID for personalization
            cf_candidates: Collaborative filtering candidates  
            content_candidates: Content-based candidates
            n_recommendations: Number of final recommendations
            
        Returns:
            Tuple of (final recommendations, metrics)
        """
        start_time = time.time()
        
        try:
            # Step 1: Blend CF and content scores
            blended = self.blend_scores(cf_candidates, content_candidates, user_id)
            
            # Step 2: Apply recency boost
            recency_boosted = self.apply_recency_boost(blended)
            
            # Step 3: Sort by final score after recency boost
            recency_boosted.sort(key=lambda x: x.final_score, reverse=True)
            
            # Step 4: Apply diversity re-ranking
            final_recommendations = self.apply_diversity_reranking(
                recency_boosted, n_recommendations
            )
            
            # Step 5: Enforce artist diversity constraints
            constrained_recommendations = self._enforce_artist_constraints(
                final_recommendations
            )
            
            # Update final metrics
            self.metrics.final_recommendations = len(constrained_recommendations)
            self.metrics.latency_ms = (time.time() - start_time) * 1000
            
            # Validate performance budget (< 120ms target)
            if self.metrics.latency_ms > 120:
                logger.warning(
                    f"Hybrid pipeline exceeded latency budget: {self.metrics.latency_ms:.2f}ms > 120ms"
                )
            
            return constrained_recommendations, self.metrics
            
        except Exception as e:
            logger.error(f"Hybrid recommendation pipeline failed: {e}")
            # Fallback to CF candidates only
            fallback = cf_candidates[:n_recommendations]
            self.metrics.latency_ms = (time.time() - start_time) * 1000
            return fallback, self.metrics

    def _normalize_score(
        self, 
        score: float, 
        candidates: List[RecommendationCandidate], 
        score_field: str
    ) -> float:
        """Normalize score to [0,1] range using min-max normalization"""
        if not candidates:
            return 0.0
            
        scores = [getattr(c, score_field) for c in candidates if hasattr(c, score_field)]
        if not scores:
            return 0.0
            
        min_score = min(scores)
        max_score = max(scores)
        
        if max_score == min_score:
            return 1.0  # All scores are the same
            
        return (score - min_score) / (max_score - min_score)

    def _calculate_similarity(
        self, 
        candidate1: RecommendationCandidate, 
        candidate2: RecommendationCandidate
    ) -> float:
        """Calculate similarity between two candidates for diversity calculation"""
        similarity = 0.0
        
        # Artist similarity (high weight)
        if candidate1.artist_id and candidate2.artist_id:
            if candidate1.artist_id == candidate2.artist_id:
                similarity += 0.6  # Strong similarity for same artist
        
        # Genre similarity (medium weight)  
        if candidate1.genre and candidate2.genre:
            if candidate1.genre == candidate2.genre:
                similarity += 0.3  # Medium similarity for same genre
        
        # Feature similarity (low weight)
        if candidate1.features and candidate2.features:
            feature_sim = self._calculate_feature_similarity(
                candidate1.features, candidate2.features
            )
            similarity += 0.1 * feature_sim
        
        return min(similarity, 1.0)  # Cap at 1.0

    def _calculate_feature_similarity(
        self, 
        features1: Dict[str, Any], 
        features2: Dict[str, Any]
    ) -> float:
        """Calculate similarity between audio features"""
        try:
            # Simple cosine similarity for numeric features
            numeric_features = ['tempo', 'danceability', 'energy', 'valence']
            
            vec1 = []
            vec2 = []
            
            for feature in numeric_features:
                if feature in features1 and feature in features2:
                    vec1.append(float(features1[feature]))
                    vec2.append(float(features2[feature]))
            
            if len(vec1) < 2:
                return 0.0
                
            # Cosine similarity
            dot_product = sum(a * b for a, b in zip(vec1, vec2))
            norm1 = math.sqrt(sum(a * a for a in vec1))
            norm2 = math.sqrt(sum(b * b for b in vec2))
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
                
            return dot_product / (norm1 * norm2)
            
        except (KeyError, ValueError, TypeError):
            return 0.0

    def _calculate_diversity_metrics(
        self, 
        recommendations: List[RecommendationCandidate]
    ) -> DiversityMetrics:
        """Calculate diversity metrics for recommendation list"""
        if not recommendations:
            return DiversityMetrics(0.0, 0.0, 0.0, 0, 0)
        
        # Count artists and genres
        artist_counts = defaultdict(int)
        genre_counts = defaultdict(int)
        
        for rec in recommendations:
            if rec.artist_id:
                artist_counts[rec.artist_id] += 1
            if rec.genre:
                genre_counts[rec.genre] += 1
        
        # Calculate inverse Simpson index (higher = more diverse)
        def inverse_simpson_index(counts: Dict[str, int]) -> float:
            if not counts:
                return 0.0
            total = sum(counts.values())
            simpson = sum((count / total) ** 2 for count in counts.values())
            return 1 / simpson if simpson > 0 else 0.0
        
        artist_diversity = inverse_simpson_index(artist_counts)
        genre_diversity = inverse_simpson_index(genre_counts)
        
        # Calculate maximum artist ratio
        max_artist_count = max(artist_counts.values()) if artist_counts else 0
        max_artist_ratio = max_artist_count / len(recommendations)
        
        return DiversityMetrics(
            artist_diversity=artist_diversity,
            genre_diversity=genre_diversity,
            max_artist_ratio=max_artist_ratio,
            total_artists=len(artist_counts),
            total_genres=len(genre_counts)
        )

    def _enforce_artist_constraints(
        self, 
        recommendations: List[RecommendationCandidate]
    ) -> List[RecommendationCandidate]:
        """Enforce maximum artist ratio constraints"""
        if not recommendations:
            return recommendations
            
        max_allowed = int(len(recommendations) * self.config.max_artist_ratio)
        artist_counts = defaultdict(int)
        filtered_recommendations = []
        
        for rec in recommendations:
            artist_id = rec.artist_id or "unknown"
            
            if artist_counts[artist_id] < max_allowed:
                artist_counts[artist_id] += 1
                filtered_recommendations.append(rec)
        
        return filtered_recommendations

    def get_config(self) -> Dict[str, Any]:
        """Get current configuration as dictionary"""
        return asdict(self.config)
    
    def update_config(self, **kwargs) -> None:
        """Update configuration parameters"""
        for key, value in kwargs.items():
            if hasattr(self.config, key):
                setattr(self.config, key, value)
                logger.info(f"Updated hybrid config {key} = {value}")
            else:
                logger.warning(f"Unknown config parameter: {key}")