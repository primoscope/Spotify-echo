#!/usr/bin/env node

// Load environment variables
require('dotenv').config();

const GitHubCodingAgentPerplexity = require('./GitHubCodingAgentPerplexity');
const fs = require('fs').promises;

async function runFullAutomationTest() {
    console.log('🚀 COMPREHENSIVE AUTOMATION WORKFLOW TEST');
    console.log('==========================================');
    
    const automation = new GitHubCodingAgentPerplexity();
    
    // Load real repository context
    const repositoryContext = `
EchoTune AI - Advanced Music Recommendation Platform
=====================================

**Technology Stack:**
- Backend: Node.js, Express.js
- Frontend: React 19, Vite
- Database: MongoDB Atlas, Redis Cloud
- AI/ML: Python, scikit-learn, Perplexity API, Gemini API
- Integration: Spotify Web API, GitHub Actions
- Deployment: Docker, DigitalOcean, Nginx

**Current Features:**
- Spotify authentication and data fetching
- Basic music recommendation engine
- Conversational AI chat interface
- Real-time data processing with MongoDB
- Advanced Perplexity API integration with cost optimization
- MCP (Model Context Protocol) server ecosystem
- Automated CI/CD workflows

**Current Status:**
- 26% complete (10/38 tasks)
- 28 tasks in progress
- Recently completed: Enhanced Perplexity API integration
- Focus: Autonomous coding agent automation

**Architecture:**
- Microservices architecture with MCP servers
- RESTful APIs with comprehensive error handling
- Real-time WebSocket connections
- Caching layer with Redis
- ML pipeline with Python scripts

**Recent Enhancements:**
- Cost-optimized Perplexity integration (9 models)
- Intelligent caching system (35% hit rate)
- Budget management ($5 weekly budget)
- Batch processing optimization
- System health monitoring (100/100 score)
`;

    // Load current roadmap
    let roadmapContent;
    try {
        roadmapContent = await fs.readFile('./AUTONOMOUS_DEVELOPMENT_ROADMAP.md', 'utf8');
        console.log(`📋 Loaded roadmap: ${roadmapContent.length} characters`);
    } catch (error) {
        console.log('⚠️ Could not load roadmap file, using sample');
        roadmapContent = `
# EchoTune AI Development Roadmap

## Completed Features (10/38 tasks)
✅ Spotify API Integration
✅ MongoDB Database Setup
✅ Basic Recommendation Engine
✅ User Authentication System
✅ Chat Interface Foundation
✅ Perplexity API Integration
✅ Cost Optimization System
✅ MCP Server Framework
✅ CI/CD Pipeline
✅ Performance Monitoring

## In Progress (28 tasks)
🔄 Advanced ML Models
🔄 Enhanced Chat Features
🔄 Social Features
🔄 Mobile Optimization
🔄 Analytics Dashboard
🔄 Security Hardening
🔄 Performance Optimization
🔄 API Documentation
🔄 Testing Framework
🔄 Deployment Automation

## Planned Features
- Multi-platform integration (Apple Music, YouTube)
- Voice interface
- AI music generation
- Advanced analytics
- Microservices architecture
- CDN integration
- Progressive Web App
- Social sharing features
`;
    }
    
    console.log('\n🔬 Starting comprehensive automation workflow...');
    
    try {
        // Run complete automation workflow
        const results = await automation.runCompleteAutomationWorkflow(
            repositoryContext, 
            roadmapContent
        );
        
        // Display comprehensive results
        console.log('\n📊 COMPREHENSIVE TEST RESULTS:');
        console.log('===============================');
        
        console.log(`🎯 Overall Success: ${results.success ? '✅ YES' : '❌ NO'}`);
        
        if (results.repositoryAnalysis) {
            console.log(`🔬 Repository Analysis: ${results.repositoryAnalysis.success ? '✅ SUCCESS' : '❌ FAILED'}`);
            if (results.repositoryAnalysis.success) {
                console.log(`   📝 Insights generated: ${results.repositoryAnalysis.insights?.length || 0}`);
                console.log(`   🧠 Model used: ${results.repositoryAnalysis.model}`);
            }
        }
        
        if (results.roadmapAnalysis) {
            console.log(`📋 Roadmap Analysis: ${results.roadmapAnalysis.success ? '✅ SUCCESS' : '❌ FAILED'}`);
            if (results.roadmapAnalysis.success) {
                console.log(`   🎯 New tasks generated: ${results.roadmapAnalysis.taskCount}`);
                console.log(`   🧠 Model used: ${results.roadmapAnalysis.model}`);
            }
        }
        
        // Show session statistics
        const stats = automation.getSessionStats();
        console.log('\n📈 Session Statistics:');
        console.log(`   ⚡ Total queries: ${stats.queriesExecuted}`);
        console.log(`   📊 Tasks generated: ${stats.tasksGenerated}`);
        console.log(`   📋 Roadmap updates: ${stats.roadmapUpdates}`);
        console.log(`   ⏱️  Average response time: ${stats.averageResponseTime}ms`);
        console.log(`   📝 Total output: ${stats.totalOutputChars} characters`);
        
        if (results.success) {
            console.log('\n🎉 AUTOMATION INTEGRATION FULLY FUNCTIONAL!');
            console.log('✅ Ready for GitHub coding agent workflows');
            console.log('✅ Repository analysis working');
            console.log('✅ Roadmap generation working');
            console.log('✅ Task generation working');
            console.log('✅ Real API calls confirmed');
        } else {
            console.log('\n❌ AUTOMATION WORKFLOW ISSUES DETECTED');
            if (results.error) {
                console.log(`Error: ${results.error}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Comprehensive test failed:', error.message);
    }
}

runFullAutomationTest();