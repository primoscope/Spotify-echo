/**
 * Analysis API Routes
 * Grok-4 powered code analysis and reasoning capabilities for EchoTune AI
 */
const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const llmProviderManager = require('../../chat/llm-provider-manager');

/**
 * @swagger
 * /api/analyze/repository:
 *   post:
 *     summary: Analyze repository code and structure
 *     description: Use Grok-4 to perform comprehensive repository analysis
 *     tags: [Analysis]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [comprehensive, security, performance, architecture]
 *                 default: comprehensive
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Specific files to analyze (optional)
 *               model:
 *                 type: string
 *                 enum: [grok-4, grok-4-heavy]
 *                 default: grok-4-heavy
 */
router.post('/repository', async (req, res) => {
  try {
    const { type = 'comprehensive', files = [], model = 'grok-4-heavy' } = req.body;

    const grok4Provider = llmProviderManager.providers.get('grok4');
    
    if (!grok4Provider || !grok4Provider.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'Grok-4 analysis service not available',
        fallback: 'Consider configuring XAI_API_KEY or OPENROUTER_API_KEY',
      });
    }

    // Generate code snapshot
    const codeSnapshot = await generateCodeSnapshot(files);
    
    if (!codeSnapshot) {
      return res.status(400).json({
        success: false,
        error: 'No code found to analyze',
      });
    }

    const response = await grok4Provider.analyzeRepository(codeSnapshot, type, {
      model,
      maxTokens: 4000,
    });

    res.json({
      success: true,
      analysis: response.content,
      type: type,
      model: response.model,
      usage: response.usage,
      metadata: response.metadata,
      filesAnalyzed: files.length > 0 ? files : ['entire-repository'],
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Repository analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze repository',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/analyze/code:
 *   post:
 *     summary: Debug specific code issues
 *     description: Use Grok-4 to debug and provide solutions for code problems
 *     tags: [Analysis]
 */
router.post('/code', async (req, res) => {
  try {
    const { code, error, context = '', model = 'grok-4' } = req.body;

    if (!code || !error) {
      return res.status(400).json({
        success: false,
        error: 'Code and error description are required',
      });
    }

    const grok4Provider = llmProviderManager.providers.get('grok4');
    
    if (!grok4Provider?.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'Code analysis service not available',
      });
    }

    const response = await grok4Provider.debugCode(code, error, context, {
      model,
      maxTokens: 2000,
    });

    res.json({
      success: true,
      analysis: response.content,
      model: response.model,
      usage: response.usage,
      metadata: response.metadata,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Code debug error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to debug code',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/analyze/tasks:
 *   post:
 *     summary: Generate actionable development tasks
 *     description: Convert analysis results into prioritized development tasks
 *     tags: [Analysis]
 */
router.post('/tasks', async (req, res) => {
  try {
    const { analysisResult, priority = 'high', model = 'grok-4' } = req.body;

    if (!analysisResult) {
      return res.status(400).json({
        success: false,
        error: 'Analysis result is required',
      });
    }

    const grok4Provider = llmProviderManager.providers.get('grok4');
    
    if (!grok4Provider?.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'Task generation service not available',
      });
    }

    const response = await grok4Provider.generateTasks(analysisResult, priority, {
      model,
      maxTokens: 2000,
    });

    res.json({
      success: true,
      tasks: response.content,
      priority: priority,
      model: response.model,
      usage: response.usage,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Task generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate tasks',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/analyze/reasoning:
 *   post:
 *     summary: Advanced reasoning and problem solving
 *     description: Use Grok-4 for complex reasoning tasks
 *     tags: [Analysis]
 */
router.post('/reasoning', async (req, res) => {
  try {
    const { problem, context = '', model = 'grok-4-heavy', multiAgent = true } = req.body;

    if (!problem) {
      return res.status(400).json({
        success: false,
        error: 'Problem description is required',
      });
    }

    const grok4Provider = llmProviderManager.providers.get('grok4');
    
    if (!grok4Provider?.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'Reasoning service not available',
      });
    }

    const messages = [
      {
        role: 'system',
        content: 'You are an expert problem solver and reasoning assistant. Provide step-by-step analysis and solutions.',
      },
      {
        role: 'user',
        content: `Problem: ${problem}\n\nContext: ${context}`,
      },
    ];

    const response = await grok4Provider._generateCompletion(messages, {
      model,
      multiAgent,
      maxTokens: 3000,
    });

    res.json({
      success: true,
      reasoning: response.content,
      model: response.model,
      usage: response.usage,
      metadata: response.metadata,
      multiAgentUsed: response.metadata?.multi_agent_used,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Reasoning error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform reasoning',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/analyze/capabilities:
 *   get:
 *     summary: Get analysis service capabilities
 *     description: Return available analysis models and features
 *     tags: [Analysis]
 */
router.get('/capabilities', async (req, res) => {
  try {
    const grok4Provider = llmProviderManager.providers.get('grok4');
    
    const capabilities = {
      available: grok4Provider?.isAvailable() || false,
      provider: 'grok4',
      features: grok4Provider?.getCapabilities() || {},
      supportedAnalysisTypes: ['comprehensive', 'security', 'performance', 'architecture'],
      supportedModels: ['grok-4', 'grok-4-heavy', 'grok-beta'],
      maxTokens: 256000,
      multiAgentSupport: true,
    };

    res.json({
      success: true,
      capabilities,
    });

  } catch (error) {
    console.error('Capabilities error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get capabilities',
    });
  }
});

/**
 * Generate a code snapshot for analysis
 */
async function generateCodeSnapshot(specificFiles = []) {
  try {
    const projectRoot = process.cwd();
    const importantFiles = [
      'package.json',
      'src/server.js',
      'src/index.js',
      'src/chat/model-registry.js',
      'src/chat/llm-provider-manager.js',
      'src/api/routes/chat.js',
      'src/api/routes/research.js',
      'src/api/routes/analysis.js',
    ];

    const filesToAnalyze = specificFiles.length > 0 ? specificFiles : importantFiles;
    let snapshot = '';

    for (const filePath of filesToAnalyze) {
      try {
        const fullPath = path.join(projectRoot, filePath);
        const content = await fs.readFile(fullPath, 'utf8');
        snapshot += `\n\n=== ${filePath} ===\n`;
        snapshot += content.substring(0, 2000); // Limit file size to prevent token overflow
        
        if (content.length > 2000) {
          snapshot += '\n... [truncated for analysis]';
        }
      } catch (fileError) {
        // File doesn't exist, skip it
        console.warn(`Could not read ${filePath}:`, fileError.message);
      }
    }

    // Add project structure
    snapshot = `=== PROJECT OVERVIEW ===\n${await getProjectStructure()}\n\n${snapshot}`;

    return snapshot;
  } catch (error) {
    console.error('Error generating code snapshot:', error);
    return null;
  }
}

/**
 * Get basic project structure
 */
async function getProjectStructure() {
  try {
    const projectRoot = process.cwd();
    const packageJson = JSON.parse(await fs.readFile(path.join(projectRoot, 'package.json'), 'utf8'));
    
    return `Project: ${packageJson.name} v${packageJson.version}
Description: ${packageJson.description}
Main Technologies: Node.js, Express, React, MongoDB, AI/LLM Integration
Key Dependencies: ${Object.keys(packageJson.dependencies || {}).slice(0, 10).join(', ')}
Scripts: ${Object.keys(packageJson.scripts || {}).slice(0, 10).join(', ')}`;
  } catch (error) {
    return 'Unable to read project structure';
  }
}

module.exports = router;