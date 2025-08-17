#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs', 'generated');
function ensureDir(d){ if(!fs.existsSync(d)) fs.mkdirSync(d,{recursive:true}); }
function readJsonSafe(p, fallback){ try{ return JSON.parse(fs.readFileSync(p,'utf8')); }catch{ return fallback; } }
function readTextSafe(p, fallback){ try{ return fs.readFileSync(p,'utf8'); }catch{ return fallback; } }

function summarizePackage(pkg){
	return {
		name: pkg.name,
		version: pkg.version,
		deps: Object.keys(pkg.dependencies||{}).length,
		devDeps: Object.keys(pkg.devDependencies||{}).length,
		frameworks: Object.keys(pkg.dependencies||{}).filter(d=>/react|express|vite|webpack|mui|socket|redis|mongodb/i.test(d)),
		testScript: pkg.scripts?.['test:unit'] || pkg.scripts?.test,
	};
}

function summarizeMCP(mcp){
	const servers = mcp?.mcpServers ? Object.keys(mcp.mcpServers) : [];
	return { count: servers.length, servers };
}

function scanComponents(){
	const pattern = path.join(ROOT, 'src', 'frontend', 'components', '**', '*.jsx');
	const files = glob.sync(pattern, { nodir:true });
	return {
		count: files.length,
		priorityPresent: ['EnhancedChatInterface.jsx','EnhancedMusicDiscovery.jsx','EnhancedAnalyticsDashboard.jsx','PlaylistBuilder.jsx','ExplainableRecommendations.jsx'].filter(n=>files.some(f=>path.basename(f)===n)),
	};
}

function loadResearch(){
	const uiRoadmap = readJsonSafe(path.join(OUT_DIR,'UI_ROADMAP.json'), null);
	const musicResearch = readJsonSafe(path.join(OUT_DIR,'MUSIC_RESEARCH.json'), []);
	return { uiRoadmap, musicResearch };
}

function writeComprehensiveUpdate(pkgSummary, mcpSummary, comps, research){
	ensureDir(OUT_DIR);
	const lines = [];
	lines.push('# Comprehensive Repository Update');
	lines.push(`Date: ${new Date().toISOString()}`);
	lines.push('');
	lines.push('## Tech Stack');
	lines.push(`- Name: ${pkgSummary.name} v${pkgSummary.version}`);
	lines.push(`- Frameworks: ${pkgSummary.frameworks.join(', ')}`);
	lines.push(`- Dependencies: ${pkgSummary.deps} (dev: ${pkgSummary.devDeps})`);
	lines.push('');
	lines.push('## MCP Servers');
	lines.push(`- Count: ${mcpSummary.count}`);
	lines.push(`- Servers: ${mcpSummary.servers.join(', ')}`);
	lines.push('');
	lines.push('## UI Components');
	lines.push(`- Total components: ${comps.count}`);
	lines.push(`- Priority components present: ${comps.priorityPresent.join(', ') || 'None'}`);
	lines.push('');
	lines.push('## Research (Perplexity)');
	if (Array.isArray(research.musicResearch) && research.musicResearch.length){
		research.musicResearch.slice(0,5).forEach(r=>{
			lines.push(`- ${r.query}: ${(r.content||'').toString().slice(0,200)}...`);
		});
	}else{
		lines.push('- No music research results found');
	}
	lines.push('');
	if (research.uiRoadmap){
		lines.push('## UI Roadmap Summary');
		lines.push(`- Plans: ${Array.isArray(research.uiRoadmap.plans)?research.uiRoadmap.plans.length:0}`);
	}
	fs.writeFileSync(path.join(OUT_DIR,'COMPREHENSIVE_UPDATE.md'), lines.join('\n'), 'utf8');
}

function writeMetricsAndLogs(metrics, logs){
	ensureDir(OUT_DIR);
	fs.writeFileSync(path.join(OUT_DIR,'AGENT_METRICS.json'), JSON.stringify(metrics,null,2));
	fs.writeFileSync(path.join(OUT_DIR,'RESEARCH_LOG.txt'), logs.join('\n'), 'utf8');
}

async function main(){
	const started = Date.now();
	const pkg = readJsonSafe(path.join(ROOT,'package.json'), {});
	const pkgSummary = summarizePackage(pkg);
	const mcp = readJsonSafe(path.join(ROOT,'.cursor','mcp.json'), {});
	const mcpSummary = summarizeMCP(mcp);
	const comps = scanComponents();
	const research = loadResearch();
	writeComprehensiveUpdate(pkgSummary, mcpSummary, comps, research);
	const finished = Date.now();
	const metrics = {
		startedAt: new Date(started).toISOString(),
		finishedAt: new Date(finished).toISOString(),
		durationMs: finished-started,
		components: comps.count,
		mcpServers: mcpSummary.count,
		plans: Array.isArray(research.uiRoadmap?.plans)?research.uiRoadmap.plans.length:0,
		musicResearchTopics: Array.isArray(research.musicResearch)?research.musicResearch.length:0,
	};
	const logs = [
		'Repository analysis complete.',
		`Components scanned: ${comps.count}`,
		`MCP servers detected: ${mcpSummary.servers.join(', ')}`,
		`Research topics: ${metrics.musicResearchTopics}`,
	];
	writeMetricsAndLogs(metrics, logs);
	console.log('Comprehensive update written to docs/generated/.');
}

main().catch(e=>{ console.error(e); process.exit(1); });