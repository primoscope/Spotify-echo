#!/bin/bash

# ===================================================================
# EchoTune AI - Ubuntu 22.04 LTS Docker Setup Script
# Complete Docker installation and configuration optimized for Ubuntu 22.04
# ===================================================================

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Configuration
DOCKER_COMPOSE_VERSION="2.24.6"
NODEJS_VERSION="20"
UBUNTU_VERSION=$(lsb_release -rs)
SCRIPT_LOG="/tmp/ubuntu22-docker-setup-$(date +%Y%m%d-%H%M%S).log"

# Logging functions
log() {
    local message="$1"
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo -e "${GREEN}[${timestamp}] ✓ ${message}${NC}" | tee -a "$SCRIPT_LOG"
}

error() {
    local message="$1"
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo -e "${RED}[${timestamp}] ✗ ERROR: ${message}${NC}" | tee -a "$SCRIPT_LOG"
    exit 1
}

warning() {
    local message="$1"
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo -e "${YELLOW}[${timestamp}] ⚠ WARNING: ${message}${NC}" | tee -a "$SCRIPT_LOG"
}

info() {
    local message="$1"
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo -e "${BLUE}[${timestamp}] ℹ INFO: ${message}${NC}" | tee -a "$SCRIPT_LOG"
}

# Print header
print_header() {
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║                🎵 EchoTune AI - Ubuntu 22.04 Docker Setup               ║${NC}"
    echo -e "${PURPLE}║                    Complete Docker & Dependencies Installation               ║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    info "🚀 Starting Ubuntu 22.04 Docker installation and configuration..."
    info "📝 Installation log: $SCRIPT_LOG"
    echo ""
}

# Check if running on Ubuntu 22.04
check_ubuntu_version() {
    log "Verifying Ubuntu version..."
    
    if [[ "$UBUNTU_VERSION" != "22.04" ]]; then
        warning "This script is optimized for Ubuntu 22.04 LTS"
        warning "Detected version: Ubuntu $UBUNTU_VERSION"
        warning "Continuing installation but some steps might need adjustment..."
    else
        log "✓ Ubuntu 22.04 LTS detected - perfect compatibility"
    fi
    
    # Check if running as root or with sudo
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root or with sudo"
    fi
    
    log "System checks completed"
}

# Update system packages
update_system() {
    log "Updating system packages..."
    
    # Update package index
    apt-get update -qq
    
    # Install essential packages
    DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release \
        software-properties-common \
        wget \
        unzip \
        git \
        htop \
        nano \
        ufw \
        logrotate \
        fail2ban \
        jq
    
    # Upgrade existing packages
    DEBIAN_FRONTEND=noninteractive apt-get upgrade -y -qq
    
    log "System packages updated successfully"
}

# Install Docker Engine
install_docker() {
    log "Installing Docker Engine for Ubuntu 22.04..."
    
    # Remove any old Docker installations
    apt-get remove -y docker docker-engine docker.io containerd runc docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin 2>/dev/null || true
    
    # Add Docker's official GPG key
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    
    # Add Docker repository specifically for Ubuntu 22.04 (jammy)
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
        $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
        tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Update package index with Docker repository
    apt-get update -qq
    
    # Install Docker Engine, CLI, containerd, and plugins
    DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
        docker-ce \
        docker-ce-cli \
        containerd.io \
        docker-buildx-plugin \
        docker-compose-plugin
    
    log "Docker Engine installed successfully"
}

# Configure Docker for production use
configure_docker() {
    log "Configuring Docker for Ubuntu 22.04 production use..."
    
    # Create Docker configuration directory
    mkdir -p /etc/docker
    
    # Create optimized Docker daemon configuration
    cat > /etc/docker/daemon.json << 'EOF'
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "5"
    },
    "storage-driver": "overlay2",
    "live-restore": true,
    "userland-proxy": false,
    "experimental": false,
    "metrics-addr": "127.0.0.1:9323",
    "default-ulimits": {
        "nofile": {
            "name": "nofile",
            "hard": 64000,
            "soft": 64000
        }
    }
}
EOF
    
    # Create docker group
    groupadd docker 2>/dev/null || true
    
    # Start and enable Docker service
    systemctl daemon-reload
    systemctl enable docker
    systemctl start docker
    
    # Verify Docker is running
    if systemctl is-active --quiet docker; then
        log "✓ Docker service is running"
    else
        error "Docker service failed to start"
    fi
    
    log "Docker configuration completed"
}

# Install Node.js 20.x LTS
install_nodejs() {
    log "Installing Node.js ${NODEJS_VERSION}.x LTS..."
    
    # Remove existing Node.js installations
    apt-get remove -y nodejs npm 2>/dev/null || true
    
    # Add NodeSource repository for Node.js 20.x
    curl -fsSL https://deb.nodesource.com/setup_${NODEJS_VERSION}.x | bash -
    
    # Install Node.js
    DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs
    
    # Install essential global packages
    npm install -g pm2@latest npm@latest
    
    # Verify installation
    local node_version=$(node --version)
    local npm_version=$(npm --version)
    
    log "✓ Node.js version: $node_version"
    log "✓ npm version: $npm_version"
    log "Node.js installation completed"
}

# Install nginx
install_nginx() {
    log "Installing nginx web server..."
    
    # Install nginx
    DEBIAN_FRONTEND=noninteractive apt-get install -y nginx
    
    # Enable nginx service
    systemctl enable nginx
    systemctl start nginx
    
    # Verify nginx is running
    if systemctl is-active --quiet nginx; then
        log "✓ nginx service is running"
    else
        warning "nginx service may not be running correctly"
    fi
    
    log "nginx installation completed"
}

# Install SSL certificate tools
install_ssl_tools() {
    log "Installing SSL certificate tools..."
    
    # Install Certbot for Let's Encrypt SSL certificates
    DEBIAN_FRONTEND=noninteractive apt-get install -y \
        certbot \
        python3-certbot-nginx
    
    log "SSL certificate tools installed"
}

# Configure firewall
configure_firewall() {
    log "Configuring UFW firewall for EchoTune AI..."
    
    # Reset UFW to defaults
    ufw --force reset
    
    # Set default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH (important!)
    ufw allow ssh
    ufw allow 22/tcp
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Allow application port (3000) for development
    ufw allow 3000/tcp
    
    # Enable firewall
    ufw --force enable
    
    log "Firewall configured and enabled"
}

# Create application user and directories
setup_application_environment() {
    log "Setting up EchoTune AI application environment..."
    
    # Create echotune user
    local app_user="echotune"
    local app_dir="/opt/echotune"
    
    if ! id "$app_user" &>/dev/null; then
        useradd -r -s /bin/bash -d "$app_dir" -m "$app_user"
        log "Created application user: $app_user"
    fi
    
    # Create necessary directories
    local dirs=(
        "$app_dir"
        "$app_dir/ssl"
        "$app_dir/logs"
        "$app_dir/data"
        "$app_dir/backups"
        "$app_dir/nginx"
        "/var/log/echotune"
    )
    
    for dir in "${dirs[@]}"; do
        mkdir -p "$dir"
        chown "$app_user:$app_user" "$dir"
        chmod 755 "$dir"
    done
    
    # Add echotune user to docker group
    usermod -aG docker "$app_user"
    
    log "Application environment setup completed"
}

# Install helpful utilities and aliases
install_utilities() {
    log "Installing helpful utilities and aliases..."
    
    # Create helpful aliases for all users
    cat >> /etc/bash.bashrc << 'EOF'

# EchoTune AI Docker aliases
alias echotune-start='cd /opt/echotune && sudo -u echotune docker-compose up -d'
alias echotune-stop='cd /opt/echotune && sudo -u echotune docker-compose down'
alias echotune-restart='cd /opt/echotune && sudo -u echotune docker-compose restart'
alias echotune-logs='cd /opt/echotune && sudo -u echotune docker-compose logs -f'
alias echotune-status='cd /opt/echotune && sudo -u echotune docker-compose ps'
alias echotune-health='curl -s http://localhost/health | jq .'
alias echotune-shell='cd /opt/echotune && sudo -u echotune docker-compose exec app /bin/sh'
alias echotune-build='cd /opt/echotune && sudo -u echotune docker-compose build --no-cache'
alias docker-clean='docker system prune -f && docker volume prune -f'
alias nginx-test='nginx -t'
alias nginx-reload='systemctl reload nginx'
alias echotune-backup='cd /opt/echotune && sudo -u echotune docker-compose exec mongodb mongodump --out /backup'
EOF
    
    log "Utilities and aliases installed"
}

# Perform health checks
perform_health_checks() {
    log "Performing system health checks..."
    
    # Check Docker
    if docker --version &>/dev/null; then
        log "✓ Docker: $(docker --version | cut -d' ' -f3 | cut -d',' -f1)"
    else
        error "Docker installation failed"
    fi
    
    # Check Docker Compose
    if docker compose version &>/dev/null; then
        log "✓ Docker Compose: $(docker compose version --short)"
    else
        error "Docker Compose installation failed"
    fi
    
    # Check Node.js
    if node --version &>/dev/null; then
        log "✓ Node.js: $(node --version)"
    else
        error "Node.js installation failed"
    fi
    
    # Check nginx
    if nginx -v &>/dev/null; then
        log "✓ nginx: $(nginx -v 2>&1 | cut -d' ' -f3)"
    else
        error "nginx installation failed"
    fi
    
    # Check system resources
    local total_mem=$(free -h | awk 'NR==2{print $2}')
    local available_mem=$(free -h | awk 'NR==2{print $7}')
    local disk_usage=$(df -h / | awk 'NR==2{print $5}')
    
    log "✓ Total Memory: $total_mem, Available: $available_mem"
    log "✓ Disk Usage: $disk_usage"
    
    # Check if ports are available
    local ports=("80" "443" "3000")
    for port in "${ports[@]}"; do
        if netstat -tuln | grep -q ":$port "; then
            warning "Port $port is already in use"
        else
            log "✓ Port $port is available"
        fi
    done
    
    log "Health checks completed"
}

# Show installation summary
show_installation_summary() {
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    🎉 UBUNTU 22.04 SETUP COMPLETED! 🎉                     ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    echo -e "${BOLD}🎯 Installation Summary:${NC}"
    echo -e "   ✅ Docker Engine and Docker Compose installed"
    echo -e "   ✅ Node.js ${NODEJS_VERSION}.x LTS with npm and pm2"
    echo -e "   ✅ nginx web server configured"
    echo -e "   ✅ SSL certificate tools (certbot) ready"
    echo -e "   ✅ UFW firewall configured (SSH, HTTP, HTTPS allowed)"
    echo -e "   ✅ EchoTune application environment created"
    echo -e "   ✅ Helpful aliases and utilities installed"
    echo ""
    
    echo -e "${BOLD}👤 Application User Created:${NC}"
    echo -e "   📁 User: echotune"
    echo -e "   📁 Home: /opt/echotune"
    echo -e "   🔧 Docker access: enabled"
    echo ""
    
    echo -e "${BOLD}🔥 Useful Commands:${NC}"
    echo -e "   🐳 Start EchoTune: ${CYAN}echotune-start${NC}"
    echo -e "   🛑 Stop EchoTune: ${CYAN}echotune-stop${NC}"
    echo -e "   📊 Check Status: ${CYAN}echotune-status${NC}"
    echo -e "   📝 View Logs: ${CYAN}echotune-logs${NC}"
    echo -e "   🏥 Health Check: ${CYAN}echotune-health${NC}"
    echo -e "   🧹 Clean Docker: ${CYAN}docker-clean${NC}"
    echo ""
    
    echo -e "${BOLD}🚀 Next Steps:${NC}"
    echo -e "   1. Deploy EchoTune AI:"
    echo -e "      ${CYAN}cd /opt/echotune${NC}"
    echo -e "      ${CYAN}git clone https://github.com/dzp5103/Spotify-echo.git .${NC}"
    echo -e "      ${CYAN}cp .env.example .env${NC}"
    echo -e "      ${CYAN}# Edit .env with your configuration${NC}"
    echo -e "      ${CYAN}docker-compose up -d${NC}"
    echo ""
    echo -e "   2. Configure SSL certificate:"
    echo -e "      ${CYAN}certbot --nginx -d yourdomain.com${NC}"
    echo ""
    echo -e "   3. Access your application:"
    echo -e "      🌐 HTTP: http://your-server-ip"
    echo -e "      🔒 HTTPS: https://yourdomain.com (after SSL setup)"
    echo ""
    
    echo -e "${CYAN}📝 Installation log saved to: ${SCRIPT_LOG}${NC}"
    echo -e "${CYAN}🆘 Need help? Visit: https://github.com/dzp5103/Spotify-echo${NC}"
    echo ""
}

# Main installation function
main() {
    print_header
    check_ubuntu_version
    update_system
    install_docker
    configure_docker
    install_nodejs
    install_nginx
    install_ssl_tools
    configure_firewall
    setup_application_environment
    install_utilities
    perform_health_checks
    show_installation_summary
    
    log "🎉 Ubuntu 22.04 Docker setup completed successfully!"
}

# Execute main function with error handling
trap 'error "Installation failed on line $LINENO"' ERR
main "$@"