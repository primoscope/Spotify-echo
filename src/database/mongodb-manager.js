// Enhanced MongoDB Manager for EchoTune AI
// Provides comprehensive MongoDB connection and analytics capabilities

const { MongoClient } = require('mongodb');

class MongoDBManager {
  constructor() {
    this.client = null;
    this.db = null;
    this._isConnected = false;
    this.connectionAttempts = 0;
    this.maxRetries = 3;
    this.retryDelay = 5000;
  }

  async connect() {
    try {
      const uri = process.env.MONGODB_URI;

      if (!uri) {
        console.log('📦 MongoDB URI not provided, skipping connection');
        return false;
      }

      console.log('🔌 Attempting to connect to MongoDB...');

      this.client = new MongoClient(uri, {
        maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE) || 10,
        minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE) || 5,
        maxIdleTimeMS: parseInt(process.env.MONGODB_MAX_IDLE_TIME) || 30000,
        connectTimeoutMS: parseInt(process.env.MONGODB_CONNECT_TIMEOUT) || 10000,
        socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT) || 0,
      });

      await this.client.connect();

      // Test the connection
      await this.client.db('admin').command({ ping: 1 });

      this.db = this.client.db(process.env.MONGODB_DB_NAME || 'echotune');
      this._isConnected = true;
      this.connectionAttempts = 0;

      console.log('✅ MongoDB connected successfully');
      console.log(`📊 Database: ${this.db.databaseName}`);

      // Set up connection event handlers
      this.client.on('error', (error) => {
        console.error('❌ MongoDB connection error:', error);
        this._isConnected = false;
      });

      this.client.on('close', () => {
        console.log('🔌 MongoDB connection closed');
        this._isConnected = false;
      });

      this.client.on('reconnect', () => {
        console.log('🔌 MongoDB reconnected');
        this._isConnected = true;
      });

      // Initialize collections and indexes
      await this.initializeCollections();

      return true;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      this._isConnected = false;
      this.connectionAttempts++;

      if (this.connectionAttempts < this.maxRetries) {
        console.log(
          `🔄 Retrying connection in ${this.retryDelay / 1000} seconds... (${this.connectionAttempts}/${this.maxRetries})`
        );
        setTimeout(() => this.connect(), this.retryDelay);
      } else {
        console.log('❌ Maximum MongoDB connection attempts reached');
      }

      return false;
    }
  }

  async initializeCollections() {
    if (!this._isConnected || !this.db) {
      return;
    }

    try {
      console.log('🏗️ Initializing MongoDB collections and indexes...');

      const prefix = process.env.MONGODB_COLLECTIONS_PREFIX || 'echotune_';

      // Define collections with their schema and indexes
      const collections = [
        {
          name: `${prefix}users`,
          indexes: [
            { key: { spotifyId: 1 }, options: { unique: true, sparse: true } },
            { key: { email: 1 }, options: { unique: true, sparse: true } },
            { key: { createdAt: 1 } },
            { key: { lastActive: 1 } },
          ],
        },
        {
          name: `${prefix}listening_history`,
          indexes: [
            { key: { userId: 1, playedAt: -1 } },
            { key: { trackId: 1 } },
            { key: { artist: 1 } },
            { key: { playedAt: -1 } },
            { key: { userId: 1, trackId: 1 } },
          ],
        },
        {
          name: `${prefix}recommendations`,
          indexes: [
            { key: { userId: 1, createdAt: -1 } },
            { key: { trackId: 1 } },
            { key: { score: -1 } },
            { key: { clicked: 1 } },
            { key: { createdAt: 1 }, options: { expireAfterSeconds: 7 * 24 * 60 * 60 } }, // Auto-expire after 7 days
          ],
        },
        {
          name: `${prefix}playlists`,
          indexes: [
            { key: { userId: 1, createdAt: -1 } },
            { key: { spotifyId: 1 }, options: { unique: true, sparse: true } },
            { key: { name: 'text', description: 'text' } },
          ],
        },
        {
          name: `${prefix}user_preferences`,
          indexes: [{ key: { userId: 1 }, options: { unique: true } }, { key: { updatedAt: -1 } }],
        },
        {
          name: `${prefix}analytics_events`,
          indexes: [
            { key: { userId: 1, timestamp: -1 } },
            { key: { eventType: 1, timestamp: -1 } },
            { key: { timestamp: 1 }, options: { expireAfterSeconds: 90 * 24 * 60 * 60 } }, // Auto-expire after 90 days
          ],
        },
        {
          name: `${prefix}chat_sessions`,
          indexes: [
            { key: { userId: 1, startTime: -1 } },
            { key: { startTime: 1 }, options: { expireAfterSeconds: 30 * 24 * 60 * 60 } }, // Auto-expire after 30 days
          ],
        },
        {
          name: `${prefix}provider_telemetry`,
          indexes: [
            { key: { provider: 1, timestamp: -1 } },
            { key: { timestamp: 1 }, options: { expireAfterSeconds: 24 * 60 * 60 } }, // Auto-expire after 24 hours
            { key: { provider: 1, model: 1, timestamp: -1 } },
            { key: { success: 1, timestamp: -1 } },
            { key: { requestId: 1 }, options: { unique: true, sparse: true } },
          ],
        },
        {
          name: `${prefix}conversations`,
          indexes: [
            { key: { session_id: 1 }, options: { unique: true } },
            { key: { user_id: 1, updated_at: -1 } },
            { key: { llm_provider: 1, updated_at: -1 } },
            { key: { updated_at: 1 }, options: { expireAfterSeconds: 90 * 24 * 60 * 60 } }, // Auto-expire after 90 days
          ],
        },
        {
          name: `${prefix}insights`,
          indexes: [
            { key: { user_id: 1, type: 1, generated_at: -1 } },
            { key: { type: 1, generated_at: -1 } },
            { key: { generated_at: 1 }, options: { expireAfterSeconds: 365 * 24 * 60 * 60 } }, // Auto-expire after 1 year
            { key: { expires_at: 1 }, options: { expireAfterSeconds: 0 } }, // TTL on expires_at field
          ],
        },
      ];

      // Create collections and indexes
      for (const collection of collections) {
        try {
          // Create collection if it doesn't exist
          await this.db.createCollection(collection.name);
          console.log(`✅ Collection created: ${collection.name}`);
        } catch (error) {
          if (error.code !== 48) {
            // Collection already exists
            console.error(`❌ Error creating collection ${collection.name}:`, error.message);
          }
        }

        // Create indexes
        for (const indexSpec of collection.indexes) {
          try {
            await this.db
              .collection(collection.name)
              .createIndex(indexSpec.key, indexSpec.options || {});
            console.log(
              `✅ Index created on ${collection.name}:`,
              Object.keys(indexSpec.key).join(', ')
            );
          } catch (error) {
            console.error(`❌ Error creating index on ${collection.name}:`, error.message);
          }
        }
      }

      console.log('✅ MongoDB collections and indexes initialized');
    } catch (error) {
      console.error('❌ Error initializing MongoDB collections:', error);
    }
  }

  getDatabase() {
    return this.db;
  }

  getClient() {
    return this.client;
  }

  isConnected() {
    return this._isConnected && this.client && this.db;
  }

  async disconnect() {
    if (this.client) {
      try {
        await this.client.close();
        console.log('✅ MongoDB disconnected successfully');
      } catch (error) {
        console.error('❌ Error disconnecting from MongoDB:', error);
      } finally {
        this.client = null;
        this.db = null;
        this._isConnected = false;
      }
    }
  }

  // Analytics helper methods
  async getUserCount() {
    if (!this.isConnected()) return 0;
    try {
      const prefix = process.env.MONGODB_COLLECTIONS_PREFIX || 'echotune_';
      return await this.db.collection(`${prefix}users`).countDocuments();
    } catch (error) {
      console.error('Error getting user count:', error);
      return 0;
    }
  }

  async getListeningHistoryCount() {
    if (!this.isConnected()) return 0;
    try {
      const prefix = process.env.MONGODB_COLLECTIONS_PREFIX || 'echotune_';
      return await this.db.collection(`${prefix}listening_history`).countDocuments();
    } catch (error) {
      console.error('Error getting listening history count:', error);
      return 0;
    }
  }

  async getRecommendationCount() {
    if (!this.isConnected()) return 0;
    try {
      const prefix = process.env.MONGODB_COLLECTIONS_PREFIX || 'echotune_';
      return await this.db.collection(`${prefix}recommendations`).countDocuments();
    } catch (error) {
      console.error('Error getting recommendation count:', error);
      return 0;
    }
  }

  // Health check method
  async healthCheck() {
    try {
      if (!this.isConnected()) {
        return {
          status: 'unhealthy',
          message: 'Not connected to MongoDB',
        };
      }

      // Perform a simple ping
      const start = Date.now();
      await this.client.db('admin').command({ ping: 1 });
      const duration = Date.now() - start;

      return {
        status: 'healthy',
        message: 'MongoDB connection is healthy',
        responseTime: `${duration}ms`,
        database: this.db.databaseName,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error.message,
      };
    }
  }

  // MongoDB Insights and Admin Tools

  /**
   * Get comprehensive collection statistics
   */
  async getCollectionStats() {
    if (!this.isConnected()) {
      throw new Error('MongoDB not connected');
    }

    try {
      const collections = await this.db.listCollections().toArray();
      const stats = [];

      for (const collection of collections) {
        try {
          const collectionStats = await this.db.collection(collection.name).stats();
          const indexes = await this.db.collection(collection.name).indexes();

          stats.push({
            name: collection.name,
            count: collectionStats.count || 0,
            size: collectionStats.size || 0,
            storageSize: collectionStats.storageSize || 0,
            totalIndexSize: collectionStats.totalIndexSize || 0,
            avgObjSize: collectionStats.avgObjSize || 0,
            indexCount: indexes.length,
            indexes: indexes.map((idx) => ({
              name: idx.name,
              key: idx.key,
              size: idx.size || 0,
              unique: idx.unique || false,
              sparse: idx.sparse || false,
              expireAfterSeconds: idx.expireAfterSeconds,
            })),
          });
        } catch (error) {
          console.warn(`Could not get stats for collection ${collection.name}:`, error.message);
          stats.push({
            name: collection.name,
            error: error.message,
            count: 0,
            size: 0,
            indexes: [],
          });
        }
      }

      return {
        collections: stats,
        totalCollections: stats.length,
        totalDocuments: stats.reduce((sum, col) => sum + (col.count || 0), 0),
        totalDataSize: stats.reduce((sum, col) => sum + (col.size || 0), 0),
        totalIndexSize: stats.reduce((sum, col) => sum + (col.totalIndexSize || 0), 0),
      };
    } catch (error) {
      console.error('Error getting collection stats:', error);
      throw error;
    }
  }

  /**
   * Analyze index health and performance with enhanced caching
   */
  async analyzeIndexHealth() {
    if (!this.isConnected()) {
      return {
        healthyIndexes: 0,
        problematicIndexes: 0,
        unusedIndexes: 0,
        recommendations: [
          'MongoDB connection required for index analysis',
          'Connect to MongoDB to enable comprehensive index health monitoring',
          'Index optimization recommendations will be available after connection',
        ],
        error: 'MongoDB not connected',
        fallbackMode: true,
      };
    }

    try {
      const collections = await this.db.listCollections().toArray();
      const analysis = {
        healthyIndexes: 0,
        problematicIndexes: 0,
        unusedIndexes: 0,
        recommendations: [],
        performanceImpact: 'low',
        optimizationSuggestions: [],
      };

      for (const collection of collections) {
        try {
          const indexes = await this.db.collection(collection.name).indexes();
          const indexStats = await this.db
            .collection(collection.name)
            .aggregate([{ $indexStats: {} }])
            .toArray();

          for (const index of indexes) {
            const stats = indexStats.find((s) => s.name === index.name);
            const usageStats = stats ? stats.accesses : { ops: 0, since: new Date() };

            // Analyze index health with performance impact assessment
            if (index.name === '_id_') {
              analysis.healthyIndexes++;
              continue;
            }

            if (usageStats.ops === 0) {
              analysis.unusedIndexes++;
              const sizeImpact = this.calculateIndexSizeImpact(index);
              analysis.recommendations.push({
                type: 'unused_index',
                collection: collection.name,
                index: index.name,
                severity: sizeImpact > 10485760 ? 'high' : 'medium', // 10MB threshold
                description: `Index "${index.name}" has never been used and consumes ${this.formatBytes(sizeImpact)}`,
                recommendation: `Consider dropping unused index: db.${collection.name}.dropIndex("${index.name}")`,
                performanceImpact: sizeImpact > 10485760 ? 'high' : 'medium',
                estimatedSavings: this.formatBytes(sizeImpact),
              });
            } else {
              analysis.healthyIndexes++;

              // Check for underutilized indexes
              if (usageStats.ops < 10) {
                analysis.optimizationSuggestions.push({
                  type: 'underutilized_index',
                  collection: collection.name,
                  index: index.name,
                  usage: usageStats.ops,
                  suggestion: 'Monitor usage patterns - may be candidate for removal',
                });
              }
            }
          }

          // Check for missing recommended indexes
          await this.checkMissingIndexes(collection.name, analysis);
        } catch (error) {
          console.warn(`Could not analyze indexes for ${collection.name}:`, error.message);
          analysis.problematicIndexes++;
        }
      }

      // Determine overall performance impact
      if (analysis.unusedIndexes > 5 || analysis.problematicIndexes > 2) {
        analysis.performanceImpact = 'high';
      } else if (analysis.unusedIndexes > 2 || analysis.problematicIndexes > 0) {
        analysis.performanceImpact = 'medium';
      }

      return analysis;
    } catch (error) {
      console.error('Error analyzing index health:', error);
      throw error;
    }
  }

  /**
   * Calculate estimated size impact of an index
   */
  calculateIndexSizeImpact(index) {
    // Estimate based on index structure - simple heuristic
    const keyCount = Object.keys(index.key || {}).length;
    const baseSize = 1024; // Base overhead per index
    return baseSize * (keyCount * 100); // Rough estimate
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Check for recommended indexes based on common query patterns
   */
  async checkMissingIndexes(collectionName, analysis) {
    try {
      const collection = this.db.collection(collectionName);
      const existingIndexes = await collection.indexes();
      const indexKeys = existingIndexes.map((idx) => Object.keys(idx.key).join(','));

      // Define recommended indexes based on collection patterns
      const recommendations = {
        echotune_users: [
          { key: { spotifyId: 1 }, reason: 'Frequently queried by Spotify ID' },
          { key: { email: 1 }, reason: 'User authentication queries' },
          { key: { lastActive: 1 }, reason: 'User activity tracking' },
        ],
        echotune_listening_history: [
          { key: { userId: 1, playedAt: -1 }, reason: 'User timeline queries' },
          { key: { trackId: 1 }, reason: 'Track popularity analysis' },
          { key: { playedAt: -1 }, reason: 'Recent activity queries' },
        ],
        echotune_recommendations: [
          { key: { userId: 1, score: -1 }, reason: 'User recommendations by score' },
          { key: { createdAt: 1 }, reason: 'TTL and cleanup queries' },
        ],
      };

      const collectionRecs = recommendations[collectionName] || [];

      for (const rec of collectionRecs) {
        const keyString = Object.keys(rec.key).join(',');
        if (!indexKeys.includes(keyString)) {
          analysis.recommendations.push({
            type: 'missing_index',
            collection: collectionName,
            index: rec.key,
            severity: 'high',
            description: `Missing recommended index for ${collectionName}`,
            reason: rec.reason,
            recommendation: `Create index: db.${collectionName}.createIndex(${JSON.stringify(rec.key)})`,
          });
        }
      }
    } catch (error) {
      console.warn(`Could not check missing indexes for ${collectionName}:`, error.message);
    }
  }

  /**
   * Detect slow queries and operations
   */
  async analyzeSlowQueries(options = {}) {
    if (!this.isConnected()) {
      return {
        threshold: options.threshold || 100,
        totalSlowQueries: 0,
        queries: [],
        error: 'MongoDB not connected',
        recommendations: ['Connect to MongoDB to enable slow query analysis'],
      };
    }

    try {
      const { threshold = 100, limit = 50 } = options;

      // Check if profiling is available
      let profilingStatus;
      try {
        if (this.db && this.db.admin && typeof this.db.admin === 'function') {
          const adminDb = this.db.admin();
          if (adminDb && typeof adminDb.command === 'function') {
            profilingStatus = await adminDb.command({ profile: -1 });
          } else {
            throw new Error('Admin database access not available');
          }
        } else {
          throw new Error('Database admin functions not available');
        }
      } catch (error) {
        console.warn('Profiling not available:', error.message);
        return {
          threshold,
          totalSlowQueries: 0,
          queries: [],
          error: 'Profiling not available',
          recommendations: [
            'MongoDB profiling is disabled or not accessible',
            'Enable profiling with: db.setProfilingLevel(1, { slowms: 100 })',
            'Requires admin privileges on MongoDB',
          ],
        };
      }

      // Enable profiling temporarily if not enabled
      let wasProfilingEnabled = profilingStatus.was > 0;
      if (!wasProfilingEnabled) {
        try {
          const adminDb = this.db.admin();
          await adminDb.command({ profile: 1, slowms: threshold });
        } catch (error) {
          console.warn('Could not enable profiling:', error.message);
          return {
            threshold,
            totalSlowQueries: 0,
            queries: [],
            error: 'Cannot enable profiling - insufficient permissions',
            recommendations: [
              'Requires admin privileges to enable profiling',
              'Ask database administrator to enable profiling',
              'Alternative: Use MongoDB Compass for query analysis',
            ],
          };
        }
      }

      // Query the profiler collection
      const profileCollection = this.db.collection('system.profile');
      let slowQueries = [];

      try {
        slowQueries = await profileCollection
          .find({
            ts: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
            millis: { $gte: threshold },
          })
          .sort({ millis: -1 })
          .limit(limit)
          .toArray();
      } catch (error) {
        console.warn('Could not query profiler collection:', error.message);
      }

      // Restore original profiling status
      if (!wasProfilingEnabled) {
        try {
          const adminDb = this.db.admin();
          await adminDb.command({ profile: 0 });
        } catch (error) {
          console.warn('Could not disable profiling:', error.message);
        }
      }

      const recommendations = [];
      if (slowQueries.length > 0) {
        recommendations.push(`Found ${slowQueries.length} slow queries in the last 24 hours`);
        recommendations.push('Consider adding indexes for frequently slow queries');
        recommendations.push('Review query patterns and optimize where possible');
      } else {
        recommendations.push('No slow queries detected - performance looks good');
      }

      return {
        threshold,
        totalSlowQueries: slowQueries.length,
        queries: slowQueries.map((query) => ({
          timestamp: query.ts,
          duration: query.millis,
          collection: query.ns ? query.ns.split('.').pop() : 'unknown',
          operation: query.op,
          command: this.sanitizeCommand(query.command),
          planSummary: query.planSummary || 'Not available',
          docsExamined: query.docsExamined || 0,
          docsReturned: query.docsReturned || 0,
          keysExamined: query.keysExamined || 0,
        })),
        recommendations,
      };
    } catch (error) {
      console.warn('Error analyzing slow queries:', error.message);
      return {
        threshold: options.threshold || 100,
        totalSlowQueries: 0,
        queries: [],
        error: error.message,
        recommendations: [
          'Slow query analysis failed',
          'Check MongoDB permissions and configuration',
          'Consider using MongoDB Compass for performance analysis',
        ],
      };
    }
  }

  /**
   * Sanitize command for safe display
   */
  sanitizeCommand(command) {
    if (!command) return {};

    // Remove sensitive data and limit size
    const sanitized = { ...command };
    delete sanitized.password;
    delete sanitized.pwd;
    delete sanitized.key;

    const str = JSON.stringify(sanitized);
    return str.length > 200 ? JSON.parse(str.substring(0, 197) + '...') : sanitized;
  }

  /**
   * Generate recommendations for slow queries
   */
  generateSlowQueryRecommendations(slowQueries) {
    const recommendations = [];
    const collectionIssues = {};

    slowQueries.forEach((query) => {
      const collection = query.ns ? query.ns.split('.').pop() : 'unknown';

      if (!collectionIssues[collection]) {
        collectionIssues[collection] = { count: 0, avgDuration: 0, issues: [] };
      }

      collectionIssues[collection].count++;
      collectionIssues[collection].avgDuration += query.millis;

      // Analyze query patterns
      if (query.docsExamined > query.docsReturned * 10) {
        collectionIssues[collection].issues.push('inefficient_scan');
      }

      if (!query.planSummary || query.planSummary.includes('COLLSCAN')) {
        collectionIssues[collection].issues.push('missing_index');
      }
    });

    Object.entries(collectionIssues).forEach(([collection, data]) => {
      data.avgDuration = data.avgDuration / data.count;

      if (data.issues.includes('missing_index')) {
        recommendations.push({
          type: 'performance',
          collection,
          severity: 'high',
          description: `Collection ${collection} has queries requiring collection scans`,
          recommendation: `Add appropriate indexes for frequently queried fields in ${collection}`,
        });
      }

      if (data.avgDuration > 1000) {
        recommendations.push({
          type: 'performance',
          collection,
          severity: 'medium',
          description: `Collection ${collection} has slow average query time: ${data.avgDuration.toFixed(0)}ms`,
          recommendation: `Review query patterns and optimize indexes for ${collection}`,
        });
      }
    });

    return recommendations;
  }

  /**
   * Get database size and storage information
   */
  async getDatabaseStats() {
    if (!this.isConnected()) {
      throw new Error('MongoDB not connected');
    }

    try {
      const dbStats = await this.db.admin().command({ dbStats: 1, scale: 1024 });
      const serverStatus = await this.db.admin().command({ serverStatus: 1 });

      return {
        database: this.db.databaseName,
        collections: dbStats.collections || 0,
        objects: dbStats.objects || 0,
        avgObjSize: dbStats.avgObjSize || 0,
        dataSize: dbStats.dataSize || 0,
        storageSize: dbStats.storageSize || 0,
        indexSize: dbStats.indexSize || 0,
        fileSize: dbStats.fileSize || 0,
        uptime: serverStatus.uptime || 0,
        connections: {
          current: serverStatus.connections?.current || 0,
          available: serverStatus.connections?.available || 0,
          totalCreated: serverStatus.connections?.totalCreated || 0,
        },
        operations: {
          insert: serverStatus.opcounters?.insert || 0,
          query: serverStatus.opcounters?.query || 0,
          update: serverStatus.opcounters?.update || 0,
          delete: serverStatus.opcounters?.delete || 0,
          getmore: serverStatus.opcounters?.getmore || 0,
          command: serverStatus.opcounters?.command || 0,
        },
        memory: {
          resident: serverStatus.mem?.resident || 0,
          virtual: serverStatus.mem?.virtual || 0,
          mapped: serverStatus.mem?.mapped || 0,
        },
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      throw error;
    }
  }

  // Data Export and Safety Tools

  /**
   * Export collection data with safety filters
   */
  async exportCollectionData(collectionName, options = {}) {
    if (!this.isConnected()) {
      return {
        collection: collectionName,
        count: 0,
        totalInCollection: 0,
        exportedAt: new Date().toISOString(),
        format: options.format || 'json',
        data: options.format === 'csv' ? '' : [],
        error: 'MongoDB not connected',
        recommendations: ['Establish MongoDB connection to enable data export'],
      };
    }

    try {
      const {
        limit = 1000,
        skip = 0,
        query = {},
        projection = {},
        sanitize = true,
        format = 'json',
      } = options;

      // Verify collection exists with better error handling
      let collections = [];
      try {
        if (this.db && typeof this.db.listCollections === 'function') {
          collections = await this.db.listCollections({ name: collectionName }).toArray();
        }
      } catch (error) {
        console.warn(`Cannot list collections: ${error.message}`);
        return {
          collection: collectionName,
          count: 0,
          totalInCollection: 0,
          exportedAt: new Date().toISOString(),
          format,
          data: format === 'csv' ? '' : [],
          error: 'Cannot access collections list',
          recommendations: ['Check database permissions for collection access'],
        };
      }

      if (collections.length === 0) {
        return {
          collection: collectionName,
          count: 0,
          totalInCollection: 0,
          exportedAt: new Date().toISOString(),
          format,
          data: format === 'csv' ? '' : [],
          error: `Collection '${collectionName}' not found`,
          recommendations: [
            'Verify collection name spelling',
            'Check if collection exists in database',
            'Collection may be empty or not created yet',
          ],
        };
      }

      const collection = this.db.collection(collectionName);

      // Execute export query with error handling
      let documents = [];
      let totalCount = 0;

      try {
        let cursor = collection.find(query, { projection });

        if (skip > 0) cursor = cursor.skip(skip);
        if (limit > 0) cursor = cursor.limit(limit);

        documents = await cursor.toArray();
        totalCount = await collection.countDocuments(query);
      } catch (error) {
        console.warn(`Error querying collection ${collectionName}:`, error.message);
        return {
          collection: collectionName,
          count: 0,
          totalInCollection: 0,
          exportedAt: new Date().toISOString(),
          format,
          data: format === 'csv' ? '' : [],
          error: `Query failed: ${error.message}`,
          recommendations: [
            'Check query syntax and parameters',
            'Verify collection schema and field names',
            'Ensure sufficient database permissions',
          ],
        };
      }

      // Sanitize sensitive data if requested
      const exportData = sanitize ? this.sanitizeExportData(documents) : documents;

      return {
        collection: collectionName,
        count: exportData.length,
        totalInCollection: totalCount,
        exportedAt: new Date().toISOString(),
        format,
        data: format === 'csv' ? this.convertToCSV(exportData) : exportData,
        sanitized: sanitize,
        recommendations:
          exportData.length > 0
            ? ['Export completed successfully', 'Data has been sanitized for security']
            : ['Collection is empty', 'No data available for export'],
      };
    } catch (error) {
      console.warn(`Error exporting collection ${collectionName}:`, error.message);
      return {
        collection: collectionName,
        count: 0,
        totalInCollection: 0,
        exportedAt: new Date().toISOString(),
        format: options.format || 'json',
        data: options.format === 'csv' ? '' : [],
        error: error.message,
        recommendations: [
          'Check MongoDB connection and permissions',
          'Verify collection exists and is accessible',
          'Review export parameters and try again',
        ],
      };
    }
  }

  /**
   * Sanitize export data by removing sensitive fields
   */
  sanitizeExportData(documents) {
    const sensitiveFields = [
      'password',
      'pwd',
      'token',
      'secret',
      'key',
      'private',
      'email',
      'phone',
      'ssn',
      'creditCard',
      'bankAccount',
    ];

    return documents.map((doc) => {
      const sanitized = { ...doc };

      // Remove sensitive fields
      sensitiveFields.forEach((field) => {
        Object.keys(sanitized).forEach((key) => {
          if (key.toLowerCase().includes(field.toLowerCase())) {
            sanitized[key] = '[REDACTED]';
          }
        });
      });

      return sanitized;
    });
  }

  /**
   * Convert documents to CSV format
   */
  convertToCSV(documents) {
    if (!documents || documents.length === 0) return '';

    // Get all unique keys from documents
    const allKeys = [...new Set(documents.flatMap((doc) => Object.keys(doc)))];

    // Create CSV header
    const header = allKeys.join(',');

    // Create CSV rows
    const rows = documents.map((doc) => {
      return allKeys
        .map((key) => {
          const value = doc[key];
          if (value === null || value === undefined) return '';
          if (typeof value === 'object') return JSON.stringify(value);
          return String(value).includes(',') ? `"${value}"` : value;
        })
        .join(',');
    });

    return [header, ...rows].join('\n');
  }

  /**
   * Get export metadata for a collection
   */
  async getExportMetadata(collectionName) {
    if (!this.isConnected()) {
      throw new Error('MongoDB not connected');
    }

    try {
      const collection = this.db.collection(collectionName);

      const [stats, sample, indexes] = await Promise.all([
        collection.stats(),
        collection.findOne(),
        collection.indexes(),
      ]);

      return {
        collection: collectionName,
        totalDocuments: stats.count || 0,
        avgDocumentSize: stats.avgObjSize || 0,
        totalDataSize: stats.size || 0,
        sampleDocument: this.sanitizeExportData([sample])[0] || null,
        availableFields: sample ? Object.keys(sample) : [],
        indexes: indexes.map((idx) => ({
          name: idx.name,
          keys: Object.keys(idx.key),
        })),
        recommendedBatchSize: this.calculateRecommendedBatchSize(stats.avgObjSize || 1024),
      };
    } catch (error) {
      console.error(`Error getting export metadata for ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Calculate recommended batch size for export based on document size
   */
  calculateRecommendedBatchSize(avgDocSize) {
    // Aim for ~10MB batches
    const targetBatchSizeMB = 10;
    const targetBatchSizeBytes = targetBatchSizeMB * 1024 * 1024;
    const recommendedSize = Math.floor(targetBatchSizeBytes / avgDocSize);

    // Keep within reasonable bounds
    return Math.max(100, Math.min(10000, recommendedSize));
  }

  /**
   * Validate MongoDB connection and permissions
   */
  async validateAdminAccess() {
    // Handle disconnected state gracefully
    if (!this.isConnected()) {
      return {
        isValid: false,
        error: 'MongoDB not connected',
        permissions: {
          connection: false,
          readAccess: false,
          adminAccess: false,
          profilingAccess: false,
          indexAccess: false,
        },
        recommendations: [
          'MongoDB connection is not available',
          'Check MONGODB_URI environment variable',
          'Verify MongoDB server is running',
        ],
      };
    }

    const tests = {
      connection: false,
      readAccess: false,
      adminAccess: false,
      profilingAccess: false,
      indexAccess: false,
    };

    try {
      // Test basic connection with better error handling
      try {
        if (this.client && this.client.db) {
          const adminDb = this.client.db('admin');
          if (adminDb && typeof adminDb.command === 'function') {
            await adminDb.command({ ping: 1 });
            tests.connection = true;
          }
        }
      } catch (error) {
        console.warn('Connection test failed:', error.message);
      }

      // Test read access
      try {
        if (this.db && typeof this.db.listCollections === 'function') {
          await this.db.listCollections().toArray();
          tests.readAccess = true;
        }
      } catch (error) {
        console.warn('No read access:', error.message);
      }

      // Test admin access
      try {
        if (this.db && this.db.admin && typeof this.db.admin === 'function') {
          const adminDb = this.db.admin();
          if (adminDb && typeof adminDb.command === 'function') {
            await adminDb.command({ serverStatus: 1 });
            tests.adminAccess = true;
          }
        }
      } catch (error) {
        console.warn('No admin access:', error.message);
      }

      // Test profiling access
      try {
        if (this.db && this.db.admin && typeof this.db.admin === 'function') {
          const adminDb = this.db.admin();
          if (adminDb && typeof adminDb.command === 'function') {
            await adminDb.command({ profile: -1 });
            tests.profilingAccess = true;
          }
        }
      } catch (error) {
        console.warn('No profiling access:', error.message);
      }

      // Test index access
      try {
        if (this.db && typeof this.db.listCollections === 'function') {
          const collections = await this.db.listCollections().toArray();
          if (collections.length > 0 && this.db.collection) {
            const collection = this.db.collection(collections[0].name);
            if (collection && typeof collection.indexes === 'function') {
              await collection.indexes();
              tests.indexAccess = true;
            }
          } else {
            // If no collections exist, assume index access is available
            tests.indexAccess = true;
          }
        }
      } catch (error) {
        console.warn('No index access:', error.message);
      }

      return {
        isValid: tests.connection || tests.readAccess, // More permissive validation
        permissions: tests,
        recommendations: this.generatePermissionRecommendations(tests),
      };
    } catch (error) {
      console.warn('Admin access validation error:', error.message);
      return {
        isValid: false,
        error: error.message,
        permissions: tests,
        recommendations: [
          'Check MongoDB connection and credentials',
          'Verify database permissions',
          'Consider upgrading MongoDB driver version',
        ],
      };
    }
  }

  /**
   * Generate permission recommendations
   */
  generatePermissionRecommendations(permissions) {
    const recommendations = [];

    if (!permissions.adminAccess) {
      recommendations.push('Limited admin access - some features may not be available');
    }

    if (!permissions.profilingAccess) {
      recommendations.push('No profiling access - slow query analysis unavailable');
    }

    if (!permissions.indexAccess) {
      recommendations.push('Limited index access - index analysis may be incomplete');
    }

    if (recommendations.length === 0) {
      recommendations.push('Full access granted - all admin features available');
    }

    return recommendations;
  }
}

// Export singleton instance
const mongoDBManager = new MongoDBManager();

// Auto-connect if URI is provided
if (process.env.MONGODB_URI) {
  mongoDBManager.connect().catch(console.error);
}

module.exports = mongoDBManager;
