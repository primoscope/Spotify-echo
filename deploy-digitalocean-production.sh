#!/bin/bash

# ===================================================================
# EchoTune AI - DigitalOcean Production Deployment Script
# Domain: primosphere.studio
# IPs: 159.223.207.187 (Primary), 209.38.5.39 (Reserved)
# ===================================================================

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="primosphere.studio"
PRIMARY_IP="159.223.207.187"
RESERVED_IP="209.38.5.39"
APP_NAME="echotune-ai"
DEPLOY_USER="echotune"
DOCKER_REGISTRY="registry.digitalocean.com/echotune"
BUILD_VERSION="${BUILD_VERSION:-$(date +%Y%m%d-%H%M%S)}"

# Directories
DEPLOY_DIR="/opt/echotune"
LOG_FILE="${DEPLOY_DIR}/logs/deployment-$(date +%Y%m%d-%H%M%S).log"

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a "$LOG_FILE"
}

# Check if running as root or with sudo
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root or with sudo"
    fi
}

# Create deployment user and directories
setup_user_and_dirs() {
    log "Setting up deployment user and directories..."
    
    # Create echotune user if it doesn't exist
    if ! id "$DEPLOY_USER" &>/dev/null; then
        useradd -r -s /bin/bash -d "$DEPLOY_DIR" -m "$DEPLOY_USER"
        usermod -aG docker "$DEPLOY_USER"
        log "Created user: $DEPLOY_USER"
    else
        log "User $DEPLOY_USER already exists"
    fi
    
    # Create directory structure
    mkdir -p "$DEPLOY_DIR"/{ssl,letsencrypt,logs,data,static,mongodb/{data,config},redis/data,nginx/logs,certbot,backups}
    
    # Set proper permissions
    chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_DIR"
    chmod -R 755 "$DEPLOY_DIR"
    chmod 700 "$DEPLOY_DIR"/ssl
    
    log "Directory structure created and permissions set"
}

# Install system dependencies
install_dependencies() {
    log "Installing system dependencies..."
    
    # Update system
    apt-get update
    
    # Install required packages
    apt-get install -y \
        curl \
        wget \
        git \
        unzip \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release \
        ufw \
        fail2ban \
        logrotate \
        certbot \
        python3-certbot-nginx \
        htop \
        ncdu \
        jq
    
    log "System dependencies installed"
}

# Install Docker and Docker Compose
install_docker() {
    log "Installing Docker and Docker Compose..."
    
    # Check if Docker is already installed
    if command -v docker &> /dev/null; then
        log "Docker is already installed"
        return 0
    fi
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Update and install Docker
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    # Add deploy user to docker group
    usermod -aG docker "$DEPLOY_USER"
    
    log "Docker and Docker Compose installed successfully"
}

# Configure firewall
setup_firewall() {
    log "Configuring UFW firewall..."
    
    # Reset UFW to defaults
    ufw --force reset
    
    # Set default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH (make sure this matches your SSH port)
    ufw allow 22/tcp comment 'SSH'
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp comment 'HTTP'
    ufw allow 443/tcp comment 'HTTPS'
    
    # Allow ping
    ufw allow out 53
    
    # Enable UFW
    ufw --force enable
    
    log "Firewall configured successfully"
}

