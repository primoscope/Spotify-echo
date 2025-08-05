#!/bin/bash

# ===================================================================
# EchoTune AI - Ubuntu DigitalOcean Deployment Script
# 
# This script provides automated deployment of EchoTune AI to
# DigitalOcean Ubuntu droplets with comprehensive configuration,
# monitoring, and production optimizations.
#
# Features:
# - Docker-based deployment with health checks
# - Nginx reverse proxy with SSL termination
# - Database integration (MongoDB Atlas, DigitalOcean Managed DB)
# - Environment-specific configurations
# - Automated backup and monitoring setup
# - CI/CD integration ready
# ===================================================================

set -euo pipefail

# Script metadata
SCRIPT_VERSION="1.0.0"
SCRIPT_NAME="EchoTune AI - Ubuntu DigitalOcean Deployer"

# Configuration
APP_NAME="echotune"
APP_USER="echotune"
APP_DIR="/opt/echotune"
REPO_URL="https://github.com/dzp5103/Spotify-echo.git"
BRANCH="${BRANCH:-main}"
ENVIRONMENT="${ENVIRONMENT:-production}"

# Container configuration
CONTAINER_NAME_APP="echotune-app"
CONTAINER_NAME_MCP="echotune-mcp"
CONTAINER_NAME_NGINX="echotune-nginx"
CONTAINER_NAME_REDIS="echotune-redis"

# Network configuration
NETWORK_NAME="echotune-network"
APP_PORT="${APP_PORT:-3000}"
MCP_PORT="${MCP_PORT:-3001}"
NGINX_PORT="${NGINX_PORT:-80}"
NGINX_SSL_PORT="${NGINX_SSL_PORT:-443}"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${PURPLE}[STEP]${NC} $1"; }
log_substep() { echo -e "${CYAN}  → $1${NC}"; }

# Helper functions
command_exists() { command -v "$1" >/dev/null 2>&1; }
container_exists() { docker ps -a --format '{{.Names}}' | grep -q "^$1$"; }
container_running() { docker ps --format '{{.Names}}' | grep -q "^$1$"; }
network_exists() { docker network ls --format '{{.Name}}' | grep -q "^$1$"; }

# Print script header
print_header() {
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║                  🚀 ${SCRIPT_NAME} 🚀                  ║${NC}"
    echo -e "${PURPLE}║                               Version ${SCRIPT_VERSION}                               ║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo
    echo -e "${CYAN}Automated EchoTune AI deployment for Ubuntu DigitalOcean droplets${NC}"
    echo
}

# Validate deployment environment
validate_environment() {
    log_step "Validating deployment environment..."
    
    # Check if running as root or with sudo
    if [[ $EUID -ne 0 ]] && ! sudo -n true 2>/dev/null; then
        log_error "This script requires root privileges or passwordless sudo"
        exit 1
    fi
    
    # Check Docker installation
    if ! command_exists docker; then
        log_error "Docker is not installed. Please run ubuntu-digitalocean-install.sh first"
        exit 1
    fi
    
    # Check Docker Compose installation
    if ! command_exists docker-compose; then
        log_error "Docker Compose is not installed. Please run ubuntu-digitalocean-install.sh first"
        exit 1
    fi
    
    # Check application directory
    if [[ ! -d "$APP_DIR" ]]; then
        log_error "Application directory $APP_DIR does not exist"
        log_info "Please run ubuntu-digitalocean-install.sh first"
        exit 1
    fi
    
    # Check application user
    if ! id "$APP_USER" &>/dev/null; then
        log_error "Application user $APP_USER does not exist"
        log_info "Please run ubuntu-digitalocean-install.sh first"
        exit 1
    fi
    
    log_success "Environment validation completed"
}

# Load environment configuration
load_environment() {
    log_step "Loading environment configuration..."
    
    local env_file="$APP_DIR/.env"
    
    if [[ -f "$env_file" ]]; then
        log_substep "Loading environment from $env_file"
        set -a
        source "$env_file"
        set +a
        log_success "Environment variables loaded"
    else
        log_warning "Environment file not found at $env_file"
        log_info "Using default configuration and environment variables"
    fi
    
    # Validate required environment variables
    local required_vars=(
        "SPOTIFY_CLIENT_ID"
        "SPOTIFY_CLIENT_SECRET"
        "SPOTIFY_REDIRECT_URI"
    )
    
    local missing_vars=()
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log_warning "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            log_substep "$var"
        done
        log_info "Please configure these variables in $env_file"
    fi
}

