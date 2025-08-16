#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

(async () => {
  try {
    if (!process.env.PERPLEXITY_API_KEY) {
      console.log('⚠️ PERPLEXITY_API_KEY not set; skipping roadmap refresh');
      process.exit(0);
    }

    const Executor = require('../prompts/tools/executor');
    const executor = new Executor();

    function summarizeDir(dir, max = 20) {
      try {
        return fs.readdirSync(dir).slice(0, max);
      } catch { return []; }
    }

    const summary = {
      tech: 'Node.js + React + MCP servers (Perplexity, Filesystem, etc.), Vite, Jest, Redis, MongoDB',
      keyDirs: {
        src: summarizeDir(path.join(process.cwd(), 'src')),
        scripts: summarizeDir(path.join(process.cwd(), 'scripts')),
        mcpServers: summarizeDir(path.join(process.cwd(), 'mcp-servers'))
      },
      mcp: 'Perplexity MCP configured in .cursor/mcp.json with brave-search workflow',
      prompts: 'Prompt catalog executor with Perplexity provider; new templates for research and ADR'
    };

    const repo_summary = JSON.stringify(summary, null, 2);
    const objectives = 'Update roadmap: Perplexity integration hardening, CI security scans, Cursor workflows, and architecture checks.';

    const result = await executor.execute('analysis/perplexity-repo-analysis', { repo_summary, objectives });

    const outPath = path.join(process.cwd(), 'ROADMAP_AUTO.md');
    const content = `# EchoTune AI — Auto-Refreshed Roadmap\n\nGenerated: ${new Date().toISOString()}\n\n${result.content}\n`;
    fs.writeFileSync(outPath, content);
    console.log(`✅ Roadmap refreshed at ${outPath}`);
  } catch (err) {
    console.error('❌ Roadmap refresh failed:', err.message);
    process.exit(1);
  }
})();