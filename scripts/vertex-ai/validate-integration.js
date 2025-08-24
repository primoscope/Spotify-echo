#!/usr/bin/env node

/**
 * Vertex AI Integration Validation Script
 * 
 * This script validates the Vertex AI integration setup without requiring
 * actual Google Cloud credentials.
 */

const fs = require('fs').promises;
const path = require('path');

class VertexAIValidator {
  async validateModelStructure(modelPath) {
    console.log(`🔍 Validating model structure: ${modelPath}`);
    
    // Check if directory exists
    try {
      const stats = await fs.stat(modelPath);
      if (!stats.isDirectory()) {
        throw new Error(`${modelPath} is not a directory`);
      }
    } catch (error) {
      throw new Error(`Model directory not found: ${modelPath}`);
    }
    
    // Check required files
    const requiredFiles = ['model_metadata.json'];
    const recommendedFiles = ['requirements.txt', 'model.pkl'];
    
    for (const file of requiredFiles) {
      const filePath = path.join(modelPath, file);
      try {
        await fs.access(filePath);
        console.log(`  ✅ Required file found: ${file}`);
      } catch (error) {
        throw new Error(`Required file missing: ${file}`);
      }
    }
    
    for (const file of recommendedFiles) {
      const filePath = path.join(modelPath, file);
      try {
        await fs.access(filePath);
        console.log(`  ✅ Recommended file found: ${file}`);
      } catch (error) {
        console.log(`  ⚠️  Recommended file missing: ${file}`);
      }
    }
    
    return true;
  }
  
  async validateModelMetadata(modelPath) {
    console.log(`🔍 Validating model metadata...`);
    
    const metadataPath = path.join(modelPath, 'model_metadata.json');
    let metadata;
    
    try {
      const content = await fs.readFile(metadataPath, 'utf8');
      metadata = JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to parse model_metadata.json: ${error.message}`);
    }
    
    // Required fields
    const requiredFields = ['name', 'version', 'description', 'type', 'framework'];
    for (const field of requiredFields) {
      if (!metadata[field]) {
        throw new Error(`Required field missing in metadata: ${field}`);
      }
      console.log(`  ✅ ${field}: ${metadata[field]}`);
    }
    
    // Validate vertex_ai configuration
    if (metadata.vertex_ai) {
      console.log(`  ✅ Vertex AI configuration found`);
      const vertexConfig = metadata.vertex_ai;
      
      if (vertexConfig.machine_type) {
        console.log(`    ✅ Machine type: ${vertexConfig.machine_type}`);
      }
      
      if (vertexConfig.min_replica_count !== undefined) {
        console.log(`    ✅ Min replicas: ${vertexConfig.min_replica_count}`);
      }
      
      if (vertexConfig.max_replica_count !== undefined) {
        console.log(`    ✅ Max replicas: ${vertexConfig.max_replica_count}`);
      }
    } else {
      console.log(`  ⚠️  Vertex AI configuration missing (will use defaults)`);
    }
    
    // Validate schemas
    if (metadata.input_schema) {
      console.log(`  ✅ Input schema defined`);
    } else {
      console.log(`  ⚠️  Input schema missing`);
    }
    
    if (metadata.output_schema) {
      console.log(`  ✅ Output schema defined`);
    } else {
      console.log(`  ⚠️  Output schema missing`);
    }
    
    return metadata;
  }
  
  async validateScripts() {
    console.log(`🔍 Validating Vertex AI scripts...`);
    
    const scriptsDir = path.join(process.cwd(), 'scripts', 'vertex-ai');
    const requiredScripts = [
      'deploy-model.js',
      'test-model.js', 
      'list-endpoints.js',
      'setup-vertex-ai.js'
    ];
    
    for (const script of requiredScripts) {
      const scriptPath = path.join(scriptsDir, script);
      try {
        await fs.access(scriptPath);
        console.log(`  ✅ Script found: ${script}`);
        
        // Check if script is executable
        const stats = await fs.stat(scriptPath);
        if (stats.mode & parseInt('111', 8)) {
          console.log(`    ✅ Script is executable`);
        }
      } catch (error) {
        throw new Error(`Required script missing: ${script}`);
      }
    }
    
    return true;
  }
  
  async validateWorkflow() {
    console.log(`🔍 Validating GitHub workflow...`);
    
    const workflowPath = path.join(process.cwd(), '.github', 'workflows', 'vertex-deploy.yml');
    
    try {
      await fs.access(workflowPath);
      console.log(`  ✅ Workflow file found: vertex-deploy.yml`);
      
      const content = await fs.readFile(workflowPath, 'utf8');
      
      // Check for required components
      const requiredComponents = [
        'name: 🤖 Vertex AI Model Deployment',
        'google-github-actions/auth@v2',
        '@google-cloud/aiplatform',
        'vertex:deploy',
        'vertex:test-model'
      ];
      
      for (const component of requiredComponents) {
        if (content.includes(component)) {
          console.log(`    ✅ Contains: ${component}`);
        } else {
          console.log(`    ⚠️  Missing: ${component}`);
        }
      }
      
    } catch (error) {
      throw new Error(`Workflow file not found: vertex-deploy.yml`);
    }
    
    return true;
  }
  
  async validatePackageDependencies() {
    console.log(`🔍 Validating package dependencies...`);
    
    const packagePath = path.join(process.cwd(), 'package.json');
    let packageJson;
    
    try {
      const content = await fs.readFile(packagePath, 'utf8');
      packageJson = JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to read package.json: ${error.message}`);
    }
    
