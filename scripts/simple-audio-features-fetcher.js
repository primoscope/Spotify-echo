#!/usr/bin/env node

/**
 * Simple Audio Features Fetcher
 * Quick implementation to fetch missing audio features using Spotify API
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

class SimpleAudioFeaturesFetcher {
  constructor() {
    this.mongodb = null;
    this.db = null;
    this.collection = null;
    this.accessToken = null;
    this.fetchedCount = 0;
    this.failedCount = 0;
    this.batchSize = 50;
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

  async getSpotifyToken() {
    try {
      console.log('🔑 Getting Spotify access token...');
      
      const credentials = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64');
      
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      });

      if (!response.ok) {
        throw new Error(`Spotify auth failed: ${response.status}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      console.log('✅ Spotify access token obtained');
      
      return this.accessToken;
    } catch (error) {
      console.error('❌ Spotify auth failed:', error.message);
      throw error;
    }
  }

  async findMissingAudioFeatures() {
    try {
      console.log('🔍 Finding tracks without audio features...');
      
      const missingFeatures = await this.collection.find({
        $or: [
          { 'audio_features': { $exists: false } },
          { 'audio_features': null },
          { 'audio_features': {} }
        ]
      }).limit(500).toArray(); // Limit to first 500 for testing
      
      console.log(`📊 Found ${missingFeatures.length} tracks missing audio features`);
      return missingFeatures;
    } catch (error) {
      console.error('❌ Error finding missing features:', error.message);
      throw error;
    }
  }

  async fetchAudioFeatures(trackIds) {
    try {
      if (!this.accessToken) {
        await this.getSpotifyToken();
      }

      // Remove spotify:track: prefix and get clean IDs
      const cleanIds = trackIds.map(id => {
        if (id.startsWith('spotify:track:')) {
          return id.replace('spotify:track:', '');
        }
        return id;
      }).filter(id => id && id.length === 22); // Valid Spotify IDs are 22 chars

      if (cleanIds.length === 0) {
        return [];
      }

      const idsString = cleanIds.join(',');
      const url = `https://api.spotify.com/v1/audio-features?ids=${idsString}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || 1;
        console.log(`⏱️  Rate limited, waiting ${retryAfter}s...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        return await this.fetchAudioFeatures(trackIds); // Retry
      }

      if (!response.ok) {
        throw new Error(`Spotify API error: ${response.status}`);
      }

      const data = await response.json();
      return data.audio_features || [];
      
    } catch (error) {
      console.error('❌ Error fetching audio features:', error.message);
      return [];
    }
  }

  async updateTrackWithFeatures(trackId, audioFeatures) {
    try {
      const result = await this.collection.updateOne(
        { track_uri: trackId },
        { 
          $set: { 
            audio_features: audioFeatures,
            audio_features_updated_at: new Date()
          }
        }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('❌ Error updating track:', error.message);
      return false;
    }
  }

  async processBatch(tracks) {
    try {
      console.log(`📦 Processing batch of ${tracks.length} tracks...`);
      
      const trackIds = tracks.map(track => track.track_uri).filter(id => id);
      const audioFeatures = await this.fetchAudioFeatures(trackIds);
      
      let updated = 0;
      for (let i = 0; i < audioFeatures.length; i++) {
        const features = audioFeatures[i];
        if (features && features.id) {
          const trackUri = `spotify:track:${features.id}`;
          const success = await this.updateTrackWithFeatures(trackUri, features);
          if (success) {
            updated++;
            this.fetchedCount++;
          }
        }
      }
      
      console.log(`✅ Updated ${updated} tracks with audio features`);
      return updated;
      
    } catch (error) {
      console.error('❌ Error processing batch:', error.message);
      this.failedCount += tracks.length;
      return 0;
    }
  }

  async run() {
    try {
      console.log('🎵 EchoTune AI - Simple Audio Features Fetcher\n');
      
      await this.initialize();
      await this.getSpotifyToken();
      
      const missingTracks = await this.findMissingAudioFeatures();
      if (missingTracks.length === 0) {
        console.log('✅ No tracks missing audio features!');
        return;
      }
      
      console.log(`🚀 Starting to fetch audio features for ${missingTracks.length} tracks...`);
      
      // Process in batches
      for (let i = 0; i < missingTracks.length; i += this.batchSize) {
        const batch = missingTracks.slice(i, i + this.batchSize);
        await this.processBatch(batch);
        
        // Add delay between batches to respect rate limits
        if (i + this.batchSize < missingTracks.length) {
          console.log('⏱️  Waiting 1 second between batches...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      console.log('\n📊 Final Results:');
      console.log(`✅ Successfully fetched: ${this.fetchedCount} audio features`);
      console.log(`❌ Failed: ${this.failedCount} tracks`);
      console.log('🎉 Audio features fetching completed!');
      
    } catch (error) {
      console.error('❌ Audio features fetching failed:', error.message);
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
  const fetcher = new SimpleAudioFeaturesFetcher();
  fetcher.run();
}

module.exports = SimpleAudioFeaturesFetcher;