#!/bin/bash

# EchoTune AI - Smoke Validation Script
# Validates core internal endpoints for CI/CD pipeline readiness

set -euo pipefail

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
readonly SMOKE_REPORT_FILE="$PROJECT_ROOT/smoke_report.json"
readonly SERVER_PORT=${PORT:-3000}
readonly NODE_ENV=${NODE_ENV:-test}
readonly ENABLE_DEMO_ROUTES=${ENABLE_DEMO_ROUTES:-1}
readonly MAX_ATTEMPTS=60
readonly POLL_INTERVAL=1

# Global variables
server_pid=""
start_time=""
attempts=0

# Cleanup function
cleanup() {
    echo "🧹 Cleaning up..."
    if [[ -n "$server_pid" ]]; then
        echo "Terminating server (PID: $server_pid)..."
        kill "$server_pid" 2>/dev/null || true
        wait "$server_pid" 2>/dev/null || true
        echo "Server terminated"
    fi
}

# Set trap for cleanup
trap cleanup EXIT INT TERM

# Logging functions
log_info() {
    echo "ℹ️  $1"
}

log_success() {
    echo "✅ $1"
}

log_error() {
    echo "❌ $1" >&2
}

log_warning() {
    echo "⚠️  $1"
}

# Dependency check
check_dependencies() {
    log_info "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    if ! command -v curl &> /dev/null; then
        log_error "curl is not installed"
        exit 1
    fi
    
    log_success "All dependencies available"
}

# Install dependencies if needed
install_dependencies() {
    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        log_error "package.json not found in project root"
        exit 1
    fi
    
    # For smoke testing, we need dev dependencies for pino-pretty
    if [[ ! -d "$PROJECT_ROOT/node_modules" ]] || [[ ! -f "$PROJECT_ROOT/node_modules/pino-pretty/package.json" ]]; then
        log_info "Installing dependencies (including dev dependencies for smoke testing)..."
        cd "$PROJECT_ROOT"
        npm ci --silent
        log_success "Dependencies installed"
    else
        log_info "Dependencies already available"
    fi
}

# Start server in background
start_server() {
    log_info "Starting server on port $SERVER_PORT..."
    
    cd "$PROJECT_ROOT"
    
    # Start server in background with output redirection
    env NODE_ENV="$NODE_ENV" PORT="$SERVER_PORT" ENABLE_DEMO_ROUTES="$ENABLE_DEMO_ROUTES" \
        nohup node server.js > /dev/null 2>&1 &
    server_pid=$!
    
    log_info "Server started with PID: $server_pid"
}

# Check if URL is accessible
check_url() {
    local url=$1
    local expected_status=${2:-200}
    
    # Use curl with timeout and follow redirects
    local response
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        --max-time 5 \
        --retry 0 \
        --connect-timeout 2 \
        "$url" 2>/dev/null || echo "000")
    
    if [[ "$response" == "$expected_status" ]]; then
        return 0
    else
        return 1
    fi
}

# Get response content from URL
get_url_content() {
    local url=$1
    local max_lines=${2:-5}
    
    curl -s --max-time 5 --connect-timeout 2 "$url" 2>/dev/null | \
        grep -v '^#' | \
        head -n "$max_lines" | \
        tr '\n' ' ' | \
        sed 's/"/\\"/g'
}

