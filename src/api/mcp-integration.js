/**
 * Enhanced MCP Integration API
 * Provides backend endpoints for MCP server automation and configuration management
 * Integrates with the MCP workflow automation system
 */

const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);
const router = express.Router();

// Import our MCP workflow automation system
const MCPWorkflowAutomation = require('../../../scripts/mcp-workflow-automation');

/**
 * MCP Server Health and Status Endpoint
 */
router.get('/health', async (req, res) => {
  try {
    // Check if MCP server is running on port 3001
    const { stdout } = await execAsync('curl -s http://localhost:3001/health').catch(() => ({ stdout: '{}' }));
    
    let mcpHealth = {};
    try {
      mcpHealth = JSON.parse(stdout);
    } catch {
      mcpHealth = { status: 'unavailable', error: 'MCP server not responding' };
    }

    // Get automation system status
    const automation = new MCPWorkflowAutomation();
    const automationHealth = await automation.checkMCPServerHealth();

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      mcp_server: mcpHealth,
      automation_system: automationHealth ? 'available' : 'unavailable',
      endpoints: {
        health: '/api/mcp/health',
        automation: '/api/mcp/trigger-automation',
        workflow: '/api/mcp/workflow',
        reports: '/api/mcp/reports'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to check MCP health',
      error: error.message
    });
  }
});

/**
 * Trigger MCP Workflow Automation
 */
router.post('/trigger-automation', async (req, res) => {
  try {
    const { type = 'full' } = req.body;
    
    const automation = new MCPWorkflowAutomation();
    
    let result;
    switch (type) {
      case 'code-analysis':
        result = await automation.runCodeAnalysis();
        break;
      case 'testing':
        result = await automation.runAutomatedTesting();
        break;
      case 'diagrams':
        result = await automation.generateWorkflowDiagrams();
        break;
      case 'configuration_update':
        // Special handler for configuration updates
        result = await automation.runCodeAnalysis(); // Run quick validation
        if (result) {
          // Also regenerate diagrams if configuration changed
          await automation.generateWorkflowDiagrams();
        }
        break;
      case 'full':
      default:
        result = await automation.runFullAutomation();
        break;
    }

    res.json({
      status: 'success',
      automation_type: type,
      timestamp: new Date().toISOString(),
      result: result,
      message: `MCP automation completed: ${type}`
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'MCP automation failed',
      error: error.message
    });
  }
});

/**
 * Get Workflow Status and Progress
 */
router.get('/workflow/status', async (req, res) => {
  try {
    const automation = new MCPWorkflowAutomation();
    const health = await automation.checkMCPServerHealth();
    
    // Check for recent automation reports
    const reportsDir = path.join(process.cwd(), 'automation-logs');
    let latestReports = {};
    
    try {
      const files = await fs.readdir(reportsDir);
      const reportFiles = files.filter(f => f.endsWith('.json'));
      
      for (const file of reportFiles) {
        try {
          const content = await fs.readFile(path.join(reportsDir, file), 'utf8');
          const data = JSON.parse(content);
          latestReports[file.replace('.json', '')] = {
            timestamp: data.timestamp || null,
            status: data.status || 'unknown',
            summary: data.performance || data.summary || {}
          };
        } catch (e) {
          // Skip invalid files
        }
      }
    } catch (e) {
      // Reports directory doesn't exist yet
    }

    res.json({
      status: 'success',
      workflow_status: {
        mcp_server_health: health,
        automation_available: !!health,
        last_runs: latestReports,
        capabilities: {
          code_analysis: true,
          automated_testing: true,
          diagram_generation: true,
          performance_monitoring: true,
          workflow_orchestration: true
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get workflow status',
      error: error.message
    });
  }
});

/**
 * Get Automation Reports
 */
router.get('/reports', async (req, res) => {
  try {
    const { type, limit = 10 } = req.query;
    const reportsDir = path.join(process.cwd(), 'automation-logs');
    
    const reports = [];
    
    try {
      const files = await fs.readdir(reportsDir);
      let reportFiles = files.filter(f => f.endsWith('.json'));
      
      if (type) {
        reportFiles = reportFiles.filter(f => f.includes(type));
      }
      
      // Sort by modification time (most recent first)
      const fileStats = await Promise.all(
        reportFiles.map(async (file) => {
          const stat = await fs.stat(path.join(reportsDir, file));
          return { file, mtime: stat.mtime };
        })
      );
      
      fileStats.sort((a, b) => b.mtime - a.mtime);
      
      // Read the most recent reports
      for (const { file } of fileStats.slice(0, limit)) {
        try {
          const content = await fs.readFile(path.join(reportsDir, file), 'utf8');
          const data = JSON.parse(content);
          reports.push({
            filename: file,
            type: file.replace('.json', '').replace(/-\d+/g, ''),
            timestamp: data.timestamp,
            ...data
          });
        } catch (e) {
          // Skip invalid files
        }
      }
    } catch (e) {
      // Reports directory doesn't exist yet - return empty array
    }

    res.json({
      status: 'success',
      reports: reports,
      total: reports.length,
      filter: type || 'all'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get automation reports',
      error: error.message
    });
  }
});

/**
 * Get Specific Report
 */
router.get('/reports/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    const reportsDir = path.join(process.cwd(), 'automation-logs');
    const reportPath = path.join(reportsDir, `${reportId}.json`);
    
    const content = await fs.readFile(reportPath, 'utf8');
    const report = JSON.parse(content);
    
    res.json({
      status: 'success',
      report: report
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to get report',
        error: error.message
      });
    }
  }
});

