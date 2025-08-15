#!/usr/bin/env node

/**
 * Redis URL Fixer - Addresses password encoding issues
 */

const originalRedisURL = 'redis://copilot:DapperMan77$$@redis-15489.c238.us-central1-2.gce.redns.redis-cloud.com:15489';

// URL encode the password to handle special characters
const fixedRedisURL1 = 'redis://copilot:DapperMan77%24%24@redis-15489.c238.us-central1-2.gce.redns.redis-cloud.com:15489';

// Alternative format without username
const fixedRedisURL2 = 'redis://:DapperMan77%24%24@redis-15489.c238.us-central1-2.gce.redns.redis-cloud.com:15489';

// Alternative format with simple password (if user needs to update Redis)
const simpleRedisURL = 'redis://copilot:DapperMan77@redis-15489.c238.us-central1-2.gce.redns.redis-cloud.com:15489';

console.log('🔴 Redis URL Fixes:');
console.log('\n1. Original (has encoding issues):');
console.log(originalRedisURL);
console.log('\n2. Fixed with URL encoding (try first):');
console.log(fixedRedisURL1);
console.log('\n3. Alternative format (try if #2 fails):');
console.log(fixedRedisURL2);
console.log('\n4. If you can change Redis password to simple format:');
console.log(simpleRedisURL);

console.log('\n📋 Instructions:');
console.log('1. Try fixed URL #2 first in GitHub Secrets');
console.log('2. If still fails, log into Redis Cloud and simplify password');
console.log('3. Update REDIS_URI secret with working format');