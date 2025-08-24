## 🚀 Quick Deploy to DigitalOcean

### Option 1: DigitalOcean App Platform (Recommended)

[![Deploy to DigitalOcean](https://www.digitalocean.com/assets/media/logo-icon-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/dzp5103/Spotify-echo&refcode=your_ref_code)

**One-Click Deployment Steps:**
1. Click the button above
2. Sign in to DigitalOcean
3. Select "App Platform"
4. Choose your plan (Basic $5/month recommended)
5. Configure environment variables
6. Deploy!

### Option 2: DigitalOcean Droplet with Docker

```bash
# One-command deployment to DigitalOcean Droplet
curl -fsSL https://raw.githubusercontent.com/dzp5103/Spotify-echo/main/scripts/deploy-digitalocean-droplet.sh | sudo bash
```

### Option 3: DigitalOcean Kubernetes (DOKS)

```bash
# Deploy to DigitalOcean Kubernetes
kubectl apply -f k8s/digitalocean/
```

## 🏗️ Deployment Options

### 1. DigitalOcean App Platform (Easiest)

**Pros:**
- ✅ Fully managed platform
- ✅ Automatic scaling
- ✅ Built-in SSL certificates
- ✅ Zero server management
- ✅ Automatic deployments from Git

**Cons:**
- ❌ Higher cost ($5-25/month)
- ❌ Less control over infrastructure

**Best for:** Production applications, teams, rapid deployment

### 2. DigitalOcean Droplet with Docker

**Pros:**
- ✅ Full control over infrastructure
- ✅ Lower cost ($4-12/month)
- ✅ Customizable configuration
- ✅ Docker containerization

**Cons:**
- ❌ Requires server management
- ❌ Manual SSL setup
- ❌ Manual scaling

**Best for:** Developers, custom configurations, cost optimization

### 3. DigitalOcean Kubernetes (DOKS)

**Pros:**
- ✅ Enterprise-grade orchestration
- ✅ Advanced scaling and management
- ✅ Multi-service architecture
- ✅ Production-ready

**Cons:**
- ❌ Complex setup
- ❌ Higher learning curve
- ❌ More expensive ($10-50/month)

**Best for:** Enterprise applications, microservices, advanced users

## 🚀 App Platform Deployment (Recommended)

### Step 1: Prepare Repository

Your repository is already configured for DigitalOcean App Platform with:
- ✅ `digitalocean-app.yaml` - App Platform configuration
- ✅ `server.js` - Production entry point
- ✅ `package.json` - Build and start scripts
- ✅ `Dockerfile` - Container configuration

### Step 2: Deploy via DigitalOcean Console

1. **Go to DigitalOcean App Platform**
   - Visit [cloud.digitalocean.com/apps](https://cloud.digitalocean.com/apps)
   - Click "Create App"

2. **Connect GitHub Repository**
   - Select "GitHub" as source
   - Choose `dzp5103/Spotify-echo`
   - Select `main` branch

3. **Configure App Settings**
   - **Name**: `echotune-ai`
   - **Region**: Choose closest to your users
   - **Plan**: Basic ($5/month) for testing, Standard ($12/month) for production

4. **Set Environment Variables**
   - Copy from the template below
   - Mark sensitive variables as "SECRET"

### Step 3: Environment Variables

Copy these to your DigitalOcean App Platform environment variables:

#### 🔐 Required Variables
```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
REDIS_URL=redis://username:password@host:port

# Security
JWT_SECRET=your_very_long_random_jwt_secret_key_here
SESSION_SECRET=your_very_long_random_session_secret_key_here

# Spotify OAuth
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here

# AI/LLM Providers
OPENAI_API_KEY=your_openai_api_key_here
PERPLEXITY_API_KEY=your_perplexity_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
XAI_API_KEY=your_xai_api_key_here
```

#### 📊 Optional Variables
```bash
# Browser Automation
BROWSERBASE_API_KEY=your_browserbase_api_key_here
BROWSERBASE_PROJECT_ID=your_browserbase_project_id_here

# Workflow Automation
N8N_API_URL=your_n8n_api_url_here
N8N_API_KEY=your_n8n_api_key_here

# Observability
AGENTOPS_API_KEY=your_agentops_api_key_here
SENTRY_DSN=your_sentry_dsn_here
```

### Step 4: Deploy and Test

1. **Review Configuration**
   - Verify all environment variables
   - Check build and run commands
   - Review resource allocation

2. **Deploy Application**
   - Click "Create Resources"
   - Wait for build completion (5-10 minutes)
   - Monitor deployment logs

3. **Verify Deployment**
   - Test health endpoint: `/api/health`
   - Verify frontend loads correctly
   - Check SSL certificate

## 🐳 Droplet Deployment with Docker

### Prerequisites

- DigitalOcean account
- Domain name (optional)
- SSH key configured

### Quick Deployment

```bash
# Download and run deployment script
curl -fsSL https://raw.githubusercontent.com/dzp5103/Spotify-echo/main/scripts/deploy-digitalocean-droplet.sh | sudo bash

# Or clone and run manually
git clone https://github.com/dzp5103/Spotify-echo.git
cd Spotify-echo
chmod +x scripts/deploy-digitalocean-droplet.sh
sudo ./scripts/deploy-digitalocean-droplet.sh
```

### Manual Droplet Setup

1. **Create Droplet**
   ```bash
   # Using doctl CLI
   doctl compute droplet create echotune-ai \
     --size s-2vcpu-2gb \
     --image ubuntu-22-04-x64 \
     --region nyc1 \
     --ssh-keys your-ssh-key-id
   ```

2. **Install Dependencies**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Docker
   curl -fsSL https://get.docker.com | sudo bash
   sudo usermod -aG docker $USER
   
   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

3. **Deploy Application**
   ```bash
   # Clone repository
   git clone https://github.com/dzp5103/Spotify-echo.git
   cd Spotify-echo
   
   # Create environment file
   cp .env.production.digitalocean .env
   
   # Deploy with Docker Compose
   docker-compose -f docker-compose.production.yml up -d
   ```

## 🔧 Environment Configuration

### Production Environment File

Create `.env.production.digitalocean`:

```env
# EchoTune AI - DigitalOcean Production Environment
# Generated on 2025-01-24

# Application Configuration
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-domain.com
DOMAIN=your-domain.com

# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
REDIS_URL=redis://username:password@host:port

# Security Keys
JWT_SECRET=your_very_long_random_jwt_secret_key_here
SESSION_SECRET=your_very_long_random_session_secret_key_here

# Spotify OAuth
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
SPOTIFY_REDIRECT_URI=https://your-domain.com/auth/callback

# AI/LLM Providers
OPENAI_API_KEY=your_openai_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
PERPLEXITY_API_KEY=your_perplexity_api_key_here
XAI_API_KEY=your_xai_api_key_here

# Browser Automation
BROWSERBASE_API_KEY=your_browserbase_api_key_here
BROWSERBASE_PROJECT_ID=your_browserbase_project_id_here

# Workflow Automation
N8N_API_URL=your_n8n_api_url_here
N8N_API_KEY=your_n8n_api_key_here

# Observability
AGENTOPS_API_KEY=your_agentops_api_key_here
SENTRY_DSN=your_sentry_dsn_here

# Rate Limiting and Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5
CORS_ORIGINS=https://your-domain.com,https://localhost:3000
MAX_REQUEST_SIZE=10mb
COMPRESSION=true

# Performance and Caching
CACHE_TTL=3600000
REDIS_CACHE_TTL=1800000
API_CACHE_TTL=300000

# Monitoring and Logging
LOG_LEVEL=info
ENABLE_METRICS=true
ENABLE_HEALTH_CHECKS=true
ENABLE_PERFORMANCE_MONITORING=true
```

### Environment Variable Setup Script

```bash
# Run the DigitalOcean environment setup
npm run do:setup-env

# Or manually
node scripts/setup-digitalocean-env.js
```

## 🚀 Deployment Commands

### App Platform Commands

```bash
# Deploy to App Platform
npm run deploy:digitalocean:app

# Check deployment status
npm run deploy:digitalocean:status

# View logs
npm run deploy:digitalocean:logs

# Scale application
npm run deploy:digitalocean:scale
```

### Droplet Commands

```bash
# Deploy to Droplet
npm run deploy:digitalocean:droplet

# SSH to server
npm run deploy:digitalocean:ssh

# View server status
npm run deploy:digitalocean:status

# Update application
npm run deploy:digitalocean:update
```

### Kubernetes Commands

```bash
# Deploy to DOKS
npm run deploy:digitalocean:k8s

# Check cluster status
npm run deploy:digitalocean:cluster

# Scale services
npm run deploy:digitalocean:scale-k8s
```

## 🔒 Security Configuration

### SSL/TLS Setup

**App Platform (Automatic):**
- SSL certificates are automatically provisioned
- HTTPS is enabled by default
- No additional configuration needed

**Droplet (Manual):**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### Security Headers

The application includes security headers:
- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- HSTS (HTTP Strict Transport Security)

## 📊 Monitoring and Analytics

### Built-in Monitoring

- **Health Checks**: `/api/health` endpoint
- **Performance Metrics**: Built-in performance monitoring
- **Error Tracking**: Automatic error logging
- **Request Logging**: All API requests logged

### External Monitoring

- **DigitalOcean Monitoring**: Built-in metrics
- **Sentry**: Error tracking and performance monitoring
- **AgentOps**: AI agent monitoring
- **Custom Dashboards**: Grafana or similar

### Log Management

```bash
# View application logs
docker-compose logs -f app

# View system logs
sudo journalctl -u docker.service -f

# Log rotation
sudo logrotate -f /etc/logrotate.conf
```

## 🔄 Continuous Deployment

### GitHub Actions Integration

```yaml
# .github/workflows/deploy-digitalocean.yml
name: Deploy to DigitalOcean
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Deploy to DigitalOcean
      uses: digitalocean/app_action@main
      with:
        app_name: echotune-ai
        token: ${{ secrets.DIGITALOCEAN_ACCESS_TOKEN }}
```

### Automated Deployment

1. **Push to main branch**
2. **GitHub Actions triggers build**
3. **Tests run automatically**
4. **Deployment to DigitalOcean**
5. **Health checks verify deployment**

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Check build logs
   doctl apps logs your-app-id
   
   # Verify dependencies
   npm install
   npm run build
   ```

2. **Environment Variables**
   ```bash
   # List environment variables
   doctl apps env list your-app-id
   
   # Set missing variables
   doctl apps env set your-app-id KEY=value
   ```

3. **Connection Issues**
   ```bash
   # Test database connection
   npm run test:database
   
   # Check network connectivity
   curl -v https://your-domain.com/api/health
   ```

### Performance Issues

1. **High Memory Usage**
   - Increase instance size
   - Optimize Node.js memory settings
   - Enable Redis caching

2. **Slow Response Times**
   - Check database performance
   - Enable CDN for static assets
   - Optimize API queries

3. **Scaling Issues**
   - Enable auto-scaling
   - Use load balancer
   - Implement caching strategies

## 📈 Scaling and Optimization

### Auto-scaling Configuration

```yaml
# App Platform auto-scaling
autoscaling:
  min_instance_count: 1
  max_instance_count: 5
  cpu_threshold: 70
  memory_threshold: 80
```

### Performance Optimization

- **CDN**: Use DigitalOcean Spaces for static assets
- **Caching**: Redis for session and data caching
- **Database**: Connection pooling and query optimization
- **Assets**: Gzip compression and minification

### Cost Optimization

- **App Platform**: Start with Basic plan, scale as needed
- **Droplets**: Use reserved instances for long-term deployments
- **Storage**: Use Spaces for static assets instead of app storage
- **Monitoring**: Use built-in monitoring to avoid external costs

## 🆘 Support and Resources

### DigitalOcean Resources

- **Documentation**: [docs.digitalocean.com](https://docs.digitalocean.com)
- **Community**: [digitalocean.com/community](https://digitalocean.com/community)
- **Support**: [digitalocean.com/support](https://digitalocean.com/support)

### Project Resources

- **Issues**: [github.com/dzp5103/Spotify-echo/issues](https://github.com/dzp5103/Spotify-echo/issues)
- **Discussions**: [github.com/dzp5103/Spotify-echo/discussions](https://github.com/dzp5103/Spotify-echo/discussions)
- **Wiki**: [github.com/dzp5103/Spotify-echo/wiki](https://github.com/dzp5103/Spotify-echo/wiki)

### Deployment Checklist

- [ ] DigitalOcean account created
- [ ] Repository cloned and configured
- [ ] Environment variables set
- [ ] SSL certificates configured
- [ ] Domain DNS configured
- [ ] Health checks passing
- [ ] Performance monitoring enabled
- [ ] Backup strategy implemented
- [ ] Security audit completed
- [ ] Documentation updated

---

**Ready to deploy?** Choose your preferred method above and get started! 🚀

For detailed instructions, see [DEPLOY_TO_DIGITALOCEAN.md](./DEPLOY_TO_DIGITALOCEAN.md)