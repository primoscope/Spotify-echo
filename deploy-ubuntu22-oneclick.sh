#!/bin/bash

# ===================================================================
# EchoTune AI - Enhanced One-Click Deployment for Ubuntu 22.04
# Complete deployment with Docker, nginx, SSL, and domain configuration
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

# Configuration variables
REPO_URL="https://github.com/dzp5103/Spotify-echo.git"
APP_DIR="/opt/echotune"
APP_USER="echotune"
SCRIPT_LOG="/tmp/echotune-deploy-$(date +%Y%m%d-%H%M%S).log"
UBUNTU_VERSION=""
DOMAIN=""
EMAIL=""
SKIP_SSL=""
DEV_MODE=""

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --domain=*)
                DOMAIN="${1#*=}"
                shift
                ;;
            --email=*)
                EMAIL="${1#*=}"
                shift
                ;;
            --skip-ssl)
                SKIP_SSL="true"
                shift
                ;;
            --dev-mode)
                DEV_MODE="true"
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
    echo -e "${CYAN}EchoTune AI - One-Click Deployment Script${NC}"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --domain=DOMAIN     Your domain name (e.g., example.com)"
    echo "  --email=EMAIL       Email for SSL certificates"
    echo "  --skip-ssl          Skip SSL certificate setup"
    echo "  --dev-mode          Install in development mode"
    echo "  --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --domain=example.com --email=admin@example.com"
    echo "  $0 --skip-ssl  # Local development without SSL"
    echo ""
}

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

# Print deployment header
print_header() {
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║                🎵 EchoTune AI - One-Click Deployment                      ║${NC}"
    echo -e "${PURPLE}║                   Ubuntu 22.04 LTS Optimized Installation                   ║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    info "🚀 Starting enhanced one-click deployment..."
    info "📝 Installation log: $SCRIPT_LOG"
    
    if [[ -n "$DOMAIN" ]]; then
        info "🌐 Domain: $DOMAIN"
    fi
    
    if [[ -n "$EMAIL" ]]; then
        info "📧 Email: $EMAIL"
    fi
    
    if [[ "$SKIP_SSL" == "true" ]]; then
        info "🔓 SSL setup will be skipped"
    fi
    
    if [[ "$DEV_MODE" == "true" ]]; then
        info "🔧 Development mode enabled"
    fi
    
    echo ""
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root or with sudo"
    fi
    log "Running with root privileges - verified"
}

# Detect Ubuntu version
detect_ubuntu_version() {
    if [[ -f /etc/lsb-release ]]; then
        UBUNTU_VERSION=$(lsb_release -rs)
        log "Detected Ubuntu version: $UBUNTU_VERSION"
        
        if [[ "$UBUNTU_VERSION" != "22.04" ]]; then
            warning "This script is optimized for Ubuntu 22.04 LTS"
            warning "Detected version: Ubuntu $UBUNTU_VERSION"
            warning "Continuing installation but some steps might need adjustment..."
        else
            log "✓ Ubuntu 22.04 LTS detected - perfect compatibility"
        fi
    else
        warning "Could not detect Ubuntu version, continuing..."
    fi
}

