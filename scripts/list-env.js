#!/usr/bin/env node
/**
 * Environment Variable Usage Scanner
 * Scans the codebase for process.env usage and categorizes variables
 */

const fs = require('fs');
const path = require('path');

const envVarRegex = /process\.env\.([A-Z_][A-Z0-9_]*)/g;
const envUsage = new Map();

// Files to scan manually
function getAllJSFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      getAllJSFiles(filePath, fileList);
    } else if (file.endsWith('.js') && !file.includes('.test.') && !file.includes('.spec.')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Known categorization based on codebase analysis
const envCategories = {
  // Critical for basic operation
  required: [
    'MONGODB_URI',
    'JWT_SECRET'
  ],
  
  // Important for production but has fallbacks
  recommended: [
    'SESSION_SECRET',
    'REDIS_URL',
    'NODE_ENV',
    'PORT'
  ],
  
  // Optional features
  optional: [
    'SPOTIFY_CLIENT_ID',
    'SPOTIFY_CLIENT_SECRET',
    'SPOTIFY_REDIRECT_URI',
    'OPENAI_API_KEY',
    'GOOGLE_AI_API_KEY',
    'GEMINI_API_KEY',
    'PERPLEXITY_API_KEY',
    'XAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'OPENROUTER_API_KEY',
    'AGENTOPS_API_KEY',
    'FRONTEND_URL',
    'DOMAIN',
    'ALLOWED_ORIGINS',
    'LOG_LEVEL',
    'ENABLE_ANALYTICS_DASHBOARD',
    'ENABLE_DEMO_ROUTES',
    'COMPRESSION',
    'SSL_ENABLED',
    'RATE_LIMIT_MAX',
    'CACHE_TTL'
  ],
  
  // New feature flags
  feature_flags: [
    'DISABLE_REALTIME',
    'ENABLE_TRACING',
    'ENABLE_AGENTOPS'
  ],
  
  // Development only
  dev_only: [
    'MCP_PORT',
    'MCP_SERVER_NAME',
    'BROWSERBASE_API_KEY',
    'BROWSERBASE_PROJECT_ID',
    'N8N_API_URL',
    'N8N_API_KEY'
  ]
};

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let match;
    
    while ((match = envVarRegex.exec(content)) !== null) {
      const varName = match[1];
      if (!envUsage.has(varName)) {
        envUsage.set(varName, []);
      }
      envUsage.get(varName).push(filePath);
    }
  } catch (error) {
    console.warn(`Warning: Could not scan ${filePath}: ${error.message}`);
  }
}

function categorizeEnvVar(varName) {
  for (const [category, vars] of Object.entries(envCategories)) {
    if (vars.includes(varName)) {
      return category;
    }
  }
  return 'uncategorized';
}

function main() {
  console.log('🔍 Scanning for environment variable usage...\n');
  
  // Scan server.js and src directory
  const filesToScan = [
    'server.js',
    ...getAllJSFiles('src')
  ];
  
  filesToScan.forEach(scanFile);
  
  // Sort by variable name
  const sortedVars = Array.from(envUsage.keys()).sort();
  
  // Group by category
  const categorized = {
    required: [],
    recommended: [],
    optional: [],
    feature_flags: [],
    dev_only: [],
    uncategorized: []
  };
  
  sortedVars.forEach(varName => {
    const category = categorizeEnvVar(varName);
    const usageFiles = envUsage.get(varName);
    categorized[category].push({ varName, usageFiles });
  });
  
  // Output results
  console.log('📊 Environment Variable Analysis');
  console.log(''.padEnd(50, '='));
  
  Object.entries(categorized).forEach(([category, vars]) => {
    if (vars.length === 0) return;
    
    console.log(`\n🏷️  ${category.toUpperCase().replace('_', ' ')} (${vars.length}):`);
    vars.forEach(({ varName, usageFiles }) => {
      console.log(`  ${varName}`);
      if (process.argv.includes('--verbose')) {
        usageFiles.forEach(file => console.log(`    └─ ${file}`));
      }
    });
  });
  
  console.log(`\n📈 Summary: ${sortedVars.length} environment variables found`);
  
  // Output for .env.example generation
  if (process.argv.includes('--generate-env')) {
    generateEnvExample(categorized);
  }
}

function generateEnvExample(categorized) {
  console.log('\n📝 Generated .env.example content:');
  console.log(''.padEnd(50, '-'));
  
  const envContent = [];
  
  envContent.push('# EchoTune AI - Environment Configuration');
  envContent.push('# Copy to .env and configure values');
  envContent.push('');
  
  // Required variables
  if (categorized.required.length > 0) {
    envContent.push('# REQUIRED - Application will not start without these');
    categorized.required.forEach(({ varName }) => {
      envContent.push(`${varName}=`);
    });
    envContent.push('');
  }
  
  // Recommended variables
  if (categorized.recommended.length > 0) {
    envContent.push('# RECOMMENDED - Important for production deployment');
    categorized.recommended.forEach(({ varName }) => {
      envContent.push(`${varName}=`);
    });
    envContent.push('');
  }
  
  // Feature flags
  if (categorized.feature_flags.length > 0) {
    envContent.push('# FEATURE FLAGS - Control application behavior');
    categorized.feature_flags.forEach(({ varName }) => {
      envContent.push(`${varName}=false`);
    });
    envContent.push('');
  }
  
  // Optional variables
  if (categorized.optional.length > 0) {
    envContent.push('# OPTIONAL - Enable additional features when provided');
    categorized.optional.forEach(({ varName }) => {
      envContent.push(`${varName}=`);
    });
    envContent.push('');
  }
  
  // Dev only variables
  if (categorized.dev_only.length > 0) {
    envContent.push('# DEVELOPMENT ONLY - Not needed in production');
    categorized.dev_only.forEach(({ varName }) => {
      envContent.push(`${varName}=`);
    });
  }
  
  console.log(envContent.join('\n'));
}

if (require.main === module) {
  main();
}

module.exports = { scanFile, categorizeEnvVar, envCategories };