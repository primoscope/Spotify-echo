"""
Content Feature Embedder

Audio and metadata feature extraction for content-based recommendations.
Handles cold-start items by creating embeddings from track characteristics.

Part of EMB workstream - Phase 2.1 Foundation
"""

import os
import json
import logging
import time
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List, Tuple
import pickle
from dataclasses import dataclass, asdict
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, LabelEncoder, OneHotEncoder
from sklearn.decomposition import PCA
from sklearn.feature_extraction.text import TfidfVectorizer
import librosa

logger = logging.getLogger(__name__)


@dataclass
class EmbedderConfig:
    """Configuration for content feature embedder"""
    embedding_dim: int = 128
    audio_features: List[str] = None
    metadata_features: List[str] = None
    normalize_features: bool = True
    use_pca: bool = True
    pca_components: Optional[int] = None
    max_text_features: int = 1000
    random_state: int = 42
    
    def __post_init__(self):
        if self.audio_features is None:
            self.audio_features = [
                'tempo', 'key', 'mode', 'time_signature',
                'acousticness', 'danceability', 'energy', 'instrumentalness',
                'liveness', 'loudness', 'speechiness', 'valence'
            ]
        if self.metadata_features is None:
            self.metadata_features = [
                'genre', 'artist_popularity', 'album_popularity', 
                'duration_ms', 'explicit', 'release_year'
            ]
        if self.pca_components is None:
            self.pca_components = min(64, self.embedding_dim // 2)


@dataclass
class EmbedderMetrics:
    """Metrics for content embedder training"""
    processed_count: int
    failed_count: int
    coverage_ratio: float
    avg_processing_time_ms: float
    embedding_dimension: int
    feature_variance_explained: float  # For PCA
    processing_time_seconds: float


@dataclass
class ContentEmbedding:
    """Single item content embedding"""
    item_id: str
    embedding: np.ndarray
    features: Dict[str, Any]
    created_at: str
    version: str


class AudioFeatureExtractor:
    """Extract audio features from track metadata or audio files"""
    
    def __init__(self):
        self.feature_extractors = {
            'tempo': self._extract_tempo,
            'key': self._extract_key,
            'mode': self._extract_mode,
            'time_signature': self._extract_time_signature,
            'acousticness': self._extract_acousticness,
            'danceability': self._extract_danceability,
            'energy': self._extract_energy,
            'instrumentalness': self._extract_instrumentalness,
            'liveness': self._extract_liveness,
            'loudness': self._extract_loudness,
            'speechiness': self._extract_speechiness,
            'valence': self._extract_valence
        }
    
    def extract_features(self, track_data: Dict[str, Any]) -> Dict[str, float]:
        """Extract audio features from track data"""
        features = {}
        
        # Check if Spotify audio features are available
        if 'audio_features' in track_data:
            audio_features = track_data['audio_features']
            for feature_name in self.feature_extractors.keys():
                if feature_name in audio_features:
                    features[feature_name] = float(audio_features[feature_name])
                else:
                    # Use mock extractor for missing features
                    features[feature_name] = self.feature_extractors[feature_name](track_data)
        else:
            # Extract from available metadata or use mock extractors
            for feature_name, extractor in self.feature_extractors.items():
                features[feature_name] = extractor(track_data)
        
        return features
    
    def _extract_tempo(self, track_data: Dict[str, Any]) -> float:
        """Extract or estimate tempo"""
        # Mock implementation - in production would analyze audio
        return track_data.get('tempo', 120.0)
    
    def _extract_key(self, track_data: Dict[str, Any]) -> float:
        """Extract musical key (0-11)"""
        return float(track_data.get('key', 0))
    
    def _extract_mode(self, track_data: Dict[str, Any]) -> float:
        """Extract mode (0=minor, 1=major)"""
        return float(track_data.get('mode', 1))
    
    def _extract_time_signature(self, track_data: Dict[str, Any]) -> float:
        """Extract time signature"""
        return float(track_data.get('time_signature', 4))
    
    def _extract_acousticness(self, track_data: Dict[str, Any]) -> float:
        """Extract acousticness (0-1)"""
        return track_data.get('acousticness', 0.5)
    
    def _extract_danceability(self, track_data: Dict[str, Any]) -> float:
        """Extract danceability (0-1)"""
        return track_data.get('danceability', 0.5)
    
    def _extract_energy(self, track_data: Dict[str, Any]) -> float:
        """Extract energy (0-1)"""
        return track_data.get('energy', 0.5)
    
    def _extract_instrumentalness(self, track_data: Dict[str, Any]) -> float:
        """Extract instrumentalness (0-1)"""
        return track_data.get('instrumentalness', 0.1)
    
    def _extract_liveness(self, track_data: Dict[str, Any]) -> float:
        """Extract liveness (0-1)"""
        return track_data.get('liveness', 0.1)
    
    def _extract_loudness(self, track_data: Dict[str, Any]) -> float:
        """Extract loudness (dB)"""
        return track_data.get('loudness', -10.0)
    
    def _extract_speechiness(self, track_data: Dict[str, Any]) -> float:
        """Extract speechiness (0-1)"""
        return track_data.get('speechiness', 0.1)
    
    def _extract_valence(self, track_data: Dict[str, Any]) -> float:
        """Extract valence/positivity (0-1)"""
        return track_data.get('valence', 0.5)


class MetadataFeatureExtractor:
    """Extract metadata features from track information"""
    
    def __init__(self):
        self.genre_encoder = None
        self.artist_encoder = None
        
    def extract_features(self, track_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract metadata features from track data"""
        features = {}
        
        # Genre features
        genres = track_data.get('genres', [])
        if isinstance(genres, str):
            genres = [genres]
        features['genres'] = genres
        
        # Artist popularity
        features['artist_popularity'] = track_data.get('artist_popularity', 50)
        
        # Album popularity
        features['album_popularity'] = track_data.get('album_popularity', 50)
        
        # Duration
        features['duration_ms'] = track_data.get('duration_ms', 200000)
        
        # Explicit content
        features['explicit'] = 1 if track_data.get('explicit', False) else 0
        
        # Release year
        release_date = track_data.get('release_date', '2020-01-01')
        try:
            year = int(release_date.split('-')[0])
        except:
            year = 2020
        features['release_year'] = year
        
        # Artist information
        features['artist_name'] = track_data.get('artist_name', 'Unknown')
        
        return features


class ContentFeatureEmbedder:
    """Main content feature embedder class"""
    
    def __init__(self, config: EmbedderConfig = None):
        self.config = config or EmbedderConfig()
        self.audio_extractor = AudioFeatureExtractor()
        self.metadata_extractor = MetadataFeatureExtractor()
        self.scalers = {}
        self.encoders = {}
        self.pca = None
        self.tfidf_vectorizer = None
        self.is_fitted = False
        
    def fit(self, tracks_df: pd.DataFrame) -> Dict[str, Any]:
        """
        Fit the embedder on training data
        
        Args:
            tracks_df: DataFrame with track metadata
            
        Returns:
            Fitting metadata and statistics
        """
        logger.info("Fitting content feature embedder")
        start_time = time.time()
        
        # Check feature flag
        if not self._is_embedder_enabled():
            raise RuntimeError("Content embedder is disabled via feature flag")
        
        # Extract features for all tracks
        all_features = []
        processed_count = 0
        failed_count = 0
        
        for idx, track in tracks_df.iterrows():
            try:
                track_data = track.to_dict()
                features = self._extract_all_features(track_data)
                features['item_id'] = track_data.get('item_id', f'track_{idx}')
                all_features.append(features)
                processed_count += 1
            except Exception as e:
                logger.warning(f"Failed to extract features for track {idx}: {e}")
                failed_count += 1
        
        if not all_features:
            raise ValueError("No features could be extracted from input data")
        
        features_df = pd.DataFrame(all_features)
        
        # Fit audio feature scalers
        audio_features = [col for col in features_df.columns 
                         if col in self.config.audio_features]
        if audio_features:
            self.scalers['audio'] = StandardScaler()
            self.scalers['audio'].fit(features_df[audio_features])
        
        # Fit metadata encoders
        # Genre encoding
        if 'genres' in features_df.columns:
            all_genres = []
            for genres in features_df['genres']:
                if isinstance(genres, list):
                    all_genres.extend(genres)
                else:
                    all_genres.append(str(genres))
            
            unique_genres = list(set(all_genres))
            self.encoders['genre_onehot'] = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
            # Reshape for one-hot encoding
            genre_matrix = np.zeros((len(features_df), len(unique_genres)))
            for i, genres in enumerate(features_df['genres']):
                if isinstance(genres, list):
                    for genre in genres:
                        if genre in unique_genres:
                            genre_matrix[i, unique_genres.index(genre)] = 1
            self.encoders['genre_onehot'].fit(genre_matrix)
            self.encoders['genre_list'] = unique_genres
        
        # Artist encoding
        if 'artist_name' in features_df.columns:
            self.encoders['artist'] = LabelEncoder()
            self.encoders['artist'].fit(features_df['artist_name'].fillna('Unknown'))
        
        # Fit numerical metadata scalers
        numerical_metadata = [col for col in features_df.columns 
                             if col in ['artist_popularity', 'album_popularity', 'duration_ms', 'release_year']]
        if numerical_metadata:
            self.scalers['metadata'] = StandardScaler()
            self.scalers['metadata'].fit(features_df[numerical_metadata])
        
        # Create sample embeddings to determine feature dimension
        sample_embeddings = []
        for i in range(min(100, len(features_df))):
            embedding = self._create_embedding(features_df.iloc[i].to_dict())
            if embedding is not None:
                sample_embeddings.append(embedding)
        
        if sample_embeddings:
            feature_dim = len(sample_embeddings[0])
            
            # Fit PCA if enabled and needed
            if self.config.use_pca and feature_dim > self.config.embedding_dim:
                self.pca = PCA(
                    n_components=min(self.config.pca_components, self.config.embedding_dim),
                    random_state=self.config.random_state
                )
                self.pca.fit(np.array(sample_embeddings))
                variance_explained = np.sum(self.pca.explained_variance_ratio_)
            else:
                variance_explained = 1.0
        else:
            variance_explained = 0.0
        
        self.is_fitted = True
        
        fitting_time = time.time() - start_time
        
        metrics = EmbedderMetrics(
            processed_count=processed_count,
            failed_count=failed_count,
            coverage_ratio=processed_count / (processed_count + failed_count) if (processed_count + failed_count) > 0 else 0.0,
            avg_processing_time_ms=0.0,  # Will be calculated during transform
            embedding_dimension=self.config.embedding_dim,
            feature_variance_explained=variance_explained,
            processing_time_seconds=fitting_time
        )
        
        logger.info(f"Embedder fitted in {fitting_time:.2f}s")
        logger.info(f"Processed {processed_count} tracks, failed {failed_count}")
        logger.info(f"Coverage: {metrics.coverage_ratio:.2%}")
        
        return asdict(metrics)
    
    def transform(self, tracks_df: pd.DataFrame) -> List[ContentEmbedding]:
        """
        Transform tracks into content embeddings
        
        Args:
            tracks_df: DataFrame with track metadata
            
        Returns:
            List of content embeddings
        """
        if not self.is_fitted:
            raise ValueError("Embedder must be fitted before transform")
        
        logger.info(f"Transforming {len(tracks_df)} tracks to embeddings")
        start_time = time.time()
        
        embeddings = []
        processing_times = []
        
        for idx, track in tracks_df.iterrows():
            track_start = time.time()
            
            try:
                track_data = track.to_dict()
                item_id = track_data.get('item_id', f'track_{idx}')
                
                # Extract and create embedding
                features = self._extract_all_features(track_data)
                embedding_vector = self._create_embedding(features)
                
                if embedding_vector is not None:
                    embedding = ContentEmbedding(
                        item_id=item_id,
                        embedding=embedding_vector,
                        features=features,
                        created_at=datetime.now(timezone.utc).isoformat(),
                        version=self._get_embedder_version()
                    )
                    embeddings.append(embedding)
                
                processing_time = (time.time() - track_start) * 1000
                processing_times.append(processing_time)
                
            except Exception as e:
                logger.warning(f"Failed to create embedding for track {idx}: {e}")
        
        total_time = time.time() - start_time
        avg_processing_time = np.mean(processing_times) if processing_times else 0.0
        
        logger.info(f"Created {len(embeddings)} embeddings in {total_time:.2f}s")
        logger.info(f"Average processing time: {avg_processing_time:.2f}ms per track")
        
        return embeddings
    
    def _extract_all_features(self, track_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract all features for a single track"""
        features = {}
        
        # Extract audio features
        audio_features = self.audio_extractor.extract_features(track_data)
        features.update(audio_features)
        
        # Extract metadata features
        metadata_features = self.metadata_extractor.extract_features(track_data)
        features.update(metadata_features)
        
        return features
    
    def _create_embedding(self, features: Dict[str, Any]) -> Optional[np.ndarray]:
        """Create embedding vector from extracted features"""
        try:
            embedding_parts = []
            
            # Audio features
            audio_features = [features.get(feat, 0.0) for feat in self.config.audio_features]
            if 'audio' in self.scalers and self.config.normalize_features:
                audio_features = self.scalers['audio'].transform([audio_features])[0]
            embedding_parts.extend(audio_features)
            
            # Genre features (one-hot encoded)
            if 'genre_onehot' in self.encoders and 'genres' in features:
                genres = features['genres']
                if isinstance(genres, list):
                    genre_vector = np.zeros(len(self.encoders['genre_list']))
                    for genre in genres:
                        if genre in self.encoders['genre_list']:
                            genre_vector[self.encoders['genre_list'].index(genre)] = 1
                else:
                    genre_vector = np.zeros(len(self.encoders['genre_list']))
                    if str(genres) in self.encoders['genre_list']:
                        genre_vector[self.encoders['genre_list'].index(str(genres))] = 1
                
                embedding_parts.extend(genre_vector.tolist())
            
            # Numerical metadata features
            numerical_metadata = [
                features.get('artist_popularity', 50),
                features.get('album_popularity', 50),
                features.get('duration_ms', 200000),
                features.get('release_year', 2020),
                features.get('explicit', 0)
            ]
            
            if 'metadata' in self.scalers and self.config.normalize_features:
                # Only scale the first 4 (not explicit flag)
                scaled_metadata = self.scalers['metadata'].transform([numerical_metadata[:-1]])[0]
                scaled_metadata = list(scaled_metadata) + [numerical_metadata[-1]]
                numerical_metadata = scaled_metadata
            
            embedding_parts.extend(numerical_metadata)
            
            # Create final embedding vector
            embedding = np.array(embedding_parts, dtype=np.float32)
            
            # Apply PCA if configured
            if self.pca is not None:
                embedding = self.pca.transform([embedding])[0]
            
            # Ensure embedding dimension matches config
            if len(embedding) > self.config.embedding_dim:
                embedding = embedding[:self.config.embedding_dim]
            elif len(embedding) < self.config.embedding_dim:
                # Pad with zeros
                padding = np.zeros(self.config.embedding_dim - len(embedding))
                embedding = np.concatenate([embedding, padding])
            
            return embedding
            
        except Exception as e:
            logger.error(f"Failed to create embedding: {e}")
            return None
    
    def save_model(self, output_dir: str) -> str:
        """Save fitted embedder model"""
        os.makedirs(output_dir, exist_ok=True)
        
        # Save model components
        model_data = {
            'config': asdict(self.config),
            'is_fitted': self.is_fitted,
            'version': self._get_embedder_version(),
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        
        # Save scalers
        if self.scalers:
            with open(os.path.join(output_dir, 'scalers.pkl'), 'wb') as f:
                pickle.dump(self.scalers, f)
        
        # Save encoders
        if self.encoders:
            with open(os.path.join(output_dir, 'encoders.pkl'), 'wb') as f:
                pickle.dump(self.encoders, f)
        
        # Save PCA
        if self.pca:
            with open(os.path.join(output_dir, 'pca.pkl'), 'wb') as f:
                pickle.dump(self.pca, f)
        
        # Save model metadata
        with open(os.path.join(output_dir, 'model.json'), 'w') as f:
            json.dump(model_data, f, indent=2)
        
        # Generate checksum manifest
        manifest = self._generate_checksum_manifest(output_dir)
        with open(os.path.join(output_dir, 'manifest.json'), 'w') as f:
            json.dump(manifest, f, indent=2)
        
        logger.info(f"Embedder model saved to {output_dir}")
        return output_dir
    
    def load_model(self, input_dir: str):
        """Load fitted embedder model"""
        # Load model metadata
        with open(os.path.join(input_dir, 'model.json'), 'r') as f:
            model_data = json.load(f)
        
        self.config = EmbedderConfig(**model_data['config'])
        self.is_fitted = model_data['is_fitted']
        
        # Load scalers
        scalers_path = os.path.join(input_dir, 'scalers.pkl')
        if os.path.exists(scalers_path):
            with open(scalers_path, 'rb') as f:
                self.scalers = pickle.load(f)
        
        # Load encoders
        encoders_path = os.path.join(input_dir, 'encoders.pkl')
        if os.path.exists(encoders_path):
            with open(encoders_path, 'rb') as f:
                self.encoders = pickle.load(f)
        
        # Load PCA
        pca_path = os.path.join(input_dir, 'pca.pkl')
        if os.path.exists(pca_path):
            with open(pca_path, 'rb') as f:
                self.pca = pickle.load(f)
        
        # Verify checksum
        if not self._verify_checksum_manifest(input_dir):
            logger.warning("Checksum verification failed for loaded model")
        
        logger.info(f"Embedder model loaded from {input_dir}")
    
    def _get_embedder_version(self) -> str:
        """Get embedder version string"""
        version_data = f"emb_v1.0.0_{self.config.embedding_dim}_{len(self.config.audio_features)}"
        return hashlib.md5(version_data.encode()).hexdigest()[:8]
    
    def _generate_checksum_manifest(self, output_dir: str) -> Dict[str, str]:
        """Generate checksum manifest"""
        manifest = {}
        
        for filename in ['model.json', 'scalers.pkl', 'encoders.pkl', 'pca.pkl']:
            filepath = os.path.join(output_dir, filename)
            if os.path.exists(filepath):
                with open(filepath, 'rb') as f:
                    content = f.read()
                    checksum = hashlib.sha256(content).hexdigest()
                    manifest[filename] = checksum
        
        return manifest
    
    def _verify_checksum_manifest(self, input_dir: str) -> bool:
        """Verify checksums"""
        try:
            manifest_path = os.path.join(input_dir, 'manifest.json')
            with open(manifest_path, 'r') as f:
                stored_manifest = json.load(f)
            
            current_manifest = self._generate_checksum_manifest(input_dir)
            return stored_manifest == current_manifest
        except Exception as e:
            logger.error(f"Checksum verification failed: {e}")
            return False
    
    def _is_embedder_enabled(self) -> bool:
        """Check if content embedder is enabled via feature flag"""
        return os.getenv('ENABLE_HYBRID_RECO', 'false').lower() == 'true'


if __name__ == "__main__":
    # Example usage with synthetic data
    np.random.seed(42)
    
    # Create synthetic track data
    tracks_data = []
    genres = ['rock', 'pop', 'jazz', 'electronic', 'hip-hop', 'country']
    artists = [f'Artist_{i}' for i in range(50)]
    
    for i in range(500):
        track_data = {
            'item_id': f'track_{i}',
            'audio_features': {
                'tempo': np.random.uniform(60, 200),
                'key': np.random.randint(0, 12),
                'mode': np.random.randint(0, 2),
                'time_signature': np.random.choice([3, 4, 5]),
                'acousticness': np.random.uniform(0, 1),
                'danceability': np.random.uniform(0, 1),
                'energy': np.random.uniform(0, 1),
                'instrumentalness': np.random.uniform(0, 1),
                'liveness': np.random.uniform(0, 1),
                'loudness': np.random.uniform(-30, 0),
                'speechiness': np.random.uniform(0, 1),
                'valence': np.random.uniform(0, 1)
            },
            'genres': np.random.choice(genres, size=np.random.randint(1, 3), replace=False).tolist(),
            'artist_name': np.random.choice(artists),
            'artist_popularity': np.random.randint(0, 100),
            'album_popularity': np.random.randint(0, 100),
            'duration_ms': np.random.randint(30000, 300000),
            'explicit': np.random.choice([True, False]),
            'release_date': f"20{np.random.randint(10, 24):02d}-{np.random.randint(1, 13):02d}-01"
        }
        tracks_data.append(track_data)
    
    tracks_df = pd.DataFrame(tracks_data)
    
    # Train embedder
    config = EmbedderConfig(embedding_dim=64, use_pca=True)
    embedder = ContentFeatureEmbedder(config)
    
    print("Fitting content feature embedder...")
    fit_metrics = embedder.fit(tracks_df)
    print(f"Fit completed! Coverage: {fit_metrics['coverage_ratio']:.2%}")
    
    # Transform tracks
    print("Transforming tracks to embeddings...")
    embeddings = embedder.transform(tracks_df.head(10))
    
    print(f"Created {len(embeddings)} embeddings")
    print(f"Embedding dimension: {len(embeddings[0].embedding)}")
    
    # Show sample embedding
    sample_embedding = embeddings[0]
    print(f"\nSample embedding for {sample_embedding.item_id}:")
    print(f"Features: {list(sample_embedding.features.keys())}")
    print(f"Embedding shape: {sample_embedding.embedding.shape}")
    print(f"First 10 values: {sample_embedding.embedding[:10]}")
    
    # Save model
    output_dir = "/tmp/content_embedder"
    embedder.save_model(output_dir)
    print(f"\nModel saved to {output_dir}")