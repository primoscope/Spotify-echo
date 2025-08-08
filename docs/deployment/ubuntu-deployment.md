# Ubuntu Server Deployment Guide

This guide provides step-by-step instructions for deploying EchoTune AI on Ubuntu with Docker, nginx, SSL, and production monitoring.

> **🆕 NEW: Ubuntu 22.04 LTS Guide Available!**  
> For the most comprehensive and up-to-date Ubuntu 22.04 deployment instructions, see our new complete guide: **[Ubuntu 22.04 Complete Deployment Guide](UBUNTU22_COMPLETE_GUIDE.md)**

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Deployment](#quick-deployment)
3. [Manual Deployment](#manual-deployment)
4. [SSL Configuration](#ssl-configuration)
5. [Troubleshooting](#troubleshooting)

## 🚀 Ubuntu 22.04 LTS Quick Start

For Ubuntu 22.04 LTS users, we recommend using our enhanced deployment script:

```bash
# One-command installation for Ubuntu 22.04
curl -sSL https://raw.githubusercontent.com/dzp5103/Spotify-echo/main/scripts/ubuntu22-docker-setup.sh | sudo bash
```

This script includes:
- ✅ Docker Engine optimized for Ubuntu 22.04
- ✅ Node.js 20.x LTS with production configuration
- ✅ nginx with security hardening
- ✅ SSL certificate automation
- ✅ UFW firewall configuration
- ✅ Application environment setup

📖 **[View Complete Ubuntu 22.04 Guide →](UBUNTU22_COMPLETE_GUIDE.md)**

## 🔧 Prerequisites

### System Requirements
- Ubuntu 18.04 LTS or newer
- 2GB RAM minimum (4GB recommended)
- 10GB available disk space
- Root or sudo access
- Valid domain name (for SSL)

### Required Information
- **Domain**: Your domain name (e.g., `example.com`)
- **Email**: Valid email for SSL certificates
- **Spotify API**: Client ID and Secret from [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)

## ⚡ Quick Deployment

### Option 1: One-Command Deployment
```bash
curl -fsSL https://raw.githubusercontent.com/dzp5103/Spotify-echo/main/deploy-wizard.sh | sudo bash -s -- --domain=your-domain.com --email=admin@your-domain.com
```

### Option 2: Clone and Deploy
```bash
# Clone the repository
git clone https://github.com/dzp5103/Spotify-echo.git
cd Spotify-echo

# Run the deployment wizard
sudo ./deploy-wizard.sh
```

The wizard will:
- ✅ Install all dependencies (Node.js, Docker, nginx)
- ✅ Configure SSL certificates with Let's Encrypt
- ✅ Set up systemd service for auto-restart
- ✅ Configure nginx reverse proxy
- ✅ Set up health monitoring

## 🔧 Manual Deployment

### Step 1: Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER

# Install nginx
sudo apt install nginx -y

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y
```

### Step 2: Clone and Configure
```bash
# Clone repository
git clone https://github.com/dzp5103/Spotify-echo.git
cd Spotify-echo

# Install dependencies
npm install

# Configure environment
cp .env.production.example .env.production
# Edit .env.production with your Spotify API credentials
```

### Step 3: SSL Configuration
```bash
# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

### Step 4: Deploy Application
```bash
# Build application
npm run build

# Create systemd service
sudo cp echotune.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable echotune-ai
sudo systemctl start echotune-ai
```

### Step 5: Configure nginx
```bash
# Copy nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/echotune
sudo ln -s /etc/nginx/sites-available/echotune /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🛡️ SSL Configuration

### Automatic SSL with Let's Encrypt
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal (automatically set up)
sudo crontab -l | grep certbot
```

### Manual SSL Certificate
If you have your own SSL certificates:
```bash
# Copy certificates
sudo cp your-cert.crt /etc/ssl/certs/
sudo cp your-key.key /etc/ssl/private/

# Update nginx configuration
sudo nano /etc/nginx/sites-available/echotune
# Add SSL configuration paths
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Permission Denied Errors
```bash
# Fix all permission issues
sudo ./deploy-permissions.sh
```

#### 2. Service Not Starting
```bash
# Check service status
sudo systemctl status echotune-ai
sudo journalctl -u echotune-ai -n 50

# Analyze and fix issues
sudo ./deploy-fix.sh
```

#### 3. Port Already in Use
```bash
# Find process using port 3000
sudo lsof -i :3000
sudo kill -9 <process_id>

# Restart application
sudo systemctl restart echotune-ai
```

#### 4. SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificates
sudo certbot renew --force-renewal

# Restart nginx
sudo systemctl restart nginx
```

### Health Checks
```bash
# Application health
curl https://your-domain.com/health

# Service status
sudo systemctl is-active echotune-ai nginx

# Check logs
sudo journalctl -u echotune-ai -f
tail -f /opt/echotune/logs/app.log
```

## 📊 Monitoring

### System Monitoring
```bash
# Resource usage
htop
free -h
df -h

# Network status
sudo netstat -tlnp | grep -E ':(80|443|3000)'
```

### Application Monitoring
- Health endpoint: `https://your-domain.com/health`
- Metrics: `https://your-domain.com/api/metrics`
- Logs: `/opt/echotune/logs/`

## 🔧 Maintenance

### Regular Tasks
```bash
# Update system
sudo apt update && sudo apt upgrade

# Update application
cd /opt/echotune
git pull
npm install
npm run build
sudo systemctl restart echotune-ai

# Clean Docker images
docker system prune -f

# Backup database
./scripts/backup-database.sh
```

### Security Updates
```bash
# Check for security updates
sudo apt list --upgradable | grep security

# Apply security updates
sudo apt upgrade
```

## 📚 Additional Resources

- [Docker Deployment Guide](docker-deployment.md)
- [DigitalOcean Deployment Guide](digitalocean-deployment.md)
- [Production Optimization Guide](../guides/production-optimization.md)
- [Security Best Practices](../guides/security.md)