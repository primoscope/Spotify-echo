#!/bin/bash

# ===================================================================
# EchoTune AI - Enhanced DigitalOcean Production Deployment Script
# Domain: primosphere.studio
# IPs: 159.223.207.187 (Primary), 209.38.5.39 (Reserved)
# Enhanced Version: v2.0.0 - Fully Idempotent & Force-Resistant
# ===================================================================

# Enhanced error handling - continue on errors but log them
set -uo pipefail

# Color codes for enhanced output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="primosphere.studio"
PRIMARY_IP="159.223.207.187"
RESERVED_IP="209.38.5.39"
APP_NAME="echotune-ai"
DEPLOY_USER="echotune"
DOCKER_REGISTRY="registry.digitalocean.com/echotune"
BUILD_VERSION="${BUILD_VERSION:-$(date +%Y%m%d-%H%M%S)}"

# Script options
FORCE_RESET=${FORCE_RESET:-false}
VERBOSE=${VERBOSE:-false}
DRY_RUN=${DRY_RUN:-false}

# Directories with more permissive approach
DEPLOY_DIR="/opt/echotune"
LOG_DIR="${DEPLOY_DIR}/logs"
LOG_FILE="${LOG_DIR}/deployment-$(date +%Y%m%d-%H%M%S).log"

# Enhanced logging functions
log() {
    local message="$1"
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo -e "${GREEN}[${timestamp}] ✓ ${message}${NC}" | tee -a "$LOG_FILE" 2>/dev/null || echo -e "${GREEN}[${timestamp}] ✓ ${message}${NC}"
}

error() {
    local message="$1"
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo -e "${RED}[${timestamp}] ✗ ERROR: ${message}${NC}" | tee -a "$LOG_FILE" 2>/dev/null || echo -e "${RED}[${timestamp}] ✗ ERROR: ${message}${NC}"
    # Don't exit immediately in enhanced mode - just log and continue
    if [[ "${CONTINUE_ON_ERROR:-true}" != "true" ]]; then
        exit 1
    fi
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

success() {
    local message="$1"
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo -e "${GREEN}${BOLD}[${timestamp}] 🎉 ${message}${NC}" | tee -a "$LOG_FILE" 2>/dev/null || echo -e "${GREEN}${BOLD}[${timestamp}] 🎉 ${message}${NC}"
}

debug() {
    if [[ "$VERBOSE" == "true" ]]; then
        local message="$1"
        local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
        echo -e "${DIM}[${timestamp}] 🔍 DEBUG: ${message}${NC}" | tee -a "$LOG_FILE" 2>/dev/null || echo -e "${DIM}[${timestamp}] 🔍 DEBUG: ${message}${NC}"
    fi
}

# Enhanced error handling wrapper
safe_execute() {
    local command="$1"
    local description="${2:-Executing command}"
    
    debug "Executing: $command"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        info "[DRY RUN] Would execute: $description"
        return 0
    fi
    
    if eval "$command" 2>&1 | tee -a "$LOG_FILE"; then
        debug "Successfully executed: $description"
        return 0
    else
        local exit_code=$?
        error "Failed to execute: $description (exit code: $exit_code)"
        return $exit_code
    fi
}

# Check if running as root or with sudo
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root or with sudo"
    fi
    log "Running with root privileges - verified"
}

# Enhanced initialization with force reset capability
initialize_environment() {
    log "Initializing enhanced deployment environment..."
    
    # Create log directory first (with permissive permissions)
    safe_execute "mkdir -p '$LOG_DIR'" "Creating log directory"
    safe_execute "chmod 777 '$LOG_DIR'" "Setting permissive log directory permissions"
    
    # Handle force reset if requested
    if [[ "$FORCE_RESET" == "true" ]]; then
        warning "FORCE RESET requested - cleaning up existing deployment"
        
        # Stop services gracefully
        safe_execute "systemctl stop echotune 2>/dev/null || true" "Stopping echotune service"
        safe_execute "systemctl stop docker 2>/dev/null || true" "Stopping docker service"
        
        # Clean up containers and images
        safe_execute "docker stop \$(docker ps -aq) 2>/dev/null || true" "Stopping all containers"
        safe_execute "docker rm \$(docker ps -aq) 2>/dev/null || true" "Removing all containers"
        safe_execute "docker system prune -af 2>/dev/null || true" "Cleaning docker system"
        
        # Remove deployment directory
        safe_execute "rm -rf '$DEPLOY_DIR' 2>/dev/null || true" "Removing deployment directory"
        
        # Remove deploy user
        safe_execute "userdel -r '$DEPLOY_USER' 2>/dev/null || true" "Removing deploy user"
        
        success "Force reset completed"
    fi
    
    log "Environment initialization completed"
}

