#!/bin/bash
# DigitalOcean Token Validation Script
# Run this after adding your new token to .env

echo "🧪 Testing DigitalOcean Token..."

# Load environment variables
source .env

# Test token against DigitalOcean API
response=$(curl -s -w "%{http_code}" -o /dev/null \
  -H "Authorization: Bearer $DIGITALOCEAN_TOKEN" \
  -H "Content-Type: application/json" \
  "https://api.digitalocean.com/v2/account")

if [ "$response" = "200" ]; then
    echo "✅ Token is VALID!"
    echo "🚀 Ready for production deployment"
    
    # Test additional services
    echo "🧪 Testing Container Registry access..."
    doctl auth init --access-token $DIGITALOCEAN_TOKEN > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo "✅ Container Registry access confirmed"
        echo "🎯 All DigitalOcean services are accessible"
        
        # Run production deployment validation
        echo "🚀 Running production deployment validation..."
        node scripts/production-deployment-validator.js
    else
        echo "⚠️  Token valid but registry access needs verification"
    fi
else
    echo "❌ Token is INVALID (HTTP $response)"
    echo "🔧 Please regenerate your token with full access permissions"
fi
