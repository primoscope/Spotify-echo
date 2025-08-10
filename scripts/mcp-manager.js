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
        log('→ Installing/updating npm packages in mcp-server');
        try {
          await execAsync('npm ci', { cwd: MCP_DIR });
        } catch (ciError) {
          log('→ npm ci failed, trying npm install...');
          await execAsync('npm install', { cwd: MCP_DIR });
        }
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
  // Check if server has required environment variables
  if (def.requiredEnv) {
    const missing = def.requiredEnv.filter(envVar => !process.env[envVar]);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

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

    // Check if server has required environment variables
    if (def.requiredEnv) {
      const missing = def.requiredEnv.filter(envVar => !process.env[envVar]);
      if (missing.length > 0) {
        log(`⚠️ ${name}: skipped (missing env vars: ${missing.join(', ')})`);
        continue;
      }
    }

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

    // Check if server has required environment variables
    if (def.requiredEnv) {
      const missing = def.requiredEnv.filter(envVar => !process.env[envVar]);
      if (missing.length > 0) {
        log(`⚠️ Smoke test skipped: ${name} (missing env vars: ${missing.join(', ')})`);
        continue;
      }
    }

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
  const reportData = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      cwd: ROOT
    },
    servers: {},
    files: {},
    summary: {
      totalServers: Object.keys(servers).length,
      availableServers: 0,
      skippedServers: 0,
      environmentIssues: []
    }
  };

  // List configured servers
  log('📋 Configured servers:');
  for (const [name, def] of Object.entries(servers)) {
    const envAvailable = def.requiredEnv ? 
      def.requiredEnv.every(env => process.env[env]) : true;
    const envStatus = def.requiredEnv ? 
      (envAvailable ? '🟢' : '🔴') : '⚪';
    const envInfo = def.requiredEnv ? ` (requires: ${def.requiredEnv.join(', ')})` : '';
    
    if (envAvailable) {
      reportData.summary.availableServers++;
    } else {
      reportData.summary.skippedServers++;
      if (def.requiredEnv) {
        const missing = def.requiredEnv.filter(env => !process.env[env]);
        reportData.summary.environmentIssues.push({
          server: name,
          missingEnvVars: missing
        });
      }
    }
    
    reportData.servers[name] = {
      command: def.command,
      args: def.args || [],
      port: def.port || 'n/a',
      requiredEnv: def.requiredEnv || [],
      envAvailable,
      status: envAvailable ? 'ready' : 'skipped'
    };
    
    log(`  ${envStatus} ${name}: ${def.command} ${(def.args||[]).join(' ')} (port ${def.port||'n/a'})${envInfo}`);
  }

  // Show presence of key files
  const files = [
    'mcp-server/health.js',
    'mcp-server/package.json',
    'mcp-registry.json',
    '.env.example',
    'docs/mcp-servers.md',
    'docs/MCP_INTEGRATION.md'
  ];
  log('\n📁 Key files:');
  for (const f of files) {
    const exists = fs.existsSync(path.join(ROOT, f));
    reportData.files[f] = exists;
    log(`  ${exists ? '✅' : '❌'} ${f}`);
  }

  // Environment status
  log('\n🌍 Environment status:');
  const envVars = ['NODE_ENV', 'BROWSERBASE_API_KEY', 'BROWSERBASE_PROJECT_ID'];
  for (const envVar of envVars) {
    const hasValue = !!process.env[envVar];
    const displayValue = hasValue ? (envVar.includes('KEY') || envVar.includes('SECRET') ? '[REDACTED]' : process.env[envVar]) : 'not set';
    log(`  ${hasValue ? '✅' : '⚪'} ${envVar}: ${displayValue}`);
  }

  // Generate artifacts if in CI or requested
  if (process.env.CI || process.env.GENERATE_ARTIFACTS) {
    try {
      const reportsDir = path.join(ROOT, 'reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }
      
      // Write JSON report
      const jsonReportPath = path.join(reportsDir, 'mcp-health.json');
      await fsp.writeFile(jsonReportPath, JSON.stringify(reportData, null, 2));
      log(`\n📄 JSON report saved: ${jsonReportPath}`);
      
      // Write markdown summary
      const markdownReport = generateMarkdownReport(reportData);
      const mdReportPath = path.join(reportsDir, 'mcp-health.md');
      await fsp.writeFile(mdReportPath, markdownReport);
      log(`📄 Markdown report saved: ${mdReportPath}`);
    } catch (e) {
      log(`⚠️ Could not save report artifacts: ${e.message}`);
    }
  }

  const duration = Date.now() - start;
  log(`\n⏱️ Report generated in ${duration}ms`);
  
  // Summary
  log(`\n📊 Summary:`);
  log(`  • Total servers configured: ${reportData.summary.totalServers}`);
  log(`  • Ready to start: ${reportData.summary.availableServers}`);
  log(`  • Skipped (missing env): ${reportData.summary.skippedServers}`);
  
  if (reportData.summary.environmentIssues.length > 0) {
    log(`\n⚠️ Environment issues:`);
    for (const issue of reportData.summary.environmentIssues) {
      log(`  • ${issue.server}: missing ${issue.missingEnvVars.join(', ')}`);
    }
  }
  
  return reportData;
}

function generateMarkdownReport(data) {
  const timestamp = new Date(data.timestamp).toLocaleString();
  
  return `# MCP Health Report

**Generated**: ${timestamp}
**Node.js**: ${data.environment.nodeVersion}
**Platform**: ${data.environment.platform}

## Server Status

| Server | Status | Port | Environment Requirements |
|--------|---------|------|-------------------------|
${Object.entries(data.servers).map(([name, info]) => {
  const status = info.envAvailable ? '✅ Ready' : '⚠️ Skipped';
  const envReqs = info.requiredEnv.length > 0 ? info.requiredEnv.join(', ') : 'None';
  return `| ${name} | ${status} | ${info.port} | ${envReqs} |`;
}).join('\n')}

## Summary

- **Total Servers**: ${data.summary.totalServers}
- **Ready to Start**: ${data.summary.availableServers}
- **Skipped (Missing Env)**: ${data.summary.skippedServers}

${data.summary.environmentIssues.length > 0 ? `
## Environment Issues

${data.summary.environmentIssues.map(issue => 
  `- **${issue.server}**: Missing environment variables: ${issue.missingEnvVars.join(', ')}`
).join('\n')}
` : ''}

## File Status

${Object.entries(data.files).map(([file, exists]) => 
  `- ${exists ? '✅' : '❌'} ${file}`
).join('\n')}

---
*Report generated by MCP Manager v1.0*
`;
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

module.exports = { 
  readServers,
  install,
  health,
  test,
  report,
  probeHealth,
  startServer,
  stopServer
};