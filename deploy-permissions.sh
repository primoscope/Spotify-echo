#!/bin/bash

# ===================================================================
# EchoTune AI - Permissions Fix Script
# Fixes all permission issues and sets up proper access controls
# ===================================================================

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/tmp/echotune-permissions-$(date +%Y%m%d-%H%M%S).log"
DEPLOY_USER="echotune"
DEPLOY_DIR="/opt/echotune"

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

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root. Use: sudo $0"
        exit 1
    fi
}

# Create deploy user if not exists
create_deploy_user() {
    log "Setting up deploy user..."
    
    if ! id "$DEPLOY_USER" &>/dev/null; then
        useradd -m -s /bin/bash "$DEPLOY_USER"
        log "Created user: $DEPLOY_USER"
    else
        log "User $DEPLOY_USER already exists"
    fi
    
    # Add to necessary groups
    usermod -aG sudo "$DEPLOY_USER" 2>/dev/null || true
    usermod -aG docker "$DEPLOY_USER" 2>/dev/null || true
    usermod -aG www-data "$DEPLOY_USER" 2>/dev/null || true
    
    log "Updated user groups for $DEPLOY_USER"
}

# Fix deployment directory permissions
fix_deployment_permissions() {
    log "Fixing deployment directory permissions..."
    
    # Create deployment directories
    mkdir -p "$DEPLOY_DIR"/{app,ssl,logs,backups,config,uploads,data}
    mkdir -p /var/log/echotune
    mkdir -p /var/lib/echotune
    
    # Set ownership to deploy user
    chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_DIR"
    chown -R "$DEPLOY_USER:$DEPLOY_USER" /var/log/echotune
    chown -R "$DEPLOY_USER:$DEPLOY_USER" /var/lib/echotune
    
    # Set permissive permissions (777 as requested)
    chmod -R 777 "$DEPLOY_DIR"
    chmod -R 777 /var/log/echotune
    chmod -R 777 /var/lib/echotune
    
    log "Deployment directory permissions set to 777 (fully permissive)"
}

# Fix Docker permissions
fix_docker_permissions() {
    log "Fixing Docker permissions..."
    
    if command -v docker >/dev/null 2>&1; then
        # Set permissive Docker socket permissions
        chmod 666 /var/run/docker.sock
        
        # Add deploy user to docker group
        usermod -aG docker "$DEPLOY_USER"
        
        # Create Docker directories
        mkdir -p /var/lib/docker
        chmod 755 /var/lib/docker
        
        log "Docker permissions configured (permissive mode)"
    else
        warning "Docker not installed, skipping Docker permissions"
    fi
}

# Fix Nginx permissions
fix_nginx_permissions() {
    log "Fixing Nginx permissions..."
    
    if command -v nginx >/dev/null 2>&1; then
        # Create Nginx directories
        mkdir -p /etc/nginx/sites-available
        mkdir -p /etc/nginx/sites-enabled
        mkdir -p /etc/nginx/ssl
        mkdir -p /var/log/nginx
        
        # Set permissions for SSL directory
        chmod 777 /etc/nginx/ssl
        chown -R "$DEPLOY_USER:$DEPLOY_USER" /etc/nginx/ssl
        
        # Allow deploy user to manage Nginx configs
        chown -R "$DEPLOY_USER:$DEPLOY_USER" /etc/nginx/sites-available
        chown -R "$DEPLOY_USER:$DEPLOY_USER" /etc/nginx/sites-enabled
        chmod -R 775 /etc/nginx/sites-available
        chmod -R 775 /etc/nginx/sites-enabled
        
        # Set permissive log permissions
        chmod 777 /var/log/nginx
        chown -R "$DEPLOY_USER:$DEPLOY_USER" /var/log/nginx
        
        log "Nginx permissions configured"
    else
        warning "Nginx not installed, skipping Nginx permissions"
    fi
}

# Fix project directory permissions
fix_project_permissions() {
    log "Fixing project directory permissions..."
    
    if [[ -d "$SCRIPT_DIR" ]]; then
        # Set ownership to deploy user
        chown -R "$DEPLOY_USER:$DEPLOY_USER" "$SCRIPT_DIR"
        
        # Set permissive permissions for development
        chmod -R 775 "$SCRIPT_DIR"
        
        # Make scripts executable
        find "$SCRIPT_DIR" -name "*.sh" -exec chmod +x {} \;
        
        # Set permissive permissions for node_modules and other directories
        if [[ -d "$SCRIPT_DIR/node_modules" ]]; then
            chmod -R 777 "$SCRIPT_DIR/node_modules"
        fi
        
        if [[ -d "$SCRIPT_DIR/data" ]]; then
            chmod -R 777 "$SCRIPT_DIR/data"
        fi
        
        if [[ -d "$SCRIPT_DIR/logs" ]]; then
            chmod -R 777 "$SCRIPT_DIR/logs"
        fi
        
        log "Project directory permissions updated"
    else
        warning "Project directory not found, skipping project permissions"
    fi
}

# Fix systemd service permissions
fix_systemd_permissions() {
    log "Fixing systemd service permissions..."
    
    # Create systemd service directory for user services
    mkdir -p /etc/systemd/system
    chmod 755 /etc/systemd/system
    
    # Allow deploy user to manage echotune services
    if [[ -f /etc/systemd/system/echotune*.service ]]; then
        chown "$DEPLOY_USER:$DEPLOY_USER" /etc/systemd/system/echotune*.service
        chmod 644 /etc/systemd/system/echotune*.service
    fi
    
    log "Systemd permissions configured"
}

# Fix SSL certificate permissions
fix_ssl_permissions() {
    log "Fixing SSL certificate permissions..."
    
    # Create SSL directories
    mkdir -p /etc/letsencrypt
    mkdir -p /etc/ssl/certs
    mkdir -p /etc/ssl/private
    
    # Set permissive permissions for SSL
    chmod 777 /etc/letsencrypt
    chmod 755 /etc/ssl/certs
    chmod 777 /etc/ssl/private
    
    # Allow deploy user to manage SSL certificates
    chown -R "$DEPLOY_USER:$DEPLOY_USER" /etc/letsencrypt 2>/dev/null || true
    
    log "SSL permissions configured (permissive mode)"
}

# Fix temporary directory permissions
fix_tmp_permissions() {
    log "Fixing temporary directory permissions..."
    
    # Create and set permissions for temp directories
    mkdir -p /tmp/echotune
    chmod 777 /tmp/echotune
    chown "$DEPLOY_USER:$DEPLOY_USER" /tmp/echotune
    
    # Set permissions for system temp
    chmod 777 /tmp
    
    log "Temporary directory permissions set"
}

# Configure sudo permissions for deploy user
configure_sudo_permissions() {
    log "Configuring sudo permissions for deploy user..."
    
    # Create sudoers file for deploy user
    cat > "/etc/sudoers.d/$DEPLOY_USER" << EOF
# Allow $DEPLOY_USER to run deployment commands without password
$DEPLOY_USER ALL=(ALL) NOPASSWD: /bin/systemctl start echotune*
$DEPLOY_USER ALL=(ALL) NOPASSWD: /bin/systemctl stop echotune*
$DEPLOY_USER ALL=(ALL) NOPASSWD: /bin/systemctl restart echotune*
$DEPLOY_USER ALL=(ALL) NOPASSWD: /bin/systemctl reload echotune*
$DEPLOY_USER ALL=(ALL) NOPASSWD: /bin/systemctl status echotune*
$DEPLOY_USER ALL=(ALL) NOPASSWD: /bin/systemctl enable echotune*
$DEPLOY_USER ALL=(ALL) NOPASSWD: /bin/systemctl disable echotune*
$DEPLOY_USER ALL=(ALL) NOPASSWD: /usr/bin/docker
$DEPLOY_USER ALL=(ALL) NOPASSWD: /usr/local/bin/docker-compose
$DEPLOY_USER ALL=(ALL) NOPASSWD: /usr/bin/docker-compose
$DEPLOY_USER ALL=(ALL) NOPASSWD: /bin/chown
$DEPLOY_USER ALL=(ALL) NOPASSWD: /bin/chmod
$DEPLOY_USER ALL=(ALL) NOPASSWD: /usr/sbin/nginx -t
$DEPLOY_USER ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx
$DEPLOY_USER ALL=(ALL) NOPASSWD: /bin/systemctl restart nginx
$DEPLOY_USER ALL=(ALL) NOPASSWD: /usr/bin/certbot
EOF
    
    chmod 440 "/etc/sudoers.d/$DEPLOY_USER"
    
    log "Sudo permissions configured for $DEPLOY_USER"
}

# Set file ownership for common files
fix_file_ownership() {
    log "Fixing file ownership..."
    
    # Common file locations that need proper ownership
    local files_to_fix=(
        "/var/www"
        "/var/log"
        "/opt"
        "/usr/local/bin"
    )
    
    for file_path in "${files_to_fix[@]}"; do
        if [[ -d "$file_path" ]]; then
            # Add deploy user to groups that can access these directories
            if [[ "$file_path" == "/var/www" ]]; then
                chown -R www-data:www-data "$file_path" 2>/dev/null || true
                chmod -R 775 "$file_path" 2>/dev/null || true
                usermod -aG www-data "$DEPLOY_USER" 2>/dev/null || true
            fi
        fi
    done
    
    log "File ownership updated"
}

# Validate permissions
validate_permissions() {
    log "Validating permissions..."
    
    local validation_passed=true
    
    # Check deploy directory
    if [[ ! -d "$DEPLOY_DIR" ]]; then
        error "Deploy directory $DEPLOY_DIR does not exist"
        validation_passed=false
    elif [[ ! -w "$DEPLOY_DIR" ]]; then
        error "Deploy directory $DEPLOY_DIR is not writable"
        validation_passed=false
    fi
    
    # Check deploy user
    if ! id "$DEPLOY_USER" &>/dev/null; then
        error "Deploy user $DEPLOY_USER does not exist"
        validation_passed=false
    fi
    
    # Check Docker access
    if command -v docker >/dev/null 2>&1; then
        if ! sudo -u "$DEPLOY_USER" docker ps &>/dev/null; then
            warning "Deploy user cannot access Docker (may need logout/login)"
        fi
    fi
    
    if [[ "$validation_passed" == true ]]; then
        log "✅ Permission validation passed"
    else
        error "❌ Permission validation failed"
        return 1
    fi
}

# Display permission summary
show_permission_summary() {
    log "📋 Permission Summary:"
    log "   • Deploy user: $DEPLOY_USER"
    log "   • Deploy directory: $DEPLOY_DIR (777 permissions)"
    log "   • Docker socket: 666 permissions"
    log "   • SSL directories: permissive (777)"
    log "   • Project files: 775 permissions"
    log "   • Sudo access: configured for deployment commands"
    log ""
    log "🔑 User groups for $DEPLOY_USER:"
    groups "$DEPLOY_USER" | sed "s/^/   • /"
    log ""
    log "📁 Directory permissions:"
    ls -la "$DEPLOY_DIR" 2>/dev/null | head -10 | sed "s/^/   /"
}

# Main function
main() {
    log "Starting EchoTune AI permissions fix..."
    log "Log file: $LOG_FILE"
    
    check_root
    create_deploy_user
    fix_deployment_permissions
    fix_docker_permissions
    fix_nginx_permissions
    fix_project_permissions
    fix_systemd_permissions
    fix_ssl_permissions
    fix_tmp_permissions
    configure_sudo_permissions
    fix_file_ownership
    validate_permissions
    
    log "✅ Permissions fix completed successfully!"
    show_permission_summary
    
    log ""
    log "🚀 Next steps:"
    log "   1. Run: sudo ./deploy-environment.sh"
    log "   2. Run: sudo ./deploy-app.sh"
    log ""
    log "📄 Full log available at: $LOG_FILE"
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "EchoTune AI Permissions Fix Script"
        echo ""
        echo "Usage: sudo $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --version, -v  Show script version"
        echo ""
        echo "This script fixes all permission issues and sets up proper access controls."
        exit 0
        ;;
    --version|-v)
        echo "EchoTune AI Permissions Fix Script v1.0.0"
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac