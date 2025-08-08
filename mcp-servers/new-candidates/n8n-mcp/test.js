/**
 * Test suite for n8n-mcp MCP integration
 */

const n8nMcpIntegration = require('./integration.js');

describe('n8n-mcp MCP Integration', () => {
    let integration;
    
    beforeEach(() => {
        integration = new n8nMcpIntegration();
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
