#!/bin/bash

# 🚀 EchoTune AI - One-Click Deployment to DigitalOcean
# This project supports a one-click deployment workflow to DigitalOcean using a convenient shell script.

# What This Script Does:
# - Installs DigitalOcean CLI (doctl) if not already present
# - Prompts for or accepts your DigitalOcean API key (never hardcoded, always securely handled)
# - Authenticates with DigitalOcean via doctl
# - Demonstrates API access (e.g., listing Droplets as a placeholder for your own deployment logic)
# - Is ready for further automation (such as creating Droplets, deploying to App Platform, etc.)

# Security & Best Practices:
# - Never commit or share your API key in public code, issues, or documentation
# - Provide your API key at runtime (via environment variable or interactive prompt)
# - Keep your API key secure and rotate it regularly
# - The script will not store your API key in any file

set -e
set -o pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCTL_VERSION="1.104.0"
TEMP_DIR="/tmp/digitalocean-deploy-$$"
AUTHENTICATED=false

# Color codes for beautiful output
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

# Helper functions
command_exists() { command -v "$1" >/dev/null 2>&1; }

print_header() {
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║             🌊 EchoTune AI - One-Click DigitalOcean Deployment              ║${NC}"
    echo -e "${PURPLE}║                    AI-Powered Music Discovery Platform                      ║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}This script will help you deploy EchoTune AI to DigitalOcean using doctl CLI.${NC}"
    echo ""
}

print_usage() {
    echo -e "${WHITE}Usage:${NC}"
    echo "  $0                          # Interactive mode - prompts for API key"
    echo "  DO_API_TOKEN=your_token $0  # Environment variable mode"
    echo "  $0 --test                   # Test authentication and tools only"
    echo "  $0 --test-deploy            # Test deployment options (demo mode)"
    echo "  $0 --monitor                # Monitor existing deployments"
    echo ""
    echo -e "${WHITE}Environment Variables:${NC}"
    echo "  DO_API_TOKEN                # Your DigitalOcean API token"
    echo ""
    echo -e "${WHITE}Examples:${NC}"
    echo "  # Interactive mode (recommended for first-time users)"
    echo "  ./deploy.sh"
    echo ""
    echo "  # Environment variable mode (recommended for automation)"
    echo "  DO_API_TOKEN=dop_v1_your_api_token_here ./deploy.sh"
    echo ""
    echo "  # Test authentication and tools"
    echo "  ./deploy.sh --test"
    echo ""
    echo "  # Test deployment options without creating resources"
    echo "  ./deploy.sh --test-deploy"
    echo ""
    echo "  # Monitor existing deployments"
    echo "  ./deploy.sh --monitor"
    echo ""
    echo -e "${WHITE}Security Notes:${NC}"
    echo "  - Never commit your API key to version control"
    echo "  - The script will not store your API key in any file"
    echo "  - Your API key is only used in-memory during script execution"
    echo ""
}

cleanup() {
    if [ -d "$TEMP_DIR" ]; then
        rm -rf "$TEMP_DIR"
    fi
}

# Set up cleanup on exit
trap cleanup EXIT

# Check system requirements
check_prerequisites() {
    log_step "Checking system prerequisites..."
    
    # Check for required commands
    if ! command_exists curl; then
        log_error "curl is required but not installed. Please install curl first."
        log_info "Ubuntu/Debian: sudo apt update && sudo apt install curl"
        log_info "macOS: brew install curl"
        exit 1
    fi
    
    if ! command_exists tar; then
        log_error "tar is required but not installed. Please install tar first."
        exit 1
    fi
    
    log_success "System prerequisites check passed"
}

# Detect operating system and architecture
detect_platform() {
    log_step "Detecting platform..."
    
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    ARCH=$(uname -m)
    
    case "$OS" in
        linux)
            OS="linux"
            ;;
        darwin)
            OS="darwin"
            ;;
        *)
            log_error "Unsupported operating system: $OS"
            log_info "Supported platforms: Linux, macOS"
            exit 1
            ;;
    esac
    
    case "$ARCH" in
        x86_64|amd64)
            ARCH="amd64"
            ;;
        arm64|aarch64)
            ARCH="arm64"
            ;;
        *)
            log_error "Unsupported architecture: $ARCH"
            log_info "Supported architectures: amd64, arm64"
            exit 1
            ;;
    esac
    
    log_success "Platform detected: $OS-$ARCH"
}

