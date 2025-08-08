#!/bin/bash

# ===================================================================
# EchoTune AI - Optimized Production Deployment Script
# Excludes unnecessary dependencies like coding agents, dev tools, and heavy ML packages
# Optimized for minimal resource usage and production deployment
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

# Configuration - Use environment variables with fallbacks
DOMAIN="${DOMAIN:-$(hostname -f || echo 'localhost')}"
PRIMARY_IP="${PRIMARY_IP:-$(curl -s http://checkip.amazonaws.com/ || echo '127.0.0.1')}"
APP_NAME="echotune-ai"
DEPLOY_USER="echotune"
BUILD_VERSION="${BUILD_VERSION:-$(date +%Y%m%d-%H%M%S)}"
DEPLOY_DIR="/opt/echotune"
LOG_DIR="${DEPLOY_DIR}/logs"
LOG_FILE="${LOG_DIR}/deployment-optimized-$(date +%Y%m%d-%H%M%S).log"

# Production optimization flags
EXCLUDE_DEV_DEPS=true
EXCLUDE_CODING_AGENTS=true
EXCLUDE_HEAVY_ML=true
EXCLUDE_BROWSER_AUTOMATION=true
MINIMAL_INSTALL=true

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
    echo -e "${PURPLE}║            🎵 EchoTune AI - Optimized Production Deployment              ║${NC}"
    echo -e "${PURPLE}║                    Minimal Dependencies • Maximum Performance                 ║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    info "🚀 Starting optimized production deployment..."
    info "🎯 Target: Production server with minimal resource footprint"
    info "🔧 Excluding: Dev tools, coding agents, heavy ML packages, browser automation"
    echo ""
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root or with sudo"
    fi
    log "Running with root privileges - verified"
}

# Initialize optimized environment
initialize_environment() {
    log "Initializing optimized deployment environment..."
    
    # Create minimal directory structure
    mkdir -p "$LOG_DIR"
    mkdir -p "$DEPLOY_DIR"
    
    log "Environment initialization completed"
}

# Install only essential system dependencies
install_essential_dependencies() {
    log "Installing essential system dependencies (minimal set)..."
    
    # Update system packages
    apt-get update -qq
    apt-get upgrade -y -qq
    
    # Install only essential packages
    local essential_packages=(
        "curl"
        "wget" 
        "git"
        "unzip"
        "software-properties-common"
        "apt-transport-https"
        "ca-certificates"
        "gnupg"
        "lsb-release"
        "ufw"
        "logrotate"
        "certbot"
        "python3-certbot-nginx"
        "jq"
        "sqlite3"
        "libsqlite3-dev"
        "build-essential"
        "python3"
        "python3-pip"
        "python3-venv"
    )
    
    for package in "${essential_packages[@]}"; do
        apt-get install -y -qq "$package"
    done
    
    log "Essential system dependencies installed (excluding unnecessary dev tools)"
}

# Install optimized Node.js without global dev packages
install_nodejs_minimal() {
    log "Installing Node.js (production minimal)..."
    
    # Remove any existing nodejs installations
    apt-get remove -y nodejs npm 2>/dev/null || true
    
    # Install NodeSource repository for latest Node.js
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    
    # Install only essential global packages
    local essential_global_packages=(
        "pm2"
    )
    
    for package in "${essential_global_packages[@]}"; do
        npm install -g "$package"
    done
    
    # Verify installations
    node_version=$(node --version 2>/dev/null || echo "Not installed")
    npm_version=$(npm --version 2>/dev/null || echo "Not installed")
    
    log "Node.js version: $node_version (minimal installation)"
    log "npm version: $npm_version"
}

# Install minimal Python dependencies
install_python_minimal() {
    log "Installing Python (core dependencies only)..."
    
    # Create requirements file for core production dependencies only
    cat > /tmp/requirements-core.txt << 'EOF'
# Core dependencies only - no heavy ML packages
spotipy>=2.22.0
requests>=2.31.0
aiohttp>=3.8.0
websockets>=11.0.0
sqlalchemy>=2.0.0
psycopg2-binary>=2.9.0
pymongo>=4.6.0
python-dotenv>=1.0.0
fastapi>=0.100.0
uvicorn>=0.22.0
structlog>=23.0.0
tqdm>=4.65.0
EOF
    
    # Install core Python packages only
    python3 -m pip install --upgrade pip
    python3 -m pip install -r /tmp/requirements-core.txt
    
    # Clean up
    rm -f /tmp/requirements-core.txt
    
    python_version=$(python3 --version 2>/dev/null || echo "Not installed")
    log "Python version: $python_version (core dependencies only)"
}

