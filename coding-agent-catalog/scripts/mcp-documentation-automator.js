#!/usr/bin/env node

/**
 * Enhanced MCP Documentation Automation
 * 
 * Automatically updates documentation when MCP servers are added/removed/modified.
 * Builds on existing MCP infrastructure to maintain documentation sync.
 */

const fs = require('fs').promises;
const path = require('path');

class MCPDocumentationAutomator {
    constructor() {
        this.agentsDocPath = path.join(__dirname, '..', 'docs', 'guides', 'AGENTS.md');
        this.mcpServersDir = path.join(__dirname, '..', 'mcp-servers');
        this.packageJsonPath = path.join(__dirname, '..', 'package.json');
        this.mcpIntegrationPath = path.join(__dirname, '..', 'docs', 'MCP_INTEGRATION.md');
    }

    /**
     * Scan current MCP ecosystem
     */
    async scanMCPEcosystem() {
        const ecosystem = {
            core_servers: [],
            community_servers: [],
            custom_servers: [],
            package_dependencies: [],
            workflow_integrations: []
        };

        try {
            // 1. Scan package.json for MCP dependencies
            const packageJson = JSON.parse(await fs.readFile(this.packageJsonPath, 'utf-8'));
            const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
            
            Object.entries(allDeps).forEach(([name, version]) => {
                if (name.includes('mcp') || name.includes('model-context-protocol')) {
                    ecosystem.package_dependencies.push({
                        name,
                        version,
                        type: this.categorizeMCPServer(name)
                    });
                }
            });

            // 2. Scan mcp-servers directory
            const mcpDirs = await fs.readdir(this.mcpServersDir);
            for (const dir of mcpDirs) {
                const dirPath = path.join(this.mcpServersDir, dir);
                const stat = await fs.stat(dirPath);
                
                if (stat.isDirectory()) {
                    const serverInfo = await this.analyzeMCPServerDirectory(dirPath);
                    if (serverInfo) {
                        ecosystem.community_servers.push({
                            name: dir,
                            ...serverInfo
                        });
                    }
                }
            }

            // 3. Scan mcp-server directory for custom servers
            const mcpServerDir = path.join(__dirname, '..', 'mcp-server');
            const serverFiles = await fs.readdir(mcpServerDir);
            
            for (const file of serverFiles) {
                if (file.endsWith('.js') || file.endsWith('.py')) {
                    const serverInfo = await this.analyzeCustomServer(path.join(mcpServerDir, file));
                    if (serverInfo) {
                        ecosystem.custom_servers.push({
                            filename: file,
                            ...serverInfo
                        });
                    }
                }
            }

            // 4. Scan workflow files for MCP integrations
            const workflowsDir = path.join(__dirname, '..', '.github', 'workflows');
            const workflowFiles = await fs.readdir(workflowsDir);
            
            for (const file of workflowFiles) {
                if (file.endsWith('.yml') || file.endsWith('.yaml')) {
                    const workflowContent = await fs.readFile(path.join(workflowsDir, file), 'utf-8');
                    if (workflowContent.includes('mcp') || workflowContent.includes('MCP')) {
                        ecosystem.workflow_integrations.push({
                            filename: file,
                            mcp_references: this.extractMCPReferences(workflowContent)
                        });
                    }
                }
            }

            return ecosystem;
        } catch (error) {
            console.error('❌ Error scanning MCP ecosystem:', error.message);
            return ecosystem;
        }
    }

    /**
     * Categorize MCP server by name/purpose
     */
    categorizeMCPServer(name) {
        const lowerName = name.toLowerCase();
        
        if (lowerName.includes('filesystem') || lowerName.includes('filescope')) return 'core';
        if (lowerName.includes('browser') || lowerName.includes('puppeteer')) return 'automation';
        if (lowerName.includes('sequential-thinking')) return 'ai';
        if (lowerName.includes('package') || lowerName.includes('dependency')) return 'development';
        if (lowerName.includes('security') || lowerName.includes('scan')) return 'security';
        if (lowerName.includes('test') || lowerName.includes('validation')) return 'testing';
        if (lowerName.includes('music') || lowerName.includes('spotify')) return 'music';
        
        return 'utility';
    }

