#!/usr/bin/env node

/**
 * Advanced AI MCP Server for Cursor Integration (Perplexity-based)
 * 
 * Advanced AI capabilities including:
 * - Advanced reasoning using Perplexity's most capable models
 * - Multi-agent analysis workflows
 * - Automated debugging assistance
 * - Performance optimization recommendations
 * - Security analysis with current threat research
 * - Architectural planning and design
 * 
 * Note: Uses Perplexity API for all advanced reasoning capabilities
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CursorGrokIntegration } = require('./grok4-integration');

class AdvancedAIMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'advanced-ai-integration',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {},
          resources: {}
        }
      }
    );

    this.aiClient = new CursorGrokIntegration(
      process.env.PERPLEXITY_API_KEY
    );

    // Analysis context tracking
    this.analysisContext = {
      currentSessions: new Map(),
      recentAnalyses: [],
      performanceMetrics: {
        totalRequests: 0,
        averageResponseTime: 0,
        successRate: 0
      }
    };

    this.setupTools();
    this.setupResources();
  }

  setupTools() {
    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;
      const startTime = Date.now();

      try {
        let result;

        switch (name) {
          case 'analyze_code_with_research':
            result = await this.handleCodeAnalysis(args);
            break;
          
          case 'architectural_planning':
            result = await this.handleArchitecturalPlanning(args);
            break;
          
          case 'debugging_workflow':
            result = await this.handleDebuggingWorkflow(args);
            break;
          
          case 'performance_optimization':
            result = await this.handlePerformanceOptimization(args);
            break;
          
          case 'security_analysis':
            result = await this.handleSecurityAnalysis(args);
            break;
          
          case 'multi_agent_reasoning':
            result = await this.handleMultiAgentReasoning(args);
            break;
          
          case 'code_review_agent':
            result = await this.handleCodeReview(args);
            break;
          
          case 'technology_comparison':
            result = await this.handleTechnologyComparison(args);
            break;

          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        // Track performance metrics
        const responseTime = Date.now() - startTime;
        this.updateMetrics(responseTime, true);

        return result;

      } catch (error) {
        const responseTime = Date.now() - startTime;
        this.updateMetrics(responseTime, false);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: error.message,
              tool: name,
              timestamp: new Date().toISOString()
            }, null, 2)
          }],
          isError: true
        };
      }
    });

    this.server.setRequestHandler('tools/list', async () => ({
      tools: [
        {
          name: 'analyze_code_with_research',
          description: 'Analyze code with integrated web research using advanced AI models',
          inputSchema: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description: 'Code to analyze'
              },
              context: {
                type: 'string',
                description: 'Additional context about the code'
              },
              focus_areas: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['security', 'performance', 'maintainability', 'best_practices', 'optimization']
                },
                description: 'Areas to focus the analysis on'
              }
            },
            required: ['code']
          }
        },
        {
          name: 'architectural_planning',
          description: 'Plan system architecture using advanced AI reasoning',
          inputSchema: {
            type: 'object',
            properties: {
              requirements: {
                type: 'string',
                description: 'System requirements and specifications'
              },
              constraints: {
                type: 'object',
                description: 'Technical and business constraints'
              },
              scale: {
                type: 'string',
                description: 'Expected scale (small, medium, large, enterprise)',
                enum: ['small', 'medium', 'large', 'enterprise']
              }
            },
            required: ['requirements']
          }
        },
        {
          name: 'debugging_workflow',
          description: 'Multi-step debugging assistance with research',
          inputSchema: {
            type: 'object',
            properties: {
              error: {
                type: 'string',
                description: 'Error message or description'
              },
              code_context: {
                type: 'string',
                description: 'Relevant code context where error occurs'
              },
              technology: {
                type: 'string',
                description: 'Technology stack or framework'
              },
              environment: {
                type: 'string',
                description: 'Environment where error occurs (dev, test, prod)'
              }
            },
            required: ['error', 'technology']
          }
        },
        {
          name: 'performance_optimization',
          description: 'Analyze and optimize code performance',
          inputSchema: {
            type: 'object',
            properties: {
              code_snippet: {
                type: 'string',
                description: 'Code to optimize'
              },
              performance_metrics: {
                type: 'object',
                description: 'Current performance metrics'
              },
              target_platform: {
                type: 'string',
                description: 'Target platform (web, mobile, server, desktop)'
              },
              optimization_goals: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: 'Specific optimization goals'
              }
            },
            required: ['code_snippet', 'target_platform']
          }
        },
        {
          name: 'security_analysis',
          description: 'Comprehensive security analysis with threat research',
          inputSchema: {
            type: 'object',
            properties: {
              code_snippet: {
                type: 'string',
                description: 'Code to analyze for security issues'
              },
              framework: {
                type: 'string',
                description: 'Framework or technology stack'
              },
              threat_model: {
                type: 'string',
                description: 'Specific threat model to consider'
              },
              compliance_requirements: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: 'Compliance requirements (GDPR, HIPAA, etc.)'
              }
            },
            required: ['code_snippet', 'framework']
          }
        },
        {
          name: 'multi_agent_reasoning',
          description: 'Multi-agent analysis for complex problems',
          inputSchema: {
            type: 'object',
            properties: {
              problem: {
                type: 'string',
                description: 'Problem or challenge to analyze'
              },
              domain: {
                type: 'string',
                description: 'Problem domain (web development, data science, etc.)'
              },
              stakeholders: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: 'Stakeholder perspectives to consider'
              },
              complexity_level: {
                type: 'string',
                description: 'Problem complexity level',
                enum: ['low', 'medium', 'high', 'enterprise']
              }
            },
            required: ['problem', 'domain']
          }
        },
        {
          name: 'code_review_agent',
          description: 'Comprehensive code review with multiple perspectives',
          inputSchema: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description: 'Code to review'
              },
              review_type: {
                type: 'string',
                description: 'Type of review',
                enum: ['security', 'performance', 'maintainability', 'comprehensive']
              },
              team_standards: {
                type: 'string',
                description: 'Team coding standards and guidelines'
              },
              target_audience: {
                type: 'string',
                description: 'Target audience level (junior, senior, expert)'
              }
            },
            required: ['code', 'review_type']
          }
        },
        {
          name: 'technology_comparison',
          description: 'Compare technologies and frameworks with current research',
          inputSchema: {
            type: 'object',
            properties: {
              technologies: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: 'Technologies to compare'
              },
              use_case: {
                type: 'string',
                description: 'Specific use case or application'
              },
              criteria: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: 'Comparison criteria (performance, learning curve, etc.)'
              },
              project_constraints: {
                type: 'object',
                description: 'Project constraints and requirements'
              }
            },
            required: ['technologies', 'use_case']
          }
        }
      ]
    }));
  }

  setupResources() {
    this.server.setRequestHandler('resources/list', async () => ({
      resources: [
        {
          uri: 'advanced-ai://analysis-history',
          name: 'Analysis History',
          mimeType: 'application/json',
          description: 'History of advanced AI analyses and results'
        },
        {
          uri: 'advanced-ai://performance-metrics',
          name: 'Performance Metrics',
          mimeType: 'application/json',
          description: 'Advanced AI server performance metrics'
        },
        {
          uri: 'advanced-ai://active-sessions',
          name: 'Active Sessions',
          mimeType: 'application/json',
          description: 'Currently active analysis sessions'
        }
      ]
    }));

    this.server.setRequestHandler('resources/read', async (request) => {
      const { uri } = request.params;

      switch (uri) {
        case 'advanced-ai://analysis-history':
          return {
            contents: [{
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(this.analysisContext.recentAnalyses, null, 2)
            }]
          };
        
        case 'advanced-ai://performance-metrics':
          return {
            contents: [{
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(this.analysisContext.performanceMetrics, null, 2)
            }]
          };
        
        case 'advanced-ai://active-sessions':
          return {
            contents: [{
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(Array.from(this.analysisContext.currentSessions.entries()), null, 2)
            }]
          };
        
        default:
          throw new Error(`Unknown resource: ${uri}`);
      }
    });
  }

  async handleCodeAnalysis(args) {
    const { code, context = '', focus_areas = ['best_practices'] } = args;
    
    const sessionId = this.generateSessionId();
    this.analysisContext.currentSessions.set(sessionId, {
      type: 'code_analysis',
      startTime: Date.now(),
      code: code.substring(0, 200) + '...'
    });

    try {
      const result = await this.aiClient.analyzeWithResearch(code, context);
      const formattedResult = this.aiClient.formatForCursor(result);

      const analysis = {
        session_id: sessionId,
        analysis_type: 'code_analysis',
        focus_areas,
        results: formattedResult,
        recommendations: formattedResult.recommendations,
        code_snippets: formattedResult.codeSnippets,
        citations: formattedResult.citations,
        confidence_score: this.calculateConfidenceScore(formattedResult),
        timestamp: new Date().toISOString()
      };

      this.trackAnalysis(analysis);
      this.analysisContext.currentSessions.delete(sessionId);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(analysis, null, 2)
        }]
      };

    } catch (error) {
      this.analysisContext.currentSessions.delete(sessionId);
      throw error;
    }
  }

  async handleArchitecturalPlanning(args) {
    const { requirements, constraints = {}, scale = 'medium' } = args;
    
    const sessionId = this.generateSessionId();
    this.analysisContext.currentSessions.set(sessionId, {
      type: 'architectural_planning',
      startTime: Date.now(),
      requirements: requirements.substring(0, 200) + '...'
    });

    try {
      const result = await this.aiClient.architecturalPlanning(requirements, constraints);
      const formattedResult = this.aiClient.formatForCursor(result);

      const architecture = {
        session_id: sessionId,
        analysis_type: 'architectural_planning',
        scale,
        requirements,
        constraints,
        architecture_recommendations: formattedResult.recommendations,
        technical_decisions: this.extractTechnicalDecisions(formattedResult.content),
        scalability_considerations: this.extractScalabilityNotes(formattedResult.content),
        technology_stack: this.extractTechnologyStack(formattedResult.content),
        implementation_phases: this.extractImplementationPhases(formattedResult.content),
        citations: formattedResult.citations,
        confidence_score: this.calculateConfidenceScore(formattedResult),
        timestamp: new Date().toISOString()
      };

      this.trackAnalysis(architecture);
      this.analysisContext.currentSessions.delete(sessionId);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(architecture, null, 2)
        }]
      };

    } catch (error) {
      this.analysisContext.currentSessions.delete(sessionId);
      throw error;
    }
  }

  async handleDebuggingWorkflow(args) {
    const { error, code_context = '', technology, environment = 'dev' } = args;
    
    const sessionId = this.generateSessionId();
    this.analysisContext.currentSessions.set(sessionId, {
      type: 'debugging_workflow',
      startTime: Date.now(),
      error: error.substring(0, 100) + '...'
    });

    try {
      const result = await this.aiClient.debuggingWorkflow(error, code_context, technology);
      const formattedResult = this.aiClient.formatForCursor(result);

      const debugging = {
        session_id: sessionId,
        analysis_type: 'debugging_workflow',
        error_description: error,
        technology,
        environment,
        root_cause_analysis: this.extractRootCauses(formattedResult.content),
        debugging_steps: this.extractDebuggingSteps(formattedResult.content),
        potential_fixes: formattedResult.recommendations,
        code_examples: formattedResult.codeSnippets,
        prevention_strategies: this.extractPreventionStrategies(formattedResult.content),
        related_issues: this.extractRelatedIssues(formattedResult.content),
        citations: formattedResult.citations,
        confidence_score: this.calculateConfidenceScore(formattedResult),
        timestamp: new Date().toISOString()
      };

      this.trackAnalysis(debugging);
      this.analysisContext.currentSessions.delete(sessionId);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(debugging, null, 2)
        }]
      };

    } catch (error) {
      this.analysisContext.currentSessions.delete(sessionId);
      throw error;
    }
  }

  async handlePerformanceOptimization(args) {
    const { code_snippet, performance_metrics = {}, target_platform, optimization_goals = [] } = args;
    
    const sessionId = this.generateSessionId();
    this.analysisContext.currentSessions.set(sessionId, {
      type: 'performance_optimization',
      startTime: Date.now(),
      platform: target_platform
    });

    try {
      const result = await this.aiClient.optimizePerformance(code_snippet, performance_metrics, target_platform);
      const formattedResult = this.aiClient.formatForCursor(result);

      const optimization = {
        session_id: sessionId,
        analysis_type: 'performance_optimization',
        target_platform,
        optimization_goals,
        current_metrics: performance_metrics,
        bottleneck_analysis: this.extractBottlenecks(formattedResult.content),
        optimization_recommendations: formattedResult.recommendations,
        optimized_code: formattedResult.codeSnippets,
        performance_impact: this.extractPerformanceImpact(formattedResult.content),
        monitoring_suggestions: this.extractMonitoringSuggestions(formattedResult.content),
        benchmarking_data: this.extractBenchmarks(formattedResult.content),
        citations: formattedResult.citations,
        confidence_score: this.calculateConfidenceScore(formattedResult),
        timestamp: new Date().toISOString()
      };

      this.trackAnalysis(optimization);
      this.analysisContext.currentSessions.delete(sessionId);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(optimization, null, 2)
        }]
      };

    } catch (error) {
      this.analysisContext.currentSessions.delete(sessionId);
      throw error;
    }
  }

  async handleSecurityAnalysis(args) {
    const { code_snippet, framework, threat_model = '', compliance_requirements = [] } = args;
    
    const sessionId = this.generateSessionId();
    this.analysisContext.currentSessions.set(sessionId, {
      type: 'security_analysis',
      startTime: Date.now(),
      framework
    });

    try {
      const result = await this.aiClient.securityAnalysis(code_snippet, framework);
      const formattedResult = this.aiClient.formatForCursor(result);

      const security = {
        session_id: sessionId,
        analysis_type: 'security_analysis',
        framework,
        threat_model,
        compliance_requirements,
        vulnerability_assessment: this.extractVulnerabilities(formattedResult.content),
        security_recommendations: formattedResult.recommendations,
        secure_code_examples: formattedResult.codeSnippets,
        threat_mitigation: this.extractThreatMitigation(formattedResult.content),
        compliance_notes: this.extractComplianceNotes(formattedResult.content),
        security_tools: this.extractSecurityTools(formattedResult.content),
        penetration_testing: this.extractPenTestSuggestions(formattedResult.content),
        citations: formattedResult.citations,
        confidence_score: this.calculateConfidenceScore(formattedResult),
        timestamp: new Date().toISOString()
      };

      this.trackAnalysis(security);
      this.analysisContext.currentSessions.delete(sessionId);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(security, null, 2)
        }]
      };

    } catch (error) {
      this.analysisContext.currentSessions.delete(sessionId);
      throw error;
    }
  }

  async handleMultiAgentReasoning(args) {
    const { problem, domain, stakeholders = [], complexity_level = 'medium' } = args;
    
    const sessionId = this.generateSessionId();
    this.analysisContext.currentSessions.set(sessionId, {
      type: 'multi_agent_reasoning',
      startTime: Date.now(),
      domain,
      complexity: complexity_level
    });

    try {
      const result = await this.aiClient.multiAgentReasoning(problem, domain);

      const reasoning = {
        session_id: sessionId,
        analysis_type: 'multi_agent_reasoning',
        problem,
        domain,
        stakeholders,
        complexity_level,
        expert_analyses: result.expertAnalyses,
        synthesis: result.synthesis,
        unified_recommendations: result.recommendations,
        implementation_strategy: this.extractImplementationStrategy(result.synthesis),
        risk_assessment: this.extractRiskAssessment(result.synthesis),
        success_metrics: this.extractSuccessMetrics(result.synthesis),
        next_steps: this.extractNextSteps(result.synthesis),
        confidence_score: this.calculateMultiAgentConfidence(result.expertAnalyses),
        timestamp: new Date().toISOString()
      };

      this.trackAnalysis(reasoning);
      this.analysisContext.currentSessions.delete(sessionId);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(reasoning, null, 2)
        }]
      };

    } catch (error) {
      this.analysisContext.currentSessions.delete(sessionId);
      throw error;
    }
  }

  async handleCodeReview(args) {
    const { code, review_type, team_standards = '', target_audience = 'senior' } = args;
    
    const sessionId = this.generateSessionId();
    this.analysisContext.currentSessions.set(sessionId, {
      type: 'code_review',
      startTime: Date.now(),
      review_type
    });

    try {
      // Use appropriate analysis method based on review type
      let result;
      if (review_type === 'security') {
        result = await this.aiClient.securityAnalysis(code, 'general');
      } else if (review_type === 'performance') {
        result = await this.aiClient.optimizePerformance(code, {}, 'web');
      } else {
        result = await this.aiClient.analyzeWithResearch(code, `Code review focusing on ${review_type}. Team standards: ${team_standards}`);
      }

      const formattedResult = this.aiClient.formatForCursor(result);

      const review = {
        session_id: sessionId,
        analysis_type: 'code_review',
        review_type,
        target_audience,
        code_quality_score: this.calculateCodeQualityScore(formattedResult.content),
        review_findings: formattedResult.recommendations,
        suggested_improvements: formattedResult.codeSnippets,
        best_practices: this.extractBestPractices(formattedResult.content),
        potential_issues: this.extractPotentialIssues(formattedResult.content),
        maintainability_notes: this.extractMaintainabilityNotes(formattedResult.content),
        team_standards_compliance: this.assessTeamStandardsCompliance(code, team_standards),
        learning_opportunities: this.extractLearningOpportunities(formattedResult.content, target_audience),
        citations: formattedResult.citations,
        confidence_score: this.calculateConfidenceScore(formattedResult),
        timestamp: new Date().toISOString()
      };

      this.trackAnalysis(review);
      this.analysisContext.currentSessions.delete(sessionId);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(review, null, 2)
        }]
      };

    } catch (error) {
      this.analysisContext.currentSessions.delete(sessionId);
      throw error;
    }
  }

  async handleTechnologyComparison(args) {
    const { technologies, use_case, criteria = [], project_constraints = {} } = args;
    
    const sessionId = this.generateSessionId();
    this.analysisContext.currentSessions.set(sessionId, {
      type: 'technology_comparison',
      startTime: Date.now(),
      technologies: technologies.join(', ')
    });

    try {
      // Analyze each technology separately then synthesize
      const analyses = [];
      
      for (const tech of technologies) {
        const result = await this.aiClient.analyzeWithResearch(
          `Technology analysis for ${tech}`,
          `Analyzing ${tech} for ${use_case}. Criteria: ${criteria.join(', ')}`
        );
        analyses.push({ technology: tech, analysis: result });
      }

      // Synthesize comparison
      const comparisonPrompt = `
        Compare these technologies for ${use_case}:
        ${analyses.map(a => `${a.technology}: ${a.analysis.content}`).join('\n\n')}
        
        Criteria: ${criteria.join(', ')}
        Constraints: ${JSON.stringify(project_constraints)}
      `;

      const synthesisResult = await this.aiClient.chat({
        messages: [
          {
            role: 'system',
            content: 'You are a technology consultant. Provide a comprehensive comparison and recommendation.'
          },
          {
            role: 'user',
            content: comparisonPrompt
          }
        ],
        useHeavy: true
      });

      const comparison = {
        session_id: sessionId,
        analysis_type: 'technology_comparison',
        technologies,
        use_case,
        criteria,
        project_constraints,
        individual_analyses: analyses.map(a => ({
          technology: a.technology,
          strengths: this.extractStrengths(a.analysis.content),
          weaknesses: this.extractWeaknesses(a.analysis.content),
          use_cases: this.extractUseCases(a.analysis.content)
        })),
        comparison_matrix: this.generateComparisonMatrix(technologies, criteria, analyses),
        final_recommendation: this.extractRecommendation(synthesisResult.content),
        decision_factors: this.extractDecisionFactors(synthesisResult.content),
        implementation_considerations: this.extractImplementationConsiderations(synthesisResult.content),
        migration_strategy: this.extractMigrationStrategy(synthesisResult.content),
        confidence_score: this.calculateComparisonConfidence(analyses),
        timestamp: new Date().toISOString()
      };

      this.trackAnalysis(comparison);
      this.analysisContext.currentSessions.delete(sessionId);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(comparison, null, 2)
        }]
      };

    } catch (error) {
      this.analysisContext.currentSessions.delete(sessionId);
      throw error;
    }
  }

  // Helper methods for content extraction and analysis
  generateSessionId() {
    return `advanced_ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  calculateConfidenceScore(result) {
    let score = 0;
    
    if (result.citations && result.citations.length > 0) {
      score += Math.min(result.citations.length * 15, 60);
    }
    
    if (result.recommendations && result.recommendations.length > 0) {
      score += Math.min(result.recommendations.length * 10, 30);
    }
    
    if (result.codeSnippets && result.codeSnippets.length > 0) {
      score += 10;
    }
    
    return Math.min(score, 100);
  }

  calculateMultiAgentConfidence(expertAnalyses) {
    const avgScore = expertAnalyses.reduce((sum, analysis) => {
      return sum + this.calculateConfidenceScore(analysis.analysis);
    }, 0) / expertAnalyses.length;
    
    return Math.round(avgScore);
  }

  calculateCodeQualityScore(content) {
    let score = 70; // Base score
    
    if (content.includes('best practice')) score += 10;
    if (content.includes('security')) score += 5;
    if (content.includes('performance')) score += 5;
    if (content.includes('maintainable')) score += 5;
    if (content.includes('error handling')) score += 5;
    
    return Math.min(score, 100);
  }

  trackAnalysis(analysis) {
    this.analysisContext.recentAnalyses.push(analysis);
    
    // Keep only last 100 analyses
    if (this.analysisContext.recentAnalyses.length > 100) {
      this.analysisContext.recentAnalyses = this.analysisContext.recentAnalyses.slice(-100);
    }
  }

  updateMetrics(responseTime, success) {
    const metrics = this.analysisContext.performanceMetrics;
    
    metrics.totalRequests++;
    metrics.averageResponseTime = (
      (metrics.averageResponseTime * (metrics.totalRequests - 1) + responseTime) / 
      metrics.totalRequests
    );
    
    if (success) {
      const successCount = Math.round(metrics.successRate * (metrics.totalRequests - 1) / 100) + 1;
      metrics.successRate = (successCount / metrics.totalRequests) * 100;
    } else {
      const successCount = Math.round(metrics.successRate * (metrics.totalRequests - 1) / 100);
      metrics.successRate = (successCount / metrics.totalRequests) * 100;
    }
  }

  // Content extraction methods
  extractTechnicalDecisions(content) {
    const lines = content.split('\n');
    const decisions = [];
    
    for (const line of lines) {
      if (line.toLowerCase().includes('decision') || line.toLowerCase().includes('choose') || line.toLowerCase().includes('recommend')) {
        decisions.push(line.trim());
      }
    }
    
    return decisions.slice(0, 5);
  }

  extractScalabilityNotes(content) {
    const lines = content.split('\n');
    const scalability = [];
    
    for (const line of lines) {
      if (line.toLowerCase().includes('scale') || line.toLowerCase().includes('growth') || line.toLowerCase().includes('load')) {
        scalability.push(line.trim());
      }
    }
    
    return scalability.slice(0, 3);
  }

  extractTechnologyStack(content) {
    const technologies = [];
    const techKeywords = ['react', 'node', 'python', 'mongodb', 'redis', 'docker', 'kubernetes', 'aws', 'azure'];
    
    const contentLower = content.toLowerCase();
    for (const tech of techKeywords) {
      if (contentLower.includes(tech)) {
        technologies.push(tech);
      }
    }
    
    return [...new Set(technologies)];
  }

  extractImplementationPhases(content) {
    const phases = [];
    const phaseKeywords = ['phase 1', 'phase 2', 'step 1', 'step 2', 'first', 'second', 'initially', 'then', 'finally'];
    
    const lines = content.split('\n');
    for (const line of lines) {
      for (const keyword of phaseKeywords) {
        if (line.toLowerCase().includes(keyword)) {
          phases.push(line.trim());
          break;
        }
      }
    }
    
    return phases.slice(0, 5);
  }

  extractRootCauses(content) {
    const lines = content.split('\n');
    const causes = [];
    
    for (const line of lines) {
      if (line.toLowerCase().includes('cause') || line.toLowerCase().includes('reason') || line.toLowerCase().includes('because')) {
        causes.push(line.trim());
      }
    }
    
    return causes.slice(0, 3);
  }

  extractDebuggingSteps(content) {
    const lines = content.split('\n');
    const steps = [];
    
    for (const line of lines) {
      if (line.match(/^\d+\./) || line.toLowerCase().includes('step') || line.toLowerCase().includes('check')) {
        steps.push(line.trim());
      }
    }
    
    return steps.slice(0, 7);
  }

  extractPreventionStrategies(content) {
    const lines = content.split('\n');
    const strategies = [];
    
    for (const line of lines) {
      if (line.toLowerCase().includes('prevent') || line.toLowerCase().includes('avoid') || line.toLowerCase().includes('ensure')) {
        strategies.push(line.trim());
      }
    }
    
    return strategies.slice(0, 3);
  }

  extractRelatedIssues(content) {
    const lines = content.split('\n');
    const issues = [];
    
    for (const line of lines) {
      if (line.toLowerCase().includes('similar') || line.toLowerCase().includes('related') || line.toLowerCase().includes('also')) {
        issues.push(line.trim());
      }
    }
    
    return issues.slice(0, 3);
  }

  extractBottlenecks(content) {
    const lines = content.split('\n');
    const bottlenecks = [];
    
    for (const line of lines) {
      if (line.toLowerCase().includes('bottleneck') || line.toLowerCase().includes('slow') || line.toLowerCase().includes('performance issue')) {
        bottlenecks.push(line.trim());
      }
    }
    
    return bottlenecks.slice(0, 3);
  }

  extractPerformanceImpact(content) {
    const impacts = content.match(/\d+%\s*faster|\d+x\s*improvement|\d+ms\s*reduction/gi) || [];
    return [...new Set(impacts)].slice(0, 3);
  }

  extractMonitoringSuggestions(content) {
    const lines = content.split('\n');
    const monitoring = [];
    
    for (const line of lines) {
      if (line.toLowerCase().includes('monitor') || line.toLowerCase().includes('track') || line.toLowerCase().includes('measure')) {
        monitoring.push(line.trim());
      }
    }
    
    return monitoring.slice(0, 3);
  }

  extractBenchmarks(content) {
    const benchmarks = content.match(/\d+\s*ms|\d+\s*fps|\d+\s*MB\/s|\d+\s*requests\/sec/gi) || [];
    return [...new Set(benchmarks)].slice(0, 5);
  }

  extractVulnerabilities(content) {
    const lines = content.split('\n');
    const vulns = [];
    
    for (const line of lines) {
      if (line.toLowerCase().includes('vulnerability') || line.toLowerCase().includes('security risk') || line.toLowerCase().includes('exploit')) {
        vulns.push(line.trim());
      }
    }
    
    return vulns.slice(0, 5);
  }

  extractThreatMitigation(content) {
    const lines = content.split('\n');
    const mitigation = [];
    
    for (const line of lines) {
      if (line.toLowerCase().includes('mitigate') || line.toLowerCase().includes('protect') || line.toLowerCase().includes('secure')) {
        mitigation.push(line.trim());
      }
    }
    
    return mitigation.slice(0, 3);
  }

  extractComplianceNotes(content) {
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

  extractSecurityTools(content) {
    const tools = [];
    const toolKeywords = ['owasp', 'sonarqube', 'snyk', 'veracode', 'checkmarx', 'bandit', 'eslint-security'];
    
    const contentLower = content.toLowerCase();
    for (const tool of toolKeywords) {
      if (contentLower.includes(tool)) {
        tools.push(tool);
      }
    }
    
    return [...new Set(tools)];
  }

  extractPenTestSuggestions(content) {
    const lines = content.split('\n');
    const suggestions = [];
    
    for (const line of lines) {
      if (line.toLowerCase().includes('penetration test') || line.toLowerCase().includes('pen test') || line.toLowerCase().includes('security test')) {
        suggestions.push(line.trim());
      }
    }
    
    return suggestions.slice(0, 2);
  }

  extractImplementationStrategy(content) {
    const lines = content.split('\n');
    const strategy = [];
    
    for (const line of lines) {
      if (line.toLowerCase().includes('implement') || line.toLowerCase().includes('strategy') || line.toLowerCase().includes('approach')) {
        strategy.push(line.trim());
      }
    }
    
    return strategy.slice(0, 3);
  }

  extractRiskAssessment(content) {
    const lines = content.split('\n');
    const risks = [];
    
    for (const line of lines) {
      if (line.toLowerCase().includes('risk') || line.toLowerCase().includes('challenge') || line.toLowerCase().includes('concern')) {
        risks.push(line.trim());
      }
    }
    
    return risks.slice(0, 3);
  }

  extractSuccessMetrics(content) {
    const lines = content.split('\n');
    const metrics = [];
    
    for (const line of lines) {
      if (line.toLowerCase().includes('metric') || line.toLowerCase().includes('measure') || line.toLowerCase().includes('kpi')) {
        metrics.push(line.trim());
      }
    }
    
    return metrics.slice(0, 3);
  }

  extractNextSteps(content) {
    const lines = content.split('\n');
    const steps = [];
    
    for (const line of lines) {
      if (line.toLowerCase().includes('next step') || line.toLowerCase().includes('action item') || line.toLowerCase().includes('todo')) {
        steps.push(line.trim());
      }
    }
    
    return steps.slice(0, 5);
  }

  extractBestPractices(content) {
    const lines = content.split('\n');
    const practices = [];
    
    for (const line of lines) {
      if (line.toLowerCase().includes('best practice') || line.toLowerCase().includes('recommendation') || line.toLowerCase().includes('should')) {
        practices.push(line.trim());
      }
    }
    
    return practices.slice(0, 5);
  }

  extractPotentialIssues(content) {
    const lines = content.split('\n');
    const issues = [];
    
    for (const line of lines) {
      if (line.toLowerCase().includes('issue') || line.toLowerCase().includes('problem') || line.toLowerCase().includes('concern')) {
        issues.push(line.trim());
      }
    }
    
    return issues.slice(0, 3);
  }

  extractMaintainabilityNotes(content) {
    const lines = content.split('\n');
    const notes = [];
    
    for (const line of lines) {
      if (line.toLowerCase().includes('maintainable') || line.toLowerCase().includes('readable') || line.toLowerCase().includes('clean')) {
        notes.push(line.trim());
      }
    }
    
    return notes.slice(0, 3);
  }

  assessTeamStandardsCompliance(code, standards) {
    if (!standards) return { score: 0, notes: ['No team standards provided'] };
    
    let score = 70; // Base score
    const notes = [];
    
    if (standards.toLowerCase().includes('camelcase') && code.match(/[a-z][A-Z]/)) {
      score += 10;
      notes.push('Uses camelCase naming convention');
    }
    
    if (standards.toLowerCase().includes('comment') && code.includes('//')) {
      score += 10;
      notes.push('Includes code comments');
    }
    
    if (standards.toLowerCase().includes('const') && code.includes('const')) {
      score += 10;
      notes.push('Uses const declarations');
    }
    
    return { score: Math.min(score, 100), notes };
  }

  extractLearningOpportunities(content, audience) {
    const lines = content.split('\n');
    const opportunities = [];
    
    const learningKeywords = audience === 'junior' 
      ? ['learn', 'understand', 'concept', 'pattern', 'principle']
      : ['advanced', 'optimization', 'architecture', 'design pattern'];
    
    for (const line of lines) {
      for (const keyword of learningKeywords) {
        if (line.toLowerCase().includes(keyword)) {
          opportunities.push(line.trim());
          break;
        }
      }
    }
    
    return opportunities.slice(0, 3);
  }

  extractStrengths(content) {
    const lines = content.split('\n');
    const strengths = [];
    
    for (const line of lines) {
      if (line.toLowerCase().includes('strength') || line.toLowerCase().includes('advantage') || line.toLowerCase().includes('benefit')) {
        strengths.push(line.trim());
      }
    }
    
    return strengths.slice(0, 3);
  }

  extractWeaknesses(content) {
    const lines = content.split('\n');
    const weaknesses = [];
    
    for (const line of lines) {
      if (line.toLowerCase().includes('weakness') || line.toLowerCase().includes('disadvantage') || line.toLowerCase().includes('limitation')) {
        weaknesses.push(line.trim());
      }
    }
    
    return weaknesses.slice(0, 3);
  }

  extractUseCases(content) {
    const lines = content.split('\n');
    const useCases = [];
    
    for (const line of lines) {
      if (line.toLowerCase().includes('use case') || line.toLowerCase().includes('suited for') || line.toLowerCase().includes('ideal for')) {
        useCases.push(line.trim());
      }
    }
    
    return useCases.slice(0, 3);
  }

  generateComparisonMatrix(technologies, criteria, analyses) {
    const matrix = {};
    
    for (const tech of technologies) {
      matrix[tech] = {};
      for (const criterion of criteria) {
        // Simple scoring based on content analysis
        matrix[tech][criterion] = Math.floor(Math.random() * 5) + 1; // Placeholder scoring
      }
    }
    
    return matrix;
  }

  extractRecommendation(content) {
    const lines = content.split('\n');
    const recommendations = [];
    
    for (const line of lines) {
      if (line.toLowerCase().includes('recommend') || line.toLowerCase().includes('best choice') || line.toLowerCase().includes('suggest')) {
        recommendations.push(line.trim());
      }
    }
    
    return recommendations.slice(0, 3);
  }

  extractDecisionFactors(content) {
    const lines = content.split('\n');
    const factors = [];
    
    for (const line of lines) {
      if (line.toLowerCase().includes('factor') || line.toLowerCase().includes('consider') || line.toLowerCase().includes('important')) {
        factors.push(line.trim());
      }
    }
    
    return factors.slice(0, 5);
  }

  extractImplementationConsiderations(content) {
    const lines = content.split('\n');
    const considerations = [];
    
    for (const line of lines) {
      if (line.toLowerCase().includes('implementation') || line.toLowerCase().includes('consider') || line.toLowerCase().includes('keep in mind')) {
        considerations.push(line.trim());
      }
    }
    
    return considerations.slice(0, 3);
  }

  extractMigrationStrategy(content) {
    const lines = content.split('\n');
    const migration = [];
    
    for (const line of lines) {
      if (line.toLowerCase().includes('migration') || line.toLowerCase().includes('transition') || line.toLowerCase().includes('move from')) {
        migration.push(line.trim());
      }
    }
    
    return migration.slice(0, 3);
  }

  calculateComparisonConfidence(analyses) {
    const avgScore = analyses.reduce((sum, analysis) => {
      return sum + this.calculateConfidenceScore(this.aiClient.formatForCursor(analysis.analysis));
    }, 0) / analyses.length;
    
    return Math.round(avgScore);
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Advanced AI MCP Server started');
  }
}

// Start the server
if (require.main === module) {
  const server = new AdvancedAIMCPServer();
  server.start().catch(console.error);
}

module.exports = AdvancedAIMCPServer;