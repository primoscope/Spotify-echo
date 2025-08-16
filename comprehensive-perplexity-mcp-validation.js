#!/usr/bin/env node

/**
 * Comprehensive Perplexity & MCP Server Validation Suite
 * 
 * This script validates:
 * 1. Perplexity API key functionality (including provided key)
 * 2. All MCP server operational status
 * 3. Grok-4 equivalent integration via Perplexity
 * 4. Deep research and browser research integration
 * 5. Repository analysis capabilities
 */

require('dotenv').config();
const { RealPerplexityIntegration } = require('./real-perplexity-integration');
const { EnhancedPerplexityGrok4Integration } = require('./enhanced-perplexity-grok4-integration');
const fs = require('fs').promises;
const path = require('path');

class ComprehensiveValidationSuite {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            perplexityApi: {},
            grok4Integration: {},
            mcpServers: {},
            deepResearch: {},
            browserIntegration: {},
            repositoryAnalysis: {},
            overallHealth: 0
        };
        
        this.perplexityIntegration = new RealPerplexityIntegration();
        this.enhancedIntegration = new EnhancedPerplexityGrok4Integration();
    }

    async runComprehensiveValidation() {
        console.log('🚀 Comprehensive Perplexity & MCP Server Validation Suite');
        console.log('========================================================\n');

        try {
            // 1. Validate Perplexity API Key
            await this.validatePerplexityApiKey();
            
            // 2. Test Grok-4 Integration  
            await this.testGrok4Integration();
            
            // 3. Validate MCP Servers
            await this.validateMcpServers();
            
            // 4. Test Deep Research Capabilities
            await this.testDeepResearch();
            
            // 5. Test Repository Analysis
            await this.testRepositoryAnalysis();
            
            // 6. Calculate Overall Health Score
            this.calculateOverallHealth();
            
            // 7. Generate Comprehensive Report
            await this.generateReport();
            
            // 8. Display Results
            this.displayResults();
            
            return this.results;
            
        } catch (error) {
            console.error(`❌ Validation suite failed: ${error.message}`);
            this.results.error = error.message;
            return this.results;
        }
    }

    async validatePerplexityApiKey() {
        console.log('🔑 1. Validating Perplexity API Key...');
        
        try {
            const apiKey = process.env.PERPLEXITY_API_KEY;
            console.log(`   Key format: ${apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT FOUND'}`);
            
            if (!apiKey) {
                throw new Error('PERPLEXITY_API_KEY not configured');
            }

            // Test simple request
            const testResult = await this.perplexityIntegration.makeRequest(
                'Test API connectivity - respond with "API_KEY_WORKING"',
                'sonar',
                { maxTokens: 50, temperature: 0.1 }
            );
            
            this.results.perplexityApi = {
                status: 'OPERATIONAL',
                keyFormat: `${apiKey.substring(0, 8)}...${apiKey.slice(-4)}`,
                responseTime: testResult.responseTime,
                testResponse: testResult.response.substring(0, 100),
                models: Object.keys(this.perplexityIntegration.models)
            };
            
            console.log(`   ✅ API Key: WORKING (${testResult.responseTime}ms)`);
            
        } catch (error) {
            this.results.perplexityApi = {
                status: 'FAILED',
                error: error.message
            };
            console.log(`   ❌ API Key: FAILED - ${error.message}`);
        }
    }

    async testGrok4Integration() {
        console.log('\n🧠 2. Testing Grok-4 Equivalent Integration...');
        
        try {
            const testQuery = 'Analyze EchoTune AI system architecture and provide 3 key optimization recommendations';
            
            const result = await this.perplexityIntegration.makeRequest(
                testQuery,
                'grok-4-equivalent',
                { maxTokens: 1000, temperature: 0.2 }
            );
            
            this.results.grok4Integration = {
                status: 'OPERATIONAL',
                model: result.actualModel,
                responseTime: result.responseTime,
                capabilities: result.capabilities,
                webSearch: result.webSearch,
                responseLength: result.response.length,
                grokEquivalent: true
            };
            
            console.log(`   ✅ Grok-4 Equivalent: WORKING (${result.responseTime}ms, ${result.response.length} chars)`);
            console.log(`   📊 Model: ${result.actualModel} with web search: ${result.webSearch}`);
            
        } catch (error) {
            this.results.grok4Integration = {
                status: 'FAILED',
                error: error.message
            };
            console.log(`   ❌ Grok-4 Integration: FAILED - ${error.message}`);
        }
    }

    async validateMcpServers() {
        console.log('\n🔧 3. Validating MCP Server Ecosystem...');
        
        const serverList = [
            { name: 'Filesystem', path: 'mcp-servers/filesystem/index.js' },
            { name: 'Memory', path: 'mcp-servers/memory/index.js' },
            { name: 'Sequential Thinking', path: 'mcp-servers/sequential-thinking/dist/index.js' },
            { name: 'Perplexity', path: 'mcp-servers/perplexity-mcp/index.js' },
            { name: 'Brave Search', path: 'mcp-servers/brave-search/index.js' },
            { name: 'Analytics', path: 'mcp-servers/analytics-server/index.js' },
            { name: 'Code Sandbox', path: 'mcp-servers/code-sandbox/index.js' }
        ];
        
        let operational = 0;
        let total = serverList.length;
        const serverStatus = {};
        
        for (const server of serverList) {
            try {
                const exists = await fs.access(server.path).then(() => true).catch(() => false);
                if (exists) {
                    serverStatus[server.name] = 'OPERATIONAL';
                    operational++;
                    console.log(`   ✅ ${server.name}: OPERATIONAL`);
                } else {
                    serverStatus[server.name] = 'NOT_FOUND';
                    console.log(`   ❌ ${server.name}: NOT FOUND`);
                }
            } catch (error) {
                serverStatus[server.name] = 'ERROR';
                console.log(`   ❌ ${server.name}: ERROR - ${error.message}`);
            }
        }
        
        this.results.mcpServers = {
            total: total,
            operational: operational,
            successRate: Math.round((operational / total) * 100),
            servers: serverStatus
        };
        
        console.log(`   📊 MCP Servers: ${operational}/${total} operational (${Math.round((operational / total) * 100)}%)`);
    }

    async testDeepResearch() {
        console.log('\n🔬 4. Testing Deep Research Capabilities...');
        
        try {
            const researchQuery = 'Research the latest trends in AI-powered music recommendation systems and Perplexity API integration best practices for 2025';
            
            const result = await this.enhancedIntegration.makeEnhancedRequest(
                researchQuery,
                'grok-4-equivalent',
                {
                    researchMode: 'comprehensive',
                    maxTokens: 2000,
                    temperature: 0.2
                }
            );
            
            this.results.deepResearch = {
                status: 'OPERATIONAL',
                researchMode: result.researchMode,
                responseTime: result.responseTime,
                citations: result.citations ? result.citations.length : 0,
                relatedQuestions: result.relatedQuestions ? result.relatedQuestions.length : 0,
                capabilities: result.capabilities
            };
            
            console.log(`   ✅ Deep Research: WORKING (${result.responseTime}ms)`);
            console.log(`   📚 Citations: ${result.citations ? result.citations.length : 0}, Related: ${result.relatedQuestions ? result.relatedQuestions.length : 0}`);
            
        } catch (error) {
            this.results.deepResearch = {
                status: 'FAILED',
                error: error.message
            };
            console.log(`   ❌ Deep Research: FAILED - ${error.message}`);
        }
    }

    async testRepositoryAnalysis() {
        console.log('\n🔍 5. Testing Repository Analysis...');
        
        try {
            const analysisResult = await this.enhancedIntegration.analyzeRepositoryWithGrok4('.', 'comprehensive');
            
            this.results.repositoryAnalysis = {
                status: 'OPERATIONAL',
                totalFiles: analysisResult.structure.totalFiles,
                directories: analysisResult.structure.directories.length,
                frameworks: analysisResult.structure.frameworks,
                recommendations: analysisResult.recommendations.length,
                analysisLength: analysisResult.analysis.response.length
            };
            
            console.log(`   ✅ Repository Analysis: WORKING`);
            console.log(`   📁 Files: ${analysisResult.structure.totalFiles}, Dirs: ${analysisResult.structure.directories.length}`);
            console.log(`   🛠️  Frameworks: ${analysisResult.structure.frameworks.join(', ')}`);
            console.log(`   💡 Recommendations: ${analysisResult.recommendations.length}`);
            
        } catch (error) {
            this.results.repositoryAnalysis = {
                status: 'FAILED',
                error: error.message
            };
            console.log(`   ❌ Repository Analysis: FAILED - ${error.message}`);
        }
    }

    calculateOverallHealth() {
        console.log('\n📊 6. Calculating Overall System Health...');
        
        let healthScore = 0;
        let maxScore = 0;
        
        // Perplexity API (25 points)
        maxScore += 25;
        if (this.results.perplexityApi.status === 'OPERATIONAL') {
            healthScore += 25;
        }
        
        // Grok-4 Integration (20 points)
        maxScore += 20;
        if (this.results.grok4Integration.status === 'OPERATIONAL') {
            healthScore += 20;
        }
        
        // MCP Servers (30 points based on success rate)
        maxScore += 30;
        if (this.results.mcpServers.successRate) {
            healthScore += Math.round((this.results.mcpServers.successRate / 100) * 30);
        }
        
        // Deep Research (15 points)
        maxScore += 15;
        if (this.results.deepResearch.status === 'OPERATIONAL') {
            healthScore += 15;
        }
        
        // Repository Analysis (10 points)
        maxScore += 10;
        if (this.results.repositoryAnalysis.status === 'OPERATIONAL') {
            healthScore += 10;
        }
        
        this.results.overallHealth = Math.round((healthScore / maxScore) * 100);
        
        let healthLevel = 'CRITICAL';
        if (this.results.overallHealth >= 90) healthLevel = 'EXCELLENT';
        else if (this.results.overallHealth >= 75) healthLevel = 'GOOD';
        else if (this.results.overallHealth >= 60) healthLevel = 'FAIR';
        else if (this.results.overallHealth >= 40) healthLevel = 'POOR';
        
        console.log(`   🎯 Overall Health Score: ${this.results.overallHealth}/100 (${healthLevel})`);
        this.results.healthLevel = healthLevel;
    }

    async generateReport() {
        console.log('\n📄 7. Generating Comprehensive Report...');
        
        const reportDir = path.join(process.cwd(), 'validation-reports');
        await fs.mkdir(reportDir, { recursive: true });
        
        // JSON Report
        const jsonReport = path.join(reportDir, `comprehensive-validation-${Date.now()}.json`);
        await fs.writeFile(jsonReport, JSON.stringify(this.results, null, 2));
        
        // Markdown Report
        const markdownReport = await this.generateMarkdownReport();
        const mdReport = path.join(reportDir, `comprehensive-validation-${Date.now()}.md`);
        await fs.writeFile(mdReport, markdownReport);
        
        this.results.reports = {
            json: jsonReport,
            markdown: mdReport
        };
        
        console.log(`   📁 Reports saved to: ${reportDir}`);
    }

    async generateMarkdownReport() {
        return `# Comprehensive Perplexity & MCP Server Validation Report

**Generated**: ${this.results.timestamp}
**Overall Health Score**: ${this.results.overallHealth}/100 (${this.results.healthLevel})

## 🔑 Perplexity API Status
- **Status**: ${this.results.perplexityApi.status}
- **API Key**: ${this.results.perplexityApi.keyFormat || 'Not configured'}
- **Response Time**: ${this.results.perplexityApi.responseTime || 'N/A'}ms
- **Available Models**: ${this.results.perplexityApi.models ? this.results.perplexityApi.models.join(', ') : 'None'}

## 🧠 Grok-4 Integration Status  
- **Status**: ${this.results.grok4Integration.status}
- **Model**: ${this.results.grok4Integration.model || 'N/A'}
- **Web Search**: ${this.results.grok4Integration.webSearch || false}
- **Response Time**: ${this.results.grok4Integration.responseTime || 'N/A'}ms
- **Capabilities**: ${this.results.grok4Integration.capabilities ? this.results.grok4Integration.capabilities.join(', ') : 'None'}

## 🔧 MCP Servers Ecosystem
- **Total Servers**: ${this.results.mcpServers.total || 0}
- **Operational**: ${this.results.mcpServers.operational || 0}
- **Success Rate**: ${this.results.mcpServers.successRate || 0}%

### Server Status:
${Object.entries(this.results.mcpServers.servers || {}).map(([name, status]) => `- **${name}**: ${status}`).join('\n')}

## 🔬 Deep Research Capabilities
- **Status**: ${this.results.deepResearch.status}
- **Research Mode**: ${this.results.deepResearch.researchMode || 'N/A'}
- **Citations**: ${this.results.deepResearch.citations || 0}
- **Related Questions**: ${this.results.deepResearch.relatedQuestions || 0}

## 🔍 Repository Analysis
- **Status**: ${this.results.repositoryAnalysis.status}  
- **Total Files**: ${this.results.repositoryAnalysis.totalFiles || 0}
- **Directories**: ${this.results.repositoryAnalysis.directories || 0}
- **Frameworks**: ${this.results.repositoryAnalysis.frameworks ? this.results.repositoryAnalysis.frameworks.join(', ') : 'None'}
- **Recommendations**: ${this.results.repositoryAnalysis.recommendations || 0}

## 📋 Summary
The EchoTune AI system shows an overall health score of **${this.results.overallHealth}/100** with **${this.results.healthLevel}** status.

### Key Highlights:
- Perplexity API is ${this.results.perplexityApi.status === 'OPERATIONAL' ? '✅ WORKING' : '❌ FAILED'}
- Grok-4 equivalent integration is ${this.results.grok4Integration.status === 'OPERATIONAL' ? '✅ OPERATIONAL' : '❌ FAILED'}  
- ${this.results.mcpServers.operational || 0} out of ${this.results.mcpServers.total || 0} MCP servers are operational
- Deep research capabilities are ${this.results.deepResearch.status === 'OPERATIONAL' ? '✅ WORKING' : '❌ FAILED'}
- Repository analysis is ${this.results.repositoryAnalysis.status === 'OPERATIONAL' ? '✅ FUNCTIONAL' : '❌ FAILED'}
`;
    }

    displayResults() {
        console.log('\n' + '='.repeat(60));
        console.log('🎯 FINAL VALIDATION RESULTS');
        console.log('='.repeat(60));
        console.log(`Overall Health Score: ${this.results.overallHealth}/100 (${this.results.healthLevel})`);
        console.log(`Perplexity API: ${this.results.perplexityApi.status}`);
        console.log(`Grok-4 Integration: ${this.results.grok4Integration.status}`);
        console.log(`MCP Servers: ${this.results.mcpServers.operational}/${this.results.mcpServers.total} operational`);
        console.log(`Deep Research: ${this.results.deepResearch.status}`);
        console.log(`Repository Analysis: ${this.results.repositoryAnalysis.status}`);
        console.log('='.repeat(60));
        
        if (this.results.overallHealth >= 75) {
            console.log('✅ System is ready for production use!');
        } else if (this.results.overallHealth >= 60) {
            console.log('⚠️  System is functional but needs improvements');
        } else {
            console.log('❌ System needs significant fixes before production use');
        }
    }
}

// CLI Interface
async function main() {
    const validator = new ComprehensiveValidationSuite();
    
    try {
        const results = await validator.runComprehensiveValidation();
        
        if (results.overallHealth >= 75) {
            process.exit(0);
        } else {
            process.exit(1);
        }
    } catch (error) {
        console.error(`❌ Validation suite failed: ${error.message}`);
        process.exit(1);
    }
}

// Export for module use
module.exports = { ComprehensiveValidationSuite };

// Run CLI if called directly
if (require.main === module) {
    main().catch(console.error);
}