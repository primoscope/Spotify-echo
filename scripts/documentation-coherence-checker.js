#!/usr/bin/env node

/**
 * Documentation Coherence Analysis Tool
 * Cross-references documentation against actual implementation
 * Validates environment variables, API endpoints, and feature descriptions
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class DocumentationCoherenceChecker {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            summary: {
                totalDocsAnalyzed: 0,
                inconsistencies: 0,
                missingFeatures: 0,
                outdatedInfo: 0,
                brokenLinks: 0
            },
            analysis: {
                environmentVariables: {
                    documented: [],
                    implemented: [],
                    missing: [],
                    obsolete: []
                },
                apiEndpoints: {
                    documented: [],
                    implemented: [],
                    missing: [],
                    obsolete: []
                },
                features: {
                    documented: [],
                    implemented: [],
                    missing: [],
                    incomplete: []
                },
                brokenLinks: [],
                versionMismatches: []
            },
            recommendations: []
        };
        
        this.codebase = {
            envVars: new Set(),
            apiEndpoints: new Set(),
            features: new Set()
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

    async scanCodebaseForEnvVars() {
        this.log('🔍 Scanning codebase for environment variables...', 'info');
        
        const patterns = [
            /process\.env\.([A-Z_][A-Z0-9_]*)/g,
            /\$\{([A-Z_][A-Z0-9_]*)\}/g,
            /os\.getenv\(['"]([A-Z_][A-Z0-9_]*)['"]\)/g
        ];

        const searchDirectories = ['src', 'scripts', 'mcp-server'];
        
        for (const dir of searchDirectories) {
            try {
                const files = await this.getFilesRecursively(dir, ['.js', '.ts', '.py']);
                
                for (const file of files) {
                    try {
                        const content = await fs.readFile(file, 'utf8');
                        
                        patterns.forEach(pattern => {
                            let match;
                            while ((match = pattern.exec(content)) !== null) {
                                this.codebase.envVars.add(match[1]);
                            }
                        });
                    } catch (error) {
                        // Skip files that can't be read
                    }
                }
            } catch (error) {
                // Skip directories that don't exist
            }
        }

        this.results.analysis.environmentVariables.implemented = Array.from(this.codebase.envVars);
        this.log(`🔍 Found ${this.codebase.envVars.size} environment variables in code`, 'info');
    }

    async scanCodebaseForAPIEndpoints() {
        this.log('🔍 Scanning codebase for API endpoints...', 'info');
        
        const routePatterns = [
            /app\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/g,
            /router\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/g,
            /\.route\(['"`]([^'"`]+)['"`]\)/g,
            /@(Get|Post|Put|Delete|Patch)\(['"`]([^'"`]+)['"`]\)/g
        ];

        try {
            const files = await this.getFilesRecursively('src', ['.js', '.ts']);
            
            for (const file of files) {
                try {
                    const content = await fs.readFile(file, 'utf8');
                    
                    routePatterns.forEach(pattern => {
                        let match;
                        while ((match = pattern.exec(content)) !== null) {
                            const endpoint = match[2] || match[1];
                            if (endpoint && endpoint.startsWith('/')) {
                                this.codebase.apiEndpoints.add(endpoint);
                            }
                        }
                    });
                } catch (error) {
                    // Skip files that can't be read
                }
            }
        } catch (error) {
            // Handle case where src directory doesn't exist
        }

        this.results.analysis.apiEndpoints.implemented = Array.from(this.codebase.apiEndpoints);
        this.log(`🔍 Found ${this.codebase.apiEndpoints.size} API endpoints in code`, 'info');
    }

    async getFilesRecursively(dir, extensions) {
        const files = [];
        
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                
                if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                    const subFiles = await this.getFilesRecursively(fullPath, extensions);
                    files.push(...subFiles);
                } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            // Directory doesn't exist or can't be read
        }
        
        return files;
    }

    async analyzeMarkdownFile(filePath) {
        this.log(`📄 Analyzing: ${filePath}`, 'info');
        
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const analysis = {
                path: filePath,
                envVars: [],
                apiEndpoints: [],
                features: [],
                links: [],
                versionInfo: [],
                inconsistencies: []
            };

            // Extract environment variables from documentation
            const envPatterns = [
                /`([A-Z_][A-Z0-9_]*)`/g,
                /\$\{([A-Z_][A-Z0-9_]*)\}/g,
                /([A-Z_][A-Z0-9_]*)\s*=\s*/g
            ];

            envPatterns.forEach(pattern => {
                let match;
                while ((match = pattern.exec(content)) !== null) {
                    const envVar = match[1];
                    if (envVar && envVar.length > 2 && envVar.includes('_')) {
                        analysis.envVars.push(envVar);
                    }
                }
            });

            // Extract API endpoints from documentation
            const apiPatterns = [
                /`(GET|POST|PUT|DELETE|PATCH)\s+([^`]+)`/g,
                /`(\/[^`\s]+)`/g,
                /endpoint[:\s]+[`'"](\/[^`'"]+)[`'"]/gi
            ];

            apiPatterns.forEach(pattern => {
                let match;
                while ((match = pattern.exec(content)) !== null) {
                    const endpoint = match[2] || match[1];
                    if (endpoint && endpoint.startsWith('/')) {
                        analysis.apiEndpoints.push(endpoint);
                    }
                }
            });

            // Extract features mentioned
            const featurePatterns = [
                /^#+\s*(.+)$/gm,
                /\*\*(.+)\*\*/g,
                /Feature[s]?[:\s]+(.+)/gi
            ];

            featurePatterns.forEach(pattern => {
                let match;
                while ((match = pattern.exec(content)) !== null) {
                    const feature = match[1].trim();
                    if (feature.length > 5 && feature.length < 100) {
                        analysis.features.push(feature);
                    }
                }
            });

            // Extract links
            const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
            let linkMatch;
            while ((linkMatch = linkPattern.exec(content)) !== null) {
                analysis.links.push({
                    text: linkMatch[1],
                    url: linkMatch[2]
                });
            }

            // Extract version information
            const versionPatterns = [
                /Version[:\s]*([0-9]+\.[0-9]+\.[0-9]+)/gi,
                /v([0-9]+\.[0-9]+\.[0-9]+)/gi,
                /Node\.js\s+([0-9]+\.[0-9]+)/gi,
                /npm\s+([0-9]+\.[0-9]+)/gi
            ];

            versionPatterns.forEach(pattern => {
                let match;
                while ((match = pattern.exec(content)) !== null) {
                    analysis.versionInfo.push({
                        type: pattern.source.includes('Node') ? 'nodejs' : 'general',
                        version: match[1]
                    });
                }
            });

            return analysis;

        } catch (error) {
            this.log(`❌ Error analyzing ${filePath}: ${error.message}`, 'error');
            return null;
        }
    }

    async analyzeDocs() {
        this.log('📚 Analyzing documentation files...', 'info');
        
        const docFiles = [];
        const rootFiles = [
            'README.md',
            'API_DOCUMENTATION.md',
            'DEPLOYMENT.md',
            'CONFIGURATION_GUIDE.md',
            'CODING_AGENT_GUIDE.md'
        ];

        // Add root markdown files
        for (const file of rootFiles) {
            try {
                await fs.access(file);
                docFiles.push(file);
            } catch (error) {
                // File doesn't exist
            }
        }

        // Add docs directory files
        try {
            const docsDir = 'docs';
            const docsFiles = await this.getFilesRecursively(docsDir, ['.md']);
            docFiles.push(...docsFiles);
        } catch (error) {
            // docs directory doesn't exist
        }

        this.results.summary.totalDocsAnalyzed = docFiles.length;

        const allDocEnvVars = new Set();
        const allDocEndpoints = new Set();
        const allDocFeatures = new Set();
        const allLinks = [];

        for (const docFile of docFiles) {
            const analysis = await this.analyzeMarkdownFile(docFile);
            if (analysis) {
                analysis.envVars.forEach(env => allDocEnvVars.add(env));
                analysis.apiEndpoints.forEach(api => allDocEndpoints.add(api));
                analysis.features.forEach(feature => allDocFeatures.add(feature));
                allLinks.push(...analysis.links);
                
                // Store version info for comparison
                this.results.analysis.versionMismatches.push(...analysis.versionInfo.map(v => ({
                    file: docFile,
                    ...v
                })));
            }
        }

        this.results.analysis.environmentVariables.documented = Array.from(allDocEnvVars);
        this.results.analysis.apiEndpoints.documented = Array.from(allDocEndpoints);
        this.results.analysis.features.documented = Array.from(allDocFeatures);

        // Check for broken links
        await this.checkLinks(allLinks);
    }

    async checkLinks(links) {
        this.log('🔗 Checking links...', 'info');
        
        for (const link of links) {
            try {
                // Check internal links (files and anchors)
                if (link.url.startsWith('./') || link.url.startsWith('../') || !link.url.includes('://')) {
                    const filePath = path.resolve(link.url.split('#')[0]);
                    try {
                        await fs.access(filePath);
                        // Link is valid
                    } catch (error) {
                        this.results.analysis.brokenLinks.push({
                            text: link.text,
                            url: link.url,
                            reason: 'File not found'
                        });
                    }
                }
                // External links would need HTTP checking, skipping for now to avoid timeouts
            } catch (error) {
                // Skip link checking errors
            }
        }

        this.results.summary.brokenLinks = this.results.analysis.brokenLinks.length;
    }

    compareEnvVars() {
        const documented = this.results.analysis.environmentVariables.documented;
        const implemented = this.results.analysis.environmentVariables.implemented;

        // Find missing (in docs but not in code)
        this.results.analysis.environmentVariables.missing = documented.filter(env => 
            !implemented.includes(env)
        );

        // Find obsolete (in code but not in docs)
        this.results.analysis.environmentVariables.obsolete = implemented.filter(env => 
            !documented.includes(env)
        );
    }

    compareAPIEndpoints() {
        const documented = this.results.analysis.apiEndpoints.documented;
        const implemented = this.results.analysis.apiEndpoints.implemented;

        // Find missing (in docs but not implemented)
        this.results.analysis.apiEndpoints.missing = documented.filter(api => 
            !implemented.some(impl => impl.includes(api.replace(/\{[^}]+\}/g, '')))
        );

        // Find obsolete (implemented but not documented)
        this.results.analysis.apiEndpoints.obsolete = implemented.filter(api => 
            !documented.some(doc => api.includes(doc.replace(/\{[^}]+\}/g, '')))
        );
    }

    generateRecommendations() {
        const recs = [];
        
        if (this.results.analysis.environmentVariables.obsolete.length > 0) {
            recs.push(`Document ${this.results.analysis.environmentVariables.obsolete.length} environment variables used in code`);
        }
        
        if (this.results.analysis.environmentVariables.missing.length > 0) {
            recs.push(`Remove or implement ${this.results.analysis.environmentVariables.missing.length} environment variables documented but not used`);
        }
        
        if (this.results.analysis.apiEndpoints.obsolete.length > 0) {
            recs.push(`Document ${this.results.analysis.apiEndpoints.obsolete.length} API endpoints that exist in code`);
        }
        
        if (this.results.analysis.apiEndpoints.missing.length > 0) {
            recs.push(`Implement or remove documentation for ${this.results.analysis.apiEndpoints.missing.length} API endpoints`);
        }
        
        if (this.results.analysis.brokenLinks.length > 0) {
            recs.push(`Fix ${this.results.analysis.brokenLinks.length} broken internal links in documentation`);
        }
        
        recs.push('Create automated documentation validation in CI/CD pipeline');
        recs.push('Set up documentation version synchronization with releases');
        
        this.results.recommendations = recs;
    }

    async generateReport() {
        const reportPath = 'DOCUMENTATION_COHERENCE_REPORT.md';
        let report = `# 📚 EchoTune AI - Documentation Coherence Report\n\n`;
        
        report += `**Generated:** ${this.results.timestamp}\n`;
        report += `**Documents Analyzed:** ${this.results.summary.totalDocsAnalyzed}\n`;
        report += `**Environment Variable Issues:** ${this.results.analysis.environmentVariables.missing.length + this.results.analysis.environmentVariables.obsolete.length}\n`;
        report += `**API Endpoint Issues:** ${this.results.analysis.apiEndpoints.missing.length + this.results.analysis.apiEndpoints.obsolete.length}\n`;
        report += `**Broken Links:** ${this.results.summary.brokenLinks}\n\n`;

        // Environment Variables Analysis
        report += `## Environment Variables\n\n`;
        report += `**Documented:** ${this.results.analysis.environmentVariables.documented.length}\n`;
        report += `**Implemented:** ${this.results.analysis.environmentVariables.implemented.length}\n\n`;

        if (this.results.analysis.environmentVariables.obsolete.length > 0) {
            report += `### Missing from Documentation\n\n`;
            this.results.analysis.environmentVariables.obsolete.forEach(env => {
                report += `- \`${env}\`\n`;
            });
            report += `\n`;
        }

        if (this.results.analysis.environmentVariables.missing.length > 0) {
            report += `### Documented but Not Used\n\n`;
            this.results.analysis.environmentVariables.missing.forEach(env => {
                report += `- \`${env}\`\n`;
            });
            report += `\n`;
        }

        // API Endpoints Analysis
        report += `## API Endpoints\n\n`;
        report += `**Documented:** ${this.results.analysis.apiEndpoints.documented.length}\n`;
        report += `**Implemented:** ${this.results.analysis.apiEndpoints.implemented.length}\n\n`;

        if (this.results.analysis.apiEndpoints.obsolete.length > 0) {
            report += `### Missing from Documentation\n\n`;
            this.results.analysis.apiEndpoints.obsolete.forEach(api => {
                report += `- \`${api}\`\n`;
            });
            report += `\n`;
        }

        if (this.results.analysis.apiEndpoints.missing.length > 0) {
            report += `### Documented but Not Implemented\n\n`;
            this.results.analysis.apiEndpoints.missing.forEach(api => {
                report += `- \`${api}\`\n`;
            });
            report += `\n`;
        }

        // Broken Links
        if (this.results.analysis.brokenLinks.length > 0) {
            report += `## Broken Links\n\n`;
            this.results.analysis.brokenLinks.forEach(link => {
                report += `- [${link.text}](${link.url}) - ${link.reason}\n`;
            });
            report += `\n`;
        }

        // Recommendations
        if (this.results.recommendations.length > 0) {
            report += `## Recommendations\n\n`;
            this.results.recommendations.forEach((rec, i) => {
                report += `${i + 1}. ${rec}\n`;
            });
            report += `\n`;
        }

        await fs.writeFile(reportPath, report, 'utf8');
        
        // Also generate JSON report
        const jsonReportPath = 'DOCUMENTATION_COHERENCE_REPORT.json';
        await fs.writeFile(jsonReportPath, JSON.stringify(this.results, null, 2), 'utf8');
        
        this.log(`📋 Reports generated:`, 'success');
        this.log(`   Markdown: ${reportPath}`, 'info');
        this.log(`   JSON: ${jsonReportPath}`, 'info');
    }

    async runFullAnalysis() {
        this.log('📚 Starting comprehensive documentation coherence analysis...', 'info');
        
        // Scan codebase
        await this.scanCodebaseForEnvVars();
        await this.scanCodebaseForAPIEndpoints();
        
        // Analyze documentation
        await this.analyzeDocs();
        
        // Compare and find inconsistencies
        this.compareEnvVars();
        this.compareAPIEndpoints();
        
        // Generate recommendations
        this.generateRecommendations();
        
        await this.generateReport();

        const totalIssues = this.results.analysis.environmentVariables.missing.length + 
                           this.results.analysis.environmentVariables.obsolete.length +
                           this.results.analysis.apiEndpoints.missing.length +
                           this.results.analysis.apiEndpoints.obsolete.length +
                           this.results.summary.brokenLinks;

        this.log(`🎉 Analysis complete!`, 'success');
        this.log(`📊 Found ${totalIssues} documentation inconsistencies`, totalIssues > 0 ? 'warning' : 'success');

        return this.results;
    }
}

// Main execution
if (require.main === module) {
    const checker = new DocumentationCoherenceChecker();
    checker.runFullAnalysis().catch(error => {
        console.error('❌ Analysis failed:', error);
        process.exit(1);
    });
}

module.exports = DocumentationCoherenceChecker;