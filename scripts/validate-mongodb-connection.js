#!/usr/bin/env node

/**
 * MongoDB Connection and Data Validation Script for EchoTune AI
 * 
 * Validates the specific MongoDB connection string and checks for required data:
 * - Connection: mongodb+srv://copilot:DapperMan77@cluster0.ofnyuy.mongodb.net
 * - Database: echotune
 * - Collection: spotify_analytics (with most merged data)
 * 
 * Usage:
 *   node scripts/validate-mongodb-connection.js
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

class MongoDBValidator {
    constructor() {
        // Specific connection details from problem statement
        this.requiredConnectionString = 'mongodb+srv://copilot:DapperMan77@cluster0.ofnyuy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
        this.requiredDatabase = 'echotune';
        this.primaryCollection = 'spotify_analytics';
        
        this.client = null;
        this.db = null;
        this.results = {
            timestamp: new Date().toISOString(),
            connection: {
                status: 'pending',
                message: '',
                connectionString: this.requiredConnectionString.replace(/\/\/.*:.*@/, '//***:***@'), // Hide credentials
                database: this.requiredDatabase
            },
            collections: {},
            dataValidation: {
                spotify_analytics: {
                    exists: false,
                    documentCount: 0,
                    sampleDocument: null,
                    indexes: [],
                    dataQuality: {
                        hasRequiredFields: false,
                        fieldTypes: {},
                        uniqueValues: {}
                    }
                }
            },
            recommendations: [],
            overall: 'pending'
        };
    }

    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = {
            info: '✅',
            warn: '⚠️',
            error: '❌',
            debug: '🔍'
        };
        console.log(`${prefix[level]} [${timestamp.split('T')[1].split('.')[0]}] ${message}`);
    }

    async validateConnection() {
        this.log('Validating MongoDB connection...', 'info');
        
        try {
            // Create MongoDB client with specific connection string
            this.client = new MongoClient(this.requiredConnectionString, {
                serverSelectionTimeoutMS: 10000,
                connectTimeoutMS: 10000,
                socketTimeoutMS: 10000,
                maxPoolSize: 10,
                retryWrites: true,
                w: 'majority'
            });

            // Test connection
            await this.client.connect();
            
            // Ping the database
            await this.client.db('admin').command({ ping: 1 });
            
            this.results.connection.status = 'success';
            this.results.connection.message = 'Successfully connected to MongoDB cluster';
            this.log('Successfully connected to MongoDB cluster', 'info');

            // Get server info
            const serverInfo = await this.client.db('admin').admin().serverInfo();
            this.results.connection.serverInfo = {
                version: serverInfo.version,
                buildInfo: serverInfo.buildInfo
            };
            this.log(`MongoDB Server Version: ${serverInfo.version}`, 'info');

            return true;

        } catch (error) {
            this.results.connection.status = 'failed';
            this.results.connection.message = `Connection failed: ${error.message}`;
            this.log(`Connection failed: ${error.message}`, 'error');
            return false;
        }
    }

    async validateDatabase() {
        this.log(`Validating database: ${this.requiredDatabase}`, 'info');
        
        try {
            // Access the specific database
            this.db = this.client.db(this.requiredDatabase);
            
            // List all collections
            const collections = await this.db.listCollections().toArray();
            this.results.collections = collections.reduce((acc, col) => {
                acc[col.name] = {
                    exists: true,
                    type: col.type || 'collection'
                };
                return acc;
            }, {});

            this.log(`Found ${collections.length} collections in database '${this.requiredDatabase}'`, 'info');
            collections.forEach(col => this.log(`  - ${col.name}`, 'debug'));

            return true;

        } catch (error) {
            this.log(`Database validation failed: ${error.message}`, 'error');
            return false;
        }
    }

    async validateSpotifyAnalyticsCollection() {
        this.log(`Validating collection: ${this.primaryCollection}`, 'info');
        
        try {
            const collection = this.db.collection(this.primaryCollection);
            const collectionInfo = this.results.dataValidation.spotify_analytics;
            
            // Check if collection exists by trying to get stats
            try {
                const stats = await this.db.command({ collStats: this.primaryCollection });
                collectionInfo.exists = true;
                collectionInfo.storageStats = {
                    count: stats.count,
                    size: stats.size,
                    storageSize: stats.storageSize,
                    avgObjSize: stats.avgObjSize
                };
                this.log(`Collection '${this.primaryCollection}' exists with ${stats.count} documents`, 'info');
            } catch (error) {
                // Collection might not exist or be empty
                collectionInfo.exists = false;
                this.log(`Collection '${this.primaryCollection}' does not exist or is empty`, 'warn');
                this.results.recommendations.push({
                    priority: 'high',
                    issue: 'Missing spotify_analytics collection',
                    action: 'Create and populate the spotify_analytics collection with merged data'
                });
                return false;
            }

            // Get document count
            collectionInfo.documentCount = await collection.countDocuments();
            this.log(`Document count: ${collectionInfo.documentCount}`, 'info');

            if (collectionInfo.documentCount === 0) {
                this.log('Collection exists but is empty', 'warn');
                this.results.recommendations.push({
                    priority: 'high',
                    issue: 'Empty spotify_analytics collection',
                    action: 'Populate the spotify_analytics collection with merged Spotify data'
                });
                return false;
            }

            // Get a sample document to analyze structure
            const sampleDoc = await collection.findOne({});
            if (sampleDoc) {
                // Remove _id for cleaner output and avoid circular references
                const cleanSample = { ...sampleDoc };
                delete cleanSample._id;
                collectionInfo.sampleDocument = cleanSample;
                
                // Analyze data quality
                await this.analyzeDataQuality(collection, sampleDoc);
            }

            // Get indexes
            const indexes = await collection.listIndexes().toArray();
            collectionInfo.indexes = indexes.map(idx => ({
                name: idx.name,
                key: idx.key,
                unique: idx.unique || false
            }));
            this.log(`Found ${indexes.length} indexes on collection`, 'info');

            // Validate this collection has the most data compared to others
            await this.validateDataDistribution();

            return true;

        } catch (error) {
            this.log(`Collection validation failed: ${error.message}`, 'error');
            return false;
        }
    }

    async analyzeDataQuality(collection, sampleDoc) {
        const dataQuality = this.results.dataValidation.spotify_analytics.dataQuality;
        
        // Check for common Spotify data fields
        const requiredFields = [
            'track_name', 'artist_name', 'album_name', 'played_at',
            'ms_played', 'track_uri', 'duration_ms'
        ];
        
        const alternativeFields = [
            'name', 'artist', 'album', 'timestamp', 'playCount',
            'spotify_track_uri', 'track_duration'
        ];

        // Check field presence (allow for variations)
        const presentFields = Object.keys(sampleDoc);
        dataQuality.fieldTypes = {};
        dataQuality.presentFields = presentFields;
        
        let requiredFieldsFound = 0;
        requiredFields.forEach(field => {
            if (presentFields.includes(field)) {
                requiredFieldsFound++;
                dataQuality.fieldTypes[field] = typeof sampleDoc[field];
            }
        });

        // Check alternative field patterns
        alternativeFields.forEach(field => {
            if (presentFields.includes(field)) {
                requiredFieldsFound++;
                dataQuality.fieldTypes[field] = typeof sampleDoc[field];
            }
        });

        dataQuality.hasRequiredFields = requiredFieldsFound >= 3; // At least 3 relevant fields
        
        if (!dataQuality.hasRequiredFields) {
            this.results.recommendations.push({
                priority: 'medium',
                issue: 'Data structure may not match expected Spotify format',
                action: 'Verify data structure contains track, artist, and playback information'
            });
        }

        // Get unique value counts for key fields
        try {
            const uniqueArtists = await collection.distinct('artist_name').catch(() => 
                collection.distinct('artist').catch(() => [])
            );
            const uniqueTracks = await collection.distinct('track_name').catch(() => 
                collection.distinct('name').catch(() => [])
            );
            
            dataQuality.uniqueValues = {
                artists: uniqueArtists.length,
                tracks: uniqueTracks.length
            };
            
            this.log(`Data diversity: ${uniqueArtists.length} unique artists, ${uniqueTracks.length} unique tracks`, 'info');
        } catch (error) {
            this.log(`Could not analyze data diversity: ${error.message}`, 'warn');
        }
    }

    async validateDataDistribution() {
        this.log('Validating data distribution across collections...', 'info');
        
        try {
            const collections = Object.keys(this.results.collections);
            const collectionCounts = {};
            
            for (const collectionName of collections) {
                try {
                    const count = await this.db.collection(collectionName).countDocuments();
                    collectionCounts[collectionName] = count;
                } catch (error) {
                    collectionCounts[collectionName] = 0;
                }
            }
            
            // Check if spotify_analytics has the most data
            const spotifyAnalyticsCount = collectionCounts[this.primaryCollection] || 0;
            const maxCount = Math.max(...Object.values(collectionCounts));
            const maxCollections = Object.keys(collectionCounts).filter(
                name => collectionCounts[name] === maxCount
            );
            
            this.results.dataValidation.collectionCounts = collectionCounts;
            
            if (spotifyAnalyticsCount === maxCount) {
                this.log(`✅ ${this.primaryCollection} has the most data (${spotifyAnalyticsCount} documents)`, 'info');
                this.results.dataValidation.hasMostData = true;
            } else {
                this.log(`⚠️ ${this.primaryCollection} does not have the most data. Collections with most data: ${maxCollections.join(', ')} (${maxCount} documents)`, 'warn');
                this.results.dataValidation.hasMostData = false;
                this.results.recommendations.push({
                    priority: 'medium',
                    issue: `${this.primaryCollection} collection does not contain the most merged data`,
                    action: `Consider merging data from ${maxCollections.join(', ')} into ${this.primaryCollection}`
                });
            }

        } catch (error) {
            this.log(`Data distribution analysis failed: ${error.message}`, 'error');
        }
    }

    async generateReport() {
        const reportPath = path.join(process.cwd(), 'MONGODB_VALIDATION_REPORT.json');
        const mdReportPath = path.join(process.cwd(), 'MONGODB_VALIDATION_REPORT.md');
        
        // Determine overall status
        if (this.results.connection.status === 'success' &&
            this.results.dataValidation.spotify_analytics.exists &&
            this.results.dataValidation.spotify_analytics.documentCount > 0) {
            this.results.overall = 'success';
        } else if (this.results.connection.status === 'success') {
            this.results.overall = 'partial';
        } else {
            this.results.overall = 'failed';
        }

        // Save JSON report
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        
        // Generate markdown report
        const mdReport = this.generateMarkdownReport();
        fs.writeFileSync(mdReportPath, mdReport);
        
        this.log(`✅ Validation report saved to: ${reportPath}`, 'info');
        this.log(`✅ Markdown report saved to: ${mdReportPath}`, 'info');
    }

    generateMarkdownReport() {
        const { results } = this;
        const statusIcon = {
            success: '✅',
            failed: '❌',
            partial: '⚠️',
            pending: '🔄'
        };

        return `# MongoDB Validation Report

## Overview
- **Timestamp**: ${results.timestamp}
- **Overall Status**: ${statusIcon[results.overall]} ${results.overall.toUpperCase()}

## Connection Details
- **Status**: ${statusIcon[results.connection.status]} ${results.connection.status}
- **Database**: ${results.connection.database}
- **Message**: ${results.connection.message}

## Collections Found
${Object.keys(results.collections).map(name => `- ${name}`).join('\n') || 'No collections found'}

## Spotify Analytics Collection
- **Exists**: ${results.dataValidation.spotify_analytics.exists ? '✅ Yes' : '❌ No'}
- **Document Count**: ${results.dataValidation.spotify_analytics.documentCount}
- **Has Most Data**: ${results.dataValidation.hasMostData ? '✅ Yes' : '⚠️ No'}

### Data Quality
${results.dataValidation.spotify_analytics.exists ? `
- **Required Fields Present**: ${results.dataValidation.spotify_analytics.dataQuality.hasRequiredFields ? '✅ Yes' : '⚠️ Partial'}
- **Unique Artists**: ${results.dataValidation.spotify_analytics.dataQuality.uniqueValues?.artists || 'Unknown'}
- **Unique Tracks**: ${results.dataValidation.spotify_analytics.dataQuality.uniqueValues?.tracks || 'Unknown'}
` : 'Collection not available for analysis'}

## Recommendations
${results.recommendations.length > 0 ? 
    results.recommendations.map((rec, i) => 
        `${i + 1}. **${rec.priority.toUpperCase()}**: ${rec.issue}\n   - Action: ${rec.action}`
    ).join('\n') : 
    'No recommendations - everything looks good!'}

## Collection Document Counts
${results.dataValidation.collectionCounts ? 
    Object.entries(results.dataValidation.collectionCounts)
        .sort(([,a], [,b]) => b - a)
        .map(([name, count]) => `- **${name}**: ${count} documents`)
        .join('\n') : 'Not available'}
`;
    }

    async disconnect() {
        if (this.client) {
            await this.client.close();
            this.log('MongoDB connection closed', 'info');
        }
    }

    async runValidation() {
        this.log('Starting MongoDB validation...', 'info');
        this.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'debug');
        
        try {
            // Step 1: Validate connection
            const connectionValid = await this.validateConnection();
            if (!connectionValid) {
                this.results.overall = 'failed';
                await this.generateReport();
                return false;
            }

            // Step 2: Validate database
            const databaseValid = await this.validateDatabase();
            if (!databaseValid) {
                this.results.overall = 'failed';
                await this.generateReport();
                return false;
            }

            // Step 3: Validate spotify_analytics collection
            const collectionValid = await this.validateSpotifyAnalyticsCollection();

            // Step 4: Generate report
            await this.generateReport();

            // Print summary
            this.printSummary();

            return collectionValid;

        } catch (error) {
            this.log(`Validation failed with error: ${error.message}`, 'error');
            this.results.overall = 'failed';
            await this.generateReport();
            return false;
        } finally {
            await this.disconnect();
        }
    }

    printSummary() {
        const { results } = this;
        const statusIcon = {
            success: '✅',
            failed: '❌',
            partial: '⚠️'
        };

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 MONGODB VALIDATION SUMMARY');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Overall Status: ${statusIcon[results.overall]} ${results.overall.toUpperCase()}`);
        console.log(`Connection: ${statusIcon[results.connection.status]} ${results.connection.status}`);
        console.log(`Database '${results.connection.database}': ${Object.keys(results.collections).length} collections`);
        console.log(`Spotify Analytics: ${results.dataValidation.spotify_analytics.exists ? '✅' : '❌'} ${results.dataValidation.spotify_analytics.documentCount} documents`);
        
        if (results.recommendations.length > 0) {
            console.log('\n💡 RECOMMENDATIONS:');
            results.recommendations.forEach((rec, i) => {
                console.log(`${i + 1}. ${rec.priority.toUpperCase()}: ${rec.issue}`);
            });
        }
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        if (results.overall === 'success') {
            console.log('🎉 All validations passed! MongoDB is properly configured.');
        } else if (results.overall === 'partial') {
            console.log('⚠️ Connection successful but data validation incomplete.');
        } else {
            console.log('❌ Validation failed. Check the logs above for details.');
        }
    }
}

// Main execution
async function main() {
    const validator = new MongoDBValidator();
    
    try {
        const success = await validator.runValidation();
        process.exit(success ? 0 : 1);
    } catch (error) {
        console.error(`Fatal error: ${error.message}`);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { MongoDBValidator };