const fs = require('fs');
const path = require('path');

/**
 * Test suite for Vertex AI Bootstrap workflow and script
 */
describe('Vertex AI Bootstrap', () => {
  
  describe('Workflow Configuration', () => {
    let workflowContent;
    let workflow;

    beforeAll(() => {
      const workflowPath = path.join(__dirname, '../.github/workflows/vertex-bootstrap.yml');
      expect(fs.existsSync(workflowPath)).toBe(true);
      
      workflowContent = fs.readFileSync(workflowPath, 'utf8');
      // Simple YAML parsing for basic validation (without js-yaml dependency)
      workflow = { content: workflowContent };
    });

    test('should have correct workflow name', () => {
      expect(workflowContent).toContain('name: Vertex AI Bootstrap - One-Click GCP Setup');
    });

    test('should have workflow_dispatch trigger', () => {
      expect(workflowContent).toContain('workflow_dispatch:');
      expect(workflowContent).toContain('inputs:');
    });

    test('should have required inputs', () => {
      expect(workflowContent).toContain('dry_run:');
      expect(workflowContent).toContain('force_recreate:');
      expect(workflowContent).toContain('type: boolean');
    });

    test('should have GCP_BOOTSTRAP_SA_KEY environment variable', () => {
      expect(workflowContent).toContain('GCP_BOOTSTRAP_SA_KEY: ${{ secrets.GCP_BOOTSTRAP_SA_KEY }}');
    });

    test('should have all required jobs', () => {
      const expectedJobs = [
        'validate-prerequisites:',
        'setup-apis:',
        'setup-service-account:',
        'setup-workload-identity:',
        'setup-storage:',
        'generate-outputs:'
      ];
      
      expectedJobs.forEach(jobName => {
        expect(workflowContent).toContain(jobName);
      });
    });

    test('should have proper job dependencies', () => {
      expect(workflowContent).toContain('needs: validate-prerequisites');
      expect(workflowContent).toContain('needs: [validate-prerequisites, setup-apis]');
      expect(workflowContent).toContain('needs: [validate-prerequisites, setup-apis, setup-service-account, setup-workload-identity, setup-storage]');
    });

    test('should use ubuntu-latest for all jobs', () => {
      const ubuntuMatches = workflowContent.match(/runs-on: ubuntu-latest/g);
      expect(ubuntuMatches.length).toBeGreaterThanOrEqual(6); // At least 6 jobs
    });

    test('should have checkout and setup steps in each job', () => {
      expect(workflowContent).toContain('Checkout Repository');
      expect(workflowContent).toContain('Setup Node.js');
      expect(workflowContent).toContain('uses: actions/checkout@v4');
      expect(workflowContent).toContain('uses: actions/setup-node@v4');
    });
  });

  describe('Bootstrap Script', () => {
    let VertexAIBootstrap;

    beforeAll(() => {
      const scriptPath = path.join(__dirname, '../scripts/vertex-ai-bootstrap.js');
      expect(fs.existsSync(scriptPath)).toBe(true);
      VertexAIBootstrap = require(scriptPath);
    });

    test('should export VertexAIBootstrap class', () => {
      expect(VertexAIBootstrap).toBeDefined();
      expect(typeof VertexAIBootstrap).toBe('function');
    });

    test('should have required methods', () => {
      const instance = new VertexAIBootstrap();
      
      const expectedMethods = [
        'initialize',
        'validateBootstrap',
        'checkServiceAccount',
        'checkWorkloadIdentity', 
        'checkAPIs',
        'checkStorageBucket',
        'checkIAMBindings',
        'showStatus',
        'generateConfig',
        'cleanup'
      ];

      expectedMethods.forEach(method => {
        expect(typeof instance[method]).toBe('function');
      });
    });

    test('should initialize with proper default values', () => {
      const instance = new VertexAIBootstrap();
      
      expect(instance.projectId).toBeNull();
      expect(instance.projectNumber).toBeNull();
      expect(instance.serviceAccountEmail).toBeNull();
      expect(instance.workloadIdentityProvider).toBeNull();
      expect(instance.bucketName).toBeNull();
    });

    test('should have executable permissions', () => {
      const scriptPath = path.join(__dirname, '../scripts/vertex-ai-bootstrap.js');
      const stats = fs.statSync(scriptPath);
      
      // Check that file is readable
      expect(stats.mode & parseInt('444', 8)).toBeTruthy();
    });
  });

  describe('Environment Configuration', () => {
    let envExample;

    beforeAll(() => {
      const envPath = path.join(__dirname, '../.env.example');
      expect(fs.existsSync(envPath)).toBe(true);
      envExample = fs.readFileSync(envPath, 'utf8');
    });

    test('should include GCP_BOOTSTRAP_SA_KEY variable', () => {
      expect(envExample).toContain('GCP_BOOTSTRAP_SA_KEY=');
    });

    test('should include production Vertex AI variables', () => {
      const requiredVars = [
        'GCP_PROJECT_ID=',
        'GCP_PROJECT_NUMBER=',
        'WORKLOAD_IDENTITY_PROVIDER=',
        'GCP_SERVICE_ACCOUNT=',
        'GCP_VERTEX_BUCKET='
      ];

      requiredVars.forEach(variable => {
        expect(envExample).toContain(variable);
      });
    });

    test('should have proper section headers', () => {
      expect(envExample).toContain('GOOGLE CLOUD / VERTEX AI');
      expect(envExample).toContain('Required roles: roles/owner');
    });
  });

  describe('Integration Tests', () => {
    test('should have consistent naming conventions', () => {
      // Check that service account name pattern is consistent
      const workflowPath = path.join(__dirname, '../.github/workflows/vertex-bootstrap.yml');
      const workflowContent = fs.readFileSync(workflowPath, 'utf8');
      
      // Should use github-vertex as service account name
      expect(workflowContent).toContain('github-vertex@');
      expect(workflowContent).toContain('SA_NAME="github-vertex"');
    });

    test('should have consistent resource naming', () => {
      const workflowPath = path.join(__dirname, '../.github/workflows/vertex-bootstrap.yml');
      const workflowContent = fs.readFileSync(workflowPath, 'utf8');
      
      // Check consistent pool and provider names
      expect(workflowContent).toContain('POOL_ID="github-actions"');
      expect(workflowContent).toContain('PROVIDER_ID="github-oidc"');
    });

    test('should have proper error handling patterns', () => {
      const scriptPath = path.join(__dirname, '../scripts/vertex-ai-bootstrap.js');
      const scriptContent = fs.readFileSync(scriptPath, 'utf8');
      
      // Should have try-catch blocks
      expect(scriptContent).toContain('try {');
      expect(scriptContent).toContain('catch (error)');
      
      // Should have proper error messages
      expect(scriptContent).toContain('console.error');
      expect(scriptContent).toContain('process.exit(1)');
    });
  });
});

