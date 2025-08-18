#!/usr/bin/env node

/**
 * Comprehensive n8n Implementation Report Generator
 * Consolidates all analysis, configuration, and automation results
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

class N8nImplementationReporter {
    constructor() {
        this.n8nUrl = process.env.N8N_API_URL || 'https://primosphere.ninja';
        this.reportsDir = path.join(process.cwd(), 'reports');
        
        this.consolidatedReport = {
            meta: {
                generated: new Date().toISOString(),
                generator: 'n8n-implementation-reporter',
                version: '1.0.0'
            },
            summary: {
                n8nInstance: this.n8nUrl,
                status: 'unknown',
                phase: 'analysis_and_configuration',
                overallSuccess: false
            },
            analysis: {},
            configuration: {},
            automation: {},
            templates: [],
            workflows: {
                existing: [],
                configured: [],
                created: [],
                failed: []
            },
            integrations: {
                github: { status: 'pending', reason: 'missing_token' },
                mcpServers: [],
                tools: []
            },
            communityNodes: {
                supercode: {
                    enabled: process.env.N8N_SUPERCODE_ENABLED === 'true',
                    version: 'v1.0.83',
                    nodes: ['Super Code', 'Super Code Tool'],
                    capabilities: ['Enhanced JavaScript/TypeScript execution', 'Advanced code processing']
                },
                deepseek: {
                    enabled: process.env.N8N_DEEPSEEK_ENABLED === 'true', 
                    version: 'v1.0.6',
                    nodes: ['DeepSeek'],
                    capabilities: ['AI code generation', 'Code completion', 'Code analysis']
                },
                mcp: {
                    enabled: process.env.N8N_MCP_CLIENT_ENABLED === 'true',
                    nodes: ['MCP Client'],
                    capabilities: ['Model Context Protocol integration', 'Multi-server coordination'],
                    docs: 'https://modelcontextprotocol.io/docs/getting-started/intro'
                }
            },
            endpoints: [],
            errors: [],
            recommendations: [],
            nextSteps: []
        };
    }

    async generateComprehensiveReport() {
        console.log('📊 Generating Comprehensive n8n Implementation Report...\n');
        
        try {
            await this.loadExistingReports();
            await this.performFinalValidation();
            await this.consolidateFindings();
            await this.generateRecommendations();
            await this.saveConsolidatedReport();
            await this.printExecutiveSummary();
            
            console.log('✅ Comprehensive report generated successfully!');
            return this.consolidatedReport;
            
        } catch (error) {
            console.error('❌ Report generation failed:', error.message);
            this.consolidatedReport.errors.push({
                type: 'REPORT_GENERATION_ERROR',
                message: error.message,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    async loadExistingReports() {
        console.log('📂 Loading existing reports...');
        
        // Load configuration report
        try {
            const configReportPath = path.join(this.reportsDir, 'n8n-configuration-report.json');
            if (fs.existsSync(configReportPath)) {
                const configReport = JSON.parse(fs.readFileSync(configReportPath, 'utf8'));
                this.consolidatedReport.configuration = configReport;
                console.log('   ✅ Configuration report loaded');
            }
        } catch (error) {
            console.log('   ⚠️  Configuration report not found or invalid');
        }

        // Load browser automation report (if exists)
        try {
            const browserReportPath = path.join(this.reportsDir, 'n8n-browser-automation-report.json');
            if (fs.existsSync(browserReportPath)) {
                const browserReport = JSON.parse(fs.readFileSync(browserReportPath, 'utf8'));
                this.consolidatedReport.automation = browserReport;
                console.log('   ✅ Browser automation report loaded');
            }
        } catch (error) {
            console.log('   ⚠️  Browser automation report not found or invalid');
        }

        // Load any other relevant reports
        this.loadMCPReports();
    }

    loadMCPReports() {
        console.log('🔧 Loading MCP integration reports...');
        
        try {
            // Load MCP status report
            const mcpStatusPath = path.join(process.cwd(), 'mcp-status-report.json');
            if (fs.existsSync(mcpStatusPath)) {
                const mcpStatus = JSON.parse(fs.readFileSync(mcpStatusPath, 'utf8'));
                this.consolidatedReport.integrations.mcpServers = mcpStatus.servers || [];
                console.log(`   ✅ MCP status loaded: ${this.consolidatedReport.integrations.mcpServers.length} servers`);
            }
        } catch (error) {
            console.log('   ⚠️  MCP status report not found or invalid');
        }
    }

    async performFinalValidation() {
        console.log('🔍 Performing final validation...');
        
        // Test n8n connectivity one more time
        try {
            const response = await axios.get(`${this.n8nUrl}/healthz`, { timeout: 10000 });
            if (response.status === 200) {
                this.consolidatedReport.summary.status = 'online';
                console.log('   ✅ n8n instance is online');
            }
        } catch (error) {
            this.consolidatedReport.summary.status = 'offline';
            console.log('   ❌ n8n instance connectivity failed');
            this.consolidatedReport.errors.push({
                type: 'CONNECTIVITY_ERROR',
                message: `Final connectivity check failed: ${error.message}`,
                timestamp: new Date().toISOString()
            });
        }

        // Validate environment variables
        this.validateEnvironmentSetup();
        
        // Check file system artifacts
        this.validateFileSystemArtifacts();
    }

    validateEnvironmentSetup() {
        console.log('   🔧 Validating environment setup...');
        
        const requiredEnvVars = [
            'N8N_API_URL',
            'N8N_USERNAME', 
            'N8N_PASSWORD'
        ];
        
        const optionalEnvVars = [
            'N8N_API_KEY',
            'GITHUB_TOKEN',
            'OPENAI_API_KEY'
        ];
        
        const envStatus = {
            required: {},
            optional: {}
        };
        
        // Check required variables
        requiredEnvVars.forEach(varName => {
            const value = process.env[varName];
            envStatus.required[varName] = {
                present: !!value,
                configured: value && value !== 'undefined' && value !== ''
            };
        });
        
        // Check optional variables  
        optionalEnvVars.forEach(varName => {
            const value = process.env[varName];
            envStatus.optional[varName] = {
                present: !!value,
                configured: value && value !== 'undefined' && value !== ''
            };
        });
        
        this.consolidatedReport.analysis.environmentSetup = envStatus;
        
        const requiredMissing = Object.entries(envStatus.required)
            .filter(([key, status]) => !status.configured).length;
            
        if (requiredMissing === 0) {
            console.log('      ✅ All required environment variables configured');
        } else {
            console.log(`      ⚠️  ${requiredMissing} required environment variables missing`);
        }
    }

    validateFileSystemArtifacts() {
        console.log('   📁 Validating file system artifacts...');
        
        const expectedArtifacts = [
            { path: 'reports/n8n-configuration-report.json', type: 'configuration' },
            { path: 'reports/n8n-configuration-summary.md', type: 'summary' },
            { path: 'scripts/n8n-template-analyzer-configurator.js', type: 'script' },
            { path: 'scripts/n8n-browser-workflow-setup.js', type: 'automation' }
        ];
        
        const artifactStatus = [];
        
        expectedArtifacts.forEach(artifact => {
            const fullPath = path.join(process.cwd(), artifact.path);
            const exists = fs.existsSync(fullPath);
            
            artifactStatus.push({
                path: artifact.path,
                type: artifact.type,
                exists: exists,
                size: exists ? fs.statSync(fullPath).size : 0
            });
        });
        
        this.consolidatedReport.analysis.fileSystemArtifacts = artifactStatus;
        
        const missingArtifacts = artifactStatus.filter(a => !a.exists).length;
        console.log(`      📋 Artifacts: ${artifactStatus.length - missingArtifacts}/${artifactStatus.length} present`);
    }

    consolidateFindings() {
        console.log('🔄 Consolidating findings...');
        
        // Consolidate templates from configuration report
        if (this.consolidatedReport.configuration.templates) {
            this.consolidatedReport.templates = this.consolidatedReport.configuration.templates;
            console.log(`   📝 Templates: ${this.consolidatedReport.templates.length} analyzed`);
        }
        
        // Consolidate workflows
        if (this.consolidatedReport.configuration.workflows) {
            this.consolidatedReport.workflows.existing = this.consolidatedReport.configuration.workflows.existing || [];
            this.consolidatedReport.workflows.configured = this.consolidatedReport.configuration.workflows.created || [];
        }
        
        if (this.consolidatedReport.automation.workflowsCreated) {
            this.consolidatedReport.workflows.created = this.consolidatedReport.automation.workflowsCreated || [];
        }
        
        // Consolidate errors
        if (this.consolidatedReport.configuration.errorReport) {
            this.consolidatedReport.errors.push(...this.consolidatedReport.configuration.errorReport);
        }
        
        if (this.consolidatedReport.automation.errors) {
            this.consolidatedReport.errors.push(...this.consolidatedReport.automation.errors);
        }
        
        // Generate webhook endpoints list
        this.generateEndpointsList();
        
        // Calculate overall success
        this.calculateOverallSuccess();
        
        console.log('   ✅ Findings consolidated');
    }

    generateEndpointsList() {
        const endpoints = [];
        
        // Add webhook endpoints from configured workflows
        this.consolidatedReport.workflows.configured.forEach(workflow => {
            if (workflow.meta && workflow.meta.templateId) {
                const templateId = workflow.meta.templateId;
                if (templateId.includes('webhook') || workflow.nodes.some(n => n.type === 'n8n-nodes-base.webhook')) {
                    endpoints.push({
                        name: workflow.name,
                        type: 'webhook',
                        url: `${this.n8nUrl}/webhook/${templateId}`,
                        method: 'POST',
                        purpose: workflow.meta.description || 'Webhook endpoint'
                    });
                }
            }
        });
        
        // Add known API endpoints
        endpoints.push(
            {
                name: 'n8n API Base',
                type: 'api',
                url: `${this.n8nUrl}/api/v1/`,
                method: 'GET/POST',
                purpose: 'n8n REST API access'
            },
            {
                name: 'n8n Health Check',
                type: 'health',
                url: `${this.n8nUrl}/healthz`,
                method: 'GET',
                purpose: 'Health monitoring'
            },
            {
                name: 'n8n Web Interface',
                type: 'web',
                url: this.n8nUrl,
                method: 'GET',
                purpose: 'Web-based workflow management'
            }
        );
        
        this.consolidatedReport.endpoints = endpoints;
    }

    calculateOverallSuccess() {
        let successScore = 0;
        const maxScore = 100;
        
        // n8n connectivity (20 points)
        if (this.consolidatedReport.summary.status === 'online') {
            successScore += 20;
        }
        
        // Template analysis (20 points)
        if (this.consolidatedReport.templates.length >= 5) {
            successScore += 20;
        } else {
            successScore += (this.consolidatedReport.templates.length * 4);
        }
        
        // Workflow configuration (25 points)
        if (this.consolidatedReport.workflows.configured.length >= 3) {
            successScore += 25;
        } else {
            successScore += (this.consolidatedReport.workflows.configured.length * 8);
        }
        
        // Environment setup (15 points)
        const envSetup = this.consolidatedReport.analysis.environmentSetup;
        if (envSetup && envSetup.required) {
            const requiredConfigured = Object.values(envSetup.required).filter(s => s.configured).length;
            const totalRequired = Object.keys(envSetup.required).length;
            successScore += Math.floor((requiredConfigured / totalRequired) * 15);
        }
        
        // Error handling (10 points) - less errors = more points
        const errorCount = this.consolidatedReport.errors.length;
        if (errorCount === 0) {
            successScore += 10;
        } else if (errorCount <= 2) {
            successScore += 5;
        }
        
        // File artifacts (10 points)
        const artifacts = this.consolidatedReport.analysis.fileSystemArtifacts;
        if (artifacts) {
            const presentArtifacts = artifacts.filter(a => a.exists).length;
            successScore += Math.floor((presentArtifacts / artifacts.length) * 10);
        }
        
        this.consolidatedReport.summary.overallSuccess = successScore >= 70;
        this.consolidatedReport.summary.successScore = successScore;
        this.consolidatedReport.summary.maxScore = maxScore;
    }

    generateRecommendations() {
        console.log('💡 Generating recommendations...');
        
        const recommendations = [];
        
        // API Authentication
        if (this.consolidatedReport.configuration.status?.authentication === 'failed') {
            recommendations.push({
                category: 'AUTHENTICATION',
                priority: 'high',
                title: 'Fix API Authentication',
                description: 'API authentication failed. Update or regenerate the n8n API key.',
                action: 'Navigate to n8n Settings > API Keys and generate a new key'
            });
        }
        
        // GitHub Integration
        if (!this.consolidatedReport.integrations.github.status || this.consolidatedReport.integrations.github.status === 'pending') {
            recommendations.push({
                category: 'INTEGRATION',
                priority: 'medium',
                title: 'Enable GitHub Integration',
                description: 'Add GITHUB_TOKEN environment variable for automated GitHub workflow integration.',
                action: 'Set GITHUB_TOKEN in .env file with a valid GitHub Personal Access Token'
            });
        }
        
        // Workflow Testing
        recommendations.push({
            category: 'TESTING',
            priority: 'high',
            title: 'Test Configured Workflows',
            description: 'Test all configured workflows before activating them in production.',
            action: 'Use n8n interface to manually execute workflows and verify functionality'
        });
        
        // Monitoring Setup
        recommendations.push({
            category: 'MONITORING',
            priority: 'high',
            title: 'Set Up Monitoring',
            description: 'Implement monitoring and alerting for workflow executions and failures.',
            action: 'Configure webhook notifications and error handling in each workflow'
        });
        
        // Documentation
        recommendations.push({
            category: 'DOCUMENTATION',
            priority: 'medium',
            title: 'Document Endpoints',
            description: 'Create documentation for all webhook endpoints and API integrations.',
            action: 'Document all webhook URLs, expected payloads, and response formats'
        });
        
        // Security
        recommendations.push({
            category: 'SECURITY',
            priority: 'high',
            title: 'Secure Webhook Endpoints',
            description: 'Add authentication and validation to webhook endpoints.',
            action: 'Implement webhook signature verification and rate limiting'
        });
        
        this.consolidatedReport.recommendations = recommendations;
        console.log(`   💡 ${recommendations.length} recommendations generated`);
    }

    async saveConsolidatedReport() {
        console.log('💾 Saving consolidated report...');
        
        // Save JSON report
        const jsonReportPath = path.join(this.reportsDir, 'n8n-implementation-comprehensive-report.json');
        fs.writeFileSync(jsonReportPath, JSON.stringify(this.consolidatedReport, null, 2));
        
        // Generate and save markdown report
        const markdownReport = this.generateMarkdownReport();
        const mdReportPath = path.join(this.reportsDir, 'n8n-implementation-comprehensive-report.md');
        fs.writeFileSync(mdReportPath, markdownReport);
        
        console.log(`   ✅ JSON report saved: ${jsonReportPath}`);
        console.log(`   ✅ Markdown report saved: ${mdReportPath}`);
    }

    generateMarkdownReport() {
        return `# Comprehensive n8n Implementation Report

## Executive Summary

**Generated**: ${this.consolidatedReport.meta.generated}  
**n8n Instance**: ${this.consolidatedReport.summary.n8nInstance}  
**Status**: ${this.consolidatedReport.summary.status}  
**Overall Success**: ${this.consolidatedReport.summary.overallSuccess ? '✅ Success' : '⚠️ Partial Success'} (${this.consolidatedReport.summary.successScore}/${this.consolidatedReport.summary.maxScore})

## Implementation Overview

### Templates Analyzed: ${this.consolidatedReport.templates.length}
${this.consolidatedReport.templates.map(t => `- **${t.name}** (${t.priority}): ${t.description}`).join('\n')}

### Workflows Status
- **Existing**: ${this.consolidatedReport.workflows.existing.length}
- **Configured**: ${this.consolidatedReport.workflows.configured.length}
- **Created via Browser**: ${this.consolidatedReport.workflows.created.length}
- **Failed**: ${this.consolidatedReport.workflows.failed.length}

### Integration Status
- **GitHub**: ${this.consolidatedReport.integrations.github.status || 'pending'} ${this.consolidatedReport.integrations.github.reason ? `(${this.consolidatedReport.integrations.github.reason})` : ''}
- **MCP Servers**: ${this.consolidatedReport.integrations.mcpServers.length} configured
- **Other Tools**: ${this.consolidatedReport.integrations.tools.length} configured

## Available Endpoints

${this.consolidatedReport.endpoints.map(e => `### ${e.name}
**Type**: ${e.type}  
**URL**: ${e.url}  
**Method**: ${e.method}  
**Purpose**: ${e.purpose}`).join('\n\n')}

## Critical Recommendations

${this.consolidatedReport.recommendations.filter(r => r.priority === 'high').map(r => `### ${r.category}: ${r.title}
**Priority**: ${r.priority}  
**Description**: ${r.description}  
**Action**: ${r.action}`).join('\n\n')}

## Error Summary

${this.consolidatedReport.errors.length === 0 ? 'No critical errors encountered.' : 
  this.consolidatedReport.errors.map(e => `### ${e.type}
**Time**: ${e.timestamp}  
**Message**: ${e.message}`).join('\n\n')}

## Next Steps

1. **Immediate Actions**:
   - Fix API authentication issues
   - Test all configured workflows
   - Implement monitoring and alerting

2. **Short-term (1-2 weeks)**:
   - Set up GitHub integration
   - Document all endpoints
   - Implement security measures

3. **Long-term (1 month)**:
   - Optimize workflow performance  
   - Set up advanced monitoring
   - Create workflow templates library

## Verification Checklist

- [ ] n8n instance is accessible
- [ ] API authentication is working
- [ ] All priority workflows are configured
- [ ] Webhook endpoints are documented
- [ ] Monitoring is set up
- [ ] Security measures are in place
- [ ] GitHub integration is active
- [ ] All errors are resolved

## Support Information

**Configuration Files Generated**:
- \`reports/n8n-configuration-report.json\` - Detailed configuration data
- \`reports/n8n-configuration-summary.md\` - Human-readable summary
- \`scripts/n8n-template-analyzer-configurator.js\` - Main configuration script
- \`scripts/n8n-browser-workflow-setup.js\` - Browser automation script

**Useful Commands**:
\`\`\`bash
# Test n8n connectivity
curl ${this.consolidatedReport.summary.n8nInstance}/healthz

# Run configuration analysis
node scripts/n8n-template-analyzer-configurator.js

# Run browser automation (if needed)
node scripts/n8n-browser-workflow-setup.js
\`\`\`

---
*Report generated by n8n Implementation Reporter v${this.consolidatedReport.meta.version}*
`;
    }

    printExecutiveSummary() {
        console.log('\n📊 EXECUTIVE SUMMARY');
        console.log('=======================');
        console.log(`🌐 n8n Instance: ${this.consolidatedReport.summary.n8nInstance}`);
        console.log(`📈 Status: ${this.consolidatedReport.summary.status}`);
        console.log(`🎯 Success Score: ${this.consolidatedReport.summary.successScore}/${this.consolidatedReport.summary.maxScore}`);
        console.log(`✅ Overall Success: ${this.consolidatedReport.summary.overallSuccess ? 'YES' : 'PARTIAL'}`);
        console.log(`📝 Templates Analyzed: ${this.consolidatedReport.templates.length}`);
        console.log(`🔧 Workflows Configured: ${this.consolidatedReport.workflows.configured.length}`);
        console.log(`🌐 Endpoints Available: ${this.consolidatedReport.endpoints.length}`);
        console.log(`⚠️  Errors: ${this.consolidatedReport.errors.length}`);
        console.log(`💡 Recommendations: ${this.consolidatedReport.recommendations.length}`);
        
        if (this.consolidatedReport.endpoints.filter(e => e.type === 'webhook').length > 0) {
            console.log('\n🔗 WEBHOOK ENDPOINTS:');
            this.consolidatedReport.endpoints
                .filter(e => e.type === 'webhook')
                .forEach(e => {
                    console.log(`   ${e.name}: ${e.url}`);
                });
        }
        
        console.log('\n🎯 PRIORITY ACTIONS:');
        this.consolidatedReport.recommendations
            .filter(r => r.priority === 'high')
            .slice(0, 3)
            .forEach(r => {
                console.log(`   ${r.category}: ${r.title}`);
            });
            
        console.log('\n📁 Reports Location: ./reports/');
        console.log('=======================\n');
    }
}

// Generate next steps action plan
function generateActionPlan(report) {
    const actionPlan = {
        immediate: [],
        shortTerm: [],
        longTerm: []
    };
    
    // Immediate actions (today)
    if (report.errors.some(e => e.type === 'AUTH_ERROR')) {
        actionPlan.immediate.push('Fix n8n API authentication');
    }
    actionPlan.immediate.push('Test workflow configurations manually in n8n interface');
    actionPlan.immediate.push('Verify webhook endpoints are accessible');
    
    // Short-term actions (this week)
    actionPlan.shortTerm.push('Set up GitHub token for automated integrations');
    actionPlan.shortTerm.push('Implement monitoring and alerting');
    actionPlan.shortTerm.push('Document all webhook URLs and API endpoints');
    actionPlan.shortTerm.push('Test all configured workflows with sample data');
    
    // Long-term actions (this month)
    actionPlan.longTerm.push('Create workflow templates library');
    actionPlan.longTerm.push('Set up advanced monitoring and analytics');
    actionPlan.longTerm.push('Implement workflow optimization based on usage data');
    actionPlan.longTerm.push('Create backup and disaster recovery procedures');
    
    return actionPlan;
}

// Run the comprehensive report generator if called directly
if (require.main === module) {
    const reporter = new N8nImplementationReporter();
    reporter.generateComprehensiveReport()
        .then(report => {
            const actionPlan = generateActionPlan(report);
            
            console.log('🎯 ACTION PLAN GENERATED');
            console.log('=========================');
            console.log('📅 IMMEDIATE (Today):');
            actionPlan.immediate.forEach(action => console.log(`   - ${action}`));
            console.log('\n📅 SHORT-TERM (This Week):');
            actionPlan.shortTerm.forEach(action => console.log(`   - ${action}`));
            console.log('\n📅 LONG-TERM (This Month):');
            actionPlan.longTerm.forEach(action => console.log(`   - ${action}`));
            console.log('=========================\n');
            
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Report generation failed:', error.message);
            process.exit(1);
        });
}

module.exports = N8nImplementationReporter;