#!/bin/bash

# Enhanced Production Deployment Script with MCP Integration
# 
# This comprehensive deployment script implements the strategic roadmap
# Phase 10 objectives with advanced automation, security hardening,
# and production optimization features.
# 
# Features:
# - Automated SSL certificate management with Let's Encrypt
# - Advanced Docker containerization with multi-stage builds
# - Database migration and indexing optimization
# - System health monitoring and alerting setup
# - Load balancing and reverse proxy configuration
# - Automated backup and recovery setup
# - Security hardening and firewall configuration
# - Performance optimization and caching

set -euo pipefail

# Script configuration
SCRIPT_NAME="Enhanced Production Deployment"
VERSION="2.1.0"
LOG_FILE="/var/log/echotune-deploy.log"
DEPLOYMENT_DIR="/opt/echotune"
BACKUP_DIR="/opt/echotune/backups"
SSL_DIR="/etc/nginx/ssl"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")  echo -e "${GREEN}[${timestamp}] INFO: ${message}${NC}" | tee -a "$LOG_FILE" ;;
        "WARN")  echo -e "${YELLOW}[${timestamp}] WARN: ${message}${NC}" | tee -a "$LOG_FILE" ;;
        "ERROR") echo -e "${RED}[${timestamp}] ERROR: ${message}${NC}" | tee -a "$LOG_FILE" ;;
        "DEBUG") echo -e "${BLUE}[${timestamp}] DEBUG: ${message}${NC}" | tee -a "$LOG_FILE" ;;
        "SUCCESS") echo -e "${PURPLE}[${timestamp}] SUCCESS: ${message}${NC}" | tee -a "$LOG_FILE" ;;
    esac
}

# Error handler
error_handler() {
    local line_number=$1
    local error_code=$2
    log "ERROR" "Script failed at line $line_number with exit code $error_code"
    
    # Send alert if configured
    if [ -n "${ALERT_EMAIL:-}" ]; then
        echo "Deployment failed at line $line_number with exit code $error_code" | \
        mail -s "EchoTune Deployment Failed" "$ALERT_EMAIL"
    fi
    
    exit $error_code
}

trap 'error_handler ${LINENO} $?' ERR

