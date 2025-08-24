"use strict";
const rateLimit = require("express-rate-limit");
module.exports = function createRateLimiter() {
  return rateLimit({
    windowMs: 60_000,
    max: Number(process.env.RATE_LIMIT_MAX || 120),
    standardHeaders: true,
    legacyHeaders: false
  });
};