#!/usr/bin/env node

/**
 * Vertex AI Model Deployment Script
 * 
 * This script handles the deployment of ML models to Google Cloud Vertex AI.
 * It supports both Workload Identity Federation and Service Account authentication.
 * 
 * Usage:
 *   node scripts/vertex-ai/deploy-model.js [model-path] [--force]
 * 
 * Environment Variables:
 *   GOOGLE_CLOUD_PROJECT - GCP Project ID
 *   VERTEX_AI_REGION - Deployment region (default: us-central1)
 *   GOOGLE_APPLICATION_CREDENTIALS - Path to service account key (fallback)
 *   VERTEX_AI_STAGING_BUCKET - GCS bucket for model artifacts
 */

const { aiplatform } = require('@google-cloud/aiplatform');
const { Storage } = require('@google-cloud/storage');
const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');

const execAsync = promisify(exec);

class VertexAIDeployer {
  constructor() {
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT;
    this.region = process.env.VERTEX_AI_REGION || 'us-central1';
    this.stagingBucket = process.env.VERTEX_AI_STAGING_BUCKET;
    
    if (!this.projectId) {
      throw new Error('GOOGLE_CLOUD_PROJECT environment variable is required');
    }
    
    if (!this.stagingBucket) {
      throw new Error('VERTEX_AI_STAGING_BUCKET environment variable is required');
    }

    // Initialize clients
    this.modelServiceClient = new aiplatform.v1.ModelServiceClient({
      apiEndpoint: `${this.region}-aiplatform.googleapis.com`,
    });
    
    this.endpointServiceClient = new aiplatform.v1.EndpointServiceClient({
      apiEndpoint: `${this.region}-aiplatform.googleapis.com`,
    });
    
    this.storage = new Storage();
  }

  /**
   * Load model metadata from model directory
   */
  async loadModelMetadata(modelPath) {
    const metadataPath = path.join(modelPath, 'model_metadata.json');
    
    try {
      const metadataContent = await fs.readFile(metadataPath, 'utf8');
      return JSON.parse(metadataContent);
    } catch (error) {
      throw new Error(`Failed to load model metadata from ${metadataPath}: ${error.message}`);
    }
  }

  /**
   * Upload model artifacts to Google Cloud Storage
   */
  async uploadModelArtifacts(modelPath, modelName) {
    console.log(`📦 Uploading model artifacts to GCS...`);
    
    const bucket = this.storage.bucket(this.stagingBucket);
    const gcsPath = `models/${modelName}/${Date.now()}`;
    
    // Get all files in the model directory
    const files = await fs.readdir(modelPath);
    const uploadPromises = [];
    
    for (const file of files) {
      const localFilePath = path.join(modelPath, file);
      const gcsFilePath = `${gcsPath}/${file}`;
      
      const uploadPromise = bucket.upload(localFilePath, {
        destination: gcsFilePath,
        metadata: {
          cacheControl: 'public, max-age=31536000',
          metadata: {
            'uploaded-by': 'echotune-vertex-ai-deployer',
            'model-name': modelName,
            'upload-time': new Date().toISOString(),
          },
        },
      });
      
      uploadPromises.push(uploadPromise);
    }
    
    await Promise.all(uploadPromises);
    console.log(`✅ Model artifacts uploaded to gs://${this.stagingBucket}/${gcsPath}`);
    
    return `gs://${this.stagingBucket}/${gcsPath}`;
  }

