/**
 * Database Service Layer
 * 
 * Comprehensive database abstraction with connection pooling,
 * query optimization, caching, and multi-database support
 */

const { EventEmitter } = require('events');

class DatabaseService extends EventEmitter {
  constructor(options = {}) {
    super();
    this.connections = new Map(); // Database connections
    this.pools = new Map(); // Connection pools
    this.queries = new Map(); // Query cache
    this.metrics = new Map(); // Performance metrics
    this.config = {
      maxConnections: options.maxConnections || 20,
      queryTimeout: options.queryTimeout || 30000,
      retryAttempts: options.retryAttempts || 3,
      healthCheckInterval: options.healthCheckInterval || 60000,
      cacheSize: options.cacheSize || 1000,
      enableQueryLog: options.enableQueryLog || false,
      enableMetrics: options.enableMetrics !== false
    };
    this.initialized = false;
    this.healthCheckTimer = null;
  }

  /**
   * Initialize database service
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Initialize configured databases
      await this.initializeDatabases();
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      // Initialize metrics collection
      if (this.config.enableMetrics) {
        this.initializeMetrics();
      }

      this.initialized = true;
      console.log('🗄️ Database service initialized');
      this.emit('initialized');
    } catch (error) {
      console.error('❌ Database service initialization failed:', error);
      throw error;
    }
  }

  /**
   * Register a database connection
   */
  async registerDatabase(name, config) {
    try {
      const dbConfig = {
        name,
        type: config.type || 'mongodb', // mongodb, postgresql, mysql, sqlite, etc.
        connectionString: config.connectionString,
        poolConfig: config.poolConfig || {},
        options: config.options || {},
        primary: config.primary || false,
        readOnly: config.readOnly || false,
        healthCheck: config.healthCheck,
        retryPolicy: config.retryPolicy || { maxRetries: 3, backoff: 'exponential' }
      };

      // Create connection based on database type
      const connection = await this.createConnection(dbConfig);
      const pool = await this.createConnectionPool(dbConfig, connection);

      this.connections.set(name, { config: dbConfig, connection, pool });
      
      // Initialize metrics for this database
      this.metrics.set(name, {
        queries: 0,
        errors: 0,
        totalTime: 0,
        avgTime: 0,
        lastQuery: null,
        connections: 0,
        poolSize: pool ? pool.size : 1
      });

      console.log(`🗄️ Database registered: ${name} (${dbConfig.type})`);
      this.emit('databaseRegistered', { name, config: dbConfig });
      
      return connection;
    } catch (error) {
      console.error(`❌ Failed to register database ${name}:`, error);
      throw error;
    }
  }

  /**
   * Create database connection based on type
   */
  async createConnection(config) {
    switch (config.type) {
      case 'mongodb':
        return await this.createMongoConnection(config);
      case 'postgresql':
        return await this.createPostgreSQLConnection(config);
      case 'mysql':
        return await this.createMySQLConnection(config);
      case 'sqlite':
        return await this.createSQLiteConnection(config);
      default:
        throw new Error(`Unsupported database type: ${config.type}`);
    }
  }

  /**
   * Create MongoDB connection
   */
  async createMongoConnection(config) {
    try {
      const { MongoClient } = require('mongodb');
      
      const client = new MongoClient(config.connectionString, {
        maxPoolSize: this.config.maxConnections,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 0,
        family: 4,
        ...config.options
      });

      await client.connect();
      
      // Test connection
      await client.db().admin().ping();
      
      return {
        client,
        database: client.db(),
        type: 'mongodb',
        isConnected: () => client.topology && client.topology.isConnected()
      };
    } catch (error) {
      throw new Error(`MongoDB connection failed: ${error.message}`);
    }
  }

  /**
   * Create PostgreSQL connection (placeholder)
   */
  async createPostgreSQLConnection(config) {
    // Would use pg library
    throw new Error('PostgreSQL support not implemented yet');
  }

  /**
   * Create MySQL connection (placeholder)
   */
  async createMySQLConnection(config) {
    // Would use mysql2 library
    throw new Error('MySQL support not implemented yet');
  }

  /**
   * Create SQLite connection (placeholder)
   */
  async createSQLiteConnection(config) {
    // Would use sqlite3 library
    throw new Error('SQLite support not implemented yet');
  }

  /**
   * Create connection pool
   */
  async createConnectionPool(config, connection) {
    // For MongoDB, the driver handles pooling internally
    if (config.type === 'mongodb') {
      return {
        size: this.config.maxConnections,
        active: 0,
        idle: this.config.maxConnections
      };
    }

    // For other databases, implement actual pooling
    return null;
  }

  /**
   * Execute query with caching and metrics
   */
  async query(databaseName, operation, params = {}, options = {}) {
    const startTime = Date.now();
    const queryId = this.generateQueryId(operation, params);
    
    try {
      // Check cache first
      if (options.cache && this.queries.has(queryId)) {
        const cached = this.queries.get(queryId);
        if (Date.now() - cached.timestamp < (options.cacheTimeout || 300000)) { // 5 min default
          this.recordQueryMetrics(databaseName, Date.now() - startTime, false, true);
          return cached.result;
        }
      }

      // Get database connection
      const db = this.getDatabase(databaseName);
      if (!db) {
        throw new Error(`Database not found: ${databaseName}`);
      }

      // Execute query based on database type
      let result;
      if (db.connection.type === 'mongodb') {
        result = await this.executeMongoQuery(db.connection, operation, params, options);
      } else {
        throw new Error(`Query execution not implemented for database type: ${db.connection.type}`);
      }

      // Cache result if requested
      if (options.cache && result) {
        this.cacheQuery(queryId, result);
      }

      // Record metrics
      this.recordQueryMetrics(databaseName, Date.now() - startTime, false, false);
      
      // Log query if enabled
      if (this.config.enableQueryLog) {
        this.logQuery(databaseName, operation, params, Date.now() - startTime);
      }

      return result;
    } catch (error) {
      this.recordQueryMetrics(databaseName, Date.now() - startTime, true, false);
      console.error(`🗄️ Query failed on ${databaseName}:`, error);
      throw error;
    }
  }

  /**
   * Execute MongoDB query
   */
  async executeMongoQuery(connection, operation, params, options) {
    const { database } = connection;
    const { collection, query, projection, sort, limit, skip } = params;

    if (!collection) {
      throw new Error('Collection name is required for MongoDB queries');
    }

    const coll = database.collection(collection);

    switch (operation) {
      case 'find':
        return await coll.find(query || {}, { projection, sort, limit, skip }).toArray();
      
      case 'findOne':
        return await coll.findOne(query || {}, { projection });
      
      case 'insert':
        return await coll.insertOne(params.document);
      
      case 'insertMany':
        return await coll.insertMany(params.documents);
      
      case 'update':
        return await coll.updateOne(query || {}, params.update, params.options);
      
      case 'updateMany':
        return await coll.updateMany(query || {}, params.update, params.options);
      
      case 'delete':
        return await coll.deleteOne(query || {});
      
      case 'deleteMany':
        return await coll.deleteMany(query || {});
      
      case 'aggregate':
        return await coll.aggregate(params.pipeline || []).toArray();
      
      case 'count':
        return await coll.countDocuments(query || {});
      
      case 'distinct':
        return await coll.distinct(params.field, query || {});
      
      default:
        throw new Error(`Unsupported MongoDB operation: ${operation}`);
    }
  }

  /**
   * Get database by name
   */
  getDatabase(name) {
    return this.connections.get(name);
  }

  /**
   * Get primary database
   */
  getPrimaryDatabase() {
    for (const [name, db] of this.connections.entries()) {
      if (db.config.primary) {
        return { name, ...db };
      }
    }
    
    // Return first database if no primary is set
    const first = this.connections.entries().next();
    if (!first.done) {
      return { name: first.value[0], ...first.value[1] };
    }
    
    return null;
  }

  /**
   * Get read-only databases
   */
  getReadOnlyDatabases() {
    const readOnlyDBs = [];
    
    for (const [name, db] of this.connections.entries()) {
      if (db.config.readOnly) {
        readOnlyDBs.push({ name, ...db });
      }
    }
    
    return readOnlyDBs;
  }

  /**
   * Generate query ID for caching
   */
  generateQueryId(operation, params) {
    const queryString = JSON.stringify({ operation, params });
    return require('crypto').createHash('sha256').update(queryString).digest('hex');
  }

  /**
   * Cache query result
   */
  cacheQuery(queryId, result) {
    if (this.queries.size >= this.config.cacheSize) {
      // Remove oldest entry
      const firstKey = this.queries.keys().next().value;
      this.queries.delete(firstKey);
    }

    this.queries.set(queryId, {
      result,
      timestamp: Date.now()
    });
  }

