#!/bin/bash

# EchoTune AI Deployment Validation Script
# Comprehensive validation of deployment configurations and files

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

# Counters
TESTS_PASSED=0
TESTS_FAILED=0
WARNINGS=0

# Logging functions
log() { echo -e "${BLUE}[VALIDATE]${NC} $1"; }
log_success() { echo -e "${GREEN}[✅ PASS]${NC} $1"; ((TESTS_PASSED++)); }
log_fail() { echo -e "${RED}[❌ FAIL]${NC} $1"; ((TESTS_FAILED++)); }
log_warning() { echo -e "${YELLOW}[⚠️  WARN]${NC} $1"; ((WARNINGS++)); }
log_info() { echo -e "${CYAN}[ℹ️  INFO]${NC} $1"; }

# Print header
print_header() {
    clear
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                    🔍 EchoTune AI Deployment Validation                      ║"
    echo "║                        Comprehensive Infrastructure Check                    ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo -e "${WHITE}Validating deployment infrastructure and configurations${NC}"
    echo ""
}

# Validate file structure
validate_file_structure() {
    log "🗂️  Validating project file structure..."
    
    local required_files=(
        "package.json"
        "Dockerfile"
        "Dockerfile.nginx"
        "docker-compose.yml"
        "deploy-universal.sh"
        ".env.production.example"
        "nginx/nginx.conf.template"
        "nginx/default.conf.template"
        "nginx/ssl.conf"
        "nginx/security.conf"
        "scripts/ssl-setup.sh"
    )
    
    for file in "${required_files[@]}"; do
        if [[ -f "$file" ]]; then
            log_success "Found: $file"
        else
            log_fail "Missing: $file"
        fi
    done
    
    # Check directories
    local required_dirs=(
        "src"
        "nginx"
        "scripts"
        "mcp-server"
    )
    
    for dir in "${required_dirs[@]}"; do
        if [[ -d "$dir" ]]; then
            log_success "Directory exists: $dir"
        else
            log_warning "Directory missing: $dir"
        fi
    done
}

# Validate Docker configurations
validate_docker_configs() {
    log "🐳 Validating Docker configurations..."
    
    # Validate docker-compose.yml
    if command -v python3 &> /dev/null; then
        if python3 -c "import yaml; yaml.safe_load(open('docker-compose.yml'))" 2>/dev/null; then
            log_success "docker-compose.yml YAML syntax is valid"
        else
            log_fail "docker-compose.yml has invalid YAML syntax"
        fi
    else
        log_warning "Python3 not available, skipping YAML validation"
    fi
    
    # Check Dockerfile syntax
    if [[ -f "Dockerfile" ]]; then
        if grep -q "FROM node:" "Dockerfile"; then
            log_success "Dockerfile has valid Node.js base image"
        else
            log_warning "Dockerfile may not have proper base image"
        fi
        
        if grep -q "USER echotune" "Dockerfile"; then
            log_success "Dockerfile uses non-root user"
        else
            log_fail "Dockerfile should use non-root user for security"
        fi
        
        if grep -q "HEALTHCHECK" "Dockerfile"; then
            log_success "Dockerfile includes health check"
        else
            log_warning "Dockerfile missing health check"
        fi
    fi
    
    # Check Nginx Dockerfile
    if [[ -f "Dockerfile.nginx" ]]; then
        if grep -q "FROM nginx:" "Dockerfile.nginx"; then
            log_success "Nginx Dockerfile has valid base image"
        else
            log_fail "Nginx Dockerfile missing proper base image"
        fi
        
        if grep -q "certbot" "Dockerfile.nginx"; then
            log_success "Nginx Dockerfile includes SSL certificate management"
        else
            log_warning "Nginx Dockerfile may be missing SSL support"
        fi
    fi
}

