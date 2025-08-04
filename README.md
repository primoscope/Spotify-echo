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

### Option 1: One-Click Deploy (Recommended)
[![Deploy to DigitalOcean](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/dzp5103/Spotify-echo/tree/main&refcode=echotuneai)

### Option 2: Local Development
```bash
git clone https://github.com/dzp5103/Spotify-echo.git
cd Spotify-echo
npm install
npm start
# Open http://localhost:3000
```

### Option 3: Docker
```bash
docker run -d -p 3000:3000 dzp5103/echotune-ai:latest
```

## 📋 Requirements

- **Node.js** 20+ 
- **Python** 3.8+ (for ML features)
- **Spotify API** credentials (optional - demo mode available)

## ⚙️ Environment Setup

Create `.env` file:
```env
# Spotify API (optional for demo)
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
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

**Cycle 3** - 2025-08-04

### Current Tasks (2)
- **System Enhancement and Optimization** (feature-development, Priority: high)
- **Testing Infrastructure Enhancement** (testing-improvements, Priority: medium)

*Last updated by Continuous Agent: 2025-08-04T00:52:35.373Z*
