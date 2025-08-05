#!/bin/bash

# ===================================================================
# EchoTune AI - Application Deployment Script
# Deploys the application with proper configuration and services
# ===================================================================

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/tmp/echotune-deploy-$(date +%Y%m%d-%H%M%S).log"
DEPLOY_DIR="/opt/echotune"
DEPLOY_USER="echotune"
APP_NAME="echotune-ai"
SERVICE_NAME="echotune-ai"

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

success() {
    echo -e "${PURPLE}[$(date +'%H:%M:%S')] 🎉 $1${NC}" | tee -a "$LOG_FILE"
}

debug() {
    if [[ "${VERBOSE:-false}" == "true" ]]; then
        echo -e "${CYAN}[$(date +'%H:%M:%S')] 🔍 $1${NC}" | tee -a "$LOG_FILE"
    fi
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root. Use: sudo $0"
        exit 1
    fi
}

# Load environment variables
load_environment() {
    log "Loading environment configuration..."
    
    if [[ -f "$DEPLOY_DIR/.env" ]]; then
        source "$DEPLOY_DIR/.env"
        DOMAIN="${DOMAIN:-primosphere.studio}"
        PORT="${PORT:-3000}"
        log "Environment loaded from $DEPLOY_DIR/.env"
    else
        warning "Environment file not found, using defaults"
        DOMAIN="primosphere.studio"
        PORT="3000"
    fi
    
    debug "Domain: $DOMAIN"
    debug "Port: $PORT"
}

# Copy application files
deploy_application_files() {
    log "Deploying application files..."
    
    # Create application directory
    mkdir -p "$DEPLOY_DIR/app"
    
    # Copy application files
    rsync -av --exclude='node_modules' --exclude='.git' --exclude='logs' --exclude='*.log' \
          "$SCRIPT_DIR/" "$DEPLOY_DIR/app/"
    
    # Copy environment file
    if [[ -f "$DEPLOY_DIR/.env" ]]; then
        cp "$DEPLOY_DIR/.env" "$DEPLOY_DIR/app/.env"
    fi
    
    # Set ownership
    chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_DIR/app"
    chmod -R 755 "$DEPLOY_DIR/app"
    
    log "Application files deployed to $DEPLOY_DIR/app"
}

# Install application dependencies
install_dependencies() {
    log "Installing application dependencies..."
    
    cd "$DEPLOY_DIR/app"
    
    # Install Node.js dependencies
    if [[ -f "package.json" ]]; then
        sudo -u "$DEPLOY_USER" npm install --production
        log "Node.js dependencies installed"
    else
        warning "package.json not found, skipping npm install"
    fi
    
    # Install Python dependencies
    if [[ -f "requirements.txt" ]]; then
        python3 -m pip install -r requirements.txt
        log "Python dependencies installed"
    fi
    
    if [[ -f "requirements-production.txt" ]]; then
        python3 -m pip install -r requirements-production.txt
        log "Production Python dependencies installed"
    fi
}

# Create systemd service
create_systemd_service() {
    log "Creating systemd service..."
    
    cat > "/etc/systemd/system/$SERVICE_NAME.service" << EOF
[Unit]
Description=EchoTune AI - Music Discovery Platform
Documentation=https://github.com/dzp5103/Spotify-echo
After=network.target nginx.service
Wants=network-online.target

[Service]
Type=simple
User=$DEPLOY_USER
Group=$DEPLOY_USER
WorkingDirectory=$DEPLOY_DIR/app
Environment=NODE_ENV=production
Environment=PORT=$PORT
EnvironmentFile=$DEPLOY_DIR/app/.env
ExecStart=/usr/bin/node index.js
ExecReload=/bin/kill -HUP \$MAINPID
Restart=always
RestartSec=10
StandardOutput=append:$DEPLOY_DIR/logs/app.log
StandardError=append:$DEPLOY_DIR/logs/error.log

# Security settings
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=$DEPLOY_DIR

# Resource limits
LimitNOFILE=65536
TimeoutStartSec=60
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
EOF
    
    # Reload systemd and enable service
    systemctl daemon-reload
    systemctl enable "$SERVICE_NAME"
    
    log "Systemd service created and enabled"
}

