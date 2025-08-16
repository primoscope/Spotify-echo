/**
 * Brave Search MCP Server for EchoTune AI
 * Provides privacy-focused web search capabilities via Brave Search API
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const axios = require('axios');

class BraveSearchMCPServer {
    constructor() {
        this.server = new Server(
            { name: 'brave-search-mcp', version: '1.0.0' },
            { capabilities: { tools: {} } }
        );
        
        this.apiKey = process.env.BRAVE_API_KEY;
        this.baseUrl = 'https://api.search.brave.com/res/v1';
        
        this.setupTools();
    }

    setupTools() {
        // Web search tool
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'brave_search',
                        description: 'Search the web using Brave Search API with privacy focus',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                q: {
                                    type: 'string',
                                    description: 'Search query'
                                },
                                count: {
                                    type: 'number',
                                    description: 'Number of results (1-20)',
                                    default: 10
                                },
                                search_lang: {
                                    type: 'string', 
                                    description: 'Search language code',
                                    default: 'en'
                                },
                                ui_lang: {
                                    type: 'string',
                                    description: 'UI language code', 
                                    default: 'en-US'
                                },
                                safesearch: {
                                    type: 'string',
                                    description: 'Safe search level',
                                    enum: ['strict', 'moderate', 'off'],
                                    default: 'moderate'
                                }
                            },
                            required: ['q']
                        }
                    }
                ]
            };
        });

        // Execute search
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            if (request.params.name !== 'brave_search') {
                throw new Error(`Unknown tool: ${request.params.name}`);
            }

            if (!this.apiKey) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: '❌ Brave Search API key not configured. Please set BRAVE_API_KEY environment variable.'
                        }
                    ]
                };
            }

            const args = request.params.arguments || {};
            const { q, count = 10, search_lang = 'en', ui_lang = 'en-US', safesearch = 'moderate' } = args;

            try {
                console.log(`🔍 Brave Search: Searching for "${q}"`);
                
                const response = await axios.get(`${this.baseUrl}/web/search`, {
                    headers: {
                        'Accept': 'application/json',
                        'Accept-Encoding': 'gzip',
                        'X-Subscription-Token': this.apiKey
                    },
                    params: {
                        q,
                        count: Math.min(count, 20),
                        search_lang,
                        ui_lang,
                        safesearch,
                        result_filter: 'web'
                    },
                    timeout: 10000
                });

                const data = response.data;
                const results = data.web?.results || [];
                
                if (results.length === 0) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `🔍 No results found for: "${q}"`
                            }
                        ]
                    };
                }

                // Format results
                const formattedResults = results.map((result, index) => {
                    return `${index + 1}. **${result.title}**
   URL: ${result.url}
   Description: ${result.description || 'No description available'}
   ${result.published ? `Published: ${result.published}` : ''}`;
                }).join('\n\n');

                const summary = `🔍 **Brave Search Results for: "${q}"**
Found ${results.length} results

${formattedResults}

---
*Privacy-focused search powered by Brave Search API*`;

                return {
                    content: [
                        {
                            type: 'text',
                            text: summary
                        }
                    ]
                };

            } catch (error) {
                console.error('❌ Brave Search error:', error.message);
                
                if (error.response?.status === 401) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: '❌ Brave Search API authentication failed. Please check your BRAVE_API_KEY.'
                            }
                        ]
                    };
                }

                if (error.response?.status === 429) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: '⚠️ Brave Search API rate limit reached. Please wait before making another request.'
                            }
                        ]
                    };
                }

                return {
                    content: [
                        {
                            type: 'text',
                            text: `❌ Brave Search error: ${error.message}`
                        }
                    ]
                };
            }
        });
    }

    async start() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.log('🔍 Brave Search MCP Server started');
    }
}

if (require.main === module) {
    const server = new BraveSearchMCPServer();
    server.start().catch(console.error);
}

module.exports = BraveSearchMCPServer;