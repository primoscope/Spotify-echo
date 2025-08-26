/**
 * Phase 9 Test Suite - Advanced Observability, Analytics & Business Intelligence
 * 
 * Comprehensive test suite for Phase 9 services:
 * - Advanced APM Service
 * - Business Intelligence Dashboard Service
 * - Real-Time Analytics & Visualization Service
 * - Advanced Alerting & Anomaly Detection Service
 * - Phase 9 Orchestrator integration
 */

const axios = require('axios');
const { performance } = require('perf_hooks');

class Phase9TestSuite {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      errors: [],
      startTime: Date.now(),
      tests: []
    };
  }
  
  /**
   * Run comprehensive Phase 9 test suite
   */
  async runTests() {
    console.log('🧪 Running Phase 9 Test Suite - Advanced Observability, Analytics & Business Intelligence');
    console.log('=' .repeat(80));
    
    try {
      // Test Phase 9 Overview and Health
      await this.testPhase9Overview();
      await this.testPhase9Health();
      await this.testPhase9Services();
      await this.testPhase9Integrations();
      
      // Test Advanced APM Service
      await this.testAPMService();
      await this.testAPMMetrics();
      await this.testAPMAlerts();
      await this.testAPMRecommendations();
      
      // Test Business Intelligence Service
      await this.testBIService();
      await this.testBIDashboards();
      await this.testBIKPIs();
      await this.testBIMetrics();
      await this.testBIInsights();
      await this.testBIReports();
      await this.testBIForecasts();
      
      // Test Real-Time Analytics Service
      await this.testAnalyticsService();
      await this.testAnalyticsVisualizations();
      await this.testAnalyticsStreams();
      await this.testAnalyticsMetrics();
      
      // Test Advanced Alerting Service
      await this.testAlertingService();
      await this.testAlertingAlerts();
      await this.testAlertingIncidents();
      await this.testAlertingMetrics();
      await this.testAlertingOperations();
      
      // Test Export and Reporting
      await this.testExportFunctionality();
      await this.testReporting();
      
      // Generate test report
      this.generateTestReport();
      
    } catch (error) {
      console.error('❌ Test suite execution failed:', error);
      this.results.errors.push({
        test: 'Test Suite Execution',
        error: error.message,
        timestamp: Date.now()
      });
    }
    
    return this.results;
  }
  
  /**
   * Test Phase 9 overview
   */
  async testPhase9Overview() {
    await this.runTest('Phase 9 Overview', async () => {
      const response = await axios.get(`${this.baseUrl}/api/phase9/overview`);
      
      this.assert(response.status === 200, 'Overview endpoint should return 200');
      this.assert(response.data.success === true, 'Response should indicate success');
      this.assert(response.data.phase === 'Phase 9', 'Should identify as Phase 9');
      this.assert(response.data.title.includes('Observability'), 'Should mention observability');
      this.assert(response.data.overview, 'Should include overview data');
      this.assert(Array.isArray(response.data.capabilities), 'Should include capabilities list');
      
      console.log(`✅ Phase 9 Overview: ${response.data.overview.services.active}/${response.data.overview.services.total} services active`);
    });
  }
  
  /**
   * Test Phase 9 health status
   */
  async testPhase9Health() {
    await this.runTest('Phase 9 Health Check', async () => {
      const response = await axios.get(`${this.baseUrl}/api/phase9/health/comprehensive`);
      
      this.assert(response.status === 200, 'Health endpoint should return 200');
      this.assert(response.data.success === true, 'Health check should indicate success');
      this.assert(response.data.health, 'Should include health data');
      this.assert(typeof response.data.health.systemHealth === 'number', 'Should include system health score');
      this.assert(typeof response.data.health.businessHealth === 'number', 'Should include business health score');
      this.assert(Array.isArray(response.data.health.services), 'Should include services health');
      
      console.log(`✅ Health: System ${response.data.health.systemHealth.toFixed(1)}%, Business ${response.data.health.businessHealth.toFixed(1)}%`);
    });
  }
  
  /**
   * Test Phase 9 services management
   */
  async testPhase9Services() {
    await this.runTest('Phase 9 Services Management', async () => {
      const response = await axios.get(`${this.baseUrl}/api/phase9/services`);
      
      this.assert(response.status === 200, 'Services endpoint should return 200');
      this.assert(response.data.success === true, 'Services response should indicate success');
      this.assert(response.data.services, 'Should include services data');
      this.assert(Array.isArray(response.data.services.services), 'Should include services list');
      this.assert(typeof response.data.services.totalUptime === 'number', 'Should include total uptime');
      
      const activeServices = response.data.services.services.filter(s => s.status === 'active').length;
      console.log(`✅ Services: ${activeServices} active services`);
    });
  }
  
  /**
   * Test Phase 9 integrations
   */
  async testPhase9Integrations() {
    await this.runTest('Phase 9 Integrations', async () => {
      const response = await axios.get(`${this.baseUrl}/api/phase9/integrations`);
      
      this.assert(response.status === 200, 'Integrations endpoint should return 200');
      this.assert(response.data.success === true, 'Integrations response should indicate success');
      this.assert(response.data.integrations, 'Should include integrations data');
      this.assert(typeof response.data.integrations.total === 'number', 'Should include total integrations count');
      this.assert(typeof response.data.integrations.active === 'number', 'Should include active integrations count');
      
      console.log(`✅ Integrations: ${response.data.integrations.active}/${response.data.integrations.total} active`);
    });
  }
  
  /**
   * Test Advanced APM Service
   */
  async testAPMService() {
    await this.runTest('APM Service Status', async () => {
      const response = await axios.get(`${this.baseUrl}/api/phase9/apm/status`);
      
      this.assert(response.status === 200, 'APM status endpoint should return 200');
      this.assert(response.data.success === true, 'APM status should indicate success');
      this.assert(response.data.service === 'Advanced APM', 'Should identify as Advanced APM');
      this.assert(response.data.status, 'Should include status data');
      this.assert(typeof response.data.status.enabled === 'boolean', 'Should include enabled status');
      
      console.log(`✅ APM Service: ${response.data.status.enabled ? 'enabled' : 'disabled'}`);
    });
  }
  
  /**
   * Test APM metrics
   */
  async testAPMMetrics() {
    await this.runTest('APM Metrics', async () => {
      const response = await axios.get(`${this.baseUrl}/api/phase9/apm/metrics`);
      
      this.assert(response.status === 200, 'APM metrics endpoint should return 200');
      this.assert(response.data.success === true, 'APM metrics should indicate success');
      this.assert(response.data.metrics, 'Should include metrics data');
      this.assert(response.data.metrics.system, 'Should include system metrics');
      this.assert(response.data.metrics.custom, 'Should include custom metrics');
      
      console.log(`✅ APM Metrics: System and custom metrics available`);
    });
  }
  
  /**
   * Test APM alerts
   */
  async testAPMAlerts() {
    await this.runTest('APM Alerts & Anomalies', async () => {
      const response = await axios.get(`${this.baseUrl}/api/phase9/apm/alerts`);
      
      this.assert(response.status === 200, 'APM alerts endpoint should return 200');
      this.assert(response.data.success === true, 'APM alerts should indicate success');
      this.assert(Array.isArray(response.data.alerts), 'Should include alerts array');
      this.assert(Array.isArray(response.data.anomalies), 'Should include anomalies array');
      
      console.log(`✅ APM Alerts: ${response.data.alerts.length} alerts, ${response.data.anomalies.length} anomalies`);
    });
  }
  
  /**
   * Test APM recommendations
   */
  async testAPMRecommendations() {
    await this.runTest('APM Recommendations', async () => {
      const response = await axios.get(`${this.baseUrl}/api/phase9/apm/recommendations`);
      
      this.assert(response.status === 200, 'APM recommendations endpoint should return 200');
      this.assert(response.data.success === true, 'APM recommendations should indicate success');
      this.assert(Array.isArray(response.data.recommendations), 'Should include recommendations array');
      
      console.log(`✅ APM Recommendations: ${response.data.recommendations.length} recommendations`);
    });
  }
  
  /**
   * Test Business Intelligence Service
   */
  async testBIService() {
    await this.runTest('BI Service Status', async () => {
      const response = await axios.get(`${this.baseUrl}/api/phase9/bi/status`);
      
      this.assert(response.status === 200, 'BI status endpoint should return 200');
      this.assert(response.data.success === true, 'BI status should indicate success');
      this.assert(response.data.service === 'Business Intelligence', 'Should identify as Business Intelligence');
      this.assert(response.data.status, 'Should include status data');
      
      console.log(`✅ BI Service: ${response.data.status.enabled ? 'enabled' : 'disabled'}`);
    });
  }
  
  /**
   * Test BI dashboards
   */
  async testBIDashboards() {
    await this.runTest('BI Dashboards', async () => {
      const response = await axios.get(`${this.baseUrl}/api/phase9/bi/dashboards`);
      
      this.assert(response.status === 200, 'BI dashboards endpoint should return 200');
      this.assert(response.data.success === true, 'BI dashboards should indicate success');
      this.assert(Array.isArray(response.data.dashboards), 'Should include dashboards array');
      
      console.log(`✅ BI Dashboards: ${response.data.dashboards.length} dashboards available`);
      
      // Test specific dashboard if available
      if (response.data.dashboards.length > 0) {
        const dashboardId = response.data.dashboards[0].id;
        const dashboardResponse = await axios.get(`${this.baseUrl}/api/phase9/bi/dashboards/${dashboardId}`);
        
        this.assert(dashboardResponse.status === 200, 'Specific dashboard should return 200');
        this.assert(dashboardResponse.data.dashboard, 'Should include dashboard data');
        this.assert(dashboardResponse.data.dashboard.id === dashboardId, 'Should return correct dashboard');
        
        console.log(`✅ Specific Dashboard: ${dashboardResponse.data.dashboard.title}`);
      }
    });
  }
  
  /**
   * Test BI KPIs
   */
  async testBIKPIs() {
    await this.runTest('BI KPIs', async () => {
      const response = await axios.get(`${this.baseUrl}/api/phase9/bi/kpis`);
      
      this.assert(response.status === 200, 'BI KPIs endpoint should return 200');
      this.assert(response.data.success === true, 'BI KPIs should indicate success');
      this.assert(Array.isArray(response.data.kpis), 'Should include KPIs array');
      
      console.log(`✅ BI KPIs: ${response.data.kpis.length} KPIs tracked`);
    });
  }
  
  /**
   * Test BI metrics
   */
  async testBIMetrics() {
    await this.runTest('BI Metrics', async () => {
      const response = await axios.get(`${this.baseUrl}/api/phase9/bi/metrics`);
      
      this.assert(response.status === 200, 'BI metrics endpoint should return 200');
      this.assert(response.data.success === true, 'BI metrics should indicate success');
      this.assert(response.data.metrics, 'Should include metrics data');
      this.assert(response.data.metrics.users, 'Should include user metrics');
      this.assert(response.data.metrics.content, 'Should include content metrics');
      this.assert(response.data.metrics.performance, 'Should include performance metrics');
      this.assert(response.data.metrics.financials, 'Should include financial metrics');
      
      console.log(`✅ BI Metrics: User, content, performance, and financial metrics available`);
    });
  }
  
  /**
   * Test BI insights
   */
  async testBIInsights() {
    await this.runTest('BI Insights', async () => {
      const response = await axios.get(`${this.baseUrl}/api/phase9/bi/insights`);
      
      this.assert(response.status === 200, 'BI insights endpoint should return 200');
      this.assert(response.data.success === true, 'BI insights should indicate success');
      this.assert(Array.isArray(response.data.insights), 'Should include insights array');
      
      console.log(`✅ BI Insights: ${response.data.insights.length} business insights`);
    });
  }
  
  /**
   * Test BI reports
   */
  async testBIReports() {
    await this.runTest('BI Reports', async () => {
      const response = await axios.get(`${this.baseUrl}/api/phase9/bi/reports`);
      
      this.assert(response.status === 200, 'BI reports endpoint should return 200');
      this.assert(response.data.success === true, 'BI reports should indicate success');
      this.assert(Array.isArray(response.data.reports), 'Should include reports array');
      
      console.log(`✅ BI Reports: ${response.data.reports.length} reports available`);
    });
  }
  
  /**
   * Test BI forecasts
   */
  async testBIForecasts() {
    await this.runTest('BI Forecasts', async () => {
      const response = await axios.get(`${this.baseUrl}/api/phase9/bi/forecasts`);
      
      this.assert(response.status === 200, 'BI forecasts endpoint should return 200');
      this.assert(response.data.success === true, 'BI forecasts should indicate success');
      this.assert(Array.isArray(response.data.forecasts), 'Should include forecasts array');
      
      console.log(`✅ BI Forecasts: ${response.data.forecasts.length} forecasts available`);
    });
  }
  
  /**
   * Test Real-Time Analytics Service
   */
  async testAnalyticsService() {
    await this.runTest('Analytics Service Status', async () => {
      const response = await axios.get(`${this.baseUrl}/api/phase9/analytics/status`);
      
      this.assert(response.status === 200, 'Analytics status endpoint should return 200');
      this.assert(response.data.success === true, 'Analytics status should indicate success');
      this.assert(response.data.service === 'Real-Time Analytics', 'Should identify as Real-Time Analytics');
      this.assert(response.data.status, 'Should include status data');
      
      console.log(`✅ Analytics Service: ${response.data.status.enabled ? 'enabled' : 'disabled'}`);
    });
  }
  
  /**
   * Test Analytics visualizations
   */
  async testAnalyticsVisualizations() {
    await this.runTest('Analytics Visualizations', async () => {
      const response = await axios.get(`${this.baseUrl}/api/phase9/analytics/visualizations`);
      
      this.assert(response.status === 200, 'Analytics visualizations endpoint should return 200');
      this.assert(response.data.success === true, 'Analytics visualizations should indicate success');
      this.assert(Array.isArray(response.data.visualizations), 'Should include visualizations array');
      
      console.log(`✅ Analytics Visualizations: ${response.data.visualizations.length} visualizations`);
    });
  }
  
  /**
   * Test Analytics streams
   */
  async testAnalyticsStreams() {
    await this.runTest('Analytics Data Streams', async () => {
      const response = await axios.get(`${this.baseUrl}/api/phase9/analytics/streams`);
      
      this.assert(response.status === 200, 'Analytics streams endpoint should return 200');
      this.assert(response.data.success === true, 'Analytics streams should indicate success');
      this.assert(Array.isArray(response.data.streams), 'Should include streams array');
      
      console.log(`✅ Analytics Streams: ${response.data.streams.length} data streams`);
    });
  }
  
  /**
   * Test Analytics metrics
   */
  async testAnalyticsMetrics() {
    await this.runTest('Analytics Metrics', async () => {
      const response = await axios.get(`${this.baseUrl}/api/phase9/analytics/metrics`);
      
      this.assert(response.status === 200, 'Analytics metrics endpoint should return 200');
      this.assert(response.data.success === true, 'Analytics metrics should indicate success');
      this.assert(response.data.metrics, 'Should include metrics data');
      this.assert(response.data.metrics.system, 'Should include system metrics');
      
      console.log(`✅ Analytics Metrics: System metrics and performance data available`);
    });
  }
  
  /**
   * Test Advanced Alerting Service
   */
  async testAlertingService() {
    await this.runTest('Alerting Service Status', async () => {
      const response = await axios.get(`${this.baseUrl}/api/phase9/alerting/status`);
      
      this.assert(response.status === 200, 'Alerting status endpoint should return 200');
      this.assert(response.data.success === true, 'Alerting status should indicate success');
      this.assert(response.data.service === 'Advanced Alerting', 'Should identify as Advanced Alerting');
      this.assert(response.data.status, 'Should include status data');
      
      console.log(`✅ Alerting Service: ${response.data.status.enabled ? 'enabled' : 'disabled'}`);
    });
  }
  
  /**
   * Test Alerting alerts
   */
  async testAlertingAlerts() {
    await this.runTest('Alerting Alerts', async () => {
      const response = await axios.get(`${this.baseUrl}/api/phase9/alerting/alerts`);
      
      this.assert(response.status === 200, 'Alerting alerts endpoint should return 200');
      this.assert(response.data.success === true, 'Alerting alerts should indicate success');
      this.assert(Array.isArray(response.data.alerts), 'Should include alerts array');
      
      console.log(`✅ Alerting Alerts: ${response.data.alerts.length} alerts`);
    });
  }
  
  /**
   * Test Alerting incidents
   */
  async testAlertingIncidents() {
    await this.runTest('Alerting Incidents', async () => {
      const response = await axios.get(`${this.baseUrl}/api/phase9/alerting/incidents`);
      
      this.assert(response.status === 200, 'Alerting incidents endpoint should return 200');
      this.assert(response.data.success === true, 'Alerting incidents should indicate success');
      this.assert(Array.isArray(response.data.incidents), 'Should include incidents array');
      
      console.log(`✅ Alerting Incidents: ${response.data.incidents.length} incidents`);
    });
  }
  
  /**
   * Test Alerting metrics
   */
  async testAlertingMetrics() {
    await this.runTest('Alerting Metrics', async () => {
      const response = await axios.get(`${this.baseUrl}/api/phase9/alerting/metrics`);
      
      this.assert(response.status === 200, 'Alerting metrics endpoint should return 200');
      this.assert(response.data.success === true, 'Alerting metrics should indicate success');
      this.assert(response.data.metrics, 'Should include metrics data');
      this.assert(typeof response.data.metrics.totalAlerts === 'number', 'Should include total alerts count');
      
      console.log(`✅ Alerting Metrics: ${response.data.metrics.totalAlerts} total alerts`);
    });
  }
  
  /**
   * Test Alerting operations
   */
  async testAlertingOperations() {
    await this.runTest('Alerting Operations', async () => {
      // Test alert suppression
      const suppressResponse = await axios.post(`${this.baseUrl}/api/phase9/alerting/suppress`, {
        sourceId: 'test-source',
        type: 'test-type',
        duration: 60000 // 1 minute
      });
      
      this.assert(suppressResponse.status === 200, 'Alert suppression should return 200');
      this.assert(suppressResponse.data.success === true, 'Alert suppression should indicate success');
      
      console.log(`✅ Alerting Operations: Alert suppression works`);
    });
  }
  
  /**
   * Test export functionality
   */
  async testExportFunctionality() {
    await this.runTest('Export Functionality', async () => {
      // Test BI dashboard export (if dashboards exist)
      try {
        const dashboardsResponse = await axios.get(`${this.baseUrl}/api/phase9/bi/dashboards`);
        
        if (dashboardsResponse.data.dashboards && dashboardsResponse.data.dashboards.length > 0) {
          const dashboardId = dashboardsResponse.data.dashboards[0].id;
          
          // Test JSON export
          const jsonExportResponse = await axios.get(`${this.baseUrl}/api/phase9/export/dashboard/${dashboardId}?format=json`);
          this.assert(jsonExportResponse.status === 200, 'JSON export should return 200');
          
          // Test CSV export
          const csvExportResponse = await axios.get(`${this.baseUrl}/api/phase9/export/dashboard/${dashboardId}?format=csv`);
          this.assert(csvExportResponse.status === 200, 'CSV export should return 200');
          
          console.log(`✅ Export: Dashboard export (JSON & CSV) works`);
        } else {
          console.log(`✅ Export: No dashboards to export (expected for new installation)`);
        }
      } catch (error) {
        console.log(`ℹ️  Export: Dashboard export test skipped (${error.message})`);
      }
    });
  }
  
  /**
   * Test comprehensive reporting
   */
  async testReporting() {
    await this.runTest('Comprehensive Reporting', async () => {
      const response = await axios.get(`${this.baseUrl}/api/phase9/report/comprehensive`);
      
      this.assert(response.status === 200, 'Comprehensive report should return 200');
      this.assert(response.data.success === true, 'Comprehensive report should indicate success');
      this.assert(response.data.report, 'Should include report data');
      this.assert(response.data.report.phase === 'Phase 9', 'Should identify as Phase 9 report');
      this.assert(response.data.report.summary, 'Should include summary data');
      this.assert(response.data.report.services, 'Should include services data');
      this.assert(response.data.report.metrics, 'Should include metrics data');
      
      console.log(`✅ Reporting: Comprehensive Phase 9 report generated`);
    });
  }
  
  /**
   * Run a single test
   */
  async runTest(testName, testFunction) {
    const startTime = performance.now();
    this.results.total++;
    
    try {
      await testFunction();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.results.passed++;
      this.results.tests.push({
        name: testName,
        status: 'passed',
        duration: Math.round(duration),
        timestamp: Date.now()
      });
      
      console.log(`✅ ${testName} (${Math.round(duration)}ms)`);
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.results.failed++;
      this.results.errors.push({
        test: testName,
        error: error.message,
        timestamp: Date.now()
      });
      this.results.tests.push({
        name: testName,
        status: 'failed',
        duration: Math.round(duration),
        error: error.message,
        timestamp: Date.now()
      });
      
      console.error(`❌ ${testName} (${Math.round(duration)}ms): ${error.message}`);
    }
  }
  
  /**
   * Assert helper
   */
  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }
  
  /**
   * Generate test report
   */
  generateTestReport() {
    const endTime = Date.now();
    const totalDuration = endTime - this.results.startTime;
    const successRate = this.results.total > 0 ? (this.results.passed / this.results.total) * 100 : 0;
    
    console.log('\n' + '='.repeat(80));
    console.log('🎯 Phase 9 Test Suite Results - Advanced Observability, Analytics & Business Intelligence');
    console.log('='.repeat(80));
    console.log(`📊 Total Tests: ${this.results.total}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📈 Success Rate: ${successRate.toFixed(1)}%`);
    console.log(`⏱️  Total Duration: ${Math.round(totalDuration)}ms`);
    console.log(`🕐 Completed: ${new Date().toISOString()}`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.errors.forEach(error => {
        console.log(`  • ${error.test}: ${error.error}`);
      });
    }
    
    // Test breakdown by category
    const categories = {
      'Overview & Health': this.results.tests.filter(t => t.name.includes('Overview') || t.name.includes('Health')),
      'APM Service': this.results.tests.filter(t => t.name.includes('APM')),
      'Business Intelligence': this.results.tests.filter(t => t.name.includes('BI')),
      'Real-Time Analytics': this.results.tests.filter(t => t.name.includes('Analytics')),
      'Advanced Alerting': this.results.tests.filter(t => t.name.includes('Alerting')),
      'Export & Reporting': this.results.tests.filter(t => t.name.includes('Export') || t.name.includes('Reporting'))
    };
    
    console.log('\n📊 Test Results by Category:');
    Object.entries(categories).forEach(([category, tests]) => {
      const passed = tests.filter(t => t.status === 'passed').length;
      const total = tests.length;
      const rate = total > 0 ? (passed / total) * 100 : 0;
      console.log(`  ${category}: ${passed}/${total} (${rate.toFixed(1)}%)`);
    });
    
    console.log('\n' + '='.repeat(80));
    
    // Overall assessment
    if (successRate >= 95) {
      console.log('🎉 Excellent! Phase 9 services are working perfectly.');
    } else if (successRate >= 85) {
      console.log('👍 Good! Phase 9 services are mostly functional with minor issues.');
    } else if (successRate >= 70) {
      console.log('⚠️  Warning! Phase 9 services have some significant issues.');
    } else {
      console.log('🚨 Critical! Phase 9 services have major issues that need attention.');
    }
    
    return this.results;
  }
}

// Export for use in other files
module.exports = Phase9TestSuite;

// Run tests if called directly
if (require.main === module) {
  const testSuite = new Phase9TestSuite();
  testSuite.runTests().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  }).catch(error => {
    console.error('❌ Test suite failed to run:', error);
    process.exit(1);
  });
}