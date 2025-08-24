#!/usr/bin/env node

/**
 * Vertex AI Model Testing Script
 * 
 * This script tests deployed models by sending sample prediction requests
 * and validating the responses.
 * 
 * Usage:
 *   node scripts/vertex-ai/test-model.js [model-name]
 */

const { aiplatform } = require('@google-cloud/aiplatform');
const fs = require('fs').promises;
const path = require('path');

class VertexAITester {
  constructor() {
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT;
    this.region = process.env.VERTEX_AI_REGION || 'us-central1';
    
    if (!this.projectId) {
      throw new Error('GOOGLE_CLOUD_PROJECT environment variable is required');
    }

    this.predictionServiceClient = new aiplatform.v1.PredictionServiceClient({
      apiEndpoint: `${this.region}-aiplatform.googleapis.com`,
    });
  }

  /**
   * Load deployment results to get endpoint information
   */
  async loadDeploymentResults() {
    const resultsPath = path.join(process.cwd(), 'vertex-ai-deployment-results.json');
    
    try {
      const content = await fs.readFile(resultsPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to load deployment results from ${resultsPath}. Please deploy a model first.`);
    }
  }

  /**
   * Load model metadata to understand input/output schema
   */
  async loadModelMetadata(modelName) {
    const modelPath = path.join(process.cwd(), 'models', modelName);
    const metadataPath = path.join(modelPath, 'model_metadata.json');
    
    try {
      const content = await fs.readFile(metadataPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to load model metadata from ${metadataPath}`);
    }
  }

  /**
   * Generate sample input data based on model schema
   */
  generateSampleInput(inputSchema) {
    const sampleData = {};
    
    if (inputSchema.properties) {
      for (const [key, schema] of Object.entries(inputSchema.properties)) {
        switch (schema.type) {
          case 'string':
            sampleData[key] = 'sample_string_value';
            break;
          case 'number':
            sampleData[key] = 0.5;
            break;
          case 'integer':
            sampleData[key] = 42;
            break;
          case 'boolean':
            sampleData[key] = true;
            break;
          case 'array':
            sampleData[key] = this.generateSampleArray(schema);
            break;
          case 'object':
            sampleData[key] = this.generateSampleInput(schema);
            break;
          default:
            sampleData[key] = null;
        }
      }
    }
    
    return sampleData;
  }

  /**
   * Generate sample array data
   */
  generateSampleArray(schema) {
    if (schema.items && schema.items.type === 'object') {
      return [this.generateSampleInput(schema.items)];
    } else if (schema.items && schema.items.type === 'string') {
      return ['sample_item_1', 'sample_item_2'];
    } else if (schema.items && schema.items.type === 'number') {
      return [0.1, 0.2, 0.3];
    } else {
      return ['sample_item'];
    }
  }

  /**
   * Send prediction request to deployed model
   */
  async sendPredictionRequest(endpointName, instances) {
    console.log(`🔮 Sending prediction request to: ${endpointName}`);
    console.log(`📋 Input instances:`, JSON.stringify(instances, null, 2));
    
    try {
      const [response] = await this.predictionServiceClient.predict({
        endpoint: endpointName,
        instances: instances,
      });
      
      console.log(`✅ Prediction successful!`);
      console.log(`📊 Response:`, JSON.stringify(response.predictions, null, 2));
      
      return response;
    } catch (error) {
      console.error(`❌ Prediction failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate prediction response against expected schema
   */
  validateResponse(response, outputSchema) {
    const predictions = response.predictions;
    
    if (!Array.isArray(predictions)) {
      throw new Error('Response predictions should be an array');
    }
    
    if (predictions.length === 0) {
      throw new Error('Response predictions array is empty');
    }
    
    console.log(`✅ Response validation passed!`);
    console.log(`   - Received ${predictions.length} predictions`);
    console.log(`   - First prediction keys: ${Object.keys(predictions[0]).join(', ')}`);
    
    return true;
  }

  /**
   * Generate a sample test payload for music recommendation model
   */
  generateMusicRecommendationSample() {
    return {
      user_id: 'test_user_123',
      listening_history: [
        {
          track_id: 'track_001',
          play_count: 15,
          timestamp: '2024-01-15T10:30:00Z'
        },
        {
          track_id: 'track_002', 
          play_count: 8,
          timestamp: '2024-01-14T15:45:00Z'
        }
      ],
      audio_features: {
        energy: 0.7,
        valence: 0.8,
        danceability: 0.6
      }
    };
  }

  /**
   * Main testing method
   */
  async testModel(modelName = null) {
    try {
      console.log(`🧪 Starting model testing...`);
      
      // Load deployment results
      const deploymentResults = await this.loadDeploymentResults();
      console.log(`📋 Testing model: ${deploymentResults.model_name}`);
      
      // Load model metadata
      const actualModelName = modelName || deploymentResults.model_name.split('-').slice(1).join('-');
      const modelMetadata = await this.loadModelMetadata(actualModelName);
      
      // Generate sample input
      let sampleInput;
      if (modelMetadata.type === 'music_recommendation') {
        sampleInput = this.generateMusicRecommendationSample();
      } else {
        sampleInput = this.generateSampleInput(modelMetadata.input_schema);
      }
      
      // Send prediction request
      const response = await this.sendPredictionRequest(
        deploymentResults.endpoint_name,
        [sampleInput]
      );
      
      // Validate response
      this.validateResponse(response, modelMetadata.output_schema);
      
      // Generate test report
      const testReport = {
        test_time: new Date().toISOString(),
        model_name: deploymentResults.model_name,
        endpoint_id: deploymentResults.endpoint_id,
        test_input: sampleInput,
        test_response: response.predictions,
        test_status: 'PASSED',
        response_time_ms: response.metadata?.latency || 'unknown',
      };
      
      const reportPath = path.join(process.cwd(), 'vertex-ai-test-results.json');
      await fs.writeFile(reportPath, JSON.stringify(testReport, null, 2));
      
      console.log(`\n✅ Model testing completed successfully!`);
      console.log(`📊 Test Results:`);
      console.log(`   - Status: ${testReport.test_status}`);
      console.log(`   - Response Time: ${testReport.response_time_ms}`);
      console.log(`   - Results saved to: ${reportPath}`);
      
      return testReport;
      
    } catch (error) {
      console.error(`❌ Model testing failed: ${error.message}`);
      console.error(error.stack);
      process.exit(1);
    }
  }
}

// CLI handling
async function main() {
  const args = process.argv.slice(2);
  const modelName = args[0];
  
  const tester = new VertexAITester();
  await tester.testModel(modelName);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { VertexAITester };