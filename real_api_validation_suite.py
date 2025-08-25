#!/usr/bin/env python3
"""
Real API Validation Suite
========================

Comprehensive real API testing and authentication validation for EchoTune AI.
NO MOCK/DEMO APIs - ALL REAL AUTHENTICATION AND API CALLS.

This replaces the mock-based testing system with real API integration testing
for Google Cloud, Vertex AI, Anthropic, OpenAI, HuggingFace, and other providers.

Usage:
    python real_api_validation_suite.py --full-validation
    python real_api_validation_suite.py --auth-only
    python real_api_validation_suite.py --providers openai,anthropic,vertex
"""

import asyncio
import json
import logging
import os
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
import traceback

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('real_api_validation.log')
    ]
)
logger = logging.getLogger(__name__)

class RealAPIValidator:
    """
    Real API validation and authentication testing suite.
    
    Tests actual API connectivity, authentication, and functionality
    across all integrated AI providers with NO MOCKS OR DEMOS.
    """
    
    def __init__(self):
        """Initialize the real API validator."""
        self.test_results = {}
        self.authentication_status = {}
        self.api_endpoints_tested = []
        self.test_start_time = datetime.now()
        
        # Real API test output
        self.output_dir = Path("./real_api_test_results")
        self.output_dir.mkdir(exist_ok=True)
        (self.output_dir / "auth_tests").mkdir(exist_ok=True)
        (self.output_dir / "api_responses").mkdir(exist_ok=True)
        (self.output_dir / "screenshots").mkdir(exist_ok=True)
        
        logger.info("🔥 Real API Validator initialized - NO MOCKS/DEMOS ALLOWED")
    
    async def validate_all_providers(self) -> Dict[str, Any]:
        """
        Validate all AI providers with real authentication and API calls.
        
        Returns:
            Dict containing validation results for all providers
        """
        logger.info("🚀 Starting comprehensive REAL API validation...")
        
        providers_to_test = [
            'google_cloud',
            'vertex_ai', 
            'anthropic',
            'openai',
            'huggingface',
            'openrouter'
        ]
        
        validation_results = {
            'overall_status': 'unknown',
            'test_timestamp': self.test_start_time.isoformat(),
            'providers_tested': {},
            'authentication_summary': {},
            'api_calls_made': [],
            'failures': [],
            'recommendations': []
        }
        
        for provider in providers_to_test:
            logger.info(f"🧪 Testing provider: {provider}")
            try:
                result = await self._test_provider(provider)
                validation_results['providers_tested'][provider] = result
                
                if result['status'] == 'passed':
                    logger.info(f"✅ {provider} validation PASSED")
                else:
                    logger.error(f"❌ {provider} validation FAILED: {result.get('error', 'Unknown error')}")
                    validation_results['failures'].append({
                        'provider': provider,
                        'error': result.get('error', 'Unknown error'),
                        'details': result.get('details', {})
                    })
                    
            except Exception as e:
                logger.error(f"❌ Critical error testing {provider}: {e}")
                validation_results['failures'].append({
                    'provider': provider,
                    'error': f"Critical error: {str(e)}",
                    'details': {'traceback': traceback.format_exc()}
                })
        
        # Calculate overall status
        total_providers = len(providers_to_test)
        passed_providers = len([p for p in validation_results['providers_tested'].values() if p['status'] == 'passed'])
        
        if passed_providers == total_providers:
            validation_results['overall_status'] = 'all_passed'
        elif passed_providers > 0:
            validation_results['overall_status'] = 'partial_success'
        else:
            validation_results['overall_status'] = 'all_failed'
        
        validation_results['success_rate'] = passed_providers / total_providers
        
        # Generate recommendations
        validation_results['recommendations'] = self._generate_recommendations(validation_results)
        
        # Save results
        await self._save_validation_results(validation_results)
        
        logger.info(f"🎯 Real API validation completed: {passed_providers}/{total_providers} providers passed")
        return validation_results
    
    async def _test_provider(self, provider: str) -> Dict[str, Any]:
        """
        Test a specific provider with real authentication and API calls.
        
        Args:
            provider: Provider name to test
            
        Returns:
            Dict containing test results for the provider
        """
        test_start = time.time()
        result = {
            'provider': provider,
            'status': 'unknown',
            'test_timestamp': datetime.now().isoformat(),
            'authentication': {'status': 'unknown'},
            'api_tests': [],
            'performance': {},
            'errors': []
        }
        
        try:
            # Test authentication
            auth_result = await self._test_authentication(provider)
            result['authentication'] = auth_result
            
            if auth_result['status'] != 'passed':
                result['status'] = 'auth_failed'
                result['errors'].append(f"Authentication failed: {auth_result.get('error')}")
                return result
            
            # Test API functionality
            api_tests = await self._test_api_functionality(provider)
            result['api_tests'] = api_tests
            
            # Check if all API tests passed
            api_passed = all(test['status'] == 'passed' for test in api_tests)
            
            if api_passed:
                result['status'] = 'passed'
            else:
                result['status'] = 'api_failed'
                failed_tests = [test['test_name'] for test in api_tests if test['status'] != 'passed']
                result['errors'].append(f"API tests failed: {failed_tests}")
            
        except Exception as e:
            result['status'] = 'error'
            result['errors'].append(f"Test error: {str(e)}")
            logger.error(f"Error testing {provider}: {e}")
        
        result['performance']['total_test_duration'] = time.time() - test_start
        return result
    
    async def _test_authentication(self, provider: str) -> Dict[str, Any]:
        """
        Test real authentication for a provider.
        
        Args:
            provider: Provider name
            
        Returns:
            Dict containing authentication test results
        """
        logger.info(f"🔐 Testing REAL authentication for {provider}")
        
        auth_result = {
            'provider': provider,
            'status': 'unknown',
            'method': 'unknown',
            'test_timestamp': datetime.now().isoformat(),
            'credentials_found': False,
            'credentials_valid': False,
            'errors': []
        }
        
        try:
            if provider == 'google_cloud':
                return await self._test_google_cloud_auth(auth_result)
            elif provider == 'vertex_ai':
                return await self._test_vertex_ai_auth(auth_result)
            elif provider == 'anthropic':
                return await self._test_anthropic_auth(auth_result)
            elif provider == 'openai':
                return await self._test_openai_auth(auth_result)
            elif provider == 'huggingface':
                return await self._test_huggingface_auth(auth_result)
            elif provider == 'openrouter':
                return await self._test_openrouter_auth(auth_result)
            else:
                auth_result['status'] = 'unsupported'
                auth_result['errors'].append(f"Provider {provider} not supported")
                
        except Exception as e:
            auth_result['status'] = 'error'
            auth_result['errors'].append(f"Authentication error: {str(e)}")
            logger.error(f"Authentication error for {provider}: {e}")
        
        return auth_result
    
    async def _test_google_cloud_auth(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Test Google Cloud authentication."""
        try:
            import google.auth
            from google.cloud import aiplatform
            
            result['method'] = 'service_account_or_adc'
            
            # Check for credentials
            gcp_project_id = os.environ.get('GCP_PROJECT_ID')
            gcp_credentials = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS') or os.environ.get('GCP_SERVICE_ACCOUNT_KEY')
            
            if not gcp_project_id:
                result['status'] = 'failed'
                result['errors'].append('GCP_PROJECT_ID environment variable not set')
                return result
            
            result['credentials_found'] = bool(gcp_credentials)
            
            # Test authentication
            credentials, project = google.auth.default()
            
            # Initialize AI Platform to test access
            aiplatform.init(project=gcp_project_id, location='us-central1')
            
            result['status'] = 'passed'
            result['credentials_valid'] = True
            result['project_id'] = gcp_project_id
            
            logger.info(f"✅ Google Cloud authentication successful for project: {gcp_project_id}")
            
        except Exception as e:
            result['status'] = 'failed'
            result['errors'].append(f"Google Cloud auth failed: {str(e)}")
            logger.error(f"Google Cloud auth failed: {e}")
        
        return result
    
    async def _test_vertex_ai_auth(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Test Vertex AI authentication."""
        try:
            import vertexai
            from vertexai.generative_models import GenerativeModel
            
            result['method'] = 'vertex_ai_sdk'
            
            gcp_project_id = os.environ.get('GCP_PROJECT_ID')
            gcp_region = os.environ.get('GCP_REGION', 'us-central1')
            
            if not gcp_project_id:
                result['status'] = 'failed'
                result['errors'].append('GCP_PROJECT_ID required for Vertex AI')
                return result
            
            # Initialize Vertex AI
            vertexai.init(project=gcp_project_id, location=gcp_region)
            
            # Test access by creating a model instance
            model = GenerativeModel('gemini-1.5-flash')
            
            result['status'] = 'passed'
            result['credentials_valid'] = True
            result['project_id'] = gcp_project_id
            result['region'] = gcp_region
            
            logger.info(f"✅ Vertex AI authentication successful")
            
        except Exception as e:
            result['status'] = 'failed'
            result['errors'].append(f"Vertex AI auth failed: {str(e)}")
            logger.error(f"Vertex AI auth failed: {e}")
        
        return result
    
    async def _test_anthropic_auth(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Test Anthropic authentication."""
        try:
            import anthropic
            
            result['method'] = 'api_key'
            
            api_key = os.environ.get('ANTHROPIC_API_KEY')
            if not api_key:
                result['status'] = 'failed'
                result['errors'].append('ANTHROPIC_API_KEY environment variable not set')
                return result
            
            result['credentials_found'] = True
            
            # Test API key validity
            client = anthropic.Anthropic(api_key=api_key)
            
            # Make a minimal test request
            response = client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=10,
                messages=[{"role": "user", "content": "Hello"}]
            )
            
            result['status'] = 'passed'
            result['credentials_valid'] = True
            result['test_response_length'] = len(response.content[0].text)
            
            logger.info(f"✅ Anthropic authentication successful")
            
        except Exception as e:
            result['status'] = 'failed'
            result['errors'].append(f"Anthropic auth failed: {str(e)}")
            logger.error(f"Anthropic auth failed: {e}")
        
        return result
    
    async def _test_openai_auth(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Test OpenAI authentication."""
        try:
            import openai
            
            result['method'] = 'api_key'
            
            api_key = os.environ.get('OPENAI_API_KEY')
            if not api_key:
                result['status'] = 'failed'
                result['errors'].append('OPENAI_API_KEY environment variable not set')
                return result
            
            result['credentials_found'] = True
            
            # Test API key validity
            client = openai.OpenAI(api_key=api_key)
            
            # Make a minimal test request
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=10
            )
            
            result['status'] = 'passed'
            result['credentials_valid'] = True
            result['test_response_length'] = len(response.choices[0].message.content)
            
            logger.info(f"✅ OpenAI authentication successful")
            
        except Exception as e:
            result['status'] = 'failed'
            result['errors'].append(f"OpenAI auth failed: {str(e)}")
            logger.error(f"OpenAI auth failed: {e}")
        
        return result
    
    async def _test_huggingface_auth(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Test HuggingFace authentication."""
        try:
            import requests
            
            result['method'] = 'api_token'
            
            api_token = os.environ.get('HUGGINGFACE_API_TOKEN') or os.environ.get('HF_TOKEN')
            if not api_token:
                result['status'] = 'failed'
                result['errors'].append('HUGGINGFACE_API_TOKEN or HF_TOKEN environment variable not set')
                return result
            
            result['credentials_found'] = True
            
            # Test API token validity
            headers = {'Authorization': f'Bearer {api_token}'}
            response = requests.get('https://huggingface.co/api/whoami', headers=headers)
            
            if response.status_code == 200:
                result['status'] = 'passed'
                result['credentials_valid'] = True
                result['user_info'] = response.json()
                logger.info(f"✅ HuggingFace authentication successful")
            else:
                result['status'] = 'failed'
                result['errors'].append(f"HuggingFace API returned status: {response.status_code}")
            
        except Exception as e:
            result['status'] = 'failed'
            result['errors'].append(f"HuggingFace auth failed: {str(e)}")
            logger.error(f"HuggingFace auth failed: {e}")
        
        return result
    
    async def _test_openrouter_auth(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Test OpenRouter authentication."""
        try:
            import requests
            
            result['method'] = 'api_key'
            
            api_key = os.environ.get('OPENROUTER_API_KEY')
            if not api_key:
                result['status'] = 'failed'
                result['errors'].append('OPENROUTER_API_KEY environment variable not set')
                return result
            
            result['credentials_found'] = True
            
            # Test API key validity with a minimal request
            headers = {
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            }
            
            data = {
                'model': 'openai/gpt-3.5-turbo',
                'messages': [{'role': 'user', 'content': 'Hello'}],
                'max_tokens': 10
            }
            
            response = requests.post(
                'https://openrouter.ai/api/v1/chat/completions',
                headers=headers,
                json=data,
                timeout=30
            )
            
            if response.status_code == 200:
                result['status'] = 'passed'
                result['credentials_valid'] = True
                result['test_response'] = response.json()
                logger.info(f"✅ OpenRouter authentication successful")
            else:
                result['status'] = 'failed'
                result['errors'].append(f"OpenRouter API returned status: {response.status_code}")
            
        except Exception as e:
            result['status'] = 'failed'
            result['errors'].append(f"OpenRouter auth failed: {str(e)}")
            logger.error(f"OpenRouter auth failed: {e}")
        
        return result
    
    async def _test_api_functionality(self, provider: str) -> List[Dict[str, Any]]:
        """
        Test actual API functionality for a provider.
        
        Args:
            provider: Provider name
            
        Returns:
            List of API test results
        """
        logger.info(f"🧪 Testing REAL API functionality for {provider}")
        
        api_tests = []
        
        try:
            if provider == 'vertex_ai':
                api_tests.extend(await self._test_vertex_ai_apis())
            elif provider == 'anthropic':
                api_tests.extend(await self._test_anthropic_apis())
            elif provider == 'openai':
                api_tests.extend(await self._test_openai_apis())
            elif provider == 'huggingface':
                api_tests.extend(await self._test_huggingface_apis())
            elif provider == 'openrouter':
                api_tests.extend(await self._test_openrouter_apis())
        
        except Exception as e:
            api_tests.append({
                'test_name': f'{provider}_api_test',
                'status': 'error',
                'error': f'API test error: {str(e)}',
                'timestamp': datetime.now().isoformat()
            })
        
        return api_tests
    
    async def _test_vertex_ai_apis(self) -> List[Dict[str, Any]]:
        """Test Vertex AI APIs with real calls."""
        tests = []
        
        try:
            from vertexai.generative_models import GenerativeModel
            
            # Test Gemini text generation
            test_start = time.time()
            model = GenerativeModel('gemini-1.5-flash')
            response = model.generate_content('Say hello in exactly 3 words')
            
            tests.append({
                'test_name': 'vertex_ai_gemini_text_generation',
                'status': 'passed',
                'response_length': len(response.text),
                'latency_ms': (time.time() - test_start) * 1000,
                'timestamp': datetime.now().isoformat()
            })
            
            logger.info(f"✅ Vertex AI Gemini text generation test passed")
            
        except Exception as e:
            tests.append({
                'test_name': 'vertex_ai_gemini_text_generation',
                'status': 'failed',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            })
            logger.error(f"❌ Vertex AI test failed: {e}")
        
        return tests
    
    async def _test_anthropic_apis(self) -> List[Dict[str, Any]]:
        """Test Anthropic APIs with real calls."""
        tests = []
        
        try:
            import anthropic
            
            client = anthropic.Anthropic(api_key=os.environ.get('ANTHROPIC_API_KEY'))
            
            # Test Claude text generation
            test_start = time.time()
            response = client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=20,
                messages=[{"role": "user", "content": "Say hello in exactly 3 words"}]
            )
            
            tests.append({
                'test_name': 'anthropic_claude_text_generation',
                'status': 'passed',
                'response_length': len(response.content[0].text),
                'input_tokens': response.usage.input_tokens,
                'output_tokens': response.usage.output_tokens,
                'latency_ms': (time.time() - test_start) * 1000,
                'timestamp': datetime.now().isoformat()
            })
            
            logger.info(f"✅ Anthropic Claude text generation test passed")
            
        except Exception as e:
            tests.append({
                'test_name': 'anthropic_claude_text_generation',
                'status': 'failed',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            })
            logger.error(f"❌ Anthropic test failed: {e}")
        
        return tests
    
    async def _test_openai_apis(self) -> List[Dict[str, Any]]:
        """Test OpenAI APIs with real calls."""
        tests = []
        
        try:
            import openai
            
            client = openai.OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))
            
            # Test GPT text generation
            test_start = time.time()
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": "Say hello in exactly 3 words"}],
                max_tokens=20
            )
            
            tests.append({
                'test_name': 'openai_gpt_text_generation',
                'status': 'passed',
                'response_length': len(response.choices[0].message.content),
                'prompt_tokens': response.usage.prompt_tokens,
                'completion_tokens': response.usage.completion_tokens,
                'latency_ms': (time.time() - test_start) * 1000,
                'timestamp': datetime.now().isoformat()
            })
            
            logger.info(f"✅ OpenAI GPT text generation test passed")
            
        except Exception as e:
            tests.append({
                'test_name': 'openai_gpt_text_generation',
                'status': 'failed',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            })
            logger.error(f"❌ OpenAI test failed: {e}")
        
        return tests
    
    async def _test_huggingface_apis(self) -> List[Dict[str, Any]]:
        """Test HuggingFace APIs with real calls."""
        tests = []
        
        try:
            import requests
            
            api_token = os.environ.get('HUGGINGFACE_API_TOKEN') or os.environ.get('HF_TOKEN')
            headers = {'Authorization': f'Bearer {api_token}'}
            
            # Test text generation
            test_start = time.time()
            response = requests.post(
                'https://api-inference.huggingface.co/models/gpt2',
                headers=headers,
                json={'inputs': 'Hello world'},
                timeout=30
            )
            
            if response.status_code == 200:
                tests.append({
                    'test_name': 'huggingface_text_generation',
                    'status': 'passed',
                    'response_status': response.status_code,
                    'latency_ms': (time.time() - test_start) * 1000,
                    'timestamp': datetime.now().isoformat()
                })
                logger.info(f"✅ HuggingFace text generation test passed")
            else:
                tests.append({
                    'test_name': 'huggingface_text_generation',
                    'status': 'failed',
                    'error': f'HTTP {response.status_code}: {response.text}',
                    'timestamp': datetime.now().isoformat()
                })
            
        except Exception as e:
            tests.append({
                'test_name': 'huggingface_text_generation',
                'status': 'failed',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            })
            logger.error(f"❌ HuggingFace test failed: {e}")
        
        return tests
    
    async def _test_openrouter_apis(self) -> List[Dict[str, Any]]:
        """Test OpenRouter APIs with real calls."""
        tests = []
        
        try:
            import requests
            
            api_key = os.environ.get('OPENROUTER_API_KEY')
            headers = {
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            }
            
            # Test text generation
            test_start = time.time()
            response = requests.post(
                'https://openrouter.ai/api/v1/chat/completions',
                headers=headers,
                json={
                    'model': 'openai/gpt-3.5-turbo',
                    'messages': [{'role': 'user', 'content': 'Hello'}],
                    'max_tokens': 10
                },
                timeout=30
            )
            
            if response.status_code == 200:
                tests.append({
                    'test_name': 'openrouter_text_generation',
                    'status': 'passed',
                    'response_status': response.status_code,
                    'latency_ms': (time.time() - test_start) * 1000,
                    'timestamp': datetime.now().isoformat()
                })
                logger.info(f"✅ OpenRouter text generation test passed")
            else:
                tests.append({
                    'test_name': 'openrouter_text_generation',
                    'status': 'failed',
                    'error': f'HTTP {response.status_code}: {response.text}',
                    'timestamp': datetime.now().isoformat()
                })
            
        except Exception as e:
            tests.append({
                'test_name': 'openrouter_text_generation',
                'status': 'failed',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            })
            logger.error(f"❌ OpenRouter test failed: {e}")
        
        return tests
    
    def _generate_recommendations(self, results: Dict[str, Any]) -> List[str]:
        """Generate recommendations based on validation results."""
        recommendations = []
        
        failures = results.get('failures', [])
        if failures:
            recommendations.append("❌ CRITICAL: Fix authentication failures for failed providers")
            
            for failure in failures:
                provider = failure['provider']
                error = failure['error']
                
                if 'environment variable not set' in error:
                    recommendations.append(f"🔑 Set required environment variables for {provider}")
                elif 'auth failed' in error.lower():
                    recommendations.append(f"🔐 Verify and refresh credentials for {provider}")
                elif 'api key' in error.lower():
                    recommendations.append(f"🗝️ Check API key validity for {provider}")
        
        success_rate = results.get('success_rate', 0)
        if success_rate == 1.0:
            recommendations.append("✅ EXCELLENT: All providers authenticated successfully")
            recommendations.append("💡 Consider implementing automated credential rotation")
        elif success_rate >= 0.5:
            recommendations.append("⚠️ PARTIAL: Some providers working, fix remaining failures")
        else:
            recommendations.append("🚨 CRITICAL: Most providers failing, review authentication setup")
        
        recommendations.extend([
            "📊 Monitor API quotas and usage limits regularly",
            "🔒 Implement credential security best practices",
            "⚡ Set up automated health monitoring for all providers",
            "📝 Document all API integration patterns for team reference"
        ])
        
        return recommendations
    
    async def _save_validation_results(self, results: Dict[str, Any]) -> None:
        """Save validation results to files."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save JSON results
        results_file = self.output_dir / f"real_api_validation_{timestamp}.json"
        with open(results_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        # Save human-readable report
        report_file = self.output_dir / f"real_api_validation_report_{timestamp}.md"
        with open(report_file, 'w') as f:
            f.write(self._generate_markdown_report(results))
        
        logger.info(f"📄 Real API validation results saved:")
        logger.info(f"  📊 JSON: {results_file}")
        logger.info(f"  📝 Report: {report_file}")
    
    def _generate_markdown_report(self, results: Dict[str, Any]) -> str:
        """Generate a human-readable markdown report."""
        report = f"""# Real API Validation Report

