"""
Trending Detector Job

Identifies items with velocity (recent engagement delta) using statistical analysis.
Provides trending list for downstream modules with exponential smoothing.

Part of TRD workstream - Phase 2.1 Core Models
"""

import os
import json
import logging
import time
import math
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Tuple, Optional
from dataclasses import dataclass, asdict
from collections import defaultdict
import numpy as np
import pandas as pd
from scipy import stats

logger = logging.getLogger(__name__)


@dataclass
class TrendingConfig:
    """Configuration for trending detection job"""
    baseline_window_hours: int = 168  # 7 days baseline window
    recent_window_hours: int = 24  # Recent activity window  
    min_baseline_events: int = 10  # Minimum events needed for baseline
    min_recent_events: int = 5  # Minimum recent events to consider trending
    z_score_threshold: float = 2.0  # Z-score threshold for trending detection
    smoothing_alpha: float = 0.3  # Exponential smoothing factor
    max_trending_items: int = 100  # Maximum trending items to output
    category_limits: Dict[str, int] = None  # Per-category limits
    enable_seasonal_adjustment: bool = True  # Enable seasonal baseline adjustment


@dataclass
class TrendingItem:
    """Single trending item with metrics"""
    item_id: str
    z_score: float
    velocity: float  # Recent events per hour vs baseline
    baseline_rate: float  # Events per hour in baseline period
    recent_rate: float  # Events per hour in recent period
    total_recent_events: int
    category: Optional[str] = None
    confidence: float = 0.0  # Confidence score based on sample size
    smoothed_score: float = 0.0  # Exponentially smoothed trending score


@dataclass
class TrendingMetrics:
    """Metrics for trending detection job"""
    job_duration_seconds: float
    items_candidate_count: int  # Items with sufficient baseline data
    items_recent_count: int  # Items with recent activity
    items_final_count: int  # Final trending items
    false_positive_estimate: float  # Estimated false positive rate
    categories_processed: int


