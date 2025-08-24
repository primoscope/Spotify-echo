# 🎵 EchoTune AI - Advanced Music Discovery Platform

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/primoscope/Spotify-echo&env=MONGODB_URI,JWT_SECRET,SESSION_SECRET,SPOTIFY_CLIENT_ID,SPOTIFY_CLIENT_SECRET&envDescription=Environment%20variables%20for%20EchoTune%20AI%20deployment&envLink=https://github.com/primoscope/Spotify-echo/blob/main/.env.example)

[![Deploy to DigitalOcean](https://www.digitalocean.com/assets/media/logo-icon-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/primoscope/Spotify-echo&refcode=your_ref_code)

## 🚀 Quick Deploy

### Vercel (Recommended for Serverless)
Click the "Deploy with Vercel" button above for instant deployment to Vercel's serverless platform with automatic scaling and global CDN.

**Features:**
- ✅ Automatic HTTPS with SSL certificates
- ✅ Global CDN with edge caching  
- ✅ Serverless functions with auto-scaling
- ✅ Built-in CI/CD from GitHub
- ✅ Real-time features automatically disabled for serverless compatibility

### DigitalOcean (Recommended for Full Control)
Click the "Deploy to DigitalOcean" button above for deployment to DigitalOcean's managed platform with full server control.

**Features:**
- ✅ Full Node.js server with persistent connections
- ✅ Real-time Socket.IO support
- ✅ MongoDB and Redis integration
- ✅ Managed load balancing
- ✅ Direct server access and monitoring

### One-Command Deployment
```bash
# Vercel (Serverless)
npm run vercel-build  # Validates environment
vercel deploy

# DigitalOcean Droplet (VPS)
curl -fsSL https://raw.githubusercontent.com/primoscope/Spotify-echo/main/scripts/deploy-digitalocean-droplet.sh | sudo bash

# DigitalOcean App Platform (Managed)
npm run deploy:digitalocean:app
```

## 🏗️ Architecture Overview

### Monolithic Server + Future Decomposition Plan

**Current Architecture (Phase 1):**
- Single Node.js server handling all requests (`server.js` → `src/server.js`)
- Express.js API with Socket.IO for real-time features
- MongoDB for data persistence, Redis for caching/sessions
- React frontend served from `dist/` directory

**Future Decomposition Plan (Phases 2-3):**
- **Phase 2**: Gradually migrate endpoints to serverless functions
- **Phase 3**: Decompose into microservices (auth, recommendations, analytics)
- **Database Migration**: MongoDB Atlas for serverless, connection pooling

**Vercel Deployment Strategy:**
- Deploy as single serverless function for cold start optimization
- Real-time features automatically disabled (`DISABLE_REALTIME=true`)
- Graceful degradation to HTTP polling for chat features

### Environment Variables

#### Required (Application will not start without these)
```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/echotune
JWT_SECRET=your-jwt-secret-32-chars-minimum
```

#### Recommended (Important for production)
```bash
SESSION_SECRET=your-session-secret-32-chars-minimum
REDIS_URL=redis://user:pass@host:port
NODE_ENV=production
PORT=3000
```

#### Spotify Integration (Required for music features)
```bash
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret  
SPOTIFY_REDIRECT_URI=https://yourdomain.com/auth/callback
```

#### Feature Flags (Control application behavior)
```bash
DISABLE_REALTIME=false    # Set to 'true' for serverless deployment
ENABLE_TRACING=true       # OpenTelemetry tracing
ENABLE_AGENTOPS=false     # AgentOps telemetry (when API key provided)
```

#### AI Providers (Optional - enables advanced features)
```bash
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
PERPLEXITY_API_KEY=pplx-...
XAI_API_KEY=xai-...
ANTHROPIC_API_KEY=sk-ant-...
```

#### Performance & Monitoring
```bash
LOG_LEVEL=info
COMPRESSION=true
CACHE_TTL=3600
RATE_LIMIT_MAX=100
```

For complete environment variable documentation, see [.env.example](./.env.example).

### Real-time Feature Flag

**Serverless Deployment (Vercel):**
- Set `DISABLE_REALTIME=true` to disable Socket.IO
- Chat features gracefully degrade to HTTP polling
- Reduces cold start time and memory usage

**Full Server Deployment (DigitalOcean):**
- Keep `DISABLE_REALTIME=false` for full real-time features
- WebSocket connections for live chat and notifications
- Better user experience with instant updates

### Deployment Notes

#### Cold Start Considerations
- **Vercel**: Optimized for sub-500ms cold starts with minimal dependencies
- **Prestart validation**: Only runs when `RUN_ENV_VALIDATION=true`
- **Dependency optimization**: MCP tooling moved to devDependencies (19.4% reduction)

#### Session Management
- **With Redis**: Persistent sessions across server restarts/scaling
- **Without Redis**: Memory store with warning in production logs
- **Recommendation**: Always configure `REDIS_URL` for production

#### Health Monitoring
- **Health endpoint**: `GET /health` with Redis connectivity check
- **Readiness probe**: `GET /ready` for load balancer health checks  
- **Liveness probe**: `GET /alive` for basic application response
- **Observability**: Structured logging with configurable levels

## 📦 Deployment (Docker, DigitalOcean, Vercel)

### 1) Environment
```bash
cp .env.example .env
# Edit .env and set at least:
# JWT_SECRET, SESSION_SECRET, SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET
# Optional: MONGODB_URI, REDIS_URL, PERPLEXITY_API_KEY
```

### 2) Docker (production)
```bash
# Build
docker build --build-arg BUILD_SHA=$(git rev-parse --short HEAD) \
  --build-arg BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ") -t echotune-ai:latest .

# Run
docker run --env-file .env -p 3000:3000 --name echotune echotune-ai:latest

# Health
curl -fsS http://localhost:3000/health
```

### 3) Docker Compose
```bash
# Production-like stack (app + redis, optional mongo)
docker compose up -d

# Logs
docker compose logs -f app

# Dev override (hot reload)
docker compose -f docker-compose.yml -f docker-compose.override.yml --profile dev up app-dev vite redis
```

### 4) DigitalOcean App Platform
```bash
# Create app from spec
#doctl auth init
#doctl apps create --spec app.yaml

# Important: In Spotify Dashboard set redirect:
#  https://YOUR_DO_DOMAIN/auth/callback
```

### 5) Vercel
- This repo builds a Vite frontend to `dist/`. If you deploy on Vercel but host API elsewhere, set the API proxy in `vercel.json` rewrites to your backend domain.
- Add environment variables via Vercel dashboard (no secrets in code).
- Spotify redirect to configure in Spotify Dashboard:
  - https://YOUR_VERCEL_DOMAIN/auth/callback

### OAuth Redirects
- Dev: http://localhost:3000/auth/callback
- DigitalOcean: https://YOUR_DO_DOMAIN/auth/callback
- Vercel: https://YOUR_VERCEL_DOMAIN/auth/callback

If mismatched, Spotify will return: INVALID_CLIENT: Invalid redirect URI.

### Health Endpoints
- GET `/health` basic JSON status
- GET `/api/health` quick API health
- GET `/api/health/detailed` comprehensive report

See `DEPLOY_CHECKLIST.md` before going live.

## 📖 Overview

EchoTune AI is an advanced music discovery platform that combines AI-powered recommendations, conversational music search, and comprehensive analytics. Built with modern technologies including React 19, Node.js, MongoDB, and Redis, it provides a seamless music experience powered by multiple AI providers.

## ✨ Features

### 🎵 Music Discovery
- **AI-Powered Recommendations**: Advanced algorithms for personalized music suggestions
- **Conversational Search**: Natural language music queries and discovery
- **Playlist Generation**: Intelligent playlist creation based on mood, genre, and preferences
- **Spotify Integration**: Full Spotify OAuth and API integration

### 🤖 AI & Machine Learning
- **Multi-Provider Support**: OpenAI, Google AI, Perplexity AI, XAI (Grok)
- **Conversational AI**: Natural language music chat and recommendations
- **Explainable AI**: Transparent reasoning for music suggestions
- **Continuous Learning**: Adaptive algorithms that improve over time

### 📊 Analytics & Insights
- **Listening Analytics**: Comprehensive music listening statistics
- **Performance Metrics**: Real-time system monitoring and optimization
- **User Behavior Analysis**: Deep insights into music preferences
- **Recommendation Quality**: Metrics for AI suggestion accuracy

### 🔧 Technical Features
- **Modern Stack**: React 19 + Vite, Node.js, MongoDB, Redis
- **Real-time Updates**: WebSocket integration for live features
- **Responsive Design**: Mobile-first, cross-platform compatibility
- **API-First Architecture**: RESTful APIs with comprehensive documentation
- **Security**: JWT authentication, rate limiting, CORS protection

## 🏗️ Architecture

### Frontend (React 19 + Vite)
```
src/frontend/
├── components/          # Reusable UI components
├── contexts/           # React context providers
├── styles/            # CSS and styling
├── App.jsx            # Main application component
└── index.jsx          # Application entry point
```

### Backend (Node.js + Express)
```
src/
├── api/               # API routes and middleware
├── auth/              # Authentication and authorization
├── database/          # Database models and connections
├── ml/                # Machine learning algorithms
├── spotify/           # Spotify integration
├── utils/             # Utility functions
└── server.js          # Main server file
```

### MCP (Model Context Protocol) Integration
```
mcp-servers/
├── perplexity-mcp/    # Perplexity AI integration
├── browserbase/       # Browser automation
├── filesystem/        # File system operations
├── memory/            # Memory management
└── enhanced-mcp/      # Enhanced MCP capabilities
```

## 🚀 Deployment Options

### 1. Vercel (Serverless)
**Best for:** Frontend + API, rapid deployment, cost-effective scaling

**Features:**
- ✅ Automatic deployments from Git
- ✅ Built-in SSL certificates
- ✅ Global CDN
- ✅ Serverless functions
- ✅ Zero configuration

**Quick Start:**
```bash
# Clone repository
git clone https://github.com/dzp5103/Spotify-echo.git
cd Spotify-echo

# Setup environment
npm run vercel:setup

# Deploy
npm run deploy:vercel
```

**Environment Variables:**
```bash
# Required
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your_very_long_random_jwt_secret_key
SESSION_SECRET=your_very_long_random_session_secret

# Optional
REDIS_URL=redis://username:password@host:port
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
OPENAI_API_KEY=your_openai_api_key
PERPLEXITY_API_KEY=your_perplexity_api_key
```

### 2. DigitalOcean App Platform
**Best for:** Production applications, managed infrastructure, cost optimization

**Features:**
- ✅ Fully managed platform
- ✅ Automatic scaling
- ✅ Built-in monitoring
- ✅ SSL certificates
- ✅ Container deployment

**Quick Start:**
```bash
# Setup environment
npm run do:setup-env

# Deploy to App Platform
npm run deploy:digitalocean:app
```

### 3. DigitalOcean Droplet
**Best for:** Full control, custom configurations, cost optimization

**Features:**
- ✅ Complete server control
- ✅ Docker containerization
- ✅ Custom SSL setup
- ✅ Advanced monitoring
- ✅ Cost-effective

**Quick Start:**
```bash
# One-command deployment
curl -fsSL https://raw.githubusercontent.com/dzp5103/Spotify-echo/main/scripts/deploy-digitalocean-droplet.sh | sudo bash
```

### 4. DigitalOcean Kubernetes (DOKS)
**Best for:** Enterprise applications, microservices, advanced orchestration

**Features:**
- ✅ Enterprise-grade orchestration
- ✅ Advanced scaling
- ✅ Multi-service architecture
- ✅ Production-ready
- ✅ Advanced monitoring

**Quick Start:**
```bash
# Deploy to DOKS
npm run deploy:digitalocean:k8s
```

## 🔧 Development Setup

### Prerequisites
- Node.js 20+ and npm 10+
- MongoDB (local or Atlas)
- Redis (local or cloud)
- Git

### Local Development
```bash
# Clone repository
git clone https://github.com/dzp5103/Spotify-echo.git
cd Spotify-echo

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Start development servers
npm run dev          # Frontend (Vite)
npm run dev:backend  # Backend (Node.js)
```

### Environment Configuration
```bash
# Copy example environment file
cp .env.example .env

# Required variables
MONGODB_URI=mongodb://localhost:27017/echotune
JWT_SECRET=your_development_jwt_secret
SESSION_SECRET=your_development_session_secret

# Optional variables
REDIS_URL=redis://localhost:6379
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
OPENAI_API_KEY=your_openai_api_key
PERPLEXITY_API_KEY=your_perplexity_api_key
```

## 📚 API Documentation

### Core Endpoints
- `GET /api/health` - Health check
- `GET /api/spotify/*` - Spotify integration
- `POST /api/chat` - AI chat interface
- `GET /api/recommendations` - Music recommendations
- `POST /api/playlists` - Playlist management

### Authentication
```bash
# JWT token required for protected endpoints
Authorization: Bearer <your_jwt_token>
```

### Rate Limiting
- API endpoints: 100 requests per 15 minutes
- Authentication: 5 requests per 15 minutes
- Spotify endpoints: 50 requests per minute

## 🧪 Testing

### Run Tests
```bash
# All tests
npm test

# Specific test suites
npm run test:unit      # Unit tests
npm run test:integration # Integration tests
npm run test:e2e       # End-to-end tests
npm run test:performance # Performance tests

# Watch mode
npm run test:watch
```

### Test Coverage
```bash
# Generate coverage report
npm run test:coverage

# Coverage targets
- Statements: 80%
- Branches: 80%
- Functions: 80%
- Lines: 80%
```

## 📊 Monitoring & Analytics

### Built-in Monitoring
- **Health Checks**: `/api/health` endpoint
- **Performance Metrics**: Response time, memory usage, CPU
- **Error Tracking**: Automatic error logging and reporting
- **Request Logging**: All API requests logged with metadata

### External Monitoring
- **Sentry**: Error tracking and performance monitoring
- **AgentOps**: AI agent monitoring and optimization
- **Custom Dashboards**: Grafana or similar for advanced metrics

### Log Management
```bash
# View application logs
npm run logs

# View specific service logs
npm run logs:api
npm run logs:frontend
npm run logs:database
```

## 🔒 Security

### Authentication & Authorization
- **JWT Tokens**: Secure token-based authentication
- **Session Management**: Redis-backed session storage
- **Rate Limiting**: Protection against abuse and DDoS
- **CORS Protection**: Configurable cross-origin resource sharing

### Data Protection
- **Input Validation**: Comprehensive input sanitization
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Content Security Policy headers
- **HTTPS Enforcement**: SSL/TLS encryption

### Security Headers
```javascript
// Automatic security headers
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
```

## 🚀 Performance Optimization

### Frontend Optimization
- **Code Splitting**: Dynamic imports for better loading
- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: WebP format with fallbacks
- **Service Worker**: Offline capabilities and caching

### Backend Optimization
- **Database Indexing**: Optimized MongoDB queries
- **Redis Caching**: Session and data caching
- **Connection Pooling**: Database connection optimization
- **Gzip Compression**: Response compression

### CDN & Assets
- **Static Asset Optimization**: Minification and compression
- **CDN Integration**: Global content delivery
- **Cache Headers**: Optimized caching strategies
- **Bundle Analysis**: Webpack bundle optimization

## 🔄 Continuous Integration/Deployment

### GitHub Actions
```yaml
# Automated testing and deployment
name: CI/CD Pipeline
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run build
```

### Deployment Automation
- **Automatic Testing**: Tests run on every commit
- **Build Verification**: Automated build validation
- **Deployment Triggers**: Automatic deployment on main branch
- **Health Checks**: Post-deployment verification

## 📈 Scaling & Infrastructure

### Horizontal Scaling
- **Load Balancing**: Multiple instance support
- **Auto-scaling**: Automatic resource scaling
- **Database Sharding**: MongoDB cluster support
- **Redis Clustering**: Distributed caching

### Vertical Scaling
- **Resource Optimization**: Memory and CPU tuning
- **Database Optimization**: Query optimization and indexing
- **Caching Strategies**: Multi-layer caching
- **CDN Integration**: Global content delivery

## 🆘 Support & Resources

### Documentation
- **API Reference**: Complete API documentation
- **Deployment Guides**: Step-by-step deployment instructions
- **Troubleshooting**: Common issues and solutions
- **Performance Tuning**: Optimization guidelines

### Community
- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: Community discussions and help
- **Wiki**: Additional documentation and guides
- **Examples**: Code examples and tutorials

### Getting Help
1. **Check Documentation**: Start with the deployment guides
2. **Search Issues**: Look for similar problems in GitHub issues
3. **Create Issue**: Report bugs or request features
4. **Community Support**: Ask questions in discussions

## 🤝 Contributing

### Development Workflow
1. **Fork Repository**: Create your own fork
2. **Create Branch**: Make changes in feature branch
3. **Write Tests**: Ensure all tests pass
4. **Submit PR**: Create pull request with description
5. **Code Review**: Address feedback and suggestions

### Code Standards
- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting
- **Jest**: Testing framework
- **TypeScript**: Type safety (optional)

### Testing Requirements
- **Unit Tests**: 80% coverage minimum
- **Integration Tests**: API endpoint testing
- **E2E Tests**: User workflow testing
- **Performance Tests**: Load and stress testing

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Spotify**: Music API and integration
- **OpenAI**: AI language models
- **Perplexity AI**: Research and analysis capabilities
- **DigitalOcean**: Infrastructure and hosting
- **Vercel**: Serverless deployment platform
- **Community**: Contributors and users

## 📊 Project Status

- **Version**: 2.1.0
- **Status**: Production Ready
- **Last Updated**: January 2025
- **Maintenance**: Active Development
- **Support**: Community + Documentation

---

## 🚀 Quick Start Summary

1. **Choose Platform**: Vercel (easiest) or DigitalOcean (full control)
2. **Click Deploy**: Use the deployment buttons above
3. **Configure Environment**: Set required environment variables
4. **Deploy**: Automatic deployment and configuration
5. **Customize**: Add your domain, configure SSL, set up monitoring

**Ready to deploy?** Click one of the deployment buttons above to get started! 🎵

For detailed instructions, see:
- [Vercel Deployment Guide](./DEPLOY_TO_VERCEL.md)
- [DigitalOcean Deployment Guide](./DEPLOY_TO_DIGITALOCEAN.md)
- [Environment Setup](./scripts/setup-vercel-env.js)
- [Troubleshooting](./docs/troubleshooting.md)