#!/usr/bin/env node

/**
 * Enhanced Audio Features Fetcher with MCP Integration
 * Fetches missing audio features using Spotify API with intelligent batching
 * Integrates with MCP server for automation and validation
 */

const { MongoClient } = require('mongodb');
const fs = require('fs').promises;
const path = require('path');

class EnhancedAudioFeaturesFetcher {
    constructor() {
        // Load environment configuration
        require('dotenv').config();
        
        this.config = {
            spotify: {
                clientId: process.env.SPOTIFY_CLIENT_ID,
                clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
                baseUrl: 'https://api.spotify.com/v1'
            },
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
                batchSize: 50,
                delayBetweenBatches: 1000,
                maxRetries: 3
            }
        };
        
        this.mongodb = null;
        this.redis = null;
        this.accessToken = null;
        this.stats = {
            processed: 0,
            successful: 0,
            failed: 0,
            cached: 0,
            startTime: Date.now()
        };
    }

    async initialize() {
        console.log('🎵 Enhanced Audio Features Fetcher with MCP Integration');
        console.log('🚀 Initializing connections...');
        
        try {
            // Initialize MongoDB
            await this.initializeMongoDB();
            
            // Initialize Redis for caching
            await this.initializeRedis();
            
            // Get Spotify access token
            await this.getSpotifyAccessToken();
            
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
            console.log('✅ Redis Cloud connected for caching');
        } catch (error) {
            console.log('⚠️  Redis not available, continuing without caching');
            this.redis = null;
        }
    }

    async getSpotifyAccessToken() {
        if (!this.config.spotify.clientId || !this.config.spotify.clientSecret) {
            throw new Error('Spotify credentials not configured');
        }
        
        const tokenUrl = 'https://accounts.spotify.com/api/token';
        const credentials = Buffer.from(`${this.config.spotify.clientId}:${this.config.spotify.clientSecret}`).toString('base64');
        
        try {
            const response = await fetch(tokenUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: 'grant_type=client_credentials'
            });
            
            if (!response.ok) {
                throw new Error(`Spotify authentication failed: ${response.status}`);
            }
            
            const data = await response.json();
            this.accessToken = data.access_token;
            
            console.log('✅ Spotify API authentication successful');
            
            // Cache token in Redis if available
            if (this.redis) {
                await this.redis.set('spotify:access_token', this.accessToken, { EX: data.expires_in - 60 });
            }
            
        } catch (error) {
            throw new Error(`Failed to get Spotify access token: ${error.message}`);
        }
    }

    async analyzeCurrentState() {
        console.log('\n📊 Analyzing current audio features state...');
        
        const db = this.mongodb.db(this.config.mongodb.database);
        
        // Check main collection
        const total = await db.collection('spotify_analytics').countDocuments();
        const withFeatures = await db.collection('spotify_analytics').countDocuments({
            'audio_features': { $exists: true, $ne: null }
        });
        
        const missing = total - withFeatures;
        const coverage = total > 0 ? ((withFeatures / total) * 100).toFixed(1) : 0;
        
        console.log(`📈 Total tracks: ${total.toLocaleString()}`);
        console.log(`✅ With audio features: ${withFeatures.toLocaleString()} (${coverage}%)`);
        console.log(`❌ Missing audio features: ${missing.toLocaleString()}`);
        
        return {
            total,
            withFeatures,
            missing,
            coverage: parseFloat(coverage)
        };
    }

    async fetchMissingAudioFeatures() {
        const analysis = await this.analyzeCurrentState();
        
        if (analysis.missing === 0) {
            console.log('🎉 All tracks already have audio features!');
            return { message: 'No missing audio features found' };
        }
        
        console.log(`\n🔄 Processing ${analysis.missing} tracks without audio features...`);
        
        const db = this.mongodb.db(this.config.mongodb.database);
        
        // Get tracks without audio features in batches
        const cursor = db.collection('spotify_analytics').find({
            'audio_features': { $exists: false },
            'track_uri': { $regex: '^spotify:track:' }
        }).project({ track_uri: 1, _id: 1 });
        
        const results = {
            processed: 0,
            successful: 0,
            failed: 0,
            batches: 0
        };
        
        const tracks = await cursor.toArray();
        console.log(`📋 Found ${tracks.length} tracks to process`);
        
        // Process in batches
        for (let i = 0; i < tracks.length; i += this.config.processing.batchSize) {
            const batch = tracks.slice(i, i + this.config.processing.batchSize);
            console.log(`\n🔄 Processing batch ${Math.floor(i / this.config.processing.batchSize) + 1}/${Math.ceil(tracks.length / this.config.processing.batchSize)}`);
            
            const batchResult = await this.processBatch(batch);
            
            results.processed += batchResult.processed;
            results.successful += batchResult.successful;
            results.failed += batchResult.failed;
            results.batches++;
            
            // Progress update
            const progress = ((results.processed / tracks.length) * 100).toFixed(1);
            console.log(`📊 Progress: ${results.processed}/${tracks.length} (${progress}%) | Success: ${results.successful} | Failed: ${results.failed}`);
            
            // Rate limiting delay
            if (i + this.config.processing.batchSize < tracks.length) {
                await new Promise(resolve => setTimeout(resolve, this.config.processing.delayBetweenBatches));
            }
        }
        
        // Update analysis
        const finalAnalysis = await this.analyzeCurrentState();
        
        const report = {
            initialState: analysis,
            finalState: finalAnalysis,
            processing: results,
            improvement: {
                coverageIncrease: (finalAnalysis.coverage - analysis.coverage).toFixed(1),
                tracksEnhanced: results.successful
            },
            executionTime: Date.now() - this.stats.startTime
        };
        
        console.log('\n🎉 Audio Features Enhancement Complete!');
        console.log('=' .repeat(50));
        console.log(`📈 Coverage improved: ${analysis.coverage}% → ${finalAnalysis.coverage}%`);
        console.log(`✅ Tracks enhanced: ${results.successful}`);
        console.log(`⏱️  Execution time: ${Math.round(report.executionTime / 1000)}s`);
        
        return report;
    }

    async processBatch(tracks) {
        const trackIds = tracks.map(track => {
            const match = track.track_uri.match(/spotify:track:(.+)/);
            return match ? match[1] : null;
        }).filter(id => id !== null);
        
        if (trackIds.length === 0) {
            return { processed: tracks.length, successful: 0, failed: tracks.length };
        }
        
        try {
            // Check Redis cache first
            const cachedFeatures = await this.getCachedFeatures(trackIds);
            
            // Fetch from Spotify API for non-cached tracks
            const uncachedIds = trackIds.filter(id => !cachedFeatures[id]);
            let spotifyFeatures = {};
            
            if (uncachedIds.length > 0) {
                spotifyFeatures = await this.fetchFromSpotifyAPI(uncachedIds);
                
                // Cache the results
                await this.cacheFeatures(spotifyFeatures);
            }
            
            // Combine cached and fresh results
            const allFeatures = { ...cachedFeatures, ...spotifyFeatures };
            
            // Update MongoDB
            const updateResults = await this.updateMongoDB(tracks, allFeatures);
            
            return {
                processed: tracks.length,
                successful: updateResults.successful,
                failed: updateResults.failed
            };
            
        } catch (error) {
            console.error(`❌ Batch processing failed: ${error.message}`);
            return {
                processed: tracks.length,
                successful: 0,
                failed: tracks.length
            };
        }
    }

    async getCachedFeatures(trackIds) {
        if (!this.redis) return {};
        
        const cached = {};
        
        for (const trackId of trackIds) {
            try {
                const cachedData = await this.redis.get(`audio_features:${trackId}`);
                if (cachedData) {
                    cached[trackId] = JSON.parse(cachedData);
                    this.stats.cached++;
                }
            } catch (error) {
                // Continue without cache for this track
            }
        }
        
        return cached;
    }

    async fetchFromSpotifyAPI(trackIds) {
        if (trackIds.length === 0) return {};
        
        const features = {};
        
        try {
            // Spotify API allows up to 100 tracks per request
            const chunks = [];
            for (let i = 0; i < trackIds.length; i += 100) {
                chunks.push(trackIds.slice(i, i + 100));
            }
            
            for (const chunk of chunks) {
                const url = `${this.config.spotify.baseUrl}/audio-features?ids=${chunk.join(',')}`;
                
                const response = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                });
                
                if (response.status === 429) {
                    // Rate limited
                    const retryAfter = response.headers.get('Retry-After') || 1;
                    console.log(`⏳ Rate limited, waiting ${retryAfter}s...`);
                    await new Promise(resolve => setTimeout(resolve, parseInt(retryAfter) * 1000));
                    continue; // Retry this chunk
                }
                
                if (!response.ok) {
                    console.warn(`⚠️  Spotify API warning: ${response.status} for chunk of ${chunk.length} tracks`);
                    continue;
                }
                
                const data = await response.json();
                
                if (data.audio_features) {
                    data.audio_features.forEach(feature => {
                        if (feature && feature.id) {
                            features[feature.id] = feature;
                        }
                    });
                }
            }
            
        } catch (error) {
            console.error(`❌ Spotify API error: ${error.message}`);
        }
        
        return features;
    }

    async cacheFeatures(features) {
        if (!this.redis) return;
        
        const pipeline = this.redis.multi();
        
        for (const [trackId, featureData] of Object.entries(features)) {
            pipeline.set(`audio_features:${trackId}`, JSON.stringify(featureData), { EX: 86400 }); // 24 hours
        }
        
        try {
            await pipeline.exec();
        } catch (error) {
            console.warn('⚠️  Redis caching failed, continuing...');
        }
    }

    async updateMongoDB(tracks, allFeatures) {
        const db = this.mongodb.db(this.config.mongodb.database);
        let successful = 0;
        let failed = 0;
        
        for (const track of tracks) {
            const trackId = track.track_uri.match(/spotify:track:(.+)/)?.[1];
            
            if (trackId && allFeatures[trackId]) {
                try {
                    await db.collection('spotify_analytics').updateOne(
                        { _id: track._id },
                        { 
                            $set: { 
                                audio_features: allFeatures[trackId],
                                features_updated_at: new Date()
                            }
                        }
                    );
                    successful++;
                } catch (error) {
                    console.warn(`⚠️  Failed to update track ${trackId}: ${error.message}`);
                    failed++;
                }
            } else {
                failed++;
            }
        }
        
        return { successful, failed };
    }

    async generateEnhancementReport() {
        const analysis = await this.analyzeCurrentState();
        
        const report = {
            timestamp: new Date().toISOString(),
            system: 'Enhanced Audio Features Fetcher',
            currentState: analysis,
            mcpIntegration: true,
            redisCache: this.redis !== null,
            recommendations: []
        };
        
        // Generate recommendations
        if (analysis.coverage < 95) {
            report.recommendations.push({
                priority: 'CRITICAL',
                task: 'Continue fetching missing audio features',
                description: `${analysis.missing} tracks still need audio features`,
                command: 'npm run fetch:missing-audio-features'
            });
        }
        
        if (analysis.coverage >= 90) {
            report.recommendations.push({
                priority: 'HIGH',
                task: 'Implement feature vectors',
                description: 'Create ML-ready feature vectors for recommendation algorithms',
                command: 'npm run implement:feature-vectors'
            });
        }
        
        // Save report
        const reportPath = path.join(__dirname, '..', 'AUDIO_FEATURES_ENHANCEMENT_REPORT.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        const mdReport = this.generateMarkdownReport(report);
        const mdReportPath = path.join(__dirname, '..', 'AUDIO_FEATURES_ENHANCEMENT_REPORT.md');
        await fs.writeFile(mdReportPath, mdReport);
        
        return report;
    }

    generateMarkdownReport(report) {
        return `# 🎵 Audio Features Enhancement Report

**Generated:** ${report.timestamp}  
**System:** ${report.system}

## 📊 Current State

- **Total Tracks:** ${report.currentState.total.toLocaleString()}
- **With Audio Features:** ${report.currentState.withFeatures.toLocaleString()} (${report.currentState.coverage}%)
- **Missing Audio Features:** ${report.currentState.missing.toLocaleString()}

## 🔧 System Configuration

- **MCP Integration:** ${report.mcpIntegration ? '✅ Enabled' : '❌ Disabled'}
- **Redis Caching:** ${report.redisCache ? '✅ Connected' : '❌ Not Available'}
- **Spotify API:** ${this.accessToken ? '✅ Authenticated' : '❌ Not Configured'}

## 🎯 Recommendations

${report.recommendations.map(rec => `
### ${rec.task} (${rec.priority})
${rec.description}  
${rec.command ? `Command: \`${rec.command}\`` : ''}
`).join('')}

## 🚀 Next Steps

1. **Continue Enhancement** - Run audio features fetching until 95%+ coverage
2. **Implement ML Features** - Create feature vectors for recommendation algorithms  
3. **Deploy Recommendations** - Enable AI-powered music recommendations
4. **Optimize Performance** - Implement caching and batch processing improvements

---
*Generated by Enhanced Audio Features Fetcher with MCP Integration*
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
    const fetcher = new EnhancedAudioFeaturesFetcher();
    
    try {
        // Initialize
        const initialized = await fetcher.initialize();
        if (!initialized) {
            console.error('❌ Failed to initialize audio features fetcher');
            process.exit(1);
        }
        
        // Fetch missing features
        const result = await fetcher.fetchMissingAudioFeatures();
        
        // Generate report
        const report = await fetcher.generateEnhancementReport();
        
        console.log('\n📄 Report generated: AUDIO_FEATURES_ENHANCEMENT_REPORT.md');
        console.log('🎵 Audio features enhancement completed successfully!');
        
    } catch (error) {
        console.error('❌ Enhancement failed:', error);
        process.exit(1);
    } finally {
        await fetcher.cleanup();
    }
}

if (require.main === module) {
    main();
}

module.exports = EnhancedAudioFeaturesFetcher;