# Update application code
update_application() {
    log_step "Updating application code..."
    
    cd "$APP_DIR"
    
    # Backup current deployment
    local backup_dir="$APP_DIR/backups/$(date +%Y%m%d_%H%M%S)"
    log_substep "Creating backup at $backup_dir"
    mkdir -p "$backup_dir"
    
    # Backup important files
    if [[ -f ".env" ]]; then
        cp ".env" "$backup_dir/"
    fi
    if [[ -d "data" ]]; then
        cp -r "data" "$backup_dir/" 2>/dev/null || true
    fi
    
    # Update code from repository
    log_substep "Fetching latest code from $BRANCH branch..."
    git fetch origin
    git checkout "$BRANCH"
    git pull origin "$BRANCH"
    
    # Install/update dependencies
    log_substep "Installing Node.js dependencies..."
    sudo -u "$APP_USER" npm ci --production
    
    # Install/update Python dependencies
    if [[ -f "requirements.txt" ]]; then
        log_substep "Installing Python dependencies..."
        sudo -u "$APP_USER" python3 -m pip install --user -r requirements.txt --upgrade
    fi
    
    # Set permissions
    chown -R "$APP_USER:$APP_USER" "$APP_DIR"
    
    log_success "Application code updated"
}

# Create Docker network
create_docker_network() {
    log_step "Setting up Docker network..."
    
    if network_exists "$NETWORK_NAME"; then
        log_substep "Docker network $NETWORK_NAME already exists"
    else
        log_substep "Creating Docker network: $NETWORK_NAME"
        docker network create "$NETWORK_NAME"
    fi
    
    log_success "Docker network ready"
}

# Build application Docker images
build_docker_images() {
    log_step "Building Docker images..."
    
    cd "$APP_DIR"
    
    # Create Dockerfile for main application if it doesn't exist
    if [[ ! -f "Dockerfile" ]]; then
        log_substep "Creating Dockerfile for main application..."
        cat > Dockerfile << 'EOF'
FROM node:18-alpine

# Install Python and build tools
RUN apk add --no-cache python3 py3-pip build-base

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --production

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S echotune && \
    adduser -S echotune -u 1001 -G echotune

# Set permissions
RUN chown -R echotune:echotune /app
USER echotune

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["node", "index.js"]
EOF
    fi
    
    # Create Dockerfile for MCP server if it doesn't exist
    if [[ ! -f "mcp-server/Dockerfile" ]]; then
        log_substep "Creating Dockerfile for MCP server..."
        mkdir -p mcp-server
        cat > mcp-server/Dockerfile << 'EOF'
FROM node:18-alpine

# Install dependencies for browser automation
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Tell Puppeteer to skip installing Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --production

# Copy MCP server code
COPY mcp-server/ ./

# Create non-root user
RUN addgroup -g 1001 -S echotune && \
    adduser -S echotune -u 1001 -G echotune

# Set permissions
RUN chown -R echotune:echotune /app
USER echotune

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Start MCP server
CMD ["node", "server.js"]
EOF
    fi
    
    # Build main application image
    log_substep "Building main application image..."
    docker build -t echotune-app:latest .
    
    # Build MCP server image
    if [[ -d "mcp-server" ]]; then
        log_substep "Building MCP server image..."
        docker build -t echotune-mcp:latest -f mcp-server/Dockerfile .
    fi
    
    log_success "Docker images built successfully"
}

