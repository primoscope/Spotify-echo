#!/bin/bash

# ===================================================================
# EchoTune AI - Enhanced DigitalOcean Production Deployment
# Ubuntu 22.04 Optimized with Dynamic Domain Configuration
# Version: 3.0.0 - Flexible and Domain-Agnostic
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

# Configuration - Dynamic defaults
DOMAIN="${DOMAIN:-$(curl -s ifconfig.me).nip.io}"
APP_NAME="echotune-ai"
DEPLOY_USER="echotune"
BUILD_VERSION="${BUILD_VERSION:-$(date +%Y%m%d-%H%M%S)}"
DEPLOY_DIR="/opt/echotune"
LOG_DIR="${DEPLOY_DIR}/logs"
LOG_FILE="${LOG_DIR}/deployment-do-$(date +%Y%m%d-%H%M%S).log"

# DigitalOcean specific settings
DO_REGISTRY="registry.digitalocean.com"
DO_NAMESPACE="${DO_NAMESPACE:-echotune}"
CONTAINER_IMAGE="${DO_REGISTRY}/${DO_NAMESPACE}/${APP_NAME}:${BUILD_VERSION}"

# Script options
SKIP_SSL="${SKIP_SSL:-false}"
FORCE_REBUILD="${FORCE_REBUILD:-false}"
USE_LOCAL_DOCKER="${USE_LOCAL_DOCKER:-true}"

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --domain=*)
                DOMAIN="${1#*=}"
                shift
                ;;
            --skip-ssl)
                SKIP_SSL="true"
                shift
                ;;
            --force-rebuild)
                FORCE_REBUILD="true"
                shift
                ;;
            --use-registry)
                USE_LOCAL_DOCKER="false"
                shift
                ;;
            --namespace=*)
                DO_NAMESPACE="${1#*=}"
                CONTAINER_IMAGE="${DO_REGISTRY}/${DO_NAMESPACE}/${APP_NAME}:${BUILD_VERSION}"
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                echo "Unknown parameter: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# Show help message
show_help() {
    echo -e "${CYAN}EchoTune AI - DigitalOcean Production Deployment${NC}"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --domain=DOMAIN       Custom domain (default: auto-detected IP with nip.io)"
    echo "  --skip-ssl            Skip SSL certificate setup"
    echo "  --force-rebuild       Force rebuild all containers"
    echo "  --use-registry        Use DigitalOcean Container Registry"
    echo "  --namespace=NAME      DigitalOcean registry namespace"
    echo "  --help                Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  DOMAIN               Domain name to use"
    echo "  DO_NAMESPACE         DigitalOcean container registry namespace"
    echo "  SKIP_SSL             Skip SSL setup (true/false)"
    echo "  FORCE_REBUILD        Force rebuild containers (true/false)"
    echo ""
}

# Logging functions
log() {
    local message="$1"
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo -e "${GREEN}[${timestamp}] ✓ ${message}${NC}" | tee -a "$LOG_FILE" 2>/dev/null || echo -e "${GREEN}[${timestamp}] ✓ ${message}${NC}"
}

error() {
    local message="$1"
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo -e "${RED}[${timestamp}] ✗ ERROR: ${message}${NC}" | tee -a "$LOG_FILE" 2>/dev/null || echo -e "${RED}[${timestamp}] ✗ ERROR: ${message}${NC}"
    exit 1
}

warning() {
    local message="$1"
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo -e "${YELLOW}[${timestamp}] ⚠ WARNING: ${message}${NC}" | tee -a "$LOG_FILE" 2>/dev/null || echo -e "${YELLOW}[${timestamp}] ⚠ WARNING: ${message}${NC}"
}

info() {
    local message="$1"
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo -e "${BLUE}[${timestamp}] ℹ INFO: ${message}${NC}" | tee -a "$LOG_FILE" 2>/dev/null || echo -e "${BLUE}[${timestamp}] ℹ INFO: ${message}${NC}"
}

# Print deployment header
print_header() {
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║                🌊 EchoTune AI - DigitalOcean Production Deploy               ║${NC}"
    echo -e "${PURPLE}║                     Ubuntu 22.04 Optimized Deployment                       ║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    info "🚀 Starting DigitalOcean production deployment..."
    info "🌐 Target Domain: $DOMAIN"
    info "📦 Build Version: $BUILD_VERSION"
    info "🐳 Container Image: $CONTAINER_IMAGE"
    info "📝 Deployment Log: $LOG_FILE"
    echo ""
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root or with sudo"
    fi
    log "Running with root privileges - verified"
}

