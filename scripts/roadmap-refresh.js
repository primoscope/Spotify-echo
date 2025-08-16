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
      mcp: 'Perplexity MCP in .cursor/mcp.json with brave-search; workflows for browser research and PR deep-dive',
      prompts: 'Prompt catalog with Perplexity provider; templates for research and ADR'
    };

    const repo_summary = JSON.stringify(summary, null, 2);

    // Sonar-Pro synthesis (fast, web-enabled)
    const sonarObjectives = 'Synthesize repository state, CI, Cursor workflows, and security; propose immediate, prioritized actions.';
    const sonarRes = await executor.execute('analysis/user-driven-sonar-pro', {
      user_prompt: 'Provide a concise, prioritized roadmap for EchoTune AI across Perplexity integration, CI, Cursor workflows, and security.',
      context: 'Main branch; Perplexity endpoint live; CI caches+canary; Cursor workflows ready.'
    });

    // Grok-4 architectural deep-dive
    const originalFlag = process.env.PERPLEXITY_FORCE_MODEL;
    process.env.PERPLEXITY_FORCE_MODEL = '1';
    let grokRes;
    try {
      grokRes = await executor.execute('analysis/user-driven-research-grok4', {
        query: 'Produce a deep architectural assessment and recommendations for EchoTune AI repository.',
        context: repo_summary
      });
    } catch (e) {
      // Fallback to Sonar-Pro if Grok-4 not accepted
      grokRes = await executor.execute('analysis/user-driven-sonar-pro', {
        user_prompt: 'Provide a deep architectural assessment and recommendations for EchoTune AI repository.',
        context: repo_summary
      });
    } finally {
      if (originalFlag === undefined) delete process.env.PERPLEXITY_FORCE_MODEL; else process.env.PERPLEXITY_FORCE_MODEL = originalFlag;
    }

    const lines = [];
    lines.push('# EchoTune AI — Auto-Refreshed Roadmap');
    lines.push('');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');
    lines.push('## How to use this document');
    lines.push('- This roadmap is auto-updated using Perplexity Sonar‑Pro and Grok‑4.');
    lines.push('- For browser research inside Cursor, run the workflow: `.cursor/workflows/perplexity-browser-research.json`.');
    lines.push('- For PR reviews, use `.cursor/workflows/pr-deep-dive.json`.');
    lines.push('');
    lines.push('## Executive Summary (Sonar‑Pro)');
    lines.push('');
    lines.push(sonarRes.content || '');
    lines.push('');
    lines.push('## Architectural Deep‑Dive (Grok‑4)');
    lines.push('');
    lines.push(grokRes.content || '');
    lines.push('');
    lines.push('## Project Pillars (Scope Reference)');
    lines.push('');
    lines.push('- **Advanced AI Integration**');
    lines.push('  - Multi-Provider LLM Support — OpenAI GPT‑4o, Google Gemini 2.0, OpenRouter Claude 3.5 with real-time provider switching');
    lines.push('  - Intelligent Music Conversations — Natural language queries like "Find me something like Radiohead but more energetic"');
    lines.push('  - Context-Aware Recommendations — AI remembers history, mood, and preferences');
    lines.push('  - Real-time Provider Testing — Validate AI connections with latency metrics');
    lines.push('- **Smart Music Discovery**');
    lines.push('  - Spotify Integration — OAuth, playlist creation, streaming');
    lines.push('  - Advanced Discovery Modes — Mood-based, trending, social, AI radio');
    lines.push('  - ML-Powered Recommendations — Collaborative filtering + content-based');
    lines.push('  - Audio Feature Analysis — Tempo, energy, valence, musical characteristics');
    lines.push('- **Comprehensive Analytics Dashboard**');
    lines.push('  - Live Database Insights — Real-time MongoDB statistics and performance');
    lines.push('  - Listening Pattern Analysis — Time-based evolution visualizations');
    lines.push('  - Performance Monitoring — System health, resource utilization');
    lines.push('  - User Engagement Metrics — Recommendation effectiveness and interactions');
    lines.push('- **Advanced Configuration System**');
    lines.push('  - Enhanced Settings UI — Glassmorphism, comprehensive options');
    lines.push('  - LLM Provider Management — Visual model params and API keys');
    lines.push('  - Database Tools — MongoDB optimization, backup, collection management');
    lines.push('  - System Health Monitor — Real-time status with automated validation');
    lines.push('');
    lines.push('## Repository Summary Snapshot');
    lines.push('');
    lines.push('```json');
    lines.push(repo_summary);
    lines.push('```');
    lines.push('');
    lines.push('## Next Steps');
    lines.push('- Implement Perplexity observability and logging (enabled in executor).');
    lines.push('- Validate Cursor workflows with real keys; document outcomes.');
    lines.push('- Ensure CI security scans are running; track issues.');
    lines.push('- Re-run this workflow nightly (see .github/workflows/roadmap-refresh.yml).');

    const outPath = path.join(process.cwd(), 'ROADMAP_AUTO.md');
    fs.writeFileSync(outPath, lines.join('\n'));
    console.log(`✅ Roadmap refreshed at ${outPath}`);
  } catch (err) {
    console.error('❌ Roadmap refresh failed:', err.message);
    process.exit(1);
  }
})();