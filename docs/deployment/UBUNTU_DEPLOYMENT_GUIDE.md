# 🚀 EchoTune AI - Complete Ubuntu Deployment Guide

This guide provides step-by-step instructions for deploying EchoTune AI on Ubuntu with Docker, nginx, SSL, and DigitalOcean integration.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Deployment (Recommended)](#quick-deployment)
3. [Manual Step-by-Step Deployment](#manual-deployment)
4. [Docker Deployment](#docker-deployment)
5. [DigitalOcean Deployment](#digitalocean-deployment)
6. [DockerHub Integration](#dockerhub-integration)
7. [SSL Configuration](#ssl-configuration)
8. [Troubleshooting](#troubleshooting)
9. [Monitoring & Maintenance](#monitoring)

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

## ⚡ Quick Deployment (Recommended)

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
- ✅ Set up environment variables
- ✅ Deploy the application
- ✅ Configure monitoring and backups
- ✅ Set up automatic updates

## 📖 Manual Step-by-Step Deployment

### Step 1: Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install nginx
sudo apt install -y nginx

# Install certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

### Step 2: Clone and Setup Application
```bash
# Clone repository
git clone https://github.com/dzp5103/Spotify-echo.git
cd Spotify-echo

# Install dependencies
npm install --production

# Copy environment configuration
cp .env.production.example .env.production
```

### Step 3: Configure Environment Variables
Edit `.env.production` with your settings:
```bash
sudo nano .env.production
```

Required variables:
```env
# Domain Configuration
DOMAIN=your-domain.com
FRONTEND_URL=https://your-domain.com
NODE_ENV=production
PORT=3000

# Spotify API Configuration
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=https://your-domain.com/auth/callback

# Security Secrets (Generate new values!)
SESSION_SECRET=your_session_secret_min_32_chars
JWT_SECRET=your_jwt_secret_min_32_chars

# SSL Configuration
LETSENCRYPT_EMAIL=admin@your-domain.com
```

### Step 4: Configure nginx
```bash
# Create nginx configuration
sudo tee /etc/nginx/sites-available/echotune << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/echotune /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### Step 5: SSL Certificate Setup
```bash
# Create webroot directory
sudo mkdir -p /var/www/certbot

# Obtain SSL certificate
sudo certbot certonly --webroot --webroot-path=/var/www/certbot --email admin@your-domain.com --agree-tos --no-eff-email -d your-domain.com -d www.your-domain.com

# Setup auto-renewal
echo "0 2 * * 1 root certbot renew --quiet && systemctl reload nginx" | sudo tee -a /etc/crontab
```

### Step 6: Create System Service
```bash
# Create systemd service
sudo tee /etc/systemd/system/echotune.service << 'EOF'
[Unit]
Description=EchoTune AI - Music Recommendation System
Documentation=https://github.com/dzp5103/Spotify-echo
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/echotune
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=/opt/echotune/.env.production

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/echotune/logs /opt/echotune/data

[Install]
WantedBy=multi-user.target
EOF

# Move application to /opt
sudo mkdir -p /opt/echotune
sudo cp -r . /opt/echotune/
sudo chown -R www-data:www-data /opt/echotune

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable echotune
sudo systemctl start echotune
```

## 🐳 Docker Deployment

### Option 1: Docker Compose (Recommended)
```bash
# Clone repository
git clone https://github.com/dzp5103/Spotify-echo.git
cd Spotify-echo

# Create environment file
cp .env.production.example .env.production
# Edit .env.production with your settings

# Start services
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f app
```

### Option 2: Docker Run
```bash
# Pull the image
docker pull dzp5103/echotune-ai:latest

# Run the container
docker run -d \
  --name echotune-ai \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DOMAIN=your-domain.com \
  -e SPOTIFY_CLIENT_ID=your_client_id \
  -e SPOTIFY_CLIENT_SECRET=your_client_secret \
  -v echotune_data:/app/data \
  -v echotune_logs:/app/logs \
  --restart unless-stopped \
  dzp5103/echotune-ai:latest
```

### Building Custom Image
```bash
# Build image
docker build -t your-username/echotune-ai .

# Run your custom image
docker run -d -p 3000:3000 your-username/echotune-ai
```

## ☁️ DigitalOcean Deployment

### Option 1: App Platform (Recommended)
1. **Fork the repository** to your GitHub account
2. **Go to DigitalOcean App Platform**
3. **Create New App** from GitHub
4. **Select your fork** of the repository
5. **Configure settings**:
   - Name: `echotune-ai`
   - Region: Choose closest to your users
   - Plan: Basic ($5/month minimum)
6. **Set environment variables**:
   ```
   NODE_ENV=production
   SPOTIFY_CLIENT_ID=your_client_id
   SPOTIFY_CLIENT_SECRET=your_client_secret
   SPOTIFY_REDIRECT_URI=https://your-app-url/auth/callback
   ```
7. **Deploy** and wait for completion

### Option 2: One-Click Deploy
[![Deploy to DigitalOcean](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/dzp5103/Spotify-echo/tree/main)

### Option 3: Droplet Deployment
```bash
# Create Ubuntu 22.04 droplet (2GB+ RAM recommended)
# SSH into droplet
ssh root@your-droplet-ip

# Clone and deploy
git clone https://github.com/dzp5103/Spotify-echo.git
cd Spotify-echo
sudo ./deploy-wizard.sh --domain=your-domain.com --email=admin@your-domain.com
```

## 📦 DockerHub Integration

### Automated Builds
The repository includes GitHub Actions for automated Docker builds:

1. **Fork the repository**
2. **Set up DockerHub secrets** in your GitHub repository:
   - `DOCKERHUB_USERNAME`: Your DockerHub username
   - `DOCKERHUB_TOKEN`: Your DockerHub access token
3. **Push changes** to trigger automatic builds
4. **Images are pushed** to DockerHub automatically

### Manual Docker Push
```bash
# Build image
docker build -t your-username/echotune-ai:latest .

# Login to DockerHub
docker login

# Push image
docker push your-username/echotune-ai:latest

# Tag specific version
docker tag your-username/echotune-ai:latest your-username/echotune-ai:v2.1.0
docker push your-username/echotune-ai:v2.1.0
```

### Use Published Image
```bash
# Pull from DockerHub
docker pull dzp5103/echotune-ai:latest

# Run published image
docker run -d -p 3000:3000 dzp5103/echotune-ai:latest
```

## 🔒 SSL Configuration

### Automatic SSL (Recommended)
The deployment scripts automatically configure SSL using Let's Encrypt:
```bash
# SSL is configured automatically with the wizard
sudo ./deploy-wizard.sh --domain=your-domain.com --email=admin@your-domain.com
```

### Manual SSL Setup
```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test renewal
sudo certbot renew --dry-run

# Setup auto-renewal
echo "0 2 * * 1 root certbot renew --quiet && systemctl reload nginx" | sudo tee -a /etc/crontab
```

### Custom SSL Certificates
```bash
# Copy your certificates
sudo cp your-domain.crt /etc/ssl/certs/
sudo cp your-domain.key /etc/ssl/private/

# Update nginx configuration
sudo nano /etc/nginx/sites-available/echotune
# Update ssl_certificate and ssl_certificate_key paths

sudo nginx -t && sudo systemctl reload nginx
```

## 🛠️ Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check application logs
sudo journalctl -u echotune -f

# Check if port is available
sudo netstat -tlnp | grep :3000

# Restart application
sudo systemctl restart echotune
```

#### SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew --force-renewal

# Test SSL configuration
openssl s_client -connect your-domain.com:443
```

#### Docker Issues
```bash
# Check Docker status
sudo systemctl status docker

# Check container logs
docker logs echotune-ai

# Restart Docker
sudo systemctl restart docker
```

#### nginx Issues
```bash
# Test nginx configuration
sudo nginx -t

# Check nginx status
sudo systemctl status nginx

# View error logs
sudo tail -f /var/log/nginx/error.log
```

### Performance Issues
```bash
# Check system resources
htop
df -h
free -h

# Check application performance
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/health

# Monitor logs
tail -f /opt/echotune/logs/app.log
```

## 📊 Monitoring & Maintenance

### Health Checks
```bash
# Application health
curl https://your-domain.com/health

# Service status
sudo systemctl status echotune nginx

# Docker health (if using Docker)
docker-compose ps
```

### Log Management
```bash
# View application logs
sudo journalctl -u echotune -f

# View nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Docker logs
docker-compose logs -f app
```

### Backup Setup
```bash
# Create backup script
sudo tee /usr/local/bin/echotune-backup << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/echotune"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup application data
tar -czf $BACKUP_DIR/echotune_data_$DATE.tar.gz /opt/echotune/data

# Backup database (if using local database)
# mongodump --out $BACKUP_DIR/mongodb_$DATE

# Clean old backups (keep 30 days)
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/echotune_data_$DATE.tar.gz"
EOF

chmod +x /usr/local/bin/echotune-backup

# Schedule daily backups
echo "0 2 * * * root /usr/local/bin/echotune-backup" | sudo tee -a /etc/crontab
```

### Security Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js dependencies
cd /opt/echotune
sudo -u www-data npm update

# Restart services
sudo systemctl restart echotune nginx
```

## 🔧 Configuration Reference

### Environment Variables
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Application environment | `production` | ✅ |
| `PORT` | Application port | `3000` | ✅ |
| `DOMAIN` | Your domain name | - | ✅ |
| `SPOTIFY_CLIENT_ID` | Spotify API client ID | - | ✅ |
| `SPOTIFY_CLIENT_SECRET` | Spotify API client secret | - | ✅ |
| `SESSION_SECRET` | Session encryption secret | - | ✅ |
| `JWT_SECRET` | JWT signing secret | - | ✅ |
| `LETSENCRYPT_EMAIL` | Email for SSL certificates | - | ✅ |

### Port Configuration
- **3000**: Application (internal)
- **80**: HTTP (redirects to HTTPS)
- **443**: HTTPS (public)
- **22**: SSH (for management)

### File Locations
- **Application**: `/opt/echotune/`
- **Logs**: `/opt/echotune/logs/`
- **nginx config**: `/etc/nginx/sites-available/echotune`
- **SSL certificates**: `/etc/letsencrypt/live/your-domain.com/`
- **Environment**: `/opt/echotune/.env.production`

## 📞 Support

### Getting Help
- 📖 [Documentation](https://github.com/dzp5103/Spotify-echo#readme)
- 🐛 [Report Issues](https://github.com/dzp5103/Spotify-echo/issues)
- 💬 [Discussions](https://github.com/dzp5103/Spotify-echo/discussions)

### Quick Commands Reference
```bash
# Check status
sudo systemctl status echotune nginx
curl https://your-domain.com/health

# View logs
sudo journalctl -u echotune -f
sudo tail -f /var/log/nginx/error.log

# Restart services
sudo systemctl restart echotune nginx

# Update SSL
sudo certbot renew && sudo systemctl reload nginx

# Backup
sudo /usr/local/bin/echotune-backup
```

---

**🎉 Congratulations!** You have successfully deployed EchoTune AI on Ubuntu. Your music recommendation system is now live and ready to help users discover amazing music!

For updates and new features, watch the [GitHub repository](https://github.com/dzp5103/Spotify-echo) and follow the deployment guide for upgrade instructions.