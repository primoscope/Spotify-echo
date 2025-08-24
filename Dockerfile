# syntax=docker/dockerfile:1.7

# ------------------------------
# 1) Base builder for Node deps
# ------------------------------
FROM node:20-alpine AS base
WORKDIR /app
ENV CI=true
# Install system deps needed for builds (native modules)
RUN apk add --no-cache python3 make g++

# Copy package manifests first for better caching
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

# ------------------------------
# 2) Install deps
# ------------------------------
FROM base AS deps
# Prefer npm; support others if lockfiles present
RUN if [ -f package-lock.json ]; then npm ci --legacy-peer-deps; \
    elif [ -f pnpm-lock.yaml ]; then npm i -g pnpm && pnpm i --frozen-lockfile; \
    elif [ -f yarn.lock ]; then npm i -g yarn && yarn --frozen-lockfile; \
    else npm i; fi

# ------------------------------
# 3) Production-only node_modules
# ------------------------------
FROM base AS prod-deps
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev --legacy-peer-deps; \
    elif [ -f pnpm-lock.yaml ]; then npm i -g pnpm && pnpm i --frozen-lockfile --prod; \
    elif [ -f yarn.lock ]; then npm i -g yarn && YARN_PRODUCTION=true yarn --frozen-lockfile; \
    else npm i --omit=dev; fi

# ------------------------------
# 3) Build frontend with Vite
# ------------------------------
FROM deps AS build
# Copy source
COPY . .
# Ensure production env for deterministic build
ENV NODE_ENV=production
# Build React frontend to dist (vite.config outputs to ./dist)
RUN npm run build

# ------------------------------
# 4) Runtime image (small)
# ------------------------------
FROM node:20-alpine AS runtime
WORKDIR /app
ARG BUILD_SHA="unknown"
ARG BUILD_TIME="unknown"
ENV NODE_ENV=production \
    PORT=3000 \
    BUILD_SHA=${BUILD_SHA} \
    BUILD_TIME=${BUILD_TIME}

# Install curl/wget and runtime libs for native modules
RUN apk add --no-cache curl wget libstdc++

# Create non-root user
RUN addgroup -S nodeapp && adduser -S nodeapp -G nodeapp

# Copy only needed files
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.js ./server.js
COPY --from=build /app/src ./src
COPY --from=build /app/package.json ./package.json

# Expose app port (configurable via PORT)
EXPOSE 3000

# Healthcheck for DigitalOcean/Docker
HEALTHCHECK --interval=30s --timeout=5s --retries=5 CMD wget -qO- http://localhost:${PORT:-3000}/health || exit 1

# Run server
USER nodeapp
CMD ["node", "server.js"]

# OCI labels
LABEL org.opencontainers.image.source="https://github.com/dzp5103/Spotify-echo" \
      org.opencontainers.image.title="EchoTune AI" \
      org.opencontainers.image.description="Advanced music discovery platform with Spotify integration" \
      org.opencontainers.image.revision=${BUILD_SHA} \
      org.opencontainers.image.created=${BUILD_TIME}