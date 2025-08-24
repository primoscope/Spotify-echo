#!/usr/bin/env node
/**
 * Vertex AI Deployment Script
 * Handles idempotent deployment of all configured Vertex AI endpoints
 */

const VertexEndpointManager = require('./endpointManager');
const path = require('path');
const fs = require('fs').promises;

class VertexDeploymentScript {
  constructor(options = {}) {
    this.manager = new VertexEndpointManager(options);
    this.verbose = options.verbose || false;
    this.dryRun = options.dryRun || false;
    this.force = options.force || false;
  }

  /**
   * Deploy all endpoints from registry
   */
  async deployAll() {
    try {
      this.log('🚀 Starting Vertex AI endpoint deployment...');
      
      const registry = await this.manager.loadRegistry();
      const endpoints = Object.keys(registry.endpoints);
      
      this.log(`📋 Found ${endpoints.length} endpoints to deploy:`);
      endpoints.forEach(key => this.log(`   - ${key}`));
      
      if (this.dryRun) {
        this.log('🔍 DRY RUN MODE - No actual deployments will be performed');
        return await this.dryRunAnalysis(registry, endpoints);
      }

      const results = [];
      
      for (const endpointKey of endpoints) {
        this.log(`\n📦 Deploying endpoint: ${endpointKey}`);
        
        try {
          const result = await this.manager.deployEndpoint(endpointKey, {
            wait: true // Wait for deployment to complete
          });
          
          results.push({
            endpointKey,
            success: true,
            result
          });
          
          this.log(`✅ ${endpointKey}: ${result.action} - ${result.message}`);
          
          if (result.warmup) {
            this.log(`🔥 Warmup: ${result.warmup.success ? '✅' : '❌'} ${result.warmup.message}`);
          }
          
        } catch (error) {
          results.push({
            endpointKey,
            success: false,
            error: error.message,
            code: error.code
          });
          
          this.log(`❌ ${endpointKey}: Failed - ${error.message}`);
          
          if (!this.force) {
            throw error; // Stop on first failure unless force mode
          }
        }
      }

      // Summary
      this.log('\n📊 Deployment Summary:');
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      this.log(`   ✅ Successful: ${successful}`);
      this.log(`   ❌ Failed: ${failed}`);
      
      if (failed > 0 && !this.force) {
        throw new Error(`${failed} endpoint(s) failed to deploy`);
      }

      // Save deployment report
      await this.saveDeploymentReport(results);
      
      return results;
      
    } catch (error) {
      this.log(`💥 Deployment failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Perform dry run analysis
   */
  async dryRunAnalysis(registry, endpoints) {
    const analysis = [];
    
    for (const endpointKey of endpoints) {
      const endpointConfig = registry.endpoints[endpointKey];
      const modelConfig = this.manager.findModelConfig(registry, endpointConfig.modelId);
      const finalConfig = this.manager.applyEnvironmentOverrides(registry, endpointConfig);
      
      const displayName = `echotune-${endpointKey}`;
      const requiredLabels = {
        service: 'echotune',
        env: process.env.NODE_ENV || 'development',
        ...modelConfig.labels
      };

      // Check if endpoint exists
      let existingEndpoint = null;
      try {
        existingEndpoint = await this.manager.findEndpoint(displayName, requiredLabels);
      } catch (error) {
        this.log(`⚠️  Could not check existing endpoint ${displayName}: ${error.message}`);
      }

      analysis.push({
        endpointKey,
        displayName,
        modelId: endpointConfig.modelId,
        finalConfig,
        existingEndpoint: existingEndpoint ? {
          id: existingEndpoint.id,
          state: existingEndpoint.state
        } : null,
        action: existingEndpoint ? 'EXISTS' : 'CREATE'
      });

      this.log(`🔍 ${endpointKey}:`);
      this.log(`   Model: ${endpointConfig.modelId}`);
      this.log(`   Machine: ${finalConfig.machineType}`);
      this.log(`   Replicas: ${finalConfig.minReplicas}-${finalConfig.maxReplicas}`);
      this.log(`   Action: ${existingEndpoint ? 'EXISTS' : 'CREATE'}`);
      
      if (existingEndpoint) {
        this.log(`   Existing: ${existingEndpoint.id} (${existingEndpoint.state})`);
      }
    }

    return analysis;
  }

  /**
   * Deploy specific endpoint
   */
  async deployEndpoint(endpointKey) {
    this.log(`🚀 Deploying specific endpoint: ${endpointKey}`);
    
    if (this.dryRun) {
      const registry = await this.manager.loadRegistry();
      return await this.dryRunAnalysis(registry, [endpointKey]);
    }

    const result = await this.manager.deployEndpoint(endpointKey, {
      wait: true
    });
    
    this.log(`✅ ${endpointKey}: ${result.action} - ${result.message}`);
    return result;
  }

  /**
   * List all endpoints
   */
  async listEndpoints() {
    this.log('📋 Listing Vertex AI endpoints...');
    
    const endpoints = await this.manager.listEndpoints();
    
    if (endpoints.length === 0) {
      this.log('   No EchoTune endpoints found');
      return endpoints;
    }

    this.log(`   Found ${endpoints.length} endpoint(s):`);
    
    endpoints.forEach(endpoint => {
      this.log(`   📦 ${endpoint.displayName}`);
      this.log(`      ID: ${endpoint.id}`);
      this.log(`      State: ${endpoint.state}`);
      this.log(`      Created: ${endpoint.createTime}`);
      this.log(`      Models: ${endpoint.deployedModels.length}`);
      
      if (this.verbose) {
        this.log(`      Labels: ${JSON.stringify(endpoint.labels, null, 2)}`);
      }
    });

    return endpoints;
  }

  /**
   * Delete endpoint
   */
  async deleteEndpoint(endpointId) {
    this.log(`🗑️  Deleting endpoint: ${endpointId}`);
    
    if (this.dryRun) {
      this.log('🔍 DRY RUN MODE - No actual deletion will be performed');
      return { dryRun: true, endpointId };
    }

    const result = await this.manager.deleteEndpoint(endpointId);
    this.log(`✅ ${result.message}`);
    
    return result;
  }

  /**
   * Get deployment status
   */
  async getStatus(endpointName = null) {
    if (endpointName) {
      const status = this.manager.getDeploymentStatus(endpointName);
      this.log(`📊 Status for ${endpointName}:`);
      this.log(`   ${JSON.stringify(status, null, 2)}`);
      return status;
    }

    // Get status for all endpoints
    const registry = await this.manager.loadRegistry();
    const endpoints = Object.keys(registry.endpoints);
    
    const statuses = {};
    for (const endpointKey of endpoints) {
      const displayName = `echotune-${endpointKey}`;
      statuses[endpointKey] = this.manager.getDeploymentStatus(displayName);
    }

    this.log('📊 All endpoint statuses:');
    this.log(JSON.stringify(statuses, null, 2));
    
    return statuses;
  }

  /**
   * Save deployment report
   */
  async saveDeploymentReport(results) {
    const reportDir = 'reports/ai_deployments';
    const reportFile = `${reportDir}/deployment_${new Date().toISOString().split('T')[0]}.json`;
    
    try {
      await fs.mkdir(reportDir, { recursive: true });
      
      const report = {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        projectId: process.env.GCP_PROJECT_ID,
        location: process.env.GCP_VERTEX_LOCATION,
        results,
        summary: {
          total: results.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        }
      };
      
      await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
      this.log(`📄 Deployment report saved: ${reportFile}`);
      
    } catch (error) {
      this.log(`⚠️  Could not save deployment report: ${error.message}`);
    }
  }

  /**
   * Log message if verbose or always for important messages
   */
  log(message) {
    console.log(message);
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'deploy';
  
  const options = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    dryRun: args.includes('--dry-run') || args.includes('-n'),
    force: args.includes('--force') || args.includes('-f')
  };

  const script = new VertexDeploymentScript(options);

  try {
    switch (command) {
      case 'deploy':
        const endpointKey = args.find(arg => !arg.startsWith('--') && arg !== 'deploy');
        if (endpointKey) {
          await script.deployEndpoint(endpointKey);
        } else {
          await script.deployAll();
        }
        break;

      case 'list':
        await script.listEndpoints();
        break;

      case 'delete':
        const endpointId = args.find(arg => !arg.startsWith('--') && arg !== 'delete');
        if (!endpointId) {
          throw new Error('Endpoint ID required for delete command');
        }
        await script.deleteEndpoint(endpointId);
        break;

      case 'status':
        const statusEndpoint = args.find(arg => !arg.startsWith('--') && arg !== 'status');
        await script.getStatus(statusEndpoint);
        break;

      case 'help':
      default:
        console.log(`
Vertex AI Deployment Script

Usage:
  node deploymentScript.js [command] [options]

Commands:
  deploy [endpoint-key]  Deploy all endpoints or specific endpoint
  list                   List all deployed endpoints
  delete <endpoint-id>   Delete specific endpoint
  status [endpoint]      Get deployment status
  help                   Show this help

Options:
  --verbose, -v          Verbose output
  --dry-run, -n          Perform dry run without actual deployment
  --force, -f            Continue deployment even if some endpoints fail

Examples:
  node deploymentScript.js deploy --dry-run
  node deploymentScript.js deploy text-generation-primary
  node deploymentScript.js list --verbose
  node deploymentScript.js delete echotune-embeddings-primary
        `);
        break;
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error(`❌ Command failed: ${error.message}`);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = VertexDeploymentScript;