#!/bin/bash
set -euo pipefail

# Service Health Check Script for EchoTune AI
# Tests health endpoints, database connectivity, and Redis if enabled

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

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TIMEOUT=${TIMEOUT:-10}
CHECKS_PASSED=0
CHECKS_TOTAL=0
SERVICES_STATUS=()

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
MONGODB_URI=${MONGODB_URI:-""}
REDIS_URL=${REDIS_URL:-""}
SUPABASE_URL=${SUPABASE_URL:-""}

# Function to run a check and track results
run_service_check() {
    local service_name="$1"
    local check_function="$2"
    
    ((CHECKS_TOTAL++))
    log "Checking $service_name..."
    
    if $check_function; then
        success "$service_name: HEALTHY"
        ((CHECKS_PASSED++))
        SERVICES_STATUS+=("✅ $service_name: HEALTHY")
        return 0
    else
        error "$service_name: UNHEALTHY"
        SERVICES_STATUS+=("❌ $service_name: UNHEALTHY")
        return 1
    fi
}

# Check main application health endpoint
check_app_health() {
    local health_url="$FRONTEND_URL/health"
    local response
    
    log "Testing health endpoint: $health_url"
    
    # Check if endpoint responds
    if response=$(curl -s --max-time "$TIMEOUT" "$health_url" 2>/dev/null); then
        log "Health endpoint response: $response"
        
        # Check if response indicates healthy status
        if echo "$response" | grep -qE "(ok|healthy|success|up)" -i; then
            return 0
        else
            error "Health endpoint returned unexpected response: $response"
            return 1
        fi
    else
        error "Health endpoint is not responding"
        return 1
    fi
}

# Check API endpoint
check_api_health() {
    local api_url="$FRONTEND_URL/api/health"
    local response
    local status_code
    
    log "Testing API endpoint: $api_url"
    
    # Check API health with status code
    if response=$(curl -s --max-time "$TIMEOUT" -w "\n%{http_code}" "$api_url" 2>/dev/null); then
        status_code=$(echo "$response" | tail -n1)
        response_body=$(echo "$response" | head -n -1)
        
        log "API response (status $status_code): $response_body"
        
        if [[ "$status_code" == "200" ]]; then
            return 0
        else
            error "API returned status code: $status_code"
            return 1
        fi
    else
        error "API endpoint is not responding"
        return 1
    fi
}

# Check WebSocket connectivity
check_websocket() {
    local ws_url="wss://$DOMAIN/socket.io/?EIO=4&transport=websocket"
    
    log "Testing WebSocket connectivity..."
    
    # Simple WebSocket test using curl (if available)
    if command -v wscat >/dev/null 2>&1; then
        if timeout 5 wscat -c "$ws_url" --max-time 3 >/dev/null 2>&1; then
            return 0
        else
            error "WebSocket connection failed"
            return 1
        fi
    else
        # Fallback: check if the WebSocket endpoint returns upgrade headers
        local headers
        if headers=$(curl -s -I --max-time "$TIMEOUT" \
            -H "Connection: Upgrade" \
            -H "Upgrade: websocket" \
            -H "Sec-WebSocket-Version: 13" \
            -H "Sec-WebSocket-Key: test" \
            "$FRONTEND_URL/socket.io/" 2>/dev/null); then
            
            if echo "$headers" | grep -qi "upgrade.*websocket"; then
                return 0
            else
                warning "WebSocket upgrade headers not found"
                return 1
            fi
        else
            error "WebSocket endpoint check failed"
            return 1
        fi
    fi
}