# Setup fail2ban for security
setup_fail2ban() {
    log "Configuring fail2ban..."
    
    cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
backend = systemd

[sshd]
enabled = true
mode = aggressive
port = ssh
logpath = %(sshd_log)s

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /opt/echotune/nginx/logs/*.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /opt/echotune/nginx/logs/*.log
maxretry = 10

[nginx-botsearch]
enabled = true
filter = nginx-botsearch
port = http,https
logpath = /opt/echotune/nginx/logs/*.log
maxretry = 2
EOF
    
    systemctl restart fail2ban
    systemctl enable fail2ban
    
    log "fail2ban configured successfully"
}

# Setup log rotation
setup_logrotate() {
    log "Setting up log rotation..."
    
    cat > /etc/logrotate.d/echotune << 'EOF'
/opt/echotune/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 echotune echotune
    postrotate
        docker exec echotune-nginx nginx -s reload 2>/dev/null || true
    endscript
}

/opt/echotune/nginx/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 644 echotune echotune
    sharedscripts
    postrotate
        docker exec echotune-nginx nginx -s reload 2>/dev/null || true
    endscript
}
EOF
    
    log "Log rotation configured"
}

# Create systemd service for automatic startup
create_systemd_service() {
    log "Creating systemd service..."
    
    cat > /etc/systemd/system/echotune.service << EOF
[Unit]
Description=EchoTune AI Music Recommendation System
Requires=docker.service
After=docker.service
StartLimitIntervalSec=0

[Service]
Type=oneshot
RemainAfterExit=yes
User=$DEPLOY_USER
Group=$DEPLOY_USER
WorkingDirectory=$DEPLOY_DIR
Environment=COMPOSE_PROJECT_NAME=$APP_NAME
Environment=BUILD_VERSION=$BUILD_VERSION
ExecStart=/usr/bin/docker compose -f docker-compose.yml --profile production up -d
ExecStop=/usr/bin/docker compose -f docker-compose.yml --profile production down
ExecReload=/usr/bin/docker compose -f docker-compose.yml --profile production restart
TimeoutStartSec=600
TimeoutStopSec=300
Restart=on-failure
RestartSec=30

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    systemctl enable echotune.service
    
    log "Systemd service created and enabled"
}

# Setup SSL certificates with Let's Encrypt
setup_ssl() {
    log "Setting up SSL certificates for $DOMAIN..."
    
    # Stop any running nginx to free up port 80
    systemctl stop nginx 2>/dev/null || true
    docker stop echotune-nginx 2>/dev/null || true
    
    # Obtain SSL certificate using standalone method
    if certbot certonly \
        --standalone \
        --non-interactive \
        --agree-tos \
        --email admin@$DOMAIN \
        --domains $DOMAIN,www.$DOMAIN; then
        
        log "SSL certificate obtained successfully"
        
        # Copy certificates to nginx ssl directory
        mkdir -p "$DEPLOY_DIR/ssl"
        cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$DEPLOY_DIR/ssl/$DOMAIN.crt"
        cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$DEPLOY_DIR/ssl/$DOMAIN.key"
        
        # Set proper permissions
        chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_DIR/ssl"
        chmod 600 "$DEPLOY_DIR/ssl"/*
        
        # Setup automatic renewal
        echo "0 2 * * 1 root certbot renew --quiet --post-hook 'docker exec echotune-nginx nginx -s reload'" > /etc/cron.d/echotune-ssl-renew
        
        log "SSL certificate configured and auto-renewal setup"
    else
        warning "Failed to obtain SSL certificate, will use self-signed certificate"
        
        # Generate self-signed certificate as fallback
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "$DEPLOY_DIR/ssl/$DOMAIN.key" \
            -out "$DEPLOY_DIR/ssl/$DOMAIN.crt" \
            -subj "/C=US/ST=CA/L=San Francisco/O=EchoTune AI/CN=$DOMAIN"
        
        chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_DIR/ssl"
        chmod 600 "$DEPLOY_DIR/ssl"/*
    fi
}

# Deploy application
deploy_application() {
    log "Deploying EchoTune AI application..."
    
    # Switch to deploy user
    sudo -u "$DEPLOY_USER" bash << EOF
cd "$DEPLOY_DIR"

# Clone or update repository
if [ ! -d ".git" ]; then
    git clone https://github.com/dzp5103/Spotify-echo.git .
else
    git pull origin main
fi

# Create production environment file
cp .env.production .env

# Update environment variables for production
sed -i "s/DOMAIN=.*/DOMAIN=$DOMAIN/" .env
sed -i "s/DIGITALOCEAN_IP_PRIMARY=.*/DIGITALOCEAN_IP_PRIMARY=$PRIMARY_IP/" .env
sed -i "s/DIGITALOCEAN_IP_RESERVED=.*/DIGITALOCEAN_IP_RESERVED=$RESERVED_IP/" .env
sed -i "s|SSL_CERT_PATH=.*|SSL_CERT_PATH=/etc/nginx/ssl/$DOMAIN.crt|" .env
sed -i "s|SSL_KEY_PATH=.*|SSL_KEY_PATH=/etc/nginx/ssl/$DOMAIN.key|" .env

# Build and deploy with Docker Compose
docker compose -f docker-compose.yml --profile production build --no-cache
docker compose -f docker-compose.yml --profile production up -d

# Wait for services to be healthy
echo "Waiting for services to start..."
sleep 30

# Check service health
docker compose -f docker-compose.yml ps
EOF
    
    log "Application deployed successfully"
}

# Verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    # Wait for services to be fully ready
    sleep 10
    
    # Check if containers are running
    if ! sudo -u "$DEPLOY_USER" docker compose -f "$DEPLOY_DIR/docker-compose.yml" ps | grep -q "Up"; then
        error "Some containers are not running properly"
    fi
    
    # Test HTTP health check
    if curl -f "http://localhost/health" &>/dev/null; then
        log "HTTP health check passed"
    else
        warning "HTTP health check failed, but this might be expected if SSL redirect is enforced"
    fi
    
    # Test HTTPS health check (if SSL is configured)
    if curl -f -k "https://localhost/health" &>/dev/null; then
        log "HTTPS health check passed"
    else
        warning "HTTPS health check failed"
    fi
    
    # Check domain resolution
    if curl -f -k "https://$DOMAIN/health" &>/dev/null; then
        log "Domain health check passed"
    else
        warning "Domain health check failed - make sure DNS is properly configured"
    fi
    
    log "Deployment verification completed"
}