# Interactive configuration if parameters not provided
interactive_config() {
    if [[ -z "$DOMAIN" && "$SKIP_SSL" != "true" ]]; then
        echo ""
        echo -e "${CYAN}📋 Configuration Setup${NC}"
        echo ""
        
        # Get domain name
        while true; do
            read -p "Enter your domain name (e.g., example.com): " input_domain
            if [[ -n "$input_domain" ]]; then
                DOMAIN="$input_domain"
                break
            else
                echo "Please enter a valid domain name."
            fi
        done
        
        # Get email for SSL
        while true; do
            read -p "Enter your email for SSL certificates: " input_email
            if [[ "$input_email" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
                EMAIL="$input_email"
                break
            else
                echo "Please enter a valid email address."
            fi
        done
        
        info "✓ Configuration completed"
        info "Domain: $DOMAIN"
        info "Email: $EMAIL"
        echo ""
    elif [[ "$SKIP_SSL" == "true" ]]; then
        info "✓ SSL setup skipped - using localhost/IP configuration"
        DOMAIN="localhost"
    fi
}

# Install system dependencies
install_system_dependencies() {
    log "Installing system dependencies for Ubuntu 22.04..."
    
    # Update package lists
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
        jq \
        certbot \
        python3-certbot-nginx
    
    log "System dependencies installed successfully"
}

# Install Docker for Ubuntu 22.04
install_docker() {
    log "Installing Docker Engine for Ubuntu 22.04..."
    
    # Remove old Docker installations
    apt-get remove -y docker docker-engine docker.io containerd runc docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin 2>/dev/null || true
    
    # Add Docker's official GPG key
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    
    # Add Docker repository for Ubuntu 22.04
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
        $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
        tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    apt-get update -qq
    DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
        docker-ce \
        docker-ce-cli \
        containerd.io \
        docker-buildx-plugin \
        docker-compose-plugin
    
    # Configure Docker daemon
    mkdir -p /etc/docker
    cat > /etc/docker/daemon.json << 'EOF'
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "5"
    },
    "storage-driver": "overlay2",
    "live-restore": true,
    "userland-proxy": false
}
EOF
    
    # Start and enable Docker
    systemctl daemon-reload
    systemctl enable docker
    systemctl start docker
    
    # Create docker group and add user
    groupadd docker 2>/dev/null || true
    
    log "Docker installation completed"
}

# Install Node.js 20.x LTS
install_nodejs() {
    log "Installing Node.js 20.x LTS..."
    
    # Remove existing Node.js
    apt-get remove -y nodejs npm 2>/dev/null || true
    
    # Add NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    
    # Install Node.js
    DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs
    
    # Install essential global packages
    npm install -g pm2@latest
    
    local node_version=$(node --version)
    local npm_version=$(npm --version)
    
    log "✓ Node.js: $node_version"
    log "✓ npm: $npm_version"
    log "Node.js installation completed"
}

# Install and configure nginx
install_nginx() {
    log "Installing and configuring nginx..."
    
    # Install nginx
    DEBIAN_FRONTEND=noninteractive apt-get install -y nginx
    
    # Enable and start nginx
    systemctl enable nginx
    systemctl start nginx
    
    log "nginx installation completed"
}

# Set up application environment
setup_application() {
    log "Setting up EchoTune AI application environment..."
    
    # Create application user
    if ! id "$APP_USER" &>/dev/null; then
        useradd -r -s /bin/bash -d "$APP_DIR" -m "$APP_USER"
        log "Created application user: $APP_USER"
    fi
    
    # Create necessary directories
    local dirs=(
        "$APP_DIR"
        "$APP_DIR/ssl"
        "$APP_DIR/logs"
        "$APP_DIR/data"
        "$APP_DIR/backups"
        "$APP_DIR/nginx"
    )
    
    for dir in "${dirs[@]}"; do
        mkdir -p "$dir"
        chown "$APP_USER:$APP_USER" "$dir"
        chmod 755 "$dir"
    done
    
    # Add user to docker group
    usermod -aG docker "$APP_USER"
    
    log "Application environment setup completed"
}

# Deploy application
deploy_application() {
    log "Deploying EchoTune AI application..."
    
    # Switch to application directory and user
    cd "$APP_DIR"
    
    # Clone repository as application user
    runuser -l "$APP_USER" -c "
        cd '$APP_DIR'
        if [ ! -d '.git' ]; then
            git clone '$REPO_URL' .
        else
            git fetch origin
            git reset --hard origin/main
            git pull origin main
        fi
    "
    
    # Configure environment
    runuser -l "$APP_USER" -c "
        cd '$APP_DIR'
        cp .env.example .env
        
        # Update environment with provided configuration
        sed -i 's/DOMAIN=your-domain.com/DOMAIN=$DOMAIN/' .env
        sed -i 's/FRONTEND_URL=https:\/\/your-domain.com/FRONTEND_URL=https:\/\/$DOMAIN/' .env
        sed -i 's/SSL_CERT_PATH=\/etc\/nginx\/ssl\/your-domain.com.crt/SSL_CERT_PATH=$APP_DIR\/ssl\/$DOMAIN.crt/' .env
        sed -i 's/SSL_KEY_PATH=\/etc\/nginx\/ssl\/your-domain.com.key/SSL_KEY_PATH=$APP_DIR\/ssl\/$DOMAIN.key/' .env
        
        # Generate secure secrets
        SESSION_SECRET=\$(openssl rand -hex 32)
        JWT_SECRET=\$(openssl rand -hex 32)
        sed -i \"s/SESSION_SECRET=generate_new_secret_here_using_openssl_rand_hex_32/SESSION_SECRET=\$SESSION_SECRET/\" .env
        sed -i \"s/JWT_SECRET=generate_new_secret_here_using_openssl_rand_hex_32/JWT_SECRET=\$JWT_SECRET/\" .env
        
        if [[ '$EMAIL' != '' ]]; then
            sed -i 's/LETSENCRYPT_EMAIL=admin@your-domain.com/LETSENCRYPT_EMAIL=$EMAIL/' .env
        fi
    "
    
    log "Application deployment completed"
}

# Configure SSL certificates
setup_ssl() {
    if [[ "$SKIP_SSL" == "true" ]]; then
        log "Skipping SSL setup as requested"
        return 0
    fi
    
    log "Setting up SSL certificates for $DOMAIN..."
    
    # Stop nginx temporarily
    systemctl stop nginx || true
    
    # Try to obtain Let's Encrypt certificate
    if certbot certonly --standalone --non-interactive --agree-tos --email "$EMAIL" --domains "$DOMAIN" &>/dev/null; then
        # Copy certificates to application directory
        cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$APP_DIR/ssl/$DOMAIN.crt"
        cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$APP_DIR/ssl/$DOMAIN.key"
        chown -R "$APP_USER:$APP_USER" "$APP_DIR/ssl"
        log "✓ Let's Encrypt SSL certificate obtained and configured"
        
        # Set up automatic renewal
        echo "0 12 * * * /usr/bin/certbot renew --quiet && /bin/systemctl reload nginx" | crontab -
        log "✓ SSL certificate auto-renewal configured"
        
    else
        warning "Let's Encrypt certificate failed, creating self-signed certificate"
        
        # Generate self-signed certificate
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "$APP_DIR/ssl/$DOMAIN.key" \
            -out "$APP_DIR/ssl/$DOMAIN.crt" \
            -subj "/C=US/ST=CA/L=SF/O=EchoTune/CN=$DOMAIN" &>/dev/null
        
        chown -R "$APP_USER:$APP_USER" "$APP_DIR/ssl"
        log "✓ Self-signed SSL certificate created"
    fi
    
    # Start nginx again
    systemctl start nginx
}

