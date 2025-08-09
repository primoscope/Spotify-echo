# Docker Production Deployment Guide

## 🐳 Overview

EchoTune AI provides production-ready Docker containers optimized for performance, security, and reliability. This guide covers Docker-based deployment options for various environments.

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Clone repository
git clone https://github.com/dzp5103/Spotify-echo.git
cd Spotify-echo

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Start services
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f app
```

### Option 2: Docker Run (Simple)

```bash
# Pull latest image
docker pull ghcr.io/dzp5103/echotune-ai:latest

# Run container
docker run -d \
  --name echotune-ai \
  -p 3000:3000 \
  --env-file .env \
  ghcr.io/dzp5103/echotune-ai:latest

# Check logs
docker logs -f echotune-ai
```

### Option 3: Build from Source

```bash
# Clone and build
git clone https://github.com/dzp5103/Spotify-echo.git
cd Spotify-echo

# Build production image
docker build -t echotune-ai:local .

# Run
docker run -d -p 3000:3000 --env-file .env echotune-ai:local
```

## 🏗️ Docker Architecture

### Multi-Stage Dockerfile

```dockerfile
# Build stage - Node.js 20 Alpine
FROM node:20-alpine AS builder
# Install dependencies, build application

# Production stage - Optimized runtime
FROM node:20-alpine AS production
# Copy built artifacts, configure non-root user
# Set up health checks, security hardening
```

### Container Specifications

- **Base Image:** `node:20-alpine` (security and size optimized)
- **User:** Non-root user `echotune` (uid: 1001)
- **Exposed Port:** 3000
- **Health Check:** `/health` endpoint every 30s
- **Platforms:** linux/amd64, linux/arm64

## 📦 Available Images

### GitHub Container Registry
```bash
# Latest stable release
ghcr.io/dzp5103/echotune-ai:latest

# Specific version
ghcr.io/dzp5103/echotune-ai:v2.1.0

# Development branch
ghcr.io/dzp5103/echotune-ai:main
```

### Image Tags
- `latest` - Latest stable release
- `v{version}` - Specific version tags
- `main` - Latest main branch build
- `{branch}` - Specific branch builds

## ⚙️ Environment Configuration

### Required Environment Variables
```bash
# Application
NODE_ENV=production
PORT=3000

# Security
SESSION_SECRET=your-secure-session-secret-32-chars-min
JWT_SECRET=your-secure-jwt-secret-32-chars-min

# Spotify API
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/auth/callback

# Database
MONGODB_URI=mongodb://localhost:27017/echotune

# AI Providers (choose one or both)
OPENAI_API_KEY=your-openai-api-key
# OR/AND
GEMINI_API_KEY=your-gemini-api-key
LLM_PROVIDER=openai
```

### Optional Environment Variables
```bash
# Redis caching
REDIS_URL=redis://localhost:6379

# Browser automation (MCP)
BROWSERBASE_API_KEY=your-browserbase-api-key
BROWSERBASE_PROJECT_ID=your-browserbase-project-id

# Performance tuning
NODE_OPTIONS=--max-old-space-size=1024
HEALTH_CHECK_ENABLED=true
METRICS_ENABLED=true

# Logging
LOG_LEVEL=info
```

## 🐙 Docker Compose Configuration

### Full Stack Setup

```yaml
version: '3.8'

services:
  app:
    image: ghcr.io/dzp5103/echotune-ai:latest
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      MONGODB_URI: mongodb://mongodb:27017/echotune
      REDIS_URL: redis://redis:6379
      # Add your secrets via .env file
    env_file:
      - .env
    depends_on:
      - mongodb
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  mongodb:
    image: mongo:7.0
    environment:
      MONGO_INITDB_ROOT_USERNAME: echotune
      MONGO_INITDB_ROOT_PASSWORD: secure_password_here
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped

  redis:
    image: redis:7.2-alpine
    command: redis-server --requirepass secure_redis_password_here
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  mongodb_data:
  redis_data:
```

### Production with Nginx (Advanced)

```yaml
version: '3.8'

services:
  app:
    image: ghcr.io/dzp5103/echotune-ai:latest
    environment:
      NODE_ENV: production
      TRUST_PROXY: "true"
    env_file:
      - .env
    depends_on:
      - mongodb
      - redis
    restart: unless-stopped

  nginx:
    image: nginx:1.25-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    restart: unless-stopped

  mongodb:
    image: mongo:7.0
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGODB_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGODB_PASSWORD}
    volumes:
      - mongodb_data:/data/db
      - ./backups:/backups
    restart: unless-stopped

  redis:
    image: redis:7.2-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  mongodb_data:
  redis_data:
```

## 🛠️ Build Configuration

### Local Development Build

```bash
# Development with hot reload
docker build --target development -t echotune-dev .
docker run -p 3000:3000 -v $(pwd):/app echotune-dev

# Or use docker-compose override
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Production Build

```bash
# Multi-platform build
docker buildx create --use
docker buildx build --platform linux/amd64,linux/arm64 -t echotune-ai:production .

# Optimized production build
docker build \
  --build-arg NODE_ENV=production \
  --build-arg BUILD_VERSION=$(git describe --tags) \
  --build-arg BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
  --build-arg VCS_REF=$(git rev-parse HEAD) \
  -t echotune-ai:production .
```

### Build Arguments

```dockerfile
ARG BUILD_VERSION=latest
ARG BUILD_DATE
ARG VCS_REF
ARG NODE_ENV=production
```

