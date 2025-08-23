#!/usr/bin/env python3
"""
Unit Tests for Perplexity Cost Management System

Tests core functionality of the cost estimation, budget tracking,
and threshold logic systems.
"""

import unittest
import json
import tempfile
import os
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

# Add scripts directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from perplexity_costs import PerplexityCostManager


class TestPerplexityCostManager(unittest.TestCase):
    """Test cases for PerplexityCostManager."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Create temporary directory for test files
        self.temp_dir = tempfile.mkdtemp()
        self.config_file = Path(self.temp_dir) / 'test-config.yml'
        self.usage_log = Path(self.temp_dir) / 'usage.json'
        
        # Create test configuration
        test_config = """
weekly_budget_usd: 3.00
warn_threshold_pct: 70
hard_stop_threshold_pct: 100
default_model: sonar

model_policies:
  - name: sonar
    use_for: [simple]
    input_cost_per_million: 1.00
    output_cost_per_million: 1.00
    max_tokens: 4096
    
  - name: sonar-reasoning
    use_for: [moderate]
    input_cost_per_million: 1.00
    output_cost_per_million: 5.00
    max_tokens: 8192
    
  - name: sonar-pro
    use_for: [complex]
    input_cost_per_million: 3.00
    output_cost_per_million: 15.00
    max_tokens: 16384

search_query_cost_per_thousand: 5.00

logging:
  usage_log_file: {}
