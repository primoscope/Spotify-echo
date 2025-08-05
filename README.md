# 🎵 EchoTune AI - Complete Music Discovery Platform

[![Deploy to DigitalOcean](https://img.shields.io/badge/Deploy%20to%20DigitalOcean-0080FF?style=for-the-badge&logo=digitalocean&logoColor=white)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/dzp5103/Spotify-echo/tree/main&refcode=echotuneai)
[![Docker](https://img.shields.io/badge/Deploy%20with%20Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](docs/deployment/docker-deployment.md)
[![License](https://img.shields.io/badge/license-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen?style=for-the-badge)](https://github.com/dzp5103/Spotify-echo/actions)

> **The most comprehensive AI-powered music recommendation system with conversational interface, Spotify integration, and advanced ML algorithms. Ready for production deployment in minutes.**

## ✨ Key Features

- 🤖 **AI Music Assistant** - Natural language music discovery with multiple LLM providers (OpenAI, Gemini, Mock)
- 🎵 **Spotify Integration** - Complete OAuth flow, playlist creation, real-time music streaming
- 📊 **Analytics Dashboard** - Deep insights into listening patterns with ML-powered recommendations
- 🔍 **Smart Recommendations** - Hybrid recommendation engine using collaborative filtering and content analysis
- 🎯 **Demo Mode** - Full functionality without API keys for instant testing and evaluation
- 🔊 **Voice Interface** - Voice commands for hands-free music discovery (experimental)
- 📱 **Mobile PWA** - Progressive Web App with offline capabilities and mobile optimization
- 🛡️ **Production Ready** - Enterprise-grade security, monitoring, and deployment automation

## 🚀 Quick Start Guide

**Choose your deployment method - all options get you running in under 10 minutes:**

| Method | Time | Best For | Complexity |
|--------|------|----------|------------|
| [**DigitalOcean**](#-digitalocean-deployment) | 3-5 min | Production with auto-scaling | ⭐⭐ |
| [**Docker**](#-docker-deployment) | 2-3 min | Any server with containers | ⭐ |
| [**Local Development**](#-local-development) | 1-2 min | Testing and development | ⭐ |

## 🌊 DigitalOcean Deployment

### Option 1: Automated Deployment (Recommended)

**Complete automated setup with GitHub Actions + DigitalOcean API:**

1. **Get DigitalOcean API Token**
   ```bash
   # Visit: https://cloud.digitalocean.com/account/api/tokens
   # Create new token with read/write permissions
   ```

2. **Clone and Configure**
   ```bash
   git clone https://github.com/dzp5103/Spotify-echo.git
   cd Spotify-echo
   
   # Add your API token to environment
   echo "DO_PAT=your_digitalocean_token_here" >> .env
   
   # Test authentication
   node scripts/digitalocean-automation.js auth
   ```

3. **Deploy with One Command**
   ```bash
   # Full automated deployment
   node scripts/digitalocean-automation.js deploy
   
   # Check deployment status
   node scripts/digitalocean-automation.js status
   ```

### Option 2: GitHub Actions Deployment

**Setup automated CI/CD pipeline:**

1. **Fork this repository** to your GitHub account

2. **Configure GitHub Secrets** (Repository Settings → Secrets and variables → Actions):
   ```bash
   # Required Secrets:
   DIGITALOCEAN_ACCESS_TOKEN=dop_v1_your_token_here
   DO_REGISTRY_TOKEN=dop_v1_your_token_here
   
   # Spotify API (get from https://developer.spotify.com/)
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   
   # Security (generate secure random strings)
   SESSION_SECRET=your_secure_session_secret_32_chars_min
   JWT_SECRET=your_secure_jwt_secret_32_chars_min
   ```

3. **Deploy** - Push to main branch or manually trigger "DigitalOcean Production Deployment" workflow

4. **Monitor** - Check GitHub Actions tab for deployment progress (typically 5-10 minutes)

### Option 3: One-Click Deploy

**Instant deployment with default settings:**

[![Deploy to DO](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/dzp5103/Spotify-echo/tree/main&refcode=echotuneai)

> **Note:** You'll need to configure environment variables after deployment

## 🐳 Docker Deployment

### Quick Docker Setup

**One-command deployment for Ubuntu/CentOS/RHEL:**

```bash
# Complete setup including Docker installation
curl -sSL https://raw.githubusercontent.com/dzp5103/Spotify-echo/main/scripts/docker-ubuntu-setup.sh | bash
```

**Manual Docker deployment:**

```bash
# Clone repository
git clone https://github.com/dzp5103/Spotify-echo.git
cd Spotify-echo

# Start with Docker Compose
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Access application
open http://localhost
```

### Docker Environment Configuration

Create `.env` file with your configuration:

```bash
# Copy example environment file
cp .env.production.example .env

# Edit with your values
nano .env
```

**Required environment variables:**
```bash
# Core Configuration
NODE_ENV=production
PORT=3000
DOMAIN=your-domain.com

# Spotify API (Required for full functionality)
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=https://your-domain.com/auth/callback

# Security Secrets (Generate secure random strings)
SESSION_SECRET=your_secure_session_secret
JWT_SECRET=your_secure_jwt_secret

# DigitalOcean (Optional, for deployment automation)
DO_PAT=your_digitalocean_token
```

## 💻 Local Development

**Perfect for testing, development, and evaluation:**

```bash
# Clone and install
git clone https://github.com/dzp5103/Spotify-echo.git
cd Spotify-echo
npm install

# Configure environment (optional for demo mode)
cp .env.production.example .env
# Edit .env with your API keys (or leave defaults for demo mode)

# Start development server
npm start

# Open browser
open http://localhost:3000
```

**Available development commands:**
```bash
npm run dev          # Development with hot reload
npm run build        # Build for production
npm test             # Run test suite
npm run lint         # Code linting
npm run format       # Code formatting
```

## 🔐 Authentication & API Setup

### Spotify API Configuration

1. **Create Spotify App**
   - Visit [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Click "Create an App"
   - Fill in app details

2. **Configure Redirect URI**
   ```
   http://localhost:3000/auth/callback          # For local development
   https://your-domain.com/auth/callback        # For production
   ```

3. **Get API Credentials**
   ```bash
   SPOTIFY_CLIENT_ID=found_in_app_settings
   SPOTIFY_CLIENT_SECRET=found_in_app_settings
   ```

### DigitalOcean API Setup

1. **Create API Token**
   - Visit [DigitalOcean API Tokens](https://cloud.digitalocean.com/account/api/tokens)
   - Click "Generate New Token"
   - Name: "EchoTune AI Deployment"
   - Scopes: Read and Write

2. **Test Authentication**
   ```bash
   export DO_PAT=your_token_here
   node scripts/digitalocean-automation.js auth
   ```

### AI Provider Configuration (Optional)

**OpenAI Setup:**
```bash
# Get API key from https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your_openai_key_here
```

**Google Gemini Setup:**
```bash
# Get API key from https://ai.google.dev/
GEMINI_API_KEY=your_gemini_key_here
```

**Mock Provider (Default):**
- No API keys required
- Full conversational AI functionality
- Perfect for testing and demos

## 🏗️ Architecture & Technology Stack

### Backend Technologies
- **Runtime**: Node.js 20+ with Express.js framework
- **Database**: MongoDB (primary), SQLite (fallback), Supabase support
- **Authentication**: OAuth 2.0 with Spotify, JWT sessions
- **Security**: Helmet, rate limiting, input validation, HTTPS
- **Monitoring**: Health checks, performance metrics, error tracking

### Frontend Technologies
- **Framework**: React 18+ with Vite build system
- **Styling**: CSS3 with responsive design, dark/light themes
- **PWA**: Service workers, offline support, app-like experience
- **Real-time**: WebSocket integration for live updates

### AI & Machine Learning
- **LLM Providers**: OpenAI GPT, Google Gemini, Local mock provider
- **Recommendation Engine**: Collaborative filtering, content-based analysis
- **Audio Analysis**: Spotify Audio Features integration
- **Natural Language**: Intent recognition, context awareness

### Deployment & DevOps
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose for local, Kubernetes ready
- **CI/CD**: GitHub Actions with automated testing and deployment
- **Monitoring**: Health endpoints, logging, performance metrics
- **Scaling**: Horizontal scaling ready, load balancer compatible

## 📊 Project Structure

```
Spotify-echo/
├── 📁 src/                    # Source code
│   ├── 📁 frontend/          # React components and UI
│   ├── 📁 chat/              # AI chat system and providers
│   ├── 📁 spotify/           # Spotify API integration
│   ├── 📁 ml/                # Machine learning models
│   ├── 📁 database/          # Database connectors
│   ├── 📁 security/          # Security middleware
│   └── 📁 utils/             # Utilities and helpers
├── 📁 scripts/               # Automation and deployment scripts
├── 📁 tests/                 # Comprehensive test suites
├── 📁 docs/                  # Documentation
├── 📁 mcp-server/            # Model Context Protocol server
├── 📁 .github/workflows/     # GitHub Actions CI/CD
├── 🐳 docker-compose.yml     # Container orchestration
├── 📋 package.json           # Node.js dependencies
├── 🔧 .env.production.example # Environment configuration template
└── 📖 README.md              # This comprehensive guide
```

## 🤖 AI Features Deep Dive

### Conversational Music Discovery

**Natural Language Processing:**
```typescript
// Example interactions:
"Play something energetic for my workout"
"I'm feeling sad, recommend some music to cheer me up"
"Find me music similar to Radiohead but more upbeat"
"Create a playlist for studying with no lyrics"
```

**Multi-Provider AI Support:**
- **OpenAI GPT**: Advanced reasoning and music knowledge
- **Google Gemini**: Fast responses and creative suggestions  
- **Mock Provider**: Local AI simulation for testing (no API keys needed)

### Machine Learning Recommendation Engine

**Hybrid Approach:**
1. **Collaborative Filtering**: "Users like you also enjoyed..."
2. **Content-Based Analysis**: Audio features, genre, tempo matching
3. **Context-Aware**: Time, mood, activity, listening history
4. **Real-time Learning**: Adapts to user feedback and preferences

**Audio Analysis Integration:**
```javascript
// Spotify Audio Features utilized:
{
  acousticness: 0.8,      // Acoustic vs electric
  danceability: 0.7,      // How danceable
  energy: 0.9,            # Energy level
  valence: 0.6,           # Musical positivity
  tempo: 128.5,           # BPM
  key: 7,                 # Musical key
  mode: 1                 # Major/minor
}
```

## 🔧 Configuration & Customization

### Environment Configuration

**Complete environment setup:**
```bash
# Core Application
NODE_ENV=production
PORT=3000
DOMAIN=your-domain.com
FRONTEND_URL=https://your-domain.com

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/echotune
DATABASE_TYPE=mongodb
ENABLE_SQLITE_FALLBACK=true

# Security
SESSION_SECRET=your_secure_session_secret_32_chars_minimum
JWT_SECRET=your_secure_jwt_secret_32_chars_minimum
ENABLE_SECURITY_HEADERS=true
FORCE_HTTPS=true

# Performance
CACHE_ENABLED=true
CACHE_TTL=3600
RATE_LIMIT_MAX_REQUESTS=100
COMPRESSION=true

# Features
ENABLE_RECOMMENDATIONS=true
ENABLE_PLAYLIST_CREATION=true
ENABLE_AI_FEATURES=true
FEATURE_VOICE_COMMANDS=false
FEATURE_COLLABORATIVE_PLAYLISTS=false

# Monitoring
HEALTH_CHECK_ENABLED=true
PERFORMANCE_MONITORING=true
LOG_LEVEL=info
```

### Customization Options

**Theme Configuration:**
```bash
DEFAULT_THEME=dark
ENABLE_THEME_SWITCHING=true
PWA_THEME_COLOR=#00d4aa
PWA_BACKGROUND_COLOR=#1a1a1a
```

**Feature Flags:**
```bash
FEATURE_CHAT=true
FEATURE_RECOMMENDATIONS=true
FEATURE_PLAYLISTS=true
FEATURE_ANALYTICS=true
FEATURE_USER_PROFILES=true
```

## 🧪 Testing & Quality Assurance

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit           # Unit tests
npm run test:integration    # Integration tests
npm run test:e2e           # End-to-end tests
npm run test:performance   # Performance tests

# Coverage report
npm run test:coverage
```

### Test Categories

- **Unit Tests**: Individual component functionality
- **Integration Tests**: API endpoints and database operations
- **E2E Tests**: Complete user workflows
- **Performance Tests**: Load testing and optimization
- **Security Tests**: Vulnerability scanning and penetration testing

### Quality Checks

```bash
# Code quality
npm run lint              # ESLint code analysis
npm run format           # Prettier code formatting
npm run audit            # Security vulnerability scan

# Build verification
npm run build            # Production build test
npm run health-check     # Health endpoint verification
```

## 🚀 Production Deployment Checklist

### Pre-Deployment

- [ ] **API Keys Configured**: Spotify, AI providers (optional)
- [ ] **Environment Variables**: All secrets properly set
- [ ] **Domain Setup**: DNS configured and SSL ready
- [ ] **Database**: MongoDB or fallback database ready
- [ ] **Security**: HTTPS enabled, security headers configured

### Deployment Verification

- [ ] **Health Check**: `/health` endpoint responding
- [ ] **Authentication**: Spotify OAuth flow working
- [ ] **Core Features**: Chat, recommendations, playlists functional
- [ ] **Performance**: Response times under 2 seconds
- [ ] **Security**: SSL/TLS certificates valid
- [ ] **Monitoring**: Logs and metrics collecting

### Post-Deployment

```bash
# Health verification
curl https://your-domain.com/health

# API endpoint test
curl https://your-domain.com/api/health

# Performance check
curl -o /dev/null -s -w "%{time_total}" https://your-domain.com/

# SSL verification
curl -I https://your-domain.com/ | grep -E "HTTP|Strict-Transport-Security"
```

## 📊 Monitoring & Analytics

### Built-in Monitoring

**Health Endpoints:**
- `/health` - Application health status
- `/api/health` - API service status
- `/metrics` - Performance metrics (if enabled)

**Performance Monitoring:**
```javascript
// Real-time metrics tracked:
{
  responseTime: "Average response time",
  memoryUsage: "Memory consumption",
  cpuUsage: "CPU utilization",
  activeConnections: "Current connections",
  errorRate: "Error percentage",
  requestsPerSecond: "Throughput"
}
```

### Logging Configuration

```bash
# Log levels and rotation
LOG_LEVEL=info                    # debug, info, warn, error
LOG_ROTATION=daily               # Rotate logs daily
LOG_MAX_SIZE=100mb              # Maximum log file size
LOG_MAX_FILES=7                 # Keep 7 days of logs
LOG_FILE=/opt/echotune/logs/app.log
```

## 🛟 Troubleshooting Guide

### Common Issues & Solutions

**🔑 Authentication Problems**
```bash
# Issue: Spotify OAuth fails
# Solution: Check redirect URI matches exactly
SPOTIFY_REDIRECT_URI=https://your-domain.com/auth/callback

# Issue: DigitalOcean API fails
# Solution: Verify token permissions
node scripts/digitalocean-automation.js auth
```

**🐳 Docker Issues**
```bash
# Issue: Container won't start
# Solution: Check logs and rebuild
docker-compose logs app
docker-compose build --no-cache app

# Issue: Port conflicts
# Solution: Change port in docker-compose.yml
ports:
  - "3001:3000"  # Use different external port
```

**📦 Dependency Problems**
```bash
# Issue: npm install fails
# Solution: Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Issue: Node version compatibility
# Solution: Use Node.js 18 or 20
nvm use 20
npm install
```

**🔗 Network & Connectivity**
```bash
# Issue: API calls failing
# Solution: Check network and firewall
curl -I https://api.spotify.com/v1/
curl -I https://api.digitalocean.com/v2/account

# Issue: CORS errors in browser
# Solution: Update CORS origins in .env
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

### Debug Mode

```bash
# Enable debug logging
DEBUG=true
VERBOSE_LOGGING=true

# View detailed logs
docker-compose logs -f app
tail -f /opt/echotune/logs/app.log
```

### Getting Help

- 📖 **Documentation**: Complete guides in `/docs` folder
- 🐛 **Issues**: [GitHub Issues](https://github.com/dzp5103/Spotify-echo/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/dzp5103/Spotify-echo/discussions)
- 📧 **Contact**: Create an issue for technical support

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Fork and clone your fork
git clone https://github.com/YOUR_USERNAME/Spotify-echo.git
cd Spotify-echo

# Install dependencies
npm install
pip install -r requirements.txt

# Setup development environment
cp .env.production.example .env
npm run dev

# Run tests before submitting
npm test
npm run lint

# Create feature branch
git checkout -b feature/amazing-feature
```

### Code Standards

- **JavaScript**: ES2021+, async/await patterns, comprehensive error handling
- **Testing**: Jest for unit/integration tests, minimum 80% coverage
- **Documentation**: JSDoc comments for all public functions
- **Git**: Conventional commit messages, descriptive PR descriptions

## 📄 License & Legal

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Third-Party Services

- **Spotify Web API**: Subject to [Spotify Developer Terms](https://developer.spotify.com/terms)
- **OpenAI API**: Subject to [OpenAI Usage Policies](https://openai.com/policies/usage-policies)  
- **Google Gemini**: Subject to [Google AI Terms](https://ai.google.dev/terms)
- **DigitalOcean**: Subject to [DigitalOcean Terms](https://www.digitalocean.com/legal/terms-of-service-agreement)

## 🙏 Acknowledgments

Special thanks to:
- **[Spotify](https://developer.spotify.com/)** for comprehensive music data and streaming APIs
- **[OpenAI](https://openai.com/)** & **[Google](https://ai.google.dev/)** for advanced AI capabilities
- **[DigitalOcean](https://www.digitalocean.com/)** for reliable cloud infrastructure
- **[Node.js](https://nodejs.org/)** & **[React](https://reactjs.org/)** communities for robust frameworks
- **Contributors** who helped make this project better

## 🌟 Support the Project

If you find EchoTune AI useful:

- ⭐ **Star this repository** on GitHub
- 🐛 **Report bugs** and suggest new features  
- 📢 **Share with friends** and the developer community
- 💝 **Contribute code** or documentation improvements
- 🎵 **Use it for your projects** and let us know how it helps!

---

**🎵 Ready to transform music discovery with AI?**

[![Deploy to DigitalOcean](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/dzp5103/Spotify-echo/tree=main&refcode=echotuneai)

[![GitHub stars](https://img.shields.io/github/stars/dzp5103/Spotify-echo.svg?style=social&label=Star)](https://github.com/dzp5103/Spotify-echo/stargazers)

---

*EchoTune AI - Transforming music discovery through artificial intelligence* • **Version 2.1.0** • [GitHub](https://github.com/dzp5103/Spotify-echo) • [Documentation](docs/) • [Issues](https://github.com/dzp5103/Spotify-echo/issues)