# 🐧 EchoTune AI - Complete Ubuntu DigitalOcean Deployment Guide

## Overview

This guide provides complete, production-ready deployment instructions for EchoTune AI on Ubuntu DigitalOcean droplets. It includes comprehensive installation scripts, Docker configurations, and deployment automation specifically optimized for Ubuntu environments.

## 🎯 Quick Start (One-Command Deployment)

### Prerequisites
- Ubuntu 20.04+ DigitalOcean droplet (minimum 2GB RAM, 2 vCPU)
- Root or sudo access
- Domain name configured (optional but recommended)

### Automated Installation

```bash
# SSH into your Ubuntu droplet
ssh root@your-droplet-ip

# Download and run the complete Ubuntu installation script
curl -fsSL https://raw.githubusercontent.com/dzp5103/Spotify-echo/main/scripts/ubuntu-digitalocean-install.sh | bash

# Or clone and run manually
git clone https://github.com/dzp5103/Spotify-echo.git
cd Spotify-echo
chmod +x scripts/ubuntu-digitalocean-install.sh
sudo ./scripts/ubuntu-digitalocean-install.sh
```

This single script provides:
- ✅ Complete Ubuntu system setup and optimization
- ✅ Docker and Docker Compose installation
- ✅ Node.js, Python, and all dependencies
- ✅ Nginx with SSL configuration
- ✅ Security hardening (UFW firewall, Fail2Ban)
- ✅ Database tools (MongoDB, PostgreSQL, Redis)
- ✅ doctl with GitHub PAT integration
- ✅ EchoTune AI application deployment
- ✅ Monitoring and backup systems

## 🛠️ Manual Installation Steps

If you prefer manual installation or need to customize the process:

### 1. System Preparation

```bash
# Update Ubuntu system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git unzip software-properties-common \
    apt-transport-https ca-certificates gnupg lsb-release ufw fail2ban \
    htop nano vim tree jq net-tools dnsutils tmux screen
```

### 2. Install Docker and Docker Compose

```bash
# Add Docker repository
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 3. Install Node.js and Python

```bash
# Install Node.js LTS
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo bash -
sudo apt install -y nodejs

# Install Python and dependencies
sudo apt install -y python3 python3-pip python3-venv python3-dev build-essential
```

### 4. Install and Configure Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Copy EchoTune AI configurations
sudo cp nginx/nginx.conf /etc/nginx/nginx.conf
sudo cp nginx/conf.d/echotune.conf /etc/nginx/sites-available/echotune
sudo ln -sf /etc/nginx/sites-available/echotune /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
```

### 5. Configure Security

```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Configure Fail2Ban
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
```

### 6. Setup Application

```bash
# Create application user and directories
sudo useradd --system --home-dir /opt/echotune --shell /bin/bash --create-home echotune
sudo usermod -aG docker echotune
sudo mkdir -p /opt/echotune/{logs,data,backups}
sudo chown -R echotune:echotune /opt/echotune

# Clone application
cd /opt/echotune
sudo -u echotune git clone https://github.com/dzp5103/Spotify-echo.git .
```

## 🐳 Docker-Based Deployment

### Using Docker Compose

```bash
# Navigate to application directory
cd /opt/echotune

# Copy Ubuntu-specific Docker Compose configuration
cp docker-compose.ubuntu.yml docker-compose.yml

# Copy and configure environment
cp .env.ubuntu.example .env
nano .env  # Edit with your configuration

# Start all services
docker-compose up -d

# Check status
docker-compose ps
```

### Individual Container Deployment

Use the automated deployment script:

```bash
# Run the Ubuntu deployment script
./scripts/ubuntu-digitalocean-deploy.sh

# Or with options
./scripts/ubuntu-digitalocean-deploy.sh --branch main --environment production
```

## 🔐 SSL Certificate Setup

### Automatic SSL with Let's Encrypt

```bash
# Set your domain and email
export DOMAIN=yourdomain.com
export SSL_EMAIL=admin@yourdomain.com

# Run SSL installation
sudo ./scripts/ubuntu-digitalocean-install.sh --ssl-only --domain $DOMAIN --ssl-email $SSL_EMAIL
```

### Manual SSL Setup

```bash
# Install Certbot
sudo snap install --classic certbot

# Obtain certificate
sudo certbot certonly --standalone -d yourdomain.com

# Update Nginx configuration for SSL
# (This is handled automatically by the installation script)
```

## 📊 Monitoring and Management

### Health Monitoring

```bash
# Check system health
echotune-health-check

# View container status
docker ps

# Check service logs
docker logs echotune-app -f
docker logs echotune-mcp -f
```

### Backup System

```bash
# Create manual backup
echotune-backup

# Automated backups are configured via cron (daily at 2 AM)
```

### Performance Monitoring

Access monitoring dashboards:
- Grafana: `http://your-domain:3002` (admin/echotune_grafana_2024)
- Prometheus: `http://your-domain:9090`

## 🔧 Configuration Files

### Environment Configuration

Edit `/opt/echotune/.env` with your settings:

```bash
# Core settings
NODE_ENV=production
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
MONGODB_URI=your_mongodb_uri

# Security
SESSION_SECRET=your_session_secret
JWT_SECRET=your_jwt_secret

# Services
REDIS_PASSWORD=echotune_redis_2024
```

### Nginx Configuration

- Main config: `/etc/nginx/nginx.conf`
- Site config: `/etc/nginx/sites-available/echotune`
- SSL certs: `/etc/letsencrypt/live/yourdomain.com/`

### Docker Configuration

- Docker Compose: `docker-compose.ubuntu.yml`
- Application Dockerfile: `Dockerfile`
- MCP Server Dockerfile: `mcp-server/Dockerfile`

## 🚀 Deployment Automation

### GitHub Actions Integration

Create `.github/workflows/deploy-ubuntu.yml`:

```yaml
name: Deploy to Ubuntu DigitalOcean

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install doctl with GH_PAT
        env:
          GH_PAT: ${{ secrets.GH_PAT }}
          DO_API_TOKEN: ${{ secrets.DO_API_TOKEN }}
        run: ./scripts/install-doctl-ghpat.sh
      
      - name: Deploy to Ubuntu droplet
        env:
          PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          HOST: ${{ secrets.HOST }}
          USER: ${{ secrets.USER }}
        run: |
          echo "$PRIVATE_KEY" > private_key && chmod 600 private_key
          ssh -o StrictHostKeyChecking=no -i private_key $USER@$HOST '
            cd /opt/echotune &&
            git pull origin main &&
            ./scripts/ubuntu-digitalocean-deploy.sh
          '
```

### Continuous Deployment

```bash
# Setup automatic deployment
sudo crontab -e

# Add this line for daily deployment checks
0 4 * * * cd /opt/echotune && ./scripts/ubuntu-digitalocean-deploy.sh --skip-update
```

## 🔍 Troubleshooting

### Common Issues

1. **Container not starting**
   ```bash
   docker logs echotune-app
   docker-compose logs
   ```

2. **SSL certificate issues**
   ```bash
   sudo certbot renew --dry-run
   sudo nginx -t
   ```

3. **Database connection problems**
   ```bash
   # Check MongoDB connection
   mongosh "$MONGODB_URI"
   
   # Check Redis connection
   redis-cli -h redis -a "$REDIS_PASSWORD" ping
   ```

4. **Port conflicts**
   ```bash
   sudo netstat -tlnp | grep :3000
   sudo ufw status
   ```

### Performance Optimization

```bash
# Monitor resource usage
htop
df -h
free -h

# Optimize Docker
docker system prune -f
docker image prune -f

# Check Nginx performance
sudo tail -f /var/log/nginx/access.log
```

## 📚 Advanced Configuration

### Load Balancing

For high-traffic deployments, configure DigitalOcean Load Balancer:

```bash
# Create load balancer via doctl
doctl compute load-balancer create \
  --name echotune-lb \
  --forwarding-rules entry_protocol:https,entry_port:443,target_protocol:http,target_port:80 \
  --health-check protocol:http,port:80,path:/health \
  --region nyc3
```

### Database Scaling

Use DigitalOcean Managed Databases:

```bash
# Create managed MongoDB cluster
doctl databases create echotune-mongo \
  --engine mongodb \
  --region nyc3 \
  --size db-s-2vcpu-4gb \
  --num-nodes 3
```

### CDN Integration

Configure DigitalOcean Spaces for static assets:

```bash
# Upload static files to Spaces
s3cmd sync ./static/ s3://your-bucket/static/ \
  --host=nyc3.digitaloceanspaces.com \
  --host-bucket='%(bucket)s.nyc3.digitaloceanspaces.com'
```

## 📋 Maintenance Checklist

### Daily
- [ ] Check service health: `echotune-health-check`
- [ ] Review logs: `docker-compose logs --tail=100`
- [ ] Monitor resource usage: `htop` and `df -h`

### Weekly
- [ ] Update system packages: `sudo apt update && sudo apt upgrade`
- [ ] Check SSL certificate status: `sudo certbot certificates`
- [ ] Review security logs: `sudo fail2ban-client status`

### Monthly
- [ ] Full system backup: `echotune-backup`
- [ ] Security audit: `sudo ufw status` and `sudo ss -tulpn`
- [ ] Performance review: Check Grafana dashboards
- [ ] Update Docker images: `docker-compose pull && docker-compose up -d`

## 📞 Support

For issues specific to Ubuntu deployment:

1. Check the installation logs: `/var/log/echotune-install.log`
2. Review deployment logs: `/opt/echotune/logs/deployment.log`
3. Run health check: `echotune-health-check`
4. Check GitHub Issues for known problems

## 🎉 Success!

Your EchoTune AI application should now be running on Ubuntu DigitalOcean with:
- ✅ Complete Docker-based deployment
- ✅ SSL-secured Nginx reverse proxy
- ✅ Automated monitoring and backups
- ✅ Production-ready security configuration
- ✅ Integrated doctl with GitHub PAT authentication

Access your application at `https://your-domain.com` or `http://your-droplet-ip`