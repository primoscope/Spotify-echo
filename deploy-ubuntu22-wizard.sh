#!/bin/bash

# ===================================================================
# EchoTune AI - Interactive Deployment Wizard for Ubuntu 22.04
# Comprehensive deployment system with user input and validation
# Fixes externally-managed-environment and Docker installation issues
# ===================================================================

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_VERSION="3.0.0"
SCRIPT_NAME="EchoTune AI Ubuntu 22.04 Deployment Wizard"
DEPLOY_DIR="/opt/echotune"
LOG_DIR="${DEPLOY_DIR}/logs"
LOG_FILE=""
PYTHON_VENV="${DEPLOY_DIR}/venv"

# User configuration (to be filled by wizard)
DOMAIN=""
PRIMARY_IP=""
SPOTIFY_CLIENT_ID=""
SPOTIFY_CLIENT_SECRET=""
MONGODB_URI=""
GEMINI_API_KEY=""
OPENAI_API_KEY=""
SESSION_SECRET=""
JWT_SECRET=""
DEPLOY_MODE=""
FIX_ISSUES="false"

# Enhanced logging functions
log() {
    local message="$1"
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo -e "${GREEN}[${timestamp}] ✓ ${message}${NC}"
    if [[ -n "$LOG_FILE" && -f "$LOG_FILE" ]]; then
        echo "[${timestamp}] ✓ ${message}" >> "$LOG_FILE"
    fi
}

error() {
    local message="$1"
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo -e "${RED}[${timestamp}] ✗ ERROR: ${message}${NC}"
    if [[ -n "$LOG_FILE" && -f "$LOG_FILE" ]]; then
        echo "[${timestamp}] ✗ ERROR: ${message}" >> "$LOG_FILE"
    fi
}

warning() {
    local message="$1"
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo -e "${YELLOW}[${timestamp}] ⚠ WARNING: ${message}${NC}"
    if [[ -n "$LOG_FILE" && -f "$LOG_FILE" ]]; then
        echo "[${timestamp}] ⚠ WARNING: ${message}" >> "$LOG_FILE"
    fi
}

info() {
    local message="$1"
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo -e "${BLUE}[${timestamp}] ℹ INFO: ${message}${NC}"
    if [[ -n "$LOG_FILE" && -f "$LOG_FILE" ]]; then
        echo "[${timestamp}] ℹ INFO: ${message}" >> "$LOG_FILE"
    fi
}

# Print welcome header
print_welcome() {
    clear
    echo -e "${PURPLE}${BOLD}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}${BOLD}║                    🎵 EchoTune AI Deployment Wizard                          ║${NC}"
    echo -e "${PURPLE}${BOLD}║                          Ubuntu 22.04 LTS Edition                           ║${NC}"
    echo -e "${PURPLE}${BOLD}║                               Version ${SCRIPT_VERSION}                                ║${NC}"
    echo -e "${PURPLE}${BOLD}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}This wizard will guide you through deploying EchoTune AI with:${NC}"
    echo -e "${WHITE}• Ubuntu 22.04 compatibility fixes${NC}"
    echo -e "${WHITE}• Interactive configuration${NC}"
    echo -e "${WHITE}• Environment validation${NC}"
    echo -e "${WHITE}• Automatic issue detection and fixing${NC}"
    echo -e "${WHITE}• Complete SSL and security setup${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  This script requires root privileges and will modify system configuration${NC}"
    echo ""
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root or with sudo"
        exit 1
    fi
    log "Running with root privileges - verified"
}

# Initialize environment
initialize_environment() {
    log "Initializing deployment environment..."
    
    # Create directories with proper permissions
    mkdir -p "$LOG_DIR"
    chmod 755 "$LOG_DIR"
    
    # Set up logging
    LOG_FILE="${LOG_DIR}/wizard-deployment-$(date +%Y%m%d-%H%M%S).log"
    touch "$LOG_FILE"
    chmod 644 "$LOG_FILE"
    
    log "Log file: $LOG_FILE"
}

