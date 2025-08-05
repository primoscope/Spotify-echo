#!/bin/bash

# ===================================================================
# EchoTune AI - Environment Setup Script
# Fetches and configures environment files with production values
# ===================================================================

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/tmp/echotune-environment-$(date +%Y%m%d-%H%M%S).log"
DEPLOY_DIR="/opt/echotune"
DOMAIN="${1:-primosphere.studio}"
EMAIL="${2:-admin@primosphere.studio}"

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

# Generate secure random string
generate_secret() {
    openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | xxd -p -c 32 | tr -d '\n'
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root. Use: sudo $0"
        exit 1
    fi
}

# Fetch latest environment templates from repository
fetch_environment_templates() {
    log "Fetching latest environment templates..."
    
    # Check if we're in a git repository
    if [[ -f "$SCRIPT_DIR/.env.production.example" ]]; then
        log "Using local environment template"
        cp "$SCRIPT_DIR/.env.production.example" "$DEPLOY_DIR/.env.production.example"
    else
        # Fetch from GitHub if not available locally
        info "Downloading environment template from GitHub..."
        curl -fsSL "https://raw.githubusercontent.com/dzp5103/Spotify-echo/main/.env.production.example" \
            -o "$DEPLOY_DIR/.env.production.example" || {
            error "Failed to download environment template"
            return 1
        }
    fi
    
    log "Environment template fetched successfully"
}

# Create production environment file
create_production_env() {
    log "Creating production environment file..."
    
    local env_file="$DEPLOY_DIR/.env"
    local template_file="$DEPLOY_DIR/.env.production.example"
    
    if [[ ! -f "$template_file" ]]; then
        error "Environment template not found at $template_file"
        return 1
    fi
    
    # Copy template to .env
    cp "$template_file" "$env_file"
    
    # Generate secure secrets
    local session_secret=$(generate_secret)
    local jwt_secret=$(generate_secret)
    local mongodb_password=$(generate_secret | cut -c1-16)
    local redis_password=$(generate_secret | cut -c1-16)
    
    # Get server IP
    local server_ip=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || echo "127.0.0.1")
    
    log "Configuring environment variables..."
    
    # Replace placeholders with actual values
    sed -i "s/DOMAIN=.*/DOMAIN=$DOMAIN/" "$env_file"
    sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=https://$DOMAIN|" "$env_file"
    sed -i "s|SPOTIFY_REDIRECT_URI=.*|SPOTIFY_REDIRECT_URI=https://$DOMAIN/auth/callback|" "$env_file"
    sed -i "s/SESSION_SECRET=.*/SESSION_SECRET=$session_secret/" "$env_file"
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$jwt_secret/" "$env_file"
    sed -i "s/LETSENCRYPT_EMAIL=.*/LETSENCRYPT_EMAIL=$EMAIL/" "$env_file"
    sed -i "s/FROM_EMAIL=.*/FROM_EMAIL=noreply@$DOMAIN/" "$env_file"
    sed -i "s/ALERT_EMAIL=.*/ALERT_EMAIL=$EMAIL/" "$env_file"
    sed -i "s|SSL_CERT_PATH=.*|SSL_CERT_PATH=/etc/nginx/ssl/$DOMAIN.crt|" "$env_file"
    sed -i "s|SSL_KEY_PATH=.*|SSL_KEY_PATH=/etc/nginx/ssl/$DOMAIN.key|" "$env_file"
    sed -i "s/MONGODB_ROOT_PASSWORD=.*/MONGODB_ROOT_PASSWORD=$mongodb_password/" "$env_file"
    sed -i "s/REDIS_PASSWORD=.*/REDIS_PASSWORD=$redis_password/" "$env_file"
    sed -i "s/CORS_ORIGINS=.*/CORS_ORIGINS=https:\/\/$DOMAIN,https:\/\/www.$DOMAIN/" "$env_file"
    
    # Set proper file permissions
    chown echotune:echotune "$env_file"
    chmod 600 "$env_file"
    
    log "Production environment file created at $env_file"
}

