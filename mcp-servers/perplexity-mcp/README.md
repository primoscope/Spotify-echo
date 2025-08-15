# Perplexity MCP Server

A minimal Model Context Protocol (MCP) server for Perplexity AI research capabilities.

## Features

- 🔍 **Research Queries** - Ask questions and get AI-powered research answers
- 📚 **Citation Support** - Automatic citation extraction from Perplexity responses
- 🚀 **Performance Optimized** - Built-in caching with configurable expiry
- 🔒 **Secure** - Environment-based API key management
- 📦 **Resource Efficient** - Memory ≤256MB, CPU ≤0.5 core

## Setup

### Environment Variables

```bash
# Required
PERPLEXITY_API_KEY=pplx-your-api-key-here

# Optional
PERPLEXITY_BASE_URL=https://api.perplexity.ai  # Default
PERPLEXITY_MODEL=llama-3.1-sonar-small-128k-online  # Default
```

### Installation

```bash
# Install dependencies (handled by main package.json)
npm install

# Test the server
npm run testperplexity
```

## Usage

### Direct Testing

```bash
# Start the server
node perplexity-mcp-server.js

# Or use npm script
npm run mcpperplexity
```

### MCP Client Integration

The server exposes one tool:

#### `query`
Research any topic with Perplexity AI.

**Parameters:**
- `q` (string, required) - Query string for research
- `opts` (object, optional) - Additional options:
  - `model` (string) - Perplexity model to use
  - `max_tokens` (number) - Maximum tokens in response  
  - `temperature` (number) - Response temperature
  - `domain_filter` (array) - Filter to specific domains
  - `recency_filter` (string) - Time filter: 'hour', 'day', 'week', 'month', 'year'

**Example:**
```javascript
{
  "q": "What are the latest developments in AI music generation?",
  "opts": {
    "model": "llama-3.1-sonar-large-128k-online",
    "max_tokens": 2000,
    "temperature": 0.3,
    "recency_filter": "week"
  }
}
```

## Performance Budgets

- **Memory**: ≤256MB per instance
- **CPU**: ≤0.5 core per instance  
- **Latency**: p95 ≤1500ms for Perplexity queries
- **Cache Hit Rate**: Target >30% for repeated queries

## Validation

The server includes health checks:

```bash
# Health check endpoint
curl http://localhost:3000/health

# Smoke test
npm run testperplexity
```

## Caching

- **Built-in Memory Cache** - 100 entries, 5-minute expiry
- **Redis Integration** - Falls back to Redis if available via `src/utils/redis-manager.js`
- **Cache Headers** - Includes cache hit/miss information in responses

## Integration

This server is automatically registered by the enhanced MCP orchestrator when `PERPLEXITY_API_KEY` is present. It integrates with:

- 🤖 **Copilot Coding Agent** - For automated research workflows
- 🎯 **Cursor IDE** - Via generated MCP config
- 📊 **Analytics Dashboard** - Performance and usage metrics
- 🔄 **Validation Pipeline** - Automated health and performance checks

## Error Handling

The server handles common scenarios:
- Missing API key (graceful degradation)
- Rate limiting (exponential backoff)
- Network timeouts (configurable)
- Invalid queries (informative error messages)

## Security Notes

- API keys stored in environment variables only
- No logging of sensitive data
- Request validation for all inputs
- Resource limits enforced by orchestrator

## Development

### Adding New Tools

1. Add tool definition to `ListToolsRequestSchema` handler
2. Implement handler in `CallToolRequestSchema` 
3. Add validation and error handling
4. Update README with new tool documentation

### Testing

```bash
# Unit tests
npm test mcp-servers/perplexity-mcp/

# Integration tests  
npm run mcp:validate

# Performance tests
npm run mcp:test:performance
```

## Troubleshooting

**Server not starting:**
- Check `PERPLEXITY_API_KEY` is set
- Verify network connectivity to Perplexity API
- Check Node.js version (≥18 required)

**High latency:**
- Check Perplexity API status
- Consider using smaller models for faster responses
- Verify cache is working properly

**Memory issues:**
- Monitor cache size (max 100 entries)
- Check for memory leaks in long-running processes
- Consider restarting if memory usage exceeds 256MB