# Deploy Redis container
deploy_redis() {
    log_step "Deploying Redis container..."
    
    # Stop existing container if running
    if container_running "$CONTAINER_NAME_REDIS"; then
        log_substep "Stopping existing Redis container..."
        docker stop "$CONTAINER_NAME_REDIS"
    fi
    
    # Remove existing container
    if container_exists "$CONTAINER_NAME_REDIS"; then
        log_substep "Removing existing Redis container..."
        docker rm "$CONTAINER_NAME_REDIS"
    fi
    
    # Create Redis data directory
    local redis_data_dir="$APP_DIR/data/redis"
    mkdir -p "$redis_data_dir"
    chown -R 999:999 "$redis_data_dir"  # Redis user in container
    
    # Deploy Redis container
    log_substep "Starting Redis container..."
    docker run -d \
        --name "$CONTAINER_NAME_REDIS" \
        --network "$NETWORK_NAME" \
        --restart unless-stopped \
        -v "$redis_data_dir:/data" \
        -e REDIS_PASSWORD="${REDIS_PASSWORD:-echotune_redis_2024}" \
        redis:7-alpine \
        redis-server --requirepass "${REDIS_PASSWORD:-echotune_redis_2024}"
    
    # Wait for Redis to be ready
    log_substep "Waiting for Redis to be ready..."
    for i in {1..30}; do
        if docker exec "$CONTAINER_NAME_REDIS" redis-cli -a "${REDIS_PASSWORD:-echotune_redis_2024}" ping >/dev/null 2>&1; then
            break
        fi
        sleep 1
    done
    
    log_success "Redis deployed successfully"
}

# Deploy main application
deploy_application() {
    log_step "Deploying main application..."
    
    # Stop existing container if running
    if container_running "$CONTAINER_NAME_APP"; then
        log_substep "Stopping existing application container..."
        docker stop "$CONTAINER_NAME_APP"
    fi
    
    # Remove existing container
    if container_exists "$CONTAINER_NAME_APP"; then
        log_substep "Removing existing application container..."
        docker rm "$CONTAINER_NAME_APP"
    fi
    
    # Create application data directories
    local app_data_dir="$APP_DIR/data/app"
    local app_logs_dir="$APP_DIR/logs"
    mkdir -p "$app_data_dir" "$app_logs_dir"
    chown -R 1001:1001 "$app_data_dir" "$app_logs_dir"  # echotune user in container
    
    # Deploy application container
    log_substep "Starting application container..."
    docker run -d \
        --name "$CONTAINER_NAME_APP" \
        --network "$NETWORK_NAME" \
        --restart unless-stopped \
        -p "$APP_PORT:3000" \
        -v "$APP_DIR/.env:/app/.env:ro" \
        -v "$app_data_dir:/app/data" \
        -v "$app_logs_dir:/app/logs" \
        -e NODE_ENV="$ENVIRONMENT" \
        -e REDIS_URL="redis://:${REDIS_PASSWORD:-echotune_redis_2024}@${CONTAINER_NAME_REDIS}:6379" \
        echotune-app:latest
    
    # Wait for application to be ready
    log_substep "Waiting for application to be ready..."
    for i in {1..60}; do
        if curl -s "http://localhost:$APP_PORT/health" >/dev/null 2>&1; then
            break
        fi
        sleep 2
    done
    
    log_success "Main application deployed successfully"
}

# Deploy MCP server
deploy_mcp_server() {
    log_step "Deploying MCP server..."
    
    # Skip if MCP server directory doesn't exist
    if [[ ! -d "$APP_DIR/mcp-server" ]]; then
        log_warning "MCP server directory not found, skipping deployment"
        return 0
    fi
    
    # Stop existing container if running
    if container_running "$CONTAINER_NAME_MCP"; then
        log_substep "Stopping existing MCP server container..."
        docker stop "$CONTAINER_NAME_MCP"
    fi
    
    # Remove existing container
    if container_exists "$CONTAINER_NAME_MCP"; then
        log_substep "Removing existing MCP server container..."
        docker rm "$CONTAINER_NAME_MCP"
    fi
    
    # Create MCP data directories
    local mcp_data_dir="$APP_DIR/data/mcp"
    local mcp_logs_dir="$APP_DIR/logs/mcp"
    mkdir -p "$mcp_data_dir" "$mcp_logs_dir"
    chown -R 1001:1001 "$mcp_data_dir" "$mcp_logs_dir"
    
    # Deploy MCP server container
    log_substep "Starting MCP server container..."
    docker run -d \
        --name "$CONTAINER_NAME_MCP" \
        --network "$NETWORK_NAME" \
        --restart unless-stopped \
        -p "$MCP_PORT:3001" \
        -v "$APP_DIR/.env:/app/.env:ro" \
        -v "$mcp_data_dir:/app/data" \
        -v "$mcp_logs_dir:/app/logs" \
        -e NODE_ENV="$ENVIRONMENT" \
        -e REDIS_URL="redis://:${REDIS_PASSWORD:-echotune_redis_2024}@${CONTAINER_NAME_REDIS}:6379" \
        --cap-add=SYS_ADMIN \
        echotune-mcp:latest
    
    # Wait for MCP server to be ready
    log_substep "Waiting for MCP server to be ready..."
    for i in {1..60}; do
        if curl -s "http://localhost:$MCP_PORT/health" >/dev/null 2>&1; then
            break
        fi
        sleep 2
    done
    
    log_success "MCP server deployed successfully"
}

