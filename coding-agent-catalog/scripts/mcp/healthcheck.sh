#!/usr/bin/env bash
set -euo pipefail

# EchoTune AI - MCP Health Check Script
# Comprehensive health checks with JSON and Markdown outputs

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
REPORTS_DIR="$PROJECT_ROOT/reports"
MCP_DIR="$PROJECT_ROOT/mcp"

# Ensure directories exist
mkdir -p "$REPORTS_DIR" "$MCP_DIR"

# Health check results
HEALTH_RESULTS=()
OVERALL_STATUS="healthy"
CHECK_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Add health check result
add_result() {
    local component="$1"
    local status="$2"
    local message="$3"
    local details="${4:-}"
    
    HEALTH_RESULTS+=("{\"component\":\"$component\",\"status\":\"$status\",\"message\":\"$message\",\"details\":\"$details\",\"timestamp\":\"$CHECK_TIMESTAMP\"}")
    
    if [ "$status" != "healthy" ] && [ "$status" != "warning" ]; then
        OVERALL_STATUS="unhealthy"
    elif [ "$status" = "warning" ] && [ "$OVERALL_STATUS" = "healthy" ]; then
        OVERALL_STATUS="warning"
    fi
    
    case $status in
        healthy) log_success "$component: $message" ;;
        warning) log_warning "$component: $message" ;;
        *) log_error "$component: $message" ;;
    esac
}

