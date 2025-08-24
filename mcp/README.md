# MCP Servers for EchoTune AI

This directory contains Model Context Protocol (MCP) servers that provide observability and monitoring capabilities for the EchoTune AI application stack.

## Overview

The MCP servers implement the Model Context Protocol to expose system metrics, database statistics, and API health information in a standardized way. Each server can be used standalone or integrated with MCP-compatible clients.

## Available Servers

### 1. Redis Server (`redis-server.js`)

Provides Redis cache metrics and observability.

**Tools Available:**
- `get_redis_info` - Get Redis server information and stats
- `get_redis_metrics` - Get Redis performance metrics (JSON/Prometheus format)  
- `get_cache_stats` - Get EchoTune cache usage statistics
- `check_redis_health` - Perform Redis health check with latency test

**Usage:**
```bash
# Run standalone
node mcp/servers/redis-server.js

# Test with MCP client
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node mcp/servers/redis-server.js
```

**Environment Variables:**
- `REDIS_URL` - Redis connection URL (default: redis://localhost:6379)
- `REDIS_PASSWORD` - Redis password (if required)

### 2. MongoDB Server (`mongodb-server.js`)

Provides MongoDB database statistics and collection metrics.

**Tools Available:**
- `get_database_stats` - Get MongoDB database statistics and metrics
- `get_collection_stats` - Get statistics for collections
- `check_mongodb_health` - Perform MongoDB health check
- `get_index_stats` - Get index usage statistics
- `get_slow_operations` - Get currently running slow operations

**Usage:**
```bash
# Run standalone
node mcp/servers/mongodb-server.js

# Test with MCP client
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node mcp/servers/mongodb-server.js
```

**Environment Variables:**
- `MONGODB_URI` - MongoDB connection URI (default: mongodb://localhost:27017/echotune)

### 3. Spotify Server (`spotify-server.js`)

Provides Spotify API health monitoring and limited API testing capabilities.

**Tools Available:**
- `check_spotify_api_health` - Check Spotify API connectivity and rate limits
- `get_api_rate_limits` - Get current Spotify API rate limit status
- `get_market_info` - Get available markets and regions
- `search_tracks_sample` - Perform sample track search for testing
- `get_audio_features_sample` - Get audio features for a sample track
- `get_spotify_metrics` - Get comprehensive Spotify API usage metrics

**Usage:**
```bash
# Run standalone  
node mcp/servers/spotify-server.js

# Test with MCP client
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node mcp/servers/spotify-server.js
```

**Environment Variables:**
- `SPOTIFY_CLIENT_ID` - Spotify API client ID
- `SPOTIFY_CLIENT_SECRET` - Spotify API client secret

## Installation

### Prerequisites

1. Node.js 20+ installed
2. Required dependencies from main project:
   ```bash
   npm install @modelcontextprotocol/sdk mongodb axios
   ```

3. Redis server running (for redis-server.js)
4. MongoDB server running (for mongodb-server.js)
5. Spotify API credentials (for spotify-server.js)

### Quick Start

1. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Test individual servers:**
   ```bash
   # Test Redis server
   node mcp/servers/redis-server.js <<< '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
   
   # Test MongoDB server
   node mcp/servers/mongodb-server.js <<< '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
   
   # Test Spotify server
   node mcp/servers/spotify-server.js <<< '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
   ```

3. **Call specific tools:**
   ```bash
   # Get Redis health
   echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"check_redis_health","arguments":{}}}' | node mcp/servers/redis-server.js
   
   # Get MongoDB stats
   echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_database_stats","arguments":{}}}' | node mcp/servers/mongodb-server.js
   
   # Check Spotify API health
   echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"check_spotify_api_health","arguments":{}}}' | node mcp/servers/spotify-server.js
   ```

## Integration with MCP Clients

### Claude Desktop Integration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "redis-observability": {
      "command": "node",
      "args": ["/path/to/echotune/mcp/servers/redis-server.js"],
      "env": {
        "REDIS_URL": "redis://localhost:6379"
      }
    },
    "mongodb-observability": {
      "command": "node", 
      "args": ["/path/to/echotune/mcp/servers/mongodb-server.js"],
      "env": {
        "MONGODB_URI": "mongodb://localhost:27017/echotune"
      }
    },
    "spotify-observability": {
      "command": "node",
      "args": ["/path/to/echotune/mcp/servers/spotify-server.js"], 
      "env": {
        "SPOTIFY_CLIENT_ID": "your_client_id",
        "SPOTIFY_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

### Docker Integration

You can also run these servers in Docker containers:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY mcp/ ./mcp/
COPY src/ ./src/
CMD ["node", "mcp/servers/redis-server.js"]
```

## Monitoring and Metrics

### Prometheus Integration

The Redis server supports Prometheus metrics format:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_redis_metrics","arguments":{"format":"prometheus"}}}' | node mcp/servers/redis-server.js
```

### Health Checks

All servers provide health check endpoints that can be used with monitoring systems:

```bash
# Redis health
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"check_redis_health","arguments":{}}}' | node mcp/servers/redis-server.js

# MongoDB health  
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"check_mongodb_health","arguments":{}}}' | node mcp/servers/mongodb-server.js

# Spotify API health
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"check_spotify_api_health","arguments":{}}}' | node mcp/servers/spotify-server.js
```

## Development

### Adding New Tools

To add new tools to any server:

1. Add the tool definition to the `ListToolsRequestSchema` handler
2. Implement the tool logic in the `CallToolRequestSchema` handler  
3. Add appropriate utility functions
4. Update this README with documentation

### Testing

Run the test suite for MCP servers:

```bash
npm run test:mcp
```

### Debugging

Enable debug logging by setting:

```bash
export DEBUG=mcp:*
node mcp/servers/redis-server.js
```

## Security Notes

- MCP servers communicate via stdin/stdout and should not expose network ports
- Sensitive information (passwords, tokens) should be passed via environment variables
- The Spotify server only uses client credentials flow for read-only operations
- Database servers provide read-only statistics and do not allow data modification

## Troubleshooting

### Common Issues

1. **"Cannot connect to Redis"**
   - Verify Redis is running: `redis-cli ping`
   - Check REDIS_URL environment variable
   - Ensure network connectivity

2. **"Cannot connect to MongoDB"**
   - Verify MongoDB is running: `mongosh --eval "db.adminCommand('ping')"`
   - Check MONGODB_URI environment variable
   - Verify database permissions

3. **"Spotify credentials not configured"**
   - Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET
   - Verify credentials with Spotify API directly

4. **"MCP protocol errors"**
   - Ensure JSON-RPC 2.0 format for all requests
   - Check server output on stderr for error messages
   - Verify MCP SDK version compatibility

## Support

For issues with these MCP servers:

1. Check the server logs (stderr output)
2. Verify all environment variables are set
3. Test connectivity to underlying services
4. Review the MCP protocol documentation
5. Check EchoTune AI main application logs

## License

Same as EchoTune AI main project - see LICENSE file.