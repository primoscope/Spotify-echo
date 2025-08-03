#!/bin/bash

# 🚀 EchoTune AI - DigitalOcean Deployment Script
# Simple DigitalOcean CLI setup and basic droplet management

set -e  # Exit on error
set -o pipefail  # Exit on pipe failure

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${PURPLE}[STEP]${NC} $1"; }

# Print header
print_header() {
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║                    🎵 EchoTune AI - DigitalOcean Deploy                    ║${NC}"
    echo -e "${PURPLE}║                        Simple CLI Setup & Management                        ║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Check if doctl is installed
check_doctl_installed() {
    if command -v doctl >/dev/null 2>&1; then
        log_success "DigitalOcean CLI (doctl) is already installed"
        return 0
    else
        log_warning "DigitalOcean CLI (doctl) is not installed"
        return 1
    fi
}

# Install doctl CLI
install_doctl() {
    log_step "Installing DigitalOcean CLI (doctl)..."
    
    # Detect OS and architecture
    local os_type=""
    local arch_type=""
    
    case "$(uname -s)" in
        Linux*)     os_type="linux" ;;
        Darwin*)    os_type="darwin" ;;
        CYGWIN*|MINGW*|MSYS*) os_type="windows" ;;
        *)          log_error "Unsupported operating system: $(uname -s)"
                   exit 1 ;;
    esac
    
    case "$(uname -m)" in
        x86_64|amd64)   arch_type="amd64" ;;
        arm64|aarch64)  arch_type="arm64" ;;
        i386|i686)      arch_type="386" ;;
        *)              log_error "Unsupported architecture: $(uname -m)"
                       exit 1 ;;
    esac
    
    # Get the latest release version and construct download URL
    local latest_version=$(curl -s https://api.github.com/repos/digitalocean/doctl/releases/latest | grep '"tag_name"' | sed -E 's/.*"([^"]+)".*/\1/')
    local download_url="https://github.com/digitalocean/doctl/releases/download/${latest_version}/doctl-${latest_version#v}-${os_type}-${arch_type}.tar.gz"
    local temp_dir=$(mktemp -d)
    local download_file="${temp_dir}/doctl.tar.gz"
    
    log_info "Downloading doctl from: ${download_url}"
    
    # Download with error handling
    if ! curl -sL "$download_url" -o "$download_file"; then
        log_error "Failed to download doctl"
        rm -rf "$temp_dir"
        exit 1
    fi
    
    # Extract and install
    cd "$temp_dir"
    if ! tar -xzf doctl.tar.gz; then
        log_error "Failed to extract doctl"
        rm -rf "$temp_dir"
        exit 1
    fi
    
    # Install to appropriate location
    local install_dir="/usr/local/bin"
    if [[ ! -w "$install_dir" ]]; then
        install_dir="$HOME/.local/bin"
        mkdir -p "$install_dir"
    fi
    
    if ! mv doctl "$install_dir/doctl"; then
        log_error "Failed to install doctl to $install_dir"
        log_info "You may need to run with sudo or install to a writable directory"
        rm -rf "$temp_dir"
        exit 1
    fi
    
    chmod +x "$install_dir/doctl"
    
    # Add to PATH if needed
    if [[ ":$PATH:" != *":$install_dir:"* ]]; then
        log_warning "Adding $install_dir to PATH for this session"
        export PATH="$install_dir:$PATH"
        
        # Suggest adding to shell profile
        echo ""
        log_info "To permanently add doctl to your PATH, add this line to your shell profile:"
        echo -e "${CYAN}export PATH=\"$install_dir:\$PATH\"${NC}"
        echo ""
    fi
    
    # Cleanup
    rm -rf "$temp_dir"
    
    log_success "DigitalOcean CLI (doctl) installed successfully"
}

# Get API token from environment or prompt user
get_api_token() {
    local token=""
    
    # Check for environment variable first
    if [[ -n "${DIGITALOCEAN_API_TOKEN:-}" ]]; then
        log_info "Using API token from DIGITALOCEAN_API_TOKEN environment variable"
        token="$DIGITALOCEAN_API_TOKEN"
    else
        log_step "API token not found in environment variable DIGITALOCEAN_API_TOKEN"
        echo ""
        echo -e "${YELLOW}Please enter your DigitalOcean API token:${NC}"
        echo -e "${CYAN}(You can create one at: https://cloud.digitalocean.com/account/api/tokens)${NC}"
        echo ""
        read -s -p "API Token: " token
        echo ""
        
        if [[ -z "$token" ]]; then
            log_error "API token cannot be empty"
            exit 1
        fi
    fi
    
    echo "$token"
}

# Authenticate with DigitalOcean
authenticate_doctl() {
    local api_token="$1"
    
    log_step "Authenticating with DigitalOcean..."
    
    # Authenticate
    if echo "$api_token" | doctl auth init --access-token-stdin >/dev/null 2>&1; then
        log_success "Successfully authenticated with DigitalOcean"
    else
        log_error "Failed to authenticate with DigitalOcean"
        log_info "Please check your API token and try again"
        exit 1
    fi
}

# Verify authentication by getting account info
verify_authentication() {
    log_step "Verifying authentication..."
    
    if account_info=$(doctl account get 2>/dev/null); then
        log_success "Authentication verified"
        echo ""
        echo -e "${CYAN}Account Information:${NC}"
        echo "$account_info"
        echo ""
    else
        log_error "Failed to verify authentication"
        exit 1
    fi
}

# List droplets as an example operation
list_droplets() {
    log_step "Listing your DigitalOcean Droplets..."
    echo ""
    
    if droplets=$(doctl compute droplet list 2>/dev/null); then
        if [[ -n "$droplets" ]] && [[ $(echo "$droplets" | wc -l) -gt 1 ]]; then
            echo -e "${CYAN}Your Droplets:${NC}"
            echo "$droplets"
        else
            echo -e "${YELLOW}No droplets found in your account.${NC}"
            echo ""
            echo -e "${CYAN}To create a new droplet, you can use:${NC}"
            echo -e "${GREEN}doctl compute droplet create mydroplet --image ubuntu-22-04-x64 --size s-1vcpu-1gb --region nyc3${NC}"
        fi
        echo ""
    else
        log_error "Failed to list droplets"
        exit 1
    fi
}

# Show help information
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  -t, --token TOKEN   Specify API token (can also use DIGITALOCEAN_API_TOKEN env var)"
    echo "  --install-only      Only install doctl, don't authenticate"
    echo "  --list-only         Only list droplets (assumes already authenticated)"
    echo ""
    echo "Environment Variables:"
    echo "  DIGITALOCEAN_API_TOKEN    Your DigitalOcean API token"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Interactive setup"
    echo "  $0 --token your_api_token             # Setup with provided token"
    echo "  DIGITALOCEAN_API_TOKEN=token $0       # Setup with environment variable"
    echo "  $0 --install-only                     # Just install doctl"
    echo "  $0 --list-only                        # Just list droplets"
    echo ""
}

# Main function
main() {
    local api_token=""
    local install_only=false
    local list_only=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -t|--token)
                api_token="$2"
                shift 2
                ;;
            --install-only)
                install_only=true
                shift
                ;;
            --list-only)
                list_only=true
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    print_header
    
    # Install doctl if needed
    if ! check_doctl_installed; then
        install_doctl
    fi
    
    # If only installing, exit here
    if [[ "$install_only" == true ]]; then
        log_success "Installation complete!"
        exit 0
    fi
    
    # If only listing droplets, do that and exit
    if [[ "$list_only" == true ]]; then
        list_droplets
        exit 0
    fi
    
    # Get API token if not provided
    if [[ -z "$api_token" ]]; then
        api_token=$(get_api_token)
    fi
    
    # Authenticate
    authenticate_doctl "$api_token"
    
    # Verify authentication
    verify_authentication
    
    # List droplets as example
    list_droplets
    
    log_success "Setup complete! doctl is ready to use."
    echo ""
    echo -e "${CYAN}Next steps:${NC}"
    echo "• Use 'doctl compute droplet list' to list droplets"
    echo "• Use 'doctl compute droplet create' to create new droplets"
    echo "• Use 'doctl --help' for more commands"
    echo "• Visit https://docs.digitalocean.com/reference/doctl/ for documentation"
    echo ""
    echo -e "${GREEN}🎉 Ready to deploy EchoTune AI to DigitalOcean!${NC}"
}

# Run main function with all arguments
main "$@"