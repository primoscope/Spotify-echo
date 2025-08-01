const express = require('express');
const SpotifyAudioFeaturesService = require('../../spotify/audio-features');
const { requireAuth, createRateLimit } = require('../middleware');

const router = express.Router();
const spotifyService = new SpotifyAudioFeaturesService();

// Rate limiting for Spotify endpoints
const spotifyRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Higher limit for data processing
  message: 'Too many Spotify API requests, please slow down'
});

/**
 * Get audio features for a track
 * GET /api/spotify/audio-features/:trackId
 */
router.get('/audio-features/:trackId', requireAuth, spotifyRateLimit, async (req, res) => {
  try {
    const { trackId } = req.params;
    const { accessToken } = req.query;

    if (!accessToken) {
      return res.status(400).json({
        error: 'Missing access token',
        message: 'Spotify access token is required'
      });
    }

    const audioFeatures = await spotifyService.getAudioFeatures(trackId, accessToken);

    res.json({
      success: true,
      trackId,
      audioFeatures
    });

  } catch (error) {
    console.error('Error getting audio features:', error);
    res.status(500).json({
      error: 'Failed to get audio features',
      message: error.message
    });
  }
});

/**
 * Get audio features for multiple tracks
 * POST /api/spotify/audio-features/batch
 */
router.post('/audio-features/batch', requireAuth, spotifyRateLimit, async (req, res) => {
  try {
    const { trackIds, accessToken } = req.body;

    if (!accessToken || !trackIds || !Array.isArray(trackIds)) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'accessToken and trackIds array are required'
      });
    }

    if (trackIds.length > 100) {
      return res.status(400).json({
        error: 'Too many tracks',
        message: 'Maximum 100 tracks per batch request'
      });
    }

    const result = await spotifyService.getBatchAudioFeatures(trackIds, accessToken, {
      onProgress: (progress) => {
        // Could emit progress via WebSocket in real-time applications
        console.log(`Progress: ${progress.processed}/${progress.total}`);
      }
    });

    res.json({
      success: true,
      result,
      processedCount: result.totalProcessed,
      errorCount: result.errors.length
    });

  } catch (error) {
    console.error('Error getting batch audio features:', error);
    res.status(500).json({
      error: 'Failed to get batch audio features',
      message: error.message
    });
  }
});

/**
 * Get track metadata
 * GET /api/spotify/track/:trackId
 */
router.get('/track/:trackId', requireAuth, spotifyRateLimit, async (req, res) => {
  try {
    const { trackId } = req.params;
    const { accessToken } = req.query;

    if (!accessToken) {
      return res.status(400).json({
        error: 'Missing access token',
        message: 'Spotify access token is required'
      });
    }

    const metadata = await spotifyService.getTrackMetadata(trackId, accessToken);

    res.json({
      success: true,
      trackId,
      metadata
    });

  } catch (error) {
    console.error('Error getting track metadata:', error);
    res.status(500).json({
      error: 'Failed to get track metadata',
      message: error.message
    });
  }
});

/**
 * Get metadata for multiple tracks
 * POST /api/spotify/tracks/batch
 */
router.post('/tracks/batch', requireAuth, spotifyRateLimit, async (req, res) => {
  try {
    const { trackIds, accessToken } = req.body;

    if (!accessToken || !trackIds || !Array.isArray(trackIds)) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'accessToken and trackIds array are required'
      });
    }

    if (trackIds.length > 50) {
      return res.status(400).json({
        error: 'Too many tracks',
        message: 'Maximum 50 tracks per batch request'
      });
    }

    const metadata = await spotifyService.getBatchTrackMetadata(trackIds, accessToken);

    res.json({
      success: true,
      tracks: metadata,
      count: metadata.length
    });

  } catch (error) {
    console.error('Error getting batch track metadata:', error);
    res.status(500).json({
      error: 'Failed to get batch track metadata',
      message: error.message
    });
  }
});

/**
 * Process CSV listening history with audio features
 * POST /api/spotify/process-history
 */
