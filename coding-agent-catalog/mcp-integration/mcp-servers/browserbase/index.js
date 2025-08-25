#!/usr/bin/env node

/**
 * Browserbase MCP Server
 * 
 * MCP server for Browserbase automation integration with Playwright,
 * web scraping, and browser automation capabilities.
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const axios = require('axios');

class BrowserbaseMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'browserbase-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    
    this.apiKey = process.env.BROWSERBASE_API_KEY;
    this.baseUrl = process.env.BROWSERBASE_BASE_URL || 'https://www.browserbase.com/v1';
    this.projectId = process.env.BROWSERBASE_PROJECT_ID || 'default';
    this.setupHandlers();
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'browserbase_create_session',
            description: 'Create a new browser session on Browserbase',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: {
                  type: 'string',
                  description: 'Project ID (optional, uses default if not provided)',
                },
                browserSettings: {
                  type: 'object',
                  description: 'Browser settings and configuration',
                  default: {},
                },
              },
            },
          },
          {
            name: 'browserbase_navigate',
            description: 'Navigate to a URL in a browser session',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: {
                  type: 'string',
                  description: 'Browser session ID',
                },
                url: {
                  type: 'string',
                  description: 'URL to navigate to',
                },
                waitForLoad: {
                  type: 'boolean',
                  description: 'Wait for page to fully load',
                  default: true,
                },
              },
              required: ['sessionId', 'url'],
            },
          },
          {
            name: 'browserbase_extract_content',
            description: 'Extract content from the current page',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: {
                  type: 'string',
                  description: 'Browser session ID',
                },
                selector: {
                  type: 'string',
                  description: 'CSS selector for content to extract',
                },
                extract_type: {
                  type: 'string',
                  description: 'Type of content to extract (text, html, attributes)',
                  default: 'text',
                },
                multiple: {
                  type: 'boolean',
                  description: 'Extract multiple elements matching selector',
                  default: false,
                },
              },
              required: ['sessionId'],
            },
          },
          {
            name: 'browserbase_interact',
            description: 'Interact with page elements (click, type, etc.)',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: {
                  type: 'string',
                  description: 'Browser session ID',
                },
                action: {
                  type: 'string',
                  description: 'Action type (click, type, scroll, select)',
                },
                selector: {
                  type: 'string',
                  description: 'CSS selector for target element',
                },
                value: {
                  type: 'string',
                  description: 'Value for type/select actions',
                },
                options: {
                  type: 'object',
                  description: 'Additional action options',
                  default: {},
                },
              },
              required: ['sessionId', 'action', 'selector'],
            },
          },
          {
            name: 'browserbase_screenshot',
            description: 'Take a screenshot of the current page',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: {
                  type: 'string',
                  description: 'Browser session ID',
                },
                selector: {
                  type: 'string',
                  description: 'CSS selector for element to screenshot (optional)',
                },
                fullPage: {
                  type: 'boolean',
                  description: 'Take full page screenshot',
                  default: false,
                },
              },
              required: ['sessionId'],
            },
          },
          {
            name: 'browserbase_close_session',
            description: 'Close a browser session',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: {
                  type: 'string',
                  description: 'Browser session ID to close',
                },
              },
              required: ['sessionId'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'browserbase_create_session':
            return await this.handleCreateSession(args);
          case 'browserbase_navigate':
            return await this.handleNavigate(args);
          case 'browserbase_extract_content':
            return await this.handleExtractContent(args);
          case 'browserbase_interact':
            return await this.handleInteract(args);
          case 'browserbase_screenshot':
            return await this.handleScreenshot(args);
          case 'browserbase_close_session':
            return await this.handleCloseSession(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async makeRequest(endpoint, method = 'GET', data = null) {
    if (!this.apiKey) {
      throw new Error('BROWSERBASE_API_KEY not configured');
    }

    const config = {
      method,
      url: `${this.baseUrl}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    };

    if (data && method !== 'GET') {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  }

  async handleCreateSession(args) {
    const { projectId = this.projectId, browserSettings = {} } = args;

    try {
      const sessionData = {
        projectId,
        browserSettings: {
          viewport: { width: 1280, height: 720 },
          ...browserSettings,
        },
      };

      const response = await this.makeRequest('/sessions', 'POST', sessionData);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              sessionId: response.id,
              status: response.status,
              projectId: response.projectId,
              browserSettings: sessionData.browserSettings,
              createdAt: response.createdAt,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to create session: ${error.message}`);
    }
  }

  async handleNavigate(args) {
    const { sessionId, url, waitForLoad = true } = args;

    try {
      const navigationData = {
        url,
        waitForLoad,
      };

      const response = await this.makeRequest(
        `/sessions/${sessionId}/navigate`, 
        'POST', 
        navigationData
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              sessionId,
              url,
              status: response.status,
              title: response.title,
              finalUrl: response.finalUrl,
              loadTime: response.loadTime,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to navigate: ${error.message}`);
    }
  }

  async handleExtractContent(args) {
    const { 
      sessionId, 
      selector, 
      extract_type = 'text', 
      multiple = false 
    } = args;

    try {
      const extractData = {
        selector,
        extractType: extract_type,
        multiple,
      };

      const response = await this.makeRequest(
        `/sessions/${sessionId}/extract`, 
        'POST', 
        extractData
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              sessionId,
              selector,
              extractType: extract_type,
              multiple,
              content: response.content,
              elementCount: multiple ? response.content?.length || 0 : 1,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to extract content: ${error.message}`);
    }
  }

  async handleInteract(args) {
    const { sessionId, action, selector, value, options = {} } = args;

    try {
      const interactionData = {
        action,
        selector,
        value,
        options,
      };

      const response = await this.makeRequest(
        `/sessions/${sessionId}/interact`, 
        'POST', 
        interactionData
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              sessionId,
              action,
              selector,
              value,
              status: response.status,
              result: response.result,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to interact: ${error.message}`);
    }
  }

  async handleScreenshot(args) {
    const { sessionId, selector, fullPage = false } = args;

    try {
      const screenshotData = {
        selector,
        fullPage,
      };

      const response = await this.makeRequest(
        `/sessions/${sessionId}/screenshot`, 
        'POST', 
        screenshotData
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              sessionId,
              selector,
              fullPage,
              screenshotUrl: response.screenshotUrl,
              format: response.format,
              dimensions: response.dimensions,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to take screenshot: ${error.message}`);
    }
  }

  async handleCloseSession(args) {
    const { sessionId } = args;

    try {
      const response = await this.makeRequest(
        `/sessions/${sessionId}`, 
        'DELETE'
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              sessionId,
              status: response.status,
              message: 'Session closed successfully',
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to close session: ${error.message}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Browserbase MCP Server running on stdio');
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const server = new BrowserbaseMCPServer();
  server.run().catch(console.error);
}

module.exports = BrowserbaseMCPServer;