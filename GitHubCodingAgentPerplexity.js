#!/usr/bin/env node

/**
 * GITHUB CODING AGENT PERPLEXITY INTEGRATION
 * 
 * Optimized for GitHub coding agent automation workflows:
 * 1. Coding agent completes tasks on roadmap
 * 2. Perplexity analyzes repository and roadmap with sonar-pro/sonar-deepsearch
 * 3. Research provides updated roadmap for continued automation
 * 
 * Models: sonar-pro (advanced), sonar-deepsearch (comprehensive research)
 * Environment: Real API calls only - NO MOCK implementations
 */

const https = require('https');
const fs = require('fs').promises;
const path = require('path');

class GitHubCodingAgentPerplexity {
    constructor(apiKey = null) {
        this.apiKey = apiKey || process.env.PERPLEXITY_API_KEY;
        this.baseUrl = 'https://api.perplexity.ai';
        
        // Verified working models for automation (updated with confirmed working models)
        this.models = {
            sonarPro: 'sonar-pro',                    // Advanced search & reasoning
            sonar: 'sonar'                            // Fast basic queries
        };
        
        // Automation workflow configuration (using only verified models)
        this.automationConfig = {
            repositoryAnalysisModel: 'sonar-pro',     // Use sonar-pro for deep analysis
            roadmapAnalysisModel: 'sonar-pro',
            taskGenerationModel: 'sonar-pro',
            quickQueriesModel: 'sonar'
        };
        
        // Session tracking for automation cycles
        this.session = {
            startTime: new Date().toISOString(),
            queries: [],
            costs: 0,
            roadmapUpdates: 0,
            tasksGenerated: 0
        };
        
        if (!this.apiKey) {
            throw new Error('❌ Perplexity API key required for GitHub coding agent automation');
        }
        
        console.log('🤖 GitHub Coding Agent Perplexity Integration initialized');
        console.log(`🔑 API Key: ${this.apiKey.substring(0, 10)}...`);
        console.log(`🧠 Repository Analysis: ${this.automationConfig.repositoryAnalysisModel}`);
        console.log(`📋 Roadmap Analysis: ${this.automationConfig.roadmapAnalysisModel}`);
    }

    /**
     * Core API request method with automation optimization
     */
    async makeAutomationRequest(prompt, options = {}) {
        const model = options.model || this.models.sonarPro;
        const queryId = `query_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        
        console.log(`🔍 [${queryId}] Starting automation query with model: ${model}`);
        console.log(`📝 Prompt length: ${prompt.length} characters`);
        
        const messages = [
            {
                role: 'system',
                content: options.systemPrompt || 'You are an expert software development analyst helping with GitHub repository automation and roadmap planning. Provide actionable, specific insights for immediate implementation.'
            },
            {
                role: 'user',
                content: prompt
            }
        ];

        return new Promise((resolve, reject) => {
            const payload = {
                model: model,
                messages: messages,
                max_tokens: options.maxTokens || 2000,
                temperature: options.temperature || 0.2,
                stream: false
            };

            const postData = JSON.stringify(payload);
            const requestOptions = {
                hostname: 'api.perplexity.ai',
                port: 443,
                path: '/chat/completions',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const startTime = Date.now();
            
            const req = https.request(requestOptions, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    const responseTime = Date.now() - startTime;
                    
                    try {
                        const response = JSON.parse(data);
                        
                        if (res.statusCode === 200) {
                            const result = {
                                success: true,
                                content: response.choices[0]?.message?.content || '',
                                model: model,
                                usage: response.usage,
                                responseTime: responseTime,
                                queryId: queryId,
                                timestamp: new Date().toISOString()
                            };
                            
                            // Track session metrics
                            this.session.queries.push({
                                queryId,
                                model,
                                responseTime,
                                promptLength: prompt.length,
                                outputLength: result.content.length
                            });
                            
                            console.log(`✅ [${queryId}] Success: ${responseTime}ms, ${result.content.length} chars`);
                            resolve(result);
                            
                        } else {
                            const errorMsg = `API Error ${res.statusCode}: ${response.error?.message || 'Unknown error'}`;
                            console.error(`❌ [${queryId}] ${errorMsg}`);
                            reject(new Error(errorMsg));
                        }
                    } catch (error) {
                        console.error(`❌ [${queryId}] Response parsing failed:`, error.message);
                        reject(new Error(`Response parsing failed: ${error.message}`));
                    }
                });
            });

            req.on('error', (error) => {
                console.error(`❌ [${queryId}] Request failed:`, error.message);
                reject(new Error(`Request failed: ${error.message}`));
            });

            req.write(postData);
            req.end();
        });
    }

    /**
     * Analyze repository for coding agent automation
     * Uses sonar-deepsearch for comprehensive analysis
     */
    async analyzeRepositoryForAutomation(repositoryContext) {
        console.log('\n🔬 REPOSITORY ANALYSIS FOR AUTOMATION');
        console.log('=====================================');
        
        const analysisPrompt = `Analyze this GitHub repository for coding agent automation and development optimization:

REPOSITORY CONTEXT:
${repositoryContext}

ANALYSIS REQUIREMENTS:
1. **Architecture Assessment**: Current stack, patterns, optimization opportunities
2. **Automation Opportunities**: Areas where coding agents can be most effective
3. **Technical Debt**: Priority issues that should be addressed in roadmap
4. **Development Workflow**: CI/CD, testing, deployment optimization
5. **Integration Possibilities**: APIs, services, tools that could enhance automation
6. **Performance Bottlenecks**: Database, API, frontend optimization priorities
7. **Security Considerations**: Authentication, data protection, vulnerability management

OUTPUT FORMAT:
- Executive Summary (2-3 sentences)
- Priority Automation Areas (ranked list)
- Technical Recommendations (actionable items)
- Integration Opportunities (specific services/tools)
- Next Steps (immediate actions for coding agent)

Focus on 2025 best practices and current technology trends. Be specific and actionable.`;

        try {
            const result = await this.makeAutomationRequest(analysisPrompt, {
                model: this.automationConfig.repositoryAnalysisModel,
                maxTokens: 3000,
                temperature: 0.1,
                systemPrompt: 'You are a senior software architect specializing in repository analysis and automation optimization. Provide comprehensive, actionable insights for coding agent workflows.'
            });
            
            if (result.success) {
                console.log(`📊 Repository Analysis Complete: ${result.content.length} characters`);
                
                // Save analysis for reference
                await this.saveAnalysis('repository-analysis', result.content);
                
                return {
                    success: true,
                    analysis: result.content,
                    insights: this.extractAutomationInsights(result.content),
                    queryId: result.queryId,
                    model: result.model
                };
            }
            
            return { success: false, error: 'Analysis request failed' };
            
        } catch (error) {
            console.error('❌ Repository analysis failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Analyze current roadmap and generate updates
     * Uses sonar-pro for roadmap analysis and task generation
     */
    async analyzeRoadmapForUpdates(roadmapContent, repositoryAnalysis = null) {
        console.log('\n📋 ROADMAP ANALYSIS FOR UPDATES');
        console.log('================================');
        
        const roadmapPrompt = `Analyze current development roadmap and generate updates based on 2025 technology trends and best practices:

CURRENT ROADMAP:
${roadmapContent}

${repositoryAnalysis ? `REPOSITORY INSIGHTS:
${repositoryAnalysis}` : ''}

ANALYSIS GOALS:
1. **Gap Analysis**: Missing features, technologies, or improvements
2. **Priority Optimization**: Reorder tasks based on impact and automation potential
3. **New Task Generation**: 8-12 specific, actionable tasks for coding agents
4. **Technology Updates**: Current frameworks, tools, APIs, best practices
5. **Automation Enhancement**: Tasks that leverage coding agent capabilities
6. **Integration Opportunities**: APIs, services, platforms to integrate

TASK GENERATION REQUIREMENTS:
- Each task must be specific and implementable
- Include effort estimation (Small: 1-2h, Medium: 4-8h, Large: 1-3d)
- Specify priority level (P0: Critical, P1: High, P2: Medium)
- Include automation potential (High/Medium/Low)
- Reference current 2025 technologies and practices

OUTPUT FORMAT:
# Roadmap Analysis Summary
## Current State Assessment
## Recommended Updates
## New Tasks for Implementation

### New Tasks:
1. [PRIORITY] Task Name - Description (Effort: SIZE, Automation: LEVEL)
   - Implementation details
   - Success criteria
   - Dependencies

Be specific, actionable, and focused on immediate implementation.`;

        try {
            const result = await this.makeAutomationRequest(roadmapPrompt, {
                model: this.automationConfig.roadmapAnalysisModel,
                maxTokens: 3500,
                temperature: 0.3,
                systemPrompt: 'You are a technical product manager specializing in development roadmaps and coding agent task generation. Create actionable, specific tasks that can be implemented immediately.'
            });
            
            if (result.success) {
                console.log(`📈 Roadmap Analysis Complete: ${result.content.length} characters`);
                
                // Extract and count new tasks
                const newTasks = this.extractNewTasks(result.content);
                this.session.tasksGenerated += newTasks.length;
                this.session.roadmapUpdates += 1;
                
                // Save analysis
                await this.saveAnalysis('roadmap-analysis', result.content);
                
                console.log(`✅ Generated ${newTasks.length} new automation-ready tasks`);
                
                return {
                    success: true,
                    analysis: result.content,
                    newTasks: newTasks,
                    taskCount: newTasks.length,
                    queryId: result.queryId,
                    model: result.model
                };
            }
            
            return { success: false, error: 'Roadmap analysis failed' };
            
        } catch (error) {
            console.error('❌ Roadmap analysis failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Complete automation workflow: Repository → Roadmap → Tasks
     */
    async runCompleteAutomationWorkflow(repositoryContext, roadmapContent) {
        console.log('\n🚀 COMPLETE AUTOMATION WORKFLOW');
        console.log('================================');
        console.log('Phase 1: Repository Analysis → Phase 2: Roadmap Updates → Phase 3: Task Generation');
        
        const workflowResults = {
            startTime: new Date().toISOString(),
            repositoryAnalysis: null,
            roadmapAnalysis: null,
            totalTasks: 0,
            success: false
        };
        
        try {
            // Phase 1: Analyze repository
            console.log('\n📊 Phase 1: Repository Analysis');
            workflowResults.repositoryAnalysis = await this.analyzeRepositoryForAutomation(repositoryContext);
            
            if (!workflowResults.repositoryAnalysis.success) {
                throw new Error('Repository analysis failed');
            }
            
            // Phase 2: Analyze and update roadmap
            console.log('\n📋 Phase 2: Roadmap Analysis & Updates');
            workflowResults.roadmapAnalysis = await this.analyzeRoadmapForUpdates(
                roadmapContent, 
                workflowResults.repositoryAnalysis.insights
            );
            
            if (!workflowResults.roadmapAnalysis.success) {
                throw new Error('Roadmap analysis failed');
            }
            
            workflowResults.totalTasks = workflowResults.roadmapAnalysis.taskCount;
            workflowResults.success = true;
            workflowResults.endTime = new Date().toISOString();
            
            // Generate workflow summary
            const summary = this.generateWorkflowSummary(workflowResults);
            await this.saveWorkflowReport(workflowResults, summary);
            
            console.log('\n✅ AUTOMATION WORKFLOW COMPLETE');
            console.log(`📊 Repository insights: Generated`);
            console.log(`📋 Roadmap updates: ${workflowResults.totalTasks} new tasks`);
            console.log(`⚡ Ready for coding agent automation`);
            
            return workflowResults;
            
        } catch (error) {
            console.error('❌ Automation workflow failed:', error.message);
            workflowResults.error = error.message;
            workflowResults.success = false;
            return workflowResults;
        }
    }

    /**
     * Quick automation status check
     */
    async quickAutomationCheck() {
        console.log('\n⚡ QUICK AUTOMATION STATUS CHECK');
        
        const checkPrompt = `Provide a quick assessment of current software development automation trends and GitHub coding agent best practices for 2025:

FOCUS AREAS:
1. Most effective automation patterns for GitHub repositories
2. Latest coding agent integration techniques
3. Current best practices for roadmap automation
4. Key technologies and tools trending in 2025
5. Immediate optimization opportunities for development workflows

Provide concise, actionable insights in bullet points. Focus on immediate implementation opportunities.`;

        try {
            const result = await this.makeAutomationRequest(checkPrompt, {
                model: this.automationConfig.quickQueriesModel,
                maxTokens: 1000,
                temperature: 0.2,
                systemPrompt: 'You are an automation specialist providing quick insights on GitHub coding agent best practices.'
            });
            
            if (result.success) {
                console.log('✅ Quick automation check complete');
                return {
                    success: true,
                    insights: result.content,
                    timestamp: result.timestamp
                };
            }
            
            return { success: false, error: 'Quick check failed' };
            
        } catch (error) {
            console.error('❌ Quick automation check failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Extract automation insights from analysis
     */
    extractAutomationInsights(analysisContent) {
        const insights = [];
        const lines = analysisContent.split('\n');
        
        let currentSection = null;
        for (const line of lines) {
            if (line.includes('Automation') && line.includes(':')) {
                currentSection = 'automation';
            } else if (line.includes('Recommendations') && line.includes(':')) {
                currentSection = 'recommendations';
            } else if (line.includes('Integration') && line.includes(':')) {
                currentSection = 'integration';
            } else if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
                if (currentSection) {
                    insights.push({
                        section: currentSection,
                        insight: line.trim().replace(/^[-*]\s*/, '')
                    });
                }
            }
        }
        
        return insights.slice(0, 10); // Top 10 insights
    }

    /**
     * Extract new tasks from roadmap analysis
     */
    extractNewTasks(roadmapContent) {
        const tasks = [];
        const lines = roadmapContent.split('\n');
        
        let inTaskSection = false;
        let currentTask = null;
        
        for (const line of lines) {
            if (line.includes('New Tasks') || line.includes('Tasks:')) {
                inTaskSection = true;
                continue;
            }
            
            if (inTaskSection) {
                // Match task pattern: number. [PRIORITY] Task Name - Description
                const taskMatch = line.match(/^\d+\.\s*\[([^\]]+)\]\s*(.+?)\s*-\s*(.+)/);
                if (taskMatch) {
                    const [, priority, name, description] = taskMatch;
                    currentTask = {
                        priority: priority.trim(),
                        name: name.trim(),
                        description: description.trim(),
                        details: []
                    };
                    tasks.push(currentTask);
                } else if (line.trim().startsWith('-') && currentTask) {
                    currentTask.details.push(line.trim().replace(/^-\s*/, ''));
                }
            }
        }
        
        return tasks;
    }

    /**
     * Generate workflow summary
     */
    generateWorkflowSummary(results) {
        return {
            timestamp: new Date().toISOString(),
            duration: results.endTime ? new Date(results.endTime) - new Date(results.startTime) : null,
            repositoryAnalysisSuccess: results.repositoryAnalysis?.success || false,
            roadmapAnalysisSuccess: results.roadmapAnalysis?.success || false,
            tasksGenerated: results.totalTasks,
            totalQueries: this.session.queries.length,
            averageResponseTime: this.session.queries.reduce((sum, q) => sum + q.responseTime, 0) / this.session.queries.length,
            success: results.success
        };
    }

    /**
     * Save analysis to file for reference
     */
    async saveAnalysis(type, content) {
        try {
            const filename = `perplexity-${type}-${Date.now()}.md`;
            const filepath = path.join(process.cwd(), filename);
            
            const fullContent = `# ${type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
Generated: ${new Date().toISOString()}
Model: ${this.automationConfig[type.replace('-', '') + 'Model'] || 'sonar-pro'}

${content}

---
Generated by GitHubCodingAgentPerplexity v1.0`;
            
            await fs.writeFile(filepath, fullContent);
            console.log(`💾 Analysis saved: ${filename}`);
            
        } catch (error) {
            console.warn('⚠️ Failed to save analysis:', error.message);
        }
    }

    /**
     * Save complete workflow report
     */
    async saveWorkflowReport(results, summary) {
        try {
            const reportData = {
                metadata: {
                    generated: new Date().toISOString(),
                    version: '1.0',
                    workflow: 'complete-automation'
                },
                summary,
                results,
                session: this.session
            };
            
            const filename = `automation-workflow-report-${Date.now()}.json`;
            await fs.writeFile(filename, JSON.stringify(reportData, null, 2));
            
            console.log(`📋 Workflow report saved: ${filename}`);
            
        } catch (error) {
            console.warn('⚠️ Failed to save workflow report:', error.message);
        }
    }

    /**
     * Get session statistics
     */
    getSessionStats() {
        return {
            startTime: this.session.startTime,
            queriesExecuted: this.session.queries.length,
            tasksGenerated: this.session.tasksGenerated,
            roadmapUpdates: this.session.roadmapUpdates,
            averageResponseTime: this.session.queries.length > 0 
                ? Math.round(this.session.queries.reduce((sum, q) => sum + q.responseTime, 0) / this.session.queries.length)
                : 0,
            totalOutputChars: this.session.queries.reduce((sum, q) => sum + (q.outputLength || 0), 0)
        };
    }
}

// Export for use in automation workflows
module.exports = GitHubCodingAgentPerplexity;

// CLI execution for testing
if (require.main === module) {
    async function testAutomationIntegration() {
        console.log('🧪 TESTING GITHUB CODING AGENT PERPLEXITY INTEGRATION');
        console.log('======================================================');
        
        try {
            const automation = new GitHubCodingAgentPerplexity();
            
            // Test with sample repository context
            const sampleRepo = `
EchoTune AI - Advanced Music Recommendation Platform
- Tech Stack: Node.js, React, MongoDB, Redis, Python ML
- Features: Spotify integration, AI recommendations, conversational chat
- Current Status: 26% complete, 38 tasks in roadmap
- Recent: Enhanced Perplexity API integration completed
- Focus: Autonomous coding agent automation and roadmap optimization
`;
            
            const sampleRoadmap = `
# Current Development Roadmap
## Completed (10/38 tasks)
- Spotify API integration
- Basic recommendation engine
- MongoDB setup
- Perplexity API integration

## In Progress (28 tasks)
- Enhanced chat interface
- Advanced ML models
- User authentication
- Performance optimization

## Planned
- Mobile app development
- Social features
- Advanced analytics
`;

            // Run complete automation workflow
            const results = await automation.runCompleteAutomationWorkflow(sampleRepo, sampleRoadmap);
            
            // Display results
            console.log('\n📊 AUTOMATION TEST RESULTS:');
            console.log('============================');
            console.log(`✅ Workflow Success: ${results.success}`);
            console.log(`📊 Repository Analysis: ${results.repositoryAnalysis?.success ? 'SUCCESS' : 'FAILED'}`);
            console.log(`📋 Roadmap Analysis: ${results.roadmapAnalysis?.success ? 'SUCCESS' : 'FAILED'}`);
            console.log(`🎯 New Tasks Generated: ${results.totalTasks}`);
            
            const stats = automation.getSessionStats();
            console.log(`📈 Session Stats: ${stats.queriesExecuted} queries, ${stats.averageResponseTime}ms avg response`);
            
            if (results.success) {
                console.log('\n🎉 INTEGRATION TEST SUCCESSFUL - READY FOR AUTOMATION!');
            } else {
                console.log('\n❌ INTEGRATION TEST FAILED - CHECK CONFIGURATION');
            }
            
        } catch (error) {
            console.error('❌ Test failed:', error.message);
            process.exit(1);
        }
    }
    
    testAutomationIntegration();
}