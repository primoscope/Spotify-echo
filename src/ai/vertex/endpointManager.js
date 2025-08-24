/**
 * Vertex AI Endpoint Manager
 * Handles deployment, management, and monitoring of Vertex AI endpoints
 */

const { GoogleAuth } = require('google-auth-library');
const fs = require('fs').promises;
const path = require('path');
const {
  EndpointError,
  ConfigurationError,
  ValidationError,
  TransientError
} = require('../errors');

class VertexEndpointManager {
  constructor(options = {}) {
    this.projectId = options.projectId || process.env.GCP_PROJECT_ID;
    this.location = options.location || process.env.GCP_VERTEX_LOCATION || 'us-central1';
    this.registryPath = options.registryPath || process.env.VERTEX_REGISTRY_PATH || 'config/ai/vertex_registry.json';
    
    this.auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    
    this.endpoints = new Map(); // Cache of deployed endpoints
    this.deploymentStatus = new Map(); // Track deployment progress
    
    this.validateConfiguration();
  }

  /**
   * Validate required configuration
   */
  validateConfiguration() {
    if (!this.projectId) {
      throw new ConfigurationError(
        'GCP_PROJECT_ID is required for Vertex AI endpoint management',
        'GCP_PROJECT_ID'
      );
    }

    if (!this.location) {
      throw new ConfigurationError(
        'GCP_VERTEX_LOCATION is required for Vertex AI endpoint management',
        'GCP_VERTEX_LOCATION'
      );
    }
  }

  /**
   * Load model registry configuration
   */
  async loadRegistry() {
    try {
      const registryData = await fs.readFile(this.registryPath, 'utf8');
      return JSON.parse(registryData);
    } catch (error) {
      throw new ConfigurationError(
        `Failed to load Vertex AI registry from ${this.registryPath}: ${error.message}`,
        'VERTEX_REGISTRY_PATH'
      );
    }
  }

  /**
   * Get authenticated Vertex AI client
   */
  async getVertexClient() {
    const authClient = await this.auth.getClient();
    const projectPath = `projects/${this.projectId}/locations/${this.location}`;
    
    return {
      authClient,
      projectPath,
      endpointsPath: `${projectPath}/endpoints`,
      modelsPath: `${projectPath}/models`
    };
  }

  /**
   * Check if endpoint exists by display name and labels
   * @param {string} displayName - Endpoint display name
   * @param {Object} labels - Required labels
   * @returns {Object|null} Endpoint info or null if not found
   */
  async findEndpoint(displayName, labels = {}) {
    try {
      const { authClient, endpointsPath } = await this.getVertexClient();
      
      const response = await authClient.request({
        url: `https://aiplatform.googleapis.com/v1/${endpointsPath}`,
        method: 'GET'
      });

      const endpoints = response.data.endpoints || [];
      
      // Find endpoint by display name and labels
      for (const endpoint of endpoints) {
        if (endpoint.displayName === displayName) {
          const endpointLabels = endpoint.labels || {};
          const labelsMatch = Object.entries(labels).every(
            ([key, value]) => endpointLabels[key] === value
          );
          
          if (labelsMatch) {
            return {
              id: endpoint.name.split('/').pop(),
              name: endpoint.name,
              displayName: endpoint.displayName,
              labels: endpointLabels,
              createTime: endpoint.createTime,
              updateTime: endpoint.updateTime,
              state: endpoint.state || 'UNKNOWN'
            };
          }
        }
      }
      
      return null;
    } catch (error) {
      throw new EndpointError(
        `Failed to find endpoint ${displayName}: ${error.message}`,
        null,
        'FIND'
      );
    }
  }

  /**
   * Deploy model to endpoint (idempotent)
   * @param {string} endpointKey - Key from registry
   * @param {Object} options - Deployment options
   * @returns {Object} Deployment result
   */
  async deployEndpoint(endpointKey, options = {}) {
    const registry = await this.loadRegistry();
    const endpointConfig = registry.endpoints[endpointKey];
    
    if (!endpointConfig) {
      throw new ValidationError(
        `Endpoint configuration not found for key: ${endpointKey}`,
        'endpointKey',
        endpointKey
      );
    }

    const modelConfig = this.findModelConfig(registry, endpointConfig.modelId);
    if (!modelConfig) {
      throw new ValidationError(
        `Model configuration not found for: ${endpointConfig.modelId}`,
        'modelId',
        endpointConfig.modelId
      );
    }

    const displayName = `echotune-${endpointKey}`;
    const requiredLabels = {
      service: 'echotune',
      env: process.env.NODE_ENV || 'development',
      ...modelConfig.labels
    };

    // Check if endpoint already exists
    const existingEndpoint = await this.findEndpoint(displayName, requiredLabels);
    if (existingEndpoint && existingEndpoint.state !== 'FAILED') {
      return {
        action: 'EXISTS',
        endpoint: existingEndpoint,
        message: `Endpoint ${displayName} already exists`
      };
    }

    // Apply environment overrides
    const finalConfig = this.applyEnvironmentOverrides(registry, endpointConfig);
    
    // Deploy new endpoint
    return await this.createEndpoint(displayName, finalConfig, modelConfig, requiredLabels, options);
  }

