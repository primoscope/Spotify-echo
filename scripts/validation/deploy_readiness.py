#!/usr/bin/env python3
"""
Deploy Readiness Validation Script
Validates application readiness for deployment
"""

import sys
import json
import argparse
import subprocess
import requests
import time
from pathlib import Path
from typing import Dict, List, Any

def parse_args():
    parser = argparse.ArgumentParser(description='Deploy readiness validation')
    parser.add_argument('--environment', type=str, default='staging',
                       choices=['development', 'staging', 'production'],
                       help='Target deployment environment')
    parser.add_argument('--config-file', type=str, default='deploy_config.json',
                       help='Deployment configuration file')
    parser.add_argument('--output', type=str, default='deploy-readiness-results.json',
                       help='Output file for validation results')
    return parser.parse_args()

def check_build_artifacts() -> Dict[str, Any]:
    """Check if build artifacts are present and valid"""
    checks = {
        'build_directory_exists': False,
        'package_json_valid': False,
        'dependencies_installed': False,
        'build_size_acceptable': False
    }
    
    # Check build directory
    build_dirs = ['dist/', 'build/', 'public/']
    for build_dir in build_dirs:
        if Path(build_dir).exists():
            checks['build_directory_exists'] = True
            
            # Check build size (should be < 100MB)
            try:
                size = sum(f.stat().st_size for f in Path(build_dir).rglob('*') if f.is_file())
                checks['build_size_acceptable'] = size < 100 * 1024 * 1024  # 100MB
            except Exception:
                checks['build_size_acceptable'] = True
            break
    
    # Check package.json
    package_json = Path('package.json')
    if package_json.exists():
        try:
            with open(package_json, 'r') as f:
                package_data = json.load(f)
                checks['package_json_valid'] = 'name' in package_data and 'version' in package_data
        except Exception:
            checks['package_json_valid'] = False
    
    # Check node_modules
    checks['dependencies_installed'] = Path('node_modules/').exists()
    
    return checks

def check_environment_config(environment: str) -> Dict[str, Any]:
    """Check environment-specific configuration"""
    checks = {
        'env_file_exists': False,
        'required_env_vars': False,
        'database_config': False,
        'api_keys_configured': False
    }
    
    # Check environment file
    env_files = [f'.env.{environment}', '.env', '.env.example']
    for env_file in env_files:
        if Path(env_file).exists():
            checks['env_file_exists'] = True
            
            try:
                with open(env_file, 'r') as f:
                    env_content = f.read()
                    
                    # Check for required environment variables
                    required_vars = ['NODE_ENV', 'PORT']
                    checks['required_env_vars'] = all(var in env_content for var in required_vars)
                    
                    # Check database configuration
                    db_vars = ['MONGODB_URI', 'DATABASE_URL', 'DB_HOST']
                    checks['database_config'] = any(var in env_content for var in db_vars)
                    
                    # Check API keys (at least some configured)
                    api_vars = ['SPOTIFY_CLIENT_ID', 'OPENAI_API_KEY', 'GEMINI_API_KEY']
                    checks['api_keys_configured'] = any(var in env_content for var in api_vars)
                    
            except Exception:
                pass
            break
    
    return checks

def check_security_configuration() -> Dict[str, Any]:
    """Check security configuration"""
    checks = {
        'https_configured': False,
        'security_headers': False,
        'rate_limiting': False,
        'input_validation': False
    }
    
    # Check main application files for security configurations
    app_files = ['server.js', 'app.js', 'index.js', 'src/index.js']
    
    for app_file in app_files:
        if Path(app_file).exists():
            try:
                with open(app_file, 'r') as f:
                    content = f.read().lower()
                    
                    # Check HTTPS configuration
                    checks['https_configured'] = any(keyword in content 
                                                   for keyword in ['https', 'ssl', 'tls'])
                    
                    # Check security headers
                    checks['security_headers'] = any(header in content 
                                                   for header in ['helmet', 'cors', 'csp'])
                    
                    # Check rate limiting
                    checks['rate_limiting'] = any(keyword in content 
                                                for keyword in ['rate', 'limit', 'throttle'])
                    
                    # Check input validation
                    checks['input_validation'] = any(keyword in content 
                                                   for keyword in ['validate', 'sanitize', 'joi', 'yup'])
                    
            except Exception:
                pass
            break
    
    return checks

