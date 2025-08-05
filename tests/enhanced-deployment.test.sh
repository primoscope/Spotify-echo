#!/bin/bash

# EchoTune AI - Enhanced Deployment Script Test Suite
# Tests the new features of deploy-digitalocean-production.sh v2.0.0

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test configuration
SCRIPT_PATH="./deploy-digitalocean-production.sh"
TEST_RESULTS=()

# Helper functions
log_test() {
    echo -e "${BLUE}[TEST] $1${NC}"
}

log_pass() {
    echo -e "${GREEN}[PASS] $1${NC}"
    TEST_RESULTS+=("PASS: $1")
}

log_fail() {
    echo -e "${RED}[FAIL] $1${NC}"
    TEST_RESULTS+=("FAIL: $1")
}

log_warning() {
    echo -e "${YELLOW}[WARN] $1${NC}"
}

# Test 1: Script syntax validation
test_script_syntax() {
    log_test "Testing script syntax validation"
    
    if bash -n "$SCRIPT_PATH"; then
        log_pass "Script syntax is valid"
    else
        log_fail "Script syntax validation failed"
    fi
}

# Test 2: Help functionality
test_help_functionality() {
    log_test "Testing help functionality"
    
    local help_output
    if help_output=$(bash "$SCRIPT_PATH" --help 2>/dev/null); then
        if [[ "$help_output" == *"EchoTune AI Enhanced DigitalOcean Deployment Script"* ]]; then
            log_pass "Help functionality works correctly"
        else
            log_fail "Help output is incomplete"
        fi
    else
        log_fail "Help functionality failed"
    fi
}

# Test 3: Version functionality
test_version_functionality() {
    log_test "Testing version functionality"
    
    local version_output
    if version_output=$(bash "$SCRIPT_PATH" --version 2>/dev/null); then
        if [[ "$version_output" == *"v2.0.0"* ]]; then
            log_pass "Version functionality works correctly"
        else
            log_fail "Version output is incorrect"
        fi
    else
        log_fail "Version functionality failed"
    fi
}

# Test 4: Invalid option handling
test_invalid_option_handling() {
    log_test "Testing invalid option handling"
    
    local invalid_output
    invalid_output=$(bash "$SCRIPT_PATH" --invalid-option 2>&1 || true)
    if [[ "$invalid_output" == *"WARNING: Unknown option"* ]]; then
        log_pass "Invalid option handling works correctly"
    else
        log_fail "Invalid option handling is incorrect"
    fi
}

# Test 5: Dry run mode
test_dry_run_mode() {
    log_test "Testing dry run mode"
    
    local dry_run_output
    if dry_run_output=$(timeout 10s bash "$SCRIPT_PATH" --dry-run 2>/dev/null || true); then
        if [[ "$dry_run_output" == *"[DRY RUN]"* ]]; then
            log_pass "Dry run mode works correctly"
        else
            log_fail "Dry run mode output is missing"
        fi
    else
        log_fail "Dry run mode failed"
    fi
}

# Test 6: Custom domain option
test_custom_domain_option() {
    log_test "Testing custom domain option"
    
    local domain_output
    if domain_output=$(timeout 10s bash "$SCRIPT_PATH" --domain=test.example.com --dry-run 2>/dev/null || true); then
        if [[ "$domain_output" == *"Domain: test.example.com"* ]]; then
            log_pass "Custom domain option works correctly"
        else
            log_fail "Custom domain option not working"
        fi
    else
        log_fail "Custom domain option failed"
    fi
}

# Test 7: Custom IP option
test_custom_ip_option() {
    log_test "Testing custom IP option"
    
    local ip_output
    if ip_output=$(timeout 10s bash "$SCRIPT_PATH" --ip=192.168.1.100 --dry-run 2>/dev/null || true); then
        if [[ "$ip_output" == *"Primary IP: 192.168.1.100"* ]]; then
            log_pass "Custom IP option works correctly"
        else
            log_fail "Custom IP option not working"
        fi
    else
        log_fail "Custom IP option failed"
    fi
}

# Test 8: Verbose mode
test_verbose_mode() {
    log_test "Testing verbose mode"
    
    local verbose_output
    if verbose_output=$(timeout 10s bash "$SCRIPT_PATH" --verbose --dry-run 2>/dev/null || true); then
        if [[ "$verbose_output" == *"Verbose Mode: true"* ]]; then
            log_pass "Verbose mode works correctly"
        else
            log_fail "Verbose mode not working"
        fi
    else
        log_fail "Verbose mode failed"
    fi
}

