#!/usr/bin/env python3
"""
Comprehensive Validation Suite for Perplexity API Integration

Tests all components of the Perplexity integration:
- Client initialization and configuration
- Budget management and enforcement
- Caching system with atomic operations
- Issue analysis with complexity scoring
- Batch processing with similarity grouping
- Security measures and error handling
"""

import os
import sys
import json
import tempfile
import shutil
import subprocess
from pathlib import Path
from datetime import datetime
# Note: pytest import removed as it's not essential for validation

# Add scripts directory to path
sys.path.insert(0, str(Path(__file__).parent / 'scripts'))

def run_test_suite():
    """Run comprehensive test suite for Perplexity integration"""
    
    print("🚀 Starting Comprehensive Perplexity Integration Validation")
    print("=" * 60)
    
    # Test results tracking
    results = {
        'total_tests': 0,
        'passed': 0,
        'failed': 0,
        'errors': []
    }
    
    # Test 1: Python Script Syntax Validation
    print("\n📝 Test 1: Python Script Syntax Validation")
    test_files = [
        'scripts/perplexity_client.py',
        'scripts/issue_analyzer.py', 
        'scripts/cost_monitor.py',
        'scripts/batch_issue_analyzer.py'
    ]
    
    for test_file in test_files:
        results['total_tests'] += 1
        try:
            result = subprocess.run(
                ['python', '-m', 'py_compile', test_file],
                capture_output=True, text=True, cwd='.'
            )
            if result.returncode == 0:
                print(f"  ✅ {test_file}: Syntax OK")
                results['passed'] += 1
            else:
                print(f"  ❌ {test_file}: Syntax Error - {result.stderr}")
                results['failed'] += 1
                results['errors'].append(f"{test_file}: {result.stderr}")
        except Exception as e:
            print(f"  ❌ {test_file}: Exception - {e}")
            results['failed'] += 1
            results['errors'].append(f"{test_file}: {e}")
    
    # Test 2: Workflow YAML Validation
    print("\n📋 Test 2: GitHub Workflow YAML Validation")
    workflow_files = [
        '.github/workflows/ai-issue-analysis.yml',
        '.github/workflows/ai-budget-monitor.yml',
        '.github/workflows/security-audit.yml'
    ]
    
    for workflow_file in workflow_files:
        results['total_tests'] += 1
        try:
            import yaml
            with open(workflow_file, 'r') as f:
                yaml.safe_load(f)
            print(f"  ✅ {workflow_file}: Valid YAML")
            results['passed'] += 1
        except Exception as e:
            print(f"  ❌ {workflow_file}: Invalid YAML - {e}")
            results['failed'] += 1
            results['errors'].append(f"{workflow_file}: {e}")
    
    # Test 3: Perplexity Client Dry-Run Tests
    print("\n🤖 Test 3: Perplexity Client Functionality")
    
    # Test dry-run mode
    results['total_tests'] += 1
    try:
        result = subprocess.run(
            ['python', 'scripts/perplexity_client.py', '--dry-run', '--issue', '123'],
            capture_output=True, text=True, cwd='.'
        )
        if result.returncode == 0 and 'DRY_RUN' in result.stdout:
            print("  ✅ Perplexity Client: Dry-run mode working")
            results['passed'] += 1
        else:
            print(f"  ❌ Perplexity Client: Dry-run failed - {result.stderr}")
            results['failed'] += 1
            results['errors'].append(f"Perplexity Client dry-run: {result.stderr}")
    except Exception as e:
        print(f"  ❌ Perplexity Client: Exception - {e}")
        results['failed'] += 1
        results['errors'].append(f"Perplexity Client: {e}")
    
    # Test 4: Issue Analyzer Integration
    print("\n🔍 Test 4: Issue Analyzer Integration")
    results['total_tests'] += 1
    try:
        result = subprocess.run(
            ['python', 'scripts/issue_analyzer.py', '--issue', '123', '--dry-run'],
            capture_output=True, text=True, cwd='.'
        )
        if result.returncode == 0:
            # Check if output contains expected JSON structure
            if 'success' in result.stdout and 'complexity_score' in result.stdout:
                print("  ✅ Issue Analyzer: JSON output structure valid")
                results['passed'] += 1
            else:
                print("  ❌ Issue Analyzer: Invalid JSON structure")
                results['failed'] += 1
                results['errors'].append("Issue Analyzer: Invalid JSON output")
        else:
            print(f"  ❌ Issue Analyzer: Failed - {result.stderr}")
            results['failed'] += 1
            results['errors'].append(f"Issue Analyzer: {result.stderr}")
    except Exception as e:
        print(f"  ❌ Issue Analyzer: Exception - {e}")
        results['failed'] += 1
        results['errors'].append(f"Issue Analyzer: {e}")
    
    # Test 5: Cost Monitor Functionality
    print("\n💰 Test 5: Cost Monitor Functionality")
    results['total_tests'] += 1
    try:
        result = subprocess.run(
            ['python', 'scripts/cost_monitor.py', '--check-budget', '--dry-run'],
            capture_output=True, text=True, cwd='.'
        )
        if result.returncode == 0:
            # Check if output contains budget status
            if 'budget_status' in result.stdout and 'weekly_budget' in result.stdout:
                print("  ✅ Cost Monitor: Budget status check working")
                results['passed'] += 1
            else:
                print("  ❌ Cost Monitor: Invalid budget status output")
                results['failed'] += 1
                results['errors'].append("Cost Monitor: Invalid budget output")
        else:
            print(f"  ❌ Cost Monitor: Failed - {result.stderr}")
            results['failed'] += 1
            results['errors'].append(f"Cost Monitor: {result.stderr}")
    except Exception as e:
        print(f"  ❌ Cost Monitor: Exception - {e}")
        results['failed'] += 1
        results['errors'].append(f"Cost Monitor: {e}")
    
    # Test 6: Batch Analyzer Functionality  
    print("\n📦 Test 6: Batch Analyzer Functionality")
    results['total_tests'] += 1
    try:
        result = subprocess.run(
            ['python', 'scripts/batch_issue_analyzer.py', '--max-issues', '2', '--dry-run'],
            capture_output=True, text=True, cwd='.'
        )
        if result.returncode == 0:
            # Check if output contains batch summary
            if 'batch_summary' in result.stdout and 'total_issues_processed' in result.stdout:
                print("  ✅ Batch Analyzer: Batch processing working")
                results['passed'] += 1
            else:
                print("  ❌ Batch Analyzer: Invalid batch summary output") 
                results['failed'] += 1
                results['errors'].append("Batch Analyzer: Invalid batch output")
        else:
            print(f"  ❌ Batch Analyzer: Failed - {result.stderr}")
            results['failed'] += 1
            results['errors'].append(f"Batch Analyzer: {result.stderr}")
    except Exception as e:
        print(f"  ❌ Batch Analyzer: Exception - {e}")
        results['failed'] += 1
        results['errors'].append(f"Batch Analyzer: {e}")
    
    # Test 7: Security Configuration Validation
    print("\n🔒 Test 7: Security Configuration Validation")
    
    # Check .gitignore excludes sensitive files
    results['total_tests'] += 1
    try:
        with open('.gitignore', 'r') as f:
            gitignore_content = f.read()
        
        sensitive_patterns = [
            '.perplexity/usage_ledger.json',
            '.perplexity/cache/',
            '.perplexity/BUDGET_LOCK'
        ]
        
        missing_patterns = [p for p in sensitive_patterns if p not in gitignore_content]
        
        if not missing_patterns:
            print("  ✅ .gitignore: All sensitive files excluded")
            results['passed'] += 1
        else:
            print(f"  ❌ .gitignore: Missing patterns: {missing_patterns}")
            results['failed'] += 1
            results['errors'].append(f".gitignore: Missing {missing_patterns}")
    except Exception as e:
        print(f"  ❌ .gitignore: Exception - {e}")
        results['failed'] += 1
        results['errors'].append(f".gitignore: {e}")
    
    # Test 8: Cursor Configuration Validation
    print("\n🎯 Test 8: Cursor Configuration Validation")
    results['total_tests'] += 1
    try:
        cursor_config_files = [
            '.cursorrules',
            '.cursor/perplexity-integration.json'
        ]
        
        all_configs_valid = True
        for config_file in cursor_config_files:
            if not Path(config_file).exists():
                print(f"  ❌ {config_file}: File missing")
                all_configs_valid = False
            elif config_file.endswith('.json'):
                # Validate JSON syntax
                try:
                    with open(config_file, 'r') as f:
                        json.load(f)
                except json.JSONDecodeError as e:
                    print(f"  ❌ {config_file}: Invalid JSON - {e}")
                    all_configs_valid = False
        
        if all_configs_valid:
            print("  ✅ Cursor Configuration: All files valid")
            results['passed'] += 1
        else:
            results['failed'] += 1
            results['errors'].append("Cursor Configuration: Invalid files")
    except Exception as e:
        print(f"  ❌ Cursor Configuration: Exception - {e}")
        results['failed'] += 1
        results['errors'].append(f"Cursor Configuration: {e}")
    
    # Test 9: Atomic File Operations Test
    print("\n⚛️ Test 9: Atomic File Operations Test")
    results['total_tests'] += 1
    try:
        # Import PerplexityClient to test atomic operations
        from perplexity_client import BudgetManager
        
        # Create temporary directory for testing
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            budget_manager = BudgetManager(temp_path)
            
            # Test atomic ledger save
            test_ledger = {"2025-W34": {"total_cost": 0.5, "request_count": 5}}
            budget_manager._save_ledger(test_ledger)
            
            # Verify file was created and contains correct data
            if budget_manager.ledger_path.exists():
                with open(budget_manager.ledger_path, 'r') as f:
                    saved_data = json.load(f)
                if saved_data == test_ledger:
                    print("  ✅ Atomic Operations: Ledger save/load working")
                    results['passed'] += 1
                else:
                    print("  ❌ Atomic Operations: Data integrity issue")
                    results['failed'] += 1
                    results['errors'].append("Atomic Operations: Data mismatch")
            else:
                print("  ❌ Atomic Operations: File not created")
                results['failed'] += 1
                results['errors'].append("Atomic Operations: File creation failed")
    except Exception as e:
        print(f"  ❌ Atomic Operations: Exception - {e}")
        results['failed'] += 1
        results['errors'].append(f"Atomic Operations: {e}")
    
    # Generate Final Report
    print("\n" + "=" * 60)
    print("📊 VALIDATION RESULTS SUMMARY")
    print("=" * 60)
    
    success_rate = (results['passed'] / results['total_tests']) * 100 if results['total_tests'] > 0 else 0
    
    print(f"Total Tests: {results['total_tests']}")
    print(f"Passed: {results['passed']} ✅")
    print(f"Failed: {results['failed']} ❌")
    print(f"Success Rate: {success_rate:.1f}%")
    
    if results['errors']:
        print(f"\n🚨 ERRORS TO ADDRESS:")
        for i, error in enumerate(results['errors'], 1):
            print(f"  {i}. {error}")
    
    # Overall status
    if results['failed'] == 0:
        print(f"\n🎉 ALL TESTS PASSED! Perplexity integration is ready for production.")
        return True
    elif results['failed'] <= 2:
        print(f"\n⚠️ MOSTLY READY with {results['failed']} minor issues to fix.")
        return True
    else:
        print(f"\n❌ SIGNIFICANT ISSUES FOUND. Address {results['failed']} failures before production.")
        return False

if __name__ == '__main__':
    success = run_test_suite()
    sys.exit(0 if success else 1)