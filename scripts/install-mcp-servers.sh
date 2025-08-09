#!/bin/bash

# =============================================================================
# 🚀 EchoTune AI - MCP Servers Installation Script  
# Robust installation with idempotency, OS detection, and environment gating
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
INSTALL_LOG="$PROJECT_ROOT/mcp-install.log"
REGISTRY_FILE="$PROJECT_ROOT/mcp-registry.json"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$INSTALL_LOG"
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}" | tee -a "$INSTALL_LOG"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$INSTALL_LOG"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$INSTALL_LOG"
}

log_error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$INSTALL_LOG"
}

# OS Detection
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    elif [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "msys" ]]; then
        echo "windows"
    else
        echo "unknown"
    fi
}

# Environment validation with graceful skipping
validate_environment() {
    local required_env=$1
    local server_name=$2
    
    if [ -z "${!required_env:-}" ]; then
        log_warning "$server_name: $required_env not set - will skip gracefully"
        return 1
    else
        log_success "$server_name: $required_env is configured"
        return 0
    fi
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites with better error handling
check_prerequisites() {
    log_info "Checking prerequisites..."
    local errors=0
    
    # Check Node.js
    if ! command_exists node; then
        log_error "Node.js is required but not installed. Please install Node.js 20+ and try again."
        ((errors++))
    else
        local node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$node_version" -lt 18 ]; then
            log_error "Node.js 18+ is required. Current version: $(node --version)"
            ((errors++))
        else
            log_success "Node.js $(node --version) detected"
        fi
    fi
    
    # Check npm
    if ! command_exists npm; then
        log_error "npm is required but not installed."
        ((errors++))
    else
        log_success "npm $(npm --version) detected"
    fi
    
    # Check Python (optional)
    if command_exists python3; then
        log_success "Python3 $(python3 --version) detected"
    else
        log_warning "Python3 not found - Python-based MCP servers will be skipped"
    fi
    
    # Check pip3 (optional)
    if command_exists pip3; then
        log_success "pip3 available"
    else
        log_warning "pip3 not found - Python package installation will be skipped"
    fi
    
    if [ $errors -gt 0 ]; then
        log_error "Prerequisites check failed with $errors errors"
        exit 1
    fi
    
    log_success "Prerequisites check completed"
}

# Install package with idempotency check
install_npm_package() {
    local package=$1
    local scope=${2:-"local"}  # local or global
    
    if [ "$scope" = "global" ]; then
        if npm list -g "$package" >/dev/null 2>&1; then
            log_success "$package already installed globally"
            return 0
        fi
        log_info "Installing $package globally..."
        if npm install -g "$package" >/dev/null 2>&1; then
            log_success "$package installed globally"
        else
            log_warning "Failed to install $package globally - trying locally"
            install_npm_package "$package" "local"
        fi
    else
        if npm list "$package" >/dev/null 2>&1; then
            log_success "$package already installed locally"
            return 0
        fi
        log_info "Installing $package locally..."
        if npm install "$package" >/dev/null 2>&1; then
            log_success "$package installed locally"
        else
            log_warning "Failed to install $package - continuing"
            return 1
        fi
    fi
}

# Install core MCP servers from mcp-registry.json and package.json
install_core_servers() {
    log_info "Installing core MCP servers..."
    
    cd "$PROJECT_ROOT"
    
    # Core MCP servers from package.json dependencies
    local core_packages=(
        "@modelcontextprotocol/sdk"
        "@modelcontextprotocol/server-filesystem"
        "@modelcontextprotocol/server-puppeteer"
        "@modelcontextprotocol/server-sequential-thinking"
        "FileScopeMCP"
    )
    
    for package in "${core_packages[@]}"; do
        install_npm_package "$package" "local"
    done
    
    log_success "Core MCP servers installation completed"
}

# Install community MCP servers with environment gating
install_community_servers() {
    log_info "Installing community MCP servers with environment gating..."
    
    # Browserbase MCP - gated by environment
    if validate_environment "BROWSERBASE_API_KEY" "Browserbase MCP" && validate_environment "BROWSERBASE_PROJECT_ID" "Browserbase MCP"; then
        install_npm_package "@browserbasehq/mcp-server-browserbase" "local"
        echo "browserbase_enabled=true" >> "$PROJECT_ROOT/.mcp-config"
    else
        log_warning "Browserbase MCP will be skipped (missing BROWSERBASE_API_KEY or BROWSERBASE_PROJECT_ID)"
        echo "browserbase_enabled=false" >> "$PROJECT_ROOT/.mcp-config"
    fi
    
    # Community servers (install regardless, but gate usage)
    local community_packages=(
        "mcp-server-code-runner"
        "mongodb-mcp-server" 
        "puppeteer-mcp-server"
        "n8n-mcp"
        "@hisma/server-puppeteer"
    )
    
    for package in "${community_packages[@]}"; do
        install_npm_package "$package" "local"
    done
    
    log_success "Community MCP servers installation completed"
}

# Install Python MCP dependencies
install_python_servers() {
    if ! command_exists pip3; then
        log_warning "pip3 not available - skipping Python MCP servers"
        return
    fi
    
    log_info "Installing Python MCP dependencies..."
    
    # Install from requirements files if they exist
    local req_files=("requirements.txt" "requirements-core.txt" "requirements-minimal.txt")
    
    for req_file in "${req_files[@]}"; do
        if [ -f "$PROJECT_ROOT/$req_file" ]; then
            log_info "Installing from $req_file..."
            if pip3 install -r "$PROJECT_ROOT/$req_file" >/dev/null 2>&1; then
                log_success "Installed packages from $req_file"
            else
                log_warning "Some packages from $req_file may have failed to install"
            fi
        fi
    done
}

# Create necessary directories
create_directories() {
    log_info "Creating MCP server directories..."
    
    local dirs=(
        "$PROJECT_ROOT/mcp-servers" 
        "$PROJECT_ROOT/mcp-server"
        "$PROJECT_ROOT/reports"
        "$PROJECT_ROOT/mcp"
        "$PROJECT_ROOT/logs"
    )
    
    for dir in "${dirs[@]}"; do
        mkdir -p "$dir"
    done
    
    log_success "Created necessary directories"
}

# Environment gate validation for all servers
check_gated_servers() {
    log_info "Checking environment-gated servers..."
    
    # Create or update .mcp-config
    cat > "$PROJECT_ROOT/.mcp-config" << EOF
# MCP Configuration - Generated $(date)
install_timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
os_type=$(detect_os)
EOF
    
    # Check all environment-dependent servers
    local servers=(
        "BROWSERBASE_API_KEY:BROWSERBASE_PROJECT_ID:Browserbase MCP:browserbase"
        "SPOTIFY_CLIENT_ID:SPOTIFY_CLIENT_SECRET:Spotify MCP:spotify"
        "OPENAI_API_KEY::OpenAI Integration:openai"
        "GEMINI_API_KEY::Gemini Integration:gemini"
        "MONGODB_URI::MongoDB Integration:mongodb"
    )
    
    for server_def in "${servers[@]}"; do
        IFS=':' read -r env1 env2 name key <<< "$server_def"
        
        if [ -n "${!env1:-}" ] && ([ -z "$env2" ] || [ -n "${!env2:-}" ]); then
            log_success "$name can be activated"
            echo "${key}_enabled=true" >> "$PROJECT_ROOT/.mcp-config"
        else
            log_warning "$name will be gracefully skipped (missing environment variables)"
            echo "${key}_enabled=false" >> "$PROJECT_ROOT/.mcp-config"
        fi
    done
}

# Update MCP registry
update_registry() {
    log_info "Updating MCP registry..."
    
    cd "$PROJECT_ROOT"
    if [ -f "scripts/mcp-manager.js" ] && npm run mcp:report >/dev/null 2>&1; then
        log_success "Registry updated successfully"
    else
        log_warning "Registry update had issues - will use existing registry"
    fi
}

# Health check
health_check() {
    log_info "Performing post-installation health check..."
    
    cd "$PROJECT_ROOT"
    
    # Test npm scripts
    if npm run mcp:health --if-present >/dev/null 2>&1; then
        log_success "MCP health scripts working"
    else
        log_warning "MCP health scripts not fully configured"
    fi
    
    # Test critical files
    local critical_files=("package.json" "mcp-registry.json")
    for file in "${critical_files[@]}"; do
        if [ -f "$PROJECT_ROOT/$file" ]; then
            log_success "$file present"
        else
            log_warning "$file missing"
        fi
    done
    
    # Count installed packages
    local installed_count=0
    if [ -f "$PROJECT_ROOT/node_modules" ]; then
        installed_count=$(find "$PROJECT_ROOT/node_modules" -name "mcp-*" -o -name "*mcp*" | wc -l)
        log_success "Found approximately $installed_count MCP-related packages"
    fi
}

# Show usage help
show_help() {
    cat << EOF
🎵 EchoTune AI - MCP Servers Installation

USAGE:
    ./scripts/install-mcp-servers.sh [options]

OPTIONS:
    --all        Install all servers (core + community + python)
    --core       Install only core servers (default)
    --help       Show this help message

FEATURES:
    ✅ Idempotent - safe to run multiple times
    ✅ OS detection (Linux, macOS, Windows)  
    ✅ Environment gating for optional servers
    ✅ Graceful fallbacks when dependencies missing
    ✅ Comprehensive logging and validation

EXAMPLES:
    ./scripts/install-mcp-servers.sh --core
    ./scripts/install-mcp-servers.sh --all

EOF
}

# Main installation function
main() {
    local install_type="${1:-core}"
    
    case $install_type in
        --help)
            show_help
            exit 0
            ;;
        --all)
            install_type="all"
            ;;
        --core)
            install_type="core"
            ;;
        *)
            install_type="core"
            ;;
    esac
    
    echo "🚀 EchoTune AI - MCP Server Installation"
    echo "========================================"
    echo "Project root: $PROJECT_ROOT"
    echo "Install type: $install_type"
    echo "Install log: $INSTALL_LOG"
    echo ""
    
    # Initialize log
    echo "# MCP Installation Log - $(date)" > "$INSTALL_LOG"
    
    check_prerequisites
    create_directories
    check_gated_servers
    install_core_servers
    
    if [ "$install_type" = "all" ]; then
        install_community_servers
        install_python_servers
    fi
    
    update_registry
    health_check
    
    echo ""
    log_success "MCP server installation completed!"
    echo ""
    log_info "Next steps:"
    echo "1. Run 'npm run mcp:validate' to validate the installation"
    echo "2. Check '$INSTALL_LOG' for detailed installation log"
    echo "3. Review '.mcp-config' for environment gate status"
    echo "4. Set missing environment variables in .env file"
    echo ""
}

# Run main function
main "$@"