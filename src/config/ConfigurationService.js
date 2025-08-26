/**
 * Unified Configuration System
 * Provides centralized configuration management with schema validation
 */

const { z } = require('zod');

// Configuration schemas
const serverConfigSchema = z.object({
  port: z.number().min(1000).max(65535).default(3000),
  host: z.string().default('localhost'),
  environment: z.enum(['development', 'production', 'test']).default('development'),
  maxRequestSize: z.string().default('10mb'),
  sessionSecret: z.string().min(32),
  cors: z.object({
    origin: z.array(z.string()).default(['http://localhost:3000']),
    credentials: z.boolean().default(true)
  }).default({})
});

const databaseConfigSchema = z.object({
  mongodb: z.object({
    uri: z.string().url(),
    options: z.object({
      useUnifiedTopology: z.boolean().default(true),
      maxPoolSize: z.number().default(10),
      serverSelectionTimeoutMS: z.number().default(5000)
    }).default({})
  }).optional(),
  redis: z.object({
    url: z.string().url(),
    maxRetries: z.number().default(3),
    retryDelayOnFailover: z.number().default(100)
  }).optional()
});

const spotifyConfigSchema = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  redirectUri: z.string().url(),
  scopes: z.array(z.string()).default([
    'user-read-private',
    'user-read-email',
    'user-top-read',
    'user-read-recently-played',
    'playlist-modify-public',
    'playlist-modify-private'
  ])
});

const aiProvidersConfigSchema = z.object({
  openai: z.object({
    apiKey: z.string().optional(),
    model: z.string().default('gpt-3.5-turbo'),
    maxTokens: z.number().default(4096),
    temperature: z.number().min(0).max(2).default(0.7)
  }).optional(),
  gemini: z.object({
    apiKey: z.string().optional(),
    model: z.string().default('gemini-pro'),
    useVertex: z.boolean().default(false)
  }).optional(),
  anthropic: z.object({
    apiKey: z.string().optional(),
    model: z.string().default('claude-3-sonnet-20240229')
  }).optional(),
  provider: z.enum(['openai', 'gemini', 'anthropic', 'mock']).default('mock')
});

const featuresConfigSchema = z.object({
  realtime: z.boolean().default(true),
  tracing: z.boolean().default(false),
  agentops: z.boolean().default(false),
  mcp: z.boolean().default(true),
  analytics: z.boolean().default(true)
});

const securityConfigSchema = z.object({
  rateLimit: z.object({
    global: z.object({
      windowMs: z.number().default(15 * 60 * 1000), // 15 minutes
      max: z.number().default(1000)
    }).default({}),
    api: z.object({
      windowMs: z.number().default(15 * 60 * 1000),
      max: z.number().default(100)
    }).default({}),
    auth: z.object({
      windowMs: z.number().default(15 * 60 * 1000),
      max: z.number().default(5)
    }).default({})
  }).default({}),
  session: z.object({
    secure: z.boolean().default(false),
    httpOnly: z.boolean().default(true),
    maxAge: z.number().default(7 * 24 * 60 * 60 * 1000), // 7 days
    sameSite: z.enum(['strict', 'lax', 'none']).default('lax')
  }).default({})
});

// Main configuration schema
const configSchema = z.object({
  server: serverConfigSchema,
  database: databaseConfigSchema,
  spotify: spotifyConfigSchema,
  ai: aiProvidersConfigSchema,
  features: featuresConfigSchema,
  security: securityConfigSchema
});

class ConfigurationService {
  constructor() {
    this.config = null;
    this.validationErrors = [];
  }

  /**
   * Load and validate configuration from environment variables
   */
  load() {
    const rawConfig = this.buildConfigFromEnv();
    
    try {
      this.config = configSchema.parse(rawConfig);
      this.validationErrors = [];
      return this.config;
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.validationErrors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        throw new Error(`Configuration validation failed: ${this.validationErrors.length} errors`);
      }
      throw error;
    }
  }

  /**
   * Build configuration object from environment variables
   */
  buildConfigFromEnv() {
    return {
      server: {
        port: parseInt(process.env.PORT || '3000', 10),
        host: process.env.HOST || 'localhost',
        environment: process.env.NODE_ENV || 'development',
        maxRequestSize: process.env.MAX_REQUEST_SIZE || '10mb',
        sessionSecret: process.env.SESSION_SECRET || this.generateSessionSecret(),
        cors: {
          origin: this.parseArray(process.env.CORS_ORIGINS, ['http://localhost:3000']),
          credentials: process.env.CORS_CREDENTIALS !== 'false'
        }
      },
      database: {
        mongodb: process.env.MONGODB_URI ? {
          uri: process.env.MONGODB_URI,
          options: {
            useUnifiedTopology: true,
            maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10', 10),
            serverSelectionTimeoutMS: parseInt(process.env.MONGODB_TIMEOUT || '5000', 10)
          }
        } : undefined,
        redis: process.env.REDIS_URL ? {
          url: process.env.REDIS_URL,
          maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3', 10),
          retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY || '100', 10)
        } : undefined
      },
      spotify: {
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        redirectUri: process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/auth/callback',
        scopes: this.parseArray(process.env.SPOTIFY_SCOPES)
      },
      ai: {
        openai: process.env.OPENAI_API_KEY ? {
          apiKey: process.env.OPENAI_API_KEY,
          model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
          maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4096', 10),
          temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7')
        } : undefined,
        gemini: process.env.GOOGLE_GEMINI_API_KEY ? {
          apiKey: process.env.GOOGLE_GEMINI_API_KEY,
          model: process.env.GEMINI_MODEL || 'gemini-pro',
          useVertex: process.env.GEMINI_USE_VERTEX === 'true'
        } : undefined,
        anthropic: process.env.ANTHROPIC_API_KEY ? {
          apiKey: process.env.ANTHROPIC_API_KEY,
          model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229'
        } : undefined,
        provider: process.env.LLM_PROVIDER || 'mock'
      },
      features: {
        realtime: process.env.ENABLE_REALTIME !== 'false',
        tracing: process.env.ENABLE_TRACING === 'true',
        agentops: process.env.ENABLE_AGENTOPS === 'true',
        mcp: process.env.ENABLE_MCP !== 'false',
        analytics: process.env.ENABLE_ANALYTICS !== 'false'
      },
      security: {
        rateLimit: {
          global: {
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || (15 * 60 * 1000).toString(), 10),
            max: parseInt(process.env.RATE_LIMIT_MAX || '1000', 10)
          },
          api: {
            windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW || (15 * 60 * 1000).toString(), 10),
            max: parseInt(process.env.API_RATE_LIMIT_MAX || '100', 10)
          },
          auth: {
            windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW || (15 * 60 * 1000).toString(), 10),
            max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '5', 10)
          }
        },
        session: {
          secure: process.env.SESSION_SECURE === 'true',
          httpOnly: process.env.SESSION_HTTP_ONLY !== 'false',
          maxAge: parseInt(process.env.SESSION_MAX_AGE || (7 * 24 * 60 * 60 * 1000).toString(), 10),
          sameSite: process.env.SESSION_SAME_SITE || 'lax'
        }
      }
    };
  }

  /**
   * Get configuration value by path
   */
  get(path) {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call load() first.');
    }
    
    return path.split('.').reduce((obj, key) => obj?.[key], this.config);
  }

  /**
   * Check if configuration is valid
   */
  isValid() {
    return this.config !== null && this.validationErrors.length === 0;
  }

  /**
   * Get validation errors
   */
  getValidationErrors() {
    return this.validationErrors;
  }

  /**
   * Helper to parse array from environment variable
   */
  parseArray(envVar, defaultValue = []) {
    if (!envVar) return defaultValue;
    return envVar.split(',').map(item => item.trim()).filter(Boolean);
  }

  /**
   * Generate session secret if not provided
   */
  generateSessionSecret() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET environment variable is required in production');
    }
    return 'dev-session-secret-change-in-production';
  }
}

// Export singleton instance
let configService = null;

function getConfigService() {
  if (!configService) {
    configService = new ConfigurationService();
  }
  return configService;
}

module.exports = {
  ConfigurationService,
  getConfigService,
  configSchema
};