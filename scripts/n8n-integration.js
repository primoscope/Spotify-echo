#!/usr/bin/env node

/**
 * EchoTune AI n8n Integration Script
 * Use this script to interact with n8n via MCP tools
 */

require('dotenv').config();

// Configure n8n-mcp environment
process.env.N8N_API_URL = 'http://46.101.106.220';
process.env.N8N_API_KEY = process.env.N8N_API_KEY;
process.env.MCP_MODE = 'stdio';
process.env.LOG_LEVEL = 'info';

async function testConnection() {
    console.log('🔍 Testing n8n connection...');
    
    const axios = require('axios');
    try {
        const response = await axios.get(`${process.env.N8N_API_URL}/healthz`);
        console.log('✅ n8n is healthy:', response.data.status);
        return true;
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        return false;
    }
}

async function listWorkflows() {
    console.log('📋 Listing workflows...');
    
    const axios = require('axios');
    try {
        const response = await axios.get(`${process.env.N8N_API_URL}/api/v1/workflows`, {
            headers: { 'X-N8N-API-KEY': process.env.N8N_API_KEY }
        });
        
        console.log(`Found ${response.data.data.length} workflows:`);
        response.data.data.forEach((workflow, index) => {
            console.log(`  ${index + 1}. ${workflow.name} (${workflow.active ? 'active' : 'inactive'})`);
        });
        
        return response.data.data;
    } catch (error) {
        console.error('❌ Failed to list workflows:', error.message);
        return [];
    }
}

async function testWebhookEndpoints() {
    console.log('🔗 Testing webhook endpoints...');
    
    const webhookEndpoints = [
        {
            name: 'Spotify Data Webhook',
            url: `${process.env.N8N_API_URL}/webhook/spotify-data`,
            method: 'POST',
            sampleData: {
                user_id: 'test_user',
                tracks: [{ id: 'test_track', name: 'Test Song' }]
            }
        }
    ];
    
    webhookEndpoints.forEach(endpoint => {
        console.log(`📍 ${endpoint.name}:`);
        console.log(`   URL: ${endpoint.url}`);
        console.log(`   Method: ${endpoint.method}`);
        console.log(`   Sample: curl -X ${endpoint.method} "${endpoint.url}" -H "Content-Type: application/json" -d '${JSON.stringify(endpoint.sampleData)}'`);
    });
    
    return webhookEndpoints;
}

async function main() {
    console.log('🚀 EchoTune AI n8n Integration\n');
    
    // Test connection
    const connected = await testConnection();
    if (!connected) return;
    
    // List workflows
    await listWorkflows();
    
    // Show webhook endpoints
    await testWebhookEndpoints();
    
    console.log('\n✨ Integration ready!');
    console.log('🌐 Access n8n: http://46.101.106.220');
    console.log('📧 Login: willexmen8@gmail.com');
}

// Run if executed directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { testConnection, listWorkflows, testWebhookEndpoints };
