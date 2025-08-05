> **📋 Last Updated**: August 04, 2025 | **📦 Version**: 2.1.0

# 🎵 EchoTune AI - Next-Generation Music Discovery Platform

[![Deploy to DigitalOcean](https://img.shields.io/badge/Deploy%20to%20DigitalOcean-0080FF?style=for-the-badge&logo=digitalocean&logoColor=white)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/dzp5103/Spotify-echo/tree/main&refcode=echotuneai)
[![Docker](https://img.shields.io/badge/Deploy%20with%20Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](#-docker-deployment)
[![License](https://img.shields.io/badge/license-MIT-green.svg?style=for-the-badge)](LICENSE)

> **AI-powered music recommendation system with conversational interface, Spotify integration, and advanced ML algorithms.**

## ✨ Key Features

- 🤖 **AI Music Assistant** - Natural language music discovery
- 🎵 **Spotify Integration** - Seamless playlist creation and management  
- 📊 **Analytics Dashboard** - Deep insights into listening patterns
- 🔍 **Smart Recommendations** - ML-powered personalized suggestions
- 🎯 **Demo Mode** - Works without API keys for instant testing

## 🚀 Quick Start

### Option 1: One-Click Deploy Wizard (Recommended)
```bash
# Clone and run the universal deployment wizard
git clone https://github.com/dzp5103/Spotify-echo.git
cd Spotify-echo
sudo ./deploy-wizard.sh
```

### Option 2: Modular Deployment Scripts
```bash
# Step-by-step deployment with individual scripts
sudo ./deploy-install.sh      # Install dependencies
sudo ./deploy-permissions.sh  # Fix permissions
sudo ./deploy-environment.sh  # Setup environment
sudo ./deploy-app.sh         # Deploy application
sudo ./deploy-fix.sh         # Analyze and fix errors
```

### Option 3: DigitalOcean One-Click
[![Deploy to DigitalOcean](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/dzp5103/Spotify-echo/tree/main&refcode=echotuneai)

### Option 4: Local Development
```bash
git clone https://github.com/dzp5103/Spotify-echo.git
cd Spotify-echo
npm install
npm start
# Open http://localhost:3000
```

### Option 5: Docker
```bash
docker run -d -p 3000:3000 dzp5103/echotune-ai:latest
```

## 🚀 Script Documentation

### 📁 Deployment Scripts Overview

| Script | Purpose | Usage | Dependencies |
|--------|---------|-------|-------------|
| `deploy-wizard.sh` | Complete deployment orchestration | `sudo ./deploy-wizard.sh` | All other scripts |
| `deploy-install.sh` | System dependencies installation | `sudo ./deploy-install.sh` | Internet connection |
| `deploy-permissions.sh` | User setup and permissions | `sudo ./deploy-permissions.sh` | None |
| `deploy-environment.sh` | Environment configuration | `sudo ./deploy-environment.sh [domain] [email]` | .env templates |
| `deploy-app.sh` | Application deployment | `sudo ./deploy-app.sh` | Previous scripts |
| `deploy-fix.sh` | Error analysis and repair | `sudo ./deploy-fix.sh` | Deployed application |

### 🎯 Quick Command Reference

```bash
# Complete deployment from scratch
sudo ./deploy-wizard.sh

# Fix permissions issues
sudo ./deploy-permissions.sh

# Analyze and fix deployment errors
sudo ./deploy-fix.sh

# Check application status
sudo systemctl status echotune-ai
curl http://localhost:3000/health

# View logs
tail -f /opt/echotune/logs/app.log
sudo journalctl -u echotune-ai -f

# Restart services
sudo systemctl restart echotune-ai nginx
```

## 🔍 Troubleshooting

### Common Issues and Solutions

#### 1. Permission Denied Errors
```bash
# Fix all permission issues
sudo ./deploy-permissions.sh
```

#### 2. Service Not Starting
```bash
# Analyze and fix issues
sudo ./deploy-fix.sh

# Check service status
sudo systemctl status echotune-ai
sudo journalctl -u echotune-ai -n 50
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
# Regenerate SSL certificates
sudo ./deploy-environment.sh your-domain.com admin@your-domain.com
sudo ./deploy-app.sh
```

#### 5. Spotify API Errors
- Verify credentials in `/opt/echotune/.env`
- Check redirect URI in Spotify Dashboard
- Ensure domain matches exactly

### 📊 Health Checks

```bash
# Application health
curl http://localhost:3000/health

# Service status
sudo systemctl is-active echotune-ai nginx

# Disk space
df -h

# Memory usage
free -h

# Port status
sudo netstat -tlnp | grep -E ':(80|443|3000)'
```

## 🛠️ Deployment Options

### 🧙‍♂️ Universal Deployment Wizard (Recommended)
Complete automated deployment with guided setup:

```bash
# Interactive deployment with wizard
sudo ./deploy-wizard.sh

# Non-interactive deployment
sudo ./deploy-wizard.sh --domain=example.com --email=admin@example.com --non-interactive

# Custom deployment options
sudo ./deploy-wizard.sh --skip-install --verbose --dry-run
```

**Features:**
- ✅ Complete end-to-end deployment automation
- ✅ Interactive configuration prompts
- ✅ Pre-deployment validation checks
- ✅ Error recovery and automatic fixes
- ✅ Post-deployment health validation
- ✅ Comprehensive logging and reporting

### 🔧 Modular Deployment Scripts
Individual scripts for granular control:

#### 1. **Installation Script**
```bash
sudo ./deploy-install.sh
```
- Installs Node.js 20.x, Python 3, Docker, Nginx
- Sets up system dependencies and build tools
- Configures deployment user and directories
- Fully idempotent and safe to re-run

#### 2. **Permissions Script**
```bash
sudo ./deploy-permissions.sh
```
- Creates deploy user with proper groups
- Sets 777 permissions for maximum development ease
- Configures Docker, Nginx, and SSL permissions
- Sets up sudo access for deployment commands

#### 3. **Environment Setup Script**
```bash
sudo ./deploy-environment.sh [domain] [email]
# Example: sudo ./deploy-environment.sh example.com admin@example.com
```
- Fetches .env and .env.production.example templates
- Generates secure secrets and passwords
- Configures domain-specific settings
- Creates both production and development environments

#### 4. **Application Deployment Script**
```bash
sudo ./deploy-app.sh
```
- Deploys application files and dependencies
- Configures Nginx with SSL and security headers
- Sets up systemd service for application
- Performs health checks and validation

#### 5. **Error Analysis and Fix Script**
```bash
sudo ./deploy-fix.sh
```
- Analyzes system health and service status
- Examines logs for common error patterns
- Automatically fixes permission and dependency issues
- Generates detailed error reports with recommendations

### 🐳 Docker Deployment
```bash
# Using Docker Compose
docker-compose up -d --build

# Using provided Docker image
docker run -d -p 3000:3000 \
  -e SPOTIFY_CLIENT_ID=your_client_id \
  -e SPOTIFY_CLIENT_SECRET=your_client_secret \
  dzp5103/echotune-ai:latest
```

### ☁️ DigitalOcean Marketplace
One-click deployment from DigitalOcean Marketplace with pre-configured infrastructure:
- SSL certificates automatically configured
- Monitoring and logging enabled
- Auto-scaling and backup configured
- Production-ready security settings

### 📋 Deployment Requirements

#### System Requirements
- **OS**: Ubuntu 18.04+ or Debian 10+
- **Memory**: 2GB RAM minimum (4GB recommended)
- **Storage**: 10GB available disk space
- **Network**: Internet connection for dependencies

#### Required Credentials
- **Spotify API**: Client ID and Secret from [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
- **Domain**: Valid domain name for production deployment
- **Email**: Valid email for SSL certificate generation

#### Optional Enhancements
- **AI Providers**: OpenAI API key or Google Gemini API key
- **Database**: MongoDB Atlas connection string
- **Monitoring**: Sentry DSN for error tracking
SPOTIFY_REDIRECT_URI=http://localhost:3000/auth/callback

# LLM Providers (optional - uses mock by default)
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key

# Database (SQLite used by default)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/
```

## 🏗️ Project Structure

```
Spotify-echo/
├── src/                    # Frontend & API
├── scripts/               # Python ML & automation
├── mcp-server/            # Browser automation
├── tests/                 # Test suites
├── docker-compose.yml     # Container orchestration
└── deploy-*.sh           # Deployment scripts
```

## 📚 Documentation

| Guide | Description |
|-------|-------------|
| [**Deployment Guide**](DEPLOYMENT_GUIDE.md) | Complete deployment instructions |
| [**API Documentation**](docs/API.md) | Backend API reference |
| [**Development Guide**](CODING_AGENT_GUIDE.md) | Setup for contributors |
| [**Database Schema**](DATABASE_ARCHITECTURE_GUIDE.md) | Data structure guide |

## 🔧 Development

```bash
# Install dependencies
npm install
pip install -r requirements.txt

# Start development server
npm run dev

# Run tests
npm test

# Lint and format
npm run lint
npm run format

# Build for production
npm run build
```

## 🚢 Deployment Options

| Method | Time | Complexity | Best For |
|--------|------|------------|----------|
| **DigitalOcean** | 1-3 min | ⭐ Easy | Production |
| **Docker** | 3-5 min | ⭐⭐ Medium | Any server |
| **Manual** | 10-15 min | ⭐⭐⭐ Advanced | Custom setups |

## 🤖 AI & ML Features

- **Collaborative Filtering** - User behavior analysis
- **Content-Based Filtering** - Audio feature matching
- **Natural Language Processing** - Chat interface
- **Deep Learning** - Advanced recommendation models
- **Real-time Learning** - Adaptive user preferences

## 🎯 Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "2.0.0",
  "uptime": 123.45,
  "checks": {
    "application": {"status": "healthy"},
    "database": {"status": "healthy"}
  }
}
```

## 🔒 Security

- OAuth 2.0 authentication
- Rate limiting & DDoS protection
- Input validation & sanitization
- SSL/TLS encryption
- Security headers (HSTS, CSP, etc.)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📊 Status

- ✅ **Core Application**: Fully functional
- ✅ **Spotify OAuth**: Working
- ✅ **AI Chat**: Multi-provider support
- ✅ **Health Monitoring**: Optimized (<50ms response)
- ✅ **Docker**: Production ready
- 🟡 **Mobile App**: In development

## 🆘 Troubleshooting

### Common Issues

**Chat not working?**
- Check `.env` file has correct API keys
- Demo mode works without any keys

**Slow health checks?**
- Development mode skips network tests for performance
- Production enables full monitoring

**Docker issues?**
- Ensure 4GB+ RAM available
- Check Docker daemon is running

### Getting Help

- 📖 [Comprehensive Documentation](docs/)
- 🐛 [Report Issues](https://github.com/dzp5103/Spotify-echo/issues)
- 💬 [Discussions](https://github.com/dzp5103/Spotify-echo/discussions)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Spotify Web API
- OpenAI & Google Gemini
- React & Node.js communities
- All contributors and testers

---

**⭐ Star this repo if you find it useful!**

[![GitHub stars](https://img.shields.io/github/stars/dzp5103/Spotify-echo.svg?style=social&label=Star)](https://github.com/dzp5103/Spotify-echo/stargazers)


## 🤖 Continuous Development Progress

**Cycle 5** - 2025-08-04

### Current Tasks (2)
- **System Enhancement and Optimization** (feature-development, Priority: high)
- **Testing Infrastructure Enhancement** (testing-improvements, Priority: medium)

*Last updated by Continuous Agent: 2025-08-04T06:20:36.189Z*

### Current Tasks (2)
- **System Enhancement and Optimization** (feature-development, Priority: high)
- **Testing Infrastructure Enhancement** (testing-improvements, Priority: medium)

*Last updated by Continuous Agent: 2025-08-04T06:18:39.716Z*

### Current Tasks (2)
- **System Enhancement and Optimization** (feature-development, Priority: high)
- **Testing Infrastructure Enhancement** (testing-improvements, Priority: medium)

*Last updated by Continuous Agent: 2025-08-04T00:52:35.373Z*