  /**
   * Create or update a Vertex AI Model
   */
  async createOrUpdateModel(modelMetadata, artifactUri) {
    console.log(`🤖 Creating/updating Vertex AI model...`);
    
    const parent = `projects/${this.projectId}/locations/${this.region}`;
    const modelId = `echotune-${modelMetadata.name.replace(/[^a-zA-Z0-9-]/g, '-')}`;
    
    // Check if model already exists
    let existingModel = null;
    try {
      const modelName = `${parent}/models/${modelId}`;
      const [model] = await this.modelServiceClient.getModel({ name: modelName });
      existingModel = model;
      console.log(`📋 Found existing model: ${modelName}`);
    } catch (error) {
      if (error.code !== 5) { // NOT_FOUND
        throw error;
      }
      console.log(`📋 Model ${modelId} does not exist, creating new one...`);
    }

    const modelSpec = {
      displayName: modelMetadata.name,
      description: modelMetadata.description,
      versionDescription: `Version ${modelMetadata.version} - deployed ${new Date().toISOString()}`,
      containerSpec: {
        imageUri: this.getContainerImageUri(modelMetadata.framework),
        env: [
          { name: 'MODEL_ARTIFACT_URI', value: artifactUri },
          { name: 'MODEL_TYPE', value: modelMetadata.type },
        ],
        ports: [{ containerPort: 8080 }],
      },
      artifactUri,
      metadata: {
        framework: modelMetadata.framework,
        version: modelMetadata.version,
        deployed_by: 'echotune-ai',
        deployment_time: new Date().toISOString(),
      },
    };

    let modelResource;
    if (existingModel) {
      // Update existing model with new version
      const [operation] = await this.modelServiceClient.uploadModel({
        parent,
        model: modelSpec,
      });
      
      console.log(`⏳ Updating model... Operation: ${operation.name}`);
      const [model] = await operation.promise();
      modelResource = model;
    } else {
      // Create new model
      const [operation] = await this.modelServiceClient.uploadModel({
        parent,
        model: modelSpec,
      });
      
      console.log(`⏳ Creating model... Operation: ${operation.name}`);
      const [model] = await operation.promise();
      modelResource = model;
    }

    console.log(`✅ Model ready: ${modelResource.name}`);
    return modelResource;
  }

  /**
   * Get the appropriate container image URI based on framework
   */
  getContainerImageUri(framework) {
    const images = {
      'scikit-learn': 'us-docker.pkg.dev/vertex-ai/prediction/sklearn-cpu.1-3:latest',
      'tensorflow': 'us-docker.pkg.dev/vertex-ai/prediction/tf2-cpu.2-13:latest',
      'pytorch': 'us-docker.pkg.dev/vertex-ai/prediction/pytorch-cpu.1-13:latest',
      'xgboost': 'us-docker.pkg.dev/vertex-ai/prediction/xgboost-cpu.1-7:latest',
    };
    
    return images[framework] || images['scikit-learn']; // Default to scikit-learn
  }

  /**
   * Create or reuse a Vertex AI Endpoint
   */
  async createOrReuseEndpoint(modelMetadata) {
    console.log(`🔗 Creating/reusing Vertex AI endpoint...`);
    
    const parent = `projects/${this.projectId}/locations/${this.region}`;
    const endpointId = `echotune-${modelMetadata.name.replace(/[^a-zA-Z0-9-]/g, '-')}-endpoint`;
    
    // Check if endpoint already exists
    try {
      const endpointName = `${parent}/endpoints/${endpointId}`;
      const [endpoint] = await this.endpointServiceClient.getEndpoint({ name: endpointName });
      console.log(`♻️  Reusing existing endpoint: ${endpointName}`);
      return endpoint;
    } catch (error) {
      if (error.code !== 5) { // NOT_FOUND
        throw error;
      }
    }

    // Create new endpoint
    const [operation] = await this.endpointServiceClient.createEndpoint({
      parent,
      endpoint: {
        displayName: `${modelMetadata.name} Endpoint`,
        description: `Endpoint for ${modelMetadata.description}`,
        labels: {
          'created-by': 'echotune-ai',
          'model-type': modelMetadata.type,
        },
      },
      endpointId,
    });

    console.log(`⏳ Creating endpoint... Operation: ${operation.name}`);
    const [endpoint] = await operation.promise();
    console.log(`✅ Endpoint created: ${endpoint.name}`);
    
    return endpoint;
  }

