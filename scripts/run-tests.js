#!/usr/bin/env node
/**
 * Minimal test runner to avoid Jest dependency.
 * - Starts MCP health server via mcp-manager test flow
 * - Validates response-formatter outputs
 */
const assert = require('assert');
const { spawn } = require('child_process');

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', ...opts });
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} -> ${code}`))));
  });
}

(async () => {
  // 1) MCP smoke
  await run('node', ['scripts/mcp-manager.js', 'test']);

  // 2) response-formatter quick checks
  const fmt = require('../src/api/utils/response-formatter');
  const ok = fmt.success({ a: 1 });
  assert.strictEqual(ok.ok, true);
  assert.deepStrictEqual(ok.data, { a: 1 });
  const err = fmt.error('oops', 'ERR_OOPS');
  assert.strictEqual(err.ok, false);
  assert.strictEqual(err.error.code, 'ERR_OOPS');

  console.log('✅ All tests passed');
})().catch((e) => { console.error(e.message); process.exit(1); });