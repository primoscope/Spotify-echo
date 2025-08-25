#!/usr/bin/env python3
"""
Authentication Setup and Configuration Guide
============================================

Comprehensive authentication setup for all AI providers.
This script helps configure real authentication for:
- Google Cloud / Vertex AI
- Anthropic Claude
- OpenAI
- HuggingFace
- OpenRouter

Usage:
    python auth_setup_guide.py --check-all
    python auth_setup_guide.py --setup-provider vertex_ai
    python auth_setup_guide.py --generate-env-template
"""

import os
import json
import logging
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional
import urllib.parse

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AuthenticationSetupGuide:
    """
    Comprehensive authentication setup and validation guide.
    """
    
    def __init__(self):
        """Initialize the authentication setup guide."""
        self.auth_status = {}
        self.setup_instructions = {}
        self.env_template = {}
        
        logger.info("🔐 Authentication Setup Guide initialized")
    
    def check_all_authentication(self) -> Dict[str, Any]:
        """
        Check authentication status for all providers.
        
        Returns:
            Dict containing authentication status for all providers
        """
        logger.info("🔍 Checking authentication for all providers...")
        
        providers = [
            'google_cloud',
            'vertex_ai',
            'anthropic',
            'openai',
            'huggingface',
            'openrouter'
        ]
        
        auth_summary = {
            'overall_status': 'unknown',
            'providers_checked': {},
            'missing_credentials': [],
            'valid_credentials': [],
            'setup_required': []
        }
        
        for provider in providers:
            status = self._check_provider_auth(provider)
            auth_summary['providers_checked'][provider] = status
            
            if status['status'] == 'missing':
                auth_summary['missing_credentials'].append(provider)
                auth_summary['setup_required'].append(provider)
            elif status['status'] == 'invalid':
                auth_summary['setup_required'].append(provider)
            elif status['status'] == 'valid':
                auth_summary['valid_credentials'].append(provider)
        
        # Calculate overall status
        total = len(providers)
        valid = len(auth_summary['valid_credentials'])
        
        if valid == total:
            auth_summary['overall_status'] = 'all_configured'
        elif valid > 0:
            auth_summary['overall_status'] = 'partial_configured'
        else:
            auth_summary['overall_status'] = 'none_configured'
        
        auth_summary['completion_rate'] = valid / total
        
        self._print_auth_summary(auth_summary)
        return auth_summary
    
    def _check_provider_auth(self, provider: str) -> Dict[str, Any]:
        """Check authentication for a specific provider."""
        logger.info(f"🔍 Checking {provider} authentication...")
        
        if provider == 'google_cloud':
            return self._check_google_cloud_auth()
        elif provider == 'vertex_ai':
            return self._check_vertex_ai_auth()
        elif provider == 'anthropic':
            return self._check_anthropic_auth()
        elif provider == 'openai':
            return self._check_openai_auth()
        elif provider == 'huggingface':
            return self._check_huggingface_auth()
        elif provider == 'openrouter':
            return self._check_openrouter_auth()
        else:
            return {'status': 'unsupported', 'provider': provider}
    
    def _check_google_cloud_auth(self) -> Dict[str, Any]:
        """Check Google Cloud authentication."""
        result = {
            'provider': 'google_cloud',
            'status': 'unknown',
            'credentials_found': False,
            'project_configured': False,
            'details': {}
        }
        
        # Check for project ID
        project_id = os.environ.get('GCP_PROJECT_ID')
        if project_id:
            result['project_configured'] = True
            result['details']['project_id'] = project_id
        
        # Check for credentials
        credentials_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
        service_account_key = os.environ.get('GCP_SERVICE_ACCOUNT_KEY')
        
        if credentials_path and os.path.exists(credentials_path):
            result['credentials_found'] = True
            result['details']['credential_type'] = 'service_account_file'
            result['details']['credential_path'] = credentials_path
        elif service_account_key:
            result['credentials_found'] = True
            result['details']['credential_type'] = 'service_account_key_env'
        
        # Try to test authentication
        try:
            import google.auth
            credentials, detected_project = google.auth.default()
            result['status'] = 'valid'
            result['details']['detected_project'] = detected_project
        except Exception as e:
            if result['credentials_found'] and result['project_configured']:
                result['status'] = 'invalid'
                result['details']['error'] = str(e)
            else:
                result['status'] = 'missing'
        
        return result
    
    def _check_vertex_ai_auth(self) -> Dict[str, Any]:
        """Check Vertex AI authentication."""
        result = {
            'provider': 'vertex_ai',
            'status': 'unknown',
            'credentials_found': False,
            'details': {}
        }
        
        # Vertex AI uses Google Cloud credentials
        gcp_result = self._check_google_cloud_auth()
        result['credentials_found'] = gcp_result['credentials_found']
        
        if gcp_result['status'] == 'valid':
            try:
                import vertexai
                project_id = os.environ.get('GCP_PROJECT_ID')
                if project_id:
                    vertexai.init(project=project_id, location='us-central1')
                    result['status'] = 'valid'
                    result['details']['project_id'] = project_id
                else:
                    result['status'] = 'missing'
                    result['details']['error'] = 'GCP_PROJECT_ID not set'
            except Exception as e:
                result['status'] = 'invalid'
                result['details']['error'] = str(e)
        else:
            result['status'] = gcp_result['status']
            result['details'] = gcp_result['details']
        
        return result
    
    def _check_anthropic_auth(self) -> Dict[str, Any]:
        """Check Anthropic authentication."""
        result = {
            'provider': 'anthropic',
            'status': 'unknown',
            'credentials_found': False,
            'details': {}
        }
        
        api_key = os.environ.get('ANTHROPIC_API_KEY')
        if api_key:
            result['credentials_found'] = True
            result['details']['api_key_length'] = len(api_key)
            
            # Basic format validation
            if api_key.startswith('sk-ant-'):
                result['status'] = 'valid'  # Basic format check
            else:
                result['status'] = 'invalid'
                result['details']['error'] = 'API key format appears invalid'
        else:
            result['status'] = 'missing'
        
        return result
    
    def _check_openai_auth(self) -> Dict[str, Any]:
        """Check OpenAI authentication."""
        result = {
            'provider': 'openai',
            'status': 'unknown',
            'credentials_found': False,
            'details': {}
        }
        
        api_key = os.environ.get('OPENAI_API_KEY')
        if api_key:
            result['credentials_found'] = True
            result['details']['api_key_length'] = len(api_key)
            
            # Basic format validation
            if api_key.startswith('sk-'):
                result['status'] = 'valid'  # Basic format check
            else:
                result['status'] = 'invalid'
                result['details']['error'] = 'API key format appears invalid'
        else:
            result['status'] = 'missing'
        
        return result
    
    def _check_huggingface_auth(self) -> Dict[str, Any]:
        """Check HuggingFace authentication."""
        result = {
            'provider': 'huggingface',
            'status': 'unknown',
            'credentials_found': False,
            'details': {}
        }
        
        api_token = os.environ.get('HUGGINGFACE_API_TOKEN') or os.environ.get('HF_TOKEN')
        if api_token:
            result['credentials_found'] = True
            result['details']['token_length'] = len(api_token)
            
            # Basic format validation
            if api_token.startswith('hf_'):
                result['status'] = 'valid'  # Basic format check
            else:
                result['status'] = 'invalid'
                result['details']['error'] = 'Token format appears invalid'
        else:
            result['status'] = 'missing'
        
        return result
    
    def _check_openrouter_auth(self) -> Dict[str, Any]:
        """Check OpenRouter authentication."""
        result = {
            'provider': 'openrouter',
            'status': 'unknown',
            'credentials_found': False,
            'details': {}
        }
        
        api_key = os.environ.get('OPENROUTER_API_KEY')
        if api_key:
            result['credentials_found'] = True
            result['details']['api_key_length'] = len(api_key)
            result['status'] = 'valid'  # Basic presence check
        else:
            result['status'] = 'missing'
        
        return result
    
    def generate_setup_instructions(self, provider: str) -> Dict[str, Any]:
        """Generate detailed setup instructions for a provider."""
        logger.info(f"📝 Generating setup instructions for {provider}")
        
        instructions = {
            'provider': provider,
            'steps': [],
            'environment_variables': [],
            'verification_commands': [],
            'troubleshooting': []
        }
        
        if provider == 'google_cloud':
            instructions.update(self._get_google_cloud_setup())
        elif provider == 'vertex_ai':
            instructions.update(self._get_vertex_ai_setup())
        elif provider == 'anthropic':
            instructions.update(self._get_anthropic_setup())
        elif provider == 'openai':
            instructions.update(self._get_openai_setup())
        elif provider == 'huggingface':
            instructions.update(self._get_huggingface_setup())
        elif provider == 'openrouter':
            instructions.update(self._get_openrouter_setup())
        
        return instructions
    
    def _get_google_cloud_setup(self) -> Dict[str, Any]:
        """Get Google Cloud setup instructions."""
        return {
            'provider': 'google_cloud',
            'title': 'Google Cloud Platform Authentication Setup',
            'steps': [
                "1. Create or select a Google Cloud Project",
                "2. Enable required APIs (AI Platform, Vertex AI)",
                "3. Create a Service Account",
                "4. Download Service Account key (JSON)",
                "5. Set environment variables"
            ],
            'environment_variables': [
                {
                    'name': 'GCP_PROJECT_ID',
                    'description': 'Your Google Cloud Project ID',
                    'example': 'my-ai-project-123456',
                    'required': True
                },
                {
                    'name': 'GOOGLE_APPLICATION_CREDENTIALS',
                    'description': 'Path to service account key file',
                    'example': '/path/to/service-account-key.json',
                    'required': True
                }
            ],
            'detailed_steps': [
                {
                    'step': 'Create GCP Project',
                    'commands': [
                        'gcloud projects create my-ai-project-123456',
                        'gcloud config set project my-ai-project-123456'
                    ],
                    'description': 'Create a new Google Cloud project for AI services'
                },
                {
                    'step': 'Enable APIs',
                    'commands': [
                        'gcloud services enable aiplatform.googleapis.com',
                        'gcloud services enable vertexai.googleapis.com'
                    ],
                    'description': 'Enable required Google Cloud APIs'
                },
                {
                    'step': 'Create Service Account',
                    'commands': [
                        'gcloud iam service-accounts create ai-service-account',
                        'gcloud projects add-iam-policy-binding my-ai-project-123456 --member="serviceAccount:ai-service-account@my-ai-project-123456.iam.gserviceaccount.com" --role="roles/aiplatform.admin"'
                    ],
                    'description': 'Create service account with AI Platform permissions'
                },
                {
                    'step': 'Download Key',
                    'commands': [
                        'gcloud iam service-accounts keys create key.json --iam-account=ai-service-account@my-ai-project-123456.iam.gserviceaccount.com'
                    ],
                    'description': 'Download service account key file'
                }
            ],
            'verification_commands': [
                'python -c "import google.auth; print(google.auth.default())"',
                'gcloud auth list',
                'python real_api_validation_suite.py --providers google_cloud'
            ],
            'troubleshooting': [
                'Ensure gcloud CLI is installed and authenticated',
                'Check that the service account has proper permissions',
                'Verify the key file path is correct and accessible',
                'Ensure the project has billing enabled'
            ]
        }
    
    def _get_vertex_ai_setup(self) -> Dict[str, Any]:
        """Get Vertex AI setup instructions."""
        return {
            'provider': 'vertex_ai',
            'title': 'Google Vertex AI Authentication Setup',
            'prerequisite': 'Requires Google Cloud authentication (see google_cloud setup)',
            'steps': [
                "1. Complete Google Cloud setup first",
                "2. Enable Vertex AI API",
                "3. Configure Vertex AI location",
                "4. Test Vertex AI access"
            ],
            'environment_variables': [
                {
                    'name': 'GCP_PROJECT_ID',
                    'description': 'Google Cloud Project ID (from GCP setup)',
                    'example': 'my-ai-project-123456',
                    'required': True
                },
                {
                    'name': 'GCP_REGION',
                    'description': 'Vertex AI region',
                    'example': 'us-central1',
                    'required': False,
                    'default': 'us-central1'
                }
            ],
            'verification_commands': [
                'python -c "import vertexai; vertexai.init(project=\'your-project\', location=\'us-central1\')"',
                'python real_api_validation_suite.py --providers vertex_ai'
            ]
        }
    
    def _get_anthropic_setup(self) -> Dict[str, Any]:
        """Get Anthropic setup instructions."""
        return {
            'provider': 'anthropic',
            'title': 'Anthropic Claude API Setup',
            'steps': [
                "1. Sign up at https://console.anthropic.com",
                "2. Navigate to API Keys section",
                "3. Create a new API key",
                "4. Copy the API key",
                "5. Set environment variable"
            ],
            'environment_variables': [
                {
                    'name': 'ANTHROPIC_API_KEY',
                    'description': 'Your Anthropic API key',
                    'example': 'sk-ant-api03-...',
                    'required': True
                }
            ],
            'verification_commands': [
                'python -c "import anthropic; print(anthropic.Anthropic().models.list())"',
                'python real_api_validation_suite.py --providers anthropic'
            ],
            'security_notes': [
                'Keep your API key secure and never commit it to version control',
                'Use environment variables or secure credential management',
                'Rotate keys regularly for security'
            ]
        }
    
    def _get_openai_setup(self) -> Dict[str, Any]:
        """Get OpenAI setup instructions."""
        return {
            'provider': 'openai',
            'title': 'OpenAI API Setup',
            'steps': [
                "1. Sign up at https://platform.openai.com",
                "2. Navigate to API Keys section",
                "3. Create a new secret key",
                "4. Copy the API key",
                "5. Set environment variable"
            ],
            'environment_variables': [
                {
                    'name': 'OPENAI_API_KEY',
                    'description': 'Your OpenAI API key',
                    'example': 'sk-...',
                    'required': True
                }
            ],
            'verification_commands': [
                'python -c "import openai; print(openai.OpenAI().models.list())"',
                'python real_api_validation_suite.py --providers openai'
            ]
        }
    
    def _get_huggingface_setup(self) -> Dict[str, Any]:
        """Get HuggingFace setup instructions."""
        return {
            'provider': 'huggingface',
            'title': 'HuggingFace API Setup',
            'steps': [
                "1. Sign up at https://huggingface.co",
                "2. Navigate to Settings > Access Tokens",
                "3. Create a new token",
                "4. Copy the token",
                "5. Set environment variable"
            ],
            'environment_variables': [
                {
                    'name': 'HUGGINGFACE_API_TOKEN',
                    'description': 'Your HuggingFace API token',
                    'example': 'hf_...',
                    'required': True,
                    'alternative': 'HF_TOKEN'
                }
            ],
            'verification_commands': [
                'python -c "import requests; print(requests.get(\'https://huggingface.co/api/whoami\', headers={\'Authorization\': \'Bearer YOUR_TOKEN\'}).json())"',
                'python real_api_validation_suite.py --providers huggingface'
            ]
        }
    
    def _get_openrouter_setup(self) -> Dict[str, Any]:
        """Get OpenRouter setup instructions."""
        return {
            'provider': 'openrouter',
            'title': 'OpenRouter API Setup',
            'steps': [
                "1. Sign up at https://openrouter.ai",
                "2. Navigate to Keys section",
                "3. Create a new API key",
                "4. Copy the API key",
                "5. Set environment variable"
            ],
            'environment_variables': [
                {
                    'name': 'OPENROUTER_API_KEY',
                    'description': 'Your OpenRouter API key',
                    'example': 'sk-or-...',
                    'required': True
                }
            ],
            'verification_commands': [
                'python real_api_validation_suite.py --providers openrouter'
            ]
        }
    
    def generate_env_template(self) -> str:
        """Generate a comprehensive .env template."""
        logger.info("📝 Generating comprehensive .env template...")
        
        template = """# =============================================================================
# REAL AI API AUTHENTICATION CONFIGURATION
# =============================================================================
# Copy this to .env and fill in your actual API keys and credentials
# NO MOCK/DEMO VALUES - ONLY REAL AUTHENTICATION

# =============================================================================
# GOOGLE CLOUD / VERTEX AI AUTHENTICATION
# =============================================================================
# Required for Vertex AI, Gemini, Imagen, and Veo models
GCP_PROJECT_ID=your-gcp-project-id
GCP_REGION=us-central1

# Method 1: Service Account Key File (RECOMMENDED)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-key.json

# Method 2: Service Account Key as Environment Variable (Alternative)
# GCP_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}

# =============================================================================
# ANTHROPIC CLAUDE API
# =============================================================================
ANTHROPIC_API_KEY=sk-ant-api03-your-actual-api-key-here

# =============================================================================
# OPENAI API
# =============================================================================
OPENAI_API_KEY=sk-your-actual-openai-api-key-here

# =============================================================================
# HUGGINGFACE API
# =============================================================================
HUGGINGFACE_API_TOKEN=hf_your-actual-huggingface-token-here
# Alternative variable name (both are supported)
# HF_TOKEN=hf_your-actual-huggingface-token-here

# =============================================================================
# OPENROUTER API
# =============================================================================
OPENROUTER_API_KEY=sk-or-your-actual-openrouter-key-here

# =============================================================================
# ADDITIONAL AI PROVIDERS (Optional)
# =============================================================================
# Add other AI provider keys as needed
PERPLEXITY_API_KEY=pplx-your-actual-perplexity-key-here
XAI_API_KEY=your-actual-xai-key-here

# =============================================================================
# TESTING AND VALIDATION FLAGS
# =============================================================================
# Disable all mock/demo functionality (ALWAYS TRUE for real API testing)
AI_DISABLE_MOCK_IN_PROD=true
AI_ALLOW_MOCK_IN_PROD=false
REAL_API_TESTING_ONLY=true

# =============================================================================
# SPOTIFY API (For main music application)
# =============================================================================
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/auth/callback

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================
MONGODB_URI=mongodb://localhost:27017/echotune_ai
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/echotune_ai

# =============================================================================
# SECURITY NOTES
# =============================================================================
# 1. NEVER commit this file with real credentials to version control
# 2. Use different API keys for development, staging, and production
# 3. Rotate API keys regularly for security
# 4. Monitor API usage and set up billing alerts
# 5. Use environment-specific .env files (.env.development, .env.production)
"""
        
        # Save template to file
        template_path = Path('.env.real-api-template')
        with open(template_path, 'w') as f:
            f.write(template)
        
        logger.info(f"📄 Environment template saved to: {template_path}")
        return template
    
    def _print_auth_summary(self, summary: Dict[str, Any]) -> None:
        """Print a formatted authentication summary."""
        print("\n" + "="*80)
        print("🔐 AUTHENTICATION STATUS SUMMARY")
        print("="*80)
        
        status_emoji = {
            'all_configured': '✅',
            'partial_configured': '⚠️',
            'none_configured': '❌'
        }
        
        overall_emoji = status_emoji.get(summary['overall_status'], '❓')
        print(f"{overall_emoji} Overall Status: {summary['overall_status'].upper()}")
        print(f"📊 Completion Rate: {summary['completion_rate']:.1%}")
        
        print(f"\n📋 PROVIDER STATUS:")
        for provider, status in summary['providers_checked'].items():
            emoji = "✅" if status['status'] == 'valid' else "❌" if status['status'] == 'missing' else "⚠️"
            print(f"  {emoji} {provider.upper()}: {status['status']}")
            
            if status['status'] == 'valid' and status.get('details'):
                details = status['details']
                if 'project_id' in details:
                    print(f"      Project: {details['project_id']}")
                if 'credential_type' in details:
                    print(f"      Auth Type: {details['credential_type']}")
        
        if summary['missing_credentials']:
            print(f"\n❌ MISSING CREDENTIALS ({len(summary['missing_credentials'])}):")
            for provider in summary['missing_credentials']:
                print(f"  - {provider}")
        
        if summary['setup_required']:
            print(f"\n🔧 SETUP REQUIRED:")
            print(f"Run: python auth_setup_guide.py --setup-provider <provider_name>")
            print(f"Available providers: {', '.join(summary['setup_required'])}")
        
        print("="*80)