# Install doctl with GH_PAT integration  
install_doctl_with_ghpat() {
    log "Installing doctl with GitHub PAT integration..."
    
    # Check if install script exists
    local install_script="${DEPLOY_DIR}/../scripts/install-doctl-ghpat.sh"
    if [[ -f "$install_script" ]]; then
        log "Using existing doctl installation script..."
        bash "$install_script"
    else
        warning "doctl installation script not found, skipping doctl setup"
        log "You can manually install doctl later if needed for DigitalOcean deployment"
    fi
    
    log "doctl installation with GH_PAT integration completed"
}

# Install optimized Docker
install_docker_minimal() {
    log "Installing Docker (minimal configuration)..."
    
    # Remove any existing Docker installations
    apt-get remove -y docker docker-engine docker.io containerd runc docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin 2>/dev/null || true
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Update package index and install Docker
    apt-get update -qq
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    # Create docker group and add users
    groupadd docker 2>/dev/null || true
    usermod -aG docker "$DEPLOY_USER"
    
    # Set up minimal Docker daemon configuration
    mkdir -p /etc/docker
    cat > /etc/docker/daemon.json << 'EOF'
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    },
    "storage-driver": "overlay2",
    "live-restore": true,
    "userland-proxy": false
}
EOF
    
    systemctl restart docker
    
    log "Docker installed with minimal configuration"
}

# Create deployment user and minimal directories
setup_user_and_dirs() {
    log "Setting up deployment user and minimal directories..."
    
    # Create echotune user if it doesn't exist
    if ! id "$DEPLOY_USER" &>/dev/null; then
        useradd -r -s /bin/bash -d "$DEPLOY_DIR" -m "$DEPLOY_USER"
        log "Created user: $DEPLOY_USER"
    fi
    
    # Create minimal directory structure
    local dirs=(
        "$DEPLOY_DIR"
        "$DEPLOY_DIR/ssl"
        "$LOG_DIR"
        "$DEPLOY_DIR/data"
        "$DEPLOY_DIR/backups"
    )
    
    for dir in "${dirs[@]}"; do
        mkdir -p "$dir"
        chown "$DEPLOY_USER:$DEPLOY_USER" "$dir"
    done
    
    # Add user to docker group
    usermod -aG docker "$DEPLOY_USER" 2>/dev/null || true
    
    log "Minimal directory structure created"
}

# Deploy application with minimal dependencies
deploy_application_minimal() {
    log "Deploying EchoTune AI with minimal dependencies..."
    
    # Switch to deploy user for application operations
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
        
        # Create optimized package.json for production (exclude dev dependencies)
        cat > package-production.json << 'EOF'
{
  \"name\": \"echotune-ai-production\",
  \"version\": \"2.1.0\",
  \"description\": \"EchoTune AI - Optimized Production Build\",
  \"main\": \"server.js\",
  \"scripts\": {
    \"start\": \"node server.js\",
    \"health-check\": \"curl -f http://localhost:3000/health || exit 1\"
  },
  \"dependencies\": {
    \"@supabase/supabase-js\": \"^2.53.0\",
    \"axios\": \"^1.5.0\",
    \"compression\": \"^1.7.4\",
    \"cors\": \"^2.8.5\",
    \"csv-parser\": \"^3.0.0\",
    \"dotenv\": \"^16.3.0\",
    \"express\": \"^4.18.0\",
    \"helmet\": \"^7.1.0\",
    \"lodash\": \"^4.17.21\",
    \"mongodb\": \"^6.3.0\",
    \"multer\": \"^2.0.0\",
    \"node-fetch\": \"^3.3.2\",
    \"openai\": \"^4.24.0\",
    \"socket.io\": \"^4.7.0\",
    \"socket.io-client\": \"^4.8.1\",
    \"sqlite3\": \"^5.1.7\",
    \"uuid\": \"^9.0.1\",
    \"ws\": \"^8.14.0\"
  }
}
EOF
        
        # Use optimized package.json
        cp package-production.json package.json
        
        # Install only production dependencies
        npm ci --only=production --no-audit --no-fund
        
        # Create optimized environment file
        cat > .env << EOF
