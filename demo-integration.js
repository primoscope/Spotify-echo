#!/usr/bin/env node

/**
 * Perplexity + Grok-4 Integration Demo
 * Demonstrates the new capabilities integrated into EchoTune AI
 */

require('dotenv').config();

const MultiAgentOrchestrator = require('./src/utils/multi-agent-orchestrator');

async function runDemo() {
  console.log('🚀 EchoTune AI - Perplexity + Grok-4 Integration Demo');
  console.log('=' .repeat(60));

  const orchestrator = new MultiAgentOrchestrator();
  const initialized = await orchestrator.initialize();

  if (!initialized) {
    console.log('❌ Failed to initialize orchestrator');
    console.log('💡 Make sure to configure API keys:');
    console.log('   - PERPLEXITY_API_KEY for research capabilities');
    console.log('   - XAI_API_KEY or OPENROUTER_API_KEY for analysis capabilities');
    return;
  }

  console.log('✅ Multi-Agent Orchestrator initialized successfully\n');

  // Demo 1: Music Discovery Workflow
  console.log('🎵 Demo 1: Music Discovery Workflow');
  console.log('-' .repeat(40));
  
  try {
    const musicResult = await orchestrator.musicDiscoveryWorkflow(
      'indie rock with electronic elements',
      {
        genres: ['indie', 'electronic'],
        mood: 'upbeat',
        energy: 'high',
      }
    );

    if (musicResult.success) {
      console.log('✅ Music discovery completed successfully');
      console.log(`📊 Workflow ID: ${musicResult.workflowId}`);
      console.log(`📈 Steps: ${musicResult.results.steps.length}`);
      console.log(`⏱️  Duration: ${(musicResult.results.duration / 1000).toFixed(2)}s`);
      console.log(`🎯 Confidence: ${musicResult.recommendations.confidence}`);
    } else {
      console.log('❌ Music discovery failed:', musicResult.error);
    }
  } catch (error) {
    console.log('❌ Music discovery demo error:', error.message);
  }

  console.log('\n');

  // Demo 2: Code Analysis Workflow  
  console.log('🔍 Demo 2: Code Analysis Workflow');
  console.log('-' .repeat(40));

  const sampleCode = `
const express = require('express');
const app = express();

// Potential security issue - no input validation
app.get('/user/:id', (req, res) => {
  const userId = req.params.id;
  const query = 'SELECT * FROM users WHERE id = ' + userId;
  // SQL injection vulnerability
  database.query(query, (err, results) => {
    res.json(results);
  });
});

app.listen(3000);
`;

  try {
    const codeResult = await orchestrator.codeAnalysisWorkflow(sampleCode, 'security');

    if (codeResult.success) {
      console.log('✅ Code analysis completed successfully');
      console.log(`📊 Workflow ID: ${codeResult.workflowId}`);
      console.log(`📈 Analysis Type: ${codeResult.summary.analysisType}`);
      console.log(`🔬 Steps: ${codeResult.summary.steps}`);
      console.log(`⏱️  Duration: ${(codeResult.summary.duration / 1000).toFixed(2)}s`);
      console.log(`🧪 Research: ${codeResult.summary.hasResearch ? '✅' : '❌'}`);
      console.log(`🔍 Analysis: ${codeResult.summary.hasAnalysis ? '✅' : '❌'}`);
      console.log(`📋 Tasks: ${codeResult.summary.hasTasks ? '✅' : '❌'}`);
    } else {
      console.log('❌ Code analysis failed:', codeResult.error);
    }
  } catch (error) {
    console.log('❌ Code analysis demo error:', error.message);
  }

  console.log('\n');

  // Demo 3: Research-Driven Development
  console.log('🏗️ Demo 3: Research-Driven Development Workflow');
  console.log('-' .repeat(40));

  try {
    const rddResult = await orchestrator.researchDrivenDevelopment(
      'Real-time Collaborative Playlists',
      {
        collaboration: 'Multiple users can add/remove songs simultaneously',
        realtime: 'Changes sync across all connected users instantly',
        permissions: 'Playlist owner can set editing permissions',
        integration: 'Works with existing EchoTune AI recommendation system',
      }
    );

    if (rddResult.success) {
      console.log('✅ Research-driven development completed successfully');
      console.log(`📊 Workflow ID: ${rddResult.workflowId}`);
      console.log(`🎯 Feature: ${rddResult.plan.feature}`);
      console.log(`📚 Research: ${rddResult.plan.hasResearch ? '✅' : '❌'}`);
      console.log(`🏗️ Architecture: ${rddResult.plan.hasArchitecture ? '✅' : '❌'}`);
      console.log(`📋 Plan: ${rddResult.plan.hasPlan ? '✅' : '❌'}`);
      console.log(`⏱️  Duration: ${(rddResult.plan.duration / 1000).toFixed(2)}s`);
    } else {
      console.log('❌ Research-driven development failed:', rddResult.error);
    }
  } catch (error) {
    console.log('❌ Research-driven development demo error:', error.message);
  }

  console.log('\n');

  // Show Analytics
  console.log('📊 Workflow Analytics');
  console.log('-' .repeat(40));

  const history = orchestrator.getWorkflowHistory(10);
  console.log(`📈 Total Workflows: ${history.analytics.totalWorkflows}`);
  console.log(`✅ Success Rate: ${history.analytics.successRate}`);
  console.log(`⏱️  Average Duration: ${history.analytics.averageDuration}`);
  console.log('📋 Workflow Types:', Object.keys(history.analytics.workflowTypes || {}));

  console.log('\n🎉 Demo completed! The integration is ready for production use.');
  console.log('\n💡 API Endpoints Available:');
  console.log('   - POST /api/research/query - Perplexity research');
  console.log('   - POST /api/research/music - Music-specific research'); 
  console.log('   - POST /api/analyze/repository - Grok-4 code analysis');
  console.log('   - POST /api/analyze/reasoning - Advanced reasoning');
  console.log('   - POST /api/workflows/music-discovery - Multi-agent music discovery');
  console.log('   - POST /api/workflows/code-analysis - Multi-agent code analysis');
  console.log('   - POST /api/workflows/research-driven-development - RDD workflow');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Demo interrupted. Goodbye!');
  process.exit(0);
});

// Run the demo
if (require.main === module) {
  runDemo().catch(error => {
    console.error('\n❌ Demo failed:', error);
    process.exit(1);
  });
}

module.exports = { runDemo };