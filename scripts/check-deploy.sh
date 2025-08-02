#!/bin/bash
set -euo pipefail

# Deployment Check Script for EchoTune AI
# Validates container status, port checks, SSL certificates, and environment variables

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

header() {
    echo -e "${BOLD}${BLUE}=== $1 ===${NC}"
}

# Global variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CHECKS_PASSED=0
CHECKS_TOTAL=0
ERRORS=()

# Load environment variables
if [[ -f "$PROJECT_ROOT/.env" ]]; then
    source "$PROJECT_ROOT/.env"
elif [[ -f "$PROJECT_ROOT/.env.production.example" ]]; then
    warning "No .env found, using .env.production.example"
    source "$PROJECT_ROOT/.env.production.example"
fi

# Configuration
DOMAIN=${DOMAIN:-"primosphere.studio"}
FRONTEND_URL=${FRONTEND_URL:-"https://$DOMAIN"}
BACKEND_PORT=${BACKEND_PORT:-3000}
NGINX_HTTP_PORT=${NGINX_HTTP_PORT:-80}
NGINX_HTTPS_PORT=${NGINX_HTTPS_PORT:-443}
SSL_CERT_PATH=${SSL_CERT_PATH:-"/etc/nginx/ssl"}

# Function to run a check and track results
run_check() {
    local check_name="$1"
    local check_function="$2"
    
    ((CHECKS_TOTAL++))
    log "Running check: $check_name"
    
    if $check_function; then
        success "$check_name: PASSED"
        ((CHECKS_PASSED++))
        return 0
    else
        error "$check_name: FAILED"
        ERRORS+=("$check_name")
        return 1
    fi
}

# Check if Docker is running
check_docker() {
    if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
        return 0
    else
        error "Docker is not running or not accessible"
        return 1
    fi
}

# Check if Docker Compose is available
check_docker_compose() {
    if command -v docker-compose >/dev/null 2>&1 || docker compose version >/dev/null 2>&1; then
        return 0
    else
        error "Docker Compose is not available"
        return 1
    fi
}

# Check container status
check_containers() {
    local compose_cmd="docker-compose"
    if ! command -v docker-compose >/dev/null 2>&1; then
        compose_cmd="docker compose"
    fi
    
    log "Checking container status..."
    
    # Check if containers are running
    local containers
    if containers=$($compose_cmd ps -q 2>/dev/null); then
        if [[ -z "$containers" ]]; then
            error "No containers are running"
            return 1
        fi
        
        # Check individual container health
        local healthy=true
        for container in $containers; do
            local container_name=$(docker inspect --format='{{.Name}}' "$container" | sed 's/\///')
            local status=$(docker inspect --format='{{.State.Status}}' "$container")
            local health=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "none")
            
            log "Container $container_name: $status (health: $health)"
            
            if [[ "$status" != "running" ]]; then
                error "Container $container_name is not running"
                healthy=false
            fi
            
            if [[ "$health" == "unhealthy" ]]; then
                error "Container $container_name is unhealthy"
                healthy=false
            fi
        done
        
        return $($healthy && echo 0 || echo 1)
    else
        error "Failed to get container status"
        return 1
    fi
}

# Check port availability and connectivity
check_ports() {
    local ports=("$NGINX_HTTP_PORT" "$NGINX_HTTPS_PORT" "$BACKEND_PORT")
    local all_good=true
    
    for port in "${ports[@]}"; do
        log "Checking port $port..."
        
        # Check if port is open
        if nc -z localhost "$port" >/dev/null 2>&1; then
            success "Port $port is open"
        else
            error "Port $port is not accessible"
            all_good=false
        fi
    done
    
    return $($all_good && echo 0 || echo 1)
}

# Check SSL certificate validity
check_ssl_certificate() {
    log "Checking SSL certificate..."
    
    # Check if SSL files exist
    if [[ ! -f "$SSL_CERT_PATH/cert.pem" ]] || [[ ! -f "$SSL_CERT_PATH/key.pem" ]]; then
        error "SSL certificate files not found in $SSL_CERT_PATH"
        return 1
    fi
    
    # Check certificate validity
    if ! openssl x509 -in "$SSL_CERT_PATH/cert.pem" -text -noout >/dev/null 2>&1; then
        error "SSL certificate is invalid"
        return 1
    fi
    
    # Check certificate expiry
    local expiry_date=$(openssl x509 -in "$SSL_CERT_PATH/cert.pem" -noout -enddate | cut -d= -f2)
    local days_until_expiry=$(( ($(date -d "$expiry_date" +%s) - $(date +%s)) / 86400 ))
    
    if [[ $days_until_expiry -lt 7 ]]; then
        warning "SSL certificate expires in $days_until_expiry days"
    elif [[ $days_until_expiry -lt 0 ]]; then
        error "SSL certificate has expired"
        return 1
    else
        log "SSL certificate valid for $days_until_expiry days"
    fi
    
    # Check certificate domain
    local cert_domain=$(openssl x509 -in "$SSL_CERT_PATH/cert.pem" -noout -subject | grep -o 'CN=.*' | cut -d= -f2 | cut -d/ -f1)
    if [[ "$cert_domain" == "$DOMAIN" ]] || [[ "$cert_domain" == "*.$DOMAIN" ]]; then
        log "Certificate domain matches: $cert_domain"
    else
        warning "Certificate domain ($cert_domain) doesn't match expected domain ($DOMAIN)"
    fi
    
    return 0
}

# Check required environment variables
check_environment_variables() {
    local required_vars=(
        "DOMAIN"
        "NODE_ENV"
        "PORT"
        "SESSION_SECRET"
        "SPOTIFY_CLIENT_ID"
        "SPOTIFY_CLIENT_SECRET"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        else
            log "$var is set"
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        error "Missing required environment variables: ${missing_vars[*]}"
        return 1
    fi
    
    # Check if secrets are properly set (not default values)
    if [[ "${SESSION_SECRET:-}" == "your_super_secure_random_session_secret_min_32_chars" ]]; then
        error "SESSION_SECRET is still set to default value"
        return 1
    fi
    
    return 0
}

# Check HTTP/HTTPS connectivity
check_web_connectivity() {
    log "Checking web connectivity..."
    
    # Check HTTP to HTTPS redirect
    local http_status
    if http_status=$(curl -s -o /dev/null -w "%{http_code}" "http://$DOMAIN" --max-time 10 2>/dev/null); then
        if [[ "$http_status" == "301" ]] || [[ "$http_status" == "302" ]]; then
            success "HTTP to HTTPS redirect working (status: $http_status)"
        else
            warning "Unexpected HTTP status: $http_status"
        fi
    else
        error "Failed to connect to HTTP endpoint"
        return 1
    fi
    
    # Check HTTPS connectivity
    local https_status
    if https_status=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/health" --max-time 10 2>/dev/null); then
        if [[ "$https_status" == "200" ]]; then
            success "HTTPS health endpoint accessible (status: $https_status)"
        else
            warning "HTTPS health endpoint returned status: $https_status"
        fi
    else
        error "Failed to connect to HTTPS health endpoint"
        return 1
    fi
    
    return 0
}

# Check application health
check_application_health() {
    log "Checking application health..."
    
    # Check backend health
    local backend_health
    if backend_health=$(curl -s "$FRONTEND_URL/health" --max-time 10 2>/dev/null); then
        if echo "$backend_health" | grep -q "ok\|healthy\|success"; then
            success "Backend health check passed"
        else
            warning "Backend health check returned: $backend_health"
        fi
    else
        error "Backend health check failed"
        return 1
    fi
    
    # Check if frontend is serving
    local frontend_content
    if frontend_content=$(curl -s "$FRONTEND_URL" --max-time 10 2>/dev/null); then
        if echo "$frontend_content" | grep -q "EchoTune"; then
            success "Frontend is serving content"
        else
            warning "Frontend content doesn't contain expected text"
        fi
    else
        error "Failed to fetch frontend content"
        return 1
    fi
    
    return 0
}

# Generate summary report
generate_report() {
    header "DEPLOYMENT CHECK SUMMARY"
    echo
    echo -e "${BOLD}Domain:${NC} $DOMAIN"
    echo -e "${BOLD}Frontend URL:${NC} $FRONTEND_URL"
    echo -e "${BOLD}Environment:${NC} ${NODE_ENV:-unknown}"
    echo -e "${BOLD}Timestamp:${NC} $(date)"
    echo
    
    echo -e "${BOLD}Results:${NC}"
    echo -e "  Checks Passed: ${GREEN}$CHECKS_PASSED${NC}"
    echo -e "  Checks Total:  $CHECKS_TOTAL"
    echo -e "  Success Rate:  $(( CHECKS_PASSED * 100 / CHECKS_TOTAL ))%"
    
    if [[ ${#ERRORS[@]} -gt 0 ]]; then
        echo
        echo -e "${BOLD}${RED}Failed Checks:${NC}"
        for error in "${ERRORS[@]}"; do
            echo -e "  ${RED}✗${NC} $error"
        done
        echo
        echo -e "${RED}${BOLD}❌ DEPLOYMENT CHECK FAILED${NC}"
        return 1
    else
        echo
        echo -e "${GREEN}${BOLD}✅ ALL CHECKS PASSED${NC}"
        return 0
    fi
}

# Main execution
main() {
    header "EchoTune AI Deployment Check"
    echo "Checking deployment health and configuration..."
    echo
    
    # Run all checks
    run_check "Docker availability" check_docker
    run_check "Docker Compose availability" check_docker_compose
    run_check "Container status" check_containers
    run_check "Port connectivity" check_ports
    run_check "SSL certificate" check_ssl_certificate
    run_check "Environment variables" check_environment_variables
    run_check "Web connectivity" check_web_connectivity
    run_check "Application health" check_application_health
    
    echo
    generate_report
}

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [--quick] [--ssl-only] [--env-only]"
        echo "  --quick    Run only essential checks"
        echo "  --ssl-only Check only SSL certificate"
        echo "  --env-only Check only environment variables"
        exit 0
        ;;
    --quick)
        run_check "Container status" check_containers
        run_check "Port connectivity" check_ports
        run_check "Application health" check_application_health
        generate_report
        ;;
    --ssl-only)
        run_check "SSL certificate" check_ssl_certificate
        generate_report
        ;;
    --env-only)
        run_check "Environment variables" check_environment_variables
        generate_report
        ;;
    *)
        main
        ;;
esac