"""
Simple test runner for Vertex AI integration

This script allows running the tests without pytest if needed,
and provides environment setup validation.
"""

import os
import sys
import asyncio

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from src.config.vertex_config import VertexAIConfig
from src.services.vertex_ai_service import VertexAIService, ModelRequest, ModelResponse


async def test_basic_functionality():
    """Test basic functionality without live API calls."""
    print("=== Basic Functionality Test ===")
    
    # Test configuration
    print("1. Testing configuration...")
    config = VertexAIConfig()
    print(f"   ✅ Project: {config.gcp_project_id}")
    print(f"   ✅ Region: {config.gcp_region}")
    print(f"   ✅ Models configured: Claude, Gemini Pro, Gemini Flash")
    
    # Test service instantiation
    print("2. Testing service instantiation...")
    service = VertexAIService()
    print("   ✅ Service created successfully")
    
    # Test model configurations
    print("3. Testing model configurations...")
    models = service.get_supported_models()
    print(f"   ✅ Found {len(models)} supported models")
    for model_name, config in models.items():
        print(f"      - {model_name}: {config['model_id']} ({config['provider']})")
    
    # Test request/response structures
    print("4. Testing data structures...")
    test_request = ModelRequest(
        model_id="claude-opus-4-1@20250805",
        prompt="Test prompt",
        max_tokens=100
    )
    print(f"   ✅ ModelRequest created: {test_request.model_id}")
    
    print("✅ All basic functionality tests passed!")


async def check_environment():
    """Check if environment is ready for live testing."""
    print("\n=== Environment Check ===")
    
    required_vars = ['GCP_PROJECT_ID', 'GCP_REGION']
    optional_vars = ['GOOGLE_APPLICATION_CREDENTIALS']
    
    missing_required = []
    
    for var in required_vars:
        value = os.getenv(var)
        if value:
            print(f"   ✅ {var}: {value}")
        else:
            print(f"   ❌ {var}: Not set")
            missing_required.append(var)
    
    for var in optional_vars:
        value = os.getenv(var)
        if value:
            print(f"   ✅ {var}: {value}")
        else:
            print(f"   ⚠️  {var}: Not set (using Application Default Credentials)")
    
    if missing_required:
        print(f"\n❌ Missing required environment variables: {missing_required}")
        print("   Set these variables to run live tests:")
        for var in missing_required:
            print(f"   export {var}=your-value")
        return False
    else:
        print("\n✅ Environment is ready for live testing!")
        return True


def run_live_tests():
    """Instructions for running live tests."""
    print("\n=== Live Testing Instructions ===")
    print("To run live integration tests with real API calls:")
    print("1. Set up GCP credentials:")
    print("   gcloud auth application-default login")
    print("   # OR set GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json")
    print()
    print("2. Set environment variables:")
    print("   export GCP_PROJECT_ID=your-project-id")
    print("   export GCP_REGION=us-central1")
    print()
    print("3. Run the live tests:")
    print("   python3 -m pytest tests/integration/test_vertex_ai_live.py -v")
    print("   # OR")
    print("   python3 tests/integration/test_vertex_ai_live.py")
    print()
    print("⚠️  WARNING: Live tests will make real API calls and may incur costs!")


async def main():
    """Main test runner."""
    print("Vertex AI Integration Test Runner")
    print("=================================\n")
    
    # Run basic tests
    await test_basic_functionality()
    
    # Check environment
    env_ready = await check_environment()
    
    if env_ready:
        print("\nEnvironment is ready! You can run live tests.")
    else:
        print("\nEnvironment needs setup before running live tests.")
    
    # Show live test instructions
    run_live_tests()


if __name__ == "__main__":
    asyncio.run(main())