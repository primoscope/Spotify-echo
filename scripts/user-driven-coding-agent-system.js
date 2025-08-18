#!/usr/bin/env node

/**
 * User-Driven Coding Agent System
 * 
 * Comprehensive system enabling user-driven tasks and actions for coding agents:
 * - Interactive command processing
 * - Perplexity-powered search and research
 * - Log collection and analysis
 * - Real-time coding assistance
 * - Automated task execution
 * 
 * Server: https://primosphere.ninja
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class UserDrivenCodingAgentSystem {
    constructor() {
        this.n8nUrl = 'https://primosphere.ninja';
        this.apiKey = process.env.N8N_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzNjg4N2M4Yy0wMmNhLTQ1ZGMtOGJiYy00OGQ2OTZiOTA2M2EiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1NDgzMDM3LCJleHAiOjE3NTc5OTUyMDB9.YB3-9YlDP4fOgspsenl0wEAUvSYBg8YyLeCUx09AC8w';
        
        this.perplexityApiKey = process.env.PERPLEXITY_API_KEY;
        this.openaiApiKey = process.env.OPENAI_API_KEY;
        this.deepseekApiKey = process.env.DEEPSEEK_API_KEY;
        
        this.userDrivenWorkflows = {
            commandProcessor: {
                name: 'Interactive Command Processor',
                description: 'Process natural language commands from users',
                webhook: '/webhook/process-user-command',
                capabilities: ['natural_language_processing', 'command_interpretation', 'action_routing']
            },
            perplexityResearch: {
                name: 'Perplexity-Powered Research Agent',
                description: 'Conduct intelligent research using Perplexity API',
                webhook: '/webhook/perplexity-research',
                capabilities: ['web_search', 'code_research', 'documentation_analysis', 'trend_analysis']
            },
            logAggregator: {
                name: 'Log Collection and Analysis System',
                description: 'Collect, analyze, and interpret system logs',
                webhook: '/webhook/analyze-logs',
                capabilities: ['log_collection', 'error_analysis', 'performance_monitoring', 'anomaly_detection']
            },
            codeAssistant: {
                name: 'Real-Time Code Assistant',
                description: 'Provide coding assistance and suggestions',
                webhook: '/webhook/code-assistant',
                capabilities: ['code_review', 'bug_detection', 'optimization_suggestions', 'documentation_generation']
            },
            taskOrchestrator: {
                name: 'Automated Task Orchestrator',
                description: 'Execute complex multi-step tasks automatically',
                webhook: '/webhook/orchestrate-task',
                capabilities: ['task_planning', 'execution_monitoring', 'error_handling', 'progress_reporting']
            }
        };

        this.implementationResults = {
            timestamp: new Date().toISOString(),
            workflows_created: [],
            guides_generated: [],
            test_commands: [],
            errors: []
        };

        console.log('🤖 User-Driven Coding Agent System');
        console.log(`🌐 Server: ${this.n8nUrl}`);
        console.log(`🧠 Workflows: ${Object.keys(this.userDrivenWorkflows).length}`);
    }

    async createInteractiveCommandProcessor() {
        console.log('\n🎯 Creating Interactive Command Processor...');

        const workflow = {
            name: 'Interactive Command Processor',
            nodes: [
                {
                    name: 'Command Input',
                    type: 'n8n-nodes-base.webhook',
                    position: [100, 200],
                    parameters: {
                        path: 'process-user-command',
                        httpMethod: 'POST',
                        options: {
                            rawBody: true
                        }
                    }
                },
                {
                    name: 'Parse Command',
                    type: '@kenkaiii/n8n-nodes-supercode.supercode',
                    position: [300, 200],
                    parameters: {
                        language: 'javascript',
                        code: `
                            const userInput = $input.first().json;
                            const command = userInput.command || userInput.message || '';
                            
                            // Command categories and patterns
                            const commandPatterns = {
                                search: /search|find|look up|research|investigate/i,
                                analyze: /analyze|examine|review|check|inspect/i,
                                generate: /generate|create|build|make|develop/i,
                                debug: /debug|fix|troubleshoot|solve|error/i,
                                logs: /logs|logging|monitor|track|observe/i,
                                deploy: /deploy|launch|start|run|execute/i,
                                optimize: /optimize|improve|enhance|speed up/i
                            };
                            
                            let detectedAction = 'general';
                            let priority = 'medium';
                            let context = {};
                            
                            // Detect command type
                            for (const [action, pattern] of Object.entries(commandPatterns)) {
                                if (pattern.test(command)) {
                                    detectedAction = action;
                                    break;
                                }
                            }
                            
                            // Extract context and parameters
                            if (detectedAction === 'search') {
                                context.query = command.replace(/search|find|look up|research|investigate/i, '').trim();
                                priority = 'high';
                            } else if (detectedAction === 'analyze') {
                                context.target = command.replace(/analyze|examine|review|check|inspect/i, '').trim();
                                priority = 'high';
                            } else if (detectedAction === 'logs') {
                                context.logType = 'all';
                                context.timeframe = '1h';
                                priority = 'urgent';
                            }
                            
                            return {
                                originalCommand: command,
                                detectedAction,
                                priority,
                                context,
                                timestamp: new Date().toISOString(),
                                userId: userInput.userId || 'anonymous',
                                sessionId: userInput.sessionId || Date.now().toString()
                            };
                        `
                    }
                },
                {
                    name: 'Route to Specialized Agent',
                    type: 'n8n-nodes-base.switch',
                    position: [500, 200],
                    parameters: {
                        mode: 'expression',
                        options: {
                            rules: [
                                {
                                    expression: '{{ $json.detectedAction === "search" }}',
                                    output: 0
                                },
                                {
                                    expression: '{{ $json.detectedAction === "analyze" }}',
                                    output: 1
                                },
                                {
                                    expression: '{{ $json.detectedAction === "logs" }}',
                                    output: 2
                                },
                                {
                                    expression: '{{ $json.detectedAction === "debug" }}',
                                    output: 3
                                }
                            ]
                        }
                    }
                },
                {
                    name: 'Perplexity Search',
                    type: 'n8n-nodes-base.httpRequest',
                    position: [700, 100],
                    parameters: {
                        method: 'POST',
                        url: 'https://api.perplexity.ai/chat/completions',
                        headers: {
                            'Authorization': 'Bearer {{ $env.PERPLEXITY_API_KEY }}',
                            'Content-Type': 'application/json'
                        },
                        body: {
                            model: 'llama-3.1-sonar-small-128k-online',
                            messages: [
                                {
                                    role: 'user',
                                    content: '{{ $json.context.query }}'
                                }
                            ],
                            max_tokens: 1000,
                            temperature: 0.2
                        }
                    }
                },
                {
                    name: 'Code Analysis',
                    type: 'n8n-nodes-deepseek.deepseek',
                    position: [700, 200],
                    parameters: {
                        operation: 'analyze',
                        prompt: 'Analyze the following code or system: {{ $json.context.target }}',
                        model: 'deepseek-chat',
                        maxTokens: 1500
                    }
                },
                {
                    name: 'Log Collection',
                    type: '@kenkaiii/n8n-nodes-supercode.supercode-tool',
                    position: [700, 300],
                    parameters: {
                        tool: 'log-collector',
                        operation: 'collect-system-logs',
                        config: {
                            sources: ['application', 'system', 'error', 'performance'],
                            timeframe: '{{ $json.context.timeframe }}',
                            format: 'structured'
                        }
                    }
                }
            ]
        };

        this.implementationResults.workflows_created.push(workflow);
        console.log('✅ Interactive Command Processor workflow configured');
        return workflow;
    }

    async createPerplexityResearchAgent() {
        console.log('\n🔍 Creating Perplexity Research Agent...');

        const workflow = {
            name: 'Perplexity Research Agent',
            nodes: [
                {
                    name: 'Research Request',
                    type: 'n8n-nodes-base.webhook',
                    position: [100, 200],
                    parameters: {
                        path: 'perplexity-research',
                        httpMethod: 'POST'
                    }
                },
                {
                    name: 'Prepare Research Query',
                    type: '@kenkaiii/n8n-nodes-supercode.supercode',
                    position: [300, 200],
                    parameters: {
                        language: 'javascript',
                        code: `
                            const request = $input.first().json;
                            const query = request.query;
                            const researchType = request.type || 'general';
                            const depth = request.depth || 'standard';
                            
                            // Enhance query based on research type
                            let enhancedQuery = query;
                            
                            if (researchType === 'code') {
                                enhancedQuery = \`Code research: \${query}. Provide examples, best practices, and documentation links.\`;
                            } else if (researchType === 'api') {
                                enhancedQuery = \`API documentation research: \${query}. Include endpoints, parameters, and usage examples.\`;
                            } else if (researchType === 'troubleshooting') {
                                enhancedQuery = \`Troubleshooting guide: \${query}. Provide step-by-step solutions and common fixes.\`;
                            } else if (researchType === 'trends') {
                                enhancedQuery = \`Technology trends analysis: \${query}. Include recent developments and future outlook.\`;
                            }
                            
                            return {
                                originalQuery: query,
                                enhancedQuery,
                                researchType,
                                depth,
                                timestamp: new Date().toISOString(),
                                requestId: \`research-\${Date.now()}\`
                            };
                        `
                    }
                },
                {
                    name: 'Perplexity API Call',
                    type: 'n8n-nodes-base.httpRequest',
                    position: [500, 200],
                    parameters: {
                        method: 'POST',
                        url: 'https://api.perplexity.ai/chat/completions',
                        headers: {
                            'Authorization': 'Bearer {{ $env.PERPLEXITY_API_KEY }}',
                            'Content-Type': 'application/json'
                        },
                        body: {
                            model: 'llama-3.1-sonar-large-128k-online',
                            messages: [
                                {
                                    role: 'system',
                                    content: 'You are a helpful research assistant. Provide comprehensive, well-structured responses with relevant links and sources.'
                                },
                                {
                                    role: 'user',
                                    content: '{{ $json.enhancedQuery }}'
                                }
                            ],
                            max_tokens: 2000,
                            temperature: 0.1
                        }
                    }
                },
                {
                    name: 'Process Research Results',
                    type: '@kenkaiii/n8n-nodes-supercode.supercode',
                    position: [700, 200],
                    parameters: {
                        language: 'javascript',
                        code: `
                            const researchData = $input.first().json;
                            const previousData = $input.item(0, 1).json; // Get data from previous node
                            
                            const result = {
                                requestId: previousData.requestId,
                                originalQuery: previousData.originalQuery,
                                researchType: previousData.researchType,
                                results: {
                                    content: researchData.choices[0].message.content,
                                    model: researchData.model,
                                    usage: researchData.usage
                                },
                                structured: {
                                    summary: '',
                                    keyPoints: [],
                                    links: [],
                                    codeExamples: []
                                },
                                timestamp: new Date().toISOString()
                            };
                            
                            // Extract structured information
                            const content = result.results.content;
                            
                            // Extract links
                            const linkRegex = /https?:\\/\\/[^\\s\\)]+/g;
                            result.structured.links = content.match(linkRegex) || [];
                            
                            // Extract code blocks
                            const codeRegex = /\`\`\`[\\s\\S]*?\`\`\`/g;
                            result.structured.codeExamples = content.match(codeRegex) || [];
                            
                            // Generate summary (first paragraph)
                            const paragraphs = content.split('\\n\\n');
                            result.structured.summary = paragraphs[0] || content.substring(0, 200);
                            
                            return result;
                        `
                    }
                },
                {
                    name: 'Store Research Results',
                    type: 'n8n-nodes-base.httpRequest',
                    position: [900, 200],
                    parameters: {
                        method: 'POST',
                        url: '{{ $env.MONGODB_WEBHOOK_URL || "http://localhost:3000/api/research-store" }}',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: '{{ JSON.stringify($json) }}'
                    }
                }
            ]
        };

        this.implementationResults.workflows_created.push(workflow);
        console.log('✅ Perplexity Research Agent workflow configured');
        return workflow;
    }

    async createLogAnalysisSystem() {
        console.log('\n📊 Creating Log Analysis System...');

        const workflow = {
            name: 'Log Analysis System',
            nodes: [
                {
                    name: 'Log Analysis Request',
                    type: 'n8n-nodes-base.webhook',
                    position: [100, 200],
                    parameters: {
                        path: 'analyze-logs',
                        httpMethod: 'POST'
                    }
                },
                {
                    name: 'Collect System Logs',
                    type: '@kenkaiii/n8n-nodes-supercode.supercode-tool',
                    position: [300, 200],
                    parameters: {
                        tool: 'system-monitor',
                        operation: 'collect-logs',
                        config: {
                            sources: [
                                '/var/log/nginx/access.log',
                                '/var/log/nginx/error.log',
                                '/var/log/syslog',
                                '{{ $env.APPLICATION_LOG_PATH || "./logs/application.log" }}'
                            ],
                            timeframe: '{{ $json.timeframe || "1h" }}',
                            maxLines: 10000
                        }
                    }
                },
                {
                    name: 'Analyze Log Patterns',
                    type: 'n8n-nodes-deepseek.deepseek',
                    position: [500, 200],
                    parameters: {
                        operation: 'analyze',
                        prompt: `Analyze the following system logs for:
1. Error patterns and frequency
2. Performance issues
3. Security concerns
4. Anomalous behavior
5. Recommended actions

Logs: {{ JSON.stringify($json.logData) }}`,
                        model: 'deepseek-chat',
                        maxTokens: 2000
                    }
                },
                {
                    name: 'Generate Log Report',
                    type: '@kenkaiii/n8n-nodes-supercode.supercode',
                    position: [700, 200],
                    parameters: {
                        language: 'javascript',
                        code: `
                            const logData = $input.item(0, 1).json; // Log collection data
                            const analysis = $input.first().json; // AI analysis
                            
                            const report = {
                                reportId: \`log-analysis-\${Date.now()}\`,
                                timestamp: new Date().toISOString(),
                                timeframe: logData.timeframe,
                                sources: logData.sources,
                                summary: {
                                    totalLogs: logData.totalLines || 0,
                                    errorCount: (logData.logContent.match(/ERROR/g) || []).length,
                                    warningCount: (logData.logContent.match(/WARN/g) || []).length,
                                    criticalCount: (logData.logContent.match(/CRITICAL|FATAL/g) || []).length
                                },
                                aiAnalysis: analysis.analysis || analysis.content,
                                recommendations: [],
                                alerts: []
                            };
                            
                            // Extract recommendations and alerts from AI analysis
                            const analysisText = report.aiAnalysis;
                            
                            // Look for recommendation patterns
                            const recRegex = /recommend[^.]*[.]/gi;
                            report.recommendations = analysisText.match(recRegex) || [];
                            
                            // Determine alert level
                            if (report.summary.criticalCount > 0) {
                                report.alerts.push({
                                    level: 'critical',
                                    message: \`\${report.summary.criticalCount} critical errors detected\`,
                                    timestamp: new Date().toISOString()
                                });
                            }
                            
                            if (report.summary.errorCount > 50) {
                                report.alerts.push({
                                    level: 'high',
                                    message: \`High error rate detected: \${report.summary.errorCount} errors\`,
                                    timestamp: new Date().toISOString()
                                });
                            }
                            
                            return report;
                        `
                    }
                }
            ]
        };

        this.implementationResults.workflows_created.push(workflow);
        console.log('✅ Log Analysis System workflow configured');
        return workflow;
    }

    async createRealTimeCodeAssistant() {
        console.log('\n👨‍💻 Creating Real-Time Code Assistant...');

        const workflow = {
            name: 'Real-Time Code Assistant',
            nodes: [
                {
                    name: 'Code Assistance Request',
                    type: 'n8n-nodes-base.webhook',
                    position: [100, 200],
                    parameters: {
                        path: 'code-assistant',
                        httpMethod: 'POST'
                    }
                },
                {
                    name: 'Analyze Code Context',
                    type: '@kenkaiii/n8n-nodes-supercode.supercode',
                    position: [300, 200],
                    parameters: {
                        language: 'javascript',
                        code: `
                            const request = $input.first().json;
                            const code = request.code || '';
                            const language = request.language || 'javascript';
                            const assistanceType = request.type || 'review';
                            
                            // Analyze code structure
                            const analysis = {
                                language,
                                assistanceType,
                                codeLength: code.length,
                                lineCount: code.split('\\n').length,
                                hasErrors: code.includes('ERROR') || code.includes('error'),
                                complexity: 'medium',
                                frameworks: []
                            };
                            
                            // Detect frameworks/libraries
                            if (code.includes('react') || code.includes('React')) analysis.frameworks.push('React');
                            if (code.includes('express') || code.includes('Express')) analysis.frameworks.push('Express');
                            if (code.includes('mongoose') || code.includes('Mongoose')) analysis.frameworks.push('Mongoose');
                            if (code.includes('axios')) analysis.frameworks.push('Axios');
                            
                            // Determine complexity
                            if (code.length > 5000 || code.includes('class ') || code.includes('async ')) {
                                analysis.complexity = 'high';
                            } else if (code.length < 500) {
                                analysis.complexity = 'low';
                            }
                            
                            return {
                                originalRequest: request,
                                analysis,
                                code,
                                timestamp: new Date().toISOString(),
                                sessionId: request.sessionId || Date.now().toString()
                            };
                        `
                    }
                },
                {
                    name: 'Route by Assistance Type',
                    type: 'n8n-nodes-base.switch',
                    position: [500, 200],
                    parameters: {
                        mode: 'expression',
                        options: {
                            rules: [
                                {
                                    expression: '{{ $json.analysis.assistanceType === "review" }}',
                                    output: 0
                                },
                                {
                                    expression: '{{ $json.analysis.assistanceType === "debug" }}',
                                    output: 1
                                },
                                {
                                    expression: '{{ $json.analysis.assistanceType === "optimize" }}',
                                    output: 2
                                },
                                {
                                    expression: '{{ $json.analysis.assistanceType === "document" }}',
                                    output: 3
                                }
                            ]
                        }
                    }
                },
                {
                    name: 'Code Review',
                    type: 'n8n-nodes-deepseek.deepseek',
                    position: [700, 100],
                    parameters: {
                        operation: 'analyze',
                        prompt: `Review this {{ $json.analysis.language }} code and provide:
1. Code quality assessment
2. Best practices recommendations
3. Potential issues
4. Security considerations
5. Performance suggestions

Code:
{{ $json.code }}`,
                        model: 'deepseek-chat',
                        maxTokens: 1500
                    }
                },
                {
                    name: 'Debug Analysis',
                    type: 'n8n-nodes-deepseek.deepseek',
                    position: [700, 200],
                    parameters: {
                        operation: 'analyze',
                        prompt: `Debug this {{ $json.analysis.language }} code. Identify:
1. Syntax errors
2. Logic issues
3. Runtime problems
4. Missing dependencies
5. Step-by-step fix instructions

Code:
{{ $json.code }}`,
                        model: 'deepseek-chat',
                        maxTokens: 1500
                    }
                },
                {
                    name: 'Performance Optimization',
                    type: 'n8n-nodes-deepseek.deepseek',
                    position: [700, 300],
                    parameters: {
                        operation: 'analyze',
                        prompt: `Optimize this {{ $json.analysis.language }} code for:
1. Performance improvements
2. Memory efficiency
3. Algorithmic optimizations
4. Code refactoring suggestions
5. Provide optimized version

Code:
{{ $json.code }}`,
                        model: 'deepseek-chat',
                        maxTokens: 2000
                    }
                }
            ]
        };

        this.implementationResults.workflows_created.push(workflow);
        console.log('✅ Real-Time Code Assistant workflow configured');
        return workflow;
    }

    async createTaskOrchestrator() {
        console.log('\n🎯 Creating Task Orchestrator...');

        const workflow = {
            name: 'Automated Task Orchestrator',
            nodes: [
                {
                    name: 'Task Request',
                    type: 'n8n-nodes-base.webhook',
                    position: [100, 200],
                    parameters: {
                        path: 'orchestrate-task',
                        httpMethod: 'POST'
                    }
                },
                {
                    name: 'Task Planning',
                    type: '@kenkaiii/n8n-nodes-supercode.supercode',
                    position: [300, 200],
                    parameters: {
                        language: 'javascript',
                        code: `
                            const request = $input.first().json;
                            const task = request.task;
                            const complexity = request.complexity || 'medium';
                            const priority = request.priority || 'normal';
                            
                            // Task templates
                            const taskTemplates = {
                                'deploy_application': {
                                    steps: ['validate_code', 'run_tests', 'build_application', 'deploy_to_server', 'health_check'],
                                    estimatedTime: '15-20 minutes',
                                    dependencies: ['git', 'docker', 'deployment_keys']
                                },
                                'analyze_repository': {
                                    steps: ['clone_repo', 'analyze_structure', 'run_security_scan', 'generate_report'],
                                    estimatedTime: '10-15 minutes',
                                    dependencies: ['git', 'security_tools']
                                },
                                'optimize_database': {
                                    steps: ['analyze_queries', 'check_indexes', 'optimize_schema', 'performance_test'],
                                    estimatedTime: '20-30 minutes',
                                    dependencies: ['database_access', 'monitoring_tools']
                                },
                                'setup_monitoring': {
                                    steps: ['configure_logging', 'setup_metrics', 'create_dashboards', 'test_alerts'],
                                    estimatedTime: '25-35 minutes',
                                    dependencies: ['monitoring_stack', 'alert_channels']
                                }
                            };
                            
                            const template = taskTemplates[task] || {
                                steps: ['analyze_task', 'create_plan', 'execute_steps', 'validate_results'],
                                estimatedTime: '10-15 minutes',
                                dependencies: []
                            };
                            
                            const executionPlan = {
                                taskId: \`task-\${Date.now()}\`,
                                originalTask: task,
                                complexity,
                                priority,
                                steps: template.steps.map((step, index) => ({
                                    id: index + 1,
                                    name: step,
                                    status: 'pending',
                                    startTime: null,
                                    endTime: null,
                                    result: null,
                                    error: null
                                })),
                                estimatedTime: template.estimatedTime,
                                dependencies: template.dependencies,
                                status: 'planned',
                                createdAt: new Date().toISOString()
                            };
                            
                            return executionPlan;
                        `
                    }
                },
                {
                    name: 'Execute Task Steps',
                    type: '@kenkaiii/n8n-nodes-supercode.supercode-tool',
                    position: [500, 200],
                    parameters: {
                        tool: 'task-executor',
                        operation: 'execute-plan',
                        config: {
                            parallelExecution: false,
                            errorHandling: 'continue_on_error',
                            progressReporting: true,
                            timeoutPerStep: 300000 // 5 minutes
                        }
                    }
                },
                {
                    name: 'Monitor Progress',
                    type: 'n8n-nodes-base.httpRequest',
                    position: [700, 200],
                    parameters: {
                        method: 'POST',
                        url: '{{ $env.PROGRESS_WEBHOOK_URL || "http://localhost:3000/api/task-progress" }}',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: '{{ JSON.stringify($json) }}'
                    }
                }
            ]
        };

        this.implementationResults.workflows_created.push(workflow);
        console.log('✅ Task Orchestrator workflow configured');
        return workflow;
    }

    generateUserCommandGuide() {
        return {
            title: 'User-Driven Coding Agent Commands Guide',
            description: 'Interactive commands for controlling the coding agent system',
            baseUrl: this.n8nUrl,
            commands: [
                {
                    category: 'Search & Research',
                    commands: [
                        {
                            command: 'search <query>',
                            description: 'Search for information using Perplexity AI',
                            example: 'curl -X POST "https://primosphere.ninja/webhook/process-user-command" -d \'{"command": "search React hooks best practices"}\'',
                            webhook: '/webhook/process-user-command'
                        },
                        {
                            command: 'research <topic>',
                            description: 'Conduct deep research on a specific topic',
                            example: 'curl -X POST "https://primosphere.ninja/webhook/perplexity-research" -d \'{"query": "Node.js performance optimization", "type": "code", "depth": "detailed"}\'',
                            webhook: '/webhook/perplexity-research'
                        }
                    ]
                },
                {
                    category: 'Code Analysis',
                    commands: [
                        {
                            command: 'analyze code <code_snippet>',
                            description: 'Get AI-powered code analysis and suggestions',
                            example: 'curl -X POST "https://primosphere.ninja/webhook/code-assistant" -d \'{"code": "function example() { return true; }", "type": "review", "language": "javascript"}\'',
                            webhook: '/webhook/code-assistant'
                        },
                        {
                            command: 'debug <code_snippet>',
                            description: 'Debug code and get fix suggestions',
                            example: 'curl -X POST "https://primosphere.ninja/webhook/code-assistant" -d \'{"code": "console.log(undefinedVar)", "type": "debug", "language": "javascript"}\'',
                            webhook: '/webhook/code-assistant'
                        },
                        {
                            command: 'optimize <code_snippet>',
                            description: 'Get performance optimization suggestions',
                            example: 'curl -X POST "https://primosphere.ninja/webhook/code-assistant" -d \'{"code": "for(let i=0; i<arr.length; i++) { ... }", "type": "optimize"}\'',
                            webhook: '/webhook/code-assistant'
                        }
                    ]
                },
                {
                    category: 'System Monitoring',
                    commands: [
                        {
                            command: 'get logs',
                            description: 'Collect and analyze system logs',
                            example: 'curl -X POST "https://primosphere.ninja/webhook/analyze-logs" -d \'{"timeframe": "1h", "sources": ["nginx", "application"]}\'',
                            webhook: '/webhook/analyze-logs'
                        },
                        {
                            command: 'monitor system',
                            description: 'Get system health and performance metrics',
                            example: 'curl -X POST "https://primosphere.ninja/webhook/process-user-command" -d \'{"command": "monitor system performance"}\'',
                            webhook: '/webhook/process-user-command'
                        }
                    ]
                },
                {
                    category: 'Task Automation',
                    commands: [
                        {
                            command: 'deploy application',
                            description: 'Automated application deployment',
                            example: 'curl -X POST "https://primosphere.ninja/webhook/orchestrate-task" -d \'{"task": "deploy_application", "priority": "high"}\'',
                            webhook: '/webhook/orchestrate-task'
                        },
                        {
                            command: 'setup monitoring',
                            description: 'Configure system monitoring and alerts',
                            example: 'curl -X POST "https://primosphere.ninja/webhook/orchestrate-task" -d \'{"task": "setup_monitoring", "complexity": "medium"}\'',
                            webhook: '/webhook/orchestrate-task'
                        }
                    ]
                }
            ],
            interactiveExamples: [
                {
                    scenario: 'Quick Code Review',
                    steps: [
                        'Send code to analysis endpoint',
                        'Receive comprehensive review with suggestions',
                        'Apply recommended changes',
                        'Verify improvements'
                    ],
                    command: 'curl -X POST "https://primosphere.ninja/webhook/code-assistant" -H "Content-Type: application/json" -d \'{"code": "const users = await User.find(); return users;", "type": "review", "language": "javascript"}\''
                },
                {
                    scenario: 'Research and Implementation',
                    steps: [
                        'Research best practices for a technology',
                        'Get code examples and documentation',
                        'Implement suggested solutions',
                        'Debug and optimize the implementation'
                    ],
                    command: 'curl -X POST "https://primosphere.ninja/webhook/perplexity-research" -H "Content-Type: application/json" -d \'{"query": "MongoDB aggregation pipeline optimization", "type": "code", "depth": "detailed"}\''
                }
            ]
        };
    }

    async generateComprehensiveImplementation() {
        console.log('\n🚀 Creating User-Driven Coding Agent System...\n');

        // Create all workflows
        await this.createInteractiveCommandProcessor();
        await this.createPerplexityResearchAgent();
        await this.createLogAnalysisSystem();
        await this.createRealTimeCodeAssistant();
        await this.createTaskOrchestrator();

        // Generate guides and documentation
        const userGuide = this.generateUserCommandGuide();
        
        const testCommands = [
            {
                name: 'Test Command Processing',
                command: `curl -X POST "${this.n8nUrl}/webhook/process-user-command" \\
  -H "Content-Type: application/json" \\
  -d '{
    "command": "search for Node.js memory optimization techniques",
    "userId": "test-user",
    "sessionId": "test-session-1"
  }'`
            },
            {
                name: 'Test Perplexity Research',
                command: `curl -X POST "${this.n8nUrl}/webhook/perplexity-research" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "React performance optimization best practices 2024",
    "type": "code",
    "depth": "detailed"
  }'`
            },
            {
                name: 'Test Log Analysis',
                command: `curl -X POST "${this.n8nUrl}/webhook/analyze-logs" \\
  -H "Content-Type: application/json" \\
  -d '{
    "timeframe": "2h",
    "sources": ["nginx", "application", "system"]
  }'`
            },
            {
                name: 'Test Code Assistant',
                command: `curl -X POST "${this.n8nUrl}/webhook/code-assistant" \\
  -H "Content-Type: application/json" \\
  -d '{
    "code": "async function fetchData() { const response = await fetch(\"/api/data\"); return response.json(); }",
    "type": "review",
    "language": "javascript"
  }'`
            },
            {
                name: 'Test Task Orchestration',
                command: `curl -X POST "${this.n8nUrl}/webhook/orchestrate-task" \\
  -H "Content-Type: application/json" \\
  -d '{
    "task": "deploy_application",
    "priority": "high",
    "complexity": "medium"
  }'`
            }
        ];

        const comprehensiveReport = {
            title: 'User-Driven Coding Agent System Implementation',
            timestamp: new Date().toISOString(),
            server: this.n8nUrl,
            summary: {
                totalWorkflows: this.implementationResults.workflows_created.length,
                capabilities: [
                    'Interactive command processing',
                    'Perplexity-powered research',
                    'Real-time log analysis',
                    'AI code assistance',
                    'Automated task orchestration'
                ],
                estimatedSetupTime: '60-90 minutes'
            },
            workflows: this.implementationResults.workflows_created,
            userGuide,
            testCommands,
            setupInstructions: {
                prerequisites: [
                    'Access to https://primosphere.ninja n8n instance',
                    'Valid API keys for Perplexity, DeepSeek, and OpenAI',
                    'Community nodes installed: @kenkaiii/n8n-nodes-supercode, n8n-nodes-deepseek, n8n-nodes-mcp',
                    'Environment variables configured'
                ],
                steps: [
                    'Login to n8n interface at https://primosphere.ninja',
                    'Verify community nodes are installed and accessible',
                    'Create workflows using the provided configurations',
                    'Configure API credentials in workflow nodes',
                    'Test each workflow using the provided curl commands',
                    'Monitor execution and adjust parameters as needed'
                ]
            },
            advancedFeatures: {
                naturalLanguageProcessing: 'Process user commands in natural language',
                contextAwareAssistance: 'Provide coding assistance based on context analysis',
                realTimeMonitoring: 'Continuous system monitoring and log analysis',
                intelligentRouting: 'Smart routing of requests based on content analysis',
                progressTracking: 'Real-time tracking of multi-step task execution'
            },
            integration: {
                perplexityApi: 'Advanced web search and research capabilities',
                deepseekAi: 'Intelligent code analysis and debugging',
                supercodeNodes: 'Complex data processing and automation',
                mcpProtocol: 'Tool integration and context management'
            }
        };

        // Save comprehensive report
        const reportPath = path.join(process.cwd(), 'reports', `user-driven-coding-agent-system-${Date.now()}.json`);
        await fs.mkdir(path.dirname(reportPath), { recursive: true });
        await fs.writeFile(reportPath, JSON.stringify(comprehensiveReport, null, 2));

        console.log('\n🎉 User-Driven Coding Agent System Implementation Complete!');
        console.log('\n📊 Summary:');
        console.log(`   🤖 Workflows Created: ${this.implementationResults.workflows_created.length}`);
        console.log(`   🔧 User Commands: ${userGuide.commands.reduce((total, cat) => total + cat.commands.length, 0)}`);
        console.log(`   🧪 Test Commands: ${testCommands.length}`);
        console.log(`   ⏱️  Setup Time: 60-90 minutes`);
        console.log(`   💾 Report: ${reportPath}`);

        console.log('\n🚀 Key Capabilities:');
        console.log('   • Interactive command processing with natural language');
        console.log('   • Perplexity-powered research and search');
        console.log('   • Real-time log collection and analysis');
        console.log('   • AI-powered code assistance and debugging');
        console.log('   • Automated multi-step task orchestration');

        console.log('\n📝 Next Steps:');
        console.log('1. Access n8n interface at https://primosphere.ninja');
        console.log('2. Create workflows using provided configurations');
        console.log('3. Configure API keys for external services');
        console.log('4. Test functionality with provided curl commands');
        console.log('5. Start using interactive coding agent capabilities');

        return comprehensiveReport;
    }

    async run() {
        return await this.generateComprehensiveImplementation();
    }
}

// Run the system
if (require.main === module) {
    const system = new UserDrivenCodingAgentSystem();
    system.run().catch(console.error);
}

module.exports = UserDrivenCodingAgentSystem;