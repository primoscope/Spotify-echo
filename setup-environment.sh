#!/bin/bash

# ===================================================================
# EchoTune AI - Quick Environment Setup Script
# Prepares environment variables for production deployment
# ===================================================================

set -euo pipefail

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
ENV_FILE=".env"
ENV_TEMPLATE=".env.production"
DOMAIN="primosphere.studio"

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ❌ $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] ℹ️  $1${NC}"
}

# Generate random secret
generate_secret() {
    local length=${1:-64}
    openssl rand -base64 "$length" | tr -d "=+/" | cut -c1-"$length" 2>/dev/null || \
    head -c "$length" /dev/urandom | base64 | tr -d "=+/" | cut -c1-"$length" || \
    date +%s | sha256sum | base64 | head -c "$length"
}

# Prompt for user input with default
prompt_with_default() {
    local prompt="$1"
    local default="$2"
    local variable="$3"
    local is_secret="${4:-false}"
    
    if [[ "$is_secret" == "true" ]]; then
        echo -n "$prompt [$default]: "
        read -s user_input
        echo  # New line after secret input
    else
        echo -n "$prompt [$default]: "
        read user_input
    fi
    
    if [[ -z "$user_input" ]]; then
        eval "$variable=\"$default\""
    else
        eval "$variable=\"$user_input\""
    fi
}

# Setup environment variables
setup_environment() {
    log "Setting up EchoTune AI environment for production deployment"
    log "Domain: $DOMAIN"
    
    echo -e "\n${BLUE}🔐 Security Configuration${NC}"
    warning "Generate strong, unique secrets for production!"
    
    # Generate secure secrets
    local session_secret
    local jwt_secret
    session_secret=$(generate_secret 64)
    jwt_secret=$(generate_secret 64)
    
    echo "Generated secure SESSION_SECRET (64 chars)"
    echo "Generated secure JWT_SECRET (64 chars)"
    
    echo -e "\n${BLUE}🎵 Spotify API Configuration${NC}"
    info "Get your Spotify credentials from: https://developer.spotify.com/"
    
    local spotify_client_id=""
    local spotify_client_secret=""
    
    prompt_with_default "Spotify Client ID" "your_spotify_client_id_here" "spotify_client_id"
    prompt_with_default "Spotify Client Secret" "your_spotify_client_secret_here" "spotify_client_secret" "true"
    
    echo -e "\n${BLUE}💾 Database Configuration${NC}"
    info "Choose your database setup:"
    echo "1. MongoDB Atlas (Recommended)"
    echo "2. DigitalOcean Managed Database"
    echo "3. Self-hosted (Docker containers)"
    
    local db_choice=""
    prompt_with_default "Database choice (1-3)" "1" "db_choice"
    
    local mongodb_uri=""
    local redis_url=""
    local redis_password=""
    
    case $db_choice in
        1)
            info "MongoDB Atlas setup"
            prompt_with_default "MongoDB Atlas URI" "mongodb+srv://username:password@cluster.mongodb.net/echotune_prod" "mongodb_uri"
            prompt_with_default "Redis URL (optional)" "redis://username:password@redis-cluster.ondigitalocean.com:25061" "redis_url"
            ;;
        2)
            info "DigitalOcean Managed Database setup"
            prompt_with_default "DigitalOcean MongoDB URI" "mongodb://username:password@db-mongodb-cluster-do-user-123456-0.db.ondigitalocean.com:27017/echotune_prod?authSource=admin&tls=true" "mongodb_uri"
            prompt_with_default "DigitalOcean Redis URL" "redis://username:password@db-redis-cluster-do-user-123456-0.db.ondigitalocean.com:25061" "redis_url"
            ;;
        3)
            info "Self-hosted setup (using Docker containers)"
            mongodb_uri="mongodb://admin:\${MONGODB_ROOT_PASSWORD}@mongodb:27017/echotune"
            redis_url="redis://:\${REDIS_PASSWORD}@redis:6379"
            
            redis_password=$(generate_secret 32)
            echo "Generated Redis password"
            ;;
    esac
    
    echo -e "\n${BLUE}🤖 AI Provider Configuration${NC}"
    info "Configure at least one AI provider for chat functionality"
    
    local gemini_api_key=""
    local openai_api_key=""
    local default_provider=""
    
    prompt_with_default "Gemini API Key (recommended)" "your_gemini_api_key_here" "gemini_api_key" "true"
    prompt_with_default "OpenAI API Key (optional)" "your_openai_api_key_here" "openai_api_key" "true"
    
    if [[ "$gemini_api_key" != "your_gemini_api_key_here" ]]; then
        default_provider="gemini"
    elif [[ "$openai_api_key" != "your_openai_api_key_here" ]]; then
        default_provider="openai"
    else
        default_provider="mock"
        warning "No AI providers configured, using mock provider"
    fi
    
    echo -e "\n${BLUE}📧 SSL and Email Configuration${NC}"
    local letsencrypt_email=""
    prompt_with_default "Let's Encrypt Email" "admin@$DOMAIN" "letsencrypt_email"
    
    # Create production environment file
    log "Creating production environment file..."
    
    cat > "$ENV_FILE" << EOF
# EchoTune AI - Production Environment Configuration
# Generated on $(date)
# Domain: $DOMAIN

###############################################################################
# PRODUCTION SERVER CONFIGURATION
###############################################################################
NODE_ENV=production
PORT=3000
DOMAIN=$DOMAIN
FRONTEND_URL=https://$DOMAIN
SERVER_URL=https://$DOMAIN

# DigitalOcean Server Configuration
DIGITALOCEAN_IP_PRIMARY=159.223.207.187
DIGITALOCEAN_IP_RESERVED=209.38.5.39
SERVER_REGION=nyc1

###############################################################################
# SECURITY SETTINGS
###############################################################################
SESSION_SECRET=$session_secret
JWT_SECRET=$jwt_secret

###############################################################################
# SPOTIFY API CONFIGURATION
###############################################################################
SPOTIFY_CLIENT_ID=$spotify_client_id
SPOTIFY_CLIENT_SECRET=$spotify_client_secret
SPOTIFY_REDIRECT_URI=https://$DOMAIN/auth/callback

###############################################################################
# DATABASE CONFIGURATION
###############################################################################
MONGODB_URI=$mongodb_uri
MONGODB_DATABASE=echotune_production

# Redis Configuration
REDIS_URL=$redis_url
$(if [[ -n "$redis_password" ]]; then echo "REDIS_PASSWORD=$redis_password"; fi)

# MongoDB Container Settings (if using self-hosted)
$(if [[ "$db_choice" == "3" ]]; then cat << 'DBEOF'
MONGODB_ROOT_USER=admin
MONGODB_ROOT_PASSWORD=$(generate_secret 32)
MONGODB_DATABASE=echotune
DBEOF
fi)

###############################################################################
# SSL AND CERTIFICATES CONFIGURATION
###############################################################################
SSL_CERT_PATH=/etc/nginx/ssl/$DOMAIN.crt
SSL_KEY_PATH=/etc/nginx/ssl/$DOMAIN.key
LETSENCRYPT_EMAIL=$letsencrypt_email

###############################################################################
# NGINX CONFIGURATION
###############################################################################
MAX_REQUEST_SIZE=10m
API_RATE_LIMIT=50r/s
AUTH_RATE_LIMIT=10r/m
GENERAL_RATE_LIMIT=100r/s
NGINX_WORKER_PROCESSES=auto
NGINX_WORKER_CONNECTIONS=1024

###############################################################################
# PERFORMANCE AND OPTIMIZATION
###############################################################################
NODE_OPTIONS=--max-old-space-size=1024
UV_THREADPOOL_SIZE=8
CLUSTERING=true
WORKERS=auto

# Caching Configuration
CACHE_ENABLED=true
CACHE_TTL=3600
SPOTIFY_API_CACHE_TTL=300
REDIS_CACHE_TTL=1800

###############################################################################
# LOGGING AND MONITORING
###############################################################################
LOG_LEVEL=info
LOG_FILE=/opt/echotune/logs/app.log
ACCESS_LOG_FILE=/opt/echotune/logs/access.log
ERROR_LOG_FILE=/opt/echotune/logs/error.log

HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_INTERVAL=30
HEALTH_CHECK_TIMEOUT=10

###############################################################################
# CORS CONFIGURATION
###############################################################################
ENABLE_CORS=true
CORS_ORIGINS=https://$DOMAIN,https://www.$DOMAIN

###############################################################################
# SECURITY HEADERS AND POLICIES
###############################################################################
TRUST_PROXY=true
PROXY_TIMEOUT=30000
CSP_ENABLED=true
CSP_REPORT_ONLY=false
HELMET_ENABLED=true
HSTS_MAX_AGE=31536000
FRAME_OPTIONS=DENY
CONTENT_TYPE_OPTIONS=nosniff

###############################################################################
# AI / LLM PROVIDER CONFIGURATION
###############################################################################
DEFAULT_LLM_PROVIDER=$default_provider
DEFAULT_LLM_MODEL=gemini-1.5-flash

# API Keys
GEMINI_API_KEY=$gemini_api_key
OPENAI_API_KEY=$openai_api_key

###############################################################################
# FEATURE FLAGS
###############################################################################
ENABLE_RECOMMENDATIONS=true
ENABLE_PLAYLIST_CREATION=true
ENABLE_USER_ANALYTICS=true
ENABLE_CHAT_HISTORY=true
ENABLE_AI_FEATURES=true
ENABLE_MCP_SERVERS=true

###############################################################################
# DEPLOYMENT CONFIGURATION
###############################################################################
DEPLOYMENT_TARGET=digitalocean
DEPLOYMENT_TYPE=docker
DOCKER_REGISTRY=registry.digitalocean.com/echotune
IMAGE_TAG=production-latest

ENVIRONMENT=production
PRODUCTION_MODE=true
DEBUG=false
VERBOSE_LOGGING=false

###############################################################################
# BACKUP CONFIGURATION
###############################################################################
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
BACKUP_COMPRESSION=true
BACKUP_LOCATION=/opt/echotune/backups
EOF

    log "✅ Environment configuration saved to $ENV_FILE"
    
    # Set secure permissions
    chmod 600 "$ENV_FILE"
    
    echo -e "\n${BLUE}📋 Configuration Summary${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Domain: $DOMAIN"
    echo "Database: $(case $db_choice in 1) echo "MongoDB Atlas";; 2) echo "DigitalOcean Managed";; 3) echo "Self-hosted Docker";; esac)"
    echo "AI Provider: $default_provider"
    echo "SSL Email: $letsencrypt_email"
    echo "Environment File: $ENV_FILE"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    echo -e "\n${BLUE}🚀 Next Steps${NC}"
    echo "1. Review and customize $ENV_FILE if needed"
    echo "2. Run deployment: sudo ./deploy-digitalocean-production.sh"
    echo "3. Test deployment: ./test-deployment.sh"
    echo "4. Configure DNS to point $DOMAIN to 159.223.207.187"
    
    echo -e "\n${YELLOW}⚠️  Important Security Notes${NC}"
    echo "• Keep $ENV_FILE secure and never commit it to version control"
    echo "• Generated secrets are cryptographically secure for production use"
    echo "• Update Spotify API credentials before deployment"
    echo "• Configure database credentials for external services"
    
    if [[ "$spotify_client_id" == "your_spotify_client_id_here" ]]; then
        echo -e "\n${RED}❌ Action Required: Configure Spotify API credentials before deployment!${NC}"
    fi
    
    if [[ "$default_provider" == "mock" ]]; then
        echo -e "\n${RED}❌ Action Required: Configure at least one AI provider for full functionality!${NC}"
    fi
}

# Validate existing environment
validate_environment() {
    if [[ -f "$ENV_FILE" ]]; then
        warning "Environment file $ENV_FILE already exists"
        echo -n "Do you want to overwrite it? (y/N): "
        read overwrite
        if [[ "$overwrite" != "y" ]] && [[ "$overwrite" != "Y" ]]; then
            info "Keeping existing environment file"
            return 1
        fi
    fi
    return 0
}

# Main function
main() {
    echo -e "${BLUE}🎵 EchoTune AI - Environment Setup${NC}"
    echo -e "${BLUE}Setting up production environment for $DOMAIN${NC}\n"
    
    # Check if template exists
    if [[ ! -f "$ENV_TEMPLATE" ]]; then
        error "Environment template $ENV_TEMPLATE not found"
        exit 1
    fi
    
    # Validate and setup
    if validate_environment; then
        setup_environment
    fi
}

# Handle command line arguments
case "${1:-}" in
    -h|--help)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Setup production environment for EchoTune AI deployment"
        echo ""
        echo "Options:"
        echo "  -h, --help     Show this help"
        echo "  --force        Force overwrite existing environment file"
        echo ""
        exit 0
        ;;
    --force)
        rm -f "$ENV_FILE"
        main
        ;;
    "")
        main
        ;;
    *)
        error "Unknown option: $1"
        exit 1
        ;;
esac