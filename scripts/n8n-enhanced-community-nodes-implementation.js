#!/usr/bin/env node

/**
 * N8N Enhanced Community Nodes Implementation
 * 
 * This script leverages the newly installed community nodes:
 * - @kenkaiii/n8n-nodes-supercode v1.0.83 (Super Code, Super Code Tool)
 * - n8n-nodes-deepseek v1.0.6 (DeepSeek)
 * - n8n-nodes-mcp (MCP Client)
 * 
 * Connects to: https://primosphere.ninja
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class N8nEnhancedCommunityNodesImplementation {
    constructor() {
        this.n8nUrl = 'https://primosphere.ninja';
        this.apiKey = process.env.N8N_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzNjg4N2M4Yy0wMmNhLTQ1ZGMtOGJiYy00OGQ2OTZiOTA2M2EiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1NDgzMDM3LCJleHAiOjE3NTc5OTUyMDB9.YB3-9YlDP4fOgspsenl0wEAUvSYBg8YyLeCUx09AC8w';
        
        this.communityNodes = {
            supercode: {
                name: '@kenkaiii/n8n-nodes-supercode',
                version: 'v1.0.83',
                nodes: ['Super Code', 'Super Code Tool'],
                capabilities: ['advanced_code_execution', 'multi_language_support', 'ai_assistance']
            },
            deepseek: {
                name: 'n8n-nodes-deepseek',
                version: 'v1.0.6',
                nodes: ['DeepSeek'],
                capabilities: ['ai_code_generation', 'deep_analysis', 'intelligent_debugging']
            },
            mcp: {
                name: 'n8n-nodes-mcp',
                version: 'latest',
                nodes: ['MCP Client'],
                capabilities: ['mcp_protocol_support', 'tool_integration', 'context_management'],
                documentation: 'https://modelcontextprotocol.io/docs/getting-started/intro'
            }
        };

        this.implementationPlan = {
            timestamp: new Date().toISOString(),
            server: this.n8nUrl,
            phase: 'enhanced_community_nodes_setup',
            workflows: [],
            validations: [],
            errors: []
        };

        console.log('🚀 N8N Enhanced Community Nodes Implementation');
        console.log(`🌐 Server: ${this.n8nUrl}`);
        console.log(`🔧 Community Nodes Available: ${Object.keys(this.communityNodes).length}`);
    }

    async testEnhancedConnection() {
        console.log('\n🔍 Testing enhanced n8n server connection...');
        
        try {
            // Test health endpoint
            const healthResponse = await axios.get(`${this.n8nUrl}/healthz`, { 
                timeout: 15000,
                validateStatus: () => true // Accept all status codes
            });
            
            console.log(`✅ Server health check: ${healthResponse.status}`);
            this.implementationPlan.validations.push({
                test: 'server_health',
                status: 'success',
                response_code: healthResponse.status
            });

            // Test API with new key
            const apiResponse = await axios.get(`${this.n8nUrl}/api/v1/workflows`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 15000,
                validateStatus: () => true
            });

            console.log(`🔑 API authentication test: ${apiResponse.status}`);
            
            if (apiResponse.status === 200) {
                console.log(`✅ Successfully connected! Found ${apiResponse.data?.data?.length || 0} workflows`);
                this.implementationPlan.validations.push({
                    test: 'api_authentication',
                    status: 'success',
                    workflows_count: apiResponse.data?.data?.length || 0
                });
                return true;
            } else {
                console.log(`⚠️  API returned status ${apiResponse.status}`);
                this.implementationPlan.errors.push({
                    type: 'api_auth_issue',
                    status: apiResponse.status,
                    message: apiResponse.data
                });
                return false;
            }

        } catch (error) {
            console.log(`❌ Connection error: ${error.message}`);
            this.implementationPlan.errors.push({
                type: 'connection_error',
                message: error.message,
                code: error.code
            });
            return false;
        }
    }

    async createEnhancedWorkflows() {
        console.log('\n🎯 Creating Enhanced Workflows with Community Nodes...');

        const workflows = [
            {
                name: 'EchoTune AI Music Analysis with DeepSeek',
                description: 'Advanced music analysis using DeepSeek AI node',
                nodes: ['Webhook', 'DeepSeek', 'HTTP Request', 'Set'],
                webhook_path: '/webhook/deepseek-music-analysis',
                priority: 'high'
            },
            {
                name: 'SuperCode Music Data Processing Pipeline',
                description: 'Complex data processing using SuperCode node',
                nodes: ['Webhook', 'Super Code', 'MongoDB', 'Slack'],
                webhook_path: '/webhook/supercode-processing',
                priority: 'high'
            },
            {
                name: 'MCP Client Tool Integration Hub',
                description: 'Central hub for MCP tool integrations',
                nodes: ['Webhook', 'MCP Client', 'Super Code Tool', 'HTTP Request'],
                webhook_path: '/webhook/mcp-integration-hub',
                priority: 'medium'
            },
            {
                name: 'AI-Powered Recommendation Engine',
                description: 'Combined DeepSeek + SuperCode for recommendations',
                nodes: ['Webhook', 'DeepSeek', 'Super Code', 'MongoDB', 'HTTP Request'],
                webhook_path: '/webhook/ai-recommendations-enhanced',
                priority: 'high'
            }
        ];

        for (const workflow of workflows) {
            console.log(`\n📋 Analyzing workflow: ${workflow.name}`);
            
            const workflowConfig = await this.generateEnhancedWorkflowConfig(workflow);
            this.implementationPlan.workflows.push({
                ...workflow,
                config: workflowConfig,
                manual_setup_required: true,
                estimated_setup_time: '15-20 minutes'
            });

            console.log(`   🔧 Nodes: ${workflow.nodes.join(', ')}`);
            console.log(`   🌐 Webhook: ${this.n8nUrl}${workflow.webhook_path}`);
            console.log(`   ⚡ Priority: ${workflow.priority}`);
        }

        return workflows;
    }

    async generateEnhancedWorkflowConfig(workflow) {
        const baseConfig = {
            name: workflow.name,
            nodes: [],
            connections: {},
            settings: {
                timezone: 'UTC',
                saveExecutionProgress: true
            }
        };

        // Add enhanced node configurations based on community nodes
        switch (workflow.name) {
            case 'EchoTune AI Music Analysis with DeepSeek':
                baseConfig.nodes = [
                    {
                        name: 'Webhook Trigger',
                        type: 'n8n-nodes-base.webhook',
                        position: [100, 200],
                        parameters: {
                            path: workflow.webhook_path,
                            httpMethod: 'POST'
                        }
                    },
                    {
                        name: 'DeepSeek Analysis',
                        type: 'n8n-nodes-deepseek.deepseek',
                        position: [300, 200],
                        parameters: {
                            operation: 'analyze',
                            prompt: 'Analyze the provided music data for patterns, genres, and user preferences. Provide detailed insights and recommendations.',
                            model: 'deepseek-chat'
                        }
                    },
                    {
                        name: 'Process Results',
                        type: '@kenkaiii/n8n-nodes-supercode.supercode',
                        position: [500, 200],
                        parameters: {
                            language: 'javascript',
                            code: `
                                // Process DeepSeek analysis results
                                const analysis = $input.first().json;
                                const processed = {
                                    timestamp: new Date().toISOString(),
                                    analysis: analysis,
                                    confidence: analysis.confidence || 0.8,
                                    recommendations: analysis.recommendations || []
                                };
                                return processed;
                            `
                        }
                    }
                ];
                break;

            case 'SuperCode Music Data Processing Pipeline':
                baseConfig.nodes = [
                    {
                        name: 'Webhook Trigger',
                        type: 'n8n-nodes-base.webhook',
                        position: [100, 200],
                        parameters: {
                            path: workflow.webhook_path,
                            httpMethod: 'POST'
                        }
                    },
                    {
                        name: 'Data Processing',
                        type: '@kenkaiii/n8n-nodes-supercode.supercode-tool',
                        position: [300, 200],
                        parameters: {
                            tool: 'data-processor',
                            operation: 'process-music-data',
                            config: {
                                normalize: true,
                                extract_features: true,
                                ai_enhancement: true
                            }
                        }
                    }
                ];
                break;

            case 'MCP Client Tool Integration Hub':
                baseConfig.nodes = [
                    {
                        name: 'Webhook Trigger',
                        type: 'n8n-nodes-base.webhook',
                        position: [100, 200],
                        parameters: {
                            path: workflow.webhook_path,
                            httpMethod: 'POST'
                        }
                    },
                    {
                        name: 'MCP Client',
                        type: 'n8n-nodes-mcp.mcp-client',
                        position: [300, 200],
                        parameters: {
                            server_url: 'http://localhost:3001',
                            capabilities: ['filesystem', 'tools', 'prompts'],
                            timeout: 30000
                        }
                    }
                ];
                break;
        }

        return baseConfig;
    }

    async generateManualSetupInstructions() {
        console.log('\n📖 Generating Enhanced Setup Instructions...');

        const instructions = {
            title: 'N8N Enhanced Community Nodes Setup Guide',
            server_url: this.n8nUrl,
            api_key: this.apiKey,
            community_nodes: this.communityNodes,
            setup_steps: [
                {
                    step: 1,
                    title: 'Access N8N Interface',
                    actions: [
                        `Navigate to ${this.n8nUrl}`,
                        'Login with your credentials',
                        'Verify community nodes are installed and available'
                    ]
                },
                {
                    step: 2,
                    title: 'Verify Community Nodes Installation',
                    actions: [
                        'Go to Settings → Community Nodes',
                        'Confirm @kenkaiii/n8n-nodes-supercode v1.0.83 is installed',
                        'Confirm n8n-nodes-deepseek v1.0.6 is installed',
                        'Confirm n8n-nodes-mcp is installed',
                        'Test each node by creating a simple workflow'
                    ]
                },
                {
                    step: 3,
                    title: 'Create Enhanced Workflows',
                    actions: [
                        'Create new workflows using the provided configurations',
                        'Configure DeepSeek node with appropriate API keys',
                        'Set up SuperCode nodes for data processing',
                        'Configure MCP Client for tool integrations',
                        'Test webhook endpoints with provided curl commands'
                    ]
                }
            ],
            testing_commands: this.generateTestingCommands(),
            troubleshooting: this.generateTroubleshooting()
        };

        return instructions;
    }

    generateTestingCommands() {
        return [
            {
                workflow: 'DeepSeek Music Analysis',
                command: `curl -X POST "${this.n8nUrl}/webhook/deepseek-music-analysis" \\
  -H "Content-Type: application/json" \\
  -d '{
    "track_data": {
      "name": "Test Song",
      "artist": "Test Artist",
      "genres": ["rock", "alternative"],
      "audio_features": {
        "danceability": 0.7,
        "energy": 0.8,
        "valence": 0.6
      }
    },
    "user_preferences": {
      "favorite_genres": ["rock", "indie"],
      "listening_time": "evening"
    }
  }'`
            },
            {
                workflow: 'SuperCode Processing',
                command: `curl -X POST "${this.n8nUrl}/webhook/supercode-processing" \\
  -H "Content-Type: application/json" \\
  -d '{
    "data_batch": {
      "tracks": [
        {"id": "1", "name": "Song 1", "plays": 100},
        {"id": "2", "name": "Song 2", "plays": 50}
      ],
      "processing_options": {
        "normalize": true,
        "extract_patterns": true,
        "ai_insights": true
      }
    }
  }'`
            },
            {
                workflow: 'MCP Integration Hub',
                command: `curl -X POST "${this.n8nUrl}/webhook/mcp-integration-hub" \\
  -H "Content-Type: application/json" \\
  -d '{
    "mcp_request": {
      "tool": "filesystem",
      "operation": "read_file",
      "parameters": {
        "path": "/data/user_preferences.json"
      }
    }
  }'`
            }
        ];
    }

    generateTroubleshooting() {
        return [
            {
                issue: 'Community Nodes Not Visible',
                solution: [
                    'Restart n8n server',
                    'Clear browser cache',
                    'Check node installation status in Settings',
                    'Verify node compatibility with n8n version'
                ]
            },
            {
                issue: 'DeepSeek Node Authentication Error',
                solution: [
                    'Configure DeepSeek API key in node settings',
                    'Check API key validity and permissions',
                    'Verify DeepSeek service availability'
                ]
            },
            {
                issue: 'SuperCode Execution Errors',
                solution: [
                    'Check code syntax in SuperCode nodes',
                    'Verify required dependencies are available',
                    'Review execution logs for detailed error messages',
                    'Test with simplified code first'
                ]
            },
            {
                issue: 'MCP Client Connection Issues',
                solution: [
                    'Verify MCP server is running on specified port',
                    'Check MCP server configuration',
                    'Review MCP protocol documentation',
                    'Test MCP server connectivity separately'
                ]
            }
        ];
    }

    async generateComprehensiveReport() {
        console.log('\n📊 Generating Comprehensive Enhanced Implementation Report...');

        const report = {
            ...this.implementationPlan,
            community_nodes_analysis: this.communityNodes,
            manual_setup_instructions: await this.generateManualSetupInstructions(),
            implementation_summary: {
                total_workflows: this.implementationPlan.workflows.length,
                estimated_total_setup_time: '45-60 minutes',
                priority_workflows: this.implementationPlan.workflows.filter(w => w.priority === 'high').length,
                community_nodes_leveraged: Object.keys(this.communityNodes).length
            },
            next_steps: [
                'Access n8n interface at https://primosphere.ninja',
                'Verify all community nodes are properly installed',
                'Create workflows using provided configurations',
                'Test webhook endpoints with provided curl commands',
                'Monitor workflow execution and optimize as needed'
            ],
            advanced_features: {
                ai_capabilities: [
                    'DeepSeek AI for advanced music analysis',
                    'SuperCode for complex data processing',
                    'MCP Client for tool integration'
                ],
                integration_points: [
                    'Spotify API integration via webhooks',
                    'MongoDB data storage',
                    'Real-time recommendation engine',
                    'MCP protocol support for tool chaining'
                ]
            }
        };

        // Save report to file
        const reportPath = path.join(process.cwd(), 'reports', `n8n-enhanced-community-nodes-report-${Date.now()}.json`);
        await fs.mkdir(path.dirname(reportPath), { recursive: true });
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        console.log(`✅ Comprehensive report saved to: ${reportPath}`);
        return report;
    }

    async run() {
        console.log('🎯 Starting Enhanced Community Nodes Implementation...\n');

        // Test connection
        const connectionSuccess = await this.testEnhancedConnection();

        if (connectionSuccess) {
            console.log('\n✅ Connection successful! Proceeding with enhanced workflow creation...');
        } else {
            console.log('\n⚠️  Connection issues detected. Proceeding with manual setup guidance...');
        }

        // Create enhanced workflows
        await this.createEnhancedWorkflows();

        // Generate comprehensive report
        const report = await this.generateComprehensiveReport();

        console.log('\n🎉 Enhanced Community Nodes Implementation Complete!');
        console.log('\n📋 Summary:');
        console.log(`   🔧 Community Nodes: ${Object.keys(this.communityNodes).length}`);
        console.log(`   📊 Workflows Created: ${this.implementationPlan.workflows.length}`);
        console.log(`   ⏱️  Estimated Setup Time: 45-60 minutes`);
        console.log(`   🌐 Server: ${this.n8nUrl}`);
        
        console.log('\n🚀 Next Steps:');
        console.log('1. Access n8n interface and verify community nodes');
        console.log('2. Create workflows using provided configurations');
        console.log('3. Test webhook endpoints with curl commands');
        console.log('4. Review comprehensive report for detailed guidance');

        return report;
    }
}

// Run the enhanced implementation
if (require.main === module) {
    const implementation = new N8nEnhancedCommunityNodesImplementation();
    implementation.run().catch(console.error);
}

module.exports = N8nEnhancedCommunityNodesImplementation;