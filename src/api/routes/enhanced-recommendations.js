/**
 * Enhanced Recommendation API Routes
 * 
 * Advanced API endpoints for the enhanced recommendation engine
 * with explainable AI, real-time learning, and feedback processing.
 * 
 * Features:
 * - Advanced recommendation generation with multiple algorithms
 * - Explainable AI responses with detailed reasoning
 * - Real-time feedback processing and learning
 * - Context-aware recommendations
 * - Performance metrics and analytics
 */

const express = require('express');
const router = express.Router();
const { EnhancedLLMProviderManager } = require('../../ai/enhanced-llm-provider');
const { AdvancedMusicRecommendationEngine } = require('../../ai/advanced-recommendation-engine');

// Initialize AI systems
let llmManager = null;
let recommendationEngine = null;

// Initialize AI systems with database connection
const initializeAISystems = (databaseManager) => {
  if (!llmManager) {
    llmManager = new EnhancedLLMProviderManager();
    console.log('✅ Enhanced LLM Provider Manager initialized');
  }
  
  if (!recommendationEngine) {
    recommendationEngine = new AdvancedMusicRecommendationEngine(databaseManager);
    console.log('✅ Advanced Recommendation Engine initialized');
  }
};

/**
 * Generate advanced recommendations with explainable AI
 * POST /api/recommendations/advanced
 */
router.post('/advanced', async (req, res) => {
  try {
    const { userId, context = {}, options = {} } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
        code: 'MISSING_USER_ID'
      });
    }

    // Initialize AI systems if needed
    if (!recommendationEngine) {
      initializeAISystems(req.app.locals.databaseManager);
    }

    console.log(`🎯 Generating advanced recommendations for user: ${userId}`);

    // Generate recommendations with explainable AI
    const recommendationResult = await recommendationEngine.generateRecommendations(
      userId,
      {
        limit: options.limit || 20,
        context,
        includeExplanations: options.includeExplanations !== false,
        diversityFactor: options.diversityFactor || 0.3,
        freshnessFactor: options.freshnessFactor || 0.1
      }
    );

    // If LLM enhancement is requested, add AI-generated insights
    if (options.enhanceWithAI && llmManager) {
      try {
        const aiInsights = await generateAIInsights(recommendationResult, context);
        recommendationResult.aiInsights = aiInsights;
      } catch (aiError) {
        console.warn('Failed to generate AI insights:', aiError.message);
        // Continue without AI insights
      }
    }

    res.json({
      success: true,
      data: recommendationResult,
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - req.startTime
    });

  } catch (error) {
    console.error('Error generating advanced recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate recommendations',
      code: 'RECOMMENDATION_ERROR',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Process user feedback for continuous learning
 * POST /api/recommendations/feedback
 */
router.post('/feedback', async (req, res) => {
  try {
    const { userId, trackId, feedback } = req.body;

    if (!userId || !trackId || !feedback) {
      return res.status(400).json({
        success: false,
        error: 'User ID, track ID, and feedback are required',
        code: 'MISSING_PARAMETERS'
      });
    }

    // Initialize AI systems if needed
    if (!recommendationEngine) {
      initializeAISystems(req.app.locals.databaseManager);
    }

    console.log(`📊 Processing feedback: ${userId} -> ${trackId} (${feedback.action})`);

    // Process feedback for learning
    await recommendationEngine.processFeedback(userId, trackId, feedback);

    // Track analytics event
    if (req.app.locals.analyticsManager) {
      await req.app.locals.analyticsManager.trackEvent({
        userId,
        eventType: 'recommendation_feedback',
        eventData: {
          trackId,
          action: feedback.action,
          rating: feedback.rating,
          context: feedback.context,
          timestamp: new Date().toISOString()
        }
      });
    }

    res.json({
      success: true,
      message: 'Feedback processed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process feedback',
      code: 'FEEDBACK_ERROR',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get recommendation engine metrics and performance stats
 * GET /api/recommendations/metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    // Initialize AI systems if needed
    if (!recommendationEngine) {
      initializeAISystems(req.app.locals.databaseManager);
    }

    const metrics = {
      engine: recommendationEngine ? recommendationEngine.getMetrics() : null,
      llm: llmManager ? llmManager.getMetrics() : null,
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Error getting recommendation metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get metrics',
      code: 'METRICS_ERROR'
    });
  }
});

/**
 * Get user's recommendation history
 * GET /api/recommendations/history/:userId
 */
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0, includeInteracted = 'true' } = req.query;

    const query = { userId };
    if (includeInteracted === 'false') {
      query.interacted = false;
    }

    const recommendations = await req.app.locals.databaseManager.find(
      'recommendations',
      query,
      {
        sort: { timestamp: -1 },
        limit: parseInt(limit),
        skip: parseInt(offset)
      }
    );

    res.json({
      success: true,
      data: {
        recommendations,
        total: recommendations.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('Error getting recommendation history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recommendation history',
      code: 'HISTORY_ERROR'
    });
  }
});

/**
 * Update user preferences manually
 * PUT /api/recommendations/preferences/:userId
 */
router.put('/preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const preferences = req.body;

    // Validate preferences structure
    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid preferences format',
        code: 'INVALID_PREFERENCES'
      });
    }

    // Update user preferences
    await req.app.locals.databaseManager.updateOne(
      'user_preferences',
      { userId },
      {
        $set: {
          ...preferences,
          updatedAt: new Date(),
          manuallyUpdated: true
        }
      },
      { upsert: true }
    );

    // Clear recommendation engine cache for this user
    if (recommendationEngine) {
      recommendationEngine.userProfiles.delete(userId);
    }

    res.json({
      success: true,
      message: 'User preferences updated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating user preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update preferences',
      code: 'PREFERENCES_ERROR'
    });
  }
});

/**
 * Generate AI insights for recommendations
 */
async function generateAIInsights(recommendationResult, context) {
  if (!llmManager) return null;

  try {
    const prompt = `Analyze these music recommendations and provide insights:

Recommendations: ${JSON.stringify(recommendationResult.recommendations.slice(0, 5), null, 2)}
Context: ${JSON.stringify(context, null, 2)}
Metadata: ${JSON.stringify(recommendationResult.metadata, null, 2)}

Provide brief insights about:
1. Overall recommendation quality and diversity
2. How well the recommendations match the user's context
3. Suggestions for improving future recommendations
4. Notable patterns or trends in the recommendations

Keep the response concise and user-friendly.`;

    const aiResponse = await llmManager.generateResponse({
      prompt,
      context: {
        systemPrompt: 'You are an AI music analyst providing insights about recommendation quality and user preferences.'
      }
    });

    return {
      analysis: aiResponse.response,
      provider: aiResponse.provider,
      confidence: aiResponse.cost > 0 ? 'high' : 'medium',
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error generating AI insights:', error);
    return null;
  }
}

/**
 * Get recommendation performance analytics
 * GET /api/recommendations/analytics
 */
router.get('/analytics', async (req, res) => {
  try {
    const { timeRange = '7d', userId } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '1d':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '3m':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    const query = {
      timestamp: { $gte: startDate, $lte: endDate }
    };
    
    if (userId) {
      query.userId = userId;
    }

    // Get recommendation data
    const recommendations = await req.app.locals.databaseManager.find(
      'recommendations',
      query,
      { sort: { timestamp: -1 } }
    );

    // Calculate analytics
    const analytics = {
      totalRecommendations: recommendations.length,
      interactionRate: recommendations.length > 0 
        ? recommendations.filter(r => r.interacted).length / recommendations.length 
        : 0,
      positiveRate: recommendations.length > 0
        ? recommendations.filter(r => r.feedback === 'like' || r.feedback === 'play').length / recommendations.length
        : 0,
      averageRank: recommendations.length > 0
        ? recommendations.reduce((sum, r) => sum + (r.rank || 0), 0) / recommendations.length
        : 0,
      modelPerformance: {},
      timeDistribution: []
    };

    // Calculate model performance
    if (recommendations.length > 0) {
      const modelStats = {};
      recommendations.forEach(rec => {
        if (rec.modelContributions) {
          Object.entries(rec.modelContributions).forEach(([model, contribution]) => {
            if (!modelStats[model]) {
              modelStats[model] = { total: 0, positive: 0, count: 0 };
            }
            modelStats[model].total += contribution;
            modelStats[model].count += 1;
            if (rec.feedback === 'like' || rec.feedback === 'play') {
              modelStats[model].positive += 1;
            }
          });
        }
      });

      Object.entries(modelStats).forEach(([model, stats]) => {
        analytics.modelPerformance[model] = {
          avgContribution: stats.total / stats.count,
          successRate: stats.positive / stats.count,
          totalRecommendations: stats.count
        };
      });
    }

    // Calculate time distribution
    const hourlyStats = {};
    recommendations.forEach(rec => {
      const hour = new Date(rec.timestamp).getHours();
      hourlyStats[hour] = (hourlyStats[hour] || 0) + 1;
    });

    analytics.timeDistribution = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: hourlyStats[hour] || 0
    }));

    res.json({
      success: true,
      data: analytics,
      timeRange,
      dateRange: { startDate, endDate }
    });

  } catch (error) {
    console.error('Error getting recommendation analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics',
      code: 'ANALYTICS_ERROR'
    });
  }
});

/**
 * Clear user recommendation cache
 * POST /api/recommendations/clear-cache/:userId
 */
router.post('/clear-cache/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (recommendationEngine && recommendationEngine.userProfiles) {
      recommendationEngine.userProfiles.delete(userId);
      recommendationEngine.cache.clear();
    }

    res.json({
      success: true,
      message: 'Cache cleared successfully',
      userId
    });

  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
      code: 'CACHE_ERROR'
    });
  }
});

// Add middleware to track request timing
router.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

module.exports = router;