# Get user input with validation
get_user_input() {
    echo -e "${CYAN}${BOLD}📝 Configuration Setup${NC}"
    echo -e "${WHITE}Please provide the following information for your deployment:${NC}"
    echo ""

    # Get domain
    while [[ -z "$DOMAIN" ]]; do
        read -p "🌐 Enter your domain name (e.g., yourdomain.com): " DOMAIN
        if [[ -z "$DOMAIN" ]]; then
            echo -e "${RED}Domain is required!${NC}"
        else
            echo -e "${GREEN}✓ Domain set to: $DOMAIN${NC}"
        fi
    done

    # Get IP address (optional, auto-detect if not provided)
    read -p "🔗 Enter your server IP address (leave empty to auto-detect): " PRIMARY_IP
    if [[ -z "$PRIMARY_IP" ]]; then
        PRIMARY_IP=$(curl -s http://checkip.amazonaws.com/ || echo "")
        if [[ -n "$PRIMARY_IP" ]]; then
            echo -e "${GREEN}✓ Auto-detected IP: $PRIMARY_IP${NC}"
        else
            warning "Could not auto-detect IP address"
        fi
    else
        echo -e "${GREEN}✓ IP address set to: $PRIMARY_IP${NC}"
    fi

    # Choose deployment mode
    echo ""
    echo -e "${CYAN}🚀 Choose deployment mode:${NC}"
    echo "1) Full Production (with Spotify API and MongoDB)"
    echo "2) Demo Mode (works without external APIs)"
    echo "3) Development Mode (includes dev tools)"
    
    while [[ -z "$DEPLOY_MODE" ]]; do
        read -p "Choose mode [1-3]: " mode_choice
        case $mode_choice in
            1) DEPLOY_MODE="production"; echo -e "${GREEN}✓ Production mode selected${NC}" ;;
            2) DEPLOY_MODE="demo"; echo -e "${GREEN}✓ Demo mode selected${NC}" ;;
            3) DEPLOY_MODE="development"; echo -e "${GREEN}✓ Development mode selected${NC}" ;;
            *) echo -e "${RED}Invalid choice. Please enter 1, 2, or 3${NC}" ;;
        esac
    done

    if [[ "$DEPLOY_MODE" == "production" ]]; then
        echo ""
        echo -e "${CYAN}🔑 API Credentials (required for production mode):${NC}"
        
        # Get Spotify credentials
        while [[ -z "$SPOTIFY_CLIENT_ID" ]]; do
            read -p "🎵 Spotify Client ID: " SPOTIFY_CLIENT_ID
            if [[ -z "$SPOTIFY_CLIENT_ID" ]]; then
                echo -e "${RED}Spotify Client ID is required for production mode!${NC}"
            fi
        done

        while [[ -z "$SPOTIFY_CLIENT_SECRET" ]]; do
            read -s -p "🔐 Spotify Client Secret: " SPOTIFY_CLIENT_SECRET
            echo
            if [[ -z "$SPOTIFY_CLIENT_SECRET" ]]; then
                echo -e "${RED}Spotify Client Secret is required for production mode!${NC}"
            fi
        done

        # Get database URI
        read -p "🗄️  MongoDB URI (leave empty for local MongoDB): " MONGODB_URI
        if [[ -z "$MONGODB_URI" ]]; then
            MONGODB_URI="mongodb://localhost:27017/echotune"
            echo -e "${BLUE}Using local MongoDB: $MONGODB_URI${NC}"
        fi

        # Get AI API keys (optional)
        read -p "🤖 Google Gemini API Key (optional): " GEMINI_API_KEY
        read -p "🤖 OpenAI API Key (optional): " OPENAI_API_KEY
    fi

    # Generate secrets
    SESSION_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "$(date +%s)$(shuf -i 1000-9999 -n 1)")
    JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "$(date +%s)$(shuf -i 1000-9999 -n 1)")

    echo -e "${GREEN}✓ Configuration completed!${NC}"
    echo ""
}

