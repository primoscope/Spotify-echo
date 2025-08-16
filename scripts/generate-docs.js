#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function ensureDir(dir) {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
}

function writeFile(p, content) {
	ensureDir(path.dirname(p));
	fs.writeFileSync(p, content, 'utf8');
	return p;
}

function readJson(p) {
	return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function main() {
	const outDir = path.resolve(__dirname, '..', 'docs', 'generated');
	ensureDir(outDir);

	// Summaries
	const pkgPath = path.resolve(__dirname, '..', 'package.json');
	const pkg = readJson(pkgPath);

	const mcpPath = path.resolve(__dirname, '..', '.cursor', 'mcp.json');
	const mcp = readJson(mcpPath);

	const workflowsDir = path.resolve(__dirname, '..', '.cursor', 'workflows');
	const workflowFiles = fs.readdirSync(workflowsDir).filter(f => f.endsWith('.json'));
	const workflowSummaries = workflowFiles.map(f => {
		try {
			const wf = readJson(path.join(workflowsDir, f));
			return `- ${wf.name}: ${wf.description || ''} (yolo: ${wf.yolo ? 'true' : 'false'})`;
		} catch (e) {
			return `- ${f}: ERROR parsing (${e.message})`;
		}
	});

	const mcpServers = Object.keys(mcp.mcpServers || {});

	const cursorRulesPath = path.resolve(__dirname, '..', '.cursorrules');
	const hasCursorrules = fs.existsSync(cursorRulesPath);

	const summary = `# Generated Cursor Documentation\n\nUpdated: ${new Date().toISOString()}\n\n## Overview\n- Project: ${pkg.name} v${pkg.version}\n- Cursor rules present: ${hasCursorrules}\n- MCP servers: ${mcpServers.join(', ')}\n- Workflows: ${workflowFiles.length}\n\n## Workflows\n${workflowSummaries.join('\n')}\n\n## Model Routing (policy example)\nSee scripts/model-routing-policy.json for heuristics.\n\n## Notes\n- Set PERPLEXITY_API_KEY and BRAVE_API_KEY to enable research workflows.\n- Browser automation requires Playwright browsers installed on the host.\n`;

	writeFile(path.join(outDir, 'CURSOR_GENERATED.md'), summary);

	// Environment Keys doc (best-effort from update-env-config.js)
	const envDoc = `# Environment Keys (excerpt)\n\n- PERPLEXITY_API_KEY (research)\n- BRAVE_API_KEY (search)\n- BROWSERBASE_API_KEY / _PROJECT_ID / _SESSION_ID (optional UI automation)\n- OPENAI_API_KEY / ANTHROPIC_API_KEY (LLMs)\n\nStore secrets outside VCS and export before running workflows.\n`;
	writeFile(path.join(outDir, 'ENV_KEYS.md'), envDoc);

	// External sync placeholder
	const syncPlan = {
		provider: process.env.DOCS_SYNC_PROVIDER || 'none',
		status: 'not_configured',
		requiredEnv: ['NOTION_TOKEN', 'CONFLUENCE_USER', 'CONFLUENCE_TOKEN'],
		message: 'Set provider and credentials to enable external docs sync.'
	};
	writeFile(path.join(outDir, 'EXTERNAL_SYNC_PLAN.json'), JSON.stringify(syncPlan, null, 2));

	console.log('Generated docs in', outDir);
}

main();