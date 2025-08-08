#!/usr/bin/env node

/**
 * MCP Server Auto-Discovery System
 * 
 * Discovers new community MCP servers relevant to EchoTune AI by:
 * 1. Searching GitHub/npm for MCP servers
 * 2. Filtering by relevance (music, code analysis, testing, etc.)
 * 3. Comparing against currently installed MCPs
 * 4. Proposing top candidates for integration
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');

class MCPDiscoveryEngine {
    constructor() {
        this.currentMCPs = new Set();
        this.relevantCategories = [
            'music', 'spotify', 'audio', 'recommendation',
            'code-analysis', 'linting', 'testing', 'security',
            'browser', 'automation', 'ui-testing', 'e2e',
            'database', 'mongodb', 'analytics', 'performance',
            'ai', 'ml', 'llm', 'embeddings', 'nlp',
            'deployment', 'docker', 'ci-cd', 'monitoring'
        ];
        this.mcpServersDir = path.join(__dirname, '..', 'mcp-servers');
        this.agentsDocPath = path.join(__dirname, '..', 'docs', 'guides', 'AGENTS.md');
    }

    /**
     * Load currently installed MCP servers
     */
    async loadCurrentMCPs() {
        try {
            // Read from package.json
            const packageJson = await fs.readFile(path.join(__dirname, '..', 'package.json'), 'utf-8');
            const pkg = JSON.parse(packageJson);
            
            // Extract MCP-related dependencies
            const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
            Object.keys(allDeps).forEach(dep => {
                if (dep.includes('mcp') || dep.includes('model-context-protocol')) {
                    this.currentMCPs.add(dep);
                }
            });

            // Read from mcp-servers directory
            const mcpDirs = await fs.readdir(this.mcpServersDir);
            mcpDirs.forEach(dir => this.currentMCPs.add(dir));

            // Read from AGENTS.md to find documented MCPs
            const agentsDoc = await fs.readFile(this.agentsDocPath, 'utf-8');
            const mcpMatches = agentsDoc.match(/@[\w-]+\/[\w-]+/g) || [];
            mcpMatches.forEach(match => this.currentMCPs.add(match));

            console.log(`📋 Loaded ${this.currentMCPs.size} currently installed MCPs:`, Array.from(this.currentMCPs));
        } catch (error) {
            console.error('❌ Error loading current MCPs:', error.message);
        }
    }

    /**
     * Search GitHub for MCP servers
     */
    async searchGitHubMCPs() {
        const queries = [
            'mcp-server topic:model-context-protocol',
            'model-context-protocol mcp server',
            '"@modelcontextprotocol" server',
            'mcp server music OR audio OR spotify',
            'mcp server testing OR automation OR browser',
            'mcp server code-analysis OR linting OR security'
        ];

        const discoveries = [];

        for (const query of queries) {
            try {
                const results = await this.githubSearch(query);
                discoveries.push(...results);
            } catch (error) {
                console.error(`❌ Error searching GitHub for "${query}":`, error.message);
            }
        }

        return this.deduplicateDiscoveries(discoveries);
    }

    /**
     * Search npm for MCP servers
     */
    async searchNpmMCPs() {
        const queries = [
            'mcp-server',
            'model-context-protocol',
            '@modelcontextprotocol'
        ];

        const discoveries = [];

        for (const query of queries) {
            try {
                const results = await this.npmSearch(query);
                discoveries.push(...results);
            } catch (error) {
                console.error(`❌ Error searching npm for "${query}":`, error.message);
            }
        }

        return this.deduplicateDiscoveries(discoveries);
    }

    /**
     * GitHub API search
     */
    async githubSearch(query) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'api.github.com',
                path: `/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=20`,
                method: 'GET',
                headers: {
                    'User-Agent': 'EchoTune-AI-MCP-Discovery',
                    'Accept': 'application/vnd.github.v3+json'
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        const discoveries = response.items?.map(repo => ({
                            name: repo.full_name,
                            description: repo.description || '',
                            stars: repo.stargazers_count,
                            url: repo.html_url,
                            clone_url: repo.clone_url,
                            language: repo.language,
                            topics: repo.topics || [],
                            updated_at: repo.updated_at,
                            source: 'github',
                            package_name: this.extractPackageName(repo.full_name),
                            relevance_score: this.calculateRelevanceScore(repo.description, repo.topics, repo.full_name)
                        })) || [];
                        
                        resolve(discoveries);
                    } catch (parseError) {
                        reject(new Error(`Failed to parse GitHub response: ${parseError.message}`));
                    }
                });
            });

            req.on('error', reject);
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('GitHub search timeout'));
            });
            
            req.end();
        });
    }

    /**
     * npm API search
     */
    async npmSearch(query) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'registry.npmjs.org',
                path: `/-/v1/search?text=${encodeURIComponent(query)}&size=20`,
                method: 'GET',
                headers: {
                    'User-Agent': 'EchoTune-AI-MCP-Discovery'
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        const discoveries = response.objects?.map(pkg => ({
                            name: pkg.package.name,
                            description: pkg.package.description || '',
                            version: pkg.package.version,
                            url: pkg.package.links?.homepage || pkg.package.links?.repository,
                            npm_url: `https://www.npmjs.com/package/${pkg.package.name}`,
                            keywords: pkg.package.keywords || [],
                            updated_at: pkg.package.date,
                            source: 'npm',
                            package_name: pkg.package.name,
                            relevance_score: this.calculateRelevanceScore(pkg.package.description, pkg.package.keywords, pkg.package.name)
                        })) || [];
                        
                        resolve(discoveries);
                    } catch (parseError) {
                        reject(new Error(`Failed to parse npm response: ${parseError.message}`));
                    }
                });
            });

            req.on('error', reject);
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('npm search timeout'));
            });
            
            req.end();
        });
    }

    /**
     * Calculate relevance score based on EchoTune AI needs
     */
    calculateRelevanceScore(description = '', keywords = [], name = '') {
        let score = 0;
        const text = `${description} ${keywords.join(' ')} ${name}`.toLowerCase();

        // High priority categories (music/audio related)
        if (text.match(/music|audio|spotify|sound|recommendation|playlist/)) score += 10;
        
        // Development tools
        if (text.match(/code|lint|test|security|analysis/)) score += 8;
        
        // Browser automation
        if (text.match(/browser|puppeteer|playwright|selenium|automation/)) score += 7;
        
        // Database/analytics
        if (text.match(/database|mongodb|analytics|performance|monitoring/)) score += 6;
        
        // AI/ML related
        if (text.match(/ai|ml|llm|embeddings|nlp|neural/)) score += 5;
        
        // General utility
        if (text.match(/utility|tool|helper|server|protocol/)) score += 3;

        // Bonus for recent activity (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        if (new Date(keywords.updated_at) > sixMonthsAgo) score += 2;

        return score;
    }

    /**
     * Extract package name from various formats
     */
    extractPackageName(fullName) {
        if (fullName.includes('/')) {
            const parts = fullName.split('/');
            return `@${parts[0]}/${parts[1]}`;
        }
        return fullName;
    }

    /**
     * Remove duplicate discoveries
     */
    deduplicateDiscoveries(discoveries) {
        const seen = new Set();
        return discoveries.filter(discovery => {
            const key = discovery.package_name || discovery.name;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    /**
     * Filter discoveries by relevance and novelty
     */
    async filterDiscoveries(discoveries) {
        // Remove already installed MCPs
        const filtered = discoveries.filter(discovery => {
            const packageName = discovery.package_name || discovery.name;
            return !Array.from(this.currentMCPs).some(current => 
                current.includes(packageName) || packageName.includes(current)
            );
        });

        // Sort by relevance score
        const sorted = filtered.sort((a, b) => b.relevance_score - a.relevance_score);
        
        // Return top candidates
        return sorted.slice(0, 10);
    }

    /**
     * Generate discovery report
     */
    async generateReport(topCandidates) {
        const timestamp = new Date().toISOString();
        const report = {
            timestamp,
            total_discoveries: topCandidates.length,
            current_mcps: Array.from(this.currentMCPs),
            top_candidates: topCandidates.map(candidate => ({
                name: candidate.name,
                package_name: candidate.package_name,
                description: candidate.description,
                relevance_score: candidate.relevance_score,
                source: candidate.source,
                url: candidate.url,
                integration_suggestion: this.generateIntegrationSuggestion(candidate)
            }))
        };

        // Save to file
        const reportPath = path.join(__dirname, '..', 'mcp-discovery-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        return { report, reportPath };
    }

    /**
     * Generate integration suggestion for a candidate
     */
    generateIntegrationSuggestion(candidate) {
        const suggestions = [];
        const text = `${candidate.description} ${candidate.name}`.toLowerCase();

        if (text.match(/music|spotify|audio/)) {
            suggestions.push("High priority: Direct relevance to EchoTune AI music features");
        }
        
        if (text.match(/test|browser|automation/)) {
            suggestions.push("Medium priority: Useful for CI/CD and testing workflows");
        }
        
        if (text.match(/security|lint|analysis/)) {
            suggestions.push("Medium priority: Code quality and security improvements");
        }
        
        if (text.match(/database|analytics/)) {
            suggestions.push("Low priority: Infrastructure and monitoring enhancements");
        }

        if (suggestions.length === 0) {
            suggestions.push("Evaluate: Review documentation for specific use cases");
        }

        return suggestions.join('; ');
    }

    /**
     * Update AGENTS.md with new discoveries
     */
    async updateDocumentation(topCandidates) {
        try {
            const agentsDoc = await fs.readFile(this.agentsDocPath, 'utf-8');
            
            // Create new MCP discoveries section
            const discoverySection = this.generateDiscoverySection(topCandidates);
            
            // Insert or update the discoveries section
            let updatedDoc;
            if (agentsDoc.includes('## 🔍 Recently Discovered MCP Servers')) {
                updatedDoc = agentsDoc.replace(
                    /## 🔍 Recently Discovered MCP Servers[\s\S]*?(?=##|$)/,
                    discoverySection
                );
            } else {
                // Insert before the last section
                const lastSectionIndex = agentsDoc.lastIndexOf('##');
                if (lastSectionIndex > 0) {
                    updatedDoc = agentsDoc.slice(0, lastSectionIndex) + 
                                 discoverySection + '\n\n' + 
                                 agentsDoc.slice(lastSectionIndex);
                } else {
                    updatedDoc = agentsDoc + '\n\n' + discoverySection;
                }
            }

            await fs.writeFile(this.agentsDocPath, updatedDoc);
            console.log(`📝 Updated AGENTS.md with ${topCandidates.length} new discoveries`);
        } catch (error) {
            console.error('❌ Error updating documentation:', error.message);
        }
    }

    /**
     * Generate documentation section for discoveries
     */
    generateDiscoverySection(candidates) {
        const timestamp = new Date().toLocaleDateString();
        let section = `## 🔍 Recently Discovered MCP Servers\n\n*Last updated: ${timestamp}*\n\n`;
        
        if (candidates.length === 0) {
            section += 'No new MCP servers discovered in the latest scan.\n\n';
            return section;
        }

        section += 'The following MCP servers were discovered and may be valuable additions to EchoTune AI:\n\n';

        candidates.forEach((candidate, index) => {
            section += `### ${index + 1}. ${candidate.name}\n`;
            section += `- **Package**: \`${candidate.package_name}\`\n`;
            section += `- **Description**: ${candidate.description}\n`;
            section += `- **Relevance Score**: ${candidate.relevance_score}/10\n`;
            section += `- **Source**: ${candidate.source}\n`;
            section += `- **URL**: [${candidate.url}](${candidate.url})\n`;
            section += `- **Integration Suggestion**: ${candidate.integration_suggestion}\n\n`;
        });

        section += '**Next Steps**: Review these candidates and consider integration based on project priorities.\n\n';
        
        return section;
    }

    /**
     * Run the complete discovery process
     */
    async discover() {
        console.log('🔍 Starting MCP Server Discovery...\n');

        try {
            // Load current MCPs
            await this.loadCurrentMCPs();

            console.log('🐙 Searching GitHub for MCP servers...');
            const githubDiscoveries = await this.searchGitHubMCPs();
            console.log(`   Found ${githubDiscoveries.length} GitHub repositories`);

            console.log('📦 Searching npm for MCP servers...');
            const npmDiscoveries = await this.searchNpmMCPs();
            console.log(`   Found ${npmDiscoveries.length} npm packages`);

            // Combine and filter discoveries
            const allDiscoveries = [...githubDiscoveries, ...npmDiscoveries];
            const topCandidates = await this.filterDiscoveries(allDiscoveries);

            console.log(`\n✨ Identified ${topCandidates.length} new candidates for integration:`);
            topCandidates.forEach((candidate, index) => {
                console.log(`   ${index + 1}. ${candidate.name} (score: ${candidate.relevance_score})`);
            });

            // Generate report
            const { report, reportPath } = await this.generateReport(topCandidates);
            console.log(`\n📊 Discovery report saved to: ${reportPath}`);

            // Update documentation
            await this.updateDocumentation(topCandidates);

            return {
                success: true,
                discoveries: topCandidates.length,
                report_path: reportPath,
                top_candidates: topCandidates
            };

        } catch (error) {
            console.error('❌ Discovery process failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// CLI execution
if (require.main === module) {
    const discovery = new MCPDiscoveryEngine();
    discovery.discover().then(result => {
        if (result.success) {
            console.log(`\n🎉 Discovery completed successfully! Found ${result.discoveries} new candidates.`);
            process.exit(0);
        } else {
            console.error(`\n❌ Discovery failed: ${result.error}`);
            process.exit(1);
        }
    }).catch(error => {
        console.error('❌ Unexpected error:', error);
        process.exit(1);
    });
}

module.exports = MCPDiscoveryEngine;