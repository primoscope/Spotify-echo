#!/usr/bin/env python3
"""
Complexity Classification System for Perplexity Model Selection

Analyzes issue or text content to determine complexity level and recommend
appropriate Perplexity model based on heuristic scoring.

Complexity Levels:
- Simple (0-20): sonar - Basic queries, simple bug reports
- Moderate (21-79): sonar-reasoning - Standard feature requests, moderate debugging
- Complex (80+): sonar-pro - Architecture discussions, complex analysis

Key Features:
- Keyword-based scoring with weighted terms
- Content length analysis
- Code block detection
- Configurable thresholds
- JSON output for integration
"""

import json
import re
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union
import yaml
import argparse


class ComplexityClassifier:
    """Classifies content complexity for Perplexity model selection."""
    
    def __init__(self, config_path: Optional[str] = None):
        """Initialize classifier with configuration."""
        self.config_path = config_path or '.github/perplexity-config.yml'
        self.config = self._load_config()
        
        # Extract complexity scoring configuration
        scoring_config = self.config.get('complexity_scoring', {})
        self.simple_threshold = scoring_config.get('simple_threshold', 20)
        self.complex_threshold = scoring_config.get('complex_threshold', 80)
        
        # Keyword weights for complexity calculation
        self.keyword_weights = scoring_config.get('keywords', {
            'error_indicators': ["error", "exception", "stack trace", "crash", "bug", "failure", "broken"],
            'architecture_terms': ["architecture", "design", "refactor", "scalability", "pattern", "structure"],
            'performance_terms': ["performance", "optimization", "bottleneck", "latency", "memory", "cpu"],
            'security_terms': ["security", "vulnerability", "authentication", "encryption", "authorization"],
            'complex_concepts': ["algorithm", "machine learning", "database schema", "api design", "integration"]
        })
        
        # Assign default weights if not specified
        self.category_weights = {
            'error_indicators': 15,
            'architecture_terms': 25,
            'performance_terms': 20,
            'security_terms': 25,
            'complex_concepts': 30
        }
        
        # Length scoring configuration
        length_config = scoring_config.get('length_scoring', {})
        self.base_score = length_config.get('base_score', 10)
        self.per_100_chars = length_config.get('per_100_chars', 1)
        self.per_code_block = length_config.get('per_code_block', 10)
        self.max_length_score = length_config.get('max_length_score', 40)
    
    def _load_config(self) -> Dict:
        """Load configuration from YAML file."""
        try:
            config_file = Path(self.config_path)
            if not config_file.exists():
                # Return default configuration
                return {
                    'complexity_scoring': {
                        'simple_threshold': 20,
                        'complex_threshold': 80,
                        'keywords': {},
                        'length_scoring': {
                            'base_score': 10,
                            'per_100_chars': 1,
                            'per_code_block': 10,
                            'max_length_score': 40
                        }
                    }
                }
            
            with open(config_file, 'r') as f:
                config = yaml.safe_load(f)
            return config
        except Exception as e:
            print(f"❌ Error loading configuration: {e}", file=sys.stderr)
            return {}
    
    def _normalize_text(self, text: str) -> str:
        """Normalize text for analysis."""
        if not text:
            return ""
        return text.lower().strip()
    
    def _count_code_blocks(self, text: str) -> int:
        """Count code blocks in markdown text."""
        if not text:
            return 0
        
        # Count fenced code blocks (```)
        fenced_blocks = len(re.findall(r'```[\s\S]*?```', text))
        
        # Count inline code blocks (`)
        inline_blocks = len(re.findall(r'`[^`\n]+`', text))
        
        # Count indented code blocks (4+ spaces at line start)
        indented_blocks = len(re.findall(r'^\s{4,}[^\s].*$', text, re.MULTILINE))
        
        return fenced_blocks + (inline_blocks // 3) + (indented_blocks // 3)
    
    def _score_keywords(self, text: str) -> Tuple[int, Dict[str, int]]:
        """
        Score text based on keyword presence.
        
        Args:
            text: Text to analyze
            
        Returns:
            Tuple of (total_score, category_scores)
        """
        if not text:
            return 0, {}
        
        normalized_text = self._normalize_text(text)
        category_scores = {}
        total_score = 0
        
        for category, keywords in self.keyword_weights.items():
            category_score = 0
            weight = self.category_weights.get(category, 10)
            
            for keyword in keywords:
                keyword_count = normalized_text.count(keyword.lower())
                if keyword_count > 0:
                    # Score increases with keyword frequency, but with diminishing returns
                    keyword_score = min(weight, weight * (1 + 0.5 * (keyword_count - 1)))
                    category_score += keyword_score
            
            # Cap category score to prevent single categories from dominating
            category_score = min(category_score, weight * 2)
            category_scores[category] = round(category_score)
            total_score += category_score
        
        return round(total_score), category_scores
    
    def _score_length_complexity(self, text: str) -> Tuple[int, Dict[str, int]]:
        """
        Score complexity based on content length and structure.
        
        Args:
            text: Text to analyze
            
        Returns:
            Tuple of (length_score, length_breakdown)
        """
        if not text:
            return 0, {}
        
        char_count = len(text)
        code_blocks = self._count_code_blocks(text)
        
        # Base complexity score
        score = self.base_score
        
        # Length-based scoring
        length_score = min(
            (char_count // 100) * self.per_100_chars,
            self.max_length_score
        )
        score += length_score
        
        # Code block scoring
        code_score = code_blocks * self.per_code_block
        score += code_score
        
        # Line count factor (many short lines can indicate complexity)
        line_count = len(text.split('\n'))
        if line_count > 20:
            score += min(line_count // 10, 10)
        
        breakdown = {
            'base_score': self.base_score,
            'length_score': length_score,
            'code_score': code_score,
            'line_bonus': min(line_count // 10, 10) if line_count > 20 else 0,
            'char_count': char_count,
            'code_blocks': code_blocks,
            'line_count': line_count
        }
        
        return round(score), breakdown
    
    def _detect_special_indicators(self, text: str) -> Tuple[int, List[str]]:
        """
        Detect special complexity indicators.
        
        Args:
            text: Text to analyze
            
        Returns:
            Tuple of (bonus_score, indicators_found)
        """
        if not text:
            return 0, []
        
        normalized_text = self._normalize_text(text)
        indicators = []
        bonus_score = 0
        
        # Stack trace patterns
        if re.search(r'at\s+[\w\.]+\([\w\.:]+\)', text) or re.search(r'traceback|stack trace', normalized_text):
            indicators.append('stack_trace')
            bonus_score += 20
        
        # SQL or database queries
        if re.search(r'\b(SELECT|INSERT|UPDATE|DELETE|CREATE TABLE)\b', text, re.IGNORECASE):
            indicators.append('sql_query')
            bonus_score += 15
        
        # Configuration files (JSON, YAML, XML)
        if re.search(r'[{[][\s\S]*[}\]]', text) or re.search(r'^\s*[\w_]+:\s*', text, re.MULTILINE):
            indicators.append('config_data')
            bonus_score += 10
        
        # Multiple URLs or external references
        url_count = len(re.findall(r'https?://[^\s]+', text))
        if url_count >= 3:
            indicators.append('multiple_references')
            bonus_score += 15
        
        # Version numbers or technical specifications
        if re.search(r'\bv?\d+\.\d+(\.\d+)?\b', text):
            indicators.append('version_info')
            bonus_score += 5
        
        # API or technical terms
        api_terms = ['api', 'endpoint', 'webhook', 'oauth', 'jwt', 'rest', 'graphql', 'microservice']
        api_matches = sum(1 for term in api_terms if term in normalized_text)
        if api_matches >= 2:
            indicators.append('api_terms')
            bonus_score += 10
        
        return bonus_score, indicators
    
    def score_issue(self, 
                   title: str = "", 
                   body: str = "", 
                   labels: Optional[List[str]] = None) -> Dict[str, Union[int, str, List, Dict]]:
        """
        Score issue complexity and recommend model.
        
        Args:
            title: Issue title
            body: Issue body text
            labels: Issue labels (optional)
            
        Returns:
            Dictionary with complexity analysis
        """
        try:
            # Combine title and body for analysis
            combined_text = f"{title}\n\n{body}" if title and body else (title or body or "")
            
            # Score different aspects
            keyword_score, keyword_breakdown = self._score_keywords(combined_text)
            length_score, length_breakdown = self._score_length_complexity(combined_text)
            special_score, special_indicators = self._detect_special_indicators(combined_text)
            
            # Label-based scoring
            label_score = 0
            if labels:
                complexity_labels = {
                    'bug': 5,
                    'enhancement': 10,
                    'feature': 15,
                    'architecture': 25,
                    'performance': 20,
                    'security': 25,
                    'urgent': 10,
                    'complex': 30
                }
                
                for label in labels:
                    label_lower = label.lower()
                    for complexity_label, score in complexity_labels.items():
                        if complexity_label in label_lower:
                            label_score += score
                            break
            
            # Calculate total score
            total_score = keyword_score + length_score + special_score + label_score
            
            # Determine complexity band and model
            if total_score <= self.simple_threshold:
                complexity_band = 'simple'
                recommended_model = 'sonar'
            elif total_score <= self.complex_threshold:
                complexity_band = 'moderate'
                recommended_model = 'sonar-reasoning'
            else:
                complexity_band = 'complex'
                recommended_model = 'sonar-pro'
            
            # Find model policy for cost estimation
            model_policy = None
            for policy in self.config.get('model_policies', []):
                if policy['name'] == recommended_model:
                    model_policy = policy
                    break
            
            result = {
                'total_score': total_score,
                'complexity_band': complexity_band,
                'recommended_model': recommended_model,
                'model_policy': model_policy,
                'score_breakdown': {
                    'keyword_score': keyword_score,
                    'length_score': length_score,
                    'special_score': special_score,
                    'label_score': label_score
                },
                'analysis_details': {
                    'keyword_breakdown': keyword_breakdown,
                    'length_breakdown': length_breakdown,
                    'special_indicators': special_indicators,
                    'labels_analyzed': labels or [],
                    'text_length': len(combined_text),
                    'thresholds': {
                        'simple_threshold': self.simple_threshold,
                        'complex_threshold': self.complex_threshold
                    }
                }
            }
            
            return result
            
        except Exception as e:
            return {
                'error': str(e),
                'total_score': 0,
                'complexity_band': 'simple',
                'recommended_model': 'sonar'
            }
    
    def get_model_for_complexity(self, complexity_band: str) -> str:
        """Get recommended model for complexity band."""
        model_mapping = {
            'simple': 'sonar',
            'moderate': 'sonar-reasoning',
            'complex': 'sonar-pro'
        }
        return model_mapping.get(complexity_band, 'sonar')
    
    def batch_classify(self, issues: List[Dict]) -> List[Dict]:
        """
        Classify multiple issues for batch processing.
        
        Args:
            issues: List of issue dictionaries with 'title', 'body', 'labels'
            
        Returns:
            List of classification results
        """
        results = []
        
        for i, issue in enumerate(issues):
            try:
                title = issue.get('title', '')
                body = issue.get('body', '')
                labels = issue.get('labels', [])
                
                classification = self.score_issue(title, body, labels)
                classification['issue_index'] = i
                classification['issue_id'] = issue.get('id', issue.get('number', i))
                
                results.append(classification)
                
            except Exception as e:
                results.append({
                    'issue_index': i,
                    'issue_id': issue.get('id', issue.get('number', i)),
                    'error': str(e),
                    'total_score': 0,
                    'complexity_band': 'simple',
                    'recommended_model': 'sonar'
                })
        
        return results


def main():
    """Command line interface for complexity classification."""
    parser = argparse.ArgumentParser(description='Complexity Classification for Perplexity Model Selection')
    parser.add_argument('--config', help='Path to configuration file')
    
    subparsers = parser.add_subparsers(dest='command', help='Commands')
    
    # Score single issue command
    score_parser = subparsers.add_parser('score', help='Score single issue')
    score_parser.add_argument('--title', help='Issue title')
    score_parser.add_argument('--body', help='Issue body')
    score_parser.add_argument('--labels', nargs='*', help='Issue labels')
    
    # Score from file command
    file_parser = subparsers.add_parser('file', help='Score issue from file')
    file_parser.add_argument('input_file', help='JSON file with issue data')
    
    # Batch score command
    batch_parser = subparsers.add_parser('batch', help='Score multiple issues')
    batch_parser.add_argument('input_file', help='JSON file with array of issues')
    
    # Test thresholds command
    test_parser = subparsers.add_parser('test', help='Test classification with examples')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    # Initialize classifier
    classifier = ComplexityClassifier(args.config)
    
    try:
        if args.command == 'score':
            result = classifier.score_issue(
                args.title or "",
                args.body or "",
                args.labels or []
            )
            print(json.dumps(result, indent=2))
        
        elif args.command == 'file':
            with open(args.input_file, 'r') as f:
                issue_data = json.load(f)
            
            result = classifier.score_issue(
                issue_data.get('title', ''),
                issue_data.get('body', ''),
                issue_data.get('labels', [])
            )
            print(json.dumps(result, indent=2))
        
        elif args.command == 'batch':
            with open(args.input_file, 'r') as f:
                issues = json.load(f)
            
            if not isinstance(issues, list):
                issues = [issues]
            
            results = classifier.batch_classify(issues)
            print(json.dumps(results, indent=2))
        
        elif args.command == 'test':
            # Test with example cases
            test_cases = [
                {
                    'title': 'Fix typo in README',
                    'body': 'There is a small typo in the documentation.',
                    'labels': ['bug', 'documentation']
                },
                {
                    'title': 'Implement user authentication system',
                    'body': 'We need to add OAuth 2.0 authentication with JWT tokens and proper session management.',
                    'labels': ['feature', 'security']
                },
                {
                    'title': 'Performance issues with database queries',
                    'body': '''The application is experiencing severe performance degradation during peak hours. 
                    Stack trace:
                    ```
                    at DatabaseService.query(database.js:45)
                    at UserService.findUser(user.js:23)
                    ```
                    
                    SQL queries are taking 5+ seconds to complete. Need to optimize indexes and implement caching.''',
                    'labels': ['performance', 'bug', 'urgent']
                }
            ]
            
            results = classifier.batch_classify(test_cases)
            for i, result in enumerate(results):
                print(f"\n=== Test Case {i+1} ===")
                print(f"Title: {test_cases[i]['title']}")
                print(f"Score: {result['total_score']}")
                print(f"Complexity: {result['complexity_band']}")
                print(f"Model: {result['recommended_model']}")
        
    except Exception as e:
        print(f"❌ Command failed: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()