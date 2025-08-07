#!/usr/bin/env node

/**
 * Enhanced Data Processing Script for EchoTune AI
 * 
 * This script processes the new data files in the data/ folder:
 * 1. merged_data_audio_features.csv - Master audio features dataset (57,232 tracks)
 * 2. spotify_listening_history_combined.csv - Listening history with user interactions (208,934 records)
 * 3. Merged Data With Audio Features (1) (1).csv - Additional merged data
 * 
 * Creates a comprehensive merged dataset that correctly maps listening history to audio features
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { MongoClient } = require('mongodb');

class EnhancedDataProcessor {
    constructor() {
        this.connectionString = 'mongodb+srv://copilot:DapperMan77@cluster0.ofnyuy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
        this.databaseName = 'echotune';
        this.targetCollection = 'spotify_analytics';
        
        this.client = null;
        this.db = null;
        
        this.audioFeaturesMap = new Map(); // Track URI -> Audio Features
        this.listeningHistory = [];
        this.mergedData = [];
        
        this.stats = {
            audioFeaturesLoaded: 0,
            listeningHistoryLoaded: 0,
            mergedRecords: 0,
            totalInserted: 0,
            uniqueTracks: 0,
            uniqueArtists: 0,
            errors: 0
        };
    }

    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = {
            info: '✅',
            warn: '⚠️',
            error: '❌',
            debug: '🔍',
            success: '🎉'
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

    // Load master audio features dataset
    async loadAudioFeatures() {
        return new Promise((resolve, reject) => {
            const filePath = path.join('/home/runner/work/Spotify-echo/Spotify-echo/data', 'merged_data_audio_features.csv');
            this.log(`Loading audio features from: ${filePath}`, 'info');
            
            const results = [];
            fs.createReadStream(filePath)
                .pipe(csv({
                    mapHeaders: ({ header }) => header.replace(/"/g, '') // Remove quotes
                }))
                .on('data', (data) => {
                    try {
                        const trackUri = data['Track URI'];
                        if (trackUri && data.Danceability) {
                            this.audioFeaturesMap.set(trackUri, {
                                track_uri: trackUri,
                                track_name: data['Track Name'] || '',
                                artist_name: data['Artist Name(s)'] || '',
                                album_name: data['Album Name'] || '',
                                artist_uri: data['Artist URI(s)'] || '',
                                album_uri: data['Album URI'] || '',
                                release_date: data['Album Release Date'] || '',
                                duration_ms: parseInt(data['Track Duration (ms)']) || 0,
                                explicit: data.Explicit === 'true',
                                popularity: parseInt(data.Popularity) || 0,
                                preview_url: data['Track Preview URL'] || null,
                                
                                // Audio Features
                                danceability: parseFloat(data.Danceability) || 0,
                                energy: parseFloat(data.Energy) || 0,
                                key: parseInt(data.Key) || 0,
                                loudness: parseFloat(data.Loudness) || 0,
                                mode: parseInt(data.Mode) || 0,
                                speechiness: parseFloat(data.Speechiness) || 0,
                                acousticness: parseFloat(data.Acousticness) || 0,
                                instrumentalness: parseFloat(data.Instrumentalness) || 0,
                                liveness: parseFloat(data.Liveness) || 0,
                                valence: parseFloat(data.Valence) || 0,
                                tempo: parseFloat(data.Tempo) || 0,
                                time_signature: parseInt(data['Time Signature']) || 4,
                                
                                // Additional metadata
                                genres: data['Artist Genres'] ? data['Artist Genres'].split(',').map(g => g.trim()) : [],
                                album_genres: data['Album Genres'] ? data['Album Genres'].split(',').map(g => g.trim()) : [],
                                label: data.Label || '',
                                isrc: data.ISRC || ''
                            });
                            this.stats.audioFeaturesLoaded++;
                        }
                    } catch (error) {
                        this.log(`Error processing audio features row: ${error.message}`, 'warn');
                        this.stats.errors++;
                    }
                })
                .on('end', () => {
                    this.log(`Audio features loaded: ${this.stats.audioFeaturesLoaded} tracks`, 'success');
                    resolve();
                })
                .on('error', (error) => {
                    this.log(`Error loading audio features: ${error.message}`, 'error');
                    reject(error);
                });
        });
    }

    // Load listening history data
    async loadListeningHistory() {
        return new Promise((resolve, reject) => {
            const filePath = path.join('/home/runner/work/Spotify-echo/Spotify-echo/data', 'spotify_listening_history_combined.csv');
            this.log(`Loading listening history from: ${filePath}`, 'info');
            
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (data) => {
                    try {
                        const trackUri = data.spotify_track_uri;
                        if (trackUri && data.username) {
                            this.listeningHistory.push({
                                track_uri: trackUri,
                                user_id: data.username,
                                timestamp: data.ts_x || data.ts_y,
                                ms_played: parseInt(data.ms_played_x || data.ms_played_y) || 0,
                                platform: data.platform || 'unknown',
                                country: data.conn_country || '',
                                reason_start: data.reason_start || '',
                                reason_end: data.reason_end || '',
                                shuffle: data.shuffle === 'True',
                                skipped: data.skipped === 'True',
                                offline: data.offline === 'True',
                                
                                // Track metadata from listening history
                                track_name_history: data.master_metadata_track_name_x || data.master_metadata_track_name_y || '',
                                artist_name_history: data.master_metadata_album_artist_name_x || data.master_metadata_album_artist_name_y || '',
                                album_name_history: data.master_metadata_album_album_name_x || data.master_metadata_album_album_name_y || ''
                            });
                            this.stats.listeningHistoryLoaded++;
                        }
                    } catch (error) {
                        this.log(`Error processing listening history row: ${error.message}`, 'warn');
                        this.stats.errors++;
                    }
                })
                .on('end', () => {
                    this.log(`Listening history loaded: ${this.stats.listeningHistoryLoaded} records`, 'success');
                    resolve();
                })
                .on('error', (error) => {
                    this.log(`Error loading listening history: ${error.message}`, 'error');
                    reject(error);
                });
        });
    }

    // Merge listening history with audio features
    async mergeData() {
        this.log('Starting data merge process...', 'info');
        
        const trackStats = new Map();
        const artistSet = new Set();
        
        // First, create records for all tracks with audio features
        for (const [trackUri, audioFeatures] of this.audioFeaturesMap) {
            const mergedRecord = {
                _id: `track_${trackUri.replace('spotify:track:', '')}`,
                track_uri: trackUri,
                track_id: trackUri.replace('spotify:track:', ''),
                
                // Track information
                track_name: audioFeatures.track_name,
                artist_name: audioFeatures.artist_name,
                album_name: audioFeatures.album_name,
                artist_uri: audioFeatures.artist_uri,
                album_uri: audioFeatures.album_uri,
                
                // Track metadata
                release_date: audioFeatures.release_date,
                duration_ms: audioFeatures.duration_ms,
                explicit: audioFeatures.explicit,
                popularity: audioFeatures.popularity,
                preview_url: audioFeatures.preview_url,
                
                // Audio features
                audio_features: {
                    danceability: audioFeatures.danceability,
                    energy: audioFeatures.energy,
                    key: audioFeatures.key,
                    loudness: audioFeatures.loudness,
                    mode: audioFeatures.mode,
                    speechiness: audioFeatures.speechiness,
                    acousticness: audioFeatures.acousticness,
                    instrumentalness: audioFeatures.instrumentalness,
                    liveness: audioFeatures.liveness,
                    valence: audioFeatures.valence,
                    tempo: audioFeatures.tempo,
                    time_signature: audioFeatures.time_signature
                },
                
                // Genre and metadata
                genres: audioFeatures.genres,
                album_genres: audioFeatures.album_genres,
                label: audioFeatures.label,
                isrc: audioFeatures.isrc,
                
                // Listening statistics (will be populated)
                listening_stats: {
                    total_plays: 0,
                    total_ms_played: 0,
                    unique_users: 0,
                    skip_rate: 0,
                    avg_completion_rate: 0,
                    platforms: {},
                    countries: {},
                    first_played: null,
                    last_played: null
                },
                
                // User interactions (sample for performance)
                user_interactions: [],
                
                // Processing metadata
                data_quality_score: 0,
                has_audio_features: true,
                has_listening_data: false,
                created_at: new Date(),
                updated_at: new Date()
            };
            
            this.mergedData.push(mergedRecord);
            artistSet.add(audioFeatures.artist_name);
        }
        
        // Now merge listening history data
        const userInteractionsByTrack = new Map();
        
        for (const historyRecord of this.listeningHistory) {
            const trackUri = historyRecord.track_uri;
            const audioFeatures = this.audioFeaturesMap.get(trackUri);
            
            if (!audioFeatures) {
                // Track has listening data but no audio features - create minimal record
                const minimalRecord = {
                    _id: `track_${trackUri.replace('spotify:track:', '')}`,
                    track_uri: trackUri,
                    track_id: trackUri.replace('spotify:track:', ''),
                    
                    // Use data from listening history
                    track_name: historyRecord.track_name_history,
                    artist_name: historyRecord.artist_name_history,
                    album_name: historyRecord.album_name_history,
                    
                    // No audio features available
                    audio_features: null,
                    has_audio_features: false,
                    has_listening_data: true,
                    
                    listening_stats: {
                        total_plays: 0,
                        total_ms_played: 0,
                        unique_users: 0,
                        platforms: {},
                        countries: {}
                    },
                    user_interactions: [],
                    created_at: new Date(),
                    updated_at: new Date()
                };
                
                this.mergedData.push(minimalRecord);
                this.audioFeaturesMap.set(trackUri, { track_name: historyRecord.track_name_history });
                artistSet.add(historyRecord.artist_name_history);
            }
            
            // Aggregate listening statistics
            if (!userInteractionsByTrack.has(trackUri)) {
                userInteractionsByTrack.set(trackUri, []);
            }
            userInteractionsByTrack.get(trackUri).push(historyRecord);
        }
        
        // Process listening statistics for each track
        for (const mergedRecord of this.mergedData) {
            const interactions = userInteractionsByTrack.get(mergedRecord.track_uri) || [];
            
            if (interactions.length > 0) {
                mergedRecord.has_listening_data = true;
                
                const userSet = new Set();
                const platformCounts = {};
                const countryCounts = {};
                let totalMsPlayed = 0;
                let totalPlays = interactions.length;
                let skippedCount = 0;
                let timestamps = [];
                
                for (const interaction of interactions) {
                    userSet.add(interaction.user_id);
                    totalMsPlayed += interaction.ms_played;
                    
                    if (interaction.skipped) skippedCount++;
                    
                    platformCounts[interaction.platform] = (platformCounts[interaction.platform] || 0) + 1;
                    if (interaction.country) {
                        countryCounts[interaction.country] = (countryCounts[interaction.country] || 0) + 1;
                    }
                    
                    if (interaction.timestamp) {
                        timestamps.push(new Date(interaction.timestamp));
                    }
                }
                
                timestamps.sort();
                
                mergedRecord.listening_stats = {
                    total_plays: totalPlays,
                    total_ms_played: totalMsPlayed,
                    unique_users: userSet.size,
                    skip_rate: totalPlays > 0 ? (skippedCount / totalPlays) : 0,
                    avg_completion_rate: mergedRecord.duration_ms > 0 ? (totalMsPlayed / totalPlays) / mergedRecord.duration_ms : 0,
                    platforms: platformCounts,
                    countries: countryCounts,
                    first_played: timestamps.length > 0 ? timestamps[0] : null,
                    last_played: timestamps.length > 0 ? timestamps[timestamps.length - 1] : null
                };
                
                // Store sample user interactions (limit to prevent document size issues)
                mergedRecord.user_interactions = interactions.slice(0, 50).map(interaction => ({
                    user_id: interaction.user_id,
                    timestamp: interaction.timestamp,
                    ms_played: interaction.ms_played,
                    platform: interaction.platform,
                    skipped: interaction.skipped,
                    reason_start: interaction.reason_start,
                    reason_end: interaction.reason_end
                }));
            }
            
            // Calculate data quality score
            let qualityScore = 0;
            if (mergedRecord.has_audio_features) qualityScore += 50;
            if (mergedRecord.has_listening_data) qualityScore += 30;
            if (mergedRecord.track_name && mergedRecord.artist_name) qualityScore += 20;
            mergedRecord.data_quality_score = qualityScore;
        }
        
        this.stats.mergedRecords = this.mergedData.length;
        this.stats.uniqueTracks = this.mergedData.length;
        this.stats.uniqueArtists = artistSet.size;
        
        this.log(`Data merge completed: ${this.stats.mergedRecords} merged records`, 'success');
        this.log(`Unique tracks: ${this.stats.uniqueTracks}, Unique artists: ${this.stats.uniqueArtists}`, 'info');
    }

    // Insert data into MongoDB with optimization
    async insertToMongoDB() {
        try {
            const collection = this.db.collection(this.targetCollection);
            
            // Clear existing data
            this.log('Clearing existing spotify_analytics collection...', 'info');
            await collection.deleteMany({});
            
            // Batch insert for performance
            const batchSize = 1000;
            let insertedCount = 0;
            
            for (let i = 0; i < this.mergedData.length; i += batchSize) {
                const batch = this.mergedData.slice(i, i + batchSize);
                
                try {
                    await collection.insertMany(batch, { ordered: false });
                    insertedCount += batch.length;
                    
                    if (insertedCount % 5000 === 0) {
                        this.log(`Inserted ${insertedCount}/${this.mergedData.length} records`, 'info');
                    }
                } catch (error) {
                    this.log(`Batch insert error (continuing): ${error.message}`, 'warn');
                    this.stats.errors++;
                }
            }
            
            this.stats.totalInserted = insertedCount;
            this.log(`Successfully inserted ${insertedCount} records into ${this.targetCollection}`, 'success');
            
            // Create optimized indexes
            await this.createIndexes();
            
        } catch (error) {
            this.log(`MongoDB insertion failed: ${error.message}`, 'error');
            throw error;
        }
    }

    // Create optimized database indexes
    async createIndexes() {
        try {
            const collection = this.db.collection(this.targetCollection);
            
            const indexes = [
                { key: { track_uri: 1 }, name: 'track_uri_idx' },
                { key: { track_id: 1 }, name: 'track_id_idx' },
                { key: { artist_name: 1 }, name: 'artist_name_idx' },
                { key: { track_name: 1 }, name: 'track_name_idx' },
                { key: { 'listening_stats.total_plays': -1 }, name: 'popularity_idx' },
                { key: { 'audio_features.danceability': 1 }, name: 'danceability_idx' },
                { key: { 'audio_features.energy': 1 }, name: 'energy_idx' },
                { key: { 'audio_features.valence': 1 }, name: 'valence_idx' },
                { key: { genres: 1 }, name: 'genres_idx' },
                { key: { data_quality_score: -1 }, name: 'quality_score_idx' },
                { key: { has_audio_features: 1, has_listening_data: 1 }, name: 'data_completeness_idx' },
                { key: { created_at: -1 }, name: 'created_at_idx' }
            ];
            
            this.log('Creating database indexes...', 'info');
            
            for (const index of indexes) {
                try {
                    await collection.createIndex(index.key, { name: index.name, background: true });
                    this.log(`Created index: ${index.name}`, 'debug');
                } catch (error) {
                    if (!error.message.includes('already exists')) {
                        this.log(`Index creation warning: ${error.message}`, 'warn');
                    }
                }
            }
            
            this.log(`Successfully created ${indexes.length} database indexes`, 'success');
            
        } catch (error) {
            this.log(`Error creating indexes: ${error.message}`, 'error');
            throw error;
        }
    }

    // Generate comprehensive report
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            processing_summary: {
                audio_features_loaded: this.stats.audioFeaturesLoaded,
                listening_history_loaded: this.stats.listeningHistoryLoaded,
                merged_records: this.stats.mergedRecords,
                total_inserted: this.stats.totalInserted,
                unique_tracks: this.stats.uniqueTracks,
                unique_artists: this.stats.uniqueArtists,
                errors_encountered: this.stats.errors
            },
            data_quality: {
                records_with_audio_features: this.mergedData.filter(r => r.has_audio_features).length,
                records_with_listening_data: this.mergedData.filter(r => r.has_listening_data).length,
                high_quality_records: this.mergedData.filter(r => r.data_quality_score >= 80).length,
                medium_quality_records: this.mergedData.filter(r => r.data_quality_score >= 50 && r.data_quality_score < 80).length,
                low_quality_records: this.mergedData.filter(r => r.data_quality_score < 50).length
            }
        };
        
        // Save report
        const reportPath = '/home/runner/work/Spotify-echo/Spotify-echo/ENHANCED_DATA_PROCESSING_REPORT.json';
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        this.log(`Processing report saved to: ${reportPath}`, 'info');
        
        // Log summary
        this.log('='.repeat(80), 'info');
        this.log('ENHANCED DATA PROCESSING COMPLETE', 'success');
        this.log('='.repeat(80), 'info');
        this.log(`✅ Audio features loaded: ${report.processing_summary.audio_features_loaded}`, 'info');
        this.log(`✅ Listening history loaded: ${report.processing_summary.listening_history_loaded}`, 'info');
        this.log(`✅ Total merged records: ${report.processing_summary.merged_records}`, 'info');
        this.log(`✅ Records inserted to MongoDB: ${report.processing_summary.total_inserted}`, 'info');
        this.log(`✅ Unique tracks: ${report.processing_summary.unique_tracks}`, 'info');
        this.log(`✅ Unique artists: ${report.processing_summary.unique_artists}`, 'info');
        this.log(`📊 High quality records (80%+): ${report.data_quality.high_quality_records}`, 'info');
        this.log(`📊 Medium quality records (50-79%): ${report.data_quality.medium_quality_records}`, 'info');
        this.log(`📊 Low quality records (<50%): ${report.data_quality.low_quality_records}`, 'info');
        this.log('='.repeat(80), 'info');
        
        return report;
    }

    // Main execution method
    async process() {
        try {
            this.log('Starting Enhanced Data Processing for EchoTune AI...', 'success');
            
            // Step 1: Connect to MongoDB
            const connected = await this.connect();
            if (!connected) {
                throw new Error('Failed to connect to MongoDB');
            }
            
            // Step 2: Load audio features (master dataset)
            await this.loadAudioFeatures();
            
            // Step 3: Load listening history
            await this.loadListeningHistory();
            
            // Step 4: Merge data intelligently
            await this.mergeData();
            
            // Step 5: Insert into MongoDB with optimization
            await this.insertToMongoDB();
            
            // Step 6: Generate comprehensive report
            this.generateReport();
            
            this.log('Enhanced data processing completed successfully!', 'success');
            
        } catch (error) {
            this.log(`Processing failed: ${error.message}`, 'error');
            throw error;
        } finally {
            await this.disconnect();
        }
    }
}

// Execute if run directly
if (require.main === module) {
    const processor = new EnhancedDataProcessor();
    processor.process()
        .then(() => {
            console.log('Enhanced data processing completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Enhanced data processing failed:', error);
            process.exit(1);
        });
}

module.exports = EnhancedDataProcessor;