# Docker Deployment Guide

Deploy EchoTune AI using Docker for consistent, portable deployment across any platform.

## 🐳 Quick Start

### Option 1: Docker Compose (Recommended)
```bash
# Clone repository
git clone https://github.com/dzp5103/Spotify-echo.git
cd Spotify-echo

# Configure environment
cp .env.production.example .env.production
# Edit .env.production with your settings

# Deploy with Docker Compose
docker-compose up -d

# Check status
docker-compose ps
```

### Option 2: Docker Run (Simple)
```bash
docker run -d -p 3000:3000 \
  -e SPOTIFY_CLIENT_ID=your_client_id \
  -e SPOTIFY_CLIENT_SECRET=your_client_secret \
  -e NODE_ENV=production \
  --name echotune-ai \
  dzp5103/echotune-ai:latest
```

## 📋 Prerequisites

- Docker 20.10+ and Docker Compose 2.0+
- 2GB RAM minimum (4GB recommended)
- 5GB available disk space

## 🔧 Configuration

### Environment Variables
Create `.env.production` file:
```env
NODE_ENV=production
PORT=3000

# Spotify API
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=https://your-domain.com/callback

# Database (optional)
MONGODB_URI=mongodb://localhost:27017/echotune

# LLM Providers
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
LLM_PROVIDER=mock

# Security
JWT_SECRET=your-random-secret
```

### Docker Compose Configuration
The `docker-compose.yml` includes:
- EchoTune AI application
- nginx reverse proxy with SSL
- MongoDB database (optional)
- Health checks and restart policies

## 🚀 Deployment Options

### Development Deployment
```bash
# Start in development mode
docker-compose -f docker-compose.dev.yml up

# View logs
docker-compose logs -f echotune-ai

# Stop services
docker-compose down
```

### Production Deployment
```bash
# Build and start production services
docker-compose -f docker-compose.yml up -d

# Scale application
docker-compose up -d --scale echotune-ai=3

# Update application
docker-compose pull
docker-compose up -d
```

### Custom Domain with SSL
```bash
# Update docker-compose.yml with your domain
# Then deploy with SSL-enabled nginx
docker-compose -f docker-compose.ssl.yml up -d
```

## 🛡️ Security Configuration

### SSL with Let's Encrypt
```yaml
# Add to docker-compose.yml
services:
  certbot:
    image: certbot/certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    command: certonly --webroot --webroot-path=/var/www/certbot --email admin@your-domain.com --agree-tos --no-eff-email -d your-domain.com
```

### Network Security
```yaml
# Custom network configuration
networks:
  echotune-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

## 📊 Monitoring and Health Checks

### Built-in Health Checks
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 60s
```

### Resource Limits
```yaml
deploy:
  resources:
    limits:
      memory: 1G
      cpus: '0.5'
    reservations:
      memory: 512M
      cpus: '0.25'
```

## 🔧 Maintenance

### Backup and Restore
```bash
# Backup volumes
docker run --rm -v echotune_data:/data -v $(pwd):/backup alpine tar czf /backup/backup.tar.gz /data

# Restore volumes
docker run --rm -v echotune_data:/data -v $(pwd):/backup alpine tar xzf /backup/backup.tar.gz -C /
```

### Updates
```bash
# Pull latest images
docker-compose pull

# Restart with new images
docker-compose up -d

# Clean old images
docker image prune -f
```

### Logs
```bash
# View application logs
docker-compose logs -f echotune-ai

# View nginx logs
docker-compose logs -f nginx

# Export logs
docker-compose logs --no-color > application.log
```

## 🐛 Troubleshooting

### Common Issues

#### Container Won't Start
```bash
# Check Docker daemon
sudo systemctl status docker

# Check logs
docker logs echotune-ai

# Restart Docker
sudo systemctl restart docker
```

#### Port Conflicts
```bash
# Find processes using port
sudo lsof -i :3000

# Change port in docker-compose.yml
ports:
  - "3001:3000"  # External:Internal
```

#### Memory Issues
```bash
# Check container resources
docker stats echotune-ai

# Increase memory limits
deploy:
  resources:
    limits:
      memory: 2G
```

### Performance Optimization

#### Multi-stage Build
```dockerfile
# Production optimized Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

#### Caching Strategies
```yaml
# Add Redis for caching
services:
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis_data:/data
```

## 📚 Additional Resources

- [Docker Hub Repository](https://hub.docker.com/r/dzp5103/echotune-ai)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Production Optimization Guide](../guides/production-optimization.md)