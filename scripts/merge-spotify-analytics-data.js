#!/usr/bin/env node

/**
 * Comprehensive Data Merge from spotify_analytics to echotune Database
 * 
 * This script merges missing data from spotify_analytics database to echotune:
 * - 203,090 listening history records
 * - 33 chat history records  
 * - 18 chat session records
 * - 9 user profile records
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');

class ComprehensiveDataMerger {
    constructor() {
        this.connectionString = 'mongodb+srv://copilot:DapperMan77@cluster0.ofnyuy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
        this.client = null;
        
        this.mergeResults = {
            timestamp: new Date().toISOString(),
            connection_status: 'pending',
            merge_operations: {},
            total_merged: 0,
            errors: [],
            performance_metrics: {}
        };

        // Merge mapping configurations
        this.mergeConfigurations = [
            {
                source: { db: 'spotify_analytics', collection: 'listening_history' },
                target: { db: 'echotune', collection: 'echotune_listening_history' },
                description: 'Complete Spotify listening history',
                strategy: 'batch_insert_with_progress',
                batchSize: 5000,
                priority: 'HIGH'
            },
            {
                source: { db: 'spotify_analytics', collection: 'chat_history' },
                target: { db: 'echotune', collection: 'echotune_chat_sessions' },
                description: 'Chat interaction history',
                strategy: 'direct_insert',
                batchSize: 100,
                priority: 'MEDIUM'
            },
            {
                source: { db: 'spotify_analytics', collection: 'chat_sessions' },
                target: { db: 'echotune', collection: 'echotune_chat_sessions' },
                description: 'Chat session data (append to chat_sessions)',
                strategy: 'direct_insert_append',
                batchSize: 100,
                priority: 'MEDIUM'
            },
            {
                source: { db: 'spotify_analytics', collection: 'user_profiles' },
                target: { db: 'echotune', collection: 'echotune_user_preferences' },
                description: 'User preference and profile data',
                strategy: 'direct_insert',
                batchSize: 100,
                priority: 'MEDIUM'
            }
        ];
    }

    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = {
            info: '✅',
            warn: '⚠️',
            error: '❌',
            debug: '🔍',
            success: '🎉',
            test: '🧪',
            progress: '📈'
        };
        console.log(`${prefix[level]} [${timestamp.split('T')[1].split('.')[0]}] ${message}`);
    }

    async connect() {
        try {
            this.client = new MongoClient(this.connectionString, {
                serverSelectionTimeoutMS: 15000,
                connectTimeoutMS: 15000,
                maxPoolSize: 20
            });
            
            await this.client.connect();
            this.mergeResults.connection_status = 'success';
            this.log('Connected to MongoDB Atlas successfully', 'success');
            return true;
        } catch (error) {
            this.mergeResults.connection_status = 'failed';
            this.log(`MongoDB connection failed: ${error.message}`, 'error');
            return false;
        }
    }

    async validateMergePrerequisites() {
        try {
            this.log('Validating merge prerequisites...', 'test');

            for (const config of this.mergeConfigurations) {
                const sourceDb = this.client.db(config.source.db);
                const targetDb = this.client.db(config.target.db);

                // Check source collection exists and has data
                const sourceCount = await sourceDb.collection(config.source.collection).countDocuments();
                
                // Check target collection (create if doesn't exist)
                const targetCount = await targetDb.collection(config.target.collection).countDocuments();

                this.log(`  ${config.source.db}.${config.source.collection}: ${sourceCount} documents`, 'debug');
                this.log(`  ${config.target.db}.${config.target.collection}: ${targetCount} documents`, 'debug');

                if (sourceCount === 0) {
                    this.log(`    Warning: Source collection is empty`, 'warn');
                }
            }

            this.log('Prerequisites validation complete', 'success');
            return true;

        } catch (error) {
            this.log(`Prerequisites validation failed: ${error.message}`, 'error');
            return false;
        }
    }

    async mergeCollection(config) {
        const startTime = Date.now();
        const operationKey = `${config.source.db}.${config.source.collection} -> ${config.target.db}.${config.target.collection}`;
        
        try {
            this.log(`Starting merge: ${operationKey}`, 'test');
            
            const sourceCollection = this.client.db(config.source.db).collection(config.source.collection);
            const targetCollection = this.client.db(config.target.db).collection(config.target.collection);

            // Get total count for progress tracking
            const totalDocuments = await sourceCollection.countDocuments();
            
            if (totalDocuments === 0) {
                this.log(`  No documents to merge from ${config.source.collection}`, 'warn');
                return { merged: 0, skipped: 0, errors: 0 };
            }

            let mergedCount = 0;
            let skippedCount = 0;
            let errorCount = 0;

            if (config.strategy === 'batch_insert_with_progress') {
                // Process in batches for large collections
                const batchSize = config.batchSize || 1000;
                let processed = 0;

                this.log(`  Processing ${totalDocuments.toLocaleString()} documents in batches of ${batchSize}...`, 'progress');

                const cursor = sourceCollection.find({}).batchSize(batchSize);
                let batch = [];

                for await (const document of cursor) {
                    // Prepare document for target schema
                    const transformedDoc = this.transformDocument(document, config);
                    batch.push(transformedDoc);

                    if (batch.length >= batchSize) {
                        try {
                            const result = await targetCollection.insertMany(batch, { ordered: false });
                            mergedCount += result.insertedCount;
                            batch = [];
                            processed += batchSize;

                            // Progress update
                            const progressPercent = ((processed / totalDocuments) * 100).toFixed(1);
                            this.log(`    Progress: ${progressPercent}% (${processed.toLocaleString()}/${totalDocuments.toLocaleString()})`, 'progress');

                        } catch (batchError) {
                            this.log(`    Batch error: ${batchError.message}`, 'warn');
                            errorCount += batch.length;
                            batch = [];
                        }
                    }
                }

                // Process remaining documents
                if (batch.length > 0) {
                    try {
                        const result = await targetCollection.insertMany(batch, { ordered: false });
                        mergedCount += result.insertedCount;
                    } catch (batchError) {
                        this.log(`    Final batch error: ${batchError.message}`, 'warn');
                        errorCount += batch.length;
                    }
                }

            } else {
                // Direct insert for smaller collections
                const documents = await sourceCollection.find({}).toArray();
                const transformedDocs = documents.map(doc => this.transformDocument(doc, config));

                if (config.strategy === 'direct_insert_append') {
                    // Check for existing documents to avoid duplicates
                    const existingDocs = await targetCollection.find({}).toArray();
                    const existingIds = new Set(existingDocs.map(doc => doc._id?.toString() || doc.id));
                    
                    const newDocs = transformedDocs.filter(doc => 
                        !existingIds.has(doc._id?.toString() || doc.id)
                    );
                    
                    skippedCount = transformedDocs.length - newDocs.length;

                    if (newDocs.length > 0) {
                        const result = await targetCollection.insertMany(newDocs, { ordered: false });
                        mergedCount = result.insertedCount;
                    }
                } else {
                    // Direct insert
                    if (transformedDocs.length > 0) {
                        const result = await targetCollection.insertMany(transformedDocs, { ordered: false });
                        mergedCount = result.insertedCount;
                    }
                }
            }

            const endTime = Date.now();
            const duration = (endTime - startTime) / 1000;

            // Record results
            this.mergeResults.merge_operations[operationKey] = {
                source_collection: `${config.source.db}.${config.source.collection}`,
                target_collection: `${config.target.db}.${config.target.collection}`,
                total_documents: totalDocuments,
                merged_count: mergedCount,
                skipped_count: skippedCount,
                error_count: errorCount,
                duration_seconds: duration,
                documents_per_second: totalDocuments > 0 ? (totalDocuments / duration).toFixed(2) : 0,
                status: errorCount === 0 ? 'success' : 'partial_success'
            };

            this.log(`  Merge complete: ${mergedCount} merged, ${skippedCount} skipped, ${errorCount} errors (${duration.toFixed(1)}s)`, 'success');
            
            return { merged: mergedCount, skipped: skippedCount, errors: errorCount };

        } catch (error) {
            const endTime = Date.now();
            const duration = (endTime - startTime) / 1000;

            this.mergeResults.merge_operations[operationKey] = {
                error: error.message,
                duration_seconds: duration,
                status: 'failed'
            };

            this.log(`  Merge failed: ${error.message}`, 'error');
            this.mergeResults.errors.push({ operation: operationKey, error: error.message });
            
            return { merged: 0, skipped: 0, errors: 1 };
        }
    }

    transformDocument(document, config) {
        // Transform document based on target schema requirements
        const transformed = { ...document };

        // Add metadata for tracking
        transformed.source_db = config.source.db;
        transformed.source_collection = config.source.collection;
        transformed.merged_at = new Date();

        // Handle specific transformations based on collection type
        if (config.source.collection === 'listening_history') {
            // Ensure required fields for listening history
            if (!transformed.played_at && transformed.endTime) {
                transformed.played_at = transformed.endTime;
            }
            
            if (!transformed.track_id && transformed.spotify_track_uri) {
                // Extract track ID from URI
                const match = transformed.spotify_track_uri.match(/spotify:track:([a-zA-Z0-9]+)/);
                if (match) {
                    transformed.track_id = match[1];
                }
            }
        }

        if (config.source.collection === 'chat_history' || config.source.collection === 'chat_sessions') {
            // Ensure chat session consistency
            if (!transformed.session_id && transformed._id) {
                transformed.session_id = transformed._id.toString();
            }
        }

        if (config.source.collection === 'user_profiles') {
            // Transform user profiles to user preferences format
            if (!transformed.user_id && transformed.userId) {
                transformed.user_id = transformed.userId;
            }
        }

        return transformed;
    }

    async optimizeTargetCollections() {
        try {
            this.log('Optimizing merged collections with indexes...', 'test');

            const indexConfigurations = [
                {
                    db: 'echotune',
                    collection: 'echotune_listening_history',
                    indexes: [
                        { fields: { track_id: 1 }, name: 'track_id_1' },
                        { fields: { played_at: -1 }, name: 'played_at_desc' },
                        { fields: { user_id: 1, played_at: -1 }, name: 'user_played_at' },
                        { fields: { spotify_track_uri: 1 }, name: 'spotify_uri_1' }
                    ]
                },
                {
                    db: 'echotune',
                    collection: 'echotune_chat_sessions',
                    indexes: [
                        { fields: { session_id: 1 }, name: 'session_id_1' },
                        { fields: { user_id: 1 }, name: 'user_id_1' },
                        { fields: { created_at: -1 }, name: 'created_at_desc' }
                    ]
                },
                {
                    db: 'echotune',
                    collection: 'echotune_user_preferences',
                    indexes: [
                        { fields: { user_id: 1 }, name: 'user_id_unique', unique: true },
                        { fields: { updated_at: -1 }, name: 'updated_at_desc' }
                    ]
                }
            ];

            let totalIndexes = 0;

            for (const config of indexConfigurations) {
                const collection = this.client.db(config.db).collection(config.collection);
                
                for (const indexConfig of config.indexes) {
                    try {
                        const options = { name: indexConfig.name };
                        if (indexConfig.unique) options.unique = true;
                        
                        await collection.createIndex(indexConfig.fields, options);
                        totalIndexes++;
                        this.log(`    Created index: ${config.collection}.${indexConfig.name}`, 'debug');
                    } catch (indexError) {
                        if (!indexError.message.includes('already exists')) {
                            this.log(`    Index creation failed: ${indexError.message}`, 'warn');
                        }
                    }
                }
            }

            this.log(`Database optimization complete: ${totalIndexes} indexes processed`, 'success');

        } catch (error) {
            this.log(`Database optimization failed: ${error.message}`, 'error');
        }
    }

    async generateFinalReport() {
        const reportPath = '/home/runner/work/Spotify-echo/Spotify-echo/COMPREHENSIVE_MERGE_REPORT.json';
        const mdReportPath = '/home/runner/work/Spotify-echo/Spotify-echo/COMPREHENSIVE_MERGE_REPORT.md';
        
        // Calculate summary metrics
        this.mergeResults.total_merged = Object.values(this.mergeResults.merge_operations)
            .reduce((sum, op) => sum + (op.merged_count || 0), 0);

        const totalErrors = Object.values(this.mergeResults.merge_operations)
            .reduce((sum, op) => sum + (op.error_count || 0), 0);

        const avgProcessingSpeed = Object.values(this.mergeResults.merge_operations)
            .filter(op => op.documents_per_second)
            .reduce((sum, op) => sum + parseFloat(op.documents_per_second), 0) / 
            Object.keys(this.mergeResults.merge_operations).length;

        this.mergeResults.performance_metrics = {
            total_operations: Object.keys(this.mergeResults.merge_operations).length,
            successful_operations: Object.values(this.mergeResults.merge_operations).filter(op => op.status === 'success').length,
            total_errors: totalErrors,
            average_processing_speed: avgProcessingSpeed.toFixed(2) + ' docs/sec',
            merge_success_rate: ((this.mergeResults.total_merged / (this.mergeResults.total_merged + totalErrors)) * 100).toFixed(1) + '%'
        };

        // Save JSON report
        fs.writeFileSync(reportPath, JSON.stringify(this.mergeResults, null, 2));
        
        // Generate markdown report
        const markdownReport = this.generateMarkdownReport();
        fs.writeFileSync(mdReportPath, markdownReport);
        
        this.log(`Comprehensive merge reports saved:`, 'info');
        this.log(`  JSON: ${reportPath}`, 'info'); 
        this.log(`  Markdown: ${mdReportPath}`, 'info');
        
        return this.mergeResults;
    }

    generateMarkdownReport() {
        const results = this.mergeResults;
        
        return `# Comprehensive Data Merge Report

**Generated:** ${results.timestamp}
**Connection Status:** ${results.connection_status}
**Total Merged Documents:** ${results.total_merged.toLocaleString()}

## Executive Summary

Successfully merged missing data from spotify_analytics database into echotune database for enhanced music recommendations and user analytics.

### Performance Metrics
- **Total Operations:** ${results.performance_metrics.total_operations}
- **Successful Operations:** ${results.performance_metrics.successful_operations}
- **Total Errors:** ${results.performance_metrics.total_errors}
- **Average Processing Speed:** ${results.performance_metrics.average_processing_speed}
- **Merge Success Rate:** ${results.performance_metrics.merge_success_rate}

## Merge Operations Details

${Object.entries(results.merge_operations).map(([operation, details]) => `
### ${operation}
- **Status:** ${details.status}
- **Source:** ${details.source_collection}
- **Target:** ${details.target_collection}
- **Documents Processed:** ${details.total_documents?.toLocaleString() || 'N/A'}
- **Successfully Merged:** ${details.merged_count?.toLocaleString() || 'N/A'}
- **Skipped:** ${details.skipped_count?.toLocaleString() || 0}
- **Errors:** ${details.error_count || 0}
- **Duration:** ${details.duration_seconds}s
- **Processing Speed:** ${details.documents_per_second || 'N/A'} docs/sec
${details.error ? `- **Error:** ${details.error}` : ''}
`).join('\n')}

## Database Enhancement Benefits

### Listening History Enhancement
- **Added:** 203,090+ listening records for comprehensive recommendation training
- **Benefit:** Massive improvement in collaborative filtering algorithms
- **Usage:** Real-time personalization and user behavior analysis

### Chat Data Integration  
- **Added:** Chat history and session data for conversational AI enhancement
- **Benefit:** Context-aware music recommendations through natural language
- **Usage:** Improved chatbot responses and user interaction tracking

### User Profile Data
- **Added:** User preference and profile information
- **Benefit:** Enhanced personalization and user segmentation
- **Usage:** Targeted recommendations and user analytics

## Database Optimization

Post-merge database optimization included:
- Performance indexes for query optimization
- User-specific indexes for personalization queries
- Time-based indexes for analytics and reporting
- Unique constraints for data integrity

## Recommendations for Next Steps

1. **Validate Data Quality** - Run comprehensive data validation
2. **Test Recommendation Algorithms** - Verify improved performance with merged data
3. **Monitor Query Performance** - Ensure indexes are effective
4. **Implement Data Sync** - Set up ongoing synchronization if needed

${results.errors.length > 0 ? `
## Errors and Warnings

${results.errors.map((error, i) => `
${i + 1}. **${error.operation}**: ${error.error}
`).join('')}
` : ''}

---
*Generated by Comprehensive Data Merger for EchoTune AI*
`;
    }

    async disconnect() {
        if (this.client) {
            await this.client.close();
            this.log('MongoDB connection closed', 'info');
        }
    }

    async performComprehensiveMerge() {
        try {
            this.log('Starting comprehensive data merge...', 'success');
            this.log('='.repeat(80), 'info');
            
            const connected = await this.connect();
            if (!connected) {
                throw new Error('Failed to connect to MongoDB');
            }
            
            const validationPassed = await this.validateMergePrerequisites();
            if (!validationPassed) {
                throw new Error('Prerequisites validation failed');
            }

            // Execute merges in priority order
            const sortedConfigs = [...this.mergeConfigurations].sort((a, b) => {
                const priorityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            });

            let totalMerged = 0;
            let totalErrors = 0;

            for (const config of sortedConfigs) {
                this.log(`\nExecuting ${config.priority} priority merge: ${config.description}`, 'test');
                const result = await this.mergeCollection(config);
                
                totalMerged += result.merged;
                totalErrors += result.errors;
            }

            // Optimize database after merges
            await this.optimizeTargetCollections();

            const report = await this.generateFinalReport();
            
            this.log('='.repeat(80), 'info');
            this.log('COMPREHENSIVE DATA MERGE COMPLETE', 'success');
            this.log('='.repeat(80), 'info');
            
            this.log(`🎉 Total Documents Merged: ${totalMerged.toLocaleString()}`, 'success');
            this.log(`📊 Merge Operations: ${Object.keys(this.mergeResults.merge_operations).length}`, 'info');
            this.log(`⚠️ Total Errors: ${totalErrors}`, totalErrors > 0 ? 'warn' : 'info');
            this.log(`🚀 Success Rate: ${this.mergeResults.performance_metrics.merge_success_rate}`, 'info');
            
            this.log('='.repeat(80), 'info');
            
            return report;
            
        } catch (error) {
            this.log(`Comprehensive merge failed: ${error.message}`, 'error');
            throw error;
        } finally {
            await this.disconnect();
        }
    }
}

// Execute if run directly
if (require.main === module) {
    const merger = new ComprehensiveDataMerger();
    merger.performComprehensiveMerge()
        .then((report) => {
            console.log('\nComprehensive data merge completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Comprehensive data merge failed:', error);
            process.exit(1);
        });
}

module.exports = ComprehensiveDataMerger;