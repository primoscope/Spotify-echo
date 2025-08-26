"""
Feature Store Registry

Manages feature definitions, schemas, and metadata for the feature store.
Provides feature discovery and lineage tracking.

Part of FST workstream - Phase 2.1 Foundation
"""

import json
import logging
import os
import time
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Union
from dataclasses import dataclass, asdict
from pathlib import Path
import yaml

logger = logging.getLogger(__name__)


@dataclass
class FeatureSchema:
    """Schema definition for a feature"""
    name: str
    type: str  # 'float', 'int', 'string', 'array', 'embedding'
    description: str
    nullable: bool = False
    default_value: Any = None
    constraints: Dict[str, Any] = None  # min, max, allowed_values, etc.
    
    def __post_init__(self):
        if self.constraints is None:
            self.constraints = {}


@dataclass 
class FeatureGroup:
    """Group of related features with common metadata"""
    name: str
    description: str
    entity: str  # Primary entity (user, item, session, etc.)
    features: List[FeatureSchema]
    ttl_seconds: int = 86400  # 24 hours default
    batch_source: Optional[str] = None
    stream_source: Optional[str] = None
    owner: str = "ml-team"
    tags: List[str] = None
    created_at: str = None
    updated_at: str = None
    version: str = "1.0.0"
    
    def __post_init__(self):
        if self.tags is None:
            self.tags = []
        if self.created_at is None:
            self.created_at = datetime.now(timezone.utc).isoformat()
        if self.updated_at is None:
            self.updated_at = self.created_at


@dataclass
class FeatureView:
    """View combining features from multiple groups for ML use"""
    name: str
    description: str
    feature_groups: List[str]
    selected_features: List[str]  # Specific features to include
    ttl_seconds: int = 3600  # 1 hour default for views
    owner: str = "ml-team"
    use_cases: List[str] = None
    created_at: str = None
    version: str = "1.0.0"
    
    def __post_init__(self):
        if self.use_cases is None:
            self.use_cases = []
        if self.created_at is None:
            self.created_at = datetime.now(timezone.utc).isoformat()