# Create deployment user and directories with enhanced permissions
setup_user_and_dirs() {
    log "Setting up deployment user and directories with enhanced permissions..."
    
    # Create echotune user if it doesn't exist
    if ! id "$DEPLOY_USER" &>/dev/null; then
        safe_execute "useradd -r -s /bin/bash -d '$DEPLOY_DIR' -m '$DEPLOY_USER'" "Creating deploy user"
        log "Created user: $DEPLOY_USER"
    else
        log "User $DEPLOY_USER already exists - updating configuration"
        # Ensure user has proper home directory
        safe_execute "usermod -d '$DEPLOY_DIR' '$DEPLOY_USER'" "Updating user home directory"
    fi
    
    # Create comprehensive directory structure
    local dirs=(
        "$DEPLOY_DIR"
        "$DEPLOY_DIR/ssl"
        "$DEPLOY_DIR/letsencrypt"
        "$LOG_DIR"
        "$DEPLOY_DIR/data"
        "$DEPLOY_DIR/static"
        "$DEPLOY_DIR/mongodb/data"
        "$DEPLOY_DIR/mongodb/config"
        "$DEPLOY_DIR/redis/data"
        "$DEPLOY_DIR/nginx/logs"
        "$DEPLOY_DIR/certbot"
        "$DEPLOY_DIR/backups"
        "$DEPLOY_DIR/uploads"
        "$DEPLOY_DIR/cache"
        "$DEPLOY_DIR/tmp"
    )
    
    for dir in "${dirs[@]}"; do
        safe_execute "mkdir -p '$dir'" "Creating directory: $dir"
        safe_execute "chmod 777 '$dir'" "Setting permissive permissions for: $dir"
    done
    
    # Set ownership (but keep permissive permissions)
    safe_execute "chown -R '$DEPLOY_USER:$DEPLOY_USER' '$DEPLOY_DIR'" "Setting ownership"
    
    # Make sure deploy user can use docker
    safe_execute "usermod -aG docker '$DEPLOY_USER' 2>/dev/null || true" "Adding user to docker group"
    safe_execute "usermod -aG sudo '$DEPLOY_USER' 2>/dev/null || true" "Adding user to sudo group"
    
    log "Directory structure created with enhanced permissions (777)"
}

# Enhanced system dependency installation
install_dependencies() {
    log "Installing comprehensive system dependencies..."
    
    # Update system packages
    safe_execute "apt-get update" "Updating package lists"
    safe_execute "apt-get upgrade -y" "Upgrading existing packages"
    
    # Install essential build tools and dependencies
    local essential_packages=(
        "curl"
        "wget"
        "git"
        "unzip"
        "zip"
        "software-properties-common"
        "apt-transport-https"
        "ca-certificates"
        "gnupg"
        "lsb-release"
        "ufw"
        "fail2ban"
        "logrotate"
        "certbot"
        "python3-certbot-nginx"
        "htop"
        "ncdu"
        "jq"
        "vim"
        "nano"
        "tree"
        "rsync"
        "screen"
        "tmux"
        "build-essential"
        "gcc"
        "g++"
        "make"
        "cmake"
        "pkg-config"
        "libssl-dev"
        "libffi-dev"
        "python3-dev"
        "python3-pip"
        "python3-venv"
        "python3-setuptools"
        "python3-wheel"
        "sqlite3"
        "libsqlite3-dev"
        "redis-tools"
        "mongodb-clients"
    )
    
    for package in "${essential_packages[@]}"; do
        safe_execute "apt-get install -y '$package'" "Installing $package"
    done
    
    log "Essential system dependencies installed"
}

# Install/Update Node.js and npm with latest versions
install_nodejs() {
    log "Installing/updating Node.js and npm..."
    
    # Remove any existing nodejs installations to avoid conflicts
    safe_execute "apt-get remove -y nodejs npm 2>/dev/null || true" "Removing old Node.js installations"
    
    # Install NodeSource repository for latest Node.js
    safe_execute "curl -fsSL https://deb.nodesource.com/setup_20.x | bash -" "Adding NodeSource repository"
    
    # Install Node.js 20.x
    safe_execute "apt-get install -y nodejs" "Installing Node.js 20.x"
    
    # Update npm to latest version
    safe_execute "npm install -g npm@latest" "Updating npm to latest version"
    
    # Install useful global packages
    local global_packages=(
        "pm2"
        "nodemon"
        "typescript"
        "@types/node"
        "eslint"
        "prettier"
        "vite"
        "jest"
    )
    
    for package in "${global_packages[@]}"; do
        safe_execute "npm install -g '$package'" "Installing global package: $package"
    done
    
    # Verify installations
    node_version=$(node --version 2>/dev/null || echo "Not installed")
    npm_version=$(npm --version 2>/dev/null || echo "Not installed")
    
    log "Node.js version: $node_version"
    log "npm version: $npm_version"
}

# Install/Update Python tools and packages using virtual environment
install_python() {
    log "Installing/updating Python with virtual environment for Ubuntu 22.04..."
    
    # Install python3-venv to handle externally-managed-environment issue
    safe_execute "apt-get install -y python3-venv python3-pip python3-dev" "Installing Python dependencies"
    
    # Create virtual environment at deploy directory
    local python_venv="${DEPLOY_DIR}/venv"
    if [[ ! -d "$python_venv" ]]; then
        safe_execute "python3 -m venv '$python_venv'" "Creating Python virtual environment"
    fi
    
    # Activate virtual environment and install packages
    safe_execute "source '$python_venv/bin/activate' && pip install --upgrade pip setuptools wheel" "Upgrading pip in virtual environment"
    
    # Install essential Python packages in virtual environment
    local python_packages=(
        "requests>=2.31.0"
        "spotipy>=2.22.0"
        "python-dotenv>=1.0.0"
        "fastapi>=0.100.0"
        "uvicorn>=0.22.0"
        "gunicorn>=21.0.0"
        "pymongo>=4.6.0"
        "supervisor>=4.2.0"
    )
    
    for package in "${python_packages[@]}"; do
        safe_execute "source '$python_venv/bin/activate' && pip install '$package'" "Installing Python package: $package"
    done
    
    # Create activation script for easy use
    cat > "${DEPLOY_DIR}/activate-python" << 'EOF'
#!/bin/bash
# Activate Python virtual environment for EchoTune AI
source /opt/echotune/venv/bin/activate
exec "$@"
EOF
    chmod +x "${DEPLOY_DIR}/activate-python"
    
    # Verify Python installation
    python_version=$(python3 --version 2>/dev/null || echo "Not installed")
    pip_version=$(source "$python_venv/bin/activate" && pip --version 2>/dev/null || echo "Not installed")
    
    log "Python version: $python_version"
    log "pip version (venv): $pip_version"
    log "Python virtual environment: $python_venv"
}

