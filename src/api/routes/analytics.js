// MongoDB Analytics and Insights API
// Provides comprehensive database analytics and insights

const express = require('express');
const router = express.Router();

class MongoDBAnalytics {
    constructor() {
        this.dbManager = require('../../database/mongodb-manager');
    }

    async getDatabaseOverview() {
        try {
            if (!this.dbManager.isConnected()) {
                return {
                    connected: false,
                    message: 'MongoDB not connected',
                    fallback: 'Using SQLite fallback'
                };
            }

            const db = this.dbManager.getDatabase();
            const admin = db.admin();
            
            // Get database stats
            const dbStats = await db.stats();
            const collections = await db.listCollections().toArray();
            
            // Server status
            const serverStatus = await admin.serverStatus();
            
            return {
                connected: true,
                database: {
                    name: db.databaseName,
                    collections: collections.length,
                    dataSize: this.formatBytes(dbStats.dataSize),
                    storageSize: this.formatBytes(dbStats.storageSize),
                    indexSize: this.formatBytes(dbStats.indexSize),
                    documents: dbStats.objects,
                    avgObjectSize: this.formatBytes(dbStats.avgObjSize),
                    indexes: dbStats.indexes
                },
                server: {
                    version: serverStatus.version,
                    uptime: this.formatUptime(serverStatus.uptime),
                    connections: serverStatus.connections,
                    memory: {
                        resident: this.formatBytes(serverStatus.mem.resident * 1024 * 1024),
                        virtual: this.formatBytes(serverStatus.mem.virtual * 1024 * 1024),
                        mapped: this.formatBytes((serverStatus.mem.mapped || 0) * 1024 * 1024)
                    },
                    network: serverStatus.network,
                    operations: serverStatus.opcounters
                }
            };
        } catch (error) {
            console.error('Error getting database overview:', error);
            return {
                connected: false,
                error: error.message,
                fallback: 'Using SQLite fallback'
            };
        }
    }

    async getCollectionStats() {
        try {
            if (!this.dbManager.isConnected()) {
                return { collections: [] };
            }

            const db = this.dbManager.getDatabase();
            const collections = await db.listCollections().toArray();
            
            const stats = await Promise.all(
                collections.map(async (collection) => {
                    try {
                        const collStats = await db.collection(collection.name).stats();
                        const sampleDoc = await db.collection(collection.name).findOne({});
                        
                        return {
                            name: collection.name,
                            documents: collStats.count,
                            size: this.formatBytes(collStats.size),
                            storageSize: this.formatBytes(collStats.storageSize),
                            indexes: collStats.nindexes,
                            indexSize: this.formatBytes(collStats.totalIndexSize),
                            avgDocSize: this.formatBytes(collStats.avgObjSize),
                            sampleDocument: sampleDoc ? Object.keys(sampleDoc) : [],
                            lastActivity: await this.getLastActivity(collection.name)
                        };
                    } catch (error) {
                        return {
                            name: collection.name,
                            error: error.message
                        };
                    }
                })
            );
            
            return { collections: stats };
        } catch (error) {
            console.error('Error getting collection stats:', error);
            return { collections: [], error: error.message };
        }
    }

    async getUserAnalytics() {
        try {
            if (!this.dbManager.isConnected()) {
                return this.getFallbackAnalytics('users');
            }

            const db = this.dbManager.getDatabase();
            const usersCollection = db.collection('users');
            const listeningHistoryCollection = db.collection('listening_history');
            
            // User statistics
            const totalUsers = await usersCollection.countDocuments();
            const activeUsers = await usersCollection.countDocuments({
                lastActive: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            });
            
            // User registration trends
            const registrationTrends = await usersCollection.aggregate([
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } },
                { $limit: 12 }
            ]).toArray();
            
            // User engagement metrics
            const engagementStats = await listeningHistoryCollection.aggregate([
                {
                    $group: {
                        _id: '$userId',
                        totalPlays: { $sum: 1 },
                        uniqueTracks: { $addToSet: '$trackId' },
                        lastPlay: { $max: '$playedAt' }
                    }
                },
                {
                    $group: {
                        _id: null,
                        avgPlaysPerUser: { $avg: '$totalPlays' },
                        avgUniqueTracksPerUser: { $avg: { $size: '$uniqueTracks' } },
                        totalPlays: { $sum: '$totalPlays' }
                    }
                }
            ]).toArray();
            
