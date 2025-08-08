#!/usr/bin/env node

/**
 * Comprehensive Filesystem & Codebase Analysis Tool
 * Identifies deprecated, orphaned, and redundant files in the EchoTune AI repository
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class FilesystemAnalyzer {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            summary: {
                totalFiles: 0,
                deprecated: 0,
                orphaned: 0,
                redundant: 0,
                analyzed: 0
            },
            analysis: {
                deprecated: [],
                orphaned: [],
                redundant: [],
                oversized: [],
                suspicious: []
            },
            directories: {
                src: { files: [], analysis: {} },
                scripts: { files: [], analysis: {} },
                docs: { files: [], analysis: {} },
                mcp: { files: [], analysis: {} },
                tests: { files: [], analysis: {} }
            },
            recommendations: []
        };
        
        // Patterns for identifying potentially deprecated files
        this.deprecatedPatterns = [
            /\.backup$/,
            /\.old$/,
            /\.orig$/,
            /\.bak$/,
            /deprecated/i,
            /legacy/i,
            /obsolete/i,
            /temp/i,
            /tmp/i,
            /_old\./,
            /_backup\./,
            /\.backup\./,
            /phase\d+/i,
            /test-.*-old/i
        ];
        
        // Patterns for redundant files
        this.redundantPatterns = [
            /duplicate/i,
            /copy/i,
            /-copy\./,
            /-\d+\./,
            /\(\d+\)\./
        ];
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

    async getFileStats(filePath) {
        try {
            const stats = await fs.stat(filePath);
            return {
                size: stats.size,
                modified: stats.mtime,
                created: stats.birthtime,
                isDirectory: stats.isDirectory()
            };
        } catch (error) {
            return null;
        }
    }

    async analyzeFile(filePath, fileName) {
        const stats = await this.getFileStats(filePath);
        if (!stats || stats.isDirectory) return null;

        const analysis = {
            path: filePath,
            name: fileName,
            size: stats.size,
            modified: stats.modified,
            extension: path.extname(fileName),
            flags: []
        };

        // Check for deprecated patterns
        if (this.deprecatedPatterns.some(pattern => pattern.test(fileName))) {
            analysis.flags.push('deprecated');
            this.results.analysis.deprecated.push(analysis);
            this.results.summary.deprecated++;
        }

        // Check for redundant patterns
        if (this.redundantPatterns.some(pattern => pattern.test(fileName))) {
            analysis.flags.push('redundant');
            this.results.analysis.redundant.push(analysis);
            this.results.summary.redundant++;
        }

        // Check for oversized files (>1MB)
        if (stats.size > 1024 * 1024) {
            analysis.flags.push('oversized');
            this.results.analysis.oversized.push(analysis);
        }

        // Check for old files (not modified in 30+ days)
        const daysSinceModified = (Date.now() - stats.modified.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceModified > 30) {
            analysis.flags.push('old');
        }

        return analysis;
    }

    async analyzeDirectory(dirPath, directoryKey) {
        this.log(`📁 Analyzing directory: ${dirPath}`, 'info');
        
        try {
            const entries = await fs.readdir(dirPath);
            const files = [];
            const subdirs = [];

            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry);
                const stats = await this.getFileStats(fullPath);
                
                if (!stats) continue;

                if (stats.isDirectory) {
                    subdirs.push(entry);
                } else {
                    const analysis = await this.analyzeFile(fullPath, entry);
                    if (analysis) {
                        files.push(analysis);
                        this.results.summary.analyzed++;
                    }
                }
            }

            // Store results
            this.results.directories[directoryKey] = {
                files,
                subdirectories: subdirs,
                analysis: this.analyzeDirectoryContents(files)
            };

            // Recursively analyze important subdirectories
            for (const subdir of subdirs) {
                if (!subdir.startsWith('.') && subdir !== 'node_modules') {
                    const subdirPath = path.join(dirPath, subdir);
                    const subdirKey = `${directoryKey}_${subdir}`;
                    await this.analyzeDirectory(subdirPath, subdirKey);
                }
            }

        } catch (error) {
            this.log(`❌ Error analyzing ${dirPath}: ${error.message}`, 'error');
        }
    }

    analyzeDirectoryContents(files) {
        const analysis = {
            totalFiles: files.length,
            totalSize: files.reduce((sum, f) => sum + f.size, 0),
            extensions: {},
            flags: {},
            oldFiles: files.filter(f => f.flags.includes('old')).length,
            largeFiles: files.filter(f => f.flags.includes('oversized')).length
        };

        // Count file extensions
        files.forEach(file => {
            const ext = file.extension || 'no-extension';
            analysis.extensions[ext] = (analysis.extensions[ext] || 0) + 1;
        });

        // Count flags
        files.forEach(file => {
            file.flags.forEach(flag => {
                analysis.flags[flag] = (analysis.flags[flag] || 0) + 1;
            });
        });

        return analysis;
    }

    async findOrphanedFiles() {
        this.log('🔍 Looking for orphaned files...', 'info');

        // Files that might be orphaned based on naming patterns or isolation
        const potentialOrphans = [];

        // Check for files with no references
        for (const [dirKey, dirData] of Object.entries(this.results.directories)) {
            if (!dirData.files) continue;
            
            for (const file of dirData.files) {
                // Check for files that look like they might be orphaned
                const fileName = file.name.toLowerCase();
                
                if (fileName.includes('test') && fileName.includes('old')) {
                    potentialOrphans.push({
                        ...file,
                        reason: 'Old test file'
                    });
                }
                
                if (fileName.includes('temp') || fileName.includes('tmp')) {
                    potentialOrphans.push({
                        ...file,
                        reason: 'Temporary file'
                    });
                }

                if (fileName.includes('unused') || fileName.includes('delete')) {
                    potentialOrphans.push({
                        ...file,
                        reason: 'Marked for deletion'
                    });
                }
            }
        }

        this.results.analysis.orphaned = potentialOrphans;
        this.results.summary.orphaned = potentialOrphans.length;
    }

    async analyzeDuplicates() {
        this.log('🔍 Looking for duplicate files...', 'info');

        const allFiles = [];
        
        // Collect all files
        for (const [dirKey, dirData] of Object.entries(this.results.directories)) {
            if (dirData.files) {
                allFiles.push(...dirData.files);
            }
        }

        // Group by filename
        const fileGroups = {};
        allFiles.forEach(file => {
            const baseName = path.basename(file.name, path.extname(file.name));
            if (!fileGroups[baseName]) fileGroups[baseName] = [];
            fileGroups[baseName].push(file);
        });

        // Find potential duplicates
        const duplicates = [];
        Object.entries(fileGroups).forEach(([baseName, files]) => {
            if (files.length > 1) {
                duplicates.push({
                    baseName,
                    files: files.map(f => ({
                        path: f.path,
                        size: f.size,
                        modified: f.modified
                    })),
                    reason: 'Multiple files with similar names'
                });
            }
        });

        this.results.analysis.redundant.push(...duplicates);
    }

    generateRecommendations() {
        const recs = [];

        if (this.results.summary.deprecated > 0) {
            recs.push(`Remove ${this.results.summary.deprecated} deprecated files to clean up repository`);
        }

        if (this.results.summary.orphaned > 0) {
            recs.push(`Review ${this.results.summary.orphaned} potentially orphaned files for removal`);
        }

        if (this.results.analysis.oversized.length > 0) {
            recs.push(`Review ${this.results.analysis.oversized.length} large files (>1MB) for Git LFS or removal`);
        }

        if (this.results.summary.redundant > 0) {
            recs.push(`Consolidate or remove ${this.results.summary.redundant} redundant files`);
        }

        // Directory-specific recommendations
        const srcAnalysis = this.results.directories.src?.analysis;
        if (srcAnalysis && srcAnalysis.flags.old > 5) {
            recs.push(`Review ${srcAnalysis.flags.old} old files in src/ directory`);
        }

        const scriptsAnalysis = this.results.directories.scripts?.analysis;
        if (scriptsAnalysis && scriptsAnalysis.totalFiles > 50) {
            recs.push(`Consider organizing ${scriptsAnalysis.totalFiles} scripts into subdirectories`);
        }

        this.results.recommendations = recs;
    }

    async generateReport() {
        const reportPath = 'FILESYSTEM_ANALYSIS_REPORT.md';
        let report = `# 📁 EchoTune AI - Filesystem Analysis Report\n\n`;
        
        report += `**Generated:** ${this.results.timestamp}\n`;
        report += `**Total Files Analyzed:** ${this.results.summary.analyzed}\n`;
        report += `**Deprecated Files:** ${this.results.summary.deprecated} ⚠️\n`;
        report += `**Orphaned Files:** ${this.results.summary.orphaned} 🗑️\n`;
        report += `**Redundant Files:** ${this.results.summary.redundant} 🔄\n`;
        report += `**Oversized Files:** ${this.results.analysis.oversized.length} 📦\n\n`;

        // Summary by directory
        report += `## Directory Analysis\n\n`;
        
        const mainDirectories = ['src', 'scripts', 'docs', 'mcp', 'tests'];
        for (const dirKey of mainDirectories) {
            const dirData = this.results.directories[dirKey];
            if (!dirData || !dirData.files) continue;
            
            const analysis = dirData.analysis;
            report += `### ${dirKey}/ Directory\n\n`;
            report += `- **Files:** ${analysis.totalFiles}\n`;
            report += `- **Total Size:** ${Math.round(analysis.totalSize / 1024)}KB\n`;
            report += `- **Extensions:** ${Object.keys(analysis.extensions).join(', ')}\n`;
            
            if (analysis.flags.deprecated) {
                report += `- **Deprecated:** ${analysis.flags.deprecated} files\n`;
            }
            if (analysis.flags.old) {
                report += `- **Old Files:** ${analysis.flags.old} (>30 days)\n`;
            }
            report += `\n`;
        }

        // Detailed findings
        if (this.results.analysis.deprecated.length > 0) {
            report += `## Deprecated Files\n\n`;
            this.results.analysis.deprecated.forEach(file => {
                report += `- \`${file.path}\` (${Math.round(file.size / 1024)}KB)\n`;
            });
            report += `\n`;
        }

        if (this.results.analysis.orphaned.length > 0) {
            report += `## Potentially Orphaned Files\n\n`;
            this.results.analysis.orphaned.forEach(file => {
                report += `- \`${file.path}\` - ${file.reason}\n`;
            });
            report += `\n`;
        }

        if (this.results.analysis.oversized.length > 0) {
            report += `## Large Files (>1MB)\n\n`;
            this.results.analysis.oversized.forEach(file => {
                report += `- \`${file.path}\` (${Math.round(file.size / (1024*1024))}MB)\n`;
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
        const jsonReportPath = 'FILESYSTEM_ANALYSIS_REPORT.json';
        await fs.writeFile(jsonReportPath, JSON.stringify(this.results, null, 2), 'utf8');
        
        this.log(`📋 Reports generated:`, 'success');
        this.log(`   Markdown: ${reportPath}`, 'info');
        this.log(`   JSON: ${jsonReportPath}`, 'info');
    }

    async runFullAnalysis() {
        this.log('🔍 Starting comprehensive filesystem analysis...', 'info');
        
        // Analyze key directories
        const directories = [
            { path: 'src', key: 'src' },
            { path: 'scripts', key: 'scripts' },
            { path: 'docs', key: 'docs' },
            { path: 'mcp-server', key: 'mcp' },
            { path: 'mcp-servers', key: 'mcp_community' },
            { path: 'tests', key: 'tests' },
            { path: 'public', key: 'public' },
            { path: '.', key: 'root' } // Root level files only
        ];

        for (const { path: dirPath, key } of directories) {
            try {
                const stats = await this.getFileStats(dirPath);
                if (stats && stats.isDirectory) {
                    await this.analyzeDirectory(dirPath, key);
                }
            } catch (error) {
                this.log(`⚠️ Skipping ${dirPath}: ${error.message}`, 'warning');
            }
        }

        // Find orphaned files
        await this.findOrphanedFiles();
        
        // Analyze duplicates
        await this.analyzeDuplicates();

        // Generate recommendations
        this.generateRecommendations();

        await this.generateReport();

        this.log(`🎉 Analysis complete!`, 'success');
        this.log(`📊 Found ${this.results.summary.deprecated} deprecated, ${this.results.summary.orphaned} orphaned, ${this.results.summary.redundant} redundant files`, 'info');

        return this.results;
    }
}

// Main execution
if (require.main === module) {
    const analyzer = new FilesystemAnalyzer();
    analyzer.runFullAnalysis().catch(error => {
        console.error('❌ Analysis failed:', error);
        process.exit(1);
    });
}

module.exports = FilesystemAnalyzer;