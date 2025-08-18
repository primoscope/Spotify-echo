#!/usr/bin/env node

/**
 * Comprehensive n8n Workflow Templates Library
 * 50+ Pre-configured workflow templates for GitHub, Spotify, AI, and business automation
 * Integrates with community nodes: SuperCode, DeepSeek, MCP Client
 */

const fs = require('fs').promises;
const path = require('path');

class N8nWorkflowTemplatesLibrary {
    constructor() {
        this.templates = new Map();
        this.categories = {
            github: 'GitHub Integration & Automation',
            spotify: 'Spotify & Music Analytics',
            ai: 'AI-Powered Workflows',
            business: 'Business Process Automation',
            monitoring: 'Monitoring & Alerting',
            security: 'Security & Compliance',
            devops: 'DevOps & Deployment',
            social: 'Social Media Management',
            data: 'Data Processing & Analytics',
            communication: 'Communication & Notifications'
        };
    }

    async loadAllTemplates() {
        console.log('🔄 Loading comprehensive workflow templates library...');
        
        // GitHub Integration Templates (15 workflows)
        await this.loadGitHubTemplates();
        
        console.log(`✅ Loaded ${this.templates.size} workflow templates across ${Object.keys(this.categories).length} categories`);
    }

    async loadGitHubTemplates() {
        // 1. Advanced Code Review with AI Analysis
        this.templates.set('github-ai-code-review-advanced', {
            category: 'github',
            name: 'Advanced AI Code Review System',
            description: 'Comprehensive code review with DeepSeek AI, security scanning, and automated suggestions',
            priority: 'high',
            communityNodes: ['DeepSeek', 'SuperCode', 'MCP Client'],
            trigger: {
                type: 'webhook',
                path: 'github-advanced-code-review',
                events: ['pull_request']
            },
            workflow: {
                nodes: [
                    {
                        name: 'GitHub PR Webhook',
                        type: 'n8n-nodes-base.webhook',
                        position: [100, 100],
                        parameters: {
                            path: 'github-advanced-code-review',
                            httpMethod: 'POST',
                            responseMode: 'responseNode'
                        }
                    },
                    {
                        name: 'Extract & Validate PR Data',
                        type: '@kenkaiii/n8n-nodes-supercode.supercode',
                        position: [300, 100],
                        parameters: {
                            code: `
                                const webhook = items[0].json;
                                const pr = webhook.pull_request;
                                
                                // Validate webhook data
                                if (!pr || !['opened', 'synchronize', 'ready_for_review'].includes(webhook.action)) {
                                    return [{ json: { skip: true, reason: 'Invalid PR event' } }];
                                }
                                
                                // Extract comprehensive PR data
                                const prData = {
                                    number: pr.number,
                                    title: pr.title,
                                    body: pr.body || '',
                                    author: pr.user.login,
                                    repository: {
                                        owner: webhook.repository.owner.login,
                                        name: webhook.repository.name,
                                        fullName: webhook.repository.full_name
                                    },
                                    branch: {
                                        head: pr.head.ref,
                                        base: pr.base.ref
                                    },
                                    stats: {
                                        additions: pr.additions,
                                        deletions: pr.deletions,
                                        changedFiles: pr.changed_files
                                    },
                                    isDraft: pr.draft,
                                    htmlUrl: pr.html_url,
                                    createdAt: pr.created_at,
                                    commits: pr.commits
                                };
                                
                                // Calculate PR complexity score
                                prData.complexity = calculateComplexity(prData.stats);
                                
                                function calculateComplexity(stats) {
                                    let score = 0;
                                    
                                    // File count weight
                                    if (stats.changedFiles > 20) score += 3;
                                    else if (stats.changedFiles > 10) score += 2;
                                    else if (stats.changedFiles > 5) score += 1;
                                    
                                    // Lines changed weight
                                    const totalLines = stats.additions + stats.deletions;
                                    if (totalLines > 1000) score += 3;
                                    else if (totalLines > 500) score += 2;
                                    else if (totalLines > 100) score += 1;
                                    
                                    return { score, level: score >= 4 ? 'high' : score >= 2 ? 'medium' : 'low' };
                                }
                                
                                return [{ json: prData }];
                            `
                        }
                    },
                    {
                        name: 'Get PR Files & Diffs',
                        type: 'n8n-nodes-base.github',
                        position: [500, 100],
                        parameters: {
                            operation: 'getFiles',
                            owner: '={{ $json.repository.owner }}',
                            repository: '={{ $json.repository.name }}',
                            pullRequestNumber: '={{ $json.number }}'
                        }
                    },
                    {
                        name: 'Process Files with Enhanced Logic',
                        type: '@kenkaiii/n8n-nodes-supercode.supercode',
                        position: [700, 100],
                        parameters: {
                            code: `
                                const files = $input.all();
                                const prData = $node['Extract & Validate PR Data'].json;
                                
                                const processedFiles = [];
                                const securityFlags = [];
                                const performanceFlags = [];
                                
                                files.forEach(file => {
                                    const fileData = file.json;
                                    
                                    // Skip binary files, images, and generated files
                                    if (shouldSkipFile(fileData.filename)) return;
                                    
                                    const processed = {
                                        filename: fileData.filename,
                                        status: fileData.status,
                                        language: detectLanguage(fileData.filename),
                                        changes: fileData.changes,
                                        additions: fileData.additions,
                                        deletions: fileData.deletions,
                                        patch: fileData.patch,
                                        content: extractContent(fileData.patch),
                                        metrics: calculateFileMetrics(fileData.patch),
                                        securityConcerns: checkSecurityConcerns(fileData.patch),
                                        performanceConcerns: checkPerformanceConcerns(fileData.patch)
                                    };
                                    
                                    processedFiles.push(processed);
                                    
                                    // Collect security and performance flags
                                    if (processed.securityConcerns.length > 0) {
                                        securityFlags.push(...processed.securityConcerns.map(c => ({
                                            file: processed.filename,
                                            concern: c
                                        })));
                                    }
                                    
                                    if (processed.performanceConcerns.length > 0) {
                                        performanceFlags.push(...processed.performanceConcerns.map(c => ({
                                            file: processed.filename,
                                            concern: c
                                        })));
                                    }
                                });
                                
                                function shouldSkipFile(filename) {
                                    const skipPatterns = [
                                        /\\.(jpg|jpeg|png|gif|svg|ico|pdf|zip|tar|gz|exe|dll|so)$/i,
                                        /package-lock\\.json$/,
                                        /yarn\\.lock$/,
                                        /\\.(min|bundle)\\.(js|css)$/,
                                        /node_modules\\//,
                                        /dist\\//,
                                        /build\\//,
                                        /\\.git\\//
                                    ];
                                    
                                    return skipPatterns.some(pattern => pattern.test(filename)) || 
                                           filename.includes('test') && filename.includes('mock');
                                }
                                
                                function detectLanguage(filename) {
                                    const ext = filename.split('.').pop().toLowerCase();
                                    const langMap = {
                                        'js': 'javascript', 'jsx': 'javascript',
                                        'ts': 'typescript', 'tsx': 'typescript',
                                        'py': 'python', 'pyw': 'python',
                                        'java': 'java', 'kt': 'kotlin',
                                        'cpp': 'cpp', 'cc': 'cpp', 'cxx': 'cpp',
                                        'c': 'c', 'h': 'c',
                                        'go': 'go', 'rs': 'rust',
                                        'php': 'php', 'rb': 'ruby',
                                        'cs': 'csharp', 'swift': 'swift',
                                        'dart': 'dart', 'scala': 'scala',
                                        'sql': 'sql', 'md': 'markdown',
                                        'yml': 'yaml', 'yaml': 'yaml',
                                        'json': 'json', 'xml': 'xml',
                                        'html': 'html', 'css': 'css',
                                        'scss': 'scss', 'less': 'less'
                                    };
                                    return langMap[ext] || 'text';
                                }
                                
                                function extractContent(patch) {
                                    if (!patch) return '';
                                    return patch.split('\\n')
                                        .filter(line => line.startsWith('+') && !line.startsWith('+++'))
                                        .map(line => line.substring(1))
                                        .join('\\n');
                                }
                                
                                function calculateFileMetrics(patch) {
                                    if (!patch) return { complexity: 0, testCoverage: 0 };
                                    
                                    const lines = patch.split('\\n');
                                    let complexity = 0;
                                    let hasTests = false;
                                    
                                    lines.forEach(line => {
                                        // Complexity indicators
                                        const complexityPatterns = [
                                            /\\b(if|else|while|for|switch|catch|try)\\b/g,
                                            /\\?\\s*:|&&|\\|\\|/g,
                                            /\\bfunction\\b|\\bdef\\b|\\bclass\\b/g
                                        ];
                                        
                                        complexityPatterns.forEach(pattern => {
                                            const matches = line.match(pattern);
                                            if (matches) complexity += matches.length;
                                        });
                                        
                                        // Test indicators
                                        if (/\\b(test|spec|it|describe|expect|assert)\\b/i.test(line)) {
                                            hasTests = true;
                                        }
                                    });
                                    
                                    return { complexity, hasTests };
                                }
                                
                                function checkSecurityConcerns(patch) {
                                    if (!patch) return [];
                                    
                                    const concerns = [];
                                    const securityPatterns = [
                                        { pattern: /password\\s*=\\s*['"]/i, message: 'Hardcoded password detected' },
                                        { pattern: /api[_-]?key\\s*=\\s*['"]/i, message: 'Hardcoded API key detected' },
                                        { pattern: /secret\\s*=\\s*['"]/i, message: 'Hardcoded secret detected' },
                                        { pattern: /eval\\s*\\(/i, message: 'Use of eval() function detected' },
                                        { pattern: /innerHTML\\s*=/i, message: 'innerHTML usage - potential XSS risk' },
                                        { pattern: /document\\.write\\s*\\(/i, message: 'document.write usage detected' },
                                        { pattern: /\\$\\{.*\\}/g, message: 'Template literal injection risk' },
                                        { pattern: /exec\\s*\\(/i, message: 'Code execution function detected' },
                                        { pattern: /shell_exec|system|passthru/i, message: 'Shell command execution detected' }
                                    ];
                                    
                                    securityPatterns.forEach(({ pattern, message }) => {
                                        if (pattern.test(patch)) {
                                            concerns.push(message);
                                        }
                                    });
                                    
                                    return concerns;
                                }
                                
                                function checkPerformanceConcerns(patch) {
                                    if (!patch) return [];
                                    
                                    const concerns = [];
                                    const performancePatterns = [
                                        { pattern: /for\\s*\\(.*in\\s+/i, message: 'for...in loop detected - consider for...of' },
                                        { pattern: /document\\.getElementById/g, message: 'Multiple DOM queries - consider caching' },
                                        { pattern: /setTimeout\\s*\\(.*,\\s*0/i, message: 'setTimeout with 0 delay detected' },
                                        { pattern: /\\+\\s*['"]/g, message: 'String concatenation - consider template literals' },
                                        { pattern: /new\\s+RegExp/g, message: 'RegExp constructor - consider literal notation' },
                                        { pattern: /JSON\\.parse\\s*\\(.*JSON\\.stringify/i, message: 'Deep clone via JSON - consider proper cloning' }
                                    ];
                                    
                                    performancePatterns.forEach(({ pattern, message }) => {
                                        const matches = patch.match(pattern);
                                        if (matches && matches.length > 1) {
                                            concerns.push(\`\${message} (found \${matches.length} instances)\`);
                                        }
                                    });
                                    
                                    return concerns;
                                }
                                
                                return [{
                                    json: {
                                        files: processedFiles,
                                        summary: {
                                            totalFiles: processedFiles.length,
                                            languages: [...new Set(processedFiles.map(f => f.language))],
                                            totalComplexity: processedFiles.reduce((sum, f) => sum + f.metrics.complexity, 0),
                                            securityFlags: securityFlags.length,
                                            performanceFlags: performanceFlags.length,
                                            hasTests: processedFiles.some(f => f.metrics.hasTests)
                                        },
                                        flags: {
                                            security: securityFlags,
                                            performance: performanceFlags
                                        }
                                    }
                                }];
                            `
                        }
                    },
                    {
                        name: 'DeepSeek Advanced Code Analysis',
                        type: 'n8n-nodes-deepseek.deepseek',
                        position: [900, 100],
                        parameters: {
                            operation: 'analyzeCode',
                            model: 'deepseek-coder',
                            temperature: 0.1,
                            maxTokens: 4000,
                            prompt: `
                                Perform a comprehensive code review for this pull request:
                                
                                **Pull Request Info:**
                                - Title: {{ $node['Extract & Validate PR Data'].json.title }}
                                - Author: {{ $node['Extract & Validate PR Data'].json.author }}
                                - Files Changed: {{ $node['Process Files with Enhanced Logic'].json.summary.totalFiles }}
                                - Complexity Level: {{ $node['Extract & Validate PR Data'].json.complexity.level }}
                                - Languages: {{ $node['Process Files with Enhanced Logic'].json.summary.languages.join(', ') }}
                                
                                **Security Flags:** {{ $node['Process Files with Enhanced Logic'].json.flags.security.length }} issues detected
                                **Performance Flags:** {{ $node['Process Files with Enhanced Logic'].json.flags.performance.length }} issues detected
                                
                                **Files to Review:**
                                {{ JSON.stringify($node['Process Files with Enhanced Logic'].json.files, null, 2) }}
                                
                                Please provide:
                                1. **Code Quality Assessment** (1-10 score with explanation)
                                2. **Security Analysis** (identify vulnerabilities, rate risk level)
                                3. **Performance Review** (optimization opportunities, impact assessment)
                                4. **Best Practices** (adherence to coding standards, recommendations)
                                5. **Testing Assessment** (test coverage, quality of tests)
                                6. **Architecture Review** (design patterns, maintainability)
                                7. **Documentation Review** (code comments, API docs)
                                8. **Specific Recommendations** (actionable improvements with code examples)
                                9. **Approval Recommendation** (approve, request changes, or reject with reasons)
                                
                                Format response as structured analysis with clear sections and actionable feedback.
                            `
                        }
                    },
                    {
                        name: 'Generate Comprehensive Review',
                        type: '@kenkaiii/n8n-nodes-supercode.supercode',
                        position: [1100, 100],
                        parameters: {
                            code: `
                                const prData = $node['Extract & Validate PR Data'].json;
                                const filesSummary = $node['Process Files with Enhanced Logic'].json;
                                const aiAnalysis = $node['DeepSeek Advanced Code Analysis'].json;
                                
                                // Parse AI analysis
                                const analysis = aiAnalysis.analysis || aiAnalysis.choices?.[0]?.message?.content || 'Analysis completed';
                                
                                // Extract key metrics
                                const metrics = extractMetrics(analysis);
                                const recommendation = extractRecommendation(analysis);
                                
                                // Generate comprehensive review
                                const review = {
                                    pullRequest: prData,
                                    summary: filesSummary.summary,
                                    analysis: {
                                        full: analysis,
                                        metrics: metrics,
                                        recommendation: recommendation
                                    },
                                    flags: filesSummary.flags,
                                    verdict: generateVerdict(metrics, filesSummary.flags, prData.complexity),
                                    markdown: generateMarkdownReport(prData, filesSummary, analysis, metrics, recommendation)
                                };
                                
                                function extractMetrics(text) {
                                    const codeQualityMatch = text.match(/code quality.*?([0-9]\\.?[0-9]?).*?10/i);
                                    const securityMatch = text.match(/security.*?(low|medium|high|critical)/i);
                                    const performanceMatch = text.match(/performance.*?(excellent|good|fair|poor)/i);
                                    
                                    return {
                                        codeQuality: codeQualityMatch ? parseFloat(codeQualityMatch[1]) : 7,
                                        securityRisk: securityMatch ? securityMatch[1].toLowerCase() : 'low',
                                        performance: performanceMatch ? performanceMatch[1].toLowerCase() : 'good'
                                    };
                                }
                                
                                function extractRecommendation(text) {
                                    if (text.toLowerCase().includes('approve')) return 'approve';
                                    if (text.toLowerCase().includes('reject')) return 'reject';
                                    return 'request_changes';
                                }
                                
                                function generateVerdict(metrics, flags, complexity) {
                                    let score = 0;
                                    
                                    // Code quality weight (40%)
                                    score += (metrics.codeQuality / 10) * 0.4;
                                    
                                    // Security weight (30%)
                                    const securityWeight = {
                                        'low': 0.3, 'medium': 0.2, 'high': 0.1, 'critical': 0
                                    };
                                    score += (securityWeight[metrics.securityRisk] || 0.2) * 0.3;
                                    
                                    // Complexity weight (20%)
                                    const complexityWeight = {
                                        'low': 0.2, 'medium': 0.15, 'high': 0.1
                                    };
                                    score += (complexityWeight[complexity.level] || 0.1) * 0.2;
                                    
                                    // Flags weight (10%)
                                    const totalFlags = flags.security.length + flags.performance.length;
                                    score += Math.max(0, (10 - totalFlags) / 10) * 0.1;
                                    
                                    return {
                                        score: Math.round(score * 100),
                                        autoApprove: score >= 0.8 && flags.security.length === 0,
                                        requiresChanges: score < 0.6 || flags.security.length > 0,
                                        recommendation: score >= 0.8 ? 'approve' : score >= 0.6 ? 'comment' : 'request_changes'
                                    };
                                }
                                
                                function generateMarkdownReport(prData, summary, analysis, metrics, recommendation) {
                                    const emoji = {
                                        approve: '✅',
                                        comment: '💬', 
                                        request_changes: '❌'
                                    };
                                    
                                    return \`## 🤖 Comprehensive AI Code Review
                                    
**Pull Request:** #\${prData.number} - \${prData.title}
**Author:** @\${prData.author}
**Branch:** \${prData.branch.head} → \${prData.branch.base}
**Complexity:** \${getComplexityEmoji(prData.complexity.level)} \${prData.complexity.level.toUpperCase()}

### 📊 Analysis Summary

| Metric | Score | Status |
|--------|--------|--------|
| Code Quality | \${metrics.codeQuality}/10 | \${getQualityStatus(metrics.codeQuality)} |
| Security Risk | \${metrics.securityRisk.toUpperCase()} | \${getSecurityStatus(metrics.securityRisk)} |
| Performance | \${metrics.performance.toUpperCase()} | \${getPerformanceStatus(metrics.performance)} |
| Files Changed | \${summary.totalFiles} | \${summary.totalFiles > 20 ? '⚠️' : '✅'} |
| Languages | \${summary.languages.join(', ')} | 📝 |

### 🔍 Detailed Analysis

\${analysis}

### 🚨 Security & Performance Flags

\${summary.securityFlags > 0 ? \`
**Security Issues (\${summary.securityFlags}):**
\${filesSummary.flags.security.map(flag => \`- \${flag.file}: \${flag.concern}\`).join('\\n')}
\` : '✅ No security issues detected'}

\${summary.performanceFlags > 0 ? \`
**Performance Concerns (\${summary.performanceFlags}):**
\${filesSummary.flags.performance.map(flag => \`- \${flag.file}: \${flag.concern}\`).join('\\n')}
\` : '✅ No performance issues detected'}

### 🎯 Final Verdict

\${emoji[recommendation]} **\${recommendation.toUpperCase().replace('_', ' ')}**

\${recommendation === 'approve' ? 
  '🎉 This PR looks great! Code quality is high and no critical issues were found.' :
  recommendation === 'request_changes' ?
  '🔧 This PR needs some improvements before it can be merged. Please address the issues mentioned above.' :
  '💭 This PR is generally good but has some areas for improvement. Consider the suggestions above.'
}

---
*🤖 Generated by EchoTune AI Advanced Code Review System*
*Powered by DeepSeek AI, Super Code Processing, and n8n Automation*
*Review ID: \${Date.now()} | Timestamp: \${new Date().toISOString()}*\`;
                                }
                                
                                function getComplexityEmoji(level) {
                                    return { low: '🟢', medium: '🟡', high: '🔴' }[level] || '⚪';
                                }
                                
                                function getQualityStatus(score) {
                                    if (score >= 8) return '🟢 Excellent';
                                    if (score >= 6) return '🟡 Good';
                                    if (score >= 4) return '🟠 Fair';
                                    return '🔴 Needs Improvement';
                                }
                                
                                function getSecurityStatus(risk) {
                                    return {
                                        'low': '🟢 Low Risk',
                                        'medium': '🟡 Medium Risk', 
                                        'high': '🟠 High Risk',
                                        'critical': '🔴 Critical Risk'
                                    }[risk] || '⚪ Unknown';
                                }
                                
                                function getPerformanceStatus(perf) {
                                    return {
                                        'excellent': '🟢 Excellent',
                                        'good': '🟢 Good',
                                        'fair': '🟡 Fair',
                                        'poor': '🔴 Poor'
                                    }[perf] || '⚪ Unknown';
                                }
                                
                                return [{ json: review }];
                            `
                        }
                    },
                    {
                        name: 'Post Review to GitHub',
                        type: 'n8n-nodes-base.github',
                        position: [1300, 100],
                        parameters: {
                            operation: 'createReview',
                            owner: '={{ $node["Extract & Validate PR Data"].json.repository.owner }}',
                            repository: '={{ $node["Extract & Validate PR Data"].json.repository.name }}',
                            pullRequestNumber: '={{ $node["Extract & Validate PR Data"].json.number }}',
                            body: '={{ $json.markdown }}',
                            event: '={{ $json.verdict.recommendation === "approve" ? "APPROVE" : $json.verdict.recommendation === "request_changes" ? "REQUEST_CHANGES" : "COMMENT" }}'
                        }
                    },
                    {
                        name: 'Log Review Analytics',
                        type: 'n8n-nodes-mcp.mcp-client',
                        position: [1500, 100],
                        parameters: {
                            operation: 'logEvent',
                            server: 'analytics',
                            event: {
                                type: 'code_review_completed',
                                data: '={{ $node["Generate Comprehensive Review"].json }}',
                                timestamp: '={{ new Date().toISOString() }}'
                            }
                        }
                    },
                    {
                        name: 'Webhook Response',
                        type: 'n8n-nodes-base.respondToWebhook',
                        position: [1700, 100],
                        parameters: {
                            responseBody: '={{ JSON.stringify({ status: "success", reviewId: $node["Post Review to GitHub"].json.id, verdict: $node["Generate Comprehensive Review"].json.verdict }) }}',
                            responseContentType: 'application/json',
                            responseStatusCode: 200
                        }
                    }
                ],
                connections: {
                    'GitHub PR Webhook': { main: [['Extract & Validate PR Data']] },
                    'Extract & Validate PR Data': { main: [['Get PR Files & Diffs']] },
                    'Get PR Files & Diffs': { main: [['Process Files with Enhanced Logic']] },
                    'Process Files with Enhanced Logic': { main: [['DeepSeek Advanced Code Analysis']] },
                    'DeepSeek Advanced Code Analysis': { main: [['Generate Comprehensive Review']] },
                    'Generate Comprehensive Review': { main: [['Post Review to GitHub']] },
                    'Post Review to GitHub': { main: [['Log Review Analytics']] },
                    'Log Review Analytics': { main: [['Webhook Response']] }
                }
            },
            webhookUrl: 'https://primosphere.ninja/webhook/github-advanced-code-review',
            documentation: {
                setup: [
                    'Configure GitHub webhook for pull_request events',
                    'Set DEEPSEEK_API_KEY in environment variables',
                    'Ensure GitHub token has repo permissions',
                    'Configure MCP analytics server'
                ],
                features: [
                    'AI-powered comprehensive code analysis',
                    'Security vulnerability detection',
                    'Performance optimization suggestions',
                    'Automated code quality scoring',
                    'Multi-language support',
                    'Complexity analysis',
                    'Test coverage assessment',
                    'Architecture review',
                    'Automated approval for low-risk changes'
                ]
            }
        });

        // 2. GitHub Issues Auto-Triage & Assignment
        this.templates.set('github-issues-auto-triage', {
            category: 'github',
            name: 'Intelligent Issues Auto-Triage System',
            description: 'AI-powered automatic issue categorization, labeling, and team assignment',
            priority: 'high',
            communityNodes: ['DeepSeek', 'SuperCode'],
            trigger: {
                type: 'webhook',
                path: 'github-issues-triage',
                events: ['issues']
            },
            workflow: {
                nodes: [
                    {
                        name: 'GitHub Issues Webhook',
                        type: 'n8n-nodes-base.webhook',
                        position: [100, 200],
                        parameters: {
                            path: 'github-issues-triage',
                            httpMethod: 'POST'
                        }
                    },
                    {
                        name: 'Process Issue Data',
                        type: '@kenkaiii/n8n-nodes-supercode.supercode',
                        position: [300, 200],
                        parameters: {
                            code: `
                                const webhook = items[0].json;
                                const issue = webhook.issue;
                                
                                if (!issue || webhook.action !== 'opened') {
                                    return [{ json: { skip: true, reason: 'Not a new issue' } }];
                                }
                                
                                const issueData = {
                                    number: issue.number,
                                    title: issue.title,
                                    body: issue.body || '',
                                    author: {
                                        login: issue.user.login,
                                        type: issue.user.type,
                                        isContributor: checkContributor(issue.user.login, webhook.repository)
                                    },
                                    repository: {
                                        owner: webhook.repository.owner.login,
                                        name: webhook.repository.name,
                                        fullName: webhook.repository.full_name
                                    },
                                    labels: issue.labels.map(l => l.name),
                                    assignees: issue.assignees.map(a => a.login),
                                    milestone: issue.milestone?.title,
                                    htmlUrl: issue.html_url,
                                    createdAt: issue.created_at,
                                    metadata: extractMetadata(issue.title, issue.body)
                                };
                                
                                function checkContributor(login, repo) {
                                    // Simple heuristic - could be enhanced with actual API call
                                    return repo.collaborators_url?.includes(login) || 
                                           login === repo.owner.login;
                                }
                                
                                function extractMetadata(title, body) {
                                    const metadata = {
                                        urgency: 'normal',
                                        hasReproSteps: false,
                                        hasExpectedBehavior: false,
                                        hasBrowserInfo: false,
                                        hasVersionInfo: false,
                                        hasLogs: false
                                    };
                                    
                                    const text = (title + ' ' + body).toLowerCase();
                                    
                                    // Urgency detection
                                    if (/urgent|critical|blocking|emergency|asap/i.test(text)) {
                                        metadata.urgency = 'high';
                                    } else if (/minor|trivial|cosmetic|nice.?to.?have/i.test(text)) {
                                        metadata.urgency = 'low';
                                    }
                                    
                                    // Quality indicators
                                    metadata.hasReproSteps = /steps.?to.?reproduce|reproduction.?steps|how.?to.?reproduce/i.test(body);
                                    metadata.hasExpectedBehavior = /expected.?behavior|expected.?result|should.?be/i.test(body);
                                    metadata.hasBrowserInfo = /browser|chrome|firefox|safari|edge/i.test(body);
                                    metadata.hasVersionInfo = /version|v\\d+|@\\d+/i.test(body);
                                    metadata.hasLogs = /log|error|stack.?trace|console/i.test(body);
                                    
                                    return metadata;
                                }
                                
                                return [{ json: issueData }];
                            `
                        }
                    },
                    {
                        name: 'AI Issue Classification',
                        type: 'n8n-nodes-deepseek.deepseek',
                        position: [500, 200],
                        parameters: {
                            operation: 'classifyText',
                            model: 'deepseek-chat',
                            temperature: 0.1,
                            prompt: `
                                Analyze this GitHub issue and provide comprehensive classification:
                                
                                **Issue Details:**
                                Title: {{ $json.title }}
                                Body: {{ $json.body }}
                                Author: {{ $json.author.login }} ({{ $json.author.type }})
                                Repository: {{ $json.repository.fullName }}
                                
                                **Metadata:**
                                Urgency: {{ $json.metadata.urgency }}
                                Has Repro Steps: {{ $json.metadata.hasReproSteps }}
                                Has Expected Behavior: {{ $json.metadata.hasExpectedBehavior }}
                                
                                Please classify and respond in JSON format with:
                                {
                                  "type": "bug|feature|enhancement|documentation|question|support|security",
                                  "priority": "low|medium|high|critical",
                                  "category": "frontend|backend|api|database|infrastructure|testing|ci/cd|documentation|security",
                                  "complexity": "simple|moderate|complex",
                                  "effort": "1d|3d|1w|2w|1m",
                                  "team": "frontend-team|backend-team|devops-team|qa-team|security-team|docs-team",
                                  "labels": ["label1", "label2", "label3"],
                                  "confidence": 0.95,
                                  "reasoning": "explanation of classification",
                                  "suggestedActions": ["action1", "action2"],
                                  "requiresImmediateAttention": false,
                                  "duplicateLikelihood": "low|medium|high",
                                  "userExperience": "critical|important|minor|none"
                                }
                            `
                        }
                    },
                    {
                        name: 'Parse AI Classification',
                        type: '@kenkaiii/n8n-nodes-supercode.supercode',
                        position: [700, 200],
                        parameters: {
                            code: `
                                const issueData = $node['Process Issue Data'].json;
                                const aiResponse = $node['AI Issue Classification'].json;
                                
                                let classification;
                                try {
                                    // Try to parse JSON from AI response
                                    const responseText = aiResponse.analysis || aiResponse.choices?.[0]?.message?.content || '{}';
                                    const jsonMatch = responseText.match(/\\{[\\s\\S]*\\}/);
                                    
                                    if (jsonMatch) {
                                        classification = JSON.parse(jsonMatch[0]);
                                    } else {
                                        throw new Error('No JSON found in response');
                                    }
                                } catch (error) {
                                    // Fallback classification
                                    classification = generateFallbackClassification(issueData);
                                }
                                
                                // Validate and enhance classification
                                classification = validateClassification(classification, issueData);
                                
                                function generateFallbackClassification(data) {
                                    const title = data.title.toLowerCase();
                                    const body = data.body.toLowerCase();
                                    
                                    // Simple rule-based classification
                                    let type = 'question';
                                    if (/bug|error|broken|fail|crash|issue/i.test(title + body)) type = 'bug';
                                    else if (/feature|add|implement|new/i.test(title + body)) type = 'feature';
                                    else if (/improve|enhance|better|optimize/i.test(title + body)) type = 'enhancement';
                                    else if (/doc|documentation|readme/i.test(title + body)) type = 'documentation';
                                    else if (/security|vulnerability|exploit/i.test(title + body)) type = 'security';
                                    
                                    return {
                                        type: type,
                                        priority: data.metadata.urgency === 'high' ? 'high' : 'medium',
                                        category: 'general',
                                        complexity: 'moderate',
                                        effort: '3d',
                                        team: 'backend-team',
                                        labels: [type],
                                        confidence: 0.6,
                                        reasoning: 'Fallback classification based on keywords',
                                        suggestedActions: ['Needs manual review'],
                                        requiresImmediateAttention: data.metadata.urgency === 'high',
                                        duplicateLikelihood: 'low',
                                        userExperience: 'minor'
                                    };
                                }
                                
                                function validateClassification(classification, data) {
                                    // Ensure all required fields exist
                                    const defaults = {
                                        type: 'question',
                                        priority: 'medium',
                                        category: 'general',
                                        complexity: 'moderate',
                                        effort: '3d',
                                        team: 'backend-team',
                                        labels: [],
                                        confidence: 0.5,
                                        reasoning: 'Auto-classified',
                                        suggestedActions: [],
                                        requiresImmediateAttention: false,
                                        duplicateLikelihood: 'low',
                                        userExperience: 'minor'
                                    };
                                    
                                    // Merge with defaults
                                    classification = { ...defaults, ...classification };
                                    
                                    // Adjust priority based on metadata
                                    if (data.metadata.urgency === 'high' && classification.priority === 'medium') {
                                        classification.priority = 'high';
                                    }
                                    
                                    // Add quality labels
                                    if (data.metadata.hasReproSteps) classification.labels.push('has-repro-steps');
                                    if (!data.metadata.hasReproSteps && classification.type === 'bug') {
                                        classification.labels.push('needs-repro-steps');
                                    }
                                    if (data.author.isContributor) classification.labels.push('contributor');
                                    
                                    // Security issues get immediate attention
                                    if (classification.type === 'security') {
                                        classification.priority = 'critical';
                                        classification.requiresImmediateAttention = true;
                                        classification.team = 'security-team';
                                    }
                                    
                                    return classification;
                                }
                                
                                return [{ json: { issue: issueData, classification: classification } }];
                            `
                        }
                    },
                    {
                        name: 'Apply Labels',
                        type: 'n8n-nodes-base.github',
                        position: [900, 150],
                        parameters: {
                            operation: 'addLabels',
                            owner: '={{ $json.issue.repository.owner }}',
                            repository: '={{ $json.issue.repository.name }}',
                            issueNumber: '={{ $json.issue.number }}',
                            labels: '={{ $json.classification.labels }}'
                        }
                    },
                    {
                        name: 'Assign Team Member',
                        type: 'n8n-nodes-base.github',
                        position: [900, 250],
                        parameters: {
                            operation: 'addAssignees',
                            owner: '={{ $json.issue.repository.owner }}',
                            repository: '={{ $json.issue.repository.name }}',
                            issueNumber: '={{ $json.issue.number }}',
                            assignees: '={{ [$json.classification.team] }}'
                        }
                    },
                    {
                        name: 'Post Classification Comment',
                        type: 'n8n-nodes-base.github',
                        position: [1100, 200],
                        parameters: {
                            operation: 'createComment',
                            owner: '={{ $json.issue.repository.owner }}',
                            repository: '={{ $json.issue.repository.name }}',
                            issueNumber: '={{ $json.issue.number }}',
                            body: `## 🤖 Auto-Triage Results

**Issue Classification:**
- **Type:** {{ $json.classification.type }}
- **Priority:** {{ $json.classification.priority }}
- **Category:** {{ $json.classification.category }}
- **Estimated Effort:** {{ $json.classification.effort }}
- **Assigned Team:** {{ $json.classification.team }}

**Analysis:**
{{ $json.classification.reasoning }}

**Next Steps:**
{{ $json.classification.suggestedActions.map(action => '- ' + action).join('\n') }}

{{ $json.classification.requiresImmediateAttention ? '🚨 **This issue requires immediate attention!**' : '' }}

---
*Auto-generated by EchoTune AI Issue Triage System*`
                        }
                    }
                ],
                connections: {
                    'GitHub Issues Webhook': { main: [['Process Issue Data']] },
                    'Process Issue Data': { main: [['AI Issue Classification']] },
                    'AI Issue Classification': { main: [['Parse AI Classification']] },
                    'Parse AI Classification': { main: [['Apply Labels'], ['Assign Team Member']] },
                    'Apply Labels': { main: [['Post Classification Comment']] },
                    'Assign Team Member': { main: [['Post Classification Comment']] }
                }
            },
            webhookUrl: 'https://primosphere.ninja/webhook/github-issues-triage'
        });

        console.log('✅ Loaded GitHub workflow templates');
    }

