#!/usr/bin/env node

/**
 * EchoTune AI Autonomous Orchestrator Launcher
 * 
 * Main entry point for the autonomous music app promotion system
 * Coordinates Perplexity research, browser automation, and continuous roadmap updates
 */

require('dotenv').config();
const { AutonomousMusicOrchestrator } = require('./autonomous-music-orchestrator.js');
const { MusicPerplexityResearch } = require('./music-perplexity-research.js');
const { MusicBrowserAutomation } = require('./music-browser-automation.js');

class EchoTuneOrchestratorLauncher {
    constructor() {
        this.orchestrator = null;
        this.research = null;
        this.browserAutomation = null;
        this.isRunning = false;
        this.cycleCount = 0;
        this.maxCycles = 10; // Prevent infinite loops
    }

    /**
     * Initialize all orchestrator components
     */
    async initialize() {
        console.log('🎵 EchoTune AI Autonomous Orchestrator Launcher');
        console.log('=' .repeat(60));
        
        try {
            // Initialize research system
            console.log('\n🔍 Initializing Perplexity Research System...');
            this.research = new MusicPerplexityResearch();
            await this.research.initialize();
            
            // Initialize browser automation
            console.log('\n🧪 Initializing Browser Automation System...');
            this.browserAutomation = new MusicBrowserAutomation();
            await this.browserAutomation.initialize();
            
            // Initialize main orchestrator
            console.log('\n🎯 Initializing Main Orchestrator...');
            this.orchestrator = new AutonomousMusicOrchestrator();
            await this.orchestrator.initialize();
            
            console.log('\n✅ All systems initialized successfully!');
            return true;
            
        } catch (error) {
            console.error('❌ Initialization failed:', error.message);
            return false;
        }
    }

    /**
     * Launch the autonomous orchestration system
     */
    async launch() {
        if (this.isRunning) {
            console.log('⚠️  Orchestrator is already running');
            return;
        }

        console.log('\n🚀 Launching Autonomous Music App Orchestration...');
        this.isRunning = true;

        try {
            while (this.isRunning && this.cycleCount < this.maxCycles) {
                this.cycleCount++;
                console.log(`\n🔄 Starting Orchestration Cycle ${this.cycleCount}`);
                
                // Execute research-driven development cycle
                await this.executeResearchCycle();
                
                // Execute implementation and validation cycle
                await this.executeImplementationCycle();
                
                // Execute continuous improvement cycle
                await this.executeImprovementCycle();
                
                // Generate cycle report
                await this.generateCycleReport();
                
                // Check if we should continue
                if (!this.shouldContinueCycling()) {
                    console.log('🎯 Orchestration cycle limit reached or completion detected');
                    break;
                }
                
                // Wait before next cycle
                console.log('\n⏳ Waiting 5 minutes before next cycle...');
                await this.delay(5 * 60 * 1000);
            }
            
        } catch (error) {
            console.error('❌ Orchestration failed:', error);
            this.isRunning = false;
        } finally {
            this.isRunning = false;
            console.log('\n🏁 Orchestration completed');
        }
    }

    /**
     * Execute research-driven development cycle
     */
    async executeResearchCycle() {
        console.log('\n📚 Executing Research-Driven Development Cycle...');
        
        try {
            // Research all components
            const components = ['frontend', 'backend', 'spotify', 'recommendations', 'data', 'ai'];
            
            for (const component of components) {
                console.log(`\n🔬 Researching ${component} component...`);
                
                const researchResults = await this.research.executeComponentResearch(component, {
                    model: 'grok-4-equivalent',
                    maxTokens: 2000,
                    temperature: 0.7
                });
                
                console.log(`  ✅ ${component} research completed with ${researchResults.insights.length} insights`);
                
                // Add research insights to orchestrator
                if (this.orchestrator) {
                    this.orchestrator.researchCache.set(component, researchResults);
                }
            }
            
            // Generate research summary
            await this.research.generateResearchSummary();
            
        } catch (error) {
            console.error('❌ Research cycle failed:', error.message);
        }
    }

    /**
     * Execute implementation and validation cycle
     */
    async executeImplementationCycle() {
        console.log('\n⚙️  Executing Implementation and Validation Cycle...');
        
        try {
            // Run main orchestration
            if (this.orchestrator) {
                await this.orchestrator.runOrchestration();
            }
            
        } catch (error) {
            console.error('❌ Implementation cycle failed:', error.message);
        }
    }

    /**
     * Execute continuous improvement cycle
     */
    async executeImprovementCycle() {
        console.log('\n🔄 Executing Continuous Improvement Cycle...');
        
        try {
            // Run browser automation tests
            console.log('\n🧪 Running comprehensive browser tests...');
            const testResults = await this.browserAutomation.runMusicAppTests();
            
            console.log(`  ✅ Browser tests completed: ${testResults.summary.passed} passed, ${testResults.summary.failed} failed`);
            
            // Generate improvement recommendations
            const recommendations = this.generateImprovementRecommendations(testResults);
            
            // Add recommendations to orchestrator queue
            if (this.orchestrator && recommendations.length > 0) {
                this.orchestrator.workflowQueue.push(...recommendations);
                await this.orchestrator.saveWorkflowQueue();
                
                console.log(`  📝 Added ${recommendations.length} improvement tasks to queue`);
            }
            
        } catch (error) {
            console.error('❌ Improvement cycle failed:', error.message);
        }
    }

    /**
     * Generate improvement recommendations based on test results
     */
    generateImprovementRecommendations(testResults) {
        const recommendations = [];
        
        // Performance improvements
        if (testResults.overallPerformance.performanceScore < 80) {
            recommendations.push({
                name: 'Performance Optimization Sprint',
                component: 'general',
                priority: 'high',
                description: 'Address performance issues identified in browser tests',
                estimatedEffort: '8-16 hours',
                dependencies: [],
                generatedFrom: 'Browser Test Results'
            });
        }
        
        // Failed test scenarios
        if (testResults.summary.failed > 0) {
            recommendations.push({
                name: 'Fix Failing Test Scenarios',
                component: 'general',
                priority: 'high',
                description: `Fix ${testResults.summary.failed} failing test scenarios`,
                estimatedEffort: '4-8 hours',
                dependencies: [],
                generatedFrom: 'Browser Test Results'
            });
        }
        
        // Performance warnings
        if (testResults.summary.warnings > 0) {
            recommendations.push({
                name: 'Address Performance Warnings',
                component: 'general',
                priority: 'medium',
                description: `Address ${testResults.summary.warnings} performance warnings`,
                estimatedEffort: '2-4 hours',
                dependencies: [],
                generatedFrom: 'Browser Test Results'
            });
        }
        
        return recommendations;
    }

    /**
     * Generate cycle report
     */
    async generateCycleReport() {
        console.log('\n📊 Generating Cycle Report...');
        
        try {
            const report = {
                cycleNumber: this.cycleCount,
                timestamp: new Date().toISOString(),
                researchInsights: this.research?.researchHistory.length || 0,
                workflowQueueSize: this.orchestrator?.workflowQueue.length || 0,
                browserTestResults: 'Completed',
                recommendations: 'Generated',
                nextActions: this.generateNextActions()
            };
            
            // Save cycle report
            const fs = require('fs').promises;
            const path = require('path');
            const reportPath = path.join('../test-results', `cycle-report-${this.cycleCount}-${Date.now()}.json`);
            
            await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
            console.log(`  💾 Cycle report saved to: ${reportPath}`);
            
        } catch (error) {
            console.error('❌ Failed to generate cycle report:', error.message);
        }
    }

    /**
     * Generate next actions for the team
     */
    generateNextActions() {
        const actions = [
            'Review research insights and prioritize implementation',
            'Address high-priority workflow items',
            'Implement browser test recommendations',
            'Update development roadmap with progress',
            'Schedule next orchestration cycle'
        ];
        
        return actions;
    }

    /**
     * Determine if orchestration should continue
     */
    shouldContinueCycling() {
        // Check if there are pending workflows
        if (this.orchestrator && this.orchestrator.workflowQueue.length > 0) {
            return true;
        }
        
        // Check if we've reached the cycle limit
        if (this.cycleCount >= this.maxCycles) {
            return false;
        }
        
        // Check if significant progress has been made
        if (this.research && this.research.researchHistory.length > 0) {
            const recentResearch = this.research.researchHistory.slice(-3);
            const hasNewInsights = recentResearch.some(r => r.insightsCount > 0);
            
            if (hasNewInsights) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Stop the orchestrator
     */
    async stop() {
        console.log('\n🛑 Stopping orchestrator...');
        this.isRunning = false;
        
        // Clean up resources
        if (this.orchestrator) {
            await this.orchestrator.generateOrchestrationReport();
        }
        
        console.log('✅ Orchestrator stopped');
    }

    /**
     * Utility function for delays
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Display orchestrator status
     */
    displayStatus() {
        console.log('\n📊 Orchestrator Status');
        console.log('=' .repeat(40));
        console.log(`Status: ${this.isRunning ? '🟢 Running' : '🔴 Stopped'}`);
        console.log(`Cycle: ${this.cycleCount}/${this.maxCycles}`);
        console.log(`Research History: ${this.research?.researchHistory.length || 0} sessions`);
        console.log(`Workflow Queue: ${this.orchestrator?.workflowQueue.length || 0} items`);
        console.log(`Browser Tests: ${this.browserAutomation ? '🟢 Active' : '🔴 Inactive'}`);
    }

    /**
     * Run a single orchestration cycle
     */
    async runSingleCycle() {
        console.log('\n🔄 Running Single Orchestration Cycle...');
        
        try {
            await this.executeResearchCycle();
            await this.executeImplementationCycle();
            await this.executeImprovementCycle();
            await this.generateCycleReport();
            
            console.log('✅ Single cycle completed successfully');
            
        } catch (error) {
            console.error('❌ Single cycle failed:', error.message);
        }
    }
}

// Main execution
if (require.main === module) {
    const launcher = new EchoTuneOrchestratorLauncher();
    
    // Handle command line arguments
    const args = process.argv.slice(2);
    const command = args[0] || 'launch';
    
    async function main() {
        try {
            const initialized = await launcher.initialize();
            
            if (!initialized) {
                console.error('❌ Failed to initialize orchestrator');
                process.exit(1);
            }
            
            switch (command) {
                case 'launch':
                    console.log('🚀 Launching continuous orchestration...');
                    await launcher.launch();
                    break;
                    
                case 'single':
                    console.log('🔄 Running single orchestration cycle...');
                    await launcher.runSingleCycle();
                    break;
                    
                case 'status':
                    launcher.displayStatus();
                    break;
                    
                case 'stop':
                    await launcher.stop();
                    break;
                    
                default:
                    console.log('Usage: node launch-orchestrator.js [launch|single|status|stop]');
                    console.log('  launch: Run continuous orchestration cycles');
                    console.log('  single: Run a single orchestration cycle');
                    console.log('  status: Display current orchestrator status');
                    console.log('  stop: Stop the orchestrator');
                    break;
            }
            
        } catch (error) {
            console.error('❌ Orchestrator launcher failed:', error);
            process.exit(1);
        }
    }
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Received SIGINT, shutting down gracefully...');
        await launcher.stop();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
        await launcher.stop();
        process.exit(0);
    });
    
    main();
}

module.exports = { EchoTuneOrchestratorLauncher };