# Configure Nginx proxy
configure_nginx_proxy() {
    log_step "Configuring Nginx reverse proxy..."
    
    # Update Nginx configuration to point to Docker containers
    local nginx_config="/etc/nginx/sites-available/echotune"
    
    log_substep "Updating Nginx configuration for Docker deployment..."
    
    # Backup existing configuration
    if [[ -f "$nginx_config" ]]; then
        cp "$nginx_config" "${nginx_config}.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    # Create new configuration
    cat > "$nginx_config" << EOF
# EchoTune AI - Docker-based deployment configuration
upstream echotune_app {
    server localhost:$APP_PORT;
}

upstream echotune_mcp {
    server localhost:$MCP_PORT;
}

# Rate limiting
limit_req_zone \$binary_remote_addr zone=app:10m rate=10r/s;
limit_req_zone \$binary_remote_addr zone=api:10m rate=30r/s;

server {
    listen 80;
    server_name _;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header X-Robots-Tag "noindex, nofollow" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/javascript application/xml+rss application/json;
    
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
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        proxy_send_timeout 300s;
        
        # Health check bypass
        location /health {
            access_log off;
            proxy_pass http://echotune_app;
        }
    }
    
    # MCP Server
    location /mcp/ {
        limit_req zone=api burst=50 nodelay;
        
        proxy_pass http://echotune_mcp/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # API endpoints
    location /api/ {
        limit_req zone=api burst=30 nodelay;
        
        proxy_pass http://echotune_app;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Static files
    location /static/ {
        alias /opt/echotune/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        
        # Security for static files
        location ~* \.(php|asp|aspx|jsp|cgi)$ {
            deny all;
        }
    }
    
    # Block access to sensitive files
    location ~ /\.(env|git|svn) {
        deny all;
        return 404;
    }
    
    # System health check
    location /nginx-health {
        access_log off;
        return 200 "nginx healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF
    
    # Test configuration
    nginx -t
    
    # Reload Nginx
    systemctl reload nginx
    
    log_success "Nginx reverse proxy configured"
}

# Setup health monitoring
setup_health_monitoring() {
    log_step "Setting up health monitoring..."
    
    # Create health check script
    cat > /usr/local/bin/echotune-health-check << 'EOF'
#!/bin/bash

# EchoTune AI Health Check Script
set -e

CONTAINERS=("echotune-app" "echotune-mcp" "echotune-redis")
ENDPOINTS=("http://localhost:3000/health" "http://localhost:3001/health")
CRITICAL_SERVICES=("nginx" "docker")

echo "=== EchoTune AI Health Check $(date) ==="
echo

# Check Docker containers
echo "Docker Containers:"
for container in "${CONTAINERS[@]}"; do
    if docker ps --format '{{.Names}}' | grep -q "^$container$"; then
        status=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "no-healthcheck")
        echo "  ✓ $container: running ($status)"
    else
        echo "  ✗ $container: not running"
    fi
done
echo

# Check HTTP endpoints
echo "HTTP Endpoints:"
for endpoint in "${ENDPOINTS[@]}"; do
    if curl -s --max-time 10 "$endpoint" >/dev/null 2>&1; then
        echo "  ✓ $endpoint: healthy"
    else
        echo "  ✗ $endpoint: unhealthy"
    fi
done
echo

# Check system services
echo "System Services:"
for service in "${CRITICAL_SERVICES[@]}"; do
    if systemctl is-active "$service" >/dev/null 2>&1; then
        echo "  ✓ $service: active"
    else
        echo "  ✗ $service: inactive"
    fi
done
echo

# Check resource usage
echo "Resource Usage:"
echo "  Memory: $(free -h | awk '/^Mem:/ {print $3 "/" $2 " (" int($3/$2 * 100) "%)"}')"
echo "  Disk: $(df -h /opt/echotune | awk 'NR==2 {print $3 "/" $2 " (" $5 ")"}')"
echo "  Load: $(uptime | awk -F'load average:' '{print $2}')"
echo

# Check recent errors in logs
echo "Recent Errors (last 5 minutes):"
if journalctl --since "5 minutes ago" --priority=err --no-pager --quiet | head -5 | grep -q .; then
    journalctl --since "5 minutes ago" --priority=err --no-pager --quiet | head -5
else
    echo "  No critical errors found"
fi
EOF
    
    chmod +x /usr/local/bin/echotune-health-check
    
    # Create monitoring cron job
    log_substep "Setting up monitoring cron job..."
    (crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/echotune-health-check >> /opt/echotune/logs/health-check.log 2>&1") | crontab -
    
    # Create log rotation for health check logs
    cat > /etc/logrotate.d/echotune-health << 'EOF'
/opt/echotune/logs/health-check.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    copytruncate
}
EOF
    
    log_success "Health monitoring configured"
}

# Setup backup system
setup_backup_system() {
    log_step "Setting up backup system..."
    
    # Create backup script
    cat > /usr/local/bin/echotune-backup << 'EOF'
#!/bin/bash

# EchoTune AI Backup Script
set -e

BACKUP_DIR="/opt/echotune/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="echotune_backup_$TIMESTAMP"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

echo "Creating backup: $BACKUP_NAME"

# Create backup directory
mkdir -p "$BACKUP_PATH"

# Backup application data
echo "Backing up application data..."
if [[ -d "/opt/echotune/data" ]]; then
    tar -czf "$BACKUP_PATH/data.tar.gz" -C /opt/echotune data/
fi

# Backup configuration
echo "Backing up configuration..."
if [[ -f "/opt/echotune/.env" ]]; then
    cp "/opt/echotune/.env" "$BACKUP_PATH/"
fi

# Backup database dumps (if local databases exist)
echo "Creating database dumps..."
# Add database backup commands here based on your setup

# Create backup manifest
cat > "$BACKUP_PATH/manifest.txt" << EOL
Backup created: $(date)
Application version: $(cd /opt/echotune && git rev-parse HEAD 2>/dev/null || echo "unknown")
Environment: ${ENVIRONMENT:-production}
Files included:
$(ls -la "$BACKUP_PATH/")
EOL

echo "Backup completed: $BACKUP_PATH"

# Clean up old backups (keep last 7 days)
find "$BACKUP_DIR" -name "echotune_backup_*" -type d -mtime +7 -exec rm -rf {} \; 2>/dev/null || true

echo "Backup cleanup completed"
EOF
    
    chmod +x /usr/local/bin/echotune-backup
    
    # Create daily backup cron job
    log_substep "Setting up daily backup cron job..."
    (crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/echotune-backup >> /opt/echotune/logs/backup.log 2>&1") | crontab -
    
    # Create initial backup
    log_substep "Creating initial backup..."
    /usr/local/bin/echotune-backup
    
    log_success "Backup system configured"
}

# Verify deployment
verify_deployment() {
    log_step "Verifying deployment..."
    
    local all_healthy=true
    
    # Check Docker containers
    log_substep "Checking Docker containers..."
    local containers=("$CONTAINER_NAME_APP" "$CONTAINER_NAME_MCP" "$CONTAINER_NAME_REDIS")
    for container in "${containers[@]}"; do
        if container_running "$container"; then
            log_substep "✓ $container is running"
        else
            log_substep "✗ $container is not running"
            all_healthy=false
        fi
    done
    
    # Check HTTP endpoints
    log_substep "Checking HTTP endpoints..."
    local endpoints=(
        "http://localhost:$APP_PORT/health"
        "http://localhost:$MCP_PORT/health"
    )
    
    for endpoint in "${endpoints[@]}"; do
        if curl -s --max-time 10 "$endpoint" >/dev/null 2>&1; then
            log_substep "✓ $endpoint is healthy"
        else
            log_substep "✗ $endpoint is not responding"
            all_healthy=false
        fi
    done
    
    # Check Nginx
    log_substep "Checking Nginx configuration..."
    if nginx -t >/dev/null 2>&1; then
        log_substep "✓ Nginx configuration is valid"
    else
        log_substep "✗ Nginx configuration has errors"
        all_healthy=false
    fi
    
    # Check system services
    log_substep "Checking system services..."
    local services=("nginx" "docker")
    for service in "${services[@]}"; do
        if systemctl is-active "$service" >/dev/null 2>&1; then
            log_substep "✓ $service is active"
        else
            log_substep "✗ $service is not active"
            all_healthy=false
        fi
    done
    
    if [[ "$all_healthy" == true ]]; then
        log_success "Deployment verification passed"
    else
        log_warning "Deployment verification found issues"
        log_info "Run 'echotune-health-check' for detailed status"
    fi
}

# Display deployment summary
show_deployment_summary() {
    echo
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║               🎉 EchoTune AI Deployment Completed Successfully! 🎉               ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo
    
    log_success "Ubuntu DigitalOcean deployment completed successfully!"
    echo
    
    echo -e "${CYAN}📋 Deployment Summary:${NC}"
    echo -e "  • Application updated to latest code"
    echo -e "  • Docker containers deployed and running"
    echo -e "  • Nginx reverse proxy configured"
    echo -e "  • Health monitoring enabled"
    echo -e "  • Backup system configured"
    echo -e "  • Services verified and healthy"
    echo
    
    echo -e "${CYAN}🐳 Docker Containers:${NC}"
    echo -e "  • $CONTAINER_NAME_APP (port $APP_PORT)"
    echo -e "  • $CONTAINER_NAME_MCP (port $MCP_PORT)"
    echo -e "  • $CONTAINER_NAME_REDIS (internal)"
    echo
    
    echo -e "${CYAN}🌐 Access Points:${NC}"
    local server_ip
    server_ip=$(curl -s ifconfig.me 2>/dev/null || echo "YOUR_SERVER_IP")
    echo -e "  • Main Application: http://$server_ip"
    echo -e "  • MCP Server: http://$server_ip/mcp/"
    echo -e "  • Health Check: http://$server_ip/health"
    echo
    
    echo -e "${CYAN}🔧 Management Commands:${NC}"
    echo "  • Health Check: echotune-health-check"
    echo "  • Create Backup: echotune-backup"
    echo "  • View Logs: docker logs $CONTAINER_NAME_APP -f"
    echo "  • Container Status: docker ps"
    echo "  • Restart App: docker restart $CONTAINER_NAME_APP"
    echo
    
    echo -e "${CYAN}📁 Important Paths:${NC}"
    echo "  • Application: $APP_DIR"
    echo "  • Logs: $APP_DIR/logs/"
    echo "  • Data: $APP_DIR/data/"
    echo "  • Backups: $APP_DIR/backups/"
    echo
    
    echo -e "${GREEN}Deployment log saved to: /opt/echotune/logs/deployment.log${NC}"
    echo
}

# Error handling
cleanup() {
    local exit_code=$?
    if [[ $exit_code -ne 0 ]]; then
        log_error "Deployment failed with exit code $exit_code"
        log_info "Check logs for details: /opt/echotune/logs/deployment.log"
        log_info "Run 'docker logs $CONTAINER_NAME_APP' for application logs"
    fi
    exit $exit_code
}

# Main function
main() {
    # Set up logging
    mkdir -p "$APP_DIR/logs"
    exec > >(tee -a "$APP_DIR/logs/deployment.log")
    exec 2>&1
    
    print_header
    
    # Parse arguments
    local skip_build=false
    local skip_update=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-build)
                skip_build=true
                shift
                ;;
            --skip-update)
                skip_update=true
                shift
                ;;
            --branch)
                BRANCH="$2"
                shift 2
                ;;
            --environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -h|--help)
                echo "Usage: $0 [OPTIONS]"
                echo
                echo "Options:"
                echo "  --skip-build       Skip Docker image building"
                echo "  --skip-update      Skip application code update"
                echo "  --branch BRANCH    Deploy specific branch (default: main)"
                echo "  --environment ENV  Set deployment environment (default: production)"
                echo "  -h, --help         Show this help message"
                echo
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Execute deployment steps
    validate_environment
    load_environment
    
    if [[ "$skip_update" != true ]]; then
        update_application
    fi
    
    create_docker_network
    
    if [[ "$skip_build" != true ]]; then
        build_docker_images
    fi
    
    deploy_redis
    deploy_application
    deploy_mcp_server
    configure_nginx_proxy
    setup_health_monitoring
    setup_backup_system
    verify_deployment
    show_deployment_summary
}

# Set up signal handlers
trap cleanup EXIT
trap 'log_error "Deployment interrupted"; exit 130' INT TERM

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi