#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { interval: 30, commit: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--interval') opts.interval = parseInt(args[++i], 10) || 30;
    if (a === '--commit') opts.commit = (args[++i] || 'false') === 'true';
  }
  return opts;
}

function safe(cmd) {
  try { return String(execSync(cmd)).trim(); } catch { return ''; }
}

function writeStatus() {
  const now = new Date().toISOString();
  const branch = safe('git branch --show-current');
  const lastCommit = safe('git log -1 --pretty=format:"%h %ad %s" --date=iso-strict') || 'n/a';
  const roadmapMtime = (() => {
    try { return fs.statSync('ROADMAP_AUTO.md').mtime.toISOString(); } catch { return 'n/a'; }
  })();
  const canaryReport = (() => {
    try {
      const data = JSON.parse(fs.readFileSync('perplexity-api-test-results.json', 'utf8')) || {};
      return data?.timestamp || 'n/a';
    } catch { return 'n/a'; }
  })();

  const content = `# Status Heartbeat\n\nUpdated: ${now}\n\n- Branch: ${branch}\n- Last commit: ${lastCommit}\n- Roadmap last updated: ${roadmapMtime}\n- Perplexity canary last run: ${canaryReport}\n\nNotes:\n- Roadmap auto-refresh runs via GitHub Actions nightly.\n- Perplexity canary monitors API health nightly.\n`;
  fs.writeFileSync('STATUS_HEARTBEAT.md', content);
}

async function main() {
  const { interval, commit } = parseArgs();
  // one immediate write
  writeStatus();
  if (commit) {
    safe('git add STATUS_HEARTBEAT.md');
    safe('git commit -m "chore(status): update heartbeat"');
    safe('git push');
  }
  // loop
  setInterval(() => {
    writeStatus();
  }, interval * 1000);
}

main().catch(err => {
  console.error('Heartbeat failed:', err.message);
  process.exit(1);
});