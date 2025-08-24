#!/usr/bin/env node

/**
 * Spotify MCP Server - EchoTune AI
 * Provides Spotify API observability and limited API calls through Model Context Protocol
 * 
 * This is a scaffold implementation following MCP specifications
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { 
  CallToolRequestSchema, 
  ListToolsRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema
} = require('@modelcontextprotocol/sdk/types.js');

const axios = require('axios');

// MCP Server implementation
const server = new Server(
  {
    name: 'spotify-observability-server',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
      resources: {}
    }
  }
);

// Spotify API configuration
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

// Cache for tokens
let clientCredentialsToken = null;
let tokenExpiry = null;

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'check_spotify_api_health',
        description: 'Check Spotify API connectivity and rate limits',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'get_api_rate_limits',
        description: 'Get current Spotify API rate limit status',
        inputSchema: {
          type: 'object',
          properties: {
            endpoint: {
              type: 'string',
              description: 'Specific API endpoint to check (optional)'
            }
          }
        }
      },
      {
        name: 'get_market_info',
        description: 'Get available markets and regions for Spotify content',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'search_tracks_sample',
        description: 'Perform a sample track search to test API functionality',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query for tracks',
              default: 'test'
            },
            limit: {
              type: 'number',
              description: 'Number of results to return',
              default: 5,
              minimum: 1,
              maximum: 10
            }
          }
        }
      },
      {
        name: 'get_audio_features_sample',
        description: 'Get audio features for a sample track to test API functionality',
        inputSchema: {
          type: 'object',
          properties: {
            track_id: {
              type: 'string',
              description: 'Spotify track ID (optional, uses default if not provided)'
            }
          }
        }
      },
      {
        name: 'get_spotify_metrics',
        description: 'Get comprehensive Spotify API usage and performance metrics',
        inputSchema: {
          type: 'object',
          properties: {
            include_samples: {
              type: 'boolean',
              description: 'Include sample API calls in metrics',
              default: false
            }
          }
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    switch (name) {
      case 'check_spotify_api_health': {
        const health = await checkSpotifyAPIHealth();
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(health, null, 2)
            }
          ]
        };
      }
      
      case 'get_api_rate_limits': {
        const endpoint = args?.endpoint;
        const rateLimits = await getAPIRateLimits(endpoint);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(rateLimits, null, 2)
            }
          ]
        };
      }
      
      case 'get_market_info': {
        const markets = await getMarketInfo();
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(markets, null, 2)
            }
          ]
        };
      }
      
      case 'search_tracks_sample': {
        const query = args?.query || 'test';
        const limit = args?.limit || 5;
        const results = await searchTracksSample(query, limit);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2)
            }
          ]
        };
      }
      
      case 'get_audio_features_sample': {
        const trackId = args?.track_id || '4iV5W9uYEdYUVa79Axb7Rh'; // Default: "Never Gonna Give You Up"
        const features = await getAudioFeaturesSample(trackId);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(features, null, 2)
            }
          ]
        };
      }
      
      case 'get_spotify_metrics': {
        const includeSamples = args?.include_samples || false;
        const metrics = await getSpotifyMetrics(includeSamples);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(metrics, null, 2)
            }
          ]
        };
      }
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`
        }
      ],
      isError: true
    };
  }
});

// Utility functions
async function getClientCredentialsToken() {
  // Check if we have a valid cached token
  if (clientCredentialsToken && tokenExpiry && Date.now() < tokenExpiry) {
    return clientCredentialsToken;
  }
  
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw new Error('Spotify credentials not configured');
  }
  
  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 10000
      }
    );
    
    const { access_token, expires_in } = response.data;
    clientCredentialsToken = access_token;
    tokenExpiry = Date.now() + (expires_in * 1000) - 60000; // Refresh 1 minute early
    
    return access_token;
  } catch (error) {
    throw new Error(`Failed to get Spotify token: ${error.response?.data?.error_description || error.message}`);
  }
}

async function checkSpotifyAPIHealth() {
  const health = {
    timestamp: new Date().toISOString(),
    status: 'unknown',
    checks: {}
  };
  
  try {
    // Check credentials
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      health.status = 'not_configured';
      health.checks.credentials = {
        status: 'fail',
        error: 'Spotify credentials not configured'
      };
      return health;
    }
    
    health.checks.credentials = { status: 'pass' };
    
    // Test token acquisition
    const tokenStart = process.hrtime.bigint();
    const token = await getClientCredentialsToken();
    const tokenEnd = process.hrtime.bigint();
    const tokenLatency = Number(tokenEnd - tokenStart) / 1_000_000;
    
    health.checks.token = {
      status: 'pass',
      latency_ms: Math.round(tokenLatency * 100) / 100
    };
    
    // Test API call
    const apiStart = process.hrtime.bigint();
    const response = await axios.get('https://api.spotify.com/v1/browse/categories', {
      headers: { Authorization: `Bearer ${token}` },
      params: { limit: 1 },
      timeout: 10000
    });
    const apiEnd = process.hrtime.bigint();
    const apiLatency = Number(apiEnd - apiStart) / 1_000_000;
    
    health.checks.api = {
      status: 'pass',
      latency_ms: Math.round(apiLatency * 100) / 100,
      http_status: response.status
    };
    
    // Check rate limit headers
    health.checks.rate_limits = {
      status: 'pass',
      remaining: response.headers['x-ratelimit-remaining'],
      reset_time: response.headers['x-ratelimit-reset'],
      limit: response.headers['x-ratelimit-limit']
    };
    
    health.status = 'healthy';
    
  } catch (error) {
    health.status = 'unhealthy';
    health.checks.error = {
      status: 'fail',
      message: error.message,
      http_status: error.response?.status
    };
  }
  
  return health;
}

async function getAPIRateLimits(endpoint) {
  const result = {
    timestamp: new Date().toISOString(),
    endpoint: endpoint || 'categories (default test)'
  };
  
  try {
    const token = await getClientCredentialsToken();
    const testUrl = endpoint || 'https://api.spotify.com/v1/browse/categories';
    
    const response = await axios.get(testUrl, {
      headers: { Authorization: `Bearer ${token}` },
      params: { limit: 1 },
      timeout: 10000
    });
    
    result.rate_limits = {
      remaining: parseInt(response.headers['x-ratelimit-remaining']) || null,
      limit: parseInt(response.headers['x-ratelimit-limit']) || null,
      reset_time: response.headers['x-ratelimit-reset'] || null,
      retry_after: response.headers['retry-after'] || null
    };
    
    result.status = 'success';
    
  } catch (error) {
    if (error.response?.status === 429) {
      result.status = 'rate_limited';
      result.rate_limits = {
        retry_after: error.response.headers['retry-after'],
        message: 'Rate limit exceeded'
      };
    } else {
      result.status = 'error';
      result.error = error.message;
    }
  }
  
  return result;
}

async function getMarketInfo() {
  const result = {
    timestamp: new Date().toISOString()
  };
  
  try {
    const token = await getClientCredentialsToken();
    
    const response = await axios.get('https://api.spotify.com/v1/markets', {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000
    });
    
    result.markets = response.data.markets;
    result.market_count = response.data.markets.length;
    result.status = 'success';
    
  } catch (error) {
    result.status = 'error';
    result.error = error.message;
  }
  
  return result;
}

async function searchTracksSample(query, limit) {
  const result = {
    timestamp: new Date().toISOString(),
    query,
    limit
  };
  
  try {
    const token = await getClientCredentialsToken();
    
    const response = await axios.get('https://api.spotify.com/v1/search', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        q: query,
        type: 'track',
        limit: Math.min(limit, 10) // Enforce maximum
      },
      timeout: 10000
    });
    
    const tracks = response.data.tracks.items.map(track => ({
      id: track.id,
      name: track.name,
      artists: track.artists.map(artist => artist.name),
      album: track.album.name,
      duration_ms: track.duration_ms,
      popularity: track.popularity,
      preview_url: track.preview_url ? 'available' : 'not_available'
    }));
    
    result.tracks = tracks;
    result.total_found = response.data.tracks.total;
    result.status = 'success';
    
  } catch (error) {
    result.status = 'error';
    result.error = error.message;
  }
  
  return result;
}

async function getAudioFeaturesSample(trackId) {
  const result = {
    timestamp: new Date().toISOString(),
    track_id: trackId
  };
  
  try {
    const token = await getClientCredentialsToken();
    
    // Get track info first
    const trackResponse = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000
    });
    
    result.track_info = {
      name: trackResponse.data.name,
      artists: trackResponse.data.artists.map(artist => artist.name),
      album: trackResponse.data.album.name
    };
    
    // Get audio features
    const featuresResponse = await axios.get(`https://api.spotify.com/v1/audio-features/${trackId}`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000
    });
    
    const features = featuresResponse.data;
    result.audio_features = {
      acousticness: features.acousticness,
      danceability: features.danceability,
      energy: features.energy,
      instrumentalness: features.instrumentalness,
      liveness: features.liveness,
      loudness: features.loudness,
      speechiness: features.speechiness,
      valence: features.valence,
      tempo: features.tempo,
      time_signature: features.time_signature,
      key: features.key,
      mode: features.mode
    };
    
    result.status = 'success';
    
  } catch (error) {
    result.status = 'error';
    result.error = error.message;
    result.http_status = error.response?.status;
  }
  
  return result;
}

async function getSpotifyMetrics(includeSamples) {
  const metrics = {
    timestamp: new Date().toISOString(),
    service: 'spotify-api',
    configuration: {
      client_id_configured: !!SPOTIFY_CLIENT_ID,
      client_secret_configured: !!SPOTIFY_CLIENT_SECRET,
      token_cached: !!clientCredentialsToken,
      token_expires: tokenExpiry ? new Date(tokenExpiry).toISOString() : null
    }
  };
  
  try {
    // Basic health check
    const health = await checkSpotifyAPIHealth();
    metrics.health = health;
    
    // Rate limit info
    const rateLimits = await getAPIRateLimits();
    metrics.rate_limits = rateLimits;
    
    // If samples requested, run some test calls
    if (includeSamples) {
      metrics.sample_calls = {};
      
      try {
        const searchSample = await searchTracksSample('test', 1);
        metrics.sample_calls.search = {
          status: searchSample.status,
          duration: 'measured_in_health_check'
        };
      } catch (e) {
        metrics.sample_calls.search = { status: 'error', error: e.message };
      }
      
      try {
        const audioSample = await getAudioFeaturesSample('4iV5W9uYEdYUVa79Axb7Rh');
        metrics.sample_calls.audio_features = {
          status: audioSample.status,
          duration: 'measured_in_health_check'
        };
      } catch (e) {
        metrics.sample_calls.audio_features = { status: 'error', error: e.message };
      }
    }
    
    metrics.overall_status = health.status;
    
  } catch (error) {
    metrics.overall_status = 'error';
    metrics.error = error.message;
  }
  
  return metrics;
}

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception in Spotify MCP server:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection in Spotify MCP server:', reason);
  process.exit(1);
});

// Start server
const transport = new StdioServerTransport();
server.connect(transport).catch((error) => {
  console.error('Failed to start Spotify MCP server:', error);
  process.exit(1);
});

console.error('Spotify MCP Server started'); // Use stderr for logs to avoid interfering with MCP protocol