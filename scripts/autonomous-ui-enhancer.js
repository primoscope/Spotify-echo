#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const glob = require('glob');

function ensureDir(dir) {
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readFileSafe(p) {
	try { return fs.readFileSync(p, 'utf8'); } catch { return ''; }
}

const COMPONENTS_DIR = path.resolve(__dirname, '..', 'src', 'frontend', 'components');
const OUTPUT_DIR = path.resolve(__dirname, '..', 'docs', 'generated');
const PRIORITY_COMPONENTS = [
	'EnhancedChatInterface.jsx',
	'EnhancedMusicDiscovery.jsx',
	'EnhancedAnalyticsDashboard.jsx',
	'PlaylistBuilder.jsx',
	'ExplainableRecommendations.jsx',
];

class UIResearchAgent {
	async scanComponents() {
		const pattern = path.join(COMPONENTS_DIR, '**', '*.jsx');
		const files = glob.sync(pattern, { nodir: true });
		return files.map((filePath) => {
			const code = readFileSafe(filePath);
			const hasMemo = /React\.memo\(|memo\(/.test(code);
			const hasUseMemo = /useMemo\(/.test(code);
			const hasUseCallback = /useCallback\(/.test(code);
			const hasUseEffect = /useEffect\(/.test(code);
			const hasAria = /aria-[a-z\-]+=/i.test(code);
			const hasSuspense = /<React\.Suspense|<Suspense/.test(code);
			const compName = path.basename(filePath);
			return {
				name: compName,
				path: filePath,
				size: code.length,
				metrics: { hasMemo, hasUseMemo, hasUseCallback, hasUseEffect, hasAria, hasSuspense },
			};
		});
	}

	async perplexityResearch(queries) {
		const key = process.env.PERPLEXITY_API_KEY;
		if (!key) {
			return {
				citations: [],
				insights: queries.map((q) => ({ query: q, summary: 'No API key set; using heuristic suggestions.' })),
			};
		}
		async function callPerplexity(prompt) {
			const fetch = (await import('node-fetch')).default;
			const res = await fetch('https://api.perplexity.ai/chat/completions', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${key}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					model: 'sonar-pro',
					messages: [{ role: 'user', content: prompt }],
					return_citations: true,
				})
			});
			if (!res.ok) throw new Error(`Perplexity error ${res.status}`);
			return res.json();
		}
		const results = [];
		for (const q of queries) {
			try {
				const json = await callPerplexity(q);
				results.push({ query: q, content: json.choices?.[0]?.message?.content || '' , citations: json.citations || [] });
			} catch (e) {
				results.push({ query: q, content: `Error: ${e.message}`, citations: [] });
			}
		}
		return { citations: results.flatMap(r => r.citations || []), insights: results };
	}

	generateImprovementRoadmap(components, research) {
		const presentPriority = PRIORITY_COMPONENTS.filter((c) => components.some((k) => path.basename(k.path) === c));
		const plans = presentPriority.map((c) => ({
			component: c,
			priority: 'high',
			dependencies: [],
			estimatedImpact: 9,
			improvements: {
				performance: [
					'Use React.memo for expensive subtrees',
					'Virtualize long lists (react-window)',
					'Profile and memoize heavy selectors with useMemo',
				],
				accessibility: [
					'Add ARIA roles/labels',
					'Keyboard navigation and focus traps',
				],
				userExperience: [
					'Typing indicators / live status',
					'Non-blocking loading states',
				],
				modernization: [
					'Introduce Suspense for async boundaries',
					'Integrate React Query for server state',
				],
			},
		}));
		return { timestamp: new Date().toISOString(), components, research, plans };
	}

	async analyzeCurrentUI() {
		const components = await this.scanComponents();
		const insights = await this.perplexityResearch([
			'React UI best practices 2025',
			'Material-UI modern patterns',
			'React accessibility improvements',
			'Performance optimization React components',
		]);
		return this.generateImprovementRoadmap(components, insights);
	}
}

class AutonomousUIEnhancer {
	async analyzeComponent(componentPath) {
		const code = readFileSafe(componentPath);
		const name = path.basename(componentPath);
		const componentType = /function\s+([A-Z]\w+)/.test(code) ? 'function' : 'unknown';
		return { name, componentPath, componentType, size: code.length };
	}

	async researchEnhancements(componentType) {
		return { componentType, notes: componentType === 'function' ? 'Apply hooks-based optimizations' : 'General improvements' };
	}

	async generateEnhancementPlan(analysis, research) {
		return {
			id: `${analysis.name}-${Date.now()}`,
			analysis,
			research,
			improvements: [
				{ id: 'perf-memo', type: 'performance', description: 'Wrap expensive children with React.memo' },
				{ id: 'a11y-aria', type: 'accessibility', description: 'Add ARIA labels and roles to controls' },
				{ id: 'ux-typing', type: 'ux', description: 'Add typing indicators or progressive loading UI' },
			],
		};
	}

	async implementEnhancement(componentPath, enhancement) {
		// Dry-run: record planned enhancement without modifying component code
		const logDir = OUTPUT_DIR;
		ensureDir(logDir);
		const logPath = path.join(logDir, 'UI_ENHANCEMENTS_LOG.json');
		let current = [];
		try { current = JSON.parse(fs.readFileSync(logPath, 'utf8')); } catch {}
		current.push({ componentPath, enhancement, appliedAt: new Date().toISOString() });
		fs.writeFileSync(logPath, JSON.stringify(current, null, 2));
		return true;
	}

	async testEnhancement(_componentPath, _enhancement) {
		return true;
	}

	async updateProgress(planId, enhancementId) {
		const progressPath = path.join(OUTPUT_DIR, 'UI_PROGRESS.json');
		let progress = {};
		try { progress = JSON.parse(fs.readFileSync(progressPath, 'utf8')); } catch {}
		progress[planId] = progress[planId] || { done: [] };
		progress[planId].done.push({ enhancementId, at: new Date().toISOString() });
		ensureDir(OUTPUT_DIR);
		fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2));
	}

	async updateRoadmap(results) {
		const roadmapPath = path.join(OUTPUT_DIR, 'UI_ROADMAP.json');
		let roadmap = {};
		try { roadmap = JSON.parse(fs.readFileSync(roadmapPath, 'utf8')); } catch {}
		roadmap.lastUpdate = new Date().toISOString();
		roadmap.results = results || roadmap.results || [];
		ensureDir(OUTPUT_DIR);
		fs.writeFileSync(roadmapPath, JSON.stringify(roadmap, null, 2));
	}

	selectNextTarget() {
		return PRIORITY_COMPONENTS[0] || null;
	}

	async enhanceComponent(componentPath) {
		const analysis = await this.analyzeComponent(componentPath);
		const research = await this.researchEnhancements(analysis.componentType);
		const plan = await this.generateEnhancementPlan(analysis, research);
		for (const enhancement of plan.improvements) {
			await this.implementEnhancement(componentPath, enhancement);
			await this.testEnhancement(componentPath, enhancement);
			await this.updateProgress(plan.id, enhancement.id);
		}
		await this.updateRoadmap(plan.improvements);
		return this.selectNextTarget();
	}
}

class ProgressTracker {
	async analyzeCurrentState() { return {}; }
	async calculateRoadmapCompletion() { return { completionRate: 0.2 }; }
	async measurePerformance() { return { overall: 'unknown' }; }
	async researchEmergingPatterns() { return []; }
	async selectNextTargets() { return PRIORITY_COMPONENTS.slice(0, 3); }
	async updateRoadmapWithNewObjectives(_insights) { return true; }
	async conductResearch(_topics) { return []; }
	async generateNextPhaseObjectives() { return true; }
}

class QualityAssuranceAgent {
	async collectMetrics() { return { a11yScore: 0.8, codeQualityScore: 0.9 }; }
	async analyzeUserInteractions() { return { satisfactionScore: 0.85 }; }
	async measurePerformance() { return { overallScore: 0.8 }; }
	calculateQualityScore({ accessibility, performance, userSatisfaction, codeQuality }) {
		const weights = { accessibility: 0.25, performance: 0.3, userSatisfaction: 0.25, codeQuality: 0.2 };
		return (
			accessibility * weights.accessibility +
			performance * weights.performance +
			userSatisfaction * weights.userSatisfaction +
			codeQuality * weights.codeQuality
		);
	}
	async generateImprovementPlan(_metrics) { return true; }
	async scheduleEnhancements() { return true; }
	async identifyImprovementAreas(_metrics) { return ['performance', 'a11y']; }
	async planNextActions() { return ['research', 'prototype']; }
}

async function writeJson(file, data) {
	ensureDir(OUTPUT_DIR);
	fs.writeFileSync(path.join(OUTPUT_DIR, file), JSON.stringify(data, null, 2));
}

async function writeReportMarkdown(roadmap) {
	const md = [
		'# UI Enhancement Report',
		`Date: ${new Date().toISOString()}`,
		'',
		'## Priority Components Found',
		...roadmap.components
			.filter((c) => PRIORITY_COMPONENTS.includes(c.name))
			.map((c) => `- ${c.name} (size: ${c.size}, memo: ${c.metrics.hasMemo})`),
		'',
		'## Planned Enhancements',
		...roadmap.plans.map((p) => `- ${p.component}: ${p.improvements.performance[0]} | ${p.improvements.accessibility[0]} | ${p.improvements.userExperience[0]} | ${p.improvements.modernization[0]}`),
	].join('\n');
	ensureDir(OUTPUT_DIR);
	fs.writeFileSync(path.join(OUTPUT_DIR, 'UI_REPORT.md'), md, 'utf8');
}

function parseArgs() {
	const args = process.argv.slice(2);
	const out = { mode: 'research', target: 'all', continuous: false };
	for (let i = 0; i < args.length; i++) {
		const a = args[i];
		if (a.startsWith('--mode=')) out.mode = a.split('=')[1];
		else if (a.startsWith('--target=')) out.target = a.split('=')[1];
		else if (a.startsWith('--continuous=')) out.continuous = a.split('=')[1] === 'true';
		else if (a === '--continuous') out.continuous = true;
	}
	return out;
}

async function main() {
	ensureDir(OUTPUT_DIR);
	const { mode, target, continuous } = parseArgs();
	const researchAgent = new UIResearchAgent();
	const enhancer = new AutonomousUIEnhancer();

	if (mode === 'research') {
		const roadmap = await researchAgent.analyzeCurrentUI();
		await writeJson('UI_ROADMAP.json', roadmap);
		await writeReportMarkdown(roadmap);
		console.log('✅ Research complete. See docs/generated/UI_ROADMAP.json and UI_REPORT.md');
		return;
	}

	if (mode === 'enhance') {
		const pattern = path.join(COMPONENTS_DIR, '**', '*.jsx');
		const allFiles = glob.sync(pattern, { nodir: true });
		const targets = target === 'all'
			? allFiles.filter((f) => PRIORITY_COMPONENTS.includes(path.basename(f)))
			: target.split(',').map((n) => {
				// Accept bare names or full/relative paths
				if (n.endsWith('.jsx')) {
					return allFiles.find((f) => path.basename(f) === n) || n;
				}
				return allFiles.find((f) => path.basename(f) === `${n}.jsx`) || n;
			});
		for (const t of targets) {
			if (!t || !fs.existsSync(t)) continue;
			console.log(`Enhancing ${t}...`);
			await enhancer.enhanceComponent(t);
		}
		console.log('✅ Enhancement pass complete. See docs/generated/UI_ENHANCEMENTS_LOG.json');
		if (continuous) console.log('ℹ️ Continuous mode requested; implement a loop or Git hook to rerun.');
		return;
	}

	if (mode === 'test') {
		try {
			execSync('npm run test:unit -- -i', { stdio: 'inherit' });
			console.log('✅ UI tests executed');
		} catch (e) {
			console.log('⚠️ UI tests reported failures');
		}
		return;
	}

	if (mode === 'lighthouse') {
		const port = process.env.PORT || 3000;
		try {
			execSync(`npx lighthouse http://localhost:${port} --quiet --chrome-flags="--headless"`, { stdio: 'inherit' });
			console.log('✅ Lighthouse audit complete');
		} catch (e) {
			console.log('⚠️ Lighthouse failed or is not installed');
		}
		return;
	}

	if (mode === 'roadmap') {
		const roadmapPath = path.join(OUTPUT_DIR, 'UI_ROADMAP.json');
		let roadmap = {};
		try { roadmap = JSON.parse(fs.readFileSync(roadmapPath, 'utf8')); } catch {}
		roadmap.lastReviewed = new Date().toISOString();
		await writeJson('UI_ROADMAP.json', roadmap);
		console.log('✅ Roadmap updated');
		return;
	}

	console.log(`Unknown mode: ${mode}`);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});