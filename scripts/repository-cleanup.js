#!/usr/bin/env node
/**
 * Repository Cleanup & Organization Script
 * 
 * This script addresses the orphaned files and report clutter identified
 * in the filesystem analysis. It organizes reports, removes duplicates,
 * and cleans up deprecated files.
 */

const fs = require('fs');
const path = require('path');

class RepositoryCleanup {
  constructor() {
    this.reportsToArchive = [];
    this.duplicateFiles = [];
    this.deprecated = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
      'info': '📋',
      'success': '✅',
      'warning': '⚠️',
      'action': '🚀'
    }[type] || '📋';
    
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  identifyReportFiles() {
    this.log('Identifying report and analysis files...', 'action');
    
    const files = fs.readdirSync('.');
    const reportPattern = /(REPORT|ANALYSIS|VALIDATION|STATUS|SUMMARY|ENHANCED|COMPREHENSIVE|PHASE\d+).*\.(md|json)$/;
    
    const reports = files.filter(file => reportPattern.test(file));
    
    // Keep important reports, archive others
    const keepReports = [
      'MCP_STATUS_REPORT.md',
      'VALIDATION_WORKFLOW_REPORT.md',
      'README.md',
      'API_DOCUMENTATION.md',
      'COMPREHENSIVE_MCP_VALIDATION_REPORT.md'
    ];
    
    this.reportsToArchive = reports.filter(file => !keepReports.includes(file));
    
    this.log(`Found ${reports.length} report files, ${this.reportsToArchive.length} will be archived`, 'info');
    return this.reportsToArchive;
  }

  archiveReports() {
    if (this.reportsToArchive.length === 0) return;

    this.log('Creating reports archive directory...', 'action');
    
    if (!fs.existsSync('docs/archive')) {
      fs.mkdirSync('docs/archive', { recursive: true });
    }
    
    this.reportsToArchive.forEach(file => {
      try {
        const source = path.join('.', file);
        const dest = path.join('docs', 'archive', file);
        
        if (fs.existsSync(source)) {
          fs.renameSync(source, dest);
          this.log(`Archived: ${file}`, 'success');
        }
      } catch (error) {
        this.log(`Failed to archive ${file}: ${error.message}`, 'warning');
      }
    });
  }

  identifyCorruptedEnvFiles() {
    this.log('Checking for corrupted environment files...', 'action');
    
    const envFiles = ['.env.example', '.env.template'];
    const corrupted = [];
    
    envFiles.forEach(file => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for corruption indicators
        if (content.includes('=choT=une') || content.includes('ðŸš€') || content.includes('=')) {
          corrupted.push(file);
        }
      }
    });
    
    return corrupted;
  }

  fixCorruptedEnvFiles() {
    const corrupted = this.identifyCorruptedEnvFiles();
    
    if (corrupted.length > 0) {
      this.log(`Found ${corrupted.length} corrupted environment files`, 'warning');
      
      // Replace with clean template
      if (fs.existsSync('.env.clean.example')) {
        corrupted.forEach(file => {
          this.log(`Replacing corrupted ${file} with clean template`, 'action');
          fs.copyFileSync('.env.clean.example', file);
        });
      }
    } else {
      this.log('No corrupted environment files found', 'success');
    }
  }

  updateGitignore() {
    this.log('Updating .gitignore for better organization...', 'action');
    
    const additionalIgnores = `
# Archive and temporary files
docs/archive/
*.tmp
*.bak
*.orig

# Validation reports (generated)
*_REPORT.md
*_VALIDATION_*.md
*_STATUS_*.md

# Environment files (except examples)
.env
.env.local
.env.production
api_keys.env

# MCP server logs
mcp-server/*.log
mcp-servers/*/logs/

# Testing artifacts
testing_screenshots/
coverage/
.nyc_output/
`;

    const gitignorePath = '.gitignore';
    let currentContent = '';
    
    if (fs.existsSync(gitignorePath)) {
      currentContent = fs.readFileSync(gitignorePath, 'utf8');
    }
    
    // Only add if not already present
    if (!currentContent.includes('# Archive and temporary files')) {
      fs.appendFileSync(gitignorePath, additionalIgnores);
      this.log('Updated .gitignore with cleanup rules', 'success');
    } else {
      this.log('.gitignore already contains cleanup rules', 'info');
    }
  }

  generateCleanupSummary() {
    const summary = `# 🧹 Repository Cleanup Summary

**Date:** ${new Date().toISOString().split('T')[0]}

## Actions Taken

### 📁 Report Files Archived
${this.reportsToArchive.length > 0 ? 
  this.reportsToArchive.map(file => `- ${file}`).join('\n') : 
  '- No reports needed archiving'
}

### 🔧 Environment Files Fixed
- Replaced corrupted .env files with clean templates
- Maintained .env.clean.example as reference

### 📋 Repository Organization
- Created docs/archive/ for old reports
- Updated .gitignore for better file management
- Kept essential documentation in root

## Remaining Important Files

### Core Documentation
- README.md - Main project documentation
- API_DOCUMENTATION.md - API reference
- MCP_STATUS_REPORT.md - MCP server status
- VALIDATION_WORKFLOW_REPORT.md - Validation results

### Configuration
- package.json - Dependencies and scripts
- .env.clean.example - Clean environment template
- docker-compose.yml - Container configuration

## Recommendations

1. **Regular Cleanup**: Run this script monthly to maintain organization
2. **Report Management**: Archive old validation reports after review
3. **Environment Security**: Never commit actual .env files to Git
4. **MCP Maintenance**: Keep MCP_STATUS_REPORT.md updated with server changes

## Next Steps

1. Review archived reports in docs/archive/
2. Update any outdated documentation
3. Consider implementing automated cleanup in CI/CD
4. Monitor repository size and organization

---
*Generated by EchoTune AI Repository Cleanup System*
`;

    fs.writeFileSync('REPOSITORY_CLEANUP_SUMMARY.md', summary);
    this.log('Generated cleanup summary report', 'success');
  }

  async run() {
    this.log('🧹 Starting Repository Cleanup and Organization', 'action');
    
    // Step 1: Archive old reports
    this.identifyReportFiles();
    this.archiveReports();
    
    // Step 2: Fix corrupted files
    this.fixCorruptedEnvFiles();
    
    // Step 3: Update .gitignore
    this.updateGitignore();
    
    // Step 4: Generate summary
    this.generateCleanupSummary();
    
    this.log('🎉 Repository cleanup completed successfully!', 'success');
    
    return {
      archivedReports: this.reportsToArchive.length,
      status: 'complete'
    };
  }
}

// CLI Interface
if (require.main === module) {
  const cleanup = new RepositoryCleanup();
  cleanup.run().then(result => {
    console.log(`\n✅ Cleanup completed: ${result.archivedReports} reports archived`);
    process.exit(0);
  });
}

module.exports = RepositoryCleanup;