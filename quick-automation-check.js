#!/usr/bin/env node

/**
 * Quick Automation Check for EchoTune AI
 * Provides rapid status check of automation system health
 */

const automation = require('./GitHubCodingAgentPerplexity');

async function quickAutomationCheck() {
    try {
        console.log('🔍 Quick Automation Health Check');
        console.log('================================');
        
        const instance = new automation();
        
        // Test basic functionality
        const result = await instance.quickAutomationCheck();
        
        console.log('📊 Automation Status:', result.success ? '✅ READY' : '❌ ISSUES');
        
        if (result.insights) {
            console.log('💡 Latest Insights Available');
            console.log('📋 Repository Analysis:', result.insights.repository ? '✅' : '❌');
            console.log('🎯 Roadmap Updates:', result.insights.roadmap ? '✅' : '❌');
            console.log('⚡ Task Generation:', result.insights.tasks ? '✅' : '❌');
        }
        
        if (result.session) {
            console.log('📈 Session Stats:');
            console.log(`   Queries: ${result.session.queries}`);
            console.log(`   Costs: $${result.session.costs.toFixed(4)}`);
            console.log(`   Roadmap Updates: ${result.session.roadmapUpdates}`);
            console.log(`   Tasks Generated: ${result.session.tasksGenerated}`);
        }
        
        return result;
        
    } catch (error) {
        console.error('❌ Automation check failed:', error.message);
        return { success: false, error: error.message };
    }
}

// Run if called directly
if (require.main === module) {
    quickAutomationCheck()
        .then(result => {
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { quickAutomationCheck };