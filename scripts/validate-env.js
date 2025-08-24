#!/usr/bin/env node
/**
 * Enhanced environment validation with severity levels
 * Supports --warn-only flag for production deployment
 */
const { ENV, schema, validate } = require('../src/config/env');

// Parse command line arguments
const args = process.argv.slice(2);
const warnOnly = args.includes('--warn-only');
const verbose = args.includes('--verbose');

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

// Enhanced validation with severity levels
function validateWithSeverity() {
  const errors = [];
  const warnings = [];
  const info = [];
  
  // Critical variables (cause startup failure)
  const critical = ['MONGODB_URI', 'JWT_SECRET'];
  
  // Important variables (warn but don't fail)
  const important = ['SESSION_SECRET', 'REDIS_URL', 'NODE_ENV'];
  
  for (const [key, spec] of Object.entries(schema)) {
    const value = ENV[key];
    const isCritical = critical.includes(key);
    const isImportant = important.includes(key);
    
    if (spec.required && (!value || value === '')) {
      if (isCritical) {
        errors.push(`❌ CRITICAL: Missing required variable ${key}${spec.desc ? ' (' + spec.desc + ')' : ''}`);
      } else if (isImportant) {
        warnings.push(`⚠️  IMPORTANT: Missing recommended variable ${key}${spec.desc ? ' (' + spec.desc + ')' : ''}`);
      } else {
        warnings.push(`⚪ OPTIONAL: Missing variable ${key}${spec.desc ? ' (' + spec.desc + ')' : ''}`);
      }
    } else if (value && spec.allowed && !spec.allowed.includes(value)) {
      warnings.push(`⚠️  Invalid value for ${key}. Allowed: ${spec.allowed.join(', ')}, got: ${value}`);
    } else if (value && spec.length && value.length !== spec.length) {
      warnings.push(`⚠️  Invalid length for ${key}. Expected length ${spec.length}, got ${value.length}`);
    } else if (value) {
      info.push(`✅ ${key} is properly configured`);
    }
  }
  
  return { errors, warnings, info };
}

const { errors, warnings, info } = validateWithSeverity();

console.log('🔍 Environment Validation Report');
console.log(''.padEnd(70, '='));

if (warnOnly) {
  console.log('📋 Mode: WARN-ONLY (no exit on errors for deployment)');
} else {
  console.log('📋 Mode: STRICT (exit on critical errors)');
}

console.log(`📊 Variables checked: ${Object.keys(schema).length}`);
console.log('');

// Display results
if (errors.length > 0) {
  console.log('💥 CRITICAL ERRORS:');
  errors.forEach(error => console.log(`  ${error}`));
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  WARNINGS:');
  warnings.forEach(warning => console.log(`  ${warning}`));
  console.log('');
}

if (verbose && info.length > 0) {
  console.log('✅ CONFIGURED:');
  info.forEach(item => console.log(`  ${item}`));
  console.log('');
}

console.log('✅ Environment validation completed. Summary:');
console.log(''.padEnd(70, '='));

// Group by category
const categories = {
  'Core & Security': ['NODE_ENV', 'PORT', 'JWT_SECRET', 'SESSION_SECRET', 'ENCRYPTION_KEY'],
  'Database': ['MONGODB_URI', 'MONGODB_DATABASE', 'REDIS_URL', 'REDIS_PASSWORD', 'SQLITE_DB_PATH'],
  'Spotify API': ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET', 'SPOTIFY_REDIRECT_URI'],
  'AI Providers': ['OPENAI_API_KEY', 'GOOGLE_AI_API_KEY', 'GEMINI_API_KEY', 'ANTHROPIC_API_KEY', 'PERPLEXITY_API_KEY', 'OPENROUTER_API_KEY', 'XAI_API_KEY'],
  'Feature Flags': ['DISABLE_REALTIME', 'ENABLE_TRACING', 'ENABLE_AGENTOPS', 'ENABLE_ANALYTICS_DASHBOARD', 'ENABLE_DEMO_ROUTES'],
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

// Exit with appropriate code
if (errors.length > 0 && !warnOnly) {
  console.log('\n❌ Environment validation FAILED');
  console.log('💡 Use --warn-only flag to suppress errors for deployment');
  process.exit(1);
} else if (errors.length > 0 && warnOnly) {
  console.log('\n⚠️  Environment validation completed with ERRORS (warn-only mode)');
  process.exit(0);
} else if (warnings.length > 0) {
  console.log('\n⚠️  Environment validation completed with WARNINGS');
  process.exit(0);
} else {
  console.log('\n✅ Environment validation PASSED');
  process.exit(0);
}