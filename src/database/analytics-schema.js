/**
 * MongoDB Analytics Schema Definitions
 * Optimized database schemas with performance indexes
 */

const { ObjectId } = require('mongodb');

/**
 * Analytics Schema Definitions with Optimized Indexes
 */
class AnalyticsSchema {
  constructor(db) {
    this.db = db;
    this.schemas = {
      // User analytics collection
      user_analytics: {
        schema: {
          userId: { type: ObjectId, required: true, index: true },
          sessionId: { type: String, required: true, index: true },
          timestamp: { type: Date, required: true, index: true },
          eventType: { type: String, required: true, index: true },
          eventData: { type: Object },
          userAgent: { type: String },
          deviceType: { type: String, index: true },
          platform: { type: String, index: true },
          location: {
            country: String,
            region: String,
            city: String
          },
          metadata: {
            referrer: String,
            utm_source: String,
            utm_medium: String,
            utm_campaign: String
          },
          expiresAt: { type: Date, index: { expireAfterSeconds: 0 } },
          createdAt: { type: Date, default: Date.now },
          updatedAt: { type: Date, default: Date.now }
        },
        indexes: [
          { userId: 1, timestamp: -1 },
          { eventType: 1, timestamp: -1 },
          { sessionId: 1, timestamp: -1 },
          { deviceType: 1, platform: 1 },
          { timestamp: -1 },
          { expiresAt: 1, expireAfterSeconds: 2592000 } // 30 days TTL
        ]
      },

      // Listening history with audio features
      listening_history: {
        schema: {
          userId: { type: ObjectId, required: true, index: true },
          trackId: { type: String, required: true, index: true },
          trackName: { type: String, required: true },
          artist: { type: String, required: true, index: true },
          album: { type: String },
          duration_ms: { type: Number },
          played_at: { type: Date, required: true, index: true },
          play_duration_ms: { type: Number }, // How long actually played
          skip_reason: { type: String }, // why skipped if applicable
          audio_features: {
            danceability: Number,
            energy: Number,
            key: Number,
            loudness: Number,
            mode: Number,
            speechiness: Number,
            acousticness: Number,
            instrumentalness: Number,
            liveness: Number,
            valence: Number,
            tempo: Number,
            time_signature: Number
          },
          context: {
            playlist_id: String,
            playlist_name: String,
            source: String, // search, recommendation, playlist, etc.
            recommendation_id: ObjectId
          },
          user_rating: { type: Number, min: 1, max: 5 },
          engagement_score: { type: Number }, // calculated engagement metric
          createdAt: { type: Date, default: Date.now },
          expiresAt: { type: Date, index: { expireAfterSeconds: 0 } }
        },
        indexes: [
          { userId: 1, played_at: -1 },
          { trackId: 1, played_at: -1 },
          { artist: 1, played_at: -1 },
          { 'context.source': 1, played_at: -1 },
          { 'audio_features.energy': 1, 'audio_features.valence': 1 },
          { played_at: -1 },
          { engagement_score: -1 },
          { expiresAt: 1, expireAfterSeconds: 31536000 } // 1 year TTL
        ]
      },

      // Recommendation effectiveness tracking
      recommendations: {
        schema: {
          userId: { type: ObjectId, required: true, index: true },
          recommendationId: { type: ObjectId, required: true, unique: true },
          trackId: { type: String, required: true, index: true },
          algorithm: { type: String, required: true, index: true },
          confidence_score: { type: Number, required: true },
          context: {
            mood: String,
            activity: String,
            time_of_day: String,
            weather: String,
            social_context: String
          },
          user_feedback: {
            rating: { type: Number, min: 1, max: 5 },
            explicit_feedback: { type: String, enum: ['like', 'dislike', 'neutral'] },
            implicit_feedback: {
              clicked: { type: Boolean, default: false },
              played: { type: Boolean, default: false },
              play_duration: Number,
              skipped: { type: Boolean, default: false },
              skip_position: Number,
              added_to_playlist: { type: Boolean, default: false }
            }
          },
          performance_metrics: {
            click_through_rate: Number,
            play_through_rate: Number,
            completion_rate: Number,
            engagement_time: Number
          },
          timestamp: { type: Date, required: true, index: true },
          expires_at: { type: Date },
          createdAt: { type: Date, default: Date.now }
        },
        indexes: [
          { userId: 1, timestamp: -1 },
          { algorithm: 1, confidence_score: -1 },
          { trackId: 1, timestamp: -1 },
          { 'user_feedback.rating': -1, timestamp: -1 },
          { 'performance_metrics.click_through_rate': -1 },
          { timestamp: -1 },
          { expires_at: 1, expireAfterSeconds: 0 }
        ]
      },

      // Chat interaction analytics
      chat_analytics: {
        schema: {
          userId: { type: ObjectId, index: true },
          sessionId: { type: String, required: true, index: true },
          messageId: { type: ObjectId, required: true, unique: true },
          provider: { type: String, required: true, index: true },
          model: { type: String, required: true },
          timestamp: { type: Date, required: true, index: true },
          user_message: {
            content: String,
            intent: String,
            entities: [String],
            sentiment: String,
            length: Number
          },
          ai_response: {
            content: String,
            recommendations_count: Number,
            response_time_ms: Number,
            tokens_used: Number,
            streaming: { type: Boolean, default: false },
            streaming_metrics: {
              first_token_latency: Number,
              tokens_per_second: Number,
              total_stream_time: Number
            }
          },
          performance: {
            latency_ms: { type: Number, required: true },
            success: { type: Boolean, required: true },
            error_type: String,
            retry_count: { type: Number, default: 0 }
          },
          user_satisfaction: {
            rating: { type: Number, min: 1, max: 5 },
            feedback: String,
            helpful: { type: Boolean }
          },
          follow_up_actions: [{
            action_type: String,
            track_id: String,
            playlist_id: String,
            timestamp: Date
          }],
          expiresAt: { type: Date, index: { expireAfterSeconds: 0 } },
          createdAt: { type: Date, default: Date.now }
        },
        indexes: [
          { sessionId: 1, timestamp: -1 },
          { provider: 1, timestamp: -1 },
          { 'performance.latency_ms': 1, timestamp: -1 },
          { 'performance.success': 1, timestamp: -1 },
          { 'user_satisfaction.rating': -1, timestamp: -1 },
          { timestamp: -1 },
          { expiresAt: 1, expireAfterSeconds: 2592000 } // 30 days TTL
        ]
      },

      // Provider telemetry for health monitoring
      provider_telemetry: {
        schema: {
          provider: { type: String, required: true, index: true },
          model: { type: String, required: true },
          timestamp: { type: Date, required: true, index: true },
          request_id: { type: String, required: true },
          latency_ms: { type: Number, required: true },
          success: { type: Boolean, required: true },
          error_details: {
            error_type: String,
            error_message: String,
            status_code: Number,
            retry_after: Number
          },
          usage: {
            prompt_tokens: Number,
            completion_tokens: Number,
            total_tokens: Number,
            estimated_cost: Number
          },
          quality_metrics: {
            relevance_score: Number,
            coherence_score: Number,
            helpfulness_score: Number
          },
          circuit_breaker: {
            failure_count: { type: Number, default: 0 },
            last_failure: Date,
            circuit_state: { type: String, enum: ['closed', 'open', 'half-open'], default: 'closed' }
          },
          expiresAt: { type: Date, index: { expireAfterSeconds: 0 } },
          createdAt: { type: Date, default: Date.now }
        },
        indexes: [
          { provider: 1, timestamp: -1 },
          { success: 1, timestamp: -1 },
          { latency_ms: 1, timestamp: -1 },
          { 'circuit_breaker.failure_count': -1 },
          { timestamp: -1 },
          { expiresAt: 1, expireAfterSeconds: 604800 } // 7 days TTL
        ]
      },

      // System performance metrics
      system_metrics: {
        schema: {
          metric_name: { type: String, required: true, index: true },
          value: { type: Number, required: true },
          unit: { type: String, required: true },
          timestamp: { type: Date, required: true, index: true },
          tags: {
            environment: String,
            service: String,
            instance: String,
            region: String
          },
          dimensions: [{
            key: String,
            value: String
          }],
          alert_threshold: {
            warning: Number,
            critical: Number
          },
          expiresAt: { type: Date, index: { expireAfterSeconds: 0 } },
          createdAt: { type: Date, default: Date.now }
        },
        indexes: [
          { metric_name: 1, timestamp: -1 },
          { 'tags.service': 1, timestamp: -1 },
          { timestamp: -1 },
          { expiresAt: 1, expireAfterSeconds: 2592000 } // 30 days TTL
        ]
      }
    };
  }