class FeatureRegistry:
    """Feature registry for managing feature definitions and metadata"""
    
    def __init__(self, registry_path: str = None):
        self.registry_path = registry_path or os.getenv('FEATURE_STORE_REGISTRY_PATH', '/tmp/feature_registry')
        self.feature_groups: Dict[str, FeatureGroup] = {}
        self.feature_views: Dict[str, FeatureView] = {}
        self._ensure_registry_structure()
        self._load_existing_registry()
    
    def _ensure_registry_structure(self):
        """Create registry directory structure"""
        Path(self.registry_path).mkdir(parents=True, exist_ok=True)
        Path(self.registry_path, 'feature_groups').mkdir(exist_ok=True)
        Path(self.registry_path, 'feature_views').mkdir(exist_ok=True)
        Path(self.registry_path, 'metadata').mkdir(exist_ok=True)
    
    def _load_existing_registry(self):
        """Load existing feature definitions from disk"""
        try:
            # Load feature groups
            feature_groups_dir = Path(self.registry_path, 'feature_groups')
            for file_path in feature_groups_dir.glob('*.yaml'):
                with open(file_path, 'r') as f:
                    data = yaml.safe_load(f)
                    feature_group = self._dict_to_feature_group(data)
                    self.feature_groups[feature_group.name] = feature_group
            
            # Load feature views
            feature_views_dir = Path(self.registry_path, 'feature_views')
            for file_path in feature_views_dir.glob('*.yaml'):
                with open(file_path, 'r') as f:
                    data = yaml.safe_load(f)
                    feature_view = self._dict_to_feature_view(data)
                    self.feature_views[feature_view.name] = feature_view
            
            logger.info(f"Loaded {len(self.feature_groups)} feature groups and {len(self.feature_views)} feature views")
            
        except Exception as e:
            logger.warning(f"Failed to load existing registry: {e}")
    
    def register_feature_group(self, feature_group: FeatureGroup) -> bool:
        """Register a new feature group"""
        try:
            # Validate feature group
            if not self._validate_feature_group(feature_group):
                return False
            
            # Update timestamp
            feature_group.updated_at = datetime.now(timezone.utc).isoformat()
            
            # Store in memory
            self.feature_groups[feature_group.name] = feature_group
            
            # Persist to disk
            self._save_feature_group(feature_group)
            
            logger.info(f"Registered feature group: {feature_group.name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to register feature group {feature_group.name}: {e}")
            return False
    
    def register_feature_view(self, feature_view: FeatureView) -> bool:
        """Register a new feature view"""
        try:
            # Validate feature view
            if not self._validate_feature_view(feature_view):
                return False
            
            # Store in memory
            self.feature_views[feature_view.name] = feature_view
            
            # Persist to disk
            self._save_feature_view(feature_view)
            
            logger.info(f"Registered feature view: {feature_view.name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to register feature view {feature_view.name}: {e}")
            return False
    
    def get_feature_group(self, name: str) -> Optional[FeatureGroup]:
        """Get feature group by name"""
        return self.feature_groups.get(name)
    
    def get_feature_view(self, name: str) -> Optional[FeatureView]:
        """Get feature view by name"""
        return self.feature_views.get(name)
    
    def list_feature_groups(self, entity: str = None, tags: List[str] = None) -> List[FeatureGroup]:
        """List feature groups with optional filtering"""
        groups = list(self.feature_groups.values())
        
        if entity:
            groups = [g for g in groups if g.entity == entity]
        
        if tags:
            groups = [g for g in groups if any(tag in g.tags for tag in tags)]
        
        return groups
    
    def list_feature_views(self, use_case: str = None) -> List[FeatureView]:
        """List feature views with optional filtering"""
        views = list(self.feature_views.values())
        
        if use_case:
            views = [v for v in views if use_case in v.use_cases]
        
        return views
    
    def search_features(self, query: str) -> Dict[str, List[str]]:
        """Search for features by name or description"""
        results = {'feature_groups': [], 'features': []}
        
        query_lower = query.lower()
        
        for group_name, group in self.feature_groups.items():
            # Search group name and description
            if (query_lower in group.name.lower() or 
                query_lower in group.description.lower()):
                results['feature_groups'].append(group_name)
            
            # Search individual features
            for feature in group.features:
                if (query_lower in feature.name.lower() or 
                    query_lower in feature.description.lower()):
                    results['features'].append(f"{group_name}.{feature.name}")
        
        return results
    
    def get_feature_lineage(self, feature_name: str) -> Dict[str, Any]:
        """Get lineage information for a feature"""
        # Parse feature name (group.feature)
        if '.' not in feature_name:
            return {}
        
        group_name, feat_name = feature_name.split('.', 1)
        group = self.feature_groups.get(group_name)
        
        if not group:
            return {}
        
        feature = next((f for f in group.features if f.name == feat_name), None)
        if not feature:
            return {}
        
        lineage = {
            'feature': feature_name,
            'feature_group': group_name,
            'entity': group.entity,
            'type': feature.type,
            'description': feature.description,
            'sources': {
                'batch': group.batch_source,
                'stream': group.stream_source
            },
            'dependencies': self._find_feature_dependencies(feature_name),
            'consumers': self._find_feature_consumers(feature_name)
        }
        
        return lineage
    
    def _validate_feature_group(self, feature_group: FeatureGroup) -> bool:
        """Validate feature group definition"""
        if not feature_group.name or not feature_group.entity:
            logger.error("Feature group must have name and entity")
            return False
        
        if not feature_group.features:
            logger.error("Feature group must have at least one feature")
            return False
        
        # Validate feature schemas
        for feature in feature_group.features:
            if not self._validate_feature_schema(feature):
                return False
        
        return True
    
    def _validate_feature_view(self, feature_view: FeatureView) -> bool:
        """Validate feature view definition"""
        if not feature_view.name or not feature_view.feature_groups:
            logger.error("Feature view must have name and feature groups")
            return False
        
        # Check that referenced feature groups exist
        for group_name in feature_view.feature_groups:
            if group_name not in self.feature_groups:
                logger.error(f"Referenced feature group '{group_name}' not found")
                return False
        
        # Validate selected features exist
        for feature_name in feature_view.selected_features:
            if '.' not in feature_name:
                logger.error(f"Feature name must be in format 'group.feature': {feature_name}")
                return False
            
            group_name, feat_name = feature_name.split('.', 1)
            if group_name not in self.feature_groups:
                logger.error(f"Feature group '{group_name}' not found for feature '{feature_name}'")
                return False
            
            group = self.feature_groups[group_name]
            if not any(f.name == feat_name for f in group.features):
                logger.error(f"Feature '{feat_name}' not found in group '{group_name}'")
                return False
        
        return True
    
    def _validate_feature_schema(self, feature: FeatureSchema) -> bool:
        """Validate individual feature schema"""
        valid_types = ['float', 'int', 'string', 'boolean', 'array', 'embedding']
        
        if feature.type not in valid_types:
            logger.error(f"Invalid feature type '{feature.type}'. Must be one of: {valid_types}")
            return False
        
        if not feature.name or not feature.description:
            logger.error("Feature must have name and description")
            return False
        
        return True
    
    def _save_feature_group(self, feature_group: FeatureGroup):
        """Save feature group to disk"""
        file_path = Path(self.registry_path, 'feature_groups', f"{feature_group.name}.yaml")
        
        # Convert to dict for serialization
        data = self._feature_group_to_dict(feature_group)
        
        with open(file_path, 'w') as f:
            yaml.dump(data, f, default_flow_style=False, sort_keys=False)
    
    def _save_feature_view(self, feature_view: FeatureView):
        """Save feature view to disk"""
        file_path = Path(self.registry_path, 'feature_views', f"{feature_view.name}.yaml")
        
        # Convert to dict for serialization
        data = self._feature_view_to_dict(feature_view)
        
        with open(file_path, 'w') as f:
            yaml.dump(data, f, default_flow_style=False, sort_keys=False)
    
    def _feature_group_to_dict(self, feature_group: FeatureGroup) -> Dict[str, Any]:
        """Convert feature group to dictionary"""
        data = asdict(feature_group)
        # Ensure features are properly serialized
        data['features'] = [asdict(f) for f in feature_group.features]
        return data
    
    def _feature_view_to_dict(self, feature_view: FeatureView) -> Dict[str, Any]:
        """Convert feature view to dictionary"""
        return asdict(feature_view)
    
    def _dict_to_feature_group(self, data: Dict[str, Any]) -> FeatureGroup:
        """Convert dictionary to feature group"""
        features = [FeatureSchema(**f) for f in data.get('features', [])]
        
        # Remove features from data before creating FeatureGroup
        data_copy = data.copy()
        data_copy.pop('features', None)
        
        feature_group = FeatureGroup(**data_copy)
        feature_group.features = features
        
        return feature_group
    
    def _dict_to_feature_view(self, data: Dict[str, Any]) -> FeatureView:
        """Convert dictionary to feature view"""
        return FeatureView(**data)
    
    def _find_feature_dependencies(self, feature_name: str) -> List[str]:
        """Find features that this feature depends on"""
        # Placeholder for dependency tracking
        # In a full implementation, this would analyze feature computation logic
        return []
    
    def _find_feature_consumers(self, feature_name: str) -> List[str]:
        """Find feature views that use this feature"""
        consumers = []
        
        for view_name, view in self.feature_views.items():
            if feature_name in view.selected_features:
                consumers.append(view_name)
        
        return consumers
    
    def export_registry(self, output_path: str) -> bool:
        """Export entire registry to a single file"""
        try:
            registry_data = {
                'feature_groups': {name: self._feature_group_to_dict(group) 
                                 for name, group in self.feature_groups.items()},
                'feature_views': {name: self._feature_view_to_dict(view)
                                for name, view in self.feature_views.items()},
                'metadata': {
                    'exported_at': datetime.now(timezone.utc).isoformat(),
                    'registry_path': self.registry_path,
                    'total_feature_groups': len(self.feature_groups),
                    'total_feature_views': len(self.feature_views)
                }
            }
            
            with open(output_path, 'w') as f:
                if output_path.endswith('.yaml') or output_path.endswith('.yml'):
                    yaml.dump(registry_data, f, default_flow_style=False)
                else:
                    json.dump(registry_data, f, indent=2)
            
            logger.info(f"Registry exported to {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to export registry: {e}")
            return False


