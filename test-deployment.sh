#!/bin/bash

# ===================================================================
# EchoTune AI - Deployment Testing and Validation Script
# Tests all aspects of the production deployment
# ===================================================================

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
DOMAIN="${DOMAIN:-primosphere.studio}"
PRIMARY_IP="${PRIMARY_IP:-159.223.207.187}"
RESERVED_IP="${RESERVED_IP:-209.38.5.39}"
TEST_TIMEOUT=30
VERBOSE=${VERBOSE:-false}

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
FAILED_TESTS=()

# Functions
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ❌ $1${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    FAILED_TESTS+=("$1")
}

success() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] ✅ $1${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
}

warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️  $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] ℹ️  $1${NC}"
}

section() {
    echo -e "\n${CYAN}=== $1 ===${NC}"
}

# Test if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Make HTTP request with timeout
make_request() {
    local url="$1"
    local expected_code="${2:-200}"
    local timeout="${3:-$TEST_TIMEOUT}"
    
    if command_exists curl; then
        local response
        response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout "$timeout" --max-time "$timeout" "$url" 2>/dev/null || echo "000")
        echo "$response"
    else
        echo "000"
    fi
}

# Test SSL certificate
test_ssl_cert() {
    local domain="$1"
    local timeout="${2:-$TEST_TIMEOUT}"
    
    if command_exists openssl; then
        if timeout "$timeout" bash -c "echo | openssl s_client -servername $domain -connect $domain:443 >/dev/null 2>&1"; then
            return 0
        fi
    fi
    return 1
}

# Get SSL certificate expiry
get_ssl_expiry() {
    local domain="$1"
    
    if command_exists openssl; then
        echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | \
        openssl x509 -noout -dates 2>/dev/null | \
        grep "notAfter" | \
        cut -d= -f2 || echo "Unknown"
    else
        echo "Unknown"
    fi
}

# Test database connectivity
test_database() {
    local db_type="$1"
    local container="$2"
    local command="$3"
    
    if docker ps --format "table {{.Names}}" | grep -q "$container"; then
        if docker exec "$container" $command >/dev/null 2>&1; then
            return 0
        fi
    fi
    return 1
}

# Test port connectivity
test_port() {
    local host="$1"
    local port="$2"
    local timeout="${3:-5}"
    
    if command_exists nc; then
        nc -z -w "$timeout" "$host" "$port" 2>/dev/null
    elif command_exists telnet; then
        timeout "$timeout" telnet "$host" "$port" </dev/null >/dev/null 2>&1
    else
        return 1
    fi
}

# Test DNS resolution
test_dns() {
    local domain="$1"
    local expected_ip="$2"
    
    if command_exists dig; then
        local resolved_ip
        resolved_ip=$(dig +short "$domain" | head -1)
        if [[ "$resolved_ip" == "$expected_ip" ]]; then
            return 0
        fi
    elif command_exists nslookup; then
        local resolved_ip
        resolved_ip=$(nslookup "$domain" | grep "Address:" | tail -1 | awk '{print $2}')
        if [[ "$resolved_ip" == "$expected_ip" ]]; then
            return 0
        fi
    fi
    return 1
}

# System Prerequisites Test
test_prerequisites() {
    section "System Prerequisites"
    
    # Test if Docker is installed and running
    if command_exists docker; then
        if docker info >/dev/null 2>&1; then
            success "Docker is installed and running"
        else
            error "Docker is installed but not running"
        fi
    else
        error "Docker is not installed"
    fi
    
    # Test if Docker Compose is available
    if docker compose version >/dev/null 2>&1; then
        success "Docker Compose is available"
    else
        error "Docker Compose is not available"
    fi
    
    # Test system resources
    local available_memory
    available_memory=$(free -m | awk 'NR==2{printf "%.0f", $7}')
    if [[ $available_memory -gt 512 ]]; then
        success "Sufficient memory available (${available_memory}MB)"
    else
        warning "Low memory available (${available_memory}MB) - may affect performance"
    fi
    
    local disk_usage
    disk_usage=$(df / | awk 'NR==2{print $5}' | sed 's/%//')
    if [[ $disk_usage -lt 80 ]]; then
        success "Sufficient disk space (${disk_usage}% used)"
    else
        warning "High disk usage (${disk_usage}%) - may need cleanup"
    fi
}

