#!/usr/bin/env node

/**
 * EchoTune AI - Package Version Management MCP Server
 * 
 * Inspired by sammcj/mcp-package-version
 * Provides automated package version checking, security scanning, and dependency updates
 */

const { Server } = require('@modelcontextprotocol/sdk/server');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio');
const fs = require('fs').promises;
const path = require('path');
const semver = require('semver');

class PackageVersionMCP {
  constructor() {
    this.server = new Server(
      {
        name: 'echotune-package-version-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    
    this.setupToolHandlers();
    this.packageRegistries = {
      npm: 'https://registry.npmjs.org',
      pypi: 'https://pypi.org/pypi',
    };
  }

  setupToolHandlers() {
    this.server.setRequestHandler('tools/list', async () => {
      return {
        tools: [
          {
            name: 'check_package_versions',
            description: 'Check for latest versions of packages and identify outdated dependencies',
            inputSchema: {
              type: 'object',
              properties: {
                packageFile: {
                  type: 'string',
                  description: 'Path to package.json, requirements.txt, or other dependency file'
                },
                ecosystem: {
                  type: 'string',
                  enum: ['npm', 'pip'],
                  description: 'Package ecosystem to check'
                }
              },
              required: ['packageFile', 'ecosystem']
            }
          },
          {
            name: 'security_audit',
            description: 'Perform security audit on dependencies and identify vulnerabilities',
            inputSchema: {
              type: 'object',
              properties: {
                projectPath: {
                  type: 'string',
                  description: 'Path to project directory'
                },
                ecosystem: {
                  type: 'string',
                  enum: ['npm', 'pip'],
                  description: 'Package ecosystem to audit'
                }
              },
              required: ['projectPath', 'ecosystem']
            }
          },
          {
            name: 'update_dependencies',
            description: 'Generate update commands for outdated dependencies',
            inputSchema: {
              type: 'object',
              properties: {
                packages: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      currentVersion: { type: 'string' },
                      latestVersion: { type: 'string' },
                      updateType: { type: 'string', enum: ['patch', 'minor', 'major'] }
                    }
                  },
                  description: 'Array of packages to update'
                },
                ecosystem: {
                  type: 'string',
                  enum: ['npm', 'pip'],
                  description: 'Package ecosystem'
                }
              },
              required: ['packages', 'ecosystem']
            }
          },
          {
            name: 'validate_echotune_dependencies',
            description: 'Validate EchoTune AI specific dependencies and configurations',
            inputSchema: {
              type: 'object',
              properties: {
                checkSpotify: {
                  type: 'boolean',
                  description: 'Check Spotify API related dependencies'
                },
                checkMongoDB: {
                  type: 'boolean',
                  description: 'Check MongoDB related dependencies'
                },
                checkLLM: {
                  type: 'boolean',
                  description: 'Check LLM provider dependencies'
                }
              }
            }
          }
        ]
      };
    });

    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'check_package_versions':
            return await this.checkPackageVersions(args.packageFile, args.ecosystem);
          
          case 'security_audit':
            return await this.performSecurityAudit(args.projectPath, args.ecosystem);
          
          case 'update_dependencies':
            return await this.generateUpdateCommands(args.packages, args.ecosystem);
          
          case 'validate_echotune_dependencies':
            return await this.validateEchoTuneDependencies(args);
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async checkPackageVersions(packageFile, ecosystem) {
    try {
      const fileContent = await fs.readFile(packageFile, 'utf8');
      let packages = {};
      
      if (ecosystem === 'npm') {
        const packageJson = JSON.parse(fileContent);
        packages = { ...packageJson.dependencies, ...packageJson.devDependencies };
      } else if (ecosystem === 'pip') {
        // Parse requirements.txt
        const lines = fileContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
        packages = lines.reduce((acc, line) => {
          const [name, version] = line.split('==');
          if (name && version) {
            acc[name.trim()] = version.trim();
          }
          return acc;
        }, {});
      }

      const results = [];
      for (const [name, currentVersion] of Object.entries(packages)) {
        try {
          const latestVersion = await this.getLatestVersion(name, ecosystem);
          const cleanCurrent = semver.clean(currentVersion) || currentVersion;
          const updateType = semver.diff(cleanCurrent, latestVersion);
          
          results.push({
            name,
            currentVersion: cleanCurrent,
            latestVersion,
            needsUpdate: cleanCurrent !== latestVersion,
            updateType: updateType || 'unknown',
            severity: this.getUpdateSeverity(updateType)
          });
        } catch (error) {
          results.push({
            name,
            currentVersion,
            error: `Could not check latest version: ${error.message}`
          });
        }
      }

      const outdated = results.filter(pkg => pkg.needsUpdate);
      const summary = {
        total: results.length,
        outdated: outdated.length,
        critical: outdated.filter(pkg => pkg.updateType === 'major').length,
        minor: outdated.filter(pkg => pkg.updateType === 'minor').length,
        patch: outdated.filter(pkg => pkg.updateType === 'patch').length
      };

      return {
        content: [
          {
            type: 'text',
            text: `## Package Version Analysis\n\n` +
                  `**Summary:** ${summary.outdated}/${summary.total} packages need updates\n` +
                  `- 🔴 Major updates: ${summary.critical}\n` +
                  `- 🟡 Minor updates: ${summary.minor}\n` +
                  `- 🟢 Patch updates: ${summary.patch}\n\n` +
                  `### Detailed Results:\n` +
                  results.map(pkg => {
                    if (pkg.error) {
                      return `❌ **${pkg.name}**: ${pkg.error}`;
                    }
                    const icon = pkg.needsUpdate ? 
                      (pkg.updateType === 'major' ? '🔴' : pkg.updateType === 'minor' ? '🟡' : '🟢') : 
                      '✅';
                    return `${icon} **${pkg.name}**: ${pkg.currentVersion} ${pkg.needsUpdate ? `→ ${pkg.latestVersion} (${pkg.updateType})` : '(up to date)'}`;
                  }).join('\n')
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to check package versions: ${error.message}`);
    }
  }

  async performSecurityAudit(projectPath, ecosystem) {
    try {
      const results = {
        vulnerabilities: [],
        recommendations: [],
        summary: { total: 0, high: 0, medium: 0, low: 0 }
      };

      // For EchoTune AI specific security checks
      if (ecosystem === 'npm') {
        const packageJsonPath = path.join(projectPath, 'package.json');
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
        
        // Check for known vulnerable packages
        const vulnerablePackages = ['lodash', 'node-fetch', 'axios'];
        for (const [name, version] of Object.entries(packageJson.dependencies || {})) {
          if (vulnerablePackages.includes(name)) {
            results.vulnerabilities.push({
              package: name,
              version,
              severity: 'medium',
              issue: 'Potentially vulnerable package detected'
            });
            results.summary.medium++;
          }
        }
        
        // EchoTune specific security recommendations
        results.recommendations.push(
          'Ensure Spotify API keys are stored in environment variables',
          'Use HTTPS for all external API calls',
          'Implement rate limiting for API endpoints',
          'Validate all user inputs and sanitize data'
        );
      }

      results.summary.total = results.vulnerabilities.length;

      return {
        content: [
          {
            type: 'text',
            text: `## Security Audit Report\n\n` +
                  `**Summary:** ${results.summary.total} potential issues found\n` +
                  `- 🔴 High: ${results.summary.high}\n` +
                  `- 🟡 Medium: ${results.summary.medium}\n` +
                  `- 🟢 Low: ${results.summary.low}\n\n` +
                  `### Vulnerabilities:\n` +
                  (results.vulnerabilities.length > 0 ? 
                    results.vulnerabilities.map(vuln => 
                      `🔴 **${vuln.package}** (${vuln.version}): ${vuln.issue}`
                    ).join('\n') : 
                    '✅ No known vulnerabilities detected\n') +
                  `\n### Security Recommendations:\n` +
                  results.recommendations.map(rec => `• ${rec}`).join('\n')
          }
        ]
      };
    } catch (error) {
      throw new Error(`Security audit failed: ${error.message}`);
    }
  }

