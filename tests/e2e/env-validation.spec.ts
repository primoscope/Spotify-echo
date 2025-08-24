import { test, expect } from '@playwright/test';
import MockProvider from '../utils/mocks';
import PerformanceReporter from '../utils/performance-reporter';

test.describe('Environment Validation', () => {
  let mockProvider: MockProvider;
  let performanceReporter: PerformanceReporter;

  test.beforeEach(async ({ page }) => {
    mockProvider = new MockProvider();
    performanceReporter = new PerformanceReporter();
    
    // Setup performance monitoring
    await mockProvider.setupPerformanceMonitoring(page);
  });

  test('should validate core environment configuration', async ({ page }) => {
    console.log('🔍 Testing core environment configuration...');
    
    // Navigate to the app
    await page.goto('/');
    
    // Monitor performance
    const metrics = await performanceReporter.monitorStep(page, 'Environment Validation', 'Core Config Check');
    
    // Check that the app loads
    await expect(page).toHaveTitle(/EchoTune|Spotify/i);
    
    // Check for essential elements
    const hasNavigation = await page.locator('nav, header, [role="navigation"]').count() > 0;
    const hasMainContent = await page.locator('main, [role="main"], .main-content').count() > 0;
    
    expect(hasNavigation || hasMainContent).toBeTruthy();
    
    console.log('✅ Core environment configuration validated');
  });

  test('should handle missing optional services gracefully', async ({ page }) => {
    console.log('🔍 Testing graceful degradation with missing services...');
    
    // Simulate service failures
    await mockProvider.simulateNetworkFailure(page, ['**/api/external/**']);
    
    await page.goto('/');
    
    // Monitor performance under failure conditions
    const metrics = await performanceReporter.monitorStep(page, 'Environment Validation', 'Service Degradation');
    
    // App should still load and show error states gracefully
    await expect(page).toHaveTitle(/EchoTune|Spotify/i);
    
    // Look for error handling indicators
    const hasErrorHandling = await page.locator('[data-testid*="error"], .error-message, .offline-mode').count() > 0;
    const hasLoadingStates = await page.locator('[data-testid*="loading"], .loading, .spinner').count() > 0;
    
    // At least one form of user feedback should be present
    expect(hasErrorHandling || hasLoadingStates).toBeTruthy();
    
    console.log('✅ Graceful service degradation validated');
  });

  test('should detect authentication state correctly', async ({ page }) => {
    console.log('🔍 Testing authentication state detection...');
    
    await page.goto('/');
    
    const metrics = await performanceReporter.monitorStep(page, 'Environment Validation', 'Auth State Detection');
    
    // Check for authentication indicators
    const hasLoginButton = await page.locator('[data-testid*="login"], [href*="login"], button:has-text("Login"), button:has-text("Sign In")').count() > 0;
    const hasUserProfile = await page.locator('[data-testid*="user"], [data-testid*="profile"], .user-menu').count() > 0;
    const hasAuthFlow = await page.locator('[data-testid*="auth"], .auth-container').count() > 0;
    
    // Should have some authentication mechanism
    expect(hasLoginButton || hasUserProfile || hasAuthFlow).toBeTruthy();
    
    console.log('✅ Authentication state detection validated');
  });

  test('should provide service availability indicators', async ({ page }) => {
    console.log('🔍 Testing service availability indicators...');
    
    await page.goto('/');
    
    const metrics = await performanceReporter.monitorStep(page, 'Environment Validation', 'Service Indicators');
    
    // Check for health/status indicators
    const hasStatusIndicators = await page.locator('[data-testid*="status"], [data-testid*="health"], .status-indicator').count() > 0;
    const hasServiceList = await page.locator('[data-testid*="service"], .service-status').count() > 0;
    
    // Check console for health checks
    const consoleMessages = [];
    page.on('console', (msg) => {
      consoleMessages.push(msg.text());
    });
    
    // Wait a bit for any health checks to run
    await page.waitForTimeout(2000);
    
    // Should have some form of service monitoring
    const hasHealthLogging = consoleMessages.some(msg => 
      msg.includes('health') || msg.includes('status') || msg.includes('connected')
    );
    
    expect(hasStatusIndicators || hasServiceList || hasHealthLogging).toBeTruthy();
    
    console.log('✅ Service availability indicators validated');
  });

  test('should handle network failures and recovery', async ({ page }) => {
    console.log('🔍 Testing network failure handling and recovery...');
    
    await page.goto('/');
    
    // First, ensure the app loads normally
    await expect(page).toHaveTitle(/EchoTune|Spotify/i);
    
    // Simulate network failure
    await mockProvider.simulateNetworkFailure(page, ['**/api/**']);
    
    const failureMetrics = await performanceReporter.monitorStep(page, 'Environment Validation', 'Network Failure');
    
    // Try to trigger a network request that should fail
    try {
      await page.click('[data-testid*="refresh"], button:has-text("Refresh"), [data-testid*="load"]').catch(() => {
        // If no refresh button exists, that's okay
      });
    } catch (error) {
      // Expected to fail due to network simulation
    }
    
    // Check for error handling
    await page.waitForTimeout(1000);
    
    // Remove network failure simulation
    await page.unroute('**/api/**');
    
    const recoveryMetrics = await performanceReporter.monitorStep(page, 'Environment Validation', 'Network Recovery');
    
    // App should still be functional
    await expect(page).toHaveTitle(/EchoTune|Spotify/i);
    
    console.log('✅ Network failure handling and recovery validated');
  });

  test('should prevent sensitive data exposure', async ({ page }) => {
    console.log('🔍 Testing sensitive data protection...');
    
    await page.goto('/');
    
    const metrics = await performanceReporter.monitorStep(page, 'Environment Validation', 'Security Validation');
    
    // Check that sensitive patterns are not exposed in the DOM
    const pageContent = await page.content();
    
    // Look for potential API keys, tokens, or secrets in the DOM
    const sensitivePatterns = [
      /sk-[a-zA-Z0-9]{32,}/g, // OpenAI API keys
      /pk-[a-zA-Z0-9]{32,}/g, // Public keys
      /xoxb-[a-zA-Z0-9]{32,}/g, // Slack tokens
      /ya29\.[a-zA-Z0-9_-]{68}/g, // Google OAuth tokens
      /BQA[a-zA-Z0-9]{32,}/g, // Spotify access tokens
      /mongodb\+srv:\/\/[^@]+:[^@]+@/g, // MongoDB connection strings
      /postgres:\/\/[^@]+:[^@]+@/g, // PostgreSQL connection strings
    ];
    
    const exposedSecrets = [];
    for (const pattern of sensitivePatterns) {
      const matches = pageContent.match(pattern);
      if (matches) {
        exposedSecrets.push(...matches);
      }
    }
    
    // Should not expose any sensitive data
    expect(exposedSecrets.length).toBe(0);
    
    if (exposedSecrets.length > 0) {
      console.error('❌ Exposed sensitive data:', exposedSecrets);
    }
    
    console.log('✅ Sensitive data protection validated');
  });

  test('should meet performance validation thresholds', async ({ page }) => {
    console.log('🔍 Testing performance validation thresholds...');
    
    await page.goto('/');
    
    const metrics = await performanceReporter.monitorStep(page, 'Environment Validation', 'Performance Validation');
    
    // Check that the app meets basic performance requirements
    expect(metrics.metrics.loadTime).toBeLessThan(5000); // 5 seconds max
    expect(metrics.metrics.requestCount).toBeLessThan(100); // Max 100 requests
    expect(metrics.metrics.errorCount).toBe(0); // No errors
    
    if (!metrics.passed) {
      console.warn('⚠️ Performance thresholds not met:', metrics.bottlenecks);
    }
    
    console.log('✅ Performance validation completed');
  });

  test('should provide configuration help and guidance', async ({ page }) => {
    console.log('🔍 Testing configuration help and user guidance...');
    
    await page.goto('/');
    
    const metrics = await performanceReporter.monitorStep(page, 'Environment Validation', 'Configuration Help');
    
    // Look for help/documentation links
    const hasHelpLinks = await page.locator('[href*="help"], [href*="docs"], [data-testid*="help"], .help-button').count() > 0;
    const hasTooltips = await page.locator('[title], [data-tooltip], .tooltip').count() > 0;
    const hasErrorMessages = await page.locator('.error-message, [data-testid*="error-message"]').count() > 0;
    
    // Check for setup/configuration guidance
    const hasSetupGuide = await page.locator('[data-testid*="setup"], .setup-guide, .getting-started').count() > 0;
    
    // Should provide some form of user guidance
    expect(hasHelpLinks || hasTooltips || hasErrorMessages || hasSetupGuide).toBeTruthy();
    
    console.log('✅ Configuration help and guidance validated');
  });

  test('should handle Spotify integration availability', async ({ page }) => {
    console.log('🔍 Testing Spotify integration availability...');
    
    // Setup Spotify mocks
    await mockProvider.setupSpotifyMocks(page);
    
    await page.goto('/');
    
    const metrics = await performanceReporter.monitorStep(page, 'Environment Validation', 'Spotify Integration');
    
    // Check for Spotify-related elements
    const hasSpotifyAuth = await page.locator('[data-testid*="spotify"], [href*="spotify"], button:has-text("Connect Spotify")').count() > 0;
    const hasMusicFeatures = await page.locator('[data-testid*="music"], [data-testid*="track"], [data-testid*="playlist"]').count() > 0;
    
    // Should have some Spotify integration
    expect(hasSpotifyAuth || hasMusicFeatures).toBeTruthy();
    
    console.log('✅ Spotify integration availability validated');
  });

  test('should handle intentional failure injection and recovery', async ({ page }) => {
    console.log('🔍 Testing intentional failure injection and recovery...');
    
    await page.goto('/');
    
    // Inject JavaScript errors to test error handling
    await page.addInitScript(() => {
      // Override console.error to capture errors
      window.testErrors = [];
      const originalError = console.error;
      console.error = (...args) => {
        window.testErrors.push(args.join(' '));
        originalError(...args);
      };
      
      // Override window.onerror to capture runtime errors
      window.onerror = (message, source, lineno, colno, error) => {
        window.testErrors.push(`Runtime error: ${message}`);
        return false;
      };
    });
    
    // Try to cause an intentional error
    await page.evaluate(() => {
      try {
        // This should cause an error
        (undefined as any).nonExistentMethod();
      } catch (error) {
        console.error('Intentional test error:', error.message);
      }
    });
    
    const metrics = await performanceReporter.monitorStep(page, 'Environment Validation', 'Failure Recovery');
    
    // Check that the app is still responsive after the error
    await expect(page).toHaveTitle(/EchoTune|Spotify/i);
    
    // Check that errors were captured
    const capturedErrors = await page.evaluate(() => window.testErrors || []);
    expect(capturedErrors.length).toBeGreaterThan(0);
    
    console.log('✅ Intentional failure injection and recovery validated');
  });

  test.afterEach(async ({ page }, testInfo) => {
    // Generate performance report after each test
    const report = performanceReporter.generateReport();
    
    if (report.summary.failedSteps > 0) {
      console.warn(`⚠️ Performance issues detected in ${testInfo.title}:`);
      console.warn(`Failed steps: ${report.summary.failedSteps}/${report.summary.totalSteps}`);
      console.warn(`Total bottlenecks: ${report.summary.totalBottlenecks}`);
    }
    
    // Clear metrics for next test
    performanceReporter.clearMetrics();
  });
});