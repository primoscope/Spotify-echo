#!/usr/bin/env node

/**
 * Test Script for EchoTune AI Multi-Agent Orchestrator
 * 
 * Demonstrates the LangGraph integration and multi-agent workflows
 */

require('dotenv').config();
const MultiAgentOrchestrator = require('./src/agents/multi-agent-orchestrator');
const workflowConfigs = require('./src/agents/workflow-configs');

async function testMultiAgentOrchestrator() {
    console.log('🚀 Testing EchoTune AI Multi-Agent Orchestrator');
    console.log('================================================');
    
    let orchestrator;
    
    try {
        // Initialize the orchestrator
        console.log('\n🔧 Initializing Multi-Agent Orchestrator...');
        orchestrator = new MultiAgentOrchestrator();
        
        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('\n✅ Orchestrator initialized successfully');
        
        // Test workflow creation
        console.log('\n📋 Creating predefined workflows...');
        
        for (const [name, config] of Object.entries(workflowConfigs)) {
            try {
                orchestrator.createWorkflow(name, config);
                console.log(`  ✅ Created workflow: ${name}`);
            } catch (error) {
                console.log(`  ❌ Failed to create workflow: ${name} - ${error.message}`);
            }
        }
        
        // List available workflows
        console.log('\n📊 Available Workflows:');
        const workflows = orchestrator.listWorkflows();
        workflows.forEach(workflow => {
            console.log(`  🔄 ${workflow.name}: ${workflow.status.status}`);
        });
        
        // Test a simple workflow execution
        console.log('\n🧪 Testing Music Recommendation Pipeline...');
        
        const testResult = await orchestrator.executeWorkflow('musicRecommendationPipeline', {
            userInput: 'I want upbeat electronic music for working out',
            data: {
                userId: 'test_user_123',
                preferences: ['electronic', 'upbeat', 'workout'],
                context: 'gym session'
            }
        });
        
        console.log('\n📊 Workflow Execution Result:');
        console.log('  Messages:', testResult.messages.length);
        console.log('  Agent States:', Object.keys(testResult.agentState).length);
        console.log('  Workflow Data:', Object.keys(testResult.workflowData).length);
        
        // Show final response
        if (testResult.messages.length > 0) {
            const lastMessage = testResult.messages[testResult.messages.length - 1];
            console.log('\n💬 Final Response:');
            console.log(`  ${lastMessage.content.substring(0, 200)}...`);
        }
        
        // Test workflow status
        console.log('\n📈 Workflow Status:');
        const status = orchestrator.getWorkflowStatus('musicRecommendationPipeline');
        console.log(`  Name: ${status.name}`);
        console.log(`  Status: ${status.status}`);
        console.log(`  Agents: ${status.agents}`);
        console.log(`  Checkpoints: ${status.checkpoints}`);
        
        console.log('\n🎉 Multi-Agent Orchestrator Test Completed Successfully!');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        // Cleanup
        if (orchestrator) {
            console.log('\n🧹 Cleaning up...');
            await orchestrator.cleanup();
        }
    }
}

// Run the test if called directly
if (require.main === module) {
    testMultiAgentOrchestrator()
        .then(() => {
            console.log('\n✅ Test completed');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testMultiAgentOrchestrator };