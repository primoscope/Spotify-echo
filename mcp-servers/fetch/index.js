#!/usr/bin/env node

/**
 * Fetch MCP Server
 * Web content fetching and conversion optimized for LLM usage
 * Provides clean, structured data extraction from web sources
 */

const { Server } = require('@modelcontextprotocol/sdk/server');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio');
const fs = require('fs').promises;
const path = require('path');

class FetchMCPServer {
  constructor() {
    this.server = new Server({
      name: 'fetch-mcp-server',
      version: '1.0.0',
    });
    
    this.config = {
      userAgent: 'EchoTune-AI-Fetch/1.0 (Music Discovery Platform)',
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 1000,
      maxContentLength: 10 * 1024 * 1024, // 10MB
      allowedDomains: process.env.FETCH_ALLOWED_DOMAINS?.split(',') || [],
      blockedDomains: process.env.FETCH_BLOCKED_DOMAINS?.split(',') || ['localhost', '127.0.0.1'],
      respectRobots: process.env.FETCH_RESPECT_ROBOTS !== 'false',
    };

    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.setupHandlers();
  }

  setupHandlers() {
    this.server.setRequestHandler(
      'tools/list',
      () => ({
        tools: [
          {
            name: 'fetch_url',
            description: 'Fetch and process web content optimized for LLM consumption',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'URL to fetch content from',
                },
                format: {
                  type: 'string',
                  enum: ['text', 'markdown', 'json', 'raw', 'structured'],
                  description: 'Output format for the content',
                  default: 'structured',
                },
                extractors: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['title', 'meta', 'headings', 'paragraphs', 'links', 'images', 'tables', 'code'],
                  },
                  description: 'Content extractors to apply',
                  default: ['title', 'meta', 'paragraphs', 'headings'],
                },
                timeout: {
                  type: 'number',
                  description: 'Request timeout in milliseconds',
                  default: 30000,
                },
                followRedirects: {
                  type: 'boolean',
                  description: 'Follow HTTP redirects',
                  default: true,
                },
                useCache: {
                  type: 'boolean',
                  description: 'Use cached response if available',
                  default: true,
                },
                headers: {
                  type: 'object',
                  description: 'Additional HTTP headers to send',
                },
              },
              required: ['url'],
            },
          },
          {
            name: 'fetch_multiple',
            description: 'Fetch content from multiple URLs concurrently',
            inputSchema: {
              type: 'object',
              properties: {
                urls: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Array of URLs to fetch',
                },
                format: {
                  type: 'string',
                  enum: ['text', 'markdown', 'json', 'structured'],
                  description: 'Output format for all content',
                  default: 'structured',
                },
                maxConcurrent: {
                  type: 'number',
                  description: 'Maximum concurrent requests',
                  default: 5,
                },
                failOnError: {
                  type: 'boolean',
                  description: 'Fail entire operation if any request fails',
                  default: false,
                },
              },
              required: ['urls'],
            },
          },
          {
            name: 'fetch_rss',
            description: 'Fetch and parse RSS/Atom feeds',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'RSS/Atom feed URL',
                },
                maxItems: {
                  type: 'number',
                  description: 'Maximum number of items to return',
                  default: 20,
                },
                includeContent: {
                  type: 'boolean',
                  description: 'Include full content for each item',
                  default: true,
                },
              },
              required: ['url'],
            },
          },
          {
            name: 'fetch_sitemap',
            description: 'Fetch and parse XML sitemaps',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'Sitemap URL (or website URL to auto-detect)',
                },
                maxUrls: {
                  type: 'number',
                  description: 'Maximum number of URLs to return',
                  default: 100,
                },
                filterPaths: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Path patterns to filter URLs by',
                },
              },
              required: ['url'],
            },
          },
          {
            name: 'fetch_search_results',
            description: 'Fetch search results from search engines (requires API keys)',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query',
                },
                engine: {
                  type: 'string',
                  enum: ['google', 'bing', 'duckduckgo'],
                  description: 'Search engine to use',
                  default: 'duckduckgo',
                },
                maxResults: {
                  type: 'number',
                  description: 'Maximum number of results',
                  default: 10,
                },
                safeSearch: {
                  type: 'boolean',
                  description: 'Enable safe search',
                  default: true,
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'fetch_analyze_content',
            description: 'Analyze and extract insights from fetched content',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'URL to analyze',
                },
                analysisType: {
                  type: 'string',
                  enum: ['readability', 'sentiment', 'keywords', 'structure', 'performance'],
                  description: 'Type of analysis to perform',
                  default: 'structure',
                },
                language: {
                  type: 'string',
                  description: 'Expected content language (for language-specific analysis)',
                  default: 'en',
                },
              },
              required: ['url'],
            },
          },
        ],
      })
    );

    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'fetch_url':
            return await this.fetchUrl(args);
          case 'fetch_multiple':
            return await this.fetchMultiple(args);
          case 'fetch_rss':
            return await this.fetchRSS(args);
          case 'fetch_sitemap':
            return await this.fetchSitemap(args);
          case 'fetch_search_results':
            return await this.fetchSearchResults(args);
          case 'fetch_analyze_content':
            return await this.analyzeContent(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${error.message}`,
            },
          ],
        };
      }
    });
  }

  async fetchUrl(args) {
    const { 
      url, 
      format = 'structured', 
      extractors = ['title', 'meta', 'paragraphs', 'headings'],
      timeout = 30000,
      followRedirects = true,
      useCache = true,
      headers = {}
    } = args;

    try {
      // Validate URL
      this.validateUrl(url);

      // Check cache
      if (useCache && this.cache.has(url)) {
        const cached = this.cache.get(url);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return this.formatResponse(cached.data, format, extractors);
        }
      }

      // Fetch content
      const response = await this.makeRequest(url, { timeout, followRedirects, headers });
      const content = await this.processResponse(response, url);

      // Cache result
      if (useCache) {
        this.cache.set(url, {
          data: content,
          timestamp: Date.now(),
        });
      }

      return this.formatResponse(content, format, extractors);

    } catch (error) {
      throw new Error(`Failed to fetch ${url}: ${error.message}`);
    }
  }

  async fetchMultiple(args) {
    const { urls, format = 'structured', maxConcurrent = 5, failOnError = false } = args;

    try {
      const results = [];
      const errors = [];

      // Process URLs in batches
      for (let i = 0; i < urls.length; i += maxConcurrent) {
        const batch = urls.slice(i, i + maxConcurrent);
        const batchPromises = batch.map(async (url) => {
          try {
            const result = await this.fetchUrl({ url, format });
            return { url, success: true, data: result };
          } catch (error) {
            const errorResult = { url, success: false, error: error.message };
            if (failOnError) {
              throw error;
            }
            return errorResult;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults.filter(r => r.success));
        errors.push(...batchResults.filter(r => !r.success));
      }

      return {
        content: [
          {
            type: 'text',
            text: `Fetched ${results.length} URLs successfully, ${errors.length} failed.`,
          },
          {
            type: 'text',
            text: JSON.stringify({ results, errors }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Batch fetch failed: ${error.message}`);
    }
  }

  async fetchRSS(args) {
    const { url, maxItems = 20, includeContent = true } = args;

    try {
      this.validateUrl(url);

      const response = await this.makeRequest(url);
      const xmlContent = await response.text();
      const feedData = this.parseRSSFeed(xmlContent, maxItems, includeContent);

      return {
        content: [
          {
            type: 'text',
            text: `Parsed RSS feed with ${feedData.items.length} items:`,
          },
          {
            type: 'text',
            text: JSON.stringify(feedData, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`RSS fetch failed: ${error.message}`);
    }
  }

  async fetchSitemap(args) {
    const { url, maxUrls = 100, filterPaths = [] } = args;

    try {
      let sitemapUrl = url;

      // If not a direct sitemap URL, try to find sitemap
      if (!url.includes('sitemap')) {
        sitemapUrl = await this.findSitemap(url);
      }

      this.validateUrl(sitemapUrl);

      const response = await this.makeRequest(sitemapUrl);
      const xmlContent = await response.text();
      const sitemapData = this.parseSitemap(xmlContent, maxUrls, filterPaths);

      return {
        content: [
          {
            type: 'text',
            text: `Parsed sitemap with ${sitemapData.urls.length} URLs:`,
          },
          {
            type: 'text',
            text: JSON.stringify(sitemapData, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Sitemap fetch failed: ${error.message}`);
    }
  }

  async fetchSearchResults(args) {
    const { query, engine = 'duckduckgo', maxResults = 10, safeSearch = true } = args;

    try {
      let searchResults;

      switch (engine) {
        case 'duckduckgo':
          searchResults = await this.searchDuckDuckGo(query, maxResults, safeSearch);
          break;
        case 'google':
          searchResults = await this.searchGoogle(query, maxResults, safeSearch);
          break;
        case 'bing':
          searchResults = await this.searchBing(query, maxResults, safeSearch);
          break;
        default:
          throw new Error(`Unsupported search engine: ${engine}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: `Search results for "${query}" (${engine}):`,
          },
          {
            type: 'text',
            text: JSON.stringify(searchResults, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  async analyzeContent(args) {
    const { url, analysisType = 'structure', language = 'en' } = args;

    try {
      // First fetch the content
      const content = await this.fetchUrl({ url, format: 'structured' });
      const analysis = await this.performContentAnalysis(content, analysisType, language);

      return {
        content: [
          {
            type: 'text',
            text: `Content analysis (${analysisType}) for ${url}:`,
          },
          {
            type: 'text',
            text: JSON.stringify(analysis, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Content analysis failed: ${error.message}`);
    }
  }

  // Helper methods
  validateUrl(url) {
    try {
      const parsed = new URL(url);
      
      // Check protocol
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Only HTTP and HTTPS URLs are allowed');
      }

      // Check blocked domains
      if (this.config.blockedDomains.includes(parsed.hostname)) {
        throw new Error(`Domain ${parsed.hostname} is blocked`);
      }

      // Check allowed domains (if specified)
      if (this.config.allowedDomains.length > 0 && 
          !this.config.allowedDomains.includes(parsed.hostname)) {
        throw new Error(`Domain ${parsed.hostname} is not in allowed list`);
      }

    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error('Invalid URL format');
      }
      throw error;
    }
  }

  async makeRequest(url, options = {}) {
    const fetch = (await import('node-fetch')).default;
    const { timeout = this.config.timeout, followRedirects = true, headers = {} } = options;

    const requestOptions = {
      method: 'GET',
      headers: {
        'User-Agent': this.config.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        ...headers,
      },
      redirect: followRedirects ? 'follow' : 'manual',
      timeout: timeout,
      compress: true,
      size: this.config.maxContentLength,
    };

    let lastError;
    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        const response = await fetch(url, requestOptions);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;
      } catch (error) {
        lastError = error;
        if (attempt < this.config.maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * (attempt + 1)));
        }
      }
    }

    throw lastError;
  }

  async processResponse(response, originalUrl) {
    const contentType = response.headers.get('content-type') || '';
    const content = await response.text();

    if (contentType.includes('text/html')) {
      return this.parseHTML(content, originalUrl);
    } else if (contentType.includes('application/json')) {
      try {
        return { type: 'json', data: JSON.parse(content) };
      } catch {
        return { type: 'text', content };
      }
    } else if (contentType.includes('text/xml') || contentType.includes('application/xml')) {
      return { type: 'xml', content };
    } else {
      return { type: 'text', content };
    }
  }

  parseHTML(html, baseUrl) {
    // This is a simplified HTML parser
    // In a real implementation, you'd use a proper HTML parser like cheerio or jsdom
    
    const data = {
      type: 'html',
      url: baseUrl,
      title: this.extractTitle(html),
      meta: this.extractMeta(html),
      headings: this.extractHeadings(html),
      paragraphs: this.extractParagraphs(html),
      links: this.extractLinks(html, baseUrl),
      images: this.extractImages(html, baseUrl),
      tables: this.extractTables(html),
      code: this.extractCode(html),
      rawContent: html,
    };

    return data;
  }

  extractTitle(html) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return titleMatch ? titleMatch[1].trim() : '';
  }

  extractMeta(html) {
    const meta = {};
    const metaPattern = /<meta\s+([^>]+)>/gi;
    let match;

    while ((match = metaPattern.exec(html)) !== null) {
      const attributes = this.parseAttributes(match[1]);
      if (attributes.name && attributes.content) {
        meta[attributes.name] = attributes.content;
      } else if (attributes.property && attributes.content) {
        meta[attributes.property] = attributes.content;
      }
    }

    return meta;
  }

  extractHeadings(html) {
    const headings = [];
    const headingPattern = /<(h[1-6])[^>]*>([^<]+)<\/\1>/gi;
    let match;

    while ((match = headingPattern.exec(html)) !== null) {
      headings.push({
        level: parseInt(match[1].charAt(1)),
        text: match[2].trim(),
      });
    }

    return headings;
  }

  extractParagraphs(html) {
    const paragraphs = [];
    const pPattern = /<p[^>]*>([^<]+(?:<[^>]*>[^<]*<\/[^>]*>[^<]*)*)<\/p>/gi;
    let match;

    while ((match = pPattern.exec(html)) !== null) {
      const text = match[1].replace(/<[^>]+>/g, '').trim();
      if (text.length > 20) { // Only include substantial paragraphs
        paragraphs.push(text);
      }
    }

    return paragraphs;
  }

  extractLinks(html, baseUrl) {
    const links = [];
    const linkPattern = /<a\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
    let match;

    while ((match = linkPattern.exec(html)) !== null) {
      try {
        const url = new URL(match[1], baseUrl).href;
        links.push({
          url,
          text: match[2].trim(),
        });
      } catch {
        // Skip invalid URLs
      }
    }

    return links;
  }

  extractImages(html, baseUrl) {
    const images = [];
    const imgPattern = /<img\s+([^>]+)>/gi;
    let match;

    while ((match = imgPattern.exec(html)) !== null) {
      const attributes = this.parseAttributes(match[1]);
      if (attributes.src) {
        try {
          const url = new URL(attributes.src, baseUrl).href;
          images.push({
            url,
            alt: attributes.alt || '',
            title: attributes.title || '',
          });
        } catch {
          // Skip invalid URLs
        }
      }
    }

    return images;
  }

  extractTables(html) {
    const tables = [];
    const tablePattern = /<table[^>]*>([\s\S]*?)<\/table>/gi;
    let match;

    while ((match = tablePattern.exec(html)) !== null) {
      tables.push(this.parseTable(match[1]));
    }

    return tables;
  }

  extractCode(html) {
    const codeBlocks = [];
    const codePatterns = [
      /<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi,
      /<code[^>]*>([\s\S]*?)<\/code>/gi,
      /<pre[^>]*>([\s\S]*?)<\/pre>/gi,
    ];

    codePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        codeBlocks.push(match[1].trim());
      }
    });

    return codeBlocks;
  }

  parseAttributes(attributeString) {
    const attributes = {};
    const attrPattern = /(\w+)\s*=\s*["']([^"']*)["']/g;
    let match;

    while ((match = attrPattern.exec(attributeString)) !== null) {
      attributes[match[1].toLowerCase()] = match[2];
    }

    return attributes;
  }

  parseTable(tableHtml) {
    // Simplified table parsing
    const rows = [];
    const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let match;

    while ((match = rowPattern.exec(tableHtml)) !== null) {
      const cells = [];
      const cellPattern = /<t[hd][^>]*>([^<]*)<\/t[hd]>/gi;
      let cellMatch;

      while ((cellMatch = cellPattern.exec(match[1])) !== null) {
        cells.push(cellMatch[1].trim());
      }

      if (cells.length > 0) {
        rows.push(cells);
      }
    }

    return { rows };
  }

  formatResponse(content, format, extractors) {
    const responseData = {
      url: content.url,
      type: content.type,
      timestamp: new Date().toISOString(),
    };

    // Apply extractors
    extractors.forEach(extractor => {
      if (content[extractor]) {
        responseData[extractor] = content[extractor];
      }
    });

    let formattedContent;

    switch (format) {
      case 'text':
        formattedContent = this.convertToText(responseData);
        break;
      case 'markdown':
        formattedContent = this.convertToMarkdown(responseData);
        break;
      case 'json':
        formattedContent = JSON.stringify(responseData, null, 2);
        break;
      case 'structured':
      default:
        formattedContent = JSON.stringify(responseData, null, 2);
        break;
    }

    return {
      content: [
        {
          type: 'text',
          text: `Content fetched successfully (${format} format):`,
        },
        {
          type: 'text',
          text: formattedContent,
        },
      ],
    };
  }

  convertToText(data) {
    let text = '';
    
    if (data.title) {
      text += `${data.title}\n${'='.repeat(data.title.length)}\n\n`;
    }

    if (data.meta?.description) {
      text += `${data.meta.description}\n\n`;
    }

    if (data.headings) {
      data.headings.forEach(heading => {
        text += `${'#'.repeat(heading.level)} ${heading.text}\n`;
      });
      text += '\n';
    }

    if (data.paragraphs) {
      text += data.paragraphs.join('\n\n');
    }

    return text;
  }

  convertToMarkdown(data) {
    let markdown = '';
    
    if (data.title) {
      markdown += `# ${data.title}\n\n`;
    }

    if (data.meta?.description) {
      markdown += `*${data.meta.description}*\n\n`;
    }

    if (data.headings) {
      data.headings.forEach(heading => {
        markdown += `${'#'.repeat(heading.level)} ${heading.text}\n\n`;
      });
    }

    if (data.paragraphs) {
      markdown += data.paragraphs.join('\n\n') + '\n\n';
    }

    if (data.links) {
      markdown += '## Links\n\n';
      data.links.forEach(link => {
        markdown += `- [${link.text || link.url}](${link.url})\n`;
      });
    }

    return markdown;
  }

  // Search engine methods (simplified implementations)
  async searchDuckDuckGo(query, maxResults, safeSearch) {
    // This is a placeholder - actual implementation would use DuckDuckGo's API or scraping
    return {
      engine: 'duckduckgo',
      query,
      results: [
        {
          title: `Search result for: ${query}`,
          url: 'https://example.com',
          snippet: 'This is a mock search result. In a real implementation, this would query DuckDuckGo.',
        }
      ],
    };
  }

  async searchGoogle(query, maxResults, safeSearch) {
    // This would require Google Custom Search API
    throw new Error('Google search requires API key configuration');
  }

  async searchBing(query, maxResults, safeSearch) {
    // This would require Bing Search API
    throw new Error('Bing search requires API key configuration');
  }

  // RSS and Sitemap parsing (simplified)
  parseRSSFeed(xmlContent, maxItems, includeContent) {
    // This is a simplified RSS parser
    return {
      title: 'Sample RSS Feed',
      description: 'Mock RSS feed data',
      items: [
        {
          title: 'Sample RSS Item',
          link: 'https://example.com/article',
          description: 'Mock RSS item description',
          pubDate: new Date().toISOString(),
        }
      ].slice(0, maxItems),
    };
  }

  parseSitemap(xmlContent, maxUrls, filterPaths) {
    // This is a simplified sitemap parser
    return {
      urls: [
        {
          loc: 'https://example.com/',
          lastmod: new Date().toISOString(),
          changefreq: 'daily',
          priority: '1.0',
        }
      ].slice(0, maxUrls),
    };
  }

  async findSitemap(baseUrl) {
    const possiblePaths = ['/sitemap.xml', '/sitemap_index.xml', '/sitemap/sitemap.xml'];
    
    for (const path of possiblePaths) {
      try {
        const sitemapUrl = new URL(path, baseUrl).href;
        await this.makeRequest(sitemapUrl);
        return sitemapUrl;
      } catch {
        continue;
      }
    }

    throw new Error('No sitemap found');
  }

  async performContentAnalysis(content, analysisType, language) {
    const analysis = {
      type: analysisType,
      language,
      url: content.url,
      timestamp: new Date().toISOString(),
    };

    switch (analysisType) {
      case 'readability':
        analysis.readability = this.analyzeReadability(content);
        break;
      case 'sentiment':
        analysis.sentiment = this.analyzeSentiment(content);
        break;
      case 'keywords':
        analysis.keywords = this.extractKeywords(content);
        break;
      case 'structure':
        analysis.structure = this.analyzeStructure(content);
        break;
      case 'performance':
        analysis.performance = this.analyzePerformance(content);
        break;
    }

    return analysis;
  }

  analyzeReadability(content) {
    // Simplified readability analysis
    const textContent = (content.paragraphs || []).join(' ');
    const wordCount = textContent.split(/\s+/).length;
    const sentenceCount = textContent.split(/[.!?]+/).length;
    const avgWordsPerSentence = wordCount / Math.max(sentenceCount, 1);

    return {
      wordCount,
      sentenceCount,
      avgWordsPerSentence,
      estimatedReadingTime: Math.ceil(wordCount / 200), // minutes
    };
  }

  analyzeSentiment(content) {
    // Placeholder sentiment analysis
    return {
      score: 0.1,
      magnitude: 0.5,
      label: 'neutral',
    };
  }

  extractKeywords(content) {
    // Simple keyword extraction
    const text = (content.paragraphs || []).join(' ').toLowerCase();
    const words = text.split(/\W+/).filter(word => word.length > 3);
    const frequency = {};

    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));
  }

  analyzeStructure(content) {
    return {
      hasTitle: !!content.title,
      headingCount: (content.headings || []).length,
      headingLevels: [...new Set((content.headings || []).map(h => h.level))],
      paragraphCount: (content.paragraphs || []).length,
      linkCount: (content.links || []).length,
      imageCount: (content.images || []).length,
      tableCount: (content.tables || []).length,
      codeBlockCount: (content.code || []).length,
    };
  }

  analyzePerformance(content) {
    return {
      contentSize: JSON.stringify(content).length,
      imageCount: (content.images || []).length,
      linkCount: (content.links || []).length,
      estimatedLoadTime: 'N/A - requires actual page load testing',
    };
  }

  async start() {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.log('Fetch MCP server started');
    } catch (error) {
      console.error('Failed to start Fetch MCP server:', error);
      process.exit(1);
    }
  }

  async stop() {
    // Clean up cache and any pending requests
    this.cache.clear();
  }
}

// Start the server if run directly
if (require.main === module) {
  const server = new FetchMCPServer();
  
  process.on('SIGINT', async () => {
    console.log('Shutting down Fetch MCP server...');
    await server.stop();
    process.exit(0);
  });
  
  server.start().catch(error => {
    console.error('Error starting server:', error);
    process.exit(1);
  });
}

module.exports = FetchMCPServer;