# Check MongoDB connectivity
check_mongodb() {
    if [[ -z "$MONGODB_URI" ]]; then
        warning "MongoDB URI not configured, skipping check"
        return 0
    fi
    
    log "Testing MongoDB connectivity..."
    
    # Try to connect using mongosh or mongo client
    if command -v mongosh >/dev/null 2>&1; then
        if timeout "$TIMEOUT" mongosh "$MONGODB_URI" --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
            return 0
        else
            error "MongoDB connection failed (using mongosh)"
            return 1
        fi
    elif command -v mongo >/dev/null 2>&1; then
        if timeout "$TIMEOUT" mongo "$MONGODB_URI" --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
            return 0
        else
            error "MongoDB connection failed (using mongo)"
            return 1
        fi
    else
        # Fallback: try to parse URI and test basic connectivity
        local host_port
        if host_port=$(echo "$MONGODB_URI" | grep -oP '(?<=://)[^/]+' | head -1); then
            local host=$(echo "$host_port" | cut -d: -f1)
            local port=$(echo "$host_port" | cut -d: -f2)
            port=${port:-27017}
            
            if timeout "$TIMEOUT" bash -c "</dev/tcp/$host/$port" 2>/dev/null; then
                warning "MongoDB port is reachable, but cannot verify authentication"
                return 0
            else
                error "MongoDB is not reachable at $host:$port"
                return 1
            fi
        else
            error "Could not parse MongoDB URI"
            return 1
        fi
    fi
}

