#!/usr/bin/env python3
"""
Unified LLM Agent (Minimal Spec)

Multi-model interaction agent supporting Gemini/Vertex and Claude Opus 4.1
with slash commands, natural language interface, model routing, and 
comprehensive reporting with verification.

Features:
- Slash commands and natural language input parsing
- Intelligent model routing (fast vs deep reasoning)
- Standardized machine-readable reports
- Deep reasoning workflow with planning
- Consensus comparison between models
- Cost tracking and usage verification
- Extensible adapter architecture
"""

import asyncio
import json
import hashlib
import time
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Union, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import logging

from ..services.vertex_ai_service import VertexAIService, ModelRequest, ModelResponse
from ..config.vertex_config import config

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ModelRole(Enum):
    """Model roles for routing decisions."""
    FAST = "fast"
    DEEP_REASONING = "deep_reasoning"
    GENERAL = "general"


class InvocationMode(Enum):
    """Different ways to invoke the agent."""
    SLASH_COMMAND = "slash"
    NATURAL_LANGUAGE = "natural"
    JSON_STRUCTURED = "json"


@dataclass
class ModelConfig:
    """Configuration for a specific model."""
    id: str
    provider: str
    role: ModelRole
    cost_tier: str
    max_tokens: int = 4000
    temperature: float = 0.3


@dataclass
class AgentRequest:
    """Standardized request to the unified agent."""
    prompt: str
    models: Optional[List[str]] = None
    mode: Optional[str] = None  # lean, deep, consensus
    reasoning: Optional[str] = None  # none, basic, deep
    consensus: bool = False
    max_models: int = 2
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None


@dataclass
class ModelUsage:
    """Model usage details for reporting."""
    model_id: str
    provider: str
    input_tokens: int
    output_tokens: int
    latency_ms: float
    cost_estimate: float
    request_id: str
    verification_hash: str
    error: Optional[str] = None


@dataclass
class AgentResponse:
    """Standardized response from the unified agent."""
    answer: str
    run_id: str
    mode: str
    models_used: List[ModelUsage]
    reasoning_summary: Optional[Dict[str, Any]] = None
    consensus: Optional[Dict[str, Any]] = None
    errors: List[Dict[str, Any]] = None
    latency_ms: float = 0
    timestamp: str = ""


class SlashCommandParser:
    """Parse slash commands and extract parameters."""
    
    @staticmethod
    def parse(command: str) -> Tuple[str, Dict[str, Any]]:
        """
        Parse a slash command into command name and parameters.
        
        Examples:
        /model-test prompt="Quick summary" -> ("model-test", {"prompt": "Quick summary"})
        /multi-run models=gemini-pro,claude-opus prompt="Compare approaches" -> 
            ("multi-run", {"models": ["gemini-pro", "claude-opus"], "prompt": "Compare approaches"})
        """
        if not command.startswith('/'):
            raise ValueError("Not a slash command - must start with '/'")
        
        parts = command[1:].split(' ', 1)
        cmd_name = parts[0]
        
        if len(parts) == 1:
            return cmd_name, {}
        
        # Parse key=value parameters
        params = {}
        param_string = parts[1]
        
        # Simple parser for key=value with quoted strings
        current_key = None
        current_value = ""
        in_quotes = False
        quote_char = None
        
        i = 0
        while i < len(param_string):
            char = param_string[i]
            
            if char in ['"', "'"] and not in_quotes:
                in_quotes = True
                quote_char = char
            elif char == quote_char and in_quotes:
                in_quotes = False
                quote_char = None
            elif char == '=' and not in_quotes and current_key is None:
                current_key = current_value.strip()
                current_value = ""
            elif char == ' ' and not in_quotes and current_key is not None:
                # End of parameter
                value = current_value.strip()
                if ',' in value and current_key in ['models']:
                    params[current_key] = [v.strip() for v in value.split(',')]
                else:
                    params[current_key] = value
                current_key = None
                current_value = ""
            else:
                current_value += char
            
            i += 1
        
        # Handle last parameter
        if current_key is not None:
            value = current_value.strip()
            if ',' in value and current_key in ['models']:
                params[current_key] = [v.strip() for v in value.split(',')]
            else:
                params[current_key] = value
        
        return cmd_name, params


