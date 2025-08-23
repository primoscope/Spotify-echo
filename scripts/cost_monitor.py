#!/usr/bin/env python3
"""
Cost Monitor for Perplexity API Integration

Monitors and enforces weekly budget limits:
- Aggregates ledger entries within current ISO week
- Creates alerts at 80% budget usage
- Enforces budget lock at 100% usage
- Generates monitoring reports and alerts

Usage:
    python scripts/cost_monitor.py --check-budget
    python scripts/cost_monitor.py --dry-run
    python scripts/cost_monitor.py --reset-budget --week 2024-W03
"""

import os
import sys
import json
import argparse
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple

# Add scripts directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from perplexity_client import PerplexityClient, BudgetManager

class CostMonitor:
    """Cost monitoring and budget enforcement for Perplexity API"""
    
    def __init__(self, repository_root: Optional[Path] = None):
        if repository_root is None:
            repository_root = Path(__file__).parent.parent  # Go up from scripts/ to root
        
        self.repository_root = Path(repository_root)
        self.perplexity_dir = self.repository_root / '.perplexity'
        
        # Initialize budget manager
        self.budget_manager = BudgetManager(self.perplexity_dir)
        self.weekly_budget = self.budget_manager.weekly_budget
        
        print(f"Initialized CostMonitor - Weekly budget: ${self.weekly_budget}")
    
    def check_budget_status(self, dry_run: bool = False) -> Dict[str, Any]:
        """Check current budget status with detailed breakdown"""
        
        budget_status = self.budget_manager.check_budget()
        current_cost, request_count = self.budget_manager.get_weekly_usage()
        
        # Calculate additional metrics
        budget_used_pct = budget_status['budget_used_pct']
        remaining_budget = budget_status['budget_remaining']
        
        # Estimate remaining requests based on average cost
        avg_cost_per_request = current_cost / request_count if request_count > 0 else 0.015  # Default estimate
        estimated_remaining_requests = int(remaining_budget / avg_cost_per_request) if avg_cost_per_request > 0 else 0
        
        # Days left in current week
        now = datetime.now()
        week_start = now - timedelta(days=now.weekday())
        week_end = week_start + timedelta(days=6)
        days_left = (week_end - now).days + 1
        
        detailed_status = {
            'timestamp': datetime.now().isoformat(),
            'week_key': budget_status['week_key'],
            'budget_status': budget_status['status'],
            'allow_requests': budget_status['allow_requests'],
            'current_cost': current_cost,
            'weekly_budget': self.weekly_budget,
            'budget_used_pct': budget_used_pct,
            'remaining_budget': remaining_budget,
            'request_count': request_count,
            'avg_cost_per_request': avg_cost_per_request,
            'estimated_remaining_requests': estimated_remaining_requests,
            'days_left_in_week': days_left,
            'budget_lock_exists': self.budget_manager.is_budget_locked(),
            'weekly_analysis': self._analyze_weekly_spending(),
            'recommendations': self._generate_budget_recommendations(budget_used_pct, days_left, current_cost)
        }
        
        if not dry_run:
            self._handle_budget_alerts(detailed_status)
        
        return detailed_status
    
    def _analyze_weekly_spending(self) -> Dict[str, Any]:
        """Analyze spending patterns for the current week"""
        ledger = self.budget_manager._load_ledger()
        week_key = self.budget_manager._get_current_week_key()
        
        if week_key not in ledger:
            return {
                'daily_breakdown': {},
                'model_usage': {},
                'cost_trend': 'no_data'
            }
        
        week_data = ledger[week_key]
        requests = week_data.get('requests', [])
        
        # Daily spending breakdown
        daily_spending = {}
        model_usage = {}
        
        for request in requests:
            # Parse timestamp and extract date
            try:
                timestamp_str = request.get('timestamp')
                if isinstance(timestamp_str, str):
                    timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                else:
                    timestamp = timestamp_str
                
                date_key = timestamp.strftime('%Y-%m-%d')
                cost = request.get('estimated_cost', 0)
                model = request.get('model', 'unknown')
                
                # Daily spending
                daily_spending[date_key] = daily_spending.get(date_key, 0) + cost
                
                # Model usage
                if model not in model_usage:
                    model_usage[model] = {'count': 0, 'total_cost': 0}
                model_usage[model]['count'] += 1
                model_usage[model]['total_cost'] += cost
                
            except Exception as e:
                print(f"Error parsing request timestamp: {e}")
                continue
        
        # Determine cost trend
        daily_values = list(daily_spending.values())
        if len(daily_values) < 2:
            cost_trend = 'insufficient_data'
        elif daily_values[-1] > daily_values[-2]:
            cost_trend = 'increasing'
        elif daily_values[-1] < daily_values[-2]:
            cost_trend = 'decreasing'
        else:
            cost_trend = 'stable'
        
        return {
            'daily_breakdown': daily_spending,
            'model_usage': model_usage,
            'cost_trend': cost_trend,
            'total_requests': len(requests)
        }
    
    def _generate_budget_recommendations(self, budget_used_pct: float, days_left: int, current_cost: float) -> List[str]:
        """Generate budget management recommendations"""
        recommendations = []
        
        if budget_used_pct >= 100:
            recommendations.extend([
                "🚨 Budget exceeded - all API requests are blocked",
                "Consider increasing weekly budget or wait for next week",
                "Review usage patterns to optimize future spending",
                "Use cached responses where possible"
            ])
        elif budget_used_pct >= 80:
            recommendations.extend([
                "⚠️ Approaching budget limit - use API calls sparingly",
                "Prioritize high-impact issues for remaining budget",
                "Consider dry-run mode for testing",
                f"Average daily spend: ${current_cost / max(7 - days_left, 1):.2f}"
            ])
        elif budget_used_pct >= 50:
            daily_rate = current_cost / max(7 - days_left, 1)
            projected_weekly = daily_rate * 7
            if projected_weekly > self.weekly_budget:
                recommendations.append(f"📊 Current rate (${daily_rate:.2f}/day) may exceed budget - consider optimization")
            recommendations.extend([
                "✅ Budget usage is moderate",
                "Monitor spending to stay within limits",
                "Consider batch processing for efficiency"
            ])
        else:
            recommendations.extend([
                "✅ Budget usage is healthy",
                "Good opportunity to analyze complex issues",
                "Consider using higher-quality models for important issues"
            ])
        
        return recommendations
    
    def _handle_budget_alerts(self, status: Dict[str, Any]) -> None:
        """Handle budget alerts and notifications"""
        budget_used_pct = status['budget_used_pct']
        
        if budget_used_pct >= 100:
            self._create_budget_alert('BUDGET_EXCEEDED', status)
        elif budget_used_pct >= 80:
            self._create_budget_alert('BUDGET_WARNING', status)
        elif budget_used_pct >= 50:
            # Optional: create info alert for monitoring
            pass
    
    def _create_budget_alert(self, alert_type: str, status: Dict[str, Any]) -> None:
        """Create budget alert file and log"""
        alert_dir = self.perplexity_dir / 'alerts'
        alert_dir.mkdir(exist_ok=True)
        
        alert_file = alert_dir / f"{alert_type.lower()}_{status['week_key']}.json"
        
        alert_data = {
            'alert_type': alert_type,
            'timestamp': status['timestamp'],
            'week_key': status['week_key'],
            'budget_used_pct': status['budget_used_pct'],
            'current_cost': status['current_cost'],
            'weekly_budget': status['weekly_budget'],
            'request_count': status['request_count'],
            'recommendations': status['recommendations']
        }
        
        try:
            with open(alert_file, 'w') as f:
                json.dump(alert_data, f, indent=2)
            
            print(f"🚨 Created {alert_type} alert: {alert_file}")
        except Exception as e:
            print(f"Failed to create alert file: {e}")
    
    def reset_weekly_budget(self, week_key: Optional[str] = None, confirm: bool = False) -> Dict[str, Any]:
        """Reset budget for specified week (dangerous operation)"""
        if not confirm:
            return {
                'success': False,
                'error': 'Reset operation requires confirmation (--confirm flag)'
            }
        
        if week_key is None:
            week_key = self.budget_manager._get_current_week_key()
        
        ledger = self.budget_manager._load_ledger()
        
        if week_key in ledger:
            backup_data = ledger[week_key].copy()
            del ledger[week_key]
            
            # Save updated ledger
            self.budget_manager._save_ledger(ledger)
            
            # Remove budget lock if it exists
            self.budget_manager.budget_lock_path.unlink(missing_ok=True)
            
            # Create backup
            backup_dir = self.perplexity_dir / 'backups'
            backup_dir.mkdir(exist_ok=True)
            backup_file = backup_dir / f"budget_reset_{week_key}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            
            with open(backup_file, 'w') as f:
                json.dump(backup_data, f, indent=2)
            
            return {
                'success': True,
                'message': f'Reset budget for week {week_key}',
                'backup_file': str(backup_file),
                'reset_data': backup_data
            }
        else:
            return {
                'success': False,
                'error': f'No budget data found for week {week_key}'
            }
    
    def generate_budget_report(self, weeks: int = 4) -> Dict[str, Any]:
        """Generate comprehensive budget report for recent weeks"""
        ledger = self.budget_manager._load_ledger()
        current_week_key = self.budget_manager._get_current_week_key()
        
        # Get recent weeks
        now = datetime.now()
        week_keys = []
        for i in range(weeks):
            week_date = now - timedelta(weeks=i)
            year, week_num, _ = week_date.isocalendar()
            week_key = f"{year}-W{week_num:02d}"
            week_keys.append(week_key)
        
        # Analyze each week
        weekly_data = {}
        total_cost = 0
        total_requests = 0
        
        for week_key in week_keys:
            if week_key in ledger:
                week_data = ledger[week_key]
                weekly_data[week_key] = {
                    'total_cost': week_data.get('total_cost', 0),
                    'request_count': week_data.get('request_count', 0),
                    'avg_cost_per_request': week_data.get('total_cost', 0) / max(week_data.get('request_count', 1), 1),
                    'budget_used_pct': (week_data.get('total_cost', 0) / self.weekly_budget) * 100,
                    'is_current_week': week_key == current_week_key
                }
                total_cost += week_data.get('total_cost', 0)
                total_requests += week_data.get('request_count', 0)
            else:
                weekly_data[week_key] = {
                    'total_cost': 0,
                    'request_count': 0,
                    'avg_cost_per_request': 0,
                    'budget_used_pct': 0,
                    'is_current_week': week_key == current_week_key
                }
        
        report = {
            'report_timestamp': datetime.now().isoformat(),
            'weeks_analyzed': weeks,
            'current_week': current_week_key,
            'weekly_budget': self.weekly_budget,
            'summary': {
                'total_cost_period': total_cost,
                'total_requests_period': total_requests,
                'avg_cost_per_week': total_cost / weeks,
                'avg_requests_per_week': total_requests / weeks,
                'avg_cost_per_request': total_cost / max(total_requests, 1)
            },
            'weekly_breakdown': weekly_data,
            'current_status': self.check_budget_status(dry_run=True)
        }
        
        return report
    
    def generate_monitoring_comment(self, detailed_status: Dict[str, Any]) -> str:
        """Generate monitoring comment for GitHub"""
        status = detailed_status['budget_status']
        cost = detailed_status['current_cost']
        budget = detailed_status['weekly_budget']
        pct = detailed_status['budget_used_pct']
        
        # Status emoji
        status_emoji = {
            'BUDGET_OK': '✅',
            'BUDGET_WARNING': '⚠️',
            'BUDGET_EXCEEDED': '🚨'
        }.get(status, '❓')
        
        comment = f"""## {status_emoji} Perplexity API Budget Monitor

**Week**: {detailed_status['week_key']} (Day {7 - detailed_status['days_left_in_week'] + 1}/7)

**Budget Status**: {status}
- **Used**: ${cost:.2f} / ${budget:.2f} ({pct:.1f}%)
- **Remaining**: ${detailed_status['remaining_budget']:.2f}
- **Requests**: {detailed_status['request_count']} (avg: ${detailed_status['avg_cost_per_request']:.3f}/request)
- **Est. Remaining Requests**: ~{detailed_status['estimated_remaining_requests']}

### 📊 Weekly Analysis
**Cost Trend**: {detailed_status['weekly_analysis']['cost_trend'].replace('_', ' ').title()}
**Daily Spending**:"""

        for date, cost in detailed_status['weekly_analysis']['daily_breakdown'].items():
            comment += f"\n- {date}: ${cost:.3f}"
        
        comment += f"\n\n**Model Usage**:"
        for model, usage in detailed_status['weekly_analysis']['model_usage'].items():
            comment += f"\n- {model}: {usage['count']} requests (${usage['total_cost']:.3f})"
        
        comment += "\n\n### 💡 Recommendations"
        for rec in detailed_status['recommendations']:
            comment += f"\n- {rec}"
        
        comment += f"""

### 🔒 Budget Controls
- **Budget Lock**: {"🔒 Active" if detailed_status['budget_lock_exists'] else "🔓 Not Active"}
- **API Requests**: {"❌ Blocked" if not detailed_status['allow_requests'] else "✅ Allowed"}

---
*Budget monitoring updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*
*Weekly budget resets every Monday*"""
        
        return comment


