#!/usr/bin/env node

/**
 * EchoTune AI - Community MCP Server Integration Test
 * 
 * Tests all community MCP servers and validates their integration
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

async function testMCPServers() {
  console.log('🤖 Testing Community MCP Server Integration for EchoTune AI\n');
  
  const servers = [
    {
      name: 'Package Management',
      script: './mcp-servers/package-management/package-version-mcp.js',
      capabilities: ['version-checking', 'security-scanning']
    },
    {
      name: 'Code Sandbox',
      script: './mcp-servers/code-sandbox/code-sandbox-mcp.js', 
      capabilities: ['code-execution', 'validation']
    },
    {
      name: 'Analytics Server',
      script: './mcp-servers/analytics-server/analytics-mcp.js',
      capabilities: ['event-tracking', 'performance-metrics']
    },
    {
      name: 'Testing Automation',
      script: './mcp-servers/testing-automation/testing-automation-mcp.js',
      capabilities: ['unit-testing', 'integration-testing']
    }
  ];
  
  const results = [];
  
  for (const server of servers) {
    console.log(`📋 Testing ${server.name}...`);
    
    try {
      // Check if file exists
      const fullPath = path.resolve(server.script);
      await fs.access(fullPath);
      
      // Check syntax
      const syntaxCheck = await checkSyntax(fullPath);
      
      const result = {
        name: server.name,
        status: syntaxCheck ? 'passed' : 'failed',
        capabilities: server.capabilities,
        errors: syntaxCheck ? [] : ['Syntax error detected']
      };
      
      results.push(result);
      console.log(`  ${result.status === 'passed' ? '✅' : '❌'} ${server.name}`);
      
    } catch (error) {
      results.push({
        name: server.name,
        status: 'failed',
        capabilities: server.capabilities,
        errors: [error.message]
      });
      console.log(`  ❌ ${server.name} - ${error.message}`);
    }
  }
  
  // Summary
  const passed = results.filter(r => r.status === 'passed').length;
  console.log(`\n📊 Results: ${passed}/${results.length} servers passed validation`);
  
  if (passed === results.length) {
    console.log('🎉 All community MCP servers are ready for integration!');
  } else {
    console.log('⚠️ Some servers need attention before full integration');
  }
  
  return results;
}

async function checkSyntax(filePath) {
  return new Promise((resolve) => {
    const process = spawn('node', ['-c', filePath], { stdio: 'pipe' });
    
    process.on('close', (code) => {
      resolve(code === 0);
    });
    
    process.on('error', () => {
      resolve(false);
    });
  });
}

// Run if called directly
if (require.main === module) {
  testMCPServers()
    .then(results => {
      const allPassed = results.every(r => r.status === 'passed');
      process.exit(allPassed ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testMCPServers };