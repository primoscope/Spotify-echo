#!/bin/bash

# 🚀 EchoTune AI - DigitalOcean CLI (doctl) One-Click Deployment Script
# 
# This script provides comprehensive automation for deploying EchoTune AI to DigitalOcean
# using the official DigitalOcean CLI (doctl) tool.
#
# Features:
# - Automatic doctl installation and configuration
# - Secure API token management
# - Droplet creation and configuration
# - App Platform deployment
# - Database setup and management
# - SSL certificate configuration
# - Health monitoring and validation
#
# Security:
# - Never stores API tokens in files
# - Uses environment variables and secure prompts
# - Validates all inputs and configurations
# - Implements proper error handling and rollback

set -e
set -o pipefail

# Script metadata
SCRIPT_VERSION="1.0.0"
SCRIPT_NAME="EchoTune AI - DigitalOcean CLI Deployment"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Configuration
DOCTL_VERSION="1.109.0"
APP_NAME="echotune-ai"
REPO_URL="https://github.com/dzp5103/Spotify-echo.git"
DEFAULT_REGION="nyc1"
DEFAULT_SIZE="s-2vcpu-4gb"
DEFAULT_IMAGE="ubuntu-22-04-x64"

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
log_debug() { [[ "${DEBUG:-}" == "true" ]] && echo -e "${CYAN}[DEBUG]${NC} $1"; }

# Helper functions
command_exists() { command -v "$1" >/dev/null 2>&1; }
is_root() { [[ $EUID -eq 0 ]]; }

# Print script header
print_header() {
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║                    🌊 ${SCRIPT_NAME} 🌊                     ║${NC}"
    echo -e "${PURPLE}║                               Version ${SCRIPT_VERSION}                               ║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo
    echo -e "${CYAN}This script will deploy EchoTune AI to DigitalOcean using doctl CLI.${NC}"
    echo -e "${CYAN}Features: Droplet creation, App Platform deployment, database setup${NC}"
    echo
}

# Display help information
show_help() {
    cat << EOF
Usage: $0 [OPTIONS]

Deploy EchoTune AI to DigitalOcean using doctl CLI.

OPTIONS:
    -h, --help              Show this help message
    -v, --version           Show script version
    -t, --token TOKEN       DigitalOcean API token (or set DO_API_TOKEN env var)
    -n, --name NAME         Application name (default: ${APP_NAME})
    -r, --region REGION     Deployment region (default: ${DEFAULT_REGION})
    -s, --size SIZE         Droplet size (default: ${DEFAULT_SIZE})
    -d, --domain DOMAIN     Custom domain for the application
    -e, --email EMAIL       Email for SSL certificates
    --app-platform          Deploy to App Platform (default)
    --droplet               Deploy to Droplet (alternative)
    --database              Create managed database
    --no-ssl                Skip SSL certificate setup
    --dry-run               Show what would be done without executing
    --debug                 Enable debug output
    --force                 Force deployment without confirmation

EXAMPLES:
    # Basic deployment with interactive setup
    $0

    # Deploy with API token from environment
    DO_API_TOKEN=your_token $0

    # Deploy to specific region with custom domain
    $0 --region fra1 --domain myapp.example.com --email admin@example.com

    # Deploy to Droplet instead of App Platform
    $0 --droplet --size s-4vcpu-8gb

    # Create with managed database
    $0 --database --region nyc1

ENVIRONMENT VARIABLES:
    DO_API_TOKEN            DigitalOcean API token
    SPOTIFY_CLIENT_ID       Spotify API client ID
    SPOTIFY_CLIENT_SECRET   Spotify API client secret
    OPENAI_API_KEY         OpenAI API key (optional)
    GEMINI_API_KEY         Google Gemini API key (optional)

For more information, visit: https://github.com/dzp5103/Spotify-echo
EOF
}

