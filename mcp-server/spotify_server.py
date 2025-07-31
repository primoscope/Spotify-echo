#!/usr/bin/env python3
"""
Spotify MCP Server for EchoTune AI
Provides tools for Spotify API automation and music recommendation workflows
"""

import asyncio
import json
import os
import sys
from typing import Dict, List, Any, Optional
import logging
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SpotifyMCPServer:
    """MCP Server for Spotify API integration and automation"""
    
    def __init__(self):
        self.client_id = os.getenv('SPOTIFY_CLIENT_ID')
        self.client_secret = os.getenv('SPOTIFY_CLIENT_SECRET')
        self.redirect_uri = os.getenv('SPOTIFY_REDIRECT_URI', 'http://localhost:3000/callback')
        self.access_token = None
        self.refresh_token = None
        
        # Initialize with mock data if credentials not available
        if not self.client_id or not self.client_secret:
            logger.warning("Spotify credentials not found, running in mock mode")
            self.mock_mode = True
        else:
            self.mock_mode = False
            
    async def authenticate(self) -> Dict[str, Any]:
        """Authenticate with Spotify API"""
        if self.mock_mode:
            return {"status": "mock_authenticated", "expires_in": 3600}
            
        # In a real implementation, this would handle OAuth flow
        logger.info("Authenticating with Spotify API...")
        return {"status": "authenticated", "expires_in": 3600}
    
    async def get_recommendations(self, user_id: str, limit: int = 20, 
                                seed_genres: Optional[List[str]] = None,
                                target_features: Optional[Dict[str, float]] = None) -> Dict[str, Any]:
        """Get personalized music recommendations using ML model and Spotify API"""
        
        try:
            logger.info(f"Generating recommendations for user {user_id}")
            
            # Mock recommendations for demonstration
            mock_recommendations = [
                {
                    "track_id": f"spotify:track:mock_{i}",
                    "track_name": f"Recommended Track {i}",
                    "artist_name": f"Artist {i}",
                    "album_name": f"Album {i}",
                    "features": {
                        "danceability": np.random.uniform(0.3, 0.9),
                        "energy": np.random.uniform(0.2, 0.8),
                        "valence": np.random.uniform(0.1, 0.9),
                        "tempo": np.random.uniform(80, 160)
                    },
                    "confidence_score": np.random.uniform(0.6, 0.95)
                }
                for i in range(limit)
            ]
            
            return {
                "user_id": user_id,
                "recommendations": mock_recommendations,
                "total_count": len(mock_recommendations),
                "seed_genres": seed_genres or ["pop", "rock"],
                "target_features": target_features or {},
                "generated_at": datetime.now().isoformat(),
                "status": "success"
            }
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            return {
                "user_id": user_id,
                "error": str(e),
                "status": "error"
            }
    
    async def create_playlist(self, name: str, tracks: List[str], 
                            description: str = "", public: bool = False) -> Dict[str, Any]:
        """Create a new Spotify playlist with specified tracks"""
        
        try:
            logger.info(f"Creating playlist '{name}' with {len(tracks)} tracks")
            
            # Mock playlist creation
            playlist_id = f"mock_playlist_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            return {
                "playlist_id": playlist_id,
                "playlist_name": name,
                "description": description,
                "track_count": len(tracks),
                "tracks_added": tracks,
                "public": public,
                "external_url": f"https://open.spotify.com/playlist/{playlist_id}",
                "created_at": datetime.now().isoformat(),
                "status": "success"
            }
            
        except Exception as e:
            logger.error(f"Error creating playlist: {e}")
            return {
                "playlist_name": name,
                "error": str(e),
                "status": "error"
            }
    
    async def analyze_listening_data(self, data_file: str, analysis_type: str,
                                   time_range: Optional[str] = None) -> Dict[str, Any]:
        """Analyze user listening patterns from CSV data"""
        
        try:
            logger.info(f"Analyzing listening data from {data_file} - type: {analysis_type}")
            
            # Check if file exists
            if not os.path.exists(data_file):
                return {
                    "data_file": data_file,
                    "error": "File not found",
                    "status": "error"
                }
            
            # Load and analyze data
            df = pd.read_csv(data_file)
            logger.info(f"Loaded {len(df)} records from {data_file}")
            
            analysis_results = {}
            
            if analysis_type == "summary":
                analysis_results = {
                    "total_tracks": len(df),
                    "unique_tracks": df['spotify_track_uri'].nunique() if 'spotify_track_uri' in df.columns else 0,
                    "total_listening_time_ms": df['ms_played_x'].sum() if 'ms_played_x' in df.columns else 0,
                    "date_range": {
                        "earliest": df['ts_x'].min() if 'ts_x' in df.columns else None,
                        "latest": df['ts_x'].max() if 'ts_x' in df.columns else None
                    }
                }
                
            elif analysis_type == "trends":
                # Analyze listening trends over time
                if 'ts_x' in df.columns:
                    df['date'] = pd.to_datetime(df['ts_x']).dt.date
                    daily_counts = df.groupby('date').size()
                    analysis_results = {
                        "daily_listening_pattern": daily_counts.to_dict(),
                        "average_daily_tracks": daily_counts.mean(),
                        "peak_listening_days": daily_counts.nlargest(5).to_dict()
                    }
                
            elif analysis_type == "preferences":
                # Analyze music preferences
                feature_cols = ['Danceability', 'Energy', 'Valence', 'Tempo', 'Acousticness']
                available_features = [col for col in feature_cols if col in df.columns]
                
                if available_features:
                    analysis_results = {
                        "audio_feature_preferences": df[available_features].mean().to_dict(),
                        "feature_ranges": {
                            col: {"min": df[col].min(), "max": df[col].max()}
                            for col in available_features
                        }
                    }
                    
            elif analysis_type == "discovery":
                # Analyze music discovery patterns
                if 'master_metadata_album_artist_name_x' in df.columns:
                    top_artists = df['master_metadata_album_artist_name_x'].value_counts().head(10)
                    analysis_results = {
                        "top_artists": top_artists.to_dict(),
                        "artist_diversity": df['master_metadata_album_artist_name_x'].nunique(),
                        "repeat_listening_rate": len(df) / df['spotify_track_uri'].nunique() if 'spotify_track_uri' in df.columns else 0
                    }
            
            return {
                "data_file": data_file,
                "analysis_type": analysis_type,
                "time_range": time_range,
                "results": analysis_results,
                "analyzed_at": datetime.now().isoformat(),
                "record_count": len(df),
                "status": "success"
            }
            
        except Exception as e:
            logger.error(f"Error analyzing listening data: {e}")
            return {
                "data_file": data_file,
                "analysis_type": analysis_type,
                "error": str(e),
                "status": "error"
            }
    
    async def get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """Get user's music profile and preferences"""
        
        try:
            # Mock user profile
            return {
                "user_id": user_id,
                "profile": {
                    "display_name": f"User {user_id}",
                    "country": "US",
                    "followers": np.random.randint(10, 1000),
                    "subscription_level": "premium"
                },
                "music_taste": {
                    "top_genres": ["pop", "rock", "electronic", "indie"],
                    "audio_feature_preferences": {
                        "danceability": 0.7,
                        "energy": 0.6,
                        "valence": 0.8,
                        "acousticness": 0.3
                    }
                },
                "last_updated": datetime.now().isoformat(),
                "status": "success"
            }
            
        except Exception as e:
            return {
                "user_id": user_id,
                "error": str(e),
                "status": "error"
            }
    
    async def health_check(self) -> Dict[str, Any]:
        """Check server health and API connectivity"""
        
        health_status = {
            "server": "healthy",
            "timestamp": datetime.now().isoformat(),
            "spotify_api": "mock_mode" if self.mock_mode else "connected",
            "credentials_configured": bool(self.client_id and self.client_secret),
            "version": "1.0.0"
        }
        
        return health_status