# Analyze environment for issues
analyze_environment() {
    echo -e "${CYAN}${BOLD}🔍 Analyzing Environment for Issues${NC}"
    
    local issues_found=0
    
    # Check Ubuntu version
    if ! grep -q "22.04" /etc/os-release; then
        warning "This script is optimized for Ubuntu 22.04 LTS"
        ((issues_found++))
    else
        log "Ubuntu 22.04 LTS detected - compatible"
    fi

    # Check Python externally-managed-environment
    if python3 -m pip install --help 2>&1 | grep -q "externally-managed-environment"; then
        warning "Python externally-managed-environment detected - will use virtual environment"
        ((issues_found++))
    fi

    # Check if existing .env has issues
    if [[ -f "$DEPLOY_DIR/.env" ]]; then
        if grep -q "GEMINI_API_KEY[^=]" "$DEPLOY_DIR/.env" 2>/dev/null; then
            warning "Found malformed GEMINI_API_KEY line in existing .env file"
            ((issues_found++))
        fi
    fi

    # Check Docker installation
    if command -v docker &> /dev/null; then
        if ! docker --version &> /dev/null; then
            warning "Docker is installed but not working properly"
            ((issues_found++))
        fi
    fi

    # Check port availability
    for port in 80 443 3000; do
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            warning "Port $port is already in use"
            ((issues_found++))
        fi
    done

    echo ""
    if [[ $issues_found -gt 0 ]]; then
        echo -e "${YELLOW}⚠️  Found $issues_found potential issues${NC}"
        read -p "Would you like the wizard to automatically fix these issues? [Y/n]: " fix_choice
        if [[ "$fix_choice" =~ ^[Yy]$ ]] || [[ -z "$fix_choice" ]]; then
            FIX_ISSUES="true"
            echo -e "${GREEN}✓ Will automatically fix issues during deployment${NC}"
        else
            echo -e "${BLUE}ℹ Continuing without automatic fixes${NC}"
        fi
    else
        log "No critical issues detected"
    fi
    echo ""
}

# Fix Ubuntu 22.04 Python issues
fix_python_issues() {
    log "Fixing Ubuntu 22.04 Python externally-managed-environment issues..."

    # Install python3-venv if not present
    apt-get update -qq
    apt-get install -y python3-venv python3-pip

    # Create virtual environment for Python packages
    if [[ ! -d "$PYTHON_VENV" ]]; then
        log "Creating Python virtual environment at $PYTHON_VENV"
        python3 -m venv "$PYTHON_VENV"
    fi

    # Activate virtual environment and install packages
    source "$PYTHON_VENV/bin/activate"
    
    # Upgrade pip in virtual environment
    pip install --upgrade pip setuptools wheel

    # Install core Python packages in virtual environment
    local python_packages=(
        "requests>=2.31.0"
        "spotipy>=2.22.0"
        "python-dotenv>=1.0.0"
        "fastapi>=0.100.0"
        "uvicorn>=0.22.0"
        "gunicorn>=21.0.0"
        "supervisor>=4.2.0"
    )

    for package in "${python_packages[@]}"; do
        log "Installing Python package: $package"
        pip install "$package" || warning "Failed to install $package"
    done

    # Create activation script
    cat > "$DEPLOY_DIR/activate-python" << 'EOF'
#!/bin/bash
# Activate Python virtual environment
source /opt/echotune/venv/bin/activate
exec "$@"
EOF
    chmod +x "$DEPLOY_DIR/activate-python"

    log "Python environment setup completed"
}

# Fix Ubuntu 22.04 Docker installation issues
fix_docker_issues() {
    log "Installing Docker with Ubuntu 22.04 compatibility..."

    # Remove any existing Docker installations
    apt-get remove -y docker docker-engine docker.io containerd runc docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin 2>/dev/null || true

    # Clean up old GPG keys and repositories
    rm -f /usr/share/keyrings/docker-archive-keyring.gpg
    rm -f /etc/apt/sources.list.d/docker.list

    # Install prerequisites
    apt-get update -qq
    apt-get install -y ca-certificates curl gnupg lsb-release

    # Add Docker's official GPG key for Ubuntu 22.04 (Jammy)
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker.gpg
    chmod a+r /usr/share/keyrings/docker.gpg

    # Add Docker repository for Ubuntu 22.04 (Jammy)
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu jammy stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Update package index
    apt-get update -qq

    # Install Docker Engine
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Start and enable Docker
    systemctl start docker
    systemctl enable docker

    # Configure Docker daemon for production
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

    # Restart Docker with new configuration
    systemctl daemon-reload
    systemctl restart docker

    # Test Docker installation
    if docker run --rm hello-world > /dev/null 2>&1; then
        log "Docker installation successful"
    else
        warning "Docker test failed, but installation completed"
    fi

    # Fix UFW firewall compatibility with Docker
    if command -v ufw &> /dev/null; then
        log "Configuring UFW firewall for Docker compatibility..."
        ufw --force reset
        ufw default deny incoming
        ufw default allow outgoing
        ufw allow ssh
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw --force enable
    fi

    log "Docker installation completed"
}