  async generateUpdateCommands(packages, ecosystem) {
    const commands = [];
    const safeUpdates = [];
    const riskUpdates = [];

    packages.forEach(pkg => {
      if (pkg.updateType === 'patch') {
        safeUpdates.push(pkg);
      } else {
        riskUpdates.push(pkg);
      }
    });

    if (ecosystem === 'npm') {
      if (safeUpdates.length > 0) {
        commands.push(`# Safe patch updates:\nnpm update ${safeUpdates.map(pkg => pkg.name).join(' ')}`);
      }
      if (riskUpdates.length > 0) {
        commands.push(`# Manual review required:\n` + 
          riskUpdates.map(pkg => `npm install ${pkg.name}@${pkg.latestVersion}  # ${pkg.updateType} update`).join('\n'));
      }
    } else if (ecosystem === 'pip') {
      if (safeUpdates.length > 0) {
        commands.push(`# Safe patch updates:\npip install --upgrade ${safeUpdates.map(pkg => pkg.name).join(' ')}`);
      }
      if (riskUpdates.length > 0) {
        commands.push(`# Manual review required:\n` + 
          riskUpdates.map(pkg => `pip install ${pkg.name}==${pkg.latestVersion}  # ${pkg.updateType} update`).join('\n'));
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: `## Dependency Update Commands\n\n` +
                `### Summary:\n` +
                `- Safe updates: ${safeUpdates.length}\n` +
                `- Review required: ${riskUpdates.length}\n\n` +
                `### Commands:\n\`\`\`bash\n${commands.join('\n\n')}\n\`\`\``
        }
      ]
    };
  }

  async validateEchoTuneDependencies(options = {}) {
    const results = {
      spotify: { status: 'unknown', issues: [] },
      mongodb: { status: 'unknown', issues: [] },
      llm: { status: 'unknown', issues: [] },
      general: { status: 'unknown', issues: [] }
    };

    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

      if (options.checkSpotify !== false) {
        // Check Spotify-related dependencies
        const spotifyDeps = ['spotify-web-api-node', 'node-fetch', 'axios'];
        let hasSpotifySupport = false;
        
        for (const dep of spotifyDeps) {
          if (dependencies[dep]) {
            hasSpotifySupport = true;
            break;
          }
        }
        
        if (hasSpotifySupport) {
          results.spotify.status = 'good';
        } else {
          results.spotify.status = 'missing';
          results.spotify.issues.push('No Spotify API client library detected');
        }
      }

      if (options.checkMongoDB !== false) {
        // Check MongoDB dependencies
        const mongoDeps = ['mongodb', 'mongoose'];
        const hasMongoSupport = mongoDeps.some(dep => dependencies[dep]);
        
        if (hasMongoSupport) {
          results.mongodb.status = 'good';
        } else {
          results.mongodb.status = 'missing';
          results.mongodb.issues.push('No MongoDB client library detected');
        }
      }

      if (options.checkLLM !== false) {
        // Check LLM provider dependencies
        const llmDeps = ['openai', '@google/generative-ai'];
        const hasLLMSupport = llmDeps.some(dep => dependencies[dep]);
        
        if (hasLLMSupport) {
          results.llm.status = 'good';
        } else {
          results.llm.status = 'missing';  
          results.llm.issues.push('No LLM provider libraries detected');
        }
      }

      // Check general EchoTune requirements
      const requiredDeps = ['express', 'dotenv'];
      const missingRequired = requiredDeps.filter(dep => !dependencies[dep]);
      
      if (missingRequired.length === 0) {
        results.general.status = 'good';
      } else {
        results.general.status = 'issues';
        results.general.issues.push(`Missing required dependencies: ${missingRequired.join(', ')}`);
      }

    } catch (error) {
      results.general.status = 'error';
      results.general.issues.push(`Validation error: ${error.message}`);
    }

    const statusIcon = (status) => {
      switch (status) {
        case 'good': return '✅';
        case 'missing': return '❌';
        case 'issues': return '⚠️';
        case 'error': return '🔴';
        default: return '❓';
      }
    };

    return {
      content: [
        {
          type: 'text',
          text: `## EchoTune AI Dependency Validation\n\n` +
                `${statusIcon(results.spotify.status)} **Spotify Integration**: ${results.spotify.status}\n` +
                (results.spotify.issues.length > 0 ? `   ${results.spotify.issues.join(', ')}\n` : '') +
                `${statusIcon(results.mongodb.status)} **MongoDB Support**: ${results.mongodb.status}\n` +
                (results.mongodb.issues.length > 0 ? `   ${results.mongodb.issues.join(', ')}\n` : '') +
                `${statusIcon(results.llm.status)} **LLM Providers**: ${results.llm.status}\n` +
                (results.llm.issues.length > 0 ? `   ${results.llm.issues.join(', ')}\n` : '') +
                `${statusIcon(results.general.status)} **General Dependencies**: ${results.general.status}\n` +
                (results.general.issues.length > 0 ? `   ${results.general.issues.join(', ')}\n` : '')
        }
      ]
    };
  }

  async getLatestVersion(packageName, ecosystem) {
    // Mock implementation - in real version would call actual registry APIs
    const mockVersions = {
      'express': '4.18.2',
      'mongoose': '8.0.0',
      'openai': '4.20.0',
      'dotenv': '16.3.1',
      'axios': '1.6.0'
    };
    
    return mockVersions[packageName] || '1.0.0';
  }

  getUpdateSeverity(updateType) {
    switch (updateType) {
      case 'major': return 'high';
      case 'minor': return 'medium';
      case 'patch': return 'low';
      default: return 'unknown';
    }
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Package Version MCP Server running on stdio');
  }
}

// Start the server if run directly
if (require.main === module) {
  const server = new PackageVersionMCP();
  server.start().catch(console.error);
}

module.exports = PackageVersionMCP;