# Pre-defined feature groups for EchoTune AI
def create_default_feature_groups() -> List[FeatureGroup]:
    """Create default feature groups for music recommendation"""
    
    # User engagement features
    user_engagement = FeatureGroup(
        name="user_engagement",
        description="User interaction and engagement features",
        entity="user",
        features=[
            FeatureSchema("play_count_7d", "int", "Number of plays in last 7 days"),
            FeatureSchema("skip_rate_7d", "float", "Skip rate in last 7 days"),
            FeatureSchema("like_rate_7d", "float", "Like rate in last 7 days"),
            FeatureSchema("session_duration_avg", "float", "Average session duration in minutes"),
            FeatureSchema("unique_tracks_7d", "int", "Number of unique tracks played in 7 days"),
            FeatureSchema("unique_artists_7d", "int", "Number of unique artists played in 7 days"),
            FeatureSchema("discovery_rate", "float", "Rate of playing new tracks"),
            FeatureSchema("repeat_rate", "float", "Rate of repeating tracks")
        ],
        ttl_seconds=3600,  # 1 hour
        batch_source="user_interactions_batch",
        stream_source="user_interactions_stream",
        tags=["user", "engagement", "behavioral"]
    )
    
    # Item audio features
    item_audio = FeatureGroup(
        name="item_audio",
        description="Audio characteristics and features for tracks",
        entity="item",
        features=[
            FeatureSchema("tempo", "float", "Track tempo in BPM"),
            FeatureSchema("key", "int", "Musical key (0-11)"),
            FeatureSchema("mode", "int", "Musical mode (0=minor, 1=major)"),
            FeatureSchema("time_signature", "int", "Time signature"),
            FeatureSchema("acousticness", "float", "Acousticness score (0-1)"),
            FeatureSchema("danceability", "float", "Danceability score (0-1)"),
            FeatureSchema("energy", "float", "Energy score (0-1)"),
            FeatureSchema("instrumentalness", "float", "Instrumentalness score (0-1)"),
            FeatureSchema("liveness", "float", "Liveness score (0-1)"),
            FeatureSchema("loudness", "float", "Loudness in dB"),
            FeatureSchema("speechiness", "float", "Speechiness score (0-1)"),
            FeatureSchema("valence", "float", "Valence/positivity score (0-1)")
        ],
        ttl_seconds=86400 * 7,  # 7 days (audio features don't change)
        batch_source="spotify_audio_features",
        tags=["item", "audio", "content"]
    )
    
    # Item metadata features
    item_metadata = FeatureGroup(
        name="item_metadata",
        description="Track metadata and popularity features",
        entity="item",
        features=[
            FeatureSchema("genre_primary", "string", "Primary genre"),
            FeatureSchema("genre_secondary", "string", "Secondary genre"),
            FeatureSchema("artist_popularity", "int", "Artist popularity score (0-100)"),
            FeatureSchema("album_popularity", "int", "Album popularity score (0-100)"),
            FeatureSchema("track_popularity", "int", "Track popularity score (0-100)"),
            FeatureSchema("duration_ms", "int", "Track duration in milliseconds"),
            FeatureSchema("explicit", "boolean", "Whether track contains explicit content"),
            FeatureSchema("release_year", "int", "Year of release"),
            FeatureSchema("artist_follower_count", "int", "Number of artist followers")
        ],
        ttl_seconds=86400 * 30,  # 30 days
        batch_source="spotify_metadata",
        tags=["item", "metadata", "popularity"]
    )
    
    # Collaborative filtering embeddings
    cf_embeddings = FeatureGroup(
        name="cf_embeddings",
        description="Collaborative filtering user and item embeddings",
        entity="both",  # Both user and item
        features=[
            FeatureSchema("user_embedding", "embedding", "User preference embedding vector"),
            FeatureSchema("item_embedding", "embedding", "Item characteristic embedding vector"),
            FeatureSchema("embedding_version", "string", "Version of embedding model used"),
            FeatureSchema("embedding_confidence", "float", "Confidence score for embedding quality")
        ],
        ttl_seconds=86400,  # 1 day
        batch_source="cf_training_pipeline",
        tags=["embedding", "collaborative_filtering", "ml"]
    )
    
    # Content embeddings
    content_embeddings = FeatureGroup(
        name="content_embeddings",
        description="Content-based item embeddings from audio and metadata",
        entity="item",
        features=[
            FeatureSchema("content_embedding", "embedding", "Content-based embedding vector"),
            FeatureSchema("audio_embedding", "embedding", "Audio-only embedding component"),
            FeatureSchema("metadata_embedding", "embedding", "Metadata-only embedding component"),
            FeatureSchema("embedding_version", "string", "Version of content embedder used")
        ],
        ttl_seconds=86400 * 7,  # 7 days
        batch_source="content_embedding_pipeline",
        tags=["embedding", "content_based", "ml"]
    )
    
    return [user_engagement, item_audio, item_metadata, cf_embeddings, content_embeddings]


def create_default_feature_views() -> List[FeatureView]:
    """Create default feature views for common ML use cases"""
    
    # Recommendation serving view
    recommendation_serving = FeatureView(
        name="recommendation_serving",
        description="Features for real-time recommendation serving",
        feature_groups=["user_engagement", "cf_embeddings", "content_embeddings"],
        selected_features=[
            "user_engagement.play_count_7d",
            "user_engagement.skip_rate_7d", 
            "user_engagement.like_rate_7d",
            "cf_embeddings.user_embedding",
            "cf_embeddings.item_embedding",
            "content_embeddings.content_embedding"
        ],
        ttl_seconds=300,  # 5 minutes for serving
        use_cases=["recommendation_serving", "hybrid_ranking"]
    )
    
    # Model training view
    model_training = FeatureView(
        name="model_training",
        description="Features for training recommendation models",
        feature_groups=["user_engagement", "item_audio", "item_metadata"],
        selected_features=[
            "user_engagement.play_count_7d",
            "user_engagement.skip_rate_7d",
            "user_engagement.like_rate_7d",
            "user_engagement.discovery_rate",
            "item_audio.tempo",
            "item_audio.danceability",
            "item_audio.energy",
            "item_audio.valence",
            "item_metadata.genre_primary",
            "item_metadata.artist_popularity",
            "item_metadata.track_popularity"
        ],
        ttl_seconds=86400,  # 1 day for training
        use_cases=["model_training", "feature_engineering"]
    )
    
    # Trending detection view
    trending_detection = FeatureView(
        name="trending_detection",
        description="Features for detecting trending content",
        feature_groups=["item_metadata", "user_engagement"],
        selected_features=[
            "item_metadata.track_popularity",
            "item_metadata.artist_popularity",
            "item_metadata.release_year",
            "user_engagement.play_count_7d",
            "user_engagement.unique_tracks_7d"
        ],
        ttl_seconds=1800,  # 30 minutes
        use_cases=["trending_detection", "discovery"]
    )
    
    return [recommendation_serving, model_training, trending_detection]


