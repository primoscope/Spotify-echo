#!/usr/bin/env node

/**
 * Enhanced Documentation Review Script
 * Provides comprehensive analysis of project documentation quality
 * Used by /review-docs slash command for detailed documentation assessment
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class DocumentationReviewer {
    constructor() {
        this.rootDir = process.cwd();
        this.analysis = {
            overview: {
                totalFiles: 0,
                readmeFiles: 0,
                documentationScore: 0
            },
            quality: {
                readmeScore: 0,
                packageDocsScore: 0,
                completenessScore: 0
            },
            files: {
                existing: [],
                missing: [],
                recommended: []
            },
            recommendations: []
        };
    }

    async analyzeDocumentation() {
        console.log('📚 Starting comprehensive documentation analysis...');
        
        await this.scanDocumentationFiles();
        await this.analyzeReadmeQuality();
        await this.analyzePackageDocumentation();
        await this.checkCriticalDocumentation();
        await this.generateRecommendations();
        await this.calculateOverallScore();
        
        return this.analysis;
    }

    async scanDocumentationFiles() {
        console.log('📁 Scanning for documentation files...');
        
        try {
            const { stdout } = await execAsync('find . -name "*.md" -not -path "./node_modules/*" -not -path "./.git/*"');
            const mdFiles = stdout.trim().split('\n').filter(f => f.length > 0);
            
            this.analysis.overview.totalFiles = mdFiles.length;
            this.analysis.files.existing = mdFiles.map(f => f.replace('./', ''));
            
            // Count README files
            this.analysis.overview.readmeFiles = mdFiles.filter(f => 
                f.toLowerCase().includes('readme')
            ).length;
            
            console.log(`✅ Found ${mdFiles.length} documentation files`);
            
        } catch (error) {
            console.error(`❌ Error scanning documentation: ${error.message}`);
        }
    }

    async analyzeReadmeQuality() {
        console.log('📋 Analyzing README.md quality...');
        
        const readmePath = path.join(this.rootDir, 'README.md');
        let score = 0;
        
        try {
            const content = await fs.readFile(readmePath, 'utf8');
            const sections = [
                { name: 'Installation/Setup', pattern: /(installation|setup|getting started)/i },
                { name: 'Usage/Examples', pattern: /(usage|example|quickstart)/i },
                { name: 'API Documentation', pattern: /(api|endpoint|reference)/i },
                { name: 'Contributing Guidelines', pattern: /(contribut|development|guideline)/i },
                { name: 'License Information', pattern: /(license|copyright|mit|apache)/i },
                { name: 'Deployment Instructions', pattern: /(deploy|production|hosting)/i },
                { name: 'Architecture Overview', pattern: /(architecture|structure|design)/i },
                { name: 'Configuration Options', pattern: /(config|environment|setting)/i }
            ];
            
            const presentSections = [];
            const missingSections = [];
            
            for (const section of sections) {
                if (section.pattern.test(content)) {
                    score++;
                    presentSections.push(section.name);
                } else {
                    missingSections.push(section.name);
                }
            }
            
            this.analysis.quality.readmeScore = score;
            this.analysis.files.presentSections = presentSections;
            this.analysis.files.missingSections = missingSections;
            
            // Additional quality checks
            const wordCount = content.split(/\s+/).length;
            const lineCount = content.split('\n').length;
            
            this.analysis.quality.readmeWordCount = wordCount;
            this.analysis.quality.readmeLineCount = lineCount;
            this.analysis.quality.readmeCompleteness = wordCount > 500 ? 'Good' : wordCount > 200 ? 'Fair' : 'Poor';
            
            console.log(`✅ README.md analysis complete - Score: ${score}/8`);
            
        } catch (error) {
            console.log('❌ README.md not found or unreadable');
            this.analysis.recommendations.push('Create a comprehensive README.md file');
        }
    }

    async analyzePackageDocumentation() {
        console.log('📦 Analyzing package.json documentation...');
        
        const packagePath = path.join(this.rootDir, 'package.json');
        let score = 0;
        
        try {
            const content = await fs.readFile(packagePath, 'utf8');
            const pkg = JSON.parse(content);
            
            const requiredFields = [
                'description',
                'repository',
                'author',
                'keywords',
                'homepage',
                'bugs'
            ];
            
            const presentFields = [];
            const missingFields = [];
            
            for (const field of requiredFields) {
                if (pkg[field]) {
                    score++;
                    presentFields.push(field);
                } else {
                    missingFields.push(field);
                }
            }
            
            this.analysis.quality.packageDocsScore = score;
            this.analysis.quality.packagePresentFields = presentFields;
            this.analysis.quality.packageMissingFields = missingFields;
            
            console.log(`✅ Package.json analysis complete - Score: ${score}/6`);
            
        } catch (error) {
            console.log('❌ Package.json not found or invalid');
            this.analysis.recommendations.push('Fix or create package.json with proper documentation fields');
        }
    }

    async checkCriticalDocumentation() {
        console.log('🔍 Checking critical documentation files...');
        
        const criticalDocs = [
            { file: 'API_DOCUMENTATION.md', description: 'Comprehensive API reference' },
            { file: 'ARCHITECTURE.md', description: 'System architecture documentation' },
            { file: 'CONTRIBUTING.md', description: 'Contributor guidelines' },
            { file: 'CHANGELOG.md', description: 'Version history and changes' },
            { file: 'DEPLOYMENT.md', description: 'Deployment and operations guide' },
            { file: 'SETUP_GUIDE.md', description: 'Detailed setup instructions' },
            { file: '.github/ISSUE_TEMPLATE.md', description: 'Issue reporting templates' },
            { file: '.github/PULL_REQUEST_TEMPLATE.md', description: 'Pull request templates' }
        ];
        
        for (const doc of criticalDocs) {
            const filePath = path.join(this.rootDir, doc.file);
            try {
                const stats = await fs.stat(filePath);
                this.analysis.files.existing.push({
                    name: doc.file,
                    description: doc.description,
                    size: stats.size,
                    status: 'exists'
                });
            } catch (error) {
                this.analysis.files.missing.push({
                    name: doc.file,
                    description: doc.description,
                    status: 'missing'
                });
            }
        }
        
        console.log(`✅ Critical documentation check complete`);
    }

    async generateRecommendations() {
        console.log('💡 Generating recommendations...');
        
        const recommendations = [];
        
        // README improvements
        if (this.analysis.quality.readmeScore < 6) {
            recommendations.push({
                type: 'README',
                priority: 'High',
                action: 'Enhance README.md with missing sections',
                details: `Missing: ${this.analysis.files.missingSections?.join(', ') || 'multiple sections'}`
            });
        }
        
        // Package documentation
        if (this.analysis.quality.packageDocsScore < 4) {
            recommendations.push({
                type: 'Package',
                priority: 'Medium',
                action: 'Complete package.json documentation fields',
                details: `Add: ${this.analysis.quality.packageMissingFields?.join(', ') || 'description, repository, author'}`
            });
        }
        
        // Critical documentation
        const missingCriticalDocs = this.analysis.files.missing?.filter(f => 
            ['API_DOCUMENTATION.md', 'ARCHITECTURE.md', 'CONTRIBUTING.md'].includes(f.name)
        ) || [];
        
        if (missingCriticalDocs.length > 0) {
            recommendations.push({
                type: 'Critical',
                priority: 'High',
                action: 'Create missing critical documentation',
                details: missingCriticalDocs.map(f => f.name).join(', ')
            });
        }
        
        // Project-specific recommendations for EchoTune AI
        recommendations.push({
            type: 'Project-Specific',
            priority: 'Medium',
            action: 'Document Spotify API integration patterns',
            details: 'Create documentation for music recommendation algorithms and API usage patterns'
        });
        
        recommendations.push({
            type: 'Project-Specific',
            priority: 'Medium',
            action: 'Document MCP server configuration',
            details: 'Expand documentation for Model Context Protocol integrations and automation capabilities'
        });
        
        this.analysis.recommendations = recommendations;
        console.log(`✅ Generated ${recommendations.length} recommendations`);
    }

    async calculateOverallScore() {
        console.log('📊 Calculating overall documentation score...');
        
        const weights = {
            readme: 0.4,
            package: 0.2,
            critical: 0.3,
            completeness: 0.1
        };
        
        const readmeScore = (this.analysis.quality.readmeScore / 8) * 10;
        const packageScore = (this.analysis.quality.packageDocsScore / 6) * 10;
        const criticalScore = Math.max(0, (8 - (this.analysis.files.missing?.length || 8)) / 8) * 10;
        const completenessScore = this.analysis.overview.totalFiles > 10 ? 10 : (this.analysis.overview.totalFiles / 10) * 10;
        
        const overallScore = Math.round(
            (readmeScore * weights.readme) +
            (packageScore * weights.package) +
            (criticalScore * weights.critical) +
            (completenessScore * weights.completeness)
        );
        
        this.analysis.overview.documentationScore = overallScore;
        this.analysis.quality.breakdown = {
            readme: Math.round(readmeScore),
            package: Math.round(packageScore),
            critical: Math.round(criticalScore),
            completeness: Math.round(completenessScore)
        };
        
        console.log(`✅ Overall documentation score: ${overallScore}/10`);
    }

    async generateReport() {
        console.log('📄 Generating comprehensive documentation report...');
        
        const report = {
            timestamp: new Date().toISOString(),
            analysis: this.analysis,
            summary: {
                score: this.analysis.overview.documentationScore,
                grade: this.getGrade(this.analysis.overview.documentationScore),
                totalFiles: this.analysis.overview.totalFiles,
                highPriorityActions: this.analysis.recommendations.filter(r => r.priority === 'High').length
            }
        };
        
        // Save detailed JSON report
        await fs.writeFile('documentation-analysis-report.json', JSON.stringify(report, null, 2));
        
        // Generate markdown summary
        const markdownSummary = await this.generateMarkdownSummary();
        await fs.writeFile('documentation-analysis-summary.md', markdownSummary);
        
        console.log('✅ Reports saved: documentation-analysis-report.json, documentation-analysis-summary.md');
        
        return report;
    }

    async generateMarkdownSummary() {
        const score = this.analysis.overview.documentationScore;
        const grade = this.getGrade(score);
        
        return `# 📚 Documentation Analysis Summary

## Overall Assessment
- **Score**: ${score}/10 (Grade: ${grade})
- **Total Files**: ${this.analysis.overview.totalFiles}
- **README Quality**: ${this.analysis.quality.readmeScore}/8
- **Package Documentation**: ${this.analysis.quality.packageDocsScore}/6

## Quality Breakdown
- **README.md**: ${this.analysis.quality.breakdown?.readme || 0}/10
- **Package.json**: ${this.analysis.quality.breakdown?.package || 0}/10
- **Critical Docs**: ${this.analysis.quality.breakdown?.critical || 0}/10
- **Completeness**: ${this.analysis.quality.breakdown?.completeness || 0}/10

## High Priority Actions
${this.analysis.recommendations
    .filter(r => r.priority === 'High')
    .map(r => `- **${r.type}**: ${r.action}`)
    .join('\n') || 'None identified'}

## Recommendations Summary
${this.analysis.recommendations
    .map(r => `- [${r.priority}] **${r.type}**: ${r.action}`)
    .join('\n') || 'No specific recommendations'}

## Missing Critical Documentation
${this.analysis.files.missing
    ?.map(f => `- ${f.name}: ${f.description}`)
    .join('\n') || 'All critical documentation present'}

---
*Analysis generated on ${new Date().toISOString()}*
`;
    }

    getGrade(score) {
        if (score >= 9) return 'A+';
        if (score >= 8) return 'A';
        if (score >= 7) return 'B+';
        if (score >= 6) return 'B';
        if (score >= 5) return 'C+';
        if (score >= 4) return 'C';
        if (score >= 3) return 'D';
        return 'F';
    }
}

// Main execution
async function main() {
    const reviewer = new DocumentationReviewer();
    
    try {
        const analysis = await reviewer.analyzeDocumentation();
        const report = await reviewer.generateReport();
        
        console.log('\n🎉 Documentation analysis completed successfully!');
        console.log(`📊 Final Score: ${analysis.overview.documentationScore}/10 (${reviewer.getGrade(analysis.overview.documentationScore)})`);
        console.log(`📋 Recommendations: ${analysis.recommendations.length}`);
        console.log(`📁 Documentation Files: ${analysis.overview.totalFiles}`);
        
        return report;
    } catch (error) {
        console.error('❌ Documentation analysis failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = DocumentationReviewer;