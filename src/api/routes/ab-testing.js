/**
 * A/B Testing Framework for Music Recommendations
 * Enables testing different recommendation algorithms and strategies
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');

class ABTestingFramework {
    constructor() {
        this.activeTests = new Map();
        this.userAssignments = new Map();
        this.testResults = new Map();
        this.initializeDefaultTests();
    }

    /**
     * Initialize default A/B tests for recommendations
     */
    initializeDefaultTests() {
        this.createTest({
            id: 'recommendation_algorithm',
            name: 'Recommendation Algorithm Comparison',
            description: 'Testing collaborative filtering vs. content-based recommendations',
            variants: [
                {
                    id: 'collaborative_filtering',
                    name: 'Collaborative Filtering',
                    weight: 50,
                    config: {
                        algorithm: 'collaborative',
                        useUserSimilarity: true,
                        diversityFactor: 0.3
                    }
                },
                {
                    id: 'content_based',
                    name: 'Content-Based Filtering',
                    weight: 50,
                    config: {
                        algorithm: 'content_based',
                        useAudioFeatures: true,
                        diversityFactor: 0.5
                    }
                }
            ],
            metrics: ['click_through_rate', 'play_time', 'user_satisfaction'],
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            status: 'active'
        });

        this.createTest({
            id: 'recommendation_count',
            name: 'Optimal Recommendation Count',
            description: 'Testing different numbers of recommendations per request',
            variants: [
                {
                    id: 'count_10',
                    name: '10 Recommendations',
                    weight: 33,
                    config: { recommendationCount: 10 }
                },
                {
                    id: 'count_15',
                    name: '15 Recommendations',
                    weight: 34,
                    config: { recommendationCount: 15 }
                },
                {
                    id: 'count_20',
                    name: '20 Recommendations',
                    weight: 33,
                    config: { recommendationCount: 20 }
                }
            ],
            metrics: ['engagement_rate', 'session_duration', 'recommendation_clicks'],
            startDate: new Date(),
            endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days
            status: 'active'
        });

        this.createTest({
            id: 'personalization_level',
            name: 'Personalization vs. Discovery',
            description: 'Balancing personalized recommendations with music discovery',
            variants: [
                {
                    id: 'high_personalization',
                    name: 'High Personalization',
                    weight: 25,
                    config: {
                        personalizationWeight: 0.8,
                        discoveryWeight: 0.2,
                        popularityBoost: 0.1
                    }
                },
                {
                    id: 'balanced',
                    name: 'Balanced Approach',
                    weight: 50,
                    config: {
                        personalizationWeight: 0.6,
                        discoveryWeight: 0.3,
                        popularityBoost: 0.1
                    }
                },
                {
                    id: 'high_discovery',
                    name: 'High Discovery',
                    weight: 25,
                    config: {
                        personalizationWeight: 0.4,
                        discoveryWeight: 0.5,
                        popularityBoost: 0.1
                    }
                }
            ],
            metrics: ['new_artist_discovery', 'user_retention', 'playlist_additions'],
            startDate: new Date(),
            endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 28 days
            status: 'active'
        });
    }

    /**
     * Create a new A/B test
     */
    createTest(testConfig) {
        const test = {
            id: testConfig.id,
            name: testConfig.name,
            description: testConfig.description,
            variants: testConfig.variants,
            metrics: testConfig.metrics,
            startDate: testConfig.startDate,
            endDate: testConfig.endDate,
            status: testConfig.status,
            createdAt: new Date(),
            totalUsers: 0,
            conversions: {}
        };

        // Initialize conversion tracking for each variant
        test.variants.forEach(variant => {
            test.conversions[variant.id] = {
                users: 0,
                events: {},
                metrics: {}
            };
            
            // Initialize metrics tracking
            testConfig.metrics.forEach(metric => {
                test.conversions[variant.id].metrics[metric] = {
                    total: 0,
                    count: 0,
                    average: 0
                };
            });
        });

        this.activeTests.set(test.id, test);
        return test;
    }

    /**
     * Assign user to test variant
     */
    assignUserToTest(userId, testId) {
        if (!this.activeTests.has(testId)) {
            throw new Error(`Test ${testId} not found`);
        }

        const test = this.activeTests.get(testId);
        
        // Check if user already assigned
        const assignmentKey = `${userId}_${testId}`;
        if (this.userAssignments.has(assignmentKey)) {
            return this.userAssignments.get(assignmentKey);
        }

        // Assign user to variant based on weights
        const variant = this.selectVariantByWeight(test.variants, userId);
        
        const assignment = {
            userId,
            testId,
            variantId: variant.id,
            assignedAt: new Date(),
            events: []
        };

        this.userAssignments.set(assignmentKey, assignment);
        
        // Update test statistics
        test.totalUsers++;
        test.conversions[variant.id].users++;

        return assignment;
    }

    /**
     * Select variant based on weights using deterministic hashing
     */
    selectVariantByWeight(variants, userId) {
        const hash = crypto.createHash('md5').update(userId).digest('hex');
        const hashNumber = parseInt(hash.substring(0, 8), 16);
        const percentage = (hashNumber % 100) + 1;

        let cumulativeWeight = 0;
        for (const variant of variants) {
            cumulativeWeight += variant.weight;
            if (percentage <= cumulativeWeight) {
                return variant;
            }
        }

        // Fallback to first variant
        return variants[0];
    }

    /**
     * Get user's test assignment
     */
    getUserAssignment(userId, testId) {
        const assignmentKey = `${userId}_${testId}`;
        return this.userAssignments.get(assignmentKey);
    }

    /**
     * Track test event
     */
    trackEvent(userId, testId, eventType, eventData = {}) {
        const assignment = this.getUserAssignment(userId, testId);
        if (!assignment) {
            console.warn(`No assignment found for user ${userId} in test ${testId}`);
            return;
        }

        const event = {
            type: eventType,
            data: eventData,
            timestamp: new Date()
        };

        assignment.events.push(event);

        // Update test metrics
        const test = this.activeTests.get(testId);
        if (test) {
            const variantStats = test.conversions[assignment.variantId];
            
            if (!variantStats.events[eventType]) {
                variantStats.events[eventType] = 0;
            }
            variantStats.events[eventType]++;

            // Update specific metrics
            this.updateMetrics(test, assignment.variantId, eventType, eventData);
        }
    }

    /**
     * Update test metrics based on events
     */
    updateMetrics(test, variantId, eventType, eventData) {
        const variantStats = test.conversions[variantId];

        switch (eventType) {
            case 'recommendation_click':
                this.updateMetric(variantStats, 'click_through_rate', 1);
                this.updateMetric(variantStats, 'recommendation_clicks', 1);
                break;
            
            case 'track_play':
                this.updateMetric(variantStats, 'play_time', eventData.duration || 0);
                this.updateMetric(variantStats, 'engagement_rate', 1);
                break;
            
            case 'user_satisfaction':
                this.updateMetric(variantStats, 'user_satisfaction', eventData.rating || 0);
                break;
            
            case 'session_end':
                this.updateMetric(variantStats, 'session_duration', eventData.duration || 0);
                break;
            
            case 'new_artist_play':
                this.updateMetric(variantStats, 'new_artist_discovery', 1);
                break;
            
            case 'playlist_addition':
                this.updateMetric(variantStats, 'playlist_additions', 1);
                break;
        }
    }

    /**
     * Update individual metric
     */
    updateMetric(variantStats, metricName, value) {
        if (!variantStats.metrics[metricName]) {
            variantStats.metrics[metricName] = {
                total: 0,
                count: 0,
                average: 0
            };
        }

        const metric = variantStats.metrics[metricName];
        metric.total += value;
        metric.count++;
        metric.average = metric.total / metric.count;
    }

    /**
     * Get test results
     */
    getTestResults(testId) {
        if (!this.activeTests.has(testId)) {
            throw new Error(`Test ${testId} not found`);
        }

        const test = this.activeTests.get(testId);
        const results = {
            testId: test.id,
            name: test.name,
            description: test.description,
            status: test.status,
            startDate: test.startDate,
            endDate: test.endDate,
            totalUsers: test.totalUsers,
            variants: []
        };

        // Calculate results for each variant
        test.variants.forEach(variant => {
            const stats = test.conversions[variant.id];
            const variantResult = {
                id: variant.id,
                name: variant.name,
                weight: variant.weight,
                users: stats.users,
                conversionRate: test.totalUsers > 0 ? (stats.users / test.totalUsers) * 100 : 0,
                events: stats.events,
                metrics: {}
            };

            // Process metrics
            Object.keys(stats.metrics).forEach(metricName => {
                const metric = stats.metrics[metricName];
                variantResult.metrics[metricName] = {
                    average: metric.average,
                    total: metric.total,
                    count: metric.count
                };
            });

            results.variants.push(variantResult);
        });

        // Calculate statistical significance
        results.statisticalSignificance = this.calculateStatisticalSignificance(results);

        return results;
    }

    /**
     * Calculate statistical significance between variants
     */
    calculateStatisticalSignificance(results) {
        if (results.variants.length < 2) {
            return { significant: false, confidence: 0 };
        }

        // Simple z-test implementation for primary metric
        const [variant1, variant2] = results.variants;
        const n1 = variant1.users;
        const n2 = variant2.users;

        if (n1 < 30 || n2 < 30) {
            return { significant: false, confidence: 0, message: 'Insufficient sample size' };
        }

        // Use click-through rate as primary metric
        const ctr1 = variant1.events.recommendation_click / n1 || 0;
        const ctr2 = variant2.events.recommendation_click / n2 || 0;

        const pooledRate = (variant1.events.recommendation_click + variant2.events.recommendation_click) / (n1 + n2);
        const standardError = Math.sqrt(pooledRate * (1 - pooledRate) * (1/n1 + 1/n2));

        if (standardError === 0) {
            return { significant: false, confidence: 0, message: 'No variance in data' };
        }

        const zScore = Math.abs(ctr1 - ctr2) / standardError;
        const confidence = (1 - 2 * (1 - this.normalCDF(Math.abs(zScore)))) * 100;

        return {
            significant: confidence > 95,
            confidence: confidence,
            zScore: zScore,
            effect: ((ctr1 - ctr2) / ctr2) * 100 // Percentage change
        };
    }

    /**
     * Normal cumulative distribution function
     */
    normalCDF(x) {
        return (1.0 + this.erf(x / Math.sqrt(2.0))) / 2.0;
    }

    /**
     * Error function approximation
     */
    erf(x) {
        // Abramowitz and Stegun approximation
        const a1 =  0.254829592;
        const a2 = -0.284496736;
        const a3 =  1.421413741;
        const a4 = -1.453152027;
        const a5 =  1.061405429;
        const p  =  0.3275911;

        const sign = x < 0 ? -1 : 1;
        x = Math.abs(x);

        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

        return sign * y;
    }

    /**
     * Get active tests
     */
    getActiveTests() {
        const activeTests = [];
        for (const [testId, test] of this.activeTests) {
            if (test.status === 'active' && test.endDate > new Date()) {
                activeTests.push({
                    id: testId,
                    name: test.name,
                    description: test.description,
                    variants: test.variants.map(v => ({ id: v.id, name: v.name, weight: v.weight })),
                    metrics: test.metrics,
                    totalUsers: test.totalUsers,
                    endDate: test.endDate
                });
            }
        }
        return activeTests;
    }

    /**
     * Stop a test
     */
    stopTest(testId) {
        if (!this.activeTests.has(testId)) {
            throw new Error(`Test ${testId} not found`);
        }

        const test = this.activeTests.get(testId);
        test.status = 'stopped';
        test.endDate = new Date();

        return this.getTestResults(testId);
    }

    /**
     * Get recommendation configuration for user
     */
    getRecommendationConfig(userId) {
        const configs = {};

        // Get all active test assignments for user
        for (const [testId, test] of this.activeTests) {
            if (test.status === 'active' && test.endDate > new Date()) {
                const assignment = this.assignUserToTest(userId, testId);
                const variant = test.variants.find(v => v.id === assignment.variantId);
                
                if (variant && variant.config) {
                    Object.assign(configs, variant.config);
                }
            }
        }

        return configs;
    }
}

