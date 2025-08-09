const express = require('express');
const router = express.Router();
const NodeCache = require('node-cache');
const { requireAuth, createRateLimit } = require('../middleware');

// Enhanced cache for insights with longer TTL
const insightsCache = new NodeCache({ 
  stdTTL: 300, // 5 minutes cache for insights
  checkperiod: 60 
});

// Rate limiting specifically for insights endpoints
const insightsRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Lower limit for complex analytics
  message: 'Too many insights requests, please try again later',
});

/**
 * Enhanced Spotify Insights API
 * Provides comprehensive music analytics with caching and pagination
 */
class SpotifyInsightsService {
  constructor() {
    this.dbManager = require('../../database/mongodb-manager');
  }

  /**
   * Get paginated listening history with audio features trends
   */
  async getListeningTrends(options = {}) {
    const cacheKey = `listening_trends_${JSON.stringify(options)}`;
    const cached = insightsCache.get(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }

    try {
      const {
        page = 1,
        limit = 50,
        timeRange = '30d',
        userId,
        features = ['energy', 'valence', 'danceability']
      } = options;

      const offset = (page - 1) * limit;
      const timeFilter = this.getTimeFilter(timeRange);

      let query = { playedAt: { $gte: timeFilter } };
      if (userId) {
        query.userId = userId;
      }

      if (!this.dbManager.isConnected()) {
        return this.getFallbackTrends(options);
      }

      const db = this.dbManager.getDatabase();
      const collection = db.collection('listening_history');

      // Get paginated results with audio features
      const results = await collection
        .aggregate([
          { $match: query },
          {
            $lookup: {
              from: 'audio_features',
              localField: 'trackId',
              foreignField: 'trackId',
              as: 'audioFeatures'
            }
          },
          {
            $addFields: {
              audioFeatures: { $arrayElemAt: ['$audioFeatures', 0] }
            }
          },
          { $sort: { playedAt: -1 } },
          { $skip: offset },
          { $limit: limit }
        ])
        .toArray();

      // Get total count for pagination
      const totalCount = await collection.countDocuments(query);

      // Calculate trend analysis
      const trendAnalysis = this.calculateAudioFeatureTrends(results, features);

      const response = {
        data: results,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page * limit < totalCount,
          hasPrev: page > 1
        },
        trends: trendAnalysis,
        features,
        timeRange,
        generatedAt: new Date().toISOString()
      };

      insightsCache.set(cacheKey, response);
      return response;

    } catch (error) {
      console.error('Error getting listening trends:', error);
      throw new Error(`Failed to get listening trends: ${error.message}`);
    }
  }

  /**
   * Get comprehensive song analytics with audio features
   */
  async getSongInsights(trackId, options = {}) {
    const cacheKey = `song_insights_${trackId}_${JSON.stringify(options)}`;
    const cached = insightsCache.get(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }

    try {
      if (!this.dbManager.isConnected()) {
        return this.getFallbackSongInsights(trackId);
      }

      const db = this.dbManager.getDatabase();
      
      // Get audio features and listening data
      const [audioFeatures, listeningData, similarTracks] = await Promise.all([
        db.collection('audio_features').findOne({ trackId }),
        this.getSongListeningData(trackId, options),
        this.getSimilarTracks(trackId, options.limit || 10)
      ]);

      const insights = {
        trackId,
        audioFeatures,
        listening: listeningData,
        similarTracks,
        analysis: this.analyzeTrackFeatures(audioFeatures),
        generatedAt: new Date().toISOString()
      };

      insightsCache.set(cacheKey, insights);
      return insights;

    } catch (error) {
      console.error('Error getting song insights:', error);
      throw new Error(`Failed to get song insights: ${error.message}`);
    }
  }

  /**
   * Get playlist analytics and trends
   */
  async getPlaylistInsights(playlistId, options = {}) {
    const cacheKey = `playlist_insights_${playlistId}_${JSON.stringify(options)}`;
    const cached = insightsCache.get(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }

    try {
      const { includeAudioFeatures = true, analyzeTrends = true } = options;

      if (!this.dbManager.isConnected()) {
        return this.getFallbackPlaylistInsights(playlistId);
      }

      const db = this.dbManager.getDatabase();
      
      // Get playlist data
      const playlist = await db.collection('playlists').findOne({ id: playlistId });
      if (!playlist) {
        throw new Error('Playlist not found');
      }

      let insights = {
        playlistId,
        name: playlist.name,
        trackCount: playlist.tracks?.length || 0,
        generatedAt: new Date().toISOString()
      };

      if (includeAudioFeatures && playlist.tracks) {
        const trackIds = playlist.tracks.map(t => t.id || t.trackId);
        const audioFeatures = await db.collection('audio_features')
          .find({ trackId: { $in: trackIds } })
          .toArray();

        insights.audioFeatures = this.analyzePlaylistAudioFeatures(audioFeatures);
      }

      if (analyzeTrends) {
        insights.trends = await this.analyzePlaylistTrends(playlistId);
      }

      insightsCache.set(cacheKey, insights);
      return insights;

    } catch (error) {
      console.error('Error getting playlist insights:', error);
      throw new Error(`Failed to get playlist insights: ${error.message}`);
    }
  }

  // Helper methods
  getTimeFilter(timeRange) {
    const now = new Date();
    switch (timeRange) {
      case '24h': return new Date(now - 24 * 60 * 60 * 1000);
      case '7d': return new Date(now - 7 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(now - 30 * 24 * 60 * 60 * 1000);
      case '90d': return new Date(now - 90 * 24 * 60 * 60 * 1000);
      case '1y': return new Date(now - 365 * 24 * 60 * 60 * 1000);
      default: return new Date(now - 30 * 24 * 60 * 60 * 1000);
    }
  }

  calculateAudioFeatureTrends(data, features) {
    if (!data || data.length === 0) return {};

    const trends = {};
    features.forEach(feature => {
      const values = data
        .filter(item => item.audioFeatures && item.audioFeatures[feature] !== undefined)
        .map(item => item.audioFeatures[feature]);
      
      if (values.length > 0) {
        trends[feature] = {
          average: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          trend: this.calculateTrend(values),
          dataPoints: values.length
        };
      }
    });

    return trends;
  }

  calculateTrend(values) {
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const diff = secondAvg - firstAvg;
    if (Math.abs(diff) < 0.05) return 'stable';
    return diff > 0 ? 'increasing' : 'decreasing';
  }

  analyzeTrackFeatures(audioFeatures) {
    if (!audioFeatures) return null;

    const analysis = {
      energy_level: this.categorizeValue(audioFeatures.energy, 'energy'),
      mood: this.categorizeValue(audioFeatures.valence, 'mood'),
      danceability_level: this.categorizeValue(audioFeatures.danceability, 'danceability'),
      tempo_category: this.categorizeValue(audioFeatures.tempo, 'tempo'),
      key_signature: audioFeatures.key,
      time_signature: audioFeatures.time_signature
    };

    return analysis;
  }

  categorizeValue(value, type) {
    switch (type) {
      case 'energy':
        if (value < 0.3) return 'low';
        if (value < 0.7) return 'medium';
        return 'high';
      case 'mood':
        if (value < 0.3) return 'sad';
        if (value < 0.7) return 'neutral';
        return 'happy';
      case 'danceability':
        if (value < 0.3) return 'low';
        if (value < 0.7) return 'medium';
        return 'high';
      case 'tempo':
        if (value < 90) return 'slow';
        if (value < 120) return 'moderate';
        if (value < 140) return 'fast';
        return 'very_fast';
      default:
        return 'unknown';
    }
  }

  async getSongListeningData(trackId, options) {
    const db = this.dbManager.getDatabase();
    const collection = db.collection('listening_history');
    
    const data = await collection.aggregate([
      { $match: { trackId } },
      {
        $group: {
          _id: null,
          totalPlays: { $sum: 1 },
          uniqueListeners: { $addToSet: '$userId' },
          firstPlayed: { $min: '$playedAt' },
          lastPlayed: { $max: '$playedAt' }
        }
      }
    ]).toArray();

    return data[0] || { totalPlays: 0, uniqueListeners: [], firstPlayed: null, lastPlayed: null };
  }

  async getSimilarTracks(trackId, limit = 10) {
    // Simplified similar tracks based on audio features
    const db = this.dbManager.getDatabase();
    const targetFeatures = await db.collection('audio_features').findOne({ trackId });
    
    if (!targetFeatures) return [];

    const similar = await db.collection('audio_features')
      .find({ 
        trackId: { $ne: trackId },
        energy: { $gte: targetFeatures.energy - 0.1, $lte: targetFeatures.energy + 0.1 },
        valence: { $gte: targetFeatures.valence - 0.1, $lte: targetFeatures.valence + 0.1 }
      })
      .limit(limit)
      .toArray();

    return similar;
  }

  analyzePlaylistAudioFeatures(audioFeatures) {
    if (!audioFeatures || audioFeatures.length === 0) return null;

    const features = ['energy', 'valence', 'danceability', 'acousticness', 'instrumentalness'];
    const analysis = {};

    features.forEach(feature => {
      const values = audioFeatures.map(f => f[feature]).filter(v => v !== undefined);
      if (values.length > 0) {
        analysis[feature] = {
          average: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          distribution: this.calculateDistribution(values)
        };
      }
    });

    return analysis;
  }

  calculateDistribution(values) {
    const bins = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
    const distribution = bins.map(() => 0);
    
    values.forEach(value => {
      const binIndex = Math.min(Math.floor(value * 5), 4);
      distribution[binIndex]++;
    });

    return distribution.map(count => count / values.length);
  }

  async analyzePlaylistTrends(playlistId) {
    // Analyze how playlist composition has changed over time
    const db = this.dbManager.getDatabase();
    const collection = db.collection('playlist_history');
    
    const history = await collection
      .find({ playlistId })
      .sort({ timestamp: 1 })
      .toArray();

    return {
      totalChanges: history.length,
      lastModified: history[history.length - 1]?.timestamp,
      changeFrequency: this.calculateChangeFrequency(history)
    };
  }

  calculateChangeFrequency(history) {
    if (history.length < 2) return 'static';
    
    const timeSpan = new Date(history[history.length - 1].timestamp) - new Date(history[0].timestamp);
    const daysSpan = timeSpan / (1000 * 60 * 60 * 24);
    const changesPerDay = history.length / daysSpan;
    
    if (changesPerDay > 1) return 'very_active';
    if (changesPerDay > 0.5) return 'active';
    if (changesPerDay > 0.1) return 'moderate';
    return 'low';
  }

  // Fallback methods for when MongoDB is not connected
  getFallbackTrends(options) {
    return {
      data: [],
      pagination: { page: 1, limit: options.limit || 50, totalCount: 0, totalPages: 0, hasNext: false, hasPrev: false },
      trends: {},
      features: options.features || [],
      fallback: true,
      message: 'Using fallback data - MongoDB not connected'
    };
  }

  getFallbackSongInsights(trackId) {
    return {
      trackId,
      audioFeatures: null,
      listening: { totalPlays: 0, uniqueListeners: [] },
      similarTracks: [],
      analysis: null,
      fallback: true,
      message: 'Using fallback data - MongoDB not connected'
    };
  }

  getFallbackPlaylistInsights(playlistId) {
    return {
      playlistId,
      name: 'Unknown Playlist',
      trackCount: 0,
      fallback: true,
      message: 'Using fallback data - MongoDB not connected'
    };
  }
}

