# 🎵 EchoTune AI - Advanced Music Discovery Platform

**EchoTune AI** is a sophisticated music recommendation system that integrates with Spotify to provide AI-powered, personalized music discovery through conversational interfaces, advanced analytics, and intelligent automation.

## 🌟 Key Features

### 🎧 LLM-Powered Music Discovery
- **Multiple AI Providers**: OpenAI GPT, Google Gemini, Anthropic Claude, Perplexity, XAI Grok
- **Conversational Search**: Natural language music queries with context understanding
- **Smart Recommendations**: Collaborative filtering combined with content-based analysis
- **Real-time Personalization**: Adaptive suggestions based on listening history and preferences

### 🚀 Vertex AI Integration (Phase 2)
- **Google Cloud Integration**: Seamless Vertex AI deployment and orchestration
- **Cost Management**: Built-in budget tracking with $250 monthly ceiling
- **Performance Monitoring**: Real-time metrics with Prometheus integration
- **Evaluation Harness**: Comprehensive benchmarking and A/B testing framework

### 🤖 Agent Orchestration & Automation
- **MCP Ecosystem**: 7+ integrated Model Context Protocol servers
- **Browser Automation**: Browserbase cloud automation + local Puppeteer
- **Workflow Management**: GitHub Copilot Coding Agent with research-driven development
- **Performance Analytics**: Advanced telemetry and optimization recommendations

### 📊 Metrics & Observability
- **Prometheus Metrics**: Comprehensive application and AI cost metrics at `/metrics`
- **Health Monitoring**: Kubernetes-ready health endpoints at `/healthz` and `/health`
- **OpenTelemetry**: Distributed tracing and performance insights
- **Budget Guardrails**: Real-time cost tracking with alert thresholds

### 🔒 Security & Compliance
- **Production Security**: Helmet, rate limiting, input sanitization
- **OAuth Integration**: Secure Spotify authentication with JWT tokens
- **Credential Management**: Environment-based secrets with validation
- **PII Protection**: Data anonymization and secure handling practices

## 🏗️ High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │  Spotify API    │
│   React App     │◄───┤   Express.js    │◄───┤   Integration   │
│   Material UI   │    │   + Security    │    │   OAuth 2.0     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Chat Interface │    │  AI Providers   │    │  Data Storage   │
│  Conversational │    │  OpenAI, Gemini │    │  MongoDB Atlas  │
│  Music Search   │    │  Claude, Grok   │    │  Redis Cache    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Recommendation  │    │ Budget Tracker  │    │   Monitoring    │
│    Engine       │    │ Cost Management │    │  Prometheus     │
│  ML Analytics   │    │ Alert System    │    │  OpenTelemetry  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js 20+ with Express.js framework
- **Database**: MongoDB (primary), SQLite (fallback), Redis (caching)
- **AI/ML**: OpenAI SDK, Google Generative AI, custom recommendation models
- **Security**: Helmet, CORS, rate limiting, JWT authentication
- **Observability**: Prometheus metrics, Pino logging, OpenTelemetry tracing

### Frontend
- **Framework**: React 19+ with Material-UI components
- **State Management**: React Hooks with context providers
- **Real-time**: Socket.IO for live updates and notifications
- **Build System**: Vite with optimized production builds

### Infrastructure & Deployment
- **Cloud Platform**: Google Cloud Platform with Vertex AI
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Kubernetes deployment configs
- **CI/CD**: GitHub Actions with automated testing and deployment

### AI & Automation
- **Model Context Protocol**: 7+ integrated MCP servers
- **Browser Automation**: Browserbase (cloud) + Puppeteer (local)
- **Code Analysis**: Sequential thinking, enhanced file utilities
- **Research Integration**: Perplexity API with cost optimization

## 🚀 Getting Started

### Prerequisites

```bash
# Required software
Node.js 20+               # JavaScript runtime
npm 10+                   # Package manager  
Git                       # Version control
MongoDB 4.4+             # Database (or MongoDB Atlas)
Redis 6+                 # Caching (optional but recommended)

# Required accounts
Spotify Developer Account # For music API access
MongoDB Atlas Account    # For database hosting (recommended)
OpenAI API Account       # For AI-powered features
```

