#!/usr/bin/env node

/**
 * User Behavior Profiles Generator
 * Creates comprehensive user profiles from listening history for personalized recommendations
 * Integrates with MCP server for automation and Redis for caching
 */

const { MongoClient } = require('mongodb');
const fs = require('fs').promises;
const path = require('path');

class UserBehaviorProfilesGenerator {
    constructor() {
        // Load environment configuration
        require('dotenv').config();
        
        this.config = {
            mongodb: {
                uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
                database: 'echotune'
            },
            redis: {
                host: 'redis-15489.c238.us-central1-2.gce.redns.redis-cloud.com',
                port: 15489,
                password: 'AQf4uK2hFoEH4qHAZg3v4Qy7GCWf6J7K'
            },
            processing: {
                batchSize: 100,
                minimumPlays: 5,  // Minimum plays to consider user active
                analysisWindow: 90 // Days to analyze for recent behavior
            }
        };
        
        this.mongodb = null;
        this.redis = null;
        this.stats = {
            usersProcessed: 0,
            profilesCreated: 0,
            profilesUpdated: 0,
            startTime: Date.now()
        };
    }

    async initialize() {
        console.log('👥 User Behavior Profiles Generator');
        console.log('🚀 Initializing systems...');
        
        try {
            await this.initializeMongoDB();
            await this.initializeRedis();
            
            console.log('✅ All systems initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Initialization failed:', error.message);
            return false;
        }
    }

    async initializeMongoDB() {
        if (!this.config.mongodb.uri || this.config.mongodb.uri.includes('undefined')) {
            throw new Error('MongoDB URI not configured properly');
        }
        
        this.mongodb = new MongoClient(this.config.mongodb.uri);
        await this.mongodb.connect();
        console.log('✅ MongoDB connected successfully');
    }

    async initializeRedis() {
        try {
            const { createClient } = require('redis');
            this.redis = createClient({
                username: 'default',
                password: this.config.redis.password,
                socket: {
                    host: this.config.redis.host,
                    port: this.config.redis.port
                }
            });
            
            await this.redis.connect();
            console.log('✅ Redis Cloud connected for profile caching');
        } catch (error) {
            console.log('⚠️  Redis not available, continuing without caching');
            this.redis = null;
        }
    }

    async analyzeListeningData() {
        console.log('\n📊 Analyzing listening data for profile generation...');
        
        const db = this.mongodb.db(this.config.mongodb.database);
        
        // Check available data sources
        const dataSources = {
            listening_history: await db.collection('listening_history').countDocuments(),
            enhanced_listening_history: await db.collection('enhanced_listening_history').countDocuments(),
            spotify_analytics: await db.collection('spotify_analytics').countDocuments(),
            existing_profiles: await db.collection('user_listening_profiles').countDocuments()
        };
        
        // Find the best data source
        const bestSource = Object.entries(dataSources)
            .filter(([key]) => key !== 'existing_profiles')
            .sort(([, a], [, b]) => b - a)[0];
        
        const [sourceName, sourceCount] = bestSource;
        
        console.log('📈 Data Sources Analysis:');
        Object.entries(dataSources).forEach(([source, count]) => {
            console.log(`  ${source}: ${count.toLocaleString()}`);
        });
        
        console.log(`🎯 Using primary source: ${sourceName} (${sourceCount.toLocaleString()} records)`);
        
        // Analyze user distribution
        const userStats = await this.analyzeUserDistribution(sourceName);
        
        return {
            dataSources,
            primarySource: sourceName,
            primaryCount: sourceCount,
            userStats,
            readyForProfiling: sourceCount > 100
        };
    }