## 🔒 Security Hardening

### Container Security Features

1. **Non-root User**
   ```dockerfile
   RUN addgroup -g 1001 -S nodejs && \
       adduser -S echotune -u 1001 -G nodejs
   USER echotune
   ```

2. **Minimal Base Image**
   - Alpine Linux base (small attack surface)
   - No unnecessary packages
   - Regular security updates

3. **Health Checks**
   ```dockerfile
   HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
       CMD /app/health-check.sh
   ```

4. **Process Management**
   ```dockerfile
   ENTRYPOINT ["/usr/bin/dumb-init", "--"]
   CMD ["npm", "start"]
   ```

### Runtime Security

```bash
# Run with security constraints
docker run -d \
  --name echotune-ai \
  --read-only \
  --tmpfs /tmp \
  --tmpfs /app/logs \
  --cap-drop ALL \
  --cap-add NET_BIND_SERVICE \
  --no-new-privileges \
  -p 3000:3000 \
  ghcr.io/dzp5103/echotune-ai:latest
```

## 🚀 Deployment Strategies

### Single Container (Development)

```bash
# Simple deployment for development/testing
docker run -d \
  --name echotune-dev \
  -p 3000:3000 \
  --env-file .env.dev \
  --restart unless-stopped \
  ghcr.io/dzp5103/echotune-ai:latest
```

### Docker Swarm (Production)

```yaml
version: '3.8'

services:
  app:
    image: ghcr.io/dzp5103/echotune-ai:latest
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure
      placement:
        constraints:
          - node.role == worker
    ports:
      - "3000:3000"
    networks:
      - echotune-network
    secrets:
      - spotify_client_secret
      - jwt_secret

secrets:
  spotify_client_secret:
    external: true
  jwt_secret:
    external: true

networks:
  echotune-network:
    driver: overlay
```

### Kubernetes (Enterprise)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: echotune-ai
spec:
  replicas: 3
  selector:
    matchLabels:
      app: echotune-ai
  template:
    metadata:
      labels:
        app: echotune-ai
    spec:
      containers:
      - name: echotune-ai
        image: ghcr.io/dzp5103/echotune-ai:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: production
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: echotune-secrets
              key: mongodb-uri
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 60
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 5
```

## 📊 Monitoring & Logging

### Container Health Monitoring

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' echotune-ai

# View health check logs
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' echotune-ai
```

### Log Management

```bash
# View logs
docker logs -f echotune-ai

# Structured logging with docker-compose
docker-compose logs -f app

# Export logs
docker logs echotune-ai > app.log 2>&1
```

### Metrics Collection

```yaml
# Prometheus monitoring (docker-compose)
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Container Won't Start
```bash
# Check logs
docker logs echotune-ai

# Common solutions:
- Check environment variables
- Verify port availability
- Check file permissions
- Ensure database connectivity
```

#### 2. Health Check Failures
```bash
# Manual health check
curl http://localhost:3000/health

# Debug container
docker exec -it echotune-ai sh

# Check processes
docker exec echotune-ai ps aux
```

#### 3. Performance Issues
```bash
# Monitor resource usage
docker stats echotune-ai

# Increase memory limit
docker run -m 2g echotune-ai:latest

# Check Node.js heap
docker exec echotune-ai node -e "console.log(process.memoryUsage())"
```

#### 4. Database Connection Issues
```bash
# Test MongoDB connectivity from container
docker exec echotune-ai curl mongodb:27017

# Check network connectivity
docker exec echotune-ai nslookup mongodb

# Verify connection string
docker exec echotune-ai env | grep MONGODB_URI
```

### Debug Mode

```bash
# Run with debug output
docker run -it \
  -e DEBUG=* \
  -e LOG_LEVEL=debug \
  -p 3000:3000 \
  ghcr.io/dzp5103/echotune-ai:latest
```

## 🎯 Performance Optimization

### Resource Allocation
```bash
# Recommended resource limits
docker run -d \
  --memory=1g \
  --cpus="1.0" \
  --name echotune-ai \
  ghcr.io/dzp5103/echotune-ai:latest
```

### Node.js Optimization
```bash
# Environment variables for performance
NODE_OPTIONS=--max-old-space-size=1024
UV_THREADPOOL_SIZE=4
```

### Caching Strategy
```yaml
services:
  app:
    environment:
      REDIS_URL: redis://redis:6379
      CACHE_TTL: 300
      ENABLE_CACHING: "true"
```

## 🔄 Updates & Maintenance

### Update Strategy
```bash
# Pull latest image
docker pull ghcr.io/dzp5103/echotune-ai:latest

# Rolling update with docker-compose
docker-compose pull
docker-compose up -d --no-deps app

# Zero-downtime update (with load balancer)
docker-compose up -d --scale app=2
sleep 30
docker-compose up -d --no-deps --scale app=1
```

### Backup & Recovery
```bash
# Database backup
docker exec mongodb-container mongodump --out /backups/$(date +%Y%m%d)

# Volume backup
docker run --rm \
  -v echotune_mongodb_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/mongodb-$(date +%Y%m%d).tar.gz /data
```

## 📚 Additional Resources

- [Docker Best Practices](https://docs.docker.com/develop/best-practices/)
- [Multi-stage Builds](https://docs.docker.com/develop/dev-best-practices/)
- [Docker Security](https://docs.docker.com/engine/security/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)

---

**Need Help?** Check the troubleshooting section above or open an issue in the GitHub repository.