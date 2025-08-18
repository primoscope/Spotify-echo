// MongoDB Analytics and Insights API
// Provides comprehensive database analytics and insights

const express = require('express');
const { requireAuth } = require('../middleware');

const router = express.Router();

/**
 * Get provider analytics data
 * GET /api/analytics/providers
 */
router.get('/providers', requireAuth, async (req, res) => {
  try {
    const { startDate, endDate, provider, limit = 100 } = req.query;
    
    // Parse date range
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default to last 24h
    const end = endDate ? new Date(endDate) : new Date();
    
    const db = require('../../database/mongodb').getDb();
    const prefix = process.env.MONGODB_COLLECTIONS_PREFIX || 'echotune_';
    const telemetryCollection = db.collection(`${prefix}provider_telemetry`);
    
    // Build aggregation pipeline
    const pipeline = [
      {
        $match: {
          timestamp: { $gte: start, $lte: end },
          ...(provider && { provider })
        }
      },
      {
        $group: {
          _id: {
            provider: '$provider',
            model: '$model',
            hour: { $hour: '$timestamp' },
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
          },
          totalRequests: { $sum: 1 },
          successfulRequests: { $sum: { $cond: ['$success', 1, 0] } },
          failedRequests: { $sum: { $cond: ['$success', 0, 1] } },
          avgLatency: { $avg: '$latencyMs' },
          p50Latency: { $percentile: { input: '$latencyMs', p: 0.5 } },
          p95Latency: { $percentile: { input: '$latencyMs', p: 0.95 } },
          minLatency: { $min: '$latencyMs' },
          maxLatency: { $max: '$latencyMs' }
        }
      },
      {
        $group: {
          _id: {
            provider: '$_id.provider',
            model: '$_id.model'
          },
          timeSeries: {
            $push: {
              date: '$_id.date',
              hour: '$_id.hour',
              totalRequests: '$totalRequests',
              successfulRequests: '$successfulRequests',
              failedRequests: '$failedRequests',
              avgLatency: '$avgLatency',
              p50Latency: '$p50Latency',
              p95Latency: '$p95Latency'
            }
          },
          totalRequests: { $sum: '$totalRequests' },
          successfulRequests: { $sum: '$successfulRequests' },
          failedRequests: { $sum: '$failedRequests' },
          avgLatency: { $avg: '$avgLatency' },
          p50Latency: { $avg: '$p50Latency' },
          p95Latency: { $avg: '$p95Latency' }
        }
      },
      {
        $project: {
          provider: '$_id.provider',
          model: '$_id.model',
          timeSeries: 1,
          totalRequests: 1,
          successfulRequests: 1,
          failedRequests: 1,
          successRate: {
            $multiply: [
              { $divide: ['$successfulRequests', '$totalRequests'] },
              100
            ]
          },
          avgLatency: { $round: ['$avgLatency', 2] },
          p50Latency: { $round: ['$p50Latency', 2] },
          p95Latency: { $round: ['$p95Latency', 2] }
        }
      },
      {
        $sort: { totalRequests: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ];
    
    const results = await telemetryCollection.aggregate(pipeline).toArray();
    
    res.json({
      success: true,
      data: results,
      metadata: {
        startDate: start,
        endDate: end,
        totalProviders: results.length,
        totalRequests: results.reduce((sum, r) => sum + r.totalRequests, 0),
        overallSuccessRate: results.length > 0 ? 
          results.reduce((sum, r) => sum + r.successfulRequests, 0) / 
          results.reduce((sum, r) => sum + r.totalRequests, 0) * 100 : 0
      }
    });
    
  } catch (error) {
    console.error('Error getting provider analytics:', error);
    res.status(500).json({
      error: 'Failed to get provider analytics',
      message: error.message,
    });
  }
});

/**
 * Get listening patterns analytics
 * GET /api/analytics/listening-patterns
 */
router.get('/listening-patterns', requireAuth, async (req, res) => {
  try {
    const { startDate, endDate, userId, limit = 100 } = req.query;
    
    // Parse date range
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default to last 7 days
    const end = endDate ? new Date(endDate) : new Date();
    
    const db = require('../../database/mongodb').getDb();
    const prefix = process.env.MONGODB_COLLECTIONS_PREFIX || 'echotune_';
    const historyCollection = db.collection(`${prefix}listening_history`);
    
    // Build aggregation pipeline
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
            hour: { $hour: '$played_at' },
            dayOfWeek: { $dayOfWeek: '$played_at' },
            date: { $dateToString: { format: '%Y-%m-%d', date: '$played_at' } }
          },
          totalPlays: { $sum: 1 },
          totalDuration: { $sum: '$duration_ms' },
          uniqueTracks: { $addToSet: '$track_id' },
          uniqueArtists: { $addToSet: '$artist_name' }
        }
      },
      {
        $project: {
          hour: '$_id.hour',
          dayOfWeek: '$_id.dayOfWeek',
          date: '$_id.date',
          totalPlays: 1,
          totalDuration: 1,
          uniqueTracks: { $size: '$uniqueTracks' },
          uniqueArtists: { $size: '$uniqueArtists' },
          avgDuration: { $divide: ['$totalDuration', '$totalPlays'] }
        }
      },
      {
        $sort: { date: 1, hour: 1 }
      },
      {
        $limit: parseInt(limit)
      }
    ];
    
    const results = await historyCollection.aggregate(pipeline).toArray();
    
    // Calculate summary statistics
    const summary = {
      totalPlays: results.reduce((sum, r) => sum + r.totalPlays, 0),
      totalDuration: results.reduce((sum, r) => sum + r.totalDuration, 0),
      avgDuration: results.length > 0 ? 
        results.reduce((sum, r) => sum + r.totalDuration, 0) / 
        results.reduce((sum, r) => sum + r.totalPlays, 0) : 0,
      peakHour: results.reduce((max, r) => r.totalPlays > max.totalPlays ? r : max, { totalPlays: 0 }),
      peakDay: results.reduce((max, r) => r.totalPlays > max.totalPlays ? r : max, { totalPlays: 0 })
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
    console.error('Error getting listening patterns:', error);
    res.status(500).json({
      error: 'Failed to get listening patterns',
      message: error.message,
    });
  }
});

