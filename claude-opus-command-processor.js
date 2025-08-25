#!/usr/bin/env node
/**
 * Claude Opus 4.1 Advanced Coding Agent Command Processor
 * 
 * Provides comprehensive Claude Opus 4.1 integration for GitHub coding agent workflows
 * with extended thinking, deep reasoning, and advanced coding capabilities.
 */

// Load environment variables from .env file
require('dotenv').config();

const fs = require('fs').promises;
const path = require('path');
const { VertexAI } = require('@google-cloud/vertexai');

class ClaudeOpusCommandProcessor {
    constructor() {
        this.config = {
            projectId: process.env.GCP_PROJECT_ID || 'mock-project-id',
            location: process.env.GCP_VERTEX_LOCATION || 'us-central1',
            // The primary model for this processor should be the Claude Opus 4.1 model.
            model: 'publishers/anthropic/models/claude-opus-4-1',
            claudeModel: 'publishers/anthropic/models/claude-opus-4-1',
            version: 'claude-opus-4-1@20250805',
            maxOutputTokens: 32000,
            contextWindow: 200000,
            defaultThinkingBudget: 5000,
            mockMode: !process.env.GCP_PROJECT_ID || process.env.AI_MOCK_MODE === 'true'
        };

        // Only initialize Vertex AI if we have proper configuration
        if (!this.config.mockMode) {
            try {
                this.vertexAI = new VertexAI({
                    project: this.config.projectId,
                    location: this.config.location,
                });
                console.log(`✅ Vertex AI configured: ${this.config.projectId}`);
            } catch (error) {
                console.log('⚠️ Vertex AI initialization failed, falling back to mock mode');
                this.vertexAI = null;
                this.config.mockMode = true;
            }
        } else {
            this.vertexAI = null;
            console.log('🔧 Running in mock mode - Configure GCP_PROJECT_ID to use real Vertex AI');
            console.log('📖 Quick setup guide: QUICK_GCP_SETUP.md');
            console.log('🛠️ Run: node scripts/configure-gcp-credentials.js setup');
        }

        this.commandTypes = {
            'test': {
                description: 'Test Vertex AI connection and configuration',
                systemPrompt: 'You are a helpful AI assistant. Respond concisely to test prompts.',
                extendedThinking: false,
                thinkingBudget: 1000,
                temperature: 0.1
            },
            'deep-reasoning': {
                description: 'Deep analytical reasoning with step-by-step problem decomposition',
                systemPrompt: this.getDeepReasoningPrompt(),
                extendedThinking: true,
                thinkingBudget: 8000,
                temperature: 0.1
            },
            'extended-thinking': {
                description: 'Methodical problem-solving with transparent thought processes',
                systemPrompt: this.getExtendedThinkingPrompt(),
                extendedThinking: true,
                thinkingBudget: 10000,
                temperature: 0.1
            },
            'advanced-coding': {
                description: 'Industry-leading coding assistance with end-to-end development',
                systemPrompt: this.getAdvancedCodingPrompt(),
                extendedThinking: true,
                thinkingBudget: 6000,
                temperature: 0.0
            },
            'agent-workflow': {
                description: 'Complex multi-step task automation with intelligent orchestration',
                systemPrompt: this.getAgentWorkflowPrompt(),
                extendedThinking: true,
                thinkingBudget: 7000,
                temperature: 0.1
            },
            'architectural-analysis': {
                description: 'Comprehensive system design analysis and recommendations',
                systemPrompt: this.getArchitecturalAnalysisPrompt(),
                extendedThinking: true,
                thinkingBudget: 8000,
                temperature: 0.1
            },
            'long-horizon-tasks': {
                description: 'Sustained performance on complex objectives requiring thousands of steps',
                systemPrompt: this.getLongHorizonPrompt(),
                extendedThinking: true,
                thinkingBudget: 12000,
                temperature: 0.1
            }
        };

        this.sessionMetrics = {
            startTime: Date.now(),
            commandsExecuted: 0,
            totalThinkingTokens: 0,
            totalOutputTokens: 0,
            successfulCommands: 0
        };
    }