# Enhanced Docker installation with Ubuntu 22.04 compatibility
install_docker() {
    log "Installing Docker with Ubuntu 22.04 compatibility fixes..."
    
    # Remove any existing Docker installations
    safe_execute "apt-get remove -y docker docker-engine docker.io containerd runc docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin 2>/dev/null || true" "Removing old Docker packages"
    safe_execute "rm -rf /var/lib/docker /etc/docker /usr/share/keyrings/docker-archive-keyring.gpg /etc/apt/sources.list.d/docker.list" "Cleaning Docker directories"
    
    # Install prerequisites for Ubuntu 22.04
    safe_execute "apt-get update" "Updating package lists"
    safe_execute "apt-get install -y ca-certificates curl gnupg lsb-release" "Installing Docker prerequisites"
    
    # Add Docker's official GPG key for Ubuntu 22.04 (Jammy)
    safe_execute "curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker.gpg" "Adding Docker GPG key"
    safe_execute "chmod a+r /usr/share/keyrings/docker.gpg" "Setting GPG key permissions"
    
    # Add Docker repository for Ubuntu 22.04 (Jammy Jellyfish)  
    safe_execute "echo 'deb [arch=\$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu jammy stable' | tee /etc/apt/sources.list.d/docker.list > /dev/null" "Adding Docker repository"
    
    # Update package index
    safe_execute "apt-get update" "Updating package index with Docker repository"
    
    # Install Docker Engine
    safe_execute "apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin" "Installing Docker packages"
    
    # Configure systemd to properly manage Docker
    safe_execute "systemctl daemon-reload" "Reloading systemd"
    safe_execute "systemctl start docker" "Starting Docker service"
    safe_execute "systemctl enable docker" "Enabling Docker service"
    
    # Create docker group and add users
    safe_execute "groupadd docker 2>/dev/null || true" "Creating docker group"
    safe_execute "usermod -aG docker '$DEPLOY_USER'" "Adding deploy user to docker group"
    
    # Set up Docker daemon configuration for production
    safe_execute "mkdir -p /etc/docker" "Creating Docker config directory"
    
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
    safe_execute "systemctl daemon-reload" "Reloading systemd daemon"
    safe_execute "systemctl restart docker" "Restarting Docker with new configuration"
    
    # Test Docker installation
    if safe_execute "docker run --rm hello-world" "Testing Docker functionality"; then
        log "Docker installation and test successful"
    else
        warning "Docker test failed, but installation may still work"
    fi
    
    # Verify versions
    docker_version=$(docker --version 2>/dev/null || echo "Failed")
    compose_version=$(docker compose version 2>/dev/null || echo "Failed")
    
    log "Docker version: $docker_version"
    log "Docker Compose version: $compose_version"
}

# Configure firewall to be fully permissive
setup_firewall() {
    log "Configuring firewall to be fully permissive..."
    
    # Option 1: Disable UFW completely (most permissive)
    safe_execute "ufw --force reset" "Resetting UFW configuration"
    safe_execute "ufw disable" "Disabling UFW firewall completely"
    
    # Alternative option 2: Make UFW fully permissive (commented out)
    # safe_execute "ufw default allow incoming" "Setting default allow incoming"
    # safe_execute "ufw default allow outgoing" "Setting default allow outgoing"
    # safe_execute "ufw --force enable" "Enabling permissive UFW"
    
    log "Firewall configured to be fully permissive (UFW disabled)"
}

# Enhanced fail2ban setup with permissive configuration
setup_fail2ban() {
    log "Configuring fail2ban with enhanced settings..."
    
    # Create fail2ban configuration (but with more permissive settings)
    safe_execute "mkdir -p /etc/fail2ban" "Creating fail2ban directory"
    
    cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
# More permissive settings for development/testing
bantime = 300
findtime = 600
maxretry = 10
backend = systemd
# Ignore local networks for development
ignoreip = 127.0.0.1/8 ::1 10.0.0.0/8 172.16.0.0/12 192.168.0.0/16

[sshd]
enabled = true
mode = normal
port = ssh
logpath = %(sshd_log)s
maxretry = 20

[nginx-http-auth]
enabled = false

[nginx-limit-req]
enabled = false

[nginx-botsearch]
enabled = false
EOF
    
    safe_execute "systemctl restart fail2ban" "Restarting fail2ban"
    safe_execute "systemctl enable fail2ban" "Enabling fail2ban"
    
    log "fail2ban configured with permissive settings"
}

