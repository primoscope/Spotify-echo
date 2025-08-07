#!/usr/bin/env node

/**
 * Enhanced Audio Features Populator
 * 
 * This script specifically focuses on populating missing audio features
 * for tracks that exist in the primary database but lack audio features,
 * using the available audio features from CSV files.
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

class AudioFeaturesEnhancer {
    constructor() {
        this.connectionString = 'mongodb+srv://copilot:DapperMan77@cluster0.ofnyuy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
        this.client = null;
        
        this.audioFeaturesMap = new Map(); // Track URI -> Audio Features from CSV
        this.tracksWithoutFeatures = []; // Tracks missing audio features
        this.enhancementCandidates = []; // Tracks that can be enhanced
        
        this.stats = {
            csvFeaturesLoaded: 0,
            tracksWithoutFeatures: 0,
            enhancementCandidates: 0,
            featuresEnhanced: 0,
            tracksUpdated: 0,
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
            success: '🎉',
            enhance: '🚀'
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

    // Load all available audio features from CSV
    async loadAvailableAudioFeatures() {
        return new Promise((resolve, reject) => {
            const filePath = path.join('/home/runner/work/Spotify-echo/Spotify-echo/data', 'merged_data_audio_features.csv');
            
            if (!fs.existsSync(filePath)) {
                this.log('Audio features CSV file not found', 'error');
                reject(new Error('CSV file not found'));
                return;
            }

            this.log(`Loading available audio features from: ${filePath}`, 'info');
            
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
                                
                                // Core audio features
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
                            this.stats.csvFeaturesLoaded++;
                        }
                    } catch (error) {
                        this.log(`Error processing CSV row: ${error.message}`, 'warn');
                        this.stats.errors++;
                    }
                })
                .on('end', () => {
                    this.log(`Audio features loaded: ${this.stats.csvFeaturesLoaded.toLocaleString()} tracks`, 'success');
                    resolve();
                })
                .on('error', (error) => {
                    this.log(`Error loading CSV: ${error.message}`, 'error');
                    reject(error);
                });
        });
    }

    // Find tracks without audio features
    async findTracksWithoutFeatures() {
        try {
            const collection = this.client.db('echotune').collection('spotify_analytics');
            
            this.log('Finding tracks without audio features...', 'info');
            
            const cursor = collection.find({
                $or: [
                    { has_audio_features: false },
                    { has_audio_features: { $exists: false } },
                    { audio_features: null },
                    { audio_features: { $exists: false } },
                    { 'audio_features.danceability': { $exists: false } }
                ]
            }, {
                projection: {
                    _id: 1,
                    track_uri: 1,
                    track_name: 1,
                    artist_name: 1,
                    has_audio_features: 1,
                    audio_features: 1
                }
            });
            
            await cursor.forEach(doc => {
                if (doc.track_uri) {
                    this.tracksWithoutFeatures.push({
                        _id: doc._id,
                        track_uri: doc.track_uri,
                        track_name: doc.track_name,
                        artist_name: doc.artist_name,
                        has_audio_features: doc.has_audio_features,
                        audio_features: doc.audio_features
                    });
                    this.stats.tracksWithoutFeatures++;
                }
            });
            
            this.log(`Found ${this.stats.tracksWithoutFeatures.toLocaleString()} tracks without audio features`, 'info');
            
        } catch (error) {
            this.log(`Error finding tracks without features: ${error.message}`, 'error');
            throw error;
        }
    }

    // Identify enhancement candidates
    identifyEnhancementCandidates() {
        this.log('Identifying enhancement candidates...', 'enhance');
        
        for (const track of this.tracksWithoutFeatures) {
            if (this.audioFeaturesMap.has(track.track_uri)) {
                this.enhancementCandidates.push({
                    track: track,
                    features: this.audioFeaturesMap.get(track.track_uri)
                });
                this.stats.enhancementCandidates++;
            }
        }
        
        this.log(`Enhancement candidates identified: ${this.stats.enhancementCandidates.toLocaleString()}`, 'success');
        
        // Log some examples
        if (this.enhancementCandidates.length > 0) {
            this.log('Sample enhancement candidates:', 'debug');
            for (let i = 0; i < Math.min(5, this.enhancementCandidates.length); i++) {
                const candidate = this.enhancementCandidates[i];
                this.log(`  ${i+1}. ${candidate.track.track_name} by ${candidate.track.artist_name}`, 'debug');
            }
        }
    }

    // Enhance tracks with audio features
    async enhanceTracksWithAudioFeatures() {
        if (this.enhancementCandidates.length === 0) {
            this.log('No enhancement candidates found', 'warn');
            return;
        }

        this.log(`Starting audio features enhancement for ${this.enhancementCandidates.length} tracks...`, 'enhance');
        
        const collection = this.client.db('echotune').collection('spotify_analytics');
        const batchSize = 100;
        
        for (let i = 0; i < this.enhancementCandidates.length; i += batchSize) {
            const batch = this.enhancementCandidates.slice(i, i + batchSize);
            const bulkOps = [];
            
            for (const candidate of batch) {
                const { track, features } = candidate;
                
                const updateDoc = {
                    $set: {
                        // Update track metadata if missing
                        track_name: track.track_name || features.track_name,
                        artist_name: track.artist_name || features.artist_name,
                        album_name: features.album_name,
                        artist_uri: features.artist_uri,
                        album_uri: features.album_uri,
                        release_date: features.release_date,
                        duration_ms: features.duration_ms,
                        explicit: features.explicit,
                        popularity: features.popularity,
                        preview_url: features.preview_url,
                        
                        // Add complete audio features
                        audio_features: {
                            danceability: features.danceability,
                            energy: features.energy,
                            key: features.key,
                            loudness: features.loudness,
                            mode: features.mode,
                            speechiness: features.speechiness,
                            acousticness: features.acousticness,
                            instrumentalness: features.instrumentalness,
                            liveness: features.liveness,
                            valence: features.valence,
                            tempo: features.tempo,
                            time_signature: features.time_signature
                        },
                        
                        // Add genre information
                        genres: features.genres,
                        album_genres: features.album_genres,
                        label: features.label,
                        isrc: features.isrc,
                        
                        // Update flags
                        has_audio_features: true,
                        data_quality_score: 100,
                        updated_at: new Date(),
                        enhancement_source: 'csv_audio_features'
                    }
                };
                
                bulkOps.push({
                    updateOne: {
                        filter: { _id: track._id },
                        update: updateDoc
                    }
                });
            }
            
            // Execute batch update
            try {
                const result = await collection.bulkWrite(bulkOps, { ordered: false });
                this.stats.tracksUpdated += result.modifiedCount;
                this.stats.featuresEnhanced += result.modifiedCount;
                
                this.log(`Batch ${Math.floor(i/batchSize) + 1}: Enhanced ${result.modifiedCount} tracks`, 'enhance');
                
            } catch (error) {
                this.log(`Batch enhancement error: ${error.message}`, 'warn');
                this.stats.errors++;
            }
        }
        
        this.log(`Audio features enhancement completed: ${this.stats.featuresEnhanced} tracks enhanced`, 'success');
    }

    // Generate enhancement report
    generateEnhancementReport() {
        const report = {
            timestamp: new Date().toISOString(),
            enhancement_type: 'audio_features_population',
            
            statistics: {
                csv_audio_features_loaded: this.stats.csvFeaturesLoaded,
                tracks_without_features_found: this.stats.tracksWithoutFeatures,
                enhancement_candidates_identified: this.stats.enhancementCandidates,
                tracks_successfully_enhanced: this.stats.featuresEnhanced,
                total_tracks_updated: this.stats.tracksUpdated,
                errors_encountered: this.stats.errors
            },
            
            coverage_improvement: {
                before_enhancement: {
                    total_tracks: this.stats.tracksWithoutFeatures + (43303 - this.stats.tracksWithoutFeatures), // Approximate
                    missing_features: this.stats.tracksWithoutFeatures,
                    coverage_percentage: this.stats.tracksWithoutFeatures > 0 ? 
                        ((43303 - this.stats.tracksWithoutFeatures) / 43303 * 100).toFixed(1) : 'N/A'
                },
                after_enhancement: {
                    remaining_missing: this.stats.tracksWithoutFeatures - this.stats.featuresEnhanced,
                    new_coverage_percentage: this.stats.tracksWithoutFeatures > 0 ? 
                        ((43303 - (this.stats.tracksWithoutFeatures - this.stats.featuresEnhanced)) / 43303 * 100).toFixed(1) : 'N/A',
                    improvement: this.stats.featuresEnhanced > 0 ? 
                        (this.stats.featuresEnhanced / 43303 * 100).toFixed(1) + '% improvement' : 'No improvement'
                }
            },
            
            recommendations: {
                immediate_actions: [
                    this.stats.featuresEnhanced > 1000 ? 
                        'Excellent progress - continue with remaining missing features via Spotify API' :
                        'Limited improvement - investigate CSV data matching and consider Spotify API for remaining tracks',
                    
                    'Update recommendation algorithms to leverage new audio features',
                    'Run performance benchmarks to measure improvement in recommendation quality',
                    'Consider implementing real-time audio features fetching for new tracks'
                ],
                
                next_steps: [
                    `Process remaining ${this.stats.tracksWithoutFeatures - this.stats.featuresEnhanced} tracks via Spotify Web API`,
                    'Implement automated audio features enhancement pipeline',
                    'Add monitoring for audio features completeness',
                    'Create fallback mechanisms for tracks without features'
                ]
            },
            
            quality_metrics: {
                enhancement_success_rate: this.stats.enhancementCandidates > 0 ? 
                    (this.stats.featuresEnhanced / this.stats.enhancementCandidates * 100).toFixed(1) + '%' : '0%',
                data_matching_rate: this.stats.tracksWithoutFeatures > 0 ?
                    (this.stats.enhancementCandidates / this.stats.tracksWithoutFeatures * 100).toFixed(1) + '%' : '0%',
                overall_improvement: this.stats.featuresEnhanced > 0 ? 'Significant' : 'Minimal'
            }
        };
        
        // Save report
        const reportPath = '/home/runner/work/Spotify-echo/Spotify-echo/AUDIO_FEATURES_ENHANCEMENT_REPORT.json';
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        // Generate markdown report
        const markdownReport = this.generateMarkdownReport(report);
        const markdownPath = '/home/runner/work/Spotify-echo/Spotify-echo/AUDIO_FEATURES_ENHANCEMENT_REPORT.md';
        fs.writeFileSync(markdownPath, markdownReport);
        
        this.log(`Enhancement report saved to: ${reportPath}`, 'success');
        this.log(`Markdown report saved to: ${markdownPath}`, 'success');
        
        return report;
    }

    generateMarkdownReport(report) {
        return `# Audio Features Enhancement Report

**Generated:** ${report.timestamp}
**Enhancement Type:** ${report.enhancement_type}

## Executive Summary

${report.statistics.tracks_successfully_enhanced > 1000 ? 
    '✅ **SUCCESS**: Significant audio features enhancement completed' :
    '⚠️ **LIMITED SUCCESS**: Partial audio features enhancement completed'
}

**Key Results:**
- **Tracks Enhanced:** ${report.statistics.tracks_successfully_enhanced.toLocaleString()}
- **Coverage Improvement:** ${report.coverage_improvement.after_enhancement.improvement}
- **New Coverage:** ${report.coverage_improvement.after_enhancement.new_coverage_percentage}
- **Success Rate:** ${report.quality_metrics.enhancement_success_rate}

## Enhancement Statistics

- **CSV Audio Features Loaded:** ${report.statistics.csv_audio_features_loaded.toLocaleString()}
- **Tracks Missing Features:** ${report.statistics.tracks_without_features_found.toLocaleString()}
- **Enhancement Candidates:** ${report.statistics.enhancement_candidates_identified.toLocaleString()}
- **Successfully Enhanced:** ${report.statistics.tracks_successfully_enhanced.toLocaleString()}
- **Total Updated:** ${report.statistics.total_tracks_updated.toLocaleString()}
- **Errors:** ${report.statistics.errors_encountered}

## Coverage Analysis

### Before Enhancement
- **Total Tracks:** ~43,303
- **Missing Features:** ${report.statistics.tracks_without_features_found.toLocaleString()}
- **Coverage:** ${report.coverage_improvement.before_enhancement.coverage_percentage}

### After Enhancement  
- **Remaining Missing:** ${report.coverage_improvement.after_enhancement.remaining_missing.toLocaleString()}
- **New Coverage:** ${report.coverage_improvement.after_enhancement.new_coverage_percentage}
- **Improvement:** ${report.coverage_improvement.after_enhancement.improvement}

## Quality Metrics

- **Enhancement Success Rate:** ${report.quality_metrics.enhancement_success_rate}
- **Data Matching Rate:** ${report.quality_metrics.data_matching_rate}  
- **Overall Improvement:** ${report.quality_metrics.overall_improvement}

## Immediate Action Items

${report.recommendations.immediate_actions.map(action => `- ${action}`).join('\n')}

## Next Steps

${report.recommendations.next_steps.map(step => `- ${step}`).join('\n')}

## Conclusion

${report.statistics.tracks_successfully_enhanced > 1000 ?
    'The audio features enhancement was highly successful, significantly improving the database quality for recommendations.' :
    'The enhancement had limited success. Further investigation into CSV data matching or alternative approaches via Spotify API may be needed.'
}

**Production Impact:** ${report.statistics.tracks_successfully_enhanced > 500 ? 'High' : 'Medium'} - Enhanced tracks will improve recommendation quality and user experience.

---
*Generated by Audio Features Enhancer for EchoTune AI*`;
    }

    // Main execution method
    async enhance() {
        try {
            this.log('Starting Audio Features Enhancement Process...', 'success');
            
            // Connect to MongoDB
            const connected = await this.connect();
            if (!connected) {
                throw new Error('Failed to connect to MongoDB');
            }
            
            // Load available audio features from CSV
            await this.loadAvailableAudioFeatures();
            
            // Find tracks without audio features
            await this.findTracksWithoutFeatures();
            
            // Identify enhancement candidates
            this.identifyEnhancementCandidates();
            
            // Enhance tracks with audio features
            await this.enhanceTracksWithAudioFeatures();
            
            // Generate report
            const report = this.generateEnhancementReport();
            
            // Log summary
            this.log('='.repeat(80), 'info');
            this.log('AUDIO FEATURES ENHANCEMENT COMPLETE', 'success');
            this.log('='.repeat(80), 'info');
            this.log(`📊 CSV Features Available: ${this.stats.csvFeaturesLoaded.toLocaleString()}`, 'info');
            this.log(`📊 Tracks Missing Features: ${this.stats.tracksWithoutFeatures.toLocaleString()}`, 'info');
            this.log(`📊 Enhancement Candidates: ${this.stats.enhancementCandidates.toLocaleString()}`, 'info');
            this.log(`🚀 Features Enhanced: ${this.stats.featuresEnhanced.toLocaleString()}`, 'success');
            this.log(`🚀 Tracks Updated: ${this.stats.tracksUpdated.toLocaleString()}`, 'success');
            this.log(`📊 Success Rate: ${this.stats.enhancementCandidates > 0 ? (this.stats.featuresEnhanced / this.stats.enhancementCandidates * 100).toFixed(1) : 0}%`, 'info');
            this.log('='.repeat(80), 'info');
            
            return report;
            
        } catch (error) {
            this.log(`Enhancement failed: ${error.message}`, 'error');
            throw error;
        } finally {
            await this.disconnect();
        }
    }
}

// Execute if run directly
if (require.main === module) {
    const enhancer = new AudioFeaturesEnhancer();
    enhancer.enhance()
        .then((report) => {
            console.log('Audio features enhancement completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Enhancement failed:', error);
            process.exit(1);
        });
}

module.exports = AudioFeaturesEnhancer;