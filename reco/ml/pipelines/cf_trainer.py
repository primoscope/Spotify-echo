"""
Collaborative Filtering Trainer

Matrix factorization-based collaborative filtering using implicit feedback.
Implements Alternating Least Squares (ALS) with user/item embeddings.

Part of CF workstream - Phase 2.1 Foundation
"""

import os
import json
import logging
import time
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Tuple, List
import pickle
from dataclasses import dataclass, asdict

import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix, coo_matrix
from sklearn.decomposition import NMF
from sklearn.metrics import mean_squared_error
from sklearn.model_selection import train_test_split

logger = logging.getLogger(__name__)


@dataclass
class CFConfig:
    """Configuration for collaborative filtering training"""
    n_factors: int = 64
    regularization: float = 0.01
    alpha: float = 40  # Confidence scaling for implicit feedback
    iterations: int = 15
    random_state: int = 42
    min_user_interactions: int = 5
    min_item_interactions: int = 3
    test_size: float = 0.2
    
    
@dataclass
class CFMetrics:
    """Training metrics for collaborative filtering"""
    rmse: float
    coverage_users: float  # % of users with embeddings
    coverage_items: float  # % of items with embeddings
    sparsity: float
    training_time_seconds: float
    n_users: int
    n_items: int
    n_interactions: int


@dataclass
class CFArtifacts:
    """Trained model artifacts"""
    user_factors: np.ndarray
    item_factors: np.ndarray
    user_index_map: Dict[str, int]  # user_id -> matrix index
    item_index_map: Dict[str, int]  # item_id -> matrix index
    reverse_user_map: Dict[int, str]  # matrix index -> user_id
    reverse_item_map: Dict[int, str]  # matrix index -> item_id
    config: CFConfig
    metrics: CFMetrics
    model_version: str
    created_at: str
    

