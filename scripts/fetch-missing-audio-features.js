#!/usr/bin/env node

/**
 * Fetch Missing Audio Features Script
 * Retrieves audio features for tracks missing them via Spotify Web API
 * Part of the AI optimization roadmap - Critical Priority Task
 */

const { MongoClient } = require('mongodb');
const redis = require('../src/utils/redis-manager');
const path = require('path');
const fs = require('fs').promises;

class AudioFeaturesFetcher {
  constructor() {
    this.mongodb = null;
    this.db = null;
    this.collection = null;
    this.fetchedCount = 0;
    this.failedCount = 0;
    this.cachedCount = 0;
    this.batchSize = 50; // Spotify API allows up to 100 tracks per request
    this.delayBetweenRequests = 100; // 100ms delay to respect rate limits
    
    this.spotifyConfig = {
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      accessToken: null,
      tokenExpiresAt: null
    };
  }

  /**
   * Initialize connections to MongoDB and Redis
   */
  async initialize() {
    try {
      console.log('🔧 Initializing connections...');
      
      // Connect to MongoDB
      this.mongodb = new MongoClient(process.env.MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000
      });
      
      await this.mongodb.connect();
      this.db = this.mongodb.db(process.env.MONGODB_DATABASE || 'echotune');
      this.collection = this.db.collection('spotify_analytics');
      console.log('✅ MongoDB connected');
      
      // Connect to Redis
      await redis.connect();
      console.log('✅ Redis connected');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize connections:', error.message);
      throw error;
    }
  }

  /**
   * Get Spotify access token using Client Credentials flow
   */
  async getSpotifyAccessToken() {
    try {
      if (!this.spotifyConfig.clientId || !this.spotifyConfig.clientSecret) {
        throw new Error('Missing Spotify credentials. Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET');
      }

      // Check if we have a valid token
      if (this.spotifyConfig.accessToken && this.spotifyConfig.tokenExpiresAt > Date.now()) {
        return this.spotifyConfig.accessToken;
      }

      console.log('🔑 Getting Spotify access token...');
      
      const credentials = Buffer.from(`${this.spotifyConfig.clientId}:${this.spotifyConfig.clientSecret}`).toString('base64');
      
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      });

      if (!response.ok) {
        throw new Error(`Spotify auth failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      this.spotifyConfig.accessToken = data.access_token;
      this.spotifyConfig.tokenExpiresAt = Date.now() + (data.expires_in * 1000) - 60000; // 1 minute buffer

      console.log('✅ Spotify access token obtained');
      return this.spotifyConfig.accessToken;
      
    } catch (error) {
      console.error('❌ Failed to get Spotify access token:', error.message);
      throw error;
    }
  }

  /**
   * Find tracks missing audio features
   */
  async findMissingAudioFeatures() {
    try {
      console.log('🔍 Finding tracks missing audio features...');
      
      const missingFeatures = await this.collection.find({
        $or: [
          { 'audio_features': { $exists: false } },
          { 'audio_features': null },
          { 'audio_features.danceability': { $exists: false } },
          { 'audio_features.energy': { $exists: false } }
        ]
      }).toArray();

      console.log(`📊 Found ${missingFeatures.length} tracks missing audio features`);
      
      return missingFeatures;
      
    } catch (error) {
      console.error('❌ Failed to find missing audio features:', error.message);
      throw error;
    }
  }

  /**
   * Extract Spotify track ID from various URI formats
   */
  extractTrackId(uri) {
    if (!uri) return null;
    
    // Handle different URI formats:
    // spotify:track:4iV5W9uYEdYUVa79Axb7Rh
    // https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh
    // 4iV5W9uYEdYUVa79Axb7Rh (plain ID)
    
    if (uri.includes('spotify:track:')) {
      return uri.split('spotify:track:')[1].split('?')[0];
    }
    
    if (uri.includes('open.spotify.com/track/')) {
      return uri.split('open.spotify.com/track/')[1].split('?')[0];
    }
    
    // If it's already just the ID (22 characters, alphanumeric)
    if (uri.length === 22 && /^[a-zA-Z0-9]+$/.test(uri)) {
      return uri;
    }
    
    return null;
  }

  /**
   * Fetch audio features from Spotify API for a batch of track IDs
   */
  async fetchAudioFeaturesBatch(trackIds) {
    try {
      const accessToken = await this.getSpotifyAccessToken();
      const validTrackIds = trackIds.filter(id => id && id.length === 22);
      
      if (validTrackIds.length === 0) {
        return {};
      }

      // Check Redis cache first
      const cacheResults = {};
      const uncachedIds = [];
      
      for (const trackId of validTrackIds) {
        const cached = await redis.getAudioFeatures(trackId);
        if (cached) {
          cacheResults[trackId] = cached;
          this.cachedCount++;
        } else {
          uncachedIds.push(trackId);
        }
      }

      if (uncachedIds.length === 0) {
        return cacheResults;
      }

      console.log(`🎵 Fetching audio features for ${uncachedIds.length} tracks from Spotify API...`);
      
      const response = await fetch(
        `https://api.spotify.com/v1/audio-features?ids=${uncachedIds.join(',')}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After')) || 1;
        console.log(`⏱️  Rate limited, waiting ${retryAfter} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        return await this.fetchAudioFeaturesBatch(trackIds); // Retry
      }

      if (!response.ok) {
        throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const results = { ...cacheResults };
      
      if (data.audio_features) {
        for (let i = 0; i < data.audio_features.length; i++) {
          const features = data.audio_features[i];
          const trackId = uncachedIds[i];
          
          if (features) {
            results[trackId] = features;
            // Cache the result
            await redis.cacheAudioFeatures(trackId, features);
            this.fetchedCount++;
          } else {
            console.log(`⚠️  No audio features available for track: ${trackId}`);
            this.failedCount++;
          }
        }
      }

      return results;
      
    } catch (error) {
      console.error('❌ Failed to fetch audio features batch:', error.message);
      this.failedCount += trackIds.length;
      return {};
    }
  }

  /**
   * Update tracks in MongoDB with fetched audio features
   */
  async updateTracksWithAudioFeatures(tracks, audioFeatures) {
    try {
      const bulkOperations = [];
      
      for (const track of tracks) {
        const trackId = this.extractTrackId(track.uri || track.track_uri || track.id);
        if (trackId && audioFeatures[trackId]) {
          bulkOperations.push({
            updateOne: {
              filter: { _id: track._id },
              update: {
                $set: {
                  audio_features: audioFeatures[trackId],
                  audio_features_updated_at: new Date(),
                  audio_features_source: 'spotify_api'
                }
              }
            }
          });
        }
      }

      if (bulkOperations.length > 0) {
        const result = await this.collection.bulkWrite(bulkOperations);
        console.log(`✅ Updated ${result.modifiedCount} tracks with audio features`);
        return result.modifiedCount;
      }
      
      return 0;
      
    } catch (error) {
      console.error('❌ Failed to update tracks with audio features:', error.message);
      return 0;
    }
  }

  /**
   * Process all missing audio features
   */
  async processAllMissingFeatures() {
    try {
      console.log('🚀 Starting audio features processing...\n');
      
      const missingTracks = await this.findMissingAudioFeatures();
      if (missingTracks.length === 0) {
        console.log('✅ All tracks already have audio features!');
        return;
      }

      console.log(`📝 Processing ${missingTracks.length} tracks in batches of ${this.batchSize}...\n`);
      
      let processedCount = 0;
      let updatedCount = 0;

      // Process in batches
      for (let i = 0; i < missingTracks.length; i += this.batchSize) {
        const batch = missingTracks.slice(i, i + this.batchSize);
        const batchNum = Math.floor(i / this.batchSize) + 1;
        const totalBatches = Math.ceil(missingTracks.length / this.batchSize);
        
        console.log(`📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} tracks)...`);
        
        // Extract track IDs from the batch
        const trackIds = batch.map(track => 
          this.extractTrackId(track.uri || track.track_uri || track.id)
        ).filter(id => id);

        if (trackIds.length === 0) {
          console.log('⚠️  No valid track IDs in this batch');
          continue;
        }

        // Fetch audio features
        const audioFeatures = await this.fetchAudioFeaturesBatch(trackIds);
        
        // Update tracks in database
        const updated = await this.updateTracksWithAudioFeatures(batch, audioFeatures);
        updatedCount += updated;
        
        processedCount += batch.length;
        
        console.log(`📊 Batch ${batchNum} complete: ${Object.keys(audioFeatures).length} features fetched, ${updated} tracks updated`);
        console.log(`📈 Progress: ${processedCount}/${missingTracks.length} tracks processed (${((processedCount / missingTracks.length) * 100).toFixed(1)}%)\n`);
        
        // Rate limiting delay
        if (i + this.batchSize < missingTracks.length) {
          console.log(`⏳ Waiting ${this.delayBetweenRequests}ms before next batch...`);
          await new Promise(resolve => setTimeout(resolve, this.delayBetweenRequests));
        }
      }

      console.log('\n🎉 Audio features processing complete!');
      console.log(`📊 Final Results:`);
      console.log(`   • Total tracks processed: ${processedCount}`);
      console.log(`   • Features fetched from API: ${this.fetchedCount}`);
      console.log(`   • Features from cache: ${this.cachedCount}`);
      console.log(`   • Failed fetches: ${this.failedCount}`);
      console.log(`   • Database updates: ${updatedCount}`);
      
      return {
        processed: processedCount,
        fetched: this.fetchedCount,
        cached: this.cachedCount,
        failed: this.failedCount,
        updated: updatedCount
      };
      
    } catch (error) {
      console.error('❌ Failed to process missing audio features:', error.message);
      throw error;
    }
  }

  /**
   * Generate summary report
   */
  async generateReport() {
    try {
      console.log('📄 Generating audio features summary report...');
      
      // Get current statistics
      const totalTracks = await this.collection.countDocuments();
      const tracksWithFeatures = await this.collection.countDocuments({
        'audio_features.danceability': { $exists: true }
      });
      const tracksWithoutFeatures = totalTracks - tracksWithFeatures;
      const coverage = totalTracks > 0 ? ((tracksWithFeatures / totalTracks) * 100).toFixed(1) : 0;

      const report = {
        timestamp: new Date().toISOString(),
        database: {
          totalTracks: totalTracks,
          tracksWithFeatures: tracksWithFeatures,
          tracksWithoutFeatures: tracksWithoutFeatures,
          coverage: `${coverage}%`
        },
        processing: {
          fetched: this.fetchedCount,
          cached: this.cachedCount,
          failed: this.failedCount,
          totalProcessed: this.fetchedCount + this.cachedCount
        },
        nextSteps: [
          tracksWithoutFeatures > 0 ? `Run script again to process remaining ${tracksWithoutFeatures} tracks` : 'All tracks have audio features ✅',
          'Implement feature vectors for ML algorithms',
          'Build user preference profiles from listening patterns',
          'Deploy recommendation algorithms'
        ]
      };

      const reportPath = path.join(process.cwd(), 'AUDIO_FEATURES_FETCH_REPORT.json');
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      
      console.log('\n📊 Audio Features Summary:');
      console.log(`   📁 Total tracks in database: ${totalTracks}`);
      console.log(`   ✅ Tracks with audio features: ${tracksWithFeatures}`);
      console.log(`   ❌ Tracks without audio features: ${tracksWithoutFeatures}`);
      console.log(`   📈 Coverage: ${coverage}%`);
      console.log(`   📄 Report saved to: AUDIO_FEATURES_FETCH_REPORT.json`);
      
      return report;
      
    } catch (error) {
      console.error('❌ Failed to generate report:', error.message);
      throw error;
    }
  }

  /**
   * Close all connections
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
  console.log('🎵 EchoTune AI - Audio Features Fetcher');
  console.log('🚀 Critical Priority: Fetch missing audio features via Spotify API\n');

  const fetcher = new AudioFeaturesFetcher();
  
  try {
    // Initialize connections
    await fetcher.initialize();
    
    // Process all missing audio features
    await fetcher.processAllMissingFeatures();
    
    // Generate summary report
    await fetcher.generateReport();
    
    console.log('\n✅ Audio features fetching completed successfully!');
    console.log('🔄 Next roadmap task: Implement Feature Vectors');
    
  } catch (error) {
    console.error('\n❌ Audio features fetching failed:', error.message);
    console.error('💡 Check your Spotify API credentials and MongoDB connection');
    process.exit(1);
  } finally {
    await fetcher.close();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = AudioFeaturesFetcher;