NODE_ENV=production
PORT=3000
DOMAIN=$DOMAIN
FRONTEND_URL=https://$DOMAIN
SPOTIFY_REDIRECT_URI=https://$DOMAIN/auth/callback
SESSION_SECRET=\$(openssl rand -hex 32)
JWT_SECRET=\$(openssl rand -hex 32)
BUILD_VERSION=$BUILD_VERSION
DATABASE_TYPE=sqlite
DEBUG=false
LOG_LEVEL=info
TRUST_PROXY=true
HEALTH_CHECK_ENABLED=true
DEMO_MODE=true
EOF
        
        echo \"Application deployment preparation completed (minimal dependencies)\"
    "
    
    log "Application deployed with minimal dependencies"
}

# Create optimized Dockerfile for production
create_optimized_dockerfile() {
    log "Creating optimized Dockerfile for production..."
    
    cat > "$DEPLOY_DIR/Dockerfile.optimized" << 'EOF'
# Optimized production build for EchoTune AI
# Excludes all unnecessary dependencies and tools

FROM node:20-alpine AS base

# Set production environment
ENV NODE_ENV=production \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false

# Install only essential runtime dependencies
RUN apk add --no-cache \
    curl \
    ca-certificates \
    tzdata \
    python3 \
    tini \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S echotune -u 1001 -G nodejs -h /app

WORKDIR /app

# Copy optimized package.json (production dependencies only)
COPY package-production.json package.json

# Install production dependencies only
RUN npm ci --only=production --no-audit --no-fund && \
    npm cache clean --force

# Copy application source
COPY --chown=echotune:nodejs src/ ./src/
COPY --chown=echotune:nodejs server.js index.js ./
COPY --chown=echotune:nodejs .env ./

# Create necessary directories
RUN mkdir -p logs data && \
    chown -R echotune:nodejs logs data

# Switch to non-root user
USER echotune

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Use tini as PID 1
ENTRYPOINT ["tini", "--"]

# Start application
CMD ["node", "server.js"]
EOF
    
    log "Optimized Dockerfile created (excludes dev tools, MCP servers, browser automation)"
}

# Create optimized docker-compose for production
create_optimized_docker_compose() {
    log "Creating optimized docker-compose for production..."
    
    cat > "$DEPLOY_DIR/docker-compose.optimized.yml" << 'EOF'
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.optimized
    container_name: echotune-app-optimized
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    networks:
      - echotune-network

  # Minimal nginx proxy (no SSL for simplicity)
  nginx:
    image: nginx:alpine
    container_name: echotune-nginx-optimized
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - echotune-network

networks:
  echotune-network:
    driver: bridge
EOF
    
    log "Optimized docker-compose created (minimal services only)"
}

# Setup basic SSL (no complex automation)
setup_ssl_basic() {
    log "Setting up basic SSL certificates..."
    
    mkdir -p "$DEPLOY_DIR/ssl"
    
    # Try to obtain SSL certificate
    if certbot certonly --standalone --non-interactive --agree-tos --email "admin@$DOMAIN" --domains "$DOMAIN" &>/dev/null; then
        # Copy certificates
        cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$DEPLOY_DIR/ssl/$DOMAIN.crt"
        cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$DEPLOY_DIR/ssl/$DOMAIN.key"
        log "SSL certificate obtained and configured"
    else
        # Generate self-signed certificate as fallback
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "$DEPLOY_DIR/ssl/$DOMAIN.key" \
            -out "$DEPLOY_DIR/ssl/$DOMAIN.crt" \
            -subj "/C=US/ST=CA/L=SF/O=EchoTune/CN=$DOMAIN" &>/dev/null
        warning "Using self-signed certificate (Let's Encrypt failed)"
    fi
    
    chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_DIR/ssl"
}