# Display deployment summary
show_summary() {
    log "🎉 EchoTune AI deployment completed successfully!"
    
    echo -e "\n${CYAN}=== Deployment Summary ===${NC}"
    echo -e "${GREEN}✅ Domain:${NC} https://$DOMAIN"
    echo -e "${GREEN}✅ Primary IP:${NC} $PRIMARY_IP"
    echo -e "${GREEN}✅ Reserved IP:${NC} $RESERVED_IP"
    echo -e "${GREEN}✅ Application:${NC} EchoTune AI Music Recommendation System"
    echo -e "${GREEN}✅ Version:${NC} $BUILD_VERSION"
    
    echo -e "\n${CYAN}=== Service Status ===${NC}"
    sudo -u "$DEPLOY_USER" docker compose -f "$DEPLOY_DIR/docker-compose.yml" ps
    
    echo -e "\n${CYAN}=== Management Commands ===${NC}"
    echo -e "${YELLOW}Start services:${NC} sudo systemctl start echotune"
    echo -e "${YELLOW}Stop services:${NC} sudo systemctl stop echotune"
    echo -e "${YELLOW}Restart services:${NC} sudo systemctl restart echotune"
    echo -e "${YELLOW}View logs:${NC} sudo -u $DEPLOY_USER docker compose -f $DEPLOY_DIR/docker-compose.yml logs -f"
    echo -e "${YELLOW}Check status:${NC} sudo systemctl status echotune"
    
    echo -e "\n${CYAN}=== Important Files ===${NC}"
    echo -e "${YELLOW}Configuration:${NC} $DEPLOY_DIR/.env"
    echo -e "${YELLOW}SSL Certificates:${NC} $DEPLOY_DIR/ssl/"
    echo -e "${YELLOW}Application Data:${NC} $DEPLOY_DIR/data/"
    echo -e "${YELLOW}Logs:${NC} $DEPLOY_DIR/logs/"
    echo -e "${YELLOW}Backups:${NC} $DEPLOY_DIR/backups/"
    
    echo -e "\n${CYAN}=== Next Steps ===${NC}"
    echo -e "${BLUE}1.${NC} Configure your Spotify API credentials in $DEPLOY_DIR/.env"
    echo -e "${BLUE}2.${NC} Set up your database credentials (MongoDB/Supabase)"
    echo -e "${BLUE}3.${NC} Configure AI provider API keys (Gemini, OpenAI, etc.)"
    echo -e "${BLUE}4.${NC} Test the application: curl -k https://$DOMAIN/health"
    echo -e "${BLUE}5.${NC} Configure DNS to point $DOMAIN to $PRIMARY_IP"
    
    echo -e "\n${PURPLE}📚 For detailed configuration guide, see:${NC}"
    echo -e "${PURPLE}   - $DEPLOY_DIR/README.md${NC}"
    echo -e "${PURPLE}   - https://github.com/dzp5103/Spotify-echo#deployment${NC}"
    
    echo -e "\n${RED}⚠️  Security Reminders:${NC}"
    echo -e "${RED}   - Change default passwords in $DEPLOY_DIR/.env${NC}"
    echo -e "${RED}   - Review firewall settings: sudo ufw status${NC}"
    echo -e "${RED}   - Monitor security logs: sudo journalctl -u fail2ban${NC}"
    echo -e "${RED}   - Keep the system updated: sudo apt update && sudo apt upgrade${NC}"
}

# Cleanup function for failed deployments
cleanup_on_error() {
    error "Deployment failed. Cleaning up..."
    sudo -u "$DEPLOY_USER" docker compose -f "$DEPLOY_DIR/docker-compose.yml" down 2>/dev/null || true
    systemctl stop echotune 2>/dev/null || true
}

# Main deployment function
main() {
    log "Starting EchoTune AI deployment for DigitalOcean..."
    log "Domain: $DOMAIN"
    log "Primary IP: $PRIMARY_IP"
    log "Reserved IP: $RESERVED_IP"
    log "Build Version: $BUILD_VERSION"
    
    # Set trap for cleanup on error
    trap cleanup_on_error ERR
    
    # Check prerequisites
    check_root
    
    # Setup deployment environment
    setup_user_and_dirs
    install_dependencies
    install_docker
    setup_firewall
    setup_fail2ban
    setup_logrotate
    create_systemd_service
    
    # Deploy application
    setup_ssl
    deploy_application
    
    # Verify and finalize
    verify_deployment
    show_summary
    
    log "🚀 EchoTune AI is now live at https://$DOMAIN"
}

# Show usage information
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Deploy EchoTune AI to DigitalOcean production environment"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -v, --version  Show script version"
    echo ""
    echo "Environment Variables:"
    echo "  BUILD_VERSION  Build version tag (default: timestamp)"
    echo ""
    echo "Examples:"
    echo "  sudo $0                    # Deploy with default settings"
    echo "  sudo BUILD_VERSION=v1.0.0 $0  # Deploy with specific version"
}

# Parse command line arguments
case "${1:-}" in
    -h|--help)
        usage
        exit 0
        ;;
    -v|--version)
        echo "EchoTune AI DigitalOcean Deployment Script v1.0.0"
        exit 0
        ;;
    "")
        main
        ;;
    *)
        echo "Unknown option: $1"
        usage
        exit 1
        ;;
esac