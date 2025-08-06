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
                console.log(`🔄 Retrying connection in ${this.retryDelay / 1000} seconds... (${this.connectionAttempts}/${this.maxRetries})`);
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
                        { key: { lastActive: 1 } }
                    ]
                },
                {
                    name: `${prefix}listening_history`,
                    indexes: [
                        { key: { userId: 1, playedAt: -1 } },
                        { key: { trackId: 1 } },
                        { key: { artist: 1 } },
                        { key: { playedAt: -1 } },
                        { key: { userId: 1, trackId: 1 } }
                    ]
                },
                {
                    name: `${prefix}recommendations`,
                    indexes: [
                        { key: { userId: 1, createdAt: -1 } },
                        { key: { trackId: 1 } },
                        { key: { score: -1 } },
                        { key: { clicked: 1 } },
                        { key: { createdAt: 1 }, options: { expireAfterSeconds: 7 * 24 * 60 * 60 } } // Auto-expire after 7 days
                    ]
                },
                {
                    name: `${prefix}playlists`,
                    indexes: [
                        { key: { userId: 1, createdAt: -1 } },
                        { key: { spotifyId: 1 }, options: { unique: true, sparse: true } },
                        { key: { name: 'text', description: 'text' } }
                    ]
                },
                {
                    name: `${prefix}user_preferences`,
                    indexes: [
                        { key: { userId: 1 }, options: { unique: true } },
                        { key: { updatedAt: -1 } }
                    ]
                },
                {
                    name: `${prefix}analytics_events`,
                    indexes: [
                        { key: { userId: 1, timestamp: -1 } },
                        { key: { eventType: 1, timestamp: -1 } },
                        { key: { timestamp: 1 }, options: { expireAfterSeconds: 90 * 24 * 60 * 60 } } // Auto-expire after 90 days
                    ]
                },
                {
                    name: `${prefix}chat_sessions`,
                    indexes: [
                        { key: { userId: 1, startTime: -1 } },
                        { key: { startTime: 1 }, options: { expireAfterSeconds: 30 * 24 * 60 * 60 } } // Auto-expire after 30 days
                    ]
                }
            ];

            // Create collections and indexes
            for (const collection of collections) {
                try {
                    // Create collection if it doesn't exist
                    await this.db.createCollection(collection.name);
                    console.log(`✅ Collection created: ${collection.name}`);
                } catch (error) {
                    if (error.code !== 48) { // Collection already exists
                        console.error(`❌ Error creating collection ${collection.name}:`, error.message);
                    }
                }

                // Create indexes
                for (const indexSpec of collection.indexes) {
                    try {
                        await this.db.collection(collection.name).createIndex(indexSpec.key, indexSpec.options || {});
                        console.log(`✅ Index created on ${collection.name}:`, Object.keys(indexSpec.key).join(', '));
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
                    message: 'Not connected to MongoDB'
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
                database: this.db.databaseName
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                message: error.message
            };
        }
    }
}

// Export singleton instance
const mongoDBManager = new MongoDBManager();

// Auto-connect if URI is provided
if (process.env.MONGODB_URI) {
    mongoDBManager.connect().catch(console.error);
}

module.exports = mongoDBManager;