/**
 * MCP Server Configuration Management
 */
router.get('/servers/config', async (req, res) => {
  try {
    // Read package.json MCP configuration
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageContent = await fs.readFile(packagePath, 'utf8');
    const packageJson = JSON.parse(packageContent);
    
    const mcpConfig = packageJson.mcp || { servers: {} };
    
    // Get current server status
    const health = await new MCPWorkflowAutomation().checkMCPServerHealth();
    
    const serversWithStatus = {};
    for (const [serverName, config] of Object.entries(mcpConfig.servers)) {
      serversWithStatus[serverName] = {
        ...config,
        status: health && health.servers && health.servers[serverName] 
          ? health.servers[serverName].status 
          : 'unknown'
      };
    }
    
    res.json({
      status: 'success',
      servers: serversWithStatus,
      total_servers: Object.keys(serversWithStatus).length
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get server configuration',
      error: error.message
    });
  }
});

/**
 * Real-time Workflow Monitoring WebSocket Support
 */
router.get('/monitor/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Send initial status
  const _automation = new MCPWorkflowAutomation();
  _automation.checkMCPServerHealth().then(health => {
    sendEvent({
      type: 'status',
      timestamp: new Date().toISOString(),
      data: health
    });
  });

  // Send periodic updates
  const interval = setInterval(async () => {
    try {
      const health = await _automation.checkMCPServerHealth();
      sendEvent({
        type: 'health_update',
        timestamp: new Date().toISOString(),
        data: health
      });
    } catch (error) {
      sendEvent({
        type: 'error',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }, 10000); // Every 10 seconds

  // Cleanup on client disconnect
  req.on('close', () => {
    clearInterval(interval);
  });
});

/**
 * Workflow Diagram Generation
 */
router.post('/generate-diagrams', async (req, res) => {
  try {
    const automation = new MCPWorkflowAutomation();
    const diagrams = await automation.generateWorkflowDiagrams();
    
    res.json({
      status: 'success',
      message: 'Workflow diagrams generated successfully',
      diagrams: Object.keys(diagrams),
      location: 'docs/diagrams/'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate diagrams',
      error: error.message
    });
  }
});

/**
 * Performance Metrics Endpoint
 */
router.get('/metrics', async (req, res) => {
  try {
    const _automation = new MCPWorkflowAutomation();
    
    // Get latest performance report
    const reportsDir = path.join(process.cwd(), 'automation-logs');
    
    try {
      const content = await fs.readFile(path.join(reportsDir, 'full-automation-report.json'), 'utf8');
      const report = JSON.parse(content);
      
      const metrics = {
        last_run: report.timestamp,
        total_runtime: report.performance?.total_runtime || 0,
        code_quality: {
          status: report.code_analysis?.linting?.status || 'unknown',
          files_analyzed: report.code_analysis?.files_analyzed || 0,
          recommendations: report.code_analysis?.recommendations?.length || 0
        },
        testing: {
          unit_tests: report.testing?.unit_tests?.status || 'unknown',
          integration_tests: report.testing?.integration_tests?.status || 'unknown',
          ui_tests: report.testing?.ui_tests?.status || 'unknown',
          performance_tests: report.testing?.performance_tests?.status || 'unknown'
        },
        mcp_health: report.mcp_health || {},
        system_status: report.performance?.status || 'unknown'
      };
      
      res.json({
        status: 'success',
        metrics: metrics
      });
    } catch (e) {
      // No report available yet
      res.json({
        status: 'success',
        metrics: {
          message: 'No automation metrics available yet. Run automation first.',
          suggestion: 'POST /api/mcp/trigger-automation to generate metrics'
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get metrics',
      error: error.message
    });
  }
});

module.exports = router;