#!/usr/bin/env python3
"""
Perplexity API Cost Estimation and Budget Management System

Provides comprehensive cost tracking, budget enforcement, and usage analytics
for Perplexity API integration with GitHub Actions workflows.

Key Features:
- Weekly budget tracking with automatic rollover
- Model-specific cost estimation based on tokens and search queries
- Budget threshold enforcement (warn/hard-stop)
- Usage logging and analytics
- ISO week-based budget periods
"""

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union
import yaml
import argparse


class PerplexityCostManager:
    """Manages Perplexity API costs, budgets, and usage tracking."""
    
    def __init__(self, config_path: Optional[str] = None):
        """Initialize cost manager with configuration."""
        self.config_path = config_path or '.github/perplexity-config.yml'
        self.config = self._load_config()
        self.usage_log_path = Path(self.config['logging']['usage_log_file'])
        self.usage_log_path.parent.mkdir(parents=True, exist_ok=True)
    
    def _load_config(self) -> Dict:
        """Load configuration from YAML file."""
        try:
            config_file = Path(self.config_path)
            if not config_file.exists():
                raise FileNotFoundError(f"Configuration file not found: {self.config_path}")
            
            with open(config_file, 'r') as f:
                config = yaml.safe_load(f)
            return config
        except Exception as e:
            print(f"❌ Error loading configuration: {e}", file=sys.stderr)
            sys.exit(1)
    
    def get_iso_week(self, dt: Optional[datetime] = None) -> str:
        """Get ISO week string (YYYY-WW) for given datetime."""
        if dt is None:
            dt = datetime.now(timezone.utc)
        return dt.strftime("%Y-W%V")
    
    def estimate_cost(self, 
                     tokens_in: int, 
                     tokens_out: int, 
                     search_queries: int = 0, 
                     model: str = 'sonar') -> float:
        """
        Estimate cost for Perplexity API request.
        
        Args:
            tokens_in: Number of input tokens
            tokens_out: Number of output tokens
            search_queries: Number of search queries performed
            model: Model name (sonar, sonar-reasoning, sonar-pro)
            
        Returns:
            Estimated cost in USD
        """
        try:
            # Find model policy
            model_policy = None
            for policy in self.config['model_policies']:
                if policy['name'] == model:
                    model_policy = policy
                    break
            
            if not model_policy:
                print(f"⚠️ Model '{model}' not found in configuration, using default", file=sys.stderr)
                model = self.config['default_model']
                model_policy = next(p for p in self.config['model_policies'] if p['name'] == model)
            
            # Calculate token costs (per million tokens)
            input_cost = (tokens_in / 1_000_000) * model_policy['input_cost_per_million']
            output_cost = (tokens_out / 1_000_000) * model_policy['output_cost_per_million']
            
            # Calculate search query costs (per thousand queries)
            search_cost = (search_queries / 1_000) * self.config['search_query_cost_per_thousand']
            
            total_cost = input_cost + output_cost + search_cost
            
            return round(total_cost, 4)
            
        except Exception as e:
            print(f"❌ Error estimating cost: {e}", file=sys.stderr)
            return 0.0
    
    def update_usage_log(self, 
                        tokens_in: int, 
                        tokens_out: int, 
                        search_queries: int = 0, 
                        model: str = 'sonar',
                        issue_number: Optional[int] = None,
                        cached: bool = False) -> float:
        """
        Log API usage and return estimated cost.
        
        Args:
            tokens_in: Input tokens used
            tokens_out: Output tokens generated
            search_queries: Search queries performed
            model: Model used
            issue_number: GitHub issue number (if applicable)
            cached: Whether result was served from cache
            
        Returns:
            Estimated cost for this request
        """
        timestamp = datetime.now(timezone.utc)
        iso_week = self.get_iso_week(timestamp)
        
        # Calculate cost (0 if cached)
        cost = 0.0 if cached else self.estimate_cost(tokens_in, tokens_out, search_queries, model)
        
        # Create usage entry
        usage_entry = {
            'timestamp': timestamp.isoformat(),
            'iso_week': iso_week,
            'issue_number': issue_number,
            'model': model,
            'tokens_in': tokens_in,
            'tokens_out': tokens_out,
            'search_queries': search_queries,
            'estimated_cost_usd': cost,
            'cached': cached
        }
        
        # Append to usage log
        try:
            # Load existing log or create empty list
            if self.usage_log_path.exists():
                with open(self.usage_log_path, 'r') as f:
                    usage_log = json.load(f)
            else:
                usage_log = []
            
            # Append new entry
            usage_log.append(usage_entry)
            
            # Write back to file
            with open(self.usage_log_path, 'w') as f:
                json.dump(usage_log, f, indent=2)
            
            return cost
            
        except Exception as e:
            print(f"❌ Error updating usage log: {e}", file=sys.stderr)
            return cost
    
    def get_weekly_usage(self, iso_week: Optional[str] = None) -> Dict:
        """
        Get usage statistics for specified week.
        
        Args:
            iso_week: ISO week string (YYYY-WW), defaults to current week
            
        Returns:
            Dictionary with usage statistics
        """
        if iso_week is None:
            iso_week = self.get_iso_week()
        
        try:
            if not self.usage_log_path.exists():
                return {
                    'iso_week': iso_week,
                    'total_cost': 0.0,
                    'total_requests': 0,
                    'cached_requests': 0,
                    'models_used': {},
                    'entries': []
                }
            
            with open(self.usage_log_path, 'r') as f:
                usage_log = json.load(f)
            
            # Filter entries for the specified week
            week_entries = [entry for entry in usage_log if entry['iso_week'] == iso_week]
            
            # Calculate statistics
            total_cost = sum(entry['estimated_cost_usd'] for entry in week_entries)
            total_requests = len(week_entries)
            cached_requests = len([entry for entry in week_entries if entry['cached']])
            
            # Model usage statistics
            models_used = {}
            for entry in week_entries:
                model = entry['model']
                if model not in models_used:
                    models_used[model] = {'count': 0, 'cost': 0.0}
                models_used[model]['count'] += 1
                models_used[model]['cost'] += entry['estimated_cost_usd']
            
            return {
                'iso_week': iso_week,
                'total_cost': round(total_cost, 4),
                'total_requests': total_requests,
                'cached_requests': cached_requests,
                'cache_hit_rate': round(cached_requests / total_requests * 100, 1) if total_requests > 0 else 0.0,
                'models_used': models_used,
                'entries': week_entries
            }
            
        except Exception as e:
            print(f"❌ Error getting weekly usage: {e}", file=sys.stderr)
            return {'iso_week': iso_week, 'total_cost': 0.0, 'error': str(e)}
    
    def remaining_budget(self, iso_week: Optional[str] = None) -> Dict:
        """
        Calculate remaining budget for specified week.
        
        Args:
            iso_week: ISO week string, defaults to current week
            
        Returns:
            Dictionary with budget information
        """
        if iso_week is None:
            iso_week = self.get_iso_week()
        
        weekly_usage = self.get_weekly_usage(iso_week)
        weekly_budget = self.config['weekly_budget_usd']
        used_amount = weekly_usage['total_cost']
        remaining = max(0.0, weekly_budget - used_amount)
        
        warn_threshold = weekly_budget * (self.config['warn_threshold_pct'] / 100)
        hard_threshold = weekly_budget * (self.config['hard_stop_threshold_pct'] / 100)
        
        # Determine budget state
        if used_amount >= hard_threshold:
            state = 'HARD_STOP'
        elif used_amount >= warn_threshold:
            state = 'WARNING'
        else:
            state = 'OK'
        
        return {
            'iso_week': iso_week,
            'weekly_budget': weekly_budget,
            'used_amount': round(used_amount, 4),
            'remaining_amount': round(remaining, 4),
            'usage_percentage': round((used_amount / weekly_budget) * 100, 1),
            'warn_threshold': round(warn_threshold, 4),
            'hard_threshold': round(hard_threshold, 4),
            'state': state,
            'can_proceed': state != 'HARD_STOP'
        }
    
    def should_abort(self, projected_cost: float, iso_week: Optional[str] = None) -> Tuple[bool, str]:
        """
        Determine if request should be aborted based on budget.
        
        Args:
            projected_cost: Estimated cost for upcoming request
            iso_week: ISO week to check, defaults to current week
            
        Returns:
            Tuple of (should_abort: bool, reason: str)
        """
        if iso_week is None:
            iso_week = self.get_iso_week()
        
        budget_info = self.remaining_budget(iso_week)
        
        # Check if hard stop already reached
        if budget_info['state'] == 'HARD_STOP':
            return True, f"Weekly budget exceeded: ${budget_info['used_amount']:.4f} / ${budget_info['weekly_budget']:.2f}"
        
        # Check if projected cost would exceed budget
        projected_total = budget_info['used_amount'] + projected_cost
        if projected_total > budget_info['hard_threshold']:
            return True, f"Projected cost ${projected_total:.4f} would exceed hard threshold ${budget_info['hard_threshold']:.4f}"
        
        return False, "Budget OK"
    
    def cleanup_old_entries(self, retention_weeks: int = 12) -> int:
        """
        Clean up old usage log entries.
        
        Args:
            retention_weeks: Number of weeks to retain
            
        Returns:
            Number of entries removed
        """
        try:
            if not self.usage_log_path.exists():
                return 0
            
            with open(self.usage_log_path, 'r') as f:
                usage_log = json.load(f)
            
            # Calculate cutoff date
            cutoff_date = datetime.now(timezone.utc) - timedelta(weeks=retention_weeks)
            cutoff_iso_week = self.get_iso_week(cutoff_date)
            
            # Filter entries to keep
            original_count = len(usage_log)
            filtered_log = [
                entry for entry in usage_log 
                if entry['iso_week'] >= cutoff_iso_week
            ]
            
            # Write back filtered log
            with open(self.usage_log_path, 'w') as f:
                json.dump(filtered_log, f, indent=2)
            
            removed_count = original_count - len(filtered_log)
            return removed_count
            
        except Exception as e:
            print(f"❌ Error cleaning up old entries: {e}", file=sys.stderr)
            return 0


