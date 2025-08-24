'use strict';
const { v4: uuid } = require('uuid');
const { runWithContext } = require('../infra/observability/requestContext');
const logger = require('../infra/observability/logger');
module.exports = function requestIdMiddleware(req, res, next) { const existing = req.headers['x-request-id'] || req.headers['x-correlation-id']; const id = existing || uuid(); req.requestId = id; res.setHeader('x-request-id', id); runWithContext(id, () => { logger.debug({ requestId: id }, 'Request context initialized'); next(); }); };