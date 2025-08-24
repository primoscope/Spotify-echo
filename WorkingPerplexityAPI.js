/**
 * WORKING PERPLEXITY API INTEGRATION MODULE
 * 
 * This module provides verified working integration with Perplexity API
 * using confirmed working models: sonar and sonar-pro
 * 
 * Generated: 2025-08-24T01:36:34.953Z
 */

const https = require('https');

class WorkingPerplexityAPI {
    constructor(apiKey) {
        this.apiKey = apiKey || process.env.PERPLEXITY_API_KEY;
        this.baseUrl = 'https://api.perplexity.ai';
        this.models = {
            sonar: 'sonar',           // Fast search-enabled model
            sonarPro: 'sonar-pro'     // Advanced search-enabled model
        };
        
        if (!this.apiKey) {
            throw new Error('Perplexity API key is required');
        }
    }

    /**
     * Make API request to Perplexity with working models
     */
    async makeRequest(prompt, options = {}) {
        const model = options.model || this.models.sonarPro;
        const maxTokens = options.maxTokens || 1000;
        const temperature = options.temperature || 0.3;

        const messages = [
            {
                role: 'system',
                content: options.systemPrompt || 'You are a helpful AI assistant with access to current web information.'
            },
            {
                role: 'user',
                content: prompt
            }
        ];

        return new Promise((resolve, reject) => {
            const payload = {
                model: model,
                messages: messages,
                max_tokens: maxTokens,
                temperature: temperature
            };

            const postData = JSON.stringify(payload);
            const requestOptions = {
                hostname: 'api.perplexity.ai',
                port: 443,
                path: '/chat/completions',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const req = https.request(requestOptions, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        
                        if (res.statusCode === 200) {
                            resolve({
                                success: true,
                                content: response.choices[0]?.message?.content || '',
                                model: model,
                                usage: response.usage,
                                timestamp: new Date().toISOString()
                            });
                        } else {
                            reject(new Error(`API Error: ${response.error?.message || 'Unknown error'}`));
                        }
                    } catch (error) {
                        reject(new Error(`Response parsing failed: ${error.message}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error(`Request failed: ${error.message}`));
            });

            req.write(postData);
            req.end();
        });
    }

    /**
     * Research and analyze with web search
     */
    async research(topic, options = {}) {
        const prompt = `Research and analyze: ${topic}

Please provide:
- Current state and latest developments
- Key insights and trends
- Practical recommendations
- Specific actionable next steps

Use web search to ensure information is current and accurate.`;

        return await this.makeRequest(prompt, {
            ...options,
            model: this.models.sonarPro,
            systemPrompt: 'You are a research analyst with access to current web information. Provide comprehensive, well-sourced analysis.'
        });
    }

    /**
     * Generate development tasks based on research
     */
    async generateTasks(projectContext, options = {}) {
        const prompt = `Based on current technology trends and best practices, generate specific development tasks for: ${projectContext}

Requirements:
- 5-7 actionable tasks
- Include effort estimates (Small/Medium/Large)
- Reference current technologies and practices
- Include priority levels
- Be specific and implementable

Format as a numbered list with clear descriptions.`;

        return await this.makeRequest(prompt, {
            ...options,
            model: this.models.sonar,
            maxTokens: 1500,
            systemPrompt: 'You are a technical product manager specializing in software development planning.'
        });
    }

    /**
     * Analyze repository or codebase
     */
    async analyzeRepository(repoDescription, options = {}) {
        const prompt = `Analyze this software project: ${repoDescription}

Provide:
1. Architecture assessment
2. Technology stack evaluation
3. Performance optimization opportunities
4. Security considerations
5. Development workflow improvements
6. Integration opportunities
7. Current market positioning

Use current industry standards and best practices for recommendations.`;

        return await this.makeRequest(prompt, {
            ...options,
            model: this.models.sonarPro,
            maxTokens: 2000,
            systemPrompt: 'You are a senior software architect with expertise in system analysis and optimization.'
        });
    }
}

module.exports = WorkingPerplexityAPI;

// Usage example:
// const perplexity = new WorkingPerplexityAPI();
// const result = await perplexity.research('AI music recommendation trends 2025');
// console.log(result.content);