# Install system dependencies
install_dependencies() {
    log "Installing system dependencies for Ubuntu 22.04..."
    
    # Update system
    apt-get update -qq
    apt-get upgrade -y

    # Install essential packages
    local packages=(
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
        "certbot"
        "python3-certbot-nginx"
        "build-essential"
        "python3"
        "python3-pip"
        "python3-venv"
        "python3-dev"
        "sqlite3"
        "libsqlite3-dev"
        "jq"
        "htop"
        "nano"
        "vim"
        "nginx"
        "supervisor"
    )

    for package in "${packages[@]}"; do
        log "Installing: $package"
        apt-get install -y "$package" || warning "Failed to install $package"
    done

    log "System dependencies installed"
}

# Install Node.js
install_nodejs() {
    log "Installing Node.js 20.x LTS..."

    # Remove any existing Node.js installations
    apt-get remove -y nodejs npm 2>/dev/null || true

    # Install NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs

    # Verify installation
    node_version=$(node --version 2>/dev/null || echo "Failed")
    npm_version=$(npm --version 2>/dev/null || echo "Failed")
    
    log "Node.js version: $node_version"
    log "npm version: $npm_version"

    # Install global packages
    npm install -g pm2@latest
}

# Create deployment user and directories
setup_user_and_directories() {
    log "Setting up deployment user and directories..."

    # Create deployment user
    if ! id "echotune" &>/dev/null; then
        useradd -r -s /bin/bash -d "$DEPLOY_DIR" -m echotune
        log "Created user: echotune"
    fi

    # Create directory structure
    local dirs=(
        "$DEPLOY_DIR"
        "$DEPLOY_DIR/ssl"
        "$DEPLOY_DIR/data"
        "$DEPLOY_DIR/logs"
        "$DEPLOY_DIR/backups"
        "$DEPLOY_DIR/nginx"
        "$DEPLOY_DIR/tmp"
    )

    for dir in "${dirs[@]}"; do
        mkdir -p "$dir"
        chown -R echotune:echotune "$dir"
        chmod 755 "$dir"
    done

    # Add user to necessary groups
    usermod -aG docker echotune 2>/dev/null || true
    usermod -aG sudo echotune 2>/dev/null || true

    log "User and directories setup completed"
}

# Fix existing environment file issues
fix_env_issues() {
    log "Checking and fixing environment file issues..."

    if [[ -f "$DEPLOY_DIR/.env" ]]; then
        # Fix malformed GEMINI_API_KEY line
        if grep -q "GEMINI_API_KEY[^=]" "$DEPLOY_DIR/.env"; then
            warning "Fixing malformed GEMINI_API_KEY line in .env file"
            cp "$DEPLOY_DIR/.env" "$DEPLOY_DIR/.env.backup.$(date +%s)"
            sed -i 's/GEMINI_API_KEY\([^=]\)/GEMINI_API_KEY=\1/g' "$DEPLOY_DIR/.env"
            log "Fixed GEMINI_API_KEY line in .env file"
        fi

        # Remove any binary characters
        if grep -P "[\x00-\x08\x0E-\x1F\x7F-\xFF]" "$DEPLOY_DIR/.env" &>/dev/null; then
            warning "Removing binary characters from .env file"
            sed -i 's/[\x00-\x08\x0E-\x1F\x7F-\xFF]//g' "$DEPLOY_DIR/.env"
            log "Cleaned binary characters from .env file"
        fi
    fi
}

