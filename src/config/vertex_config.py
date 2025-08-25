"""
Vertex AI Configuration Module

Provides production-ready configuration management for Vertex AI integration
using Pydantic BaseSettings for secure environment variable handling.
"""

import os
from typing import Optional
from pydantic import Field, field_validator, ConfigDict
from pydantic_settings import BaseSettings


class VertexAIConfig(BaseSettings):
    """Configuration for Vertex AI integration with validation."""
    
    # GCP Configuration
    gcp_project_id: str = Field(..., env='GCP_PROJECT_ID')
    gcp_region: str = Field(default='us-central1', env='GCP_REGION')
    
    # Model Configuration with versioned IDs
    claude_opus_model: str = Field(
        default='claude-opus-4-1@20250805', 
        env='CLAUDE_OPUS_MODEL_ID'
    )
    gemini_pro_model: str = Field(
        default='gemini-2.5-pro', 
        env='GEMINI_PRO_MODEL_ID'
    )
    gemini_flash_model: str = Field(
        default='gemini-2.5-flash', 
        env='GEMINI_FLASH_MODEL_ID'
    )
    
    # Authentication Configuration
    google_application_credentials: Optional[str] = Field(
        default=None, 
        env='GOOGLE_APPLICATION_CREDENTIALS'
    )
    
    # Operational Configuration
    request_timeout: int = Field(default=120, env='VERTEX_REQUEST_TIMEOUT')
    max_retries: int = Field(default=3, env='VERTEX_MAX_RETRIES')
    retry_delay: float = Field(default=1.0, env='VERTEX_RETRY_DELAY')
    
    # Rate Limiting
    max_requests_per_minute: int = Field(default=60, env='VERTEX_MAX_RPM')
    
    # Safety and Content Settings
    enable_safety_settings: bool = Field(default=True, env='VERTEX_ENABLE_SAFETY')
    
    model_config = ConfigDict(
        env_file='.env',
        env_file_encoding='utf-8',
        case_sensitive=False,
        extra='ignore'  # Ignore extra fields from .env
    )
    
    @field_validator('gcp_project_id')
    @classmethod
    def validate_project_id(cls, v):
        """Validate GCP project ID format."""
        if not v:
            raise ValueError('GCP Project ID is required')
        if not v.replace('-', '').replace('_', '').isalnum():
            raise ValueError('Invalid GCP Project ID format')
        return v
    
    @field_validator('gcp_region')
    @classmethod
    def validate_region(cls, v):
        """Validate GCP region format."""
        valid_regions = [
            'us-central1', 'us-east1', 'us-east4', 'us-east5',
            'us-west1', 'us-west2', 'us-west3', 'us-west4',
            'europe-west1', 'europe-west2', 'europe-west3', 'europe-west4',
            'asia-east1', 'asia-northeast1', 'asia-southeast1'
        ]
        if v not in valid_regions:
            raise ValueError(f'Region {v} not supported. Use one of: {valid_regions}')
        return v
    
    @field_validator('claude_opus_model')
    @classmethod
    def validate_claude_model(cls, v):
        """Validate Claude model ID format."""
        if not v.startswith('claude-opus-4-1'):
            raise ValueError('Claude Opus 4.1 model ID must start with "claude-opus-4-1"')
        return v
    
    @field_validator('gemini_pro_model', 'gemini_flash_model')
    @classmethod
    def validate_gemini_model(cls, v):
        """Validate Gemini model ID format."""
        if not v.startswith('gemini-2.5-'):
            raise ValueError('Gemini 2.5 model ID must start with "gemini-2.5-"')
        return v
    
    def get_anthropic_vertex_config(self) -> dict:
        """Get configuration for AnthropicVertex client."""
        return {
            'project_id': self.gcp_project_id,
            'region': self.gcp_region,
        }
    
    def get_vertex_ai_config(self) -> dict:
        """Get configuration for VertexAI client."""
        return {
            'project': self.gcp_project_id,
            'location': self.gcp_region,
        }
    
    def get_model_configs(self) -> dict:
        """Get all model configurations."""
        return {
            'claude_opus': {
                'model_id': self.claude_opus_model,
                'provider': 'anthropic_vertex',
                'capabilities': ['chat', 'streaming', 'multimodal'],
                'max_tokens': 200000,
                'context_window': 200000
            },
            'gemini_pro': {
                'model_id': self.gemini_pro_model,
                'provider': 'vertex_ai',
                'capabilities': ['chat', 'streaming', 'multimodal'],
                'max_tokens': 32768,
                'context_window': 32768
            },
            'gemini_flash': {
                'model_id': self.gemini_flash_model,
                'provider': 'vertex_ai',
                'capabilities': ['chat', 'streaming', 'multimodal'],
                'max_tokens': 8192,
                'context_window': 32768
            }
        }


# Global configuration instance
config = VertexAIConfig()