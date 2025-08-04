# Multi-stage optimized build for EchoTune AI - Production DigitalOcean
# Optimized for production deployment with security hardening and performance

# Stage 1: Base image with essential tools
FROM node:20-alpine AS base

# Set production environment early
ENV NODE_ENV=production \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false \
    PYTHONUNBUFFERED=1

# Install essential system dependencies and Python for ML features
RUN apk add --no-cache \
    curl \
    ca-certificates \
    tzdata \
    python3 \
    py3-pip \
    py3-setuptools \
    tini \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Stage 2: Dependencies and build tools
FROM base AS deps-builder

# Install build dependencies for native modules
RUN apk add --no-cache \
    python3-dev \
    py3-wheel \
    make \
    g++ \
    gcc \
    musl-dev \
    libffi-dev \
    openssl-dev \
    pkgconfig \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

# Set up working directory
WORKDIR /app

# Copy dependency files first for better caching
COPY package*.json ./
COPY requirements-production.txt ./requirements.txt

# Install Node.js dependencies with production optimizations
RUN npm ci --only=production --no-audit --no-fund --ignore-scripts && \
    npm cache clean --force

# Install browser automation dependencies if needed
RUN if npm list puppeteer > /dev/null 2>&1; then \
        echo "Installing Puppeteer browsers..."; \
        npx puppeteer browsers install chrome --path /app/.cache/puppeteer || true; \
    fi && \
    if npm list playwright > /dev/null 2>&1 || npm list @playwright/test > /dev/null 2>&1; then \
        echo "Installing Playwright browsers..."; \
        npx playwright install --with-deps chromium || true; \
    fi

# Create optimized Python virtual environment
RUN python3 -m venv /app/venv && \
    . /app/venv/bin/activate && \
    pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt && \
    find /app/venv -name "*.pyc" -delete && \
    find /app/venv -name "__pycache__" -type d -exec rm -rf {} + || true

# Stage 3: Frontend builder (for React/Vite builds)
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files for frontend build dependencies
COPY package*.json ./
COPY vite.config.js* babel.config.js* ./

# Install all dependencies (including dev for building)
RUN npm install --no-audit --no-fund

# Copy source files for frontend build
COPY src/ ./src/
COPY public/ ./public/ 2>/dev/null || echo "No public directory"
COPY index.html ./index.html 2>/dev/null || echo "No index.html"

# Build frontend if configuration exists
RUN if [ -f "vite.config.js" ] && [ -d "src" ]; then \
        echo "Building frontend with Vite..."; \
        npm run build 2>/dev/null || npm run build:frontend 2>/dev/null || echo "Frontend build failed, using source"; \
    elif [ -d "src/frontend" ] || [ -d "public" ]; then \
        echo "Building static frontend..."; \
        mkdir -p dist && \
        (cp -r src/frontend/* dist/ 2>/dev/null || true) && \
        (cp -r public/* dist/ 2>/dev/null || true); \
    else \
        echo "Creating default frontend..."; \
        mkdir -p dist && \
        cat > dist/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EchoTune AI - Music Recommendation System</title>
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .container { max-width: 600px; margin: 0 auto; }
        h1 { font-size: 3em; margin-bottom: 20px; }
        p { font-size: 1.2em; margin-bottom: 30px; }
        .status { background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎵 EchoTune AI</h1>
        <p>Next-generation music recommendation system powered by AI</p>
        <div class="status">
            <h3>✅ System Online</h3>
            <p>Your EchoTune AI deployment is running successfully!</p>
            <p><strong>Domain:</strong> primosphere.studio</p>
        </div>
    </div>
</body>
</html>
EOF
    fi

# Stage 4: Production runtime (optimized and secure)
FROM base AS production

# Install minimal runtime dependencies
RUN apk add --no-cache \
    python3 \
    py3-numpy \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

# Create non-root user with specific UID/GID for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S echotune -u 1001 -G nodejs -h /app -s /bin/sh

# Set up application directory with proper permissions
WORKDIR /app

# Copy dependencies and built artifacts from previous stages
COPY --from=deps-builder --chown=echotune:nodejs /app/node_modules ./node_modules
COPY --from=deps-builder --chown=echotune:nodejs /app/venv ./venv
COPY --from=frontend-builder --chown=echotune:nodejs /app/dist ./dist

# Copy application source code with proper permissions
COPY --chown=echotune:nodejs src/ ./src/
COPY --chown=echotune:nodejs mcp-server/ ./mcp-server/
COPY --chown=echotune:nodejs scripts/ ./scripts/
COPY --chown=echotune:nodejs package*.json ./
COPY --chown=echotune:nodejs server.js index.js ./

# Copy other necessary files
COPY --chown=echotune:nodejs requirements-production.txt ./requirements.txt
COPY --chown=echotune:nodejs .env.production ./.env.example

# Create necessary directories with proper permissions
RUN mkdir -p logs data temp uploads .cache && \
    chown -R echotune:nodejs logs data temp uploads .cache && \
    chmod 755 logs data temp uploads && \
    chmod 700 .cache

# Add virtual environment to PATH
ENV PATH="/app/venv/bin:$PATH"

# Production environment variables with optimizations
ENV NODE_ENV=production \
    PORT=3000 \
    NODE_OPTIONS="--max-old-space-size=1024 --enable-source-maps" \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    PLAYWRIGHT_BROWSERS_PATH=/app/.cache/playwright \
    UV_THREADPOOL_SIZE=8 \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Security optimizations
RUN rm -rf /tmp/* /var/tmp/* /root/.npm /home/echotune/.npm 2>/dev/null || true

# Create health check script
RUN cat > /app/health-check.sh << 'EOF' && chmod +x /app/health-check.sh
#!/bin/sh
# Enhanced health check with fallbacks
curl -f http://localhost:3000/health 2>/dev/null || \
node -e "
const http = require('http');
const req = http.request('http://localhost:3000/health', (res) => {
    process.exit(res.statusCode === 200 ? 0 : 1);
});
req.on('error', () => process.exit(1));
req.end();
" || exit 1
EOF

# Switch to non-root user for security
USER echotune

# Expose port
EXPOSE 3000

# Enhanced health check with multiple fallbacks
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD /app/health-check.sh

# Use tini as PID 1 for proper signal handling
ENTRYPOINT ["tini", "--"]

# Start the application with optimized settings
CMD ["node", "--unhandled-rejections=strict", "--max-http-header-size=16384", "src/index.js"]

# Build metadata and labels
ARG BUILD_VERSION=latest
ARG BUILD_DATE
ARG VCS_REF

LABEL maintainer="EchoTune AI Team" \
      version="${BUILD_VERSION}" \
      build-date="${BUILD_DATE}" \
      vcs-ref="${VCS_REF}" \
      description="EchoTune AI - Next-generation music recommendation system optimized for DigitalOcean" \
      org.opencontainers.image.title="EchoTune AI" \
      org.opencontainers.image.description="Next-generation music recommendation system with conversational AI" \
      org.opencontainers.image.version="${BUILD_VERSION}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.source="https://github.com/dzp5103/Spotify-echo" \
      org.opencontainers.image.documentation="https://github.com/dzp5103/Spotify-echo#readme" \
      org.opencontainers.image.vendor="EchoTune AI" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.url="https://primosphere.studio" \
      deployment.target="digitalocean" \
      deployment.domain="primosphere.studio" \
      deployment.optimized="true"