/**
 * ENHANCED PERPLEXITY API INTEGRATION MODULE
 * 
 * Comprehensive integration with cost optimization, multiple models,
 * and advanced features based on 2025 documentation research
 * 
 * Generated: 2025-08-24T01:44:16.328Z
 * Research-driven with 15,981 characters of official documentation analysis
 */

const https = require('https');
const fs = require('fs').promises;

class EnhancedPerplexityAPI {
    constructor(apiKey, options = {}) {
        this.apiKey = apiKey || process.env.PERPLEXITY_API_KEY;
        this.baseUrl = 'https://api.perplexity.ai';
        
        // Cost optimization settings
        this.costOptimization = {
            enabled: options.costOptimization !== false,
            budget: options.budget || null, // Daily budget in USD
            trackUsage: options.trackUsage !== false,
            preferLowerCost: options.preferLowerCost || false
        };
        
        // Usage tracking
        this.usage = {
            totalCost: 0,
            totalTokens: 0,
            totalQueries: 0,
            dailyUsage: new Map() // date -> usage stats
        };
        
        // Enhanced model registry with 2025 research data
        this.models = {
            // Sonar family - Perplexity proprietary
            sonar: {
                id: 'sonar',
                name: 'Sonar',
                type: 'search-enabled',
                capabilities: ['search', 'basic_reasoning'],
                costs: { input: 0.001, output: 0.001, search: 5.0 },
                contextWindow: 127000,
                description: 'Fast, basic search-enabled model for simple queries'
            },
            sonarPro: {
                id: 'sonar-pro',
                name: 'Sonar Pro',
                type: 'search-enabled',
                capabilities: ['search', 'advanced_reasoning', 'citations'],
                costs: { input: 0.003, output: 0.015, search: 5.0 },
                contextWindow: 127000,
                description: 'Advanced search with deep reasoning and citations'
            },
            sonarReasoning: {
                id: 'sonar-reasoning',
                name: 'Sonar Reasoning',
                type: 'search-enabled',
                capabilities: ['search', 'reasoning', 'moderate_complexity'],
                costs: { input: 0.001, output: 0.005, search: 5.0 },
                contextWindow: 127000,
                description: 'Reasoning-focused model for moderate complexity'
            },
            sonarReasoningPro: {
                id: 'sonar-reasoning-pro',
                name: 'Sonar Reasoning Pro',
                type: 'search-enabled',
                capabilities: ['search', 'advanced_reasoning', 'high_accuracy'],
                costs: { input: 0.002, output: 0.008, search: 5.0 },
                contextWindow: 127000,
                description: 'Premium reasoning with highest accuracy'
            },
            sonarDeepResearch: {
                id: 'sonar-deep-research',
                name: 'Sonar Deep Research',
                type: 'search-enabled',
                capabilities: ['search', 'deep_research', 'multi_source', 'inference'],
                costs: { input: 0.002, inference: 0.003, output: 0.008, search: 5.0 },
                contextWindow: 127000,
                description: 'Deep multi-source research with inference tokens'
            },
            
            // Third-party models (2025 additions)
            gpt5: {
                id: 'gpt-5',
                name: 'GPT-5',
                type: 'search-enabled',
                capabilities: ['search', 'expert_reasoning', 'coding', 'multimodal'],
                costs: { input: 0.004, output: 0.012, search: 5.0 },
                contextWindow: 200000,
                description: 'OpenAI flagship with expert reasoning and coding'
            },
            claudeOpus41: {
                id: 'claude-opus-4.1',
                name: 'Claude Opus 4.1',
                type: 'search-enabled',
                capabilities: ['search', 'nuanced_reasoning', 'creative_writing', 'multimodal'],
                costs: { input: 0.0035, output: 0.011, search: 5.0 },
                contextWindow: 200000,
                description: 'Anthropic most advanced with nuanced language'
            },
            gemini25Pro: {
                id: 'gemini-2.5-pro',
                name: 'Gemini 2.5 Pro',
                type: 'search-enabled',
                capabilities: ['search', 'multimodal', 'coding', 'advanced_reasoning'],
                costs: { input: 0.003, output: 0.009, search: 5.0 },
                contextWindow: 200000,
                description: 'Google multimodal with advanced reasoning'
            },
            
            // Offline models
            r1: {
                id: 'r1-1776',
                name: 'R1-1776',
                type: 'offline',
                capabilities: ['reasoning', 'chat', 'no_search'],
                costs: { input: 0.002, output: 0.008 },
                contextWindow: 127000,
                description: 'Offline chat model without search capabilities'
            }
        };
        
        if (!this.apiKey) {
            throw new Error('Perplexity API key is required');
        }
        
        // Load usage tracking if exists
        this.loadUsageTracking();
    }

    /**
     * Enhanced API request with cost optimization
     */
    async makeRequest(prompt, options = {}) {
        const requestOptions = this.optimizeRequest(prompt, options);
        const model = this.models[requestOptions.modelKey] || this.models.sonar;
        
        // Cost check before making request
        if (this.costOptimization.enabled) {
            const estimatedCost = this.estimateCost(prompt, requestOptions, model);
            if (!this.checkBudget(estimatedCost)) {
                throw new Error(`Request exceeds daily budget. Estimated cost: $${estimatedCost.toFixed(4)}`);
            }
        }

        const messages = [
            {
                role: 'system',
                content: requestOptions.systemPrompt || 'You are a helpful AI assistant with access to current web information.'
            },
            {
                role: 'user',
                content: prompt
            }
        ];

        return new Promise((resolve, reject) => {
            const payload = {
                model: model.id,
                messages: messages,
                max_tokens: requestOptions.maxTokens || 1000,
                temperature: requestOptions.temperature || 0.3,
                stream: requestOptions.stream || false,
                search_mode: requestOptions.searchMode || undefined,
                search_context_size: requestOptions.searchContextSize || undefined,
                latest_updated: requestOptions.latestUpdated || undefined,
                published_after: requestOptions.publishedAfter || undefined,
                published_before: requestOptions.publishedBefore || undefined
            };

            const postData = JSON.stringify(payload);
            const requestConfig = {
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

            const req = https.request(requestConfig, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        
                        if (res.statusCode === 200) {
                            // Track usage and costs
                            this.trackUsage(response, model, requestOptions);
                            
                            resolve({
                                success: true,
                                content: response.choices[0]?.message?.content || '',
                                model: model.id,
                                modelName: model.name,
                                usage: response.usage,
                                cost: this.calculateActualCost(response, model),
                                timestamp: new Date().toISOString(),
                                searchEnabled: model.type === 'search-enabled'
                            });
                        } else {
                            reject(new Error(`API Error: ${response.error?.message || 'Unknown error'}`));
                        }
                    } catch (error) {
                        reject(new Error(`Response parsing failed: ${error.message}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error(`Request failed: ${error.message}`));
            });

            req.write(postData);
            req.end();
        });
    }

    /**
     * Optimize request based on cost preferences and requirements
     */
    optimizeRequest(prompt, options) {
        let selectedModel = options.model || 'sonar';
        
        if (this.costOptimization.preferLowerCost && !options.model) {
            // Auto-select most cost-effective model for the task
            const complexity = this.assessComplexity(prompt);
            
            if (complexity === 'simple') {
                selectedModel = 'sonar';
            } else if (complexity === 'moderate') {
                selectedModel = 'sonarReasoning';
            } else if (complexity === 'complex') {
                selectedModel = 'sonarPro';
            } else {
                selectedModel = 'sonarDeepResearch';
            }
        }

        return {
            modelKey: selectedModel,
            maxTokens: options.maxTokens || (this.costOptimization.preferLowerCost ? 800 : 1000),
            temperature: options.temperature || 0.3,
            systemPrompt: options.systemPrompt,
            stream: options.stream || false,
            searchMode: options.searchMode,
            searchContextSize: options.searchContextSize,
            latestUpdated: options.latestUpdated,
            publishedAfter: options.publishedAfter,
            publishedBefore: options.publishedBefore
        };
    }

    /**
     * Assess prompt complexity for model selection
     */
    assessComplexity(prompt) {
        const complexityIndicators = {
            simple: ['what is', 'define', 'explain briefly', 'quick question'],
            moderate: ['analyze', 'compare', 'explain how', 'why does'],
            complex: ['research', 'comprehensive analysis', 'detailed report', 'in-depth'],
            expert: ['expert analysis', 'academic research', 'scientific', 'technical deep-dive']
        };

        const lowerPrompt = prompt.toLowerCase();
        
        for (const [level, indicators] of Object.entries(complexityIndicators)) {
            if (indicators.some(indicator => lowerPrompt.includes(indicator))) {
                return level;
            }
        }
        
        // Default based on length
        if (prompt.length < 50) return 'simple';
        if (prompt.length < 200) return 'moderate';
        if (prompt.length < 500) return 'complex';
        return 'expert';
    }

    /**
     * Estimate cost before making request
     */
    estimateCost(prompt, options, model) {
        const inputTokens = Math.ceil(prompt.length / 4); // Rough estimation
        const outputTokens = options.maxTokens || 1000;
        const searchQueries = model.type === 'search-enabled' ? 1 : 0;

        let cost = 0;
        cost += (inputTokens / 1000) * (model.costs.input || 0);
        cost += (outputTokens / 1000) * (model.costs.output || 0);
        if (model.costs.inference) {
            cost += (inputTokens / 1000) * model.costs.inference;
        }
        cost += searchQueries * (model.costs.search || 0) / 1000;

        return cost;
    }

    /**
     * Calculate actual cost from API response
     */
    calculateActualCost(response, model) {
        if (!response.usage) return 0;

        let cost = 0;
        const usage = response.usage;
        
        cost += (usage.prompt_tokens / 1000) * (model.costs.input || 0);
        cost += (usage.completion_tokens / 1000) * (model.costs.output || 0);
        
        if (model.costs.inference && usage.total_tokens) {
            cost += (usage.prompt_tokens / 1000) * model.costs.inference;
        }
        
        // Add search cost if search was used
        if (model.type === 'search-enabled') {
            cost += (model.costs.search || 0) / 1000;
        }

        return cost;
    }

    /**
     * Check if request is within budget
     */
    checkBudget(estimatedCost) {
        if (!this.costOptimization.budget) return true;
        
        const today = new Date().toDateString();
        const todayUsage = this.usage.dailyUsage.get(today) || { cost: 0, queries: 0 };
        
        return (todayUsage.cost + estimatedCost) <= this.costOptimization.budget;
    }

    /**
     * Track usage and costs
     */
    trackUsage(response, model, options) {
        if (!this.costOptimization.trackUsage) return;

        const cost = this.calculateActualCost(response, model);
        const today = new Date().toDateString();
        
        // Update totals
        this.usage.totalCost += cost;
        this.usage.totalQueries += 1;
        this.usage.totalTokens += response.usage?.total_tokens || 0;

        // Update daily usage
        const todayUsage = this.usage.dailyUsage.get(today) || { cost: 0, queries: 0, tokens: 0, models: {} };
        todayUsage.cost += cost;
        todayUsage.queries += 1;
        todayUsage.tokens += response.usage?.total_tokens || 0;
        todayUsage.models[model.id] = (todayUsage.models[model.id] || 0) + 1;
        
        this.usage.dailyUsage.set(today, todayUsage);

        // Save usage data
        this.saveUsageTracking();
    }

    /**
     * Advanced research with optimized model selection
     */
    async research(topic, options = {}) {
        const researchModel = options.deep ? 'sonarDeepResearch' : 
                             options.fast ? 'sonar' : 'sonarPro';

        const prompt = `Research and analyze: ${topic}

Please provide:
- Current state and latest developments
- Key insights and trends  
- Practical recommendations
- Specific actionable next steps

Use web search to ensure information is current and accurate.`;

        return await this.makeRequest(prompt, {
            model: researchModel,
            maxTokens: options.maxTokens || 2000,
            searchMode: 'academic',
            searchContextSize: 'medium',
            systemPrompt: 'You are a research analyst with access to current web information. Provide comprehensive, well-sourced analysis.',
            ...options
        });
    }

    /**
     * Cost-optimized quick query
     */
    async quickQuery(question, options = {}) {
        return await this.makeRequest(question, {
            model: 'sonar',
            maxTokens: 500,
            temperature: 0.2,
            systemPrompt: 'Provide a concise, accurate answer.',
            ...options
        });
    }

    /**
     * Expert analysis with top-tier models
     */
    async expertAnalysis(prompt, options = {}) {
        const expertModel = options.coding ? 'gpt5' : 
                           options.creative ? 'claudeOpus41' :
                           options.multimodal ? 'gemini25Pro' : 'sonarReasoningPro';

        return await this.makeRequest(prompt, {
            model: expertModel,
            maxTokens: options.maxTokens || 3000,
            temperature: options.temperature || 0.1,
            systemPrompt: 'You are an expert analyst. Provide detailed, high-quality analysis.',
            ...options
        });
    }

    /**
     * Get usage statistics
     */
    getUsageStats() {
        const today = new Date().toDateString();
        const todayUsage = this.usage.dailyUsage.get(today) || { cost: 0, queries: 0, tokens: 0 };

        return {
            total: {
                cost: this.usage.totalCost,
                queries: this.usage.totalQueries,
                tokens: this.usage.totalTokens
            },
            today: todayUsage,
            averageCostPerQuery: this.usage.totalQueries > 0 ? this.usage.totalCost / this.usage.totalQueries : 0,
            budgetStatus: this.costOptimization.budget ? {
                budget: this.costOptimization.budget,
                used: todayUsage.cost,
                remaining: Math.max(0, this.costOptimization.budget - todayUsage.cost),
                percentUsed: (todayUsage.cost / this.costOptimization.budget) * 100
            } : null
        };
    }

    /**
     * Get model information
     */
    getModels() {
        return Object.values(this.models).map(model => ({
            id: model.id,
            name: model.name,
            type: model.type,
            capabilities: model.capabilities,
            description: model.description,
            contextWindow: model.contextWindow,
            costs: model.costs
        }));
    }

    /**
     * Save usage tracking to file
     */
    async saveUsageTracking() {
        try {
            const data = {
                usage: this.usage,
                lastUpdated: new Date().toISOString()
            };
            await fs.writeFile('perplexity-usage-tracking.json', JSON.stringify(data, null, 2));
        } catch (error) {
            console.warn('Failed to save usage tracking:', error.message);
        }
    }

    /**
     * Load usage tracking from file
     */
    async loadUsageTracking() {
        try {
            const data = await fs.readFile('perplexity-usage-tracking.json', 'utf8');
            const parsed = JSON.parse(data);
            
            if (parsed.usage) {
                this.usage = {
                    ...parsed.usage,
                    dailyUsage: new Map(Object.entries(parsed.usage.dailyUsage || {}))
                };
            }
        } catch (error) {
            // File doesn't exist or is invalid, start with empty tracking
            console.log('Starting with fresh usage tracking');
        }
    }
}

module.exports = EnhancedPerplexityAPI;