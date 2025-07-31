# 🎵 EchoTune AI - Digital Ocean Deployment Guide

This guide will help you deploy EchoTune AI to a Digital Ocean droplet with the domain `primosphere.studio`.

## Prerequisites

- Digital Ocean account
- Domain `primosphere.studio` configured to point to your droplet
- Spotify Developer App credentials

## Step 1: Create Digital Ocean Droplet

1. **Create a new Droplet:**
   - Image: Ubuntu 22.04 LTS
   - Plan: Basic ($6/month minimum recommended)
   - Datacenter: Choose closest to your users
   - Authentication: SSH Key (recommended) or Password
   - Hostname: `echotune-production`

2. **Note your droplet's IP address** after creation

## Step 2: Configure Domain DNS

1. Go to your domain registrar (where you bought `primosphere.studio`)
2. Update DNS records:
   ```
   A Record:     primosphere.studio      -> YOUR_DROPLET_IP
   A Record:     www.primosphere.studio -> YOUR_DROPLET_IP
   ```
3. Wait for DNS propagation (5-30 minutes)

## Step 3: Setup Spotify Developer App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app:
   - Name: "EchoTune AI Production"
   - Description: "Music recommendation chatbot"
3. In app settings:
   - Add Redirect URI: `https://primosphere.studio/auth/callback`
   - Save your Client ID and Client Secret

## Step 4: Connect to Your Droplet

```bash
# SSH into your droplet (replace YOUR_DROPLET_IP)
ssh root@YOUR_DROPLET_IP
```

## Step 5: Run Initial Setup

```bash
# Switch to a non-root user (create one if needed)
adduser echotune
usermod -aG sudo echotune
su - echotune

# Download and run setup script
curl -fsSL https://raw.githubusercontent.com/dzp5103/Spotify-echo/main/scripts/setup-digitalocean.sh -o setup.sh
chmod +x setup.sh
./setup.sh
```

## Step 6: Configure Environment Variables

```bash
cd /opt/echotune
nano .env
```

Update the `.env` file with your actual credentials:

```env
# Spotify API Configuration
SPOTIFY_CLIENT_ID=your_actual_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_actual_spotify_client_secret
SPOTIFY_REDIRECT_URI=https://primosphere.studio/auth/callback

# Production Configuration
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://primosphere.studio

# Optional: Database URLs if using external databases
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
SUPABASE_URL=https://your-project.supabase.co
```

## Step 7: Setup SSL Certificates

```bash
# Install Let's Encrypt certificate
sudo certbot --nginx -d primosphere.studio -d www.primosphere.studio

# Copy certificates to application directory
sudo cp /etc/letsencrypt/live/primosphere.studio/fullchain.pem /opt/echotune/ssl/primosphere.studio.crt
sudo cp /etc/letsencrypt/live/primosphere.studio/privkey.pem /opt/echotune/ssl/primosphere.studio.key
sudo chown echotune:echotune /opt/echotune/ssl/*
```

## Step 8: Deploy Application

```bash
cd /opt/echotune
./scripts/deploy.sh
```

## Step 9: Setup Automatic Certificate Renewal

```bash
# Add cron job for certificate renewal
sudo crontab -e

# Add this line:
0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/primosphere.studio/fullchain.pem /opt/echotune/ssl/primosphere.studio.crt && cp /etc/letsencrypt/live/primosphere.studio/privkey.pem /opt/echotune/ssl/primosphere.studio.key && cd /opt/echotune && docker-compose restart nginx
```

## Step 10: Configure Firewall

```bash
# Enable UFW firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

## Step 11: Test Your Deployment

1. Visit `https://primosphere.studio`
2. Click "Connect with Spotify"
3. Authorize the app
4. Test the chatbot functionality

## Monitoring and Maintenance

### View Application Logs
```bash
cd /opt/echotune
docker-compose logs -f app
```

### Check Service Status
```bash
docker-compose ps
```

### Update Application
```bash
cd /opt/echotune
git pull origin main
./scripts/deploy.sh
```

### Restart Services
```bash
docker-compose restart
```

### Check System Resources
```bash
htop
df -h
free -h
```

## Backup Strategy

### Database Backup (if using local databases)
```bash
# Create backup directory
mkdir -p /opt/echotune/backups

# Backup script (save as /opt/echotune/scripts/backup.sh)
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T app mongodump --out /tmp/backup_$DATE
docker cp echotune_app_1:/tmp/backup_$DATE /opt/echotune/backups/
```

### Application Backup
```bash
# Backup configuration and certificates
tar -czf echotune_config_$(date +%Y%m%d).tar.gz .env ssl/ nginx.conf
```

## Troubleshooting

### Application Won't Start
```bash
# Check logs
docker-compose logs app

# Check environment variables
docker-compose exec app env | grep SPOTIFY

# Restart services
docker-compose down && docker-compose up -d
```

### SSL Certificate Issues
```bash
# Test certificate
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal

# Check nginx configuration
sudo nginx -t
```

### Spotify Authentication Failing
1. Verify your Spotify app redirect URI exactly matches: `https://primosphere.studio/auth/callback`
2. Check that your Client ID and Secret are correct
3. Ensure domain DNS is properly configured

### Performance Issues
```bash
# Check system resources
top
df -h
free -h

# Scale up droplet if needed (Digital Ocean dashboard)
# Or optimize Docker containers
```

## Security Best Practices

1. **Keep system updated:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Monitor logs regularly:**
   ```bash
   tail -f /var/log/nginx/echotune_access.log
   ```

3. **Use strong passwords and SSH keys**

4. **Enable fail2ban:**
   ```bash
   sudo apt install fail2ban
   sudo systemctl enable fail2ban
   ```

5. **Regular backups of your data**

## Support

- Check the application logs first
- Review this deployment guide
- Check the GitHub repository for updates
- Monitor Digital Ocean's status page for infrastructure issues

## Cost Optimization

- **Basic Droplet ($6/month):** Suitable for testing and low traffic
- **Standard Droplet ($12/month):** Recommended for production
- **Monitor usage:** Use Digital Ocean's monitoring tools
- **Optimize images:** Consider using smaller Docker images for production

---

🎉 **Congratulations!** Your EchoTune AI application should now be running at `https://primosphere.studio`