"use strict";
/**
 * Comprehensive Testing Suite with Performance Monitoring
 * Automated testing workflows, quality assurance, and performance tracking
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComprehensiveTestingSuite = void 0;
const events_1 = require("events");
const fs_1 = require("fs");
const path = __importStar(require("path"));
const perf_hooks_1 = require("perf_hooks");
const perplexity_test_framework_1 = require("./perplexity-test-framework");
const browser_research_automation_1 = require("./browser-research-automation");
const automated_config_detection_1 = require("./automated-config-detection");
// Performance monitor
class PerformanceMonitor {
    constructor() {
        this.metrics = [];
        this.isMonitoring = false;
    }
    startMonitoring(testId, interval = 1000) {
        if (this.isMonitoring)
            return;
        this.isMonitoring = true;
        const startCpuUsage = process.cpuUsage();
        this.intervalId = setInterval(() => {
            this.metrics.push({
                timestamp: Date.now(),
                testId,
                duration: perf_hooks_1.performance.now(),
                memoryUsage: process.memoryUsage(),
                cpuUsage: process.cpuUsage(startCpuUsage),
                customMetrics: {}
            });
        }, interval);
    }
    stopMonitoring() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
        this.isMonitoring = false;
        const results = [...this.metrics];
        this.metrics = [];
        return results;
    }
    addCustomMetric(testId, name, value) {
        const latestMetric = this.metrics[this.metrics.length - 1];
        if (latestMetric && latestMetric.testId === testId) {
            latestMetric.customMetrics[name] = value;
        }
    }
    getAverageMetrics(testId) {
        const testMetrics = this.metrics.filter(m => m.testId === testId);
        if (testMetrics.length === 0)
            return null;
        const avg = testMetrics.reduce((acc, metric) => ({
            timestamp: acc.timestamp,
            testId: acc.testId,
            duration: acc.duration + metric.duration,
            memoryUsage: {
                rss: acc.memoryUsage.rss + metric.memoryUsage.rss,
                heapTotal: acc.memoryUsage.heapTotal + metric.memoryUsage.heapTotal,
                heapUsed: acc.memoryUsage.heapUsed + metric.memoryUsage.heapUsed,
                external: acc.memoryUsage.external + metric.memoryUsage.external,
                arrayBuffers: acc.memoryUsage.arrayBuffers + metric.memoryUsage.arrayBuffers
            },
            cpuUsage: {
                user: acc.cpuUsage.user + metric.cpuUsage.user,
                system: acc.cpuUsage.system + metric.cpuUsage.system
            },
            customMetrics: { ...acc.customMetrics }
        }), testMetrics[0]);
        const count = testMetrics.length;
        return {
            ...avg,
            duration: avg.duration / count,
            memoryUsage: {
                rss: avg.memoryUsage.rss / count,
                heapTotal: avg.memoryUsage.heapTotal / count,
                heapUsed: avg.memoryUsage.heapUsed / count,
                external: avg.memoryUsage.external / count,
                arrayBuffers: avg.memoryUsage.arrayBuffers / count
            },
            cpuUsage: {
                user: avg.cpuUsage.user / count,
                system: avg.cpuUsage.system / count
            }
        };
    }
}
// Main testing suite class
class ComprehensiveTestingSuite extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.testSuites = new Map();
        this.performanceMonitor = new PerformanceMonitor();
        if (config.perplexityApiKey) {
            this.perplexityClient = new perplexity_test_framework_1.PerplexityTestClient({
                apiKey: config.perplexityApiKey
            });
            this.grok4Client = new perplexity_test_framework_1.Grok4Integration({
                apiKey: config.perplexityApiKey
            });
            this.browserClient = new browser_research_automation_1.BrowserResearchClient({
                apiKey: config.perplexityApiKey
            });
        }
        this.configDetector = new automated_config_detection_1.AutomatedConfigDetector();
        this.loadDefaultTestSuites();
    }
    // Register a test suite
    registerTestSuite(suite) {
        this.testSuites.set(suite.id, suite);
        this.emit('suite_registered', suite);
    }
    // Run all test suites or specified ones
    async runTests(configuration) {
        const config = {
            parallel: true,
            maxConcurrency: 3,
            failFast: false,
            retryOnFailure: true,
            generateReport: true,
            collectPerformanceData: true,
            captureArtifacts: true,
            suites: [],
            tags: [],
            excludeTags: [],
            timeout: this.config.timeout,
            ...configuration
        };
        const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.currentRun = {
            id: runId,
            startTime: Date.now(),
            configuration: config,
            results: []
        };
        this.emit('test_run_started', { runId, configuration: config });
        try {
            // Filter test suites based on configuration
            const suitesToRun = this.filterTestSuites(config);
            // Run test suites
            if (config.parallel) {
                this.currentRun.results = await this.runTestSuitesParallel(suitesToRun, config);
            }
            else {
                this.currentRun.results = await this.runTestSuitesSequential(suitesToRun, config);
            }
            // Generate comprehensive report
            if (config.generateReport) {
                await this.generateTestReport(this.currentRun);
            }
            this.emit('test_run_completed', {
                runId,
                results: this.currentRun.results,
                summary: this.generateRunSummary(this.currentRun.results)
            });
            return this.currentRun.results;
        }
        catch (error) {
            this.emit('test_run_failed', { runId, error });
            throw error;
        }
    }
    // Run a specific test case
    async runTestCase(testCase) {
        const startTime = Date.now();
        const startPerf = perf_hooks_1.performance.now();
        this.emit('test_case_started', { testId: testCase.id, name: testCase.name });
        // Start performance monitoring if enabled
        this.performanceMonitor.startMonitoring(testCase.id, 500);
        try {
            // Run the test with timeout
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Test timeout')), testCase.timeout);
            });
            await Promise.race([testCase.testFunction(), timeoutPromise]);
            const endTime = Date.now();
            const endPerf = perf_hooks_1.performance.now();
            const performanceMetrics = this.performanceMonitor.stopMonitoring();
            const result = {
                testId: testCase.id,
                name: testCase.name,
                status: 'passed',
                duration: endTime - startTime,
                startTime,
                endTime,
                performance: {
                    memoryUsage: process.memoryUsage(),
                    cpuUsage: process.cpuUsage(),
                    customMetrics: {
                        'execution_time_ms': endPerf - startPerf
                    }
                },
                artifacts: {
                    screenshots: [],
                    logs: [],
                    reports: [],
                    data: []
                }
            };
            this.emit('test_case_completed', result);
            return result;
        }
        catch (error) {
            const endTime = Date.now();
            this.performanceMonitor.stopMonitoring();
            const result = {
                testId: testCase.id,
                name: testCase.name,
                status: error.message === 'Test timeout' ? 'timeout' : 'failed',
                duration: endTime - startTime,
                startTime,
                endTime,
                error: error.message,
                performance: {
                    memoryUsage: process.memoryUsage(),
                    cpuUsage: process.cpuUsage(),
                    customMetrics: {}
                },
                artifacts: {
                    screenshots: [],
                    logs: [],
                    reports: [],
                    data: []
                }
            };
            this.emit('test_case_failed', result);
            return result;
        }
    }
    // Load default test suites
    loadDefaultTestSuites() {
        // Perplexity API Test Suite
        this.registerTestSuite({
            id: 'perplexity-api',
            name: 'Perplexity API Integration Tests',
            description: 'Test Perplexity API functionality and performance',
            category: 'api',
            priority: 'high',
            timeout: 30000,
            retries: 2,
            tests: [
                {
                    id: 'perplexity-health-check',
                    name: 'Perplexity API Health Check',
                    description: 'Verify API connectivity and basic functionality',
                    category: 'health',
                    tags: ['api', 'health', 'quick'],
                    timeout: 10000,
                    retries: 1,
                    prerequisites: [],
                    testFunction: async () => {
                        if (!this.perplexityClient) {
                            throw new Error('Perplexity client not configured');
                        }
                        const healthy = await this.perplexityClient.healthCheck();
                        if (!healthy) {
                            throw new Error('Perplexity API health check failed');
                        }
                        return {
                            testId: 'perplexity-health-check',
                            name: 'Perplexity API Health Check',
                            status: 'passed',
                            duration: 0,
                            startTime: Date.now(),
                            endTime: Date.now()
                        };
                    }
                },
                {
                    id: 'perplexity-rate-limiting',
                    name: 'Rate Limiting Test',
                    description: 'Test rate limiting functionality',
                    category: 'performance',
                    tags: ['api', 'rate-limit', 'performance'],
                    timeout: 60000,
                    retries: 0,
                    prerequisites: ['perplexity-health-check'],
                    testFunction: async () => {
                        if (!this.perplexityClient) {
                            throw new Error('Perplexity client not configured');
                        }
                        // Test rate limiting by making multiple rapid requests
                        const promises = Array.from({ length: 10 }, () => this.perplexityClient.chat({
                            model: 'llama-3.1-sonar-small-128k-online',
                            messages: [{ role: 'user', content: 'Hello' }],
                            max_tokens: 10
                        }));
                        const results = await Promise.allSettled(promises);
                        const successful = results.filter(r => r.status === 'fulfilled').length;
                        if (successful === 0) {
                            throw new Error('All rate-limited requests failed');
                        }
                        return {
                            testId: 'perplexity-rate-limiting',
                            name: 'Rate Limiting Test',
                            status: 'passed',
                            duration: 0,
                            startTime: Date.now(),
                            endTime: Date.now()
                        };
                    }
                },
                {
                    id: 'perplexity-caching',
                    name: 'Caching Functionality Test',
                    description: 'Test response caching and cache hit rates',
                    category: 'performance',
                    tags: ['api', 'cache', 'performance'],
                    timeout: 30000,
                    retries: 1,
                    prerequisites: ['perplexity-health-check'],
                    testFunction: async () => {
                        if (!this.perplexityClient) {
                            throw new Error('Perplexity client not configured');
                        }
                        const query = {
                            model: 'llama-3.1-sonar-small-128k-online',
                            messages: [{ role: 'user', content: 'What is TypeScript?' }],
                            max_tokens: 100
                        };
                        // Clear cache first
                        this.perplexityClient.clearCache();
                        // First request (cache miss)
                        const result1 = await this.perplexityClient.chat(query);
                        if (result1.performance.cacheHit) {
                            throw new Error('First request should be cache miss');
                        }
                        // Second request (cache hit)
                        const result2 = await this.perplexityClient.chat(query);
                        if (!result2.performance.cacheHit) {
                            throw new Error('Second request should be cache hit');
                        }
                        return {
                            testId: 'perplexity-caching',
                            name: 'Caching Functionality Test',
                            status: 'passed',
                            duration: 0,
                            startTime: Date.now(),
                            endTime: Date.now()
                        };
                    }
                }
            ]
        });
        // Grok-4 Integration Test Suite
        this.registerTestSuite({
            id: 'grok4-integration',
            name: 'Grok-4 Integration Tests',
            description: 'Test Grok-4 style reasoning and analysis capabilities',
            category: 'integration',
            priority: 'high',
            timeout: 60000,
            retries: 2,
            tests: [
                {
                    id: 'grok4-reasoning',
                    name: 'Grok-4 Style Reasoning Test',
                    description: 'Test complex reasoning capabilities',
                    category: 'reasoning',
                    tags: ['grok4', 'reasoning', 'ai'],
                    timeout: 45000,
                    retries: 1,
                    prerequisites: [],
                    testFunction: async () => {
                        if (!this.grok4Client) {
                            throw new Error('Grok-4 client not configured');
                        }
                        const result = await this.grok4Client.reasonWithGrok4('Explain the benefits and drawbacks of TypeScript vs JavaScript for a large-scale web application', 'You are evaluating technology choices for a team of 50+ developers');
                        if (!result.success) {
                            throw new Error(`Grok-4 reasoning failed: ${result.error}`);
                        }
                        if (!result.response?.choices?.[0]?.message?.content) {
                            throw new Error('No response content received');
                        }
                        const content = result.response.choices[0].message.content;
                        if (content.length < 100) {
                            throw new Error('Response too short for complex reasoning task');
                        }
                        return {
                            testId: 'grok4-reasoning',
                            name: 'Grok-4 Style Reasoning Test',
                            status: 'passed',
                            duration: 0,
                            startTime: Date.now(),
                            endTime: Date.now()
                        };
                    }
                },
                {
                    id: 'grok4-code-analysis',
                    name: 'Code Analysis Test',
                    description: 'Test code analysis capabilities',
                    category: 'analysis',
                    tags: ['grok4', 'code', 'analysis'],
                    timeout: 30000,
                    retries: 1,
                    prerequisites: [],
                    testFunction: async () => {
                        if (!this.grok4Client) {
                            throw new Error('Grok-4 client not configured');
                        }
                        const testCode = `
              function calculateTotal(items) {
                let total = 0;
                for (var i = 0; i < items.length; i++) {
                  total += items[i].price * items[i].quantity;
                }
                return total;
              }
            `;
                        const result = await this.grok4Client.analyzeCode(testCode, 'javascript', 'quality');
                        if (!result.success) {
                            throw new Error(`Code analysis failed: ${result.error}`);
                        }
                        return {
                            testId: 'grok4-code-analysis',
                            name: 'Code Analysis Test',
                            status: 'passed',
                            duration: 0,
                            startTime: Date.now(),
                            endTime: Date.now()
                        };
                    }
                }
            ]
        });
        // Browser Research Test Suite
        this.registerTestSuite({
            id: 'browser-research',
            name: 'Browser Research Automation Tests',
            description: 'Test browser-based research and evidence collection',
            category: 'integration',
            priority: 'medium',
            timeout: 120000,
            retries: 1,
            tests: [
                {
                    id: 'research-session',
                    name: 'Research Session Test',
                    description: 'Test complete research session workflow',
                    category: 'workflow',
                    tags: ['browser', 'research', 'evidence'],
                    timeout: 90000,
                    retries: 1,
                    prerequisites: [],
                    testFunction: async () => {
                        if (!this.browserClient) {
                            throw new Error('Browser client not configured');
                        }
                        const queries = [
                            {
                                id: 'test-query-1',
                                query: 'What are the benefits of TypeScript for web development?',
                                sources: [],
                                priority: 'medium',
                                searchFilters: {
                                    domains: ['stackoverflow.com', 'developer.mozilla.org'],
                                    recency: 'month'
                                }
                            }
                        ];
                        const sessionId = await this.browserClient.startResearchSession(queries);
                        if (!sessionId) {
                            throw new Error('Failed to start research session');
                        }
                        const performance = this.browserClient.getSessionPerformance();
                        if (!performance || performance.successfulQueries === 0) {
                            throw new Error('Research session had no successful queries');
                        }
                        return {
                            testId: 'research-session',
                            name: 'Research Session Test',
                            status: 'passed',
                            duration: 0,
                            startTime: Date.now(),
                            endTime: Date.now()
                        };
                    }
                }
            ]
        });
        // Configuration Detection Test Suite
        this.registerTestSuite({
            id: 'config-detection',
            name: 'Configuration Detection Tests',
            description: 'Test automated configuration detection and setup',
            category: 'integration',
            priority: 'medium',
            timeout: 30000,
            retries: 1,
            tests: [
                {
                    id: 'repository-analysis',
                    name: 'Repository Analysis Test',
                    description: 'Test repository structure analysis',
                    category: 'analysis',
                    tags: ['config', 'analysis', 'repository'],
                    timeout: 20000,
                    retries: 1,
                    prerequisites: [],
                    testFunction: async () => {
                        if (!this.configDetector) {
                            throw new Error('Config detector not available');
                        }
                        const structure = await this.configDetector.analyzeRepository();
                        if (!structure.rootPath) {
                            throw new Error('Repository analysis failed');
                        }
                        if (structure.projectType === 'unknown') {
                            throw new Error('Failed to detect project type');
                        }
                        return {
                            testId: 'repository-analysis',
                            name: 'Repository Analysis Test',
                            status: 'passed',
                            duration: 0,
                            startTime: Date.now(),
                            endTime: Date.now()
                        };
                    }
                },
                {
                    id: 'configuration-generation',
                    name: 'Configuration Generation Test',
                    description: 'Test automatic configuration generation',
                    category: 'generation',
                    tags: ['config', 'generation', 'automation'],
                    timeout: 15000,
                    retries: 1,
                    prerequisites: ['repository-analysis'],
                    testFunction: async () => {
                        if (!this.configDetector) {
                            throw new Error('Config detector not available');
                        }
                        const config = await this.configDetector.generateConfiguration();
                        if (!config.rules || !config.mcpServers) {
                            throw new Error('Configuration generation failed');
                        }
                        if (config.mcpServers.length === 0) {
                            throw new Error('No MCP servers configured');
                        }
                        return {
                            testId: 'configuration-generation',
                            name: 'Configuration Generation Test',
                            status: 'passed',
                            duration: 0,
                            startTime: Date.now(),
                            endTime: Date.now()
                        };
                    }
                }
            ]
        });
        // Performance Test Suite
        this.registerTestSuite({
            id: 'performance',
            name: 'Performance Tests',
            description: 'Test system performance and resource usage',
            category: 'performance',
            priority: 'medium',
            timeout: 60000,
            retries: 1,
            tests: [
                {
                    id: 'memory-usage',
                    name: 'Memory Usage Test',
                    description: 'Monitor memory usage during operations',
                    category: 'memory',
                    tags: ['performance', 'memory', 'monitoring'],
                    timeout: 30000,
                    retries: 1,
                    prerequisites: [],
                    testFunction: async () => {
                        const initialMemory = process.memoryUsage();
                        // Perform memory-intensive operations
                        const data = Array.from({ length: 100000 }, (_, i) => ({ id: i, data: Math.random() }));
                        const finalMemory = process.memoryUsage();
                        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
                        // Check if memory increase is reasonable (less than 100MB)
                        if (memoryIncrease > 100 * 1024 * 1024) {
                            throw new Error(`Excessive memory usage: ${memoryIncrease / 1024 / 1024}MB`);
                        }
                        return {
                            testId: 'memory-usage',
                            name: 'Memory Usage Test',
                            status: 'passed',
                            duration: 0,
                            startTime: Date.now(),
                            endTime: Date.now()
                        };
                    }
                }
            ]
        });
    }
    // Filter test suites based on configuration
    filterTestSuites(config) {
        let suites = Array.from(this.testSuites.values());
        // Filter by suite names if specified
        if (config.suites.length > 0) {
            suites = suites.filter(suite => config.suites.includes(suite.id));
        }
        // Filter by tags
        if (config.tags.length > 0) {
            suites = suites.filter(suite => suite.tests.some(test => test.tags.some(tag => config.tags.includes(tag))));
        }
        // Exclude by tags
        if (config.excludeTags.length > 0) {
            suites = suites.filter(suite => !suite.tests.every(test => test.tags.some(tag => config.excludeTags.includes(tag))));
        }
        return suites;
    }
    // Run test suites in parallel
    async runTestSuitesParallel(suites, config) {
        const semaphore = new Array(config.maxConcurrency).fill(null);
        const results = [];
        const runSuite = async (suite) => {
            return this.runTestSuite(suite, config);
        };
        const promises = suites.map(async (suite) => {
            // Wait for available slot
            await new Promise((resolve) => {
                const checkSlot = () => {
                    const availableIndex = semaphore.findIndex(slot => slot === null);
                    if (availableIndex !== -1) {
                        semaphore[availableIndex] = suite.id;
                        resolve();
                    }
                    else {
                        setTimeout(checkSlot, 100);
                    }
                };
                checkSlot();
            });
            try {
                const result = await runSuite(suite);
                results.push(result);
                return result;
            }
            finally {
                const index = semaphore.findIndex(slot => slot === suite.id);
                if (index !== -1) {
                    semaphore[index] = null;
                }
            }
        });
        await Promise.allSettled(promises);
        return results;
    }
    // Run test suites sequentially
    async runTestSuitesSequential(suites, config) {
        const results = [];
        for (const suite of suites) {
            const result = await this.runTestSuite(suite, config);
            results.push(result);
            if (config.failFast && result.failedTests > 0) {
                break;
            }
        }
        return results;
    }
    // Run individual test suite
    async runTestSuite(suite, config) {
        const startTime = Date.now();
        this.emit('test_suite_started', { suiteId: suite.id, name: suite.name });
        try {
            // Run setup if available
            if (suite.setup) {
                await suite.setup();
            }
            // Filter tests based on tags
            let tests = suite.tests;
            if (config.tags.length > 0) {
                tests = tests.filter(test => test.tags.some(tag => config.tags.includes(tag)));
            }
            if (config.excludeTags.length > 0) {
                tests = tests.filter(test => !test.tags.some(tag => config.excludeTags.includes(tag)));
            }
            // Run tests
            const testResults = [];
            for (const test of tests) {
                let attempts = 0;
                let result;
                do {
                    result = await this.runTestCase(test);
                    attempts++;
                } while (result.status === 'failed' &&
                    config.retryOnFailure &&
                    attempts <= test.retries);
                testResults.push(result);
                if (config.failFast && result.status === 'failed') {
                    break;
                }
            }
            // Run teardown if available
            if (suite.teardown) {
                await suite.teardown();
            }
            const endTime = Date.now();
            const duration = endTime - startTime;
            const suiteResult = {
                suiteId: suite.id,
                name: suite.name,
                startTime,
                endTime,
                duration,
                totalTests: testResults.length,
                passedTests: testResults.filter(r => r.status === 'passed').length,
                failedTests: testResults.filter(r => r.status === 'failed').length,
                skippedTests: testResults.filter(r => r.status === 'skipped').length,
                errorTests: testResults.filter(r => r.status === 'error').length,
                results: testResults,
                performance: this.calculateSuitePerformance(testResults)
            };
            this.emit('test_suite_completed', suiteResult);
            return suiteResult;
        }
        catch (error) {
            const endTime = Date.now();
            const suiteResult = {
                suiteId: suite.id,
                name: suite.name,
                startTime,
                endTime,
                duration: endTime - startTime,
                totalTests: 0,
                passedTests: 0,
                failedTests: 0,
                skippedTests: 0,
                errorTests: 1,
                results: [],
                performance: {
                    averageMemoryUsage: 0,
                    peakMemoryUsage: 0,
                    averageCpuUsage: 0,
                    totalCpuTime: 0
                }
            };
            this.emit('test_suite_failed', { suiteId: suite.id, error });
            return suiteResult;
        }
    }
    // Calculate suite performance metrics
    calculateSuitePerformance(results) {
        if (results.length === 0) {
            return {
                averageMemoryUsage: 0,
                peakMemoryUsage: 0,
                averageCpuUsage: 0,
                totalCpuTime: 0
            };
        }
        const validResults = results.filter(r => r.performance);
        const totalMemory = validResults.reduce((sum, r) => sum + r.performance.memoryUsage.heapUsed, 0);
        const peakMemory = Math.max(...validResults.map(r => r.performance.memoryUsage.heapUsed));
        const totalCpuUser = validResults.reduce((sum, r) => sum + r.performance.cpuUsage.user, 0);
        const totalCpuSystem = validResults.reduce((sum, r) => sum + r.performance.cpuUsage.system, 0);
        return {
            averageMemoryUsage: totalMemory / validResults.length,
            peakMemoryUsage: peakMemory,
            averageCpuUsage: (totalCpuUser + totalCpuSystem) / validResults.length,
            totalCpuTime: totalCpuUser + totalCpuSystem
        };
    }
    // Generate run summary
    generateRunSummary(results) {
        const totalTests = results.reduce((sum, r) => sum + r.totalTests, 0);
        const passedTests = results.reduce((sum, r) => sum + r.passedTests, 0);
        const failedTests = results.reduce((sum, r) => sum + r.failedTests, 0);
        const skippedTests = results.reduce((sum, r) => sum + r.skippedTests, 0);
        const errorTests = results.reduce((sum, r) => sum + r.errorTests, 0);
        return {
            totalSuites: results.length,
            totalTests,
            passedTests,
            failedTests,
            skippedTests,
            errorTests,
            passRate: totalTests > 0 ? (passedTests / totalTests) * 100 : 0,
            duration: results.reduce((sum, r) => sum + r.duration, 0)
        };
    }
    // Generate comprehensive test report
    async generateTestReport(run) {
        const reportDir = path.join(this.config.outputDir, `test-report-${run.id}`);
        await fs_1.promises.mkdir(reportDir, { recursive: true });
        // Generate HTML report
        const htmlReport = this.generateHtmlReport(run);
        await fs_1.promises.writeFile(path.join(reportDir, 'index.html'), htmlReport);
        // Generate JSON report
        const jsonReport = JSON.stringify(run, null, 2);
        await fs_1.promises.writeFile(path.join(reportDir, 'results.json'), jsonReport);
        // Generate performance report
        const perfReport = this.generatePerformanceReport(run);
        await fs_1.promises.writeFile(path.join(reportDir, 'performance.json'), JSON.stringify(perfReport, null, 2));
        this.emit('report_generated', { reportDir, runId: run.id });
    }
    // Generate HTML report
    generateHtmlReport(run) {
        const summary = this.generateRunSummary(run.results);
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Test Report - ${run.id}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .suite { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
        .passed { color: green; }
        .failed { color: red; }
        .skipped { color: orange; }
        .test-case { margin: 10px 0; padding: 10px; background: #f9f9f9; border-radius: 3px; }
    </style>
</head>
<body>
    <h1>Test Report</h1>
    <div class="summary">
        <h2>Summary</h2>
        <p>Run ID: ${run.id}</p>
        <p>Total Suites: ${summary.totalSuites}</p>
        <p>Total Tests: ${summary.totalTests}</p>
        <p>Passed: <span class="passed">${summary.passedTests}</span></p>
        <p>Failed: <span class="failed">${summary.failedTests}</span></p>
        <p>Skipped: <span class="skipped">${summary.skippedTests}</span></p>
        <p>Pass Rate: ${summary.passRate.toFixed(2)}%</p>
        <p>Duration: ${summary.duration}ms</p>
    </div>
    
    ${run.results.map((suite) => `
        <div class="suite">
            <h3>${suite.name}</h3>
            <p>Duration: ${suite.duration}ms</p>
            <p>Tests: ${suite.totalTests} | Passed: ${suite.passedTests} | Failed: ${suite.failedTests}</p>
            
            ${suite.results.map((test) => `
                <div class="test-case">
                    <strong class="${test.status}">${test.name}</strong>
                    <p>Status: ${test.status} | Duration: ${test.duration}ms</p>
                    ${test.error ? `<p>Error: ${test.error}</p>` : ''}
                </div>
            `).join('')}
        </div>
    `).join('')}
</body>
</html>`;
    }
    // Generate performance report
    generatePerformanceReport(run) {
        return {
            runId: run.id,
            startTime: run.startTime,
            suites: run.results.map((suite) => ({
                suiteId: suite.suiteId,
                name: suite.name,
                performance: suite.performance,
                tests: suite.results.map((test) => ({
                    testId: test.testId,
                    name: test.name,
                    duration: test.duration,
                    performance: test.performance
                }))
            }))
        };
    }
    // Get test suite by ID
    getTestSuite(id) {
        return this.testSuites.get(id);
    }
    // List all test suites
    listTestSuites() {
        return Array.from(this.testSuites.values());
    }
    // Get current run status
    getCurrentRunStatus() {
        return this.currentRun ? {
            id: this.currentRun.id,
            startTime: this.currentRun.startTime,
            duration: Date.now() - this.currentRun.startTime,
            configuration: this.currentRun.configuration,
            completedSuites: this.currentRun.results.length
        } : null;
    }
}
exports.ComprehensiveTestingSuite = ComprehensiveTestingSuite;
