#!/usr/bin/env node

/**
 * Database Comparison and Audio Features Analysis Script
 * 
 * This script compares all available databases and collections to determine:
 * 1. Which database/collection contains the most complete data
 * 2. Audio features coverage analysis
 * 3. Missing audio features identification
 * 4. Recommendations for optimal database structure
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');

class DatabaseComparator {
    constructor() {
        this.connectionString = 'mongodb+srv://copilot:DapperMan77@cluster0.ofnyuy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
        this.client = null;
        
        this.comparisonResults = {
            timestamp: new Date().toISOString(),
            connection_status: 'pending',
            databases: {},
            audio_features_analysis: {},
            recommendations: [],
            optimal_database: null
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
                serverSelectionTimeoutMS: 15000,
                connectTimeoutMS: 15000,
                maxPoolSize: 10
            });
            
            await this.client.connect();
            this.comparisonResults.connection_status = 'success';
            this.log('Connected to MongoDB Atlas successfully', 'success');
            return true;
        } catch (error) {
            this.comparisonResults.connection_status = 'failed';
            this.log(`MongoDB connection failed: ${error.message}`, 'error');
            return false;
        }
    }

    async listAllDatabases() {
        try {
            this.log('Discovering all available databases...', 'test');
            
            const adminDb = this.client.db('admin');
            const databasesList = await adminDb.admin().listDatabases();
            
            for (const dbInfo of databasesList.databases) {
                if (['admin', 'local', 'config'].includes(dbInfo.name)) {
                    continue; // Skip system databases
                }
                
                this.log(`Analyzing database: ${dbInfo.name}`, 'info');
                
                const db = this.client.db(dbInfo.name);
                const collections = await db.listCollections().toArray();
                
                this.comparisonResults.databases[dbInfo.name] = {
                    size_bytes: dbInfo.sizeOnDisk,
                    collections: {}
                };

                // Analyze each collection
                for (const collection of collections) {
                    try {
                        const collectionObj = db.collection(collection.name);
                        const documentCount = await collectionObj.countDocuments();
                        const sampleDoc = documentCount > 0 ? await collectionObj.findOne({}) : null;
                        
                        // Get collection stats
                        let collectionStats = null;
                        try {
                            collectionStats = await db.command({ collStats: collection.name });
                        } catch (e) {
                            // Collection might be empty or inaccessible
                        }

                        this.comparisonResults.databases[dbInfo.name].collections[collection.name] = {
                            document_count: documentCount,
                            avg_document_size: collectionStats?.avgObjSize || 0,
                            storage_size: collectionStats?.storageSize || 0,
                            indexes: collectionStats?.nindexes || 0,
                            sample_structure: sampleDoc ? this.analyzeDocumentStructure(sampleDoc) : null
                        };

                        this.log(`  Collection '${collection.name}': ${documentCount} documents`, 'debug');

                    } catch (error) {
                        this.log(`    Error analyzing collection '${collection.name}': ${error.message}`, 'warn');
                        this.comparisonResults.databases[dbInfo.name].collections[collection.name] = {
                            error: error.message,
                            document_count: 0
                        };
                    }
                }
            }
            
            this.log(`Discovered ${Object.keys(this.comparisonResults.databases).length} databases`, 'success');
            
        } catch (error) {
            this.log(`Database discovery failed: ${error.message}`, 'error');
            throw error;
        }
    }

    analyzeDocumentStructure(document) {
        const structure = {
            total_fields: 0,
            has_audio_features: false,
            has_listening_data: false,
            has_track_info: false,
            spotify_uri_present: false,
            field_types: {}
        };

        const fields = Object.keys(document);
        structure.total_fields = fields.length;
        structure.field_types = {};

        // Analyze key fields
        fields.forEach(field => {
            structure.field_types[field] = typeof document[field];
            
            // Check for audio features
            if (field === 'audio_features' || field.includes('danceability') || field.includes('energy')) {
                structure.has_audio_features = true;
            }
            
            // Check for listening data
            if (field.includes('played') || field.includes('listening') || field === 'ms_played') {
                structure.has_listening_data = true;
            }
            
            // Check for track info
            if (field.includes('track') || field.includes('artist') || field.includes('album')) {
                structure.has_track_info = true;
            }
            
            // Check for Spotify URI
            if (field.includes('uri') || field.includes('spotify:track')) {
                structure.spotify_uri_present = true;
            }
        });

        return structure;
    }

    async performDetailedAudioFeaturesAnalysis() {
        try {
            this.log('Performing detailed audio features analysis...', 'test');
            
            // Focus on the most promising databases/collections
            for (const [dbName, dbInfo] of Object.entries(this.comparisonResults.databases)) {
                for (const [collectionName, collectionInfo] of Object.entries(dbInfo.collections)) {
                    if (collectionInfo.document_count === 0 || collectionInfo.error) {
                        continue;
                    }

                    this.log(`Analyzing audio features in ${dbName}.${collectionName}...`, 'debug');
                    
                    const db = this.client.db(dbName);
                    const collection = db.collection(collectionName);
                    
                    try {
                        // Count tracks with complete audio features
                        const withAudioFeatures = await collection.countDocuments({
                            $or: [
                                { 'audio_features.danceability': { $exists: true, $ne: null } },
                                { danceability: { $exists: true, $ne: null } },
                                { has_audio_features: true }
                            ]
                        });

                        // Count tracks with partial audio features
                        const withPartialAudioFeatures = await collection.countDocuments({
                            $or: [
                                { 'audio_features': { $exists: true } },
                                { danceability: { $exists: true } },
                                { energy: { $exists: true } },
                                { valence: { $exists: true } }
                            ]
                        });

                        // Count tracks with track URIs (for matching potential)
                        const withTrackURIs = await collection.countDocuments({
                            $or: [
                                { 'track_uri': { $exists: true, $ne: null } },
                                { 'spotify_track_uri': { $exists: true, $ne: null } },
                                { 'uri': { $exists: true, $ne: null } }
                            ]
                        });

                        // Sample some documents to analyze structure
                        const sampleDocs = await collection.find({}).limit(5).toArray();
                        
                        // Analyze missing audio features
                        const missingAudioFeatures = collectionInfo.document_count - withAudioFeatures;
                        const audioFeaturesCoverage = withAudioFeatures / collectionInfo.document_count;

                        this.comparisonResults.audio_features_analysis[`${dbName}.${collectionName}`] = {
                            total_tracks: collectionInfo.document_count,
                            with_complete_audio_features: withAudioFeatures,
                            with_partial_audio_features: withPartialAudioFeatures,
                            with_track_uris: withTrackURIs,
                            missing_audio_features: missingAudioFeatures,
                            audio_features_coverage_percent: (audioFeaturesCoverage * 100).toFixed(1),
                            sample_structures: sampleDocs.map(doc => this.analyzeDocumentStructure(doc))
                        };

                        this.log(`  Audio features coverage: ${(audioFeaturesCoverage * 100).toFixed(1)}% (${withAudioFeatures}/${collectionInfo.document_count})`, 'info');
                        
                        if (missingAudioFeatures > 0) {
                            this.log(`  Missing audio features: ${missingAudioFeatures} tracks`, 'warn');
                        }

                    } catch (error) {
                        this.log(`Audio features analysis failed for ${dbName}.${collectionName}: ${error.message}`, 'warn');
                    }
                }
            }

        } catch (error) {
            this.log(`Audio features analysis failed: ${error.message}`, 'error');
            throw error;
        }
    }

    determineOptimalDatabase() {
        this.log('Determining optimal database configuration...', 'test');
        
        let bestOption = null;
        let bestScore = 0;
        
        // Scoring criteria:
        // - Document count (40%)
        // - Audio features coverage (30%) 
        // - Data structure quality (20%)
        // - Index optimization (10%)
        
        for (const [dbName, dbInfo] of Object.entries(this.comparisonResults.databases)) {
            for (const [collectionName, collectionInfo] of Object.entries(dbInfo.collections)) {
                if (collectionInfo.document_count === 0 || collectionInfo.error) {
                    continue;
                }
                
                const fullName = `${dbName}.${collectionName}`;
                const audioAnalysis = this.comparisonResults.audio_features_analysis[fullName];
                
                if (!audioAnalysis) continue;
                
                // Calculate score
                const documentCountScore = Math.min(collectionInfo.document_count / 50000, 1) * 40; // Max 40 points
                const audioFeaturesScore = (audioAnalysis.with_complete_audio_features / audioAnalysis.total_tracks) * 30; // Max 30 points
                
                // Data structure quality score
                const structure = collectionInfo.sample_structure;
                let structureScore = 0;
                if (structure) {
                    if (structure.has_audio_features) structureScore += 5;
                    if (structure.has_listening_data) structureScore += 5;
                    if (structure.has_track_info) structureScore += 5;
                    if (structure.spotify_uri_present) structureScore += 5;
                }
                
                // Index score
                const indexScore = Math.min(collectionInfo.indexes / 10, 1) * 10; // Max 10 points
                
                const totalScore = documentCountScore + audioFeaturesScore + structureScore + indexScore;
                
                this.log(`  ${fullName}: Score ${totalScore.toFixed(1)} (Docs: ${documentCountScore.toFixed(1)}, Audio: ${audioFeaturesScore.toFixed(1)}, Structure: ${structureScore}, Index: ${indexScore.toFixed(1)})`, 'debug');
                
                if (totalScore > bestScore) {
                    bestScore = totalScore;
                    bestOption = {
                        database: dbName,
                        collection: collectionName,
                        full_name: fullName,
                        score: totalScore,
                        reasons: {
                            document_count: collectionInfo.document_count,
                            audio_features_coverage: audioAnalysis.audio_features_coverage_percent + '%',
                            complete_audio_features: audioAnalysis.with_complete_audio_features,
                            missing_audio_features: audioAnalysis.missing_audio_features,
                            indexes: collectionInfo.indexes,
                            data_quality: structure
                        }
                    };
                }
            }
        }
        
        this.comparisonResults.optimal_database = bestOption;
        
        if (bestOption) {
            this.log(`Optimal database identified: ${bestOption.full_name} (Score: ${bestOption.score.toFixed(1)})`, 'success');
        } else {
            this.log('No suitable database option found', 'warn');
        }
    }

    generateRecommendations() {
        this.log('Generating recommendations...', 'test');
        
        const optimal = this.comparisonResults.optimal_database;
        
        if (!optimal) {
            this.comparisonResults.recommendations.push({
                priority: 'critical',
                category: 'database_setup',
                issue: 'No suitable database found',
                action: 'Create and populate a new database with merged Spotify data'
            });
            return;
        }
        
        // Check if current optimal has missing audio features
        const missingFeatures = optimal.reasons.missing_audio_features;
        if (missingFeatures > 0) {
            const percentage = ((missingFeatures / optimal.reasons.document_count) * 100).toFixed(1);
            this.comparisonResults.recommendations.push({
                priority: 'high',
                category: 'audio_features',
                issue: `${missingFeatures} tracks (${percentage}%) missing audio features`,
                action: 'Run audio features enhancement process to match remaining tracks with features data'
            });
        }
        
        // Check index optimization
        if (optimal.reasons.indexes < 10) {
            this.comparisonResults.recommendations.push({
                priority: 'medium',
                category: 'performance',
                issue: 'Insufficient database indexes for optimal performance',
                action: 'Create additional indexes for common query patterns'
            });
        }
        
        // Compare with other options
        const allOptions = Object.entries(this.comparisonResults.databases).map(([dbName, dbInfo]) =>
            Object.entries(dbInfo.collections).map(([collName, collInfo]) => ({
                name: `${dbName}.${collName}`,
                docs: collInfo.document_count
            }))
        ).flat().filter(opt => opt.docs > 0);
        
        const maxDocs = Math.max(...allOptions.map(opt => opt.docs));
        if (optimal.reasons.document_count < maxDocs) {
            const betterOption = allOptions.find(opt => opt.docs === maxDocs);
            this.comparisonResults.recommendations.push({
                priority: 'medium',
                category: 'data_completeness',
                issue: `Another collection (${betterOption.name}) has more documents (${maxDocs} vs ${optimal.reasons.document_count})`,
                action: 'Consider merging data from multiple collections for maximum completeness'
            });
        }
    }

    generateReport() {
        const reportPath = '/home/runner/work/Spotify-echo/Spotify-echo/DATABASE_COMPARISON_REPORT.json';
        const mdReportPath = '/home/runner/work/Spotify-echo/Spotify-echo/DATABASE_COMPARISON_REPORT.md';
        
        // Save JSON report
        fs.writeFileSync(reportPath, JSON.stringify(this.comparisonResults, null, 2));
        
        // Generate markdown report
        const markdownReport = this.generateMarkdownReport();
        fs.writeFileSync(mdReportPath, markdownReport);
        
        this.log(`Comparison reports saved:`, 'info');
        this.log(`  JSON: ${reportPath}`, 'info'); 
        this.log(`  Markdown: ${mdReportPath}`, 'info');
        
        return this.comparisonResults;
    }

    generateMarkdownReport() {
        const results = this.comparisonResults;
        const optimal = results.optimal_database;
        
        return `# Database Comparison and Audio Features Analysis Report

**Generated:** ${results.timestamp}
**Connection Status:** ${results.connection_status}
**Optimal Database:** ${optimal ? optimal.full_name : 'None identified'}

## Executive Summary

${optimal ? `
**Recommended Database/Collection:** ${optimal.full_name}
**Score:** ${optimal.score.toFixed(1)}/100
**Total Documents:** ${optimal.reasons.document_count.toLocaleString()}
**Audio Features Coverage:** ${optimal.reasons.audio_features_coverage}
**Missing Audio Features:** ${optimal.reasons.missing_audio_features.toLocaleString()} tracks
` : 'No optimal database configuration identified.'}

## Database Analysis

${Object.entries(results.databases).map(([dbName, dbInfo]) => `
### Database: ${dbName}
**Size:** ${Math.round((dbInfo.size_bytes || 0) / 1024 / 1024)}MB

${Object.entries(dbInfo.collections).map(([collName, collInfo]) => `
#### Collection: ${collName}
- **Documents:** ${collInfo.document_count.toLocaleString()}
- **Average Document Size:** ${collInfo.avg_document_size || 0} bytes
- **Storage Size:** ${Math.round((collInfo.storage_size || 0) / 1024 / 1024)}MB
- **Indexes:** ${collInfo.indexes}
${collInfo.sample_structure ? `
- **Has Audio Features:** ${collInfo.sample_structure.has_audio_features ? '✅' : '❌'}
- **Has Listening Data:** ${collInfo.sample_structure.has_listening_data ? '✅' : '❌'}
- **Has Track Info:** ${collInfo.sample_structure.has_track_info ? '✅' : '❌'}
- **Spotify URI Present:** ${collInfo.sample_structure.spotify_uri_present ? '✅' : '❌'}
` : ''}
`).join('\n')}
`).join('\n')}

## Audio Features Analysis

${Object.entries(results.audio_features_analysis).map(([fullName, analysis]) => `
### ${fullName}
- **Total Tracks:** ${analysis.total_tracks.toLocaleString()}
- **Complete Audio Features:** ${analysis.with_complete_audio_features.toLocaleString()} (${analysis.audio_features_coverage_percent}%)
- **Partial Audio Features:** ${analysis.with_partial_audio_features.toLocaleString()}
- **With Track URIs:** ${analysis.with_track_uris.toLocaleString()}
- **Missing Audio Features:** ${analysis.missing_audio_features.toLocaleString()}
`).join('\n')}

## Recommendations

${results.recommendations.map((rec, i) => `
${i + 1}. **${rec.priority.toUpperCase()} - ${rec.category}**
   - **Issue:** ${rec.issue}
   - **Action:** ${rec.action}
`).join('\n')}

## Conclusion

${optimal ? `
The analysis recommends using **${optimal.full_name}** as the primary database/collection for the EchoTune AI project. This choice is based on:

- **Data Volume:** ${optimal.reasons.document_count.toLocaleString()} tracks
- **Audio Features:** ${optimal.reasons.audio_features_coverage} coverage
- **Performance:** ${optimal.reasons.indexes} indexes for query optimization
- **Data Quality:** Comprehensive track, artist, and listening information

${optimal.reasons.missing_audio_features > 0 ? `
**Action Required:** ${optimal.reasons.missing_audio_features.toLocaleString()} tracks are missing audio features and should be processed to improve recommendation quality.
` : ''}
` : `
No suitable database configuration was identified. Consider creating a new merged dataset with comprehensive audio features and listening data.
`}

---
*Generated by Database Comparator for EchoTune AI*
`;
    }

    async disconnect() {
        if (this.client) {
            await this.client.close();
            this.log('MongoDB connection closed', 'info');
        }
    }

    async performComparison() {
        try {
            this.log('Starting comprehensive database comparison...', 'success');
            this.log('='.repeat(80), 'info');
            
            const connected = await this.connect();
            if (!connected) {
                throw new Error('Failed to connect to MongoDB');
            }
            
            await this.listAllDatabases();
            await this.performDetailedAudioFeaturesAnalysis();
            this.determineOptimalDatabase();
            this.generateRecommendations();
            
            const report = this.generateReport();
            
            this.log('='.repeat(80), 'info');
            this.log('DATABASE COMPARISON COMPLETE', 'success');
            this.log('='.repeat(80), 'info');
            
            const optimal = this.comparisonResults.optimal_database;
            if (optimal) {
                this.log(`🏆 Optimal Database: ${optimal.full_name}`, 'success');
                this.log(`📊 Documents: ${optimal.reasons.document_count.toLocaleString()}`, 'info');
                this.log(`🎵 Audio Features: ${optimal.reasons.audio_features_coverage}`, 'info');
                this.log(`❌ Missing Features: ${optimal.reasons.missing_audio_features.toLocaleString()}`, optimal.reasons.missing_audio_features > 0 ? 'warn' : 'info');
                this.log(`🚀 Score: ${optimal.score.toFixed(1)}/100`, 'info');
            } else {
                this.log('❌ No optimal database configuration found', 'warn');
            }
            
            if (this.comparisonResults.recommendations.length > 0) {
                this.log(`💡 Recommendations: ${this.comparisonResults.recommendations.length} items`, 'info');
                this.comparisonResults.recommendations.forEach((rec, i) => {
                    this.log(`  ${i + 1}. ${rec.priority.toUpperCase()}: ${rec.issue}`, 'warn');
                });
            }
            
            this.log('='.repeat(80), 'info');
            
            return report;
            
        } catch (error) {
            this.log(`Database comparison failed: ${error.message}`, 'error');
            throw error;
        } finally {
            await this.disconnect();
        }
    }
}

// Execute if run directly
if (require.main === module) {
    const comparator = new DatabaseComparator();
    comparator.performComparison()
        .then((report) => {
            console.log('\nDatabase comparison completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Database comparison failed:', error);
            process.exit(1);
        });
}

module.exports = DatabaseComparator;