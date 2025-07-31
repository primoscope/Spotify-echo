#!/bin/bash

# EchoTune AI - Application Deployment Script
# This script builds and deploys the application

set -e

echo "🚀 EchoTune AI - Deployment"
echo "=========================="

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please create it from .env.example"
    exit 1
fi

# Check if SSL certificates exist
if [ ! -f "ssl/primosphere.studio.crt" ] || [ ! -f "ssl/primosphere.studio.key" ]; then
    echo "⚠️  SSL certificates not found in ssl/ directory"
    echo "   Please ensure you have:"
    echo "   - ssl/primosphere.studio.crt"
    echo "   - ssl/primosphere.studio.key"
    echo ""
    echo "   You can get free SSL certificates from Let's Encrypt:"
    echo "   sudo certbot --nginx -d primosphere.studio -d www.primosphere.studio"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Build and start services
echo "🏗️  Building application..."
docker-compose build --no-cache

echo "🔄 Starting services..."
docker-compose down
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check health
echo "🏥 Checking application health..."
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Application is healthy!"
else
    echo "❌ Application health check failed"
    echo "📋 Checking logs..."
    docker-compose logs app
    exit 1
fi

# Show status
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "✅ Deployment complete!"
echo "🌐 Application should be available at:"
echo "   - http://localhost:3000 (direct)"
echo "   - https://primosphere.studio (with SSL)"
echo ""
echo "📋 View logs: docker-compose logs -f"
echo "🔄 Restart: docker-compose restart"
echo "🛑 Stop: docker-compose down"