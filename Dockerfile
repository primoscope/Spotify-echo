# Multi-stage optimized build for EchoTune AI
# Optimized for production deployment with security hardening

# Stage 1: Base image with common dependencies
FROM node:20-alpine AS base

# Install essential system dependencies
RUN apk add --no-cache \
    curl \
    ca-certificates \
    tzdata \
    && rm -rf /var/cache/apk/*

# Stage 2: Dependencies builder
FROM base AS deps-builder

# Install build dependencies including browser dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    python3-dev \
    py3-setuptools \
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
    ca-certificates \
    ttf-freefont

WORKDIR /app

# Copy dependency files
COPY package*.json ./
COPY requirements-production.txt ./requirements.txt

# Install Node.js dependencies with error handling (exclude scripts initially)
RUN npm ci --only=production --no-audit --no-fund --ignore-scripts || npm install --only=production --no-audit --no-fund --ignore-scripts

# Install Playwright/Puppeteer browser dependencies as root (before switching users)
RUN if npm list puppeteer > /dev/null 2>&1; then \
        echo "Installing Puppeteer browsers..."; \
        npx puppeteer browsers install chrome --path /app/.cache/puppeteer || true; \
    fi

# Install Playwright if present
RUN if npm list playwright > /dev/null 2>&1 || npm list @playwright/test > /dev/null 2>&1; then \
        echo "Installing Playwright browsers..."; \
        npx playwright install --with-deps chromium || true; \
    fi

RUN npm cache clean --force || true

# Create optimized Python virtual environment
RUN python3 -m venv /app/venv && \
    . /app/venv/bin/activate && \
    pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt && \
    find /app/venv -name "*.pyc" -delete && \
    find /app/venv -name "__pycache__" -type d -exec rm -rf {} + || true

# Stage 3: Frontend builder (optional, only if frontend exists)
FROM base AS frontend-builder

WORKDIR /app

# Copy package files for frontend build
COPY package*.json ./
COPY vite.config.js* ./

# Install dev dependencies for building (skip scripts to avoid Playwright issues)
RUN npm install --no-audit --no-fund --ignore-scripts

# Copy frontend source files with safer approach  
COPY . ./temp_src/
RUN mkdir -p src/frontend public && \
    (cp -r temp_src/src/frontend/* src/frontend/ 2>/dev/null || true) && \
    (cp -r temp_src/public/* public/ 2>/dev/null || true) && \
    rm -rf temp_src

# Build frontend if source exists, otherwise create empty dist
RUN if [ -d "src/frontend" ] || [ -d "public" ]; then \
        npm run build:frontend 2>/dev/null || mkdir -p dist; \
    else \
        mkdir -p dist && echo '<!DOCTYPE html><html><head><title>EchoTune AI</title></head><body><h1>EchoTune AI</h1></body></html>' > dist/index.html; \
    fi

# Stage 4: Production runtime
FROM base AS production

# Install minimal runtime dependencies and security tools
RUN apk add --no-cache \
    python3 \
    py3-numpy \
    tini \
    dumb-init \
    su-exec \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

# Create non-root user with specific UID/GID for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S echotune -u 1001 -G nodejs -h /app -s /bin/sh

# Set up application directory with proper permissions
WORKDIR /app

# Copy dependencies from builders
COPY --from=deps-builder --chown=echotune:nodejs /app/node_modules ./node_modules
COPY --from=deps-builder --chown=echotune:nodejs /app/venv ./venv

# Copy built frontend
COPY --from=frontend-builder --chown=echotune:nodejs /app/dist ./dist

# Copy application source code
COPY --chown=echotune:nodejs src/ ./src/
COPY --chown=echotune:nodejs mcp-server/ ./mcp-server/
COPY --chown=echotune:nodejs scripts/ ./scripts/
COPY --chown=echotune:nodejs package*.json ./
COPY --chown=echotune:nodejs server.js index.js ./

# Create necessary directories with proper permissions
RUN mkdir -p logs data temp uploads && \
    chown -R echotune:nodejs logs data temp uploads

# Add virtual environment to PATH
ENV PATH="/app/venv/bin:$PATH"

# Production environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    NODE_OPTIONS="--max-old-space-size=512" \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    PLAYWRIGHT_BROWSERS_PATH=/app/.cache/playwright

# Security: Remove unnecessary packages and files
RUN rm -rf /tmp/* /var/tmp/* /root/.npm /home/echotune/.npm

# Switch to non-root user
USER echotune

# Expose port
EXPOSE 3000

# Enhanced health check with proper error handling
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health 2>/dev/null || \
        node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Use tini as PID 1 for proper signal handling
ENTRYPOINT ["tini", "--"]

# Start the application with optimized Node.js settings
CMD ["node", "--unhandled-rejections=strict", "--max-http-header-size=16384", "src/index.js"]

# Add labels for better container management
LABEL maintainer="EchoTune AI Team" \
      version="2.0.0" \
      description="EchoTune AI - Next-generation music recommendation system" \
      org.opencontainers.image.source="https://github.com/dzp5103/Spotify-echo" \
      org.opencontainers.image.documentation="https://github.com/dzp5103/Spotify-echo#readme" \
      org.opencontainers.image.vendor="EchoTune AI" \
      org.opencontainers.image.licenses="MIT"