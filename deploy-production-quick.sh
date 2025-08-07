#!/bin/bash
# 🚀 Quick Production Deployment Script
# Run this after updating your DigitalOcean token in .env

set -e

echo "🚀 EchoTune AI Quick Production Deployment"
echo "=========================================="
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "💡 Copy production.env.txt to .env and update your tokens"
    exit 1
fi

# Load environment variables
source .env

# Check for required variables
if [ -z "$DIGITALOCEAN_TOKEN" ]; then
    echo "❌ DIGITALOCEAN_TOKEN not set in .env file"
    echo "💡 Update your .env file with a valid DigitalOcean API token"
    exit 1
fi

if [ -z "$DOMAIN" ]; then
    echo "❌ DOMAIN not set in .env file"
    exit 1
fi

echo "🔍 Validating environment configuration..."
echo "   Domain: $DOMAIN"
echo "   DigitalOcean Token: ${DIGITALOCEAN_TOKEN:0:12}..."

# Test DigitalOcean token
echo ""
echo "🧪 Testing DigitalOcean authentication..."
response=$(curl -s -w "%{http_code}" -o /dev/null \
  -H "Authorization: Bearer $DIGITALOCEAN_TOKEN" \
  -H "Content-Type: application/json" \
  "https://api.digitalocean.com/v2/account")

if [ "$response" = "200" ]; then
    echo "✅ DigitalOcean token is valid!"
    
    # Initialize doctl
    echo "🔧 Initializing doctl..."
    doctl auth init --access-token $DIGITALOCEAN_TOKEN
    
    # Get account info
    echo "📋 Account information:"
    doctl account get --format Email,Name,Status
    
else
    echo "❌ DigitalOcean token is invalid (HTTP $response)"
    echo "💡 Generate a new token at: https://cloud.digitalocean.com/account/api/tokens"
    exit 1
fi

echo ""
echo "🏗️  Preparing deployment configuration..."

# Create app platform configuration
cat > app-platform-production.yaml << EOF
name: echotune-ai-production
services:
- name: web
  source_dir: /
  github:
    repo: dzp5103/Spotify-echo
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  http_port: 3000
  envs:
  - key: NODE_ENV
    value: production
  - key: PORT
    value: "3000"
  - key: DOMAIN
    value: "$DOMAIN"
  - key: SPOTIFY_CLIENT_ID
    value: "$SPOTIFY_CLIENT_ID"
  - key: SPOTIFY_CLIENT_SECRET
    value: "$SPOTIFY_CLIENT_SECRET"
    type: SECRET
  - key: MONGODB_URI
    value: "$MONGODB_URI"
    type: SECRET
  - key: GEMINI_API_KEY
    value: "$GEMINI_API_KEY"
    type: SECRET
  - key: OPENROUTER_API_KEY
    value: "$OPENROUTER_API_KEY"
    type: SECRET
  - key: DEFAULT_LLM_PROVIDER
    value: "$DEFAULT_LLM_PROVIDER"
  - key: ENABLE_SQLITE_FALLBACK
    value: "true"
  - key: ENABLE_ADVANCED_SETTINGS
    value: "true"
  routes:
  - path: /
domain:
  name: $DOMAIN
EOF

echo "✅ App Platform configuration created"

echo ""
echo "🚀 Deploying to DigitalOcean App Platform..."
echo "⏱️  This may take a few minutes..."

# Deploy to App Platform
if doctl apps create --spec app-platform-production.yaml; then
    echo ""
    echo "🎉 Deployment initiated successfully!"
    
    # Get app info
    echo "📊 App information:"
    doctl apps list --format ID,Spec.Name,DefaultIngress,CreatedAt
    
    echo ""
    echo "📋 Next Steps:"
    echo "1. Monitor deployment: doctl apps list"
    echo "2. View logs: doctl apps logs <app-id> --follow"
    echo "3. Check health: curl https://$DOMAIN/health"
    echo "4. Access Advanced Settings: https://$DOMAIN (click Settings tab)"
    
    echo ""
    echo "🔗 Useful Commands:"
    echo "   doctl apps get <app-id>                 # Get app details"
    echo "   doctl apps logs <app-id> --follow       # View logs"
    echo "   doctl apps update <app-id> --spec=...   # Update app"
    echo "   doctl apps delete <app-id>              # Delete app"
    
else
    echo "❌ Deployment failed!"
    echo "💡 Check your DigitalOcean account limits and try again"
    echo "🔧 You can also try updating an existing app:"
    echo "   doctl apps list"
    echo "   doctl apps update <app-id> --spec=app-platform-production.yaml"
    exit 1
fi

echo ""
echo "✅ Quick Production Deployment Complete!"
echo "🌐 Your EchoTune AI app should be available at: https://$DOMAIN"
echo ""
echo "🎛️  Advanced Settings Features:"
echo "   ✅ Multi-provider LLM configuration"
echo "   ✅ Real-time system monitoring" 
echo "   ✅ Database management dashboard"
echo "   ✅ Live performance metrics"
echo "   ✅ Configuration persistence"
echo ""
echo "💡 Allow 5-10 minutes for full deployment and DNS propagation"