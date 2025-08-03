# EchoTune AI - One-Click Deployment Hub

This directory contains the comprehensive deployment interface for EchoTune AI.

## 🚀 Quick Access

### Web Interface
- **Main Deployment Page**: `/deploy/` or `/deploy/index.html`
- **API Endpoints**: `/api/deploy/*`

### Direct Links
- [Deploy to DigitalOcean App Platform](https://cloud.digitalocean.com/apps/new?repo=https://github.com/dzp5103/Spotify-echo/tree/main&refcode=echotuneai) - **Fastest option**
- [All Deployment Options](/deploy/) - **Comprehensive guide**

## 📋 Features

### One-Click Deployment Options
1. **DigitalOcean App Platform** - Zero configuration, managed hosting
2. **Docker Container** - Portable deployment for any Docker host
3. **CLI Automation** - Advanced deployment with custom configuration
4. **Local Development** - Quick setup for development and testing

### API Integration
- `/api/deploy/status` - Get deployment options and system status
- `/api/deploy/generate` - Generate deployment commands for any method
- `/api/deploy/download/:method` - Download deployment scripts
- `/api/deploy/guides/:method` - Get detailed deployment guides

### Widget Integration
The deployment widget (`deploy-widget.js`) can be embedded in any page:

```html
<div id="echotune-deploy-widget"></div>
<script src="/js/deploy-widget.js"></script>
```

## 🎯 Usage Examples

### Quick Deploy (Recommended)
```bash
# Open deployment page
npm run deploy:page

# Or visit directly
curl -o deploy.html http://localhost:3000/deploy/
```

### API Usage
```bash
# Get deployment status
curl http://localhost:3000/api/deploy/status

# Generate Docker deployment commands
curl -X POST http://localhost:3000/api/deploy/generate \
  -H "Content-Type: application/json" \
  -d '{"method": "docker"}'

# Download deployment script
curl http://localhost:3000/api/deploy/download/docker > deploy-docker.txt
```

## 🔧 Customization

The deployment interface supports customization through:
- Environment variables for default options
- URL parameters for pre-selected methods
- Theme customization via CSS variables
- Widget configuration options

## 📚 Related Documentation

- [Complete Deployment Guide](../ONE-CLICK-DEPLOY-GUIDE.md)
- [Production Setup](../PRODUCTION_DEPLOYMENT_GUIDE.md)
- [Docker Configuration](../docker-compose.yml)
- [CLI Scripts](../deploy-*.sh)

---

**Built with ❤️ for the EchoTune AI community**