def check_health_endpoints() -> Dict[str, Any]:
    """Check if health endpoints are available"""
    checks = {
        'health_endpoint_defined': False,
        'metrics_endpoint_defined': False,
        'ready_endpoint_defined': False
    }
    
    # Check for health endpoint definitions in code
    app_files = ['server.js', 'app.js', 'index.js', 'src/index.js', 'src/app.js']
    
    for app_file in app_files:
        if Path(app_file).exists():
            try:
                with open(app_file, 'r') as f:
                    content = f.read().lower()
                    
                    checks['health_endpoint_defined'] = '/health' in content
                    checks['metrics_endpoint_defined'] = '/metrics' in content
                    checks['ready_endpoint_defined'] = '/ready' in content or '/readiness' in content
                    
            except Exception:
                pass
            break
    
    return checks

def check_docker_configuration() -> Dict[str, Any]:
    """Check Docker configuration if present"""
    checks = {
        'dockerfile_exists': False,
        'docker_compose_exists': False,
        'multi_stage_build': False,
        'non_root_user': False,
        'health_check_defined': False
    }
    
    # Check Dockerfile
    dockerfile = Path('Dockerfile')
    if dockerfile.exists():
        checks['dockerfile_exists'] = True
        
        try:
            with open(dockerfile, 'r') as f:
                content = f.read().lower()
                
                # Check for multi-stage build
                checks['multi_stage_build'] = 'as ' in content and 'from ' in content
                
                # Check for non-root user
                checks['non_root_user'] = 'user ' in content and 'user root' not in content
                
                # Check for health check
                checks['health_check_defined'] = 'healthcheck' in content
                
        except Exception:
            pass
    
    # Check docker-compose
    compose_files = ['docker-compose.yml', 'docker-compose.yaml']
    for compose_file in compose_files:
        if Path(compose_file).exists():
            checks['docker_compose_exists'] = True
            break
    
    return checks

def calculate_readiness_score(all_checks: Dict[str, Dict[str, Any]]) -> float:
    """Calculate overall deployment readiness score"""
    
    # Weighted scoring
    weights = {
        'build': 25,
        'environment': 30,
        'security': 25,
        'health': 15,
        'docker': 5
    }
    
    weighted_score = 0
    total_weight = 0
    
    for category, checks in all_checks.items():
        if category in weights:
            category_score = sum(checks.values()) / len(checks) if checks else 0
            weighted_score += category_score * weights[category]
            total_weight += weights[category]
    
    return (weighted_score / total_weight) * 100 if total_weight > 0 else 0

def main():
    args = parse_args()
    
    print(f"Validating deployment readiness for {args.environment} environment...")
    
    # Run readiness checks
    build_checks = check_build_artifacts()
    env_checks = check_environment_config(args.environment)
    security_checks = check_security_configuration()
    health_checks = check_health_endpoints()
    docker_checks = check_docker_configuration()
    
    all_checks = {
        'build': build_checks,
        'environment': env_checks,
        'security': security_checks,
        'health': health_checks,
        'docker': docker_checks
    }
    
    # Calculate readiness score
    readiness_score = calculate_readiness_score(all_checks)
    
    # Determine if deployment is ready
    # Lower threshold for staging (70%), higher for production (85%)
    threshold = 85.0 if args.environment == 'production' else 70.0
    deployment_ready = readiness_score >= threshold
    
    results = {
        'readiness_type': 'deployment',
        'environment': args.environment,
        'readiness_score': readiness_score,
        'threshold': threshold,
        'deployment_ready': deployment_ready,
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
    print(f"Deployment Readiness: {'PASS' if deployment_ready else 'FAIL'}")
    print(f"Readiness Score: {readiness_score:.1f}% (threshold: {threshold}%)")
    print(f"Environment: {args.environment}")
    print(f"Passed: {results['summary']['passed_checks']}/{results['summary']['total_checks']} checks")
    
    if results['summary']['failed_checks']:
        print("Failed checks:")
        for failed_check in results['summary']['failed_checks']:
            print(f"  - {failed_check}")
    
    # Exit with appropriate code
    sys.exit(0 if deployment_ready else 1)

if __name__ == '__main__':
    main()