# Check Node.js and npm
check_nodejs() {
    log_info "Checking Node.js environment..."
    
    if command -v node >/dev/null 2>&1; then
        local version=$(node --version)
        local major_version=$(echo "$version" | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$major_version" -ge 18 ]; then
            add_result "nodejs" "healthy" "Node.js $version available"
        else
            add_result "nodejs" "warning" "Node.js $version is below recommended version 18"
        fi
    else
        add_result "nodejs" "unhealthy" "Node.js not found"
    fi
    
    if command -v npm >/dev/null 2>&1; then
        local npm_version=$(npm --version)
        add_result "npm" "healthy" "npm $npm_version available"
    else
        add_result "npm" "unhealthy" "npm not found"
    fi
}

# Check MCP server files
check_mcp_files() {
    log_info "Checking MCP server files..."
    
    local mcp_files=(
        "mcp-servers/enhanced-file-utilities.js:Enhanced File MCP"
        "mcp-servers/comprehensive-validator.js:Comprehensive Validator MCP"
        "mcp-server/enhanced-mcp-orchestrator.js:MCP Orchestrator"
        "mcp-server/workflow-manager.js:Workflow Manager"
    )
    
    for file_def in "${mcp_files[@]}"; do
        IFS=':' read -r file_path component_name <<< "$file_def"
        if [ -f "$PROJECT_ROOT/$file_path" ]; then
            add_result "$component_name" "healthy" "File present at $file_path"
        else
            add_result "$component_name" "warning" "File not found at $file_path"
        fi
    done
}

# Check npm packages
check_npm_packages() {
    log_info "Checking MCP npm packages..."
    
    if [ ! -f "$PROJECT_ROOT/package.json" ]; then
        add_result "package_json" "unhealthy" "package.json not found"
        return
    fi
    
    cd "$PROJECT_ROOT"
    
    local core_packages=(
        "@modelcontextprotocol/sdk:MCP SDK"
        "@modelcontextprotocol/server-filesystem:Filesystem MCP"
        "@browserbasehq/mcp-server-browserbase:Browserbase MCP"
        "FileScopeMCP:FileScope MCP"
    )
    
    for package_def in "${core_packages[@]}"; do
        IFS=':' read -r package_name component_name <<< "$package_def"
        if npm list "$package_name" >/dev/null 2>&1; then
            local version=$(npm list "$package_name" --depth=0 2>/dev/null | grep "$package_name" | head -1 | sed 's/.*@//' | sed 's/ .*//')
            add_result "$component_name" "healthy" "Package installed (v$version)"
        else
            add_result "$component_name" "warning" "Package not installed locally"
        fi
    done
}

# Check environment variables (including legacy ones)
check_environment() {
    log_info "Checking environment variables..."
    
    # Load .env.mcp if exists (legacy support)
    local env_file="$PROJECT_ROOT/.env.mcp"
    if [ -f "$env_file" ]; then
        set -a
        # shellcheck disable=SC1090
        source "$env_file"
        set +a
        add_result "env_mcp_file" "healthy" "Legacy .env.mcp file loaded"
    fi
    
    # Function to mask sensitive values
    mask() { [ -n "$1" ] && echo "set" || echo "missing"; }
    
    local env_vars=(
        "MONGODB_URI:MongoDB Connection:optional"
        "MONGODB_DB:MongoDB Database:optional" 
        "N8N_BASE_URL:N8N Base URL:optional"
        "N8N_API_KEY:N8N API Key:optional"
        "BRAVE_API_KEY:Brave Search API:optional"
        "SCREENSHOT_ENGINE:Screenshot Engine:optional"
        "BROWSERBASE_API_KEY:Browserbase API:optional"
        "BROWSERBASE_PROJECT_ID:Browserbase Project:optional"
        "SPOTIFY_CLIENT_ID:Spotify API:optional"
        "SPOTIFY_CLIENT_SECRET:Spotify API Secret:optional"
        "OPENAI_API_KEY:OpenAI API:optional"
        "GEMINI_API_KEY:Gemini API:optional"
    )
    
    for env_def in "${env_vars[@]}"; do
        IFS=':' read -r env_var component_name requirement <<< "$env_def"
        if [ -n "${!env_var:-}" ]; then
            add_result "$component_name" "healthy" "Environment variable configured"
        else
            if [ "$requirement" = "optional" ]; then
                add_result "$component_name" "warning" "Environment variable not set (optional)"
            else
                add_result "$component_name" "unhealthy" "Required environment variable not set"
            fi
        fi
    done
}

# Check JSON configuration files
check_json_files() {
    log_info "Checking JSON configuration files..."
    
    local json_files=(
        "mcp/servers.example.json:MCP Servers Example"
        "mcp-registry.json:MCP Registry"
        "package.json:Package Configuration"
    )
    
    for file_def in "${json_files[@]}"; do
        IFS=':' read -r file_path component_name <<< "$file_def"
        local full_path="$PROJECT_ROOT/$file_path"
        
        if [ -f "$full_path" ]; then
            if command -v jq >/dev/null 2>&1; then
                if jq . "$full_path" >/dev/null 2>&1; then
                    add_result "$component_name" "healthy" "Valid JSON file"
                else
                    add_result "$component_name" "unhealthy" "Invalid JSON syntax"
                fi
            else
                add_result "$component_name" "warning" "JSON file exists (jq not available for validation)"
            fi
        else
            add_result "$component_name" "warning" "JSON file not found at $file_path"
        fi
    done
}

# Check npm scripts
check_npm_scripts() {
    log_info "Checking MCP npm scripts..."
    
    cd "$PROJECT_ROOT"
    
    local mcp_scripts=(
        "mcp:install:MCP Installation"
        "mcp:health:MCP Health Check"
        "mcp:validate:MCP Validation"
        "mcp:report:MCP Report Generation"
    )
    
    for script_def in "${mcp_scripts[@]}"; do
        IFS=':' read -r script_name component_name <<< "$script_def"
        if npm run "$script_name" --if-present >/dev/null 2>&1; then
            add_result "$component_name" "healthy" "Script available and functional"
        else
            add_result "$component_name" "warning" "Script not available or failed"
        fi
    done
}

# Check file permissions and directories
check_filesystem() {
    log_info "Checking filesystem permissions and directories..."
    
    local dirs=(
        "reports:Reports Directory"
        "mcp:MCP Directory"
        "logs:Logs Directory"
        "mcp-servers:MCP Servers Directory"
        "mcp-server:MCP Server Directory"
    )
    
    for dir_def in "${dirs[@]}"; do
        IFS=':' read -r dir_path component_name <<< "$dir_def"
        local full_path="$PROJECT_ROOT/$dir_path"
        
        if [ -d "$full_path" ]; then
            if [ -w "$full_path" ]; then
                add_result "$component_name" "healthy" "Directory exists and is writable"
            else
                add_result "$component_name" "warning" "Directory exists but is not writable"
            fi
        else
            add_result "$component_name" "warning" "Directory does not exist"
            mkdir -p "$full_path" 2>/dev/null && add_result "$component_name" "healthy" "Directory created successfully"
        fi
    done
}

# Try to ping actual MCP servers if running
check_live_servers() {
    log_info "Checking for live MCP servers..."
    
    local servers=(
        "3001:Main MCP Server"
        "3002:Secondary MCP Server"  
        "3003:Analytics MCP Server"
    )
    
    for server_def in "${servers[@]}"; do
        IFS=':' read -r port component_name <<< "$server_def"
        
        if curl -f -s --max-time 5 "http://localhost:$port/health" >/dev/null 2>&1; then
            add_result "$component_name" "healthy" "Server responding on port $port"
        elif netstat -tuln 2>/dev/null | grep ":$port " >/dev/null; then
            add_result "$component_name" "warning" "Server listening on port $port but no health endpoint"
        else
            add_result "$component_name" "warning" "Server not running on port $port (expected in most environments)"
        fi
    done
}

# Generate JSON output
generate_json_report() {
    local results_json=""
    local first=true
    
    for result in "${HEALTH_RESULTS[@]}"; do
        if [ "$first" = true ]; then
            first=false
        else
            results_json+=","
        fi
        results_json+="$result"
    done
    
    cat > "$REPORTS_DIR/mcp-health.json" << EOF
{
  "timestamp": "$CHECK_TIMESTAMP",
  "overall_status": "$OVERALL_STATUS",
  "total_checks": ${#HEALTH_RESULTS[@]},
  "results": [
    $results_json
  ],
  "summary": {
    "healthy": $(echo "${HEALTH_RESULTS[@]}" | grep -o '"status":"healthy"' | wc -l),
    "warning": $(echo "${HEALTH_RESULTS[@]}" | grep -o '"status":"warning"' | wc -l),
    "unhealthy": $(echo "${HEALTH_RESULTS[@]}" | grep -o '"status":"unhealthy"' | wc -l)
  },
  "environment": {
    "os": "$(uname -s)",
    "node_version": "$(node --version 2>/dev/null || echo 'N/A')",
    "npm_version": "$(npm --version 2>/dev/null || echo 'N/A')",
    "project_root": "$PROJECT_ROOT"
  }
}
EOF
}

# Generate Markdown report
generate_markdown_report() {
    cat > "$REPORTS_DIR/mcp-health.md" << EOF
# MCP Health Check Report

**Generated:** $CHECK_TIMESTAMP  
**Overall Status:** $OVERALL_STATUS  
**Total Checks:** ${#HEALTH_RESULTS[@]}

## Executive Summary

$(case $OVERALL_STATUS in
    healthy) echo "🟢 **All systems operational** - MCP infrastructure is healthy and ready for use." ;;
    warning) echo "🟡 **Minor issues detected** - MCP infrastructure is functional with some warnings." ;;
    *) echo "🔴 **Issues require attention** - Some MCP components need configuration or repair." ;;
esac)

## Health Check Results

| Component | Status | Message |
|-----------|--------|---------|
$(for result in "${HEALTH_RESULTS[@]}"; do
    local component=$(echo "$result" | jq -r '.component')
    local status=$(echo "$result" | jq -r '.status')
    local message=$(echo "$result" | jq -r '.message')
    local icon
    case $status in
        healthy) icon="✅" ;;
        warning) icon="⚠️" ;;
        *) icon="❌" ;;
    esac
    echo "| $component | $icon $status | $message |"