  /**
   * Initialize all collections with optimized indexes
   */
  async initializeSchemas() {
    console.log('🚀 Initializing MongoDB analytics schemas...');
    const results = [];

    for (const [collectionName, config] of Object.entries(this.schemas)) {
      try {
        console.log(`📋 Creating collection: ${collectionName}`);
        
        // Create collection if it doesn't exist
        const collections = await this.db.listCollections({ name: collectionName }).toArray();
        if (collections.length === 0) {
          await this.db.createCollection(collectionName);
          console.log(`✅ Created collection: ${collectionName}`);
        }

        const collection = this.db.collection(collectionName);

        // Create indexes
        for (const indexSpec of config.indexes) {
          try {
            await collection.createIndex(indexSpec, { background: true });
            console.log(`📊 Created index for ${collectionName}:`, indexSpec);
          } catch (error) {
            if (error.code !== 85) { // Index already exists
              console.warn(`⚠️ Index creation warning for ${collectionName}:`, error.message);
            }
          }
        }

        results.push({
          collection: collectionName,
          status: 'success',
          indexes: config.indexes.length
        });

      } catch (error) {
        console.error(`❌ Error initializing ${collectionName}:`, error);
        results.push({
          collection: collectionName,
          status: 'error',
          error: error.message
        });
      }
    }

    console.log('🎯 Schema initialization complete');
    return results;
  }