# Poll health endpoints
poll_endpoints() {
    log_info "Polling endpoints (max $MAX_ATTEMPTS attempts, ${POLL_INTERVAL}s interval)..."
    
    local base_url="http://localhost:$SERVER_PORT"
    local health_status="000"
    local ready_status="000"
    local metrics_status="000"
    local metrics_sample=""
    
    for ((i=1; i<=MAX_ATTEMPTS; i++)); do
        attempts=$i
        log_info "Attempt $i/$MAX_ATTEMPTS..."
        
        # Check health endpoint
        if check_url "$base_url/internal/health"; then
            health_status="200"
            log_success "Health endpoint responding"
        fi
        
        # Check ready endpoint (allow 503 initially)
        if check_url "$base_url/internal/ready"; then
            ready_status="200"
            log_success "Ready endpoint responding (200)"
        elif check_url "$base_url/internal/ready" "503"; then
            ready_status="503"
            log_warning "Ready endpoint responding (503) - service not yet ready"
        fi
        
        # Check metrics endpoint
        if check_url "$base_url/internal/metrics"; then
            metrics_status="200"
            metrics_sample=$(get_url_content "$base_url/internal/metrics" 5)
            log_success "Metrics endpoint responding"
        fi
        
        # Check if we have successful responses
        if [[ "$health_status" == "200" && "$ready_status" == "200" && "$metrics_status" == "200" ]]; then
            log_success "All endpoints responding successfully!"
            break
        fi
        
        # Exit early if we've exceeded max attempts
        if [[ $i -eq $MAX_ATTEMPTS ]]; then
            log_error "Maximum attempts reached without full success"
            break
        fi
        
        sleep $POLL_INTERVAL
    done
    
    # Generate smoke report
    generate_report "$health_status" "$ready_status" "$metrics_status" "$metrics_sample"
    
    # Determine overall success
    if [[ "$health_status" == "200" && "$ready_status" == "200" && "$metrics_status" == "200" ]]; then
        return 0
    else
        return 1
    fi
}

# Generate JSON report
generate_report() {
    local health_status=$1
    local ready_status=$2
    local metrics_status=$3
    local metrics_sample=$4
    
    local end_time
    end_time=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
    
    local duration_ms
    if [[ -n "$start_time" ]]; then
        local start_epoch end_epoch
        start_epoch=$(date -d "$start_time" +%s.%3N 2>/dev/null || date -d "$start_time" +%s)
        end_epoch=$(date -d "$end_time" +%s.%3N 2>/dev/null || date -d "$end_time" +%s)
        duration_ms=$(echo "($end_epoch - $start_epoch) * 1000" | bc 2>/dev/null || echo "0")
    else
        duration_ms="0"
    fi
    
    local success="false"
    if [[ "$health_status" == "200" && "$ready_status" == "200" && "$metrics_status" == "200" ]]; then
        success="true"
    fi
    
    # Generate JSON report using printf to avoid dependency on jq
    cat > "$SMOKE_REPORT_FILE" <<EOF
{
  "timestamp_iso": "$end_time",
  "attempts": $attempts,
  "health_http_code": "$health_status",
  "ready_http_code": "$ready_status",
  "metrics_http_code": "$metrics_status",
  "metrics_sample_excerpt": "$metrics_sample",
  "success": $success,
  "duration_ms": "$duration_ms",
  "server_port": $SERVER_PORT,
  "node_env": "$NODE_ENV",
  "demo_routes_enabled": "$ENABLE_DEMO_ROUTES"
}
EOF
    
    log_info "Smoke report generated: $SMOKE_REPORT_FILE"
}

# Main execution
main() {
    echo "🔥 EchoTune AI - Smoke Validation Script"
    echo "========================================"
    
    start_time=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
    
    # Pre-flight checks
    check_dependencies
    install_dependencies
    
    # Start server and test endpoints
    start_server
    
    # Wait a moment for server to initialize
    sleep 2
    
    # Poll endpoints and generate report
    if poll_endpoints; then
        log_success "Smoke validation PASSED ✨"
        echo ""
        echo "📊 Report Summary:"
        if command -v jq &> /dev/null; then
            jq '.' "$SMOKE_REPORT_FILE" 2>/dev/null || cat "$SMOKE_REPORT_FILE"
        else
            cat "$SMOKE_REPORT_FILE"
        fi
        exit 0
    else
        log_error "Smoke validation FAILED 💥"
        echo ""
        echo "📊 Failure Report:"
        if command -v jq &> /dev/null; then
            jq '.' "$SMOKE_REPORT_FILE" 2>/dev/null || cat "$SMOKE_REPORT_FILE"
        else
            cat "$SMOKE_REPORT_FILE"
        fi
        exit 1
    fi
}

# Execute main function
main "$@"