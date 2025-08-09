#!/usr/bin/env node

/**
 * Production Environment Validation Script
 * Validates all required and optional environment variables for EchoTune AI
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 EchoTune AI - Production Environment Validation');
console.log('=' .repeat(60));

// Load environment variables
require('dotenv').config();

// Define validation categories
const VALIDATION_CATEGORIES = {
  required: {
    name: '🚨 Required (Application will not work without these)',
    variables: [
      'NODE_ENV',
      'PORT',
      'DOMAIN',
      'SESSION_SECRET',
      'SPOTIFY_CLIENT_ID', 
      'SPOTIFY_CLIENT_SECRET'
    ]
  },
  security: {
    name: '🛡️ Security (Highly recommended for production)',
    variables: [
      'JWT_SECRET',
      'SSL_ENABLED',
      'SSL_CERT_PATH',
      'SSL_KEY_PATH'
    ]
  },
  database: {
    name: '🗄️ Database (Required for full functionality)',
    variables: [
      'MONGODB_URI',
      'MONGODB_DATABASE'
    ]
  },
  ai_providers: {
    name: '🤖 AI Providers (At least one required for AI features)',
    variables: [
      'GEMINI_API_KEY',
      'OPENAI_API_KEY',
      'AZURE_OPENAI_API_KEY',
      'OPENROUTER_API_KEY',
      'ANTHROPIC_API_KEY'
    ]
  },
  performance: {
    name: '⚡ Performance (Optional but recommended)',
    variables: [
      'REDIS_URL',
      'CACHE_TTL',
      'COMPRESSION',
      'MAX_REQUEST_SIZE'
    ]
  },
  monitoring: {
    name: '📊 Monitoring (Optional for production insights)',
    variables: [
      'LOG_LEVEL',
      'LOG_FILE',
      'METRICS_ENABLED',
      'ENABLE_ANALYTICS_DASHBOARD'
    ]
  },
  features: {
    name: '🎵 Feature Flags (Optional customization)',
    variables: [
      'ENABLE_RECOMMENDATIONS',
      'ENABLE_PLAYLIST_CREATION',
      'ENABLE_USER_ANALYTICS',
      'ENABLE_CHAT_HISTORY'
    ]
  }
};

// Validation results
const results = {
  total: 0,
  configured: 0,
  missing: 0,
  categories: {}
};

// Validation functions
function validateEnvironmentVariable(varName, category) {
  const value = process.env[varName];
  const isConfigured = value && value !== '' && value !== 'your_' + varName.toLowerCase();
  
  return {
    name: varName,
    value: isConfigured ? (value.length > 20 ? value.substring(0, 20) + '...' : value) : null,
    configured: isConfigured,
    category: category
  };
}

function validateSecretStrength(, minLength = 32) {
  if (!secret) return { valid: false, reason: 'Not configured' };
  if (secret.length < minLength) return { valid: false, reason: `Too short (${secret.length} < ${minLength})` };
  if (secret === secret.toLowerCase()) return { valid: false, reason: 'No uppercase letters' };
  if (secret === secret.toUpperCase()) return { valid: false, reason: 'No lowercase letters' };
  if (!/\d/.test(secret)) return { valid: false, reason: 'No numbers' };
  return { valid: true, reason: 'Strong' };
}

function validateDomainConfiguration() {
  const domain = process.env.DOMAIN;
  const frontendUrl = process.env.FRONTEND_URL;
  const spotifyRedirect = process.env.SPOTIFY_REDIRECT_URI;
  
  const issues = [];
  
  if (!domain) {
    issues.push('DOMAIN not configured');
  } else if (!domain.includes('.')) {
    issues.push('DOMAIN appears invalid (no TLD)');
  }
  
  if (!frontendUrl) {
    issues.push('FRONTEND_URL not configured');
  } else if (!frontendUrl.startsWith('https://') && process.env.NODE_ENV === 'production') {
    issues.push('FRONTEND_URL should use HTTPS in production');
  }
  
  if (!spotifyRedirect) {
    issues.push('SPOTIFY_REDIRECT_URI not configured');
  } else if (domain && !spotifyRedirect.includes(domain)) {
    issues.push('SPOTIFY_REDIRECT_URI domain mismatch');
  }
  
  return issues;
}

function checkSSLCertificates() {
  const certPath = process.env.SSL_CERT_PATH;
  const keyPath = process.env.SSL_KEY_PATH;
  
  const issues = [];
  
  if (process.env.SSL_ENABLED === 'true') {
    if (!certPath) {
      issues.push('SSL_CERT_PATH required when SSL_ENABLED=true');
    } else if (!fs.existsSync(certPath)) {
      issues.push(`SSL certificate not found: ${certPath}`);
    }
    
    if (!keyPath) {
      issues.push('SSL_KEY_PATH required when SSL_ENABLED=true');
    } else if (!fs.existsSync(keyPath)) {
      issues.push(`SSL private key not found: ${keyPath}`);
    }
  }
  
  return issues;
}

// Main validation
console.log('Starting validation...\n');

// Validate each category
for (const [categoryKey, category] of Object.entries(VALIDATION_CATEGORIES)) {
  console.log(category.name);
  console.log('-'.repeat(category.name.length));
  
  const categoryResults = {
    total: category.variables.length,
    configured: 0,
    variables: []
  };
  
  for (const varName of category.variables) {
    const result = validateEnvironmentVariable(varName, categoryKey);
    categoryResults.variables.push(result);
    results.total++;
    
    if (result.configured) {
      results.configured++;
      categoryResults.configured++;
      console.log(`✅ ${result.name}: ${result.value}`);
    } else {
      results.missing++;
      console.log(`❌ ${result.name}: Not configured`);
    }
  }
  
  results.categories[categoryKey] = categoryResults;
  console.log(`   ${categoryResults.configured}/${categoryResults.total} configured\n`);
}

// Additional validations
console.log('🔒 Security Validation');
console.log('-'.repeat(20));

// Check  strength
const sessionSecret = process.env.SESSION_SECRET;
const jwtSecret = process.env.JWT_SECRET;

const sessionValidation = validateSecretStrength(sessionSecret);
const jwtValidation = validateSecretStrength(jwtSecret);

console.log(`SESSION_SECRET: ${sessionValidation.valid ? '✅' : '❌'} ${sessionValidation.reason}`);
console.log(`JWT_SECRET: ${jwtValidation.valid ? '✅' : '❌'} ${jwtValidation.reason}`);

// Domain configuration check
console.log('\n🌐 Domain Configuration');
console.log('-'.repeat(22));

const domainIssues = validateDomainConfiguration();
if (domainIssues.length === 0) {
  console.log('✅ Domain configuration looks good');
} else {
  domainIssues.forEach(issue => console.log(`❌ ${issue}`));
}

// SSL certificate check
console.log('\n🔐 SSL Certificate Check');
console.log('-'.repeat(23));

const sslIssues = checkSSLCertificates();
if (sslIssues.length === 0) {
  console.log('✅ SSL configuration looks good');
} else {
  sslIssues.forEach(issue => console.log(`❌ ${issue}`));
}

// AI Provider validation
console.log('\n🤖 AI Provider Status');
console.log('-'.repeat(19));

const aiProviders = [
  { name: 'Gemini', key: 'GEMINI_API_KEY', recommended: true },
  { name: 'OpenAI', key: 'OPENAI_API_KEY', recommended: false },
  { name: 'Azure OpenAI', key: 'AZURE_OPENAI_API_KEY', recommended: false },
  { name: 'OpenRouter', key: 'OPENROUTER_API_KEY', recommended: false },
  { name: 'Anthropic', key: 'ANTHROPIC_API_KEY', recommended: false }
];

let configuredProviders = 0;
aiProviders.forEach(provider => {
  const configured = process.env[provider.key] && process.env[provider.key] !== '';
  if (configured) configuredProviders++;
  
  const status = configured ? '✅' : '❌';
  const rec = provider.recommended ? ' (Recommended)' : '';
  console.log(`${status} ${provider.name}${rec}`);
});

if (configuredProviders === 0) {
  console.log('⚠️  Warning: No AI providers configured. Application will use mock responses only.');
}

// Database connectivity check
console.log('\n🗄️ Database Configuration');
console.log('-'.repeat(24));

if (process.env.MONGODB_URI) {
  // Don't try to connect during validation, just check format
  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri.startsWith('mongodb://') || mongoUri.startsWith('mongodb+srv://')) {
    console.log('✅ MongoDB URI format looks valid');
  } else {
    console.log('❌ MongoDB URI format appears invalid');
  }
} else {
  console.log('❌ MongoDB URI not configured');
}

if (process.env.REDIS_URL) {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl.startsWith('redis://') || redisUrl.startsWith('rediss://')) {
    console.log('✅ Redis URL format looks valid');
  } else {
    console.log('❌ Redis URL format appears invalid');
  }
} else {
  console.log('⚠️  Redis not configured (optional but recommended)');
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 VALIDATION SUMMARY');
console.log('='.repeat(60));

console.log(`Total variables checked: ${results.total}`);
console.log(`Configured: ${results.configured} (${Math.round(results.configured/results.total*100)}%)`);
console.log(`Missing: ${results.missing} (${Math.round(results.missing/results.total*100)}%)`);

// Readiness assessment
const requiredConfigured = results.categories.required.configured;
const requiredTotal = results.categories.required.total;
const securityConfigured = results.categories.security.configured;
const securityTotal = results.categories.security.total;

console.log('\n🎯 PRODUCTION READINESS');
console.log('-'.repeat(22));

if (requiredConfigured === requiredTotal) {
  console.log('✅ All required variables configured');
} else {
  console.log(`❌ Missing ${requiredTotal - requiredConfigured} required variables`);
}

if (securityConfigured >= securityTotal / 2) {
  console.log('✅ Security configuration acceptable');
} else {
  console.log('⚠️  Security configuration needs attention');
}

if (configuredProviders > 0) {
  console.log('✅ AI providers configured');
} else {
  console.log('⚠️  No AI providers configured');
}

// Final recommendation
console.log('\n🚀 DEPLOYMENT RECOMMENDATION');
console.log('-'.repeat(26));

const readinessScore = (
  (requiredConfigured / requiredTotal) * 0.5 +
  (securityConfigured / securityTotal) * 0.3 +
  Math.min(configuredProviders, 1) * 0.2
) * 100;

if (readinessScore >= 90) {
  console.log('🟢 READY FOR PRODUCTION - All critical components configured');
} else if (readinessScore >= 70) {
  console.log('🟡 MOSTLY READY - Some optional components missing');
} else if (readinessScore >= 50) {
  console.log('🟠 PARTIAL READINESS - Important components missing');
} else {
  console.log('🔴 NOT READY - Critical configuration missing');
}

console.log(`Overall readiness: ${Math.round(readinessScore)}%`);

// Next steps
console.log('\n📋 NEXT STEPS');
console.log('-'.repeat(12));

if (results.missing > 0) {
  console.log('1. Configure missing environment variables (see .env.template)');
}

if (!sessionValidation.valid || !jwtValidation.valid) {
  console.log('2. Generate secure secrets for SESSION_SECRET and JWT_SECRET');
}

if (sslIssues.length > 0 && process.env.NODE_ENV === 'production') {
  console.log('3. Configure SSL certificates for HTTPS');
}

if (configuredProviders === 0) {
  console.log('4. Configure at least one AI provider (Gemini recommended for free tier)');
}

if (domainIssues.length > 0) {
  console.log('5. Fix domain configuration issues');
}

console.log('\n📖 For detailed setup instructions, see:');
console.log('   - .env.template (this directory)');
console.log('   - README.md (comprehensive guide)');
console.log('   - DEPLOYMENT.md (production deployment)');

console.log('\n✨ EchoTune AI - Ready to rock your music recommendations!');

// Exit with appropriate code
process.exit(results.categories.required.configured === results.categories.required.total ? 0 : 1);