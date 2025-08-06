// Enhanced Settings API - Dynamic Configuration Management
// Handles both frontend and backend settings with real-time updates

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
                        required: true
                    },
                    PORT: {
                        type: 'number',
                        label: 'Port',
                        min: 1000,
                        max: 65535,
                        default: 3000,
                        required: true
                    },
                    DOMAIN: {
                        type: 'text',
                        label: 'Domain',
                        placeholder: 'your-domain.com',
                        required: true
                    },
                    LOG_LEVEL: {
                        type: 'select',
                        label: 'Log Level',
                        options: ['error', 'warn', 'info', 'debug'],
                        default: 'info'
                    }
                }
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
                        required: true
                    },
                    OPENAI_API_KEY: {
                        type: 'password',
                        label: 'OpenAI API Key',
                        placeholder: 'sk-...',
                        provider: 'openai'
                    },
                    OPENAI_MODEL: {
                        type: 'select',
                        label: 'OpenAI Model',
                        options: [
                            'gpt-4-turbo',
                            'gpt-4',
                            'gpt-3.5-turbo',
                            'gpt-3.5-turbo-16k'
                        ],
                        default: 'gpt-4-turbo',
                        provider: 'openai'
                    },
                    GEMINI_API_KEY: {
                        type: 'password',
                        label: 'Gemini API Key',
                        placeholder: 'your_gemini_key',
                        provider: 'gemini'
                    },
                    GEMINI_MODEL: {
                        type: 'select',
                        label: 'Gemini Model',
                        options: [
                            'gemini-1.5-pro',
                            'gemini-1.5-flash',
                            'gemini-1.0-pro'
                        ],
                        default: 'gemini-1.5-pro',
                        provider: 'gemini'
                    },
                    OPENROUTER_API_KEY: {
                        type: 'password',
                        label: 'OpenRouter API Key',
                        placeholder: 'sk-or-...',
                        provider: 'openrouter'
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
                            'mistralai/mixtral-8x7b-instruct'
                        ],
                        default: 'anthropic/claude-3.5-sonnet',
                        provider: 'openrouter'
                    },
                    ANTHROPIC_API_KEY: {
                        type: 'password',
                        label: 'Anthropic API Key',
                        placeholder: 'sk-ant-...',
                        provider: 'anthropic'
                    },
                    ANTHROPIC_MODEL: {
                        type: 'select',
                        label: 'Anthropic Model',
                        options: [
                            'claude-3-opus-20240229',
                            'claude-3-sonnet-20240229',
                            'claude-3-haiku-20240307'
                        ],
                        default: 'claude-3-sonnet-20240229',
                        provider: 'anthropic'
                    }
                }
            },
            database: {
                name: 'Database Configuration',
                description: 'MongoDB and caching settings',
                settings: {
                    DATABASE_TYPE: {
                        type: 'select',
                        label: 'Primary Database',
                        options: ['mongodb', 'sqlite'],
                        default: 'mongodb'
                    },
                    MONGODB_URI: {
                        type: 'password',
                        label: 'MongoDB URI',
                        placeholder: 'mongodb+srv://...',
                        database: 'mongodb'
                    },
                    MONGODB_DB_NAME: {
                        type: 'text',
                        label: 'Database Name',
                        default: 'echotune',
                        database: 'mongodb'
                    },
                    ENABLE_MONGODB_ANALYTICS: {
                        type: 'boolean',
                        label: 'Enable Analytics',
                        default: true,
                        database: 'mongodb'
                    },
                    REDIS_URL: {
                        type: 'text',
                        label: 'Redis URL',
                        placeholder: 'redis://localhost:6379',
                        cache: true
                    },
                    REDIS_PASSWORD: {
                        type: 'password',
                        label: 'Redis Password',
                        cache: true
                    },
                    CACHE_ENABLED: {
                        type: 'boolean',
                        label: 'Enable Caching',
                        default: true
                    }
                }
            },
            spotify: {
                name: 'Spotify Integration',
                description: 'Spotify API configuration',
                settings: {
                    SPOTIFY_CLIENT_ID: {
                        type: 'text',
                        label: 'Client ID',
                        required: true,
                        placeholder: 'your_spotify_client_id'
                    },
                    SPOTIFY_CLIENT_SECRET: {
                        type: 'password',
                        label: 'Client Secret',
                        required: true,
                        placeholder: 'your_spotify_client_secret'
                    },
                    SPOTIFY_REDIRECT_URI: {
                        type: 'text',
                        label: 'Redirect URI',
                        placeholder: 'https://your-domain.com/auth/callback'
                    }
                }
            },
            security: {
                name: 'Security & SSL',
                description: 'Security configuration and SSL settings',
                settings: {
                    SSL_ENABLED: {
                        type: 'boolean',
                        label: 'Enable SSL',
                        default: true
                    },
                    FORCE_HTTPS: {
                        type: 'boolean',
                        label: 'Force HTTPS',
                        default: true
                    },
                    ENABLE_SECURITY_HEADERS: {
                        type: 'boolean',
                        label: 'Security Headers',
                        default: true
                    },
                    SESSION_SECRET: {
                        type: 'password',
                        label: 'Session Secret',
                        placeholder: 'generate_random_string',
                        required: true
                    },
                    JWT_SECRET: {
                        type: 'password',
                        label: 'JWT Secret',
                        placeholder: 'generate_random_string',
                        required: true
                    },
                    RATE_LIMIT_ENABLED: {
                        type: 'boolean',
                        label: 'Enable Rate Limiting',
                        default: true
                    },
                    API_RATE_LIMIT: {
                        type: 'text',
                        label: 'API Rate Limit',
                        placeholder: '50r/s',
                        default: '50r/s'
                    }
                }
            },
            performance: {
                name: 'Performance & Monitoring',
                description: 'Performance optimization and monitoring',
                settings: {
                    COMPRESSION: {
                        type: 'boolean',
                        label: 'Enable Compression',
                        default: true
                    },
                    METRICS_ENABLED: {
                        type: 'boolean',
                        label: 'Enable Metrics',
                        default: true
                    },
                    HEALTH_CHECK_ENABLED: {
                        type: 'boolean',
                        label: 'Enable Health Checks',
                        default: true
                    },
                    ENABLE_ANALYTICS_DASHBOARD: {
                        type: 'boolean',
                        label: 'Analytics Dashboard',
                        default: true
                    },
                    ENABLE_REALTIME_UPDATES: {
                        type: 'boolean',
                        label: 'Real-time Updates',
                        default: true
                    }
                }
            }
        };
    }

    async getCurrentSettings() {
        try {
            const envContent = await fs.readFile(this.configPath, 'utf8');
            const settings = {};
            
            envContent.split('\n').forEach(line => {
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
            const ProviderManager = require('../providers/provider-manager');
            const providerManager = new ProviderManager();
            
            // Temporarily use the new settings for testing
            const originalEnv = process.env;
            Object.entries(settings).forEach(([key, value]) => {
                process.env[key] = value;
            });
            
            const result = await providerManager.testProvider(provider);
            
            // Restore original environment
            Object.keys(settings).forEach(key => {
                if (originalEnv[key] !== undefined) {
                    process.env[key] = originalEnv[key];
                } else {
                    delete process.env[key];
                }
            });
            
            return result;
        } catch (error) {
            return { success: false, error: error.message };
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
                errors: validationErrors 
            });
        }
        
        // Update settings
        const result = await settingsManager.updateSettings(settings);
        
        if (result.success) {
            res.json({ 
                success: true, 
                message: 'Settings updated successfully. Restart required for some changes.',
                requiresRestart: true
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
                anthropic: !!process.env.ANTHROPIC_API_KEY
            },
            database: {
                mongodb: !!process.env.MONGODB_URI,
                redis: !!process.env.REDIS_URL,
                sqlite: true // Always available as fallback
            },
            features: {
                ssl: process.env.SSL_ENABLED === 'true',
                compression: process.env.COMPRESSION === 'true',
                metrics: process.env.METRICS_ENABLED === 'true',
                analytics: process.env.ENABLE_ANALYTICS_DASHBOARD === 'true'
            }
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
                errors: validationErrors 
            });
        }
        
        // Update settings
        const result = await settingsManager.updateSettings(settings);
        
        if (result.success) {
            res.json({ 
                success: true, 
                message: 'Settings updated successfully. Some changes may require restart.',
                requiresRestart: true
            });
        } else {
            res.status(500).json(result);
        }
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

module.exports = router;