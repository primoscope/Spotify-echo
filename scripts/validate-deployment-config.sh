#!/bin/bash

# =============================================================================
# EchoTune AI - Nginx & SSL Configuration Validator
# =============================================================================

echo "🔍 EchoTune AI - Nginx & SSL Configuration Validation"
echo "=" | head -c 60; echo

# Load configuration from .env if available
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Default values
DOMAIN=${DOMAIN:-"localhost"}
SSL_CERT_PATH=${SSL_CERT_PATH:-"/etc/nginx/ssl/$DOMAIN.crt"}
SSL_KEY_PATH=${SSL_KEY_PATH:-"/etc/nginx/ssl/$DOMAIN.key"}
PORT=${PORT:-3000}

echo "📋 Configuration Summary:"
echo "Domain: $DOMAIN"
echo "SSL Cert: $SSL_CERT_PATH"
echo "SSL Key: $SSL_KEY_PATH"
echo "App Port: $PORT"
echo ""

# Check Nginx configuration
echo "🌐 Nginx Configuration Check"
echo "-" | head -c 28; echo

NGINX_CONFIG="nginx.conf"
if [ ! -f "$NGINX_CONFIG" ]; then
    echo "❌ Nginx configuration file not found: $NGINX_CONFIG"
    exit 1
fi

echo "✅ Nginx configuration file found: $NGINX_CONFIG"

# Validate nginx config syntax
if command -v nginx >/dev/null 2>&1; then
    echo "Testing nginx configuration syntax..."
    if nginx -t -c "$(pwd)/$NGINX_CONFIG" 2>/dev/null; then
        echo "✅ Nginx configuration syntax is valid"
    else
        echo "❌ Nginx configuration syntax errors found"
        nginx -t -c "$(pwd)/$NGINX_CONFIG"
    fi
else
    echo "⚠️  Nginx not installed - cannot validate syntax"
fi

# Check SSL configuration
echo ""
echo "🔐 SSL Configuration Check" 
echo "-" | head -c 25; echo

SSL_DIR=$(dirname "$SSL_CERT_PATH")

# Check SSL directory
if [ ! -d "$SSL_DIR" ]; then
    echo "❌ SSL directory not found: $SSL_DIR"
    echo "   Creating directory structure..."
    mkdir -p "$SSL_DIR"
    echo "✅ Created SSL directory: $SSL_DIR"
else
    echo "✅ SSL directory exists: $SSL_DIR"
fi

# Check SSL certificate
if [ -f "$SSL_CERT_PATH" ]; then
    echo "✅ SSL certificate found: $SSL_CERT_PATH"
    
    # Check certificate validity
    if command -v openssl >/dev/null 2>&1; then
        echo "Checking certificate details..."
        CERT_INFO=$(openssl x509 -in "$SSL_CERT_PATH" -text -noout 2>/dev/null)
        if [ $? -eq 0 ]; then
            echo "✅ Certificate is readable"
            
            # Extract certificate info
            CERT_SUBJECT=$(echo "$CERT_INFO" | grep "Subject:" | head -n1)
            CERT_EXPIRY=$(echo "$CERT_INFO" | grep "Not After" | head -n1)
            
            echo "   Subject: $CERT_SUBJECT"
            echo "   Expiry: $CERT_EXPIRY"
            
            # Check if certificate matches domain
            if echo "$CERT_INFO" | grep -q "$DOMAIN"; then
                echo "✅ Certificate matches domain: $DOMAIN"
            else
                echo "⚠️  Certificate might not match domain: $DOMAIN"
            fi
        else
            echo "❌ Certificate file is corrupted or invalid"
        fi
    else
        echo "⚠️  OpenSSL not available - cannot validate certificate"
    fi
else
    echo "❌ SSL certificate not found: $SSL_CERT_PATH"
    echo ""
    echo "📝 To generate a self-signed certificate for testing:"
    echo "   mkdir -p $SSL_DIR"
    echo "   openssl req -x509 -newkey rsa:2048 -keyout $SSL_KEY_PATH -out $SSL_CERT_PATH \\"
    echo "       -days 365 -nodes -subj \"/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN\""
    echo ""
    echo "📝 For production, use Let's Encrypt:"
    echo "   sudo certbot certonly --webroot -w /var/www/html -d $DOMAIN"
fi

# Check SSL private key
if [ -f "$SSL_KEY_PATH" ]; then
    echo "✅ SSL private key found: $SSL_KEY_PATH"
    
    if command -v openssl >/dev/null 2>&1; then
        # Verify private key
        if openssl rsa -in "$SSL_KEY_PATH" -check -noout 2>/dev/null; then
            echo "✅ Private key is valid"
            
            # Check if key matches certificate
            if [ -f "$SSL_CERT_PATH" ]; then
                CERT_MODULUS=$(openssl x509 -noout -modulus -in "$SSL_CERT_PATH" 2>/dev/null | openssl md5)
                KEY_MODULUS=$(openssl rsa -noout -modulus -in "$SSL_KEY_PATH" 2>/dev/null | openssl md5)
                
                if [ "$CERT_MODULUS" = "$KEY_MODULUS" ] && [ -n "$CERT_MODULUS" ]; then
                    echo "✅ Private key matches certificate"
                else
                    echo "❌ Private key does not match certificate"
                fi
            fi
        else
            echo "❌ Private key is invalid or corrupted"
        fi
    fi
else
    echo "❌ SSL private key not found: $SSL_KEY_PATH"
fi

# Check domain configuration
echo ""
echo "🌍 Domain & DNS Check"
echo "-" | head -c 19; echo

if [ "$DOMAIN" != "localhost" ] && [ "$DOMAIN" != "127.0.0.1" ]; then
    echo "Checking DNS resolution for: $DOMAIN"
    
    if command -v nslookup >/dev/null 2>&1; then
        IP=$(nslookup "$DOMAIN" | awk '/^Address: / { print $2 }' | tail -n1)
        if [ -n "$IP" ]; then
            echo "✅ Domain resolves to: $IP"
        else
            echo "❌ Domain does not resolve: $DOMAIN"
        fi
    elif command -v dig >/dev/null 2>&1; then
        IP=$(dig +short "$DOMAIN" | tail -n1)
        if [ -n "$IP" ]; then
            echo "✅ Domain resolves to: $IP"
        else
            echo "❌ Domain does not resolve: $DOMAIN"
        fi
    else
        echo "⚠️  DNS tools not available - cannot check domain resolution"
    fi
else
    echo "⚠️  Using localhost/IP - DNS check skipped"
fi

# Check port availability
echo ""
echo "🔌 Port Configuration Check"
echo "-" | head -c 26; echo

# Check if port is in use
if command -v netstat >/dev/null 2>&1; then
    if netstat -tlnp 2>/dev/null | grep -q ":$PORT "; then
        echo "✅ Port $PORT is in use (application likely running)"
    else
        echo "❌ Port $PORT is not in use (application not running)"
    fi
elif command -v ss >/dev/null 2>&1; then
    if ss -tlnp 2>/dev/null | grep -q ":$PORT "; then
        echo "✅ Port $PORT is in use (application likely running)"
    else
        echo "❌ Port $PORT is not in use (application not running)"
    fi
else
    echo "⚠️  Cannot check port status - netstat/ss not available"
fi

# Check application health
echo ""
echo "🏥 Application Health Check"
echo "-" | head -c 26; echo

if command -v curl >/dev/null 2>&1; then
    echo "Testing application health endpoint..."
    
    # Test HTTP first
    if curl -s --connect-timeout 5 "http://localhost:$PORT/health" >/dev/null 2>&1; then
        echo "✅ Application responding on HTTP (port $PORT)"
    else
        echo "❌ Application not responding on HTTP (port $PORT)"
    fi
    
    # Test HTTPS if SSL is configured
    if [ -f "$SSL_CERT_PATH" ] && [ -f "$SSL_KEY_PATH" ]; then
        if curl -k -s --connect-timeout 5 "https://localhost/health" >/dev/null 2>&1; then
            echo "✅ Application responding on HTTPS"
        else
            echo "❌ Application not responding on HTTPS"
        fi
    fi
else
    echo "⚠️  cURL not available - cannot test application health"
fi

# Generate nginx config template if needed
echo ""
echo "⚙️  Nginx Configuration Template"
echo "-" | head -c 31; echo

echo "Current nginx.conf status:"
if grep -q "server_name.*$DOMAIN" nginx.conf 2>/dev/null; then
    echo "✅ Domain configured in nginx.conf"
else
    echo "⚠️  Domain not found in nginx.conf"
    echo ""
    echo "📝 To update nginx configuration for domain $DOMAIN:"
    echo "   sed -i 's/server_name.*/server_name $DOMAIN www.$DOMAIN;/' nginx.conf"
fi

if grep -q "ssl_certificate.*$SSL_CERT_PATH" nginx.conf 2>/dev/null; then
    echo "✅ SSL certificate path configured"
else
    echo "⚠️  SSL certificate path not configured"
fi

if grep -q "ssl_certificate_key.*$SSL_KEY_PATH" nginx.conf 2>/dev/null; then
    echo "✅ SSL private key path configured"  
else
    echo "⚠️  SSL private key path not configured"
fi

# Summary
echo ""
echo "=" | head -c 60; echo
echo "📊 CONFIGURATION SUMMARY"
echo "=" | head -c 60; echo

CHECKS_PASSED=0
CHECKS_TOTAL=6

# Count successful checks
[ -f "$NGINX_CONFIG" ] && CHECKS_PASSED=$((CHECKS_PASSED + 1))
[ -f "$SSL_CERT_PATH" ] && CHECKS_PASSED=$((CHECKS_PASSED + 1))
[ -f "$SSL_KEY_PATH" ] && CHECKS_PASSED=$((CHECKS_PASSED + 1))

if command -v netstat >/dev/null 2>&1 || command -v ss >/dev/null 2>&1; then
    if netstat -tlnp 2>/dev/null | grep -q ":$PORT " || ss -tlnp 2>/dev/null | grep -q ":$PORT "; then
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    fi
fi

if command -v nslookup >/dev/null 2>&1 || command -v dig >/dev/null 2>&1; then
    if [ "$DOMAIN" = "localhost" ] || [ "$DOMAIN" = "127.0.0.1" ]; then
        CHECKS_PASSED=$((CHECKS_PASSED + 1))  # Skip DNS check for localhost
    else
        # Check DNS resolution
        if command -v nslookup >/dev/null 2>&1; then
            IP=$(nslookup "$DOMAIN" 2>/dev/null | awk '/^Address: / { print $2 }' | tail -n1)
        elif command -v dig >/dev/null 2>&1; then
            IP=$(dig +short "$DOMAIN" 2>/dev/null | tail -n1)
        fi
        [ -n "$IP" ] && CHECKS_PASSED=$((CHECKS_PASSED + 1))
    fi
else
    CHECKS_PASSED=$((CHECKS_PASSED + 1))  # Skip if no DNS tools
fi

if command -v curl >/dev/null 2>&1; then
    if curl -s --connect-timeout 5 "http://localhost:$PORT/health" >/dev/null 2>&1; then
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    fi
else
    CHECKS_PASSED=$((CHECKS_PASSED + 1))  # Skip if no curl
fi

PERCENTAGE=$((CHECKS_PASSED * 100 / CHECKS_TOTAL))

echo "Configuration checks: $CHECKS_PASSED/$CHECKS_TOTAL passed ($PERCENTAGE%)"

# Deployment readiness
echo ""
echo "🚀 DEPLOYMENT READINESS"
echo "-" | head -c 21; echo

if [ $PERCENTAGE -ge 90 ]; then
    echo "🟢 READY FOR DEPLOYMENT"
    echo "   All critical components are properly configured"
elif [ $PERCENTAGE -ge 70 ]; then
    echo "🟡 MOSTLY READY"
    echo "   Some optional components need attention"
else
    echo "🔴 NOT READY FOR DEPLOYMENT"
    echo "   Critical configuration issues need to be resolved"
fi

echo ""
echo "📋 NEXT STEPS:"

if [ ! -f "$SSL_CERT_PATH" ] || [ ! -f "$SSL_KEY_PATH" ]; then
    echo "1. Generate or install SSL certificates"
fi

if ! netstat -tlnp 2>/dev/null | grep -q ":$PORT " && ! ss -tlnp 2>/dev/null | grep -q ":$PORT "; then
    echo "2. Start the EchoTune AI application (npm start)"
fi

if [ "$DOMAIN" != "localhost" ] && [ "$DOMAIN" != "127.0.0.1" ]; then
    if command -v nslookup >/dev/null 2>&1; then
        IP=$(nslookup "$DOMAIN" 2>/dev/null | awk '/^Address: / { print $2 }' | tail -n1)
        [ -z "$IP" ] && echo "3. Configure DNS to point $DOMAIN to your server"
    fi
fi

echo ""
echo "📖 For detailed deployment guide, see DEPLOYMENT.md"
echo "✨ EchoTune AI - Your music, your way!"

exit 0