  /**
   * Get collection statistics and health metrics
   */
  async getCollectionHealth() {
    const health = {};

    for (const collectionName of Object.keys(this.schemas)) {
      try {
        const collection = this.db.collection(collectionName);
        const stats = await collection.stats();
        const indexes = await collection.listIndexes().toArray();

        health[collectionName] = {
          status: 'healthy',
          documentCount: stats.count || 0,
          size: stats.size || 0,
          storageSize: stats.storageSize || 0,
          indexCount: indexes.length,
          indexes: indexes.map(idx => ({
            name: idx.name,
            keys: idx.key,
            unique: idx.unique || false
          })),
          avgObjectSize: stats.avgObjSize || 0,
          lastActivity: await this.getLastActivity(collectionName)
        };
      } catch (error) {
        health[collectionName] = {
          status: 'error',
          error: error.message
        };
      }
    }

    return health;
  }

  /**
   * Get last activity timestamp for a collection
   */
  async getLastActivity(collectionName) {
    try {
      const collection = this.db.collection(collectionName);
      const lastDoc = await collection.findOne({}, { sort: { _id: -1 } });
      return lastDoc ? lastDoc._id.getTimestamp() : null;
    } catch {
      return null;
    }
  }

  /**
   * Validate and repair collection indexes
   */
  async repairIndexes() {
    const results = [];

    for (const [collectionName, config] of Object.entries(this.schemas)) {
      try {
        const collection = this.db.collection(collectionName);
        const existingIndexes = await collection.listIndexes().toArray();
        const existingIndexNames = existingIndexes.map(idx => JSON.stringify(idx.key));

        // Check for missing indexes
        for (const expectedIndex of config.indexes) {
          const expectedIndexName = JSON.stringify(expectedIndex);
          if (!existingIndexNames.includes(expectedIndexName)) {
            try {
              await collection.createIndex(expectedIndex, { background: true });
              results.push({
                collection: collectionName,
                action: 'created',
                index: expectedIndex,
                status: 'success'
              });
            } catch (error) {
              results.push({
                collection: collectionName,
                action: 'failed',
                index: expectedIndex,
                error: error.message
              });
            }
          }
        }
      } catch (error) {
        results.push({
          collection: collectionName,
          action: 'error',
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Get performance insights for collections
   */
  async getPerformanceInsights() {
    const insights = {};

    for (const collectionName of Object.keys(this.schemas)) {
      try {
        const collection = this.db.collection(collectionName);
        
        // Get slow queries from profiler if available
        const slowQueries = await this.getSlowQueries(collectionName);
        
        // Get index usage statistics
        const indexStats = await collection.aggregate([
          { $indexStats: {} }
        ]).toArray();

        insights[collectionName] = {
          slowQueries: slowQueries.length,
          indexUsage: indexStats.map(stat => ({
            name: stat.name,
            accesses: stat.accesses,
            usage: stat.accesses.ops + stat.accesses.since
          })),
          recommendations: this.generatePerformanceRecommendations(collectionName, slowQueries, indexStats)
        };

      } catch (error) {
        insights[collectionName] = {
          error: error.message,
          recommendations: ['Check collection exists and is accessible']
        };
      }
    }

    return insights;
  }

  /**
   * Get slow queries for a collection
   */
  async getSlowQueries(collectionName) {
    try {
      const profileCollection = this.db.collection('system.profile');
      return await profileCollection
        .find({ 
          ns: `${this.db.databaseName}.${collectionName}`,
          millis: { $gt: 100 }
        })
        .sort({ ts: -1 })
        .limit(10)
        .toArray();
    } catch {
      return [];
    }
  }

  /**
   * Generate performance recommendations
   */
  generatePerformanceRecommendations(collectionName, slowQueries, indexStats) {
    const recommendations = [];

    // Check for unused indexes
    const unusedIndexes = indexStats.filter(stat => stat.accesses.ops === 0);
    if (unusedIndexes.length > 0) {
      recommendations.push(`Consider dropping unused indexes: ${unusedIndexes.map(i => i.name).join(', ')}`);
    }

    // Check for slow queries without proper indexes
    if (slowQueries.length > 0) {
      recommendations.push(`${slowQueries.length} slow queries detected. Review query patterns and index coverage.`);
    }

    // Collection-specific recommendations
    if (collectionName === 'listening_history' && slowQueries.length > 5) {
      recommendations.push('Consider partitioning listening_history by date for better performance');
    }

    if (collectionName === 'user_analytics' && unusedIndexes.length > 2) {
      recommendations.push('Review analytics query patterns to optimize index strategy');
    }

    return recommendations;
  }
}

module.exports = AnalyticsSchema;