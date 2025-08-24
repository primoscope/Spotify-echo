'use strict';
const helmet = require('helmet');
module.exports = function applyHelmet(app) {
  // Basic Helmet without CSP (add CSP in later phase when asset map known)
  app.use(helmet({ contentSecurityPolicy: false }));
};