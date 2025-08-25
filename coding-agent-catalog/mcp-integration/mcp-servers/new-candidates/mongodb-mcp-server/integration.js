#!/usr/bin/env node

/**
 * mongodb-mcp-server Integration Script
 * Integrates mongodb-mcp-server with EchoTune AI ecosystem
 */

const path = require('path');
const fs = require('fs').promises;

class mongodbMcpServerIntegration {
    constructor() {
        this.name = 'mongodb-mcp-server';
        this.configured = false;
    }
    
    async initialize() {
        console.log(`🚀 Initializing ${this.name} integration...`);
        
        try {
            await this.checkDependencies();
            await this.setupConfiguration();
            await this.validateIntegration();
            
            this.configured = true;
            console.log(`✅ ${this.name} integration ready`);
            
        } catch (error) {
            console.error(`❌ ${this.name} integration failed:`, error.message);
            throw error;
        }
    }
    
    async checkDependencies() {
        // Check if required dependencies are available
        console.log(`   📦 Checking dependencies for ${this.name}...`);
        
        
        // Check MongoDB connection
        const { MongoClient } = require('mongodb');
        if (process.env.MONGODB_URI) {
            console.log('   ✅ MongoDB URI configured');
        } else {
            console.log('   ⚠️ MongoDB URI not configured');
        }
    }
    
    async setupConfiguration() {
        console.log(`   ⚙️ Setting up configuration for ${this.name}...`);
        
        
        // Load configuration
        const configPath = path.join(__dirname, 'config.json');
        const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
        console.log(`   ✅ Configuration loaded for ${config.name}`);
    }
    
    async validateIntegration() {
        console.log(`   ✅ Validating ${this.name} integration...`);
        
        
        // Validate integration setup
        const requiredFiles = ['config.json', 'integration.js'];
        for (const file of requiredFiles) {
            await fs.access(path.join(__dirname, file));
        }
        console.log('   ✅ All required files present');
    }
    
    async start() {
        if (!this.configured) {
            await this.initialize();
        }
        
        console.log(`🎯 Starting ${this.name} MCP server...`);
        
        
        // Start MCP server
        const ServerClass = require('./mongodb-mcp-server-server.js');
        const server = new ServerClass();
        await server.start();
    }
}

// Auto-start if run directly
if (require.main === module) {
    const integration = new mongodbMcpServerIntegration();
    integration.start().catch(console.error);
}

module.exports = mongodbMcpServerIntegration;