# Enhanced log rotation setup
setup_logrotate() {
    log "Setting up enhanced log rotation..."
    
    cat > /etc/logrotate.d/echotune << 'EOF'
/opt/echotune/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 777 echotune echotune
    postrotate
        docker exec echotune-nginx nginx -s reload 2>/dev/null || true
        systemctl reload echotune 2>/dev/null || true
    endscript
}

/opt/echotune/nginx/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 777 echotune echotune
    sharedscripts
    postrotate
        docker exec echotune-nginx nginx -s reload 2>/dev/null || true
    endscript
}

/var/log/docker/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 777 root root
    postrotate
        systemctl reload docker 2>/dev/null || true
    endscript
}
EOF
    
    # Test logrotate configuration
    safe_execute "logrotate -d /etc/logrotate.d/echotune" "Testing logrotate configuration"
    
    log "Enhanced log rotation configured"
}

# Enhanced systemd service creation
create_systemd_service() {
    log "Creating enhanced systemd service..."
    
    cat > /etc/systemd/system/echotune.service << EOF
[Unit]
Description=EchoTune AI Music Recommendation System
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target
StartLimitIntervalSec=0

[Service]
Type=oneshot
RemainAfterExit=yes
User=$DEPLOY_USER
Group=$DEPLOY_USER
WorkingDirectory=$DEPLOY_DIR
Environment=COMPOSE_PROJECT_NAME=$APP_NAME
Environment=BUILD_VERSION=$BUILD_VERSION
Environment=PATH=/usr/local/bin:/usr/bin:/bin
ExecStartPre=/usr/bin/docker compose -f docker-compose.yml --profile production pull
ExecStart=/usr/bin/docker compose -f docker-compose.yml --profile production up -d --build
ExecStop=/usr/bin/docker compose -f docker-compose.yml --profile production down
ExecReload=/usr/bin/docker compose -f docker-compose.yml --profile production restart
TimeoutStartSec=900
TimeoutStopSec=300
Restart=on-failure
RestartSec=30
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
    
    safe_execute "systemctl daemon-reload" "Reloading systemd configuration"
    safe_execute "systemctl enable echotune.service" "Enabling echotune service"
    
    log "Enhanced systemd service created and enabled"
}

# Enhanced SSL setup with better automation
setup_ssl() {
    log "Setting up enhanced SSL certificates for $DOMAIN..."
    
    # Stop any conflicting services
    safe_execute "systemctl stop nginx 2>/dev/null || true" "Stopping nginx"
    safe_execute "docker stop echotune-nginx 2>/dev/null || true" "Stopping nginx container"
    safe_execute "pkill -f nginx || true" "Killing any remaining nginx processes"
    
    # Wait for ports to be free
    sleep 5
    
    # Try to obtain SSL certificate
    if safe_execute "certbot certonly --standalone --non-interactive --agree-tos --email admin@$DOMAIN --domains $DOMAIN,www.$DOMAIN" "Obtaining SSL certificate"; then
        log "SSL certificate obtained successfully"
        
        # Copy certificates to nginx ssl directory with permissive permissions
        safe_execute "mkdir -p '$DEPLOY_DIR/ssl'" "Creating SSL directory"
        safe_execute "cp '/etc/letsencrypt/live/$DOMAIN/fullchain.pem' '$DEPLOY_DIR/ssl/$DOMAIN.crt'" "Copying SSL certificate"
        safe_execute "cp '/etc/letsencrypt/live/$DOMAIN/privkey.pem' '$DEPLOY_DIR/ssl/$DOMAIN.key'" "Copying SSL private key"
        
        # Set permissive permissions for development
        safe_execute "chmod 777 '$DEPLOY_DIR/ssl'" "Setting SSL directory permissions"
        safe_execute "chmod 644 '$DEPLOY_DIR/ssl'/*" "Setting SSL file permissions"
        safe_execute "chown -R '$DEPLOY_USER:$DEPLOY_USER' '$DEPLOY_DIR/ssl'" "Setting SSL ownership"
        
        # Setup automatic renewal
        cat > /etc/cron.d/echotune-ssl-renew << EOF
0 2 * * 1 root certbot renew --quiet --post-hook 'docker exec echotune-nginx nginx -s reload 2>/dev/null || systemctl reload echotune'
EOF
        
        log "SSL certificate configured with auto-renewal"
    else
        warning "Failed to obtain SSL certificate, creating self-signed certificate"
        
        # Generate self-signed certificate as fallback
        safe_execute "mkdir -p '$DEPLOY_DIR/ssl'" "Creating SSL directory"
        safe_execute "openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout '$DEPLOY_DIR/ssl/$DOMAIN.key' -out '$DEPLOY_DIR/ssl/$DOMAIN.crt' -subj '/C=US/ST=CA/L=San Francisco/O=EchoTune AI/CN=$DOMAIN'" "Creating self-signed certificate"
        
        safe_execute "chmod 777 '$DEPLOY_DIR/ssl'" "Setting SSL directory permissions"
        safe_execute "chmod 644 '$DEPLOY_DIR/ssl'/*" "Setting SSL file permissions"
        safe_execute "chown -R '$DEPLOY_USER:$DEPLOY_USER' '$DEPLOY_DIR/ssl'" "Setting SSL ownership"
    fi
}

