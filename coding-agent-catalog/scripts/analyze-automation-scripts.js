#!/usr/bin/env node

/**
 * Automation Scripts Analyzer
 * Provides detailed analysis of scripts in the scripts/automation/ directory
 * Used by GPT-5 workflow for comprehensive code review
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class AutomationScriptAnalyzer {
    constructor() {
        this.automationDir = path.join(process.cwd(), 'scripts', 'automation');
        this.results = {
            files: [],
            summary: {
                totalFiles: 0,
                totalLines: 0,
                avgComplexity: 0,
                issues: [],
                recommendations: []
            }
        };
    }

    async analyzeDirectory() {
        console.log('🔍 Analyzing scripts/automation/ directory...');
        
        try {
            const files = await fs.readdir(this.automationDir);
            const jsFiles = files.filter(f => f.endsWith('.js'));
            
            this.results.summary.totalFiles = jsFiles.length;
            console.log(`📁 Found ${jsFiles.length} JavaScript files to analyze`);
            
            for (const file of jsFiles) {
                await this.analyzeFile(file);
            }
            
            this.calculateSummary();
            await this.generateReport();
            
        } catch (error) {
            console.error(`❌ Error analyzing automation directory: ${error.message}`);
            process.exit(1);
        }
    }

    async analyzeFile(filename) {
        const filepath = path.join(this.automationDir, filename);
        
        try {
            const content = await fs.readFile(filepath, 'utf8');
            const lines = content.split('\n');
            const analysis = {
                filename,
                filepath,
                lines: lines.length,
                functions: this.countFunctions(content),
                classes: this.countClasses(content),
                imports: this.countImports(content),
                complexity: this.calculateComplexity(content),
                hasTests: this.hasTestCoverage(content),
                hasDocumentation: this.hasDocumentation(content),
                errorHandling: this.analyzeErrorHandling(content),
                mcpIntegration: this.analyzesMCPIntegration(content),
                issues: [],
                recommendations: []
            };
            
            // Analyze specific patterns
            this.analyzePatterns(content, analysis);
            
            this.results.files.push(analysis);
            this.results.summary.totalLines += analysis.lines;
            
            console.log(`✅ Analyzed ${filename}: ${analysis.lines} lines, ${analysis.functions} functions`);
            
        } catch (error) {
            console.error(`❌ Error analyzing ${filename}: ${error.message}`);
        }
    }

    countFunctions(content) {
        const functionRegex = /(?:function\s+\w+|const\s+\w+\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>)|async\s+function\s+\w+)/g;
        return (content.match(functionRegex) || []).length;
    }

    countClasses(content) {
        const classRegex = /class\s+\w+/g;
        return (content.match(classRegex) || []).length;
    }

    countImports(content) {
        const importRegex = /(?:require\(|import\s+.*from)/g;
        return (content.match(importRegex) || []).length;
    }

    calculateComplexity(content) {
        // Simple complexity calculation based on control structures
        const complexityPatterns = [
            /if\s*\(/g,
            /else\s*if\s*\(/g,
            /for\s*\(/g,
            /while\s*\(/g,
            /switch\s*\(/g,
            /catch\s*\(/g,
            /try\s*\{/g,
            /\?\s*.*:/g  // ternary operators
        ];
        
        let complexity = 1; // base complexity
        complexityPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) complexity += matches.length;
        });
        
        return Math.min(complexity, 50); // cap at 50 for readability
    }

    hasTestCoverage(content) {
        // Check for test-related patterns
        const testPatterns = [
            /describe\s*\(/,
            /it\s*\(/,
            /test\s*\(/,
            /expect\s*\(/,
            /assert\s*\(/
        ];
        
        return testPatterns.some(pattern => pattern.test(content));
    }

    hasDocumentation(content) {
        // Check for JSDoc or comprehensive comments
        const docPatterns = [
            /\/\*\*[\s\S]*?\*\//,  // JSDoc
            /^\s*\/\/[^\n]*$/gm    // Single line comments
        ];
        
        return docPatterns.some(pattern => pattern.test(content));
    }

    analyzeErrorHandling(content) {
        const tryBlocks = (content.match(/try\s*\{/g) || []).length;
        const catchBlocks = (content.match(/catch\s*\(/g) || []).length;
        const errorChecks = (content.match(/if\s*\([^)]*error[^)]*\)/gi) || []).length;
        
        return {
            tryBlocks,
            catchBlocks,
            errorChecks,
            hasRobustHandling: tryBlocks > 0 && catchBlocks >= tryBlocks
        };
    }

    analyzesMCPIntegration(content) {
        const mcpPatterns = [
            /mcp/gi,
            /server/gi,
            /port.*300[1-9]/g,
            /health/gi,
            /orchestrat/gi
        ];
        
        const mcpScore = mcpPatterns.reduce((score, pattern) => {
            const matches = content.match(pattern);
            return score + (matches ? matches.length : 0);
        }, 0);
        
        return {
            score: mcpScore,
            isHighlyIntegrated: mcpScore > 5,
            patterns: mcpPatterns.map(p => ({
                pattern: p.source,
                matches: (content.match(p) || []).length
            })).filter(p => p.matches > 0)
        };
    }

    analyzePatterns(content, analysis) {
        // Check for async/await usage
        const asyncCount = (content.match(/async\s+/g) || []).length;
        const awaitCount = (content.match(/await\s+/g) || []).length;
        
        if (asyncCount > 0 && awaitCount === 0) {
            analysis.issues.push('Async functions defined but no await usage found');
        }
        
        // Check for console.log usage (might want structured logging)
        const consoleLogCount = (content.match(/console\.log\(/g) || []).length;
        if (consoleLogCount > 10) {
            analysis.recommendations.push('Consider using structured logging instead of console.log');
        }
        
        // Check for hardcoded ports or URLs
        const hardcodedPorts = content.match(/:\d{4,5}/g);
        if (hardcodedPorts && hardcodedPorts.length > 2) {
            analysis.issues.push('Multiple hardcoded ports found - consider configuration');
        }
        
        // Check for TODO/FIXME comments
        const todos = (content.match(/TODO|FIXME|XXX/gi) || []).length;
        if (todos > 0) {
            analysis.issues.push(`${todos} TODO/FIXME comments found`);
        }
        
        // Positive patterns
        if (content.includes('module.exports')) {
            analysis.recommendations.push('Good: Proper module exports for reusability');
        }
        
        if (analysis.errorHandling.hasRobustHandling) {
            analysis.recommendations.push('Good: Robust error handling implemented');
        }
        
        if (analysis.mcpIntegration.isHighlyIntegrated) {
            analysis.recommendations.push('Excellent: Strong MCP integration patterns');
        }
    }

    calculateSummary() {
        const totalFiles = this.results.files.length;
        
        if (totalFiles > 0) {
            this.results.summary.avgComplexity = Math.round(
                this.results.files.reduce((sum, f) => sum + f.complexity, 0) / totalFiles
            );
            
            // Collect all issues and recommendations
            this.results.files.forEach(file => {
                this.results.summary.issues.push(...file.issues.map(issue => `${file.filename}: ${issue}`));
                this.results.summary.recommendations.push(...file.recommendations.map(rec => `${file.filename}: ${rec}`));
            });
            
            // Add overall recommendations
            const highComplexityFiles = this.results.files.filter(f => f.complexity > 20);
            if (highComplexityFiles.length > 0) {
                this.results.summary.recommendations.push(
                    `Consider refactoring high complexity files: ${highComplexityFiles.map(f => f.filename).join(', ')}`
                );
            }
            
            const filesWithoutDocs = this.results.files.filter(f => !f.hasDocumentation);
            if (filesWithoutDocs.length > 0) {
                this.results.summary.recommendations.push(
                    `Add documentation to: ${filesWithoutDocs.map(f => f.filename).join(', ')}`
                );
            }
        }
    }

    async generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            directory: 'scripts/automation/',
            summary: this.results.summary,
            files: this.results.files.map(f => ({
                filename: f.filename,
                lines: f.lines,
                functions: f.functions,
                classes: f.classes,
                complexity: f.complexity,
                hasTests: f.hasTests,
                hasDocumentation: f.hasDocumentation,
                mcpIntegration: f.mcpIntegration.score,
                errorHandling: f.errorHandling.hasRobustHandling,
                issueCount: f.issues.length,
                recommendationCount: f.recommendations.length
            })),
            detailedAnalysis: this.results.files
        };
        
        // Write JSON report
        await fs.writeFile(
            path.join(process.cwd(), 'automation-analysis-report.json'),
            JSON.stringify(report, null, 2)
        );
        
        // Generate markdown summary
        const markdown = this.generateMarkdownSummary(report);
        await fs.writeFile(
            path.join(process.cwd(), 'automation-analysis-summary.md'),
            markdown
        );
        
        console.log('\n📊 Analysis Complete');
        console.log(`📁 Files analyzed: ${this.results.summary.totalFiles}`);
        console.log(`📏 Total lines: ${this.results.summary.totalLines}`);
        console.log(`🧮 Average complexity: ${this.results.summary.avgComplexity}`);
        console.log(`⚠️  Issues found: ${this.results.summary.issues.length}`);
        console.log(`💡 Recommendations: ${this.results.summary.recommendations.length}`);
        console.log('\n📄 Reports generated:');
        console.log('  - automation-analysis-report.json');
        console.log('  - automation-analysis-summary.md');
    }

    generateMarkdownSummary(report) {
        return `# 🔧 Automation Scripts Analysis Report

**Generated**: ${new Date(report.timestamp).toLocaleString()}  
**Directory**: \`${report.directory}\`

## 📊 Summary

- **Total Files**: ${report.summary.totalFiles}
- **Total Lines**: ${report.summary.totalLines}
- **Average Complexity**: ${report.summary.avgComplexity}/50
- **Issues Found**: ${report.summary.issues.length}
- **Recommendations**: ${report.summary.recommendations.length}

## 📁 File Analysis

${report.files.map(f => `### ${f.filename}

- **Lines**: ${f.lines}
- **Functions**: ${f.functions}
- **Classes**: ${f.classes}
- **Complexity**: ${f.complexity}/50
- **Has Tests**: ${f.hasTests ? '✅' : '❌'}
- **Has Documentation**: ${f.hasDocumentation ? '✅' : '❌'}
- **MCP Integration Score**: ${f.mcpIntegration}/10
- **Error Handling**: ${f.errorHandling ? '✅' : '❌'}
- **Issues**: ${f.issueCount}
- **Recommendations**: ${f.recommendationCount}

`).join('')}

## ⚠️ Issues Found

${report.summary.issues.length > 0 ? report.summary.issues.map(issue => `- ${issue}`).join('\n') : 'No major issues found! 🎉'}

## 💡 Recommendations

${report.summary.recommendations.length > 0 ? report.summary.recommendations.map(rec => `- ${rec}`).join('\n') : 'All files look good!'}

## 🎯 Overall Assessment

${this.generateOverallAssessment(report)}

---
*Generated by Automation Script Analyzer*
`;
    }

    generateOverallAssessment(report) {
        const avgComplexity = report.summary.avgComplexity;
        const issueCount = report.summary.issues.length;
        const hasDocumentation = report.files.filter(f => f.hasDocumentation).length;
        const docPercentage = Math.round((hasDocumentation / report.files.length) * 100);
        
        let assessment = '';
        
        if (avgComplexity <= 10 && issueCount <= 2) {
            assessment += '🌟 **Excellent**: Low complexity, minimal issues\n';
        } else if (avgComplexity <= 20 && issueCount <= 5) {
            assessment += '✅ **Good**: Manageable complexity, few issues\n';
        } else {
            assessment += '⚠️ **Needs Attention**: High complexity or multiple issues\n';
        }
        
        if (docPercentage >= 80) {
            assessment += '📚 **Well Documented**: ' + docPercentage + '% of files have documentation\n';
        } else {
            assessment += '📝 **Documentation Needed**: Only ' + docPercentage + '% of files documented\n';
        }
        
        // MCP integration assessment
        const mcpFiles = report.files.filter(f => f.mcpIntegration > 3).length;
        const mcpPercentage = Math.round((mcpFiles / report.files.length) * 100);
        
        if (mcpPercentage >= 50) {
            assessment += '🚀 **MCP-First Architecture**: Strong integration across ' + mcpPercentage + '% of files\n';
        } else {
            assessment += '🔧 **MCP Integration**: Present in ' + mcpPercentage + '% of files\n';
        }
        
        return assessment;
    }
}

// Run analysis if called directly
if (require.main === module) {
    const analyzer = new AutomationScriptAnalyzer();
    analyzer.analyzeDirectory()
        .then(() => {
            console.log('\n🎉 Automation script analysis completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Analysis failed:', error.message);
            process.exit(1);
        });
}

module.exports = AutomationScriptAnalyzer;