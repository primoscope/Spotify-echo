"""
Vertex AI Service

Production-ready Vertex AI integration supporting:
- Anthropic Claude Opus 4.1 via anthropic[vertex] SDK
- Google Gemini 2.5 Pro and Flash via google-cloud-aiplatform

Features:
- Live endpoint validation (NO MOCKS)
- Comprehensive error handling
- Rate limiting and quota management
- Authentication management
- Idempotent operations
"""

import asyncio
import logging
import time
from typing import Dict, List, Optional, Union, AsyncGenerator, Any
from dataclasses import dataclass
from enum import Enum

import google.cloud.aiplatform as aiplatform
from anthropic import AnthropicVertex
from google.cloud import aiplatform_v1
from google.auth.exceptions import DefaultCredentialsError
from google.api_core import exceptions as gcp_exceptions
import vertexai
from vertexai.generative_models import GenerativeModel, SafetySetting, HarmCategory, HarmBlockThreshold

from ..config.vertex_config import config

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ModelProvider(Enum):
    """Supported model providers."""
    ANTHROPIC_VERTEX = "anthropic_vertex"
    VERTEX_AI = "vertex_ai"


@dataclass
class ModelRequest:
    """Request structure for model interactions."""
    model_id: str
    prompt: Union[str, List[Dict[str, str]]]
    max_tokens: Optional[int] = None
    temperature: Optional[float] = None
    streaming: bool = False
    multimodal_inputs: Optional[List[Any]] = None


@dataclass
class ModelResponse:
    """Standardized response structure."""
    content: str
    model: str
    usage: Dict[str, int]
    metadata: Dict[str, Any]
    provider: str
    latency_ms: float


class VertexAIService:
    """
    Unified Vertex AI service for Claude Opus 4.1 and Gemini 2.5 models.
    
    Provides production-ready access with comprehensive error handling,
    authentication management, and live endpoint validation.
    """
    
    def __init__(self, config_override: Optional[Dict] = None):
        """Initialize the Vertex AI service."""
        self.config = config
        if config_override:
            # Apply config overrides for testing
            for key, value in config_override.items():
                setattr(self.config, key, value)
        
        self.anthropic_client: Optional[AnthropicVertex] = None
        self.vertex_ai_initialized = False
        self.model_cache: Dict[str, Any] = {}
        self._model_cache_lock = asyncio.Lock()
        
        # Rate limiting
        self.request_timestamps: List[float] = []
        self.max_rpm = self.config.max_requests_per_minute
        
        logger.info(f"Initializing VertexAIService for project: {self.config.gcp_project_id}")
    
    async def initialize(self) -> bool:
        """
        Initialize all Vertex AI clients and validate authentication.
        
        Returns:
            bool: True if initialization successful
            
        Raises:
            Exception: If authentication or initialization fails
        """
        try:
            logger.info("Initializing Vertex AI service...")
            
            # Initialize general Vertex AI
            await self._initialize_vertex_ai()
            
            # Initialize Anthropic Vertex client
            await self._initialize_anthropic_vertex()
            
            # Validate access to all models
            await self._validate_model_access()
            
            logger.info("✅ Vertex AI service initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Vertex AI service: {e}")
            raise
    
    async def _initialize_vertex_ai(self) -> None:
        """Initialize the general Vertex AI connection."""
        try:
            # Initialize aiplatform
            aiplatform.init(
                project=self.config.gcp_project_id,
                location=self.config.gcp_region
            )
            
            # Initialize vertexai for generative models
            vertexai.init(
                project=self.config.gcp_project_id,
                location=self.config.gcp_region
            )
            
            self.vertex_ai_initialized = True
            logger.info(f"✅ Vertex AI initialized: {self.config.gcp_project_id}/{self.config.gcp_region}")
            
        except DefaultCredentialsError as e:
            logger.error("❌ Google Cloud credentials not found. Please set up authentication.")
            raise Exception(f"Authentication failed: {e}")
        except Exception as e:
            logger.error(f"❌ Failed to initialize Vertex AI: {e}")
            raise
    
    async def _initialize_anthropic_vertex(self) -> None:
        """Initialize the Anthropic Vertex client."""
        try:
            self.anthropic_client = AnthropicVertex(
                region=self.config.gcp_region,
                project_id=self.config.gcp_project_id
            )
            logger.info("✅ Anthropic Vertex client initialized")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Anthropic Vertex client: {e}")
            raise
    
    async def _validate_model_access(self) -> None:
        """Validate access to all configured models with live API calls."""
        logger.info("Validating model access with live API calls...")
        
        models_to_validate = [
            (self.config.claude_opus_model, ModelProvider.ANTHROPIC_VERTEX),
            (self.config.gemini_pro_model, ModelProvider.VERTEX_AI),
            (self.config.gemini_flash_model, ModelProvider.VERTEX_AI)
        ]
        
        for model_id, provider in models_to_validate:
            try:
                # Make a minimal test request to validate access
                test_request = ModelRequest(
                    model_id=model_id,
                    prompt="Hello",
                    max_tokens=10,
                    temperature=0.1
                )
                
                response = await self.generate(test_request)
                logger.info(f"✅ Model access validated: {model_id}")
                
            except Exception as e:
                logger.error(f"❌ Failed to validate access to model {model_id}: {e}")
                # Don't raise here - log and continue to validate other models
    
    def _check_rate_limit(self) -> None:
        """Check and enforce rate limiting."""
        current_time = time.time()
        
        # Remove timestamps older than 1 minute
        self.request_timestamps = [
            ts for ts in self.request_timestamps 
            if current_time - ts < 60
        ]
        
        if len(self.request_timestamps) >= self.max_rpm:
            raise Exception(f"Rate limit exceeded: {self.max_rpm} requests per minute")
        
        self.request_timestamps.append(current_time)
    
    async def generate(self, request: ModelRequest) -> ModelResponse:
        """
        Generate response using the appropriate model.
        
        Args:
            request: ModelRequest containing model_id, prompt, and options
            
        Returns:
            ModelResponse with standardized response format
            
        Raises:
            Exception: For authentication, rate limiting, or API errors
        """
        self._check_rate_limit()
        
        start_time = time.time()
        
        try:
            # Determine provider based on model
            if request.model_id.startswith('claude-opus'):
                provider = ModelProvider.ANTHROPIC_VERTEX
                response_content = await self._call_claude(request)
            elif request.model_id.startswith('gemini-2.5-'):
                provider = ModelProvider.VERTEX_AI
                response_content = await self._call_gemini(request)
            else:
                raise ValueError(f"Unsupported model: {request.model_id}")
            
            latency_ms = (time.time() - start_time) * 1000
            
            return ModelResponse(
                content=response_content.get('content', ''),
                model=request.model_id,
                usage=response_content.get('usage', {}),
                metadata=response_content.get('metadata', {}),
                provider=provider.value,
                latency_ms=latency_ms
            )
            
        except gcp_exceptions.PermissionDenied as e:
            logger.error(f"❌ Permission denied for model {request.model_id}: {e}")
            raise Exception(f"Permission denied: {e}")
        except gcp_exceptions.NotFound as e:
            logger.error(f"❌ Model not found: {request.model_id}: {e}")
            raise Exception(f"Model not found: {e}")
        except gcp_exceptions.ResourceExhausted as e:
            logger.error(f"❌ Quota exceeded for model {request.model_id}: {e}")
            raise Exception(f"Quota exceeded: {e}")
        except Exception as e:
            logger.error(f"❌ Error generating response: {e}")
            raise
    
    async def _call_claude(self, request: ModelRequest) -> Dict[str, Any]:
        """
        Call Claude Opus 4.1 via Anthropic Vertex SDK.
        
        Args:
            request: ModelRequest for Claude
            
        Returns:
            Dict containing response content, usage, and metadata
        """
        if not self.anthropic_client:
            raise Exception("Anthropic Vertex client not initialized")
        
        try:
            # Format prompt for Anthropic Messages API
            if isinstance(request.prompt, str):
                messages = [{"role": "user", "content": request.prompt}]
            else:
                messages = request.prompt
            
            # Prepare request parameters
            params = {
                "model": request.model_id,
                "messages": messages,
                "max_tokens": request.max_tokens or 1000,
            }
            
            if request.temperature is not None:
                params["temperature"] = request.temperature
            
            if request.streaming:
                return await self._call_claude_streaming(params)
            else:
                # Synchronous request
                response = await asyncio.to_thread(
                    self.anthropic_client.messages.create,
                    **params
                )
                
                return {
                    'content': response.content[0].text if response.content else '',
                    'usage': {
                        'input_tokens': response.usage.input_tokens,
                        'output_tokens': response.usage.output_tokens,
                        'total_tokens': response.usage.input_tokens + response.usage.output_tokens
                    },
                    'metadata': {
                        'model': response.model,
                        'stop_reason': response.stop_reason,
                        'role': response.role
                    }
                }
                
        except Exception as e:
            logger.error(f"❌ Claude API error: {e}")
            raise
    
    async def _call_claude_streaming(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle Claude streaming responses."""
        try:
            content_parts = []
            total_tokens = 0
            
            def stream_handler():
                return self.anthropic_client.messages.create(
                    stream=True,
                    **params
                )
            
            stream = await asyncio.to_thread(stream_handler)
            
            for chunk in stream:
                if hasattr(chunk, 'delta') and hasattr(chunk.delta, 'text'):
                    content_parts.append(chunk.delta.text)
                if hasattr(chunk, 'usage'):
                    total_tokens = chunk.usage.output_tokens
            
            return {
                'content': ''.join(content_parts),
                'usage': {'output_tokens': total_tokens, 'total_tokens': total_tokens},
                'metadata': {'streaming': True}
            }
            
        except Exception as e:
            logger.error(f"❌ Claude streaming error: {e}")
            raise
    
    async def _call_gemini(self, request: ModelRequest) -> Dict[str, Any]:
        """
        Call Gemini 2.5 Pro/Flash via Vertex AI SDK.
        
        Args:
            request: ModelRequest for Gemini
            
        Returns:
            Dict containing response content, usage, and metadata
        """
        if not self.vertex_ai_initialized:
            raise Exception("Vertex AI not initialized")
        
        try:
            # Get or create model instance
            model = await self._get_gemini_model_async(request.model_id)
            
            # Prepare generation config
            generation_config = {
                "max_output_tokens": request.max_tokens or 2000,
                "temperature": request.temperature or 0.7,
                "top_p": 0.8,
                "top_k": 10
            }
            
            # Prepare safety settings
            safety_settings = self._get_safety_settings() if self.config.enable_safety_settings else None
            
            if request.streaming:
                return await self._call_gemini_streaming(model, request.prompt, generation_config, safety_settings)
            else:
                # Synchronous request
                response = await asyncio.to_thread(
                    model.generate_content,
                    request.prompt,
                    generation_config=generation_config,
                    safety_settings=safety_settings
                )
                
                usage_md = getattr(response, "usage_metadata", None)
                prompt_tokens = getattr(usage_md, "prompt_token_count", 0) if usage_md else 0
                candidate_tokens = getattr(usage_md, "candidates_token_count", 0) if usage_md else 0
                total_tokens = getattr(usage_md, "total_token_count", prompt_tokens + candidate_tokens) if usage_md else (prompt_tokens + candidate_tokens)
                candidates = getattr(response, "candidates", []) or []
                finish_reason = 'unknown'
                safety_ratings = []
                if candidates:
                    first = candidates[0]
                    finish_reason = getattr(getattr(first, "finish_reason", None), "name", 'unknown') or 'unknown'
                    sr = getattr(first, "safety_ratings", None)
                    if sr:
                        safety_ratings = [
                            {
                                'category': getattr(rating.category, "name", str(rating.category)),
                                'probability': getattr(rating.probability, "name", str(rating.probability))
                            }
                            for rating in sr
                        ]
                return {
                    'content': getattr(response, "text", "") or "",
                    'usage': {
                        'input_tokens': prompt_tokens,
                        'output_tokens': candidate_tokens,
                        'total_tokens': total_tokens
                    },
                    'metadata': {
                        'model': request.model_id,
                        'finish_reason': finish_reason,
                        'safety_ratings': safety_ratings
                    }
                }
                
        except Exception as e:
            logger.error(f"❌ Gemini API error: {e}")
            raise
    
    async def _call_gemini_streaming(self, model: Any, prompt: str, generation_config: Dict, safety_settings: Optional[List]) -> Dict[str, Any]:
        """Handle Gemini streaming responses."""
        try:
            content_parts = []
            total_tokens = 0
            
            def stream_handler():
                return model.generate_content(
                    prompt,
                    generation_config=generation_config,
                    safety_settings=safety_settings,
                    stream=True
                )
            
            stream = await asyncio.to_thread(stream_handler)
            
            for chunk in stream:
                if chunk.text:
                    content_parts.append(chunk.text)
                if hasattr(chunk, 'usage_metadata'):
                    total_tokens = chunk.usage_metadata.total_token_count
            
            return {
                'content': ''.join(content_parts),
                'usage': {'total_tokens': total_tokens},
                'metadata': {'streaming': True}
            }
            
        except Exception as e:
            logger.error(f"❌ Gemini streaming error: {e}")
            raise
    
    async def _get_gemini_model_async(self, model_id: str) -> Any:
        """Get or create Gemini model instance with caching (async-safe)."""
        async with self._model_cache_lock:
            if model_id not in self.model_cache:
                try:
                    self.model_cache[model_id] = GenerativeModel(model_id)
                    logger.info(f"✅ Created Gemini model instance: {model_id}")
                except Exception as e:
                    logger.error(f"❌ Failed to create Gemini model {model_id}: {e}")
                    raise
            return self.model_cache[model_id]
    
    def _get_safety_settings(self) -> List[SafetySetting]:
        """Get safety settings for Gemini models."""
        return [
            SafetySetting(
                category=HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold=HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
            ),
            SafetySetting(
                category=HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold=HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
            ),
            SafetySetting(
                category=HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold=HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
            ),
            SafetySetting(
                category=HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold=HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
            )
        ]
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Perform comprehensive health check of all services.
        
        Returns:
            Dict with health status of all components
        """
        health_status = {
            'overall': 'healthy',
            'timestamp': time.time(),
            'components': {}
        }
        
        try:
            # Check Anthropic Vertex
            if self.anthropic_client:
                try:
                    test_request = ModelRequest(
                        model_id=self.config.claude_opus_model,
                        prompt="Health check",
                        max_tokens=5
                    )
                    await self.generate(test_request)
                    health_status['components']['anthropic_vertex'] = 'healthy'
                except Exception as e:
                    health_status['components']['anthropic_vertex'] = f'unhealthy: {e}'
                    health_status['overall'] = 'degraded'
            
            # Check Vertex AI
            if self.vertex_ai_initialized:
                try:
                    test_request = ModelRequest(
                        model_id=self.config.gemini_flash_model,
                        prompt="Health check",
                        max_tokens=5
                    )
                    await self.generate(test_request)
                    health_status['components']['vertex_ai'] = 'healthy'
                except Exception as e:
                    health_status['components']['vertex_ai'] = f'unhealthy: {e}'
                    health_status['overall'] = 'degraded'
            
            return health_status
            
        except Exception as e:
            health_status['overall'] = 'unhealthy'
            health_status['error'] = str(e)
            return health_status
    
    def get_supported_models(self) -> Dict[str, Any]:
        """Get information about all supported models."""
        return self.config.get_model_configs()


# Global service instance
vertex_service = VertexAIService()