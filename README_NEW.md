# 🎵 EchoTune AI - Intelligent Music Discovery Platform

> **🎯 Revolutionary AI-powered music recommendation system with conversational interface, advanced analytics, and seamless Spotify integration**

[![Deploy to DigitalOcean](https://img.shields.io/badge/Deploy%20to%20DigitalOcean-0080FF?style=for-the-badge&logo=digitalocean&logoColor=white)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/dzp5103/Spotify-echo/tree/main)
[![Docker](https://img.shields.io/badge/Deploy%20with%20Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](DOCKER_ENHANCED_GUIDE.md)
[![License](https://img.shields.io/badge/license-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.4.0-blue.svg?style=for-the-badge)](package.json)

---

## 📋 Project Overview

EchoTune AI is a **production-ready, intelligent music discovery platform** that leverages cutting-edge artificial intelligence and machine learning to revolutionize how users discover and interact with music. Built with modern web technologies, it provides personalized music recommendations through natural language conversations, advanced analytics, and seamless Spotify integration.

### 🎯 **Core Mission**
Transform music discovery through AI-powered conversations that understand context, mood, and personal preferences while providing explainable recommendations and comprehensive analytics.

### 🌟 **Key Differentiators**
- **Conversational AI**: Natural language music discovery with multi-provider LLM support
- **Explainable Recommendations**: Transparent ML algorithms with reasoning explanations
- **Real-time Analytics**: Live insights into listening patterns and recommendation effectiveness
- **Production Architecture**: Scalable, secure, and deployment-ready infrastructure
- **MCP Ecosystem**: Advanced automation with 8+ integrated Model Context Protocol servers

---

## ✨ Current Features

### 🤖 **AI-Powered Music Discovery**
- **Multi-Provider LLM Integration**: OpenAI GPT-4, Google Gemini 2.0, OpenRouter Claude 3.5, Azure OpenAI
- **Natural Language Queries**: "Find me something like Radiohead but more energetic for working out"
- **Context-Aware Recommendations**: AI remembers preferences, mood, and listening history
- **Explainable AI**: Detailed explanations for why tracks are recommended
- **Voice Interface**: Voice-to-text music discovery (planned)

### 🎵 **Advanced Music Features**
- **Spotify Integration**: Full OAuth 2.0 authentication with Web API integration
- **Playlist Management**: Create, edit, and manage playlists directly from conversations  
- **Audio Feature Analysis**: Deep analysis using Spotify's audio features (energy, valence, danceability)
- **5 Discovery Modes**: Smart, Mood-based, Trending, Social, AI Radio
- **Cross-Platform Support**: Works with Spotify Web Player and mobile apps

### 📊 **Comprehensive Analytics Dashboard**
- **Real-time Metrics**: Live listening behavior tracking and system performance
- **Interactive Visualizations**: Charts for listening patterns, genre preferences, mood analysis
- **Recommendation Insights**: Track recommendation accuracy and user satisfaction
- **Performance Monitoring**: System health, API response times, and user engagement
- **Data Export**: CSV/JSON export for personal analytics

### ⚙️ **Advanced Configuration System**
- **Modern Settings UI**: Professional interface with Material Design components
- **Multi-Provider Management**: Configure and test AI providers with real-time validation
- **Database Insights**: MongoDB analytics with collection-level performance data
- **System Health Monitoring**: Live status checks for all 8 system components
- **Configuration Persistence**: JSON-based settings with validation and rollback

### 🛡️ **Production-Grade Security**
- **OAuth 2.0 Authentication**: Secure Spotify login with token management
- **Rate Limiting**: DDoS protection and API abuse prevention
- **SSL/TLS Encryption**: Automated HTTPS with Let's Encrypt integration
- **Input Validation**: Comprehensive sanitization and security headers
- **Environment Security**: Secure API key storage and validation

---

## 🏗️ Technology Stack

### **Backend Infrastructure**
- **Runtime**: Node.js 20+ with Express.js framework
- **Real-time Communication**: Socket.io for live updates and notifications
- **API Architecture**: RESTful APIs with comprehensive error handling
- **Middleware**: Compression, CORS, rate limiting, security headers
- **Authentication**: JWT tokens with secure session management

### **Frontend Experience**  
- **Framework**: React 19+ with modern hooks and context providers
- **Build System**: Vite for fast development and optimized production builds
- **UI Library**: Material-UI (MUI) with custom theming and responsive design
- **Routing**: React Router for single-page application navigation
- **State Management**: React Context API with persistent storage

### **Database Architecture**
- **Primary Database**: MongoDB Atlas with optimized collections and indexing
- **Caching Layer**: Redis for session storage and API response caching
- **Fallback Database**: SQLite for local development and offline functionality
- **Analytics Storage**: Specialized collections for recommendation tracking

### **AI & Machine Learning**
- **LLM Integration**: OpenAI, Google Gemini, Anthropic Claude, OpenRouter
- **Recommendation Engine**: Collaborative filtering and content-based algorithms
- **Natural Language Processing**: Intent recognition and context understanding
- **Audio Analysis**: Spotify Web API audio features integration

### **DevOps & Deployment**
- **Containerization**: Docker and Docker Compose with multi-stage builds
- **Reverse Proxy**: Nginx with SSL termination and load balancing
- **Orchestration**: DigitalOcean App Platform with auto-scaling
- **CI/CD**: GitHub Actions with automated testing and deployment
- **Monitoring**: Health checks, performance metrics, and error tracking

### **Development Tools**
- **MCP Ecosystem**: 8+ Model Context Protocol servers for automation
- **Testing Framework**: Jest for unit, integration, and end-to-end testing
- **Code Quality**: ESLint, Prettier with automated formatting and validation
- **Documentation**: Comprehensive guides with automated updates

---

## 🚀 Quick Setup Instructions

### **Prerequisites**
Ensure you have the following installed:
- **Node.js**: Version 20.0.0 or higher
- **npm**: Version 10.0.0 or higher  
- **Python**: Version 3.8+ (for ML features)
- **Git**: Latest version for repository management

### **1. Repository Setup**
```bash
# Clone the repository
git clone https://github.com/dzp5103/Spotify-echo.git
cd Spotify-echo

# Install dependencies
npm install
pip install -r requirements.txt
```

### **2. Environment Configuration**
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### **3. Required Environment Variables**

**Essential Configuration:**
```env
# Application Settings
NODE_ENV=development
PORT=3000
DOMAIN=localhost

# Spotify API (Get from: https://developer.spotify.com/dashboard)
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/callback

# Security
SESSION_SECRET=your_secure_session_secret
JWT_SECRET=your_secure_jwt_secret

# Database (MongoDB Atlas recommended)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/echotune

# AI Provider (Choose one - Mock works without API keys)
DEFAULT_LLM_PROVIDER=mock
GEMINI_API_KEY=your_gemini_api_key_optional
OPENAI_API_KEY=your_openai_api_key_optional
```

### **4. Development Server**
```bash
# Start the development server
npm run dev

# Or start production server
npm start

# Open your browser to:
http://localhost:3000
```

### **5. Optional: Spotify Integration**
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new application
3. Add redirect URI: `http://localhost:3000/callback`
4. Copy Client ID and Client Secret to your `.env` file

---

## 📁 Project Structure

```
Spotify-echo/
├── src/                          # Source code
│   ├── frontend/                 # React frontend application
│   │   ├── components/           # Reusable UI components
│   │   ├── contexts/            # React context providers
│   │   └── styles/              # CSS and styling
│   ├── api/                     # Backend API routes
│   │   ├── routes/              # Express.js route handlers
│   │   ├── middleware/          # Custom middleware functions
│   │   └── advanced-settings.js # Advanced settings API
│   ├── database/                # Database connection and models
│   ├── chat/                    # AI chat system
│   ├── spotify/                 # Spotify API integration
│   ├── ml/                      # Machine learning algorithms
│   └── utils/                   # Utility functions
├── scripts/                     # Python ML and automation scripts
├── tests/                       # Comprehensive test suites
├── docs/                        # Documentation and guides
├── mcp-server/                  # Model Context Protocol servers
├── nginx/                       # Nginx configuration
├── data/                        # Sample data and datasets
├── static/                      # Static assets
├── package.json                 # Node.js dependencies and scripts
├── requirements.txt             # Python dependencies
├── docker-compose.yml           # Container orchestration
├── .env.example                 # Environment variables template
└── README.md                    # This file
```

---

## 🎮 Usage Guide

### **Basic Music Discovery**
1. **Open the Application**: Navigate to `http://localhost:3000`
2. **Start Chatting**: Use natural language to describe your music preferences
   - "I want something energetic for my workout"
   - "Play some chill jazz for studying"
   - "Find me new indie rock similar to Arctic Monkeys"
3. **Get Recommendations**: AI will provide personalized suggestions with explanations
4. **Create Playlists**: Save favorite recommendations to Spotify playlists

### **Advanced Features**
- **Settings Panel**: Configure AI providers and system preferences at `/settings`
- **Analytics Dashboard**: View listening insights and recommendation performance
- **Music Discovery**: Explore 5 different discovery modes for varied experiences
- **Voice Interface**: Use voice commands for hands-free music discovery (coming soon)

### **For Developers**
- **API Documentation**: Available in `docs/api/` directory
- **Testing**: Run `npm test` for comprehensive test suite
- **Development**: Use `npm run dev` for hot-reload development server
- **Deployment**: Follow guides in `docs/deployment/` for production setup

---

## 🔧 Configuration Options

### **Environment Variables Guide**

**Core Application:**
```env
NODE_ENV=development|production     # Application environment
PORT=3000                          # Server port
DOMAIN=your-domain.com             # Production domain
DEBUG=false                        # Debug mode (development only)
```

**Database Configuration:**
```env
MONGODB_URI=mongodb+srv://...      # Primary database
REDIS_URL=redis://localhost:6379   # Caching (optional)
ENABLE_SQLITE_FALLBACK=true       # Local fallback database
```

**AI Provider Settings:**
```env
DEFAULT_LLM_PROVIDER=mock          # mock|openai|gemini|openrouter
OPENAI_API_KEY=sk-...             # OpenAI API key
GEMINI_API_KEY=AIza...            # Google Gemini API key
OPENROUTER_API_KEY=sk-or-...      # OpenRouter API key
```

**Security & Performance:**
```env
RATE_LIMIT_WINDOW_MS=900000       # Rate limiting window
RATE_LIMIT_MAX_REQUESTS=100       # Max requests per window
ENABLE_SECURITY_HEADERS=true      # Security headers
COMPRESSION=true                   # Response compression
```

---

## 🚀 Deployment Guide

### **Quick Deployment Options**

**Option 1: DigitalOcean (Recommended)**
[![Deploy to DigitalOcean](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/dzp5103/Spotify-echo/tree/main)

**Option 2: Docker Deployment**
```bash
# Build and run with Docker
docker-compose up -d

# Access at http://localhost
```

**Option 3: Manual Server Setup**
```bash
# Install on Ubuntu server
curl -sSL https://raw.githubusercontent.com/dzp5103/Spotify-echo/main/scripts/simple-deploy.sh | bash
```

### **Production Deployment Steps**

1. **Server Prerequisites**
   - Ubuntu 22.04 or compatible Linux distribution
   - Docker and Docker Compose installed
   - Domain name pointing to server IP
   - SSL certificate (Let's Encrypt automated)

2. **Environment Setup**
   ```bash
   # Clone repository on server
   git clone https://github.com/dzp5103/Spotify-echo.git
   cd Spotify-echo
   
   # Configure production environment
   cp .env.production.example .env
   nano .env  # Edit with your production values
   ```

3. **Deploy Application**
   ```bash
   # Run deployment script
   ./deploy-production-quick.sh
   
   # Or use Docker Compose
   docker-compose -f docker-compose.yml up -d
   ```

4. **Verify Deployment**
   ```bash
   # Check application health
   curl https://your-domain.com/health
   
   # View logs
   docker-compose logs -f
   ```

### **GitHub Actions Deployment**

For automated deployment, configure GitHub secrets:
```env
DIGITALOCEAN_ACCESS_TOKEN     # DigitalOcean API token
SPOTIFY_CLIENT_ID            # Spotify app credentials
SPOTIFY_CLIENT_SECRET        # Spotify app credentials  
SESSION_SECRET               # Secure session secret
JWT_SECRET                   # JWT signing secret
MONGODB_URI                  # Database connection string
```

---

## 🧪 Testing

### **Running Tests**
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit              # Unit tests
npm run test:integration       # Integration tests
npm run test:e2e              # End-to-end tests
npm run test:performance      # Performance tests

# Run with coverage
npm test -- --coverage
```

### **Test Categories**
- **Unit Tests**: Individual component and function testing
- **Integration Tests**: API endpoint and database integration testing
- **End-to-End Tests**: Full application workflow testing
- **Performance Tests**: Load testing and performance benchmarks
- **MCP Tests**: Model Context Protocol server testing

### **Continuous Integration**
- **GitHub Actions**: Automated testing on pull requests
- **Code Quality**: ESLint and Prettier validation
- **Security Scanning**: Dependency vulnerability checks
- **Performance Monitoring**: Automated performance regression detection

---

## 📚 Documentation

| Guide | Description | Link |
|-------|-------------|------|
| **API Documentation** | Complete REST API reference | [API_DOCUMENTATION.md](API_DOCUMENTATION.md) |
| **Deployment Guide** | Production deployment instructions | [DEPLOYMENT.md](DEPLOYMENT.md) |
| **Contributing Guide** | Development and contribution guidelines | [CONTRIBUTING.md](CONTRIBUTING.md) |
| **Configuration Guide** | Environment and settings configuration | [CONFIGURATION_GUIDE.md](CONFIGURATION_GUIDE.md) |
| **Database Architecture** | Database design and schema documentation | [DATABASE_ARCHITECTURE_GUIDE.md](DATABASE_ARCHITECTURE_GUIDE.md) |
| **MCP Servers Guide** | Model Context Protocol automation | [docs/mcp-servers.md](docs/mcp-servers.md) |
| **Troubleshooting** | Common issues and solutions | [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) |

---

## 🤝 Contributing

We welcome contributions from developers, designers, and music enthusiasts! 

### **Quick Start for Contributors**
```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/YOUR_USERNAME/Spotify-echo.git
cd Spotify-echo

# Setup development environment
npm install
cp .env.example .env
npm run dev

# Create a feature branch
git checkout -b feature/amazing-feature

# Make your changes and test
npm test
npm run lint

# Submit a pull request
```

### **Contribution Guidelines**
- **Code Quality**: Follow ESLint configuration and use Prettier for formatting
- **Testing**: Add tests for new features and ensure existing tests pass
- **Documentation**: Update relevant documentation for changes
- **Pull Requests**: Use clear titles and descriptions with linked issues

### **Development Resources**
- **Code Style**: ESLint and Prettier configurations included
- **Git Hooks**: Pre-commit hooks for code quality validation
- **Issue Templates**: Use provided templates for bug reports and features
- **Development Chat**: Join discussions in GitHub Discussions

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### **Third-Party Licenses**
- **Spotify Web API**: Subject to [Spotify Developer Terms](https://developer.spotify.com/terms)
- **OpenAI API**: Subject to [OpenAI Usage Policies](https://openai.com/policies/usage-policies)
- **Google Gemini**: Subject to [Google AI Terms](https://ai.google.dev/terms)

---

## 🙏 Acknowledgments

### **Core Technologies**
- **[Spotify](https://developer.spotify.com/)** - Music data and streaming platform
- **[OpenAI](https://openai.com/)** & **[Google Gemini](https://ai.google.dev/)** - AI language models
- **[Node.js](https://nodejs.org/)** & **[React](https://reactjs.org/)** - Application framework
- **[MongoDB](https://mongodb.com/)** - Database platform

### **Infrastructure Partners**
- **[DigitalOcean](https://www.digitalocean.com/)** - Cloud hosting and deployment
- **[Docker](https://www.docker.com/)** - Containerization platform
- **[GitHub](https://github.com/)** - Version control and CI/CD

### **Community Contributors**
Special thanks to all contributors who have helped improve EchoTune AI through code contributions, bug reports, feature requests, and feedback.

---

## 📞 Support & Contact

### **Getting Help**
- **📖 Documentation**: Comprehensive guides available in `/docs` directory
- **🐛 Bug Reports**: [Create an issue](https://github.com/dzp5103/Spotify-echo/issues) on GitHub
- **💡 Feature Requests**: [Start a discussion](https://github.com/dzp5103/Spotify-echo/discussions) 
- **❓ Questions**: Use GitHub Discussions for community support

### **Community Links**
- **GitHub Repository**: [https://github.com/dzp5103/Spotify-echo](https://github.com/dzp5103/Spotify-echo)
- **Documentation**: [GitHub Pages Documentation](https://dzp5103.github.io/Spotify-echo/)
- **Issue Tracker**: [GitHub Issues](https://github.com/dzp5103/Spotify-echo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/dzp5103/Spotify-echo/discussions)

---

## 🌟 Star History

If you find EchoTune AI useful, please consider starring the repository!

[![GitHub stars](https://img.shields.io/github/stars/dzp5103/Spotify-echo.svg?style=social&label=Star)](https://github.com/dzp5103/Spotify-echo/stargazers)

---

**🎵 Ready to discover your next favorite song? [Get Started](#-quick-setup-instructions) today!**

*EchoTune AI - Transforming music discovery through artificial intelligence*