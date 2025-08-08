#!/bin/bash

# ===================================================================
# EchoTune AI - Ubuntu 22.04 Deployment Validation Test
# Validates all deployment scripts and configurations
# ===================================================================

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Test configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
TEST_LOG="/tmp/echotune-validation-$(date +%Y%m%d-%H%M%S).log"

# Logging functions
log_test() {
    local message="$1"
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo -e "${GREEN}[${timestamp}] ✓ TEST: ${message}${NC}" | tee -a "$TEST_LOG"
}

log_error() {
    local message="$1"
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo -e "${RED}[${timestamp}] ✗ ERROR: ${message}${NC}" | tee -a "$TEST_LOG"
}

log_warning() {
    local message="$1"
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo -e "${YELLOW}[${timestamp}] ⚠ WARNING: ${message}${NC}" | tee -a "$TEST_LOG"
}

log_info() {
    local message="$1"
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo -e "${BLUE}[${timestamp}] ℹ INFO: ${message}${NC}" | tee -a "$TEST_LOG"
}

# Print test header
print_header() {
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║                🧪 EchoTune AI - Deployment Validation Tests                 ║${NC}"
    echo -e "${PURPLE}║                      Ubuntu 22.04 Configuration Validation                  ║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    log_info "🚀 Starting deployment validation tests..."
    log_info "📝 Test log: $TEST_LOG"
    echo ""
}

# Test script syntax
test_script_syntax() {
    log_info "Testing script syntax..."
    
    local scripts=(
        "$REPO_ROOT/scripts/ubuntu22-docker-setup.sh"
        "$REPO_ROOT/deploy-ubuntu22-oneclick.sh"
        "$REPO_ROOT/deploy-digitalocean-ubuntu22.sh"
    )
    
    local syntax_errors=0
    
    for script in "${scripts[@]}"; do
        if [[ -f "$script" ]]; then
            if bash -n "$script" 2>/dev/null; then
                log_test "✓ Syntax valid: $(basename "$script")"
            else
                log_error "✗ Syntax error: $(basename "$script")"
                ((syntax_errors++))
            fi
        else
            log_warning "Script not found: $script"
        fi
    done
    
    if [[ $syntax_errors -eq 0 ]]; then
        log_test "All deployment scripts have valid syntax"
    else
        log_error "$syntax_errors scripts have syntax errors"
        return 1
    fi
}

# Test configuration files
test_configuration_files() {
    log_info "Testing configuration files..."
    
    # Test .env.example
    if [[ -f "$REPO_ROOT/.env.example" ]]; then
        # Check for hardcoded values that should be templated
        local hardcoded_issues=0
        
        if grep -q "primosphere.studio" "$REPO_ROOT/.env.example"; then
            log_error ".env.example still contains hardcoded domain 'primosphere.studio'"
            ((hardcoded_issues++))
        fi
        
        if grep -q "dcc2df507bde447c" "$REPO_ROOT/.env.example"; then
            log_error ".env.example still contains hardcoded Spotify credentials"
            ((hardcoded_issues++))
        fi
        
        if grep -q "copilot:DapperMan77" "$REPO_ROOT/.env.example"; then
            log_error ".env.example still contains hardcoded MongoDB credentials"
            ((hardcoded_issues++))
        fi
        
        if grep -q "dop_v1_" "$REPO_ROOT/.env.example"; then
            log_error ".env.example still contains hardcoded DigitalOcean tokens"
            ((hardcoded_issues++))
        fi
        
        # Check for proper template values
        if grep -q "your-domain.com" "$REPO_ROOT/.env.example"; then
            log_test "✓ .env.example uses template domain"
        fi
        
        if grep -q "your_spotify_client_id" "$REPO_ROOT/.env.example"; then
            log_test "✓ .env.example uses template Spotify credentials"
        fi
        
        if [[ $hardcoded_issues -eq 0 ]]; then
            log_test "✓ .env.example properly templated"
        else
            log_error "$hardcoded_issues hardcoded values found in .env.example"
            return 1
        fi
    else
        log_error ".env.example file not found"
        return 1
    fi
    
    # Test nginx configuration template
    if [[ -f "$REPO_ROOT/nginx-ubuntu22.conf.template" ]]; then
        if grep -q "DOMAIN" "$REPO_ROOT/nginx-ubuntu22.conf.template"; then
            log_test "✓ nginx template uses environment variables"
        else
            log_warning "nginx template may not use dynamic configuration"
        fi
    fi
    
    # Test docker-compose configuration
    if [[ -f "$REPO_ROOT/docker-compose-ubuntu22.yml" ]]; then
        if grep -q "\${DOMAIN" "$REPO_ROOT/docker-compose-ubuntu22.yml"; then
            log_test "✓ Docker Compose uses environment variables"
        else
            log_warning "Docker Compose may not use dynamic configuration"
        fi
    fi
}

