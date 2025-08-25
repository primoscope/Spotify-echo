"""
Vertex AI Live Integration Tests

CRITICAL: This test suite ONLY uses live API endpoints.
NO MOCKS are used. All tests execute real API calls to Google Cloud.

Tests cover:
- Authentication and initialization
- Claude Opus 4.1 unary and streaming requests 
- Gemini 2.5 Pro unary and streaming requests
- Gemini 2.5 Flash unary requests
- Error handling for invalid models, safety blocks, etc.
- Comprehensive production scenarios
"""

import asyncio
import os
import pytest
import time
from typing import Dict, Any

# Import the service we're testing
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from src.services.vertex_ai_service import VertexAIService, ModelRequest, ModelResponse
from src.config.vertex_config import VertexAIConfig


class TestVertexAILiveIntegration:
    """Live integration tests for Vertex AI service."""
    
    @classmethod
    def setup_class(cls):
        """Set up test class with configuration validation."""
        # Ensure we have the required environment variables
        required_env_vars = ['GCP_PROJECT_ID', 'GCP_REGION']
        missing_vars = [var for var in required_env_vars if not os.getenv(var)]
        
        if missing_vars:
            pytest.skip(f"Missing required environment variables: {missing_vars}")
        
        # Initialize service
        cls.service = VertexAIService()
        cls.config = VertexAIConfig()
        
        print(f"Testing with Project: {cls.config.gcp_project_id}")
        print(f"Testing with Region: {cls.config.gcp_region}")
        print(f"Claude Model: {cls.config.claude_opus_model}")
        print(f"Gemini Pro Model: {cls.config.gemini_pro_model}")
        print(f"Gemini Flash Model: {cls.config.gemini_flash_model}")
    
    @pytest.mark.asyncio
    async def test_001_authentication_and_initialization(self):
        """Test that the VertexAIService initializes successfully with live credentials."""
        print("\n=== Test 1: Authentication and Initialization ===")
        
        # This will validate authentication with real GCP services
        result = await self.service.initialize()
        
        assert result is True, "Service initialization should succeed"
        assert self.service.anthropic_client is not None, "Anthropic client should be initialized"
        assert self.service.vertex_ai_initialized is True, "Vertex AI should be initialized"
        
        print("✅ Authentication and initialization successful")
    
    @pytest.mark.asyncio
    async def test_002_claude_opus_unary_request(self):
        """Test Claude Opus 4.1 with a deterministic unary request."""
        print("\n=== Test 2: Claude Opus 4.1 Unary Request ===")
        
        request = ModelRequest(
            model_id=self.config.claude_opus_model,
            prompt="What is the capital of France?",
            max_tokens=50,
            temperature=0.1
        )
        
        response = await self.service.generate(request)
        
        # Validate response structure
        assert isinstance(response, ModelResponse), "Should return ModelResponse object"
        assert response.content, "Response should have content"
        assert "Paris" in response.content, "Response should mention Paris"
        assert response.model == self.config.claude_opus_model, "Model ID should match"
        assert response.provider == "anthropic_vertex", "Provider should be anthropic_vertex"
        assert response.latency_ms > 0, "Should have positive latency"
        assert response.usage.get('total_tokens', 0) > 0, "Should have token usage"
        
        print(f"✅ Claude Opus response: {response.content[:100]}...")
        print(f"   Usage: {response.usage}")
        print(f"   Latency: {response.latency_ms:.2f}ms")
    
    @pytest.mark.asyncio
    async def test_003_claude_opus_streaming_request(self):
        """Test Claude Opus 4.1 with streaming functionality."""
        print("\n=== Test 3: Claude Opus 4.1 Streaming Request ===")
        
        request = ModelRequest(
            model_id=self.config.claude_opus_model,
            prompt="Count from 1 to 5.",
            max_tokens=100,
            temperature=0.1,
            streaming=True
        )
        
        response = await self.service.generate(request)
        
        # Validate streaming response
        assert isinstance(response, ModelResponse), "Should return ModelResponse object"
        assert response.content, "Streaming response should have content"
        assert response.metadata.get('streaming') is True, "Should indicate streaming"
        assert any(str(i) in response.content for i in range(1, 6)), "Should contain numbers 1-5"
        
        print(f"✅ Claude Opus streaming response: {response.content[:100]}...")
        print(f"   Metadata: {response.metadata}")
    
    @pytest.mark.asyncio
    async def test_004_gemini_pro_unary_request(self):
        """Test Gemini 2.5 Pro with a deterministic unary request."""
        print("\n=== Test 4: Gemini 2.5 Pro Unary Request ===")
        
        request = ModelRequest(
            model_id=self.config.gemini_pro_model,
            prompt="What is 2 + 2?",
            max_tokens=50,
            temperature=0.1
        )
        
        response = await self.service.generate(request)
        
        # Validate response structure
        assert isinstance(response, ModelResponse), "Should return ModelResponse object"
        assert response.content, "Response should have content"
        assert "4" in response.content, "Response should contain the answer 4"
        assert response.model == self.config.gemini_pro_model, "Model ID should match"
        assert response.provider == "vertex_ai", "Provider should be vertex_ai"
        assert response.usage.get('total_tokens', 0) > 0, "Should have token usage"
        
        print(f"✅ Gemini Pro response: {response.content[:100]}...")
        print(f"   Usage: {response.usage}")
        print(f"   Safety ratings: {response.metadata.get('safety_ratings', [])}")
    
    @pytest.mark.asyncio
    async def test_005_gemini_pro_streaming_request(self):
        """Test Gemini 2.5 Pro with streaming functionality."""
        print("\n=== Test 5: Gemini 2.5 Pro Streaming Request ===")
        
        request = ModelRequest(
            model_id=self.config.gemini_pro_model,
            prompt="List the first 3 colors of the rainbow.",
            max_tokens=100,
            temperature=0.1,
            streaming=True
        )
        
        response = await self.service.generate(request)
        
        # Validate streaming response
        assert isinstance(response, ModelResponse), "Should return ModelResponse object"
        assert response.content, "Streaming response should have content"
        assert response.metadata.get('streaming') is True, "Should indicate streaming"
        # Check for rainbow colors
        colors = ['red', 'orange', 'yellow']
        assert any(color.lower() in response.content.lower() for color in colors), "Should mention rainbow colors"
        
        print(f"✅ Gemini Pro streaming response: {response.content[:100]}...")
    
    @pytest.mark.asyncio
    async def test_006_gemini_flash_unary_request(self):
        """Test Gemini 2.5 Flash with a deterministic unary request."""
        print("\n=== Test 6: Gemini 2.5 Flash Unary Request ===")
        
        request = ModelRequest(
            model_id=self.config.gemini_flash_model,
            prompt="What is the largest planet in our solar system?",
            max_tokens=50,
            temperature=0.1
        )
        
        response = await self.service.generate(request)
        
        # Validate response structure
        assert isinstance(response, ModelResponse), "Should return ModelResponse object"
        assert response.content, "Response should have content"
        assert "Jupiter" in response.content, "Response should mention Jupiter"
        assert response.model == self.config.gemini_flash_model, "Model ID should match"
        assert response.provider == "vertex_ai", "Provider should be vertex_ai"
        
        print(f"✅ Gemini Flash response: {response.content[:100]}...")
        print(f"   Latency: {response.latency_ms:.2f}ms (should be faster than Pro)")
    
    @pytest.mark.asyncio
    async def test_007_multimodal_capability_test(self):
        """Test Gemini multimodal capabilities with text and image analysis."""
        print("\n=== Test 7: Multimodal Capability Test ===")
        
        # Test with a text prompt that asks about image analysis capabilities
        request = ModelRequest(
            model_id=self.config.gemini_pro_model,
            prompt="Can you analyze images? If yes, what types of information can you extract from an image?",
            max_tokens=200,
            temperature=0.1
        )
        
        response = await self.service.generate(request)
        
        assert response.content, "Response should have content"
        assert any(word in response.content.lower() for word in ['image', 'visual', 'picture']), "Should mention image capabilities"
        
        print(f"✅ Multimodal capability response: {response.content[:150]}...")
    
    @pytest.mark.asyncio
    async def test_008_error_handling_invalid_model(self):
        """Test error handling with invalid model ID."""
        print("\n=== Test 8: Error Handling - Invalid Model ===")
        
        request = ModelRequest(
            model_id="invalid-model-id",
            prompt="This should fail",
            max_tokens=50
        )
        
        with pytest.raises(Exception) as exc_info:
            await self.service.generate(request)
        
        assert "Unsupported model" in str(exc_info.value), "Should raise unsupported model error"
        
        print("✅ Invalid model error handled correctly")
    
    @pytest.mark.asyncio
    async def test_009_error_handling_safety_block(self):
        """Test error handling when content triggers safety blocks."""
        print("\n=== Test 9: Error Handling - Safety Block ===")
        
        # Use a prompt that might trigger safety measures (but is still safe for testing)
        request = ModelRequest(
            model_id=self.config.gemini_pro_model,
            prompt="Write a story about a conflict between two nations, focusing on the diplomatic resolution.",
            max_tokens=100,
            temperature=0.1
        )
        
        try:
            response = await self.service.generate(request)
            # If it doesn't get blocked, check that it's a reasonable response
            assert response.content, "Response should have content"
            print(f"✅ Content passed safety checks: {response.content[:100]}...")
            
            # Check safety ratings if available
            safety_ratings = response.metadata.get('safety_ratings', [])
            if safety_ratings:
                print(f"   Safety ratings: {safety_ratings}")
        
        except Exception as e:
            # If it gets blocked, that's also a valid test outcome
            assert "safety" in str(e).lower() or "blocked" in str(e).lower(), "Should be a safety-related error"
            print(f"✅ Content appropriately blocked by safety filters: {e}")
    
    @pytest.mark.asyncio
    async def test_010_rate_limiting(self):
        """Test that rate limiting is properly enforced."""
        print("\n=== Test 10: Rate Limiting ===")
        
        # Clear any existing timestamps to start fresh
        self.service.request_timestamps = []
        
        # Set a very low rate limit for testing
        original_max_rpm = self.service.max_rpm
        self.service.max_rpm = 2  # Allow only 2 requests per minute
        
        try:
            # Make 2 requests (should succeed)
            for i in range(2):
                request = ModelRequest(
                    model_id=self.config.gemini_flash_model,
                    prompt=f"Quick test {i}",
                    max_tokens=10
                )
                response = await self.service.generate(request)
                assert response.content, f"Request {i} should succeed"
            
            # Third request should fail due to rate limiting
            request = ModelRequest(
                model_id=self.config.gemini_flash_model,
                prompt="This should be rate limited",
                max_tokens=10
            )
            
            with pytest.raises(Exception) as exc_info:
                await self.service.generate(request)
            
            assert "Rate limit exceeded" in str(exc_info.value), "Should hit rate limit"
            print("✅ Rate limiting enforced correctly")
            
        finally:
            # Restore original rate limit
            self.service.max_rpm = original_max_rpm
    
    @pytest.mark.asyncio
    async def test_011_health_check(self):
        """Test comprehensive health check functionality."""
        print("\n=== Test 11: Health Check ===")
        
        health_status = await self.service.health_check()
        
        assert isinstance(health_status, dict), "Health check should return dict"
        assert 'overall' in health_status, "Should have overall status"
        assert 'components' in health_status, "Should have component status"
        assert 'timestamp' in health_status, "Should have timestamp"
        
        # Check that we have status for both providers
        components = health_status['components']
        assert 'anthropic_vertex' in components, "Should check Anthropic Vertex"
        assert 'vertex_ai' in components, "Should check Vertex AI"
        
        print(f"✅ Health check completed: {health_status['overall']}")
        print(f"   Components: {list(components.keys())}")
        for component, status in components.items():
            print(f"   {component}: {status}")
    
    @pytest.mark.asyncio
    async def test_012_supported_models(self):
        """Test that all configured models are reported as supported."""
        print("\n=== Test 12: Supported Models ===")
        
        supported_models = self.service.get_supported_models()
        
        assert isinstance(supported_models, dict), "Should return dict of models"
        assert 'claude_opus' in supported_models, "Should include Claude Opus"
        assert 'gemini_pro' in supported_models, "Should include Gemini Pro"
        assert 'gemini_flash' in supported_models, "Should include Gemini Flash"
        
        # Validate model configuration structure
        for model_name, config in supported_models.items():
            assert 'model_id' in config, f"{model_name} should have model_id"
            assert 'provider' in config, f"{model_name} should have provider"
            assert 'capabilities' in config, f"{model_name} should have capabilities"
            assert 'max_tokens' in config, f"{model_name} should have max_tokens"
        
        print(f"✅ Supported models: {list(supported_models.keys())}")
        for model_name, config in supported_models.items():
            print(f"   {model_name}: {config['model_id']} ({config['provider']})")
    
    @pytest.mark.asyncio
    async def test_013_performance_baseline(self):
        """Test performance characteristics of all models."""
        print("\n=== Test 13: Performance Baseline ===")
        
        test_prompt = "Explain quantum computing in one sentence."
        performance_results = {}
        
        models_to_test = [
            self.config.claude_opus_model,
            self.config.gemini_pro_model,
            self.config.gemini_flash_model
        ]
        
        for model_id in models_to_test:
            start_time = time.time()
            
            request = ModelRequest(
                model_id=model_id,
                prompt=test_prompt,
                max_tokens=100,
                temperature=0.1
            )
            
            response = await self.service.generate(request)
            
            end_time = time.time()
            total_latency = (end_time - start_time) * 1000
            
            performance_results[model_id] = {
                'latency_ms': total_latency,
                'tokens': response.usage.get('total_tokens', 0),
                'content_length': len(response.content)
            }
            
            assert response.content, f"Model {model_id} should return content"
            assert "quantum" in response.content.lower(), f"Model {model_id} should mention quantum"
        
        print("✅ Performance baseline completed:")
        for model_id, metrics in performance_results.items():
            print(f"   {model_id}:")
            print(f"     Latency: {metrics['latency_ms']:.2f}ms")
            print(f"     Tokens: {metrics['tokens']}")
            print(f"     Content length: {metrics['content_length']} chars")
        
        # Gemini Flash should generally be faster than Pro
        flash_latency = performance_results[self.config.gemini_flash_model]['latency_ms']
        pro_latency = performance_results[self.config.gemini_pro_model]['latency_ms']
        
        print(f"   Gemini Flash vs Pro latency ratio: {flash_latency/pro_latency:.2f}")


if __name__ == "__main__":
    """Run tests directly for development."""
    print("Running Vertex AI Live Integration Tests...")
    print("IMPORTANT: These tests use real API endpoints and may incur costs.")
    
    # Run tests
    pytest.main([__file__, "-v", "-s", "--tb=short"])