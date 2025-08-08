# 🐳 EchoTune AI - Enhanced Docker Deployment Guide

[![Docker](https://img.shields.io/badge/Deploy%20with%20Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://hub.docker.com/r/dzp5103/echotune-ai)

## Overview

This comprehensive guide covers all aspects of deploying EchoTune AI using Docker, from simple local development to production-ready containerized deployments with orchestration, monitoring, and scaling.

## 🚀 Quick Start Options

| Method | Time | Best For | Command |
|--------|------|----------|---------|
| **One-Command Deploy** | 2 min | Ubuntu 22.04 servers | `curl -sSL https://raw.githubusercontent.com/dzp5103/Spotify-echo/main/scripts/simple-deploy.sh \| bash` |
| **Docker Compose** | 3 min | Local development | `docker-compose up -d` |
| **Manual Docker** | 5 min | Custom configurations | `docker build . && docker run` |

## 📋 Prerequisites

### System Requirements

**Minimum:**
- Docker 20.10+ and Docker Compose 2.0+
- 2GB RAM, 1 CPU core
- 10GB disk space

**Recommended:**
- Docker 24.0+ and Docker Compose 2.20+
- 4GB RAM, 2 CPU cores
- 20GB disk space

**Operating Systems:**
- ✅ Ubuntu 20.04/22.04 LTS
- ✅ Debian 11/12
- ✅ CentOS 8/Rocky Linux 9
- ✅ macOS 12+ (Docker Desktop)
- ✅ Windows 10/11 (Docker Desktop or WSL2)

### Docker Installation

#### Ubuntu/Debian
```bash
# Official Docker installation
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
sudo systemctl enable docker
sudo systemctl start docker

# Verify installation
docker --version
docker-compose --version
```

#### CentOS/RHEL/Rocky Linux
```bash
# Install Docker
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo dnf install docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER
```

#### macOS/Windows
```bash
# Download Docker Desktop from:
# https://docs.docker.com/desktop/
# Follow installation instructions for your platform
```

## 🎯 Deployment Methods

### Method 1: One-Command Deployment (Recommended)

**For Ubuntu 22.04 servers with complete setup:**

```bash
# Downloads, installs Docker, configures environment, and starts services
curl -sSL https://raw.githubusercontent.com/dzp5103/Spotify-echo/main/scripts/simple-deploy.sh | bash
```

**What this script does:**
- ✅ Checks system prerequisites
- ✅ Installs Docker if needed
- ✅ Clones repository
- ✅ Configures environment
- ✅ Sets up helpful aliases
- ✅ Builds and starts all services
- ✅ Verifies deployment health

### Method 2: Docker Compose (Development)

**Clone and run:**
```bash
# Clone repository
git clone https://github.com/dzp5103/Spotify-echo.git
cd Spotify-echo

# Copy environment configuration
cp .env.example .env

# Edit configuration (optional for demo mode)
nano .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Access application
open http://localhost
```

**Services included:**
- **App**: Main Node.js application
- **Nginx**: Reverse proxy and static file serving
- **MongoDB**: Primary database (optional)
- **Redis**: Caching and session storage (optional)

### Method 3: Manual Docker Build

**For custom configurations:**

```bash
# Clone repository
git clone https://github.com/dzp5103/Spotify-echo.git
cd Spotify-echo

# Build image
docker build -t echotune-ai .

# Run with basic configuration
docker run -d \
  --name echotune-ai \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  echotune-ai

# Run with full configuration
docker run -d \
  --name echotune-ai \
  -p 3000:3000 \
  --env-file .env \
  echotune-ai
```

## 🔧 Environment Configuration

### Basic Configuration (.env)

```bash
# Required for basic functionality
NODE_ENV=production
PORT=3000
DOMAIN=localhost

# Spotify API (get from https://developer.spotify.com/)
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/auth/callback

# Security secrets (generate random strings)
SESSION_SECRET=your_session_secret_here
JWT_SECRET=your_jwt_secret_here
```

### Advanced Configuration

```bash
# Database connections (optional)
MONGODB_URI=mongodb://mongodb:27017/echotune
REDIS_URL=redis://redis:6379

# AI providers (optional - mock provider works without keys)
DEFAULT_LLM_PROVIDER=mock
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key

# Performance optimization
COMPRESSION=true
CACHE_ENABLED=true
RATE_LIMIT_ENABLED=true

# Security
ENABLE_SECURITY_HEADERS=true
FORCE_HTTPS=false  # Set to true for production with SSL

# Monitoring
HEALTH_CHECK_ENABLED=true
LOG_LEVEL=info
```

### Docker Compose Override

**Create `docker-compose.override.yml` for customization:**

```yaml
version: '3.8'

services:
  app:
    # Development mode with hot reload
    build:
      target: development
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    command: npm run dev
    
  nginx:
    # Custom nginx configuration
    volumes:
      - ./nginx/custom.conf:/etc/nginx/conf.d/default.conf
      
  mongodb:
    # Persistent data storage
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=secure_password
      
  redis:
    # Persistent Redis data
    volumes:
      - redis_data:/data

volumes:
  mongodb_data:
  redis_data:
```

## 🏗️ Multi-Stage Docker Build

The application uses an optimized multi-stage Dockerfile:

### Build Stages

1. **Base Stage**: Common dependencies and configuration
2. **Development Stage**: Full development environment with hot reload
3. **Production Stage**: Optimized runtime with minimal footprint

### Build Targets

```bash
# Development build (includes dev dependencies)
docker build --target development -t echotune-ai:dev .

# Production build (optimized)
docker build --target production -t echotune-ai:latest .

# Specific platform builds
docker buildx build --platform linux/amd64,linux/arm64 -t echotune-ai:multi .
```

## 🐧 Ubuntu 22.04 LTS Specific Setup

### Quick Ubuntu 22.04 Installation

For Ubuntu 22.04 LTS users, we provide an optimized setup script:

```bash
# Complete Ubuntu 22.04 setup including Docker
curl -sSL https://raw.githubusercontent.com/dzp5103/Spotify-echo/main/scripts/ubuntu22-docker-setup.sh | sudo bash
```

**What this script provides:**
- ✅ Docker Engine optimized for Ubuntu 22.04 (Jammy Jellyfish)
- ✅ Node.js 20.x LTS with production configuration
- ✅ nginx with security hardening
- ✅ UFW firewall with Docker-compatible rules
- ✅ Application user and directory setup
- ✅ Helpful management aliases

### Ubuntu 22.04 Docker Issues and Solutions

#### Issue: Docker Installation Fails

**Problem**: Standard Docker installation scripts fail on Ubuntu 22.04

**Solution**:
```bash
# Use Ubuntu 22.04 specific Docker installation
sudo apt-get remove docker docker-engine docker.io containerd runc
sudo apt-get update
sudo apt-get install ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Add repository for Jammy (22.04)
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

#### Issue: UFW Firewall Blocks Docker

**Problem**: Ubuntu 22.04's UFW firewall interferes with Docker networking

**Solution**:
```bash
# Configure UFW to work with Docker
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow Docker daemon
sudo ufw allow 2376/tcp

# Enable firewall
sudo ufw --force enable

# Restart Docker after UFW changes
sudo systemctl restart docker
```

#### Issue: Snap Docker Conflicts

**Problem**: Ubuntu 22.04 may have snap Docker installed which conflicts

**Solution**:
```bash
# Remove snap Docker if installed
sudo snap remove docker --purge

# Remove any conflicting packages
sudo apt purge docker.io docker-doc docker-compose podman-docker containerd runc

# Install official Docker (use script above)
```

#### Issue: systemd-resolved DNS Issues

**Problem**: Docker containers can't resolve DNS on Ubuntu 22.04

**Solution**:
```bash
# Configure Docker daemon for DNS
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
    "dns": ["8.8.8.8", "1.1.1.1"],
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    }
}
EOF

