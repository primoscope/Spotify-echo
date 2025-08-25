/**
 * EchoTune AI - Central Configuration Manager
 * Phase 1 Epic E04: Configuration validation and management
 * 
 * Provides centralized configuration management with:
 * - Environment variable validation
 * - Schema enforcement using Zod
 * - Fail-fast boot validation
 * - Configuration drift detection
 */

const { z } = require('zod');
const fs = require('fs');
const path = require('path');

// Core application configuration schema
const coreConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().min(1000).max(65535).default(3000),
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  SESSION_SECRET: z.string().min(32, 'Session secret must be at least 32 characters'),
});

// Database configuration schema
const databaseConfigSchema = z.object({
  MONGODB_URI: z.string().url('Invalid MongoDB URI'),
  REDIS_URL: z.string().url('Invalid Redis URL').optional(),
});

// Spotify API configuration schema
const spotifyConfigSchema = z.object({
  SPOTIFY_CLIENT_ID: z.string().min(32, 'Invalid Spotify Client ID'),
  SPOTIFY_CLIENT_SECRET: z.string().min(32, 'Invalid Spotify Client Secret'),
  SPOTIFY_REDIRECT_URI: z.string().url('Invalid Spotify redirect URI'),
});

// AI Providers configuration schema
const aiProvidersSchema = z.object({
  OPENAI_API_KEY: z.string().startsWith('sk-').optional(),
  GEMINI_API_KEY: z.string().startsWith('AI').optional(),
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-').optional(),
  PERPLEXITY_API_KEY: z.string().startsWith('pplx-').optional(),
  XAI_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  LLM_PROVIDER: z.enum(['auto', 'openai', 'gemini', 'anthropic', 'perplexity']).default('auto'),
});

// Performance and monitoring configuration schema
const performanceConfigSchema = z.object({
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  ENABLE_TRACING: z.coerce.boolean().default(true),
  COMPRESSION: z.coerce.boolean().default(true),
  CACHE_TTL: z.coerce.number().min(60).default(3600),
  RATE_LIMIT_MAX: z.coerce.number().min(10).default(100),
});

// Security configuration schema
const securityConfigSchema = z.object({
  SSL_ENABLED: z.coerce.boolean().default(false),
  HELMET_ENABLED: z.coerce.boolean().default(true),
  CORS_ORIGINS: z.string().optional(),
  TRUST_PROXY: z.coerce.boolean().default(false),
});

// Feature flags configuration schema
const featureFlagsSchema = z.object({
  DISABLE_REALTIME: z.coerce.boolean().default(false),
  ENABLE_AGENTOPS: z.coerce.boolean().default(false),
  ENABLE_ANALYTICS_DASHBOARD: z.coerce.boolean().default(false),
  ENABLE_DEMO_ROUTES: z.coerce.boolean().default(false),
});

// Complete configuration schema
const configSchema = z.object({
  ...coreConfigSchema.shape,
  ...databaseConfigSchema.shape,
  ...spotifyConfigSchema.shape,
  ...aiProvidersSchema.shape,
  ...performanceConfigSchema.shape,
  ...securityConfigSchema.shape,
  ...featureFlagsSchema.shape,
});

// Configuration validation levels
const VALIDATION_LEVELS = {
  MINIMAL: 'minimal',      // Only core config required
  STANDARD: 'standard',    // Core + database + Spotify
  FULL: 'full',           // All configuration validated
  PRODUCTION: 'production' // Strict production validation
};

class ConfigurationManager {
  constructor(validationLevel = VALIDATION_LEVELS.STANDARD) {
    this.validationLevel = validationLevel;
    this.config = null;
    this.validationErrors = [];
    this.warnings = [];
  }

  /**
   * Initialize and validate configuration
   * Fails fast if required configuration is missing
   */
  initialize() {
    try {
      console.log(`🔧 Initializing configuration (level: ${this.validationLevel})`);
      
      // Load environment variables
      const rawConfig = this.loadEnvironmentVariables();
      
      // Validate based on level
      this.config = this.validateConfiguration(rawConfig);
      
      // Additional production checks
      if (this.validationLevel === VALIDATION_LEVELS.PRODUCTION) {
        this.validateProductionRequirements();
      }
      
      // Log configuration summary
      this.logConfigurationSummary();
      
      console.log('✅ Configuration validation passed');
      return this.config;
      
    } catch (error) {
      console.error('❌ Configuration validation failed:', error.message);
      
      if (this.validationErrors.length > 0) {
        console.error('Validation errors:');
        this.validationErrors.forEach(err => console.error(`  - ${err}`));
      }
      
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
      
      throw error;
    }
  }

  /**
   * Load environment variables from process.env and .env files
   */
  loadEnvironmentVariables() {
    // Load .env file if it exists
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      require('dotenv').config({ path: envPath });
    }
    
    return process.env;
  }

  /**
   * Validate configuration based on validation level
   */
  validateConfiguration(rawConfig) {
    let schemaToValidate;
    
    switch (this.validationLevel) {
      case VALIDATION_LEVELS.MINIMAL:
        schemaToValidate = coreConfigSchema;
        break;
      case VALIDATION_LEVELS.STANDARD:
        schemaToValidate = z.object({
          ...coreConfigSchema.shape,
          ...databaseConfigSchema.shape,
          ...spotifyConfigSchema.shape,
        });
        break;
      case VALIDATION_LEVELS.FULL:
        schemaToValidate = configSchema;
        break;
      case VALIDATION_LEVELS.PRODUCTION:
        schemaToValidate = configSchema;
        break;
      default:
        schemaToValidate = configSchema;
    }
    
    const result = schemaToValidate.safeParse(rawConfig);
    
    if (!result.success) {
      this.validationErrors = result.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      );
      throw new Error('Configuration validation failed');
    }
    
    return result.data;
  }

  /**
   * Additional production-specific validation
   */
  validateProductionRequirements() {
    const prodRequirements = [
      {
        condition: this.config.NODE_ENV === 'production',
        message: 'NODE_ENV must be set to production'
      },
      {
        condition: this.config.JWT_SECRET.length >= 64,
        message: 'JWT_SECRET should be at least 64 characters in production'
      },
      {
        condition: this.config.SESSION_SECRET.length >= 64,
        message: 'SESSION_SECRET should be at least 64 characters in production'
      },
      {
        condition: this.config.SSL_ENABLED === true,
        message: 'SSL should be enabled in production'
      },
      {
        condition: this.config.MONGODB_URI.includes('mongodb+srv://'),
        message: 'Use MongoDB Atlas (mongodb+srv://) in production'
      }
    ];
    
    const failures = prodRequirements.filter(req => !req.condition);
    
    if (failures.length > 0) {
      this.validationErrors.push(...failures.map(f => f.message));
      throw new Error('Production validation requirements not met');
    }
  }

  /**
   * Log configuration summary for debugging
   */
  logConfigurationSummary() {
    const summary = {
      environment: this.config.NODE_ENV,
      port: this.config.PORT,
      database: this.config.MONGODB_URI ? '✅ MongoDB configured' : '❌ No database',
      spotify: this.config.SPOTIFY_CLIENT_ID ? '✅ Spotify configured' : '❌ No Spotify',
      aiProviders: this.getConfiguredAIProviders(),
      security: {
        ssl: this.config.SSL_ENABLED ? '✅ Enabled' : '❌ Disabled',
        helmet: this.config.HELMET_ENABLED ? '✅ Enabled' : '❌ Disabled',
      },
      performance: {
        compression: this.config.COMPRESSION ? '✅ Enabled' : '❌ Disabled',
        tracing: this.config.ENABLE_TRACING ? '✅ Enabled' : '❌ Disabled',
        cacheTimeout: `${this.config.CACHE_TTL}s`,
        rateLimit: `${this.config.RATE_LIMIT_MAX} req/window`
      }
    };
    
    console.log('📋 Configuration Summary:');
    console.log(`  Environment: ${summary.environment}`);
    console.log(`  Port: ${summary.port}`);
    console.log(`  Database: ${summary.database}`);
    console.log(`  Spotify: ${summary.spotify}`);
    console.log(`  AI Providers: ${summary.aiProviders.join(', ') || 'None'}`);
    console.log(`  Security: SSL ${summary.security.ssl}, Helmet ${summary.security.helmet}`);
    console.log(`  Performance: Cache ${summary.performance.cacheTimeout}, Rate Limit ${summary.performance.rateLimit}`);
  }

  /**
   * Get list of configured AI providers
   */
  getConfiguredAIProviders() {
    const providers = [];
    if (this.config.OPENAI_API_KEY) providers.push('OpenAI');
    if (this.config.GEMINI_API_KEY) providers.push('Gemini');
    if (this.config.ANTHROPIC_API_KEY) providers.push('Anthropic');
    if (this.config.PERPLEXITY_API_KEY) providers.push('Perplexity');
    if (this.config.XAI_API_KEY) providers.push('xAI');
    if (this.config.OPENROUTER_API_KEY) providers.push('OpenRouter');
    return providers;
  }

  /**
   * Get configuration value with optional default
   */
  get(key, defaultValue = undefined) {
    if (!this.config) {
      throw new Error('Configuration not initialized. Call initialize() first.');
    }
    
    return this.config[key] ?? defaultValue;
  }

  /**
   * Check if specific feature is enabled
   */
  isFeatureEnabled(feature) {
    const featureKey = `ENABLE_${feature.toUpperCase()}`;
    return this.get(featureKey, false);
  }

  /**
   * Get database configuration
   */
  getDatabaseConfig() {
    return {
      mongodb: this.config.MONGODB_URI,
      redis: this.config.REDIS_URL,
    };
  }

  /**
   * Get Spotify configuration
   */
  getSpotifyConfig() {
    return {
      clientId: this.config.SPOTIFY_CLIENT_ID,
      clientSecret: this.config.SPOTIFY_CLIENT_SECRET,
      redirectUri: this.config.SPOTIFY_REDIRECT_URI,
    };
  }

  /**
   * Get AI providers configuration
   */
  getAIProvidersConfig() {
    return {
      openai: this.config.OPENAI_API_KEY,
      gemini: this.config.GEMINI_API_KEY,
      anthropic: this.config.ANTHROPIC_API_KEY,
      perplexity: this.config.PERPLEXITY_API_KEY,
      xai: this.config.XAI_API_KEY,
      openrouter: this.config.OPENROUTER_API_KEY,
      defaultProvider: this.config.LLM_PROVIDER,
    };
  }

  /**
   * Validate configuration drift (for monitoring)
   */
  detectConfigurationDrift() {
    const currentConfig = this.loadEnvironmentVariables();
    const drift = [];
    
    // Check for changed values
    for (const [key, value] of Object.entries(this.config)) {
      if (currentConfig[key] !== value) {
        drift.push({ key, old: value, new: currentConfig[key] });
      }
    }
    
    return drift;
  }

  /**
   * Export configuration for debugging (without secrets)
   */
  exportSafeConfig() {
    const sensitiveKeys = [
      'JWT_SECRET', 'SESSION_SECRET', 'MONGODB_URI', 'REDIS_URL',
      'SPOTIFY_CLIENT_SECRET', 'OPENAI_API_KEY', 'GEMINI_API_KEY',
      'ANTHROPIC_API_KEY', 'PERPLEXITY_API_KEY', 'XAI_API_KEY'
    ];
    
    const safeConfig = {};
    for (const [key, value] of Object.entries(this.config)) {
      if (sensitiveKeys.includes(key)) {
        safeConfig[key] = value ? '***REDACTED***' : undefined;
      } else {
        safeConfig[key] = value;
      }
    }
    
    return safeConfig;
  }
}

// Create singleton instance
let configManager = null;

function createConfigManager(validationLevel = VALIDATION_LEVELS.STANDARD) {
  if (!configManager) {
    configManager = new ConfigurationManager(validationLevel);
  }
  return configManager;
}

function getConfig() {
  if (!configManager) {
    throw new Error('Configuration manager not initialized. Call createConfigManager() first.');
  }
  return configManager;
}

module.exports = {
  ConfigurationManager,
  createConfigManager,
  getConfig,
  VALIDATION_LEVELS,
  configSchema,
};