#!/usr/bin/env node

/**
 * LAUNCHER SCRIPT
 * 
 * Simple launcher for the EchoTune AI Development System
 */

const { MainDevelopmentOrchestrator } = require('./main-development-orchestrator.js');

async function main() {
    console.log('🎵 EchoTune AI - Main Development Orchestrator');
    console.log('=' .repeat(60));
    
    try {
        const orchestrator = new MainDevelopmentOrchestrator();
        
        // Initialize the system
        await orchestrator.initialize();
        
        console.log('\n🚀 System is ready! Available workflows:');
        
        const workflows = orchestrator.getAvailableWorkflows();
        for (const [key, description] of Object.entries(workflows)) {
            console.log(`  • ${key}: ${description}`);
        }
        
        console.log('\n💡 Usage examples:');
        console.log('  • node main-development-orchestrator.js (full cycle)');
        console.log('  • node real-development-system.js (development only)');
        console.log('  • node real-task-manager.js (task management)');
        console.log('  • node mcp-integration-system.js (MCP servers)');
        console.log('  • node docker-testing-automation.js (Docker testing)');
        
        console.log('\n🎯 Ready to build the magic engine! 🚀');
        
    } catch (error) {
        console.error('❌ Failed to launch system:', error.message);
        process.exit(1);
    }
}

// Run the launcher
if (require.main === module) {
    main();
}

module.exports = { main };