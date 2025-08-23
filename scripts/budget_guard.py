#!/usr/bin/env python3
"""
Budget Guard System for Perplexity API Workflows

Pre-workflow validation script that checks budget status and determines
if Perplexity API operations should proceed. Used in GitHub Actions to
prevent budget overruns.

Key Features:
- Pre-flight budget validation
- Workflow gating based on budget state
- GitHub Actions output generation
- Repository label management
- Budget summary artifact generation
"""

import json
import os
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import subprocess
import argparse

# Import our cost management utilities
try:
    from perplexity_costs import PerplexityCostManager
except ImportError:
    # If running as standalone script, add current directory to path
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from perplexity_costs import PerplexityCostManager


class BudgetGuard:
    """Budget guard system for GitHub Actions workflows."""
    
    def __init__(self, config_path: Optional[str] = None):
        """Initialize budget guard."""
        self.cost_manager = PerplexityCostManager(config_path)
        self.config = self.cost_manager.config
        
        # GitHub environment variables
        self.github_token = os.environ.get('GITHUB_TOKEN')
        self.github_repository = os.environ.get('GITHUB_REPOSITORY')
        self.github_output = os.environ.get('GITHUB_OUTPUT')
        self.github_step_summary = os.environ.get('GITHUB_STEP_SUMMARY')
        
        # Budget enforcement settings
        self.budget_config = self.config.get('budget_enforcement', {})
        self.defer_label = self.budget_config.get('defer_label', 'analysis-deferred-budget')
        self.disable_label = self.budget_config.get('disable_label', 'ai-analysis-disabled')
        self.override_label = self.budget_config.get('override_label', 'override-budget-guard')
    
    def check_repository_labels(self) -> List[str]:
        """
        Check if repository has budget override labels.
        
        Returns:
            List of relevant labels found
        """
        if not self.github_token or not self.github_repository:
            return []
        
        try:
            # Use gh CLI if available, otherwise skip label check
            result = subprocess.run([
                'gh', 'repo', 'view', self.github_repository, '--json', 'labels'
            ], capture_output=True, text=True, timeout=30)
            
            if result.returncode != 0:
                return []
            
            repo_data = json.loads(result.stdout)
            repo_labels = [label['name'] for label in repo_data.get('labels', [])]
            
            relevant_labels = []
            for label in [self.disable_label, self.override_label]:
                if label in repo_labels:
                    relevant_labels.append(label)
            
            return relevant_labels
            
        except (subprocess.TimeoutExpired, subprocess.SubprocessError, json.JSONDecodeError):
            return []
        except Exception as e:
            print(f"⚠️ Warning: Could not check repository labels: {e}", file=sys.stderr)
            return []
    
    def create_budget_summary(self) -> Dict:
        """
        Create comprehensive budget summary for artifacts and reporting.
        
        Returns:
            Dictionary with budget summary data
        """
        try:
            # Get current budget status
            budget_info = self.cost_manager.remaining_budget()
            weekly_usage = self.cost_manager.get_weekly_usage()
            
            # Get repository labels
            repo_labels = self.check_repository_labels()
            
            # Determine recommendation
            state = budget_info['state']
            can_proceed = budget_info['can_proceed']
            
            # Check for override label
            if self.override_label in repo_labels:
                can_proceed = True
                state = 'OVERRIDE'
            
            # Check for disable label
            if self.disable_label in repo_labels:
                can_proceed = False
                state = 'DISABLED'
            
            # Generate recommendations
            recommendations = []
            if state == 'HARD_STOP':
                recommendations.append("Budget exhausted - wait for weekly reset")
                recommendations.append(f"Consider adding '{self.override_label}' label for emergency override")
            elif state == 'WARNING':
                recommendations.append("Approaching budget limit - prioritize simple analyses only")
                recommendations.append("Consider batching requests to optimize costs")
            elif state == 'OK':
                recommendations.append("Budget healthy - all operations permitted")
            
            summary = {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'budget_status': {
                    'iso_week': budget_info['iso_week'],
                    'state': state,
                    'can_proceed': can_proceed,
                    'weekly_budget_usd': budget_info['weekly_budget'],
                    'used_amount_usd': budget_info['used_amount'],
                    'remaining_amount_usd': budget_info['remaining_amount'],
                    'usage_percentage': budget_info['usage_percentage'],
                    'warn_threshold_usd': budget_info['warn_threshold'],
                    'hard_threshold_usd': budget_info['hard_threshold']
                },
                'usage_statistics': {
                    'total_requests': weekly_usage.get('total_requests', 0),
                    'cached_requests': weekly_usage.get('cached_requests', 0),
                    'cache_hit_rate': weekly_usage.get('cache_hit_rate', 0.0),
                    'models_used': weekly_usage.get('models_used', {})
                },
                'repository_status': {
                    'labels_found': repo_labels,
                    'defer_label': self.defer_label,
                    'disable_label': self.disable_label,
                    'override_label': self.override_label
                },
                'recommendations': recommendations,
                'next_reset': self._calculate_next_reset(),
                'config_summary': {
                    'weekly_budget': self.config['weekly_budget_usd'],
                    'warn_threshold_pct': self.config['warn_threshold_pct'],
                    'hard_stop_threshold_pct': self.config['hard_stop_threshold_pct'],
                    'models_available': [p['name'] for p in self.config['model_policies']]
                }
            }
            
            return summary
            
        except Exception as e:
            print(f"⚠️ Warning: Error creating budget summary: {e}", file=sys.stderr)
            return {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'error': str(e),
                'budget_status': {
                    'state': 'ERROR', 
                    'can_proceed': False,
                    'weekly_budget': 3.0,
                    'used_amount': 0.0,
                    'remaining_amount': 3.0,
                    'usage_percentage': 0.0,
                    'iso_week': self.cost_manager.get_iso_week()
                },
                'usage_statistics': {
                    'total_requests': 0,
                    'cached_requests': 0,
                    'cache_hit_rate': 0.0,
                    'models_used': {}
                },
                'repository_status': {
                    'labels_found': [],
                    'defer_label': self.defer_label,
                    'disable_label': self.disable_label,
                    'override_label': self.override_label
                },
                'recommendations': ["Error occurred during budget check - investigate system status"],
                'next_reset': self._calculate_next_reset()
            }
    
    def _calculate_next_reset(self) -> str:
        """Calculate next weekly budget reset time."""
        try:
            now = datetime.now(timezone.utc)
            days_until_monday = (7 - now.weekday()) % 7
            if days_until_monday == 0:  # If today is Monday
                days_until_monday = 7
            
            next_reset = now.replace(hour=0, minute=0, second=0, microsecond=0)
            next_reset = next_reset + timedelta(days=days_until_monday)
            
            return next_reset.isoformat()
        except Exception:
            return "Unknown"
    
    def write_github_outputs(self, summary: Dict) -> bool:
        """
        Write GitHub Actions outputs for downstream jobs.
        
        Args:
            summary: Budget summary dictionary
            
        Returns:
            True if outputs written successfully
        """
        if not self.github_output:
            return False
        
        try:
            budget_status = summary.get('budget_status', {})
            
            # Write key outputs for GitHub Actions
            outputs = {
                'can_proceed': str(budget_status.get('can_proceed', False)).lower(),
                'state': budget_status.get('state', 'ERROR'),
                'remaining_usd': str(budget_status.get('remaining_amount_usd', 0.0)),
                'usage_percentage': str(budget_status.get('usage_percentage', 0.0)),
                'iso_week': budget_status.get('iso_week', ''),
                'recommendations': json.dumps(summary.get('recommendations', []))
            }
            
            with open(self.github_output, 'a') as f:
                for key, value in outputs.items():
                    f.write(f"{key}={value}\n")
            
            return True
            
        except Exception as e:
            print(f"❌ Error writing GitHub outputs: {e}", file=sys.stderr)
            return False
    
    def write_step_summary(self, summary: Dict) -> bool:
        """
        Write GitHub Actions step summary.
        
        Args:
            summary: Budget summary dictionary
            
        Returns:
            True if summary written successfully
        """
        if not self.github_step_summary:
            return False
        
        try:
            budget_status = summary.get('budget_status', {})
            usage_stats = summary.get('usage_statistics', {})
            
            # Determine emoji and color for state
            state = budget_status.get('state', 'ERROR')
            state_info = {
                'OK': ('🟢', 'green', 'Budget is healthy'),
                'WARNING': ('🟡', 'orange', 'Approaching budget limit'),
                'HARD_STOP': ('🔴', 'red', 'Budget exhausted'),
                'OVERRIDE': ('🔵', 'blue', 'Manual override active'),
                'DISABLED': ('⚫', 'gray', 'AI analysis disabled'),
                'ERROR': ('❌', 'red', 'Budget check failed')
            }
            
            emoji, color, description = state_info.get(state, ('❓', 'gray', 'Unknown state'))
            
            markdown_summary = f"""
# {emoji} Perplexity Budget Status: {state}

**{description}**

## Budget Overview
- **Week**: {budget_status.get('iso_week', 'Unknown')}
- **Used**: ${budget_status.get('used_amount_usd', 0.0):.4f} / ${budget_status.get('weekly_budget_usd', 3.0):.2f}
- **Remaining**: ${budget_status.get('remaining_amount_usd', 0.0):.4f}
- **Usage**: {budget_status.get('usage_percentage', 0.0):.1f}%

## Usage Statistics
- **Total Requests**: {usage_stats.get('total_requests', 0)}
- **Cache Hits**: {usage_stats.get('cached_requests', 0)}
- **Cache Hit Rate**: {usage_stats.get('cache_hit_rate', 0.0):.1f}%

## Recommendations
"""
            
            for rec in summary.get('recommendations', []):
                markdown_summary += f"- {rec}\n"
            
            markdown_summary += f"""
## Thresholds
- **Warning**: ${budget_status.get('warn_threshold_usd', 0.0):.2f} ({self.config.get('warn_threshold_pct', 70)}%)
- **Hard Stop**: ${budget_status.get('hard_threshold_usd', 0.0):.2f} ({self.config.get('hard_stop_threshold_pct', 100)}%)

**Next Reset**: {summary.get('next_reset', 'Unknown')}
"""
            
            with open(self.github_step_summary, 'w') as f:
                f.write(markdown_summary)
            
            return True
            
        except Exception as e:
            print(f"❌ Error writing step summary: {e}", file=sys.stderr)
            return False
    
    def save_budget_artifact(self, summary: Dict, output_file: str = "budget-summary.json") -> bool:
        """
        Save budget summary as JSON artifact.
        
        Args:
            summary: Budget summary dictionary
            output_file: Output file path
            
        Returns:
            True if artifact saved successfully
        """
        try:
            output_path = Path(output_file)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(output_path, 'w') as f:
                json.dump(summary, f, indent=2)
            
            print(f"✅ Budget summary saved to {output_path}")
            return True
            
        except Exception as e:
            print(f"❌ Error saving budget artifact: {e}", file=sys.stderr)
            return False
    
    def run_budget_check(self) -> Tuple[bool, Dict]:
        """
        Run complete budget check and generate all outputs.
        
        Returns:
            Tuple of (should_proceed: bool, summary: dict)
        """
        try:
            # Generate budget summary
            summary = self.create_budget_summary()
            
            # Determine if workflow should proceed
            should_proceed = summary.get('budget_status', {}).get('can_proceed', False)
            
            # Write GitHub Actions outputs
            self.write_github_outputs(summary)
            
            # Write step summary
            self.write_step_summary(summary)
            
            # Save artifact
            self.save_budget_artifact(summary)
            
            # Print console summary
            state = summary.get('budget_status', {}).get('state', 'ERROR')
            usage_pct = summary.get('budget_status', {}).get('usage_percentage', 0.0)
            
            if should_proceed:
                print(f"✅ Budget guard: PROCEED ({state}, {usage_pct:.1f}% used)")
            else:
                print(f"❌ Budget guard: ABORT ({state}, {usage_pct:.1f}% used)")
            
            return should_proceed, summary
            
        except Exception as e:
            error_summary = {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'error': str(e),
                'budget_status': {'state': 'ERROR', 'can_proceed': False}
            }
            
            print(f"❌ Budget guard failed: {e}", file=sys.stderr)
            
            # Try to write error outputs
            try:
                self.write_github_outputs(error_summary)
                self.save_budget_artifact(error_summary)
            except:
                pass
            
            return False, error_summary


def main():
    """Command line interface for budget guard."""
    parser = argparse.ArgumentParser(description='Perplexity Budget Guard')
    parser.add_argument('--config', help='Path to configuration file')
    parser.add_argument('--output-file', default='budget-summary.json', 
                       help='Output file for budget summary artifact')
    parser.add_argument('--dry-run', action='store_true', 
                       help='Run check without writing GitHub outputs')
    parser.add_argument('--verbose', '-v', action='store_true', 
                       help='Enable verbose output')
    
    args = parser.parse_args()
    
    try:
        # Initialize budget guard
        guard = BudgetGuard(args.config)
        
        # Run budget check
        should_proceed, summary = guard.run_budget_check()
        
        if args.verbose:
            print("\n=== Budget Summary ===")
            print(json.dumps(summary, indent=2))
        
        # Exit with appropriate code
        sys.exit(0 if should_proceed else 1)
        
    except Exception as e:
        print(f"❌ Budget guard fatal error: {e}", file=sys.stderr)
        sys.exit(2)


if __name__ == '__main__':
    main()