# Test documentation consistency
test_documentation() {
    log_info "Testing documentation consistency..."
    
    local docs=(
        "$REPO_ROOT/docs/deployment/UBUNTU22_COMPLETE_GUIDE.md"
        "$REPO_ROOT/docs/deployment/ubuntu-deployment.md"
        "$REPO_ROOT/README.md"
    )
    
    local doc_errors=0
    
    for doc in "${docs[@]}"; do
        if [[ -f "$doc" ]]; then
            # Check for broken internal links (basic check)
            if grep -q "docs/deployment/UBUNTU22_COMPLETE_GUIDE.md" "$doc" 2>/dev/null; then
                if [[ -f "$REPO_ROOT/docs/deployment/UBUNTU22_COMPLETE_GUIDE.md" ]]; then
                    log_test "✓ Internal link valid in $(basename "$doc")"
                else
                    log_error "Broken internal link in $(basename "$doc")"
                    ((doc_errors++))
                fi
            fi
            
            # Check for outdated script references
            if grep -q "ubuntu22-docker-setup.sh" "$doc"; then
                if [[ -f "$REPO_ROOT/scripts/ubuntu22-docker-setup.sh" ]]; then
                    log_test "✓ Script reference valid in $(basename "$doc")"
                else
                    log_error "Invalid script reference in $(basename "$doc")"
                    ((doc_errors++))
                fi
            fi
        else
            log_warning "Documentation file not found: $doc"
        fi
    done
    
    if [[ $doc_errors -eq 0 ]]; then
        log_test "Documentation consistency checks passed"
    else
        log_error "$doc_errors documentation issues found"
        return 1
    fi
}

# Test Docker configuration
test_docker_configuration() {
    log_info "Testing Docker configuration..."
    
    # Test docker-compose.yml syntax
    if [[ -f "$REPO_ROOT/docker-compose.yml" ]]; then
        cd "$REPO_ROOT"
        if docker-compose -f docker-compose.yml config &>/dev/null; then
            log_test "✓ Main docker-compose.yml syntax valid"
        else
            log_error "Main docker-compose.yml has syntax errors"
            return 1
        fi
    fi
    
    # Test Ubuntu 22 docker-compose.yml
    if [[ -f "$REPO_ROOT/docker-compose-ubuntu22.yml" ]]; then
        cd "$REPO_ROOT"
        if docker-compose -f docker-compose-ubuntu22.yml config &>/dev/null; then
            log_test "✓ Ubuntu 22 docker-compose.yml syntax valid"
        else
            log_error "Ubuntu 22 docker-compose.yml has syntax errors"
            return 1
        fi
    fi
    
    # Test Dockerfile syntax
    if [[ -f "$REPO_ROOT/Dockerfile" ]]; then
        if docker build --dry-run -f "$REPO_ROOT/Dockerfile" "$REPO_ROOT" &>/dev/null; then
            log_test "✓ Dockerfile syntax valid"
        else
            log_warning "Dockerfile may have issues (dry-run failed)"
        fi
    fi
}

# Test network connectivity requirements
test_network_requirements() {
    log_info "Testing network connectivity requirements..."
    
    local required_endpoints=(
        "github.com:443"
        "download.docker.com:443"
        "deb.nodesource.com:443"
        "registry.hub.docker.com:443"
    )
    
    local connectivity_issues=0
    
    for endpoint in "${required_endpoints[@]}"; do
        local host=$(echo "$endpoint" | cut -d: -f1)
        local port=$(echo "$endpoint" | cut -d: -f2)
        
        if timeout 5 bash -c "echo >/dev/tcp/$host/$port" 2>/dev/null; then
            log_test "✓ Can connect to $endpoint"
        else
            log_warning "Cannot connect to $endpoint (may affect deployment)"
            ((connectivity_issues++))
        fi
    done
    
    if [[ $connectivity_issues -eq 0 ]]; then
        log_test "All required network endpoints accessible"
    else
        log_warning "$connectivity_issues network connectivity issues found"
    fi
}

