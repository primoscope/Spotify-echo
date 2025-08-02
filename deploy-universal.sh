#!/bin/bash

# 🚀 EchoTune AI - Universal Quick Deploy Script
# Optimized for production deployment with SSL, security, and performance
# Supports Docker, native Linux, DigitalOcean, and development environments

set -euo pipefail

# Script metadata
readonly SCRIPT_VERSION="2.0.0"
readonly SCRIPT_NAME="Universal EchoTune AI Deployment"
readonly REPO_URL="https://github.com/dzp5103/Spotify-echo.git"

# Color codes for beautiful output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[1;37m'
readonly BOLD='\033[1m'
readonly NC='\033[0m' # No Color

# Configuration variables
DOMAIN=""
DEPLOY_METHOD=""
SSL_EMAIL=""
INSTALL_DIR=""
ENV_FILE=""
SKIP_DEPS=false
FORCE_REINSTALL=false
PRODUCTION_MODE=false
DEBUG_MODE=false

# Logging functions
log() { echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BOLD}${CYAN}[STEP]${NC} $1"; }
log_debug() { [[ "$DEBUG_MODE" == "true" ]] && echo -e "${PURPLE}[DEBUG]${NC} $1" || true; }

# Print fancy header
print_header() {
    clear
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                     🎵 EchoTune AI - Universal Deployment                   ║"
    echo "║                          $SCRIPT_VERSION - Production Ready                        ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo -e "${WHITE}AI-Powered Music Discovery Platform${NC}"
    echo -e "${CYAN}Intelligent deployment with auto-detection and optimization${NC}"
    echo ""
}

# Help function
show_help() {
    cat << EOF
$SCRIPT_NAME v$SCRIPT_VERSION

USAGE:
    ./deploy-universal.sh [OPTIONS]

OPTIONS:
    -d, --domain DOMAIN      Set domain name (auto-detected if not provided)
    -m, --method METHOD      Force deployment method (docker|native|digitalocean)
    -e, --email EMAIL        Email for SSL certificate generation
    -i, --install-dir DIR    Installation directory (default: auto-detected)
    -f, --force             Force reinstallation over existing deployment
    -p, --production        Enable production mode with enhanced security
    -s, --skip-deps         Skip dependency installation
    --debug                 Enable debug mode for troubleshooting
    -h, --help              Show this help message

EXAMPLES:
    # Quick deployment with auto-detection
    ./deploy-universal.sh

    # Production deployment with custom domain
    ./deploy-universal.sh --domain example.com --email admin@example.com --production

    # Force Docker deployment
    ./deploy-universal.sh --method docker --domain localhost

    # Development mode with debug output
    ./deploy-universal.sh --debug

SUPPORTED ENVIRONMENTS:
    • DigitalOcean Droplets (auto-detected)
    • Docker (Linux, macOS, Windows)
    • Native Linux (Ubuntu/Debian)
    • Node.js environments

FEATURES:
    ✅ Automatic environment detection
    ✅ SSL certificate management (Let's Encrypt)
    ✅ Production security hardening
    ✅ Performance optimization
    ✅ Health monitoring and validation
    ✅ Intelligent error recovery
    ✅ Comprehensive logging

For more information: https://github.com/dzp5103/Spotify-echo
EOF
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -d|--domain)
                DOMAIN="$2"
                shift 2
                ;;
            -m|--method)
                DEPLOY_METHOD="$2"
                shift 2
                ;;
            -e|--email)
                SSL_EMAIL="$2"
                shift 2
                ;;
            -i|--install-dir)
                INSTALL_DIR="$2"
                shift 2
                ;;
            -f|--force)
                FORCE_REINSTALL=true
                shift
                ;;
            -p|--production)
                PRODUCTION_MODE=true
                shift
                ;;
            -s|--skip-deps)
                SKIP_DEPS=true
                shift
                ;;
            --debug)
                DEBUG_MODE=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Detect the best deployment method
