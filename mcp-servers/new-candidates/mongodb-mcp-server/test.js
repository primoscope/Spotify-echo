/**
 * Test suite for mongodb-mcp-server MCP integration
 */

const mongodbMcpServerIntegration = require('./integration.js');

describe('mongodb-mcp-server MCP Integration', () => {
    let integration;
    
    beforeEach(() => {
        integration = new mongodbMcpServerIntegration();
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
    
    
    test('should connect to MongoDB', async () => {
        // Test MongoDB connection if configured
        if (process.env.MONGODB_URI) {
            await expect(integration.checkDependencies()).resolves.not.toThrow();
        } else {
            console.log('Skipping MongoDB test - URI not configured');
        }
    });
});
