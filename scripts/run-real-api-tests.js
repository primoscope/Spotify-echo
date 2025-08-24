#!/usr/bin/env node

/**
 * Comprehensive Real API Testing Suite Runner
 * Replaces all mock tests with real API integration testing
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Ensure environment is set up for real testing
process.env.NODE_ENV = 'test';
process.env.TEST_MODE = 'real';
process.env.USE_REAL_APIS = 'true';
process.env.DISABLE_MOCKS = 'true';

console.log('🚀 Starting Comprehensive Real API Testing Suite');
console.log('=' .repeat(60));

// Load environment variables for real testing
try {
  require('dotenv').config({ path: '.env.real-testing' });
  console.log('✅ Loaded real testing environment variables');
} catch (error) {
  console.log('⚠️ Could not load .env.real-testing file');
}

// Check required environment variables
const requiredEnvVars = [
  'MONGODB_URI',
  'SPOTIFY_CLIENT_ID', 
  'SPOTIFY_CLIENT_SECRET',
  'GEMINI_API_KEY',
  'OPENROUTER_API_KEY'
];

console.log('\n🔍 Checking Environment Variables:');
let missingVars = [];

requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`✅ ${varName}: ${process.env[varName].substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: Missing`);
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  console.log(`\n⚠️ Warning: ${missingVars.length} environment variables are missing:`);
  console.log(`   ${missingVars.join(', ')}`);
  console.log('   Tests may fail or use fallback behavior');
}

// Ensure artifacts directory exists
const artifactsDir = path.join(__dirname, 'artifacts', 'screenshots');
if (!fs.existsSync(artifactsDir)) {
  fs.mkdirSync(artifactsDir, { recursive: true });
  console.log('✅ Created artifacts directory for screenshots');
}

// Install browsers if needed
console.log('\n🌐 Installing Playwright Browsers...');
try {
  execSync('npx playwright install', { stdio: 'inherit' });
  console.log('✅ Playwright browsers installed');
} catch (error) {
  console.log('⚠️ Browser installation failed, but continuing...');
}

// Define test suites
const testSuites = [
  {
    name: 'Real OAuth2 Flow Testing',
    file: 'tests/e2e/real-oauth-flow.spec.ts',
    description: 'Tests real Spotify OAuth2 PKCE flow with actual API calls'
  },
  {
    name: 'Real AI Chat Integration', 
    file: 'tests/e2e/real-chat-integration.spec.ts',
    description: 'Tests real AI chat with OpenAI, Gemini, and OpenRouter APIs'
  },
  {
    name: 'Real Database Persistence',
    file: 'tests/e2e/real-database-persistence.spec.ts', 
    description: 'Tests real MongoDB operations with actual database'
  },
  {
    name: 'Real-time API Testing',
    file: 'tests/e2e/real-time-api-testing.spec.ts',
    description: 'Tests real-time Spotify API data fetching and synchronization'
  }
];

// Run each test suite
console.log('\n🧪 Running Real API Test Suites:');
console.log('=' .repeat(60));

const results = [];

for (const suite of testSuites) {
  console.log(`\n📋 Running: ${suite.name}`);
  console.log(`📄 Description: ${suite.description}`);
  console.log(`📁 File: ${suite.file}`);
  
  const startTime = Date.now();
  
  try {
    // Run the test suite
    execSync(`npx playwright test ${suite.file} --reporter=line`, { 
      stdio: 'inherit',
      env: {
        ...process.env,
        PLAYWRIGHT_HTML_REPORT: 'artifacts/playwright-report',
        PLAYWRIGHT_JSON_OUTPUT_NAME: `artifacts/results-${suite.name.toLowerCase().replace(/\s+/g, '-')}.json`
      }
    });
    
    const duration = Date.now() - startTime;
    
    results.push({
      name: suite.name,
      status: 'PASSED',
      duration: duration,
      file: suite.file
    });
    
    console.log(`✅ ${suite.name} PASSED (${(duration / 1000).toFixed(2)}s)`);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    results.push({
      name: suite.name,
      status: 'FAILED',
      duration: duration,
      file: suite.file,
      error: error.message
    });
    
    console.log(`❌ ${suite.name} FAILED (${(duration / 1000).toFixed(2)}s)`);
    console.log(`   Error: ${error.message}`);
  }
  
  // Wait between test suites to avoid overwhelming APIs
  if (suite !== testSuites[testSuites.length - 1]) {
    console.log('⏳ Waiting 5 seconds before next suite...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

// Generate final report
console.log('\n📊 Final Test Results:');
console.log('=' .repeat(60));

const passed = results.filter(r => r.status === 'PASSED').length;
const failed = results.filter(r => r.status === 'FAILED').length;
const totalTime = results.reduce((sum, r) => sum + r.duration, 0);

console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`⏱️ Total Time: ${(totalTime / 1000).toFixed(2)}s`);
console.log(`📊 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);

console.log('\n📋 Detailed Results:');
results.forEach((result, index) => {
  const status = result.status === 'PASSED' ? '✅' : '❌';
  console.log(`${index + 1}. ${status} ${result.name} (${(result.duration / 1000).toFixed(2)}s)`);
  if (result.error) {
    console.log(`   📝 ${result.error}`);
  }
});

// Generate HTML report
console.log('\n📄 Generating HTML Report...');
try {
  execSync('npx playwright show-report artifacts/playwright-report', { stdio: 'ignore' });
  console.log('✅ HTML report generated at artifacts/playwright-report/');
} catch (error) {
  console.log('⚠️ Could not generate HTML report');
}

// Screenshot summary
const screenshotDir = path.join(__dirname, 'artifacts', 'screenshots');
if (fs.existsSync(screenshotDir)) {
  const screenshots = fs.readdirSync(screenshotDir).filter(f => f.endsWith('.png'));
  console.log(`📸 Screenshots captured: ${screenshots.length}`);
  console.log(`📁 Location: ${screenshotDir}`);
}

console.log('\n🎉 Real API Testing Suite Complete!');
console.log('=' .repeat(60));

// Exit with appropriate code
process.exit(failed > 0 ? 1 : 0);