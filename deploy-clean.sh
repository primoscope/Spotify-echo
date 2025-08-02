#!/bin/bash

# 🎵 EchoTune AI - Clean Deployment Manager
# Ultra-simplified deployment with automatic environment detection and best practices

# Color codes for beautiful output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

# Configuration
VERSION="1.0.0"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Header
print_header() {
    clear
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║                   🎵 EchoTune AI - Clean Deploy                 ║${NC}"
    echo -e "${PURPLE}║                 Simplified One-Command Deployment               ║${NC}"
    echo -e "${PURPLE}║                        Version ${VERSION}                           ║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Logging functions
log_info() { echo -e "${BLUE}ℹ${NC}  $1"; }
log_success() { echo -e "${GREEN}✅${NC} $1"; }
log_warning() { echo -e "${YELLOW}⚠${NC}  $1"; }
log_error() { echo -e "${RED}❌${NC} $1"; }
log_step() { echo -e "${CYAN}▶${NC}  $1"; }

# Check prerequisites
check_prerequisites() {
    log_step "Checking prerequisites..."
    
    local missing_deps=()
    
    # Check for required commands
    if ! command -v git >/dev/null 2>&1; then
        missing_deps+=("git")
    fi
    
    if ! command -v node >/dev/null 2>&1; then
        missing_deps+=("node.js")
    fi
    
    if ! command -v npm >/dev/null 2>&1; then
        missing_deps+=("npm")
    fi
    
    if [ ${#missing_deps[@]} -eq 0 ]; then
        log_success "All prerequisites are installed"
        return 0
    else
        log_error "Missing dependencies: ${missing_deps[*]}"
        echo ""
        echo -e "${YELLOW}Quick Install Commands:${NC}"
        
        if [[ "$OSTYPE" == "darwin"* ]]; then
            echo "  brew install git node"
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            if command -v apt >/dev/null 2>&1; then
                echo "  sudo apt update && sudo apt install -y git nodejs npm"
            elif command -v yum >/dev/null 2>&1; then
                echo "  sudo yum install -y git nodejs npm"
            else
                echo "  Please install: git, nodejs, npm using your package manager"
            fi
        fi
        
        echo ""
        return 1
    fi
}

# Detect deployment environment
detect_environment() {
    log_step "Detecting optimal deployment environment..."
    
    # Check for cloud environments
    if [ -n "${DIGITALOCEAN_APP_NAME:-}" ] || [ -n "${DO_APP_NAME:-}" ]; then
        echo "digitalocean"
    elif [ -n "${AWS_REGION:-}" ] || [ -n "${AWS_DEFAULT_REGION:-}" ]; then
        echo "aws"
    elif [ -n "${GOOGLE_CLOUD_PROJECT:-}" ] || [ -n "${GCP_PROJECT:-}" ]; then
        echo "gcp"
    elif command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
        echo "docker"
    elif [ -f "/etc/systemd/system" ] && command -v systemctl >/dev/null 2>&1; then
        echo "systemd"
    else
        echo "local"
    fi
}

# Environment setup wizard
setup_environment() {
    log_step "Setting up environment configuration..."
    
    local env_file=".env"
    
    # Check if .env already exists
    if [ -f "$env_file" ]; then
        log_info "Found existing .env file"
        read -p "Would you like to update it? (y/N): " update_env
        if [[ ! "$update_env" =~ ^[Yy]$ ]]; then
            log_success "Using existing environment configuration"
            return 0
        fi
    fi
    
    # Copy from example if available
    if [ -f ".env.example" ]; then
        cp .env.example "$env_file"
        log_success "Created .env from template"
    else
        # Create basic .env
        cat > "$env_file" << EOF
# EchoTune AI Configuration
NODE_ENV=production
PORT=3000

# Spotify Integration (Required for full functionality)
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REDIRECT_URI=http://localhost:3000/callback

# AI Providers (Optional but recommended)
OPENAI_API_KEY=
GEMINI_API_KEY=
LLM_PROVIDER=openai

# Database (MongoDB or Supabase)
MONGODB_URI=
SUPABASE_URL=
SUPABASE_ANON_KEY=

# MCP Configuration
MCP_SERVER_PORT=3001
EOF
        log_success "Created basic .env configuration"
    fi
    
    # Interactive configuration
    echo ""
    log_info "Let's configure your deployment:"
    echo ""
    
    # Spotify configuration
    echo -e "${YELLOW}🎵 Spotify Integration:${NC}"
    echo "Visit: https://developer.spotify.com/dashboard/applications"
    echo "Create an app and get your Client ID and Secret"
    echo ""
    read -p "Spotify Client ID (optional): " spotify_id
    if [ -n "$spotify_id" ]; then
        sed -i.bak "s/SPOTIFY_CLIENT_ID=.*/SPOTIFY_CLIENT_ID=$spotify_id/" "$env_file"
        read -p "Spotify Client Secret: " spotify_secret
        sed -i.bak "s/SPOTIFY_CLIENT_SECRET=.*/SPOTIFY_CLIENT_SECRET=$spotify_secret/" "$env_file"
        log_success "Spotify configuration saved"
    else
        log_warning "Spotify integration skipped (demo mode will be used)"
    fi
    
    echo ""
    log_success "Environment setup complete!"
}

# Deploy based on environment
deploy_application() {
    local env_type="$1"
    
    log_step "Deploying EchoTune AI using $env_type method..."
    
    case "$env_type" in
        "digitalocean")
            if [ -f "scripts/deploy-digitalocean.sh" ]; then
                log_info "Using DigitalOcean deployment script"
                bash scripts/deploy-digitalocean.sh
            else
                log_error "DigitalOcean deployment script not found"
                return 1
            fi
            ;;
        "docker")
            log_info "Using Docker deployment"
            if [ -f "docker-compose.yml" ]; then
                docker-compose up -d
                log_success "Docker deployment started"
            else
                docker run -d -p 3000:3000 --env-file .env --name echotune-ai node:20-alpine sh -c "
                    git clone https://github.com/dzp5103/Spotify-echo.git /app &&
                    cd /app &&
                    npm install &&
                    npm start
                "
                log_success "Docker container started"
            fi
            ;;
        "systemd")
            log_info "Using systemd service deployment"
            if [ -f "scripts/deploy.sh" ]; then
                bash scripts/deploy.sh
            else
                log_error "Production deployment script not found"
                return 1
            fi
            ;;
        "local")
            log_info "Using local development deployment"
            
            # Install dependencies
            log_step "Installing dependencies..."
            if npm install; then
                log_success "Dependencies installed"
            else
                log_error "Failed to install dependencies"
                return 1
            fi
            
            # Start application
            log_step "Starting EchoTune AI..."
            echo ""
            echo -e "${GREEN}🚀 Starting EchoTune AI...${NC}"
            echo -e "${CYAN}   Access your app at: http://localhost:3000${NC}"
            echo -e "${CYAN}   Press Ctrl+C to stop${NC}"
            echo ""
            
            npm start
            ;;
        *)
            log_error "Unknown deployment environment: $env_type"
            return 1
            ;;
    esac
}

# Health check
check_deployment_health() {
    log_step "Verifying deployment health..."
    
    local max_attempts=10
    local attempt=1
    local health_url="http://localhost:3000/health"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -sf "$health_url" >/dev/null 2>&1; then
            log_success "Application is healthy and responding"
            return 0
        fi
        
        log_info "Health check attempt $attempt/$max_attempts..."
        sleep 3
        ((attempt++))
    done
    
    log_warning "Health check failed, but application might still be starting"
    log_info "Try accessing: http://localhost:3000"
    return 1
}

# Post-deployment instructions
show_success_message() {
    local env_type="$1"
    
    echo ""
    echo -e "${GREEN}🎉 EchoTune AI Deployment Complete!${NC}"
    echo ""
    echo -e "${CYAN}📍 Access Points:${NC}"
    echo "   🌐 Web App: http://localhost:3000"
    echo "   🔧 Health Check: http://localhost:3000/health"
    echo "   📊 API Status: http://localhost:3000/api/status"
    echo ""
    echo -e "${CYAN}🚀 Quick Commands:${NC}"
    echo "   npm start              # Start the application"
    echo "   npm run health-check   # Check application health"
    echo "   npm run mcp-server     # Start MCP automation server"
    echo ""
    echo -e "${CYAN}📚 Next Steps:${NC}"
    echo "   1. Configure your Spotify app credentials in .env"
    echo "   2. Add AI provider API keys for enhanced features"
    echo "   3. Visit the app and start discovering music!"
    echo ""
    echo -e "${YELLOW}💡 Need help?${NC} Check README.md or visit GitHub issues"
    echo ""
}

# Main deployment flow
main() {
    print_header
    
    # Step 1: Prerequisites
    if ! check_prerequisites; then
        log_error "Please install missing prerequisites and try again"
        exit 1
    fi
    
    # Step 2: Environment Detection
    local env_type
    env_type=$(detect_environment)
    log_success "Detected environment: $env_type"
    
    # Step 3: Environment Setup
    setup_environment
    
    # Step 4: Deploy
    echo ""
    log_step "Starting deployment..."
    if deploy_application "$env_type"; then
        # Step 5: Health Check (for non-local deployments)
        if [ "$env_type" != "local" ]; then
            sleep 5  # Give the app time to start
            check_deployment_health
        fi
        
        # Step 6: Success
        show_success_message "$env_type"
    else
        log_error "Deployment failed"
        exit 1
    fi
}

# Handle command line arguments
case "${1:-}" in
    "--help"|"-h")
        print_header
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --version, -v  Show version information"
        echo "  --local        Force local deployment"
        echo "  --docker       Force Docker deployment"
        echo "  --check        Check prerequisites only"
        echo ""
        echo "Examples:"
        echo "  $0                # Auto-detect and deploy"
        echo "  $0 --local       # Force local development deployment"
        echo "  $0 --docker      # Force Docker deployment"
        echo "  $0 --check       # Check prerequisites only"
        echo ""
        exit 0
        ;;
    "--version"|"-v")
        echo "EchoTune AI Clean Deploy v$VERSION"
        exit 0
        ;;
    "--check")
        check_prerequisites
        exit $?
        ;;
    "--local")
        print_header
        setup_environment
        deploy_application "local"
        ;;
    "--docker")
        print_header
        check_prerequisites
        setup_environment
        deploy_application "docker"
        ;;
    "")
        main
        ;;
    *)
        echo "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac