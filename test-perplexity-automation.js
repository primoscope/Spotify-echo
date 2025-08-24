#!/usr/bin/env node

// Load environment variables properly
require('dotenv').config();

const GitHubCodingAgentPerplexity = require('./GitHubCodingAgentPerplexity');

async function testWithEnvLoading() {
    console.log('🧪 TESTING WITH ENV LOADING');
    console.log('============================');
    
    // Manually check for API key
    const apiKey = process.env.PERPLEXITY_API_KEY;
    
    if (!apiKey) {
        console.error('❌ PERPLEXITY_API_KEY not found in environment');
        console.log('Available env vars containing PERPLEXITY:', 
            Object.keys(process.env).filter(key => key.includes('PERPLEXITY')));
        return;
    }
    
    console.log(`✅ API Key loaded: ${apiKey.substring(0, 10)}...`);
    
    try {
        const automation = new GitHubCodingAgentPerplexity(apiKey);
        
        // Quick test to verify API works
        console.log('\n🔧 Testing API connection...');
        const quickTest = await automation.quickAutomationCheck();
        
        if (quickTest.success) {
            console.log('✅ API Connection: SUCCESS');
            console.log(`📝 Response length: ${quickTest.insights.length} characters`);
            console.log('\n🎉 GITHUB CODING AGENT PERPLEXITY INTEGRATION VERIFIED!');
        } else {
            console.log('❌ API Connection: FAILED');
            console.error('Error:', quickTest.error);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testWithEnvLoading();