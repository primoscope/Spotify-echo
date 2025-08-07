#!/usr/bin/env node

/**
 * Analyze Missing Data from spotify_analytics Database
 * 
 * This script analyzes the data in spotify_analytics database that's missing 
 * from echotune database (playlists, chat history, chat sessions, etc.)
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');

class MissingDataAnalyzer {
    constructor() {
        this.connectionString = 'mongodb+srv://copilot:DapperMan77@cluster0.ofnyuy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
        this.client = null;
        
        this.analysisResults = {
            timestamp: new Date().toISOString(),
            connection_status: 'pending',
            missing_data_analysis: {},
            merge_recommendations: [],
            data_samples: {}
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
            this.analysisResults.connection_status = 'success';
            this.log('Connected to MongoDB Atlas successfully', 'success');
            return true;
        } catch (error) {
            this.analysisResults.connection_status = 'failed';
            this.log(`MongoDB connection failed: ${error.message}`, 'error');
            return false;
        }
    }

    async analyzeMissingData() {
        try {
            this.log('Analyzing missing data in spotify_analytics database...', 'test');
            
            const spotifyAnalyticsDb = this.client.db('spotify_analytics');
            const echotuneDb = this.client.db('echotune');
            
            // Collections to analyze
            const collectionsToAnalyze = [
                {
                    source: 'spotify_analytics.listening_history',
                    target: 'echotune.echotune_listening_history',
                    description: 'Complete Spotify listening history'
                },
                {
                    source: 'spotify_analytics.chat_history', 
                    target: 'echotune.echotune_chat_sessions',
                    description: 'Chat interaction history'
                },
                {
                    source: 'spotify_analytics.chat_sessions',
                    target: 'echotune.echotune_chat_sessions', 
                    description: 'Chat session data'
                },
                {
                    source: 'spotify_analytics.user_profiles',
                    target: 'echotune.echotune_user_preferences',
                    description: 'User preference and profile data'
                }
            ];

            for (const collectionInfo of collectionsToAnalyze) {
                this.log(`Analyzing ${collectionInfo.source}...`, 'debug');
                
                const [sourceDb, sourceCollection] = collectionInfo.source.split('.');
                const [targetDb, targetCollection] = collectionInfo.target.split('.');
                
                const sourceCol = this.client.db(sourceDb).collection(sourceCollection);
                const targetCol = this.client.db(targetDb).collection(targetCollection);
                
                // Get counts
                const sourceCount = await sourceCol.countDocuments();
                const targetCount = await targetCol.countDocuments();
                
                // Get sample documents
                const sampleDocs = await sourceCol.find({}).limit(3).toArray();
                
                // Analyze structure
                const structure = this.analyzeCollectionStructure(sampleDocs);
                
                // Analyze potential for audio features enhancement
                let audioFeaturesPotential = 0;
                if (sampleDocs.length > 0) {
                    audioFeaturesPotential = await sourceCol.countDocuments({
                        $or: [
                            { 'spotify_track_uri': { $exists: true, $ne: null } },
                            { 'track_uri': { $exists: true, $ne: null } },
                            { 'uri': { $exists: true, $ne: null } }
                        ]
                    });
                }

                this.analysisResults.missing_data_analysis[collectionInfo.source] = {
                    description: collectionInfo.description,
                    target_collection: collectionInfo.target,
                    source_count: sourceCount,
                    target_count: targetCount,
                    missing_records: sourceCount - targetCount,
                    sample_structure: structure,
                    audio_features_potential: audioFeaturesPotential,
                    merge_priority: this.calculateMergePriority(sourceCount, targetCount, structure)
                };

                // Store samples for detailed analysis
                this.analysisResults.data_samples[collectionInfo.source] = sampleDocs.map(doc => 
                    this.sanitizeDocumentForReport(doc)
                );

                this.log(`  Source: ${sourceCount} documents, Target: ${targetCount} documents`, 'info');
                this.log(`  Missing: ${sourceCount - targetCount} records`, sourceCount > targetCount ? 'warn' : 'info');
            }

        } catch (error) {
            this.log(`Missing data analysis failed: ${error.message}`, 'error');
            throw error;
        }
    }

    analyzeCollectionStructure(documents) {
        if (documents.length === 0) return null;

        const structure = {
            total_unique_fields: new Set(),
            has_timestamps: false,
            has_user_data: false,
            has_track_data: false,
            has_audio_features: false,
            has_listening_metrics: false,
            common_fields: {},
            data_quality_score: 0
        };

        documents.forEach(doc => {
            const fields = Object.keys(doc);
            fields.forEach(field => {
                structure.total_unique_fields.add(field);
                
                // Analyze field types and content
                if (field.includes('time') || field.includes('date') || field === '_id') {
                    structure.has_timestamps = true;
                }
                
                if (field.includes('user') || field.includes('session')) {
                    structure.has_user_data = true;
                }
                
                if (field.includes('track') || field.includes('artist') || field.includes('album')) {
                    structure.has_track_data = true;
                }
                
                if (field.includes('danceability') || field.includes('energy') || field === 'audio_features') {
                    structure.has_audio_features = true;
                }
                
                if (field.includes('played') || field.includes('listening') || field.includes('ms_played')) {
                    structure.has_listening_metrics = true;
                }
                
                // Track common fields
                structure.common_fields[field] = (structure.common_fields[field] || 0) + 1;
            });
        });

        structure.total_unique_fields = structure.total_unique_fields.size;
        
        // Calculate data quality score
        let qualityScore = 0;
        if (structure.has_timestamps) qualityScore += 10;
        if (structure.has_user_data) qualityScore += 20;
        if (structure.has_track_data) qualityScore += 30;
        if (structure.has_audio_features) qualityScore += 25;
        if (structure.has_listening_metrics) qualityScore += 15;
        
        structure.data_quality_score = qualityScore;

        return structure;
    }

    calculateMergePriority(sourceCount, targetCount, structure) {
        let priority = 0;
        
        // High count difference = high priority
        const countDifference = sourceCount - targetCount;
        if (countDifference > 100000) priority += 40;
        else if (countDifference > 10000) priority += 30;
        else if (countDifference > 1000) priority += 20;
        else if (countDifference > 0) priority += 10;
        
        // Data quality score
        if (structure) {
            priority += structure.data_quality_score * 0.6;
        }
        
        return priority;
    }

    sanitizeDocumentForReport(doc) {
        const sanitized = {};
        const maxFieldsToShow = 15;
        
        let fieldCount = 0;
        for (const [key, value] of Object.entries(doc)) {
            if (fieldCount >= maxFieldsToShow) {
                sanitized['...'] = `and ${Object.keys(doc).length - maxFieldsToShow} more fields`;
                break;
            }
            
            if (typeof value === 'string' && value.length > 100) {
                sanitized[key] = value.substring(0, 100) + '...';
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = Array.isArray(value) ? `[Array of ${value.length}]` : '[Object]';
            } else {
                sanitized[key] = value;
            }
            fieldCount++;
        }
        
        return sanitized;
    }

    generateMergeRecommendations() {
        this.log('Generating merge recommendations...', 'test');
        
        for (const [source, analysis] of Object.entries(this.analysisResults.missing_data_analysis)) {
            if (analysis.missing_records > 0) {
                const priority = analysis.merge_priority >= 50 ? 'HIGH' : 
                               analysis.merge_priority >= 30 ? 'MEDIUM' : 'LOW';
                
                this.analysisResults.merge_recommendations.push({
                    priority: priority,
                    source_collection: source,
                    target_collection: analysis.target_collection,
                    missing_records: analysis.missing_records,
                    merge_strategy: this.determineMergeStrategy(analysis),
                    estimated_time: this.estimateMergeTime(analysis.missing_records),
                    benefits: this.listMergeBenefits(analysis)
                });
            }
        }

        // Sort by priority
        this.analysisResults.merge_recommendations.sort((a, b) => {
            const priorityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    determineMergeStrategy(analysis) {
        if (analysis.source_count > 100000) {
            return 'batch_insert_with_progress_tracking';
        } else if (analysis.source_count > 10000) {
            return 'chunked_bulk_insert';
        } else {
            return 'direct_insert_with_validation';
        }
    }

    estimateMergeTime(recordCount) {
        // Rough estimates based on document processing
        if (recordCount > 100000) return '15-30 minutes';
        if (recordCount > 10000) return '5-15 minutes';
        if (recordCount > 1000) return '1-5 minutes';
        return '< 1 minute';
    }

    listMergeBenefits(analysis) {
        const benefits = [];
        
        if (analysis.missing_records > 100000) {
            benefits.push('Massive increase in listening history data for recommendations');
        }
        
        if (analysis.sample_structure?.has_user_data) {
            benefits.push('Enhanced user profiling and personalization');
        }
        
        if (analysis.sample_structure?.has_listening_metrics) {
            benefits.push('Improved recommendation algorithms with listening patterns');
        }
        
        if (analysis.audio_features_potential > 0) {
            benefits.push(`${analysis.audio_features_potential} tracks available for audio features enhancement`);
        }

        if (analysis.sample_structure?.data_quality_score > 50) {
            benefits.push('High-quality structured data for analytics');
        }
        
        return benefits;
    }

    generateReport() {
        const reportPath = '/home/runner/work/Spotify-echo/Spotify-echo/MISSING_DATA_ANALYSIS_REPORT.json';
        const mdReportPath = '/home/runner/work/Spotify-echo/Spotify-echo/MISSING_DATA_ANALYSIS_REPORT.md';
        
        // Save JSON report
        fs.writeFileSync(reportPath, JSON.stringify(this.analysisResults, null, 2));
        
        // Generate markdown report
        const markdownReport = this.generateMarkdownReport();
        fs.writeFileSync(mdReportPath, markdownReport);
        
        this.log(`Missing data analysis reports saved:`, 'info');
        this.log(`  JSON: ${reportPath}`, 'info'); 
        this.log(`  Markdown: ${mdReportPath}`, 'info');
        
        return this.analysisResults;
    }

    generateMarkdownReport() {
        const results = this.analysisResults;
        
        return `# Missing Data Analysis Report

**Generated:** ${results.timestamp}
**Connection Status:** ${results.connection_status}

## Executive Summary

Analysis of missing data from spotify_analytics database that should be merged into echotune database for comprehensive music recommendations and user analytics.

## Missing Data Analysis

${Object.entries(results.missing_data_analysis).map(([source, analysis]) => `
### ${source}
**Description:** ${analysis.description}
**Target Collection:** ${analysis.target_collection}

- **Source Records:** ${analysis.source_count.toLocaleString()}
- **Target Records:** ${analysis.target_count.toLocaleString()}  
- **Missing Records:** ${analysis.missing_records.toLocaleString()}
- **Merge Priority:** ${analysis.merge_priority.toFixed(1)}/100
- **Audio Features Potential:** ${analysis.audio_features_potential.toLocaleString()} tracks

**Data Structure Analysis:**
${analysis.sample_structure ? `
- **Unique Fields:** ${analysis.sample_structure.total_unique_fields}
- **Has Timestamps:** ${analysis.sample_structure.has_timestamps ? '✅' : '❌'}
- **Has User Data:** ${analysis.sample_structure.has_user_data ? '✅' : '❌'}
- **Has Track Data:** ${analysis.sample_structure.has_track_data ? '✅' : '❌'}
- **Has Audio Features:** ${analysis.sample_structure.has_audio_features ? '✅' : '❌'}
- **Has Listening Metrics:** ${analysis.sample_structure.has_listening_metrics ? '✅' : '❌'}
- **Data Quality Score:** ${analysis.sample_structure.data_quality_score}/100
` : 'No data available'}
`).join('\n')}

## Merge Recommendations

${results.merge_recommendations.map((rec, i) => `
### ${i + 1}. ${rec.priority} Priority: ${rec.source_collection}
- **Target:** ${rec.target_collection}
- **Missing Records:** ${rec.missing_records.toLocaleString()}
- **Strategy:** ${rec.merge_strategy}
- **Estimated Time:** ${rec.estimated_time}
- **Benefits:**
${rec.benefits.map(benefit => `  - ${benefit}`).join('\n')}
`).join('\n')}

## Sample Data Structures

${Object.entries(results.data_samples).map(([collection, samples]) => `
### ${collection} Sample Documents

${samples.map((sample, i) => `
#### Document ${i + 1}
\`\`\`json
${JSON.stringify(sample, null, 2)}
\`\`\`
`).join('\n')}
`).join('\n')}

## Next Steps

1. **Execute High Priority Merges** - Start with collections having highest missing record counts
2. **Validate Data Consistency** - Ensure no duplicates and maintain referential integrity  
3. **Optimize Database Performance** - Create appropriate indexes after merge
4. **Test Recommendation Algorithms** - Validate improved performance with merged data

---
*Generated by Missing Data Analyzer for EchoTune AI*
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
            this.log('Starting missing data analysis...', 'success');
            this.log('='.repeat(80), 'info');
            
            const connected = await this.connect();
            if (!connected) {
                throw new Error('Failed to connect to MongoDB');
            }
            
            await this.analyzeMissingData();
            this.generateMergeRecommendations();
            
            const report = this.generateReport();
            
            this.log('='.repeat(80), 'info');
            this.log('MISSING DATA ANALYSIS COMPLETE', 'success');
            this.log('='.repeat(80), 'info');
            
            // Summary
            const totalMissing = Object.values(this.analysisResults.missing_data_analysis)
                .reduce((sum, analysis) => sum + analysis.missing_records, 0);
            
            const highPriorityRecs = this.analysisResults.merge_recommendations
                .filter(rec => rec.priority === 'HIGH').length;
            
            this.log(`📊 Total Missing Records: ${totalMissing.toLocaleString()}`, 'info');
            this.log(`🚨 High Priority Collections: ${highPriorityRecs}`, 'warn');
            this.log(`💡 Total Recommendations: ${this.analysisResults.merge_recommendations.length}`, 'info');
            
            if (this.analysisResults.merge_recommendations.length > 0) {
                this.log('\n🎯 Top Merge Recommendations:', 'success');
                this.analysisResults.merge_recommendations.slice(0, 3).forEach((rec, i) => {
                    this.log(`  ${i + 1}. ${rec.priority}: ${rec.source_collection} (${rec.missing_records.toLocaleString()} records)`, 'info');
                });
            }
            
            this.log('='.repeat(80), 'info');
            
            return report;
            
        } catch (error) {
            this.log(`Missing data analysis failed: ${error.message}`, 'error');
            throw error;
        } finally {
            await this.disconnect();
        }
    }
}

// Execute if run directly
if (require.main === module) {
    const analyzer = new MissingDataAnalyzer();
    analyzer.performAnalysis()
        .then((report) => {
            console.log('\nMissing data analysis completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Missing data analysis failed:', error);
            process.exit(1);
        });
}

module.exports = MissingDataAnalyzer;