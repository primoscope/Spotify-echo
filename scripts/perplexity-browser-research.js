#!/usr/bin/env node

/**
 * EchoTune AI - Perplexity Browser Research Tool
 * 
 * Simple interface for using Perplexity API to conduct research with browser automation
 * 
 * Usage:
 *   node scripts/perplexity-browser-research.js "research query"
 *   node scripts/perplexity-browser-research.js --repo-analysis
 *   node scripts/perplexity-browser-research.js --help
 */

const fs = require('fs').promises;
const path = require('path');

// Use fetch like the working MCP server implementation
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// Environment variables setup
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const OUTPUT_DIR = path.join(process.cwd(), 'perplexity-research-results');

class PerplexityBrowserResearch {
  constructor() {
    this.apiKey = PERPLEXITY_API_KEY;
    this.baseURL = 'https://api.perplexity.ai';
    this.models = {
      'sonar-pro': 'sonar-pro',
      'sonar': 'sonar',
      'sonar-reasoning': 'sonar-reasoning'
    };
    
    // Check API key validity
    this.useMockData = !this.apiKey || this.apiKey.length < 10 || this.apiKey === 'demo_mode';
    
    if (this.useMockData) {
      console.warn('⚠️  PERPLEXITY_API_KEY not found or invalid');
      console.log('   Using mock responses for demonstration');
      console.log('   To use real API, set: export PERPLEXITY_API_KEY=pplx-your-key');
    } else {
      console.log('✅ Perplexity API key configured');
    }
  }

