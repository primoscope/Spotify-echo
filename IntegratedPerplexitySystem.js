/**
 * INTEGRATED PERPLEXITY OPTIMIZATION SYSTEM
 * 
 * Complete integration of enhanced Perplexity API with cost optimization,
 * caching, and MCP server workflow orchestration
 */

const EnhancedPerplexityAPI = require('./EnhancedPerplexityAPI');
const PerplexityCostOptimizer = require('./PerplexityCostOptimizer');
const fs = require('fs').promises;

class IntegratedPerplexitySystem {
    constructor(options = {}) {
        // Initialize cost optimizer
        this.costOptimizer = new PerplexityCostOptimizer({
            budget: options.budget || 5.00, // $5 weekly budget
            warningThreshold: options.warningThreshold || 0.7,
            cacheEnabled: options.cacheEnabled !== false
        });
        
        // Initialize enhanced API
        this.api = new EnhancedPerplexityAPI(options.apiKey, {
            costOptimization: true,
            budget: options.budget || 5.00,
            trackUsage: true,
            preferLowerCost: options.preferLowerCost !== false
        });
        
        // System configuration
        this.config = {
            enableBudgetGuards: options.enableBudgetGuards !== false,
            enableCaching: options.enableCaching !== false,
            enableOptimization: options.enableOptimization !== false,
            mcpIntegration: options.mcpIntegration !== false
        };
        
        // Workflow state
        this.workflows = new Map();
        this.activeRequests = new Map();
        
        console.log('🚀 Integrated Perplexity System initialized');
        console.log(`💰 Weekly budget: $${this.costOptimizer.budget}`);
        console.log(`🧠 Cost optimization: ${this.config.enableOptimization ? 'ON' : 'OFF'}`);
        console.log(`💾 Caching: ${this.config.enableCaching ? 'ON' : 'OFF'}`);
    }

    /**
     * Optimized query processing with full cost management
     */
    async processQuery(content, options = {}) {
        const queryId = this.generateQueryId();
        console.log(`🔍 Processing query ${queryId}`);
        
        try {
            // Step 1: Check cache first
            if (this.config.enableCaching) {
                const cached = this.costOptimizer.checkCache(content, options.labels || []);
                if (cached.hit) {
                    console.log(`💾 Cache HIT (${cached.age} days old): ${cached.key}`);
                    return {
                        success: true,
                        content: cached.data.content,
                        cached: true,
                        cacheAge: cached.age,
                        cost: 0,
                        queryId
                    };
                }
                console.log(`💾 Cache MISS: ${cached.key}`);
            }
            
            // Step 2: Complexity analysis and model selection
            const complexity = this.costOptimizer.assessComplexity(content, options.labels || []);
            console.log(`🧠 Complexity: ${complexity.complexity} (score: ${complexity.score})`);
            console.log(`📋 Model: ${complexity.recommendedModel}`);
            console.log(`🔍 Reasoning: ${complexity.reasoning.join(', ')}`);
            
            // Step 3: Cost estimation
            const estimatedCost = this.costOptimizer.estimateCost(
                content, 
                complexity.recommendedModel,
                { 
                    maxTokens: options.maxTokens || 1000,
                    searchQueries: 1
                }
            );
            
            console.log(`💰 Estimated cost: $${estimatedCost.toFixed(4)}`);
            
            // Step 4: Budget check
            if (this.config.enableBudgetGuards) {
                const budgetCheck = this.costOptimizer.checkBudget(estimatedCost);
                
                if (!budgetCheck.allowed) {
                    console.log(`❌ Budget exceeded: ${budgetCheck.reason}`);
                    return {
                        success: false,
                        error: 'BUDGET_EXCEEDED',
                        budgetStatus: budgetCheck,
                        queryId
                    };
                }
                
                if (budgetCheck.warning) {
                    console.log(`⚠️ Budget warning: ${budgetCheck.percentUsed.toFixed(1)}% used`);
                }
            }
            
            // Step 5: Execute API request
            this.activeRequests.set(queryId, { startTime: Date.now(), status: 'processing' });
            
            const result = await this.api.makeRequest(content, {
                model: complexity.recommendedModel,
                maxTokens: options.maxTokens || 1000,
                temperature: options.temperature || 0.3,
                systemPrompt: options.systemPrompt,
                searchMode: options.searchMode || 'academic',
                ...options
            });
            
            // Step 6: Track costs and cache result
            if (result.success) {
                this.costOptimizer.trackUsage(result.cost, result.model);
                
                if (this.config.enableCaching) {
                    const cacheKey = this.costOptimizer.generateCacheKey(content, options.labels || []);
                    this.costOptimizer.setCache(cacheKey, {
                        content: result.content,
                        model: result.model,
                        complexity: complexity.complexity
                    });
                }
                
                console.log(`✅ Query completed: $${result.cost.toFixed(4)} cost`);
                
                return {
                    ...result,
                    queryId,
                    complexity: complexity.complexity,
                    optimized: true
                };
            } else {
                console.log(`❌ Query failed`);
                return { ...result, queryId };
            }
            
        } catch (error) {
            console.error(`💥 Query ${queryId} failed:`, error.message);
            return {
                success: false,
                error: error.message,
                queryId
            };
        } finally {
            this.activeRequests.delete(queryId);
        }
    }

    /**
     * Batch processing with optimization
     */
    async processBatch(queries, options = {}) {
        console.log(`📦 Processing batch of ${queries.length} queries`);
        
        // Group queries by complexity for optimal batching
        const grouped = this.groupQueriesByComplexity(queries);
        const results = [];
        
        for (const [complexity, queryGroup] of grouped.entries()) {
            console.log(`🔄 Processing ${queryGroup.length} ${complexity} queries`);
            
            const batchResults = await Promise.all(
                queryGroup.map(query => this.processQuery(query.content, {
                    ...options,
                    ...query.options,
                    labels: query.labels
                }))
            );
            
            results.push(...batchResults);
            
            // Small delay between complexity groups to avoid rate limits
            if (queryGroup.length > 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        const batchSummary = this.summarizeBatchResults(results);
        console.log(`📊 Batch complete: ${batchSummary.successful}/${batchSummary.total} successful`);
        console.log(`💰 Total cost: $${batchSummary.totalCost.toFixed(4)}`);
        
        return {
            results,
            summary: batchSummary
        };
    }

    /**
     * Research workflow with advanced optimization
     */
    async researchWorkflow(topic, options = {}) {
        const workflowId = this.generateQueryId();
        console.log(`🔬 Starting research workflow ${workflowId} for: ${topic}`);
        
        const steps = [
            {
                name: 'Overview Research',
                content: `Provide a comprehensive overview of: ${topic}`,
                options: { maxTokens: 800 }
            },
            {
                name: 'Current Developments',
                content: `What are the latest 2025 developments and trends in: ${topic}`,
                options: { maxTokens: 1000, searchMode: 'academic' }
            },
            {
                name: 'Technical Analysis',
                content: `Analyze the technical aspects and implementation considerations for: ${topic}`,
                options: { maxTokens: 1200 }
            }
        ];
        
        const workflowResults = [];
        
        for (const step of steps) {
            console.log(`📋 Executing: ${step.name}`);
            
            const result = await this.processQuery(step.content, {
                ...options,
                ...step.options,
                labels: ['research', 'workflow']
            });
            
            workflowResults.push({
                step: step.name,
                result
            });
            
            if (!result.success) {
                console.log(`❌ Workflow stopped at step: ${step.name}`);
                break;
            }
        }
        
        return {
            workflowId,
            topic,
            results: workflowResults,
            summary: this.summarizeWorkflow(workflowResults)
        };
    }

    /**
     * Get system status and analytics
     */
    getSystemStatus() {
        const costReport = this.costOptimizer.generateCostReport();
        const apiStats = this.api.getUsageStats();
        
        return {
            timestamp: new Date().toISOString(),
            budget: costReport.budget,
            usage: costReport.usage,
            cache: costReport.cache,
            status: costReport.status,
            recommendations: costReport.recommendations,
            activeRequests: this.activeRequests.size,
            modelsAvailable: this.api.getModels().length,
            systemHealth: this.calculateSystemHealth(costReport)
        };
    }

    /**
     * Generate cost optimization report
     */
    generateOptimizationReport() {
        const status = this.getSystemStatus();
        const optimizations = this.identifyOptimizationOpportunities();
        
        return {
            ...status,
            optimization: {
                opportunities: optimizations,
                projectedSavings: this.calculateProjectedSavings(optimizations),
                recommendations: this.generateOptimizationRecommendations(optimizations)
            }
        };
    }

    /**
     * MCP server integration for workflow orchestration
     */
    async mcpServerIntegration(workflowType, parameters) {
        if (!this.config.mcpIntegration) {
            throw new Error('MCP integration is disabled');
        }
        
        console.log(`🔗 MCP workflow: ${workflowType}`);
        
        // This would integrate with actual MCP servers
        const workflows = {
            'repository-analysis': this.repositoryAnalysisWorkflow.bind(this),
            'cost-optimization': this.costOptimizationWorkflow.bind(this),
            'batch-processing': this.batchProcessingWorkflow.bind(this)
        };
        
        const workflow = workflows[workflowType];
        if (!workflow) {
            throw new Error(`Unknown workflow type: ${workflowType}`);
        }
        
        return await workflow(parameters);
    }

    /**
     * Helper methods
     */
    generateQueryId() {
        return `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    groupQueriesByComplexity(queries) {
        const groups = new Map();
        
        for (const query of queries) {
            const complexity = this.costOptimizer.assessComplexity(
                query.content, 
                query.labels || []
            );
            
            if (!groups.has(complexity.complexity)) {
                groups.set(complexity.complexity, []);
            }
            
            groups.get(complexity.complexity).push(query);
        }
        
        return groups;
    }

    summarizeBatchResults(results) {
        return {
            total: results.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            cached: results.filter(r => r.cached).length,
            totalCost: results.reduce((sum, r) => sum + (r.cost || 0), 0)
        };
    }

    summarizeWorkflow(workflowResults) {
        return {
            totalSteps: workflowResults.length,
            completedSteps: workflowResults.filter(r => r.result.success).length,
            totalCost: workflowResults.reduce((sum, r) => sum + (r.result.cost || 0), 0),
            totalTokens: workflowResults.reduce((sum, r) => 
                sum + (r.result.usage?.total_tokens || 0), 0)
        };
    }

    calculateSystemHealth(costReport) {
        let health = 100;
        
        if (costReport.status === 'WARNING') health -= 20;
        if (costReport.status === 'OVER_BUDGET') health -= 50;
        if (costReport.cache.hitRate < 0.2) health -= 10;
        if (costReport.usage.totalQueries < 1) health -= 5;
        
        return Math.max(0, health);
    }

    identifyOptimizationOpportunities() {
        // This would analyze usage patterns and identify optimization opportunities
        return [
            {
                type: 'model_selection',
                description: 'Use lower-cost models for simple queries',
                potentialSavings: 0.15
            },
            {
                type: 'caching',
                description: 'Improve cache hit rate through better similarity matching',
                potentialSavings: 0.08
            }
        ];
    }

    calculateProjectedSavings(optimizations) {
        return optimizations.reduce((sum, opt) => sum + opt.potentialSavings, 0);
    }

    generateOptimizationRecommendations(optimizations) {
        return optimizations.map(opt => ({
            priority: opt.potentialSavings > 0.1 ? 'high' : 'medium',
            action: opt.description,
            estimatedSavings: `$${opt.potentialSavings.toFixed(3)}/week`
        }));
    }

    // Workflow implementations
    async repositoryAnalysisWorkflow(params) {
        return await this.researchWorkflow(`Repository analysis: ${params.repository}`);
    }

    async costOptimizationWorkflow(params) {
        const report = this.generateOptimizationReport();
        return {
            workflowId: this.generateQueryId(),
            type: 'cost-optimization',
            report
        };
    }

    async batchProcessingWorkflow(params) {
        return await this.processBatch(params.queries, params.options);
    }
}

module.exports = IntegratedPerplexitySystem;