#!/usr/bin/env python3
"""
Enhanced Issue Analysis with Budget Integration

Analyzes GitHub issues using Perplexity API with comprehensive budget management,
caching, and dynamic model selection based on complexity.

Key Features:
- Pre-analysis budget validation
- Intelligent model selection based on complexity
- Response caching to reduce costs
- Usage tracking and cost reporting
- Graceful degradation when budget limits reached
"""

import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
import requests
import argparse

# Import our utility modules
try:
    from perplexity_costs import PerplexityCostManager
    from perplexity_cache import PerplexityCacheManager
    from complexity_classifier import ComplexityClassifier
except ImportError:
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from perplexity_costs import PerplexityCostManager
    from perplexity_cache import PerplexityCacheManager
    from complexity_classifier import ComplexityClassifier


class PerplexityIssueAnalyzer:
    """Enhanced issue analyzer with budget management and caching."""
    
    def __init__(self, config_path: Optional[str] = None, dry_run: bool = False):
        """Initialize analyzer with configuration."""
        self.config_path = config_path or '.github/perplexity-config.yml'
        self.dry_run = dry_run
        
        # Initialize managers
        self.cost_manager = PerplexityCostManager(self.config_path)
        self.cache_manager = PerplexityCacheManager(self.config_path)
        self.classifier = ComplexityClassifier(self.config_path)
        
        # Configuration
        self.config = self.cost_manager.config
        self.api_key = os.environ.get('PERPLEXITY_API_KEY')
        self.base_url = 'https://api.perplexity.ai/v1'
        
        # Performance settings
        self.performance = self.config.get('performance_budgets', {})
        self.max_retries = self.config.get('security', {}).get('retry_policy', {}).get('max_retries', 3)
        self.timeout = self.performance.get('timeout_seconds', 30)
        
        # Validate API key
        if not self.api_key and not self.dry_run:
            raise ValueError("PERPLEXITY_API_KEY environment variable not set")
    
    def analyze_issue(self, 
                     issue_number: int,
                     title: str,
                     body: str,
                     labels: Optional[List[str]] = None) -> Dict:
        """
        Analyze a single issue with budget and cache management.
        
        Args:
            issue_number: GitHub issue number
            title: Issue title
            body: Issue body
            labels: Issue labels
            
        Returns:
            Analysis result dictionary
        """
        start_time = time.time()
        
        try:
            print(f"🔍 Analyzing issue #{issue_number}: {title[:50]}...")
            
            # Step 1: Classify complexity and select model
            complexity_result = self.classifier.score_issue(title, body, labels)
            recommended_model = complexity_result['recommended_model']
            
            print(f"📊 Complexity: {complexity_result['complexity_band']} (score: {complexity_result['total_score']}) -> {recommended_model}")
            
            # Step 2: Check cache
            cache_key = self.cache_manager.get_cache_key(title, body, labels, {
                'model': recommended_model
            })
            
            cached_result = None
            if cache_key:
                cached_result = self.cache_manager.read_cache(cache_key)
                if cached_result:
                    print(f"💾 Cache hit for {cache_key}")
                    
                    # Log cache hit (zero cost)
                    self.cost_manager.update_usage_log(
                        tokens_in=0, tokens_out=0, search_queries=0,
                        model=recommended_model, issue_number=issue_number, cached=True
                    )
                    
                    # Add cache metadata to result
                    analysis_result = cached_result['data'].copy()
                    analysis_result['cache_info'] = {
                        'cached': True,
                        'cache_key': cache_key,
                        'cached_at': cached_result['metadata']['timestamp'],
                        'cache_age_hours': self._calculate_cache_age(cached_result['metadata']['timestamp'])
                    }
                    
                    return analysis_result
            
            # Step 3: Budget pre-check
            # Estimate tokens for this analysis
            estimated_input_tokens = len(title) + len(body or "") // 4  # Rough estimate
            max_output_tokens = complexity_result.get('model_policy', {}).get('max_tokens', 4096)
            estimated_search_queries = 2 if recommended_model in ['sonar', 'sonar-reasoning'] else 3
            
            projected_cost = self.cost_manager.estimate_cost(
                estimated_input_tokens, max_output_tokens, 
                estimated_search_queries, recommended_model
            )
            
            should_abort, abort_reason = self.cost_manager.should_abort(projected_cost)
            
            if should_abort:
                print(f"💰 Budget limit reached: {abort_reason}")
                return self._create_deferred_result(
                    issue_number, title, abort_reason, complexity_result
                )
            
            print(f"💰 Projected cost: ${projected_cost:.4f} (budget OK)")
            
            # Step 4: Make Perplexity API call (unless dry run)
            if self.dry_run:
                analysis_result = self._create_dry_run_result(
                    issue_number, title, complexity_result, projected_cost
                )
            else:
                analysis_result = self._call_perplexity_api(
                    title, body, labels, recommended_model, complexity_result
                )
                
                # Cache the result
                if cache_key and analysis_result.get('success'):
                    self.cache_manager.write_cache(
                        cache_key, 
                        analysis_result,
                        {
                            'model': recommended_model,
                            'cost': analysis_result.get('cost_info', {}).get('estimated_cost_usd', 0),
                            'issue_number': issue_number
                        }
                    )
            
            # Step 5: Update usage log
            actual_tokens_in = analysis_result.get('usage', {}).get('prompt_tokens', estimated_input_tokens)
            actual_tokens_out = analysis_result.get('usage', {}).get('completion_tokens', max_output_tokens // 2)
            actual_searches = analysis_result.get('search_info', {}).get('query_count', estimated_search_queries)
            
            actual_cost = self.cost_manager.update_usage_log(
                actual_tokens_in, actual_tokens_out, actual_searches,
                recommended_model, issue_number, cached=False
            )
            
            # Add metadata
            analysis_result['issue_info'] = {
                'issue_number': issue_number,
                'title': title,
                'labels': labels or [],
                'analysis_duration_seconds': round(time.time() - start_time, 2)
            }
            
            analysis_result['complexity_info'] = complexity_result
            analysis_result['cache_info'] = {'cached': False, 'cache_key': cache_key}
            
            return analysis_result
            
        except Exception as e:
            print(f"❌ Error analyzing issue #{issue_number}: {e}", file=sys.stderr)
            return self._create_error_result(issue_number, title, str(e))
    
    def _call_perplexity_api(self, 
                           title: str, 
                           body: str, 
                           labels: Optional[List[str]], 
                           model: str,
                           complexity_result: Dict) -> Dict:
        """Make actual API call to Perplexity."""
        try:
            # Construct analysis prompt based on complexity
            prompt = self._build_analysis_prompt(title, body, labels, complexity_result)
            
            # API request payload
            payload = {
                'model': model,
                'messages': [
                    {
                        'role': 'system',
                        'content': 'You are an expert software engineer and project analyst. Provide comprehensive, actionable analysis of GitHub issues.'
                    },
                    {
                        'role': 'user',
                        'content': prompt
                    }
                ],
                'max_tokens': complexity_result.get('model_policy', {}).get('max_tokens', 4096),
                'temperature': 0.3,
                'stream': False
            }
            
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
            
            # Make request with retries
            response = self._make_request_with_retry(payload, headers)
            
            if not response:
                return self._create_error_result(0, title, "API request failed after retries")
            
            # Parse response
            response_data = response.json()
            
            # Extract analysis content
            content = ""
            if response_data.get('choices') and len(response_data['choices']) > 0:
                content = response_data['choices'][0].get('message', {}).get('content', '')
            
            # Calculate actual cost
            usage = response_data.get('usage', {})
            actual_cost = self.cost_manager.estimate_cost(
                usage.get('prompt_tokens', 0),
                usage.get('completion_tokens', 0),
                0,  # Search queries not directly reported in usage
                model
            )
            
            result = {
                'success': True,
                'content': content,
                'model': model,
                'usage': usage,
                'cost_info': {
                    'estimated_cost_usd': actual_cost,
                    'model': model,
                    'tokens_in': usage.get('prompt_tokens', 0),
                    'tokens_out': usage.get('completion_tokens', 0)
                },
                'api_response': {
                    'status_code': response.status_code,
                    'headers': dict(response.headers),
                    'model': response_data.get('model', model)
                }
            }
            
            return result
            
        except Exception as e:
            print(f"❌ API call failed: {e}", file=sys.stderr)
            return self._create_error_result(0, title, f"API error: {str(e)}")
    
    def _build_analysis_prompt(self, 
                             title: str, 
                             body: str, 
                             labels: Optional[List[str]], 
                             complexity_result: Dict) -> str:
        """Build analysis prompt based on issue complexity."""
        
        complexity_band = complexity_result['complexity_band']
        
        base_prompt = f"""
Analyze this GitHub issue and provide actionable insights:

**Title**: {title}
**Labels**: {', '.join(labels or [])}

**Description**:
{body or 'No description provided.'}

Please provide:
"""
        
        if complexity_band == 'simple':
            # Simple analysis for basic issues
            base_prompt += """
1. **Issue Summary**: Brief summary of the problem
2. **Priority Level**: High/Medium/Low based on impact
3. **Quick Solution**: Suggested approach to resolve
4. **Effort Estimate**: Rough time/complexity estimate
"""
        
        elif complexity_band == 'moderate':
            # Moderate analysis for standard features/bugs
            base_prompt += """
1. **Issue Analysis**: Detailed breakdown of the problem/request
2. **Technical Considerations**: Key technical factors to consider
3. **Implementation Approach**: Step-by-step solution strategy
4. **Potential Risks**: Risks and mitigation strategies
5. **Testing Strategy**: How to validate the solution
6. **Effort Estimate**: Time and resource requirements
"""
        
        else:
            # Comprehensive analysis for complex issues
            base_prompt += """
1. **Comprehensive Analysis**: Deep analysis of the issue and its implications
2. **Architecture Impact**: How this affects system architecture
3. **Technical Research**: Relevant technologies, patterns, and best practices
4. **Implementation Strategy**: Detailed multi-phase implementation plan
5. **Risk Assessment**: Comprehensive risk analysis with mitigation plans
6. **Performance Implications**: Impact on system performance and scalability
7. **Testing & Validation**: Complete testing strategy including edge cases
8. **Documentation Requirements**: What documentation needs to be updated
9. **Timeline & Resources**: Detailed project timeline and resource allocation
10. **Alternative Approaches**: Other potential solutions and trade-offs
"""
        
        base_prompt += """
Format your response in clear markdown with appropriate headings and bullet points.
Focus on actionable insights that help developers understand and resolve the issue efficiently.
"""
        
        return base_prompt.strip()
    
    def _make_request_with_retry(self, payload: Dict, headers: Dict) -> Optional[requests.Response]:
        """Make HTTP request with exponential backoff retry."""
        
        for attempt in range(self.max_retries):
            try:
                response = requests.post(
                    f"{self.base_url}/chat/completions",
                    json=payload,
                    headers=headers,
                    timeout=self.timeout
                )
                
                if response.status_code == 200:
                    return response
                elif response.status_code == 429:
                    # Rate limited - wait longer
                    wait_time = (2 ** attempt) * 5
                    print(f"⏳ Rate limited, waiting {wait_time}s before retry...")
                    time.sleep(wait_time)
                    continue
                else:
                    print(f"❌ API request failed with status {response.status_code}: {response.text}")
                    if attempt == self.max_retries - 1:
                        return None
                    time.sleep(2 ** attempt)
                    
            except requests.exceptions.Timeout:
                print(f"⏳ Request timeout on attempt {attempt + 1}")
                if attempt == self.max_retries - 1:
                    return None
                time.sleep(2 ** attempt)
                
            except requests.exceptions.RequestException as e:
                print(f"❌ Request error on attempt {attempt + 1}: {e}")
                if attempt == self.max_retries - 1:
                    return None
                time.sleep(2 ** attempt)
        
        return None
    
    def _calculate_cache_age(self, timestamp_str: str) -> float:
        """Calculate cache age in hours."""
        try:
            cached_time = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
            current_time = datetime.now(timezone.utc)
            age = (current_time - cached_time).total_seconds() / 3600
            return round(age, 2)
        except:
            return 0.0
    
    def _create_deferred_result(self, 
                              issue_number: int, 
                              title: str, 
                              reason: str, 
                              complexity_result: Dict) -> Dict:
        """Create result for deferred analysis due to budget limits."""
        return {
            'success': False,
            'deferred': True,
            'reason': reason,
            'issue_info': {
                'issue_number': issue_number,
                'title': title,
                'deferred_at': datetime.now(timezone.utc).isoformat()
            },
            'complexity_info': complexity_result,
            'recommended_action': f"Add '{self.cost_manager.config.get('budget_enforcement', {}).get('defer_label', 'analysis-deferred-budget')}' label and retry next week",
            'cost_info': {'estimated_cost_usd': 0.0, 'deferred': True}
        }
    
    def _create_dry_run_result(self, 
                             issue_number: int, 
                             title: str, 
                             complexity_result: Dict, 
                             projected_cost: float) -> Dict:
        """Create result for dry run mode."""
        return {
            'success': True,
            'dry_run': True,
            'content': f"[DRY RUN] Analysis would be performed using {complexity_result['recommended_model']} model",
            'issue_info': {
                'issue_number': issue_number,
                'title': title
            },
            'complexity_info': complexity_result,
            'cost_info': {
                'estimated_cost_usd': projected_cost,
                'dry_run': True,
                'model': complexity_result['recommended_model']
            }
        }
    
    def _create_error_result(self, issue_number: int, title: str, error: str) -> Dict:
        """Create error result."""
        return {
            'success': False,
            'error': error,
            'issue_info': {
                'issue_number': issue_number,
                'title': title,
                'error_at': datetime.now(timezone.utc).isoformat()
            },
            'cost_info': {'estimated_cost_usd': 0.0, 'error': True}
        }


def main():
    """Command line interface for issue analysis."""
    parser = argparse.ArgumentParser(description='Enhanced Perplexity Issue Analysis')
    parser.add_argument('--config', help='Path to configuration file')
    parser.add_argument('--dry-run', action='store_true', help='Simulate analysis without API calls')
    parser.add_argument('--issue-number', type=int, help='Issue number')
    parser.add_argument('--title', required=True, help='Issue title')
    parser.add_argument('--body', help='Issue body')
    parser.add_argument('--labels', nargs='*', help='Issue labels')
    parser.add_argument('--output-file', help='Save result to JSON file')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    
    args = parser.parse_args()
    
    try:
        # Check for required environment variables
        if not args.dry_run and not os.environ.get('PERPLEXITY_API_KEY'):
            print("❌ PERPLEXITY_API_KEY environment variable not set", file=sys.stderr)
            sys.exit(1)
        
        # Initialize analyzer
        analyzer = PerplexityIssueAnalyzer(args.config, args.dry_run)
        
        # Analyze issue
        result = analyzer.analyze_issue(
            args.issue_number or 0,
            args.title,
            args.body or "",
            args.labels or []
        )
        
        # Output result
        if args.output_file:
            with open(args.output_file, 'w') as f:
                json.dump(result, f, indent=2)
            print(f"✅ Analysis saved to {args.output_file}")
        
        if args.verbose:
            print("\n=== Analysis Result ===")
            print(json.dumps(result, indent=2))
        else:
            # Print summary
            if result.get('success'):
                cost = result.get('cost_info', {}).get('estimated_cost_usd', 0)
                model = result.get('model', 'unknown')
                cached = result.get('cache_info', {}).get('cached', False)
                cache_status = " (cached)" if cached else f" (${cost:.4f})"
                print(f"✅ Analysis completed using {model}{cache_status}")
            elif result.get('deferred'):
                print(f"⏸️ Analysis deferred: {result.get('reason', 'Budget limit')}")
            else:
                print(f"❌ Analysis failed: {result.get('error', 'Unknown error')}")
        
        # Exit with appropriate code
        sys.exit(0 if result.get('success') or result.get('deferred') else 1)
        
    except Exception as e:
        print(f"❌ Fatal error: {e}", file=sys.stderr)
        sys.exit(2)


if __name__ == '__main__':
    main()