# Container Health Test
test_containers() {
    section "Container Health"
    
    local containers=("echotune-app" "echotune-nginx" "echotune-mongodb" "echotune-redis")
    local required_containers=("echotune-app" "echotune-nginx")
    
    for container in "${containers[@]}"; do
        if docker ps --format "table {{.Names}}" | grep -q "$container"; then
            local health_status
            health_status=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "unknown")
            
            case $health_status in
                "healthy")
                    success "Container $container is healthy"
                    ;;
                "unhealthy")
                    error "Container $container is unhealthy"
                    ;;
                "starting")
                    warning "Container $container is still starting"
                    ;;
                *)
                    if [[ " ${required_containers[*]} " =~ " ${container} " ]]; then
                        success "Container $container is running (no health check)"
                    else
                        info "Container $container is running (optional)"
                    fi
                    ;;
            esac
        else
            if [[ " ${required_containers[*]} " =~ " ${container} " ]]; then
                error "Required container $container is not running"
            else
                warning "Optional container $container is not running"
            fi
        fi
    done
    
    # Test overall compose stack
    if docker compose ps --services --filter "status=running" | wc -l | grep -q "[1-9]"; then
        success "Docker Compose stack is running"
    else
        error "Docker Compose stack is not running properly"
    fi
}

# Network Connectivity Test
test_network() {
    section "Network Connectivity"
    
    # Test HTTP port (should redirect to HTTPS)
    if test_port "localhost" "80" 5; then
        success "HTTP port (80) is accessible"
    else
        error "HTTP port (80) is not accessible"
    fi
    
    # Test HTTPS port
    if test_port "localhost" "443" 5; then
        success "HTTPS port (443) is accessible"
    else
        error "HTTPS port (443) is not accessible"
    fi
    
    # Test external connectivity
    if test_port "$DOMAIN" "80" 10; then
        success "External HTTP connectivity to $DOMAIN"
    else
        warning "External HTTP connectivity to $DOMAIN failed"
    fi
    
    if test_port "$DOMAIN" "443" 10; then
        success "External HTTPS connectivity to $DOMAIN"
    else
        warning "External HTTPS connectivity to $DOMAIN failed"
    fi
}

# DNS Resolution Test
test_dns_resolution() {
    section "DNS Resolution"
    
    if test_dns "$DOMAIN" "$PRIMARY_IP"; then
        success "DNS resolution: $DOMAIN → $PRIMARY_IP"
    else
        local actual_ip
        if command_exists dig; then
            actual_ip=$(dig +short "$DOMAIN" | head -1)
        else
            actual_ip="unknown"
        fi
        warning "DNS resolution mismatch: $DOMAIN → $actual_ip (expected: $PRIMARY_IP)"
    fi
    
    if test_dns "www.$DOMAIN" "$PRIMARY_IP"; then
        success "DNS resolution: www.$DOMAIN → $PRIMARY_IP"
    else
        warning "DNS resolution failed for www.$DOMAIN"
    fi
}

# SSL Certificate Test
test_ssl() {
    section "SSL Certificate"
    
    if test_ssl_cert "$DOMAIN"; then
        success "SSL certificate is valid for $DOMAIN"
        
        local expiry
        expiry=$(get_ssl_expiry "$DOMAIN")
        info "Certificate expires: $expiry"
        
        # Check if certificate expires within 30 days
        if command_exists openssl; then
            local expiry_epoch
            expiry_epoch=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | \
                         openssl x509 -noout -enddate 2>/dev/null | \
                         cut -d= -f2 | \
                         xargs -I {} date -d "{}" +%s 2>/dev/null || echo "0")
            local current_epoch
            current_epoch=$(date +%s)
            local days_until_expiry
            days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))
            
            if [[ $days_until_expiry -lt 30 ]] && [[ $days_until_expiry -gt 0 ]]; then
                warning "SSL certificate expires in $days_until_expiry days"
            elif [[ $days_until_expiry -le 0 ]]; then
                error "SSL certificate has expired"
            else
                success "SSL certificate is valid for $days_until_expiry days"
            fi
        fi
    else
        error "SSL certificate is invalid or not accessible for $DOMAIN"
    fi
    
    # Test SSL configuration strength
    if command_exists openssl; then
        local ssl_version
        ssl_version=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | \
                     grep "Protocol" | cut -d: -f2 | tr -d ' ' || echo "unknown")
        if [[ "$ssl_version" =~ TLSv1\.[23] ]]; then
            success "Strong SSL protocol in use: $ssl_version"
        else
            warning "Weak SSL protocol detected: $ssl_version"
        fi
    fi
}

