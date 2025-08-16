#!/usr/bin/env node
/**
 * Filesystem MCP Server for EchoTune AI
 * Provides secure file operations, directory management, and code analysis
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class FilesystemMCPServer {
    constructor() {
        this.server = new Server(
            { name: 'filesystem-mcp', version: '1.0.0' },
            { capabilities: { tools: {} } }
        );
        
        // Security configuration
        this.allowedDirectories = [
            process.cwd(),
            path.join(process.cwd(), 'src'),
            path.join(process.cwd(), 'scripts'),
            path.join(process.cwd(), 'mcp-servers'),
            path.join(process.cwd(), 'docs'),
            path.join(process.cwd(), 'tests')
        ];
        
        this.setupTools();
    }

    setupTools() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'read_file',
                        description: 'Read contents of a file',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                path: {
                                    type: 'string',
                                    description: 'Path to the file to read'
                                }
                            },
                            required: ['path']
                        }
                    },
                    {
                        name: 'write_file',
                        description: 'Write content to a file',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                path: {
                                    type: 'string',
                                    description: 'Path to the file to write'
                                },
                                content: {
                                    type: 'string',
                                    description: 'Content to write to the file'
                                }
                            },
                            required: ['path', 'content']
                        }
                    },
                    {
                        name: 'list_directory',
                        description: 'List contents of a directory',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                path: {
                                    type: 'string',
                                    description: 'Path to the directory to list'
                                }
                            },
                            required: ['path']
                        }
                    },
                    {
                        name: 'create_directory',
                        description: 'Create a new directory',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                path: {
                                    type: 'string',
                                    description: 'Path to the directory to create'
                                }
                            },
                            required: ['path']
                        }
                    },
                    {
                        name: 'delete_file',
                        description: 'Delete a file',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                path: {
                                    type: 'string',
                                    description: 'Path to the file to delete'
                                }
                            },
                            required: ['path']
                        }
                    },
                    {
                        name: 'file_stats',
                        description: 'Get file statistics',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                path: {
                                    type: 'string',
                                    description: 'Path to the file or directory'
                                }
                            },
                            required: ['path']
                        }
                    },
                    {
                        name: 'search_files',
                        description: 'Search for files by pattern',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                pattern: {
                                    type: 'string',
                                    description: 'Search pattern (supports glob patterns)'
                                },
                                directory: {
                                    type: 'string',
                                    description: 'Directory to search in',
                                    default: process.cwd()
                                }
                            },
                            required: ['pattern']
                        }
                    }
                ]
            };
        });

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            
            try {
                switch (name) {
                    case 'read_file':
                        return await this.readFile(args.path);
                    case 'write_file':
                        return await this.writeFile(args.path, args.content);
                    case 'list_directory':
                        return await this.listDirectory(args.path);
                    case 'create_directory':
                        return await this.createDirectory(args.path);
                    case 'delete_file':
                        return await this.deleteFile(args.path);
                    case 'file_stats':
                        return await this.getFileStats(args.path);
                    case 'search_files':
                        return await this.searchFiles(args.pattern, args.directory);
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

    validatePath(filePath) {
        const resolvedPath = path.resolve(filePath);
        const isAllowed = this.allowedDirectories.some(dir => 
            resolvedPath.startsWith(path.resolve(dir))
        );
        
        if (!isAllowed) {
            throw new Error(`Access denied: Path ${filePath} is not in allowed directories`);
        }
        
        return resolvedPath;
    }

    async readFile(filePath) {
        const resolvedPath = this.validatePath(filePath);
        const content = await fs.readFile(resolvedPath, 'utf8');
        
        return {
            content: [
                {
                    type: 'text',
                    text: content
                }
            ]
        };
    }

    async writeFile(filePath, content) {
        const resolvedPath = this.validatePath(filePath);
        await fs.writeFile(resolvedPath, content, 'utf8');
        
        return {
            content: [
                {
                    type: 'text',
                    text: `File written successfully: ${filePath}`
                }
            ]
        };
    }

    async listDirectory(dirPath) {
        const resolvedPath = this.validatePath(dirPath);
        const items = await fs.readdir(resolvedPath, { withFileTypes: true });
        
        const listing = items.map(item => ({
            name: item.name,
            type: item.isDirectory() ? 'directory' : 'file',
            path: path.join(dirPath, item.name)
        }));
        
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(listing, null, 2)
                }
            ]
        };
    }

    async createDirectory(dirPath) {
        const resolvedPath = this.validatePath(dirPath);
        await fs.mkdir(resolvedPath, { recursive: true });
        
        return {
            content: [
                {
                    type: 'text',
                    text: `Directory created successfully: ${dirPath}`
                }
            ]
        };
    }

    async deleteFile(filePath) {
        const resolvedPath = this.validatePath(filePath);
        await fs.unlink(resolvedPath);
        
        return {
            content: [
                {
                    type: 'text',
                    text: `File deleted successfully: ${filePath}`
                }
            ]
        };
    }

    async getFileStats(filePath) {
        const resolvedPath = this.validatePath(filePath);
        const stats = await fs.stat(resolvedPath);
        
        const result = {
            path: filePath,
            size: stats.size,
            type: stats.isDirectory() ? 'directory' : 'file',
            modified: stats.mtime.toISOString(),
            created: stats.birthtime.toISOString(),
            permissions: stats.mode.toString(8)
        };
        
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }
            ]
        };
    }

    async searchFiles(pattern, searchDir = process.cwd()) {
        const resolvedDir = this.validatePath(searchDir);
        const { glob } = require('glob');
        
        const matches = await glob(pattern, { 
            cwd: resolvedDir,
            absolute: true
        });
        
        const results = matches.map(match => ({
            path: path.relative(process.cwd(), match),
            absolutePath: match
        }));
        
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(results, null, 2)
                }
            ]
        };
    }

    async start() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Filesystem MCP Server running on stdio');
    }
}

if (require.main === module) {
    const server = new FilesystemMCPServer();
    server.start().catch(console.error);
}

module.exports = FilesystemMCPServer;