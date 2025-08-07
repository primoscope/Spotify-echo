#!/usr/bin/env node
/**
 * Advanced JSON Data Merge Script
 * Merges new Spotify JSON export data with existing CSV and MongoDB data
 * Optimizes for AI/ML recommendation engine
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { MongoClient } = require('mongodb');

class AdvancedDataMerger {
    constructor() {
        this.dataDir = path.join(__dirname, '..', 'data');
        this.client = null;
        this.db = null;
        
        this.stats = {
            jsonRecords: 0,
            csvRecords: 0,
            uniqueTracks: new Set(),
            mergedRecords: 0,
            duplicates: 0,
            errors: 0,
            audioFeaturesMatched: 0,
            newTracks: 0
        };
        
        this.audioFeatures = new Map();
        this.batchSize = 1000;
        this.processedBatches = 0;
    }

    async run() {
        console.log('🚀 Starting Advanced JSON Data Merge Process...\n');
        
        try {
            await this.connectToMongoDB();
            await this.loadAudioFeatures();
            await this.processJsonFiles();
            await this.optimizeDatabase();
            await this.generateReport();
            
            console.log('\n✅ Merge process completed successfully!');
            
        } catch (error) {
            console.error('❌ Merge process failed:', error.message);
            throw error;
        } finally {
            if (this.client) {
                await this.client.close();
            }
        }
    }

    async connectToMongoDB() {
        console.log('🗃️  Connecting to MongoDB...');
        
        if (!process.env.MONGODB_URI) {
            throw new Error('MongoDB URI not found in environment variables');
        }
        
        this.client = new MongoClient(process.env.MONGODB_URI);
        await this.client.connect();
        this.db = this.client.db('echotune');
        
        console.log('  ✅ Connected to MongoDB\n');
    }

    async loadAudioFeatures() {
        console.log('🎵 Loading audio features from CSV...');
        
        const audioFeaturesFile = path.join(this.dataDir, 'merged_data_audio_features.csv');
        
        if (!fs.existsSync(audioFeaturesFile)) {
            console.log('  ⚠️  Audio features file not found, continuing without audio features');
            return;
        }
        
        const features = [];
        await new Promise((resolve, reject) => {
            fs.createReadStream(audioFeaturesFile)
                .pipe(csv())
                .on('data', (row) => {
                    if (row['Track URI']) {
                        this.audioFeatures.set(row['Track URI'], {
                            name: row['Track Name'],
                            artist: row['Artist Name(s)'],
                            album: row['Album Name'],
                            duration: parseInt(row['Track Duration (ms)']) || null,
                            popularity: parseInt(row['Popularity']) || null,
                            explicit: row['Explicit'] === 'true',
                            danceability: parseFloat(row['Danceability']) || null,
                            energy: parseFloat(row['Energy']) || null,
                            key: parseInt(row['Key']) || null,
                            loudness: parseFloat(row['Loudness']) || null,
                            mode: parseInt(row['Mode']) || null,
                            speechiness: parseFloat(row['Speechiness']) || null,
                            acousticness: parseFloat(row['Acousticness']) || null,
                            instrumentalness: parseFloat(row['Instrumentalness']) || null,
                            liveness: parseFloat(row['Liveness']) || null,
                            valence: parseFloat(row['Valence']) || null,
                            tempo: parseFloat(row['Tempo']) || null,
                            time_signature: parseInt(row['Time Signature']) || null,
                            genres: row['Artist Genres'] || null,
                            isrc: row['ISRC'] || null,
                            release_date: row['Album Release Date'] || null
                        });
                        features.push(row);
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });
        
        console.log(`  ✅ Loaded ${this.audioFeatures.size} tracks with audio features\n`);
    }

    async processJsonFiles() {
        console.log('📂 Processing JSON files...');
        
        const jsonFiles = fs.readdirSync(this.dataDir)
            .filter(file => file.endsWith('.json') && file.includes('Streaming_History_Audio'))
            .sort();
        
        console.log(`  Found ${jsonFiles.length} JSON files to process`);
        
        // Create collection if it doesn't exist
        const collection = this.db.collection('enhanced_listening_history');
        
        // Create indexes for optimal performance
        await this.createOptimizedIndexes(collection);
        
        let batch = [];
        let totalProcessed = 0;
        
        for (const file of jsonFiles) {
            console.log(`  Processing ${file}...`);
            
            const filePath = path.join(this.dataDir, file);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            if (!Array.isArray(data)) {
                console.log(`    ⚠️  Skipping ${file} - invalid format`);
                continue;
            }
            
            let fileProcessed = 0;
            
            for (const record of data) {
                if (this.isValidRecord(record)) {
                    const enhancedRecord = await this.enhanceRecord(record);
                    batch.push(enhancedRecord);
                    fileProcessed++;
                    totalProcessed++;
                    
                    // Process in batches for memory efficiency
                    if (batch.length >= this.batchSize) {
                        await this.processBatch(collection, batch);
                        batch = [];
                    }
                }
            }
            
            console.log(`    ✅ Processed ${fileProcessed} records from ${file}`);
            this.stats.jsonRecords += fileProcessed;
        }
        
        // Process remaining batch
        if (batch.length > 0) {
            await this.processBatch(collection, batch);
        }
        
        console.log(`\n  📊 Total processed: ${totalProcessed.toLocaleString()} records`);
        console.log(`  📊 Unique tracks: ${this.stats.uniqueTracks.size.toLocaleString()}`);
        console.log(`  📊 Audio features matched: ${this.stats.audioFeaturesMatched.toLocaleString()}`);
    }

    async createOptimizedIndexes(collection) {
        console.log('  🔧 Creating optimized indexes...');
        
        const indexes = [
            { key: { spotify_track_uri: 1 }, name: 'track_uri_idx' },
            { key: { user_id: 1, ts: -1 }, name: 'user_timeline_idx' },
            { key: { master_metadata_album_artist_name: 1 }, name: 'artist_idx' },
            { key: { ts: -1 }, name: 'timestamp_idx' },
            { key: { platform: 1 }, name: 'platform_idx' },
            { key: { conn_country: 1 }, name: 'country_idx' },
            { key: { skipped: 1, ms_played: -1 }, name: 'listening_behavior_idx' },
            { key: { 'audio_features.genres': 1 }, name: 'genres_idx' },
            { key: { 'audio_features.valence': 1, 'audio_features.energy': 1 }, name: 'mood_idx' },
            { 
                key: { 
                    master_metadata_track_name: 'text', 
                    master_metadata_album_artist_name: 'text',
                    master_metadata_album_album_name: 'text'
                }, 
                name: 'search_text_idx' 
            }
        ];
        
        for (const index of indexes) {
            try {
                await collection.createIndex(index.key, { 
                    name: index.name, 
                    background: true 
                });
            } catch (error) {
                console.log(`    ⚠️  Index ${index.name} already exists or failed to create`);
            }
        }
        
        console.log(`    ✅ Created ${indexes.length} optimized indexes`);
    }

    isValidRecord(record) {
        return record && 
               record.ts && 
               record.master_metadata_track_name && 
               record.master_metadata_album_artist_name &&
               record.spotify_track_uri;
    }

    async enhanceRecord(record) {
        const enhanced = {
            ...record,
            user_id: 'willexmen', // Default user from the data
            processed_at: new Date(),
            listening_session_id: this.generateSessionId(record),
            play_duration_category: this.getPlayTimeCategory(record.ms_played || 0),
            listening_quality_score: this.calculateListeningQuality(record),
            audio_features: null
        };
        
        // Add audio features if available
        if (record.spotify_track_uri && this.audioFeatures.has(record.spotify_track_uri)) {
            enhanced.audio_features = this.audioFeatures.get(record.spotify_track_uri);
            this.stats.audioFeaturesMatched++;
        }
        
        // Track unique songs
        if (record.spotify_track_uri) {
            this.stats.uniqueTracks.add(record.spotify_track_uri);
        }
        
        return enhanced;
    }

    generateSessionId(record) {
        // Generate a session ID based on timestamp, platform, and country
        const date = new Date(record.ts).toISOString().split('T')[0];
        return `${date}_${record.platform}_${record.conn_country}`.replace(/\s+/g, '_');
    }

    getPlayTimeCategory(ms) {
        if (ms === 0) return 'skipped';
        if (ms < 10000) return 'very_short';      // < 10 seconds
        if (ms < 30000) return 'short';           // < 30 seconds  
        if (ms < 120000) return 'medium';         // < 2 minutes
        if (ms < 240000) return 'long';           // < 4 minutes
        return 'full_listen';                     // >= 4 minutes
    }

    calculateListeningQuality(record) {
        let score = 0;
        
        // Base score for valid listen
        if (record.ms_played > 30000) score += 3; // > 30 seconds
        if (record.ms_played > 120000) score += 2; // > 2 minutes
        if (!record.skipped) score += 2;
        if (record.reason_start === 'playbtn') score += 1;
        if (record.reason_end === 'endplay') score += 1;
        if (!record.shuffle) score += 1; // Intentional listening
        
        return Math.min(score, 10); // Cap at 10
    }

    async processBatch(collection, batch) {
        try {
            // Use upsert to handle duplicates
            const operations = batch.map(record => ({
                updateOne: {
                    filter: { 
                        spotify_track_uri: record.spotify_track_uri,
                        ts: record.ts,
                        user_id: record.user_id
                    },
                    update: { $set: record },
                    upsert: true
                }
            }));
            
            const result = await collection.bulkWrite(operations, { ordered: false });
            
            this.stats.mergedRecords += result.upsertedCount + result.modifiedCount;
            this.stats.duplicates += batch.length - result.upsertedCount;
            this.processedBatches++;
            
            if (this.processedBatches % 10 === 0) {
                console.log(`    📊 Processed ${this.processedBatches * this.batchSize} records...`);
            }
            
        } catch (error) {
            console.log(`    ❌ Batch processing error: ${error.message}`);
            this.stats.errors++;
        }
    }

    async optimizeDatabase() {
        console.log('\n🔧 Optimizing database for AI/ML...');
        
        const collection = this.db.collection('enhanced_listening_history');
        
        // Create aggregated collections for ML
        await this.createUserPreferencesAggregate();
        await this.createTrackPopularityAggregate();
        await this.createGenreAnalysisAggregate();
        
        // Update collection stats
        const totalDocs = await collection.countDocuments();
        console.log(`  ✅ Enhanced listening history contains ${totalDocs.toLocaleString()} documents`);
    }

    async createUserPreferencesAggregate() {
        console.log('  📊 Creating user preferences aggregate...');
        
        const collection = this.db.collection('enhanced_listening_history');
        
        try {
            const pipeline = [
                {
                    $group: {
                        _id: '$user_id',
                        total_plays: { $sum: 1 },
                        total_listening_time: { $sum: '$ms_played' },
                        unique_tracks: { $addToSet: '$spotify_track_uri' },
                        unique_artists: { $addToSet: '$master_metadata_album_artist_name' },
                        platforms: { $addToSet: '$platform' },
                        countries: { $addToSet: '$conn_country' },
                        avg_listening_quality: { $avg: '$listening_quality_score' },
                        skip_rate: {
                            $avg: {
                                $cond: [{ $eq: ['$skipped', true] }, 1, 0]
                            }
                        }
                    }
                },
                {
                    $addFields: {
                        unique_tracks_count: { $size: '$unique_tracks' },
                        unique_artists_count: { $size: '$unique_artists' },
                        updated_at: new Date()
                    }
                },
                {
                    $merge: {
                        into: 'user_listening_profiles',
                        whenMatched: 'replace',
                        whenNotMatched: 'insert'
                    }
                }
            ];
            
            await collection.aggregate(pipeline).toArray();
            console.log('    ✅ User preferences aggregate created');
            
        } catch (error) {
            console.log(`    ❌ User preferences aggregate failed: ${error.message}`);
        }
    }

    async createTrackPopularityAggregate() {
        console.log('  📊 Creating track popularity aggregate...');
        
        const collection = this.db.collection('enhanced_listening_history');
        
        try {
            const pipeline = [
                {
                    $group: {
                        _id: '$spotify_track_uri',
                        track_name: { $first: '$master_metadata_track_name' },
                        artist_name: { $first: '$master_metadata_album_artist_name' },
                        album_name: { $first: '$master_metadata_album_album_name' },
                        total_plays: { $sum: 1 },
                        unique_listeners: { $addToSet: '$user_id' },
                        avg_play_duration: { $avg: '$ms_played' },
                        avg_listening_quality: { $avg: '$listening_quality_score' },
                        skip_rate: {
                            $avg: {
                                $cond: [{ $eq: ['$skipped', true] }, 1, 0]
                            }
                        },
                        platforms: { $addToSet: '$platform' },
                        countries: { $addToSet: '$conn_country' },
                        audio_features: { $first: '$audio_features' }
                    }
                },
                {
                    $addFields: {
                        unique_listeners_count: { $size: '$unique_listeners' },
                        popularity_score: {
                            $add: [
                                { $multiply: ['$total_plays', 0.4] },
                                { $multiply: ['$unique_listeners_count', 0.3] },
                                { $multiply: ['$avg_listening_quality', 0.2] },
                                { $multiply: [{ $subtract: [1, '$skip_rate'] }, 0.1] }
                            ]
                        },
                        updated_at: new Date()
                    }
                },
                {
                    $merge: {
                        into: 'track_analytics',
                        whenMatched: 'replace',
                        whenNotMatched: 'insert'
                    }
                }
            ];
            
            await collection.aggregate(pipeline).toArray();
            console.log('    ✅ Track popularity aggregate created');
            
        } catch (error) {
            console.log(`    ❌ Track popularity aggregate failed: ${error.message}`);
        }
    }

    async createGenreAnalysisAggregate() {
        console.log('  📊 Creating genre analysis aggregate...');
        
        const collection = this.db.collection('enhanced_listening_history');
        
        try {
            const pipeline = [
                { $match: { 'audio_features.genres': { $exists: true, $ne: null } } },
                { $unwind: '$audio_features.genres' },
                {
                    $group: {
                        _id: '$audio_features.genres',
                        total_plays: { $sum: 1 },
                        unique_tracks: { $addToSet: '$spotify_track_uri' },
                        unique_artists: { $addToSet: '$master_metadata_album_artist_name' },
                        avg_valence: { $avg: '$audio_features.valence' },
                        avg_energy: { $avg: '$audio_features.energy' },
                        avg_danceability: { $avg: '$audio_features.danceability' },
                        avg_listening_quality: { $avg: '$listening_quality_score' }
                    }
                },
                {
                    $addFields: {
                        unique_tracks_count: { $size: '$unique_tracks' },
                        unique_artists_count: { $size: '$unique_artists' },
                        updated_at: new Date()
                    }
                },
                {
                    $merge: {
                        into: 'genre_analytics',
                        whenMatched: 'replace',
                        whenNotMatched: 'insert'
                    }
                }
            ];
            
            await collection.aggregate(pipeline).toArray();
            console.log('    ✅ Genre analysis aggregate created');
            
        } catch (error) {
            console.log(`    ❌ Genre analysis aggregate failed: ${error.message}`);
        }
    }

    async generateReport() {
        console.log('\n📋 Generating merge report...');
        
        const report = {
            timestamp: new Date().toISOString(),
            process: 'JSON Data Merge',
            stats: {
                json_records_processed: this.stats.jsonRecords,
                unique_tracks_discovered: this.stats.uniqueTracks.size,
                records_merged: this.stats.mergedRecords,
                duplicates_handled: this.stats.duplicates,
                audio_features_matched: this.stats.audioFeaturesMatched,
                audio_features_coverage: Math.round((this.stats.audioFeaturesMatched / this.stats.uniqueTracks.size) * 100),
                errors: this.stats.errors,
                batches_processed: this.processedBatches
            },
            database: {
                enhanced_listening_history: await this.db.collection('enhanced_listening_history').countDocuments(),
                user_listening_profiles: await this.db.collection('user_listening_profiles').countDocuments(),
                track_analytics: await this.db.collection('track_analytics').countDocuments(),
                genre_analytics: await this.db.collection('genre_analytics').countDocuments()
            },
            recommendations: [
                {
                    priority: 'HIGH',
                    action: 'Implement collaborative filtering algorithm',
                    reason: 'Complete listening history now available for recommendation engine'
                },
                {
                    priority: 'MEDIUM', 
                    action: 'Fetch missing audio features',
                    reason: `${100 - Math.round((this.stats.audioFeaturesMatched / this.stats.uniqueTracks.size) * 100)}% of tracks missing audio features`
                },
                {
                    priority: 'LOW',
                    action: 'Implement real-time recommendation updates',
                    reason: 'Database optimized for ML algorithm deployment'
                }
            ]
        };
        
        // Save report
        const reportPath = path.join(__dirname, '..', 'JSON_MERGE_COMPLETE_REPORT.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`✅ Merge report saved to: ${reportPath}`);
        
        // Print summary
        console.log('\n🎯 MERGE SUMMARY:');
        console.log(`  • ${this.stats.jsonRecords.toLocaleString()} JSON records processed`);
        console.log(`  • ${this.stats.uniqueTracks.size.toLocaleString()} unique tracks discovered`);
        console.log(`  • ${this.stats.mergedRecords.toLocaleString()} records merged to database`);
        console.log(`  • ${this.stats.audioFeaturesMatched.toLocaleString()} tracks with audio features (${Math.round((this.stats.audioFeaturesMatched / this.stats.uniqueTracks.size) * 100)}%)`);
        console.log(`  • ${this.processedBatches} batches processed`);
        
        console.log('\n📊 DATABASE STATUS:');
        console.log(`  • Enhanced listening history: ${report.database.enhanced_listening_history.toLocaleString()} documents`);
        console.log(`  • User profiles: ${report.database.user_listening_profiles.toLocaleString()} documents`);
        console.log(`  • Track analytics: ${report.database.track_analytics.toLocaleString()} documents`);
        console.log(`  • Genre analytics: ${report.database.genre_analytics.toLocaleString()} documents`);
        
        return report;
    }
}

// Run merge if called directly
if (require.main === module) {
    const merger = new AdvancedDataMerger();
    merger.run().catch(console.error);
}

module.exports = AdvancedDataMerger;