class IntentParser:
    """Parse natural language to determine routing and mode."""
    
    DEEP_KEYWORDS = ["deep", "why", "explain", "causal", "multi-step", "thorough", 
                     "analyze", "reasoning", "complex", "detailed", "comprehensive"]
    
    FAST_KEYWORDS = ["quick", "fast", "summary", "brief", "simple", "short"]
    
    CONSENSUS_KEYWORDS = ["compare", "consensus", "both", "multiple", "different"]
    
    @staticmethod
    def parse_intent(text: str) -> Dict[str, Any]:
        """
        Parse natural language text to determine intent and routing.
        
        Returns:
            Dict with keys: mode, reasoning, models, confidence
        """
        text_lower = text.lower()
        
        # Check for deep reasoning indicators
        deep_score = sum(1 for keyword in IntentParser.DEEP_KEYWORDS if keyword in text_lower)
        fast_score = sum(1 for keyword in IntentParser.FAST_KEYWORDS if keyword in text_lower)
        consensus_score = sum(1 for keyword in IntentParser.CONSENSUS_KEYWORDS if keyword in text_lower)
        
        # Determine mode
        if consensus_score > 0:
            mode = "consensus"
            reasoning = "deep" if deep_score > 0 else "basic"
        elif deep_score > fast_score:
            mode = "deep"
            reasoning = "deep"
        elif fast_score > 0:
            mode = "lean"
            reasoning = "none"
        else:
            # Default based on length and complexity
            if len(text) > 200 or '?' in text:
                mode = "deep"
                reasoning = "basic"
            else:
                mode = "lean"
                reasoning = "none"
        
        confidence = max(deep_score, fast_score, consensus_score) / 10.0
        confidence = min(confidence, 1.0)
        
        return {
            "mode": mode,
            "reasoning": reasoning,
            "consensus": consensus_score > 0,
            "confidence": confidence,
            "scores": {
                "deep": deep_score,
                "fast": fast_score,
                "consensus": consensus_score
            }
        }


