#!/usr/bin/env node

/**
 * Analytics MCP Server
 * 
 * MCP server for analytics and telemetry integration with MongoDB,
 * Redis, and comprehensive metrics collection.
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const { MongoClient } = require('mongodb');
const Redis = require('redis');
const _ = require('lodash');

class AnalyticsMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'analytics-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    
    this.mongoUri = process.env.MONGODB_URI;
    this.redisUrl = process.env.REDIS_URL;
    this.mongoClient = null;
    this.redisClient = null;
    this.db = null;
    
    this.setupHandlers();
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'analytics_get_user_metrics',
            description: 'Get user analytics and metrics from MongoDB',
            inputSchema: {
              type: 'object',
              properties: {
                userId: {
                  type: 'string',
                  description: 'User ID to get metrics for',
                },
                timeframe: {
                  type: 'string',
                  description: 'Timeframe (day, week, month, year)',
                  default: 'week',
                },
                metric_type: {
                  type: 'string',
                  description: 'Type of metrics (listening, recommendations, activity)',
                  default: 'all',
                },
              },
              required: ['userId'],
            },
          },
          {
            name: 'analytics_get_system_health',
            description: 'Get system health metrics and performance data',
            inputSchema: {
              type: 'object',
              properties: {
                component: {
                  type: 'string',
                  description: 'System component (api, database, cache, all)',
                  default: 'all',
                },
                include_details: {
                  type: 'boolean',
                  description: 'Include detailed metrics',
                  default: true,
                },
              },
            },
          },
          {
            name: 'analytics_track_event',
            description: 'Track an analytics event',
            inputSchema: {
              type: 'object',
              properties: {
                event_name: {
                  type: 'string',
                  description: 'Name of the event to track',
                },
                user_id: {
                  type: 'string',
                  description: 'User ID (optional)',
                },
                properties: {
                  type: 'object',
                  description: 'Event properties as key-value pairs',
                  default: {},
                },
                timestamp: {
                  type: 'string',
                  description: 'Event timestamp (ISO string)',
                },
              },
              required: ['event_name'],
            },
          },
          {
            name: 'analytics_get_recommendations_performance',
            description: 'Get recommendation system performance metrics',
            inputSchema: {
              type: 'object',
              properties: {
                timeframe: {
                  type: 'string',
                  description: 'Analysis timeframe (day, week, month)',
                  default: 'week',
                },
                model_type: {
                  type: 'string',
                  description: 'Recommendation model type',
                  default: 'all',
                },
              },
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'analytics_get_user_metrics':
            return await this.handleGetUserMetrics(args);
          case 'analytics_get_system_health':
            return await this.handleGetSystemHealth(args);
          case 'analytics_track_event':
            return await this.handleTrackEvent(args);
          case 'analytics_get_recommendations_performance':
            return await this.handleGetRecommendationsPerformance(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async ensureConnections() {
    if (!this.mongoClient && this.mongoUri) {
      try {
        this.mongoClient = new MongoClient(this.mongoUri);
        await this.mongoClient.connect();
        this.db = this.mongoClient.db('echotune_analytics');
        console.error('Connected to MongoDB for analytics');
      } catch (error) {
        console.error('MongoDB connection failed:', error.message);
      }
    }

    if (!this.redisClient && this.redisUrl) {
      try {
        this.redisClient = Redis.createClient({ url: this.redisUrl });
        await this.redisClient.connect();
        console.error('Connected to Redis for analytics');
      } catch (error) {
        console.error('Redis connection failed:', error.message);
      }
    }
  }

  async handleGetUserMetrics(args) {
    const { userId, timeframe = 'week', metric_type = 'all' } = args;

    await this.ensureConnections();

    if (!this.db) {
      throw new Error('MongoDB not available for user metrics');
    }

    try {
      // Calculate date range based on timeframe
      const now = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case 'day':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      const metrics = {};

      // Get listening history metrics
      if (metric_type === 'all' || metric_type === 'listening') {
        const listeningHistory = await this.db.collection('listening_history')
          .find({
            userId: userId,
            createdAt: { $gte: startDate }
          })
          .toArray();

        metrics.listening = {
          total_tracks: listeningHistory.length,
          unique_tracks: _.uniqBy(listeningHistory, 'trackId').length,
          unique_artists: _.uniqBy(listeningHistory, 'artist').length,
          total_listening_time: _.sumBy(listeningHistory, 'duration_ms') || 0,
          top_genres: _.chain(listeningHistory)
            .groupBy('genre')
            .mapValues('length')
            .toPairs()
            .orderBy(1, 'desc')
            .take(5)
            .fromPairs()
            .value(),
        };
      }

      // Get recommendation metrics
      if (metric_type === 'all' || metric_type === 'recommendations') {
        const recommendations = await this.db.collection('recommendations')
          .find({
            userId: userId,
            createdAt: { $gte: startDate }
          })
          .toArray();

        metrics.recommendations = {
          total_recommendations: recommendations.length,
          accepted_recommendations: recommendations.filter(r => r.accepted).length,
          acceptance_rate: recommendations.length > 0 ? 
            (recommendations.filter(r => r.accepted).length / recommendations.length) * 100 : 0,
          average_score: _.meanBy(recommendations, 'score') || 0,
        };
      }

      // Get activity metrics
      if (metric_type === 'all' || metric_type === 'activity') {
        const events = await this.db.collection('user_events')
          .find({
            userId: userId,
            timestamp: { $gte: startDate }
          })
          .toArray();

        metrics.activity = {
          total_events: events.length,
          login_count: events.filter(e => e.event_name === 'user_login').length,
          search_count: events.filter(e => e.event_name === 'search_query').length,
          playlist_interactions: events.filter(e => 
            e.event_name.includes('playlist')).length,
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              userId,
              timeframe,
              metric_type,
              date_range: {
                start: startDate.toISOString(),
                end: now.toISOString(),
              },
              metrics,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get user metrics: ${error.message}`);
    }
  }

  async handleGetSystemHealth(args) {
    const { component = 'all', include_details = true } = args;

    await this.ensureConnections();

    const health = {
      timestamp: new Date().toISOString(),
      overall_status: 'healthy',
      components: {},
    };

    try {
      // Database health
      if (component === 'all' || component === 'database') {
        if (this.db) {
          const dbStats = await this.db.stats();
          health.components.database = {
            status: 'healthy',
            connection: 'connected',
            collections: dbStats.collections,
            data_size: dbStats.dataSize,
            storage_size: dbStats.storageSize,
          };
        } else {
          health.components.database = {
            status: 'degraded',
            connection: 'disconnected',
            error: 'MongoDB connection not available',
          };
          health.overall_status = 'degraded';
        }
      }

      // Cache health
      if (component === 'all' || component === 'cache') {
        if (this.redisClient) {
          const redisInfo = await this.redisClient.info();
          health.components.cache = {
            status: 'healthy',
            connection: 'connected',
            memory_usage: redisInfo.split('\n')
              .find(line => line.startsWith('used_memory_human:'))
              ?.split(':')[1]?.trim(),
          };
        } else {
          health.components.cache = {
            status: 'optional',
            connection: 'disconnected',
            note: 'Redis not configured, using in-memory cache',
          };
        }
      }

      // API health (basic check)
      if (component === 'all' || component === 'api') {
        health.components.api = {
          status: 'healthy',
          uptime: process.uptime(),
          memory_usage: process.memoryUsage(),
          node_version: process.version,
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(health, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get system health: ${error.message}`);
    }
  }

  async handleTrackEvent(args) {
    const { 
      event_name, 
      user_id, 
      properties = {}, 
      timestamp = new Date().toISOString() 
    } = args;

    await this.ensureConnections();

    if (!this.db) {
      throw new Error('MongoDB not available for event tracking');
    }

    try {
      const event = {
        event_name,
        userId: user_id,
        properties,
        timestamp: new Date(timestamp),
        created_at: new Date(),
      };

      await this.db.collection('user_events').insertOne(event);

      // Also cache recent events in Redis if available
      if (this.redisClient) {
        const cacheKey = `recent_events:${user_id || 'anonymous'}`;
        await this.redisClient.lpush(cacheKey, JSON.stringify(event));
        await this.redisClient.ltrim(cacheKey, 0, 99); // Keep last 100 events
        await this.redisClient.expire(cacheKey, 86400); // 24 hours
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              event_tracked: {
                event_name,
                user_id,
                timestamp,
                properties,
              },
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to track event: ${error.message}`);
    }
  }

  async handleGetRecommendationsPerformance(args) {
    const { timeframe = 'week', model_type = 'all' } = args;

    await this.ensureConnections();

    if (!this.db) {
      throw new Error('MongoDB not available for recommendations performance');
    }

    try {
      const now = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case 'day':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      const pipeline = [
        {
          $match: {
            createdAt: { $gte: startDate },
            ...(model_type !== 'all' && { model_type })
          }
        },
        {
          $group: {
            _id: '$model_type',
            total_recommendations: { $sum: 1 },
            accepted_recommendations: {
              $sum: { $cond: ['$accepted', 1, 0] }
            },
            average_score: { $avg: '$score' },
            average_response_time: { $avg: '$response_time_ms' }
          }
        }
      ];

      const performance = await this.db.collection('recommendations')
        .aggregate(pipeline)
        .toArray();

      const summary = {
        timeframe,
        date_range: {
          start: startDate.toISOString(),
          end: now.toISOString(),
        },
        performance_by_model: performance.map(p => ({
          model_type: p._id,
          total_recommendations: p.total_recommendations,
          accepted_recommendations: p.accepted_recommendations,
          acceptance_rate: (p.accepted_recommendations / p.total_recommendations) * 100,
          average_score: Math.round(p.average_score * 100) / 100,
          average_response_time_ms: Math.round(p.average_response_time || 0),
        })),
        overall: {
          total_recommendations: _.sumBy(performance, 'total_recommendations'),
          total_accepted: _.sumBy(performance, 'accepted_recommendations'),
          overall_acceptance_rate: performance.length > 0 ? 
            (_.sumBy(performance, 'accepted_recommendations') / 
             _.sumBy(performance, 'total_recommendations')) * 100 : 0,
        }
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(summary, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get recommendations performance: ${error.message}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Analytics MCP Server running on stdio');
  }

  async cleanup() {
    if (this.mongoClient) {
      await this.mongoClient.close();
    }
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const server = new AnalyticsMCPServer();
  
  // Handle cleanup on exit
  process.on('SIGINT', async () => {
    await server.cleanup();
    process.exit(0);
  });

  server.run().catch(console.error);
}

module.exports = AnalyticsMCPServer;