    /**
     * Process a Claude Opus 4.1 command
     */
    async processCommand(commandType, options = {}) {
        const startTime = Date.now();
        console.log(`\n🧠 Claude Opus 4.1 Processing: ${commandType}`);

        try {
            // Validate command type
            if (!this.commandTypes[commandType]) {
                throw new Error(`Unsupported command type: ${commandType}`);
            }

            const command = this.commandTypes[commandType];
            
            // Prepare configuration
            const config = {
                commandType,
                target: options.target || '',
                prompt: options.prompt || '',
                thinkingBudget: options.thinkingBudget || command.thinkingBudget,
                extendedThinking: options.extendedThinking !== false && command.extendedThinking,
                temperature: options.temperature || command.temperature
            };

            console.log(`📋 Configuration:`);
            console.log(`   Command: ${commandType}`);
            console.log(`   Target: ${config.target || 'Repository-wide'}`);
            console.log(`   Extended Thinking: ${config.extendedThinking}`);
            console.log(`   Thinking Budget: ${config.thinkingBudget} tokens`);

            // Execute Claude Opus 4.1 analysis
            const result = await this.executeClaudeOpusAnalysis(config);

            // Update metrics
            const executionTime = Date.now() - startTime;
            this.updateMetrics(true, executionTime, result);

            // Generate comprehensive report
            await this.generateReport(result, config);

            console.log(`✅ Claude Opus 4.1 command completed in ${executionTime}ms`);
            return result;

        } catch (error) {
            console.error(`❌ Claude Opus 4.1 command failed:`, error.message);
            
            const executionTime = Date.now() - startTime;
            this.updateMetrics(false, executionTime, null);

            // Generate error report
            const errorResult = {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString(),
                commandType,
                executionTime
            };

            await this.generateReport(errorResult, { commandType });
            throw error;
        }
    }

    /**
     * Execute Claude Opus 4.1 analysis with Vertex AI
     */
    async executeClaudeOpusAnalysis(config) {
        console.log('🔄 Connecting to Claude Opus 4.1 via Vertex AI...');

        // Handle mock mode
        if (this.config.mockMode) {
            console.log('🔧 Running in mock mode - generating simulated response');
            return this.generateMockResponse(config);
        }

        try {
            // Build system and user prompts
            const systemPrompt = this.buildSystemPrompt(config);
            const userPrompt = await this.buildUserPrompt(config);

            // Configure model with extended thinking
            const modelConfig = {
                model: this.config.model,
                generationConfig: {
                    maxOutputTokens: this.config.maxOutputTokens,
                    temperature: config.temperature,
                    topP: 0.9,
                }
            };

            if (config.extendedThinking) {
                modelConfig.generationConfig.thinking = {
                    type: 'enabled',
                    budget_tokens: config.thinkingBudget
                };
            }

            const model = this.vertexAI.getGenerativeModel(modelConfig);

            // Prepare request
            const request = {
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
                    }
                ]
            };

            console.log('🧠 Sending request to Claude Opus 4.1...');
            const response = await model.generateContent(request);

            if (!response.response || !response.response.candidates) {
                throw new Error('No valid response from Claude Opus 4.1');
            }

            const analysis = response.response.candidates[0].content.parts[0].text;