    async analyzeUserDistribution(sourceName) {
        const db = this.mongodb.db(this.config.mongodb.database);
        
        // Get user play counts
        const userPlayCounts = await db.collection(sourceName).aggregate([
            {
                $group: {
                    _id: '$user_id',
                    totalPlays: { $sum: 1 },
                    uniqueTracks: { $addToSet: '$track_id' },
                    firstPlay: { $min: '$played_at' },
                    lastPlay: { $max: '$played_at' }
                }
            },
            {
                $project: {
                    user_id: '$_id',
                    totalPlays: 1,
                    uniqueTracks: { $size: '$uniqueTracks' },
                    firstPlay: 1,
                    lastPlay: 1,
                    isActive: { $gte: ['$totalPlays', this.config.processing.minimumPlays] }
                }
            }
        ]).toArray();
        
        const activeUsers = userPlayCounts.filter(user => user.isActive).length;
        const totalUsers = userPlayCounts.length;
        
        const stats = {
            totalUsers,
            activeUsers,
            inactiveUsers: totalUsers - activeUsers,
            averagePlaysPerUser: userPlayCounts.reduce((sum, user) => sum + user.totalPlays, 0) / totalUsers,
            averageUniqueTracksPerUser: userPlayCounts.reduce((sum, user) => sum + user.uniqueTracks, 0) / totalUsers
        };
        
        console.log(`👥 User Statistics:`);
        console.log(`  Total Users: ${stats.totalUsers.toLocaleString()}`);
        console.log(`  Active Users: ${stats.activeUsers.toLocaleString()}`);
        console.log(`  Average Plays/User: ${Math.round(stats.averagePlaysPerUser)}`);
        console.log(`  Average Unique Tracks/User: ${Math.round(stats.averageUniqueTracksPerUser)}`);
        
        return stats;
    }

    async setupProfilesCollection() {
        console.log('\n🗄️  Setting up user profiles collection...');
        
        const db = this.mongodb.db(this.config.mongodb.database);
        
        try {
            // Create collection with validation schema
            await db.createCollection('user_listening_profiles', {
                validator: {
                    $jsonSchema: {
                        bsonType: 'object',
                        required: ['user_id', 'listening_patterns', 'music_preferences', 'profile_ready'],
                        properties: {
                            user_id: { bsonType: 'string' },
                            listening_patterns: { bsonType: 'object' },
                            music_preferences: { bsonType: 'object' },
                            recommendation_context: { bsonType: 'object' },
                            profile_ready: { bsonType: 'bool' },
                            created_at: { bsonType: 'date' },
                            updated_at: { bsonType: 'date' }
                        }
                    }
                }
            });
            console.log('✅ User profiles collection created with validation');
        } catch (error) {
            if (error.code === 48) {
                console.log('✅ User profiles collection already exists');
            } else {
                throw error;
            }
        }
        
        // Create indexes
        const indexes = [
            { user_id: 1 },
            { profile_ready: 1 },
            { 'recommendation_context.last_updated': -1 },
            { 'listening_patterns.total_plays': -1 },
            { created_at: -1 }
        ];
        
        for (const index of indexes) {
            try {
                await db.collection('user_listening_profiles').createIndex(index);
            } catch (error) {
                // Index might already exist
            }
        }
        
        console.log('✅ User profiles indexes created');
        return true;
    }

    async generateUserProfiles() {
        const analysis = await this.analyzeListeningData();
        
        if (!analysis.readyForProfiling) {
            throw new Error('Not enough listening data for profile generation');
        }
        
        console.log(`\n👥 Generating user profiles from ${analysis.primarySource}...`);
        
        // Setup collection
        await this.setupProfilesCollection();
        
        const db = this.mongodb.db(this.config.mongodb.database);
        
        // Get active users
        const activeUsers = await db.collection(analysis.primarySource).aggregate([
            {
                $group: {
                    _id: '$user_id',
                    totalPlays: { $sum: 1 }
                }
            },
            {
                $match: {
                    totalPlays: { $gte: this.config.processing.minimumPlays }
                }
            },
            {
                $project: {
                    user_id: '$_id',
                    totalPlays: 1
                }
            }
        ]).toArray();
        
        console.log(`🎯 Processing ${activeUsers.length} active users...`);
        
        const results = {
            processed: 0,
            created: 0,
            updated: 0,
            failed: 0
        };
        
        // Process users in batches
        for (let i = 0; i < activeUsers.length; i += this.config.processing.batchSize) {
            const batch = activeUsers.slice(i, i + this.config.processing.batchSize);
            
            console.log(`🔄 Processing batch ${Math.floor(i / this.config.processing.batchSize) + 1}/${Math.ceil(activeUsers.length / this.config.processing.batchSize)}`);
            
            const batchResult = await this.procesUserBatch(batch, analysis.primarySource);
            
            results.processed += batchResult.processed;
            results.created += batchResult.created;
            results.updated += batchResult.updated;
            results.failed += batchResult.failed;
            
            // Progress update
            const progress = ((results.processed / activeUsers.length) * 100).toFixed(1);
            console.log(`📊 Progress: ${results.processed}/${activeUsers.length} (${progress}%)`);
        }
        
        // Cache profile generation status
        if (this.redis) {
            await this.redis.set('user_profiles:generation', JSON.stringify({
                profiles: results.created + results.updated,
                timestamp: Date.now(),
                ready: true
            }), { EX: 3600 });
        }
        
        console.log('\n🎉 User profiles generation completed!');
        console.log('=' .repeat(50));
        console.log(`👥 Users processed: ${results.processed}`);
        console.log(`✅ Profiles created: ${results.created}`);
        console.log(`🔄 Profiles updated: ${results.updated}`);
        console.log(`❌ Failed: ${results.failed}`);
        
        return results;
    }

