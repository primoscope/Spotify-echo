# Multi-stage build for EchoTune AI
# Stage 1: Build the frontend
FROM node:18-alpine AS frontend-builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./
COPY vite.config.js ./

# Install all dependencies including dev dependencies for build
RUN npm ci

# Copy frontend source files
COPY src/frontend/ ./src/frontend/
COPY public/ ./public/

# Build the frontend for production
RUN npm run build:frontend

# Stage 2: Build the backend
FROM node:18-alpine AS backend-builder

# Install Python and build dependencies for Python packages
RUN apk add --no-cache \
    python3 \
    py3-pip \
    python3-dev \
    py3-setuptools \
    py3-wheel \
    py3-numpy \
    py3-pandas \
    py3-scipy \
    make \
    g++ \
    gcc \
    musl-dev \
    libffi-dev \
    openssl-dev \
    lapack-dev \
    gfortran \
    pkgconfig \
    cmake

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY requirements-production.txt ./

# Install Node.js production dependencies only
RUN npm ci --only=production

# Create Python virtual environment and install dependencies
RUN python3 -m venv /app/venv && \
    . /app/venv/bin/activate && \
    pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements-production.txt

# Stage 3: Production runtime
FROM node:18-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
    python3 \
    py3-numpy \
    py3-pandas \
    py3-scipy \
    tini \
    dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S echotune -u 1001

WORKDIR /app

# Copy Node.js dependencies from backend builder
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/venv ./venv

# Copy built frontend from frontend builder
COPY --from=frontend-builder /app/dist ./dist

# Copy application source
COPY src/ ./src/
COPY mcp-server/ ./mcp-server/
COPY scripts/ ./scripts/

# Copy package.json for metadata
COPY package*.json ./

# Add virtual environment to PATH
ENV PATH="/app/venv/bin:$PATH"

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Change ownership of the app directory
RUN chown -R echotune:nodejs /app
USER echotune

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "src/index.js"]