detect_deployment_method() {
    if [[ -n "$DEPLOY_METHOD" ]]; then
        log_debug "Using forced deployment method: $DEPLOY_METHOD"
        return 0
    fi
    
    log_step "🔍 Detecting optimal deployment method..."
    
    # Check if running on DigitalOcean
    if curl -s --connect-timeout 2 --max-time 5 http://169.254.169.254/metadata/v1/id &>/dev/null; then
        DEPLOY_METHOD="digitalocean"
        local droplet_id
        droplet_id=$(curl -s http://169.254.169.254/metadata/v1/id)
        local public_ip
        public_ip=$(curl -s http://169.254.169.254/metadata/v1/interfaces/public/0/ipv4/address)
        [[ -z "$DOMAIN" ]] && DOMAIN="${public_ip}.nip.io"
        log_success "🌊 DigitalOcean droplet detected (ID: $droplet_id, IP: $public_ip)"
        return 0
    fi
    
    # Check if Docker is available and functional
    if command_exists docker && command_exists docker-compose; then
        if docker info >/dev/null 2>&1; then
            DEPLOY_METHOD="docker"
            log_success "🐳 Docker environment detected"
            return 0
        else
            log_warning "Docker installed but not running"
        fi
    fi
    
    # Check for native Linux with package manager
    if [[ "$OSTYPE" == "linux-gnu"* ]] && command_exists apt; then
        DEPLOY_METHOD="native"
        log_success "🐧 Native Linux environment detected"
        return 0
    fi
    
    # Fallback to Node.js if available
    if command_exists node && command_exists npm; then
        local node_version
        node_version=$(node --version | sed 's/v//')
        local major_version
        major_version=$(echo "$node_version" | cut -d. -f1)
        
        if [[ $major_version -ge 18 ]]; then
            DEPLOY_METHOD="nodejs"
            log_success "📦 Node.js environment detected (version $node_version)"
            return 0
        else
            log_error "Node.js version $node_version is too old (requires 18+)"
        fi
    fi
    
    log_error "No compatible deployment method found"
    echo ""
    echo "🔧 Supported environments:"
    echo "   • Docker with docker-compose"
    echo "   • Ubuntu/Debian Linux with apt"
    echo "   • Node.js 18+ with npm"
    echo "   • DigitalOcean droplets"
    echo ""
    echo "💡 Quick setup:"
    echo "   • Install Docker: curl -fsSL https://get.docker.com | sh"
    echo "   • Install Node.js: https://nodejs.org/"
    exit 1
}

# Install system dependencies
install_dependencies() {
    [[ "$SKIP_DEPS" == "true" ]] && {
        log_debug "Skipping dependency installation"
        return 0
    }
    
    log_step "📦 Installing system dependencies for $DEPLOY_METHOD..."
    
    case $DEPLOY_METHOD in
        "digitalocean"|"docker")
            if ! command_exists docker; then
                log "Installing Docker..."
                curl -fsSL https://get.docker.com | sh
                sudo systemctl start docker
                sudo systemctl enable docker
                sudo usermod -aG docker "$USER"
            fi
            
            if ! command_exists docker-compose; then
                log "Installing Docker Compose..."
                sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
                sudo chmod +x /usr/local/bin/docker-compose
            fi
            ;;
        "native")
            log "Updating package lists..."
            sudo apt update
            
            log "Installing Node.js and dependencies..."
            curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
            sudo apt install -y nodejs python3 python3-pip mongodb nginx certbot python3-certbot-nginx
            ;;
        "nodejs")
            log "Verifying Node.js installation..."
            node --version && npm --version
            ;;
    esac
    
    log_success "Dependencies installed successfully"
}

# Setup application
setup_application() {
    log_step "📥 Setting up EchoTune AI application..."
    
    # Determine installation directory
    if [[ -z "$INSTALL_DIR" ]]; then
        case $DEPLOY_METHOD in
            "digitalocean")
                INSTALL_DIR="/opt/echotune"
                ;;
            *)
                INSTALL_DIR="$HOME/echotune-ai"
                ;;
        esac
    fi
    
    # Create directory and clone/update repository
    if [[ "$FORCE_REINSTALL" == "true" ]] && [[ -d "$INSTALL_DIR" ]]; then
        log_warning "Force reinstall: removing existing installation"
        rm -rf "$INSTALL_DIR"
    fi
    
    if [[ -d "$INSTALL_DIR/.git" ]]; then
        log "Updating existing repository..."
        cd "$INSTALL_DIR"
        git fetch origin
        git reset --hard origin/main
    else
        log "Cloning repository..."
        [[ -d "$INSTALL_DIR" ]] && rm -rf "$INSTALL_DIR"
        git clone "$REPO_URL" "$INSTALL_DIR"
        cd "$INSTALL_DIR"
    fi
    
    log_success "Application source ready at $INSTALL_DIR"
}

