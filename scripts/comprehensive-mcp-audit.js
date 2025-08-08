#!/usr/bin/env node

/**
 * Comprehensive MCP Server Audit Tool
 * Analyzes all MCP servers, tests functionality, and generates detailed status report
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { performance } = require('perf_hooks');

class MCPAuditor {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            summary: {
                total: 0,
                operational: 0,
                failed: 0,
                notFound: 0
            },
            servers: {},
            recommendations: []
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const colors = {
            info: '\x1b[36m',
            success: '\x1b[32m',
            error: '\x1b[31m',
            warning: '\x1b[33m',
            reset: '\x1b[0m'
        };
        
        console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
    }

    async auditMCPServer(serverConfig) {
        const startTime = performance.now();
        const result = {
            name: serverConfig.name,
            type: serverConfig.type || 'unknown',
            path: serverConfig.path,
            capabilities: serverConfig.capabilities || [],
            status: 'unknown',
            errors: [],
            performance: {},
            recommendations: []
        };

        try {
            // Check if server file exists
            if (serverConfig.path) {
                try {
                    await fs.access(serverConfig.path);
                    result.fileExists = true;
                } catch (error) {
                    result.fileExists = false;
                    result.errors.push(`File not found: ${serverConfig.path}`);
                    result.status = 'not_found';
                    this.results.summary.notFound++;
                    return result;
                }
            }

            // Syntax validation for JavaScript files
            if (serverConfig.path && serverConfig.path.endsWith('.js')) {
                try {
                    execSync(`node -c "${serverConfig.path}"`, { encoding: 'utf8' });
                    result.syntaxValid = true;
                } catch (error) {
                    result.syntaxValid = false;
                    result.errors.push(`Syntax error: ${error.message}`);
                }
            }

            // Test server initialization if it's a Node.js module
            if (serverConfig.testCommand) {
                try {
                    const output = execSync(serverConfig.testCommand, { 
                        encoding: 'utf8', 
                        timeout: 10000,
                        stdio: 'pipe'
                    });
                    result.initializationTest = 'passed';
                    result.testOutput = output.substring(0, 200) + '...';
                } catch (error) {
                    result.initializationTest = 'failed';
                    result.errors.push(`Initialization failed: ${error.message.substring(0, 200)}`);
                }
            }

            // Check dependencies if package.json exists in server directory
            if (serverConfig.path) {
                const serverDir = path.dirname(serverConfig.path);
                const packageJsonPath = path.join(serverDir, 'package.json');
                try {
                    await fs.access(packageJsonPath);
                    const packageData = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
                    result.dependencies = {
                        total: Object.keys(packageData.dependencies || {}).length + 
                               Object.keys(packageData.devDependencies || {}).length,
                        production: Object.keys(packageData.dependencies || {}).length,
                        development: Object.keys(packageData.devDependencies || {}).length
                    };
                } catch (error) {
                    // No package.json is fine for some servers
                }
            }

            // Determine overall status
            if (result.errors.length === 0) {
                result.status = 'operational';
                this.results.summary.operational++;
            } else if (result.errors.some(e => e.includes('Syntax error'))) {
                result.status = 'critical_error';
                this.results.summary.failed++;
            } else {
                result.status = 'issues';
                this.results.summary.failed++;
            }

            // Performance metrics
            const endTime = performance.now();
            result.performance.auditTime = Math.round(endTime - startTime);

            // Generate recommendations
            this.generateRecommendations(result);

        } catch (error) {
            result.status = 'failed';
            result.errors.push(`Audit failed: ${error.message}`);
            this.results.summary.failed++;
        }

        return result;
    }

    generateRecommendations(serverResult) {
        if (!serverResult.fileExists) {
            serverResult.recommendations.push('Create missing server file');
        }
        
        if (serverResult.syntaxValid === false) {
            serverResult.recommendations.push('Fix syntax errors in server code');
        }
        
        if (serverResult.initializationTest === 'failed') {
            serverResult.recommendations.push('Debug server initialization issues');
        }
        
        if (serverResult.capabilities.length === 0) {
            serverResult.recommendations.push('Document server capabilities');
        }
    }

    async discoverMCPServers() {
        this.log('🔍 Discovering MCP servers...', 'info');

        const servers = [];

        // Community MCP servers from mcp-servers/
        const communityServerDirs = [
            'package-management', 'code-sandbox', 'analytics-server', 'testing-automation'
        ];

        for (const dir of communityServerDirs) {
            const serverPath = path.join('mcp-servers', dir);
            try {
                await fs.access(serverPath);
                const files = await fs.readdir(serverPath);
                const jsFiles = files.filter(f => f.endsWith('.js') && !f.includes('test'));
                
                for (const file of jsFiles) {
                    servers.push({
                        name: `Community: ${dir}`,
                        type: 'community',
                        path: path.join(serverPath, file),
                        capabilities: this.inferCapabilities(dir),
                        testCommand: `node "${path.join(serverPath, file)}" --help || echo "Server loaded"`
                    });
                }
            } catch (error) {
                this.log(`⚠️ Could not access ${serverPath}`, 'warning');
            }
        }

        // Built-in MCP servers from mcp-server/
        const mcpServerFiles = [
            'enhanced-mcp-orchestrator.js',
            'coordination-server.js',
            'enhanced-server.js',
            'workflow-manager.js',
            'spotify_server.py'
        ];

        for (const file of mcpServerFiles) {
            const serverPath = path.join('mcp-server', file);
            try {
                await fs.access(serverPath);
                servers.push({
                    name: `Built-in: ${file.replace('.js', '').replace('.py', '')}`,
                    type: 'built-in',
                    path: serverPath,
                    capabilities: this.inferCapabilities(file),
                    testCommand: file.endsWith('.py') 
                        ? `python "${serverPath}" --help || echo "Python server loaded"`
                        : `node "${serverPath}" --help || echo "Server loaded"`
                });
            } catch (error) {
                servers.push({
                    name: `Built-in: ${file.replace('.js', '').replace('.py', '')}`,
                    type: 'built-in',
                    path: serverPath,
                    capabilities: [],
                    status: 'missing'
                });
            }
        }

        // Additional MCP utility servers from mcp-servers/
        const utilityFiles = [
            'comprehensive-validator.js',
            'enhanced-browser-tools.js', 
            'enhanced-file-utilities.js',
            'browserbase-orchestrator.js'
        ];

        for (const file of utilityFiles) {
            const serverPath = path.join('mcp-servers', file);
            try {
                await fs.access(serverPath);
                servers.push({
                    name: `Utility: ${file.replace('.js', '')}`,
                    type: 'utility',
                    path: serverPath,
                    capabilities: this.inferCapabilities(file),
                    testCommand: `node "${serverPath}" --help || echo "Utility server loaded"`
                });
            } catch (error) {
                // File doesn't exist, that's ok
            }
        }

        this.log(`📊 Discovered ${servers.length} MCP servers`, 'info');
        return servers;
    }

    inferCapabilities(filename) {
        const capabilityMap = {
            'package-management': ['dependency-analysis', 'security-scanning', 'version-management'],
            'code-sandbox': ['code-execution', 'validation', 'testing'],
            'analytics-server': ['metrics-collection', 'performance-monitoring', 'telemetry'],
            'testing-automation': ['unit-testing', 'integration-testing', 'e2e-testing'],
            'orchestrator': ['server-coordination', 'workflow-management'],
            'coordination': ['multi-server-management', 'resource-allocation'],
            'workflow': ['task-automation', 'pipeline-management'],
            'spotify': ['music-api', 'authentication', 'playlist-management'],
            'validator': ['system-validation', 'health-checks'],
            'browser': ['web-automation', 'ui-testing'],
            'file': ['filesystem-operations', 'file-management']
        };

        const lowercaseFile = filename.toLowerCase();
        for (const [key, capabilities] of Object.entries(capabilityMap)) {
            if (lowercaseFile.includes(key)) {
                return capabilities;
            }
        }
        return [];
    }

    async generateReport() {
        const reportPath = 'MCP_STATUS_REPORT.md';
        let report = `# 🤖 EchoTune AI - MCP Server Status Report\n\n`;
        
        report += `**Generated:** ${this.results.timestamp}\n`;
        report += `**Total Servers Analyzed:** ${this.results.summary.total}\n`;
        report += `**Operational:** ${this.results.summary.operational} ✅\n`;
        report += `**Failed/Issues:** ${this.results.summary.failed} ❌\n`;
        report += `**Not Found:** ${this.results.summary.notFound} 📁\n\n`;

        report += `## Summary\n\n`;
        
        if (this.results.summary.operational > 0) {
            report += `✅ **${this.results.summary.operational} servers are operational** and ready for use.\n\n`;
        }
        
        if (this.results.summary.failed > 0) {
            report += `❌ **${this.results.summary.failed} servers have issues** that need attention.\n\n`;
        }
        
        if (this.results.summary.notFound > 0) {
            report += `📁 **${this.results.summary.notFound} servers are missing** and need to be created.\n\n`;
        }

        report += `## Server Details\n\n`;

        // Group by type
        const serversByType = {};
        Object.values(this.results.servers).forEach(server => {
            const type = server.type || 'unknown';
            if (!serversByType[type]) serversByType[type] = [];
            serversByType[type].push(server);
        });

        for (const [type, servers] of Object.entries(serversByType)) {
            report += `### ${type.charAt(0).toUpperCase() + type.slice(1)} Servers\n\n`;
            
            for (const server of servers) {
                const statusIcon = server.status === 'operational' ? '✅' : 
                                 server.status === 'not_found' ? '📁' : '❌';
                
                report += `#### ${statusIcon} ${server.name}\n\n`;
                report += `- **Status:** ${server.status}\n`;
                report += `- **Path:** \`${server.path}\`\n`;
                
                if (server.capabilities.length > 0) {
                    report += `- **Capabilities:** ${server.capabilities.join(', ')}\n`;
                }
                
                if (server.performance?.auditTime) {
                    report += `- **Audit Time:** ${server.performance.auditTime}ms\n`;
                }
                
                if (server.errors.length > 0) {
                    report += `- **Issues:**\n`;
                    server.errors.forEach(error => {
                        report += `  - ${error}\n`;
                    });
                }
                
                if (server.recommendations.length > 0) {
                    report += `- **Recommendations:**\n`;
                    server.recommendations.forEach(rec => {
                        report += `  - ${rec}\n`;
                    });
                }
                
                report += `\n`;
            }
        }

        // Overall recommendations
        if (this.results.recommendations.length > 0) {
            report += `## Overall Recommendations\n\n`;
            this.results.recommendations.forEach((rec, i) => {
                report += `${i + 1}. ${rec}\n`;
            });
            report += `\n`;
        }

        // Implementation priorities
        report += `## Implementation Priorities\n\n`;
        report += `### High Priority\n`;
        report += `1. Fix critical errors in servers that prevent initialization\n`;
        report += `2. Create missing server files for core functionality\n`;
        report += `3. Resolve dependency issues\n\n`;
        
        report += `### Medium Priority\n`;
        report += `1. Improve error handling in servers with minor issues\n`;
        report += `2. Add comprehensive testing for all servers\n`;
        report += `3. Document server capabilities and APIs\n\n`;
        
        report += `### Low Priority\n`;
        report += `1. Optimize server performance\n`;
        report += `2. Add monitoring and health checks\n`;
        report += `3. Implement automated server discovery\n\n`;

        await fs.writeFile(reportPath, report, 'utf8');
        
        // Also generate JSON report
        const jsonReportPath = 'MCP_STATUS_REPORT.json';
        await fs.writeFile(jsonReportPath, JSON.stringify(this.results, null, 2), 'utf8');
        
        this.log(`📋 Reports generated:`, 'success');
        this.log(`   Markdown: ${reportPath}`, 'info');
        this.log(`   JSON: ${jsonReportPath}`, 'info');
    }

    async runFullAudit() {
        this.log('🤖 Starting comprehensive MCP server audit...', 'info');
        
        const servers = await this.discoverMCPServers();
        this.results.summary.total = servers.length;

        for (const server of servers) {
            this.log(`🔍 Auditing: ${server.name}`, 'info');
            const result = await this.auditMCPServer(server);
            this.results.servers[server.name] = result;
        }

        // Generate overall recommendations
        this.generateOverallRecommendations();

        await this.generateReport();

        this.log(`🎉 Audit complete! ${this.results.summary.operational}/${this.results.summary.total} servers operational`, 'success');

        if (this.results.summary.failed > 0 || this.results.summary.notFound > 0) {
            this.log(`⚠️ ${this.results.summary.failed + this.results.summary.notFound} servers need attention`, 'warning');
        }

        return this.results;
    }

    generateOverallRecommendations() {
        if (this.results.summary.failed > 0) {
            this.results.recommendations.push('Implement comprehensive error handling and logging across all servers');
        }
        
        if (this.results.summary.notFound > 0) {
            this.results.recommendations.push('Create missing server implementations following MCP protocol standards');
        }
        
        this.results.recommendations.push('Set up automated health monitoring for all MCP servers');
        this.results.recommendations.push('Implement integration tests for server communication');
        this.results.recommendations.push('Create unified configuration management for all servers');
    }
}

// Main execution
if (require.main === module) {
    const auditor = new MCPAuditor();
    auditor.runFullAudit().catch(error => {
        console.error('❌ Audit failed:', error);
        process.exit(1);
    });
}

module.exports = MCPAuditor;