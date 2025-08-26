const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const dotenv = require('dotenv');
const axios = require('axios');
const crypto = require('crypto');
const { URLSearchParams } = require('url');
const compression = require('compression');

// AgentOps integration with feature flag
let agentops = null;
const enableAgentOps = process.env.ENABLE_AGENTOPS !== 'false' && process.env.AGENTOPS_API_KEY;

if (enableAgentOps) {
  try {
    agentops = require('agentops');
    agentops.init(process.env.AGENTOPS_API_KEY, {
      auto_start_session: false,
      tags: ['spotify-echo', 'music-ai', 'llm-provider']
    });
    console.log('🔍 AgentOps initialized');
  } catch (error) {
    console.log('📊 AgentOps not available:', error.message);
  }
} else {
  console.log('⚪ AgentOps disabled (ENABLE_AGENTOPS=false or no API key)');
}

// Load environment variables
dotenv.config();

// Import Redis and session management
const session = require('express-session');
const { initializeRedis, getRedisManager } = require('./utils/redis');

// Import configuration and validation
const { validateProductionConfig, getEnvironmentConfig } = require('./config/production');

// Import lifecycle management
const { initializeReadiness } = require('./infra/lifecycle/readiness');
const { initializeGracefulShutdown } = require('./infra/lifecycle/gracefulShutdown');
const appCacheManager = require('./infra/cache/index');

// Eager-load modules that register Prometheus metrics
require('./security/auth');
require('./domain/playlist/metrics');

// Validate production configuration
try {
  validateProductionConfig();
} catch (error) {
  console.error('Configuration Error:', error.message);
  process.exit(1);
}

const config = getEnvironmentConfig();

const responseTimeOptimization = require('./api/middleware/response-time-optimization.js');
// Import API routes and middleware
const chatRoutes = require('./api/routes/chat');
const recommendationRoutes = require('./api/routes/recommendations');
const spotifyRoutes = require('./api/routes/spotify');
const providersRoutes = require('./api/routes/providers');
const databaseRoutes = require('./api/routes/database');
const playlistRoutes = require('./api/routes/playlists');
const settingsRoutes = require('./api/routes/settings');
const systemRoutes = require('./api/routes/system');
const analyticsRoutes = require('./api/routes/analytics');
const insightsRoutes = require('./api/routes/insights'); // Enhanced Spotify insights with caching and pagination
const feedbackRoutes = require('./api/routes/feedback'); // New feedback system
const musicDiscoveryRoutes = require('./api/routes/music-discovery'); // New music discovery system
const llmProvidersRoutes = require('./api/routes/llm-providers'); // Enhanced LLM provider management
const advancedSettingsRoutes = require('./api/advanced-settings'); // Advanced Settings UI API
const docsRoutes = require('./api/routes/docs'); // API documentation
const adminRoutes = require('./api/routes/admin'); // MongoDB admin dashboard and tools
const enhancedMCPRoutes = require('./api/routes/enhanced-mcp'); // Enhanced MCP and multimodel capabilities
const autonomousDevelopmentRoutes = require('./api/routes/autonomous-development'); // Autonomous development with Perplexity research
const researchRoutes = require('./api/routes/research'); // Perplexity AI research capabilities
const analysisRoutes = require('./api/routes/analysis'); // Grok-4 code analysis capabilities
const multiAgentWorkflowRoutes = require('./api/routes/multi-agent-workflows'); // Multi-agent orchestration
const workflowRoutes = require('../agent-workflow/workflow-api'); // Dynamic workflow management
const {
  extractUser,
  ensureDatabase,
  errorHandler,
  requestLogger,
  corsMiddleware,
  createRateLimit,
  sanitizeInput,
  requestSizeLimit,
  securityHeaders,
  authRateLimit,
  apiRateLimit,
  spotifyRateLimit,
  chatRateLimit,
} = require('./api/middleware');

// Import enhanced systems
const healthRoutes = require('./api/health/health-routes');
const cacheManager = require('./api/cache/cache-manager');
const SecurityManager = require('./api/security/security-manager');
const performanceMonitor = require('./api/monitoring/performance-monitor');
const logger = require('./api/utils/logger');

// Import modular routes
const systemHealthRoutes = require('./routes/health');
const systemPerformanceRoutes = require('./routes/performance');
const systemMonitoringRoutes = require('./routes/system');
const systemMetricsRoutes = require('./routes/metrics');

// Import new modular routes
const authRoutes = require('./routes/auth');
const spotifyApiRoutes = require('./routes/spotify-api');
const enhancedApiRoutes = require('./routes/enhanced-api');
const chatRoutes_local = require('./routes/chat');
const appRoutes = require('./routes/app');

// Import infrastructure systems
const { getContainer, configureCoreServices } = require('./infra/DIContainer');
const { getFeatureFlags, configureDefaultFlags } = require('./infra/FeatureFlags');
const { getMiddlewareManager, configureDefaultMiddleware } = require('./infra/MiddlewareManager');

// Import Redis-backed rate limiting and performance monitoring
const { rateLimiters } = require('./middleware/redis-rate-limiter');
const { middleware: slowRequestMiddleware } = require('./middleware/slow-request-logger');
const { MCPPerformanceAnalytics } = require('./utils/mcp-performance-analytics');

const app = express();
const server = http.createServer(app);

// Feature flag for disabling real-time features in serverless environments
const realtimeEnabled = process.env.DISABLE_REALTIME !== 'true';
let io = null;

if (realtimeEnabled) {
  io = socketIo(server, {
    cors: {
      origin:
        process.env.NODE_ENV === 'production'
          ? [`https://${process.env.DOMAIN || 'primosphere.studio'}`]
          : ['http://localhost:3000', 'http://127.0.0.1:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });
  console.log('🔗 Real-time features enabled (Socket.IO initialized)');
  logger.info('realtime-features', { status: 'enabled', transport: 'socket.io' });
} else {
  console.log('⚪ Real-time features disabled (DISABLE_REALTIME=true)');
  logger.info('realtime-features', { status: 'disabled', reason: 'DISABLE_REALTIME=true' });
}
const PORT = config.server.port;

// Initialize enhanced systems
const securityManager = new SecurityManager();

// Initialize Redis and session management
let redisManager = null;

async function initializeRedisSession() {
  try {
    redisManager = await initializeRedis();
    console.log('🔄 Redis manager initialized');
    return redisManager;
  } catch (error) {
    console.warn('⚠️ Redis initialization failed:', error.message);
    console.log('📦 Using in-memory fallback for sessions');
    return null;
  }
}

// Performance monitoring and slow request logging
app.use(performanceMonitor.requestTracker());
app.use(slowRequestMiddleware);

// Phase 1 Security Baseline - Environment validation and security setup
const applyHelmet = require('./security/helmet');
const createRateLimiter = require('./security/rateLimit');
const { validateEnv } = require('./security/envValidate');
const securityErrorHandler = require('./middleware/errorHandler');

// Validate environment variables at startup
validateEnv(require('./infra/observability/logger'));

// Observability Foundation - Request ID and metrics middleware (before other middleware)
const requestId = require('./middleware/requestId');
const metricsMw = require('./middleware/metrics');
const healthRoute = require('./routes/internal/health');
const metricsRoute = require('./routes/internal/metrics');
const readyRoute = require('./routes/internal/ready');
app.use(requestId);
app.use(metricsMw);
app.use('/internal/health', healthRoute);
app.use('/internal/metrics', metricsRoute);
app.use('/internal/ready', readyRoute);

// Demo routes (only enabled with ENABLE_DEMO_ROUTES=1)
if (process.env.ENABLE_DEMO_ROUTES === '1') {
  const playlistGenerateRoute = require('./routes/internal/demo/playlist-generate');
  app.use('/internal/demo/playlist-generate', playlistGenerateRoute);
  console.log('🧪 Demo routes enabled at /internal/demo/*');
}

// Phase 1 Security Baseline - Example validation route
app.use('/internal/example-validation', require('./routes/internal/example-validation'));

// Initialize MCP Performance Analytics
const mcpAnalytics = new MCPPerformanceAnalytics();

// Initialize infrastructure systems
async function initializeInfrastructure() {
  // Configure dependency injection
  configureCoreServices();
  
  // Configure feature flags
  configureDefaultFlags();
  
  // Configure middleware
  const middlewareManager = getMiddlewareManager();
  configureDefaultMiddleware(middlewareManager);
  
  console.log('🏗️ Infrastructure systems initialized');
  return { middlewareManager };
}

// Trust proxy if in production (for proper IP detection behind reverse proxy)
if (config.server.trustProxy) {
  app.set('trust proxy', 1);
}

// Spotify OAuth configuration
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

// Environment-aware redirect URI fallback
const getDefaultRedirectUri = () => {
  if (process.env.NODE_ENV === 'production') {
    return `https://${process.env.DOMAIN || 'primosphere.studio'}/auth/callback`;
  }
  return `http://localhost:${PORT}/auth/callback`;
};

const getDefaultFrontendUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return `https://${process.env.DOMAIN || 'primosphere.studio'}`;
  }
  return `http://localhost:${PORT}`;
};

const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || getDefaultRedirectUri();
const FRONTEND_URL = process.env.FRONTEND_URL || getDefaultFrontendUrl();

// Security and performance middleware - Phase 1 Security Baseline
// Apply Phase 1 security middleware in proper order
applyHelmet(app);
app.use(createRateLimiter());

// Existing security middleware (maintained for compatibility)
app.use(securityManager.securityHeaders);
app.use(securityManager.detectSuspiciousActivity());
app.use(securityManager.validateAndSanitizeInput());

// Compression middleware
if (config.server.compression) {
  app.use(
    compression({
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
      level: 6,
      threshold: 1024,
    })
  );
}

// Session management with Redis store or memory fallback
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'fallback-dev-secret-change-in-production',
  name: 'echotune.session',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  },
};

// Note: Redis session store will be configured during initialization
app.use(session(sessionConfig));

// Mount modular routes
app.use('/health', systemHealthRoutes);
app.use('/metrics', systemMetricsRoutes);
app.use('/api/performance', systemPerformanceRoutes);
app.use('/api', systemMonitoringRoutes);
app.use('/api', systemMetricsRoutes); // Mount under /api as well for AI routes

// Mount new modular routes
app.use('/auth', authRoutes);
app.use('/api/spotify', spotifyApiRoutes);
app.use('/api', enhancedApiRoutes);
app.use('/api/chat', chatRoutes_local);
app.use('/', appRoutes);

// Enhanced security headers (replaces basic securityHeaders)
app.use(securityHeaders);

// Global rate limiting with Redis backing
app.use(rateLimiters.global);

// Request logging and monitoring
app.use(requestLogger);

// Lightweight request timing: add X-Response-Time and log JSON
app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const ms = Number(end - start) / 1e6;
    try {
      res.setHeader('X-Response-Time', `${ms.toFixed(0)}ms`);
    } catch {}
    logger.info('request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      ms: Math.round(ms),
    });
  });
  next();
});

// CORS with production configuration
app.use(corsMiddleware);

// Request size limiting
app.use(requestSizeLimit);

// Body parsing with size limits
app.use(
  express.json({
    limit: config.server.maxRequestSize,
    verify: (req, res, buf) => {
      // Additional payload verification if needed
      req.rawBody = buf;
    },
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: config.server.maxRequestSize,
  })
);

// Input sanitization
app.use(sanitizeInput);

// Serve built React application static files first
app.use(
  express.static(path.join(__dirname, '../dist'), {
    maxAge: process.env.NODE_ENV === 'production' ? '1y' : 0,
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
        // Hashed asset filenames are immutable
        res.setHeader('Cache-Control', `public, max-age=${ONE_YEAR_IN_SECONDS}, immutable`);
      }
    },
  })
);

// Static file serving with caching headers (fallback)
app.use(
  express.static(path.join(__dirname, '../public'), {
    maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0,
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
        res.setHeader('Cache-Control', 'public, max-age=3600');
      }
    },
  })
);

// Serve React frontend files
app.use(
  '/frontend',
  express.static(path.join(__dirname, 'frontend'), {
    maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0,
    etag: false,
    setHeaders: (res) => {
      if (process.env.NODE_ENV !== 'production') {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    },
  })
);

// Serve src directory for JavaScript modules with no-cache in development
if (process.env.NODE_ENV !== 'production') {
  app.use(
    '/src',
    express.static(path.join(__dirname), {
      maxAge: 0,
      etag: false,
      setHeaders: (res) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      },
    })
  );
}

// Serve docs directory for API documentation
app.use(
  '/docs',
  express.static(path.join(__dirname, '../docs'), {
    maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
        res.setHeader('Content-Type', 'text/yaml');
      }
    },
  })
);

// Database connection middleware
app.use(ensureDatabase);

// User extraction middleware for all routes
app.use(extractUser);

// Optional: Non-enforcing auth scaffold middleware
// Uncomment to enable JWT token parsing on all routes
// const { authMiddleware } = require('./security/auth');
// app.use(authMiddleware);

// Enhanced API routes with new systems
app.use('/api', healthRoutes);

// Add specialized Redis-backed rate limiting to API routes
app.use('/api/chat', rateLimiters.chat);
app.use('/api/recommendations', rateLimiters.api);
app.use('/api/spotify', rateLimiters.spotify);
app.use('/auth', rateLimiters.auth);
app.use('/api/spotify/auth', rateLimiters.auth); // Additional auth endpoint protection

// Enhanced API routes moved to /routes/enhanced-api.js

// Store for temporary state (moved to auth routes module)
// const authStates = new Map();

// Utility functions (moved to auth routes module)
// const generateRandomString = (length) => {
//   return crypto
//     .randomBytes(Math.ceil(length / 2))
//     .toString('hex')
//     .slice(0, length);
// };

const base64encode = (str) => {
  return Buffer.from(str).toString('base64');
};

// Routes

// Enhanced health check endpoints
const HealthCheckSystem = require('./utils/health-check');
const healthChecker = new HealthCheckSystem();

// Comprehensive health check endpoint (bypass rate limiting)
app.get('/health', async (req, res) => {
  try {
    const healthReport = await healthChecker.runAllChecks();

    // For production deployment health checks, only fail on critical errors
    // Warnings and missing optional services should not cause 503s
    const hasCriticalErrors = Object.values(healthReport.checks).some(
      (check) => check.status === 'unhealthy' && !check.optional
    );

    const statusCode = hasCriticalErrors ? 503 : 200;

    res.status(statusCode).json(healthReport);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Health check system failure',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Individual health check endpoints
app.get('/health/:check', async (req, res) => {
  try {
    const checkName = req.params.check;
    const result = await healthChecker.runCheck(checkName);

    const statusCode = result.status === 'healthy' ? 200 : result.status === 'warning' ? 200 : 503;

    res.status(statusCode).json({
      check: checkName,
      ...result,
    });
  } catch (error) {
    res.status(400).json({
      error: 'Invalid health check',
      message: error.message,
      availableChecks: Array.from(healthChecker.checks.keys()),
    });
  }
});

// Simple readiness probe (lightweight check for load balancers)
app.get('/ready', (req, res) => {
  res.status(200).json({
    status: 'ready',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Simple liveness probe (basic application response)
app.get('/alive', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    pid: process.pid,
  });
});

// Main application routes moved to /routes/app.js

// Spotify authentication routes moved to /routes/auth.js

// Spotify API routes moved to /routes/spotify-api.js

// Basic chatbot routes moved to /routes/chat.js

// API Routes
// Register API routes
app.use('/api/docs', docsRoutes); // API documentation - must come first
app.use('/api/chat', chatRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/spotify', spotifyRoutes);
app.use('/api/providers', providersRoutes);
app.use('/api/database', databaseRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/settings', llmProvidersRoutes); // Enhanced LLM provider management
app.use('/api/settings', advancedSettingsRoutes); // Advanced Settings UI API
app.use('/api/analytics', analyticsRoutes);
app.use('/api/insights', insightsRoutes); // Enhanced Spotify insights with caching and pagination
app.use('/api/feedback', feedbackRoutes); // New feedback system
app.use('/api/music', musicDiscoveryRoutes); // Enhanced music discovery system
app.use('/api/admin', adminRoutes); // MongoDB admin dashboard and tools
app.use('/api/enhanced-mcp', enhancedMCPRoutes); // Enhanced MCP and multimodel capabilities
app.use('/api/research', researchRoutes); // Perplexity AI research capabilities
app.use('/api/analyze', analysisRoutes); // Grok-4 code analysis capabilities  
app.use('/api/workflows', multiAgentWorkflowRoutes); // Multi-agent orchestration
app.use('/api/workflow', workflowRoutes); // Dynamic workflow management
app.use('/api/autonomous', autonomousDevelopmentRoutes); // Autonomous development agents with Perplexity research

// Deployment API routes
const deployRoutes = require('./api/routes/deploy');
app.use('/api/deploy', deployRoutes);

// Enhanced real-time features
const realtimeRecommendationsRoutes = require('./api/routes/realtime-recommendations');
const playlistAutomationRoutes = require('./api/routes/playlist-automation');
app.use('/api/recommendations', realtimeRecommendationsRoutes);
app.use('/api/playlists', playlistAutomationRoutes);

// Socket.IO Real-time Chat Integration
const EchoTuneChatbot = require('./chat/chatbot');

// Initialize chatbot for Socket.IO
const chatbotConfig = {
  llmProviders: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    },
    azure: {
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      deployment: process.env.AZURE_OPENAI_DEPLOYMENT,
    },
    openrouter: {
      apiKey: process.env.OPENROUTER_API_KEY,
      model: process.env.OPENROUTER_MODEL || 'deepseek/deepseek-r1-0528:free',
    },
  },
  // Determine the best available provider based on API keys - prioritize Gemini
  defaultProvider:
    process.env.DEFAULT_LLM_PROVIDER ||
    (process.env.GEMINI_API_KEY
      ? 'gemini'
      : process.env.OPENAI_API_KEY
        ? 'openai'
        : process.env.OPENROUTER_API_KEY
          ? 'openrouter'
          : 'mock'),
  defaultModel: process.env.DEFAULT_LLM_MODEL || 'gemini-1.5-flash',
  enableMockProvider: true,
};

let socketChatbot = null;

async function initializeSocketChatbot() {
  if (!socketChatbot) {
    socketChatbot = new EchoTuneChatbot(chatbotConfig);
    await socketChatbot.initialize();
    console.log('🔗 Socket.IO Chatbot initialized');
  }
  return socketChatbot;
}

// Socket.IO connection handling (only if real-time is enabled)
if (realtimeEnabled && io) {
  io.on('connection', async (socket) => {
  console.log(`🔗 Client connected: ${socket.id}`);

  try {
    // Initialize chatbot
    const chatbot = await initializeSocketChatbot();

    // Send connection confirmation
    socket.emit('connected', {
      message: 'Connected to EchoTune AI',
      socketId: socket.id,
      timestamp: new Date().toISOString(),
      providers: chatbot.getAvailableProviders(),
    });

    // Handle chat messages
    socket.on('chat_message', async (data) => {
      try {
        const { message, sessionId, provider, userId = `socket_${socket.id}` } = data;

        if (!message) {
          socket.emit('error', { message: 'Message is required' });
          return;
        }

        // Emit typing indicator
        socket.emit('typing_start', { timestamp: new Date().toISOString() });

        let activeSessionId = sessionId;

        // Create session if not provided
        if (!activeSessionId) {
          const session = await chatbot.startConversation(userId, { provider });
          activeSessionId = session.sessionId;
          socket.emit('session_created', { sessionId: activeSessionId });
        }

        // Send message to chatbot
        const response = await chatbot.sendMessage(activeSessionId, message, {
          provider: provider || chatbot.config.defaultProvider,
          userId,
        });

        // Stop typing indicator
        socket.emit('typing_stop');

        // Send response
        socket.emit('chat_response', {
          ...response,
          sessionId: activeSessionId,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Socket chat error:', error);
        socket.emit('typing_stop');
        socket.emit('error', {
          message: 'Failed to process message',
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Handle streaming messages
    socket.on('chat_stream', async (data) => {
      try {
        const { message, sessionId, provider, userId = `socket_${socket.id}` } = data;

        if (!message) {
          socket.emit('error', { message: 'Message is required' });
          return;
        }

        let activeSessionId = sessionId;

        if (!activeSessionId) {
          const session = await chatbot.startConversation(userId, { provider });
          activeSessionId = session.sessionId;
          socket.emit('session_created', { sessionId: activeSessionId });
        }

        // Start streaming
        socket.emit('stream_start', { sessionId: activeSessionId });

        for await (const chunk of chatbot.streamMessage(activeSessionId, message, { provider })) {
          if (chunk.error) {
            socket.emit('stream_error', { error: chunk.error });
            break;
          } else if (chunk.type === 'chunk') {
            socket.emit('stream_chunk', {
              content: chunk.content,
              isPartial: chunk.isPartial,
              sessionId: activeSessionId,
            });
          } else if (chunk.type === 'complete') {
            socket.emit('stream_complete', {
              sessionId: activeSessionId,
              totalTime: chunk.totalTime,
              timestamp: new Date().toISOString(),
            });
            break;
          }
        }
      } catch (error) {
        console.error('Socket stream error:', error);
        socket.emit('stream_error', {
          message: 'Failed to stream message',
          error: error.message,
        });
      }
    });

    // Handle provider switching
    socket.on('switch_provider', async (data) => {
      try {
        const { provider } = data;
        const result = await chatbot.switchProvider(provider);

        socket.emit('provider_switched', {
          success: true,
          provider: result.provider,
          message: `Switched to ${provider}`,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        socket.emit('provider_switch_error', {
          message: 'Failed to switch provider',
          error: error.message,
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error from ${socket.id}:`, error);
    });
  } catch (error) {
    console.error('Socket connection initialization error:', error);
    socket.emit('initialization_error', {
      message: 'Failed to initialize chat service',
      error: error.message,
    });
  }
});
} else {
  console.log('⚪ Socket.IO connection handling disabled');
}

// Error handling middleware
// eslint-disable-next-line no-unused-vars
app.use(errorHandler);

// 404 catch-all handler - must be after all other routes  
// (Note: SPA routing is now handled in app routes)
app.use((req, res) => {
  const { createNotFoundError } = require('./errors/createError');
  const error = createNotFoundError('Endpoint', req.path);
  
  res.status(error.statusCode).json({
    error: {
      code: error.code,
      message: error.message,
      details: error.details,
      timestamp: error.timestamp
    }
  });
});

// Start server
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') server.listen(PORT, '0.0.0.0', async () => {
  console.log(`🎵 EchoTune AI Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 Spotify configured: ${!!(SPOTIFY_CLIENT_ID && SPOTIFY_CLIENT_SECRET)}`);
  console.log(
    `🔐 Auth mode: ${process.env.AUTH_DEVELOPMENT_MODE === 'true' ? 'Development' : 'Production JWT'}`
  );
  
  // Initialize infrastructure systems
  try {
    const { middlewareManager } = await initializeInfrastructure();
    console.log('🏗️ Infrastructure initialization completed');
  } catch (error) {
    console.error('❌ Infrastructure initialization failed:', error);
  }
  
  // Structured logging for key server info
  logger.info('server-start', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    spotify_configured: !!(SPOTIFY_CLIENT_ID && SPOTIFY_CLIENT_SECRET),
    auth_mode: process.env.AUTH_DEVELOPMENT_MODE === 'true' ? 'development' : 'production',
    features: {
      realtime: realtimeEnabled,
      tracing: process.env.ENABLE_TRACING !== 'false',
      agentops: enableAgentOps
    }
  });

  // Initialize lifecycle management
  initializeGracefulShutdown(server);
  initializeReadiness();
  
  // Initialize cache system
  appCacheManager.initialize();

  // Initialize Redis first
  try {
    redisManager = await initializeRedisSession();
    if (redisManager && redisManager.useRedis) {
      console.log('💾 Redis initialized for sessions and caching');
    } else {
      console.log('💾 Using in-memory fallback for sessions and caching');
      if (process.env.NODE_ENV === 'production') {
        console.warn('⚠️  WARNING: Using memory store for sessions in production is not recommended');
        console.warn('   💡 Configure REDIS_URL for proper session persistence');
      }
    }
  } catch (error) {
    console.warn('⚠️ Redis setup failed:', error.message);
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️  WARNING: Session store fallback to memory in production');
    }
  }

  // Initialize database manager with fallback support
  try {
    const databaseManager = require('./database/database-manager');
    // const llmProviderManager = require('./chat/llm-provider-manager');

    // Initialize database manager
    const dbInitialized = await databaseManager.initialize();
    if (dbInitialized) {
      console.log('🗄️ Database manager initialized successfully');
      const dbInfo = databaseManager.getActiveDatabase();
      console.log(`📊 Active databases: ${dbInfo.databases.join(', ')}`);
      if (dbInfo.fallbackMode) {
        console.log('📦 Running in fallback mode (SQLite)');
      }

      // Set global database reference for health checks and legacy compatibility
      if (databaseManager.mongodb) {
        global.db = databaseManager.getMongoDatabase();
        global.databaseManager = databaseManager;
        console.log('🔗 Global database reference set for health checks');
        console.log('🔍 Debug: databaseManager.mongodb exists:', !!databaseManager.mongodb);
        console.log('🔍 Debug: global.db exists:', !!global.db);
        console.log('🔍 Debug: Database name:', global.db ? global.db.databaseName : 'null');
      } else {
        console.warn('⚠️ MongoDB not available, cannot set global database reference');
      }
    } else {
      console.warn('⚠️ Database manager initialization failed');
    }
  } catch (error) {
    console.error('❌ Database manager initialization error:', error.message);
  }
});

// Phase 1 Security Baseline - Centralized error handler (must be last middleware)
app.use(securityErrorHandler);

module.exports = { app, server };