### Installation

1. **Clone and Setup**
   ```bash
   git clone https://github.com/primoscope/Spotify-echo.git
   cd Spotify-echo
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

3. **Database Setup**
   ```bash
   # Start local MongoDB (if using local instance)
   mongod
   
   # Or configure MongoDB Atlas connection in .env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/echotune
   ```

4. **Start Development Server**
   ```bash
   npm start
   # Application runs on http://localhost:3000
   ```

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| **Core Application** | | | |
| `NODE_ENV` | Environment mode | `development` | No |
| `PORT` | Server port | `3000` | No |
| `JWT_SECRET` | JWT signing secret | - | Yes |
| `MONGODB_URI` | MongoDB connection string | - | Yes |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` | No |
| **Spotify Integration** | | | |
| `SPOTIFY_CLIENT_ID` | Spotify app client ID | - | Yes |
| `SPOTIFY_CLIENT_SECRET` | Spotify app secret | - | Yes |
| `SPOTIFY_REDIRECT_URI` | OAuth callback URL | `http://localhost:3000/auth/callback` | Yes |
| **AI Providers** | | | |
| `OPENAI_API_KEY` | OpenAI API key | - | No |
| `GEMINI_API_KEY` | Google Gemini API key | - | No |
| `ANTHROPIC_API_KEY` | Claude API key | - | No |
| `PERPLEXITY_API_KEY` | Perplexity API key | - | No |
| `XAI_API_KEY` | Grok API key | - | No |
| **AI Cost Management** | | | |
| `AI_MONTHLY_BUDGET_USD` | Monthly AI spend limit | `250` | No |
| `AI_BUDGET_ALERT_THRESHOLD` | Alert threshold (0.0-1.0) | `0.8` | No |
| `AI_BUDGET_HARD_STOP` | Enable hard budget stop | `false` | No |
| `ALLOW_BUDGET_OVERRIDE` | Allow budget override | `0` | No |
| **Metrics & Monitoring** | | | |
| `METRICS_AUTH_TOKEN` | Metrics endpoint auth token | - | No |
| `LOG_LEVEL` | Logging level | `info` | No |
| **Vertex AI (Production)** | | | |
| `GCP_PROJECT_ID` | Google Cloud project ID | - | No |
| `GCP_VERTEX_BUCKET` | Vertex AI storage bucket | - | No |
| `WORKLOAD_IDENTITY_PROVIDER` | Workload identity provider | - | No |

## 🏃‍♂️ Running the Application

### Development Mode
```bash
# Start with hot reloading
npm run dev

# Start MCP servers
npm run mcp-server

# Run tests
npm test
```

### Production Mode
```bash
# Build and start production server
npm run build
npm start

# With environment-specific configuration
NODE_ENV=production npm start
```

### Docker Deployment
```bash
# Build and run with Docker
docker build -t echotune-ai .
docker run -p 3000:3000 --env-file .env echotune-ai
```

### Docker Compose (Full Stack)
```bash
# Start all services (app, MongoDB, Redis)
docker-compose up -d

# View logs
docker-compose logs -f
```

## ☁️ Vertex AI Deployment Flow

### 1. Initial Setup
```bash
# Install Google Cloud CLI
curl https://sdk.cloud.google.com | bash
gcloud init

# Set up project and authentication
gcloud config set project YOUR_PROJECT_ID
gcloud auth application-default login
```

### 2. Vertex AI Configuration
```bash
# Enable required APIs
gcloud services enable aiplatform.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable container.googleapis.com

# Create Vertex AI bucket
gsutil mb gs://YOUR_PROJECT_ID-vertex-ai

# Configure environment
export GCP_PROJECT_ID=YOUR_PROJECT_ID
export GCP_VERTEX_BUCKET=YOUR_PROJECT_ID-vertex-ai
```

### 3. Deploy to Google Cloud Run
```bash
# Build and deploy
gcloud run deploy echotune-ai \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,GCP_PROJECT_ID=$GCP_PROJECT_ID"
```

