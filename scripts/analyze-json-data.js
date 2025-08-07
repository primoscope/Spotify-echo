#!/usr/bin/env node
/**
 * Comprehensive Analysis of New Spotify JSON Export Data
 * Compares with existing CSV files and MongoDB data
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { MongoClient } = require('mongodb');

class SpotifyDataAnalyzer {
    constructor() {
        this.dataDir = path.join(__dirname, '..', 'data');
        this.jsonFiles = [];
        this.csvData = new Map();
        this.jsonData = {
            totalRecords: 0,
            uniqueTracks: new Set(),
            uniqueArtists: new Set(),
            uniqueAlbums: new Set(),
            platforms: new Set(),
            countries: new Set(),
            yearRange: { min: null, max: null },
            playTimeDistribution: {},
            records: []
        };
    }

    async analyze() {
        console.log('🎵 Starting Comprehensive Spotify Data Analysis...\n');
        
        try {
            await this.findJsonFiles();
            await this.loadCsvData();
            await this.analyzeJsonFiles();
            await this.compareWithMongoDB();
            await this.generateReport();
        } catch (error) {
            console.error('❌ Analysis failed:', error.message);
            throw error;
        }
    }

    async findJsonFiles() {
        console.log('📂 Finding JSON files in data directory...');
        
        const files = fs.readdirSync(this.dataDir);
        this.jsonFiles = files.filter(file => 
            file.endsWith('.json') && file.includes('Streaming_History_Audio')
        );
        
        console.log(`Found ${this.jsonFiles.length} JSON files:`);
        this.jsonFiles.forEach(file => console.log(`  - ${file}`));
        console.log();
    }

    async loadCsvData() {
        console.log('📊 Loading existing CSV data...');
        
        // Load merged data with audio features
        const csvFile = path.join(this.dataDir, 'merged_data_audio_features.csv');
        if (fs.existsSync(csvFile)) {
            const csvRecords = [];
            
            await new Promise((resolve, reject) => {
                fs.createReadStream(csvFile)
                    .pipe(csv())
                    .on('data', (row) => csvRecords.push(row))
                    .on('end', resolve)
                    .on('error', reject);
            });
            
            this.csvData.set('audio_features', csvRecords);
            console.log(`  ✅ Loaded ${csvRecords.length} records from merged_data_audio_features.csv`);
        }
        
        // Load listening history CSV
        const historyFile = path.join(this.dataDir, 'spotify_listening_history_combined.csv');
        if (fs.existsSync(historyFile)) {
            const historyRecords = [];
            
            await new Promise((resolve, reject) => {
                fs.createReadStream(historyFile)
                    .pipe(csv())
                    .on('data', (row) => historyRecords.push(row))
                    .on('end', resolve)
                    .on('error', reject);
            });
            
            this.csvData.set('listening_history', historyRecords);
            console.log(`  ✅ Loaded ${historyRecords.length} records from listening_history.csv`);
        }
        
        console.log();
    }

    async analyzeJsonFiles() {
        console.log('🔍 Analyzing JSON files...');
        
        let processedFiles = 0;
        
        for (const file of this.jsonFiles) {
            console.log(`  Processing ${file}...`);
            const filePath = path.join(this.dataDir, file);
            
            try {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                
                if (!Array.isArray(data)) {
                    console.log(`    ⚠️  File ${file} is not an array, skipping...`);
                    continue;
                }
                
                let fileRecords = 0;
                
                for (const record of data) {
                    if (this.isValidRecord(record)) {
                        this.jsonData.records.push(record);
                        fileRecords++;
                        
                        // Extract unique data
                        if (record.spotify_track_uri) {
                            this.jsonData.uniqueTracks.add(record.spotify_track_uri);
                        }
                        
                        if (record.master_metadata_album_artist_name) {
                            this.jsonData.uniqueArtists.add(record.master_metadata_album_artist_name);
                        }
                        
                        if (record.master_metadata_album_album_name) {
                            this.jsonData.uniqueAlbums.add(record.master_metadata_album_album_name);
                        }
                        
                        if (record.platform) {
                            this.jsonData.platforms.add(record.platform);
                        }
                        
                        if (record.conn_country) {
                            this.jsonData.countries.add(record.conn_country);
                        }
                        
                        // Track year range
                        if (record.ts) {
                            const year = new Date(record.ts).getFullYear();
                            if (!this.jsonData.yearRange.min || year < this.jsonData.yearRange.min) {
                                this.jsonData.yearRange.min = year;
                            }
                            if (!this.jsonData.yearRange.max || year > this.jsonData.yearRange.max) {
                                this.jsonData.yearRange.max = year;
                            }
                        }
                        
                        // Track play time distribution
                        const playTime = record.ms_played || 0;
                        const timeCategory = this.getPlayTimeCategory(playTime);
                        this.jsonData.playTimeDistribution[timeCategory] = 
                            (this.jsonData.playTimeDistribution[timeCategory] || 0) + 1;
                    }
                }
                
                console.log(`    ✅ Processed ${fileRecords} valid records from ${file}`);
                this.jsonData.totalRecords += fileRecords;
                processedFiles++;
                
            } catch (error) {
                console.log(`    ❌ Error processing ${file}: ${error.message}`);
            }
        }
        
        console.log(`\n📊 JSON Analysis Complete:`);
        console.log(`  - Files processed: ${processedFiles}/${this.jsonFiles.length}`);
        console.log(`  - Total records: ${this.jsonData.totalRecords}`);
        console.log(`  - Unique tracks: ${this.jsonData.uniqueTracks.size}`);
        console.log(`  - Unique artists: ${this.jsonData.uniqueArtists.size}`);
        console.log(`  - Unique albums: ${this.jsonData.uniqueAlbums.size}`);
        console.log(`  - Platforms: ${Array.from(this.jsonData.platforms).join(', ')}`);
        console.log(`  - Countries: ${Array.from(this.jsonData.countries).join(', ')}`);
        console.log(`  - Year range: ${this.jsonData.yearRange.min} - ${this.jsonData.yearRange.max}`);
        console.log();
    }

    isValidRecord(record) {
        return record && 
               record.ts && 
               record.master_metadata_track_name && 
               record.master_metadata_album_artist_name;
    }

    getPlayTimeCategory(ms) {
        if (ms === 0) return 'skipped';
        if (ms < 10000) return 'very_short';      // < 10 seconds
        if (ms < 30000) return 'short';           // < 30 seconds  
        if (ms < 120000) return 'medium';         // < 2 minutes
        if (ms < 240000) return 'long';           // < 4 minutes
        return 'full_listen';                     // >= 4 minutes
    }

    async compareWithMongoDB() {
        console.log('🗃️  Comparing with MongoDB data...');
        
        let client;
        try {
            if (!process.env.MONGODB_URI) {
                console.log('  ⚠️  MongoDB URI not found, skipping database comparison');
                return;
            }
            
            client = new MongoClient(process.env.MONGODB_URI);
            await client.connect();
            console.log('  ✅ Connected to MongoDB');
            
            const db = client.db('echotune');
            const collections = await db.listCollections().toArray();
            
            console.log(`  📊 MongoDB Collections:`);
            for (const collection of collections) {
                const count = await db.collection(collection.name).countDocuments();
                console.log(`    - ${collection.name}: ${count} documents`);
            }
            
            // Compare tracks
            if (collections.some(c => c.name === 'spotify_analytics')) {
                const mongoTracks = await db.collection('spotify_analytics')
                    .distinct('Track URI');
                
                const commonTracks = Array.from(this.jsonData.uniqueTracks)
                    .filter(track => mongoTracks.includes(track));
                
                console.log(`\n  🔄 Track Overlap Analysis:`);
                console.log(`    - JSON tracks: ${this.jsonData.uniqueTracks.size}`);
                console.log(`    - MongoDB tracks: ${mongoTracks.length}`);
                console.log(`    - Common tracks: ${commonTracks.length}`);
                console.log(`    - New JSON tracks: ${this.jsonData.uniqueTracks.size - commonTracks.length}`);
            }
            
        } catch (error) {
            console.log(`  ❌ MongoDB comparison failed: ${error.message}`);
        } finally {
            if (client) await client.close();
        }
        
        console.log();
    }

    async generateReport() {
        console.log('📋 Generating Comprehensive Report...\n');
        
        const report = {
            timestamp: new Date().toISOString(),
            analysis: {
                json_files: {
                    count: this.jsonFiles.length,
                    total_records: this.jsonData.totalRecords,
                    unique_tracks: this.jsonData.uniqueTracks.size,
                    unique_artists: this.jsonData.uniqueArtists.size,
                    unique_albums: this.jsonData.uniqueAlbums.size,
                    year_range: this.jsonData.yearRange,
                    platforms: Array.from(this.jsonData.platforms),
                    countries: Array.from(this.jsonData.countries),
                    play_time_distribution: this.jsonData.playTimeDistribution
                },
                csv_files: {
                    audio_features_records: this.csvData.get('audio_features')?.length || 0,
                    listening_history_records: this.csvData.get('listening_history')?.length || 0
                }
            },
            recommendations: []
        };
        
        // Generate recommendations
        if (this.jsonData.totalRecords > (this.csvData.get('listening_history')?.length || 0)) {
            report.recommendations.push({
                priority: 'HIGH',
                action: 'Merge JSON data with existing database',
                reason: `JSON files contain ${this.jsonData.totalRecords} records vs ${this.csvData.get('listening_history')?.length || 0} in CSV`,
                impact: 'Significantly more comprehensive listening history'
            });
        }
        
        if (this.jsonData.uniqueTracks.size > (this.csvData.get('audio_features')?.length || 0)) {
            report.recommendations.push({
                priority: 'MEDIUM',
                action: 'Fetch audio features for new tracks',
                reason: `${this.jsonData.uniqueTracks.size} unique tracks found vs ${this.csvData.get('audio_features')?.length || 0} with audio features`,
                impact: 'Better recommendation accuracy'
            });
        }
        
        report.recommendations.push({
            priority: 'HIGH',
            action: 'Implement incremental data processing',
            reason: 'Large dataset requires efficient processing pipeline',
            impact: 'Better performance and scalability'
        });
        
        // Save report
        const reportPath = path.join(__dirname, '..', 'JSON_DATA_ANALYSIS_REPORT.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log('✅ Analysis Complete!');
        console.log(`📊 Report saved to: ${reportPath}`);
        
        // Print summary
        console.log('\n🎯 KEY FINDINGS:');
        console.log(`  • ${this.jsonData.totalRecords.toLocaleString()} total listening records in JSON files`);
        console.log(`  • ${this.jsonData.uniqueTracks.size.toLocaleString()} unique tracks discovered`);
        console.log(`  • ${this.jsonData.uniqueArtists.size.toLocaleString()} unique artists`);
        console.log(`  • ${this.jsonData.yearRange.min}-${this.jsonData.yearRange.max} listening history span`);
        console.log(`  • ${Array.from(this.jsonData.platforms).length} different platforms`);
        
        console.log('\n🚀 NEXT STEPS:');
        report.recommendations.forEach((rec, index) => {
            console.log(`  ${index + 1}. [${rec.priority}] ${rec.action}`);
            console.log(`     ${rec.reason}`);
        });
        
        return report;
    }
}

// Run analysis if called directly
if (require.main === module) {
    const analyzer = new SpotifyDataAnalyzer();
    analyzer.analyze().catch(console.error);
}

module.exports = SpotifyDataAnalyzer;