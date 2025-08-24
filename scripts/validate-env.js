#!/usr/bin/env node
/**
 * Simple CLI wrapper to validate env (mirrors startup path)
 * Enhanced to use centralized validation schema
 */
const { ENV, schema } = require('../src/config/env');

function maskSensitiveValue(key, value) {
  if (!value) return '(unset)';
  
  // Ensure value is a string
  const stringValue = String(value);
  
  const sensitiveKeys = [
    'SECRET', 'KEY', 'TOKEN', 'PASSWORD', 'DSN', 'URI'
  ];
  
  const isSensitive = sensitiveKeys.some(keyword => key.includes(keyword));
  if (isSensitive && stringValue.length > 10) {
    return stringValue.slice(0, 8) + '...' + stringValue.slice(-4);
  }
  
  return stringValue.length > 60 ? stringValue.slice(0, 27) + '...' + stringValue.slice(-10) : stringValue;
}

console.log('✅ Environment validation completed. Summary:');
console.log(''.padEnd(70, '='));

// Group by category
const categories = {
  'Core & Security': ['NODE_ENV', 'PORT', 'JWT_SECRET', 'SESSION_SECRET', 'ENCRYPTION_KEY'],
  'Database': ['MONGODB_URI', 'MONGODB_DATABASE', 'REDIS_URL', 'REDIS_PASSWORD', 'SQLITE_DB_PATH'],
  'Spotify API': ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET', 'SPOTIFY_REDIRECT_URI'],
  'AI Providers': ['OPENAI_API_KEY', 'GOOGLE_AI_API_KEY', 'GEMINI_API_KEY', 'ANTHROPIC_API_KEY', 'PERPLEXITY_API_KEY', 'OPENROUTER_API_KEY', 'XAI_API_KEY'],
  'Optional Services': ['AGENTOPS_API_KEY', 'SENTRY_DSN', 'BROWSERBASE_API_KEY', 'BRAVE_API_KEY'],
  'Web & CORS': ['FRONTEND_URL', 'DOMAIN', 'ALLOWED_ORIGINS'],
  'MCP & Automation': ['MCP_PORT', 'MCP_SERVER_NAME']
};

for (const [category, keys] of Object.entries(categories)) {
  console.log(`\n📋 ${category}:`);
  keys.forEach(key => {
    if (schema[key]) {
      const val = ENV[key];
      const spec = schema[key];
      const display = maskSensitiveValue(key, val);
      const status = spec.required ? (val ? '✅' : '❌') : (val ? '✅' : '⚪');
      const required = spec.required ? 'REQUIRED' : 'optional';
      console.log(`  ${status} ${key.padEnd(24)} :: ${display.padEnd(20)} (${required})`);
    }
  });
}

console.log('\n' + ''.padEnd(70, '='));
console.log('Legend: ✅ Set  ❌ Missing (required)  ⚪ Not set (optional)');