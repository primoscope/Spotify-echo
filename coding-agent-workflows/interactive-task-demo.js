#!/usr/bin/env node

/**
 * INTERACTIVE TASK CREATION DEMONSTRATION
 * 
 * Demonstrates the REAL WORKING TASK CREATION SYSTEM
 * Shows how tasks are created, managed, and tracked
 */

const { RealTaskManager } = require('./real-task-manager.js');
const readline = require('readline');

class InteractiveTaskDemo {
    constructor() {
        this.taskManager = null;
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async initialize() {
        console.log('🎯 EchoTune AI - Interactive Task Creation Demo');
        console.log('=' .repeat(60));
        
        try {
            this.taskManager = new RealTaskManager();
            await this.taskManager.initialize();
            console.log('✅ Task Manager initialized successfully!\n');
        } catch (error) {
            console.error('❌ Failed to initialize Task Manager:', error.message);
            process.exit(1);
        }
    }

    async runDemo() {
        console.log('🚀 Starting Interactive Task Creation Demo...\n');
        
        // Demo 1: Create tasks from research
        await this.demoTaskCreation();
        
        // Demo 2: Sprint management
        await this.demoSprintManagement();
        
        // Demo 3: Task updates and tracking
        await this.demoTaskUpdates();
        
        // Demo 4: Roadmap generation
        await this.demoRoadmapGeneration();
        
        // Demo 5: Advanced features
        await this.demoAdvancedFeatures();
        
        console.log('\n🎉 Demo completed successfully!');
        console.log('📊 Check the generated files in enhanced-perplexity-results/ directory');
        
        this.rl.close();
    }

    async demoTaskCreation() {
        console.log('📋 DEMO 1: Task Creation from Research');
        console.log('-'.repeat(40));
        
        const researchQueries = [
            'Implement real-time music streaming with WebRTC and Web Audio API',
            'Build AI-powered music recommendation engine using TensorFlow.js',
            'Create Progressive Web App with offline music playback support',
            'Implement secure user authentication with JWT and OAuth 2.0',
            'Add comprehensive error handling and logging system'
        ];
        
        for (let i = 0; i < researchQueries.length; i++) {
            const query = researchQueries[i];
            console.log(`\n🔍 Research Query ${i + 1}: ${query}`);
            
            // Simulate research results
            const researchResults = {
                answer: `Research results for: ${query}. This involves implementing advanced features and optimizations.`,
                citations: [`Research Guide ${i + 1}`, `Best Practices ${i + 1}`],
                timestamp: Date.now()
            };
            
            try {
                const tasks = await this.taskManager.createTasksFromResearch(query, researchResults);
                console.log(`  ✅ Created ${tasks.length} tasks from research`);
                
                // Show task details
                for (const task of tasks) {
                    console.log(`    📝 ${task.title} (${task.type}, ${task.area}, ${task.priority})`);
                    console.log(`        Estimated: ${task.estimatedHours}h | Tags: ${task.tags.join(', ')}`);
                }
                
                // Wait for user to see results
                await this.waitForUser('Press Enter to continue...');
                
            } catch (error) {
                console.log(`  ❌ Failed to create tasks: ${error.message}`);
            }
        }
    }

    async demoSprintManagement() {
        console.log('\n🏃‍♂️ DEMO 2: Sprint Management');
        console.log('-'.repeat(40));
        
        const sprintData = [
            {
                name: 'Real-time Streaming Sprint',
                goals: ['Implement WebRTC streaming', 'Add Web Audio API support', 'Performance optimization'],
                duration: 14
            },
            {
                name: 'AI Recommendation Sprint',
                goals: ['Build ML pipeline', 'Integrate TensorFlow.js', 'Add recommendation algorithms'],
                duration: 21
            },
            {
                name: 'PWA & Offline Sprint',
                goals: ['Service worker implementation', 'Offline storage', 'App manifest'],
                duration: 10
            }
        ];
        
        for (const sprintInfo of sprintData) {
            console.log(`\n📅 Creating Sprint: ${sprintInfo.name}`);
            
            try {
                const startDate = new Date().toISOString();
                const endDate = new Date(Date.now() + sprintInfo.duration * 24 * 60 * 60 * 1000).toISOString();
                
                const sprint = await this.taskManager.createSprint(
                    sprintInfo.name,
                    startDate,
                    endDate,
                    sprintInfo.goals
                );
                
                console.log(`  ✅ Sprint created: ${sprint.name}`);
                console.log(`  📅 Duration: ${sprintInfo.duration} days`);
                console.log(`  🎯 Goals: ${sprint.goals.length} goals set`);
                
                // Add some tasks to the sprint
                const availableTasks = this.taskManager.getAllTasks().filter(t => !t.sprintId);
                if (availableTasks.length > 0) {
                    const tasksToAdd = availableTasks.slice(0, Math.min(3, availableTasks.length));
                    for (const task of tasksToAdd) {
                        await this.taskManager.addTaskToSprint(task.id, sprint.id);
                        console.log(`    ✅ Added task: ${task.title}`);
                    }
                }
                
                await this.waitForUser('Press Enter to continue...');
                
            } catch (error) {
                console.log(`  ❌ Failed to create sprint: ${error.message}`);
            }
        }
    }

    async demoTaskUpdates() {
        console.log('\n🔄 DEMO 3: Task Updates and Tracking');
        console.log('-'.repeat(40));
        
        const allTasks = this.taskManager.getAllTasks();
        if (allTasks.length === 0) {
            console.log('No tasks available for updates');
            return;
        }
        
        console.log(`📊 Total tasks available: ${allTasks.length}`);
        
        // Update some tasks to show progress
        const tasksToUpdate = allTasks.slice(0, Math.min(3, allTasks.length));
        
        for (const task of tasksToUpdate) {
            console.log(`\n📝 Updating task: ${task.title}`);
            
            try {
                // Update status to in-progress
                await this.taskManager.updateTaskStatus(task.id, 'in-progress', {
                    assignee: 'demo@echotune.ai',
                    startedAt: new Date().toISOString()
                });
                console.log(`  ✅ Status updated to: in-progress`);
                
                // Add some time to the task
                const timeSpent = Math.random() * 3 + 1; // 1-4 hours
                await this.taskManager.addTimeToTask(task.id, timeSpent, 'Development work in progress');
                console.log(`  ⏱️ Added ${timeSpent.toFixed(1)} hours of work`);
                
                // Update status to review
                await this.taskManager.updateTaskStatus(task.id, 'review', {
                    reviewer: 'reviewer@echotune.ai',
                    reviewStartedAt: new Date().toISOString()
                });
                console.log(`  ✅ Status updated to: review`);
                
                await this.waitForUser('Press Enter to continue...');
                
            } catch (error) {
                console.log(`  ❌ Failed to update task: ${error.message}`);
            }
        }
    }

    async demoRoadmapGeneration() {
        console.log('\n📈 DEMO 4: Roadmap Generation');
        console.log('-'.repeat(40));
        
        try {
            console.log('🔍 Generating comprehensive development roadmap...');
            const roadmap = await this.taskManager.generateRoadmap();
            
            console.log('\n📊 ROADMAP SUMMARY:');
            console.log(`  📋 Total Tasks: ${roadmap.totalTasks}`);
            console.log(`  ✅ Completed: ${roadmap.completedTasks}`);
            console.log(`  🔄 In Progress: ${roadmap.inProgressTasks}`);
            console.log(`  📝 Backlog: ${roadmap.backlogTasks}`);
            console.log(`  ⏱️ Total Estimated Hours: ${roadmap.totalEstimatedHours}`);
            console.log(`  📈 Completion Rate: ${roadmap.completionRate}%`);
            console.log(`  🎯 Next Milestone: ${roadmap.nextMilestone}`);
            
            console.log('\n📊 PRIORITY BREAKDOWN:');
            for (const [priority, count] of Object.entries(roadmap.priorities)) {
                if (count > 0) {
                    console.log(`  ${priority.toUpperCase()}: ${count} tasks`);
                }
            }
            
            console.log('\n📊 TYPE BREAKDOWN:');
            for (const [type, count] of Object.entries(roadmap.types)) {
                if (count > 0) {
                    console.log(`  ${type}: ${count} tasks`);
                }
            }
            
            console.log('\n📊 AREA BREAKDOWN:');
            for (const [area, count] of Object.entries(roadmap.areas)) {
                if (count > 0) {
                    console.log(`  ${area}: ${count} tasks`);
                }
            }
            
            await this.waitForUser('Press Enter to continue...');
            
        } catch (error) {
            console.log(`  ❌ Failed to generate roadmap: ${error.message}`);
        }
    }

    async demoAdvancedFeatures() {
        console.log('\n🚀 DEMO 5: Advanced Features');
        console.log('-'.repeat(40));
        
        // Show task filtering capabilities
        console.log('🔍 Task Filtering Capabilities:');
        
        const allTasks = this.taskManager.getAllTasks();
        if (allTasks.length > 0) {
            // Filter by status
            const backlogTasks = this.taskManager.getTasksByStatus('backlog');
            const inProgressTasks = this.taskManager.getTasksByStatus('in-progress');
            const reviewTasks = this.taskManager.getTasksByStatus('review');
            
            console.log(`  📝 Backlog tasks: ${backlogTasks.length}`);
            console.log(`  🔄 In-progress tasks: ${inProgressTasks.length}`);
            console.log(`  👀 Review tasks: ${reviewTasks.length}`);
            
            // Filter by priority
            const mediumPriorityTasks = this.taskManager.getTasksByPriority('medium');
            console.log(`  ⚖️ Medium priority tasks: ${mediumPriorityTasks.length}`);
            
            // Filter by area
            const frontendTasks = this.taskManager.getTasksByArea('frontend');
            const integrationTasks = this.taskManager.getTasksByArea('integration');
            console.log(`  🎨 Frontend tasks: ${frontendTasks.length}`);
            console.log(`  🔌 Integration tasks: ${integrationTasks.length}`);
            
            // Filter by tag
            const performanceTasks = this.taskManager.getTasksByTag('performance');
            const mcpTasks = this.taskManager.getTasksByTag('mcp');
            console.log(`  ⚡ Performance tasks: ${performanceTasks.length}`);
            console.log(`  🔌 MCP tasks: ${mcpTasks.length}`);
        }
        
        // Show sprint reporting
        console.log('\n📋 Sprint Reporting:');
        const sprints = this.taskManager.sprints;
        for (const sprint of sprints) {
            try {
                const report = await this.taskManager.generateSprintReport(sprint.id);
                console.log(`  📊 ${sprint.name}: ${report.progress}% complete (${report.completedTasks}/${report.totalTasks} tasks)`);
            } catch (error) {
                console.log(`  ❌ Failed to generate report for ${sprint.name}`);
            }
        }
        
        await this.waitForUser('Press Enter to continue...');
    }

    async waitForUser(prompt) {
        return new Promise((resolve) => {
            this.rl.question(prompt, () => {
                resolve();
            });
        });
    }
}

// Main execution
if (require.main === module) {
    const demo = new InteractiveTaskDemo();
    
    demo.initialize()
        .then(() => demo.runDemo())
        .catch(error => {
            console.error('❌ Demo failed:', error);
            process.exit(1);
        });
}

module.exports = { InteractiveTaskDemo };