### 4. Workload Identity (Recommended)
```bash
# Create service account
gcloud iam service-accounts create echotune-ai-service

# Bind to Kubernetes service account
gcloud iam service-accounts add-iam-policy-binding \
  --role roles/iam.workloadIdentityUser \
  --member "serviceAccount:PROJECT_ID.svc.id.goog[NAMESPACE/SERVICE_ACCOUNT]" \
  echotune-ai-service@PROJECT_ID.iam.gserviceaccount.com
```

## 💰 Cost & Budgeting

### Budget Configuration
EchoTune AI includes comprehensive cost management for AI/LLM usage:

```bash
# Default monthly budget: $250 USD
AI_MONTHLY_BUDGET_USD=250

# Alert when 80% of budget is consumed
AI_BUDGET_ALERT_THRESHOLD=0.8

# Enable hard stop at budget limit
AI_BUDGET_HARD_STOP=true

# Emergency override capability
ALLOW_BUDGET_OVERRIDE=1
```

### Cost Tracking Features
- **Real-time Monitoring**: Track costs per model, provider, and time period
- **Budget Alerts**: Automatic notifications at configurable thresholds
- **Hard Stops**: Prevent overspend with enforceable budget limits
- **Detailed Reporting**: Cost breakdowns by provider, model, and usage patterns
- **Prometheus Metrics**: Integration with monitoring dashboards

### Typical Monthly Costs
| Usage Pattern | Estimated Cost | Description |
|---------------|----------------|-------------|
| **Light Usage** | $5-15/month | Basic chat, occasional recommendations |
| **Moderate Usage** | $25-75/month | Regular chat, daily recommendations |
| **Heavy Usage** | $100-200/month | Intensive chat, real-time analytics |
| **Enterprise** | $200-500/month | High-volume, multi-user deployments |

## 📊 Metrics & Monitoring

### Health Endpoints
```bash
# Basic health check (no authentication)
curl http://localhost:3000/healthz
# Returns: {"status":"ok","uptime_s":123,"commit":"abc123"}

# Detailed health check
curl http://localhost:3000/health
# Returns comprehensive system status

# Kubernetes readiness probe
curl http://localhost:3000/ready
```

### Metrics Endpoint
```bash
# Prometheus metrics (with optional authentication)
curl http://localhost:3000/metrics
curl -H "X-Metrics-Token: your-token" http://localhost:3000/metrics

# Returns Prometheus exposition format with:
# - HTTP request metrics
# - AI cost metrics  
# - System performance metrics
# - Custom application metrics
```

### Key Metrics
- `http_server_requests_total` - HTTP request count by method/route/status
- `http_server_request_duration_ms` - Request latency histograms
- `ai_cost_monthly_spent_usd` - AI costs by month and provider
- `ai_budget_utilization_percent` - Budget utilization percentage
- `ai_cost_budget_alert_total` - Budget alert events
- `cache_hits_total` / `cache_misses_total` - Cache performance

### OpenTelemetry Integration
```javascript
// Automatic instrumentation for:
// - HTTP requests and responses
// - Database queries (MongoDB, Redis)
// - External API calls (Spotify, AI providers)
// - Custom business logic spans
```

## 🧪 Evaluation & Benchmarking

### Recommendation Quality Metrics
- **Precision@K**: Accuracy of top-K recommendations
- **Recall@K**: Coverage of relevant items in top-K
- **Diversity Score**: Variety in recommended artists/genres
- **Novelty Score**: Introduction of new/undiscovered music
- **User Satisfaction**: Implicit feedback from interactions

### Performance Benchmarks
```bash
# Run performance tests
npm run test:performance

# Load testing with autocannon
npm run perf:bench

# MCP server performance
npm run mcp:test:automation
```

### A/B Testing Framework
```javascript
// Built-in experimentation platform
const experiment = new ABTest('recommendation_algorithm_v2', {
  variants: ['baseline', 'enhanced_ai'],
  trafficSplit: [0.5, 0.5],
  metrics: ['click_through_rate', 'session_duration']
});
```

## 🤖 Agent Orchestration

### GitHub Copilot Integration
EchoTune AI includes advanced integration with GitHub Copilot Coding Agent:

```bash
# Enhanced GPT-5 commands
/gpt5 analyze                    # Full system analysis
/review-gpt5                     # Comprehensive code review
/optimize-gpt5                   # Performance optimization

# MCP validation commands
/run-mcp-all                     # Comprehensive MCP validation
/mcp-health-check                # Quick health check
```