# Validate Nginx configurations
validate_nginx_configs() {
    log "⚙️  Validating Nginx configurations..."
    
    # Check nginx.conf.template
    if [[ -f "nginx/nginx.conf.template" ]]; then
        if grep -q "ssl_protocols" "nginx/nginx.conf.template"; then
            log_success "Nginx template includes SSL configuration"
        else
            log_warning "Nginx template may be missing SSL settings"
        fi
        
        if grep -q "limit_req_zone" "nginx/nginx.conf.template"; then
            log_success "Nginx template includes rate limiting"
        else
            log_warning "Nginx template may be missing rate limiting"
        fi
    else
        log_fail "nginx/nginx.conf.template is missing"
    fi
    
    # Check default.conf.template
    if [[ -f "nginx/default.conf.template" ]]; then
        if grep -q "proxy_pass" "nginx/default.conf.template"; then
            log_success "Nginx site template includes reverse proxy"
        else
            log_fail "Nginx site template missing reverse proxy configuration"
        fi
        
        if grep -q "ssl_certificate" "nginx/default.conf.template"; then
            log_success "Nginx site template includes SSL certificate paths"
        else
            log_warning "Nginx site template may be missing SSL certificate configuration"
        fi
    else
        log_fail "nginx/default.conf.template is missing"
    fi
    
    # Check SSL configuration
    if [[ -f "nginx/ssl.conf" ]]; then
        if grep -q "TLSv1.3" "nginx/ssl.conf"; then
            log_success "SSL configuration includes modern TLS 1.3"
        else
            log_warning "SSL configuration may not include TLS 1.3"
        fi
        
        if grep -q "ssl_stapling on" "nginx/ssl.conf"; then
            log_success "SSL configuration includes OCSP stapling"
        else
            log_warning "SSL configuration missing OCSP stapling"
        fi
    else
        log_fail "nginx/ssl.conf is missing"
    fi
    
    # Check security headers
    if [[ -f "nginx/security.conf" ]]; then
        if grep -q "Strict-Transport-Security" "nginx/security.conf"; then
            log_success "Security configuration includes HSTS"
        else
            log_fail "Security configuration missing HSTS"
        fi
        
        if grep -q "Content-Security-Policy" "nginx/security.conf"; then
            log_success "Security configuration includes CSP"
        else
            log_fail "Security configuration missing CSP"
        fi
    else
        log_fail "nginx/security.conf is missing"
    fi
}

# Validate deployment scripts
validate_deployment_scripts() {
    log "📜 Validating deployment scripts..."
    
    # Check universal deployment script
    if [[ -f "deploy-universal.sh" ]]; then
        if [[ -x "deploy-universal.sh" ]]; then
            log_success "deploy-universal.sh is executable"
        else
            log_fail "deploy-universal.sh is not executable"
        fi
        
        if grep -q "detect_deployment_method" "deploy-universal.sh"; then
            log_success "Universal script includes environment detection"
        else
            log_fail "Universal script missing environment detection"
        fi
        
        if grep -q "SSL_EMAIL" "deploy-universal.sh"; then
            log_success "Universal script includes SSL configuration"
        else
            log_warning "Universal script may be missing SSL setup"
        fi
    else
        log_fail "deploy-universal.sh is missing"
    fi
    
    # Check SSL setup script
    if [[ -f "scripts/ssl-setup.sh" ]]; then
        if [[ -x "scripts/ssl-setup.sh" ]]; then
            log_success "scripts/ssl-setup.sh is executable"
        else
            log_fail "scripts/ssl-setup.sh is not executable"
        fi
        
        if grep -q "certbot" "scripts/ssl-setup.sh"; then
            log_success "SSL script includes Let's Encrypt support"
        else
            log_fail "SSL script missing Let's Encrypt support"
        fi
    else
        log_fail "scripts/ssl-setup.sh is missing"
    fi
    
    # Check for dangerous patterns
    if grep -r "hardcoded_password\|secret_key_123" . --exclude-dir=.git 2>/dev/null; then
        log_fail "Found hardcoded credentials in files"
    else
        log_success "No hardcoded credentials found"
    fi
}

# Validate environment configuration
validate_environment_config() {
    log "🔧 Validating environment configurations..."
    
    if [[ -f ".env.production.example" ]]; then
        log_success ".env.production.example exists"
        
        # Check for required variables
        local required_vars=(
            "SPOTIFY_CLIENT_ID"
            "SPOTIFY_CLIENT_SECRET"
            "SESSION_SECRET"
            "JWT_SECRET"
            "DOMAIN"
            "NODE_ENV"
        )
        
        for var in "${required_vars[@]}"; do
            if grep -q "^$var=" ".env.production.example"; then
                log_success "Environment template includes $var"
            else
                log_fail "Environment template missing $var"
            fi
        done
        
        # Check for security configurations
        if grep -q "SSL_CERT_PATH" ".env.production.example"; then
            log_success "Environment template includes SSL configuration"
        else
            log_warning "Environment template may be missing SSL settings"
        fi
        
        if grep -q "RATE_LIMIT" ".env.production.example"; then
            log_success "Environment template includes rate limiting configuration"
        else
            log_warning "Environment template may be missing rate limiting"
        fi
    else
        log_fail ".env.production.example is missing"
    fi
}

# Validate package.json and dependencies
validate_package_config() {
    log "📦 Validating package configuration..."
    
    if [[ -f "package.json" ]]; then
        log_success "package.json exists"
        
        # Check for deployment scripts
        if grep -q '"deploy"' "package.json"; then
            log_success "package.json includes deployment scripts"
        else
            log_warning "package.json may be missing deployment scripts"
        fi
        
        # Check for health check script
        if grep -q '"health-check"' "package.json"; then
            log_success "package.json includes health check script"
        else
            log_warning "package.json missing health check script"
        fi
        
        # Check Node.js version requirements
        if grep -q '"node".*"[>]=18"' "package.json" || grep -q '"engines"' "package.json"; then
            log_success "package.json specifies Node.js version requirements"
        else
            log_warning "package.json may be missing Node.js version requirements"
        fi
    else
        log_fail "package.json is missing"
    fi
    
    # Check Python requirements
    if [[ -f "requirements.txt" ]] || [[ -f "requirements-production.txt" ]]; then
        log_success "Python requirements file exists"
    else
        log_warning "Python requirements file may be missing"
    fi
}

