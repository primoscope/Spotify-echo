#!/usr/bin/env node

/**
 * Vertex AI Verification Script
 * 
 * This script verifies that Vertex AI credentials are properly configured
 * and performs a lightweight test to confirm real access. On success,
 * it toggles AI_MOCK_MODE=false to enable real Vertex AI responses.
 * 
 * Usage:
 *   node scripts/vertex/verify-vertex.js
 * 
 * Environment Variables:
 *   GCP_PROJECT_ID     - Google Cloud Project ID (required)
 *   GCP_VERTEX_LOCATION - Vertex AI location (default: us-central1)
 *   AI_MOCK_MODE       - Current mock mode status
 * 
 * Exit Codes:
 *   0 - Success: Vertex AI is accessible and configured
 *   1 - Failure: Configuration error or access denied
 *   2 - Missing dependencies or environment setup
 */

const fs = require('fs').promises;
const path = require('path');

class VertexVerifier {
  constructor() {
    this.projectId = process.env.GCP_PROJECT_ID;
    this.location = process.env.GCP_VERTEX_LOCATION || 'us-central1';
    this.mockMode = process.env.AI_MOCK_MODE === 'true';
    this.envPath = path.join(__dirname, '../../.env');
  }

  /**
   * Main verification process
   */
  async verify() {
    try {
      console.log('🔍 Verifying Vertex AI Configuration...\n');
      
      // Step 1: Validate environment
      await this.validateEnvironment();
      
      // Step 2: Check authentication
      await this.checkAuthentication();
      
      // Step 3: Test Vertex AI access
      const vertexResult = await this.testVertexAI();
      
      // Step 4: Update configuration on success
      if (vertexResult.success) {
        await this.updateMockMode(false);
        console.log('\n✅ Vertex AI verification successful!');
        console.log('🎉 Mock mode disabled - application will now use real Vertex AI');
        
        // Output structured JSON for automation
        const result = {
          vertexConfigured: true,
          projectId: this.projectId,
          location: this.location,
          mockMode: false,
          testModel: vertexResult.model,
          preview: vertexResult.preview
        };
        console.log('\n📊 Verification Result:');
        console.log(JSON.stringify(result, null, 2));
        return true;
      } else {
        throw new Error(vertexResult.error || 'Vertex AI test failed');
      }
      
    } catch (error) {
      console.error('❌ Vertex AI verification failed:', error.message);
      
      // Output structured JSON for automation
      const result = {
        vertexConfigured: false,
        projectId: this.projectId || 'not-set',
        mockMode: true,
        error: error.message,
        suggestion: this.getSuggestion(error.message)
      };
      console.log('\n📊 Verification Result:');
      console.log(JSON.stringify(result, null, 2));
      return false;
    }
  }

  /**
   * Validate environment configuration
   */
  async validateEnvironment() {
    console.log('1. Validating environment configuration...');
    
    if (!this.projectId) {
      throw new Error('GCP_PROJECT_ID environment variable is required');
    }
    
    console.log(`   Project ID: ${this.projectId}`);
    console.log(`   Location: ${this.location}`);
    console.log(`   Current Mock Mode: ${this.mockMode ? 'Enabled' : 'Disabled'}`);
    console.log('   ✅ Environment validation passed');
  }

  /**
   * Check GCP authentication status
   */
  async checkAuthentication() {
    console.log('2. Checking GCP authentication...');
    
    try {
      const { execSync } = require('child_process');
      
      // Check if gcloud is available
      try {
        execSync('gcloud version', { stdio: 'pipe' });
      } catch (error) {
        throw new Error('Google Cloud CLI not found. Please install gcloud SDK');
      }
      
      // Check authentication status
      const authResult = execSync('gcloud auth list --filter=status:ACTIVE --format="value(account)"', { 
        encoding: 'utf8', 
        stdio: 'pipe' 
      });
      
      if (!authResult.trim()) {
        throw new Error('No active gcloud authentication. Please run: gcloud auth application-default login');
      }
      
      console.log(`   Authenticated as: ${authResult.trim()}`);
      
      // Check project access
      const projectResult = execSync(`gcloud projects describe ${this.projectId} --format="value(projectId)"`, {
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      if (!projectResult.trim()) {
        throw new Error(`Cannot access project: ${this.projectId}`);
      }
      
      console.log('   ✅ Authentication check passed');
      
    } catch (error) {
      if (error.message.includes('gcloud')) {
        throw error;
      }
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Test Vertex AI access with a lightweight operation
   */
  async testVertexAI() {
    console.log('3. Testing Vertex AI access...');
    
    try {
      // Try using the Vertex AI SDK
      let vertexResult = await this.testWithVertexSDK();
      if (vertexResult.success) {
        console.log('   ✅ Vertex AI SDK test passed');
        return vertexResult;
      }
      
      // Fallback to gcloud command
      console.log('   Falling back to gcloud command test...');
      vertexResult = await this.testWithGcloud();
      if (vertexResult.success) {
        console.log('   ✅ Vertex AI gcloud test passed');
        return vertexResult;
      }
      
      throw new Error('Both SDK and gcloud tests failed');
      
    } catch (error) {
      console.log('   ❌ Vertex AI test failed');
      throw new Error(`Vertex AI access test failed: ${error.message}`);
    }
  }

  /**
   * Test with Vertex AI SDK
   */
  async testWithVertexSDK() {
    try {
      const { VertexAI } = require('@google-cloud/vertexai');
      
      const vertex = new VertexAI({ 
        project: this.projectId,
        location: this.location 
      });
      
      // Try to get a simple generative model and make a minimal request
      const model = vertex.getGenerativeModel({ 
        model: 'gemini-1.5-flash' 
      });
      
      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: 'ping' }]
        }]
      });
      