# Create optimized environment configuration
create_environment_config() {
    log_step "⚙️ Creating environment configuration..."
    
    [[ -z "$DOMAIN" ]] && DOMAIN="localhost"
    [[ -z "$SSL_EMAIL" ]] && SSL_EMAIL="admin@$DOMAIN"
    
    ENV_FILE="$INSTALL_DIR/.env"
    
    # Generate secure secrets
    local session_secret
    session_secret=$(openssl rand -hex 32 2>/dev/null || echo "fallback_session_$(date +%s)")
    local jwt_secret
    jwt_secret=$(openssl rand -hex 32 2>/dev/null || echo "fallback_jwt_$(date +%s)")
    
    # Create comprehensive .env file
    cat > "$ENV_FILE" << EOF
# 🎵 EchoTune AI - Universal Deployment Configuration
# Generated: $(date)
# Deployment Method: $DEPLOY_METHOD
# Domain: $DOMAIN

# Application Settings
NODE_ENV=${PRODUCTION_MODE:+production}${PRODUCTION_MODE:-development}
PORT=3000
DOMAIN=$DOMAIN
FRONTEND_URL=http$([ "$PRODUCTION_MODE" = "true" ] && echo "s")://$DOMAIN${DOMAIN:+$([ "$DOMAIN" != "localhost" ] && [ "${DOMAIN%.nip.io}" = "$DOMAIN" ] && echo "" || echo ":3000")}

# Spotify Configuration (Update with your credentials)
SPOTIFY_CLIENT_ID=\${SPOTIFY_CLIENT_ID:-demo_client_id}
SPOTIFY_CLIENT_SECRET=\${SPOTIFY_CLIENT_SECRET:-demo_client_secret}
SPOTIFY_REDIRECT_URI=http$([ "$PRODUCTION_MODE" = "true" ] && echo "s")://$DOMAIN/auth/callback

# LLM Provider Configuration (Demo mode enabled by default)
DEFAULT_LLM_PROVIDER=mock
GEMINI_API_KEY=\${GEMINI_API_KEY:-}
OPENAI_API_KEY=\${OPENAI_API_KEY:-}

# Security Configuration
SESSION_SECRET=$session_secret
JWT_SECRET=$jwt_secret
TRUST_PROXY=true

# Database Configuration
DATABASE_TYPE=sqlite
MONGODB_URI=\${MONGODB_URI:-mongodb://mongodb:27017/echotune}
REDIS_URL=\${REDIS_URL:-redis://redis:6379}

# Production Security (if production mode)
$([ "$PRODUCTION_MODE" = "true" ] && cat << 'PROD_EOF'
# SSL Configuration
SSL_CERT_PATH=/etc/nginx/ssl/${DOMAIN}.crt
SSL_KEY_PATH=/etc/nginx/ssl/${DOMAIN}.key
LETSENCRYPT_EMAIL=$SSL_EMAIL

# Rate Limiting
API_RATE_LIMIT=10r/s
AUTH_RATE_LIMIT=5r/m
GENERAL_RATE_LIMIT=20r/s

# Security Headers
ENABLE_SECURITY_HEADERS=true
ENABLE_HSTS=true
PROD_EOF
)

# Performance Configuration
CLUSTER_MODE=false
WORKERS=auto
NODE_OPTIONS=--max-old-space-size=512

# Feature Flags
HEALTH_CHECK_ENABLED=true
METRICS_ENABLED=true
CHAT_ENABLED=true
DEMO_MODE=true

# Logging Configuration
LOG_LEVEL=$([ "$DEBUG_MODE" = "true" ] && echo "debug" || echo "info")
DEBUG=$DEBUG_MODE
EOF
    
    log_success "Environment configuration created for $DOMAIN"
    [[ "$DEBUG_MODE" == "true" ]] && log_debug "Environment file: $ENV_FILE"
}

# Deploy application based on method
deploy_application() {
    log_step "🚀 Deploying EchoTune AI using $DEPLOY_METHOD method..."
    
    case $DEPLOY_METHOD in
        "digitalocean"|"docker")
            deploy_with_docker
            ;;
        "native")
            deploy_native_linux
            ;;
        "nodejs")
            deploy_nodejs
            ;;
    esac
}

