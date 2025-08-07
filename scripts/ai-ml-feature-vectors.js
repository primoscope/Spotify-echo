#!/usr/bin/env node

/**
 * AI/ML Feature Vectors Implementation
 * Creates normalized feature vectors from audio features for machine learning models
 * Integrates with MCP server for automation and validation
 */

const { MongoClient } = require('mongodb');
const fs = require('fs').promises;
const path = require('path');

class AIFeatureVectorsImplementation {
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
                batchSize: 1000,
                features: [
                    'acousticness',
                    'danceability', 
                    'energy',
                    'instrumentalness',
                    'liveness',
                    'loudness',
                    'speechiness',
                    'valence',
                    'tempo'
                ]
            }
        };
        
        this.mongodb = null;
        this.redis = null;
        this.stats = {
            processed: 0,
            successful: 0,
            failed: 0,
            startTime: Date.now()
        };
        
        // Normalization ranges for audio features
        this.normalizationRanges = {
            acousticness: { min: 0, max: 1 },
            danceability: { min: 0, max: 1 },
            energy: { min: 0, max: 1 },
            instrumentalness: { min: 0, max: 1 },
            liveness: { min: 0, max: 1 },
            loudness: { min: -60, max: 0 },  // dB range
            speechiness: { min: 0, max: 1 },
            valence: { min: 0, max: 1 },
            tempo: { min: 50, max: 200 }  // BPM range
        };
    }

    async initialize() {
        console.log('🧠 AI/ML Feature Vectors Implementation');
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
            console.log('✅ Redis Cloud connected for ML caching');
        } catch (error) {
            console.log('⚠️  Redis not available, continuing without caching');
            this.redis = null;
        }
    }

    async analyzeAudioFeatures() {
        console.log('\n📊 Analyzing audio features for ML readiness...');
        
        const db = this.mongodb.db(this.config.mongodb.database);
        
        // Get counts
        const total = await db.collection('spotify_analytics').countDocuments();
        const withFeatures = await db.collection('spotify_analytics').countDocuments({
            'audio_features': { $exists: true, $ne: null }
        });
        const existingVectors = await db.collection('feature_vectors').countDocuments();
        
        // Sample audio features to understand data distribution
        const sampleFeatures = await db.collection('spotify_analytics')
            .aggregate([
                { $match: { 'audio_features': { $exists: true, $ne: null } } },
                { $sample: { size: 1000 } },
                { $project: { 'audio_features': 1 } }
            ]).toArray();
        
        const featureStats = this.calculateFeatureStatistics(sampleFeatures);
        
        const analysis = {
            total,
            withFeatures,
            existingVectors,
            readyForML: withFeatures > 1000,
            coverage: total > 0 ? ((withFeatures / total) * 100).toFixed(1) : 0,
            featureStats,
            mlReadiness: this.assessMLReadiness(withFeatures, featureStats)
        };
        
        console.log(`📈 Total tracks: ${total.toLocaleString()}`);
        console.log(`🎵 With audio features: ${withFeatures.toLocaleString()} (${analysis.coverage}%)`);
        console.log(`🧠 Existing feature vectors: ${existingVectors.toLocaleString()}`);
        console.log(`🚀 ML Readiness: ${analysis.mlReadiness.score}/100`);
        
        return analysis;
    }

    calculateFeatureStatistics(sampleFeatures) {
        const stats = {};
        
        for (const featureName of this.config.processing.features) {
            const values = sampleFeatures
                .map(track => track.audio_features?.[featureName])
                .filter(val => val !== null && val !== undefined);
            
            if (values.length > 0) {
                stats[featureName] = {
                    count: values.length,
                    min: Math.min(...values),
                    max: Math.max(...values),
                    avg: values.reduce((sum, val) => sum + val, 0) / values.length,
                    std: this.calculateStandardDeviation(values)
                };
            }
        }
        
        return stats;
    }

    calculateStandardDeviation(values) {
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
        const squareDiffs = values.map(val => Math.pow(val - avg, 2));
        const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / values.length;
        return Math.sqrt(avgSquareDiff);
    }

    assessMLReadiness(trackCount, featureStats) {
        let score = 0;
        const criteria = {
            'Sufficient Data': trackCount >= 10000 ? 25 : Math.floor((trackCount / 10000) * 25),
            'Feature Completeness': Object.keys(featureStats).length >= 8 ? 25 : Math.floor((Object.keys(featureStats).length / 9) * 25),
            'Data Quality': this.assessDataQuality(featureStats),
            'Distribution Health': this.assessDistributionHealth(featureStats)
        };
        
        score = Object.values(criteria).reduce((sum, val) => sum + val, 0);
        
        return {
            score: Math.min(100, score),
            criteria,
            recommendation: score >= 80 ? 'READY_FOR_PRODUCTION' : score >= 60 ? 'READY_FOR_TESTING' : 'NEEDS_IMPROVEMENT'
        };
    }

    assessDataQuality(featureStats) {
        let qualityScore = 0;
        const maxScore = 25;
        
        const validFeatures = Object.keys(featureStats).length;
        const expectedFeatures = this.config.processing.features.length;
        
        qualityScore = (validFeatures / expectedFeatures) * maxScore;
        
        return Math.floor(qualityScore);
    }

    assessDistributionHealth(featureStats) {
        let healthScore = 0;
        const maxScore = 25;
        
        // Check if features have reasonable variance
        let healthyFeatures = 0;
        
        Object.entries(featureStats).forEach(([feature, stats]) => {
            if (stats.std > 0.01) { // Minimum variance threshold
                healthyFeatures++;
            }
        });
        
        healthScore = (healthyFeatures / Object.keys(featureStats).length) * maxScore;
        
        return Math.floor(healthScore);
    }

    async setupFeatureVectorsCollection() {
        console.log('\n🗄️  Setting up feature vectors collection...');
        
        const db = this.mongodb.db(this.config.mongodb.database);
        
        try {
            // Create collection with validation schema
            await db.createCollection('feature_vectors', {
                validator: {
                    $jsonSchema: {
                        bsonType: 'object',
                        required: ['track_id', 'track_uri', 'feature_vector', 'ml_ready'],
                        properties: {
                            track_id: { bsonType: 'string' },
                            track_uri: { bsonType: 'string' },
                            feature_vector: { bsonType: 'array' },
                            feature_names: { bsonType: 'array' },
                            normalization_method: { bsonType: 'string' },
                            ml_ready: { bsonType: 'bool' },
                            created_at: { bsonType: 'date' },
                            updated_at: { bsonType: 'date' }
                        }
                    }
                }
            });
            console.log('✅ Feature vectors collection created with schema validation');
        } catch (error) {
            if (error.code === 48) {
                console.log('✅ Feature vectors collection already exists');
            } else {
                throw error;
            }
        }
        
        // Create indexes for optimal query performance
        const indexes = [
            { track_uri: 1 },
            { track_id: 1 },
            { ml_ready: 1 },
            { created_at: -1 },
            { 'feature_vector': '2dsphere' }  // For similarity searches
        ];
        
        for (const index of indexes) {
            try {
                await db.collection('feature_vectors').createIndex(index);
            } catch (error) {
                // Index might already exist
            }
        }
        
        console.log('✅ Feature vectors indexes created');
        return true;
    }

    async generateFeatureVectors() {
        const analysis = await this.analyzeAudioFeatures();
        
        if (analysis.withFeatures < 100) {
            throw new Error('Not enough tracks with audio features. Need at least 100 tracks.');
        }
        
        console.log(`\n🧠 Generating feature vectors for ${analysis.withFeatures} tracks...`);
        
        // Setup collection
        await this.setupFeatureVectorsCollection();
        
        const db = this.mongodb.db(this.config.mongodb.database);
        
        // Process in batches
        const cursor = db.collection('spotify_analytics').find({
            'audio_features': { $exists: true, $ne: null }
        });
        
        const results = {
            processed: 0,
            successful: 0,
            failed: 0,
            batches: 0
        };
        
        let batch = [];
        
        for await (const track of cursor) {
            batch.push(track);
            
            if (batch.length >= this.config.processing.batchSize) {
                const batchResult = await this.processBatch(batch);
                
                results.processed += batchResult.processed;
                results.successful += batchResult.successful;
                results.failed += batchResult.failed;
                results.batches++;
                
                // Progress update
                console.log(`📊 Processed: ${results.processed} | Success: ${results.successful} | Failed: ${results.failed}`);
                
                batch = [];
            }
        }
        
        // Process remaining batch
        if (batch.length > 0) {
            const batchResult = await this.processBatch(batch);
            results.processed += batchResult.processed;
            results.successful += batchResult.successful;
            results.failed += batchResult.failed;
            results.batches++;
        }
        
        // Cache ML readiness status
        if (this.redis) {
            await this.redis.set('ml:feature_vectors:ready', JSON.stringify({
                count: results.successful,
                timestamp: Date.now(),
                mlReady: results.successful > 1000
            }), { EX: 3600 });
        }
        
        console.log('\n🎉 Feature vectors generation completed!');
        console.log('=' .repeat(50));
        console.log(`✅ Successful: ${results.successful}`);
        console.log(`❌ Failed: ${results.failed}`);
        console.log(`📊 Batches processed: ${results.batches}`);
        
        return results;
    }

    async processBatch(tracks) {
        const db = this.mongodb.db(this.config.mongodb.database);
        let successful = 0;
        let failed = 0;
        
        const operations = tracks.map(track => {
            try {
                const featureVector = this.createFeatureVector(track.audio_features);
                
                if (!featureVector) {
                    failed++;
                    return null;
                }
                
                successful++;
                
                return {
                    updateOne: {
                        filter: { track_uri: track.track_uri },
                        update: {
                            $set: {
                                track_id: track.track_id,
                                track_uri: track.track_uri,
                                track_name: track.track_name,
                                artist_name: track.artist_name,
                                feature_vector: featureVector.vector,
                                feature_names: featureVector.names,
                                normalization_method: 'min_max_scaling',
                                raw_features: track.audio_features,
                                ml_ready: true,
                                created_at: new Date(),
                                updated_at: new Date()
                            }
                        },
                        upsert: true
                    }
                };
            } catch (error) {
                failed++;
                return null;
            }
        }).filter(op => op !== null);
        
        if (operations.length > 0) {
            try {
                await db.collection('feature_vectors').bulkWrite(operations, { ordered: false });
            } catch (error) {
                console.error('❌ Batch write failed:', error.message);
                failed += successful;
                successful = 0;
            }
        }
        
        return {
            processed: tracks.length,
            successful,
            failed
        };
    }

    createFeatureVector(audioFeatures) {
        if (!audioFeatures) return null;
        
        const vector = [];
        const names = [];
        
        for (const featureName of this.config.processing.features) {
            const value = audioFeatures[featureName];
            
            if (value !== null && value !== undefined) {
                // Normalize the value
                const normalizedValue = this.normalizeFeature(featureName, value);
                vector.push(normalizedValue);
                names.push(featureName);
            }
        }
        
        // Ensure we have enough features for ML
        if (vector.length < 6) {
            return null;
        }
        
        return {
            vector,
            names
        };
    }

    normalizeFeature(featureName, value) {
        const range = this.normalizationRanges[featureName];
        
        if (!range) {
            return value; // No normalization info available
        }
        
        // Min-max normalization to [0, 1]
        const normalized = (value - range.min) / (range.max - range.min);
        
        // Clamp to [0, 1]
        return Math.max(0, Math.min(1, normalized));
    }

    async generateImplementationReport() {
        const analysis = await this.analyzeAudioFeatures();
        
        const db = this.mongodb.db(this.config.mongodb.database);
        const vectorsCount = await db.collection('feature_vectors').countDocuments({ ml_ready: true });
        
        const report = {
            timestamp: new Date().toISOString(),
            system: 'AI/ML Feature Vectors Implementation',
            currentState: analysis,
            featureVectors: {
                generated: vectorsCount,
                mlReady: vectorsCount > 1000,
                readinessScore: Math.min(100, (vectorsCount / 10000) * 100)
            },
            recommendations: [],
            nextSteps: []
        };
        
        // Generate recommendations
        if (analysis.coverage >= 90 && vectorsCount > 1000) {
            report.recommendations.push({
                priority: 'HIGH',
                task: 'Deploy Collaborative Filtering',
                description: 'System ready for collaborative filtering recommendation algorithms',
                readyness: 'PRODUCTION_READY'
            });
            
            report.recommendations.push({
                priority: 'HIGH',
                task: 'Implement Content-Based Filtering', 
                description: 'Feature vectors ready for content-based recommendations',
                readyness: 'PRODUCTION_READY'
            });
        }
        
        if (vectorsCount > 5000) {
            report.recommendations.push({
                priority: 'MEDIUM',
                task: 'Deploy Deep Learning Models',
                description: 'Sufficient data for neural network recommendation models',
                readyness: 'READY_FOR_TESTING'
            });
        }
        
        // Next steps
        report.nextSteps = [
            {
                task: 'Create User Preference Profiles',
                description: 'Generate user behavior profiles from listening history',
                priority: 'HIGH',
                command: 'npm run generate:user-profiles'
            },
            {
                task: 'Implement Similarity Algorithms',
                description: 'Create track-to-track similarity calculations',
                priority: 'HIGH'
            },
            {
                task: 'Deploy Recommendation API',
                description: 'Create API endpoints for real-time recommendations',
                priority: 'MEDIUM'
            }
        ];
        
        // Save report
        const reportPath = path.join(__dirname, '..', 'AI_ML_FEATURE_VECTORS_REPORT.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        const mdReport = this.generateMarkdownReport(report);
        const mdReportPath = path.join(__dirname, '..', 'AI_ML_FEATURE_VECTORS_REPORT.md');
        await fs.writeFile(mdReportPath, mdReport);
        
        return report;
    }

    generateMarkdownReport(report) {
        return `# 🧠 AI/ML Feature Vectors Implementation Report

**Generated:** ${report.timestamp}  
**System:** ${report.system}

## 📊 Current State

### Audio Features Analysis
- **Total Tracks:** ${report.currentState.total.toLocaleString()}
- **With Audio Features:** ${report.currentState.withFeatures.toLocaleString()} (${report.currentState.coverage}%)
- **ML Readiness Score:** ${report.currentState.mlReadiness.score}/100

### Feature Vectors Status  
- **Generated Vectors:** ${report.featureVectors.generated.toLocaleString()}
- **ML Ready:** ${report.featureVectors.mlReady ? '✅ YES' : '❌ NO'}
- **Readiness Score:** ${report.featureVectors.readinessScore.toFixed(1)}%

## 🔧 Feature Configuration

- **Features Used:** ${this.config.processing.features.join(', ')}
- **Normalization:** Min-Max scaling to [0, 1]
- **Batch Size:** ${this.config.processing.batchSize}
- **Redis Caching:** ${this.redis ? '✅ Connected' : '❌ Not Available'}

## 🎯 ML Readiness Assessment

${Object.entries(report.currentState.mlReadiness.criteria).map(([criteria, score]) => `
- **${criteria}:** ${score}/25 ${score >= 20 ? '✅' : score >= 15 ? '⚠️' : '❌'}
`).join('')}

**Overall Recommendation:** ${report.currentState.mlReadiness.recommendation}

## 🚀 Implementation Recommendations

${report.recommendations.map(rec => `
### ${rec.task} (${rec.priority})
${rec.description}  
**Status:** ${rec.readyness}
`).join('')}

## 📋 Next Steps

${report.nextSteps.map((step, index) => `
${index + 1}. **${step.task}** (${step.priority})
   ${step.description}
   ${step.command ? `Command: \`${step.command}\`` : ''}
`).join('')}

## 📈 Performance Metrics

- **Processing Speed:** ${this.config.processing.batchSize} tracks/batch
- **Vector Dimensions:** ${this.config.processing.features.length} features
- **Data Quality:** ${report.currentState.mlReadiness.score >= 80 ? 'Production Ready' : 'Needs Improvement'}

---
*Generated by AI/ML Feature Vectors Implementation System*
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
    const implementation = new AIFeatureVectorsImplementation();
    
    try {
        console.log('🧠 AI/ML Feature Vectors Implementation');
        console.log('=' .repeat(60));
        
        // Initialize
        const initialized = await implementation.initialize();
        if (!initialized) {
            console.error('❌ Failed to initialize feature vectors implementation');
            process.exit(1);
        }
        
        // Generate feature vectors
        const result = await implementation.generateFeatureVectors();
        
        // Generate report
        const report = await implementation.generateImplementationReport();
        
        console.log('\n📄 Report generated: AI_ML_FEATURE_VECTORS_REPORT.md');
        console.log('🧠 Feature vectors implementation completed successfully!');
        
        if (report.featureVectors.mlReady) {
            console.log('\n🎉 SYSTEM IS NOW ML-READY!');
            console.log('✅ You can now deploy recommendation algorithms');
        }
        
    } catch (error) {
        console.error('❌ Implementation failed:', error);
        process.exit(1);
    } finally {
        await implementation.cleanup();
    }
}

if (require.main === module) {
    main();
}

module.exports = AIFeatureVectorsImplementation;