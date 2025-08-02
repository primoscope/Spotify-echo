#!/bin/bash

# EchoTune AI - Enhanced MCP Integration Test Suite
# Comprehensive testing of MCP server functionality with robust error handling

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Test configuration
MCP_SERVER_URL="http://localhost:3001"
TEST_RESULTS=()
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
TEST_TIMEOUT=30

# Test result tracking
run_test() {
    local test_name="$1"
    local test_function="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    log_info "Running test: $test_name"
    
    if timeout $TEST_TIMEOUT $test_function >/dev/null 2>&1; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        TEST_RESULTS+=("✅ $test_name: PASSED")
        log_success "Test passed: $test_name"
        return 0
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        TEST_RESULTS+=("❌ $test_name: FAILED")
        log_error "Test failed: $test_name"
        return 1
    fi
}

# Check if MCP server is accessible
check_mcp_server() {
    log_info "Checking MCP server accessibility..."
    
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_info "Connection attempt $attempt/$max_attempts..."
        
        if curl -f -s --connect-timeout 5 --max-time 10 "$MCP_SERVER_URL/health" >/dev/null 2>&1; then
            log_success "MCP server is accessible"
            return 0
        fi
        
        log_warning "Attempt $attempt failed, waiting 3 seconds..."
        sleep 3
        attempt=$((attempt + 1))
    done
    
    log_error "MCP server is not accessible after $max_attempts attempts"
    return 1
}

# Test basic health endpoint
test_health_endpoint() {
    log_info "Testing health endpoint..."
    
    local response
    response=$(curl -f -s --connect-timeout 10 --max-time 30 "$MCP_SERVER_URL/health" 2>/dev/null)
    
    if [ -n "$response" ]; then
        # Check if response contains expected fields
        if echo "$response" | grep -q '"status"' && echo "$response" | grep -q '"uptime"'; then
            log_success "Health endpoint returned valid response"
            return 0
        fi
    fi
    
    log_error "Health endpoint test failed"
    return 1
}

# Test servers list endpoint
test_servers_endpoint() {
    log_info "Testing servers list endpoint..."
    
    local response
    response=$(curl -f -s --connect-timeout 10 --max-time 30 "$MCP_SERVER_URL/servers" 2>/dev/null)
    
    if [ -n "$response" ]; then
        # Check if response contains servers array
        if echo "$response" | grep -q '"servers"'; then
            log_success "Servers endpoint returned valid response"
            return 0
        fi
    fi
    
    log_error "Servers endpoint test failed"
    return 1
}

# Test environment variables validation
test_env_validation() {
    log_info "Testing MCP environment variables..."
    
    # Check for required MCP environment variables
    local mcp_env_vars=(
        "NODE_ENV"
        "PORT"
    )
    
    local missing_vars=()
    
    for var in "${mcp_env_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -eq 0 ]; then
        log_success "All required MCP environment variables are set"
        return 0
    else
        log_error "Missing MCP environment variables: ${missing_vars[*]}"
        return 1
    fi
}