# Configure nginx
configure_nginx() {
    log "Configuring nginx for $DOMAIN..."
    
    # Use the enhanced nginx configuration template
    local nginx_config="/etc/nginx/sites-available/echotune"
    
    # Create nginx configuration from template
    cat > "$nginx_config" << EOF
# EchoTune AI nginx configuration for $DOMAIN
events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;
    
    # Buffer settings
    client_body_buffer_size 128k;
    client_max_body_size 10M;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 4k;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss application/atom+xml image/svg+xml;
    
    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=auth:10m rate=5r/m;
    limit_req_zone \$binary_remote_addr zone=general:10m rate=20r/s;
    
    # Upstream
    upstream echotune_backend {
        server app:3000;
        keepalive 32;
    }
    
    # HTTP server
    server {
        listen 80;
        server_name $DOMAIN www.$DOMAIN;
        
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
        
        location = /health {
            proxy_pass http://echotune_backend;
            access_log off;
        }
        
        location / {
EOF

    if [[ "$SKIP_SSL" != "true" ]]; then
        cat >> "$nginx_config" << EOF
            return 301 https://\$server_name\$request_uri;
        }
    }
    
    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name $DOMAIN www.$DOMAIN;
        
        # SSL configuration
        ssl_certificate $APP_DIR/ssl/$DOMAIN.crt;
        ssl_certificate_key $APP_DIR/ssl/$DOMAIN.key;
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
        
        location = /health {
            proxy_pass http://echotune_backend;
            access_log off;
        }
        
        location /api/ {
            limit_req zone=api burst=20 nodelay;
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
        
        location /auth/ {
            limit_req zone=auth burst=5 nodelay;
            proxy_pass http://echotune_backend;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
        
        location / {
EOF
    fi
    
    cat >> "$nginx_config" << EOF
            limit_req zone=general burst=20 nodelay;
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
    }
}
EOF
    
    # Enable the site
    ln -sf "$nginx_config" /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Test nginx configuration
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
    
    # Reset UFW
    ufw --force reset
    
    # Set default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH
    ufw allow ssh
    ufw allow 22/tcp
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Allow application port for development
    if [[ "$DEV_MODE" == "true" ]]; then
        ufw allow 3000/tcp
    fi
    
    # Enable firewall
    ufw --force enable
    
    log "Firewall configured and enabled"
}

# Start application services
start_services() {
    log "Starting EchoTune AI application services..."
    
    cd "$APP_DIR"
    
    # Build and start services as application user
    runuser -l "$APP_USER" -c "
        cd '$APP_DIR'
        
        # Install production dependencies
        npm ci --only=production --no-audit --no-fund
        
        # Build and start with Docker Compose
        docker-compose down --timeout 10 2>/dev/null || true
        docker-compose up -d --build
    "
    
    log "Application services started"
}

# Create helpful aliases
create_aliases() {
    log "Creating helpful management aliases..."
    
    # Create aliases for all users
    cat >> /etc/bash.bashrc << 'EOF'

# EchoTune AI management aliases
alias echotune-start='cd /opt/echotune && sudo -u echotune docker-compose up -d'
alias echotune-stop='cd /opt/echotune && sudo -u echotune docker-compose down'
alias echotune-restart='cd /opt/echotune && sudo -u echotune docker-compose restart'
alias echotune-logs='cd /opt/echotune && sudo -u echotune docker-compose logs -f'
alias echotune-status='cd /opt/echotune && sudo -u echotune docker-compose ps'
alias echotune-health='curl -s http://localhost/health | jq .'
alias echotune-shell='cd /opt/echotune && sudo -u echotune docker-compose exec app /bin/sh'
alias docker-clean='docker system prune -f && docker volume prune -f'
alias nginx-test='nginx -t'
alias nginx-reload='systemctl reload nginx'
EOF
    
    log "Management aliases created"
}

# Perform health checks
perform_health_checks() {
    log "Performing deployment health checks..."
    
    # Wait for services to start
    sleep 30
    
    # Check Docker containers
    cd "$APP_DIR"
    if runuser -l "$APP_USER" -c "cd '$APP_DIR' && docker-compose ps | grep -q 'Up'"; then
        log "✓ Docker containers are running"
    else
        warning "Some Docker containers may not be running properly"
    fi
    
    # Check application health
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -m 10 "http://localhost/health" &>/dev/null; then
            log "✓ Application health check passed"
            break
        else
            warning "Health check attempt $attempt/$max_attempts failed"
            if [ $attempt -eq $max_attempts ]; then
                warning "Application may not be fully ready yet"
            else
                sleep 10
                ((attempt++))
            fi
        fi
    done
    
    # Check nginx
    if systemctl is-active --quiet nginx; then
        log "✓ nginx is running"
    else
        warning "nginx service may not be running correctly"
    fi
    
    # Check SSL if enabled
    if [[ "$SKIP_SSL" != "true" ]] && [[ -n "$DOMAIN" ]]; then
        if curl -f -m 10 "https://$DOMAIN/health" &>/dev/null; then
            log "✓ HTTPS access verified"
        else
            warning "HTTPS access may not be working yet"
        fi
    fi
    
    log "Health checks completed"
}

# Show deployment summary
show_deployment_summary() {
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                      🎉 DEPLOYMENT COMPLETED! 🎉                           ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    echo -e "${BOLD}🌐 Access Your EchoTune AI Application:${NC}"
    
    if [[ "$SKIP_SSL" == "true" ]]; then
        echo "   🔗 HTTP: http://$(curl -s ifconfig.me):80"
        echo "   🔗 Local: http://localhost"
    else
        echo "   🔒 HTTPS: https://$DOMAIN"
        echo "   🔗 HTTP: http://$DOMAIN (redirects to HTTPS)"
    fi
    
    echo "   🏥 Health Check: http://$(curl -s ifconfig.me)/health"
    echo ""
    
    echo -e "${BOLD}🎯 What Was Installed:${NC}"
    echo "   ✅ Docker Engine and Docker Compose"
    echo "   ✅ Node.js $(node --version) with npm and pm2"
    echo "   ✅ nginx web server with reverse proxy"
    if [[ "$SKIP_SSL" != "true" ]]; then
        echo "   ✅ SSL/TLS certificates configured"
        echo "   ✅ Auto-renewal setup for certificates"
    fi
    echo "   ✅ UFW firewall with secure defaults"
    echo "   ✅ EchoTune AI application fully deployed"
    echo "   ✅ Management aliases for easy operation"
    echo ""
    
    echo -e "${BOLD}🔧 Useful Commands:${NC}"
    echo "   📊 Check Status: ${CYAN}echotune-status${NC}"
    echo "   📝 View Logs: ${CYAN}echotune-logs${NC}"
    echo "   🔄 Restart App: ${CYAN}echotune-restart${NC}"
    echo "   🏥 Health Check: ${CYAN}echotune-health${NC}"
    echo "   🧹 Clean Docker: ${CYAN}docker-clean${NC}"
    echo "   🔧 Test nginx: ${CYAN}nginx-test${NC}"
    echo ""
    
    echo -e "${BOLD}📁 Important Locations:${NC}"
    echo "   📂 Application: ${CYAN}/opt/echotune${NC}"
    echo "   📝 Logs: ${CYAN}/opt/echotune/logs${NC}"
    echo "   🔐 SSL Certs: ${CYAN}/opt/echotune/ssl${NC}"
    echo "   📊 nginx Logs: ${CYAN}/var/log/nginx${NC}"
    echo ""
    
    if [[ "$SKIP_SSL" != "true" ]]; then
        echo -e "${BOLD}🔐 SSL Certificate Information:${NC}"
        echo "   📄 Certificate: /opt/echotune/ssl/$DOMAIN.crt"
        echo "   🔑 Private Key: /opt/echotune/ssl/$DOMAIN.key"
        echo "   🔄 Auto-renewal: Configured (runs daily at 12:00)"
        echo ""
    fi
    
    echo -e "${CYAN}📚 Need Help?${NC}"
    echo "   - Documentation: https://github.com/dzp5103/Spotify-echo#readme"
    echo "   - Issues: https://github.com/dzp5103/Spotify-echo/issues"
    echo "   - Ubuntu 22.04 Guide: docs/deployment/UBUNTU22_COMPLETE_GUIDE.md"
    echo ""
    
    echo -e "${CYAN}📝 Installation log saved to: ${SCRIPT_LOG}${NC}"
    echo ""
    
    echo -e "${PURPLE}🎵 Your AI-powered music discovery platform is ready!${NC}"
    echo ""
}

# Main deployment function
main() {
    # Parse command line arguments
    parse_arguments "$@"
    
    # Show header and start deployment
    print_header
    check_root
    detect_ubuntu_version
    interactive_config
    
    # Core installation steps
    install_system_dependencies
    install_docker
    install_nodejs
    install_nginx
    setup_application
    deploy_application
    
    # Configuration and security
    if [[ "$SKIP_SSL" != "true" ]]; then
        setup_ssl
    fi
    configure_nginx
    configure_firewall
    
    # Start services and finalize
    start_services
    create_aliases
    perform_health_checks
    show_deployment_summary
    
    log "🎉 EchoTune AI one-click deployment completed successfully!"
}

# Error handling
trap 'error "Deployment failed on line $LINENO"' ERR

# Execute main function
main "$@"