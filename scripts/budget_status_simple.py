#!/usr/bin/env python3
"""
Simple budget status reporter for /perplexity-budget-check command

Provides a clean, readable output for the GitHub Actions workflow.
"""

import json
import sys
import subprocess
from pathlib import Path

def main():
    """Generate simple budget status output."""
    try:
        # Try to run the comprehensive budget_guard.py first
        try:
            result = subprocess.run(
                [sys.executable, 'scripts/budget_guard.py', '--dry-run', '--verbose'], 
                capture_output=True, text=True, cwd=Path(__file__).parent.parent
            )
            
            if result.returncode == 0:
                print("✅ Comprehensive Budget Analysis")
                print("=" * 50)
                print(result.stdout)
                print("\n" + "=" * 50)
                print("✅ Budget guard script executed successfully")
            else:
                raise subprocess.CalledProcessError(result.returncode, result.args)
                
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("⚠️ Budget guard script failed, using fallback method")
            print()
        
        # Get simple budget status
        result = subprocess.run(
            [sys.executable, 'scripts/perplexity_costs.py', 'budget'], 
            capture_output=True, text=True, cwd=Path(__file__).parent.parent
        )
        
        if result.returncode == 0:
            data = json.loads(result.stdout)
            
            print("\n📊 Quick Status Summary:")
            print("-" * 30)
            print(f'💰 Budget Status: {data["state"]}')
            print(f'💳 Used: ${data["used_amount"]} / ${data["weekly_budget"]}')
            print(f'📊 Usage: {data["usage_percentage"]}%')
            print(f'🗓️ Week: {data["iso_week"]}')
            status_emoji = "✅ All operations permitted" if data["can_proceed"] else "❌ Budget exceeded"
            print(f'⏰ Status: {status_emoji}')
            
            if data["usage_percentage"] > 70:
                print("\n⚠️  Budget Warning:")
                print("   Approaching weekly limit. Consider optimizing usage.")
            
        else:
            print("❌ Error getting budget status")
            print(f"Error output: {result.stderr}")
            
    except Exception as e:
        print(f'❌ Error running budget check: {e}')
        print('💰 Budget Status: UNKNOWN')
        print('📞 Please check budget system manually')
        sys.exit(1)

if __name__ == '__main__':
    main()