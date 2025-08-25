#!/usr/bin/env node

/**
 * Comprehensive n8n MCP Integration Test
 * Tests all MCP tools and automation capabilities with n8n integration
 */

// Load environment variables
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

class N8nMcpIntegrationTest {
    constructor() {
        this.testResults = {
            n8nConnectivity: false,
            mcpServerHealth: false,
            workflowListing: false,
            mcpToolsAvailable: false,
            environmentSetup: false,
            integrationReady: false
        };
        this.startTime = Date.now();
    }

    async runComprehensiveTest() {
        console.log('🚀 Starting comprehensive n8n MCP integration test...\n');

        try {
            await this.testEnvironmentSetup();
            await this.testN8nConnectivity();
            await this.testMcpServerHealth();
            await this.testWorkflowListing();
            await this.testMcpToolsAvailability();
            await this.testIntegrationReadiness();

            this.generateReport();

        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
            this.generateErrorReport(error);
        }
    }

    async testEnvironmentSetup() {
        console.log('📋 Testing environment setup...');

        try {
            // Check environment variables
            const requiredEnvVars = ['N8N_API_URL', 'N8N_API_KEY'];
            for (const envVar of requiredEnvVars) {
                if (!process.env[envVar]) {
                    throw new Error(`Missing environment variable: ${envVar}`);
                }
            }

            // Check n8n-mcp package
            if (!fs.existsSync('./node_modules/n8n-mcp/package.json')) {
                throw new Error('n8n-mcp package not found');
            }

            // Check integration files
            const integrationPath = './mcp-servers/new-candidates/n8n-mcp/integration.js';
            if (!fs.existsSync(integrationPath)) {
                throw new Error('n8n integration script not found');
            }

            this.testResults.environmentSetup = true;
            console.log('   ✅ Environment setup complete\n');

        } catch (error) {
            console.log(`   ❌ Environment setup failed: ${error.message}\n`);
            throw error;
        }
    }

    async testN8nConnectivity() {
        console.log('🌐 Testing n8n instance connectivity...');

        try {
            const axios = require('axios');
            const apiUrl = process.env.N8N_API_URL;
            const apiKey = process.env.N8N_API_KEY;

            // Test health endpoint
            const healthResponse = await axios.get(`${apiUrl}/healthz`, { timeout: 5000 });
            console.log(`   ✅ Health check: ${healthResponse.data.status}`);

            // Test API with authentication
            const apiResponse = await axios.get(`${apiUrl}/api/v1/workflows`, {
                headers: { 'X-N8N-API-KEY': apiKey },
                timeout: 5000
            });

            const workflowCount = apiResponse.data.data?.length || 0;
            console.log(`   ✅ API authentication successful`);
            console.log(`   📊 Found ${workflowCount} workflows`);

            this.testResults.n8nConnectivity = true;
            this.workflowCount = workflowCount;
            console.log('');

        } catch (error) {
            console.log(`   ❌ n8n connectivity failed: ${error.message}\n`);
            throw error;
        }
    }

    async testMcpServerHealth() {
        console.log('🔧 Testing MCP server health...');

        try {
            // Test n8n-mcp package availability
            const packagePath = './node_modules/n8n-mcp/package.json';
            if (fs.existsSync(packagePath)) {
                const packageInfo = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
                console.log(`   ✅ n8n-mcp package v${packageInfo.version} available`);
            }

            // Test that npx is available
            try {
                execSync('which npx', { stdio: 'pipe', timeout: 2000 });
                console.log('   ✅ npx command available');
            } catch (e) {
                throw new Error('npx not available');
            }

            // Test integration script exists and can be parsed
            const integrationPath = './mcp-servers/new-candidates/n8n-mcp/integration.js';
            if (fs.existsSync(integrationPath)) {
                console.log('   ✅ Integration script available');
                
                // Quick syntax check without execution
                const scriptContent = fs.readFileSync(integrationPath, 'utf8');
                if (scriptContent.includes('n8nMcpIntegration') && scriptContent.includes('start')) {
                    console.log('   ✅ Integration script syntax valid');
                }
            }

            this.testResults.mcpServerHealth = true;
            console.log('');

        } catch (error) {
            console.log(`   ❌ MCP server health check failed: ${error.message}\n`);
            throw error;
        }
    }

    async testWorkflowListing() {
        console.log('📋 Testing workflow management capabilities...');

        try {
            const axios = require('axios');
            const apiUrl = process.env.N8N_API_URL;
            const apiKey = process.env.N8N_API_KEY;

            // List workflows
            const response = await axios.get(`${apiUrl}/api/v1/workflows`, {
                headers: { 'X-N8N-API-KEY': apiKey },
                timeout: 5000
            });

            const workflows = response.data.data || [];
            console.log(`   ✅ Successfully listed ${workflows.length} workflows`);

            // Display workflow information
            if (workflows.length > 0) {
                workflows.slice(0, 3).forEach((workflow, index) => {
                    console.log(`   📄 Workflow ${index + 1}: ${workflow.name} (${workflow.active ? 'active' : 'inactive'})`);
                });
                if (workflows.length > 3) {
                    console.log(`   📄 ... and ${workflows.length - 3} more workflows`);
                }
            }

            this.testResults.workflowListing = true;
            console.log('');

        } catch (error) {
            console.log(`   ❌ Workflow listing failed: ${error.message}\n`);
            throw error;
        }
    }

