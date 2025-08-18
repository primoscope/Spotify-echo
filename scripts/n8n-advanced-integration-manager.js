#!/usr/bin/env node

/**
 * Advanced n8n Integration Manager
 * Discovers, installs, and manages additional community nodes and workflow templates
 * Extends the existing n8n integration with automated discovery and installation
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const util = require('util');
const execAsync = util.promisify(require('child_process').exec);

class N8nAdvancedIntegrationManager {
    constructor() {
        this.projectRoot = process.cwd();
        this.n8nConfig = {
            apiUrl: process.env.N8N_API_URL || 'https://primosphere.ninja',
            apiKey: process.env.N8N_API_KEY,
            webhookBase: process.env.N8N_WEBHOOK_BASE_URL || 'https://primosphere.ninja/webhook'
        };
        
        this.communityNodes = new Map();
        this.workflowTemplates = new Map();
        this.installedNodes = new Set();
        
        this.initializeCommunityNodes();
        this.initializeWorkflowTemplates();
    }

    /**
     * Initialize comprehensive list of community nodes to discover
     */
    initializeCommunityNodes() {
        // Core AI/ML Nodes
        this.communityNodes.set('n8n-nodes-openai', {
            name: 'OpenAI Integration',
            package: 'n8n-nodes-openai',
            description: 'Advanced OpenAI integration with GPT-4, DALL-E, and Whisper',
            category: 'AI/ML',
            priority: 'high',
            useCase: 'AI-powered workflows, content generation, analysis',
            installCommand: 'npm install n8n-nodes-openai',
            configRequired: ['OPENAI_API_KEY']
        });

        this.communityNodes.set('n8n-nodes-anthropic', {
            name: 'Anthropic Claude Integration',
            package: 'n8n-nodes-anthropic',
            description: 'Claude AI integration for advanced reasoning and analysis',
            category: 'AI/ML',
            priority: 'high',
            useCase: 'Complex reasoning, code analysis, content creation',
            installCommand: 'npm install n8n-nodes-anthropic',
            configRequired: ['ANTHROPIC_API_KEY']
        });

        this.communityNodes.set('n8n-nodes-gemini', {
            name: 'Google Gemini Integration',
            package: 'n8n-nodes-gemini',
            description: 'Google Gemini AI integration for multimodal workflows',
            category: 'AI/ML',
            priority: 'medium',
            useCase: 'Multimodal AI, image analysis, content generation',
            installCommand: 'npm install n8n-nodes-gemini',
            configRequired: ['GEMINI_API_KEY']
        });

        // Database & Data Processing Nodes
        this.communityNodes.set('n8n-nodes-mongodb', {
            name: 'MongoDB Integration',
            package: 'n8n-nodes-mongodb',
            description: 'Advanced MongoDB operations and aggregation pipelines',
            category: 'Database',
            priority: 'high',
            useCase: 'Data processing, analytics, real-time updates',
            installCommand: 'npm install n8n-nodes-mongodb',
            configRequired: ['MONGODB_URI']
        });

        this.communityNodes.set('n8n-nodes-redis', {
            name: 'Redis Integration',
            package: 'n8n-nodes-redis',
            description: 'Redis operations for caching and real-time data',
            category: 'Database',
            priority: 'medium',
            useCase: 'Caching, session management, real-time features',
            installCommand: 'npm install n8n-nodes-redis',
            configRequired: ['REDIS_URL']
        });

        this.communityNodes.set('n8n-nodes-postgres', {
            name: 'PostgreSQL Integration',
            package: 'n8n-nodes-postgres',
            description: 'Advanced PostgreSQL operations and analytics',
            category: 'Database',
            priority: 'medium',
            useCase: 'Data warehousing, analytics, reporting',
            installCommand: 'npm install n8n-nodes-postgres',
            configRequired: ['POSTGRES_CONNECTION_STRING']
        });

        // Development & DevOps Nodes
        this.communityNodes.set('n8n-nodes-docker', {
            name: 'Docker Integration',
            package: 'n8n-nodes-docker',
            description: 'Docker container management and orchestration',
            category: 'DevOps',
            priority: 'high',
            useCase: 'Container deployment, scaling, monitoring',
            installCommand: 'npm install n8n-nodes-docker',
            configRequired: ['DOCKER_HOST', 'DOCKER_CERT_PATH']
        });

        this.communityNodes.set('n8n-nodes-kubernetes', {
            name: 'Kubernetes Integration',
            package: 'n8n-nodes-kubernetes',
            description: 'Kubernetes cluster management and deployment',
            category: 'DevOps',
            priority: 'medium',
            useCase: 'K8s deployment, scaling, service management',
            installCommand: 'npm install n8n-nodes-kubernetes',
            configRequired: ['KUBECONFIG']
        });

        this.communityNodes.set('n8n-nodes-github-actions', {
            name: 'GitHub Actions Integration',
            package: 'n8n-nodes-github-actions',
            description: 'GitHub Actions workflow management and triggers',
            category: 'DevOps',
            priority: 'high',
            useCase: 'CI/CD automation, deployment triggers',
            installCommand: 'npm install n8n-nodes-github-actions',
            configRequired: ['GITHUB_TOKEN']
        });

        // Communication & Integration Nodes
        this.communityNodes.set('n8n-nodes-slack', {
            name: 'Slack Integration',
            package: 'n8n-nodes-slack',
            description: 'Advanced Slack messaging and automation',
            category: 'Communication',
            priority: 'medium',
            useCase: 'Team notifications, automated responses, workflow alerts',
            installCommand: 'npm install n8n-nodes-slack',
            configRequired: ['SLACK_BOT_TOKEN', 'SLACK_SIGNING_SECRET']
        });

        this.communityNodes.set('n8n-nodes-discord', {
            name: 'Discord Integration',
            package: 'n8n-nodes-discord',
            description: 'Discord bot automation and webhook handling',
            category: 'Communication',
            priority: 'medium',
            useCase: 'Community management, automated responses, notifications',
            installCommand: 'npm install n8n-nodes-discord',
            configRequired: ['DISCORD_BOT_TOKEN', 'DISCORD_GUILD_ID']
        });

        this.communityNodes.set('n8n-nodes-telegram', {
            name: 'Telegram Integration',
            package: 'n8n-nodes-telegram',
            description: 'Telegram bot automation and messaging',
            category: 'Communication',
            priority: 'low',
            useCase: 'Personal notifications, automated responses',
            installCommand: 'npm install n8n-nodes-telegram',
            configRequired: ['TELEGRAM_BOT_TOKEN']
        });

        // Analytics & Monitoring Nodes
        this.communityNodes.set('n8n-nodes-prometheus', {
            name: 'Prometheus Integration',
            package: 'n8n-nodes-prometheus',
            description: 'Prometheus metrics collection and alerting',
            category: 'Monitoring',
            priority: 'medium',
            useCase: 'System monitoring, performance metrics, alerting',
            installCommand: 'npm install n8n-nodes-prometheus',
            configRequired: ['PROMETHEUS_URL']
        });

        this.communityNodes.set('n8n-nodes-grafana', {
            name: 'Grafana Integration',
            package: 'n8n-nodes-grafana',
            description: 'Grafana dashboard management and data visualization',
            category: 'Monitoring',
            priority: 'medium',
            useCase: 'Dashboard automation, data visualization, reporting',
            installCommand: 'npm install n8n-nodes-grafana',
            configRequired: ['GRAFANA_URL', 'GRAFANA_API_KEY']
        });

        // Specialized AI/ML Nodes
        this.communityNodes.set('n8n-nodes-huggingface', {
            name: 'Hugging Face Integration',
            package: 'n8n-nodes-huggingface',
            description: 'Hugging Face model inference and fine-tuning',
            category: 'AI/ML',
            priority: 'medium',
            useCase: 'Custom ML models, inference, model management',
            installCommand: 'npm install n8n-nodes-huggingface',
            configRequired: ['HUGGINGFACE_API_KEY']
        });

        this.communityNodes.set('n8n-nodes-replicate', {
            name: 'Replicate Integration',
            package: 'n8n-nodes-replicate',
            description: 'Replicate AI model hosting and inference',
            category: 'AI/ML',
            priority: 'medium',
            useCase: 'AI model deployment, inference, model management',
            installCommand: 'npm install n8n-nodes-replicate',
            configRequired: ['REPLICATE_API_TOKEN']
        });
    }

    /**
     * Initialize workflow templates for automated deployment
     */
    initializeWorkflowTemplates() {
        // AI-Powered Development Workflows
        this.workflowTemplates.set('ai-code-review', {
            name: 'AI-Powered Code Review',
            description: 'Automated code review using multiple AI models',
            category: 'Development',
            priority: 'high',
            nodes: ['GitHub Webhook', 'DeepSeek Analysis', 'Super Code Processing', 'GitHub Comment'],
            communityNodes: ['DeepSeek', 'Super Code'],
            triggers: ['pull_request', 'push'],
            webhook: 'github-ai-code-review'
        });

        this.workflowTemplates.set('ai-issue-triage', {
            name: 'AI Issue Auto-Triage',
            description: 'Intelligent issue categorization and assignment',
            category: 'Development',
            priority: 'high',
            nodes: ['GitHub Webhook', 'AI Analysis', 'Label Manager', 'Assignment Logic'],
            communityNodes: ['OpenAI', 'Anthropic'],
            triggers: ['issues'],
            webhook: 'github-ai-issue-triage'
        });

        this.workflowTemplates.set('ai-performance-optimization', {
            name: 'AI Performance Optimization',
            description: 'Automated performance analysis and optimization suggestions',
            category: 'Development',
            priority: 'medium',
            nodes: ['Performance Monitor', 'AI Analysis', 'Optimization Generator', 'Report Creator'],
            communityNodes: ['DeepSeek', 'Super Code'],
            triggers: ['schedule', 'webhook'],
            webhook: 'ai-performance-optimization'
        });

        // Data Processing Workflows
        this.workflowTemplates.set('spotify-ai-recommendations', {
            name: 'AI-Enhanced Spotify Recommendations',
            description: 'Advanced music recommendation using AI analysis',
            category: 'Data Processing',
            priority: 'high',
            nodes: ['Spotify Webhook', 'Super Code Processing', 'AI Analysis', 'Recommendation Engine'],
            communityNodes: ['Super Code', 'OpenAI', 'Anthropic'],
            triggers: ['spotify_webhook', 'schedule'],
            webhook: 'spotify-ai-recommendations'
        });

        this.workflowTemplates.set('data-pipeline-automation', {
            name: 'Data Pipeline Automation',
            description: 'Automated data processing and transformation',
            category: 'Data Processing',
            priority: 'medium',
            nodes: ['Data Source', 'Super Code Processing', 'Quality Check', 'Destination'],
            communityNodes: ['Super Code', 'MongoDB', 'Redis'],
            triggers: ['schedule', 'webhook'],
            webhook: 'data-pipeline-automation'
        });

        // DevOps & Deployment Workflows
        this.workflowTemplates.set('automated-deployment', {
            name: 'Automated Deployment Pipeline',
            description: 'CI/CD automation with deployment validation',
            category: 'DevOps',
            priority: 'high',
            nodes: ['GitHub Webhook', 'Build Trigger', 'Test Runner', 'Deploy Manager'],
            communityNodes: ['GitHub Actions', 'Docker', 'Kubernetes'],
            triggers: ['pull_request', 'push'],
            webhook: 'automated-deployment'
        });

        this.workflowTemplates.set('infrastructure-monitoring', {
            name: 'Infrastructure Health Monitoring',
            description: 'Real-time infrastructure monitoring and alerting',
            category: 'DevOps',
            priority: 'medium',
            nodes: ['Health Check', 'Metrics Collector', 'Alert Manager', 'Notification System'],
            communityNodes: ['Prometheus', 'Grafana', 'Slack'],
            triggers: ['schedule', 'webhook'],
            webhook: 'infrastructure-monitoring'
        });

        // Communication & Notification Workflows
        this.workflowTemplates.set('smart-notifications', {
            name: 'Smart Notification System',
            description: 'Intelligent notification routing and delivery',
            category: 'Communication',
            priority: 'medium',
            nodes: ['Event Trigger', 'AI Router', 'Channel Selector', 'Message Sender'],
            communityNodes: ['OpenAI', 'Slack', 'Discord', 'Telegram'],
            triggers: ['webhook', 'schedule'],
            webhook: 'smart-notifications'
        });

        this.workflowTemplates.set('team-collaboration', {
            name: 'Team Collaboration Automation',
            description: 'Automated team coordination and task management',
            category: 'Communication',
            priority: 'medium',
            nodes: ['Task Creator', 'Assignment Logic', 'Progress Tracker', 'Update Notifier'],
            communityNodes: ['GitHub', 'Slack', 'Discord'],
            triggers: ['webhook', 'schedule'],
            webhook: 'team-collaboration'
        });
    }

    /**
     * Discover available community nodes from npm registry
     */
    async discoverCommunityNodes() {
        console.log('🔍 Discovering available n8n community nodes...');
        
        const discoveredNodes = [];
        
        for (const [key, node] of this.communityNodes) {
            try {
                // Check if package exists on npm
                const { stdout } = await execAsync(`npm view ${node.package} --json`);
                const packageInfo = JSON.parse(stdout);
                
                discoveredNodes.push({
                    ...node,
                    npmInfo: packageInfo,
                    available: true,
                    latestVersion: packageInfo['dist-tags']?.latest || 'unknown'
                });
                
                console.log(`✅ Found: ${node.name} (${packageInfo['dist-tags']?.latest || 'unknown'})`);
            } catch (error) {
                console.log(`❌ Not found: ${node.name}`);
            }
        }
        
        return discoveredNodes;
    }

    /**
     * Install community nodes with dependency management
     */
    async installCommunityNodes(nodes = null) {
        const nodesToInstall = nodes || Array.from(this.communityNodes.keys());
        
        console.log(`🚀 Installing ${nodesToInstall.length} community nodes...`);
        
        const results = [];
        
        for (const nodeKey of nodesToInstall) {
            const node = this.communityNodes.get(nodeKey);
            if (!node) continue;
            
            try {
                console.log(`📦 Installing ${node.name}...`);
                
                // Check if already installed
                if (this.installedNodes.has(nodeKey)) {
                    console.log(`   ⏭️  Already installed: ${node.name}`);
                    results.push({ node: node.name, status: 'already_installed' });
                    continue;
                }
                
                // Install the package
                const { stdout, stderr } = await execAsync(node.installCommand, {
                    cwd: this.projectRoot,
                    timeout: 60000
                });
                
                if (stderr && !stderr.includes('npm WARN')) {
                    throw new Error(stderr);
                }
                
                this.installedNodes.add(nodeKey);
                console.log(`   ✅ Installed: ${node.name}`);
                results.push({ node: node.name, status: 'installed' });
                
            } catch (error) {
                console.log(`   ❌ Failed: ${node.name} - ${error.message}`);
                results.push({ node: node.name, status: 'failed', error: error.message });
            }
        }
        
        return results;
    }

    /**
     * Deploy workflow templates to n8n
     */
    async deployWorkflowTemplates(templates = null) {
        const templatesToDeploy = templates || Array.from(this.workflowTemplates.keys());
        
        console.log(`🚀 Deploying ${templatesToDeploy.length} workflow templates...`);
        
        const results = [];
        
        for (const templateKey of templatesToDeploy) {
            const template = this.workflowTemplates.get(templateKey);
            if (!template) continue;
            
            try {
                console.log(`📋 Deploying: ${template.name}...`);
                
                // Create workflow JSON
                const workflow = this.generateWorkflowJSON(template);
                
                // Save workflow file
                const workflowPath = path.join(this.projectRoot, 'workflows', `${templateKey}.json`);
                await fs.mkdir(path.dirname(workflowPath), { recursive: true });
                await fs.writeFile(workflowPath, JSON.stringify(workflow, null, 2));
                
                console.log(`   ✅ Deployed: ${template.name}`);
                results.push({ template: template.name, status: 'deployed', path: workflowPath });
                
            } catch (error) {
                console.log(`   ❌ Failed: ${template.name} - ${error.message}`);
                results.push({ template: template.name, status: 'failed', error: error.message });
            }
        }
        
        return results;
    }

    /**
     * Generate workflow JSON from template
     */
    generateWorkflowJSON(template) {
        return {
            name: template.name,
            description: template.description,
            nodes: this.generateNodesFromTemplate(template),
            connections: this.generateConnectionsFromTemplate(template),
            active: true,
            settings: {
                executionOrder: 'v1'
            },
            tags: [template.category, 'automated', 'template'],
            triggerCount: 1,
            updatedAt: new Date().toISOString(),
            versionId: '1'
        };
    }

    /**
     * Generate nodes array from template
     */
    generateNodesFromTemplate(template) {
        const nodes = [];
        let position = 0;
        
        // Add trigger node
        if (template.triggers.includes('webhook')) {
            nodes.push({
                id: 'webhook-trigger',
                name: 'Webhook Trigger',
                type: 'n8n-nodes-base.webhook',
                typeVersion: 1,
                position: [position * 300, 300],
                parameters: {
                    httpMethod: 'POST',
                    path: template.webhook,
                    responseMode: 'responseNode',
                    options: {}
                }
            });
            position++;
        }
        
        // Add processing nodes
        template.nodes.forEach((nodeName, index) => {
            if (nodeName === 'Webhook Trigger') return;
            
            nodes.push({
                id: `node-${index}`,
                name: nodeName,
                type: this.getNodeType(nodeName, template.communityNodes),
                typeVersion: 1,
                position: [position * 300, 300],
                parameters: this.getDefaultParameters(nodeName)
            });
            position++;
        });
        
        return nodes;
    }

    /**
     * Get node type based on name and community nodes
     */
    getNodeType(nodeName, communityNodes) {
        const nodeTypeMap = {
            'GitHub Webhook': 'n8n-nodes-base.webhook',
            'DeepSeek Analysis': 'n8n-nodes-deepseek.deepseek',
            'Super Code Processing': 'n8n-nodes-supercode.superCode',
            'GitHub Comment': 'n8n-nodes-base.github',
            'AI Analysis': 'n8n-nodes-openai.openAi',
            'Label Manager': 'n8n-nodes-base.github',
            'Assignment Logic': 'n8n-nodes-base.code',
            'Performance Monitor': 'n8n-nodes-base.code',
            'Optimization Generator': 'n8n-nodes-base.code',
            'Report Creator': 'n8n-nodes-base.code',
            'Spotify Webhook': 'n8n-nodes-base.webhook',
            'Recommendation Engine': 'n8n-nodes-base.code',
            'Data Source': 'n8n-nodes-base.code',
            'Quality Check': 'n8n-nodes-base.code',
            'Destination': 'n8n-nodes-base.code',
            'Build Trigger': 'n8n-nodes-base.code',
            'Test Runner': 'n8n-nodes-base.code',
            'Deploy Manager': 'n8n-nodes-base.code',
            'Health Check': 'n8n-nodes-base.code',
            'Metrics Collector': 'n8n-nodes-base.code',
            'Alert Manager': 'n8n-nodes-base.code',
            'Notification System': 'n8n-nodes-base.code',
            'Event Trigger': 'n8n-nodes-base.code',
            'AI Router': 'n8n-nodes-base.code',
            'Channel Selector': 'n8n-nodes-base.code',
            'Message Sender': 'n8n-nodes-base.code',
            'Task Creator': 'n8n-nodes-base.code',
            'Progress Tracker': 'n8n-nodes-base.code',
            'Update Notifier': 'n8n-nodes-base.code'
        };
        
        return nodeTypeMap[nodeName] || 'n8n-nodes-base.code';
    }

    /**
     * Get default parameters for node
     */
    getDefaultParameters(nodeName) {
        const defaultParams = {
            'GitHub Comment': {
                resource: 'issue',
                operation: 'update',
                issueNumber: '={{ $json.number }}',
                body: '={{ $json.analysis }}'
            },
            'AI Analysis': {
                resource: 'chat',
                model: 'gpt-4',
                messages: {
                    values: [
                        {
                            role: 'system',
                            content: 'You are an AI assistant analyzing data and providing insights.'
                        },
                        {
                            role: 'user',
                            content: '={{ $json.data }}'
                        }
                    ]
                }
            }
        };
        
        return defaultParams[nodeName] || {};
    }

    /**
     * Generate connections between nodes
     */
    generateConnectionsFromTemplate(template) {
        const connections = {};
        const nodeIds = ['webhook-trigger'];
        
        // Generate sequential connections
        for (let i = 0; i < template.nodes.length - 1; i++) {
            const fromNode = nodeIds[i] || `node-${i}`;
            const toNode = nodeIds[i + 1] || `node-${i + 1}`;
            
            if (!connections[fromNode]) {
                connections[fromNode] = {};
            }
            
            connections[fromNode].main = [
                [
                    {
                        node: toNode,
                        type: 'main',
                        index: 0
                    }
                ]
            ];
        }
        
        return connections;
    }

    /**
     * Generate comprehensive integration report
     */
    async generateIntegrationReport() {
        const discoveredNodes = await this.discoverCommunityNodes();
        const installedResults = await this.installCommunityNodes();
        const deployedResults = await this.deployWorkflowTemplates();
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalCommunityNodes: discoveredNodes.length,
                installedNodes: installedResults.filter(r => r.status === 'installed').length,
                failedInstallations: installedResults.filter(r => r.status === 'failed').length,
                totalTemplates: this.workflowTemplates.size,
                deployedTemplates: deployedResults.filter(r => r.status === 'deployed').length
            },
            discoveredNodes,
            installationResults: installedResults,
            deploymentResults: deployedResults,
            recommendations: this.generateRecommendations(discoveredNodes, installedResults)
        };
        
        // Save report
        const reportPath = path.join(this.projectRoot, 'reports', 'n8n-integration-report.json');
        await fs.mkdir(path.dirname(reportPath), { recursive: true });
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        return report;
    }

    /**
     * Generate recommendations based on results
     */
    generateRecommendations(discoveredNodes, installedResults) {
        const recommendations = [];
        
        // Check for high-priority nodes that failed
        const failedHighPriority = installedResults.filter(r => 
            r.status === 'failed' && 
            discoveredNodes.find(n => n.name === r.node)?.priority === 'high'
        );
        
        if (failedHighPriority.length > 0) {
            recommendations.push({
                type: 'critical',
                message: 'High-priority nodes failed to install. Review dependencies and try manual installation.',
                nodes: failedHighPriority.map(r => r.node)
            });
        }
        
        // Suggest next steps
        recommendations.push({
            type: 'info',
            message: 'Configure environment variables for installed nodes to enable full functionality.',
            action: 'Update .env file with required API keys and configuration'
        });
        
        recommendations.push({
            type: 'info',
            message: 'Test deployed workflows in n8n interface to ensure proper configuration.',
            action: 'Access n8n at https://primosphere.ninja and validate workflows'
        });
        
        return recommendations;
    }

    /**
     * Main execution method
     */
    async run() {
        try {
            console.log('🚀 n8n Advanced Integration Manager');
            console.log('=====================================\n');
            
            const report = await this.generateIntegrationReport();
            
            console.log('\n📊 Integration Report Summary:');
            console.log(`   Community Nodes Discovered: ${report.summary.totalCommunityNodes}`);
            console.log(`   Nodes Installed: ${report.summary.installedNodes}`);
            console.log(`   Templates Deployed: ${report.summary.deployedTemplates}`);
            
            if (report.recommendations.length > 0) {
                console.log('\n💡 Recommendations:');
                report.recommendations.forEach(rec => {
                    console.log(`   ${rec.type.toUpperCase()}: ${rec.message}`);
                    if (rec.action) {
                        console.log(`      Action: ${rec.action}`);
                    }
                });
            }
            
            console.log(`\n📄 Full report saved to: reports/n8n-integration-report.json`);
            
        } catch (error) {
            console.error('❌ Error in n8n integration:', error.message);
            process.exit(1);
        }
    }
}

// CLI interface
if (require.main === module) {
    const manager = new N8nAdvancedIntegrationManager();
    
    const command = process.argv[2];
    
    switch (command) {
        case 'discover':
            manager.discoverCommunityNodes().then(console.log);
            break;
        case 'install':
            const nodes = process.argv[3] ? process.argv[3].split(',') : null;
            manager.installCommunityNodes(nodes).then(console.log);
            break;
        case 'deploy':
            const templates = process.argv[3] ? process.argv[3].split(',') : null;
            manager.deployWorkflowTemplates(templates).then(console.log);
            break;
        case 'report':
            manager.generateIntegrationReport().then(console.log);
            break;
        default:
            manager.run();
    }
}

module.exports = N8nAdvancedIntegrationManager;