# HTTP/HTTPS Endpoints Test
test_endpoints() {
    section "HTTP/HTTPS Endpoints"
    
    local endpoints=(
        "http://localhost/health:200"
        "https://localhost/health:200"
        "http://$DOMAIN/health:200,301"
        "https://$DOMAIN/health:200"
        "https://$DOMAIN/api/health:200,404"
        "https://$DOMAIN/:200"
    )
    
    for endpoint_spec in "${endpoints[@]}"; do
        local url="${endpoint_spec%:*}"
        local expected_codes="${endpoint_spec#*:}"
        
        local response_code
        response_code=$(make_request "$url" "" 15)
        
        if [[ "$expected_codes" == *"$response_code"* ]]; then
            success "Endpoint $url returned $response_code"
        else
            if [[ "$response_code" == "000" ]]; then
                error "Endpoint $url is not accessible (timeout/connection failed)"
            else
                error "Endpoint $url returned $response_code (expected: $expected_codes)"
            fi
        fi
    done
    
    # Test HTTPS redirect
    local http_response
    http_response=$(make_request "http://$DOMAIN/" "" 10)
    if [[ "$http_response" == "301" ]] || [[ "$http_response" == "302" ]]; then
        success "HTTP to HTTPS redirect is working"
    else
        warning "HTTP to HTTPS redirect may not be configured properly"
    fi
}

# Database Connectivity Test
test_databases() {
    section "Database Connectivity"
    
    # Test MongoDB
    if test_database "MongoDB" "echotune-mongodb" "mongosh --quiet --eval \"db.adminCommand('ping').ok\""; then
        success "MongoDB is accessible and responding"
    else
        if docker ps --format "table {{.Names}}" | grep -q "echotune-mongodb"; then
            error "MongoDB container is running but not responding"
        else
            warning "MongoDB container is not running (may be using external database)"
        fi
    fi
    
    # Test Redis
    if test_database "Redis" "echotune-redis" "redis-cli ping"; then
        success "Redis is accessible and responding"
    else
        if docker ps --format "table {{.Names}}" | grep -q "echotune-redis"; then
            error "Redis container is running but not responding"
        else
            warning "Redis container is not running (may be using external cache)"
        fi
    fi
}

# Application-Specific Tests
test_application() {
    section "Application Functionality"
    
    # Test if application logs show successful startup
    if docker logs echotune-app 2>&1 | grep -q "Server.*listening\|Started\|Ready"; then
        success "Application appears to have started successfully"
    else
        warning "Application startup messages not found in logs"
    fi
    
    # Test if there are any critical errors in recent logs
    local error_count
    error_count=$(docker logs echotune-app --since="5m" 2>&1 | grep -i "error\|exception\|fatal" | wc -l)
    if [[ $error_count -eq 0 ]]; then
        success "No critical errors in recent application logs"
    else
        warning "Found $error_count error messages in recent application logs"
    fi
    
    # Test API response format
    local api_response
    api_response=$(curl -s -k "https://localhost/health" 2>/dev/null || echo "")
    if [[ -n "$api_response" ]]; then
        if echo "$api_response" | grep -q "healthy\|ok\|status"; then
            success "Health endpoint returns expected response format"
        else
            warning "Health endpoint response format may be unexpected"
        fi
    fi
}

# Performance Test
test_performance() {
    section "Performance Test"
    
    if command_exists curl; then
        # Test response time
        local response_time
        response_time=$(curl -s -k -w "%{time_total}" -o /dev/null "https://localhost/health" 2>/dev/null || echo "999")
        
        local response_time_ms
        response_time_ms=$(echo "$response_time * 1000" | bc 2>/dev/null || echo "999000")
        response_time_ms=${response_time_ms%.*}  # Remove decimal part
        
        if [[ $response_time_ms -lt 1000 ]]; then
            success "Response time is good (${response_time_ms}ms)"
        elif [[ $response_time_ms -lt 5000 ]]; then
            warning "Response time is acceptable (${response_time_ms}ms)"
        else
            error "Response time is slow (${response_time_ms}ms)"
        fi
        
        # Test concurrent requests if ab is available
        if command_exists ab; then
            info "Running basic load test..."
            local ab_result
            ab_result=$(ab -n 10 -c 2 -q "https://localhost/health" 2>/dev/null | grep "Requests per second" | awk '{print $4}' || echo "0")
            if [[ $(echo "$ab_result > 1" | bc 2>/dev/null || echo "0") -eq 1 ]]; then
                success "Load test completed: $ab_result requests/second"
            else
                warning "Load test failed or returned low performance"
            fi
        fi
    fi
}

