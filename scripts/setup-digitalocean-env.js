#!/usr/bin/env node

/**
 * EchoTune AI - DigitalOcean Environment Variables Setup Script
 * This script helps configure environment variables for DigitalOcean deployment
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
async function configureDigitalOceanEnvironment() {
  try {
    log.header('🚀 EchoTune AI - DigitalOcean Environment Setup');
    log.info('This script will help you configure environment variables for DigitalOcean deployment');
    log.info('Press Enter to use default values where available\n');

    const envVars = {};

    // Application Configuration
    log.step('⚙️ Application Configuration');
    envVars.NODE_ENV = 'production';
    envVars.PORT = '3000';
    
    envVars.FRONTEND_URL = await askQuestion(
      'Enter your production frontend URL',
      'https://your-domain.com'
    );
    
    envVars.DOMAIN = await askQuestion(
      'Enter your production domain',
      'your-domain.com'
    );

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

    // Spotify Configuration
    log.step('🎵 Spotify Configuration');
    const useSpotify = await askYesNo('Do you want to configure Spotify integration?', true);
    if (useSpotify) {
      envVars.SPOTIFY_CLIENT_ID = await askQuestion('Enter your Spotify Client ID');
      envVars.SPOTIFY_CLIENT_SECRET = await askQuestion('Enter your Spotify Client Secret');
      envVars.SPOTIFY_REDIRECT_URI = `${envVars.FRONTEND_URL}/auth/callback`;
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

    // Generate .env.production.digitalocean
    log.step('📝 Generating Configuration Files');
    const envFile = path.join(process.cwd(), '.env.production.digitalocean');
    
    const envContent = `# EchoTune AI - DigitalOcean Production Environment
# Generated on ${new Date().toISOString()}

${Object.entries(envVars)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n')}`;
    
    fs.writeFileSync(envFile, envContent);
    
    log.success(`Generated .env.production.digitalocean`);

    // Generate DigitalOcean App Platform commands
    const appPlatformCommands = Object.entries(envVars)
      .filter(([_, value]) => value && value !== '')
      .map(([key, value]) => {
        const isSecret = ['JWT_SECRET', 'SESSION_SECRET', 'SPOTIFY_CLIENT_SECRET', 'OPENAI_API_KEY', 'PERPLEXITY_API_KEY', 'GOOGLE_API_KEY', 'XAI_API_KEY', 'BROWSERBASE_API_KEY', 'N8N_API_KEY', 'AGENTOPS_API_KEY', 'SENTRY_DSN'].includes(key);
        return `doctl apps env set your-app-id ${key}=${value}${isSecret ? ' --type SECRET' : ''}`;
      })
      .join('\n');

    const appPlatformFile = path.join(process.cwd(), 'digitalocean-app-commands.sh');
    const appPlatformContent = `#!/bin/bash
# DigitalOcean App Platform Environment Variables Setup Commands
# Run these commands to set up your DigitalOcean App Platform environment variables

${appPlatformCommands}

echo "App Platform environment variables set successfully!"
echo "You can now deploy your app on DigitalOcean App Platform"
`;

    fs.writeFileSync(appPlatformFile, appPlatformContent);
    fs.chmodSync(appPlatformFile, '755');
    
    log.success(`Generated digitalocean-app-commands.sh`);

    // Generate Docker Compose environment file
    const dockerEnvFile = path.join(process.cwd(), '.env.docker.digitalocean');
    fs.writeFileSync(dockerEnvFile, envContent);
    
    log.success(`Generated .env.docker.digitalocean`);

    // Generate Kubernetes secrets template
    const k8sSecretsFile = path.join(process.cwd(), 'k8s-digitalocean-secrets.yaml');
    const k8sSecretsContent = `apiVersion: v1
kind: Secret
metadata:
  name: echotune-ai-secrets
  namespace: default
type: Opaque
data:
${Object.entries(envVars)
  .filter(([_, value]) => value && value !== '')
  .map(([key, value]) => `  ${key}: ${Buffer.from(value).toString('base64')}`)
  .join('\n')}
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: echotune-ai-config
  namespace: default
data:
${Object.entries(envVars)
  .filter(([_, value]) => value && value !== '' && !['JWT_SECRET', 'SESSION_SECRET', 'SPOTIFY_CLIENT_SECRET', 'OPENAI_API_KEY', 'PERPLEXITY_API_KEY', 'GOOGLE_API_KEY', 'XAI_API_KEY', 'BROWSERBASE_API_KEY', 'N8N_API_KEY', 'AGENTOPS_API_KEY', 'SENTRY_DSN'].includes(key))
  .map(([key, value]) => `  ${key}: "${value}"`)
  .join('\n')}`;

    fs.writeFileSync(k8sSecretsFile, k8sSecretsContent);
    
    log.success(`Generated k8s-digitalocean-secrets.yaml`);

    // Generate README section
    const readmeSection = `## 🚀 Quick Deploy to DigitalOcean

### Option 1: DigitalOcean App Platform (Recommended)

[![Deploy to DigitalOcean](https://www.digitalocean.com/assets/media/logo-icon-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/dzp5103/Spotify-echo&refcode=your_ref_code)

### Option 2: DigitalOcean Droplet with Docker

\`\`\`bash
# One-command deployment
curl -fsSL https://raw.githubusercontent.com/dzp5103/Spotify-echo/main/scripts/deploy-digitalocean-droplet.sh | sudo bash
\`\`\`

### Environment Variables Required

Copy these environment variables to your DigitalOcean deployment:

\`\`\`bash
${Object.entries(envVars)
  .filter(([_, value]) => value && value !== '')
  .map(([key, value]) => `${key}=${value}`)
  .join('\n')}
\`\`\`

### Setup Commands

1. **App Platform**: \`chmod +x digitalocean-app-commands.sh && ./digitalocean-app-commands.sh\`
2. **Docker**: \`cp .env.docker.digitalocean .env && docker-compose up -d\`
3. **Kubernetes**: \`kubectl apply -f k8s-digitalocean-secrets.yaml\`

For detailed instructions, see [DEPLOY_TO_DIGITALOCEAN.md](./DEPLOY_TO_DIGITALOCEAN.md)
`;

    log.success(`Generated README section for DigitalOcean deployment`);

    // Final instructions
    log.header('🎉 Configuration Complete!');
    log.info('Next steps:');
    log.info('1. Review the generated configuration files');
    log.info('2. Choose your deployment method:');
    log.info('   - App Platform: Use digitalocean-app-commands.sh');
    log.info('   - Docker: Use .env.docker.digitalocean');
    log.info('   - Kubernetes: Use k8s-digitalocean-secrets.yaml');
    log.info('3. Deploy with: npm run deploy:digitalocean:app');
    log.info('4. Or manually follow the deployment guide');
    log.info('\n📁 Generated files:');
    log.info(`   - .env.production.digitalocean (${Object.keys(envVars).length} variables)`);
    log.info(`   - digitalocean-app-commands.sh (App Platform setup)`);
    log.info(`   - .env.docker.digitalocean (Docker deployment)`);
    log.info(`   - k8s-digitalocean-secrets.yaml (Kubernetes secrets)`);
    log.info(`   - README section (copy to your README.md)`);

    // Save README section for user to copy
    const readmeFile = path.join(process.cwd(), 'DIGITALOCEAN_README_SECTION.md');
    fs.writeFileSync(readmeFile, readmeSection);
    log.info(`   - DIGITALOCEAN_README_SECTION.md (copy to your README.md)`);

  } catch (error) {
    log.error(`Configuration failed: ${error.message}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the configuration
if (require.main === module) {
  configureDigitalOceanEnvironment();
}

module.exports = { configureDigitalOceanEnvironment };