def main():
    """Main function for authentication setup guide."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Authentication Setup Guide")
    parser.add_argument("--check-all", action="store_true",
                       help="Check authentication status for all providers")
    parser.add_argument("--setup-provider", type=str,
                       help="Generate setup instructions for a specific provider")
    parser.add_argument("--generate-env-template", action="store_true",
                       help="Generate .env template with all required variables")
    parser.add_argument("--list-providers", action="store_true",
                       help="List all supported providers")
    
    args = parser.parse_args()
    
    guide = AuthenticationSetupGuide()
    
    if args.list_providers:
        providers = ['google_cloud', 'vertex_ai', 'anthropic', 'openai', 'huggingface', 'openrouter']
        print("📋 Supported Providers:")
        for provider in providers:
            print(f"  - {provider}")
        return
    
    if args.generate_env_template:
        template = guide.generate_env_template()
        print("📝 Environment template generated!")
        print("📁 File: .env.real-api-template")
        print("⚠️ Copy to .env and add your real API keys")
        return
    
    if args.setup_provider:
        instructions = guide.generate_setup_instructions(args.setup_provider)
        print(f"\n📝 SETUP INSTRUCTIONS: {instructions['title']}")
        print("="*60)
        
        for step in instructions['steps']:
            print(f"  {step}")
        
        if 'environment_variables' in instructions:
            print(f"\n🔧 ENVIRONMENT VARIABLES:")
            for var in instructions['environment_variables']:
                req_text = "REQUIRED" if var.get('required', False) else "OPTIONAL"
                print(f"  {var['name']} ({req_text})")
                print(f"    Description: {var['description']}")
                print(f"    Example: {var['example']}")
                if var.get('default'):
                    print(f"    Default: {var['default']}")
                print()
        
        if 'verification_commands' in instructions:
            print(f"🧪 VERIFICATION COMMANDS:")
            for cmd in instructions['verification_commands']:
                print(f"  {cmd}")
        
        return
    
    if args.check_all or not any(vars(args).values()):
        # Default action
        summary = guide.check_all_authentication()
        
        if summary['overall_status'] == 'all_configured':
            print("\n🎉 All authentication configured! Run real API tests:")
            print("python real_api_validation_suite.py --full-validation")
        else:
            print("\n🔧 Setup required for some providers.")
            print("Use: python auth_setup_guide.py --setup-provider <provider>")

if __name__ == "__main__":
    main()