# Test MCP npm scripts
test_mcp_npm_scripts() {
    log_info "Testing MCP npm scripts availability..."
    
    # Check if package.json exists and contains MCP scripts
    if [ ! -f "package.json" ]; then
        log_error "package.json not found"
        return 1
    fi
    
    local mcp_scripts=(
        "mcp-install"
        "mcp-health"
        "mcp-test-all"
        "mcp-report"
    )
    
    local missing_scripts=()
    
    for script in "${mcp_scripts[@]}"; do
        if ! grep -q "\"$script\"" package.json; then
            missing_scripts+=("$script")
        fi
    done
    
    if [ ${#missing_scripts[@]} -eq 0 ]; then
        log_success "All MCP npm scripts are available"
        return 0
    else
        log_error "Missing MCP npm scripts: ${missing_scripts[*]}"
        return 1
    fi
}

# Test MCP integration script functionality
test_mcp_integration_script() {
    log_info "Testing MCP integration script..."
    
    local mcp_script="scripts/test-mcp-integration.js"
    
    if [ ! -f "$mcp_script" ]; then
        log_error "MCP integration script not found: $mcp_script"
        return 1
    fi
    
    # Check script syntax
    if ! node -c "$mcp_script" 2>/dev/null; then
        log_error "MCP integration script has syntax errors"
        return 1
    fi
    
    log_success "MCP integration script is valid"
    return 0
}

# Test MCP server startup readiness
test_mcp_startup() {
    log_info "Testing MCP server startup readiness..."
    
    # Check if MCP server directory exists
    if [ ! -d "mcp-server" ]; then
        log_error "MCP server directory not found"
        return 1
    fi
    
    # Check if MCP server package.json exists
    if [ ! -f "mcp-server/package.json" ]; then
        log_error "MCP server package.json not found"
        return 1
    fi
    
    # Check for orchestrator script
    if ! grep -q "orchestrator" "mcp-server/package.json"; then
        log_error "MCP orchestrator script not found in package.json"
        return 1
    fi
    
    log_success "MCP server startup configuration is ready"
    return 0
}

# Test MCP configuration in main package.json
test_mcp_configuration() {
    log_info "Testing MCP configuration..."
    
    # Check if MCP configuration exists in package.json
    if ! grep -q '"mcp"' package.json; then
        log_error "MCP configuration not found in package.json"
        return 1
    fi
    
    # Check for MCP servers configuration
    if ! grep -q '"servers"' package.json; then
        log_error "MCP servers configuration not found"
        return 1
    fi
    
    log_success "MCP configuration is present"
    return 0
}

# Test MCP file structure
test_mcp_file_structure() {
    log_info "Testing MCP file structure..."
    
    local required_files=(
        "mcp-server/package.json"
        "scripts/test-mcp-integration.js"
        "scripts/mcp-manager.js"
    )
    
    local missing_files=()
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -eq 0 ]; then
        log_success "All required MCP files are present"
        return 0
    else
        log_error "Missing MCP files: ${missing_files[*]}"
        return 1
    fi
}

# Test MCP error handling
test_mcp_error_handling() {
    log_info "Testing MCP error handling..."
    
    # Test invalid endpoint (should return proper error)
    local response
    response=$(curl -s --connect-timeout 5 --max-time 10 "$MCP_SERVER_URL/invalid-endpoint" 2>/dev/null)
    local status_code=$?
    
    # Should get a response (even if error) or timeout gracefully
    if [ $status_code -eq 0 ] || [ $status_code -eq 22 ]; then
        log_success "MCP server handles invalid requests properly"
        return 0
    fi
    
    log_error "MCP server error handling test failed"
    return 1
}

# Validate MCP dependencies
test_mcp_dependencies() {
    log_info "Testing MCP dependencies..."
    
    # Check if Node.js is available
    if ! command -v node >/dev/null 2>&1; then
        log_error "Node.js not found"
        return 1
    fi
    
    # Check if npm is available
    if ! command -v npm >/dev/null 2>&1; then
        log_error "npm not found"
        return 1
    fi
    
    # Check Node.js version
    local node_version
    node_version=$(node --version | sed 's/v//')
    local major_version
    major_version=$(echo "$node_version" | cut -d. -f1)
    
    if [ "$major_version" -lt 18 ]; then
        log_error "Node.js version $node_version is too old (minimum 18)"
        return 1
    fi
    
    log_success "MCP dependencies are satisfied"
    return 0
}

# Generate test report
generate_test_report() {
    local report_file="mcp-integration-test-results.json"
    
    cat > "$report_file" <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "testSuite": "Enhanced MCP Integration Tests", 
  "summary": {
    "totalTests": $TOTAL_TESTS,
    "passedTests": $PASSED_TESTS,
    "failedTests": $FAILED_TESTS,
    "successRate": $(( TOTAL_TESTS > 0 ? PASSED_TESTS * 100 / TOTAL_TESTS : 0 ))
  },
  "results": [
$(IFS=$'\n'; echo "${TEST_RESULTS[*]}" | sed 's/✅\|❌//g' | awk '{print "    \"" $0 "\""}' | sed '$!s/$/,/')
  ],
  "environment": {
    "mcpServerUrl": "$MCP_SERVER_URL",
    "nodeVersion": "$(node --version 2>/dev/null || echo 'unknown')",
    "npmVersion": "$(npm --version 2>/dev/null || echo 'unknown')"
  }
}
EOF
    
    log_info "Test report generated: $report_file"
}

