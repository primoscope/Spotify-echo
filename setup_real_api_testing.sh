#!/bin/bash

# Real API Testing Setup and Validation Script
# ============================================
# This script sets up the environment for real API testing and validates authentication

set -e  # Exit on any error

echo "🔥 EchoTune AI - Real API Testing Setup"
echo "NO MOCKS, NO DEMOS, ONLY REAL AUTHENTICATION"
echo "=" $(printf '=%.0s' {1..50})

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Install Python dependencies for real API testing
echo "📦 Installing Python dependencies..."
pip install --upgrade pip

# Core AI provider SDKs
pip install google-cloud-aiplatform anthropic openai requests

# Additional dependencies
pip install vertexai pydantic pydantic-settings

# Optional but recommended
pip install python-dotenv pillow

echo "✅ Dependencies installed"

# Check Python environment
echo ""
echo "🐍 Python Environment Check:"
python --version
pip --version

# Check for environment file
echo ""
echo "📝 Environment Configuration Check:"
if [ -f ".env" ]; then
    echo "✅ .env file found"
    
    # Check for critical API keys (without revealing values)
    if grep -q "GCP_PROJECT_ID=" .env; then
        echo "✅ GCP_PROJECT_ID configured"
    else
        echo "❌ GCP_PROJECT_ID not found in .env"
    fi
    
    if grep -q "ANTHROPIC_API_KEY=" .env; then
        echo "✅ ANTHROPIC_API_KEY configured"
    else
        echo "❌ ANTHROPIC_API_KEY not found in .env"
    fi
    
    if grep -q "OPENAI_API_KEY=" .env; then
        echo "✅ OPENAI_API_KEY configured"
    else
        echo "❌ OPENAI_API_KEY not found in .env"
    fi
    
else
    echo "❌ .env file not found"
    echo "📝 Generating environment template..."
    python auth_setup_guide.py --generate-env-template
    echo "⚠️ Copy .env.real-api-template to .env and add your API keys"
fi

echo ""
echo "🔐 Running Authentication Check..."
python auth_setup_guide.py --check-all

echo ""
echo "🧪 Running Real API Validation..."
python real_api_validation_suite.py --full-validation

echo ""
echo "🧪 Running Real Model Testing..."
python comprehensive_model_test.py --auth-check --text-only

echo ""
echo "🎯 Real API Testing Setup Complete!"
echo "📋 Next Steps:"
echo "  1. If any authentication failed, run: python auth_setup_guide.py --setup-provider <provider>"
echo "  2. For full model testing: python comprehensive_model_test.py --full-report"
echo "  3. For cow image validation: python comprehensive_model_test.py --generate-cows"
echo "  4. For real API validation: python real_api_validation_suite.py --full-validation"