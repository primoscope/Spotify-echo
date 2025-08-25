#!/usr/bin/env node

/**
 * REAL TASK MANAGER
 * 
 * ACTUALLY MANAGES DEVELOPMENT TASKS:
 * - Creates real tasks from Perplexity research
 * - Tracks progress and completion
 * - Manages development roadmap
 * - Integrates with MCP servers
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

class RealTaskManager {
    constructor() {
        this.tasks = new Map();
        this.sprints = [];
        this.currentSprint = null;
        this.roadmap = {};
        
        this.taskTypes = {
            feature: 'New feature development',
            bugfix: 'Bug fixes and issues',
            optimization: 'Performance optimization',
            testing: 'Testing and validation',
            documentation: 'Documentation updates',
            refactoring: 'Code refactoring',
            integration: 'MCP server integration',
            deployment: 'Deployment and DevOps'
        };
        
        this.priorities = ['critical', 'high', 'medium', 'low'];
        this.statuses = ['backlog', 'planned', 'in-progress', 'review', 'testing', 'done'];
        
        this.developmentAreas = {
            frontend: ['components', 'pages', 'styles', 'accessibility', 'performance', 'pwa'],
            backend: ['api', 'database', 'security', 'performance', 'middleware', 'utils'],
            integration: ['mcp-servers', 'external-apis', 'database-connections', 'real-time'],
            testing: ['unit-tests', 'integration-tests', 'e2e-tests', 'performance-tests'],
            deployment: ['docker', 'ci-cd', 'monitoring', 'logging', 'scaling']
        };
    }

    async initialize() {
        console.log('🚀 Initializing REAL Task Manager...');
        await this.loadTasks();
        await this.loadSprints();
        await this.loadRoadmap();
        console.log('✅ Task Manager ready to manage real development work!');
    }

    async createTasksFromResearch(researchQuery, researchResults) {
        console.log(`📚 Creating tasks from research: ${researchQuery}`);
        
        try {
            // Parse research and create actionable tasks
            const tasks = this.parseResearchIntoTasks(researchQuery, researchResults);
            
            // Add tasks to system
            for (const task of tasks) {
                this.tasks.set(task.id, task);
            }
            
            // Save tasks
            await this.saveTasks();
            
            console.log(`  ✅ Created ${tasks.length} tasks from research`);
            return tasks;
            
        } catch (error) {
            console.error(`  ❌ Failed to create tasks: ${error.message}`);
            return [];
        }
    }

    parseResearchIntoTasks(query, research) {
        const tasks = [];
        const timestamp = Date.now();
        
        // Parse research content to identify actionable items
        const content = research?.answer || research?.content || query;
        
        // Look for specific patterns that indicate tasks
        const patterns = [
            { regex: /implement|create|build|develop/i, type: 'feature' },
            { regex: /optimize|improve|enhance/i, type: 'optimization' },
            { regex: /test|validate|verify/i, type: 'testing' },
            { regex: /fix|resolve|correct/i, type: 'bugfix' },
            { regex: /document|write|explain/i, type: 'documentation' },
            { regex: /refactor|restructure|reorganize/i, type: 'refactoring' },
            { regex: /integrate|connect|link/i, type: 'integration' },
            { regex: /deploy|docker|ci-cd/i, type: 'deployment' }
        ];
        
        // Extract sentences that contain task indicators
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
        
        for (let i = 0; i < sentences.length; i++) {
            const sentence = sentences[i].trim();
            
            for (const pattern of patterns) {
                if (pattern.regex.test(sentence)) {
                    const task = this.createTaskFromSentence(sentence, pattern.type, query, timestamp + i);
                    if (task) {
                        tasks.push(task);
                        break; // Only create one task per sentence
                    }
                }
            }
        }
        
        // If no specific tasks found, create general tasks based on query
        if (tasks.length === 0) {
            tasks.push(this.createGeneralTask(query, timestamp));
        }
        
        return tasks;
    }

    createTaskFromSentence(sentence, type, source, timestamp) {
        // Clean up sentence for task title
        let title = sentence.replace(/^[A-Za-z\s]+(?:should|must|need to|can)\s+/i, '');
        title = title.replace(/[.!?]+$/, '').trim();
        
        if (title.length < 10 || title.length > 100) return null;
        
        // Determine development area
        const area = this.determineDevelopmentArea(sentence);
        
        return {
            id: `task-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
            title: title.charAt(0).toUpperCase() + title.slice(1),
            description: sentence,
            type: type,
            area: area,
            priority: this.determinePriority(sentence),
            status: 'backlog',
            source: source,
            createdAt: new Date().toISOString(),
            estimatedHours: this.estimateEffort(type, sentence),
            assignee: null,
            tags: this.extractTags(sentence),
            dependencies: [],
            progress: 0,
            timeSpent: 0,
            timeRemaining: 0,
            mcpServers: this.identifyMCPServers(sentence)
        };
    }

    createGeneralTask(query, timestamp) {
        const queryWords = query.toLowerCase().split(' ');
        
        let type = 'feature';
        if (queryWords.includes('test') || queryWords.includes('testing')) type = 'testing';
        if (queryWords.includes('fix') || queryWords.includes('bug')) type = 'bugfix';
        if (queryWords.includes('optimize') || queryWords.includes('performance')) type = 'optimization';
        if (queryWords.includes('integrate') || queryWords.includes('mcp')) type = 'integration';
        
        const area = this.determineDevelopmentArea(query);
        
        return {
            id: `task-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
            title: `Research and implement: ${query}`,
            description: `Based on research query: ${query}`,
            type: type,
            area: area,
            priority: 'medium',
            status: 'backlog',
            source: query,
            createdAt: new Date().toISOString(),
            estimatedHours: 8,
            assignee: null,
            tags: ['research', 'implementation'],
            dependencies: [],
            progress: 0,
            timeSpent: 0,
            timeRemaining: 0,
            mcpServers: this.identifyMCPServers(query)
        };
    }

    determineDevelopmentArea(sentence) {
        const lowerSentence = sentence.toLowerCase();
        
        if (lowerSentence.includes('react') || lowerSentence.includes('frontend') || lowerSentence.includes('component')) {
            return 'frontend';
        } else if (lowerSentence.includes('node') || lowerSentence.includes('api') || lowerSentence.includes('backend') || lowerSentence.includes('database')) {
            return 'backend';
        } else if (lowerSentence.includes('mcp') || lowerSentence.includes('integration') || lowerSentence.includes('connect')) {
            return 'integration';
        } else if (lowerSentence.includes('test') || lowerSentence.includes('testing') || lowerSentence.includes('validate')) {
            return 'testing';
        } else if (lowerSentence.includes('deploy') || lowerSentence.includes('docker') || lowerSentence.includes('ci-cd')) {
            return 'deployment';
        } else {
            return 'backend'; // Default to backend
        }
    }

    determinePriority(sentence) {
        const lowerSentence = sentence.toLowerCase();
        
        if (lowerSentence.includes('critical') || lowerSentence.includes('urgent') || lowerSentence.includes('security')) {
            return 'critical';
        } else if (lowerSentence.includes('important') || lowerSentence.includes('high') || lowerSentence.includes('priority')) {
            return 'high';
        } else if (lowerSentence.includes('low') || lowerSentence.includes('minor') || lowerSentence.includes('nice to have')) {
            return 'low';
        } else {
            return 'medium';
        }
    }

    estimateEffort(type, sentence) {
        const lowerSentence = sentence.toLowerCase();
        
        // Base effort by type
        let baseEffort = {
            'feature': 8,
            'bugfix': 2,
            'optimization': 4,
            'testing': 3,
            'documentation': 2,
            'refactoring': 6,
            'integration': 6,
            'deployment': 4
        }[type] || 4;
        
        // Adjust based on complexity indicators
        if (lowerSentence.includes('simple') || lowerSentence.includes('basic')) {
            baseEffort = Math.max(1, baseEffort * 0.5);
        } else if (lowerSentence.includes('complex') || lowerSentence.includes('advanced') || lowerSentence.includes('comprehensive')) {
            baseEffort = baseEffort * 1.5;
        }
        
        return Math.round(baseEffort);
    }

    extractTags(sentence) {
        const tags = [];
        const lowerSentence = sentence.toLowerCase();
        
        // Technology tags
        if (lowerSentence.includes('react') || lowerSentence.includes('frontend')) tags.push('frontend');
        if (lowerSentence.includes('node') || lowerSentence.includes('api') || lowerSentence.includes('backend')) tags.push('backend');
        if (lowerSentence.includes('database') || lowerSentence.includes('mongodb')) tags.push('database');
        if (lowerSentence.includes('redis') || lowerSentence.includes('cache')) tags.push('caching');
        if (lowerSentence.includes('test') || lowerSentence.includes('testing')) tags.push('testing');
        if (lowerSentence.includes('performance') || lowerSentence.includes('optimization')) tags.push('performance');
        if (lowerSentence.includes('security') || lowerSentence.includes('auth')) tags.push('security');
        if (lowerSentence.includes('mcp') || lowerSentence.includes('integration')) tags.push('mcp');
        if (lowerSentence.includes('docker') || lowerSentence.includes('deploy')) tags.push('deployment');
        
        return tags;
    }

    identifyMCPServers(sentence) {
        const lowerSentence = sentence.toLowerCase();
        const mcpServers = [];
        
        // Identify relevant MCP servers based on sentence content
        if (lowerSentence.includes('database') || lowerSentence.includes('mongodb') || lowerSentence.includes('postgresql')) {
            mcpServers.push('postgresql', 'sqlite');
        }
        if (lowerSentence.includes('github') || lowerSentence.includes('repository')) {
            mcpServers.push('github-repos-manager');
        }
        if (lowerSentence.includes('browser') || lowerSentence.includes('web') || lowerSentence.includes('automation')) {
            mcpServers.push('browser-automation', 'browserbase');
        }
        if (lowerSentence.includes('file') || lowerSentence.includes('filesystem')) {
            mcpServers.push('filesystem');
        }
        if (lowerSentence.includes('memory') || lowerSentence.includes('cache')) {
            mcpServers.push('memory');
        }
        if (lowerSentence.includes('analytics') || lowerSentence.includes('metrics')) {
            mcpServers.push('analytics-server');
        }
        
        return mcpServers;
    }

    async updateTaskStatus(taskId, newStatus, updates = {}) {
        const task = this.tasks.get(taskId);
        if (!task) {
            throw new Error(`Task not found: ${taskId}`);
        }
        
        // Update task
        Object.assign(task, updates);
        task.status = newStatus;
        task.updatedAt = new Date().toISOString();
        
        // Handle status-specific updates
        if (newStatus === 'in-progress' && !task.startedAt) {
            task.startedAt = new Date().toISOString();
        } else if (newStatus === 'done' && !task.completedAt) {
            task.completedAt = new Date().toISOString();
            task.progress = 100;
        }
        
        // Save changes
        await this.saveTasks();
        
        console.log(`  ✅ Updated task ${taskId} to ${newStatus}`);
        return task;
    }

    async addTimeToTask(taskId, hours, description = '') {
        const task = this.tasks.get(taskId);
        if (!task) {
            throw new Error(`Task not found: ${taskId}`);
        }
        
        // Add time entry
        if (!task.timeEntries) task.timeEntries = [];
        task.timeEntries.push({
            date: new Date().toISOString(),
            hours: hours,
            description: description
        });
        
        // Update totals
        task.timeSpent = (task.timeSpent || 0) + hours;
        task.timeRemaining = Math.max(0, (task.estimatedHours || 0) - task.timeSpent);
        
        // Update progress based on time spent
        if (task.estimatedHours > 0) {
            task.progress = Math.min(100, Math.round((task.timeSpent / task.estimatedHours) * 100));
        }
        
        await this.saveTasks();
        return task;
    }

    async createSprint(name, startDate, endDate, goals = []) {
        const sprint = {
            id: `sprint-${Date.now()}`,
            name: name,
            startDate: startDate,
            endDate: endDate,
            goals: goals,
            tasks: [],
            status: 'planned',
            createdAt: new Date().toISOString()
        };
        
        this.sprints.push(sprint);
        await this.saveSprints();
        
        console.log(`  ✅ Created sprint: ${name}`);
        return sprint;
    }

    async addTaskToSprint(taskId, sprintId) {
        const task = this.tasks.get(taskId);
        const sprint = this.sprints.find(s => s.id === sprintId);
        
        if (!task) throw new Error(`Task not found: ${taskId}`);
        if (!sprint) throw new Error(`Sprint not found: ${sprintId}`);
        
        // Remove from other sprints
        for (const s of this.sprints) {
            s.tasks = s.tasks.filter(t => t !== taskId);
        }
        
        // Add to target sprint
        sprint.tasks.push(taskId);
        task.sprintId = sprintId;
        
        await this.saveSprints();
        await this.saveTasks();
        
        console.log(`  ✅ Added task ${taskId} to sprint ${sprint.name}`);
        return { task, sprint };
    }

    async generateSprintReport(sprintId) {
        const sprint = this.sprints.find(s => s.id === sprintId);
        if (!sprint) throw new Error(`Sprint not found: ${sprintId}`);
        
        const sprintTasks = sprint.tasks.map(id => this.tasks.get(id)).filter(Boolean);
        
        const report = {
            sprint: sprint,
            totalTasks: sprintTasks.length,
            completedTasks: sprintTasks.filter(t => t.status === 'done').length,
            inProgressTasks: sprintTasks.filter(t => t.status === 'in-progress').length,
            backlogTasks: sprintTasks.filter(t => t.status === 'backlog').length,
            totalEstimatedHours: sprintTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0),
            totalTimeSpent: sprintTasks.reduce((sum, t) => sum + (t.timeSpent || 0), 0),
            progress: sprintTasks.length > 0 ? 
                Math.round((sprintTasks.filter(t => t.status === 'done').length / sprintTasks.length) * 100) : 0,
            tasksByStatus: this.groupTasksByStatus(sprintTasks),
            tasksByPriority: this.groupTasksByPriority(sprintTasks),
            tasksByType: this.groupTasksByType(sprintTasks),
            tasksByArea: this.groupTasksByArea(sprintTasks)
        };
        
        return report;
    }

    groupTasksByStatus(tasks) {
        const groups = {};
        for (const task of tasks) {
            if (!groups[task.status]) groups[task.status] = [];
            groups[task.status].push(task);
        }
        return groups;
    }

    groupTasksByPriority(tasks) {
        const groups = {};
        for (const task of tasks) {
            if (!groups[task.priority]) groups[task.priority] = [];
            groups[task.priority].push(task);
        }
        return groups;
    }

    groupTasksByType(tasks) {
        const groups = {};
        for (const task of tasks) {
            if (!groups[task.type]) groups[task.type] = [];
            groups[task.type].push(task);
        }
        return groups;
    }

    groupTasksByArea(tasks) {
        const groups = {};
        for (const task of tasks) {
            if (!groups[task.area]) groups[task.area] = [];
            groups[task.area].push(task);
        }
        return groups;
    }

    async generateRoadmap() {
        const allTasks = Array.from(this.tasks.values());
        
        this.roadmap = {
            lastUpdated: new Date().toISOString(),
            totalTasks: allTasks.length,
            completedTasks: allTasks.filter(t => t.status === 'done').length,
            inProgressTasks: allTasks.filter(t => t.status === 'in-progress').length,
            backlogTasks: allTasks.filter(t => t.status === 'backlog').length,
            totalEstimatedHours: allTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0),
            totalTimeSpent: allTasks.reduce((sum, t) => sum + (t.timeSpent || 0), 0),
            completionRate: allTasks.length > 0 ? 
                Math.round((allTasks.filter(t => t.status === 'done').length / allTasks.length) * 100) : 0,
            nextMilestone: this.calculateNextMilestone(allTasks),
            priorities: this.calculatePriorityBreakdown(allTasks),
            types: this.calculateTypeBreakdown(allTasks),
            areas: this.calculateAreaBreakdown(allTasks),
            tags: this.calculateTagBreakdown(allTasks),
            mcpServers: this.calculateMCPServerBreakdown(allTasks)
        };
        
        await this.saveRoadmap();
        return this.roadmap;
    }

    calculateNextMilestone(tasks) {
        const completed = tasks.filter(t => t.status === 'done').length;
        const total = tasks.length;
        
        if (total === 0) return 'No tasks defined';
        
        const completionRate = completed / total;
        
        if (completionRate < 0.25) return 'Complete core features';
        if (completionRate < 0.5) return 'Implement testing and validation';
        if (completionRate < 0.75) return 'Performance optimization';
        if (completionRate < 0.9) return 'Final testing and documentation';
        return 'Ready for deployment';
    }

    calculatePriorityBreakdown(tasks) {
        const breakdown = {};
        for (const priority of this.priorities) {
            breakdown[priority] = tasks.filter(t => t.priority === priority).length;
        }
        return breakdown;
    }

    calculateTypeBreakdown(tasks) {
        const breakdown = {};
        for (const type of Object.keys(this.taskTypes)) {
            breakdown[type] = tasks.filter(t => t.type === type).length;
        }
        return breakdown;
    }

    calculateAreaBreakdown(tasks) {
        const breakdown = {};
        for (const area of Object.keys(this.developmentAreas)) {
            breakdown[area] = tasks.filter(t => t.area === area).length;
        }
        return breakdown;
    }

    calculateTagBreakdown(tasks) {
        const breakdown = {};
        for (const task of tasks) {
            for (const tag of task.tags || []) {
                breakdown[tag] = (breakdown[tag] || 0) + 1;
            }
        }
        return breakdown;
    }

    calculateMCPServerBreakdown(tasks) {
        const breakdown = {};
        for (const task of tasks) {
            for (const server of task.mcpServers || []) {
                breakdown[server] = (breakdown[server] || 0) + 1;
            }
        }
        return breakdown;
    }

    async loadTasks() {
        try {
            const tasksPath = path.join('enhanced-perplexity-results', 'real-tasks.json');
            const data = await fs.readFile(tasksPath, 'utf8');
            const tasksData = JSON.parse(data);
            
            // Convert array back to Map
            this.tasks = new Map();
            for (const task of tasksData.tasks || []) {
                this.tasks.set(task.id, task);
            }
        } catch (error) {
            this.tasks = new Map();
        }
    }

    async saveTasks() {
        try {
            const tasksPath = path.join('enhanced-perplexity-results', 'real-tasks.json');
            await fs.mkdir(path.dirname(tasksPath), { recursive: true });
            
            const tasksData = {
                tasks: Array.from(this.tasks.values()),
                lastUpdated: new Date().toISOString()
            };
            
            await fs.writeFile(tasksPath, JSON.stringify(tasksData, null, 2));
        } catch (error) {
            console.error('Failed to save tasks:', error.message);
        }
    }

    async loadRoadmap() {
        try {
            const roadmapPath = path.join('enhanced-perplexity-results', 'real-roadmap.json');
            const data = await fs.readFile(roadmapPath, 'utf8');
            this.roadmap = JSON.parse(data);
        } catch (error) {
            this.roadmap = {};
        }
    }

    async saveRoadmap() {
        try {
            const roadmapPath = path.join('enhanced-perplexity-results', 'real-roadmap.json');
            await fs.mkdir(path.dirname(roadmapPath), { recursive: true });
            await fs.writeFile(roadmapPath, JSON.stringify(this.roadmap, null, 2));
        } catch (error) {
            console.error('Failed to save roadmap:', error.message);
        }
    }

    async loadSprints() {
        try {
            const sprintsPath = path.join('enhanced-perplexity-results', 'real-sprints.json');
            const data = await fs.readFile(sprintsPath, 'utf8');
            this.sprints = JSON.parse(data);
        } catch (error) {
            this.sprints = [];
        }
    }

    async saveSprints() {
        try {
            const sprintsPath = path.join('enhanced-perplexity-results', 'real-sprints.json');
            await fs.mkdir(path.dirname(sprintsPath), { recursive: true });
            await fs.writeFile(sprintsPath, JSON.stringify(this.sprints, null, 2));
        } catch (error) {
            console.error('Failed to save sprints:', error.message);
        }
    }

    getTaskById(taskId) {
        return this.tasks.get(taskId);
    }

    getAllTasks() {
        return Array.from(this.tasks.values());
    }

    getTasksByStatus(status) {
        return Array.from(this.tasks.values()).filter(t => t.status === status);
    }

    getTasksByPriority(priority) {
        return Array.from(this.tasks.values()).filter(t => t.priority === priority);
    }

    getTasksByType(type) {
        return Array.from(this.tasks.values()).filter(t => t.type === type);
    }

    getTasksByArea(area) {
        return Array.from(this.tasks.values()).filter(t => t.area === area);
    }

    getTasksByTag(tag) {
        return Array.from(this.tasks.values()).filter(t => (t.tags || []).includes(tag));
    }

    getTasksByMCPServer(server) {
        return Array.from(this.tasks.values()).filter(t => (t.mcpServers || []).includes(server));
    }
}

// Main execution
if (require.main === module) {
    const taskManager = new RealTaskManager();
    
    taskManager.initialize()
        .then(async () => {
            console.log('✅ REAL Task Manager ready');
            
            // Create tasks from research
            const tasks = await taskManager.createTasksFromResearch(
                'Implement React 19 music player with Material-UI and real-time features using MCP servers',
                {
                    answer: 'React 19 introduces concurrent features, use() hook, and improved performance patterns. Use Suspense for streaming, concurrent rendering for smooth UI updates. Integrate with MCP servers for enhanced functionality.',
                    citations: ['React 19 Documentation', 'MCP Integration Guide'],
                    timestamp: Date.now()
                }
            );
            
            console.log('\n📋 Created Tasks:');
            for (const task of tasks) {
                console.log(`- ${task.title} (${task.type}, ${task.area}, ${task.priority})`);
                if (task.mcpServers.length > 0) {
                    console.log(`  MCP Servers: ${task.mcpServers.join(', ')}`);
                }
            }
            
            // Create a sprint
            const sprint = await taskManager.createSprint(
                'Music Player Sprint 1',
                new Date().toISOString(),
                new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                ['Build core music player', 'Implement real-time features', 'Add MCP integration', 'Add testing']
            );
            
            // Add tasks to sprint
            for (const task of tasks) {
                await taskManager.addTaskToSprint(task.id, sprint.id);
            }
            
            // Generate reports
            const roadmap = await taskManager.generateRoadmap();
            const sprintReport = await taskManager.generateSprintReport(sprint.id);
            
            console.log('\n📊 Roadmap:');
            console.log(`- Total tasks: ${roadmap.totalTasks}`);
            console.log(`- Completion rate: ${roadmap.completionRate}%`);
            console.log(`- Next milestone: ${roadmap.nextMilestone}`);
            
            console.log('\n📋 Sprint Report:');
            console.log(`- Sprint: ${sprintReport.sprint.name}`);
            console.log(`- Progress: ${sprintReport.progress}%`);
            console.log(`- Tasks: ${sprintReport.completedTasks}/${sprintReport.totalTasks} completed`);
        })
        .catch(error => {
            console.error('❌ REAL Task Manager failed:', error);
            process.exit(1);
        });
}

module.exports = { RealTaskManager };