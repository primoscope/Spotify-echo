#!/usr/bin/env node

/**
 * Vertex AI Endpoint Listing Script
 * 
 * This script lists all Vertex AI endpoints in the project and region.
 * 
 * Usage:
 *   node scripts/vertex-ai/list-endpoints.js
 */

const { aiplatform } = require('@google-cloud/aiplatform');

class VertexAIEndpointLister {
  constructor() {
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT;
    this.region = process.env.VERTEX_AI_REGION || 'us-central1';
    
    if (!this.projectId) {
      throw new Error('GOOGLE_CLOUD_PROJECT environment variable is required');
    }

    this.endpointServiceClient = new aiplatform.v1.EndpointServiceClient({
      apiEndpoint: `${this.region}-aiplatform.googleapis.com`,
    });
  }

  /**
   * List all endpoints in the project and region
   */
  async listEndpoints() {
    try {
      console.log(`📋 Listing Vertex AI endpoints in ${this.projectId}/${this.region}...`);
      
      const parent = `projects/${this.projectId}/locations/${this.region}`;
      const [endpoints] = await this.endpointServiceClient.listEndpoints({ parent });
      
      if (endpoints.length === 0) {
        console.log(`📭 No endpoints found in ${this.region}`);
        return [];
      }
      
      console.log(`\n🔗 Found ${endpoints.length} endpoint(s):\n`);
      
      const endpointInfo = [];
      
      for (const endpoint of endpoints) {
        const endpointId = endpoint.name.split('/').pop();
        const predictionUrl = `https://${this.region}-aiplatform.googleapis.com/v1/${endpoint.name}:predict`;
        const consoleUrl = `https://console.cloud.google.com/vertex-ai/endpoints/detail/${this.region}/${endpointId}?project=${this.projectId}`;
        
        const info = {
          name: endpoint.displayName,
          id: endpointId,
          fullName: endpoint.name,
          predictionUrl,
          consoleUrl,
          createTime: endpoint.createTime,
          updateTime: endpoint.updateTime,
          labels: endpoint.labels || {},
          deployedModels: endpoint.deployedModels?.length || 0,
        };
        
        endpointInfo.push(info);
        
        console.log(`🔗 ${endpoint.displayName}`);
        console.log(`   ID: ${endpointId}`);
        console.log(`   Prediction URL: ${predictionUrl}`);
        console.log(`   Console URL: ${consoleUrl}`);
        console.log(`   Deployed Models: ${info.deployedModels}`);
        console.log(`   Created: ${endpoint.createTime?.seconds ? new Date(endpoint.createTime.seconds * 1000).toISOString() : 'Unknown'}`);
        
        if (endpoint.deployedModels && endpoint.deployedModels.length > 0) {
          console.log(`   📦 Deployed Models:`);
          for (const deployedModel of endpoint.deployedModels) {
            console.log(`      - ${deployedModel.displayName} (${deployedModel.id})`);
            console.log(`        Model: ${deployedModel.model}`);
            console.log(`        Traffic: ${JSON.stringify(deployedModel.trafficSplit || {})}`);
          }
        }
        console.log('');
      }
      
      return endpointInfo;
      
    } catch (error) {
      console.error(`❌ Failed to list endpoints: ${error.message}`);
      console.error(error.stack);
      process.exit(1);
    }
  }
}

// CLI handling
async function main() {
  const lister = new VertexAIEndpointLister();
  await lister.listEndpoints();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { VertexAIEndpointLister };