router.post('/process-history', requireAuth, spotifyRateLimit, async (req, res) => {
  try {
    const { listeningHistory, accessToken, includeMetadata = true } = req.body;

    if (!accessToken || !listeningHistory || !Array.isArray(listeningHistory)) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'accessToken and listeningHistory array are required'
      });
    }

    if (listeningHistory.length > 1000) {
      return res.status(400).json({
        error: 'Too much data',
        message: 'Maximum 1000 listening history items per request. Consider breaking into smaller batches.'
      });
    }

    const enrichedHistory = await spotifyService.enrichListeningHistory(
      listeningHistory,
      accessToken,
      {
        includeMetadata,
        onProgress: (progress) => {
          console.log(`Processing: ${progress.stage} - ${progress.processed}/${progress.total}`);
        }
      }
    );

    // Store enriched data in database
    const db = require('../../database/mongodb').getDb();
    const listeningHistoryCollection = db.collection('listening_history');

    const operations = enrichedHistory.map(item => ({
      updateOne: {
        filter: {
          user_id: req.userId,
          track_id: item.track_id,
          played_at: item.played_at
        },
        update: { $set: { ...item, user_id: req.userId } },
        upsert: true
      }
    }));

    if (operations.length > 0) {
      await listeningHistoryCollection.bulkWrite(operations);
    }

    res.json({
      success: true,
      processedItems: enrichedHistory.length,
      enrichedHistory: enrichedHistory.slice(0, 10), // Return first 10 for preview
      message: 'Listening history processed and stored successfully'
    });

  } catch (error) {
    console.error('Error processing listening history:', error);
    res.status(500).json({
      error: 'Failed to process listening history',
      message: error.message
    });
  }
});

/**
 * Get cached audio features
 * POST /api/spotify/cached-features
 */
router.post('/cached-features', requireAuth, async (req, res) => {
  try {
    const { trackIds } = req.body;

    if (!trackIds || !Array.isArray(trackIds)) {
      return res.status(400).json({
        error: 'Missing trackIds',
        message: 'trackIds array is required'
      });
    }

    const cachedFeatures = await spotifyService.getCachedAudioFeatures(trackIds);

    res.json({
      success: true,
      cachedFeatures,
      count: cachedFeatures.length,
      cacheHitRate: cachedFeatures.length / trackIds.length
    });

  } catch (error) {
    console.error('Error getting cached features:', error);
    res.status(500).json({
      error: 'Failed to get cached features',
      message: error.message
    });
  }
});

/**
 * Get missing track IDs that need audio features
 * POST /api/spotify/missing-features
 */
router.post('/missing-features', requireAuth, async (req, res) => {
  try {
    const { trackIds } = req.body;

    if (!trackIds || !Array.isArray(trackIds)) {
      return res.status(400).json({
        error: 'Missing trackIds',
        message: 'trackIds array is required'
      });
    }

    const missingTrackIds = await spotifyService.getMissingTrackIds(trackIds);

    res.json({
      success: true,
      missingTrackIds,
      missingCount: missingTrackIds.length,
      totalRequested: trackIds.length,
      cacheHitRate: (trackIds.length - missingTrackIds.length) / trackIds.length
    });

  } catch (error) {
    console.error('Error getting missing track IDs:', error);
    res.status(500).json({
      error: 'Failed to get missing track IDs',
      message: error.message
    });
  }
});

/**
 * Get Spotify service statistics
 * GET /api/spotify/stats
 */
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const cacheStats = spotifyService.getCacheStats();
    
    // Get database statistics
    const db = require('../../database/mongodb').getDb();
    const [audioFeaturesCount, trackMetadataCount, listeningHistoryCount] = await Promise.all([
      db.collection('audio_features').countDocuments(),
      db.collection('track_metadata').countDocuments(),
      db.collection('listening_history').countDocuments({ user_id: req.userId })
    ]);

    res.json({
      success: true,
      stats: {
        cache: cacheStats,
        database: {
          audioFeatures: audioFeaturesCount,
          trackMetadata: trackMetadataCount,
          userListeningHistory: listeningHistoryCount
        },
        service: {
          name: 'SpotifyAudioFeaturesService',
          status: 'active'
        }
      }
    });

  } catch (error) {
    console.error('Error getting Spotify stats:', error);
    res.status(500).json({
      error: 'Failed to get Spotify statistics',
      message: error.message
    });
  }
});

/**
 * Clear service cache
 * POST /api/spotify/clear-cache
 */
router.post('/clear-cache', requireAuth, async (req, res) => {
  try {
    spotifyService.clearCache();

    res.json({
      success: true,
      message: 'Service cache cleared successfully'
    });

  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      error: 'Failed to clear cache',
      message: error.message
    });
  }
});

/**
 * Upload and process CSV file
 * POST /api/spotify/upload-csv
 */
router.post('/upload-csv', requireAuth, async (req, res) => {
  try {
    // This would handle file upload and CSV parsing
    // For now, return a placeholder response
    res.json({
      success: true,
      message: 'CSV upload endpoint ready',
      note: 'File upload functionality to be implemented with multer middleware'
    });

  } catch (error) {
    console.error('Error uploading CSV:', error);
    res.status(500).json({
      error: 'Failed to upload CSV',
      message: error.message
    });
  }
});

/**
 * Health check for Spotify service
 * GET /api/spotify/health
 */
router.get('/health', async (req, res) => {
  try {
    const cacheStats = spotifyService.getCacheStats();
    
    res.json({
      status: 'healthy',
      service: 'SpotifyAudioFeaturesService',
      cache: cacheStats,
      rateLimiter: {
        status: 'active'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;