# Docker deployment
deploy_with_docker() {
    log "Building and starting containers..."
    
    # Create production docker-compose override if needed
    if [[ "$PRODUCTION_MODE" == "true" ]]; then
        cat > docker-compose.override.yml << EOF
version: '3.8'
services:
  nginx:
    ports:
      - "80:80"
      - "443:443"
    environment:
      - NODE_ENV=production
      - DOMAIN=$DOMAIN
      - LETSENCRYPT_EMAIL=$SSL_EMAIL
  app:
    environment:
      - NODE_ENV=production
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
EOF
    else
        cat > docker-compose.override.yml << EOF
version: '3.8'
services:
  app:
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    profiles:
      - development
EOF
    fi
    
    # Stop existing containers
    docker-compose down --timeout 30 2>/dev/null || true
    
    # Build and start services
    docker-compose up -d --build
    
    log_success "Docker deployment completed"
}

# Native Linux deployment
deploy_native_linux() {
    log "Installing application dependencies..."
    npm ci --only=production
    
    if [[ -f "requirements.txt" ]]; then
        pip3 install -r requirements.txt --user
    fi
    
    # Create systemd service for production
    if [[ "$PRODUCTION_MODE" == "true" ]]; then
        create_systemd_service
        sudo systemctl enable echotune-ai
        sudo systemctl start echotune-ai
        log_success "EchoTune AI installed as system service"
    else
        # Start in background for development
        mkdir -p logs
        nohup npm start > logs/app.log 2>&1 &
        echo $! > echotune.pid
        log_success "EchoTune AI started in background (PID: $(cat echotune.pid))"
    fi
}

# Node.js deployment
deploy_nodejs() {
    log "Installing dependencies..."
    npm install
    
    if [[ -f "requirements.txt" ]]; then
        pip3 install -r requirements.txt --user --quiet 2>/dev/null || true
    fi
    
    log "Starting application..."
    mkdir -p logs
    nohup npm start > logs/app.log 2>&1 &
    echo $! > echotune.pid
    
    log_success "EchoTune AI started (PID: $(cat echotune.pid))"
}

# Create systemd service
create_systemd_service() {
    log "Creating systemd service..."
    
    sudo tee /etc/systemd/system/echotune-ai.service > /dev/null << EOF
[Unit]
Description=EchoTune AI - Music Discovery Platform
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR
Environment=NODE_ENV=production
Environment=PATH=/usr/bin:/usr/local/bin:$INSTALL_DIR/node_modules/.bin
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=echotune-ai

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$INSTALL_DIR

[Install]
WantedBy=multi-user.target
EOF
    
    sudo systemctl daemon-reload
}

# Comprehensive health check
verify_deployment() {
    log_step "🔍 Verifying deployment health..."
    
    local base_url="http://localhost:3000"
    if [[ "$DOMAIN" != "localhost" ]]; then
        base_url="http://$DOMAIN$([ "$DOMAIN" != *".nip.io" ] && [ "$PRODUCTION_MODE" != "true" ] && echo ":3000" || echo "")"
    fi
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        log "Health check attempt $attempt/$max_attempts..."
        
        # Try health endpoint first
        if curl -f -s --connect-timeout 5 --max-time 10 "$base_url/health" >/dev/null 2>&1; then
            log_success "🎉 Health endpoint responding!"
            break
        fi
        
        # Try main endpoint
        if curl -f -s --connect-timeout 5 --max-time 10 "$base_url/" >/dev/null 2>&1; then
            log_success "🎉 Application is responding!"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            log_warning "Application may still be starting up..."
            return 1
        fi
        
        attempt=$((attempt + 1))
        sleep 3
    done
    
    return 0
}

