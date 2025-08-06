#!/bin/bash
# SSL Certificate Setup Script for EchoTune AI
# Supports Let's Encrypt, custom certificates, and self-signed fallback

set -e

# Configuration
DOMAIN="${DOMAIN:-primosphere.studio}"
EMAIL="${SSL_EMAIL:-admin@primosphere.studio}"
SSL_DIR="${SSL_DIR:-/etc/nginx/ssl}"
NGINX_DIR="${NGINX_DIR:-/etc/nginx}"
DHPARAM_SIZE="${DHPARAM_SIZE:-2048}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔐 EchoTune AI SSL Certificate Setup${NC}"
echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo "SSL Directory: $SSL_DIR"
echo

# Create necessary directories
sudo mkdir -p "$SSL_DIR"
sudo mkdir -p "$NGINX_DIR/dhparam"
sudo mkdir -p "/var/www/certbot"

# Function to generate Diffie-Hellman parameters
generate_dhparam() {
    echo -e "${YELLOW}🔑 Generating Diffie-Hellman parameters (${DHPARAM_SIZE} bits)...${NC}"
    if [ ! -f "$NGINX_DIR/dhparam/dhparam.pem" ]; then
        sudo openssl dhparam -out "$NGINX_DIR/dhparam/dhparam.pem" "$DHPARAM_SIZE"
        echo -e "${GREEN}✅ Diffie-Hellman parameters generated${NC}"
    else
        echo -e "${GREEN}✅ Diffie-Hellman parameters already exist${NC}"
    fi
}

# Function to setup Let's Encrypt certificate
setup_letsencrypt() {
    echo -e "${YELLOW}🌐 Setting up Let's Encrypt certificate...${NC}"
    
    # Install certbot if not available
    if ! command -v certbot &> /dev/null; then
        echo "Installing certbot..."
        sudo apt-get update
        sudo apt-get install -y certbot python3-certbot-nginx
    fi
    
    # Check if certificate already exists
    if sudo certbot certificates 2>/dev/null | grep -q "$DOMAIN"; then
        echo -e "${GREEN}✅ Let's Encrypt certificate already exists for $DOMAIN${NC}"
        return 0
    fi
    
    # Create temporary nginx config for ACME challenge
    sudo tee /etc/nginx/sites-available/temp-ssl > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    location ^~ /.well-known/acme-challenge/ {
        root /var/www/certbot;
        allow all;
    }
    
    location / {
        return 444;
    }
}
EOF
    
    # Enable temporary config
    sudo ln -sf /etc/nginx/sites-available/temp-ssl /etc/nginx/sites-enabled/temp-ssl
    sudo nginx -t && sudo systemctl reload nginx
    
    # Obtain certificate
    sudo certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --domains "$DOMAIN,www.$DOMAIN"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Let's Encrypt certificate obtained successfully${NC}"
        
        # Copy certificates to our SSL directory
        sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/cert.pem"
        sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/key.pem"
        sudo cp "/etc/letsencrypt/live/$DOMAIN/chain.pem" "$SSL_DIR/chain.pem"
        
        # Remove temporary config
        sudo rm -f /etc/nginx/sites-enabled/temp-ssl
        
        return 0
    else
        echo -e "${RED}❌ Failed to obtain Let's Encrypt certificate${NC}"
        return 1
    fi
}

# Function to create self-signed certificate
create_selfsigned() {
    echo -e "${YELLOW}🔒 Creating self-signed certificate...${NC}"
    
    # Create certificate configuration
    sudo tee "$SSL_DIR/cert.conf" > /dev/null <<EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
C=US
ST=State
L=City
O=EchoTune AI
OU=Development
CN=$DOMAIN

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = $DOMAIN
DNS.2 = www.$DOMAIN
DNS.3 = localhost
IP.1 = 127.0.0.1
EOF
    
    # Generate private key and certificate
    sudo openssl req \
        -new \
        -newkey rsa:2048 \
        -days 365 \
        -nodes \
        -x509 \
        -keyout "$SSL_DIR/key.pem" \
        -out "$SSL_DIR/cert.pem" \
        -config "$SSL_DIR/cert.conf" \
        -extensions v3_req
    
    # Create chain file (same as cert for self-signed)
    sudo cp "$SSL_DIR/cert.pem" "$SSL_DIR/chain.pem"
    
    echo -e "${GREEN}✅ Self-signed certificate created${NC}"
    echo -e "${YELLOW}⚠️  This is a self-signed certificate - browsers will show warnings${NC}"
}

# Function to validate certificate
validate_certificate() {
    echo -e "${YELLOW}🔍 Validating SSL certificate...${NC}"
    
    if [ -f "$SSL_DIR/cert.pem" ] && [ -f "$SSL_DIR/key.pem" ]; then
        # Check certificate validity
        if sudo openssl x509 -in "$SSL_DIR/cert.pem" -text -noout > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Certificate file is valid${NC}"
            
            # Check if private key matches certificate
            CERT_HASH=$(sudo openssl x509 -noout -modulus -in "$SSL_DIR/cert.pem" | openssl md5)
            KEY_HASH=$(sudo openssl rsa -noout -modulus -in "$SSL_DIR/key.pem" | openssl md5)
            
            if [ "$CERT_HASH" = "$KEY_HASH" ]; then
                echo -e "${GREEN}✅ Private key matches certificate${NC}"
                
                # Display certificate information
                echo -e "${BLUE}📋 Certificate Information:${NC}"
                sudo openssl x509 -in "$SSL_DIR/cert.pem" -text -noout | grep -E "(Subject:|Issuer:|Not Before|Not After|DNS:|IP Address:)"
                
                return 0
            else
                echo -e "${RED}❌ Private key does not match certificate${NC}"
                return 1
            fi
        else
            echo -e "${RED}❌ Certificate file is invalid${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ Certificate or key file not found${NC}"
        return 1
    fi
}

# Function to setup automatic renewal
setup_renewal() {
    echo -e "${YELLOW}🔄 Setting up automatic certificate renewal...${NC}"
    
    # Create renewal script
    sudo tee /usr/local/bin/renew-ssl.sh > /dev/null <<'EOF'
#!/bin/bash
# Automatic SSL certificate renewal script for EchoTune AI

DOMAIN="${DOMAIN:-primosphere.studio}"
SSL_DIR="${SSL_DIR:-/etc/nginx/ssl}"

# Renew Let's Encrypt certificates
if command -v certbot &> /dev/null; then
    certbot renew --quiet
    
    # Copy renewed certificates if they exist
    if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
        cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/cert.pem"
        cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/key.pem"
        cp "/etc/letsencrypt/live/$DOMAIN/chain.pem" "$SSL_DIR/chain.pem"
        
        # Reload nginx
        nginx -t && systemctl reload nginx
    fi
fi
EOF
    
    sudo chmod +x /usr/local/bin/renew-ssl.sh
    
    # Add to crontab
    (sudo crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/renew-ssl.sh") | sudo crontab -
    
    echo -e "${GREEN}✅ Automatic renewal configured${NC}"
}

# Main execution
main() {
    echo -e "${BLUE}Starting SSL setup...${NC}"
    
    # Generate DH parameters first
    generate_dhparam
    
    # Try Let's Encrypt first, fallback to self-signed
    if setup_letsencrypt; then
        echo -e "${GREEN}✅ Let's Encrypt certificate setup complete${NC}"
        setup_renewal
    else
        echo -e "${YELLOW}⚠️  Let's Encrypt failed, creating self-signed certificate...${NC}"
        create_selfsigned
    fi
    
    # Validate the certificate
    if validate_certificate; then
        echo -e "${GREEN}✅ SSL certificate setup complete!${NC}"
        
        # Set proper permissions
        sudo chown -R root:root "$SSL_DIR"
        sudo chmod 600 "$SSL_DIR"/*.pem
        
        echo -e "${BLUE}📋 Next steps:${NC}"
        echo "1. Update your nginx configuration to use:"
        echo "   ssl_certificate $SSL_DIR/cert.pem;"
        echo "   ssl_certificate_key $SSL_DIR/key.pem;"
        echo "2. Test nginx configuration: nginx -t"
        echo "3. Reload nginx: systemctl reload nginx"
        echo "4. Test HTTPS: https://$DOMAIN"
        
    else
        echo -e "${RED}❌ SSL certificate setup failed${NC}"
        exit 1
    fi
}

# Parse command line arguments
case "${1:-auto}" in
    letsencrypt)
        generate_dhparam
        setup_letsencrypt
        validate_certificate
        ;;
    selfsigned)
        generate_dhparam
        create_selfsigned
        validate_certificate
        ;;
    auto)
        main
        ;;
    validate)
        validate_certificate
        ;;
    renew)
        setup_renewal
        ;;
    *)
        echo "Usage: $0 {auto|letsencrypt|selfsigned|validate|renew}"
        echo "  auto       - Try Let's Encrypt, fallback to self-signed"
        echo "  letsencrypt - Use Let's Encrypt only"
        echo "  selfsigned - Create self-signed certificate"
        echo "  validate   - Validate existing certificate"
        echo "  renew      - Setup automatic renewal"
        exit 1
        ;;
esac