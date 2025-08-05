# DigitalOcean Deployment Guide

Deploy EchoTune AI on DigitalOcean with auto-scaling, SSL, and monitoring in minutes.

## 🚀 Quick Deploy

### One-Click Deploy
[![Deploy to DigitalOcean](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/dzp5103/Spotify-echo/tree/main&refcode=echotuneai)

### CLI Deploy
```bash
# Install doctl CLI
sudo snap install doctl

# Authenticate
doctl auth init

# Deploy from spec
doctl apps create app-platform.yaml

# Monitor deployment
doctl apps list
```

## 📋 Prerequisites

- DigitalOcean account
- `doctl` CLI tool installed
- Spotify API credentials
- Domain name (optional, for custom domain)

## 🔧 App Platform Deployment

### Using the Web Interface

1. **Create New App**
   - Go to [DigitalOcean Apps](https://cloud.digitalocean.com/apps)
   - Click "Create App"
   - Connect GitHub repository: `dzp5103/Spotify-echo`

2. **Configure Environment**
   - Set build command: `npm run build`
   - Set run command: `npm start`
   - Add environment variables:
     ```
     NODE_ENV=production
     SPOTIFY_CLIENT_ID=your_client_id
     SPOTIFY_CLIENT_SECRET=your_client_secret
     SPOTIFY_REDIRECT_URI=https://your-app.ondigitalocean.app/callback
     ```

3. **Deploy**
   - Review configuration
   - Click "Create Resources"
   - Wait for deployment (2-3 minutes)

### Using App Spec (Recommended)

Create `app-platform.yaml`:
```yaml
name: echotune-ai
region: nyc
services:
- name: web
  source_dir: /
  github:
    repo: dzp5103/Spotify-echo
    branch: main
  run_command: npm start
  build_command: npm run build
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
  - key: SPOTIFY_CLIENT_ID
    value: your_client_id
    type: SECRET
  - key: SPOTIFY_CLIENT_SECRET
    value: your_client_secret
    type: SECRET
  health_check:
    http_path: /health
  domains:
  - domain: your-domain.com
    type: PRIMARY
```

Deploy:
```bash
doctl apps create app-platform.yaml
```

## 🔧 Droplet Deployment

### Create and Configure Droplet

```bash
# Create droplet
doctl compute droplet create echotune-ai \
  --image ubuntu-22-04-x64 \
  --size s-2vcpu-2gb \
  --region nyc1 \
  --ssh-keys your-ssh-key-id

# Get droplet IP
doctl compute droplet list

# SSH into droplet
ssh root@your-droplet-ip
```

### Deploy on Droplet
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install Docker
curl -fsSL https://get.docker.com | sh

# Clone and deploy
git clone https://github.com/dzp5103/Spotify-echo.git
cd Spotify-echo
npm install
cp .env.production.example .env.production

# Edit environment variables
nano .env.production

# Start with Docker
docker-compose up -d
```

## 🌐 Custom Domain Setup

### Configure Domain in DigitalOcean

1. **Add Domain to App**
   ```bash
   doctl apps update app-id --spec app-platform.yaml
   ```

2. **Configure DNS**
   - Add CNAME record: `your-domain.com` → `your-app.ondigitalocean.app`
   - Or A record to droplet IP

3. **SSL Certificate**
   - Automatically provisioned by DigitalOcean
   - Custom certificates supported

### Manual DNS Configuration
```bash
# Add DNS records
doctl compute domain create your-domain.com

# Add A record
doctl compute domain records create your-domain.com \
  --record-type A \
  --record-name @ \
  --record-data your-droplet-ip

# Add CNAME for www
doctl compute domain records create your-domain.com \
  --record-type CNAME \
  --record-name www \
  --record-data your-domain.com
```

## 📊 Monitoring and Scaling

### App Platform Monitoring
- Built-in metrics and alerts
- Auto-scaling based on CPU/memory
- Crash detection and restart
- Deployment history and rollback

### Custom Monitoring
```bash
# Install monitoring agent on droplet
curl -sSL https://repos.insights.digitalocean.com/install.sh | sudo bash

# Configure alerts
doctl monitoring alertpolicy create \
  --type v1/insights/droplet/cpu \
  --compare GreaterThan \
  --value 80 \
  --window 5m \
  --entities droplet:your-droplet-id
```

### Scaling Configuration
```yaml
# Auto-scaling in app spec
autoscaling:
  min_instance_count: 1
  max_instance_count: 3
  metrics:
  - type: cpu
    target: 70
  - type: memory
    target: 80
```

## 🗄️ Database Integration

### Managed Database
```bash
# Create managed PostgreSQL
doctl databases create echotune-db \
  --engine pg \
  --version 14 \
  --size db-s-1vcpu-1gb \
  --region nyc1

# Get connection details
doctl databases connection echotune-db

# Add to app environment
MONGODB_URI=postgresql://user:pass@host:port/db
```

### Database Configuration
```yaml
# Add database to app spec
databases:
- name: echotune-db
  engine: PG
  version: "14"
  size: db-s-1vcpu-1gb
  num_nodes: 1
```

## 🔒 Security Best Practices

### Environment Variables
```bash
# Use DigitalOcean Secrets
doctl apps create-deployment app-id --spec app-platform.yaml

# Encrypt sensitive variables
envs:
- key: SPOTIFY_CLIENT_SECRET
  value: your_secret
  type: SECRET
```

### Network Security
```bash
# Configure firewall
doctl compute firewall create echotune-fw \
  --inbound-rules protocol:tcp,ports:22,sources.addresses:0.0.0.0/0 \
  --inbound-rules protocol:tcp,ports:80,sources.addresses:0.0.0.0/0 \
  --inbound-rules protocol:tcp,ports:443,sources.addresses:0.0.0.0/0

# Apply to droplet
doctl compute firewall add-droplets echotune-fw --droplet-ids droplet-id
```

## 💰 Cost Optimization

### App Platform Pricing
- **Basic XXS**: $5/month (512MB RAM, 1 vCPU)
- **Basic XS**: $12/month (1GB RAM, 1 vCPU)
- **Basic S**: $25/month (2GB RAM, 1 vCPU)

### Droplet Pricing
- **Basic**: $4-6/month (1GB RAM, 1 vCPU)
- **General Purpose**: $8-24/month (2-4GB RAM, 1-2 vCPU)
- **CPU-Optimized**: $40+/month (high performance)

### Cost Optimization Tips
```bash
# Use reserved instances for long-term
doctl compute reserved-ip create --region nyc1

# Enable automatic backup (20% of droplet cost)
doctl compute droplet create --enable-backups

# Use snapshots for backup (cheaper than backups)
doctl compute volume-snapshot create volume-id
```

## 🔧 Maintenance

### Updates and Deployments
```bash
# Update app from GitHub
doctl apps create-deployment app-id

# Monitor deployment
doctl apps get-deployment app-id deployment-id

# Rollback if needed
doctl apps create-deployment app-id --spec previous-spec.yaml
```

### Backup Strategies
```bash
# Backup droplet
doctl compute droplet-action snapshot droplet-id --snapshot-name backup-date

# Backup database
doctl databases backups list database-id

# Download backup
doctl databases backups download database-id backup-id
```

## 🐛 Troubleshooting

### Common Issues

#### Deployment Failures
```bash
# Check build logs
doctl apps logs app-id --type build

# Check runtime logs
doctl apps logs app-id --type run

# Check deployment status
doctl apps get app-id
```

#### Performance Issues
```bash
# Monitor resource usage
doctl apps get app-id --format json | jq '.live_url'

# Scale up if needed
doctl apps update app-id --spec updated-spec.yaml
```

#### Domain Issues
```bash
# Check domain status
doctl apps get app-id | grep -A 5 domains

# Verify DNS propagation
dig your-domain.com
nslookup your-domain.com
```

## 📚 Additional Resources

- [DigitalOcean App Platform Docs](https://docs.digitalocean.com/products/app-platform/)
- [doctl CLI Reference](https://docs.digitalocean.com/reference/doctl/)
- [DigitalOcean Marketplace](https://marketplace.digitalocean.com/)
- [Production Optimization Guide](../guides/production-optimization.md)