#!/usr/bin/env node

/**
 * Research Perplexity API documentation using the working integration
 * This will analyze available models, pricing, and optimization opportunities
 */

const WorkingPerplexityAPI = require('./WorkingPerplexityAPI.js');
const fs = require('fs').promises;

async function researchPerplexityDocumentation() {
    console.log('🔍 Researching Perplexity API documentation...\n');
    
    const api = new WorkingPerplexityAPI();
    const timestamp = new Date().toISOString();
    
    // Research queries to understand the full API
    const researchQueries = [
        {
            topic: 'Perplexity API models and capabilities',
            query: `Research the complete list of available Perplexity API models in 2025. Include:
- All available model names and identifiers
- Model capabilities (search-enabled, reasoning, etc.)  
- Performance characteristics and use cases
- Cost per token for each model
- Rate limits and usage tiers
- Any new models introduced recently

Focus on official documentation from docs.perplexity.ai/getting-started/models`,
            model: 'sonar-pro',
            maxTokens: 2000
        },
        {
            topic: 'Perplexity API pricing and cost optimization',
            query: `Research Perplexity API pricing structure and cost optimization strategies:
- Current pricing per model (per 1K tokens)
- Usage tiers and volume discounts
- Best practices for cost optimization
- Token usage patterns and estimation
- Comparison between different models for cost vs performance
- Rate limiting and quota management

Use official pricing from docs.perplexity.ai/getting-started/pricing`,
            model: 'sonar-pro',
            maxTokens: 1500
        },
        {
            topic: 'Advanced Perplexity API features and integration patterns',
            query: `Research advanced Perplexity API features and integration best practices:
- Search control and filtering options
- Streaming capabilities
- Structured outputs and response formatting  
- Image processing capabilities
- PDF upload features
- MCP server integrations
- Rate limit handling and retry strategies
- Authentication and security best practices

Include latest features from docs.perplexity.ai guides section`,
            model: 'sonar',
            maxTokens: 1500
        }
    ];
    
    const results = {};
    
    console.log('📚 Executing research queries...\n');
    
    for (const research of researchQueries) {
        console.log(`🔬 Researching: ${research.topic}`);
        console.log(`📝 Query: ${research.query.substring(0, 100)}...`);
        console.log(`🤖 Model: ${research.model}\n`);
        
        try {
            const startTime = Date.now();
            const result = await api.makeRequest(research.query, {
                model: research.model,
                maxTokens: research.maxTokens,
                temperature: 0.1, // Lower temperature for factual research
                systemPrompt: 'You are a technical research analyst with access to current web information. Provide comprehensive, accurate, and well-sourced analysis based on official documentation.'
            });
            
            const duration = Date.now() - startTime;
            
            console.log(`✅ Research completed in ${duration}ms`);
            console.log(`📊 Content length: ${result.content.length} characters`);
            console.log(`🔗 Model used: ${result.model}\n`);
            
            results[research.topic] = {
                query: research.query,
                result: result,
                duration: duration,
                timestamp: new Date().toISOString()
            };
            
            // Small delay between requests to be respectful
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            console.error(`❌ Research failed for ${research.topic}:`, error.message);
            results[research.topic] = {
                query: research.query,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
    
    // Generate comprehensive research report
    const report = {
        timestamp: timestamp,
        research_completed: Object.keys(results).length,
        total_queries: researchQueries.length,
        results: results,
        summary: {
            successful_queries: Object.values(results).filter(r => !r.error).length,
            failed_queries: Object.values(results).filter(r => r.error).length,
            total_content_generated: Object.values(results)
                .filter(r => r.result)
                .reduce((sum, r) => sum + r.result.content.length, 0)
        }
    };
    
    // Save detailed research results
    await fs.writeFile(
        'perplexity-documentation-research.json',
        JSON.stringify(report, null, 2)
    );
    
    // Generate markdown summary
    let markdown = `# Perplexity API Documentation Research Report\n\n`;
    markdown += `**Generated**: ${timestamp}\n\n`;
    markdown += `## Research Summary\n\n`;
    markdown += `- **Queries Executed**: ${report.summary.successful_queries}/${report.total_queries}\n`;
    markdown += `- **Total Content Generated**: ${report.summary.total_content_generated.toLocaleString()} characters\n\n`;
    
    for (const [topic, data] of Object.entries(results)) {
        if (data.result) {
            markdown += `## ${topic}\n\n`;
            markdown += `**Duration**: ${data.duration}ms | **Model**: ${data.result.model}\n\n`;
            markdown += `${data.result.content}\n\n`;
            markdown += `---\n\n`;
        }
    }
    
    await fs.writeFile('perplexity-documentation-research.md', markdown);
    
    console.log('\n🎉 Research Complete!');
    console.log(`📄 Detailed results: perplexity-documentation-research.json`);
    console.log(`📋 Summary report: perplexity-documentation-research.md`);
    console.log(`📊 Total content: ${report.summary.total_content_generated.toLocaleString()} characters`);
    
    return report;
}

// Execute if run directly
if (require.main === module) {
    researchPerplexityDocumentation()
        .then(report => {
            console.log('\n✨ Research completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Research failed:', error);
            process.exit(1);
        });
}

module.exports = researchPerplexityDocumentation;