# Configure Nginx
configure_nginx() {
    log "Configuring Nginx..."
    
    # Create SSL directory
    mkdir -p /etc/nginx/ssl
    chmod 777 /etc/nginx/ssl
    
    # Create Nginx configuration
    cat > "/etc/nginx/sites-available/$DOMAIN" << EOF
# EchoTune AI Nginx Configuration
# Generated on $(date)

upstream echotune_app {
    server 127.0.0.1:$PORT;
    keepalive 64;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Redirect all HTTP to HTTPS
    location / {
        return 301 https://\$host\$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/$DOMAIN.crt;
    ssl_private_key /etc/nginx/ssl/$DOMAIN.key;
    
    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=app:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=auth:10m rate=5r/m;
    
    # Main application
    location / {
        limit_req zone=app burst=20 nodelay;
        
        proxy_pass http://echotune_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # API endpoints with stricter rate limiting
    location /api/ {
        limit_req zone=app burst=10 nodelay;
        
        proxy_pass http://echotune_app;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Authentication endpoints
    location /auth/ {
        limit_req zone=auth burst=5 nodelay;
        
        proxy_pass http://echotune_app;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Static files with caching
    location /static/ {
        alias $DEPLOY_DIR/app/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://echotune_app;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        access_log off;
    }
    
    # Logs
    access_log $DEPLOY_DIR/logs/nginx-access.log;
    error_log $DEPLOY_DIR/logs/nginx-error.log;
}
EOF
    
    # Enable site
    ln -sf "/etc/nginx/sites-available/$DOMAIN" "/etc/nginx/sites-enabled/$DOMAIN"
    
    # Remove default site
    rm -f /etc/nginx/sites-enabled/default
    
    # Test Nginx configuration
    if nginx -t; then
        log "Nginx configuration is valid"
    else
        error "Nginx configuration test failed"
        return 1
    fi
    
    log "Nginx configured for $DOMAIN"
}

# Setup SSL certificates
setup_ssl_certificates() {
    log "Setting up SSL certificates..."
    
    # Try Let's Encrypt first
    if command -v certbot >/dev/null 2>&1; then
        log "Attempting Let's Encrypt certificate..."
        
        # Stop Nginx temporarily
        systemctl stop nginx || true
        
        # Request certificate
        if certbot certonly --standalone --non-interactive --agree-tos \
           --email "${LETSENCRYPT_EMAIL:-admin@$DOMAIN}" \
           -d "$DOMAIN" -d "www.$DOMAIN"; then
            
            # Copy certificates to Nginx SSL directory
            cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "/etc/nginx/ssl/$DOMAIN.crt"
            cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "/etc/nginx/ssl/$DOMAIN.key"
            
            # Set permissions
            chmod 644 "/etc/nginx/ssl/$DOMAIN.crt"
            chmod 600 "/etc/nginx/ssl/$DOMAIN.key"
            
            log "Let's Encrypt certificate installed successfully"
        else
            warning "Let's Encrypt failed, creating self-signed certificate"
            create_self_signed_certificate
        fi
    else
        warning "Certbot not available, creating self-signed certificate"
        create_self_signed_certificate
    fi
}

# Create self-signed certificate
create_self_signed_certificate() {
    log "Creating self-signed SSL certificate..."
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "/etc/nginx/ssl/$DOMAIN.key" \
        -out "/etc/nginx/ssl/$DOMAIN.crt" \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN"
    
    chmod 644 "/etc/nginx/ssl/$DOMAIN.crt"
    chmod 600 "/etc/nginx/ssl/$DOMAIN.key"
    
    log "Self-signed certificate created"
}

# Configure log rotation
setup_log_rotation() {
    log "Setting up log rotation..."
    
    cat > "/etc/logrotate.d/$APP_NAME" << EOF
$DEPLOY_DIR/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    notifempty
    create 0644 $DEPLOY_USER $DEPLOY_USER
    postrotate
        systemctl reload $SERVICE_NAME || true
        systemctl reload nginx || true
    endscript
}
EOF
    
    log "Log rotation configured"
}

# Start services
start_services() {
    log "Starting services..."
    
    # Start application service
    systemctl start "$SERVICE_NAME"
    systemctl status "$SERVICE_NAME" --no-pager
    
    # Start Nginx
    systemctl start nginx
    systemctl reload nginx
    
    log "Services started successfully"
}

# Perform health checks
perform_health_checks() {
    log "Performing health checks..."
    
    local max_attempts=30
    local attempt=0
    
    # Wait for application to start
    while [[ $attempt -lt $max_attempts ]]; do
        if curl -s "http://localhost:$PORT/health" >/dev/null 2>&1; then
            log "✅ Application health check passed"
            break
        else
            debug "Health check attempt $((attempt + 1))/$max_attempts"
            sleep 2
            ((attempt++))
        fi
    done
    
    if [[ $attempt -eq $max_attempts ]]; then
        error "❌ Application health check failed after $max_attempts attempts"
        return 1
    fi
    
    # Check HTTPS (if SSL is configured)
    if [[ -f "/etc/nginx/ssl/$DOMAIN.crt" ]]; then
        if curl -k -s "https://localhost/health" >/dev/null 2>&1; then
            log "✅ HTTPS health check passed"
        else
            warning "⚠ HTTPS health check failed (may be normal for self-signed certificates)"
        fi
    fi
    
    # Check Nginx status
    if systemctl is-active nginx >/dev/null 2>&1; then
        log "✅ Nginx is running"
    else
        error "❌ Nginx is not running"
        return 1
    fi
    
    # Check application service
    if systemctl is-active "$SERVICE_NAME" >/dev/null 2>&1; then
        log "✅ Application service is running"
    else
        error "❌ Application service is not running"
        return 1
    fi
}

# Display deployment summary
show_deployment_summary() {
    success "🎉 EchoTune AI deployment completed successfully!"
    log ""
    log "📋 Deployment Summary:"
    log "   • Domain: $DOMAIN"
    log "   • Application: http://localhost:$PORT"
    log "   • HTTPS: https://$DOMAIN (if SSL configured)"
    log "   • Service: $SERVICE_NAME"
    log "   • Deploy directory: $DEPLOY_DIR"
    log "   • Log directory: $DEPLOY_DIR/logs"
    log ""
    log "🔧 Service Management:"
    log "   • Start:   sudo systemctl start $SERVICE_NAME"
    log "   • Stop:    sudo systemctl stop $SERVICE_NAME"
    log "   • Restart: sudo systemctl restart $SERVICE_NAME"
    log "   • Status:  sudo systemctl status $SERVICE_NAME"
    log "   • Logs:    sudo journalctl -u $SERVICE_NAME -f"
    log ""
    log "📊 Monitoring:"
    log "   • Health check: curl http://localhost:$PORT/health"
    log "   • Application logs: tail -f $DEPLOY_DIR/logs/app.log"
    log "   • Error logs: tail -f $DEPLOY_DIR/logs/error.log"
    log "   • Nginx logs: tail -f $DEPLOY_DIR/logs/nginx-access.log"
    log ""
    log "🌐 Access URLs:"
    log "   • Local: http://localhost:$PORT"
    if [[ -f "/etc/nginx/ssl/$DOMAIN.crt" ]]; then
        log "   • Public: https://$DOMAIN"
        log "   • API: https://$DOMAIN/api"
        log "   • Health: https://$DOMAIN/health"
    else
        log "   • Public: http://$DOMAIN (configure SSL for HTTPS)"
    fi
    log ""
    log "⚙️ Configuration:"
    log "   • Environment: $DEPLOY_DIR/app/.env"
    log "   • Nginx config: /etc/nginx/sites-available/$DOMAIN"
    log "   • Service file: /etc/systemd/system/$SERVICE_NAME.service"
    log ""
    log "🚨 Next Steps:"
    log "   1. Configure Spotify API credentials in .env file"
    log "   2. Add AI provider API keys (optional)"
    log "   3. Test the application: curl http://localhost:$PORT/health"
    log "   4. Monitor logs for any issues"
    if [[ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]]; then
        log "   5. Configure proper SSL certificate for production"
    fi
}

# Create deployment status file
create_status_file() {
    log "Creating deployment status file..."
    
    local status_file="$DEPLOY_DIR/DEPLOYMENT_STATUS.json"
    
    cat > "$status_file" << EOF
{
  "deployment": {
    "status": "completed",
    "timestamp": "$(date -Iseconds)",
    "version": "1.0.0",
    "domain": "$DOMAIN",
    "port": $PORT
  },
  "services": {
    "application": {
      "name": "$SERVICE_NAME",
      "status": "$(systemctl is-active "$SERVICE_NAME" 2>/dev/null || echo 'inactive')",
      "port": $PORT
    },
    "nginx": {
      "status": "$(systemctl is-active nginx 2>/dev/null || echo 'inactive')",
      "config": "/etc/nginx/sites-available/$DOMAIN"
    }
  },
  "ssl": {
    "certificate": "/etc/nginx/ssl/$DOMAIN.crt",
    "private_key": "/etc/nginx/ssl/$DOMAIN.key",
    "type": "$(if [[ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]]; then echo 'letsencrypt'; else echo 'self-signed'; fi)"
  },
  "directories": {
    "deploy": "$DEPLOY_DIR",
    "app": "$DEPLOY_DIR/app",
    "logs": "$DEPLOY_DIR/logs"
  },
  "urls": {
    "local": "http://localhost:$PORT",
    "public": "https://$DOMAIN",
    "health": "https://$DOMAIN/health",
    "api": "https://$DOMAIN/api"
  }
}
EOF
    
    chown "$DEPLOY_USER:$DEPLOY_USER" "$status_file"
    chmod 644 "$status_file"
    
    log "Deployment status saved to $status_file"
}

# Main deployment function
main() {
    log "Starting EchoTune AI application deployment..."
    log "Log file: $LOG_FILE"
    
    check_root
    load_environment
    deploy_application_files
    install_dependencies
    create_systemd_service
    configure_nginx
    setup_ssl_certificates
    setup_log_rotation
    start_services
    sleep 5  # Give services time to start
    perform_health_checks
    create_status_file
    
    show_deployment_summary
    
    log ""
    log "📄 Full deployment log: $LOG_FILE"
    log "📚 Status file: $DEPLOY_DIR/DEPLOYMENT_STATUS.json"
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "EchoTune AI Application Deployment Script"
        echo ""
        echo "Usage: sudo $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --version, -v  Show script version"
        echo "  --verbose      Enable verbose logging"
        echo ""
        echo "This script deploys the EchoTune AI application with all services."
        exit 0
        ;;
    --version|-v)
        echo "EchoTune AI Application Deployment Script v1.0.0"
        exit 0
        ;;
    --verbose)
        VERBOSE=true
        main
        ;;
    *)
        main "$@"
        ;;
esac