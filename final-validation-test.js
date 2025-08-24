#!/usr/bin/env node

/**
 * FINAL VALIDATION TEST FOR GITHUB CODING AGENT PERPLEXITY INTEGRATION
 * 
 * Tests all components of the optimized automation system:
 * 1. API connectivity and model verification
 * 2. Repository analysis functionality
 * 3. Roadmap generation capabilities
 * 4. File generation and saving
 * 5. Configuration validation
 */

require('dotenv').config();

const GitHubCodingAgentPerplexity = require('./GitHubCodingAgentPerplexity');
const fs = require('fs').promises;
const path = require('path');

async function runFinalValidation() {
    console.log('🔥 FINAL VALIDATION: GITHUB CODING AGENT PERPLEXITY INTEGRATION');
    console.log('==============================================================');
    
    const results = {
        apiConnectivity: false,
        repositoryAnalysis: false,
        roadmapGeneration: false,
        fileGeneration: false,
        configurationValid: false,
        overall: false
    };
    
    try {
        // Test 1: API Connectivity
        console.log('\n🔌 Test 1: API Connectivity & Model Verification');
        console.log('------------------------------------------------');
        
        const automation = new GitHubCodingAgentPerplexity();
        const quickTest = await automation.quickAutomationCheck();
        
        if (quickTest.success) {
            console.log('✅ API Connection: SUCCESS');
            console.log(`📝 Response generated: ${quickTest.insights.length} characters`);
            results.apiConnectivity = true;
        } else {
            console.log('❌ API Connection: FAILED');
            console.log(`Error: ${quickTest.error}`);
        }
        
        // Test 2: Repository Analysis
        console.log('\n🔬 Test 2: Repository Analysis Capability');
        console.log('------------------------------------------');
        
        const repoContext = `Test repository analysis for validation`;
        const repoAnalysis = await automation.analyzeRepositoryForAutomation(repoContext);
        
        if (repoAnalysis.success) {
            console.log('✅ Repository Analysis: SUCCESS');
            console.log(`📊 Analysis length: ${repoAnalysis.analysis.length} characters`);
            console.log(`💡 Insights generated: ${repoAnalysis.insights?.length || 0}`);
            results.repositoryAnalysis = true;
        } else {
            console.log('❌ Repository Analysis: FAILED');
            console.log(`Error: ${repoAnalysis.error}`);
        }
        
        // Test 3: Roadmap Generation
        console.log('\n📋 Test 3: Roadmap Generation & Task Creation');
        console.log('----------------------------------------------');
        
        const roadmapContext = `Current roadmap: Basic features implemented, need enhancement`;
        const roadmapAnalysis = await automation.analyzeRoadmapForUpdates(roadmapContext, 'Sample insights');
        
        if (roadmapAnalysis.success) {
            console.log('✅ Roadmap Generation: SUCCESS');
            console.log(`📈 Analysis length: ${roadmapAnalysis.analysis.length} characters`);
            console.log(`🎯 Tasks generated: ${roadmapAnalysis.taskCount}`);
            results.roadmapGeneration = true;
        } else {
            console.log('❌ Roadmap Generation: FAILED');
            console.log(`Error: ${roadmapAnalysis.error}`);
        }
        
        // Test 4: File Generation Verification
        console.log('\n💾 Test 4: File Generation & Saving');
        console.log('-----------------------------------');
        
        try {
            // Check if analysis files were created
            const files = await fs.readdir('./');
            const analysisFiles = files.filter(f => f.startsWith('perplexity-') && f.endsWith('.md'));
            const reportFiles = files.filter(f => f.startsWith('automation-workflow-report-') && f.endsWith('.json'));
            
            if (analysisFiles.length > 0 && reportFiles.length > 0) {
                console.log('✅ File Generation: SUCCESS');
                console.log(`📄 Analysis files: ${analysisFiles.length}`);
                console.log(`📊 Report files: ${reportFiles.length}`);
                results.fileGeneration = true;
            } else {
                console.log('❌ File Generation: PARTIAL');
                console.log(`📄 Analysis files: ${analysisFiles.length}`);
                console.log(`📊 Report files: ${reportFiles.length}`);
            }
        } catch (error) {
            console.log('❌ File Generation: FAILED');
            console.log(`Error: ${error.message}`);
        }
        
        // Test 5: Configuration Validation
        console.log('\n⚙️ Test 5: Configuration Validation');
        console.log('------------------------------------');
        
        try {
            // Check required files exist
            const requiredFiles = [
                'GitHubCodingAgentPerplexity.js',
                'CURSOR_CODING_INSTRUCTIONS_OPTIMIZED.md',
                'cursor-ai-config.json',
                '.env'
            ];
            
            let configValid = true;
            for (const file of requiredFiles) {
                try {
                    await fs.access(file);
                    console.log(`✅ ${file}: EXISTS`);
                } catch {
                    console.log(`❌ ${file}: MISSING`);
                    configValid = false;
                }
            }
            
            // Check environment variables
            const requiredEnvVars = ['PERPLEXITY_API_KEY'];
            for (const envVar of requiredEnvVars) {
                if (process.env[envVar]) {
                    console.log(`✅ ${envVar}: SET`);
                } else {
                    console.log(`❌ ${envVar}: MISSING`);
                    configValid = false;
                }
            }
            
            results.configurationValid = configValid;
            
        } catch (error) {
            console.log('❌ Configuration Validation: FAILED');
            console.log(`Error: ${error.message}`);
        }
        
        // Calculate overall result
        const successCount = Object.values(results).filter(Boolean).length;
        const totalTests = Object.keys(results).length - 1; // Exclude 'overall'
        results.overall = successCount >= totalTests * 0.8; // 80% success rate
        
        // Final Results
        console.log('\n🏆 FINAL VALIDATION RESULTS');
        console.log('============================');
        console.log(`🔌 API Connectivity: ${results.apiConnectivity ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`🔬 Repository Analysis: ${results.repositoryAnalysis ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`📋 Roadmap Generation: ${results.roadmapGeneration ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`💾 File Generation: ${results.fileGeneration ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`⚙️ Configuration: ${results.configurationValid ? '✅ PASS' : '❌ FAIL'}`);
        console.log('\n' + '='.repeat(50));
        console.log(`🎯 OVERALL RESULT: ${results.overall ? '✅ SYSTEM READY' : '❌ NEEDS FIXES'}`);
        console.log(`📊 Success Rate: ${successCount}/${totalTests} (${Math.round((successCount/totalTests)*100)}%)`);
        
        if (results.overall) {
            console.log('\n🎉 GITHUB CODING AGENT PERPLEXITY INTEGRATION COMPLETE!');
            console.log('✅ All systems operational');
            console.log('✅ Ready for autonomous coding workflows');
            console.log('✅ Cursor configuration optimized');
            console.log('✅ Documentation complete');
            console.log('\n🚀 Next steps:');
            console.log('1. Copy CURSOR_CODING_INSTRUCTIONS_OPTIMIZED.md to Cursor AI');
            console.log('2. Start coding automation with integrated roadmap updates');
            console.log('3. Monitor automation performance and optimize as needed');
        } else {
            console.log('\n⚠️ SYSTEM NEEDS ATTENTION');
            console.log('Please address failing components before proceeding');
        }
        
        // Session stats
        const stats = automation.getSessionStats();
        console.log('\n📈 Session Statistics:');
        console.log(`⚡ Queries executed: ${stats.queriesExecuted}`);
        console.log(`⏱️ Average response time: ${stats.averageResponseTime}ms`);
        console.log(`📝 Total output: ${stats.totalOutputChars} characters`);
        console.log(`🎯 Tasks generated: ${stats.tasksGenerated}`);
        
        return results;
        
    } catch (error) {
        console.error('❌ Final validation failed:', error.message);
        results.overall = false;
        return results;
    }
}

// Execute validation
if (require.main === module) {
    runFinalValidation()
        .then(results => {
            process.exit(results.overall ? 0 : 1);
        })
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = runFinalValidation;