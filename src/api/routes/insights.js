const express = require('express');
const { requireAuth } = require('../middleware');

const router = express.Router();

/**
 * Get engagement insights and KPIs
 * GET /api/insights/engagement
 */
router.get('/engagement', requireAuth, async (req, res) => {
  try {
    const { startDate, endDate, userId, limit = 50 } = req.query;
    
    // Parse date range
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days
    const end = endDate ? new Date(endDate) : new Date();
    
    const db = require('../../database/mongodb').getDb();
    const prefix = process.env.MONGODB_COLLECTIONS_PREFIX || 'echotune_';
    
    // Get engagement insights
    const engagementPipeline = [
      {
        $match: {
          timestamp: { $gte: start, $lte: end },
          ...(userId && { user_id: userId })
        }
      },
      {
        $group: {
          _id: {
            user_id: '$user_id',
            event_type: '$event_type',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
          },
          count: { $sum: 1 },
          lastEvent: { $max: '$timestamp' }
        }
      },
      {
        $group: {
          _id: '$_id.user_id',
          events: {
            $push: {
              event_type: '$_id.event_type',
              date: '$_id.date',
              count: '$count',
              lastEvent: '$lastEvent'
            }
          },
          totalEvents: { $sum: '$count' },
          uniqueEventTypes: { $addToSet: '$_id.event_type' },
          lastActivity: { $max: '$lastEvent' }
        }
      },
      {
        $project: {
          user_id: '$_id',
          events: 1,
          totalEvents: 1,
          uniqueEventTypes: { $size: '$uniqueEventTypes' },
          lastActivity: 1,
          engagementScore: {
            $add: [
              { $multiply: ['$totalEvents', 0.4] },
              { $multiply: [{ $size: '$uniqueEventTypes' }, 0.3] },
              { $multiply: [
                { $divide: [
                  { $subtract: [new Date(), '$lastActivity'] },
                  1000 * 60 * 60 * 24
                ] },
                -0.3
              ] }
            ]
          }
        }
      },
      {
        $sort: { engagementScore: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ];
    
    const analyticsCollection = db.collection(`${prefix}analytics_events`);
    const results = await analyticsCollection.aggregate(engagementPipeline).toArray();
    
    // Calculate KPIs
    const kpis = {
      totalUsers: results.length,
      avgEventsPerUser: results.length > 0 ? 
        results.reduce((sum, r) => sum + r.totalEvents, 0) / results.length : 0,
      avgEngagementScore: results.length > 0 ? 
        results.reduce((sum, r) => sum + r.engagementScore, 0) / results.length : 0,
      mostEngagedUser: results[0] || null,
      leastEngagedUser: results[results.length - 1] || null,
      activeUsers: results.filter(r => r.lastActivity > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
      retentionRate: results.length > 0 ? 
        (results.filter(r => r.lastActivity > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length / results.length) * 100 : 0
    };
    
    res.json({
      success: true,
      data: results,
      kpis,
      metadata: {
        startDate: start,
        endDate: end,
        totalRecords: results.length,
        timeRange: `${Math.round((end - start) / (1000 * 60 * 60 * 24))} days`
      }
    });
    
  } catch (error) {
    console.error('Error getting engagement insights:', error);
    res.status(500).json({
      error: 'Failed to get engagement insights',
      message: error.message,
    });
  }
});

/**
 * Get top artists insights
 * GET /api/insights/top-artists
 */
router.get('/top-artists', requireAuth, async (req, res) => {
  try {
    const { startDate, endDate, userId, limit = 20 } = req.query;
    
    // Parse date range
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days
    const end = endDate ? new Date(endDate) : new Date();
    
    const db = require('../../database/mongodb').getDb();
    const prefix = process.env.MONGODB_COLLECTIONS_PREFIX || 'echotune_';
    const historyCollection = db.collection(`${prefix}listening_history`);
    
    // Build aggregation pipeline for top artists
    const pipeline = [
      {
        $match: {
          played_at: { $gte: start, $lte: end },
          ...(userId && { user_id: userId })
        }
      },
      {
        $group: {
          _id: {
            artist_name: '$artist_name',
            artist_id: '$artist_id'
          },
          totalPlays: { $sum: 1 },
          uniqueTracks: { $addToSet: '$track_id' },
          totalDuration: { $sum: '$duration_ms' },
          uniqueUsers: { $addToSet: '$user_id' },
          lastPlayed: { $max: '$played_at' }
        }
      },
      {
        $project: {
          artist_name: '$_id.artist_name',
          artist_id: '$_id.artist_id',
          totalPlays: 1,
          uniqueTracks: { $size: '$uniqueTracks' },
          totalDuration: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
          lastPlayed: 1,
          avgTrackDuration: { $divide: ['$totalDuration', '$totalPlays'] },
          playFrequency: { $divide: ['$totalPlays', { $size: '$uniqueTracks' }] }
        }
      },
      {
        $sort: { totalPlays: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ];
    
    const results = await historyCollection.aggregate(pipeline).toArray();
    
    // Calculate summary statistics
    const summary = {
      totalArtists: results.length,
      totalPlays: results.reduce((sum, r) => sum + r.totalPlays, 0),
      avgPlaysPerArtist: results.length > 0 ? 
        results.reduce((sum, r) => sum + r.totalPlays, 0) / results.length : 0,
      topArtist: results[0] || null,
      mostDiverseArtist: results.reduce((max, r) => 
        r.uniqueTracks > max.uniqueTracks ? r : max, { uniqueTracks: 0 }
      )
    };
    
    res.json({
      success: true,
      data: results,
      summary,
      metadata: {
        startDate: start,
        endDate: end,
        totalRecords: results.length,
        timeRange: `${Math.round((end - start) / (1000 * 60 * 60 * 24))} days`
      }
    });
    
  } catch (error) {
    console.error('Error getting top artists insights:', error);
    res.status(500).json({
      error: 'Failed to get top artists insights',
      message: error.message,
    });
  }
});

/**
 * Get top genres insights
 * GET /api/insights/top-genres
 */
router.get('/top-genres', requireAuth, async (req, res) => {
  try {
    const { startDate, endDate, userId, limit = 15 } = req.query;
    
    // Parse date range
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days
    const end = endDate ? new Date(endDate) : new Date();
    
    const db = require('../../database/mongodb').getDb();
    const prefix = process.env.MONGODB_COLLECTIONS_PREFIX || 'echotune_';
    const historyCollection = db.collection(`${prefix}listening_history`);
    
    // Build aggregation pipeline for top genres
    const pipeline = [
      {
        $match: {
          played_at: { $gte: start, $lte: end },
          ...(userId && { user_id: userId }),
          genres: { $exists: true, $ne: [] }
        }
      },
      {
        $unwind: '$genres'
      },
      {
        $group: {
          _id: '$genres',
          totalPlays: { $sum: 1 },
          uniqueTracks: { $addToSet: '$track_id' },
          uniqueArtists: { $addToSet: '$artist_name' },
          totalDuration: { $sum: '$duration_ms' },
          uniqueUsers: { $addToSet: '$user_id' }
        }
      },
      {
        $project: {
          genre: '$_id',
          totalPlays: 1,
          uniqueTracks: { $size: '$uniqueTracks' },
          uniqueArtists: { $size: '$uniqueArtists' },
          totalDuration: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
          avgTrackDuration: { $divide: ['$totalDuration', '$totalPlays'] },
          diversityScore: {
            $divide: [
              { $add: [{ $size: '$uniqueTracks' }, { $size: '$uniqueArtists' }] },
              2
            ]
          }
        }
      },
      {
        $sort: { totalPlays: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ];
    
    const results = await historyCollection.aggregate(pipeline).toArray();
    
    // Calculate summary statistics
    const summary = {
      totalGenres: results.length,
      totalPlays: results.reduce((sum, r) => sum + r.totalPlays, 0),
      avgPlaysPerGenre: results.length > 0 ? 
        results.reduce((sum, r) => sum + r.totalPlays, 0) / results.length : 0,
      topGenre: results[0] || null,
      mostDiverseGenre: results.reduce((max, r) => 
        r.diversityScore > max.diversityScore ? r : max, { diversityScore: 0 }
      )
    };
    
    res.json({
      success: true,
      data: results,
      summary,
      metadata: {
        startDate: start,
        endDate: end,
        totalRecords: results.length,
        timeRange: `${Math.round((end - start) / (1000 * 60 * 60 * 24))} days`
      }
    });
    
  } catch (error) {
    console.error('Error getting top genres insights:', error);
    res.status(500).json({
      error: 'Failed to get top genres insights',
      message: error.message,
    });
  }
});

/**
 * Get listening time insights
 * GET /api/insights/listening-time
 */
router.get('/listening-time', requireAuth, async (req, res) => {
  try {
    const { startDate, endDate, userId, groupBy = 'day' } = req.query;
    
    // Parse date range
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days
    const end = endDate ? new Date(endDate) : new Date();
    
    const db = require('../../database/mongodb').getDb();
    const prefix = process.env.MONGODB_COLLECTIONS_PREFIX || 'echotune_';
    const historyCollection = db.collection(`${prefix}listening_history`);
    
    // Build aggregation pipeline for listening time
    const pipeline = [
      {
        $match: {
          played_at: { $gte: start, $lte: end },
          ...(userId && { user_id: userId })
        }
      },
      {
        $group: {
          _id: {
            date: groupBy === 'hour' ? 
              { $dateToString: { format: '%Y-%m-%d %H:00', date: '$played_at' } } :
              { $dateToString: { format: '%Y-%m-%d', date: '$played_at' } },
            hour: groupBy === 'hour' ? { $hour: '$played_at' } : null,
            dayOfWeek: groupBy === 'day' ? { $dayOfWeek: '$played_at' } : null
          },
          totalPlays: { $sum: 1 },
          totalDuration: { $sum: '$duration_ms' },
          uniqueTracks: { $addToSet: '$track_id' },
          uniqueUsers: { $addToSet: '$user_id' }
        }
      },
      {
        $project: {
          date: '$_id.date',
          hour: '$_id.hour',
          dayOfWeek: '$_id.dayOfWeek',
          totalPlays: 1,
          totalDuration: 1,
          totalDurationHours: { $divide: ['$totalDuration', 1000 * 60 * 60] },
          uniqueTracks: { $size: '$uniqueTracks' },
          uniqueUsers: { $size: '$uniqueUsers' },
          avgSessionLength: { $divide: ['$totalDuration', '$totalPlays'] }
        }
      },
      {
        $sort: { date: 1 }
      }
    ];
    
    const results = await historyCollection.aggregate(pipeline).toArray();
    
    // Calculate summary statistics
    const summary = {
      totalPlays: results.reduce((sum, r) => sum + r.totalPlays, 0),
      totalDuration: results.reduce((sum, r) => sum + r.totalDuration, 0),
      totalDurationHours: results.reduce((sum, r) => sum + r.totalDurationHours, 0),
      avgSessionLength: results.length > 0 ? 
        results.reduce((sum, r) => sum + r.avgSessionLength, 0) / results.length : 0,
      peakListeningTime: results.reduce((max, r) => 
        r.totalDuration > max.totalDuration ? r : max, { totalDuration: 0 }
      ),
      avgPlaysPerPeriod: results.length > 0 ? 
        results.reduce((sum, r) => sum + r.totalPlays, 0) / results.length : 0
    };
    
    res.json({
      success: true,
      data: results,
      summary,
      metadata: {
        startDate: start,
        endDate: end,
        totalRecords: results.length,
        groupBy,
        timeRange: `${Math.round((end - start) / (1000 * 60 * 60 * 24))} days`
      }
    });
    
  } catch (error) {
    console.error('Error getting listening time insights:', error);
    res.status(500).json({
      error: 'Failed to get listening time insights',
      message: error.message,
    });
  }
});

module.exports = router;