# Detect environment
detect_environment() {
    log "Detecting deployment environment..."
    
    # Check if running on DigitalOcean
    if curl -s --connect-timeout 5 --max-time 10 http://169.254.169.254/metadata/v1/id &>/dev/null; then
        local droplet_id=$(curl -s http://169.254.169.254/metadata/v1/id)
        local public_ip=$(curl -s http://169.254.169.254/metadata/v1/interfaces/public/0/ipv4/address)
        log "✓ Running on DigitalOcean Droplet (ID: $droplet_id)"
        log "✓ Public IP: $public_ip"
        
        # Use IP-based domain if none specified
        if [[ "$DOMAIN" == *"nip.io"* ]]; then
            DOMAIN="${public_ip}.nip.io"
            log "✓ Auto-configured domain: $DOMAIN"
        fi
    else
        log "✓ Running on non-DigitalOcean environment"
    fi
    
    # Detect Ubuntu version
    if [[ -f /etc/lsb-release ]]; then
        local ubuntu_version=$(lsb_release -rs)
        log "✓ Ubuntu version: $ubuntu_version"
        
        if [[ "$ubuntu_version" != "22.04" ]]; then
            warning "This script is optimized for Ubuntu 22.04 LTS"
            warning "Current version: $ubuntu_version - proceeding with caution"
        fi
    fi
}

# Initialize deployment environment
initialize_environment() {
    log "Initializing deployment environment..."
    
    # Create deployment directories
    mkdir -p "$LOG_DIR"
    mkdir -p "$DEPLOY_DIR"
    mkdir -p "$DEPLOY_DIR/ssl"
    mkdir -p "$DEPLOY_DIR/data"
    mkdir -p "$DEPLOY_DIR/backups"
    
    # Create deployment user if it doesn't exist
    if ! id "$DEPLOY_USER" &>/dev/null; then
        useradd -r -s /bin/bash -d "$DEPLOY_DIR" -m "$DEPLOY_USER"
        log "Created deployment user: $DEPLOY_USER"
    fi
    
    # Set proper ownership
    chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_DIR"
    
    log "Environment initialization completed"
}

# Install or update system dependencies
install_dependencies() {
    log "Installing/updating system dependencies..."
    
    # Update system
    apt-get update -qq
    
    # Install essential packages for Ubuntu 22.04
    DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
        curl \
        wget \
        git \
        unzip \
        jq \
        htop \
        nano \
        ufw \
        logrotate \
        fail2ban \
        certbot \
        python3-certbot-nginx \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release
    
    log "System dependencies installed"
}

# Install Docker if not present
install_docker() {
    if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
        log "Docker already installed, checking version..."
        local docker_version=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
        log "✓ Docker version: $docker_version"
        return 0
    fi
    
    log "Installing Docker for Ubuntu 22.04..."
    
    # Remove old Docker installations
    apt-get remove -y docker docker-engine docker.io containerd runc || true
    
    # Add Docker's official GPG key
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    
    # Add Docker repository
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
        $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
        tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    apt-get update -qq
    DEBIAN_FRONTEND=noninteractive apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Start and enable Docker
    systemctl enable docker
    systemctl start docker
    
    # Add deployment user to docker group
    usermod -aG docker "$DEPLOY_USER"
    
    log "Docker installation completed"
}

# Install nginx if not present
install_nginx() {
    if command -v nginx &> /dev/null; then
        log "nginx already installed"
        return 0
    fi
    
    log "Installing nginx..."
    
    DEBIAN_FRONTEND=noninteractive apt-get install -y nginx
    systemctl enable nginx
    systemctl start nginx
    
    log "nginx installation completed"
}

# Deploy application code
deploy_application() {
    log "Deploying EchoTune AI application..."
    
    # Switch to deployment user context
    runuser -l "$DEPLOY_USER" -c "
        set -euo pipefail
        cd \"$DEPLOY_DIR\"
        
        # Clone or update repository
        if [ ! -d \".git\" ]; then
            echo \"Cloning repository...\"
            git clone https://github.com/dzp5103/Spotify-echo.git .
        else
            echo \"Updating repository...\"
            git fetch origin
            git reset --hard origin/main
            git pull origin main
        fi
        
        # Configure environment
        cp .env.example .env
        
        # Update domain configuration
        sed -i \"s/DOMAIN=your-domain.com/DOMAIN=$DOMAIN/g\" .env
        sed -i \"s/FRONTEND_URL=https:\/\/your-domain.com/FRONTEND_URL=https:\/\/$DOMAIN/g\" .env
        sed -i \"s/your-domain.com/$DOMAIN/g\" .env
        
        # Generate secure secrets
        SESSION_SECRET=\$(openssl rand -hex 32)
        JWT_SECRET=\$(openssl rand -hex 32)
        sed -i \"s/generate_new_secret_here_using_openssl_rand_hex_32/\$SESSION_SECRET/g\" .env
        
        # Set production environment
        sed -i 's/NODE_ENV=development/NODE_ENV=production/g' .env
        sed -i 's/DEBUG=true/DEBUG=false/g' .env
    "
    
    log "Application deployment completed"
}

# Configure SSL certificates
setup_ssl() {
    if [[ "$SKIP_SSL" == "true" ]]; then
        log "SSL setup skipped as requested"
        return 0
    fi
    
    log "Setting up SSL certificates for $DOMAIN..."
    
    # Skip SSL for .nip.io domains (they don't support Let's Encrypt)
    if [[ "$DOMAIN" == *".nip.io" ]]; then
        warning "Using nip.io domain - creating self-signed certificate"
        
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "$DEPLOY_DIR/ssl/$DOMAIN.key" \
            -out "$DEPLOY_DIR/ssl/$DOMAIN.crt" \
            -subj "/C=US/ST=CA/L=SF/O=EchoTune/CN=$DOMAIN" &>/dev/null
        
        chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_DIR/ssl"
        log "✓ Self-signed certificate created for $DOMAIN"
        return 0
    fi
    
    # Try Let's Encrypt for real domains
    systemctl stop nginx || true
    
    if certbot certonly --standalone --non-interactive --agree-tos --email "admin@$DOMAIN" --domains "$DOMAIN"; then
        # Copy certificates
        cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$DEPLOY_DIR/ssl/$DOMAIN.crt"
        cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$DEPLOY_DIR/ssl/$DOMAIN.key"
        chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_DIR/ssl"
        
        # Set up auto-renewal
        echo "0 12 * * * /usr/bin/certbot renew --quiet && /bin/systemctl reload nginx" | crontab -
        log "✓ Let's Encrypt certificate obtained and auto-renewal configured"
    else
        warning "Let's Encrypt failed, creating self-signed certificate"
        
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "$DEPLOY_DIR/ssl/$DOMAIN.key" \
            -out "$DEPLOY_DIR/ssl/$DOMAIN.crt" \
            -subj "/C=US/ST=CA/L=SF/O=EchoTune/CN=$DOMAIN" &>/dev/null
        
        chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_DIR/ssl"
        log "✓ Self-signed certificate created"
    fi
    
    systemctl start nginx
}

# Configure nginx
configure_nginx() {
    log "Configuring nginx for $DOMAIN..."
    
    # Create nginx configuration
    cat > /etc/nginx/sites-available/echotune << EOF
# EchoTune AI nginx configuration - Auto-generated for $DOMAIN
upstream echotune_backend {
    server app:3000;
    keepalive 32;
}

# HTTP server (redirect to HTTPS or serve directly)
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Health check
    location = /health {
        proxy_pass http://echotune_backend;
        access_log off;
    }
    
    # Main location
    location / {
EOF
    
    # Add HTTPS redirect if SSL is enabled
    if [[ "$SKIP_SSL" != "true" ]]; then
        cat >> /etc/nginx/sites-available/echotune << EOF
        return 301 https://\$server_name\$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN;
    
    # SSL configuration
    ssl_certificate $DEPLOY_DIR/ssl/$DOMAIN.crt;
    ssl_certificate_key $DEPLOY_DIR/ssl/$DOMAIN.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Logging
    access_log /var/log/nginx/echotune_access.log;
    error_log /var/log/nginx/echotune_error.log;
    
    # Health check
    location = /health {
        proxy_pass http://echotune_backend;
        access_log off;
    }
    
    # API endpoints
    location /api/ {
        proxy_pass http://echotune_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Main application
    location / {
EOF
    fi
    
    cat >> /etc/nginx/sites-available/echotune << EOF
        proxy_pass http://echotune_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF
    
    # Enable the site
    ln -sf /etc/nginx/sites-available/echotune /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Test and reload nginx
    if nginx -t; then
        systemctl reload nginx
        log "✓ nginx configuration updated and reloaded"
    else
        error "nginx configuration test failed"
    fi
}

# Configure firewall
configure_firewall() {
    log "Configuring UFW firewall..."
    
    # Configure UFW with proper defaults
    ufw --force reset &>/dev/null || true
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow essential ports
    ufw allow ssh
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Enable firewall
    ufw --force enable
    
    log "Firewall configured and enabled"
}

# Build and start application
start_application() {
    log "Building and starting EchoTune AI application..."
    
    cd "$DEPLOY_DIR"
    
    # Build and start as deployment user
    runuser -l "$DEPLOY_USER" -c "
        set -euo pipefail
        cd '$DEPLOY_DIR'
        
        # Stop any existing containers
        docker-compose down --timeout 10 2>/dev/null || true
        
        # Install production dependencies
        npm ci --only=production --no-audit --no-fund --silent
        
        # Build and start containers
        if [[ '$FORCE_REBUILD' == 'true' ]]; then
            docker-compose build --no-cache
        fi
        
        docker-compose up -d --build
    "
    
    log "Application build and startup completed"
}

# Perform health checks
perform_health_checks() {
    log "Performing deployment health checks..."
    
    # Wait for application to start
    sleep 30
    
    # Check Docker containers
    cd "$DEPLOY_DIR"
    if runuser -l "$DEPLOY_USER" -c "cd '$DEPLOY_DIR' && docker-compose ps | grep -q 'Up'"; then
        log "✓ Docker containers are running"
    else
        warning "Some Docker containers may not be running properly"
    fi
    
    # Check application health endpoint
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -m 10 "http://localhost/health" &>/dev/null; then
            log "✓ Application health check passed"
            break
        else
            if [ $attempt -eq $max_attempts ]; then
                warning "Application health check failed after $max_attempts attempts"
            else
                info "Health check attempt $attempt/$max_attempts failed, retrying..."
                sleep 10
                ((attempt++))
            fi
        fi
    done
    
    # Check external access
    if [[ "$SKIP_SSL" != "true" ]]; then
        if curl -f -m 10 "https://$DOMAIN/health" &>/dev/null; then
            log "✓ HTTPS external access verified"
        else
            warning "HTTPS external access may not be working"
        fi
    else
        if curl -f -m 10 "http://$DOMAIN/health" &>/dev/null; then
            log "✓ HTTP external access verified"
        else
            warning "HTTP external access may not be working"
        fi
    fi
    
    log "Health checks completed"
}

# Create helpful management tools
create_management_tools() {
    log "Creating management tools and aliases..."
    
    # Create management script
    cat > /usr/local/bin/echotune-manage << 'EOF'
#!/bin/bash
DEPLOY_DIR="/opt/echotune"
DEPLOY_USER="echotune"

case "$1" in
    start)
        echo "Starting EchoTune AI..."
        cd "$DEPLOY_DIR" && sudo -u "$DEPLOY_USER" docker-compose up -d
        ;;
    stop)
        echo "Stopping EchoTune AI..."
        cd "$DEPLOY_DIR" && sudo -u "$DEPLOY_USER" docker-compose down
        ;;
    restart)
        echo "Restarting EchoTune AI..."
        cd "$DEPLOY_DIR" && sudo -u "$DEPLOY_USER" docker-compose restart
        ;;
    status)
        echo "EchoTune AI Status:"
        cd "$DEPLOY_DIR" && sudo -u "$DEPLOY_USER" docker-compose ps
        ;;
    logs)
        echo "EchoTune AI Logs:"
        cd "$DEPLOY_DIR" && sudo -u "$DEPLOY_USER" docker-compose logs -f
        ;;
    health)
        echo "Health Check:"
        curl -s http://localhost/health | jq . || curl -s http://localhost/health
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|health}"
        exit 1
        ;;
