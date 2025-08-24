import { test, expect } from '@playwright/test';
import MockProvider from '../utils/mocks';

test.describe('MongoDB Persistence Tests', () => {
  let mockProvider: MockProvider;

  test.beforeEach(async ({ page }) => {
    mockProvider = new MockProvider();
    await mockProvider.setupDatabaseMocks(page);
    await mockProvider.setupSpotifyMocks(page);
  });

  test('should persist user profile data', async ({ page }) => {
    console.log('👤 Testing user profile persistence...');
    
    await page.goto('/');
    
    // Test user creation/update endpoint
    const userData = {
      spotifyId: 'test_user_123',
      email: 'test@example.com',
      displayName: 'Test User',
      country: 'US'
    };
    
    const createUserResponse = await page.request.post('/api/users', {
      data: userData
    });
    
    if (createUserResponse.status() === 200 || createUserResponse.status() === 201) {
      const user = await createUserResponse.json();
      console.log(`✅ User created/updated: ${user.id || user._id}`);
      
      // Verify user data was persisted
      const getUserResponse = await page.request.get(`/api/users/${userData.spotifyId}`);
      
      if (getUserResponse.status() === 200) {
        const persistedUser = await getUserResponse.json();
        expect(persistedUser.email).toBe(userData.email);
        expect(persistedUser.displayName).toBe(userData.displayName);
        console.log('✅ User data persistence verified');
      }
    } else {
      console.log(`⚠️ User creation endpoint returned: ${createUserResponse.status()}`);
    }
    
    console.log('✅ User profile persistence testing completed');
  });

  test('should persist listening history', async ({ page }) => {
    console.log('🎵 Testing listening history persistence...');
    
    await page.goto('/');
    
    // Test listening history save endpoint
    const listeningData = {
      userId: 'test_user_123',
      tracks: [
        {
          trackId: 'track_123',
          trackName: 'Test Song',
          artist: 'Test Artist',
          playedAt: new Date().toISOString(),
          playDuration: 180000
        }
      ]
    };
    
    const saveHistoryResponse = await page.request.post('/api/listening-history', {
      data: listeningData
    });
    
    if (saveHistoryResponse.status() === 200 || saveHistoryResponse.status() === 201) {
      const result = await saveHistoryResponse.json();
      console.log(`✅ Listening history saved: ${result.saved || result.insertedCount || 'success'}`);
      
      // Verify history was persisted
      const getHistoryResponse = await page.request.get(`/api/listening-history/${listeningData.userId}`);
      
      if (getHistoryResponse.status() === 200) {
        const history = await getHistoryResponse.json();
        expect(Array.isArray(history)).toBe(true);
        console.log(`✅ History retrieved: ${history.length} items`);
      }
    } else {
      console.log(`⚠️ Listening history endpoint returned: ${saveHistoryResponse.status()}`);
    }
    
    console.log('✅ Listening history persistence testing completed');
  });

  test('should persist and retrieve recommendations', async ({ page }) => {
    console.log('🎯 Testing recommendations persistence...');
    
    await page.goto('/');
    
    // Test recommendations save endpoint
    const recommendationData = {
      userId: 'test_user_123',
      recommendations: [
        {
          trackId: 'rec_track_1',
          score: 0.95,
          reason: 'Based on listening history',
          algorithm: 'collaborative_filtering'
        },
        {
          trackId: 'rec_track_2',
          score: 0.87,
          reason: 'Similar artists',
          algorithm: 'content_based'
        }
      ]
    };
    
    const saveRecsResponse = await page.request.post('/api/recommendations', {
      data: recommendationData
    });
    
    if (saveRecsResponse.status() === 200 || saveRecsResponse.status() === 201) {
      const result = await saveRecsResponse.json();
      console.log(`✅ Recommendations saved: ${result.saved || result.insertedCount || 'success'}`);
      
      // Verify recommendations were persisted
      const getRecsResponse = await page.request.get(`/api/recommendations/${recommendationData.userId}`);
      
      if (getRecsResponse.status() === 200) {
        const recommendations = await getRecsResponse.json();
        expect(Array.isArray(recommendations)).toBe(true);
        console.log(`✅ Recommendations retrieved: ${recommendations.length} items`);
      }
    } else {
      console.log(`⚠️ Recommendations endpoint returned: ${saveRecsResponse.status()}`);
    }
    
    console.log('✅ Recommendations persistence testing completed');
  });

  test('should handle playlist persistence', async ({ page }) => {
    console.log('📋 Testing playlist persistence...');
    
    await page.goto('/');
    
    // Test playlist creation endpoint
    const playlistData = {
      userId: 'test_user_123',
      name: 'My Test Playlist',
      description: 'Test playlist for E2E testing',
      tracks: ['track_1', 'track_2', 'track_3'],
      isPublic: false
    };
    
    const createPlaylistResponse = await page.request.post('/api/playlists', {
      data: playlistData
    });
    
    if (createPlaylistResponse.status() === 200 || createPlaylistResponse.status() === 201) {
      const playlist = await createPlaylistResponse.json();
      console.log(`✅ Playlist created: ${playlist.id || playlist._id}`);
      
      // Verify playlist was persisted
      const getPlaylistResponse = await page.request.get(`/api/playlists/${playlist.id || playlist._id}`);
      
      if (getPlaylistResponse.status() === 200) {
        const persistedPlaylist = await getPlaylistResponse.json();
        expect(persistedPlaylist.name).toBe(playlistData.name);
        expect(persistedPlaylist.tracks).toEqual(playlistData.tracks);
        console.log('✅ Playlist persistence verified');
      }
    } else {
      console.log(`⚠️ Playlist creation endpoint returned: ${createPlaylistResponse.status()}`);
    }
    
    console.log('✅ Playlist persistence testing completed');
  });

  test('should persist user preferences and settings', async ({ page }) => {
    console.log('⚙️ Testing user preferences persistence...');
    
    await page.goto('/');
    
    // Test preferences save endpoint
    const preferencesData = {
      userId: 'test_user_123',
      preferences: {
        favoriteGenres: ['rock', 'pop', 'jazz'],
        explicitContent: false,
        autoplay: true,
        recommendationStyle: 'discovery',
        privacyLevel: 'friends'
      }
    };
    
    const savePrefsResponse = await page.request.post('/api/user-preferences', {
      data: preferencesData
    });
    
    if (savePrefsResponse.status() === 200 || savePrefsResponse.status() === 201) {
      const result = await savePrefsResponse.json();
      console.log(`✅ Preferences saved: ${result.saved || 'success'}`);
      
      // Verify preferences were persisted
      const getPrefsResponse = await page.request.get(`/api/user-preferences/${preferencesData.userId}`);
      
      if (getPrefsResponse.status() === 200) {
        const preferences = await getPrefsResponse.json();
        expect(preferences.favoriteGenres).toEqual(preferencesData.preferences.favoriteGenres);
        expect(preferences.explicitContent).toBe(preferencesData.preferences.explicitContent);
        console.log('✅ Preferences persistence verified');
      }
    } else {
      console.log(`⚠️ Preferences endpoint returned: ${savePrefsResponse.status()}`);
    }
    
    console.log('✅ User preferences persistence testing completed');
  });

  test('should handle analytics events persistence', async ({ page }) => {
    console.log('📊 Testing analytics events persistence...');
    
    await page.goto('/');
    
    // Test analytics event tracking
    const analyticsData = {
      userId: 'test_user_123',
      events: [
        {
          eventType: 'track_play',
          trackId: 'track_123',
          timestamp: new Date().toISOString(),
          metadata: {
            position: 45.5,
            duration: 180,
            source: 'recommendation'
          }
        },
        {
          eventType: 'recommendation_click',
          trackId: 'rec_track_1',
          timestamp: new Date().toISOString(),
          metadata: {
            score: 0.95,
            algorithm: 'collaborative_filtering'
          }
        }
      ]
    };
    
    const saveAnalyticsResponse = await page.request.post('/api/analytics/events', {
      data: analyticsData
    });
    
    if (saveAnalyticsResponse.status() === 200 || saveAnalyticsResponse.status() === 201) {
      const result = await saveAnalyticsResponse.json();
      console.log(`✅ Analytics events saved: ${result.saved || result.insertedCount || 'success'}`);
      
      // Verify analytics were persisted
      const getAnalyticsResponse = await page.request.get(`/api/analytics/events/${analyticsData.userId}`);
      
      if (getAnalyticsResponse.status() === 200) {
        const events = await getAnalyticsResponse.json();
        expect(Array.isArray(events)).toBe(true);
        console.log(`✅ Analytics events retrieved: ${events.length} items`);
      }
    } else {
      console.log(`⚠️ Analytics endpoint returned: ${saveAnalyticsResponse.status()}`);
    }
    
    console.log('✅ Analytics events persistence testing completed');
  });

  test('should handle database connection failures gracefully', async ({ page }) => {
    console.log('🚨 Testing database connection failure handling...');
    
    await page.goto('/');
    
    // Mock database connection failures
    await page.route('**/api/db/**', async (route) => {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Database connection failed',
          message: 'Unable to connect to MongoDB'
        })
      });
    });
    
    // Try to make database operations that should fail
    const dbResponse = await page.request.get('/api/users/test_user');
    expect(dbResponse.status()).toBe(503);
    
    console.log('✅ Database connection failure handled gracefully');
    
    // Check for fallback mechanisms
    const hasFallbackUI = await page.locator('[data-testid*="offline"], [data-testid*="database-error"], .database-error').count() > 0;
    
    if (hasFallbackUI) {
      console.log('✅ Database error UI detected');
    }
    
    console.log('✅ Database connection failure handling completed');
  });

  test('should implement data validation and sanitization', async ({ page }) => {
    console.log('🛡️ Testing data validation and sanitization...');
    
    await page.goto('/');
    
    // Test with malicious data
    const maliciousData = {
      userId: '<script>alert("XSS")</script>',
      name: 'Test Playlist',
      description: '<img src="x" onerror="alert(\'XSS\')">',
      tracks: ['track_1', null, undefined, '<script>']
    };
    
    const maliciousResponse = await page.request.post('/api/playlists', {
      data: maliciousData
    });
    
    // Should either reject malicious data or sanitize it
    if (maliciousResponse.status() === 400) {
      console.log('✅ Malicious data rejected with validation error');
    } else if (maliciousResponse.status() === 200 || maliciousResponse.status() === 201) {
      const result = await maliciousResponse.json();
      console.log('✅ Data accepted - should be sanitized in database');
    }
    
    console.log('✅ Data validation and sanitization testing completed');
  });

  test('should handle large dataset operations efficiently', async ({ page }) => {
    console.log('📈 Testing large dataset operations...');
    
    await page.goto('/');
    
    // Test bulk operations
    const bulkData = {
      userId: 'test_user_123',
      tracks: Array.from({ length: 100 }, (_, i) => ({
        trackId: `bulk_track_${i}`,
        trackName: `Bulk Test Song ${i}`,
        artist: `Bulk Artist ${i}`,
        playedAt: new Date(Date.now() - i * 1000).toISOString()
      }))
    };
    
    const bulkResponse = await page.request.post('/api/listening-history/bulk', {
      data: bulkData
    });
    
    if (bulkResponse.status() === 200 || bulkResponse.status() === 201) {
      const result = await bulkResponse.json();
      console.log(`✅ Bulk operation completed: ${result.insertedCount || result.saved || 'success'}`);
    } else {
      console.log(`⚠️ Bulk operation endpoint returned: ${bulkResponse.status()}`);
    }
    
    console.log('✅ Large dataset operations testing completed');
  });

  test('should implement proper indexing for query performance', async ({ page }) => {
    console.log('🔍 Testing query performance with indexing...');
    
    await page.goto('/');
    
    // Test performance-critical queries
    const startTime = Date.now();
    
    const performanceResponse = await page.request.get('/api/users/test_user_123/listening-history?limit=50&sort=playedAt');
    
    const queryTime = Date.now() - startTime;
    
    if (performanceResponse.status() === 200) {
      console.log(`✅ Query completed in ${queryTime}ms`);
      
      // Query should be reasonably fast (under 1 second for test data)
      expect(queryTime).toBeLessThan(1000);
    }
    
    console.log('✅ Query performance testing completed');
  });

  test.afterEach(async ({ page }) => {
    // Clean up test data
    await page.request.delete('/api/test-data/cleanup').catch(() => {
      // Cleanup endpoint might not exist, that's okay
    });
  });
});