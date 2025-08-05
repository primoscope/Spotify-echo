# 🚀 EchoTune AI - Quick Start Guide

Get EchoTune AI running in under 5 minutes with your preferred deployment method.

## ⚡ Choose Your Deployment Method

| Method | Time | Complexity | Best For |
|--------|------|------------|----------|
| [DigitalOcean](#digitalocean-one-click) | 2-3 min | ⭐ Easy | Production & Auto-scaling |
| [Docker](#docker-deployment) | 3-5 min | ⭐⭐ Medium | Any server with Docker |
| [Local Development](#local-development) | 2 min | ⭐ Easy | Testing & Development |

## 🌐 DigitalOcean One-Click

**Fastest production deployment with auto-scaling and SSL**

[![Deploy to DigitalOcean](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/dzp5103/Spotify-echo/tree/main&refcode=echotuneai)

**What you get:**
- ✅ HTTPS with automatic SSL
- ✅ Auto-scaling based on traffic
- ✅ Built-in monitoring & alerts
- ✅ Automatic deployments from GitHub

**Cost:** Starting at $5/month

[📖 Full DigitalOcean Guide](deployment/digitalocean-deployment.md)

## 🐳 Docker Deployment

**For any server with Docker - consistent across all platforms**

```bash
# 1. Clone repository
git clone https://github.com/dzp5103/Spotify-echo.git
cd Spotify-echo

# 2. Configure environment
cp .env.production.example .env.production
# Edit .env.production with your Spotify API credentials

# 3. Deploy with Docker Compose
docker-compose up -d

# 4. Open http://localhost:3000
```

**What you get:**
- ✅ Consistent environment
- ✅ Easy scaling and updates
- ✅ Isolated dependencies
- ✅ Works on any Docker host

[📖 Full Docker Guide](deployment/docker-deployment.md)

## 💻 Local Development

**Perfect for testing and development**

```bash
# 1. Clone repository
git clone https://github.com/dzp5103/Spotify-echo.git
cd Spotify-echo

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.production.example .env
# Edit .env with your settings (Spotify API optional for demo)

# 4. Start development server
npm start

# 5. Open http://localhost:3000
```

**What you get:**
- ✅ Instant setup
- ✅ Hot reload for development
- ✅ Works without API keys (demo mode)
- ✅ Full development tools

## 🔧 Required Configuration

### Spotify API Setup (Optional for Demo)

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add redirect URI: `http://localhost:3000/callback` (or your domain)
4. Copy Client ID and Client Secret to your `.env` file

### Environment Variables

**Minimum configuration:**
```env
NODE_ENV=production
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
```

**Complete configuration:**
```env
# Core application
NODE_ENV=production
PORT=3000

# Spotify API
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=https://your-domain.com/callback

# LLM Providers (optional)
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
LLM_PROVIDER=mock

# Database (optional)
MONGODB_URI=mongodb://localhost:27017/echotune
```

## ✅ Verify Installation

### Health Check
```bash
curl http://localhost:3000/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "version": "2.1.0",
  "uptime": 123.45,
  "checks": {
    "application": {"status": "healthy"},
    "spotify_api": {"status": "healthy"}
  }
}
```

### Test Features

1. **Open the application:** http://localhost:3000
2. **Try demo chat:** Click "Try Demo" for AI music recommendations
3. **Spotify login:** Connect your Spotify account (optional)
4. **Voice interface:** Test voice commands (if supported by browser)

## 🚀 Next Steps

### For Production
- [Configure SSL certificates](deployment/ubuntu-deployment.md#ssl-configuration)
- [Set up monitoring](deployment/digitalocean-deployment.md#monitoring-and-scaling)
- [Configure custom domain](deployment/digitalocean-deployment.md#custom-domain-setup)

### For Development
- [Development setup guide](guides/development.md)
- [API documentation](api/README.md)
- [Contributing guidelines](../CONTRIBUTING.md)

## 🆘 Troubleshooting

### Common Issues

**Application won't start:**
```bash
# Check logs
docker-compose logs -f echotune-ai
# Or for local development
npm run dev
```

**Spotify authentication not working:**
- Verify Client ID and Secret are correct
- Check redirect URI matches exactly
- Ensure domain is allowed in Spotify app settings

**Port already in use:**
```bash
# Change port in .env
PORT=3001

# Or kill process using port 3000
sudo lsof -i :3000
sudo kill -9 <process_id>
```

### Get Help
- 📖 [Full Documentation](../README.md)
- 🐛 [Report Issues](https://github.com/dzp5103/Spotify-echo/issues)
- 💬 [Community Discussions](https://github.com/dzp5103/Spotify-echo/discussions)

## 🎵 Ready to Discover Music?

Your EchoTune AI instance is ready! Try asking:
- "Recommend some upbeat songs for working out"
- "Create a chill playlist for studying"
- "I'm feeling nostalgic, what should I listen to?"
- "Analyze my music taste and suggest similar artists"

**Enjoy your personalized music discovery experience! 🎶**