# MCP Protocol Handler
class MCPHandler:
    """Handle MCP protocol messages"""
    
    def __init__(self):
        self.spotify_server = SpotifyMCPServer()
        
    async def handle_tool_call(self, tool_name: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Handle incoming tool calls"""
        
        try:
            if tool_name == "spotify_get_recommendations":
                return await self.spotify_server.get_recommendations(**parameters)
                
            elif tool_name == "spotify_create_playlist":
                return await self.spotify_server.create_playlist(**parameters)
                
            elif tool_name == "spotify_analyze_listening_data":
                return await self.spotify_server.analyze_listening_data(**parameters)
                
            elif tool_name == "get_user_profile":
                return await self.spotify_server.get_user_profile(**parameters)
                
            elif tool_name == "health_check":
                return await self.spotify_server.health_check()
                
            else:
                return {
                    "error": f"Unknown tool: {tool_name}",
                    "status": "error"
                }
                
        except Exception as e:
            logger.error(f"Error handling tool call {tool_name}: {e}")
            return {
                "tool": tool_name,
                "error": str(e),
                "status": "error"
            }

async def main():
    """Main server entry point"""
    
    logger.info("Starting Spotify MCP Server...")
    
    # Initialize handler
    handler = MCPHandler()
    
    # Perform health check
    health = await handler.spotify_server.health_check()
    logger.info(f"Server health: {health}")
    
    # Test basic functionality
    logger.info("Testing basic functionality...")
    
    # Test recommendations
    recommendations = await handler.handle_tool_call(
        "spotify_get_recommendations",
        {"user_id": "test_user", "limit": 5}
    )
    logger.info(f"Recommendations test: {recommendations['status']}")
    
    # Test playlist creation
    playlist = await handler.handle_tool_call(
        "spotify_create_playlist",
        {"name": "Test Playlist", "tracks": ["spotify:track:1", "spotify:track:2"]}
    )
    logger.info(f"Playlist creation test: {playlist['status']}")
    
    logger.info("Spotify MCP Server is ready!")
    logger.info("Available tools:")
    logger.info("- spotify_get_recommendations")
    logger.info("- spotify_create_playlist") 
    logger.info("- spotify_analyze_listening_data")
    logger.info("- get_user_profile")
    logger.info("- health_check")
    
    # Keep server running
    try:
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        logger.info("Shutting down Spotify MCP Server...")

if __name__ == "__main__":
    asyncio.run(main())