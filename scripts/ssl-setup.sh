#!/bin/bash
set -euo pipefail

# SSL Setup Script for EchoTune AI
# Sets up Let's Encrypt SSL certificates with automatic renewal

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Load environment variables
if [[ -f /app/.env ]]; then
    source /app/.env
else
    warning "No .env file found, using environment variables"
fi

# Required environment variables
DOMAIN=${DOMAIN:-"primosphere.studio"}
LETSENCRYPT_EMAIL=${LETSENCRYPT_EMAIL:-"admin@primosphere.studio"}
SSL_CERT_PATH=${SSL_CERT_PATH:-"/etc/nginx/ssl"}
STAGING=${STAGING:-"false"}

log "Starting SSL setup for domain: $DOMAIN"

# Create necessary directories
mkdir -p "$SSL_CERT_PATH"
mkdir -p /var/www/certbot
mkdir -p /etc/letsencrypt/live
mkdir -p /var/log/letsencrypt

# Function to generate self-signed certificate for initial setup
generate_self_signed() {
    log "Generating self-signed certificate for initial setup..."
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$SSL_CERT_PATH/key.pem" \
        -out "$SSL_CERT_PATH/cert.pem" \
        -subj "/C=US/ST=CA/L=San Francisco/O=EchoTune AI/CN=$DOMAIN"
    
    success "Self-signed certificate generated"
}

# Function to check if domain is reachable
check_domain_reachability() {
    log "Checking domain reachability: $DOMAIN"
    
    if ! nslookup "$DOMAIN" >/dev/null 2>&1; then
        error "Domain $DOMAIN is not reachable via DNS"
        return 1
    fi
    
    success "Domain $DOMAIN is reachable"
    return 0
}

# Function to obtain Let's Encrypt certificate
obtain_letsencrypt_cert() {
    log "Obtaining Let's Encrypt certificate for $DOMAIN"
    
    # Prepare certbot arguments
    local certbot_args=(
        "certonly"
        "--webroot"
        "--webroot-path=/var/www/certbot"
        "--email=$LETSENCRYPT_EMAIL"
        "--agree-tos"
        "--no-eff-email"
        "--force-renewal"
        "-d" "$DOMAIN"
        "-d" "www.$DOMAIN"
    )
    
    # Add staging flag if specified
    if [[ "$STAGING" == "true" ]]; then
        certbot_args+=("--staging")
        warning "Using Let's Encrypt staging environment"
    fi
    
    # Run certbot
    if certbot "${certbot_args[@]}"; then
        # Copy certificates to nginx directory
        cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_CERT_PATH/cert.pem"
        cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_CERT_PATH/key.pem"
        
        # Set proper permissions
        chmod 644 "$SSL_CERT_PATH/cert.pem"
        chmod 600 "$SSL_CERT_PATH/key.pem"
        
        success "Let's Encrypt certificate obtained and installed"
        return 0
    else
        error "Failed to obtain Let's Encrypt certificate"
        return 1
    fi
}

# Function to setup certificate renewal
setup_renewal() {
    log "Setting up automatic certificate renewal"
    
    # Create renewal script
    cat > /scripts/ssl-renew.sh << 'EOF'
#!/bin/bash
set -euo pipefail

# Renew certificates
certbot renew --quiet --webroot --webroot-path=/var/www/certbot

# Copy renewed certificates if successful
if [[ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]]; then
    cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_CERT_PATH/cert.pem"
    cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_CERT_PATH/key.pem"
    
    # Reload nginx
    nginx -s reload
    
    echo "SSL certificates renewed successfully"
else
    echo "Certificate renewal failed"
    exit 1
fi
EOF
    
    chmod +x /scripts/ssl-renew.sh
    
    # Add cron job for renewal (runs twice daily)
    echo "0 12 * * * /scripts/ssl-renew.sh >> /var/log/letsencrypt/renewal.log 2>&1" | crontab -
    
    success "Automatic renewal configured"
}

# Function to validate certificate
validate_certificate() {
    log "Validating SSL certificate"
    
    if [[ ! -f "$SSL_CERT_PATH/cert.pem" ]] || [[ ! -f "$SSL_CERT_PATH/key.pem" ]]; then
        error "SSL certificate files not found"
        return 1
    fi
    
    # Check certificate validity
    if openssl x509 -in "$SSL_CERT_PATH/cert.pem" -text -noout >/dev/null 2>&1; then
        local expiry_date=$(openssl x509 -in "$SSL_CERT_PATH/cert.pem" -noout -enddate | cut -d= -f2)
        local days_until_expiry=$(( ($(date -d "$expiry_date" +%s) - $(date +%s)) / 86400 ))
        
        if [[ $days_until_expiry -gt 30 ]]; then
            success "SSL certificate is valid (expires in $days_until_expiry days)"
            return 0
        else
            warning "SSL certificate expires in $days_until_expiry days - renewal recommended"
            return 0
        fi
    else
        error "SSL certificate is invalid"
        return 1
    fi
}

# Main execution
main() {
    log "=== SSL Setup for EchoTune AI ==="
    log "Domain: $DOMAIN"
    log "Email: $LETSENCRYPT_EMAIL"
    log "SSL Path: $SSL_CERT_PATH"
    
    # Check if we're in a production environment
    if [[ "$STAGING" != "true" ]] && ! check_domain_reachability; then
        warning "Domain not reachable, generating self-signed certificate"
        generate_self_signed
        return 0
    fi
    
    # Try to obtain Let's Encrypt certificate
    if obtain_letsencrypt_cert; then
        setup_renewal
        validate_certificate
    else
        warning "Let's Encrypt failed, falling back to self-signed certificate"
        generate_self_signed
    fi
    
    success "SSL setup completed"
}

# Run main function
main "$@"