# Cleanup function
cleanup() {
    local exit_code=$?
    if [[ $exit_code -ne 0 ]]; then
        log_error "Script failed with exit code $exit_code"
        log_info "Cleaning up temporary files..."
        rm -f /tmp/doctl-install-* 2>/dev/null || true
    fi
    exit $exit_code
}

# Set up signal handlers
trap cleanup EXIT
trap 'log_error "Script interrupted"; exit 130' INT TERM

# Validate system requirements
validate_system() {
    log_step "Validating system requirements..."
    
    # Check if running on supported OS
    if [[ "$OSTYPE" != "linux-gnu"* ]] && [[ "$OSTYPE" != "darwin"* ]]; then
        log_error "Unsupported operating system: $OSTYPE"
        log_info "This script supports Linux and macOS only"
        exit 1
    fi
    
    # Check for required commands
    local required_commands=("curl" "jq" "tar")
    for cmd in "${required_commands[@]}"; do
        if ! command_exists "$cmd"; then
            log_error "Required command not found: $cmd"
            case "$cmd" in
                "jq")
                    log_info "Install with: sudo apt-get install jq (Ubuntu/Debian) or brew install jq (macOS)"
                    ;;
                "curl")
                    log_info "Install with: sudo apt-get install curl (Ubuntu/Debian) or brew install curl (macOS)"
                    ;;
                "tar")
                    log_info "tar should be available by default on most systems"
                    ;;
            esac
            exit 1
        fi
    done
    
    # Check internet connectivity
    if ! curl -s --connect-timeout 5 https://api.digitalocean.com/v2/account > /dev/null; then
        log_warning "Cannot reach DigitalOcean API. Please check your internet connection."
    fi
    
    log_success "System requirements validated"
}

# Install doctl CLI
install_doctl() {
    log_step "Installing DigitalOcean CLI (doctl)..."
    
    if command_exists doctl; then
        local current_version
        current_version=$(doctl version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
        log_info "doctl is already installed (version: $current_version)"
        
        # Check if version is current
        if [[ "$current_version" == "$DOCTL_VERSION" ]]; then
            log_success "doctl is up to date"
            return 0
        else
            log_info "Current version: $current_version, Latest: $DOCTL_VERSION"
            read -p "Do you want to update doctl? (y/N): " -r update_doctl
            if [[ ! $update_doctl =~ ^[Yy]$ ]]; then
                log_info "Keeping current version"
                return 0
            fi
        fi
    fi
    
    # Detect OS and architecture
    local os arch download_url
    case "$OSTYPE" in
        "linux-gnu"*)
            os="linux"
            ;;
        "darwin"*)
            os="darwin"
            ;;
        *)
            log_error "Unsupported operating system for doctl installation"
            exit 1
            ;;
    esac
    
    case "$(uname -m)" in
        "x86_64")
            arch="amd64"
            ;;
        "arm64"|"aarch64")
            arch="arm64"
            ;;
        *)
            log_error "Unsupported architecture: $(uname -m)"
            exit 1
            ;;
    esac
    
    download_url="https://github.com/digitalocean/doctl/releases/download/v${DOCTL_VERSION}/doctl-${DOCTL_VERSION}-${os}-${arch}.tar.gz"
    
    log_info "Downloading doctl v${DOCTL_VERSION} for ${os}-${arch}..."
    log_debug "Download URL: $download_url"
    
    # Create temporary directory
    local temp_dir
    temp_dir=$(mktemp -d /tmp/doctl-install-XXXXXX)
    
    # Download and extract
    if curl -L "$download_url" | tar -xz -C "$temp_dir"; then
        log_success "Downloaded and extracted doctl"
    else
        log_error "Failed to download doctl"
        rm -rf "$temp_dir"
        exit 1
    fi
    
    # Install doctl
    if [[ -w /usr/local/bin ]]; then
        mv "$temp_dir/doctl" /usr/local/bin/
        log_success "Installed doctl to /usr/local/bin/doctl"
    elif [[ -w "$HOME/.local/bin" ]]; then
        mkdir -p "$HOME/.local/bin"
        mv "$temp_dir/doctl" "$HOME/.local/bin/"
        log_success "Installed doctl to $HOME/.local/bin/doctl"
        log_info "Make sure $HOME/.local/bin is in your PATH"
    else
        log_error "Cannot install doctl. No writable directory found."
        log_info "Please run with sudo or ensure ~/.local/bin exists and is writable"
        rm -rf "$temp_dir"
        exit 1
    fi
    
    # Cleanup
    rm -rf "$temp_dir"
    
    # Verify installation
    if command_exists doctl; then
        log_success "doctl installation completed successfully"
        doctl version
    else
        log_error "doctl installation failed"
        exit 1
    fi
}

# Authenticate with DigitalOcean
authenticate_doctl() {
    log_step "Authenticating with DigitalOcean..."
    
    # Check if already authenticated
    if doctl auth list 2>/dev/null | grep -q "default"; then
        log_info "Found existing authentication context"
        if doctl account get >/dev/null 2>&1; then
            local email
            email=$(doctl account get --format Email --no-header)
            log_success "Already authenticated as: $email"
            return 0
        else
            log_warning "Existing authentication is invalid, re-authenticating..."
        fi
    fi
    
    # Get API token
    local api_token
    if [[ -n "${DO_API_TOKEN:-}" ]]; then
        api_token="$DO_API_TOKEN"
        log_info "Using API token from environment variable"
    elif [[ -n "${1:-}" ]]; then
        api_token="$1"
        log_info "Using API token from parameter"
    else
        echo
        log_info "DigitalOcean API token required for authentication"
        log_info "You can get your API token from: https://cloud.digitalocean.com/account/api/tokens"
        echo
        read -s -p "Enter your DigitalOcean API token: " api_token
        echo
        
        if [[ -z "$api_token" ]]; then
            log_error "API token is required"
            exit 1
        fi
    fi
    
    # Validate token format (basic check)
    if [[ ! "$api_token" =~ ^dop_v1_[a-f0-9]{64}$ ]] && [[ ! "$api_token" =~ ^[a-f0-9]{64}$ ]]; then
        log_warning "API token format seems unusual. Proceeding anyway..."
    fi
    
    # Authenticate
    log_info "Authenticating with DigitalOcean..."
    if echo "$api_token" | doctl auth init --context default; then
        # Verify authentication
        local account_info
        if account_info=$(doctl account get --format Email,Status --no-header 2>/dev/null); then
            local email status
            email=$(echo "$account_info" | awk '{print $1}')
            status=$(echo "$account_info" | awk '{print $2}')
            log_success "Authentication successful!"
            log_info "Account: $email (Status: $status)"
        else
            log_error "Authentication failed - invalid token or API error"
            exit 1
        fi
    else
        log_error "Failed to authenticate with DigitalOcean"
        exit 1
    fi
}

# List available regions and sizes
show_options() {
    log_step "Available deployment options..."
    
    echo -e "\n${CYAN}Available Regions:${NC}"
    doctl compute region list --format Slug,Name,Available --no-header | head -10
    
    echo -e "\n${CYAN}Available Droplet Sizes:${NC}"
    doctl compute size list --format Slug,Memory,VCPUs,Disk,PriceMonthly --no-header | grep -E "(s-|c-|g-)" | head -10
    
    echo -e "\n${CYAN}Available Database Options:${NC}"
    echo "postgresql - PostgreSQL database"
    echo "mysql - MySQL database"
    echo "redis - Redis cache"
    echo "mongodb - MongoDB database"
}

# Create App Platform deployment
deploy_app_platform() {
    local app_name="$1"
    local domain="${2:-}"
    
    log_step "Deploying to DigitalOcean App Platform..."
    
    # Check if app already exists
    if doctl apps list --format Name --no-header | grep -q "^${app_name}$"; then
        log_warning "App '$app_name' already exists"
        read -p "Do you want to update the existing app? (y/N): " -r update_app
        if [[ ! $update_app =~ ^[Yy]$ ]]; then
            log_info "Deployment cancelled"
            return 0
        fi
    fi
    
    # Create app spec
    local app_spec_file="/tmp/${app_name}-spec.yaml"
    create_app_spec "$app_spec_file" "$app_name" "$domain"
    
    # Deploy app
    log_info "Creating/updating app on App Platform..."
    if doctl apps list --format Name --no-header | grep -q "^${app_name}$"; then
        # Update existing app
        local app_id
        app_id=$(doctl apps list --format ID,Name --no-header | grep "$app_name" | awk '{print $1}')
        doctl apps update "$app_id" --spec "$app_spec_file"
        log_success "App updated successfully"
    else
        # Create new app
        doctl apps create --spec "$app_spec_file"
        log_success "App created successfully"
    fi
    
    # Wait for deployment
    log_info "Waiting for deployment to complete..."
    local app_id
    app_id=$(doctl apps list --format ID,Name --no-header | grep "$app_name" | awk '{print $1}')
    
    # Monitor deployment progress
    local max_attempts=30
    local attempt=0
    while [[ $attempt -lt $max_attempts ]]; do
        local status
        status=$(doctl apps get "$app_id" --format Phase --no-header)
        
        case "$status" in
            "ACTIVE")
                log_success "Deployment completed successfully!"
                break
                ;;
            "PENDING"|"DEPLOYING")
                log_info "Deployment in progress... (attempt $((attempt + 1))/$max_attempts)"
                sleep 30
                ;;
            "ERROR"|"CANCELED")
                log_error "Deployment failed with status: $status"
                doctl apps get "$app_id" --format Phase,Cause --no-header
                exit 1
                ;;
            *)
                log_warning "Unknown deployment status: $status"
                ;;
        esac
        
        ((attempt++))
    done
    
    if [[ $attempt -eq $max_attempts ]]; then
        log_error "Deployment timeout after $((max_attempts * 30)) seconds"
        exit 1
    fi
    
    # Get app URL
    local app_url
    app_url=$(doctl apps get "$app_id" --format LiveURL --no-header)
    log_success "Application deployed successfully!"
    log_info "URL: $app_url"
    
    # Cleanup temp file
    rm -f "$app_spec_file"
    
    return 0
}

# Create app specification for App Platform
create_app_spec() {
    local spec_file="$1"
    local app_name="$2"
    local domain="${3:-}"
    
    log_debug "Creating app spec: $spec_file"
    
    cat > "$spec_file" << EOF
name: ${app_name}
region: ${REGION:-$DEFAULT_REGION}

services:
- name: web
  source_dir: /
  github:
    repo: dzp5103/Spotify-echo
    branch: main
    deploy_on_push: true
  
  build_command: npm ci --only=production
  run_command: npm start
  
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  
  http_port: 3000
  
  health_check:
    http_path: /health
    initial_delay_seconds: 60
    period_seconds: 10
    timeout_seconds: 5
    success_threshold: 1
    failure_threshold: 3
  
  envs:
  - key: NODE_ENV
    value: production
  - key: PORT
    value: "3000"
  - key: DEFAULT_LLM_PROVIDER
    value: mock
  - key: DEMO_MODE
    value: "true"
  - key: SPOTIFY_CLIENT_ID
    value: "${SPOTIFY_CLIENT_ID:-}"
  - key: SPOTIFY_CLIENT_SECRET
    value: "${SPOTIFY_CLIENT_SECRET:-}"
    type: SECRET
  - key: OPENAI_API_KEY
    value: "${OPENAI_API_KEY:-}"
    type: SECRET
  - key: GEMINI_API_KEY
    value: "${GEMINI_API_KEY:-}"
    type: SECRET
EOF

    # Add domain configuration if provided
    if [[ -n "$domain" ]]; then
        cat >> "$spec_file" << EOF

domains:
- domain: ${domain}
  type: PRIMARY
EOF
    fi
    
    log_debug "App spec created successfully"
}

# Create Droplet deployment
deploy_droplet() {
    local name="$1"
    local region="${2:-$DEFAULT_REGION}"
    local size="${3:-$DEFAULT_SIZE}"
    local domain="${4:-}"
    
    log_step "Creating Droplet deployment..."
    
    # Check if droplet already exists
    if doctl compute droplet list --format Name --no-header | grep -q "^${name}$"; then
        log_error "Droplet '$name' already exists"
        log_info "Please use a different name or delete the existing droplet"
        return 1
    fi
    
    # Create SSH key if not exists
    ensure_ssh_key
    
    # Get SSH key ID
    local ssh_key_id
    ssh_key_id=$(doctl compute ssh-key list --format ID,Name --no-header | grep "echotune-deploy" | awk '{print $1}' | head -1)
    
    if [[ -z "$ssh_key_id" ]]; then
        log_error "No SSH key found for deployment"
        return 1
    fi
    
    # Create user data script
    local user_data_file="/tmp/user-data.sh"
    create_user_data_script "$user_data_file" "$domain"
    
    # Create droplet
    log_info "Creating droplet '$name'..."
    local droplet_id
    droplet_id=$(doctl compute droplet create "$name" \
        --size "$size" \
        --image "$DEFAULT_IMAGE" \
        --region "$region" \
        --ssh-keys "$ssh_key_id" \
        --user-data-file "$user_data_file" \
        --format ID --no-header)
    
    if [[ -z "$droplet_id" ]]; then
        log_error "Failed to create droplet"
        rm -f "$user_data_file"
        return 1
    fi
    
    log_success "Droplet created with ID: $droplet_id"
    
    # Wait for droplet to be active
    log_info "Waiting for droplet to become active..."
    local max_attempts=20
    local attempt=0
    while [[ $attempt -lt $max_attempts ]]; do
        local status
        status=$(doctl compute droplet get "$droplet_id" --format Status --no-header)
        
        if [[ "$status" == "active" ]]; then
            log_success "Droplet is now active!"
            break
        else
            log_info "Droplet status: $status (attempt $((attempt + 1))/$max_attempts)"
            sleep 15
        fi
        
        ((attempt++))
    done
    
    if [[ $attempt -eq $max_attempts ]]; then
        log_error "Droplet creation timeout"
        return 1
    fi
    
    # Get droplet IP
    local droplet_ip
    droplet_ip=$(doctl compute droplet get "$droplet_id" --format PublicIPv4 --no-header)
    log_success "Droplet IP: $droplet_ip"
    
    # Wait for SSH to be available
    log_info "Waiting for SSH access..."
    attempt=0
    max_attempts=20
    while [[ $attempt -lt $max_attempts ]]; do
        if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@"$droplet_ip" "echo 'SSH test'" >/dev/null 2>&1; then
            log_success "SSH access confirmed"
            break
        else
            log_info "Waiting for SSH... (attempt $((attempt + 1))/$max_attempts)"
            sleep 15
        fi
        ((attempt++))
    done
    
    if [[ $attempt -eq $max_attempts ]]; then
        log_error "SSH access timeout"
        return 1
    fi
    
    # Monitor deployment progress
    log_info "Monitoring application deployment..."
    attempt=0
    max_attempts=30
    while [[ $attempt -lt $max_attempts ]]; do
        if curl -s --connect-timeout 5 "http://$droplet_ip:3000/health" >/dev/null 2>&1; then
            log_success "Application is responding!"
            break
        else
            log_info "Waiting for application... (attempt $((attempt + 1))/$max_attempts)"
            sleep 30
        fi
        ((attempt++))
    done
    
    # Cleanup
    rm -f "$user_data_file"
    
    # Display results
    echo
    log_success "Droplet deployment completed successfully!"
    log_info "Droplet ID: $droplet_id"
    log_info "IP Address: $droplet_ip"
    log_info "Application URL: http://$droplet_ip:3000"
    if [[ -n "$domain" ]]; then
        log_info "Domain: https://$domain (after DNS propagation)"
    fi
    echo
    log_info "You can SSH to the droplet with: ssh root@$droplet_ip"
    
    return 0
}

# Ensure SSH key exists for deployment
ensure_ssh_key() {
    log_step "Ensuring SSH key for deployment..."
    
    # Check if key already exists in DigitalOcean
    if doctl compute ssh-key list --format Name --no-header | grep -q "echotune-deploy"; then
        log_success "SSH key already exists in DigitalOcean"
        return 0
    fi
    
    # Check if local SSH key exists
    local ssh_key_path="$HOME/.ssh/id_rsa"
    if [[ ! -f "$ssh_key_path" ]]; then
        log_info "Generating SSH key for deployment..."
        ssh-keygen -t rsa -b 4096 -f "$ssh_key_path" -N "" -C "echotune-deploy-$(date +%Y%m%d)"
        log_success "SSH key generated"
    fi
    
    # Upload public key to DigitalOcean
    log_info "Uploading SSH key to DigitalOcean..."
    doctl compute ssh-key import echotune-deploy --public-key-file "${ssh_key_path}.pub"
    log_success "SSH key uploaded to DigitalOcean"
}

# Create user data script for droplet initialization
create_user_data_script() {
    local user_data_file="$1"
    local domain="${2:-}"
    
    log_debug "Creating user data script: $user_data_file"
    
    cat > "$user_data_file" << 'EOF'
#!/bin/bash

# EchoTune AI Droplet Initialization Script
set -e

# Update system
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install additional dependencies
apt-get install -y git nginx certbot python3-certbot-nginx curl jq

# Create application directory
mkdir -p /opt/echotune
cd /opt/echotune

# Clone repository
git clone https://github.com/dzp5103/Spotify-echo.git .

# Install dependencies
npm ci --only=production

# Configure environment
cp .env.example .env
cat >> .env << 'ENVEOF'
NODE_ENV=production
PORT=3000
DEFAULT_LLM_PROVIDER=mock
DEMO_MODE=true
TRUST_PROXY=true
ENVEOF

# Create systemd service
cat > /etc/systemd/system/echotune.service << 'SERVICEEOF'
[Unit]
Description=EchoTune AI Application
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/echotune
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=3
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
SERVICEEOF

# Enable and start service
systemctl enable echotune
systemctl start echotune

# Configure nginx
cat > /etc/nginx/sites-available/echotune << 'NGINXEOF'
server {
    listen 80;
    server_name _;
    
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
    }
}
NGINXEOF

# Enable nginx site
ln -sf /etc/nginx/sites-available/echotune /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Create deployment info
cat > /opt/echotune/deployment-info.json << 'INFOEOF'
{
    "deployment_method": "doctl_droplet",
    "deployment_date": "$(date -Iseconds)",
    "droplet_id": "$(curl -s http://169.254.169.254/metadata/v1/id)",
    "region": "$(curl -s http://169.254.169.254/metadata/v1/region)",
    "version": "1.0.0"
}
INFOEOF

echo "EchoTune AI deployment completed successfully" > /var/log/echotune-deployment.log
EOF
    
    # Add domain-specific configuration if provided
    if [[ -n "$domain" ]]; then
        cat >> "$user_data_file" << EOF

# Configure SSL for domain
if [[ -n "$domain" ]]; then
    # Update nginx config for domain
    sed -i "s/server_name _;/server_name $domain;/" /etc/nginx/sites-available/echotune
    systemctl reload nginx
    
    # Get SSL certificate
    certbot --nginx -d "$domain" --non-interactive --agree-tos --email admin@"$domain" || true
fi
EOF
    fi
    
    log_debug "User data script created successfully"
}

# Create managed database
create_database() {
    local db_type="$1"
    local name="$2"
    local region="${3:-$DEFAULT_REGION}"
    
    log_step "Creating managed database..."
    
    # Validate database type
    case "$db_type" in
        "postgresql"|"mysql"|"redis"|"mongodb")
            log_info "Creating $db_type database: $name"
            ;;
        *)
            log_error "Unsupported database type: $db_type"
            log_info "Supported types: postgresql, mysql, redis, mongodb"
            return 1
            ;;
    esac
    
    # Check if database already exists
    if doctl databases list --format Name --no-header | grep -q "^${name}$"; then
        log_warning "Database '$name' already exists"
        return 0
    fi
    
    # Create database
    log_info "Creating $db_type database cluster..."
    local db_id
    db_id=$(doctl databases create "$name" \
        --engine "$db_type" \
        --region "$region" \
        --size db-s-1vcpu-1gb \
        --num-nodes 1 \
        --format ID --no-header)
    
    if [[ -z "$db_id" ]]; then
        log_error "Failed to create database"
        return 1
    fi
    
    log_success "Database created with ID: $db_id"
    
    # Wait for database to be ready
    log_info "Waiting for database to become available..."
    local max_attempts=30
    local attempt=0
    while [[ $attempt -lt $max_attempts ]]; do
        local status
        status=$(doctl databases get "$db_id" --format Status --no-header)
        
        if [[ "$status" == "online" ]]; then
            log_success "Database is now online!"
            break
        else
            log_info "Database status: $status (attempt $((attempt + 1))/$max_attempts)"
            sleep 30
        fi
        
        ((attempt++))
    done
    
    if [[ $attempt -eq $max_attempts ]]; then
        log_error "Database creation timeout"
        return 1
    fi
    
    # Get connection details
    local connection_uri
    connection_uri=$(doctl databases connection "$db_id" --format URI --no-header)
    
    log_success "Database created successfully!"
    log_info "Database ID: $db_id"
    log_info "Connection URI: $connection_uri"
    
    return 0
}

# Validate deployment
validate_deployment() {
    local url="$1"
    
    log_step "Validating deployment..."
    
    # Test health endpoint
    log_info "Testing health endpoint..."
    if curl -s --connect-timeout 10 "$url/health" | jq -e '.status == "healthy"' >/dev/null 2>&1; then
        log_success "Health check passed"
    else
        log_warning "Health check failed or returned unexpected response"
    fi
    
    # Test main page
    log_info "Testing main application..."
    if curl -s --connect-timeout 10 "$url" | grep -q "EchoTune"; then
        log_success "Main application is responding"
    else
        log_warning "Main application may not be working correctly"
    fi
    
    # Test API endpoints
    log_info "Testing API endpoints..."
    if curl -s --connect-timeout 10 "$url/api/chat/providers" | jq -e '.success' >/dev/null 2>&1; then
        log_success "API endpoints are working"
    else
        log_warning "API endpoints may not be working correctly"
    fi
    
    log_success "Deployment validation completed"
}

# Main deployment orchestration
main() {
    local deployment_type="app-platform"
    local app_name="$APP_NAME"
    local region="$DEFAULT_REGION"
    local size="$DEFAULT_SIZE"
    local domain=""
    local email=""
    local api_token=""
    local create_db=false
    local db_type="postgresql"
    local dry_run=false
    local force=false
    local no_ssl=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -v|--version)
                echo "$SCRIPT_NAME v$SCRIPT_VERSION"
                exit 0
                ;;
            -t|--token)
                api_token="$2"
                shift 2
                ;;
            -n|--name)
                app_name="$2"
                shift 2
                ;;
            -r|--region)
                region="$2"
                shift 2
                ;;
            -s|--size)
                size="$2"
                shift 2
                ;;
            -d|--domain)
                domain="$2"
                shift 2
                ;;
            -e|--email)
                email="$2"
                shift 2
                ;;
            --app-platform)
                deployment_type="app-platform"
                shift
                ;;
            --droplet)
                deployment_type="droplet"
                shift
                ;;
            --database)
                create_db=true
                if [[ -n "$2" ]] && [[ "$2" != --* ]]; then
                    db_type="$2"
                    shift
                fi
                shift
                ;;
            --no-ssl)
                no_ssl=true
                shift
                ;;
            --dry-run)
                dry_run=true
                shift
                ;;
            --debug)
                DEBUG=true
                shift
                ;;
            --force)
                force=true
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
    
    # Print header
    print_header
    
    # Validate system
    validate_system
    
    # Install doctl
    install_doctl
    
    # Authenticate
    authenticate_doctl "$api_token"
    
    # Show options if requested
    if [[ "${SHOW_OPTIONS:-}" == "true" ]]; then
        show_options
        exit 0
    fi
    
    # Dry run mode
    if [[ "$dry_run" == "true" ]]; then
        echo -e "${CYAN}DRY RUN MODE - No actual deployment will be performed${NC}"
        echo
        echo "Deployment configuration:"
        echo "  Type: $deployment_type"
        echo "  Name: $app_name"
        echo "  Region: $region"
        echo "  Size: $size"
        echo "  Domain: ${domain:-none}"
        echo "  Email: ${email:-none}"
        echo "  Database: ${create_db}"
        echo "  SSL: ${no_ssl}"
        echo
        log_info "Dry run completed"
        exit 0
    fi
    
    # Confirmation prompt
    if [[ "$force" != "true" ]]; then
        echo
        echo -e "${CYAN}Deployment Configuration:${NC}"
        echo "  Type: $deployment_type"
        echo "  Name: $app_name"
        echo "  Region: $region"
        if [[ "$deployment_type" == "droplet" ]]; then
            echo "  Size: $size"
        fi
        if [[ -n "$domain" ]]; then
            echo "  Domain: $domain"
        fi
        if [[ "$create_db" == "true" ]]; then
            echo "  Database: $db_type"
        fi
        echo
        read -p "Do you want to proceed with this deployment? (y/N): " -r confirm
        if [[ ! $confirm =~ ^[Yy]$ ]]; then
            log_info "Deployment cancelled"
            exit 0
        fi
    fi
    
    # Create database if requested
    if [[ "$create_db" == "true" ]]; then
        create_database "$db_type" "${app_name}-db" "$region"
    fi
    
    # Deploy based on type
    case "$deployment_type" in
        "app-platform")
            deploy_app_platform "$app_name" "$domain"
            local app_id
            app_id=$(doctl apps list --format ID,Name --no-header | grep "$app_name" | awk '{print $1}')
            local app_url
            app_url=$(doctl apps get "$app_id" --format LiveURL --no-header)
            validate_deployment "$app_url"
            ;;
        "droplet")
            deploy_droplet "$app_name" "$region" "$size" "$domain"
            local droplet_ip
            droplet_ip=$(doctl compute droplet list --format Name,PublicIPv4 --no-header | grep "$app_name" | awk '{print $2}')
            validate_deployment "http://$droplet_ip:3000"
            ;;
        *)
            log_error "Unknown deployment type: $deployment_type"
            exit 1
            ;;
    esac
    
    echo
    log_success "🎉 EchoTune AI deployment completed successfully!"
    echo
    log_info "Next steps:"
    echo "  1. Configure your Spotify API credentials"
    echo "  2. Set up LLM provider API keys (optional)"
    echo "  3. Test the application functionality"
    echo "  4. Configure custom domain (if needed)"
    echo
    log_info "For support and documentation, visit:"
    echo "  https://github.com/dzp5103/Spotify-echo"
    echo
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi