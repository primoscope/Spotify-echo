#!/usr/bin/env node

/**
 * Enhanced Perplexity Deep Search Integration
 * 
 * Advanced deep search and research capabilities using Perplexity models
 * including sonar-pro for Grok-like analytical capabilities and web search
 */

require('dotenv').config();

const https = require('https');
const fs = require('fs').promises;
const path = require('path');

class PerplexityDeepSearch {
  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY;
    this.baseUrl = process.env.PERPLEXITY_BASE_URL || 'https://api.perplexity.ai';
    
    // Enhanced model selection
    this.models = {
      'sonar-pro': {
        description: 'Advanced reasoning and analysis (Grok-like capabilities)',
        maxTokens: 4000,
        bestFor: ['analysis', 'reasoning', 'complex_queries'],
        webSearch: true
      },
      'sonar': {
        description: 'Real-time web search and information retrieval',
        maxTokens: 2000,
        bestFor: ['search', 'current_events', 'facts'],
        webSearch: true
      },
      'llama-3.1-8b-instruct': {
        description: 'Fast general-purpose model',
        maxTokens: 8192,
        bestFor: ['coding', 'analysis', 'general_tasks'],
        webSearch: false
      },
      'llama-3.1-70b-instruct': {
        description: 'High-quality reasoning model',
        maxTokens: 8192,
        bestFor: ['complex_reasoning', 'detailed_analysis'],
        webSearch: false
      }
    };
  }

  /**
   * Perform deep search with intelligent model selection
   */
  async performDeepSearch(query, options = {}) {
    const {
      searchType = 'comprehensive', // comprehensive, quick, technical, current
      includeAnalysis = true,
      includeCitations = true,
      maxResults = 10,
      customModel = null
    } = options;

    console.log(`🔍 Starting deep search: "${query}"`);
    console.log(`📊 Search type: ${searchType}`);

    try {
      const model = customModel || this.selectOptimalModel(searchType, query);
      console.log(`🤖 Using model: ${model} (${this.models[model]?.description})`);

      const searchResults = await this.executeSearch(query, model, {
        searchType,
        includeAnalysis,
        includeCitations,
        maxResults
      });

      return searchResults;

    } catch (error) {
      console.error(`❌ Deep search failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Repository-focused deep analysis
   */
  async analyzeRepository(repoPath, analysisType = 'comprehensive') {
    console.log(`🔍 Starting repository analysis: ${repoPath}`);

    try {
      // Gather repository structure
      const structure = await this.analyzeRepositoryStructure(repoPath);
      
      // Create analysis prompt based on type
      let analysisPrompt;
      switch (analysisType) {
        case 'security':
          analysisPrompt = this.createSecurityAnalysisPrompt(structure);
          break;
        case 'architecture':
          analysisPrompt = this.createArchitectureAnalysisPrompt(structure);
          break;
        case 'performance':
          analysisPrompt = this.createPerformanceAnalysisPrompt(structure);
          break;
        default:
          analysisPrompt = this.createComprehensiveAnalysisPrompt(structure);
      }

      const analysis = await this.executeSearch(analysisPrompt, 'sonar-pro', {
        searchType: 'analysis',
        includeAnalysis: true,
        maxTokens: 2000
      });

      return {
        repository: repoPath,
        analysisType,
        structure,
        analysis,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Repository analysis failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Multi-model research with cross-validation
   */
  async performMultiModelResearch(topic, models = ['sonar-pro', 'sonar']) {
    console.log(`🔬 Starting multi-model research on: ${topic}`);

    const results = {};

    for (const model of models) {
      console.log(`🤖 Researching with ${model}...`);
      
      try {
        const modelResult = await this.executeSearch(
          `Research and analyze: ${topic}. Provide comprehensive insights with current information.`,
          model,
          {
            searchType: 'research',
            includeAnalysis: true,
            maxTokens: this.models[model]?.maxTokens || 1000
          }
        );

        results[model] = {
          ...modelResult,
          modelCapabilities: this.models[model]
        };

      } catch (error) {
        console.error(`⚠️  ${model} research failed: ${error.message}`);
        results[model] = {
          error: error.message,
          modelCapabilities: this.models[model]
        };
      }
    }

    // Synthesize results
    const synthesis = await this.synthesizeMultiModelResults(topic, results);

    return {
      topic,
      models: models,
      results,
      synthesis,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Real-time trend analysis
   */
  async analyzeTrends(domain, timeframe = 'current') {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });

    const trendQuery = `Analyze the latest trends in ${domain} for ${timeframe === 'current' ? currentMonth + ' ' + currentYear : timeframe}. Focus on:
1. Emerging technologies and innovations
2. Market shifts and developments  
3. Key players and their strategies
4. Future outlook and predictions

Provide specific examples and data where available.`;

    console.log(`📈 Analyzing trends in ${domain} for ${timeframe}`);

    try {
      const trendAnalysis = await this.executeSearch(trendQuery, 'sonar-pro', {
        searchType: 'trends',
        includeAnalysis: true,
        includeCitations: true,
        maxTokens: 2500
      });

      return {
        domain,
        timeframe,
        analysis: trendAnalysis,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Trend analysis failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Select optimal model based on query type and content
   */
  selectOptimalModel(searchType, query) {
    const queryLower = query.toLowerCase();

    // Technical/coding queries
    if (queryLower.includes('code') || queryLower.includes('programming') || 
        queryLower.includes('algorithm') || queryLower.includes('javascript') ||
        queryLower.includes('python') || queryLower.includes('api')) {
      return searchType === 'comprehensive' ? 'llama-3.1-70b-instruct' : 'llama-3.1-8b-instruct';
    }

    // Current events/news
    if (queryLower.includes('latest') || queryLower.includes('recent') || 
        queryLower.includes('news') || queryLower.includes('current') ||
        queryLower.includes('2025') || queryLower.includes('today')) {
      return 'sonar';
    }

    // Complex analysis/reasoning
    if (searchType === 'comprehensive' || queryLower.includes('analyze') ||
        queryLower.includes('compare') || queryLower.includes('evaluate')) {
      return 'sonar-pro';
    }

    // Default to sonar-pro for general queries
    return 'sonar-pro';
  }

  /**
   * Execute search with specific model
   */
  async executeSearch(query, model, options = {}) {
    const {
      searchType = 'general',
      includeAnalysis = true,
      includeCitations = false,
      maxTokens = 1000
    } = options;

    const enhancedQuery = this.enhanceQuery(query, searchType, includeAnalysis, includeCitations);
    
    const response = await this.makePerplexityRequest(enhancedQuery, model, {
      max_tokens: Math.min(maxTokens, this.models[model]?.maxTokens || 1000),
      temperature: searchType === 'analysis' ? 0.2 : 0.3
    });

    return {
      query: enhancedQuery,
      model,
      response: response.choices[0].message.content,
      usage: response.usage,
      searchType,
      webSearchUsed: this.models[model]?.webSearch || false,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Enhance query based on search type
   */
  enhanceQuery(query, searchType, includeAnalysis, includeCitations) {
    let enhancedQuery = query;

    switch (searchType) {
      case 'comprehensive':
        enhancedQuery = `Provide a comprehensive analysis of: ${query}

Please include:
- Key insights and findings
- Supporting evidence and examples
- Multiple perspectives
- Practical implications
${includeCitations ? '- Source references' : ''}`;
        break;

      case 'technical':
        enhancedQuery = `As a technical expert, analyze: ${query}

Focus on:
- Technical specifications and details
- Implementation considerations
- Best practices and standards
- Performance implications
- Security considerations`;
        break;

      case 'trends':
        enhancedQuery = `Analyze current trends and developments related to: ${query}

Include:
- Latest innovations and breakthroughs
- Market movements and changes
- Key players and strategies
- Future predictions and outlook
- Statistical data where available`;
        break;

      case 'research':
        enhancedQuery = `Conduct thorough research on: ${query}

Provide:
- Factual information from multiple sources
- Different viewpoints and perspectives
- Historical context where relevant
- Recent developments and updates
${includeCitations ? '- Credible source citations' : ''}`;
        break;
    }

    return enhancedQuery;
  }

  /**
   * Make Perplexity API request
   */
  async makePerplexityRequest(query, model, options = {}) {
    const requestData = {
      model: model,
      messages: [
        {
          role: 'user',
          content: query
        }
      ],
      max_tokens: options.max_tokens || 1000,
      temperature: options.temperature || 0.3,
      top_p: options.top_p || 1.0
    };

    const postData = JSON.stringify(requestData);

    return new Promise((resolve, reject) => {
      const requestOptions = {
        hostname: 'api.perplexity.ai',
        port: 443,
        path: '/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(requestOptions, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            
            if (res.statusCode === 200) {
              resolve(response);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${response.error?.message || data}`));
            }
          } catch (error) {
            reject(new Error(`Response parsing failed: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Analyze repository structure
   */
  async analyzeRepositoryStructure(repoPath) {
    const structure = {
      totalFiles: 0,
      directories: [],
      fileTypes: {},
      keyFiles: [],
      packageManagers: []
    };

    async function analyzeDir(dir, depth = 0) {
      if (depth > 3) return; // Limit recursion depth

      try {
        const items = await fs.readdir(dir);
        
        for (const item of items) {
          if (item.startsWith('.') && item !== '.env') continue;
          
          const itemPath = path.join(dir, item);
          const stat = await fs.stat(itemPath);
          
          if (stat.isDirectory()) {
            structure.directories.push(path.relative(repoPath, itemPath));
            await analyzeDir(itemPath, depth + 1);
          } else {
            structure.totalFiles++;
            const ext = path.extname(item);
            structure.fileTypes[ext] = (structure.fileTypes[ext] || 0) + 1;
            
            // Identify key files
            if (['package.json', 'requirements.txt', 'Dockerfile', 'docker-compose.yml', 
                 'README.md', '.env', 'tsconfig.json'].includes(item)) {
              structure.keyFiles.push(path.relative(repoPath, itemPath));
            }
            
            // Identify package managers
            if (item === 'package.json') structure.packageManagers.push('npm');
            if (item === 'requirements.txt') structure.packageManagers.push('pip');
            if (item === 'Gemfile') structure.packageManagers.push('bundler');
            if (item === 'composer.json') structure.packageManagers.push('composer');
          }
        }
      } catch (error) {
        // Skip inaccessible directories
      }
    }

    await analyzeDir(repoPath);
    return structure;
  }

  /**
   * Create comprehensive analysis prompt
   */
  createComprehensiveAnalysisPrompt(structure) {
    return `Analyze this software repository structure and provide comprehensive insights:

Repository Statistics:
- Total files: ${structure.totalFiles}
- Directories: ${structure.directories.length}
- File types: ${Object.keys(structure.fileTypes).join(', ')}
- Key files: ${structure.keyFiles.join(', ')}
- Package managers: ${structure.packageManagers.join(', ')}

Main directories: ${structure.directories.slice(0, 10).join(', ')}

Please provide:
1. Overall architecture assessment
2. Technology stack identification
3. Code organization evaluation
4. Potential improvements and recommendations
5. Best practices adherence
6. Scalability considerations

Focus on actionable insights and specific recommendations.`;
  }

  /**
   * Create security analysis prompt
   */
  createSecurityAnalysisPrompt(structure) {
    return `Perform a security-focused analysis of this repository structure:

Repository Details:
- Key files: ${structure.keyFiles.join(', ')}
- File types: ${Object.keys(structure.fileTypes).join(', ')}
- Package managers: ${structure.packageManagers.join(', ')}

Focus on:
1. Security-sensitive file patterns
2. Dependency management security
3. Configuration security concerns
4. Common vulnerability patterns
5. Security best practices recommendations
6. Potential attack vectors

Provide specific, actionable security recommendations.`;
  }

  /**
   * Create architecture analysis prompt
   */
  createArchitectureAnalysisPrompt(structure) {
    return `Analyze the software architecture of this repository:

Structure Overview:
- Total files: ${structure.totalFiles}
- Key directories: ${structure.directories.slice(0, 10).join(', ')}
- Technology indicators: ${structure.keyFiles.join(', ')}
- Package managers: ${structure.packageManagers.join(', ')}

Analyze:
1. Architectural patterns and design principles
2. Module organization and separation of concerns
3. Technology stack appropriateness
4. Scalability and maintainability aspects
5. Integration patterns
6. Recommended architectural improvements

Provide detailed architectural insights and improvement suggestions.`;
  }

  /**
   * Create performance analysis prompt
   */
  createPerformanceAnalysisPrompt(structure) {
    return `Evaluate performance aspects of this repository:

Codebase Metrics:
- File count: ${structure.totalFiles}
- File types distribution: ${JSON.stringify(structure.fileTypes)}
- Key performance-related files: ${structure.keyFiles.filter(f => 
      f.includes('package') || f.includes('docker') || f.includes('config')).join(', ')}

Focus on:
1. Performance bottleneck indicators
2. Optimization opportunities
3. Resource usage patterns
4. Caching strategies
5. Database and API efficiency
6. Build and deployment performance

Provide specific performance optimization recommendations.`;
  }

  /**
   * Synthesize multi-model results
   */
  async synthesizeMultiModelResults(topic, results) {
    const synthesisPrompt = `Synthesize insights from multiple AI model analyses of "${topic}":

${Object.entries(results).map(([model, result]) => 
  `${model.toUpperCase()} Analysis:\n${result.response || result.error}\n`
).join('\n')}

Provide:
1. Common themes and consistent findings
2. Conflicting information and differing perspectives
3. Most reliable insights based on model capabilities
4. Comprehensive conclusion integrating all perspectives
5. Confidence assessment of key findings

Focus on creating a unified, actionable synthesis.`;

    try {
      const synthesis = await this.executeSearch(synthesisPrompt, 'sonar-pro', {
        searchType: 'analysis',
        maxTokens: 1500
      });

      return synthesis.response;
    } catch (error) {
      return `Synthesis failed: ${error.message}`;
    }
  }

  /**
   * Save results to file
   */
  async saveResults(results, filename) {
    const resultsDir = path.join(process.cwd(), 'search-results');
    
    try {
      await fs.mkdir(resultsDir, { recursive: true });
      const filePath = path.join(resultsDir, filename);
      await fs.writeFile(filePath, JSON.stringify(results, null, 2));
      console.log(`📁 Results saved to: ${filePath}`);
      return filePath;
    } catch (error) {
      console.error(`❌ Failed to save results: ${error.message}`);
      throw error;
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🔍 Enhanced Perplexity Deep Search Tool

Usage:
  node enhanced-perplexity-deep-search.js [command] [options]

Commands:
  search <query>              - Perform deep search
  analyze-repo <path>         - Analyze repository structure
  multi-search <topic>        - Multi-model research
  trends <domain>             - Analyze trends

Examples:
  node enhanced-perplexity-deep-search.js search "latest AI music recommendation systems"
  node enhanced-perplexity-deep-search.js analyze-repo .
  node enhanced-perplexity-deep-search.js multi-search "EchoTune AI architecture"
  node enhanced-perplexity-deep-search.js trends "AI music technology"
`);
    return;
  }

  const searcher = new PerplexityDeepSearch();
  const command = args[0];

  try {
    let results;
    let filename;

    switch (command) {
      case 'search':
        if (!args[1]) throw new Error('Query required for search command');
        results = await searcher.performDeepSearch(args[1], {
          searchType: args[2] || 'comprehensive'
        });
        filename = `search-${Date.now()}.json`;
        break;

      case 'analyze-repo':
        const repoPath = args[1] || process.cwd();
        results = await searcher.analyzeRepository(repoPath, args[2] || 'comprehensive');
        filename = `repo-analysis-${Date.now()}.json`;
        break;

      case 'multi-search':
        if (!args[1]) throw new Error('Topic required for multi-search command');
        results = await searcher.performMultiModelResearch(args[1]);
        filename = `multi-search-${Date.now()}.json`;
        break;

      case 'trends':
        if (!args[1]) throw new Error('Domain required for trends command');
        results = await searcher.analyzeTrends(args[1], args[2] || 'current');
        filename = `trends-${Date.now()}.json`;
        break;

      default:
        throw new Error(`Unknown command: ${command}`);
    }

    await searcher.saveResults(results, filename);
    console.log('\n✅ Deep search completed successfully!');
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = PerplexityDeepSearch;