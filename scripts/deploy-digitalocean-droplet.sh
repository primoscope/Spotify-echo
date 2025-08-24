#!/bin/bash

# EchoTune AI - DigitalOcean Droplet Deployment Script
# One-command deployment to DigitalOcean with Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="echotune-ai"
DROPLET_SIZE="s-2vcpu-2gb"
DROPLET_IMAGE="ubuntu-22-04-x64"
DROPLET_REGION="nyc1"
DOCKER_IMAGE="echotune-ai:latest"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${MAGENTA}[STEP]${NC} $1"
}

log_header() {
    echo -e "\n${CYAN}${1}${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_step "Checking prerequisites..."
    
    # Check if running as root
    if [ "$EUID" -ne 0 ]; then
        log_error "This script must be run as root (use sudo)"
        exit 1
    fi
    
    # Check if curl is available
    if ! command -v curl &> /dev/null; then
        log_error "curl is not installed"
        exit 1
    fi
    
    # Check if git is available
    if ! command -v git &> /dev/null; then
        log_error "git is not installed"
        exit 1
    fi
    
    log_success "All prerequisites are met"
}

# Update system
update_system() {
    log_step "Updating system packages..."
    
    apt update && apt upgrade -y
    
    log_success "System updated"
}

# Install Docker
install_docker() {
    log_step "Installing Docker..."
    
    # Remove old versions
    apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
    
    # Install prerequisites
    apt install -y apt-transport-https ca-certificates curl gnupg lsb-release
    
    # Add Docker GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    log_success "Docker installed and started"
}

# Install Docker Compose
install_docker_compose() {
    log_step "Installing Docker Compose..."
    
    # Install Docker Compose
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    log_success "Docker Compose installed"
}

# Install additional packages
install_packages() {
    log_step "Installing additional packages..."
    
    apt install -y nginx certbot python3-certbot-nginx ufw fail2ban htop unzip
    
    log_success "Additional packages installed"
}

# Configure firewall
configure_firewall() {
    log_step "Configuring firewall..."
    
    # Configure UFW
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 80
    ufw allow 443
    ufw --force enable
    
    log_success "Firewall configured"
}

# Create application user
create_app_user() {
    log_step "Creating application user..."
    
    # Create user if it doesn't exist
    if ! id "echotune" &>/dev/null; then
        useradd -r -s /bin/bash -d /opt/echotune -m echotune
    fi
    
    # Create directories
    mkdir -p /opt/echotune/{ssl,logs,data,backups}
    chown -R echotune:echotune /opt/echotune
    
    # Add user to docker group
    usermod -aG docker echotune
    
    log_success "Application user created"
}

# Clone repository
clone_repository() {
    log_step "Cloning repository..."
    
    cd /opt/echotune
    
    if [ -d "Spotify-echo" ]; then
        log_info "Repository already exists, updating..."
        cd Spotify-echo
        git pull origin main
    else
        git clone https://github.com/dzp5103/Spotify-echo.git
        cd Spotify-echo
    fi
    
    log_success "Repository cloned/updated"
}

# Setup environment
setup_environment() {
    log_step "Setting up environment..."
    
    # Check if environment file exists
    if [ ! -f ".env.production.digitalocean" ]; then
        log_warning "Environment file not found, running setup script..."
        node scripts/setup-digitalocean-env.js
    fi
    
    # Copy environment file
    if [ -f ".env.production.digitalocean" ]; then
        cp .env.production.digitalocean .env
        log_success "Environment configured"
    else
        log_error "Environment setup failed"
        exit 1
    fi
}

# Build Docker image
build_docker_image() {
    log_step "Building Docker image..."
    
    # Build the image
    docker build -t $DOCKER_IMAGE .
    
    log_success "Docker image built"
}

# Create Docker Compose file
create_docker_compose() {
    log_step "Creating Docker Compose configuration..."
    
    cat > docker-compose.production.yml << 'EOF'
version: '3.8'

services:
  app:
    image: echotune-ai:latest
    container_name: echotune-ai-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    volumes:
      - ./logs:/opt/echotune/logs
      - ./data:/opt/echotune/data
    networks:
      - echotune-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:alpine
    container_name: echotune-ai-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - app
    networks:
      - echotune-network

networks:
  echotune-network:
    driver: bridge

volumes:
  echotune-data:
    driver: local
EOF

    log_success "Docker Compose configuration created"
}

# Create Nginx configuration
create_nginx_config() {
    log_step "Creating Nginx configuration..."
    
    cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
    
    # Upstream for the app
    upstream echotune_app {
        server app:3000;
    }
    
    # HTTP server (redirect to HTTPS)
    server {
        listen 80;
        server_name _;
        return 301 https://$host$request_uri;
    }
    
    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name _;
        
        # SSL configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;
        
        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        
        # API routes with rate limiting
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://echotune_app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }
        
        # Auth routes with stricter rate limiting
        location /auth/ {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://echotune_app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Static assets
        location /assets/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            proxy_pass http://echotune_app;
        }
        
        # Frontend routes
        location / {
            proxy_pass http://echotune_app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }
    }
}
EOF

    log_success "Nginx configuration created"
}

# Setup SSL certificates
setup_ssl() {
    log_step "Setting up SSL certificates..."
    
    # Create SSL directory
    mkdir -p ssl
    
    # Generate self-signed certificate for now
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ssl/key.pem \
        -out ssl/cert.pem \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
    
    log_success "SSL certificates created (self-signed)"
    log_warning "For production, replace with Let's Encrypt certificates"
}

