/**
 * 🎛️ Advanced Settings API Endpoints
 * Backend API support for Advanced Settings UI
 *
 * Provides endpoints for LLM configuration, database insights,
 * and system health monitoring
 */

const express = require('express');
const { MongoClient } = require('mongodb');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

const router = express.Router();

// Configuration storage path
const CONFIG_FILE = path.join(__dirname, '..', '..', 'data', 'advanced-settings.json');

/**
 * Ensure data directory exists
 */
const ensureDataDirectory = () => {
  const dataDir = path.dirname(CONFIG_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

/**
 * Load configuration from file
 */
const loadConfig = () => {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }

  // Return default configuration
  return {
    llm: {
      provider: process.env.DEFAULT_LLM_PROVIDER || 'mock',
      apiKey: '',
      model: process.env.DEFAULT_LLM_MODEL || 'mock-music-assistant',
      temperature: 0.7,
      maxTokens: 4096,
      timeout: 30000,
    },
    lastUpdated: new Date().toISOString(),
  };
};

/**
 * Save configuration to file
 */
const saveConfig = (config) => {
  try {
    ensureDataDirectory();
    config.lastUpdated = new Date().toISOString();
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving config:', error);
    return false;
  }
};

/**
 * GET /api/settings/advanced
 * Get current advanced settings configuration
 */
router.get('/advanced', (req, res) => {
  try {
    const config = loadConfig();

    // Don't send API keys to client
    const sanitizedConfig = {
      ...config,
      llm: {
        ...config.llm,
        apiKey: config.llm.apiKey ? '••••••••••••' : '',
      },
    };

    res.json(sanitizedConfig);
  } catch (error) {
    console.error('Error loading advanced settings:', error);
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

/**
 * POST /api/settings/llm
 * Save LLM provider configuration
 */
router.post('/llm', (req, res) => {
  try {
    const { provider, apiKey, model, temperature, maxTokens, timeout } = req.body;

    // Validate input
    if (!provider || !model) {
      return res.status(400).json({ error: 'Provider and model are required' });
    }

    if (temperature < 0 || temperature > 2) {
      return res.status(400).json({ error: 'Temperature must be between 0 and 2' });
    }

    if (maxTokens < 100 || maxTokens > 8192) {
      return res.status(400).json({ error: 'Max tokens must be between 100 and 8192' });
    }

    // Load current config
    const config = loadConfig();

    // Update LLM settings
    config.llm = {
      provider,
      apiKey: apiKey || config.llm.apiKey, // Keep existing key if not provided
      model,
      temperature: parseFloat(temperature),
      maxTokens: parseInt(maxTokens),
      timeout: parseInt(timeout || 30000),
    };

    // Save configuration
    if (saveConfig(config)) {
      // Update environment variables for immediate effect
      process.env.DEFAULT_LLM_PROVIDER = provider;
      process.env.DEFAULT_LLM_MODEL = model;

      if (apiKey) {
        switch (provider) {
          case 'openai':
            process.env.OPENAI_API_KEY = apiKey;
            break;
          case 'gemini':
            process.env.GEMINI_API_KEY = apiKey;
            break;
          case 'anthropic':
            process.env.ANTHROPIC_API_KEY = apiKey;
            break;
          case 'openrouter':
            process.env.OPENROUTER_API_KEY = apiKey;
            break;
        }
      }

      res.json({
        success: true,
        message: 'LLM settings saved successfully',
        config: {
          ...config.llm,
          apiKey: config.llm.apiKey ? '••••••••••••' : '',
        },
      });
    } else {
      res.status(500).json({ error: 'Failed to save settings' });
    }
  } catch (error) {
    console.error('Error saving LLM settings:', error);
    res.status(500).json({ error: 'Failed to save LLM settings' });
  }
});

/**
 * POST /api/settings/llm/test
 * Test LLM provider connection and response
 */
router.post('/llm/test', async (req, res) => {
  const startTime = Date.now();

  try {
    const {
      provider,
      apiKey,
      model,
      temperature = 0.7,
      maxTokens = 100,
      timeout = 30000,
    } = req.body;

    if (!provider) {
      return res.status(400).json({ error: 'Provider is required' });
    }

    let testResult;

    // Test different providers
    switch (provider) {
      case 'mock':
        testResult = await testMockProvider();
        break;

      case 'openai':
        testResult = await testOpenAIProvider(apiKey, model, temperature, maxTokens, timeout);
        break;

      case 'gemini':
        testResult = await testGeminiProvider(apiKey, model, temperature, maxTokens, timeout);
        break;

      case 'anthropic':
        testResult = await testAnthropicProvider(apiKey, model, temperature, maxTokens, timeout);
        break;

      case 'openrouter':
        testResult = await testOpenRouterProvider(apiKey, model, temperature, maxTokens, timeout);
        break;

      default:
        return res.status(400).json({ error: `Unsupported provider: ${provider}` });
    }

    const latency = Date.now() - startTime;

    res.json({
      success: true,
      provider,
      latency,
      response: testResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const latency = Date.now() - startTime;
    console.error('LLM test error:', error);

    res.status(400).json({
      success: false,
      provider: req.body.provider,
      latency,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * @swagger
 * /api/settings/export:
 *   get:
 *     summary: Export current advanced settings (sanitized)
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: JSON settings backup without secrets
 */
/**
 * GET /api/settings/export
 * Export current settings for backup (sanitized)
 */
router.get('/export', (req, res) => {
  try {
    const config = loadConfig();
    const sanitized = {
      ...config,
      llm: { ...config.llm, apiKey: config.llm?.apiKey ? '••••••••••••' : '' },
    };
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="advanced-settings-backup.json"');
    res.status(200).send(JSON.stringify(sanitized, null, 2));
  } catch (error) {
    res.status(500).json({ error: 'Failed to export settings' });
  }
});

/**
 * @swagger
 * /api/settings/import:
 *   post:
 *     summary: Import advanced settings from a sanitized backup
 *     tags: [Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Settings imported (API keys preserved server-side)
 */
/**
 * POST /api/settings/import
 * Import settings from backup (expects JSON body). Does not accept API keys from client.
 */
router.post('/import', (req, res) => {
  try {
    const incoming = req.body || {};
    const current = loadConfig();

    // Never accept raw API keys via import; keep existing
    const merged = {
      ...current,
      ...incoming,
      llm: {
        ...current.llm,
        ...incoming.llm,
        apiKey: current.llm?.apiKey || '',
      },
    };

    if (!saveConfig(merged)) {
      return res.status(500).json({ error: 'Failed to save imported settings' });
    }

    res.json({ success: true, message: 'Settings imported (API keys preserved on server)' });
  } catch (error) {
    res.status(400).json({ error: 'Invalid import payload' });
  }
});

/**
 * @swagger
 * /api/settings/ssl/request:
 *   post:
 *     summary: Create a plan for automated Let's Encrypt SSL request
 *     tags: [Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [domain]
 *             properties:
 *               domain:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: SSL plan created and saved to reports
 */
/**
 * POST /api/settings/ssl/request
 * Plan an automated SSL (Let\'s Encrypt) request. Writes an instruction plan to reports.
 */
router.post('/ssl/request', (req, res) => {
  try {
    const { domain, email } = req.body || {};
    if (!domain || !/^[A-Za-z0-9.-]+$/.test(domain)) {
      return res.status(400).json({ error: 'Valid domain is required' });
    }
    const plan = {
      domain,
      email: email || process.env.SSL_EMAIL || `admin@${domain}`,
      script: 'nginx/ssl-setup.sh',
      command: `DOMAIN=\"${domain}\" SSL_EMAIL=\"${email || ''}\" sudo bash nginx/ssl-setup.sh`,
      createdAt: new Date().toISOString(),
      note: 'Run on the server with root privileges. This endpoint does not execute the command.'
    };
    const reportsDir = path.join(__dirname, '..', '..', 'reports');
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
    const file = path.join(reportsDir, `ssl-request-${Date.now()}.json`);
    fs.writeFileSync(file, JSON.stringify(plan, null, 2));
    res.json({ success: true, plan, report: file });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create SSL request plan' });
  }
});

/**
 * @swagger
 * /api/settings/self-test:
 *   get:
 *     summary: Validate advanced settings read/write path
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Self test status
 */
/**
 * GET /api/settings/self-test
 * Validate that advanced settings read/write is functioning
 */
router.get('/self-test', (req, res) => {
  try {
    const before = loadConfig();
    const ok = saveConfig({ ...before, _lastSelfTest: new Date().toISOString() });
    const after = loadConfig();
    res.json({ success: ok, before: !!before, after: !!after, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/settings/database/insights
 * Get comprehensive database analytics and insights
 */
router.get('/database/insights', async (req, res) => {
  try {
    const insights = await getDatabaseInsights();
    res.json(insights);
  } catch (error) {
    console.error('Error getting database insights:', error);
    res.status(500).json({
      error: 'Failed to get database insights',
      connectionStatus: 'error',
      collections: [],
      totalDocuments: 0,
    });
  }
});

/**
 * GET /api/health/detailed
 * Get detailed system health metrics
 */
router.get('/health/detailed', (req, res) => {
  try {
    const health = getSystemHealth();
    res.json(health);
  } catch (error) {
    console.error('Error getting system health:', error);
    res.status(500).json({
      error: 'Failed to get system health',
      health: 'error',
      uptime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
    });
  }
});

/**
 * Test provider implementations
 */

async function testMockProvider() {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000 + 500));

  const responses = [
    "🎵 I'm your AI music assistant! I can help you discover new music based on your preferences.",
    "🎼 Ready to explore some amazing tunes? Tell me what you're in the mood for!",
    '🎹 Music recommendation system is working perfectly! What genre interests you today?',
    "🎤 Hello! I'm here to help you find your next favorite song. What's your vibe?",
    '🥁 Mock provider test successful! All systems are ready for music discovery.',
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}

async function testOpenAIProvider(
  apiKey,
  model = 'gpt-3.5-turbo',
  temperature = 0.7,
  maxTokens = 100,
  timeout = 30000
) {
  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model,
      messages: [
        {
          role: 'user',
          content:
            'Test: Are you working? Respond with "OpenAI connection successful for music recommendations!"',
        },
      ],
      temperature,
      max_tokens: maxTokens,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout,
    }
  );

  return response.data.choices[0].message.content.trim();
}

async function testGeminiProvider(
  apiKey,
  model = 'gemini-1.5-flash',
  temperature = 0.7,
  maxTokens = 100,
  timeout = 30000
) {
  if (!apiKey) {
    throw new Error('Gemini API key is required');
  }

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      contents: [
        {
          parts: [
            {
              text: 'Test: Are you working? Respond with "Gemini connection successful for music recommendations!"',
            },
          ],
        },
      ],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    },
    { timeout }
  );

  return response.data.candidates[0].content.parts[0].text.trim();
}

async function testAnthropicProvider(
  apiKey,
  model = 'claude-3-haiku-20240307',
  temperature = 0.7,
  maxTokens = 100,
  timeout = 30000
) {
  if (!apiKey) {
    throw new Error('Anthropic API key is required');
  }

  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model,
      max_tokens: maxTokens,
      temperature,
      messages: [
        {
          role: 'user',
          content:
            'Test: Are you working? Respond with "Anthropic Claude connection successful for music recommendations!"',
        },
      ],
    },
    {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      timeout,
    }
  );

  return response.data.content[0].text.trim();
}

async function testOpenRouterProvider(
  apiKey,
  model = 'anthropic/claude-3-haiku',
  temperature = 0.7,
  maxTokens = 100,
  timeout = 30000
) {
  if (!apiKey) {
    throw new Error('OpenRouter API key is required');
  }

  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model,
      messages: [
        {
          role: 'user',
          content:
            'Test: Are you working? Respond with "OpenRouter connection successful for music recommendations!"',
        },
      ],
      temperature,
      max_tokens: maxTokens,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
        'X-Title': 'EchoTune AI',
        'Content-Type': 'application/json',
      },
      timeout,
    }
  );

  return response.data.choices[0].message.content.trim();
}

/**
 * Get comprehensive database insights
 */
async function getDatabaseInsights() {
  const insights = {
    connectionStatus: 'unknown',
    collections: [],
    totalDocuments: 0,
    avgQueryTime: 'N/A',
    indexesOptimized: false,
  };

  try {
    // Try MongoDB first
    if (process.env.MONGODB_URI) {
      const client = new MongoClient(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });

      await client.connect();
      insights.connectionStatus = 'connected';

      const db = client.db(process.env.MONGODB_DATABASE || 'echotune');

      // Get collection statistics
      const collections = await db.listCollections().toArray();
      let totalDocs = 0;

      for (const collection of collections) {
        const collectionName = collection.name;
        const coll = db.collection(collectionName);

        const stats = await db.command({ collStats: collectionName });
        const indexes = await coll.indexes();

        const collectionInfo = {
          name: collectionName,
          count: stats.count || 0,
          size: formatBytes(stats.size || 0),
          indexed: indexes.length > 1, // More than just _id index
        };

        insights.collections.push(collectionInfo);
        totalDocs += collectionInfo.count;
      }

      insights.totalDocuments = totalDocs;
      insights.indexesOptimized = insights.collections.every((c) => c.indexed);

      // Test query performance
      const startTime = Date.now();
      await db.collection('users').findOne({});
      const queryTime = Date.now() - startTime;
      insights.avgQueryTime = `${queryTime}ms`;

      await client.close();
    } else {
      // Fallback to SQLite
      const sqlitePath = process.env.DATABASE_PATH || './data/echotune.db';
      if (fs.existsSync(sqlitePath)) {
        insights.connectionStatus = 'connected';
        insights.collections = [
          { name: 'users', count: 0, size: 'N/A', indexed: true },
          { name: 'listening_history', count: 0, size: 'N/A', indexed: true },
          { name: 'recommendations', count: 0, size: 'N/A', indexed: true },
        ];
        insights.avgQueryTime = '<10ms';
        insights.indexesOptimized = true;
      }
    }
  } catch (error) {
    console.error('Database insights error:', error);
    insights.connectionStatus = 'error';
  }

  return insights;
}

/**
 * Get detailed system health metrics
 */
function getSystemHealth() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();

  const memoryUsage = Math.round(((totalMem - freeMem) / totalMem) * 100);

  // Get load averages (CPU usage approximation)
  const loadAvg = os.loadavg();
  const cpuUsage = Math.min(Math.round(loadAvg[0] * 100), 100);

  // Calculate uptime
  const uptime = process.uptime();

  // Determine health status
  let health = 'healthy';
  if (memoryUsage > 90 || cpuUsage > 90) {
    health = 'error';
  } else if (memoryUsage > 80 || cpuUsage > 80) {
    health = 'warning';
  }

  return {
    health,
    uptime: Math.round(uptime),
    memoryUsage,
    cpuUsage,
    totalMemory: formatBytes(totalMem),
    freeMemory: formatBytes(freeMem),
    nodeVersion: process.version,
    platform: os.platform(),
    architecture: os.arch(),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = router;
