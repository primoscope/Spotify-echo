#!/usr/bin/env node

/**
 * Music App Perplexity Research Integration
 * 
 * Enhanced research system specifically for music app development,
 * providing targeted research queries and intelligent result processing
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const { RealPerplexityIntegration } = require('../real-perplexity-integration.js');

class MusicPerplexityResearch {
    constructor() {
        this.perplexity = new RealPerplexityIntegration();
        this.researchResultsPath = '../enhanced-perplexity-results/';
        this.researchCache = new Map();
        this.researchHistory = [];
        
        // Music-specific research categories with targeted queries
        this.researchCategories = {
            spotify: {
                name: 'Spotify Integration & API',
                description: 'Latest Spotify Web API changes, best practices, and optimization strategies',
                queries: [
                    {
                        query: "Latest Spotify Web API changes for recommendations and audio-features, PKCE best practices 2024",
                        focus: 'API updates and security',
                        expectedInsights: ['PKCE implementation', 'API rate limits', 'OAuth 2.0 changes']
                    },
                    {
                        query: "Optimizing 429 handling and batching for Spotify track endpoints with exponential backoff",
                        focus: 'Performance and reliability',
                        expectedInsights: ['Rate limiting strategies', 'Batch processing', 'Error handling']
                    },
                    {
                        query: "Spotify recommendations parameters and feature targeting (danceability, energy, valence, tempo) best practices",
                        focus: 'Recommendation algorithms',
                        expectedInsights: ['Audio feature usage', 'Parameter optimization', 'User experience']
                    },
                    {
                        query: "Spotify playlist management and collaborative features implementation patterns 2024",
                        focus: 'Playlist functionality',
                        expectedInsights: ['Collaborative playlists', 'Playlist sharing', 'User permissions']
                    }
                ]
            },
            recommendations: {
                name: 'Music Recommendation Systems',
                description: 'Advanced recommendation algorithms, hybrid approaches, and context-aware systems',
                queries: [
                    {
                        query: "Hybrid music recommendation: combining content-based audio features and collaborative filters in production 2024",
                        focus: 'Algorithm architecture',
                        expectedInsights: ['Hybrid approaches', 'Content-based filtering', 'Collaborative filtering']
                    },
                    {
                        query: "Context-aware music recommendations (time-of-day, mood, session signals) implementation patterns",
                        focus: 'Contextual recommendations',
                        expectedInsights: ['Temporal patterns', 'Mood detection', 'Session analysis']
                    },
                    {
                        query: "Bandit strategies for music recommendation exploration and user engagement optimization",
                        focus: 'Exploration strategies',
                        expectedInsights: ['Multi-armed bandits', 'Exploration vs exploitation', 'User engagement']
                    },
                    {
                        query: "Music recommendation evaluation metrics: accuracy, diversity, novelty, and user satisfaction",
                        focus: 'Evaluation and metrics',
                        expectedInsights: ['Evaluation frameworks', 'Diversity metrics', 'User satisfaction']
                    }
                ]
            },
            frontend: {
                name: 'Frontend Music Experience',
                description: 'React 19 patterns, media UI optimization, and accessibility for music applications',
                queries: [
                    {
                        query: "React 19 patterns for low-latency media UIs with MUI accessibility and concurrent features",
                        focus: 'React performance',
                        expectedInsights: ['Concurrent features', 'Media optimization', 'Accessibility patterns']
                    },
                    {
                        query: "Vite chunking and preloading strategies for media-heavy music applications",
                        focus: 'Build optimization',
                        expectedInsights: ['Code splitting', 'Preloading strategies', 'Bundle optimization']
                    },
                    {
                        query: "PWA playbook for offline caches of metadata and small previews in music apps",
                        focus: 'Offline functionality',
                        expectedInsights: ['Service workers', 'Cache strategies', 'Offline UX']
                    },
                    {
                        query: "Audio player UI/UX best practices: controls, visualizations, and accessibility",
                        focus: 'Audio player design',
                        expectedInsights: ['Control design', 'Visual feedback', 'Accessibility standards']
                    }
                ]
            },
            backend: {
                name: 'Backend Performance & Scalability',
                description: 'Node.js optimization, real-time performance, and caching strategies for music platforms',
                queries: [
                    {
                        query: "Express + Socket.IO performance tuning at scale for real-time music applications",
                        focus: 'Real-time performance',
                        expectedInsights: ['Socket.IO optimization', 'Express tuning', 'Scalability patterns']
                    },
                    {
                        query: "Node.js 20 performance optimization for music streaming and recommendation APIs",
                        focus: 'Node.js optimization',
                        expectedInsights: ['Performance tuning', 'Memory management', 'API optimization']
                    },
                    {
                        query: "Redis caching strategies for audio features and track metadata in music platforms",
                        focus: 'Caching strategies',
                        expectedInsights: ['Cache patterns', 'TTL strategies', 'Memory optimization']
                    },
                    {
                        query: "Microservices architecture for music recommendation systems: patterns and best practices",
                        focus: 'Architecture patterns',
                        expectedInsights: ['Service boundaries', 'Communication patterns', 'Deployment strategies']
                    }
                ]
            },
            data: {
                name: 'Data Architecture & Analytics',
                description: 'Database optimization, ETL patterns, and analytics for music platforms',
                queries: [
                    {
                        query: "MongoDB indexing and aggregations for time-series listening data and audio feature queries",
                        focus: 'Database optimization',
                        expectedInsights: ['Indexing strategies', 'Aggregation pipelines', 'Performance optimization']
                    },
                    {
                        query: "Event-driven ETL patterns for music recommendation systems and user preference aggregation",
                        focus: 'Data processing',
                        expectedInsights: ['ETL patterns', 'Event streaming', 'Data aggregation']
                    },
                    {
                        query: "Database schema optimization for music discovery platforms with real-time updates",
                        focus: 'Schema design',
                        expectedInsights: ['Schema patterns', 'Real-time updates', 'Data modeling']
                    },
                    {
                        query: "Music analytics and insights: user behavior patterns, genre analysis, and trend detection",
                        focus: 'Analytics and insights',
                        expectedInsights: ['Behavior analysis', 'Trend detection', 'Insight generation']
                    }
                ]
            },
            ai: {
                name: 'AI & Machine Learning',
                description: 'AI integration, ML models, and intelligent features for music applications',
                queries: [
                    {
                        query: "AI-powered music analysis: genre classification, mood detection, and style recognition",
                        focus: 'AI analysis',
                        expectedInsights: ['Genre classification', 'Mood detection', 'Style recognition']
                    },
                    {
                        query: "Natural language processing for music search and conversational music assistants",
                        focus: 'NLP integration',
                        expectedInsights: ['Search optimization', 'Conversational AI', 'User intent']
                    },
                    {
                        query: "Machine learning model deployment for music recommendation systems in production",
                        focus: 'ML deployment',
                        expectedInsights: ['Model serving', 'Production deployment', 'Performance monitoring']
                    },
                    {
                        query: "Federated learning approaches for music recommendation privacy and personalization",
                        focus: 'Privacy and personalization',
                        expectedInsights: ['Federated learning', 'Privacy preservation', 'Personalization strategies']
                    }
                ]
            }
        };
    }

    /**
     * Initialize the research system
     */
    async initialize() {
        console.log('🔍 Initializing Music Perplexity Research System...');
        
        await this.ensureDirectories();
        await this.loadResearchHistory();
        
        console.log('✅ Research system initialized successfully');
        console.log(`📚 Available research categories: ${Object.keys(this.researchCategories).length}`);
    }

    /**
     * Execute comprehensive research for a specific component
     */
    async executeComponentResearch(component, options = {}) {
        console.log(`🔬 Executing research for ${component} component...`);
        
        const category = this.researchCategories[component];
        if (!category) {
            throw new Error(`Unknown research category: ${component}`);
        }
        
        const researchResults = {
            component,
            category: category.name,
            timestamp: new Date().toISOString(),
            queries: [],
            insights: [],
            recommendations: [],
            citations: [],
            implementationPriority: [],
            estimatedEffort: {},
            nextSteps: []
        };
        
        // Execute research queries
        for (const queryConfig of category.queries) {
            try {
                console.log(`  📚 Researching: ${queryConfig.focus}`);
                
                const result = await this.executeResearchQuery(queryConfig, options);
                researchResults.queries.push(result);
                
                // Extract insights and recommendations
                researchResults.insights.push(...result.insights);
                researchResults.recommendations.push(...result.recommendations);
                researchResults.citations.push(...result.citations);
                
                // Analyze implementation priority
                const priority = this.analyzeImplementationPriority(result, queryConfig);
                researchResults.implementationPriority.push(priority);
                
            } catch (error) {
                console.error(`  ❌ Research failed for ${queryConfig.focus}: ${error.message}`);
                researchResults.errors = researchResults.errors || [];
                researchResults.errors.push({ focus: queryConfig.focus, error: error.message });
            }
        }
        
        // Generate implementation estimates
        researchResults.estimatedEffort = this.generateEffortEstimates(researchResults);
        
        // Generate next steps
        researchResults.nextSteps = this.generateNextSteps(researchResults);
        
        // Save research results
        await this.saveResearchResults(researchResults);
        
        // Update research history
        this.researchHistory.push({
            component,
            timestamp: researchResults.timestamp,
            insightsCount: researchResults.insights.length,
            recommendationsCount: researchResults.recommendations.length
        });
        
        console.log(`  ✅ Research completed with ${researchResults.insights.length} insights`);
        return researchResults;
    }

    /**
     * Execute individual research query
     */
    async executeResearchQuery(queryConfig, options = {}) {
        const cacheKey = `${queryConfig.focus}:${queryConfig.query}`;
        
        // Check cache first
        if (this.researchCache.has(cacheKey) && !options.forceRefresh) {
            console.log(`    📋 Using cached research for: ${queryConfig.focus}`);
            return this.researchCache.get(cacheKey);
        }
        
        console.log(`    🔍 Executing query: ${queryConfig.query.substring(0, 80)}...`);
        
        const result = await this.perplexity.makeRequest(
            queryConfig.query,
            options.model || 'grok-4-equivalent',
            { 
                maxTokens: options.maxTokens || 2000,
                temperature: options.temperature || 0.7
            }
        );
        
        // Process and structure the response
        const processedResult = {
            focus: queryConfig.focus,
            query: queryConfig.query,
            response: result.response,
            insights: this.extractStructuredInsights(result.response, queryConfig.expectedInsights),
            recommendations: this.extractStructuredRecommendations(result.response),
            citations: result.citations || [],
            model: result.model,
            tokens: result.usage?.total_tokens || 0,
            timestamp: new Date().toISOString(),
            relevance: this.calculateRelevance(result.response, queryConfig.expectedInsights)
        };
        
        // Cache the result
        this.researchCache.set(cacheKey, processedResult);
        
        return processedResult;
    }

    /**
     * Extract structured insights from research response
     */
    extractStructuredInsights(response, expectedInsights) {
        const insights = [];
        const lines = response.split('\n');
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Look for insight patterns
            if (trimmedLine.includes('insight') || 
                trimmedLine.includes('finding') || 
                trimmedLine.includes('discovery') ||
                trimmedLine.includes('pattern') ||
                trimmedLine.includes('trend')) {
                
                insights.push({
                    text: trimmedLine,
                    category: this.categorizeInsight(trimmedLine, expectedInsights),
                    confidence: this.assessConfidence(trimmedLine),
                    timestamp: new Date().toISOString()
                });
            }
        }
        
        return insights.slice(0, 15); // Limit to top 15 insights
    }

    /**
     * Extract structured recommendations from research response
     */
    extractStructuredRecommendations(response) {
        const recommendations = [];
        const lines = response.split('\n');
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Look for recommendation patterns
            if (trimmedLine.includes('recommend') || 
                trimmedLine.includes('should') || 
                trimmedLine.includes('best practice') ||
                trimmedLine.includes('consider') ||
                trimmedLine.includes('implement')) {
                
                recommendations.push({
                    text: trimmedLine,
                    priority: this.assessPriority(trimmedLine),
                    effort: this.assessEffort(trimmedLine),
                    impact: this.assessImpact(trimmedLine),
                    timestamp: new Date().toISOString()
                });
            }
        }
        
        return recommendations.slice(0, 10); // Limit to top 10 recommendations
    }

    /**
     * Categorize insight based on expected categories
     */
    categorizeInsight(insight, expectedInsights) {
        for (const expected of expectedInsights) {
            if (insight.toLowerCase().includes(expected.toLowerCase())) {
                return expected;
            }
        }
        return 'general';
    }

    /**
     * Assess confidence level of insight
     */
    assessConfidence(insight) {
        const text = insight.toLowerCase();
        
        if (text.includes('proven') || text.includes('verified') || text.includes('confirmed')) {
            return 'high';
        } else if (text.includes('suggest') || text.includes('indicate') || text.includes('appear')) {
            return 'medium';
        } else if (text.includes('might') || text.includes('could') || text.includes('possibly')) {
            return 'low';
        }
        
        return 'medium';
    }

    /**
     * Assess priority of recommendation
     */
    assessPriority(recommendation) {
        const text = recommendation.toLowerCase();
        
        if (text.includes('critical') || text.includes('essential') || text.includes('must')) {
            return 'high';
        } else if (text.includes('important') || text.includes('should') || text.includes('recommended')) {
            return 'medium';
        } else if (text.includes('consider') || text.includes('optional') || text.includes('nice to have')) {
            return 'low';
        }
        
        return 'medium';
    }

    /**
     * Assess effort required for recommendation
     */
    assessEffort(recommendation) {
        const text = recommendation.toLowerCase();
        
        if (text.includes('simple') || text.includes('quick') || text.includes('minor')) {
            return 'low';
        } else if (text.includes('moderate') || text.includes('standard') || text.includes('typical')) {
            return 'medium';
        } else if (text.includes('complex') || text.includes('major') || text.includes('significant')) {
            return 'high';
        }
        
        return 'medium';
    }

    /**
     * Assess impact of recommendation
     */
    assessImpact(recommendation) {
        const text = recommendation.toLowerCase();
        
        if (text.includes('critical') || text.includes('major') || text.includes('significant')) {
            return 'high';
        } else if (text.includes('moderate') || text.includes('noticeable') || text.includes('improvement')) {
            return 'medium';
        } else if (text.includes('minor') || text.includes('small') || text.includes('incremental')) {
            return 'low';
        }
        
        return 'medium';
    }

    /**
     * Calculate relevance score for research result
     */
    calculateRelevance(response, expectedInsights) {
        let relevanceScore = 0;
        const responseLower = response.toLowerCase();
        
        for (const insight of expectedInsights) {
            if (responseLower.includes(insight.toLowerCase())) {
                relevanceScore += 1;
            }
        }
        
        return Math.min(relevanceScore / expectedInsights.length, 1.0);
    }

    /**
     * Analyze implementation priority based on research results
     */
    analyzeImplementationPriority(result, queryConfig) {
        const priority = {
            focus: queryConfig.focus,
            relevance: result.relevance,
            insightsCount: result.insights.length,
            recommendationsCount: result.recommendations.length,
            priority: 'medium',
            reasoning: ''
        };
        
        // Determine priority based on relevance and content
        if (result.relevance > 0.8 && result.recommendations.length > 5) {
            priority.priority = 'high';
            priority.reasoning = 'High relevance with actionable recommendations';
        } else if (result.relevance < 0.4 || result.insights.length < 3) {
            priority.priority = 'low';
            priority.reasoning = 'Low relevance or insufficient insights';
        } else {
            priority.priority = 'medium';
            priority.reasoning = 'Moderate relevance with some actionable content';
        }
        
        return priority;
    }

    /**
     * Generate effort estimates for implementation
     */
    generateEffortEstimates(researchResults) {
        const estimates = {
            total: { hours: 0, complexity: 'medium' },
            byPriority: { high: 0, medium: 0, low: 0 },
            byCategory: {}
        };
        
        // Calculate effort by priority
        for (const priority of researchResults.implementationPriority) {
            let effort = 0;
            
            if (priority.priority === 'high') {
                effort = 8; // 8 hours for high priority
                estimates.byPriority.high += effort;
            } else if (priority.priority === 'medium') {
                effort = 4; // 4 hours for medium priority
                estimates.byPriority.medium += effort;
            } else {
                effort = 2; // 2 hours for low priority
                estimates.byPriority.low += effort;
            }
            
            estimates.total.hours += effort;
        }
        
        // Determine overall complexity
        if (estimates.total.hours > 40) {
            estimates.total.complexity = 'high';
        } else if (estimates.total.hours > 20) {
            estimates.total.complexity = 'medium';
        } else {
            estimates.total.complexity = 'low';
        }
        
        return estimates;
    }

    /**
     * Generate next steps based on research results
     */
    generateNextSteps(researchResults) {
        const nextSteps = [];
        
        // High priority implementations
        const highPriority = researchResults.implementationPriority.filter(p => p.priority === 'high');
        if (highPriority.length > 0) {
            nextSteps.push({
                priority: 'high',
                action: `Implement ${highPriority.length} high-priority research findings`,
                estimatedEffort: `${researchResults.estimatedEffort.byPriority.high} hours`,
                impact: 'Immediate improvement in music app functionality'
            });
        }
        
        // Medium priority implementations
        const mediumPriority = researchResults.implementationPriority.filter(p => p.priority === 'medium');
        if (mediumPriority.length > 0) {
            nextSteps.push({
                priority: 'medium',
                action: `Plan implementation of ${mediumPriority.length} medium-priority findings`,
                estimatedEffort: `${researchResults.estimatedEffort.byPriority.medium} hours`,
                impact: 'Gradual improvement in user experience'
            });
        }
        
        // Research follow-up
        if (researchResults.recommendations.length > 0) {
            nextSteps.push({
                priority: 'medium',
                action: 'Conduct follow-up research on specific recommendations',
                estimatedEffort: '4-8 hours',
                impact: 'Deeper understanding of implementation details'
            });
        }
        
        // Documentation
        nextSteps.push({
            priority: 'low',
            action: 'Document research findings and implementation roadmap',
            estimatedEffort: '2-4 hours',
            impact: 'Knowledge preservation and team alignment'
        });
        
        return nextSteps;
    }

    /**
     * Save research results to file
     */
    async saveResearchResults(researchResults) {
        const filename = `${researchResults.component}-research-${Date.now()}.json`;
        const filepath = path.join(this.researchResultsPath, filename);
        
        await fs.writeFile(filepath, JSON.stringify(researchResults, null, 2));
        console.log(`  💾 Research results saved to: ${filepath}`);
    }

    /**
     * Load research history
     */
    async loadResearchHistory() {
        try {
            const historyPath = path.join(this.researchResultsPath, 'research-history.json');
            const historyData = await fs.readFile(historyPath, 'utf8');
            this.researchHistory = JSON.parse(historyData);
        } catch (error) {
            // Initialize empty history if file doesn't exist
            this.researchHistory = [];
        }
    }

    /**
     * Save research history
     */
    async saveResearchHistory() {
        const historyPath = path.join(this.researchResultsPath, 'research-history.json');
        await fs.writeFile(historyPath, JSON.stringify(this.researchHistory, null, 2));
    }

    /**
     * Ensure required directories exist
     */
    async ensureDirectories() {
        try {
            await fs.mkdir(this.researchResultsPath, { recursive: true });
        } catch (error) {
            // Directory already exists
        }
    }

    /**
     * Generate research summary report
     */
    async generateResearchSummary() {
        const summary = {
            timestamp: new Date().toISOString(),
            totalResearchSessions: this.researchHistory.length,
            componentsResearched: [...new Set(this.researchHistory.map(h => h.component))],
            totalInsights: this.researchHistory.reduce((sum, h) => sum + h.insightsCount, 0),
            totalRecommendations: this.researchHistory.reduce((sum, h) => sum + h.recommendationsCount, 0),
            cacheSize: this.researchCache.size,
            recommendations: [
                'Continue monitoring for new research opportunities',
                'Implement high-priority findings',
                'Share research insights with development team',
                'Schedule regular research review sessions'
            ]
        };
        
        const summaryPath = path.join(this.researchResultsPath, `research-summary-${Date.now()}.json`);
        await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
        
        console.log('📊 Research summary generated');
        return summary;
    }
}

// Main execution
if (require.main === module) {
    const research = new MusicPerplexityResearch();
    
    research.initialize()
        .then(async () => {
            // Example: Research frontend component
            const results = await research.executeComponentResearch('frontend');
            console.log('\n🎯 Frontend research completed');
            console.log(`📊 Found ${results.insights.length} insights and ${results.recommendations.length} recommendations`);
            
            // Generate summary
            await research.generateResearchSummary();
        })
        .catch(error => {
            console.error('❌ Research failed:', error);
            process.exit(1);
        });
}

module.exports = { MusicPerplexityResearch };