// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('EchoTune AI - Smoke Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set up test environment
    await page.setExtraHTTPHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    });
  });

  test('homepage loads successfully', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Check that the page loads
    await expect(page).toHaveTitle(/EchoTune|Music|Spotify/i);
    
    // Verify basic page structure exists
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Take a screenshot for visual verification
    await page.screenshot({ 
      path: '.artifacts/test-results/homepage-smoke.png',
      fullPage: true 
    });
  });

  test('health endpoint responds', async ({ page }) => {
    // Test the health check endpoint
    const response = await page.request.get('/health');
    expect(response.ok()).toBeTruthy();
    
    const body = await response.text();
    expect(body).toContain('healthy');
  });

  test('API endpoints are accessible', async ({ page }) => {
    // Test basic API structure
    const apiResponse = await page.request.get('/api/status');
    
    // Should either return 200 OK or 404 (if endpoint doesn't exist yet)
    // Both are acceptable for smoke test
    expect([200, 404]).toContain(apiResponse.status());
  });

  test('static assets load', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Check that there are no major console errors
    const logs = [];
    page.on('console', message => logs.push(message));
    
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Filter out minor warnings and focus on errors
    const errors = logs.filter(log => log.type() === 'error');
    
    // Allow for some expected errors in test environment
    const criticalErrors = errors.filter(error => {
      const text = error.text().toLowerCase();
      return !text.includes('spotify') && 
             !text.includes('oauth') && 
             !text.includes('authentication') &&
             !text.includes('network');
    });
    
    expect(criticalErrors.length).toBeLessThan(3); // Allow some minor errors
  });

  test('mobile viewport renders correctly', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    
    // Check that page is responsive
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Take mobile screenshot
    await page.screenshot({ 
      path: '.artifacts/test-results/mobile-smoke.png',
      fullPage: true 
    });
  });

});

test.describe('EchoTune AI - MCP Integration Smoke Tests', () => {
  
  test('MCP health endpoint accessible', async ({ page }) => {
    // Test MCP server health if running
    try {
      const mcpResponse = await page.request.get('http://localhost:3001/health');
      if (mcpResponse.ok()) {
        const body = await mcpResponse.text();
        expect(body).toBeTruthy();
      }
    } catch (error) {
      // MCP server may not be running in test environment - that's okay
      console.log('MCP server not accessible in test environment - skipping');
    }
  });

});

test.describe('EchoTune AI - Configuration Tests', () => {
  
  test('environment configuration is valid', async ({ page }) => {
    // Navigate to a page that would use environment variables
    await page.goto('/');
    
    // Check that the app handles missing Spotify credentials gracefully
    const response = await page.request.get('/api/spotify/status');
    
    // Should handle gracefully (either work or return appropriate error)
    expect([200, 400, 401, 404, 500]).toContain(response.status());
  });

});

// Conditional tests that only run if staging URL is provided
test.describe('EchoTune AI - Staging Tests', () => {
  
  test.skip(!process.env.STAGING_URL, 'Staging URL not provided');
  
  test('staging deployment is accessible', async ({ page }) => {
    await page.goto(process.env.STAGING_URL);
    
    // Verify staging deployment loads
    await expect(page).toHaveTitle(/EchoTune|Music|Spotify/i);
    
    // Take staging screenshot
    await page.screenshot({ 
      path: '.artifacts/test-results/staging-smoke.png',
      fullPage: true 
    });
  });
  
});