    async procesUserBatch(users, sourceName) {
        const db = this.mongodb.db(this.config.mongodb.database);
        let processed = 0;
        let created = 0;
        let updated = 0;
        let failed = 0;
        
        const operations = [];
        
        for (const user of users) {
            try {
                const profile = await this.generateUserProfile(user.user_id, sourceName);
                
                if (profile) {
                    operations.push({
                        updateOne: {
                            filter: { user_id: user.user_id },
                            update: {
                                $set: {
                                    ...profile,
                                    updated_at: new Date()
                                },
                                $setOnInsert: {
                                    created_at: new Date()
                                }
                            },
                            upsert: true
                        }
                    });
                    processed++;
                } else {
                    failed++;
                }
            } catch (error) {
                console.warn(`⚠️  Failed to generate profile for user ${user.user_id}: ${error.message}`);
                failed++;
            }
        }
        
        if (operations.length > 0) {
            try {
                const result = await db.collection('user_listening_profiles').bulkWrite(operations, { ordered: false });
                created = result.upsertedCount;
                updated = result.modifiedCount;
            } catch (error) {
                console.error('❌ Batch profile write failed:', error.message);
                failed += processed;
                processed = 0;
                created = 0;
                updated = 0;
            }
        }
        
        return { processed, created, updated, failed };
    }

    async generateUserProfile(userId, sourceName) {
        const db = this.mongodb.db(this.config.mongodb.database);
        
        // Get user's listening history
        const userTracks = await db.collection(sourceName).find({
            user_id: userId
        }).toArray();
        
        if (userTracks.length === 0) {
            return null;
        }
        
        // Generate listening patterns
        const listeningPatterns = this.analyzeListeningPatterns(userTracks);
        
        // Generate music preferences
        const musicPreferences = await this.analyzeMusicPreferences(userTracks);
        
        // Generate recommendation context
        const recommendationContext = this.generateRecommendationContext(userTracks);
        
        return {
            user_id: userId,
            listening_patterns: listeningPatterns,
            music_preferences: musicPreferences,
            recommendation_context: recommendationContext,
            profile_ready: true,
            data_source: sourceName,
            profile_version: '1.0'
        };
    }

    analyzeListeningPatterns(userTracks) {
        const patterns = {
            total_plays: userTracks.length,
            unique_tracks: new Set(userTracks.map(t => t.track_id)).size,
            unique_artists: new Set(userTracks.map(t => t.artist_name)).size,
            listening_timeframe: {
                first_play: Math.min(...userTracks.map(t => new Date(t.played_at).getTime())),
                last_play: Math.max(...userTracks.map(t => new Date(t.played_at).getTime()))
            },
            platform_usage: {},
            listening_hours: {},
            session_patterns: {}
        };
        
        // Analyze platform usage
        userTracks.forEach(track => {
            const platform = track.platform || 'unknown';
            patterns.platform_usage[platform] = (patterns.platform_usage[platform] || 0) + 1;
        });
        
        // Analyze listening hours
        userTracks.forEach(track => {
            const hour = new Date(track.played_at).getHours();
            patterns.listening_hours[hour] = (patterns.listening_hours[hour] || 0) + 1;
        });
        
        // Calculate listening diversity
        patterns.diversity_score = patterns.unique_tracks / patterns.total_plays;
        patterns.artist_diversity = patterns.unique_artists / patterns.unique_tracks;
        
        // Calculate activity level
        const timespan = patterns.listening_timeframe.last_play - patterns.listening_timeframe.first_play;
        const daysActive = timespan / (1000 * 60 * 60 * 24);
        patterns.avg_plays_per_day = patterns.total_plays / Math.max(1, daysActive);
        
        return patterns;
    }