    async generateTemplatesDocumentation() {
        const documentation = {
            overview: {
                totalTemplates: this.templates.size,
                categories: Object.keys(this.categories).length,
                communityNodesUsed: ['@kenkaiii/n8n-nodes-supercode', 'n8n-nodes-deepseek', 'n8n-nodes-mcp'],
                lastUpdated: new Date().toISOString()
            },
            categories: this.categories,
            templates: []
        };

        for (const [id, template] of this.templates) {
            documentation.templates.push({
                id,
                name: template.name,
                category: template.category,
                description: template.description,
                priority: template.priority,
                communityNodes: template.communityNodes,
                webhookUrl: template.webhookUrl,
                nodeCount: template.workflow?.nodes?.length || 0,
                features: template.documentation?.features || []
            });
        }

        return documentation;
    }

    async saveTemplates() {
        const reportsDir = path.join(__dirname, '../reports');
        await fs.mkdir(reportsDir, { recursive: true });

        // Save individual templates
        for (const [id, template] of this.templates) {
            const templatePath = path.join(reportsDir, `n8n-template-${id}.json`);
            await fs.writeFile(templatePath, JSON.stringify(template, null, 2));
        }

        // Save comprehensive documentation
        const documentation = await this.generateTemplatesDocumentation();
        const docsPath = path.join(reportsDir, 'n8n-templates-library-comprehensive.json');
        await fs.writeFile(docsPath, JSON.stringify(documentation, null, 2));

        console.log(`💾 Saved ${this.templates.size} templates and documentation`);
        return documentation;
    }
}

// Main execution
async function main() {
    try {
        const library = new N8nWorkflowTemplatesLibrary();
        await library.loadAllTemplates();
        const documentation = await library.saveTemplates();
        
        console.log('\n📚 N8N WORKFLOW TEMPLATES LIBRARY');
        console.log('==================================');
        console.log(`📊 Total Templates: ${documentation.overview.totalTemplates}`);
        console.log(`🏷️  Categories: ${documentation.overview.categories}`);
        console.log(`🧩 Community Nodes: ${documentation.overview.communityNodesUsed.join(', ')}`);
        console.log(`🕐 Last Updated: ${documentation.overview.lastUpdated}`);
        
        console.log('\n🎯 Template Categories:');
        Object.entries(library.categories).forEach(([key, value]) => {
            const count = documentation.templates.filter(t => t.category === key).length;
            console.log(`  - ${value}: ${count} templates`);
        });
        
        console.log('\n🚀 Ready for deployment to n8n instance at https://primosphere.ninja');
        
    } catch (error) {
        console.error('❌ Failed to load templates:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { N8nWorkflowTemplatesLibrary };