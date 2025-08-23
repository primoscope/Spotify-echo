#!/usr/bin/env python3
"""
Batch Issue Analysis with Cost Optimization

Processes multiple GitHub issues with intelligent batching, similarity grouping,
and budget enforcement to minimize costs and API calls.

Key Features:
- Similarity-based batching to group related issues
- Budget-aware processing with early termination
- Adaptive delays based on usage percentage
- Progress reporting and cost tracking
- Graceful degradation when budgets exceeded
"""

import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
import argparse
import math

# Import our utility modules
try:
    from perplexity_costs import PerplexityCostManager
    from perplexity_cache import PerplexityCacheManager
    from complexity_classifier import ComplexityClassifier
    from analyze_issues import PerplexityIssueAnalyzer
except ImportError:
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from perplexity_costs import PerplexityCostManager
    from perplexity_cache import PerplexityCacheManager
    from complexity_classifier import ComplexityClassifier
    from analyze_issues import PerplexityIssueAnalyzer


class BatchIssueAnalyzer:
    """Batch analyzer with intelligent grouping and budget management."""
    
    def __init__(self, config_path: Optional[str] = None, dry_run: bool = False):
        """Initialize batch analyzer."""
        self.config_path = config_path or '.github/perplexity-config.yml'
        self.dry_run = dry_run
        
        # Initialize managers
        self.cost_manager = PerplexityCostManager(self.config_path)
        self.cache_manager = PerplexityCacheManager(self.config_path)
        self.classifier = ComplexityClassifier(self.config_path)
        self.issue_analyzer = PerplexityIssueAnalyzer(self.config_path, dry_run)
        
        # Configuration
        self.config = self.cost_manager.config
        self.batch_config = self.config.get('batching', {})
        self.max_issues_per_run = self.batch_config.get('max_issues_per_run', 5)
        self.similarity_batch = self.batch_config.get('similarity_batch', True)
        self.similarity_threshold = self.batch_config.get('similarity_threshold', 0.7)
        self.batch_delay_seconds = self.batch_config.get('batch_delay_seconds', 2)
        self.max_concurrent = self.batch_config.get('max_concurrent_requests', 3)
        
        # State tracking
        self.processed_count = 0
        self.deferred_count = 0
        self.cached_count = 0
        self.total_cost = 0.0
        self.batch_results = []
    
    def calculate_text_similarity(self, text1: str, text2: str) -> float:
        """
        Calculate similarity between two text strings using Jaccard similarity.
        
        Args:
            text1: First text
            text2: Second text
            
        Returns:
            Similarity score between 0 and 1
        """
        if not text1 or not text2:
            return 0.0
        
        try:
            # Normalize and tokenize
            words1 = set(text1.lower().split())
            words2 = set(text2.lower().split())
            
            # Calculate Jaccard similarity
            intersection = len(words1 & words2)
            union = len(words1 | words2)
            
            if union == 0:
                return 0.0
            
            return intersection / union
            
        except Exception:
            return 0.0
    
    def group_issues_by_similarity(self, issues: List[Dict]) -> List[List[Dict]]:
        """
        Group issues by content similarity for batch processing.
        
        Args:
            issues: List of issue dictionaries
            
        Returns:
            List of issue groups
        """
        if not self.similarity_batch or len(issues) <= 1:
            return [[issue] for issue in issues]
        
        try:
            groups = []
            ungrouped = issues.copy()
            
            while ungrouped:
                # Start new group with first ungrouped issue
                current_issue = ungrouped.pop(0)
                current_group = [current_issue]
                current_text = f"{current_issue.get('title', '')} {current_issue.get('body', '')}"
                
                # Find similar issues
                i = 0
                while i < len(ungrouped):
                    candidate = ungrouped[i]
                    candidate_text = f"{candidate.get('title', '')} {candidate.get('body', '')}"
                    
                    similarity = self.calculate_text_similarity(current_text, candidate_text)
                    
                    if similarity >= self.similarity_threshold:
                        current_group.append(candidate)
                        ungrouped.pop(i)
                    else:
                        i += 1
                
                groups.append(current_group)
            
            return groups
            
        except Exception as e:
            print(f"⚠️ Warning: Similarity grouping failed, using individual processing: {e}")
            return [[issue] for issue in issues]
    
    def group_issues_by_complexity(self, issues: List[Dict]) -> Dict[str, List[Dict]]:
        """
        Group issues by complexity band for prioritized processing.
        
        Args:
            issues: List of issue dictionaries
            
        Returns:
            Dictionary mapping complexity bands to issue lists
        """
        complexity_groups = {
            'simple': [],
            'moderate': [],
            'complex': []
        }
        
        for issue in issues:
            try:
                # Classify complexity
                classification = self.classifier.score_issue(
                    issue.get('title', ''),
                    issue.get('body', ''),
                    issue.get('labels', [])
                )
                
                complexity_band = classification['complexity_band']
                issue['_complexity'] = classification  # Add classification to issue
                
                complexity_groups[complexity_band].append(issue)
                
            except Exception as e:
                print(f"⚠️ Warning: Could not classify issue {issue.get('number', 'unknown')}: {e}")
                complexity_groups['simple'].append(issue)  # Default to simple
        
        return complexity_groups
    
    def calculate_adaptive_delay(self) -> float:
        """
        Calculate adaptive delay based on current usage percentage.
        
        Returns:
            Delay in seconds
        """
        try:
            budget_info = self.cost_manager.remaining_budget()
            usage_percentage = budget_info.get('usage_percentage', 0.0)
            
            # Base delay from config
            base_delay = self.batch_delay_seconds
            
            # Increase delay as usage approaches limits
            if usage_percentage > 80:
                multiplier = 3.0
            elif usage_percentage > 60:
                multiplier = 2.0
            elif usage_percentage > 40:
                multiplier = 1.5
            else:
                multiplier = 1.0
            
            return base_delay * multiplier
            
        except Exception:
            return self.batch_delay_seconds
    
    def should_continue_processing(self) -> Tuple[bool, str]:
        """
        Check if batch processing should continue based on budget.
        
        Returns:
            Tuple of (should_continue: bool, reason: str)
        """
        try:
            budget_info = self.cost_manager.remaining_budget()
            state = budget_info['state']
            
            # Hard stop - no more processing
            if state == 'HARD_STOP':
                return False, f"Weekly budget exhausted: ${budget_info['used_amount']:.4f} / ${budget_info['weekly_budget']:.2f}"
            
            # Warning state - only simple issues
            if state == 'WARNING':
                return True, f"Budget warning: ${budget_info['used_amount']:.4f} / ${budget_info['weekly_budget']:.2f} - processing simple issues only"
            
            # OK state
            return True, f"Budget healthy: {budget_info['usage_percentage']:.1f}% used"
            
        except Exception as e:
            return False, f"Budget check failed: {str(e)}"
    
    def process_batch(self, issues: List[Dict]) -> List[Dict]:
        """
        Process a batch of issues with budget management.
        
        Args:
            issues: List of issues to process
            
        Returns:
            List of analysis results
        """
        try:
            print(f"\n🎯 Processing batch of {len(issues)} issues...")
            
            # Check if we should continue
            should_continue, reason = self.should_continue_processing()
            print(f"💰 {reason}")
            
            if not should_continue:
                return self._create_batch_deferred_results(issues, reason)
            
            # Group by complexity for prioritized processing
            complexity_groups = self.group_issues_by_complexity(issues)
            
            # Determine which complexity levels to process
            budget_info = self.cost_manager.remaining_budget()
            state = budget_info['state']
            
            if state == 'WARNING':
                # Only process simple issues when in warning state
                processing_order = ['simple']
                print(f"⚠️ Warning state - processing simple issues only")
            else:
                # Process all complexity levels, simple first
                processing_order = ['simple', 'moderate', 'complex']
            
            batch_results = []
            
            for complexity in processing_order:
                issues_in_complexity = complexity_groups.get(complexity, [])
                if not issues_in_complexity:
                    continue
                
                print(f"\n📊 Processing {len(issues_in_complexity)} {complexity} issues...")
                
                # Group by similarity within complexity band
                similarity_groups = self.group_issues_by_similarity(issues_in_complexity)
                
                for group_index, issue_group in enumerate(similarity_groups):
                    # Check budget before each group
                    should_continue, reason = self.should_continue_processing()
                    if not should_continue:
                        # Defer remaining issues
                        remaining_issues = []
                        for remaining_group in similarity_groups[group_index:]:
                            remaining_issues.extend(remaining_group)
                        
                        batch_results.extend(self._create_batch_deferred_results(remaining_issues, reason))
                        break
                    
                    # Process similarity group
                    group_results = self._process_similarity_group(issue_group, group_index + 1)
                    batch_results.extend(group_results)
                    
                    # Adaptive delay between groups
                    if group_index < len(similarity_groups) - 1:
                        delay = self.calculate_adaptive_delay()
                        print(f"⏳ Waiting {delay:.1f}s before next group...")
                        time.sleep(delay)
                
                # If we hit budget limits, skip remaining complexity levels
                if not should_continue:
                    break
            
            return batch_results
            
        except Exception as e:
            print(f"❌ Batch processing error: {e}", file=sys.stderr)
            return [self._create_error_result(issue, str(e)) for issue in issues]
    
    def _process_similarity_group(self, issue_group: List[Dict], group_number: int) -> List[Dict]:
        """Process a group of similar issues."""
        print(f"  📝 Group {group_number}: {len(issue_group)} similar issues")
        
        results = []
        
        for issue in issue_group:
            try:
                # Analyze individual issue
                result = self.issue_analyzer.analyze_issue(
                    issue.get('number', 0),
                    issue.get('title', ''),
                    issue.get('body', ''),
                    issue.get('labels', [])
                )
                
                # Update statistics
                self.processed_count += 1
                if result.get('cache_info', {}).get('cached'):
                    self.cached_count += 1
                if result.get('deferred'):
                    self.deferred_count += 1
                
                cost = result.get('cost_info', {}).get('estimated_cost_usd', 0.0)
                self.total_cost += cost
                
                results.append(result)
                
            except Exception as e:
                print(f"❌ Error processing issue {issue.get('number', 'unknown')}: {e}")
                results.append(self._create_error_result(issue, str(e)))
        
        return results
    
    def _create_batch_deferred_results(self, issues: List[Dict], reason: str) -> List[Dict]:
        """Create deferred results for a batch of issues."""
        results = []
        
        for issue in issues:
            result = {
                'success': False,
                'deferred': True,
                'reason': reason,
                'issue_info': {
                    'issue_number': issue.get('number', 0),
                    'title': issue.get('title', ''),
                    'deferred_at': datetime.now(timezone.utc).isoformat()
                },
                'cost_info': {'estimated_cost_usd': 0.0, 'deferred': True}
            }
            results.append(result)
            self.deferred_count += 1
        
        return results
    
    def _create_error_result(self, issue: Dict, error: str) -> Dict:
        """Create error result for an issue."""
        return {
            'success': False,
            'error': error,
            'issue_info': {
                'issue_number': issue.get('number', 0),
                'title': issue.get('title', ''),
                'error_at': datetime.now(timezone.utc).isoformat()
            },
            'cost_info': {'estimated_cost_usd': 0.0, 'error': True}
        }
    
    def generate_batch_summary(self) -> Dict:
        """Generate comprehensive batch processing summary."""
        budget_info = self.cost_manager.remaining_budget()
        
        return {
            'batch_summary': {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'total_issues': self.processed_count,
                'successful_analyses': self.processed_count - self.deferred_count,
                'deferred_analyses': self.deferred_count,
                'cached_responses': self.cached_count,
                'cache_hit_rate': round(self.cached_count / max(self.processed_count, 1) * 100, 1),
                'total_cost_usd': round(self.total_cost, 4),
                'average_cost_per_issue': round(self.total_cost / max(self.processed_count - self.cached_count, 1), 4),
            },
            'budget_status': budget_info,
            'configuration': {
                'max_issues_per_run': self.max_issues_per_run,
                'similarity_batching': self.similarity_batch,
                'batch_delay_seconds': self.batch_delay_seconds,
                'dry_run': self.dry_run
            },
            'results': self.batch_results
        }
    
    def run_batch_analysis(self, issues: List[Dict], max_issues: Optional[int] = None) -> Dict:
        """
        Run batch analysis on list of issues.
        
        Args:
            issues: List of issue dictionaries
            max_issues: Maximum number of issues to process (override config)
            
        Returns:
            Batch analysis summary
        """
        start_time = time.time()
        
        try:
            # Apply max issues limit
            effective_max = max_issues or self.max_issues_per_run
            if len(issues) > effective_max:
                print(f"📊 Limiting to {effective_max} issues (from {len(issues)} available)")
                issues = issues[:effective_max]
            
            print(f"🚀 Starting batch analysis of {len(issues)} issues...")
            print(f"💰 Initial budget status: {self.cost_manager.remaining_budget()['usage_percentage']:.1f}% used")
            
            # Process batch
            self.batch_results = self.process_batch(issues)
            
            # Generate summary
            summary = self.generate_batch_summary()
            summary['execution_time_seconds'] = round(time.time() - start_time, 2)
            
            # Print final statistics
            print(f"\n📈 Batch Analysis Complete")
            print(f"   ✅ Processed: {self.processed_count} issues")
            print(f"   💾 Cached: {self.cached_count} ({summary['batch_summary']['cache_hit_rate']:.1f}%)")
            print(f"   ⏸️ Deferred: {self.deferred_count}")
            print(f"   💰 Total Cost: ${self.total_cost:.4f}")
            print(f"   ⏱️ Duration: {summary['execution_time_seconds']:.1f}s")
            
            return summary
            
        except Exception as e:
            print(f"❌ Batch analysis failed: {e}", file=sys.stderr)
            return {
                'error': str(e),
                'batch_summary': {
                    'timestamp': datetime.now(timezone.utc).isoformat(),
                    'total_issues': 0,
                    'execution_time_seconds': round(time.time() - start_time, 2)
                }
            }