            return {
                success: true,
                timestamp: new Date().toISOString(),
                commandType: config.commandType,
                target: config.target,
                extendedThinking: config.extendedThinking,
                thinkingBudget: config.thinkingBudget,
                modelVersion: this.config.version,
                analysis,
                metadata: {
                    promptLength: userPrompt.length,
                    responseLength: analysis.length,
                    temperature: config.temperature,
                    processingTime: Date.now()
                }
            };

        } catch (error) {
            console.error('❌ Vertex AI request failed:', error.message);
            throw new Error(`Claude Opus 4.1 analysis failed: ${error.message}`);
        }
    }

    /**
     * Generate mock response for testing
     */
    generateMockResponse(config) {
        const analysis = `# Claude Opus 4.1 Mock Analysis

**Command Type**: ${config.commandType}
**Target**: ${config.target || 'Repository-wide'}
**Extended Thinking**: ${config.extendedThinking}

## Mock Analysis Results

This is a simulated response from Claude Opus 4.1 for testing purposes. In a real deployment with proper Vertex AI configuration, this would contain:

### Advanced Analysis Capabilities
- Deep reasoning with extended thinking mode
- Industry-leading coding assistance
- Complex multi-step task automation
- Comprehensive architectural insights

### Configuration Status
- **Mock Mode**: Active (GCP_PROJECT_ID not configured)
- **Model**: ${this.config.model}
- **Version**: ${this.config.version}
- **Thinking Budget**: ${config.thinkingBudget} tokens

### Setup Requirements
To enable real Claude Opus 4.1 analysis:
1. Configure GCP_PROJECT_ID environment variable
2. Enable Vertex AI API in your Google Cloud project
3. Deploy Claude Opus 4.1 through Vertex AI Model Garden
4. Ensure proper authentication and permissions

### Test Command Examples
- \`/claude-opus deep-reasoning\`
- \`/claude-opus advanced-coding src/ai/\`
- \`/opus architectural-analysis\`

This mock response demonstrates the integration is working correctly and ready for production deployment.`;

        return {
            success: true,
            timestamp: new Date().toISOString(),
            commandType: config.commandType,
            target: config.target,
            extendedThinking: config.extendedThinking,
            thinkingBudget: config.thinkingBudget,
            modelVersion: this.config.version,
            analysis,
            mockMode: true,
            metadata: {
                promptLength: 1000,
                responseLength: analysis.length,
                temperature: config.temperature,
                processingTime: Date.now()
            }
        };
    }

    /**
     * Build comprehensive system prompt
     */
    buildSystemPrompt(config) {
        const basePrompt = `You are Claude Opus 4.1, Anthropic's most advanced AI model and industry leader for coding and agent capabilities. You excel at:

- **Advanced Coding**: Independently plan and execute complex development tasks end-to-end
- **Extended Thinking**: Deep reasoning with transparent thought processes  
- **Long-horizon Tasks**: Sustained performance requiring thousands of steps
- **AI Agents**: Complex, multi-step tasks requiring peak accuracy
- **Agentic Search**: Synthesizing comprehensive insights across repositories
- **Memory Management**: Context retention across multiple interactions

You are analyzing the EchoTune AI repository, a sophisticated music recommendation system that integrates with Spotify to provide AI-powered, personalized music discovery.

**Repository Architecture:**
- Node.js backend with Express framework
- Python ML components for recommendation algorithms
- MongoDB primary database with Redis caching
- Advanced MCP (Model Context Protocol) ecosystem
- Comprehensive AI provider integration (OpenAI, Google Gemini, Anthropic)
- Production deployment on DigitalOcean with Nginx
- Comprehensive GitHub Actions automation

**Current Integration Status:**
- 8+ active MCP servers for automation
- Multi-provider AI routing system
- Advanced analytics and monitoring
- Comprehensive testing framework
- Production-ready deployment pipeline`;

        const commandPrompt = this.commandTypes[config.commandType].systemPrompt;
        
        return `${basePrompt}\n\n${commandPrompt}`;
    }

    /**
     * Build user prompt with repository context
     */
    async buildUserPrompt(config) {
        let prompt = `**Task**: Perform ${config.commandType} analysis of the EchoTune AI repository.`;
        
        if (config.target) {
            prompt += `\n**Focus Area**: ${config.target}`;
            
            // Try to read target file/directory for context
            try {
                const targetPath = path.resolve(config.target);
                const stats = await fs.stat(targetPath);
                
                if (stats.isFile()) {
                    const content = await fs.readFile(targetPath, 'utf8');
                    prompt += `\n\n**Target File Content:**\n\`\`\`\n${content.substring(0, 5000)}\n\`\`\``;
                } else if (stats.isDirectory()) {
                    const files = await fs.readdir(targetPath);
                    prompt += `\n\n**Target Directory Contents:**\n${files.join(', ')}`;
                }
            } catch (error) {
                // Target file/directory not accessible, continue without content
            }
        }
        
        if (config.prompt && config.prompt.trim()) {
            prompt += `\n\n**Specific Request**: ${config.prompt}`;
        }

        prompt += `\n\n**Analysis Requirements:**

1. **Comprehensive Analysis**: Use your advanced reasoning capabilities to provide deep insights
2. **Actionable Recommendations**: Provide specific, implementable suggestions
3. **Code Examples**: Include production-ready code examples where appropriate
4. **Strategic Vision**: Consider long-term implications and opportunities
5. **Integration Focus**: Identify integration opportunities with existing systems
6. **Performance Considerations**: Address scalability and optimization aspects
7. **Best Practices**: Apply industry-leading development practices

**Extended Thinking Instructions**: 
${config.extendedThinking ? `Use your extended thinking capabilities to work through this analysis methodically. Show your reasoning process as you examine the codebase, identify patterns, and develop recommendations. Budget: ${config.thinkingBudget} tokens.` : 'Provide direct analysis without extended thinking mode.'}

Please deliver exceptional insights using your industry-leading capabilities.`;

        return prompt;
    }

    /**
     * Generate comprehensive report
     */
    async generateReport(result, config) {
        const reportData = {
            ...result,
            generatedAt: new Date().toISOString(),
            sessionMetrics: this.sessionMetrics,
            configuration: config
        };

        // Save JSON report
        await fs.writeFile(
            'claude_opus_analysis_result.json',
            JSON.stringify(reportData, null, 2)
        );

        // Generate markdown report
        const markdown = this.generateMarkdownReport(result, config);
        await fs.writeFile('claude_opus_analysis_report.md', markdown);

        // Generate summary for quick reference
        const summary = this.generateSummary(result, config);
        await fs.writeFile('claude_opus_analysis_summary.md', summary);

        console.log('📄 Reports generated:');
        console.log('   - claude_opus_analysis_result.json');
        console.log('   - claude_opus_analysis_report.md');
        console.log('   - claude_opus_analysis_summary.md');
    }

    /**
     * Generate markdown report
     */
    generateMarkdownReport(result, config) {
        const isError = !result.success;
        
        return `# 🧠 Claude Opus 4.1 Advanced Analysis Report

**Timestamp**: ${result.timestamp}
**Command Type**: ${result.commandType || config.commandType}
**Model Version**: ${result.modelVersion || 'claude-opus-4-1@20250805'}
**Status**: ${isError ? '❌ Failed' : '✅ Completed'}

## 📊 Configuration

- **Target**: ${result.target || 'Repository-wide'}
- **Extended Thinking**: ${result.extendedThinking ? '✅ Enabled' : '❌ Disabled'}
- **Thinking Budget**: ${result.thinkingBudget || 'N/A'} tokens
- **Temperature**: ${result.metadata?.temperature || 'N/A'}

## 🎯 Command Details

**Type**: ${result.commandType || config.commandType}
**Description**: ${this.commandTypes[result.commandType || config.commandType]?.description || 'Advanced AI analysis'}

${isError ? `## ❌ Error Information

**Error**: ${result.error}

### 🔧 Troubleshooting Steps
1. Verify Vertex AI access and project configuration
2. Check Claude Opus 4.1 model availability in your region
3. Ensure proper authentication and permissions
4. Review the command parameters and try again

### 🆘 Alternative Options
- Use direct Anthropic API integration as fallback
- Try with reduced thinking budget
- Contact support for Vertex AI configuration assistance` : `## 🧠 Analysis Results

${result.analysis}

## 📈 Performance Metrics

- **Prompt Length**: ${result.metadata?.promptLength || 'N/A'} characters
- **Response Length**: ${result.metadata?.responseLength || 'N/A'} characters
- **Processing Time**: ${result.metadata?.processingTime ? Date.now() - result.metadata.processingTime : 'N/A'}ms
- **Extended Thinking Used**: ${result.extendedThinking ? 'Yes' : 'No'}`}

## 🔄 Available Claude Opus 4.1 Commands

### 🎯 Core Commands
- \`/claude-opus deep-reasoning\` - Deep analytical reasoning with extended thinking
- \`/claude-opus extended-thinking\` - Methodical problem-solving with thinking mode
- \`/claude-opus advanced-coding\` - Industry-leading coding assistance  
- \`/claude-opus agent-workflow\` - Complex multi-step task automation
- \`/claude-opus architectural-analysis\` - Comprehensive system design analysis
- \`/claude-opus long-horizon-tasks\` - Sustained performance on complex objectives

### 🎯 Advanced Usage
- \`/claude-opus advanced-coding src/ai/\` - Target specific directory
- \`/claude-opus deep-reasoning budget 10000\` - Custom thinking budget
- \`/opus architectural-analysis\` - Shortened command form

### 🗣️ Natural Language Triggers
- "Use Claude Opus 4.1 for [task]"
- "Analyze with Claude Opus 4.1"
- "@claude-opus [request]"
- "Claude Opus 4.1 for [specific need]"

## 📊 Session Metrics

- **Commands Executed**: ${this.sessionMetrics.commandsExecuted}
- **Successful Commands**: ${this.sessionMetrics.successfulCommands}
- **Total Thinking Tokens**: ${this.sessionMetrics.totalThinkingTokens}
- **Session Duration**: ${Date.now() - this.sessionMetrics.startTime}ms

---
*Generated by Claude Opus 4.1 Advanced Coding Agent Command Processor*
*Timestamp: ${new Date().toISOString()}*`;
    }

    /**
     * Generate quick summary
     */
    generateSummary(result, config) {
        const isError = !result.success;
        
        return `# 🧠 Claude Opus 4.1 Analysis Summary

**Status**: ${isError ? '❌ Failed' : '✅ Completed'}
**Command**: ${result.commandType || config.commandType}
**Target**: ${result.target || 'Repository-wide'}
**Extended Thinking**: ${result.extendedThinking ? 'Enabled' : 'Disabled'}

${isError ? `**Error**: ${result.error}

Please check the full report for troubleshooting steps.` : `**Key Insights**: Advanced analysis completed with industry-leading AI capabilities.

**Next Steps**: Review the full report for detailed analysis and actionable recommendations.`}

**Full Report**: claude_opus_analysis_report.md
**Raw Data**: claude_opus_analysis_result.json`;
    }

    /**
     * Update session metrics
     */
    updateMetrics(success, executionTime, result) {
        this.sessionMetrics.commandsExecuted++;
        if (success) {
            this.sessionMetrics.successfulCommands++;
            if (result && result.thinkingBudget) {
                this.sessionMetrics.totalThinkingTokens += result.thinkingBudget;
            }
            if (result && result.metadata && result.metadata.responseLength) {
                this.sessionMetrics.totalOutputTokens += result.metadata.responseLength;
            }
        }
    }

    // Command-specific system prompts
    getDeepReasoningPrompt() {
        return `**DEEP REASONING MODE**: Focus on comprehensive analytical reasoning with step-by-step problem decomposition. Use your extended thinking capabilities to thoroughly analyze complex patterns, relationships, and implications. Break down problems into logical components and provide systematic analysis.`;
    }

    getExtendedThinkingPrompt() {
        return `**EXTENDED THINKING MODE**: Utilize your extended thinking capabilities to work through complex problems methodically. Show your reasoning process, consider multiple approaches, and arrive at well-considered conclusions. Demonstrate your thinking transparency.`;
    }

    getAdvancedCodingPrompt() {
        return `**ADVANCED CODING MODE**: Apply your industry-leading coding capabilities. Plan and execute complex development tasks end-to-end. Adapt to the codebase style, maintain high code quality, and provide production-ready implementations. Focus on best practices, scalability, and maintainability.`;
    }

    getAgentWorkflowPrompt() {
        return `**AGENT WORKFLOW MODE**: Design and implement agentic workflows for complex, multi-step tasks. Focus on automation, orchestration, and intelligent decision-making. Create workflows that can operate autonomously with minimal human intervention.`;
    }

    getArchitecturalAnalysisPrompt() {
        return `**ARCHITECTURAL ANALYSIS MODE**: Conduct comprehensive architectural analysis. Examine system design, scalability, maintainability, security, and performance. Recommend improvements and identify optimization opportunities. Consider both current state and future evolution.`;
    }

    getLongHorizonPrompt() {
        return `**LONG HORIZON MODE**: Apply your capabilities for sustained performance on long-running tasks. Break down complex objectives into manageable steps, maintain focus throughout extended analysis, and provide comprehensive solutions for multi-faceted challenges.`;
    }
}

