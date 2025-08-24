"use strict";
/**
 * Validates required environment variables at startup.
 * Extend REQUIRED as new dependencies are added (DB, external APIs, etc.).
 */
const REQUIRED = [
  // "DATABASE_URL",
  // "REDIS_URL",
  // "API_KEY_SERVICE"
];
function validateEnv(logger) {
  const missing = REQUIRED.filter(k => !process.env[k]);
  if (missing.length) {
    logger.error({ missing }, "Missing required environment variables");
    // Fail fast: change to warning if project prefers soft validation.
    if (process.env.ENV_VALIDATE_STRICT !== "false") {
      throw new Error("Startup aborted due to missing env vars.");
    }
  }
  logger.info({ checked: REQUIRED.length }, "Environment variable validation complete");
}
module.exports = { validateEnv, REQUIRED };