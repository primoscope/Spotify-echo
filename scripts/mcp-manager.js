#!/usr/bin/env node

/**
 * MCP Server Manager (hardened)
 * - Discovers servers from mcp-server/package.json (servers block)
 * - Can install deps, start ephemeral servers, health-check, test, and report
 * - Uses curl -fsS for reliable health probing
 */

const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

const ROOT = process.cwd();
const MCP_DIR = path.join(ROOT, 'mcp-server');
const MCP_PKG = path.join(MCP_DIR, 'package.json');

function log(msg) { console.log(msg); }
function logH(msg) { console.log(`\n${msg}`); }

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function readServers() {
  let servers = {};
  try {
    const raw = await fsp.readFile(MCP_PKG, 'utf8');
    const pkg = JSON.parse(raw);
    servers = pkg.servers || {};
  } catch (e) {
    // no package or no servers block
  }
  return servers;
}

async function probeHealth(url, timeoutMs = 10000, intervalMs = 500) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await execAsync(`curl -fsS ${url}`);
      return true;
    } catch (_) {
      // not ready yet
    }
    await sleep(intervalMs);
  }
  return false;
}

async function install() {
  logH('📦 Installing MCP dependencies...');
  try {
    if (fs.existsSync(MCP_DIR)) {
      if (fs.existsSync(MCP_PKG)) {
        log('→ npm ci in mcp-server');
        await execAsync('npm ci', { cwd: MCP_DIR });
      }
      if (fs.existsSync(path.join(MCP_DIR, 'requirements.txt'))) {
        log('→ pip install -r requirements.txt in mcp-server');
        await execAsync('python3 -m pip install -r requirements.txt', { cwd: MCP_DIR });
      }
    } else {
      log('ℹ️ mcp-server directory not found, skipping');
    }
    log('✅ Install complete');
  } catch (e) {
    log(`⚠️ Install encountered issues: ${e.message}`);
  }
}

function startServer(name, def) {
  const port = def.port || process.env.MCP_PORT || 3001;
  const env = { ...process.env, ...(def.env || {}), MCP_PORT: String(port) };
  const cmd = def.command;
  const args = def.args || [];

  const child = spawn(cmd, args, {
    cwd: MCP_DIR,
    env,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  child.stdout.on('data', d => process.stdout.write(`[${name}] ${d}`));
  child.stderr.on('data', d => process.stderr.write(`[${name}] ${d}`));

  return { child, port };
}

async function stopServer(ps) {
  if (!ps) return;
  try {
    ps.child.kill('SIGTERM');
    // give it a moment
    await sleep(500);
    if (!ps.child.killed) ps.child.kill('SIGKILL');
  } catch (_) {}
}

async function health() {
  logH('🔍 MCP health check');
  const servers = await readServers();
  const names = Object.keys(servers);
  if (names.length === 0) {
    log('ℹ️ No servers configured in mcp-server/package.json (servers block).');
    return;
  }

  for (const name of names) {
    const def = servers[name];
    const url = `http://localhost:${def.port || 3001}${def.healthPath || '/health'}`;
    log(`→ ${name} @ ${url}`);

    let ps;
    try {
      ps = startServer(name, def);
      const ok = await probeHealth(url, 15000, 500);
      if (ok) log(`✅ ${name}: healthy`); else log(`❌ ${name}: no response`);
    } catch (e) {
      log(`❌ ${name}: error ${e.message}`);
    } finally {
      await stopServer(ps);
    }
  }
}

async function test() {
  logH('🧪 MCP smoke tests');
  let success = true;
  const servers = await readServers();
  const names = Object.keys(servers);
  for (const name of names) {
    const def = servers[name];
    const url = `http://localhost:${def.port || 3001}${def.healthPath || '/health'}`;
    let ps;
    try {
      ps = startServer(name, def);
      const ok = await probeHealth(url, 20000, 500);
      if (!ok) {
        log(`❌ Smoke test failed: ${name} did not respond at ${url}`);
        success = false;
      } else {
        log(`✅ Smoke test passed: ${name}`);
      }
    } catch (e) {
      success = false;
      log(`❌ Smoke test error: ${name} ${e.message}`);
    } finally {
      await stopServer(ps);
    }
  }
  if (!success) process.exit(1);
}

async function report() {
  logH('📊 MCP status report');
  const start = Date.now();
  const servers = await readServers();

  // List configured servers
  log('📋 Configured servers:');
  for (const [name, def] of Object.entries(servers)) {
    log(`  - ${name}: ${def.command} ${(def.args||[]).join(' ')} (port ${def.port||'n/a'})`);
  }

  // Show presence of key files
  const files = [
    'mcp-server/health.js',
    'mcp-server/package.json'
  ];
  log('\n📁 Key files:');
  for (const f of files) log(`  ${fs.existsSync(path.join(ROOT, f)) ? '✅' : '❌'} ${f}`);

  log(`\n⏱️ Report generated in ${Date.now() - start}ms`);
}

async function main() {
  const cmd = process.argv[2] || 'help';
  if (cmd === 'install') return install();
  if (cmd === 'health') return health();
  if (cmd === 'test') return test();
  if (cmd === 'report') return report();

  console.log(`
🤖 EchoTune AI - MCP Server Manager

Commands:
  install   Install dependencies (Node/Python) for mcp-server
  health    Start each configured server and probe /health
  test      Run smoke tests (ephemeral start + probe)
  report    Print configuration and presence checks

Examples:
  node scripts/mcp-manager.js install
  node scripts/mcp-manager.js health
  node scripts/mcp-manager.js test
  node scripts/mcp-manager.js report
`);
}

if (require.main === module) {
  main().catch(err => { console.error('❌', err.message); process.exit(1); });
}

module.exports = { readServers };