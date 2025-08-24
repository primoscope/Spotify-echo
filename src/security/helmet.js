'use strict';
const helmet = require('helmet');

module.exports = function applyHelmet(app) {
  const cspReportOnly = process.env.ENABLE_CSP_REPORT_ONLY === '1';
  
  if (cspReportOnly) {
    // Enable CSP in report-only mode
    app.use(helmet({
      contentSecurityPolicy: {
        reportOnly: true,
        directives: {
          defaultSrc: ['\'self\''],
          objectSrc: ['\'none\''],
          frameAncestors: ['\'none\''],
          baseUri: ['\'self\''],
          // Allow additional sources commonly needed
          scriptSrc: ['\'self\'', '\'unsafe-inline\''],
          styleSrc: ['\'self\'', '\'unsafe-inline\''],
          imgSrc: ['\'self\'', 'data:', 'https:'],
          fontSrc: ['\'self\''],
          connectSrc: ['\'self\'']
        }
      }
    }));
    
    console.log('🛡️ CSP enabled in report-only mode');
  } else {
    // Basic Helmet without CSP (existing behavior)
    app.use(helmet({ contentSecurityPolicy: false }));
  }
};