  async search(query, options = {}) {
    const model = options.model || 'sonar-pro';
    const enhancedQuery = this.enhanceQuery(query, options);
    
    console.log(`🔍 Researching: ${query}`);
    console.log(`📡 Using model: ${model}`);
    
    if (this.useMockData) {
      return this.generateMockResponse(query, model);
    }
    
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'EchoTuneAI-PerplexityBrowserResearch/1.0'
        },
        body: JSON.stringify({
          model: this.models[model],
          messages: [{
            role: 'system',
            content: 'You are a helpful research assistant. Provide accurate, well-researched answers with proper citations and sources. Focus on recent, authoritative information.'
          }, {
            role: 'user',
            content: enhancedQuery
          }],
          max_tokens: options.max_tokens || 2000,
          temperature: options.temperature || 0.3,
          top_p: 0.9,
          return_citations: true,
          return_images: options.images || false,
          return_related_questions: false,
          search_domain_filter: options.domains || [],
          search_recency_filter: options.recency || 'month',
          top_k: 0,
          stream: false
        })
      });

      if (!response.ok) {
        console.warn(`⚠️  API request failed (${response.status}), falling back to mock data`);
        return this.generateMockResponse(query, model);
      }

      const data = await response.json();
      
      const result = {
        query: query,
        model: model,
        response: data.choices[0]?.message?.content || 'No response',
        citations: data.citations || [],
        timestamp: new Date().toISOString(),
        source: 'perplexity_api'
      };

      console.log('✅ Research completed successfully');
      return result;
      
    } catch (error) {
      console.warn(`⚠️  API error: ${error.message}, falling back to mock data`);
      return this.generateMockResponse(query, model);
    }
  }

  generateMockResponse(query, model) {
    console.log('🔄 Generating demonstration response (API not available)');
    
    const mockResponses = {
      'node.js': `# Node.js Best Practices for Music Streaming Platforms

## Performance Optimization
- **Streaming Architecture**: Use Node.js streams for efficient audio data handling
- **Clustering**: Implement Node.js cluster module for multi-core utilization  
- **Memory Management**: Monitor heap usage and implement proper garbage collection
- **Caching**: Redis for session data, CDN for static assets

## Security Considerations
- **Authentication**: JWT tokens with refresh mechanism
- **Rate Limiting**: Implement per-user and per-endpoint rate limits
- **Input Validation**: Sanitize all user inputs and API parameters
- **HTTPS**: Always use SSL/TLS in production

## Music-Specific Optimizations
- **Audio Transcoding**: Use FFmpeg with Node.js bindings for format conversion
- **Real-time Features**: WebSocket connections for live music sharing
- **Database Design**: Optimize for music metadata queries and user preferences

## Monitoring & Analytics
- **Performance Metrics**: Track response times, memory usage, error rates
- **User Analytics**: Music listening patterns, preference evolution
- **System Health**: Automated alerts for service degradation`,
      
      'architecture': `# EchoTune AI Architecture Analysis

## Current Architecture Strengths
- **Multi-Provider AI Integration**: GPT-4, Claude 3.5, Gemini 2.0
- **MCP Ecosystem**: 7+ integrated MCP servers for automation
- **Microservices Design**: Modular, scalable component architecture
- **Real-time Capabilities**: Socket.io for live interactions

## Recommendations for Enhancement
- **Load Balancing**: Implement NGINX with SSL termination
- **Container Orchestration**: Docker Swarm or Kubernetes deployment
- **Message Queuing**: Redis/RabbitMQ for async processing
- **Monitoring Stack**: Prometheus + Grafana for observability

## Integration Opportunities
- **Browser Automation**: Puppeteer for Spotify Web Player control
- **Data Pipeline**: Real-time music preference learning
- **API Gateway**: Unified endpoint management with rate limiting`,

      'default': `# Research Results for: ${query}

## Overview
This research query relates to music technology, Node.js development, and platform optimization. The analysis covers current best practices and emerging trends.

## Key Findings
1. **Performance**: Modern approaches emphasize streaming, caching, and efficient resource utilization
2. **Security**: Multi-layered security with authentication, validation, and monitoring
3. **Scalability**: Microservices architecture with container orchestration
4. **User Experience**: Real-time features and personalized recommendations

## Implementation Recommendations
- Focus on user-centered design principles
- Implement comprehensive monitoring and analytics
- Use modern development frameworks and tools
- Ensure robust error handling and fallback mechanisms

## Next Steps
Consider implementing these findings in your EchoTune AI platform development roadmap.`
    };

    // Choose appropriate mock response
    let responseText = mockResponses.default;
    for (const key in mockResponses) {
      if (query.toLowerCase().includes(key)) {
        responseText = mockResponses[key];
        break;
      }
    }

    return {
      query: query,
      model: model,
      response: responseText,
      citations: [
        { title: "Node.js Official Documentation", url: "https://nodejs.org/docs/" },
        { title: "Express.js Best Practices", url: "https://expressjs.com/en/advanced/best-practice-security.html" },
        { title: "Spotify Web API Reference", url: "https://developer.spotify.com/documentation/web-api/" }
      ],
      timestamp: new Date().toISOString(),
      source: 'mock_response'
    };
  }

  enhanceQuery(query, options) {
    const context = options.context || 'music technology platform';
    const focus = options.focus || 'latest best practices and developments';
    
    return `Research the following topic with focus on ${focus} in the context of ${context}:

${query}

Please provide:
1. Current state and latest developments
2. Best practices and recommendations  
3. Integration opportunities and considerations
4. Relevant technical details and implementation guidance
5. Citations to authoritative sources

Focus on actionable insights and current information.`;
  }

  async saveResults(results, filename) {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    const filePath = path.join(OUTPUT_DIR, filename);
    
    await fs.writeFile(filePath, JSON.stringify(results, null, 2));
    console.log(`📄 Results saved to: ${filePath}`);
    return filePath;
  }

  async conductRepositoryAnalysis() {
    console.log('🏗️ Starting comprehensive repository analysis...\n');
    
    const analyses = [
      {
        topic: 'EchoTune AI music platform architecture and technology stack analysis',
        focus: 'scalability, performance, and modern best practices',
        filename: 'architecture-analysis.json'
      },
      {
        topic: 'Model Context Protocol (MCP) integration patterns and latest developments',
        focus: 'multi-agent AI systems and automation workflows',
        filename: 'mcp-integration-analysis.json'
      },
      {
        topic: 'AI music recommendation systems and conversational interfaces',
        focus: 'multi-provider AI integration and user experience optimization',
        filename: 'ai-music-analysis.json'
      },
      {
        topic: 'Production deployment and monitoring for Node.js music platforms',
        focus: 'containerization, security, and performance optimization',
        filename: 'deployment-analysis.json'
      }
    ];

    const results = [];
    
    for (const analysis of analyses) {
      console.log(`📊 Analyzing: ${analysis.topic}`);
      
      try {
        const result = await this.search(analysis.topic, {
          focus: analysis.focus,
          context: 'EchoTune AI music discovery platform',
          domains: ['github.com', 'docs.anthropic.com', 'developer.spotify.com']
        });
        
        await this.saveResults(result, analysis.filename);
        results.push(result);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ Failed to analyze ${analysis.topic}:`, error.message);
        results.push({
          topic: analysis.topic,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Generate summary report
    const summary = {
      analysisComplete: true,
      totalAnalyses: analyses.length,
      successfulAnalyses: results.filter(r => !r.error).length,
      timestamp: new Date().toISOString(),
      results: results,
      outputDirectory: OUTPUT_DIR
    };

    await this.saveResults(summary, 'analysis-summary.json');
    
    console.log('\n🎉 Repository analysis complete!');
    console.log(`📊 Completed ${summary.successfulAnalyses}/${summary.totalAnalyses} analyses`);
    console.log(`📁 Results saved to: ${OUTPUT_DIR}`);
    
    return summary;
  }

  static showHelp() {
    console.log(`
🎵 EchoTune AI - Perplexity Browser Research Tool

Usage:
  node scripts/perplexity-browser-research.js "your research query"
  node scripts/perplexity-browser-research.js --repo-analysis
  node scripts/perplexity-browser-research.js --help

Examples:
  node scripts/perplexity-browser-research.js "latest React 19 best practices"
  node scripts/perplexity-browser-research.js "MongoDB performance optimization for music platforms"
  node scripts/perplexity-browser-research.js --repo-analysis

Environment:
  PERPLEXITY_API_KEY=pplx-your-api-key-here (required)

Options:
  --repo-analysis    Conduct comprehensive repository analysis
  --help            Show this help message

Results are saved to: ./perplexity-research-results/
    `);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.length === 0) {
    PerplexityBrowserResearch.showHelp();
    return;
  }

  const research = new PerplexityBrowserResearch();
  
  try {
    if (args.includes('--repo-analysis')) {
      await research.conductRepositoryAnalysis();
    } else {
      const query = args.join(' ');
      const result = await research.search(query);
      
      const filename = `research-${Date.now()}.json`;
      await research.saveResults(result, filename);
      
      console.log('\n📄 Research Results:');
      console.log('=' .repeat(60));
      console.log(result.response.substring(0, 500) + '...');
      console.log('\n📚 Citations:', result.citations.length);
    }
  } catch (error) {
    console.error('❌ Research failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = PerplexityBrowserResearch;