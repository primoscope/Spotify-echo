#!/bin/bash

# ===================================================================
# EchoTune AI - Ubuntu DigitalOcean Complete Installation Script
# 
# This script provides complete Ubuntu server setup for DigitalOcean
# deployment including system preparation, Docker installation,
# security hardening, and EchoTune AI application deployment.
#
# Features:
# - Ubuntu 20.04/22.04 LTS optimized installation
# - DigitalOcean droplet specific optimizations
# - Docker and Docker Compose installation
# - Nginx with SSL certificate automation
# - MongoDB and PostgreSQL database setup options
# - Security hardening and firewall configuration
# - Complete EchoTune AI application deployment
# ===================================================================

set -euo pipefail

# Script metadata
SCRIPT_VERSION="1.0.0"
SCRIPT_NAME="EchoTune AI - Ubuntu DigitalOcean Installer"

# Configuration
APP_NAME="echotune"
APP_USER="echotune"
APP_DIR="/opt/echotune"
REPO_URL="https://github.com/dzp5103/Spotify-echo.git"
DOMAIN="${DOMAIN:-}"
SSL_EMAIL="${SSL_EMAIL:-admin@example.com}"

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
is_ubuntu() { [[ -f /etc/os-release ]] && grep -q "Ubuntu" /etc/os-release; }
get_ubuntu_version() { lsb_release -rs 2>/dev/null || echo "unknown"; }
is_digitalocean() { dmidecode -s system-manufacturer 2>/dev/null | grep -qi "digitalocean" || curl -s --max-time 2 http://169.254.169.254/metadata/v1/vendor_class_id 2>/dev/null | grep -qi "digitalocean"; }

# Print script header
print_header() {
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║                  🚀 ${SCRIPT_NAME} 🚀                  ║${NC}"
    echo -e "${PURPLE}║                               Version ${SCRIPT_VERSION}                               ║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo
    echo -e "${CYAN}Complete Ubuntu DigitalOcean setup for EchoTune AI deployment${NC}"
    echo
}

# Validate system compatibility
validate_system() {
    log_step "Validating system compatibility..."
    
    # Check if running as root
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root (use sudo)"
        exit 1
    fi
    
    # Check Ubuntu version
    if ! is_ubuntu; then
        log_error "This script is designed for Ubuntu systems only"
        exit 1
    fi
    
    local ubuntu_version
    ubuntu_version=$(get_ubuntu_version)
    log_substep "Detected Ubuntu version: $ubuntu_version"
    
    # Verify supported Ubuntu versions
    case "$ubuntu_version" in
        "20.04"|"22.04"|"24.04")
            log_substep "Ubuntu version $ubuntu_version is supported"
            ;;
        *)
            log_warning "Ubuntu version $ubuntu_version may not be fully tested"
            ;;
    esac
    
    # Check if running on DigitalOcean
    if is_digitalocean; then
        log_substep "DigitalOcean droplet detected - applying optimizations"
        export IS_DIGITALOCEAN=true
    else
        log_substep "Non-DigitalOcean system detected"
        export IS_DIGITALOCEAN=false
    fi
    
    # Check available memory
    local total_mem_gb
    total_mem_gb=$(free -g | awk '/^Mem:/{print $2}')
    if [[ $total_mem_gb -lt 2 ]]; then
        log_warning "System has less than 2GB RAM. Minimum 2GB recommended for EchoTune AI"
    else
        log_substep "Available memory: ${total_mem_gb}GB"
    fi
    
    log_success "System validation completed"
}

# Update Ubuntu system packages
update_system() {
    log_step "Updating Ubuntu system packages..."
    
    export DEBIAN_FRONTEND=noninteractive
    
    log_substep "Updating package lists..."
    apt-get update -qq
    
    log_substep "Upgrading system packages..."
    apt-get upgrade -y -qq
    
    log_substep "Installing essential packages..."
    apt-get install -y -qq \
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
        htop \
        nano \
        vim \
        tree \
        jq \
        net-tools \
        dnsutils \
        tmux \
        screen
    
    log_success "System packages updated successfully"
}

