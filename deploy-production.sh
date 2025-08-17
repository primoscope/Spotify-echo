#!/bin/bash

# EchoTune AI Production Deployment Script

echo "🚀 Starting EchoTune AI production deployment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Build and start services
echo "🔧 Building and starting services..."
docker-compose -f docker-compose.production.yml up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Health check
echo "🏥 Performing health check..."
if curl -f http://localhost:3000/api/health; then
    echo "✅ Deployment successful! EchoTune AI is running at http://localhost:3000"
else
    echo "❌ Health check failed. Please check the logs:"
    docker-compose -f docker-compose.production.yml logs
    exit 1
fi

echo "🎉 Deployment completed successfully!"