# Deploy application
deploy_application() {
    log_step "Deploying application..."
    
    # Stop existing containers
    docker-compose -f docker-compose.production.yml down 2>/dev/null || true
    
    # Start application
    docker-compose -f docker-compose.production.yml up -d
    
    log_success "Application deployed"
}

# Setup monitoring
setup_monitoring() {
    log_step "Setting up monitoring..."
    
    # Create log rotation
    cat > /etc/logrotate.d/echotune << 'EOF'
/opt/echotune/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 echotune echotune
    postrotate
        docker exec echotune-ai-nginx nginx -s reload
    endscript
}
EOF

    # Create systemd service
    cat > /etc/systemd/system/echotune-ai.service << 'EOF'
[Unit]
Description=EchoTune AI Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/echotune/Spotify-echo
ExecStart=/usr/local/bin/docker-compose -f docker-compose.production.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.production.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

    # Enable and start service
    systemctl daemon-reload
    systemctl enable echotune-ai.service
    
    log_success "Monitoring and service configured"
}

# Verify deployment
verify_deployment() {
    log_step "Verifying deployment..."
    
    # Wait for application to start
    sleep 30
    
    # Check if containers are running
    if docker ps | grep -q "echotune-ai"; then
        log_success "Application containers are running"
    else
        log_error "Application containers are not running"
        docker-compose -f docker-compose.production.yml logs
        exit 1
    fi
    
    # Test health endpoint
    if curl -f http://localhost/api/health > /dev/null 2>&1; then
        log_success "Health endpoint is working"
    else
        log_warning "Health endpoint test failed"
    fi
    
    # Test frontend
    if curl -f http://localhost > /dev/null 2>&1; then
        log_success "Frontend is accessible"
    else
        log_warning "Frontend test failed"
    fi
    
    log_success "Deployment verification completed"
}

# Show deployment info
show_deployment_info() {
    log_header "🎉 Deployment Complete!"
    
    echo "Application deployed successfully!"
    echo ""
    echo "📊 Deployment Information:"
    echo "  - Application URL: http://$(curl -s ifconfig.me)"
    echo "  - Health Check: http://$(curl -s ifconfig.me)/api/health"
    echo "  - Logs: /opt/echotune/logs"
    echo "  - Data: /opt/echtune/data"
    echo "  - SSL: /opt/echotune/Spotify-echo/ssl"
    echo ""
    echo "🔧 Management Commands:"
    echo "  - View logs: docker-compose -f /opt/echotune/Spotify-echo/docker-compose.production.yml logs -f"
    echo "  - Restart: systemctl restart echotune-ai"
    echo "  - Status: systemctl status echotune-ai"
    echo "  - Stop: systemctl stop echotune-ai"
    echo ""
    echo "📝 Next Steps:"
    echo "  1. Configure your domain DNS to point to this server"
    echo "  2. Replace self-signed SSL with Let's Encrypt certificates"
    echo "  3. Set up monitoring and alerting"
    echo "  4. Configure backups"
    echo ""
    echo "⚠️  Important Notes:"
    echo "  - Default SSL certificate is self-signed (not secure for production)"
    echo "  - Firewall is configured to allow SSH, HTTP, and HTTPS"
    echo "  - Application runs as systemd service and auto-starts on boot"
}

# Main deployment function
main() {
    log_header "🚀 Starting DigitalOcean Droplet Deployment for EchoTune AI..."
    
    check_prerequisites
    update_system
    install_docker
    install_docker_compose
    install_packages
    configure_firewall
    create_app_user
    clone_repository
    setup_environment
    build_docker_image
    create_docker_compose
    create_nginx_config
    setup_ssl
    deploy_application
    setup_monitoring
    verify_deployment
    show_deployment_info
    
    log_success "Deployment completed successfully!"
}

# Help function
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help           Show this help message"
    echo "  -c, --check          Only check prerequisites"
    echo "  -i, --install        Only install dependencies"
    echo "  -d, --deploy         Only deploy application"
    echo "  -v, --verify         Only verify deployment"
    echo "  --skip-ssl           Skip SSL setup"
    echo "  --skip-monitoring    Skip monitoring setup"
    echo ""
    echo "Examples:"
    echo "  $0                    # Full deployment"
    echo "  $0 --check            # Check prerequisites only"
    echo "  $0 --install          # Install dependencies only"
    echo "  $0 --deploy           # Deploy application only"
}

# Parse command line arguments
SKIP_SSL=false
SKIP_MONITORING=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -c|--check)
            check_prerequisites
            exit 0
            ;;
        -i|--install)
            check_prerequisites
            update_system
            install_docker
            install_docker_compose
            install_packages
            configure_firewall
            create_app_user
            exit 0
            ;;
        -d|--deploy)
            clone_repository
            setup_environment
            build_docker_image
            create_docker_compose
            create_nginx_config
            if [ "$SKIP_SSL" = false ]; then
                setup_ssl
            fi
            deploy_application
            if [ "$SKIP_MONITORING" = false ]; then
                setup_monitoring
            fi
            exit 0
            ;;
        -v|--verify)
            verify_deployment
            exit 0
            ;;
        --skip-ssl)
            SKIP_SSL=true
            shift
            ;;
        --skip-monitoring)
            SKIP_MONITORING=true
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Run main function
main