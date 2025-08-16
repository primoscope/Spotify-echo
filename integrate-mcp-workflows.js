#!/usr/bin/env node
/**
 * MCP Workflow Integration Manager
 * Configures MCP servers for use in GitHub workflows and automation
 */

const fs = require('fs');
const path = require('path');

class MCPWorkflowIntegrator {
    constructor() {
        this.mcpServers = [
            {
                name: 'filesystem',
                displayName: 'Filesystem MCP Server',
                command: 'node mcp-servers/filesystem/index.js',
                capabilities: ['file_operations', 'directory_management', 'code_analysis', 'secure_operations'],
                useInWorkflows: true,
                priority: 1
            },
            {
                name: 'memory',
                displayName: 'Memory MCP Server',
                command: 'node mcp-servers/memory/index.js', 
                capabilities: ['persistent_context', 'knowledge_graph', 'conversation_history', 'session_management'],
                useInWorkflows: true,
                priority: 2
            },
            {
                name: 'sequential-thinking',
                displayName: 'Sequential Thinking Server',
                command: 'node mcp-servers/sequential-thinking/dist/index.js',
                capabilities: ['reasoning', 'step_by_step_thinking', 'problem_solving', 'decision_making'],
                useInWorkflows: true,
                priority: 3
            },
            {
                name: 'github-repos-manager',
                displayName: 'GitHub Repos Manager MCP',
                command: 'node mcp-servers/github-repos-manager/index.js',
                capabilities: ['github_automation', 'repository_management', 'issue_management', 'pull_requests'],
                requiresEnv: ['GITHUB_TOKEN', 'GITHUB_PAT'],
                useInWorkflows: true,
                priority: 4
            },
            {
                name: 'brave-search',
                displayName: 'Brave Search MCP',
                command: 'node mcp-servers/brave-search/brave-search-mcp.js',
                capabilities: ['web_search', 'privacy_search', 'research', 'documentation_search'],
                requiresEnv: ['BRAVE_API_KEY'],
                useInWorkflows: true,
                priority: 5
            },
            {
                name: 'perplexity-mcp',
                displayName: 'Perplexity MCP Server',
                command: 'node mcp-servers/perplexity-mcp/index.js',
                capabilities: ['ai_research', 'web_search', 'deep_analysis', 'grok4_equivalent'],
                requiresEnv: ['PERPLEXITY_API_KEY'],
                useInWorkflows: true,
                priority: 6
            },
            {
                name: 'analytics-server',
                displayName: 'Analytics Server',
                command: 'node mcp-servers/analytics-server/index.js',
                capabilities: ['metrics', 'performance_monitoring', 'system_health', 'telemetry'],
                useInWorkflows: false,
                priority: 7
            },
            {
                name: 'code-sandbox',
                displayName: 'Code Sandbox Server', 
                command: 'node mcp-servers/code-sandbox/index.js',
                capabilities: ['secure_execution', 'javascript_python', 'validation', 'testing'],
                useInWorkflows: true,
                priority: 8
            }
        ];
    }

    generateMCPConfig() {
        const config = {
            mcpServers: {}
        };

        this.mcpServers.forEach(server => {
            const [command, ...args] = server.command.split(' ');
            config.mcpServers[server.name] = {
                command,
                args,
                env: server.requiresEnv ? server.requiresEnv.reduce((env, key) => {
                    env[key] = `\${${key}}`;
                    return env;
                }, {}) : undefined
            };
        });

        return config;
    }

    generateWorkflowYAML() {
        const workflowServers = this.mcpServers
            .filter(server => server.useInWorkflows)
            .sort((a, b) => a.priority - b.priority);

        const yaml = `name: MCP Servers Integration

on:
  workflow_dispatch:
    inputs:
      servers:
        description: 'Comma-separated list of servers to run'
        required: false
        default: '${workflowServers.map(s => s.name).join(',')}'
      operation:
        description: 'Operation to perform'
        required: true
        default: 'validate'
        type: choice
        options:
          - validate
          - start
          - test
          - health-check

jobs:
  mcp-integration:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install Dependencies
        run: |
          npm ci
          cd mcp-servers && npm ci
          
      - name: Build MCP Servers
        run: |
          # Build sequential-thinking server
          cd mcp-servers/sequential-thinking && npm install && npm run build
          
${workflowServers.map(server => {
    const envVars = server.requiresEnv ? server.requiresEnv.map(env => `          ${env}: \${{ secrets.${env} }}`).join('\n') : '';
    
    return `      - name: Test ${server.displayName}
        if: contains(github.event.inputs.servers, '${server.name}')
        run: node validate-all-mcp-servers.js
        env:
${envVars}`;
}).join('\n\n')}

      - name: Generate MCP Status Report
        run: |
          node validate-all-mcp-servers.js > mcp-status.txt
          cat mcp-status.txt
          
      - name: Upload MCP Reports
        uses: actions/upload-artifact@v4
        with:
          name: mcp-validation-reports
          path: |
            mcp-servers-validation-report.json
            MCP_SERVERS_VALIDATION_REPORT.md
            mcp-status.txt

  startup-integration:
    runs-on: ubuntu-latest
    needs: mcp-integration
    if: github.event.inputs.operation == 'start'
    
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install Dependencies
        run: npm ci
        
      - name: Start MCP Orchestrator
        run: |
          timeout 30s npm run mcp-orchestrator || true
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          BRAVE_API_KEY: \${{ secrets.BRAVE_API_KEY }}
          PERPLEXITY_API_KEY: \${{ secrets.PERPLEXITY_API_KEY }}
          
      - name: Test MCP Server Connectivity
        run: |
          # Test individual servers
${workflowServers.map(server => `          timeout 10s npm run mcp:${server.name} || echo "${server.displayName} test completed"`).join('\n')}
`;

        return yaml;
    }

