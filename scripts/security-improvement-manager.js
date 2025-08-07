#!/usr/bin/env node

/**
 * Security and Dependency Improvement Script
 * Addresses findings from comprehensive MCP validation report
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

class SecurityImprovementManager {
    constructor() {
        this.reportPath = 'SECURITY_IMPROVEMENT_REPORT.json';
        this.findings = {
            dependencies: [],
            vulnerabilities: [],
            recommendations: [],
            resolved: []
        };
    }

    async run() {
        console.log('🔍 Starting Security and Dependency Analysis...\n');
        
        try {
            await this.analyzeVulnerabilities();
            await this.analyzeDependencies();
            await this.generateRecommendations();
            await this.generateReport();
            
            console.log('✅ Security analysis complete!');
            console.log(`📋 Report saved to: ${this.reportPath}`);
            
        } catch (error) {
            console.error('❌ Security analysis failed:', error.message);
            process.exit(1);
        }
    }

    async analyzeVulnerabilities() {
        console.log('🛡️  Analyzing security vulnerabilities...');
        
        try {
            const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
            const auditData = JSON.parse(auditResult);
            
            if (auditData.vulnerabilities) {
                Object.entries(auditData.vulnerabilities).forEach(([pkg, vuln]) => {
                    this.findings.vulnerabilities.push({
                        package: pkg,
                        severity: vuln.severity,
                        title: vuln.title || 'Unknown vulnerability',
                        fixAvailable: vuln.fixAvailable || false,
                        nodes: vuln.nodes?.length || 0
                    });
                });
            }
            
            console.log(`   Found ${this.findings.vulnerabilities.length} vulnerabilities`);
            
        } catch (error) {
            console.warn('   ⚠️  Could not complete vulnerability analysis');
        }
    }

    async analyzeDependencies() {
        console.log('📦 Analyzing dependency updates...');
        
        try {
            const outdatedResult = execSync('npm outdated --json', { encoding: 'utf8' });
            const outdatedData = JSON.parse(outdatedResult);
            
            Object.entries(outdatedData).forEach(([pkg, info]) => {
                this.findings.dependencies.push({
                    package: pkg,
                    current: info.current || 'MISSING',
                    wanted: info.wanted,
                    latest: info.latest,
                    updateType: this.determineUpdateType(info.current, info.latest)
                });
            });
            
            console.log(`   Found ${this.findings.dependencies.length} packages with updates`);
            
        } catch (error) {
            console.warn('   ⚠️  Could not complete dependency analysis');
        }
    }

    determineUpdateType(current, latest) {
        if (!current || current === 'MISSING') return 'missing';
        
        const currentParts = current.split('.');
        const latestParts = latest.split('.');
        
        if (currentParts[0] !== latestParts[0]) return 'major';
        if (currentParts[1] !== latestParts[1]) return 'minor';
        return 'patch';
    }

    async generateRecommendations() {
        console.log('💡 Generating improvement recommendations...');
        
        // High-priority security fixes
        const highSeverityVulns = this.findings.vulnerabilities.filter(v => 
            ['high', 'critical'].includes(v.severity)
        );
        
        if (highSeverityVulns.length > 0) {
            this.findings.recommendations.push({
                priority: 'HIGH',
                type: 'security',
                action: 'Immediately address high/critical vulnerabilities',
                packages: highSeverityVulns.map(v => v.package)
            });
        }

        // Medium-priority dependency updates
        const missingDeps = this.findings.dependencies.filter(d => d.current === 'MISSING');
        if (missingDeps.length > 0) {
            this.findings.recommendations.push({
                priority: 'MEDIUM',
                type: 'dependencies',
                action: 'Install missing dependencies',
                packages: missingDeps.map(d => d.package)
            });
        }

        // Minor version updates
        const minorUpdates = this.findings.dependencies.filter(d => d.updateType === 'minor');
        if (minorUpdates.length > 0) {
            this.findings.recommendations.push({
                priority: 'MEDIUM',
                type: 'updates',
                action: 'Apply minor version updates',
                packages: minorUpdates.slice(0, 12).map(d => d.package) // Top 12 as noted in validation
            });
        }

        console.log(`   Generated ${this.findings.recommendations.length} recommendations`);
    }

    async generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalVulnerabilities: this.findings.vulnerabilities.length,
                highPriorityVulns: this.findings.vulnerabilities.filter(v => ['high', 'critical'].includes(v.severity)).length,
                totalOutdatedPackages: this.findings.dependencies.length,
                missingPackages: this.findings.dependencies.filter(d => d.current === 'MISSING').length,
                recommendationsCount: this.findings.recommendations.length
            },
            findings: this.findings,
            nextActions: this.getNextActions()
        };

        fs.writeFileSync(this.reportPath, JSON.stringify(report, null, 2));
        
        // Also create a markdown summary
        this.generateMarkdownSummary(report);
    }

    generateMarkdownSummary(report) {
        const markdown = `# 🔒 Security Improvement Report

> **Generated**: ${new Date().toLocaleDateString()}  
> **Status**: ${report.summary.highPriorityVulns > 0 ? 'Action Required' : 'Monitoring'}

## 📊 Summary

- **Total Vulnerabilities**: ${report.summary.totalVulnerabilities}
- **High Priority**: ${report.summary.highPriorityVulns}
- **Outdated Packages**: ${report.summary.totalOutdatedPackages}
- **Missing Dependencies**: ${report.summary.missingPackages}

## 🎯 Immediate Actions Required

${report.nextActions.map(action => `- **${action.priority}**: ${action.description}`).join('\n')}

## 📋 Detailed Findings

### Security Vulnerabilities
${this.findings.vulnerabilities.map(v => 
    `- \`${v.package}\` - ${v.severity.toUpperCase()} - ${v.title}`
).join('\n') || 'None found'}

### Priority Dependency Updates
${this.findings.dependencies.slice(0, 10).map(d => 
    `- \`${d.package}\`: ${d.current} → ${d.latest} (${d.updateType})`
).join('\n') || 'All up to date'}

---
*This report aligns with the technical debt tracking established in the comprehensive MCP validation.*`;

        fs.writeFileSync('SECURITY_IMPROVEMENT_SUMMARY.md', markdown);
    }

    getNextActions() {
        const actions = [];
        
        if (this.findings.vulnerabilities.length > 0) {
            actions.push({
                priority: 'HIGH',
                description: 'Review and fix security vulnerabilities',
                command: 'npm audit fix'
            });
        }

        if (this.findings.dependencies.filter(d => d.current === 'MISSING').length > 0) {
            actions.push({
                priority: 'MEDIUM',
                description: 'Install missing dependencies',
                command: 'npm install'
            });
        }

        if (this.findings.dependencies.length > 10) {
            actions.push({
                priority: 'LOW',
                description: 'Plan systematic dependency updates',
                command: 'Review and schedule updates for non-critical packages'
            });
        }

        return actions;
    }
}

// Run the analysis if called directly
if (require.main === module) {
    const manager = new SecurityImprovementManager();
    manager.run().catch(console.error);
}

module.exports = SecurityImprovementManager;