    async analyzeMusicPreferences(userTracks) {
        const db = this.mongodb.db(this.config.mongodb.database);
        
        const preferences = {
            top_genres: {},
            audio_feature_preferences: {
                acousticness: [],
                danceability: [],
                energy: [],
                instrumentalness: [],
                liveness: [],
                loudness: [],
                speechiness: [],
                valence: [],
                tempo: []
            },
            mood_preferences: []
        };
        
        // Get audio features for user's tracks
        const trackUris = userTracks.map(t => t.track_uri).filter(uri => uri);
        
        if (trackUris.length > 0) {
            const tracksWithFeatures = await db.collection('spotify_analytics').find({
                track_uri: { $in: trackUris },
                'audio_features': { $exists: true, $ne: null }
            }).toArray();
            
            // Analyze audio feature preferences
            tracksWithFeatures.forEach(track => {
                const features = track.audio_features;
                
                Object.keys(preferences.audio_feature_preferences).forEach(feature => {
                    if (features[feature] !== null && features[feature] !== undefined) {
                        preferences.audio_feature_preferences[feature].push(features[feature]);
                    }
                });
            });
            
            // Calculate average preferences
            Object.keys(preferences.audio_feature_preferences).forEach(feature => {
                const values = preferences.audio_feature_preferences[feature];
                if (values.length > 0) {
                    preferences.audio_feature_preferences[feature] = {
                        average: values.reduce((sum, val) => sum + val, 0) / values.length,
                        variance: this.calculateVariance(values),
                        sample_size: values.length
                    };
                } else {
                    preferences.audio_feature_preferences[feature] = null;
                }
            });
        }
        
        // Analyze genre preferences from track data
        userTracks.forEach(track => {
            // Extract genre from track name or use artist-based heuristics
            const genres = this.extractGenreHeuristics(track);
            genres.forEach(genre => {
                preferences.top_genres[genre] = (preferences.top_genres[genre] || 0) + 1;
            });
        });
        
        // Generate mood preferences based on audio features
        if (Object.values(preferences.audio_feature_preferences).some(pref => pref !== null)) {
            preferences.mood_preferences = this.generateMoodPreferences(preferences.audio_feature_preferences);
        }
        
        return preferences;
    }

    extractGenreHeuristics(track) {
        const genres = [];
        const artistName = (track.artist_name || '').toLowerCase();
        const trackName = (track.track_name || '').toLowerCase();
        
        // Simple genre detection based on artist/track names
        const genreKeywords = {
            'rock': ['rock', 'metal', 'punk', 'alternative'],
            'pop': ['pop', 'taylor swift', 'ariana grande'],
            'hip-hop': ['hip hop', 'rap', 'drake', 'kanye'],
            'electronic': ['electronic', 'edm', 'techno', 'house'],
            'jazz': ['jazz', 'blues'],
            'classical': ['classical', 'symphony', 'orchestra'],
            'country': ['country', 'folk'],
            'r&b': ['r&b', 'soul', 'rnb']
        };
        
        Object.entries(genreKeywords).forEach(([genre, keywords]) => {
            if (keywords.some(keyword => artistName.includes(keyword) || trackName.includes(keyword))) {
                genres.push(genre);
            }
        });
        
        // Default to 'unknown' if no genres detected
        if (genres.length === 0) {
            genres.push('unknown');
        }
        
        return genres;
    }

