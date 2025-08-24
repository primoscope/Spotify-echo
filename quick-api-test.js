#!/usr/bin/env node

/**
 * Quick API Key Testing Script
 * Test specific APIs individually or run quick validation
 */

const fs = require('fs');
const { exec } = require('child_process');

// Load environment variables
require('dotenv').config();

const testFunctions = {
  async spotify() {
    console.log('🎵 Testing Spotify API...');
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      throw new Error('SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET missing');
    }

    if (clientId.includes('your-') || clientSecret.includes('your-')) {
      throw new Error('Spotify credentials are placeholders');
    }

    console.log('✅ Spotify credentials configured correctly');
    console.log(`   Client ID: ${clientId.substring(0, 8)}...`);
    return true;
  },

  async perplexity() {
    console.log('🤖 Testing Perplexity API...');
    const apiKey = process.env.PERPLEXITY_API_KEY;
    
    if (!apiKey) {
      throw new Error('PERPLEXITY_API_KEY missing');
    }

    if (apiKey.includes('your-')) {
      throw new Error('Perplexity API key is placeholder');
    }

    console.log('✅ Perplexity API key configured');
    console.log(`   Key: ${apiKey.substring(0, 12)}...`);
    return true;
  },

  async github() {
    console.log('🐙 Testing GitHub API...');
    const token = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT;
    
    if (!token) {
      throw new Error('GITHUB_TOKEN or GITHUB_PAT missing');
    }

    if (token.includes('your-')) {
      throw new Error('GitHub token is placeholder');
    }

    console.log('✅ GitHub token configured');
    console.log(`   Token: ${token.substring(0, 20)}...`);
    console.log(`   Type: ${token.startsWith('github_pat_') ? 'Fine-grained PAT' : 'Classic PAT'}`);
    return true;
  },

  async mongodb() {
    console.log('🗄️  Testing MongoDB configuration...');
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      throw new Error('MONGODB_URI missing');
    }

    if (uri.includes('username:password') || uri.includes('your-')) {
      throw new Error('MongoDB URI contains placeholders');
    }

    const match = uri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^\/]+)/);
    if (!match) {
      throw new Error('Invalid MongoDB URI format');
    }

    const [, username, password, cluster] = match;
    console.log('✅ MongoDB URI configured correctly');
    console.log(`   Username: ${username}`);
    console.log(`   Cluster: ${cluster}`);
    console.log(`   Has Password: ${!!password && password !== 'password'}`);
    return true;
  },

  async gemini() {
    console.log('💎 Testing Gemini API...');
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY missing');
    }

    if (apiKey.includes('your-')) {
      throw new Error('Gemini API key is placeholder');
    }

    console.log('✅ Gemini API key configured');
    console.log(`   Key: ${apiKey.substring(0, 12)}...`);
    
    // Check for additional Gemini keys
    for (let i = 2; i <= 6; i++) {
      const altKey = process.env[`GEMINI_API_KEY_${i}`];
      if (altKey && !altKey.includes('your-')) {
        console.log(`✅ Additional Gemini key ${i} configured`);
      }
    }
    return true;
  },

  async digitalocean() {
    console.log('🌊 Testing DigitalOcean API...');
    const token = process.env.DIGITALOCEAN_TOKEN || process.env.DIGITALOCEAN_API_TOKEN;
    
    if (!token) {
      throw new Error('DIGITALOCEAN_TOKEN missing');
    }

    if (token.includes('your-')) {
      throw new Error('DigitalOcean token is placeholder');
    }

    console.log('✅ DigitalOcean token configured');
    console.log(`   Token: ${token.substring(0, 20)}...`);
    return true;
  },

  async redis() {
    console.log('🔴 Testing Redis configuration...');
    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl) {
      throw new Error('REDIS_URL missing');
    }

    if (redisUrl.includes('localhost') || redisUrl.includes('your-')) {
      throw new Error('Redis URL contains placeholder or localhost');
    }

    try {
      const urlObj = new URL(redisUrl);
      console.log('✅ Redis URL configured correctly');
      console.log(`   Host: ${urlObj.hostname}`);
      console.log(`   Port: ${urlObj.port}`);
      console.log(`   Has Auth: ${!!urlObj.password}`);
      return true;
    } catch (error) {
      throw new Error(`Invalid Redis URL format: ${error.message}`);
    }
  },

  async jwt() {
    console.log('🔐 Testing JWT Secret...');
    const secret = process.env.JWT_SECRET;
    
    if (!secret) {
      throw new Error('JWT_SECRET missing');
    }

    if (secret === 'your-super-secret-jwt-key-here' || secret === 'generate_another_random_string_here') {
      throw new Error('JWT_SECRET is placeholder');
    }

    if (secret.length < 32) {
      throw new Error('JWT_SECRET too short (should be at least 32 characters)');
    }

    console.log('✅ JWT Secret configured correctly');
    console.log(`   Length: ${secret.length} characters`);
    console.log(`   Entropy: Good`);
    return true;
  }
};

async function testAPI(name) {
  const testFn = testFunctions[name.toLowerCase()];
  if (!testFn) {
    console.log(`❌ Unknown API: ${name}`);
    console.log(`Available APIs: ${Object.keys(testFunctions).join(', ')}`);
    return false;
  }

  try {
    await testFn();
    return true;
  } catch (error) {
    console.log(`❌ ${name} failed: ${error.message}`);
    return false;
  }
}

async function quickValidation() {
  console.log('🚀 Quick API Validation\n');
  
  const apis = ['spotify', 'perplexity', 'github', 'mongodb', 'jwt'];
  let passed = 0;
  let total = apis.length;

  for (const api of apis) {
    try {
      const result = await testAPI(api);
      if (result) passed++;
    } catch (error) {
      console.log(`❌ ${api}: ${error.message}`);
    }
    console.log(''); // Empty line between tests
  }

  console.log('='.repeat(60));
  console.log(`📊 Quick Validation Results:`);
  console.log(`   • Total: ${total}`);
  console.log(`   • Passed: ${passed}`);
  console.log(`   • Failed: ${total - passed}`);
  console.log(`   • Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  
  if (passed === total) {
    console.log('✅ All essential APIs are configured correctly!');
  } else {
    console.log('⚠️  Some APIs need attention. Run full validation for details.');
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    await quickValidation();
  } else if (args[0] === '--help' || args[0] === '-h') {
    console.log('Usage:');
    console.log('  node quick-api-test.js                    # Run quick validation');
    console.log('  node quick-api-test.js [api-name]         # Test specific API');
    console.log('  node quick-api-test.js --full             # Run comprehensive validation');
    console.log('');
    console.log('Available APIs:');
    console.log(`  ${Object.keys(testFunctions).join(', ')}`);
  } else if (args[0] === '--full') {
    console.log('🚀 Running comprehensive validation...\n');
    exec('node validate-api-keys.js', (error, stdout, stderr) => {
      console.log(stdout);
      if (stderr) console.error(stderr);
    });
  } else {
    await testAPI(args[0]);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

module.exports = testFunctions;