if __name__ == "__main__":
    # Example usage
    registry = FeatureRegistry("/tmp/feature_registry_demo")
    
    # Register default feature groups
    default_groups = create_default_feature_groups()
    for group in default_groups:
        success = registry.register_feature_group(group)
        print(f"Registered {group.name}: {'✓' if success else '✗'}")
    
    # Register default feature views
    default_views = create_default_feature_views()
    for view in default_views:
        success = registry.register_feature_view(view)
        print(f"Registered {view.name}: {'✓' if success else '✗'}")
    
    # Search features
    print("\nSearching for 'embedding' features:")
    search_results = registry.search_features("embedding")
    for category, results in search_results.items():
        print(f"  {category}: {results}")
    
    # Get feature lineage
    print("\nFeature lineage for 'user_engagement.play_count_7d':")
    lineage = registry.get_feature_lineage("user_engagement.play_count_7d")
    print(json.dumps(lineage, indent=2))
    
    # Export registry
    export_path = "/tmp/feature_registry_export.yaml"
    registry.export_registry(export_path)
    print(f"\nRegistry exported to {export_path}")
    
    print(f"\nRegistry summary:")
    print(f"  Feature groups: {len(registry.feature_groups)}")
    print(f"  Feature views: {len(registry.feature_views)}")
    print(f"  Total features: {sum(len(g.features) for g in registry.feature_groups.values())}")