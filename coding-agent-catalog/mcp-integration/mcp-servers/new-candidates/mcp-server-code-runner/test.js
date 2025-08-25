/**
 * Test suite for mcp-server-code-runner MCP integration
 */

const mcpServerCodeRunnerIntegration = require('./integration.js');

describe('mcp-server-code-runner MCP Integration', () => {
    let integration;
    
    beforeEach(() => {
        integration = new mcpServerCodeRunnerIntegration();
    });
    
    afterEach(async () => {
        if (integration && integration.configured) {
            // Cleanup
        }
    });
    
    test('should initialize successfully', async () => {
        await expect(integration.initialize()).resolves.not.toThrow();
        expect(integration.configured).toBe(true);
    });
    
    test('should validate dependencies', async () => {
        await expect(integration.checkDependencies()).resolves.not.toThrow();
    });
    
    test('should setup configuration', async () => {
        await expect(integration.setupConfiguration()).resolves.not.toThrow();
    });
    
    
    test('should have expected capabilities', async () => {
        await integration.setupConfiguration();
        expect(integration.configured).toBe(false); // Will be true after full initialization
    });
});