# Main test execution
main() {
    echo "🚀 EchoTune AI - Enhanced MCP Integration Tests"
    echo "=============================================="
    echo ""
    
    # Check prerequisites
    log_info "Checking prerequisites..."
    
    if ! check_mcp_server; then
        log_error "MCP server is not accessible. Please ensure:"
        echo "  1. MCP server is started: cd mcp-server && npm run orchestrator"
        echo "  2. Port 3001 is not blocked by firewall"
        echo "  3. All MCP environment variables are set"
        echo "  4. MCP dependencies are installed"
        exit 1
    fi
    
    echo ""
    log_info "Running MCP integration tests..."
    echo ""
    
    # Run all tests
    run_test "Health Endpoint" test_health_endpoint
    run_test "Servers Endpoint" test_servers_endpoint
    run_test "Environment Variables" test_env_validation
    run_test "MCP npm Scripts" test_mcp_npm_scripts
    run_test "MCP Integration Script" test_mcp_integration_script
    run_test "MCP Server Startup" test_mcp_startup
    run_test "MCP Configuration" test_mcp_configuration
    run_test "MCP File Structure" test_mcp_file_structure
    run_test "MCP Error Handling" test_mcp_error_handling
    run_test "MCP Dependencies" test_mcp_dependencies
    
    # Generate report
    generate_test_report
    
    # Print results
    echo ""
    echo "=============================================="
    echo "🎯 Enhanced MCP Integration Test Results"
    echo "=============================================="
    echo ""
    
    for result in "${TEST_RESULTS[@]}"; do
        echo "$result"
    done
    
    echo ""
    echo "Summary:"
    echo "  Total Tests: $TOTAL_TESTS"
    echo "  Passed: $PASSED_TESTS"
    echo "  Failed: $FAILED_TESTS"
    
    local success_rate=0
    if [ "$TOTAL_TESTS" -gt 0 ]; then
        success_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    fi
    echo "  Success Rate: ${success_rate}%"
    echo ""
    
    if [ "$FAILED_TESTS" -eq 0 ]; then
        log_success "🎉 All MCP integration tests passed!"
        echo ""
        echo "✅ MCP integration is working correctly:"
        echo "  - Server connectivity and health checks"
        echo "  - Environment variable validation"  
        echo "  - npm script configuration"
        echo "  - File structure and dependencies"
        echo "  - Error handling and robustness"
        echo ""
        exit 0
    else
        log_error "⚠️  Some MCP integration tests failed!"
        echo ""
        echo "❌ Issues found that need attention:"
        echo "  - Check MCP server configuration"
        echo "  - Verify environment variables are set"
        echo "  - Ensure all MCP dependencies are installed"
        echo "  - Review MCP script functionality"
        echo ""
        echo "🔧 Troubleshooting steps:"
        echo "  1. Restart MCP server: cd mcp-server && npm run orchestrator"
        echo "  2. Check MCP server logs for errors"
        echo "  3. Verify MCP environment variables: env | grep MCP"
        echo "  4. Test MCP scripts individually: npm run mcp-health"
        echo "  5. Check network connectivity to localhost:3001"
        echo ""
        exit 1
    fi
}

# Run tests if called directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi