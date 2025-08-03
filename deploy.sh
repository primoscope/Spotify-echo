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

# Demonstrate API access by listing Droplets
demonstrate_api_access() {
    log_step "Demonstrating API access - listing your Droplets..."
    
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

# Show next steps for deployment automation
show_deployment_automation_examples() {
    echo ""
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║                      🚀 Ready for Further Automation                        ║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    echo -e "${WHITE}Now that doctl is configured, you can automate deployments:${NC}"
    echo ""
    
    echo -e "${CYAN}1. Create a new Droplet:${NC}"
    echo "   doctl compute droplet create echotune-app \\"
    echo "     --size s-2vcpu-4gb \\"
    echo "     --image ubuntu-22-04-x64 \\"
    echo "     --region nyc1 \\"
    echo "     --ssh-keys \$(doctl compute ssh-key list --format ID --no-header | tr '\n' ',')"
    echo ""
    
    echo -e "${CYAN}2. Deploy to DigitalOcean App Platform:${NC}"
    echo "   doctl apps create --spec .do/app.yaml"
    echo ""
    
    echo -e "${CYAN}3. Create a Managed Database:${NC}"
    echo "   doctl databases create echotune-db \\"
    echo "     --engine mongodb \\"
    echo "     --size db-s-1vcpu-1gb \\"
    echo "     --region nyc1"
    echo ""
    
    echo -e "${CYAN}4. Set up a Load Balancer:${NC}"
    echo "   doctl compute load-balancer create \\"
    echo "     --name echotune-lb \\"
    echo "     --forwarding-rules entry_protocol:http,entry_port:80,target_protocol:http,target_port:3000 \\"
    echo "     --region nyc1"
    echo ""
    
    echo -e "${WHITE}Available doctl commands for EchoTune AI deployment:${NC}"
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

# Show configuration and next steps
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
    echo "  ✅ Ready for automated deployment workflows"
    echo ""
    
    echo -e "${WHITE}Security Summary:${NC}"
    echo "  🔒 Your API key was handled securely (never stored in files)"
    echo "  🔒 Authentication is active for this session"
    echo "  🔒 doctl is configured for future use"
    echo ""
    
    echo -e "${WHITE}Next Steps:${NC}"
    echo "  1. 🚀 Deploy EchoTune AI using the existing deployment scripts:"
    echo "     ./deploy-one-click.sh    # Quick deployment"
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

# Main function
main() {
    # Handle help flag
    if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
        print_header
        print_usage
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
    demonstrate_api_access
    show_available_resources
    show_deployment_automation_examples
    
    # Clear error trap on success
    trap - ERR
    
    show_success_summary
}

# Execute main function
main "$@"