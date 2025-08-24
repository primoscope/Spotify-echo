#!/usr/bin/env node

/**
 * EchoTune AI - Vercel Environment Variables Setup Script
 * This script helps configure environment variables for Vercel deployment
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`)
};

// Environment variable templates
const envTemplates = {
  core: {
    NODE_ENV: 'production',
    PORT: '3000',
    DOMAIN: '',
    FRONTEND_URL: '',
    ALLOWED_ORIGINS: ''
  },
  security: {
    JWT_SECRET: '',
    SESSION_SECRET: '',
    ENCRYPTION_KEY: ''
  },
  spotify: {
    SPOTIFY_CLIENT_ID: '',
    SPOTIFY_CLIENT_SECRET: '',
    SPOTIFY_REDIRECT_URI: ''
  },
  database: {
    MONGODB_URI: '',
    REDIS_URL: ''
  },
  ai: {
    OPENAI_API_KEY: '',
    GOOGLE_AI_API_KEY: '',
    PERPLEXITY_API_KEY: '',
    ANTHROPIC_API_KEY: '',
    OPENROUTER_API_KEY: ''
  },
  services: {
    SENTRY_DSN: '',
    AGENTOPS_API_KEY: '',
    BROWSERBASE_API_KEY: '',
    BROWSERBASE_PROJECT_ID: '',
    XAI_API_KEY: ''
  }
};

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Utility function to prompt user for input
function askQuestion(question, defaultValue = '') {
  return new Promise((resolve) => {
    const prompt = defaultValue ? `${question} (${defaultValue}): ` : `${question}: `;
    rl.question(prompt, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

// Generate random secrets
function generateSecret(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Validate environment variables
function validateEnvVars(envVars) {
  const errors = [];
  const warnings = [];

  // Required variables
  const required = [
    'DOMAIN',
    'SPOTIFY_CLIENT_ID',
    'SPOTIFY_CLIENT_SECRET',
    'MONGODB_URI',
    'JWT_SECRET',
    'SESSION_SECRET',
    'ENCRYPTION_KEY'
  ];

  required.forEach(key => {
    if (!envVars[key] || envVars[key].includes('your_') || envVars[key].includes('generate_')) {
      errors.push(`${key} is required and must be set to a real value`);
    }
  });

  // Validation rules
  if (envVars.DOMAIN && !envVars.DOMAIN.includes('.')) {
    warnings.push('DOMAIN should be a valid domain name');
  }

  if (envVars.MONGODB_URI && !envVars.MONGODB_URI.startsWith('mongodb')) {
    errors.push('MONGODB_URI should be a valid MongoDB connection string');
  }

  if (envVars.REDIS_URL && !envVars.REDIS_URL.startsWith('redis')) {
    warnings.push('REDIS_URL should be a valid Redis connection string');
  }

  return { errors, warnings };
}

// Main setup function
async function setupEnvironment() {
  log.header('🚀 EchoTune AI - Vercel Environment Setup');
  log.info('This script will help you configure environment variables for Vercel deployment');
  log.info('Press Enter to use default values or type your custom values\n');

  const envVars = {};

  // Core configuration
  log.header('🌐 Core Configuration');
  envVars.DOMAIN = await askQuestion('Enter your production domain (e.g., your-app.vercel.app)', 'your-app.vercel.app');
  envVars.FRONTEND_URL = `https://${envVars.DOMAIN}`;
  envVars.ALLOWED_ORIGINS = `https://${envVars.DOMAIN},https://www.${envVars.DOMAIN}`;

  // Security configuration
  log.header('🔐 Security Configuration');
  log.info('Generating secure secrets...');
  envVars.JWT_SECRET = generateSecret(32);
  envVars.SESSION_SECRET = generateSecret(32);
  envVars.ENCRYPTION_KEY = generateSecret(32);

  // Spotify configuration
  log.header('🎵 Spotify API Configuration');
  log.info('Get these from https://developer.spotify.com/dashboard');
  envVars.SPOTIFY_CLIENT_ID = await askQuestion('Enter your Spotify Client ID');
  envVars.SPOTIFY_CLIENT_SECRET = await askQuestion('Enter your Spotify Client Secret');
  envVars.SPOTIFY_REDIRECT_URI = `https://${envVars.DOMAIN}/auth/callback`;

  // Database configuration
  log.header('📊 Database Configuration');
  log.info('MongoDB Atlas recommended for production');
  envVars.MONGODB_URI = await askQuestion('Enter your MongoDB connection string');
  envVars.REDIS_URL = await askQuestion('Enter your Redis connection string (optional)', '');

  // AI providers
  log.header('🤖 AI/LLM Providers (Optional)');
  envVars.OPENAI_API_KEY = await askQuestion('Enter your OpenAI API key (optional)', '');
  envVars.GOOGLE_AI_API_KEY = await askQuestion('Enter your Google AI API key (optional)', '');
  envVars.PERPLEXITY_API_KEY = await askQuestion('Enter your Perplexity API key (optional)', '');
  envVars.ANTHROPIC_API_KEY = await askQuestion('Enter your Anthropic API key (optional)', '');
  envVars.OPENROUTER_API_KEY = await askQuestion('Enter your OpenRouter API key (optional)', '');

  // Additional services
  log.header('🔍 Additional Services (Optional)');
  envVars.SENTRY_DSN = await askQuestion('Enter your Sentry DSN (optional)', '');
  envVars.AGENTOPS_API_KEY = await askQuestion('Enter your AgentOps API key (optional)', '');
  envVars.BROWSERBASE_API_KEY = await askQuestion('Enter your BrowserBase API key (optional)', '');
  envVars.BROWSERBASE_PROJECT_ID = await askQuestion('Enter your BrowserBase Project ID (optional)', '');
  envVars.XAI_API_KEY = await askQuestion('Enter your XAI API key (optional)', '');

  // Add core values
  Object.assign(envVars, envTemplates.core);
  envVars.NODE_ENV = 'production';

  // Validate configuration
  log.header('✅ Validation');
  const validation = validateEnvVars(envVars);

  if (validation.errors.length > 0) {
    log.error('Configuration errors found:');
    validation.errors.forEach(error => log.error(`  - ${error}`));
    log.error('\nPlease fix these errors before proceeding.');
    rl.close();
    return;
  }

  if (validation.warnings.length > 0) {
    log.warning('Configuration warnings:');
    validation.warnings.forEach(warning => log.warning(`  - ${warning}`));
    log.info('\nYou can proceed, but consider addressing these warnings.');
  }

  // Generate files
  log.header('📁 Generating Configuration Files');

  // Generate .env.production.vercel
  const envContent = Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const envFile = path.join(process.cwd(), '.env.production.vercel');
  fs.writeFileSync(envFile, envContent);
  log.success(`Generated ${envFile}`);

  // Generate Vercel environment setup commands
  const vercelCommands = Object.entries(envVars)
    .filter(([_, value]) => value && !value.includes('your_') && !value.includes('generate_'))
    .map(([key, value]) => `vercel env add ${key} production`)
    .join('\n');

  const commandsFile = path.join(process.cwd(), 'vercel-env-commands.sh');
  const commandsContent = `#!/bin/bash
# Vercel Environment Variables Setup Commands
# Run these commands to set up your Vercel project environment variables

${vercelCommands}

echo "Environment variables set successfully!"
echo "You can now deploy with: vercel --prod"
`;

  fs.writeFileSync(commandsFile, commandsContent);
  fs.chmodSync(commandsFile, '755');
  log.success(`Generated ${commandsFile}`);

  // Generate summary
  log.header('📋 Configuration Summary');
  log.info('Core Configuration:');
  log.info(`  Domain: ${envVars.DOMAIN}`);
  log.info(`  Frontend URL: ${envVars.FRONTEND_URL}`);
  log.info(`  Allowed Origins: ${envVars.ALLOWED_ORIGINS}`);

  log.info('\nSecurity:');
  log.info(`  JWT Secret: ${envVars.JWT_SECRET ? '✅ Generated' : '❌ Missing'}`);
  log.info(`  Session Secret: ${envVars.SESSION_SECRET ? '✅ Generated' : '❌ Missing'}`);
  log.info(`  Encryption Key: ${envVars.ENCRYPTION_KEY ? '✅ Generated' : '❌ Missing'}`);

  log.info('\nSpotify API:');
  log.info(`  Client ID: ${envVars.SPOTIFY_CLIENT_ID ? '✅ Set' : '❌ Missing'}`);
  log.info(`  Client Secret: ${envVars.SPOTIFY_CLIENT_SECRET ? '✅ Set' : '❌ Missing'}`);
  log.info(`  Redirect URI: ${envVars.SPOTIFY_REDIRECT_URI}`);

  log.info('\nDatabase:');
  log.info(`  MongoDB: ${envVars.MONGODB_URI ? '✅ Set' : '❌ Missing'}`);
  log.info(`  Redis: ${envVars.REDIS_URL ? '✅ Set' : '❌ Missing'}`);

  log.info('\nNext Steps:');
  log.info('1. Review the generated .env.production.vercel file');
  log.info('2. Run the vercel-env-commands.sh script to set up Vercel');
  log.info('3. Deploy with: npm run deploy:vercel');
  log.info('4. Or manually: vercel --prod');

  log.success('\nEnvironment setup completed successfully!');
  rl.close();
}

// Handle script execution
if (require.main === module) {
  setupEnvironment().catch((error) => {
    log.error('Setup failed:');
    log.error(error.message);
    process.exit(1);
  });
}

module.exports = { setupEnvironment, validateEnvVars };