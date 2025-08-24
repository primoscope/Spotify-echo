import { test, expect } from '@playwright/test';

test.describe('EchoTune AI Auth Flow', () => {
  let authUrl;
  let authState;

  test.beforeEach(async ({ page }) => {
    // Set up test environment
    await page.setExtraHTTPHeaders({
      'User-Agent': 'EchoTune-E2E-Test/1.0'
    });
  });

  test('should retrieve Spotify auth URL from API', async ({ request }) => {
    console.log('🔍 Testing auth URL generation...');
    
    // Step 1: Hit /api/spotify/auth/login to retrieve authUrl
    const response = await request.get('/api/spotify/auth/login');
    
    expect(response.status()).toBe(200);
    
    const authData = await response.json();
    expect(authData.success).toBe(true);
    expect(authData.authUrl).toBeDefined();
    expect(authData.state).toBeDefined();
    
    // Store for later use
    authUrl = authData.authUrl;
    authState = authData.state;
    
    console.log(`✅ Auth URL generated with state: ${authState.substring(0, 10)}...`);
  });

  test('should handle Spotify OAuth flow with screenshots', async ({ page }) => {
    // Skip if no Spotify credentials are provided
    const hasCredentials = process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET;
    
    if (!hasCredentials) {
      console.log('⏭️  Skipping full OAuth flow - no Spotify credentials provided');
      test.skip();
      return;
    }

    console.log('🌐 Starting OAuth browser flow...');
    
    // Step 1: Get auth URL from API
    const authResponse = await page.request.get('/api/spotify/auth/login');
    const authData = await authResponse.json();
    
    expect(authData.success).toBe(true);
    authUrl = authData.authUrl;
    authState = authData.state;

    // Step 2: Screenshot before navigation
    await page.screenshot({ 
      path: 'artifacts/screenshots/01-before-spotify-auth.png',
      fullPage: true 
    });

    // Step 3: Navigate to Spotify authorization page
    console.log('📸 Navigating to Spotify auth page...');
    await page.goto(authUrl);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Screenshot the Spotify login page
    await page.screenshot({ 
      path: 'artifacts/screenshots/02-spotify-login-page.png',
      fullPage: true 
    });

    // Step 4: Check if we're on Spotify's domain
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('accounts.spotify.com')) {
      console.log('✅ Successfully redirected to Spotify auth page');
      
      // Look for login form elements
      const hasLoginForm = await page.locator('#login-username, [data-testid="login-username"], input[type="email"]').count() > 0;
      const hasLoginButton = await page.locator('button:has-text("Log In"), button:has-text("LOGIN"), #login-button').count() > 0;
      
      if (hasLoginForm) {
        console.log('✅ Spotify login form detected');
        
        // Screenshot the login form
        await page.screenshot({ 
          path: 'artifacts/screenshots/03-spotify-login-form.png',
          fullPage: true 
        });
        
        // Check if test credentials are available
        const testUsername = process.env.SPOTIFY_TEST_USERNAME;
        const testPassword = process.env.SPOTIFY_TEST_PASSWORD;
        
        if (testUsername && testPassword) {
          console.log('🔑 Attempting automated login...');
          
          try {
            // Fill in credentials
            await page.fill('#login-username, [data-testid="login-username"], input[type="email"]', testUsername);
            await page.fill('#login-password, [data-testid="login-password"], input[type="password"]', testPassword);
            
            // Screenshot before clicking login
            await page.screenshot({ 
              path: 'artifacts/screenshots/04-before-login-submit.png',
              fullPage: true 
            });
            
            // Click login button
            await page.click('button:has-text("Log In"), button:has-text("LOGIN"), #login-button');
            
            // Wait for navigation or auth page
            await page.waitForLoadState('networkidle', { timeout: 10000 });
            
            // Screenshot after login attempt
            await page.screenshot({ 
              path: 'artifacts/screenshots/05-after-login-attempt.png',
              fullPage: true 
            });
            
          } catch (error) {
            console.log(`⚠️  Automated login failed: ${error.message}`);
            // Continue with manual flow indicators
          }
        } else {
          console.log('⚠️  No test credentials provided (SPOTIFY_TEST_USERNAME/PASSWORD)');
          console.log('   Manual intervention would be required here');
        }
        
      } else {
        console.log('⚠️  No login form detected - might be already logged in or different page structure');
      }
      
      // Look for authorization/consent page
      const hasAuthPage = await page.locator('button:has-text("Agree"), button:has-text("AGREE"), button:has-text("Authorize")').count() > 0;
      
      if (hasAuthPage) {
        console.log('✅ Spotify authorization page detected');
        
        await page.screenshot({ 
          path: 'artifacts/screenshots/06-spotify-auth-consent.png',
          fullPage: true 
        });
        
        // In a real test, we might click "Agree" here, but this could violate Spotify TOS
        console.log('⚠️  Authorization consent required - stopping automated flow');
      }
      
    } else {
      console.log(`⚠️  Unexpected redirect to: ${currentUrl}`);
    }

    // Step 5: Final screenshot of current state
    await page.screenshot({ 
      path: 'artifacts/screenshots/07-final-auth-state.png',
      fullPage: true 
    });

    console.log('📸 Auth flow screenshots captured successfully');
  });

  test('should handle auth callback page', async ({ page }) => {
    console.log('🔄 Testing auth callback handling...');
    
    // Mock callback with test parameters
    const testCode = 'test_auth_code_' + Date.now();
    const testState = 'test_state_' + Date.now();
    
    // Screenshot before callback
    await page.screenshot({ 
      path: 'artifacts/screenshots/08-before-callback.png',
      fullPage: true 
    });

    // Navigate to callback URL with test parameters
    await page.goto(`/auth/callback?code=${testCode}&state=${testState}`);
    
    // Screenshot the callback page
    await page.screenshot({ 
      path: 'artifacts/screenshots/09-callback-page.png',
      fullPage: true 
    });

    // The callback should redirect or show some result
    await page.waitForLoadState('networkidle');
    
    // Final callback state screenshot
    await page.screenshot({ 
      path: 'artifacts/screenshots/10-callback-final-state.png',
      fullPage: true 
    });

    console.log('✅ Callback page test completed');
  });

  test('should handle auth errors gracefully', async ({ page }) => {
    console.log('❌ Testing auth error handling...');
    
    // Test with error parameter
    await page.goto('/auth/callback?error=access_denied&state=test_state');
    
    await page.screenshot({ 
      path: 'artifacts/screenshots/11-auth-error-page.png',
      fullPage: true 
    });

    // Should redirect to error page or show error message
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Auth error handling test completed');
  });
});

test.describe('Health Endpoint', () => {
  test('should respond to health checks', async ({ request }) => {
    console.log('🏥 Testing health endpoint...');
    
    const response = await request.get('/health');
    expect(response.status()).toBe(200);
    
    const health = await response.json();
    expect(health.status).toBeDefined();
    expect(health.uptime).toBeDefined();
    
    console.log(`✅ Health check passed: ${health.status}`);
  });
});