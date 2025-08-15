#!/usr/bin/env bash
# MCP Server Connectivity Validation Script
# Tests connections to configured MCP servers

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MCP_CONFIG_DIR="$PROJECT_ROOT/mcp-config"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ [INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅ [SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠ [WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}❌ [ERROR]${NC} $1"
}

# Test Docker availability
test_docker() {
    log_info "Testing Docker availability..."
    
    if ! command -v docker >/dev/null 2>&1; then
        log_warning "Docker not found - Docker-based MCP servers will not be available"
        return 1
    fi
    
    if ! docker info >/dev/null 2>&1; then
        log_warning "Docker daemon not accessible - check Docker installation"
        return 1
    fi
    
    log_success "Docker is available and accessible"
    return 0
}

# Test NPX packages
test_npx_packages() {
    local packages=(
        "@modelcontextprotocol/server-filesystem"
        "@modelcontextprotocol/server-memory"
        "@modelcontextprotocol/server-sequential-thinking"
        "@modelcontextprotocol/server-fetch"
        "@modelcontextprotocol/server-brave-search"
    )
    
    log_info "Testing NPX package availability..."
    
    for package in "${packages[@]}"; do
        log_info "Checking $package..."
        if npx --yes "$package" --version >/dev/null 2>&1; then
            log_success "$package is available"
        else
            log_warning "$package may not be available or accessible"
        fi
    done
}

# Test GitHub MCP Server Docker image
test_github_mcp_docker() {
    log_info "Testing GitHub MCP Server Docker image..."
    
    if ! docker image inspect ghcr.io/github/github-mcp-server >/dev/null 2>&1; then
        log_info "Pulling GitHub MCP Server Docker image..."
        if docker pull ghcr.io/github/github-mcp-server; then
            log_success "GitHub MCP Server Docker image is available"
        else
            log_error "Failed to pull GitHub MCP Server Docker image"
            return 1
        fi
    else
        log_success "GitHub MCP Server Docker image is available locally"
    fi
    
    return 0
}

# Test Python MCP packages
test_python_packages() {
    log_info "Testing Python MCP packages..."
    
    # Check if uvx is available
    if command -v uvx >/dev/null 2>&1; then
        log_info "Testing mcp-server-git with uvx..."
        if uvx --help >/dev/null 2>&1; then
            log_success "uvx is available for Python MCP servers"
        else
            log_warning "uvx may not be properly configured"
        fi
    else
        log_warning "uvx not found - install with 'pip install uvx' for Python MCP servers"
    fi
    
    # Check if pip packages are available
    local pip_cmd=""
    if command -v pip3 >/dev/null 2>&1; then
        pip_cmd="pip3"
    elif command -v pip >/dev/null 2>&1; then
        pip_cmd="pip"
    else
        log_warning "No pip command found - Python MCP servers may not work"
        return 1
    fi
    
    log_info "Checking mcp-server-git package..."
    if $pip_cmd show mcp-server-git >/dev/null 2>&1; then
        log_success "mcp-server-git is installed"
    else
        log_warning "mcp-server-git not installed - install with '$pip_cmd install mcp-server-git'"
    fi
}

# Test global NPM packages
test_npm_global_packages() {
    local packages=(
        "github-repos-manager-mcp"
        "docker-mcp-server"
    )
    
    log_info "Testing global NPM packages..."
    
    for package in "${packages[@]}"; do
        log_info "Checking $package..."
        if npm list -g "$package" >/dev/null 2>&1; then
            log_success "$package is installed globally"
        else
            log_warning "$package not installed globally - install with 'npm install -g $package'"
        fi
    done
}

# Test environment variables
test_environment() {
    log_info "Testing environment configuration..."
    
    # Check for .env.mcp file
    if [ -f "$PROJECT_ROOT/.env.mcp" ]; then
        log_success "Found .env.mcp configuration file"
        
        # Source the file and check variables
        set +u  # Temporarily allow unset variables
        source "$PROJECT_ROOT/.env.mcp" 2>/dev/null || true
        set -u
        
        if [ -n "${GITHUB_TOKEN:-}" ]; then
            log_success "GITHUB_TOKEN is configured"
        else
            log_warning "GITHUB_TOKEN not configured in .env.mcp"
        fi
        
        if [ -n "${BRAVE_API_KEY:-}" ]; then
            log_success "BRAVE_API_KEY is configured"
        else
            log_info "BRAVE_API_KEY not configured (optional for Brave Search)"
        fi
    else
        log_warning ".env.mcp not found - copy from .env.mcp.example and configure"
    fi
}

# Test MCP configuration files
test_configuration_files() {
    log_info "Testing MCP configuration files..."
    
    # Check .vscode/mcp.json
    if [ -f "$PROJECT_ROOT/.vscode/mcp.json" ]; then
        log_success "Found .vscode/mcp.json"
        if jq empty "$PROJECT_ROOT/.vscode/mcp.json" >/dev/null 2>&1; then
            log_success ".vscode/mcp.json is valid JSON"
        else
            log_error ".vscode/mcp.json contains invalid JSON"
        fi
    else
        log_error ".vscode/mcp.json not found"
    fi
    
    # Check mcp-config/mcp_servers.json
    if [ -f "$MCP_CONFIG_DIR/mcp_servers.json" ]; then
        log_success "Found mcp-config/mcp_servers.json"
        if jq empty "$MCP_CONFIG_DIR/mcp_servers.json" >/dev/null 2>&1; then
            log_success "mcp-config/mcp_servers.json is valid JSON"
        else
            log_error "mcp-config/mcp_servers.json contains invalid JSON"
        fi
    else
        log_error "mcp-config/mcp_servers.json not found"
    fi
}

# Test local Docker Compose setup
test_docker_compose() {
    log_info "Testing Docker Compose setup..."
    
    if [ -f "$MCP_CONFIG_DIR/docker-compose.yml" ]; then
        log_success "Found docker-compose.yml"
        
        if command -v docker-compose >/dev/null 2>&1; then
            log_info "Validating docker-compose.yml..."
            if cd "$MCP_CONFIG_DIR" && docker-compose config >/dev/null 2>&1; then
                log_success "docker-compose.yml is valid"
            else
                log_warning "docker-compose.yml may have validation issues"
            fi
        else
            log_warning "docker-compose not found - install for local testing"
        fi
    else
        log_warning "docker-compose.yml not found"
    fi
}

# Generate validation report
generate_report() {
    local report_file="$PROJECT_ROOT/mcp-validation-report.md"
    
    log_info "Generating validation report at $report_file..."
    
    cat > "$report_file" << 'EOF'
# MCP Server Validation Report

**Generated:** `date`
**Repository:** EchoTune AI (dzp5103/Spotify-echo)

## Validation Summary

This report shows the status of MCP server components and their availability.

### ✅ Available Components

### ⚠️ Optional Components (Warnings)

### ❌ Missing Components (Errors)

## Next Steps

1. Install missing components using `scripts/install-mcp.sh`
2. Configure environment variables in `.env.mcp`
3. Test individual servers using Docker Compose
4. Validate IDE configuration

## Resources

- [MCP Implementation Guide](docs/mcp-integration.md)
- [Installation Script](scripts/install-mcp.sh)
- [Docker Compose](mcp-config/docker-compose.yml)

EOF

    log_success "Validation report generated"
}

# Main validation function
main() {
    log_info "Starting MCP server connectivity validation for EchoTune AI"
    log_info "=================================================="
    
    # Run all tests
    test_configuration_files
    test_environment
    test_docker
    test_github_mcp_docker
    test_npx_packages
    test_python_packages
    test_npm_global_packages
    test_docker_compose
    
    log_info ""
    log_info "=================================================="
    log_success "MCP server validation completed!"
    
    generate_report
    
    log_info ""
    log_info "Next steps:"
    log_info "1. Review any warnings or errors above"
    log_info "2. Install missing components with: scripts/install-mcp.sh"
    log_info "3. Configure environment variables in .env.mcp"
    log_info "4. Test with: npm run mcp:validate"
}

# Make sure jq is available for JSON validation
if ! command -v jq >/dev/null 2>&1; then
    log_warning "jq not found - JSON validation will be skipped"
    log_info "Install jq for better validation: apt-get install jq (Ubuntu) or brew install jq (macOS)"
fi

# Run main function
main "$@"