#!/usr/bin/env node

/**
 * Feature Vector Implementation Script
 * Creates normalized feature vectors for machine learning algorithms
 * Part of the AI enhancement roadmap - High Priority Task
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

class FeatureVectorProcessor {
  constructor() {
    this.mongodb = null;
    this.db = null;
    this.collection = null;
    this.processedCount = 0;
    this.totalCount = 0;
  }

  async initialize() {
    try {
      console.log('🔧 Connecting to MongoDB...');
      
      this.mongodb = new MongoClient(process.env.MONGODB_URI);
      await this.mongodb.connect();
      this.db = this.mongodb.db('echotune');
      this.collection = this.db.collection('spotify_analytics');
      
      console.log('✅ MongoDB connected');
      return true;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      throw error;
    }
  }

  async getAudioFeaturesStats() {
    try {
      console.log('📊 Analyzing audio features statistics...');
      
      // Get all tracks with audio features
      const tracksWithFeatures = await this.collection.find({
        'audio_features': { $exists: true, $ne: null }
      }).toArray();
      
      if (tracksWithFeatures.length === 0) {
        throw new Error('No tracks with audio features found');
      }
      
      console.log(`✅ Found ${tracksWithFeatures.length} tracks with audio features`);
      
      // Calculate statistics for normalization
      const features = ['danceability', 'energy', 'speechiness', 'acousticness', 
                       'instrumentalness', 'liveness', 'valence', 'loudness', 'tempo'];
      
      const stats = {};
      
      for (const feature of features) {
        const values = tracksWithFeatures
          .map(track => track.audio_features?.[feature])
          .filter(val => val !== null && val !== undefined && !isNaN(val));
        
        if (values.length > 0) {
          values.sort((a, b) => a - b);
          
          stats[feature] = {
            min: Math.min(...values),
            max: Math.max(...values),
            mean: values.reduce((a, b) => a + b) / values.length,
            median: values[Math.floor(values.length / 2)],
            std: Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - stats[feature]?.mean || 0, 2), 0) / values.length)
          };
        }
      }
      
      console.log('📈 Audio features statistics calculated');
      return { stats, count: tracksWithFeatures.length };
      
    } catch (error) {
      console.error('❌ Error analyzing audio features:', error.message);
      throw error;
    }
  }

  normalizeFeatureValue(value, min, max) {
    if (value === null || value === undefined || isNaN(value)) {
      return 0.5; // Default middle value for missing data
    }
    
    if (min === max) {
      return 0.5; // If all values are the same, return middle
    }
    
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
  }

  createFeatureVector(audioFeatures, stats) {
    if (!audioFeatures || typeof audioFeatures !== 'object') {
      // Return default feature vector for missing audio features
      return {
        normalized: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
        mood_vector: [0.5, 0.5, 0.5], // valence, energy, danceability
        genre_indicators: [0.5, 0.5, 0.5, 0.5], // acoustic, instrumental, speech, live
        raw_features: null
      };
    }

    const features = [
      'danceability', 'energy', 'speechiness', 'acousticness',
      'instrumentalness', 'liveness', 'valence', 'loudness', 'tempo'
    ];

    // Normalize key (0-11 scale)
    const keyNormalized = this.normalizeFeatureValue(audioFeatures.key, 0, 11);
    
    // Normalize mode (0-1 scale) 
    const modeNormalized = this.normalizeFeatureValue(audioFeatures.mode, 0, 1);

    // Create normalized feature vector
    const normalized = features.map(feature => {
      const stat = stats[feature];
      if (!stat) return 0.5;
      
      return this.normalizeFeatureValue(audioFeatures[feature], stat.min, stat.max);
    });
    
    // Add key and mode
    normalized.push(keyNormalized, modeNormalized);

    // Create specialized vectors for different ML tasks
    const moodVector = [
      normalized[6] || 0.5, // valence
      normalized[1] || 0.5, // energy  
      normalized[0] || 0.5  // danceability
    ];

    const genreIndicators = [
      normalized[3] || 0.5, // acousticness
      normalized[4] || 0.5, // instrumentalness
      normalized[2] || 0.5, // speechiness
      normalized[5] || 0.5  // liveness
    ];

    return {
      normalized,
      mood_vector: moodVector,
      genre_indicators: genreIndicators,
      raw_features: audioFeatures
    };
  }

  calculateSimilarityScore(vector1, vector2) {
    // Calculate cosine similarity between two feature vectors
    const dotProduct = vector1.reduce((sum, a, i) => sum + a * vector2[i], 0);
    const magnitude1 = Math.sqrt(vector1.reduce((sum, a) => sum + a * a, 0));
    const magnitude2 = Math.sqrt(vector2.reduce((sum, a) => sum + a * a, 0));
    
    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    
    return dotProduct / (magnitude1 * magnitude2);
  }

  async processFeatureVectors() {
    try {
      console.log('🧮 Creating feature vectors for all tracks...');
      
      // Get statistics for normalization
      const { stats, count } = await this.getAudioFeaturesStats();
      this.totalCount = count;
      
      // Process tracks in batches
      const batchSize = 1000;
      let processed = 0;
      
      while (processed < this.totalCount) {
        const tracks = await this.collection.find({
          'audio_features': { $exists: true }
        })
        .skip(processed)
        .limit(batchSize)
        .toArray();
        
        if (tracks.length === 0) break;
        
        const bulkOps = [];
        
        for (const track of tracks) {
          const featureVector = this.createFeatureVector(track.audio_features, stats);
          
          // Add metadata
          featureVector.created_at = new Date();
          featureVector.version = '1.0';
          
          bulkOps.push({
            updateOne: {
              filter: { _id: track._id },
              update: {
                $set: {
                  feature_vector: featureVector,
                  ml_ready: true,
                  feature_vector_updated_at: new Date()
                }
              }
            }
          });
        }
        
        if (bulkOps.length > 0) {
          const result = await this.collection.bulkWrite(bulkOps);
          this.processedCount += result.modifiedCount;
        }
        
        processed += tracks.length;
        console.log(`⚡ Processed ${processed}/${this.totalCount} tracks (${Math.round((processed/this.totalCount)*100)}%)`);
      }
      
      console.log('✅ Feature vector processing complete');
      return this.processedCount;
      
    } catch (error) {
      console.error('❌ Error processing feature vectors:', error.message);
      throw error;
    }
  }

  async createMLIndexes() {
    try {
      console.log('🔍 Creating ML-optimized indexes...');
      
      const indexes = [
        { 'feature_vector.normalized': 1 },
        { 'feature_vector.mood_vector': 1 },
        { 'feature_vector.genre_indicators': 1 },
        { 'ml_ready': 1, 'audio_features.valence': 1 },
        { 'ml_ready': 1, 'audio_features.energy': 1 },
        { 'ml_ready': 1, 'audio_features.danceability': 1 },
        { 'ml_ready': 1, 'artist_name': 1 },
        { 'feature_vector.created_at': -1 }
      ];
      
      let created = 0;
      for (const index of indexes) {
        try {
          await this.collection.createIndex(index);
          created++;
        } catch (err) {
          if (!err.message.includes('already exists')) {
            console.warn(`⚠️  Could not create index ${JSON.stringify(index)}: ${err.message}`);
          }
        }
      }
      
      console.log(`✅ Created ${created} ML-optimized indexes`);
      return created;
      
    } catch (error) {
      console.error('❌ Error creating ML indexes:', error.message);
      return 0;
    }
  }

  async validateFeatureVectors() {
    try {
      console.log('✅ Validating feature vectors...');
      
      const validation = {
        totalTracks: await this.collection.countDocuments(),
        tracksWithFeatures: await this.collection.countDocuments({ 'audio_features': { $exists: true } }),
        tracksWithVectors: await this.collection.countDocuments({ 'feature_vector': { $exists: true } }),
        mlReady: await this.collection.countDocuments({ 'ml_ready': true })
      };
      
      validation.featureCoverage = Math.round((validation.tracksWithFeatures / validation.totalTracks) * 100);
      validation.vectorCoverage = Math.round((validation.tracksWithVectors / validation.totalTracks) * 100);
      validation.mlReadiness = Math.round((validation.mlReady / validation.totalTracks) * 100);
      
      console.log('📊 Feature Vector Validation Results:');
      console.log(`   Total tracks: ${validation.totalTracks}`);
      console.log(`   With audio features: ${validation.tracksWithFeatures} (${validation.featureCoverage}%)`);
      console.log(`   With feature vectors: ${validation.tracksWithVectors} (${validation.vectorCoverage}%)`);
      console.log(`   ML ready: ${validation.mlReady} (${validation.mlReadiness}%)`);
      
      return validation;
      
    } catch (error) {
      console.error('❌ Error validating feature vectors:', error.message);
      return null;
    }
  }

  async run() {
    try {
      console.log('🧮 EchoTune AI - Feature Vector Processor\n');
      console.log('🚀 High Priority: Implementing normalized feature vectors for ML algorithms\n');
      
      await this.initialize();
      
      const processed = await this.processFeatureVectors();
      await this.createMLIndexes();
      const validation = await this.validateFeatureVectors();
      
      console.log('\n📊 Final Results:');
      console.log(`✅ Processed: ${processed} tracks`);
      console.log(`🧠 ML Ready: ${validation?.mlReady || 0} tracks (${validation?.mlReadiness || 0}%)`);
      console.log(`📈 Feature Coverage: ${validation?.featureCoverage || 0}%`);
      
      if (validation?.mlReadiness >= 80) {
        console.log('🎉 Database is ready for machine learning algorithms!');
      } else {
        console.log('⚠️  More audio features needed for optimal ML performance');
      }
      
    } catch (error) {
      console.error('❌ Feature vector processing failed:', error.message);
      process.exit(1);
    } finally {
      if (this.mongodb) {
        await this.mongodb.close();
        console.log('✅ MongoDB connection closed');
      }
    }
  }
}

// Run if called directly
if (require.main === module) {
  const processor = new FeatureVectorProcessor();
  processor.run();
}

module.exports = FeatureVectorProcessor;