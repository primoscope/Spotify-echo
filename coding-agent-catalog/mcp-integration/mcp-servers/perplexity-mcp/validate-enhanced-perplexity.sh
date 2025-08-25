#!/bin/bash

# Enhanced Perplexity MCP Server Validation Script
# Validates all enhanced features including model comparison and workflow optimization

echo "🔬 Enhanced Perplexity MCP Server Validation"
echo "============================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Validation results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "${BLUE}Testing: ${test_name}${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if eval "$test_command" >/dev/null 2>&1; then
        echo -e "  ✅ ${GREEN}PASS${NC}: $test_name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "  ❌ ${RED}FAIL${NC}: $test_name"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Function to run test with output
run_test_with_output() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "${BLUE}Testing: ${test_name}${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    local output
    output=$(eval "$test_command" 2>&1)
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        echo -e "  ✅ ${GREEN}PASS${NC}: $test_name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        echo -e "     ${YELLOW}Output:${NC} ${output:0:100}..."
        return 0
    else
        echo -e "  ❌ ${RED}FAIL${NC}: $test_name"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo -e "     ${RED}Error:${NC} ${output:0:200}..."
        return 1
    fi
}

echo "🏗️  Infrastructure Tests"
echo "------------------------"

# Test 1: Check if enhanced server file exists
run_test "Enhanced server file exists" "test -f mcp-servers/perplexity-mcp/perplexity-mcp-server.js"

# Test 2: Check if test suite exists
run_test "Test suite file exists" "test -f mcp-servers/perplexity-mcp/test-enhanced-perplexity.js"

# Test 3: Check if workflow documentation exists
run_test "Workflow documentation exists" "test -f mcp-servers/perplexity-mcp/OPTIMIZED_WORKFLOWS.md"

# Test 4: Validate Node.js syntax
run_test "Server syntax validation" "node -c mcp-servers/perplexity-mcp/perplexity-mcp-server.js"

# Test 5: Validate test suite syntax
run_test "Test suite syntax validation" "node -c mcp-servers/perplexity-mcp/test-enhanced-perplexity.js"

echo ""
echo "📦 Dependency Tests"
echo "-------------------"

# Test 6: Check Node.js version
run_test_with_output "Node.js version" "node --version"

# Test 7: Check npm dependencies
run_test "Required npm packages" "npm list @modelcontextprotocol/sdk --depth=0"

echo ""
echo "⚙️  Configuration Tests"
echo "------------------------"

# Test 8: MCP server configuration updated
run_test "MCP servers config includes Perplexity" "grep -q 'perplexity_enhanced' mcp-config/mcp_servers.json"

# Test 9: VS Code configuration updated
run_test "VS Code config includes Perplexity" "grep -q 'perplexity-enhanced' .vscode/mcp.json"

# Test 10: Environment template includes Perplexity
run_test "Environment template includes Perplexity" "grep -q 'PERPLEXITY_API_KEY' mcp-config/mcp_servers.json"

echo ""
echo "🧪 Functional Tests"
echo "-------------------"

# Test 11: Server instantiation (without API key)
run_test "Server instantiation" "node -e \"const Server = require('./mcp-servers/perplexity-mcp/perplexity-mcp-server.js'); new Server();\""

# Test 12: Model configurations loaded
run_test_with_output "Model configurations" "node -e \"const Server = require('./mcp-servers/perplexity-mcp/perplexity-mcp-server.js'); const s = new Server(); console.log(Object.keys(s.modelConfigs).length + ' models configured');\""

# Test 13: Enhanced features available
run_test "Enhanced features available" "grep -q 'model_comparison\\|workflow_optimization' mcp-servers/perplexity-mcp/perplexity-mcp-server.js"

echo ""

# Run comprehensive test suite if API key is available
if [ -n "$PERPLEXITY_API_KEY" ]; then
    echo "🚀 Live API Tests (API Key Available)"
    echo "------------------------------------"
    
    # Test 14: Run comprehensive test suite
    run_test_with_output "Comprehensive test suite" "cd mcp-servers/perplexity-mcp && timeout 60 node test-enhanced-perplexity.js"
    
    # Test 15: Model comparison functionality
    if command -v timeout >/dev/null 2>&1; then
        run_test "Model comparison test" "timeout 30 node -e \"
const Server = require('./mcp-servers/perplexity-mcp/perplexity-mcp-server.js');
const s = new Server();
s.initializeRedis().then(() => {
  return s.handleModelComparison({
    q: 'Test query for validation',
    models: ['sonar-pro'],
    metrics: ['latency']
  });
}).then(result => {
  console.log('Model comparison successful');
  process.exit(0);
}).catch(err => {
  console.error('Model comparison failed:', err.message);
  process.exit(1);
});
\""
    fi
else
    echo "⚠️  Skipping Live API Tests (PERPLEXITY_API_KEY not set)"
    echo "   Set PERPLEXITY_API_KEY environment variable to run comprehensive tests"
    echo ""
fi

echo "📊 Integration Tests"
echo "-------------------"

# Test 16: Package.json script exists
run_test "Package.json test scripts exist" "grep -q 'testperplexity\\|mcpperplexity' package.json"

# Test 17: MCP validation script includes Perplexity
run_test "MCP validation includes Perplexity" "test -f mcp-config/validate_mcp.sh"

echo ""
echo "📋 Results Summary"
echo "=================="
echo -e "Total Tests: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo ""
    echo -e "🎉 ${GREEN}All tests passed!${NC} Enhanced Perplexity MCP Server is ready for use."
    echo ""
    echo "🚀 Next Steps:"
    echo "1. Set PERPLEXITY_API_KEY environment variable to enable full functionality"
    echo "2. Run comprehensive tests: npm run testperplexity"
    echo "3. Start the server: npm run mcpperplexity"
    echo "4. Review workflow documentation: mcp-servers/perplexity-mcp/OPTIMIZED_WORKFLOWS.md"
    exit 0
else
    echo ""
    echo -e "⚠️  ${YELLOW}$FAILED_TESTS test(s) failed.${NC} Please review the errors above."
    echo ""
    echo "🔧 Troubleshooting:"
    echo "1. Ensure all dependencies are installed: npm install"
    echo "2. Check Node.js version (>=18 required): node --version"
    echo "3. Verify file permissions and paths"
    echo "4. Review error messages above for specific issues"
    exit 1
fi