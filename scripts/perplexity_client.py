#!/usr/bin/env python3
"""
Perplexity API Client with Cost Control and Budget Management

Centralized client for Perplexity API integration with:
- Dynamic model selection based on complexity scoring
- Cost estimation and budget tracking
- Caching and batch processing capabilities
- Weekly budget enforcement with alerts

Security: Uses environment variables for API keys, no plaintext secrets
Budget: Hard $3.00 USD weekly limit with monitoring and alerts
"""

import os
import json
import hashlib
import time
import logging
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Tuple, Any
from pathlib import Path
import requests

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class ModelConfig:
    """Configuration for a Perplexity model"""
    name: str
    description: str
    cost_per_1k_tokens: float
    cost_per_search: float
    max_tokens: int
    temperature: float
    best_for: List[str]
    web_search: bool = True

@dataclass  
class RequestMetadata:
    """Metadata for tracking API requests"""
    timestamp: datetime
    model: str
    input_tokens: int
    output_tokens: int
    searches_performed: int
    estimated_cost: float
    actual_cost: Optional[float] = None
    cache_hit: bool = False
    complexity_score: int = 5

class PerplexityConfig:
    """Central configuration for Perplexity API integration"""
    
    # Model configurations with current Perplexity pricing (as of 2024)
    MODELS = {
        'sonar': ModelConfig(
            name='sonar',
            description='Real-time web search and information retrieval',
            cost_per_1k_tokens=0.001,  # $0.001 per 1k tokens
            cost_per_search=0.005,     # $0.005 per search
            max_tokens=2000,
            temperature=0.2,
            best_for=['current_events', 'factual_search', 'light_analysis']
        ),
        'sonar-reasoning': ModelConfig(
            name='sonar-reasoning',
            description='Enhanced reasoning with web search',
            cost_per_1k_tokens=0.003,  # $0.003 per 1k tokens
            cost_per_search=0.005,     # $0.005 per search
            max_tokens=4000,
            temperature=0.1,
            best_for=['complex_analysis', 'reasoning', 'research']
        ),
        'sonar-pro': ModelConfig(
            name='sonar-pro',
            description='Premium model for complex analysis',
            cost_per_1k_tokens=0.006,  # $0.006 per 1k tokens
            cost_per_search=0.01,      # $0.01 per search
            max_tokens=4000,
            temperature=0.1,
            best_for=['complex_reasoning', 'detailed_analysis', 'research']
        )
    }
    
    DEFAULT_MODEL = 'sonar'
    WEEKLY_BUDGET = float(os.getenv('PPLX_WEEKLY_BUDGET', '3.0'))
    CACHE_TTL_DAYS = 14
    MAX_TOKENS_DEFAULT = 2000
    TEMPERATURE_DEFAULT = 0.2

class BudgetManager:
    """Manages weekly budget tracking and enforcement"""
    
    def __init__(self, perplexity_dir: Path):
        self.perplexity_dir = perplexity_dir
        self.ledger_path = perplexity_dir / 'usage_ledger.json'
        self.budget_lock_path = perplexity_dir / 'BUDGET_LOCK'
        self.weekly_budget = PerplexityConfig.WEEKLY_BUDGET
        
    def _get_current_week_key(self) -> str:
        """Get ISO week key for current week"""
        now = datetime.now()
        year, week, _ = now.isocalendar()
        return f"{year}-W{week:02d}"
    
    def _load_ledger(self) -> Dict:
        """Load usage ledger from JSON file"""
        try:
            if self.ledger_path.exists():
                with open(self.ledger_path, 'r') as f:
                    return json.load(f)
            return {}
        except Exception as e:
            logger.error(f"Failed to load ledger: {e}")
            return {}
    
    def _save_ledger(self, ledger: Dict) -> None:
        """Save usage ledger to JSON file"""
        try:
            self.perplexity_dir.mkdir(exist_ok=True)
            with open(self.ledger_path, 'w') as f:
                json.dump(ledger, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Failed to save ledger: {e}")
    
    def record_usage(self, request_meta: RequestMetadata) -> None:
        """Record API usage in ledger"""
        ledger = self._load_ledger()
        week_key = self._get_current_week_key()
        
        if week_key not in ledger:
            ledger[week_key] = {
                'total_cost': 0.0,
                'request_count': 0,
                'requests': []
            }
        
        week_data = ledger[week_key]
        week_data['total_cost'] += request_meta.estimated_cost
        week_data['request_count'] += 1
        week_data['requests'].append(asdict(request_meta))
        
        self._save_ledger(ledger)
        logger.info(f"Recorded usage: ${request_meta.estimated_cost:.4f} "
                   f"(Week total: ${week_data['total_cost']:.4f})")
    
    def get_weekly_usage(self) -> Tuple[float, int]:
        """Get current week's usage (cost, count)"""
        ledger = self._load_ledger()
        week_key = self._get_current_week_key()
        
        if week_key in ledger:
            week_data = ledger[week_key]
            return week_data['total_cost'], week_data['request_count']
        
        return 0.0, 0
    
    def check_budget(self) -> Dict[str, Any]:
        """Check budget status and return detailed info"""
        cost, count = self.get_weekly_usage()
        budget_used_pct = (cost / self.weekly_budget) * 100
        
        status = {
            'total_cost': cost,
            'weekly_budget': self.weekly_budget,
            'budget_used_pct': budget_used_pct,
            'request_count': count,
            'budget_remaining': self.weekly_budget - cost,
            'week_key': self._get_current_week_key()
        }
        
        if budget_used_pct >= 100:
            status['status'] = 'BUDGET_EXCEEDED'
            status['allow_requests'] = False
            # Create budget lock file
            self.budget_lock_path.touch()
        elif budget_used_pct >= 80:
            status['status'] = 'BUDGET_WARNING'
            status['allow_requests'] = True
        else:
            status['status'] = 'BUDGET_OK'
            status['allow_requests'] = True
            # Remove budget lock if it exists
            self.budget_lock_path.unlink(missing_ok=True)
        
        return status
    
    def is_budget_locked(self) -> bool:
        """Check if budget is currently locked"""
        return self.budget_lock_path.exists()

class CacheManager:
    """Manages caching of Perplexity API responses"""
    
    def __init__(self, perplexity_dir: Path):
        self.cache_dir = perplexity_dir / 'cache'
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.ttl_days = PerplexityConfig.CACHE_TTL_DAYS
    
    def _get_cache_key(self, title: str, body: str, model: str) -> str:
        """Generate MD5 cache key from title, body, and model"""
        content = f"{title}|{body}|{model}"
        return hashlib.md5(content.encode('utf-8')).hexdigest()
    
    def _get_cache_path(self, cache_key: str) -> Path:
        """Get cache file path for key"""
        return self.cache_dir / f"{cache_key}.json"
    
    def get_cached_response(self, title: str, body: str, model: str) -> Optional[Dict]:
        """Get cached response if available and not expired"""
        cache_key = self._get_cache_key(title, body, model)
        cache_path = self._get_cache_path(cache_key)
        
        try:
            if cache_path.exists():
                with open(cache_path, 'r') as f:
                    cached_data = json.load(f)
                
                # Check if cache is still valid (within TTL)
                cache_time = datetime.fromisoformat(cached_data['timestamp'])
                if datetime.now() - cache_time < timedelta(days=self.ttl_days):
                    logger.info(f"CACHE_HIT: {cache_key[:8]}... (age: {(datetime.now() - cache_time).days} days)")
                    return cached_data['response']
                else:
                    logger.info(f"CACHE_EXPIRED: {cache_key[:8]}... (age: {(datetime.now() - cache_time).days} days)")
                    cache_path.unlink()  # Remove expired cache
            
            return None
        except Exception as e:
            logger.error(f"Cache read error: {e}")
            return None
    
    def cache_response(self, title: str, body: str, model: str, response: Dict) -> None:
        """Cache API response"""
        cache_key = self._get_cache_key(title, body, model)
        cache_path = self._get_cache_path(cache_key)
        
        try:
            cache_data = {
                'timestamp': datetime.now().isoformat(),
                'cache_key': cache_key,
                'model': model,
                'response': response
            }
            
            with open(cache_path, 'w') as f:
                json.dump(cache_data, f, indent=2)
            
            logger.info(f"CACHE_STORED: {cache_key[:8]}...")
        except Exception as e:
            logger.error(f"Cache write error: {e}")

class PerplexityClient:
    """Centralized Perplexity API client with cost control and budget management"""
    
    def __init__(self, perplexity_dir: Optional[Path] = None):
        self.api_key = os.getenv('PERPLEXITY_API_KEY')
        if not self.api_key:
            logger.warning("PERPLEXITY_API_KEY not found in environment")
        
        # Set up directory structure
        if perplexity_dir is None:
            perplexity_dir = Path('.perplexity')
        self.perplexity_dir = perplexity_dir
        self.perplexity_dir.mkdir(exist_ok=True)
        
        # Initialize managers
        self.budget_manager = BudgetManager(self.perplexity_dir)
        self.cache_manager = CacheManager(self.perplexity_dir)
        self.models = PerplexityConfig.MODELS
        
        logger.info(f"Initialized PerplexityClient - Budget: ${PerplexityConfig.WEEKLY_BUDGET}/week")
    
    def calculate_complexity_score(self, title: str, body: str) -> int:
        """Calculate complexity score (1-10) based on content analysis"""
        content = f"{title} {body}".lower()
        
        # Base score
        score = 5
        
        # Length factor (more content = higher complexity)
        total_length = len(content)
        if total_length > 2000:
            score += 3
        elif total_length > 1000:
            score += 2
        elif total_length > 500:
            score += 1
        
        # Technical keywords increase complexity
        technical_keywords = [
            'algorithm', 'architecture', 'security', 'performance', 'optimization',
            'bug', 'error', 'exception', 'integration', 'api', 'database',
            'authentication', 'authorization', 'scalability', 'concurrency',
            'deployment', 'configuration', 'infrastructure', 'monitoring'
        ]
        
        keyword_count = sum(1 for keyword in technical_keywords if keyword in content)
        score += min(keyword_count // 2, 3)  # Max +3 for technical content
        
        # Code-related content
        if any(lang in content for lang in ['python', 'javascript', 'java', 'sql', 'docker']):
            score += 1
        
        # Question complexity indicators
        complex_indicators = ['how to', 'why does', 'best practice', 'comparison', 'analysis']
        if any(indicator in content for indicator in complex_indicators):
            score += 1
        
        return min(max(score, 1), 10)  # Clamp to 1-10 range
    
    def select_model(self, complexity_score: int, research: bool = False) -> str:
        """Select optimal model based on complexity score and research needs"""
        model_override = os.getenv('PPLX_MODEL_OVERRIDE')
        if model_override and model_override in self.models:
            logger.info(f"Using model override: {model_override}")
            return model_override
        
        if research or complexity_score >= 8:
            return 'sonar-pro'
        elif complexity_score >= 6:
            return 'sonar-reasoning' 
        else:
            return 'sonar'
    
    def estimate_cost(self, input_tokens: int, output_tokens: int, 
                     searches: int, model: str) -> float:
        """Estimate request cost based on tokens and searches"""
        if model not in self.models:
            model = PerplexityConfig.DEFAULT_MODEL
        
        model_config = self.models[model]
        
        # Token cost
        total_tokens = input_tokens + output_tokens
        token_cost = (total_tokens / 1000) * model_config.cost_per_1k_tokens
        
        # Search cost
        search_cost = searches * model_config.cost_per_search
        
        total_cost = token_cost + search_cost
        
        logger.info(f"Cost estimate: ${total_cost:.4f} "
                   f"(tokens: {total_tokens}, searches: {searches}, model: {model})")
        
        return total_cost
    
    def _make_api_request(self, prompt: str, model: str, max_tokens: int = None, 
                         temperature: float = None) -> Dict:
        """Make actual API request to Perplexity"""
        if not self.api_key:
            raise ValueError("PERPLEXITY_API_KEY not configured")
        
        model_config = self.models.get(model, self.models[PerplexityConfig.DEFAULT_MODEL])
        
        # Use model defaults if not specified
        if max_tokens is None:
            max_tokens = model_config.max_tokens
        if temperature is None:
            temperature = model_config.temperature
        
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
        
        data = {
            'model': model,
            'messages': [
                {'role': 'user', 'content': prompt}
            ],
            'max_tokens': max_tokens,
            'temperature': temperature,
            'return_citations': True,
            'return_images': False
        }
        
        logger.info(f"Making API request: model={model}, max_tokens={max_tokens}")
        
        response = requests.post(
            'https://api.perplexity.ai/chat/completions',
            headers=headers,
            json=data,
            timeout=60
        )
        
        if response.status_code != 200:
            error_msg = f"API request failed: {response.status_code} - {response.text}"
            logger.error(error_msg)
            raise Exception(error_msg)
        
        return response.json()
    
    def analyze_issue(self, title: str, body: str, issue_number: int = None, 
                     dry_run: bool = False) -> Dict:
        """Analyze an issue with caching and budget control"""
        
        # Calculate complexity and select model
        complexity_score = self.calculate_complexity_score(title, body)
        model = self.select_model(complexity_score)
        
        logger.info(f"Issue analysis: complexity={complexity_score}, model={model}")
        
        # Check cache first
        cached_response = self.cache_manager.get_cached_response(title, body, model)
        if cached_response:
            return {
                'success': True,
                'content': cached_response['content'],
                'model': model,
                'complexity_score': complexity_score,
                'cache_hit': True,
                'cost_estimate': 0.0,
                'budget_status': self.budget_manager.check_budget()
            }
        
        # Check budget before making API call
        budget_status = self.budget_manager.check_budget()
        if not budget_status['allow_requests'] and not dry_run:
            logger.warning("Budget exceeded - skipping API call")
            return {
                'success': False,
                'error': 'Budget exceeded',
                'budget_status': budget_status,
                'cache_hit': False
            }
        
        # Estimate tokens (rough estimation)
        input_tokens = len(f"{title} {body}") // 4  # Rough token estimation
        output_tokens = self.models[model].max_tokens // 2  # Assume half output
        searches = min(complexity_score // 2, 5)  # More complex = more searches
        
        estimated_cost = self.estimate_cost(input_tokens, output_tokens, searches, model)
        
        if dry_run:
            logger.info(f"DRY_RUN: Would make API call with cost ${estimated_cost:.4f}")
            return {
                'success': True,
                'dry_run': True,
                'content': f"[DRY_RUN] Analysis would be performed with {model} model",
                'model': model,
                'complexity_score': complexity_score,
                'cost_estimate': estimated_cost,
                'budget_status': budget_status,
                'cache_hit': False
            }
        
        # Create analysis prompt
        prompt = self._create_analysis_prompt(title, body, issue_number)
        
        try:
            # Make API request
            api_response = self._make_api_request(prompt, model)
            
            # Extract content
            content = api_response.get('choices', [{}])[0].get('message', {}).get('content', '')
            citations = api_response.get('citations', [])
            
            response_data = {
                'content': content,
                'citations': citations,
                'model': model,
                'complexity_score': complexity_score
            }
            
            # Cache the response
            self.cache_manager.cache_response(title, body, model, response_data)
            
            # Record usage
            request_meta = RequestMetadata(
                timestamp=datetime.now(),
                model=model,
                input_tokens=input_tokens,
                output_tokens=len(content) // 4,  # Rough estimation
                searches_performed=searches,
                estimated_cost=estimated_cost,
                complexity_score=complexity_score,
                cache_hit=False
            )
            
            self.budget_manager.record_usage(request_meta)
            
            return {
                'success': True,
                'content': content,
                'citations': citations,
                'model': model,
                'complexity_score': complexity_score,
                'cost_estimate': estimated_cost,
                'cache_hit': False,
                'budget_status': self.budget_manager.check_budget()
            }
        
        except Exception as e:
            logger.error(f"API request failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'model': model,
                'complexity_score': complexity_score,
                'cost_estimate': estimated_cost,
                'cache_hit': False
            }
    
    def _create_analysis_prompt(self, title: str, body: str, issue_number: int = None) -> str:
        """Create analysis prompt for issue"""
        issue_ref = f"Issue #{issue_number}" if issue_number else "Issue"
        
        return f"""Please analyze this GitHub issue and provide a comprehensive assessment:

{issue_ref}: {title}

Description:
{body}

Please provide:
1. **Summary**: Brief overview of the issue
2. **Technical Analysis**: Technical aspects, complexity, and potential solutions
3. **Priority**: Suggested priority level (High/Medium/Low) with reasoning
4. **Effort Estimate**: Development effort required (Hours/Days/Weeks)
5. **Implementation Approach**: Recommended approach and key considerations
6. **Risks & Considerations**: Potential risks, edge cases, and important considerations
7. **Related Components**: Which parts of the system might be affected

Format your response in clear sections with actionable insights. Focus on practical, implementable recommendations."""

if __name__ == '__main__':
    # Example usage and testing
    import argparse
    
    parser = argparse.ArgumentParser(description='Perplexity Client Test')
    parser.add_argument('--dry-run', action='store_true', help='Run in dry-run mode')
    parser.add_argument('--issue', type=int, help='Issue number to analyze (mock mode)')
    parser.add_argument('--title', default='Test Issue', help='Issue title')
    parser.add_argument('--body', default='Test issue body for analysis', help='Issue body')
    
    args = parser.parse_args()
    
    client = PerplexityClient()
    
    # Show budget status
    budget_status = client.budget_manager.check_budget()
    print(f"\n=== Budget Status ===")
    print(f"Week: {budget_status['week_key']}")
    print(f"Used: ${budget_status['total_cost']:.4f} / ${budget_status['weekly_budget']:.2f}")
    print(f"Percentage: {budget_status['budget_used_pct']:.1f}%")
    print(f"Status: {budget_status['status']}")
    print(f"Requests: {budget_status['request_count']}")
    
    if args.issue:
        print(f"\n=== Analyzing Issue #{args.issue} ===")
        result = client.analyze_issue(args.title, args.body, args.issue, dry_run=args.dry_run)
        
        print(f"Success: {result.get('success')}")
        print(f"Model: {result.get('model')}")
        print(f"Complexity: {result.get('complexity_score')}")
        print(f"Cache Hit: {result.get('cache_hit')}")
        print(f"Cost: ${result.get('cost_estimate', 0):.4f}")
        
        if result.get('success') and result.get('content'):
            print(f"\n=== Analysis Result ===")
            print(result['content'][:500] + "..." if len(result.get('content', '')) > 500 else result.get('content'))