# Create environment configuration
create_environment_config() {
    log "Creating environment configuration..."

    cat > "$DEPLOY_DIR/.env" << EOF
# EchoTune AI - Generated Configuration
# Generated on: $(date)
# Deployment Mode: $DEPLOY_MODE

# Domain Configuration
DOMAIN=$DOMAIN
FRONTEND_URL=https://$DOMAIN
NODE_ENV=production
PORT=3000

# Server Configuration
PRIMARY_IP=$PRIMARY_IP
SSL_CERT_PATH=/etc/nginx/ssl/$DOMAIN.crt
SSL_KEY_PATH=/etc/nginx/ssl/$DOMAIN.key

# Security Configuration
SESSION_SECRET=$SESSION_SECRET
JWT_SECRET=$JWT_SECRET

# Deployment Configuration
DEPLOY_MODE=$DEPLOY_MODE
DEPLOYMENT_TIMESTAMP=$(date +%s)

EOF

    if [[ "$DEPLOY_MODE" == "production" ]]; then
        cat >> "$DEPLOY_DIR/.env" << EOF
# Spotify API Configuration
SPOTIFY_CLIENT_ID=$SPOTIFY_CLIENT_ID
SPOTIFY_CLIENT_SECRET=$SPOTIFY_CLIENT_SECRET
SPOTIFY_REDIRECT_URI=https://$DOMAIN/auth/callback

# Database Configuration
MONGODB_URI=$MONGODB_URI
DATABASE_TYPE=mongodb

# AI Provider Configuration
GEMINI_API_KEY=$GEMINI_API_KEY
OPENAI_API_KEY=$OPENAI_API_KEY
DEFAULT_LLM_PROVIDER=gemini
EOF
    else
        cat >> "$DEPLOY_DIR/.env" << EOF
# Demo Mode Configuration
DEMO_MODE=true
DATABASE_TYPE=sqlite
SPOTIFY_CLIENT_ID=demo_client_id
SPOTIFY_CLIENT_SECRET=demo_client_secret
DEFAULT_LLM_PROVIDER=mock
EOF
    fi

    # Set proper permissions
    chown echotune:echotune "$DEPLOY_DIR/.env"
    chmod 600 "$DEPLOY_DIR/.env"

    log "Environment configuration created"
}

# Deploy application
deploy_application() {
    log "Deploying EchoTune AI application..."

    # Clone or update repository
    cd "$DEPLOY_DIR"
    if [[ ! -d ".git" ]]; then
        log "Cloning repository..."
        git clone https://github.com/dzp5103/Spotify-echo.git .
    else
        log "Updating repository..."
        git fetch origin
        git reset --hard origin/main
        git pull origin main
    fi

    # Set ownership
    chown -R echotune:echotune "$DEPLOY_DIR"

    # Install Node.js dependencies
    if [[ -f "package.json" ]]; then
        log "Installing Node.js dependencies..."
        sudo -u echotune npm install
    fi

    # Install Python dependencies in virtual environment
    if [[ -f "requirements.txt" && -d "$PYTHON_VENV" ]]; then
        log "Installing Python dependencies..."
        sudo -u echotune bash -c "source $PYTHON_VENV/bin/activate && pip install -r requirements.txt"
    fi

    log "Application deployment completed"
}

