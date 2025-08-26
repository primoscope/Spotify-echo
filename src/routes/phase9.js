/**
 * Phase 9 API Routes - Advanced Observability, Analytics & Business Intelligence
 * 
 * Provides comprehensive API endpoints for Phase 9 services:
 * - Advanced APM (Application Performance Monitoring)
 * - Business Intelligence Dashboards and KPIs
 * - Real-Time Analytics and Visualization
 * - Advanced Alerting and Anomaly Detection
 * - Cross-service orchestration and management
 */

const express = require('express');
const router = express.Router();

/**
 * Phase 9 Overview and Health
 */

// GET /api/phase9/overview - Complete Phase 9 system overview
router.get('/overview', (req, res) => {
  try {
    const phase9Orchestrator = req.app.locals.phase9Orchestrator;
    
    if (!phase9Orchestrator) {
      return res.status(503).json({
        error: 'Phase 9 services not available',
        message: 'Advanced Observability, Analytics & Business Intelligence services are not initialized'
      });
    }
    
    const overview = phase9Orchestrator.getOverview();
    
    res.json({
      success: true,
      timestamp: Date.now(),
      phase: 'Phase 9',
      title: 'Advanced Observability, Analytics & Business Intelligence',
      overview,
      capabilities: [
        'Advanced APM with performance monitoring',
        'Business Intelligence dashboards and KPIs',
        'Real-time analytics and visualization',
        'Advanced alerting and anomaly detection',
        'Cross-service data correlation',
        'Performance optimization',
        'Comprehensive reporting'
      ]
    });
  } catch (error) {
    console.error('❌ Phase 9 overview error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// GET /api/phase9/health/comprehensive - Comprehensive health check
router.get('/health/comprehensive', (req, res) => {
  try {
    const phase9Orchestrator = req.app.locals.phase9Orchestrator;
    
    if (!phase9Orchestrator) {
      return res.status(503).json({
        error: 'Phase 9 services not available',
        healthy: false
      });
    }
    
    const healthStatus = phase9Orchestrator.getHealthStatus();
    
    res.json({
      success: true,
      timestamp: Date.now(),
      phase: 'Phase 9',
      health: healthStatus,
      status: healthStatus.overall
    });
  } catch (error) {
    console.error('❌ Phase 9 health check error:', error);
    res.status(500).json({
      error: 'Health check failed',
      message: error.message,
      healthy: false
    });
  }
});

// GET /api/phase9/services - Service management and status
router.get('/services', (req, res) => {
  try {
    const phase9Orchestrator = req.app.locals.phase9Orchestrator;
    
    if (!phase9Orchestrator) {
      return res.status(503).json({
        error: 'Phase 9 services not available'
      });
    }
    
    const serviceManagement = phase9Orchestrator.getServiceManagement();
    
    res.json({
      success: true,
      timestamp: Date.now(),
      services: serviceManagement
    });
  } catch (error) {
    console.error('❌ Phase 9 services error:', error);
    res.status(500).json({
      error: 'Service management error',
      message: error.message
    });
  }
});

// GET /api/phase9/integrations - Cross-service integration status
router.get('/integrations', (req, res) => {
  try {
    const phase9Orchestrator = req.app.locals.phase9Orchestrator;
    
    if (!phase9Orchestrator) {
      return res.status(503).json({
        error: 'Phase 9 services not available'
      });
    }
    
    const integrationStatus = phase9Orchestrator.getIntegrationStatus();
    
    res.json({
      success: true,
      timestamp: Date.now(),
      integrations: integrationStatus
    });
  } catch (error) {
    console.error('❌ Phase 9 integrations error:', error);
    res.status(500).json({
      error: 'Integration status error',
      message: error.message
    });
  }
});

/**
 * Advanced APM Service Endpoints
 */

// GET /api/phase9/apm/status - APM service status
router.get('/apm/status', (req, res) => {
  try {
    const phase9Orchestrator = req.app.locals.phase9Orchestrator;
    const apmService = phase9Orchestrator?.getService('apm');
    
    if (!apmService) {
      return res.status(503).json({
        error: 'APM service not available'
      });
    }
    
    const status = apmService.getStatus();
    
    res.json({
      success: true,
      timestamp: Date.now(),
      service: 'Advanced APM',
      status
    });
  } catch (error) {
    console.error('❌ APM status error:', error);
    res.status(500).json({
      error: 'APM status error',
      message: error.message
    });
  }
});

// GET /api/phase9/apm/metrics - APM performance metrics
router.get('/apm/metrics', (req, res) => {
  try {
    const phase9Orchestrator = req.app.locals.phase9Orchestrator;
    const apmService = phase9Orchestrator?.getService('apm');
    
    if (!apmService) {
      return res.status(503).json({
        error: 'APM service not available'
      });
    }
    
    const metrics = apmService.getMetrics();
    
    res.json({
      success: true,
      timestamp: Date.now(),
      service: 'Advanced APM',
      metrics
    });
  } catch (error) {
    console.error('❌ APM metrics error:', error);
    res.status(500).json({
      error: 'APM metrics error',
      message: error.message
    });
  }
});

// GET /api/phase9/apm/alerts - APM alerts and anomalies
router.get('/apm/alerts', (req, res) => {
  try {
    const phase9Orchestrator = req.app.locals.phase9Orchestrator;
    const apmService = phase9Orchestrator?.getService('apm');
    
    if (!apmService) {
      return res.status(503).json({
        error: 'APM service not available'
      });
    }
    
    const alerts = apmService.getAlerts();
    const anomalies = apmService.getAnomalies();
    
    res.json({
      success: true,
      timestamp: Date.now(),
      service: 'Advanced APM',
      alerts,
      anomalies
    });
  } catch (error) {
    console.error('❌ APM alerts error:', error);
    res.status(500).json({
      error: 'APM alerts error',
      message: error.message
    });
  }
});

// GET /api/phase9/apm/recommendations - APM performance recommendations
router.get('/apm/recommendations', (req, res) => {
  try {
    const phase9Orchestrator = req.app.locals.phase9Orchestrator;
    const apmService = phase9Orchestrator?.getService('apm');
    
    if (!apmService) {
      return res.status(503).json({
        error: 'APM service not available'
      });
    }
    
    const recommendations = apmService.getRecommendations();
    
    res.json({
      success: true,
      timestamp: Date.now(),
      service: 'Advanced APM',
      recommendations
    });
  } catch (error) {
    console.error('❌ APM recommendations error:', error);
    res.status(500).json({
      error: 'APM recommendations error',
      message: error.message
    });
  }
});

/**
 * Business Intelligence Dashboard Endpoints
 */

// GET /api/phase9/bi/status - BI service status
router.get('/bi/status', (req, res) => {
  try {
    const phase9Orchestrator = req.app.locals.phase9Orchestrator;
    const biService = phase9Orchestrator?.getService('business_intelligence');
    
    if (!biService) {
      return res.status(503).json({
        error: 'Business Intelligence service not available'
      });
    }
    
    const status = biService.getStatus();
    
    res.json({
      success: true,
      timestamp: Date.now(),
      service: 'Business Intelligence',
      status
    });
  } catch (error) {
    console.error('❌ BI status error:', error);
    res.status(500).json({
      error: 'BI status error',
      message: error.message
    });
  }
});

// GET /api/phase9/bi/dashboards - List all dashboards
router.get('/bi/dashboards', (req, res) => {
  try {
    const phase9Orchestrator = req.app.locals.phase9Orchestrator;
    const biService = phase9Orchestrator?.getService('business_intelligence');
    
    if (!biService) {
      return res.status(503).json({
        error: 'Business Intelligence service not available'
      });
    }
    
    const dashboards = biService.getDashboards();
    
    res.json({
      success: true,
      timestamp: Date.now(),
      service: 'Business Intelligence',
      dashboards
    });
  } catch (error) {
    console.error('❌ BI dashboards error:', error);
    res.status(500).json({
      error: 'BI dashboards error',
      message: error.message
    });
  }
});

// GET /api/phase9/bi/dashboards/:id - Get specific dashboard
router.get('/bi/dashboards/:id', (req, res) => {
  try {
    const phase9Orchestrator = req.app.locals.phase9Orchestrator;
    const biService = phase9Orchestrator?.getService('business_intelligence');
    
    if (!biService) {
      return res.status(503).json({
        error: 'Business Intelligence service not available'
      });
    }
    
    const dashboard = biService.getDashboard(req.params.id);
    
    if (!dashboard) {
      return res.status(404).json({
        error: 'Dashboard not found',
        dashboardId: req.params.id
      });
    }
    
    res.json({
      success: true,
      timestamp: Date.now(),
      service: 'Business Intelligence',
      dashboard
    });
  } catch (error) {
    console.error('❌ BI dashboard error:', error);
    res.status(500).json({
      error: 'BI dashboard error',
      message: error.message
    });
  }
});

// GET /api/phase9/bi/kpis - Business KPIs
router.get('/bi/kpis', (req, res) => {
  try {
    const phase9Orchestrator = req.app.locals.phase9Orchestrator;
    const biService = phase9Orchestrator?.getService('business_intelligence');
    
    if (!biService) {
      return res.status(503).json({
        error: 'Business Intelligence service not available'
      });
    }
    
    const kpis = biService.getKPIs();
    
    res.json({
      success: true,
      timestamp: Date.now(),
      service: 'Business Intelligence',
      kpis
    });
  } catch (error) {
    console.error('❌ BI KPIs error:', error);
    res.status(500).json({
      error: 'BI KPIs error',
      message: error.message
    });
  }
});

// GET /api/phase9/bi/metrics - Business metrics
router.get('/bi/metrics', (req, res) => {
  try {
    const phase9Orchestrator = req.app.locals.phase9Orchestrator;
    const biService = phase9Orchestrator?.getService('business_intelligence');
    
    if (!biService) {
      return res.status(503).json({
        error: 'Business Intelligence service not available'
      });
    }
    
    const businessMetrics = biService.getBusinessMetrics();
    
    res.json({
      success: true,
      timestamp: Date.now(),
      service: 'Business Intelligence',
      metrics: businessMetrics
    });
  } catch (error) {
    console.error('❌ BI metrics error:', error);
    res.status(500).json({
      error: 'BI metrics error',
      message: error.message
    });
  }
});

// GET /api/phase9/bi/insights - Business insights and alerts
router.get('/bi/insights', (req, res) => {
  try {
    const phase9Orchestrator = req.app.locals.phase9Orchestrator;
    const biService = phase9Orchestrator?.getService('business_intelligence');
    
    if (!biService) {
      return res.status(503).json({
        error: 'Business Intelligence service not available'
      });
    }
    
    const limit = parseInt(req.query.limit) || 50;
    const insights = biService.getInsights(limit);
    
    res.json({
      success: true,
      timestamp: Date.now(),
      service: 'Business Intelligence',
      insights
    });
  } catch (error) {
    console.error('❌ BI insights error:', error);
    res.status(500).json({
      error: 'BI insights error',
      message: error.message
    });
  }
});

// GET /api/phase9/bi/reports - Business reports
router.get('/bi/reports', (req, res) => {
  try {
    const phase9Orchestrator = req.app.locals.phase9Orchestrator;
    const biService = phase9Orchestrator?.getService('business_intelligence');
    
    if (!biService) {
      return res.status(503).json({
        error: 'Business Intelligence service not available'
      });
    }
    
    const type = req.query.type;
    const limit = parseInt(req.query.limit) || 10;
    const reports = biService.getReports(type, limit);
    
    res.json({
      success: true,
      timestamp: Date.now(),
      service: 'Business Intelligence',
      reports
    });
  } catch (error) {
    console.error('❌ BI reports error:', error);
    res.status(500).json({
      error: 'BI reports error',
      message: error.message
    });
  }
});

// GET /api/phase9/bi/forecasts - Business forecasts
router.get('/bi/forecasts', (req, res) => {
  try {
    const phase9Orchestrator = req.app.locals.phase9Orchestrator;
    const biService = phase9Orchestrator?.getService('business_intelligence');
    
    if (!biService) {
      return res.status(503).json({
        error: 'Business Intelligence service not available'
      });
    }
    
    const forecasts = biService.getForecasts();
    
    res.json({
      success: true,
      timestamp: Date.now(),
      service: 'Business Intelligence',
      forecasts
    });
  } catch (error) {
    console.error('❌ BI forecasts error:', error);
    res.status(500).json({
      error: 'BI forecasts error',
      message: error.message
    });
  }
});

/**
 * Real-Time Analytics & Visualization Endpoints
 */

// GET /api/phase9/analytics/status - Real-time analytics status
router.get('/analytics/status', (req, res) => {
  try {
    const phase9Orchestrator = req.app.locals.phase9Orchestrator;
    const analyticsService = phase9Orchestrator?.getService('real_time_analytics');
    
    if (!analyticsService) {
      return res.status(503).json({
        error: 'Real-time analytics service not available'
      });
    }
    
    const status = analyticsService.getStatus();
    
    res.json({
      success: true,
      timestamp: Date.now(),
      service: 'Real-Time Analytics',
      status
    });
  } catch (error) {
    console.error('❌ Analytics status error:', error);
    res.status(500).json({
      error: 'Analytics status error',
      message: error.message
    });
  }
});

// GET /api/phase9/analytics/visualizations - List visualizations
router.get('/analytics/visualizations', (req, res) => {
  try {
    const phase9Orchestrator = req.app.locals.phase9Orchestrator;
    const analyticsService = phase9Orchestrator?.getService('real_time_analytics');
    
    if (!analyticsService) {
      return res.status(503).json({
        error: 'Real-time analytics service not available'
      });
    }
    
    const visualizations = analyticsService.getVisualizations();
    
    res.json({
      success: true,
      timestamp: Date.now(),
      service: 'Real-Time Analytics',
      visualizations
    });
  } catch (error) {
    console.error('❌ Analytics visualizations error:', error);
    res.status(500).json({
      error: 'Analytics visualizations error',
      message: error.message
    });
  }
});

// GET /api/phase9/analytics/streams - List data streams
router.get('/analytics/streams', (req, res) => {
  try {
    const phase9Orchestrator = req.app.locals.phase9Orchestrator;
    const analyticsService = phase9Orchestrator?.getService('real_time_analytics');
    
    if (!analyticsService) {
      return res.status(503).json({
        error: 'Real-time analytics service not available'
      });
    }
    
    const streams = analyticsService.getDataStreams();
    
    res.json({
      success: true,
      timestamp: Date.now(),
      service: 'Real-Time Analytics',
      streams
    });
  } catch (error) {
    console.error('❌ Analytics streams error:', error);
    res.status(500).json({
      error: 'Analytics streams error',
      message: error.message
    });
  }
});

// GET /api/phase9/analytics/metrics - Analytics performance metrics
router.get('/analytics/metrics', (req, res) => {
  try {
    const phase9Orchestrator = req.app.locals.phase9Orchestrator;
    const analyticsService = phase9Orchestrator?.getService('real_time_analytics');
    
    if (!analyticsService) {
      return res.status(503).json({
        error: 'Real-time analytics service not available'
      });
    }
    
    const metrics = analyticsService.getAnalyticsMetrics();
    
    res.json({
      success: true,
      timestamp: Date.now(),
      service: 'Real-Time Analytics',
      metrics
    });
  } catch (error) {
    console.error('❌ Analytics metrics error:', error);
    res.status(500).json({
      error: 'Analytics metrics error',
      message: error.message
    });
  }
});

/**
 * Advanced Alerting & Anomaly Detection Endpoints
 */

// GET /api/phase9/alerting/status - Alerting service status
router.get('/alerting/status', (req, res) => {
  try {
    const phase9Orchestrator = req.app.locals.phase9Orchestrator;
    const alertingService = phase9Orchestrator?.getService('advanced_alerting');
    
    if (!alertingService) {
      return res.status(503).json({
        error: 'Advanced alerting service not available'
      });
    }
    
    const status = alertingService.getStatus();
    
    res.json({
      success: true,
      timestamp: Date.now(),
      service: 'Advanced Alerting',
      status
    });
  } catch (error) {
    console.error('❌ Alerting status error:', error);
    res.status(500).json({
      error: 'Alerting status error',
      message: error.message
    });
  }
});

// GET /api/phase9/alerting/alerts - List alerts
router.get('/alerting/alerts', (req, res) => {
  try {
    const phase9Orchestrator = req.app.locals.phase9Orchestrator;
    const alertingService = phase9Orchestrator?.getService('advanced_alerting');
    
    if (!alertingService) {
      return res.status(503).json({
        error: 'Advanced alerting service not available'
      });
    }
    
    const filters = {
      status: req.query.status,
      severity: req.query.severity,
      sourceId: req.query.source
    };
    
    const alerts = alertingService.getAlerts(filters);
    
    res.json({
      success: true,
      timestamp: Date.now(),
      service: 'Advanced Alerting',
      alerts
    });
  } catch (error) {
    console.error('❌ Alerting alerts error:', error);
    res.status(500).json({
      error: 'Alerting alerts error',
      message: error.message
    });
  }
});

// GET /api/phase9/alerting/incidents - List incidents
router.get('/alerting/incidents', (req, res) => {
  try {
    const phase9Orchestrator = req.app.locals.phase9Orchestrator;
    const alertingService = phase9Orchestrator?.getService('advanced_alerting');
    
    if (!alertingService) {
      return res.status(503).json({
        error: 'Advanced alerting service not available'
      });
    }
    
    const filters = {
      status: req.query.status,
      severity: req.query.severity
    };
    
    const incidents = alertingService.getIncidents(filters);
    
    res.json({
      success: true,
      timestamp: Date.now(),
      service: 'Advanced Alerting',
      incidents
    });
  } catch (error) {
    console.error('❌ Alerting incidents error:', error);
    res.status(500).json({
      error: 'Alerting incidents error',
      message: error.message
    });
  }
});

// GET /api/phase9/alerting/metrics - Alerting metrics
router.get('/alerting/metrics', (req, res) => {
  try {
    const phase9Orchestrator = req.app.locals.phase9Orchestrator;
    const alertingService = phase9Orchestrator?.getService('advanced_alerting');
    
    if (!alertingService) {
      return res.status(503).json({
        error: 'Advanced alerting service not available'
      });
    }
    
    const metrics = alertingService.getMetrics();
    
    res.json({
      success: true,
      timestamp: Date.now(),
      service: 'Advanced Alerting',
      metrics
    });
  } catch (error) {
    console.error('❌ Alerting metrics error:', error);
    res.status(500).json({
      error: 'Alerting metrics error',
      message: error.message
    });
  }
});

// POST /api/phase9/alerting/alerts/:id/acknowledge - Acknowledge alert
router.post('/alerting/alerts/:id/acknowledge', (req, res) => {
  try {
    const phase9Orchestrator = req.app.locals.phase9Orchestrator;
    const alertingService = phase9Orchestrator?.getService('advanced_alerting');
    
    if (!alertingService) {
      return res.status(503).json({
        error: 'Advanced alerting service not available'
      });
    }
    
    const alertId = req.params.id;
    const userId = req.body.userId || 'api-user';
    
    alertingService.acknowledgeAlert(alertId, userId);
    
    res.json({
      success: true,
      timestamp: Date.now(),
      message: `Alert ${alertId} acknowledged by ${userId}`
    });
  } catch (error) {
    console.error('❌ Alert acknowledgment error:', error);
    res.status(500).json({
      error: 'Alert acknowledgment error',
      message: error.message
    });
  }
});

// POST /api/phase9/alerting/alerts/:id/close - Close alert
router.post('/alerting/alerts/:id/close', (req, res) => {
  try {
    const phase9Orchestrator = req.app.locals.phase9Orchestrator;
    const alertingService = phase9Orchestrator?.getService('advanced_alerting');
    
    if (!alertingService) {
      return res.status(503).json({
        error: 'Advanced alerting service not available'
      });
    }
    
    const alertId = req.params.id;
    const reason = req.body.reason || 'Resolved';
    const userId = req.body.userId || 'api-user';
    
    alertingService.closeAlert(alertId, reason, userId);
    
    res.json({
      success: true,
      timestamp: Date.now(),
      message: `Alert ${alertId} closed by ${userId}: ${reason}`
    });
  } catch (error) {
    console.error('❌ Alert closure error:', error);
    res.status(500).json({
      error: 'Alert closure error',
      message: error.message
    });
  }
});

// POST /api/phase9/alerting/suppress - Suppress alerts
router.post('/alerting/suppress', (req, res) => {
  try {
    const phase9Orchestrator = req.app.locals.phase9Orchestrator;
    const alertingService = phase9Orchestrator?.getService('advanced_alerting');
    
    if (!alertingService) {
      return res.status(503).json({
        error: 'Advanced alerting service not available'
      });
    }
    
    const { sourceId, type, duration } = req.body;
    
    if (!sourceId || !type) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['sourceId', 'type']
      });
    }
    
    alertingService.suppressAlerts(sourceId, type, duration);
    
    res.json({
      success: true,
      timestamp: Date.now(),
      message: `Alerts suppressed for ${sourceId}/${type}`,
      duration: duration || 3600000
    });
  } catch (error) {
    console.error('❌ Alert suppression error:', error);
    res.status(500).json({
      error: 'Alert suppression error',
      message: error.message
    });
  }
});

/**
 * Export and Reporting Endpoints
 */

// GET /api/phase9/export/dashboard/:id - Export dashboard data
router.get('/export/dashboard/:id', (req, res) => {
  try {
    const phase9Orchestrator = req.app.locals.phase9Orchestrator;
    const biService = phase9Orchestrator?.getService('business_intelligence');
    
    if (!biService) {
      return res.status(503).json({
        error: 'Business Intelligence service not available'
      });
    }
    
    const dashboardId = req.params.id;
    const format = req.query.format || 'json';
    
    const exportData = biService.exportDashboard(dashboardId, format);
    
    if (format === 'csv') {
      res.set({
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="dashboard-${dashboardId}.csv"`
      });
      res.send(exportData);
    } else {
      res.set({
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="dashboard-${dashboardId}.json"`
      });
      res.send(exportData);
    }
  } catch (error) {
    console.error('❌ Dashboard export error:', error);
    res.status(500).json({
      error: 'Dashboard export error',
      message: error.message
    });
  }
});

// GET /api/phase9/export/visualization/:id - Export visualization data
router.get('/export/visualization/:id', (req, res) => {
  try {
    const phase9Orchestrator = req.app.locals.phase9Orchestrator;
    const analyticsService = phase9Orchestrator?.getService('real_time_analytics');
    
    if (!analyticsService) {
      return res.status(503).json({
        error: 'Real-time analytics service not available'
      });
    }
    
    const visualizationId = req.params.id;
    const format = req.query.format || 'json';
    
    const exportData = analyticsService.exportVisualization(visualizationId, format);
    
    if (format === 'csv') {
      res.set({
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="visualization-${visualizationId}.csv"`
      });
      res.send(exportData);
    } else {
      res.set({
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="visualization-${visualizationId}.json"`
      });
      res.send(exportData);
    }
  } catch (error) {
    console.error('❌ Visualization export error:', error);
    res.status(500).json({
      error: 'Visualization export error',
      message: error.message
    });
  }
});

// GET /api/phase9/report/comprehensive - Generate comprehensive Phase 9 report
router.get('/report/comprehensive', (req, res) => {
  try {
    const phase9Orchestrator = req.app.locals.phase9Orchestrator;
    
    if (!phase9Orchestrator) {
      return res.status(503).json({
        error: 'Phase 9 services not available'
      });
    }
    
    const report = phase9Orchestrator.generatePhase9Report();
    
    res.json({
      success: true,
      timestamp: Date.now(),
      report
    });
  } catch (error) {
    console.error('❌ Comprehensive report error:', error);
    res.status(500).json({
      error: 'Comprehensive report error',
      message: error.message
    });
  }
});

module.exports = router;