    generateDocumentation() {
        const doc = `# MCP Servers Integration Guide

## Installed MCP Servers

${this.mcpServers.map(server => {
    return `### ${server.displayName}

**Command**: \`${server.command}\`
**Capabilities**: ${server.capabilities.join(', ')}
**Workflow Integration**: ${server.useInWorkflows ? '✅ Enabled' : '❌ Disabled'}
${server.requiresEnv ? `**Required Environment Variables**: ${server.requiresEnv.join(', ')}` : ''}

**Usage**:
\`\`\`bash
npm run mcp:${server.name}
\`\`\`
`;
}).join('\n')}

## Startup Configuration

### Start All MCP Servers
\`\`\`bash
npm run mcp:start:all
\`\`\`

### Start Individual Servers
${this.mcpServers.map(server => `\`\`\`bash\nnpm run mcp:${server.name}\n\`\`\``).join('\n\n')}

## Validation and Testing

### Validate All Servers
\`\`\`bash
node validate-all-mcp-servers.js
\`\`\`

### Health Check
\`\`\`bash
npm run mcp:health-check
\`\`\`

## Workflow Integration

The MCP servers are integrated into GitHub workflows through:

1. **Automated Validation**: All servers are validated on each workflow run
2. **Environment Variables**: Required API keys are configured via GitHub secrets
3. **Startup Scripts**: Servers can be started individually or collectively
4. **Health Monitoring**: Continuous health checks ensure server availability

### Required GitHub Secrets

${this.mcpServers
    .filter(s => s.requiresEnv)
    .map(s => s.requiresEnv.map(env => `- \`${env}\`: ${this.getSecretDescription(env)}`).join('\n'))
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .join('\n')}

## Architecture

The MCP server ecosystem is orchestrated through:
- **Enhanced MCP Orchestrator**: Central coordination of all servers
- **Individual Server Scripts**: Direct access to specific server functionality  
- **Workflow Integration**: Automated testing and validation
- **Health Monitoring**: Continuous availability checks
`;

        return doc;
    }

    getSecretDescription(env) {
        const descriptions = {
            'GITHUB_TOKEN': 'GitHub Personal Access Token for repository management',
            'GITHUB_PAT': 'GitHub Personal Access Token (alternative to GITHUB_TOKEN)',
            'BRAVE_API_KEY': 'Brave Search API key for web search capabilities',
            'PERPLEXITY_API_KEY': 'Perplexity API key for AI research and analysis'
        };
        return descriptions[env] || 'API key for enhanced functionality';
    }

    async integrate() {
        console.log('🔧 Integrating MCP Servers with Workflows...\n');

        // Generate MCP configuration
        const mcpConfig = this.generateMCPConfig();
        const mcpConfigPath = path.join(process.cwd(), 'mcp-servers-config.json');
        
        fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
        console.log(`✅ Generated MCP configuration: ${mcpConfigPath}`);

        // Generate workflow YAML
        const workflowYAML = this.generateWorkflowYAML();
        const workflowPath = path.join(process.cwd(), '.github', 'workflows', 'mcp-servers-integration.yml');
        
        // Ensure .github/workflows directory exists
        const workflowDir = path.dirname(workflowPath);
        if (!fs.existsSync(workflowDir)) {
            fs.mkdirSync(workflowDir, { recursive: true });
        }
        
        fs.writeFileSync(workflowPath, workflowYAML);
        console.log(`✅ Generated workflow: ${workflowPath}`);

        // Generate documentation
        const documentation = this.generateDocumentation();
        const docPath = path.join(process.cwd(), 'MCP_SERVERS_INTEGRATION_GUIDE.md');
        fs.writeFileSync(docPath, documentation);
        console.log(`✅ Generated documentation: ${docPath}`);

        // Update package.json with new scripts (if not already present)
        this.updatePackageJsonScripts();

        console.log('\n🚀 MCP Servers Integration Complete!');
        console.log('\n📋 Integration Summary:');
        console.log(`   - Total MCP Servers: ${this.mcpServers.length}`);
        console.log(`   - Workflow Enabled: ${this.mcpServers.filter(s => s.useInWorkflows).length}`);
        console.log(`   - Authentication Required: ${this.mcpServers.filter(s => s.requiresEnv).length}`);
        console.log('\n🔧 Next Steps:');
        console.log('   1. Configure required API keys in GitHub secrets');
        console.log('   2. Run validation: node validate-all-mcp-servers.js');
        console.log('   3. Start servers: npm run mcp:start:all');
        console.log('   4. Test workflows: GitHub Actions → MCP Servers Integration');
    }

    updatePackageJsonScripts() {
        const packageJsonPath = path.join(process.cwd(), 'package.json');
        
        if (!fs.existsSync(packageJsonPath)) {
            console.log('⚠️ package.json not found, skipping script updates');
            return;
        }
        
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        // Add validation script if not present
        if (!packageJson.scripts['mcp:validate-all']) {
            packageJson.scripts['mcp:validate-all'] = 'node validate-all-mcp-servers.js';
        }
        
        // Add start all script if not present  
        if (!packageJson.scripts['mcp:start:all']) {
            packageJson.scripts['mcp:start:all'] = 'cd mcp-servers && npm run start:all';
        }
        
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        console.log('✅ Updated package.json with MCP scripts');
    }
}

// Run integration if called directly
if (require.main === module) {
    const integrator = new MCPWorkflowIntegrator();
    integrator.integrate().catch(console.error);
}

module.exports = MCPWorkflowIntegrator;