sudo systemctl restart docker
```

### Service Management Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View service status
docker-compose ps

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f app

# Execute commands in running containers
docker-compose exec app npm run health-check
docker-compose exec app /bin/sh

# Scale services
docker-compose up -d --scale app=3
```

### Helpful Aliases

**Add to your `.bashrc` or `.zshrc`:**

```bash
# EchoTune AI Docker aliases
alias echotune-start='docker-compose up -d'
alias echotune-stop='docker-compose down'
alias echotune-restart='docker-compose restart'
alias echotune-logs='docker-compose logs -f'
alias echotune-status='docker-compose ps'
alias echotune-health='curl -s http://localhost/health | jq .'
alias echotune-shell='docker-compose exec app /bin/sh'
alias echotune-build='docker-compose build --no-cache'
alias echotune-monitor='watch "docker-compose ps && echo && docker stats --no-stream"'
```

## 📊 Monitoring and Health Checks

### Health Check Endpoint

```bash
# Check application health
curl http://localhost/health

# Expected response for healthy application:
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "checks": {
    "application": { "status": "healthy", "responseTime": "5ms" },
    "database": { "status": "warning", "optional": true },
    "redis": { "status": "warning", "optional": true },
    "spotify": { "status": "healthy" }
  }
}
```

### Container Health Monitoring

