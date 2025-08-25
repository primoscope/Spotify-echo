#!/usr/bin/env node

/**
 * Speed Configuration Optimizer for EchoTune AI Cursor Agent System
 * 
 * Focuses on optimizing configurations for maximum speed and performance:
 * - Dynamic configuration tuning
 * - Performance-based auto-optimization
 * - Resource allocation optimization
 * - Speed-focused parameter adjustment
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const { performance } = require('perf_hooks');
const os = require('os');

class SpeedConfigOptimizer {
    constructor() {
        this.optimizationHistory = [];
        this.performanceBaselines = new Map();
        this.currentConfig = this.getDefaultConfig();
        this.optimizationTargets = {
            executionSpeed: 'maximize',
            resourceEfficiency: 'optimize',
            throughput: 'maximize',
            latency: 'minimize',
            memoryUsage: 'minimize',
            cpuUsage: 'optimize'
        };
        
        this.optimizationStrategies = {
            aggressive: {
                cacheTTL: 60000,           // 1 minute
                maxConcurrentWorkflows: os.cpus().length * 4,
                batchSize: 20,
                workerPoolSize: os.cpus().length * 3,
                memoryLimit: 512,          // 512MB
                executionTimeout: 15000,   // 15 seconds
                retryAttempts: 2,
                retryDelay: 500            // 500ms
            },
            balanced: {
                cacheTTL: 300000,          // 5 minutes
                maxConcurrentWorkflows: os.cpus().length * 2,
                batchSize: 10,
                workerPoolSize: os.cpus().length * 2,
                memoryLimit: 1024,         // 1GB
                executionTimeout: 30000,   // 30 seconds
                retryAttempts: 3,
                retryDelay: 1000           // 1 second
            },
            conservative: {
                cacheTTL: 900000,          // 15 minutes
                maxConcurrentWorkflows: os.cpus().length,
                batchSize: 5,
                workerPoolSize: os.cpus().length,
                memoryLimit: 2048,         // 2GB
                executionTimeout: 60000,   // 60 seconds
                retryAttempts: 5,
                retryDelay: 2000           // 2 seconds
            }
        };
        
        this.performanceThresholds = {
            executionSpeed: {
                target: 5000,      // 5 seconds
                critical: 15000,   // 15 seconds
                weight: 0.4
            },
            throughput: {
                target: 100,       // 100 workflows/hour
                critical: 50,      // 50 workflows/hour
                weight: 0.3
            },
            latency: {
                target: 1000,      // 1 second
                critical: 5000,    // 5 seconds
                weight: 0.2
            },
            resourceEfficiency: {
                target: 80,        // 80% efficiency
                critical: 50,      // 50% efficiency
                weight: 0.1
            }
        };
    }

    /**
     * Initialize speed configuration optimizer
     */
    async initialize() {
        console.log('⚡ Initializing Speed Configuration Optimizer...');
        
        try {
            // Load optimization history
            await this.loadOptimizationHistory();
            
            // Initialize performance baselines
            this.initializePerformanceBaselines();
            
            // Start optimization monitoring
            this.startOptimizationMonitoring();
            
            // Apply initial optimization
            await this.applyInitialOptimization();
            
            console.log('✅ Speed Configuration Optimizer initialized successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Speed Configuration Optimizer initialization failed:', error.message);
            return false;
        }
    }

    /**
     * Get default configuration
     */
    getDefaultConfig() {
        return {
            // Performance settings
            cacheTTL: 300000,              // 5 minutes
            maxConcurrentWorkflows: os.cpus().length * 2,
            batchSize: 10,
            workerPoolSize: os.cpus().length * 2,
            memoryLimit: 1024,             // 1GB
            executionTimeout: 30000,       // 30 seconds
            retryAttempts: 3,
            retryDelay: 1000,              // 1 second
            
            // Optimization settings
            optimizationLevel: 'balanced',
            autoOptimization: true,
            performanceMonitoring: true,
            resourceOptimization: true,
            
            // Speed settings
            parallelProcessing: true,
            streamProcessing: true,
            intelligentCaching: true,
            resourcePooling: true,
            
            // Advanced settings
            memoryOptimization: true,
            cpuOptimization: true,
            networkOptimization: true,
            diskOptimization: true
        };
    }

    /**
     * Initialize performance baselines
     */
    initializePerformanceBaselines() {
        const systemInfo = {
            cpuCores: os.cpus().length,
            totalMemory: os.totalmem() / 1024 / 1024 / 1024, // GB
            platform: os.platform(),
            arch: os.arch(),
            nodeVersion: process.version
        };
        
        this.performanceBaselines.set('system', systemInfo);
        
        // Set baseline performance metrics
        this.performanceBaselines.set('performance', {
            executionSpeed: 10000,     // 10 seconds baseline
            throughput: 50,            // 50 workflows/hour baseline
            latency: 2000,             // 2 seconds baseline
            resourceEfficiency: 60     // 60% baseline
        });
        
        console.log('  📊 Performance baselines initialized');
    }

    /**
     * Start optimization monitoring
     */
    startOptimizationMonitoring() {
        // Monitor performance every 15 seconds
        setInterval(() => {
            this.monitorPerformance();
        }, 15000);
        
        // Auto-optimize every 2 minutes
        setInterval(() => {
            if (this.currentConfig.autoOptimization) {
                this.performAutoOptimization();
            }
        }, 120000);
        
        // Deep optimization every 10 minutes
        setInterval(() => {
            this.performDeepOptimization();
        }, 600000);
        
        console.log('  📊 Optimization monitoring started');
    }

    /**
     * Apply initial optimization
     */
    async applyInitialOptimization() {
        console.log('  🔧 Applying initial optimization...');
        
        // Analyze system capabilities
        const systemCapabilities = this.analyzeSystemCapabilities();
        
        // Select optimal configuration strategy
        const optimalStrategy = this.selectOptimalStrategy(systemCapabilities);
        
        // Apply strategy
        this.applyOptimizationStrategy(optimalStrategy);
        
        // Save optimized configuration
        await this.saveOptimizedConfiguration();
        
        console.log(`  ✅ Initial optimization applied: ${optimalStrategy} strategy`);
    }

    /**
     * Analyze system capabilities
     */
    analyzeSystemCapabilities() {
        const system = this.performanceBaselines.get('system');
        const capabilities = {
            cpuPower: system.cpuCores * 100, // CPU power score
            memoryCapacity: system.totalMemory * 100, // Memory capacity score
            platformEfficiency: this.getPlatformEfficiency(system.platform),
            overallScore: 0
        };
        
        // Calculate overall score
        capabilities.overallScore = (
            capabilities.cpuPower * 0.4 +
            capabilities.memoryCapacity * 0.3 +
            capabilities.platformEfficiency * 0.3
        );
        
        return capabilities;
    }

    /**
     * Get platform efficiency score
     */
    getPlatformEfficiency(platform) {
        const platformScores = {
            'linux': 95,
            'darwin': 90,
            'win32': 80,
            'aix': 85,
            'freebsd': 90,
            'openbsd': 85,
            'sunos': 80
        };
        
        return platformScores[platform] || 70;
    }

    /**
     * Select optimal configuration strategy
     */
    selectOptimalStrategy(systemCapabilities) {
        if (systemCapabilities.overallScore >= 80) {
            return 'aggressive';
        } else if (systemCapabilities.overallScore >= 60) {
            return 'balanced';
        } else {
            return 'conservative';
        }
    }

    /**
     * Apply optimization strategy
     */
    applyOptimizationStrategy(strategy) {
        const strategyConfig = this.optimizationStrategies[strategy];
        
        // Apply strategy configuration
        for (const [key, value] of Object.entries(strategyConfig)) {
            this.currentConfig[key] = value;
        }
        
        // Update optimization level
        this.currentConfig.optimizationLevel = strategy;
        
        console.log(`  ⚡ Applied ${strategy} optimization strategy`);
    }

    /**
     * Monitor performance metrics
     */
    async monitorPerformance() {
        try {
            const currentMetrics = await this.gatherCurrentMetrics();
            const baselineMetrics = this.performanceBaselines.get('performance');
            
            // Calculate performance scores
            const performanceScores = this.calculatePerformanceScores(currentMetrics, baselineMetrics);
            
            // Store current metrics
            this.performanceBaselines.set('current', currentMetrics);
            this.performanceBaselines.set('scores', performanceScores);
            
            // Check for performance issues
            this.checkPerformanceIssues(performanceScores);
            
        } catch (error) {
            console.error('Performance monitoring error:', error.message);
        }
    }

    /**
     * Gather current performance metrics
     */
    async gatherCurrentMetrics() {
        const memoryUsage = process.memoryUsage();
        const cpuUsage = await this.getCPUUsage();
        
        return {
            timestamp: Date.now(),
            executionSpeed: this.getCurrentExecutionSpeed(),
            throughput: this.getCurrentThroughput(),
            latency: this.getCurrentLatency(),
            resourceEfficiency: this.getCurrentResourceEfficiency(),
            system: {
                memory: {
                    rss: memoryUsage.rss / 1024 / 1024, // MB
                    heapUsed: memoryUsage.heapUsed / 1024 / 1024,
                    heapTotal: memoryUsage.heapTotal / 1024 / 1024,
                    external: memoryUsage.external / 1024 / 1024
                },
                cpu: cpuUsage,
                uptime: process.uptime()
            }
        };
    }

    /**
     * Get current execution speed
     */
    getCurrentExecutionSpeed() {
        // Simulate execution speed measurement
        return 5000 + Math.random() * 10000; // 5-15 seconds
    }

    /**
     * Get current throughput
     */
    getCurrentThroughput() {
        // Simulate throughput measurement
        return 60 + Math.random() * 80; // 60-140 workflows/hour
    }

    /**
     * Get current latency
     */
    getCurrentLatency() {
        // Simulate latency measurement
        return 1000 + Math.random() * 4000; // 1-5 seconds
    }

    /**
     * Get current resource efficiency
     */
    getCurrentResourceEfficiency() {
        // Simulate resource efficiency measurement
        return 50 + Math.random() * 40; // 50-90%
    }

    /**
     * Get CPU usage percentage
     */
    async getCPUUsage() {
        const startUsage = process.cpuUsage();
        await new Promise(resolve => setTimeout(resolve, 100));
        const endUsage = process.cpuUsage();
        
        const userCPU = endUsage.user - startUsage.user;
        const systemCPU = endUsage.system - startUsage.system;
        const totalCPU = userCPU + systemCPU;
        
        return (totalCPU / 1000000) * 100; // Convert to percentage
    }

    /**
     * Calculate performance scores
     */
    calculatePerformanceScores(currentMetrics, baselineMetrics) {
        const scores = {};
        
        for (const [metric, threshold] of Object.entries(this.performanceThresholds)) {
            const currentValue = currentMetrics[metric];
            const baselineValue = baselineMetrics[metric];
            
            if (threshold.target === 'maximize') {
                scores[metric] = Math.min(100, (currentValue / baselineValue) * 100);
            } else if (threshold.target === 'minimize') {
                scores[metric] = Math.min(100, (baselineValue / currentValue) * 100);
            } else {
                scores[metric] = Math.min(100, (currentValue / baselineValue) * 100);
            }
        }
        
        // Calculate weighted overall score
        let overallScore = 0;
        let totalWeight = 0;
        
        for (const [metric, score] of Object.entries(scores)) {
            const weight = this.performanceThresholds[metric].weight;
            overallScore += score * weight;
            totalWeight += weight;
        }
        
        scores.overall = totalWeight > 0 ? overallScore / totalWeight : 0;
        
        return scores;
    }

    /**
     * Check for performance issues
     */
    checkPerformanceIssues(performanceScores) {
        for (const [metric, score] of Object.entries(performanceScores)) {
            if (metric === 'overall') continue;
            
            const threshold = this.performanceThresholds[metric];
            
            if (score < threshold.critical) {
                console.warn(`🚨 Critical performance issue detected: ${metric} score ${score.toFixed(1)}%`);
                this.triggerEmergencyOptimization(metric);
            } else if (score < threshold.target) {
                console.warn(`⚠️ Performance issue detected: ${metric} score ${score.toFixed(1)}%`);
                this.triggerPerformanceOptimization(metric);
            }
        }
    }

    /**
     * Trigger emergency optimization
     */
    triggerEmergencyOptimization(metric) {
        console.log(`  🚨 Triggering emergency optimization for ${metric}...`);
        
        // Apply aggressive optimization
        this.applyOptimizationStrategy('aggressive');
        
        // Record emergency optimization
        this.recordOptimization('emergency', metric, 'aggressive');
        
        // Save configuration
        this.saveOptimizedConfiguration();
    }

    /**
     * Trigger performance optimization
     */
    triggerPerformanceOptimization(metric) {
        console.log(`  ⚡ Triggering performance optimization for ${metric}...`);
        
        // Apply targeted optimization
        this.applyTargetedOptimization(metric);
        
        // Record optimization
        this.recordOptimization('performance', metric, 'targeted');
        
        // Save configuration
        this.saveOptimizedConfiguration();
    }

    /**
     * Apply targeted optimization for specific metric
     */
    applyTargetedOptimization(metric) {
        switch (metric) {
            case 'executionSpeed':
                this.optimizeForExecutionSpeed();
                break;
            case 'throughput':
                this.optimizeForThroughput();
                break;
            case 'latency':
                this.optimizeForLatency();
                break;
            case 'resourceEfficiency':
                this.optimizeForResourceEfficiency();
                break;
        }
    }

    /**
     * Optimize for execution speed
     */
    optimizeForExecutionSpeed() {
        console.log('  ⚡ Optimizing for execution speed...');
        
        // Reduce cache TTL for faster updates
        this.currentConfig.cacheTTL = Math.max(30000, this.currentConfig.cacheTTL * 0.8);
        
        // Increase concurrent workflows
        this.currentConfig.maxConcurrentWorkflows = Math.min(50, 
            this.currentConfig.maxConcurrentWorkflows * 1.2);
        
        // Reduce execution timeout
        this.currentConfig.executionTimeout = Math.max(10000, 
            this.currentConfig.executionTimeout * 0.8);
        
        // Enable aggressive caching
        this.currentConfig.intelligentCaching = true;
        this.currentConfig.parallelProcessing = true;
        
        console.log('  ✅ Execution speed optimization applied');
    }

    /**
     * Optimize for throughput
     */
    optimizeForThroughput() {
        console.log('  📈 Optimizing for throughput...');
        
        // Increase batch size
        this.currentConfig.batchSize = Math.min(50, this.currentConfig.batchSize * 1.5);
        
        // Increase worker pool size
        this.currentConfig.workerPoolSize = Math.min(100, 
            this.currentConfig.workerPoolSize * 1.3);
        
        // Enable stream processing
        this.currentConfig.streamProcessing = true;
        
        // Optimize memory usage
        this.currentConfig.memoryOptimization = true;
        
        console.log('  ✅ Throughput optimization applied');
    }

    /**
     * Optimize for latency
     */
    optimizeForLatency() {
        console.log('  ⚡ Optimizing for latency...');
        
        // Reduce cache TTL
        this.currentConfig.cacheTTL = Math.max(15000, this.currentConfig.cacheTTL * 0.7);
        
        // Increase concurrent workflows
        this.currentConfig.maxConcurrentWorkflows = Math.min(100, 
            this.currentConfig.maxConcurrentWorkflows * 1.4);
        
        // Reduce retry delay
        this.currentConfig.retryDelay = Math.max(200, this.currentConfig.retryDelay * 0.6);
        
        // Enable parallel processing
        this.currentConfig.parallelProcessing = true;
        this.currentConfig.resourcePooling = true;
        
        console.log('  ✅ Latency optimization applied');
    }

    /**
     * Optimize for resource efficiency
     */
    optimizeForResourceEfficiency() {
        console.log('  🔧 Optimizing for resource efficiency...');
        
        // Reduce memory limit
        this.currentConfig.memoryLimit = Math.max(256, 
            this.currentConfig.memoryLimit * 0.8);
        
        // Optimize worker pool size
        this.currentConfig.workerPoolSize = Math.max(1, 
            Math.ceil(this.currentConfig.workerPoolSize * 0.9));
        
        // Enable resource optimization
        this.currentConfig.resourceOptimization = true;
        this.currentConfig.memoryOptimization = true;
        this.currentConfig.cpuOptimization = true;
        
        console.log('  ✅ Resource efficiency optimization applied');
    }

    /**
     * Perform auto-optimization
     */
    performAutoOptimization() {
        console.log('🔧 Performing auto-optimization...');
        
        const currentScores = this.performanceBaselines.get('scores');
        if (!currentScores) return;
        
        // Check if optimization is needed
        if (currentScores.overall < 70) {
            console.log('  📉 Performance below threshold, applying optimization...');
            
            // Apply balanced optimization
            this.applyOptimizationStrategy('balanced');
            
            // Record optimization
            this.recordOptimization('auto', 'overall', 'balanced');
            
        } else if (currentScores.overall > 90) {
            console.log('  📈 Performance above threshold, applying aggressive optimization...');
            
            // Apply aggressive optimization
            this.applyOptimizationStrategy('aggressive');
            
            // Record optimization
            this.recordOptimization('auto', 'overall', 'aggressive');
        }
        
        // Save configuration
        this.saveOptimizedConfiguration();
    }

    /**
     * Perform deep optimization
     */
    performDeepOptimization() {
        console.log('🔧 Performing deep optimization...');
        
        // Analyze current performance
        const currentMetrics = this.performanceBaselines.get('current');
        const baselineMetrics = this.performanceBaselines.get('performance');
        
        if (!currentMetrics || !baselineMetrics) return;
        
        // Calculate improvement opportunities
        const improvements = this.calculateImprovementOpportunities(currentMetrics, baselineMetrics);
        
        // Apply improvements
        for (const improvement of improvements) {
            this.applyImprovement(improvement);
        }
        
        // Record deep optimization
        this.recordOptimization('deep', 'comprehensive', 'targeted');
        
        // Save configuration
        this.saveOptimizedConfiguration();
        
        console.log('  ✅ Deep optimization completed');
    }

    /**
     * Calculate improvement opportunities
     */
    calculateImprovementOpportunities(currentMetrics, baselineMetrics) {
        const improvements = [];
        
        // Check each metric for improvement opportunities
        for (const [metric, currentValue] of Object.entries(currentMetrics)) {
            if (metric === 'timestamp' || metric === 'system') continue;
            
            const baselineValue = baselineMetrics[metric];
            const improvement = this.calculateMetricImprovement(metric, currentValue, baselineValue);
            
            if (improvement.potential > 0.1) { // 10% improvement potential
                improvements.push(improvement);
            }
        }
        
        // Sort by improvement potential
        improvements.sort((a, b) => b.potential - a.potential);
        
        return improvements;
    }

    /**
     * Calculate metric improvement potential
     */
    calculateMetricImprovement(metric, currentValue, baselineValue) {
        let potential = 0;
        let action = '';
        
        if (this.performanceThresholds[metric].target === 'maximize') {
            potential = (baselineValue - currentValue) / baselineValue;
            action = 'increase';
        } else if (this.performanceThresholds[metric].target === 'minimize') {
            potential = (currentValue - baselineValue) / baselineValue;
            action = 'decrease';
        } else {
            potential = Math.abs(baselineValue - currentValue) / baselineValue;
            action = 'optimize';
        }
        
        return {
            metric,
            currentValue,
            baselineValue,
            potential,
            action,
            priority: potential > 0.2 ? 'high' : potential > 0.1 ? 'medium' : 'low'
        };
    }

    /**
     * Apply improvement
     */
    applyImprovement(improvement) {
        console.log(`  🔧 Applying improvement for ${improvement.metric}: ${improvement.action} (${(improvement.potential * 100).toFixed(1)}% potential)`);
        
        switch (improvement.metric) {
            case 'executionSpeed':
                this.optimizeForExecutionSpeed();
                break;
            case 'throughput':
                this.optimizeForThroughput();
                break;
            case 'latency':
                this.optimizeForLatency();
                break;
            case 'resourceEfficiency':
                this.optimizeForResourceEfficiency();
                break;
        }
    }

    /**
     * Record optimization action
     */
    recordOptimization(type, target, strategy) {
        const optimization = {
            timestamp: Date.now(),
            type,
            target,
            strategy,
            config: { ...this.currentConfig },
            performance: this.performanceBaselines.get('scores') || {}
        };
        
        this.optimizationHistory.push(optimization);
        
        // Keep only last 1000 optimizations
        if (this.optimizationHistory.length > 1000) {
            this.optimizationHistory = this.optimizationHistory.slice(-1000);
        }
    }

    /**
     * Save optimized configuration
     */
    async saveOptimizedConfiguration() {
        try {
            const configPath = path.join('../enhanced-perplexity-results', 'speed-optimized-config.json');
            await fs.writeFile(configPath, JSON.stringify(this.currentConfig, null, 2));
            
            // Also save optimization history
            const historyPath = path.join('../enhanced-perplexity-results', 'speed-optimization-history.json');
            await fs.writeFile(historyPath, JSON.stringify(this.optimizationHistory, null, 2));
            
        } catch (error) {
            console.error('Failed to save optimized configuration:', error.message);
        }
    }

    /**
     * Load optimization history
     */
    async loadOptimizationHistory() {
        try {
            const historyPath = path.join('../enhanced-perplexity-results', 'speed-optimization-history.json');
            const historyData = await fs.readFile(historyPath, 'utf8');
            this.optimizationHistory = JSON.parse(historyData);
        } catch (error) {
            this.optimizationHistory = [];
        }
    }

    /**
     * Get optimization summary
     */
    getOptimizationSummary() {
        const currentScores = this.performanceBaselines.get('scores');
        const currentMetrics = this.performanceBaselines.get('current');
        
        return {
            currentConfig: this.currentConfig,
            performanceScores: currentScores || {},
            currentMetrics: currentMetrics || {},
            optimizationHistory: {
                total: this.optimizationHistory.length,
                recent: this.optimizationHistory.slice(-10)
            },
            systemInfo: this.performanceBaselines.get('system'),
            optimizationTargets: this.optimizationTargets
        };
    }

    /**
     * Apply speed-focused configuration
     */
    applySpeedFocusedConfiguration() {
        console.log('⚡ Applying speed-focused configuration...');
        
        // Optimize for maximum speed
        this.currentConfig.cacheTTL = 30000; // 30 seconds
        this.currentConfig.maxConcurrentWorkflows = os.cpus().length * 5;
        this.currentConfig.batchSize = 25;
        this.currentConfig.workerPoolSize = os.cpus().length * 4;
        this.currentConfig.memoryLimit = 512; // 512MB
        this.currentConfig.executionTimeout = 10000; // 10 seconds
        this.currentConfig.retryAttempts = 2;
        this.currentConfig.retryDelay = 500; // 500ms
        
        // Enable all speed optimizations
        this.currentConfig.parallelProcessing = true;
        this.currentConfig.streamProcessing = true;
        this.currentConfig.intelligentCaching = true;
        this.currentConfig.resourcePooling = true;
        this.currentConfig.memoryOptimization = true;
        this.currentConfig.cpuOptimization = true;
        this.currentConfig.networkOptimization = true;
        this.currentConfig.diskOptimization = true;
        
        // Set optimization level
        this.currentConfig.optimizationLevel = 'aggressive';
        
        console.log('  ✅ Speed-focused configuration applied');
        
        // Save configuration
        this.saveOptimizedConfiguration();
    }

    /**
     * Apply performance-focused configuration
     */
    applyPerformanceFocusedConfiguration() {
        console.log('🎯 Applying performance-focused configuration...');
        
        // Optimize for balanced performance
        this.currentConfig.cacheTTL = 180000; // 3 minutes
        this.currentConfig.maxConcurrentWorkflows = os.cpus().length * 3;
        this.currentConfig.batchSize = 15;
        this.currentConfig.workerPoolSize = os.cpus().length * 3;
        this.currentConfig.memoryLimit = 768; // 768MB
        this.currentConfig.executionTimeout = 20000; // 20 seconds
        this.currentConfig.retryAttempts = 3;
        this.currentConfig.retryDelay = 750; // 750ms
        
        // Enable balanced optimizations
        this.currentConfig.parallelProcessing = true;
        this.currentConfig.intelligentCaching = true;
        this.currentConfig.resourcePooling = true;
        this.currentConfig.memoryOptimization = true;
        this.currentConfig.cpuOptimization = true;
        
        // Set optimization level
        this.currentConfig.optimizationLevel = 'balanced';
        
        console.log('  ✅ Performance-focused configuration applied');
        
        // Save configuration
        this.saveOptimizedConfiguration();
    }
}

// Main execution
if (require.main === module) {
    const optimizer = new SpeedConfigOptimizer();
    
    optimizer.initialize()
        .then(() => {
            console.log('✅ Speed Configuration Optimizer ready');
            
            // Show optimization summary
            console.log('Optimization Summary:', optimizer.getOptimizationSummary());
            
            // Apply speed-focused configuration
            optimizer.applySpeedFocusedConfiguration();
            
            // Show updated summary
            console.log('Updated Summary:', optimizer.getOptimizationSummary());
        })
        .catch(error => {
            console.error('❌ Speed Configuration Optimizer failed:', error);
            process.exit(1);
        });
}

module.exports = { SpeedConfigOptimizer };