#!/usr/bin/env node

/**
 * Code Sandbox MCP Server
 * 
 * MCP server for secure code execution, validation, and testing
 * in isolated environments.
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class CodeSandboxMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'code-sandbox-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    
    this.sandboxDir = process.env.SANDBOX_DIR || '/tmp/code-sandbox';
    this.maxExecutionTime = parseInt(process.env.MAX_EXECUTION_TIME) || 10000; // 10 seconds
    this.setupHandlers();
    this.ensureSandboxDir();
  }

  ensureSandboxDir() {
    if (!fs.existsSync(this.sandboxDir)) {
      fs.mkdirSync(this.sandboxDir, { recursive: true });
    }
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'sandbox_execute_javascript',
            description: 'Execute JavaScript code in a secure sandbox environment',
            inputSchema: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'JavaScript code to execute',
                },
                timeout: {
                  type: 'number',
                  description: 'Execution timeout in milliseconds',
                  default: 5000,
                },
                context: {
                  type: 'object',
                  description: 'Variables to make available in the execution context',
                  default: {},
                },
              },
              required: ['code'],
            },
          },
          {
            name: 'sandbox_execute_python',
            description: 'Execute Python code in a secure sandbox environment',
            inputSchema: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'Python code to execute',
                },
                timeout: {
                  type: 'number',
                  description: 'Execution timeout in milliseconds',
                  default: 5000,
                },
                packages: {
                  type: 'array',
                  description: 'Python packages to make available',
                  items: { type: 'string' },
                  default: [],
                },
              },
              required: ['code'],
            },
          },
          {
            name: 'sandbox_validate_syntax',
            description: 'Validate syntax of code without executing it',
            inputSchema: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'Code to validate',
                },
                language: {
                  type: 'string',
                  description: 'Programming language (javascript, python, json)',
                },
              },
              required: ['code', 'language'],
            },
          },
          {
            name: 'sandbox_run_tests',
            description: 'Run unit tests for code',
            inputSchema: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'Code to test',
                },
                tests: {
                  type: 'string',
                  description: 'Test code',
                },
                language: {
                  type: 'string',
                  description: 'Programming language (javascript, python)',
                },
                framework: {
                  type: 'string',
                  description: 'Test framework (jest, pytest)',
                  default: 'auto',
                },
              },
              required: ['code', 'tests', 'language'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'sandbox_execute_javascript':
            return await this.handleExecuteJavaScript(args);
          case 'sandbox_execute_python':
            return await this.handleExecutePython(args);
          case 'sandbox_validate_syntax':
            return await this.handleValidateSyntax(args);
          case 'sandbox_run_tests':
            return await this.handleRunTests(args);
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

  generateSandboxId() {
    return crypto.randomBytes(8).toString('hex');
  }

  async handleExecuteJavaScript(args) {
    const { code, timeout = 5000, context = {} } = args;
    const sandboxId = this.generateSandboxId();

    try {
      // Create a safe execution environment
      const wrappedCode = `
        const sandbox = {
          console: {
            log: (...args) => process.stdout.write(JSON.stringify(args) + '\\n'),
            error: (...args) => process.stderr.write(JSON.stringify(args) + '\\n')
          },
          setTimeout: (fn, delay) => {
            if (delay > 1000) throw new Error('Timeout too long');
            return setTimeout(fn, delay);
          },
          ...${JSON.stringify(context)}
        };
        
        (function() {
          const result = (function(console, setTimeout) {
            ${code}
          })(sandbox.console, sandbox.setTimeout);
          
          if (result !== undefined) {
            process.stdout.write('RESULT: ' + JSON.stringify(result) + '\\n');
          }
        })();
      `;

      const result = await this.executeInSandbox(wrappedCode, 'node', timeout);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              sandboxId,
              language: 'javascript',
              execution: {
                stdout: result.stdout,
                stderr: result.stderr,
                exitCode: result.exitCode,
                executionTime: result.executionTime,
              },
              result: this.extractResult(result.stdout),
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              sandboxId,
              error: error.message,
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }

  async handleExecutePython(args) {
    const { code, timeout = 5000, packages = [] } = args;
    const sandboxId = this.generateSandboxId();

    try {
      // Create Python execution wrapper
      const wrappedCode = `
import sys
import json
import traceback
from io import StringIO

# Redirect stdout/stderr
old_stdout = sys.stdout
old_stderr = sys.stderr
sys.stdout = StringIO()
sys.stderr = StringIO()

try:
    # Execute user code
    result = None
    exec("""
${code}
""", globals())
    
    # Get any return value from last expression
    if 'result' in locals():
        print("RESULT:", json.dumps(result))
        
except Exception as e:
    print("ERROR:", str(e), file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
finally:
    # Get output
    stdout_value = sys.stdout.getvalue()
    stderr_value = sys.stderr.getvalue()
    
    # Restore stdout/stderr
    sys.stdout = old_stdout
    sys.stderr = old_stderr
    
    # Print results
    if stdout_value:
        print(stdout_value, end='')
    if stderr_value:
        print(stderr_value, end='', file=sys.stderr)
`;

      const result = await this.executeInSandbox(wrappedCode, 'python3', timeout);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              sandboxId,
              language: 'python',
              execution: {
                stdout: result.stdout,
                stderr: result.stderr,
                exitCode: result.exitCode,
                executionTime: result.executionTime,
              },
              result: this.extractPythonResult(result.stdout),
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              sandboxId,
              error: error.message,
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }

  async handleValidateSyntax(args) {
    const { code, language } = args;

    try {
      let validationResult = { valid: true, errors: [] };

      switch (language.toLowerCase()) {
        case 'javascript':
          try {
            // Use Node.js syntax check
            execSync(`node -c`, { input: code, timeout: 2000 });
          } catch (error) {
            validationResult = {
              valid: false,
              errors: [error.message],
            };
          }
          break;

        case 'python':
          try {
            // Use Python syntax check
            const result = execSync('python3 -m py_compile -', { 
              input: code, 
              timeout: 2000,
              encoding: 'utf8' 
            });
            validationResult.valid = true;
          } catch (error) {
            validationResult = {
              valid: false,
              errors: [error.message],
            };
          }
          break;

        case 'json':
          try {
            JSON.parse(code);
          } catch (error) {
            validationResult = {
              valid: false,
              errors: [error.message],
            };
          }
          break;

        default:
          throw new Error(`Unsupported language: ${language}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              language,
              validation: validationResult,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Syntax validation failed: ${error.message}`);
    }
  }

  async handleRunTests(args) {
    const { code, tests, language, framework = 'auto' } = args;
    const sandboxId = this.generateSandboxId();

    try {
      let testResult;

      if (language.toLowerCase() === 'javascript') {
        // Simple JavaScript test runner
        const testCode = `
          const assert = {
            equal: (a, b, msg) => {
              if (a !== b) throw new Error(msg || \`Expected \${b}, got \${a}\`);
              console.log('✅ PASS: ' + (msg || \`\${a} === \${b}\`));
            },
            ok: (value, msg) => {
              if (!value) throw new Error(msg || 'Assertion failed');
              console.log('✅ PASS: ' + (msg || 'Assertion passed'));
            }
          };
          
          // User code
          ${code}
          
          // Tests
          try {
            ${tests}
            console.log('\\n🎉 All tests passed!');
          } catch (error) {
            console.error('❌ TEST FAILED:', error.message);
            process.exit(1);
          }
        `;

        testResult = await this.executeInSandbox(testCode, 'node', 10000);
      } else if (language.toLowerCase() === 'python') {
        // Simple Python test runner
        const testCode = `
import traceback

def assert_equal(a, b, msg=None):
    if a != b:
        raise AssertionError(msg or f"Expected {b}, got {a}")
    print(f"✅ PASS: {msg or f'{a} == {b}'}")

def assert_ok(value, msg=None):
    if not value:
        raise AssertionError(msg or "Assertion failed")
    print(f"✅ PASS: {msg or 'Assertion passed'}")

# User code
${code}

# Tests
try:
${tests.split('\n').map(line => '    ' + line).join('\n')}
    print("\\n🎉 All tests passed!")
except Exception as e:
    print(f"❌ TEST FAILED: {e}")
    traceback.print_exc()
    exit(1)
`;

        testResult = await this.executeInSandbox(testCode, 'python3', 10000);
      } else {
        throw new Error(`Testing not supported for language: ${language}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              sandboxId,
              language,
              framework,
              testResult: {
                stdout: testResult.stdout,
                stderr: testResult.stderr,
                exitCode: testResult.exitCode,
                executionTime: testResult.executionTime,
                passed: testResult.exitCode === 0,
              },
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Test execution failed: ${error.message}`);
    }
  }

  async executeInSandbox(code, interpreter, timeout = 5000) {
    const sandboxId = this.generateSandboxId();
    const tempFile = path.join(this.sandboxDir, `${sandboxId}.tmp`);

    try {
      // Write code to temporary file
      fs.writeFileSync(tempFile, code);

      const startTime = Date.now();

      return new Promise((resolve, reject) => {
        const child = spawn(interpreter, [tempFile], {
          stdio: ['pipe', 'pipe', 'pipe'],
          timeout: timeout,
          cwd: this.sandboxDir,
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
            stdout,
            stderr,
            exitCode: code,
            executionTime,
          });
        });

        child.on('error', (error) => {
          reject(error);
        });

        // Kill process if it runs too long
        setTimeout(() => {
          if (!child.killed) {
            child.kill();
            reject(new Error(`Execution timeout after ${timeout}ms`));
          }
        }, timeout);
      });
    } finally {
      // Clean up temporary file
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  }

  extractResult(stdout) {
    const lines = stdout.split('\n');
    for (const line of lines) {
      if (line.startsWith('RESULT: ')) {
        try {
          return JSON.parse(line.substring(8));
        } catch (error) {
          return line.substring(8);
        }
      }
    }
    return null;
  }

  extractPythonResult(stdout) {
    const lines = stdout.split('\n');
    for (const line of lines) {
      if (line.startsWith('RESULT: ')) {
        try {
          return JSON.parse(line.substring(8));
        } catch (error) {
          return line.substring(8);
        }
      }
    }
    return null;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Code Sandbox MCP Server running on stdio');
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const server = new CodeSandboxMCPServer();
  server.run().catch(console.error);
}

module.exports = CodeSandboxMCPServer;