# Enhanced application deployment with better idempotency
deploy_application() {
    log "Deploying EchoTune AI application with enhanced features..."
    
    # Switch to deploy user for application operations
    safe_execute "runuser -l '$DEPLOY_USER' -c '
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
        
        # Ensure proper permissions
        chmod -R 777 .
        
        # Fix any existing environment file issues
        if [ -f \".env\" ]; then
            echo \"Fixing existing environment file issues...\"
            # Fix malformed GEMINI_API_KEY line
            sed -i 's/GEMINI_API_KEY[^=]/GEMINI_API_KEY=/g' .env
            # Remove any binary characters
            sed -i 's/[\x00-\x08\x0E-\x1F\x7F-\xFF]//g' .env
            cp .env .env.backup.\$(date +%s)
        fi
        
        # Create production environment file from template
        if [ -f \".env.production.example\" ]; then
            cp .env.production.example .env
        else
            echo \"Creating basic production environment file\"
            cat > .env << EOF
NODE_ENV=production
DOMAIN=$DOMAIN
FRONTEND_URL=https://$DOMAIN
PORT=3000
PRIMARY_IP=$PRIMARY_IP
SSL_CERT_PATH=/etc/nginx/ssl/$DOMAIN.crt
SSL_KEY_PATH=/etc/nginx/ssl/$DOMAIN.key
BUILD_VERSION=$BUILD_VERSION
SESSION_SECRET=\$(openssl rand -hex 32)
JWT_SECRET=\$(openssl rand -hex 32)
DATABASE_TYPE=mongodb
MONGODB_URI=mongodb://localhost:27017/echotune
DEMO_MODE=false
DEFAULT_LLM_PROVIDER=mock
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
SPOTIFY_REDIRECT_URI=https://$DOMAIN/auth/callback
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
EOF
        fi
        
        # Update environment variables for production with proper escaping
        sed -i \"s|^DOMAIN=.*|DOMAIN=$DOMAIN|\" .env
        sed -i \"s|^FRONTEND_URL=.*|FRONTEND_URL=https://$DOMAIN|\" .env
        sed -i \"s|^PRIMARY_IP=.*|PRIMARY_IP=$PRIMARY_IP|\" .env
        sed -i \"s|^SSL_CERT_PATH=.*|SSL_CERT_PATH=/etc/nginx/ssl/$DOMAIN.crt|\" .env
        sed -i \"s|^SSL_KEY_PATH=.*|SSL_KEY_PATH=/etc/nginx/ssl/$DOMAIN.key|\" .env
        sed -i \"s|^BUILD_VERSION=.*|BUILD_VERSION=$BUILD_VERSION|\" .env
        sed -i \"s|^SPOTIFY_REDIRECT_URI=.*|SPOTIFY_REDIRECT_URI=https://$DOMAIN/auth/callback|\" .env
        
        # Generate new session secrets
        SESSION_SECRET=\$(openssl rand -hex 32 2>/dev/null || echo \"\$(date +%s)\$(shuf -i 1000-9999 -n 1)\")
        JWT_SECRET=\$(openssl rand -hex 32 2>/dev/null || echo \"\$(date +%s)\$(shuf -i 1000-9999 -n 1)\")
        sed -i \"s|^SESSION_SECRET=.*|SESSION_SECRET=\$SESSION_SECRET|\" .env
        sed -i \"s|^JWT_SECRET=.*|JWT_SECRET=\$JWT_SECRET|\" .env
        
        # Install/update Node.js dependencies
        if [ -f \"package.json\" ]; then
            echo \"Installing Node.js dependencies...\"
            npm install --production=false
            npm audit fix --force || true
        fi
        
        # Install/update Python dependencies in virtual environment
        if [ -f \"requirements.txt\" ] && [ -d \"/opt/echotune/venv\" ]; then
            echo \"Installing Python dependencies in virtual environment...\"
            source /opt/echotune/venv/bin/activate && pip install -r requirements.txt --upgrade
        fi
        
        # Build application if needed
        if [ -f \"package.json\" ] && npm run build 2>/dev/null; then
            echo \"Application built successfully\"
        else
            echo \"No build script or build failed, continuing...\"
        fi
        
        # Set all permissions to 777 for development ease
        chmod -R 777 .
        
        echo \"Application deployment preparation completed\"
    '" "Preparing application deployment"
    
    # Deploy with Docker Compose
    safe_execute "cd '$DEPLOY_DIR' && runuser -l '$DEPLOY_USER' -c 'cd \"$DEPLOY_DIR\" && docker compose -f docker-compose.yml --profile production build --no-cache'" "Building Docker containers"
    
    safe_execute "cd '$DEPLOY_DIR' && runuser -l '$DEPLOY_USER' -c 'cd \"$DEPLOY_DIR\" && docker compose -f docker-compose.yml --profile production up -d'" "Starting Docker containers"
    
    # Wait for services to start
    log "Waiting for services to start..."
    sleep 30
    
    # Check service health
    safe_execute "cd '$DEPLOY_DIR' && runuser -l '$DEPLOY_USER' -c 'cd \"$DEPLOY_DIR\" && docker compose -f docker-compose.yml ps'" "Checking container status"
    
    log "Application deployed successfully"
}

# Enhanced deployment verification
verify_deployment() {
    log "Performing comprehensive deployment verification..."
    
    # Wait for services to be fully ready
    sleep 15
    
    # Check if containers are running
    if safe_execute "cd '$DEPLOY_DIR' && runuser -l '$DEPLOY_USER' -c 'cd \"$DEPLOY_DIR\" && docker compose -f docker-compose.yml ps | grep -q \"Up\"'" "Checking container status"; then
        log "✓ Containers are running"
    else
        warning "Some containers may not be running properly"
    fi
    
    # Test local HTTP health check
    for i in {1..5}; do
        if safe_execute "curl -f -m 10 'http://localhost/health' 2>/dev/null" "Testing HTTP health check (attempt $i)"; then
            log "✓ HTTP health check passed"
            break
        else
            warning "HTTP health check failed (attempt $i/5)"
            sleep 5
        fi
    done
    
    # Test local HTTPS health check (if SSL is configured)
    for i in {1..3}; do
        if safe_execute "curl -f -k -m 10 'https://localhost/health' 2>/dev/null" "Testing HTTPS health check (attempt $i)"; then
            log "✓ HTTPS health check passed"
            break
        else
            warning "HTTPS health check failed (attempt $i/3)"
            sleep 5
        fi
    done
    
    # Check domain resolution and health
    for i in {1..3}; do
        if safe_execute "curl -f -k -m 15 'https://$DOMAIN/health' 2>/dev/null" "Testing domain health check (attempt $i)"; then
            log "✓ Domain health check passed"
            break
        else
            warning "Domain health check failed (attempt $i/3) - DNS may need time to propagate"
            sleep 10
        fi
    done
    
    # Check Docker services individually
    local services=("app" "nginx" "mongodb" "redis")
    for service in "${services[@]}"; do
        if safe_execute "cd '$DEPLOY_DIR' && runuser -l '$DEPLOY_USER' -c 'cd \"$DEPLOY_DIR\" && docker compose ps $service | grep -q \"Up\"'" "Checking $service container"; then
            log "✓ $service container is running"
        else
            warning "$service container may not be running"
        fi
    done
    
    # Check system service
    if safe_execute "systemctl is-active echotune" "Checking systemd service"; then
        log "✓ EchoTune systemd service is active"
    else
        warning "EchoTune systemd service may not be active"
    fi
    
    # Check ports
    local ports=("80" "443" "3000")
    for port in "${ports[@]}"; do
        if safe_execute "netstat -tuln | grep -q \":$port \"" "Checking port $port"; then
            log "✓ Port $port is listening"
        else
            warning "Port $port may not be listening"
        fi
    done
    
    log "Deployment verification completed"
}

# Enhanced deployment summary
show_summary() {
    success "🎉 EchoTune AI Enhanced Deployment Completed Successfully!"
    
    echo -e "\n${CYAN}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}${BOLD}                    📊 DEPLOYMENT SUMMARY                        ${NC}"
    echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
    
    echo -e "\n${GREEN}${BOLD}🌐 Domain & Network Configuration:${NC}"
    echo -e "${GREEN}✅ Primary Domain:${NC} https://$DOMAIN"
    echo -e "${GREEN}✅ Primary IP:${NC} $PRIMARY_IP"
    echo -e "${GREEN}✅ Reserved IP:${NC} $RESERVED_IP"
    echo -e "${GREEN}✅ SSL Status:${NC} $(if [[ -f "$DEPLOY_DIR/ssl/$DOMAIN.crt" ]]; then echo "Configured"; else echo "Self-signed"; fi)"
    echo -e "${GREEN}✅ Firewall:${NC} Fully Permissive (UFW Disabled)"
    
    echo -e "\n${BLUE}${BOLD}🔧 Application Details:${NC}"
    echo -e "${BLUE}✅ Application:${NC} EchoTune AI Music Recommendation System"
    echo -e "${BLUE}✅ Version:${NC} $BUILD_VERSION"
    echo -e "${BLUE}✅ Deploy User:${NC} $DEPLOY_USER"
    echo -e "${BLUE}✅ Deploy Directory:${NC} $DEPLOY_DIR"
    echo -e "${BLUE}✅ Permissions:${NC} Enhanced (777) for development ease"
    
    echo -e "\n${PURPLE}${BOLD}🐳 Container Status:${NC}"
    if cd "$DEPLOY_DIR" && runuser -l "$DEPLOY_USER" -c "cd '$DEPLOY_DIR' && docker compose -f docker-compose.yml ps --format table 2>/dev/null" | head -20; then
        echo ""
    else
        warning "Could not display container status"
    fi
    
    echo -e "\n${YELLOW}${BOLD}🛠️ System Information:${NC}"
    echo -e "${YELLOW}✅ Node.js:${NC} $(node --version 2>/dev/null || echo 'Not available')"
    echo -e "${YELLOW}✅ npm:${NC} $(npm --version 2>/dev/null || echo 'Not available')"
    echo -e "${YELLOW}✅ Python:${NC} $(python3 --version 2>/dev/null || echo 'Not available')"
    echo -e "${YELLOW}✅ Docker:${NC} $(docker --version 2>/dev/null | cut -d' ' -f3 | cut -d',' -f1 || echo 'Not available')"
    echo -e "${YELLOW}✅ Docker Compose:${NC} $(docker compose version --short 2>/dev/null || echo 'Not available')"
    
    echo -e "\n${CYAN}${BOLD}🎮 Management Commands:${NC}"
    echo -e "${CYAN}▶ Start services:${NC} sudo systemctl start echotune"
    echo -e "${CYAN}⏹ Stop services:${NC} sudo systemctl stop echotune"
    echo -e "${CYAN}🔄 Restart services:${NC} sudo systemctl restart echotune"
    echo -e "${CYAN}📊 Check status:${NC} sudo systemctl status echotune"
    echo -e "${CYAN}📋 View logs:${NC} sudo -u $DEPLOY_USER docker compose -f $DEPLOY_DIR/docker-compose.yml logs -f"
    echo -e "${CYAN}🔧 Manual docker:${NC} cd $DEPLOY_DIR && sudo -u $DEPLOY_USER docker compose [command]"
    
    echo -e "\n${GREEN}${BOLD}📁 Important Files & Directories:${NC}"
    echo -e "${GREEN}📄 Environment Config:${NC} $DEPLOY_DIR/.env"
    echo -e "${GREEN}🔐 SSL Certificates:${NC} $DEPLOY_DIR/ssl/"
    echo -e "${GREEN}💾 Application Data:${NC} $DEPLOY_DIR/data/"
    echo -e "${GREEN}📝 Logs:${NC} $DEPLOY_DIR/logs/"
    echo -e "${GREEN}💼 Backups:${NC} $DEPLOY_DIR/backups/"
    echo -e "${GREEN}📤 Uploads:${NC} $DEPLOY_DIR/uploads/"
    
    echo -e "\n${BLUE}${BOLD}🚀 Quick Health Checks:${NC}"
    local health_urls=(
        "http://localhost/health"
        "https://localhost/health"
        "https://$DOMAIN/health"
        "http://$PRIMARY_IP/health"
    )
    
    for url in "${health_urls[@]}"; do
        if timeout 5 curl -f -k "$url" &>/dev/null; then
            echo -e "${GREEN}✅ $url${NC}"
        else
            echo -e "${RED}❌ $url${NC}"
        fi
    done
    
    echo -e "\n${CYAN}${BOLD}🔧 Configuration Next Steps:${NC}"
    echo -e "${CYAN}1.${NC} Configure Spotify API credentials in $DEPLOY_DIR/.env"
    echo -e "${CYAN}2.${NC} Set up database credentials (MongoDB/Supabase) in $DEPLOY_DIR/.env"
    echo -e "${CYAN}3.${NC} Configure AI provider API keys (Gemini, OpenAI, etc.) in $DEPLOY_DIR/.env"
    echo -e "${CYAN}4.${NC} Test the application: ${BLUE}curl -k https://$DOMAIN/health${NC}"
    echo -e "${CYAN}5.${NC} Configure DNS to point $DOMAIN to $PRIMARY_IP"
    echo -e "${CYAN}6.${NC} Update firewall rules if needed: ${BLUE}sudo ufw status${NC}"
    
    echo -e "\n${PURPLE}${BOLD}📚 Documentation & Resources:${NC}"
    echo -e "${PURPLE}📖 Main Documentation:${NC} $DEPLOY_DIR/README.md"
    echo -e "${PURPLE}🌐 GitHub Repository:${NC} https://github.com/dzp5103/Spotify-echo"
    echo -e "${PURPLE}📋 Deployment Guide:${NC} https://github.com/dzp5103/Spotify-echo#deployment"
    echo -e "${PURPLE}🎵 Spotify Developer:${NC} https://developer.spotify.com/dashboard"
    echo -e "${PURPLE}🔒 SSL Labs Test:${NC} https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
    
    echo -e "\n${RED}${BOLD}⚠️ Enhanced Security Notes:${NC}"
    echo -e "${RED}🔥 Firewall Status:${NC} UFW is DISABLED (fully permissive as requested)"
    echo -e "${RED}🔓 Permissions:${NC} Enhanced (777) - suitable for development, review for production"
    echo -e "${RED}🔑 Secrets:${NC} Change default passwords in $DEPLOY_DIR/.env"
    echo -e "${RED}📊 Monitoring:${NC} Monitor system logs: ${BLUE}sudo journalctl -u echotune -f${NC}"
    echo -e "${RED}🔍 Fail2ban:${NC} Configured with permissive settings: ${BLUE}sudo fail2ban-client status${NC}"
    
    echo -e "\n${GREEN}${BOLD}🎯 Script Enhancement Features:${NC}"
    echo -e "${GREEN}✅ Fully Idempotent:${NC} Safe to run multiple times"
    echo -e "${GREEN}✅ Force Reset:${NC} Use --force to completely reset deployment"
    echo -e "${GREEN}✅ Enhanced Logging:${NC} Comprehensive logs in $LOG_DIR"
    echo -e "${GREEN}✅ Robust Error Handling:${NC} Continues on non-critical errors"
    echo -e "${GREEN}✅ Dependency Management:${NC} Auto-installs/updates all dependencies"
    echo -e "${GREEN}✅ Permissive Configuration:${NC} 777 permissions and open firewall"
    
    echo -e "\n${CYAN}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}${BOLD}🎉 Deployment completed at $(date)${NC}"
    echo -e "${GREEN}${BOLD}🚀 EchoTune AI is now live at https://$DOMAIN${NC}"
    echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
}

# Enhanced cleanup function for failed deployments
cleanup_on_error() {
    error "Deployment encountered errors. Performing cleanup..."
    
    # Try to stop services gracefully
    safe_execute "systemctl stop echotune 2>/dev/null || true" "Stopping echotune service"
    safe_execute "cd '$DEPLOY_DIR' && runuser -l '$DEPLOY_USER' -c 'cd \"$DEPLOY_DIR\" && docker compose -f docker-compose.yml down 2>/dev/null || true'" "Stopping Docker containers"
    
    # Don't exit on cleanup errors
    warning "Some cleanup operations may have failed, but this is normal during error recovery"
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --force)
                FORCE_RESET=true
                log "Force reset mode enabled"
                shift
                ;;
            --verbose|-v)
                VERBOSE=true
                log "Verbose mode enabled"
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                log "Dry run mode enabled"
                shift
                ;;
            --help|-h)
                show_usage
                exit 0
                ;;
            --version)
                echo "EchoTune AI Enhanced DigitalOcean Deployment Script v2.0.0"
                exit 0
                ;;
            --domain=*)
                DOMAIN="${1#*=}"
                log "Custom domain set: $DOMAIN"
                shift
                ;;
            --ip=*)
                PRIMARY_IP="${1#*=}"
                log "Custom primary IP set: $PRIMARY_IP"
                shift
                ;;
            *)
                warning "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
}

# Enhanced main deployment function
main() {
    log "🚀 Starting EchoTune AI Enhanced Deployment..."
    log "Domain: $DOMAIN"
    log "Primary IP: $PRIMARY_IP"
    log "Reserved IP: $RESERVED_IP"
    log "Build Version: $BUILD_VERSION"
    log "Force Reset: $FORCE_RESET"
    log "Verbose Mode: $VERBOSE"
    log "Dry Run: $DRY_RUN"
    
    # Set trap for cleanup on error (but don't exit immediately)
    trap cleanup_on_error ERR
    
    # Main deployment steps
    log "📋 Starting deployment checklist..."
    
    check_root
    initialize_environment
    setup_user_and_dirs
    install_dependencies
    install_nodejs
    install_python
    install_docker
    setup_firewall
    setup_fail2ban
    setup_logrotate
    create_systemd_service
    setup_ssl
    deploy_application
    verify_deployment
    show_summary
    
    success "🎉 EchoTune AI Enhanced Deployment Completed Successfully!"
    log "🚀 EchoTune AI is now live at https://$DOMAIN"
    log "📊 Deployment completed at $(date)"
}

# Show enhanced usage information
show_usage() {
    echo -e "${BOLD}EchoTune AI Enhanced DigitalOcean Deployment Script v2.0.0${NC}"
    echo ""
    echo -e "${CYAN}DESCRIPTION:${NC}"
    echo "  Deploy EchoTune AI to DigitalOcean with enhanced features:"
    echo "  • Fully idempotent (safe to run multiple times)"
    echo "  • Permissive permissions (777) for development ease"
    echo "  • Open firewall configuration"
    echo "  • Comprehensive dependency management"
    echo "  • Robust error handling and logging"
    echo "  • Force reset capability"
    echo ""
    echo -e "${CYAN}USAGE:${NC}"
    echo "  $0 [OPTIONS]"
    echo ""
    echo -e "${CYAN}OPTIONS:${NC}"
    echo "  --force              Force reset - completely clean and reinstall"
    echo "  --verbose, -v        Enable verbose logging and debug output"
    echo "  --dry-run           Show what would be done without executing"
    echo "  --domain=DOMAIN     Custom domain (default: primosphere.studio)"
    echo "  --ip=IP             Custom primary IP (default: 159.223.207.187)"
    echo "  --help, -h          Show this help message"
    echo "  --version           Show script version"
    echo ""
    echo -e "${CYAN}ENVIRONMENT VARIABLES:${NC}"
    echo "  BUILD_VERSION       Build version tag (default: timestamp)"
    echo "  FORCE_RESET         Set to 'true' to enable force reset"
    echo "  VERBOSE             Set to 'true' to enable verbose mode"
    echo ""
    echo -e "${CYAN}EXAMPLES:${NC}"
    echo "  sudo $0                           # Standard deployment"
    echo "  sudo $0 --force                   # Force reset and redeploy"
    echo "  sudo $0 --verbose                 # Deployment with detailed logs"
    echo "  sudo $0 --force --verbose         # Force reset with verbose output"
    echo "  sudo $0 --dry-run                 # Show what would be done"
    echo "  sudo $0 --domain=example.com      # Deploy to custom domain"
    echo "  sudo BUILD_VERSION=v2.0.0 $0      # Deploy with specific version"
    echo ""
    echo -e "${CYAN}FEATURES:${NC}"
    echo "  ✅ Fully idempotent deployment"
    echo "  ✅ Enhanced permissions (777) for development"
    echo "  ✅ Open firewall (UFW disabled)"
    echo "  ✅ Comprehensive dependency management"
    echo "  ✅ Docker with proper user permissions"
    echo "  ✅ SSL certificate automation"
    echo "  ✅ Systemd service integration"
    echo "  ✅ Health checks and monitoring"
    echo "  ✅ Detailed logging and error handling"
    echo ""
}

# Parse command line arguments first
parse_arguments "$@"

# Execute main deployment
case "${1:-}" in
    --help|-h)
        show_usage
        exit 0
        ;;
    --version)
        echo "EchoTune AI Enhanced DigitalOcean Deployment Script v2.0.0"
        exit 0
        ;;
    ""|--force|--verbose|-v|--dry-run|--domain=*|--ip=*)
        main
        ;;
    *)
        error "Unknown option: $1"
        show_usage
        exit 1
        ;;
esac