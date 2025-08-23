# Perplexity Browser Research Guide

## Overview

EchoTune AI includes comprehensive Perplexity API integration for conducting advanced research with browser automation capabilities. The system provides intelligent research automation, caching, and detailed reporting for music technology platforms.

## Quick Start

### Using npm Scripts (Recommended)

```bash
# Show help and usage information
npm run perplexity:help

# Conduct research on a specific topic
npm run perplexity:research "your research query"

# Perform comprehensive repository analysis
npm run perplexity:repo-analysis
```

### Direct Script Usage

```bash
# Basic research query
node scripts/perplexity-browser-research.js "Node.js music streaming best practices"

# Repository analysis
node scripts/perplexity-browser-research.js --repo-analysis

# Show help
node scripts/perplexity-browser-research.js --help
```

## Configuration

### Environment Setup

The research tool requires the `PERPLEXITY_API_KEY` environment variable:

```bash
# Set your Perplexity API key
export PERPLEXITY_API_KEY=pplx-your-api-key-here
```

**Note:** If no API key is provided, the tool runs in demonstration mode with mock responses that are still informative and useful for testing.

### API Key Configuration

1. Get your API key from [Perplexity API](https://www.perplexity.ai/api)
2. Add it to your environment variables or `.env` file:
   ```env
   PERPLEXITY_API_KEY=pplx-your-api-key-here
   ```
3. The tool will automatically detect and use the API key

## Features

### 🔍 Research Capabilities
- **Multi-Model Support**: `sonar-pro`, `sonar`, `sonar-reasoning`
- **Domain Filtering**: Focus research on specific domains
- **Citation Tracking**: Automatic source citation and reference management
- **Intelligent Caching**: Reduces API costs and improves performance

### 📊 Repository Analysis
Comprehensive analysis covering:
- **Architecture Analysis**: Technology stack and scalability recommendations
- **MCP Integration**: Model Context Protocol implementation patterns
- **AI Music Systems**: Recommendation engines and conversational interfaces  
- **Production Deployment**: Monitoring, security, and performance optimization

### 💾 Output Management
- **JSON Reports**: Structured data with citations and metadata
- **Automatic Storage**: Results saved to `./perplexity-research-results/`
- **Timestamped Files**: Easy tracking of research sessions
- **Summary Reports**: Aggregated analysis results

## Usage Examples

### Research Specific Topics

```bash
# Music technology research
npm run perplexity:research "latest AI music recommendation algorithms"

# Node.js best practices
npm run perplexity:research "Node.js performance optimization for streaming"

# Database optimization
npm run perplexity:research "MongoDB scaling strategies for music platforms"
```

### Repository Analysis

```bash
# Full repository analysis (recommended)
npm run perplexity:repo-analysis
```

This performs comprehensive analysis of:
1. **Architecture & Technology Stack**
2. **MCP Integration Patterns**
3. **AI Music Recommendation Systems**
4. **Production Deployment & Monitoring**

### Advanced Options

The research tool supports various options for customized research:

```javascript
// Example custom research (in code)
const research = new PerplexityBrowserResearch();

const result = await research.search("query", {
  model: 'sonar-pro',           // Model selection
  domains: ['github.com'],      // Domain filtering
  recency: 'month',            // Recency filter
  max_tokens: 2000,            // Response length
  temperature: 0.3             // Response creativity
});
```

## Output Structure

### Research Results Format

```json
{
  "query": "your research query",
  "model": "sonar-pro",
  "response": "detailed research response with markdown formatting",
  "citations": [
    {
      "title": "Source Title",
      "url": "https://source-url.com"
    }
  ],
  "timestamp": "2025-08-23T20:47:07.591Z",
  "source": "perplexity_api" // or "mock_response"
}
```

### Analysis Summary Format

```json
{
  "analysisComplete": true,
  "totalAnalyses": 4,
  "successfulAnalyses": 4,
  "timestamp": "2025-08-23T20:47:07.591Z",
  "results": [...],
  "outputDirectory": "./perplexity-research-results"
}
```

## Integration with EchoTune AI

The Perplexity browser research tool integrates seamlessly with the EchoTune AI platform:

### MCP Server Integration
- **MCP Server**: `mcp-servers/perplexity-mcp/perplexity-mcp-server.js`
- **Enhanced Features**: Caching, rate limiting, performance monitoring
- **Cost Management**: Budget controls and usage tracking

### Browser Automation
- **Research Validation**: Browser-based source verification
- **Evidence Collection**: Automated data gathering from web sources
- **Cross-referencing**: Multi-source validation and fact-checking

## Troubleshooting

### Common Issues

1. **API Key Not Found**
   ```
   ⚠️ PERPLEXITY_API_KEY not found or invalid
   ```
   **Solution**: Set the environment variable or use mock mode for testing

2. **Rate Limiting**
   ```
   ❌ Research failed: HTTP 429
   ```
   **Solution**: The tool automatically handles rate limiting and retries

3. **Network Issues**
   ```
   ⚠️ API error: Request timeout
   ```
   **Solution**: Tool automatically falls back to mock responses

### Mock Mode Benefits

Even without an API key, the tool provides:
- **Educational Responses**: Informative mock responses for learning
- **System Testing**: Validate integration without API costs
- **Development Environment**: Work offline during development

## Best Practices

### Efficient Research
1. **Use Specific Queries**: More specific queries yield better results
2. **Domain Filtering**: Use domain filters for focused research
3. **Batch Queries**: Use repository analysis for comprehensive coverage
4. **Review Citations**: Always check source citations for accuracy

### Cost Management
1. **Mock Mode**: Use for development and testing
2. **Caching**: Results are automatically cached to reduce API calls
3. **Targeted Queries**: Specific queries are more cost-effective
4. **Batch Processing**: Repository analysis optimizes API usage

## Advanced Features

### Custom Research Workflows

You can create custom research workflows by extending the base class:

```javascript
const PerplexityBrowserResearch = require('./scripts/perplexity-browser-research.js');

class CustomResearchWorkflow extends PerplexityBrowserResearch {
  async musicTrendAnalysis() {
    const trends = await this.search("current music streaming trends");
    const technology = await this.search("music platform technology innovations");
    
    return {
      trends,
      technology,
      summary: this.generateTrendSummary(trends, technology)
    };
  }
}
```

### Integration with CI/CD

Add research automation to your GitHub workflows:

```yaml
- name: Research Analysis
  run: npm run perplexity:repo-analysis
  env:
    PERPLEXITY_API_KEY: ${{ secrets.PERPLEXITY_API_KEY }}
```

## Next Steps

1. **Get API Key**: Sign up for Perplexity API access
2. **Run Repository Analysis**: Use `npm run perplexity:repo-analysis`
3. **Explore Results**: Review generated reports and insights
4. **Integrate Findings**: Apply research insights to your development

## Support

For issues or questions about perplexity browser research:
- Check the generated results in `./perplexity-research-results/`
- Review the mock responses for guidance even without API access
- Examine the MCP server implementation for advanced integration patterns

---

**The perplexity browser research system provides powerful research capabilities for the EchoTune AI platform, supporting both development and production use cases with intelligent fallbacks and comprehensive reporting.**