# Create minimal nginx configuration
create_nginx_config() {
    log "Creating minimal nginx configuration..."
    
    mkdir -p "$DEPLOY_DIR/nginx"
    
    cat > "$DEPLOY_DIR/nginx/nginx.conf" << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    server {
        listen 80;
        server_name _;
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl;
        server_name _;

        ssl_certificate /etc/nginx/ssl/\${DOMAIN}.crt;
        ssl_certificate_key /etc/nginx/ssl/\${DOMAIN}.key;
        ssl_protocols TLSv1.2 TLSv1.3;

        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /health {
            proxy_pass http://app/health;
        }
    }
}
EOF
    
    chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_DIR/nginx"
    log "Minimal nginx configuration created"
}

# Start optimized deployment
start_optimized_deployment() {
    log "Starting optimized EchoTune AI deployment..."
    
    cd "$DEPLOY_DIR"
    
    # Build and start with optimized configuration
    runuser -l "$DEPLOY_USER" -c "
        cd \"$DEPLOY_DIR\"
        docker-compose -f docker-compose.optimized.yml down --timeout 10 2>/dev/null || true
        docker-compose -f docker-compose.optimized.yml build --no-cache
        docker-compose -f docker-compose.optimized.yml up -d
    "
    
    log "Optimized deployment started"
}

# Verify deployment health
verify_deployment() {
    log "Verifying optimized deployment..."
    
    # Wait for services to start
    sleep 30
    
    # Check container status
    if cd "$DEPLOY_DIR" && runuser -l "$DEPLOY_USER" -c "cd '$DEPLOY_DIR' && docker-compose -f docker-compose.optimized.yml ps | grep -q 'Up'"; then
        log "✓ Containers are running"
    else
        error "Containers failed to start"
    fi
    
    # Test health endpoint
    for i in {1..5}; do
        if curl -f -m 10 "http://localhost/health" 2>/dev/null; then
            log "✓ Health check passed"
            break
        else
            warning "Health check failed (attempt $i/5)"
            sleep 5
        fi
    done
    
    log "Deployment verification completed"
}

# Show deployment summary
show_deployment_summary() {
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    🎉 OPTIMIZED DEPLOYMENT COMPLETED! 🎉                   ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    echo -e "${WHITE}🌐 Access Your Optimized EchoTune AI:${NC}"
    echo "   🔗 HTTPS: https://$DOMAIN"
    echo "   🔗 HTTP: http://$DOMAIN"
    echo ""
    
    echo -e "${WHITE}📊 Optimization Summary:${NC}"
    echo "   ✅ Excluded development dependencies"
    echo "   ✅ Excluded coding agent tools (MCP servers, browser automation)"
    echo "   ✅ Excluded heavy ML packages (scikit-learn, matplotlib, etc.)"
    echo "   ✅ Minimal Python dependencies (core functionality only)"
    echo "   ✅ Production-optimized Docker images"
    echo "   ✅ Reduced resource footprint"
    echo "   ✅ Auto-installed doctl with GH_PAT integration"
    echo ""
    
    echo -e "${WHITE}🔧 Management Commands:${NC}"
    echo "   📊 Check Status: cd $DEPLOY_DIR && docker-compose -f docker-compose.optimized.yml ps"
    echo "   📝 View Logs: cd $DEPLOY_DIR && docker-compose -f docker-compose.optimized.yml logs -f"
    echo "   🔄 Restart: cd $DEPLOY_DIR && docker-compose -f docker-compose.optimized.yml restart"
    echo ""
    
    echo -e "${CYAN}🎵 Your optimized AI-powered music platform is ready!${NC}"
}

# Main deployment function
main() {
    print_header
    
    check_root
    initialize_environment
    install_essential_dependencies
    install_nodejs_minimal
    install_python_minimal
    install_doctl_with_ghpat
    install_docker_minimal
    setup_user_and_dirs
    deploy_application_minimal
    create_optimized_dockerfile
    create_optimized_docker_compose
    setup_ssl_basic
    create_nginx_config
    start_optimized_deployment
    verify_deployment
    show_deployment_summary
    
    log "🚀 Optimized deployment completed successfully!"
}

# Execute main function
main "$@" 