  /**
   * Find model configuration in registry
   * @param {Object} registry - Full registry data
   * @param {string} modelId - Model ID to find
   * @returns {Object|null} Model configuration
   */
  findModelConfig(registry, modelId) {
    for (const category of Object.values(registry.models)) {
      for (const variant of Object.values(category)) {
        if (variant.modelId === modelId) {
          return variant;
        }
      }
    }
    return null;
  }

  /**
   * Apply environment-specific overrides
   * @param {Object} registry - Registry data
   * @param {Object} config - Base configuration
   * @returns {Object} Final configuration
   */
  applyEnvironmentOverrides(registry, config) {
    const env = process.env.NODE_ENV || 'development';
    const overrides = registry.environment_overrides?.[env] || {};
    
    return {
      ...config,
      ...overrides,
      // Allow individual env var overrides
      minReplicas: process.env.VERTEX_MIN_REPLICAS ? 
        parseInt(process.env.VERTEX_MIN_REPLICAS) : 
        (overrides.minReplicas ?? config.minReplicas),
      maxReplicas: process.env.VERTEX_MAX_REPLICAS ? 
        parseInt(process.env.VERTEX_MAX_REPLICAS) : 
        (overrides.maxReplicas ?? config.maxReplicas),
      machineType: process.env.VERTEX_MACHINE_TYPE || 
        overrides.machineType || 
        config.machineType
    };
  }

  /**
   * Create new endpoint
   * @param {string} displayName - Endpoint display name
   * @param {Object} config - Endpoint configuration
   * @param {Object} modelConfig - Model configuration
   * @param {Object} labels - Endpoint labels
   * @param {Object} options - Additional options
   * @returns {Object} Creation result
   */
  async createEndpoint(displayName, config, modelConfig, labels, options = {}) {
    try {
      const { authClient, endpointsPath, modelsPath } = await this.getVertexClient();
      
      // Create endpoint definition
      const endpointData = {
        displayName,
        labels,
        description: `EchoTune AI endpoint for ${modelConfig.description}`,
        deployedModels: [{
          model: `${modelsPath}/${config.modelId}`,
          displayName: `${displayName}-model`,
          dedicatedResources: {
            machineSpec: {
              machineType: config.machineType
            },
            minReplicaCount: config.minReplicas,
            maxReplicaCount: config.maxReplicas
          },
          enableAccessLogging: true,
          serviceAccount: process.env.GCP_SERVICE_ACCOUNT
        }]
      };

      // Track deployment
      this.deploymentStatus.set(displayName, {
        status: 'CREATING',
        startTime: new Date().toISOString(),
        config: endpointData
      });

      const response = await authClient.request({
        url: `https://aiplatform.googleapis.com/v1/${endpointsPath}`,
        method: 'POST',
        data: endpointData
      });

      const operation = response.data;
      
      // Wait for deployment if requested
      if (options.wait !== false) {
        return await this.waitForDeployment(operation, displayName, config.deploymentTimeout);
      }

      return {
        action: 'CREATING',
        operation: operation.name,
        operationId: operation.name.split('/').pop(),
        message: `Endpoint ${displayName} deployment started`
      };
      
    } catch (error) {
      this.deploymentStatus.delete(displayName);
      throw new EndpointError(
        `Failed to create endpoint ${displayName}: ${error.message}`,
        displayName,
        'CREATE'
      );
    }
  }

