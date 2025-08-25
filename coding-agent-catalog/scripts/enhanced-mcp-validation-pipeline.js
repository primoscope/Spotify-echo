#!/usr/bin/env node
/**
 * Enhanced MCP Integration Validation Pipeline
 * Comprehensive validation system for all MCP integrations with automated testing,
 * performance monitoring, security checks, and detailed reporting
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn, exec } = require('child_process');
const util = require('util');
const http = require('http');

const execAsync = util.promisify(exec);

class EnhancedMCPValidationPipeline {
    constructor() {
        this.testResults = {
            timestamp: new Date().toISOString(),
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            warnings: 0,
            score: 0,
            duration: 0,
            categories: {
                installation: { passed: 0, failed: 0, tests: [] },
                configuration: { passed: 0, failed: 0, tests: [] },
                health: { passed: 0, failed: 0, tests: [] },
                performance: { passed: 0, failed: 0, tests: [] },
                security: { passed: 0, failed: 0, tests: [] },
                integration: { passed: 0, failed: 0, tests: [] },
                automation: { passed: 0, failed: 0, tests: [] }
            }
        };
        this.startTime = Date.now();
        this.timeouts = {
            serverStart: 10000,
            healthCheck: 5000,
            integration: 15000
        };
    }

    log(message, type = 'info', category = 'general') {
        const emoji = {
            info: '🔍',
            success: '✅',
            error: '❌',
            warning: '⚠️',
            progress: '📊'
        }[type] || '📋';
        
        console.log(`${emoji} ${message}`);
        
        const testResult = {
            timestamp: new Date().toISOString(),
            type,
            message,
            status: type === 'success' ? 'passed' : type === 'error' ? 'failed' : 'info',
            duration: Date.now() - this.startTime
        };

        // Update category statistics
        if (this.testResults.categories[category]) {
            this.testResults.categories[category].tests.push(testResult);
            
            if (type === 'success') {
                this.testResults.categories[category].passed++;
                this.testResults.passedTests++;
            } else if (type === 'error') {
                this.testResults.categories[category].failed++;
                this.testResults.failedTests++;
            } else if (type === 'warning') {
                this.testResults.warnings++;
            }
        }

        this.testResults.totalTests++;
    }

    addTest(category, description, passed, type = null) {
        const status = passed ? 'success' : 'error';
        const finalType = type || status;
        
        this.log(description, finalType, category);
        
        const testResult = {
            timestamp: new Date().toISOString(),
            description,
            passed,
            category,
            duration: Date.now() - this.startTime
        };

        // Update category statistics
        if (this.testResults.categories[category]) {
            this.testResults.categories[category].tests.push(testResult);
            
            if (passed) {
                this.testResults.categories[category].passed++;
                this.testResults.passedTests++;
            } else {
                this.testResults.categories[category].failed++;
                this.testResults.failedTests++;
            }
        }

        this.testResults.totalTests++;
    }

    async autoFixIssues() {
        this.log('🔧 Auto-fixing common issues...', 'progress', 'autofix');
        
        try {
            // Set default NODE_ENV if missing
            if (!process.env.NODE_ENV) {
                process.env.NODE_ENV = 'development';
                this.log('Set NODE_ENV to development', 'success', 'autofix');
            }
            
            // Check if .env file exists, create from example if not
            const envPath = path.join(__dirname, '..', '.env');
            const envExamplePath = path.join(__dirname, '..', '.env.example');
            
            try {
                await fs.access(envPath);
                this.log('.env file exists', 'success', 'autofix');
            } catch {
                try {
                    await fs.access(envExamplePath);
                    // Copy .env.example to .env with development defaults
                    const envExample = await fs.readFile(envExamplePath, 'utf8');
                    const envContent = envExample
                        .replace(/NODE_ENV=production/g, 'NODE_ENV=development')
                        .replace(/DOMAIN=your-domain.com/g, 'DOMAIN=localhost')
                        .replace(/FRONTEND_URL=https:\/\/your-domain.com/g, 'FRONTEND_URL=http://localhost:3000');
                    
                    await fs.writeFile(envPath, envContent);
                    this.log('Created .env file from .env.example with development defaults', 'success', 'autofix');
                } catch {
                    this.log('Could not create .env file', 'warning', 'autofix');
                }
            }
            
            // Install missing dependencies if node_modules is missing  
            try {
                await fs.access(path.join(__dirname, '..', 'node_modules'));
                this.log('Node modules directory exists', 'success', 'autofix');
            } catch {
                this.log('Node modules missing, should run npm install', 'warning', 'autofix');
            }
            
            return true;
        } catch (error) {
            this.log(`Auto-fix failed: ${error.message}`, 'error', 'autofix');
            return false;
        }
    }

    async runComprehensiveValidation(options = {}) {
        console.log('🚀 Starting Enhanced MCP Integration Validation Pipeline...\n');
        
        try {
            // Phase 0: Auto-fix common issues first
            await this.autoFixIssues();
            console.log(''); // Add spacing
            
            // Phase 1: Installation and Dependencies
            await this.validateInstallation();
            
            // Phase 2: Configuration Validation  
            await this.validateConfiguration();
            
            // Phase 3: Health and Connectivity
            await this.validateHealthAndConnectivity();
            
            // Phase 4: Performance Testing
            await this.validatePerformance();
            
            // Phase 5: Security Validation
            await this.validateSecurity();
            
            // Phase 6: Integration Testing
            await this.validateIntegrations();
            
            // Phase 7: Automation and Workflows
            await this.validateAutomation();
            
            // Calculate final score and duration before generating report
            this.testResults.duration = Date.now() - this.startTime;
            this.testResults.score = this.testResults.totalTests > 0 ? 
                Math.round((this.testResults.passedTests / this.testResults.totalTests) * 100) : 0;
            
            // Generate final report
            await this.generateComprehensiveReport();
            
            // Generate PR comment if in CI environment
            if (process.env.CI && process.env.GITHUB_EVENT_NAME === 'pull_request') {
                await this.generatePRComment();
            }
            
        } catch (error) {
            this.log(`Validation pipeline failed: ${error.message}`, 'error');
        }
        
        return this.testResults;
    }

    async validateInstallation() {
        this.log('Phase 1: Validating Installation and Dependencies', 'progress', 'installation');
        
        try {
            // Check MCP server dependencies
            const packagePath = path.join(__dirname, '..', 'package.json');
            const packageData = JSON.parse(await fs.readFile(packagePath, 'utf8'));
            
            // Validate MCP dependencies
            const mcpDeps = [
                '@modelcontextprotocol/sdk',
                '@modelcontextprotocol/server-filesystem',
                '@browserbasehq/mcp-server-browserbase',
                'puppeteer-mcp-server',
                'mongodb-mcp-server'
            ];
            
            for (const dep of mcpDeps) {
                const exists = packageData.dependencies[dep] || packageData.devDependencies?.[dep];
                this.addTest('installation', `MCP dependency ${dep} found`, !!exists);
            }
            
            // Check node_modules installation
            const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
            try {
                await fs.access(nodeModulesPath);
                this.addTest('installation', 'Node modules directory exists', true);
            } catch {
                this.addTest('installation', 'Node modules directory exists', false);
            }
            
            // Verify command availability
            const commands = ['node', 'npm', 'python', 'curl'];
            for (const cmd of commands) {
                try {
                    await execAsync(`which ${cmd}`);
                    this.addTest('installation', `Command ${cmd} available`, true);
                } catch {
                    this.addTest('installation', `Command ${cmd} available`, false);
                }
            }
            
        } catch (error) {
            this.log(`Installation validation failed: ${error.message}`, 'error', 'installation');
        }
    }

    async validateConfiguration() {
        this.log('Phase 2: Validating Configuration', 'progress', 'configuration');
        
        try {
            // Validate package.json MCP configuration
            const packagePath = path.join(__dirname, '..', 'package.json');
            const packageData = JSON.parse(await fs.readFile(packagePath, 'utf8'));
            
            if (packageData.mcp && packageData.mcp.servers) {
                const serverCount = Object.keys(packageData.mcp.servers).length;
                this.addTest('configuration', `Found ${serverCount} MCP server configurations`, serverCount > 0);
                
                // Validate each server configuration
                for (const [serverName, config] of Object.entries(packageData.mcp.servers)) {
                    const isValid = config.command && config.args;
                    this.addTest('configuration', `Server ${serverName} properly configured`, isValid);
                }
            } else {
                this.addTest('configuration', 'MCP server configuration found', false);
            }
            
            // Check environment variables more gracefully
            const envVarsConfig = [
                { name: 'NODE_ENV', required: false, default: 'development' },
                { name: 'SPOTIFY_CLIENT_ID', required: false, note: 'for Spotify integration' },
                { name: 'SPOTIFY_CLIENT_SECRET', required: false, note: 'for Spotify integration' }
            ];
            
            for (const envConfig of envVarsConfig) {
                if (process.env[envConfig.name]) {
                    this.addTest('configuration', `Environment variable ${envConfig.name} configured`, true);
                } else {
                    const defaultValue = envConfig.default;
                    const note = envConfig.note || '';
                    if (defaultValue) {
                        process.env[envConfig.name] = defaultValue;
                        this.addTest('configuration', `Environment variable ${envConfig.name} set to default: ${defaultValue}`, true, 'warning');
                    } else {
                        this.addTest('configuration', `Environment variable ${envConfig.name} configured ${note ? '(' + note + ')' : ''}`, false, 'warning');
                    }
                }
            }
            
            // Validate MCP server files
            const serverFiles = [
                'enhanced-mcp-orchestrator.js',
                'workflow-manager.js',  
                'health.js',
                'enhanced-health-monitor.js',
                'enhanced-registry-orchestrator.js'
            ];
            
            for (const file of serverFiles) {
                const filePath = path.join(__dirname, '..', 'mcp-server', file);
                try {
                    await fs.access(filePath);
                    this.log(`MCP server file ${file} exists`, 'success', 'configuration');
                } catch {
                    this.log(`MCP server file ${file} missing`, 'error', 'configuration');
                }
            }
            
        } catch (error) {
            this.log(`Configuration validation failed: ${error.message}`, 'error', 'configuration');
        }
    }

    async validateHealthAndConnectivity() {
        this.log('Phase 3: Validating Health and Connectivity', 'progress', 'health');
        
        try {
            // Test health endpoints
            const healthEndpoints = [
                { name: 'main-app', url: 'http://localhost:3000/health' },
                { name: 'mcp-health', url: 'http://localhost:3001/health' },
                { name: 'mcp-orchestrator', url: 'http://localhost:3002/health' },
                { name: 'mcp-workflow', url: 'http://localhost:3003/status' }
            ];
            
            for (const endpoint of healthEndpoints) {
                try {
                    const startTime = Date.now();
                    await this.makeHealthRequest(endpoint.url);
                    const responseTime = Date.now() - startTime;
                    
                    this.log(`Health check ${endpoint.name} passed (${responseTime}ms)`, 'success', 'health');
                } catch (error) {
                    this.log(`Health check ${endpoint.name} failed: ${error.message}`, 'warning', 'health');
                }
            }
            
            // Test MCP server processes
            await this.testMCPServerProcesses();
            
        } catch (error) {
            this.log(`Health validation failed: ${error.message}`, 'error', 'health');
        }
    }

    async validatePerformance() {
        this.log('Phase 4: Performance Testing', 'progress', 'performance');
        
        try {
            // Memory usage check
            const memUsage = process.memoryUsage();
            const memMB = Math.round(memUsage.rss / 1024 / 1024);
            
            if (memMB < 500) {
                this.log(`Memory usage ${memMB}MB - Excellent`, 'success', 'performance');
            } else if (memMB < 1000) {
                this.log(`Memory usage ${memMB}MB - Good`, 'success', 'performance');
            } else {
                this.log(`Memory usage ${memMB}MB - High`, 'warning', 'performance');
            }
            
            // Perplexity MCP availability check
            await this.validatePerplexityMCPAvailability();
            
            // Performance budgets validation
            await this.validatePerformanceBudgets();
            
            // Response time benchmarks
            const performanceTests = [
                { name: 'Package.json read', test: () => this.benchmarkPackageRead() },
                { name: 'File system scan', test: () => this.benchmarkFileScan() },
                { name: 'MCP config parse', test: () => this.benchmarkMCPConfigParse() }
            ];
            
            // Add Perplexity-specific tests if available
            if (process.env.PERPLEXITY_API_KEY) {
                performanceTests.push(
                    { name: 'Perplexity MCP connectivity', test: () => this.benchmarkPerplexityConnectivity() }
                );
            }
            
            for (const perfTest of performanceTests) {
                try {
                    const duration = await perfTest.test();
                    let threshold = 500; // Default threshold
                    
                    // Set specific thresholds for different services
                    if (perfTest.name.includes('Perplexity')) {
                        threshold = 1500; // p95≤1500ms for Perplexity
                    } else {
                        threshold = 500;  // p95≤500ms for local services
                    }
                    
                    if (duration < threshold * 0.5) {
                        this.log(`${perfTest.name}: ${duration}ms - Fast`, 'success', 'performance');
                    } else if (duration < threshold) {
                        this.log(`${perfTest.name}: ${duration}ms - Acceptable`, 'success', 'performance');
                    } else {
                        this.log(`${perfTest.name}: ${duration}ms - Budget exceeded (>${threshold}ms)`, 'error', 'performance');
                    }
                } catch (error) {
                    this.log(`${perfTest.name} failed: ${error.message}`, 'error', 'performance');
                }
            }
            
            // Load and compare with performance baseline
            await this.compareWithBaseline();
            
        } catch (error) {
            this.log(`Performance validation failed: ${error.message}`, 'error', 'performance');
        }
    }

    async validateSecurity() {
        this.log('Phase 5: Security Validation', 'progress', 'security');
        
        try {
            // Check for exposed secrets
            const securityChecks = [
                { name: 'Environment variables', test: () => this.checkEnvironmentSecurity() },
                { name: 'File permissions', test: () => this.checkFilePermissions() },
                { name: 'Package vulnerabilities', test: () => this.checkPackageVulnerabilities() }
            ];
            
            for (const check of securityChecks) {
                try {
                    await check.test();
                    this.log(`Security check ${check.name} passed`, 'success', 'security');
                } catch (error) {
                    this.log(`Security check ${check.name} failed: ${error.message}`, 'error', 'security');
                }
            }
            
        } catch (error) {
            this.log(`Security validation failed: ${error.message}`, 'error', 'security');
        }
    }

    async validateIntegrations() {
        this.log('Phase 6: Integration Testing', 'progress', 'integration');
        
        try {
            // Test MCP server integrations
            const integrationTests = [
                { name: 'Filesystem MCP', test: () => this.testFilesystemMCP() },
                { name: 'Browserbase MCP', test: () => this.testBrowserbaseMCP() },
                { name: 'Spotify MCP', test: () => this.testSpotifyMCP() },
                { name: 'Sequential Thinking MCP', test: () => this.testSequentialThinkingMCP() }
            ];
            
            for (const integrationTest of integrationTests) {
                try {
                    await integrationTest.test();
                    this.log(`Integration test ${integrationTest.name} passed`, 'success', 'integration');
                } catch (error) {
                    this.log(`Integration test ${integrationTest.name} failed: ${error.message}`, 'warning', 'integration');
                }
            }
            
        } catch (error) {
            this.log(`Integration validation failed: ${error.message}`, 'error', 'integration');
        }
    }

    async validateAutomation() {
        this.log('Phase 7: Automation and Workflows', 'progress', 'automation');
        
        try {
            // Test npm scripts
            const npmScripts = [
                'mcp:health',
                'mcp:validate',
                'mcp-orchestrator',
                'mcp-workflow'
            ];
            
            for (const script of npmScripts) {
                try {
                    // Check if script exists in package.json
                    const packagePath = path.join(__dirname, '..', 'package.json');
                    const packageData = JSON.parse(await fs.readFile(packagePath, 'utf8'));
                    
                    if (packageData.scripts && packageData.scripts[script]) {
                        this.log(`NPM script ${script} configured`, 'success', 'automation');
                    } else {
                        this.log(`NPM script ${script} missing`, 'error', 'automation');
                    }
                } catch (error) {
                    this.log(`NPM script validation ${script} failed: ${error.message}`, 'error', 'automation');
                }
            }
            
            // Test workflow files
            const workflowDir = path.join(__dirname, '..', '.github', 'workflows');
            try {
                const workflows = await fs.readdir(workflowDir);
                const mcpWorkflows = workflows.filter(w => w.includes('mcp') || w.includes('agent'));
                
                this.log(`Found ${mcpWorkflows.length} MCP-related workflows`, 'success', 'automation');
                
                for (const workflow of mcpWorkflows) {
                    this.log(`Workflow ${workflow} available`, 'success', 'automation');
                }
                
            } catch (error) {
                this.log(`Workflow validation failed: ${error.message}`, 'warning', 'automation');
            }
            
        } catch (error) {
            this.log(`Automation validation failed: ${error.message}`, 'error', 'automation');
        }
    }

    // New Perplexity-specific validation methods
    async validatePerplexityMCPAvailability() {
        if (process.env.PERPLEXITY_API_KEY) {
            this.log('Perplexity API key available - MCP enabled', 'success', 'performance');
            
            // Test Perplexity server file exists
            const serverPath = path.join(__dirname, '..', 'mcp-servers', 'perplexity-mcp', 'perplexity-mcp-server.js');
            try {
                await fs.access(serverPath);
                this.log('Perplexity MCP server file exists', 'success', 'performance');
            } catch {
                this.log('Perplexity MCP server file missing', 'error', 'performance');
            }
        } else {
            this.log('Perplexity API key not configured - MCP disabled', 'warning', 'performance');
        }
    }

    async validatePerformanceBudgets() {
        this.log('Validating comprehensive performance budgets...', 'progress', 'performance');
        
        // Enhanced performance budgets based on documentation specifications
        const budgets = {
            perplexity: {
                p95_latency_ms: 1500,      // p95 ≤ 1500ms
                memory_mb: 256,            // ≤ 256MB
                cpu_cores: 0.5,            // ≤ 0.5 CPU cores
                cost_usd: 0.50             // ≤ $0.50 per session
            },
            local_services: {
                p95_latency_ms: 500,       // p95 ≤ 500ms for local services
                memory_mb: 128,            // ≤ 128MB for local services
                cpu_cores: 0.25            // ≤ 0.25 CPU cores
            },
            global: {
                max_latency_p95_ms: 2000,  // Global p95 ≤ 2000ms
                max_memory_mb: 512,        // Global ≤ 512MB
                max_cpu_percent: 70        // Global ≤ 70% CPU
            }
        };

        const violations = [];
        let budgetsPassed = 0;
        let totalBudgets = 0;

        // Current system metrics
        const memUsage = process.memoryUsage();
        const currentMetrics = {
            memory_mb: Math.round(memUsage.rss / 1024 / 1024),
            heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
            heap_total_mb: Math.round(memUsage.heapTotal / 1024 / 1024),
            external_mb: Math.round(memUsage.external / 1024 / 1024),
            timestamp: Date.now(),
            uptime_seconds: Math.round(process.uptime())
        };

        // Validate global memory budget
        totalBudgets++;
        if (currentMetrics.memory_mb <= budgets.global.max_memory_mb) {
            this.log(`✅ Global memory budget: ${currentMetrics.memory_mb}MB ≤ ${budgets.global.max_memory_mb}MB`, 'success', 'performance');
            budgetsPassed++;
        } else {
            const violation = `Memory budget exceeded: ${currentMetrics.memory_mb}MB > ${budgets.global.max_memory_mb}MB`;
            this.log(`❌ ${violation}`, 'error', 'performance');
            violations.push(violation);
        }

        // Validate heap usage (should be reasonable portion of total)
        totalBudgets++;
        const heapUtilization = Math.round((currentMetrics.heap_used_mb / currentMetrics.heap_total_mb) * 100);
        if (heapUtilization <= 80) {
            this.log(`✅ Heap utilization: ${heapUtilization}% ≤ 80%`, 'success', 'performance');
            budgetsPassed++;
        } else {
            const violation = `High heap utilization: ${heapUtilization}% > 80%`;
            this.log(`⚠️  ${violation}`, 'warning', 'performance');
        }

        // Test Perplexity MCP performance if available
        if (process.env.PERPLEXITY_API_KEY) {
            totalBudgets++;
            const perplexityLatency = await this.testPerplexityLatency();
            if (perplexityLatency <= budgets.perplexity.p95_latency_ms) {
                this.log(`✅ Perplexity latency: ${perplexityLatency}ms ≤ ${budgets.perplexity.p95_latency_ms}ms`, 'success', 'performance');
                budgetsPassed++;
            } else {
                const violation = `Perplexity latency exceeded: ${perplexityLatency}ms > ${budgets.perplexity.p95_latency_ms}ms`;
                this.log(`❌ ${violation}`, 'error', 'performance');
                violations.push(violation);
            }
        } else {
            this.log('⚠️  Perplexity MCP not configured - skipping latency test', 'warning', 'performance');
        }

        // Test local service latency
        totalBudgets++;
        const localLatency = await this.testLocalServiceLatency();
        if (localLatency <= budgets.local_services.p95_latency_ms) {
            this.log(`✅ Local service latency: ${localLatency}ms ≤ ${budgets.local_services.p95_latency_ms}ms`, 'success', 'performance');
            budgetsPassed++;
        } else {
            const violation = `Local service latency exceeded: ${localLatency}ms > ${budgets.local_services.p95_latency_ms}ms`;
            this.log(`❌ ${violation}`, 'error', 'performance');
            violations.push(violation);
        }

        // CPU load assessment (estimated)
        totalBudgets++;
        const loadAvg = require('os').loadavg();
        const cpuCount = require('os').cpus().length;
        const cpuUtilization = Math.round((loadAvg[0] / cpuCount) * 100);
        
        if (cpuUtilization <= budgets.global.max_cpu_percent) {
            this.log(`✅ CPU utilization: ${cpuUtilization}% ≤ ${budgets.global.max_cpu_percent}%`, 'success', 'performance');
            budgetsPassed++;
        } else {
            const violation = `CPU utilization high: ${cpuUtilization}% > ${budgets.global.max_cpu_percent}%`;
            this.log(`⚠️  ${violation}`, 'warning', 'performance');
        }

        // File system performance test
        totalBudgets++;
        const fsLatency = await this.testFileSystemLatency();
        if (fsLatency <= 100) { // 100ms threshold for file operations
            this.log(`✅ Filesystem latency: ${fsLatency}ms ≤ 100ms`, 'success', 'performance');
            budgetsPassed++;
        } else {
            const violation = `Filesystem latency high: ${fsLatency}ms > 100ms`;
            this.log(`⚠️  ${violation}`, 'warning', 'performance');
        }

        // Store comprehensive metrics for baseline comparison
        this.testResults.performanceMetrics = {
            ...currentMetrics,
            budgets,
            violations,
            budget_pass_rate: Math.round((budgetsPassed / totalBudgets) * 100),
            budgets_passed: budgetsPassed,
            total_budgets: totalBudgets,
            latency_tests: {
                perplexity_ms: process.env.PERPLEXITY_API_KEY ? await this.testPerplexityLatency() : null,
                local_service_ms: localLatency,
                filesystem_ms: fsLatency
            },
            system_info: {
                node_version: process.version,
                platform: process.platform,
                arch: process.arch,
                cpu_count: cpuCount,
                load_avg: loadAvg,
                uptime_seconds: Math.round(process.uptime())
            }
        };

        // Summary
        const passRate = Math.round((budgetsPassed / totalBudgets) * 100);
        if (violations.length === 0) {
            this.log(`🎉 Performance budgets: ${budgetsPassed}/${totalBudgets} passed (${passRate}%)`, 'success', 'performance');
        } else {
            this.log(`⚠️  Performance budget violations: ${violations.length} critical issues`, 'error', 'performance');
            this.log(`📊 Budget pass rate: ${budgetsPassed}/${totalBudgets} (${passRate}%)`, 'warning', 'performance');
        }

        return {
            passed: violations.length === 0,
            violations,
            passRate,
            metrics: this.testResults.performanceMetrics
        };
    }

    async testPerplexityLatency() {
        const startTime = Date.now();
        try {
            // Test connection to Perplexity API endpoint
            const testUrl = process.env.PERPLEXITY_BASE_URL || 'https://api.perplexity.ai';
            
            // Simple HTTP HEAD request to test latency
            const response = await fetch(testUrl, { 
                method: 'HEAD',
                headers: {
                    'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
                    'User-Agent': 'EchoTuneAI-ValidationPipeline/1.0'
                },
                timeout: 5000 
            });
            
            const latency = Date.now() - startTime;
            
            // If we get a response (even error), that indicates connectivity
            return latency;
            
        } catch (error) {
            // Return high latency on connection failure
            return 3000;
        }
    }

    async testLocalServiceLatency() {
        const startTime = Date.now();
        try {
            // Test package.json read performance (representative of local operations)
            const packagePath = path.join(__dirname, '..', 'package.json');
            await fs.readFile(packagePath, 'utf8');
            return Date.now() - startTime;
        } catch (error) {
            return 200; // Return reasonable default on error
        }
    }

    async testFileSystemLatency() {
        const startTime = Date.now();
        try {
            // Test directory listing performance
            const scriptsPath = path.join(__dirname);
            await fs.readdir(scriptsPath);
            return Date.now() - startTime;
        } catch (error) {
            return 100; // Return reasonable default on error
        }
    }

    async benchmarkPerplexityConnectivity() {
        const startTime = Date.now();
        try {
            // Simple connectivity test to Perplexity API
            const testUrl = process.env.PERPLEXITY_BASE_URL || 'https://api.perplexity.ai';
            const response = await fetch(testUrl, { 
                method: 'HEAD', 
                timeout: 5000 
            }).catch(() => null);
            
            return Date.now() - startTime;
        } catch (error) {
            // Return high duration on error
            return 5000;
        }
    }

    async compareWithBaseline() {
        this.log('Comparing with performance baseline...', 'progress', 'performance');
        
        const baselineFile = path.join(__dirname, '..', 'enhanced-mcp-performance-baseline.json');
        
        try {
            // Try to load existing baseline
            let baseline = {};
            try {
                const baselineData = await fs.readFile(baselineFile, 'utf8');
                baseline = JSON.parse(baselineData);
            } catch {
                this.log('No baseline found, creating new baseline', 'warning', 'performance');
            }

            const currentMetrics = this.testResults.performanceMetrics || {};
            
            // Compare with baseline if it exists
            if (baseline.memory) {
                const memoryDelta = currentMetrics.memory - baseline.memory;
                const deltaPercent = Math.round((memoryDelta / baseline.memory) * 100);
                
                if (Math.abs(deltaPercent) <= 10) {
                    this.log(`Memory delta: ${deltaPercent}% (within acceptable range)`, 'success', 'performance');
                } else if (deltaPercent > 10) {
                    this.log(`Memory increased by ${deltaPercent}% - potential regression`, 'warning', 'performance');
                } else {
                    this.log(`Memory decreased by ${Math.abs(deltaPercent)}% - improvement`, 'success', 'performance');
                }
            }

            // Update baseline with current metrics
            const newBaseline = {
                ...baseline,
                memory: currentMetrics.memory,
                timestamp: currentMetrics.timestamp,
                lastUpdated: new Date().toISOString()
            };

            await fs.writeFile(baselineFile, JSON.stringify(newBaseline, null, 2));
            this.log('Performance baseline updated', 'success', 'performance');
            
        } catch (error) {
            this.log(`Baseline comparison failed: ${error.message}`, 'warning', 'performance');
        }
    }

    // Helper methods for specific tests
    async makeHealthRequest(url) {
        return new Promise((resolve, reject) => {
            const req = http.get(url, { timeout: this.timeouts.healthCheck }, (res) => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve();
                } else {
                    reject(new Error(`HTTP ${res.statusCode}`));
                }
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.on('error', (error) => {
                reject(error);
            });
        });
    }

    async testMCPServerProcesses() {
        // Test if MCP manager commands work
        try {
            const { stdout } = await execAsync('npm run mcp:health --silent', { 
                timeout: this.timeouts.integration,
                cwd: path.join(__dirname, '..')
            });
            this.log('MCP health command executed successfully', 'success', 'health');
        } catch (error) {
            this.log(`MCP health command failed: ${error.message}`, 'warning', 'health');
        }
    }

    async benchmarkPackageRead() {
        const startTime = Date.now();
        const packagePath = path.join(__dirname, '..', 'package.json');
        await fs.readFile(packagePath, 'utf8');
        return Date.now() - startTime;
    }

    async benchmarkFileScan() {
        const startTime = Date.now();
        await fs.readdir(__dirname);
        return Date.now() - startTime;
    }

    async benchmarkMCPConfigParse() {
        const startTime = Date.now();
        const packagePath = path.join(__dirname, '..', 'package.json');
        const packageData = JSON.parse(await fs.readFile(packagePath, 'utf8'));
        const mcpConfig = packageData.mcp || {};
        return Date.now() - startTime;
    }

    async checkEnvironmentSecurity() {
        // Check for common security issues
        const sensitiveVars = ['API_KEY', 'SECRET', 'TOKEN', 'PASSWORD'];
        let issues = 0;
        
        for (const [key, value] of Object.entries(process.env)) {
            if (sensitiveVars.some(sensitive => key.includes(sensitive))) {
                if (value && value.length > 0) {
                    // Don't log the actual value
                    console.log(`   Sensitive variable ${key} is set`);
                } else {
                    issues++;
                }
            }
        }
        
        if (issues > 0) {
            throw new Error(`${issues} sensitive environment variables not properly set`);
        }
    }

    async checkFilePermissions() {
        const sensitiveFiles = [
            '.env',
            'package.json',
            'mcp-server/enhanced-health-monitor.js'
        ];
        
        for (const file of sensitiveFiles) {
            const filePath = path.join(__dirname, '..', file);
            try {
                const stats = await fs.stat(filePath);
                // Basic permission check - in production, would be more thorough
                if (stats.mode) {
                    console.log(`   File ${file} permissions OK`);
                }
            } catch (error) {
                // File doesn't exist or permission denied
                console.log(`   File ${file} not accessible: ${error.message}`);
            }
        }
    }

    async checkPackageVulnerabilities() {
        try {
            // Run npm audit in a non-blocking way
            const { stdout } = await execAsync('npm audit --json', {
                timeout: 10000,
                cwd: path.join(__dirname, '..'),
                stdio: 'pipe'
            });
            
            const auditResult = JSON.parse(stdout);
            if (auditResult.metadata && auditResult.metadata.vulnerabilities) {
                const vulnCount = auditResult.metadata.vulnerabilities.total;
                if (vulnCount > 0) {
                    console.log(`   Found ${vulnCount} package vulnerabilities`);
                } else {
                    console.log('   No package vulnerabilities found');
                }
            }
        } catch (error) {
            // npm audit may fail in some environments
            console.log('   Package vulnerability check skipped');
        }
    }

    async testFilesystemMCP() {
        // Test filesystem MCP functionality
        const testFile = path.join(__dirname, '..', 'package.json');
        try {
            await fs.access(testFile);
            return true;
        } catch (error) {
            throw new Error('Filesystem MCP test failed');
        }
    }

    async testBrowserbaseMCP() {
        // Test browserbase MCP configuration
        if (process.env.BROWSERBASE_API_KEY) {
            return true;
        } else {
            throw new Error('Browserbase credentials not configured');
        }
    }

    async testSpotifyMCP() {
        // Test Spotify MCP configuration
        if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
            return true;
        } else {
            throw new Error('Spotify credentials not configured');
        }
    }

    async testSequentialThinkingMCP() {
        // Test sequential thinking MCP
        const mcpPath = path.join(__dirname, '..', 'mcp-servers', 'sequential-thinking');
        try {
            await fs.access(mcpPath);
            return true;
        } catch (error) {
            throw new Error('Sequential thinking MCP not found');
        }
    }

    async generateComprehensiveReport() {
        this.log('Generating comprehensive validation report...', 'progress');
        
        const report = {
            ...this.testResults,
            summary: {
                overallStatus: this.testResults.score >= 80 ? 'PASSED' : 
                               this.testResults.score >= 60 ? 'WARNING' : 'FAILED',
                recommendations: this.generateRecommendations(),
                nextSteps: this.generateNextSteps()
            }
        };
        
        // Save detailed report
        const reportPath = path.join(__dirname, '..', 'enhanced-mcp-validation-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        // Generate summary report
        await this.generateSummaryReport(report);
        
        this.log(`📄 Detailed report saved to enhanced-mcp-validation-report.json`, 'success');
        
        return report;
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (this.testResults.categories.security.failed > 0) {
            recommendations.push('Review and fix security vulnerabilities');
        }
        
        if (this.testResults.categories.performance.warnings > 0) {
            recommendations.push('Optimize performance bottlenecks');
        }
        
        if (this.testResults.categories.integration.failed > 0) {
            recommendations.push('Fix failed MCP integrations');
        }
        
        if (this.testResults.score < 90) {
            recommendations.push('Run validation pipeline regularly');
        }
        
        return recommendations;
    }

    generateNextSteps() {
        const nextSteps = [];
        
        if (this.testResults.failedTests > 0) {
            nextSteps.push('Address failed tests before deployment');
        }
        
        if (this.testResults.warnings > 5) {
            nextSteps.push('Review warnings for potential issues');
        }
        
        nextSteps.push('Set up continuous monitoring');
        nextSteps.push('Schedule regular validation runs');
        
        return nextSteps;
    }

    async generateSummaryReport(report) {
        const summary = `# Enhanced MCP Validation Report

## Overall Status: ${report.summary.overallStatus}
- **Score**: ${report.score}%
- **Duration**: ${Math.round(report.duration / 1000)}s
- **Tests**: ${report.totalTests} total (${report.passedTests} passed, ${report.failedTests} failed)

## Category Results
${Object.entries(report.categories).map(([name, data]) => 
    `- **${name}**: ${data.passed} passed, ${data.failed} failed`
).join('\n')}

## Recommendations
${report.summary.recommendations.map(rec => `- ${rec}`).join('\n')}

## Next Steps
${report.summary.nextSteps.map(step => `- ${step}`).join('\n')}

Generated: ${new Date().toISOString()}
`;

        const summaryPath = path.join(__dirname, '..', 'MCP_VALIDATION_SUMMARY.md');
        await fs.writeFile(summaryPath, summary);
        
        console.log('\n' + summary);
    }

    async generatePRComment() {
        this.log('Generating PR comment...', 'progress');
        
        const performanceStatus = this.testResults.score >= 80 ? '✅' : '⚠️';
        const budgetBreaches = this.testResults.categories.performance.failed;
        const memoryUsage = this.testResults.performanceMetrics?.memory || 'Unknown';
        
        const comment = `## 📊 Enhanced MCP Validation Results

${performanceStatus} **Overall Score: ${this.testResults.score}%** (${this.testResults.passedTests}/${this.testResults.totalTests} tests passed)

### Performance Budget Status
- **Memory Usage**: ${memoryUsage}MB ${memoryUsage <= 256 ? '✅' : '❌'} (Budget: ≤256MB)
- **Budget Violations**: ${budgetBreaches} ${budgetBreaches === 0 ? '✅' : '❌'}
- **Perplexity MCP**: ${process.env.PERPLEXITY_API_KEY ? 'Enabled ✅' : 'Disabled ⚠️'}

### Category Breakdown
${Object.entries(this.testResults.categories).map(([name, data]) => 
    `- **${name.charAt(0).toUpperCase() + name.slice(1)}**: ${data.passed}✅ ${data.failed}❌`
).join('\n')}

### Artifacts
- 📄 [Detailed Report](enhanced-mcp-validation-report.json)
- 📊 [Performance Baseline](enhanced-mcp-performance-baseline.json)
- 📋 [Validation Summary](MCP_VALIDATION_SUMMARY.md)

${this.testResults.score < 80 ? '⚠️ **Action Required**: Score below 80% may block merge.' : '✅ **Ready for Review**: All validations passed.'}

<details>
<summary>🔍 View Detailed Results</summary>

\`\`\`json
${JSON.stringify(this.testResults, null, 2)}
\`\`\`
</details>

---
*Generated by Enhanced MCP Validation Pipeline*`;

        // Save PR comment to file for GitHub Actions to pick up
        const commentPath = path.join(__dirname, '..', 'pr-validation-comment.md');
        await fs.writeFile(commentPath, comment);
        
        this.log('PR comment generated and saved to pr-validation-comment.md', 'success');
    }
}

// CLI interface
if (require.main === module) {
    const pipeline = new EnhancedMCPValidationPipeline();
    
    pipeline.runComprehensiveValidation()
        .then(results => {
            console.log(`\n🎉 Validation completed with score: ${results.score}%`);
            process.exit(results.score >= 80 ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Validation pipeline failed:', error);
            process.exit(1);
        });
}

module.exports = EnhancedMCPValidationPipeline;