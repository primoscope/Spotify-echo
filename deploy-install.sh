#!/bin/bash

# ===================================================================
# EchoTune AI - Installation Script
# Installs all dependencies and system requirements
# ===================================================================

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/tmp/echotune-install-$(date +%Y%m%d-%H%M%S).log"

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] ✓ $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ✗ $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] ℹ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠ $1${NC}" | tee -a "$LOG_FILE"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root. Use: sudo $0"
        exit 1
    fi
}

# Detect OS
detect_os() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS=$ID
        OS_VERSION=$VERSION_ID
    else
        error "Cannot detect operating system"
        exit 1
    fi
    
    log "Detected OS: $OS $OS_VERSION"
}

# Update system packages
update_system() {
    log "Updating system packages..."
    
    case $OS in
        ubuntu|debian)
            apt-get update -y
            apt-get upgrade -y
            apt-get install -y curl wget git build-essential software-properties-common apt-transport-https ca-certificates gnupg lsb-release
            ;;
        centos|rhel|fedora)
            if command -v dnf >/dev/null 2>&1; then
                dnf update -y
                dnf install -y curl wget git gcc gcc-c++ make
            else
                yum update -y
                yum install -y curl wget git gcc gcc-c++ make
            fi
            ;;
        *)
            warning "Unsupported OS: $OS. Attempting generic installation..."
            ;;
    esac
    
    log "System packages updated"
}

# Install Node.js 20.x
install_nodejs() {
    log "Installing Node.js 20.x..."
    
    # Remove existing Node.js installations
    case $OS in
        ubuntu|debian)
            apt-get remove -y nodejs npm || true
            curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
            apt-get install -y nodejs
            ;;
        centos|rhel|fedora)
            if command -v dnf >/dev/null 2>&1; then
                dnf remove -y nodejs npm || true
                curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
                dnf install -y nodejs
            else
                yum remove -y nodejs npm || true
                curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
                yum install -y nodejs
            fi
            ;;
    esac
    
    # Verify installation
    NODE_VERSION=$(node --version 2>/dev/null || echo "not installed")
    NPM_VERSION=$(npm --version 2>/dev/null || echo "not installed")
    
    log "Node.js version: $NODE_VERSION"
    log "npm version: $NPM_VERSION"
    
    # Install global npm packages
    npm install -g pm2 nodemon @vue/cli create-react-app
    
    log "Node.js installation completed"
}

# Install Python 3 and pip
install_python() {
    log "Installing Python 3 and dependencies..."
    
    case $OS in
        ubuntu|debian)
            apt-get install -y python3 python3-pip python3-venv python3-dev
            ;;
        centos|rhel|fedora)
            if command -v dnf >/dev/null 2>&1; then
                dnf install -y python3 python3-pip python3-devel
            else
                yum install -y python3 python3-pip python3-devel
            fi
            ;;
    esac
    
    # Upgrade pip
    python3 -m pip install --upgrade pip
    
    # Install essential Python packages
    python3 -m pip install pandas numpy fastapi uvicorn scikit-learn
    
    PYTHON_VERSION=$(python3 --version 2>/dev/null || echo "not installed")
    PIP_VERSION=$(python3 -m pip --version 2>/dev/null || echo "not installed")
    
    log "Python version: $PYTHON_VERSION"
    log "pip version: $PIP_VERSION"
    
    log "Python installation completed"
}

# Install Docker and Docker Compose
install_docker() {
    log "Installing Docker and Docker Compose..."
    
    # Remove old Docker installations
    case $OS in
        ubuntu|debian)
            apt-get remove -y docker docker-engine docker.io containerd runc || true
            
            # Add Docker repository
            curl -fsSL https://download.docker.com/linux/$OS/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/$OS $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
            
            apt-get update -y
            apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
            ;;
        centos|rhel|fedora)
            if command -v dnf >/dev/null 2>&1; then
                dnf remove -y docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine || true
                dnf config-manager --add-repo https://download.docker.com/linux/$OS/docker-ce.repo
                dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
            else
                yum remove -y docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine || true
                yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
                yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
            fi
            ;;
    esac
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    # Add current user to docker group (if not root)
    if [[ $SUDO_USER ]]; then
        usermod -aG docker $SUDO_USER
        log "Added $SUDO_USER to docker group"
    fi
    
    # Set permissive Docker socket permissions
    chmod 666 /var/run/docker.sock
    
    # Install Docker Compose v2 if not available
    if ! command -v docker-compose >/dev/null 2>&1; then
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi
    
    DOCKER_VERSION=$(docker --version 2>/dev/null || echo "not installed")
    DOCKER_COMPOSE_VERSION=$(docker-compose --version 2>/dev/null || echo "not installed")
    
    log "Docker version: $DOCKER_VERSION"
    log "Docker Compose version: $DOCKER_COMPOSE_VERSION"
    
    log "Docker installation completed"
}

# Install Nginx
install_nginx() {
    log "Installing Nginx..."
    
    case $OS in
        ubuntu|debian)
            apt-get install -y nginx
            ;;
        centos|rhel|fedora)
            if command -v dnf >/dev/null 2>&1; then
                dnf install -y nginx
            else
                yum install -y nginx
            fi
            ;;
    esac
    
    # Start and enable Nginx
    systemctl start nginx
    systemctl enable nginx
    
    NGINX_VERSION=$(nginx -v 2>&1 | grep -o '[0-9.]*' || echo "not installed")
    log "Nginx version: $NGINX_VERSION"
    
    log "Nginx installation completed"
}

# Install additional tools
install_tools() {
    log "Installing additional tools and utilities..."
    
    case $OS in
        ubuntu|debian)
            apt-get install -y htop iotop nload tree vim nano unzip zip jq
            apt-get install -y fail2ban ufw certbot python3-certbot-nginx
            ;;
        centos|rhel|fedora)
            if command -v dnf >/dev/null 2>&1; then
                dnf install -y htop iotop tree vim nano unzip zip jq
                dnf install -y fail2ban firewalld certbot python3-certbot-nginx
            else
                yum install -y htop iotop tree vim nano unzip zip jq
                yum install -y fail2ban firewalld certbot python3-certbot-nginx
            fi
            ;;
    esac
    
    log "Additional tools installation completed"
}

# Create deploy user and directories
setup_deployment_structure() {
    log "Setting up deployment structure..."
    
    # Create deploy user
    if ! id "echotune" &>/dev/null; then
        useradd -m -s /bin/bash echotune
        usermod -aG sudo echotune
        usermod -aG docker echotune
        log "Created echotune user"
    else
        log "User echotune already exists"
    fi
    
    # Create deployment directories
    mkdir -p /opt/echotune/{app,ssl,logs,backups,config}
    chown -R echotune:echotune /opt/echotune
    chmod -R 755 /opt/echotune
    
    # Create log directories
    mkdir -p /var/log/echotune
    chown echotune:echotune /var/log/echotune
    chmod 755 /var/log/echotune
    
    log "Deployment structure created"
}

# Install project dependencies
install_project_dependencies() {
    log "Installing project dependencies..."
    
    if [[ -f "$SCRIPT_DIR/package.json" ]]; then
        cd "$SCRIPT_DIR"
        
        # Install npm dependencies
        sudo -u ${SUDO_USER:-echotune} npm install
        log "Node.js dependencies installed"
        
        # Install Python dependencies if requirements.txt exists
        if [[ -f "requirements.txt" ]]; then
            python3 -m pip install -r requirements.txt
            log "Python dependencies installed"
        fi
        
        if [[ -f "requirements-production.txt" ]]; then
            python3 -m pip install -r requirements-production.txt
            log "Production Python dependencies installed"
        fi
    else
        warning "package.json not found. Skipping project dependencies."
    fi
}

# Configure firewall (permissive mode)
configure_firewall() {
    log "Configuring firewall (permissive mode)..."
    
    case $OS in
        ubuntu|debian)
            # Reset UFW to permissive state
            ufw --force reset
            ufw disable
            log "UFW firewall disabled (permissive mode)"
            ;;
        centos|rhel|fedora)
            # Disable firewalld for permissive mode
            systemctl stop firewalld || true
            systemctl disable firewalld || true
            log "firewalld disabled (permissive mode)"
            ;;
    esac
}

# Main installation function
main() {
    log "Starting EchoTune AI installation..."
    log "Log file: $LOG_FILE"
    
    check_root
    detect_os
    update_system
    install_nodejs
    install_python
    install_docker
    install_nginx
    install_tools
    setup_deployment_structure
    install_project_dependencies
    configure_firewall
    
    log "✅ Installation completed successfully!"
    log "📋 Installation Summary:"
    log "   • Node.js: $(node --version 2>/dev/null || echo 'Not available')"
    log "   • Python: $(python3 --version 2>/dev/null || echo 'Not available')"
    log "   • Docker: $(docker --version 2>/dev/null | cut -d' ' -f3 | cut -d',' -f1 || echo 'Not available')"
    log "   • Nginx: $(nginx -v 2>&1 | grep -o '[0-9.]*' || echo 'Not available')"
    log "   • Deploy user: echotune"
    log "   • Deploy directory: /opt/echotune"
    log ""
    log "🚀 Next steps:"
    log "   1. Run: sudo ./deploy-permissions.sh"
    log "   2. Run: sudo ./deploy-environment.sh"
    log "   3. Run: sudo ./deploy-app.sh"
    log ""
    log "📄 Full log available at: $LOG_FILE"
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "EchoTune AI Installation Script"
        echo ""
        echo "Usage: sudo $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --version, -v  Show script version"
        echo ""
        echo "This script installs all dependencies and system requirements for EchoTune AI."
        exit 0
        ;;
    --version|-v)
        echo "EchoTune AI Installation Script v1.0.0"
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac