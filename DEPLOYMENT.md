# 🚀 EchoTune AI - Complete DigitalOcean Deployment Guide

[![Deploy to DigitalOcean](https://img.shields.io/badge/Deploy%20to%20DigitalOcean-0080FF?style=for-the-badge&logo=digitalocean&logoColor=white)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/dzp5103/Spotify-echo/tree/main&refcode=echotuneai)

## Overview

This guide provides comprehensive instructions for deploying EchoTune AI to DigitalOcean App Platform using GitHub Actions for automated deployment with container registry integration.

## Prerequisites

- GitHub account with repository access
- DigitalOcean account
- Spotify Developer account (for API credentials)
- Basic understanding of environment variables

## 🎯 Quick Start (Recommended)

### Automated GitHub Actions Deployment

**1. Fork the Repository**
```bash
# Fork https://github.com/dzp5103/Spotify-echo to your GitHub account
```

**2. Set Up DigitalOcean**
- Create a DigitalOcean account
- Generate API token: Account → API → Generate New Token
- Create container registry: Container Registry → Create Registry

**3. Configure GitHub Secrets**

Go to your repository → Settings → Secrets and variables → Actions, then add:

| Secret Name | Description | Where to Get |
|-------------|-------------|--------------|
| `DIGITALOCEAN_ACCESS_TOKEN` | DigitalOcean API token | Account → API |
| `DO_REGISTRY_TOKEN` | Container Registry token | Container Registry → API |
| `SPOTIFY_CLIENT_ID` | Spotify app client ID | [Spotify Dashboard](https://developer.spotify.com/dashboard) |
| `SPOTIFY_CLIENT_SECRET` | Spotify app client secret | [Spotify Dashboard](https://developer.spotify.com/dashboard) |
| `SESSION_SECRET` | Random secure string | Generate: `openssl rand -base64 32` |
| `JWT_SECRET` | Random secure string | Generate: `openssl rand -base64 32` |

**4. Deploy**
```bash
# Method 1: Push to main branch (triggers automatic deployment)
git push origin main

# Method 2: Manual trigger via GitHub Actions
# Go to Actions → "DigitalOcean Production Deployment" → Run workflow
```

**5. Monitor Deployment**
- Check GitHub Actions for build progress
- Monitor DigitalOcean App Platform for deployment status
- Typical deployment time: 5-10 minutes

## 📋 Detailed Setup Instructions

### Step 1: Spotify API Configuration

1. **Create Spotify App**:
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Click "Create an App"
   - Fill in app details:
     - App name: "EchoTune AI"
     - App description: "AI-powered music recommendation system"
     - Website: Your domain or GitHub repo
     - Redirect URI: `https://your-domain.com/auth/callback`

2. **Get Credentials**:
   - Copy Client ID and Client Secret
   - Add these to GitHub Secrets

### Step 2: DigitalOcean Setup

1. **Create DigitalOcean Account**:
   - Sign up at [DigitalOcean](https://cloud.digitalocean.com/)
   - Verify your account

2. **Generate API Token**:
   ```bash
   # Navigate to: Account → API → Generate New Token
   # Name: "EchoTune AI Deployment"
   # Scopes: Read and Write
   # Save the token securely
   ```

3. **Create Container Registry**:
   ```bash
   # Navigate to: Container Registry → Create Registry
   # Name: "echotune-registry"
   # Plan: Basic ($5/month)
   # Datacenter region: Choose closest to your users
   ```

4. **Generate Registry Token**:
   ```bash
   # In Container Registry → API
   # Generate new token with Read/Write access
   ```

### Step 3: GitHub Actions Configuration

The repository includes a pre-configured workflow at `.github/workflows/digitalocean-deployment.yml` that:

- ✅ Builds multi-stage Docker containers
- ✅ Pushes to DigitalOcean Container Registry
- ✅ Deploys to App Platform
- ✅ Performs security scanning
- ✅ Monitors health checks

**Required GitHub Secrets:**
```bash
# DigitalOcean
DIGITALOCEAN_ACCESS_TOKEN=dop_v1_...
DO_REGISTRY_TOKEN=dop_v1_...

# Spotify API
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret

# Security
SESSION_SECRET=random_string_here
JWT_SECRET=another_random_string

# Optional
MONGODB_URI=mongodb+srv://...
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key
```

### Step 4: Deployment Execution

1. **Trigger Deployment**:
   ```bash
   # Automatic: Push any changes to main branch
   git add .
   git commit -m "Deploy to production"
   git push origin main
   
   # Manual: Use GitHub Actions interface
   # Actions → "DigitalOcean Production Deployment" → "Run workflow"
   ```

2. **Monitor Progress**:
   - GitHub Actions: Real-time build logs
   - DigitalOcean App Platform: Deployment status
   - Application logs: Available in DigitalOcean dashboard

## 🔧 Alternative Deployment Methods

### One-Click Deploy (Basic)

For quick testing without GitHub Actions:

[![Deploy to DigitalOcean](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/dzp5103/Spotify-echo/tree/main&refcode=echotuneai)

**Note**: One-click deploy requires manual environment configuration in DigitalOcean dashboard.

### Manual App Platform Setup

1. **Create App**:
   ```bash
   # DigitalOcean Dashboard → Apps → Create App
   # Source: GitHub repository
   # Branch: main
   # Auto-deploy: Enabled
   ```

2. **Configure Environment**:
   ```bash
   # App Settings → Environment Variables
   # Add all required variables from .env.example
   ```

3. **Set Resource Limits**:
   ```bash
   # App Settings → Resources
   # Container size: Basic ($5/month minimum)
   # Instances: 1 (can scale later)
   ```

## 🛡️ Security Configuration

### Environment Variables

**Required Variables:**
```bash
NODE_ENV=production
PORT=3000
DOMAIN=your-domain.com
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SESSION_SECRET=generate_random_string
JWT_SECRET=generate_random_string
```

**Optional Variables:**
```bash
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key
```

### SSL/TLS Configuration

DigitalOcean App Platform automatically provides:
- ✅ Free SSL certificates
- ✅ Automatic HTTP to HTTPS redirect
- ✅ Modern TLS protocols

### Security Headers

The application automatically includes:
- ✅ CORS protection
- ✅ Rate limiting
- ✅ Input validation
- ✅ Security headers

## 📊 Monitoring and Troubleshooting

### Health Checks

The application includes comprehensive health monitoring:

```bash
# Check application health
curl https://your-domain.com/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "checks": {
    "application": { "status": "healthy" },
    "database": { "status": "warning", "optional": true },
    "spotify": { "status": "healthy" }
  }
}
```

### Common Issues and Solutions

#### 1. Health Check Failures (503 Errors)

**Problem**: DigitalOcean shows 503 health check failures

**Solutions**:
```bash
# Check application logs
doctl apps logs <app-id> --component web

# Common fixes:
# 1. Verify PORT=3000 is set
# 2. Check DOMAIN matches your actual domain
# 3. Ensure Spotify credentials are valid
# 4. Verify container is binding to 0.0.0.0:3000

# Test health endpoint
curl https://your-domain.com/health
```

#### 2. Deployment Failures

**Problem**: GitHub Actions or App Platform deployment fails

**Solutions**:
```bash
# Check GitHub Actions logs
# Look for specific error messages

# Common issues:
# 1. Invalid DigitalOcean credentials
# 2. Container registry permissions
# 3. Resource limits exceeded
# 4. Invalid environment variables

# Verify secrets are correctly set
```

#### 3. Application Startup Issues

**Problem**: App starts but doesn't respond

**Solutions**:
```bash
# Check app logs
doctl apps logs <app-id>

# Common causes:
# 1. Missing required environment variables
# 2. Database connection timeouts (should be warnings only)
# 3. Invalid Spotify redirect URI
# 4. Port binding issues

# Verify environment configuration
doctl apps spec get <app-id>
```

#### 4. Database Connection Warnings

**Problem**: Health check shows database warnings

**Solutions**:
```bash
# This is NORMAL and expected behavior
# The app works without external databases

# If you want to connect a database:
# 1. Set up MongoDB Atlas or DigitalOcean Managed Database
# 2. Add MONGODB_URI to environment variables
# 3. Restart the application

# Health check will show "warning" for optional services
# Application remains fully functional
```

### Performance Monitoring

**Key Metrics to Monitor**:
- Response times (target: <200ms)
- Error rates (target: <1%)
- Memory usage (target: <80%)
- CPU usage (target: <70%)

**Monitoring Tools**:
```bash
# DigitalOcean built-in monitoring
# App Platform → Your App → Insights

# Custom monitoring endpoints
curl https://your-domain.com/health
curl https://your-domain.com/metrics  # If enabled
```

## 🚀 Scaling and Optimization

### Horizontal Scaling

```bash
# DigitalOcean App Platform
# App Settings → Resources → Instances
# Increase instance count based on traffic

# Auto-scaling configuration:
# Min instances: 1
# Max instances: 3-5 (depending on plan)
```

### Performance Optimization

```bash
# Environment variables for optimization
COMPRESSION=true
CACHE_ENABLED=true
RATE_LIMIT_ENABLED=true

# Database optimizations
MONGODB_URI=mongodb+srv://...?retryWrites=true&w=majority
REDIS_URL=redis://...  # For session caching
```

### CDN Configuration

```bash
# DigitalOcean Spaces CDN (optional)
# For static assets and improved global performance
# Configure in App Platform → Settings → Domains
```

## 💰 Cost Estimation

**Basic Deployment**:
- App Platform (Basic): $5/month
- Container Registry: $5/month
- Total: ~$10/month

**Production Deployment**:
- App Platform (Professional): $12/month
- Container Registry: $5/month
- Managed Database (optional): $15/month
- Total: ~$32/month

**Enterprise Features**:
- Load balancers, CDN, additional regions
- Contact DigitalOcean for pricing

## 🔄 CI/CD Pipeline

The GitHub Actions workflow provides:

1. **Build Stage**:
   - Multi-stage Docker builds
   - Dependency installation
   - Code compilation

2. **Test Stage**:
   - Unit tests
   - Integration tests
   - Security scanning

3. **Deploy Stage**:
   - Container registry push
   - App Platform deployment
   - Health check verification

4. **Monitor Stage**:
   - Deployment success verification
   - Rollback on failure
   - Notification systems

## 📞 Getting Help

### Support Channels

- **GitHub Issues**: [Report bugs and issues](https://github.com/dzp5103/Spotify-echo/issues)
- **GitHub Discussions**: [Community support](https://github.com/dzp5103/Spotify-echo/discussions)
- **DigitalOcean Support**: App Platform specific issues
- **Documentation**: [Complete documentation](docs/)

### Common Support Requests

1. **Deployment Issues**: Check GitHub Actions logs first
2. **Environment Configuration**: Verify all required secrets
3. **Performance Issues**: Monitor App Platform insights
4. **Cost Questions**: Review DigitalOcean pricing

---

## 📄 License

This deployment guide is part of the EchoTune AI project, licensed under the MIT License.

**Ready to deploy?** 

[![Deploy to DigitalOcean](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/dzp5103/Spotify-echo/tree/main&refcode=echotuneai)

---

*Last updated: January 2025 • EchoTune AI v2.1.0*