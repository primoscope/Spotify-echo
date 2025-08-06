#!/bin/bash

# Simple EchoTune AI Deployment Validation
# Tests our key fixes: Docker build, health check 200 status, port binding

set -e

echo "🔍 EchoTune AI - Deployment Fix Validation"
echo "========================================="

# Test 1: Docker build (no interactive prompts)
echo "📦 Testing Docker build..."
if docker build -t echotune-test . >/dev/null 2>&1; then
    echo "✅ Docker build: SUCCESS (no interactive prompts)"
else
    echo "❌ Docker build: FAILED"
    exit 1
fi

# Test 2: Container startup and port binding  
echo "🚀 Starting container..."
CONTAINER_ID=$(docker run -d -p 3000:3000 -e NODE_ENV=production echotune-test)
echo "Container ID: $CONTAINER_ID"

# Wait for startup
echo "⏳ Waiting 10 seconds for startup..."
sleep 10

# Test 3: Health check returns 200 (not 503)
echo "🏥 Testing health check HTTP status..."
HTTP_STATUS=$(curl -w "%{http_code}" -s -o /dev/null http://localhost:3000/health || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Health check: HTTP 200 (FIXED - no more 503 errors!)"
else
    echo "❌ Health check: HTTP $HTTP_STATUS (expected 200)"
    docker logs $CONTAINER_ID
    docker stop $CONTAINER_ID
    exit 1
fi

# Test 4: Application accessible (port binding works)
echo "🌐 Testing port binding..."
if curl -s http://localhost:3000/health >/dev/null; then
    echo "✅ Port binding: Accessible on 0.0.0.0:3000"
else
    echo "❌ Port binding: NOT accessible"
    docker stop $CONTAINER_ID
    exit 1
fi

# Test 5: Container health script works
echo "🔧 Testing container health script..."
if docker exec $CONTAINER_ID /app/health-check.sh >/dev/null 2>&1; then
    echo "✅ Container health script: WORKING"
else
    echo "❌ Container health script: FAILED"
    docker stop $CONTAINER_ID
    exit 1
fi

# Cleanup
echo "🧹 Cleaning up..."
docker stop $CONTAINER_ID >/dev/null 2>&1

echo ""
echo "🎉 ALL DOCKER & HEALTH CHECK FIXES VERIFIED!"
echo ""
echo "✅ Docker builds without interactive prompts"
echo "✅ Health check returns HTTP 200 (fixes DigitalOcean 503s)"  
echo "✅ Server binds to 0.0.0.0:3000 for external access"
echo "✅ Container health check script functional"
echo "✅ Ready for DigitalOcean App Platform deployment"
echo ""
echo "🚀 The Docker and health check issues are RESOLVED!"