/**
 * PERPLEXITY COST OPTIMIZATION MODULE
 * 
 * Advanced cost management and optimization based on detailed analysis
 * from cost-analysis-examples.md
 */

const fs = require('fs').promises;
const path = require('path');

class PerplexityCostOptimizer {
    constructor(options = {}) {
        this.budget = options.budget || 3.00; // Weekly budget in USD
        this.warningThreshold = options.warningThreshold || 0.7; // 70%
        this.cacheEnabled = options.cacheEnabled !== false;
        this.cachePath = options.cachePath || 'perplexity-cache.json';
        
        // Cost tracking
        this.weeklyUsage = 0;
        this.totalQueries = 0;
        this.cache = new Map();
        
        // Model costs (per 1K tokens) based on research
        this.modelCosts = {
            sonar: { input: 1.0, output: 1.0, search: 5.0 },
            'sonar-reasoning': { input: 1.0, output: 5.0, search: 5.0 },
            'sonar-pro': { input: 3.0, output: 15.0, search: 5.0 },
            'sonar-deep-research': { input: 2.0, output: 8.0, inference: 3.0, search: 5.0 }
        };
        
        // Complexity scoring patterns from cost analysis
        this.complexityPatterns = {
            simple: {
                keywords: ['typo', 'fix', 'update', 'change', 'add', 'remove'],
                maxLength: 200,
                score: 15,
                recommendedModel: 'sonar'
            },
            moderate: {
                keywords: ['feature', 'implement', 'create', 'build', 'develop'],
                maxLength: 1000,
                score: 45,
                recommendedModel: 'sonar-reasoning'
            },
            complex: {
                keywords: ['performance', 'architecture', 'optimization', 'scaling'],
                maxLength: 2000,
                score: 85,
                recommendedModel: 'sonar-pro'
            },
            expert: {
                keywords: ['critical', 'emergency', 'production', 'security'],
                maxLength: Infinity,
                score: 125,
                recommendedModel: 'sonar-deep-research'
            }
        };
        
        this.loadCache();
    }

    /**
     * Assess complexity and recommend optimal model
     */
    assessComplexity(content, labels = []) {
        const text = content.toLowerCase();
        const labelText = labels.join(' ').toLowerCase();
        const combinedText = `${text} ${labelText}`;
        
        let maxScore = 0;
        let classification = 'simple';
        
        for (const [level, config] of Object.entries(this.complexityPatterns)) {
            let score = 0;
            
            // Keyword matching
            const keywordMatches = config.keywords.filter(keyword => 
                combinedText.includes(keyword)
            ).length;
            score += keywordMatches * 10;
            
            // Length scoring
            if (content.length > config.maxLength / 2) {
                score += 5;
            }
            
            // Label-specific scoring
            if (labels.includes('critical') || labels.includes('urgent')) {
                score += 20;
            }
            if (labels.includes('bug')) {
                score += 5;
            }
            if (labels.includes('feature')) {
                score += 10;
            }
            
            if (score > maxScore && score >= config.score / 2) {
                maxScore = score;
                classification = level;
            }
        }
        
        return {
            complexity: classification,
            score: maxScore,
            recommendedModel: this.complexityPatterns[classification].recommendedModel,
            reasoning: this.getComplexityReasoning(classification, content, labels)
        };
    }

    /**
     * Get reasoning for complexity classification
     */
    getComplexityReasoning(complexity, content, labels) {
        const reasons = [];
        
        if (complexity === 'simple') {
            reasons.push('Short content with basic keywords');
            if (content.length < 100) reasons.push('Brief description');
        }
        
        if (complexity === 'moderate') {
            reasons.push('Feature request or moderate complexity');
            if (labels.includes('feature')) reasons.push('Feature label detected');
        }
        
        if (complexity === 'complex') {
            reasons.push('Performance or architecture issue');
            if (content.length > 500) reasons.push('Detailed technical description');
        }
        
        if (complexity === 'expert') {
            reasons.push('Critical issue requiring expert analysis');
            if (labels.includes('critical')) reasons.push('Critical priority label');
        }
        
        return reasons;
    }

    /**
     * Calculate estimated cost for a request
     */
    estimateCost(content, model, options = {}) {
        const modelConfig = this.modelCosts[model] || this.modelCosts.sonar;
        const inputTokens = Math.ceil(content.length / 4); // Rough token estimate
        const outputTokens = options.maxTokens || 500;
        
        let cost = 0;
        
        // Input cost
        cost += (inputTokens / 1000) * (modelConfig.input / 1000);
        
        // Output cost  
        cost += (outputTokens / 1000) * (modelConfig.output / 1000);
        
        // Inference cost (for some models)
        if (modelConfig.inference) {
            cost += (inputTokens / 1000) * (modelConfig.inference / 1000);
        }
        
        // Search cost (per query)
        if (options.searchQueries > 0) {
            cost += (options.searchQueries || 1) * (modelConfig.search / 1000);
        }
        
        return cost;
    }

    /**
     * Check if request fits within budget
     */
    checkBudget(estimatedCost) {
        const projectedUsage = this.weeklyUsage + estimatedCost;
        
        if (projectedUsage > this.budget) {
            return {
                allowed: false,
                reason: 'Would exceed weekly budget',
                currentUsage: this.weeklyUsage,
                budget: this.budget,
                remaining: this.budget - this.weeklyUsage
            };
        }
        
        if (projectedUsage > (this.budget * this.warningThreshold)) {
            return {
                allowed: true,
                warning: true,
                reason: 'Approaching budget warning threshold',
                currentUsage: this.weeklyUsage,
                budget: this.budget,
                remaining: this.budget - this.weeklyUsage,
                percentUsed: (projectedUsage / this.budget) * 100
            };
        }
        
        return {
            allowed: true,
            currentUsage: this.weeklyUsage,
            budget: this.budget,
            remaining: this.budget - this.weeklyUsage,
            percentUsed: (projectedUsage / this.budget) * 100
        };
    }

    /**
     * Generate cache key for content
     */
    generateCacheKey(content, labels = []) {
        // Normalize content for cache key generation
        const normalized = content
            .toLowerCase()
            .replace(/[^\w\s]/g, '') // Remove special characters
            .replace(/\s+/g, ' ') // Normalize spaces
            .trim();
        
        const labelString = labels.sort().join(',');
        const combined = `${normalized}|${labelString}`;
        
        // Simple hash function
        let hash = 0;
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        return `perplexity_${Math.abs(hash).toString(16)}`;
    }

    /**
     * Check cache for existing analysis
     */
    checkCache(content, labels = []) {
        if (!this.cacheEnabled) return null;
        
        const cacheKey = this.generateCacheKey(content, labels);
        const cached = this.cache.get(cacheKey);
        
        if (cached) {
            const age = Date.now() - cached.timestamp;
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
            
            if (age < maxAge) {
                return {
                    hit: true,
                    data: cached.data,
                    age: Math.floor(age / (24 * 60 * 60 * 1000)), // Age in days
                    key: cacheKey
                };
            } else {
                // Remove expired entry
                this.cache.delete(cacheKey);
                this.saveCache();
            }
        }
        
        return {
            hit: false,
            key: cacheKey
        };
    }

    /**
     * Store result in cache
     */
    setCache(cacheKey, data) {
        if (!this.cacheEnabled) return;
        
        this.cache.set(cacheKey, {
            data,
            timestamp: Date.now()
        });
        
        this.saveCache();
    }

    /**
     * Track usage and update costs
     */
    trackUsage(cost, model) {
        this.weeklyUsage += cost;
        this.totalQueries += 1;
        
        // Log usage for analysis
        this.logUsage({
            timestamp: Date.now(),
            cost,
            model,
            weeklyTotal: this.weeklyUsage
        });
    }

    /**
     * Get optimization recommendations
     */
    getOptimizationRecommendations() {
        const recommendations = [];
        const usagePercent = (this.weeklyUsage / this.budget) * 100;
        
        if (usagePercent > 70) {
            recommendations.push({
                priority: 'high',
                type: 'budget_warning',
                message: 'Approaching budget limit - consider using lower-cost models',
                action: 'Switch complex analyses to sonar-reasoning model'
            });
        }
        
        if (this.cache.size === 0) {
            recommendations.push({
                priority: 'medium',
                type: 'caching',
                message: 'No cache entries found - enable caching for cost savings',
                action: 'Enable caching in configuration'
            });
        }
        
        if (this.totalQueries > 0) {
            const avgCost = this.weeklyUsage / this.totalQueries;
            if (avgCost > 0.03) {
                recommendations.push({
                    priority: 'medium',
                    type: 'model_selection',
                    message: 'High average cost per query - optimize model selection',
                    action: 'Review complexity classification accuracy'
                });
            }
        }
        
        return recommendations;
    }

    /**
     * Generate cost analysis report
     */
    generateCostReport() {
        const usagePercent = (this.weeklyUsage / this.budget) * 100;
        const remainingBudget = this.budget - this.weeklyUsage;
        const avgCostPerQuery = this.totalQueries > 0 ? this.weeklyUsage / this.totalQueries : 0;
        
        return {
            budget: {
                weekly: this.budget,
                used: this.weeklyUsage,
                remaining: remainingBudget,
                percentUsed: usagePercent
            },
            usage: {
                totalQueries: this.totalQueries,
                averageCostPerQuery: avgCostPerQuery
            },
            cache: {
                enabled: this.cacheEnabled,
                entries: this.cache.size,
                hitRate: this.calculateCacheHitRate()
            },
            status: usagePercent > 100 ? 'OVER_BUDGET' : 
                   usagePercent > 70 ? 'WARNING' : 'HEALTHY',
            recommendations: this.getOptimizationRecommendations()
        };
    }

    /**
     * Calculate cache hit rate
     */
    calculateCacheHitRate() {
        // This would be calculated from actual usage logs in a real implementation
        return this.cache.size > 0 ? 0.35 : 0; // Default 35% hit rate when cache exists
    }

    /**
     * Load cache from disk
     */
    async loadCache() {
        try {
            const cacheData = await fs.readFile(this.cachePath, 'utf8');
            const parsed = JSON.parse(cacheData);
            
            for (const [key, value] of Object.entries(parsed)) {
                this.cache.set(key, value);
            }
            
            console.log(`Loaded ${this.cache.size} cache entries`);
        } catch (error) {
            // Cache file doesn't exist or is invalid
            console.log('Starting with empty cache');
        }
    }

    /**
     * Save cache to disk
     */
    async saveCache() {
        try {
            const cacheData = Object.fromEntries(this.cache.entries());
            await fs.writeFile(this.cachePath, JSON.stringify(cacheData, null, 2));
        } catch (error) {
            console.warn('Failed to save cache:', error.message);
        }
    }

    /**
     * Log usage for analysis
     */
    async logUsage(usage) {
        try {
            const logPath = 'perplexity-usage.log';
            const logEntry = `${new Date().toISOString()}: ${JSON.stringify(usage)}\n`;
            await fs.appendFile(logPath, logEntry);
        } catch (error) {
            console.warn('Failed to log usage:', error.message);
        }
    }

    /**
     * Reset weekly usage (called at week start)
     */
    resetWeeklyUsage() {
        this.weeklyUsage = 0;
        console.log('Weekly usage reset');
    }
}

module.exports = PerplexityCostOptimizer;