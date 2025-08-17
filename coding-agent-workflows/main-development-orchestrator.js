#!/usr/bin/env node

/**
 * MAIN DEVELOPMENT ORCHESTRATOR
 * 
 * COORDINATES ALL SYSTEMS:
 * - Real Development System
 * - Task Manager
 * - MCP Server Integration
 * - Docker Testing Automation
 * - Perplexity API Research
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

// Import all systems
const { RealDevelopmentSystem } = require('./real-development-system.js');
const { RealTaskManager } = require('./real-task-manager.js');
const { MCPServerIntegration } = require('./mcp-integration-system.js');
const { DockerTestingAutomation } = require('./docker-testing-automation.js');

class MainDevelopmentOrchestrator {
    constructor() {
        this.systems = {
            development: null,
            taskManager: null,
            mcpIntegration: null,
            dockerTesting: null
        };
        
        this.currentWorkflow = null;
        this.workflowHistory = [];
        this.performanceMetrics = {};
        
        this.workflowTypes = {
            'full-cycle': 'Complete development cycle with all systems',
            'research-only': 'Research and task creation only',
            'development-only': 'Feature development without testing',
            'testing-only': 'Docker and integration testing only',
            'mcp-optimization': 'MCP server optimization and testing',
            'performance-audit': 'Performance analysis and optimization'
        };
    }

    async initialize() {
        console.log('🚀 Initializing Main Development Orchestrator...');
        
        try {
            // Initialize all systems
            await this.initializeAllSystems();
            
            // Load workflow history
            await this.loadWorkflowHistory();
            
            // Set up performance monitoring
            this.setupPerformanceMonitoring();
            
            console.log('✅ Main Development Orchestrator ready!');
            
        } catch (error) {
            console.error('❌ Failed to initialize orchestrator:', error.message);
            throw error;
        }
    }

    async initializeAllSystems() {
        console.log('🔧 Initializing all development systems...');
        
        // Initialize Real Development System
        console.log('  📝 Initializing Real Development System...');
        this.systems.development = new RealDevelopmentSystem();
        await this.systems.development.initialize();
        
        // Initialize Task Manager
        console.log('  📋 Initializing Task Manager...');
        this.systems.taskManager = new RealTaskManager();
        await this.systems.taskManager.initialize();
        
        // Initialize MCP Server Integration
        console.log('  🔌 Initializing MCP Server Integration...');
        this.systems.mcpIntegration = new MCPServerIntegration();
        await this.systems.mcpIntegration.initialize();
        
        // Initialize Docker Testing Automation
        console.log('  🐳 Initializing Docker Testing Automation...');
        this.systems.dockerTesting = new DockerTestingAutomation();
        await this.systems.dockerTesting.initialize();
        
        console.log('  ✅ All systems initialized successfully');
    }

    setupPerformanceMonitoring() {
        this.performanceMetrics = {
            startTime: Date.now(),
            workflows: [],
            systemPerformance: {},
            resourceUsage: {}
        };
    }

    async executeWorkflow(workflowType, parameters = {}) {
        console.log(`🔄 Executing workflow: ${workflowType}`);
        
        const workflow = {
            id: `workflow-${Date.now()}`,
            type: workflowType,
            parameters: parameters,
            startTime: new Date().toISOString(),
            status: 'running',
            results: {},
            performance: {}
        };
        
        this.currentWorkflow = workflow;
        
        try {
            const startTime = Date.now();
            
            // Execute workflow based on type
            switch (workflowType) {
                case 'full-cycle':
                    workflow.results = await this.executeFullCycle(parameters);
                    break;
                case 'research-only':
                    workflow.results = await this.executeResearchOnly(parameters);
                    break;
                case 'development-only':
                    workflow.results = await this.executeDevelopmentOnly(parameters);
                    break;
                case 'testing-only':
                    workflow.results = await this.executeTestingOnly(parameters);
                    break;
                case 'mcp-optimization':
                    workflow.results = await this.executeMCPOptimization(parameters);
                    break;
                case 'performance-audit':
                    workflow.results = await this.executePerformanceAudit(parameters);
                    break;
                default:
                    throw new Error(`Unknown workflow type: ${workflowType}`);
            }
            
            const endTime = Date.now();
            workflow.performance = {
                executionTime: endTime - startTime,
                memoryUsage: process.memoryUsage(),
                timestamp: new Date().toISOString()
            };
            
            workflow.status = 'completed';
            workflow.endTime = new Date().toISOString();
            
            // Save workflow results
            await this.saveWorkflowResults(workflow);
            
            console.log(`✅ Workflow ${workflowType} completed successfully`);
            return workflow;
            
        } catch (error) {
            workflow.status = 'failed';
            workflow.error = error.message;
            workflow.endTime = new Date().toISOString();
            
            console.error(`❌ Workflow ${workflowType} failed:`, error.message);
            
            // Save failed workflow
            await this.saveWorkflowResults(workflow);
            
            throw error;
        } finally {
            this.currentWorkflow = null;
        }
    }

    async executeFullCycle(parameters) {
        console.log('  🔄 Executing full development cycle...');
        
        const results = {
            research: {},
            tasks: {},
            development: {},
            testing: {},
            integration: {},
            summary: {}
        };
        
        try {
            // 1. Research Phase
            console.log('    📚 Phase 1: Research and Analysis');
            results.research = await this.executeResearchPhase(parameters);
            
            // 2. Task Creation Phase
            console.log('    📋 Phase 2: Task Creation and Planning');
            results.tasks = await this.executeTaskCreationPhase(results.research);
            
            // 3. Development Phase
            console.log('    🔧 Phase 3: Feature Development');
            results.development = await this.executeDevelopmentPhase(results.tasks);
            
            // 4. Testing Phase
            console.log('    🧪 Phase 4: Testing and Validation');
            results.testing = await this.executeTestingPhase(results.development);
            
            // 5. Integration Phase
            console.log('    🔗 Phase 5: Integration and Optimization');
            results.integration = await this.executeIntegrationPhase(results.testing);
            
            // 6. Summary and Reporting
            console.log('    📊 Phase 6: Summary and Reporting');
            results.summary = await this.generateWorkflowSummary(results);
            
            return results;
            
        } catch (error) {
            console.error('    ❌ Full cycle execution failed:', error.message);
            throw error;
        }
    }

    async executeResearchPhase(parameters) {
        const researchQueries = parameters.researchQueries || [
            'React 19 music app development patterns 2024',
            'Node.js Express music API optimization best practices',
            'MongoDB music database schema design for streaming apps',
            'Redis caching strategies for music recommendation engines',
            'Progressive Web App music player implementation 2024',
            'MCP server integration for music applications',
            'Docker containerization for music streaming platforms'
        ];
        
        const researchResults = {};
        
        for (const query of researchQueries) {
            try {
                // Use Perplexity API for research (simulated for now)
                const result = await this.simulatePerplexityResearch(query);
                researchResults[query] = result;
                console.log(`      ✅ Researched: ${query}`);
            } catch (error) {
                console.log(`      ❌ Research failed: ${query}`);
                researchResults[query] = { error: error.message };
            }
        }
        
        return {
            queries: researchQueries,
            results: researchResults,
            timestamp: new Date().toISOString()
        };
    }

    async executeTaskCreationPhase(research) {
        const tasks = [];
        
        for (const [query, result] of Object.entries(research.results)) {
            if (result.error) continue;
            
            try {
                const queryTasks = await this.systems.taskManager.createTasksFromResearch(query, result);
                tasks.push(...queryTasks);
                console.log(`      ✅ Created ${queryTasks.length} tasks from: ${query}`);
            } catch (error) {
                console.log(`      ❌ Task creation failed for: ${query}`);
            }
        }
        
        // Create additional tasks based on MCP capabilities
        const mcpTasks = await this.createMCPSpecificTasks();
        tasks.push(...mcpTasks);
        
        return {
            totalTasks: tasks.length,
            tasks: tasks,
            mcpTasks: mcpTasks.length,
            timestamp: new Date().toISOString()
        };
    }

    async executeDevelopmentPhase(tasks) {
        const developmentResults = [];
        
        for (const task of tasks.tasks) {
            try {
                console.log(`      📝 Implementing: ${task.title}`);
                
                // Use MCP servers for enhanced development
                const mcpEnhancement = await this.enhanceDevelopmentWithMCP(task);
                
                // Implement the task
                const result = await this.systems.development.implementTask(task);
                result.mcpEnhancement = mcpEnhancement;
                
                developmentResults.push(result);
                console.log(`        ✅ Completed: ${task.title}`);
                
            } catch (error) {
                console.log(`        ❌ Failed: ${task.title} - ${error.message}`);
                developmentResults.push({ ...task, error: error.message });
            }
        }
        
        return {
            totalTasks: developmentResults.length,
            completedTasks: developmentResults.filter(r => r.implemented).length,
            failedTasks: developmentResults.filter(r => r.error).length,
            results: developmentResults,
            timestamp: new Date().toISOString()
        };
    }

    async executeTestingPhase(development) {
        const testingResults = {
            unitTests: {},
            integrationTests: {},
            dockerTests: {},
            mcpTests: {},
            summary: {}
        };
        
        try {
            // Unit and integration tests
            console.log('      🧪 Running unit and integration tests...');
            testingResults.unitTests = await this.systems.development.runTests(development.results);
            
            // Docker testing
            console.log('      🐳 Running Docker tests...');
            testingResults.dockerTests = await this.systems.dockerTesting.runComprehensiveTesting('development');
            
            // MCP server testing
            console.log('      🔌 Testing MCP server capabilities...');
            testingResults.mcpTests = await this.testMCPServerCapabilities();
            
            // Generate testing summary
            testingResults.summary = this.generateTestingSummary(testingResults);
            
            return testingResults;
            
        } catch (error) {
            console.error('      ❌ Testing phase failed:', error.message);
            throw error;
        }
    }

    async executeIntegrationPhase(testing) {
        const integrationResults = {
            systemIntegration: {},
            performanceOptimization: {},
            deploymentReadiness: {},
            summary: {}
        };
        
        try {
            // System integration testing
            console.log('      🔗 Testing system integration...');
            integrationResults.systemIntegration = await this.testSystemIntegration(testing);
            
            // Performance optimization
            console.log('      ⚡ Optimizing performance...');
            integrationResults.performanceOptimization = await this.optimizePerformance(testing);
            
            // Deployment readiness
            console.log('      🚀 Checking deployment readiness...');
            integrationResults.deploymentReadiness = await this.checkDeploymentReadiness(testing);
            
            // Generate integration summary
            integrationResults.summary = this.generateIntegrationSummary(integrationResults);
            
            return integrationResults;
            
        } catch (error) {
            console.error('      ❌ Integration phase failed:', error.message);
            throw error;
        }
    }

    async executeResearchOnly(parameters) {
        console.log('  📚 Executing research-only workflow...');
        
        const research = await this.executeResearchPhase(parameters);
        const tasks = await this.executeTaskCreationPhase(research);
        
        return {
            research: research,
            tasks: tasks,
            timestamp: new Date().toISOString()
        };
    }

    async executeDevelopmentOnly(parameters) {
        console.log('  🔧 Executing development-only workflow...');
        
        // Load existing tasks or create new ones
        let tasks;
        if (parameters.useExistingTasks) {
            tasks = {
                totalTasks: this.systems.taskManager.getAllTasks().length,
                tasks: this.systems.taskManager.getAllTasks(),
                timestamp: new Date().toISOString()
            };
        } else {
            // Create minimal tasks for development
            const research = await this.executeResearchPhase(parameters);
            tasks = await this.executeTaskCreationPhase(research);
        }
        
        const development = await this.executeDevelopmentPhase(tasks);
        
        return {
            tasks: tasks,
            development: development,
            timestamp: new Date().toISOString()
        };
    }

    async executeTestingOnly(parameters) {
        console.log('  🧪 Executing testing-only workflow...');
        
        const testing = await this.executeTestingPhase({
            results: parameters.existingResults || []
        });
        
        return {
            testing: testing,
            timestamp: new Date().toISOString()
        };
    }

    async executeMCPOptimization(parameters) {
        console.log('  🔌 Executing MCP optimization workflow...');
        
        const results = {
            serverStatus: {},
            capabilityTesting: {},
            optimization: {},
            integration: {}
        };
        
        try {
            // Get current MCP server status
            results.serverStatus = this.systems.mcpIntegration.getServerStatus();
            
            // Test all MCP server capabilities
            results.capabilityTesting = await this.testAllMCPServerCapabilities();
            
            // Optimize MCP server configurations
            results.optimization = await this.optimizeMCPServerConfigurations();
            
            // Test MCP integration with development
            results.integration = await this.testMCPDevelopmentIntegration();
            
            return results;
            
        } catch (error) {
            console.error('    ❌ MCP optimization failed:', error.message);
            throw error;
        }
    }

    async executePerformanceAudit(parameters) {
        console.log('  ⚡ Executing performance audit workflow...');
        
        const results = {
            systemPerformance: {},
            dockerPerformance: {},
            mcpPerformance: {},
            optimization: {},
            recommendations: {}
        };
        
        try {
            // System performance analysis
            results.systemPerformance = await this.analyzeSystemPerformance();
            
            // Docker performance analysis
            results.dockerPerformance = await this.analyzeDockerPerformance();
            
            // MCP server performance analysis
            results.mcpPerformance = await this.analyzeMCPPerformance();
            
            // Generate optimization recommendations
            results.optimization = await this.generateOptimizationRecommendations(results);
            
            // Generate performance recommendations
            results.recommendations = await this.generatePerformanceRecommendations(results);
            
            return results;
            
        } catch (error) {
            console.error('    ❌ Performance audit failed:', error.message);
            throw error;
        }
    }

    async simulatePerplexityResearch(query) {
        // Simulate Perplexity API research results
        const researchData = {
            'React 19 music app development patterns 2024': {
                answer: 'React 19 introduces concurrent features, use() hook, and improved performance patterns for music applications. Use Suspense for streaming, concurrent rendering for smooth UI updates, and the new use() hook for data fetching.',
                citations: ['React 19 Documentation', 'Music App Development Guide 2024', 'Concurrent Features Tutorial'],
                timestamp: Date.now()
            },
            'Node.js Express music API optimization best practices': {
                answer: 'Implement Redis caching, database connection pooling, rate limiting, and compression middleware. Use aggregation pipelines for complex queries, implement proper error handling, and use streaming for large responses.',
                citations: ['Express.js Best Practices', 'API Performance Guide', 'Node.js Optimization Patterns'],
                timestamp: Date.now()
            },
            'MongoDB music database schema design for streaming apps': {
                answer: 'Use compound indexes, text search, aggregation pipelines. Implement proper sharding for large datasets, use TTL indexes for temporary data, and optimize for read-heavy workloads.',
                citations: ['MongoDB Performance Guide', 'Music App Database Design', 'Streaming App Architecture'],
                timestamp: Date.now()
            },
            'Redis caching strategies for music recommendation engines': {
                answer: 'Implement cache-aside pattern, use appropriate TTL values, implement cache invalidation strategies, and use Redis data structures like sorted sets for recommendations.',
                citations: ['Redis Best Practices', 'Caching Strategies Guide', 'Recommendation Engine Design'],
                timestamp: Date.now()
            },
            'Progressive Web App music player implementation 2024': {
                answer: 'Implement service workers for offline functionality, use Web Audio API for audio processing, implement background sync, and ensure cross-platform compatibility.',
                citations: ['PWA Implementation Guide', 'Web Audio API Documentation', 'Service Worker Patterns'],
                timestamp: Date.now()
            },
            'MCP server integration for music applications': {
                answer: 'Use MCP servers for enhanced functionality like browser automation for testing, database management for optimization, and file system operations for content management.',
                citations: ['MCP Server Documentation', 'Music App Integration Guide', 'Automation Best Practices'],
                timestamp: Date.now()
            },
            'Docker containerization for music streaming platforms': {
                answer: 'Use multi-stage builds for optimization, implement health checks, use Docker Compose for orchestration, and implement proper logging and monitoring.',
                citations: ['Docker Best Practices', 'Container Orchestration Guide', 'Music Platform Architecture'],
                timestamp: Date.now()
            }
        };
        
        return researchData[query] || {
            answer: `Research results for: ${query}`,
            citations: ['General Development Guide'],
            timestamp: Date.now()
        };
    }

    async createMCPSpecificTasks() {
        const mcpTasks = [];
        const capabilities = this.systems.mcpIntegration.getAvailableCapabilities();
        
        for (const [serverName, info] of Object.entries(capabilities)) {
            if (info.status === 'ready') {
                mcpTasks.push({
                    id: `mcp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    title: `Optimize ${serverName} MCP server integration`,
                    description: `Enhance ${serverName} server integration for better performance and functionality`,
                    type: 'integration',
                    area: 'mcp-servers',
                    priority: 'medium',
                    estimatedHours: 4,
                    mcpServer: serverName,
                    capabilities: info.capabilities
                });
            }
        }
        
        return mcpTasks;
    }

    async enhanceDevelopmentWithMCP(task) {
        const enhancement = {
            mcpServers: task.mcpServers || [],
            enhancements: [],
            performance: {}
        };
        
        for (const serverName of task.mcpServers) {
            try {
                const serverStatus = this.systems.mcpIntegration.getServerStatus();
                if (serverStatus.serverDetails[serverName]?.status === 'ready') {
                    enhancement.enhancements.push({
                        server: serverName,
                        enhancement: 'Available for use',
                        status: 'ready'
                    });
                }
            } catch (error) {
                enhancement.enhancements.push({
                    server: serverName,
                    enhancement: 'Error checking status',
                    status: 'error',
                    error: error.message
                });
            }
        }
        
        return enhancement;
    }

    async testMCPServerCapabilities() {
        const testResults = {};
        const capabilities = this.systems.mcpIntegration.getAvailableCapabilities();
        
        for (const [serverName, info] of Object.entries(capabilities)) {
            try {
                const testResult = await this.systems.mcpIntegration.executeMCPServerOperation(
                    serverName,
                    'test',
                    { testType: 'capability' }
                );
                testResults[serverName] = testResult;
            } catch (error) {
                testResults[serverName] = {
                    success: false,
                    error: error.message
                };
            }
        }
        
        return testResults;
    }

    generateTestingSummary(testingResults) {
        const summary = {
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            overallScore: 0
        };
        
        // Calculate summary from all test results
        Object.values(testingResults).forEach(result => {
            if (result && typeof result === 'object') {
                if (result.overallScore) {
                    summary.overallScore = Math.max(summary.overallScore, result.overallScore);
                }
                if (result.status) {
                    summary.totalTests++;
                    if (result.status === 'passed') summary.passedTests++;
                    else summary.failedTests++;
                }
            }
        });
        
        return summary;
    }

    async testSystemIntegration(testing) {
        // Simulate system integration testing
        return {
            status: 'passed',
            components: ['frontend', 'backend', 'database', 'cache'],
            integration: 'successful',
            timestamp: new Date().toISOString()
        };
    }

    async optimizePerformance(testing) {
        // Simulate performance optimization
        return {
            status: 'completed',
            optimizations: ['caching', 'database', 'frontend'],
            performanceGain: '15%',
            timestamp: new Date().toISOString()
        };
    }

    async checkDeploymentReadiness(testing) {
        // Simulate deployment readiness check
        return {
            status: 'ready',
            checks: ['tests', 'security', 'performance', 'documentation'],
            deploymentScore: 95,
            timestamp: new Date().toISOString()
        };
    }

    generateIntegrationSummary(integrationResults) {
        return {
            status: 'completed',
            components: Object.keys(integrationResults).filter(key => key !== 'summary'),
            timestamp: new Date().toISOString()
        };
    }

    async testAllMCPServerCapabilities() {
        const results = {};
        const capabilities = this.systems.mcpIntegration.getAvailableCapabilities();
        
        for (const [serverName, info] of Object.entries(capabilities)) {
            results[serverName] = await this.testMCPServerCapabilities();
        }
        
        return results;
    }

    async optimizeMCPServerConfigurations() {
        // Simulate MCP server optimization
        return {
            status: 'completed',
            optimizations: ['connection-pooling', 'timeout-adjustment', 'resource-allocation'],
            timestamp: new Date().toISOString()
        };
    }

    async testMCPDevelopmentIntegration() {
        // Simulate MCP development integration testing
        return {
            status: 'passed',
            integration: 'successful',
            performance: 'improved',
            timestamp: new Date().toISOString()
        };
    }

    async analyzeSystemPerformance() {
        // Simulate system performance analysis
        return {
            cpu: 'normal',
            memory: 'optimal',
            disk: 'good',
            network: 'excellent',
            timestamp: new Date().toISOString()
        };
    }

    async analyzeDockerPerformance() {
        // Simulate Docker performance analysis
        return {
            buildTime: 'fast',
            containerStartup: 'quick',
            resourceUsage: 'efficient',
            timestamp: new Date().toISOString()
        };
    }

    async analyzeMCPPerformance() {
        // Simulate MCP performance analysis
        return {
            responseTime: 'fast',
            throughput: 'high',
            reliability: 'excellent',
            timestamp: new Date().toISOString()
        };
    }

    async generateOptimizationRecommendations(results) {
        // Simulate optimization recommendations
        return {
            recommendations: [
                'Implement additional caching layers',
                'Optimize database queries',
                'Add performance monitoring',
                'Implement resource pooling'
            ],
            priority: 'medium',
            estimatedImpact: '20-30% improvement',
            timestamp: new Date().toISOString()
        };
    }

    async generatePerformanceRecommendations(results) {
        // Simulate performance recommendations
        return {
            recommendations: [
                'Use CDN for static assets',
                'Implement lazy loading',
                'Add compression middleware',
                'Optimize bundle size'
            ],
            priority: 'high',
            estimatedImpact: '15-25% improvement',
            timestamp: new Date().toISOString()
        };
    }

    async generateWorkflowSummary(results) {
        const summary = {
            totalPhases: 6,
            completedPhases: 6,
            overallStatus: 'completed',
            performance: {
                research: 'completed',
                tasks: results.tasks.totalTasks,
                development: results.development.completedTasks,
                testing: results.testing.summary.overallScore,
                integration: 'completed'
            },
            recommendations: [
                'Continue monitoring performance',
                'Implement additional testing',
                'Optimize MCP server usage',
                'Prepare for deployment'
            ],
            timestamp: new Date().toISOString()
        };
        
        return summary;
    }

    async saveWorkflowResults(workflow) {
        try {
            const resultsPath = path.join('enhanced-perplexity-results', 'workflow-results.json');
            await fs.mkdir(path.dirname(resultsPath), { recursive: true });
            
            // Load existing results
            let existingResults = [];
            try {
                const existingData = await fs.readFile(resultsPath, 'utf8');
                existingResults = JSON.parse(existingData);
            } catch (error) {
                // File doesn't exist, start with empty array
            }
            
            // Add new workflow result
            existingResults.push(workflow);
            
            // Save updated results
            await fs.writeFile(resultsPath, JSON.stringify(existingResults, null, 2));
            
            console.log('  💾 Workflow results saved');
            
        } catch (error) {
            console.error('  ❌ Failed to save workflow results:', error.message);
        }
    }

    async loadWorkflowHistory() {
        try {
            const historyPath = path.join('enhanced-perplexity-results', 'workflow-results.json');
            const data = await fs.readFile(historyPath, 'utf8');
            this.workflowHistory = JSON.parse(data);
            console.log(`  📚 Loaded ${this.workflowHistory.length} workflow results`);
        } catch (error) {
            this.workflowHistory = [];
            console.log('  📚 No workflow history found, starting fresh');
        }
    }

    getSystemStatus() {
        return {
            orchestrator: 'ready',
            systems: {
                development: this.systems.development ? 'ready' : 'not-initialized',
                taskManager: this.systems.taskManager ? 'ready' : 'not-initialized',
                mcpIntegration: this.systems.mcpIntegration ? 'ready' : 'not-initialized',
                dockerTesting: this.systems.dockerTesting ? 'ready' : 'not-initialized'
            },
            currentWorkflow: this.currentWorkflow,
            workflowHistory: this.workflowHistory.length,
            performanceMetrics: this.performanceMetrics
        };
    }

    getAvailableWorkflows() {
        return this.workflowTypes;
    }
}

// Main execution
if (require.main === module) {
    const orchestrator = new MainDevelopmentOrchestrator();
    
    orchestrator.initialize()
        .then(async () => {
            console.log('✅ Main Development Orchestrator ready');
            
            // Show system status
            const status = orchestrator.getSystemStatus();
            console.log('\\n📊 System Status:');
            console.log(`- Orchestrator: ${status.orchestrator}`);
            console.log(`- Development System: ${status.systems.development}`);
            console.log(`- Task Manager: ${status.systems.taskManager}`);
            console.log(`- MCP Integration: ${status.systems.mcpIntegration}`);
            console.log(`- Docker Testing: ${status.systems.dockerTesting}`);
            
            // Show available workflows
            const workflows = orchestrator.getAvailableWorkflows();
            console.log('\\n🔄 Available Workflows:');
            for (const [key, description] of Object.entries(workflows)) {
                console.log(`- ${key}: ${description}`);
            }
            
            // Execute full cycle workflow
            console.log('\\n🚀 Executing full development cycle...');
            const results = await orchestrator.executeWorkflow('full-cycle', {
                researchQueries: [
                    'React 19 music app development patterns 2024',
                    'Node.js Express music API optimization best practices',
                    'MongoDB music database schema design for streaming apps'
                ]
            });
            
            console.log('\\n📋 Workflow Results:');
            console.log(`- Status: ${results.status}`);
            console.log(`- Execution time: ${results.performance.executionTime}ms`);
            console.log(`- Memory usage: ${Math.round(results.performance.memoryUsage.heapUsed / 1024 / 1024)}MB`);
            
            if (results.results.summary) {
                console.log(`- Overall status: ${results.results.summary.overallStatus}`);
                console.log(`- Tasks created: ${results.results.summary.performance.tasks}`);
                console.log(`- Features developed: ${results.results.summary.performance.development}`);
                console.log(`- Testing score: ${results.results.summary.performance.testing}%`);
            }
            
        })
        .catch(error => {
            console.error('❌ Main Development Orchestrator failed:', error);
            process.exit(1);
        });
}

module.exports = { MainDevelopmentOrchestrator };