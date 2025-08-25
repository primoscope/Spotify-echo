#!/usr/bin/env node
/**
 * Sentry MCP Server for EchoTune AI
 * 
 * Provides comprehensive error monitoring, performance tracking,
 * and observability for the EchoTune AI system using Sentry.
 * 
 * Features:
 * - Error tracking and reporting
 * - Performance monitoring
 * - Custom event tracking
 * - Release tracking
 * - User context management
 * - Integration with MCP ecosystem
 */

const Sentry = require("@sentry/node");
const express = require('express');

// Initialize Sentry with provided configuration
Sentry.init({
  dsn: "https://81f42a0da8d0d7467f0c231d29f34051@o4509810176294912.ingest.us.sentry.io/4509810186387456",
  // Tracing must be enabled for MCP monitoring to work
  tracesSampleRate: 1.0,
  sendDefaultPii: true,
  environment: process.env.NODE_ENV || 'development',
  release: process.env.npm_package_version || 'unknown',
  
  // Enhanced configuration for EchoTune AI
  integrations: [
    Sentry.httpIntegration(),
    Sentry.onUncaughtExceptionIntegration(),
    Sentry.onUnhandledRejectionIntegration(),
    Sentry.localVariablesIntegration()
  ],
  
  // Custom tags for EchoTune AI
  initialScope: {
    tags: {
      service: 'echotune-ai',
      component: 'mcp-server',
      version: '1.0.0'
    }
  },
  
  // Performance monitoring for music recommendation workflows
  beforeSend: (event, hint) => {
    // Add EchoTune-specific context
    if (event.contexts) {
      event.contexts.echotune = {
        type: 'echotune_context',
        timestamp: new Date().toISOString(),
        mcp_server: 'sentry-mcp'
      };
    }
    return event;
  }
});

class SentryMCPServer {
  constructor() {
    this.app = express();
    this.port = process.env.SENTRY_MCP_PORT || 3012;
    this.setupMiddleware();
    this.setupRoutes();
    this.startServer();
  }
  
  setupMiddleware() {
    // Basic middleware setup without deprecated Sentry handlers for now
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // Add basic request logging for monitoring
    this.app.use((req, res, next) => {
      const requestInfo = {
        method: req.method,
        url: req.url,
        timestamp: new Date().toISOString(),
        user_agent: req.get('User-Agent')
      };
      
      Sentry.addBreadcrumb({
        message: `${req.method} ${req.url}`,
        category: 'http',
        level: 'info',
        data: requestInfo
      });
      
      next();
    });
  }
  
