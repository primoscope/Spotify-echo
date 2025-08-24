# Environment Variables

This document lists all environment variables used by the EchoTune AI application.

## Core Application

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Application environment (development, production, test) |
| `PORT` | `3000` | Port number for the HTTP server |
| `FRONTEND_URL` | `http://localhost:3000` | Frontend URL for redirects and CORS |

## Database Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGODB_URI` | - | MongoDB connection string |
| `MONGODB_DATABASE` | `echotune_production` | MongoDB database name |
| `REDIS_URL` | - | Redis connection URL |
| `REDIS_PASSWORD` | - | Redis password |

## Spotify Integration

| Variable | Default | Description |
|----------|---------|-------------|
| `SPOTIFY_CLIENT_ID` | - | Spotify API client ID |
| `SPOTIFY_CLIENT_SECRET` | - | Spotify API client secret |
| `SPOTIFY_REDIRECT_URI` | Auto-generated | OAuth redirect URI |

## LLM Providers

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | - | OpenAI API key |
| `GEMINI_API_KEY` | - | Google Gemini API key |
| `XAI_API_KEY` | - | Grok-4 API key |
| `PERPLEXITY_API_KEY` | - | Perplexity API key |
| `OPENROUTER_API_KEY` | - | OpenRouter API key |
| `DEFAULT_LLM_PROVIDER` | Auto-detect | Default LLM provider to use |

## Security & Authentication

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | - | Secret key for JWT token signing (auth scaffold) |
| `SESSION_SECRET` | Auto-generated | Secret for session management |
| `ENABLE_CSP_REPORT_ONLY` | - | Set to "1" to enable CSP report-only headers |

## Phase 2 Features - Lifecycle Management

| Variable | Default | Description |
|----------|---------|-------------|
| `GRACEFUL_SHUTDOWN_TIMEOUT_MS` | `10000` | Timeout for graceful shutdown in milliseconds |

## Phase 2 Features - Performance & Caching

| Variable | Default | Description |
|----------|---------|-------------|
| `CACHE_MAX_ITEMS` | `500` | Maximum number of items in LRU cache |
| `CACHE_TTL_MS` | `60000` | Default cache TTL in milliseconds (1 minute) |

## Phase 2 Features - Observability

| Variable | Default | Description |
|----------|---------|-------------|
| `OTEL_EXPORTER_OTLP_ENDPOINT` | - | OpenTelemetry OTLP endpoint URL (optional) |
| `OTEL_SERVICE_NAME` | `echotune-api` | Service name for tracing |

## Phase 2 Features - Development & Testing

| Variable | Default | Description |
|----------|---------|-------------|
| `ENABLE_DEMO_ROUTES` | - | Set to "1" to enable demo routes at `/internal/demo/*` |

## Smoke Testing & Validation

The smoke validation script (`scripts/ci/smoke.sh`) uses the following variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `test` | Environment for smoke testing (set to 'test' by script) |
| `PORT` | `3000` | Server port for smoke testing |
| `ENABLE_DEMO_ROUTES` | `1` | Enables demo routes for comprehensive testing |

**Smoke Script Usage:**
```bash
# Run smoke validation locally
bash scripts/ci/smoke.sh

# Custom port and environment
NODE_ENV=development PORT=3001 bash scripts/ci/smoke.sh

# Required minimal environment for smoke testing
NODE_ENV=test ENABLE_DEMO_ROUTES=1 JWT_SECRET=test_secret bash scripts/ci/smoke.sh
```

The smoke script validates `/internal/health`, `/internal/ready`, and `/internal/metrics` endpoints and generates a `smoke_report.json` with detailed results.

## Rate Limiting

| Variable | Default | Description |
|----------|---------|-------------|
| `RATE_LIMIT_MAX` | `120` | Maximum requests per window for global rate limiting |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limiting window in milliseconds |

## Logging

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `info` | Logging level (debug, info, warn, error) |
| `LOG_FILE` | `logs/app.log` | Log file path |

## Performance Benchmarking

These are used by the performance benchmark script:

| Variable | Default | Description |
|----------|---------|-------------|
| `DURATION` | `10s` | Benchmark duration |
| `CONNECTIONS` | `25` | Number of concurrent connections |
| `URL` | `http://localhost:3000/internal/health` | Target endpoint for benchmarking |

## Development Environment Setup

For local development, create a `.env` file with:

```bash
# Required for basic functionality
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/echotune_dev
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Optional LLM providers (configure at least one)
OPENAI_API_KEY=sk-your-openai-key
GEMINI_API_KEY=your-gemini-key

# Optional security features
JWT_SECRET=your-jwt-secret-for-development
ENABLE_CSP_REPORT_ONLY=1

# Optional development features
ENABLE_DEMO_ROUTES=1
LOG_LEVEL=debug

# Optional performance tuning
CACHE_MAX_ITEMS=1000
CACHE_TTL_MS=300000

# Optional tracing
OTEL_SERVICE_NAME=echotune-dev
# OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
```

## Production Environment Setup

For production deployment:

```bash
# Required
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://user:pass@cluster/echotune
SPOTIFY_CLIENT_ID=your_production_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_production_spotify_client_secret
FRONTEND_URL=https://yourdomain.com

# Security (required in production)
JWT_SECRET=your-secure-random-jwt-secret
SESSION_SECRET=your-secure-session-secret

# Optional but recommended
REDIS_URL=redis://localhost:6379
ENABLE_CSP_REPORT_ONLY=1

# Performance optimization
CACHE_MAX_ITEMS=5000
CACHE_TTL_MS=600000
GRACEFUL_SHUTDOWN_TIMEOUT_MS=15000

# Observability
OTEL_SERVICE_NAME=echotune-production
OTEL_EXPORTER_OTLP_ENDPOINT=https://your-otlp-endpoint.com

# Logging
LOG_LEVEL=info
```

## Environment Variable Validation

The application validates required environment variables at startup. Missing critical variables will prevent the application from starting.

### Required Variables

- `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` (for Spotify integration)
- At least one LLM provider API key for chat functionality

### Optional Variables

All other variables have sensible defaults and are optional.

## Docker Environment

When running in Docker, environment variables can be set via:

1. `.env` file
2. `docker-compose.yml` environment section
3. Docker run `-e` flags
4. Kubernetes ConfigMaps/Secrets

## Security Considerations

- Never commit actual API keys or secrets to version control
- Use environment-specific `.env` files that are gitignored
- Rotate secrets regularly in production
- Use secure random values for `JWT_SECRET` and `SESSION_SECRET`
- Consider using secret management systems in production (AWS Secrets Manager, HashiCorp Vault, etc.)

## Troubleshooting

### Common Issues

1. **Application won't start**: Check required environment variables
2. **Database connection fails**: Verify `MONGODB_URI` format and credentials
3. **Authentication doesn't work**: Ensure `JWT_SECRET` is set
4. **Rate limiting too aggressive**: Adjust `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW_MS`
5. **Cache not working**: Check `CACHE_MAX_ITEMS` and `CACHE_TTL_MS` values

### Environment Variable Debugging

Enable debug logging to see environment variable usage:

```bash
LOG_LEVEL=debug npm start
```

This will show which environment variables are loaded and used by the application.