def main():
    parser = argparse.ArgumentParser(description='Cost Monitor for Perplexity API Integration')
    parser.add_argument('--check-budget', action='store_true', help='Check current budget status')
    parser.add_argument('--dry-run', action='store_true', help='Run without creating alerts')
    parser.add_argument('--reset-budget', action='store_true', help='Reset weekly budget (requires --confirm)')
    parser.add_argument('--week', help='Specify week for reset (format: 2024-W03)')
    parser.add_argument('--confirm', action='store_true', help='Confirm destructive operations')
    parser.add_argument('--report', action='store_true', help='Generate comprehensive budget report')
    parser.add_argument('--weeks', type=int, default=4, help='Number of weeks for report')
    parser.add_argument('--output-file', help='Save results to JSON file')
    parser.add_argument('--comment', action='store_true', help='Generate monitoring comment format')
    
    args = parser.parse_args()
    
    try:
        # Initialize cost monitor
        monitor = CostMonitor()
        
        if args.reset_budget:
            # Reset budget operation
            if not args.confirm:
                print("❌ Budget reset requires --confirm flag")
                print("This operation will delete spending data and remove budget locks")
                sys.exit(1)
            
            result = monitor.reset_weekly_budget(args.week, confirm=args.confirm)
            print("💰 Budget Reset Results:")
            print(json.dumps(result, indent=2, default=str))
        
        elif args.report:
            # Generate comprehensive report
            report = monitor.generate_budget_report(weeks=args.weeks)
            print("📊 Budget Report:")
            print(json.dumps(report, indent=2, default=str))
            result = report
        
        else:
            # Default: check budget status
            result = monitor.check_budget_status(dry_run=args.dry_run)
            
            if args.comment:
                comment_text = monitor.generate_monitoring_comment(result)
                print("\n" + "="*60)
                print("MONITORING COMMENT:")
                print("="*60)
                print(comment_text)
            else:
                print("💰 Budget Status:")
                print(json.dumps(result, indent=2, default=str))
        
        # Save to file if requested
        if args.output_file:
            with open(args.output_file, 'w') as f:
                json.dump(result, f, indent=2, default=str)
            print(f"\nResults saved to: {args.output_file}")
        
        # Set exit code based on budget status
        if isinstance(result, dict) and result.get('budget_status') == 'BUDGET_EXCEEDED':
            print("\n🚨 Budget exceeded - exiting with code 1")
            sys.exit(1)
        elif isinstance(result, dict) and result.get('budget_status') == 'BUDGET_WARNING':
            print("\n⚠️ Budget warning - exiting with code 0")
            sys.exit(0)
        else:
            sys.exit(0)
        
    except Exception as e:
        print(f"Error in cost monitoring: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()