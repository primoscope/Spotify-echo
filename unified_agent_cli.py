#!/usr/bin/env python3
"""
Unified LLM Agent CLI Interface

Command-line interface for the Unified LLM Agent supporting interactive mode,
single commands, and batch processing.

Usage:
    python unified_agent_cli.py                           # Interactive mode
    python unified_agent_cli.py "Your question here"      # Single command
    python unified_agent_cli.py --command "/model-test prompt='Hello'"  # Slash command
    python unified_agent_cli.py --help                    # Show help
"""

import asyncio
import sys
import json
import argparse
from datetime import datetime
from typing import Optional, Dict, Any
import os

# Add project root to path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Mock environment for demo
os.environ.setdefault('GCP_PROJECT_ID', 'demo-project-12345')
os.environ.setdefault('GCP_REGION', 'us-central1')

from src.agents.unified_llm_agent import UnifiedLLMAgent, AgentResponse
from src.config.unified_agent_config import UnifiedAgentConfig


class UnifiedAgentCLI:
    """Command-line interface for the Unified LLM Agent."""
    
    def __init__(self):
        """Initialize the CLI."""
        self.agent: Optional[UnifiedLLMAgent] = None
        self.initialized = False
        self.session_history = []
    
    def print_banner(self):
        """Print the CLI banner."""
        print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║                          Unified LLM Agent CLI                              ║
║                                                                              ║
║  Multi-model AI agent with intelligent routing and consensus analysis       ║
║  Supports: Claude Opus 4.1, Gemini 2.5 Pro/Flash                          ║
╚══════════════════════════════════════════════════════════════════════════════╝
        """)
    
    def print_help(self):
        """Print help information."""
        help_text = """
🔧 COMMAND REFERENCE

Slash Commands:
  /model-test prompt="Your question"              - Test specific model
  /multi-run prompt="Question" consensus=true     - Compare multiple models
  /model-route task="Complex analysis"            - Auto-route by complexity
  /agent-status                                   - Check agent health
  /help                                          - Show this help
  /quit or /exit                                 - Exit the CLI

Natural Language:
  Just type your question and the agent will automatically route it to the
  most appropriate model(s) based on complexity and content.

Examples:
  > Give me a quick summary of machine learning
  > /model-test model=claude-opus-4.1 prompt="Deep analysis of AI ethics"
  > Compare the advantages of microservices vs monolithic architecture
  > /multi-run models=gemini-pro,claude-opus-4.1 prompt="Database options"

Models Available:
  • gemini-pro      - Fast, general-purpose responses
  • claude-opus-4.1 - Deep reasoning and complex analysis  
  • gemini-flash    - Ultra-fast responses

