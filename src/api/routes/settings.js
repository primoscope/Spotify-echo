// Enhanced Settings API - Comprehensive Configuration Management
// Handles both frontend and backend settings with real-time updates
// Added comprehensive LLM provider configuration, Spotify integration, and database management

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

class SettingsManager {
  constructor() {
    this.configPath = path.join(__dirname, '..', '..', '.env');
    this.settingsSchema = this.getSettingsSchema();
  }

  getSettingsSchema() {
    return {
      application: {
        name: 'Application Settings',
        description: 'Core application configuration',
        settings: {
          NODE_ENV: {
            type: 'select',
            label: 'Environment',
            options: ['development', 'production', 'staging'],
            default: 'production',
            required: true,
          },
          PORT: {
            type: 'number',
            label: 'Port',
            min: 1000,
            max: 65535,
            default: 3000,
            required: true,
          },
          DOMAIN: {
            type: 'text',
            label: 'Domain',
            placeholder: 'your-domain.com',
            required: true,
          },
          LOG_LEVEL: {
            type: 'select',
            label: 'Log Level',
            options: ['error', 'warn', 'info', 'debug'],
            default: 'info',
          },
        },
      },
      llm_providers: {
        name: 'AI/LLM Providers',
        description: 'Configure AI language model providers',
        settings: {
          DEFAULT_LLM_PROVIDER: {
            type: 'select',
            label: 'Default Provider',
            options: ['openai', 'gemini', 'openrouter', 'anthropic', 'mock'],
            default: 'openai',
            required: true,
          },
          OPENAI_API_KEY: {
            type: 'password',
            label: 'OpenAI API Key',
            placeholder: 'sk-...',
            provider: 'openai',
          },
          OPENAI_MODEL: {
            type: 'select',
            label: 'OpenAI Model',
            options: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo', 'gpt-3.5-turbo-16k'],
            default: 'gpt-4-turbo',
            provider: 'openai',
          },
          GEMINI_API_KEY: {
            type: 'password',
            label: 'Gemini API Key',
            placeholder: 'your_gemini_key',
            provider: 'gemini',
          },
          GEMINI_MODEL: {
            type: 'select',
            label: 'Gemini Model',
            options: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'],
            default: 'gemini-1.5-pro',
            provider: 'gemini',
          },
          OPENROUTER_API_KEY: {
            type: 'password',
            label: 'OpenRouter API Key',
            placeholder: 'sk-or-...',
            provider: 'openrouter',
          },
          OPENROUTER_MODEL: {
            type: 'select',
            label: 'OpenRouter Model',
            options: [
              'anthropic/claude-3.5-sonnet',
              'anthropic/claude-3-opus',
              'anthropic/claude-3-sonnet',
              'anthropic/claude-3-haiku',
              'openai/gpt-4-turbo',
              'openai/gpt-4',
              'google/gemini-pro',
              'meta-llama/llama-3-70b-instruct',
              'mistralai/mixtral-8x7b-instruct',
            ],
            default: 'anthropic/claude-3.5-sonnet',
            provider: 'openrouter',
          },
          ANTHROPIC_API_KEY: {
            type: 'password',
            label: 'Anthropic API Key',
            placeholder: 'sk-ant-...',
            provider: 'anthropic',
          },
          ANTHROPIC_MODEL: {
            type: 'select',
            label: 'Anthropic Model',
            options: [
              'claude-3-opus-20240229',
              'claude-3-sonnet-20240229',
              'claude-3-haiku-20240307',
            ],
            default: 'claude-3-sonnet-20240229',
            provider: 'anthropic',
          },
        },
      },
      database: {
        name: 'Database Configuration',
        description: 'MongoDB and caching settings',
        settings: {
          DATABASE_TYPE: {
            type: 'select',
            label: 'Primary Database',
            options: ['mongodb', 'sqlite'],
            default: 'mongodb',
          },
          MONGODB_URI: {
            type: 'password',
            label: 'MongoDB URI',
            placeholder: 'mongodb+srv://...',
            database: 'mongodb',
          },
          MONGODB_DB_NAME: {
            type: 'text',
            label: 'Database Name',
            default: 'echotune',
            database: 'mongodb',
          },
          ENABLE_MONGODB_ANALYTICS: {
            type: 'boolean',
            label: 'Enable Analytics',
            default: true,
            database: 'mongodb',
          },
          REDIS_URL: {
            type: 'text',
            label: 'Redis URL',
            placeholder: 'redis://localhost:6379',
            cache: true,
          },
          REDIS_PASSWORD: {
            type: 'password',
            label: 'Redis Password',
            cache: true,
          },
          CACHE_ENABLED: {
            type: 'boolean',
            label: 'Enable Caching',
            default: true,
          },
        },
      },
      spotify: {
        name: 'Spotify Integration',
        description: 'Spotify API configuration',
        settings: {
          SPOTIFY_CLIENT_ID: {
            type: 'text',
            label: 'Client ID',
            required: true,
            placeholder: 'your_spotify_client_id',
          },
          SPOTIFY_CLIENT_SECRET: {
            type: 'password',
            label: 'Client Secret',
            required: true,
            placeholder: 'your_spotify_client_secret',
          },
          SPOTIFY_REDIRECT_URI: {
            type: 'text',
            label: 'Redirect URI',
            placeholder: 'https://your-domain.com/auth/callback',
          },
        },
      },
      security: {
        name: 'Security & SSL',
        description: 'Security configuration and SSL settings',
        settings: {
          SSL_ENABLED: {
            type: 'boolean',
            label: 'Enable SSL',
            default: true,
          },
          FORCE_HTTPS: {
            type: 'boolean',
            label: 'Force HTTPS',
            default: true,
          },
          ENABLE_SECURITY_HEADERS: {
            type: 'boolean',
            label: 'Security Headers',
            default: true,
          },
          SESSION_SECRET: {
            type: 'password',
            label: 'Session Secret',
            placeholder: 'generate_random_string',
            required: true,
          },
          JWT_SECRET: {
            type: 'password',
            label: 'JWT Secret',
            placeholder: 'generate_random_string',
            required: true,
          },
          RATE_LIMIT_ENABLED: {
            type: 'boolean',
            label: 'Enable Rate Limiting',
            default: true,
          },
          API_RATE_LIMIT: {
            type: 'text',
            label: 'API Rate Limit',
            placeholder: '50r/s',
            default: '50r/s',
          },
        },
      },
      performance: {
        name: 'Performance & Monitoring',
        description: 'Performance optimization and monitoring',
        settings: {
          COMPRESSION: {
            type: 'boolean',
            label: 'Enable Compression',
            default: true,
          },
          METRICS_ENABLED: {
            type: 'boolean',
            label: 'Enable Metrics',
            default: true,
          },
          HEALTH_CHECK_ENABLED: {
            type: 'boolean',
            label: 'Enable Health Checks',
            default: true,
          },
          ENABLE_ANALYTICS_DASHBOARD: {
            type: 'boolean',
            label: 'Analytics Dashboard',
            default: true,
          },
          ENABLE_REALTIME_UPDATES: {
            type: 'boolean',
            label: 'Real-time Updates',
            default: true,
          },
        },
      },
    };
  }

  async getCurrentSettings() {
    try {
      const envContent = await fs.readFile(this.configPath, 'utf8');
      const settings = {};

      envContent.split('\n').forEach((line) => {
        line = line.trim();
        if (line && !line.startsWith('#')) {
          const [key, ...valueParts] = line.split('=');
          if (key && valueParts.length > 0) {
            settings[key] = valueParts.join('=');
          }
        }
      });

      return settings;
    } catch (error) {
      console.error('Error reading settings:', error);
      return {};
    }
  }

  async updateSettings(newSettings) {
    try {
      const currentSettings = await this.getCurrentSettings();
      const updatedSettings = { ...currentSettings, ...newSettings };

      let envContent = '';
      Object.entries(updatedSettings).forEach(([key, value]) => {
        envContent += `${key}=${value}\n`;
      });

      await fs.writeFile(this.configPath, envContent);
      return { success: true, message: 'Settings updated successfully' };
    } catch (error) {
      console.error('Error updating settings:', error);
      return { success: false, error: error.message };
    }
  }

  validateSettings(settings) {
    const errors = [];

    Object.entries(this.settingsSchema).forEach(([_categoryKey, category]) => {
      Object.entries(category.settings).forEach(([settingKey, setting]) => {
        const value = settings[settingKey];

        if (setting.required && (!value || value.trim() === '')) {
          errors.push(`${setting.label} is required`);
        }

        if (setting.type === 'number' && value) {
          const numValue = parseInt(value);
          if (isNaN(numValue)) {
            errors.push(`${setting.label} must be a number`);
          } else {
            if (setting.min && numValue < setting.min) {
              errors.push(`${setting.label} must be at least ${setting.min}`);
            }
            if (setting.max && numValue > setting.max) {
              errors.push(`${setting.label} must be at most ${setting.max}`);
            }
          }
        }

        if (setting.type === 'select' && value && !setting.options.includes(value)) {
          errors.push(`${setting.label} must be one of: ${setting.options.join(', ')}`);
        }
      });
    });

    return errors;
  }

  async testProviderConnection(provider, settings) {
    try {
      // Test different providers
      switch (provider) {
        case 'openai':
          return await this.testOpenAI(settings);
        case 'gemini':
          return await this.testGemini(settings);
        case 'openrouter':
          return await this.testOpenRouter(settings);
        case 'anthropic':
          return await this.testAnthropic(settings);
        default:
          return { success: false, error: `Unknown provider: ${provider}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async testOpenAI(settings) {
    const apiKey = settings.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return { success: false, error: 'OpenAI API key is required' };
    }

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      
      if (response.ok) {
        return { success: true, message: 'OpenAI connection successful' };
      } else {
        const error = await response.text();
        return { success: false, error: `OpenAI API error: ${error}` };
      }
    } catch (error) {
      return { success: false, error: `Connection failed: ${error.message}` };
    }
  }

  async testGemini(settings) {
    const apiKey = settings.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { success: false, error: 'Gemini API key is required' };
    }

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
      
      if (response.ok) {
        return { success: true, message: 'Gemini connection successful' };
      } else {
        const error = await response.text();
        return { success: false, error: `Gemini API error: ${error}` };
      }
    } catch (error) {
      return { success: false, error: `Connection failed: ${error.message}` };
    }
  }

  async testOpenRouter(settings) {
    const apiKey = settings.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return { success: false, error: 'OpenRouter API key is required' };
    }

    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      
      if (response.ok) {
        return { success: true, message: 'OpenRouter connection successful' };
      } else {
        const error = await response.text();
        return { success: false, error: `OpenRouter API error: ${error}` };
      }
    } catch (error) {
      return { success: false, error: `Connection failed: ${error.message}` };
    }
  }

  async testAnthropic(settings) {
    const apiKey = settings.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return { success: false, error: 'Anthropic API key is required' };
    }

    // Anthropic doesn't have a simple models endpoint, so we test with a basic request
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hello' }]
        })
      });
      
      if (response.ok || response.status === 400) { // 400 is ok for auth test
        return { success: true, message: 'Anthropic connection successful' };
      } else {
        const error = await response.text();
        return { success: false, error: `Anthropic API error: ${error}` };
      }
    } catch (error) {
      return { success: false, error: `Connection failed: ${error.message}` };
    }
  }
}

const settingsManager = new SettingsManager();

// Get settings schema
router.get('/schema', (req, res) => {
  res.json(settingsManager.settingsSchema);
});

// Get current settings (sensitive values masked)
router.get('/current', async (req, res) => {
  try {
    const settings = await settingsManager.getCurrentSettings();

    // Mask sensitive values
    const maskedSettings = {};
    Object.entries(settings).forEach(([key, value]) => {
      if (key.includes('SECRET') || key.includes('PASSWORD') || key.includes('KEY')) {
        maskedSettings[key] = value ? '********' : '';
      } else {
        maskedSettings[key] = value;
      }
    });

    res.json({ success: true, settings: maskedSettings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update settings
router.post('/update', async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings) {
      return res.status(400).json({ success: false, error: 'Settings are required' });
    }

    // Validate settings
    const validationErrors = settingsManager.validateSettings(settings);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: validationErrors,
      });
    }

    // Update settings
    const result = await settingsManager.updateSettings(settings);

    if (result.success) {
      res.json({
        success: true,
        message: 'Settings updated successfully. Restart required for some changes.',
        requiresRestart: true,
      });
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test provider connection
router.post('/test-provider', async (req, res) => {
  try {
    const { provider, settings } = req.body;

    if (!provider) {
      return res.status(400).json({ success: false, error: 'Provider is required' });
    }

    const result = await settingsManager.testProviderConnection(provider, settings || {});
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get system status
router.get('/status', async (req, res) => {
  try {
    const status = {
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '2.1.0',
      providers: {
        openai: !!process.env.OPENAI_API_KEY,
        gemini: !!process.env.GEMINI_API_KEY,
        openrouter: !!process.env.OPENROUTER_API_KEY,
        anthropic: !!process.env.ANTHROPIC_API_KEY,
      },
      database: {
        mongodb: !!process.env.MONGODB_URI,
        redis: !!process.env.REDIS_URL,
        sqlite: true, // Always available as fallback
      },
      features: {
        ssl: process.env.SSL_ENABLED === 'true',
        compression: process.env.COMPRESSION === 'true',
        metrics: process.env.METRICS_ENABLED === 'true',
        analytics: process.env.ENABLE_ANALYTICS_DASHBOARD === 'true',
      },
    };

    res.json({ success: true, status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Main settings routes for frontend

// GET /api/settings - Get current settings
router.get('/', async (req, res) => {
  try {
    const settings = await settingsManager.getCurrentSettings();

    // Mask sensitive values
    const maskedSettings = {};
    Object.entries(settings).forEach(([key, value]) => {
      if (key.includes('SECRET') || key.includes('PASSWORD') || key.includes('KEY')) {
        maskedSettings[key] = value ? '********' : '';
      } else {
        maskedSettings[key] = value;
      }
    });

    res.json({ success: true, settings: maskedSettings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/settings - Update settings
router.post('/', async (req, res) => {
  try {
    const settings = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, error: 'Settings object is required' });
    }

    // Validate settings
    const validationErrors = settingsManager.validateSettings(settings);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: validationErrors,
      });
    }

    // Update settings
    const result = await settingsManager.updateSettings(settings);

    if (result.success) {
      res.json({
        success: true,
        message: 'Settings updated successfully. Some changes may require restart.',
        requiresRestart: true,
      });
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Enhanced Configuration Management
// GET /api/settings/config - Get application configuration
router.get('/config', async (req, res) => {
  try {
    // Default configuration
    const defaultConfig = {
      // Music Settings
      recommendationEngine: 'hybrid',
      audioQuality: 'high',
      discoveryMode: 'smart',

      // UI Settings
      theme: 'auto',
      animations: true,
      compactMode: false,

      // Performance Settings
      cacheSize: 100,
      requestTimeout: 30,
      batchSize: 20,

      // Privacy Settings
      anonymousMode: false,
      dataCollection: true,
      analytics: true,

      // MCP Server Settings
      mcpEnabled: true,
      mcpServers: {
        mermaid: true,
        filesystem: true,
        browserbase: false,
        spotify: true,
        github: false,
        sqlite: true,
        memory: true,
        postgres: false,
        'brave-search': false,
        'screenshot-website': true,
        browser: true,
        'sequential-thinking': true,
      },
    };

    // Try to read saved configuration
    try {
      const fs = require('fs');
      const configPath = path.join(__dirname, '..', '..', '..', 'config', 'app-config.json');

      if (fs.existsSync(configPath)) {
        const savedConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const mergedConfig = { ...defaultConfig, ...savedConfig };
        return res.json({ success: true, config: mergedConfig });
      }
    } catch (error) {
      console.log('No saved configuration found, using defaults');
    }

    res.json({ success: true, config: defaultConfig });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/settings/config - Update application configuration
router.put('/config', async (req, res) => {
  try {
    const { config } = req.body;

    if (!config) {
      return res.status(400).json({ success: false, error: 'Configuration is required' });
    }

    // Ensure config directory exists
    const fs = require('fs');
    const configDir = path.join(__dirname, '..', '..', '..', 'config');
    const configPath = path.join(configDir, 'app-config.json');

    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // Save configuration
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    // Log configuration update
    console.log('Configuration updated:', {
      timestamp: new Date().toISOString(),
      changes: Object.keys(config),
    });

    res.json({
      success: true,
      message: 'Configuration saved successfully',
      config: config,
    });
  } catch (error) {
    console.error('Error saving configuration:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mobile Settings Management
// PUT /api/settings/mobile - Update mobile/responsive configuration
router.put('/mobile', async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings) {
      return res.status(400).json({ success: false, error: 'Mobile settings are required' });
    }

    const fs = require('fs');
    const configDir = path.join(__dirname, '..', '..', '..', 'config');
    const configPath = path.join(configDir, 'mobile-config.json');

    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // Save mobile configuration
    fs.writeFileSync(configPath, JSON.stringify(settings, null, 2));

    console.log('Mobile settings updated:', {
      timestamp: new Date().toISOString(),
      settings: Object.keys(settings),
    });

    res.json({
      success: true,
      message: 'Mobile settings saved successfully',
      settings: settings,
    });
  } catch (error) {
    console.error('Error saving mobile settings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/settings/mobile - Get mobile/responsive configuration
router.get('/mobile', async (req, res) => {
  try {
    const fs = require('fs');
    const configPath = path.join(__dirname, '..', '..', '..', 'config', 'mobile-config.json');

    // Default mobile settings
    const defaultSettings = {
      touchOptimization: true,
      gestureNavigation: true,
      compactUI: true,
      fastScrolling: true,
      autoRotation: false,
      mobileFriendlyFonts: true,
      reduceAnimations: false,
      highContrastMode: false,
      offlineMode: false,
      dataSaver: false,
    };

    if (fs.existsSync(configPath)) {
      const savedSettings = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const mergedSettings = { ...defaultSettings, ...savedSettings };
      return res.json({ success: true, settings: mergedSettings });
    }

    res.json({ success: true, settings: defaultSettings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate random secrets
router.get('/generate-secret', (req, res) => {
  const crypto = require('crypto');
  const secret = crypto.randomBytes(32).toString('hex');
  res.json({ success: true, secret });
});

// Comprehensive LLM Provider Configuration Routes
// GET /api/settings/llm-providers - Get LLM provider configurations
router.get('/llm-providers', async (req, res) => {
  try {
    const providers = {
      openai: {
        name: 'OpenAI',
        enabled: !!process.env.OPENAI_API_KEY,
        apiKey: process.env.OPENAI_API_KEY ? '***hidden***' : '',
        baseURL: 'https://api.openai.com/v1',
        models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
        defaultModel: process.env.OPENAI_MODEL || 'gpt-4o',
        parameters: {
          temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
          maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 4096,
          topP: parseFloat(process.env.OPENAI_TOP_P) || 1.0,
          frequencyPenalty: parseFloat(process.env.OPENAI_FREQUENCY_PENALTY) || 0.0,
          presencePenalty: parseFloat(process.env.OPENAI_PRESENCE_PENALTY) || 0.0,
        },
      },
      gemini: {
        name: 'Google Gemini',
        enabled: !!process.env.GEMINI_API_KEY,
        apiKey: process.env.GEMINI_API_KEY ? '***hidden***' : '',
        baseURL: 'https://generativelanguage.googleapis.com/v1',
        models: ['gemini-2.0-flash-exp', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
        defaultModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
        parameters: {
          temperature: parseFloat(process.env.GEMINI_TEMPERATURE) || 0.7,
          maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS) || 4096,
          topK: parseInt(process.env.GEMINI_TOP_K) || 40,
          topP: parseFloat(process.env.GEMINI_TOP_P) || 0.95,
        },
      },
      openrouter: {
        name: 'OpenRouter',
        enabled: !!process.env.OPENROUTER_API_KEY,
        apiKey: process.env.OPENROUTER_API_KEY ? '***hidden***' : '',
        baseURL: 'https://openrouter.ai/api/v1',
        models: [
          'anthropic/claude-3.5-sonnet',
          'anthropic/claude-3-opus',
          'openai/gpt-4o',
          'google/gemini-pro-1.5',
          'meta-llama/llama-3.1-405b-instruct',
        ],
        defaultModel: process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet',
        parameters: {
          temperature: parseFloat(process.env.OPENROUTER_TEMPERATURE) || 0.7,
          maxTokens: parseInt(process.env.OPENROUTER_MAX_TOKENS) || 4096,
          topP: parseFloat(process.env.OPENROUTER_TOP_P) || 1.0,
        },
        siteURL: process.env.OPENROUTER_SITE_URL || '',
        appName: process.env.OPENROUTER_APP_NAME || 'EchoTune AI',
      },
    };

    res.json({
      success: true,
      providers,
      currentProvider: process.env.DEFAULT_LLM_PROVIDER || 'gemini',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/settings/llm-providers - Update LLM provider configurations
router.put('/llm-providers', async (req, res) => {
  try {
    const { providers } = req.body;

    if (!providers) {
      return res.status(400).json({ success: false, error: 'Providers configuration required' });
    }

    // Build environment variable updates
    const envUpdates = {};

    Object.entries(providers).forEach(([providerId, config]) => {
      const prefix = providerId.toUpperCase();
      
      if (config.apiKey && config.apiKey !== '***hidden***') {
        envUpdates[`${prefix}_API_KEY`] = config.apiKey;
      }
      
      if (config.defaultModel) {
        envUpdates[`${prefix}_MODEL`] = config.defaultModel;
      }

      if (config.parameters) {
        Object.entries(config.parameters).forEach(([param, value]) => {
          const envKey = `${prefix}_${param.toUpperCase().replace(/([A-Z])/g, '_$1')}`;
          envUpdates[envKey] = value.toString();
        });
      }

      if (config.siteURL) {
        envUpdates[`${prefix}_SITE_URL`] = config.siteURL;
      }

      if (config.appName) {
        envUpdates[`${prefix}_APP_NAME`] = config.appName;
      }
    });

    // Update settings
    const result = await settingsManager.updateSettings(envUpdates);

    if (result.success) {
      // Also update process.env for immediate effect
      Object.entries(envUpdates).forEach(([key, value]) => {
        process.env[key] = value;
      });

      res.json({
        success: true,
        message: 'LLM provider settings updated successfully',
      });
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/settings/test-llm-provider - Test specific LLM provider
router.post('/test-llm-provider', async (req, res) => {
  try {
    const { provider, config } = req.body;

    if (!provider) {
      return res.status(400).json({ success: false, error: 'Provider is required' });
    }

    const testResult = await settingsManager.testProviderConnection(provider, config);
    res.json(testResult);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Spotify Integration Configuration Routes
// GET /api/settings/spotify - Get Spotify configuration
router.get('/spotify', (req, res) => {
  try {
    const config = {
      clientId: process.env.SPOTIFY_CLIENT_ID || '',
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET ? '***hidden***' : '',
      redirectUri: process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/auth/callback',
      scopes: (process.env.SPOTIFY_SCOPES || 'user-read-private,user-read-email,user-read-recently-played,user-read-playback-state,user-modify-playback-state,playlist-read-private,playlist-modify-public,playlist-modify-private').split(','),
      market: process.env.SPOTIFY_MARKET || 'US',
      limit: parseInt(process.env.SPOTIFY_LIMIT) || 50,
      timeRange: process.env.SPOTIFY_TIME_RANGE || 'medium_term',
    };

    res.json({ success: true, config });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/settings/spotify - Update Spotify configuration
router.put('/spotify', async (req, res) => {
  try {
    const { config } = req.body;

    if (!config) {
      return res.status(400).json({ success: false, error: 'Spotify configuration required' });
    }

    const envUpdates = {};

    if (config.clientId) envUpdates.SPOTIFY_CLIENT_ID = config.clientId;
    if (config.clientSecret && config.clientSecret !== '***hidden***') {
      envUpdates.SPOTIFY_CLIENT_SECRET = config.clientSecret;
    }
    if (config.redirectUri) envUpdates.SPOTIFY_REDIRECT_URI = config.redirectUri;
    if (config.scopes && Array.isArray(config.scopes)) {
      envUpdates.SPOTIFY_SCOPES = config.scopes.join(',');
    }
    if (config.market) envUpdates.SPOTIFY_MARKET = config.market;
    if (config.limit) envUpdates.SPOTIFY_LIMIT = config.limit.toString();
    if (config.timeRange) envUpdates.SPOTIFY_TIME_RANGE = config.timeRange;

    const result = await settingsManager.updateSettings(envUpdates);

    if (result.success) {
      Object.entries(envUpdates).forEach(([key, value]) => {
        process.env[key] = value;
      });

      res.json({
        success: true,
        message: 'Spotify configuration updated successfully',
      });
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/settings/test-spotify - Test Spotify connection
router.post('/test-spotify', async (req, res) => {
  try {
    const { clientId, clientSecret } = req.body;

    if (!clientId || !clientSecret) {
      return res.status(400).json({ 
        success: false, 
        error: 'Client ID and Client Secret are required' 
      });
    }

    const startTime = Date.now();

    // Test connection by getting client credentials token
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    });

    const latency = Date.now() - startTime;

    if (response.ok) {
      res.json({
        success: true,
        message: 'Spotify connection test successful',
        latency: `${latency}ms`,
      });
    } else {
      const errorData = await response.text();
      res.json({
        success: false,
        error: `Spotify API error: ${errorData}`,
        latency: `${latency}ms`,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Database Configuration Routes
// GET /api/settings/database - Get database configuration
router.get('/database', (req, res) => {
  try {
    const config = {
      mongodb: {
        uri: process.env.MONGODB_URI ? '***hidden***' : '',
        database: process.env.MONGODB_DB_NAME || 'echotune',
        connected: !!process.env.MONGODB_URI,
      },
      sqlite: {
        enabled: process.env.ENABLE_SQLITE !== 'false',
        file: process.env.SQLITE_FILE || './data/echotune.db',
        fallback: process.env.SQLITE_FALLBACK !== 'false',
      },
      redis: {
        enabled: !!process.env.REDIS_URL,
        url: process.env.REDIS_URL ? '***hidden***' : '',
        password: process.env.REDIS_PASSWORD ? '***hidden***' : '',
      },
    };

    res.json({ success: true, config });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/settings/database - Update database configuration
router.put('/database', async (req, res) => {
  try {
    const { config } = req.body;

    if (!config) {
      return res.status(400).json({ success: false, error: 'Database configuration required' });
    }

    const envUpdates = {};

    if (config.mongodb) {
      if (config.mongodb.uri && config.mongodb.uri !== '***hidden***') {
        envUpdates.MONGODB_URI = config.mongodb.uri;
      }
      if (config.mongodb.database) {
        envUpdates.MONGODB_DB_NAME = config.mongodb.database;
      }
    }

    if (config.sqlite) {
      envUpdates.ENABLE_SQLITE = config.sqlite.enabled.toString();
      envUpdates.SQLITE_FALLBACK = config.sqlite.fallback.toString();
      if (config.sqlite.file) {
        envUpdates.SQLITE_FILE = config.sqlite.file;
      }
    }

    if (config.redis) {
      if (config.redis.url && config.redis.url !== '***hidden***') {
        envUpdates.REDIS_URL = config.redis.url;
      }
      if (config.redis.password && config.redis.password !== '***hidden***') {
        envUpdates.REDIS_PASSWORD = config.redis.password;
      }
    }

    const result = await settingsManager.updateSettings(envUpdates);

    if (result.success) {
      Object.entries(envUpdates).forEach(([key, value]) => {
        process.env[key] = value;
      });

      res.json({
        success: true,
        message: 'Database configuration updated successfully',
      });
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