// Initialize A/B testing framework
const abTesting = new ABTestingFramework();

// API Routes

// Get active tests
router.get('/tests', (req, res) => {
    try {
        const activeTests = abTesting.getActiveTests();
        res.json({ success: true, tests: activeTests });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get test results
router.get('/tests/:testId/results', (req, res) => {
    try {
        const results = abTesting.getTestResults(req.params.testId);
        res.json({ success: true, results });
    } catch (error) {
        res.status(404).json({ success: false, error: error.message });
    }
});

// Assign user to test
router.post('/tests/:testId/assign', (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ success: false, error: 'userId required' });
        }

        const assignment = abTesting.assignUserToTest(userId, req.params.testId);
        res.json({ success: true, assignment });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Track test event
router.post('/tests/:testId/track', (req, res) => {
    try {
        const { userId, eventType, eventData } = req.body;
        if (!userId || !eventType) {
            return res.status(400).json({ 
                success: false, 
                error: 'userId and eventType required' 
            });
        }

        abTesting.trackEvent(userId, req.params.testId, eventType, eventData);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Get user's recommendation configuration
router.get('/config/:userId', (req, res) => {
    try {
        const config = abTesting.getRecommendationConfig(req.params.userId);
        res.json({ success: true, config });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create new test
router.post('/tests', (req, res) => {
    try {
        const test = abTesting.createTest(req.body);
        res.json({ success: true, test });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Stop test
router.post('/tests/:testId/stop', (req, res) => {
    try {
        const results = abTesting.stopTest(req.params.testId);
        res.json({ success: true, finalResults: results });
    } catch (error) {
        res.status(404).json({ success: false, error: error.message });
    }
});

// Middleware to automatically assign users to tests
router.use('/auto-assign/:userId', (req, res, next) => {
    const userId = req.params.userId;
    
    // Auto-assign to all active tests
    try {
        const activeTests = abTesting.getActiveTests();
        const assignments = [];

        activeTests.forEach(test => {
            try {
                const assignment = abTesting.assignUserToTest(userId, test.id);
                assignments.push(assignment);
            } catch (error) {
                console.error(`Failed to assign user ${userId} to test ${test.id}:`, error);
            }
        });

        req.testAssignments = assignments;
        next();
    } catch (error) {
        console.error('Auto-assignment failed:', error);
        next();
    }
});

// Export both router and framework instance
module.exports = {
    router,
    abTesting
};