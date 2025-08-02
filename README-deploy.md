# 🚀 EchoTune AI - Production Deployment Guide

This guide covers deployment, management, and troubleshooting for the EchoTune AI production environment.

## 📋 Prerequisites

### System Requirements
- **Operating System**: Ubuntu 20.04+ or equivalent Linux distribution
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 20GB minimum, 50GB recommended
- **CPU**: 2 cores minimum, 4 cores recommended
- **Network**: Stable internet connection with proper firewall configuration

### Required Software
- Docker 20.10+
- Docker Compose 2.0+
- Git
- SSL certificate (Let's Encrypt or custom)

### Domain Requirements
- Domain name pointing to your server (e.g., `primosphere.studio`)
- DNS A records configured for both `domain.com` and `www.domain.com`
- Firewall allowing ports 80, 443, and 22

## 🛠️ Quick Deployment

### 1. Clone and Setup
```bash
# Clone the repository
git clone https://github.com/dzp5103/Spotify-echo.git
cd Spotify-echo

# Copy environment configuration
cp .env.production.example .env

# Edit environment variables
nano .env
```

### 2. Configure Environment Variables

**Essential Variables** (must be updated):
```env
# Domain Configuration
DOMAIN=your-domain.com
FRONTEND_URL=https://your-domain.com

# Spotify API (required)
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=https://your-domain.com/auth/callback

# Security Secrets (generate strong random values)
SESSION_SECRET=your_32_character_random_secret
JWT_SECRET=your_jwt_secret_key

# SSL Configuration
LETSENCRYPT_EMAIL=admin@your-domain.com
```

**Optional but Recommended**:
```env
# Database Passwords
MONGODB_ROOT_PASSWORD=secure_mongodb_password
REDIS_PASSWORD=secure_redis_password

# Monitoring
SENTRY_DSN=your_sentry_dsn
SLACK_WEBHOOK=your_slack_webhook_url
```

### 3. Deploy
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Build and start services
docker-compose up -d

# Check deployment status
./scripts/check-deploy.sh
```

### 4. Verify Deployment
```bash
# Test SSL certificate
./scripts/test-ssl.sh

# Check all services
./scripts/check-services.sh

# View logs
docker-compose logs -f
```

## 🔧 Detailed Configuration

### Frontend Build Configuration

The frontend is built using Vite for optimal performance:

```bash
# Development build
npm run dev:frontend

# Production build
npm run build:frontend

# Preview production build
npm run preview
```

### SSL Certificate Setup

**Automatic Let's Encrypt** (recommended):
```bash
# SSL is automatically configured during startup
# Check certificate status
./scripts/test-ssl.sh

# Force renewal
./scripts/ssl-renew.sh --force
```

**Custom Certificate**:
```bash
# Place your certificates in the ssl directory
mkdir -p ssl
cp your-cert.pem ssl/cert.pem
cp your-key.pem ssl/key.pem

# Update environment variables
SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
SSL_KEY_PATH=/etc/nginx/ssl/key.pem
```

### Database Configuration

**MongoDB Setup**:
```bash
# Access MongoDB container
docker-compose exec mongodb mongosh

# Create application user
use echotune_production
db.createUser({
  user: "echotune",
  pwd: "your_secure_password",
  roles: ["readWrite"]
})
```

**Redis Configuration**:
```bash
# Test Redis connection
docker-compose exec redis redis-cli -a your_redis_password ping
```

## 📊 Monitoring and Maintenance

### Health Checks

**Quick Status Check**:
```bash
./scripts/check-deploy.sh --quick
```

**Detailed Service Check**:
```bash
./scripts/check-services.sh
```

**SSL Certificate Monitoring**:
```bash
./scripts/test-ssl.sh --summary
```

### Log Management

**View Application Logs**:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f nginx

# Follow logs with timestamps
docker-compose logs -f -t --since 1h
```

**Log Rotation** (automatic via Docker):
- Logs are automatically rotated at 100MB
- Maximum 3 files per service
- Logs older than 7 days are deleted

### Performance Monitoring

**Resource Usage**:
```bash
# Container stats
docker stats

# System resources
htop
df -h
free -m
```

**Application Metrics**:
```bash
# Response times and errors
curl -s https://your-domain.com/health | jq

# Database performance
docker-compose exec mongodb mongosh --eval "db.stats()"
```

## 🔄 Update and Maintenance

### Application Updates

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart services
docker-compose build --no-cache
docker-compose up -d

# Verify update
./scripts/check-deploy.sh
```

### SSL Certificate Renewal

**Automatic Renewal** (configured via cron):
```bash
# Check renewal status
./scripts/ssl-renew.sh --check-only

# Manual renewal
./scripts/ssl-renew.sh --force
```

**Renewal Schedule**:
- Certificates are checked twice daily at 12:00 and 00:00
- Automatic renewal occurs when certificates have <30 days remaining
- Nginx is automatically reloaded after successful renewal

### Database Maintenance

**Backup**:
```bash
# MongoDB backup
docker-compose exec mongodb mongodump --out /data/backup

# Redis backup
docker-compose exec redis redis-cli -a password --rdb /data/backup.rdb
```

**Restore**:
```bash
# MongoDB restore
docker-compose exec mongodb mongorestore /data/backup

# Redis restore
docker-compose exec redis redis-cli -a password --rdb /data/backup.rdb
```

## 🚨 Troubleshooting

### Common Issues

**Application Won't Start**:
```bash
# Check container status
docker-compose ps

# View startup logs
docker-compose logs app

# Check environment variables
docker-compose exec app env | grep -E "(NODE_ENV|DOMAIN|PORT)"
```

**SSL Certificate Issues**:
```bash
# Test certificate validity
./scripts/test-ssl.sh --local-only

# Regenerate self-signed certificate
./scripts/ssl-setup.sh

# Check DNS resolution
nslookup your-domain.com
```

**Database Connection Problems**:
```bash
# Test MongoDB connection
docker-compose exec app node -e "
const { MongoClient } = require('mongodb');
MongoClient.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected'))
  .catch(console.error);
"

# Test Redis connection
docker-compose exec app node -e "
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);
client.ping().then(console.log).catch(console.error);
"
```

**High Resource Usage**:
```bash
# Check container resource limits
docker stats --no-stream

# Analyze application performance
docker-compose exec app node --inspect=0.0.0.0:9229 src/index.js
```

### Performance Issues

**Slow Response Times**:
1. Check nginx access logs: `docker-compose logs nginx | grep -E "(5[0-9]{2}|4[0-9]{2})"`
2. Monitor database queries: MongoDB slow query log
3. Check memory usage: `docker stats`
4. Verify CDN/caching configuration

**High Memory Usage**:
```bash
# Restart services to clear memory
docker-compose restart app

# Check for memory leaks
docker-compose exec app node --inspect src/index.js
```

**Database Performance**:
```bash
# MongoDB performance analysis
docker-compose exec mongodb mongosh --eval "
db.runCommand({profile: 2, slowms: 100});
db.system.profile.find().sort({ts: -1}).limit(5);
"
```

### Security Issues

**Suspicious Activity**:
```bash
# Check nginx access logs for unusual patterns
docker-compose logs nginx | grep -E "(POST|PUT|DELETE)" | tail -100

# Monitor failed authentication attempts
docker-compose logs app | grep -i "auth.*fail"

# Check for unauthorized API access
docker-compose logs nginx | grep -E "/api/" | grep -v "200"
```

**Update Security Configuration**:
```bash
# Regenerate secrets
openssl rand -base64 32  # For SESSION_SECRET
openssl rand -hex 32     # For JWT_SECRET

# Update environment and restart
nano .env
docker-compose restart app
```

## 🔧 Advanced Configuration

### Load Balancing

For high-traffic deployments, configure multiple app instances:

```yaml
# docker-compose.override.yml
services:
  app:
    deploy:
      replicas: 3
  
  nginx:
    volumes:
      - ./nginx/load-balanced.conf:/etc/nginx/conf.d/default.conf
```

### Custom Domain Configuration

**Multiple Domains**:
```env
# Environment configuration
CORS_ORIGINS=https://domain1.com,https://domain2.com,https://www.domain1.com
```

**Subdomain Setup**:
```nginx
# Custom nginx configuration
server_name api.your-domain.com;
```

### External Database

**Use External MongoDB**:
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
```

**Use External Redis**:
```env
REDIS_URL=redis://user:pass@redis-server:6379
```

## 🎯 Production Checklist

### Pre-Deployment
- [ ] Domain DNS configured correctly
- [ ] SSL certificate obtained/configured
- [ ] Environment variables set (no default values)
- [ ] Spotify API credentials configured
- [ ] Database credentials secured
- [ ] Firewall configured (ports 80, 443, 22)
- [ ] Monitoring/alerting configured

### Post-Deployment
- [ ] Health checks passing
- [ ] SSL certificate valid and trusted
- [ ] Application accessible via HTTPS
- [ ] Database connections working
- [ ] API endpoints responding
- [ ] WebSocket connections functional
- [ ] Log rotation configured
- [ ] Backup procedures tested
- [ ] Monitoring dashboards accessible

### Security Checklist
- [ ] Default passwords changed
- [ ] SSH key authentication enabled
- [ ] Docker daemon secured
- [ ] Container privileges minimized
- [ ] Security headers configured
- [ ] Rate limiting active
- [ ] CORS properly configured
- [ ] Content Security Policy enabled

## 📞 Support and Resources

### Log Locations
- **Application Logs**: `docker-compose logs app`
- **Nginx Logs**: `docker-compose logs nginx`
- **Database Logs**: `docker-compose logs mongodb`
- **SSL Logs**: `/var/log/letsencrypt/`

### Configuration Files
- **Environment**: `.env`
- **Docker Compose**: `docker-compose.yml`
- **Nginx**: `nginx/*.conf.template`
- **SSL Scripts**: `scripts/ssl-*.sh`

### Monitoring URLs
- **Health Check**: `https://your-domain.com/health`
- **API Status**: `https://your-domain.com/api/health`
- **Application**: `https://your-domain.com/`

### Emergency Procedures

**Quick Recovery**:
```bash
# Stop all services
docker-compose down

# Clear containers and networks
docker system prune -f

# Restart from clean state
docker-compose up -d

# Verify recovery
./scripts/check-deploy.sh
```

**Rollback Deployment**:
```bash
# Revert to previous version
git checkout previous-tag
docker-compose build --no-cache
docker-compose up -d
```

---

**Need Help?** Check the troubleshooting section above or review the application logs for specific error messages.