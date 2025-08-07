#!/usr/bin/env node

/**
 * Missing Audio Features Analysis and Data Merging Script
 * 
 * This script analyzes the missing audio features in the optimal database
 * and attempts to merge data from other collections to maximize completeness.
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');

class MissingFeaturesAnalyzer {
    constructor() {
        this.connectionString = 'mongodb+srv://copilot:DapperMan77@cluster0.ofnyuy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
        this.client = null;
        
        // Primary database/collection from comparison
        this.primaryDb = 'echotune';
        this.primaryCollection = 'spotify_analytics';
        
        // Secondary database/collection with more data
        this.secondaryDb = 'spotify_analytics';
        this.secondaryCollection = 'listening_history';
        
        this.analysisResults = {
            timestamp: new Date().toISOString(),
            primary_collection: {
                database: this.primaryDb,
                collection: this.primaryCollection,
                total_tracks: 0,
                with_audio_features: 0,
                missing_audio_features: 0,
                sample_missing_tracks: []
            },
            secondary_collection: {
                database: this.secondaryDb,
                collection: this.secondaryCollection,
                total_tracks: 0,
                unique_track_uris: 0,
                sample_tracks: [],
                structure_analysis: {}
            },
            audio_features_from_files: {
                available_features: 0,
                unique_track_uris: 0,
                sample_features: []
            },
            merge_analysis: {
                potential_matches: 0,
                mergeable_tracks: 0,
                would_improve_coverage: false
            },
            recommendations: []
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
            this.log('Connected to MongoDB Atlas successfully', 'success');
            return true;
        } catch (error) {
            this.log(`MongoDB connection failed: ${error.message}`, 'error');
            return false;
        }
    }

    async analyzePrimaryCollection() {
        try {
            this.log(`Analyzing primary collection: ${this.primaryDb}.${this.primaryCollection}`, 'test');
            
            const db = this.client.db(this.primaryDb);
            const collection = db.collection(this.primaryCollection);
            
            // Get total count
            const totalCount = await collection.countDocuments();
            this.analysisResults.primary_collection.total_tracks = totalCount;
            
            // Count tracks with audio features
            const withAudioFeatures = await collection.countDocuments({
                has_audio_features: true,
                'audio_features.danceability': { $exists: true, $ne: null }
            });
            this.analysisResults.primary_collection.with_audio_features = withAudioFeatures;
            this.analysisResults.primary_collection.missing_audio_features = totalCount - withAudioFeatures;
            
            // Get sample of missing audio features tracks
            const missingTracks = await collection.find({
                $or: [
                    { has_audio_features: { $ne: true } },
                    { 'audio_features.danceability': { $exists: false } },
                    { 'audio_features.danceability': null }
                ]
            }).limit(10).toArray();
            
            this.analysisResults.primary_collection.sample_missing_tracks = missingTracks.map(track => ({
                track_uri: track.track_uri,
                track_name: track.track_name,
                artist_name: track.artist_name,
                has_audio_features: track.has_audio_features || false,
                audio_features_present: track.audio_features ? Object.keys(track.audio_features).length : 0
            }));
            
            this.log(`Primary collection: ${totalCount} total, ${withAudioFeatures} with audio features, ${totalCount - withAudioFeatures} missing`, 'info');
            
        } catch (error) {
            this.log(`Primary collection analysis failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async analyzeSecondaryCollection() {
        try {
            this.log(`Analyzing secondary collection: ${this.secondaryDb}.${this.secondaryCollection}`, 'test');
            
            const db = this.client.db(this.secondaryDb);
            const collection = db.collection(this.secondaryCollection);
            
            // Get total count
            const totalCount = await collection.countDocuments();
            this.analysisResults.secondary_collection.total_tracks = totalCount;
            
            // Get unique track URIs count
            const uniqueTrackUris = await collection.distinct('track_uri');
            this.analysisResults.secondary_collection.unique_track_uris = uniqueTrackUris.length;
            
            // Get sample tracks to analyze structure
            const sampleTracks = await collection.find({}).limit(5).toArray();
            this.analysisResults.secondary_collection.sample_tracks = sampleTracks.map(track => ({
                track_uri: track.track_uri,
                track_name: track.track_name || track.name,
                artist_name: track.artist_name || track.artist,
                played_at: track.played_at,
                ms_played: track.ms_played,
                available_fields: Object.keys(track)
            }));
            
            // Analyze structure
            if (sampleTracks.length > 0) {
                const fields = Object.keys(sampleTracks[0]);
                this.analysisResults.secondary_collection.structure_analysis = {
                    total_fields: fields.length,
                    field_list: fields,
                    has_track_uri: fields.includes('track_uri'),
                    has_track_name: fields.includes('track_name') || fields.includes('name'),
                    has_artist_name: fields.includes('artist_name') || fields.includes('artist'),
                    has_audio_features: fields.some(f => f.includes('audio_features') || f.includes('danceability'))
                };
            }
            
            this.log(`Secondary collection: ${totalCount} total, ${uniqueTrackUris.length} unique track URIs`, 'info');
            
        } catch (error) {
            this.log(`Secondary collection analysis failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async analyzeAudioFeaturesFromFiles() {
        try {
            this.log('Analyzing audio features from data files...', 'test');
            
            const fs = require('fs');
            const path = require('path');
            
            // Check if audio features files exist
            const audioFeaturesFile = '/home/runner/work/Spotify-echo/Spotify-echo/data/merged_data_audio_features.csv';
            
            if (!fs.existsSync(audioFeaturesFile)) {
                this.log('Audio features file not found', 'warn');
                return;
            }
            
            // Read and parse CSV (simplified approach)
            const csvContent = fs.readFileSync(audioFeaturesFile, 'utf-8');
            const lines = csvContent.split('\n');
            const headers = lines[0].split(',');
            
            this.log(`Audio features file has ${lines.length - 1} rows with ${headers.length} columns`, 'info');
            
            // Count available features and sample some
            const availableFeatures = Math.max(0, lines.length - 2); // -2 for header and last empty line
            this.analysisResults.audio_features_from_files.available_features = availableFeatures;
            
            // Sample first few rows to analyze structure
            const sampleFeatures = [];
            for (let i = 1; i <= Math.min(5, lines.length - 1); i++) {
                const row = lines[i].split(',');
                if (row.length === headers.length) {
                    const featureObj = {};
                    headers.forEach((header, idx) => {
                        featureObj[header.trim()] = row[idx]?.trim();
                    });
                    sampleFeatures.push(featureObj);
                }
            }
            
            this.analysisResults.audio_features_from_files.sample_features = sampleFeatures;
            this.analysisResults.audio_features_from_files.headers = headers;
            
            // Estimate unique track URIs (look for URI column)
            const uriColumn = headers.find(h => h.toLowerCase().includes('uri') || h.toLowerCase().includes('id'));
            if (uriColumn) {
                this.log(`Found URI/ID column: ${uriColumn}`, 'debug');
            }
            
            this.log(`Audio features file: ${availableFeatures} tracks available`, 'info');
            
        } catch (error) {
            this.log(`Audio features file analysis failed: ${error.message}`, 'error');
        }
    }

    async performMergeAnalysis() {
        try {
            this.log('Performing merge analysis...', 'test');
            
            const primaryDb = this.client.db(this.primaryDb);
            const primaryCollection = primaryDb.collection(this.primaryCollection);
            
            const secondaryDb = this.client.db(this.secondaryDb);
            const secondaryCollection = secondaryDb.collection(this.secondaryCollection);
            
            // Get track URIs from primary collection that are missing audio features
            const missingFeaturesUris = await primaryCollection.distinct('track_uri', {
                $or: [
                    { has_audio_features: { $ne: true } },
                    { 'audio_features.danceability': { $exists: false } },
                    { 'audio_features.danceability': null }
                ]
            });
            
            // Check how many of these URIs exist in secondary collection
            const matchingInSecondary = await secondaryCollection.countDocuments({
                track_uri: { $in: missingFeaturesUris.slice(0, 1000) } // Sample first 1000 to avoid timeout
            });
            
            // Get unique track URIs from secondary collection
            const secondaryUris = await secondaryCollection.distinct('track_uri');
            
            // Calculate overlap potential
            const primaryUris = await primaryCollection.distinct('track_uri');
            const overlap = secondaryUris.filter(uri => primaryUris.includes(uri)).length;
            
            this.analysisResults.merge_analysis = {
                primary_missing_features: missingFeaturesUris.length,
                secondary_total_uris: secondaryUris.length,
                potential_matches: matchingInSecondary,
                uri_overlap: overlap,
                would_improve_coverage: matchingInSecondary > 0,
                merge_recommendation: matchingInSecondary > 100 ? 'recommended' : 'limited_benefit'
            };
            
            this.log(`Merge analysis: ${matchingInSecondary} potential matches found`, 'info');
            this.log(`URI overlap between collections: ${overlap}`, 'info');
            
        } catch (error) {
            this.log(`Merge analysis failed: ${error.message}`, 'error');
        }
    }

    generateRecommendations() {
        this.log('Generating recommendations...', 'test');
        
        const missingFeatures = this.analysisResults.primary_collection.missing_audio_features;
        const totalTracks = this.analysisResults.primary_collection.total_tracks;
        const coveragePercent = ((totalTracks - missingFeatures) / totalTracks * 100).toFixed(1);
        
        // Audio features recommendations
        if (missingFeatures > 0) {
            this.analysisResults.recommendations.push({
                priority: 'high',
                category: 'audio_features',
                issue: `${missingFeatures} tracks (${((missingFeatures / totalTracks) * 100).toFixed(1)}%) missing audio features`,
                current_coverage: `${coveragePercent}%`,
                action: 'Process remaining tracks through Spotify Audio Features API to achieve 100% coverage',
                technical_approach: 'Use track URIs to batch fetch missing audio features from Spotify Web API'
            });
        }
        
        // Data merging recommendations
        if (this.analysisResults.merge_analysis.potential_matches > 100) {
            this.analysisResults.recommendations.push({
                priority: 'medium',
                category: 'data_completeness',
                issue: `Secondary collection has ${this.analysisResults.secondary_collection.total_tracks} more tracks`,
                action: 'Consider merging unique tracks from listening_history to increase dataset size',
                potential_benefit: `Could add ${this.analysisResults.merge_analysis.potential_matches}+ tracks`,
                caveat: 'Most secondary tracks lack audio features and would need processing'
            });
        }
        
        // Performance recommendations
        if (this.analysisResults.primary_collection.total_tracks > 40000) {
            this.analysisResults.recommendations.push({
                priority: 'medium',
                category: 'performance',
                issue: 'Large dataset requires optimization for production use',
                action: 'Implement data partitioning and caching strategies for better query performance',
                technical_approach: 'Consider archiving old listening data and focusing on recent/popular tracks'
            });
        }
        
        // Data quality recommendations
        if (parseFloat(coveragePercent) < 90) {
            this.analysisResults.recommendations.push({
                priority: 'high',
                category: 'data_quality',
                issue: `Audio features coverage (${coveragePercent}%) below optimal threshold (90%+)`,
                action: 'Prioritize audio features completion before production deployment',
                impact: 'Missing audio features significantly impact recommendation quality'
            });
        }
    }

    generateReport() {
        const reportPath = '/home/runner/work/Spotify-echo/Spotify-echo/MISSING_AUDIO_FEATURES_ANALYSIS.json';
        const mdReportPath = '/home/runner/work/Spotify-echo/Spotify-echo/MISSING_AUDIO_FEATURES_ANALYSIS.md';
        
        // Save JSON report
        fs.writeFileSync(reportPath, JSON.stringify(this.analysisResults, null, 2));
        
        // Generate markdown report
        const markdownReport = this.generateMarkdownReport();
        fs.writeFileSync(mdReportPath, markdownReport);
        
        this.log(`Missing features analysis reports saved:`, 'info');
        this.log(`  JSON: ${reportPath}`, 'info');
        this.log(`  Markdown: ${mdReportPath}`, 'info');
        
        return this.analysisResults;
    }

    generateMarkdownReport() {
        const results = this.analysisResults;
        const primary = results.primary_collection;
        const secondary = results.secondary_collection;
        const merge = results.merge_analysis;
        
        const coveragePercent = ((primary.total_tracks - primary.missing_audio_features) / primary.total_tracks * 100).toFixed(1);
        
        return `# Missing Audio Features Analysis Report

**Generated:** ${results.timestamp}
**Primary Collection:** ${primary.database}.${primary.collection}
**Secondary Collection:** ${secondary.database}.${secondary.collection}

## Executive Summary

**Current State:**
- **Primary Collection:** ${primary.total_tracks.toLocaleString()} tracks
- **Audio Features Coverage:** ${coveragePercent}% (${primary.with_audio_features.toLocaleString()}/${primary.total_tracks.toLocaleString()})
- **Missing Audio Features:** ${primary.missing_audio_features.toLocaleString()} tracks

**Secondary Collection Analysis:**
- **Total Tracks:** ${secondary.total_tracks.toLocaleString()}
- **Unique Track URIs:** ${secondary.unique_track_uris.toLocaleString()}

## Detailed Analysis

### Primary Collection Status
- **Database:** ${primary.database}
- **Collection:** ${primary.collection}
- **Total Tracks:** ${primary.total_tracks.toLocaleString()}
- **With Complete Audio Features:** ${primary.with_audio_features.toLocaleString()}
- **Missing Audio Features:** ${primary.missing_audio_features.toLocaleString()}
- **Coverage Percentage:** ${coveragePercent}%

#### Sample Missing Tracks
${primary.sample_missing_tracks.map((track, i) => `
${i + 1}. **${track.track_name}** by ${track.artist_name}
   - URI: \`${track.track_uri}\`
   - Has Audio Features: ${track.has_audio_features ? '✅' : '❌'}
   - Audio Features Fields: ${track.audio_features_present}
`).join('')}

### Secondary Collection Analysis
- **Database:** ${secondary.database}
- **Collection:** ${secondary.collection}
- **Total Records:** ${secondary.total_tracks.toLocaleString()}
- **Unique Track URIs:** ${secondary.unique_track_uris.toLocaleString()}

#### Data Structure
- **Total Fields:** ${secondary.structure_analysis.total_fields || 'Unknown'}
- **Has Track URI:** ${secondary.structure_analysis.has_track_uri ? '✅' : '❌'}
- **Has Track Name:** ${secondary.structure_analysis.has_track_name ? '✅' : '❌'}
- **Has Artist Name:** ${secondary.structure_analysis.has_artist_name ? '✅' : '❌'}
- **Has Audio Features:** ${secondary.structure_analysis.has_audio_features ? '✅' : '❌'}

### Audio Features from Files
- **Available Features:** ${results.audio_features_from_files.available_features.toLocaleString()} tracks
- **Headers Found:** ${results.audio_features_from_files.headers?.length || 0} columns

### Merge Analysis
${merge.potential_matches !== undefined ? `
- **Missing Features in Primary:** ${merge.primary_missing_features?.toLocaleString() || 'Unknown'}
- **Secondary Collection URIs:** ${merge.secondary_total_uris?.toLocaleString() || 'Unknown'}
- **Potential Matches:** ${merge.potential_matches?.toLocaleString() || 'Unknown'}
- **URI Overlap:** ${merge.uri_overlap?.toLocaleString() || 'Unknown'}
- **Would Improve Coverage:** ${merge.would_improve_coverage ? '✅ Yes' : '❌ No'}
- **Merge Recommendation:** ${merge.merge_recommendation || 'Unknown'}
` : 'Merge analysis not completed'}

## Recommendations

${results.recommendations.map((rec, i) => `
### ${i + 1}. ${rec.priority.toUpperCase()} Priority - ${rec.category.toUpperCase()}

**Issue:** ${rec.issue}

**Action:** ${rec.action}

${rec.current_coverage ? `**Current Coverage:** ${rec.current_coverage}` : ''}
${rec.technical_approach ? `**Technical Approach:** ${rec.technical_approach}` : ''}
${rec.potential_benefit ? `**Potential Benefit:** ${rec.potential_benefit}` : ''}
${rec.impact ? `**Impact:** ${rec.impact}` : ''}
${rec.caveat ? `**Caveat:** ${rec.caveat}` : ''}
`).join('\n')}

## Conclusion

**Database Recommendation:** Continue using **${primary.database}.${primary.collection}** as the primary database.

**Audio Features Status:** ${primary.missing_audio_features === 0 ? 
    '✅ **Excellent** - All tracks have complete audio features!' : 
    primary.missing_audio_features < (primary.total_tracks * 0.1) ? 
        '✅ **Good** - Over 90% coverage achieved' : 
        primary.missing_audio_features < (primary.total_tracks * 0.2) ? 
            '⚠️ **Acceptable** - 80%+ coverage but improvement needed' : 
            '❌ **Needs Improvement** - Less than 80% coverage'}

**Next Steps:**
1. ${primary.missing_audio_features > 0 ? `Process ${primary.missing_audio_features.toLocaleString()} missing audio features via Spotify API` : 'Audio features processing complete ✅'}
2. ${merge.would_improve_coverage ? 'Consider merging additional unique tracks from secondary collections' : 'Current dataset is optimal for recommendations'}
3. Implement performance optimizations for production deployment

---
*Generated by Missing Features Analyzer for EchoTune AI*
`;
    }

    async disconnect() {
        if (this.client) {
            await this.client.close();
            this.log('MongoDB connection closed', 'info');
        }
    }

    async performAnalysis() {
        try {
            this.log('Starting missing audio features analysis...', 'success');
            this.log('='.repeat(80), 'info');
            
            const connected = await this.connect();
            if (!connected) {
                throw new Error('Failed to connect to MongoDB');
            }
            
            await this.analyzePrimaryCollection();
            await this.analyzeSecondaryCollection();
            await this.analyzeAudioFeaturesFromFiles();
            await this.performMergeAnalysis();
            this.generateRecommendations();
            
            const report = this.generateReport();
            
            this.log('='.repeat(80), 'info');
            this.log('MISSING AUDIO FEATURES ANALYSIS COMPLETE', 'success');
            this.log('='.repeat(80), 'info');
            
            const primary = this.analysisResults.primary_collection;
            const coveragePercent = ((primary.total_tracks - primary.missing_audio_features) / primary.total_tracks * 100).toFixed(1);
            
            this.log(`🎵 Primary Collection: ${primary.database}.${primary.collection}`, 'info');
            this.log(`📊 Total Tracks: ${primary.total_tracks.toLocaleString()}`, 'info');
            this.log(`✅ With Audio Features: ${primary.with_audio_features.toLocaleString()} (${coveragePercent}%)`, 'info');
            this.log(`❌ Missing Audio Features: ${primary.missing_audio_features.toLocaleString()}`, primary.missing_audio_features > 0 ? 'warn' : 'info');
            
            if (this.analysisResults.merge_analysis.potential_matches !== undefined) {
                this.log(`🔄 Potential Merge Matches: ${this.analysisResults.merge_analysis.potential_matches}`, 'info');
            }
            
            this.log(`💡 Recommendations Generated: ${this.analysisResults.recommendations.length}`, 'info');
            this.log('='.repeat(80), 'info');
            
            return report;
            
        } catch (error) {
            this.log(`Analysis failed: ${error.message}`, 'error');
            throw error;
        } finally {
            await this.disconnect();
        }
    }
}

// Execute if run directly
if (require.main === module) {
    const analyzer = new MissingFeaturesAnalyzer();
    analyzer.performAnalysis()
        .then((report) => {
            console.log('\nMissing audio features analysis completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Analysis failed:', error);
            process.exit(1);
        });
}

module.exports = MissingFeaturesAnalyzer;