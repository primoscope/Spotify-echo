#!/usr/bin/env node

/**
 * DigitalOcean Automation Script for EchoTune AI
 * Comprehensive deployment and management using DigitalOcean API
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

class DigitalOceanAutomation {
  constructor() {
    this.apiToken = process.env.DO_PAT || process.env.DIGITALOCEAN_ACCESS_TOKEN;
    this.apiBase = 'https://api.digitalocean.com/v2';
    this.headers = {
      'Authorization': `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json'
    };
    
    this.config = {
      app: {
        name: 'echotune-ai',
        region: 'nyc1',
        environment: process.env.NODE_ENV || 'production'
      },
      domain: process.env.DOMAIN || 'echotune-ai.com',
      registry: 'registry.digitalocean.com/echotune-registry'
    };
  }

  /**
   * Make API request to DigitalOcean
   */
  async apiRequest(method, endpoint, data = null) {
    return new Promise((resolve, reject) => {
      const url = `${this.apiBase}${endpoint}`;
      const options = {
        method,
        headers: this.headers
      };

      const req = https.request(url, options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed);
            } else {
              reject(new Error(`API Error ${res.statusCode}: ${parsed.message || responseData}`));
            }
          } catch (e) {
            reject(new Error(`Parse Error: ${responseData}`));
          }
        });
      });

      req.on('error', reject);
      
      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  /**
   * Check DigitalOcean API authentication
   */
  async checkAuth() {
    try {
      console.log('🔑 Checking DigitalOcean API authentication...');
      const account = await this.apiRequest('GET', '/account');
      console.log(`✅ Authenticated as: ${account.account.email}`);
      console.log(`📊 Account Status: ${account.account.status}`);
      return true;
    } catch (error) {
      console.error('❌ Authentication failed:', error.message);
      console.log('\n💡 To fix this:');
      console.log('1. Get your API token from https://cloud.digitalocean.com/account/api/tokens');
      console.log('2. Set environment variable: export DO_PAT=your_token_here');
      console.log('3. Or update .env file with: DO_PAT=your_token_here');
      return false;
    }
  }

  /**
   * List all apps
   */
  async listApps() {
    try {
      const response = await this.apiRequest('GET', '/apps');
      return response.apps || [];
    } catch (error) {
      console.log('📝 No existing apps found or error:', error.message);
      return [];
    }
  }

  /**
   * Create container registry
   */
  async createRegistry() {
    try {
      console.log('🐳 Creating container registry...');
      
      const registryData = {
        name: 'echotune-registry',
        subscription_tier_slug: 'basic'
      };

      const registry = await this.apiRequest('POST', '/registry', registryData);
      console.log('✅ Container registry created:', registry.registry.name);
      return registry.registry;
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Container registry already exists');
        return await this.getRegistry();
      }
      throw error;
    }
  }

  /**
   * Get registry information
   */
  async getRegistry() {
    try {
      const response = await this.apiRequest('GET', '/registry');
      return response.registry;
    } catch (error) {
      console.log('📝 No registry found:', error.message);
      return null;
    }
  }

  /**
   * Create App Platform application
   */
  async createApp() {
    try {
      console.log('🚀 Creating App Platform application...');
      
      const appSpec = {
        name: this.config.app.name,
        region: this.config.app.region,
        services: [
          {
            name: 'web',
            source_dir: '/',
            github: {
              repo: 'dzp5103/Spotify-echo',
              branch: 'main'
            },
            run_command: 'npm start',
            environment_slug: 'node-js',
            instance_count: 1,
            instance_size_slug: 'basic-xxs',
            http_port: 3000,
            health_check: {
              http_path: '/health'
            },
            envs: [
              {
                key: 'NODE_ENV',
                value: 'production'
              },
              {
                key: 'PORT',
                value: '3000'
              }
            ]
          }
        ]
      };

      const app = await this.apiRequest('POST', '/apps', { spec: appSpec });
      console.log('✅ App created:', app.app.id);
      return app.app;
    } catch (error) {
      console.error('❌ Failed to create app:', error.message);
      throw error;
    }
  }

  /**
   * Update app environment variables
   */
  async updateAppEnv(appId, envVars) {
    try {
      console.log('🔧 Updating app environment variables...');
      
      const app = await this.apiRequest('GET', `/apps/${appId}`);
      const spec = app.app.spec;
      
      // Update environment variables
      if (spec.services && spec.services[0]) {
        spec.services[0].envs = [
          ...spec.services[0].envs,
          ...envVars
        ];
      }
      
      const updatedApp = await this.apiRequest('PUT', `/apps/${appId}`, { spec });
      console.log('✅ Environment variables updated');
      return updatedApp.app;
    } catch (error) {
      console.error('❌ Failed to update environment:', error.message);
      throw error;
    }
  }

  /**
   * Deploy application
   */
  async deployApp(appId) {
    try {
      console.log('🚀 Triggering deployment...');
      
      const deployment = await this.apiRequest('POST', `/apps/${appId}/deployments`);
      console.log('✅ Deployment triggered:', deployment.deployment.id);
      
      // Wait for deployment to complete
      await this.waitForDeployment(appId, deployment.deployment.id);
      
      return deployment.deployment;
    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      throw error;
    }
  }

  /**
   * Wait for deployment to complete
   */
  async waitForDeployment(appId, deploymentId) {
    console.log('⏳ Waiting for deployment to complete...');
    
    const maxWaitTime = 10 * 60 * 1000; // 10 minutes
    const pollInterval = 30 * 1000; // 30 seconds
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const deployment = await this.apiRequest('GET', `/apps/${appId}/deployments/${deploymentId}`);
        const status = deployment.deployment.phase;
        
        console.log(`📊 Deployment status: ${status}`);
        
        if (status === 'ACTIVE') {
          console.log('✅ Deployment completed successfully!');
          return deployment.deployment;
        } else if (status === 'ERROR' || status === 'CANCELED') {
          throw new Error(`Deployment failed with status: ${status}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        console.error('❌ Error checking deployment status:', error.message);
        throw error;
      }
    }
    
    throw new Error('Deployment timed out');
  }

  /**
   * Get app URL
   */
  async getAppUrl(appId) {
    try {
      const app = await this.apiRequest('GET', `/apps/${appId}`);
      if (app.app.live_url) {
        return app.app.live_url;
      }
      return `https://${this.config.app.name}-${appId.slice(-8)}.ondigitalocean.app`;
    } catch (error) {
      console.error('❌ Failed to get app URL:', error.message);
      return null;
    }
  }

  /**
   * Setup domain
   */
  async setupDomain(appId, domain) {
    try {
      console.log(`🌐 Setting up domain: ${domain}`);
      
      const domainData = {
        name: domain,
        type: 'PRIMARY'
      };
      
      const result = await this.apiRequest('POST', `/apps/${appId}/domains`, domainData);
      console.log('✅ Domain configured');
      return result.domain;
    } catch (error) {
      console.error('❌ Domain setup failed:', error.message);
      // Don't throw - domain setup is optional
      return null;
    }
  }

  /**
   * Full deployment automation
   */
  async fullDeploy() {
    try {
      console.log('🎵 Starting EchoTune AI deployment to DigitalOcean...\n');
      
      // Check authentication
      const authOk = await this.checkAuth();
      if (!authOk) {
        throw new Error('Authentication failed');
      }
      
      // Create registry if needed
      await this.createRegistry();
      
      // Check for existing app
      const apps = await this.listApps();
      let app = apps.find(a => a.spec.name === this.config.app.name);
      
      if (!app) {
        app = await this.createApp();
      } else {
        console.log('✅ Using existing app:', app.id);
      }
      
      // Update environment variables
      const envVars = [
        { key: 'SPOTIFY_CLIENT_ID', value: process.env.SPOTIFY_CLIENT_ID || '', type: 'SECRET' },
        { key: 'SPOTIFY_CLIENT_SECRET', value: process.env.SPOTIFY_CLIENT_SECRET || '', type: 'SECRET' },
        { key: 'SESSION_SECRET', value: process.env.SESSION_SECRET || '', type: 'SECRET' },
        { key: 'JWT_SECRET', value: process.env.JWT_SECRET || '', type: 'SECRET' }
      ].filter(env => env.value); // Only add vars that have values
      
      if (envVars.length > 0) {
        await this.updateAppEnv(app.id, envVars);
      }
      
      // Deploy app
      await this.deployApp(app.id);
      
      // Setup domain if provided
      if (this.config.domain && this.config.domain !== 'echotune-ai.com') {
        await this.setupDomain(app.id, this.config.domain);
      }
      
      // Get app URL
      const appUrl = await this.getAppUrl(app.id);
      
      console.log('\n🎉 Deployment completed successfully!');
      console.log(`🌐 App URL: ${appUrl}`);
      console.log(`📊 App ID: ${app.id}`);
      console.log(`🗂️  Manage at: https://cloud.digitalocean.com/apps/${app.id}`);
      
      return {
        appId: app.id,
        url: appUrl,
        domain: this.config.domain
      };
      
    } catch (error) {
      console.error('\n❌ Deployment failed:', error.message);
      throw error;
    }
  }

  /**
   * Get deployment status
   */
  async getStatus() {
    try {
      const authOk = await this.checkAuth();
      if (!authOk) return;
      
      const apps = await this.listApps();
      const app = apps.find(a => a.spec.name === this.config.app.name);
      
      if (!app) {
        console.log('📝 No EchoTune AI app found');
        return;
      }
      
      console.log('\n📊 EchoTune AI Status:');
      console.log(`App ID: ${app.id}`);
      console.log(`Status: ${app.phase}`);
      console.log(`Created: ${new Date(app.created_at).toLocaleString()}`);
      console.log(`Updated: ${new Date(app.updated_at).toLocaleString()}`);
      
      if (app.live_url) {
        console.log(`URL: ${app.live_url}`);
      }
      
      return app;
    } catch (error) {
      console.error('❌ Failed to get status:', error.message);
    }
  }
}