# Install Docker and Docker Compose
install_docker() {
    log_step "Installing Docker and Docker Compose..."
    
    if command_exists docker; then
        log_substep "Docker already installed, checking version..."
        docker --version
    else
        log_substep "Installing Docker CE..."
        
        # Add Docker's official GPG key
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        
        # Add Docker repository
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
        
        # Install Docker
        apt-get update -qq
        apt-get install -y -qq docker-ce docker-ce-cli containerd.io
        
        # Start and enable Docker
        systemctl start docker
        systemctl enable docker
        
        log_substep "Docker installed successfully"
    fi
    
    # Install Docker Compose
    if command_exists docker-compose; then
        log_substep "Docker Compose already installed, checking version..."
        docker-compose --version
    else
        log_substep "Installing Docker Compose..."
        
        # Get latest Docker Compose version
        local compose_version
        compose_version=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | jq -r .tag_name)
        
        # Download and install Docker Compose
        curl -L "https://github.com/docker/compose/releases/download/${compose_version}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
        
        # Create symlink for easier access
        ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
        
        log_substep "Docker Compose installed successfully"
    fi
    
    log_success "Docker installation completed"
}

# Install Node.js and npm
install_nodejs() {
    log_step "Installing Node.js and npm..."
    
    if command_exists node; then
        log_substep "Node.js already installed: $(node --version)"
    else
        log_substep "Installing Node.js LTS..."
        
        # Install NodeSource repository
        curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
        
        # Install Node.js
        apt-get install -y -qq nodejs
        
        log_substep "Node.js installed: $(node --version)"
        log_substep "npm installed: $(npm --version)"
    fi
    
    # Install common global packages
    log_substep "Installing global npm packages..."
    npm install -g pm2 yarn --silent
    
    log_success "Node.js installation completed"
}

# Install Python and dependencies
install_python() {
    log_step "Installing Python and dependencies..."
    
    # Install Python 3 and pip
    apt-get install -y -qq \
        python3 \
        python3-pip \
        python3-venv \
        python3-dev \
        build-essential \
        libssl-dev \
        libffi-dev
    
    # Update pip
    python3 -m pip install --upgrade pip
    
    # Install common Python packages
    log_substep "Installing common Python packages..."
    python3 -m pip install \
        requests \
        pandas \
        numpy \
        scikit-learn \
        matplotlib \
        seaborn \
        jupyter \
        fastapi \
        uvicorn
    
    log_substep "Python installed: $(python3 --version)"
    log_substep "pip installed: $(python3 -m pip --version)"
    
    log_success "Python installation completed"
}