/**
 * Get user engagement analytics
 * GET /api/analytics/engagement
 */
router.get('/engagement', requireAuth, async (req, res) => {
  try {
    const { startDate, endDate, userId, limit = 100 } = req.query;
    
    // Parse date range
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days
    const end = endDate ? new Date(endDate) : new Date();
    
    const db = require('../../database/mongodb').getDb();
    const prefix = process.env.MONGODB_COLLECTIONS_PREFIX || 'echotune_';
    
    // Get user engagement metrics
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
    
    // Calculate overall engagement metrics
    const overallMetrics = {
      totalUsers: results.length,
      avgEventsPerUser: results.length > 0 ? 
        results.reduce((sum, r) => sum + r.totalEvents, 0) / results.length : 0,
      avgEngagementScore: results.length > 0 ? 
        results.reduce((sum, r) => sum + r.engagementScore, 0) / results.length : 0,
      mostEngagedUser: results[0] || null,
      leastEngagedUser: results[results.length - 1] || null
    };
    
    res.json({
      success: true,
      data: results,
      overallMetrics,
      metadata: {
        startDate: start,
        endDate: end,
        totalRecords: results.length,
        timeRange: `${Math.round((end - start) / (1000 * 60 * 60 * 24))} days`
      }
    });
    
  } catch (error) {
    console.error('Error getting engagement analytics:', error);
    res.status(500).json({
      error: 'Failed to get engagement analytics',
      message: error.message,
    });
  }
});

module.exports = router;