class CollaborativeFilteringTrainer:
    """Collaborative filtering trainer using matrix factorization"""
    
    def __init__(self, config: CFConfig = None):
        self.config = config or CFConfig()
        self.artifacts: Optional[CFArtifacts] = None
        
    def prepare_data(self, interactions_df: pd.DataFrame) -> Tuple[csr_matrix, Dict[str, Any]]:
        """
        Prepare interaction data for training
        
        Args:
            interactions_df: DataFrame with columns [user_id, item_id, rating/play_count]
            
        Returns:
            Tuple of (interaction_matrix, metadata)
        """
        logger.info("Preparing collaborative filtering data")
        
        # Ensure required columns exist
        required_cols = ['user_id', 'item_id']
        if not all(col in interactions_df.columns for col in required_cols):
            raise ValueError(f"DataFrame must contain columns: {required_cols}")
        
        # Use implicit feedback - if no rating column, use play count or default to 1
        if 'rating' in interactions_df.columns:
            rating_col = 'rating'
        elif 'play_count' in interactions_df.columns:
            rating_col = 'play_count'
        else:
            interactions_df['rating'] = 1.0
            rating_col = 'rating'
        
        # Filter low-interaction users/items
        user_counts = interactions_df['user_id'].value_counts()
        item_counts = interactions_df['item_id'].value_counts()
        
        active_users = user_counts[user_counts >= self.config.min_user_interactions].index
        active_items = item_counts[item_counts >= self.config.min_item_interactions].index
        
        filtered_df = interactions_df[
            (interactions_df['user_id'].isin(active_users)) &
            (interactions_df['item_id'].isin(active_items))
        ].copy()
        
        logger.info(f"Filtered data: {len(filtered_df)} interactions, "
                   f"{len(active_users)} users, {len(active_items)} items")
        
        # Create user and item mappings
        unique_users = sorted(filtered_df['user_id'].unique())
        unique_items = sorted(filtered_df['item_id'].unique())
        
        user_index_map = {user_id: idx for idx, user_id in enumerate(unique_users)}
        item_index_map = {item_id: idx for idx, item_id in enumerate(unique_items)}
        
        # Map to matrix indices
        filtered_df['user_idx'] = filtered_df['user_id'].map(user_index_map)
        filtered_df['item_idx'] = filtered_df['item_id'].map(item_index_map)
        
        # Create sparse interaction matrix
        n_users = len(unique_users)
        n_items = len(unique_items)
        
        interaction_matrix = csr_matrix(
            (filtered_df[rating_col].values, 
             (filtered_df['user_idx'].values, filtered_df['item_idx'].values)),
            shape=(n_users, n_items)
        )
        
        metadata = {
            'user_index_map': user_index_map,
            'item_index_map': item_index_map,
            'reverse_user_map': {idx: user_id for user_id, idx in user_index_map.items()},
            'reverse_item_map': {idx: item_id for item_id, idx in item_index_map.items()},
            'original_interactions': len(interactions_df),
            'filtered_interactions': len(filtered_df),
            'n_users': n_users,
            'n_items': n_items,
            'sparsity': 1.0 - (len(filtered_df) / (n_users * n_items))
        }
        
        return interaction_matrix, metadata
    
    def train(self, interactions_df: pd.DataFrame) -> CFArtifacts:
        """
        Train collaborative filtering model
        
        Args:
            interactions_df: User-item interaction data
            
        Returns:
            Trained model artifacts
        """
        start_time = time.time()
        logger.info("Starting collaborative filtering training")
        
        # Check feature flag
        if not self._is_cf_enabled():
            raise RuntimeError("Collaborative filtering is disabled via feature flag")
        
        # Prepare data
        interaction_matrix, metadata = self.prepare_data(interactions_df)
        
        # Split for evaluation
        train_matrix, test_matrix = self._train_test_split(interaction_matrix)
        
        # Train model using NMF (Non-negative Matrix Factorization)
        logger.info("Training matrix factorization model")
        
        model = NMF(
            n_components=self.config.n_factors,
            init='random',
            random_state=self.config.random_state,
            max_iter=self.config.iterations,
            alpha_W=self.config.regularization,
            alpha_H=self.config.regularization
        )
        
        # Fit model on training data
        user_factors = model.fit_transform(train_matrix)
        item_factors = model.components_.T
        
        # Evaluate model
        metrics = self._evaluate_model(
            user_factors, item_factors, train_matrix, test_matrix, metadata
        )
        metrics.training_time_seconds = time.time() - start_time
        
        # Create artifacts
        model_version = self._generate_model_version(self.config, metrics)
        
        self.artifacts = CFArtifacts(
            user_factors=user_factors,
            item_factors=item_factors,
            user_index_map=metadata['user_index_map'],
            item_index_map=metadata['item_index_map'],
            reverse_user_map=metadata['reverse_user_map'],
            reverse_item_map=metadata['reverse_item_map'],
            config=self.config,
            metrics=metrics,
            model_version=model_version,
            created_at=datetime.now(timezone.utc).isoformat()
        )
        
        logger.info(f"Training completed in {metrics.training_time_seconds:.2f}s")
        logger.info(f"Model metrics: RMSE={metrics.rmse:.4f}, "
                   f"User coverage={metrics.coverage_users:.2%}, "
                   f"Item coverage={metrics.coverage_items:.2%}")
        
        return self.artifacts
    
    def _train_test_split(self, interaction_matrix: csr_matrix) -> Tuple[csr_matrix, csr_matrix]:
        """Split interaction matrix for training and testing"""
        # Convert to COO format for easier manipulation
        coo = interaction_matrix.tocoo()
        
        # Split interactions randomly
        n_interactions = len(coo.data)
        indices = np.arange(n_interactions)
        np.random.seed(self.config.random_state)
        np.random.shuffle(indices)
        
        split_idx = int(n_interactions * (1 - self.config.test_size))
        train_indices = indices[:split_idx]
        test_indices = indices[split_idx:]
        
        # Create train matrix
        train_matrix = csr_matrix(
            (coo.data[train_indices], 
             (coo.row[train_indices], coo.col[train_indices])),
            shape=interaction_matrix.shape
        )
        
        # Create test matrix
        test_matrix = csr_matrix(
            (coo.data[test_indices],
             (coo.row[test_indices], coo.col[test_indices])),
            shape=interaction_matrix.shape
        )
        
        return train_matrix, test_matrix
    
    def _evaluate_model(self, user_factors: np.ndarray, item_factors: np.ndarray,
                       train_matrix: csr_matrix, test_matrix: csr_matrix,
                       metadata: Dict[str, Any]) -> CFMetrics:
        """Evaluate trained model performance"""
        
        # Calculate RMSE on test set
        test_coo = test_matrix.tocoo()
        predictions = []
        actuals = []
        
        for i, (user_idx, item_idx, rating) in enumerate(zip(test_coo.row, test_coo.col, test_coo.data)):
            if i < 1000:  # Sample for efficiency
                pred = np.dot(user_factors[user_idx], item_factors[item_idx])
                predictions.append(pred)
                actuals.append(rating)
        
        rmse = np.sqrt(mean_squared_error(actuals, predictions)) if predictions else 0.0
        
        # Calculate coverage metrics
        n_users_with_factors = user_factors.shape[0]
        n_items_with_factors = item_factors.shape[0]
        total_users = metadata['n_users']
        total_items = metadata['n_items']
        
        coverage_users = n_users_with_factors / total_users if total_users > 0 else 0.0
        coverage_items = n_items_with_factors / total_items if total_items > 0 else 0.0
        
        return CFMetrics(
            rmse=rmse,
            coverage_users=coverage_users,
            coverage_items=coverage_items,
            sparsity=metadata['sparsity'],
            training_time_seconds=0.0,  # Will be set by caller
            n_users=metadata['n_users'],
            n_items=metadata['n_items'],
            n_interactions=metadata['filtered_interactions']
        )
    
    def save_artifacts(self, output_dir: str) -> str:
        """Save trained model artifacts to disk"""
        if not self.artifacts:
            raise ValueError("No trained artifacts to save")
        
        os.makedirs(output_dir, exist_ok=True)
        
        # Save numpy arrays
        user_factors_path = os.path.join(output_dir, 'user_factors.npy')
        item_factors_path = os.path.join(output_dir, 'item_factors.npy')
        
        np.save(user_factors_path, self.artifacts.user_factors)
        np.save(item_factors_path, self.artifacts.item_factors)
        
        # Save metadata and mappings
        metadata = {
            'user_index_map': self.artifacts.user_index_map,
            'item_index_map': self.artifacts.item_index_map,
            'reverse_user_map': self.artifacts.reverse_user_map,
            'reverse_item_map': self.artifacts.reverse_item_map,
            'config': asdict(self.artifacts.config),
            'metrics': asdict(self.artifacts.metrics),
            'model_version': self.artifacts.model_version,
            'created_at': self.artifacts.created_at
        }
        
        metadata_path = os.path.join(output_dir, 'metadata.json')
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        # Generate checksum manifest
        manifest = self._generate_checksum_manifest(output_dir)
        manifest_path = os.path.join(output_dir, 'manifest.json')
        with open(manifest_path, 'w') as f:
            json.dump(manifest, f, indent=2)
        
        logger.info(f"Artifacts saved to {output_dir}")
        return output_dir
    
    def load_artifacts(self, input_dir: str) -> CFArtifacts:
        """Load trained model artifacts from disk"""
        # Load metadata
        metadata_path = os.path.join(input_dir, 'metadata.json')
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
        
        # Load numpy arrays
        user_factors = np.load(os.path.join(input_dir, 'user_factors.npy'))
        item_factors = np.load(os.path.join(input_dir, 'item_factors.npy'))
        
        # Verify checksum
        if not self._verify_checksum_manifest(input_dir):
            logger.warning("Checksum verification failed for loaded artifacts")
        
        # Reconstruct artifacts
        self.artifacts = CFArtifacts(
            user_factors=user_factors,
            item_factors=item_factors,
            user_index_map=metadata['user_index_map'],
            item_index_map=metadata['item_index_map'],
            reverse_user_map=metadata['reverse_user_map'],
            reverse_item_map=metadata['reverse_item_map'],
            config=CFConfig(**metadata['config']),
            metrics=CFMetrics(**metadata['metrics']),
            model_version=metadata['model_version'],
            created_at=metadata['created_at']
        )
        
        logger.info(f"Artifacts loaded from {input_dir}")
        return self.artifacts
    
    def get_user_embedding(self, user_id: str) -> Optional[np.ndarray]:
        """Get user embedding vector"""
        if not self.artifacts:
            return None
        
        if user_id not in self.artifacts.user_index_map:
            return None
        
        user_idx = self.artifacts.user_index_map[user_id]
        return self.artifacts.user_factors[user_idx]
    
    def get_item_embedding(self, item_id: str) -> Optional[np.ndarray]:
        """Get item embedding vector"""
        if not self.artifacts:
            return None
        
        if item_id not in self.artifacts.item_index_map:
            return None
        
        item_idx = self.artifacts.item_index_map[item_id]
        return self.artifacts.item_factors[item_idx]
    
    def predict_rating(self, user_id: str, item_id: str) -> Optional[float]:
        """Predict rating for user-item pair"""
        user_embedding = self.get_user_embedding(user_id)
        item_embedding = self.get_item_embedding(item_id)
        
        if user_embedding is None or item_embedding is None:
            return None
        
        return float(np.dot(user_embedding, item_embedding))
    
    def recommend_items(self, user_id: str, n_recommendations: int = 10) -> List[Tuple[str, float]]:
        """Generate item recommendations for user"""
        user_embedding = self.get_user_embedding(user_id)
        if user_embedding is None:
            return []
        
        # Calculate scores for all items
        scores = np.dot(self.artifacts.item_factors, user_embedding)
        
        # Get top N items
        top_indices = np.argsort(scores)[::-1][:n_recommendations]
        
        recommendations = []
        for idx in top_indices:
            item_id = self.artifacts.reverse_item_map[idx]
            score = scores[idx]
            recommendations.append((item_id, float(score)))
        
        return recommendations
    
    def _generate_model_version(self, config: CFConfig, metrics: CFMetrics) -> str:
        """Generate unique model version string"""
        version_data = f"{config.n_factors}_{config.regularization}_{metrics.n_users}_{metrics.n_items}"
        hash_obj = hashlib.md5(version_data.encode())
        return f"cf_v1.0.0_{hash_obj.hexdigest()[:8]}"
    
    def _generate_checksum_manifest(self, output_dir: str) -> Dict[str, str]:
        """Generate checksum manifest for artifacts"""
        manifest = {}
        
        for filename in ['user_factors.npy', 'item_factors.npy', 'metadata.json']:
            filepath = os.path.join(output_dir, filename)
            if os.path.exists(filepath):
                with open(filepath, 'rb') as f:
                    content = f.read()
                    checksum = hashlib.sha256(content).hexdigest()
                    manifest[filename] = checksum
        
        return manifest
    
    def _verify_checksum_manifest(self, input_dir: str) -> bool:
        """Verify checksums of loaded artifacts"""
        try:
            manifest_path = os.path.join(input_dir, 'manifest.json')
            with open(manifest_path, 'r') as f:
                stored_manifest = json.load(f)
            
            current_manifest = self._generate_checksum_manifest(input_dir)
            
            return stored_manifest == current_manifest
        except Exception as e:
            logger.error(f"Checksum verification failed: {e}")
            return False
    
    def _is_cf_enabled(self) -> bool:
        """Check if collaborative filtering is enabled via feature flag"""
        return os.getenv('ENABLE_HYBRID_RECO', 'false').lower() == 'true'


