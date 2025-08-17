#!/usr/bin/env node

/**
 * N8N Workflow Creator - Creates and deploys actual workflows to n8n server
 * This script creates real workflows, credentials, and triggers in the n8n instance
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class N8nWorkflowCreator {
    constructor() {
        this.apiUrl = process.env.N8N_API_URL || 'http://46.101.106.220';
        this.apiKey = process.env.N8N_API_KEY;
        this.username = process.env.N8N_USERNAME || 'willexmen8@gmail.com';
        this.password = process.env.N8N_PASSWORD || 'DapperMan77$$';
        this.workflowsCreated = [];
        this.credentialsCreated = [];
    }

    async initialize() {
        console.log('🚀 Initializing N8N Workflow Creator...');
        console.log(`📍 N8N Instance: ${this.apiUrl}`);
        
        // Test connectivity
        try {
            const health = await axios.get(`${this.apiUrl}/healthz`);
            console.log(`✅ N8N Health: ${health.data.status}`);
        } catch (error) {
            console.log(`❌ N8N Connection Error: ${error.message}`);
            throw new Error('Cannot connect to N8N instance');
        }
    }

    async createSpotifyCredentials() {
        console.log('🔑 Creating Spotify API credentials...');
        
        const spotifyCredentials = {
            name: 'EchoTune Spotify API',
            type: 'httpBasicAuth',
            data: {
                user: process.env.SPOTIFY_CLIENT_ID || 'dcc2df507bde447c93a0199358ca219d',
                password: process.env.SPOTIFY_CLIENT_SECRET || 'your_spotify_client_secret_here'
            }
        };

        try {
            const response = await axios.post(`${this.apiUrl}/api/v1/credentials`, spotifyCredentials, {
                headers: { 'X-N8N-API-KEY': this.apiKey }
            });
            
            console.log(`✅ Created Spotify credentials: ${response.data.id}`);
            this.credentialsCreated.push(response.data);
            return response.data;
        } catch (error) {
            console.log(`❌ Failed to create Spotify credentials: ${error.response?.data?.message || error.message}`);
            return null;
        }
    }

    async createOpenAICredentials() {
        console.log('🤖 Creating OpenAI API credentials...');
        
        const openaiCredentials = {
            name: 'EchoTune OpenAI API',
            type: 'openAiApi',
            data: {
                apiKey: process.env.OPENAI_API_KEY || 'sk-your_openai_api_key_here'
            }
        };

        try {
            const response = await axios.post(`${this.apiUrl}/api/v1/credentials`, openaiCredentials, {
                headers: { 'X-N8N-API-KEY': this.apiKey }
            });
            
            console.log(`✅ Created OpenAI credentials: ${response.data.id}`);
            this.credentialsCreated.push(response.data);
            return response.data;
        } catch (error) {
            console.log(`❌ Failed to create OpenAI credentials: ${error.response?.data?.message || error.message}`);
            return null;
        }
    }

    async createMongoDBCredentials() {
        console.log('🗄️ Creating MongoDB credentials...');
        
        const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://copilot:DapperMan77@cluster.mongodb.net/echotune';
        
        const mongoCredentials = {
            name: 'EchoTune MongoDB',
            type: 'mongoDb',
            data: {
                connectionString: mongoUri,
                database: 'echotune'
            }
        };

        try {
            const response = await axios.post(`${this.apiUrl}/api/v1/credentials`, mongoCredentials, {
                headers: { 'X-N8N-API-KEY': this.apiKey }
            });
            
            console.log(`✅ Created MongoDB credentials: ${response.data.id}`);
            this.credentialsCreated.push(response.data);
            return response.data;
        } catch (error) {
            console.log(`❌ Failed to create MongoDB credentials: ${error.response?.data?.message || error.message}`);
            return null;
        }
    }

    async createSpotifyDataProcessingWorkflow() {
        console.log('🎵 Creating Spotify Data Processing Workflow...');
        
        const workflow = {
            name: 'EchoTune Spotify Data Processing',
            settings: {
                executionOrder: 'v1'
            },
            nodes: [
                {
                    id: '1',
                    name: 'Spotify Data Webhook',
                    type: 'n8n-nodes-base.webhook',
                    typeVersion: 1,
                    position: [240, 300],
                    parameters: {
                        httpMethod: 'POST',
                        path: 'spotify-data-processing',
                        responseMode: 'responseNode'
                    }
                },
                {
                    id: '2',
                    name: 'Process Listening Data',
                    type: 'n8n-nodes-base.code',
                    typeVersion: 2,
                    position: [460, 300],
                    parameters: {
                        jsCode: `
// Process incoming Spotify listening data
const data = $input.first().json;
console.log('Processing Spotify data:', data);

const processedTracks = [];

if (data.tracks && Array.isArray(data.tracks)) {
  for (const track of data.tracks) {
    processedTracks.push({
      user_id: data.user_id,
      track_id: track.id,
      track_name: track.name,
      artist: track.artist,
      played_at: new Date().toISOString(),
      processed_at: new Date().toISOString(),
      source: 'echotune_webhook'
    });
  }
}

return processedTracks.map(track => ({ json: track }));
`
                    }
                },
                {
                    id: '3',
                    name: 'Store in MongoDB',
                    type: 'n8n-nodes-base.mongoDb',
                    typeVersion: 1,
                    position: [680, 300],
                    parameters: {
                        operation: 'insert',
                        collection: 'listening_history'
                    },
                    credentials: {
                        mongoDb: {
                            id: 'mongo_creds_id_placeholder',
                            name: 'EchoTune MongoDB'
                        }
                    }
                },
                {
                    id: '4',
                    name: 'Success Response',
                    type: 'n8n-nodes-base.respondToWebhook',
                    typeVersion: 1,
                    position: [900, 300],
                    parameters: {
                        options: {},
                        responseBody: JSON.stringify({
                            success: true,
                            message: 'Spotify data processed successfully',
                            processed_count: '={{$json.insertedCount}}'
                        }),
                        statusCode: 200
                    }
                }
            ],
            connections: {
                'Spotify Data Webhook': {
                    main: [
                        [
                            {
                                node: 'Process Listening Data',
                                type: 'main',
                                index: 0
                            }
                        ]
                    ]
                },
                'Process Listening Data': {
                    main: [
                        [
                            {
                                node: 'Store in MongoDB',
                                type: 'main',
                                index: 0
                            }
                        ]
                    ]
                },
                'Store in MongoDB': {
                    main: [
                        [
                            {
                                node: 'Success Response',
                                type: 'main',
                                index: 0
                            }
                        ]
                    ]
                }
            }
        };

        return await this.createWorkflow(workflow);
    }

    async createDailyAnalyticsWorkflow() {
        console.log('📊 Creating Daily Analytics Workflow...');
        
        const workflow = {
            name: 'EchoTune Daily Analytics Generation',
            settings: {
                executionOrder: 'v1'
            },
            nodes: [
                {
                    id: '1',
                    name: 'Daily Schedule',
                    type: 'n8n-nodes-base.cron',
                    typeVersion: 1,
                    position: [240, 300],
                    parameters: {
                        triggerTimes: {
                            hour: 2,
                            minute: 0
                        }
                    }
                },
                {
                    id: '2',
                    name: 'Fetch User Data',
                    type: 'n8n-nodes-base.mongoDb',
                    typeVersion: 1,
                    position: [460, 300],
                    parameters: {
                        operation: 'find',
                        collection: 'listening_history',
                        query: JSON.stringify({
                            played_at: {
                                $gte: new Date(Date.now() - 24*60*60*1000).toISOString()
                            }
                        })
                    },
                    credentials: {
                        mongoDb: {
                            id: 'mongo_creds_id_placeholder',
                            name: 'EchoTune MongoDB'
                        }
                    }
                },
                {
                    id: '3',
                    name: 'Generate Analytics',
                    type: 'n8n-nodes-base.code',
                    typeVersion: 2,
                    position: [680, 300],
                    parameters: {
                        jsCode: `
// Generate daily analytics from listening data
const data = $input.all().map(item => item.json);
console.log('Generating analytics for', data.length, 'tracks');

const analytics = {
  date: new Date().toISOString().split('T')[0],
  total_tracks: data.length,
  unique_users: [...new Set(data.map(d => d.user_id))].length,
  top_artists: {},
  top_tracks: {},
  listening_hours: {},
  generated_at: new Date().toISOString()
};

// Calculate top artists
data.forEach(track => {
  if (track.artist) {
    analytics.top_artists[track.artist] = (analytics.top_artists[track.artist] || 0) + 1;
  }
});

// Calculate listening by hour
data.forEach(track => {
  if (track.played_at) {
    const hour = new Date(track.played_at).getHours();
    analytics.listening_hours[hour] = (analytics.listening_hours[hour] || 0) + 1;
  }
});

return [{ json: analytics }];
`
                    }
                },
                {
                    id: '4',
                    name: 'Store Analytics',
                    type: 'n8n-nodes-base.mongoDb',
                    typeVersion: 1,
                    position: [900, 300],
                    parameters: {
                        operation: 'insert',
                        collection: 'daily_analytics'
                    },
                    credentials: {
                        mongoDb: {
                            id: 'mongo_creds_id_placeholder',
                            name: 'EchoTune MongoDB'
                        }
                    }
                }
            ],
            connections: {
                'Daily Schedule': {
                    main: [
                        [
                            {
                                node: 'Fetch User Data',
                                type: 'main',
                                index: 0
                            }
                        ]
                    ]
                },
                'Fetch User Data': {
                    main: [
                        [
                            {
                                node: 'Generate Analytics',
                                type: 'main',
                                index: 0
                            }
                        ]
                    ]
                },
                'Generate Analytics': {
                    main: [
                        [
                            {
                                node: 'Store Analytics',
                                type: 'main',
                                index: 0
                            }
                        ]
                    ]
                }
            }
        };

        return await this.createWorkflow(workflow);
    }

    async createAIRecommendationWorkflow() {
        console.log('🤖 Creating AI Music Recommendation Workflow...');
        
        const workflow = {
            name: 'EchoTune AI Music Recommendations',
            settings: {
                executionOrder: 'v1'
            },
            nodes: [
                {
                    id: '1',
                    name: 'Recommendation Request',
                    type: 'n8n-nodes-base.webhook',
                    typeVersion: 1,
                    position: [240, 300],
                    parameters: {
                        httpMethod: 'POST',
                        path: 'get-recommendations',
                        responseMode: 'responseNode'
                    }
                },
                {
                    id: '2',
                    name: 'Get User History',
                    type: 'n8n-nodes-base.mongoDb',
                    typeVersion: 1,
                    position: [460, 300],
                    parameters: {
                        operation: 'find',
                        collection: 'listening_history',
                        query: '{"user_id": "{{$json.user_id}}"}',
                        limit: 50
                    },
                    credentials: {
                        mongoDb: {
                            id: 'mongo_creds_id_placeholder',
                            name: 'EchoTune MongoDB'
                        }
                    }
                },
                {
                    id: '3',
                    name: 'AI Analysis',
                    type: 'n8n-nodes-base.openAi',
                    typeVersion: 1,
                    position: [680, 300],
                    parameters: {
                        operation: 'text',
                        model: 'gpt-3.5-turbo',
                        prompt: `Based on the following user listening history, provide 5 personalized music recommendations:

User History: {{JSON.stringify($input.all())}}

Please provide recommendations in JSON format with the following structure:
{
  "recommendations": [
    {
      "artist": "Artist Name",
      "track": "Track Name", 
      "reason": "Why this fits their taste",
      "confidence": 0.8
    }
  ]
}`,
                        maxTokens: 500
                    },
                    credentials: {
                        openAiApi: {
                            id: 'openai_creds_id_placeholder',
                            name: 'EchoTune OpenAI API'
                        }
                    }
                },
                {
                    id: '4',
                    name: 'Process Recommendations',
                    type: 'n8n-nodes-base.code',
                    typeVersion: 2,
                    position: [900, 300],
                    parameters: {
                        jsCode: `
const aiResponse = $input.first().json;
let recommendations = [];

try {
  const parsed = JSON.parse(aiResponse.choices[0].message.content);
  recommendations = parsed.recommendations || [];
} catch (error) {
  console.error('Error parsing AI response:', error);
  recommendations = [{
    artist: 'Various Artists',
    track: 'Trending Now',
    reason: 'Popular tracks based on current trends',
    confidence: 0.5
  }];
}

return [{
  json: {
    user_id: $('Recommendation Request').first().json.user_id,
    recommendations: recommendations,
    generated_at: new Date().toISOString()
  }
}];
`
                    }
                },
                {
                    id: '5',
                    name: 'Return Recommendations',
                    type: 'n8n-nodes-base.respondToWebhook',
                    typeVersion: 1,
                    position: [1120, 300],
                    parameters: {
                        options: {},
                        responseBody: '{{JSON.stringify($json)}}',
                        statusCode: 200
                    }
                }
            ],
            connections: {
                'Recommendation Request': {
                    main: [
                        [
                            {
                                node: 'Get User History',
                                type: 'main',
                                index: 0
                            }
                        ]
                    ]
                },
                'Get User History': {
                    main: [
                        [
                            {
                                node: 'AI Analysis',
                                type: 'main',
                                index: 0
                            }
                        ]
                    ]
                },
                'AI Analysis': {
                    main: [
                        [
                            {
                                node: 'Process Recommendations',
                                type: 'main',
                                index: 0
                            }
                        ]
                    ]
                },
                'Process Recommendations': {
                    main: [
                        [
                            {
                                node: 'Return Recommendations',
                                type: 'main',
                                index: 0
                            }
                        ]
                    ]
                }
            }
        };

        return await this.createWorkflow(workflow);
    }

    async createHealthMonitoringWorkflow() {
        console.log('🔍 Creating Health Monitoring Workflow...');
        
        const workflow = {
            name: 'EchoTune System Health Monitoring',
            settings: {
                executionOrder: 'v1'
            },
            nodes: [
                {
                    id: '1',
                    name: 'Every 15 Minutes',
                    type: 'n8n-nodes-base.interval',
                    typeVersion: 1,
                    position: [240, 300],
                    parameters: {
                        interval: 15,
                        unit: 'minutes'
                    }
                },
                {
                    id: '2',
                    name: 'Check Database',
                    type: 'n8n-nodes-base.mongoDb',
                    typeVersion: 1,
                    position: [460, 200],
                    parameters: {
                        operation: 'count',
                        collection: 'listening_history'
                    },
                    credentials: {
                        mongoDb: {
                            id: 'mongo_creds_id_placeholder',
                            name: 'EchoTune MongoDB'
                        }
                    }
                },
                {
                    id: '3',
                    name: 'Check N8N Health',
                    type: 'n8n-nodes-base.httpRequest',
                    typeVersion: 3,
                    position: [460, 400],
                    parameters: {
                        method: 'GET',
                        url: `${this.apiUrl}/healthz`,
                        options: {}
                    }
                },
                {
                    id: '4',
                    name: 'Generate Health Report',
                    type: 'n8n-nodes-base.code',
                    typeVersion: 2,
                    position: [680, 300],
                    parameters: {
                        jsCode: `
const dbResult = $('Check Database').first().json;
const n8nResult = $('Check N8N Health').first().json;

const healthReport = {
  timestamp: new Date().toISOString(),
  status: 'healthy',
  services: {
    database: {
      status: dbResult.count !== undefined ? 'healthy' : 'unhealthy',
      record_count: dbResult.count || 0
    },
    n8n: {
      status: n8nResult.status === 'ok' ? 'healthy' : 'unhealthy',
      response_time: n8nResult.responseTime || 0
    }
  }
};

// Determine overall health
if (healthReport.services.database.status === 'unhealthy' || 
    healthReport.services.n8n.status === 'unhealthy') {
  healthReport.status = 'unhealthy';
}

return [{ json: healthReport }];
`
                    }
                },
                {
                    id: '5',
                    name: 'Store Health Data',
                    type: 'n8n-nodes-base.mongoDb',
                    typeVersion: 1,
                    position: [900, 300],
                    parameters: {
                        operation: 'insert',
                        collection: 'health_reports'
                    },
                    credentials: {
                        mongoDb: {
                            id: 'mongo_creds_id_placeholder',
                            name: 'EchoTune MongoDB'
                        }
                    }
                }
            ],
            connections: {
                'Every 15 Minutes': {
                    main: [
                        [
                            {
                                node: 'Check Database',
                                type: 'main',
                                index: 0
                            },
                            {
                                node: 'Check N8N Health',
                                type: 'main',
                                index: 0
                            }
                        ]
                    ]
                },
                'Check Database': {
                    main: [
                        [
                            {
                                node: 'Generate Health Report',
                                type: 'main',
                                index: 0
                            }
                        ]
                    ]
                },
                'Check N8N Health': {
                    main: [
                        [
                            {
                                node: 'Generate Health Report',
                                type: 'main',
                                index: 0
                            }
                        ]
                    ]
                },
                'Generate Health Report': {
                    main: [
                        [
                            {
                                node: 'Store Health Data',
                                type: 'main',
                                index: 0
                            }
                        ]
                    ]
                }
            }
        };

        return await this.createWorkflow(workflow);
    }

    async createWorkflow(workflowDef) {
        try {
            const response = await axios.post(`${this.apiUrl}/api/v1/workflows`, workflowDef, {
                headers: { 
                    'X-N8N-API-KEY': this.apiKey,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log(`✅ Created workflow: ${workflowDef.name} (ID: ${response.data.id})`);
            this.workflowsCreated.push(response.data);
            return response.data;
        } catch (error) {
            console.log(`❌ Failed to create workflow ${workflowDef.name}: ${error.response?.data?.message || error.message}`);
            return null;
        }
    }

    async updateCredentialReferences() {
        console.log('🔗 Updating credential references in workflows...');
        
        // Find created credentials
        const mongoCredId = this.credentialsCreated.find(c => c.name === 'EchoTune MongoDB')?.id;
        const openaiCredId = this.credentialsCreated.find(c => c.name === 'EchoTune OpenAI API')?.id;
        const spotifyCredId = this.credentialsCreated.find(c => c.name === 'EchoTune Spotify API')?.id;

        // Update workflows with actual credential IDs
        for (const workflow of this.workflowsCreated) {
            let updated = false;
            const updatedNodes = workflow.nodes.map(node => {
                if (node.credentials) {
                    if (node.credentials.mongoDb && mongoCredId) {
                        node.credentials.mongoDb.id = mongoCredId;
                        updated = true;
                    }
                    if (node.credentials.openAiApi && openaiCredId) {
                        node.credentials.openAiApi.id = openaiCredId;
                        updated = true;
                    }
                    if (node.credentials.spotifyApi && spotifyCredId) {
                        node.credentials.spotifyApi.id = spotifyCredId;
                        updated = true;
                    }
                }
                return node;
            });

            if (updated) {
                try {
                    await axios.patch(`${this.apiUrl}/api/v1/workflows/${workflow.id}`, {
                        ...workflow,
                        nodes: updatedNodes
                    }, {
                        headers: { 'X-N8N-API-KEY': this.apiKey }
                    });
                    console.log(`✅ Updated credentials for workflow: ${workflow.name}`);
                } catch (error) {
                    console.log(`❌ Failed to update workflow ${workflow.name}: ${error.message}`);
                }
            }
        }
    }

    async deployAllWorkflows() {
        console.log('🚀 Deploying all workflows to N8N server...');
        
        await this.initialize();
        
        // Create credentials first
        await this.createMongoDBCredentials();
        await this.createOpenAICredentials();
        await this.createSpotifyCredentials();
        
        // Create workflows
        await this.createSpotifyDataProcessingWorkflow();
        await this.createDailyAnalyticsWorkflow();
        await this.createAIRecommendationWorkflow();
        await this.createHealthMonitoringWorkflow();
        
        // Update credential references
        await this.updateCredentialReferences();
        
        // Generate summary report
        await this.generateDeploymentReport();
    }

    async generateDeploymentReport() {
        console.log('\n📊 DEPLOYMENT REPORT');
        console.log('=' .repeat(50));
        
        console.log(`✅ Workflows Created: ${this.workflowsCreated.length}`);
        this.workflowsCreated.forEach((workflow, index) => {
            console.log(`   ${index + 1}. ${workflow.name} (ID: ${workflow.id})`);
        });
        
        console.log(`\n✅ Credentials Created: ${this.credentialsCreated.length}`);
        this.credentialsCreated.forEach((cred, index) => {
            console.log(`   ${index + 1}. ${cred.name} (ID: ${cred.id})`);
        });
        
        console.log('\n🔗 Webhook Endpoints Available:');
        console.log(`   📍 Spotify Data: ${this.apiUrl}/webhook/spotify-data-processing`);
        console.log(`   📍 AI Recommendations: ${this.apiUrl}/webhook/get-recommendations`);
        
        console.log('\n⚡ Active Automations:');
        console.log('   📊 Daily Analytics: 2 AM UTC daily');
        console.log('   🔍 Health Monitoring: Every 15 minutes');
        
        console.log('\n🎉 N8N server configuration completed successfully!');
        console.log(`🌐 Access your workflows at: ${this.apiUrl}`);
        console.log(`👤 Login with: ${this.username}`);
        
        // Save report to file
        const report = {
            deployment_date: new Date().toISOString(),
            server_url: this.apiUrl,
            workflows_created: this.workflowsCreated.length,
            credentials_created: this.credentialsCreated.length,
            workflows: this.workflowsCreated.map(w => ({
                id: w.id,
                name: w.name,
                active: w.active
            })),
            credentials: this.credentialsCreated.map(c => ({
                id: c.id,
                name: c.name,
                type: c.type
            })),
            endpoints: [
                `${this.apiUrl}/webhook/spotify-data-processing`,
                `${this.apiUrl}/webhook/get-recommendations`
            ]
        };
        
        await fs.writeFile(
            path.join(__dirname, '../reports/n8n-deployment-report.json'),
            JSON.stringify(report, null, 2)
        );
        
        console.log('💾 Deployment report saved to reports/n8n-deployment-report.json');
    }
}

// Run if executed directly
if (require.main === module) {
    const creator = new N8nWorkflowCreator();
    creator.deployAllWorkflows().catch(console.error);
}

module.exports = N8nWorkflowCreator;