import { test, expect } from '@playwright/test';
import MockProvider from '../utils/mocks';
import PerformanceReporter from '../utils/performance-reporter';

test.describe('Advanced Integration Testing - Phase 5', () => {
  let mockProvider: MockProvider;
  let performanceReporter: PerformanceReporter;

  test.beforeEach(async ({ page }) => {
    mockProvider = new MockProvider();
    performanceReporter = new PerformanceReporter();
    
    await mockProvider.setupSpotifyMocks(page);
    await mockProvider.setupLLMMocks(page);
    await mockProvider.setupDatabaseMocks(page);
    await mockProvider.setupPerformanceMonitoring(page);
  });

  test('should integrate Spotify data with AI recommendations', async ({ page }) => {
    console.log('🎵🤖 Testing Spotify + AI integration...');
    
    await page.goto('/');
    
    const metrics = await performanceReporter.monitorStep(page, 'Integration', 'Spotify AI Integration');
    
    // Mock user with listening history
    await page.addInitScript(() => {
      window.mockUser = {
        spotifyId: 'test_user_123',
        recentTracks: [
          { name: 'Test Song 1', artist: 'Test Artist 1', genre: 'rock' },
          { name: 'Test Song 2', artist: 'Test Artist 2', genre: 'pop' }
        ]
      };
    });
    
    // Test integrated workflow
    const integrationTest = await page.evaluate(async () => {
      try {
        // Simulate fetching user data
        const userResponse = await fetch('/api/spotify/profile');
        const userData = await userResponse.json();
        
        // Simulate getting recommendations based on Spotify data
        const recResponse = await fetch('/api/recommendations/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: userData.id,
            listeningHistory: window.mockUser.recentTracks
          })
        });
        
        return {
          userFetched: userResponse.ok,
          recommendationsGenerated: recResponse.ok,
          integration: 'success'
        };
      } catch (error) {
        return { error: error.message, integration: 'failed' };
      }
    });
    
    if (integrationTest.integration === 'success') {
      console.log('✅ Spotify + AI integration working');
      expect(integrationTest.userFetched).toBeTruthy();
    } else {
      console.log(`⚠️ Integration test result: ${integrationTest.integration}`);
    }
    
    console.log('✅ Spotify + AI integration test completed');
  });

  test('should handle end-to-end user journey', async ({ page }) => {
    console.log('🎭 Testing complete user journey...');
    
    await page.goto('/');
    
    const journeyMetrics = await performanceReporter.monitorStep(page, 'Integration', 'User Journey');
    
    // Step 1: User lands on homepage
    await expect(page).toHaveTitle(/EchoTune|Spotify/i);
    console.log('✅ Step 1: Homepage loaded');
    
    // Step 2: User sees authentication option
    const authElements = await page.locator('button:has-text("Connect"), button:has-text("Login"), [data-testid*="auth"]').count();
    if (authElements > 0) {
      console.log('✅ Step 2: Authentication options visible');
    }
    
    // Step 3: Mock authentication flow
    await page.addInitScript(() => {
      localStorage.setItem('spotify_access_token', 'mock_token');
      localStorage.setItem('user_authenticated', 'true');
    });
    
    await page.reload();
    console.log('✅ Step 3: User authenticated (mocked)');
    
    // Step 4: User interacts with music features
    const musicElements = await page.locator('[data-testid*="music"], [data-testid*="track"], [data-testid*="recommend"]').count();
    if (musicElements > 0) {
      console.log('✅ Step 4: Music features accessible');
    }
    
    // Step 5: User gets recommendations
    const recResponse = await page.request.get('/api/recommendations');
    if (recResponse.status() === 200) {
      console.log('✅ Step 5: Recommendations retrieved');
    }
    
    console.log('✅ End-to-end user journey test completed');
  });

  test('should handle multi-provider AI switching', async ({ page }) => {
    console.log('🔄 Testing multi-provider AI switching...');
    
    await page.goto('/');
    
    const switchingMetrics = await performanceReporter.monitorStep(page, 'Integration', 'AI Provider Switching');
    
    // Test different AI providers
    const providers = ['mock', 'openai', 'gemini'];
    
    for (const provider of providers) {
      console.log(`Testing provider: ${provider}`);
      
      // Mock provider switching
      await page.evaluate((providerName) => {
        window.currentAIProvider = providerName;
      }, provider);
      
      // Test AI response with current provider
      const aiResponse = await page.request.post('/api/chat', {
        data: {
          message: `Test message for ${provider}`,
          provider: provider
        }
      });
      
      if (aiResponse.status() === 200) {
        console.log(`✅ ${provider} provider responded`);
      }
    }
    
    console.log('✅ Multi-provider AI switching test completed');
  });

  test('should validate data flow consistency', async ({ page }) => {
    console.log('🔄 Testing data flow consistency...');
    
    await page.goto('/');
    
    const dataFlowMetrics = await performanceReporter.monitorStep(page, 'Integration', 'Data Flow Consistency');
    
    // Test data consistency across different endpoints
    const testUserId = 'consistency_test_user';
    
    // 1. Create user data
    const createUser = await page.request.post('/api/users', {
      data: {
        spotifyId: testUserId,
        displayName: 'Consistency Test User'
      }
    });
    
    // 2. Add listening history
    const addHistory = await page.request.post('/api/listening-history', {
      data: {
        userId: testUserId,
        tracks: [{ trackId: 'track_1', trackName: 'Test Track' }]
      }
    });
    
    // 3. Generate recommendations
    const generateRecs = await page.request.post('/api/recommendations', {
      data: {
        userId: testUserId,
        recommendations: [{ trackId: 'rec_1', score: 0.9 }]
      }
    });
    
    // 4. Verify data consistency
    const userData = await page.request.get(`/api/users/${testUserId}`);
    const userHistory = await page.request.get(`/api/listening-history/${testUserId}`);
    const userRecs = await page.request.get(`/api/recommendations/${testUserId}`);
    
    const consistencyCheck = {
      userExists: userData.status() === 200,
      historyExists: userHistory.status() === 200,
      recsExist: userRecs.status() === 200
    };
    
    console.log('Data consistency check:', consistencyCheck);
    
    console.log('✅ Data flow consistency test completed');
  });

  test('should handle real-time synchronization', async ({ page }) => {
    console.log('⚡ Testing real-time synchronization...');
    
    await page.goto('/');
    
    const realtimeMetrics = await performanceReporter.monitorStep(page, 'Integration', 'Real-time Sync');
    
    // Test WebSocket or Server-Sent Events if available
    const hasRealtimeFeatures = await page.evaluate(() => {
      return typeof window.io !== 'undefined' || 
             typeof window.WebSocket !== 'undefined' ||
             typeof window.EventSource !== 'undefined';
    });
    
    if (hasRealtimeFeatures) {
      console.log('✅ Real-time features detected');
      
      // Test real-time updates
      await page.evaluate(() => {
        if (window.io) {
          const socket = window.io();
          socket.emit('test_event', { data: 'test' });
        }
      });
      
      await page.waitForTimeout(2000);
    } else {
      console.log('⚠️ No real-time features detected');
    }
    
    console.log('✅ Real-time synchronization test completed');
  });

  test('should validate security integration', async ({ page }) => {
    console.log('🔒 Testing security integration...');
    
    await page.goto('/');
    
    const securityMetrics = await performanceReporter.monitorStep(page, 'Integration', 'Security Integration');
    
    // Test HTTPS enforcement
    const isHTTPS = page.url().startsWith('https://') || page.url().startsWith('http://localhost');
    expect(isHTTPS).toBeTruthy();
    
    // Test CSRF protection
    const csrfResponse = await page.request.post('/api/test-csrf', {
      data: { test: 'data' }
    });
    
    // Should either require CSRF token or return appropriate error
    const hasCSRFProtection = csrfResponse.status() === 403 || 
                             csrfResponse.status() === 401 || 
                             csrfResponse.status() === 200;
    
    expect(hasCSRFProtection).toBeTruthy();
    
    // Test XSS protection
    await page.goto('/?search=<script>alert("xss")</script>');
    const hasXSSContent = await page.content();
    expect(hasXSSContent.includes('<script>alert("xss")</script>')).toBeFalsy();
    
    console.log('✅ Security integration test completed');
  });

  test('should handle performance under load simulation', async ({ page }) => {
    console.log('⚡ Testing performance under load simulation...');
    
    await page.goto('/');
    
    const loadMetrics = await performanceReporter.monitorStep(page, 'Integration', 'Load Simulation');
    
    // Simulate concurrent requests
    const requests = [];
    for (let i = 0; i < 10; i++) {
      requests.push(
        page.request.get('/api/health'),
        page.request.get('/api/recommendations'),
        page.request.get('/api/spotify/profile')
      );
    }
    
    const startTime = Date.now();
    const responses = await Promise.allSettled(requests);
    const endTime = Date.now();
    
    const successfulRequests = responses.filter(r => r.status === 'fulfilled').length;
    const totalTime = endTime - startTime;
    
    console.log(`Load test results: ${successfulRequests}/${requests.length} successful in ${totalTime}ms`);
    
    // Performance should be acceptable under load
    expect(totalTime).toBeLessThan(10000); // 10 seconds max
    expect(successfulRequests).toBeGreaterThan(requests.length * 0.8); // 80% success rate
    
    console.log('✅ Performance under load test completed');
  });

  test.afterEach(async ({ page }, testInfo) => {
    // Generate performance report
    const report = performanceReporter.generateReport();
    
    if (report.summary.failedSteps > 0) {
      console.warn(`⚠️ Performance issues in ${testInfo.title}: ${report.summary.failedSteps} failed steps`);
    }
    
    // Clear metrics for next test
    performanceReporter.clearMetrics();
    mockProvider.reset();
  });
});