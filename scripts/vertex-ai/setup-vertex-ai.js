#!/usr/bin/env node

/**
 * Vertex AI Setup and Validation Script
 * 
 * This script validates the Vertex AI configuration and sets up
 * necessary resources like storage buckets.
 * 
 * Usage:
 *   node scripts/vertex-ai/setup-vertex-ai.js
 */

const { Storage } = require('@google-cloud/storage');
const { aiplatform } = require('@google-cloud/aiplatform');

class VertexAISetup {
  constructor() {
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT;
    this.region = process.env.VERTEX_AI_REGION || 'us-central1';
    this.stagingBucket = process.env.VERTEX_AI_STAGING_BUCKET;
    
    if (!this.projectId) {
      throw new Error('GOOGLE_CLOUD_PROJECT environment variable is required');
    }

    this.storage = new Storage();
  }

  /**
   * Validate authentication and permissions
   */
  async validateAuthentication() {
    console.log(`🔐 Validating authentication...`);
    
    try {
      // Test authentication by listing projects
      const [projects] = await this.storage.getProjects();
      const currentProject = projects.find(p => p.id === this.projectId);
      
      if (!currentProject) {
        throw new Error(`Project ${this.projectId} not found or not accessible`);
      }
      
      console.log(`✅ Authentication successful for project: ${this.projectId}`);
      return true;
    } catch (error) {
      console.error(`❌ Authentication failed: ${error.message}`);
      console.error('Please ensure you have valid credentials:');
      console.error('1. Service account key file (GOOGLE_APPLICATION_CREDENTIALS)');
      console.error('2. Workload Identity Federation setup');
      console.error('3. Proper IAM permissions');
      throw error;
    }
  }

  /**
   * Validate required IAM permissions
   */
  async validatePermissions() {
    console.log(`🔑 Validating IAM permissions...`);
    
    const requiredPermissions = [
      'aiplatform.models.create',
      'aiplatform.models.get',
      'aiplatform.endpoints.create',
      'aiplatform.endpoints.get',
      'aiplatform.endpoints.deploy',
      'storage.buckets.create',
      'storage.objects.create',
      'storage.objects.get',
    ];
    
    try {
      // Create test clients to verify permissions
      const modelServiceClient = new aiplatform.v1.ModelServiceClient({
        apiEndpoint: `${this.region}-aiplatform.googleapis.com`,
      });
      
      const endpointServiceClient = new aiplatform.v1.EndpointServiceClient({
        apiEndpoint: `${this.region}-aiplatform.googleapis.com`,
      });
      
      // Test listing operations (should work with viewer permissions)
      const parent = `projects/${this.projectId}/locations/${this.region}`;
      await Promise.all([
        modelServiceClient.listModels({ parent }).catch(() => null),
        endpointServiceClient.listEndpoints({ parent }).catch(() => null),
      ]);
      
      console.log(`✅ IAM permissions validated for Vertex AI operations`);
      return true;
    } catch (error) {
      console.error(`❌ Permission validation failed: ${error.message}`);
      console.error('Required IAM roles:');
      console.error('- Vertex AI Administrator (roles/aiplatform.admin)');
      console.error('- Storage Admin (roles/storage.admin)');
      throw error;
    }
  }

  /**
   * Setup or validate staging bucket
   */
  async setupStagingBucket() {
    if (!this.stagingBucket) {
      console.log(`⚠️  VERTEX_AI_STAGING_BUCKET not specified, skipping bucket setup`);
      return null;
    }
    
    console.log(`🪣 Setting up staging bucket: ${this.stagingBucket}`);
    
    try {
      const bucket = this.storage.bucket(this.stagingBucket);
      
      // Check if bucket exists
      const [exists] = await bucket.exists();
      
      if (exists) {
        console.log(`✅ Staging bucket exists: gs://${this.stagingBucket}`);
        
        // Validate bucket access
        const [metadata] = await bucket.getMetadata();
        console.log(`📋 Bucket location: ${metadata.location}`);
        console.log(`📋 Storage class: ${metadata.storageClass}`);
        
      } else {
        console.log(`📦 Creating staging bucket: gs://${this.stagingBucket}`);
        
        await bucket.create({
          location: this.region.split('-').slice(0, 2).join('-'), // e.g., us-central1 -> us-central
          storageClass: 'STANDARD',
          labels: {
            'created-by': 'echotune-vertex-ai',
            'purpose': 'model-staging',
          },
        });
        
        console.log(`✅ Staging bucket created: gs://${this.stagingBucket}`);
      }
      
      return bucket;
    } catch (error) {
      console.error(`❌ Bucket setup failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate Vertex AI service availability
   */
  async validateVertexAIService() {
    console.log(`🤖 Validating Vertex AI service in region: ${this.region}`);
    
    try {
      const modelServiceClient = new aiplatform.v1.ModelServiceClient({
        apiEndpoint: `${this.region}-aiplatform.googleapis.com`,
      });
      
      const parent = `projects/${this.projectId}/locations/${this.region}`;
      await modelServiceClient.listModels({ parent, pageSize: 1 });
      
      console.log(`✅ Vertex AI service available in ${this.region}`);
      return true;
    } catch (error) {
      console.error(`❌ Vertex AI service validation failed: ${error.message}`);
      
      if (error.message.includes('not found') || error.message.includes('not enabled')) {
        console.error('Please enable the Vertex AI API:');
        console.error(`https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project=${this.projectId}`);
      }
      
      throw error;
    }
  }

  /**
   * Display configuration summary
   */
  displayConfiguration() {
    console.log(`\n📋 Vertex AI Configuration Summary:`);
    console.log(`   Project ID: ${this.projectId}`);
    console.log(`   Region: ${this.region}`);
    console.log(`   Staging Bucket: ${this.stagingBucket || 'Not configured'}`);
    console.log(`   API Endpoint: ${this.region}-aiplatform.googleapis.com`);
    
    const authMethod = process.env.GOOGLE_APPLICATION_CREDENTIALS ? 
      'Service Account Key' : 'Default credentials (Workload Identity or gcloud)';
    console.log(`   Authentication: ${authMethod}`);
    
    console.log(`\n🔗 Useful URLs:`);
    console.log(`   Vertex AI Console: https://console.cloud.google.com/vertex-ai?project=${this.projectId}`);
    console.log(`   Models: https://console.cloud.google.com/vertex-ai/models?project=${this.projectId}`);
    console.log(`   Endpoints: https://console.cloud.google.com/vertex-ai/endpoints?project=${this.projectId}`);
    
    if (this.stagingBucket) {
      console.log(`   Storage Bucket: https://console.cloud.google.com/storage/browser/${this.stagingBucket}?project=${this.projectId}`);
    }
  }

  /**
   * Main setup method
   */
  async setup() {
    try {
      console.log(`🚀 Starting Vertex AI setup and validation...\n`);
      
      // Validate authentication
      await this.validateAuthentication();
      
      // Validate permissions
      await this.validatePermissions();
      
      // Validate Vertex AI service
      await this.validateVertexAIService();
      
      // Setup staging bucket
      await this.setupStagingBucket();
      
      // Display configuration
      this.displayConfiguration();
      
      console.log(`\n✅ Vertex AI setup completed successfully!`);
      console.log(`🎯 You can now deploy models using: npm run vertex:deploy`);
      
    } catch (error) {
      console.error(`\n❌ Setup failed: ${error.message}`);
      console.error(error.stack);
      process.exit(1);
    }
  }
}

// CLI handling
async function main() {
  const setup = new VertexAISetup();
  await setup.setup();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { VertexAISetup };