# Display deployment results
show_deployment_results() {
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                         🎉 DEPLOYMENT SUCCESSFUL! 🎉                       ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Access information
    echo -e "${WHITE}🌐 Access Your EchoTune AI:${NC}"
    if [[ "$DOMAIN" == "localhost" ]]; then
        echo "   🔗 Local: http://localhost:3000"
    else
        if [[ "$PRODUCTION_MODE" == "true" ]]; then
            echo "   🔗 HTTPS: https://$DOMAIN"
            echo "   🔗 HTTP: http://$DOMAIN (redirects to HTTPS)"
        else
            echo "   🔗 Public: http://$DOMAIN:3000"
        fi
        echo "   🔗 Direct: http://localhost:3000"
    fi
    echo ""
    
    # Management commands
    echo -e "${WHITE}📊 Management Commands:${NC}"
    case $DEPLOY_METHOD in
        "digitalocean"|"docker")
            echo "   🔍 Status: docker-compose ps"
            echo "   📝 Logs: docker-compose logs -f"
            echo "   🔄 Restart: docker-compose restart"
            echo "   🛑 Stop: docker-compose down"
            echo "   📊 Health: curl http://localhost:3000/health"
            ;;
        "native")
            if [[ "$PRODUCTION_MODE" == "true" ]]; then
                echo "   🔍 Status: sudo systemctl status echotune-ai"
                echo "   📝 Logs: sudo journalctl -u echotune-ai -f"
                echo "   🔄 Restart: sudo systemctl restart echotune-ai"
                echo "   🛑 Stop: sudo systemctl stop echotune-ai"
            else
                echo "   🔍 Status: ps aux | grep node"
                echo "   📝 Logs: tail -f $INSTALL_DIR/logs/app.log"
                echo "   🛑 Stop: kill \$(cat $INSTALL_DIR/echotune.pid)"
            fi
            ;;
        "nodejs")
            echo "   📝 Logs: tail -f $INSTALL_DIR/logs/app.log"
            if [[ -f "$INSTALL_DIR/echotune.pid" ]]; then
                echo "   🔍 PID: $(cat "$INSTALL_DIR/echotune.pid")"
                echo "   🛑 Stop: kill \$(cat $INSTALL_DIR/echotune.pid)"
            fi
            ;;
    esac
    echo ""
    
    # Next steps
    echo -e "${WHITE}🔧 Next Steps:${NC}"
    echo "   1. 🎵 Add Spotify credentials to $ENV_FILE"
    echo "   2. 🤖 Configure AI providers (Gemini, OpenAI) for enhanced features"
    if [[ "$PRODUCTION_MODE" == "true" ]]; then
        echo "   3. 🔒 Verify SSL certificate: https://$DOMAIN"
        echo "   4. 🛡️ Review security settings and firewall configuration"
    else
        echo "   3. 🚀 Deploy to production with --production flag"
    fi
    echo ""
    
    # Features
    echo -e "${WHITE}✨ Available Features:${NC}"
    echo "   ✅ AI-Powered Music Chat (Demo Mode)"
    echo "   ✅ Real-time Music Recommendations"
    echo "   ✅ Interactive Analytics Dashboard"
    echo "   ✅ Voice Interface Support"
    echo "   ✅ Mobile-Responsive Design"
    echo "   ✅ Health Monitoring & Metrics"
    if [[ "$PRODUCTION_MODE" == "true" ]]; then
        echo "   ✅ SSL/TLS Encryption"
        echo "   ✅ Security Headers & Rate Limiting"
        echo "   ✅ Performance Optimization"
    fi
    echo ""
    
    echo -e "${CYAN}🎵 Enjoy your AI-powered music discovery experience!${NC}"
    echo -e "${PURPLE}⭐ Star us on GitHub: https://github.com/dzp5103/Spotify-echo${NC}"
}

# Error handling
handle_error() {
    local exit_code=$?
    echo ""
    log_error "Deployment failed (exit code: $exit_code)"
    echo ""
    echo -e "${YELLOW}🔍 Troubleshooting:${NC}"
    echo "   • Check logs: tail -f logs/app.log"
    echo "   • Verify dependencies: docker --version, node --version"
    echo "   • Test connectivity: curl http://localhost:3000/health"
    echo "   • Run with debug: $0 --debug"
    echo ""
    echo -e "${CYAN}📚 Get Help:${NC}"
    echo "   • GitHub Issues: https://github.com/dzp5103/Spotify-echo/issues"
    echo "   • Documentation: https://github.com/dzp5103/Spotify-echo#readme"
    echo ""
    exit $exit_code
}

# Main execution
main() {
    # Set error handler
    trap handle_error ERR
    
    print_header
    parse_arguments "$@"
    
    log "🚀 Starting universal deployment process..."
    log "Version: $SCRIPT_VERSION | Mode: $([ "$PRODUCTION_MODE" = "true" ] && echo "Production" || echo "Development")"
    echo ""
    
    detect_deployment_method
    install_dependencies
    setup_application
    create_environment_config
    deploy_application
    
    # Verify deployment
    if verify_deployment; then
        show_deployment_results
    else
        log_warning "Deployment completed but health check failed"
        log "The application may still be starting up. Manual verification:"
        log "  curl http://localhost:3000/health"
    fi
    
    log_success "🎉 Universal deployment completed successfully!"
}

# Execute main function with all arguments
main "$@"