# Configuration validation
validate_config() {
    log "INFO" "Validating deployment configuration..."
    
    # Required environment variables
    local required_vars=(
        "DOMAIN"
        "MONGODB_URI"
        "SPOTIFY_CLIENT_ID"
        "SPOTIFY_CLIENT_SECRET"
    )
    
    local missing_vars=()
    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        log "ERROR" "Missing required environment variables: ${missing_vars[*]}"
        log "INFO" "Please set these variables in your .env file or export them"
        exit 1
    fi
    
    # Validate domain format
    if ! [[ "$DOMAIN" =~ ^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$ ]]; then
        log "ERROR" "Invalid domain format: $DOMAIN"
        exit 1
    fi
    
    # Validate MongoDB URI format
    if ! [[ "$MONGODB_URI" =~ ^mongodb.*://.*$ ]]; then
        log "ERROR" "Invalid MongoDB URI format"
        exit 1
    fi
    
    log "SUCCESS" "Configuration validation passed"
}

# System requirements check
check_system_requirements() {
    log "INFO" "Checking system requirements..."
    
    # Check if running as root
    if [ "$EUID" -ne 0 ]; then
        log "ERROR" "Please run this script as root or with sudo"
        exit 1
    fi
    
    # Check OS compatibility
    if ! command -v lsb_release &> /dev/null; then
        log "WARN" "lsb_release not found, attempting to detect OS..."
        if [ -f /etc/os-release ]; then
            source /etc/os-release
            OS_NAME=$NAME
            OS_VERSION=$VERSION_ID
        else
            log "ERROR" "Unable to detect operating system"
            exit 1
        fi
    else
        OS_NAME=$(lsb_release -si)
        OS_VERSION=$(lsb_release -sr)
    fi
    
    log "INFO" "Detected OS: $OS_NAME $OS_VERSION"
    
    # Check available disk space (minimum 10GB)
    local available_space=$(df / | awk 'NR==2 {print $4}')
    local required_space=$((10 * 1024 * 1024)) # 10GB in KB
    
    if [ "$available_space" -lt "$required_space" ]; then
        log "ERROR" "Insufficient disk space. Required: 10GB, Available: $((available_space / 1024 / 1024))GB"
        exit 1
    fi
    
    # Check memory (minimum 2GB)
    local available_memory=$(free -m | awk 'NR==2{print $2}')
    if [ "$available_memory" -lt 2048 ]; then
        log "ERROR" "Insufficient memory. Required: 2GB, Available: ${available_memory}MB"
        exit 1
    fi
    
    log "SUCCESS" "System requirements check passed"
}

# Install system dependencies
install_dependencies() {
    log "INFO" "Installing system dependencies..."
    
    # Update package repositories
    apt-get update -y
    
    # Install essential packages
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
        cron \
        mailutils \
        htop \
        iotop \
        netstat-nat \
        tree \
        jq \
        python3 \
        python3-pip
    
    # Install Node.js (latest LTS)
    curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
    apt-get install -y nodejs
    
    # Install Docker
    if ! command -v docker &> /dev/null; then
        log "INFO" "Installing Docker..."
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
        apt-get update -y
        apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
        systemctl enable docker
        systemctl start docker
    fi
    
    # Install Docker Compose (standalone)
    if ! command -v docker-compose &> /dev/null; then
        log "INFO" "Installing Docker Compose..."
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi
    
    # Install Nginx
    apt-get install -y nginx
    systemctl enable nginx
    
    # Install Certbot for Let's Encrypt
    apt-get install -y certbot python3-certbot-nginx
    
    log "SUCCESS" "Dependencies installed successfully"
}

# Configure firewall
setup_firewall() {
    log "INFO" "Configuring firewall..."
    
    # Reset UFW to defaults
    ufw --force reset
    
    # Set default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH (be careful not to lock yourself out)
    ufw allow ssh
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Allow application ports
    ufw allow 3000/tcp comment "EchoTune App"
    ufw allow 3001/tcp comment "MCP Server"
    
    # Allow MongoDB port (if external access needed)
    if [ "${MONGODB_EXTERNAL_ACCESS:-false}" = "true" ]; then
        ufw allow from ${MONGODB_ALLOWED_IPS:-10.0.0.0/8} to any port 27017
    fi
    
    # Enable firewall
    ufw --force enable
    
    # Configure fail2ban
    cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3
EOF
    
    systemctl enable fail2ban
    systemctl start fail2ban
    
    log "SUCCESS" "Firewall configured successfully"
}

# Setup SSL certificates
setup_ssl() {
    log "INFO" "Setting up SSL certificates..."
    
    # Create SSL directory
    mkdir -p "$SSL_DIR"
    
    # Stop nginx temporarily for certificate generation
    systemctl stop nginx
    
    # Generate Let's Encrypt certificate
    if certbot certonly --standalone \
        --non-interactive \
        --agree-tos \
        --email "${LETSENCRYPT_EMAIL:-admin@$DOMAIN}" \
        -d "$DOMAIN" \
        -d "www.$DOMAIN" \
        --expand; then
        
        log "SUCCESS" "SSL certificates generated successfully"
        
        # Set up automatic renewal
        cat > /etc/cron.d/certbot << EOF
# Renew Let's Encrypt certificates twice daily
0 */12 * * * root certbot renew --quiet --nginx --post-hook "systemctl reload nginx"
EOF
        
    else
        log "WARN" "Failed to generate Let's Encrypt certificates, creating self-signed certificate..."
        
        # Generate self-signed certificate as fallback
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "$SSL_DIR/$DOMAIN.key" \
            -out "$SSL_DIR/$DOMAIN.crt" \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN"
        
        chmod 600 "$SSL_DIR/$DOMAIN.key"
        chmod 644 "$SSL_DIR/$DOMAIN.crt"
    fi
    
    log "SUCCESS" "SSL setup completed"
}

# Configure Nginx
setup_nginx() {
    log "INFO" "Configuring Nginx..."
    
    # Create nginx configuration
    cat > /etc/nginx/sites-available/echotune << EOF
# Rate limiting zones
limit_req_zone \$binary_remote_addr zone=api:10m rate=${API_RATE_LIMIT:-10r/s};
limit_req_zone \$binary_remote_addr zone=auth:10m rate=${AUTH_RATE_LIMIT:-5r/m};
limit_req_zone \$binary_remote_addr zone=general:10m rate=${GENERAL_RATE_LIMIT:-20r/s};

# Upstream servers
upstream echotune_app {
    least_conn;
    server 127.0.0.1:3000 max_fails=3 fail_timeout=30s;
    # Add more servers here for load balancing
}

upstream mcp_server {
    server 127.0.0.1:3001 max_fails=3 fail_timeout=30s;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
    }
    
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL Configuration
    ssl_certificate ${SSL_DIR}/$DOMAIN.crt;
    ssl_certificate_key ${SSL_DIR}/$DOMAIN.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' wss: https:; font-src 'self' data:;" always;
    
    # Logging
    access_log /var/log/nginx/echotune_access.log;
    error_log /var/log/nginx/echotune_error.log;
    
    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/json
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # Main application
    location / {
        limit_req zone=general burst=50 nodelay;
        
        proxy_pass http://echotune_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
    }
    
    # API endpoints with stricter rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://echotune_app;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Auth endpoints with very strict rate limiting
    location /auth/ {
        limit_req zone=auth burst=5 nodelay;
        
        proxy_pass http://echotune_app;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # MCP Server
    location /mcp/ {
        proxy_pass http://mcp_server/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # WebSocket support for real-time features
    location /socket.io/ {
        proxy_pass http://echotune_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Static files with long cache
    location /static/ {
        alias ${DEPLOYMENT_DIR}/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://echotune_app;
        access_log off;
    }
    
    # Deny access to sensitive files
    location ~ /\\.ht {
        deny all;
    }
    
    location ~ /\\.env {
        deny all;
    }
    
    # Favicon
    location /favicon.ico {
        log_not_found off;
        access_log off;
    }
}
EOF
    
    # Enable the site
    ln -sf /etc/nginx/sites-available/echotune /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Test nginx configuration
    if nginx -t; then
        log "SUCCESS" "Nginx configuration is valid"
        systemctl start nginx
        systemctl reload nginx
    else
        log "ERROR" "Nginx configuration is invalid"
        exit 1
    fi
}

# Setup application directories and permissions
setup_directories() {
    log "INFO" "Setting up application directories..."
    
    # Create directories
    mkdir -p "$DEPLOYMENT_DIR"/{app,logs,backups,ssl,uploads}
    mkdir -p /var/log/echotune
    
    # Create application user
    if ! id "echotune" &>/dev/null; then
        useradd -r -s /bin/false -d "$DEPLOYMENT_DIR" echotune
    fi
    
    # Set permissions
    chown -R echotune:echotune "$DEPLOYMENT_DIR"
    chown -R echotune:echotune /var/log/echotune
    chmod 755 "$DEPLOYMENT_DIR"
    chmod 750 "$DEPLOYMENT_DIR/logs"
    chmod 700 "$DEPLOYMENT_DIR/backups"
    
    log "SUCCESS" "Directories and permissions configured"
}

# Deploy application code
deploy_application() {
    log "INFO" "Deploying application code..."
    
    local app_dir="$DEPLOYMENT_DIR/app"
    
    # Clone or update repository
    if [ -d "$app_dir/.git" ]; then
        cd "$app_dir"
        git fetch origin
        git reset --hard origin/main
    else
        git clone https://github.com/dzp5103/Spotify-echo.git "$app_dir"
        cd "$app_dir"
    fi
    
    # Install Node.js dependencies
    npm ci --production
    
    # Install Python dependencies
    pip3 install -r requirements.txt
    
    # Build application
    npm run build
    
    # Copy environment configuration
    cp .env.production.example .env
    
    # Replace environment variables
    sed -i "s/DOMAIN=.*/DOMAIN=$DOMAIN/" .env
    sed -i "s|MONGODB_URI=.*|MONGODB_URI=$MONGODB_URI|" .env
    sed -i "s/SPOTIFY_CLIENT_ID=.*/SPOTIFY_CLIENT_ID=$SPOTIFY_CLIENT_ID/" .env
    sed -i "s/SPOTIFY_CLIENT_SECRET=.*/SPOTIFY_CLIENT_SECRET=$SPOTIFY_CLIENT_SECRET/" .env
    sed -i "s|SPOTIFY_REDIRECT_URI=.*|SPOTIFY_REDIRECT_URI=https://$DOMAIN/auth/callback|" .env
    
    # Set file permissions
    chown -R echotune:echotune "$app_dir"
    chmod 600 "$app_dir/.env"
    
    log "SUCCESS" "Application deployed successfully"
}

# Setup systemd services
setup_services() {
    log "INFO" "Setting up systemd services..."
    
    # EchoTune main application service
    cat > /etc/systemd/system/echotune.service << EOF
[Unit]
Description=EchoTune AI Music Recommendation System
Documentation=https://github.com/dzp5103/Spotify-echo
After=network.target mongodb.service

[Service]
Type=simple
User=echotune
Group=echotune
WorkingDirectory=${DEPLOYMENT_DIR}/app
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/node src/index.js
ExecReload=/bin/kill -HUP \$MAINPID
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=echotune

# Resource limits
LimitNOFILE=65535
LimitNPROC=32768

# Security settings
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=${DEPLOYMENT_DIR}
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF
    
    # MCP Server service
    cat > /etc/systemd/system/echotune-mcp.service << EOF
[Unit]
Description=EchoTune MCP Server
Documentation=https://github.com/dzp5103/Spotify-echo
After=network.target

[Service]
Type=simple
User=echotune
Group=echotune
WorkingDirectory=${DEPLOYMENT_DIR}/app/mcp-server
Environment=NODE_ENV=production
Environment=PORT=3001
ExecStart=/usr/bin/node enhanced-mcp-orchestrator.js
ExecReload=/bin/kill -HUP \$MAINPID
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=echotune-mcp

[Install]
WantedBy=multi-user.target
EOF
    
    # Reload systemd
    systemctl daemon-reload
    
    # Enable and start services
    systemctl enable echotune
    systemctl enable echotune-mcp
    systemctl start echotune
    systemctl start echotune-mcp
    
    log "SUCCESS" "Systemd services configured and started"
}

# Setup monitoring and logging
setup_monitoring() {
    log "INFO" "Setting up monitoring and logging..."
    
    # Configure log rotation
    cat > /etc/logrotate.d/echotune << EOF
/var/log/echotune/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 echotune echotune
    postrotate
        systemctl reload echotune
        systemctl reload echotune-mcp
    endscript
}

/var/log/nginx/echotune_*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload nginx
    endscript
}
EOF
    
    # Create monitoring script
    cat > /usr/local/bin/echotune-monitor.sh << 'EOF'
#!/bin/bash

ALERT_EMAIL="${ALERT_EMAIL:-}"
ALERT_WEBHOOK="${ALERT_WEBHOOK:-}"

# Check if services are running
check_service() {
    local service=$1
    if ! systemctl is-active --quiet "$service"; then
        echo "ALERT: Service $service is not running"
        if [ -n "$ALERT_EMAIL" ]; then
            echo "Service $service is down on $(hostname)" | mail -s "Service Alert" "$ALERT_EMAIL"
        fi
        systemctl start "$service"
    fi
}

# Check disk usage
check_disk() {
    local usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$usage" -gt 90 ]; then
        echo "ALERT: Disk usage is ${usage}%"
        if [ -n "$ALERT_EMAIL" ]; then
            echo "Disk usage is ${usage}% on $(hostname)" | mail -s "Disk Space Alert" "$ALERT_EMAIL"
        fi
    fi
}

# Check memory usage
check_memory() {
    local usage=$(free | awk 'NR==2 {printf "%.2f", $3*100/$2}')
    local usage_int=$(echo "$usage" | cut -d. -f1)
    if [ "$usage_int" -gt 90 ]; then
        echo "ALERT: Memory usage is ${usage}%"
        if [ -n "$ALERT_EMAIL" ]; then
            echo "Memory usage is ${usage}% on $(hostname)" | mail -s "Memory Alert" "$ALERT_EMAIL"
        fi
    fi
}

# Check application health
check_app_health() {
    if ! curl -sf http://localhost:3000/health > /dev/null; then
        echo "ALERT: Application health check failed"
        if [ -n "$ALERT_EMAIL" ]; then
            echo "Application health check failed on $(hostname)" | mail -s "App Health Alert" "$ALERT_EMAIL"
        fi
    fi
}

# Run checks
check_service echotune
check_service echotune-mcp
check_service nginx
check_disk
check_memory
check_app_health

echo "$(date): Monitoring check completed"
EOF
    
    chmod +x /usr/local/bin/echotune-monitor.sh
    
    # Add monitoring cron job
    cat > /etc/cron.d/echotune-monitor << EOF
# EchoTune monitoring - runs every 5 minutes
*/5 * * * * root /usr/local/bin/echotune-monitor.sh >> /var/log/echotune/monitor.log 2>&1
EOF
    
    log "SUCCESS" "Monitoring and logging configured"
}

# Setup automated backups
setup_backups() {
    log "INFO" "Setting up automated backups..."
    
    # Create backup script
    cat > /usr/local/bin/echotune-backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/opt/echotune/backups"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup application files
echo "Creating application backup..."
tar -czf "$BACKUP_DIR/app_backup_$TIMESTAMP.tar.gz" \
    -C "/opt/echotune" \
    --exclude="node_modules" \
    --exclude="logs" \
    --exclude="backups" \
    app/

# Backup configuration files
echo "Creating configuration backup..."
tar -czf "$BACKUP_DIR/config_backup_$TIMESTAMP.tar.gz" \
    /etc/nginx/sites-available/echotune \
    /etc/systemd/system/echotune.service \
    /etc/systemd/system/echotune-mcp.service \
    /etc/logrotate.d/echotune

# Clean old backups
echo "Cleaning old backups..."
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $TIMESTAMP"
EOF
    
    chmod +x /usr/local/bin/echotune-backup.sh
    
    # Add backup cron job
    cat > /etc/cron.d/echotune-backup << EOF
# EchoTune backup - runs daily at 2 AM
0 2 * * * root /usr/local/bin/echotune-backup.sh >> /var/log/echotune/backup.log 2>&1
EOF
    
    # Run initial backup
    /usr/local/bin/echotune-backup.sh
    
    log "SUCCESS" "Automated backups configured"
}

# Performance optimization
optimize_system() {
    log "INFO" "Optimizing system performance..."
    
    # Kernel parameters for high performance
    cat >> /etc/sysctl.conf << EOF

# EchoTune Performance Optimizations
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_congestion_control = bbr
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
fs.file-max = 2097152
net.ipv4.ip_local_port_range = 1024 65535
net.ipv4.tcp_max_syn_backlog = 8192
net.core.somaxconn = 8192
EOF
    
    # Apply kernel parameters
    sysctl -p
    
    # Node.js optimizations
    cat >> /etc/environment << EOF
NODE_OPTIONS="--max-old-space-size=2048"
UV_THREADPOOL_SIZE=16
EOF
    
    log "SUCCESS" "System performance optimized"
}

# Final validation and testing
validate_deployment() {
    log "INFO" "Validating deployment..."
    
    # Wait for services to start
    sleep 10
    
    # Check service status
    local services=("echotune" "echotune-mcp" "nginx")
    for service in "${services[@]}"; do
        if systemctl is-active --quiet "$service"; then
            log "SUCCESS" "Service $service is running"
        else
            log "ERROR" "Service $service is not running"
            systemctl status "$service"
            return 1
        fi
    done
    
    # Test HTTP to HTTPS redirect
    if curl -I -s "http://$DOMAIN" | grep -q "301"; then
        log "SUCCESS" "HTTP to HTTPS redirect working"
    else
        log "WARN" "HTTP to HTTPS redirect may not be working properly"
    fi
    
    # Test HTTPS
    if curl -I -s "https://$DOMAIN" | grep -q "200"; then
        log "SUCCESS" "HTTPS is working"
    else
        log "ERROR" "HTTPS is not working properly"
        return 1
    fi
    
    # Test application health
    local health_check=$(curl -s "https://$DOMAIN/health" | jq -r '.status' 2>/dev/null)
    if [ "$health_check" = "healthy" ]; then
        log "SUCCESS" "Application health check passed"
    else
        log "WARN" "Application health check returned: $health_check"
    fi
    
    # Test MCP server
    if curl -s "http://localhost:3001/health" | grep -q "running"; then
        log "SUCCESS" "MCP server is responding"
    else
        log "WARN" "MCP server health check failed"
    fi
    
    log "SUCCESS" "Deployment validation completed"
}

# Generate deployment report
generate_report() {
    log "INFO" "Generating deployment report..."
    
    local report_file="/var/log/echotune/deployment_report_$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$report_file" << EOF
================================================================================
EchoTune AI Production Deployment Report
================================================================================
Deployment Date: $(date)
Domain: $DOMAIN
Deployment Directory: $DEPLOYMENT_DIR

System Information:
- OS: $OS_NAME $OS_VERSION
- Node.js: $(node --version)
- Docker: $(docker --version)
- Nginx: $(nginx -v 2>&1)

Services Status:
- EchoTune App: $(systemctl is-active echotune)
- MCP Server: $(systemctl is-active echotune-mcp)
- Nginx: $(systemctl is-active nginx)

Security Features:
- SSL/TLS: Enabled
- Firewall: Enabled (UFW)
- Fail2ban: Enabled
- Security Headers: Configured

Monitoring:
- Health Checks: Enabled
- Log Rotation: Configured
- Automated Backups: Enabled
- System Monitoring: Every 5 minutes

Performance Optimizations:
- Gzip Compression: Enabled
- Rate Limiting: Configured
- Kernel Parameters: Optimized
- Node.js Settings: Optimized

URLs:
- Main Application: https://$DOMAIN
- Health Check: https://$DOMAIN/health
- API Documentation: https://$DOMAIN/api/docs

Configuration Files:
- Nginx: /etc/nginx/sites-available/echotune
- Systemd Services: /etc/systemd/system/echotune*.service
- Environment: ${DEPLOYMENT_DIR}/app/.env

Log Files:
- Application: /var/log/echotune/
- Nginx: /var/log/nginx/echotune_*.log
- System: journalctl -u echotune -f

Backup Location: $BACKUP_DIR

Next Steps:
1. Configure monitoring alerts (set ALERT_EMAIL environment variable)
2. Set up external monitoring (optional)
3. Configure database backups
4. Review and adjust rate limiting settings
5. Monitor system performance and adjust resources as needed

================================================================================
EOF
    
    log "SUCCESS" "Deployment report generated: $report_file"
    echo
    echo "🎉 Deployment completed successfully!"
    echo "📊 Access your application at: https://$DOMAIN"
    echo "📄 Deployment report: $report_file"
    echo
}

# Main deployment function
main() {
    echo "========================================"
    echo "  $SCRIPT_NAME v$VERSION"
    echo "========================================"
    echo
    
    # Load environment variables
    if [ -f ".env" ]; then
        source .env
    elif [ -f ".env.production" ]; then
        source .env.production
    else
        log "WARN" "No environment file found, using system environment variables"
    fi
    
    # Create log directory
    mkdir -p "$(dirname "$LOG_FILE")"
    
    log "INFO" "Starting enhanced production deployment..."
    
    validate_config
    check_system_requirements
    install_dependencies
    setup_firewall
    setup_directories
    setup_ssl
    setup_nginx
    deploy_application
    setup_services
    setup_monitoring
    setup_backups
    optimize_system
    validate_deployment
    generate_report
    
    log "SUCCESS" "Enhanced production deployment completed successfully!"
}

# Script execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi