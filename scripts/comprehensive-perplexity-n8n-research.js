#!/usr/bin/env node

/**
 * Comprehensive Perplexity Browser Research & N8N Analysis System
 * Performs deep research on n8n capabilities, validates implementation, and provides comprehensive analysis
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class PerplexityN8nResearchAnalyzer {
    constructor() {
        this.perplexityApiKey = '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';
        this.n8nApiUrl = 'http://46.101.106.220';
        this.researchResults = {};
        this.analysisResults = {};
        this.validationResults = {};
        
        console.log('🧠 Initializing Perplexity N8N Research Analyzer...');
    }

    async conductComprehensiveN8nResearch() {
        console.log('\n📚 PHASE 1: Comprehensive N8N Research with Perplexity');
        console.log('=' .repeat(70));
        
        const researchTopics = [
            {
                key: 'n8n_coding_agents',
                query: 'n8n coding agents automation workflows GitHub integration best practices 2024',
                focus: 'Coding agent implementations, GitHub automation, and development workflows'
            },
            {
                key: 'n8n_mcp_servers',
                query: 'n8n MCP server integration Model Context Protocol workflow automation',
                focus: 'MCP server integration patterns and automation capabilities'
            },
            {
                key: 'n8n_multimodal_ai',
                query: 'n8n multimodal AI workflows vision language models OpenAI Gemini integration',
                focus: 'Multimodal AI integration and vision/audio processing capabilities'
            },
            {
                key: 'n8n_browser_automation',
                query: 'n8n browser automation Playwright Puppeteer web scraping workflows',
                focus: 'Browser automation, web scraping, and UI testing workflows'
            },
            {
                key: 'n8n_api_integrations',
                query: 'n8n REST API integrations webhook endpoints database MongoDB Redis',
                focus: 'API integrations, data storage, and external service connections'
            },
            {
                key: 'n8n_advanced_workflows',
                query: 'n8n advanced workflows triggers scheduling conditional logic error handling',
                focus: 'Advanced workflow patterns, error handling, and complex logic'
            }
        ];

        for (const topic of researchTopics) {
            console.log(`\n🔍 Researching: ${topic.focus}`);
            
            try {
                const research = await this.performPerplexityResearch(topic.query, topic.focus);
                this.researchResults[topic.key] = {
                    query: topic.query,
                    focus: topic.focus,
                    results: research,
                    timestamp: new Date().toISOString()
                };
                
                console.log(`✅ Completed research: ${topic.key}`);
                
                // Delay between requests to respect rate limits
                await this.delay(2000);
                
            } catch (error) {
                console.error(`❌ Research failed for ${topic.key}:`, error.message);
                this.researchResults[topic.key] = {
                    error: error.message,
                    timestamp: new Date().toISOString()
                };
            }
        }
    }

    async performPerplexityResearch(query, focus) {
        const response = await axios.post('https://api.perplexity.ai/chat/completions', {
            model: 'llama-3.1-sonar-huge-128k-online',
            messages: [{
                role: 'system',
                content: 'You are an expert researcher specializing in automation workflows, n8n, and integration platforms. Provide comprehensive, accurate, and up-to-date information with citations and practical examples.'
            }, {
                role: 'user',
                content: `Research: ${query}\n\nFocus specifically on: ${focus}\n\nProvide:\n1. Current best practices and capabilities\n2. Latest features and updates\n3. Implementation examples and patterns\n4. Integration possibilities\n5. Limitations and considerations\n6. Practical use cases and real-world applications\n\nInclude citations and specific examples where possible.`
            }],
            max_tokens: 4000,
            temperature: 0.1,
            top_p: 0.9,
            search_domain_filter: [
                'n8n.io',
                'docs.n8n.io', 
                'community.n8n.io',
                'github.com',
                'stackoverflow.com',
                'dev.to',
                'medium.com'
            ],
            return_citations: true,
            return_images: false
        }, {
            headers: {
                'Authorization': `Bearer ${this.perplexityApiKey}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.choices[0].message.content;
    }

    async analyzeCurrentN8nImplementation() {
        console.log('\n🔍 PHASE 2: Current N8N Implementation Analysis');
        console.log('=' .repeat(70));
        
        try {
            // Get current workflows
            const workflowsResponse = await axios.get(`${this.n8nApiUrl}/api/v1/workflows`, {
                headers: { 'X-N8N-API-KEY': process.env.N8N_API_KEY }
            });
            
            // Get credentials
            const credentialsResponse = await axios.get(`${this.n8nApiUrl}/api/v1/credentials`, {
                headers: { 'X-N8N-API-KEY': process.env.N8N_API_KEY }
            });
            
            this.analysisResults = {
                workflows_count: workflowsResponse.data.data?.length || 0,
                workflows: workflowsResponse.data.data?.map(w => ({
                    id: w.id,
                    name: w.name,
                    active: w.active,
                    nodes_count: w.nodes?.length || 0,
                    last_updated: w.updatedAt
                })) || [],
                
                credentials_count: credentialsResponse.data.data?.length || 0,
                credentials: credentialsResponse.data.data?.map(c => ({
                    id: c.id,
                    name: c.name,
                    type: c.type
                })) || [],
                
                analysis_timestamp: new Date().toISOString()
            };
            
            console.log(`✅ Found ${this.analysisResults.workflows_count} workflows`);
            console.log(`✅ Found ${this.analysisResults.credentials_count} credentials`);
            
        } catch (error) {
            console.error('❌ Failed to analyze current implementation:', error.message);
            this.analysisResults = { error: error.message };
        }
    }

    async generateComprehensiveAnalysisReport() {
        console.log('\n📊 PHASE 3: Comprehensive Analysis Report Generation');
        console.log('=' .repeat(70));
        
        const analysisPrompt = `
Based on this comprehensive research and current implementation analysis:

RESEARCH RESULTS:
${JSON.stringify(this.researchResults, null, 2)}

CURRENT IMPLEMENTATION:
${JSON.stringify(this.analysisResults, null, 2)}

Generate a comprehensive analysis report that includes:

1. **CURRENT STATE ASSESSMENT**
   - Evaluation of existing n8n workflows and credentials
   - Identification of implemented features vs research findings
   - Gap analysis between current state and best practices

2. **OPTIMIZATION RECOMMENDATIONS**
   - Specific improvements for existing workflows
   - Missing integrations and capabilities
   - Performance and reliability enhancements

3. **ADVANCED FEATURE IMPLEMENTATION PLAN**
   - Coding agent workflow enhancements
   - MCP server integration opportunities
   - Multimodal AI workflow improvements
   - Browser automation expansion

4. **INTEGRATION OPPORTUNITIES**
   - Additional API integrations based on research
   - New workflow types and triggers
   - Enhanced error handling and monitoring

5. **IMPLEMENTATION ROADMAP**
   - Priority-ordered development tasks
   - Resource requirements and timelines
   - Risk assessment and mitigation strategies

6. **VALIDATION AND TESTING STRATEGY**
   - Comprehensive testing approach
   - Performance benchmarking methods
   - Monitoring and maintenance procedures

Provide specific, actionable recommendations with implementation details and code examples where applicable.
`;

        try {
            const response = await axios.post('https://api.perplexity.ai/chat/completions', {
                model: 'llama-3.1-sonar-huge-128k-online',
                messages: [{
                    role: 'system',
                    content: 'You are an expert system architect and automation engineer. Generate detailed, actionable analysis reports with specific implementation guidance.'
                }, {
                    role: 'user',
                    content: analysisPrompt
                }],
                max_tokens: 6000,
                temperature: 0.1,
                top_p: 0.9
            }, {
                headers: {
                    'Authorization': `Bearer ${this.perplexityApiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            this.validationResults.comprehensive_analysis = response.data.choices[0].message.content;
            console.log('✅ Generated comprehensive analysis report');
            
        } catch (error) {
            console.error('❌ Failed to generate analysis report:', error.message);
            this.validationResults.analysis_error = error.message;
        }
    }

    async performWorkflowValidationAnalysis() {
        console.log('\n🧪 PHASE 4: Workflow Validation & Enhancement Analysis');
        console.log('=' .repeat(70));
        
        const validationPrompt = `
Based on the research findings and current n8n implementation, provide a detailed workflow validation and enhancement analysis:

RESEARCH INSIGHTS:
${JSON.stringify(this.researchResults, null, 2)}

CURRENT WORKFLOWS:
${JSON.stringify(this.analysisResults.workflows, null, 2)}

Provide validation for each workflow and enhancement recommendations:

1. **WORKFLOW-BY-WORKFLOW ANALYSIS**
   - Validation of current workflow architecture
   - Identification of improvement opportunities
   - Alignment with n8n best practices

2. **INTEGRATION VALIDATION**
   - API integration effectiveness
   - Error handling adequacy
   - Performance optimization opportunities

3. **ENHANCEMENT RECOMMENDATIONS**
   - Specific node additions or modifications
   - New trigger types and scheduling options
   - Advanced error handling implementations

4. **SCALABILITY ASSESSMENT**
   - Current workflow scalability limitations
   - Recommended architecture improvements
   - Load handling and performance considerations

5. **SECURITY AND RELIABILITY ANALYSIS**
   - Security best practices implementation
   - Credential management optimization
   - Monitoring and alerting improvements

Provide specific implementation code and configuration examples for each recommendation.
`;

        try {
            const response = await axios.post('https://api.perplexity.ai/chat/completions', {
                model: 'llama-3.1-sonar-huge-128k-online',
                messages: [{
                    role: 'system',
                    content: 'You are a workflow validation expert with deep knowledge of n8n best practices and automation patterns.'
                }, {
                    role: 'user',
                    content: validationPrompt
                }],
                max_tokens: 5000,
                temperature: 0.1
            }, {
                headers: {
                    'Authorization': `Bearer ${this.perplexityApiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            this.validationResults.workflow_validation = response.data.choices[0].message.content;
            console.log('✅ Completed workflow validation analysis');
            
        } catch (error) {
            console.error('❌ Failed to perform workflow validation:', error.message);
            this.validationResults.validation_error = error.message;
        }
    }

    async generateNextStepsAndActionPlan() {
        console.log('\n🎯 PHASE 5: Next Steps & Action Plan Generation');
        console.log('=' .repeat(70));
        
        const actionPlanPrompt = `
Based on all the research, analysis, and validation performed:

COMPREHENSIVE RESEARCH:
${JSON.stringify(this.researchResults, null, 2)}

IMPLEMENTATION ANALYSIS:
${JSON.stringify(this.analysisResults, null, 2)}

VALIDATION RESULTS:
${JSON.stringify(this.validationResults, null, 2)}

Generate a comprehensive action plan with:

1. **IMMEDIATE ACTIONS (Next 24-48 hours)**
   - Critical workflow improvements
   - Essential credential configurations
   - High-priority integrations

2. **SHORT-TERM GOALS (1-2 weeks)**
   - Advanced workflow implementations
   - Additional API integrations
   - Performance optimizations

3. **MEDIUM-TERM OBJECTIVES (1 month)**
   - Complete MCP server integration
   - Advanced multimodal AI workflows
   - Comprehensive monitoring system

4. **LONG-TERM VISION (3+ months)**
   - Full automation platform maturity
   - Advanced AI agent orchestration
   - Complete ecosystem integration

5. **SPECIFIC IMPLEMENTATION TASKS**
   - Detailed task breakdowns
   - Resource requirements
   - Success metrics and validation criteria

6. **CONTINUOUS IMPROVEMENT FRAMEWORK**
   - Regular review processes
   - Performance monitoring
   - Update and enhancement cycles

Provide specific, actionable tasks with implementation guidance and priority rankings.
`;

        try {
            const response = await axios.post('https://api.perplexity.ai/chat/completions', {
                model: 'llama-3.1-sonar-huge-128k-online',
                messages: [{
                    role: 'system',
                    content: 'You are a strategic technology planning expert. Generate comprehensive, actionable implementation roadmaps with clear priorities and measurable outcomes.'
                }, {
                    role: 'user',
                    content: actionPlanPrompt
                }],
                max_tokens: 5000,
                temperature: 0.1
            }, {
                headers: {
                    'Authorization': `Bearer ${this.perplexityApiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            this.validationResults.action_plan = response.data.choices[0].message.content;
            console.log('✅ Generated comprehensive action plan');
            
        } catch (error) {
            console.error('❌ Failed to generate action plan:', error.message);
            this.validationResults.action_plan_error = error.message;
        }
    }

    async saveComprehensiveResults() {
        console.log('\n💾 PHASE 6: Saving Comprehensive Results');
        console.log('=' .repeat(70));
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportsDir = path.join(__dirname, '../reports');
        
        // Ensure reports directory exists
        await fs.mkdir(reportsDir, { recursive: true });
        
        const comprehensiveReport = {
            research_session_id: `perplexity_n8n_research_${timestamp}`,
            generated_at: new Date().toISOString(),
            research_phase_results: this.researchResults,
            implementation_analysis: this.analysisResults,
            validation_and_enhancement: this.validationResults,
            summary: {
                research_topics_analyzed: Object.keys(this.researchResults).length,
                current_workflows: this.analysisResults.workflows_count || 0,
                current_credentials: this.analysisResults.credentials_count || 0,
                comprehensive_analysis_completed: !!this.validationResults.comprehensive_analysis,
                workflow_validation_completed: !!this.validationResults.workflow_validation,
                action_plan_generated: !!this.validationResults.action_plan
            }
        };
        
        // Save individual components
        await fs.writeFile(
            path.join(reportsDir, `perplexity-n8n-research-${timestamp}.json`),
            JSON.stringify(this.researchResults, null, 2)
        );
        
        await fs.writeFile(
            path.join(reportsDir, `n8n-implementation-analysis-${timestamp}.json`),
            JSON.stringify(this.analysisResults, null, 2)
        );
        
        await fs.writeFile(
            path.join(reportsDir, `n8n-validation-results-${timestamp}.json`),
            JSON.stringify(this.validationResults, null, 2)
        );
        
        // Save comprehensive report
        await fs.writeFile(
            path.join(reportsDir, `comprehensive-n8n-analysis-report-${timestamp}.json`),
            JSON.stringify(comprehensiveReport, null, 2)
        );
        
        // Generate markdown summary
        const markdownSummary = await this.generateMarkdownSummary(comprehensiveReport);
        await fs.writeFile(
            path.join(reportsDir, `comprehensive-n8n-analysis-report-${timestamp}.md`),
            markdownSummary
        );
        
        console.log(`✅ Saved comprehensive results to reports/ directory`);
        console.log(`📁 Files generated:`);
        console.log(`   - perplexity-n8n-research-${timestamp}.json`);
        console.log(`   - n8n-implementation-analysis-${timestamp}.json`);
        console.log(`   - n8n-validation-results-${timestamp}.json`);
        console.log(`   - comprehensive-n8n-analysis-report-${timestamp}.json`);
        console.log(`   - comprehensive-n8n-analysis-report-${timestamp}.md`);
        
        return comprehensiveReport;
    }

    async generateMarkdownSummary(report) {
        return `# Comprehensive N8N Analysis Report

**Generated:** ${report.generated_at}
**Session ID:** ${report.research_session_id}

## Executive Summary

- **Research Topics Analyzed:** ${report.summary.research_topics_analyzed}
- **Current Workflows:** ${report.summary.current_workflows}
- **Current Credentials:** ${report.summary.current_credentials}
- **Analysis Completed:** ${report.summary.comprehensive_analysis_completed ? '✅' : '❌'}
- **Validation Completed:** ${report.summary.workflow_validation_completed ? '✅' : '❌'}
- **Action Plan Generated:** ${report.summary.action_plan_generated ? '✅' : '❌'}

## Research Phase Results

${Object.entries(report.research_phase_results).map(([key, data]) => `
### ${key.replace(/_/g, ' ').toUpperCase()}
- **Query:** ${data.query}
- **Focus:** ${data.focus}
- **Status:** ${data.error ? '❌ Error: ' + data.error : '✅ Completed'}
`).join('\n')}

## Implementation Analysis

### Current Workflows
${report.implementation_analysis.workflows?.map(w => `
- **${w.name}** (${w.active ? 'Active' : 'Inactive'})
  - ID: ${w.id}
  - Nodes: ${w.nodes_count}
  - Updated: ${w.last_updated}
`).join('\n') || 'No workflows found'}

### Current Credentials
${report.implementation_analysis.credentials?.map(c => `
- **${c.name}** (${c.type})
  - ID: ${c.id}
`).join('\n') || 'No credentials found'}

## Validation & Enhancement Results

${report.validation_and_enhancement.comprehensive_analysis || 'Analysis not completed'}

## Workflow Validation

${report.validation_and_enhancement.workflow_validation || 'Validation not completed'}

## Action Plan

${report.validation_and_enhancement.action_plan || 'Action plan not generated'}

---

*This report was generated using Perplexity AI research and comprehensive n8n implementation analysis.*
`;
    }

    async runComprehensiveAnalysis() {
        console.log('🚀 Starting Comprehensive Perplexity N8N Research & Analysis');
        console.log('=' .repeat(80));
        
        try {
            // Phase 1: Research
            await this.conductComprehensiveN8nResearch();
            
            // Phase 2: Current implementation analysis
            await this.analyzeCurrentN8nImplementation();
            
            // Phase 3: Generate comprehensive analysis
            await this.generateComprehensiveAnalysisReport();
            
            // Phase 4: Workflow validation
            await this.performWorkflowValidationAnalysis();
            
            // Phase 5: Action plan
            await this.generateNextStepsAndActionPlan();
            
            // Phase 6: Save results
            const report = await this.saveComprehensiveResults();
            
            console.log('\n🎉 COMPREHENSIVE ANALYSIS COMPLETED');
            console.log('=' .repeat(80));
            console.log('✅ All phases completed successfully');
            console.log('📊 Comprehensive analysis report generated');
            console.log('🎯 Action plan with next steps created');
            console.log('💾 All results saved to reports/ directory');
            
            return report;
            
        } catch (error) {
            console.error('❌ Analysis failed:', error);
            throw error;
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run if executed directly
if (require.main === module) {
    const analyzer = new PerplexityN8nResearchAnalyzer();
    analyzer.runComprehensiveAnalysis().catch(console.error);
}

module.exports = PerplexityN8nResearchAnalyzer;