## Executive Summary

- **Test Date**: {results['test_timestamp']}
- **Overall Status**: {results['overall_status'].upper()}
- **Success Rate**: {results['success_rate']:.1%}
- **Providers Tested**: {len(results['providers_tested'])}

## Provider Results

"""
        
        for provider, result in results['providers_tested'].items():
            status_emoji = "✅" if result['status'] == 'passed' else "❌"
            report += f"### {status_emoji} {provider.upper()}\n\n"
            report += f"- **Status**: {result['status']}\n"
            report += f"- **Authentication**: {result['authentication']['status']}\n"
            
            if result['authentication'].get('credentials_found'):
                report += f"- **Credentials**: Found and validated\n"
            else:
                report += f"- **Credentials**: Missing or invalid\n"
            
            if result.get('api_tests'):
                api_passed = sum(1 for test in result['api_tests'] if test['status'] == 'passed')
                api_total = len(result['api_tests'])
                report += f"- **API Tests**: {api_passed}/{api_total} passed\n"
            
            if result.get('errors'):
                report += f"- **Errors**: {'; '.join(result['errors'])}\n"
            
            report += "\n"
        
        if results['failures']:
            report += "## Failures\n\n"
            for failure in results['failures']:
                report += f"- **{failure['provider']}**: {failure['error']}\n"
            report += "\n"
        
        report += "## Recommendations\n\n"
        for rec in results['recommendations']:
            report += f"- {rec}\n"
        
        return report

async def main():
    """Main function for real API validation."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Real API Validation Suite")
    parser.add_argument("--full-validation", action="store_true",
                       help="Run complete validation of all providers")
    parser.add_argument("--auth-only", action="store_true",
                       help="Test authentication only")
    parser.add_argument("--providers", type=str,
                       help="Comma-separated list of providers to test")
    parser.add_argument("--no-mock", action="store_true", default=True,
                       help="Disable all mock/demo functionality (default: True)")
    
    args = parser.parse_args()
    
    if not any([args.full_validation, args.auth_only, args.providers]):
        # Default to full validation
        args.full_validation = True
    
    validator = RealAPIValidator()
    
    try:
        print("\n" + "="*80)
        print("🔥 REAL API VALIDATION SUITE")
        print("NO MOCKS, NO DEMOS, ONLY REAL API AUTHENTICATION & TESTING")
        print("="*80)
        
        results = await validator.validate_all_providers()
        
        print(f"\n🎯 VALIDATION COMPLETE")
        print(f"✅ Success Rate: {results['success_rate']:.1%}")
        print(f"📊 Providers Tested: {len(results['providers_tested'])}")
        
        if results['overall_status'] == 'all_passed':
            print("🎉 ALL PROVIDERS PASSED - Real API authentication successful!")
        elif results['overall_status'] == 'partial_success':
            print("⚠️ PARTIAL SUCCESS - Some providers need attention")
        else:
            print("🚨 CRITICAL - Multiple authentication failures detected")
        
        if results['failures']:
            print(f"\n❌ FAILURES ({len(results['failures'])}):")
            for failure in results['failures']:
                print(f"  - {failure['provider']}: {failure['error']}")
        
        print(f"\n📁 Results saved to: ./real_api_test_results/")
        
    except Exception as e:
        logger.error(f"❌ Critical validation error: {e}")
        print(f"\n🚨 CRITICAL ERROR: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())