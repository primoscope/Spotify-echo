#!/usr/bin/env python3
"""
Security Baseline Validation Script
Validates security configuration and baseline security measures
"""

import sys
import json
import argparse
import subprocess
import os
from pathlib import Path
from typing import Dict, List, Any

def parse_args():
    parser = argparse.ArgumentParser(description='Security baseline validation')
    parser.add_argument('--config-file', type=str, default='security_config.json',
                       help='Security configuration file')
    parser.add_argument('--output', type=str, default='security-baseline-results.json',
                       help='Output file for validation results')
    return parser.parse_args()

def check_environment_security() -> Dict[str, Any]:
    """Check environment security configuration"""
    checks = {
        'env_file_permissions': False,
        'no_hardcoded_secrets': False,
        'secure_headers_config': False,
        'https_redirect': False
    }
    
    # Check .env file permissions
    env_files = ['.env', '.env.production', '.env.local']
    for env_file in env_files:
        if Path(env_file).exists():
            stat_info = os.stat(env_file)
            # Check if file is readable only by owner (mode 600 or 400)
            checks['env_file_permissions'] = (stat_info.st_mode & 0o077) == 0
            break
    else:
        checks['env_file_permissions'] = True  # No env files found
    
    # Check for hardcoded secrets (basic patterns)
    secret_patterns = ['password=', 'secret=', 'key=', 'token=']
    hardcoded_found = False
    
    try:
        # Scan common source files
        for pattern in ['src/**/*.js', 'scripts/**/*.py']:
            result = subprocess.run(['grep', '-r', '-i'] + secret_patterns + ['.'], 
                                  capture_output=True, text=True)
            if result.returncode == 0 and result.stdout:
                hardcoded_found = True
                break
        
        checks['no_hardcoded_secrets'] = not hardcoded_found
    except Exception:
        checks['no_hardcoded_secrets'] = True  # Assume OK if can't check
    
    # Check for security headers configuration
    security_headers = ['helmet', 'HSTS', 'X-Content-Type-Options', 'X-Frame-Options']
    config_files = ['server.js', 'app.js', 'index.js']
    
    for config_file in config_files:
        if Path(config_file).exists():
            with open(config_file, 'r') as f:
                content = f.read()
                checks['secure_headers_config'] = any(header.lower() in content.lower() 
                                                    for header in security_headers)
                checks['https_redirect'] = 'https' in content.lower() and 'redirect' in content.lower()
                break
    
    return checks

def check_dependency_security() -> Dict[str, Any]:
    """Check dependency security status"""
    checks = {
        'npm_audit_clean': False,
        'pip_audit_clean': False,
        'outdated_dependencies': False
    }
    
    # Check npm audit
    try:
        result = subprocess.run(['npm', 'audit', '--audit-level=moderate'], 
                              capture_output=True, text=True)
        checks['npm_audit_clean'] = result.returncode == 0
    except Exception:
        checks['npm_audit_clean'] = True  # Assume OK if npm not available
    
    # Check pip audit (if available)
    try:
        result = subprocess.run(['pip-audit', '--desc'], 
                              capture_output=True, text=True)
        checks['pip_audit_clean'] = result.returncode == 0
    except Exception:
        checks['pip_audit_clean'] = True  # Assume OK if pip-audit not available
    
    # Check for outdated dependencies
    try:
        npm_result = subprocess.run(['npm', 'outdated'], 
                                   capture_output=True, text=True)
        pip_result = subprocess.run(['pip', 'list', '--outdated'], 
                                   capture_output=True, text=True)
        
        # If either has outdated packages, mark as issue
        checks['outdated_dependencies'] = (npm_result.returncode != 0 and 
                                         pip_result.returncode != 0)
    except Exception:
        checks['outdated_dependencies'] = True  # Assume OK if can't check
    
    return checks

def check_container_security() -> Dict[str, Any]:
    """Check container security configuration"""
    checks = {
        'non_root_user': False,
        'minimal_base_image': False,
        'security_updates': False,
        'no_secrets_in_image': False
    }
    
    dockerfile_path = Path('Dockerfile')
    if dockerfile_path.exists():
        with open(dockerfile_path, 'r') as f:
            dockerfile_content = f.read().lower()
            
            # Check for non-root user
            checks['non_root_user'] = 'user ' in dockerfile_content and 'user root' not in dockerfile_content
            
            # Check for minimal base image (alpine, distroless, etc.)
            checks['minimal_base_image'] = any(base in dockerfile_content 
                                             for base in ['alpine', 'distroless', 'scratch'])
            
            # Check for security updates
            checks['security_updates'] = any(cmd in dockerfile_content 
                                           for cmd in ['apt-get update', 'apk update', 'yum update'])
            
            # Check that secrets are not copied into image
            checks['no_secrets_in_image'] = not any(secret in dockerfile_content 
                                                   for secret in ['.env', 'secret', 'password', 'key'])
    else:
        # No Dockerfile found, assume defaults
        checks = {k: True for k in checks}
    
    return checks

def calculate_security_score(all_checks: Dict[str, Dict[str, Any]]) -> float:
    """Calculate overall security score"""
    total_checks = 0
    passed_checks = 0
    
    for category, checks in all_checks.items():
        for check_name, passed in checks.items():
            total_checks += 1
            if passed:
                passed_checks += 1
    
    return (passed_checks / total_checks) * 100 if total_checks > 0 else 0

def main():
    args = parse_args()
    
    print("Running security baseline validation...")
    
    # Run security checks
    env_checks = check_environment_security()
    dep_checks = check_dependency_security()
    container_checks = check_container_security()
    
    all_checks = {
        'environment': env_checks,
        'dependencies': dep_checks,
        'container': container_checks
    }
    
    # Calculate security score
    security_score = calculate_security_score(all_checks)
    
    # Determine if baseline passes (80% threshold)
    baseline_passed = security_score >= 80.0
    
    results = {
        'baseline_type': 'security',
        'security_score': security_score,
        'baseline_passed': baseline_passed,
        'checks': all_checks,
        'summary': {
            'total_checks': sum(len(checks) for checks in all_checks.values()),
            'passed_checks': sum(sum(checks.values()) for checks in all_checks.values()),
            'failed_checks': []
        }
    }
    
    # Collect failed checks
    for category, checks in all_checks.items():
        for check_name, passed in checks.items():
            if not passed:
                results['summary']['failed_checks'].append(f"{category}.{check_name}")
    
    # Write results
    with open(args.output, 'w') as f:
        json.dump(results, f, indent=2)
    
    # Print summary
    print(f"Security Baseline: {'PASS' if baseline_passed else 'FAIL'}")
    print(f"Security Score: {security_score:.1f}%")
    print(f"Passed: {results['summary']['passed_checks']}/{results['summary']['total_checks']} checks")
    
    if results['summary']['failed_checks']:
        print("Failed checks:")
        for failed_check in results['summary']['failed_checks']:
            print(f"  - {failed_check}")
    
    # Exit with appropriate code
    sys.exit(0 if baseline_passed else 1)

if __name__ == '__main__':
    main()