# Create development environment file
create_development_env() {
    log "Creating development environment file..."
    
    local dev_env_file="$SCRIPT_DIR/.env"
    
    # Check if .env already exists in project directory
    if [[ -f "$dev_env_file" ]]; then
        warning ".env file already exists in project directory"
        log "Backing up existing .env to .env.backup"
        cp "$dev_env_file" "$dev_env_file.backup"
    fi
    
    # Create development .env based on production template
    cat > "$dev_env_file" << EOF
# EchoTune AI Development Environment
# Auto-generated on $(date)

# Development Configuration
NODE_ENV=development
PORT=3000
DEBUG=true
VERBOSE_LOGGING=true

# Domain Configuration (development)
DOMAIN=localhost
FRONTEND_URL=http://localhost:3000

# Spotify API Configuration (REQUIRED - Add your credentials)
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
SPOTIFY_REDIRECT_URI=http://localhost:3000/auth/callback

# Security Secrets (development - change for production)
SESSION_SECRET=$(generate_secret)
JWT_SECRET=$(generate_secret)

# AI Provider Configuration (mock for development)
DEFAULT_LLM_PROVIDER=mock
DEFAULT_LLM_MODEL=mock-music-assistant

# Google Gemini (Optional)
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash

# OpenAI Configuration (Optional)
OPENAI_API_KEY=
OPENAI_MODEL=gpt-3.5-turbo

# Database Configuration (development)
DATABASE_TYPE=sqlite
ENABLE_SQLITE_FALLBACK=true
MONGODB_URI=
REDIS_URL=

# Development Features
HOT_RELOAD=true
MOCK_EXTERNAL_APIS=true
ENABLE_CORS=true
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Logging
LOG_LEVEL=debug
LOG_FILE=./logs/app.log

# Rate Limiting (relaxed for development)
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000

# Development Tools
SOURCE_MAPS=true
ENABLE_PROFILING=true

# Music Features
ENABLE_RECOMMENDATIONS=true
ENABLE_PLAYLIST_CREATION=true
ENABLE_AI_FEATURES=true
ENABLE_CHAT_HISTORY=true

# Development Notes:
# 1. Get Spotify credentials from: https://developer.spotify.com/dashboard
# 2. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET above
# 3. For AI features, add GEMINI_API_KEY or OPENAI_API_KEY
# 4. Mock provider works without any API keys for testing
EOF
    
    # Set proper permissions
    chown ${SUDO_USER:-echotune}:${SUDO_USER:-echotune} "$dev_env_file"
    chmod 644 "$dev_env_file"
    
    log "Development environment file created at $dev_env_file"
}

# Validate environment configuration
validate_environment() {
    log "Validating environment configuration..."
    
    local env_file="$DEPLOY_DIR/.env"
    local validation_passed=true
    
    if [[ ! -f "$env_file" ]]; then
        error "Environment file not found at $env_file"
        return 1
    fi
    
    # Check required variables
    local required_vars=(
        "DOMAIN"
        "FRONTEND_URL"
        "SESSION_SECRET"
        "JWT_SECRET"
        "LETSENCRYPT_EMAIL"
    )
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" "$env_file"; then
            error "Required variable $var not found in environment file"
            validation_passed=false
        fi
    done
    
    # Check if secrets are not default values
    if grep -q "change_this" "$env_file"; then
        warning "Default placeholder values found in environment file"
    fi
    
    if [[ "$validation_passed" == true ]]; then
        log "✅ Environment validation passed"
    else
        error "❌ Environment validation failed"
        return 1
    fi
}

# Display environment setup instructions
show_setup_instructions() {
    log "📋 Environment Setup Complete!"
    log ""
    log "📁 Files created:"
    log "   • Production: $DEPLOY_DIR/.env"
    log "   • Development: $SCRIPT_DIR/.env"
    log "   • Template: $DEPLOY_DIR/.env.production.example"
    log ""
    log "🔧 Next steps for Spotify integration:"
    log "   1. Visit: https://developer.spotify.com/dashboard"
    log "   2. Create a new app or use existing"
    log "   3. Add redirect URI: https://$DOMAIN/auth/callback"
    log "   4. Update SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env files"
    log ""
    log "🤖 For AI features (optional):"
    log "   • Google Gemini: Get API key from Google AI Studio"
    log "   • OpenAI: Get API key from OpenAI Platform"
    log "   • Mock provider works without any API keys"
    log ""
    log "⚙️ Environment variables configured for:"
    log "   • Domain: $DOMAIN"
    log "   • Email: $EMAIL"
    log "   • SSL: Enabled with Let's Encrypt"
    log "   • Security: Enhanced with secure secrets"
    log "   • Database: MongoDB with fallback to SQLite"
    log "   • Caching: Redis for production"
    log "   • Monitoring: Health checks and logging enabled"
}