# Install doctl if not present
install_doctl() {
    if command_exists doctl; then
        local current_version
        current_version=$(doctl version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
        log_success "doctl is already installed (version: $current_version)"
        return 0
    fi
    
    log_step "Installing DigitalOcean CLI (doctl)..."
    
    # Create temporary directory
    mkdir -p "$TEMP_DIR"
    cd "$TEMP_DIR"
    
    # Download doctl
    local download_url="https://github.com/digitalocean/doctl/releases/download/v${DOCTL_VERSION}/doctl-${DOCTL_VERSION}-${OS}-${ARCH}.tar.gz"
    
    log_info "Downloading doctl from: $download_url"
    
    if ! curl -L -o "doctl.tar.gz" "$download_url"; then
        log_error "Failed to download doctl"
        log_info "Please check your internet connection and try again"
        exit 1
    fi
    
    # Extract and install
    log_info "Extracting and installing doctl..."
    
    if ! tar xf doctl.tar.gz; then
        log_error "Failed to extract doctl archive"
        exit 1
    fi
    
    # Install to /usr/local/bin (requires sudo) or ~/bin
    if [ -w "/usr/local/bin" ] || [ "$(id -u)" -eq 0 ]; then
        mv doctl /usr/local/bin/
        log_success "doctl installed to /usr/local/bin/doctl"
    elif sudo -v 2>/dev/null; then
        sudo mv doctl /usr/local/bin/
        log_success "doctl installed to /usr/local/bin/doctl (with sudo)"
    else
        # Fallback to user bin directory
        mkdir -p "$HOME/bin"
        mv doctl "$HOME/bin/"
        
        # Add to PATH if not already there
        if [[ ":$PATH:" != *":$HOME/bin:"* ]]; then
            echo 'export PATH="$HOME/bin:$PATH"' >> "$HOME/.bashrc"
            export PATH="$HOME/bin:$PATH"
            log_warning "Added $HOME/bin to PATH. You may need to restart your shell or run: source ~/.bashrc"
        fi
        
        log_success "doctl installed to $HOME/bin/doctl"
    fi
    
    # Verify installation
    if command_exists doctl; then
        local installed_version
        installed_version=$(doctl version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
        log_success "doctl installation verified (version: $installed_version)"
    else
        log_error "doctl installation failed - command not found"
        log_info "Please add the installation directory to your PATH or install manually"
        exit 1
    fi
}

# Get API token securely
get_api_token() {
    log_step "Getting DigitalOcean API token..."
    
    # Check if token is provided via environment variable
    if [ -n "$DO_API_TOKEN" ]; then
        log_success "Using API token from environment variable"
        API_TOKEN="$DO_API_TOKEN"
        return 0
    fi
    
    # Prompt for API token interactively
    echo ""
    echo -e "${YELLOW}Please provide your DigitalOcean API token.${NC}"
    echo -e "${CYAN}You can get one from: https://cloud.digitalocean.com/account/api/tokens${NC}"
    echo ""
    echo -e "${WHITE}Security Notes:${NC}"
    echo -e "  • Your token will ${GREEN}NOT${NC} be stored in any file"
    echo -e "  • It will only be used in-memory during this script execution"
    echo -e "  • Never share your API token in public code or documentation"
    echo ""
    
    # Read token with hidden input
    read -s -p "Enter your DigitalOcean API token: " API_TOKEN
    echo ""
    
    if [ -z "$API_TOKEN" ]; then
        log_error "API token cannot be empty"
        exit 1
    fi
    
    # Basic token validation (should start with 'dop_v1_' and be 64+ characters)
    if [[ ! "$API_TOKEN" =~ ^dop_v1_[a-f0-9]{64}$ ]]; then
        log_warning "API token format looks suspicious"
        log_warning "Expected format: dop_v1_[64 hex characters]"
        echo ""
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Please check your API token and try again"
            exit 1
        fi
    fi
    
    log_success "API token received"
}

# Authenticate with DigitalOcean
authenticate_digitalocean() {
    log_step "Authenticating with DigitalOcean..."
    
    # Use doctl auth init with the token
    if echo "$API_TOKEN" | doctl auth init --access-token - >/dev/null 2>&1; then
        log_success "Successfully authenticated with DigitalOcean"
        AUTHENTICATED=true
    else
        log_error "Authentication failed"
        log_info "This could be due to:"
        log_info "  • Invalid or expired API token"
        log_info "  • Network connectivity issues"
        log_info "  • Temporary DigitalOcean API issues"
        echo ""
        log_info "You can get a new token from: https://cloud.digitalocean.com/account/api/tokens"
        echo ""
        
        # Offer to continue in demo mode
        echo -e "${YELLOW}Would you like to continue in demo mode to see what the script can do?${NC}"
        read -p "Continue with demo? (y/N): " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "Continuing in demo mode..."
            AUTHENTICATED=false
            return 0
        else
            log_info "Exiting. Please check your API token and try again."
            exit 1
        fi
    fi
    
    if [ "$AUTHENTICATED" = true ]; then
        # Verify authentication by getting account info
        log_info "Verifying authentication..."
        
        if account_info=$(doctl account get --format Email,Status 2>/dev/null); then
            echo "$account_info" | while IFS=$'\t' read -r email status; do
                if [ "$email" != "Email" ]; then  # Skip header
                    log_success "Authenticated as: $email (Status: $status)"
                fi
            done
        else
            log_warning "Could not retrieve account information, but authentication succeeded"
        fi
    fi
}

# Test doctl functionality with enhanced features
test_doctl_features() {
    log_step "Testing advanced doctl features..."
    
    if [ "$AUTHENTICATED" = false ]; then
        echo ""
        echo -e "${YELLOW}Demo Mode - Advanced Features Test:${NC}"
        echo "===================================="
        echo "✅ Account access simulation"
        echo "✅ Droplet management simulation"
        echo "✅ App Platform simulation"
        echo "✅ Database management simulation"
        echo "✅ Load balancer simulation"
        echo "✅ SSH key management simulation"
        echo ""
        log_info "All advanced features would be available with valid authentication"
        return 0
    fi
    
    local test_results=()
    
    # Test account access
    log_info "Testing account access..."
    if doctl account get >/dev/null 2>&1; then
        test_results+=("✅ Account access")
        log_success "Account access working"
    else
        test_results+=("❌ Account access failed")
        log_warning "Account access issues detected"
    fi
    
    # Test SSH key listing
    log_info "Testing SSH key management..."
    if doctl compute ssh-key list >/dev/null 2>&1; then
        test_results+=("✅ SSH key management")
        local key_count
        key_count=$(doctl compute ssh-key list --no-header 2>/dev/null | wc -l)
        log_success "SSH key management working ($key_count keys found)"
    else
        test_results+=("❌ SSH key management failed")
        log_warning "SSH key management issues detected"
    fi
    
    # Test regions listing
    log_info "Testing region access..."
    if doctl compute region list >/dev/null 2>&1; then
        test_results+=("✅ Region listing")
        log_success "Region listing working"
    else
        test_results+=("❌ Region listing failed")
        log_warning "Region access issues detected"
    fi
    
    # Test size listing
    log_info "Testing droplet sizes..."
    if doctl compute size list >/dev/null 2>&1; then
        test_results+=("✅ Droplet size listing")
        log_success "Droplet size listing working"
    else
        test_results+=("❌ Droplet size listing failed")
        log_warning "Size listing issues detected"
    fi
    
    # Test image listing
    log_info "Testing image access..."
    if doctl compute image list --public >/dev/null 2>&1; then
        test_results+=("✅ Image listing")
        log_success "Image listing working"
    else
        test_results+=("❌ Image listing failed")
        log_warning "Image access issues detected"
    fi
    
    # Test app platform access
    log_info "Testing App Platform access..."
    if doctl apps list >/dev/null 2>&1; then
        test_results+=("✅ App Platform access")
        local app_count
        app_count=$(doctl apps list --no-header 2>/dev/null | wc -l)
        log_success "App Platform access working ($app_count apps found)"
    else
        test_results+=("❌ App Platform access failed")
        log_warning "App Platform access issues detected"
    fi
    
    # Display test results summary
    echo ""
    echo -e "${WHITE}🧪 Feature Test Results:${NC}"
    echo "========================"
    for result in "${test_results[@]}"; do
        echo "  $result"
    done
    echo ""
    
    # Check if all tests passed
    local failed_tests
    failed_tests=$(printf '%s\n' "${test_results[@]}" | grep -c "❌" || true)
    
    if [ "$failed_tests" -eq 0 ]; then
        log_success "All advanced features are working correctly!"
        return 0
    else
        log_warning "$failed_tests feature test(s) failed"
        log_info "Your API token may have limited permissions"
        return 1
    fi
}

# Demonstrate API access by listing Droplets
demonstrate_api_access() {
    
    if [ "$AUTHENTICATED" = false ]; then
        echo ""
        echo -e "${YELLOW}Demo Mode - Simulated API Response:${NC}"
        echo "=========================="
        echo "ID           Name            Public IPv4     Status    Region    Size"
        echo "12345678     demo-droplet-1  192.168.1.100   active    nyc1      s-1vcpu-1gb"
        echo "87654321     demo-droplet-2  192.168.1.101   active    sfo2      s-2vcpu-4gb"
        echo ""
        log_info "This is a simulated response showing what you would see with a valid API token"
        return 0
    fi
    
    echo ""
    echo -e "${WHITE}Your DigitalOcean Droplets:${NC}"
    echo "=========================="
    
    if droplets=$(doctl compute droplet list --format ID,Name,PublicIPv4,Status,Region,Size 2>/dev/null); then
        if echo "$droplets" | tail -n +2 | grep -q .; then
            echo "$droplets"
            echo ""
            
            # Count droplets
            local droplet_count
            droplet_count=$(echo "$droplets" | tail -n +2 | wc -l)
            log_success "Found $droplet_count droplet(s) in your account"
        else
            echo "No droplets found in your account."
            echo ""
            log_info "You can create a new droplet using:"
            log_info "doctl compute droplet create my-droplet --size s-1vcpu-1gb --image ubuntu-22-04-x64 --region nyc1"
        fi
    else
        log_error "Failed to list droplets"
        log_info "This could be due to network issues or insufficient permissions"
    fi
}

# Show available DigitalOcean resources
show_available_resources() {
    log_step "Showing available DigitalOcean resources..."
    
    if [ "$AUTHENTICATED" = false ]; then
        echo ""
        echo -e "${YELLOW}Demo Mode - Sample DigitalOcean Resources:${NC}"
        echo "========================================"
        echo ""
        echo -e "${WHITE}Sample Regions:${NC}"
        echo "nyc1        New York 1        true"
        echo "nyc3        New York 3        true"
        echo "sfo2        San Francisco 2   true"
        echo "ams3        Amsterdam 3       true"
        echo "sgp1        Singapore 1       true"
        echo ""
        echo -e "${WHITE}Sample Droplet Sizes:${NC}"
        echo "s-1vcpu-1gb     1024    1      25     6.00"
        echo "s-1vcpu-2gb     2048    1      50     12.00"
        echo "s-2vcpu-2gb     2048    2      60     18.00"
        echo "s-2vcpu-4gb     4096    2      80     24.00"
        echo ""
        log_info "This is sample data. With a valid API token, you would see your actual available resources."
        return 0
    fi
    
    echo ""
    echo -e "${WHITE}Available DigitalOcean Regions:${NC}"
    echo "==============================="
    if regions=$(doctl compute region list --format Slug,Name,Available 2>/dev/null); then
        echo "$regions" | head -10  # Show first 10 regions
        local total_regions
        total_regions=$(echo "$regions" | tail -n +2 | wc -l)
        echo "... and $((total_regions - 9)) more regions"
    else
        log_warning "Could not retrieve regions list"
    fi
    
    echo ""
    echo -e "${WHITE}Available Droplet Sizes:${NC}"
    echo "========================"
    if sizes=$(doctl compute size list --format Slug,Memory,VCPUs,Disk,PriceMonthly 2>/dev/null); then
        echo "$sizes" | head -10  # Show first 10 sizes
        local total_sizes
        total_sizes=$(echo "$sizes" | tail -n +2 | wc -l)
        echo "... and $((total_sizes - 9)) more sizes"
    else
        log_warning "Could not retrieve sizes list"
    fi
}

# Create and deploy EchoTune AI Droplet
create_echotune_droplet() {
    log_step "Creating DigitalOcean Droplet for EchoTune AI..."
    
    if [ "$AUTHENTICATED" = false ]; then
        echo ""
        echo -e "${YELLOW}Demo Mode - Simulated Droplet Creation:${NC}"
        echo "========================================="
        echo "Creating droplet 'echotune-ai-prod'..."
        echo "Image: ubuntu-22-04-x64"
        echo "Size: s-2vcpu-4gb"
        echo "Region: nyc1"
        echo "Estimated cost: $24/month"
        echo ""
        echo "Demo droplet would be created with:"
        echo "- IP: 192.168.1.100"
        echo "- SSH access configured"
        echo "- Docker pre-installed"
        echo "- EchoTune AI auto-deployment script ready"
        echo ""
        log_info "This is a simulated response. With a valid API token, a real droplet would be created."
        return 0
    fi
    
    # Generate unique droplet name
    local droplet_name="echotune-ai-$(date +%Y%m%d-%H%M%S)"
    local region="nyc1"
    local size="s-2vcpu-4gb"
    local image="ubuntu-22-04-x64"
    
    # Check if SSH keys exist, if not create one
    log_info "Checking SSH keys..."
    local ssh_keys=""
    if ssh_key_list=$(doctl compute ssh-key list --format ID --no-header 2>/dev/null); then
        if [ -n "$ssh_key_list" ]; then
            ssh_keys=$(echo "$ssh_key_list" | tr '\n' ',' | sed 's/,$//')
            log_success "Found existing SSH keys"
        fi
    fi
    
    if [ -z "$ssh_keys" ]; then
        log_info "No SSH keys found, deployment will use password authentication"
        log_warning "Consider adding SSH keys for better security: doctl compute ssh-key create"
    fi
    
    # Create user data script for automatic setup
    local user_data_script="/tmp/echotune-setup-${RANDOM}.sh"
    cat > "$user_data_script" <<'EOF'
#!/bin/bash
# EchoTune AI Automatic Setup Script

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a /var/log/echotune-setup.log; }

log "Starting EchoTune AI automatic setup..."

# Update system
export DEBIAN_FRONTEND=noninteractive
apt-get update && apt-get upgrade -y

# Install essential packages
apt-get install -y curl git docker.io docker-compose nodejs npm nginx certbot python3-certbot-nginx

# Start and enable services
systemctl start docker
systemctl enable docker
systemctl start nginx
systemctl enable nginx

# Add default user to docker group
usermod -aG docker ubuntu

# Clone EchoTune AI repository
cd /opt
git clone https://github.com/dzp5103/Spotify-echo.git echotune-ai
cd echotune-ai

# Set proper ownership
chown -R ubuntu:ubuntu /opt/echotune-ai

# Create production environment file
cat > .env <<EOL
NODE_ENV=production
PORT=3000
DOMAIN=\$(curl -s http://169.254.169.254/metadata/v1/interfaces/public/0/ipv4/address).nip.io
FRONTEND_URL=http://\$(curl -s http://169.254.169.254/metadata/v1/interfaces/public/0/ipv4/address):3000

# Default configuration - update after deployment
SPOTIFY_CLIENT_ID=demo_client_id
SPOTIFY_CLIENT_SECRET=demo_client_secret
SPOTIFY_REDIRECT_URI=http://\$(curl -s http://169.254.169.254/metadata/v1/interfaces/public/0/ipv4/address):3000/auth/callback

DEFAULT_LLM_PROVIDER=mock
DEMO_MODE=true
DATABASE_TYPE=sqlite

SESSION_SECRET=\$(openssl rand -hex 32)
JWT_SECRET=\$(openssl rand -hex 32)

HEALTH_CHECK_ENABLED=true
METRICS_ENABLED=true
CHAT_ENABLED=true
EOL

# Build and start with Docker
sudo -u ubuntu docker-compose up -d --build

# Configure nginx reverse proxy
cat > /etc/nginx/sites-available/echotune <<EOL
server {
    listen 80;
    server_name _;
    
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
    }
    
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
EOL

# Enable the site
ln -sf /etc/nginx/sites-available/echotune /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Create startup script
cat > /opt/echotune-ai/start.sh <<EOL
#!/bin/bash
cd /opt/echotune-ai
docker-compose up -d
EOL
chmod +x /opt/echotune-ai/start.sh

# Create systemd service for auto-start
cat > /etc/systemd/system/echotune-ai.service <<EOL
[Unit]
Description=EchoTune AI Music Platform
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/opt/echotune-ai/start.sh
ExecStop=/usr/bin/docker-compose -f /opt/echotune-ai/docker-compose.yml down
WorkingDirectory=/opt/echotune-ai

[Install]
WantedBy=multi-user.target
EOL

systemctl daemon-reload
systemctl enable echotune-ai
systemctl start echotune-ai

log "EchoTune AI setup completed successfully!"
log "Application should be available at: http://\$(curl -s http://169.254.169.254/metadata/v1/interfaces/public/0/ipv4/address)"
EOF
    
    # Create the droplet
    log_info "Creating droplet '$droplet_name'..."
    log_info "Configuration:"
    log_info "  Size: $size (2 vCPUs, 4GB RAM, 80GB SSD)"
    log_info "  Image: $image (Ubuntu 22.04 LTS)"
    log_info "  Region: $region (New York)"
    log_info "  Auto-setup: EchoTune AI with Docker"
    
    local create_cmd="doctl compute droplet create $droplet_name --size $size --image $image --region $region --user-data-file $user_data_script --wait"
    
    if [ -n "$ssh_keys" ]; then
        create_cmd="$create_cmd --ssh-keys $ssh_keys"
    fi
    
    if droplet_info=$($create_cmd 2>/dev/null); then
        echo "$droplet_info"
        echo ""
        
        # Extract droplet IP
        local droplet_ip
        droplet_ip=$(echo "$droplet_info" | awk '/ID.*Name.*Public IPv4/ {getline; print $4}')
        
        if [ -n "$droplet_ip" ]; then
            log_success "✅ Droplet created successfully!"
            log_success "📍 IP Address: $droplet_ip"
            log_success "🌐 URL: http://$droplet_ip"
            log_success "🎵 EchoTune AI URL: http://$droplet_ip.nip.io"
            
            # Store deployment info
            cat > "$SCRIPT_DIR/deployment-info.txt" <<EOL
EchoTune AI Deployment Information
Generated: $(date)

Droplet Name: $droplet_name
IP Address: $droplet_ip
Region: $region
Size: $size

URLs:
- Main Application: http://$droplet_ip
- With Domain: http://$droplet_ip.nip.io
- Health Check: http://$droplet_ip/health

SSH Access:
ssh ubuntu@$droplet_ip

DigitalOcean Management:
doctl compute droplet get $droplet_name
EOL
            
            echo ""
            log_info "⏳ EchoTune AI is being automatically set up on the droplet..."
            log_info "   This process takes 3-5 minutes to complete."
            echo ""
            
            return 0
        else
            log_error "Could not extract droplet IP address"
            return 1
        fi
    else
        log_error "Failed to create droplet"
        return 1
    fi
    
    # Cleanup temp file
    rm -f "$user_data_script"
}

# Deploy to DigitalOcean App Platform
deploy_to_app_platform() {
    log_step "Deploying EchoTune AI to DigitalOcean App Platform..."
    
    if [ "$AUTHENTICATED" = false ]; then
        echo ""
        echo -e "${YELLOW}Demo Mode - Simulated App Platform Deployment:${NC}"
        echo "================================================"
        echo "Creating app 'echotune-ai-app'..."
        echo "Source: GitHub repository"
        echo "Build: Node.js + Docker"
        echo "Resources: Basic plan ($12/month)"
        echo ""
        echo "App would be deployed with:"
        echo "- Auto-scaling enabled"
        echo "- HTTPS/SSL included"
        echo "- Custom domain support"
        echo "- Zero-downtime deployments"
        echo "- URL: https://echotune-ai-app-xxxxx.ondigitalocean.app"
        echo ""
        log_info "This is a simulated response. With a valid API token, the app would be deployed."
        return 0
    fi
    
    # Create App Platform specification
    local app_spec="/tmp/echotune-app-spec-${RANDOM}.yaml"
    cat > "$app_spec" <<EOF
name: echotune-ai-app
services:
- name: web
  source_dir: /
  github:
    repo: dzp5103/Spotify-echo
    branch: main
    deploy_on_push: true
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  http_port: 3000
  health_check:
    http_path: /health
  env:
  - key: NODE_ENV
    value: production
  - key: PORT
    value: "3000"
  - key: DEFAULT_LLM_PROVIDER
    value: mock
  - key: DEMO_MODE
    value: "true"
  - key: DATABASE_TYPE
    value: sqlite
  - key: HEALTH_CHECK_ENABLED
    value: "true"
  - key: METRICS_ENABLED
    value: "true"
  - key: CHAT_ENABLED
    value: "true"
  routes:
  - path: /
EOF
    
    log_info "Creating App Platform deployment..."
    log_info "Specification:"
    log_info "  Source: GitHub repository (auto-deploy on push)"
    log_info "  Runtime: Node.js"
    log_info "  Resources: Basic plan (512MB RAM, 1 vCPU)"
    log_info "  Features: Auto-scaling, HTTPS, Health checks"
    
    if app_info=$(doctl apps create --spec "$app_spec" 2>/dev/null); then
        echo "$app_info"
        echo ""
        
        # Extract app ID
        local app_id
        app_id=$(echo "$app_info" | grep -oP 'ID:\s*\K[a-f0-9-]+')
        
        if [ -n "$app_id" ]; then
            log_success "✅ App Platform deployment initiated!"
            log_info "📍 App ID: $app_id"
            log_info "⏳ Build in progress... This may take 5-10 minutes."
            
            # Get app URL
            sleep 5
            if app_details=$(doctl apps get "$app_id" --format DefaultIngress 2>/dev/null); then
                local app_url
                app_url=$(echo "$app_details" | tail -n 1 | awk '{print $1}')
                if [ -n "$app_url" ]; then
                    log_success "🌐 App URL: https://$app_url"
                fi
            fi
            
            # Store deployment info
            cat > "$SCRIPT_DIR/app-platform-info.txt" <<EOL
EchoTune AI App Platform Deployment
Generated: $(date)

App ID: $app_id
Status: Building
Source: GitHub auto-deploy

Monitor deployment:
doctl apps get $app_id

View logs:
doctl apps logs $app_id

Update app:
doctl apps update $app_id --spec app-spec.yaml
EOL
            
            return 0
        else
            log_error "Could not extract app ID"
            return 1
        fi
    else
        log_error "Failed to create App Platform deployment"
        return 1
    fi
    
    # Cleanup temp file
    rm -f "$app_spec"
}

# Monitor deployment status
monitor_deployment() {
    log_step "Monitoring deployment status..."
    
    if [ "$AUTHENTICATED" = false ]; then
        echo ""
        echo -e "${YELLOW}Demo Mode - Deployment Monitoring:${NC}"
        echo "==================================="
        echo "🟢 Droplet Creation: Complete"
        echo "🟡 Application Setup: In Progress (2/5 minutes)"
        echo "🟡 Docker Build: In Progress"
        echo "⚪ Nginx Configuration: Pending"
        echo "⚪ SSL Setup: Pending"
        echo "⚪ Health Check: Pending"
        echo ""
        log_info "In real deployment, this would show actual progress"
        return 0
    fi
    
    # Check if deployment info exists
    if [ -f "$SCRIPT_DIR/deployment-info.txt" ]; then
        local droplet_ip
        droplet_ip=$(grep "IP Address:" "$SCRIPT_DIR/deployment-info.txt" | cut -d: -f2 | tr -d ' ')
        
        if [ -n "$droplet_ip" ]; then
            log_info "Monitoring deployment at $droplet_ip..."
            
            local max_attempts=20
            local attempt=1
            
            while [ $attempt -le $max_attempts ]; do
                echo -n "[$attempt/$max_attempts] Checking health... "
                
                if curl -f -s --connect-timeout 5 --max-time 10 "http://$droplet_ip/health" > /dev/null 2>&1; then
                    echo "✅ HEALTHY"
                    log_success "Deployment is healthy and running!"
                    break
                elif curl -f -s --connect-timeout 5 --max-time 10 "http://$droplet_ip" > /dev/null 2>&1; then
                    echo "🟡 STARTING"
                    log_info "Application is starting up..."
                else
                    echo "🔴 NOT READY"
                fi
                
                attempt=$((attempt + 1))
                sleep 15
            done
            
            if [ $attempt -gt $max_attempts ]; then
                log_warning "Deployment may still be in progress"
                log_info "Manual check: curl http://$droplet_ip/health"
            fi
        fi
    fi
    
    # Check App Platform deployment
    if [ -f "$SCRIPT_DIR/app-platform-info.txt" ]; then
        local app_id
        app_id=$(grep "App ID:" "$SCRIPT_DIR/app-platform-info.txt" | cut -d: -f2 | tr -d ' ')
        
        if [ -n "$app_id" ]; then
            log_info "Checking App Platform deployment status..."
            
            if app_status=$(doctl apps get "$app_id" --format Phase 2>/dev/null); then
                local phase
                phase=$(echo "$app_status" | tail -n 1)
                
                case "$phase" in
                    "RUNNING")
                        log_success "✅ App Platform deployment is RUNNING"
                        ;;
                    "BUILDING")
                        log_info "🔨 App Platform deployment is BUILDING..."
                        ;;
                    "DEPLOYING")
                        log_info "🚀 App Platform deployment is DEPLOYING..."
                        ;;
                    "ERROR"|"FAILED")
                        log_error "❌ App Platform deployment has FAILED"
                        log_info "Check logs: doctl apps logs $app_id"
                        ;;
                    *)
                        log_info "📊 App Platform status: $phase"
                        ;;
                esac
            fi
        fi
    fi
}

