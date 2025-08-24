# Vercel Deployment Guide

## One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/dzp5103/Spotify-echo&project-name=echotune-ai&repository-name=Spotify-echo&demo-title=EchoTune%20AI&demo-description=AI-powered%20music%20discovery%20platform&env=MONGODB_URI,REDIS_URL,OPENAI_API_KEY,GOOGLE_AI_API_KEY,ANTHROPIC_API_KEY,PERPLEXITY_API_KEY,SPOTIFY_CLIENT_ID,SPOTIFY_CLIENT_SECRET,JWT_SECRET,SESSION_SECRET,AGENTOPS_API_KEY,ENCRYPTION_KEY,ALLOWED_ORIGINS,FRONTEND_URL,DOMAIN,BROWSERBASE_API_KEY,BROWSERBASE_PROJECT_ID)

## Architecture
- **Static Frontend**: Vite build output served from `dist/` directory
- **API Endpoints**: Serverless functions under `/api/*` route
- **Database**: MongoDB Atlas (recommended) or self-hosted MongoDB
- **Caching**: Redis (recommended for production performance)
- **Optional Services**: Various AI providers, browser automation, analytics

## Environment Configuration

### Required Variables
These variables **must** be configured for the application to start:

```bash
# Core Security (REQUIRED)
JWT_SECRET=your_long_random_jwt_secret_here_min_32_chars
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/echotune

# Spotify API (REQUIRED)
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
```

### Recommended Production Variables
For optimal production performance:

```bash
# Caching & Performance
REDIS_URL=redis://your-redis-instance:6379

# Security & CORS
SESSION_SECRET=your_session_secret_here
ALLOWED_ORIGINS=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com

# SSL & Compression
SSL_ENABLED=true
COMPRESSION=true
```

### Optional AI Provider Variables
Configure one or more AI providers for enhanced features:

```bash
# OpenAI
OPENAI_API_KEY=sk-your_openai_api_key_here

# Google AI / Gemini
GEMINI_API_KEY=your_gemini_api_key_here

# Anthropic Claude
ANTHROPIC_API_KEY=sk-your_anthropic_api_key_here

# Perplexity AI
PERPLEXITY_API_KEY=pplx-your_perplexity_api_key_here

# OpenRouter (Multiple AI Models)
OPENROUTER_API_KEY=sk-your_openrouter_api_key_here
```

## Deployment Steps

### 1. Using Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (from project root)
vercel

# Set environment variables
vercel env add MONGODB_URI
vercel env add SPOTIFY_CLIENT_ID
vercel env add SPOTIFY_CLIENT_SECRET
vercel env add JWT_SECRET
# ... add other required variables
```

### 2. Using Vercel Dashboard
1. Connect your GitHub repository to Vercel
2. Configure environment variables in the dashboard
3. Deploy automatically on git push

### 3. Using One-Click Deploy Button
1. Click the "Deploy with Vercel" button above
2. Configure the required environment variables
3. Deploy with default settings

## Environment Variable Validation

The application includes comprehensive environment validation that runs at startup:

```bash
# Test environment validation locally
npm run validate:env
```

**Validation Behavior:**
- **Production**: Hard fail on missing required variables
- **Development**: Warning logs, process continues
- **Categories**: Variables are grouped by function (Security, Database, AI Providers, etc.)

## API Endpoints

### Core Endpoints (Serverless Functions)
- `GET /api/health` - Application health check
- `GET /api/status` - System status and features
- `GET /api/metrics` - Performance metrics

### Legacy Endpoints (If using hybrid deployment)
- `GET /health` - Health check (legacy)
- `GET /ready` - Readiness probe
- `GET /alive` - Liveness probe

## Security Considerations

### Environment Variable Safety
- **No secrets in frontend bundle** - All sensitive variables stay server-side
- **VITE_ prefix required** - Only `VITE_*` variables are exposed to frontend (none currently used)
- **Validation layer** - Runtime validation prevents startup with invalid configuration

### CORS Configuration
```bash
# Configure allowed origins
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Content Security Policy
CSP headers are automatically applied based on validated configuration.

## WebSocket Considerations

⚠️ **Important**: Vercel serverless functions don't support persistent WebSocket connections.

**Options for WebSocket features:**
1. **External Provider**: Use Ably, Pusher, or Socket.io with Redis adapter
2. **Separate Service**: Deploy WebSocket server on Railway, Render, or DigitalOcean
3. **Server-Sent Events**: Replace WebSockets with SSE for real-time updates
4. **Polling**: Use HTTP polling for less frequent updates

**Current Implementation**: The app gracefully degrades WebSocket features when deployed on Vercel.

## Performance Optimization

### Caching Strategy
- **Static Assets**: Automatically cached by Vercel CDN
- **API Responses**: Redis caching for database queries
- **Audio Features**: Long-term caching of Spotify API data

### Build Optimization
- **Bundle Splitting**: Automatic code splitting by Vite
- **Compression**: Gzip and Brotli compression enabled
- **Tree Shaking**: Dead code elimination
- **Minification**: Production builds are minified

## Monitoring & Observability

### Built-in Monitoring
```bash
# Optional analytics integration
AGENTOPS_API_KEY=your_agentops_api_key_here
SENTRY_DSN=your_sentry_dsn_here
```

### Health Checks
- **Application**: `/api/health` - Basic health status
- **System**: `/api/status` - Detailed system information
- **Performance**: `/api/metrics` - Runtime metrics

## Troubleshooting

### Common Issues

**Build Failures:**
```bash
# Locally test the build process
npm run build
npm run preview
```

**Environment Variable Issues:**
```bash
# Validate environment configuration
npm run validate:env

# Check specific variable
echo $MONGODB_URI
```

**API Connection Problems:**
- Verify MongoDB URI format and network access
- Check Spotify client credentials
- Ensure CORS origins include your domain

### Debug Information
```bash
# Enable debug logging
DEBUG=true
LOG_LEVEL=debug
```

## Migration Path

### From Monolithic Server
1. **Phase 1**: Deploy static frontend + API functions alongside existing server
2. **Phase 2**: Gradually migrate endpoints to serverless functions
3. **Phase 3**: Deprecate monolithic server for stateless endpoints

### Database Migration
- **MongoDB Atlas**: Recommended for serverless deployment
- **Connection Pooling**: Handled automatically by Vercel
- **Fallback Options**: SQLite for development, PostgreSQL alternative

## Cost Optimization

### Vercel Limits
- **Free Tier**: 100GB bandwidth, 6000 build minutes
- **Pro Tier**: Recommended for production applications
- **Enterprise**: For high-traffic applications

### Resource Management
- **Function Memory**: Configured to 512MB (adjustable)
- **Execution Time**: 30-second limit for serverless functions
- **Cold Start**: Optimized for minimal startup time

## Support

For deployment issues:
1. Check [Vercel Documentation](https://vercel.com/docs)
2. Review application logs in Vercel dashboard
3. Test locally with `vercel dev`
4. Open issue in the [GitHub repository](https://github.com/dzp5103/Spotify-echo/issues)