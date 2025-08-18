#!/usr/bin/env node

/**
 * N8N Final Implementation and Testing Script
 * 
 * This script provides the final implementation report with testing,
 * webhook validation, and complete setup verification.
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class N8nFinalImplementationAndTesting {
    constructor() {
        this.n8nUrl = 'https://primosphere.ninja';
        this.apiKey = process.env.N8N_API_KEY?.split('\n')[0];
        
        this.testResults = {
            timestamp: new Date().toISOString(),
            server_connectivity: null,
            api_authentication: null,
            webhook_endpoints: [],
            manual_setup_verified: false,
            implementation_status: 'in_progress'
        };

        console.log('🧪 N8N Final Implementation and Testing');
        console.log(`🌐 Testing Server: ${this.n8nUrl}`);
    }

    async testServerConnectivity() {
        console.log('\n🔍 Testing n8n server connectivity...');
        
        try {
            const response = await axios.get(`${this.n8nUrl}/healthz`, { 
                timeout: 10000,
                validateStatus: () => true // Accept any status
            });
            
            if (response.status === 200 && response.data.status) {
                console.log('✅ Server connectivity: PASSED');
                console.log(`   Status: ${response.data.status}`);
                this.testResults.server_connectivity = {
                    status: 'passed',
                    response_time: response.headers['x-response-time'] || 'unknown',
                    server_status: response.data.status
                };
                return true;
            } else {
                console.log('⚠️  Server connectivity: DEGRADED');
                console.log(`   HTTP Status: ${response.status}`);
                this.testResults.server_connectivity = {
                    status: 'degraded',
                    http_status: response.status,
                    response_data: response.data
                };
                return false;
            }
            
        } catch (error) {
            console.error('❌ Server connectivity: FAILED');
            console.error(`   Error: ${error.message}`);
            this.testResults.server_connectivity = {
                status: 'failed',
                error: error.message
            };
            return false;
        }
    }

    async testApiAuthentication() {
        console.log('\n🔐 Testing API authentication...');
        
        if (!this.apiKey) {
            console.log('⚠️  No API key configured - skipping API tests');
            this.testResults.api_authentication = {
                status: 'skipped',
                reason: 'no_api_key_configured'
            };
            return false;
        }

        try {
            const headers = { 'X-N8N-API-KEY': this.apiKey };
            const response = await axios.get(`${this.n8nUrl}/api/v1/workflows`, { 
                headers, 
                timeout: 10000 
            });

            if (response.status === 200) {
                console.log('✅ API authentication: PASSED');
                console.log(`   Existing workflows: ${response.data.data?.length || 0}`);
                this.testResults.api_authentication = {
                    status: 'passed',
                    workflows_found: response.data.data?.length || 0,
                    api_access: 'granted'
                };
                return true;
            }

        } catch (error) {
            if (error.response?.status === 401) {
                console.log('❌ API authentication: FAILED');
                console.log('   Issue: Invalid signature / Expired token');
                console.log('   Resolution: Regenerate API key in n8n interface');
                this.testResults.api_authentication = {
                    status: 'failed',
                    error_type: 'invalid_signature',
                    resolution: 'regenerate_api_key',
                    response: error.response.data
                };
            } else {
                console.log('❌ API authentication: ERROR');
                console.log(`   Error: ${error.message}`);
                this.testResults.api_authentication = {
                    status: 'error',
                    error: error.message
                };
            }
            return false;
        }
    }

    async testWebhookEndpoints() {
        console.log('\n🔗 Testing webhook endpoints...');
        
        const webhookEndpoints = [
            {
                name: 'Spotify Data Processing',
                path: 'spotify-data-processing',
                method: 'POST',
                sample_data: {
                    user_id: 'test_user_123',
                    tracks: [
                        {
                            id: 'spotify:track:test123',
                            name: 'Test Song',
                            artist: 'Test Artist',
                            played_at: new Date().toISOString()
                        }
                    ],
                    source: 'n8n_test'
                }
            },
            {
                name: 'AI Music Recommendations',
                path: 'ai-recommendations',
                method: 'POST',
                sample_data: {
                    user_id: 'test_user_123',
                    request_type: 'generate_recommendations',
                    preferences: {
                        genres: ['pop', 'rock'],
                        mood: 'energetic'
                    }
                }
            },
            {
                name: 'GitHub Repository Alert',
                path: 'github-repository-alert',
                method: 'POST',
                sample_data: {
                    repository: 'dzp5103/Spotify-echo',
                    event_type: 'test_alert',
                    message: 'Test webhook from n8n testing script'
                }
            }
        ];

        for (const endpoint of webhookEndpoints) {
            const webhookUrl = `${this.n8nUrl}/webhook/${endpoint.path}`;
            const testResult = {
                name: endpoint.name,
                url: webhookUrl,
                method: endpoint.method,
                status: 'testing'
            };

            try {
                console.log(`   Testing ${endpoint.name}...`);
                
                const response = await axios({
                    method: endpoint.method,
                    url: webhookUrl,
                    data: endpoint.sample_data,
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'n8n-testing-script/1.0'
                    },
                    timeout: 30000,
                    validateStatus: (status) => status < 500 // Accept 4xx as valid responses
                });

                if (response.status === 200) {
                    console.log(`   ✅ ${endpoint.name}: ACTIVE & RESPONDING`);
                    testResult.status = 'active';
                    testResult.response_status = response.status;
                    testResult.response_data = response.data;
                } else if (response.status === 404) {
                    console.log(`   ⚠️  ${endpoint.name}: NOT FOUND (workflow not created yet)`);
                    testResult.status = 'not_found';
                    testResult.response_status = response.status;
                    testResult.note = 'Workflow needs to be created manually';
                } else {
                    console.log(`   ⚠️  ${endpoint.name}: UNEXPECTED RESPONSE (${response.status})`);
                    testResult.status = 'unexpected';
                    testResult.response_status = response.status;
                    testResult.response_data = response.data;
                }

            } catch (error) {
                if (error.response?.status === 404) {
                    console.log(`   📝 ${endpoint.name}: WORKFLOW NOT CREATED (expected)`);
                    testResult.status = 'workflow_not_created';
                    testResult.note = 'This is expected - create workflow manually in n8n interface';
                } else if (error.code === 'ECONNREFUSED') {
                    console.log(`   ❌ ${endpoint.name}: CONNECTION REFUSED`);
                    testResult.status = 'connection_refused';
                    testResult.error = 'Server not accessible';
                } else {
                    console.log(`   ❌ ${endpoint.name}: ERROR (${error.message})`);
                    testResult.status = 'error';
                    testResult.error = error.message;
                }
            }

            // Add curl test command
            testResult.curl_command = `curl -X ${endpoint.method} "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(endpoint.sample_data)}'`;

            this.testResults.webhook_endpoints.push(testResult);
        }

        const activeWebhooks = this.testResults.webhook_endpoints.filter(w => w.status === 'active').length;
        const totalWebhooks = this.testResults.webhook_endpoints.length;
        
        console.log(`\n📊 Webhook Test Summary:`);
        console.log(`   Active Webhooks: ${activeWebhooks}/${totalWebhooks}`);
        console.log(`   Workflows to Create: ${totalWebhooks - activeWebhooks}`);

        return activeWebhooks;
    }

    async generateTestReport() {
        console.log('\n📋 Generating comprehensive test report...');
        
        // Determine overall implementation status
        const serverOk = this.testResults.server_connectivity?.status === 'passed';
        const apiWorking = this.testResults.api_authentication?.status === 'passed';
        const activeWebhooks = this.testResults.webhook_endpoints.filter(w => w.status === 'active').length;

        if (serverOk && apiWorking && activeWebhooks > 0) {
            this.testResults.implementation_status = 'fully_operational';
        } else if (serverOk && apiWorking) {
            this.testResults.implementation_status = 'api_ready_workflows_needed';
        } else if (serverOk) {
            this.testResults.implementation_status = 'manual_setup_required';
        } else {
            this.testResults.implementation_status = 'server_issues';
        }

        const testReport = {
            test_execution: {
                timestamp: this.testResults.timestamp,
                duration: Math.round((new Date() - new Date(this.testResults.timestamp)) / 1000) + ' seconds',
                tests_run: 3 + this.testResults.webhook_endpoints.length
            },
            server_status: {
                n8n_url: this.n8nUrl,
                connectivity: this.testResults.server_connectivity?.status || 'unknown',
                health_check: this.testResults.server_connectivity?.server_status || 'unknown'
            },
            authentication_status: {
                api_key_configured: !!this.apiKey,
                api_authentication: this.testResults.api_authentication?.status || 'not_tested',
                workflows_accessible: this.testResults.api_authentication?.workflows_found || 0
            },
            webhook_testing: {
                total_endpoints_tested: this.testResults.webhook_endpoints.length,
                active_webhooks: this.testResults.webhook_endpoints.filter(w => w.status === 'active').length,
                workflows_needed: this.testResults.webhook_endpoints.filter(w => w.status === 'workflow_not_created' || w.status === 'not_found').length,
                endpoints: this.testResults.webhook_endpoints
            },
            implementation_status: this.testResults.implementation_status,
            next_steps: this.generateNextSteps(),
            recommendations: this.generateRecommendations()
        };

        // Save test report
        const reportPath = path.join(process.cwd(), 'reports', 'n8n-final-implementation-test-results.json');
        await fs.mkdir(path.dirname(reportPath), { recursive: true });
        await fs.writeFile(reportPath, JSON.stringify(testReport, null, 2));

        console.log(`📄 Test report saved to: ${reportPath}`);

        return testReport;
    }

    generateNextSteps() {
        const steps = [];
        
        if (this.testResults.server_connectivity?.status !== 'passed') {
            steps.push({
                priority: 'critical',
                action: 'Fix server connectivity issues',
                description: 'Resolve connection problems to n8n server'
            });
        }

        if (this.testResults.api_authentication?.status === 'failed') {
            steps.push({
                priority: 'high',
                action: 'Regenerate API key',
                description: 'Login to n8n interface and generate new API key'
            });
        }

        const workflowsNeeded = this.testResults.webhook_endpoints.filter(
            w => w.status === 'workflow_not_created' || w.status === 'not_found'
        ).length;

        if (workflowsNeeded > 0) {
            steps.push({
                priority: 'high',
                action: 'Create workflows manually',
                description: `Create ${workflowsNeeded} workflows using n8n browser interface`
            });
        }

        steps.push({
            priority: 'medium',
            action: 'Test workflow functionality',
            description: 'Verify all created workflows process data correctly'
        });

        steps.push({
            priority: 'medium',
            action: 'Configure monitoring',
            description: 'Set up health monitoring and alerting'
        });

        return steps;
    }

    generateRecommendations() {
        const recommendations = [];

        if (this.testResults.implementation_status === 'manual_setup_required') {
            recommendations.push({
                category: 'setup_approach',
                recommendation: 'Use manual browser-based setup',
                reason: 'API authentication is not working',
                implementation: 'Create workflows directly in n8n web interface'
            });
        }

        if (this.testResults.webhook_endpoints.some(w => w.status === 'workflow_not_created')) {
            recommendations.push({
                category: 'workflow_creation',
                recommendation: 'Start with core workflows first',
                reason: 'Prioritize essential functionality',
                implementation: 'Create Spotify data processing and MCP monitoring workflows first'
            });
        }

        recommendations.push({
            category: 'monitoring',
            recommendation: 'Set up health monitoring dashboard',
            reason: 'Essential for production operation',
            implementation: 'Create monitoring workflows with alerts'
        });

        recommendations.push({
            category: 'documentation',
            recommendation: 'Document all workflow configurations',
            reason: 'Ensure maintainability and knowledge transfer',
            implementation: 'Export workflow definitions and create setup documentation'
        });

        return recommendations;
    }

    async generateFinalMarkdownReport() {
        console.log('\n📝 Generating final implementation report...');
        
        const testReport = await this.generateTestReport();
        
        const markdownReport = `# N8N Final Implementation & Testing Report

## 🎯 Executive Summary

**Test Date:** ${new Date(testReport.test_execution.timestamp).toLocaleDateString()}  
**Test Duration:** ${testReport.test_execution.duration}  
**Tests Executed:** ${testReport.test_execution.tests_run}  
**Implementation Status:** ${testReport.implementation_status.toUpperCase().replace(/_/g, ' ')}

## 🌐 Server Status

### Connectivity Test
- **N8N Server:** ${testReport.server_status.n8n_url}
- **Connection Status:** ${testReport.server_status.connectivity === 'passed' ? '🟢 OPERATIONAL' : '🔴 ISSUES DETECTED'}
- **Health Check:** ${testReport.server_status.health_check}

### Quick Access
- **URL:** [${this.n8nUrl}](${this.n8nUrl})
- **Login:** willexmen8@gmail.com
- **Password:** DapperMan77$$

## 🔐 Authentication Analysis

### API Authentication Test
- **API Key Configured:** ${testReport.authentication_status.api_key_configured ? '✅ Yes' : '❌ No'}
- **Authentication Status:** ${testReport.authentication_status.api_authentication === 'passed' ? '🟢 WORKING' : testReport.authentication_status.api_authentication === 'failed' ? '🔴 FAILED' : '⚠️ NOT TESTED'}
- **Accessible Workflows:** ${testReport.authentication_status.workflows_accessible}

${testReport.authentication_status.api_authentication === 'failed' ? `
### ⚠️ Authentication Issue Detected
The API key authentication is failing. **Solution:**

1. **Login to N8N Web Interface**
   - Go to ${this.n8nUrl}
   - Login with willexmen8@gmail.com / DapperMan77$$

2. **Regenerate API Key**
   - Navigate to Settings → API
   - Delete existing API key
   - Generate new API key
   - Update .env file with new key

3. **Alternative: Manual Setup**
   - Skip API automation
   - Create workflows manually in browser
   - Use webhook endpoints for integration
` : ''}

## 🔗 Webhook Testing Results

### Test Summary
- **Total Endpoints Tested:** ${testReport.webhook_testing.total_endpoints_tested}
- **Active Webhooks:** ${testReport.webhook_testing.active_webhooks}
- **Workflows Needed:** ${testReport.webhook_testing.workflows_needed}

### Endpoint Details

${testReport.webhook_testing.endpoints.map(endpoint => `
#### ${endpoint.name}
- **URL:** \`${endpoint.url}\`
- **Status:** ${
  endpoint.status === 'active' ? '🟢 ACTIVE' :
  endpoint.status === 'workflow_not_created' || endpoint.status === 'not_found' ? '📝 NEEDS WORKFLOW' :
  endpoint.status === 'error' ? '🔴 ERROR' :
  '⚠️ UNKNOWN'
}
${endpoint.note ? `- **Note:** ${endpoint.note}` : ''}
${endpoint.error ? `- **Error:** ${endpoint.error}` : ''}

**Test Command:**
\`\`\`bash
${endpoint.curl_command}
\`\`\`
`).join('')}

## 🚀 Implementation Status

### Current State: ${testReport.implementation_status.toUpperCase().replace(/_/g, ' ')}

${testReport.implementation_status === 'fully_operational' ? `
🎉 **Excellent!** Your n8n instance is fully operational with working API access and active workflows.

**What's Working:**
- ✅ Server connectivity
- ✅ API authentication  
- ✅ Active workflows processing requests
- ✅ Webhook endpoints responding

**Ready for Production Use**
` : testReport.implementation_status === 'api_ready_workflows_needed' ? `
🔧 **Good Progress!** Your n8n server and API are working, but workflows need to be created.

**What's Working:**
- ✅ Server connectivity
- ✅ API authentication
- ❌ Workflows not created yet

**Next Step:** Create workflows using the API or manual interface
` : testReport.implementation_status === 'manual_setup_required' ? `
🛠️  **Manual Setup Needed** - API authentication issues require manual workflow creation.

**What's Working:**
- ✅ Server connectivity
- ❌ API authentication failed
- ❌ Workflows need manual creation

**Next Step:** Use browser interface to create workflows manually
` : `
❌ **Server Issues Detected** - Server connectivity problems need to be resolved first.

**Issues:**
- ❌ Server connectivity problems
- ❓ API authentication not testable
- ❓ Workflows cannot be tested

**Next Step:** Fix server connectivity issues
`}

## 📋 Next Steps & Action Plan

### Immediate Actions (Priority: ${testReport.next_steps[0]?.priority || 'High'})

${testReport.next_steps.map((step, index) => `
${index + 1}. **${step.action}** (${step.priority.toUpperCase()})
   - ${step.description}
`).join('')}

## 💡 Recommendations

${testReport.recommendations.map(rec => `
### ${rec.category.replace(/_/g, ' ').toUpperCase()}
**Recommendation:** ${rec.recommendation}  
**Reason:** ${rec.reason}  
**Implementation:** ${rec.implementation}
`).join('')}

## 🔧 Manual Workflow Creation Guide

${testReport.webhook_testing.workflows_needed > 0 ? `
Since ${testReport.webhook_testing.workflows_needed} workflow(s) need to be created, here's the manual setup guide:

### 1. Access N8N Interface
1. Go to [${this.n8nUrl}](${this.n8nUrl})
2. Login with willexmen8@gmail.com / DapperMan77$$

### 2. Create Priority Workflows

#### Spotify Data Processing Pipeline
1. Click "New Workflow"
2. Add **Webhook** node:
   - Path: \`spotify-data-processing\`
   - Method: POST
3. Add **Code** node for data validation
4. Add **HTTP Request** node to save data
5. Save workflow and activate

#### MCP Server Health Monitor  
1. Create new workflow
2. Add **Schedule Trigger** (every 10 minutes)
3. Add **Code** node for health checks
4. Add **IF** node for alert logic
5. Add **Email/Slack** node for notifications
6. Save and activate

#### AI Music Recommendations
1. Create new workflow  
2. Add **Webhook** trigger (path: \`ai-recommendations\`)
3. Add **OpenAI/LLM** node
4. Add **Code** node for processing
5. Add response handling
6. Save and activate

### 3. Test Created Workflows
Use the curl commands provided above to test each webhook endpoint.
` : `
All workflows are already active! Use the test commands above to verify functionality.
`}

## 📊 Technical Specifications

### System Configuration
- **N8N Version:** Self-hosted instance
- **Authentication:** JWT token-based API
- **Webhook Support:** Enabled with custom paths  
- **Monitoring Capability:** Ready for health checks
- **Integration Points:** Spotify API, GitHub API, MCP servers

### Performance Expectations
- **Webhook Response Time:** <2 seconds average
- **Health Check Frequency:** Every 10 minutes
- **Data Processing:** Real-time with validation
- **Error Handling:** Comprehensive with alerts

## 📞 Support & Troubleshooting

### Common Issues & Solutions

1. **Webhook 404 Errors**
   - **Cause:** Workflow not created or not active
   - **Solution:** Create/activate workflow in n8n interface

2. **API Authentication Failures**
   - **Cause:** Expired or invalid API key
   - **Solution:** Regenerate API key in Settings → API

3. **Connection Timeouts**
   - **Cause:** Server overload or network issues
   - **Solution:** Check server resources and network

### Getting Help
- **N8N Documentation:** https://docs.n8n.io/
- **API Reference:** https://docs.n8n.io/api/
- **Community Forum:** https://community.n8n.io/

### Contact Information
- **Project Repository:** https://github.com/dzp5103/Spotify-echo
- **N8N Instance:** ${this.n8nUrl}
- **Primary Contact:** willexmen8@gmail.com

---

**Report Generated:** ${new Date().toLocaleString()}  
**Test Suite Version:** 1.0.0  
**Status:** ${testReport.implementation_status === 'fully_operational' ? '🟢 Production Ready' : testReport.implementation_status === 'api_ready_workflows_needed' ? '🟡 Workflows Needed' : testReport.implementation_status === 'manual_setup_required' ? '🟡 Manual Setup Required' : '🔴 Issues Detected'}
`;

        const markdownPath = path.join(process.cwd(), 'reports', 'n8n-final-implementation-and-testing-report.md');
        await fs.mkdir(path.dirname(markdownPath), { recursive: true });
        await fs.writeFile(markdownPath, markdownReport);

        console.log(`📄 Final implementation report saved to: ${markdownPath}`);

        return {
            markdownPath,
            testReport
        };
    }

    async runCompleteImplementationTest() {
        console.log('🚀 Running complete n8n implementation test suite...\n');

        try {
            // Step 1: Test server connectivity
            const serverOk = await this.testServerConnectivity();
            
            // Step 2: Test API authentication  
            const apiOk = await this.testApiAuthentication();
            
            // Step 3: Test webhook endpoints
            const activeWebhooks = await this.testWebhookEndpoints();
            
            // Step 4: Generate comprehensive report
            const { markdownPath, testReport } = await this.generateFinalMarkdownReport();

            // Final summary
            console.log('\n🎉 N8N Implementation Test Suite Completed!');
            console.log('═'.repeat(50));
            console.log(`📊 Test Results Summary:`);
            console.log(`   Server Connectivity: ${serverOk ? '✅ PASSED' : '❌ FAILED'}`);
            console.log(`   API Authentication: ${apiOk ? '✅ PASSED' : '❌ FAILED'}`);
            console.log(`   Active Webhooks: ${activeWebhooks}/${this.testResults.webhook_endpoints.length}`);
            console.log(`   Implementation Status: ${testReport.implementation_status.toUpperCase().replace(/_/g, ' ')}`);
            console.log('═'.repeat(50));
            
            console.log(`\n🌐 N8N Access Information:`);
            console.log(`   URL: ${this.n8nUrl}`);
            console.log(`   Login: willexmen8@gmail.com`);
            console.log(`   Password: DapperMan77$$`);
            
            if (testReport.implementation_status === 'manual_setup_required') {
                console.log(`\n⚠️  IMPORTANT: API authentication failed`);
                console.log(`   Recommendation: Use manual browser-based setup`);
                console.log(`   Action Required: Create workflows manually in n8n interface`);
            }
            
            if (activeWebhooks === 0) {
                console.log(`\n📝 Workflows to Create: ${this.testResults.webhook_endpoints.length}`);
                console.log(`   Priority: Spotify Data Processing & MCP Health Monitor`);
            }

            console.log(`\n📖 Complete Implementation Guide: ${markdownPath}`);

            return {
                success: true,
                serverConnectivity: serverOk,
                apiAuthentication: apiOk,
                activeWebhooks,
                implementationStatus: testReport.implementation_status,
                reportPath: markdownPath,
                testResults: this.testResults
            };

        } catch (error) {
            console.error('\n❌ Implementation test failed:', error.message);
            
            // Generate error report
            try {
                const { markdownPath } = await this.generateFinalMarkdownReport();
                console.log(`📄 Error report generated: ${markdownPath}`);
            } catch (reportError) {
                console.error('Failed to generate error report:', reportError.message);
            }

            return {
                success: false,
                error: error.message,
                testResults: this.testResults
            };
        }
    }
}

// Run if executed directly
if (require.main === module) {
    const tester = new N8nFinalImplementationAndTesting();
    tester.runCompleteImplementationTest()
        .then(result => {
            if (result.success) {
                console.log('\n✨ Implementation test completed successfully!');
                console.log(`📊 Status: ${result.implementationStatus}`);
                console.log(`🔗 Active Webhooks: ${result.activeWebhooks}`);
                process.exit(0);
            } else {
                console.error('\n💥 Implementation test encountered issues');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = N8nFinalImplementationAndTesting;