# Install and configure Nginx
install_nginx() {
    log_step "Installing and configuring Nginx..."
    
    if command_exists nginx; then
        log_substep "Nginx already installed"
    else
        log_substep "Installing Nginx..."
        apt-get install -y -qq nginx
    fi
    
    # Start and enable Nginx
    systemctl start nginx
    systemctl enable nginx
    
    # Create basic configuration
    log_substep "Configuring Nginx for EchoTune AI..."
    
    cat > /etc/nginx/sites-available/echotune << 'EOF'
server {
    listen 80;
    server_name _;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/javascript application/xml+rss application/json;
    
    # Main application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # MCP Server
    location /mcp/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Static files
    location /static/ {
        alias /opt/echotune/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF
    
    # Enable the site
    ln -sf /etc/nginx/sites-available/echotune /etc/nginx/sites-enabled/
    
    # Remove default site
    rm -f /etc/nginx/sites-enabled/default
    
    # Test configuration
    nginx -t
    
    # Reload Nginx
    systemctl reload nginx
    
    log_success "Nginx installation and configuration completed"
}

# Install SSL certificate with Certbot
install_ssl() {
    if [[ -z "$DOMAIN" ]]; then
        log_warning "No domain specified, skipping SSL certificate installation"
        log_substep "To install SSL later, set DOMAIN environment variable and run:"
        log_substep "DOMAIN=yourdomain.com SSL_EMAIL=your@email.com ./ubuntu-digitalocean-install.sh --ssl-only"
        return 0
    fi
    
    log_step "Installing SSL certificate for domain: $DOMAIN"
    
    # Install Certbot
    if ! command_exists certbot; then
        log_substep "Installing Certbot..."
        apt-get install -y -qq snapd
        snap install core; snap refresh core
        snap install --classic certbot
        ln -sf /snap/bin/certbot /usr/bin/certbot
    fi
    
    # Stop Nginx temporarily
    systemctl stop nginx
    
    # Obtain SSL certificate
    log_substep "Obtaining SSL certificate..."
    certbot certonly --standalone \
        --email "$SSL_EMAIL" \
        --agree-tos \
        --no-eff-email \
        -d "$DOMAIN" \
        --non-interactive
    
    # Update Nginx configuration for SSL
    log_substep "Updating Nginx configuration for SSL..."
    
    cat > /etc/nginx/sites-available/echotune << EOF
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
    
    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/javascript application/xml+rss application/json;
    
    # Main application
    location / {
        proxy_pass http://localhost:3000;
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
    
    # MCP Server
    location /mcp/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Static files
    location /static/ {
        alias /opt/echotune/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF
    
    # Start Nginx
    systemctl start nginx
    systemctl reload nginx
    
    # Set up automatic renewal
    log_substep "Setting up automatic SSL renewal..."
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --renew-hook 'systemctl reload nginx'") | crontab -
    
    log_success "SSL certificate installed and configured for $DOMAIN"
}

# Configure firewall
configure_firewall() {
    log_step "Configuring UFW firewall..."
    
    # Reset UFW
    ufw --force reset
    
    # Default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH
    ufw allow ssh
    ufw allow 22/tcp
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Allow application ports (if needed for direct access)
    ufw allow 3000/tcp comment "EchoTune AI main app"
    ufw allow 3001/tcp comment "EchoTune AI MCP server"
    
    # Enable firewall
    ufw --force enable
    
    # Show status
    log_substep "Firewall rules:"
    ufw status verbose
    
    log_success "Firewall configured successfully"
}

# Configure Fail2Ban
configure_fail2ban() {
    log_step "Configuring Fail2Ban security..."
    
    # Create local configuration
    cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
backend = systemd

[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s
backend = systemd

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 6

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 10

[nginx-botsearch]
enabled = true
filter = nginx-botsearch
logpath = /var/log/nginx/access.log
maxretry = 2
EOF
    
    # Restart Fail2Ban
    systemctl restart fail2ban
    systemctl enable fail2ban
    
    log_substep "Fail2Ban status:"
    fail2ban-client status
    
    log_success "Fail2Ban configured successfully"
}

# Create application user and directories
create_app_user() {
    log_step "Creating application user and directories..."
    
    # Create application user
    if ! id "$APP_USER" &>/dev/null; then
        log_substep "Creating user: $APP_USER"
        useradd --system --home-dir "$APP_DIR" --shell /bin/bash --create-home "$APP_USER"
        
        # Add user to Docker group
        usermod -aG docker "$APP_USER"
    else
        log_substep "User $APP_USER already exists"
    fi
    
    # Create application directories
    log_substep "Creating application directories..."
    mkdir -p "$APP_DIR"/{logs,data,backups,uploads}
    
    # Set permissions
    chown -R "$APP_USER:$APP_USER" "$APP_DIR"
    
    log_success "Application user and directories created"
}

# Install database options
install_databases() {
    log_step "Installing database options..."
    
    # Install MongoDB tools (for connecting to MongoDB Atlas)
    log_substep "Installing MongoDB tools..."
    curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-6.0.gpg
    echo "deb [arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
    apt-get update -qq
    apt-get install -y -qq mongodb-mongosh mongodb-database-tools
    
    # Install PostgreSQL client (for connecting to DigitalOcean Managed Database)
    log_substep "Installing PostgreSQL client..."
    apt-get install -y -qq postgresql-client
    
    # Install Redis client (for caching)
    log_substep "Installing Redis..."
    apt-get install -y -qq redis-server redis-tools
    
    # Configure Redis
    sed -i 's/^bind 127.0.0.1/#bind 127.0.0.1/' /etc/redis/redis.conf
    sed -i 's/^# requirepass/requirepass redis_' /etc/redis/redis.conf
    systemctl restart redis-server
    systemctl enable redis-server
    
    log_success "Database tools installed successfully"
}

# Install doctl with GH_PAT integration
install_doctl_with_ghpat() {
    log_step "Installing doctl with GitHub PAT integration..."
    
    local install_script="./scripts/install-doctl-ghpat.sh"
    
    if [[ -f "$install_script" ]]; then
        log_substep "Running doctl auto-installation script..."
        bash "$install_script"
    else
        log_warning "doctl installation script not found at $install_script"
        log_substep "You can install doctl manually or run the installation script separately"
    fi
    
    log_success "doctl installation completed"
}

# Clone and setup EchoTune AI
setup_application() {
    log_step "Setting up EchoTune AI application..."
    
    # Change to app directory
    cd "$APP_DIR"
    
    # Clone repository if not already present
    if [[ ! -d ".git" ]]; then
        log_substep "Cloning EchoTune AI repository..."
        git clone "$REPO_URL" .
    else
        log_substep "Updating existing repository..."
        git pull origin main
    fi
    
    # Install Node.js dependencies
    log_substep "Installing Node.js dependencies..."
    sudo -u "$APP_USER" npm install --production
    
    # Install Python dependencies
    if [[ -f "requirements.txt" ]]; then
        log_substep "Installing Python dependencies..."
        sudo -u "$APP_USER" python3 -m pip install --user -r requirements.txt
    fi
    
    # Create environment file
    if [[ ! -f ".env" ]]; then
        log_substep "Creating environment configuration..."
        cp .env.production.example .env
        chown "$APP_USER:$APP_USER" .env
        
        log_warning "Please edit /opt/echotune/.env with your configuration:"
        log_substep "SPOTIFY_CLIENT_ID=your_spotify_client_id"
        log_substep "SPOTIFY_CLIENT_SECRET=your_spotify_client_secret"
        log_substep "MONGODB_URI=your_mongodb_connection_string"
        log_substep "And other required environment variables"
    fi
    
    # Create systemd services
    log_substep "Creating systemd services..."
    
    # Main application service
    cat > /etc/systemd/system/echotune.service << EOF
[Unit]
Description=EchoTune AI Music Recommendation System
After=network.target

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=echotune

[Install]
WantedBy=multi-user.target
EOF
    
    # MCP Server service
    cat > /etc/systemd/system/echotune-mcp.service << EOF
[Unit]
Description=EchoTune AI MCP Server
After=network.target

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR/mcp-server
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=echotune-mcp

[Install]
WantedBy=multi-user.target
EOF
    
    # Reload systemd and enable services
    systemctl daemon-reload
    systemctl enable echotune
    systemctl enable echotune-mcp
    
    # Set permissions
    chown -R "$APP_USER:$APP_USER" "$APP_DIR"
    
    log_success "EchoTune AI application setup completed"
}

# Configure monitoring and logging
setup_monitoring() {
    log_step "Setting up monitoring and logging..."
    
    # Configure log rotation
    cat > /etc/logrotate.d/echotune << 'EOF'
/opt/echotune/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    copytruncate
    postrotate
        systemctl reload rsyslog > /dev/null 2>&1 || true
    endscript
}
EOF
    
    # Configure rsyslog for application logs
    cat > /etc/rsyslog.d/30-echotune.conf << 'EOF'
if $programname == 'echotune' then /opt/echotune/logs/app.log
if $programname == 'echotune-mcp' then /opt/echotune/logs/mcp.log
& stop
EOF
    
    systemctl restart rsyslog
    
    # Create simple monitoring script
    cat > /usr/local/bin/echotune-status << 'EOF'
#!/bin/bash

echo "=== EchoTune AI System Status ==="
echo
echo "Services:"
systemctl is-active echotune
systemctl is-active echotune-mcp
systemctl is-active nginx
systemctl is-active redis-server
echo
echo "Resource Usage:"
free -h
df -h /opt/echotune
echo
echo "Recent Logs (last 10 lines):"
tail -10 /opt/echotune/logs/app.log 2>/dev/null || echo "No app logs found"
EOF
    
    chmod +x /usr/local/bin/echotune-status
    
    log_success "Monitoring and logging configured"
}

# Display completion summary
show_completion_summary() {
    echo
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║               🎉 EchoTune AI Installation Completed Successfully! 🎉               ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo
    
    log_success "Ubuntu DigitalOcean installation completed successfully!"
    echo
    
    echo -e "${CYAN}📋 Installation Summary:${NC}"
    echo -e "  • Ubuntu system updated and optimized"
    echo -e "  • Docker and Docker Compose installed"
    echo -e "  • Node.js, Python, and dependencies installed"
    echo -e "  • Nginx configured with security headers"
    if [[ -n "$DOMAIN" ]]; then
        echo -e "  • SSL certificate installed for $DOMAIN"
    fi
    echo -e "  • Firewall configured with UFW"
    echo -e "  • Fail2Ban security configured"
    echo -e "  • Database tools installed"
    echo -e "  • doctl with GH_PAT integration installed"
    echo -e "  • EchoTune AI application deployed"
    echo -e "  • Systemd services created"
    echo -e "  • Monitoring and logging configured"
    echo
    
    echo -e "${YELLOW}🔧 Next Steps:${NC}"
    echo "1. Configure environment variables:"
    echo "   sudo nano /opt/echotune/.env"
    echo
    echo "2. Start the services:"
    echo "   sudo systemctl start echotune"
    echo "   sudo systemctl start echotune-mcp"
    echo
    echo "3. Check system status:"
    echo "   echotune-status"
    echo
    echo "4. View logs:"
    echo "   sudo journalctl -u echotune -f"
    echo "   sudo journalctl -u echotune-mcp -f"
    echo
    
    if [[ -n "$DOMAIN" ]]; then
        echo -e "${CYAN}🌐 Access your application:${NC}"
        echo "   https://$DOMAIN"
    else
        echo -e "${CYAN}🌐 Access your application:${NC}"
        echo "   http://$(curl -s ifconfig.me)"
        echo "   (Configure DOMAIN and SSL for production use)"
    fi
    echo
    
    echo -e "${GREEN}Installation log saved to: /var/log/echotune-install.log${NC}"
    echo
}

# Error handling
cleanup() {
    local exit_code=$?
    if [[ $exit_code -ne 0 ]]; then
        log_error "Installation failed with exit code $exit_code"
        log_info "Check logs for details: /var/log/echotune-install.log"
    fi
    exit $exit_code
}

# Main function
main() {
    # Set up logging
    exec > >(tee -a /var/log/echotune-install.log)
    exec 2>&1
    
    print_header
    
    # Parse arguments
    local ssl_only=false
    while [[ $# -gt 0 ]]; do
        case $1 in
            --ssl-only)
                ssl_only=true
                shift
                ;;
            --domain)
                DOMAIN="$2"
                shift 2
                ;;
            --ssl-email)
                SSL_EMAIL="$2"
                shift 2
                ;;
            -h|--help)
                echo "Usage: $0 [OPTIONS]"
                echo
                echo "Options:"
                echo "  --ssl-only       Only install SSL certificate (requires --domain)"
                echo "  --domain DOMAIN  Set domain name for SSL certificate"
                echo "  --ssl-email EMAIL Set email for SSL certificate"
                echo "  -h, --help       Show this help message"
                echo
                echo "Environment variables:"
                echo "  DOMAIN           Domain name for SSL certificate"
                echo "  SSL_EMAIL        Email for SSL certificate"
                echo "  GH_PAT           GitHub Personal Access Token"
                echo "  DO_API_TOKEN     DigitalOcean API Token"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # If SSL-only mode, just install SSL and exit
    if [[ "$ssl_only" == true ]]; then
        validate_system
        install_ssl
        show_completion_summary
        return 0
    fi
    
    # Full installation
    validate_system
    update_system
    install_docker
    install_nodejs
    install_python
    install_nginx
    install_ssl
    configure_firewall
    configure_fail2ban
    create_app_user
    install_databases
    install_doctl_with_ghpat
    setup_application
    setup_monitoring
    show_completion_summary
}

# Set up signal handlers
trap cleanup EXIT
trap 'log_error "Script interrupted"; exit 130' INT TERM

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi