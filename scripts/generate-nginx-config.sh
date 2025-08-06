#!/bin/bash

# Dynamic Nginx Configuration Generator for EchoTune AI
# Generates nginx.conf from nginx.conf.template using environment variables

set -e

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Set default values if not provided
export DOMAIN="${DOMAIN:-localhost}"
export NGINX_WORKER_CONNECTIONS="${NGINX_WORKER_CONNECTIONS:-1024}"
export API_RATE_LIMIT="${API_RATE_LIMIT:-10r/s}"
export AUTH_RATE_LIMIT="${AUTH_RATE_LIMIT:-5r/m}"
export GENERAL_RATE_LIMIT="${GENERAL_RATE_LIMIT:-50r/s}"
export BACKEND_HOST="${BACKEND_HOST:-app}"
export BACKEND_PORT="${BACKEND_PORT:-3000}"
export SSL_ENABLED="${SSL_ENABLED:-false}"
export SSL_CERT_PATH="${SSL_CERT_PATH:-/etc/nginx/ssl/cert.pem}"
export SSL_KEY_PATH="${SSL_KEY_PATH:-/etc/nginx/ssl/key.pem}"
export SSL_CHAIN_PATH="${SSL_CHAIN_PATH:-/etc/nginx/ssl/chain.pem}"

echo "🔧 Generating nginx configuration for domain: $DOMAIN"
echo "📊 SSL Enabled: $SSL_ENABLED"
echo "🔧 Backend: $BACKEND_HOST:$BACKEND_PORT"

# Backup existing nginx.conf if it exists
if [ -f nginx.conf ]; then
    cp nginx.conf nginx.conf.backup.$(date +%Y%m%d_%H%M%S)
    echo "📋 Backed up existing nginx.conf"
fi

# Generate nginx.conf from template
envsubst < nginx.conf.template > nginx.conf

# Validate the generated configuration
if command -v nginx >/dev/null 2>&1; then
    if nginx -t -c "$(pwd)/nginx.conf"; then
        echo "✅ Generated nginx configuration is valid"
    else
        echo "❌ Generated nginx configuration is invalid"
        exit 1
    fi
else
    echo "⚠️  nginx not installed, skipping validation"
fi

echo "🎉 nginx.conf generated successfully"

# Show configuration summary
echo ""
echo "📋 Configuration Summary:"
echo "   Domain: $DOMAIN"
echo "   SSL: $SSL_ENABLED"
echo "   Backend: $BACKEND_HOST:$BACKEND_PORT"
echo "   Rate Limits: API=$API_RATE_LIMIT, Auth=$AUTH_RATE_LIMIT, General=$GENERAL_RATE_LIMIT"
echo ""

# Optionally reload nginx if it's running
if [ "$1" = "--reload" ] && command -v nginx >/dev/null 2>&1; then
    if systemctl is-active --quiet nginx; then
        echo "🔄 Reloading nginx..."
        sudo nginx -s reload
        echo "✅ nginx reloaded"
    else
        echo "⚠️  nginx is not running, skipping reload"
    fi
fi