#!/usr/bin/env node

/**
 * Enhanced MongoDB Validation and Optimization Script
 * 
 * This script validates the newly processed data and optimizes the database:
 * 1. Validates the enhanced data structure in spotify_analytics collection
 * 2. Tests data quality and completeness
 * 3. Performs database optimization
 * 4. Generates comprehensive analytics report
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');

class EnhancedMongoDBValidator {
    constructor() {
        this.connectionString = 'mongodb+srv://copilot:DapperMan77@cluster0.ofnyuy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
        this.databaseName = 'echotune';
        this.targetCollection = 'spotify_analytics';
        
        this.client = null;
        this.db = null;
        this.collection = null;
        
        this.validationResults = {
            connection: { status: 'pending', details: {} },
            database: { status: 'pending', details: {} },
            collection: { status: 'pending', details: {} },
            dataQuality: { status: 'pending', details: {} },
            indexes: { status: 'pending', details: {} },
            performance: { status: 'pending', details: {} },
            analytics: { status: 'pending', details: {} }
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
            test: '🧪'
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
            this.db = this.client.db(this.databaseName);
            this.collection = this.db.collection(this.targetCollection);
            
            this.validationResults.connection.status = 'passed';
            this.validationResults.connection.details = {
                connected_at: new Date(),
                database: this.databaseName,
                collection: this.targetCollection
            };
            
            this.log('Connected to MongoDB successfully', 'success');
            return true;
        } catch (error) {
            this.validationResults.connection.status = 'failed';
            this.validationResults.connection.details = { error: error.message };
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

    async validateDatabase() {
        try {
            this.log('Validating database structure...', 'test');
            
            // Get database stats
            const dbStats = await this.db.stats();
            
            // Get collection stats
            const collectionStats = await this.collection.stats();
            
            // List all collections
            const collections = await this.db.listCollections().toArray();
            
            this.validationResults.database.status = 'passed';
            this.validationResults.database.details = {
                name: this.databaseName,
                size_bytes: dbStats.dataSize,
                collections: collections.length,
                objects: dbStats.objects,
                target_collection_exists: collections.some(c => c.name === this.targetCollection),
                collection_stats: {
                    document_count: collectionStats.count,
                    size_bytes: collectionStats.size,
                    avg_document_size: collectionStats.avgObjSize,
                    storage_size: collectionStats.storageSize,
                    total_indexes: collectionStats.nindexes
                }
            };
            
            this.log(`Database validation passed: ${dbStats.objects} total objects, ${collections.length} collections`, 'success');
            this.log(`Target collection '${this.targetCollection}' has ${collectionStats.count} documents`, 'info');
            
        } catch (error) {
            this.validationResults.database.status = 'failed';
            this.validationResults.database.details = { error: error.message };
            this.log(`Database validation failed: ${error.message}`, 'error');
        }
    }

    async validateDataQuality() {
        try {
            this.log('Analyzing data quality...', 'test');
            
            const totalCount = await this.collection.countDocuments();
            
            // Sample documents for structure analysis
            const sampleDocs = await this.collection.find({}).limit(10).toArray();
            
            // Count documents with audio features
            const withAudioFeatures = await this.collection.countDocuments({
                has_audio_features: true,
                'audio_features.danceability': { $exists: true, $ne: null }
            });
            
            // Count documents with listening data
            const withListeningData = await this.collection.countDocuments({
                has_listening_data: true,
                'listening_stats.total_plays': { $gt: 0 }
            });
            
            // Analyze data quality scores
            const qualityDistribution = await this.collection.aggregate([
                {
                    $group: {
                        _id: {
                            $switch: {
                                branches: [
                                    { case: { $gte: ["$data_quality_score", 80] }, then: "high" },
                                    { case: { $gte: ["$data_quality_score", 50] }, then: "medium" },
                                ],
                                default: "low"
                            }
                        },
                        count: { $sum: 1 }
                    }
                }
            ]).toArray();
            
            // Top artists by track count
            const topArtists = await this.collection.aggregate([
                { $group: { _id: "$artist_name", track_count: { $sum: 1 } } },
                { $sort: { track_count: -1 } },
                { $limit: 10 }
            ]).toArray();
            
            // Popular tracks by play count
            const popularTracks = await this.collection.aggregate([
                { $match: { 'listening_stats.total_plays': { $gt: 0 } } },
                { $sort: { 'listening_stats.total_plays': -1 } },
                { $limit: 10 },
                { $project: { track_name: 1, artist_name: 1, 'listening_stats.total_plays': 1 } }
            ]).toArray();
            
            // Audio features analysis
            const audioFeaturesStats = await this.collection.aggregate([
                { $match: { has_audio_features: true } },
                {
                    $group: {
                        _id: null,
                        avg_danceability: { $avg: "$audio_features.danceability" },
                        avg_energy: { $avg: "$audio_features.energy" },
                        avg_valence: { $avg: "$audio_features.valence" },
                        avg_tempo: { $avg: "$audio_features.tempo" }
                    }
                }
            ]).toArray();
            
            this.validationResults.dataQuality.status = 'passed';
            this.validationResults.dataQuality.details = {
                total_documents: totalCount,
                with_audio_features: withAudioFeatures,
                with_listening_data: withListeningData,
                audio_features_coverage: withAudioFeatures / totalCount,
                listening_data_coverage: withListeningData / totalCount,
                quality_distribution: qualityDistribution.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                top_artists: topArtists,
                popular_tracks: popularTracks,
                audio_features_stats: audioFeaturesStats[0] || null,
                sample_document_structure: sampleDocs.length > 0 ? Object.keys(sampleDocs[0]) : []
            };
            
            this.log(`Data quality analysis complete: ${totalCount} documents analyzed`, 'success');
            this.log(`Audio features coverage: ${((withAudioFeatures / totalCount) * 100).toFixed(1)}%`, 'info');
            this.log(`Listening data coverage: ${((withListeningData / totalCount) * 100).toFixed(1)}%`, 'info');
            
        } catch (error) {
            this.validationResults.dataQuality.status = 'failed';
            this.validationResults.dataQuality.details = { error: error.message };
            this.log(`Data quality validation failed: ${error.message}`, 'error');
        }
    }

    async validateIndexes() {
        try {
            this.log('Validating database indexes...', 'test');
            
            const indexes = await this.collection.listIndexes().toArray();
            
            // Expected indexes
            const expectedIndexes = [
                'track_uri_idx',
                'track_id_idx',
                'artist_name_idx',
                'track_name_idx',
                'popularity_idx',
                'danceability_idx',
                'energy_idx',
                'valence_idx',
                'genres_idx',
                'quality_score_idx',
                'data_completeness_idx',
                'created_at_idx'
            ];
            
            const indexNames = indexes.map(idx => idx.name).filter(name => name !== '_id_');
            const missingIndexes = expectedIndexes.filter(name => !indexNames.includes(name));
            const extraIndexes = indexNames.filter(name => !expectedIndexes.includes(name));
            
            this.validationResults.indexes.status = missingIndexes.length === 0 ? 'passed' : 'warning';
            this.validationResults.indexes.details = {
                total_indexes: indexes.length,
                expected_indexes: expectedIndexes.length,
                found_indexes: indexNames,
                missing_indexes: missingIndexes,
                extra_indexes: extraIndexes,
                index_details: indexes.map(idx => ({
                    name: idx.name,
                    key: idx.key,
                    unique: idx.unique || false,
                    background: idx.background || false
                }))
            };
            
            this.log(`Index validation complete: ${indexes.length} indexes found`, 'success');
            if (missingIndexes.length > 0) {
                this.log(`Missing indexes: ${missingIndexes.join(', ')}`, 'warn');
            }
            
        } catch (error) {
            this.validationResults.indexes.status = 'failed';
            this.validationResults.indexes.details = { error: error.message };
            this.log(`Index validation failed: ${error.message}`, 'error');
        }
    }

    async performPerformanceTests() {
        try {
            this.log('Running performance tests...', 'test');
            
            const performanceTests = [];
            
            // Test 1: Simple find by track_id
            const start1 = Date.now();
            await this.collection.findOne({ track_id: { $exists: true } });
            performanceTests.push({
                test: 'find_by_track_id',
                duration_ms: Date.now() - start1
            });
            
            // Test 2: Complex aggregation for recommendations
            const start2 = Date.now();
            await this.collection.aggregate([
                { $match: { has_audio_features: true } },
                { $sample: { size: 10 } },
                { $project: { track_name: 1, artist_name: 1, audio_features: 1 } }
            ]).toArray();
            performanceTests.push({
                test: 'recommendation_aggregation',
                duration_ms: Date.now() - start2
            });
            
            // Test 3: Search by artist name
            const start3 = Date.now();
            await this.collection.find({ artist_name: { $regex: /.*/ } }).limit(100).toArray();
            performanceTests.push({
                test: 'artist_search',
                duration_ms: Date.now() - start3
            });
            
            // Test 4: Audio features range query
            const start4 = Date.now();
            await this.collection.find({
                'audio_features.danceability': { $gte: 0.7 },
                'audio_features.energy': { $gte: 0.8 }
            }).limit(50).toArray();
            performanceTests.push({
                test: 'audio_features_range',
                duration_ms: Date.now() - start4
            });
            
            const avgPerformance = performanceTests.reduce((sum, test) => sum + test.duration_ms, 0) / performanceTests.length;
            
            this.validationResults.performance.status = avgPerformance < 1000 ? 'passed' : 'warning';
            this.validationResults.performance.details = {
                tests: performanceTests,
                average_duration_ms: avgPerformance,
                total_tests: performanceTests.length,
                performance_grade: avgPerformance < 100 ? 'excellent' : avgPerformance < 500 ? 'good' : avgPerformance < 1000 ? 'acceptable' : 'needs_optimization'
            };
            
            this.log(`Performance tests complete: avg ${avgPerformance.toFixed(1)}ms`, 'success');
            
        } catch (error) {
            this.validationResults.performance.status = 'failed';
            this.validationResults.performance.details = { error: error.message };
            this.log(`Performance testing failed: ${error.message}`, 'error');
        }
    }

    async generateAnalytics() {
        try {
            this.log('Generating comprehensive analytics...', 'test');
            
            // Genre analysis
            const genreStats = await this.collection.aggregate([
                { $match: { genres: { $exists: true, $ne: [] } } },
                { $unwind: "$genres" },
                { $group: { _id: "$genres", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 20 }
            ]).toArray();
            
            // Temporal analysis (if timestamps available)
            const temporalStats = await this.collection.aggregate([
                { $match: { 'listening_stats.first_played': { $exists: true } } },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: "%Y-%m",
                                date: "$listening_stats.first_played"
                            }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]).toArray();
            
            // Audio feature distributions
            const audioFeatureRanges = await this.collection.aggregate([
                { $match: { has_audio_features: true } },
                {
                    $group: {
                        _id: null,
                        high_energy: { $sum: { $cond: [{ $gte: ["$audio_features.energy", 0.8] }, 1, 0] } },
                        medium_energy: { $sum: { $cond: [{ $and: [{ $gte: ["$audio_features.energy", 0.4] }, { $lt: ["$audio_features.energy", 0.8] }] }, 1, 0] } },
                        low_energy: { $sum: { $cond: [{ $lt: ["$audio_features.energy", 0.4] }, 1, 0] } },
                        high_danceability: { $sum: { $cond: [{ $gte: ["$audio_features.danceability", 0.7] }, 1, 0] } },
                        high_valence: { $sum: { $cond: [{ $gte: ["$audio_features.valence", 0.7] }, 1, 0] } }
                    }
                }
            ]).toArray();
            
            this.validationResults.analytics.status = 'passed';
            this.validationResults.analytics.details = {
                top_genres: genreStats,
                temporal_distribution: temporalStats,
                audio_feature_ranges: audioFeatureRanges[0] || {},
                total_unique_artists: await this.collection.distinct('artist_name').then(arr => arr.length),
                total_unique_albums: await this.collection.distinct('album_name').then(arr => arr.length),
                tracks_with_previews: await this.collection.countDocuments({ preview_url: { $ne: null } })
            };
            
            this.log('Analytics generation complete', 'success');
            
        } catch (error) {
            this.validationResults.analytics.status = 'failed';
            this.validationResults.analytics.details = { error: error.message };
            this.log(`Analytics generation failed: ${error.message}`, 'error');
        }
    }

    async optimizeDatabase() {
        try {
            this.log('Performing database optimization...', 'info');
            
            // Create additional indexes if missing
            const missingIndexes = this.validationResults.indexes.details.missing_indexes || [];
            
            for (const indexName of missingIndexes) {
                try {
                    let indexKey = {};
                    switch (indexName) {
                        case 'track_uri_idx':
                            indexKey = { track_uri: 1 };
                            break;
                        case 'track_id_idx':
                            indexKey = { track_id: 1 };
                            break;
                        case 'artist_name_idx':
                            indexKey = { artist_name: 1 };
                            break;
                        case 'track_name_idx':
                            indexKey = { track_name: 1 };
                            break;
                        case 'popularity_idx':
                            indexKey = { 'listening_stats.total_plays': -1 };
                            break;
                        case 'danceability_idx':
                            indexKey = { 'audio_features.danceability': 1 };
                            break;
                        case 'energy_idx':
                            indexKey = { 'audio_features.energy': 1 };
                            break;
                        case 'valence_idx':
                            indexKey = { 'audio_features.valence': 1 };
                            break;
                        case 'genres_idx':
                            indexKey = { genres: 1 };
                            break;
                        case 'quality_score_idx':
                            indexKey = { data_quality_score: -1 };
                            break;
                        case 'data_completeness_idx':
                            indexKey = { has_audio_features: 1, has_listening_data: 1 };
                            break;
                        case 'created_at_idx':
                            indexKey = { created_at: -1 };
                            break;
                    }
                    
                    if (Object.keys(indexKey).length > 0) {
                        await this.collection.createIndex(indexKey, { name: indexName, background: true });
                        this.log(`Created missing index: ${indexName}`, 'success');
                    }
                } catch (indexError) {
                    this.log(`Failed to create index ${indexName}: ${indexError.message}`, 'warn');
                }
            }
            
            // Update collection statistics
            await this.db.runCommand({ collStats: this.targetCollection });
            
            this.log('Database optimization completed', 'success');
            
        } catch (error) {
            this.log(`Database optimization failed: ${error.message}`, 'error');
        }
    }

    generateReport() {
        const report = {
            validation_timestamp: new Date().toISOString(),
            database_connection: this.connectionString,
            target_database: this.databaseName,
            target_collection: this.targetCollection,
            validation_results: this.validationResults,
            overall_status: this.getOverallStatus(),
            recommendations: this.generateRecommendations()
        };
        
        // Save JSON report
        const jsonReportPath = '/home/runner/work/Spotify-echo/Spotify-echo/ENHANCED_MONGODB_VALIDATION_REPORT.json';
        fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2));
        
        // Generate markdown report
        const markdownReport = this.generateMarkdownReport(report);
        const mdReportPath = '/home/runner/work/Spotify-echo/Spotify-echo/ENHANCED_MONGODB_VALIDATION_REPORT.md';
        fs.writeFileSync(mdReportPath, markdownReport);
        
        this.log(`Validation reports saved:`, 'info');
        this.log(`  JSON: ${jsonReportPath}`, 'info');
        this.log(`  Markdown: ${mdReportPath}`, 'info');
        
        return report;
    }

    getOverallStatus() {
        const statuses = Object.values(this.validationResults).map(result => result.status);
        if (statuses.includes('failed')) return 'failed';
        if (statuses.includes('warning')) return 'warning';
        if (statuses.includes('pending')) return 'pending';
        return 'passed';
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (this.validationResults.indexes.status === 'warning') {
            recommendations.push({
                priority: 'high',
                category: 'performance',
                issue: 'Missing database indexes',
                action: 'Create missing indexes to improve query performance'
            });
        }
        
        if (this.validationResults.performance.details.average_duration_ms > 500) {
            recommendations.push({
                priority: 'medium',
                category: 'performance',
                issue: 'Slow query performance',
                action: 'Consider query optimization and additional indexes'
            });
        }
        
        const audioFeaturesCoverage = this.validationResults.dataQuality.details.audio_features_coverage || 0;
        if (audioFeaturesCoverage < 0.8) {
            recommendations.push({
                priority: 'medium',
                category: 'data_quality',
                issue: 'Low audio features coverage',
                action: 'Improve audio features data collection'
            });
        }
        
        return recommendations;
    }

    generateMarkdownReport(report) {
        return `# Enhanced MongoDB Validation Report

**Generated:** ${report.validation_timestamp}
**Database:** ${report.target_database}
**Collection:** ${report.target_collection}
**Overall Status:** ${report.overall_status.toUpperCase()}

## Validation Results

### 🔗 Connection Status
- **Status:** ${report.validation_results.connection.status}
- **Database:** ${report.target_database}
- **Collection:** ${report.target_collection}

### 📊 Database Structure
- **Status:** ${report.validation_results.database.status}
- **Total Documents:** ${report.validation_results.database.details.collection_stats?.document_count || 'N/A'}
- **Database Size:** ${Math.round((report.validation_results.database.details.size_bytes || 0) / 1024 / 1024)}MB
- **Average Document Size:** ${report.validation_results.database.details.collection_stats?.avg_document_size || 'N/A'} bytes
- **Total Indexes:** ${report.validation_results.database.details.collection_stats?.total_indexes || 'N/A'}

### 🎵 Data Quality Analysis
- **Status:** ${report.validation_results.dataQuality.status}
- **Total Documents:** ${report.validation_results.dataQuality.details.total_documents}
- **With Audio Features:** ${report.validation_results.dataQuality.details.with_audio_features} (${Math.round((report.validation_results.dataQuality.details.audio_features_coverage || 0) * 100)}%)
- **With Listening Data:** ${report.validation_results.dataQuality.details.with_listening_data} (${Math.round((report.validation_results.dataQuality.details.listening_data_coverage || 0) * 100)}%)

#### Quality Distribution
${Object.entries(report.validation_results.dataQuality.details.quality_distribution || {}).map(([quality, count]) => `- **${quality.charAt(0).toUpperCase() + quality.slice(1)} Quality:** ${count} records`).join('\n')}

#### Top Artists by Track Count
${(report.validation_results.dataQuality.details.top_artists || []).slice(0, 5).map((artist, i) => `${i + 1}. **${artist._id}** - ${artist.track_count} tracks`).join('\n')}

### 🚀 Performance Metrics
- **Status:** ${report.validation_results.performance.status}
- **Average Query Time:** ${Math.round(report.validation_results.performance.details.average_duration_ms || 0)}ms
- **Performance Grade:** ${report.validation_results.performance.details.performance_grade}

### 📈 Analytics Summary
- **Top Genres:** ${(report.validation_results.analytics.details.top_genres || []).slice(0, 3).map(g => g._id).join(', ')}
- **Unique Artists:** ${report.validation_results.analytics.details.total_unique_artists}
- **Unique Albums:** ${report.validation_results.analytics.details.total_unique_albums}
- **Tracks with Previews:** ${report.validation_results.analytics.details.tracks_with_previews}

## Recommendations

${report.recommendations.map(rec => `### ${rec.priority.toUpperCase()} Priority - ${rec.category}
**Issue:** ${rec.issue}
**Action:** ${rec.action}`).join('\n\n')}

---
*Report generated by Enhanced MongoDB Validator for EchoTune AI*
`;
    }

    async validate() {
        try {
            this.log('Starting Enhanced MongoDB Validation...', 'success');
            
            const connected = await this.connect();
            if (!connected) {
                throw new Error('Failed to connect to MongoDB');
            }
            
            await this.validateDatabase();
            await this.validateDataQuality();
            await this.validateIndexes();
            await this.performPerformanceTests();
            await this.generateAnalytics();
            await this.optimizeDatabase();
            
            const report = this.generateReport();
            
            this.log('='.repeat(80), 'info');
            this.log('ENHANCED MONGODB VALIDATION COMPLETE', 'success');
            this.log('='.repeat(80), 'info');
            this.log(`Overall Status: ${report.overall_status.toUpperCase()}`, report.overall_status === 'passed' ? 'success' : 'warn');
            this.log(`Total Documents: ${report.validation_results.dataQuality.details.total_documents}`, 'info');
            this.log(`Audio Features Coverage: ${Math.round((report.validation_results.dataQuality.details.audio_features_coverage || 0) * 100)}%`, 'info');
            this.log(`Performance Grade: ${report.validation_results.performance.details.performance_grade}`, 'info');
            this.log('='.repeat(80), 'info');
            
            return report;
            
        } catch (error) {
            this.log(`Validation failed: ${error.message}`, 'error');
            throw error;
        } finally {
            await this.disconnect();
        }
    }
}

// Execute if run directly
if (require.main === module) {
    const validator = new EnhancedMongoDBValidator();
    validator.validate()
        .then((report) => {
            console.log('\nEnhanced MongoDB validation completed successfully!');
            process.exit(report.overall_status === 'passed' ? 0 : 1);
        })
        .catch((error) => {
            console.error('Enhanced MongoDB validation failed:', error);
            process.exit(1);
        });
}

module.exports = EnhancedMongoDBValidator;