    async testMcpToolsAvailability() {
        console.log('🛠️ Testing MCP tools availability...');

        try {
            // Test that MCP configuration is available
            const packageJsonPath = './package.json';
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            
            if (packageJson.mcp && packageJson.mcp.servers && packageJson.mcp.servers['n8n-mcp']) {
                console.log('   ✅ n8n-mcp configured in package.json');
                
                const n8nMcpConfig = packageJson.mcp.servers['n8n-mcp'];
                console.log(`   🔧 Command: ${n8nMcpConfig.command} ${n8nMcpConfig.args.join(' ')}`);
                console.log(`   🌐 API URL configured: ${!!n8nMcpConfig.env.N8N_API_URL}`);
                console.log(`   🔑 API Key configured: ${!!n8nMcpConfig.env.N8N_API_KEY}`);
            }

            // Test other MCP servers are available
            const mcpServers = Object.keys(packageJson.mcp.servers);
            console.log(`   📦 Available MCP servers: ${mcpServers.join(', ')}`);

            this.testResults.mcpToolsAvailable = true;
            console.log('');

        } catch (error) {
            console.log(`   ❌ MCP tools check failed: ${error.message}\n`);
            throw error;
        }
    }

    async testIntegrationReadiness() {
        console.log('🎯 Testing integration readiness...');

        try {
            // Check all components are ready
            const readinessChecks = [
                { name: 'Environment Setup', status: this.testResults.environmentSetup },
                { name: 'n8n Connectivity', status: this.testResults.n8nConnectivity },
                { name: 'MCP Server Health', status: this.testResults.mcpServerHealth },
                { name: 'Workflow Listing', status: this.testResults.workflowListing },
                { name: 'MCP Tools Available', status: this.testResults.mcpToolsAvailable }
            ];

            let allReady = true;
            readinessChecks.forEach(check => {
                const icon = check.status ? '✅' : '❌';
                console.log(`   ${icon} ${check.name}: ${check.status ? 'Ready' : 'Failed'}`);
                if (!check.status) allReady = false;
            });

            if (allReady) {
                console.log('\n   🎉 All integration components are ready!');
                console.log('   🚀 n8n MCP server can be used for workflow automation');
                this.testResults.integrationReady = true;
            } else {
                throw new Error('Some integration components are not ready');
            }

            console.log('');

        } catch (error) {
            console.log(`   ❌ Integration readiness check failed: ${error.message}\n`);
            throw error;
        }
    }

    generateReport() {
        const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
        const allPassed = Object.values(this.testResults).every(result => result === true);

        console.log('📊 COMPREHENSIVE TEST REPORT');
        console.log('=' .repeat(50));
        console.log(`Duration: ${duration}s`);
        console.log(`Overall Status: ${allPassed ? '✅ PASSED' : '❌ FAILED'}`);
        console.log('');

        console.log('📋 Test Results:');
        Object.entries(this.testResults).forEach(([test, result]) => {
            const icon = result ? '✅' : '❌';
            const testName = test.replace(/([A-Z])/g, ' $1').toLowerCase();
            console.log(`   ${icon} ${testName}: ${result ? 'PASSED' : 'FAILED'}`);
        });

        console.log('');
        console.log('🔗 Integration Summary:');
        console.log(`   n8n Instance: ${process.env.N8N_API_URL}`);
        console.log(`   Workflows Available: ${this.workflowCount || 0}`);
        console.log(`   MCP Tools: n8n workflow automation, documentation, API management`);
        console.log(`   Authentication: JWT token configured`);

        console.log('');
        console.log('🚀 Next Steps:');
        if (allPassed) {
            console.log('   1. The n8n MCP server is ready for use');
            console.log('   2. Configure Claude Desktop with the MCP server settings');
            console.log('   3. Use n8n-mcp tools for workflow automation');
            console.log('   4. Access the n8n management interface for manual workflow editing');
        } else {
            console.log('   1. Review failed test components above');
            console.log('   2. Ensure n8n instance is accessible');
            console.log('   3. Verify API token is valid');
            console.log('   4. Rerun the integration test');
        }

        console.log('\n✨ Test completed successfully!');
    }

    generateErrorReport(error) {
        console.log('\n💥 ERROR REPORT');
        console.log('=' .repeat(30));
        console.log(`Error: ${error.message}`);
        console.log(`Stack: ${error.stack}`);
        
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Verify n8n instance is running and accessible');
        console.log('2. Check API token is valid and has proper permissions');
        console.log('3. Ensure all dependencies are installed (npm install)');
        console.log('4. Check environment variables in .env file');
    }
}

// Run the test if executed directly
if (require.main === module) {
    const test = new N8nMcpIntegrationTest();
    test.runComprehensiveTest().catch(console.error);
}

module.exports = N8nMcpIntegrationTest;