### MCP Server Ecosystem
- **Sequential Thinking**: Structured reasoning for complex problems
- **Browser Automation**: Cloud and local browser control
- **Enhanced File Utilities**: Secure file operations with validation
- **Package Management**: Automated dependency management with security
- **Analytics Server**: Performance monitoring and insights
- **Testing Automation**: Comprehensive test execution and reporting

### Research-Driven Development
- **Perplexity Integration**: Real-time research with cost optimization
- **Citation Requirements**: All research claims with proper sources
- **Performance Budgets**: Latency ≤1500ms, Cost ≤$0.50/session
- **Validation Gates**: Pre-merge validation with budget compliance

## 🔒 Security & Compliance

### Authentication & Authorization
```javascript
// JWT-based authentication with refresh tokens
// OAuth 2.0 integration with Spotify
// Role-based access control (planned)
// API key management with rotation
```

### Data Protection
- **PII Handling**: Automatic anonymization of sensitive user data
- **Encryption**: AES-256 encryption for sensitive data at rest
- **Secure Headers**: Comprehensive security headers via Helmet
- **Input Validation**: Zod-based schema validation for all inputs
- **Rate Limiting**: Redis-backed rate limiting with configurable rules

### Compliance Features
- **GDPR Ready**: Data deletion and export capabilities
- **Audit Logging**: Comprehensive audit trails for all operations
- **Security Scanning**: Automated vulnerability scanning in CI/CD
- **Dependency Monitoring**: Real-time monitoring of package vulnerabilities

### Workload Identity Federation (Roadmap)
```bash
# Planned: Eliminate service account keys
# Use Workload Identity for GCP authentication
# Automated credential rotation and management
```

## 🗺️ Roadmap

### Q1 2025 - Enhanced AI Features
- [ ] **Advanced Recommendation Models**: Deep learning-based collaborative filtering
- [ ] **Multi-modal Analysis**: Audio feature analysis combined with lyrical content
- [ ] **Real-time Personalization**: Dynamic adjustment based on current listening context
- [ ] **Cross-platform Integration**: Support for Apple Music, YouTube Music

### Q2 2025 - Enterprise Features
- [ ] **Multi-tenant Architecture**: Support for multiple organizations
- [ ] **Advanced Analytics Dashboard**: Comprehensive insights and reporting
- [ ] **API Rate Management**: Sophisticated rate limiting and quota management
- [ ] **White-label Solutions**: Customizable branding and deployment options

### Q3 2025 - AI Agent Enhancement
- [ ] **Autonomous Playlist Generation**: AI-driven playlist creation and management
- [ ] **Predictive Analytics**: Forecast listening trends and preferences
- [ ] **Social Integration**: Social music discovery and sharing features
- [ ] **Voice Interface**: Voice-controlled music interaction

### Q4 2025 - Platform Expansion
- [ ] **Mobile Applications**: Native iOS and Android apps
- [ ] **Smart Speaker Integration**: Alexa, Google Assistant, Siri support
- [ ] **IoT Integration**: Smart home and wearable device integration
- [ ] **Global Expansion**: Multi-language and multi-region support

## 🤝 Contributing

We welcome contributions from the community! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Quality Standards
- **Linting**: ESLint with Prettier formatting
- **Testing**: Jest for unit tests, Playwright for E2E tests
- **Documentation**: JSDoc comments for all public APIs
- **Security**: Comprehensive security review for all changes

### MCP Server Development
- Follow MCP protocol specifications
- Include comprehensive error handling
- Add performance monitoring and metrics
- Document all tools and capabilities

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [GitHub Wiki](https://github.com/primoscope/Spotify-echo/wiki)
- **Issues**: [GitHub Issues](https://github.com/primoscope/Spotify-echo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/primoscope/Spotify-echo/discussions)
- **Email**: support@primosphere.studio

---

<div align="center">

**Built with ❤️ by the EchoTune AI Team**

[🌐 Website](https://primosphere.studio) • [📧 Contact](mailto:support@primosphere.studio) • [🐦 Twitter](https://twitter.com/primosphere)

*Transforming music discovery through AI innovation*

</div>
