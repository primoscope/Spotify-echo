const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

/**
 * Enhanced LLM Provider Management API
 * 
 * Manages multiple LLM providers configuration:
 * - OpenAI GPT models
 * - Google Gemini models  
 * - OpenRouter (multiple models)
 * - Custom provider configurations
 * - Real-time testing and validation
 */

const LLM_CONFIG_PATH = path.join(__dirname, '../../config/llm-providers.json');

// Default LLM provider configurations
const DEFAULT_LLM_CONFIG = {
  openai: {
    enabled: false,
    apiKey: '',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 4096,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
    timeout: 30000,
    retries: 3
  },
  gemini: {
    enabled: true,
    apiKey: process.env.GEMINI_API_KEY || '',
    model: 'gemini-2.0-flash',
    temperature: 0.7,
    maxTokens: 4096,
    topK: 40,
    topP: 0.95,
    timeout: 30000,
    retries: 3
  },
  openrouter: {
    enabled: false,
    apiKey: process.env.OPENROUTER_API_KEY || '',
    model: 'anthropic/claude-3.5-sonnet',
    temperature: 0.7,
    maxTokens: 4096,
    topP: 1,
    site_url: '',
    app_name: 'EchoTune AI',
    timeout: 30000,
    retries: 3
  },
  mock: {
    enabled: true,
    fallback: true,
    responses: [
      'Here\'s a great music recommendation based on your taste!',
      'I\'d suggest exploring this genre - it matches your listening patterns.',
      'Based on your preferences, you might enjoy these tracks.',
      'Let me recommend some music that fits your current mood.'
    ]
  }
};

/**
 * Load LLM provider configuration
 */
async function loadLLMConfig() {
  try {
    const configExists = await fs.access(LLM_CONFIG_PATH).then(() => true).catch(() => false);
    if (!configExists) {
      await saveLLMConfig(DEFAULT_LLM_CONFIG);
      return DEFAULT_LLM_CONFIG;
    }
    
    const configData = await fs.readFile(LLM_CONFIG_PATH, 'utf8');
    const config = JSON.parse(configData);
    
    // Merge with defaults to ensure all providers are present
    return {
      ...DEFAULT_LLM_CONFIG,
      ...config
    };
  } catch (error) {
    console.error('Error loading LLM config:', error);
    return DEFAULT_LLM_CONFIG;
  }
}

/**
 * Save LLM provider configuration
 */
async function saveLLMConfig(config) {
  try {
    const configDir = path.dirname(LLM_CONFIG_PATH);
    await fs.mkdir(configDir, { recursive: true });
    await fs.writeFile(LLM_CONFIG_PATH, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving LLM config:', error);
    return false;
  }
}

/**
 * Validate API key format for different providers
 */
function validateApiKey(provider, apiKey) {
  if (!apiKey) return { valid: false, message: 'API key is required' };
  
  const validations = {
    openai: {
      pattern: /^sk-[a-zA-Z0-9]{48}$/,
      message: 'OpenAI API key should start with "sk-" and be 51 characters long'
    },
    gemini: {
      pattern: /^[a-zA-Z0-9_-]{30,}$/,
      message: 'Google Gemini API key should be at least 30 characters long'
    },
    openrouter: {
      pattern: /^sk-or-v1-[a-f0-9]{64}$/,
      message: 'OpenRouter API key should start with "sk-or-v1-" followed by 64 hex characters'
    }
  };
  
  const validation = validations[provider];
  if (!validation) {
    return { valid: true }; // No specific validation for this provider
  }
  
  if (!validation.pattern.test(apiKey)) {
    return { valid: false, message: validation.message };
  }
  
  return { valid: true };
}

/**
 * Test LLM provider connection and response
 */
async function testLLMProvider(provider, config) {
  try {
    let response;
    const testPrompt = 'Respond with exactly: \'Test successful\'';
    
    switch (provider) {
      case 'openai':
        response = await testOpenAI(config, testPrompt);
        break;
      case 'gemini':
        response = await testGemini(config, testPrompt);
        break;
      case 'openrouter':
        response = await testOpenRouter(config, testPrompt);
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
    
    return {
      success: true,
      response: response.text,
      latency: response.latency,
      model: config.model,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Test OpenAI connection
 */
async function testOpenAI(config, prompt) {
  const startTime = Date.now();
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: config.temperature,
      max_tokens: Math.min(config.maxTokens, 100), // Limit for test
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API Error: ${error.error?.message || response.statusText}`);
  }
  
  const data = await response.json();
  const latency = Date.now() - startTime;
  
  return {
    text: data.choices[0]?.message?.content || 'No response',
    latency: `${latency}ms`,
    usage: data.usage
  };
}

/**
 * Test Google Gemini connection
 */
async function testGemini(config, prompt) {
  const startTime = Date.now();
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt }
          ]
        }
      ],
      generationConfig: {
        temperature: config.temperature,
        topK: config.topK,
        topP: config.topP,
        maxOutputTokens: Math.min(config.maxTokens, 100), // Limit for test
      }
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Gemini API Error: ${error.error?.message || response.statusText}`);
  }
  
  const data = await response.json();
  const latency = Date.now() - startTime;
  
  return {
    text: data.candidates[0]?.content?.parts[0]?.text || 'No response',
    latency: `${latency}ms`,
    usage: data.usageMetadata
  };
}

/**
 * Test OpenRouter connection
 */
async function testOpenRouter(config, prompt) {
  const startTime = Date.now();
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': config.site_url || 'https://github.com/dzp5103/Spotify-echo',
      'X-Title': config.app_name || 'EchoTune AI'
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: config.temperature,
      max_tokens: Math.min(config.maxTokens, 100), // Limit for test
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenRouter API Error: ${error.error?.message || response.statusText}`);
  }
  
  const data = await response.json();
  const latency = Date.now() - startTime;
  
  return {
    text: data.choices[0]?.message?.content || 'No response',
    latency: `${latency}ms`,
    usage: data.usage
  };
}

/**
 * @route GET /api/settings/llm-providers
 * @desc Get all LLM provider configurations
 */
router.get('/llm-providers', async (req, res) => {
  try {
    const config = await loadLLMConfig();
    
    // Remove sensitive API keys from response (show only first 4 and last 4 characters)
    const safeConfig = Object.entries(config).reduce((acc, [provider, settings]) => {
      if (settings.apiKey && settings.apiKey.length > 8) {
        const masked = settings.apiKey.substring(0, 4) + '***' + settings.apiKey.substring(settings.apiKey.length - 4);
        acc[provider] = { ...settings, apiKey: masked, originalKeyPresent: true };
      } else {
        acc[provider] = { ...settings, originalKeyPresent: !!settings.apiKey };
      }
      return acc;
    }, {});
    
    res.json({
      success: true,
      providers: safeConfig,
      totalProviders: Object.keys(config).length,
      enabledProviders: Object.values(config).filter(p => p.enabled).length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to load LLM provider configurations',
      details: error.message
    });
  }
});

/**
 * @route PUT /api/settings/llm-providers
 * @desc Update LLM provider configurations
 */
router.put('/llm-providers', async (req, res) => {
  try {
    const { providers } = req.body;
    
    if (!providers || typeof providers !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid providers configuration'
      });
    }
    
    // Load current config to preserve existing API keys if not provided
    const currentConfig = await loadLLMConfig();
    
    // Validate and merge configuration
    const updatedConfig = {};
    const validationErrors = [];
    
    for (const [provider, settings] of Object.entries(providers)) {
      // Preserve existing API key if the new one is masked or empty
      if (settings.apiKey && settings.apiKey.includes('***')) {
        settings.apiKey = currentConfig[provider]?.apiKey || '';
      }
      
      // Validate API key if provided and enabled
      if (settings.enabled && settings.apiKey) {
        const validation = validateApiKey(provider, settings.apiKey);
        if (!validation.valid) {
          validationErrors.push(`${provider}: ${validation.message}`);
          continue;
        }
      }
      
      updatedConfig[provider] = {
        ...currentConfig[provider],
        ...settings
      };
    }
    
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'API key validation failed',
        validationErrors
      });
    }
    
    // Save the updated configuration
    const saved = await saveLLMConfig(updatedConfig);
    if (!saved) {
      throw new Error('Failed to save configuration');
    }
    
    res.json({
      success: true,
      message: 'LLM provider configurations updated successfully',
      updatedProviders: Object.keys(updatedConfig).length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update LLM provider configurations',
      details: error.message
    });
  }
});

/**
 * @route POST /api/settings/llm-providers/:provider/test
 * @desc Test specific LLM provider connection
 */
router.post('/llm-providers/:provider/test', async (req, res) => {
  try {
    const { provider } = req.params;
    const { config: testConfig } = req.body;
    
    if (!testConfig) {
      return res.status(400).json({
        success: false,
        error: 'Provider configuration is required for testing'
      });
    }
    
    // Load current config if API key is masked
    if (testConfig.apiKey && testConfig.apiKey.includes('***')) {
      const currentConfig = await loadLLMConfig();
      testConfig.apiKey = currentConfig[provider]?.apiKey || '';
    }
    
    if (!testConfig.apiKey) {
      return res.status(400).json({
        success: false,
        error: 'API key is required for testing'
      });
    }
    
    const result = await testLLMProvider(provider, testConfig);
    
    if (result.success) {
      res.json({
        success: true,
        message: `${provider} connection test successful`,
        ...result
      });
    } else {
      res.status(400).json({
        success: false,
        error: `${provider} connection test failed`,
        ...result
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Provider test failed',
      details: error.message
    });
  }
});

/**
 * @route GET /api/settings/llm-providers/models/:provider
 * @desc Get available models for a specific provider
 */
router.get('/llm-providers/models/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    
    const availableModels = {
      openai: [
        { id: 'gpt-4o', name: 'GPT-4o', description: 'Most advanced multimodal model' },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Faster, cost-efficient model' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'High-performance model with latest knowledge' },
        { id: 'gpt-4', name: 'GPT-4', description: 'Most capable model for complex tasks' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and cost-effective' },
        { id: 'gpt-3.5-turbo-16k', name: 'GPT-3.5 Turbo 16K', description: 'Extended context length' }
      ],
      gemini: [
        { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Experimental)', description: 'Latest experimental model' },
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Fast multimodal model' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Advanced reasoning and coding' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Fast and efficient' },
        { id: 'gemini-1.0-pro', name: 'Gemini 1.0 Pro', description: 'Reliable and versatile' }
      ],
      openrouter: [
        { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', description: 'Advanced reasoning and coding' },
        { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', description: 'Most capable Claude model' },
        { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', description: 'Fastest Claude model' },
        { id: 'openai/gpt-4o', name: 'GPT-4o (via OpenRouter)', description: 'Advanced multimodal model' },
        { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo (via OpenRouter)', description: 'High-performance model' },
        { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5 (via OpenRouter)', description: 'Google\'s advanced model' },
        { id: 'meta-llama/llama-3.1-405b-instruct', name: 'Llama 3.1 405B', description: 'Meta\'s largest open model' },
        { id: 'mistralai/mixtral-8x7b-instruct', name: 'Mixtral 8x7B', description: 'High-quality mixture of experts' }
      ]
    };
    
    const models = availableModels[provider] || [];
    
    res.json({
      success: true,
      provider,
      models,
      totalModels: models.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to load available models',
      details: error.message
    });
  }
});

/**
 * @route GET /api/settings/llm-providers/status
 * @desc Get status and health of all LLM providers
 */
router.get('/llm-providers/status', async (req, res) => {
  try {
    const config = await loadLLMConfig();
    const status = {};
    
    for (const [provider, settings] of Object.entries(config)) {
      if (provider === 'mock') {
        status[provider] = {
          enabled: settings.enabled,
          configured: true,
          status: 'healthy',
          fallback: settings.fallback || false
        };
        continue;
      }
      
      status[provider] = {
        enabled: settings.enabled,
        configured: !!(settings.apiKey && settings.model),
        status: settings.enabled && settings.apiKey ? 'unknown' : 'disabled',
        model: settings.model,
        lastTested: null
      };
    }
    
    const enabledCount = Object.values(status).filter(s => s.enabled).length;
    const configuredCount = Object.values(status).filter(s => s.configured).length;
    
    res.json({
      success: true,
      providers: status,
      summary: {
        total: Object.keys(status).length,
        enabled: enabledCount,
        configured: configuredCount,
        healthy: Object.values(status).filter(s => s.status === 'healthy').length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get provider status',
      details: error.message
    });
  }
});

module.exports = router;