#!/usr/bin/env bash
# MCP Server Installation Script for EchoTune AI
# Installs and configures MCP servers based on tier selection

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MCP_CONFIG_DIR="$PROJECT_ROOT/mcp-config"
MCP_SERVERS_CONFIG="$MCP_CONFIG_DIR/mcp_servers.json"

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

# Help function
show_help() {
    cat << EOF
MCP Server Installation Script for EchoTune AI

USAGE:
    $0 [OPTIONS]

OPTIONS:
    --core, -c          Install only Tier 1 (Essential) servers
    --all, -a           Install all tiers (default)
    --tier1             Install Tier 1 servers only
    --tier2             Install Tier 2 servers only  
    --tier3             Install Tier 3 servers only
    --docker-only       Only install Docker images
    --npm-only          Only install NPM packages
    --pip-only          Only install Python packages
    --validate          Validate installation without installing
    --help, -h          Show this help message

TIERS:
    Tier 1 (Essential):     GitHub MCP, Filesystem MCP, GitHub Repos Manager
    Tier 2 (High Value):    Git MCP, Memory MCP
    Tier 3 (Specialized):   Docker MCP, Sequential Thinking, Brave Search, Fetch

EXAMPLES:
    $0 --core              # Install essential servers only
    $0 --all               # Install all servers
    $0 --tier1 --tier2     # Install Tier 1 and 2 only
    $0 --validate          # Check what would be installed

EOF
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node >/dev/null 2>&1; then
        log_error "Node.js is required but not installed"
        exit 1
    fi
    
    # Check NPM
    if ! command -v npm >/dev/null 2>&1; then
        log_error "npm is required but not installed"
        exit 1
    fi
    
    # Check Python (optional)
    if ! command -v python3 >/dev/null 2>&1 && ! command -v python >/dev/null 2>&1; then
        log_warning "Python not found - pip installations will be skipped"
    fi
    
    # Check Docker (optional)
    if ! command -v docker >/dev/null 2>&1; then
        log_warning "Docker not found - Docker MCP servers will be skipped"
    fi
    
    # Check uvx (optional)
    if ! command -v uvx >/dev/null 2>&1; then
        log_warning "uvx not found - some Python MCP servers may not work"
        log_info "Install with: pip install uvx"
    fi
    
    log_success "Prerequisites check completed"
}

# Install NPM packages globally
install_npm_packages() {
    local packages=("$@")
    if [ ${#packages[@]} -eq 0 ]; then
        return 0
    fi
    
    log_info "Installing NPM packages globally..."
    
    for package in "${packages[@]}"; do
        log_info "Installing $package..."
        if npm install -g "$package"; then
            log_success "Installed $package"
        else
            log_error "Failed to install $package"
            return 1
        fi
    done
}

# Install Python packages
install_pip_packages() {
    local packages=("$@")
    if [ ${#packages[@]} -eq 0 ]; then
        return 0
    fi
    
    log_info "Installing Python packages..."
    
    # Try pip3 first, then pip
    local pip_cmd=""
    if command -v pip3 >/dev/null 2>&1; then
        pip_cmd="pip3"
    elif command -v pip >/dev/null 2>&1; then
        pip_cmd="pip"
    else
        log_warning "No pip command found - skipping Python packages"
        return 0
    fi
    
    for package in "${packages[@]}"; do
        log_info "Installing $package with $pip_cmd..."
        if $pip_cmd install "$package"; then
            log_success "Installed $package"
        else
            log_error "Failed to install $package"
            return 1
        fi
    done
}

# Pull Docker images
pull_docker_images() {
    local images=("$@")
    if [ ${#images[@]} -eq 0 ]; then
        return 0
    fi
    
    if ! command -v docker >/dev/null 2>&1; then
        log_warning "Docker not found - skipping Docker images"
        return 0
    fi
    
    log_info "Pulling Docker images..."
    
    for image in "${images[@]}"; do
        log_info "Pulling $image..."
        if docker pull "$image"; then
            log_success "Pulled $image"
        else
            log_error "Failed to pull $image"
            return 1
        fi
    done
}

# Validate configuration
validate_configuration() {
    log_info "Validating MCP configuration..."
    
    if [ ! -f "$MCP_SERVERS_CONFIG" ]; then
        log_error "MCP servers configuration not found at $MCP_SERVERS_CONFIG"
        exit 1
    fi
    
    # Validate JSON syntax
    if ! jq empty "$MCP_SERVERS_CONFIG" >/dev/null 2>&1; then
        log_error "Invalid JSON in MCP servers configuration"
        exit 1
    fi
    
    log_success "Configuration validation passed"
}

# Install servers by tier
install_tier() {
    local tier="$1"
    log_info "Installing $tier servers..."
    
    case "$tier" in
        "tier1"|"tier1_essential")
            # Essential servers
            install_npm_packages "github-repos-manager-mcp"
            pull_docker_images "ghcr.io/github/github-mcp-server" "mcp/filesystem"
            ;;
        "tier2"|"tier2_high_value")
            # High value servers  
            install_pip_packages "mcp-server-git"
            ;;
        "tier3"|"tier3_specialized")
            # Specialized servers
            install_npm_packages "docker-mcp-server"
            pull_docker_images "mcp/sequentialthinking"
            ;;
        *)
            log_error "Unknown tier: $tier"
            return 1
            ;;
    esac
    
    log_success "$tier installation completed"
}

# Main installation function
main() {
    local install_tier1=false
    local install_tier2=false
    local install_tier3=false
    local npm_only=false
    local pip_only=false
    local docker_only=false
    local validate_only=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --core|-c)
                install_tier1=true
                shift
                ;;
            --all|-a)
                install_tier1=true
                install_tier2=true
                install_tier3=true
                shift
                ;;
            --tier1)
                install_tier1=true
                shift
                ;;
            --tier2)
                install_tier2=true
                shift
                ;;
            --tier3)
                install_tier3=true
                shift
                ;;
            --npm-only)
                npm_only=true
                shift
                ;;
            --pip-only)
                pip_only=true
                shift
                ;;
            --docker-only)
                docker_only=true
                shift
                ;;
            --validate)
                validate_only=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Default to core installation if no tiers specified
    if [ "$install_tier1" = false ] && [ "$install_tier2" = false ] && [ "$install_tier3" = false ]; then
        install_tier1=true
    fi
    
    log_info "Starting MCP server installation for EchoTune AI"
    
    check_prerequisites
    validate_configuration
    
    if [ "$validate_only" = true ]; then
        log_success "Validation completed - no installation performed"
        exit 0
    fi
    
    # Install selected tiers
    if [ "$install_tier1" = true ]; then
        install_tier "tier1"
    fi
    
    if [ "$install_tier2" = true ]; then
        install_tier "tier2"
    fi
    
    if [ "$install_tier3" = true ]; then
        install_tier "tier3"
    fi
    
    log_success "MCP server installation completed!"
    log_info ""
    log_info "Next steps:"
    log_info "1. Copy .env.mcp.example to .env.mcp and configure your tokens"
    log_info "2. Run 'npm run mcp:validate' to test the installation"
    log_info "3. Configure your IDE to use the MCP servers in .vscode/mcp.json"
    log_info ""
    log_info "For more information, see docs/mcp-integration.md"
}

# Run main function
main "$@"