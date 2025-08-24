#!/usr/bin/env node

/**
 * Smoke Test for EchoTune AI
 * Verifies basic functionality of health and auth endpoints
 */

const http = require('http');
const { URL } = require('url');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TIMEOUT = 5000;

// Helper function to make HTTP requests
function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      timeout: TIMEOUT,
      headers: {
        'User-Agent': 'EchoTune-Smoke-Test/1.0'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: data });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Test functions
async function testHealth() {
  console.log('🏥 Testing /health endpoint...');
  try {
    const response = await makeRequest(`${BASE_URL}/health`);
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    if (!response.data.status) {
      throw new Error('Health endpoint missing status field');
    }

    console.log(`✅ Health endpoint OK (${response.data.status})`);
    console.log(`   - Uptime: ${response.data.uptime}s`);
    console.log(`   - Version: ${response.data.version || 'unknown'}`);
    
    if (response.data.redis) {
      console.log(`   - Redis: ${response.data.redis}`);
    }
    if (response.data.mongo) {
      console.log(`   - MongoDB: ${response.data.mongo}`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Health endpoint failed: ${error.message}`);
    return false;
  }
}

async function testSpotifyAuthLogin() {
  console.log('🎵 Testing /api/spotify/auth/login endpoint...');
  try {
    const response = await makeRequest(`${BASE_URL}/api/spotify/auth/login`);
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    if (!response.data.authUrl) {
      throw new Error('Auth login endpoint missing authUrl field');
    }
    
    if (!response.data.state) {
      throw new Error('Auth login endpoint missing state field');
    }

    console.log('✅ Spotify auth login OK');
    console.log(`   - Auth URL generated: ${response.data.authUrl.substring(0, 50)}...`);
    console.log(`   - State: ${response.data.state.substring(0, 10)}...`);
    
    return true;
  } catch (error) {
    console.error(`❌ Spotify auth login failed: ${error.message}`);
    return false;
  }
}

async function testBasicRoutes() {
  console.log('🌐 Testing basic routes...');
  const routes = [
    { path: '/api/docs', name: 'API Documentation' },
    { path: '/api/providers', name: 'LLM Providers' }
  ];
  
  let passed = 0;
  
  for (const route of routes) {
    try {
      const response = await makeRequest(`${BASE_URL}${route.path}`);
      if (response.status === 200 || response.status === 404) { // 404 is acceptable for optional routes
        console.log(`✅ ${route.name} accessible`);
        passed++;
      } else {
        console.log(`⚠️  ${route.name} returned status ${response.status}`);
      }
    } catch (error) {
      console.log(`⚠️  ${route.name} failed: ${error.message}`);
    }
  }
  
  return passed > 0;
}

// Main smoke test runner
async function runSmokeTests() {
  console.log(`🚀 Starting EchoTune AI Smoke Tests against ${BASE_URL}`);
  console.log('=' .repeat(60));
  
  const tests = [
    { name: 'Health Check', fn: testHealth },
    { name: 'Spotify Auth Login', fn: testSpotifyAuthLogin },
    { name: 'Basic Routes', fn: testBasicRoutes }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
    } catch (error) {
      console.error(`❌ Test "${test.name}" crashed: ${error.message}`);
      results.push({ name: test.name, passed: false });
    }
    console.log(''); // Add spacing between tests
  }
  
  // Summary
  console.log('=' .repeat(60));
  console.log('📊 SMOKE TEST SUMMARY');
  console.log('=' .repeat(60));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
  });
  
  console.log('');
  console.log(`Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All smoke tests passed!');
    process.exit(0);
  } else {
    console.log('⚠️  Some smoke tests failed');
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  runSmokeTests().catch(error => {
    console.error('💥 Smoke tests crashed:', error);
    process.exit(1);
  });
}

module.exports = { runSmokeTests, testHealth, testSpotifyAuthLogin };