⚠️  Note: This demo uses simulated responses. For live API calls, configure GCP credentials.
        """
        print(help_text)
    
    async def initialize_agent(self) -> bool:
        """Initialize the agent."""
        if self.initialized:
            return True
        
        print("🔄 Initializing Unified LLM Agent...")
        
        try:
            self.agent = UnifiedLLMAgent()
            success = await self.agent.initialize()
            
            if success:
                self.initialized = True
                print("✅ Agent initialized successfully")
                print("📊 Available models: gemini-pro, claude-opus-4.1, gemini-flash")
                print("💡 Type '/help' for commands or just ask a question\n")
                return True
            else:
                print("❌ Agent initialization failed")
                return False
                
        except Exception as e:
            print(f"❌ Initialization error: {e}")
            print("⚠️  Running in demo mode with simulated responses")
            
            # Create a mock agent for demo purposes
            self.agent = None  # Will trigger demo mode
            self.initialized = True
            return True
    
    async def process_input(self, user_input: str) -> Dict[str, Any]:
        """Process user input and return response."""
        user_input = user_input.strip()
        
        if not user_input:
            return {"error": "Empty input"}
        
        # Handle CLI-specific commands
        if user_input.lower() in ['/quit', '/exit', 'quit', 'exit']:
            return {"action": "quit"}
        
        if user_input.lower() in ['/help', 'help']:
            self.print_help()
            return {"action": "help_shown"}
        
        if user_input.lower() == '/agent-status':
            return await self._get_agent_status()
        
        # Process through the agent
        try:
            if self.agent:
                # Real agent processing
                response = await self.agent.process(user_input)
                return {"response": response}
            else:
                # Demo mode - simulate response
                response = self._simulate_response(user_input)
                return {"response": response}
                
        except Exception as e:
            return {"error": f"Processing error: {e}"}
    
    def _simulate_response(self, user_input: str) -> Dict[str, Any]:
        """Simulate agent response for demo purposes."""
        run_id = f"demo_run_{datetime.now().strftime('%H%M%S')}"
        
        # Determine routing based on input
        if user_input.startswith('/'):
            # Slash command
            if 'deep' in user_input or 'claude' in user_input:
                mode = "deep"
                model = "claude-opus-4.1"
                answer = f"[DEMO] Deep analysis result for: {user_input[:50]}...\n\nThis would provide comprehensive reasoning using Claude Opus 4.1 with multi-step analysis and detailed insights."
                latency = 1200
            elif 'multi-run' in user_input or 'consensus' in user_input:
                mode = "consensus"
                model = "gemini-pro,claude-opus-4.1"
                answer = f"[DEMO] Consensus analysis for: {user_input[:50]}...\n\nThis would compare responses from both Gemini Pro and Claude Opus, highlighting similarities and differences."
                latency = 2000
            else:
                mode = "lean"
                model = "gemini-pro"
                answer = f"[DEMO] Quick response for: {user_input[:50]}...\n\nThis would provide a fast, accurate response using Gemini Pro."
                latency = 850
        else:
            # Natural language
            if any(word in user_input.lower() for word in ['compare', 'versus', 'both', 'different']):
                mode = "consensus"
                model = "gemini-pro,claude-opus-4.1" 
                answer = f"[DEMO] Comparison analysis for: {user_input[:50]}...\n\nThis would provide perspectives from both models for comprehensive comparison."
                latency = 1800
            elif any(word in user_input.lower() for word in ['deep', 'analyze', 'explain', 'why', 'complex']):
                mode = "deep"
                model = "claude-opus-4.1"
                answer = f"[DEMO] Deep reasoning for: {user_input[:50]}...\n\nThis would provide sophisticated analysis with step-by-step reasoning."
                latency = 1200
            else:
                mode = "lean"
                model = "gemini-pro"
                answer = f"[DEMO] Quick response for: {user_input[:50]}...\n\nThis would provide a fast, helpful response."
                latency = 650
        
        models_used = []
        if ',' in model:
            for m in model.split(','):
                models_used.append({
                    "model_id": "claude-opus-4-1@20250805" if 'claude' in m else "gemini-2.5-pro",
                    "provider": "anthropic" if 'claude' in m else "vertex",
                    "input_tokens": 500,
                    "output_tokens": 800,
                    "latency_ms": latency // 2,
                    "cost_estimate": 0.045 if 'claude' in m else 0.012,
                    "request_id": f"req_{run_id}_{m}",
                    "verification_hash": f"hash_{run_id}_{m}",
                    "error": None
                })
        else:
            models_used.append({
                "model_id": "claude-opus-4-1@20250805" if 'claude' in model else "gemini-2.5-pro",
                "provider": "anthropic" if 'claude' in model else "vertex",
                "input_tokens": 500,
                "output_tokens": 800,
                "latency_ms": latency,
                "cost_estimate": 0.045 if 'claude' in model else 0.012,
                "request_id": f"req_{run_id}",
                "verification_hash": f"hash_{run_id}",
                "error": None
            })
        
        return {
            "answer": answer,
            "run_id": run_id,
            "mode": mode,
            "models_used": models_used,
            "latency_ms": latency,
            "timestamp": datetime.now().isoformat(),
            "errors": None
        }
    
    async def _get_agent_status(self) -> Dict[str, Any]:
        """Get agent status information."""
        if self.agent:
            # Real agent status
            status = {
                "status": "operational",
                "mode": "live",
                "models_available": list(UnifiedAgentConfig.MODELS.keys()),
                "session_requests": len(self.session_history),
                "uptime": "operational"
            }
        else:
            # Demo mode status
            status = {
                "status": "demo_mode", 
                "mode": "simulated",
                "models_available": ["gemini-pro", "claude-opus-4.1", "gemini-flash"],
                "session_requests": len(self.session_history),
                "note": "Running in demo mode - responses are simulated"
            }
        
        return {"response": {"answer": json.dumps(status, indent=2), "run_id": "status_check"}}
    
    def format_response(self, response: Dict[str, Any]) -> str:
        """Format response for display."""
        if 'answer' not in response:
            return "No response generated"
        
        output = []
        output.append(f"💬 {response['answer']}")
        output.append("")
        
        # Add metadata
        if 'run_id' in response:
            output.append(f"🔍 Run ID: {response['run_id']}")
        
        if 'mode' in response:
            output.append(f"⚙️  Mode: {response['mode']}")
        
        if 'models_used' in response and response['models_used']:
            output.append("🤖 Models used:")
            for model in response['models_used']:
                cost = model.get('cost_estimate', 0)
                latency = model.get('latency_ms', 0)
                output.append(f"   • {model['model_id']}: ${cost:.4f}, {latency:.0f}ms")
        
        if 'latency_ms' in response:
            output.append(f"⏱️  Total time: {response['latency_ms']:.0f}ms")
        
        if response.get('errors'):
            output.append("⚠️  Errors:")
            for error in response['errors']:
                output.append(f"   • {error.get('message', 'Unknown error')}")
        
        return "\n".join(output)
    
    async def interactive_mode(self):
        """Run the CLI in interactive mode."""
        self.print_banner()
        
        if not await self.initialize_agent():
            print("Failed to initialize agent. Exiting.")
            return
        
        print("🎯 Interactive mode started. Type your questions or commands.\n")
        
        while True:
            try:
                # Get user input
                user_input = input("🟢 Agent> ").strip()
                
                if not user_input:
                    continue
                
                print()  # Add blank line
                
                # Process input
                start_time = datetime.now()
                result = await self.process_input(user_input)
                
                # Handle special actions
                if result.get("action") == "quit":
                    print("👋 Goodbye!")
                    break
                elif result.get("action") == "help_shown":
                    continue
                
                # Display response
                if "response" in result:
                    response = result["response"]
                    formatted = self.format_response(response)
                    print(formatted)
                    
                    # Save to history
                    self.session_history.append({
                        "input": user_input,
                        "response": response,
                        "timestamp": start_time.isoformat()
                    })
                    
                elif "error" in result:
                    print(f"❌ Error: {result['error']}")
                
                print("\n" + "─" * 80 + "\n")  # Separator
                
            except KeyboardInterrupt:
                print("\n\n👋 Goodbye!")
                break
            except Exception as e:
                print(f"\n❌ Unexpected error: {e}")
    
    async def single_command(self, command: str):
        """Process a single command and exit."""
        if not await self.initialize_agent():
            print("Failed to initialize agent.")
            return
        
        result = await self.process_input(command)
        
        if "response" in result:
            response = result["response"]
            formatted = self.format_response(response)
            print(formatted)
        elif "error" in result:
            print(f"Error: {result['error']}")


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Unified LLM Agent CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python unified_agent_cli.py                                    # Interactive mode
  python unified_agent_cli.py "What is machine learning?"        # Single question
  python unified_agent_cli.py --command "/model-test prompt='Hello'"  # Slash command
        """
    )
    
    parser.add_argument(
        "question",
        nargs="?",
        help="Single question to ask (optional, starts interactive mode if not provided)"
    )
    
    parser.add_argument(
        "--command",
        help="Execute a specific slash command"
    )
    
    parser.add_argument(
        "--version",
        action="version",
        version="Unified LLM Agent CLI v1.0"
    )
    
    args = parser.parse_args()
    
    cli = UnifiedAgentCLI()
    
    try:
        if args.command:
            # Execute specific command
            asyncio.run(cli.single_command(args.command))
        elif args.question:
            # Single question mode
            asyncio.run(cli.single_command(args.question))
        else:
            # Interactive mode
            asyncio.run(cli.interactive_mode())
            
    except KeyboardInterrupt:
        print("\nGoodbye!")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()