```bash
# Monitor container resource usage
docker stats

# Monitor specific containers
docker stats echotune-ai nginx mongodb redis

# Container health status
docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"

# Detailed container inspection
docker inspect echotune-ai
```

### Log Management

```bash
# Application logs
docker-compose logs -f app

# All service logs
docker-compose logs -f

# Filter logs by time
docker-compose logs --since 30m

# Save logs to file
docker-compose logs > deployment.log 2>&1

# Real-time log following
docker-compose logs -f --tail=100
```

## 🚀 Production Deployment

### Production Docker Compose

**Create `docker-compose.prod.yml`:**

```yaml
version: '3.8'

services:
  app:
    build:
      target: production
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    depends_on:
      - mongodb
      - redis
    networks:
      - app-network
    
  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/prod.conf:/etc/nginx/conf.d/default.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - app
    networks:
      - app-network
      
  mongodb:
    image: mongo:7.0-jammy
    restart: unless-stopped
    environment:
      - MONGO_INITDB_ROOT_USERNAME=${MONGODB_ROOT_USER}
      - MONGO_INITDB_ROOT_PASSWORD=${MONGODB_ROOT_PASSWORD}
    volumes:
      - mongodb_prod:/data/db
    networks:
      - app-network
      
  redis:
    image: redis:7.2-alpine
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_prod:/data
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  mongodb_prod:
  redis_prod:
```

**Deploy to production:**

```bash
# Deploy with production configuration
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Use environment-specific file
cp .env.production .env
docker-compose up -d
```

### SSL/TLS Configuration

**Nginx SSL configuration:**

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/certs/key.pem;
    
    location / {
        proxy_pass http://app:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Let's Encrypt SSL setup:**

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🐳 Container Registry

### Docker Hub Deployment

```bash
# Login to Docker Hub
echo "$DOCKER_HUB_TOKEN" | docker login -u "$DOCKER_HUB_USERNAME" --password-stdin

# Build and tag
docker build -t $DOCKER_HUB_USERNAME/echotune-ai:latest .
docker build -t $DOCKER_HUB_USERNAME/echotune-ai:v2.1.0 .

# Push to registry
docker push $DOCKER_HUB_USERNAME/echotune-ai:latest
docker push $DOCKER_HUB_USERNAME/echotune-ai:v2.1.0

# Pull and run from registry
docker pull $DOCKER_HUB_USERNAME/echotune-ai:latest
docker run -d -p 3000:3000 $DOCKER_HUB_USERNAME/echotune-ai:latest
```

### Private Registry

```bash
# Set up private registry
docker run -d -p 5000:5000 --name registry registry:2

# Tag and push to private registry
docker tag echotune-ai localhost:5000/echotune-ai
docker push localhost:5000/echotune-ai

# Pull from private registry
docker pull localhost:5000/echotune-ai
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Container Won't Start

**Problem**: Container exits immediately or fails to start

**Diagnosis**:
```bash
# Check container logs
docker-compose logs app

# Check container status
docker-compose ps

# Inspect container configuration
docker inspect echotune-ai
```

**Common Solutions**:
```bash
# 1. Check environment variables
docker run --rm echotune-ai env

# 2. Verify port availability
sudo netstat -tlnp | grep :3000

# 3. Check disk space
df -h

# 4. Rebuild without cache
docker-compose build --no-cache
```

#### 2. Health Check Failures

**Problem**: Health endpoint returns 503 or times out

**Diagnosis**:
```bash
# Test health endpoint
curl -v http://localhost/health

# Check application logs
docker-compose logs -f app

# Verify container networking
docker network ls
docker network inspect echotune_default
```

**Solutions**:
```bash
# 1. Verify environment configuration
# Check that required variables are set

# 2. Check service dependencies
docker-compose ps

# 3. Restart services
docker-compose restart

# 4. Check firewall rules
sudo ufw status
```

#### 3. Performance Issues

**Problem**: Slow response times or high resource usage

**Monitoring**:
```bash
# Monitor resource usage
docker stats --no-stream

# Check container limits
docker inspect echotune-ai | grep -A 10 "Memory"

# Application performance
curl -w "@curl-format.txt" -o /dev/null -s http://localhost/health
```

**Optimization**:
```bash
# 1. Increase container resources
docker-compose up -d --scale app=2

# 2. Enable caching
# Set CACHE_ENABLED=true in .env

# 3. Optimize database connections
# Use connection pooling

# 4. Monitor and tune
docker-compose logs -f | grep "Performance"
```

#### 4. Network Issues

**Problem**: Services can't communicate or external access fails

**Diagnosis**:
```bash
# Check Docker networks
docker network ls
docker network inspect echotune_default

# Test internal connectivity
docker-compose exec app ping mongodb
docker-compose exec app curl redis:6379

# Check port bindings
docker port echotune-ai
```

**Solutions**:
```bash
# 1. Verify docker-compose network configuration
# Ensure all services are on same network

# 2. Check host firewall
sudo ufw allow 3000/tcp
sudo ufw allow 80/tcp

# 3. Restart Docker daemon
sudo systemctl restart docker

# 4. Recreate containers
docker-compose down
docker-compose up -d
```

## 📈 Performance Optimization

### Resource Limits

```yaml
# docker-compose.yml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### Multi-Container Scaling

```bash
# Scale application containers
docker-compose up -d --scale app=3

# Load balancing with nginx
# Configure upstream in nginx.conf

# Auto-scaling with Docker Swarm
docker swarm init
docker stack deploy -c docker-compose.yml echotune
```

### Caching Strategies

```bash
# Enable Redis caching
REDIS_URL=redis://redis:6379
CACHE_ENABLED=true

# Application-level caching
CACHE_TTL=300  # 5 minutes

# Nginx static file caching
# Configure in nginx.conf
```

## 🎓 Advanced Features

### Container Orchestration

```bash
# Docker Swarm
docker swarm init
docker stack deploy -c docker-compose.yml echotune

# Kubernetes deployment
kubectl apply -f k8s/

# Docker Compose production
docker-compose -f docker-compose.prod.yml up -d
```

### Backup and Recovery

```bash
# Database backup
docker-compose exec mongodb mongodump --out /backup

# Volume backup
docker run --rm -v echotune_mongodb_data:/data -v $(pwd):/backup alpine tar czf /backup/mongodb.tar.gz /data

# Application backup
docker commit echotune-ai echotune-ai:backup-$(date +%Y%m%d)
```

### Monitoring Integration

```bash
# Prometheus monitoring
docker run -d -p 9090:9090 prom/prometheus

# Grafana dashboards
docker run -d -p 3001:3000 grafana/grafana

# Custom metrics endpoint
curl http://localhost/metrics
```

## 📚 Additional Resources

### Docker Commands Reference

```bash
# Container management
docker ps                    # List running containers
docker ps -a                 # List all containers
docker images                # List images
docker logs <container>      # View logs
docker exec -it <container> /bin/sh  # Shell access

# Cleanup commands
docker system prune          # Remove unused data
docker volume prune          # Remove unused volumes
docker image prune           # Remove unused images
docker container prune       # Remove stopped containers
```

### Configuration Files

- **Dockerfile**: Multi-stage container build
- **docker-compose.yml**: Development orchestration
- **docker-compose.prod.yml**: Production configuration
- **.dockerignore**: Build context exclusions
- **nginx.conf**: Reverse proxy configuration

### Best Practices

1. **Security**:
   - Use non-root users in containers
   - Scan images for vulnerabilities
   - Keep base images updated
   - Use secrets management

2. **Performance**:
   - Multi-stage builds for smaller images
   - Layer caching optimization
   - Resource limits and reservations
   - Health checks for reliability

3. **Monitoring**:
   - Centralized logging
   - Metrics collection
   - Health monitoring
   - Alerting systems

---

## 📞 Getting Help

### Support Resources

- **Documentation**: [Complete guides](docs/)
- **GitHub Issues**: [Report problems](https://github.com/dzp5103/Spotify-echo/issues)
- **Docker Documentation**: [Official Docker docs](https://docs.docker.com/)
- **Community**: [GitHub Discussions](https://github.com/dzp5103/Spotify-echo/discussions)

### Common Support Requests

1. **Container startup issues**: Check logs and environment
2. **Performance problems**: Monitor resources and optimize
3. **Network connectivity**: Verify Docker networking
4. **SSL/TLS setup**: Follow nginx configuration guide

---

**Ready to containerize your deployment?**

```bash
curl -sSL https://raw.githubusercontent.com/dzp5103/Spotify-echo/main/scripts/simple-deploy.sh | bash
```

---

*Last updated: January 2025 • EchoTune AI v2.1.0*