#!/usr/bin/env python3
"""
Comprehensive Tests for Unified LLM Agent

Tests all core functionality including slash command parsing, natural language
processing, model routing, deep reasoning, consensus analysis, and error handling.
"""

import pytest
import asyncio
import json
import sys
import os
from datetime import datetime
from unittest.mock import Mock, patch, AsyncMock

# Add project root to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Mock environment for testing
os.environ.setdefault('GCP_PROJECT_ID', 'test-project-12345')
os.environ.setdefault('GCP_REGION', 'us-central1')

from src.agents.unified_llm_agent import (
    UnifiedLLMAgent,
    SlashCommandParser,
    IntentParser,
    ModelAdapter,
    DeepReasoningEngine,
    ConsensusAnalyzer,
    AgentRequest,
    AgentResponse,
    ModelUsage
)
from src.config.unified_agent_config import UnifiedAgentConfig


class TestSlashCommandParser:
    """Test slash command parsing functionality."""
    
    def test_simple_command(self):
        """Test parsing simple commands."""
        cmd, params = SlashCommandParser.parse("/model-test")
        assert cmd == "model-test"
        assert params == {}
    
    def test_command_with_parameters(self):
        """Test parsing commands with parameters."""
        cmd, params = SlashCommandParser.parse('/model-test prompt="Hello world" temperature=0.7')
        assert cmd == "model-test"
        assert params["prompt"] == "Hello world"
        assert params["temperature"] == "0.7"
    
    def test_command_with_list_parameter(self):
        """Test parsing commands with list parameters."""
        cmd, params = SlashCommandParser.parse('/multi-run models=gemini-pro,claude-opus-4.1 prompt="Test"')
        assert cmd == "multi-run"
        assert params["models"] == ["gemini-pro", "claude-opus-4.1"]
        assert params["prompt"] == "Test"
    
    def test_quoted_parameters(self):
        """Test parsing quoted parameters."""
        cmd, params = SlashCommandParser.parse("/model-test prompt='Complex question with spaces' model=claude")
        assert cmd == "model-test"
        assert params["prompt"] == "Complex question with spaces"
        assert params["model"] == "claude"
    
    def test_invalid_command(self):
        """Test error handling for invalid commands."""
        with pytest.raises(ValueError):
            SlashCommandParser.parse("not-a-slash-command")


class TestIntentParser:
    """Test natural language intent parsing."""
    
    def test_deep_reasoning_intent(self):
        """Test detection of deep reasoning intent."""
        intent = IntentParser.parse_intent("Please deeply analyze the causal factors behind this problem")
        assert intent["mode"] == "deep"
        assert intent["reasoning"] == "deep"
        assert intent["scores"]["deep"] > 0
    
    def test_fast_intent(self):
        """Test detection of fast response intent."""
        intent = IntentParser.parse_intent("Give me a quick summary of machine learning")
        assert intent["mode"] == "lean"
        assert intent["scores"]["fast"] > 0
    
    def test_consensus_intent(self):
        """Test detection of consensus/comparison intent."""
        intent = IntentParser.parse_intent("Compare the advantages of SQL vs NoSQL databases")
        assert intent["consensus"] is True
        assert intent["mode"] == "consensus"
        assert intent["scores"]["consensus"] > 0
    
    def test_default_routing(self):
        """Test default routing for neutral text."""
        intent = IntentParser.parse_intent("What is the weather like today?")
        assert intent["mode"] in ["lean", "deep"]
        assert "confidence" in intent
    
    def test_long_complex_text(self):
        """Test routing for long, complex text."""
        long_text = "Explain the intricate relationships between quantum mechanics and general relativity in the context of unified field theory, considering both theoretical implications and experimental evidence from recent studies in particle physics."
        intent = IntentParser.parse_intent(long_text)
        assert intent["mode"] == "deep"
        assert intent["reasoning"] in ["basic", "deep"]


