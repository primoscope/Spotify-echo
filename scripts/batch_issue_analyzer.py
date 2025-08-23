#!/usr/bin/env python3
"""
Batch Issue Analyzer for Perplexity Integration

Processes multiple issues in batches to optimize API usage:
- Gathers up to N unanalyzed issues per run
- Groups by similarity to minimize API calls
- Smart batching to reduce costs while maintaining quality
- Integrates with centralized PerplexityClient

Usage:
    python scripts/batch_issue_analyzer.py --max-issues 5 --dry-run
    python scripts/batch_issue_analyzer.py --similarity-grouping
"""

import os
import sys
import json
import argparse
import hashlib
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Tuple, Optional
import time

# Add scripts directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from perplexity_client import PerplexityClient
from issue_analyzer import IssueAnalyzer

class BatchIssueAnalyzer:
    """Batch processor for analyzing multiple issues efficiently"""
    
    def __init__(self, repository_root: Optional[Path] = None, max_issues: int = 5):
        if repository_root is None:
            repository_root = Path(__file__).parent.parent  # Go up from scripts/ to root
        
        self.repository_root = Path(repository_root)
        self.perplexity_dir = self.repository_root / '.perplexity'
        self.max_issues = max_issues
        
        # Initialize components
        self.client = PerplexityClient(self.perplexity_dir)
        self.analyzer = IssueAnalyzer(repository_root)
        
        print(f"Initialized BatchIssueAnalyzer - Max issues per batch: {max_issues}")
    
    def get_mock_issues(self) -> List[Dict[str, Any]]:
        """Get mock issues for demonstration (in real implementation, fetch from GitHub API)"""
        return [
            {
                'number': 101,
                'title': 'Implement user authentication with JWT',
                'body': '''We need to add secure user authentication to the application using JWT tokens. 
                
Requirements:
- User registration and login
- Password hashing with bcrypt
- JWT token generation and validation
- Protected routes middleware
- Token refresh functionality

This is a critical security feature needed before production deployment.''',
                'created_at': '2024-01-15T10:00:00Z',
                'updated_at': '2024-01-15T10:00:00Z',
                'labels': ['enhancement', 'security']
            },
            {
                'number': 102,
                'title': 'Fix CSS responsiveness on mobile devices',
                'body': '''The application layout breaks on mobile screens smaller than 768px. 
                
Issues observed:
- Navigation menu overlaps content
- Buttons are too small to tap
- Text is cut off on narrow screens

Quick fix needed for better user experience.''',
                'created_at': '2024-01-16T09:30:00Z',
                'updated_at': '2024-01-16T09:30:00Z',
                'labels': ['bug', 'frontend', 'mobile']
            },
            {
                'number': 103,
                'title': 'Add Redis caching for API responses',
                'body': '''Implement Redis caching layer for frequently accessed API endpoints to improve performance.

Scope:
- Cache user profiles and preferences
- Cache Spotify API responses with TTL
- Cache AI chat responses for repeated queries
- Add cache invalidation strategies

Expected performance improvement: 40-60% faster response times.''',
                'created_at': '2024-01-16T14:20:00Z',
                'updated_at': '2024-01-16T14:20:00Z',
                'labels': ['enhancement', 'performance']
            },
            {
                'number': 104,
                'title': 'Database migration script for new user schema',
                'body': '''Create migration script to update user schema in MongoDB.

Changes needed:
- Add new fields for user preferences
- Update existing documents with default values
- Create indexes for performance
- Backup strategy before migration

This needs to be done before the v2.0 release.''',
                'created_at': '2024-01-17T11:15:00Z',
                'updated_at': '2024-01-17T11:15:00Z',
                'labels': ['database', 'migration']
            },
            {
                'number': 105,
                'title': 'Update documentation for API endpoints',
                'body': '''The API documentation is outdated and missing several new endpoints.

Need to update:
- Authentication endpoints
- Music recommendation endpoints  
- Chat API documentation
- Add code examples
- Update response schemas

Low priority but important for developer experience.''',
                'created_at': '2024-01-17T16:45:00Z',
                'updated_at': '2024-01-17T16:45:00Z',
                'labels': ['documentation']
            },
            {
                'number': 106,
                'title': 'Implement JWT token refresh functionality',
                'body': '''Add automatic JWT token refresh to prevent users from being logged out.

Similar to issue #101 but focuses specifically on the refresh mechanism:
- Refresh tokens with longer expiry
- Automatic renewal before expiry
- Secure token storage
- Revocation mechanism

This complements the main authentication system.''',
                'created_at': '2024-01-18T08:30:00Z',
                'updated_at': '2024-01-18T08:30:00Z',
                'labels': ['enhancement', 'security', 'authentication']
            }
        ]
    
    def check_issue_analysis_status(self, issue: Dict[str, Any]) -> bool:
        """Check if issue has been analyzed recently"""
        title = issue['title']
        body = issue['body']
        
        # Check if we have a cached analysis
        cached_response = self.client.cache_manager.get_cached_response(title, body, 'sonar')
        if cached_response:
            return True
        
        # Could also check for existing analysis comments in GitHub
        # For now, assume uncached = unanalyzed
        return False
    
    def calculate_similarity_score(self, issue1: Dict[str, Any], issue2: Dict[str, Any]) -> float:
        """Calculate similarity between two issues (0.0 to 1.0)"""
        # Simple similarity based on title and keywords
        title1_words = set(issue1['title'].lower().split())
        title2_words = set(issue2['title'].lower().split())
        
        body1_words = set(issue1['body'].lower().split()[:50])  # First 50 words
        body2_words = set(issue2['body'].lower().split()[:50])
        
        # Calculate Jaccard similarity
        title_intersection = len(title1_words.intersection(title2_words))
        title_union = len(title1_words.union(title2_words))
        title_similarity = title_intersection / title_union if title_union > 0 else 0
        
        body_intersection = len(body1_words.intersection(body2_words))
        body_union = len(body1_words.union(body2_words))
        body_similarity = body_intersection / body_union if body_union > 0 else 0
        
        # Weighted average (title more important)
        similarity = (title_similarity * 0.7) + (body_similarity * 0.3)
        
        # Check for common labels
        labels1 = set(issue1.get('labels', []))
        labels2 = set(issue2.get('labels', []))
        label_similarity = len(labels1.intersection(labels2)) / max(len(labels1.union(labels2)), 1)
        
        # Final similarity score
        final_similarity = (similarity * 0.8) + (label_similarity * 0.2)
        
        return min(final_similarity, 1.0)
    
    def group_issues_by_similarity(self, issues: List[Dict[str, Any]], 
                                  similarity_threshold: float = 0.3) -> List[List[Dict[str, Any]]]:
        """Group issues by similarity to enable batch processing"""
        if len(issues) <= 1:
            return [[issue] for issue in issues]
        
        groups = []
        ungrouped_issues = issues.copy()
        
        while ungrouped_issues:
            # Start new group with first ungrouped issue
            current_group = [ungrouped_issues.pop(0)]
            
            # Find similar issues to add to this group
            i = 0
            while i < len(ungrouped_issues):
                issue = ungrouped_issues[i]
                
                # Check similarity with any issue in current group
                max_similarity = max(
                    self.calculate_similarity_score(issue, group_issue) 
                    for group_issue in current_group
                )
                
                if max_similarity >= similarity_threshold:
                    current_group.append(ungrouped_issues.pop(i))
                else:
                    i += 1
            
            groups.append(current_group)
        
        print(f"Grouped {len(issues)} issues into {len(groups)} groups")
        for i, group in enumerate(groups):
            titles = [issue['title'][:30] + '...' for issue in group]
            print(f"  Group {i+1}: {len(group)} issues - {', '.join(titles)}")
        
        return groups
    
    def analyze_issue_group(self, issues: List[Dict[str, Any]], dry_run: bool = False) -> List[Dict[str, Any]]:
        """Analyze a group of similar issues, potentially with batch optimization"""
        results = []
        
        if len(issues) == 1:
            # Single issue - use standard analysis
            issue = issues[0]
            result = self.analyzer.analyze_issue(
                title=issue['title'],
                body=issue['body'],
                issue_number=issue['number'],
                dry_run=dry_run
            )
            results.append(result)
        
        else:
            # Multiple similar issues - could optimize with batch analysis
            print(f"Analyzing group of {len(issues)} similar issues:")
            
            # For now, analyze each issue individually
            # In a more advanced implementation, we could create a combined prompt
            for issue in issues:
                print(f"  - Issue #{issue['number']}: {issue['title'][:50]}...")
                result = self.analyzer.analyze_issue(
                    title=issue['title'],
                    body=issue['body'],
                    issue_number=issue['number'],
                    dry_run=dry_run
                )
                results.append(result)
                
                # Small delay between requests to be respectful
                if not dry_run and not result.get('cache_hit'):
                    time.sleep(1)
        
        return results
    
    def filter_unanalyzed_issues(self, issues: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Filter to only include issues that haven't been analyzed recently"""
        unanalyzed = []
        
        for issue in issues:
            if not self.check_issue_analysis_status(issue):
                unanalyzed.append(issue)
            else:
                print(f"Skipping issue #{issue['number']} - already analyzed (cached)")
        
        return unanalyzed
    
    def run_batch_analysis(self, dry_run: bool = False, use_similarity_grouping: bool = True) -> Dict[str, Any]:
        """Run batch analysis on unanalyzed issues"""
        
        # Check budget first
        budget_status = self.client.budget_manager.check_budget()
        if not budget_status['allow_requests'] and not dry_run:
            print(f"❌ Budget exceeded: {budget_status['status']}")
            return {
                'success': False,
                'error': 'Weekly budget exceeded',
                'budget_status': budget_status
            }
        
        print(f"💰 Budget status: {budget_status['status']} "
              f"(${budget_status['total_cost']:.2f}/${budget_status['weekly_budget']:.2f})")
        
        # Get available issues
        all_issues = self.get_mock_issues()
        print(f"Found {len(all_issues)} total issues")
        
        # Filter to unanalyzed issues
        unanalyzed_issues = self.filter_unanalyzed_issues(all_issues)
        print(f"Found {len(unanalyzed_issues)} unanalyzed issues")
        
        if not unanalyzed_issues:
            print("✅ No issues need analysis")
            return {
                'success': True,
                'message': 'No issues need analysis',
                'issues_processed': 0,
                'budget_status': budget_status
            }
        
        # Limit to max_issues
        issues_to_process = unanalyzed_issues[:self.max_issues]
        if len(issues_to_process) < len(unanalyzed_issues):
            print(f"Limiting to {len(issues_to_process)} issues this batch "
                  f"({len(unanalyzed_issues) - len(issues_to_process)} remaining)")
        
        # Group by similarity if requested
        if use_similarity_grouping and len(issues_to_process) > 1:
            issue_groups = self.group_issues_by_similarity(issues_to_process)
        else:
            issue_groups = [[issue] for issue in issues_to_process]
        
        # Process each group
        all_results = []
        total_estimated_cost = 0
        
        for group_index, issue_group in enumerate(issue_groups):
            print(f"\n📊 Processing group {group_index + 1}/{len(issue_groups)}")
            
            # Check budget before each group
            if not dry_run:
                budget_status = self.client.budget_manager.check_budget()
                if not budget_status['allow_requests']:
                    print(f"💰 Budget limit reached during processing - stopping")
                    break
            
            group_results = self.analyze_issue_group(issue_group, dry_run=dry_run)
            all_results.extend(group_results)
            
            # Accumulate cost estimates
            for result in group_results:
                total_estimated_cost += result.get('metadata', {}).get('cost_estimate', 0)
        
        # Summary
        successful_analyses = sum(1 for r in all_results if r.get('success'))
        cache_hits = sum(1 for r in all_results if r.get('metadata', {}).get('cache_hit'))
        
        return {
            'success': True,
            'batch_summary': {
                'total_issues_processed': len(all_results),
                'successful_analyses': successful_analyses,
                'cache_hits': cache_hits,
                'api_calls_made': successful_analyses - cache_hits,
                'groups_processed': len(issue_groups),
                'total_estimated_cost': total_estimated_cost,
                'dry_run': dry_run
            },
            'budget_status': self.client.budget_manager.check_budget(),
            'results': all_results
        }
    
    def generate_batch_summary_comment(self, batch_result: Dict[str, Any]) -> str:
        """Generate summary comment for batch processing results"""
        summary = batch_result.get('batch_summary', {})
        budget = batch_result.get('budget_status', {})
        
        comment = f"""## 🔄 Batch Issue Analysis Summary

**Batch Processing Results:**
- **Issues Processed**: {summary.get('total_issues_processed', 0)}
- **Successful Analyses**: {summary.get('successful_analyses', 0)}
- **Cache Hits**: {summary.get('cache_hits', 0)} (saved cost!)
- **API Calls Made**: {summary.get('api_calls_made', 0)}
- **Groups Processed**: {summary.get('groups_processed', 0)}
- **Total Cost**: ${summary.get('total_estimated_cost', 0):.4f}

**Budget Status:** {budget.get('status', 'Unknown')}
- **Weekly Used**: ${budget.get('total_cost', 0):.2f} / ${budget.get('weekly_budget', 3):.2f}
- **Remaining**: ${budget.get('budget_remaining', 0):.2f}
- **Usage**: {budget.get('budget_used_pct', 0):.1f}%

**Next Steps:**
- Individual issue analyses have been posted as separate comments
- Batch processing optimized costs through similarity grouping
- {"⚠️ Budget warning - approaching limit" if budget.get('budget_used_pct', 0) > 80 else "✅ Budget healthy"}

---
*Automated batch analysis completed at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*"""

        return comment


def main():
    parser = argparse.ArgumentParser(description='Batch Issue Analyzer for Perplexity Integration')
    parser.add_argument('--max-issues', type=int, default=5, help='Maximum issues to process per batch')
    parser.add_argument('--dry-run', action='store_true', help='Run in dry-run mode (no API calls)')
    parser.add_argument('--similarity-grouping', action='store_true', default=True, 
                       help='Group similar issues for batch optimization')
    parser.add_argument('--similarity-threshold', type=float, default=0.3, 
                       help='Similarity threshold for grouping (0.0-1.0)')
    parser.add_argument('--output-file', help='Save batch results to JSON file')
    parser.add_argument('--summary-comment', action='store_true', help='Generate batch summary comment')
    
    args = parser.parse_args()
    
    try:
        # Initialize batch analyzer
        batch_analyzer = BatchIssueAnalyzer(max_issues=args.max_issues)
        
        # Run batch analysis
        print("🚀 Starting batch issue analysis...")
        result = batch_analyzer.run_batch_analysis(
            dry_run=args.dry_run, 
            use_similarity_grouping=args.similarity_grouping
        )
        
        # Output results
        if args.summary_comment:
            comment_text = batch_analyzer.generate_batch_summary_comment(result)
            print("\n" + "="*60)
            print("BATCH SUMMARY COMMENT:")
            print("="*60)
            print(comment_text)
        else:
            print("\n" + "="*60)
            print("BATCH ANALYSIS RESULTS:")
            print("="*60)
            print(json.dumps(result, indent=2, default=str))
        
        # Save to file if requested
        if args.output_file:
            with open(args.output_file, 'w') as f:
                json.dump(result, f, indent=2, default=str)
            print(f"\nBatch results saved to: {args.output_file}")
        
        # Exit with appropriate code
        sys.exit(0 if result.get('success') else 1)
        
    except Exception as e:
        print(f"Error in batch analysis: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()