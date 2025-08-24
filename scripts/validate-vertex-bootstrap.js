#!/usr/bin/env node

/**
 * Vertex AI Bootstrap Validation Script
 * 
 * Simple validation script to check if the bootstrap implementation is correct
 */

const fs = require('fs');
const path = require('path');

function validateVertexBootstrap() {
  console.log('🔍 Validating Vertex AI Bootstrap Implementation...');
  let errors = 0;

  // Check workflow file
  const workflowPath = path.join(__dirname, '../.github/workflows/vertex-bootstrap.yml');
  if (!fs.existsSync(workflowPath)) {
    console.error('❌ Workflow file missing: vertex-bootstrap.yml');
    errors++;
  } else {
    console.log('✅ Workflow file exists');
    
    const workflowContent = fs.readFileSync(workflowPath, 'utf8');
    
    // Check essential workflow components
    const checks = [
      { test: workflowContent.includes('name: Vertex AI Bootstrap - One-Click GCP Setup'), msg: 'Workflow name' },
      { test: workflowContent.includes('workflow_dispatch:'), msg: 'Manual trigger' },
      { test: workflowContent.includes('GCP_BOOTSTRAP_SA_KEY'), msg: 'Bootstrap key environment variable' },
      { test: workflowContent.includes('validate-prerequisites:'), msg: 'Prerequisites validation job' },
      { test: workflowContent.includes('setup-apis:'), msg: 'API setup job' },
      { test: workflowContent.includes('setup-service-account:'), msg: 'Service account setup job' },
      { test: workflowContent.includes('setup-workload-identity:'), msg: 'Workload identity setup job' },
      { test: workflowContent.includes('setup-storage:'), msg: 'Storage setup job' },
      { test: workflowContent.includes('generate-outputs:'), msg: 'Output generation job' },
      { test: workflowContent.includes('dry_run:'), msg: 'Dry run input' },
      { test: workflowContent.includes('force_recreate:'), msg: 'Force recreate input' },
      { test: workflowContent.includes('aiplatform.googleapis.com'), msg: 'Vertex AI API' },
      { test: workflowContent.includes('github-vertex@'), msg: 'Service account naming' },
      { test: workflowContent.includes('github-actions'), msg: 'Workload identity pool' },
      { test: workflowContent.includes('github-oidc'), msg: 'OIDC provider' }
    ];

    checks.forEach(check => {
      if (check.test) {
        console.log(`✅ ${check.msg}`);
      } else {
        console.error(`❌ Missing: ${check.msg}`);
        errors++;
      }
    });
  }

  // Check bootstrap script
  const scriptPath = path.join(__dirname, '../scripts/vertex-ai-bootstrap.js');
  if (!fs.existsSync(scriptPath)) {
    console.error('❌ Bootstrap script missing: vertex-ai-bootstrap.js');
    errors++;
  } else {
    console.log('✅ Bootstrap script exists');
    
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');
    
    // Check script components
    const scriptChecks = [
      { test: scriptContent.includes('class VertexAIBootstrap'), msg: 'Main class' },
      { test: scriptContent.includes('validateBootstrap'), msg: 'Validation method' },
      { test: scriptContent.includes('checkServiceAccount'), msg: 'Service account check' },
      { test: scriptContent.includes('checkWorkloadIdentity'), msg: 'Workload identity check' },
      { test: scriptContent.includes('checkAPIs'), msg: 'API check' },
      { test: scriptContent.includes('checkStorageBucket'), msg: 'Storage bucket check' },
      { test: scriptContent.includes('generateConfig'), msg: 'Config generation' },
      { test: scriptContent.includes('showStatus'), msg: 'Status method' },
      { test: scriptContent.includes('module.exports'), msg: 'Module export' }
    ];

    scriptChecks.forEach(check => {
      if (check.test) {
        console.log(`✅ Script ${check.msg}`);
      } else {
        console.error(`❌ Script missing: ${check.msg}`);
        errors++;
      }
    });

    // Check if script is executable
    try {
      const stats = fs.statSync(scriptPath);
      if (stats.mode & parseInt('111', 8)) {
        console.log('✅ Script is executable');
      } else {
        console.log('⚠️ Script may not be executable (chmod +x required)');
      }
    } catch (error) {
      console.error('❌ Cannot check script permissions');
    }
  }

  // Check environment configuration
  const envPath = path.join(__dirname, '../.env.example');
  if (!fs.existsSync(envPath)) {
    console.error('❌ Environment example file missing');
    errors++;
  } else {
    console.log('✅ Environment example file exists');
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    const envChecks = [
      { test: envContent.includes('GCP_BOOTSTRAP_SA_KEY='), msg: 'Bootstrap key variable' },
      { test: envContent.includes('GCP_PROJECT_ID='), msg: 'Project ID variable' },
      { test: envContent.includes('GCP_PROJECT_NUMBER='), msg: 'Project number variable' },
      { test: envContent.includes('WORKLOAD_IDENTITY_PROVIDER='), msg: 'Workload identity provider variable' },
      { test: envContent.includes('GCP_SERVICE_ACCOUNT='), msg: 'Service account variable' },
      { test: envContent.includes('GCP_VERTEX_BUCKET='), msg: 'Vertex bucket variable' },
      { test: envContent.includes('GOOGLE CLOUD / VERTEX AI'), msg: 'Section header' }
    ];

    envChecks.forEach(check => {
      if (check.test) {
        console.log(`✅ Environment ${check.msg}`);
      } else {
        console.error(`❌ Environment missing: ${check.msg}`);
        errors++;
      }
    });
  }

  // Summary
  console.log('\n📊 Validation Summary');
  console.log('===================');
  if (errors === 0) {
    console.log('✅ All validation checks passed!');
    console.log('🚀 Vertex AI Bootstrap implementation is ready');
    return true;
  } else {
    console.log(`❌ ${errors} validation check(s) failed`);
    console.log('🔧 Please fix the issues above before using the bootstrap');
    return false;
  }
}

// Test the bootstrap script help command
function testBootstrapScript() {
  const scriptPath = path.join(__dirname, '../scripts/vertex-ai-bootstrap.js');
  if (fs.existsSync(scriptPath)) {
    console.log('\n🧪 Testing bootstrap script...');
    try {
      const { execSync } = require('child_process');
      const output = execSync(`node "${scriptPath}" help`, { encoding: 'utf8', timeout: 5000 });
      if (output.includes('Vertex AI Bootstrap Script')) {
        console.log('✅ Bootstrap script help command works');
        return true;
      } else {
        console.log('❌ Bootstrap script help output unexpected');
        return false;
      }
    } catch (error) {
      console.log(`❌ Bootstrap script test failed: ${error.message}`);
      return false;
    }
  }
  return false;
}

// Main execution
if (require.main === module) {
  const validationPassed = validateVertexBootstrap();
  const scriptTestPassed = testBootstrapScript();
  
  if (validationPassed && scriptTestPassed) {
    console.log('\n🎉 Vertex AI Bootstrap implementation is fully validated!');
    process.exit(0);
  } else {
    console.log('\n🚨 Validation failed - implementation needs fixes');
    process.exit(1);
  }
}

module.exports = { validateVertexBootstrap, testBootstrapScript };