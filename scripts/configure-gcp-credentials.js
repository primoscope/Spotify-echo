#!/usr/bin/env node
/**
 * GCP Credentials Configuration Script
 * 
 * This script helps configure Google Cloud Platform credentials for EchoTune AI
 * to enable Vertex AI models and exit mock mode.
 * 
 * Usage:
 *   node scripts/configure-gcp-credentials.js [command]
 * 
 * Commands:
 *   check      - Check current GCP configuration status
 *   setup      - Interactive setup process
 *   validate   - Validate GCP credentials and access
 *   bootstrap  - Run automated GCP bootstrap (requires bootstrap key)
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class GCPCredentialsConfigurator {
  constructor() {
    this.envPath = path.join(__dirname, '../.env');
    this.envExamplePath = path.join(__dirname, '../.env.example');
    this.config = {
      projectId: null,
      projectNumber: null,
      location: 'us-central1',
      serviceAccount: null,
      workloadIdentityProvider: null,
      vertexBucket: null,
      hasCredentials: false,
      mockMode: true
    };
  }

  /**
   * Check current GCP configuration status
   */
  async checkStatus() {
    console.log('🔍 Checking GCP Configuration Status...\n');

    // Check environment variables
    await this.loadCurrentConfig();

    // Check if gcloud is installed
    const hasGcloud = this.hasGcloudCLI();
    
    // Check current gcloud project
    let currentProject = null;
    if (hasGcloud) {
      try {
        currentProject = this.runCommand('gcloud config get-value project', { silent: true })?.trim();
      } catch (error) {
        // Ignore error
      }
    }

    console.log('📊 Configuration Status:');
    console.log('========================');
    console.log(`Environment File: ${await this.fileExists(this.envPath) ? '✅ Found' : '❌ Missing'}`);
    console.log(`GCP Project ID: ${this.config.projectId || '❌ Not configured'}`);
    console.log(`GCP Location: ${this.config.location || 'us-central1 (default)'}`);
    console.log(`Service Account: ${this.config.serviceAccount || '❌ Not configured'}`);
    console.log(`Workload Identity: ${this.config.workloadIdentityProvider || '❌ Not configured'}`);
    console.log(`Vertex AI Bucket: ${this.config.vertexBucket || '❌ Not configured'}`);
    console.log(`Google Cloud CLI: ${hasGcloud ? '✅ Installed' : '❌ Not installed'}`);
    console.log(`Current gcloud project: ${currentProject || '❌ Not set'}`);
    console.log(`Mock Mode: ${this.config.mockMode ? '🔧 Active (models use mock responses)' : '✅ Disabled (using real Vertex AI)'}`);

    console.log('\n🎯 Next Steps:');
    if (!this.config.projectId) {
      console.log('1. Run: node scripts/configure-gcp-credentials.js setup');
      console.log('2. Or set GCP_PROJECT_ID in .env file');
    } else {
      console.log('1. Run: node scripts/configure-gcp-credentials.js validate');
      console.log('2. Test with: node scripts/configure-gcp-credentials.js test');
    }

    return this.config;
  }

  /**
   * Interactive setup process
   */
  async setup() {
    console.log('🚀 GCP Credentials Setup\n');

    // Check if gcloud is available
    if (!this.hasGcloudCLI()) {
      console.log('❌ Google Cloud CLI not found. Please install it first:');
      console.log('   https://cloud.google.com/sdk/docs/install');
      return false;
    }

    console.log('📝 Setup Options:\n');
    console.log('1. 🔄 Automated Bootstrap (Recommended)');
    console.log('   - Uses GitHub workflow to automatically create all resources');
    console.log('   - Requires a temporary bootstrap service account key');
    console.log('   - Most secure and comprehensive setup');
    console.log('');
    console.log('2. 🔧 Manual Configuration');
    console.log('   - Set up GCP project and credentials manually');
    console.log('   - Use existing service account or default credentials');
    console.log('   - More control but requires GCP knowledge');
    console.log('');

    const choice = await this.prompt('Choose setup method (1 for automated, 2 for manual): ');

    if (choice === '1') {
      await this.setupAutomatedBootstrap();
    } else if (choice === '2') {
      await this.setupManualConfiguration();
    } else {
      console.log('❌ Invalid choice. Please run the setup again.');
      return false;
    }

    return true;
  }

  /**
   * Setup automated bootstrap
   */
  async setupAutomatedBootstrap() {
    console.log('\n🤖 Automated Bootstrap Setup\n');

    console.log('This setup method uses the GitHub workflow to automatically configure all GCP resources.');
    console.log('It requires a temporary service account key with high privileges.\n');

    console.log('📋 Prerequisites:');
    console.log('1. Google Cloud project with billing enabled');
    console.log('2. Service account with sufficient permissions (roles/owner or custom)');
    console.log('3. Service account key downloaded as JSON file\n');

    const hasPrereqs = await this.prompt('Do you have these prerequisites? (y/n): ');
    if (hasPrereqs.toLowerCase() !== 'y') {
      console.log('\n📚 Please complete the prerequisites first:');
      console.log('1. Create or select a GCP project: https://console.cloud.google.com/');
      console.log('2. Enable billing for the project');
      console.log('3. Follow the bootstrap guide: docs/VERTEX_AI_BOOTSTRAP_GUIDE.md');
      return false;
    }

    const projectId = await this.prompt('Enter your GCP Project ID: ');
    if (!projectId || projectId.length < 6) {
      console.log('❌ Invalid project ID. Must be at least 6 characters.');
      return false;
    }

    // Update .env file with basic configuration
    await this.updateEnvFile({
      GCP_PROJECT_ID: projectId,
      GCP_VERTEX_LOCATION: 'us-central1'
    });

    console.log('\n✅ Basic configuration saved to .env file');
    console.log('\n🚀 Next Steps:');
    console.log('1. Go to your GitHub repository Settings → Secrets and variables → Actions');
    console.log('2. Add a new repository secret named: GCP_BOOTSTRAP_SA_KEY');
    console.log('3. Set the value to your base64-encoded service account key:');
    console.log('   base64 your-service-account-key.json | tr -d \'\\n\'');
    console.log('4. Go to Actions tab → "Vertex AI Bootstrap - One-Click GCP Setup"');
    console.log('5. Click "Run workflow" and wait for completion');
    console.log('6. Add the generated secrets from the workflow output to your repository');
    console.log('\n📖 Detailed instructions: docs/VERTEX_AI_BOOTSTRAP_GUIDE.md');

    return true;
  }

  /**
   * Setup manual configuration
   */
  async setupManualConfiguration() {
    console.log('\n🔧 Manual Configuration Setup\n');

    const projectId = await this.prompt('Enter your GCP Project ID: ');
    if (!projectId || projectId.length < 6) {
      console.log('❌ Invalid project ID. Must be at least 6 characters.');
      return false;
    }

    const location = await this.prompt('Enter Vertex AI location [us-central1]: ') || 'us-central1';

    console.log('\n🔑 Authentication Options:');
    console.log('1. Application Default Credentials (ADC) - Recommended for local development');
    console.log('2. Service Account Key - For production or specific service account');
    console.log('3. Workload Identity Federation - For GitHub Actions (advanced)');

    const authChoice = await this.prompt('Choose authentication method (1-3): ');

    const updateData = {
      GCP_PROJECT_ID: projectId,
      GCP_VERTEX_LOCATION: location
    };

    switch (authChoice) {
      case '1':
        console.log('\n🔄 Setting up Application Default Credentials...');
        console.log('Run this command to authenticate with your Google account:');
        console.log('   gcloud auth application-default login');
        console.log('\nAfter authentication, run: node scripts/configure-gcp-credentials.js validate');
        break;

      case '2':
        const keyPath = await this.prompt('Enter path to service account key file: ');
        if (await this.fileExists(keyPath)) {
          updateData.GOOGLE_APPLICATION_CREDENTIALS = keyPath;
          console.log('✅ Service account key path configured');
        } else {
          console.log('❌ Key file not found. Please check the path.');
          return false;
        }
        break;

      case '3':
        console.log('\n🔄 Workload Identity Federation setup requires:');
        console.log('1. Workload Identity Pool and Provider');
        console.log('2. Service account with proper IAM bindings');
        console.log('3. GitHub repository secrets configuration');
        console.log('\nRecommendation: Use the automated bootstrap instead.');
        return false;

      default:
        console.log('❌ Invalid choice.');
        return false;
    }

    await this.updateEnvFile(updateData);
    console.log('\n✅ Configuration saved to .env file');
    console.log('🧪 Run validation: node scripts/configure-gcp-credentials.js validate');

    return true;
  }

  /**
   * Validate GCP credentials and access
   */
  async validate() {
    console.log('🔍 Validating GCP Configuration...\n');

    await this.loadCurrentConfig();

    if (!this.config.projectId) {
      console.log('❌ GCP_PROJECT_ID not configured. Run setup first.');
      return false;
    }

    console.log('📋 Validation Checklist:');
    console.log('========================');

    // Test 1: Check if gcloud is available
    console.log('1. Google Cloud CLI availability...');
    if (!this.hasGcloudCLI()) {
      console.log('   ❌ gcloud CLI not found');
      return false;
    } else {
      console.log('   ✅ gcloud CLI available');
    }

    // Test 2: Check authentication
    console.log('2. Authentication status...');
    try {
      const authTest = this.runCommand('gcloud auth list --filter=status:ACTIVE --format="value(account)"', { silent: true });
      if (authTest && authTest.trim()) {
        console.log(`   ✅ Authenticated as: ${authTest.trim()}`);
      } else {
        console.log('   ❌ No active authentication found');
        return false;
      }
    } catch (error) {
      console.log('   ❌ Authentication check failed');
      return false;
    }

    // Test 3: Check project access
    console.log('3. Project access...');
    try {
      const projectInfo = this.runCommand(`gcloud projects describe ${this.config.projectId} --format="value(projectId,projectNumber)"`, { silent: true });
      if (projectInfo) {
        const [projectId, projectNumber] = projectInfo.trim().split('\t');
        console.log(`   ✅ Project accessible: ${projectId} (${projectNumber})`);
        
        // Update project number in config if not set
        if (!this.config.projectNumber) {
          await this.updateEnvFile({ GCP_PROJECT_NUMBER: projectNumber });
        }
      }
    } catch (error) {
      console.log(`   ❌ Cannot access project: ${this.config.projectId}`);
      return false;
    }

    // Test 4: Check Vertex AI API
    console.log('4. Vertex AI API access...');
    try {
      const apiTest = this.runCommand(`gcloud services list --enabled --filter="name:aiplatform.googleapis.com" --format="value(name)" --project=${this.config.projectId}`, { silent: true });
      if (apiTest && apiTest.includes('aiplatform.googleapis.com')) {
        console.log('   ✅ Vertex AI API enabled');
      } else {
        console.log('   ⚠️ Vertex AI API not enabled. Enabling...');
        try {
          this.runCommand(`gcloud services enable aiplatform.googleapis.com --project=${this.config.projectId}`);
          console.log('   ✅ Vertex AI API enabled successfully');
        } catch (enableError) {
          console.log('   ❌ Failed to enable Vertex AI API');
          return false;
        }
      }
    } catch (error) {
      console.log('   ❌ Cannot check Vertex AI API status');
      return false;
    }

    // Test 5: Test Vertex AI access (simple)
    console.log('5. Vertex AI access test...');
    try {
      const modelsTest = this.runCommand(`gcloud ai models list --region=${this.config.location} --limit=1 --format="value(name)" --project=${this.config.projectId}`, { silent: true });
      console.log('   ✅ Vertex AI accessible');
    } catch (error) {
      console.log('   ❌ Cannot access Vertex AI. Check permissions.');
      return false;
    }

    console.log('\n🎉 All validations passed!');
    console.log('✅ GCP credentials are properly configured');
    console.log('✅ Models should now work in non-mock mode');

    // Update mock mode status
    await this.updateEnvFile({ 
      GCP_CREDENTIALS_VALIDATED: 'true',
      AI_MOCK_MODE: 'false'
    });

    console.log('\n🧪 Test your setup:');
    console.log('   node claude-opus-command-processor.js test');
    console.log('   node scripts/configure-gcp-credentials.js vertex-verify');

    return true;
  }

  /**
   * Run automated bootstrap (if bootstrap key is available)
   */
  async bootstrap() {
    console.log('🤖 Running Automated GCP Bootstrap...\n');

    // Check if we're in a GitHub Actions environment
    if (process.env.GITHUB_ACTIONS) {
      console.log('🔄 Running in GitHub Actions environment');
      
      if (!process.env.GCP_BOOTSTRAP_SA_KEY) {
        console.log('❌ GCP_BOOTSTRAP_SA_KEY secret not found');
        console.log('Please add the secret to repository settings');
        return false;
      }

      // Trigger the bootstrap workflow logic
      console.log('🚀 Bootstrap workflow should be handled by GitHub Actions');
      console.log('This command is not needed when running in CI/CD');
      return true;
    }

    // Local bootstrap simulation
    console.log('📋 For local bootstrap, please:');
    console.log('1. Use the GitHub Actions workflow: vertex-bootstrap.yml');
    console.log('2. Or run manual setup: node scripts/configure-gcp-credentials.js setup');

    return false;
  }

  /**
   * Setup Workload Identity Federation using the idempotent script
   */
  async setupWorkloadIdentity() {
    console.log('🔧 Setting up Workload Identity Federation...\n');

    await this.loadCurrentConfig();

    if (!this.config.projectId) {
      console.log('❌ GCP_PROJECT_ID not configured. Run setup first.');
      return false;
    }

    // Determine repository name
    let repoName = process.env.GITHUB_REPOSITORY;
    if (!repoName) {
      try {
        // Try to get from git remote
        const remoteUrl = this.runCommand('git config --get remote.origin.url', { silent: true });
        const match = remoteUrl.match(/github\.com[\/:](.+?\/.+?)(?:\.git)?$/);
        if (match) {
          repoName = match[1];
        }
      } catch (error) {
        // Ignore error
      }
    }

    if (!repoName) {
      console.log('❌ Could not determine repository name');
      console.log('Please set GITHUB_REPOSITORY environment variable or run from git repository');
      return false;
    }

    console.log(`📋 Configuration:`);
    console.log(`   Project ID: ${this.config.projectId}`);
    console.log(`   Repository: ${repoName}`);

    const scriptPath = path.join(__dirname, 'gcp', 'setup_workload_identity.sh');
    
    try {
      // Set environment variables for the script
      const env = {
        ...process.env,
        PROJECT_ID: this.config.projectId,
        PROJECT_NUMBER: this.config.projectNumber || '',
        REPO_FULL_NAME: repoName,
        FORCE_RECREATE: process.env.FORCE_RECREATE || 'false',
        DRY_RUN: process.env.DRY_RUN || 'false'
      };

      console.log('🚀 Running Workload Identity setup script...\n');
      
      const result = this.runCommand(`bash "${scriptPath}"`, { 
        silent: false, 
        env: env
      });

      console.log('\n✅ Workload Identity Federation setup completed!');
      console.log('🧪 Next step: node scripts/configure-gcp-credentials.js vertex-verify');
      
      return true;

    } catch (error) {
      console.log('\n❌ Workload Identity setup failed:', error.message);
      console.log('💡 Try running with DRY_RUN=true first to check configuration');
      return false;
    }
  }

  /**
   * Verify Vertex AI access and toggle mock mode
   */
  async verifyVertex() {
    console.log('🧪 Verifying Vertex AI Configuration...\n');

    const verifyScript = path.join(__dirname, 'vertex', 'verify-vertex.js');
    
    try {
      console.log('🚀 Running Vertex AI verification...\n');
      
      const result = this.runCommand(`node "${verifyScript}"`, { 
        silent: false
      });

      console.log('\n✅ Vertex AI verification completed successfully!');
      return true;

    } catch (error) {
      console.log('\n❌ Vertex AI verification failed:', error.message);
      console.log('💡 Check the error details above and ensure:');
      console.log('   1. GCP_PROJECT_ID is set correctly in .env file');
      console.log('   2. You are authenticated: gcloud auth application-default login');
      console.log('   3. Vertex AI API is enabled in your project');
      console.log('   4. You have the required permissions');
      return false;
    }
  }

  /**
   * Test GCP configuration with a simple API call
   */
  async test() {
    console.log('🧪 Testing GCP Configuration...\n');

    await this.loadCurrentConfig();

    if (!this.config.projectId) {
      console.log('❌ GCP_PROJECT_ID not configured');
      return false;
    }

    console.log(`Testing with project: ${this.config.projectId}`);
    console.log(`Location: ${this.config.location}`);

    try {
      // Test with Claude Opus command processor
      const ClaudeOpusCommandProcessor = require('../claude-opus-command-processor.js');
      const processor = new ClaudeOpusCommandProcessor();

      console.log('🧠 Testing Claude Opus integration...');
      const result = await processor.processCommand('test', 'Hello, Claude Opus!');

      if (result.success && !result.mockMode) {
        console.log('✅ Real Vertex AI response received!');
        console.log(`Response: ${result.response.substring(0, 100)}...`);
        console.log('🎉 GCP credentials are working correctly!');
        return true;
      } else if (result.mockMode) {
        console.log('⚠️ Still running in mock mode');
        console.log('Check that all environment variables are set correctly');
        return false;
      } else {
        console.log('❌ Test failed');
        return false;
      }
    } catch (error) {
      console.log('❌ Test failed:', error.message);
      return false;
    }
  }

  /**
   * Load current configuration from environment
   */
  async loadCurrentConfig() {
    // Load from process.env (includes .env file if loaded)
    this.config.projectId = process.env.GCP_PROJECT_ID;
    this.config.projectNumber = process.env.GCP_PROJECT_NUMBER;
    this.config.location = process.env.GCP_VERTEX_LOCATION || 'us-central1';
    this.config.serviceAccount = process.env.GCP_SERVICE_ACCOUNT;
    this.config.workloadIdentityProvider = process.env.WORKLOAD_IDENTITY_PROVIDER;
    this.config.vertexBucket = process.env.GCP_VERTEX_BUCKET;
    this.config.hasCredentials = !!(
      process.env.GOOGLE_APPLICATION_CREDENTIALS || 
      process.env.GCP_SERVICE_ACCOUNT ||
      this.hasGcloudAuth()
    );
    this.config.mockMode = !this.config.projectId || process.env.AI_MOCK_MODE === 'true';

    // Try to load from .env file directly if not in process.env
    if (!this.config.projectId && await this.fileExists(this.envPath)) {
      const envContent = await fs.readFile(this.envPath, 'utf8');
      const gcpProjectMatch = envContent.match(/^GCP_PROJECT_ID=(.*)$/m);
      if (gcpProjectMatch) {
        this.config.projectId = gcpProjectMatch[1].trim();
        this.config.mockMode = false;
      }
    }
  }

  /**
   * Update .env file with new values
   */
  async updateEnvFile(updates) {
    let envContent = '';

    // Read existing .env file or use .env.example as template
    if (await this.fileExists(this.envPath)) {
      envContent = await fs.readFile(this.envPath, 'utf8');
    } else if (await this.fileExists(this.envExamplePath)) {
      envContent = await fs.readFile(this.envExamplePath, 'utf8');
      console.log('📝 Creating .env file from .env.example template');
    } else {
      console.log('📝 Creating new .env file');
    }

    // Update or add each key-value pair
    for (const [key, value] of Object.entries(updates)) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      const newLine = `${key}=${value}`;

      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, newLine);
      } else {
        // Add to the GCP section or at the end
        if (envContent.includes('# GOOGLE CLOUD / VERTEX AI')) {
          const gcpSectionRegex = /(# GOOGLE CLOUD \/ VERTEX AI[^\n]*\n)/;
          envContent = envContent.replace(gcpSectionRegex, `$1${newLine}\n`);
        } else {
          envContent += `\n${newLine}`;
        }
      }
    }

    await fs.writeFile(this.envPath, envContent);
    console.log(`✅ Updated .env file with: ${Object.keys(updates).join(', ')}`);
  }

  /**
   * Check if gcloud CLI is available
   */
  hasGcloudCLI() {
    try {
      this.runCommand('gcloud version', { silent: true });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if gcloud has active authentication
   */
  hasGcloudAuth() {
    try {
      const result = this.runCommand('gcloud auth list --filter=status:ACTIVE --format="value(account)"', { silent: true });
      return result && result.trim().length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Run a shell command
   */
  runCommand(command, options = {}) {
    try {
      const result = execSync(command, { 
        encoding: 'utf8',
        stdio: options.silent ? 'pipe' : 'inherit',
        timeout: 30000,
        env: options.env || process.env
      });
      return result;
    } catch (error) {
      if (!options.silent) {
        console.error(`Command failed: ${command}`);
        console.error(error.message);
      }
      throw error;
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Simple prompt function for interactive input
   */
  async prompt(question) {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    });
  }
}

// CLI interface
async function main() {
  const command = process.argv[2] || 'check';
  const configurator = new GCPCredentialsConfigurator();

  console.log('🎵 EchoTune AI - GCP Credentials Configuration\n');

  try {
    switch (command) {
      case 'check':
        await configurator.checkStatus();
        break;
      case 'setup':
        await configurator.setup();
        break;
      case 'validate':
        await configurator.validate();
        break;
      case 'bootstrap':
        await configurator.bootstrap();
        break;
      case 'test':
        await configurator.test();
        break;
      case 'wif-setup':
        await configurator.setupWorkloadIdentity();
        break;
      case 'vertex-verify':
        await configurator.verifyVertex();
        break;
      case 'help':
        console.log('Available commands:');
        console.log('  check          - Check current GCP configuration status');
        console.log('  setup          - Interactive setup process');
        console.log('  validate       - Validate GCP credentials and access');
        console.log('  bootstrap      - Run automated GCP bootstrap');
        console.log('  test           - Test GCP configuration with API call');
        console.log('  wif-setup      - Setup Workload Identity Federation');
        console.log('  vertex-verify  - Verify Vertex AI access and toggle mock mode');
        console.log('  help           - Show this help message');
        break;
      default:
        console.log(`❌ Unknown command: ${command}`);
        console.log('Run with "help" to see available commands');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = GCPCredentialsConfigurator;