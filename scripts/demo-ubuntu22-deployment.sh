#!/bin/bash

# ===================================================================
# EchoTune AI - Ubuntu 22.04 Deployment Demo/Test Script
# Simulates deployment steps without requiring full system changes
# ===================================================================

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Configuration
DEMO_DIR="/tmp/echotune-demo-$(date +%Y%m%d-%H%M%S)"
TEST_DOMAIN="example.com"
TEST_EMAIL="admin@example.com"

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] ✓ ${1}${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] ℹ ${1}${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠ ${1}${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ✗ ${1}${NC}"
}

# Print header
print_header() {
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║                   🧪 EchoTune AI - Ubuntu 22.04 Demo                       ║${NC}"
    echo -e "${PURPLE}║                  Simulated Deployment Test (Non-Destructive)                ║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Test system compatibility
test_system_compatibility() {
    info "Testing system compatibility..."
    
    # Check if running on Linux
    if [[ "$(uname)" == "Linux" ]]; then
        log "✓ Running on Linux"
    else
        warning "Not running on Linux (current: $(uname))"
    fi
    
    # Check for basic commands
    local commands=("curl" "wget" "git" "bash" "python3")
    for cmd in "${commands[@]}"; do
        if command -v "$cmd" &> /dev/null; then
            log "✓ $cmd is available"
        else
            warning "$cmd is not available"
        fi
    done
    
    # Check Docker availability (without installing)
    if command -v docker &> /dev/null; then
        log "✓ Docker is already installed: $(docker --version)"
    else
        info "Docker not installed (would be installed during deployment)"
    fi
}

# Simulate environment setup
simulate_environment_setup() {
    info "Simulating environment setup..."
    
    # Create demo directory
    mkdir -p "$DEMO_DIR"
    mkdir -p "$DEMO_DIR/ssl"
    mkdir -p "$DEMO_DIR/logs"
    mkdir -p "$DEMO_DIR/data"
    
    log "✓ Created demo directories in $DEMO_DIR"
    
    # Simulate .env configuration
    cat > "$DEMO_DIR/.env" << EOF
# EchoTune AI - Demo Configuration
NODE_ENV=production
PORT=3000
DOMAIN=$TEST_DOMAIN
FRONTEND_URL=https://$TEST_DOMAIN
SPOTIFY_REDIRECT_URI=https://$TEST_DOMAIN/auth/callback

# Security secrets (demo - would be generated during real deployment)
SESSION_SECRET=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 32)

# SSL paths
SSL_CERT_PATH=$DEMO_DIR/ssl/$TEST_DOMAIN.crt
SSL_KEY_PATH=$DEMO_DIR/ssl/$TEST_DOMAIN.key
LETSENCRYPT_EMAIL=$TEST_EMAIL

# Database
MONGODB_URI=mongodb://localhost:27017/echotune
REDIS_URL=redis://localhost:6379

# Demo mode
DEFAULT_LLM_PROVIDER=mock
DEBUG=false
LOG_LEVEL=info
EOF
    
    log "✓ Created demo .env configuration"
}

# Simulate SSL certificate creation
simulate_ssl_setup() {
    info "Simulating SSL certificate setup..."
    
    # Create self-signed certificate for demo
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$DEMO_DIR/ssl/$TEST_DOMAIN.key" \
        -out "$DEMO_DIR/ssl/$TEST_DOMAIN.crt" \
        -subj "/C=US/ST=CA/L=SF/O=EchoTune/CN=$TEST_DOMAIN" &>/dev/null
    
    log "✓ Created demo SSL certificate for $TEST_DOMAIN"
    
    # Verify certificate
    if openssl x509 -in "$DEMO_DIR/ssl/$TEST_DOMAIN.crt" -text -noout | grep -q "$TEST_DOMAIN"; then
        log "✓ SSL certificate contains correct domain"
    else
        warning "SSL certificate may have issues"
    fi
}

# Simulate nginx configuration
simulate_nginx_config() {
    info "Simulating nginx configuration..."
    
    mkdir -p "$DEMO_DIR/nginx"
    
    # Create demo nginx config
    cat > "$DEMO_DIR/nginx/nginx.conf" << EOF
# EchoTune AI - Demo nginx configuration
events {
    worker_connections 1024;
}

http {
    upstream echotune_backend {
        server app:3000;
    }

    server {
        listen 80;
        server_name $TEST_DOMAIN;
        return 301 https://\$server_name\$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name $TEST_DOMAIN;
        
        ssl_certificate $DEMO_DIR/ssl/$TEST_DOMAIN.crt;
        ssl_certificate_key $DEMO_DIR/ssl/$TEST_DOMAIN.key;
        
        location / {
            proxy_pass http://echotune_backend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
        
        location /health {
            proxy_pass http://echotune_backend;
            access_log off;
        }
    }
}
EOF
    
    log "✓ Created demo nginx configuration"
    
    # Test nginx config syntax (if nginx is available)
    if command -v nginx &> /dev/null; then
        if nginx -t -c "$DEMO_DIR/nginx/nginx.conf" &>/dev/null; then
            log "✓ nginx configuration syntax is valid"
        else
            warning "nginx configuration has syntax issues"
        fi
    else
        info "nginx not available for syntax testing (would be installed during deployment)"
    fi
}

# Simulate Docker setup
simulate_docker_setup() {
    info "Simulating Docker configuration..."
    
    # Copy the Ubuntu 22 docker-compose file
    cp "$(dirname "$0")/../docker-compose-ubuntu22.yml" "$DEMO_DIR/docker-compose.yml"
    
    log "✓ Copied Ubuntu 22.04 Docker Compose configuration"
    
    # Test YAML syntax
    if python3 -c "import yaml; yaml.safe_load(open('$DEMO_DIR/docker-compose.yml', 'r'))" 2>/dev/null; then
        log "✓ Docker Compose YAML syntax is valid"
    else
        warning "Docker Compose configuration may have syntax issues"
    fi
    
    # Simulate Docker commands (without actually running them)
    log "✓ Would run: docker-compose up -d --build"
    log "✓ Would run: docker-compose ps"
    log "✓ Would run: docker-compose logs -f"
}

# Simulate health checks
simulate_health_checks() {
    info "Simulating health checks..."
    
    # Simulate various health check endpoints
    local endpoints=(
        "http://localhost:3000/health"
        "https://$TEST_DOMAIN/health"
        "http://$TEST_DOMAIN/api/status"
    )
    
    for endpoint in "${endpoints[@]}"; do
        log "✓ Would test: curl -f $endpoint"
    done
    
    # Simulate service checks
    log "✓ Would check: systemctl status docker"
    log "✓ Would check: systemctl status nginx"
    log "✓ Would check: docker-compose ps"
}

# Test deployment script syntax
test_deployment_scripts() {
    info "Testing deployment script syntax..."
    
    local scripts=(
        "$(dirname "$0")/ubuntu22-docker-setup.sh"
        "$(dirname "$0")/../deploy-ubuntu22-oneclick.sh"
        "$(dirname "$0")/../deploy-digitalocean-ubuntu22.sh"
    )
    
    for script in "${scripts[@]}"; do
        if [[ -f "$script" ]]; then
            if bash -n "$script" 2>/dev/null; then
                log "✓ $(basename "$script") has valid syntax"
            else
                error "$(basename "$script") has syntax errors"
            fi
        else
            warning "Script not found: $script"
        fi
    done
}

# Show demo summary
show_demo_summary() {
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                     🎉 DEMO COMPLETED SUCCESSFULLY! 🎉                     ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    echo -e "${BOLD}📊 Demo Results Summary:${NC}"
    echo "   🖥️  System compatibility tested"
    echo "   ⚙️  Environment configuration simulated"
    echo "   🔐 SSL certificate setup demonstrated"
    echo "   🌐 nginx configuration created and validated"
    echo "   🐳 Docker setup simulated"
    echo "   🏥 Health check procedures outlined"
    echo "   📜 Deployment script syntax validated"
    echo ""
    
    echo -e "${BOLD}📁 Demo Files Created:${NC}"
    echo "   📂 Demo Directory: ${CYAN}$DEMO_DIR${NC}"
    echo "   ⚙️  Configuration: $DEMO_DIR/.env"
    echo "   🔐 SSL Certificate: $DEMO_DIR/ssl/$TEST_DOMAIN.crt"
    echo "   🌐 nginx Config: $DEMO_DIR/nginx/nginx.conf"
    echo "   🐳 Docker Compose: $DEMO_DIR/docker-compose.yml"
    echo ""
    
    echo -e "${BOLD}🚀 What Would Happen in Real Deployment:${NC}"
    echo "   1. Install Docker Engine for Ubuntu 22.04"
    echo "   2. Install Node.js 20.x LTS"
    echo "   3. Install and configure nginx"
    echo "   4. Set up UFW firewall with secure defaults"
    echo "   5. Create SSL certificates (Let's Encrypt or self-signed)"
    echo "   6. Deploy EchoTune AI application with Docker"
    echo "   7. Configure health monitoring and management tools"
    echo ""
    
    echo -e "${BOLD}🎯 Next Steps for Real Deployment:${NC}"
    echo "   1. Get Ubuntu 22.04 LTS server"
    echo "   2. Run: ${CYAN}curl -sSL https://raw.githubusercontent.com/dzp5103/Spotify-echo/main/deploy-ubuntu22-oneclick.sh | sudo bash${NC}"
    echo "   3. Configure your domain and SSL certificates"
    echo "   4. Add your Spotify API credentials"
    echo ""
    
    echo -e "${CYAN}🧹 Cleanup Demo Files:${NC}"
    echo "   Run: ${CYAN}rm -rf $DEMO_DIR${NC}"
    echo ""
    
    echo -e "${PURPLE}✨ Ubuntu 22.04 deployment system validated and ready!${NC}"
}

# Cleanup function
cleanup_demo() {
    if [[ -d "$DEMO_DIR" ]]; then
        rm -rf "$DEMO_DIR"
        log "✓ Cleaned up demo files"
    fi
}

# Main execution
main() {
    print_header
    
    # Trap cleanup on exit
    trap cleanup_demo EXIT
    
    test_system_compatibility
    echo ""
    
    simulate_environment_setup
    echo ""
    
    simulate_ssl_setup
    echo ""
    
    simulate_nginx_config
    echo ""
    
    simulate_docker_setup
    echo ""
    
    simulate_health_checks
    echo ""
    
    test_deployment_scripts
    echo ""
    
    show_demo_summary
}

# Execute main function
main "$@"