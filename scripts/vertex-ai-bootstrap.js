#!/usr/bin/env node

/**
 * Vertex AI Bootstrap Script
 * 
 * This script provides additional utilities for the Vertex AI bootstrap process,
 * including validation, health checks, and advanced configuration options.
 * 
 * Usage:
 *   node scripts/vertex-ai-bootstrap.js [command] [options]
 * 
 * Commands:
 *   validate    - Validate bootstrap configuration
 *   health      - Check health of created resources
 *   cleanup     - Clean up bootstrap resources (use with caution)
 *   status      - Show current status of resources
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class VertexAIBootstrap {
  constructor() {
    this.projectId = null;
    this.projectNumber = null;
    this.serviceAccountEmail = null;
    this.workloadIdentityProvider = null;
    this.bucketName = null;
  }

  /**
   * Initialize the bootstrap helper with project information
   */
  async initialize() {
    try {
      // Try to get project info from environment or gcloud
      this.projectId = process.env.GCP_PROJECT_ID || 
                     this.runCommand('gcloud config get-value project', { silent: true })?.trim();
      
      if (!this.projectId) {
        throw new Error('No project ID found. Please set GCP_PROJECT_ID or configure gcloud.');
      }

      this.projectNumber = process.env.GCP_PROJECT_NUMBER ||
                          this.runCommand(`gcloud projects describe ${this.projectId} --format="value(projectNumber)"`, { silent: true })?.trim();
      
      this.serviceAccountEmail = `github-vertex@${this.projectId}.iam.gserviceaccount.com`;
      this.workloadIdentityProvider = `projects/${this.projectNumber}/locations/global/workloadIdentityPools/github-actions/providers/github-oidc`;
      this.bucketName = `${this.projectId}-vertex-ai-artifacts`;

      console.log('🔧 Initialized Vertex AI Bootstrap Helper');
      console.log(`📋 Project ID: ${this.projectId}`);
      console.log(`📋 Project Number: ${this.projectNumber}`);
      
    } catch (error) {
      console.error('❌ Failed to initialize:', error.message);
      process.exit(1);
    }
  }

  /**
   * Run a shell command with error handling
   */
  runCommand(command, options = {}) {
    try {
      const result = execSync(command, { 
        encoding: 'utf8',
        stdio: options.silent ? 'pipe' : 'inherit'
      });
      return result;
    } catch (error) {
      if (!options.silent) {
        console.error(`❌ Command failed: ${command}`);
        console.error(error.message);
      }
      if (options.throwOnError !== false) {
        throw error;
      }
      return null;
    }
  }

  /**
   * Validate the bootstrap configuration
   */
  async validateBootstrap() {
    console.log('🔍 Validating Vertex AI Bootstrap Configuration...');
    
    const checks = [
      this.checkServiceAccount(),
      this.checkWorkloadIdentity(),
      this.checkAPIs(),
      this.checkStorageBucket(),
      this.checkIAMBindings()
    ];

    let allPassed = true;
    for (const check of checks) {
      try {
        await check;
      } catch (error) {
        console.error(`❌ Validation failed: ${error.message}`);
        allPassed = false;
      }
    }

    if (allPassed) {
      console.log('✅ All validation checks passed!');
      return true;
    } else {
      console.log('❌ Some validation checks failed');
      return false;
    }
  }

  /**
   * Check if service account exists and has proper configuration
   */
  async checkServiceAccount() {
    console.log('🔍 Checking service account...');
    
    const result = this.runCommand(
      `gcloud iam service-accounts describe ${this.serviceAccountEmail}`,
      { silent: true, throwOnError: false }
    );

    if (!result) {
      throw new Error(`Service account ${this.serviceAccountEmail} not found`);
    }

    console.log('✅ Service account exists');
    
    // Check required roles
    const requiredRoles = [
      'roles/aiplatform.user',
      'roles/storage.admin',
      'roles/monitoring.viewer',
      'roles/logging.viewer'
    ];

    for (const role of requiredRoles) {
      const binding = this.runCommand(
        `gcloud projects get-iam-policy ${this.projectId} --flatten="bindings[].members" --format="table(bindings.role)" --filter="bindings.members:serviceAccount:${this.serviceAccountEmail} AND bindings.role:${role}"`,
        { silent: true, throwOnError: false }
      );

      if (!binding || !binding.includes(role)) {
        console.warn(`⚠️ Missing role: ${role}`);
      } else {
        console.log(`✅ Role assigned: ${role}`);
      }
    }
  }

  /**
   * Check workload identity pool and provider
   */
  async checkWorkloadIdentity() {
    console.log('🔍 Checking Workload Identity...');
    
    // Check pool
    const poolResult = this.runCommand(
      `gcloud iam workload-identity-pools describe github-actions --location=global`,
      { silent: true, throwOnError: false }
    );

    if (!poolResult) {
      throw new Error('Workload identity pool "github-actions" not found');
    }
    console.log('✅ Workload identity pool exists');

    // Check provider
    const providerResult = this.runCommand(
      `gcloud iam workload-identity-pools providers describe github-oidc --workload-identity-pool=github-actions --location=global`,
      { silent: true, throwOnError: false }
    );

    if (!providerResult) {
      throw new Error('OIDC provider "github-oidc" not found');
    }
    console.log('✅ OIDC provider exists');

    // Check IAM binding
    const bindingResult = this.runCommand(
      `gcloud iam service-accounts get-iam-policy ${this.serviceAccountEmail}`,
      { silent: true, throwOnError: false }
    );

    if (!bindingResult || !bindingResult.includes('workloadIdentityUser')) {
      console.warn('⚠️ Workload Identity binding may be missing');
    } else {
      console.log('✅ Workload Identity binding exists');
    }
  }

  /**
   * Check required APIs are enabled
   */
  async checkAPIs() {
    console.log('🔍 Checking required APIs...');
    
    const requiredAPIs = [
      'aiplatform.googleapis.com',
      'iamcredentials.googleapis.com',
      'iam.googleapis.com',
      'storage.googleapis.com',
      'serviceusage.googleapis.com'
    ];

    for (const api of requiredAPIs) {
      const result = this.runCommand(
        `gcloud services list --enabled --filter="name:${api}" --format="value(name)"`,
        { silent: true, throwOnError: false }
      );

      if (!result || !result.includes(api)) {
        throw new Error(`Required API not enabled: ${api}`);
      }
      console.log(`✅ API enabled: ${api}`);
    }
  }

  /**
   * Check storage bucket
   */
  async checkStorageBucket() {
    console.log('🔍 Checking storage bucket...');
    
    const result = this.runCommand(
      `gsutil ls -b gs://${this.bucketName}`,
      { silent: true, throwOnError: false }
    );

    if (!result) {
      throw new Error(`Storage bucket not found: ${this.bucketName}`);
    }
    console.log(`✅ Storage bucket exists: ${this.bucketName}`);
  }

  /**
   * Check IAM bindings
   */
  async checkIAMBindings() {
    console.log('🔍 Checking IAM bindings...');
    
    const policy = this.runCommand(
      `gcloud projects get-iam-policy ${this.projectId} --format=json`,
      { silent: true, throwOnError: false }
    );

    if (!policy) {
      throw new Error('Could not retrieve IAM policy');
    }

    try {
      const policyObj = JSON.parse(policy);
      const serviceAccountMember = `serviceAccount:${this.serviceAccountEmail}`;
      
      let foundBindings = 0;
      const requiredRoles = [
        'roles/aiplatform.user',
        'roles/storage.admin',
        'roles/monitoring.viewer',
        'roles/logging.viewer'
      ];

      for (const binding of policyObj.bindings || []) {
        if (binding.members && binding.members.includes(serviceAccountMember)) {
          if (requiredRoles.includes(binding.role)) {
            foundBindings++;
            console.log(`✅ IAM binding found: ${binding.role}`);
          }
        }
      }

      if (foundBindings < requiredRoles.length) {
        console.warn(`⚠️ Expected ${requiredRoles.length} bindings, found ${foundBindings}`);
      }

    } catch (error) {
      throw new Error(`Failed to parse IAM policy: ${error.message}`);
    }
  }

  /**
   * Show current status of all resources
   */
  async showStatus() {
    console.log('📊 Vertex AI Bootstrap Status Report');
    console.log('=====================================');
    
    try {
      await this.initialize();
      
      console.log('\n🏗️ Resource Status:');
      
      // Service Account
      try {
        await this.checkServiceAccount();
        console.log('  Service Account: ✅ Configured');
      } catch (error) {
        console.log('  Service Account: ❌ Issue detected');
      }

      // Workload Identity
      try {
        await this.checkWorkloadIdentity();
        console.log('  Workload Identity: ✅ Configured');
      } catch (error) {
        console.log('  Workload Identity: ❌ Issue detected');
      }

      // APIs
      try {
        await this.checkAPIs();
        console.log('  Required APIs: ✅ Enabled');
      } catch (error) {
        console.log('  Required APIs: ❌ Issue detected');
      }

      // Storage
      try {
        await this.checkStorageBucket();
        console.log('  Storage Bucket: ✅ Available');
      } catch (error) {
        console.log('  Storage Bucket: ❌ Issue detected');
      }

      console.log('\n📋 Configuration:');
      console.log(`  Project ID: ${this.projectId}`);
      console.log(`  Project Number: ${this.projectNumber}`);
      console.log(`  Service Account: ${this.serviceAccountEmail}`);
      console.log(`  Storage Bucket: ${this.bucketName}`);
      console.log(`  Workload Identity Provider: ${this.workloadIdentityProvider}`);

    } catch (error) {
      console.error('❌ Failed to generate status report:', error.message);
    }
  }

  /**
   * Generate environment configuration for GitHub secrets
   */
  async generateConfig() {
    console.log('🔧 Generating GitHub Secrets Configuration');
    console.log('==========================================');
    
    await this.initialize();
    
    console.log('\nAdd these secrets to your GitHub repository:');
    console.log('```');
    console.log(`GCP_PROJECT_ID=${this.projectId}`);
    console.log(`GCP_PROJECT_NUMBER=${this.projectNumber}`);
    console.log(`WORKLOAD_IDENTITY_PROVIDER=${this.workloadIdentityProvider}`);
    console.log(`GCP_SERVICE_ACCOUNT=${this.serviceAccountEmail}`);
    console.log(`GCP_VERTEX_BUCKET=${this.bucketName}`);
    console.log('```');
    
    console.log('\nFor workflows using Workload Identity Federation:');
    console.log('```yaml');
    console.log('- name: Authenticate to Google Cloud');
    console.log('  uses: google-github-actions/auth@v2');
    console.log('  with:');
    console.log(`    workload_identity_provider: \${{ secrets.WORKLOAD_IDENTITY_PROVIDER }}`);
    console.log(`    service_account: \${{ secrets.GCP_SERVICE_ACCOUNT }}`);
    console.log('```');
  }

  /**
   * Clean up bootstrap resources (use with caution)
   */
  async cleanup(force = false) {
    if (!force) {
      console.log('🚨 This will delete all Vertex AI bootstrap resources!');
      console.log('Use --force flag to confirm deletion');
      return;
    }

    console.log('🗑️ Cleaning up Vertex AI Bootstrap Resources...');
    
    await this.initialize();
    
    try {
      // Delete storage bucket
      console.log(`🗑️ Deleting storage bucket: ${this.bucketName}`);
      this.runCommand(`gsutil -m rm -r gs://${this.bucketName}`, { throwOnError: false });
      
      // Delete service account
      console.log(`🗑️ Deleting service account: ${this.serviceAccountEmail}`);
      this.runCommand(`gcloud iam service-accounts delete ${this.serviceAccountEmail} --quiet`, { throwOnError: false });
      
      // Delete workload identity provider
      console.log('🗑️ Deleting workload identity provider...');
      this.runCommand('gcloud iam workload-identity-pools providers delete github-oidc --workload-identity-pool=github-actions --location=global --quiet', { throwOnError: false });
      
      // Delete workload identity pool
      console.log('🗑️ Deleting workload identity pool...');
      this.runCommand('gcloud iam workload-identity-pools delete github-actions --location=global --quiet', { throwOnError: false });
      
      console.log('✅ Cleanup completed');
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';
  const bootstrap = new VertexAIBootstrap();

  try {
    switch (command) {
      case 'validate':
        await bootstrap.initialize();
        await bootstrap.validateBootstrap();
        break;
        
      case 'health':
        await bootstrap.validateBootstrap();
        break;
        
      case 'status':
        await bootstrap.showStatus();
        break;
        
      case 'config':
        await bootstrap.generateConfig();
        break;
        
      case 'cleanup':
        const force = args.includes('--force');
        await bootstrap.cleanup(force);
        break;
        
      case 'help':
      case '--help':
        console.log('Vertex AI Bootstrap Script');
        console.log('');
        console.log('Usage: node scripts/vertex-ai-bootstrap.js [command] [options]');
        console.log('');
        console.log('Commands:');
        console.log('  validate    Validate bootstrap configuration');
        console.log('  health      Check health of created resources');
        console.log('  status      Show current status of resources (default)');
        console.log('  config      Generate GitHub secrets configuration');
        console.log('  cleanup     Clean up bootstrap resources (use --force)');
        console.log('  help        Show this help message');
        break;
        
      default:
        console.error(`❌ Unknown command: ${command}`);
        console.log('Use "help" for available commands');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

// Export for testing
module.exports = VertexAIBootstrap;

// Run CLI if called directly
if (require.main === module) {
  main().catch(console.error);
}