class TestModelAdapter:
    """Test model adapter functionality."""
    
    @pytest.fixture
    def mock_vertex_service(self):
        """Create a mock Vertex AI service."""
        service = Mock()
        service.generate = AsyncMock()
        return service
    
    @pytest.fixture
    def model_config(self):
        """Create a test model configuration."""
        return UnifiedAgentConfig.MODELS["gemini-pro"]
    
    @pytest.fixture
    def adapter(self, model_config, mock_vertex_service):
        """Create a model adapter for testing."""
        return ModelAdapter(model_config, mock_vertex_service)
    
    @pytest.mark.asyncio
    async def test_successful_invoke(self, adapter, mock_vertex_service):
        """Test successful model invocation."""
        # Mock response
        mock_response = Mock()
        mock_response.content = "Test response"
        mock_response.model = "gemini-2.5-pro"
        mock_response.usage = {"input_tokens": 100, "output_tokens": 150}
        mock_vertex_service.generate.return_value = mock_response
        
        result = await adapter.invoke("Test prompt", {})
        
        assert result["text"] == "Test response"
        assert result["usage"]["input_tokens"] == 100
        assert result["usage"]["output_tokens"] == 150
        assert result["error"] is None
        assert "verification_hash" in result
    
    @pytest.mark.asyncio
    async def test_error_handling(self, adapter, mock_vertex_service):
        """Test error handling in model adapter."""
        mock_vertex_service.generate.side_effect = Exception("API Error")
        
        result = await adapter.invoke("Test prompt", {})
        
        assert result["text"] == ""
        assert result["error"] == "API Error"
        assert result["usage"]["input_tokens"] == 0


class TestConsensusAnalyzer:
    """Test consensus analysis functionality."""
    
    def test_consensus_analysis(self):
        """Test consensus analysis between multiple responses."""
        responses = [
            {
                "text": "Machine learning is a subset of artificial intelligence that enables computers to learn automatically",
                "raw_model": "gemini-pro"
            },
            {
                "text": "Machine learning represents a branch of AI focused on automatic learning from data without explicit programming",
                "raw_model": "claude-opus-4.1"
            }
        ]
        
        result = ConsensusAnalyzer.analyze_consensus(responses, "What is machine learning?")
        
        assert "similarity_score" in result
        assert "common_concepts" in result
        assert "unique_concepts" in result
        assert result["similarity_score"] > 0
    
    def test_insufficient_responses(self):
        """Test consensus analysis with insufficient responses."""
        responses = [{"text": "Single response", "raw_model": "gemini-pro"}]
        
        result = ConsensusAnalyzer.analyze_consensus(responses, "Test prompt")
        
        assert "error" in result


class TestDeepReasoningEngine:
    """Test deep reasoning workflow."""
    
    @pytest.fixture
    def mock_claude_adapter(self):
        """Create a mock Claude adapter."""
        adapter = Mock()
        adapter.invoke = AsyncMock()
        return adapter
    
    @pytest.fixture
    def reasoning_engine(self, mock_claude_adapter):
        """Create a deep reasoning engine for testing."""
        return DeepReasoningEngine(mock_claude_adapter)
    
    @pytest.mark.asyncio
    async def test_reasoning_workflow(self, reasoning_engine, mock_claude_adapter):
        """Test complete reasoning workflow."""
        # Mock responses
        mock_claude_adapter.invoke.side_effect = [
            # Plan response
            {
                "text": '{"steps": [{"id": 1, "objective": "Test step", "approach": "analysis"}]}',
                "latency_ms": 1000
            },
            # Step execution response
            {
                "text": "Step analysis result",
                "latency_ms": 1200,
                "error": None
            }
        ]
        
        result = await reasoning_engine.execute_reasoning("Test complex task")
        
        assert "plan" in result
        assert "execution_results" in result
        assert "reasoning_summary" in result
        assert len(result["reasoning_summary"]) > 0


