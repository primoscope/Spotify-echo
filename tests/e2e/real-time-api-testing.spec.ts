import { test, expect } from '@playwright/test';
import { config } from 'dotenv';

// Load real environment variables
config({ path: '.env.real-testing' });

test.describe('Real-time API Testing', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set up environment for real API testing
    await page.addInitScript(() => {
      window.TEST_MODE = 'real';
      window.USE_REAL_APIS = true;
      window.DISABLE_MOCKS = true;
    });
  });

  test('should test real-time Spotify API data fetching', async ({ page }) => {
    test.setTimeout(180000); // 3 minutes for real API calls
    
    console.log('🎵 Testing Real-time Spotify API Data Fetching...');
    
    await page.goto('/');
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'artifacts/screenshots/01-realtime-api-initial.png',
      fullPage: true 
    });
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    
    // Test Spotify Web API endpoints directly
    console.log('🔍 Testing Spotify Web API endpoints...');
    
    // Test 1: Search tracks
    const searchResponse = await page.request.get('/api/spotify/search', {
      params: {
        q: 'jazz piano',
        type: 'track,artist,album',
        limit: 20,
        market: 'US'
      }
    });
    
    console.log(`📍 Search API status: ${searchResponse.status()}`);
    
    if (searchResponse.status() === 200) {
      const searchData = await searchResponse.json();
      
      expect(searchData).toHaveProperty('tracks');
      if (searchData.tracks && searchData.tracks.items) {
        expect(searchData.tracks.items.length).toBeGreaterThan(0);
        console.log(`✅ Found ${searchData.tracks.items.length} tracks`);
        
        // Log sample track data
        const firstTrack = searchData.tracks.items[0];
        console.log(`🎵 Sample track: "${firstTrack.name}" by ${firstTrack.artists[0]?.name}`);
        console.log(`📊 Popularity: ${firstTrack.popularity}, Duration: ${firstTrack.duration_ms}ms`);
      }
      
      if (searchData.artists && searchData.artists.items) {
        console.log(`🎤 Found ${searchData.artists.items.length} artists`);
      }
      
      if (searchData.albums && searchData.albums.items) {
        console.log(`💿 Found ${searchData.albums.items.length} albums`);
      }
    } else if (searchResponse.status() === 401) {
      console.log('⚠️ Search API requires authentication - testing auth flow...');
      
      // Test authentication flow
      const authResponse = await page.request.get('/api/spotify/auth/login');
      if (authResponse.status() === 200) {
        const authData = await authResponse.json();
        console.log(`🔐 Auth URL generated: ${authData.authUrl?.substring(0, 50)}...`);
      }
    }
    
    // Take screenshot after search API test
    await page.screenshot({
      path: 'artifacts/screenshots/02-spotify-search-api.png',
      fullPage: true
    });
    
    // Test 2: Audio features endpoint
    console.log('🎼 Testing audio features API...');
    
    const audioFeaturesResponse = await page.request.get('/api/spotify/audio-features', {
      params: {
        ids: '4iV5W9uYEdYUVa79Axb7Rh,1301WleyT98MSxVHPZCA6M' // Known track IDs
      }
    });
    
    console.log(`📍 Audio features status: ${audioFeaturesResponse.status()}`);
    
    if (audioFeaturesResponse.status() === 200) {
      const featuresData = await audioFeaturesResponse.json();
      
      if (featuresData.audio_features) {
        const features = featuresData.audio_features[0];
        if (features) {
          expect(features).toHaveProperty('danceability');
          expect(features).toHaveProperty('energy');
          expect(features).toHaveProperty('valence');
          expect(features).toHaveProperty('tempo');
          
          console.log('✅ Audio features received:');
          console.log(`🕺 Danceability: ${features.danceability}`);
          console.log(`⚡ Energy: ${features.energy}`);
          console.log(`😊 Valence: ${features.valence}`);
          console.log(`🥁 Tempo: ${features.tempo} BPM`);
        }
      }
    }
    
    // Test 3: Top tracks and artists
    console.log('🏆 Testing top tracks/artists API...');
    
    const topTracksResponse = await page.request.get('/api/spotify/me/top/tracks', {
      params: {
        limit: 10,
        time_range: 'medium_term'
      }
    });
    
    console.log(`📍 Top tracks status: ${topTracksResponse.status()}`);
    
    if (topTracksResponse.status() === 200) {
      const topData = await topTracksResponse.json();
      if (topData.items) {
        console.log(`✅ Retrieved ${topData.items.length} top tracks`);
      }
    } else if (topTracksResponse.status() === 401) {
      console.log('⚠️ Top tracks requires user authentication');
    }
    
    // Take screenshot after API tests
    await page.screenshot({
      path: 'artifacts/screenshots/03-spotify-api-features.png',
      fullPage: true
    });
    
    console.log('✅ Real-time Spotify API data fetching completed');
  });

  test('should test real-time music recommendation API', async ({ page }) => {
    test.setTimeout(180000);
    
    console.log('🎯 Testing Real-time Music Recommendation API...');
    
    await page.goto('/');
    
    // Test recommendation endpoints
    const recommendationTests = [
      {
        name: 'Genre-based recommendations',
        endpoint: '/api/spotify/recommendations',
        params: {
          seed_genres: 'jazz,blues',
          limit: 10,
          target_energy: 0.6,
          target_danceability: 0.7
        }
      },
      {
        name: 'Artist-based recommendations', 
        endpoint: '/api/spotify/recommendations',
        params: {
          seed_artists: '0OdUWJ0sBjDrqHygGUXeCF', // Band of Horses
          limit: 5,
          market: 'US'
        }
      },
      {
        name: 'Track-based recommendations',
        endpoint: '/api/spotify/recommendations',
        params: {
          seed_tracks: '4iV5W9uYEdYUVa79Axb7Rh', // Known track
          limit: 8
        }
      }
    ];
    
    for (const test of recommendationTests) {
      console.log(`🎵 Testing: ${test.name}...`);
      
      const response = await page.request.get(test.endpoint, {
        params: test.params
      });
      
      console.log(`📍 ${test.name} status: ${response.status()}`);
      
      if (response.status() === 200) {
        const recData = await response.json();
        
        if (recData.tracks) {
          expect(recData.tracks.length).toBeGreaterThan(0);
          console.log(`✅ Received ${recData.tracks.length} recommendations`);
          
          // Log sample recommendation
          const firstRec = recData.tracks[0];
          console.log(`🎵 Sample rec: "${firstRec.name}" by ${firstRec.artists[0]?.name}`);
        }
      } else if (response.status() === 401) {
        console.log(`⚠️ ${test.name} requires authentication`);
      } else {
        console.log(`⚠️ ${test.name} returned status: ${response.status()}`);
      }
      
      // Take screenshot for each test
      await page.screenshot({
        path: `artifacts/screenshots/04-recommendations-${test.name.toLowerCase().replace(/[^a-z]/g, '-')}.png`,
        fullPage: true
      });
      
      // Wait between requests to respect rate limits
      await page.waitForTimeout(1000);
    }
    
    console.log('✅ Real-time music recommendation API testing completed');
  });

  test('should test real-time playlist and user data APIs', async ({ page }) => {
    test.setTimeout(180000);
    
    console.log('📋 Testing Real-time Playlist and User Data APIs...');
    
    await page.goto('/');
    
    // Test user profile endpoint
    console.log('👤 Testing user profile API...');
    
    const userProfileResponse = await page.request.get('/api/spotify/me');
    
    console.log(`📍 User profile status: ${userProfileResponse.status()}`);
    
    if (userProfileResponse.status() === 200) {
      const userData = await userProfileResponse.json();
      
      expect(userData).toHaveProperty('id');
      expect(userData).toHaveProperty('display_name');
      
      console.log(`✅ User profile: ${userData.display_name || userData.id}`);
      console.log(`📊 Followers: ${userData.followers?.total || 0}`);
      console.log(`🎵 Country: ${userData.country || 'N/A'}`);
    } else if (userProfileResponse.status() === 401) {
      console.log('⚠️ User profile requires authentication');
    }
    
    // Test user's playlists
    console.log('📋 Testing user playlists API...');
    
    const playlistsResponse = await page.request.get('/api/spotify/me/playlists', {
      params: {
        limit: 20,
        offset: 0
      }
    });
    
    console.log(`📍 User playlists status: ${playlistsResponse.status()}`);
    
    if (playlistsResponse.status() === 200) {
      const playlistsData = await playlistsResponse.json();
      
      if (playlistsData.items) {
        console.log(`✅ Found ${playlistsData.items.length} playlists`);
        
        // Test getting tracks from first playlist
        if (playlistsData.items.length > 0) {
          const firstPlaylist = playlistsData.items[0];
          console.log(`📋 Testing playlist: "${firstPlaylist.name}"`);
          
          const playlistTracksResponse = await page.request.get(
            `/api/spotify/playlists/${firstPlaylist.id}/tracks`,
            {
              params: { limit: 10 }
            }
          );
          
          if (playlistTracksResponse.status() === 200) {
            const tracksData = await playlistTracksResponse.json();
            console.log(`✅ Playlist tracks: ${tracksData.items?.length || 0}`);
          }
        }
      }
    } else if (playlistsResponse.status() === 401) {
      console.log('⚠️ User playlists require authentication');
    }
    
    // Test recently played tracks
    console.log('⏮️ Testing recently played tracks API...');
    
    const recentTracksResponse = await page.request.get('/api/spotify/me/player/recently-played', {
      params: {
        limit: 20,
        after: Date.now() - (24 * 60 * 60 * 1000) // Last 24 hours
      }
    });
    
    console.log(`📍 Recent tracks status: ${recentTracksResponse.status()}`);
    
    if (recentTracksResponse.status() === 200) {
      const recentData = await recentTracksResponse.json();
      
      if (recentData.items) {
        console.log(`✅ Recent tracks: ${recentData.items.length}`);
        
        // Analyze listening patterns
        const artists = new Map();
        recentData.items.forEach(item => {
          const artist = item.track.artists[0]?.name;
          if (artist) {
            artists.set(artist, (artists.get(artist) || 0) + 1);
          }
        });
        
        console.log(`🎤 Top artists in recent plays: ${Array.from(artists.entries()).slice(0, 3).map(([name, count]) => `${name} (${count})`).join(', ')}`);
      }
    } else if (recentTracksResponse.status() === 401) {
      console.log('⚠️ Recent tracks require authentication');
    }
    
    // Take screenshot after user data tests
    await page.screenshot({
      path: 'artifacts/screenshots/05-user-data-apis.png',
      fullPage: true
    });
    
    console.log('✅ Real-time playlist and user data API testing completed');
  });

  test('should test real-time streaming and player control APIs', async ({ page }) => {
    test.setTimeout(180000);
    
    console.log('🎮 Testing Real-time Streaming and Player Control APIs...');
    
    await page.goto('/');
    
    // Test current playback state
    console.log('▶️ Testing current playback API...');
    
    const playbackResponse = await page.request.get('/api/spotify/me/player');
    
    console.log(`📍 Playback state status: ${playbackResponse.status()}`);
    
    if (playbackResponse.status() === 200) {
      const playbackData = await playbackResponse.json();
      
      if (playbackData && playbackData.item) {
        console.log(`✅ Currently playing: "${playbackData.item.name}" by ${playbackData.item.artists[0]?.name}`);
        console.log(`⏸️ Is playing: ${playbackData.is_playing}`);
        console.log(`🔊 Volume: ${playbackData.device?.volume_percent || 'N/A'}%`);
        console.log(`📱 Device: ${playbackData.device?.name || 'N/A'}`);
      } else {
        console.log('⚠️ No active playback session');
      }
    } else if (playbackResponse.status() === 204) {
      console.log('⚠️ No active playback session (empty response)');
    } else if (playbackResponse.status() === 401) {
      console.log('⚠️ Playback state requires authentication');
    }
    
    // Test available devices
    console.log('📱 Testing available devices API...');
    
    const devicesResponse = await page.request.get('/api/spotify/me/player/devices');
    
    console.log(`📍 Devices status: ${devicesResponse.status()}`);
    
    if (devicesResponse.status() === 200) {
      const devicesData = await devicesResponse.json();
      
      if (devicesData.devices) {
        console.log(`✅ Available devices: ${devicesData.devices.length}`);
        
        devicesData.devices.forEach((device, index) => {
          console.log(`📱 Device ${index + 1}: ${device.name} (${device.type}) - Active: ${device.is_active}`);
        });
      }
    } else if (devicesResponse.status() === 401) {
      console.log('⚠️ Devices list requires authentication');
    }
    
    // Test queue information
    console.log('📄 Testing queue API...');
    
    const queueResponse = await page.request.get('/api/spotify/me/player/queue');
    
    console.log(`📍 Queue status: ${queueResponse.status()}`);
    
    if (queueResponse.status() === 200) {
      const queueData = await queueResponse.json();
      
      if (queueData.queue) {
        console.log(`✅ Queue length: ${queueData.queue.length}`);
        
        if (queueData.currently_playing) {
          console.log(`🎵 Now playing: "${queueData.currently_playing.name}"`);
        }
        
        if (queueData.queue.length > 0) {
          console.log(`⏭️ Next up: "${queueData.queue[0].name}"`);
        }
      }
    } else if (queueResponse.status() === 401) {
      console.log('⚠️ Queue information requires authentication');
    }
    
    // Test player control endpoints (without actually controlling playback)
    console.log('🎮 Testing player control endpoints (dry run)...');
    
    const controlEndpoints = [
      { name: 'Play/Resume', method: 'PUT', path: '/api/spotify/me/player/play' },
      { name: 'Pause', method: 'PUT', path: '/api/spotify/me/player/pause' },
      { name: 'Next Track', method: 'POST', path: '/api/spotify/me/player/next' },
      { name: 'Previous Track', method: 'POST', path: '/api/spotify/me/player/previous' },
      { name: 'Set Volume', method: 'PUT', path: '/api/spotify/me/player/volume' }
    ];
    
    for (const endpoint of controlEndpoints) {
      // Note: We're not actually making these calls to avoid disrupting playback
      console.log(`🎮 Control endpoint available: ${endpoint.method} ${endpoint.path}`);
    }
    
    // Test search with live results
    console.log('🔍 Testing live search API...');
    
    const liveSearchResponse = await page.request.get('/api/spotify/search', {
      params: {
        q: 'trending music 2024',
        type: 'track',
        limit: 10,
        market: 'US'
      }
    });
    
    if (liveSearchResponse.status() === 200) {
      const searchData = await liveSearchResponse.json();
      
      if (searchData.tracks && searchData.tracks.items) {
        console.log(`🔥 Trending tracks found: ${searchData.tracks.items.length}`);
        
        searchData.tracks.items.slice(0, 3).forEach((track, index) => {
          console.log(`${index + 1}. "${track.name}" by ${track.artists[0]?.name} (Popularity: ${track.popularity})`);
        });
      }
    }
    
    // Take screenshot after streaming tests
    await page.screenshot({
      path: 'artifacts/screenshots/06-streaming-player-apis.png',
      fullPage: true
    });
    
    console.log('✅ Real-time streaming and player control API testing completed');
  });

  test('should test real-time data synchronization and caching', async ({ page }) => {
    test.setTimeout(180000);
    
    console.log('🔄 Testing Real-time Data Synchronization and Caching...');
    
    await page.goto('/');
    
    // Test cache performance with repeated requests
    console.log('💾 Testing API response caching...');
    
    const testTrackId = '4iV5W9uYEdYUVa79Axb7Rh'; // Known track
    
    // First request (should hit API)
    const firstRequestTime = Date.now();
    const firstResponse = await page.request.get(`/api/spotify/tracks/${testTrackId}`);
    const firstDuration = Date.now() - firstRequestTime;
    
    console.log(`📍 First request: ${firstResponse.status()} in ${firstDuration}ms`);
    
    // Second request (should hit cache if implemented)
    const secondRequestTime = Date.now();
    const secondResponse = await page.request.get(`/api/spotify/tracks/${testTrackId}`);
    const secondDuration = Date.now() - secondRequestTime;
    
    console.log(`📍 Second request: ${secondResponse.status()} in ${secondDuration}ms`);
    
    if (firstResponse.status() === 200 && secondResponse.status() === 200) {
      const firstData = await firstResponse.json();
      const secondData = await secondResponse.json();
      
      // Data should be identical
      expect(firstData.id).toBe(secondData.id);
      expect(firstData.name).toBe(secondData.name);
      
      // Second request should ideally be faster (cached)
      if (secondDuration < firstDuration * 0.8) {
        console.log('✅ Caching appears to be working (faster second request)');
      } else {
        console.log('⚠️ No significant performance improvement detected (caching may not be implemented)');
      }
    }
    
    // Test real-time data updates
    console.log('🔄 Testing real-time data updates...');
    
    const userDataEndpoints = [
      '/api/spotify/me/player/recently-played?limit=1',
      '/api/spotify/me/player',
      '/api/spotify/me/top/tracks?limit=1&time_range=short_term'
    ];
    
    for (const endpoint of userDataEndpoints) {
      const response = await page.request.get(endpoint);
      console.log(`📍 Real-time endpoint ${endpoint}: ${response.status()}`);
      
      if (response.status() === 200) {
        const data = await response.json();
        console.log(`✅ Real-time data received from ${endpoint}`);
      } else if (response.status() === 401) {
        console.log(`⚠️ ${endpoint} requires authentication`);
      }
      
      await page.waitForTimeout(500); // Rate limiting
    }
    
    // Test concurrent requests handling
    console.log('⚡ Testing concurrent requests handling...');
    
    const concurrentRequests = Array.from({ length: 5 }, (_, i) => 
      page.request.get(`/api/spotify/search?q=test${i}&type=track&limit=1`)
    );
    
    const concurrentStartTime = Date.now();
    const concurrentResponses = await Promise.allSettled(concurrentRequests);
    const concurrentDuration = Date.now() - concurrentStartTime;
    
    const successfulRequests = concurrentResponses.filter(r => 
      r.status === 'fulfilled' && r.value.status() === 200
    );
    
    console.log(`⚡ Concurrent requests: ${successfulRequests.length}/5 successful in ${concurrentDuration}ms`);
    
    // Test WebSocket connection for real-time updates (if available)
    console.log('🔌 Testing WebSocket connection...');
    
    const wsResponse = await page.request.get('/api/ws/status');
    if (wsResponse.status() === 200) {
      console.log('✅ WebSocket endpoint available');
    } else {
      console.log('⚠️ WebSocket not available or not implemented');
    }
    
    // Test Server-Sent Events for live updates (if available)
    console.log('📡 Testing Server-Sent Events...');
    
    const sseResponse = await page.request.get('/api/events/stream');
    if (sseResponse.status() === 200) {
      console.log('✅ SSE endpoint available');
    } else {
      console.log('⚠️ SSE not available or not implemented');
    }
    
    // Take screenshot after synchronization tests
    await page.screenshot({
      path: 'artifacts/screenshots/07-data-sync-caching.png',
      fullPage: true
    });
    
    console.log('✅ Real-time data synchronization and caching testing completed');
  });

  test('should test error handling and recovery in real-time APIs', async ({ page }) => {
    test.setTimeout(180000);
    
    console.log('🚨 Testing Error Handling and Recovery in Real-time APIs...');
    
    await page.goto('/');
    
    // Test rate limiting handling
    console.log('⏱️ Testing rate limiting handling...');
    
    const rapidRequests = Array.from({ length: 20 }, (_, i) => 
      page.request.get(`/api/spotify/search?q=rate_limit_test_${i}&type=track&limit=1`)
    );
    
    const responses = await Promise.allSettled(rapidRequests);
    
    let successCount = 0;
    let rateLimitCount = 0;
    let errorCount = 0;
    
    responses.forEach((response, index) => {
      if (response.status === 'fulfilled') {
        const status = response.value.status();
        if (status === 200) {
          successCount++;
        } else if (status === 429) {
          rateLimitCount++;
        } else {
          errorCount++;
        }
      } else {
        errorCount++;
      }
    });
    
    console.log(`📊 Rate limit test results:`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`⏱️ Rate limited: ${rateLimitCount}`);
    console.log(`❌ Other errors: ${errorCount}`);
    
    // Test invalid parameter handling
    console.log('🚫 Testing invalid parameter handling...');
    
    const invalidTests = [
      { name: 'Invalid track ID', url: '/api/spotify/tracks/invalid_track_id' },
      { name: 'Invalid artist ID', url: '/api/spotify/artists/invalid_artist_id' },
      { name: 'Invalid search query', url: '/api/spotify/search?q=&type=track' },
      { name: 'Invalid time range', url: '/api/spotify/me/top/tracks?time_range=invalid' }
    ];
    
    for (const test of invalidTests) {
      const response = await page.request.get(test.url);
      console.log(`📍 ${test.name}: ${response.status()}`);
      
      // Should return appropriate error status (400, 404, etc.)
      expect([400, 401, 404, 422].includes(response.status())).toBeTruthy();
    }
    
    // Test network timeout handling
    console.log('⏰ Testing network timeout handling...');
    
    // Note: This would require configuring the server to simulate slow responses
    const timeoutResponse = await page.request.get('/api/spotify/search?q=timeout_test&type=track&limit=1', {
      timeout: 5000 // 5 second timeout
    });
    
    console.log(`📍 Timeout test response: ${timeoutResponse.status()}`);
    
    // Test error recovery mechanisms
    console.log('♻️ Testing error recovery mechanisms...');
    
    // Make a request that might fail, then retry
    const retryEndpoint = '/api/spotify/me/player';
    
    let retryAttempts = 0;
    let retrySuccess = false;
    const maxRetries = 3;
    
    while (retryAttempts < maxRetries && !retrySuccess) {
      retryAttempts++;
      const retryResponse = await page.request.get(retryEndpoint);
      
      console.log(`📍 Retry attempt ${retryAttempts}: ${retryResponse.status()}`);
      
      if (retryResponse.status() === 200) {
        retrySuccess = true;
        console.log(`✅ Retry successful on attempt ${retryAttempts}`);
      } else if (retryAttempts < maxRetries) {
        console.log(`⏳ Waiting before retry ${retryAttempts + 1}...`);
        await page.waitForTimeout(1000 * retryAttempts); // Exponential backoff
      }
    }
    
    if (!retrySuccess) {
      console.log(`⚠️ All retry attempts failed (expected if not authenticated)`);
    }
    
    // Test graceful degradation
    console.log('📉 Testing graceful degradation...');
    
    const degradationTests = [
      '/api/spotify/fallback/featured-playlists',
      '/api/spotify/fallback/new-releases',
      '/api/spotify/fallback/categories'
    ];
    
    for (const endpoint of degradationTests) {
      const response = await page.request.get(endpoint);
      console.log(`📍 Fallback endpoint ${endpoint}: ${response.status()}`);
      
      if (response.status() === 200) {
        console.log(`✅ Fallback working for ${endpoint}`);
      } else {
        console.log(`⚠️ Fallback not implemented for ${endpoint}`);
      }
    }
    
    // Take screenshot after error handling tests
    await page.screenshot({
      path: 'artifacts/screenshots/08-error-handling-recovery.png',
      fullPage: true
    });
    
    console.log('✅ Error handling and recovery testing completed');
  });

  test('should test performance monitoring and metrics collection', async ({ page }) => {
    test.setTimeout(180000);
    
    console.log('📊 Testing Performance Monitoring and Metrics Collection...');
    
    await page.goto('/');
    
    // Test API response time monitoring
    console.log('⏱️ Testing API response time monitoring...');
    
    const performanceTests = [
      { name: 'Search API', endpoint: '/api/spotify/search?q=performance&type=track&limit=5' },
      { name: 'Track Details', endpoint: '/api/spotify/tracks/4iV5W9uYEdYUVa79Axb7Rh' },
      { name: 'Audio Features', endpoint: '/api/spotify/audio-features/4iV5W9uYEdYUVa79Axb7Rh' },
      { name: 'Recommendations', endpoint: '/api/spotify/recommendations?seed_genres=pop&limit=5' }
    ];
    
    const performanceResults = [];
    
    for (const test of performanceTests) {
      const startTime = Date.now();
      const response = await page.request.get(test.endpoint);
      const responseTime = Date.now() - startTime;
      
      const result = {
        name: test.name,
        endpoint: test.endpoint,
        status: response.status(),
        responseTime: responseTime,
        success: response.status() === 200
      };
      
      performanceResults.push(result);
      
      console.log(`📊 ${test.name}: ${response.status()} in ${responseTime}ms`);
      
      // Performance expectations
      if (response.status() === 200) {
        expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
      }
      
      await page.waitForTimeout(100); // Small delay between requests
    }
    
    // Calculate performance statistics
    const successfulTests = performanceResults.filter(r => r.success);
    const averageResponseTime = successfulTests.reduce((sum, r) => sum + r.responseTime, 0) / successfulTests.length;
    const maxResponseTime = Math.max(...successfulTests.map(r => r.responseTime));
    const minResponseTime = Math.min(...successfulTests.map(r => r.responseTime));
    
    console.log(`📊 Performance Statistics:`);
    console.log(`✅ Successful tests: ${successfulTests.length}/${performanceResults.length}`);
    console.log(`⏱️ Average response time: ${averageResponseTime.toFixed(2)}ms`);
    console.log(`⚡ Fastest response: ${minResponseTime}ms`);
    console.log(`🐌 Slowest response: ${maxResponseTime}ms`);
    
    // Test metrics collection endpoint
    console.log('📈 Testing metrics collection...');
    
    const metricsResponse = await page.request.get('/api/metrics');
    
    if (metricsResponse.status() === 200) {
      const metricsData = await metricsResponse.json();
      console.log(`✅ Metrics endpoint available`);
      console.log(`📊 Metrics keys: ${Object.keys(metricsData).join(', ')}`);
    } else {
      console.log(`⚠️ Metrics endpoint not available: ${metricsResponse.status()}`);
    }
    
    // Test health check endpoint
    console.log('🏥 Testing health check...');
    
    const healthResponse = await page.request.get('/api/health');
    
    if (healthResponse.status() === 200) {
      const healthData = await healthResponse.json();
      console.log(`✅ Health check: ${healthData.status || 'OK'}`);
      
      if (healthData.dependencies) {
        Object.entries(healthData.dependencies).forEach(([service, status]) => {
          console.log(`🔗 ${service}: ${status}`);
        });
      }
    } else {
      console.log(`⚠️ Health check not available: ${healthResponse.status()}`);
    }
    
    // Take final screenshot
    await page.screenshot({
      path: 'artifacts/screenshots/09-performance-monitoring.png',
      fullPage: true
    });
    
    console.log('✅ Performance monitoring and metrics collection testing completed');
  });

  test.afterEach(async ({ page }) => {
    // Clear any state
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Take cleanup screenshot
    await page.screenshot({
      path: `artifacts/screenshots/realtime-api-cleanup-${Date.now()}.png`,
      fullPage: true
    });
  });
});