def main():
    """Command line interface for batch analysis."""
    parser = argparse.ArgumentParser(description='Batch Perplexity Issue Analysis')
    parser.add_argument('--config', help='Path to configuration file')
    parser.add_argument('--dry-run', action='store_true', help='Simulate analysis without API calls')
    parser.add_argument('--input-file', required=True, help='JSON file with issues to analyze')
    parser.add_argument('--output-file', help='Save results to JSON file')
    parser.add_argument('--max-issues', type=int, help='Maximum number of issues to process')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    
    args = parser.parse_args()
    
    try:
        # Check for required environment variables
        if not args.dry_run and not os.environ.get('PERPLEXITY_API_KEY'):
            print("❌ PERPLEXITY_API_KEY environment variable not set", file=sys.stderr)
            sys.exit(1)
        
        # Load issues
        with open(args.input_file, 'r') as f:
            issues_data = json.load(f)
        
        # Handle different input formats
        if isinstance(issues_data, list):
            issues = issues_data
        elif isinstance(issues_data, dict) and 'issues' in issues_data:
            issues = issues_data['issues']
        else:
            issues = [issues_data]  # Single issue
        
        if not issues:
            print("❌ No issues found in input file", file=sys.stderr)
            sys.exit(1)
        
        print(f"📥 Loaded {len(issues)} issues from {args.input_file}")
        
        # Initialize batch analyzer
        analyzer = BatchIssueAnalyzer(args.config, args.dry_run)
        
        # Run batch analysis
        summary = analyzer.run_batch_analysis(issues, args.max_issues)
        
        # Save results
        if args.output_file:
            with open(args.output_file, 'w') as f:
                json.dump(summary, f, indent=2)
            print(f"📄 Results saved to {args.output_file}")
        
        # Output summary
        if args.verbose:
            print("\n=== Batch Summary ===")
            print(json.dumps(summary, indent=2))
        
        # Exit with appropriate code
        if summary.get('error'):
            sys.exit(2)
        elif summary.get('batch_summary', {}).get('deferred_analyses', 0) > 0:
            sys.exit(1)  # Partial success
        else:
            sys.exit(0)  # Complete success
        
    except Exception as e:
        print(f"❌ Fatal error: {e}", file=sys.stderr)
        sys.exit(2)


if __name__ == '__main__':
    main()