class TestUnifiedLLMAgent:
    """Test the main unified agent functionality."""
    
    @pytest.fixture
    def mock_vertex_service(self):
        """Create a mock Vertex AI service."""
        service = Mock()
        service.initialize = AsyncMock(return_value=True)
        service.generate = AsyncMock()
        return service
    
    @pytest.fixture
    def agent(self):
        """Create an agent for testing."""
        return UnifiedLLMAgent()
    
    @pytest.mark.asyncio
    async def test_agent_initialization(self, agent):
        """Test agent initialization."""
        with patch.object(agent.vertex_service, 'initialize', return_value=True):
            result = await agent.initialize()
            assert result is True
            assert agent.initialized is True
    
    @pytest.mark.asyncio
    async def test_slash_command_processing(self, agent):
        """Test processing slash commands."""
        agent.initialized = True
        
        # Mock adapter responses
        with patch.object(agent.adapters["gemini-pro"], 'invoke') as mock_invoke:
            mock_invoke.return_value = {
                "text": "Test response",
                "usage": {"input_tokens": 100, "output_tokens": 150},
                "raw_model": "gemini-2.5-pro",
                "request_id": "test-req",
                "latency_ms": 800,
                "verification_hash": "test-hash",
                "error": None
            }
            
            response = await agent.process('/model-test prompt="Hello world"')
            
            assert isinstance(response, AgentResponse)
            assert response.answer == "Test response"
            assert len(response.models_used) == 1
            assert response.models_used[0].model_id == "gemini-2.5-pro"
    
    @pytest.mark.asyncio
    async def test_natural_language_processing(self, agent):
        """Test processing natural language input."""
        agent.initialized = True
        
        with patch.object(agent.adapters["gemini-pro"], 'invoke') as mock_invoke:
            mock_invoke.return_value = {
                "text": "Natural language response",
                "usage": {"input_tokens": 120, "output_tokens": 180},
                "raw_model": "gemini-2.5-pro",
                "request_id": "test-req-2",
                "latency_ms": 750,
                "verification_hash": "test-hash-2",
                "error": None
            }
            
            response = await agent.process("What is machine learning?")
            
            assert isinstance(response, AgentResponse)
            assert "machine learning" in response.answer.lower() or "natural language response" in response.answer
            assert len(response.models_used) >= 1
    
    @pytest.mark.asyncio
    async def test_consensus_mode(self, agent):
        """Test consensus mode with multiple models."""
        agent.initialized = True
        
        # Mock responses from both adapters
        mock_responses = {
            "gemini-pro": {
                "text": "Gemini response about the topic",
                "usage": {"input_tokens": 100, "output_tokens": 150},
                "raw_model": "gemini-2.5-pro",
                "request_id": "gemini-req",
                "latency_ms": 800,
                "verification_hash": "gemini-hash",
                "error": None
            },
            "claude-opus-4.1": {
                "text": "Claude response with detailed analysis",
                "usage": {"input_tokens": 120, "output_tokens": 200},
                "raw_model": "claude-opus-4-1@20250805",
                "request_id": "claude-req", 
                "latency_ms": 1200,
                "verification_hash": "claude-hash",
                "error": None
            }
        }
        
        async def mock_invoke(prompt, params):
            # Return different responses based on which adapter is called
            if "gemini" in str(self):
                return mock_responses["gemini-pro"]
            else:
                return mock_responses["claude-opus-4.1"]
        
        with patch.object(agent.adapters["gemini-pro"], 'invoke', side_effect=mock_invoke):
            with patch.object(agent.adapters["claude-opus-4.1"], 'invoke', side_effect=mock_invoke):
                response = await agent.process("Compare different approaches to this problem")
                
                assert isinstance(response, AgentResponse)
                assert len(response.models_used) >= 1  # At least one model used
                # In consensus mode, we expect analysis of multiple perspectives
    
    @pytest.mark.asyncio
    async def test_error_handling(self, agent):
        """Test error handling in agent processing."""
        agent.initialized = True
        
        # Mock adapter to raise an exception
        with patch.object(agent.adapters["gemini-pro"], 'invoke') as mock_invoke:
            mock_invoke.side_effect = Exception("Test error")
            
            response = await agent.process("Test question")
            
            assert isinstance(response, AgentResponse)
            # Should handle error gracefully and return error response
            assert response.errors is not None or "error" in response.answer.lower()
    
    def test_model_routing_logic(self, agent):
        """Test model routing logic."""
        # Test deep reasoning routing
        request = AgentRequest(prompt="Deep analysis needed", reasoning="deep")
        models = asyncio.run(agent._route_models(request))
        assert "claude-opus-4.1" in models
        
        # Test consensus routing
        request = AgentRequest(prompt="Compare options", consensus=True)
        models = asyncio.run(agent._route_models(request))
        assert len(models) == 2
        
        # Test explicit model specification
        request = AgentRequest(prompt="Test", models=["gemini-flash"])
        models = asyncio.run(agent._route_models(request))
        assert models == ["gemini-flash"]


