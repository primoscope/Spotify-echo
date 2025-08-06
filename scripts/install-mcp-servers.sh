#!/bin/bash

# =============================================================================
# 🚀 EchoTune AI - Community MCP Servers Installation Script
# =============================================================================
#
# This script installs recommended community MCP servers for enhanced
# AI-powered music intelligence and automation capabilities.
#
# Usage: ./scripts/install-mcp-servers.sh [options]
#
# Options:
#   --all        Install all recommended servers
#   --core       Install only core servers (default)
#   --music      Install music-specific servers
#   --dev        Install development tools
#   --help       Show this help message
#
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
INSTALL_TYPE="core"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Helper functions
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

show_help() {
    cat << EOF
🎵 EchoTune AI - Community MCP Servers Installation

USAGE:
    ./scripts/install-mcp-servers.sh [options]

OPTIONS:
    --all        Install all recommended servers
    --core       Install only core servers (default)
    --music      Install music-specific servers
    --dev        Install development tools
    --help       Show this help message

CORE SERVERS:
    - GitHub MCP Server (Official)
    - File System MCP Server
    - SQLite Database MCP Server
    - Memory MCP Server

MUSIC SERVERS:
    - YouTube MCP Server
    - Audio Analysis Tools
    - Playlist Optimization

DEVELOPMENT SERVERS:
    - PostgreSQL MCP Server
    - Browser Automation (Playwright)
    - Web Search (Brave)

EXAMPLES:
    ./scripts/install-mcp-servers.sh --core
    ./scripts/install-mcp-servers.sh --all
    ./scripts/install-mcp-servers.sh --music

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --all)
            INSTALL_TYPE="all"
            shift
            ;;
        --core)
            INSTALL_TYPE="core"
            shift
            ;;
        --music)
            INSTALL_TYPE="music"
            shift
            ;;
        --dev)
            INSTALL_TYPE="dev"
            shift
            ;;
        --help)
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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is required but not installed. Please install Node.js 18+ and try again."
        exit 1
    fi
    
    local node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 18 ]; then
        log_error "Node.js 18+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        log_error "Python 3.11+ is required but not installed."
        exit 1
    fi
    
    # Check Docker (for GitHub MCP server)
    if ! command -v docker &> /dev/null; then
        log_warning "Docker is not installed. GitHub MCP server will not be available."
        log_warning "Please install Docker to use the official GitHub MCP server."
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is required but not installed."
        exit 1
    fi
    
    # Check pip
    if ! command -v pip3 &> /dev/null; then
        log_error "pip3 is required but not installed."
        exit 1
    fi
    
    log_success "Prerequisites check completed"
}

# Install core MCP servers
install_core_servers() {
    log_info "Installing core MCP servers..."
    
    # Install Node.js based servers
    log_info "Installing File System MCP Server..."
    npm install -g @modelcontextprotocol/server-filesystem
    
    log_info "Installing Memory MCP Server..."
    npm install -g @modelcontextprotocol/server-memory
    
    # Install Python based servers
    log_info "Installing SQLite MCP Server..."
    pip3 install mcp-server-sqlite
    
    log_success "Core MCP servers installed successfully"
}

# Install music-specific MCP servers
install_music_servers() {
    log_info "Installing music-specific MCP servers..."
    
    # YouTube integration
    log_info "Installing YouTube MCP Server..."
    npm install -g mcp-youtube
    
    # MongoDB integration for music data
    log_info "Installing MongoDB Lens..."
    npm install -g mongodb-lens
    
    log_success "Music MCP servers installed successfully"
}

# Install development MCP servers
install_dev_servers() {
    log_info "Installing development MCP servers..."
    
    # PostgreSQL server
    log_info "Installing PostgreSQL MCP Server..."
    npm install -g @modelcontextprotocol/server-postgres
    
    # Brave search
    log_info "Installing Brave Search MCP Server..."
    npm install -g @modelcontextprotocol/server-brave-search
    
    # Browser automation
    log_info "Installing Puppeteer MCP Server..."
    npm install -g @modelcontextprotocol/server-puppeteer
    
    # Playwright automation
    log_info "Installing Playwright MCP Server..."
    npm install -g mcp-playwright
    
    log_success "Development MCP servers installed successfully"
}

# Install additional community servers
install_additional_servers() {
    log_info "Installing additional community MCP servers..."
    
    # OpenAI integration
    log_info "Installing OpenAI MCP Server..."
    pip3 install mcp-server-openai
    
    # Webhook testing
    log_info "Installing Webhook Tester MCP..."
    pip3 install webhook-tester-mcp
    
    # Time series data
    log_info "Installing InfluxDB MCP Server..."
    npm install -g influxdb-mcp-server
    
    log_success "Additional MCP servers installed successfully"
}

# Create validation script
create_validation_script() {
    log_info "Creating MCP server validation script..."
    
    cat > "$PROJECT_ROOT/scripts/validate-mcp-servers.sh" << 'EOF'
#!/bin/bash

# Validate installed MCP servers
echo "🔍 Validating MCP server installations..."

# Check Node.js servers
check_npm_package() {
    if npm list -g "$1" &> /dev/null; then
        echo "✅ $1 is installed"
    else
        echo "❌ $1 is not installed"
    fi
}

# Check Python packages
check_pip_package() {
    if pip3 show "$1" &> /dev/null; then
        echo "✅ $1 is installed"
    else
        echo "❌ $1 is not installed"
    fi
}

echo ""
echo "📦 Node.js MCP Servers:"
check_npm_package "@modelcontextprotocol/server-filesystem"
check_npm_package "@modelcontextprotocol/server-memory"
check_npm_package "@modelcontextprotocol/server-postgres"
check_npm_package "@modelcontextprotocol/server-brave-search"
check_npm_package "@modelcontextprotocol/server-puppeteer"
check_npm_package "mcp-youtube"
check_npm_package "mongodb-lens"
check_npm_package "mcp-playwright"
check_npm_package "influxdb-mcp-server"

echo ""
echo "🐍 Python MCP Servers:"
check_pip_package "mcp-server-sqlite"
check_pip_package "mcp-server-openai"
check_pip_package "webhook-tester-mcp"

echo ""
echo "🐳 Docker-based servers:"
if command -v docker &> /dev/null; then
    echo "✅ Docker is available for GitHub MCP server"
else
    echo "❌ Docker is not available"
fi

echo ""
echo "🔍 Validation complete!"
EOF

    chmod +x "$PROJECT_ROOT/scripts/validate-mcp-servers.sh"
    log_success "Validation script created at scripts/validate-mcp-servers.sh"
}

# Main installation function
main() {
    echo "🎵 EchoTune AI - Community MCP Servers Installation"
    echo "=================================================="
    echo ""
    
    check_prerequisites
    
    case $INSTALL_TYPE in
        "core")
            log_info "Installing core MCP servers..."
            install_core_servers
            ;;
        "music")
            log_info "Installing music-specific MCP servers..."
            install_core_servers
            install_music_servers
            ;;
        "dev")
            log_info "Installing development MCP servers..."
            install_core_servers
            install_dev_servers
            ;;
        "all")
            log_info "Installing all recommended MCP servers..."
            install_core_servers
            install_music_servers
            install_dev_servers
            install_additional_servers
            ;;
    esac
    
    create_validation_script
    
    echo ""
    log_success "MCP servers installation completed!"
    echo ""
    log_info "Next steps:"
    echo "1. Update your .env file with required API keys"
    echo "2. Run './scripts/validate-mcp-servers.sh' to verify installation"
    echo "3. Test MCP server integration with your coding agent"
    echo "4. Review the documentation at docs/guides/COMMUNITY_MCP_SERVERS.md"
    echo ""
    log_info "For GitHub MCP server, ensure you have:"
    log_info "- Docker installed and running"
    log_info "- GITHUB_PAT environment variable set"
    echo ""
}

# Run main function
main "$@"