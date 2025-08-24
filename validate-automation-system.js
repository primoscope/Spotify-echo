#!/usr/bin/env node

/**
 * Quick validation script for GitHub Coding Agent Automation Guide
 * Tests all core components and provides immediate feedback
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 GITHUB CODING AGENT AUTOMATION GUIDE VALIDATION');
console.log('==================================================');
console.log('Testing all components mentioned in the guide...\n');

let validationResults = {
    passed: 0,
    failed: 0,
    warnings: 0,
    details: []
};

function addResult(test, status, message, recommendation = null) {
    const result = { test, status, message, recommendation };
    validationResults.details.push(result);
    
    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} ${test}: ${message}`);
    
    if (recommendation) {
        console.log(`   💡 Recommendation: ${recommendation}`);
    }
    
    if (status === 'PASS') validationResults.passed++;
    else if (status === 'FAIL') validationResults.failed++;
    else validationResults.warnings++;
    
    console.log('');
}

// Test 1: Core Files Existence
console.log('📋 TESTING CORE FILES EXISTENCE');
console.log('--------------------------------');

const coreFiles = [
    'GitHubCodingAgentPerplexity.js',
    'autonomous-coding-orchestrator.js', 
    'AUTONOMOUS_DEVELOPMENT_ROADMAP.md',
    'ROADMAP.md',
    'CURSOR_CODING_INSTRUCTIONS_OPTIMIZED.md',
    '.env'
];

coreFiles.forEach(file => {
    if (fs.existsSync(file)) {
        addResult(`File: ${file}`, 'PASS', 'Found and accessible');
    } else {
        addResult(`File: ${file}`, 'FAIL', 'Missing required file', `Create ${file} according to guide`);
    }
});

// Test 2: Environment Configuration
console.log('🔧 TESTING ENVIRONMENT CONFIGURATION');
console.log('------------------------------------');

try {
    const envContent = fs.readFileSync('.env', 'utf8');
    
    // Check for Perplexity API key
    if (envContent.includes('PERPLEXITY_API_KEY=pplx-')) {
        addResult('Perplexity API Key', 'PASS', 'API key configured and appears valid');
    } else {
        addResult('Perplexity API Key', 'FAIL', 'API key missing or invalid format', 'Add PERPLEXITY_API_KEY to .env file');
    }
    
    // Check for other critical keys
    const criticalKeys = ['GITHUB_PAT', 'MONGODB_URI', 'GEMINI_API_KEY'];
    criticalKeys.forEach(key => {
        if (envContent.includes(`${key}=`) && !envContent.includes(`${key}=your-`)) {
            addResult(`Environment: ${key}`, 'PASS', 'Configured with real value');
        } else {
            addResult(`Environment: ${key}`, 'WARN', 'Not configured or using placeholder value');
        }
    });
    
} catch (error) {
    addResult('Environment File', 'FAIL', 'Cannot read .env file', 'Create .env file with required API keys');
}

// Test 3: Node.js Dependencies
console.log('📦 TESTING NODE.JS DEPENDENCIES');
console.log('-------------------------------');

try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (packageJson.dependencies) {
        addResult('Package Dependencies', 'PASS', `${Object.keys(packageJson.dependencies).length} dependencies found`);
    } else {
        addResult('Package Dependencies', 'WARN', 'No dependencies found in package.json');
    }
    
    // Try to require key modules
    try {
        require('https');
        addResult('Node.js HTTPS Module', 'PASS', 'Core HTTPS module available');
    } catch (error) {
        addResult('Node.js HTTPS Module', 'FAIL', 'HTTPS module not available');
    }
    
} catch (error) {
    addResult('Package.json', 'FAIL', 'Cannot read package.json', 'Ensure package.json exists and is valid');
}

// Test 4: Git Repository Status
console.log('📝 TESTING GIT REPOSITORY STATUS');
console.log('--------------------------------');

try {
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    
    addResult('Git Repository', 'PASS', `On branch: ${branch}`);
    
    if (gitStatus.trim()) {
        addResult('Git Working Tree', 'WARN', 'Uncommitted changes present', 'Consider committing changes before automation');
    } else {
        addResult('Git Working Tree', 'PASS', 'Working tree is clean');
    }
    
    // Check for automation-related files
    const automationFiles = fs.readdirSync('.').filter(f => 
        f.startsWith('perplexity-') || f.startsWith('automation-workflow-')
    );
    
    if (automationFiles.length > 0) {
        addResult('Automation Artifacts', 'PASS', `${automationFiles.length} automation files found`);
    } else {
        addResult('Automation Artifacts', 'WARN', 'No automation artifacts found', 'Run automation to generate analysis files');
    }
    
} catch (error) {
    addResult('Git Repository', 'FAIL', 'Not a git repository or git not available', 'Initialize git repository');
}

// Test 5: Perplexity Integration Test
console.log('🔬 TESTING PERPLEXITY INTEGRATION');
console.log('---------------------------------');

try {
    const GitHubCodingAgentPerplexity = require('./GitHubCodingAgentPerplexity');
    addResult('Perplexity Module Load', 'PASS', 'GitHubCodingAgentPerplexity module loaded successfully');
    
    // Try to instantiate (this will test API key)
    try {
        const automation = new GitHubCodingAgentPerplexity();
        addResult('Perplexity Instantiation', 'PASS', 'Perplexity automation instance created successfully');
        
        // Quick session stats test
        const stats = automation.getSessionStats();
        addResult('Perplexity Session Stats', 'PASS', 'Session statistics system operational');
        
    } catch (error) {
        addResult('Perplexity Instantiation', 'FAIL', error.message, 'Check API key configuration');
    }
    
} catch (error) {
    addResult('Perplexity Module Load', 'FAIL', 'Cannot load GitHubCodingAgentPerplexity module', 'Ensure file exists and is valid JavaScript');
}

// Test 6: Roadmap Analysis
console.log('📊 TESTING ROADMAP ANALYSIS');
console.log('---------------------------');

try {
    const roadmapContent = fs.readFileSync('AUTONOMOUS_DEVELOPMENT_ROADMAP.md', 'utf8');
    
    const completed = (roadmapContent.match(/✅|COMPLETED/gi) || []).length;
    const inProgress = (roadmapContent.match(/🔄|IN PROGRESS/gi) || []).length;
    const pending = (roadmapContent.match(/⏳|PENDING/gi) || []).length;
    const total = completed + inProgress + pending;
    
    if (total > 0) {
        const completionRate = Math.round((completed / total) * 100);
        addResult('Roadmap Analysis', 'PASS', `${total} tasks found, ${completionRate}% completion rate`);
    } else {
        addResult('Roadmap Analysis', 'WARN', 'No trackable tasks found in roadmap', 'Add tasks with status markers (✅, 🔄, ⏳)');
    }
    
} catch (error) {
    addResult('Roadmap Analysis', 'FAIL', 'Cannot analyze roadmap file', 'Ensure AUTONOMOUS_DEVELOPMENT_ROADMAP.md exists');
}

// Test 7: System Performance Check
console.log('⚡ TESTING SYSTEM PERFORMANCE');
console.log('-----------------------------');

const os = require('os');
const totalRAM = Math.round(os.totalmem() / 1024 / 1024 / 1024);
const freeRAM = Math.round(os.freemem() / 1024 / 1024 / 1024);
const cpuCores = os.cpus().length;

if (totalRAM >= 4) {
    addResult('System Memory', 'PASS', `${totalRAM}GB total, ${freeRAM}GB free`);
} else {
    addResult('System Memory', 'WARN', `${totalRAM}GB total - may be insufficient for heavy automation`, 'Consider upgrading RAM for optimal performance');
}

if (cpuCores >= 2) {
    addResult('CPU Cores', 'PASS', `${cpuCores} cores available`);
} else {
    addResult('CPU Cores', 'WARN', `${cpuCores} core(s) - may limit parallel processing`);
}

// Final Results Summary
console.log('🎯 VALIDATION RESULTS SUMMARY');
console.log('=============================');
console.log(`✅ Passed: ${validationResults.passed}`);
console.log(`❌ Failed: ${validationResults.failed}`);
console.log(`⚠️ Warnings: ${validationResults.warnings}`);
console.log(`📊 Total Tests: ${validationResults.details.length}`);

const overallScore = Math.round((validationResults.passed / validationResults.details.length) * 100);
console.log(`🏆 Overall Score: ${overallScore}%`);

let readinessStatus = 'NOT READY';
if (overallScore >= 90) readinessStatus = '✅ FULLY READY';
else if (overallScore >= 70) readinessStatus = '🟡 MOSTLY READY';
else if (overallScore >= 50) readinessStatus = '⚠️ PARTIALLY READY';
else readinessStatus = '❌ NOT READY';

console.log(`🚀 System Status: ${readinessStatus}`);
console.log('');

// Recommendations
const criticalFailures = validationResults.details.filter(r => r.status === 'FAIL');
if (criticalFailures.length > 0) {
    console.log('🔧 CRITICAL ISSUES TO RESOLVE:');
    console.log('------------------------------');
    criticalFailures.forEach((failure, i) => {
        console.log(`${i + 1}. ${failure.test}: ${failure.message}`);
        if (failure.recommendation) {
            console.log(`   💡 ${failure.recommendation}`);
        }
    });
    console.log('');
}

// Next Steps
console.log('📋 NEXT STEPS:');
console.log('--------------');
if (overallScore >= 70) {
    console.log('1. ✅ System is ready for automation cycles');
    console.log('2. 🚀 Run: node GitHubCodingAgentPerplexity.js');
    console.log('3. 🔄 Execute complete workflow: bash master-automation-cycle.sh');
    console.log('4. 📊 Monitor progress with dashboard scripts');
} else {
    console.log('1. 🔧 Resolve critical failures listed above');
    console.log('2. ⚙️ Configure missing environment variables');
    console.log('3. 📦 Install required dependencies');
    console.log('4. 🔄 Re-run this validation script');
}

console.log('');
console.log('📖 For detailed instructions, see: GITHUB_CODING_AGENT_AUTOMATION_GUIDE.md');
console.log('🎉 Validation complete!');

// Exit with appropriate code
process.exit(validationResults.failed > 0 ? 1 : 0);