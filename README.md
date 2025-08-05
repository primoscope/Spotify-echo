# 🎵 EchoTune AI - Next-Generation Music Discovery Platform

[![Deploy to DigitalOcean](https://img.shields.io/badge/Deploy%20to%20DigitalOcean-0080FF?style=for-the-badge&logo=digitalocean&logoColor=white)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/dzp5103/Spotify-echo/tree/main&refcode=echotuneai)
[![Docker](https://img.shields.io/badge/Deploy%20with%20Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](docs/deployment/docker-deployment.md)
[![License](https://img.shields.io/badge/license-MIT-green.svg?style=for-the-badge)](LICENSE)

> **AI-powered music recommendation system with conversational interface, Spotify integration, and advanced ML algorithms.**

## ✨ Key Features

- 🤖 **AI Music Assistant** - Natural language music discovery with multiple LLM providers
- 🎵 **Spotify Integration** - Seamless playlist creation and music streaming
- 📊 **Analytics Dashboard** - Deep insights into listening patterns and preferences  
- 🔍 **Smart Recommendations** - ML-powered personalized suggestions using collaborative filtering
- 🎯 **Demo Mode** - Full functionality without API keys for instant testing
- 🔊 **Voice Interface** - Voice commands for hands-free music discovery
- 📱 **Mobile Responsive** - Optimized experience across all devices

## 🚀 Quick Start

**Get running in under 5 minutes** - Choose your preferred method:

| Method | Time | Best For |
|--------|------|----------|
| [**DigitalOcean**](docs/QUICK_START.md#digitalocean-one-click) | 2-3 min | Production with auto-scaling |
| [**Docker**](docs/QUICK_START.md#docker-deployment) | 3-5 min | Any server with containerization |
| [**Local Dev**](docs/QUICK_START.md#local-development) | 2 min | Testing and development |

### ⚡ One-Click Production Deploy
[![Deploy to DigitalOcean](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/dzp5103/Spotify-echo/tree/main&refcode=echotuneai)

### 🐳 Docker Deployment
```bash
git clone https://github.com/dzp5103/Spotify-echo.git
cd Spotify-echo
docker-compose up -d
# Open http://localhost:3000
```

### 💻 Local Development
```bash
git clone https://github.com/dzp5103/Spotify-echo.git
cd Spotify-echo
npm install && npm start
# Open http://localhost:3000
```

📖 **[Complete Quick Start Guide](docs/QUICK_START.md)**

## 🏗️ Architecture

### Technology Stack
- **Backend**: Node.js, Express.js, Socket.io for real-time features
- **Frontend**: React, Vite for modern web experience
- **Database**: MongoDB (primary), SQLite (fallback), Supabase support
- **AI/ML**: OpenAI GPT, Google Gemini, custom recommendation algorithms
- **Infrastructure**: Docker, nginx, SSL automation, health monitoring
- **Deployment**: DigitalOcean App Platform, Docker Compose, Ubuntu

### Project Structure
```
Spotify-echo/
├── src/                    # Source code
│   ├── frontend/          # React components and UI
│   ├── chat/              # AI chat system
│   ├── spotify/           # Spotify API integration
│   └── utils/             # Utilities and helpers
├── scripts/               # Python ML and automation scripts
├── tests/                 # Comprehensive test suites
├── docs/                  # Documentation
│   ├── deployment/        # Deployment guides
│   ├── api/               # API documentation
│   └── guides/            # User and developer guides
├── mcp-server/            # Model Context Protocol server
└── docker-compose.yml     # Container orchestration
```

## 🤖 AI & Machine Learning Features

### Recommendation Engine
- **🧠 Collaborative Filtering** - Advanced user behavior analysis
- **🎵 Content-Based Filtering** - Audio feature matching with Spotify's analysis
- **🔮 Deep Learning** - Neural network-based recommendation models
- **📈 Real-time Learning** - Adaptive preferences with continuous improvement

### Conversational AI
- **💬 Natural Language Processing** - Understand music requests in plain English
- **🎯 Mood Detection** - Context-aware recommendations based on listening patterns
- **🔄 Multi-Provider Support** - OpenAI, Google Gemini, and mock providers
- **📊 Analytics Integration** - Learn from user interactions and feedback

## 🛡️ Production Features

### Security & Performance
- **🔐 OAuth 2.0** - Secure Spotify authentication
- **⚡ Rate Limiting** - DDoS protection and API abuse prevention
- **🛡️ Input Validation** - Comprehensive security headers and validation
- **🔒 SSL/TLS** - Automatic HTTPS with Let's Encrypt
- **📊 Health Monitoring** - Real-time system health checks and metrics

### Deployment & Scaling
- **🐳 Docker Support** - Multi-stage builds and container optimization
- **☁️ Cloud Ready** - DigitalOcean App Platform with auto-scaling
- **🔄 CI/CD Integration** - GitHub Actions for automated testing and deployment
- **📈 Monitoring** - Application metrics, logging, and alerting

## 📚 Documentation

| Guide | Description |
|-------|-------------|
| [**Quick Start Guide**](docs/QUICK_START.md) | Get running in under 5 minutes |
| [**Ubuntu Deployment**](docs/deployment/ubuntu-deployment.md) | Complete server setup with SSL |
| [**Docker Deployment**](docs/deployment/docker-deployment.md) | Containerized deployment guide |
| [**DigitalOcean Deployment**](docs/deployment/digitalocean-deployment.md) | Cloud deployment with auto-scaling |
| [**API Documentation**](docs/api/README.md) | Backend API reference |
| [**Development Guide**](CODING_AGENT_GUIDE.md) | Setup for contributors |
| [**Database Architecture**](DATABASE_ARCHITECTURE_GUIDE.md) | Data structure and schema |

## 🔧 Development

### Prerequisites
- Node.js 20+ and npm 10+
- Python 3.8+ (for ML features)
- Docker and Docker Compose (optional)
- Spotify Developer Account (optional for demo)

### Setup
```bash
# Clone and install
git clone https://github.com/dzp5103/Spotify-echo.git
cd Spotify-echo
npm install
pip install -r requirements.txt

# Configure environment
cp .env.production.example .env
# Edit .env with your API keys

# Development server
npm run dev        # Frontend development with hot reload
npm start          # Production server
npm test           # Run test suite
npm run lint       # Code linting and formatting
```

### Available Scripts
```bash
npm run build      # Build for production
npm run test       # Run comprehensive test suite
npm run lint       # ESLint code quality checks
npm run format     # Prettier code formatting
npm run health-check # Application health verification
```

## 📊 Project Status

### ✅ Completed Features
- Core music recommendation engine with ML algorithms
- Complete Spotify OAuth and API integration
- Multi-provider AI chat interface (OpenAI, Gemini, Mock)
- Comprehensive health monitoring with <50ms response times
- Production-ready Docker containerization
- Automated Ubuntu server deployment with SSL
- Security features: rate limiting, input validation, HTTPS
- Comprehensive testing infrastructure

### 🚧 In Development
- Mobile Progressive Web App features
- Advanced deep learning recommendation models
- Enhanced analytics dashboard
- Real-time collaborative playlists

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Start for Contributors
```bash
# Fork and clone your fork
git clone https://github.com/YOUR_USERNAME/Spotify-echo.git
cd Spotify-echo

# Setup development environment
npm install
cp .env.production.example .env
npm run dev

# Run tests before submitting
npm test
npm run lint

# Create feature branch and submit PR
git checkout -b feature/amazing-feature
```

## 🆘 Troubleshooting

### Common Issues
- **🔑 Spotify Authentication**: Verify API credentials and redirect URI
- **🐳 Docker Issues**: Check logs with `docker-compose logs -f`
- **🔧 Performance**: Monitor with `/health` endpoint and system resources
- **🌐 SSL Problems**: Verify certificates with `certbot certificates`

### Getting Help
- 📖 [Documentation](docs/) - Comprehensive guides
- 🐛 [Report Issues](https://github.com/dzp5103/Spotify-echo/issues) - Bug reports
- 💬 [Discussions](https://github.com/dzp5103/Spotify-echo/discussions) - Community support

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Third-Party Services
- **Spotify Web API**: Subject to [Spotify Developer Terms](https://developer.spotify.com/terms)
- **OpenAI API**: Subject to [OpenAI Usage Policies](https://openai.com/policies/usage-policies)
- **Google Gemini**: Subject to [Google AI Terms](https://ai.google.dev/terms)

## 🙏 Acknowledgments

- **[Spotify](https://developer.spotify.com/documentation/web-api/)** - Music data and streaming
- **[OpenAI](https://openai.com/)** & **[Google Gemini](https://ai.google.dev/)** - AI capabilities
- **[Node.js](https://nodejs.org/)** & **[React](https://reactjs.org/)** - Application framework
- **[Docker](https://www.docker.com/)** & **[DigitalOcean](https://www.digitalocean.com/)** - Deployment infrastructure

## 🌟 Support the Project

If you find EchoTune AI useful:
- ⭐ **Star this repository** on GitHub
- 🐛 **Report bugs** and suggest features
- 📢 **Share with friends** and on social media
- 💝 **Contribute code** or documentation

---

**🎵 Ready to discover your next favorite song?**

[![Deploy to DigitalOcean](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/dzp5103/Spotify-echo/tree/main&refcode=echotuneai)

[![GitHub stars](https://img.shields.io/github/stars/dzp5103/Spotify-echo.svg?style=social&label=Star)](https://github.com/dzp5103/Spotify-echo/stargazers)

---

*EchoTune AI - Transforming music discovery through artificial intelligence* • **Version 2.1.0**