# Ubuntu 22.04 LTS Complete Deployment Guide for EchoTune AI

This guide provides complete step-by-step instructions for deploying EchoTune AI on Ubuntu 22.04 LTS with Docker, nginx, SSL, and production optimizations.

## 📋 Table of Contents

1. [Quick Start](#-quick-start)
2. [System Requirements](#-system-requirements)
3. [Pre-Installation Setup](#-pre-installation-setup)
4. [One-Click Installation](#-one-click-installation)
5. [Manual Installation](#-manual-installation)
6. [Configuration](#-configuration)
7. [SSL Setup](#-ssl-setup)
8. [Domain Configuration](#-domain-configuration)
9. [Deployment](#-deployment)
10. [Monitoring & Maintenance](#-monitoring--maintenance)
11. [Troubleshooting](#-troubleshooting)

## ⚡ Quick Start

### Option 1: Ultra-Fast One-Command Deployment

```bash
# Complete setup including Docker installation (recommended)
curl -sSL https://raw.githubusercontent.com/dzp5103/Spotify-echo/main/scripts/ubuntu22-docker-setup.sh | sudo bash
```

### Option 2: Clone and Deploy

```bash
# Clone repository
git clone https://github.com/dzp5103/Spotify-echo.git
cd Spotify-echo

# Run Ubuntu 22 setup script
sudo chmod +x scripts/ubuntu22-docker-setup.sh
sudo ./scripts/ubuntu22-docker-setup.sh
```

## 🔧 System Requirements

### Minimum Requirements
- **OS**: Ubuntu 22.04 LTS (Jammy Jellyfish)
- **RAM**: 2GB (4GB recommended for production)
- **CPU**: 1 core (2+ cores recommended)
- **Storage**: 10GB free space (20GB recommended)
- **Network**: Stable internet connection

### Recommended Production Setup
- **RAM**: 4GB or more
- **CPU**: 2+ cores
- **Storage**: 20GB+ SSD storage
- **Domain**: Valid domain name pointing to your server
- **SSL**: Let's Encrypt or valid SSL certificates

### Prerequisites Checklist
- [ ] Ubuntu 22.04 LTS server with root/sudo access
- [ ] Valid domain name (for production SSL)
- [ ] Spotify Developer Account (optional, demo works without)
- [ ] SSH access to the server
- [ ] Firewall ports 80, 443, 22 accessible

## 🚀 Pre-Installation Setup

### 1. Connect to Your Ubuntu 22.04 Server

```bash
# SSH into your server
ssh username@your-server-ip

# Switch to root or ensure sudo access
sudo su -
```

### 2. Update System Packages

```bash
# Update package lists and upgrade system
apt update && apt upgrade -y

# Install essential tools
apt install -y curl wget git nano htop ufw
```

### 3. Configure Basic Security

```bash
# Configure UFW firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Verify firewall status
ufw status verbose
```

## 🎯 One-Click Installation

The automated installation script handles everything:

### Features Included:
- ✅ **Docker Engine** - Latest Docker CE for Ubuntu 22.04
- ✅ **Docker Compose** - Latest plugin version
- ✅ **Node.js 20.x LTS** - Current LTS version with npm and pm2
- ✅ **nginx** - Production web server with optimized config
- ✅ **SSL Tools** - Certbot for Let's Encrypt certificates
- ✅ **Security** - UFW firewall configuration
- ✅ **User Setup** - Dedicated application user and directories
- ✅ **Helpful Aliases** - Convenient management commands

### Run Installation:

```bash
# Download and run the Ubuntu 22.04 setup script
curl -sSL https://raw.githubusercontent.com/dzp5103/Spotify-echo/main/scripts/ubuntu22-docker-setup.sh -o ubuntu22-setup.sh

# Make executable and run
chmod +x ubuntu22-setup.sh
sudo ./ubuntu22-setup.sh
```

### Post-Installation Verification:

```bash
# Verify Docker installation
docker --version
docker compose version

# Verify Node.js installation
node --version
npm --version

# Verify nginx installation
nginx -v
systemctl status nginx

# Check if echotune user was created
id echotune
ls -la /opt/echotune
```

## 🔧 Manual Installation

If you prefer to install components manually:

### 1. Install Docker Engine for Ubuntu 22.04

```bash
# Remove any old Docker installations
apt-get remove -y docker docker-engine docker.io containerd runc

# Add Docker's official GPG key
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Add Docker repository for Ubuntu 22.04 (jammy)
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update package index and install Docker
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start and enable Docker
systemctl enable docker
systemctl start docker

# Add your user to docker group (replace 'username' with your username)
usermod -aG docker username
```

### 2. Install Node.js 20.x LTS

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

# Install Node.js
apt-get install -y nodejs

# Install PM2 globally
npm install -g pm2@latest
```

### 3. Install nginx

```bash
# Install nginx
apt-get install -y nginx

# Enable and start nginx
systemctl enable nginx
systemctl start nginx

# Verify nginx is running
systemctl status nginx
```

### 4. Install SSL Tools

```bash
# Install Certbot for Let's Encrypt
apt-get install -y certbot python3-certbot-nginx
```

### 5. Create Application Environment

```bash
# Create echotune user and directories
useradd -r -s /bin/bash -d /opt/echotune -m echotune

# Create necessary directories
mkdir -p /opt/echotune/{ssl,logs,data,backups,nginx}
chown -R echotune:echotune /opt/echotune

# Add echotune to docker group
usermod -aG docker echotune
```

## ⚙️ Configuration

### 1. Deploy EchoTune AI Application

```bash
# Switch to echotune user and directory
sudo -u echotune bash
cd /opt/echotune

# Clone the repository
git clone https://github.com/dzp5103/Spotify-echo.git .

# Copy and configure environment
cp .env.example .env
nano .env
```

### 2. Configure Environment Variables

Edit `/opt/echotune/.env`:

```bash
# === REQUIRED SETTINGS ===
# Replace with your domain
DOMAIN=your-domain.com
FRONTEND_URL=https://your-domain.com
NODE_ENV=production
PORT=3000

# Spotify API (get from https://developer.spotify.com/)
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=https://your-domain.com/auth/callback

# Generate secure secrets
SESSION_SECRET=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 32)

# SSL paths (will be created during SSL setup)
SSL_CERT_PATH=/opt/echotune/ssl/your-domain.com.crt
SSL_KEY_PATH=/opt/echotune/ssl/your-domain.com.key
LETSENCRYPT_EMAIL=your-email@example.com

# === OPTIONAL SETTINGS ===
# AI providers (demo works without these)
DEFAULT_LLM_PROVIDER=mock
GEMINI_API_KEY=your_gemini_key_here
OPENAI_API_KEY=your_openai_key_here

# Database (MongoDB Atlas or local)
MONGODB_URI=mongodb://localhost:27017/echotune
```

## 🔒 SSL Setup

### Option 1: Let's Encrypt (Recommended)

```bash
# Stop nginx temporarily
sudo systemctl stop nginx

# Obtain SSL certificate
sudo certbot certonly --standalone \
  --non-interactive \
  --agree-tos \
  --email your-email@example.com \
  --domains your-domain.com

# Copy certificates to application directory
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /opt/echotune/ssl/your-domain.com.crt
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem /opt/echotune/ssl/your-domain.com.key
sudo chown -R echotune:echotune /opt/echotune/ssl

# Set up automatic renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet && /bin/systemctl reload nginx" | sudo crontab -

# Start nginx again
sudo systemctl start nginx
```

### Option 2: Self-Signed Certificate (Development)

```bash
# Generate self-signed certificate
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /opt/echotune/ssl/your-domain.com.key \
  -out /opt/echotune/ssl/your-domain.com.crt \
  -subj "/C=US/ST=CA/L=SF/O=EchoTune/CN=your-domain.com"

# Set proper permissions
sudo chown -R echotune:echotune /opt/echotune/ssl
```

## 🌐 Domain Configuration

### 1. DNS Setup

Point your domain to your server's IP address:

```bash
# Check your server's public IP
curl ifconfig.me

# Configure DNS records (do this in your domain registrar):
# A record: your-domain.com -> YOUR_SERVER_IP
# A record: www.your-domain.com -> YOUR_SERVER_IP
```

### 2. Configure nginx

```bash
# Use the Ubuntu 22.04 optimized nginx configuration
sudo cp /opt/echotune/nginx-ubuntu22.conf.template /etc/nginx/sites-available/echotune

# Substitute environment variables
sudo envsubst '${DOMAIN} ${BACKEND_HOST} ${BACKEND_PORT} ${SSL_CERT_PATH} ${SSL_KEY_PATH} ${API_RATE_LIMIT} ${AUTH_RATE_LIMIT} ${GENERAL_RATE_LIMIT} ${MAX_REQUEST_SIZE}' < /etc/nginx/sites-available/echotune > /etc/nginx/sites-available/echotune.conf

# Enable the site
sudo ln -sf /etc/nginx/sites-available/echotune.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

## 🚀 Deployment

### 1. Build and Start Application

```bash
# Switch to application directory as echotune user
sudo -u echotune bash
cd /opt/echotune

# Install dependencies and build
npm ci --only=production --no-audit --no-fund

# Start with Docker Compose
docker-compose up -d --build
```

### 2. Verify Deployment

```bash
# Check Docker containers
docker-compose ps

# Check application health
curl http://localhost:3000/health

# Check nginx status
sudo systemctl status nginx

# Check application logs
docker-compose logs -f app
```

### 3. Test External Access

```bash
# Test HTTP access (should redirect to HTTPS)
curl -I http://your-domain.com

# Test HTTPS access
curl -I https://your-domain.com

# Test health endpoint
curl https://your-domain.com/health
```

## 📊 Monitoring & Maintenance

### Helpful Management Commands

The installation script creates these helpful aliases:

```bash
# Application management
echotune-start          # Start all services
echotune-stop           # Stop all services  
echotune-restart        # Restart all services
echotune-logs           # View application logs
echotune-status         # Check service status
echotune-health         # Check application health

# System management
docker-clean            # Clean up Docker resources
nginx-test              # Test nginx configuration
nginx-reload            # Reload nginx configuration
```

### Regular Maintenance Tasks

```bash
# Update system packages (monthly)
sudo apt update && sudo apt upgrade -y

# Clean Docker resources (weekly)
docker system prune -f

# Check disk space
df -h

# Check memory usage
free -h

# Monitor logs
tail -f /var/log/nginx/echotune_error.log
```

### Backup Procedures

```bash
# Create backup script
cat > /opt/echotune/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/echotune/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup application data
tar -czf "$BACKUP_DIR/app_data_$DATE.tar.gz" -C /opt/echotune data logs

# Backup MongoDB (if using)
docker-compose exec -T mongodb mongodump --out /backup --gzip

# Clean old backups (keep last 7 days)
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /opt/echotune/backup.sh

# Set up daily backup cron job
echo "0 2 * * * /opt/echotune/backup.sh" | crontab -u echotune -
```

## 🛠️ Troubleshooting

### Common Issues and Solutions

#### 1. Docker Installation Issues

```bash
# Issue: "docker: command not found"
# Solution: Reinstall Docker
sudo apt remove docker-ce docker-ce-cli containerd.io
curl -fsSL https://get.docker.com | sh
sudo systemctl restart docker

# Issue: Permission denied for docker commands
# Solution: Add user to docker group
sudo usermod -aG docker $USER
# Log out and back in
```

#### 2. nginx Configuration Issues

```bash
# Issue: nginx fails to start
# Solution: Check configuration syntax
sudo nginx -t

# Issue: SSL certificate errors
# Solution: Verify certificate paths and permissions
ls -la /opt/echotune/ssl/
sudo chown -R echotune:echotune /opt/echotune/ssl
```

#### 3. Application Issues

```bash
# Issue: Application won't start
# Solution: Check logs and environment
docker-compose logs app
cat /opt/echotune/.env

# Issue: Health check fails
# Solution: Verify application is running and accessible
curl http://localhost:3000/health
docker-compose ps
```

#### 4. SSL Certificate Issues

```bash
# Issue: Let's Encrypt certificate failed
# Solution: Check domain DNS and firewall
nslookup your-domain.com
sudo ufw status
sudo lsof -i :80

# Issue: Certificate expired
# Solution: Renew certificate
sudo certbot renew --dry-run
sudo certbot renew
```

#### 5. Performance Issues

```bash
# Issue: High memory usage
# Solution: Monitor and optimize
htop
docker stats
# Consider upgrading server resources

# Issue: Slow response times
# Solution: Check nginx and application logs
tail -f /var/log/nginx/echotune_error.log
docker-compose logs app | tail -50
```

### Debug Commands

```bash
# System information
uname -a
lsb_release -a
df -h
free -h
ps aux --sort=-%mem | head -10

# Network diagnostics
netstat -tlnp | grep :80
netstat -tlnp | grep :443
curl -I http://localhost:3000/health

# Docker diagnostics
docker version
docker-compose version
docker-compose ps
docker-compose logs app --tail=50

# nginx diagnostics
sudo nginx -t
sudo nginx -s reload
systemctl status nginx
```

### Getting Help

1. **Check Logs First**:
   - Application: `docker-compose logs app`
   - nginx: `sudo tail -f /var/log/nginx/echotune_error.log`
   - System: `sudo journalctl -u docker -f`

2. **Common Log Locations**:
   - nginx: `/var/log/nginx/`
   - Docker: `docker-compose logs`
   - System: `journalctl`

3. **Support Resources**:
   - GitHub Issues: https://github.com/dzp5103/Spotify-echo/issues
   - Documentation: https://github.com/dzp5103/Spotify-echo#readme
   - Docker Docs: https://docs.docker.com/

## 🎯 Production Optimization

### Security Hardening

```bash
# Disable unused services
sudo systemctl disable apache2 2>/dev/null || true
sudo systemctl stop apache2 2>/dev/null || true

# Configure automatic security updates
sudo apt install unattended-upgrades
echo 'Unattended-Upgrade::Automatic-Reboot "false";' | sudo tee -a /etc/apt/apt.conf.d/50unattended-upgrades

# Set up fail2ban for intrusion protection
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Performance Tuning

```bash
# Optimize system limits
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf

# Optimize kernel parameters
echo "vm.swappiness=10" | sudo tee -a /etc/sysctl.conf
echo "net.core.somaxconn=65536" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### Monitoring Setup

```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Set up log rotation
sudo tee /etc/logrotate.d/echotune << 'EOF'
/opt/echotune/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 644 echotune echotune
    postrotate
        docker-compose -f /opt/echotune/docker-compose.yml restart app
    endscript
}
EOF
```

---

## 🎉 Deployment Complete!

Your EchoTune AI application should now be running on Ubuntu 22.04 with:

- ✅ Docker containerization
- ✅ nginx reverse proxy
- ✅ SSL/TLS encryption
- ✅ Production security headers
- ✅ Rate limiting and DDoS protection
- ✅ Automated backups and monitoring
- ✅ Health checks and logging

### Access Your Application:
- 🌐 **HTTP**: http://your-domain.com (redirects to HTTPS)
- 🔒 **HTTPS**: https://your-domain.com
- 🏥 **Health Check**: https://your-domain.com/health

### Need Help?
- 📚 Documentation: https://github.com/dzp5103/Spotify-echo#readme
- 🐛 Issues: https://github.com/dzp5103/Spotify-echo/issues
- 💬 Discussions: https://github.com/dzp5103/Spotify-echo/discussions

**🎵 Your AI-powered music discovery platform is ready to rock!**