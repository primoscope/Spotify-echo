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

// Logging utility
const log = {
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  step: (msg) => console.log(`\n${colors.magenta}${msg}${colors.reset}`)
};

// Readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Utility function to ask questions
function askQuestion(question, defaultValue = '') {
  return new Promise((resolve) => {
    const prompt = defaultValue ? `${question} (${defaultValue}): ` : `${question}: `;
    rl.question(prompt, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

// Utility function to ask yes/no questions
function askYesNo(question, defaultValue = false) {
  return new Promise((resolve) => {
    const prompt = `${question} (${defaultValue ? 'Y/n' : 'y/N'}): `;
    rl.question(prompt, (answer) => {
      const normalized = answer.trim().toLowerCase();
      if (normalized === '') resolve(defaultValue);
      else resolve(['y', 'yes'].includes(normalized));
    });
  });
}

// Main configuration function
async function configureVercelEnvironment() {
  try {
    log.header('🚀 EchoTune AI - Vercel Environment Setup');
    log.info('This script will help you configure environment variables for Vercel deployment');
    log.info('Press Enter to use default values where available\n');

    const envVars = {};

    // Database Configuration
    log.step('📊 Database Configuration');
    envVars.MONGODB_URI = await askQuestion(
      'Enter your MongoDB connection string',
      'mongodb+srv://username:password@cluster.mongodb.net/database'
    );
    
    envVars.REDIS_URL = await askQuestion(
      'Enter your Redis connection string (optional)',
      'redis://username:password@host:port'
    );

    // Security Configuration
    log.step('🔐 Security Configuration');
    envVars.JWT_SECRET = await askQuestion(
      'Enter your JWT secret (32+ characters recommended)',
      'your_very_long_random_jwt_secret_key_here'
    );
    
    envVars.SESSION_SECRET = await askQuestion(
      'Enter your session secret (32+ characters recommended)',
      'your_very_long_random_session_secret_key_here'
    );

    // Application Configuration
    log.step('⚙️ Application Configuration');
    envVars.NODE_ENV = 'production';
    
    envVars.FRONTEND_URL = await askQuestion(
      'Enter your production frontend URL',
      'https://echotune-ai.vercel.app'
    );
    
    envVars.DOMAIN = await askQuestion(
      'Enter your production domain',
      'echotune-ai.vercel.app'
    );

    // Spotify Configuration
    log.step('🎵 Spotify Configuration');
    const useSpotify = await askYesNo('Do you want to configure Spotify integration?', true);
    if (useSpotify) {
      envVars.SPOTIFY_CLIENT_ID = await askQuestion('Enter your Spotify Client ID');
      envVars.SPOTIFY_CLIENT_SECRET = await askQuestion('Enter your Spotify Client Secret');
    }

    // AI/LLM Configuration
    log.step('🤖 AI/LLM Configuration');
    const useOpenAI = await askYesNo('Do you want to configure OpenAI?', false);
    if (useOpenAI) {
      envVars.OPENAI_API_KEY = await askQuestion('Enter your OpenAI API Key');
    }

    const usePerplexity = await askYesNo('Do you want to configure Perplexity AI?', true);
    if (usePerplexity) {
      envVars.PERPLEXITY_API_KEY = await askQuestion('Enter your Perplexity API Key');
    }

    const useGoogle = await askYesNo('Do you want to configure Google AI?', false);
    if (useGoogle) {
      envVars.GOOGLE_API_KEY = await askQuestion('Enter your Google API Key');
    }

    const useXAI = await askYesNo('Do you want to configure XAI (Grok)?', false);
    if (useXAI) {
      envVars.XAI_API_KEY = await askQuestion('Enter your XAI API Key');
    }

    // Browser Automation (Optional)
    log.step('🌐 Browser Automation (Optional)');
    const useBrowserBase = await askYesNo('Do you want to configure BrowserBase?', false);
    if (useBrowserBase) {
      envVars.BROWSERBASE_API_KEY = await askQuestion('Enter your BrowserBase API Key');
      envVars.BROWSERBASE_PROJECT_ID = await askQuestion('Enter your BrowserBase Project ID');
    }

    // Workflow Automation (Optional)
    log.step('⚡ Workflow Automation (Optional)');
    const useN8N = await askYesNo('Do you want to configure N8N workflow automation?', false);
    if (useN8N) {
      envVars.N8N_API_URL = await askQuestion('Enter your N8N API URL');
      envVars.N8N_API_KEY = await askQuestion('Enter your N8N API Key');
    }

    // Observability (Optional)
    log.step('📈 Observability (Optional)');
    const useAgentOps = await askYesNo('Do you want to configure AgentOps?', false);
    if (useAgentOps) {
      envVars.AGENTOPS_API_KEY = await askQuestion('Enter your AgentOps API Key');
    }

    const useSentry = await askYesNo('Do you want to configure Sentry error tracking?', false);
    if (useSentry) {
      envVars.SENTRY_DSN = await askQuestion('Enter your Sentry DSN');
    }

    // Rate Limiting and Security
    log.step('🛡️ Rate Limiting and Security');
    envVars.RATE_LIMIT_WINDOW_MS = '900000';
    envVars.RATE_LIMIT_MAX_REQUESTS = '100';
    envVars.AUTH_RATE_LIMIT_MAX = '5';
    envVars.CORS_ORIGINS = `${envVars.FRONTEND_URL},https://localhost:3000`;
    envVars.MAX_REQUEST_SIZE = '10mb';
    envVars.COMPRESSION = 'true';

    // Vite Build-time Variables
    log.step('🔨 Build Configuration');
    envVars.VITE_SOCKET_URL = envVars.DOMAIN;
    envVars.VITE_API_URL = `${envVars.FRONTEND_URL}/api`;
    envVars.VITE_APP_VERSION = '2.1.0';
    envVars.VITE_BUILD_TIME = new Date().toISOString();

    // Performance and Caching
    log.step('⚡ Performance Configuration');
    envVars.CACHE_TTL = '3600000';
    envVars.REDIS_CACHE_TTL = '1800000';
    envVars.API_CACHE_TTL = '300000';

    // Monitoring and Logging
    log.step('📊 Monitoring Configuration');
    envVars.LOG_LEVEL = 'info';
    envVars.ENABLE_METRICS = 'true';
    envVars.ENABLE_HEALTH_CHECKS = 'true';
    envVars.ENABLE_PERFORMANCE_MONITORING = 'true';

    // Generate .env.production.vercel
    log.step('📝 Generating Configuration Files');
    const envFile = path.join(process.cwd(), '.env.production.vercel');
    
    const envContent = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    fs.writeFileSync(envFile, `# EchoTune AI - Production Environment Variables for Vercel\n# Generated on ${new Date().toISOString()}\n\n${envContent}`);
    
    log.success(`Generated .env.production.vercel`);

    // Generate Vercel environment setup commands
    const vercelCommands = Object.entries(envVars)
      .filter(([_, value]) => value && value !== '')
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
    
    log.success(`Generated vercel-env-commands.sh`);

    // Generate README section
    const readmeSection = `## 🚀 Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/dzp5103/Spotify-echo&env=${Object.keys(envVars).join(',')}&envDescription=Environment%20variables%20for%20EchoTune%20AI&envLink=https://github.com/dzp5103/Spotify-echo/blob/main/vercel.env.txt)

### Environment Variables Required

Copy these environment variables to your Vercel project:

\`\`\`bash
${Object.entries(envVars)
  .filter(([_, value]) => value && value !== '')
  .map(([key, value]) => `${key}=${value}`)
  .join('\n')}
\`\`\`

### Manual Setup

1. Run: \`chmod +x vercel-env-commands.sh\`
2. Execute: \`./vercel-env-commands.sh\`
3. Deploy: \`vercel --prod\`

For detailed instructions, see [DEPLOY_TO_VERCEL.md](./DEPLOY_TO_VERCEL.md)
`;

    log.success(`Generated README section for Vercel deployment`);

    // Final instructions
    log.header('🎉 Configuration Complete!');
    log.info('Next steps:');
    log.info('1. Review the generated .env.production.vercel file');
    log.info('2. Run the vercel-env-commands.sh script to set up Vercel');
    log.info('3. Deploy with: npm run deploy:vercel');
    log.info('4. Or manually: vercel --prod');
    log.info('\n📁 Generated files:');
    log.info(`   - .env.production.vercel (${Object.keys(envVars).length} variables)`);
    log.info(`   - vercel-env-commands.sh (automated setup)`);
    log.info(`   - README section (copy to your README.md)`);

    // Save README section for user to copy
    const readmeFile = path.join(process.cwd(), 'VERCEL_README_SECTION.md');
    fs.writeFileSync(readmeFile, readmeSection);
    log.info(`   - VERCEL_README_SECTION.md (copy to your README.md)`);

  } catch (error) {
    log.error(`Configuration failed: ${error.message}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the configuration
if (require.main === module) {
  configureVercelEnvironment();
}

module.exports = { configureVercelEnvironment };