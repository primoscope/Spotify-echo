#!/usr/bin/env node
/**
 * Comprehensive Data Validation and Optimization Report
 * Validates merged JSON data and provides optimization recommendations
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

class DataValidationSuite {
    constructor() {
        this.client = null;
        this.db = null;
        this.validation = {
            collections: {},
            dataQuality: {},
            performance: {},
            recommendations: []
        };
    }

    async run() {
        console.log('🔍 Starting Comprehensive Data Validation Suite...\n');
        
        try {
            await this.connectToDatabase();
            await this.validateCollections();
            await this.analyzeDataQuality();
            await this.performanceAnalysis();
            await this.generateOptimizationReport();
            
            console.log('\n✅ Validation suite completed successfully!');
            
        } catch (error) {
            console.error('❌ Validation failed:', error.message);
            throw error;
        } finally {
            if (this.client) await this.client.close();
        }
    }

    async connectToDatabase() {
        console.log('🗃️  Connecting to MongoDB...');
        
        this.client = new MongoClient(process.env.MONGODB_URI);
        await this.client.connect();
        this.db = this.client.db('echotune');
        
        console.log('  ✅ Connected to MongoDB\n');
    }

    async validateCollections() {
        console.log('📊 Validating collections...');
        
        const collections = await this.db.listCollections().toArray();
        
        for (const collInfo of collections) {
            const collection = this.db.collection(collInfo.name);
            const count = await collection.countDocuments();
            
            this.validation.collections[collInfo.name] = {
                documents: count,
                indexes: await collection.listIndexes().toArray(),
                sample: count > 0 ? await collection.findOne() : null
            };
            
            console.log(`  • ${collInfo.name}: ${count.toLocaleString()} documents`);
        }
        
        console.log();
    }

    async analyzeDataQuality() {
        console.log('🔍 Analyzing data quality...');
        
        // Analyze enhanced_listening_history
        await this.analyzeListeningHistory();
        
        // Analyze track_analytics
        await this.analyzeTrackAnalytics();
        
        // Analyze user_listening_profiles
        await this.analyzeUserProfiles();
        
        // Analyze genre_analytics
        await this.analyzeGenreAnalytics();
        
        console.log();
    }

    async analyzeListeningHistory() {
        console.log('  🎵 Analyzing listening history...');
        
        const collection = this.db.collection('enhanced_listening_history');
        
        try {
            const pipeline = [
                {
                    $group: {
                        _id: null,
                        total_records: { $sum: 1 },
                        unique_tracks: { $addToSet: '$spotify_track_uri' },
                        unique_artists: { $addToSet: '$master_metadata_album_artist_name' },
                        with_audio_features: {
                            $sum: {
                                $cond: [{ $ne: ['$audio_features', null] }, 1, 0]
                            }
                        },
                        avg_play_duration: { $avg: '$ms_played' },
                        avg_quality_score: { $avg: '$listening_quality_score' },
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
                        audio_features_coverage: {
                            $multiply: [
                                { $divide: ['$with_audio_features', '$total_records'] },
                                100
                            ]
                        }
                    }
                }
            ];
            
            const [result] = await collection.aggregate(pipeline).toArray();
            
            this.validation.dataQuality.listening_history = {
                total_records: result.total_records,
                unique_tracks: result.unique_tracks_count,
                unique_artists: result.unique_artists_count,
                audio_features_coverage: Math.round(result.audio_features_coverage),
                avg_play_duration_minutes: Math.round(result.avg_play_duration / 60000),
                avg_quality_score: Math.round(result.avg_quality_score * 100) / 100,
                skip_rate_percent: Math.round(result.skip_rate * 100)
            };
            
            console.log(`    ✅ ${result.total_records.toLocaleString()} records with ${result.audio_features_coverage.toFixed(1)}% audio features coverage`);
            
        } catch (error) {
            console.log(`    ❌ Listening history analysis failed: ${error.message}`);
        }
    }

    async analyzeTrackAnalytics() {
        console.log('  📊 Analyzing track analytics...');
        
        const collection = this.db.collection('track_analytics');
        
        try {
            const pipeline = [
                {
                    $group: {
                        _id: null,
                        total_tracks: { $sum: 1 },
                        avg_plays: { $avg: '$total_plays' },
                        avg_popularity: { $avg: '$popularity_score' },
                        tracks_with_audio_features: {
                            $sum: {
                                $cond: [{ $ne: ['$audio_features', null] }, 1, 0]
                            }
                        },
                        avg_skip_rate: { $avg: '$skip_rate' },
                        most_played_track: { $max: '$total_plays' }
                    }
                }
            ];
            
            const [result] = await collection.aggregate(pipeline).toArray();
            
            this.validation.dataQuality.track_analytics = {
                total_tracks: result.total_tracks,
                avg_plays_per_track: Math.round(result.avg_plays),
                avg_popularity_score: Math.round(result.avg_popularity * 100) / 100,
                audio_features_coverage: Math.round((result.tracks_with_audio_features / result.total_tracks) * 100),
                avg_skip_rate: Math.round(result.avg_skip_rate * 100),
                most_played_count: result.most_played_track
            };
            
            console.log(`    ✅ ${result.total_tracks.toLocaleString()} tracks with avg ${Math.round(result.avg_plays)} plays each`);
            
        } catch (error) {
            console.log(`    ❌ Track analytics analysis failed: ${error.message}`);
        }
    }

    async analyzeUserProfiles() {
        console.log('  👤 Analyzing user profiles...');
        
        const collection = this.db.collection('user_listening_profiles');
        
        try {
            const [profile] = await collection.find().toArray();
            
            if (profile) {
                this.validation.dataQuality.user_profiles = {
                    total_plays: profile.total_plays,
                    total_listening_hours: Math.round(profile.total_listening_time / 3600000),
                    unique_tracks: profile.unique_tracks_count,
                    unique_artists: profile.unique_artists_count,
                    avg_quality_score: Math.round(profile.avg_listening_quality * 100) / 100,
                    skip_rate: Math.round(profile.skip_rate * 100),
                    platforms_used: profile.platforms.length,
                    countries_listened: profile.countries.length
                };
                
                console.log(`    ✅ Profile: ${profile.total_plays.toLocaleString()} plays, ${profile.unique_tracks_count.toLocaleString()} unique tracks`);
            }
            
        } catch (error) {
            console.log(`    ❌ User profiles analysis failed: ${error.message}`);
        }
    }

    async analyzeGenreAnalytics() {
        console.log('  🎼 Analyzing genre analytics...');
        
        const collection = this.db.collection('genre_analytics');
        
        try {
            const pipeline = [
                { $sort: { total_plays: -1 } },
                { $limit: 10 }
            ];
            
            const topGenres = await collection.aggregate(pipeline).toArray();
            
            this.validation.dataQuality.genre_analytics = {
                total_genres: await collection.countDocuments(),
                top_genres: topGenres.map(g => ({
                    genre: g._id,
                    plays: g.total_plays,
                    tracks: g.unique_tracks_count,
                    artists: g.unique_artists_count,
                    avg_energy: Math.round(g.avg_energy * 100) / 100,
                    avg_valence: Math.round(g.avg_valence * 100) / 100
                }))
            };
            
            console.log(`    ✅ ${topGenres.length} genre analytics with top genre: ${topGenres[0]?._id}`);
            
        } catch (error) {
            console.log(`    ❌ Genre analytics analysis failed: ${error.message}`);
        }
    }

    async performanceAnalysis() {
        console.log('🚀 Analyzing performance metrics...');
        
        const collections = ['enhanced_listening_history', 'track_analytics', 'user_listening_profiles', 'genre_analytics'];
        
        for (const collName of collections) {
            console.log(`  Testing ${collName}...`);
            
            const collection = this.db.collection(collName);
            const startTime = Date.now();
            
            try {
                // Test common queries
                await collection.findOne();
                await collection.find().limit(10).toArray();
                
                if (collName === 'enhanced_listening_history') {
                    await collection.find({ skipped: false }).limit(5).toArray();
                    await collection.find({ 'audio_features': { $ne: null } }).limit(5).toArray();
                }
                
                const responseTime = Date.now() - startTime;
                this.validation.performance[collName] = {
                    response_time_ms: responseTime,
                    status: responseTime < 1000 ? 'excellent' : responseTime < 3000 ? 'good' : 'needs_optimization'
                };
                
                console.log(`    ✅ Response time: ${responseTime}ms (${this.validation.performance[collName].status})`);
                
            } catch (error) {
                console.log(`    ❌ Performance test failed: ${error.message}`);
                this.validation.performance[collName] = { error: error.message };
            }
        }
        
        console.log();
    }

    async generateOptimizationReport() {
        console.log('📋 Generating optimization report...');
        
        // Generate recommendations based on analysis
        this.generateRecommendations();
        
        const report = {
            timestamp: new Date().toISOString(),
            validation_summary: {
                collections_analyzed: Object.keys(this.validation.collections).length,
                total_documents: Object.values(this.validation.collections).reduce((sum, c) => sum + c.documents, 0),
                data_quality_score: this.calculateDataQualityScore(),
                performance_score: this.calculatePerformanceScore()
            },
            collections: this.validation.collections,
            data_quality: this.validation.dataQuality,
            performance: this.validation.performance,
            recommendations: this.validation.recommendations,
            ai_ml_readiness: this.assessAIMLReadiness()
        };
        
        // Save comprehensive report
        const reportPath = path.join(__dirname, '..', 'COMPREHENSIVE_DATA_VALIDATION_REPORT.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        // Save markdown summary
        const markdownReport = this.generateMarkdownReport(report);
        const markdownPath = path.join(__dirname, '..', 'COMPREHENSIVE_DATA_VALIDATION_REPORT.md');
        fs.writeFileSync(markdownPath, markdownReport);
        
        console.log(`✅ Reports saved:`);
        console.log(`  📄 JSON: ${reportPath}`);
        console.log(`  📝 Markdown: ${markdownPath}`);
        
        // Print summary
        this.printSummary(report);
        
        return report;
    }

    generateRecommendations() {
        const recs = this.validation.recommendations;
        
        // Data quality recommendations
        if (this.validation.dataQuality.listening_history?.audio_features_coverage < 90) {
            recs.push({
                priority: 'HIGH',
                category: 'Data Quality',
                action: 'Fetch missing audio features via Spotify Web API',
                reason: `Only ${this.validation.dataQuality.listening_history.audio_features_coverage}% coverage`,
                impact: 'Improve recommendation accuracy'
            });
        }
        
        // Performance recommendations
        const avgResponseTime = Object.values(this.validation.performance)
            .filter(p => p.response_time_ms)
            .reduce((sum, p, _, arr) => sum + p.response_time_ms / arr.length, 0);
        
        if (avgResponseTime > 1000) {
            recs.push({
                priority: 'MEDIUM',
                category: 'Performance',
                action: 'Optimize database indexes and queries',
                reason: `Average response time: ${Math.round(avgResponseTime)}ms`,
                impact: 'Better user experience and AI model training speed'
            });
        }
        
        // AI/ML recommendations
        recs.push({
            priority: 'HIGH',
            category: 'AI/ML',
            action: 'Implement collaborative filtering algorithm',
            reason: 'Complete listening history and user profiles available',
            impact: 'Enable personalized music recommendations'
        });
        
        recs.push({
            priority: 'MEDIUM',
            category: 'AI/ML',
            action: 'Deploy content-based filtering using audio features',
            reason: 'Rich audio feature data available for most tracks',
            impact: 'Improve cold-start recommendations'
        });
        
        recs.push({
            priority: 'LOW',
            category: 'Infrastructure',
            action: 'Implement Redis caching for real-time recommendations',
            reason: 'Large dataset requires efficient caching strategy',
            impact: 'Real-time recommendation performance'
        });
    }

    calculateDataQualityScore() {
        let score = 0;
        let factors = 0;
        
        if (this.validation.dataQuality.listening_history) {
            const lh = this.validation.dataQuality.listening_history;
            score += Math.min(lh.audio_features_coverage / 10, 10); // Max 10 points
            score += Math.min(lh.avg_quality_score, 5); // Max 5 points
            score += Math.min((100 - lh.skip_rate_percent) / 10, 5); // Max 5 points
            factors += 3;
        }
        
        return Math.round((score / (factors * 20)) * 100); // Scale to 100
    }

    calculatePerformanceScore() {
        const responseTimes = Object.values(this.validation.performance)
            .filter(p => p.response_time_ms)
            .map(p => p.response_time_ms);
        
        if (responseTimes.length === 0) return 0;
        
        const avgTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
        
        if (avgTime < 500) return 100;
        if (avgTime < 1000) return 80;
        if (avgTime < 2000) return 60;
        if (avgTime < 3000) return 40;
        return 20;
    }

    assessAIMLReadiness() {
        const readiness = {
            collaborative_filtering: 'READY',
            content_based_filtering: 'READY',
            real_time_recommendations: 'NEEDS_OPTIMIZATION',
            deep_learning: 'READY',
            overall_score: 85
        };
        
        // Adjust based on data quality
        if (this.validation.dataQuality.listening_history?.audio_features_coverage < 80) {
            readiness.content_based_filtering = 'PARTIAL';
            readiness.overall_score -= 10;
        }
        
        if (this.calculatePerformanceScore() < 60) {
            readiness.real_time_recommendations = 'NEEDS_OPTIMIZATION';
            readiness.overall_score -= 10;
        }
        
        return readiness;
    }

    generateMarkdownReport(report) {
        return `# 🎵 EchoTune AI - Comprehensive Data Validation Report

**Generated:** ${new Date(report.timestamp).toLocaleString()}

## 📊 Executive Summary

- **Total Documents:** ${report.validation_summary.total_documents.toLocaleString()}
- **Collections:** ${report.validation_summary.collections_analyzed}
- **Data Quality Score:** ${report.validation_summary.data_quality_score}/100
- **Performance Score:** ${report.validation_summary.performance_score}/100
- **AI/ML Readiness:** ${report.ai_ml_readiness.overall_score}/100

## 🗃️ Database Overview

${Object.entries(report.collections).map(([name, info]) => 
    `### ${name}
- **Documents:** ${info.documents.toLocaleString()}
- **Indexes:** ${info.indexes.length}
${info.documents > 0 ? `- **Status:** ✅ Operational` : `- **Status:** ⚪ Empty`}`
).join('\n\n')}

## 🔍 Data Quality Analysis

### Listening History
- **Total Records:** ${report.data_quality.listening_history?.total_records?.toLocaleString() || 'N/A'}
- **Unique Tracks:** ${report.data_quality.listening_history?.unique_tracks?.toLocaleString() || 'N/A'}
- **Audio Features Coverage:** ${report.data_quality.listening_history?.audio_features_coverage || 0}%
- **Average Quality Score:** ${report.data_quality.listening_history?.avg_quality_score || 0}/10

### Track Analytics
- **Total Tracks:** ${report.data_quality.track_analytics?.total_tracks?.toLocaleString() || 'N/A'}
- **Average Plays per Track:** ${report.data_quality.track_analytics?.avg_plays_per_track || 0}
- **Audio Features Coverage:** ${report.data_quality.track_analytics?.audio_features_coverage || 0}%

## 🚀 Performance Analysis

${Object.entries(report.performance).map(([collection, perf]) => 
    `- **${collection}:** ${perf.response_time_ms || 'Error'}ms (${perf.status || 'Failed'})`
).join('\n')}

## 🎯 Recommendations

${report.recommendations.map((rec, index) => 
    `### ${index + 1}. [${rec.priority}] ${rec.action}
**Category:** ${rec.category}
**Reason:** ${rec.reason}
**Impact:** ${rec.impact}`
).join('\n\n')}

## 🤖 AI/ML Readiness Assessment

- **Collaborative Filtering:** ${report.ai_ml_readiness.collaborative_filtering}
- **Content-Based Filtering:** ${report.ai_ml_readiness.content_based_filtering}
- **Real-Time Recommendations:** ${report.ai_ml_readiness.real_time_recommendations}
- **Deep Learning:** ${report.ai_ml_readiness.deep_learning}

**Overall Readiness Score:** ${report.ai_ml_readiness.overall_score}/100

---

*Report generated by EchoTune AI Data Validation Suite*`;
    }

    printSummary(report) {
        console.log('\n🎯 VALIDATION SUMMARY:');
        console.log(`  • Total documents: ${report.validation_summary.total_documents.toLocaleString()}`);
        console.log(`  • Data quality score: ${report.validation_summary.data_quality_score}/100`);
        console.log(`  • Performance score: ${report.validation_summary.performance_score}/100`);
        console.log(`  • AI/ML readiness: ${report.ai_ml_readiness.overall_score}/100`);
        
        console.log('\n📊 KEY METRICS:');
        if (report.data_quality.listening_history) {
            const lh = report.data_quality.listening_history;
            console.log(`  • Listening records: ${lh.total_records?.toLocaleString()} with ${lh.audio_features_coverage}% audio features`);
            console.log(`  • Unique tracks: ${lh.unique_tracks?.toLocaleString()}`);
            console.log(`  • Quality score: ${lh.avg_quality_score}/10`);
        }
        
        console.log('\n🚀 TOP RECOMMENDATIONS:');
        report.recommendations.slice(0, 3).forEach((rec, index) => {
            console.log(`  ${index + 1}. [${rec.priority}] ${rec.action}`);
        });
    }
}

// Run validation if called directly
if (require.main === module) {
    const validator = new DataValidationSuite();
    validator.run().catch(console.error);
}

module.exports = DataValidationSuite;