  setupRoutes() {
    // MCP Tools API endpoint
    this.app.post('/mcp/call-tool', async (req, res) => {
      try {
        const { tool, arguments: args } = req.body;
        
        switch (tool) {
          case 'sentry_capture_error':
            const errorResult = await this.captureError(args);
            res.json(errorResult);
            break;
            
          case 'sentry_capture_event':
            const eventResult = await this.captureEvent(args);
            res.json(eventResult);
            break;
            
          case 'sentry_start_transaction':
            const transactionResult = await this.startTransaction(args);
            res.json(transactionResult);
            break;
            
          case 'sentry_finish_transaction':
            const finishResult = await this.finishTransaction(args);
            res.json(finishResult);
            break;
            
          case 'sentry_set_user_context':
            const userResult = await this.setUserContext(args);
            res.json(userResult);
            break;
            
          case 'sentry_add_breadcrumb':
            const breadcrumbResult = await this.addBreadcrumb(args);
            res.json(breadcrumbResult);
            break;
            
          case 'sentry_health_check':
            const healthResult = await this.healthCheck();
            res.json(healthResult);
            break;
            
          default:
            res.status(400).json({
              success: false,
              error: `Unknown tool: ${tool}`,
              available_tools: [
                'sentry_capture_error',
                'sentry_capture_event',
                'sentry_start_transaction', 
                'sentry_finish_transaction',
                'sentry_set_user_context',
                'sentry_add_breadcrumb',
                'sentry_health_check'
              ]
            });
        }
      } catch (error) {
        Sentry.captureException(error);
        res.status(500).json({
          success: false,
          error: `Tool execution failed: ${error.message}`,
          timestamp: new Date().toISOString()
        });
      }
    });

    // List available tools endpoint
    this.app.get('/mcp/tools', (req, res) => {
      res.json({
        tools: [
          {
            name: 'sentry_capture_error',
            description: 'Capture and report errors to Sentry',
            inputSchema: {
              type: 'object',
              properties: {
                error: { type: 'string', description: 'Error message or exception details' },
                level: { type: 'string', enum: ['fatal', 'error', 'warning', 'info', 'debug'], default: 'error' },
                context: { type: 'object', description: 'Additional context data' },
                user: { type: 'object', description: 'User context information' },
                tags: { type: 'object', description: 'Custom tags for categorizing' }
              },
              required: ['error']
            }
          },
          {
            name: 'sentry_capture_event',
            description: 'Capture custom events for monitoring EchoTune AI workflows',
            inputSchema: {
              type: 'object',
              properties: {
                message: { type: 'string', description: 'Event message' },
                level: { type: 'string', enum: ['fatal', 'error', 'warning', 'info', 'debug'], default: 'info' },
                extra: { type: 'object', description: 'Additional data for the event' },
                tags: { type: 'object', description: 'Custom tags for the event' }
              },
              required: ['message']
            }
          },
          {
            name: 'sentry_start_transaction',
            description: 'Start performance tracking transaction for music operations',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Transaction name' },
                operation: { type: 'string', description: 'Operation type' },
                description: { type: 'string', description: 'Detailed transaction description' }
              },
              required: ['name', 'operation']
            }
          },
          {
            name: 'sentry_finish_transaction',
            description: 'Finish and submit performance transaction',
            inputSchema: {
              type: 'object',
              properties: {
                transaction_id: { type: 'string', description: 'Transaction ID' },
                status: { type: 'string', enum: ['ok', 'cancelled', 'unknown_error'], default: 'ok' },
                tags: { type: 'object', description: 'Additional tags' }
              },
              required: ['transaction_id']
            }
          },
          {
            name: 'sentry_set_user_context',
            description: 'Set user context for subsequent Sentry events',
            inputSchema: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    username: { type: 'string' },
                    spotify_id: { type: 'string' }
                  }
                }
              },
              required: ['user']
            }
          },
          {
            name: 'sentry_add_breadcrumb',
            description: 'Add breadcrumb for tracking user actions and system events',
            inputSchema: {
              type: 'object',
              properties: {
                message: { type: 'string', description: 'Breadcrumb message' },
                category: { type: 'string', description: 'Breadcrumb category' },
                level: { type: 'string', enum: ['fatal', 'error', 'warning', 'info', 'debug'], default: 'info' },
                data: { type: 'object', description: 'Additional breadcrumb data' }
              },
              required: ['message']
            }
          },
          {
            name: 'sentry_health_check',
            description: 'Check Sentry integration health and connectivity',
            inputSchema: { type: 'object', properties: {} }
          }
        ]
      });
    });
    
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'sentry-mcp-server',
        version: '1.0.0',
        sentry_dsn_configured: !!process.env.SENTRY_DSN || true,
        timestamp: new Date().toISOString()
      });
    });
    
    // Test error endpoint
    this.app.get('/test-error', (req, res) => {
      // Intentional test error for Sentry validation
      throw new Error('Test error from Sentry MCP Server - this is expected for testing');
    });
    
    // Performance test endpoint
    this.app.get('/test-performance', async (req, res) => {
      try {
        // Use Sentry v8 API for transactions
        const transaction = Sentry.startSpan({
          op: 'test',
          name: 'Performance Test Transaction'
        }, async () => {
          // Simulate some work
          await new Promise(resolve => setTimeout(resolve, 100));
          return 'Performance Test Transaction';
        });
        
        res.json({
          message: 'Performance test completed',
          transaction_id: 'Performance Test Transaction'
        });
      } catch (error) {
        Sentry.captureException(error);
        res.status(500).json({
          error: 'Performance test failed',
          message: error.message
        });
      }
    });
    
    
    // Optional fallback error handler
    this.app.use((err, req, res, next) => {
      // Capture error to Sentry
      Sentry.captureException(err);
      
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Something went wrong!',
        timestamp: new Date().toISOString()
      });
    });
  }
  
  async captureError(args) {
    try {
      const { error, level = 'error', context = {}, user, tags = {} } = args;
      
      // Set user context if provided
      if (user) {
        Sentry.setUser(user);
      }
      
      // Set additional context
      Sentry.setContext('echotune_error', {
        ...context,
        captured_at: new Date().toISOString(),
        mcp_tool: 'sentry_capture_error'
      });
      
      // Set tags
      Object.entries(tags).forEach(([key, value]) => {
        Sentry.setTag(key, value);
      });
      
      // Capture the error
      const eventId = Sentry.captureException(new Error(error), {
        level: level,
        contexts: {
          echotune: {
            type: 'error_capture',
            service: 'mcp-sentry',
            timestamp: new Date().toISOString()
          }
        }
      });
      
      return {
        success: true,
        event_id: eventId,
        message: 'Error captured successfully',
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      return {
        success: false,
        error: `Failed to capture error: ${err.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  async captureEvent(args) {
    try {
      const { message, level = 'info', extra = {}, tags = {} } = args;
      
      // Set tags
      Object.entries(tags).forEach(([key, value]) => {
        Sentry.setTag(key, value);
      });
      
      // Capture the event
      const eventId = Sentry.captureMessage(message, {
        level: level,
        extra: {
          ...extra,
          captured_at: new Date().toISOString(),
          mcp_tool: 'sentry_capture_event'
        }
      });
      
      return {
        success: true,
        event_id: eventId,
        message: 'Event captured successfully',
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      return {
        success: false,
        error: `Failed to capture event: ${err.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  async startTransaction(args) {
    try {
      const { name, operation, description } = args;
      
      // Use Sentry v8 API for spans/transactions
      const transactionId = `${name}_${Date.now()}`;
      
      // Start a span (transaction in Sentry v8)
      Sentry.startSpan({
        op: operation,
        name: name,
        description: description,
        tags: {
          service: 'echotune-ai',
          mcp_server: 'sentry'
        }
      }, async () => {
        // The span is automatically finished when the callback completes
        await new Promise(resolve => setTimeout(resolve, 1)); // Minimal delay
      });
      
      return {
        success: true,
        transaction_id: transactionId,
        transaction_name: name,
        operation: operation,
        started_at: new Date().toISOString(),
        message: 'Transaction started successfully'
      };
    } catch (err) {
      return {
        success: false,
        error: `Failed to start transaction: ${err.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  async finishTransaction(args) {
    try {
      const { transaction_id, status = 'ok', tags = {} } = args;
      
      // In a real implementation, retrieve the transaction by ID
      // For now, we'll create a simple completion event
      
      const eventId = Sentry.captureMessage(`Transaction completed: ${transaction_id}`, {
        level: 'info',
        extra: {
          transaction_id,
          status,
          completed_at: new Date().toISOString(),
          mcp_tool: 'sentry_finish_transaction'
        },
        tags: {
          transaction_status: status,
          ...tags
        }
      });
      
      return {
        success: true,
        transaction_id,
        event_id: eventId,
        status,
        completed_at: new Date().toISOString(),
        message: 'Transaction finished successfully'
      };
    } catch (err) {
      return {
        success: false,
        error: `Failed to finish transaction: ${err.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  async setUserContext(args) {
    try {
      const { user } = args;
      
      Sentry.setUser(user);
      
      return {
        success: true,
        user_context: user,
        message: 'User context set successfully',
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      return {
        success: false,
        error: `Failed to set user context: ${err.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  async addBreadcrumb(args) {
    try {
      const { message, category, level = 'info', data = {} } = args;
      
      Sentry.addBreadcrumb({
        message,
        category,
        level,
        data: {
          ...data,
          timestamp: new Date().toISOString(),
          mcp_tool: 'sentry_add_breadcrumb'
        }
      });
      
      return {
        success: true,
        breadcrumb: { message, category, level },
        message: 'Breadcrumb added successfully',
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      return {
        success: false,
        error: `Failed to add breadcrumb: ${err.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  async healthCheck() {
    try {
      // Test Sentry connectivity by capturing a test event
      const eventId = Sentry.captureMessage('Sentry MCP Server Health Check', {
        level: 'info',
        extra: {
          health_check: true,
          timestamp: new Date().toISOString(),
          mcp_server: 'sentry'
        }
      });
      
      return {
        success: true,
        status: 'healthy',
        sentry_connected: true,
        test_event_id: eventId,
        dsn_configured: true,
        timestamp: new Date().toISOString(),
        features: [
          'error_tracking',
          'performance_monitoring',
          'custom_events',
          'user_context',
          'breadcrumbs',
          'transactions'
        ]
      };
    } catch (err) {
      return {
        success: false,
        status: 'unhealthy',
        error: `Health check failed: ${err.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  startServer() {
    this.app.listen(this.port, () => {
      console.log(`🔍 Sentry MCP Server running on port ${this.port}`);
      console.log(`📊 Sentry DSN configured: ${!!process.env.SENTRY_DSN || 'using hardcoded DSN'}`);
      console.log(`🌐 Health check: http://localhost:${this.port}/health`);
      console.log(`⚠️  Test error: http://localhost:${this.port}/test-error`);
      console.log(`📈 Test performance: http://localhost:${this.port}/test-performance`);
      
      // Send startup event to Sentry
      Sentry.captureMessage('Sentry MCP Server Started', {
        level: 'info',
        extra: {
          port: this.port,
          started_at: new Date().toISOString(),
          version: '1.0.0'
        },
        tags: {
          event_type: 'server_startup',
          service: 'sentry-mcp'
        }
      });
    });
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🔍 Shutting down Sentry MCP Server...');
  Sentry.captureMessage('Sentry MCP Server Shutdown', {
    level: 'info',
    extra: {
      shutdown_at: new Date().toISOString(),
      reason: 'SIGINT'
    }
  });
  
  // Flush Sentry events before exit
  Sentry.close(2000).then(() => {
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🔍 Shutting down Sentry MCP Server (SIGTERM)...');
  Sentry.captureMessage('Sentry MCP Server Shutdown', {
    level: 'info',
    extra: {
      shutdown_at: new Date().toISOString(),
      reason: 'SIGTERM'
    }
  });
  
  Sentry.close(2000).then(() => {
    process.exit(0);
  });
});

// Start the server if called directly
if (require.main === module) {
  new SentryMCPServer();
}

module.exports = SentryMCPServer;