# Security Test
test_security() {
    section "Security Configuration"
    
    # Test security headers
    if command_exists curl; then
        local headers
        headers=$(curl -s -I -k "https://localhost/" 2>/dev/null || echo "")
        
        local security_headers=(
            "Strict-Transport-Security"
            "X-Frame-Options"
            "X-Content-Type-Options"
            "X-XSS-Protection"
        )
        
        for header in "${security_headers[@]}"; do
            if echo "$headers" | grep -qi "$header"; then
                success "Security header present: $header"
            else
                warning "Security header missing: $header"
            fi
        done
        
        # Test if server version is hidden
        if echo "$headers" | grep -qi "server:.*nginx"; then
            if echo "$headers" | grep -q "server: nginx$"; then
                success "Server version is hidden"
            else
                warning "Server version may be exposed"
            fi
        fi
    fi
    
    # Test for common security issues
    local insecure_endpoints=(
        "/.env"
        "/config.json"
        "/.git/config"
        "/admin"
        "/phpmyadmin"
    )
    
    for endpoint in "${insecure_endpoints[@]}"; do
        local response
        response=$(make_request "https://$DOMAIN$endpoint" "" 5)
        if [[ "$response" == "404" ]] || [[ "$response" == "403" ]]; then
            success "Secure: $endpoint returns $response"
        elif [[ "$response" == "000" ]]; then
            success "Secure: $endpoint is not accessible"
        else
            warning "Potential security issue: $endpoint returns $response"
        fi
    done
}

# Environment Configuration Test
test_environment() {
    section "Environment Configuration"
    
    # Check if .env file exists
    if [[ -f "/opt/echotune/.env" ]]; then
        success "Environment configuration file exists"
        
        # Check for required environment variables
        local required_vars=(
            "DOMAIN"
            "SPOTIFY_CLIENT_ID"
            "MONGODB_URI"
            "SESSION_SECRET"
            "JWT_SECRET"
        )
        
        for var in "${required_vars[@]}"; do
            if docker exec echotune-app printenv "$var" >/dev/null 2>&1; then
                success "Required environment variable set: $var"
            else
                error "Missing required environment variable: $var"
            fi
        done
        
        # Check for development/debug settings in production
        if docker exec echotune-app printenv "NODE_ENV" 2>/dev/null | grep -q "production"; then
            success "NODE_ENV is set to production"
        else
            warning "NODE_ENV is not set to production"
        fi
        
        if docker exec echotune-app printenv "DEBUG" 2>/dev/null | grep -qi "true"; then
            warning "DEBUG mode appears to be enabled in production"
        else
            success "DEBUG mode is disabled"
        fi
        
    else
        error "Environment configuration file not found"
    fi
}

# Generate test report
generate_report() {
    section "Test Summary"
    
    local total_tests=$((TESTS_PASSED + TESTS_FAILED))
    local success_rate=0
    
    if [[ $total_tests -gt 0 ]]; then
        success_rate=$(( TESTS_PASSED * 100 / total_tests ))
    fi
    
    echo -e "${CYAN}Total Tests: $total_tests${NC}"
    echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}Failed: $TESTS_FAILED${NC}"
    echo -e "${BLUE}Success Rate: $success_rate%${NC}"
    
    if [[ $TESTS_FAILED -gt 0 ]]; then
        echo -e "\n${RED}Failed Tests:${NC}"
        for test in "${FAILED_TESTS[@]}"; do
            echo -e "${RED}  ❌ $test${NC}"
        done
    fi
    
    if [[ $success_rate -ge 90 ]]; then
        echo -e "\n${GREEN}🎉 Deployment is in excellent condition!${NC}"
        return 0
    elif [[ $success_rate -ge 75 ]]; then
        echo -e "\n${YELLOW}⚠️  Deployment is functional but has some issues.${NC}"
        return 1
    else
        echo -e "\n${RED}❌ Deployment has significant issues that need attention.${NC}"
        return 2
    fi
}

# Main function
main() {
    echo -e "${PURPLE}🧪 EchoTune AI Deployment Testing${NC}"
    echo -e "${PURPLE}Domain: $DOMAIN${NC}"
    echo -e "${PURPLE}Primary IP: $PRIMARY_IP${NC}"
    echo -e "${PURPLE}Test started at: $(date)${NC}\n"
    
    test_prerequisites
    test_containers
    test_network
    test_dns_resolution
    test_ssl
    test_endpoints
    test_databases
    test_application
    test_performance
    test_security
    test_environment
    
    echo -e "\n"
    generate_report
}

# Command line options
case "${1:-}" in
    -h|--help)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Test EchoTune AI deployment on DigitalOcean"
        echo ""
        echo "Options:"
        echo "  -h, --help     Show this help"
        echo "  -v, --verbose  Enable verbose output"
        echo "  --quick        Run only essential tests"
        echo ""
        echo "Environment Variables:"
        echo "  DOMAIN         Domain to test (default: primosphere.studio)"
        echo "  PRIMARY_IP     Primary IP address (default: 159.223.207.187)"
        echo "  TEST_TIMEOUT   Request timeout in seconds (default: 30)"
        exit 0
        ;;
    -v|--verbose)
        VERBOSE=true
        shift
        ;;
    --quick)
        # Quick test mode - only run essential tests
        test_containers
        test_endpoints
        generate_report
        exit $?
        ;;
esac

# Run main function
main "$@"