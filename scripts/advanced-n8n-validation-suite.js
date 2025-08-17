#!/usr/bin/env node

/**
 * Advanced N8N Workflow Validation & Testing Suite
 * Comprehensive testing of all workflows, credentials, and integrations
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class AdvancedN8nValidationSuite {
    constructor() {
        this.n8nApiUrl = 'http://46.101.106.220';
        this.apiKey = process.env.N8N_API_KEY;
        this.testResults = {};
        this.performanceMetrics = {};
        this.validationReport = {};
        
        console.log('🧪 Initializing Advanced N8N Validation Suite...');
    }

    async validateN8nServerConnection() {
        console.log('\n🌐 Testing N8N Server Connection...');
        
        try {
            const start = Date.now();
            const response = await axios.get(`${this.n8nApiUrl}/healthz`);
            const responseTime = Date.now() - start;
            
            this.testResults.server_connection = {
                status: 'success',
                health: response.data,
                response_time: responseTime,
                timestamp: new Date().toISOString()
            };
            
            console.log(`✅ Server connection successful (${responseTime}ms)`);
            console.log(`   Health status: ${response.data.status || response.data}`);
            
        } catch (error) {
            this.testResults.server_connection = {
                status: 'failed',
                error: error.message,
                timestamp: new Date().toISOString()
            };
            
            console.error('❌ Server connection failed:', error.message);
        }
    }

    async validateAllWorkflows() {
        console.log('\n⚡ Validating All N8N Workflows...');
        
        try {
            const response = await axios.get(`${this.n8nApiUrl}/api/v1/workflows`, {
                headers: { 'X-N8N-API-KEY': this.apiKey }
            });
            
            const workflows = response.data.data || [];
            this.testResults.workflows = {
                total_count: workflows.length,
                workflows: [],
                validation_summary: {
                    valid: 0,
                    invalid: 0,
                    active: 0,
                    inactive: 0
                }
            };
            
            console.log(`📊 Found ${workflows.length} workflows to validate`);
            
            for (const workflow of workflows) {
                console.log(`\n🔍 Validating workflow: ${workflow.name}`);
                
                const validation = await this.validateSingleWorkflow(workflow);
                this.testResults.workflows.workflows.push(validation);
                
                // Update summary
                if (validation.is_valid) {
                    this.testResults.workflows.validation_summary.valid++;
                } else {
                    this.testResults.workflows.validation_summary.invalid++;
                }
                
                if (workflow.active) {
                    this.testResults.workflows.validation_summary.active++;
                } else {
                    this.testResults.workflows.validation_summary.inactive++;
                }
            }
            
            console.log(`\n📈 Workflow Validation Summary:`);
            console.log(`   Valid: ${this.testResults.workflows.validation_summary.valid}`);
            console.log(`   Invalid: ${this.testResults.workflows.validation_summary.invalid}`);
            console.log(`   Active: ${this.testResults.workflows.validation_summary.active}`);
            console.log(`   Inactive: ${this.testResults.workflows.validation_summary.inactive}`);
            
        } catch (error) {
            console.error('❌ Workflow validation failed:', error.message);
            this.testResults.workflows = {
                status: 'failed',
                error: error.message
            };
        }
    }

    async validateSingleWorkflow(workflow) {
        const validation = {
            id: workflow.id,
            name: workflow.name,
            active: workflow.active,
            nodes_count: workflow.nodes?.length || 0,
            connections_count: Object.keys(workflow.connections || {}).length,
            is_valid: true,
            issues: [],
            recommendations: []
        };
        
        // Check for common issues
        if (workflow.nodes && workflow.nodes.length === 0) {
            validation.is_valid = false;
            validation.issues.push('Workflow has no nodes');
        }
        
        if (workflow.nodes) {
            // Check for webhook nodes
            const webhookNodes = workflow.nodes.filter(node => 
                node.type === 'n8n-nodes-base.webhook'
            );
            
            if (webhookNodes.length > 0) {
                validation.webhook_endpoints = webhookNodes.map(node => ({
                    path: node.parameters?.path || 'undefined',
                    method: node.parameters?.httpMethod || 'GET'
                }));
                
                console.log(`   🔗 Found ${webhookNodes.length} webhook endpoint(s)`);
            }
            
            // Check for credential nodes
            const credentialNodes = workflow.nodes.filter(node => 
                node.credentials && Object.keys(node.credentials).length > 0
            );
            
            if (credentialNodes.length > 0) {
                validation.credential_dependencies = credentialNodes.map(node => ({
                    node_name: node.name,
                    credentials: Object.keys(node.credentials)
                }));
                
                console.log(`   🔑 Found ${credentialNodes.length} node(s) with credentials`);
            }
        }
        
        // Performance recommendations
        if (validation.nodes_count > 20) {
            validation.recommendations.push('Consider breaking down large workflow into smaller components');
        }
        
        if (!workflow.active) {
            validation.recommendations.push('Consider activating workflow for production use');
        }
        
        console.log(`   ${validation.is_valid ? '✅' : '❌'} ${workflow.name} - ${validation.nodes_count} nodes`);
        
        return validation;
    }

    async validateAllCredentials() {
        console.log('\n🔐 Validating All N8N Credentials...');
        
        try {
            const response = await axios.get(`${this.n8nApiUrl}/api/v1/credentials`, {
                headers: { 'X-N8N-API-KEY': this.apiKey }
            });
            
            const credentials = response.data.data || [];
            this.testResults.credentials = {
                total_count: credentials.length,
                credentials: [],
                by_type: {}
            };
            
            console.log(`🔑 Found ${credentials.length} credentials to validate`);
            
            for (const credential of credentials) {
                const validation = {
                    id: credential.id,
                    name: credential.name,
                    type: credential.type,
                    status: 'configured',
                    created_at: credential.createdAt,
                    updated_at: credential.updatedAt
                };
                
                // Count by type
                if (!this.testResults.credentials.by_type[credential.type]) {
                    this.testResults.credentials.by_type[credential.type] = 0;
                }
                this.testResults.credentials.by_type[credential.type]++;
                
                this.testResults.credentials.credentials.push(validation);
                console.log(`   ✅ ${credential.name} (${credential.type})`);
            }
            
            console.log(`\n📊 Credentials by Type:`);
            Object.entries(this.testResults.credentials.by_type).forEach(([type, count]) => {
                console.log(`   ${type}: ${count}`);
            });
            
        } catch (error) {
            console.error('❌ Credential validation failed:', error.message);
            this.testResults.credentials = {
                status: 'failed',
                error: error.message
            };
        }
    }

    async testWebhookEndpoints() {
        console.log('\n🎯 Testing Webhook Endpoints...');
        
        const testEndpoints = [
            {
                name: 'Spotify Data Processing',
                path: '/webhook/spotify-data-processing',
                method: 'POST',
                testData: {
                    user_id: 'test_user',
                    tracks: [{
                        id: 'test_track_123',
                        name: 'Test Song',
                        artist: 'Test Artist'
                    }]
                }
            },
            {
                name: 'AI Recommendations',
                path: '/webhook/get-recommendations',
                method: 'POST',
                testData: {
                    user_id: 'test_user',
                    preferences: {
                        mood: 'energetic',
                        genres: ['rock', 'pop']
                    }
                }
            },
            {
                name: 'Coding Agent',
                path: '/webhook/coding-agent',
                method: 'POST',
                testData: {
                    request: 'Create a simple Python function that calculates fibonacci numbers',
                    technology: 'python'
                }
            },
            {
                name: 'Multimodal AI Agent',
                path: '/webhook/multimodal-ai-agent',
                method: 'POST',
                testData: {
                    prompt: 'Analyze this text and provide insights',
                    type: 'text'
                }
            },
            {
                name: 'Perplexity Research',
                path: '/webhook/perplexity-browser-research',
                method: 'POST',
                testData: {
                    research_topic: 'Latest trends in AI automation workflows'
                }
            }
        ];
        
        this.testResults.webhook_tests = [];
        
        for (const endpoint of testEndpoints) {
            console.log(`\n🎯 Testing ${endpoint.name}...`);
            
            try {
                const start = Date.now();
                const response = await axios({
                    method: endpoint.method,
                    url: `${this.n8nApiUrl}${endpoint.path}`,
                    data: endpoint.testData,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000,
                    validateStatus: () => true // Accept any status code
                });
                
                const responseTime = Date.now() - start;
                
                const testResult = {
                    endpoint: endpoint.name,
                    path: endpoint.path,
                    method: endpoint.method,
                    status_code: response.status,
                    response_time: responseTime,
                    success: response.status < 400,
                    response_size: JSON.stringify(response.data).length,
                    timestamp: new Date().toISOString()
                };
                
                if (response.status === 404) {
                    testResult.note = 'Endpoint not found - workflow may not be active';
                    console.log(`   ⚠️  ${endpoint.name}: 404 Not Found (workflow inactive?)`);
                } else if (response.status < 400) {
                    testResult.note = 'Endpoint responding successfully';
                    console.log(`   ✅ ${endpoint.name}: ${response.status} (${responseTime}ms)`);
                } else {
                    testResult.note = `HTTP ${response.status} error`;
                    console.log(`   ❌ ${endpoint.name}: ${response.status} (${responseTime}ms)`);
                }
                
                this.testResults.webhook_tests.push(testResult);
                
            } catch (error) {
                const testResult = {
                    endpoint: endpoint.name,
                    path: endpoint.path,
                    method: endpoint.method,
                    status_code: 0,
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                };
                
                this.testResults.webhook_tests.push(testResult);
                console.log(`   ❌ ${endpoint.name}: ${error.message}`);
            }
            
            // Delay between tests
            await this.delay(1000);
        }
    }

    async performPerformanceTests() {
        console.log('\n⚡ Performing Performance Tests...');
        
        const performanceTests = [
            {
                name: 'API Response Time',
                test: async () => {
                    const start = Date.now();
                    await axios.get(`${this.n8nApiUrl}/healthz`);
                    return Date.now() - start;
                }
            },
            {
                name: 'Workflow List Performance',
                test: async () => {
                    const start = Date.now();
                    await axios.get(`${this.n8nApiUrl}/api/v1/workflows`, {
                        headers: { 'X-N8N-API-KEY': this.apiKey }
                    });
                    return Date.now() - start;
                }
            },
            {
                name: 'Credentials List Performance',
                test: async () => {
                    const start = Date.now();
                    await axios.get(`${this.n8nApiUrl}/api/v1/credentials`, {
                        headers: { 'X-N8N-API-KEY': this.apiKey }
                    });
                    return Date.now() - start;
                }
            }
        ];
        
        this.performanceMetrics = {};
        
        for (const perfTest of performanceTests) {
            console.log(`\n⏱️  Testing ${perfTest.name}...`);
            
            const results = [];
            
            // Run test 5 times for average
            for (let i = 0; i < 5; i++) {
                try {
                    const responseTime = await perfTest.test();
                    results.push(responseTime);
                    console.log(`   Run ${i + 1}: ${responseTime}ms`);
                } catch (error) {
                    console.error(`   Run ${i + 1}: Error - ${error.message}`);
                    results.push(-1);
                }
                
                await this.delay(500);
            }
            
            const validResults = results.filter(r => r > 0);
            if (validResults.length > 0) {
                this.performanceMetrics[perfTest.name] = {
                    runs: validResults.length,
                    average: Math.round(validResults.reduce((a, b) => a + b, 0) / validResults.length),
                    min: Math.min(...validResults),
                    max: Math.max(...validResults),
                    all_results: validResults
                };
                
                console.log(`   📊 Average: ${this.performanceMetrics[perfTest.name].average}ms`);
                console.log(`   📊 Range: ${this.performanceMetrics[perfTest.name].min}ms - ${this.performanceMetrics[perfTest.name].max}ms`);
            }
        }
    }

    async generateValidationReport() {
        console.log('\n📊 Generating Comprehensive Validation Report...');
        
        const timestamp = new Date().toISOString();
        
        this.validationReport = {
            validation_session_id: `n8n_validation_${Date.now()}`,
            generated_at: timestamp,
            server_info: {
                url: this.n8nApiUrl,
                connection_status: this.testResults.server_connection?.status || 'unknown'
            },
            
            summary: {
                total_workflows: this.testResults.workflows?.total_count || 0,
                valid_workflows: this.testResults.workflows?.validation_summary?.valid || 0,
                active_workflows: this.testResults.workflows?.validation_summary?.active || 0,
                total_credentials: this.testResults.credentials?.total_count || 0,
                webhook_endpoints_tested: this.testResults.webhook_tests?.length || 0,
                successful_webhook_tests: this.testResults.webhook_tests?.filter(t => t.success).length || 0
            },
            
            detailed_results: {
                server_connection: this.testResults.server_connection,
                workflow_validation: this.testResults.workflows,
                credential_validation: this.testResults.credentials,
                webhook_endpoint_tests: this.testResults.webhook_tests,
                performance_metrics: this.performanceMetrics
            },
            
            recommendations: this.generateRecommendations(),
            
            overall_status: this.determineOverallStatus()
        };
        
        console.log('\n📈 Validation Summary:');
        console.log(`   Server Connection: ${this.validationReport.server_info.connection_status}`);
        console.log(`   Workflows: ${this.validationReport.summary.valid_workflows}/${this.validationReport.summary.total_workflows} valid`);
        console.log(`   Active Workflows: ${this.validationReport.summary.active_workflows}`);
        console.log(`   Credentials: ${this.validationReport.summary.total_credentials} configured`);
        console.log(`   Webhook Tests: ${this.validationReport.summary.successful_webhook_tests}/${this.validationReport.summary.webhook_endpoints_tested} successful`);
        console.log(`   Overall Status: ${this.validationReport.overall_status}`);
        
        return this.validationReport;
    }

    generateRecommendations() {
        const recommendations = [];
        
        // Server connection recommendations
        if (this.testResults.server_connection?.status === 'failed') {
            recommendations.push({
                category: 'server_connection',
                priority: 'high',
                recommendation: 'Fix server connection issues before proceeding with workflow development'
            });
        }
        
        // Workflow recommendations
        if (this.testResults.workflows?.validation_summary?.inactive > 0) {
            recommendations.push({
                category: 'workflows',
                priority: 'medium',
                recommendation: `${this.testResults.workflows.validation_summary.inactive} workflows are inactive - consider activating for production use`
            });
        }
        
        // Webhook recommendations
        const failedWebhooks = this.testResults.webhook_tests?.filter(t => !t.success).length || 0;
        if (failedWebhooks > 0) {
            recommendations.push({
                category: 'webhooks',
                priority: 'high',
                recommendation: `${failedWebhooks} webhook endpoints failed testing - activate workflows and verify configurations`
            });
        }
        
        // Performance recommendations
        if (this.performanceMetrics['API Response Time']?.average > 1000) {
            recommendations.push({
                category: 'performance',
                priority: 'medium',
                recommendation: 'API response times are slow - consider server optimization'
            });
        }
        
        return recommendations;
    }

    determineOverallStatus() {
        const serverOk = this.testResults.server_connection?.status === 'success';
        const workflowsValid = (this.testResults.workflows?.validation_summary?.valid || 0) > 0;
        const credentialsConfigured = (this.testResults.credentials?.total_count || 0) > 0;
        const someWebhooksWorking = (this.testResults.webhook_tests?.filter(t => t.success).length || 0) > 0;
        
        if (!serverOk) return 'critical';
        if (workflowsValid && credentialsConfigured && someWebhooksWorking) return 'healthy';
        if (workflowsValid && credentialsConfigured) return 'warning';
        return 'needs_attention';
    }

    async saveValidationResults() {
        console.log('\n💾 Saving Validation Results...');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportsDir = path.join(__dirname, '../reports');
        
        await fs.mkdir(reportsDir, { recursive: true });
        
        // Save validation report
        await fs.writeFile(
            path.join(reportsDir, `n8n-validation-report-${timestamp}.json`),
            JSON.stringify(this.validationReport, null, 2)
        );
        
        // Generate markdown report
        const markdownReport = this.generateMarkdownReport();
        await fs.writeFile(
            path.join(reportsDir, `n8n-validation-report-${timestamp}.md`),
            markdownReport
        );
        
        console.log(`✅ Validation results saved:`);
        console.log(`   📄 n8n-validation-report-${timestamp}.json`);
        console.log(`   📄 n8n-validation-report-${timestamp}.md`);
    }

    generateMarkdownReport() {
        const report = this.validationReport;
        
        return `# N8N Validation Report

**Generated:** ${report.generated_at}
**Session ID:** ${report.validation_session_id}
**Server:** ${report.server_info.url}
**Overall Status:** ${report.overall_status.toUpperCase()}

## Summary

- **Total Workflows:** ${report.summary.total_workflows}
- **Valid Workflows:** ${report.summary.valid_workflows}
- **Active Workflows:** ${report.summary.active_workflows}
- **Total Credentials:** ${report.summary.total_credentials}
- **Webhook Tests:** ${report.summary.successful_webhook_tests}/${report.summary.webhook_endpoints_tested} successful

## Server Connection

- **Status:** ${report.detailed_results.server_connection?.status || 'unknown'}
- **Response Time:** ${report.detailed_results.server_connection?.response_time || 'N/A'}ms

## Workflow Validation

${report.detailed_results.workflow_validation?.workflows?.map(w => `
### ${w.name}
- **Status:** ${w.is_valid ? '✅ Valid' : '❌ Invalid'}
- **Active:** ${w.active ? 'Yes' : 'No'}
- **Nodes:** ${w.nodes_count}
- **Webhook Endpoints:** ${w.webhook_endpoints?.length || 0}
- **Issues:** ${w.issues?.join(', ') || 'None'}
`).join('\n') || 'No workflows found'}

## Webhook Endpoint Tests

${report.detailed_results.webhook_endpoint_tests?.map(test => `
### ${test.endpoint}
- **Path:** ${test.path}
- **Status:** ${test.success ? '✅ Success' : '❌ Failed'}
- **Response Code:** ${test.status_code}
- **Response Time:** ${test.response_time || 'N/A'}ms
- **Note:** ${test.note || test.error || 'N/A'}
`).join('\n') || 'No webhook tests performed'}

## Performance Metrics

${Object.entries(report.detailed_results.performance_metrics || {}).map(([name, metrics]) => `
### ${name}
- **Average:** ${metrics.average}ms
- **Min:** ${metrics.min}ms
- **Max:** ${metrics.max}ms
- **Runs:** ${metrics.runs}
`).join('\n')}

## Recommendations

${report.recommendations?.map(rec => `
### ${rec.category.toUpperCase()} - ${rec.priority.toUpperCase()} Priority
${rec.recommendation}
`).join('\n') || 'No specific recommendations'}

---

*This validation report was generated by the Advanced N8N Validation Suite*
`;
    }

    async runCompleteValidation() {
        console.log('🚀 Starting Complete N8N Validation Suite');
        console.log('=' .repeat(80));
        
        try {
            // Run all validation tests
            await this.validateN8nServerConnection();
            await this.validateAllWorkflows();
            await this.validateAllCredentials();
            await this.testWebhookEndpoints();
            await this.performPerformanceTests();
            
            // Generate report
            await this.generateValidationReport();
            await this.saveValidationResults();
            
            console.log('\n🎉 VALIDATION SUITE COMPLETED');
            console.log('=' .repeat(80));
            console.log(`✅ Overall Status: ${this.validationReport.overall_status.toUpperCase()}`);
            console.log('📊 Comprehensive validation report generated');
            console.log('💾 Results saved to reports/ directory');
            
            return this.validationReport;
            
        } catch (error) {
            console.error('❌ Validation suite failed:', error);
            throw error;
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run if executed directly
if (require.main === module) {
    const validator = new AdvancedN8nValidationSuite();
    validator.runCompleteValidation().catch(console.error);
}

module.exports = AdvancedN8nValidationSuite;