      const response = result.response;
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      return {
        success: true,
        model: 'gemini-1.5-flash',
        preview: text.slice(0, 80),
        method: 'vertex-sdk'
      };
      
    } catch (error) {
      // If SDK is not available or fails, that's OK - we'll try gcloud
      return {
        success: false,
        error: error.message,
        method: 'vertex-sdk'
      };
    }
  }

  /**
   * Test with gcloud command (fallback)
   */
  async testWithGcloud() {
    try {
      const { execSync } = require('child_process');
      
      // Test by listing models (read-only operation)
      const modelsResult = execSync(
        `gcloud ai models list --region=${this.location} --limit=1 --format="value(name)" --project=${this.projectId}`,
        { encoding: 'utf8', stdio: 'pipe', timeout: 30000 }
      );
      
      if (modelsResult.trim()) {
        return {
          success: true,
          model: 'gcloud-models-list',
          preview: 'Models list accessible',
          method: 'gcloud'
        };
      }
      
      // If no models but no error, API is accessible
      return {
        success: true,
        model: 'vertex-api-accessible',
        preview: 'Vertex AI API is accessible',
        method: 'gcloud'
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        method: 'gcloud'
      };
    }
  }

  /**
   * Update mock mode in environment file
   */
  async updateMockMode(enableMockMode) {
    try {
      let envContent = '';
      
      // Read existing .env file
      try {
        envContent = await fs.readFile(this.envPath, 'utf8');
      } catch (error) {
        // If .env doesn't exist, create minimal content
        envContent = '# EchoTune AI - Environment Configuration\n\n';
      }
      
      const mockModeValue = enableMockMode ? 'true' : 'false';
      const regex = /^AI_MOCK_MODE=.*$/m;
      const newLine = `AI_MOCK_MODE=${mockModeValue}`;
      
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, newLine);
      } else {
        // Add to the end or to GCP section
        if (envContent.includes('# GOOGLE CLOUD / VERTEX AI')) {
          const gcpSectionRegex = /(# GOOGLE CLOUD \/ VERTEX AI[^\n]*\n)/;
          envContent = envContent.replace(gcpSectionRegex, `$1${newLine}\n`);
        } else {
          envContent += `\n# AI Configuration\n${newLine}\n`;
        }
      }
      
      await fs.writeFile(this.envPath, envContent);
      console.log(`   ✅ Updated AI_MOCK_MODE=${mockModeValue} in .env file`);
      
    } catch (error) {
      console.warn(`   ⚠️ Could not update .env file: ${error.message}`);
      console.log(`   💡 Please manually set AI_MOCK_MODE=${enableMockMode ? 'true' : 'false'} in your .env file`);
    }
  }

  /**
   * Get suggestion based on error type
   */
  getSuggestion(errorMessage) {
    const error = errorMessage.toLowerCase();
    
    if (error.includes('gcp_project_id')) {
      return 'Set GCP_PROJECT_ID environment variable in your .env file';
    }
    
    if (error.includes('gcloud') && error.includes('not found')) {
      return 'Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install';
    }
    
    if (error.includes('authentication') || error.includes('auth')) {
      return 'Run: gcloud auth application-default login';
    }
    
    if (error.includes('permission') || error.includes('access')) {
      return 'Ensure your account has Vertex AI permissions or run the bootstrap setup';
    }
    
    if (error.includes('api') && error.includes('enabled')) {
      return 'Enable Vertex AI API: gcloud services enable aiplatform.googleapis.com';
    }
    
    return 'Run the GCP setup script: node scripts/configure-gcp-credentials.js setup';
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'help' || command === '--help') {
    console.log('Vertex AI Verification Script');
    console.log('');
    console.log('Usage: node scripts/vertex/verify-vertex.js [command]');
    console.log('');
    console.log('Commands:');
    console.log('  verify    Verify Vertex AI configuration (default)');
    console.log('  status    Show current configuration status');
    console.log('  help      Show this help message');
    return;
  }
  
  const verifier = new VertexVerifier();
  
  try {
    if (command === 'status') {
      console.log('📊 Current Vertex AI Configuration Status:');
      console.log(`Project ID: ${verifier.projectId || 'Not set'}`);
      console.log(`Location: ${verifier.location}`);
      console.log(`Mock Mode: ${verifier.mockMode ? 'Enabled' : 'Disabled'}`);
      return;
    }
    
    // Default: verify
    const success = await verifier.verify();
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Script error:', error.message);
    process.exit(2);
  }
}

// Export for testing
module.exports = VertexVerifier;

// Run CLI if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(2);
  });
}