def main():
    """Command line interface for cost management."""
    parser = argparse.ArgumentParser(description='Perplexity Cost Management')
    parser.add_argument('--config', help='Path to configuration file')
    parser.add_argument('--week', help='ISO week (YYYY-WW)')
    
    subparsers = parser.add_subparsers(dest='command', help='Commands')
    
    # Estimate cost command
    estimate_parser = subparsers.add_parser('estimate', help='Estimate cost')
    estimate_parser.add_argument('--tokens-in', type=int, required=True)
    estimate_parser.add_argument('--tokens-out', type=int, required=True)
    estimate_parser.add_argument('--search-queries', type=int, default=0)
    estimate_parser.add_argument('--model', default='sonar')
    
    # Usage command
    usage_parser = subparsers.add_parser('usage', help='Get usage statistics')
    
    # Budget command
    budget_parser = subparsers.add_parser('budget', help='Get budget information')
    
    # Guard command
    guard_parser = subparsers.add_parser('guard', help='Check if request should proceed')
    guard_parser.add_argument('--projected-cost', type=float, required=True)
    
    # Cleanup command
    cleanup_parser = subparsers.add_parser('cleanup', help='Clean old entries')
    cleanup_parser.add_argument('--retention-weeks', type=int, default=12)
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    # Initialize cost manager
    cost_manager = PerplexityCostManager(args.config)
    
    try:
        if args.command == 'estimate':
            cost = cost_manager.estimate_cost(
                args.tokens_in, 
                args.tokens_out, 
                args.search_queries, 
                args.model
            )
            print(json.dumps({
                'estimated_cost_usd': cost,
                'model': args.model,
                'tokens_in': args.tokens_in,
                'tokens_out': args.tokens_out,
                'search_queries': args.search_queries
            }, indent=2))
        
        elif args.command == 'usage':
            usage = cost_manager.get_weekly_usage(args.week)
            print(json.dumps(usage, indent=2))
        
        elif args.command == 'budget':
            budget = cost_manager.remaining_budget(args.week)
            print(json.dumps(budget, indent=2))
        
        elif args.command == 'guard':
            should_abort, reason = cost_manager.should_abort(args.projected_cost, args.week)
            result = {
                'should_abort': should_abort,
                'reason': reason,
                'projected_cost': args.projected_cost
            }
            print(json.dumps(result, indent=2))
            sys.exit(1 if should_abort else 0)
        
        elif args.command == 'cleanup':
            removed = cost_manager.cleanup_old_entries(args.retention_weeks)
            print(json.dumps({
                'removed_entries': removed,
                'retention_weeks': args.retention_weeks
            }, indent=2))
        
    except Exception as e:
        print(f"❌ Command failed: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()