# Check Redis connectivity
check_redis() {
    if [[ -z "$REDIS_URL" ]]; then
        warning "Redis URL not configured, skipping check"
        return 0
    fi
    
    log "Testing Redis connectivity..."
    
    # Try to connect using redis-cli
    if command -v redis-cli >/dev/null 2>&1; then
        # Parse Redis URL to extract connection details
        local redis_host="localhost"
        local redis_port="6379"
        local redis_auth=""
        
        if [[ "$REDIS_URL" =~ ^redis://([^:@]+):([^@]+)@([^:]+):([0-9]+) ]]; then
            redis_auth="${BASH_REMATCH[2]}"
            redis_host="${BASH_REMATCH[3]}"
            redis_port="${BASH_REMATCH[4]}"
        elif [[ "$REDIS_URL" =~ ^redis://([^:]+):([0-9]+) ]]; then
            redis_host="${BASH_REMATCH[1]}"
            redis_port="${BASH_REMATCH[2]}"
        fi
        
        local redis_cmd="redis-cli -h $redis_host -p $redis_port"
        if [[ -n "$redis_auth" ]]; then
            redis_cmd="$redis_cmd -a $redis_auth"
        fi
        
        if timeout "$TIMEOUT" $redis_cmd ping >/dev/null 2>&1; then
            return 0
        else
            error "Redis connection failed"
            return 1
        fi
    else
        # Fallback: test basic connectivity
        local host_port
        if host_port=$(echo "$REDIS_URL" | grep -oP '(?<=://)[^/]+' | head -1); then
            local host=$(echo "$host_port" | cut -d: -f1)
            local port=$(echo "$host_port" | cut -d: -f2)
            port=${port:-6379}
            
            if timeout "$TIMEOUT" bash -c "</dev/tcp/$host/$port" 2>/dev/null; then
                warning "Redis port is reachable, but cannot verify authentication"
                return 0
            else
                error "Redis is not reachable at $host:$port"
                return 1
            fi
        else
            error "Could not parse Redis URL"
            return 1
        fi
    fi
}

# Check Supabase connectivity
check_supabase() {
    if [[ -z "$SUPABASE_URL" ]]; then
        warning "Supabase URL not configured, skipping check"
        return 0
    fi
    
    log "Testing Supabase connectivity..."
    
    local supabase_health_url="$SUPABASE_URL/rest/v1/"
    local response
    
    # Test Supabase REST API
    if response=$(curl -s --max-time "$TIMEOUT" \
        -H "apikey: ${SUPABASE_ANON_KEY:-}" \
        "$supabase_health_url" 2>/dev/null); then
        
        # Check if we get a valid response (even if empty, it means connection works)
        if [[ -n "$response" ]] || curl -s --max-time "$TIMEOUT" -I "$supabase_health_url" | grep -q "200 OK"; then
            return 0
        else
            error "Supabase API returned unexpected response"
            return 1
        fi
    else
        error "Supabase connection failed"
        return 1
    fi
}

# Check external API dependencies
check_external_apis() {
    log "Testing external API dependencies..."
    
    local apis=()
    local all_good=true
    
    # Spotify API
    if curl -s --max-time "$TIMEOUT" "https://api.spotify.com/v1/" >/dev/null 2>&1; then
        apis+=("✅ Spotify API: Reachable")
    else
        apis+=("❌ Spotify API: Unreachable")
        all_good=false
    fi
    
    # Spotify Accounts
    if curl -s --max-time "$TIMEOUT" "https://accounts.spotify.com/" >/dev/null 2>&1; then
        apis+=("✅ Spotify Accounts: Reachable")
    else
        apis+=("❌ Spotify Accounts: Unreachable")
        all_good=false
    fi
    
    # Display results
    for api in "${apis[@]}"; do
        echo "  $api"
    done
    
    return $($all_good && echo 0 || echo 1)
}

# Check system resources
check_system_resources() {
    log "Checking system resources..."
    
    # Memory usage
    local memory_info
    if memory_info=$(free -m 2>/dev/null); then
        local memory_usage=$(echo "$memory_info" | awk 'NR==2{printf "%.1f%%", $3*100/$2}')
        log "Memory usage: $memory_usage"
        
        # Check if memory usage is high
        local memory_percent=$(echo "$memory_usage" | sed 's/%//')
        if (( $(echo "$memory_percent > 90" | bc -l 2>/dev/null || echo 0) )); then
            warning "High memory usage: $memory_usage"
        fi
    fi
    
    # Disk usage
    local disk_info
    if disk_info=$(df -h / 2>/dev/null); then
        local disk_usage=$(echo "$disk_info" | awk 'NR==2{print $5}')
        log "Disk usage: $disk_usage"
        
        # Check if disk usage is high
        local disk_percent=$(echo "$disk_usage" | sed 's/%//')
        if [[ $disk_percent -gt 90 ]]; then
            warning "High disk usage: $disk_usage"
        fi
    fi
    
    # Load average (if available)
    if [[ -f /proc/loadavg ]]; then
        local load_avg=$(cat /proc/loadavg | cut -d' ' -f1-3)
        log "Load average: $load_avg"
    fi
    
    return 0
}

# Generate services summary report
generate_services_report() {
    header "Services Health Summary"
    echo
    echo -e "${BOLD}Domain:${NC} $DOMAIN"
    echo -e "${BOLD}Frontend URL:${NC} $FRONTEND_URL"
    echo -e "${BOLD}Timestamp:${NC} $(date)"
    echo
    
    echo -e "${BOLD}Service Status:${NC}"
    for status in "${SERVICES_STATUS[@]}"; do
        echo "  $status"
    done
    
    echo
    echo -e "${BOLD}Summary:${NC}"
    echo -e "  Services Healthy: ${GREEN}$CHECKS_PASSED${NC}"
    echo -e "  Services Total:   $CHECKS_TOTAL"
    
    if [[ $CHECKS_PASSED -eq $CHECKS_TOTAL ]]; then
        echo -e "  Overall Status:   ${GREEN}✅ ALL SERVICES HEALTHY${NC}"
        return 0
    else
        echo -e "  Overall Status:   ${RED}❌ SOME SERVICES UNHEALTHY${NC}"
        return 1
    fi
}

# Main execution function
main() {
    header "Service Health Check for EchoTune AI"
    echo "Checking all service dependencies and health endpoints..."
    echo
    
    # Run all service checks
    run_service_check "Application Health" check_app_health
    run_service_check "API Health" check_api_health
    run_service_check "WebSocket" check_websocket
    run_service_check "MongoDB" check_mongodb
    run_service_check "Redis" check_redis
    run_service_check "Supabase" check_supabase
    run_service_check "External APIs" check_external_apis
    run_service_check "System Resources" check_system_resources
    
    echo
    generate_services_report
}

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [--quick] [--db-only] [--api-only] [--external-only]"
        echo "  --quick        Check only essential services"
        echo "  --db-only      Check only database connections"
        echo "  --api-only     Check only API endpoints"
        echo "  --external-only Check only external dependencies"
        exit 0
        ;;
    --quick)
        run_service_check "Application Health" check_app_health
        run_service_check "API Health" check_api_health
        generate_services_report
        ;;
    --db-only)
        run_service_check "MongoDB" check_mongodb
        run_service_check "Redis" check_redis
        run_service_check "Supabase" check_supabase
        generate_services_report
        ;;
    --api-only)
        run_service_check "Application Health" check_app_health
        run_service_check "API Health" check_api_health
        run_service_check "WebSocket" check_websocket
        generate_services_report
        ;;
    --external-only)
        run_service_check "External APIs" check_external_apis
        generate_services_report
        ;;
    *)
        main
        ;;
esac