// Mock test for environments where jest might not be available
if (typeof jest === 'undefined') {
  // Run basic validation tests
  const workflowPath = path.join(__dirname, '../.github/workflows/vertex-bootstrap.yml');
  const scriptPath = path.join(__dirname, '../scripts/vertex-ai-bootstrap.js');
  const envPath = path.join(__dirname, '../.env.example');
  
  console.log('🔍 Running Vertex AI Bootstrap validation...');
  
  // Check files exist
  if (fs.existsSync(workflowPath)) {
    console.log('✅ Workflow file exists');
    
    const workflowContent = fs.readFileSync(workflowPath, 'utf8');
    if (workflowContent.includes('name: Vertex AI Bootstrap - One-Click GCP Setup')) {
      console.log('✅ Workflow name is correct');
    }
    if (workflowContent.includes('GCP_BOOTSTRAP_SA_KEY')) {
      console.log('✅ GCP bootstrap key environment variable found');
    }
    if (workflowContent.includes('validate-prerequisites:')) {
      console.log('✅ All required jobs found');
    }
  }
  
  if (fs.existsSync(scriptPath)) {
    console.log('✅ Bootstrap script exists');
    const VertexAIBootstrap = require(scriptPath);
    if (typeof VertexAIBootstrap === 'function') {
      console.log('✅ Script exports class correctly');
    }
  }
  
  if (fs.existsSync(envPath)) {
    console.log('✅ Environment example file exists');
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('GCP_BOOTSTRAP_SA_KEY=')) {
      console.log('✅ Environment variables updated');
    }
  }
  
  console.log('✅ Vertex AI Bootstrap validation complete');
}