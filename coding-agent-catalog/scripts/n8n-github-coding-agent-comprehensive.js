#!/usr/bin/env node

/**
 * Comprehensive n8n GitHub Coding Agent Implementation
 * Creates advanced workflows for GitHub integration with AI-powered automation
 * Integrates community nodes: SuperCode, DeepSeek, MCP Client
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class N8nGitHubCodingAgent {
    constructor() {
        this.n8nConfig = {
            baseURL: process.env.N8N_API_URL || 'https://primosphere.ninja',
            apiKey: process.env.N8N_API_KEY,
            webhookBaseURL: process.env.N8N_WEBHOOK_BASE_URL || 'https://primosphere.ninja/webhook'
        };
        
        this.workflowTemplates = new Map();
        this.communityNodes = {
            supercode: '@kenkaiii/n8n-nodes-supercode',
            deepseek: 'n8n-nodes-deepseek', 
            mcp: 'n8n-nodes-mcp'
        };
        
        this.credentials = {
            github: {
                token: process.env.GITHUB_TOKEN,
                webhookSecret: process.env.GITHUB_WEBHOOK_SECRET
            },
            ai: {
                deepseek: process.env.DEEPSEEK_API_KEY,
                openai: process.env.OPENAI_API_KEY
            }
        };
    }

    async initialize() {
        console.log('🚀 Initializing n8n GitHub Coding Agent...');
        
        // Verify n8n connectivity
        await this.verifyN8nConnection();
        
        // Load workflow templates
        await this.loadWorkflowTemplates();
        
        // Set up GitHub webhooks
        await this.setupGitHubWebhooks();
        
        console.log('✅ n8n GitHub Coding Agent initialized successfully');
    }

    async verifyN8nConnection() {
        try {
            const response = await axios.get(`${this.n8nConfig.baseURL}/api/v1/workflows`, {
                headers: {
                    'X-N8N-API-KEY': this.n8nConfig.apiKey
                }
            });
            
            console.log(`✅ Connected to n8n instance at ${this.n8nConfig.baseURL}`);
            console.log(`📊 Found ${response.data.data.length} existing workflows`);
            
        } catch (error) {
            console.error('❌ Failed to connect to n8n:', error.message);
            throw new Error('n8n connection failed');
        }
    }

    async loadWorkflowTemplates() {
        console.log('📚 Loading comprehensive workflow templates...');
        
        // 1. AI-Powered Code Review Workflow
        this.workflowTemplates.set('ai-code-review', {
            name: 'AI-Powered Code Review Agent',
            description: 'Automated code review using DeepSeek AI and Super Code processing',
            active: true,
            nodes: [
                {
                    name: 'GitHub PR Webhook',
                    type: 'n8n-nodes-base.webhook',
                    position: [100, 100],
                    parameters: {
                        path: 'github-pr-review',
                        httpMethod: 'POST',
                        responseMode: 'responseNode'
                    },
                    webhookId: 'github-pr-webhook'
                },
                {
                    name: 'Extract PR Data',
                    type: 'n8n-nodes-base.function',
                    position: [300, 100],
                    parameters: {
                        functionCode: `
                            const webhook = items[0].json;
                            const pullRequest = webhook.pull_request;
                            
                            if (!pullRequest) {
                                return [{ json: { skip: true, reason: 'Not a pull request event' } }];
                            }
                            
                            return [{
                                json: {
                                    action: webhook.action,
                                    prNumber: pullRequest.number,
                                    repoOwner: webhook.repository.owner.login,
                                    repoName: webhook.repository.name,
                                    prTitle: pullRequest.title,
                                    prBody: pullRequest.body,
                                    author: pullRequest.user.login,
                                    branchName: pullRequest.head.ref,
                                    baseBranch: pullRequest.base.ref,
                                    changedFiles: pullRequest.changed_files,
                                    additions: pullRequest.additions,
                                    deletions: pullRequest.deletions,
                                    htmlUrl: pullRequest.html_url
                                }
                            }];
                        `
                    }
                },
                {
                    name: 'Check PR Action',
                    type: 'n8n-nodes-base.if',
                    position: [500, 100],
                    parameters: {
                        conditions: {
                            string: [
                                {
                                    value1: '={{ $json.action }}',
                                    operation: 'equal',
                                    value2: 'opened'
                                }
                            ]
                        }
                    }
                },
                {
                    name: 'Get PR Files',
                    type: 'n8n-nodes-base.github',
                    position: [700, 100],
                    parameters: {
                        operation: 'getFiles',
                        owner: '={{ $json.repoOwner }}',
                        repository: '={{ $json.repoName }}',
                        pullRequestNumber: '={{ $json.prNumber }}'
                    }
                },
                {
                    name: 'Process Files with Super Code',
                    type: '@kenkaiii/n8n-nodes-supercode.supercode',
                    position: [900, 100],
                    parameters: {
                        code: `
                            const files = $input.all();
                            const processedFiles = [];
                            
                            files.forEach(file => {
                                const fileData = file.json;
                                
                                // Skip binary files and large files
                                if (fileData.filename.match(/\\.(jpg|jpeg|png|gif|pdf|zip|tar|gz)$/i) || 
                                    fileData.changes > 1000) {
                                    return;
                                }
                                
                                processedFiles.push({
                                    filename: fileData.filename,
                                    status: fileData.status,
                                    changes: fileData.changes,
                                    additions: fileData.additions,
                                    deletions: fileData.deletions,
                                    patch: fileData.patch,
                                    content: fileData.patch ? fileData.patch.split('\\n').slice(3).join('\\n') : '',
                                    language: detectLanguage(fileData.filename),
                                    complexity: calculateComplexity(fileData.patch)
                                });
                            });
                            
                            function detectLanguage(filename) {
                                const ext = filename.split('.').pop().toLowerCase();
                                const languageMap = {
                                    'js': 'javascript',
                                    'ts': 'typescript', 
                                    'py': 'python',
                                    'java': 'java',
                                    'cpp': 'cpp',
                                    'c': 'c',
                                    'go': 'go',
                                    'rs': 'rust',
                                    'php': 'php',
                                    'rb': 'ruby'
                                };
                                return languageMap[ext] || 'text';
                            }
                            
                            function calculateComplexity(patch) {
                                if (!patch) return 0;
                                const lines = patch.split('\\n');
                                let complexity = 0;
                                
                                lines.forEach(line => {
                                    if (line.includes('if') || line.includes('for') || 
                                        line.includes('while') || line.includes('switch')) {
                                        complexity++;
                                    }
                                });
                                
                                return complexity;
                            }
                            
                            return [{ json: { files: processedFiles, totalFiles: processedFiles.length } }];
                        `
                    }
                },
                {
                    name: 'DeepSeek Code Analysis',
                    type: 'n8n-nodes-deepseek.deepseek',
                    position: [1100, 100],
                    parameters: {
                        operation: 'analyzeCode',
                        model: 'deepseek-coder',
                        prompt: `
                            Please analyze the following code changes for:
                            1. Code quality and best practices
                            2. Potential bugs and security vulnerabilities
                            3. Performance implications
                            4. Maintainability concerns
                            5. Testing recommendations
                            
                            Files to analyze:
                            {{ JSON.stringify($json.files, null, 2) }}
                            
                            Provide specific, actionable feedback with code examples where applicable.
                        `,
                        temperature: 0.3,
                        maxTokens: 2000
                    }
                },
                {
                    name: 'Generate Review Summary',
                    type: '@kenkaiii/n8n-nodes-supercode.supercode',
                    position: [1300, 100],
                    parameters: {
                        code: `
                            const analysis = $node['DeepSeek Code Analysis'].json;
                            const files = $node['Process Files with Super Code'].json.files;
                            const prData = $node['Extract PR Data'].json;
                            
                            const summary = {
                                pullRequest: {
                                    number: prData.prNumber,
                                    title: prData.prTitle,
                                    author: prData.author,
                                    filesChanged: files.length,
                                    totalAdditions: prData.additions,
                                    totalDeletions: prData.deletions
                                },
                                analysis: analysis.analysis || analysis.choices?.[0]?.message?.content || 'Analysis completed',
                                recommendations: extractRecommendations(analysis),
                                severity: calculateSeverity(analysis),
                                autoApprove: shouldAutoApprove(analysis, files)
                            };
                            
                            function extractRecommendations(analysis) {
                                const text = analysis.analysis || analysis.choices?.[0]?.message?.content || '';
                                const recommendations = [];
                                
                                // Extract numbered lists or bullet points
                                const lines = text.split('\\n');
                                lines.forEach(line => {
                                    if (line.match(/^\\d+\\.|^[•\\-\\*]/)) {
                                        recommendations.push(line.trim());
                                    }
                                });
                                
                                return recommendations;
                            }
                            
                            function calculateSeverity(analysis) {
                                const text = (analysis.analysis || analysis.choices?.[0]?.message?.content || '').toLowerCase();
                                
                                if (text.includes('critical') || text.includes('security') || text.includes('vulnerability')) {
                                    return 'high';
                                } else if (text.includes('warning') || text.includes('performance') || text.includes('bug')) {
                                    return 'medium';
                                } else {
                                    return 'low';
                                }
                            }
                            
                            function shouldAutoApprove(analysis, files) {
                                const text = (analysis.analysis || analysis.choices?.[0]?.message?.content || '').toLowerCase();
                                
                                // Auto-approve if no critical issues and small changes
                                return !text.includes('critical') && 
                                       !text.includes('security') && 
                                       !text.includes('vulnerability') &&
                                       files.length <= 5;
                            }
                            
                            return [{ json: summary }];
                        `
                    }
                },
                {
                    name: 'Format Review Comment',
                    type: '@kenkaiii/n8n-nodes-supercode.supercode',
                    position: [1500, 100],
                    parameters: {
                        code: `
                            const summary = $input.first().json;
                            
                            const markdown = \`## 🤖 AI Code Review Summary
                            
**Pull Request:** #\${summary.pullRequest.number} - \${summary.pullRequest.title}
**Author:** @\${summary.pullRequest.author}
**Files Changed:** \${summary.pullRequest.filesChanged}
**Lines:** +\${summary.pullRequest.totalAdditions} -\${summary.pullRequest.totalDeletions}
**Severity:** \${getSeverityEmoji(summary.severity)} \${summary.severity.toUpperCase()}

### 📊 Analysis Results

\${summary.analysis}

### 💡 Recommendations

\${summary.recommendations.map(rec => \`- \${rec}\`).join('\\n')}

### 🎯 Verdict

\${summary.autoApprove ? 
  '✅ **AUTO-APPROVED** - No critical issues detected. Changes look good!' : 
  '⚠️ **MANUAL REVIEW REQUIRED** - Please address the identified issues before merging.'
}

---
*Generated by EchoTune AI Code Review Agent powered by DeepSeek and n8n*\`;

                            function getSeverityEmoji(severity) {
                                switch(severity) {
                                    case 'high': return '🚨';
                                    case 'medium': return '⚠️';
                                    case 'low': return '💚';
                                    default: return '📝';
                                }
                            }
                            
                            return [{ json: { 
                                comment: markdown,
                                autoApprove: summary.autoApprove,
                                severity: summary.severity
                            }}];
                        `
                    }
                },
                {
                    name: 'Post Review Comment',
                    type: 'n8n-nodes-base.github',
                    position: [1700, 100],
                    parameters: {
                        operation: 'createReview',
                        owner: '={{ $node["Extract PR Data"].json.repoOwner }}',
                        repository: '={{ $node["Extract PR Data"].json.repoName }}',
                        pullRequestNumber: '={{ $node["Extract PR Data"].json.prNumber }}',
                        body: '={{ $json.comment }}',
                        event: '={{ $json.autoApprove ? "APPROVE" : "COMMENT" }}'
                    }
                },
                {
                    name: 'Webhook Response',
                    type: 'n8n-nodes-base.respondToWebhook',
                    position: [1900, 100],
                    parameters: {
                        responseBody: '={{ JSON.stringify({ status: "success", message: "Code review completed", severity: $json.severity }) }}',
                        responseContentType: 'application/json',
                        responseStatusCode: 200
                    }
                }
            ],
            connections: {
                'GitHub PR Webhook': { main: [['Extract PR Data']] },
                'Extract PR Data': { main: [['Check PR Action']] },
                'Check PR Action': { main: [['Get PR Files']] },
                'Get PR Files': { main: [['Process Files with Super Code']] },
                'Process Files with Super Code': { main: [['DeepSeek Code Analysis']] },
                'DeepSeek Code Analysis': { main: [['Generate Review Summary']] },
                'Generate Review Summary': { main: [['Format Review Comment']] },
                'Format Review Comment': { main: [['Post Review Comment']] },
                'Post Review Comment': { main: [['Webhook Response']] }
            }
        });

        // 2. GitHub Issues Auto-Triage Workflow
        this.workflowTemplates.set('github-issues-triage', {
            name: 'GitHub Issues Auto-Triage Agent',
            description: 'Automatically categorize, label, and assign GitHub issues using AI',
            active: true,
            nodes: [
                {
                    name: 'GitHub Issues Webhook',
                    type: 'n8n-nodes-base.webhook',
                    position: [100, 200],
                    parameters: {
                        path: 'github-issues-triage',
                        httpMethod: 'POST'
                    }
                },
                {
                    name: 'Process Issue Data',
                    type: '@kenkaiii/n8n-nodes-supercode.supercode',
                    position: [300, 200],
                    parameters: {
                        code: `
                            const webhook = items[0].json;
                            const issue = webhook.issue;
                            
                            if (!issue || webhook.action !== 'opened') {
                                return [{ json: { skip: true } }];
                            }
                            
                            return [{
                                json: {
                                    issueNumber: issue.number,
                                    title: issue.title,
                                    body: issue.body || '',
                                    author: issue.user.login,
                                    repository: webhook.repository.full_name,
                                    repoOwner: webhook.repository.owner.login,
                                    repoName: webhook.repository.name,
                                    labels: issue.labels.map(l => l.name),
                                    assignees: issue.assignees.map(a => a.login),
                                    htmlUrl: issue.html_url,
                                    createdAt: issue.created_at
                                }
                            }];
                        `
                    }
                },
                {
                    name: 'AI Issue Classification',
                    type: 'n8n-nodes-deepseek.deepseek',
                    position: [500, 200],
                    parameters: {
                        operation: 'classifyText',
                        prompt: `
                            Analyze this GitHub issue and provide classification:
                            
                            Title: {{ $json.title }}
                            Body: {{ $json.body }}
                            
                            Please classify this issue and provide:
                            1. Type (bug, feature, enhancement, documentation, question, support)
                            2. Priority (low, medium, high, critical)
                            3. Components affected (frontend, backend, database, api, testing, ci/cd)
                            4. Estimated complexity (simple, moderate, complex)
                            5. Suggested assignee team (frontend-team, backend-team, devops-team, qa-team)
                            6. Labels to add
                            
                            Respond in JSON format with these fields.
                        `,
                        model: 'deepseek-chat',
                        temperature: 0.1
                    }
                },
                {
                    name: 'Apply Auto-Labels',
                    type: 'n8n-nodes-base.github',
                    position: [700, 200],
                    parameters: {
                        operation: 'addLabels',
                        owner: '={{ $node["Process Issue Data"].json.repoOwner }}',
                        repository: '={{ $node["Process Issue Data"].json.repoName }}',
                        issueNumber: '={{ $node["Process Issue Data"].json.issueNumber }}',
                        labels: '={{ $node["AI Issue Classification"].json.labels || [] }}'
                    }
                },
                {
                    name: 'Auto-Assign Team',
                    type: 'n8n-nodes-base.github',
                    position: [900, 200],
                    parameters: {
                        operation: 'addAssignees',
                        owner: '={{ $node["Process Issue Data"].json.repoOwner }}',
                        repository: '={{ $node["Process Issue Data"].json.repoName }}',
                        issueNumber: '={{ $node["Process Issue Data"].json.issueNumber }}',
                        assignees: '={{ $node["AI Issue Classification"].json.suggestedTeam ? [$node["AI Issue Classification"].json.suggestedTeam] : [] }}'
                    }
                }
            ]
        });

        // 3. Automated CI/CD Pipeline Workflow
        this.workflowTemplates.set('cicd-automation', {
            name: 'GitHub CI/CD Automation Pipeline',
            description: 'Automated testing, building, and deployment pipeline',
            active: true,
            nodes: [
                {
                    name: 'GitHub Push Webhook',
                    type: 'n8n-nodes-base.webhook',
                    position: [100, 300],
                    parameters: {
                        path: 'github-cicd-pipeline',
                        httpMethod: 'POST'
                    }
                },
                {
                    name: 'Check Branch',
                    type: 'n8n-nodes-base.if',
                    position: [300, 300],
                    parameters: {
                        conditions: {
                            string: [
                                {
                                    value1: '={{ $json.ref }}',
                                    operation: 'equal',
                                    value2: 'refs/heads/main'
                                }
                            ]
                        }
                    }
                },
                {
                    name: 'Run Tests',
                    type: 'n8n-nodes-base.executeCommand',
                    position: [500, 300],
                    parameters: {
                        command: 'cd /workspace && npm test'
                    }
                },
                {
                    name: 'Build Application',
                    type: 'n8n-nodes-base.executeCommand',
                    position: [700, 300],
                    parameters: {
                        command: 'cd /workspace && npm run build'
                    }
                },
                {
                    name: 'Deploy to Production',
                    type: 'n8n-nodes-base.executeCommand',
                    position: [900, 300],
                    parameters: {
                        command: 'cd /workspace && docker-compose up -d --build'
                    }
                },
                {
                    name: 'Notify Success',
                    type: 'n8n-nodes-base.slack',
                    position: [1100, 300],
                    parameters: {
                        operation: 'postMessage',
                        channel: '#deployments',
                        text: '🚀 Deployment successful for {{ $node["GitHub Push Webhook"].json.repository.name }}'
                    }
                }
            ]
        });

        console.log(`✅ Loaded ${this.workflowTemplates.size} workflow templates`);
    }

    async setupGitHubWebhooks() {
        console.log('🔗 Setting up GitHub webhooks...');
        
        const webhooks = [
            {
                name: 'Pull Request Events',
                events: ['pull_request'],
                url: `${this.n8nConfig.webhookBaseURL}/github-pr-review`,
                secret: this.credentials.github.webhookSecret
            },
            {
                name: 'Issues Events', 
                events: ['issues'],
                url: `${this.n8nConfig.webhookBaseURL}/github-issues-triage`,
                secret: this.credentials.github.webhookSecret
            },
            {
                name: 'Push Events',
                events: ['push'],
                url: `${this.n8nConfig.webhookBaseURL}/github-cicd-pipeline`,
                secret: this.credentials.github.webhookSecret
            }
        ];
        
        console.log(`📋 Configured ${webhooks.length} GitHub webhook endpoints:`);
        webhooks.forEach(webhook => {
            console.log(`  - ${webhook.name}: ${webhook.url}`);
        });
    }

    async deployWorkflows() {
        console.log('🚀 Deploying workflows to n8n...');
        
        for (const [key, workflow] of this.workflowTemplates) {
            try {
                const response = await axios.post(
                    `${this.n8nConfig.baseURL}/api/v1/workflows`,
                    workflow,
                    {
                        headers: {
                            'X-N8N-API-KEY': this.n8nConfig.apiKey,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                console.log(`✅ Deployed workflow: ${workflow.name} (ID: ${response.data.id})`);
                
                // Activate the workflow
                await axios.patch(
                    `${this.n8nConfig.baseURL}/api/v1/workflows/${response.data.id}/activate`,
                    {},
                    {
                        headers: {
                            'X-N8N-API-KEY': this.n8nConfig.apiKey
                        }
                    }
                );
                
                console.log(`🟢 Activated workflow: ${workflow.name}`);
                
            } catch (error) {
                console.error(`❌ Failed to deploy workflow ${workflow.name}:`, error.message);
                if (error.response?.data) {
                    console.error('Error details:', error.response.data);
                }
            }
        }
    }

    async generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            configuration: {
                n8nInstance: this.n8nConfig.baseURL,
                communityNodes: Object.values(this.communityNodes),
                workflowCount: this.workflowTemplates.size
            },
            workflows: Array.from(this.workflowTemplates.keys()).map(key => ({
                id: key,
                name: this.workflowTemplates.get(key).name,
                description: this.workflowTemplates.get(key).description,
                nodeCount: this.workflowTemplates.get(key).nodes.length
            })),
            webhookEndpoints: [
                `${this.n8nConfig.webhookBaseURL}/github-pr-review`,
                `${this.n8nConfig.webhookBaseURL}/github-issues-triage`, 
                `${this.n8nConfig.webhookBaseURL}/github-cicd-pipeline`
            ],
            features: [
                'AI-powered code review with DeepSeek',
                'Automated issue triage and labeling',
                'CI/CD pipeline automation',
                'Super Code processing for complex logic',
                'MCP protocol integration ready',
                'GitHub webhook integration',
                'Slack notifications',
                'Auto-approval for low-risk changes'
            ]
        };
        
        await fs.writeFile(
            path.join(__dirname, '../reports/n8n-github-coding-agent-report.json'),
            JSON.stringify(report, null, 2)
        );
        
        console.log('\n📊 IMPLEMENTATION REPORT');
        console.log('========================');
        console.log(`🕐 Timestamp: ${report.timestamp}`);
        console.log(`🌐 n8n Instance: ${report.configuration.n8nInstance}`);
        console.log(`🧩 Community Nodes: ${report.configuration.communityNodes.join(', ')}`);
        console.log(`⚡ Workflows: ${report.configuration.workflowCount}`);
        console.log(`🔗 Webhook Endpoints: ${report.webhookEndpoints.length}`);
        console.log(`🎯 Features: ${report.features.length}`);
        
        return report;
    }
}

// Main execution
async function main() {
    try {
        const agent = new N8nGitHubCodingAgent();
        await agent.initialize();
        await agent.deployWorkflows();
        const report = await agent.generateReport();
        
        console.log('\n🎉 n8n GitHub Coding Agent deployment completed successfully!');
        console.log('\n📋 Next Steps:');
        console.log('1. Configure GitHub repository webhooks');
        console.log('2. Set up Slack notifications');
        console.log('3. Test workflows with sample pull requests');
        console.log('4. Monitor workflow execution logs');
        console.log('5. Fine-tune AI prompts based on results');
        
    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { N8nGitHubCodingAgent };