const insightsService = new SpotifyInsightsService();

/**
 * GET /api/insights/listening-trends
 * Get paginated listening history with audio features trends
 */
router.get('/listening-trends', requireAuth, insightsRateLimit, async (req, res) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: Math.min(parseInt(req.query.limit) || 50, 100), // Max 100 items per page
      timeRange: req.query.timeRange || '30d',
      userId: req.query.userId,
      features: req.query.features ? req.query.features.split(',') : ['energy', 'valence', 'danceability']
    };

    const result = await insightsService.getListeningTrends(options);
    
    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error getting listening trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get listening trends',
      message: error.message
    });
  }
});

/**
 * GET /api/insights/song/:trackId
 * Get comprehensive song analytics with audio features
 */
router.get('/song/:trackId', requireAuth, insightsRateLimit, async (req, res) => {
  try {
    const { trackId } = req.params;
    const options = {
      limit: parseInt(req.query.limit) || 10
    };

    const result = await insightsService.getSongInsights(trackId, options);
    
    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error getting song insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get song insights',
      message: error.message
    });
  }
});

/**
 * GET /api/insights/playlist/:playlistId
 * Get playlist analytics and trends
 */
router.get('/playlist/:playlistId', requireAuth, insightsRateLimit, async (req, res) => {
  try {
    const { playlistId } = req.params;
    const options = {
      includeAudioFeatures: req.query.includeAudioFeatures !== 'false',
      analyzeTrends: req.query.analyzeTrends !== 'false'
    };

    const result = await insightsService.getPlaylistInsights(playlistId, options);
    
    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error getting playlist insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get playlist insights',
      message: error.message
    });
  }
});

/**
 * POST /api/insights/cache/clear
 * Clear insights cache (admin only)
 */
router.post('/cache/clear', requireAuth, async (req, res) => {
  try {
    insightsCache.flushAll();
    
    res.json({
      success: true,
      message: 'Insights cache cleared successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
      message: error.message
    });
  }
});

/**
 * GET /api/insights/cache/stats
 * Get cache statistics
 */
router.get('/cache/stats', requireAuth, async (req, res) => {
  try {
    const stats = insightsCache.getStats();
    
    res.json({
      success: true,
      cache: {
        keys: stats.keys,
        hits: stats.hits,
        misses: stats.misses,
        hitRate: stats.hits / (stats.hits + stats.misses) || 0,
        ksize: stats.ksize,
        vsize: stats.vsize
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cache stats',
      message: error.message
    });
  }
});

module.exports = router;