    const requiredDeps = [
      '@google-cloud/aiplatform',
      '@google-cloud/storage'
    ];
    
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    for (const dep of requiredDeps) {
      if (deps[dep]) {
        console.log(`  ✅ Dependency found: ${dep}@${deps[dep]}`);
      } else {
        throw new Error(`Required dependency missing: ${dep}`);
      }
    }
    
    // Check for npm scripts
    const requiredScripts = [
      'vertex:deploy',
      'vertex:test-model',
      'vertex:list-endpoints',
      'vertex:setup'
    ];
    
    const scripts = packageJson.scripts || {};
    
    for (const script of requiredScripts) {
      if (scripts[script]) {
        console.log(`  ✅ NPM script found: ${script}`);
      } else {
        console.log(`  ⚠️  NPM script missing: ${script}`);
      }
    }
    
    return true;
  }
  
  async validateEnvironmentTemplate() {
    console.log(`🔍 Validating environment template...`);
    
    const envPath = path.join(process.cwd(), '.env.example');
    
    try {
      const content = await fs.readFile(envPath, 'utf8');
      
      const requiredVars = [
        'GOOGLE_CLOUD_PROJECT',
        'VERTEX_AI_REGION',
        'VERTEX_AI_STAGING_BUCKET'
      ];
      
      for (const envVar of requiredVars) {
        if (content.includes(envVar)) {
          console.log(`  ✅ Environment variable documented: ${envVar}`);
        } else {
          console.log(`  ⚠️  Environment variable missing: ${envVar}`);
        }
      }
      
    } catch (error) {
      console.log(`  ⚠️  .env.example file not found`);
    }
    
    return true;
  }
  
  async runValidation() {
    console.log(`🚀 Starting Vertex AI Integration Validation\n`);
    
    try {
      // Validate sample model
      await this.validateModelStructure('models/sample-model');
      await this.validateModelMetadata('models/sample-model');
      
      console.log('');
      
      // Validate scripts
      await this.validateScripts();
      
      console.log('');
      
      // Validate workflow
      await this.validateWorkflow();
      
      console.log('');
      
      // Validate dependencies
      await this.validatePackageDependencies();
      
      console.log('');
      
      // Validate environment
      await this.validateEnvironmentTemplate();
      
      console.log(`\n✅ Vertex AI integration validation completed successfully!`);
      console.log(`\n🎯 Next Steps:`);
      console.log(`   1. Set up Google Cloud project and authentication`);
      console.log(`   2. Configure repository secrets in GitHub`);
      console.log(`   3. Test deployment with: npm run vertex:deploy`);
      
      return true;
      
    } catch (error) {
      console.error(`\n❌ Validation failed: ${error.message}`);
      process.exit(1);
    }
  }
}

// CLI handling
async function main() {
  const validator = new VertexAIValidator();
  await validator.runValidation();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { VertexAIValidator };