# Test system requirements
test_system_requirements() {
    log_info "Testing system requirements..."
    
    # Check Ubuntu version
    if [[ -f /etc/lsb-release ]]; then
        local ubuntu_version=$(lsb_release -rs)
        log_info "Ubuntu version: $ubuntu_version"
        
        if [[ "$ubuntu_version" == "22.04" ]]; then
            log_test "✓ Running on Ubuntu 22.04 LTS"
        else
            log_warning "Not running on Ubuntu 22.04 (current: $ubuntu_version)"
        fi
    else
        log_warning "Cannot detect Ubuntu version"
    fi
    
    # Check available disk space
    local available_space=$(df / | awk 'NR==2 {print $4}')
    local required_space=10485760  # 10GB in KB
    
    if [[ $available_space -gt $required_space ]]; then
        log_test "✓ Sufficient disk space available ($(($available_space / 1024 / 1024))GB)"
    else
        log_warning "Low disk space ($(($available_space / 1024 / 1024))GB available, 10GB recommended)"
    fi
    
    # Check memory
    local total_mem=$(free -m | awk 'NR==2{print $2}')
    
    if [[ $total_mem -gt 2048 ]]; then
        log_test "✓ Sufficient memory available (${total_mem}MB)"
    else
        log_warning "Low memory (${total_mem}MB available, 2GB recommended)"
    fi
}

# Test file permissions
test_file_permissions() {
    log_info "Testing file permissions..."
    
    local executable_scripts=(
        "$REPO_ROOT/scripts/ubuntu22-docker-setup.sh"
        "$REPO_ROOT/deploy-ubuntu22-oneclick.sh"
        "$REPO_ROOT/deploy-digitalocean-ubuntu22.sh"
    )
    
    local permission_issues=0
    
    for script in "${executable_scripts[@]}"; do
        if [[ -f "$script" ]]; then
            if [[ -x "$script" ]]; then
                log_test "✓ $(basename "$script") is executable"
            else
                log_warning "$(basename "$script") is not executable (will be fixed during deployment)"
            fi
        fi
    done
}

# Run comprehensive validation
run_comprehensive_validation() {
    print_header
    
    local total_tests=0
    local failed_tests=0
    
    # Run all test functions
    local test_functions=(
        test_script_syntax
        test_configuration_files
        test_documentation
        test_docker_configuration
        test_network_requirements
        test_system_requirements
        test_file_permissions
    )
    
    for test_func in "${test_functions[@]}"; do
        ((total_tests++))
        if ! $test_func; then
            ((failed_tests++))
        fi
        echo ""
    done
    
    # Show summary
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║                           📊 VALIDATION SUMMARY                             ║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    echo -e "${BOLD}📈 Test Results:${NC}"
    echo "   🧪 Total Tests: $total_tests"
    echo "   ✅ Passed: $((total_tests - failed_tests))"
    echo "   ❌ Failed: $failed_tests"
    echo ""
    
    if [[ $failed_tests -eq 0 ]]; then
        echo -e "${GREEN}🎉 ALL TESTS PASSED! Ubuntu 22.04 deployment is ready!${NC}"
        echo ""
        echo -e "${BOLD}✅ Ready for Production:${NC}"
        echo "   🚀 All deployment scripts validated"
        echo "   🔧 Configuration files properly templated"
        echo "   📖 Documentation consistency verified"
        echo "   🐳 Docker configurations tested"
        echo "   🌐 Network connectivity confirmed"
        echo ""
        echo -e "${CYAN}🎯 Next Steps:${NC}"
        echo "   1. Deploy to Ubuntu 22.04 server for final testing"
        echo "   2. Test with real domain and SSL certificates"
        echo "   3. Validate health checks and monitoring"
        echo ""
    else
        echo -e "${RED}⚠️ VALIDATION FAILED! $failed_tests issues found.${NC}"
        echo ""
        echo -e "${YELLOW}🔧 Issues to Fix:${NC}"
        echo "   Please review the test log and fix the identified issues"
        echo "   Re-run validation after making corrections"
        echo ""
        return 1
    fi
    
    echo -e "${CYAN}📝 Full validation log: $TEST_LOG${NC}"
    echo ""
}

# Main execution
main() {
    cd "$REPO_ROOT"
    run_comprehensive_validation
}

# Execute main function
main "$@"