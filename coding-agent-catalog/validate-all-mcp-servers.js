#!/usr/bin/env node
/**
 * Comprehensive MCP Servers Validation Suite
 * Tests all installed MCP servers for functionality and connectivity
 */

require('dotenv').config();
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class MCPServersValidator {
    constructor() {
        this.servers = [
            {
                name: 'Filesystem MCP Server',
                path: 'mcp-servers/filesystem/index.js',
                capabilities: ['file_operations', 'directory_management', 'code_analysis']
            },
            {
                name: 'Memory MCP Server', 
                path: 'mcp-servers/memory/index.js',
                capabilities: ['persistent_context', 'knowledge_graph', 'conversation_history']
            },
            {
                name: 'GitHub Repos Manager MCP',
                path: 'mcp-servers/github-repos-manager/index.js',
                capabilities: ['github_automation', 'repository_management'],
                requiresAuth: 'GITHUB_TOKEN or GITHUB_PAT'
            },
            {
                name: 'Brave Search MCP',
                path: 'mcp-servers/brave-search/brave-search-mcp.js',
                capabilities: ['web_search', 'privacy_search', 'research'],
                requiresAuth: 'BRAVE_API_KEY'
            },
            {
                name: 'Sequential Thinking Server',
                path: 'mcp-servers/sequential-thinking/dist/index.js',
                capabilities: ['reasoning', 'problem_solving', 'decision_making']
            },
            {
                name: 'Perplexity MCP Server',
                path: 'mcp-servers/perplexity-mcp/index.js',
                capabilities: ['ai_research', 'web_search', 'deep_analysis'],
                requiresAuth: 'PERPLEXITY_API_KEY'
            },
            {
                name: 'Analytics Server',
                path: 'mcp-servers/analytics-server/index.js',
                capabilities: ['metrics', 'performance_monitoring']
            },
            {
                name: 'Code Sandbox Server',
                path: 'mcp-servers/code-sandbox/index.js', 
                capabilities: ['secure_execution', 'validation']
            }
        ];
        
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            details: []
        };
    }

    async validateServer(server) {
        console.log(`🔍 Testing ${server.name}...`);
        
        const serverPath = path.join(process.cwd(), server.path);
        
        // Check if file exists
        if (!fs.existsSync(serverPath)) {
            return {
                name: server.name,
                status: 'FAILED',
                error: 'Server file not found',
                path: serverPath
            };
        }
        
        // Check authentication requirements
        if (server.requiresAuth) {
            const authKeys = server.requiresAuth.split(' or ');
            const hasAuth = authKeys.some(key => process.env[key]);
            if (!hasAuth) {
                return {
                    name: server.name,
                    status: 'SKIPPED',
                    error: `Missing authentication: ${server.requiresAuth}`,
                    path: serverPath
                };
            }
        }
        
        // Test server startup (quick test)
        try {
            const result = await this.testServerStartup(serverPath);
            return {
                name: server.name,
                status: 'PASSED',
                capabilities: server.capabilities,
                path: serverPath,
                ...result
            };
        } catch (error) {
            return {
                name: server.name,
                status: 'FAILED', 
                error: error.message,
                path: serverPath
            };
        }
    }

    async testServerStartup(serverPath) {
        return new Promise((resolve, reject) => {
            const child = spawn('timeout', ['5s', 'node', serverPath], {
                stdio: ['ignore', 'pipe', 'pipe']
            });
            
            let stdout = '';
            let stderr = '';
            
            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            child.on('close', (code) => {
                // For MCP servers, timeout (code 124) is expected as they run continuously
                if (code === 124 || stderr.includes('running on stdio') || stderr.includes('Server running')) {
                    resolve({
                        message: 'Server started successfully (timed out as expected)',
                        stdout: stdout.slice(0, 200),
                        stderr: stderr.slice(0, 200)
                    });
                } else if (code === 0) {
                    resolve({
                        message: 'Server completed successfully',
                        stdout: stdout.slice(0, 200),
                        stderr: stderr.slice(0, 200)
                    });
                } else {
                    reject(new Error(`Server failed to start (exit code: ${code})\nstdout: ${stdout}\nstderr: ${stderr}`));
                }
            });
            
            child.on('error', (error) => {
                reject(new Error(`Failed to spawn server: ${error.message}`));
            });
        });
    }

    async runValidation() {
        console.log('🚀 Starting MCP Servers Validation Suite...\n');
        
        this.results.total = this.servers.length;
        
        for (const server of this.servers) {
            const result = await this.validateServer(server);
            
            if (result.status === 'PASSED') {
                console.log(`✅ ${result.name}: PASSED`);
                this.results.passed++;
            } else if (result.status === 'SKIPPED') {
                console.log(`⚠️  ${result.name}: SKIPPED - ${result.error}`);
            } else {
                console.log(`❌ ${result.name}: FAILED - ${result.error}`);
                this.results.failed++;
            }
            
            this.results.details.push(result);
            console.log('');
        }
        
        this.printSummary();
        this.generateReport();
        
        return this.results;
    }

    printSummary() {
        console.log('📊 MCP Servers Validation Summary');
        console.log('═══════════════════════════════════');
        console.log(`Total Servers: ${this.results.total}`);
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`⚠️  Skipped: ${this.results.total - this.results.passed - this.results.failed}`);
        console.log(`Success Rate: ${Math.round((this.results.passed / this.results.total) * 100)}%`);
        
        if (this.results.failed > 0) {
            console.log('\n🔧 Failed Servers:');
            this.results.details
                .filter(r => r.status === 'FAILED')
                .forEach(r => console.log(`   - ${r.name}: ${r.error}`));
        }

        const skipped = this.results.details.filter(r => r.status === 'SKIPPED');
        if (skipped.length > 0) {
            console.log('\n⚠️  Skipped Servers (Missing Authentication):');
            skipped.forEach(r => console.log(`   - ${r.name}: ${r.error}`));
        }
    }

    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: this.results.total,
                passed: this.results.passed,
                failed: this.results.failed,
                skipped: this.results.total - this.results.passed - this.results.failed,
                successRate: Math.round((this.results.passed / this.results.total) * 100)
            },
            servers: this.results.details.map(server => ({
                name: server.name,
                status: server.status,
                capabilities: server.capabilities || [],
                path: server.path,
                error: server.error || null,
                message: server.message || null
            }))
        };
        
        // Save JSON report
        const reportPath = path.join(process.cwd(), 'mcp-servers-validation-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        // Save markdown report
        const mdReport = this.generateMarkdownReport(report);
        const mdReportPath = path.join(process.cwd(), 'MCP_SERVERS_VALIDATION_REPORT.md');
        fs.writeFileSync(mdReportPath, mdReport);
        
        console.log(`\n📄 Reports generated:`);
        console.log(`   - JSON: ${reportPath}`);
        console.log(`   - Markdown: ${mdReportPath}`);
    }

    generateMarkdownReport(report) {
        let md = `# MCP Servers Validation Report\n\n`;
        md += `**Generated**: ${report.timestamp}\n\n`;
        
        md += `## Summary\n\n`;
        md += `- **Total Servers**: ${report.summary.total}\n`;
        md += `- **✅ Passed**: ${report.summary.passed}\n`;
        md += `- **❌ Failed**: ${report.summary.failed}\n`;
        md += `- **⚠️ Skipped**: ${report.summary.skipped}\n`;
        md += `- **Success Rate**: ${report.summary.successRate}%\n\n`;
        
        md += `## Server Details\n\n`;
        
        report.servers.forEach(server => {
            const statusEmoji = server.status === 'PASSED' ? '✅' : 
                              server.status === 'FAILED' ? '❌' : '⚠️';
            
            md += `### ${statusEmoji} ${server.name}\n\n`;
            md += `- **Status**: ${server.status}\n`;
            md += `- **Path**: \`${server.path}\`\n`;
            md += `- **Capabilities**: ${server.capabilities.join(', ')}\n`;
            
            if (server.error) {
                md += `- **Error**: ${server.error}\n`;
            }
            
            if (server.message) {
                md += `- **Message**: ${server.message}\n`;
            }
            
            md += `\n`;
        });
        
        return md;
    }
}

// Run validation if called directly
if (require.main === module) {
    const validator = new MCPServersValidator();
    validator.runValidation().then((results) => {
        process.exit(results.failed > 0 ? 1 : 0);
    }).catch((error) => {
        console.error('❌ Validation suite failed:', error);
        process.exit(1);
    });
}

module.exports = MCPServersValidator;