done)

## System Information

- **Operating System:** $(uname -s)
- **Node.js Version:** $(node --version 2>/dev/null || echo 'N/A')  
- **npm Version:** $(npm --version 2>/dev/null || echo 'N/A')
- **Project Root:** $PROJECT_ROOT

## Recommendations

$(if [ "$OVERALL_STATUS" = "unhealthy" ]; then
    echo "1. **Critical Issues:** Address any unhealthy components before proceeding"
    echo "2. **Installation:** Run \`npm run mcp:install\` to install missing components"
fi)
$(if echo "${HEALTH_RESULTS[@]}" | grep -q '"status":"warning"'; then
    echo "1. **Environment Variables:** Set missing optional environment variables for full functionality"
    echo "2. **Server Startup:** Consider starting MCP servers for live validation"
fi)
3. **Regular Monitoring:** Run this health check periodically with \`npm run mcp:health\`
4. **Full Validation:** Run \`npm run mcp:validate\` for comprehensive validation

## Next Steps

- Review any warnings or failures above
- Set required environment variables in your \`.env\` file
- Run \`scripts/install-mcp-servers.sh\` if packages are missing
- Start MCP servers for live health monitoring

---
*This report was generated automatically by the EchoTune AI MCP health check system.*
EOF
}

# Main function
main() {
    echo "🩺 EchoTune AI - MCP Health Check"
    echo "=================================="
    echo ""
    
    # Run all health checks
    check_nodejs
    check_mcp_files  
    check_npm_packages
    check_environment
    check_json_files
    check_npm_scripts
    check_filesystem
    check_live_servers
    
    # Generate reports
    generate_json_report
    generate_markdown_report
    
    echo ""
    case $OVERALL_STATUS in
        healthy)
            log_success "Health check completed - All systems healthy"
            ;;
        warning)
            log_warning "Health check completed - Minor issues detected"
            ;;
        *)
            log_error "Health check completed - Issues require attention"
            ;;
    esac
    
    echo ""
    echo "📊 Reports generated:"
    echo "  - JSON: $REPORTS_DIR/mcp-health.json"
    echo "  - Markdown: $REPORTS_DIR/mcp-health.md"
    
    # Legacy support - show environment variables
    echo ""
    echo "📋 Environment variables status:"
    echo " - MONGODB_URI: $([ -n "${MONGODB_URI:-}" ] && echo "set" || echo "missing")"
    echo " - MONGODB_DB: ${MONGODB_DB:-missing}"
    echo " - N8N_BASE_URL: ${N8N_BASE_URL:-missing}"
    echo " - N8N_API_KEY: $([ -n "${N8N_API_KEY:-}" ] && echo "set" || echo "missing")"
    echo " - BRAVE_API_KEY: $([ -n "${BRAVE_API_KEY:-}" ] && echo "set" || echo "missing")"
    echo " - SCREENSHOT_ENGINE: ${SCREENSHOT_ENGINE:-missing}"
    
    echo ""
    echo "ℹ️ Note: Live connectivity is tested by probes and when client launches the servers."
    
    # Exit with appropriate code for CI
    case $OVERALL_STATUS in
        healthy) exit 0 ;;
        warning) exit 0 ;;  # Don't fail CI on warnings
        *) exit 1 ;;
    esac
}

# Run main function
main "$@"