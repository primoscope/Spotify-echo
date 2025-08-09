#!/usr/bin/env node
/** Simple env validator that does not print secret values. */
const REQUIRED = [
  // Only warn for now to avoid blocking contributors without full setup
  'SPOTIFY_CLIENT_ID',
  'SPOTIFY_CLIENT_SECRET',
  'MONGODB_URI'
];

let missing = [];
for (const k of REQUIRED) {
  if (!process.env[k]) missing.push(k);
}

if (missing.length) {
  console.warn('⚠️ Missing env vars (warning only):', missing.join(', '));
  process.exit(0);
}
console.log('✅ Env looks ok');