# Create environment documentation
create_env_documentation() {
    log "Creating environment documentation..."
    
    local doc_file="$DEPLOY_DIR/ENVIRONMENT_SETUP.md"
    
    cat > "$doc_file" << EOF
# EchoTune AI Environment Setup

## Overview
This document describes the environment configuration for EchoTune AI deployment.

## Files Created
- **Production Environment**: \`$DEPLOY_DIR/.env\`
- **Development Environment**: \`$SCRIPT_DIR/.env\`
- **Template File**: \`$DEPLOY_DIR/.env.production.example\`

## Configuration Details

### Domain Configuration
- **Domain**: $DOMAIN
- **Frontend URL**: https://$DOMAIN
- **Admin Email**: $EMAIL

### Security
- **Session Secret**: Auto-generated 64-character secure string
- **JWT Secret**: Auto-generated 64-character secure string
- **SSL/TLS**: Enabled with Let's Encrypt certificates
- **CORS**: Restricted to production domain

### Database
- **Primary**: MongoDB with connection string
- **Fallback**: SQLite for development
- **Caching**: Redis for session storage and API caching

### API Integrations
- **Spotify API**: Requires client credentials from Spotify Developer Dashboard
- **AI Providers**: Supports OpenAI, Google Gemini, and mock provider
- **Default Provider**: Mock (works without API keys)

### Monitoring & Logging
- **Health Checks**: Enabled with 30-second intervals
- **Log Files**: Rotating logs with 7-day retention
- **Performance Monitoring**: CPU, memory, and disk usage tracking

## Spotify API Setup

1. Visit [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new application or select existing
3. Add redirect URI: \`https://$DOMAIN/auth/callback\`
4. Copy Client ID and Client Secret
5. Update the following in your .env file:
   \`\`\`
   SPOTIFY_CLIENT_ID=your_client_id_here
   SPOTIFY_CLIENT_SECRET=your_client_secret_here
   \`\`\`

## AI Provider Setup (Optional)

### Google Gemini
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Add to .env file: \`GEMINI_API_KEY=your_key_here\`
4. Set provider: \`DEFAULT_LLM_PROVIDER=gemini\`

### OpenAI
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create an API key
3. Add to .env file: \`OPENAI_API_KEY=your_key_here\`
4. Set provider: \`DEFAULT_LLM_PROVIDER=openai\`

### Mock Provider (No Setup Required)
- Already configured as default
- Provides simulated AI responses
- Perfect for testing and development

## Security Considerations

### Production Checklist
- [ ] All secrets generated and not using defaults
- [ ] SSL certificates properly configured
- [ ] CORS origins restricted to production domain
- [ ] Debug mode disabled (\`DEBUG=false\`)
- [ ] Rate limiting configured appropriately
- [ ] Database credentials environment-specific
- [ ] Monitoring and alerting configured

### File Permissions
- Production .env: 600 (owner read/write only)
- Development .env: 644 (owner read/write, group/other read)
- Deploy directory: 777 (fully permissive as requested)

## Deployment Commands

### Start Application
\`\`\`bash
# Production
cd $DEPLOY_DIR && npm start

# Development
cd $SCRIPT_DIR && npm run dev
\`\`\`

### Health Check
\`\`\`bash
curl https://$DOMAIN/health
\`\`\`

### View Logs
\`\`\`bash
# Application logs
tail -f $DEPLOY_DIR/logs/app.log

# Error logs
tail -f $DEPLOY_DIR/logs/error.log

# Access logs
tail -f $DEPLOY_DIR/logs/access.log
\`\`\`

## Troubleshooting

### Common Issues
1. **Spotify API errors**: Check client credentials and redirect URI
2. **SSL certificate issues**: Verify domain DNS and Let's Encrypt setup
3. **Permission errors**: Run \`sudo ./deploy-permissions.sh\`
4. **Database connection**: Check MongoDB URI and credentials

### Support
- GitHub Issues: https://github.com/dzp5103/Spotify-echo/issues
- Documentation: https://github.com/dzp5103/Spotify-echo#readme

---
Generated on: $(date)
Environment Setup Script v1.0.0
EOF
    
    chown echotune:echotune "$doc_file"
    chmod 644 "$doc_file"
    
    log "Documentation created at $doc_file"
}

# Main function
main() {
    log "Starting EchoTune AI environment setup..."
    log "Log file: $LOG_FILE"
    log "Domain: $DOMAIN"
    log "Email: $EMAIL"
    
    check_root
    fetch_environment_templates
    create_production_env
    create_development_env
    validate_environment
    create_env_documentation
    
    log "✅ Environment setup completed successfully!"
    show_setup_instructions
    
    log ""
    log "🚀 Next steps:"
    log "   1. Configure Spotify API credentials in .env files"
    log "   2. Run: sudo ./deploy-app.sh"
    log ""
    log "📄 Full log available at: $LOG_FILE"
    log "📚 Documentation: $DEPLOY_DIR/ENVIRONMENT_SETUP.md"
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "EchoTune AI Environment Setup Script"
        echo ""
        echo "Usage: sudo $0 [domain] [email]"
        echo ""
        echo "Arguments:"
        echo "  domain    Domain name for deployment (default: primosphere.studio)"
        echo "  email     Admin email for SSL certificates (default: admin@domain)"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --version, -v  Show script version"
        echo ""
        echo "Examples:"
        echo "  sudo $0"
        echo "  sudo $0 example.com admin@example.com"
        exit 0
        ;;
    --version|-v)
        echo "EchoTune AI Environment Setup Script v1.0.0"
        exit 0
        ;;
    *)
        # Parse domain and email from arguments
        if [[ -n "${1:-}" ]]; then
            DOMAIN="$1"
        fi
        if [[ -n "${2:-}" ]]; then
            EMAIL="$2"
        fi
        main
        ;;
esac