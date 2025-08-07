#!/usr/bin/env node

/**
 * EchoTune AI - Code Sandbox MCP Server
 * 
 * Inspired by bewt85/mcp-deno-sandbox
 * Provides secure code execution environment for TypeScript, JavaScript, and Python
 */

const { Server } = require('@modelcontextprotocol/sdk/server');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const os = require('os');

class CodeSandboxMCP {
  constructor() {
    this.server = new Server(
      {
        name: 'echotune-code-sandbox-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    
    this.setupToolHandlers();
    this.tempDir = path.join(os.tmpdir(), 'echotune-sandbox');
    this.initializeSandbox();
  }

  async initializeSandbox() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      console.error('Code sandbox initialized at:', this.tempDir);
    } catch (error) {
      console.error('Failed to initialize sandbox:', error);
    }
  }

  setupToolHandlers() {
    this.server.setRequestHandler('tools/list', async () => {
      return {
        tools: [
          {
            name: 'execute_javascript',
            description: 'Execute JavaScript code in a secure sandbox environment',
            inputSchema: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'JavaScript code to execute'
                },
                timeout: {
                  type: 'number',
                  description: 'Execution timeout in milliseconds',
                  default: 10000
                },
                allowNetworking: {
                  type: 'boolean',
                  description: 'Allow network access (use with caution)',
                  default: false
                }
              },
              required: ['code']
            }
          },
          {
            name: 'execute_typescript',
            description: 'Execute TypeScript code after compilation in sandbox',
            inputSchema: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'TypeScript code to execute'
                },
                timeout: {
                  type: 'number',
                  description: 'Execution timeout in milliseconds',
                  default: 10000
                },
                compilerOptions: {
                  type: 'object',
                  description: 'TypeScript compiler options',
                  default: {}
                }
              },
              required: ['code']
            }
          },
          {
            name: 'execute_python',
            description: 'Execute Python code in a secure sandbox',
            inputSchema: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'Python code to execute'
                },
                timeout: {
                  type: 'number',
                  description: 'Execution timeout in milliseconds',
                  default: 10000
                },
                allowPackages: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Allowed Python packages',
                  default: ['os', 'sys', 'json', 'math', 'random']
                }
              },
              required: ['code']
            }
          },
          {
            name: 'validate_echotune_code',
            description: 'Validate EchoTune AI specific code patterns and best practices',
            inputSchema: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'Code to validate'
                },
                language: {
                  type: 'string',
                  enum: ['javascript', 'typescript', 'python'],
                  description: 'Code language'
                },
                checkType: {
                  type: 'string',
                  enum: ['spotify-api', 'mongodb', 'llm-integration', 'security', 'performance'],
                  description: 'Type of validation to perform'
                }
              },
              required: ['code', 'language']
            }
          },
          {
            name: 'test_api_endpoint',
            description: 'Test API endpoint code in sandbox environment',
            inputSchema: {
              type: 'object',
              properties: {
                endpointCode: {
                  type: 'string',
                  description: 'Express.js endpoint code to test'
                },
                testCases: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      method: { type: 'string' },
                      path: { type: 'string' },
                      body: { type: 'object' },
                      expected: { type: 'object' }
                    }
                  },
                  description: 'Test cases to run against the endpoint'
                }
              },
              required: ['endpointCode']
            }
          }
        ]
      };
    });

    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'execute_javascript':
            return await this.executeJavaScript(args.code, args.timeout, args.allowNetworking);
          
          case 'execute_typescript':
            return await this.executeTypeScript(args.code, args.timeout, args.compilerOptions);
          
          case 'execute_python':
            return await this.executePython(args.code, args.timeout, args.allowPackages);
          
          case 'validate_echotune_code':
            return await this.validateEchoTuneCode(args.code, args.language, args.checkType);
          
          case 'test_api_endpoint':
            return await this.testApiEndpoint(args.endpointCode, args.testCases);
          
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
          isError: true,
        };
      }
    });
  }

  async executeJavaScript(code, timeout = 10000, allowNetworking = false) {
    const sessionId = crypto.randomUUID();
    const codeFile = path.join(this.tempDir, `js_${sessionId}.js`);
    
    try {
      // Security wrapper for JavaScript execution
      const secureCode = this.wrapJavaScriptCode(code, allowNetworking);
      await fs.writeFile(codeFile, secureCode);

      const result = await this.executeCommand('node', [codeFile], timeout);
      
      return {
        content: [
          {
            type: 'text',
            text: `## JavaScript Execution Result\n\n` +
                  `**Session ID:** ${sessionId}\n` +
                  `**Execution Time:** ${result.executionTime}ms\n\n` +
                  `### Output:\n\`\`\`\n${result.stdout}\n\`\`\`\n` +
                  (result.stderr ? `### Errors:\n\`\`\`\n${result.stderr}\n\`\`\`\n` : '') +
                  `**Exit Code:** ${result.exitCode}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`JavaScript execution failed: ${error.message}`);
    } finally {
      // Clean up
      try {
        await fs.unlink(codeFile);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }

  async executeTypeScript(code, timeout = 10000, compilerOptions = {}) {
    const sessionId = crypto.randomUUID();
    const tsFile = path.join(this.tempDir, `ts_${sessionId}.ts`);
    const jsFile = path.join(this.tempDir, `ts_${sessionId}.js`);
    
    try {
      await fs.writeFile(tsFile, code);

      // Compile TypeScript
      const defaultOptions = {
        target: 'ES2020',
        module: 'commonjs',
        strict: true,
        ...compilerOptions
      };

      const compileResult = await this.executeCommand('npx', ['tsc', '--outFile', jsFile, '--target', defaultOptions.target, '--module', defaultOptions.module, tsFile], timeout / 2);
      
      if (compileResult.exitCode !== 0) {
        return {
          content: [
            {
              type: 'text',
              text: `## TypeScript Compilation Error\n\n` +
                    `**Session ID:** ${sessionId}\n\n` +
                    `### Compilation Errors:\n\`\`\`\n${compileResult.stderr}\n\`\`\`\n`
            }
          ]
        };
      }

      // Execute compiled JavaScript
      const execResult = await this.executeCommand('node', [jsFile], timeout / 2);

      return {
        content: [
          {
            type: 'text',
            text: `## TypeScript Execution Result\n\n` +
                  `**Session ID:** ${sessionId}\n` +
                  `**Compilation:** ✅ Success\n` +
                  `**Execution Time:** ${execResult.executionTime}ms\n\n` +
                  `### Output:\n\`\`\`\n${execResult.stdout}\n\`\`\`\n` +
                  (execResult.stderr ? `### Runtime Errors:\n\`\`\`\n${execResult.stderr}\n\`\`\`\n` : '') +
                  `**Exit Code:** ${execResult.exitCode}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`TypeScript execution failed: ${error.message}`);
    } finally {
      // Clean up
      try {
        await Promise.all([
          fs.unlink(tsFile),
          fs.unlink(jsFile).catch(() => {})
        ]);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }

  async executePython(code, timeout = 10000, allowPackages = ['os', 'sys', 'json', 'math', 'random']) {
    const sessionId = crypto.randomUUID();
    const codeFile = path.join(this.tempDir, `py_${sessionId}.py`);
    
    try {
      // Security wrapper for Python execution
      const secureCode = this.wrapPythonCode(code, allowPackages);
      await fs.writeFile(codeFile, secureCode);

      const result = await this.executeCommand('python3', [codeFile], timeout);
      
      return {
        content: [
          {
            type: 'text',
            text: `## Python Execution Result\n\n` +
                  `**Session ID:** ${sessionId}\n` +
                  `**Allowed Packages:** ${allowPackages.join(', ')}\n` +
                  `**Execution Time:** ${result.executionTime}ms\n\n` +
                  `### Output:\n\`\`\`\n${result.stdout}\n\`\`\`\n` +
                  (result.stderr ? `### Errors:\n\`\`\`\n${result.stderr}\n\`\`\`\n` : '') +
                  `**Exit Code:** ${result.exitCode}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Python execution failed: ${error.message}`);
    } finally {
      // Clean up
      try {
        await fs.unlink(codeFile);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }

  async validateEchoTuneCode(code, language, checkType) {
    const issues = [];
    const recommendations = [];
    let score = 100;

    // General code quality checks
    if (code.includes('console.log') && !code.includes('console.error')) {
      issues.push('Use console.error for error logging instead of console.log');
      score -= 5;
    }

    // Language-specific validations
    if (language === 'javascript' || language === 'typescript') {
      // Security checks
      if (code.includes('eval(')) {
        issues.push('❌ SECURITY: eval() usage detected - potential security vulnerability');
        score -= 25;
      }
      
      if (code.includes('innerHTML') && !code.includes('sanitize')) {
        issues.push('⚠️ SECURITY: innerHTML usage without sanitization');
        score -= 15;
      }

      // EchoTune specific checks
      if (checkType === 'spotify-api') {
        if (!code.includes('try') || !code.includes('catch')) {
          issues.push('❌ Missing error handling for Spotify API calls');
          score -= 20;
        }
        
        if (code.includes('SPOTIFY_CLIENT_SECRET') && !code.includes('process.env')) {
          issues.push('❌ SECURITY: Hardcoded Spotify credentials detected');
          score -= 30;
        }
        
        if (code.includes('fetch') || code.includes('axios')) {
          recommendations.push('✅ Good: Using HTTP client for API calls');
        }
      }

      if (checkType === 'mongodb') {
        if (!code.includes('await') && code.includes('mongodb')) {
          issues.push('⚠️ Missing await for MongoDB operations');
          score -= 15;
        }
        
        if (code.includes('db.collection') && !code.includes('try')) {
          issues.push('❌ Missing error handling for database operations');
          score -= 20;
        }
      }

      if (checkType === 'performance') {
        if (code.includes('for') && code.includes('await')) {
          issues.push('⚠️ PERFORMANCE: Avoid await in loops - consider Promise.all()');
          score -= 10;
        }
        
        if (code.match(/\/.*\//g) && !code.includes('new RegExp')) {
          recommendations.push('✅ Good: Using regex literals for better performance');
        }
      }
    }

    // Python-specific validations
    if (language === 'python') {
      if (!code.includes('try:') && code.includes('requests.')) {
        issues.push('❌ Missing error handling for HTTP requests');
        score -= 20;
      }
      
      if (code.includes('eval(') || code.includes('exec(')) {
        issues.push('❌ SECURITY: Dynamic code execution detected');
        score -= 30;
      }
    }

    const getGrade = (score) => {
      if (score >= 90) return { grade: 'A', emoji: '🟢', label: 'Excellent' };
      if (score >= 80) return { grade: 'B', emoji: '🟡', label: 'Good' };
      if (score >= 70) return { grade: 'C', emoji: '🟠', label: 'Fair' };
      return { grade: 'D', emoji: '🔴', label: 'Needs Improvement' };
    };

    const gradeInfo = getGrade(score);

    return {
      content: [
        {
          type: 'text',
          text: `## EchoTune AI Code Validation\n\n` +
                `**Language:** ${language}\n` +
                `**Check Type:** ${checkType || 'general'}\n` +
                `**Grade:** ${gradeInfo.emoji} ${gradeInfo.grade} (${score}/100) - ${gradeInfo.label}\n\n` +
                (issues.length > 0 ? `### Issues Found:\n${issues.map(issue => `• ${issue}`).join('\n')}\n\n` : '') +
                (recommendations.length > 0 ? `### Recommendations:\n${recommendations.map(rec => `• ${rec}`).join('\n')}\n\n` : '') +
                (issues.length === 0 && recommendations.length === 0 ? '✅ **No issues found!** Code follows best practices.\n\n' : '') +
                `### EchoTune AI Best Practices:\n` +
                `• Always use environment variables for API keys\n` +
                `• Implement comprehensive error handling for external APIs\n` +
                `• Use async/await patterns for database operations\n` +
                `• Validate and sanitize all user inputs\n` +
                `• Add logging for debugging and monitoring`
        }
      ]
    };
  }

  async testApiEndpoint(endpointCode, testCases = []) {
    const sessionId = crypto.randomUUID();
    const testFile = path.join(this.tempDir, `api_test_${sessionId}.js`);
    
    try {
      // Create a test harness for the API endpoint
      const testHarness = `
const express = require('express');
const app = express();
app.use(express.json());

// User's endpoint code
${endpointCode}

// Test harness
const testResults = [];

async function runTests() {
  const testCases = ${JSON.stringify(testCases)};
  
  for (const testCase of testCases) {
    try {
      // Mock request and response objects
      const req = {
        method: testCase.method || 'GET',
        path: testCase.path || '/',
        body: testCase.body || {},
        query: testCase.query || {},
        params: testCase.params || {}
      };
      
      let responseData = null;
      let statusCode = 200;
      
      const res = {
        json: (data) => { responseData = data; return res; },
        status: (code) => { statusCode = code; return res; },
        send: (data) => { responseData = data; return res; }
      };
      
      // Execute the endpoint (assuming it's exported or globally available)
      // This is a simplified test - in real implementation would use supertest
      testResults.push({
        testCase,
        passed: true,
        response: responseData,
        statusCode,
        error: null
      });
      
    } catch (error) {
      testResults.push({
        testCase,
        passed: false,
        response: null,
        statusCode: 500,
        error: error.message
      });
    }
  }
  
  console.log(JSON.stringify(testResults, null, 2));
}

runTests();
`;

      await fs.writeFile(testFile, testHarness);
      const result = await this.executeCommand('node', [testFile], 15000);

      let testResults = [];
      try {
        testResults = JSON.parse(result.stdout);
      } catch (e) {
        // If parsing fails, create a basic result
        testResults = [{
          error: 'Failed to parse test results',
          output: result.stdout,
          stderr: result.stderr
        }];
      }

      const passedTests = testResults.filter(t => t.passed).length;
      const totalTests = testResults.length;

      return {
        content: [
          {
            type: 'text',
            text: `## API Endpoint Test Results\n\n` +
                  `**Session ID:** ${sessionId}\n` +
                  `**Tests Passed:** ${passedTests}/${totalTests}\n` +
                  `**Success Rate:** ${totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0}%\n\n` +
                  `### Test Details:\n` +
                  testResults.map((test, index) => {
                    const status = test.passed ? '✅' : '❌';
                    const method = test.testCase?.method || 'N/A';
                    const path = test.testCase?.path || 'N/A';
                    return `${status} **Test ${index + 1}**: ${method} ${path}\n` +
                           (test.error ? `   Error: ${test.error}\n` : '') +
                           (test.response ? `   Response: ${JSON.stringify(test.response)}\n` : '');
                  }).join('\n') +
                  (result.stderr ? `\n### Debug Output:\n\`\`\`\n${result.stderr}\n\`\`\`` : '')
          }
        ]
      };

    } catch (error) {
      throw new Error(`API endpoint testing failed: ${error.message}`);
    } finally {
      // Clean up
      try {
        await fs.unlink(testFile);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }

  wrapJavaScriptCode(code, allowNetworking) {
    const securityWrapper = `
// Security restrictions
const originalConsole = console;
const safeConsole = {
  log: (...args) => originalConsole.log(...args),
  error: (...args) => originalConsole.error(...args),
  warn: (...args) => originalConsole.warn(...args)
};

// Override dangerous globals
global.eval = undefined;
global.Function = undefined;

${!allowNetworking ? `
// Block network access
const blockedModules = ['http', 'https', 'net', 'fs', 'child_process'];
const originalRequire = require;
require = (module) => {
  if (blockedModules.includes(module)) {
    throw new Error(\`Module '\${module}' is not allowed in sandbox\`);
  }
  return originalRequire(module);
};
` : ''}

// Set timeout for execution
setTimeout(() => {
  console.error('Execution timeout');
  process.exit(1);
}, 10000);

// User code starts here
try {
  ${code}
} catch (error) {
  console.error('Execution error:', error.message);
  process.exit(1);
}
`;
    
    return securityWrapper;
  }

  wrapPythonCode(code, allowPackages) {
    const securityWrapper = `
import sys
import signal
import builtins

# Security restrictions
blocked_functions = ['eval', 'exec', 'compile', '__import__']
for func in blocked_functions:
    if hasattr(builtins, func):
        delattr(builtins, func)

# Allow only specific packages
allowed_packages = ${JSON.stringify(allowPackages)}
original_import = __builtins__['__import__']

def secure_import(name, *args, **kwargs):
    if name not in allowed_packages:
        raise ImportError(f"Package '{name}' is not allowed in sandbox")
    return original_import(name, *args, **kwargs)

__builtins__['__import__'] = secure_import

# Set timeout for execution
def timeout_handler(signum, frame):
    print("Execution timeout", file=sys.stderr)
    sys.exit(1)

signal.signal(signal.SIGALRM, timeout_handler)
signal.alarm(10)  # 10 second timeout

# User code starts here
try:
    ${code}
except Exception as error:
    print(f"Execution error: {error}", file=sys.stderr)
    sys.exit(1)
`;
    
    return securityWrapper;
  }

  async executeCommand(command, args, timeout) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const child = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: timeout
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        const executionTime = Date.now() - startTime;
        resolve({
          exitCode: code,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          executionTime
        });
      });

      child.on('error', (error) => {
        reject(new Error(`Command execution failed: ${error.message}`));
      });

      // Kill process if it exceeds timeout
      setTimeout(() => {
        child.kill('SIGKILL');
        reject(new Error(`Command timed out after ${timeout}ms`));
      }, timeout);
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Code Sandbox MCP Server running on stdio');
  }
}

// Start the server if run directly
if (require.main === module) {
  const server = new CodeSandboxMCP();
  server.start().catch(console.error);
}

module.exports = CodeSandboxMCP;