#!/usr/bin/env python3
"""
Simple Test Runner for Unified LLM Agent

This script runs basic tests for the core components without requiring pytest.
It validates the key functionality including slash command parsing, intent 
recognition, and configuration management.
"""

import sys
import os
import asyncio
import traceback
from datetime import datetime

# Add project root to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

# Import components to test
from unified_agent_standalone_demo import SlashCommandParser, IntentParser


class SimpleTestRunner:
    """Simple test runner for basic validation."""
    
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = 0
        self.failures = []
    
    def run_test(self, test_name: str, test_func):
        """Run a single test function."""
        self.tests_run += 1
        
        try:
            print(f"Running {test_name}...", end=" ")
            test_func()
            print("✅ PASSED")
            self.tests_passed += 1
        except Exception as e:
            print(f"❌ FAILED: {e}")
            self.tests_failed += 1
            self.failures.append({
                'test': test_name,
                'error': str(e),
                'traceback': traceback.format_exc()
            })
    
    def assert_equal(self, actual, expected, message=""):
        """Assert that two values are equal."""
        if actual != expected:
            raise AssertionError(f"{message}Expected {expected}, got {actual}")
    
    def assert_true(self, condition, message=""):
        """Assert that condition is true."""
        if not condition:
            raise AssertionError(f"{message}Expected True, got {condition}")
    
    def assert_in(self, item, container, message=""):
        """Assert that item is in container."""
        if item not in container:
            raise AssertionError(f"{message}Expected {item} to be in {container}")
    
    def assert_raises(self, exception_type, func, *args, **kwargs):
        """Assert that function raises specific exception."""
        try:
            func(*args, **kwargs)
            raise AssertionError(f"Expected {exception_type.__name__} to be raised")
        except exception_type:
            pass  # Expected exception was raised
        except Exception as e:
            raise AssertionError(f"Expected {exception_type.__name__}, got {type(e).__name__}: {e}")
    
    def print_summary(self):
        """Print test summary."""
        print("\n" + "="*60)
        print(f"TEST SUMMARY")
        print("="*60)
        print(f"Tests run: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_failed}")
        
        if self.failures:
            print("\nFAILURES:")
            for failure in self.failures:
                print(f"  {failure['test']}: {failure['error']}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"\nSuccess rate: {success_rate:.1f}%")
        
        if self.tests_failed == 0:
            print("🎉 ALL TESTS PASSED!")
        else:
            print(f"⚠️  {self.tests_failed} tests failed")


def test_slash_command_parsing(runner):
    """Test slash command parsing functionality."""
    
    def test_simple_command():
        cmd, params = SlashCommandParser.parse("/model-test")
        runner.assert_equal(cmd, "model-test")
        runner.assert_equal(params, {})
    
    def test_command_with_parameters():
        cmd, params = SlashCommandParser.parse('/model-test prompt="Hello world" temperature=0.7')
        runner.assert_equal(cmd, "model-test")
        runner.assert_equal(params["prompt"], "Hello world")
        runner.assert_equal(params["temperature"], "0.7")
    
    def test_command_with_list_parameter():
        cmd, params = SlashCommandParser.parse('/multi-run models=gemini-pro,claude-opus-4.1 prompt="Test"')
        runner.assert_equal(cmd, "multi-run")
        runner.assert_equal(params["models"], ["gemini-pro", "claude-opus-4.1"])
        runner.assert_equal(params["prompt"], "Test")
    
    def test_quoted_parameters():
        cmd, params = SlashCommandParser.parse("/model-test prompt='Complex question with spaces' model=claude")
        runner.assert_equal(cmd, "model-test")
        runner.assert_equal(params["prompt"], "Complex question with spaces")
        runner.assert_equal(params["model"], "claude")
    
    def test_invalid_command():
        runner.assert_raises(ValueError, SlashCommandParser.parse, "not-a-slash-command")
    
    # Run slash command tests
    runner.run_test("test_simple_command", test_simple_command)
    runner.run_test("test_command_with_parameters", test_command_with_parameters)
    runner.run_test("test_command_with_list_parameter", test_command_with_list_parameter)
    runner.run_test("test_quoted_parameters", test_quoted_parameters)
    runner.run_test("test_invalid_command", test_invalid_command)


def test_intent_parsing(runner):
    """Test natural language intent parsing."""
    
    def test_deep_reasoning_intent():
        intent = IntentParser.parse_intent("Please deeply analyze the causal factors behind this problem")
        runner.assert_equal(intent["mode"], "deep")
        runner.assert_equal(intent["reasoning"], "deep")
        runner.assert_true(intent["scores"]["deep"] > 0)
    
    def test_fast_intent():
        intent = IntentParser.parse_intent("Give me a quick summary of machine learning")
        runner.assert_equal(intent["mode"], "lean")
        runner.assert_true(intent["scores"]["fast"] > 0)
    
    def test_consensus_intent():
        intent = IntentParser.parse_intent("Compare the advantages of SQL vs NoSQL databases")
        runner.assert_true(intent["consensus"])
        runner.assert_equal(intent["mode"], "consensus")
        runner.assert_true(intent["scores"]["consensus"] > 0)
    
    def test_default_routing():
        intent = IntentParser.parse_intent("What is the weather like today?")
        runner.assert_in(intent["mode"], ["lean", "deep"])
        runner.assert_in("confidence", intent)
    
    def test_long_complex_text():
        long_text = "Explain the intricate relationships between quantum mechanics and general relativity"
        intent = IntentParser.parse_intent(long_text)
        runner.assert_equal(intent["mode"], "deep")
        runner.assert_in(intent["reasoning"], ["basic", "deep"])
    
    # Run intent parsing tests
    runner.run_test("test_deep_reasoning_intent", test_deep_reasoning_intent)
    runner.run_test("test_fast_intent", test_fast_intent)
    runner.run_test("test_consensus_intent", test_consensus_intent)
    runner.run_test("test_default_routing", test_default_routing)
    runner.run_test("test_long_complex_text", test_long_complex_text)


def test_configuration_management(runner):
    """Test configuration management functionality."""
    
    # Import config here since it may not be available in standalone mode
    try:
        from src.config.unified_agent_config import UnifiedAgentConfig
        
        def test_model_config_retrieval():
            config = UnifiedAgentConfig.get_model_config("gemini-pro")
            runner.assert_true(config is not None)
            runner.assert_equal(config.provider, "vertex")
            runner.assert_equal(config.role.value, "fast")
        
        def test_routing_keywords():
            deep_keywords = UnifiedAgentConfig.get_routing_keywords("deep")
            runner.assert_in("deep", deep_keywords)
            runner.assert_in("analyze", deep_keywords)
            
            fast_keywords = UnifiedAgentConfig.get_routing_keywords("fast")
            runner.assert_in("quick", fast_keywords)
            runner.assert_in("summary", fast_keywords)
        
        def test_cost_estimation():
            cost = UnifiedAgentConfig.estimate_cost("gemini-pro", 1000, 1500)
            runner.assert_true(cost > 0)
            runner.assert_true(isinstance(cost, float))
            
            # Claude should be more expensive
            claude_cost = UnifiedAgentConfig.estimate_cost("claude-opus-4.1", 1000, 1500)
            runner.assert_true(claude_cost > cost)
        
        def test_command_validation():
            # Valid command
            result = UnifiedAgentConfig.validate_command("model-test", {"prompt": "test"})
            runner.assert_true(result["valid"])
            
            # Invalid command
            result = UnifiedAgentConfig.validate_command("invalid-command", {})
            runner.assert_true(not result["valid"])
            
            # Missing required parameter
            result = UnifiedAgentConfig.validate_command("model-test", {})
            runner.assert_true(not result["valid"])
            runner.assert_in("Missing required parameter", result["errors"][0])
        
        # Run configuration tests
        runner.run_test("test_model_config_retrieval", test_model_config_retrieval)
        runner.run_test("test_routing_keywords", test_routing_keywords)
        runner.run_test("test_cost_estimation", test_cost_estimation)
        runner.run_test("test_command_validation", test_command_validation)
        
    except ImportError:
        print("⚠️  Skipping configuration tests (config module not available in standalone mode)")


def test_agent_integration(runner):
    """Test agent integration functionality."""
    
    from unified_agent_standalone_demo import StandaloneUnifiedAgent
    
    async def test_agent_initialization():
        agent = StandaloneUnifiedAgent()
        runner.assert_true(agent.models is not None)
        runner.assert_true("gemini-pro" in agent.models)
        runner.assert_true("claude-opus-4.1" in agent.models)
    
    async def test_agent_processing():
        agent = StandaloneUnifiedAgent()
        response = await agent.process("What is machine learning?")
        runner.assert_true(response.answer is not None)
        runner.assert_true(response.run_id is not None)
        runner.assert_true(len(response.models_used) > 0)
    
    async def test_slash_command_processing():
        agent = StandaloneUnifiedAgent()
        response = await agent.process('/model-test prompt="Hello world"')
        runner.assert_true(response.answer is not None)
        runner.assert_equal(response.mode, "lean")
        runner.assert_true(len(response.models_used) == 1)
    
    async def test_consensus_mode():
        agent = StandaloneUnifiedAgent()
        response = await agent.process("Compare SQL vs NoSQL databases")
        runner.assert_true(response.answer is not None)
        runner.assert_true(response.consensus is not None)
        runner.assert_true(len(response.models_used) >= 1)
    
    # Run async integration tests
    def run_async_test(test_func):
        asyncio.run(test_func())
    
    runner.run_test("test_agent_initialization", lambda: run_async_test(test_agent_initialization))
    runner.run_test("test_agent_processing", lambda: run_async_test(test_agent_processing))
    runner.run_test("test_slash_command_processing", lambda: run_async_test(test_slash_command_processing))
    runner.run_test("test_consensus_mode", lambda: run_async_test(test_consensus_mode))


def main():
    """Main test runner function."""
    print("🧪 Unified LLM Agent - Simple Test Runner")
    print("="*60)
    print(f"Running tests at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    runner = SimpleTestRunner()
    
    # Run test suites
    print("📋 Testing Slash Command Parsing...")
    test_slash_command_parsing(runner)
    
    print("\n🧠 Testing Intent Parsing...")
    test_intent_parsing(runner)
    
    print("\n⚙️  Testing Configuration Management...")
    test_configuration_management(runner)
    
    print("\n🔧 Testing Agent Integration...")
    test_agent_integration(runner)
    
    # Print summary
    runner.print_summary()
    
    # Return exit code
    return 0 if runner.tests_failed == 0 else 1


if __name__ == "__main__":
    try:
        exit_code = main()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n\nTests interrupted by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nUnexpected error: {e}")
        traceback.print_exc()
        sys.exit(1)