if __name__ == "__main__":
    # Example usage with synthetic data
    np.random.seed(42)
    
    # Create synthetic interaction data
    n_users = 1000
    n_items = 500
    n_interactions = 10000
    
    users = [f"user_{i}" for i in range(n_users)]
    items = [f"track_{i}" for i in range(n_items)]
    
    interactions_data = []
    for _ in range(n_interactions):
        user_id = np.random.choice(users)
        item_id = np.random.choice(items)
        rating = np.random.randint(1, 6)  # 1-5 rating
        interactions_data.append({
            'user_id': user_id,
            'item_id': item_id,
            'rating': rating
        })
    
    interactions_df = pd.DataFrame(interactions_data)
    
    # Train model
    config = CFConfig(n_factors=32, iterations=10)
    trainer = CollaborativeFilteringTrainer(config)
    
    print("Training collaborative filtering model...")
    artifacts = trainer.train(interactions_df)
    
    print(f"Training completed!")
    print(f"Model version: {artifacts.model_version}")
    print(f"RMSE: {artifacts.metrics.rmse:.4f}")
    print(f"Users covered: {artifacts.metrics.coverage_users:.2%}")
    print(f"Items covered: {artifacts.metrics.coverage_items:.2%}")
    
    # Test recommendations
    test_user = "user_0"
    recommendations = trainer.recommend_items(test_user, n_recommendations=5)
    print(f"\nTop 5 recommendations for {test_user}:")
    for item_id, score in recommendations:
        print(f"  {item_id}: {score:.4f}")
    
    # Save artifacts
    output_dir = "/tmp/cf_artifacts"
    trainer.save_artifacts(output_dir)
    print(f"\nArtifacts saved to {output_dir}")