/**
 * Centralized environment variable loading & validation.
 * Uses a lightweight custom validator to avoid extra deps. Replace with 'env-var' if preferred.
 */
require('dotenv').config();

const schema = {
  // Core infrastructure
  MONGODB_URI: { required: true, desc: 'MongoDB connection string' },
  REDIS_URL: { required: false, desc: 'Redis cache / session store (recommended in production)' },
  PORT: { required: false, default: 3000, desc: 'HTTP server port (legacy/local only)' },
  NODE_ENV: { required: false, default: 'development', allowed: ['development', 'production', 'test'] },

  // Security / Auth
  JWT_SECRET: { required: true, desc: 'JWT signing secret' },
  SESSION_SECRET: { required: false, desc: 'Session secret if sessions used' },
  ENCRYPTION_KEY: { required: false, length: 32, desc: 'Key material for encryption service (32 chars recommended)' },

  // Third-party AI / APIs
  OPENAI_API_KEY: { required: false },
  GOOGLE_AI_API_KEY: { required: false },
  GEMINI_API_KEY: { required: false },
  GEMINI_API_KEY_1: { required: false },
  GEMINI_API_KEY_2: { required: false },
  GEMINI_API_KEY_3: { required: false },
  GEMINI_API_KEY_4: { required: false },
  GEMINI_API_KEY_5: { required: false },
  GEMINI_API_KEY_6: { required: false },
  ANTHROPIC_API_KEY: { required: false },
  PERPLEXITY_API_KEY: { required: false },
  OPENROUTER_API_KEY: { required: false },
  OPENROUTER_API_KEY_1: { required: false },
  OPENROUTER_API_KEY_2: { required: false },
  OPENROUTER_API_KEY_3: { required: false },
  XAI_API_KEY: { required: false },
  AZURE_OPENAI_API_KEY: { required: false },
  DEEPSEEK_API_KEY: { required: false },

  // Spotify Integration
  SPOTIFY_CLIENT_ID: { required: true },
  SPOTIFY_CLIENT_SECRET: { required: true },
  SPOTIFY_REDIRECT_URI: { required: false },

  // Observability / Operations
  AGENTOPS_API_KEY: { required: false },
  SENTRY_DSN: { required: false },
  MCP_PORT: { required: false, default: 3001 },
  MCP_SERVER_NAME: { required: false, default: 'mcpHealth' },

  // Browser automation / MCP optional
  BROWSERBASE_API_KEY: { required: false },
  BROWSERBASE_PROJECT_ID: { required: false },
  BRAVE_API_KEY: { required: false },

  // Web / CORS
  ALLOWED_ORIGINS: { required: false, desc: 'Comma-separated list of allowed origins' },
  FRONTEND_URL: { required: false },
  DOMAIN: { required: false },

  // Feature Flags for Vercel deployment optimization
  DISABLE_REALTIME: { required: false, allowed: ['true', 'false'], default: 'false', desc: 'Disable Socket.IO for serverless environments' },
  ENABLE_TRACING: { required: false, allowed: ['true', 'false'], default: 'true', desc: 'Enable OpenTelemetry tracing' },
  ENABLE_AGENTOPS: { required: false, allowed: ['true', 'false'], desc: 'Enable AgentOps telemetry when API key present' },

  // Development & Deployment
  GITHUB_TOKEN: { required: false },
  DIGITALOCEAN_API_TOKEN: { required: false },
  SSL_ENABLED: { required: false, allowed: ['true', 'false'] },
  ENABLE_ANALYTICS_DASHBOARD: { required: false, allowed: ['true', 'false'] },
  ENABLE_DEMO_ROUTES: { required: false, allowed: ['0', '1'] },
  COMPRESSION: { required: false, allowed: ['true', 'false'] },

  // Database additional
  MONGODB_DATABASE: { required: false },
  REDIS_PASSWORD: { required: false },
  SQLITE_DB_PATH: { required: false },

  // API Configuration
  LOG_LEVEL: { required: false, allowed: ['error', 'warn', 'info', 'debug'], default: 'info' },
  RATE_LIMIT_MAX: { required: false },
  CACHE_TTL: { required: false },

  // Google Cloud / Vertex AI (Workload Identity Federation)
  GCP_PROJECT_ID: { required: false, desc: 'Google Cloud project ID for Vertex AI operations' },
  GCP_REGION: { required: false, default: 'us-central1', desc: 'Default GCP region for Vertex AI' },
  WIF_PROVIDER: { required: false, desc: 'Full Workload Identity Provider resource name' },
  GCP_SERVICE_ACCOUNT: { required: false, desc: 'Service account email used via WIF' },
  VERTEX_MODEL_ID: { required: false, desc: 'Optional Vertex AI model ID used in validation workflow' }
};

// Validation
function validate(schema, source) {
  const errors = [];
  const warnings = [];
  const out = {};

  for (const [key, spec] of Object.entries(schema)) {
    let val = source[key];

    if ((val === undefined || val === '') && spec.default !== undefined) {
      val = spec.default;
    }

    if (spec.required && (val === undefined || val === '')) {
      errors.push(`Missing required env var: ${key}${spec.desc ? ' (' + spec.desc + ')' : ''}`);
      continue;
    }

    if (val !== undefined && spec.allowed && !spec.allowed.includes(val)) {
      errors.push(`Invalid value for ${key}. Allowed: ${spec.allowed.join(', ')}, got: ${val}`);
    }

    if (val && spec.length && val.length !== spec.length) {
      warnings.push(`Invalid length for ${key}. Expected length ${spec.length}, got ${val.length}`);
    }

    out[key] = val;
  }

  if (errors.length) {
    // Fail fast in production; warn in development
    if (source.NODE_ENV === 'production') {
      console.error('Environment validation failed:\n' + errors.join('\n'));
      process.exit(1);
    } else {
      console.warn('Environment validation errors:\n' + errors.join('\n'));
    }
  }

  if (warnings.length) {
    console.warn('Environment validation warnings:\n' + warnings.join('\n'));
  }

  // Derived convenience fields
  out.IS_PROD = out.NODE_ENV === 'production';
  out.IS_DEV = out.NODE_ENV === 'development';
  out.ALLOWED_ORIGINS_ARRAY = out.ALLOWED_ORIGINS
    ? out.ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
    : null;

  return out;
}

const ENV = validate(schema, process.env);
module.exports = { ENV, schema, validate };