class TrendingDetectorJob:
    """Background job for detecting trending items"""
    
    def __init__(self, config: TrendingConfig = None):
        self.config = config or TrendingConfig()
        if self.config.category_limits is None:
            self.config.category_limits = {
                'music': 50,
                'podcast': 20,
                'audiobook': 10,
                'other': 20
            }
        
        self.metrics = TrendingMetrics(
            job_duration_seconds=0.0,
            items_candidate_count=0,
            items_recent_count=0,
            items_final_count=0,
            false_positive_estimate=0.0,
            categories_processed=0
        )
        
        # Feature flag check
        self.enabled = os.getenv('ENABLE_TRENDING_DETECTION', 'false').lower() == 'true'
        if not self.enabled:
            logger.info("Trending detection disabled by feature flag")

    def load_engagement_data(
        self, 
        start_time: datetime,
        end_time: datetime
    ) -> pd.DataFrame:
        """
        Load engagement events from data source
        
        Args:
            start_time: Start of data window
            end_time: End of data window
            
        Returns:
            DataFrame with columns: item_id, timestamp, event_type, category
        """
        # In production, this would connect to the actual event store
        # For now, generate synthetic data for testing
        
        if not self.enabled:
            return pd.DataFrame(columns=['item_id', 'timestamp', 'event_type', 'category'])
        
        try:
            # Synthetic data generation for testing
            np.random.seed(42)
            events = []
            
            # Generate baseline events
            current_time = start_time
            item_ids = [f'track_{i}' for i in range(1000)]
            categories = ['music', 'podcast', 'audiobook', 'other']
            
            while current_time < end_time:
                # Normal baseline activity
                for item_id in np.random.choice(item_ids, size=np.random.randint(5, 50)):
                    events.append({
                        'item_id': item_id,
                        'timestamp': current_time,
                        'event_type': np.random.choice(['play', 'like', 'share']),
                        'category': np.random.choice(categories)
                    })
                
                # Add some trending items (last 24 hours)
                if (end_time - current_time).total_seconds() < 24 * 3600:
                    trending_items = ['track_1', 'track_5', 'track_10']
                    for item_id in trending_items:
                        # Generate 3x more events for trending items
                        for _ in range(np.random.randint(15, 30)):
                            events.append({
                                'item_id': item_id,
                                'timestamp': current_time,
                                'event_type': np.random.choice(['play', 'like', 'share']),
                                'category': 'music'
                            })
                
                current_time += timedelta(hours=1)
            
            df = pd.DataFrame(events)
            if not df.empty:
                df['timestamp'] = pd.to_datetime(df['timestamp'])
            
            logger.info(f"Loaded {len(df)} engagement events for trending analysis")
            return df
            
        except Exception as e:
            logger.error(f"Failed to load engagement data: {e}")
            return pd.DataFrame(columns=['item_id', 'timestamp', 'event_type', 'category'])

    def calculate_baseline_stats(
        self, 
        data: pd.DataFrame,
        baseline_start: datetime,
        baseline_end: datetime
    ) -> Dict[str, Dict[str, float]]:
        """
        Calculate baseline statistics for each item
        
        Args:
            data: Engagement events DataFrame
            baseline_start: Start of baseline window
            baseline_end: End of baseline window
            
        Returns:
            Dict mapping item_id to baseline stats
        """
        baseline_data = data[
            (data['timestamp'] >= baseline_start) & 
            (data['timestamp'] < baseline_end)
        ]
        
        if baseline_data.empty:
            return {}
        
        # Calculate hourly event rates for baseline period
        baseline_hours = (baseline_end - baseline_start).total_seconds() / 3600
        baseline_stats = {}
        
        for item_id, item_events in baseline_data.groupby('item_id'):
            event_count = len(item_events)
            
            if event_count >= self.config.min_baseline_events:
                hourly_rate = event_count / baseline_hours
                
                # Calculate variance for z-score computation
                # Group by hour and count events per hour
                hourly_counts = (
                    item_events.set_index('timestamp')
                    .resample('1H')
                    .size()
                    .fillna(0)
                )
                
                baseline_stats[item_id] = {
                    'hourly_rate': hourly_rate,
                    'total_events': event_count,
                    'hourly_variance': hourly_counts.var(),
                    'hourly_std': hourly_counts.std(),
                    'category': item_events['category'].iloc[0]
                }
        
        return baseline_stats

    def calculate_recent_stats(
        self,
        data: pd.DataFrame,
        recent_start: datetime,
        recent_end: datetime
    ) -> Dict[str, Dict[str, float]]:
        """
        Calculate recent activity statistics
        
        Args:
            data: Engagement events DataFrame
            recent_start: Start of recent window
            recent_end: End of recent window
            
        Returns:
            Dict mapping item_id to recent stats
        """
        recent_data = data[
            (data['timestamp'] >= recent_start) &
            (data['timestamp'] < recent_end)
        ]
        
        if recent_data.empty:
            return {}
        
        recent_hours = (recent_end - recent_start).total_seconds() / 3600
        recent_stats = {}
        
        for item_id, item_events in recent_data.groupby('item_id'):
            event_count = len(item_events)
            
            if event_count >= self.config.min_recent_events:
                hourly_rate = event_count / recent_hours
                
                recent_stats[item_id] = {
                    'hourly_rate': hourly_rate,
                    'total_events': event_count,
                    'category': item_events['category'].iloc[0]
                }
        
        return recent_stats

    def detect_trending_items(
        self,
        baseline_stats: Dict[str, Dict[str, float]],
        recent_stats: Dict[str, Dict[str, float]]
    ) -> List[TrendingItem]:
        """
        Detect trending items using z-score analysis
        
        Args:
            baseline_stats: Baseline statistics per item
            recent_stats: Recent statistics per item
            
        Returns:
            List of trending items sorted by z-score
        """
        trending_items = []
        
        # Only consider items with both baseline and recent data
        common_items = set(baseline_stats.keys()) & set(recent_stats.keys())
        
        for item_id in common_items:
            baseline = baseline_stats[item_id]
            recent = recent_stats[item_id]
            
            # Calculate z-score for velocity change
            baseline_rate = baseline['hourly_rate']
            recent_rate = recent['hourly_rate']
            baseline_std = baseline['hourly_std']
            
            if baseline_std > 0:
                # Z-score based on rate difference
                velocity = (recent_rate - baseline_rate) / baseline_rate if baseline_rate > 0 else 0
                z_score = (recent_rate - baseline_rate) / baseline_std
                
                # Only consider positive trending (recent > baseline)
                if z_score >= self.config.z_score_threshold and velocity > 0:
                    # Calculate confidence based on sample size
                    confidence = min(
                        1.0,
                        (baseline['total_events'] + recent['total_events']) / 100.0
                    )
                    
                    trending_item = TrendingItem(
                        item_id=item_id,
                        z_score=z_score,
                        velocity=velocity,
                        baseline_rate=baseline_rate,
                        recent_rate=recent_rate,
                        total_recent_events=recent['total_events'],
                        category=recent['category'],
                        confidence=confidence
                    )
                    
                    trending_items.append(trending_item)
        
        # Sort by z-score descending
        trending_items.sort(key=lambda x: x.z_score, reverse=True)
        
        return trending_items

    def apply_exponential_smoothing(
        self,
        trending_items: List[TrendingItem],
        previous_scores: Dict[str, float] = None
    ) -> List[TrendingItem]:
        """
        Apply exponential smoothing to trending scores
        
        Args:
            trending_items: Current trending items
            previous_scores: Previous smoothed scores (for continuity)
            
        Returns:
            Trending items with smoothed scores
        """
        if previous_scores is None:
            previous_scores = {}
        
        alpha = self.config.smoothing_alpha
        
        for item in trending_items:
            current_score = item.z_score
            previous_score = previous_scores.get(item.item_id, current_score)
            
            # Exponential smoothing: S_t = α * X_t + (1-α) * S_{t-1}
            smoothed_score = alpha * current_score + (1 - alpha) * previous_score
            item.smoothed_score = smoothed_score
        
        # Re-sort by smoothed score
        trending_items.sort(key=lambda x: x.smoothed_score, reverse=True)
        
        return trending_items

    def apply_category_limits(
        self,
        trending_items: List[TrendingItem]
    ) -> List[TrendingItem]:
        """
        Apply per-category limits to ensure diversity
        
        Args:
            trending_items: Sorted trending items
            
        Returns:
            Filtered trending items respecting category limits
        """
        category_counts = defaultdict(int)
        filtered_items = []
        
        for item in trending_items:
            category = item.category or 'other'
            limit = self.config.category_limits.get(category, 20)
            
            if category_counts[category] < limit:
                category_counts[category] += 1
                filtered_items.append(item)
                
                # Stop if we hit the global limit
                if len(filtered_items) >= self.config.max_trending_items:
                    break
        
        return filtered_items

    def estimate_false_positive_rate(
        self,
        trending_items: List[TrendingItem]
    ) -> float:
        """
        Estimate false positive rate based on z-score distribution
        
        Args:
            trending_items: Detected trending items
            
        Returns:
            Estimated false positive rate
        """
        if not trending_items:
            return 0.0
        
        # For z-score threshold, expected false positive rate
        # P(Z > threshold) for standard normal distribution
        threshold = self.config.z_score_threshold
        expected_fp_rate = 1 - stats.norm.cdf(threshold)
        
        # Adjust based on multiple testing (Bonferroni-like correction)
        num_tests = len(trending_items)
        adjusted_fp_rate = min(1.0, expected_fp_rate * num_tests)
        
        return adjusted_fp_rate

    def run_trending_detection(
        self,
        end_time: Optional[datetime] = None
    ) -> Tuple[List[TrendingItem], TrendingMetrics]:
        """
        Main trending detection job execution
        
        Args:
            end_time: End time for analysis window (defaults to now)
            
        Returns:
            Tuple of (trending items, job metrics)
        """
        start_time = time.time()
        
        if not self.enabled:
            logger.info("Trending detection disabled by feature flag")
            return [], self.metrics
        
        try:
            # Set up time windows
            if end_time is None:
                end_time = datetime.now(timezone.utc)
            
            recent_start = end_time - timedelta(hours=self.config.recent_window_hours)
            baseline_end = recent_start
            baseline_start = baseline_end - timedelta(hours=self.config.baseline_window_hours)
            
            logger.info(f"Trending detection: baseline {baseline_start} to {baseline_end}")
            logger.info(f"Trending detection: recent {recent_start} to {end_time}")
            
            # Load engagement data
            data_start = baseline_start
            data_end = end_time
            engagement_data = self.load_engagement_data(data_start, data_end)
            
            if engagement_data.empty:
                logger.warning("No engagement data loaded for trending detection")
                return [], self.metrics
            
            # Calculate baseline and recent statistics
            baseline_stats = self.calculate_baseline_stats(
                engagement_data, baseline_start, baseline_end
            )
            recent_stats = self.calculate_recent_stats(
                engagement_data, recent_start, end_time
            )
            
            # Update metrics
            self.metrics.items_candidate_count = len(baseline_stats)
            self.metrics.items_recent_count = len(recent_stats)
            
            # Detect trending items
            trending_items = self.detect_trending_items(baseline_stats, recent_stats)
            
            # Apply exponential smoothing (would load previous scores in production)
            trending_items = self.apply_exponential_smoothing(trending_items)
            
            # Apply category limits for diversity
            final_trending_items = self.apply_category_limits(trending_items)
            
            # Update final metrics
            self.metrics.items_final_count = len(final_trending_items)
            self.metrics.false_positive_estimate = self.estimate_false_positive_rate(final_trending_items)
            self.metrics.categories_processed = len(set(item.category for item in final_trending_items if item.category))
            self.metrics.job_duration_seconds = time.time() - start_time
            
            # Validate performance budget (< 5 min target)
            if self.metrics.job_duration_seconds > 300:
                logger.warning(
                    f"Trending detection exceeded time budget: {self.metrics.job_duration_seconds:.2f}s > 300s"
                )
            
            logger.info(
                f"Trending detection completed: {len(final_trending_items)} trending items "
                f"in {self.metrics.job_duration_seconds:.2f}s"
            )
            
            return final_trending_items, self.metrics
            
        except Exception as e:
            logger.error(f"Trending detection job failed: {e}")
            self.metrics.job_duration_seconds = time.time() - start_time
            return [], self.metrics

    def save_trending_results(
        self,
        trending_items: List[TrendingItem],
        output_path: str = "trending_results.json"
    ) -> bool:
        """
        Save trending detection results to file
        
        Args:
            trending_items: Trending items to save
            output_path: Output file path
            
        Returns:
            Success status
        """
        try:
            results = {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'config': asdict(self.config),
                'metrics': asdict(self.metrics),
                'trending_items': [asdict(item) for item in trending_items]
            }
            
            with open(output_path, 'w') as f:
                json.dump(results, f, indent=2)
            
            logger.info(f"Saved trending results to {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to save trending results: {e}")
            return False

    def get_trending_api_response(
        self,
        trending_items: List[TrendingItem]
    ) -> Dict[str, Any]:
        """
        Format trending items for API response
        
        Args:
            trending_items: Trending items to format
            
        Returns:
            API response dictionary
        """
        return {
            'trending_items': [
                {
                    'item_id': item.item_id,
                    'trending_score': round(item.smoothed_score, 4),
                    'velocity': round(item.velocity, 4),
                    'category': item.category,
                    'confidence': round(item.confidence, 4)
                }
                for item in trending_items
            ],
            'metadata': {
                'total_count': len(trending_items),
                'job_duration_ms': round(self.metrics.job_duration_seconds * 1000, 2),
                'candidates_processed': self.metrics.items_candidate_count,
                'categories': list(set(item.category for item in trending_items if item.category))
            }
        }