  /**
   * Wait for deployment operation to complete
   * @param {Object} operation - Long-running operation
   * @param {string} displayName - Endpoint display name
   * @param {number} timeoutMs - Timeout in milliseconds
   * @returns {Object} Final deployment result
   */
  async waitForDeployment(operation, displayName, timeoutMs = 1800000) {
    const startTime = Date.now();
    const operationName = operation.name;
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        const { authClient } = await this.getVertexClient();
        
        const response = await authClient.request({
          url: `https://aiplatform.googleapis.com/v1/${operationName}`,
          method: 'GET'
        });

        const opStatus = response.data;
        
        if (opStatus.done) {
          if (opStatus.error) {
            this.deploymentStatus.set(displayName, {
              status: 'FAILED',
              error: opStatus.error,
              endTime: new Date().toISOString()
            });
            
            throw new EndpointError(
              `Endpoint deployment failed: ${opStatus.error.message}`,
              displayName,
              'DEPLOY'
            );
          }

          // Success - get endpoint details
          const endpoint = opStatus.response;
          
          this.deploymentStatus.set(displayName, {
            status: 'DEPLOYED',
            endpoint,
            endTime: new Date().toISOString()
          });

          // Optional warm-up
          const warmupResult = await this.warmupEndpoint(endpoint, displayName);

          return {
            action: 'DEPLOYED',
            endpoint: {
              id: endpoint.name.split('/').pop(),
              name: endpoint.name,
              displayName: endpoint.displayName,
              state: 'ACTIVE'
            },
            warmup: warmupResult,
            message: `Endpoint ${displayName} deployed successfully`
          };
        }

        // Still deploying - wait before checking again
        await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds
        
      } catch (error) {
        if (error instanceof EndpointError) {
          throw error;
        }
        
        // Retry on transient errors
        console.warn(`Deployment check failed for ${displayName}, retrying:`, error.message);
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds
      }
    }

    // Timeout
    this.deploymentStatus.set(displayName, {
      status: 'TIMEOUT',
      endTime: new Date().toISOString()
    });
    
    throw new EndpointError(
      `Endpoint deployment timed out after ${timeoutMs}ms`,
      displayName,
      'DEPLOY_TIMEOUT'
    );
  }

  /**
   * Warm up endpoint with test inference
   * @param {Object} endpoint - Endpoint details
   * @param {string} displayName - Endpoint display name
   * @returns {Object} Warmup result
   */
  async warmupEndpoint(endpoint, displayName) {
    try {
      const { authClient } = await this.getVertexClient();
      
      // Simple test request
      const testRequest = {
        instances: [{
          prompt: "Hello, this is a test."
        }],
        parameters: {
          temperature: 0.1,
          maxOutputTokens: 10
        }
      };

      const response = await authClient.request({
        url: `https://aiplatform.googleapis.com/v1/${endpoint.name}:predict`,
        method: 'POST',
        data: testRequest,
        timeout: 30000
      });

      return {
        success: true,
        latency: response.data.metadata?.latency || 'unknown',
        message: 'Endpoint warmed up successfully'
      };
      
    } catch (error) {
      console.warn(`Endpoint warmup failed for ${displayName}:`, error.message);
      return {
        success: false,
        error: error.message,
        message: 'Endpoint warmup failed but deployment is complete'
      };
    }
  }

  /**
   * Get deployment status
   * @param {string} displayName - Endpoint display name
   * @returns {Object} Status information
   */
  getDeploymentStatus(displayName) {
    return this.deploymentStatus.get(displayName) || {
      status: 'UNKNOWN',
      message: 'No deployment status found'
    };
  }

  /**
   * List all EchoTune endpoints
   * @returns {Array} List of endpoints
   */
  async listEndpoints() {
    try {
      const { authClient, endpointsPath } = await this.getVertexClient();
      
      const response = await authClient.request({
        url: `https://aiplatform.googleapis.com/v1/${endpointsPath}`,
        method: 'GET'
      });

      const endpoints = response.data.endpoints || [];
      
      // Filter for EchoTune endpoints
      return endpoints
        .filter(endpoint => 
          endpoint.labels?.service === 'echotune' ||
          endpoint.displayName?.startsWith('echotune-')
        )
        .map(endpoint => ({
          id: endpoint.name.split('/').pop(),
          name: endpoint.name,
          displayName: endpoint.displayName,
          labels: endpoint.labels || {},
          createTime: endpoint.createTime,
          updateTime: endpoint.updateTime,
          state: endpoint.state || 'UNKNOWN',
          deployedModels: endpoint.deployedModels || []
        }));
        
    } catch (error) {
      throw new EndpointError(
        `Failed to list endpoints: ${error.message}`,
        null,
        'LIST'
      );
    }
  }

  /**
   * Delete endpoint
   * @param {string} endpointId - Endpoint ID or display name
   * @returns {Object} Deletion result
   */
  async deleteEndpoint(endpointId) {
    try {
      const { authClient, endpointsPath } = await this.getVertexClient();
      
      // If it's a display name, find the actual endpoint
      let endpointName;
      if (!endpointId.includes('/')) {
        const endpoint = await this.findEndpoint(endpointId);
        if (!endpoint) {
          throw new ValidationError(
            `Endpoint not found: ${endpointId}`,
            'endpointId',
            endpointId
          );
        }
        endpointName = endpoint.name;
      } else {
        endpointName = endpointId;
      }

      const response = await authClient.request({
        url: `https://aiplatform.googleapis.com/v1/${endpointName}`,
        method: 'DELETE'
      });

      return {
        action: 'DELETING',
        operation: response.data.name,
        message: `Endpoint deletion started`
      };
      
    } catch (error) {
      throw new EndpointError(
        `Failed to delete endpoint ${endpointId}: ${error.message}`,
        endpointId,
        'DELETE'
      );
    }
  }
}

module.exports = VertexEndpointManager;