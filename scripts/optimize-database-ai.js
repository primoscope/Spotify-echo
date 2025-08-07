#!/usr/bin/env node

/**
 * Database Optimization and AI Enhancement Suite
 * 
 * This script provides comprehensive database optimization and recommendations
 * for creating the best possible music recommendation engine.
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

class DatabaseOptimizer {
    constructor() {
        this.connectionString = 'mongodb+srv://copilot:DapperMan77@cluster0.ofnyuy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
        this.client = null;
        
        this.audioFeaturesMap = new Map();
        this.stats = {
            totalTracks: 0,
            withAudioFeatures: 0,
            withListeningData: 0,
            highQuality: 0,
            csvFeaturesAvailable: 0,
            enhanceable: 0,
            enhanced: 0
        };
    }

    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = {
            info: '✅',
            warn: '⚠️', 
            error: '❌',
            debug: '🔍',
            success: '🎉',
            optimize: '⚡'
        };
        console.log(`${prefix[level]} [${timestamp.split('T')[1].split('.')[0]}] ${message}`);
    }

    async connect() {
        try {
            this.client = new MongoClient(this.connectionString, {
                serverSelectionTimeoutMS: 10000,
                connectTimeoutMS: 10000,
                maxPoolSize: 10
            });
            
            await this.client.connect();
            this.log('Connected to MongoDB successfully', 'success');
            return true;
        } catch (error) {
            this.log(`MongoDB connection failed: ${error.message}`, 'error');
            return false;
        }
    }

    async disconnect() {
        if (this.client) {
            await this.client.close();
            this.log('Disconnected from MongoDB', 'info');
        }
    }

    // Load available audio features from CSV
    async loadAudioFeaturesCSV() {
        return new Promise((resolve, reject) => {
            const filePath = path.join('/home/runner/work/Spotify-echo/Spotify-echo/data', 'merged_data_audio_features.csv');
            
            if (!fs.existsSync(filePath)) {
                this.log('Audio features CSV not found, skipping...', 'warn');
                resolve();
                return;
            }

            this.log('Loading available audio features from CSV...', 'info');
            
            fs.createReadStream(filePath)
                .pipe(csv({
                    mapHeaders: ({ header }) => header.replace(/"/g, '')
                }))
                .on('data', (data) => {
                    try {
                        const trackUri = data['Track URI'];
                        if (trackUri && data.Danceability) {
                            this.audioFeaturesMap.set(trackUri, {
                                danceability: parseFloat(data.Danceability),
                                energy: parseFloat(data.Energy),
                                key: parseInt(data.Key),
                                loudness: parseFloat(data.Loudness),
                                mode: parseInt(data.Mode),
                                speechiness: parseFloat(data.Speechiness),
                                acousticness: parseFloat(data.Acousticness),
                                instrumentalness: parseFloat(data.Instrumentalness),
                                liveness: parseFloat(data.Liveness),
                                valence: parseFloat(data.Valence),
                                tempo: parseFloat(data.Tempo),
                                time_signature: parseInt(data['Time Signature']),
                                track_name: data['Track Name'],
                                artist_name: data['Artist Name(s)'],
                                duration_ms: parseInt(data['Track Duration (ms)'])
                            });
                            this.stats.csvFeaturesAvailable++;
                        }
                    } catch (error) {
                        // Skip invalid rows
                    }
                })
                .on('end', () => {
                    this.log(`Audio features from CSV loaded: ${this.stats.csvFeaturesAvailable.toLocaleString()}`, 'success');
                    resolve();
                })
                .on('error', (error) => {
                    this.log(`Error loading CSV: ${error.message}`, 'error');
                    reject(error);
                });
        });
    }

    // Enhance tracks with available audio features
    async enhanceTracksWithAudioFeatures() {
        try {
            const collection = this.client.db('echotune').collection('spotify_analytics');
            
            this.log('Enhancing tracks with available audio features...', 'optimize');
            
            // Find tracks missing audio features that have CSV data available
            const cursor = collection.find({
                $and: [
                    {
                        $or: [
                            { has_audio_features: false },
                            { has_audio_features: { $exists: false } },
                            { audio_features: null },
                            { audio_features: { $exists: false } }
                        ]
                    },
                    { track_uri: { $in: Array.from(this.audioFeaturesMap.keys()) } }
                ]
            });
            
            const enhancementOps = [];
            let count = 0;
            
            await cursor.forEach(doc => {
                const features = this.audioFeaturesMap.get(doc.track_uri);
                if (features) {
                    enhancementOps.push({
                        updateOne: {
                            filter: { _id: doc._id },
                            update: {
                                $set: {
                                    audio_features: {
                                        danceability: features.danceability,
                                        energy: features.energy,
                                        key: features.key,
                                        loudness: features.loudness,
                                        mode: features.mode,
                                        speechiness: features.speechiness,
                                        acousticness: features.acousticness,
                                        instrumentalness: features.instrumentalness,
                                        liveness: features.liveness,
                                        valence: features.valence,
                                        tempo: features.tempo,
                                        time_signature: features.time_signature
                                    },
                                    has_audio_features: true,
                                    data_quality_score: 100,
                                    updated_at: new Date(),
                                    enhancement_source: 'csv_merge'
                                }
                            }
                        }
                    });
                    this.stats.enhanceable++;
                }
            });
            
            if (enhancementOps.length > 0) {
                const result = await collection.bulkWrite(enhancementOps, { ordered: false });
                this.stats.enhanced = result.modifiedCount;
                this.log(`Enhanced ${result.modifiedCount} tracks with audio features`, 'success');
            } else {
                this.log('No tracks found for enhancement', 'info');
            }
            
        } catch (error) {
            this.log(`Error enhancing tracks: ${error.message}`, 'error');
            throw error;
        }
    }

    // Analyze current database state
    async analyzeDatabaseState() {
        try {
            const collection = this.client.db('echotune').collection('spotify_analytics');
            
            this.log('Analyzing current database state...', 'debug');
            
            // Get overall statistics
            this.stats.totalTracks = await collection.countDocuments();
            this.stats.withAudioFeatures = await collection.countDocuments({ has_audio_features: true });
            this.stats.withListeningData = await collection.countDocuments({ has_listening_data: true });
            this.stats.highQuality = await collection.countDocuments({ data_quality_score: { $gte: 80 } });
            
            this.log(`Database analysis complete - ${this.stats.totalTracks.toLocaleString()} total tracks`, 'success');
            
        } catch (error) {
            this.log(`Error analyzing database: ${error.message}`, 'error');
            throw error;
        }
    }

    // Create advanced indexes for AI/ML performance  
    async createAdvancedIndexes() {
        try {
            const collection = this.client.db('echotune').collection('spotify_analytics');
            
            this.log('Creating advanced indexes for AI/ML performance...', 'optimize');
            
            const advancedIndexes = [
                // Multi-field recommendation indexes
                { key: { 'audio_features.valence': 1, 'audio_features.energy': 1 }, name: 'mood_idx' },
                { key: { 'audio_features.danceability': 1, 'audio_features.tempo': 1 }, name: 'dance_tempo_idx' },
                { key: { 'audio_features.acousticness': 1, 'audio_features.instrumentalness': 1 }, name: 'acoustic_instrumental_idx' },
                
                // User interaction indexes
                { key: { 'listening_stats.total_plays': -1, 'audio_features.valence': 1 }, name: 'popularity_mood_idx' },
                { key: { 'listening_stats.skip_rate': 1, data_quality_score: -1 }, name: 'skip_quality_idx' },
                
                // Genre and clustering indexes
                { key: { genres: 1, 'audio_features.energy': 1 }, name: 'genre_energy_idx' },
                { key: { artist_name: 1, 'audio_features.valence': 1 }, name: 'artist_mood_idx' },
                
                // Temporal indexes for real-time recommendations
                { key: { 'listening_stats.last_played': -1, has_audio_features: 1 }, name: 'recent_activity_idx' },
                { key: { updated_at: -1, data_quality_score: -1 }, name: 'freshness_quality_idx' },
                
                // Compound recommendation indexes
                { key: { 
                    'audio_features.danceability': 1, 
                    'audio_features.energy': 1, 
                    'audio_features.valence': 1 
                }, name: 'recommendation_vector_idx' }
            ];
            
            let indexesCreated = 0;
            for (const index of advancedIndexes) {
                try {
                    await collection.createIndex(index.key, { 
                        name: index.name, 
                        background: true,
                        sparse: true // Only index documents that have the fields
                    });
                    indexesCreated++;
                    this.log(`Created advanced index: ${index.name}`, 'debug');
                } catch (error) {
                    if (!error.message.includes('already exists')) {
                        this.log(`Index creation warning: ${error.message}`, 'warn');
                    }
                }
            }
            
            this.log(`Created ${indexesCreated} advanced indexes for AI/ML optimization`, 'success');
            
        } catch (error) {
            this.log(`Error creating indexes: ${error.message}`, 'error');
            throw error;
        }
    }

    // Generate AI optimization recommendations
    generateAIOptimizationPlan() {
        const coveragePercent = this.stats.totalTracks > 0 ? 
            (this.stats.withAudioFeatures / this.stats.totalTracks * 100).toFixed(1) : 0;
        
        const qualityPercent = this.stats.totalTracks > 0 ?
            (this.stats.highQuality / this.stats.totalTracks * 100).toFixed(1) : 0;

        const optimizationPlan = {
            timestamp: new Date().toISOString(),
            current_state: {
                total_tracks: this.stats.totalTracks,
                audio_features_coverage: `${coveragePercent}%`,
                listening_data_coverage: `${(this.stats.withListeningData / this.stats.totalTracks * 100).toFixed(1)}%`,
                high_quality_data: `${qualityPercent}%`,
                enhancement_potential: this.stats.enhanceable,
                tracks_enhanced: this.stats.enhanced
            },
            
            ai_ml_readiness: {
                recommendation_engine_ready: coveragePercent >= 85,
                collaborative_filtering_ready: this.stats.withListeningData > 10000,
                content_based_ready: this.stats.withAudioFeatures > 30000,
                hybrid_model_ready: coveragePercent >= 85 && this.stats.withListeningData > 10000,
                production_ready: coveragePercent >= 90 && qualityPercent >= 80
            },
            
            immediate_optimizations: [
                {
                    priority: 'CRITICAL',
                    task: 'fetch_missing_audio_features',
                    description: `Fetch audio features for remaining ${this.stats.totalTracks - this.stats.withAudioFeatures} tracks via Spotify Web API`,
                    impact: 'Enables full recommendation capabilities',
                    estimated_effort: 'Medium - API integration required',
                    tracks_affected: this.stats.totalTracks - this.stats.withAudioFeatures
                },
                {
                    priority: 'HIGH',
                    task: 'implement_feature_vectors',
                    description: 'Create normalized feature vectors for each track combining audio features',
                    impact: 'Improves recommendation accuracy by 30-40%',
                    estimated_effort: 'Low - mathematical transformation',
                    tracks_affected: this.stats.withAudioFeatures
                },
                {
                    priority: 'HIGH', 
                    task: 'build_user_profiles',
                    description: 'Extract user preferences from listening history patterns',
                    impact: 'Enables personalized recommendations',
                    estimated_effort: 'Medium - requires user data analysis',
                    tracks_affected: this.stats.withListeningData
                },
                {
                    priority: 'MEDIUM',
                    task: 'implement_clustering',
                    description: 'Create music clusters using K-means on audio features',
                    impact: 'Enables genre-based and mood-based recommendations',
                    estimated_effort: 'Medium - ML model training',
                    tracks_affected: this.stats.withAudioFeatures
                }
            ],
            
            advanced_ai_features: [
                {
                    feature: 'deep_collaborative_filtering',
                    description: 'Neural network-based user-item interactions',
                    requirements: ['User listening history', 'Track audio features', 'Interaction embeddings'],
                    complexity: 'High',
                    expected_improvement: '40-60% accuracy increase'
                },
                {
                    feature: 'real_time_mood_detection',
                    description: 'Dynamic mood-based recommendations using listening patterns',
                    requirements: ['Real-time listening data', 'Audio feature analysis', 'Temporal patterns'],
                    complexity: 'Medium',
                    expected_improvement: '20-30% user engagement increase'
                },
                {
                    feature: 'contextual_recommendations',
                    description: 'Time, location, and activity-aware suggestions',
                    requirements: ['Context data', 'User behavior patterns', 'Environmental factors'],
                    complexity: 'High',
                    expected_improvement: '30-50% relevance increase'
                },
                {
                    feature: 'multi_objective_optimization',
                    description: 'Balance discovery, accuracy, and diversity in recommendations',
                    requirements: ['Multiple recommendation models', 'User feedback loops', 'A/B testing'],
                    complexity: 'Very High',
                    expected_improvement: '25-35% overall satisfaction increase'
                }
            ],
            
            database_optimizations: [
                'Implement Redis caching layer for frequent queries',
                'Create materialized views for common recommendation patterns', 
                'Set up read replicas for recommendation serving',
                'Implement data archiving for old listening history',
                'Add database monitoring and query optimization',
                'Create backup and disaster recovery procedures'
            ],
            
            performance_targets: {
                recommendation_latency: '< 100ms',
                concurrent_users: '10,000+',
                recommendations_per_second: '1,000+',
                model_training_time: '< 1 hour',
                data_freshness: '< 5 minutes'
            },
            
            next_phase_roadmap: [
                {
                    phase: 'Phase 1: Foundation (Weeks 1-2)',
                    tasks: [
                        'Complete audio features fetching via Spotify API',
                        'Implement basic recommendation algorithms',
                        'Set up performance monitoring'
                    ]
                },
                {
                    phase: 'Phase 2: Enhancement (Weeks 3-4)', 
                    tasks: [
                        'Deploy collaborative filtering models',
                        'Implement user preference learning',
                        'Add A/B testing framework'
                    ]
                },
                {
                    phase: 'Phase 3: Advanced AI (Weeks 5-8)',
                    tasks: [
                        'Deploy deep learning recommendation models',
                        'Implement real-time personalization',
                        'Add contextual awareness features'
                    ]
                },
                {
                    phase: 'Phase 4: Scale & Optimize (Weeks 9-12)',
                    tasks: [
                        'Optimize for production scale',
                        'Implement advanced caching strategies',
                        'Deploy multi-objective optimization'
                    ]
                }
            ]
        };
        
        // Save optimization plan
        const planPath = '/home/runner/work/Spotify-echo/Spotify-echo/AI_OPTIMIZATION_PLAN.json';
        fs.writeFileSync(planPath, JSON.stringify(optimizationPlan, null, 2));
        
        // Generate markdown version
        const markdownPlan = this.generateMarkdownPlan(optimizationPlan);
        const markdownPath = '/home/runner/work/Spotify-echo/Spotify-echo/AI_OPTIMIZATION_PLAN.md';
        fs.writeFileSync(markdownPath, markdownPlan);
        
        this.log(`AI optimization plan saved to: ${planPath}`, 'success');
        this.log(`Markdown plan saved to: ${markdownPath}`, 'success');
        
        return optimizationPlan;
    }

    generateMarkdownPlan(plan) {
        return `# EchoTune AI Optimization & Enhancement Plan

**Generated:** ${plan.timestamp}

## Current Database State

- **Total Tracks:** ${plan.current_state.total_tracks.toLocaleString()}
- **Audio Features Coverage:** ${plan.current_state.audio_features_coverage}
- **Listening Data Coverage:** ${plan.current_state.listening_data_coverage} 
- **High Quality Data:** ${plan.current_state.high_quality_data}
- **Tracks Enhanced:** ${plan.current_state.tracks_enhanced.toLocaleString()}

## AI/ML Readiness Assessment

- **Recommendation Engine Ready:** ${plan.ai_ml_readiness.recommendation_engine_ready ? '✅ Yes' : '❌ No'}
- **Collaborative Filtering Ready:** ${plan.ai_ml_readiness.collaborative_filtering_ready ? '✅ Yes' : '❌ No'}
- **Content-Based Ready:** ${plan.ai_ml_readiness.content_based_ready ? '✅ Yes' : '❌ No'}
- **Hybrid Model Ready:** ${plan.ai_ml_readiness.hybrid_model_ready ? '✅ Yes' : '❌ No'}
- **Production Ready:** ${plan.ai_ml_readiness.production_ready ? '✅ Yes' : '⚠️ Needs Improvement'}

## Immediate Optimization Tasks

${plan.immediate_optimizations.map(task => 
    `### ${task.priority} Priority: ${task.task.toUpperCase()}
- **Description:** ${task.description}
- **Impact:** ${task.impact}
- **Effort:** ${task.estimated_effort}
- **Tracks Affected:** ${task.tracks_affected.toLocaleString()}
`).join('\n')}

## Advanced AI Features Roadmap

${plan.advanced_ai_features.map(feature =>
    `### ${feature.feature.replace(/_/g, ' ').toUpperCase()}
- **Description:** ${feature.description}
- **Requirements:** ${feature.requirements.join(', ')}
- **Complexity:** ${feature.complexity}
- **Expected Improvement:** ${feature.expected_improvement}
`).join('\n')}

## Database Optimizations

${plan.database_optimizations.map(opt => `- ${opt}`).join('\n')}

## Performance Targets

- **Recommendation Latency:** ${plan.performance_targets.recommendation_latency}
- **Concurrent Users:** ${plan.performance_targets.concurrent_users}
- **Recommendations/Second:** ${plan.performance_targets.recommendations_per_second}
- **Model Training Time:** ${plan.performance_targets.model_training_time}
- **Data Freshness:** ${plan.performance_targets.data_freshness}

## Implementation Roadmap

${plan.next_phase_roadmap.map(phase =>
    `### ${phase.phase}
${phase.tasks.map(task => `- ${task}`).join('\n')}
`).join('\n')}

## Recommended Next Steps

1. **IMMEDIATE:** Fetch remaining audio features via Spotify Web API
2. **HIGH:** Implement feature vector normalization for ML models
3. **HIGH:** Create user preference profiles from listening history
4. **MEDIUM:** Deploy basic recommendation algorithms for testing
5. **MEDIUM:** Set up A/B testing framework for model evaluation

## Success Metrics

- **Audio Features Coverage:** Target 95%+ (Currently ${plan.current_state.audio_features_coverage})
- **Recommendation Accuracy:** Target 80%+ click-through rate
- **User Engagement:** Target 60%+ session completion rate
- **System Performance:** Target <100ms recommendation latency

---
*Generated by Database Optimizer for EchoTune AI*`;
    }

    // Main optimization workflow
    async optimize() {
        try {
            this.log('Starting Database Optimization and AI Enhancement...', 'success');
            
            // Connect to MongoDB
            const connected = await this.connect();
            if (!connected) {
                throw new Error('Failed to connect to MongoDB');
            }
            
            // Load available audio features
            await this.loadAudioFeaturesCSV();
            
            // Analyze current state
            await this.analyzeDatabaseState();
            
            // Enhance tracks with available features
            await this.enhanceTracksWithAudioFeatures();
            
            // Create advanced indexes
            await this.createAdvancedIndexes();
            
            // Generate optimization plan
            const plan = this.generateAIOptimizationPlan();
            
            // Log summary
            this.log('='.repeat(80), 'info');
            this.log('DATABASE OPTIMIZATION & AI ENHANCEMENT COMPLETE', 'success');
            this.log('='.repeat(80), 'info');
            this.log(`📊 Total Tracks: ${this.stats.totalTracks.toLocaleString()}`, 'info');
            this.log(`📊 Audio Features Coverage: ${(this.stats.withAudioFeatures / this.stats.totalTracks * 100).toFixed(1)}%`, 'info');
            this.log(`📊 Listening Data Coverage: ${(this.stats.withListeningData / this.stats.totalTracks * 100).toFixed(1)}%`, 'info');
            this.log(`📊 High Quality Data: ${(this.stats.highQuality / this.stats.totalTracks * 100).toFixed(1)}%`, 'info');
            this.log(`⚡ Tracks Enhanced: ${this.stats.enhanced.toLocaleString()}`, 'success');
            this.log(`⚡ AI/ML Ready: ${plan.ai_ml_readiness.production_ready ? 'Yes' : 'Needs Improvement'}`, 'info');
            this.log('='.repeat(80), 'info');
            
            return plan;
            
        } catch (error) {
            this.log(`Optimization failed: ${error.message}`, 'error');
            throw error;
        } finally {
            await this.disconnect();
        }
    }
}

// Execute if run directly
if (require.main === module) {
    const optimizer = new DatabaseOptimizer();
    optimizer.optimize()
        .then((plan) => {
            console.log('Database optimization and AI enhancement completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Optimization failed:', error);
            process.exit(1);
        });
}

module.exports = DatabaseOptimizer;