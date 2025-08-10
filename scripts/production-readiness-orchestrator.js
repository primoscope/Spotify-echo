#!/usr/bin/env node

/**
 * Comprehensive Production Readiness Orchestrator
 * 
 * This master script orchestrates the complete production readiness analysis system,
 * integrating the Production Readiness Analyzer with MCP-powered automation to provide
 * a unified, comprehensive validation and optimization process.
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

// Import the analysis components
const ProductionReadinessAnalyzer = require('./production-readiness-analyzer');
const MCPProductionAutomation = require('./mcp-production-automation');

class ProductionReadinessOrchestrator {
    constructor() {
        this.projectRoot = process.cwd();
        this.orchestrationResults = {
            timestamp: new Date().toISOString(),
            orchestrator_version: '1.0.0',
            analysis_results: null,
            automation_results: null,
            combined_metrics: {},
            unified_roadmap: {
                critical_actions: [],
                optimization_opportunities: [],
                strategic_improvements: []
            },
            execution_summary: {
                total_execution_time: 0,
                analyzers_run: [],
                reports_generated: [],
                overall_success: false
            }
        };
    }

    async runComprehensiveAnalysis(options = {}) {
        const startTime = Date.now();
        
        console.log('🎯 Comprehensive Production Readiness Orchestrator');
        console.log('=' .repeat(60));
        console.log(`🚀 Version: ${this.orchestrationResults.orchestrator_version}`);
        console.log(`📅 Started: ${new Date().toLocaleString()}`);
        console.log(`🏗️  Project: EchoTune AI - Production Readiness Validation`);
        console.log('=' .repeat(60));

        try {
            // Phase 1: Initialize and validate environment
            await this.initializeOrchestration(options);
            
            // Phase 2: Run comprehensive production readiness analysis
            await this.runProductionReadinessAnalysis();
            
            // Phase 3: Run MCP-powered automation and optimization
            await this.runMCPAutomation();
            
            // Phase 4: Combine results and generate unified insights
            await this.combineAndAnalyzeResults();
            
            // Phase 5: Generate comprehensive reports and roadmap
            await this.generateUnifiedReports();
            
            // Phase 6: Provide actionable next steps
            await this.generateActionPlan();
            
            this.orchestrationResults.execution_summary.total_execution_time = Date.now() - startTime;
            this.orchestrationResults.execution_summary.overall_success = true;
            
            console.log('\n🎉 Comprehensive Production Readiness Analysis Complete!');
            this.displayExecutionSummary();
            
            return this.orchestrationResults;

        } catch (error) {
            console.error('\n❌ Orchestration Failed:', error.message);
            this.orchestrationResults.execution_summary.total_execution_time = Date.now() - startTime;
            this.orchestrationResults.execution_summary.overall_success = false;
            this.orchestrationResults.error = error.message;
            
            return this.orchestrationResults;
        }
    }

    async initializeOrchestration(options) {
        console.log('\n🔧 Initializing Production Readiness Orchestration...');
        
        // Validate project structure
        await this.validateProjectStructure();
        
        // Check prerequisites
        await this.checkPrerequisites();
        
        // Initialize logging and reporting
        await this.initializeReporting(options);
        
        console.log('✅ Orchestration initialized successfully');
    }

    async validateProjectStructure() {
        console.log('  🏗️  Validating project structure...');
        
        const requiredDirectories = ['src', 'scripts', 'package.json'];
        const missingComponents = [];
        
        for (const component of requiredDirectories) {
            try {
                await fs.access(path.join(this.projectRoot, component));
            } catch {
                missingComponents.push(component);
            }
        }
        
        if (missingComponents.length > 0) {
            throw new Error(`Missing required project components: ${missingComponents.join(', ')}`);
        }
        
        console.log('    ✅ Project structure validated');
    }

    async checkPrerequisites() {
        console.log('  📋 Checking prerequisites...');
        
        // Check Node.js version
        const nodeVersion = process.version;
        console.log(`    📍 Node.js version: ${nodeVersion}`);
        
        // Check npm availability
        try {
            execSync('npm --version', { stdio: 'pipe' });
            console.log('    ✅ npm available');
        } catch {
            console.log('    ⚠️  npm not available - some validations may be limited');
        }
        
        // Check if this is a git repository
        try {
            execSync('git status', { stdio: 'pipe' });
            console.log('    ✅ Git repository detected');
        } catch {
            console.log('    ⚠️  Not a git repository - version control checks will be skipped');
        }
    }

    async initializeReporting(options) {
        console.log('  📊 Initializing reporting system...');
        
        // Create reports directory if it doesn't exist
        const reportsDir = path.join(this.projectRoot, 'reports');
        try {
            await fs.access(reportsDir);
        } catch {
            await fs.mkdir(reportsDir, { recursive: true });
            console.log('    📁 Created reports directory');
        }
        
        console.log('    ✅ Reporting system ready');
    }

    async runProductionReadinessAnalysis() {
        console.log('\n📊 Running Production Readiness Analysis...');
        console.log('-' .repeat(40));
        
        try {
            const analyzer = new ProductionReadinessAnalyzer();
            this.orchestrationResults.analysis_results = await analyzer.analyze();
            this.orchestrationResults.execution_summary.analyzers_run.push('production-readiness-analyzer');
            
            console.log('✅ Production Readiness Analysis completed');
            console.log(`    📊 Overall readiness: ${this.orchestrationResults.analysis_results.metrics.overall_readiness_score}%`);
            console.log(`    ⚠️  Issues found: ${this.orchestrationResults.analysis_results.metrics.total_issues_found}`);
            
        } catch (error) {
            console.error('❌ Production Readiness Analysis failed:', error.message);
            // Continue with orchestration even if one analyzer fails
            this.orchestrationResults.analysis_results = { error: error.message };
        }
    }

    async runMCPAutomation() {
        console.log('\n🤖 Running MCP-Powered Automation...');
        console.log('-' .repeat(40));
        
        try {
            const mcpAutomation = new MCPProductionAutomation();
            this.orchestrationResults.automation_results = await mcpAutomation.runAutomation();
            this.orchestrationResults.execution_summary.analyzers_run.push('mcp-production-automation');
            
            console.log('✅ MCP Automation completed');
            console.log(`    🤖 MCP servers available: ${Object.values(this.orchestrationResults.automation_results.mcp_servers).filter(s => s.status === 'available').length}`);
            console.log(`    🔧 Optimizations applied: ${this.orchestrationResults.automation_results.optimizations_applied.length}`);
            
        } catch (error) {
            console.error('❌ MCP Automation failed:', error.message);
            // Continue with orchestration even if automation fails
            this.orchestrationResults.automation_results = { error: error.message };
        }
    }

    async combineAndAnalyzeResults() {
        console.log('\n🔄 Combining and Analyzing Results...');
        
        await this.calculateCombinedMetrics();
        await this.identifyCommonIssues();
        await this.prioritizeRecommendations();
        await this.generateUnifiedInsights();
        
        console.log('✅ Results analysis completed');
    }

    async calculateCombinedMetrics() {
        console.log('  📊 Calculating combined metrics...');
        
        const metrics = this.orchestrationResults.combined_metrics;
        
        // Combine readiness scores
        if (this.orchestrationResults.analysis_results?.metrics) {
            metrics.readiness_score = this.orchestrationResults.analysis_results.metrics.overall_readiness_score;
            metrics.performance_score = this.orchestrationResults.analysis_results.metrics.performance_score;
            metrics.total_issues = this.orchestrationResults.analysis_results.metrics.total_issues_found;
            metrics.critical_issues = this.orchestrationResults.analysis_results.metrics.critical_issues;
        }
        
        // Add automation metrics
        if (this.orchestrationResults.automation_results?.performance_metrics) {
            metrics.memory_usage_mb = this.orchestrationResults.automation_results.performance_metrics.memory_usage?.heap_used_mb || 0;
            metrics.mcp_servers_count = Object.values(this.orchestrationResults.automation_results.mcp_servers || {}).filter(s => s.status === 'available').length;
            metrics.optimizations_applied = this.orchestrationResults.automation_results.optimizations_applied?.length || 0;
        }
        
        // Calculate composite score
        const readinessWeight = 0.6;
        const automationWeight = 0.4;
        const baseScore = metrics.readiness_score || 50;
        const automationBonus = Math.min(20, metrics.optimizations_applied * 2);
        
        metrics.composite_production_score = Math.min(100, Math.round(
            (baseScore * readinessWeight) + 
            (automationBonus * automationWeight)
        ));
        
        console.log(`    📊 Composite production score: ${metrics.composite_production_score}%`);
    }

    async identifyCommonIssues() {
        console.log('  🔍 Identifying common issues across analyzers...');
        
        const commonIssues = [];
        const analysisIssues = this.getAllIssuesFromAnalysis();
        const automationIssues = this.getAllIssuesFromAutomation();
        
        // Find overlapping concerns
        const securityIssues = [...analysisIssues, ...automationIssues].filter(issue => 
            issue.toLowerCase().includes('security') || 
            issue.toLowerCase().includes('vulnerability') ||
            issue.toLowerCase().includes('audit')
        );
        
        const deploymentIssues = [...analysisIssues, ...automationIssues].filter(issue => 
            issue.toLowerCase().includes('deploy') || 
            issue.toLowerCase().includes('docker') ||
            issue.toLowerCase().includes('production')
        );
        
        const configurationIssues = [...analysisIssues, ...automationIssues].filter(issue => 
            issue.toLowerCase().includes('config') || 
            issue.toLowerCase().includes('environment') ||
            issue.toLowerCase().includes('variable')
        );
        
        if (securityIssues.length > 0) {
            commonIssues.push({ category: 'Security', count: securityIssues.length, priority: 'critical' });
        }
        
        if (deploymentIssues.length > 0) {
            commonIssues.push({ category: 'Deployment', count: deploymentIssues.length, priority: 'high' });
        }
        
        if (configurationIssues.length > 0) {
            commonIssues.push({ category: 'Configuration', count: configurationIssues.length, priority: 'medium' });
        }
        
        this.orchestrationResults.combined_metrics.common_issues = commonIssues;
        console.log(`    🔍 Common issues identified: ${commonIssues.length} categories`);
    }

    async prioritizeRecommendations() {
        console.log('  🎯 Prioritizing recommendations...');
        
        const allRecommendations = [];
        
        // Collect from analysis results
        if (this.orchestrationResults.analysis_results?.roadmap) {
            allRecommendations.push(...this.orchestrationResults.analysis_results.roadmap.immediate_actions.map(action => ({
                source: 'analysis',
                priority: 'critical',
                action
            })));
            
            allRecommendations.push(...this.orchestrationResults.analysis_results.roadmap.short_term_goals.map(goal => ({
                source: 'analysis',
                priority: 'high',
                action: goal
            })));
        }
        
        // Collect from automation results
        if (this.orchestrationResults.automation_results?.recommendations) {
            allRecommendations.push(...this.orchestrationResults.automation_results.recommendations.immediate.map(rec => ({
                source: 'automation',
                priority: 'critical',
                action: rec
            })));
            
            allRecommendations.push(...this.orchestrationResults.automation_results.recommendations.short_term.map(rec => ({
                source: 'automation',
                priority: 'high',
                action: rec
            })));
        }
        
        // Prioritize and deduplicate
        const criticalActions = allRecommendations.filter(r => r.priority === 'critical');
        const highPriorityActions = allRecommendations.filter(r => r.priority === 'high');
        const mediumPriorityActions = allRecommendations.filter(r => r.priority === 'medium');
        
        this.orchestrationResults.unified_roadmap = {
            critical_actions: this.deduplicateActions(criticalActions),
            optimization_opportunities: this.deduplicateActions(highPriorityActions),
            strategic_improvements: this.deduplicateActions(mediumPriorityActions)
        };
        
        console.log(`    🎯 Recommendations prioritized: ${criticalActions.length} critical, ${highPriorityActions.length} high priority`);
    }

    async generateUnifiedInsights() {
        console.log('  💡 Generating unified insights...');
        
        const insights = [];
        const metrics = this.orchestrationResults.combined_metrics;
        
        // Production readiness insights
        if (metrics.composite_production_score >= 90) {
            insights.push('🎉 System is highly production-ready with minimal issues');
        } else if (metrics.composite_production_score >= 70) {
            insights.push('⚠️  System needs minor improvements for optimal production readiness');
        } else if (metrics.composite_production_score >= 50) {
            insights.push('🔧 System requires significant improvements before production deployment');
        } else {
            insights.push('❌ System is not ready for production - critical issues must be addressed');
        }
        
        // MCP integration insights
        if (metrics.mcp_servers_count >= 5) {
            insights.push('🤖 Strong MCP integration provides comprehensive automation capabilities');
        } else if (metrics.mcp_servers_count >= 3) {
            insights.push('🔧 MCP integration is functional but could be expanded for enhanced automation');
        } else {
            insights.push('⚠️  Limited MCP integration - consider activating more MCP servers');
        }
        
        // Optimization insights
        if (metrics.optimizations_applied >= 10) {
            insights.push('✅ Excellent automation - system is self-optimizing');
        } else if (metrics.optimizations_applied >= 5) {
            insights.push('🔧 Good automation coverage with room for enhancement');
        } else {
            insights.push('📈 Significant opportunity for automated optimizations');
        }
        
        this.orchestrationResults.unified_insights = insights;
        console.log(`    💡 Generated ${insights.length} unified insights`);
    }

    async generateUnifiedReports() {
        console.log('\n📊 Generating Unified Reports...');
        
        await this.generateExecutiveSummary();
        await this.generateDetailedReport();
        await this.generateActionPlanDocument();
        
        this.orchestrationResults.execution_summary.reports_generated = [
            'PRODUCTION_READINESS_EXECUTIVE_SUMMARY.md',
            'COMPREHENSIVE_PRODUCTION_ANALYSIS.md',
            'PRODUCTION_ACTION_PLAN.md',
            'production-orchestration-results.json'
        ];
        
        console.log('✅ All reports generated successfully');
    }

    async generateExecutiveSummary() {
        console.log('  📋 Generating executive summary...');
        
        const summary = this.createExecutiveSummary();
        await fs.writeFile(
            path.join(this.projectRoot, 'PRODUCTION_READINESS_EXECUTIVE_SUMMARY.md'),
            summary
        );
    }

    async generateDetailedReport() {
        console.log('  📊 Generating detailed comprehensive report...');
        
        const report = this.createComprehensiveReport();
        await fs.writeFile(
            path.join(this.projectRoot, 'COMPREHENSIVE_PRODUCTION_ANALYSIS.md'),
            report
        );
    }

    async generateActionPlanDocument() {
        console.log('  🎯 Generating action plan...');
        
        const actionPlan = this.createActionPlan();
        await fs.writeFile(
            path.join(this.projectRoot, 'PRODUCTION_ACTION_PLAN.md'),
            actionPlan
        );
        
        // Also save JSON results
        await fs.writeFile(
            path.join(this.projectRoot, 'production-orchestration-results.json'),
            JSON.stringify(this.orchestrationResults, null, 2)
        );
    }

    async generateActionPlan() {
        console.log('\n🎯 Generating Actionable Next Steps...');
        
        await this.createTimedActionPlan();
        await this.generateAutomationSchedule();
        await this.createMonitoringPlan();
        
        console.log('✅ Action plan generated');
    }

    async createTimedActionPlan() {
        console.log('  📅 Creating timed action plan...');
        
        const roadmap = this.orchestrationResults.unified_roadmap;
        const timedPlan = {
            immediate_24h: roadmap.critical_actions.slice(0, 3),
            this_week: roadmap.critical_actions.slice(3).concat(roadmap.optimization_opportunities.slice(0, 5)),
            this_month: roadmap.optimization_opportunities.slice(5).concat(roadmap.strategic_improvements.slice(0, 3)),
            next_quarter: roadmap.strategic_improvements.slice(3)
        };
        
        this.orchestrationResults.timed_action_plan = timedPlan;
    }

    async generateAutomationSchedule() {
        console.log('  🤖 Generating automation schedule...');
        
        const automationSchedule = {
            daily: ['Health checks', 'Security scans', 'Performance monitoring'],
            weekly: ['Full production analysis', 'Dependency updates', 'Code quality review'],
            monthly: ['Comprehensive audit', 'MCP server optimization', 'Infrastructure review'],
            quarterly: ['Strategic roadmap review', 'Technology stack evaluation', 'Performance benchmarking']
        };
        
        this.orchestrationResults.automation_schedule = automationSchedule;
    }

    async createMonitoringPlan() {
        console.log('  📊 Creating monitoring plan...');
        
        const monitoringPlan = {
            metrics_to_track: [
                'Production readiness score',
                'Security vulnerability count',
                'Performance metrics',
                'MCP server health',
                'Deployment success rate'
            ],
            alert_thresholds: {
                production_score_below: 70,
                critical_vulnerabilities: 1,
                memory_usage_above_mb: 512,
                failed_deployments: 2
            },
            review_frequency: 'weekly'
        };
        
        this.orchestrationResults.monitoring_plan = monitoringPlan;
    }

    createExecutiveSummary() {
        const { orchestrationResults } = this;
        const metrics = orchestrationResults.combined_metrics;

        return `# 🎯 Production Readiness Executive Summary

**Generated**: ${orchestrationResults.timestamp}  
**Analysis Duration**: ${orchestrationResults.execution_summary.total_execution_time}ms  
**Project**: EchoTune AI - Music Discovery Platform

## 📊 Key Performance Indicators

| Metric | Score | Status |
|--------|--------|--------|
| **Composite Production Score** | ${metrics.composite_production_score || 0}% | ${this.getStatusEmoji(metrics.composite_production_score)} |
| **System Readiness** | ${metrics.readiness_score || 0}% | ${this.getStatusEmoji(metrics.readiness_score)} |
| **MCP Integration** | ${metrics.mcp_servers_count || 0} servers | ${metrics.mcp_servers_count >= 5 ? '✅' : '⚠️'} |
| **Optimizations Applied** | ${metrics.optimizations_applied || 0} | ${metrics.optimizations_applied >= 5 ? '✅' : '🔧'} |

## 🎯 Executive Insights

${orchestrationResults.unified_insights?.map(insight => `- ${insight}`).join('\n') || 'Insights not available'}

## 🚨 Critical Actions Required

${orchestrationResults.unified_roadmap.critical_actions.length > 0 ? 
  orchestrationResults.unified_roadmap.critical_actions.slice(0, 5).map((action, i) => `${i + 1}. ${action.action}`).join('\n') : 
  '✅ No critical actions required'}

## 📋 Strategic Recommendations

### Immediate (Next 24 Hours)
${orchestrationResults.timed_action_plan?.immediate_24h?.map((action, i) => `${i + 1}. ${action.action}`).join('\n') || 'No immediate actions'}

### This Week
${orchestrationResults.timed_action_plan?.this_week?.slice(0, 3).map((action, i) => `${i + 1}. ${action.action}`).join('\n') || 'No weekly actions'}

### This Month
${orchestrationResults.timed_action_plan?.this_month?.slice(0, 2).map((action, i) => `${i + 1}. ${action.action}`).join('\n') || 'No monthly actions'}

## 🎚️ Production Readiness Decision

${this.getProductionDecision(metrics.composite_production_score)}

## 📞 Quick Actions

\`\`\`bash
# Re-run comprehensive analysis
node scripts/production-readiness-orchestrator.js

# Quick health check
npm run validate:comprehensive

# Fix critical issues
npm run production-fixes
\`\`\`

---

*For detailed analysis, see: COMPREHENSIVE_PRODUCTION_ANALYSIS.md*  
*For action plan, see: PRODUCTION_ACTION_PLAN.md*`;
    }

    createComprehensiveReport() {
        return `# 📊 Comprehensive Production Readiness Analysis

**Generated**: ${this.orchestrationResults.timestamp}  
**Orchestrator Version**: ${this.orchestrationResults.orchestrator_version}  
**Total Execution Time**: ${this.orchestrationResults.execution_summary.total_execution_time}ms

## 🎯 Analysis Overview

This comprehensive analysis combines multiple validation systems to provide complete production readiness assessment:

- **Production Readiness Analyzer**: Core system validation and issue identification
- **MCP-Powered Automation**: Advanced automation and optimization using Model Context Protocol servers
- **Unified Orchestration**: Combined insights and prioritized recommendations

## 📊 Combined Metrics

${JSON.stringify(this.orchestrationResults.combined_metrics, null, 2)}

## 🔍 Analysis Results Detail

### Production Readiness Analysis
${this.orchestrationResults.analysis_results ? 
  `**Status**: ${this.orchestrationResults.analysis_results.overall_status}
**Categories Analyzed**: ${Object.keys(this.orchestrationResults.analysis_results.categories || {}).length}
**Overall Score**: ${this.orchestrationResults.analysis_results.metrics?.overall_readiness_score || 0}%` :
  'Analysis not completed'}

### MCP Automation Results
${this.orchestrationResults.automation_results ? 
  `**MCP Servers Available**: ${Object.values(this.orchestrationResults.automation_results.mcp_servers || {}).filter(s => s.status === 'available').length}
**Optimizations Applied**: ${this.orchestrationResults.automation_results.optimizations_applied?.length || 0}
**Validation Results**: ${Object.keys(this.orchestrationResults.automation_results.validation_results || {}).length} categories` :
  'Automation not completed'}

## 🗺️ Unified Roadmap

### 🚨 Critical Actions
${this.orchestrationResults.unified_roadmap.critical_actions.map((action, i) => `${i + 1}. ${action.action} (${action.source})`).join('\n')}

### 🎯 Optimization Opportunities
${this.orchestrationResults.unified_roadmap.optimization_opportunities.map((action, i) => `${i + 1}. ${action.action} (${action.source})`).join('\n')}

### 📈 Strategic Improvements
${this.orchestrationResults.unified_roadmap.strategic_improvements.map((action, i) => `${i + 1}. ${action.action} (${action.source})`).join('\n')}

## 🔄 Continuous Monitoring

### Automation Schedule
${Object.entries(this.orchestrationResults.automation_schedule || {}).map(([frequency, tasks]) => 
  `**${frequency.toUpperCase()}**:\n${tasks.map(task => `- ${task}`).join('\n')}`
).join('\n\n')}

### Monitoring Plan
${JSON.stringify(this.orchestrationResults.monitoring_plan, null, 2)}

## 📊 Detailed Results

For complete details, refer to individual analyzer reports:
- **PRODUCTION_READINESS_ANALYSIS.md** - Complete production analysis
- **MCP_PRODUCTION_AUTOMATION_REPORT.md** - MCP automation details
- **production-orchestration-results.json** - Machine-readable results

---

**Generated by Production Readiness Orchestrator v${this.orchestrationResults.orchestrator_version}**`;
    }

    createActionPlan() {
        return `# 🎯 Production Action Plan

**Generated**: ${this.orchestrationResults.timestamp}  
**Project**: EchoTune AI Production Deployment

## 🎚️ Production Readiness Status

**Current Score**: ${this.orchestrationResults.combined_metrics.composite_production_score || 0}%  
**Recommendation**: ${this.getProductionDecision(this.orchestrationResults.combined_metrics.composite_production_score)}

## ⏰ Timed Action Plan

### 🚨 Immediate Actions (Next 24 Hours)
${this.orchestrationResults.timed_action_plan?.immediate_24h?.map((action, i) => 
  `${i + 1}. **${action.action}**
   - Source: ${action.source}
   - Priority: ${action.priority}
   - Estimated Time: 1-4 hours`
).join('\n') || 'No immediate actions required'}

### 📅 This Week
${this.orchestrationResults.timed_action_plan?.this_week?.map((action, i) => 
  `${i + 1}. **${action.action}**
   - Source: ${action.source}
   - Priority: ${action.priority}
   - Estimated Time: 2-8 hours`
).join('\n') || 'No weekly actions required'}

### 📆 This Month
${this.orchestrationResults.timed_action_plan?.this_month?.map((action, i) => 
  `${i + 1}. **${action.action}**
   - Source: ${action.source}
   - Priority: ${action.priority}
   - Estimated Time: 4-16 hours`
).join('\n') || 'No monthly actions required'}

### 📈 Next Quarter
${this.orchestrationResults.timed_action_plan?.next_quarter?.map((action, i) => 
  `${i + 1}. **${action.action}**
   - Source: ${action.source}
   - Priority: ${action.priority}
   - Estimated Time: 1-5 days`
).join('\n') || 'No quarterly actions required'}

## 🔧 Quick Fix Commands

### Security Issues
\`\`\`bash
# Fix security vulnerabilities
npm audit fix

# Update dependencies
npm update

# Security scan
npm run security:audit
\`\`\`

### Code Quality
\`\`\`bash
# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Run tests
npm test
\`\`\`

### Deployment Preparation
\`\`\`bash
# Build for production
npm run build

# Validate deployment
npm run validate:deployment

# Test production build
npm run preview
\`\`\`

## 🤖 Automation Setup

### Daily Automation
\`\`\`bash
# Add to crontab
0 6 * * * cd /path/to/project && node scripts/production-readiness-orchestrator.js --quick
\`\`\`

### Weekly Comprehensive Analysis
\`\`\`bash
# Add to crontab
0 2 * * 1 cd /path/to/project && node scripts/production-readiness-orchestrator.js --full
\`\`\`

## 📊 Monitoring Setup

### Key Metrics to Track
${this.orchestrationResults.monitoring_plan?.metrics_to_track?.map(metric => `- ${metric}`).join('\n') || 'No metrics defined'}

### Alert Thresholds
${Object.entries(this.orchestrationResults.monitoring_plan?.alert_thresholds || {}).map(([metric, threshold]) => 
  `- **${metric.replace(/_/g, ' ')}**: ${threshold}`
).join('\n')}

## 🏃‍♂️ Getting Started

### Step 1: Address Critical Issues
\`\`\`bash
# Run comprehensive analysis to identify critical issues
node scripts/production-readiness-orchestrator.js

# Follow the immediate actions in the generated report
\`\`\`

### Step 2: Set Up Automation
\`\`\`bash
# Install production monitoring
npm install --save-dev production-monitor

# Set up automated checks
npm run setup:production-monitoring
\`\`\`

### Step 3: Deploy to Staging
\`\`\`bash
# Deploy to staging environment
npm run deploy:staging

# Run production validation
npm run validate:staging
\`\`\`

### Step 4: Production Deployment
\`\`\`bash
# Final production readiness check
node scripts/production-readiness-orchestrator.js --production-check

# Deploy to production (only if score >= 80%)
npm run deploy:production
\`\`\`

---

**Next Review**: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toDateString()}  
**Contact**: Development Team for questions about this action plan`;
    }

    // Helper methods
    displayExecutionSummary() {
        const summary = this.orchestrationResults.execution_summary;
        const metrics = this.orchestrationResults.combined_metrics;
        
        console.log('\n📊 Execution Summary');
        console.log('-' .repeat(30));
        console.log(`⏱️  Total Time: ${summary.total_execution_time}ms`);
        console.log(`🔧 Analyzers Run: ${summary.analyzers_run.join(', ')}`);
        console.log(`📊 Composite Score: ${metrics.composite_production_score || 0}%`);
        console.log(`🎯 Status: ${summary.overall_success ? 'SUCCESS' : 'PARTIAL/FAILED'}`);
        console.log(`📋 Reports: ${summary.reports_generated.length} generated`);
        
        // Quick recommendations
        if (this.orchestrationResults.unified_roadmap.critical_actions.length > 0) {
            console.log(`\n🚨 Critical: ${this.orchestrationResults.unified_roadmap.critical_actions.length} actions require immediate attention`);
        }
        
        console.log('\n📄 Generated Reports:');
        summary.reports_generated.forEach(report => {
            console.log(`  📋 ${report}`);
        });
    }

    getAllIssuesFromAnalysis() {
        if (!this.orchestrationResults.analysis_results?.categories) return [];
        
        const issues = [];
        Object.values(this.orchestrationResults.analysis_results.categories).forEach(category => {
            issues.push(...(category.issues || []));
            issues.push(...(category.recommendations || []));
        });
        
        return issues;
    }

    getAllIssuesFromAutomation() {
        if (!this.orchestrationResults.automation_results?.recommendations) return [];
        
        const recommendations = this.orchestrationResults.automation_results.recommendations;
        return [
            ...(recommendations.immediate || []),
            ...(recommendations.short_term || []),
            ...(recommendations.long_term || [])
        ];
    }

    deduplicateActions(actions) {
        const seen = new Set();
        return actions.filter(action => {
            const key = action.action.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    getStatusEmoji(score) {
        if (!score) return '❓';
        if (score >= 90) return '🟢';
        if (score >= 70) return '🟡';
        if (score >= 50) return '🟠';
        return '🔴';
    }

    getProductionDecision(score) {
        if (!score) return '❓ **Analysis Incomplete** - Unable to determine production readiness';
        if (score >= 90) return '🟢 **APPROVED FOR PRODUCTION** - System is highly optimized and ready';
        if (score >= 80) return '🟡 **APPROVED WITH MINOR FIXES** - Address minor issues, then deploy';
        if (score >= 60) return '🟠 **NOT APPROVED** - Significant improvements required before production';
        return '🔴 **BLOCKED** - Critical issues must be resolved before considering production';
    }
}

// Export for use in other scripts
module.exports = ProductionReadinessOrchestrator;

// Run orchestration if called directly
if (require.main === module) {
    const orchestrator = new ProductionReadinessOrchestrator();
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const options = {
        quick: args.includes('--quick'),
        full: args.includes('--full'),
        productionCheck: args.includes('--production-check')
    };
    
    orchestrator.runComprehensiveAnalysis(options)
        .then((results) => {
            const exitCode = results.execution_summary.overall_success ? 0 : 1;
            process.exit(exitCode);
        })
        .catch((error) => {
            console.error('❌ Orchestration failed:', error);
            process.exit(1);
        });
}