""".format(str(self.usage_log))
        
        with open(self.config_file, 'w') as f:
            f.write(test_config)
        
        # Initialize cost manager
        self.cost_manager = PerplexityCostManager(str(self.config_file))
    
    def tearDown(self):
        """Clean up test fixtures."""
        import shutil
        shutil.rmtree(self.temp_dir)
    
    def test_cost_estimation_sonar(self):
        """Test cost estimation for sonar model."""
        cost = self.cost_manager.estimate_cost(
            tokens_in=1000,
            tokens_out=500,
            search_queries=2,
            model='sonar'
        )
        
        # Expected: (1000/1M * 1.00) + (500/1M * 1.00) + (2/1000 * 5.00)
        # = 0.001 + 0.0005 + 0.01 = 0.0115
        expected_cost = 0.0115
        self.assertAlmostEqual(cost, expected_cost, places=4)
    
    def test_cost_estimation_sonar_reasoning(self):
        """Test cost estimation for sonar-reasoning model."""
        cost = self.cost_manager.estimate_cost(
            tokens_in=2000,
            tokens_out=1000,
            search_queries=1,
            model='sonar-reasoning'
        )
        
        # Expected: (2000/1M * 1.00) + (1000/1M * 5.00) + (1/1000 * 5.00)
        # = 0.002 + 0.005 + 0.005 = 0.012
        expected_cost = 0.012
        self.assertAlmostEqual(cost, expected_cost, places=4)
    
    def test_cost_estimation_sonar_pro(self):
        """Test cost estimation for sonar-pro model."""
        cost = self.cost_manager.estimate_cost(
            tokens_in=1000,
            tokens_out=2000,
            search_queries=3,
            model='sonar-pro'
        )
        
        # Expected: (1000/1M * 3.00) + (2000/1M * 15.00) + (3/1000 * 5.00)
        # = 0.003 + 0.03 + 0.015 = 0.048
        expected_cost = 0.048
        self.assertAlmostEqual(cost, expected_cost, places=4)
    
    def test_cost_estimation_unknown_model(self):
        """Test cost estimation with unknown model defaults to sonar."""
        cost = self.cost_manager.estimate_cost(
            tokens_in=1000,
            tokens_out=500,
            search_queries=0,
            model='unknown-model'
        )
        
        # Should default to sonar model pricing
        expected_cost = 0.0015  # (1000 + 500) / 1M * 1.00
        self.assertAlmostEqual(cost, expected_cost, places=4)
    
    def test_usage_logging(self):
        """Test usage logging functionality."""
        # Log some usage
        cost1 = self.cost_manager.update_usage_log(
            tokens_in=1000,
            tokens_out=500,
            search_queries=1,
            model='sonar',
            issue_number=123,
            cached=False
        )
        
        cost2 = self.cost_manager.update_usage_log(
            tokens_in=500,
            tokens_out=250,
            search_queries=0,
            model='sonar',
            issue_number=124,
            cached=True  # Should be 0 cost
        )
        
        # Check log file exists and has correct entries
        self.assertTrue(self.usage_log.exists())
        
        with open(self.usage_log, 'r') as f:
            log_data = json.load(f)
        
        self.assertEqual(len(log_data), 2)
        
        # Check first entry
        entry1 = log_data[0]
        self.assertEqual(entry1['tokens_in'], 1000)
        self.assertEqual(entry1['tokens_out'], 500)
        self.assertEqual(entry1['issue_number'], 123)
        self.assertEqual(entry1['model'], 'sonar')
        self.assertFalse(entry1['cached'])
        self.assertGreater(entry1['estimated_cost_usd'], 0)
        
        # Check second entry (cached)
        entry2 = log_data[1]
        self.assertEqual(entry2['estimated_cost_usd'], 0.0)
        self.assertTrue(entry2['cached'])
        
        # Check returned costs
        self.assertGreater(cost1, 0)
        self.assertEqual(cost2, 0.0)
    
    def test_iso_week_generation(self):
        """Test ISO week string generation."""
        # Test specific date
        test_date = datetime(2024, 1, 15, tzinfo=timezone.utc)  # Monday of week 3
        iso_week = self.cost_manager.get_iso_week(test_date)
        self.assertEqual(iso_week, "2024-W03")
        
        # Test current week
        current_iso_week = self.cost_manager.get_iso_week()
        self.assertRegex(current_iso_week, r'^\d{4}-W\d{2}$')
    
    def test_weekly_usage_calculation(self):
        """Test weekly usage statistics calculation."""
        # Create usage entries for current week
        current_week = self.cost_manager.get_iso_week()
        
        # Create initial log with mixed weeks
        initial_log = [
            {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'iso_week': current_week,
                'model': 'sonar',
                'tokens_in': 1000,
                'tokens_out': 500,
                'search_queries': 1,
                'estimated_cost_usd': 0.0065,
                'cached': False,
                'issue_number': 1
            },
            {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'iso_week': current_week,
                'model': 'sonar-reasoning',
                'tokens_in': 2000,
                'tokens_out': 1000,
                'search_queries': 2,
                'estimated_cost_usd': 0.017,
                'cached': False,
                'issue_number': 2
            },
            {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'iso_week': current_week,
                'model': 'sonar',
                'tokens_in': 0,
                'tokens_out': 0,
                'search_queries': 0,
                'estimated_cost_usd': 0.0,
                'cached': True,
                'issue_number': 3
            },
            {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'iso_week': '2024-W01',  # Different week
                'model': 'sonar',
                'tokens_in': 5000,
                'tokens_out': 2500,
                'search_queries': 3,
                'estimated_cost_usd': 0.022,
                'cached': False,
                'issue_number': 4
            }
        ]
        
        with open(self.usage_log, 'w') as f:
            json.dump(initial_log, f)
        
        # Get weekly usage for current week
        usage = self.cost_manager.get_weekly_usage(current_week)
        
        self.assertEqual(usage['iso_week'], current_week)
        self.assertEqual(usage['total_requests'], 3)  # Only current week
        self.assertEqual(usage['cached_requests'], 1)
        self.assertAlmostEqual(usage['cache_hit_rate'], 33.3, places=1)
        self.assertAlmostEqual(usage['total_cost'], 0.0235, places=4)  # 0.0065 + 0.017
        
        # Check models used
        self.assertIn('sonar', usage['models_used'])
        self.assertIn('sonar-reasoning', usage['models_used'])
        self.assertEqual(usage['models_used']['sonar']['count'], 2)  # 1 regular + 1 cached
        self.assertEqual(usage['models_used']['sonar-reasoning']['count'], 1)
    
    def test_remaining_budget_calculations(self):
        """Test budget calculations and threshold logic."""
        current_week = self.cost_manager.get_iso_week()
        
        # Test with no usage
        budget = self.cost_manager.remaining_budget(current_week)
        
        self.assertEqual(budget['weekly_budget'], 3.0)
        self.assertEqual(budget['used_amount'], 0.0)
        self.assertEqual(budget['remaining_amount'], 3.0)
        self.assertEqual(budget['usage_percentage'], 0.0)
        self.assertEqual(budget['state'], 'OK')
        self.assertTrue(budget['can_proceed'])
        
        # Add usage to reach warning threshold (70% of $3.00 = $2.10)
        warning_log = [
            {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'iso_week': current_week,
                'model': 'sonar',
                'tokens_in': 2200000,
                'tokens_out': 0,
                'search_queries': 0,
                'estimated_cost_usd': 2.20,  # Over warning threshold
                'cached': False,
                'issue_number': 1
            }
        ]
        
        with open(self.usage_log, 'w') as f:
            json.dump(warning_log, f)
        
        budget = self.cost_manager.remaining_budget(current_week)
        
        self.assertEqual(budget['state'], 'WARNING')
        self.assertTrue(budget['can_proceed'])
        self.assertAlmostEqual(budget['used_amount'], 2.20, places=2)
        self.assertAlmostEqual(budget['remaining_amount'], 0.80, places=2)
        
        # Add more usage to reach hard stop (100% of $3.00)
        hard_stop_log = [
            {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'iso_week': current_week,
                'model': 'sonar',
                'tokens_in': 3100000,
                'tokens_out': 0,
                'search_queries': 0,
                'estimated_cost_usd': 3.10,  # Over hard stop
                'cached': False,
                'issue_number': 1
            }
        ]
        
        with open(self.usage_log, 'w') as f:
            json.dump(hard_stop_log, f)
        
        budget = self.cost_manager.remaining_budget(current_week)
        
        self.assertEqual(budget['state'], 'HARD_STOP')
        self.assertFalse(budget['can_proceed'])
    
    def test_should_abort_logic(self):
        """Test should abort logic for projected costs."""
        current_week = self.cost_manager.get_iso_week()
        
        # Test with healthy budget - should not abort
        should_abort, reason = self.cost_manager.should_abort(0.50, current_week)
        self.assertFalse(should_abort)
        self.assertEqual(reason, "Budget OK")
        
        # Add usage to approach limit
        high_usage_log = [
            {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'iso_week': current_week,
                'model': 'sonar',
                'tokens_in': 2800000,
                'tokens_out': 0,
                'search_queries': 0,
                'estimated_cost_usd': 2.80,  # High usage
                'cached': False,
                'issue_number': 1
            }
        ]
        
        with open(self.usage_log, 'w') as f:
            json.dump(high_usage_log, f)
        
        # Test projection that would exceed budget
        should_abort, reason = self.cost_manager.should_abort(0.50, current_week)
        self.assertTrue(should_abort)
        self.assertIn("would exceed hard threshold", reason)
        
        # Test with already exceeded budget
        exceeded_log = [
            {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'iso_week': current_week,
                'model': 'sonar',
                'tokens_in': 3100000,
                'tokens_out': 0,
                'search_queries': 0,
                'estimated_cost_usd': 3.10,  # Exceeded
                'cached': False,
                'issue_number': 1
            }
        ]
        
        with open(self.usage_log, 'w') as f:
            json.dump(exceeded_log, f)
        
        should_abort, reason = self.cost_manager.should_abort(0.10, current_week)
        self.assertTrue(should_abort)
        self.assertIn("Weekly budget exceeded", reason)
    
    def test_cleanup_old_entries(self):
        """Test cleanup of old log entries."""
        current_week = self.cost_manager.get_iso_week()
        old_date = datetime.now(timezone.utc) - timedelta(weeks=15)
        old_week = self.cost_manager.get_iso_week(old_date)
        
        # Create log with old and new entries
        mixed_log = [
            {
                'timestamp': old_date.isoformat(),
                'iso_week': old_week,
                'model': 'sonar',
                'tokens_in': 1000000,
                'tokens_out': 0,
                'search_queries': 0,
                'estimated_cost_usd': 1.00,
                'cached': False,
                'issue_number': 1
            },
            {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'iso_week': current_week,
                'model': 'sonar',
                'tokens_in': 500000,
                'tokens_out': 0,
                'search_queries': 0,
                'estimated_cost_usd': 0.50,
                'cached': False,
                'issue_number': 2
            }
        ]
        
        with open(self.usage_log, 'w') as f:
            json.dump(mixed_log, f)
        
        # Cleanup with 12 week retention
        removed_count = self.cost_manager.cleanup_old_entries(12)
        
        self.assertEqual(removed_count, 1)  # Should remove old entry
        
        # Verify remaining entries
        with open(self.usage_log, 'r') as f:
            remaining_log = json.load(f)
        
        self.assertEqual(len(remaining_log), 1)
        self.assertEqual(remaining_log[0]['iso_week'], current_week)


if __name__ == '__main__':
    # Create test runner with more verbose output
    unittest.main(verbosity=2)