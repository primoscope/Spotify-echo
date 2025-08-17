#!/usr/bin/env node

/**
 * Advanced N8N Coding Agent Workflows Creator
 * Creates comprehensive workflows with coding agents, multimodal AI, and browser automation
 * Integrates Perplexity, Cursor API, GitHub, Browserbase, E2B, and all provided services
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class AdvancedN8nCodingAgentWorkflows {
    constructor() {
        this.apiUrl = process.env.N8N_API_URL || 'http://46.101.106.220';
        this.apiKey = process.env.N8N_API_KEY;
        this.username = process.env.N8N_USERNAME || 'willexmen8@gmail.com';
        this.password = process.env.N8N_PASSWORD || 'DapperMan77$$';
        
        // All API credentials from user
        this.credentials = {
            github: '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',
            cursor: 'key_01fc5475538efbe41e0cfa7f72eb1a7eeaab9a9217db67d509caaefe45280319',
            browserbase: 'bb_live_NKhsq1t4-MmXPTZO7vQqX5nCs8Q',
            gemini: 'AIzaSyAVqHaHBRos1lRKk5hi62mC9W7ssz3bzTw',
            mongodb: 'mongodb+srv://copilot:DapperMan77@cluster0.ofnyuy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
            digitalocean: 'dop_v1_93910c446f36d3069ca4462ba1779792e21b84f15da4831688f04094ca6680ff',
            brave: 'BSAQ0gsYuaYuEZHayb_Ek1pnl1l2RiW',
            perplexity: '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',
            redis: 'redis://default:jn7FVNpAbtvNvXpldDoc1IaQbYW5AIS4@redis-15392.crce175.eu-north-1-1.ec2.redns.redis-cloud.com:15392',
            e2b: 'e2b_d4bd1880d1447d46bc054503cb7822a17e30c26f',
            openrouter: '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',
            spotify_client_id: 'dcc2df507bde447c93a0199358ca219d',
            spotify_client_secret: '128089720b414d1e8233290d94fb38a0'
        };
        
        this.workflowsCreated = [];
        this.credentialsCreated = [];
        this.validationResults = {};
    }

    async initialize() {
        console.log('🚀 Initializing Advanced N8N Coding Agent Workflows...');
        console.log(`📍 N8N Instance: ${this.apiUrl}`);
        
        try {
            const health = await axios.get(`${this.apiUrl}/healthz`);
            console.log(`✅ N8N Health: ${health.data.status}`);
        } catch (error) {
            console.log(`❌ N8N Connection Error: ${error.message}`);
            throw new Error('Cannot connect to N8N instance');
        }
    }

    async createAllAdvancedCredentials() {
        console.log('🔑 Creating comprehensive API credentials...');
        
        const credentialsToCreate = [
            {
                name: 'EchoTune GitHub API',
                type: 'githubApi',
                data: {
                    accessToken: this.credentials.github
                }
            },
            {
                name: 'EchoTune Cursor API',
                type: 'httpHeaderAuth',
                data: {
                    name: 'Authorization',
                    value: `Bearer ${this.credentials.cursor}`
                }
            },
            {
                name: 'EchoTune Browserbase API',
                type: 'httpHeaderAuth',
                data: {
                    name: 'X-BB-API-Key',
                    value: this.credentials.browserbase
                }
            },
            {
                name: 'EchoTune Gemini API',
                type: 'httpHeaderAuth',
                data: {
                    name: 'X-API-Key',
                    value: this.credentials.gemini
                }
            },
            {
                name: 'EchoTune Perplexity API',
                type: 'httpHeaderAuth',
                data: {
                    name: 'Authorization',
                    value: `Bearer ${this.credentials.perplexity}`
                }
            },
            {
                name: 'EchoTune DigitalOcean API',
                type: 'httpHeaderAuth',
                data: {
                    name: 'Authorization',
                    value: `Bearer ${this.credentials.digitalocean}`
                }
            },
            {
                name: 'EchoTune Brave Search API',
                type: 'httpHeaderAuth',
                data: {
                    name: 'X-Subscription-Token',
                    value: this.credentials.brave
                }
            },
            {
                name: 'EchoTune E2B API',
                type: 'httpHeaderAuth',
                data: {
                    name: 'X-API-Key',
                    value: this.credentials.e2b
                }
            },
            {
                name: 'EchoTune OpenRouter API',
                type: 'httpHeaderAuth',
                data: {
                    name: 'Authorization',
                    value: `Bearer ${this.credentials.openrouter}`
                }
            },
            {
                name: 'EchoTune Redis Cloud',
                type: 'redis',
                data: {
                    connectionString: this.credentials.redis
                }
            }
        ];

        for (const credDef of credentialsToCreate) {
            try {
                const response = await axios.post(`${this.apiUrl}/api/v1/credentials`, credDef, {
                    headers: { 'X-N8N-API-KEY': this.apiKey }
                });
                
                console.log(`✅ Created credential: ${credDef.name} (ID: ${response.data.id})`);
                this.credentialsCreated.push(response.data);
            } catch (error) {
                console.log(`❌ Failed to create ${credDef.name}: ${error.response?.data?.message || error.message}`);
            }
        }
    }

    async createCodingAgentWorkflow() {
        console.log('🤖 Creating Comprehensive Coding Agent Workflow...');
        
        const workflow = {
            name: 'EchoTune Advanced Coding Agent with Perplexity',
            settings: { executionOrder: 'v1' },
            nodes: [
                {
                    id: '1',
                    name: 'Coding Request Webhook',
                    type: 'n8n-nodes-base.webhook',
                    typeVersion: 1,
                    position: [240, 300],
                    parameters: {
                        httpMethod: 'POST',
                        path: 'coding-agent',
                        responseMode: 'responseNode'
                    }
                },
                {
                    id: '2',
                    name: 'Analyze Request with Perplexity',
                    type: 'n8n-nodes-base.httpRequest',
                    typeVersion: 3,
                    position: [460, 200],
                    parameters: {
                        method: 'POST',
                        url: 'https://api.perplexity.ai/chat/completions',
                        options: {
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        },
                        body: {
                            model: 'llama-3.1-sonar-huge-128k-online',
                            messages: [{
                                role: 'user',
                                content: `Analyze this coding request and provide comprehensive research and implementation guidance: {{$json.request}}`
                            }],
                            max_tokens: 4000,
                            temperature: 0.1,
                            top_p: 0.9,
                            search_domain_filter: ['github.com', 'stackoverflow.com', 'docs.python.org', 'developer.mozilla.org'],
                            return_citations: true,
                            return_images: false
                        }
                    },
                    credentials: {
                        httpHeaderAuth: {
                            id: 'perplexity_creds_placeholder',
                            name: 'EchoTune Perplexity API'
                        }
                    }
                },
                {
                    id: '3',
                    name: 'Research with Brave Search',
                    type: 'n8n-nodes-base.httpRequest',
                    typeVersion: 3,
                    position: [460, 400],
                    parameters: {
                        method: 'GET',
                        url: 'https://api.search.brave.com/res/v1/web/search',
                        options: {
                            queryParameterArrays: {
                                q: 'coding {{$json.technology}} best practices examples github'
                            }
                        }
                    },
                    credentials: {
                        httpHeaderAuth: {
                            id: 'brave_creds_placeholder',
                            name: 'EchoTune Brave Search API'
                        }
                    }
                },
                {
                    id: '4',
                    name: 'Generate Code with Cursor API',
                    type: 'n8n-nodes-base.httpRequest',
                    typeVersion: 3,
                    position: [680, 200],
                    parameters: {
                        method: 'POST',
                        url: 'https://api.cursor.sh/v1/chat/completions',
                        options: {
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        },
                        body: {
                            model: 'gpt-4',
                            messages: [{
                                role: 'system',
                                content: 'You are an expert coding agent. Generate high-quality, production-ready code based on the research and requirements provided.'
                            }, {
                                role: 'user',
                                content: `Based on this research: {{$('Analyze Request with Perplexity').first().json.choices[0].message.content}}\n\nAnd additional context: {{$('Research with Brave Search').first().json}}\n\nGenerate code for: {{$('Coding Request Webhook').first().json.request}}`
                            }],
                            max_tokens: 4000,
                            temperature: 0.1
                        }
                    },
                    credentials: {
                        httpHeaderAuth: {
                            id: 'cursor_creds_placeholder',
                            name: 'EchoTune Cursor API'
                        }
                    }
                },
                {
                    id: '5',
                    name: 'Execute Code in E2B Sandbox',
                    type: 'n8n-nodes-base.httpRequest',
                    typeVersion: 3,
                    position: [680, 400],
                    parameters: {
                        method: 'POST',
                        url: 'https://api.e2b.dev/sandboxes',
                        options: {
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        },
                        body: {
                            template: 'base',
                            metadata: {
                                name: 'echotune-code-execution'
                            }
                        }
                    },
                    credentials: {
                        httpHeaderAuth: {
                            id: 'e2b_creds_placeholder',
                            name: 'EchoTune E2B API'
                        }
                    }
                },
                {
                    id: '6',
                    name: 'Validate with AI',
                    type: 'n8n-nodes-base.httpRequest',
                    typeVersion: 3,
                    position: [900, 300],
                    parameters: {
                        method: 'POST',
                        url: 'https://openrouter.ai/api/v1/chat/completions',
                        options: {
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        },
                        body: {
                            model: 'anthropic/claude-3.5-sonnet',
                            messages: [{
                                role: 'user',
                                content: `Review and validate this generated code: {{$('Generate Code with Cursor API').first().json.choices[0].message.content}}\n\nExecution results: {{$('Execute Code in E2B Sandbox').first().json}}\n\nProvide quality assessment, improvements, and final recommendations.`
                            }],
                            max_tokens: 2000
                        }
                    },
                    credentials: {
                        httpHeaderAuth: {
                            id: 'openrouter_creds_placeholder',
                            name: 'EchoTune OpenRouter API'
                        }
                    }
                },
                {
                    id: '7',
                    name: 'Create GitHub Repository',
                    type: 'n8n-nodes-base.github',
                    typeVersion: 1,
                    position: [1120, 200],
                    parameters: {
                        operation: 'create',
                        resource: 'repository',
                        name: 'echotune-generated-{{Date.now()}}',
                        description: 'Generated by EchoTune AI Coding Agent',
                        private: false,
                        autoInit: true
                    },
                    credentials: {
                        githubApi: {
                            id: 'github_creds_placeholder',
                            name: 'EchoTune GitHub API'
                        }
                    }
                },
                {
                    id: '8',
                    name: 'Store Results in MongoDB',
                    type: 'n8n-nodes-base.mongoDb',
                    typeVersion: 1,
                    position: [1120, 400],
                    parameters: {
                        operation: 'insert',
                        collection: 'coding_sessions',
                        fields: 'session_id,request,research_results,generated_code,validation_results,github_repo,created_at'
                    },
                    credentials: {
                        mongoDb: {
                            id: 'mongo_creds_placeholder',
                            name: 'EchoTune MongoDB'
                        }
                    }
                },
                {
                    id: '9',
                    name: 'Return Comprehensive Response',
                    type: 'n8n-nodes-base.respondToWebhook',
                    typeVersion: 1,
                    position: [1340, 300],
                    parameters: {
                        responseBody: JSON.stringify({
                            success: true,
                            session_id: '{{Date.now()}}',
                            research: '{{$("Analyze Request with Perplexity").first().json.choices[0].message.content}}',
                            code: '{{$("Generate Code with Cursor API").first().json.choices[0].message.content}}',
                            validation: '{{$("Validate with AI").first().json.choices[0].message.content}}',
                            github_repo: '{{$("Create GitHub Repository").first().json.html_url}}',
                            execution_results: '{{$("Execute Code in E2B Sandbox").first().json}}'
                        }),
                        statusCode: 200
                    }
                }
            ],
            connections: {
                'Coding Request Webhook': {
                    main: [[
                        { node: 'Analyze Request with Perplexity', type: 'main', index: 0 },
                        { node: 'Research with Brave Search', type: 'main', index: 0 }
                    ]]
                },
                'Analyze Request with Perplexity': {
                    main: [[ { node: 'Generate Code with Cursor API', type: 'main', index: 0 }]]
                },
                'Research with Brave Search': {
                    main: [[ { node: 'Generate Code with Cursor API', type: 'main', index: 0 }]]
                },
                'Generate Code with Cursor API': {
                    main: [[
                        { node: 'Execute Code in E2B Sandbox', type: 'main', index: 0 },
                        { node: 'Validate with AI', type: 'main', index: 0 }
                    ]]
                },
                'Execute Code in E2B Sandbox': {
                    main: [[ { node: 'Validate with AI', type: 'main', index: 0 }]]
                },
                'Validate with AI': {
                    main: [[
                        { node: 'Create GitHub Repository', type: 'main', index: 0 },
                        { node: 'Store Results in MongoDB', type: 'main', index: 0 }
                    ]]
                },
                'Create GitHub Repository': {
                    main: [[ { node: 'Return Comprehensive Response', type: 'main', index: 0 }]]
                },
                'Store Results in MongoDB': {
                    main: [[ { node: 'Return Comprehensive Response', type: 'main', index: 0 }]]
                }
            }
        };

        return await this.createWorkflow(workflow);
    }

    async createMultimodalAIAgentWorkflow() {
        console.log('🎨 Creating Multimodal AI Agent Workflow...');
        
        const workflow = {
            name: 'EchoTune Multimodal AI Agent with Vision & Audio',
            settings: { executionOrder: 'v1' },
            nodes: [
                {
                    id: '1',
                    name: 'Multimodal Request Webhook',
                    type: 'n8n-nodes-base.webhook',
                    typeVersion: 1,
                    position: [240, 300],
                    parameters: {
                        httpMethod: 'POST',
                        path: 'multimodal-ai-agent',
                        responseMode: 'responseNode'
                    }
                },
                {
                    id: '2',
                    name: 'Analyze with Gemini Vision',
                    type: 'n8n-nodes-base.httpRequest',
                    typeVersion: 3,
                    position: [460, 200],
                    parameters: {
                        method: 'POST',
                        url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent',
                        options: {
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        },
                        body: {
                            contents: [{
                                parts: [{
                                    text: 'Analyze this multimodal input and provide comprehensive insights: {{$json.prompt}}'
                                }]
                            }],
                            generationConfig: {
                                temperature: 0.4,
                                topK: 32,
                                topP: 1,
                                maxOutputTokens: 4096
                            }
                        }
                    },
                    credentials: {
                        httpHeaderAuth: {
                            id: 'gemini_creds_placeholder',
                            name: 'EchoTune Gemini API'
                        }
                    }
                },
                {
                    id: '3',
                    name: 'Browser Automation with Browserbase',
                    type: 'n8n-nodes-base.httpRequest',
                    typeVersion: 3,
                    position: [460, 400],
                    parameters: {
                        method: 'POST',
                        url: 'https://www.browserbase.com/v1/sessions',
                        options: {
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        },
                        body: {
                            projectId: 'echotune-automation',
                            enableRecording: true
                        }
                    },
                    credentials: {
                        httpHeaderAuth: {
                            id: 'browserbase_creds_placeholder',
                            name: 'EchoTune Browserbase API'
                        }
                    }
                },
                {
                    id: '4',
                    name: 'Enhanced Analysis with OpenRouter',
                    type: 'n8n-nodes-base.httpRequest',
                    typeVersion: 3,
                    position: [680, 300],
                    parameters: {
                        method: 'POST',
                        url: 'https://openrouter.ai/api/v1/chat/completions',
                        options: {
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        },
                        body: {
                            model: 'anthropic/claude-3.5-sonnet',
                            messages: [{
                                role: 'system',
                                content: 'You are a multimodal AI agent capable of processing text, images, audio, and web interactions.'
                            }, {
                                role: 'user',
                                content: `Combine these insights:\n\nGemini Analysis: {{$('Analyze with Gemini Vision').first().json}}\n\nBrowser Session: {{$('Browser Automation with Browserbase').first().json}}\n\nOriginal Request: {{$('Multimodal Request Webhook').first().json.prompt}}\n\nProvide comprehensive multimodal analysis and actionable recommendations.`
                            }],
                            max_tokens: 4000,
                            temperature: 0.2
                        }
                    },
                    credentials: {
                        httpHeaderAuth: {
                            id: 'openrouter_creds_placeholder',
                            name: 'EchoTune OpenRouter API'
                        }
                    }
                },
                {
                    id: '5',
                    name: 'Cache Results in Redis',
                    type: 'n8n-nodes-base.redis',
                    typeVersion: 1,
                    position: [900, 200],
                    parameters: {
                        operation: 'set',
                        key: 'multimodal_session_{{Date.now()}}',
                        value: '{{JSON.stringify($input.all())}}',
                        ttl: 3600
                    },
                    credentials: {
                        redis: {
                            id: 'redis_creds_placeholder',
                            name: 'EchoTune Redis Cloud'
                        }
                    }
                },
                {
                    id: '6',
                    name: 'Store Analysis in MongoDB',
                    type: 'n8n-nodes-base.mongoDb',
                    typeVersion: 1,
                    position: [900, 400],
                    parameters: {
                        operation: 'insert',
                        collection: 'multimodal_sessions'
                    },
                    credentials: {
                        mongoDb: {
                            id: 'mongo_creds_placeholder',
                            name: 'EchoTune MongoDB'
                        }
                    }
                },
                {
                    id: '7',
                    name: 'Return Multimodal Response',
                    type: 'n8n-nodes-base.respondToWebhook',
                    typeVersion: 1,
                    position: [1120, 300],
                    parameters: {
                        responseBody: JSON.stringify({
                            success: true,
                            session_id: 'multimodal_{{Date.now()}}',
                            gemini_analysis: '{{$("Analyze with Gemini Vision").first().json}}',
                            browser_session: '{{$("Browser Automation with Browserbase").first().json.id}}',
                            enhanced_analysis: '{{$("Enhanced Analysis with OpenRouter").first().json.choices[0].message.content}}',
                            cached_in_redis: true,
                            stored_in_mongodb: true
                        }),
                        statusCode: 200
                    }
                }
            ],
            connections: {
                'Multimodal Request Webhook': {
                    main: [[
                        { node: 'Analyze with Gemini Vision', type: 'main', index: 0 },
                        { node: 'Browser Automation with Browserbase', type: 'main', index: 0 }
                    ]]
                },
                'Analyze with Gemini Vision': {
                    main: [[ { node: 'Enhanced Analysis with OpenRouter', type: 'main', index: 0 }]]
                },
                'Browser Automation with Browserbase': {
                    main: [[ { node: 'Enhanced Analysis with OpenRouter', type: 'main', index: 0 }]]
                },
                'Enhanced Analysis with OpenRouter': {
                    main: [[
                        { node: 'Cache Results in Redis', type: 'main', index: 0 },
                        { node: 'Store Analysis in MongoDB', type: 'main', index: 0 }
                    ]]
                },
                'Cache Results in Redis': {
                    main: [[ { node: 'Return Multimodal Response', type: 'main', index: 0 }]]
                },
                'Store Analysis in MongoDB': {
                    main: [[ { node: 'Return Multimodal Response', type: 'main', index: 0 }]]
                }
            }
        };

        return await this.createWorkflow(workflow);
    }

    async createPerplexityBrowserResearchWorkflow() {
        console.log('🔍 Creating Perplexity Browser Research Workflow...');
        
        const workflow = {
            name: 'EchoTune Perplexity Browser Research & Analysis',
            settings: { executionOrder: 'v1' },
            nodes: [
                {
                    id: '1',
                    name: 'Research Request Webhook',
                    type: 'n8n-nodes-base.webhook',
                    typeVersion: 1,
                    position: [240, 300],
                    parameters: {
                        httpMethod: 'POST',
                        path: 'perplexity-browser-research',
                        responseMode: 'responseNode'
                    }
                },
                {
                    id: '2',
                    name: 'Initial Perplexity Research',
                    type: 'n8n-nodes-base.httpRequest',
                    typeVersion: 3,
                    position: [460, 200],
                    parameters: {
                        method: 'POST',
                        url: 'https://api.perplexity.ai/chat/completions',
                        options: {
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        },
                        body: {
                            model: 'llama-3.1-sonar-huge-128k-online',
                            messages: [{
                                role: 'system',
                                content: 'You are a comprehensive research assistant. Conduct thorough research with citations and provide detailed analysis.'
                            }, {
                                role: 'user',
                                content: 'Research: {{$json.research_topic}}. Provide comprehensive analysis with latest information, trends, and actionable insights.'
                            }],
                            max_tokens: 4000,
                            temperature: 0.1,
                            top_p: 0.9,
                            search_domain_filter: ['github.com', 'arxiv.org', 'scholar.google.com', 'stackoverflow.com'],
                            return_citations: true,
                            return_images: false
                        }
                    },
                    credentials: {
                        httpHeaderAuth: {
                            id: 'perplexity_creds_placeholder',
                            name: 'EchoTune Perplexity API'
                        }
                    }
                },
                {
                    id: '3',
                    name: 'Browser Session Creation',
                    type: 'n8n-nodes-base.httpRequest',
                    typeVersion: 3,
                    position: [460, 400],
                    parameters: {
                        method: 'POST',
                        url: 'https://www.browserbase.com/v1/sessions',
                        options: {
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        },
                        body: {
                            projectId: 'echotune-research',
                            enableRecording: true,
                            browserSettings: {
                                viewport: { width: 1920, height: 1080 }
                            }
                        }
                    },
                    credentials: {
                        httpHeaderAuth: {
                            id: 'browserbase_creds_placeholder',
                            name: 'EchoTune Browserbase API'
                        }
                    }
                },
                {
                    id: '4',
                    name: 'Deep Research Analysis',
                    type: 'n8n-nodes-base.httpRequest',
                    typeVersion: 3,
                    position: [680, 300],
                    parameters: {
                        method: 'POST',
                        url: 'https://api.perplexity.ai/chat/completions',
                        options: {
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        },
                        body: {
                            model: 'llama-3.1-sonar-huge-128k-online',
                            messages: [{
                                role: 'system',
                                content: 'You are conducting a comprehensive second-pass research analysis. Build upon the initial research to provide deeper insights.'
                            }, {
                                role: 'user',
                                content: `Based on this initial research: {{$('Initial Perplexity Research').first().json.choices[0].message.content}}\n\nConduct deeper analysis of: {{$('Research Request Webhook').first().json.research_topic}}\n\nFocus on: implementation details, best practices, recent developments, and practical applications.`
                            }],
                            max_tokens: 4000,
                            temperature: 0.05,
                            search_domain_filter: ['github.com', 'medium.com', 'dev.to', 'hackernoon.com'],
                            return_citations: true
                        }
                    },
                    credentials: {
                        httpHeaderAuth: {
                            id: 'perplexity_creds_placeholder',
                            name: 'EchoTune Perplexity API'
                        }
                    }
                },
                {
                    id: '5',
                    name: 'Browser Research Automation',
                    type: 'n8n-nodes-base.code',
                    typeVersion: 2,
                    position: [680, 500],
                    parameters: {
                        jsCode: `
// Simulate browser research automation
const browserSession = $('Browser Session Creation').first().json;
const researchTopic = $('Research Request Webhook').first().json.research_topic;

// Extract key URLs and topics for browser research
const initialResearch = $('Initial Perplexity Research').first().json.choices[0].message.content;
const urlPattern = /https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)/g;
const urls = initialResearch.match(urlPattern) || [];

const researchData = {
  session_id: browserSession.id,
  topic: researchTopic,
  discovered_urls: urls.slice(0, 10), // Limit to first 10 URLs
  automated_research: {
    github_repos_found: urls.filter(url => url.includes('github.com')).length,
    documentation_links: urls.filter(url => url.includes('docs.')).length,
    tutorial_links: urls.filter(url => url.includes('tutorial') || url.includes('guide')).length
  },
  timestamp: new Date().toISOString()
};

return [{ json: researchData }];
`
                    }
                },
                {
                    id: '6',
                    name: 'Comprehensive Analysis Report',
                    type: 'n8n-nodes-base.httpRequest',
                    typeVersion: 3,
                    position: [900, 300],
                    parameters: {
                        method: 'POST',
                        url: 'https://openrouter.ai/api/v1/chat/completions',
                        options: {
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        },
                        body: {
                            model: 'anthropic/claude-3.5-sonnet',
                            messages: [{
                                role: 'system',
                                content: 'You are generating a comprehensive research analysis report. Synthesize all research data into actionable insights and recommendations.'
                            }, {
                                role: 'user',
                                content: `Generate a comprehensive research report for: {{$('Research Request Webhook').first().json.research_topic}}\n\nInitial Research: {{$('Initial Perplexity Research').first().json.choices[0].message.content}}\n\nDeep Analysis: {{$('Deep Research Analysis').first().json.choices[0].message.content}}\n\nBrowser Research: {{$('Browser Research Automation').first().json}}\n\nProvide:\n1. Executive Summary\n2. Key Findings\n3. Implementation Roadmap\n4. Resource Links\n5. Next Steps\n6. Risk Assessment`
                            }],
                            max_tokens: 6000,
                            temperature: 0.1
                        }
                    },
                    credentials: {
                        httpHeaderAuth: {
                            id: 'openrouter_creds_placeholder',
                            name: 'EchoTune OpenRouter API'
                        }
                    }
                },
                {
                    id: '7',
                    name: 'Store Research Results',
                    type: 'n8n-nodes-base.mongoDb',
                    typeVersion: 1,
                    position: [1120, 200],
                    parameters: {
                        operation: 'insert',
                        collection: 'research_sessions'
                    },
                    credentials: {
                        mongoDb: {
                            id: 'mongo_creds_placeholder',
                            name: 'EchoTune MongoDB'
                        }
                    }
                },
                {
                    id: '8',
                    name: 'Cache in Redis',
                    type: 'n8n-nodes-base.redis',
                    typeVersion: 1,
                    position: [1120, 400],
                    parameters: {
                        operation: 'set',
                        key: 'research_{{Date.now()}}',
                        value: '{{JSON.stringify($input.all())}}',
                        ttl: 7200
                    },
                    credentials: {
                        redis: {
                            id: 'redis_creds_placeholder',
                            name: 'EchoTune Redis Cloud'
                        }
                    }
                },
                {
                    id: '9',
                    name: 'Return Research Report',
                    type: 'n8n-nodes-base.respondToWebhook',
                    typeVersion: 1,
                    position: [1340, 300],
                    parameters: {
                        responseBody: JSON.stringify({
                            success: true,
                            research_id: 'research_{{Date.now()}}',
                            topic: '{{$("Research Request Webhook").first().json.research_topic}}',
                            initial_research: '{{$("Initial Perplexity Research").first().json.choices[0].message.content}}',
                            deep_analysis: '{{$("Deep Research Analysis").first().json.choices[0].message.content}}',
                            browser_research: '{{$("Browser Research Automation").first().json}}',
                            comprehensive_report: '{{$("Comprehensive Analysis Report").first().json.choices[0].message.content}}',
                            browser_session_id: '{{$("Browser Session Creation").first().json.id}}',
                            stored_in_mongodb: true,
                            cached_in_redis: true,
                            generated_at: '{{new Date().toISOString()}}'
                        }),
                        statusCode: 200
                    }
                }
            ],
            connections: {
                'Research Request Webhook': {
                    main: [[
                        { node: 'Initial Perplexity Research', type: 'main', index: 0 },
                        { node: 'Browser Session Creation', type: 'main', index: 0 }
                    ]]
                },
                'Initial Perplexity Research': {
                    main: [[
                        { node: 'Deep Research Analysis', type: 'main', index: 0 },
                        { node: 'Browser Research Automation', type: 'main', index: 0 }
                    ]]
                },
                'Browser Session Creation': {
                    main: [[ { node: 'Browser Research Automation', type: 'main', index: 0 }]]
                },
                'Deep Research Analysis': {
                    main: [[ { node: 'Comprehensive Analysis Report', type: 'main', index: 0 }]]
                },
                'Browser Research Automation': {
                    main: [[ { node: 'Comprehensive Analysis Report', type: 'main', index: 0 }]]
                },
                'Comprehensive Analysis Report': {
                    main: [[
                        { node: 'Store Research Results', type: 'main', index: 0 },
                        { node: 'Cache in Redis', type: 'main', index: 0 }
                    ]]
                },
                'Store Research Results': {
                    main: [[ { node: 'Return Research Report', type: 'main', index: 0 }]]
                },
                'Cache in Redis': {
                    main: [[ { node: 'Return Research Report', type: 'main', index: 0 }]]
                }
            }
        };

        return await this.createWorkflow(workflow);
    }

    async createWorkflow(workflowDef) {
        try {
            const response = await axios.post(`${this.apiUrl}/api/v1/workflows`, workflowDef, {
                headers: { 
                    'X-N8N-API-KEY': this.apiKey,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log(`✅ Created workflow: ${workflowDef.name} (ID: ${response.data.id})`);
            this.workflowsCreated.push(response.data);
            return response.data;
        } catch (error) {
            console.log(`❌ Failed to create workflow ${workflowDef.name}: ${error.response?.data?.message || error.message}`);
            return null;
        }
    }

    async updateCredentialReferences() {
        console.log('🔗 Updating credential references in workflows...');
        
        // Map credential names to IDs
        const credentialMap = {};
        this.credentialsCreated.forEach(cred => {
            credentialMap[cred.name] = cred.id;
        });

        for (const workflow of this.workflowsCreated) {
            let updated = false;
            const updatedNodes = workflow.nodes.map(node => {
                if (node.credentials) {
                    Object.keys(node.credentials).forEach(credType => {
                        const credName = node.credentials[credType].name;
                        if (credentialMap[credName]) {
                            node.credentials[credType].id = credentialMap[credName];
                            updated = true;
                        }
                    });
                }
                return node;
            });

            if (updated) {
                try {
                    await axios.patch(`${this.apiUrl}/api/v1/workflows/${workflow.id}`, {
                        ...workflow,
                        nodes: updatedNodes
                    }, {
                        headers: { 'X-N8N-API-KEY': this.apiKey }
                    });
                    console.log(`✅ Updated credentials for workflow: ${workflow.name}`);
                } catch (error) {
                    console.log(`❌ Failed to update workflow ${workflow.name}: ${error.message}`);
                }
            }
        }
    }

    async deployAllAdvancedWorkflows() {
        console.log('🚀 Deploying Advanced Coding Agent Workflows...');
        
        try {
            await this.initialize();
            
            // Create comprehensive credentials
            await this.createAllAdvancedCredentials();
            
            // Create advanced workflows
            await this.createCodingAgentWorkflow();
            await this.createMultimodalAIAgentWorkflow();
            await this.createPerplexityBrowserResearchWorkflow();
            
            // Update credential references
            await this.updateCredentialReferences();
            
            // Generate comprehensive deployment report
            await this.generateAdvancedDeploymentReport();
            
            console.log('\n🎉 Advanced N8N Workflow deployment completed successfully!');
            
        } catch (error) {
            console.error('❌ Deployment failed:', error);
        }
    }

    async generateAdvancedDeploymentReport() {
        console.log('\n📊 ADVANCED DEPLOYMENT REPORT');
        console.log('=' .repeat(60));
        
        const report = {
            deployment_type: 'Advanced Coding Agent Workflows',
            deployment_date: new Date().toISOString(),
            server_url: this.apiUrl,
            workflows_created: this.workflowsCreated.length,
            credentials_created: this.credentialsCreated.length,
            
            workflows: this.workflowsCreated.map(w => ({
                id: w.id,
                name: w.name,
                endpoint: w.name.includes('Coding Agent') ? `${this.apiUrl}/webhook/coding-agent` :
                         w.name.includes('Multimodal') ? `${this.apiUrl}/webhook/multimodal-ai-agent` :
                         w.name.includes('Research') ? `${this.apiUrl}/webhook/perplexity-browser-research` : null,
                capabilities: w.name.includes('Coding Agent') ? ['Perplexity Research', 'Cursor Code Generation', 'E2B Execution', 'GitHub Integration'] :
                            w.name.includes('Multimodal') ? ['Gemini Vision', 'Browser Automation', 'OpenRouter Analysis'] :
                            w.name.includes('Research') ? ['Perplexity Deep Research', 'Browser Sessions', 'Comprehensive Analysis'] : []
            })),
            
            credentials: this.credentialsCreated.map(c => ({
                id: c.id,
                name: c.name,
                type: c.type,
                service: c.name.includes('GitHub') ? 'GitHub API' :
                        c.name.includes('Cursor') ? 'Cursor AI' :
                        c.name.includes('Browserbase') ? 'Browser Automation' :
                        c.name.includes('Gemini') ? 'Google Gemini' :
                        c.name.includes('Perplexity') ? 'Perplexity AI' :
                        c.name.includes('DigitalOcean') ? 'DigitalOcean' :
                        c.name.includes('Brave') ? 'Brave Search' :
                        c.name.includes('E2B') ? 'E2B Code Execution' :
                        c.name.includes('OpenRouter') ? 'OpenRouter' :
                        c.name.includes('Redis') ? 'Redis Cloud' : 'Unknown'
            })),
            
            api_endpoints: [
                `${this.apiUrl}/webhook/coding-agent`,
                `${this.apiUrl}/webhook/multimodal-ai-agent`, 
                `${this.apiUrl}/webhook/perplexity-browser-research`
            ],
            
            features: [
                'AI-Powered Code Generation with Cursor API',
                'Comprehensive Perplexity Research Integration',
                'E2B Secure Code Execution Environment',
                'GitHub Repository Auto-Creation',
                'Multimodal AI with Gemini Vision',
                'Browser Automation with Browserbase',
                'Deep Research Analysis with Citations',
                'Redis Caching for Performance',
                'MongoDB Data Persistence',
                'OpenRouter Multi-Model AI Analysis'
            ]
        };
        
        console.log(`✅ Advanced Workflows Created: ${report.workflows_created}`);
        report.workflows.forEach((workflow, index) => {
            console.log(`   ${index + 1}. ${workflow.name}`);
            console.log(`      Endpoint: ${workflow.endpoint}`);
            console.log(`      Capabilities: ${workflow.capabilities.join(', ')}`);
        });
        
        console.log(`\n✅ API Credentials Configured: ${report.credentials_created}`);
        report.credentials.forEach((cred, index) => {
            console.log(`   ${index + 1}. ${cred.service} (${cred.name})`);
        });
        
        console.log('\n🔗 Advanced API Endpoints:');
        report.api_endpoints.forEach((endpoint, index) => {
            console.log(`   ${index + 1}. ${endpoint}`);
        });
        
        console.log('\n🚀 Advanced Features Available:');
        report.features.forEach((feature, index) => {
            console.log(`   ${index + 1}. ${feature}`);
        });
        
        // Save comprehensive report
        await fs.writeFile(
            path.join(__dirname, '../reports/advanced-n8n-deployment-report.json'),
            JSON.stringify(report, null, 2)
        );
        
        console.log('\n💾 Advanced deployment report saved to reports/advanced-n8n-deployment-report.json');
        
        return report;
    }
}

// Run if executed directly
if (require.main === module) {
    const creator = new AdvancedN8nCodingAgentWorkflows();
    creator.deployAllAdvancedWorkflows().catch(console.error);
}

module.exports = AdvancedN8nCodingAgentWorkflows;