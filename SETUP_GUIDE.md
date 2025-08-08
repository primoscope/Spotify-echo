# EchoTune AI - Complete Setup Guide

## Quick Setup (Recommended)

### One-Command Installation
```bash
curl -sSL https://raw.githubusercontent.com/dzp5103/Spotify-echo/main/deploy-ubuntu22-wizard.sh | sudo bash
```

This interactive wizard will:
- ✅ Handle Ubuntu 22.04 compatibility issues
- ✅ Configure MongoDB connection
- ✅ Set up SSL certificates
- ✅ Configure domain and DNS
- ✅ Install and optimize all dependencies

## Manual Setup

### 1. Prerequisites
- Ubuntu 22.04+ server with root access
- Domain name pointed to your server IP
- Spotify Developer account

### 2. API Keys Required
- **Spotify**: Get from https://developer.spotify.com/dashboard
- **Gemini AI**: Get from https://makersuite.google.com/app/apikey

### 3. Environment Configuration
Copy `.env.example` to `.env` and update with your values:
```bash
cp .env.example .env
# Edit .env with your API keys and domain
```

### 4. Installation
```bash
# Install dependencies
npm install
pip install -r requirements.txt

# Start the application
npm start
```

## Testing Your Installation

```bash
# Validate all components
npm run validate:comprehensive

# Test specific features
npm run validate:mongodb
npm run validate:spotify
npm run test:gemini-integration
```

## MCP Automation Features

The system includes advanced automation:
- **Automated Testing**: Continuous validation
- **Performance Monitoring**: Real-time metrics
- **Security Scanning**: Vulnerability assessment
- **Deployment Validation**: Production readiness checks

Access automation tools:
```bash
npm run automate:all        # Full automation suite
npm run mcp-health-check    # MCP server status
npm run automate:report     # Generate reports
```
