#!/usr/bin/env node

/**
 * Lightweight Test for Vertex AI Configuration
 * 
 * This test validates the vertex configuration system without requiring
 * actual GCP credentials. It can run with or without real credentials
 * based on the ENABLE_VERTEX_E2E environment variable.
 * 
 * Usage:
 *   node scripts/tests/test-vertex-config.mjs
 *   ENABLE_VERTEX_E2E=1 node scripts/tests/test-vertex-config.mjs
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class VertexConfigTester {
  constructor() {
    this.testsRun = 0;
    this.testsPassed = 0;
    this.testsFailed = 0;
    this.enableE2E = process.env.ENABLE_VERTEX_E2E === '1';
  }

  /**
   * Run a test and track results
   */
  async runTest(name, testFn) {
    this.testsRun++;
    process.stdout.write(`🧪 ${name}... `);
    
    try {
      await testFn();
      this.testsPassed++;
      console.log('✅');
      return true;
    } catch (error) {
      this.testsFailed++;
      console.log('❌');
      console.log(`   Error: ${error.message}`);
      return false;
    }
  }

  /**
   * Test that required files exist
   */
  async testFileExistence() {
    const requiredFiles = [
      join(__dirname, '../gcp/setup_workload_identity.sh'),
      join(__dirname, '../vertex/verify-vertex.js'),
      join(__dirname, '../configure-gcp-credentials.js')
    ];

    for (const file of requiredFiles) {
      if (!existsSync(file)) {
        throw new Error(`Required file missing: ${file}`);
      }
    }
  }

  /**
   * Test that scripts have proper permissions
   */
  async testScriptPermissions() {
    const { access, constants } = await import('fs/promises');
    
    const scriptPath = join(__dirname, '../gcp/setup_workload_identity.sh');
    
    try {
      await access(scriptPath, constants.F_OK | constants.R_OK);
    } catch (error) {
      throw new Error(`Script not accessible: ${scriptPath}`);
    }
  }

  /**
   * Test workload identity script help command
   */
  async testWorkloadIdentityScript() {
    return new Promise((resolve, reject) => {
      const scriptPath = join(__dirname, '../gcp/setup_workload_identity.sh');
      const childProcess = spawn('bash', [scriptPath], {
        env: { 
          ...process.env, 
          PROJECT_ID: '', 
          REPO_FULL_NAME: '', 
          DRY_RUN: 'true' 
        },
        stdio: 'pipe'
      });

      let output = '';
      let errorOutput = '';

      childProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      childProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      childProcess.on('close', (code) => {
        // Script should fail due to missing required env vars, but gracefully
        const combinedOutput = output + errorOutput;
        if (combinedOutput.includes('PROJECT_ID environment variable is required') || 
            combinedOutput.includes('No active gcloud authentication') ||
            code !== 0) {
          resolve(); // Expected failure due to missing prerequisites
        } else {
          reject(new Error(`Script should have failed with missing env vars. Output: ${combinedOutput}`));
        }
      });

      childProcess.on('error', (error) => {
        reject(new Error(`Failed to run script: ${error.message}`));
      });

      // Kill process after timeout
      setTimeout(() => {
        childProcess.kill();
        reject(new Error('Script test timed out'));
      }, 10000);
    });
  }

  /**
   * Test vertex verification script help command
   */
  async testVertexVerificationScript() {
    return new Promise((resolve, reject) => {
      const scriptPath = join(__dirname, '../vertex/verify-vertex.js');
      const childProcess = spawn('node', [scriptPath, 'help'], {
        stdio: 'pipe'
      });

      let output = '';

      childProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      childProcess.on('close', (code) => {
        if (code === 0 && output.includes('Vertex AI Verification Script')) {
          resolve();
        } else {
          reject(new Error(`Verification script help failed: ${output}`));
        }
      });

      childProcess.on('error', (error) => {
        reject(new Error(`Failed to run verification script: ${error.message}`));
      });

      // Kill process after timeout
      setTimeout(() => {
        childProcess.kill();
        reject(new Error('Verification script test timed out'));
      }, 5000);
    });
  }

  /**
   * Test configure-gcp-credentials.js help command
   */
  async testConfigureCredentialsScript() {
    return new Promise((resolve, reject) => {
      const scriptPath = join(__dirname, '../configure-gcp-credentials.js');
      const childProcess = spawn('node', [scriptPath, 'help'], {
        stdio: 'pipe'
      });

      let output = '';

      childProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      childProcess.on('close', (code) => {
        if (code === 0 && output.includes('wif-setup') && output.includes('vertex-verify')) {
          resolve();
        } else {
          reject(new Error(`Configure script help missing new commands: ${output}`));
        }
      });

      childProcess.on('error', (error) => {
        reject(new Error(`Failed to run configure script: ${error.message}`));
      });

      // Kill process after timeout
      setTimeout(() => {
        childProcess.kill();
        reject(new Error('Configure script test timed out'));
      }, 5000);
    });
  }

  /**
   * Test vertex verification with mock environment (E2E test)
   */
  async testVertexVerificationE2E() {
    if (!this.enableE2E) {
      console.log('   Skipped (set ENABLE_VERTEX_E2E=1 to enable)');
      return;
    }

    return new Promise((resolve, reject) => {
      const scriptPath = join(__dirname, '../vertex/verify-vertex.js');
      const childProcess = spawn('node', [scriptPath, 'status'], {
        env: {
          ...process.env,
          GCP_PROJECT_ID: 'test-project',
          AI_MOCK_MODE: 'true'
        },
        stdio: 'pipe'
      });

      let output = '';

      childProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      childProcess.on('close', (code) => {
        if (output.includes('Project ID: test-project') && output.includes('Mock Mode: Enabled')) {
          resolve();
        } else {
          reject(new Error(`Vertex verification status test failed: ${output}`));
        }
      });

      childProcess.on('error', (error) => {
        reject(new Error(`Failed to run vertex verification E2E: ${error.message}`));
      });

      // Kill process after timeout
      setTimeout(() => {
        childProcess.kill();
        reject(new Error('Vertex verification E2E test timed out'));
      }, 5000);
    });
  }

  /**
   * Display test summary
   */
  displaySummary() {
    console.log('\n📊 Test Summary');
    console.log('===============');
    console.log(`Total tests: ${this.testsRun}`);
    console.log(`Passed: ${this.testsPassed}`);
    console.log(`Failed: ${this.testsFailed}`);
    
    if (this.testsFailed === 0) {
      console.log('\n✅ All tests passed!');
      console.log('🎉 Vertex AI configuration system is ready');
      return true;
    } else {
      console.log('\n❌ Some tests failed');
      console.log('🔧 Please fix the issues above');
      return false;
    }
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Running Vertex AI Configuration Tests\n');
    
    if (this.enableE2E) {
      console.log('🔄 E2E tests enabled');
    } else {
      console.log('🔄 Running basic tests only (set ENABLE_VERTEX_E2E=1 for E2E tests)');
    }
    console.log('');

    await this.runTest('File existence', () => this.testFileExistence());
    await this.runTest('Script permissions', () => this.testScriptPermissions());
    await this.runTest('Workload Identity script', () => this.testWorkloadIdentityScript());
    await this.runTest('Vertex verification script', () => this.testVertexVerificationScript());
    await this.runTest('Configure credentials script', () => this.testConfigureCredentialsScript());
    await this.runTest('Vertex verification E2E', () => this.testVertexVerificationE2E());

    return this.displaySummary();
  }
}

// Main execution
async function main() {
  const tester = new VertexConfigTester();
  
  try {
    const success = await tester.runAllTests();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('\n💥 Test runner error:', error.message);
    process.exit(2);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default VertexConfigTester;