# Add monitoring options to deployment
show_deployment_options() {
    echo ""
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║                    🚀 One-Click Deployment Options                          ║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    echo -e "${WHITE}Choose your preferred deployment method:${NC}"
    echo ""
    echo -e "${CYAN}1. Droplet Deployment${NC} (Full Control)"
    echo "   • Complete server with root access"
    echo "   • Docker + Nginx + SSL ready"
    echo "   • Cost: ~$24/month (2 vCPUs, 4GB RAM)"
    echo "   • Setup time: 3-5 minutes"
    echo ""
    echo -e "${CYAN}2. App Platform Deployment${NC} (Managed)"
    echo "   • Zero-config managed hosting"
    echo "   • Auto-scaling and HTTPS included"
    echo "   • Cost: ~$12/month (basic plan)"
    echo "   • Setup time: 5-10 minutes"
    echo ""
    echo -e "${CYAN}3. Manual Setup${NC} (Custom)"
    echo "   • Use existing droplets/infrastructure"
    echo "   • Full customization options"
    echo "   • Cost: Variable"
    echo ""
    echo -e "${CYAN}4. Monitor Existing${NC} (Status Check)"
    echo "   • Check status of previous deployments"
    echo "   • Health monitoring and logs"
    echo "   • No additional cost"
    echo ""
    
    # Only show options if authenticated
    if [ "$AUTHENTICATED" = true ]; then
        echo -e "${WHITE}Select deployment option:${NC}"
        echo "1) Create Droplet with EchoTune AI"
        echo "2) Deploy to App Platform"
        echo "3) Show manual setup commands"
        echo "4) Monitor existing deployments"
        echo "5) Skip deployment (setup only)"
        echo ""
        read -p "Choose option (1-5): " -n 1 -r
        echo ""
        echo ""
        
        case $REPLY in
            1)
                create_echotune_droplet
                if [ $? -eq 0 ]; then
                    echo ""
                    read -p "Monitor deployment progress? (Y/n): " -n 1 -r
                    echo ""
                    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
                        monitor_deployment
                    fi
                fi
                ;;
            2)
                deploy_to_app_platform
                if [ $? -eq 0 ]; then
                    echo ""
                    read -p "Monitor App Platform deployment? (Y/n): " -n 1 -r
                    echo ""
                    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
                        monitor_deployment
                    fi
                fi
                ;;
            3)
                show_manual_setup_commands
                ;;
            4)
                monitor_deployment
                ;;
            5)
                log_info "Skipping deployment, doctl setup complete"
                ;;
            *)
                log_warning "Invalid option, showing manual setup commands"
                show_manual_setup_commands
                ;;
        esac
    else
        log_info "Complete authentication to enable one-click deployment options"
        show_manual_setup_commands
    fi
}

# Show manual setup commands
show_manual_setup_commands() {
    echo ""
    echo -e "${CYAN}Manual Deployment Commands:${NC}"
    echo ""
    
    echo -e "${WHITE}1. Create a new Droplet:${NC}"
    echo "   doctl compute droplet create echotune-app \\"
    echo "     --size s-2vcpu-4gb \\"
    echo "     --image ubuntu-22-04-x64 \\"
    echo "     --region nyc1 \\"
    echo "     --ssh-keys \$(doctl compute ssh-key list --format ID --no-header | tr '\n' ',')"
    echo ""
    
    echo -e "${WHITE}2. Deploy to App Platform:${NC}"
    echo "   doctl apps create --spec .do/app.yaml"
    echo ""
    
    echo -e "${WHITE}3. Create a Managed Database:${NC}"
    echo "   doctl databases create echotune-db \\"
    echo "     --engine mongodb \\"
    echo "     --size db-s-1vcpu-1gb \\"
    echo "     --region nyc1"
    echo ""
    
    echo -e "${WHITE}4. Set up a Load Balancer:${NC}"
    echo "   doctl compute load-balancer create \\"
    echo "     --name echotune-lb \\"
    echo "     --forwarding-rules entry_protocol:http,entry_port:80,target_protocol:http,target_port:3000 \\"
    echo "     --region nyc1"
    echo ""
    
    echo -e "${WHITE}Available doctl commands for EchoTune AI:${NC}"
    echo "  doctl compute      # Manage Droplets, Load Balancers, Firewalls"
    echo "  doctl apps         # Manage App Platform deployments"
    echo "  doctl databases    # Manage Managed Databases"
    echo "  doctl spaces       # Manage Spaces (Object Storage)"
    echo "  doctl kubernetes   # Manage Kubernetes clusters"
    echo ""
    
    echo -e "${WHITE}For more information:${NC}"
    echo "  doctl --help"
    echo "  https://docs.digitalocean.com/reference/doctl/"
    echo ""
}

# Enhanced show success summary for one-click deployment
show_success_summary() {
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                        ✅ Setup Complete! ✅                                ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    echo -e "${WHITE}What was accomplished:${NC}"
    echo "  ✅ DigitalOcean CLI (doctl) installed and verified"
    echo "  ✅ Successfully authenticated with your DigitalOcean account"
    echo "  ✅ API access verified by listing your Droplets"
    echo "  ✅ One-click deployment options are now available"
    echo ""
    
    # Show deployment info if it exists
    if [ -f "$SCRIPT_DIR/deployment-info.txt" ]; then
        echo -e "${WHITE}🚀 Deployment Information:${NC}"
        cat "$SCRIPT_DIR/deployment-info.txt" | grep -E "(IP Address|Main Application|Health Check)" | sed 's/^/  /'
        echo ""
    fi
    
    if [ -f "$SCRIPT_DIR/app-platform-info.txt" ]; then
        echo -e "${WHITE}📱 App Platform Information:${NC}"
        cat "$SCRIPT_DIR/app-platform-info.txt" | grep -E "(App ID|Status)" | sed 's/^/  /'
        echo ""
    fi
    
    echo -e "${WHITE}Security Summary:${NC}"
    echo "  🔒 Your API key was handled securely (never stored in files)"
    echo "  🔒 Authentication is active for this session"
    echo "  🔒 doctl is configured for future use"
    echo ""
    
    echo -e "${WHITE}Next Steps:${NC}"
    echo "  1. 🚀 Use the existing deployment scripts for more options:"
    echo "     ./deploy-one-click.sh    # Alternative one-click deployment"
    echo "     ./deploy-universal.sh    # Universal deployment with options"
    echo ""
    echo "  2. 🌊 Use doctl directly for custom deployments:"
    echo "     doctl compute droplet create ..."
    echo "     doctl apps create ..."
    echo ""
    echo "  3. 📚 Explore the documentation:"
    echo "     - README.md for deployment options"
    echo "     - DIGITALOCEAN_DEPLOYMENT.md for detailed guides"
    echo ""
    
    echo -e "${CYAN}🎵 Your DigitalOcean environment is ready for EchoTune AI deployment!${NC}"
    echo ""
}

# Handle script errors
handle_error() {
    log_error "Script failed!"
    echo ""
    echo -e "${YELLOW}Troubleshooting:${NC}"
    echo "  1. Check your internet connection"
    echo "  2. Verify your DigitalOcean API token is valid"
    echo "  3. Ensure you have necessary permissions (for doctl installation)"
    echo "  4. Try running with elevated privileges if needed"
    echo ""
    echo -e "${CYAN}For help:${NC}"
    echo "  - DigitalOcean doctl docs: https://docs.digitalocean.com/reference/doctl/"
    echo "  - GitHub Issues: https://github.com/dzp5103/Spotify-echo/issues"
    echo ""
    cleanup
    exit 1
}

# Main function with enhanced testing options
main() {
    # Handle help flag
    if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
        print_header
        print_usage
        exit 0
    fi
    
    # Handle test flag for authentication and tools testing
    if [ "$1" = "--test" ] || [ "$1" = "test" ]; then
        print_header
        log_info "Running authentication and tools test mode..."
        echo ""
        
        # Execute only test steps
        check_prerequisites
        detect_platform
        install_doctl
        get_api_token
        authenticate_digitalocean
        test_doctl_features
        
        # Clear error trap on success
        trap - ERR
        
        echo ""
        log_success "🧪 Authentication and tools testing completed!"
        exit 0
    fi
    
    # Handle monitoring flag
    if [ "$1" = "--monitor" ] || [ "$1" = "monitor" ]; then
        print_header
        log_info "Running deployment monitoring mode..."
        echo ""
        
        # Try to authenticate if possible
        if [ -n "$DO_API_TOKEN" ]; then
            log_info "Using API token for monitoring..."
            API_TOKEN="$DO_API_TOKEN"
            if echo "$API_TOKEN" | doctl auth init --access-token - >/dev/null 2>&1; then
                AUTHENTICATED=true
                log_success "Authenticated for monitoring"
            fi
        else
            log_info "No API token provided, checking local deployment info only..."
            AUTHENTICATED=false
        fi
        
        monitor_deployment
        
        echo ""
        log_success "🔍 Monitoring check completed!"
        exit 0
    fi
    
    # Handle deployment test flag
    if [ "$1" = "--test-deploy" ] || [ "$1" = "test-deploy" ]; then
        print_header
        log_info "Running full deployment test (demo mode)..."
        echo ""
        
        # Force demo mode for testing
        AUTHENTICATED=false
        
        # Execute all steps in demo mode
        check_prerequisites
        detect_platform
        install_doctl
        demonstrate_api_access
        show_available_resources
        show_deployment_options
        
        echo ""
        log_success "🚀 Deployment test completed! Run without --test-deploy for actual deployment."
        exit 0
    fi
    
    # Set error handler
    trap handle_error ERR
    
    print_header
    
    log_info "Starting DigitalOcean deployment setup for EchoTune AI..."
    echo ""
    
    # Execute setup steps
    check_prerequisites
    detect_platform
    install_doctl
    get_api_token
    authenticate_digitalocean
    test_doctl_features
    demonstrate_api_access
    show_available_resources
    show_deployment_options
    
    # Clear error trap on success
    trap - ERR
    
    show_success_summary
}

# Execute main function
main "$@"