esac
EOF
    
    chmod +x /usr/local/bin/echotune-manage
    
    # Create helpful aliases
    cat >> /etc/bash.bashrc << 'EOF'

# EchoTune AI management aliases
alias echotune-start='echotune-manage start'
alias echotune-stop='echotune-manage stop'
alias echotune-restart='echotune-manage restart'
alias echotune-status='echotune-manage status'
alias echotune-logs='echotune-manage logs'
alias echotune-health='echotune-manage health'
EOF
    
    log "Management tools created"
}

# Show deployment summary
show_deployment_summary() {
    local public_ip=$(curl -s ifconfig.me)
    
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    🎉 DIGITALOCEAN DEPLOYMENT COMPLETE! 🎉                 ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    echo -e "${BOLD}🌐 Access Your EchoTune AI Application:${NC}"
    if [[ "$SKIP_SSL" == "true" ]]; then
        echo "   🔗 HTTP: http://$DOMAIN"
        echo "   🔗 Direct IP: http://$public_ip"
    else
        echo "   🔒 HTTPS: https://$DOMAIN"
        echo "   🔗 HTTP: http://$DOMAIN (redirects to HTTPS)"
    fi
    echo "   🏥 Health Check: http://$public_ip/health"
    echo ""
    
    echo -e "${BOLD}📊 Deployment Information:${NC}"
    echo "   🏷️  Build Version: $BUILD_VERSION"
    echo "   📦 Container Image: $CONTAINER_IMAGE"
    echo "   📁 Deploy Directory: $DEPLOY_DIR"
    echo "   👤 Deploy User: $DEPLOY_USER"
    echo "   🌐 Domain: $DOMAIN"
    echo "   📍 Server IP: $public_ip"
    echo ""
    
    echo -e "${BOLD}🛠️ Management Commands:${NC}"
    echo "   🚀 Start Services: ${CYAN}echotune-start${NC}"
    echo "   🛑 Stop Services: ${CYAN}echotune-stop${NC}"
    echo "   🔄 Restart Services: ${CYAN}echotune-restart${NC}"
    echo "   📊 Check Status: ${CYAN}echotune-status${NC}"
    echo "   📝 View Logs: ${CYAN}echotune-logs${NC}"
    echo "   🏥 Health Check: ${CYAN}echotune-health${NC}"
    echo ""
    
    echo -e "${BOLD}📁 Important Files:${NC}"
    echo "   📋 Application: /opt/echotune"
    echo "   📝 Environment: /opt/echotune/.env"
    echo "   🔐 SSL Certificates: /opt/echotune/ssl/"
    echo "   📊 nginx Config: /etc/nginx/sites-available/echotune"
    echo "   📜 Deployment Log: $LOG_FILE"
    echo ""
    
    if [[ "$SKIP_SSL" != "true" ]]; then
        echo -e "${BOLD}🔒 SSL Information:${NC}"
        if [[ "$DOMAIN" == *".nip.io" ]]; then
            echo "   🔧 Certificate Type: Self-signed (nip.io domain)"
        else
            echo "   🔧 Certificate Type: Let's Encrypt"
            echo "   🔄 Auto-renewal: Configured"
        fi
        echo "   📄 Certificate: /opt/echotune/ssl/$DOMAIN.crt"
        echo "   🔑 Private Key: /opt/echotune/ssl/$DOMAIN.key"
        echo ""
    fi
    
    echo -e "${BOLD}🔧 Next Steps:${NC}"
    echo "   1. Configure Spotify API credentials in /opt/echotune/.env"
    echo "   2. Add AI provider API keys for enhanced functionality"
    echo "   3. Set up monitoring and backup procedures"
    echo "   4. Configure domain DNS (if using custom domain)"
    echo ""
    
    echo -e "${CYAN}🆘 Need Help?${NC}"
    echo "   📚 Documentation: https://github.com/dzp5103/Spotify-echo#readme"
    echo "   🐛 Issues: https://github.com/dzp5103/Spotify-echo/issues"
    echo "   📧 Support: Check GitHub discussions"
    echo ""
    
    echo -e "${PURPLE}🎵 Your DigitalOcean-powered music platform is ready!${NC}"
    echo ""
}

# Main deployment function
main() {
    parse_arguments "$@"
    print_header
    check_root
    detect_environment
    initialize_environment
    install_dependencies
    install_docker
    install_nginx
    deploy_application
    setup_ssl
    configure_nginx
    configure_firewall
    start_application
    perform_health_checks
    create_management_tools
    show_deployment_summary
    
    log "🎉 DigitalOcean production deployment completed successfully!"
}

# Error handling
trap 'error "Deployment failed on line $LINENO"' ERR

# Execute main function
main "$@"