            return {
                users: {
                    total: totalUsers,
                    active: activeUsers,
                    registrationTrends: registrationTrends.map(trend => ({
                        date: `${trend._id.year}-${String(trend._id.month).padStart(2, '0')}`,
                        count: trend.count
                    })),
                    engagement: engagementStats[0] || {}
                }
            };
        } catch (error) {
            console.error('Error getting user analytics:', error);
            return { users: {}, error: error.message };
        }
    }

    async getMusicAnalytics() {
        try {
            if (!this.dbManager.isConnected()) {
                return this.getFallbackAnalytics('music');
            }

            const db = this.dbManager.getDatabase();
            const listeningHistoryCollection = db.collection('listening_history');
            const recommendationsCollection = db.collection('recommendations');
            
            // Music listening trends
            const listeningTrends = await listeningHistoryCollection.aggregate([
                {
                    $group: {
                        _id: {
                            year: { $year: '$playedAt' },
                            month: { $month: '$playedAt' },
                            day: { $dayOfMonth: '$playedAt' }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
                { $limit: 30 }
            ]).toArray();
            
            // Top tracks
            const topTracks = await listeningHistoryCollection.aggregate([
                {
                    $group: {
                        _id: {
                            trackId: '$trackId',
                            trackName: '$trackName',
                            artist: '$artist'
                        },
                        playCount: { $sum: 1 },
                        uniqueUsers: { $addToSet: '$userId' }
                    }
                },
                { $sort: { playCount: -1 } },
                { $limit: 20 }
            ]).toArray();
            
            // Top artists
            const topArtists = await listeningHistoryCollection.aggregate([
                {
                    $group: {
                        _id: '$artist',
                        playCount: { $sum: 1 },
                        uniqueTracks: { $addToSet: '$trackId' },
                        uniqueUsers: { $addToSet: '$userId' }
                    }
                },
                { $sort: { playCount: -1 } },
                { $limit: 20 }
            ]).toArray();
            
            // Genre distribution (if available)
            const genreDistribution = await listeningHistoryCollection.aggregate([
                { $match: { 'features.genre': { $exists: true } } },
                {
                    $group: {
                        _id: '$features.genre',
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]).toArray();
            
            // Recommendation effectiveness
            const recommendationStats = await recommendationsCollection.aggregate([
                {
                    $group: {
                        _id: null,
                        totalRecommendations: { $sum: 1 },
                        avgScore: { $avg: '$score' },
                        clickedRecommendations: {
                            $sum: { $cond: [{ $gt: ['$clickCount', 0] }, 1, 0] }
                        }
                    }
                }
            ]).toArray();
            
            return {
                music: {
                    listeningTrends: listeningTrends.map(trend => ({
                        date: `${trend._id.year}-${String(trend._id.month).padStart(2, '0')}-${String(trend._id.day).padStart(2, '0')}`,
                        count: trend.count
                    })),
                    topTracks: topTracks.map(track => ({
                        name: track._id.trackName,
                        artist: track._id.artist,
                        playCount: track.playCount,
                        uniqueUsers: track.uniqueUsers.length
                    })),
                    topArtists: topArtists.map(artist => ({
                        name: artist._id,
                        playCount: artist.playCount,
                        uniqueTracks: artist.uniqueTracks.length,
                        uniqueUsers: artist.uniqueUsers.length
                    })),
                    genreDistribution: genreDistribution.map(genre => ({
                        genre: genre._id,
                        count: genre.count
                    })),
                    recommendations: recommendationStats[0] || {}
                }
            };
        } catch (error) {
            console.error('Error getting music analytics:', error);
            return { music: {}, error: error.message };
        }
    }

    async getSystemPerformance() {
        try {
            if (!this.dbManager.isConnected()) {
                return { performance: {}, error: 'MongoDB not connected' };
            }

            const db = this.dbManager.getDatabase();
            const admin = db.admin();
            
            // Get current operations
            const currentOps = await admin.currentOp();
            
            // Get profiling data (if enabled)
            let profilingData = [];
            try {
                profilingData = await db.collection('system.profile')
                    .find({})
                    .sort({ ts: -1 })
                    .limit(100)
                    .toArray();
            } catch (error) {
                // Profiling might not be enabled
            }
            
            // Query performance analysis
            const slowQueries = profilingData
                .filter(op => op.millis > 100)
                .slice(0, 10)
                .map(op => ({
                    operation: op.op,
                    collection: op.ns,
                    duration: op.millis,
                    timestamp: op.ts
                }));
            
            return {
                performance: {
                    activeConnections: currentOps.inprog.length,
                    currentOperations: currentOps.inprog.slice(0, 10).map(op => ({
                        operation: op.op,
                        collection: op.ns,
                        duration: op.secs_running,
                        active: op.active
                    })),
                    slowQueries,
                    profilingEnabled: profilingData.length > 0
                }
            };
        } catch (error) {
            console.error('Error getting system performance:', error);
            return { performance: {}, error: error.message };
        }
    }

    async getLastActivity(collectionName) {
        try {
            const db = this.dbManager.getDatabase();
            const collection = db.collection(collectionName);
            
            // Try to find the most recent document
            const recentDoc = await collection.findOne(
                {},
                { sort: { _id: -1 } }
            );
            
            if (recentDoc && recentDoc._id) {
                // Extract timestamp from ObjectId
                return recentDoc._id.getTimestamp();
            }
            
            return null;
        } catch (error) {
            return null;
        }
    }

    getFallbackAnalytics(type) {
        return {
            fallback: true,
            message: `${type} analytics not available - using SQLite fallback`,
            mongodbRequired: true
        };
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatUptime(seconds) {
        const days = Math.floor(seconds / (24 * 60 * 60));
        const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((seconds % (60 * 60)) / 60);
        
        if (days > 0) {
            return `${days}d ${hours}h ${minutes}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }
}

const analytics = new MongoDBAnalytics();

// Get database overview
router.get('/overview', async (req, res) => {
    try {
        const overview = await analytics.getDatabaseOverview();
        res.json({ success: true, data: overview });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get collection statistics
router.get('/collections', async (req, res) => {
    try {
        const stats = await analytics.getCollectionStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get user analytics
router.get('/users', async (req, res) => {
    try {
        const userAnalytics = await analytics.getUserAnalytics();
        res.json({ success: true, data: userAnalytics });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get music analytics
router.get('/music', async (req, res) => {
    try {
        const musicAnalytics = await analytics.getMusicAnalytics();
        res.json({ success: true, data: musicAnalytics });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get system performance
router.get('/performance', async (req, res) => {
    try {
        const performance = await analytics.getSystemPerformance();
        res.json({ success: true, data: performance });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get comprehensive analytics
router.get('/comprehensive', async (req, res) => {
    try {
        const [overview, collections, users, music, performance] = await Promise.all([
            analytics.getDatabaseOverview(),
            analytics.getCollectionStats(),
            analytics.getUserAnalytics(),
            analytics.getMusicAnalytics(),
            analytics.getSystemPerformance()
        ]);
        
        res.json({
            success: true,
            data: {
                overview,
                collections,
                users,
                music,
                performance,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;