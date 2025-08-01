
# 🎵 EchoTune AI - Spotify Music Recommendation System

## Table of Contents
- [Project Vision](#project-vision)
- [For GitHub Coding Agents](#-for-github-coding-agents)
- [Core Features](#-core-features)
- [System Architecture](#️-system-architecture)
- [Quick Start for Developers](#-quick-start-for-developers)
- [Automated Development Workflow](#-automated-development-workflow)
- [Production Deployment](#-production-deployment)
- [Development Roadmap](#-development-roadmap)
- [Security & Privacy](#-security--privacy)
- [Additional Resources](#-additional-resources)

## Project Vision
EchoTune AI is a next-generation music recommendation system designed to deliver a deeply personalized and interactive music discovery experience. By leveraging the Spotify API, advanced machine learning, and a conversational AI interface, EchoTune acts as a personal music sommelier, understanding nuanced user preferences to curate the perfect soundtrack for any moment. Our goal is to move beyond simple "you might also like" recommendations and create a dynamic, conversational partnership between the user and their music library.

## 🤖 For GitHub Coding Agents
This project is fully optimized for automated development workflows with comprehensive tooling and documentation. See [CODING_AGENT_GUIDE.md](./CODING_AGENT_GUIDE.md) for detailed instructions on:
- **Automated Testing & CI/CD**: Multi-platform testing with GitHub Actions
- **MCP Server Integration**: Browser automation and Spotify API workflows  
- **Database Optimization**: MongoDB, Supabase, and PostgreSQL management
- **ML Pipeline Automation**: Model training, evaluation, and deployment
- **Code Generation Patterns**: Templates and best practices for rapid development
- **Production Deployment**: Automated DigitalOcean setup and security hardening
- **Data Processing Workflows**: CSV processing, feature extraction, and analytics

## ✨ Core Features

### 🎵 Advanced Music Intelligence
 * **Deep History Analysis**: Processes complete Spotify listening history from CSV exports, analyzing every track played, skipped, or saved to build comprehensive taste profiles
 * **Dynamic Preference Modeling**: Self-improving ML models using collaborative filtering, content-based analysis, and deep learning to understand nuanced musical preferences
 * **Audio Feature Intelligence**: Advanced analysis of danceability, energy, valence, acousticness, and 10+ audio characteristics using Spotify's API and librosa
 * **Context-Aware Recommendations**: Generates suggestions based on mood, activity, time of day, weather, and listening context

### 🤖 AI-Powered Interaction
 * **Conversational Interface**: Natural language processing with support for OpenAI GPT and Google Gemini models
 * **Intent Recognition**: Understands complex requests like "Find upbeat indie folk for a rainy afternoon coding session"
 * **Multi-Modal Responses**: Text, audio previews, and interactive playlist interfaces
 * **Learning Feedback Loop**: Continuously improves based on user interactions and explicit feedback

### 🔧 Automation & Integration
 * **MCP Server Integration**: Browser automation for Spotify Web Player using Puppeteer
 * **Automated Playlist Creation**: Instantly generates and saves playlists directly to Spotify accounts
 * **Real-time Data Sync**: Continuous integration with Spotify API for live listening data
 * **Cross-Platform Automation**: Seamless operation across web interfaces and mobile platforms

### 📊 Analytics & Insights
 * **Listening Habit Visualization**: Interactive charts of listening patterns, genre preferences, and discovery trends
 * **Temporal Analysis**: Insights into music preferences by time of day, day of week, and seasonal patterns
 * **Mood Mapping**: Correlation between audio features and listening contexts
 * **Discovery Analytics**: Track how musical taste evolves and identifies emerging preferences

### 🏗️ Production-Ready Infrastructure
 * **Multi-Database Support**: MongoDB for analytics, Supabase for real-time features, PostgreSQL for structured data
 * **Docker Containerization**: Full production deployment with docker-compose
 * **Security Hardening**: Rate limiting, DDoS protection, SSL/TLS encryption, and secure authentication
 * **Scalable Architecture**: Designed for horizontal scaling and high availability
 * **Health Monitoring**: Automated health checks, logging, and error recovery systems

## 🛠️ System Architecture

### Core Components
 * **Data Ingestion & Processing**
   * **Bulk History Parser**: Memory-efficient parser for large-scale CSV files (Spotify's extended streaming history) processing entire user historical data with fine-grained interactions
   * **Spotify API Sync**: Real-time connection to Spotify API for ongoing user data, listening history, saved tracks, and playlists
   * **Feature Enrichment**: Extracts audio features for every unique track using Spotify's analysis endpoints
   * **Data Pipeline**: Automated scripts for CSV merging, data cleaning, normalization, and database optimization

 * **Machine Learning Core**
   * **Preference Model**: Hybrid recommendation system using collaborative filtering, content-based filtering, and deep learning approaches
   * **Dynamic Learning**: Continuously adapts to user preferences with new listening data and explicit feedback
   * **Audio Feature Analysis**: Advanced analysis using librosa and Spotify's audio features API
   * **ML Pipeline**: Automated model training, evaluation, and deployment workflows

 * **MCP (Model Context Protocol) Server**
   * **Browser Automation**: Puppeteer-based automation for Spotify Web Player interactions
   * **API Automation**: Automated playlist creation, track management, and user preference collection
   * **Cross-Platform Integration**: Seamless integration between web interfaces and backend services
   * **Real-time Data Collection**: Live monitoring of user interactions and listening patterns

 * **Multi-Database Architecture**
   * **MongoDB**: Primary database for analytics, ML datasets, and listening history storage
   * **Supabase (PostgreSQL)**: Application database for user management, real-time features, and structured data
   * **Vector Support**: Optimized for ML model outputs and similarity searches
   * **Data Migration Tools**: Automated scripts for database setup, migration, and optimization

 * **Production Infrastructure**
   * **Docker Containerization**: Full containerized deployment with docker-compose
   * **DigitalOcean Integration**: Automated deployment scripts and infrastructure setup
   * **Nginx Reverse Proxy**: SSL termination, load balancing, and security headers
   * **Security Hardening**: Rate limiting, DDoS protection, and security monitoring
   * **Health Monitoring**: Automated health checks, logging, and error recovery

 * **Conversational AI Layer**
   * **LLM Integration**: Support for OpenAI GPT and Google Gemini models
   * **Natural Language Processing**: Advanced intent recognition and entity extraction
   * **Context-Aware Responses**: Mood, activity, and temporal context understanding
   * **Multi-modal Interface**: Web chat, API endpoints, and future voice integration
## 🚀 Quick Start for Developers

### Prerequisites
- Python 3.8+
- Node.js 16+
- Spotify Developer Account
- MongoDB or Supabase account (optional, for production features)
- Docker (optional, for containerized development)

### Development Setup
```bash
# Clone repository
git clone https://github.com/dzp5103/Spotify-echo.git
cd Spotify-echo

# Install Python dependencies
pip install -r requirements.txt

# Install Node.js dependencies
npm install

# Install MCP server dependencies (optional)
cd mcp-server && npm install && cd ..

# Configure environment
cp .env.example .env
# Edit .env with your credentials (see Environment Configuration below)

# Initialize database (choose one or multiple)
python scripts/database_setup.py          # Basic SQLite setup
python scripts/migrate_to_mongodb.py      # MongoDB setup
python scripts/migrate_to_supabase.py     # Supabase setup

# Process your Spotify data (optional)
python scripts/merge_csv_data.py          # Merge CSV files
python scripts/populate_audio_features.py # Enrich with audio features

# Start development services
npm start                      # Main application on http://localhost:3000

# Optional: Start MCP automation server (separate terminal)
npm run mcp-server            # MCP automation server on http://localhost:3001
```

### Docker Development (Alternative)
```bash
# Quick start with Docker
docker-compose up --build

# The application will be available at http://localhost:3000
# MCP server runs on http://localhost:3001
```

### Environment Configuration
Copy `.env.example` to `.env` and configure:

```env
# Spotify API (Required for full functionality)
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/auth/callback

# LLM Provider Configuration (Optional - Mock provider used if none configured)
# OPENAI_API_KEY=your_openai_api_key_here
# GEMINI_API_KEY=your_gemini_api_key_here
# AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
# AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
# OPENROUTER_API_KEY=your_openrouter_api_key_here

# Default LLM Provider (mock, openai, gemini, azure, openrouter)
DEFAULT_LLM_PROVIDER=mock
DEFAULT_LLM_MODEL=mock-music-assistant

# Database Options (Choose one or more)
# MongoDB (Recommended for ML/Analytics)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DATABASE=spotify_analytics

# Supabase (Recommended for real-time features)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=postgresql://username:password@db.your-project.supabase.co:5432/postgres

# Application Settings
NODE_ENV=development
PORT=3000
LOG_LEVEL=INFO
DEBUG=true
```

### Demo Mode
EchoTune AI includes a **demo mode** that works without any API keys:
- **Mock LLM Provider**: Provides realistic music assistant responses
- **Sample Analytics Dashboard**: Shows example music data and insights
- **Full UI Experience**: Test all features without external API dependencies

To enable demo mode:
1. Don't configure any LLM API keys
2. Set `DEFAULT_LLM_PROVIDER=mock` in your `.env` file
3. Start the application - the mock provider will automatically activate

### LLM Provider Configuration
EchoTune AI supports multiple LLM providers with automatic fallback:

#### Supported Providers
- **OpenAI** (GPT-3.5, GPT-4, GPT-4o)
- **Google Gemini** (Gemini Pro)
- **Azure OpenAI** (GPT models via Azure)
- **OpenRouter** (Access to multiple models)
- **Mock Provider** (Demo mode - no API key required)

#### Provider Priority
1. If API keys are configured, real providers are used
2. If no API keys are found, mock provider activates automatically
3. Users can switch between providers in the chat interface
4. Graceful fallback ensures the application always works

## 🤖 Automated Development Workflow

This project includes comprehensive automation for development and deployment:

### Development Tools
- **GitHub Actions** for CI/CD automation with multi-platform testing
- **MCP Server** for browser automation and Spotify API testing  
- **Automated Testing** with pytest (Python) and jest (Node.js)
- **Code Quality** checks with ESLint, Black, MyPy, and Prettier
- **Database Tools** for migration, optimization, and CSV processing

### Available Scripts
```bash
# Development
npm run dev                    # Start development server
npm run mcp-server            # Start MCP automation server
npm run test                  # Run all tests
npm run lint                  # Check code quality
npm run format                # Format code

# Data Processing
npm run merge-csv             # Merge CSV data files
npm run setup-db              # Initialize database
npm run populate-audio        # Fetch audio features
npm run analyze-data          # Generate listening analytics
npm run train-model           # Train ML recommendation model

# Production
npm run build                 # Build for production
npm run deploy                # Deploy to DigitalOcean
npm run setup-digitalocean    # Initial server setup
```

### MCP Server Features
The Model Context Protocol server provides:
- **Browser Automation**: Automated Spotify Web Player interactions
- **API Testing**: Comprehensive Spotify API workflow testing
- **Data Collection**: Real-time listening data gathering
- **Playlist Management**: Automated playlist creation and curation
- **Cross-platform Testing**: Ensures compatibility across different environments

### GitHub Actions Workflow
Automated workflows include:
- Code quality checks and linting on pull requests
- Multi-version testing (Python 3.8-3.11, Node.js 16-20)
- Database optimization and CSV processing validation
- MCP server deployment and integration testing
- Security scanning and dependency updates

## 🚀 Production Deployment

### Quick Deploy to DigitalOcean

#### Prerequisites
- Ubuntu 22.04 droplet
- Domain name (optional, but recommended)
- Spotify API credentials
- LLM API keys (optional, demo mode works without them)

#### Automated Setup
```bash
# 1. Create Ubuntu 22.04 droplet on DigitalOcean
ssh root@YOUR_DROPLET_IP

# 2. Download and run automated setup script
curl -fsSL https://raw.githubusercontent.com/dzp5103/Spotify-echo/main/scripts/setup-digitalocean.sh | bash

# 3. Configure environment
cd /opt/echotune
cp .env.production.example .env
nano .env  # Add your credentials

# Required configuration:
# SPOTIFY_CLIENT_ID=your_spotify_client_id
# SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
# SPOTIFY_REDIRECT_URI=https://yourdomain.com/auth/callback
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/

# Optional LLM providers (demo mode works without them):
# OPENAI_API_KEY=your_openai_api_key
# GEMINI_API_KEY=your_gemini_api_key

# 4. Setup SSL certificates (if using domain)
sudo certbot --nginx -d yourdomain.com

# 5. Deploy application
./scripts/deploy.sh

# 6. Optional: Harden security
./scripts/security-hardening.sh
```

#### Manual Setup
```bash
# Install Node.js and Python
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs python3 python3-pip mongodb nginx

# Clone and setup application
git clone https://github.com/dzp5103/Spotify-echo.git
cd Spotify-echo
npm install
pip3 install -r requirements.txt

# Configure environment
cp .env.production.example .env
# Edit .env with your configuration

# Setup systemd service
sudo cp echotune.service /etc/systemd/system/
sudo systemctl enable echotune
sudo systemctl start echotune

# Configure Nginx
sudo cp nginx.conf /etc/nginx/sites-available/echotune
sudo ln -s /etc/nginx/sites-available/echotune /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### Docker Production Deployment
```bash
# Build and deploy with Docker
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Monitor logs
docker-compose logs -f

# Scale services
docker-compose up --scale web=3 --scale worker=2
```

### Production Features
- **SSL/TLS Encryption** with automatic certificate renewal via Let's Encrypt
- **Nginx Reverse Proxy** with load balancing and caching
- **Rate Limiting** and DDoS protection
- **Database Optimization** for high-throughput analytics
- **Health Monitoring** with automated recovery
- **Backup Systems** for data protection
- **Security Hardening** following industry best practices
- **Demo Mode Support** - works without LLM API keys for quick deployment

### Production Environment Variables
```env
# Production Configuration
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://yourdomain.com

# Spotify API (Required)
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=https://yourdomain.com/auth/callback

# Database (Required)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DATABASE=spotify_analytics

# LLM Providers (Optional - demo mode if not configured)
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key
DEFAULT_LLM_PROVIDER=openai

# Security
LOG_LEVEL=WARN
DEBUG=false
```

### Health Check
Once deployed, verify your deployment:
```bash
# Check application health
curl -f https://yourdomain.com/health

# Expected response:
{
  "status": "healthy",
  "version": "2.0.0",
  "spotify_configured": true,
  "database": {"status": "healthy"},
  "features": {
    "ai_chat": true,
    "recommendations": true,
    "audio_features": true,
    "mongodb": true
  }
}
```

### Comprehensive Documentation
For detailed setup and configuration, see:
- [Production README](./PRODUCTION_README.md) - Complete production deployment guide
- [DigitalOcean Deployment](./DIGITALOCEAN_DEPLOYMENT.md) - Platform-specific instructions
- [Database Architecture](./DATABASE_ARCHITECTURE_GUIDE.md) - Database design and optimization
- [Coding Agent Guide](./CODING_AGENT_GUIDE.md) - Automated development workflows
- [MongoDB Setup](./MONGODB_SETUP.md) - MongoDB configuration and optimization
- [Data Management](./DATA_MANAGEMENT.md) - Data processing and analytics workflows

## 🤖 Development Roadmap

### ✅ Completed Features

#### Phase 1: Core Backend & Data Foundation ✅
 * [x] **Bulk History Ingestion**
   * [x] CSV parser for extended Spotify history files (`merge_csv_data.py`)
   * [x] High-performance data processing and database loading
   * [x] Audio feature enrichment service (`populate_audio_features.py`)
 * [x] **Spotify API Integration**
   * [x] OAuth 2.0 authentication implementation
   * [x] Real-time listening history sync
   * [x] Comprehensive API testing suite
 * [x] **Machine Learning Foundation**
   * [x] Feature engineering pipeline
   * [x] Baseline recommendation models
   * [x] Model training and evaluation scripts (`train_recommendation_model.py`)

#### Phase 2: Production Infrastructure ✅
 * [x] **Multi-Database Architecture**
   * [x] MongoDB integration for analytics (`migrate_to_mongodb.py`)
   * [x] Supabase/PostgreSQL support (`migrate_to_supabase.py`)
   * [x] Database migration and optimization tools
 * [x] **MCP Server Implementation**
   * [x] Browser automation with Puppeteer
   * [x] Spotify Web Player integration
   * [x] Automated playlist creation and management
 * [x] **Production Deployment**
   * [x] Docker containerization
   * [x] DigitalOcean deployment automation
   * [x] Nginx configuration and SSL setup
   * [x] Security hardening scripts

#### Phase 3: Advanced Features ✅
 * [x] **Data Analytics**
   * [x] Listening pattern analysis (`analyze_listening_data.py`)
   * [x] Advanced data visualization tools
   * [x] ML dataset preparation (`prepare_ml_datasets.py`)
 * [x] **Development Automation**
   * [x] GitHub Actions CI/CD pipeline
   * [x] Automated testing frameworks
   * [x] Code quality and formatting tools

### 🚧 Current Development (Phase 4)

#### Enhanced AI & ML Capabilities
 * [ ] **Advanced Recommendation Models**
   * [ ] Deep learning-based collaborative filtering
   * [ ] Neural matrix factorization implementation
   * [ ] Transformer-based sequence modeling for listening patterns
   * [ ] Multi-task learning for preference prediction
 * [ ] **Real-time Learning System**
   * [ ] Online learning algorithms for immediate preference adaptation
   * [ ] A/B testing framework for recommendation strategies
   * [ ] Reinforcement learning for long-term user engagement
 * [ ] **Advanced Audio Analysis**
   * [ ] Custom audio feature extraction using librosa
   * [ ] Genre classification with neural networks
   * [ ] Mood detection from audio signals

#### User Experience Enhancements
 * [ ] **Conversational AI Improvements**
   * [ ] Multi-turn conversation context management
   * [ ] Voice interface integration
   * [ ] Personality-based recommendation explanations
   * [ ] Multilingual support for global users
 * [ ] **Advanced Analytics Dashboard**
   * [ ] Real-time listening analytics
   * [ ] Personalized music discovery insights
   * [ ] Social listening pattern comparisons
   * [ ] Predictive listening behavior modeling

### 🔮 Future Roadmap (Phase 5+)

#### Platform Expansion
 * [ ] **Mobile Applications**
   * [ ] React Native mobile app development
   * [ ] Offline listening analysis capabilities
   * [ ] Mobile-specific UI/UX optimizations
   * [ ] Push notifications for new recommendations
 * [ ] **Multi-Platform Integration**
   * [ ] Apple Music API integration
   * [ ] YouTube Music compatibility
   * [ ] Last.fm scrobbling support
   * [ ] Social media sharing features

#### Social & Community Features
 * [ ] **Collaborative Recommendations**
   * [ ] Friend-based music discovery
   * [ ] Collaborative playlist creation
   * [ ] Music taste similarity analysis
   * [ ] Social recommendation sharing
 * [ ] **Community Features**
   * [ ] Public playlist sharing and discovery
   * [ ] Music taste communities and groups
   * [ ] Crowdsourced music tagging and reviews
   * [ ] Live listening party features

#### Advanced Infrastructure
 * [ ] **Performance & Scalability**
   * [ ] Redis caching for recommendation serving
   * [ ] GraphQL API implementation
   * [ ] Microservices architecture migration
   * [ ] CDN integration for global performance
 * [ ] **Enterprise Features**
   * [ ] Multi-tenant architecture
   * [ ] Advanced analytics for music businesses
   * [ ] API rate limiting and monetization
   * [ ] GDPR compliance and data privacy tools

#### Emerging Technologies
 * [ ] **AI/ML Innovation**
   * [ ] Large Language Model fine-tuning for music
   * [ ] Computer vision for album art analysis
   * [ ] Federated learning for privacy-preserving recommendations
   * [ ] Quantum computing experiments for optimization
 * [ ] **Next-Gen Interfaces**
   * [ ] AR/VR music discovery experiences
   * [ ] IoT device integration (smart speakers, cars)
   * [ ] Brain-computer interface experimentation
   * [ ] Gesture-based music control

## 🔒 Security & Privacy

### Security Features
- **OAuth 2.0 Authentication**: Secure Spotify API integration with proper token management
- **Rate Limiting**: Configurable request throttling to prevent abuse
- **SSL/TLS Encryption**: End-to-end encryption for all communications
- **Security Headers**: Comprehensive security headers (HSTS, CSP, etc.)
- **Input Validation**: Robust validation for all user inputs and API requests
- **Environment Isolation**: Secure environment variable management

### Privacy Considerations
- **Data Minimization**: Only collect necessary listening data
- **User Consent**: Clear consent mechanisms for data collection and processing
- **Data Retention**: Configurable data retention policies
- **GDPR Compliance**: Built-in support for data protection regulations
- **Local Processing**: ML models can run locally to minimize data sharing
- **Anonymization**: Options for anonymous usage analytics

### Production Security Checklist
- [ ] Enable SSL certificates with automated renewal
- [ ] Configure firewall rules and fail2ban
- [ ] Set up monitoring and intrusion detection
- [ ] Regular security updates and vulnerability scanning
- [ ] Backup encryption and secure storage
- [ ] Access logging and audit trails

For detailed security configuration, see [Security Hardening Guide](./scripts/security-hardening.sh).

## 🔗 Additional Resources

### Comprehensive Documentation
- **[Production Deployment Guide](./PRODUCTION_README.md)** - Complete production setup
- **[Coding Agent Guide](./CODING_AGENT_GUIDE.md)** - Automated development workflows  
- **[Database Architecture](./DATABASE_ARCHITECTURE_GUIDE.md)** - Database design and optimization
- **[DigitalOcean Deployment](./DIGITALOCEAN_DEPLOYMENT.md)** - Cloud deployment guide
- **[MongoDB Setup](./MONGODB_SETUP.md)** - MongoDB configuration
- **[Data Management](./DATA_MANAGEMENT.md)** - Data processing workflows
- **[Docker Build Notes](./DOCKER_BUILD_NOTES.md)** - Container configuration

### Development Resources
- **GitHub Repository**: [dzp5103/Spotify-echo](https://github.com/dzp5103/Spotify-echo)
- **Issues & Feature Requests**: [GitHub Issues](https://github.com/dzp5103/Spotify-echo/issues)
- **Spotify API Documentation**: [Spotify for Developers](https://developer.spotify.com/)
- **MCP Protocol**: [Model Context Protocol](https://modelcontextprotocol.io/)

### Community & Support
- **Contributing**: See [CODING_AGENT_GUIDE.md](./CODING_AGENT_GUIDE.md) for development guidelines
- **Bug Reports**: Use GitHub Issues with detailed reproduction steps
- **Feature Requests**: Submit enhancement requests via GitHub Issues
- **Security Issues**: Contact maintainers directly for security vulnerabilities

---

**EchoTune AI** - Transforming music discovery through AI-powered personalization and automation.
