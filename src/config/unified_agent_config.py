"""
Unified LLM Agent Configuration

Configuration settings for the Unified LLM Agent including model specifications,
routing rules, performance limits, and cost management.
"""

from typing import Dict, List, Any
from dataclasses import dataclass
from enum import Enum


class ModelRole(Enum):
    """Model roles for routing decisions."""
    FAST = "fast"
    DEEP_REASONING = "deep_reasoning"
    GENERAL = "general"


@dataclass
class ModelConfig:
    """Configuration for a specific model."""
    id: str
    provider: str
    role: ModelRole
    cost_tier: str
    max_tokens: int = 4000
    temperature: float = 0.3
    cost_per_1k_input_tokens: float = 0.007
    cost_per_1k_output_tokens: float = 0.021


class UnifiedAgentConfig:
    """Unified LLM Agent configuration."""
    
    # Model configurations
    MODELS: Dict[str, ModelConfig] = {
        "gemini-pro": ModelConfig(
            id="gemini-2.5-pro",
            provider="vertex",
            role=ModelRole.FAST,
            cost_tier="low",
            max_tokens=4000,
            temperature=0.3,
            cost_per_1k_input_tokens=0.007,
            cost_per_1k_output_tokens=0.021
        ),
        "claude-opus-4.1": ModelConfig(
            id="claude-opus-4-1@20250805",
            provider="anthropic",
            role=ModelRole.DEEP_REASONING,
            cost_tier="high",
            max_tokens=4000,
            temperature=0.3,
            cost_per_1k_input_tokens=0.025,
            cost_per_1k_output_tokens=0.125
        ),
        "gemini-flash": ModelConfig(
            id="gemini-2.5-flash",
            provider="vertex", 
            role=ModelRole.FAST,
            cost_tier="low",
            max_tokens=2000,
            temperature=0.3,
            cost_per_1k_input_tokens=0.004,
            cost_per_1k_output_tokens=0.012
        )
    }
    
    # Routing configuration
    ROUTING: Dict[str, Any] = {
        "deep_keywords": [
            "deep", "why", "explain", "causal", "multi-step", "thorough",
            "analyze", "reasoning", "complex", "detailed", "comprehensive",
            "sophisticated", "intricate", "nuanced", "elaborate"
        ],
        "fast_keywords": [
            "quick", "fast", "summary", "brief", "simple", "short",
            "rapid", "immediate", "concise", "overview"
        ],
        "consensus_keywords": [
            "compare", "consensus", "both", "multiple", "different",
            "contrast", "versus", "alternative", "options"
        ],
        "default_fast": "gemini-pro",
        "default_deep": "claude-opus-4.1",
        "default_consensus": ["gemini-pro", "claude-opus-4.1"]
    }
    
    # Performance limits
    LIMITS: Dict[str, Any] = {
        "max_models_per_run": 2,
        "deep_max_steps": 5,
        "max_requests_per_minute": 60,
        "max_tokens_per_request": 4000,
        "request_timeout_seconds": 30,
        "max_retry_attempts": 3
    }
    
    # Cost management
    COST_CONTROLS: Dict[str, Any] = {
        "daily_budget_usd": 50.0,
        "warn_threshold_usd": 40.0,
        "auto_switch_to_cheaper": True,
        "cost_tracking_enabled": True,
        "budget_reset_hour": 0  # UTC hour for daily reset
    }
    
    # Response format configuration
    RESPONSE_FORMAT: Dict[str, Any] = {
        "max_answer_length": 2000,
        "include_verification": True,
        "include_cost_estimate": True,
        "include_model_details": True,
        "include_performance_metrics": True
    }
    
    # Error handling configuration
    ERROR_HANDLING: Dict[str, Any] = {
        "retry_on_rate_limit": True,
        "retry_on_auth_error": False,
        "retry_on_timeout": True,
        "fallback_to_cheaper_model": True,
        "graceful_degradation": True,
        "log_all_errors": True
    }
    
    # Slash command definitions
    SLASH_COMMANDS: Dict[str, Dict[str, Any]] = {
        "model-test": {
            "description": "Test a specific model with a prompt",
            "parameters": {
                "prompt": {"required": True, "type": "string"},
                "model": {"required": False, "type": "string", "default": "auto"},
                "temperature": {"required": False, "type": "float", "default": 0.3},
                "max_tokens": {"required": False, "type": "int", "default": 2000}
            },
            "examples": [
                '/model-test prompt="Summarize cloud computing"',
                '/model-test model=claude-opus-4.1 prompt="Deep analysis" temperature=0.7'
            ]
        },
        "multi-run": {
            "description": "Run consensus comparison between multiple models",
            "parameters": {
                "prompt": {"required": True, "type": "string"},
                "models": {"required": False, "type": "list", "default": ["gemini-pro", "claude-opus-4.1"]},
                "consensus": {"required": False, "type": "bool", "default": True}
            },
            "examples": [
                '/multi-run prompt="Compare database types" consensus=true',
                '/multi-run models=gemini-pro,claude-opus-4.1 prompt="Analyze options"'
            ]
        },
        "model-route": {
            "description": "Auto-route task based on complexity analysis",
            "parameters": {
                "task": {"required": True, "type": "string"},
                "force_mode": {"required": False, "type": "string", "options": ["fast", "deep", "consensus"]}
            },
            "examples": [
                '/model-route task="Explain machine learning bias"',
                '/model-route task="Quick summary" force_mode=fast'
            ]
        },
        "run-report": {
            "description": "Get detailed report for a previous run",
            "parameters": {
                "run_id": {"required": True, "type": "string"}
            },
            "examples": [
                '/run-report run_id=run_20250825_143022_abc123'
            ]
        },
        "agent-status": {
            "description": "Get current agent status and health metrics",
            "parameters": {},
            "examples": [
                '/agent-status'
            ]
        }
    }
    
    # Natural language intent thresholds
    INTENT_THRESHOLDS: Dict[str, float] = {
        "deep_reasoning_threshold": 0.3,
        "consensus_threshold": 0.2,
        "confidence_threshold": 0.1,
        "auto_route_threshold": 0.5
    }
    
    # Verification settings
    VERIFICATION: Dict[str, Any] = {
        "hash_algorithm": "sha256",
        "hash_length": 16,
        "include_timestamp": True,
        "include_model_version": True,
        "verify_all_responses": True
    }
    
    # Logging configuration
    LOGGING: Dict[str, Any] = {
        "log_level": "INFO",
        "log_requests": True,
        "log_responses": True,
        "log_performance": True,
        "log_costs": True,
        "log_errors": True,
        "retention_days": 30
    }

    @classmethod
    def get_model_config(cls, model_name: str) -> ModelConfig:
        """Get configuration for a specific model."""
        return cls.MODELS.get(model_name)
    
    @classmethod
    def get_routing_keywords(cls, category: str) -> List[str]:
        """Get routing keywords for a specific category."""
        return cls.ROUTING.get(f"{category}_keywords", [])
    
    @classmethod
    def get_default_model(cls, mode: str) -> str:
        """Get default model for a specific mode."""
        return cls.ROUTING.get(f"default_{mode}")
    
    @classmethod
    def get_limit(cls, limit_name: str) -> Any:
        """Get a specific limit value."""
        return cls.LIMITS.get(limit_name)
    
    @classmethod
    def estimate_cost(cls, model_name: str, input_tokens: int, output_tokens: int) -> float:
        """Estimate cost for a model request."""
        model_config = cls.get_model_config(model_name)
        if not model_config:
            return 0.0
        
        input_cost = (input_tokens / 1000) * model_config.cost_per_1k_input_tokens
        output_cost = (output_tokens / 1000) * model_config.cost_per_1k_output_tokens
        
        return input_cost + output_cost
    
    @classmethod
    def validate_command(cls, command_name: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Validate slash command parameters."""
        if command_name not in cls.SLASH_COMMANDS:
            return {"valid": False, "error": f"Unknown command: {command_name}"}
        
        command_def = cls.SLASH_COMMANDS[command_name]
        validation_result = {"valid": True, "errors": []}
        
        # Check required parameters
        for param_name, param_def in command_def["parameters"].items():
            if param_def.get("required", False) and param_name not in parameters:
                validation_result["errors"].append(f"Missing required parameter: {param_name}")
                validation_result["valid"] = False
        
        # Check parameter types
        for param_name, value in parameters.items():
            if param_name in command_def["parameters"]:
                param_def = command_def["parameters"][param_name]
                expected_type = param_def.get("type")
                
                if expected_type == "string" and not isinstance(value, str):
                    validation_result["errors"].append(f"Parameter {param_name} must be a string")
                    validation_result["valid"] = False
                elif expected_type == "int" and not isinstance(value, int):
                    validation_result["errors"].append(f"Parameter {param_name} must be an integer")
                    validation_result["valid"] = False
                elif expected_type == "float" and not isinstance(value, (int, float)):
                    validation_result["errors"].append(f"Parameter {param_name} must be a number")
                    validation_result["valid"] = False
                elif expected_type == "bool" and not isinstance(value, bool):
                    validation_result["errors"].append(f"Parameter {param_name} must be a boolean")
                    validation_result["valid"] = False
        
        return validation_result
    
    @classmethod 
    def get_help_text(cls) -> str:
        """Get comprehensive help text for the agent."""
        help_text = """
# Unified LLM Agent - Command Reference

## Slash Commands

"""
        
        for cmd_name, cmd_def in cls.SLASH_COMMANDS.items():
            help_text += f"### /{cmd_name}\n"
            help_text += f"{cmd_def['description']}\n\n"
            
            help_text += "**Parameters:**\n"
            for param_name, param_def in cmd_def['parameters'].items():
                required = "required" if param_def.get("required", False) else "optional"
                param_type = param_def.get("type", "string")
                default = param_def.get("default", "none")
                help_text += f"- `{param_name}` ({param_type}, {required})"
                if default != "none":
                    help_text += f", default: {default}"
                help_text += "\n"
            
            help_text += "\n**Examples:**\n"
            for example in cmd_def.get('examples', []):
                help_text += f"```\n{example}\n```\n"
            help_text += "\n"
        
        help_text += """
## Natural Language

You can also use natural language instead of slash commands. The agent will automatically:

- **Route to fast models** for simple queries (Gemini Pro)
- **Route to deep reasoning** for complex analysis (Claude Opus)
- **Use consensus mode** when comparison is needed

**Examples:**
- "Give me a quick summary of serverless computing" → Fast routing
- "Deeply analyze the causes of model bias" → Deep reasoning
- "Compare SQL vs NoSQL databases" → Consensus mode

## Model Information

"""
        
        for model_name, model_config in cls.MODELS.items():
            help_text += f"### {model_name}\n"
            help_text += f"- **Provider**: {model_config.provider}\n"
            help_text += f"- **Role**: {model_config.role.value}\n"
            help_text += f"- **Cost Tier**: {model_config.cost_tier}\n"
            help_text += f"- **Max Tokens**: {model_config.max_tokens}\n"
            help_text += f"- **Cost**: ${model_config.cost_per_1k_input_tokens:.3f} input + ${model_config.cost_per_1k_output_tokens:.3f} output per 1K tokens\n\n"
        
        return help_text