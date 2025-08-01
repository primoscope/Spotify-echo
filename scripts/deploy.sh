#!/bin/bash

# EchoTune AI - Enhanced Production Deployment Script
# Comprehensive deployment with environment validation, SSL, monitoring, and security

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/opt/echotune"
LOG_DIR="${APP_DIR}/logs"
BACKUP_DIR="${APP_DIR}/backups"
SSL_DIR="${APP_DIR}/ssl"
DOMAIN="${DOMAIN:-primosphere.studio}"
HEALTH_ENDPOINT="http://localhost:3000/health"
MAX_HEALTH_RETRIES=5
HEALTH_RETRY_DELAY=10

# Helper functions
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

check_root() {
    if [ "$EUID" -eq 0 ]; then
        log_error "Please do not run this script as root"
        exit 1
    fi
}

validate_environment() {
    log_info "Validating environment configuration..."
    
    local required_vars=(
        "SPOTIFY_CLIENT_ID"
        "SPOTIFY_CLIENT_SECRET"
        "NODE_ENV"
        "PORT"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        log_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        log_error "Please update your .env file"
        exit 1
    fi
    
    # Validate Spotify credentials format
    if [[ ! "$SPOTIFY_CLIENT_ID" =~ ^[a-f0-9]{32}$ ]]; then
        log_warning "SPOTIFY_CLIENT_ID format looks suspicious. Please verify it's correct."
    fi
    
    log_success "Environment validation passed"
}

setup_directories() {
    log_info "Setting up application directories..."
    
    # Create necessary directories
    mkdir -p "$LOG_DIR" "$BACKUP_DIR" "$SSL_DIR"
    
    # Set appropriate permissions
    chmod 755 "$LOG_DIR" "$BACKUP_DIR"
    chmod 700 "$SSL_DIR"
    
    log_success "Directories configured"
}

setup_ssl_certificates() {
    log_info "Checking SSL certificate configuration..."
    
    if [ ! -f "$SSL_DIR/${DOMAIN}.crt" ] || [ ! -f "$SSL_DIR/${DOMAIN}.key" ]; then
        log_warning "SSL certificates not found in $SSL_DIR"
        log_info "Attempting to set up Let's Encrypt certificates..."
        
        # Check if certbot is installed
        if ! command -v certbot &> /dev/null; then
            log_info "Installing certbot..."
            sudo apt update
            sudo apt install -y certbot python3-certbot-nginx
        fi
        
        # Generate certificates
        log_info "Generating SSL certificates for $DOMAIN..."
        if sudo certbot certonly --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email "admin@$DOMAIN"; then
            # Copy certificates to application directory
            sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/${DOMAIN}.crt"
            sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/${DOMAIN}.key"
            sudo chown $USER:$USER "$SSL_DIR"/*
            
            # Set up auto-renewal
            setup_ssl_renewal
            
            log_success "SSL certificates configured"
        else
            log_warning "SSL certificate generation failed. Continuing without SSL..."
            log_info "You can manually set up SSL later using:"
            log_info "  sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
        fi
    else
        log_success "SSL certificates found"
        
        # Check certificate expiry
        if openssl x509 -checkend 2592000 -noout -in "$SSL_DIR/${DOMAIN}.crt" >/dev/null 2>&1; then
            log_success "SSL certificate is valid for more than 30 days"
        else
            log_warning "SSL certificate expires soon. Consider renewal."
        fi
    fi
}

setup_ssl_renewal() {
    log_info "Setting up SSL certificate auto-renewal..."
    
    # Create renewal script
    sudo tee /etc/cron.monthly/renew-echotune-ssl > /dev/null <<EOF
#!/bin/bash
# Auto-renewal script for EchoTune SSL certificates

certbot renew --quiet || exit 1

# Copy new certificates if renewed
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/${DOMAIN}.crt"
    cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/${DOMAIN}.key"
    chown $USER:$USER "$SSL_DIR"/*
    
    # Restart nginx to use new certificates
    cd "$APP_DIR" && docker-compose restart nginx
fi
EOF
    
    sudo chmod +x /etc/cron.monthly/renew-echotune-ssl
    log_success "SSL auto-renewal configured"
}

setup_database() {
    log_info "Setting up database connections..."
    
    if [ -n "$MONGODB_URI" ]; then
        log_info "Testing MongoDB connection..."
        if node -e "
            const { MongoClient } = require('mongodb');
            MongoClient.connect('$MONGODB_URI')
                .then(() => { console.log('MongoDB connection successful'); process.exit(0); })
                .catch((err) => { console.error('MongoDB connection failed:', err.message); process.exit(1); });
        " 2>/dev/null; then
            log_success "MongoDB connection verified"
        else
            log_warning "MongoDB connection failed. Please check MONGODB_URI"
        fi
    fi
    
    if [ -n "$REDIS_URL" ]; then
        log_info "Testing Redis connection..."
        if command -v redis-cli &> /dev/null; then
            if redis-cli -u "$REDIS_URL" ping > /dev/null 2>&1; then
                log_success "Redis connection verified"
            else
                log_warning "Redis connection failed. Please check REDIS_URL"
            fi
        else
            log_info "Redis CLI not available, skipping connection test"
        fi
    fi
}

backup_current_deployment() {
    if [ -d "$APP_DIR" ] && docker-compose ps -q > /dev/null 2>&1; then
        log_info "Creating backup of current deployment..."
        
        local backup_name="backup_$(date +%Y%m%d_%H%M%S)"
        local backup_path="$BACKUP_DIR/$backup_name"
        
        mkdir -p "$backup_path"
        
        # Backup configuration files
        cp .env "$backup_path/" 2>/dev/null || true
        cp docker-compose.yml "$backup_path/" 2>/dev/null || true
        cp nginx.conf "$backup_path/" 2>/dev/null || true
        
        # Backup SSL certificates
        if [ -d "$SSL_DIR" ]; then
            cp -r "$SSL_DIR" "$backup_path/" 2>/dev/null || true
        fi
        
        # Create deployment info
        cat > "$backup_path/deployment_info.txt" <<EOF
Backup created: $(date)
Git commit: $(git rev-parse HEAD 2>/dev/null || echo "Unknown")
Docker images:
$(docker-compose images 2>/dev/null || echo "No images found")
EOF
        
        log_success "Backup created at $backup_path"
        
        # Keep only last 5 backups
        ls -dt "$BACKUP_DIR"/backup_* | tail -n +6 | xargs rm -rf 2>/dev/null || true
    fi
}

build_application() {
    log_info "Building application..."
    
    # Pull latest code if in git repository
    if [ -d ".git" ]; then
        log_info "Updating code from repository..."
        git pull origin main 2>/dev/null || log_warning "Could not update from git"
    fi
    
    # Build with Docker Compose
    if ! docker-compose build --no-cache; then
        log_error "Application build failed"
        exit 1
    fi
    
    log_success "Application built successfully"
}

deploy_application() {
    log_info "Deploying application..."
    
    # Stop existing services gracefully
    log_info "Stopping existing services..."
    docker-compose down --timeout 30
    
    # Start services
    log_info "Starting services..."
    if ! docker-compose up -d; then
        log_error "Failed to start services"
        exit 1
    fi
    
    log_success "Services started"
}

wait_for_health() {
    log_info "Waiting for application to be healthy..."
    
    local retries=0
    while [ $retries -lt $MAX_HEALTH_RETRIES ]; do
        log_info "Health check attempt $((retries + 1))/$MAX_HEALTH_RETRIES..."
        
        if curl -f -s "$HEALTH_ENDPOINT" > /dev/null 2>&1; then
            log_success "Application is healthy!"
            return 0
        fi
        
        retries=$((retries + 1))
        if [ $retries -lt $MAX_HEALTH_RETRIES ]; then
            log_info "Waiting ${HEALTH_RETRY_DELAY}s before next check..."
            sleep $HEALTH_RETRY_DELAY
        fi
    done
    
    log_error "Application health check failed after $MAX_HEALTH_RETRIES attempts"
    log_info "Checking application logs for errors..."
    docker-compose logs --tail=50 app
    return 1
}

setup_monitoring() {
    log_info "Setting up monitoring and health checks..."
    
    # Ensure monitoring script exists and is executable
    if [ -f "scripts/monitor.sh" ]; then
        sudo cp scripts/monitor.sh /usr/local/bin/echotune-monitor
        sudo chmod +x /usr/local/bin/echotune-monitor
        
        # Create systemd service for monitoring
        sudo tee /etc/systemd/system/echotune-monitor.service > /dev/null <<EOF
[Unit]
Description=EchoTune AI Health Monitor
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/local/bin/echotune-monitor
Restart=always
RestartSec=10
StandardOutput=append:$LOG_DIR/monitor.log
StandardError=append:$LOG_DIR/monitor-error.log

[Install]
WantedBy=multi-user.target
EOF
        
        sudo systemctl daemon-reload
        sudo systemctl enable echotune-monitor
        sudo systemctl restart echotune-monitor
        
        log_success "Health monitoring service configured"
    else
        log_warning "Monitor script not found, skipping monitoring setup"
    fi
}

configure_firewall() {
    log_info "Configuring firewall..."
    
    if command -v ufw &> /dev/null; then
        # Configure UFW if it exists
        sudo ufw --force enable
        sudo ufw allow ssh
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp
        
        log_success "Firewall configured"
    else
        log_warning "UFW not found, skipping firewall configuration"
        log_info "Please ensure ports 80 and 443 are open"
    fi
}

generate_deployment_report() {
    log_info "Generating deployment report..."
    
    local report_file="$LOG_DIR/deployment_$(date +%Y%m%d_%H%M%S).log"
    
    cat > "$report_file" <<EOF
EchoTune AI Deployment Report
=============================
Date: $(date)
User: $USER
Domain: $DOMAIN
App Directory: $APP_DIR

Environment:
- NODE_ENV: $NODE_ENV
- PORT: $PORT
- Frontend URL: $FRONTEND_URL

Services Status:
$(docker-compose ps)

System Resources:
$(df -h / | tail -1)
$(free -h | head -2)

Network Ports:
$(sudo netstat -tlnp | grep -E ':(80|443|3000) ')

Recent Logs:
$(docker-compose logs --tail=10 app 2>/dev/null || echo "No logs available")
EOF
    
    log_success "Deployment report saved to $report_file"
}

main() {
    echo "🚀 EchoTune AI - Enhanced Production Deployment"
    echo "=============================================="
    echo ""
    
    # Change to app directory
    cd "$APP_DIR" || exit 1
    
    # Load environment variables
    if [ -f ".env" ]; then
        set -a
        source .env
        set +a
        log_success "Environment variables loaded"
    else
        log_error ".env file not found. Please create it from .env.production.example"
        exit 1
    fi
    
    # Run deployment steps
    check_root
    validate_environment
    setup_directories
    setup_ssl_certificates
    setup_database
    backup_current_deployment
    build_application
    deploy_application
    
    # Wait for health check
    if wait_for_health; then
        setup_monitoring
        configure_firewall
        generate_deployment_report
        
        echo ""
        log_success "🎉 Deployment completed successfully!"
        echo ""
        echo "📊 Service Status:"
        docker-compose ps
        echo ""
        echo "🌐 Application URLs:"
        echo "   - https://$DOMAIN (production)"
        echo "   - https://www.$DOMAIN (www redirect)"
        echo "   - http://localhost:3000 (direct, local only)"
        echo ""
        echo "📋 Management Commands:"
        echo "   - View logs: docker-compose logs -f"
        echo "   - Restart: docker-compose restart"
        echo "   - Stop: docker-compose down"
        echo "   - Monitor: systemctl status echotune-monitor"
        echo ""
        echo "📁 Important Paths:"
        echo "   - Logs: $LOG_DIR"
        echo "   - Backups: $BACKUP_DIR"
        echo "   - SSL Certificates: $SSL_DIR"
        echo ""
    else
        log_error "Deployment failed - application is not healthy"
        exit 1
    fi
}

# Run main function
main "$@"