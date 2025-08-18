#!/usr/bin/env node

/**
 * Perplexity Integration for User-Driven Coding Agent
 * 
 * Enhanced search and research capabilities using Perplexity API
 * Designed for coding agents to perform intelligent research tasks
 * 
 * Features:
 * - Code-focused search
 * - Documentation research
 * - Troubleshooting assistance
 * - Technology trend analysis
 * - Best practices research
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class PerplexityIntegrationSystem {
    constructor() {
        this.perplexityApiKey = process.env.PERPLEXITY_API_KEY;
        this.n8nUrl = 'https://primosphere.ninja';
        this.apiKey = process.env.N8N_API_KEY;
        
        this.searchModels = {
            'sonar-small-online': 'llama-3.1-sonar-small-128k-online',
            'sonar-large-online': 'llama-3.1-sonar-large-128k-online',
            'sonar-huge-online': 'llama-3.1-sonar-huge-128k-online'
        };
        
        this.searchTemplates = {
            codeHelp: {
                prompt: 'Provide comprehensive code examples and best practices for: {query}. Include working code snippets, explanations, and common pitfalls.',
                model: 'sonar-large-online',
                maxTokens: 2000
            },
            debugging: {
                prompt: 'Help debug and solve this coding issue: {query}. Provide step-by-step troubleshooting guide and solution examples.',
                model: 'sonar-large-online',
                maxTokens: 1500
            },
            documentation: {
                prompt: 'Find comprehensive documentation and usage examples for: {query}. Include official docs, tutorials, and practical examples.',
                model: 'sonar-huge-online',
                maxTokens: 2500
            },
            trends: {
                prompt: 'Research current trends and developments in: {query}. Include recent updates, community discussions, and future outlook.',
                model: 'sonar-huge-online',
                maxTokens: 2000
            },
            optimization: {
                prompt: 'Research performance optimization techniques for: {query}. Include benchmarks, best practices, and real-world examples.',
                model: 'sonar-large-online',
                maxTokens: 1800
            }
        };
        
        console.log('🔍 Perplexity Integration System');
        console.log(`🌐 N8N Server: ${this.n8nUrl}`);
        console.log(`🧠 Search Templates: ${Object.keys(this.searchTemplates).length}`);
    }
    
    async testPerplexityConnection() {
        console.log('\n🔍 Testing Perplexity API connection...');
        
        try {
            const response = await axios.post('https://api.perplexity.ai/chat/completions', {
                model: this.searchModels['sonar-small-online'],
                messages: [
                    {
                        role: 'user',
                        content: 'Test connection - respond with "Connection successful"'
                    }
                ],
                max_tokens: 50,
                temperature: 0
            }, {
                headers: {
                    'Authorization': `Bearer ${this.perplexityApiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            });
            
            console.log('✅ Perplexity API connection successful');
            console.log(`📊 Response: ${response.data.choices[0].message.content}`);
            return true;
            
        } catch (error) {
            console.log(`❌ Perplexity API connection failed: ${error.message}`);
            return false;
        }
    }
    
    async performCodeSearch(query, searchType = 'codeHelp') {
        console.log(`\n🔍 Performing ${searchType} search: ${query}`);
        
        const template = this.searchTemplates[searchType] || this.searchTemplates.codeHelp;
        const enhancedPrompt = template.prompt.replace('{query}', query);
        
        try {
            const response = await axios.post('https://api.perplexity.ai/chat/completions', {
                model: this.searchModels[template.model],
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful coding assistant. Provide accurate, practical, and well-structured responses with code examples when appropriate.'
                    },
                    {
                        role: 'user',
                        content: enhancedPrompt
                    }
                ],
                max_tokens: template.maxTokens,
                temperature: 0.1
            }, {
                headers: {
                    'Authorization': `Bearer ${this.perplexityApiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });
            
            const result = {
                query,
                searchType,
                model: this.searchModels[template.model],
                result: response.data.choices[0].message.content,
                usage: response.data.usage,
                timestamp: new Date().toISOString(),
                citations: this.extractCitations(response.data.choices[0].message.content),
                codeExamples: this.extractCodeExamples(response.data.choices[0].message.content)
            };
            
            console.log('✅ Search completed successfully');
            console.log(`📊 Tokens used: ${result.usage?.total_tokens || 'N/A'}`);
            console.log(`🔗 Citations found: ${result.citations.length}`);
            console.log(`💻 Code examples: ${result.codeExamples.length}`);
            
            return result;
            
        } catch (error) {
            console.log(`❌ Search failed: ${error.message}`);
            throw error;
        }
    }
    
    extractCitations(content) {
        // Extract URLs and citations from the response
        const urlRegex = /https?:\/\/[^\s\)]+/g;
        const citations = content.match(urlRegex) || [];
        return [...new Set(citations)]; // Remove duplicates
    }
    
    extractCodeExamples(content) {
        // Extract code blocks from the response
        const codeRegex = /```[\s\S]*?```/g;
        const codeBlocks = content.match(codeRegex) || [];
        return codeBlocks.map((block, index) => ({
            id: index + 1,
            code: block.replace(/```[\w]*\n?/g, '').replace(/\n```/g, ''),
            language: this.detectLanguage(block)
        }));
    }
    
    detectLanguage(codeBlock) {
        const firstLine = codeBlock.split('\n')[0];
        const langMatch = firstLine.match(/```(\w+)/);
        return langMatch ? langMatch[1] : 'unknown';
    }
    
    async createPerplexityN8nWorkflows() {
        console.log('\n🎯 Creating Enhanced Perplexity N8N Workflows...');
        
        const workflows = [
            {
                name: 'Perplexity Code Search Engine',
                webhook: '/webhook/perplexity-code-search',
                description: 'Search for coding solutions and examples',
                nodes: this.generateCodeSearchWorkflow()
            },
            {
                name: 'Perplexity Documentation Finder',
                webhook: '/webhook/perplexity-docs-search',
                description: 'Find official documentation and tutorials',
                nodes: this.generateDocumentationWorkflow()
            },
            {
                name: 'Perplexity Debugging Assistant',
                webhook: '/webhook/perplexity-debug-help',
                description: 'Get debugging help and solutions',
                nodes: this.generateDebuggingWorkflow()
            },
            {
                name: 'Perplexity Tech Trends Analyzer',
                webhook: '/webhook/perplexity-trends',
                description: 'Research technology trends and updates',
                nodes: this.generateTrendsWorkflow()
            }
        ];
        
        return workflows;
    }
    
    generateCodeSearchWorkflow() {
        return [
            {
                name: 'Code Search Request',
                type: 'n8n-nodes-base.webhook',
                position: [100, 200],
                parameters: {
                    path: 'perplexity-code-search',
                    httpMethod: 'POST'
                }
            },
            {
                name: 'Prepare Code Query',
                type: '@kenkaiii/n8n-nodes-supercode.supercode',
                position: [300, 200],
                parameters: {
                    language: 'javascript',
                    code: `
                        const request = $input.first().json;
                        const query = request.query || request.problem || request.code;
                        const language = request.language || 'javascript';
                        const difficulty = request.difficulty || 'intermediate';
                        
                        // Enhance query for code search
                        const enhancedQuery = \`
                        Provide comprehensive \${language} code examples and best practices for: \${query}
                        
                        Please include:
                        1. Working code examples with explanations
                        2. Best practices and common patterns
                        3. Common pitfalls and how to avoid them
                        4. Performance considerations
                        5. Testing approaches
                        
                        Difficulty level: \${difficulty}
                        \`;
                        
                        return {
                            originalQuery: query,
                            enhancedQuery: enhancedQuery.trim(),
                            language,
                            difficulty,
                            searchType: 'codeHelp',
                            timestamp: new Date().toISOString()
                        };
                    `
                }
            },
            {
                name: 'Perplexity Code Search',
                type: 'n8n-nodes-base.httpRequest',
                position: [500, 200],
                parameters: {
                    method: 'POST',
                    url: 'https://api.perplexity.ai/chat/completions',
                    headers: {
                        'Authorization': 'Bearer {{ $env.PERPLEXITY_API_KEY }}',
                        'Content-Type': 'application/json'
                    },
                    body: {
                        model: 'llama-3.1-sonar-large-128k-online',
                        messages: [
                            {
                                role: 'system',
                                content: 'You are an expert coding assistant. Provide accurate, practical code examples with clear explanations.'
                            },
                            {
                                role: 'user',
                                content: '{{ $json.enhancedQuery }}'
                            }
                        ],
                        max_tokens: 2000,
                        temperature: 0.1
                    }
                }
            },
            {
                name: 'Process Code Results',
                type: '@kenkaiii/n8n-nodes-supercode.supercode',
                position: [700, 200],
                parameters: {
                    language: 'javascript',
                    code: `
                        const searchData = $input.item(0, 1).json; // Previous node data
                        const apiResponse = $input.first().json; // Perplexity response
                        
                        const content = apiResponse.choices[0].message.content;
                        
                        // Extract code examples
                        const codeRegex = /\`\`\`[\\s\\S]*?\`\`\`/g;
                        const codeBlocks = content.match(codeRegex) || [];
                        
                        // Extract URLs
                        const urlRegex = /https?:\\/\\/[^\\s\\)]+/g;
                        const urls = content.match(urlRegex) || [];
                        
                        const result = {
                            requestId: \`code-search-\${Date.now()}\`,
                            originalQuery: searchData.originalQuery,
                            language: searchData.language,
                            searchType: searchData.searchType,
                            response: {
                                content: content,
                                model: apiResponse.model,
                                usage: apiResponse.usage
                            },
                            extracted: {
                                codeExamples: codeBlocks.map((block, i) => ({
                                    id: i + 1,
                                    code: block.replace(/\`\`\`[\\w]*\\n?/g, '').replace(/\\n\`\`\`/g, ''),
                                    language: searchData.language
                                })),
                                resources: [...new Set(urls)],
                                summary: content.split('\\n\\n')[0] || content.substring(0, 300)
                            },
                            timestamp: new Date().toISOString()
                        };
                        
                        return result;
                    `
                }
            }
        ];
    }
    
    generateDebuggingWorkflow() {
        return [
            {
                name: 'Debug Request',
                type: 'n8n-nodes-base.webhook',
                position: [100, 200],
                parameters: {
                    path: 'perplexity-debug-help',
                    httpMethod: 'POST'
                }
            },
            {
                name: 'Analyze Debug Request',
                type: '@kenkaiii/n8n-nodes-supercode.supercode',
                position: [300, 200],
                parameters: {
                    language: 'javascript',
                    code: `
                        const request = $input.first().json;
                        const errorMessage = request.error || request.issue || '';
                        const code = request.code || '';
                        const language = request.language || 'javascript';
                        const context = request.context || '';
                        
                        const debugQuery = \`
                        I need help debugging this \${language} code issue:
                        
                        Error/Issue: \${errorMessage}
                        
                        Code Context:
                        \${code}
                        
                        Additional Context: \${context}
                        
                        Please provide:
                        1. Root cause analysis
                        2. Step-by-step debugging approach
                        3. Specific fix recommendations
                        4. Code examples of the solution
                        5. Prevention strategies for similar issues
                        \`;
                        
                        return {
                            debugQuery: debugQuery.trim(),
                            errorMessage,
                            code,
                            language,
                            context,
                            priority: errorMessage.toLowerCase().includes('critical') ? 'high' : 'medium',
                            timestamp: new Date().toISOString()
                        };
                    `
                }
            },
            {
                name: 'Perplexity Debug Analysis',
                type: 'n8n-nodes-base.httpRequest',
                position: [500, 200],
                parameters: {
                    method: 'POST',
                    url: 'https://api.perplexity.ai/chat/completions',
                    headers: {
                        'Authorization': 'Bearer {{ $env.PERPLEXITY_API_KEY }}',
                        'Content-Type': 'application/json'
                    },
                    body: {
                        model: 'llama-3.1-sonar-large-128k-online',
                        messages: [
                            {
                                role: 'system',
                                content: 'You are an expert debugging assistant. Provide systematic, actionable debugging advice with specific code solutions.'
                            },
                            {
                                role: 'user',
                                content: '{{ $json.debugQuery }}'
                            }
                        ],
                        max_tokens: 1500,
                        temperature: 0.05
                    }
                }
            }
        ];
    }
    
    generateTestCommands() {
        return [
            {
                name: 'Test Code Search',
                description: 'Search for React hooks implementation',
                command: `curl -X POST "${this.n8nUrl}/webhook/perplexity-code-search" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "React useEffect hook with cleanup function",
    "language": "javascript",
    "difficulty": "intermediate"
  }'`
            },
            {
                name: 'Test Documentation Search',
                description: 'Find MongoDB aggregation documentation',
                command: `curl -X POST "${this.n8nUrl}/webhook/perplexity-docs-search" \\
  -H "Content-Type: application/json" \\
  -d '{
    "topic": "MongoDB aggregation pipeline",
    "includeExamples": true,
    "officialDocsOnly": false
  }'`
            },
            {
                name: 'Test Debug Help',
                description: 'Get help with async/await error',
                command: `curl -X POST "${this.n8nUrl}/webhook/perplexity-debug-help" \\
  -H "Content-Type: application/json" \\
  -d '{
    "error": "UnhandledPromiseRejectionWarning",
    "code": "async function fetchData() { await fetch('/api/data'); }",
    "language": "javascript",
    "context": "Node.js Express application"
  }'`
            },
            {
                name: 'Test Trends Research',
                description: 'Research latest JavaScript trends',
                command: `curl -X POST "${this.n8nUrl}/webhook/perplexity-trends" \\
  -H "Content-Type: application/json" \\
  -d '{
    "technology": "JavaScript",
    "timeframe": "2024",
    "focus": "frameworks and tools"
  }'`
            }
        ];
    }
    
    async generateImplementationGuide() {
        console.log('\n📖 Generating Perplexity Implementation Guide...');
        
        const guide = {
            title: 'Perplexity Integration Implementation Guide',
            description: 'Step-by-step guide for implementing Perplexity search capabilities in n8n',
            server: this.n8nUrl,
            apiKey: this.apiKey,
            prerequisites: [
                'Valid Perplexity API key',
                'Access to n8n instance at https://primosphere.ninja',
                'Community nodes installed: @kenkaiii/n8n-nodes-supercode',
                'Environment variables configured'
            ],
            setupSteps: [
                {
                    step: 1,
                    title: 'Configure API Key',
                    instructions: [
                        'Add PERPLEXITY_API_KEY to environment variables',
                        'Test API connection using provided test script',
                        'Verify API quota and rate limits'
                    ]
                },
                {
                    step: 2,
                    title: 'Create Search Workflows',
                    instructions: [
                        'Create code search workflow with webhook /webhook/perplexity-code-search',
                        'Create documentation search workflow with webhook /webhook/perplexity-docs-search',
                        'Create debugging assistance workflow with webhook /webhook/perplexity-debug-help',
                        'Create trends analysis workflow with webhook /webhook/perplexity-trends'
                    ]
                },
                {
                    step: 3,
                    title: 'Test Integration',
                    instructions: [
                        'Test each workflow using provided curl commands',
                        'Verify response format and data extraction',
                        'Check error handling and timeout behavior',
                        'Monitor API usage and performance'
                    ]
                }
            ],
            workflows: await this.createPerplexityN8nWorkflows(),
            testCommands: this.generateTestCommands(),
            bestPractices: [
                'Cache frequently requested results to reduce API calls',
                'Implement rate limiting to stay within API quotas',
                'Use appropriate models for different search types',
                'Extract and structure useful information from responses',
                'Monitor API usage and costs regularly'
            ],
            troubleshooting: [
                {
                    issue: 'API Authentication Error',
                    solutions: [
                        'Verify PERPLEXITY_API_KEY is correctly set',
                        'Check API key validity and permissions',
                        'Test API key with direct API call'
                    ]
                },
                {
                    issue: 'Rate Limit Exceeded',
                    solutions: [
                        'Implement exponential backoff retry logic',
                        'Add request throttling between calls',
                        'Consider upgrading API plan',
                        'Cache results to reduce duplicate requests'
                    ]
                },
                {
                    issue: 'Poor Search Results',
                    solutions: [
                        'Improve query formulation and context',
                        'Use more specific search templates',
                        'Adjust model selection for search type',
                        'Add more context to search prompts'
                    ]
                }
            ]
        };
        
        return guide;
    }
    
    async run() {
        console.log('\n🚀 Starting Perplexity Integration Setup...\n');
        
        // Test Perplexity connection
        const connectionSuccess = await this.testPerplexityConnection();
        
        if (!connectionSuccess) {
            console.log('\n⚠️ Perplexity API connection failed. Please check your API key and try again.');
            return;
        }
        
        // Generate workflows and guide
        const workflows = await this.createPerplexityN8nWorkflows();
        const guide = await this.generateImplementationGuide();
        
        // Perform test searches
        console.log('\n🧪 Running Test Searches...');
        
        try {
            // Test different search types
            await this.performCodeSearch('React useState hook examples', 'codeHelp');
            await this.performCodeSearch('Node.js async/await error handling', 'debugging');
            await this.performCodeSearch('MongoDB performance optimization', 'optimization');
            
        } catch (error) {
            console.log(`⚠️ Test search failed: ${error.message}`);
        }
        
        // Save implementation guide
        const guidePath = path.join(process.cwd(), 'docs', `perplexity-integration-guide-${Date.now()}.json`);
        await fs.mkdir(path.dirname(guidePath), { recursive: true });
        await fs.writeFile(guidePath, JSON.stringify(guide, null, 2));
        
        console.log('\n🎉 Perplexity Integration Setup Complete!');
        console.log('\n📊 Summary:');
        console.log(`   🔍 Search Templates: ${Object.keys(this.searchTemplates).length}`);
        console.log(`   ⚡ Workflows: ${workflows.length}`);
        console.log(`   🧪 Test Commands: ${guide.testCommands.length}`);
        console.log(`   📖 Guide Saved: ${guidePath}`);
        
        console.log('\n🚀 Next Steps:');
        console.log('1. Create n8n workflows using provided configurations');
        console.log('2. Test workflows with provided curl commands');
        console.log('3. Integrate with existing coding agent system');
        console.log('4. Monitor API usage and optimize queries');
        
        return guide;
    }
}

// Run the integration setup
if (require.main === module) {
    const system = new PerplexityIntegrationSystem();
    system.run().catch(console.error);
}

module.exports = PerplexityIntegrationSystem;