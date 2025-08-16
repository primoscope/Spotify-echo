/**
 * Research API Routes
 * Perplexity-powered research capabilities for EchoTune AI
 */
const express = require('express');
const router = express.Router();
const llmProviderManager = require('../../chat/llm-provider-manager');

/**
 * @swagger
 * /api/research/query:
 *   post:
 *     summary: Perform research query with citations
 *     description: Use Perplexity AI to research topics with real-time web search and citations
 *     tags: [Research]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *                 description: Research query or question
 *               mode:
 *                 type: string
 *                 enum: [research, music, general]
 *                 default: research
 *               model:
 *                 type: string
 *                 enum: [sonar-small, sonar-medium, sonar-large, sonar-pro]
 *                 default: sonar-pro
 *               options:
 *                 type: object
 *                 properties:
 *                   searchRecency:
 *                     type: string
 *                     enum: [auto, hour, day, week, month, year]
 *                     default: auto
 *                   maxTokens:
 *                     type: integer
 *                     default: 2000
 *     responses:
 *       200:
 *         description: Research results with citations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 content:
 *                   type: string
 *                 citations:
 *                   type: array
 *                 sources:
 *                   type: array
 *                 metadata:
 *                   type: object
 */
router.post('/query', async (req, res) => {
  try {
    const { query, mode = 'research', model = 'sonar-pro', options = {} } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required',
      });
    }

    // Get Perplexity provider
    const perplexityProvider = llmProviderManager.providers.get('perplexity');
    
    if (!perplexityProvider || !perplexityProvider.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'Perplexity research service not available',
        fallback: 'Consider configuring PERPLEXITY_API_KEY',
      });
    }

    let response;
    
    switch (mode) {
      case 'music':
        response = await perplexityProvider.musicResearch(query, {
          model,
          ...options,
        });
        break;
      case 'research':
      case 'general':
      default:
        response = await perplexityProvider.research(query, {
          model,
          ...options,
        });
        break;
    }

    res.json({
      success: true,
      content: response.content,
      citations: response.metadata?.citations || [],
      sources: response.metadata?.sources || [],
      searchResults: response.metadata?.search_results || [],
      model: response.model,
      usage: response.usage,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Research API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform research',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/research/music:
 *   post:
 *     summary: Music-specific research
 *     description: Research music trends, artists, genres with specialized context
 *     tags: [Research, Music]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *               genre:
 *                 type: string
 *               timeframe:
 *                 type: string
 *                 enum: [current, week, month, year, all-time]
 */
router.post('/music', async (req, res) => {
  try {
    const { query, genre, timeframe = 'current' } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required',
      });
    }

    const perplexityProvider = llmProviderManager.providers.get('perplexity');
    
    if (!perplexityProvider?.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'Music research service not available',
      });
    }

    // Enhanced music query
    const enhancedQuery = `${query}${genre ? ` in ${genre}` : ''}${timeframe !== 'current' ? ` for ${timeframe}` : ''}. Include streaming data, chart positions, and cultural impact when available.`;

    const response = await perplexityProvider.musicResearch(enhancedQuery, {
      model: 'sonar-pro', // Use pro model for music research
      searchRecency: timeframe === 'current' ? 'week' : 'month',
    });

    res.json({
      success: true,
      content: response.content,
      citations: response.metadata?.citations || [],
      sources: response.metadata?.sources || [],
      model: response.model,
      query: enhancedQuery,
      context: { genre, timeframe },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Music research error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform music research',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/research/trends:
 *   get:
 *     summary: Get current music trends
 *     description: Quick endpoint for current music trends and insights
 *     tags: [Research, Music, Trends]
 */
router.get('/trends', async (req, res) => {
  try {
    const { genre, region = 'global' } = req.query;
    
    const perplexityProvider = llmProviderManager.providers.get('perplexity');
    
    if (!perplexityProvider?.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'Trends research service not available',
      });
    }

    const trendsQuery = `What are the current music trends ${genre ? `in ${genre}` : 'across all genres'} ${region !== 'global' ? `in ${region}` : 'globally'}? Include new artists, viral songs, and emerging sub-genres.`;

    const response = await perplexityProvider.musicResearch(trendsQuery, {
      model: 'sonar-pro',
      searchRecency: 'week', // Focus on very recent trends
    });

    res.json({
      success: true,
      trends: response.content,
      citations: response.metadata?.citations || [],
      sources: response.metadata?.sources || [],
      context: { genre, region },
      lastUpdated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Trends research error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch music trends',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/research/capabilities:
 *   get:
 *     summary: Get research service capabilities
 *     description: Return available research models and features
 *     tags: [Research]
 */
router.get('/capabilities', async (req, res) => {
  try {
    const perplexityProvider = llmProviderManager.providers.get('perplexity');
    
    const capabilities = {
      available: perplexityProvider?.isAvailable() || false,
      provider: 'perplexity',
      features: perplexityProvider?.getCapabilities() || {},
      supportedModes: ['research', 'music', 'general'],
      supportedModels: ['sonar-small', 'sonar-medium', 'sonar-large', 'sonar-pro'],
      maxTokens: 32000,
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

module.exports = router;