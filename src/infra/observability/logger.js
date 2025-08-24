'use strict';
/**
 * Structured logger (Pino) with environment‑aware formatting.
 */
const pino = require('pino');
const isProd = process.env.NODE_ENV === 'production';
const baseConfig = {
  level: process.env.LOG_LEVEL || 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.token',
      'token',
      'apiKey',
      'api_key',
      'secret'
    ],
    remove: true
  }
};
let transport = undefined;
if (!isProd) {
  try {
    transport = { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' } };
  } catch { /* optional */ }
}
const logger = pino({ ...baseConfig, transport });
module.exports = logger;