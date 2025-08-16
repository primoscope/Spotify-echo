#!/usr/bin/env node

/**
 * Comprehensive MCP and Analysis System Validation
 * Tests all new MCP servers, continuous analysis system, and integration points
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

class SystemValidator {
  constructor() {
    this.results = {
      mcpServers: {},
      analysisSystem: {},
      integration: {},
      dependencies: {},
    };
    
    this.mcpServers = [
      'postgresql',
      'sqlite', 
      'fetch',
      'filesystem',
      'memory',
    ];
  }

  async runValidation() {
    console.log('🔍 Starting comprehensive system validation...\n');

    try {
      // 1. Validate file structure
      await this.validateFileStructure();

      // 2. Validate dependencies
      await this.validateDependencies();

      // 3. Validate MCP servers
      await this.validateMCPServers();

      // 4. Validate analysis system
      await this.validateAnalysisSystem();

      // 5. Validate integration points
      await this.validateIntegration();

      // 6. Generate report
      await this.generateValidationReport();

      console.log('\n✅ Validation completed successfully!');
      return this.results;

    } catch (error) {
      console.error('\n❌ Validation failed:', error);
      throw error;
    }
  }

  async validateFileStructure() {
    console.log('📁 Validating file structure...');

    const expectedFiles = [
      'mcp-servers/postgresql/index.js',
      'mcp-servers/postgresql/package.json',
      'mcp-servers/sqlite/index.js',
      'mcp-servers/sqlite/package.json',
      'mcp-servers/fetch/index.js',
      'mcp-servers/fetch/package.json',
      'scripts/continuous-analysis-system.js',
      'mcp-server/enhanced-mcp-orchestrator-v2.js',
      'src/chat/llm-providers/perplexity-provider.js',
      'src/chat/llm-providers/grok4-provider.js',
    ];

    for (const file of expectedFiles) {
      try {
        await fs.access(file);
        console.log(`  ✅ ${file}`);
        this.results.fileStructure = this.results.fileStructure || {};
        this.results.fileStructure[file] = true;
      } catch (error) {
        console.log(`  ❌ ${file} - ${error.message}`);
        this.results.fileStructure = this.results.fileStructure || {};
        this.results.fileStructure[file] = false;
      }
    }
  }

  async validateDependencies() {
    console.log('\n📦 Validating dependencies...');

    const dependencies = [
      { name: '@modelcontextprotocol/sdk', required: true },
      { name: 'pg', required: false, description: 'PostgreSQL support' },
      { name: 'sqlite3', required: false, description: 'SQLite support' },
      { name: 'node-fetch', required: false, description: 'Fetch functionality' },
    ];

    for (const dep of dependencies) {
      try {
        require.resolve(dep.name);
        console.log(`  ✅ ${dep.name}`);
        this.results.dependencies[dep.name] = { status: 'available' };
      } catch (error) {
        const status = dep.required ? '❌' : '⚠️';
        console.log(`  ${status} ${dep.name} - ${dep.description || 'Not available'}`);
        this.results.dependencies[dep.name] = { 
          status: 'missing', 
          required: dep.required,
          description: dep.description 
        };
      }
    }
  }

  async validateMCPServers() {
    console.log('\n🤖 Validating MCP servers...');

    for (const serverName of this.mcpServers) {
      try {
        console.log(`\n  Testing ${serverName} server:`);
        
        // Check if server file exists
        const serverPath = path.join('mcp-servers', serverName, 'index.js');
        const packagePath = path.join('mcp-servers', serverName, 'package.json');
        
        await fs.access(serverPath);
        console.log(`    ✅ Server file exists`);

        await fs.access(packagePath);
        console.log(`    ✅ Package.json exists`);

        // Validate package.json structure
        const packageContent = await fs.readFile(packagePath, 'utf8');
        const packageData = JSON.parse(packageContent);
        
        if (packageData.name && packageData.version && packageData.dependencies) {
          console.log(`    ✅ Package.json structure valid`);
        } else {
          console.log(`    ⚠️ Package.json missing required fields`);
        }

        // Try to load server (with mock SDK if needed)
        try {
          // Mock the MCP SDK if not available
          if (!this.results.dependencies['@modelcontextprotocol/sdk']?.status === 'available') {
            this.mockMCPSDK();
          }

          const ServerClass = require(path.resolve(serverPath));
          console.log(`    ✅ Server class can be imported`);
          
          this.results.mcpServers[serverName] = {
            status: 'valid',
            hasFile: true,
            hasPackage: true,
            canImport: true,
          };

        } catch (importError) {
          console.log(`    ⚠️ Import failed: ${importError.message}`);
          this.results.mcpServers[serverName] = {
            status: 'import_failed',
            hasFile: true,
            hasPackage: true,
            canImport: false,
            error: importError.message,
          };
        }

      } catch (error) {
        console.log(`    ❌ Validation failed: ${error.message}`);
        this.results.mcpServers[serverName] = {
          status: 'failed',
          error: error.message,
        };
      }
    }
  }

  mockMCPSDK() {
    // Create a minimal mock of MCP SDK for testing purposes
    const mockSDK = {
      Server: class MockServer {
        constructor(config) {
          this.config = config;
        }
        setRequestHandler() {}
        connect() {}
      },
      StdioServerTransport: class MockTransport {},
    };

    // Store original require
    const originalRequire = require;
    
    // Mock the require for MCP SDK
    require.cache[require.resolve('@modelcontextprotocol/sdk/server')] = {
      exports: mockSDK,
    };
  }

  async validateAnalysisSystem() {
    console.log('\n🧠 Validating analysis system...');

    try {
      // Test continuous analysis system import
      const AnalysisSystem = require('./scripts/continuous-analysis-system.js');
      console.log('  ✅ Continuous analysis system can be imported');

      // Test provider imports
      const PerplexityProvider = require('./src/chat/llm-providers/perplexity-provider.js');
      console.log('  ✅ Perplexity provider can be imported');

      const Grok4Provider = require('./src/chat/llm-providers/grok4-provider.js');  
      console.log('  ✅ Grok-4 provider can be imported');

      // Test initialization (without API keys)
      try {
        const analysisSystem = new AnalysisSystem();
        console.log('  ✅ Analysis system can be instantiated');

        this.results.analysisSystem = {
          status: 'valid',
          canImport: true,
          canInstantiate: true,
        };

      } catch (initError) {
        console.log(`  ⚠️ Instantiation issues: ${initError.message}`);
        this.results.analysisSystem = {
          status: 'partial',
          canImport: true,
          canInstantiate: false,
          error: initError.message,
        };
      }

    } catch (error) {
      console.log(`  ❌ Analysis system validation failed: ${error.message}`);
      this.results.analysisSystem = {
        status: 'failed',
        error: error.message,
      };
    }
  }

  async validateIntegration() {
    console.log('\n🔗 Validating integration points...');

    // Check package.json scripts
    try {
      const packageContent = await fs.readFile('package.json', 'utf8');
      const packageData = JSON.parse(packageContent);
      
      const expectedScripts = [
        'continuous-analysis',
        'mcp:postgresql',
        'mcp:sqlite',
        'mcp:fetch',
        'perplexity:research',
        'grok4:analyze',
      ];

      let scriptCount = 0;
      for (const script of expectedScripts) {
        if (packageData.scripts[script]) {
          console.log(`  ✅ Script: ${script}`);
          scriptCount++;
        } else {
          console.log(`  ❌ Missing script: ${script}`);
        }
      }

      this.results.integration.scripts = {
        expected: expectedScripts.length,
        found: scriptCount,
        status: scriptCount === expectedScripts.length ? 'complete' : 'partial',
      };

    } catch (error) {
      console.log(`  ❌ Package.json validation failed: ${error.message}`);
      this.results.integration.scripts = {
        status: 'failed',
        error: error.message,
      };
    }

    // Check environment configuration
    try {
      const envExample = await fs.readFile('.env.example', 'utf8');
      
      const expectedEnvVars = [
        'PERPLEXITY_API_KEY',
        'XAI_API_KEY',
        'POSTGRES_HOST',
        'SQLITE_DB_PATH',
        'ANALYSIS_INTERVAL',
      ];

      let envCount = 0;
      for (const envVar of expectedEnvVars) {
        if (envExample.includes(envVar)) {
          console.log(`  ✅ Env var: ${envVar}`);
          envCount++;
        } else {
          console.log(`  ❌ Missing env var: ${envVar}`);
        }
      }

      this.results.integration.environment = {
        expected: expectedEnvVars.length,
        found: envCount,
        status: envCount === expectedEnvVars.length ? 'complete' : 'partial',
      };

    } catch (error) {
      console.log(`  ❌ Environment validation failed: ${error.message}`);
      this.results.integration.environment = {
        status: 'failed',
        error: error.message,
      };
    }
  }

  async generateValidationReport() {
    console.log('\n📊 Generating validation report...');

    const report = {
      timestamp: new Date().toISOString(),
      summary: this.generateSummary(),
      details: this.results,
      recommendations: this.generateRecommendations(),
    };

    const reportPath = 'validation-report.json';
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
    
    const mdReport = this.generateMarkdownReport(report);
    const mdReportPath = 'VALIDATION_REPORT.md';
    await fs.writeFile(mdReportPath, mdReport, 'utf8');

    console.log(`  ✅ JSON report: ${reportPath}`);
    console.log(`  ✅ Markdown report: ${mdReportPath}`);
  }

  generateSummary() {
    const mcpServerCount = Object.keys(this.results.mcpServers).length;
    const validMCPServers = Object.values(this.results.mcpServers).filter(s => s.status === 'valid').length;
    
    const dependencyCount = Object.keys(this.results.dependencies).length;
    const availableDependencies = Object.values(this.results.dependencies).filter(d => d.status === 'available').length;

    return {
      mcpServers: `${validMCPServers}/${mcpServerCount} valid`,
      dependencies: `${availableDependencies}/${dependencyCount} available`,
      analysisSystem: this.results.analysisSystem?.status || 'not tested',
      integration: 'tested',
      overallStatus: this.determineOverallStatus(),
    };
  }

  generateRecommendations() {
    const recommendations = [];

    // MCP SDK dependency
    if (!this.results.dependencies['@modelcontextprotocol/sdk']?.status === 'available') {
      recommendations.push({
        priority: 'high',
        category: 'dependencies',
        title: 'Install MCP SDK',
        description: 'Install @modelcontextprotocol/sdk for full MCP server functionality',
        action: 'npm install @modelcontextprotocol/sdk',
      });
    }

    // Database drivers
    if (!this.results.dependencies['pg']?.status === 'available') {
      recommendations.push({
        priority: 'medium',
        category: 'dependencies',
        title: 'Install PostgreSQL driver',
        description: 'Install pg driver for PostgreSQL MCP server',
        action: 'npm install pg',
      });
    }

    if (!this.results.dependencies['sqlite3']?.status === 'available') {
      recommendations.push({
        priority: 'medium',
        category: 'dependencies',
        title: 'Install SQLite driver',
        description: 'Install sqlite3 and sqlite drivers for SQLite MCP server',
        action: 'npm install sqlite3 sqlite',
      });
    }

    // API keys
    recommendations.push({
      priority: 'medium',
      category: 'configuration',
      title: 'Configure API keys',
      description: 'Set up Perplexity and Grok-4 API keys for full analysis functionality',
      action: 'Copy .env.example to .env and configure API keys',
    });

    return recommendations;
  }

  generateMarkdownReport(report) {
    return `# System Validation Report

**Generated:** ${report.timestamp}

## Summary

- **MCP Servers:** ${report.summary.mcpServers}
- **Dependencies:** ${report.summary.dependencies}
- **Analysis System:** ${report.summary.analysisSystem}
- **Overall Status:** ${report.summary.overallStatus}

## MCP Servers

${Object.entries(this.results.mcpServers).map(([name, result]) => `
### ${name}
- **Status:** ${result.status}
- **Can Import:** ${result.canImport ? '✅' : '❌'}
- **Has Package:** ${result.hasPackage ? '✅' : '❌'}
${result.error ? `- **Error:** ${result.error}` : ''}
`).join('\n')}

## Dependencies

${Object.entries(this.results.dependencies).map(([name, result]) => `
### ${name}
- **Status:** ${result.status}
- **Required:** ${result.required ? 'Yes' : 'No'}
${result.description ? `- **Description:** ${result.description}` : ''}
`).join('\n')}

## Recommendations

${report.recommendations.map(rec => `
### ${rec.title} (${rec.priority} priority)
**Category:** ${rec.category}

${rec.description}

**Action:** \`${rec.action}\`
`).join('\n')}

## Next Steps

1. Install missing dependencies as recommended
2. Configure API keys in .env file
3. Test MCP servers individually
4. Run continuous analysis system
5. Verify integration with existing systems

---

*Generated by EchoTune AI System Validator*
`;
  }

  determineOverallStatus() {
    const mcpServerCount = Object.keys(this.results.mcpServers).length;
    const validMCPServers = Object.values(this.results.mcpServers).filter(s => s.status === 'valid').length;
    
    const analysisSystemValid = this.results.analysisSystem?.status === 'valid';
    
    if (validMCPServers === mcpServerCount && analysisSystemValid) {
      return '✅ Excellent';
    } else if (validMCPServers > mcpServerCount * 0.7) {
      return '⚠️ Good';
    } else {
      return '❌ Needs Work';
    }
  }
}

// CLI interface
async function main() {
  const validator = new SystemValidator();
  
  try {
    const results = await validator.runValidation();
    console.log('\n🎉 Validation completed successfully!');
    console.log('📊 Check VALIDATION_REPORT.md for detailed results');
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Validation failed:', error);
    process.exit(1);
  }
}

// Export for use as module
module.exports = SystemValidator;

// Run if called directly
if (require.main === module) {
  main();
}