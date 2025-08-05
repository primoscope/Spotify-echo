# Production Dockerfile for EchoTune AI - Optimized for Deployment
FROM node:20-alpine

# Set production environment
ENV NODE_ENV=production \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=true

# Install essential system dependencies
RUN apk add --no-cache \
    curl \
    ca-certificates \
    tini \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S echotune -u 1001 -G nodejs -h /app -s /bin/sh

# Set up working directory
WORKDIR /app

# Create a minimal package.json for core dependencies only
RUN echo '{\
  "name": "echotune-ai",\
  "version": "2.1.0",\
  "main": "src/index.js",\
  "dependencies": {\
    "express": "^4.18.0",\
    "cors": "^2.8.5",\
    "dotenv": "^16.3.0",\
    "axios": "^1.5.0",\
    "helmet": "^7.1.0",\
    "compression": "^1.7.4",\
    "uuid": "^9.0.1"\
  }\
}' > package.json

# Install core dependencies only
RUN npm install --only=production --no-audit --no-fund && \
    npm cache clean --force

# Copy application source
COPY src/ ./src/
COPY *.js ./

# Create environment file
RUN touch ./.env

# Create necessary directories and set permissions
RUN mkdir -p logs data temp uploads && \
    chown -R echotune:nodejs . && \
    chmod 755 logs data temp uploads

# Create health check script
RUN echo '#!/bin/sh' > /app/health-check.sh && \
    echo 'curl -f http://localhost:3000/health || exit 1' >> /app/health-check.sh && \
    chmod +x /app/health-check.sh

# Switch to non-root user
USER echotune

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD /app/health-check.sh

# Start the application
CMD ["node", "src/index.js"]