    /**
     * Analyze MCP server directory
     */
    async analyzeMCPServerDirectory(dirPath) {
        try {
            const files = await fs.readdir(dirPath);
            const info = {
                files: files.length,
                has_readme: files.includes('README.md'),
                has_package_json: files.includes('package.json'),
                has_config: files.some(f => f.includes('config')),
                main_files: files.filter(f => f.endsWith('.js') || f.endsWith('.ts') || f.endsWith('.py'))
            };

            // Try to read package.json for more details
            if (info.has_package_json) {
                try {
                    const pkgContent = await fs.readFile(path.join(dirPath, 'package.json'), 'utf-8');
                    const pkg = JSON.parse(pkgContent);
                    info.description = pkg.description;
                    info.version = pkg.version;
                    info.main = pkg.main;
                } catch (e) {
                    // Ignore parsing errors
                }
            }

            return info;
        } catch (error) {
            return null;
        }
    }

    /**
     * Analyze custom server file
     */
    async analyzeCustomServer(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const info = {
                lines: content.split('\n').length,
                has_exports: content.includes('module.exports') || content.includes('export'),
                has_mcp_references: content.includes('MCP') || content.includes('modelcontextprotocol'),
                functions: this.extractFunctionNames(content),
                description: this.extractDescription(content)
            };

            return info;
        } catch (error) {
            return null;
        }
    }

    /**
     * Extract function names from code
     */
    extractFunctionNames(content) {
        const functionRegex = /(?:function\s+(\w+)|const\s+(\w+)\s*=|async\s+(\w+)\s*\()/g;
        const functions = [];
        let match;
        
        while ((match = functionRegex.exec(content)) !== null) {
            const functionName = match[1] || match[2] || match[3];
            if (functionName && !functions.includes(functionName)) {
                functions.push(functionName);
            }
        }
        
        return functions.slice(0, 5); // Limit to first 5 functions
    }

    /**
     * Extract description from code comments
     */
    extractDescription(content) {
        const lines = content.split('\n');
        for (const line of lines.slice(0, 10)) {
            if (line.includes('*') && (line.includes('Description') || line.includes('Purpose'))) {
                return line.replace(/[/*\s]/g, '').substring(0, 100);
            }
        }
        return 'Custom MCP server implementation';
    }

    /**
     * Extract MCP references from workflow content
     */
    extractMCPReferences(content) {
        const references = [];
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
            if (line.toLowerCase().includes('mcp')) {
                references.push({
                    line: index + 1,
                    content: line.trim()
                });
            }
        });
        
        return references.slice(0, 5); // Limit references
    }

    /**
     * Generate comprehensive MCP ecosystem documentation
     */
    generateEcosystemDocumentation(ecosystem) {
        const timestamp = new Date().toISOString();
        let doc = `# 🤖 MCP Ecosystem Status Report\n\n`;
        doc += `**Generated:** ${timestamp}\n`;
        doc += `**Auto-generated by:** MCP Documentation Automation\n\n`;

        // Summary
        doc += `## 📊 Summary\n\n`;
        doc += `- **Package Dependencies:** ${ecosystem.package_dependencies.length}\n`;
        doc += `- **Community Servers:** ${ecosystem.community_servers.length}\n`;
        doc += `- **Custom Servers:** ${ecosystem.custom_servers.length}\n`;
        doc += `- **Workflow Integrations:** ${ecosystem.workflow_integrations.length}\n\n`;

        // Package Dependencies
        if (ecosystem.package_dependencies.length > 0) {
            doc += `## 📦 Package Dependencies\n\n`;
            ecosystem.package_dependencies.forEach(dep => {
                doc += `### ${dep.name}\n`;
                doc += `- **Version:** ${dep.version}\n`;
                doc += `- **Type:** ${dep.type}\n`;
                doc += `- **Category:** ${this.categorizeMCPServer(dep.name)}\n\n`;
            });
        }

        // Community Servers
        if (ecosystem.community_servers.length > 0) {
            doc += `## 🌟 Community MCP Servers\n\n`;
            ecosystem.community_servers.forEach(server => {
                doc += `### ${server.name}\n`;
                if (server.description) doc += `- **Description:** ${server.description}\n`;
                if (server.version) doc += `- **Version:** ${server.version}\n`;
                doc += `- **Files:** ${server.files} files\n`;
                doc += `- **Main Files:** ${server.main_files.join(', ')}\n`;
                doc += `- **Documentation:** ${server.has_readme ? '✅' : '❌'}\n`;
                doc += `- **Configuration:** ${server.has_config ? '✅' : '❌'}\n\n`;
            });
        }

        // Custom Servers
        if (ecosystem.custom_servers.length > 0) {
            doc += `## 🔧 Custom MCP Servers\n\n`;
            ecosystem.custom_servers.forEach(server => {
                doc += `### ${server.filename}\n`;
                doc += `- **Description:** ${server.description}\n`;
                doc += `- **Lines of Code:** ${server.lines}\n`;
                doc += `- **Functions:** ${server.functions.join(', ')}\n`;
                doc += `- **MCP Integration:** ${server.has_mcp_references ? '✅' : '❌'}\n\n`;
            });
        }

        // Workflow Integrations
        if (ecosystem.workflow_integrations.length > 0) {
            doc += `## 🔄 Workflow Integrations\n\n`;
            ecosystem.workflow_integrations.forEach(workflow => {
                doc += `### ${workflow.filename}\n`;
                doc += `- **MCP References:** ${workflow.mcp_references.length}\n`;
                if (workflow.mcp_references.length > 0) {
                    doc += `- **Key Lines:**\n`;
                    workflow.mcp_references.forEach(ref => {
                        doc += `  - Line ${ref.line}: \`${ref.content}\`\n`;
                    });
                }
                doc += `\n`;
            });
        }

        doc += `## 🔄 Auto-Update Information\n\n`;
        doc += `This documentation is automatically updated by the MCP Documentation Automator.\n`;
        doc += `- **Last Scan:** ${timestamp}\n`;
        doc += `- **Auto-Update Script:** \`scripts/mcp-documentation-automator.js\`\n`;
        doc += `- **Trigger:** On MCP changes, schedule, or manual execution\n\n`;

        return doc;
    }

    /**
     * Update AGENTS.md with ecosystem status
     */
    async updateAgentsDocumentation(ecosystem) {
        try {
            const agentsDoc = await fs.readFile(this.agentsDocPath, 'utf-8');
            const ecosystemDoc = this.generateEcosystemDocumentation(ecosystem);
            
            // Insert or update the ecosystem status section
            let updatedDoc;
            const ecosystemSectionRegex = /## 🤖 MCP Ecosystem Status Report[\s\S]*?(?=##|$)/;
            
            if (agentsDoc.match(ecosystemSectionRegex)) {
                updatedDoc = agentsDoc.replace(
                    ecosystemSectionRegex,
                    ecosystemDoc.replace('# 🤖 MCP Ecosystem Status Report', '## 🤖 MCP Ecosystem Status Report')
                );
            } else {
                // Append to end of document
                updatedDoc = agentsDoc + '\n\n' + ecosystemDoc.replace('# 🤖 MCP Ecosystem Status Report', '## 🤖 MCP Ecosystem Status Report');
            }

            await fs.writeFile(this.agentsDocPath, updatedDoc);
            console.log('📝 Updated AGENTS.md with current MCP ecosystem status');
            
            return true;
        } catch (error) {
            console.error('❌ Error updating AGENTS.md:', error.message);
            return false;
        }
    }

    /**
     * Generate installation instructions for new MCPs
     */
    generateInstallationInstructions(mcpList) {
        let instructions = `# 🔧 MCP Installation Instructions\n\n`;
        instructions += `**Generated:** ${new Date().toISOString()}\n\n`;

        if (mcpList.length === 0) {
            instructions += `No new MCP servers to install.\n\n`;
            return instructions;
        }

        instructions += `## 📦 New MCP Servers to Install\n\n`;
        
        mcpList.forEach((mcp, index) => {
            instructions += `### ${index + 1}. ${mcp.name}\n\n`;
            instructions += `**Installation:**\n`;
            instructions += `\`\`\`bash\n`;
            instructions += `# Install the MCP server\n`;
            
            if (mcp.source === 'npm') {
                instructions += `npm install ${mcp.package_name}\n`;
            } else if (mcp.source === 'github') {
                instructions += `npm install ${mcp.package_name}\n`;
                instructions += `# Or clone from source:\n`;
                instructions += `git clone ${mcp.clone_url}\n`;
            }
            
            instructions += `\n# Add to MCP orchestrator configuration\n`;
            instructions += `# Update mcp-server/orchestration-engine.js\n`;
            instructions += `\`\`\`\n\n`;
            
            instructions += `**Configuration:**\n`;
            instructions += `\`\`\`javascript\n`;
            instructions += `// Add to mcp-server/orchestration-engine.js\n`;
            instructions += `const ${this.camelCase(mcp.name)} = {\n`;
            instructions += `  name: '${mcp.name}',\n`;
            instructions += `  package: '${mcp.package_name}',\n`;
            instructions += `  description: '${mcp.description || 'New MCP server'}',\n`;
            instructions += `  enabled: true,\n`;
            instructions += `  priority: ${this.calculatePriority(mcp)}\n`;
            instructions += `};\n`;
            instructions += `\`\`\`\n\n`;
            
            instructions += `**Validation:**\n`;
            instructions += `\`\`\`bash\n`;
            instructions += `# Test the new MCP server\n`;
            instructions += `node scripts/test-community-mcp-servers.js --server=${mcp.name}\n`;
            instructions += `\`\`\`\n\n`;
        });

        return instructions;
    }

    /**
     * Convert string to camelCase
     */
    camelCase(str) {
        return str.replace(/[-_@/]/g, ' ')
                  .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
                      index === 0 ? word.toLowerCase() : word.toUpperCase())
                  .replace(/\s+/g, '');
    }

    /**
     * Calculate integration priority
     */
    calculatePriority(mcp) {
        if (mcp.relevance_score >= 8) return 'high';
        if (mcp.relevance_score >= 5) return 'medium';
        return 'low';
    }

    /**
     * Update changelog with MCP changes
     */
    async updateChangelog(changes) {
        const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');
        
        try {
            let changelog = '';
            try {
                changelog = await fs.readFile(changelogPath, 'utf-8');
            } catch (e) {
                // Create new changelog if it doesn't exist
                changelog = `# Changelog\n\nAll notable changes to EchoTune AI will be documented in this file.\n\n`;
            }

            const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            const newEntry = `## [MCP Updates] - ${timestamp}\n\n`;
            
            let hasChanges = false;
            
            if (changes.added && changes.added.length > 0) {
                hasChanges = true;
                let addedSection = `### Added\n`;
                changes.added.forEach(mcp => {
                    addedSection += `- MCP Server: ${mcp.name} - ${mcp.description}\n`;
                });
                addedSection += `\n`;
                newEntry += addedSection;
            }
            
            if (changes.updated && changes.updated.length > 0) {
                hasChanges = true;
                newEntry += `### Updated\n`;
                changes.updated.forEach(mcp => {
                    newEntry += `- MCP Server: ${mcp.name} - ${mcp.changes}\n`;
                });
                newEntry += `\n`;
            }
            
            if (changes.removed && changes.removed.length > 0) {
                hasChanges = true;
                newEntry += `### Removed\n`;
                changes.removed.forEach(mcp => {
                    newEntry += `- MCP Server: ${mcp.name} - ${mcp.reason}\n`;
                });
                newEntry += `\n`;
            }

            if (hasChanges) {
                // Insert new entry after the header
                const lines = changelog.split('\n');
                const headerEndIndex = lines.findIndex(line => line.startsWith('##') && !line.includes('[MCP Updates]'));
                if (headerEndIndex > 0) {
                    lines.splice(headerEndIndex, 0, newEntry);
                } else {
                    lines.push('', newEntry);
                }
                
                const updatedChangelog = lines.join('\n');
                await fs.writeFile(changelogPath, updatedChangelog);
                console.log('📝 Updated CHANGELOG.md with MCP changes');
            }
            
            return hasChanges;
        } catch (error) {
            console.error('❌ Error updating changelog:', error.message);
            return false;
        }
    }

    /**
     * Run complete documentation automation
     */
    async automate(options = {}) {
        console.log('📚 Starting MCP Documentation Automation...\n');

        try {
            // Scan current ecosystem
            console.log('🔍 Scanning MCP ecosystem...');
            const ecosystem = await this.scanMCPEcosystem();
            
            console.log(`📊 Ecosystem Summary:`);
            console.log(`   Package Dependencies: ${ecosystem.package_dependencies.length}`);
            console.log(`   Community Servers: ${ecosystem.community_servers.length}`);
            console.log(`   Custom Servers: ${ecosystem.custom_servers.length}`);
            console.log(`   Workflow Integrations: ${ecosystem.workflow_integrations.length}`);

            // Update documentation
            console.log('\n📝 Updating documentation...');
            const agentsUpdated = await this.updateAgentsDocumentation(ecosystem);

            // Generate installation instructions if new MCPs provided
            if (options.newMCPs && options.newMCPs.length > 0) {
                console.log('\n🔧 Generating installation instructions...');
                const instructions = this.generateInstallationInstructions(options.newMCPs);
                
                const instructionsPath = path.join(__dirname, '..', 'MCP_INSTALLATION_INSTRUCTIONS.md');
                await fs.writeFile(instructionsPath, instructions);
                console.log(`   Instructions saved to: ${instructionsPath}`);

                // Update changelog
                console.log('\n📝 Updating changelog...');
                await this.updateChangelog({
                    added: options.newMCPs
                });
            }

            // Save ecosystem report
            const reportPath = path.join(__dirname, '..', 'mcp-ecosystem-report.json');
            await fs.writeFile(reportPath, JSON.stringify(ecosystem, null, 2));

            return {
                success: true,
                ecosystem,
                updated_docs: agentsUpdated,
                report_path: reportPath
            };

        } catch (error) {
            console.error('❌ Documentation automation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// CLI execution
if (require.main === module) {
    const automator = new MCPDocumentationAutomator();
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const options = {};
    
    // Check if there's a discovery report to process
    const discoveryReportPath = path.join(__dirname, '..', 'mcp-discovery-report.json');
    fs.readFile(discoveryReportPath, 'utf-8')
        .then(content => {
            const report = JSON.parse(content);
            options.newMCPs = report.top_candidates;
            return automator.automate(options);
        })
        .catch(() => {
            // No discovery report, just run normal automation
            return automator.automate(options);
        })
        .then(result => {
            if (result.success) {
                console.log('\n🎉 Documentation automation completed successfully!');
                console.log(`   Report saved to: ${result.report_path}`);
                process.exit(0);
            } else {
                console.error(`\n❌ Documentation automation failed: ${result.error}`);
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('❌ Unexpected error:', error);
            process.exit(1);
        });
}

module.exports = MCPDocumentationAutomator;