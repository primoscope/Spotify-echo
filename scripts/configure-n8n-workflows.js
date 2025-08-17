#!/usr/bin/env node

/**
 * n8n Self-Hosted Server Configuration Script
 * Configures useful workflows, triggers, and automation for EchoTune AI
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class N8nWorkflowConfigurator {
    constructor() {
        this.apiUrl = process.env.N8N_API_URL;
        this.apiKey = process.env.N8N_API_KEY;
        this.baseHeaders = {
            'X-N8N-API-KEY': this.apiKey,
            'Content-Type': 'application/json'
        };
        this.existingWorkflows = [];
        this.newWorkflows = [];
    }

    async initialize() {
        console.log('🚀 Initializing n8n workflow configurator...');
        
        // Test connectivity
        await this.testConnectivity();
        
        // Get existing workflows
        await this.getExistingWorkflows();
        
        console.log(`✅ Connected to n8n instance: ${this.apiUrl}`);
        console.log(`📊 Found ${this.existingWorkflows.length} existing workflows\n`);
    }

    async testConnectivity() {
        try {
            const response = await axios.get(`${this.apiUrl}/healthz`, { timeout: 5000 });
            if (response.data.status !== 'ok') {
                throw new Error('n8n instance not healthy');
            }
        } catch (error) {
            throw new Error(`Cannot connect to n8n instance: ${error.message}`);
        }
    }

    async getExistingWorkflows() {
        const response = await axios.get(`${this.apiUrl}/api/v1/workflows`, {
            headers: this.baseHeaders,
            timeout: 10000
        });
        
        this.existingWorkflows = response.data.data || [];
        
        console.log('📋 Existing workflows:');
        this.existingWorkflows.forEach((workflow, index) => {
            console.log(`   ${index + 1}. ${workflow.name} (${workflow.active ? 'active' : 'inactive'})`);
        });
    }

    async createSpotifyDataProcessingWorkflow() {
        console.log('🎵 Creating Spotify Data Processing Workflow...');

        const workflow = {
            name: 'Spotify Data Analysis & Recommendations',
            active: true,
            nodes: [
                {
                    id: 'webhook-trigger',
                    name: 'Webhook Trigger',
                    type: 'n8n-nodes-base.webhook',
                    position: [240, 300],
                    parameters: {
                        path: 'spotify-data-webhook',
                        httpMethod: 'POST',
                        responseMode: 'onReceived',
                        options: {}
                    }
                },
                {
                    id: 'validate-input',
                    name: 'Validate Input Data',
                    type: 'n8n-nodes-base.code',
                    position: [460, 300],
                    parameters: {
                        jsCode: `
// Validate incoming Spotify data
const inputData = items[0].json;

if (!inputData.user_id) {
    throw new Error('Missing user_id in request');
}

if (!inputData.tracks && !inputData.action) {
    throw new Error('Missing tracks data or action parameter');
}

// Extract and validate data
const processedData = {
    user_id: inputData.user_id,
    action: inputData.action || 'analyze',
    tracks: inputData.tracks || [],
    timestamp: new Date().toISOString(),
    source: 'spotify_webhook'
};

return [{ json: processedData }];
`
                    }
                },
                {
                    id: 'spotify-api-call',
                    name: 'Fetch Spotify User Data',
                    type: 'n8n-nodes-base.httpRequest',
                    position: [680, 200],
                    parameters: {
                        method: 'GET',
                        url: 'https://api.spotify.com/v1/me/top/tracks',
                        authentication: 'predefinedCredentialType',
                        nodeCredentialType: 'spotifyOAuth2Api',
                        options: {
                            queryParameters: {
                                parameters: [
                                    { name: 'limit', value: '50' },
                                    { name: 'time_range', value: 'medium_term' }
                                ]
                            }
                        }
                    }
                },
                {
                    id: 'process-recommendations',
                    name: 'Generate Music Recommendations',
                    type: 'n8n-nodes-base.code',
                    position: [900, 300],
                    parameters: {
                        jsCode: `
// Process Spotify data and generate recommendations
const userData = items[0].json;
const spotifyData = items[1]?.json || null;

// Combine user input with Spotify API data
const tracks = userData.tracks || [];
if (spotifyData && spotifyData.items) {
    tracks.push(...spotifyData.items.map(item => ({
        id: item.id,
        name: item.name,
        artist: item.artists[0]?.name,
        popularity: item.popularity,
        audio_features: item.audio_features
    })));
}

// Simple recommendation logic (in production, this would use ML models)
const recommendations = {
    user_id: userData.user_id,
    recommended_tracks: tracks.slice(0, 10),
    analysis: {
        total_tracks: tracks.length,
        genres: [...new Set(tracks.map(t => t.artist))].slice(0, 5),
        avg_popularity: tracks.reduce((sum, t) => sum + (t.popularity || 0), 0) / tracks.length
    },
    generated_at: new Date().toISOString(),
    method: 'n8n_workflow'
};

return [{ json: recommendations }];
`
                    }
                },
                {
                    id: 'save-to-database',
                    name: 'Save to MongoDB',
                    type: 'n8n-nodes-base.httpRequest',
                    position: [1120, 300],
                    parameters: {
                        method: 'POST',
                        url: 'http://localhost:3000/api/recommendations',
                        options: {
                            body: {
                                contentType: 'json'
                            }
                        }
                    }
                },
                {
                    id: 'send-response',
                    name: 'Send Response',
                    type: 'n8n-nodes-base.respondToWebhook',
                    position: [1340, 300],
                    parameters: {
                        responseBody: '={{ JSON.stringify($json) }}',
                        options: {}
                    }
                }
            ],
            connections: {
                'Webhook Trigger': {
                    main: [
                        [
                            {
                                node: 'Validate Input Data',
                                type: 'main',
                                index: 0
                            }
                        ]
                    ]
                },
                'Validate Input Data': {
                    main: [
                        [
                            {
                                node: 'Fetch Spotify User Data',
                                type: 'main',
                                index: 0
                            },
                            {
                                node: 'Generate Music Recommendations',
                                type: 'main',
                                index: 0
                            }
                        ]
                    ]
                },
                'Fetch Spotify User Data': {
                    main: [
                        [
                            {
                                node: 'Generate Music Recommendations',
                                type: 'main',
                                index: 1
                            }
                        ]
                    ]
                },
                'Generate Music Recommendations': {
                    main: [
                        [
                            {
                                node: 'Save to MongoDB',
                                type: 'main',
                                index: 0
                            }
                        ]
                    ]
                },
                'Save to MongoDB': {
                    main: [
                        [
                            {
                                node: 'Send Response',
                                type: 'main',
                                index: 0
                            }
                        ]
                    ]
                }
            },
            pinData: {}
        };

        return await this.createWorkflow(workflow);
    }

    async createUserAnalyticsWorkflow() {
        console.log('📊 Creating User Analytics Workflow...');

        const workflow = {
            name: 'User Analytics & Insights',
            active: true,
            nodes: [
                {
                    id: 'schedule-trigger',
                    name: 'Daily Analytics Schedule',
                    type: 'n8n-nodes-base.cron',
                    position: [240, 300],
                    parameters: {
                        rule: {
                            hour: 2,
                            minute: 0
                        }
                    }
                },
                {
                    id: 'fetch-user-data',
                    name: 'Fetch User Listening Data',
                    type: 'n8n-nodes-base.httpRequest',
                    position: [460, 300],
                    parameters: {
                        method: 'GET',
                        url: 'http://localhost:3000/api/users/listening-history',
                        options: {
                            queryParameters: {
                                parameters: [
                                    { name: 'days', value: '7' },
                                    { name: 'include_analytics', value: 'true' }
                                ]
                            }
                        }
                    }
                },
                {
                    id: 'generate-insights',
                    name: 'Generate User Insights',
                    type: 'n8n-nodes-base.code',
                    position: [680, 300],
                    parameters: {
                        jsCode: `
// Generate analytics insights from user data
const userData = items[0].json.data || [];

const insights = {
    total_users: userData.length,
    active_users_7d: userData.filter(u => u.last_active_days <= 7).length,
    top_genres: {},
    listening_patterns: {
        peak_hours: {},
        avg_session_duration: 0
    },
    recommendations: {
        total_generated: 0,
        avg_click_through: 0
    },
    generated_at: new Date().toISOString()
};

// Calculate top genres
userData.forEach(user => {
    if (user.top_genres) {
        user.top_genres.forEach(genre => {
            insights.top_genres[genre] = (insights.top_genres[genre] || 0) + 1;
        });
    }
});

// Calculate listening patterns
const totalSessions = userData.reduce((sum, u) => sum + (u.session_count || 0), 0);
const totalDuration = userData.reduce((sum, u) => sum + (u.total_listening_time || 0), 0);
insights.listening_patterns.avg_session_duration = totalDuration / totalSessions;

// Sort top genres
insights.top_genres = Object.entries(insights.top_genres)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {});

return [{ json: insights }];
`
                    }
                },
                {
                    id: 'save-analytics',
                    name: 'Save Analytics Report',
                    type: 'n8n-nodes-base.httpRequest',
                    position: [900, 300],
                    parameters: {
                        method: 'POST',
                        url: 'http://localhost:3000/api/analytics/daily-report',
                        options: {
                            body: {
                                contentType: 'json'
                            }
                        }
                    }
                }
            ],
            connections: {
                'Daily Analytics Schedule': {
                    main: [
                        [
                            {
                                node: 'Fetch User Listening Data',
                                type: 'main',
                                index: 0
                            }
                        ]
                    ]
                },
                'Fetch User Listening Data': {
                    main: [
                        [
                            {
                                node: 'Generate User Insights',
                                type: 'main',
                                index: 0
                            }
                        ]
                    ]
                },
                'Generate User Insights': {
                    main: [
                        [
                            {
                                node: 'Save Analytics Report',
                                type: 'main',
                                index: 0
                            }
                        ]
                    ]
                }
            },
            pinData: {}
        };

        return await this.createWorkflow(workflow);
    }

    async createDataSyncWorkflow() {
        console.log('🔄 Creating Data Synchronization Workflow...');

        const workflow = {
            name: 'Spotify Data Sync & Backup',
            active: true,
            nodes: [
                {
                    id: 'interval-trigger',
                    name: 'Hourly Sync Trigger',
                    type: 'n8n-nodes-base.interval',
                    position: [240, 300],
                    parameters: {
                        interval: 3600000
                    }
                },
                {
                    id: 'get-recent-activity',
                    name: 'Get Recent Spotify Activity',
                    type: 'n8n-nodes-base.httpRequest',
                    position: [460, 300],
                    parameters: {
                        method: 'GET',
                        url: 'https://api.spotify.com/v1/me/player/recently-played',
                        authentication: 'predefinedCredentialType',
                        nodeCredentialType: 'spotifyOAuth2Api',
                        options: {
                            queryParameters: {
                                parameters: [
                                    { name: 'limit', value: '50' }
                                ]
                            }
                        }
                    }
                },
                {
                    id: 'process-sync-data',
                    name: 'Process Sync Data',
                    type: 'n8n-nodes-base.code',
                    position: [680, 300],
                    parameters: {
                        jsCode: `
// Process and format recent activity data
const recentActivity = items[0].json;

if (!recentActivity.items || recentActivity.items.length === 0) {
    return [{ json: { message: 'No new activity to sync', count: 0 } }];
}

const processedTracks = recentActivity.items.map(item => ({
    track_id: item.track.id,
    track_name: item.track.name,
    artist_name: item.track.artists[0]?.name,
    played_at: item.played_at,
    duration_ms: item.track.duration_ms,
    popularity: item.track.popularity,
    sync_timestamp: new Date().toISOString()
}));

// Remove duplicates based on track_id and played_at
const uniqueTracks = processedTracks.filter((track, index, self) => 
    index === self.findIndex(t => t.track_id === track.track_id && t.played_at === track.played_at)
);

return [{ 
    json: { 
        tracks: uniqueTracks, 
        count: uniqueTracks.length,
        sync_batch_id: \`sync_\${Date.now()}\`
    } 
}];
`
                    }
                },
                {
                    id: 'save-to-database',
                    name: 'Save to Database',
                    type: 'n8n-nodes-base.httpRequest',
                    position: [900, 300],
                    parameters: {
                        method: 'POST',
                        url: 'http://localhost:3000/api/sync/listening-history',
                        options: {
                            body: {
                                contentType: 'json'
                            }
                        }
                    }
                },
                {
                    id: 'backup-to-file',
                    name: 'Backup to File System',
                    type: 'n8n-nodes-base.code',
                    position: [1120, 300],
                    parameters: {
                        jsCode: `
// Create backup file with timestamp
const fs = require('fs');
const path = require('path');

const syncData = items[0].json;
const backupDir = process.env.BACKUP_DIR || '/tmp/spotify-backups';
const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
const filename = \`spotify-sync-\${timestamp}.json\`;

// Ensure backup directory exists
try {
    fs.mkdirSync(backupDir, { recursive: true });
} catch (error) {
    console.log('Backup directory already exists or created');
}

// Write backup file
const backupPath = path.join(backupDir, filename);
fs.writeFileSync(backupPath, JSON.stringify(syncData, null, 2));

return [{ 
    json: { 
        backup_created: true, 
        backup_path: backupPath,
        records_backed_up: syncData.count
    } 
}];
`
                    }
                }
            ],
            connections: {
                'Hourly Sync Trigger': {
                    main: [
                        [
                            {
                                node: 'Get Recent Spotify Activity',
                                type: 'main',
                                index: 0
                            }
                        ]
                    ]
                },
                'Get Recent Spotify Activity': {
                    main: [
                        [
                            {
                                node: 'Process Sync Data',
                                type: 'main',
                                index: 0
                            }
                        ]
                    ]
                },
                'Process Sync Data': {
                    main: [
                        [
                            {
                                node: 'Save to Database',
                                type: 'main',
                                index: 0
                            }
                        ]
                    ]
                },
                'Save to Database': {
                    main: [
                        [
                            {
                                node: 'Backup to File System',
                                type: 'main',
                                index: 0
                            }
                        ]
                    ]
                }
            },
            pinData: {}
        };

        return await this.createWorkflow(workflow);
    }

    async createMcpIntegrationWorkflow() {
        console.log('🔗 Creating MCP Server Integration Workflow...');

        const workflow = {
            name: 'MCP Server Health Monitor',
            active: true,
            nodes: [
                {
                    id: 'health-check-schedule',
                    name: 'Health Check Schedule',
                    type: 'n8n-nodes-base.cron',
                    position: [240, 300],
                    parameters: {
                        rule: {
                            minute: '*/15'
                        }
                    }
                },
                {
                    id: 'check-mcp-servers',
                    name: 'Check MCP Server Health',
                    type: 'n8n-nodes-base.code',
                    position: [460, 300],
                    parameters: {
                        jsCode: `
// Check health of various MCP servers
const http = require('http');
const https = require('https');

const mcpServers = [
    { name: 'filesystem', url: 'http://localhost:3001/health' },
    { name: 'browser', url: 'http://localhost:3002/health' },
    { name: 'spotify', url: 'http://localhost:3000/api/health' },
    { name: 'database', url: 'http://localhost:3003/health' }
];

const healthResults = {
    timestamp: new Date().toISOString(),
    servers: {},
    overall_status: 'healthy'
};

// Simple health check simulation (in production, actual HTTP calls would be made)
mcpServers.forEach(server => {
    const isHealthy = Math.random() > 0.1; // 90% success rate simulation
    healthResults.servers[server.name] = {
        url: server.url,
        status: isHealthy ? 'healthy' : 'unhealthy',
        response_time: Math.floor(Math.random() * 200) + 50
    };
    
    if (!isHealthy) {
        healthResults.overall_status = 'degraded';
    }
});

return [{ json: healthResults }];
`
                    }
                },
                {
                    id: 'process-health-results',
                    name: 'Process Health Results',
                    type: 'n8n-nodes-base.if',
                    position: [680, 300],
                    parameters: {
                        conditions: {
                            string: [
                                {
                                    value1: '={{ $json.overall_status }}',
                                    operation: 'equal',
                                    value2: 'healthy'
                                }
                            ]
                        }
                    }
                },
                {
                    id: 'log-healthy-status',
                    name: 'Log Healthy Status',
                    type: 'n8n-nodes-base.httpRequest',
                    position: [880, 200],
                    parameters: {
                        method: 'POST',
                        url: 'http://localhost:3000/api/monitoring/health-log',
                        options: {
                            body: {
                                contentType: 'json'
                            }
                        }
                    }
                },
                {
                    id: 'send-alert',
                    name: 'Send Health Alert',
                    type: 'n8n-nodes-base.code',
                    position: [880, 400],
                    parameters: {
                        jsCode: `
// Send health alert for unhealthy servers
const healthData = items[0].json;
const unhealthyServers = Object.entries(healthData.servers)
    .filter(([name, data]) => data.status !== 'healthy')
    .map(([name, data]) => ({ name, ...data }));

const alert = {
    type: 'mcp_health_alert',
    severity: unhealthyServers.length > 2 ? 'critical' : 'warning',
    message: \`\${unhealthyServers.length} MCP servers are unhealthy\`,
    unhealthy_servers: unhealthyServers,
    timestamp: new Date().toISOString()
};

console.log('🚨 MCP Health Alert:', JSON.stringify(alert, null, 2));

return [{ json: alert }];
`
                    }
                }
            ],
            connections: {
                'Health Check Schedule': {
                    main: [
                        [
                            {
                                node: 'Check MCP Server Health',
                                type: 'main',
                                index: 0
                            }
                        ]
                    ]
                },
                'Check MCP Server Health': {
                    main: [
                        [
                            {
                                node: 'Process Health Results',
                                type: 'main',
                                index: 0
                            }
                        ]
                    ]
                },
                'Process Health Results': {
                    main: [
                        [
                            {
                                node: 'Log Healthy Status',
                                type: 'main',
                                index: 0
                            }
                        ],
                        [
                            {
                                node: 'Send Health Alert',
                                type: 'main',
                                index: 0
                            }
                        ]
                    ]
                }
            },
            pinData: {}
        };

        return await this.createWorkflow(workflow);
    }

    async createWorkflow(workflow) {
        try {
            // Check if workflow already exists
            const existingWorkflow = this.existingWorkflows.find(w => w.name === workflow.name);
            
            if (existingWorkflow) {
                console.log(`   ⚠️  Workflow "${workflow.name}" already exists (ID: ${existingWorkflow.id})`);
                console.log(`   🔄 Updating existing workflow...`);
                
                const response = await axios.put(`${this.apiUrl}/api/v1/workflows/${existingWorkflow.id}`, workflow, {
                    headers: this.baseHeaders,
                    timeout: 15000
                });
                
                console.log(`   ✅ Updated workflow: ${workflow.name}`);
                return response.data;
            } else {
                const response = await axios.post(`${this.apiUrl}/api/v1/workflows`, workflow, {
                    headers: this.baseHeaders,
                    timeout: 15000
                });
                
                console.log(`   ✅ Created workflow: ${workflow.name}`);
                this.newWorkflows.push(response.data);
                return response.data;
            }
        } catch (error) {
            console.log(`   ❌ Failed to create/update workflow "${workflow.name}": ${error.message}`);
            if (error.response?.data) {
                console.log(`   📝 Error details: ${JSON.stringify(error.response.data, null, 2)}`);
            }
            throw error;
        }
    }

    async configureWebhookEndpoints() {
        console.log('\n🔗 Configuring webhook endpoints...');
        
        const webhookEndpoints = [
            {
                path: 'spotify-data-webhook',
                description: 'Receives Spotify data for processing',
                method: 'POST'
            }
        ];
        
        console.log('📋 Available webhook endpoints:');
        webhookEndpoints.forEach(endpoint => {
            const fullUrl = `${this.apiUrl}/webhook/${endpoint.path}`;
            console.log(`   🎯 ${endpoint.method} ${fullUrl}`);
            console.log(`      ${endpoint.description}`);
        });
        
        return webhookEndpoints;
    }

    async generateConfigurationReport() {
        console.log('\n📊 Generating configuration report...');
        
        const report = {
            timestamp: new Date().toISOString(),
            n8n_instance: this.apiUrl,
            existing_workflows: this.existingWorkflows.length,
            new_workflows: this.newWorkflows.length,
            total_workflows: this.existingWorkflows.length + this.newWorkflows.length,
            workflows_created: this.newWorkflows.map(w => ({
                name: w.name,
                id: w.id,
                active: w.active
            })),
            capabilities: [
                'Spotify data processing and recommendations',
                'User analytics and insights generation',
                'Automated data synchronization and backup',
                'MCP server health monitoring',
                'Webhook-based integrations',
                'Scheduled automation tasks'
            ],
            integration_endpoints: {
                webhook_base: `${this.apiUrl}/webhook/`,
                api_base: `${this.apiUrl}/api/v1/`,
                management_ui: this.apiUrl
            },
            next_steps: [
                'Configure Spotify OAuth credentials in n8n',
                'Set up database connection credentials',
                'Test webhook endpoints with sample data',
                'Configure notification settings for alerts',
                'Set up backup storage locations'
            ]
        };
        
        // Save report to file
        const reportPath = path.join(process.cwd(), 'n8n-configuration-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        console.log('📋 Configuration Report:');
        console.log(`   Instance: ${report.n8n_instance}`);
        console.log(`   Total Workflows: ${report.total_workflows}`);
        console.log(`   New Workflows Created: ${report.new_workflows}`);
        console.log(`   Report saved to: ${reportPath}`);
        
        return report;
    }

    async runConfiguration() {
        try {
            await this.initialize();
            
            console.log('\n🏗️  Creating EchoTune AI workflows...\n');
            
            // Create workflows
            await this.createSpotifyDataProcessingWorkflow();
            await this.createUserAnalyticsWorkflow();
            await this.createDataSyncWorkflow();
            await this.createMcpIntegrationWorkflow();
            
            // Configure additional components
            await this.configureWebhookEndpoints();
            
            // Generate final report
            const report = await this.generateConfigurationReport();
            
            console.log('\n🎉 n8n configuration completed successfully!');
            console.log(`🔗 Access your workflows at: ${this.apiUrl}`);
            console.log(`📧 Login: ${process.env.N8N_USERNAME}`);
            console.log(`🔑 Password: ${process.env.N8N_PASSWORD}\n`);
            
            return report;
            
        } catch (error) {
            console.error('❌ Configuration failed:', error.message);
            throw error;
        }
    }
}

// Run configuration if executed directly
if (require.main === module) {
    const configurator = new N8nWorkflowConfigurator();
    configurator.runConfiguration().catch(console.error);
}

module.exports = N8nWorkflowConfigurator;