// CLI interface
async function main() {
  const command = process.argv[2] || 'help';
  const automation = new DigitalOceanAutomation();
  
  try {
    switch (command) {
      case 'deploy':
        await automation.fullDeploy();
        break;
      case 'status':
        await automation.getStatus();
        break;
      case 'auth':
        await automation.checkAuth();
        break;
      case 'apps':
        const apps = await automation.listApps();
        console.log('📱 Your apps:', apps.map(a => `${a.spec.name} (${a.id})`));
        break;
      case 'help':
      default:
        console.log(`
🎵 EchoTune AI DigitalOcean Automation

Usage: node scripts/digitalocean-automation.js <command>

Commands:
  deploy    - Full deployment to DigitalOcean
  status    - Check app status
  auth      - Test API authentication
  apps      - List all apps
  help      - Show this help

Environment Variables:
  DO_PAT                     - DigitalOcean API token (required)
  DOMAIN                     - Custom domain (optional)
  SPOTIFY_CLIENT_ID          - Spotify API client ID
  SPOTIFY_CLIENT_SECRET      - Spotify API client secret
  SESSION_SECRET             - Session encryption secret
  JWT_SECRET                 - JWT signing secret

Examples:
  # Test authentication
  node scripts/digitalocean-automation.js auth
  
  # Deploy application
  node scripts/digitalocean-automation.js deploy
  
  # Check status
  node scripts/digitalocean-automation.js status
`);
        break;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = DigitalOceanAutomation;