class TestUnifiedAgentConfig:
    """Test configuration management."""
    
    def test_model_config_retrieval(self):
        """Test retrieving model configurations."""
        config = UnifiedAgentConfig.get_model_config("gemini-pro")
        assert config is not None
        assert config.provider == "vertex"
        assert config.role.value == "fast"
    
    def test_routing_keywords(self):
        """Test routing keyword retrieval."""
        deep_keywords = UnifiedAgentConfig.get_routing_keywords("deep")
        assert "deep" in deep_keywords
        assert "analyze" in deep_keywords
        
        fast_keywords = UnifiedAgentConfig.get_routing_keywords("fast")
        assert "quick" in fast_keywords
        assert "summary" in fast_keywords
    
    def test_cost_estimation(self):
        """Test cost estimation functionality."""
        cost = UnifiedAgentConfig.estimate_cost("gemini-pro", 1000, 1500)
        assert cost > 0
        assert isinstance(cost, float)
        
        # Claude should be more expensive
        claude_cost = UnifiedAgentConfig.estimate_cost("claude-opus-4.1", 1000, 1500)
        assert claude_cost > cost
    
    def test_command_validation(self):
        """Test slash command validation."""
        # Valid command
        result = UnifiedAgentConfig.validate_command("model-test", {"prompt": "test"})
        assert result["valid"] is True
        
        # Invalid command
        result = UnifiedAgentConfig.validate_command("invalid-command", {})
        assert result["valid"] is False
        
        # Missing required parameter
        result = UnifiedAgentConfig.validate_command("model-test", {})
        assert result["valid"] is False
        assert "Missing required parameter" in result["errors"][0]
    
    def test_help_text_generation(self):
        """Test help text generation."""
        help_text = UnifiedAgentConfig.get_help_text()
        assert "Unified LLM Agent" in help_text
        assert "/model-test" in help_text
        assert "/multi-run" in help_text
        assert "gemini-pro" in help_text
        assert "claude-opus-4.1" in help_text


class TestIntegration:
    """Integration tests for complete workflows."""
    
    @pytest.mark.asyncio
    async def test_end_to_end_workflow(self):
        """Test complete end-to-end workflow."""
        agent = UnifiedLLMAgent()
        
        # Mock initialization
        with patch.object(agent.vertex_service, 'initialize', return_value=True):
            await agent.initialize()
        
        # Mock adapter response
        mock_response = {
            "text": "Comprehensive analysis of the requested topic with detailed insights and recommendations.",
            "usage": {"input_tokens": 500, "output_tokens": 800},
            "raw_model": "claude-opus-4-1@20250805",
            "request_id": "integration-test",
            "latency_ms": 1500,
            "verification_hash": "integration-hash",
            "error": None
        }
        
        with patch.object(agent.adapters["claude-opus-4.1"], 'invoke', return_value=mock_response):
            response = await agent.process("Provide a thorough analysis of machine learning bias")
            
            # Verify complete response structure
            assert isinstance(response, AgentResponse)
            assert response.answer is not None
            assert response.run_id is not None
            assert response.mode is not None
            assert len(response.models_used) > 0
            assert response.timestamp is not None
            
            # Verify model usage details
            usage = response.models_used[0]
            assert isinstance(usage, ModelUsage)
            assert usage.model_id is not None
            assert usage.provider is not None
            assert usage.cost_estimate >= 0
            assert usage.verification_hash is not None
    
    @pytest.mark.asyncio
    async def test_performance_under_load(self):
        """Test performance with multiple concurrent requests."""
        agent = UnifiedLLMAgent()
        
        with patch.object(agent.vertex_service, 'initialize', return_value=True):
            await agent.initialize()
        
        mock_response = {
            "text": "Load test response",
            "usage": {"input_tokens": 100, "output_tokens": 150},
            "raw_model": "gemini-2.5-pro",
            "request_id": "load-test",
            "latency_ms": 800,
            "verification_hash": "load-hash",
            "error": None
        }
        
        with patch.object(agent.adapters["gemini-pro"], 'invoke', return_value=mock_response):
            # Run multiple requests concurrently
            tasks = []
            for i in range(5):
                task = agent.process(f"Load test question {i}")
                tasks.append(task)
            
            responses = await asyncio.gather(*tasks)
            
            # Verify all requests completed successfully
            assert len(responses) == 5
            for response in responses:
                assert isinstance(response, AgentResponse)
                assert response.answer is not None


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v", "--tb=short"])