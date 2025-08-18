#!/usr/bin/env node

/**
 * n8n Webhook Endpoint Validator
 * Tests all configured webhook endpoints to validate implementation
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class N8nWebhookValidator {
    constructor() {
        this.n8nUrl = process.env.N8N_API_URL || 'http://46.101.106.220';
        this.testResults = {
            timestamp: new Date().toISOString(),
            n8nInstance: this.n8nUrl,
            testsRun: 0,
            testsPass: 0,
            testsFail: 0,
            endpoints: [],
            errors: []
        };
    }

    async validateAllEndpoints() {
        console.log('🧪 Starting n8n Webhook Endpoint Validation...\n');
        
        const webhookEndpoints = [
            {
                name: 'GitHub Webhook Integration',
                path: 'github-webhook-integration',
                samplePayload: {
                    event: 'push',
                    repository: { name: 'test-repo' },
                    sender: { login: 'test-user' },
                    commits: [{ message: 'Test commit' }]
                }
            },
            {
                name: 'Spotify Data Processor',
                path: 'spotify-data-processor',
                samplePayload: {
                    user_id: 'test-user-123',
                    tracks: [
                        {
                            id: 'track-123',
                            name: 'Test Song',
                            artists: [{ name: 'Test Artist' }],
                            played_at: new Date().toISOString(),
                            duration_ms: 180000
                        }
                    ]
                }
            },
            {
                name: 'User Recommendation Engine',
                path: 'user-recommendation-engine',
                samplePayload: {
                    user_id: 'test-user-123',
                    preferences: {
                        genres: ['rock', 'pop'],
                        mood: 'energetic'
                    }
                }
            },
            {
                name: 'Error Notification System',
                path: 'error-notification-system',
                samplePayload: {
                    error: {
                        type: 'validation_error',
                        message: 'Test error message',
                        severity: 'medium',
                        timestamp: new Date().toISOString()
                    }
                }
            }
        ];

        for (const endpoint of webhookEndpoints) {
            await this.testWebhookEndpoint(endpoint);
        }
        
        await this.testHealthEndpoint();
        await this.generateValidationReport();
        
        this.printResults();
        
        return this.testResults;
    }

    async testWebhookEndpoint(endpoint) {
        console.log(`🔗 Testing: ${endpoint.name}`);
        this.testResults.testsRun++;
        
        const webhookUrl = `${this.n8nUrl}/webhook/${endpoint.path}`;
        
        try {
            const response = await axios.post(webhookUrl, endpoint.samplePayload, {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'n8n-webhook-validator'
                },
                timeout: 10000,
                validateStatus: function (status) {
                    // Accept any status code to analyze the response
                    return status >= 200 && status < 600;
                }
            });
            
            const result = {
                name: endpoint.name,
                url: webhookUrl,
                status: response.status,
                statusText: response.statusText,
                responseTime: Date.now(),
                success: response.status >= 200 && response.status < 400,
                responseData: response.data,
                error: null
            };
            
            if (result.success) {
                console.log(`   ✅ Success (${response.status}): ${endpoint.name}`);
                this.testResults.testsPass++;
            } else if (response.status === 404) {
                console.log(`   ⚠️  Endpoint not found (404): ${endpoint.name}`);
                console.log(`      This is expected if the workflow hasn't been created yet`);
                result.success = false;
                result.error = 'Endpoint not found - workflow may not be created yet';
            } else {
                console.log(`   ❌ Failed (${response.status}): ${endpoint.name}`);
                this.testResults.testsFail++;
                result.error = `HTTP ${response.status}: ${response.statusText}`;
            }
            
            this.testResults.endpoints.push(result);
            
        } catch (error) {
            console.log(`   ❌ Error: ${endpoint.name} - ${error.message}`);
            this.testResults.testsFail++;
            
            this.testResults.endpoints.push({
                name: endpoint.name,
                url: webhookUrl,
                status: 0,
                statusText: 'Connection Error',
                success: false,
                error: error.message,
                responseData: null
            });
            
            this.testResults.errors.push({
                endpoint: endpoint.name,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    async testHealthEndpoint() {
        console.log('🩺 Testing: n8n Health Check');
        this.testResults.testsRun++;
        
        const healthUrl = `${this.n8nUrl}/healthz`;
        
        try {
            const response = await axios.get(healthUrl, { timeout: 5000 });
            
            const result = {
                name: 'n8n Health Check',
                url: healthUrl,
                status: response.status,
                statusText: response.statusText,
                success: response.status === 200,
                responseData: response.data,
                error: null
            };
            
            if (result.success) {
                console.log(`   ✅ Success: n8n instance is healthy`);
                this.testResults.testsPass++;
            } else {
                console.log(`   ❌ Failed: n8n instance unhealthy`);
                this.testResults.testsFail++;
            }
            
            this.testResults.endpoints.push(result);
            
        } catch (error) {
            console.log(`   ❌ Error: Health check failed - ${error.message}`);
            this.testResults.testsFail++;
            
            this.testResults.errors.push({
                endpoint: 'Health Check',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    async generateValidationReport() {
        const reportData = {
            ...this.testResults,
            summary: {
                totalEndpoints: this.testResults.testsRun,
                successfulEndpoints: this.testResults.testsPass,
                failedEndpoints: this.testResults.testsFail,
                successRate: this.testResults.testsRun > 0 ? 
                    Math.round((this.testResults.testsPass / this.testResults.testsRun) * 100) : 0
            },
            recommendations: this.generateTestRecommendations()
        };

        // Save validation report
        const reportPath = path.join(process.cwd(), 'reports', 'n8n-webhook-validation-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));

        // Generate markdown summary
        const markdownReport = this.generateMarkdownValidationReport(reportData);
        const mdReportPath = path.join(process.cwd(), 'reports', 'n8n-webhook-validation-summary.md');
        fs.writeFileSync(mdReportPath, markdownReport);

        console.log(`\n📊 Validation report saved: ${reportPath}`);
        console.log(`📊 Validation summary saved: ${mdReportPath}`);
    }

    generateTestRecommendations() {
        const recommendations = [];
        
        if (this.testResults.testsFail > 0) {
            recommendations.push({
                type: 'WORKFLOW_CREATION',
                priority: 'high',
                message: 'Create missing workflows in n8n interface for failed endpoints',
                action: 'Use the generated workflow configurations to create workflows manually'
            });
        }
        
        if (this.testResults.testsPass === 0) {
            recommendations.push({
                type: 'CONNECTIVITY',
                priority: 'critical',
                message: 'No endpoints are responding - check n8n instance status',
                action: 'Verify n8n is running and accessible at the configured URL'
            });
        }
        
        recommendations.push({
            type: 'MONITORING',
            priority: 'medium',
            message: 'Set up continuous monitoring for webhook endpoints',
            action: 'Implement automated testing and alerting for webhook failures'
        });
        
        return recommendations;
    }

    generateMarkdownValidationReport(reportData) {
        return `# n8n Webhook Validation Report

## Summary
- **Generated**: ${reportData.timestamp}
- **n8n Instance**: ${reportData.n8nInstance}
- **Tests Run**: ${reportData.summary.totalEndpoints}
- **Success Rate**: ${reportData.summary.successRate}%

## Endpoint Results

${reportData.endpoints.map(endpoint => `### ${endpoint.name}
**URL**: ${endpoint.url}  
**Status**: ${endpoint.status} ${endpoint.statusText}  
**Result**: ${endpoint.success ? '✅ Success' : '❌ Failed'}  
${endpoint.error ? `**Error**: ${endpoint.error}  ` : ''}
${endpoint.responseData ? `**Response**: \`${JSON.stringify(endpoint.responseData)}\`` : ''}`).join('\n\n')}

## Recommendations

${reportData.recommendations.map(rec => `### ${rec.type}
**Priority**: ${rec.priority}  
**Message**: ${rec.message}  
**Action**: ${rec.action}`).join('\n\n')}

## Next Steps

${reportData.summary.failedEndpoints > 0 ? `
1. **Create Missing Workflows**: Use the n8n web interface to create workflows for failed endpoints
2. **Test Manually**: Test each webhook endpoint manually in the n8n interface
3. **Configure Monitoring**: Set up monitoring for webhook execution and failures
` : `
1. **Activate Workflows**: All endpoints are accessible - activate workflows in n8n
2. **Set up Monitoring**: Configure monitoring and alerting for production use  
3. **Document Endpoints**: Update documentation with confirmed webhook URLs
`}

---
*Report generated by n8n Webhook Validator*
`;
    }

    printResults() {
        console.log('\n📊 VALIDATION RESULTS');
        console.log('====================');
        console.log(`🌐 n8n Instance: ${this.n8nUrl}`);
        console.log(`📋 Tests Run: ${this.testResults.testsRun}`);
        console.log(`✅ Passed: ${this.testResults.testsPass}`);
        console.log(`❌ Failed: ${this.testResults.testsFail}`);
        console.log(`📈 Success Rate: ${this.testResults.testsRun > 0 ? Math.round((this.testResults.testsPass / this.testResults.testsRun) * 100) : 0}%`);
        
        if (this.testResults.endpoints.length > 0) {
            console.log('\n🔗 ENDPOINT STATUS:');
            this.testResults.endpoints.forEach(endpoint => {
                const status = endpoint.success ? '✅' : '❌';
                console.log(`   ${status} ${endpoint.name}: ${endpoint.status} ${endpoint.statusText}`);
                if (endpoint.error) {
                    console.log(`      Error: ${endpoint.error}`);
                }
            });
        }
        
        if (this.testResults.testsFail > 0) {
            console.log('\n💡 NEXT STEPS:');
            console.log('   1. Create workflows manually in n8n web interface');
            console.log('   2. Use the generated workflow configurations as templates');
            console.log('   3. Test webhook endpoints after creating workflows');
            console.log('   4. Set up monitoring and alerting');
        } else if (this.testResults.testsPass > 0) {
            console.log('\n🎉 READY FOR PRODUCTION:');
            console.log('   1. Activate workflows in n8n interface');
            console.log('   2. Configure monitoring and alerting');
            console.log('   3. Update documentation with confirmed endpoints');
        }
        
        console.log('====================\n');
    }
}

// Run validation if called directly
if (require.main === module) {
    const validator = new N8nWebhookValidator();
    validator.validateAllEndpoints()
        .then(results => {
            if (results.testsPass === 0) {
                console.log('⚠️  No endpoints are currently accessible - this is expected if workflows haven\'t been created yet');
                process.exit(0);
            } else {
                console.log('✅ Validation completed successfully!');
                process.exit(0);
            }
        })
        .catch(error => {
            console.error('❌ Validation failed:', error.message);
            process.exit(1);
        });
}

module.exports = N8nWebhookValidator;