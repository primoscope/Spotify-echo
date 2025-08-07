#!/usr/bin/env node

/**
 * Feature Vector Implementation Script
 * Creates normalized feature vectors for machine learning algorithms
 * Part of the AI optimization roadmap - High Priority Task
 */

const { MongoClient } = require('mongodb');
const redis = require('../src/utils/redis-manager');
const path = require('path');
const fs = require('fs').promises;

class FeatureVectorProcessor {
  constructor() {
    this.mongodb = null;
    this.db = null;
    this.collection = null;
    this.processedCount = 0;
    this.batchSize = 1000;
    
    // Audio feature ranges for normalization
    this.featureRanges = {
      danceability: { min: 0, max: 1 },
      energy: { min: 0, max: 1 },
      speechiness: { min: 0, max: 1 },
      acousticness: { min: 0, max: 1 },
      instrumentalness: { min: 0, max: 1 },
      liveness: { min: 0, max: 1 },
      valence: { min: 0, max: 1 },
      loudness: { min: -60, max: 0 },
      tempo: { min: 0, max: 250 },
      key: { min: 0, max: 11 },
      mode: { min: 0, max: 1 },
      time_signature: { min: 1, max: 7 }
    };
    
    // Feature weights for different use cases
    this.featureWeights = {
      recommendation: {
        danceability: 0.15,
        energy: 0.15,
        valence: 0.15,
        acousticness: 0.1,
        instrumentalness: 0.05,
        liveness: 0.05,
        speechiness: 0.05,
        loudness: 0.1,
        tempo: 0.1,
        key: 0.05,
        mode: 0.03,
        time_signature: 0.02
      },
      mood: {
        valence: 0.3,
        energy: 0.25,
        danceability: 0.2,
        acousticness: 0.1,
        loudness: 0.1,
        tempo: 0.05
      },
      genre: {
        instrumentalness: 0.2,
        acousticness: 0.2,
        energy: 0.15,
        speechiness: 0.15,
        danceability: 0.1,
        loudness: 0.1,
        tempo: 0.1
      }
    };
  }

  /**
   * Initialize database connection
   */
  async initialize() {
    try {
      console.log('🔧 Initializing connections...');
      
      this.mongodb = new MongoClient(process.env.MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000
      });
      
      await this.mongodb.connect();
      this.db = this.mongodb.db(process.env.MONGODB_DATABASE || 'echotune');
      this.collection = this.db.collection('spotify_analytics');
      console.log('✅ MongoDB connected');
      
      await redis.connect();
      console.log('✅ Redis connected');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize connections:', error.message);
      throw error;
    }
  }

  /**
   * Normalize a single feature value to 0-1 range
   */
  normalizeFeature(value, featureName) {
    if (value === null || value === undefined) return 0;
    
    const range = this.featureRanges[featureName];
    if (!range) return value; // Return as-is if no range defined
    
    // Clamp value to range
    const clampedValue = Math.max(range.min, Math.min(range.max, value));
    
    // Normalize to 0-1
    if (range.max === range.min) return 0;
    return (clampedValue - range.min) / (range.max - range.min);
  }

  /**
   * Create feature vector from audio features
   */
  createFeatureVector(audioFeatures, vectorType = 'recommendation') {
    if (!audioFeatures) return null;
    
    const weights = this.featureWeights[vectorType] || this.featureWeights.recommendation;
    const vector = {};
    const normalizedVector = [];
    let magnitude = 0;
    
    // Create weighted and normalized vector
    for (const [feature, weight] of Object.entries(weights)) {
      const rawValue = audioFeatures[feature];
      const normalizedValue = this.normalizeFeature(rawValue, feature);
      const weightedValue = normalizedValue * weight;
      
      vector[feature] = {
        raw: rawValue,
        normalized: normalizedValue,
        weighted: weightedValue
      };
      
      normalizedVector.push(weightedValue);
      magnitude += weightedValue * weightedValue;
    }
    
    // Calculate magnitude for unit vector
    magnitude = Math.sqrt(magnitude);
    
    return {
      type: vectorType,
      vector: vector,
      array: normalizedVector,
      magnitude: magnitude,
      unitVector: magnitude > 0 ? normalizedVector.map(v => v / magnitude) : normalizedVector,
      created_at: new Date()
    };
  }

  /**
   * Create mood vector from audio features
   */
  createMoodVector(audioFeatures) {
    if (!audioFeatures) return null;
    
    const valence = this.normalizeFeature(audioFeatures.valence, 'valence');
    const energy = this.normalizeFeature(audioFeatures.energy, 'energy');
    const danceability = this.normalizeFeature(audioFeatures.danceability, 'danceability');
    const acousticness = this.normalizeFeature(audioFeatures.acousticness, 'acousticness');
    
    // Define mood quadrants based on valence and energy
    let mood = 'unknown';
    if (valence >= 0.5 && energy >= 0.5) {
      mood = 'happy_energetic';
    } else if (valence >= 0.5 && energy < 0.5) {
      mood = 'happy_calm';
    } else if (valence < 0.5 && energy >= 0.5) {
      mood = 'sad_energetic';
    } else {
      mood = 'sad_calm';
    }
    
    // Additional mood descriptors
    const descriptors = [];
    if (danceability > 0.7) descriptors.push('danceable');
    if (acousticness > 0.7) descriptors.push('acoustic');
    if (audioFeatures.instrumentalness > 0.5) descriptors.push('instrumental');
    if (audioFeatures.speechiness > 0.66) descriptors.push('spoken_word');
    if (audioFeatures.liveness > 0.8) descriptors.push('live');
    
    return {
      mood: mood,
      valence: valence,
      energy: energy,
      danceability: danceability,
      acousticness: acousticness,
      descriptors: descriptors,
      confidence: Math.abs(valence - 0.5) + Math.abs(energy - 0.5) // Higher when not in middle
    };
  }

  /**
   * Calculate similarity between two feature vectors
   */
  calculateCosineSimilarity(vector1, vector2) {
    if (!vector1 || !vector2 || !vector1.unitVector || !vector2.unitVector) {
      return 0;
    }
    
    const v1 = vector1.unitVector;
    const v2 = vector2.unitVector;
    
    if (v1.length !== v2.length) return 0;
    
    let dotProduct = 0;
    for (let i = 0; i < v1.length; i++) {
      dotProduct += v1[i] * v2[i];
    }
    
    return Math.max(0, Math.min(1, dotProduct)); // Clamp to 0-1
  }

  /**
   * Find tracks with audio features but missing feature vectors
   */
  async findTracksNeedingVectors() {
    try {
      console.log('🔍 Finding tracks needing feature vectors...');
      
      const tracks = await this.collection.find({
        'audio_features.danceability': { $exists: true },
        $or: [
          { 'feature_vectors': { $exists: false } },
          { 'feature_vectors': null },
          { 'feature_vectors.recommendation': { $exists: false } }
        ]
      }).toArray();

      console.log(`📊 Found ${tracks.length} tracks needing feature vectors`);
      return tracks;
      
    } catch (error) {
      console.error('❌ Failed to find tracks needing vectors:', error.message);
      throw error;
    }
  }

  /**
   * Process a batch of tracks to create feature vectors
   */
  async processBatch(tracks) {
    const bulkOperations = [];
    
    for (const track of tracks) {
      if (!track.audio_features) continue;
      
      try {
        // Create different types of feature vectors
        const recommendationVector = this.createFeatureVector(track.audio_features, 'recommendation');
        const moodVector = this.createFeatureVector(track.audio_features, 'mood');
        const genreVector = this.createFeatureVector(track.audio_features, 'genre');
        
        // Create mood analysis
        const moodAnalysis = this.createMoodVector(track.audio_features);
        
        const featureVectors = {
          recommendation: recommendationVector,
          mood: moodVector,
          genre: genreVector,
          mood_analysis: moodAnalysis,
          updated_at: new Date(),
          version: '1.0'
        };
        
        bulkOperations.push({
          updateOne: {
            filter: { _id: track._id },
            update: {
              $set: {
                feature_vectors: featureVectors,
                feature_vectors_updated_at: new Date()
              }
            }
          }
        });
        
        // Cache the vectors in Redis for quick access
        if (track.uri || track.track_uri) {
          const trackId = this.extractTrackId(track.uri || track.track_uri);
          if (trackId) {
            await redis.set(`feature_vectors:${trackId}`, featureVectors, 7200); // 2 hours TTL
          }
        }
        
      } catch (error) {
        console.error(`❌ Error processing track ${track._id}:`, error.message);
      }
    }
    
    if (bulkOperations.length > 0) {
      const result = await this.collection.bulkWrite(bulkOperations);
      return result.modifiedCount;
    }
    
    return 0;
  }

  /**
   * Extract track ID from URI
   */
  extractTrackId(uri) {
    if (!uri) return null;
    
    if (uri.includes('spotify:track:')) {
      return uri.split('spotify:track:')[1].split('?')[0];
    }
    
    if (uri.includes('open.spotify.com/track/')) {
      return uri.split('open.spotify.com/track/')[1].split('?')[0];
    }
    
    if (uri.length === 22 && /^[a-zA-Z0-9]+$/.test(uri)) {
      return uri;
    }
    
    return null;
  }

  /**
   * Process all tracks to create feature vectors
   */
  async processAllTracks() {
    try {
      console.log('🚀 Starting feature vector processing...\n');
      
      const tracksNeedingVectors = await this.findTracksNeedingVectors();
      
      if (tracksNeedingVectors.length === 0) {
        console.log('✅ All tracks already have feature vectors!');
        return;
      }

      console.log(`📝 Processing ${tracksNeedingVectors.length} tracks in batches of ${this.batchSize}...\n`);
      
      let totalProcessed = 0;
      let totalUpdated = 0;

      // Process in batches
      for (let i = 0; i < tracksNeedingVectors.length; i += this.batchSize) {
        const batch = tracksNeedingVectors.slice(i, i + this.batchSize);
        const batchNum = Math.floor(i / this.batchSize) + 1;
        const totalBatches = Math.ceil(tracksNeedingVectors.length / this.batchSize);
        
        console.log(`📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} tracks)...`);
        
        const updated = await this.processBatch(batch);
        totalUpdated += updated;
        totalProcessed += batch.length;
        
        console.log(`✅ Batch ${batchNum} complete: ${updated} tracks updated`);
        console.log(`📈 Progress: ${totalProcessed}/${tracksNeedingVectors.length} tracks processed (${((totalProcessed / tracksNeedingVectors.length) * 100).toFixed(1)}%)\n`);
        
        // Small delay to prevent overwhelming the system
        if (i + this.batchSize < tracksNeedingVectors.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log('🎉 Feature vector processing complete!');
      console.log(`📊 Results: ${totalUpdated} tracks updated with feature vectors`);
      
      return { processed: totalProcessed, updated: totalUpdated };
      
    } catch (error) {
      console.error('❌ Failed to process feature vectors:', error.message);
      throw error;
    }
  }

  /**
   * Create database indexes for efficient vector operations
   */
  async createVectorIndexes() {
    try {
      console.log('🏗️  Creating indexes for feature vector operations...');
      
      const indexes = [
        // Feature vector existence
        { 'feature_vectors.recommendation': 1 },
        { 'feature_vectors.mood_analysis.mood': 1 },
        { 'feature_vectors.mood_analysis.valence': 1 },
        { 'feature_vectors.mood_analysis.energy': 1 },
        
        // Compound indexes for mood-based queries
        { 
          'feature_vectors.mood_analysis.mood': 1,
          'feature_vectors.mood_analysis.energy': 1 
        },
        { 
          'feature_vectors.mood_analysis.valence': 1,
          'feature_vectors.mood_analysis.danceability': 1 
        },
        
        // Indexes for similarity search
        { 'feature_vectors.recommendation.magnitude': 1 },
        { 'feature_vectors.genre.magnitude': 1 }
      ];
      
      for (const index of indexes) {
        try {
          await this.collection.createIndex(index);
          console.log(`✅ Created index: ${JSON.stringify(index)}`);
        } catch (error) {
          console.log(`⚠️  Index already exists or failed: ${JSON.stringify(index)}`);
        }
      }
      
      return true;
      
    } catch (error) {
      console.error('❌ Failed to create vector indexes:', error.message);
      return false;
    }
  }

  /**
   * Generate feature vectors analysis report
   */
  async generateReport() {
    try {
      console.log('📄 Generating feature vectors analysis report...');
      
      // Get statistics
      const totalTracks = await this.collection.countDocuments();
      const tracksWithVectors = await this.collection.countDocuments({
        'feature_vectors.recommendation': { $exists: true }
      });
      const tracksWithAudioFeatures = await this.collection.countDocuments({
        'audio_features.danceability': { $exists: true }
      });
      
      // Mood distribution
      const moodDistribution = await this.collection.aggregate([
        { $match: { 'feature_vectors.mood_analysis.mood': { $exists: true } } },
        { $group: { _id: '$feature_vectors.mood_analysis.mood', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray();

      const coverage = totalTracks > 0 ? ((tracksWithVectors / totalTracks) * 100).toFixed(1) : 0;
      const mlReadiness = tracksWithAudioFeatures > 0 ? ((tracksWithVectors / tracksWithAudioFeatures) * 100).toFixed(1) : 0;

      const report = {
        timestamp: new Date().toISOString(),
        database: {
          totalTracks: totalTracks,
          tracksWithAudioFeatures: tracksWithAudioFeatures,
          tracksWithVectors: tracksWithVectors,
          coverage: `${coverage}%`,
          mlReadiness: `${mlReadiness}%`
        },
        moodDistribution: moodDistribution.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        featureTypes: {
          recommendation: 'Weighted vector for recommendation algorithms',
          mood: 'Vector optimized for mood-based recommendations',
          genre: 'Vector for genre classification and discovery'
        },
        nextSteps: [
          tracksWithVectors < tracksWithAudioFeatures ? 'Run script again to process remaining tracks' : 'All tracks with audio features have vectors ✅',
          'Implement collaborative filtering algorithms',
          'Build user preference profiles',
          'Deploy recommendation engine'
        ]
      };

      const reportPath = path.join(process.cwd(), 'FEATURE_VECTORS_REPORT.json');
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      
      console.log('\n📊 Feature Vectors Summary:');
      console.log(`   📁 Total tracks: ${totalTracks}`);
      console.log(`   🎵 Tracks with audio features: ${tracksWithAudioFeatures}`);
      console.log(`   🧮 Tracks with feature vectors: ${tracksWithVectors}`);
      console.log(`   📈 ML Readiness: ${mlReadiness}%`);
      console.log(`   🎭 Mood distribution:`, Object.keys(report.moodDistribution).map(mood => `${mood}: ${report.moodDistribution[mood]}`).join(', '));
      console.log(`   📄 Report saved to: FEATURE_VECTORS_REPORT.json`);
      
      return report;
      
    } catch (error) {
      console.error('❌ Failed to generate report:', error.message);
      throw error;
    }
  }

  /**
   * Close connections
   */
  async close() {
    try {
      if (this.mongodb) {
        await this.mongodb.close();
        console.log('✅ MongoDB connection closed');
      }
      
      await redis.close();
      console.log('✅ Redis connection closed');
      
    } catch (error) {
      console.error('❌ Error closing connections:', error.message);
    }
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🧮 EchoTune AI - Feature Vector Processor');
  console.log('🚀 High Priority: Implement normalized feature vectors for ML algorithms\n');

  const processor = new FeatureVectorProcessor();
  
  try {
    // Initialize connections
    await processor.initialize();
    
    // Create database indexes
    await processor.createVectorIndexes();
    
    // Process all tracks
    await processor.processAllTracks();
    
    // Generate report
    await processor.generateReport();
    
    console.log('\n✅ Feature vector processing completed successfully!');
    console.log('🔄 Next roadmap task: Build User Profiles from listening patterns');
    
  } catch (error) {
    console.error('\n❌ Feature vector processing failed:', error.message);
    process.exit(1);
  } finally {
    await processor.close();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = FeatureVectorProcessor;