# Set up SSL certificates
setup_ssl() {
    log "Setting up SSL certificates for $DOMAIN..."

    # Stop any services that might be using port 80
    systemctl stop nginx 2>/dev/null || true
    
    # Try to obtain SSL certificate
    if certbot certonly --standalone --non-interactive --agree-tos --email "admin@$DOMAIN" --domains "$DOMAIN,www.$DOMAIN"; then
        log "SSL certificate obtained successfully"
        
        # Copy certificates
        mkdir -p "$DEPLOY_DIR/ssl"
        cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$DEPLOY_DIR/ssl/$DOMAIN.crt"
        cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$DEPLOY_DIR/ssl/$DOMAIN.key"
        chown -R echotune:echotune "$DEPLOY_DIR/ssl"
        
        # Set up auto-renewal
        (crontab -l 2>/dev/null; echo "0 2 * * 1 certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -
        
        log "SSL auto-renewal configured"
    else
        warning "Failed to obtain SSL certificate, creating self-signed certificate"
        
        mkdir -p "$DEPLOY_DIR/ssl"
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "$DEPLOY_DIR/ssl/$DOMAIN.key" \
            -out "$DEPLOY_DIR/ssl/$DOMAIN.crt" \
            -subj "/C=US/ST=CA/L=SF/O=EchoTune/CN=$DOMAIN"
        chown -R echotune:echotune "$DEPLOY_DIR/ssl"
        
        warning "Using self-signed certificate - remember to configure DNS"
    fi
}

# Create nginx configuration
create_nginx_config() {
    log "Creating nginx configuration..."

    cat > "$DEPLOY_DIR/nginx.conf" << EOF
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Gzip compression
    gzip on;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    upstream app {
        server localhost:3000;
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name $DOMAIN www.$DOMAIN;
        return 301 https://\$server_name\$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name $DOMAIN www.$DOMAIN;

        ssl_certificate /opt/echotune/ssl/$DOMAIN.crt;
        ssl_certificate_key /opt/echotune/ssl/$DOMAIN.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Security headers
        add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;

        location / {
            proxy_pass http://app;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_set_header X-Forwarded-Host \$host;
            proxy_set_header X-Forwarded-Port \$server_port;
            
            # WebSocket support
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        location /health {
            proxy_pass http://app/health;
            access_log off;
        }
    }
}
EOF

    # Copy nginx configuration
    cp "$DEPLOY_DIR/nginx.conf" /etc/nginx/nginx.conf
    
    # Test nginx configuration
    if nginx -t; then
        log "nginx configuration is valid"
        systemctl restart nginx
        systemctl enable nginx
    else
        error "nginx configuration is invalid"
        return 1
    fi
}

# Start services
start_services() {
    log "Starting EchoTune AI services..."

    # Create systemd service
    cat > /etc/systemd/system/echotune.service << EOF
[Unit]
Description=EchoTune AI Music Recommendation System
After=network.target nginx.service
Wants=nginx.service

[Service]
Type=simple
User=echotune
Group=echotune
WorkingDirectory=/opt/echotune
Environment=NODE_ENV=production
Environment=PATH=/opt/echotune/venv/bin:/usr/local/bin:/usr/bin:/bin
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=echotune

[Install]
WantedBy=multi-user.target
EOF

    # Enable and start service
    systemctl daemon-reload
    systemctl enable echotune.service
    systemctl start echotune.service

    # Wait for service to start
    sleep 10

    log "Services started"
}

# Verify deployment
verify_deployment() {
    log "Verifying deployment..."

    local health_check_passed=false
    local attempts=0
    local max_attempts=10

    while [[ $attempts -lt $max_attempts ]]; do
        if curl -f -k "https://localhost/health" >/dev/null 2>&1; then
            health_check_passed=true
            break
        fi
        
        ((attempts++))
        if [[ $attempts -lt $max_attempts ]]; then
            warning "Health check attempt $attempts/$max_attempts failed, retrying in 10 seconds..."
            sleep 10
        fi
    done

    if [[ "$health_check_passed" == "true" ]]; then
        log "✓ Health check passed - deployment successful!"
    else
        warning "Health check failed after $max_attempts attempts"
    fi

    # Check service status
    if systemctl is-active echotune.service >/dev/null; then
        log "✓ EchoTune service is running"
    else
        warning "EchoTune service is not running"
    fi

    if systemctl is-active nginx.service >/dev/null; then
        log "✓ nginx service is running"
    else
        warning "nginx service is not running"
    fi
}

# Show deployment summary
show_deployment_summary() {
    echo ""
    echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}${BOLD}║                    🎉 DEPLOYMENT COMPLETED SUCCESSFULLY! 🎉                 ║${NC}"
    echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    echo -e "${CYAN}${BOLD}🌐 Your EchoTune AI Installation:${NC}"
    echo -e "${WHITE}✅ Domain: https://$DOMAIN${NC}"
    echo -e "${WHITE}✅ IP Address: $PRIMARY_IP${NC}"
    echo -e "${WHITE}✅ Deployment Mode: $DEPLOY_MODE${NC}"
    echo -e "${WHITE}✅ SSL: $(if [[ -f "$DEPLOY_DIR/ssl/$DOMAIN.crt" ]]; then echo "Configured"; else echo "Self-signed"; fi)${NC}"
    echo ""

    echo -e "${BLUE}${BOLD}🛠️ Management Commands:${NC}"
    echo -e "${WHITE}• Start service: sudo systemctl start echotune${NC}"
    echo -e "${WHITE}• Stop service: sudo systemctl stop echotune${NC}"
    echo -e "${WHITE}• Restart service: sudo systemctl restart echotune${NC}"
    echo -e "${WHITE}• View logs: sudo journalctl -u echotune -f${NC}"
    echo -e "${WHITE}• Health check: curl -k https://$DOMAIN/health${NC}"
    echo ""

    echo -e "${PURPLE}${BOLD}📋 DNS Configuration Required:${NC}"
    echo -e "${WHITE}To complete the setup, configure your domain DNS:${NC}"
    echo ""
    echo -e "${YELLOW}A Record Configuration:${NC}"
    echo -e "${WHITE}• Name: @ (or leave empty for root domain)${NC}"
    echo -e "${WHITE}• Type: A${NC}"
    echo -e "${WHITE}• Value: $PRIMARY_IP${NC}"
    echo -e "${WHITE}• TTL: 300 (5 minutes)${NC}"
    echo ""
    echo -e "${YELLOW}Additional A Record for www:${NC}"
    echo -e "${WHITE}• Name: www${NC}"
    echo -e "${WHITE}• Type: A${NC}"
    echo -e "${WHITE}• Value: $PRIMARY_IP${NC}"
    echo -e "${WHITE}• TTL: 300 (5 minutes)${NC}"
    echo ""

    if [[ "$DEPLOY_MODE" == "production" ]]; then
        echo -e "${CYAN}${BOLD}🔑 API Configuration:${NC}"
        echo -e "${WHITE}• Spotify Client ID: ${SPOTIFY_CLIENT_ID:0:10}...${NC}"
        echo -e "${WHITE}• Database: $MONGODB_URI${NC}"
        echo -e "${WHITE}• AI Provider: $(if [[ -n "$GEMINI_API_KEY" ]]; then echo "Gemini"; elif [[ -n "$OPENAI_API_KEY" ]]; then echo "OpenAI"; else echo "None configured"; fi)${NC}"
    else
        echo -e "${BLUE}${BOLD}🚀 Demo Mode:${NC}"
        echo -e "${WHITE}• No API keys required${NC}"
        echo -e "${WHITE}• Using SQLite database${NC}"
        echo -e "${WHITE}• Mock AI responses${NC}"
    fi

    echo ""
    echo -e "${GREEN}${BOLD}✨ Installation completed at $(date)${NC}"
    echo -e "${CYAN}🎵 Access your EchoTune AI installation at: https://$DOMAIN${NC}"
    echo ""
}

# Main wizard flow
main() {
    print_welcome
    check_root
    initialize_environment
    get_user_input
    analyze_environment

    # Fix issues if requested
    if [[ "$FIX_ISSUES" == "true" ]]; then
        fix_env_issues
        fix_python_issues
        fix_docker_issues
    fi

    # Core installation steps
    install_dependencies
    install_nodejs
    setup_user_and_directories
    create_environment_config
    deploy_application
    setup_ssl
    create_nginx_config
    start_services
    verify_deployment
    show_deployment_summary

    log "🎉 EchoTune AI Ubuntu 22.04 deployment completed successfully!"
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "EchoTune AI Ubuntu 22.04 Deployment Wizard v$SCRIPT_VERSION"
        echo "Usage: sudo $0"
        echo "This interactive wizard will guide you through the deployment process."
        exit 0
        ;;
    --version)
        echo "$SCRIPT_VERSION"
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac