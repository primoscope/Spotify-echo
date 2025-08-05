#!/bin/bash

# ===================================================================
# EchoTune AI - Universal Deployment Wizard
# One-stop script that orchestrates all deployment components
# ===================================================================

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/tmp/echotune-wizard-$(date +%Y%m%d-%H%M%S).log"

# Script options
DOMAIN=""
EMAIL=""
SKIP_INSTALL=false
SKIP_PERMISSIONS=false
SKIP_ENVIRONMENT=false
SKIP_DEPLOYMENT=false
DRY_RUN=false
VERBOSE=false
INTERACTIVE=true

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

debug() {
    if [[ "${VERBOSE:-false}" == "true" ]]; then
        echo -e "${CYAN}[$(date +'%H:%M:%S')] 🔍 $1${NC}" | tee -a "$LOG_FILE"
    fi
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root. Use: sudo $0"
        exit 1
    fi
}

# Display welcome banner
show_welcome_banner() {
    echo -e "${BOLD}${CYAN}"
    cat << 'EOF'
╔══════════════════════════════════════════════════════════════════════════════╗
║                          🎵 EchoTune AI Deployment Wizard                   ║
║                                                                              ║
║    Next-Generation Music Discovery Platform Deployment                      ║
║    Complete automated setup with enhanced reliability                       ║
╚══════════════════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    
    log "Starting EchoTune AI Deployment Wizard v1.0.0"
    log "Log file: $LOG_FILE"
}

# Interactive configuration
interactive_configuration() {
    if [[ "$INTERACTIVE" == "false" ]]; then
        return 0
    fi
    
    echo -e "\n${BOLD}🔧 Configuration Setup${NC}"
    echo "Please provide the following information for your deployment:"
    echo
    
    # Get domain
    if [[ -z "$DOMAIN" ]]; then
        read -p "Enter your domain name (e.g., example.com): " DOMAIN
        if [[ -z "$DOMAIN" ]]; then
            DOMAIN="primosphere.studio"
            info "Using default domain: $DOMAIN"
        fi
    fi
    
    # Get email
    if [[ -z "$EMAIL" ]]; then
        read -p "Enter admin email for SSL certificates: " EMAIL
        if [[ -z "$EMAIL" ]]; then
            EMAIL="admin@$DOMAIN"
            info "Using default email: $EMAIL"
        fi
    fi
    
    # Show configuration summary
    echo
    echo -e "${BOLD}📋 Configuration Summary:${NC}"
    echo "   • Domain: $DOMAIN"
    echo "   • Email: $EMAIL"
    echo "   • Installation: $(if [[ "$SKIP_INSTALL" == "true" ]]; then echo "Skip"; else echo "Yes"; fi)"
    echo "   • Permissions: $(if [[ "$SKIP_PERMISSIONS" == "true" ]]; then echo "Skip"; else echo "Yes"; fi)"
    echo "   • Environment: $(if [[ "$SKIP_ENVIRONMENT" == "true" ]]; then echo "Skip"; else echo "Yes"; fi)"
    echo "   • Deployment: $(if [[ "$SKIP_DEPLOYMENT" == "true" ]]; then echo "Skip"; else echo "Yes"; fi)"
    echo "   • Mode: $(if [[ "$DRY_RUN" == "true" ]]; then echo "Dry Run"; else echo "Live"; fi)"
    echo
    
    if [[ "$DRY_RUN" == "false" ]]; then
        read -p "Continue with deployment? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            info "Deployment cancelled by user"
            exit 0
        fi
    fi
}

# Pre-deployment checks
pre_deployment_checks() {
    log "Performing pre-deployment checks..."
    
    local checks_passed=true
    
    # Check if scripts exist
    local required_scripts=(
        "deploy-install.sh"
        "deploy-permissions.sh"
        "deploy-environment.sh"
        "deploy-app.sh"
        "deploy-fix.sh"
    )
    
    for script in "${required_scripts[@]}"; do
        if [[ -f "$SCRIPT_DIR/$script" ]]; then
            log "✅ Found $script"
            chmod +x "$SCRIPT_DIR/$script"
        else
            error "❌ Missing required script: $script"
            checks_passed=false
        fi
    done
    
    # Check system requirements
    if ! command -v curl >/dev/null 2>&1; then
        warning "curl not found - installing..."
        apt-get update && apt-get install -y curl || {
            error "Failed to install curl"
            checks_passed=false
        }
    fi
    
    # Check internet connectivity
    if ! curl -s --connect-timeout 5 google.com >/dev/null 2>&1; then
        error "No internet connectivity - required for installation"
        checks_passed=false
    else
        log "✅ Internet connectivity verified"
    fi
    
    # Check disk space (need at least 2GB)
    local available_space=$(df / | awk 'NR==2 {print $4}')
    local required_space=2097152  # 2GB in KB
    
    if [[ $available_space -lt $required_space ]]; then
        error "Insufficient disk space. Need at least 2GB, have $(($available_space / 1024 / 1024))GB"
        checks_passed=false
    else
        log "✅ Sufficient disk space available"
    fi
    
    if [[ "$checks_passed" == "false" ]]; then
        error "Pre-deployment checks failed. Please fix the issues above."
        exit 1
    fi
    
    log "✅ All pre-deployment checks passed"
}

# Execute deployment phase
execute_phase() {
    local phase_name="$1"
    local script_name="$2"
    local phase_description="$3"
    local skip_flag="$4"
    
    if [[ "$skip_flag" == "true" ]]; then
        warning "Skipping $phase_name (--skip-$phase_name flag set)"
        return 0
    fi
    
    echo
    echo -e "${BOLD}${BLUE}🚀 Phase: $phase_name${NC}"
    echo -e "   $phase_description"
    echo
    
    if [[ "$DRY_RUN" == "true" ]]; then
        info "DRY RUN: Would execute $script_name"
        return 0
    fi
    
    local start_time=$(date +%s)
    
    # Execute the script
    if bash "$SCRIPT_DIR/$script_name" "${@:5}"; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        success "$phase_name completed successfully in ${duration}s"
        return 0
    else
        local exit_code=$?
        error "$phase_name failed with exit code $exit_code"
        return $exit_code
    fi
}

# Main deployment orchestration
main_deployment() {
    log "Starting main deployment process..."
    
    local phases_completed=0
    local total_phases=4
    
    # Phase 1: Installation
    if execute_phase "Installation" "deploy-install.sh" "Installing system dependencies and requirements" "$SKIP_INSTALL"; then
        ((phases_completed++))
    else
        error "Installation phase failed. Check logs and run deploy-fix.sh"
        return 1
    fi
    
    # Phase 2: Permissions
    if execute_phase "Permissions" "deploy-permissions.sh" "Setting up user accounts and permissions" "$SKIP_PERMISSIONS"; then
        ((phases_completed++))
    else
        error "Permissions phase failed. Check logs and run deploy-fix.sh"
        return 1
    fi
    
    # Phase 3: Environment
    if execute_phase "Environment" "deploy-environment.sh" "Configuring environment and fetching templates" "$SKIP_ENVIRONMENT" "$DOMAIN" "$EMAIL"; then
        ((phases_completed++))
    else
        error "Environment phase failed. Check logs and run deploy-fix.sh"
        return 1
    fi
    
    # Phase 4: Application Deployment
    if execute_phase "Application" "deploy-app.sh" "Deploying application and configuring services" "$SKIP_DEPLOYMENT"; then
        ((phases_completed++))
    else
        error "Application deployment failed. Check logs and run deploy-fix.sh"
        return 1
    fi
    
    log "Deployment completed: $phases_completed/$total_phases phases successful"
    
    if [[ $phases_completed -eq $total_phases ]]; then
        return 0
    else
        return 1
    fi
}

# Post-deployment validation
post_deployment_validation() {
    log "Performing post-deployment validation..."
    
    local validation_passed=true
    
    # Wait for services to start
    sleep 10
    
    # Check if application is responding
    local max_attempts=30
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if curl -s "http://localhost:3000/health" >/dev/null 2>&1; then
            log "✅ Application health check passed"
            break
        else
            debug "Health check attempt $((attempt + 1))/$max_attempts"
            sleep 2
            ((attempt++))
        fi
    done
    
    if [[ $attempt -eq $max_attempts ]]; then
        error "❌ Application health check failed"
        validation_passed=false
    fi
    
    # Check services
    if systemctl is-active echotune-ai >/dev/null 2>&1; then
        log "✅ EchoTune AI service is running"
    else
        error "❌ EchoTune AI service is not running"
        validation_passed=false
    fi
    
    if systemctl is-active nginx >/dev/null 2>&1; then
        log "✅ Nginx service is running"
    else
        error "❌ Nginx service is not running"
        validation_passed=false
    fi
    
    # Check SSL
    if [[ -f "/etc/nginx/ssl/$DOMAIN.crt" ]]; then
        log "✅ SSL certificate is configured"
        
        # Test HTTPS
        if curl -k -s "https://localhost/health" >/dev/null 2>&1; then
            log "✅ HTTPS is working"
        else
            warning "⚠ HTTPS test failed (may be normal for self-signed certificates)"
        fi
    else
        warning "⚠ SSL certificate not found"
    fi
    
    if [[ "$validation_passed" == "true" ]]; then
        log "✅ Post-deployment validation passed"
        return 0
    else
        error "❌ Post-deployment validation failed"
        return 1
    fi
}

# Error recovery
handle_deployment_error() {
    local failed_phase="$1"
    
    error "Deployment failed at phase: $failed_phase"
    
    echo
    echo -e "${BOLD}${RED}🚨 Deployment Error Recovery${NC}"
    echo
    
    if [[ "$INTERACTIVE" == "true" ]]; then
        echo "Options:"
        echo "1. Run automatic error analysis and fix"
        echo "2. View detailed logs"
        echo "3. Skip this phase and continue"
        echo "4. Exit and fix manually"
        echo
        
        read -p "Choose an option (1-4): " -n 1 -r
        echo
        
        case $REPLY in
            1)
                log "Running automatic error analysis..."
                bash "$SCRIPT_DIR/deploy-fix.sh" || true
                ;;
            2)
                log "Showing last 50 lines of deployment log:"
                tail -50 "$LOG_FILE"
                ;;
            3)
                warning "Skipping failed phase and continuing..."
                return 0
                ;;
            4)
                info "Exiting for manual fix..."
                exit 1
                ;;
            *)
                info "Invalid option, exiting..."
                exit 1
                ;;
        esac
    else
        log "Non-interactive mode: running automatic error fix..."
        bash "$SCRIPT_DIR/deploy-fix.sh" || true
    fi
}

# Display final deployment summary
show_deployment_summary() {
    echo
    echo -e "${BOLD}${CYAN}"
    cat << 'EOF'
╔══════════════════════════════════════════════════════════════════════════════╗
║                       🎉 Deployment Summary                                 ║
╚══════════════════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    
    success "EchoTune AI deployment wizard completed!"
    
    log ""
    log "📋 Deployment Configuration:"
    log "   • Domain: $DOMAIN"
    log "   • Email: $EMAIL"
    log "   • Deploy Directory: /opt/echotune"
    log "   • Application Port: 3000"
    log ""
    log "🌐 Access URLs:"
    log "   • Local: http://localhost:3000"
    log "   • Public: https://$DOMAIN"
    log "   • Health Check: https://$DOMAIN/health"
    log "   • API: https://$DOMAIN/api"
    log ""
    log "🔧 Management Commands:"
    log "   • Start:   sudo systemctl start echotune-ai"
    log "   • Stop:    sudo systemctl stop echotune-ai"
    log "   • Restart: sudo systemctl restart echotune-ai"
    log "   • Status:  sudo systemctl status echotune-ai"
    log "   • Logs:    sudo journalctl -u echotune-ai -f"
    log ""
    log "📊 Monitoring:"
    log "   • Application logs: tail -f /opt/echotune/logs/app.log"
    log "   • Error logs: tail -f /opt/echotune/logs/error.log"
    log "   • Nginx logs: tail -f /opt/echotune/logs/nginx-access.log"
    log ""
    log "⚙️ Configuration Files:"
    log "   • Environment: /opt/echotune/.env"
    log "   • Nginx: /etc/nginx/sites-available/$DOMAIN"
    log "   • Service: /etc/systemd/system/echotune-ai.service"
    log ""
    log "🚨 Next Steps:"
    log "   1. Configure Spotify API credentials in /opt/echotune/.env"
    log "   2. Add AI provider API keys (optional, mock provider works without keys)"
    log "   3. Test the application: curl https://$DOMAIN/health"
    log "   4. Visit your site: https://$DOMAIN"
    log ""
    log "🔍 Troubleshooting:"
    log "   • Run error analysis: sudo ./deploy-fix.sh"
    log "   • View this log: $LOG_FILE"
    log "   • Check GitHub issues: https://github.com/dzp5103/Spotify-echo/issues"
    log ""
    log "📚 Documentation:"
    log "   • Setup guide: /opt/echotune/ENVIRONMENT_SETUP.md"
    log "   • Project README: https://github.com/dzp5103/Spotify-echo#readme"
}

# Create deployment completion marker
create_completion_marker() {
    local marker_file="/opt/echotune/DEPLOYMENT_COMPLETE"
    
    cat > "$marker_file" << EOF
EchoTune AI Deployment Complete
==============================

Deployment Date: $(date)
Domain: $DOMAIN
Email: $EMAIL
Wizard Version: 1.0.0
Log File: $LOG_FILE

Status: SUCCESS

All deployment phases completed successfully.
Application is ready for use.

Next Steps:
1. Configure Spotify API credentials
2. Test the application
3. Monitor logs for any issues

For support, visit:
https://github.com/dzp5103/Spotify-echo/issues
EOF
    
    chown echotune:echotune "$marker_file" 2>/dev/null || true
    chmod 644 "$marker_file"
    
    debug "Deployment completion marker created: $marker_file"
}

# Main function
main() {
    check_root
    show_welcome_banner
    interactive_configuration
    pre_deployment_checks
    
    if main_deployment; then
        post_deployment_validation || {
            warning "Post-deployment validation failed, but deployment may still be functional"
        }
        create_completion_marker
        show_deployment_summary
        success "🎉 EchoTune AI is ready to rock! 🎵"
    else
        handle_deployment_error "main deployment"
        error "Deployment failed. Check logs and run deploy-fix.sh for troubleshooting."
        exit 1
    fi
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --domain=*)
                DOMAIN="${1#*=}"
                shift
                ;;
            --email=*)
                EMAIL="${1#*=}"
                shift
                ;;
            --skip-install)
                SKIP_INSTALL=true
                shift
                ;;
            --skip-permissions)
                SKIP_PERMISSIONS=true
                shift
                ;;
            --skip-environment)
                SKIP_ENVIRONMENT=true
                shift
                ;;
            --skip-deployment)
                SKIP_DEPLOYMENT=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            --non-interactive)
                INTERACTIVE=false
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            --version|-v)
                echo "EchoTune AI Deployment Wizard v1.0.0"
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# Show help information
show_help() {
    cat << EOF
EchoTune AI Deployment Wizard

USAGE:
    sudo $0 [OPTIONS]

OPTIONS:
    --domain=DOMAIN          Set domain name (default: interactive prompt)
    --email=EMAIL           Set admin email (default: interactive prompt)
    --skip-install          Skip installation phase
    --skip-permissions      Skip permissions phase
    --skip-environment      Skip environment setup phase
    --skip-deployment       Skip application deployment phase
    --dry-run              Show what would be done without executing
    --verbose              Enable verbose logging
    --non-interactive      Run without prompts (use defaults/provided options)
    --help, -h             Show this help message
    --version, -v          Show version information

EXAMPLES:
    # Interactive deployment
    sudo $0

    # Non-interactive with custom domain
    sudo $0 --domain=example.com --email=admin@example.com --non-interactive

    # Skip installation if already done
    sudo $0 --skip-install

    # Dry run to see what would happen
    sudo $0 --dry-run --verbose

PHASES:
    1. Installation     - Install system dependencies (Node.js, Python, Docker, Nginx)
    2. Permissions      - Set up users, groups, and file permissions
    3. Environment      - Configure environment files and secrets
    4. Deployment       - Deploy application and configure services

REQUIREMENTS:
    - Ubuntu 18.04+ or Debian 10+
    - Root access (sudo)
    - Internet connection
    - At least 2GB disk space

For more information, visit:
https://github.com/dzp5103/Spotify-echo
EOF
}

# Handle script arguments
if [[ $# -eq 0 ]]; then
    main
else
    parse_arguments "$@"
    main
fi