  /**
   * Record query metrics
   */
  recordQueryMetrics(databaseName, duration, isError, isCached) {
    if (!this.config.enableMetrics) {
      return;
    }

    const metrics = this.metrics.get(databaseName);
    if (!metrics) {
      return;
    }

    metrics.queries++;
    metrics.totalTime += duration;
    metrics.avgTime = metrics.totalTime / metrics.queries;
    metrics.lastQuery = new Date();

    if (isError) {
      metrics.errors++;
    }

    if (isCached) {
      metrics.cacheHits = (metrics.cacheHits || 0) + 1;
    }

    this.metrics.set(databaseName, metrics);
  }

  /**
   * Log query for debugging
   */
  logQuery(databaseName, operation, params, duration) {
    console.log(`🗄️ Query [${databaseName}]: ${operation} (${duration}ms)`, {
      collection: params.collection,
      query: params.query,
      duration
    });
  }

  /**
   * Initialize databases from configuration
   */
  async initializeDatabases() {
    // This would read from configuration and register databases
    // For now, we'll just log that it's ready
    console.log('🗄️ Database initialization ready');
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    if (this.healthCheckTimer) {
      return;
    }

    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthChecks();
    }, this.config.healthCheckInterval);

    console.log('🗄️ Database health monitoring started');
  }

  /**
   * Perform health checks on all databases
   */
  async performHealthChecks() {
    const healthChecks = [];

    for (const [name, db] of this.connections.entries()) {
      healthChecks.push(this.performHealthCheck(name, db));
    }

    const results = await Promise.allSettled(healthChecks);
    
    results.forEach((result, index) => {
      const dbName = Array.from(this.connections.keys())[index];
      if (result.status === 'rejected') {
        console.warn(`🗄️ Health check failed for ${dbName}:`, result.reason?.message);
        this.emit('healthCheckFailed', dbName, result.reason);
      }
    });
  }

  /**
   * Perform health check on specific database
   */
  async performHealthCheck(name, db) {
    try {
      if (db.config.healthCheck) {
        return await db.config.healthCheck(db.connection);
      }

      // Default health check based on database type
      if (db.connection.type === 'mongodb') {
        await db.connection.database.admin().ping();
        return true;
      }

      return true;
    } catch (error) {
      throw new Error(`Health check failed for ${name}: ${error.message}`);
    }
  }

  /**
   * Initialize metrics collection
   */
  initializeMetrics() {
    console.log('🗄️ Database metrics collection enabled');
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    const allMetrics = {};
    
    for (const [name, metrics] of this.metrics.entries()) {
      allMetrics[name] = {
        ...metrics,
        errorRate: metrics.queries > 0 ? (metrics.errors / metrics.queries) * 100 : 0,
        cacheHitRate: metrics.cacheHits && metrics.queries > 0 ? 
          (metrics.cacheHits / metrics.queries) * 100 : 0
      };
    }

    return {
      databases: allMetrics,
      totalConnections: this.connections.size,
      cacheSize: this.queries.size,
      uptime: process.uptime()
    };
  }

  /**
   * Clear query cache
   */
  clearCache() {
    this.queries.clear();
    console.log('🗄️ Query cache cleared');
  }

  /**
   * Close all database connections
   */
  async close() {
    // Stop health monitoring
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    // Close all connections
    const closePromises = [];
    for (const [name, db] of this.connections.entries()) {
      closePromises.push(this.closeConnection(name, db));
    }

    await Promise.allSettled(closePromises);
    
    // Clear all data
    this.connections.clear();
    this.pools.clear();
    this.queries.clear();
    this.metrics.clear();
    
    this.initialized = false;
    console.log('🗄️ Database service closed');
    this.emit('closed');
  }

  /**
   * Close specific database connection
   */
  async closeConnection(name, db) {
    try {
      if (db.connection.type === 'mongodb' && db.connection.client) {
        await db.connection.client.close();
      }
      
      console.log(`🗄️ Database connection closed: ${name}`);
    } catch (error) {
      console.warn(`⚠️ Error closing database connection ${name}:`, error.message);
    }
  }
}

// Default database service instance
let defaultInstance = null;

/**
 * Get or create default database service instance
 */
function getDatabaseService(options) {
  if (!defaultInstance) {
    defaultInstance = new DatabaseService(options);
  }
  return defaultInstance;
}

/**
 * Initialize default database service
 */
async function initializeDatabaseService(options) {
  const service = getDatabaseService(options);
  await service.initialize();
  return service;
}

module.exports = {
  DatabaseService,
  getDatabaseService,
  initializeDatabaseService
};