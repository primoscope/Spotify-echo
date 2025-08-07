#!/usr/bin/env node

/**
 * Data Diagnostic Script
 * 
 * This script analyzes the data mismatch between missing audio features
 * and available CSV data to understand why there's no overlap.
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

class DataDiagnostic {
    constructor() {
        this.connectionString = 'mongodb+srv://copilot:DapperMan77@cluster0.ofnyuy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
        this.client = null;
        
        this.csvTrackUris = new Set();
        this.missingTrackUris = new Set();
        this.dbTrackUris = new Set();
        
        this.sampleMissing = [];
        this.sampleCSV = [];
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

    // Load CSV track URIs
    async loadCSVTrackUris() {
        return new Promise((resolve, reject) => {
            const filePath = path.join('/home/runner/work/Spotify-echo/Spotify-echo/data', 'merged_data_audio_features.csv');
            
            if (!fs.existsSync(filePath)) {
                this.log('CSV file not found', 'error');
                reject(new Error('CSV file not found'));
                return;
            }

            this.log('Loading CSV track URIs...', 'info');
            
            fs.createReadStream(filePath)
                .pipe(csv({
                    mapHeaders: ({ header }) => header.replace(/"/g, '')
                }))
                .on('data', (data) => {
                    const trackUri = data['Track URI'];
                    if (trackUri) {
                        this.csvTrackUris.add(trackUri);
                        if (this.sampleCSV.length < 10) {
                            this.sampleCSV.push({
                                uri: trackUri,
                                name: data['Track Name'] || 'Unknown',
                                artist: data['Artist Name(s)'] || 'Unknown'
                            });
                        }
                    }
                })
                .on('end', () => {
                    this.log(`CSV track URIs loaded: ${this.csvTrackUris.size.toLocaleString()}`, 'success');
                    resolve();
                })
                .on('error', (error) => {
                    this.log(`Error loading CSV: ${error.message}`, 'error');
                    reject(error);
                });
        });
    }

    // Load database track URIs and missing features
    async loadDatabaseTrackUris() {
        try {
            const collection = this.client.db('echotune').collection('spotify_analytics');
            
            this.log('Loading database track URIs...', 'info');
            
            // Get all tracks
            const allCursor = collection.find({}, {
                projection: { track_uri: 1, track_name: 1, artist_name: 1, has_audio_features: 1 }
            });
            
            await allCursor.forEach(doc => {
                if (doc.track_uri) {
                    this.dbTrackUris.add(doc.track_uri);
                }
            });
            
            // Get tracks without audio features
            const missingCursor = collection.find({
                $or: [
                    { has_audio_features: false },
                    { has_audio_features: { $exists: false } },
                    { audio_features: null },
                    { audio_features: { $exists: false } },
                    { 'audio_features.danceability': { $exists: false } }
                ]
            }, {
                projection: { track_uri: 1, track_name: 1, artist_name: 1, has_audio_features: 1 }
            });
            
            await missingCursor.forEach(doc => {
                if (doc.track_uri) {
                    this.missingTrackUris.add(doc.track_uri);
                    if (this.sampleMissing.length < 10) {
                        this.sampleMissing.push({
                            uri: doc.track_uri,
                            name: doc.track_name || 'Unknown',
                            artist: doc.artist_name || 'Unknown',
                            has_features: doc.has_audio_features
                        });
                    }
                }
            });
            
            this.log(`Database tracks loaded: ${this.dbTrackUris.size.toLocaleString()} total, ${this.missingTrackUris.size.toLocaleString()} missing features`, 'success');
            
        } catch (error) {
            this.log(`Error loading database URIs: ${error.message}`, 'error');
            throw error;
        }
    }

    // Analyze data overlap and patterns
    analyzeDataOverlap() {
        this.log('Analyzing data overlap and patterns...', 'debug');
        
        // Find intersections
        const csvInDb = new Set();
        const missingInCsv = new Set();
        const commonPatterns = new Map();
        
        for (const uri of this.csvTrackUris) {
            if (this.dbTrackUris.has(uri)) {
                csvInDb.add(uri);
            }
        }
        
        for (const uri of this.missingTrackUris) {
            if (this.csvTrackUris.has(uri)) {
                missingInCsv.add(uri);
            }
        }
        
        // Analyze URI patterns
        const analyzeUriPattern = (uris, label) => {
            const patterns = new Map();
            for (const uri of Array.from(uris).slice(0, 100)) { // Sample first 100
                if (uri && typeof uri === 'string') {
                    if (uri.startsWith('spotify:track:')) {
                        const id = uri.replace('spotify:track:', '');
                        patterns.set('spotify_track', (patterns.get('spotify_track') || 0) + 1);
                        
                        // Check ID patterns
                        if (id.length === 22) patterns.set('id_22_chars', (patterns.get('id_22_chars') || 0) + 1);
                        if (/^[a-zA-Z0-9]+$/.test(id)) patterns.set('alphanumeric_id', (patterns.get('alphanumeric_id') || 0) + 1);
                    } else {
                        patterns.set('non_spotify', (patterns.get('non_spotify') || 0) + 1);
                    }
                } else {
                    patterns.set('invalid_uri', (patterns.get('invalid_uri') || 0) + 1);
                }
            }
            this.log(`${label} URI patterns:`, 'debug');
            for (const [pattern, count] of patterns) {
                this.log(`  ${pattern}: ${count}`, 'debug');
            }
            return patterns;
        };
        
        analyzeUriPattern(this.csvTrackUris, 'CSV');
        analyzeUriPattern(this.missingTrackUris, 'Missing');
        
        const report = {
            timestamp: new Date().toISOString(),
            data_analysis: {
                csv_tracks: this.csvTrackUris.size,
                database_tracks: this.dbTrackUris.size,
                missing_features_tracks: this.missingTrackUris.size,
                csv_in_database: csvInDb.size,
                missing_in_csv: missingInCsv.size,
                overlap_percentage: this.missingTrackUris.size > 0 ? 
                    (missingInCsv.size / this.missingTrackUris.size * 100).toFixed(2) : 0
            },
            sample_data: {
                csv_samples: this.sampleCSV,
                missing_samples: this.sampleMissing
            },
            analysis_results: {
                has_overlap: missingInCsv.size > 0,
                overlap_count: missingInCsv.size,
                potential_issues: [
                    missingInCsv.size === 0 ? 'No overlap between missing tracks and CSV data' : null,
                    csvInDb.size < this.csvTrackUris.size * 0.5 ? 'Low CSV to database matching' : null,
                    this.missingTrackUris.size > this.dbTrackUris.size * 0.2 ? 'High percentage of missing features' : null
                ].filter(Boolean)
            },
            recommendations: missingInCsv.size === 0 ? [
                'Investigate if CSV data contains different tracks than database',
                'Check if track URIs use different format or encoding',
                'Consider using track name + artist matching as fallback',
                'Use Spotify Web API to fetch missing audio features directly'
            ] : [
                `Process ${missingInCsv.size} overlapping tracks with available features`,
                'Investigate remaining tracks for alternative data sources',
                'Implement Spotify API fallback for remaining missing features'
            ]
        };
        
        // Save diagnostic report
        const reportPath = '/home/runner/work/Spotify-echo/Spotify-echo/DATA_DIAGNOSTIC_REPORT.json';
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        this.log(`Diagnostic report saved to: ${reportPath}`, 'success');
        
        // Log key findings
        this.log('='.repeat(60), 'info');
        this.log('DATA DIAGNOSTIC ANALYSIS RESULTS', 'success');
        this.log('='.repeat(60), 'info');
        this.log(`📊 CSV Tracks: ${report.data_analysis.csv_tracks.toLocaleString()}`, 'info');
        this.log(`📊 Database Tracks: ${report.data_analysis.database_tracks.toLocaleString()}`, 'info');
        this.log(`📊 Missing Features: ${report.data_analysis.missing_features_tracks.toLocaleString()}`, 'info');
        this.log(`📊 CSV in Database: ${report.data_analysis.csv_in_database.toLocaleString()}`, 'info');
        this.log(`📊 Missing in CSV: ${report.data_analysis.missing_in_csv.toLocaleString()}`, 'info');
        this.log(`📊 Overlap Rate: ${report.data_analysis.overlap_percentage}%`, 'info');
        this.log('='.repeat(60), 'info');
        
        if (report.analysis_results.potential_issues.length > 0) {
            this.log('🔍 Potential Issues:', 'warn');
            for (const issue of report.analysis_results.potential_issues) {
                this.log(`  - ${issue}`, 'warn');
            }
        }
        
        this.log('💡 Recommendations:', 'info');
        for (const rec of report.recommendations) {
            this.log(`  - ${rec}`, 'info');
        }
        
        return report;
    }

    // Main execution
    async diagnose() {
        try {
            this.log('Starting Data Diagnostic Analysis...', 'success');
            
            const connected = await this.connect();
            if (!connected) {
                throw new Error('Failed to connect to MongoDB');
            }
            
            await this.loadCSVTrackUris();
            await this.loadDatabaseTrackUris();
            
            const report = this.analyzeDataOverlap();
            
            return report;
            
        } catch (error) {
            this.log(`Diagnostic failed: ${error.message}`, 'error');
            throw error;
        } finally {
            await this.disconnect();
        }
    }
}

// Execute if run directly
if (require.main === module) {
    const diagnostic = new DataDiagnostic();
    diagnostic.diagnose()
        .then((report) => {
            console.log('Data diagnostic completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Diagnostic failed:', error);
            process.exit(1);
        });
}

module.exports = DataDiagnostic;