# Test 9: Force option
test_force_option() {
    log_test "Testing force option"
    
    local force_output
    if force_output=$(timeout 10s bash "$SCRIPT_PATH" --force --dry-run 2>/dev/null || true); then
        if [[ "$force_output" == *"Force Reset: true"* ]]; then
            log_pass "Force option works correctly"
        else
            log_fail "Force option not working"
        fi
    else
        log_fail "Force option failed"
    fi
}

# Test 10: Script structure validation
test_script_structure() {
    log_test "Testing script structure and functions"
    
    local functions=(
        "safe_execute"
        "setup_user_and_dirs"
        "install_dependencies"
        "install_nodejs"
        "install_python"
        "install_docker"
        "setup_firewall"
        "setup_ssl"
        "deploy_application"
        "verify_deployment"
        "show_summary"
    )
    
    local missing_functions=()
    for func in "${functions[@]}"; do
        if ! grep -q "^$func()" "$SCRIPT_PATH"; then
            missing_functions+=("$func")
        fi
    done
    
    if [[ ${#missing_functions[@]} -eq 0 ]]; then
        log_pass "All required functions are present"
    else
        log_fail "Missing functions: ${missing_functions[*]}"
    fi
}

# Test 11: Enhanced features validation
test_enhanced_features() {
    log_test "Testing enhanced features documentation"
    
    local enhanced_features=(
        "Fully idempotent"
        "Enhanced permissions"
        "Open firewall"
        "Force reset"
        "Comprehensive dependency"
        "Robust error handling"
        "Dry run mode"
        "Verbose logging"
        "automation"
    )
    
    local missing_features=()
    for feature in "${enhanced_features[@]}"; do
        if ! grep -qi "$feature" "$SCRIPT_PATH"; then
            missing_features+=("$feature")
        fi
    done
    
    if [[ ${#missing_features[@]} -eq 0 ]]; then
        log_pass "All enhanced features are documented"
    else
        log_fail "Missing feature documentation: ${missing_features[*]}"
    fi
}

# Test 12: Permissions configuration
test_permissions_configuration() {
    log_test "Testing permissions configuration (777)"
    
    if grep -q "chmod 777" "$SCRIPT_PATH"; then
        log_pass "Permissive permissions (777) are configured"
    else
        log_fail "Permissive permissions not found"
    fi
}

# Test 13: Firewall configuration
test_firewall_configuration() {
    log_test "Testing firewall configuration (disabled/open)"
    
    if grep -q "ufw disable" "$SCRIPT_PATH"; then
        log_pass "Firewall is configured to be disabled"
    else
        log_fail "Firewall disable configuration not found"
    fi
}

# Main test execution
main() {
    echo -e "${BLUE}🧪 EchoTune AI - Enhanced Deployment Script Tests${NC}"
    echo "=================================================="
    echo ""
    
    # Check if script exists
    if [[ ! -f "$SCRIPT_PATH" ]]; then
        log_fail "Deployment script not found at $SCRIPT_PATH"
        exit 1
    fi
    
    # Run all tests
    test_script_syntax
    test_help_functionality
    test_version_functionality
    test_invalid_option_handling
    test_dry_run_mode
    test_custom_domain_option
    test_custom_ip_option
    test_verbose_mode
    test_force_option
    test_script_structure
    test_enhanced_features
    test_permissions_configuration
    test_firewall_configuration
    
    echo ""
    echo "=================================================="
    echo -e "${BLUE}🎯 Enhanced Deployment Test Results${NC}"
    echo "=================================================="
    echo ""
    
    local pass_count=0
    local fail_count=0
    
    for result in "${TEST_RESULTS[@]}"; do
        if [[ "$result" == PASS:* ]]; then
            echo -e "${GREEN}✅ ${result#PASS: }${NC}"
            ((pass_count++))
        else
            echo -e "${RED}❌ ${result#FAIL: }${NC}"
            ((fail_count++))
        fi
    done
    
    echo ""
    echo -e "${BLUE}📊 Summary: ${GREEN}$pass_count passed${NC}, ${RED}$fail_count failed${NC}"
    
    if [[ $fail_count -eq 0 ]]; then
        echo -e "${GREEN}🎉 All enhanced deployment tests passed!${NC}"
        exit 0
    else
        echo -e "${RED}❌ Some tests failed. Please review the script.${NC}"
        exit 1
    fi
}

# Run tests
main "$@"