    generateMoodPreferences(audioFeaturePrefs) {
        const moods = [];
        
        if (audioFeaturePrefs.valence && audioFeaturePrefs.energy) {
            const valence = audioFeaturePrefs.valence.average;
            const energy = audioFeaturePrefs.energy.average;
            
            if (valence > 0.6 && energy > 0.6) {
                moods.push('happy_energetic');
            } else if (valence > 0.6 && energy <= 0.6) {
                moods.push('happy_calm');
            } else if (valence <= 0.6 && energy > 0.6) {
                moods.push('intense_energetic');
            } else {
                moods.push('melancholic_calm');
            }
        }
        
        if (audioFeaturePrefs.acousticness && audioFeaturePrefs.acousticness.average > 0.7) {
            moods.push('acoustic_preference');
        }
        
        if (audioFeaturePrefs.danceability && audioFeaturePrefs.danceability.average > 0.7) {
            moods.push('danceable_preference');
        }
        
        return moods;
    }

    generateRecommendationContext(userTracks) {
        return {
            last_updated: new Date(),
            profile_strength: this.calculateProfileStrength(userTracks),
            recommendation_readiness: userTracks.length >= 20,
            preference_confidence: Math.min(1.0, userTracks.length / 100),
            data_points: userTracks.length,
            profile_completeness: this.calculateProfileCompleteness(userTracks)
        };
    }

    calculateProfileStrength(userTracks) {
        // Profile strength based on data diversity and volume
        const uniqueTracks = new Set(userTracks.map(t => t.track_id)).size;
        const uniqueArtists = new Set(userTracks.map(t => t.artist_name)).size;
        
        const diversityScore = uniqueTracks / Math.max(1, userTracks.length);
        const artistDiversityScore = uniqueArtists / Math.max(1, uniqueTracks);
        const volumeScore = Math.min(1.0, userTracks.length / 100);
        
        return (diversityScore * 0.3 + artistDiversityScore * 0.3 + volumeScore * 0.4);
    }

    calculateProfileCompleteness(userTracks) {
        let completeness = 0;
        
        // Check data completeness
        if (userTracks.length >= 10) completeness += 0.3;
        if (new Set(userTracks.map(t => t.artist_name)).size >= 5) completeness += 0.3;
        if (userTracks.some(t => t.track_uri)) completeness += 0.2;
        if (userTracks.some(t => t.played_at)) completeness += 0.2;
        
        return completeness;
    }

    calculateVariance(values) {
        if (values.length === 0) return 0;
        
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
        return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    }

    async generateProfilesReport() {
        const analysis = await this.analyzeListeningData();
        
        const db = this.mongodb.db(this.config.mongodb.database);
        const totalProfiles = await db.collection('user_listening_profiles').countDocuments();
        const readyProfiles = await db.collection('user_listening_profiles').countDocuments({ profile_ready: true });
        
        const report = {
            timestamp: new Date().toISOString(),
            system: 'User Behavior Profiles Generator',
            dataAnalysis: analysis,
            profilesStatus: {
                total: totalProfiles,
                ready: readyProfiles,
                completionRate: totalProfiles > 0 ? ((readyProfiles / totalProfiles) * 100).toFixed(1) : 0,
                recommendationReady: readyProfiles > 10
            },
            recommendations: [],
            nextSteps: []
        };
        
        // Generate recommendations
        if (readyProfiles >= 50) {
            report.recommendations.push({
                priority: 'HIGH',
                task: 'Deploy Collaborative Filtering',
                description: `${readyProfiles} user profiles ready for collaborative filtering recommendations`
            });
        }
        
        if (readyProfiles >= 100) {
            report.recommendations.push({
                priority: 'HIGH', 
                task: 'Implement User-Based Recommendations',
                description: 'Sufficient user profiles for user-to-user similarity recommendations'
            });
        }
        
        // Next steps
        report.nextSteps = [
            {
                task: 'Create Recommendation Engine',
                description: 'Implement recommendation algorithms using user profiles',
                priority: 'HIGH'
            },
            {
                task: 'Deploy Real-time Profile Updates',
                description: 'Update user profiles with new listening activity',
                priority: 'MEDIUM'
            },
            {
                task: 'Implement Profile-Based API',
                description: 'Create API endpoints for profile-based recommendations',
                priority: 'MEDIUM'
            }
        ];
        
        // Save report
        const reportPath = path.join(__dirname, '..', 'USER_PROFILES_GENERATION_REPORT.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        const mdReport = this.generateMarkdownReport(report);
        const mdReportPath = path.join(__dirname, '..', 'USER_PROFILES_GENERATION_REPORT.md');
        await fs.writeFile(mdReportPath, mdReport);
        
        return report;
    }

    generateMarkdownReport(report) {
        return `# 👥 User Behavior Profiles Generation Report

**Generated:** ${report.timestamp}  
**System:** ${report.system}

## 📊 Data Analysis

### Listening Data Sources
${Object.entries(report.dataAnalysis.dataSources).map(([source, count]) => `
- **${source}:** ${count.toLocaleString()} records
`).join('')}

**Primary Source:** ${report.dataAnalysis.primarySource} (${report.dataAnalysis.primaryCount.toLocaleString()} records)

### User Statistics
- **Total Users:** ${report.dataAnalysis.userStats.totalUsers.toLocaleString()}
- **Active Users:** ${report.dataAnalysis.userStats.activeUsers.toLocaleString()}
- **Average Plays/User:** ${Math.round(report.dataAnalysis.userStats.averagePlaysPerUser)}
- **Average Unique Tracks/User:** ${Math.round(report.dataAnalysis.userStats.averageUniqueTracksPerUser)}

## 👥 User Profiles Status

- **Total Profiles:** ${report.profilesStatus.total.toLocaleString()}
- **Ready Profiles:** ${report.profilesStatus.ready.toLocaleString()}
- **Completion Rate:** ${report.profilesStatus.completionRate}%
- **Recommendation Ready:** ${report.profilesStatus.recommendationReady ? '✅ YES' : '❌ NO'}

## 🔧 Profile Features

Each user profile contains:
- **Listening Patterns:** Play counts, diversity scores, platform usage, listening hours
- **Music Preferences:** Audio feature preferences, genre preferences, mood patterns  
- **Recommendation Context:** Profile strength, confidence scores, completeness metrics

## 🎯 Recommendations

${report.recommendations.map(rec => `
### ${rec.task} (${rec.priority})
${rec.description}
`).join('')}

## 📋 Next Steps

${report.nextSteps.map((step, index) => `
${index + 1}. **${step.task}** (${step.priority})
   ${step.description}
`).join('')}

## 📈 System Readiness

- **Collaborative Filtering:** ${report.profilesStatus.ready >= 50 ? '✅ Ready' : '❌ Needs more profiles'}
- **Content-Based Recommendations:** ${report.profilesStatus.ready >= 20 ? '✅ Ready' : '❌ Needs more profiles'}
- **User Similarity Analysis:** ${report.profilesStatus.ready >= 100 ? '✅ Ready' : '❌ Needs more profiles'}

---
*Generated by User Behavior Profiles Generator with MCP Integration*
`;
    }

    async cleanup() {
        try {
            if (this.mongodb) {
                await this.mongodb.close();
                console.log('✅ MongoDB connection closed');
            }
            if (this.redis) {
                await this.redis.quit();
                console.log('✅ Redis connection closed');
            }
        } catch (error) {
            console.warn('⚠️  Cleanup warning:', error.message);
        }
    }
}

// Main execution
async function main() {
    const generator = new UserBehaviorProfilesGenerator();
    
    try {
        console.log('👥 User Behavior Profiles Generator');
        console.log('=' .repeat(60));
        
        // Initialize
        const initialized = await generator.initialize();
        if (!initialized) {
            console.error('❌ Failed to initialize profiles generator');
            process.exit(1);
        }
        
        // Generate user profiles
        const result = await generator.generateUserProfiles();
        
        // Generate report
        const report = await generator.generateProfilesReport();
        
        console.log('\n📄 Report generated: USER_PROFILES_GENERATION_REPORT.md');
        console.log('👥 User profiles generation completed successfully!');
        
        if (report.profilesStatus.recommendationReady) {
            console.log('\n🎉 PROFILES ARE RECOMMENDATION-READY!');
            console.log('✅ You can now deploy personalized recommendation algorithms');
        }
        
    } catch (error) {
        console.error('❌ Profile generation failed:', error);
        process.exit(1);
    } finally {
        await generator.cleanup();
    }
}

if (require.main === module) {
    main();
}

module.exports = UserBehaviorProfilesGenerator;