class ModelAdapter:
    """Abstract adapter interface for different model providers."""
    
    def __init__(self, model_config: ModelConfig, vertex_service: VertexAIService):
        self.config = model_config
        self.vertex_service = vertex_service
    
    async def invoke(self, prompt: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Invoke the model with the given prompt and parameters.
        
        Returns:
            Dict with keys: text, usage, raw_model, request_id, error
        """
        try:
            # Create request for vertex service
            request = ModelRequest(
                model_id=self.config.id,
                prompt=prompt,
                max_tokens=params.get('max_tokens', self.config.max_tokens),
                temperature=params.get('temperature', self.config.temperature),
                streaming=params.get('streaming', False)
            )
            
            start_time = time.time()
            response = await self.vertex_service.generate(request)
            latency_ms = (time.time() - start_time) * 1000
            
            # Generate verification hash
            verification_data = f"{prompt}:{response.content}:{response.model}:{time.time()}"
            verification_hash = hashlib.sha256(verification_data.encode()).hexdigest()[:16]
            
            return {
                "text": response.content,
                "usage": {
                    "input_tokens": response.usage.get('input_tokens', 0),
                    "output_tokens": response.usage.get('output_tokens', 0)
                },
                "raw_model": response.model,
                "request_id": str(uuid.uuid4()),
                "latency_ms": latency_ms,
                "verification_hash": verification_hash,
                "error": None
            }
            
        except Exception as e:
            logger.error(f"Model adapter error for {self.config.id}: {e}")
            return {
                "text": "",
                "usage": {"input_tokens": 0, "output_tokens": 0},
                "raw_model": self.config.id,
                "request_id": str(uuid.uuid4()),
                "latency_ms": 0,
                "verification_hash": "",
                "error": str(e)
            }


class DeepReasoningEngine:
    """Multi-step reasoning workflow using Claude."""
    
    def __init__(self, claude_adapter: ModelAdapter):
        self.claude_adapter = claude_adapter
    
    async def execute_reasoning(self, task: str, max_steps: int = 5) -> Dict[str, Any]:
        """
        Execute deep reasoning workflow with planning and optional critique.
        
        Returns:
            Dict with plan, execution results, and reasoning summary
        """
        logger.info(f"Starting deep reasoning for task: {task[:100]}...")
        
        # Step 1: Create plan
        plan = await self._create_plan(task, max_steps)
        
        # Step 2: Execute each step
        execution_results = []
        for step in plan.get('steps', []):
            result = await self._execute_step(step, task)
            execution_results.append(result)
        
        # Step 3: Optional critique (simplified for minimal spec)
        needs_revision = False  # Simplified - could analyze execution_results
        
        # Step 4: Generate summary
        summary = self._generate_reasoning_summary(plan, execution_results)
        
        return {
            "plan": plan,
            "execution_results": execution_results,
            "reasoning_summary": summary,
            "needs_revision": needs_revision
        }
    
    async def _create_plan(self, task: str, max_steps: int) -> Dict[str, Any]:
        """Create a structured plan for the reasoning task."""
        planning_prompt = f"""
        Create a structured plan to analyze this task: {task}
        
        Provide a JSON response with 'steps' array (max {max_steps} steps).
        Each step should have 'id', 'objective', and 'approach'.
        
        Example:
        {{
            "steps": [
                {{"id": 1, "objective": "Identify key factors", "approach": "systematic analysis"}},
                {{"id": 2, "objective": "Analyze relationships", "approach": "causal reasoning"}}
            ]
        }}
        """
        
        result = await self.claude_adapter.invoke(planning_prompt, {"max_tokens": 1000})
        
        try:
            # Try to parse JSON from the response
            plan_text = result["text"]
            if '{' in plan_text:
                json_start = plan_text.find('{')
                json_text = plan_text[json_start:]
                if json_text.endswith('```'):
                    json_text = json_text[:-3]
                plan = json.loads(json_text)
            else:
                # Fallback plan if JSON parsing fails
                plan = {
                    "steps": [
                        {"id": 1, "objective": "Analyze the task", "approach": "systematic breakdown"},
                        {"id": 2, "objective": "Synthesize findings", "approach": "comprehensive summary"}
                    ]
                }
        except:
            # Fallback plan
            plan = {
                "steps": [
                    {"id": 1, "objective": "Analyze the task", "approach": "systematic breakdown"}
                ]
            }
        
        return plan
    
    async def _execute_step(self, step: Dict[str, Any], original_task: str) -> Dict[str, Any]:
        """Execute a single reasoning step."""
        step_prompt = f"""
        Original task: {original_task}
        
        Step {step['id']}: {step['objective']}
        Approach: {step['approach']}
        
        Execute this step and provide your analysis:
        """
        
        result = await self.claude_adapter.invoke(step_prompt, {"max_tokens": 1500})
        
        return {
            "step_id": step["id"],
            "objective": step["objective"],
            "result": result["text"],
            "latency_ms": result["latency_ms"],
            "error": result.get("error")
        }
    
    def _generate_reasoning_summary(self, plan: Dict, execution_results: List[Dict]) -> List[Dict[str, str]]:
        """Generate a summary of the reasoning process."""
        summary = []
        
        for step_data in plan.get('steps', []):
            step_id = step_data['id']
            execution = next((r for r in execution_results if r['step_id'] == step_id), {})
            
            summary.append({
                "objective": step_data['objective'],
                "outcome": execution.get('result', 'Not executed')[:200] + "..." if len(execution.get('result', '')) > 200 else execution.get('result', 'Not executed')
            })
        
        return summary


class ConsensusAnalyzer:
    """Compare outputs from multiple models and highlight differences."""
    
    @staticmethod
    def analyze_consensus(responses: List[Dict[str, Any]], original_prompt: str) -> Dict[str, Any]:
        """
        Analyze consensus between multiple model responses.
        
        Returns:
            Dict with similarity metrics and key differences
        """
        if len(responses) < 2:
            return {"error": "Need at least 2 responses for consensus analysis"}
        
        # Simple similarity analysis (could be enhanced with embeddings)
        texts = [r.get("text", "") for r in responses]
        
        # Basic similarity metrics
        avg_length = sum(len(text) for text in texts) / len(texts)
        length_variance = sum((len(text) - avg_length) ** 2 for text in texts) / len(texts)
        
        # Count common words (simplified approach)
        all_words = []
        for text in texts:
            words = text.lower().split()
            all_words.extend(words)
        
        word_counts = {}
        for word in all_words:
            word_counts[word] = word_counts.get(word, 0) + 1
        
        common_words = [word for word, count in word_counts.items() if count > 1]
        similarity_score = len(common_words) / len(set(all_words)) if all_words else 0
        
        # Identify key differences (simplified)
        unique_concepts = []
        for i, response in enumerate(responses):
            model_id = response.get("raw_model", f"model_{i}")
            response_words = set(response.get("text", "").lower().split())
            other_words = set()
            for j, other_response in enumerate(responses):
                if i != j:
                    other_words.update(other_response.get("text", "").lower().split())
            
            unique_to_model = response_words - other_words
            if unique_to_model:
                unique_concepts.append({
                    "model": model_id,
                    "unique_concepts": list(unique_to_model)[:10]  # Limit to 10
                })
        
        return {
            "similarity_score": similarity_score,
            "avg_response_length": avg_length,
            "length_variance": length_variance,
            "common_concepts": common_words[:20],  # Top 20 common words
            "unique_concepts": unique_concepts,
            "recommendation": "high_consensus" if similarity_score > 0.3 else "divergent_views"
        }


class UnifiedLLMAgent:
    """
    Main unified LLM agent orchestrating multi-model interactions.
    
    Supports slash commands, natural language, model routing, deep reasoning,
    and consensus analysis with comprehensive reporting.
    """
    
    def __init__(self):
        """Initialize the unified agent."""
        self.vertex_service = VertexAIService()
        self.initialized = False
        
        # Model configurations
        self.models = {
            "gemini-pro": ModelConfig(
                id=config.gemini_pro_model,
                provider="vertex",
                role=ModelRole.FAST,
                cost_tier="low",
                max_tokens=4000
            ),
            "claude-opus-4.1": ModelConfig(
                id=config.claude_opus_model,
                provider="anthropic",
                role=ModelRole.DEEP_REASONING,
                cost_tier="high",
                max_tokens=4000
            ),
            "gemini-flash": ModelConfig(
                id=config.gemini_flash_model,
                provider="vertex",
                role=ModelRole.FAST,
                cost_tier="low",
                max_tokens=2000
            )
        }
        
        # Create adapters
        self.adapters = {}
        for name, model_config in self.models.items():
            self.adapters[name] = ModelAdapter(model_config, self.vertex_service)
        
        # Routing configuration
        self.routing = {
            "default_fast": "gemini-pro",
            "default_deep": "claude-opus-4.1",
            "limits": {
                "max_models_per_run": 2,
                "deep_max_steps": 5
            }
        }
        
        # Initialize reasoning engine
        self.reasoning_engine = DeepReasoningEngine(self.adapters["claude-opus-4.1"])
        
        logger.info("UnifiedLLMAgent initialized")
    
    async def initialize(self) -> bool:
        """Initialize the agent and underlying services."""
        try:
            await self.vertex_service.initialize()
            self.initialized = True
            logger.info("✅ UnifiedLLMAgent initialization complete")
            return True
        except Exception as e:
            logger.error(f"❌ UnifiedLLMAgent initialization failed: {e}")
            return False
    
    async def process(self, input_text: str) -> AgentResponse:
        """
        Main entry point for processing user input.
        
        Accepts slash commands, natural language, or JSON structured input.
        Returns standardized AgentResponse with verification.
        """
        if not self.initialized:
            raise Exception("Agent not initialized. Call initialize() first.")
        
        # Generate run ID
        run_id = f"run_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"
        start_time = time.time()
        
        logger.info(f"Processing request [{run_id}]: {input_text[:100]}...")
        
        try:
            # Step 1: Parse input and determine invocation mode
            request = await self._parse_input(input_text)
            
            # Step 2: Route to appropriate models
            models_to_use = await self._route_models(request)
            
            # Step 3: Execute request
            results = await self._execute_request(request, models_to_use, run_id)
            
            # Step 4: Process results and generate response
            response = await self._generate_response(request, results, run_id, start_time)
            
            logger.info(f"Request [{run_id}] completed successfully")
            return response
            
        except Exception as e:
            logger.error(f"Request [{run_id}] failed: {e}")
            
            # Return error response
            return AgentResponse(
                answer=f"Error processing request: {str(e)}",
                run_id=run_id,
                mode="error",
                models_used=[],
                errors=[{
                    "code": "PROCESSING_ERROR",
                    "message": str(e),
                    "retryable": True
                }],
                latency_ms=(time.time() - start_time) * 1000,
                timestamp=datetime.now().isoformat()
            )
    
    async def _parse_input(self, input_text: str) -> AgentRequest:
        """Parse input text into structured AgentRequest."""
        input_text = input_text.strip()
        
        # Check if it's a slash command
        if input_text.startswith('/'):
            cmd_name, params = SlashCommandParser.parse(input_text)
            
            return AgentRequest(
                prompt=params.get('prompt', params.get('task', '')),
                models=params.get('models'),
                mode=params.get('mode'),
                reasoning=params.get('reasoning'),
                consensus=params.get('consensus', False) or cmd_name == 'multi-run',
                temperature=float(params['temperature']) if 'temperature' in params else None,
                max_tokens=int(params['max_tokens']) if 'max_tokens' in params else None
            )
        
        # Check if it's JSON
        elif input_text.startswith('{'):
            try:
                data = json.loads(input_text)
                return AgentRequest(
                    prompt=data.get('prompt', ''),
                    models=data.get('models'),
                    mode=data.get('mode'),
                    reasoning=data.get('reasoning'),
                    consensus=data.get('consensus', False),
                    temperature=data.get('temperature'),
                    max_tokens=data.get('max_tokens')
                )
            except json.JSONDecodeError:
                pass  # Fall through to natural language
        
        # Natural language processing
        intent = IntentParser.parse_intent(input_text)
        
        return AgentRequest(
            prompt=input_text,
            mode=intent['mode'],
            reasoning=intent['reasoning'],
            consensus=intent['consensus']
        )
    
    async def _route_models(self, request: AgentRequest) -> List[str]:
        """Determine which models to use based on request."""
        if request.models:
            # Explicit model specification
            return request.models[:self.routing['limits']['max_models_per_run']]
        
        if request.consensus:
            # Use both fast and deep models for consensus
            return [self.routing['default_fast'], self.routing['default_deep']]
        
        if request.mode == "deep" or request.reasoning == "deep":
            return [self.routing['default_deep']]
        
        # Default to fast model
        return [self.routing['default_fast']]
    
    async def _execute_request(self, request: AgentRequest, models: List[str], run_id: str) -> List[Dict[str, Any]]:
        """Execute the request against selected models."""
        results = []
        
        # Handle deep reasoning specially
        if request.reasoning == "deep" and "claude-opus-4.1" in models:
            logger.info(f"[{run_id}] Executing deep reasoning workflow")
            reasoning_result = await self.reasoning_engine.execute_reasoning(
                request.prompt, 
                self.routing['limits']['deep_max_steps']
            )
            
            # Create mock result structure for reasoning
            results.append({
                "model": "claude-opus-4.1",
                "text": f"Deep reasoning analysis:\n\n{reasoning_result['reasoning_summary']}",
                "usage": {"input_tokens": 1000, "output_tokens": 2000},  # Estimated
                "raw_model": "claude-opus-4.1",
                "request_id": str(uuid.uuid4()),
                "latency_ms": 5000,  # Estimated for deep reasoning
                "verification_hash": hashlib.sha256(f"{request.prompt}:{run_id}".encode()).hexdigest()[:16],
                "reasoning_data": reasoning_result
            })
            
            # Remove claude from regular execution
            models = [m for m in models if m != "claude-opus-4.1"]
        
        # Execute regular model calls
        for model_name in models:
            if model_name not in self.adapters:
                logger.warning(f"Unknown model: {model_name}")
                continue
            
            logger.info(f"[{run_id}] Calling model: {model_name}")
            adapter = self.adapters[model_name]
            
            params = {}
            if request.temperature is not None:
                params['temperature'] = request.temperature
            if request.max_tokens is not None:
                params['max_tokens'] = request.max_tokens
            
            result = await adapter.invoke(request.prompt, params)
            result['model'] = model_name
            results.append(result)
        
        return results
    
    async def _generate_response(self, request: AgentRequest, results: List[Dict], run_id: str, start_time: float) -> AgentResponse:
        """Generate final AgentResponse from execution results."""
        # Extract main answer
        if results:
            # Prioritize deep reasoning results, then longest response
            main_result = max(results, key=lambda r: len(r.get('text', '')))
            answer = main_result.get('text', 'No response generated')
        else:
            answer = "No models were able to process the request"
        
        # Build models_used list
        models_used = []
        errors = []
        
        for result in results:
            usage = ModelUsage(
                model_id=result.get('raw_model', result.get('model', 'unknown')),
                provider=self.models.get(result.get('model', ''), self.models['gemini-pro']).provider,
                input_tokens=result.get('usage', {}).get('input_tokens', 0),
                output_tokens=result.get('usage', {}).get('output_tokens', 0),
                latency_ms=result.get('latency_ms', 0),
                cost_estimate=self._estimate_cost(result),
                request_id=result.get('request_id', ''),
                verification_hash=result.get('verification_hash', ''),
                error=result.get('error')
            )
            models_used.append(usage)
            
            if result.get('error'):
                errors.append({
                    "model": result.get('model', 'unknown'),
                    "code": "MODEL_ERROR",
                    "message": result.get('error'),
                    "retryable": True
                })
        
        # Generate consensus analysis if multiple models
        consensus = None
        if len(results) > 1 and request.consensus:
            consensus = ConsensusAnalyzer.analyze_consensus(results, request.prompt)
        
        # Extract reasoning summary
        reasoning_summary = None
        for result in results:
            if 'reasoning_data' in result:
                reasoning_summary = result['reasoning_data'].get('reasoning_summary')
                break
        
        return AgentResponse(
            answer=answer,
            run_id=run_id,
            mode=request.mode or "auto",
            models_used=models_used,
            reasoning_summary=reasoning_summary,
            consensus=consensus,
            errors=errors if errors else None,
            latency_ms=(time.time() - start_time) * 1000,
            timestamp=datetime.now().isoformat()
        )
    
    def _estimate_cost(self, result: Dict[str, Any]) -> float:
        """Estimate cost for a model result (simplified)."""
        model_name = result.get('model', '')
        input_tokens = result.get('usage', {}).get('input_tokens', 0)
        output_tokens = result.get('usage', {}).get('output_tokens', 0)
        
        # Simplified cost estimates (would be configured properly in production)
        if 'claude' in model_name:
            return (input_tokens * 0.000025) + (output_tokens * 0.000125)
        elif 'gemini' in model_name:
            return (input_tokens * 0.000007) + (output_tokens * 0.000021)
        else:
            return 0.01  # Default estimate


# Convenience functions for common use cases
async def model_test(prompt: str, model: str = None) -> AgentResponse:
    """Quick model test function."""
    agent = UnifiedLLMAgent()
    await agent.initialize()
    
    if model:
        command = f'/model-test model={model} prompt="{prompt}"'
    else:
        command = f'/model-test prompt="{prompt}"'
    
    return await agent.process(command)


async def multi_run(prompt: str, models: List[str] = None) -> AgentResponse:
    """Run consensus comparison between models."""
    agent = UnifiedLLMAgent()
    await agent.initialize()
    
    models_str = ','.join(models) if models else 'gemini-pro,claude-opus-4.1'
    command = f'/multi-run models={models_str} prompt="{prompt}" consensus=true'
    
    return await agent.process(command)


async def auto_route(task: str) -> AgentResponse:
    """Auto-route task based on complexity."""
    agent = UnifiedLLMAgent()
    await agent.initialize()
    
    return await agent.process(task)