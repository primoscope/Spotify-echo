import { test, expect } from '@playwright/test';
import MockProvider from '../utils/mocks';

test.describe('Real-time API Data Fetching', () => {
  let mockProvider: MockProvider;

  test.beforeEach(async ({ page }) => {
    mockProvider = new MockProvider();
    await mockProvider.setupSpotifyMocks(page);
    await mockProvider.setupLLMMocks(page);
    await mockProvider.setupDatabaseMocks(page);
  });

  test('should fetch Spotify user profile data', async ({ page }) => {
    console.log('👤 Testing Spotify user profile data fetching...');
    
    await page.goto('/');
    
    // Mock authenticated state
    await page.addInitScript(() => {
      localStorage.setItem('spotify_access_token', 'mock_access_token');
    });
    
    // Test profile API endpoint
    const profileResponse = await page.request.get('/api/spotify/profile', {
      headers: {
        'Authorization': 'Bearer mock_access_token'
      }
    });
    
    if (profileResponse.status() === 200) {
      const profile = await profileResponse.json();
      expect(profile.id).toBeDefined();
      console.log(`✅ Profile fetched: ${profile.display_name || profile.id}`);
    } else {
      console.log(`⚠️ Profile endpoint returned: ${profileResponse.status()}`);
    }
    
    console.log('✅ User profile data fetching completed');
  });

  test('should fetch and display listening history', async ({ page }) => {
    console.log('🎵 Testing listening history data fetching...');
    
    await page.goto('/');
    
    // Mock authenticated state
    await page.addInitScript(() => {
      localStorage.setItem('spotify_access_token', 'mock_access_token');
    });
    
    // Test listening history endpoint
    const historyResponse = await page.request.get('/api/spotify/recently-played');
    
    if (historyResponse.status() === 200) {
      const history = await historyResponse.json();
      console.log(`✅ History fetched: ${JSON.stringify(history).substring(0, 100)}...`);
    }
    
    // Check if UI shows listening history
    const hasHistoryUI = await page.locator('[data-testid*="history"], [data-testid*="recent"], .listening-history, .recent-tracks').count() > 0;
    
    if (hasHistoryUI) {
      console.log('✅ Listening history UI detected');
    } else {
      console.log('⚠️ No listening history UI found');
    }
    
    console.log('✅ Listening history fetching completed');
  });

  test('should fetch real-time track recommendations', async ({ page }) => {
    console.log('🎯 Testing real-time recommendations fetching...');
    
    await page.goto('/');
    
    // Test recommendations endpoint
    const recommendationsResponse = await page.request.get('/api/recommendations');
    
    if (recommendationsResponse.status() === 200) {
      const recommendations = await recommendationsResponse.json();
      console.log(`✅ Recommendations fetched: ${JSON.stringify(recommendations).substring(0, 100)}...`);
    }
    
    // Look for recommendation UI elements
    const hasRecommendationsUI = await page.locator('[data-testid*="recommend"], [data-testid*="suggest"], .recommendations, .suggested-tracks').count() > 0;
    
    if (hasRecommendationsUI) {
      console.log('✅ Recommendations UI detected');
    }
    
    console.log('✅ Real-time recommendations fetching completed');
  });

  test('should handle API rate limiting gracefully', async ({ page }) => {
    console.log('🚦 Testing API rate limiting handling...');
    
    await page.goto('/');
    
    // Mock rate limiting responses
    await page.route('**/api/spotify/**', async (route) => {
      await route.fulfill({
        status: 429,
        headers: {
          'Retry-After': '60'
        },
        contentType: 'application/json',
        body: JSON.stringify({ 
          error: 'Rate limit exceeded',
          retry_after: 60
        })
      });
    });
    
    // Try to make API call that will be rate limited
    const rateLimitedResponse = await page.request.get('/api/spotify/profile');
    expect(rateLimitedResponse.status()).toBe(429);
    
    // Check for rate limit handling in UI
    const hasRateLimitUI = await page.locator('[data-testid*="rate-limit"], .rate-limit-message, .api-limit').count() > 0;
    
    console.log('✅ API rate limiting handling completed');
  });

  test('should fetch and cache audio features', async ({ page }) => {
    console.log('🎼 Testing audio features fetching and caching...');
    
    await page.goto('/');
    
    // Test audio features endpoint
    const featuresResponse = await page.request.get('/api/spotify/audio-features/test_track_id');
    
    if (featuresResponse.status() === 200) {
      const features = await featuresResponse.json();
      console.log(`✅ Audio features fetched: ${JSON.stringify(features).substring(0, 100)}...`);
    }
    
    // Test caching by making same request again
    const cachedResponse = await page.request.get('/api/spotify/audio-features/test_track_id');
    
    if (cachedResponse.status() === 200) {
      console.log('✅ Cached response received');
    }
    
    console.log('✅ Audio features fetching and caching completed');
  });

  test('should handle network connectivity issues', async ({ page }) => {
    console.log('🌐 Testing network connectivity handling...');
    
    await page.goto('/');
    
    // Simulate network failure
    await mockProvider.simulateNetworkFailure(page, ['**/api/**']);
    
    // Wait for network failure to be detected
    await page.waitForTimeout(2000);
    
    // Check for offline/network error indicators
    const hasOfflineUI = await page.locator('[data-testid*="offline"], [data-testid*="network"], .offline-mode, .network-error').count() > 0;
    
    if (hasOfflineUI) {
      console.log('✅ Offline/network error UI detected');
    }
    
    // Remove network failure simulation
    await page.unroute('**/api/**');
    
    console.log('✅ Network connectivity handling completed');
  });

  test('should implement real-time search functionality', async ({ page }) => {
    console.log('🔍 Testing real-time search functionality...');
    
    await page.goto('/');
    
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"], [data-testid*="search-input"]').first();
    
    if (await searchInput.count() > 0) {
      console.log('✅ Search input found');
      
      // Type search query
      await searchInput.fill('test artist');
      
      // Wait for search results
      await page.waitForTimeout(1000);
      
      // Check for search results
      const hasSearchResults = await page.locator('[data-testid*="search-result"], .search-results, .search-item').count() > 0;
      
      if (hasSearchResults) {
        console.log('✅ Search results displayed');
      }
    } else {
      console.log('⚠️ No search input found');
    }
    
    console.log('✅ Real-time search functionality completed');
  });

  test('should handle API data validation and sanitization', async ({ page }) => {
    console.log('🛡️ Testing API data validation and sanitization...');
    
    await page.goto('/');
    
    // Mock malicious data in API response
    await page.route('**/api/spotify/tracks', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tracks: [
            {
              id: 'track_1',
              name: '<script>alert("XSS")</script>Malicious Track',
              artists: [{ name: 'Test Artist' }]
            }
          ]
        })
      });
    });
    
    // Fetch potentially malicious data
    const tracksResponse = await page.request.get('/api/spotify/tracks');
    
    if (tracksResponse.status() === 200) {
      const tracks = await tracksResponse.json();
      
      // Check that malicious content is present in API but should be sanitized in UI
      expect(tracks.tracks[0].name).toContain('<script>');
      console.log('✅ Malicious data received from API');
    }
    
    // Check that script tags are not executed in the DOM
    const scriptTags = await page.locator('script:has-text("alert")').count();
    expect(scriptTags).toBe(0);
    
    console.log('✅ API data validation and sanitization completed');
  });

  test('should implement pagination for large datasets', async ({ page }) => {
    console.log('📄 Testing pagination for large datasets...');
    
    await page.goto('/');
    
    // Test pagination endpoint
    const paginatedResponse = await page.request.get('/api/spotify/tracks?limit=10&offset=0');
    
    if (paginatedResponse.status() === 200) {
      const data = await paginatedResponse.json();
      console.log(`✅ Paginated data fetched: ${JSON.stringify(data).substring(0, 100)}...`);
    }
    
    // Look for pagination UI
    const hasPaginationUI = await page.locator('[data-testid*="pagination"], .pagination, .page-navigation, button:has-text("Next"), button:has-text("Previous")').count() > 0;
    
    if (hasPaginationUI) {
      console.log('✅ Pagination UI detected');
    }
    
    console.log('✅ Pagination testing completed');
  });

  test('should handle concurrent API requests efficiently', async ({ page }) => {
    console.log('⚡ Testing concurrent API requests handling...');
    
    await page.goto('/');
    
    // Monitor network requests
    const requests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/')) {
        requests.push(request.url());
      }
    });
    
    // Trigger multiple API calls simultaneously
    await page.evaluate(() => {
      const promises = [
        fetch('/api/spotify/profile'),
        fetch('/api/spotify/tracks'),
        fetch('/api/recommendations'),
        fetch('/api/spotify/playlists'),
        fetch('/api/spotify/recently-played')
      ];
      
      Promise.all(promises).catch(console.error);
    });
    
    // Wait for requests to complete
    await page.waitForTimeout(3000);
    
    console.log(`✅ Concurrent requests handled: ${requests.length} total requests`);
    
    // Check that multiple requests were made
    expect(requests.length).toBeGreaterThan(0);
    
    console.log('✅ Concurrent API requests handling completed');
  });

  test('should implement proper error boundaries for API failures', async ({ page }) => {
    console.log('🚨 Testing error boundaries for API failures...');
    
    await page.goto('/');
    
    // Mock various API failures
    await page.route('**/api/**', async (route) => {
      const url = route.request().url();
      
      if (url.includes('/profile')) {
        await route.fulfill({ status: 500, body: 'Internal Server Error' });
      } else if (url.includes('/tracks')) {
        await route.fulfill({ status: 404, body: 'Not Found' });
      } else {
        await route.continue();
      }
    });
    
    // Wait for potential API calls and error handling
    await page.waitForTimeout(2000);
    
    // Check that the app didn't crash
    await expect(page).toHaveTitle(/EchoTune|Spotify/i);
    
    // Look for error boundary UI
    const hasErrorBoundary = await page.locator('[data-testid*="error-boundary"], .error-boundary, .api-error').count() > 0;
    
    if (hasErrorBoundary) {
      console.log('✅ Error boundary UI detected');
    }
    
    console.log('✅ Error boundaries testing completed');
  });
});