# DigitalOcean One-Click Deployment Guide

## 🌊 Overview

EchoTune AI provides secure, production-ready deployment to DigitalOcean App Platform with a single click. This guide covers the complete deployment process, security considerations, and post-deployment configuration.

## 🚀 Quick Start

### Option 1: One-Click Deploy Button

[![Deploy to DigitalOcean](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/dzp5103/Spotify-echo/tree/main&refcode=your-ref-code)

This button will:
1. Fork the repository to your GitHub account (optional)
2. Create a new DigitalOcean App Platform application
3. Use the secure deployment template (no secrets committed)
4. Prompt you to configure required environment variables

### Option 2: Manual Deployment

1. **Clone Repository**
   ```bash
   git clone https://github.com/dzp5103/Spotify-echo.git
   cd Spotify-echo
   ```

2. **Generate Deployment Specification**
   ```bash
   ./scripts/deploy/do-app-platform-spec.sh generate production
   ```

3. **Deploy via DigitalOcean UI**
   - Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
   - Click "Create App"
   - Select "GitHub" and authorize your repository
   - Upload the generated `.do/app-platform.yaml` specification
   - Configure environment variables (see below)
   - Deploy!

### Option 3: CLI Deployment (Advanced)

```bash
# Install doctl CLI
# Configure with your DO token

# Generate and deploy
./scripts/deploy/doctl-deploy.sh deploy
```

## 🔒 Security & Environment Configuration

### ⚠️ CRITICAL: Required Environment Variables

The deployment template contains **NO SECRETS** by design. You **MUST** set these in the DigitalOcean UI:

#### Essential (Required for Basic Functionality)
```bash
NODE_ENV=production
PORT=3000
SESSION_SECRET=<generate-secure-random-string-32-chars>
JWT_SECRET=<generate-secure-random-string-32-chars>
```

#### Spotify Integration (Required for Music Features)
```bash
SPOTIFY_CLIENT_ID=<your-spotify-client-id>
SPOTIFY_CLIENT_SECRET=<your-spotify-client-secret>
SPOTIFY_REDIRECT_URI=https://your-app.ondigitalocean.app/auth/callback
```

#### AI Features (Required for Chat/Recommendations)
```bash
OPENAI_API_KEY=<your-openai-api-key>
# OR
GEMINI_API_KEY=<your-gemini-api-key>
LLM_PROVIDER=openai  # or 'gemini'
```

#### Database (Required for Data Persistence)
```bash
MONGODB_URI=<your-mongodb-connection-string>
# Example: mongodb+srv://user:password@cluster.mongodb.net/echotune
```

#### Optional (Enhanced Features)
```bash
# Redis for caching and sessions
REDIS_URL=<your-redis-connection-string>

# Browser automation (MCP)
BROWSERBASE_API_KEY=<your-browserbase-api-key>
BROWSERBASE_PROJECT_ID=<your-browserbase-project-id>

# Additional LLM provider
GEMINI_API_KEY=<your-gemini-api-key>
```

### 🔐 How to Set Environment Variables in DigitalOcean

1. **During App Creation:**
   - In the "Environment Variables" section
   - Add each variable with its key and value
   - Mark sensitive values as "Encrypted"

2. **After App Creation:**
   - Go to your app dashboard
   - Click "Settings" → "App-Level Environment Variables"
   - Add/edit variables as needed
   - Redeploy for changes to take effect

### 🛡️ Security Best Practices

- ✅ **Never commit secrets to Git** - Always use DO environment variables
- ✅ **Use encrypted variables** - Mark sensitive values as encrypted in DO UI
- ✅ **Generate strong secrets** - Use 32+ character random strings for SESSION_SECRET and JWT_SECRET
- ✅ **Use HTTPS** - DigitalOcean provides SSL certificates automatically
- ✅ **Monitor logs** - Check application logs for any configuration issues

## 🏗️ Deployment Architecture

```mermaid
graph TB
    A[GitHub Repository] -->|Webhook| B[DigitalOcean App Platform]
    B --> C[Docker Build]
    C --> D[Multi-Stage Container]
    D --> E[Production App Instance]
    
    E --> F[Health Check Endpoint]
    E --> G[Application Logs]
    E --> H[SSL Certificate]
    
    I[Environment Variables] -->|Injected| D
    J[MongoDB Atlas] -->|Connection| E
    K[Redis Cloud] -->|Optional| E
    L[Spotify API] -->|OAuth| E
    M[OpenAI/Gemini API] -->|LLM| E
    
    style B fill:#0080ff
    style E fill:#00ff80
    style I fill:#ff8000
```

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Fork the repository or have access to the source code
- [ ] Obtain Spotify API credentials
- [ ] Set up MongoDB database (Atlas recommended)
- [ ] Obtain OpenAI API key or Gemini API key
- [ ] Generate secure session and JWT secrets

### During Deployment  
- [ ] Use secure deployment template (no secrets committed)
- [ ] Configure all required environment variables in DO UI
- [ ] Set appropriate instance size (Professional XS recommended)
- [ ] Enable auto-deploy from GitHub branch (main)
- [ ] Review resource and scaling settings

### Post-Deployment
- [ ] Verify health check endpoint: `https://your-app.ondigitalocean.app/health`
- [ ] Test Spotify authentication flow
- [ ] Verify AI chat functionality
- [ ] Check application logs for any errors
- [ ] Set up monitoring and alerts (optional)
- [ ] Configure custom domain (optional)

## 🚀 Deployment Specifications

### App Platform Configuration
```yaml
name: echotune-ai
region: nyc1
instance_count: 1
instance_size_slug: professional-xs

build_command: npm ci --only=production && npm run build
run_command: npm start

health_check:
  http_path: /health
  initial_delay_seconds: 60
  period_seconds: 10
  timeout_seconds: 5
```

### Resource Requirements
- **Minimum:** Basic plan with 1 vCPU, 512MB RAM
- **Recommended:** Professional XS with 1 vCPU, 1GB RAM
- **Production:** Professional S with 2 vCPUs, 2GB RAM

### Expected Costs (DigitalOcean)
- **Basic Plan:** ~$5-12/month
- **Professional XS:** ~$12-24/month  
- **Professional S:** ~$24-48/month

*Note: Costs vary based on usage, bandwidth, and additional services*

## 🔧 Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Check build logs in DO dashboard
# Usually caused by missing dependencies or Node.js version issues

# Solutions:
- Ensure Node.js 20+ is specified in package.json engines
- Check for package-lock.json consistency
- Verify all dependencies are in dependencies, not devDependencies
```

#### 2. Runtime Errors  
```bash
# Check application logs in DO dashboard
# Common causes:

# Missing environment variables
Error: SPOTIFY_CLIENT_ID is required
# Solution: Add missing env vars in DO UI

# Database connection issues  
Error: Connection timeout to MongoDB
# Solution: Check MONGODB_URI format and network access

# API key issues
Error: OpenAI API key invalid
# Solution: Verify API key is correct and has sufficient quota
```

#### 3. Health Check Failures
```bash
# Health endpoint returning 503
# Check logs for specific component failures

# Common solutions:
- Wait for full startup (can take 60+ seconds)
- Check database connectivity
- Verify all required env vars are set
- Check resource limits (may need larger instance)
```

### Getting Help

1. **Check Application Logs:**
   - DigitalOcean Dashboard → Your App → Runtime Logs
   - Look for error messages and stack traces

2. **Review Build Logs:**
   - DigitalOcean Dashboard → Your App → Build Logs  
   - Check for dependency or build script issues

3. **Test Health Endpoint:**
   ```bash
   curl https://your-app.ondigitalocean.app/health
   ```

4. **Verify Environment Variables:**
   - Double-check all required vars are set
   - Ensure no typos in variable names
   - Verify encrypted variables are properly configured

## 🎯 Advanced Configuration

### Custom Domain Setup
1. **Add Domain in DO:**
   - App Settings → Domains → Add Domain
   - Configure DNS records as instructed

2. **Update Environment Variables:**
   ```bash
   SPOTIFY_REDIRECT_URI=https://yourdomain.com/auth/callback
   FRONTEND_URL=https://yourdomain.com
   ```

### Database Optimization
```bash
# MongoDB Atlas optimization
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/echotune?retryWrites=true&w=majority

# Connection pooling
MONGODB_MAX_POOL_SIZE=10
MONGODB_MIN_POOL_SIZE=5
```

### Performance Tuning
```bash
# Node.js optimization
NODE_OPTIONS=--max-old-space-size=1024

# Caching configuration
CACHE_TTL=300
ENABLE_CACHING=true

# Session configuration
SESSION_MAX_AGE=86400000  # 24 hours
```

## 📊 Monitoring & Maintenance

### Built-in Health Monitoring
- **Health Endpoint:** `/health` - Overall system status
- **Component Health:** `/health/mongodb`, `/health/redis`, etc.
- **Performance Metrics:** Available via health endpoints

### DigitalOcean Monitoring
- **App Metrics:** CPU, Memory, Request rate
- **Alerting:** Set up alerts for high resource usage
- **Logs:** Centralized logging and search

### Maintenance Tasks
- **Regular Updates:** Keep dependencies updated
- **Security Patches:** Monitor for security updates
- **Database Maintenance:** Regular backups and optimization
- **SSL Certificate:** Automatic renewal via DO

## 🔄 Continuous Deployment

### Auto-Deploy Setup
1. **Enable Auto-Deploy:**
   - App Settings → GitHub → Enable Auto Deploy
   - Select branch (main recommended)

2. **Deployment Triggers:**
   - Push to main branch
   - Release tags
   - Manual deployment via DO UI

### CI/CD Integration
The repository includes GitHub Actions workflows that:
- ✅ Build and test Docker images
- ✅ Run security scans
- ✅ Validate deployment configurations  
- ✅ Generate deployment artifacts

## 📚 Additional Resources

- [DigitalOcean App Platform Documentation](https://docs.digitalocean.com/products/app-platform/)
- [Environment Variables Guide](https://docs.digitalocean.com/products/app-platform/how-to/use-environment-variables/)
- [Custom Domains Setup](https://docs.digitalocean.com/products/app-platform/how-to/manage-domains/)
- [Monitoring and Alerts](https://docs.digitalocean.com/products/app-platform/how-to/monitor-apps/)

---

**Need Help?** Check the troubleshooting section above or open an issue in the GitHub repository.