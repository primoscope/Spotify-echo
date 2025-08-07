#!/usr/bin/env node

/**
 * Spotify API Configuration Test
 * Tests Spotify API credentials and available endpoints
 */

require('dotenv').config();

class SpotifyAPITester {
  constructor() {
    this.accessToken = null;
    this.clientId = process.env.SPOTIFY_CLIENT_ID;
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  }

  async getAccessToken() {
    try {
      console.log('🔑 Testing Spotify API credentials...');
      
      if (!this.clientId || !this.clientSecret) {
        throw new Error('Missing Spotify credentials. Check SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET');
      }
      
      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Spotify auth failed: ${response.status} ${response.statusText} - ${errorData}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      
      console.log('✅ Spotify API credentials are valid');
      console.log(`   Token type: ${data.token_type}`);
      console.log(`   Expires in: ${data.expires_in} seconds`);
      
      return this.accessToken;
      
    } catch (error) {
      console.error('❌ Spotify API authentication failed:', error.message);
      throw error;
    }
  }

  async testAudioFeaturesEndpoint() {
    try {
      console.log('🎵 Testing audio features endpoint...');
      
      // Test with a known track ID (Never Gonna Give You Up - Rick Astley)
      const testTrackId = '4uLU6hMCjMI75M1A2tKUQC';
      
      const response = await fetch(`https://api.spotify.com/v1/audio-features/${testTrackId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Audio features request failed: ${response.status} ${response.statusText}`);
      }

      const audioFeatures = await response.json();
      
      console.log('✅ Audio features endpoint accessible');
      console.log(`   Test track: ${audioFeatures.id}`);
      console.log(`   Danceability: ${audioFeatures.danceability}`);
      console.log(`   Energy: ${audioFeatures.energy}`);
      console.log(`   Valence: ${audioFeatures.valence}`);
      
      return true;
      
    } catch (error) {
      console.error('❌ Audio features endpoint failed:', error.message);
      return false;
    }
  }

  async testBatchAudioFeatures() {
    try {
      console.log('📦 Testing batch audio features endpoint...');
      
      // Test with multiple track IDs
      const testTrackIds = [
        '4uLU6hMCjMI75M1A2tKUQC', // Never Gonna Give You Up
        '7GhIk7Il098yCjg4BQjzvb', // Bohemian Rhapsody  
        '4VqPOruhp5EdPBeR92t6lQ'  // Uptown Funk
      ];
      
      const idsString = testTrackIds.join(',');
      const url = `https://api.spotify.com/v1/audio-features?ids=${idsString}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Batch audio features request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const audioFeatures = data.audio_features || [];
      
      console.log('✅ Batch audio features endpoint accessible');
      console.log(`   Retrieved features for ${audioFeatures.length} tracks`);
      console.log(`   Average danceability: ${(audioFeatures.reduce((sum, f) => sum + (f?.danceability || 0), 0) / audioFeatures.length).toFixed(3)}`);
      
      return true;
      
    } catch (error) {
      console.error('❌ Batch audio features endpoint failed:', error.message);
      return false;
    }
  }

  async testTrackSearch() {
    try {
      console.log('🔍 Testing track search endpoint...');
      
      const query = encodeURIComponent('Never Gonna Give You Up Rick Astley');
      const url = `https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Search request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const tracks = data.tracks?.items || [];
      
      console.log('✅ Track search endpoint accessible');
      if (tracks.length > 0) {
        console.log(`   Found: ${tracks[0].name} by ${tracks[0].artists[0].name}`);
        console.log(`   Track ID: ${tracks[0].id}`);
      }
      
      return true;
      
    } catch (error) {
      console.error('❌ Track search endpoint failed:', error.message);
      return false;
    }
  }

  async testRateLimits() {
    try {
      console.log('⏱️  Testing API rate limits...');
      
      const requests = [];
      const startTime = Date.now();
      
      // Make 5 quick requests to test rate limiting
      for (let i = 0; i < 5; i++) {
        requests.push(
          fetch('https://api.spotify.com/v1/audio-features/4uLU6hMCjMI75M1A2tKUQC', {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`
            }
          })
        );
      }
      
      const responses = await Promise.all(requests);
      const endTime = Date.now();
      
      const rateLimited = responses.some(r => r.status === 429);
      const avgResponseTime = (endTime - startTime) / requests.length;
      
      console.log('✅ Rate limit test completed');
      console.log(`   Rate limited: ${rateLimited ? 'Yes' : 'No'}`);
      console.log(`   Average response time: ${avgResponseTime.toFixed(0)}ms`);
      
      return { rateLimited, avgResponseTime };
      
    } catch (error) {
      console.error('❌ Rate limit test failed:', error.message);
      return { rateLimited: false, avgResponseTime: 0 };
    }
  }

  async run() {
    try {
      console.log('🎵 EchoTune AI - Spotify API Configuration Test\n');
      
      // Test authentication
      await this.getAccessToken();
      
      // Test individual endpoints
      const singleAudioFeatures = await this.testAudioFeaturesEndpoint();
      const batchAudioFeatures = await this.testBatchAudioFeatures();
      const searchEndpoint = await this.testTrackSearch();
      const rateLimitInfo = await this.testRateLimits();
      
      console.log('\n📊 API Test Results');
      console.log('===================');
      console.log(`✅ Authentication: Working`);
      console.log(`${singleAudioFeatures ? '✅' : '❌'} Single Audio Features: ${singleAudioFeatures ? 'Working' : 'Failed'}`);
      console.log(`${batchAudioFeatures ? '✅' : '❌'} Batch Audio Features: ${batchAudioFeatures ? 'Working' : 'Failed'}`);
      console.log(`${searchEndpoint ? '✅' : '❌'} Track Search: ${searchEndpoint ? 'Working' : 'Failed'}`);
      console.log(`⏱️  Rate Limiting: ${rateLimitInfo.rateLimited ? 'Strict' : 'Permissive'} (${rateLimitInfo.avgResponseTime}ms avg)`);
      
      const allWorking = singleAudioFeatures && batchAudioFeatures && searchEndpoint;
      
      console.log('\n🎯 Recommendations:');
      if (allWorking) {
        console.log('✅ All Spotify API endpoints are working correctly');
        console.log('✅ Ready to fetch missing audio features');
        console.log('✅ Can proceed with production audio feature retrieval');
      } else {
        console.log('⚠️  Some API endpoints have issues');
        console.log('⚠️  Review Spotify app permissions and scope settings');
        console.log('⚠️  Consider using existing audio features from CSV data');
      }
      
      console.log('\n🚀 Next Steps:');
      console.log('1. Use batch audio features endpoint for efficiency');
      console.log('2. Implement rate limiting (100ms delays between requests)');
      console.log('3. Cache results in Redis to avoid repeated API calls');
      console.log('4. Process missing audio features in small batches (50-100 tracks)');
      
      console.log('\n✅ Spotify API test completed!\n');
      
    } catch (error) {
      console.error('❌ Spotify API test failed:', error.message);
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Verify SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env');
      console.log('2. Check Spotify app settings in developer dashboard');
      console.log('3. Ensure app has proper scopes enabled');
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const tester = new SpotifyAPITester();
  tester.run();
}

module.exports = SpotifyAPITester;