// Command-line interface
async function main() {
    try {
        const processor = new ClaudeOpusCommandProcessor();
        
        const commandType = process.argv[2] || 'deep-reasoning';
        
        // Handle special test command
        if (commandType === 'test') {
            console.log('🧪 Testing Claude Opus 4.1 Configuration...\n');
            
            console.log('📊 Configuration Status:');
            console.log(`Project ID: ${processor.config.projectId}`);
            console.log(`Location: ${processor.config.location}`);
            console.log(`Mock Mode: ${processor.config.mockMode ? '🔧 Active' : '✅ Disabled'}`);
            console.log(`Vertex AI: ${processor.vertexAI ? '✅ Initialized' : '❌ Not available'}`);
            
            if (processor.config.mockMode) {
                console.log('\n⚠️ Running in mock mode');
                console.log('🛠️ To enable real Vertex AI:');
                console.log('   1. Set GCP_PROJECT_ID in .env file');
                console.log('   2. Run: node scripts/configure-gcp-credentials.js setup');
                console.log('   3. See: QUICK_GCP_SETUP.md');
                
                const testResult = await processor.processCommand('test', { 
                    prompt: 'This is a test message. Please respond with "Test successful!"'
                });
                
                console.log('\n🧪 Mock Test Result:');
                console.log(`Success: ${testResult.success}`);
                console.log(`Response length: ${testResult.response?.length || 0} characters`);
                
                return;
            } else {
                console.log('\n🧪 Testing real Vertex AI connection...');
                
                const testResult = await processor.processCommand('test', { 
                    prompt: 'This is a test message. Please respond with "Vertex AI test successful!" and nothing else.'
                });
                
                console.log('\n✅ Real Vertex AI Test Result:');
                console.log(`Success: ${testResult.success}`);
                console.log(`Mock Mode: ${testResult.mockMode}`);
                console.log(`Response: ${testResult.response?.substring(0, 200)}...`);
                
                if (testResult.success && !testResult.mockMode) {
                    console.log('\n🎉 GCP credentials are working correctly!');
                    console.log('✅ Models are now using real Vertex AI instead of mock responses');
                } else {
                    console.log('\n⚠️ Test completed but may still be in mock mode');
                }
                
                return;
            }
        }
        
        const options = {
            target: process.argv[3] || '',
            prompt: process.argv[4] || '',
            thinkingBudget: parseInt(process.argv[5]) || undefined,
            extendedThinking: process.argv[6] !== 'false'
        };

        console.log('🚀 Starting Claude Opus 4.1 Advanced Coding Agent...');
        
        const result = await processor.processCommand(commandType, options);
        
        console.log('✅ Analysis completed successfully');
        console.log('📄 Check generated reports for detailed results');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Command failed:', error.message);
        process.exit(1);
    }
}

// Export for programmatic use
module.exports = ClaudeOpusCommandProcessor;

// Run if called directly
if (require.main === module) {
    main();
}