  /**
   * Deploy model to endpoint with rolling update
   */
  async deployModelToEndpoint(model, endpoint, modelMetadata) {
    console.log(`🚀 Deploying model to endpoint...`);
    
    const deployedModelSpec = {
      displayName: `${modelMetadata.name}-${modelMetadata.version}`,
      model: model.name,
      trafficSplit: modelMetadata.vertex_ai.traffic_split || { '0': 100 },
      machineSpec: {
        machineType: modelMetadata.vertex_ai.machine_type || 'n1-standard-4',
        acceleratorType: modelMetadata.vertex_ai.accelerator_type || null,
        acceleratorCount: modelMetadata.vertex_ai.accelerator_count || 0,
      },
      minReplicaCount: modelMetadata.vertex_ai.min_replica_count || 1,
      maxReplicaCount: modelMetadata.vertex_ai.max_replica_count || 3,
      autoscalingMetricSpecs: [
        {
          metricType: 'CPU_UTILIZATION',
          target: 70,
        },
      ],
    };

    const [operation] = await this.endpointServiceClient.deployModel({
      endpoint: endpoint.name,
      deployedModel: deployedModelSpec,
      trafficSplit: deployedModelSpec.trafficSplit,
    });

    console.log(`⏳ Deploying to endpoint... Operation: ${operation.name}`);
    const [deployResponse] = await operation.promise();
    
    console.log(`✅ Model deployed successfully!`);
    return deployResponse;
  }

  /**
   * Generate prediction URL and endpoint information
   */
  generateEndpointInfo(endpoint, modelMetadata) {
    const endpointId = endpoint.name.split('/').pop();
    const predictionUrl = `https://${this.region}-aiplatform.googleapis.com/v1/${endpoint.name}:predict`;
    
    return {
      endpoint_id: endpointId,
      endpoint_name: endpoint.name,
      prediction_url: predictionUrl,
      region: this.region,
      project_id: this.projectId,
      model_name: modelMetadata.name,
      model_version: modelMetadata.version,
      deployment_time: new Date().toISOString(),
      console_url: `https://console.cloud.google.com/vertex-ai/endpoints/detail/${this.region}/${endpointId}?project=${this.projectId}`,
    };
  }

  /**
   * Main deployment method
   */
  async deployModel(modelPath, force = false) {
    try {
      console.log(`🚀 Starting Vertex AI deployment for model at: ${modelPath}`);
      
      // Load model metadata
      const modelMetadata = await this.loadModelMetadata(modelPath);
      console.log(`📋 Loaded model metadata: ${modelMetadata.name} v${modelMetadata.version}`);
      
      // Upload model artifacts
      const artifactUri = await this.uploadModelArtifacts(modelPath, modelMetadata.name);
      
      // Create or update model
      const model = await this.createOrUpdateModel(modelMetadata, artifactUri);
      
      // Create or reuse endpoint
      const endpoint = await this.createOrReuseEndpoint(modelMetadata);
      
      // Deploy model to endpoint
      await this.deployModelToEndpoint(model, endpoint, modelMetadata);
      
      // Generate endpoint information
      const endpointInfo = this.generateEndpointInfo(endpoint, modelMetadata);
      
      // Save deployment results
      const resultsPath = path.join(process.cwd(), 'vertex-ai-deployment-results.json');
      await fs.writeFile(resultsPath, JSON.stringify(endpointInfo, null, 2));
      
      console.log(`\n✅ Deployment completed successfully!`);
      console.log(`📊 Endpoint Information:`);
      console.log(`   - Endpoint ID: ${endpointInfo.endpoint_id}`);
      console.log(`   - Prediction URL: ${endpointInfo.prediction_url}`);
      console.log(`   - Console URL: ${endpointInfo.console_url}`);
      console.log(`   - Results saved to: ${resultsPath}`);
      
      return endpointInfo;
      
    } catch (error) {
      console.error(`❌ Deployment failed: ${error.message}`);
      console.error(error.stack);
      process.exit(1);
    }
  }
}

// CLI handling
async function main() {
  const args = process.argv.slice(2);
  const modelPath = args[0] || path.join(process.cwd(), 'models', 'sample-model');
  const force = args.includes('--force');
  
  if (!await fs.access(modelPath).then(() => true).catch(() => false)) {
    console.error(`❌ Model path does not exist: ${modelPath}`);
    process.exit(1);
  }
  
  const deployer = new VertexAIDeployer();
  await deployer.deployModel(modelPath, force);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { VertexAIDeployer };