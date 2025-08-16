#!/usr/bin/env node
/**
 * Memory MCP Server for EchoTune AI
 * Provides persistent context across sessions, knowledge graph storage, and conversation history
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const fs = require('fs').promises;
const path = require('path');

class MemoryMCPServer {
    constructor() {
        this.server = new Server(
            { name: 'memory-mcp', version: '1.0.0' },
            { capabilities: { tools: {} } }
        );
        
        this.memoryFile = path.join(process.cwd(), 'data', 'memory.json');
        this.contextFile = path.join(process.cwd(), 'data', 'context.json');
        this.conversationFile = path.join(process.cwd(), 'data', 'conversations.json');
        
        this.memory = new Map();
        this.context = new Map();
        this.conversations = [];
        
        this.setupTools();
        this.loadMemory();
    }

    setupTools() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'store_memory',
                        description: 'Store information in persistent memory',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                key: {
                                    type: 'string',
                                    description: 'Key to store the information under'
                                },
                                value: {
                                    type: 'string',
                                    description: 'Information to store'
                                },
                                category: {
                                    type: 'string',
                                    description: 'Category for organizing memories',
                                    default: 'general'
                                }
                            },
                            required: ['key', 'value']
                        }
                    },
                    {
                        name: 'recall_memory',
                        description: 'Recall stored information from memory',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                key: {
                                    type: 'string',
                                    description: 'Key of the information to recall'
                                }
                            },
                            required: ['key']
                        }
                    },
                    {
                        name: 'search_memory',
                        description: 'Search through stored memories',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                query: {
                                    type: 'string',
                                    description: 'Search query'
                                },
                                category: {
                                    type: 'string',
                                    description: 'Category to search within'
                                }
                            },
                            required: ['query']
                        }
                    },
                    {
                        name: 'list_categories',
                        description: 'List all memory categories',
                        inputSchema: {
                            type: 'object',
                            properties: {}
                        }
                    },
                    {
                        name: 'store_context',
                        description: 'Store session context information',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                session_id: {
                                    type: 'string',
                                    description: 'Session identifier'
                                },
                                context: {
                                    type: 'string',
                                    description: 'Context information'
                                }
                            },
                            required: ['session_id', 'context']
                        }
                    },
                    {
                        name: 'recall_context',
                        description: 'Recall context for a session',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                session_id: {
                                    type: 'string',
                                    description: 'Session identifier'
                                }
                            },
                            required: ['session_id']
                        }
                    },
                    {
                        name: 'add_conversation',
                        description: 'Add conversation to history',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                user_input: {
                                    type: 'string',
                                    description: 'User input'
                                },
                                assistant_response: {
                                    type: 'string',
                                    description: 'Assistant response'
                                },
                                session_id: {
                                    type: 'string',
                                    description: 'Session identifier'
                                }
                            },
                            required: ['user_input', 'assistant_response']
                        }
                    },
                    {
                        name: 'get_conversation_history',
                        description: 'Get conversation history',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                session_id: {
                                    type: 'string',
                                    description: 'Session identifier'
                                },
                                limit: {
                                    type: 'number',
                                    description: 'Number of conversations to return',
                                    default: 10
                                }
                            }
                        }
                    },
                    {
                        name: 'clear_memory',
                        description: 'Clear all or specific memory entries',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                key: {
                                    type: 'string',
                                    description: 'Specific key to clear, if not provided clears all'
                                },
                                category: {
                                    type: 'string',
                                    description: 'Category to clear'
                                }
                            }
                        }
                    }
                ]
            };
        });

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            
            try {
                switch (name) {
                    case 'store_memory':
                        return await this.storeMemory(args.key, args.value, args.category);
                    case 'recall_memory':
                        return await this.recallMemory(args.key);
                    case 'search_memory':
                        return await this.searchMemory(args.query, args.category);
                    case 'list_categories':
                        return await this.listCategories();
                    case 'store_context':
                        return await this.storeContext(args.session_id, args.context);
                    case 'recall_context':
                        return await this.recallContext(args.session_id);
                    case 'add_conversation':
                        return await this.addConversation(args.user_input, args.assistant_response, args.session_id);
                    case 'get_conversation_history':
                        return await this.getConversationHistory(args.session_id, args.limit);
                    case 'clear_memory':
                        return await this.clearMemory(args.key, args.category);
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
                    ]
                };
            }
        });
    }

    async loadMemory() {
        try {
            // Ensure data directory exists
            await fs.mkdir(path.dirname(this.memoryFile), { recursive: true });
            
            // Load memory
            try {
                const memoryData = await fs.readFile(this.memoryFile, 'utf8');
                const parsedMemory = JSON.parse(memoryData);
                this.memory = new Map(Object.entries(parsedMemory));
            } catch (error) {
                if (error.code !== 'ENOENT') {
                    console.error('Error loading memory:', error);
                }
            }
            
            // Load context
            try {
                const contextData = await fs.readFile(this.contextFile, 'utf8');
                const parsedContext = JSON.parse(contextData);
                this.context = new Map(Object.entries(parsedContext));
            } catch (error) {
                if (error.code !== 'ENOENT') {
                    console.error('Error loading context:', error);
                }
            }
            
            // Load conversations
            try {
                const conversationData = await fs.readFile(this.conversationFile, 'utf8');
                this.conversations = JSON.parse(conversationData);
            } catch (error) {
                if (error.code !== 'ENOENT') {
                    console.error('Error loading conversations:', error);
                }
            }
        } catch (error) {
            console.error('Error in loadMemory:', error);
        }
    }

    async saveMemory() {
        try {
            await fs.writeFile(this.memoryFile, JSON.stringify(Object.fromEntries(this.memory), null, 2));
            await fs.writeFile(this.contextFile, JSON.stringify(Object.fromEntries(this.context), null, 2));
            await fs.writeFile(this.conversationFile, JSON.stringify(this.conversations, null, 2));
        } catch (error) {
            console.error('Error saving memory:', error);
        }
    }

    async storeMemory(key, value, category = 'general') {
        const memoryEntry = {
            value,
            category,
            timestamp: new Date().toISOString(),
            access_count: 0
        };
        
        this.memory.set(key, memoryEntry);
        await this.saveMemory();
        
        return {
            content: [
                {
                    type: 'text',
                    text: `Memory stored successfully: ${key} in category "${category}"`
                }
            ]
        };
    }

    async recallMemory(key) {
        const entry = this.memory.get(key);
        
        if (!entry) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `No memory found for key: ${key}`
                    }
                ]
            };
        }
        
        // Update access count
        entry.access_count++;
        this.memory.set(key, entry);
        await this.saveMemory();
        
        return {
            content: [
                {
                    type: 'text',
                    text: `Memory for "${key}": ${entry.value}\nCategory: ${entry.category}\nStored: ${entry.timestamp}\nAccess count: ${entry.access_count}`
                }
            ]
        };
    }

    async searchMemory(query, category = null) {
        const results = [];
        
        for (const [key, entry] of this.memory.entries()) {
            if (category && entry.category !== category) {
                continue;
            }
            
            if (key.toLowerCase().includes(query.toLowerCase()) || 
                entry.value.toLowerCase().includes(query.toLowerCase())) {
                results.push({
                    key,
                    value: entry.value,
                    category: entry.category,
                    timestamp: entry.timestamp
                });
            }
        }
        
        return {
            content: [
                {
                    type: 'text',
                    text: `Search results for "${query}":\n${JSON.stringify(results, null, 2)}`
                }
            ]
        };
    }

    async listCategories() {
        const categories = new Set();
        
        for (const entry of this.memory.values()) {
            categories.add(entry.category);
        }
        
        return {
            content: [
                {
                    type: 'text',
                    text: `Memory categories: ${Array.from(categories).join(', ')}`
                }
            ]
        };
    }

    async storeContext(sessionId, contextInfo) {
        this.context.set(sessionId, {
            context: contextInfo,
            timestamp: new Date().toISOString()
        });
        await this.saveMemory();
        
        return {
            content: [
                {
                    type: 'text',
                    text: `Context stored for session: ${sessionId}`
                }
            ]
        };
    }

    async recallContext(sessionId) {
        const contextEntry = this.context.get(sessionId);
        
        if (!contextEntry) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `No context found for session: ${sessionId}`
                    }
                ]
            };
        }
        
        return {
            content: [
                {
                    type: 'text',
                    text: `Context for session "${sessionId}": ${contextEntry.context}\nStored: ${contextEntry.timestamp}`
                }
            ]
        };
    }

    async addConversation(userInput, assistantResponse, sessionId = 'default') {
        const conversation = {
            user_input: userInput,
            assistant_response: assistantResponse,
            session_id: sessionId,
            timestamp: new Date().toISOString()
        };
        
        this.conversations.push(conversation);
        
        // Keep only last 1000 conversations
        if (this.conversations.length > 1000) {
            this.conversations = this.conversations.slice(-1000);
        }
        
        await this.saveMemory();
        
        return {
            content: [
                {
                    type: 'text',
                    text: 'Conversation added to history'
                }
            ]
        };
    }

    async getConversationHistory(sessionId = null, limit = 10) {
        let filteredConversations = this.conversations;
        
        if (sessionId) {
            filteredConversations = this.conversations.filter(conv => conv.session_id === sessionId);
        }
        
        const recentConversations = filteredConversations.slice(-limit);
        
        return {
            content: [
                {
                    type: 'text',
                    text: `Recent conversations:\n${JSON.stringify(recentConversations, null, 2)}`
                }
            ]
        };
    }

    async clearMemory(key = null, category = null) {
        if (key) {
            this.memory.delete(key);
            await this.saveMemory();
            return {
                content: [
                    {
                        type: 'text',
                        text: `Memory cleared for key: ${key}`
                    }
                ]
            };
        }
        
        if (category) {
            for (const [key, entry] of this.memory.entries()) {
                if (entry.category === category) {
                    this.memory.delete(key);
                }
            }
            await this.saveMemory();
            return {
                content: [
                    {
                        type: 'text',
                        text: `Memory cleared for category: ${category}`
                    }
                ]
            };
        }
        
        this.memory.clear();
        this.context.clear();
        this.conversations = [];
        await this.saveMemory();
        
        return {
            content: [
                {
                    type: 'text',
                    text: 'All memory cleared'
                }
            ]
        };
    }

    async start() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Memory MCP Server running on stdio');
    }
}

if (require.main === module) {
    const server = new MemoryMCPServer();
    server.start().catch(console.error);
}

module.exports = MemoryMCPServer;