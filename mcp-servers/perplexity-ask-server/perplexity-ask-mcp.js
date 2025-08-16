#!/usr/bin/env node

/**
 * Perplexity Ask MCP Server for Cursor Integration
 * 
 * Enhanced MCP server providing:
 * - Real-time web research capabilities
 * - Automated fact-checking workflows
 * - Live documentation updates
 * - Context-aware research for coding tasks
 * - Competitive analysis during development
 * - Security vulnerability research
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CursorSonarIntegration } = require('../../src/api/ai-integration/perplexity-sonar-pro');

class PerplexityAskMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'perplexity-ask-server',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {},
          resources: {}
        }
      }
    );

    this.perplexityClient = new CursorSonarIntegration(process.env.PERPLEXITY_API_KEY);
    
    // Research context tracking
    this.researchContext = {
      currentProject: null,
      activeFiles: [],
      researchHistory: [],
      lastQueries: []
    };

    this.setupTools();
    this.setupResources();
  }

  setupTools() {
    // Real-time web research tool
    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'perplexity_research':
          return await this.handleResearch(args);
        
        case 'competitive_analysis':
          return await this.handleCompetitiveAnalysis(args);
        
        case 'security_research':
          return await this.handleSecurityResearch(args);
        
        case 'api_documentation_fetch':
          return await this.handleApiDocumentationFetch(args);
        
        case 'fact_check_code_comments':
          return await this.handleFactCheckCodeComments(args);
        
        case 'performance_benchmarks':
          return await this.handlePerformanceBenchmarks(args);
        
        case 'live_documentation_update':
          return await this.handleLiveDocumentationUpdate(args);
        
        case 'context_aware_research':
          return await this.handleContextAwareResearch(args);

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });

    // List available tools
    this.server.setRequestHandler('tools/list', async () => ({
      tools: [
        {
          name: 'perplexity_research',
          description: 'Perform web research using Perplexity Sonar Pro with citations',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Research query'
              },
              focus: {
                type: 'string',
                description: 'Research focus area',
                enum: ['security', 'performance', 'architecture', 'debugging', 'testing', 'general']
              },
              context: {
                type: 'string',
                description: 'Additional context about current development task'
              }
            },
            required: ['query']
          }
        },
        {
          name: 'competitive_analysis',
          description: 'Analyze competitors and alternative solutions during development',
          inputSchema: {
            type: 'object',
            properties: {
              technology: {
                type: 'string',
                description: 'Technology or framework to analyze'
              },
              useCase: {
                type: 'string',
                description: 'Specific use case or problem being solved'
              }
            },
            required: ['technology', 'useCase']
          }
        },
        {
          name: 'security_research',
          description: 'Research current security vulnerabilities and best practices',
          inputSchema: {
            type: 'object',
            properties: {
              framework: {
                type: 'string',
                description: 'Framework or technology to research'
              },
              vulnerability_type: {
                type: 'string',
                description: 'Type of vulnerability to focus on'
              },
              code_snippet: {
                type: 'string',
                description: 'Code snippet to analyze for security issues'
              }
            },
            required: ['framework']
          }
        },
        {
          name: 'api_documentation_fetch',
          description: 'Fetch and analyze current API documentation for external services',
          inputSchema: {
            type: 'object',
            properties: {
              service_name: {
                type: 'string',
                description: 'Name of the API service'
              },
              endpoint: {
                type: 'string',
                description: 'Specific API endpoint or feature'
              },
              version: {
                type: 'string',
                description: 'API version if known'
              }
            },
            required: ['service_name']
          }
        },
        {
          name: 'fact_check_code_comments',
          description: 'Verify accuracy of code comments and documentation against current best practices',
          inputSchema: {
            type: 'object',
            properties: {
              comments: {
                type: 'string',
                description: 'Code comments or documentation to fact-check'
              },
              technology: {
                type: 'string',
                description: 'Technology stack being documented'
              }
            },
            required: ['comments', 'technology']
          }
        },
        {
          name: 'performance_benchmarks',
          description: 'Research current performance benchmarks and optimization techniques',
          inputSchema: {
            type: 'object',
            properties: {
              technology: {
                type: 'string',
                description: 'Technology to benchmark'
              },
              metrics: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: 'Performance metrics to research'
              },
              platform: {
                type: 'string',
                description: 'Target platform (web, mobile, server, etc.)'
              }
            },
            required: ['technology']
          }
        },
        {
          name: 'live_documentation_update',
          description: 'Generate updated documentation based on current web research',
          inputSchema: {
            type: 'object',
            properties: {
              topic: {
                type: 'string',
                description: 'Documentation topic to update'
              },
              current_content: {
                type: 'string',
                description: 'Current documentation content'
              },
              format: {
                type: 'string',
                description: 'Output format',
                enum: ['markdown', 'html', 'json', 'yaml']
              }
            },
            required: ['topic']
          }
        },
        {
          name: 'context_aware_research',
          description: 'Perform research based on current Cursor context and active files',
          inputSchema: {
            type: 'object',
            properties: {
              task_description: {
                type: 'string',
                description: 'Description of current development task'
              },
              active_files: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: 'List of currently active file names'
              },
              recent_changes: {
                type: 'string',
                description: 'Recent code changes or commits'
              }
            },
            required: ['task_description']
          }
        }
      ]
    }));
  }

  setupResources() {
    // Research history resource
    this.server.setRequestHandler('resources/list', async () => ({
      resources: [
        {
          uri: 'perplexity://research-history',
          name: 'Research History',
          mimeType: 'application/json',
          description: 'History of research queries and results'
        },
        {
          uri: 'perplexity://active-context',
          name: 'Active Research Context',
          mimeType: 'application/json',
          description: 'Current research context and active projects'
        }
      ]
    }));

    this.server.setRequestHandler('resources/read', async (request) => {
      const { uri } = request.params;

      switch (uri) {
        case 'perplexity://research-history':
          return {
            contents: [{
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(this.researchContext.researchHistory, null, 2)
            }]
          };
        
        case 'perplexity://active-context':
          return {
            contents: [{
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(this.researchContext, null, 2)
            }]
          };
        
        default:
          throw new Error(`Unknown resource: ${uri}`);
      }
    });
  }

  async handleResearch(args) {
    const { query, focus = 'general', context = '' } = args;
    
    try {
      const enhancedQuery = context ? `${query} ${context}` : query;
      
      const result = await this.perplexityClient.search({
        query: enhancedQuery,
        focus,
        mode: 'json',
        maxResults: 5
      });

      const formattedResult = this.perplexityClient.formatForCursor(result);
      
      // Track research in context
      this.researchContext.researchHistory.push({
        timestamp: new Date().toISOString(),
        query: enhancedQuery,
        focus,
        resultSummary: formattedResult.summary,
        citationCount: formattedResult.citations.length
      });

      // Keep only last 50 research entries
      if (this.researchContext.researchHistory.length > 50) {
        this.researchContext.researchHistory = this.researchContext.researchHistory.slice(-50);
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            query: enhancedQuery,
            focus,
            result: formattedResult,
            research_id: this.researchContext.researchHistory.length
          }, null, 2)
        }]
      };

    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: error.message,
            query,
            focus
          }, null, 2)
        }],
        isError: true
      };
    }
  }

  async handleCompetitiveAnalysis(args) {
    const { technology, useCase } = args;
    
    const query = `${technology} alternatives competitors comparison 2025 ${useCase}`;
    
    try {
      const result = await this.perplexityClient.search({
        query,
        focus: 'architecture',
        mode: 'json',
        maxResults: 7
      });

      const analysis = {
        technology,
        useCase,
        alternatives: this.extractAlternatives(result.content),
        pros_cons: this.extractProsAndCons(result.content),
        market_trends: this.extractMarketTrends(result.content),
        recommendations: this.perplexityClient.extractRecommendations(result.content),
        citations: result.citations,
        analysis_date: new Date().toISOString()
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(analysis, null, 2)
        }]
      };

    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2)
        }],
        isError: true
      };
    }
  }

  async handleSecurityResearch(args) {
    const { framework, vulnerability_type = '', code_snippet = '' } = args;
    
    const query = `${framework} security vulnerabilities ${vulnerability_type} 2025 best practices CVE ${code_snippet.substring(0, 100)}`;
    
    try {
      const result = await this.perplexityClient.search({
        query,
        focus: 'security',
        mode: 'json',
        maxResults: 5
      });

      const securityAnalysis = {
        framework,
        vulnerability_type,
        threats: this.extractThreats(result.content),
        mitigation_strategies: this.extractMitigations(result.content),
        security_tools: this.extractSecurityTools(result.content),
        compliance_considerations: this.extractCompliance(result.content),
        code_analysis: code_snippet ? this.analyzeCodeSecurity(code_snippet, framework) : null,
        citations: result.citations,
        last_updated: new Date().toISOString()
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(securityAnalysis, null, 2)
        }]
      };

    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2)
        }],
        isError: true
      };
    }
  }

  async handleApiDocumentationFetch(args) {
    const { service_name, endpoint = '', version = '' } = args;
    
    const query = `${service_name} API documentation ${endpoint} ${version} official docs 2025`;
    
    try {
      const result = await this.perplexityClient.search({
        query,
        searchDomains: [
          'docs.python.org',
          'developer.mozilla.org',
          'docs.github.com',
          'developers.google.com',
          'docs.aws.amazon.com',
          'docs.microsoft.com'
        ],
        mode: 'json',
        maxResults: 3
      });

      const apiInfo = {
        service: service_name,
        endpoint,
        version,
        documentation_summary: result.content,
        endpoints: this.extractApiEndpoints(result.content),
        authentication: this.extractAuthInfo(result.content),
        rate_limits: this.extractRateLimits(result.content),
        examples: this.extractApiExamples(result.content),
        citations: result.citations,
        fetched_at: new Date().toISOString()
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(apiInfo, null, 2)
        }]
      };

    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2)
        }],
        isError: true
      };
    }
  }

  async handleFactCheckCodeComments(args) {
    const { comments, technology } = args;
    
    const query = `${technology} ${comments} accuracy current practices 2025`;
    
    try {
      const result = await this.perplexityClient.search({
        query,
        focus: 'general',
        mode: 'json',
        maxResults: 3
      });

      const factCheck = {
        original_comments: comments,
        technology,
        accuracy_assessment: this.assessAccuracy(comments, result.content),
        corrections: this.suggestCorrections(comments, result.content),
        updated_comments: this.generateUpdatedComments(comments, result.content),
        confidence_score: this.calculateConfidenceScore(result.citations),
        citations: result.citations,
        checked_at: new Date().toISOString()
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(factCheck, null, 2)
        }]
      };

    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2)
        }],
        isError: true
      };
    }
  }

  async handlePerformanceBenchmarks(args) {
    const { technology, metrics = [], platform = 'web' } = args;
    
    const metricsStr = metrics.length > 0 ? metrics.join(' ') : 'performance latency throughput memory';
    const query = `${technology} performance benchmarks ${metricsStr} ${platform} 2025 optimization`;
    
    try {
      const result = await this.perplexityClient.search({
        query,
        focus: 'performance',
        mode: 'json',
        maxResults: 5
      });

      const benchmarks = {
        technology,
        platform,
        requested_metrics: metrics,
        current_benchmarks: this.extractBenchmarks(result.content),
        optimization_techniques: this.extractOptimizations(result.content),
        tools_and_libraries: this.extractPerformanceTools(result.content),
        comparison_data: this.extractComparisons(result.content),
        citations: result.citations,
        benchmark_date: new Date().toISOString()
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(benchmarks, null, 2)
        }]
      };

    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2)
        }],
        isError: true
      };
    }
  }

  async handleLiveDocumentationUpdate(args) {
    const { topic, current_content = '', format = 'markdown' } = args;
    
    const query = `${topic} documentation best practices 2025 current standards`;
    
    try {
      const result = await this.perplexityClient.search({
        query,
        focus: 'general',
        mode: 'json',
        maxResults: 4
      });

      const updated_docs = {
        topic,
        format,
        current_content: current_content.substring(0, 500) + '...',
        research_summary: result.content,
        updated_sections: this.generateUpdatedSections(topic, current_content, result.content),
        new_information: this.extractNewInformation(current_content, result.content),
        deprecated_information: this.identifyDeprecated(current_content, result.content),
        citations: result.citations,
        update_confidence: this.calculateUpdateConfidence(result.citations),
        updated_at: new Date().toISOString()
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(updated_docs, null, 2)
        }]
      };

    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2)
        }],
        isError: true
      };
    }
  }

  async handleContextAwareResearch(args) {
    const { task_description, active_files = [], recent_changes = '' } = args;
    
    // Update research context
    this.researchContext.activeFiles = active_files;
    this.researchContext.currentProject = task_description;
    
    // Analyze files to determine technologies and patterns
    const technologies = this.extractTechnologiesFromFiles(active_files);
    const patterns = this.extractPatternsFromChanges(recent_changes);
    
    const contextualQuery = `${task_description} ${technologies.join(' ')} ${patterns.join(' ')} best practices 2025`;
    
    try {
      const result = await this.perplexityClient.search({
        query: contextualQuery,
        focus: 'architecture',
        mode: 'json',
        maxResults: 6
      });

      const contextAwareResult = {
        task: task_description,
        detected_technologies: technologies,
        detected_patterns: patterns,
        active_files,
        research_results: this.perplexityClient.formatForCursor(result),
        context_specific_recommendations: this.generateContextualRecommendations(
          task_description, 
          technologies, 
          result.content
        ),
        file_specific_suggestions: this.generateFileSpecificSuggestions(active_files, result.content),
        next_research_suggestions: this.suggestNextResearch(task_description, result.content),
        research_timestamp: new Date().toISOString()
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(contextAwareResult, null, 2)
        }]
      };

    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2)
        }],
        isError: true
      };
    }
  }

  // Helper methods for content analysis
  extractAlternatives(content) {
    const lines = content.split('\n');
    const alternatives = [];
    
    for (const line of lines) {
      if (line.toLowerCase().includes('alternative') || line.toLowerCase().includes('competitor')) {
        alternatives.push(line.trim());
      }
    }
    
    return alternatives.slice(0, 5);
  }

  extractProsAndCons(content) {
    const pros = [];
    const cons = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.toLowerCase().includes('pros:') || line.toLowerCase().includes('advantages:')) {
        pros.push(line.trim());
      }
      if (line.toLowerCase().includes('cons:') || line.toLowerCase().includes('disadvantages:')) {
        cons.push(line.trim());
      }
    }
    
    return { pros: pros.slice(0, 3), cons: cons.slice(0, 3) };
  }

  extractMarketTrends(content) {
    const lines = content.split('\n');
    const trends = [];
    
    for (const line of lines) {
      if (line.toLowerCase().includes('trend') || line.toLowerCase().includes('popular') || line.toLowerCase().includes('growing')) {
        trends.push(line.trim());
      }
    }
    
    return trends.slice(0, 3);
  }

  extractThreats(content) {
    const lines = content.split('\n');
    const threats = [];
    
    for (const line of lines) {
      if (line.toLowerCase().includes('vulnerability') || line.toLowerCase().includes('threat') || line.toLowerCase().includes('cve')) {
        threats.push(line.trim());
      }
    }
    
    return threats.slice(0, 5);
  }

  extractMitigations(content) {
    const lines = content.split('\n');
    const mitigations = [];
    
    for (const line of lines) {
      if (line.toLowerCase().includes('mitigation') || line.toLowerCase().includes('fix') || line.toLowerCase().includes('patch')) {
        mitigations.push(line.trim());
      }
    }
    
    return mitigations.slice(0, 5);
  }

  extractSecurityTools(content) {
    const tools = [];
    const toolKeywords = ['scanner', 'analyzer', 'eslint', 'sonarqube', 'snyk', 'veracode', 'checkmarx'];
    
    const lines = content.split('\n');
    for (const line of lines) {
      for (const keyword of toolKeywords) {
        if (line.toLowerCase().includes(keyword)) {
          tools.push(line.trim());
          break;
        }
      }
    }
    
    return [...new Set(tools)].slice(0, 5);
  }

  extractCompliance(content) {
    const lines = content.split('\n');
    const compliance = [];
    const complianceKeywords = ['gdpr', 'hipaa', 'sox', 'pci', 'iso', 'compliance'];
    
    for (const line of lines) {
      for (const keyword of complianceKeywords) {
        if (line.toLowerCase().includes(keyword)) {
          compliance.push(line.trim());
          break;
        }
      }
    }
    
    return [...new Set(compliance)].slice(0, 3);
  }

  analyzeCodeSecurity(code, framework) {
    // Basic security pattern detection
    const issues = [];
    
    if (code.includes('eval(')) {
      issues.push('Potential code injection via eval()');
    }
    
    if (code.includes('innerHTML') && !code.includes('sanitize')) {
      issues.push('Potential XSS via innerHTML without sanitization');
    }
    
    if (code.includes('SELECT *') || code.includes('select *')) {
      issues.push('SQL query selects all columns - potential information disclosure');
    }
    
    return {
      issues,
      confidence: issues.length > 0 ? 'medium' : 'low',
      recommendations: issues.length > 0 ? ['Review code for security vulnerabilities', 'Consider using security linting tools'] : []
    };
  }

  extractApiEndpoints(content) {
    const endpoints = content.match(/\/api\/[^\s]+|https?:\/\/[^\s]+\/[^\s]+/g) || [];
    return [...new Set(endpoints)].slice(0, 5);
  }

  extractAuthInfo(content) {
    const lines = content.split('\n');
    const authInfo = [];
    
    for (const line of lines) {
      if (line.toLowerCase().includes('auth') || line.toLowerCase().includes('token') || line.toLowerCase().includes('api key')) {
        authInfo.push(line.trim());
      }
    }
    
    return authInfo.slice(0, 3);
  }

  extractRateLimits(content) {
    const rateLimits = content.match(/\d+\s*requests?\s*per\s*\w+|\d+\s*calls?\s*per\s*\w+/gi) || [];
    return [...new Set(rateLimits)].slice(0, 3);
  }

  extractApiExamples(content) {
    const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
    return codeBlocks.slice(0, 2);
  }

  extractTechnologiesFromFiles(files) {
    const technologies = new Set();
    
    for (const file of files) {
      if (file.endsWith('.js') || file.endsWith('.jsx')) {
        technologies.add('JavaScript');
        technologies.add('React');
      }
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        technologies.add('TypeScript');
        technologies.add('React');
      }
      if (file.endsWith('.py')) {
        technologies.add('Python');
      }
      if (file.endsWith('.java')) {
        technologies.add('Java');
      }
      if (file.includes('test') || file.includes('spec')) {
        technologies.add('Testing');
      }
    }
    
    return Array.from(technologies);
  }

  extractPatternsFromChanges(changes) {
    const patterns = [];
    
    if (changes.toLowerCase().includes('async') || changes.toLowerCase().includes('await')) {
      patterns.push('asynchronous programming');
    }
    
    if (changes.toLowerCase().includes('api') || changes.toLowerCase().includes('endpoint')) {
      patterns.push('API development');
    }
    
    if (changes.toLowerCase().includes('component') || changes.toLowerCase().includes('jsx')) {
      patterns.push('React components');
    }
    
    if (changes.toLowerCase().includes('test') || changes.toLowerCase().includes('spec')) {
      patterns.push('testing');
    }
    
    return patterns;
  }

  assessAccuracy(comments, researchContent) {
    // Simple accuracy assessment based on keyword overlap
    const commentWords = comments.toLowerCase().split(/\s+/);
    const researchWords = researchContent.toLowerCase().split(/\s+/);
    
    const overlap = commentWords.filter(word => researchWords.includes(word)).length;
    const accuracy = (overlap / commentWords.length) * 100;
    
    return {
      score: Math.round(accuracy),
      assessment: accuracy > 70 ? 'high' : accuracy > 40 ? 'medium' : 'low'
    };
  }

  suggestCorrections(comments, researchContent) {
    // Basic correction suggestions
    const corrections = [];
    
    if (comments.includes('deprecated') && researchContent.includes('recommended')) {
      corrections.push('Update deprecated information with current recommendations');
    }
    
    if (comments.includes('2023') || comments.includes('2022')) {
      corrections.push('Update year references to current year');
    }
    
    return corrections;
  }

  generateUpdatedComments(comments, researchContent) {
    // Simple comment updating
    let updated = comments;
    
    // Replace old year references
    updated = updated.replace(/202[0-3]/g, '2025');
    
    // Add research-based insights
    if (researchContent.includes('best practice')) {
      updated += '\n// Note: Current best practices recommend this approach as of 2025';
    }
    
    return updated;
  }

  calculateConfidenceScore(citations) {
    const score = Math.min(citations.length * 20, 100);
    return {
      score,
      level: score > 80 ? 'high' : score > 50 ? 'medium' : 'low'
    };
  }

  extractBenchmarks(content) {
    const benchmarks = content.match(/\d+\s*ms|\d+\s*fps|\d+\s*MB\/s|\d+\s*requests\/sec/gi) || [];
    return [...new Set(benchmarks)].slice(0, 5);
  }

  extractOptimizations(content) {
    const lines = content.split('\n');
    const optimizations = [];
    
    for (const line of lines) {
      if (line.toLowerCase().includes('optimize') || line.toLowerCase().includes('performance') || line.toLowerCase().includes('faster')) {
        optimizations.push(line.trim());
      }
    }
    
    return optimizations.slice(0, 5);
  }

  extractPerformanceTools(content) {
    const tools = [];
    const toolKeywords = ['lighthouse', 'webpagetest', 'gtmetrix', 'profiler', 'benchmark', 'jmeter'];
    
    const lines = content.split('\n');
    for (const line of lines) {
      for (const keyword of toolKeywords) {
        if (line.toLowerCase().includes(keyword)) {
          tools.push(line.trim());
          break;
        }
      }
    }
    
    return [...new Set(tools)].slice(0, 5);
  }

  extractComparisons(content) {
    const lines = content.split('\n');
    const comparisons = [];
    
    for (const line of lines) {
      if (line.toLowerCase().includes('vs ') || line.toLowerCase().includes('compared to') || line.toLowerCase().includes('versus')) {
        comparisons.push(line.trim());
      }
    }
    
    return comparisons.slice(0, 3);
  }

  generateUpdatedSections(topic, currentContent, researchContent) {
    return {
      introduction: `Updated introduction based on latest research about ${topic}`,
      main_content: `Enhanced content incorporating 2025 best practices`,
      examples: `Current examples and use cases from recent research`,
      references: `Updated references and citations`
    };
  }

  extractNewInformation(currentContent, researchContent) {
    // Simple comparison to identify new information
    const currentWords = new Set(currentContent.toLowerCase().split(/\s+/));
    const researchWords = researchContent.toLowerCase().split(/\s+/);
    
    const newWords = researchWords.filter(word => !currentWords.has(word) && word.length > 3);
    
    return [...new Set(newWords)].slice(0, 10);
  }

  identifyDeprecated(currentContent, researchContent) {
    const deprecated = [];
    
    if (currentContent.includes('2023') && researchContent.includes('deprecated')) {
      deprecated.push('Year references may be outdated');
    }
    
    if (currentContent.includes('jQuery') && researchContent.includes('modern alternatives')) {
      deprecated.push('jQuery usage may be deprecated in favor of modern alternatives');
    }
    
    return deprecated;
  }

  calculateUpdateConfidence(citations) {
    const score = Math.min(citations.length * 15, 100);
    return {
      score,
      level: score > 75 ? 'high' : score > 45 ? 'medium' : 'low'
    };
  }

  generateContextualRecommendations(task, technologies, researchContent) {
    const recommendations = [];
    
    recommendations.push(`For ${task}, consider current best practices in ${technologies.join(', ')}`);
    
    if (technologies.includes('React')) {
      recommendations.push('Use React 18+ features like concurrent rendering and automatic batching');
    }
    
    if (technologies.includes('JavaScript')) {
      recommendations.push('Implement modern ES2023+ features for better performance');
    }
    
    return recommendations;
  }

  generateFileSpecificSuggestions(files, researchContent) {
    const suggestions = {};
    
    for (const file of files) {
      if (file.endsWith('.js') || file.endsWith('.jsx')) {
        suggestions[file] = ['Consider TypeScript migration', 'Add JSDoc comments', 'Implement error boundaries'];
      }
      
      if (file.includes('test')) {
        suggestions[file] = ['Add more test cases', 'Consider E2E testing', 'Update test dependencies'];
      }
    }
    
    return suggestions;
  }

  suggestNextResearch(task, researchContent) {
    const suggestions = [
      `Research performance optimization for ${task}`,
      `Investigate security considerations for ${task}`,
      `Look into testing strategies for ${task}`,
      `Explore deployment options for ${task}`
    ];
    
    return suggestions.slice(0, 3);
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Perplexity Ask MCP Server started');
  }
}

// Start the server
if (require.main === module) {
  const server = new PerplexityAskMCPServer();
  server.start().catch(console.error);
}

module.exports = PerplexityAskMCPServer;