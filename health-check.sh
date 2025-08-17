#!/bin/bash

# EchoTune AI Health Check Script

echo "🏥 Performing EchoTune AI health check..."

# Check if services are running
if ! docker-compose -f docker-compose.production.yml ps | grep -q "Up"; then
    echo "❌ Services are not running"
    exit 1
fi

# Check API health
if curl -f http://localhost:3000/api/health; then
    echo "✅ API health check passed"
else
    echo "❌ API health check failed"
    exit 1
fi

# Check database connection
if curl -f http://localhost:3000/api/database/health; then
    echo "✅ Database health check passed"
else
    echo "❌ Database health check failed"
    exit 1
fi

# Check Redis connection
if curl -f http://localhost:3000/api/cache/health; then
    echo "✅ Redis health check passed"
else
    echo "❌ Redis health check failed"
    exit 1
fi

echo "🎉 All health checks passed!"