/**
 * Production Integration Tests for Perplexity API + Browser Research
 * Tests the complete integration between Perplexity API and browser research automation
 */

const { PerplexityTestClient, Grok4Integration } = require('../../src/api/testing/perplexity-test-framework');
const { BrowserResearchClient } = require('../../src/api/testing/browser-research-automation');
const { AutomatedConfigDetector } = require('../../src/api/testing/automated-config-detection');

// Test configuration
const TEST_CONFIG = {
  timeout: 30000,
  apiKey: process.env.PERPLEXITY_API_KEY,
  skipLiveTests: !process.env.PERPLEXITY_API_KEY,
  outputDir: './test-artifacts/integration'
};

describe('Perplexity + Browser Research Integration', () => {
  let perplexityClient;
  let grok4Client;
  let browserClient;
  let configDetector;

  beforeAll(async () => {
    if (!TEST_CONFIG.skipLiveTests) {
      perplexityClient = new PerplexityTestClient({
        apiKey: TEST_CONFIG.apiKey,
        timeout: TEST_CONFIG.timeout
      });

      grok4Client = new Grok4Integration({
        apiKey: TEST_CONFIG.apiKey,
        timeout: TEST_CONFIG.timeout
      });

      browserClient = new BrowserResearchClient({
        apiKey: TEST_CONFIG.apiKey
      }, {
        timeout: TEST_CONFIG.timeout,
        evidencePath: `${TEST_CONFIG.outputDir}/evidence`
      });
    }

    configDetector = new AutomatedConfigDetector();
  });

  describe('Perplexity API Core Functionality', () => {
    test('should establish API connection and perform health check', async () => {
      if (TEST_CONFIG.skipLiveTests) {
        console.log('Skipping live API test - no API key provided');
        return;
      }

      const isHealthy = await perplexityClient.healthCheck();
      expect(isHealthy).toBe(true);
    }, TEST_CONFIG.timeout);

    test('should perform real-time web search with citations', async () => {
      if (TEST_CONFIG.skipLiveTests) {
        console.log('Skipping live API test - no API key provided');
        return;
      }

      const result = await perplexityClient.chat({
        model: 'llama-3.1-sonar-huge-128k-online',
        messages: [{
          role: 'user',
          content: 'Latest developments in TypeScript 5.7 for enterprise applications'
        }],
        return_citations: true,
        search_domain_filter: ['typescript.org', 'github.com'],
        max_tokens: 500
      });

      expect(result.success).toBe(true);
      expect(result.response).toBeDefined();
      expect(result.citations).toBeDefined();
      expect(Array.isArray(result.citations)).toBe(true);
      expect(result.duration).toBeGreaterThan(0);
    }, TEST_CONFIG.timeout);

    test('should handle rate limiting gracefully', async () => {
      if (TEST_CONFIG.skipLiveTests) {
        console.log('Skipping live API test - no API key provided');
        return;
      }

      // Make multiple concurrent requests to test rate limiting
      const requests = Array.from({ length: 5 }, () =>
        perplexityClient.chat({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [{ role: 'user', content: 'Test message' }],
          max_tokens: 10
        })
      );

      const results = await Promise.allSettled(requests);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
      
      // Should have at least some successful requests
      expect(successful.length).toBeGreaterThan(0);
    }, TEST_CONFIG.timeout * 2);

    test('should cache responses effectively', async () => {
      if (TEST_CONFIG.skipLiveTests) {
        console.log('Skipping live API test - no API key provided');
        return;
      }

      const query = {
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [{ role: 'user', content: 'What is Node.js?' }],
        max_tokens: 50
      };

      // Clear cache first
      perplexityClient.clearCache();

      // First request (cache miss)
      const result1 = await perplexityClient.chat(query);
      expect(result1.performance.cacheHit).toBe(false);

      // Second request (cache hit)
      const result2 = await perplexityClient.chat(query);
      expect(result2.performance.cacheHit).toBe(true);
      expect(result2.duration).toBeLessThan(result1.duration);
    }, TEST_CONFIG.timeout);
  });

  describe('Grok-4 Style Integration', () => {
    test('should perform enhanced reasoning with web search', async () => {
      if (TEST_CONFIG.skipLiveTests) {
        console.log('Skipping live API test - no API key provided');
        return;
      }

      const result = await grok4Client.reasonWithGrok4(
        'Compare the performance characteristics of React vs Vue.js in 2025',
        'You are evaluating frontend frameworks for a high-performance web application',
        {
          searchDomains: ['react.dev', 'vuejs.org', 'github.com'],
          temperature: 0.7
        }
      );

      expect(result.success).toBe(true);
      expect(result.response.choices[0].message.content).toBeDefined();
      expect(result.response.choices[0].message.content.length).toBeGreaterThan(200);
      expect(result.citations).toBeDefined();
      expect(result.citations.length).toBeGreaterThan(0);
    }, TEST_CONFIG.timeout);

    test('should analyze code with citations and recommendations', async () => {
      if (TEST_CONFIG.skipLiveTests) {
        console.log('Skipping live API test - no API key provided');
        return;
      }

      const testCode = `
        async function fetchUserData(userId) {
          const response = await fetch('/api/users/' + userId);
          const data = await response.json();
          return data;
        }
      `;

      const result = await grok4Client.analyzeCode(testCode, 'javascript', 'security');

      expect(result.success).toBe(true);
      expect(result.response.choices[0].message.content).toBeDefined();
      expect(result.response.choices[0].message.content).toContain('security');
    }, TEST_CONFIG.timeout);

    test('should perform multi-source research validation', async () => {
      if (TEST_CONFIG.skipLiveTests) {
        console.log('Skipping live API test - no API key provided');
        return;
      }

      const researchResult = await grok4Client.researchWithValidation(
        'Best practices for API security in Node.js applications',
        ['nodejs.org', 'owasp.org', 'github.com']
      );

      expect(researchResult.primary.success).toBe(true);
      expect(researchResult.validation).toHaveLength(3);
      expect(researchResult.consensus).toBeDefined();
      expect(researchResult.consensus.confidence).toBeGreaterThan(0);
      expect(researchResult.consensus.confidence).toBeLessThanOrEqual(1);
    }, TEST_CONFIG.timeout * 2);
  });

  describe('Browser Research Automation', () => {
    test('should execute research session with evidence collection', async () => {
      if (TEST_CONFIG.skipLiveTests) {
        console.log('Skipping live API test - no API key provided');
        return;
      }

      const queries = [
        {
          id: 'security-best-practices',
          query: 'Node.js security best practices for production applications',
          sources: [],
          priority: 'high',
          searchFilters: {
            domains: ['nodejs.org', 'snyk.io', 'owasp.org'],
            recency: 'month'
          }
        }
      ];

      const sessionId = await browserClient.startResearchSession(queries);
      expect(sessionId).toBeDefined();
      expect(sessionId).toMatch(/^session_/);

      const performance = browserClient.getSessionPerformance();
      expect(performance).toBeDefined();
      expect(performance.totalQueries).toBe(1);
    }, TEST_CONFIG.timeout * 2);

    test('should generate comprehensive research report', async () => {
      if (TEST_CONFIG.skipLiveTests) {
        console.log('Skipping live API test - no API key provided');
        return;
      }

      const queries = [
        {
          id: 'performance-optimization',
          query: 'TypeScript performance optimization techniques',
          sources: [],
          priority: 'medium',
          searchFilters: {
            domains: ['typescript.org', 'github.com'],
            recency: 'week'
          }
        }
      ];

      await browserClient.startResearchSession(queries);
      const reportPath = await browserClient.generateResearchReport();
      
      expect(reportPath).toBeDefined();
      expect(reportPath).toContain('report_');
      
      // Verify report file exists
      const fs = require('fs').promises;
      const reportExists = await fs.access(reportPath).then(() => true).catch(() => false);
      expect(reportExists).toBe(true);
    }, TEST_CONFIG.timeout * 2);

    test('should perform cross-validation of research evidence', async () => {
      if (TEST_CONFIG.skipLiveTests) {
        console.log('Skipping live API test - no API key provided');
        return;
      }

      const queries = [
        {
          id: 'framework-comparison-1',
          query: 'React performance vs Vue.js performance 2025',
          sources: [],
          priority: 'high',
          searchFilters: {
            domains: ['react.dev', 'vuejs.org'],
            recency: 'month'
          }
        },
        {
          id: 'framework-comparison-2',
          query: 'React vs Vue.js developer experience comparison',
          sources: [],
          priority: 'high',
          searchFilters: {
            domains: ['stackoverflow.com', 'reddit.com'],
            recency: 'month'
          }
        }
      ];

      await browserClient.startResearchSession(queries);
      const performance = browserClient.getSessionPerformance();
      
      expect(performance.consensusScore).toBeGreaterThanOrEqual(0);
      expect(performance.consensusScore).toBeLessThanOrEqual(1);
    }, TEST_CONFIG.timeout * 3);
  });

  describe('Automated Configuration Detection', () => {
    test('should analyze repository structure correctly', async () => {
      const structure = await configDetector.analyzeRepository();
      
      expect(structure).toBeDefined();
      expect(structure.rootPath).toBeDefined();
      expect(structure.projectType).toBeDefined();
      expect(structure.languages).toBeDefined();
      expect(Array.isArray(structure.languages)).toBe(true);
      expect(structure.frameworks).toBeDefined();
      expect(Array.isArray(structure.frameworks)).toBe(true);
    });

    test('should generate appropriate configuration', async () => {
      const config = await configDetector.generateConfiguration();
      
      expect(config).toBeDefined();
      expect(config.rules).toBeDefined();
      expect(config.rules.general).toBeDefined();
      expect(Array.isArray(config.rules.general)).toBe(true);
      expect(config.mcpServers).toBeDefined();
      expect(Array.isArray(config.mcpServers)).toBe(true);
      expect(config.environmentVariables).toBeDefined();
      expect(Array.isArray(config.environmentVariables)).toBe(true);
    });

    test('should apply configuration in dry-run mode', async () => {
      const config = await configDetector.generateConfiguration();
      
      // Should not throw in dry-run mode
      await expect(configDetector.applyConfiguration(config, {
        createBackups: true,
        overwriteExisting: false,
        dryRun: true
      })).resolves.not.toThrow();
    });

    test('should detect MCP server requirements', async () => {
      const config = await configDetector.generateConfiguration();
      
      // Should recommend core MCP servers
      const serverNames = config.mcpServers.map(s => s.name);
      expect(serverNames).toContain('filesystem');
      expect(serverNames).toContain('perplexity');
    });
  });

  describe('Performance and Quality Metrics', () => {
    test('should track performance metrics accurately', async () => {
      if (TEST_CONFIG.skipLiveTests) {
        console.log('Skipping live API test - no API key provided');
        return;
      }

      // Make a few requests to generate metrics
      await perplexityClient.chat({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [{ role: 'user', content: 'Test for metrics' }],
        max_tokens: 10
      });

      const metrics = perplexityClient.getMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.totalRequests).toBeGreaterThan(0);
      expect(metrics.averageLatency).toBeGreaterThan(0);
      expect(metrics.cacheHitRate).toBeGreaterThanOrEqual(0);
      expect(metrics.cacheHitRate).toBeLessThanOrEqual(1);
      expect(metrics.errorRate).toBeGreaterThanOrEqual(0);
      expect(metrics.errorRate).toBeLessThanOrEqual(1);
    }, TEST_CONFIG.timeout);

    test('should maintain cache statistics', async () => {
      if (TEST_CONFIG.skipLiveTests) {
        console.log('Skipping live API test - no API key provided');
        return;
      }

      const cacheStats = perplexityClient.getCacheStats();
      
      expect(cacheStats).toBeDefined();
      expect(typeof cacheStats.hits).toBe('number');
      expect(typeof cacheStats.misses).toBe('number');
      expect(typeof cacheStats.hitRate).toBe('number');
      expect(typeof cacheStats.keys).toBe('number');
    });

    test('should handle errors gracefully', async () => {
      if (TEST_CONFIG.skipLiveTests) {
        console.log('Skipping live API test - no API key provided');
        return;
      }

      // Test with invalid model
      const result = await perplexityClient.chat({
        model: 'invalid-model-name',
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 10
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Integration Security and Validation', () => {
    test('should validate API key format', () => {
      if (TEST_CONFIG.skipLiveTests) {
        console.log('Skipping live API test - no API key provided');
        return;
      }

      expect(TEST_CONFIG.apiKey).toBeDefined();
      expect(typeof TEST_CONFIG.apiKey).toBe('string');
      expect(TEST_CONFIG.apiKey.length).toBeGreaterThan(10);
    });

    test('should handle rate limiting appropriately', async () => {
      if (TEST_CONFIG.skipLiveTests) {
        console.log('Skipping live API test - no API key provided');
        return;
      }

      const metrics = perplexityClient.getMetrics();
      const initialRateLimitHits = metrics.rateLimitHits;

      // Make rapid requests to potentially trigger rate limiting
      const rapidRequests = Array.from({ length: 3 }, () =>
        perplexityClient.chat({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [{ role: 'user', content: 'Quick test' }],
          max_tokens: 5
        })
      );

      await Promise.allSettled(rapidRequests);
      
      const finalMetrics = perplexityClient.getMetrics();
      // Rate limiting should be handled without throwing errors
      expect(finalMetrics.rateLimitHits).toBeGreaterThanOrEqual(initialRateLimitHits);
    }, TEST_CONFIG.timeout);

    test('should sanitize and validate input data', async () => {
      if (TEST_CONFIG.skipLiveTests) {
        console.log('Skipping live API test - no API key provided');
        return;
      }

      // Test with potentially problematic input
      const result = await perplexityClient.chat({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [{ 
          role: 'user', 
          content: 'Test with special characters: <script>alert("test")</script>' 
        }],
        max_tokens: 10
      });

      // Should handle gracefully without security issues
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  afterAll(async () => {
    // Cleanup test artifacts if needed
    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      if (await fs.access(TEST_CONFIG.outputDir).then(() => true).catch(() => false)) {
        // Optional: Clean up test artifacts
        console.log(`Test artifacts saved in: ${TEST_CONFIG.outputDir}`);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });
});

module.exports = {
  TEST_CONFIG
};