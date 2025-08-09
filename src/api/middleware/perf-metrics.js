const performanceMonitor = require('../monitoring/performance-monitor');

function perfTracker() {
  return performanceMonitor.requestTracker();
}

function perfReportHandler() {
  return (_req, res) => {
    const report = performanceMonitor.getPerformanceReport();
    res.status(200).json(report);
  };
}

module.exports = { perfTracker, perfReportHandler };