# Validate security configurations
validate_security_config() {
    log "🛡️  Validating security configurations..."
    
    # Check for security best practices in Docker
    if grep -q "no-new-privileges" "docker-compose.yml"; then
        log_success "Docker compose includes security options"
    else
        log_warning "Docker compose may be missing security hardening"
    fi
    
    # Check for SSL configuration
    if grep -q "443" "docker-compose.yml"; then
        log_success "Docker compose exposes HTTPS port"
    else
        log_warning "Docker compose may not expose HTTPS"
    fi
    
    # Check for environment variable handling
    if grep -q "env_file" "docker-compose.yml"; then
        log_success "Docker compose uses environment files"
    else
        log_warning "Docker compose may not properly handle environment variables"
    fi
    
    # Check for resource limits
    if grep -q "mem_limit\|cpus" "docker-compose.yml"; then
        log_success "Docker compose includes resource limits"
    else
        log_warning "Docker compose may be missing resource limits"
    fi
}

# Run comprehensive validation
run_all_validations() {
    print_header
    
    validate_file_structure
    echo ""
    
    validate_docker_configs
    echo ""
    
    validate_nginx_configs
    echo ""
    
    validate_deployment_scripts
    echo ""
    
    validate_environment_config
    echo ""
    
    validate_package_config
    echo ""
    
    validate_security_config
    echo ""
}

# Display final results
show_results() {
    echo -e "${WHITE}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${WHITE}║                           VALIDATION RESULTS                                ║${NC}"
    echo -e "${WHITE}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    local total_tests=$((TESTS_PASSED + TESTS_FAILED))
    local success_rate=0
    
    if [[ $total_tests -gt 0 ]]; then
        success_rate=$(( (TESTS_PASSED * 100) / total_tests ))
    fi
    
    echo -e "${GREEN}✅ Tests Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}❌ Tests Failed: $TESTS_FAILED${NC}"
    echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
    echo -e "${CYAN}📊 Success Rate: $success_rate%${NC}"
    echo ""
    
    # Overall status
    if [[ $TESTS_FAILED -eq 0 ]]; then
        echo -e "${GREEN}🎉 DEPLOYMENT VALIDATION PASSED${NC}"
        echo -e "${CYAN}Your EchoTune AI deployment configuration is ready for production!${NC}"
        
        if [[ $WARNINGS -gt 0 ]]; then
            echo -e "${YELLOW}💡 Consider addressing the warnings for optimal security and performance.${NC}"
        fi
        
        echo ""
        echo -e "${WHITE}🚀 Next Steps:${NC}"
        echo "1. Deploy using: ./deploy-universal.sh --production"
        echo "2. Configure your domain and SSL certificates"
        echo "3. Add your Spotify API credentials"
        echo "4. Test the deployment with: curl https://yourdomain.com/health"
        
        return 0
    elif [[ $TESTS_FAILED -le 3 ]] && [[ $success_rate -ge 80 ]]; then
        echo -e "${YELLOW}⚠️  DEPLOYMENT VALIDATION PASSED WITH WARNINGS${NC}"
        echo -e "${CYAN}Your deployment should work, but consider fixing the failed tests.${NC}"
        return 1
    else
        echo -e "${RED}❌ DEPLOYMENT VALIDATION FAILED${NC}"
        echo -e "${RED}Please fix the failed tests before deploying to production.${NC}"
        return 2
    fi
}

# Main execution
main() {
    # Change to repository directory if script is run from elsewhere
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    cd "$SCRIPT_DIR"
    
    case "${1:-all}" in
        "all")
            run_all_validations
            show_results
            ;;
        "docker")
            print_header
            validate_docker_configs
            show_results
            ;;
        "nginx")
            print_header
            validate_nginx_configs
            show_results
            ;;
        "scripts")
            print_header
            validate_deployment_scripts
            show_results
            ;;
        "security")
            print_header
            validate_security_config
            show_results
            ;;
        *)
            echo "Usage: $0 [all|docker|nginx|scripts|security]"
            echo "  all      - Run all validations (default)"
            echo "  docker   - Validate Docker configurations"
            echo "  nginx    - Validate Nginx configurations"
            echo "  scripts  - Validate deployment scripts"
            echo "  security - Validate security configurations"
            exit 1
            ;;
    esac
}

# Execute main function
main "$@"