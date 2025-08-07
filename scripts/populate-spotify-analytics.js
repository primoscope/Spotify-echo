#!/usr/bin/env node

/**
 * Spotify Analytics Data Population Script
 * 
 * This script populates the spotify_analytics collection by:
 * 1. Migrating data from other collections in the echotune database
 * 2. Loading CSV data from ml_datasets folder
 * 3. Ensuring spotify_analytics has the most merged data
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

class SpotifyAnalyticsPopulator {
    constructor() {
        this.connectionString = 'mongodb+srv://copilot:DapperMan77@cluster0.ofnyuy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
        this.databaseName = 'echotune';
        this.targetCollection = 'spotify_analytics';
        
        this.client = null;
        this.db = null;
        
        this.stats = {
            totalProcessed: 0,
            totalInserted: 0,
            errors: 0,
            sources: {}
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

    async connect() {
        try {
            this.client = new MongoClient(this.connectionString, {
                serverSelectionTimeoutMS: 10000,
                connectTimeoutMS: 10000,
                maxPoolSize: 10
            });

            await this.client.connect();
            await this.client.db('admin').command({ ping: 1 });
            this.db = this.client.db(this.databaseName);
            
            this.log('Connected to MongoDB successfully', 'info');
            return true;
        } catch (error) {
            this.log(`Connection failed: ${error.message}`, 'error');
            return false;
        }
    }

    async migrateFromExistingCollections() {
        this.log('Migrating data from existing collections...', 'info');
        
        try {
            const collections = await this.db.listCollections().toArray();
            const sourceCollections = collections.filter(col => 
                col.name !== this.targetCollection && 
                col.name.includes('listening') || 
                col.name.includes('track') ||
                col.name.includes('analytics')
            );

            for (const collectionInfo of sourceCollections) {
                const collectionName = collectionInfo.name;
                this.log(`Processing collection: ${collectionName}`, 'debug');
                
                const sourceCollection = this.db.collection(collectionName);
                const count = await sourceCollection.countDocuments();
                
                if (count === 0) {
                    this.log(`Skipping empty collection: ${collectionName}`, 'debug');
                    continue;
                }

                this.log(`Found ${count} documents in ${collectionName}`, 'info');
                
                // Sample a document to understand structure
                const sampleDoc = await sourceCollection.findOne({});
                if (sampleDoc) {
                    this.log(`Sample structure from ${collectionName}: ${Object.keys(sampleDoc).join(', ')}`, 'debug');
                }

                // Stream documents and transform them for spotify_analytics
                const cursor = sourceCollection.find({});
                let batchInserts = [];
                let processedCount = 0;

                await cursor.forEach(async (doc) => {
                    const transformedDoc = this.transformDocumentForAnalytics(doc, collectionName);
                    if (transformedDoc) {
                        batchInserts.push(transformedDoc);
                        processedCount++;

                        // Batch insert every 100 documents
                        if (batchInserts.length >= 100) {
                            await this.insertBatch(batchInserts, collectionName);
                            batchInserts = [];
                        }
                    }
                });

                // Insert remaining documents
                if (batchInserts.length > 0) {
                    await this.insertBatch(batchInserts, collectionName);
                }

                this.stats.sources[collectionName] = {
                    totalDocuments: count,
                    processed: processedCount
                };

                this.log(`Completed migration from ${collectionName}: ${processedCount} documents processed`, 'info');
            }

        } catch (error) {
            this.log(`Error during collection migration: ${error.message}`, 'error');
            this.stats.errors++;
        }
    }

    transformDocumentForAnalytics(doc, sourceCollection) {
        const now = new Date();
        
        // Create a standardized analytics document
        const analyticsDoc = {
            _id: `${sourceCollection}_${doc._id}`,
            source_collection: sourceCollection,
            original_id: doc._id,
            migrated_at: now,
            
            // Track information (normalize field names)
            track_name: doc.track_name || doc.name || doc.trackName || 'Unknown Track',
            artist_name: doc.artist_name || doc.artist || doc.artistName || 'Unknown Artist',
            album_name: doc.album_name || doc.album || doc.albumName || 'Unknown Album',
            
            // Spotify URIs
            track_uri: doc.track_uri || doc.spotify_track_uri || doc.uri || null,
            artist_uri: doc.artist_uri || doc.spotify_artist_uri || null,
            album_uri: doc.album_uri || doc.spotify_album_uri || null,
            
            // Playback data
            played_at: doc.played_at || doc.timestamp || doc.playedAt || now,
            ms_played: doc.ms_played || doc.msPlayed || doc.duration || 0,
            duration_ms: doc.duration_ms || doc.durationMs || doc.track_duration || 0,
            skip_rate: doc.skip_rate || 0,
            completion_rate: doc.completion_rate || 0,
            
            // User information
            user_id: doc.user_id || doc.userId || doc.username || 'unknown_user',
            user_country: doc.user_country || doc.country || null,
            platform: doc.platform || 'unknown',
            
            // Audio features (if available)
            audio_features: {
                danceability: doc.danceability || doc.audio_features?.danceability || null,
                energy: doc.energy || doc.audio_features?.energy || null,
                valence: doc.valence || doc.audio_features?.valence || null,
                tempo: doc.tempo || doc.audio_features?.tempo || null,
                acousticness: doc.acousticness || doc.audio_features?.acousticness || null,
                instrumentalness: doc.instrumentalness || doc.audio_features?.instrumentalness || null,
                liveness: doc.liveness || doc.audio_features?.liveness || null,
                speechiness: doc.speechiness || doc.audio_features?.speechiness || null,
                loudness: doc.loudness || doc.audio_features?.loudness || null,
                key: doc.key || doc.audio_features?.key || null,
                mode: doc.mode || doc.audio_features?.mode || null,
                time_signature: doc.time_signature || doc.audio_features?.time_signature || null
            },
            
            // Metadata
            explicit: doc.explicit || false,
            popularity: doc.popularity || doc.track_popularity || 0,
            release_date: doc.release_date || doc.releaseDate || null,
            
            // Analytics metadata
            processed_for_analytics: true,
            data_quality_score: this.calculateDataQualityScore(doc),
            
            // Original document (for debugging/reference)
            original_fields: Object.keys(doc).length
        };

        // Remove audio features if all are null
        const audioFeatures = analyticsDoc.audio_features;
        if (Object.values(audioFeatures).every(val => val === null)) {
            delete analyticsDoc.audio_features;
        }

        return analyticsDoc;
    }

    calculateDataQualityScore(doc) {
        let score = 0;
        const maxScore = 10;
        
        // Essential fields
        if (doc.track_name || doc.name || doc.trackName) score += 2;
        if (doc.artist_name || doc.artist || doc.artistName) score += 2;
        if (doc.track_uri || doc.spotify_track_uri || doc.uri) score += 1;
        if (doc.played_at || doc.timestamp) score += 1;
        if (doc.ms_played || doc.duration) score += 1;
        
        // Bonus points for rich data
        if (doc.audio_features || doc.danceability) score += 1;
        if (doc.user_id || doc.userId) score += 1;
        if (doc.duration_ms || doc.track_duration) score += 1;
        
        return Math.min(score, maxScore);
    }

    async insertBatch(documents, source) {
        try {
            const targetCollection = this.db.collection(this.targetCollection);
            const result = await targetCollection.insertMany(documents, { ordered: false });
            this.stats.totalInserted += result.insertedCount;
            this.stats.totalProcessed += documents.length;
        } catch (error) {
            // Handle duplicate key errors gracefully
            if (error.code === 11000) {
                this.log(`Some duplicate documents skipped from ${source}`, 'debug');
                // Count successful inserts from bulk write result
                if (error.result && error.result.insertedCount) {
                    this.stats.totalInserted += error.result.insertedCount;
                }
            } else {
                this.log(`Batch insert error from ${source}: ${error.message}`, 'error');
                this.stats.errors++;
            }
        }
    }

    async loadCSVData() {
        this.log('Loading CSV data from ml_datasets...', 'info');
        
        const csvDir = path.join(process.cwd(), 'ml_datasets');
        if (!fs.existsSync(csvDir)) {
            this.log('ml_datasets directory not found', 'warn');
            return;
        }

        const csvFiles = fs.readdirSync(csvDir).filter(file => file.endsWith('.csv'));
        this.log(`Found ${csvFiles.length} CSV files to process`, 'info');

        for (const csvFile of csvFiles) {
            await this.processCSVFile(path.join(csvDir, csvFile), csvFile);
        }
    }

    async processCSVFile(filePath, fileName) {
        this.log(`Processing CSV file: ${fileName}`, 'debug');
        
        return new Promise((resolve, reject) => {
            const documents = [];
            const fileStats = fs.statSync(filePath);
            this.log(`File size: ${(fileStats.size / 1024 / 1024).toFixed(2)} MB`, 'debug');

            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (row) => {
                    const doc = this.transformCSVRowForAnalytics(row, fileName);
                    if (doc) {
                        documents.push(doc);
                    }
                })
                .on('end', async () => {
                    this.log(`Parsed ${documents.length} records from ${fileName}`, 'info');
                    
                    if (documents.length > 0) {
                        // Insert in batches
                        const batchSize = 500;
                        for (let i = 0; i < documents.length; i += batchSize) {
                            const batch = documents.slice(i, i + batchSize);
                            await this.insertBatch(batch, fileName);
                        }
                        
                        this.stats.sources[fileName] = {
                            totalDocuments: documents.length,
                            processed: documents.length
                        };
                    }
                    
                    resolve();
                })
                .on('error', (error) => {
                    this.log(`Error processing ${fileName}: ${error.message}`, 'error');
                    reject(error);
                });
        });
    }

    transformCSVRowForAnalytics(row, fileName) {
        const now = new Date();
        
        // Handle different CSV formats
        const doc = {
            _id: `csv_${fileName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            source_file: fileName,
            imported_at: now,
            
            // Try to map common CSV fields
            track_name: row.track_name || row.name || row.trackName || row.song_name || 'Unknown Track',
            artist_name: row.artist_name || row.artist || row.artistName || row.artist_names || 'Unknown Artist',
            album_name: row.album_name || row.album || row.albumName || 'Unknown Album',
            
            track_uri: row.track_uri || row.spotify_uri || row.uri || null,
            
            // Convert numeric fields
            ms_played: this.parseNumber(row.ms_played || row.msPlayed || row.duration),
            duration_ms: this.parseNumber(row.duration_ms || row.durationMs || row.track_duration),
            popularity: this.parseNumber(row.popularity || row.track_popularity),
            
            // Audio features
            danceability: this.parseNumber(row.danceability),
            energy: this.parseNumber(row.energy),
            valence: this.parseNumber(row.valence),
            tempo: this.parseNumber(row.tempo),
            acousticness: this.parseNumber(row.acousticness),
            instrumentalness: this.parseNumber(row.instrumentalness),
            liveness: this.parseNumber(row.liveness),
            speechiness: this.parseNumber(row.speechiness),
            loudness: this.parseNumber(row.loudness),
            key: this.parseNumber(row.key),
            mode: this.parseNumber(row.mode),
            time_signature: this.parseNumber(row.time_signature),
            
            // User/interaction data
            user_id: row.user_id || row.userId || row.username || 'csv_user',
            played_at: this.parseDate(row.played_at || row.timestamp || row.date) || now,
            
            // Metadata
            explicit: this.parseBoolean(row.explicit),
            data_source: 'csv_import',
            csv_row_data: row // Keep original for reference
        };

        // Only include audio features if they exist
        const audioFeatures = {};
        ['danceability', 'energy', 'valence', 'tempo', 'acousticness', 'instrumentalness', 
         'liveness', 'speechiness', 'loudness', 'key', 'mode', 'time_signature'].forEach(feature => {
            if (doc[feature] !== null && doc[feature] !== undefined) {
                audioFeatures[feature] = doc[feature];
                delete doc[feature]; // Remove from main doc
            }
        });

        if (Object.keys(audioFeatures).length > 0) {
            doc.audio_features = audioFeatures;
        }

        return doc;
    }

    parseNumber(value) {
        if (value === null || value === undefined || value === '') return null;
        const num = parseFloat(value);
        return isNaN(num) ? null : num;
    }

    parseDate(value) {
        if (!value) return null;
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date;
    }

    parseBoolean(value) {
        if (value === null || value === undefined || value === '') return null;
        return value === true || value === 'true' || value === '1' || value === 1;
    }

    async createIndexes() {
        this.log('Creating indexes for optimal performance...', 'info');
        
        try {
            const collection = this.db.collection(this.targetCollection);
            
            const indexes = [
                { track_name: 1 },
                { artist_name: 1 },
                { user_id: 1, played_at: -1 },
                { played_at: -1 },
                { track_uri: 1 },
                { source_collection: 1 },
                { 'audio_features.energy': 1, 'audio_features.valence': 1 },
                { data_quality_score: -1 }
            ];

            for (const index of indexes) {
                await collection.createIndex(index, { background: true });
                this.log(`Created index: ${JSON.stringify(index)}`, 'debug');
            }

            this.log('All indexes created successfully', 'info');
        } catch (error) {
            this.log(`Error creating indexes: ${error.message}`, 'error');
        }
    }

    async generateSummaryReport() {
        this.log('Generating summary report...', 'info');
        
        try {
            const collection = this.db.collection(this.targetCollection);
            const finalCount = await collection.countDocuments();
            
            // Get some analytics
            const sourceCounts = await collection.aggregate([
                { $group: { _id: '$source_collection', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]).toArray();

            const qualityStats = await collection.aggregate([
                { 
                    $group: { 
                        _id: null, 
                        avgQuality: { $avg: '$data_quality_score' },
                        minQuality: { $min: '$data_quality_score' },
                        maxQuality: { $max: '$data_quality_score' }
                    } 
                }
            ]).toArray();

            const report = {
                timestamp: new Date().toISOString(),
                final_document_count: finalCount,
                processing_stats: this.stats,
                source_breakdown: sourceCounts,
                data_quality: qualityStats[0] || {},
                success: this.stats.errors === 0
            };

            // Save report
            fs.writeFileSync('SPOTIFY_ANALYTICS_POPULATION_REPORT.json', JSON.stringify(report, null, 2));
            
            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🎉 SPOTIFY ANALYTICS POPULATION SUMMARY');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`✅ Final document count: ${finalCount}`);
            console.log(`✅ Total processed: ${this.stats.totalProcessed}`);
            console.log(`✅ Total inserted: ${this.stats.totalInserted}`);
            console.log(`${this.stats.errors ? '❌' : '✅'} Errors: ${this.stats.errors}`);
            
            if (sourceCounts.length > 0) {
                console.log('\n📊 Data sources:');
                sourceCounts.forEach(source => {
                    console.log(`  - ${source._id}: ${source.count} documents`);
                });
            }
            
            if (qualityStats[0]) {
                const quality = qualityStats[0];
                console.log(`\n📈 Average data quality: ${quality.avgQuality?.toFixed(2)}/10`);
            }
            
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            
            return report;

        } catch (error) {
            this.log(`Error generating report: ${error.message}`, 'error');
        }
    }

    async disconnect() {
        if (this.client) {
            await this.client.close();
            this.log('MongoDB connection closed', 'info');
        }
    }

    async run() {
        this.log('Starting Spotify Analytics population process...', 'info');
        
        try {
            // Connect to MongoDB
            const connected = await this.connect();
            if (!connected) {
                return false;
            }

            // Clear existing data in spotify_analytics (optional)
            const collection = this.db.collection(this.targetCollection);
            const existingCount = await collection.countDocuments();
            
            if (existingCount > 0) {
                this.log(`Found ${existingCount} existing documents in ${this.targetCollection}`, 'info');
                // Optionally clear: await collection.deleteMany({});
            }

            // Step 1: Migrate from existing collections
            await this.migrateFromExistingCollections();

            // Step 2: Load CSV data
            await this.loadCSVData();

            // Step 3: Create indexes
            await this.createIndexes();

            // Step 4: Generate report
            const report = await this.generateSummaryReport();

            return report.success;

        } catch (error) {
            this.log(`Population process failed: ${error.message}`, 'error');
            return false;
        } finally {
            await this.disconnect();
        }
    }
}

// Main execution
async function main() {
    const populator = new SpotifyAnalyticsPopulator();
    
    try {
        const success = await populator.run();
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

module.exports = { SpotifyAnalyticsPopulator };