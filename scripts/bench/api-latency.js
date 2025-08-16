#!/usr/bin/env node
/**
 * API Latency Baseline Measurement Script
 * Measures p50/p95/min/max latency per endpoint for baseline establishment
 */

const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const OUTPUT_DIR = path.join(__dirname, '../../test-results');
const BASELINE_FILE = path.join(OUTPUT_DIR, 'baseline-metrics.json');

// Endpoints to test with expected response times (dev environment)
const TARGETS = [
  { name: 'chat/providers', url: '/api/chat/providers', method: 'GET', target: 800, category: 'providers' },
  { name: 'providers', url: '/api/providers', method: 'GET', target: 800, category: 'providers' },
  { name: 'providers/health', url: '/api/providers/health', method: 'GET', target: 800, category: 'providers' },
  { name: 'analytics/dashboard', url: '/api/analytics/dashboard', method: 'GET', target: 1200, category: 'analytics' },
  { name: 'music/discover', url: '/api/music/discover', method: 'GET', target: 1500, category: 'discovery' },
  { name: 'health', url: '/health', method: 'GET', target: 200, category: 'health' },
];

const REQUESTS_PER_ENDPOINT = parseInt(process.env.BENCH_ITER || '10', 10);
const REQUEST_DELAY_MS = 50;

async function timeOnce(target) {
  const start = Date.now();
  let res;
  try {
    res = await fetch(`${BASE_URL}${target.url}`, {
      method: target.method,
      headers: { 'Content-Type': 'application/json' },
      body: target.body ? JSON.stringify(target.body) : undefined,
    });
  } catch (e) {
    return { ok: false, ms: Date.now() - start, status: 0, error: e.message };
  }
  const ms = Date.now() - start;
  return { ok: res.ok, ms, status: res.status };
}

function percentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, idx))];
}

function generateSummary(results) {
  const categories = {};
  let totalEndpoints = 0;
  let meetingTargets = 0;

  for (const [name, result] of Object.entries(results)) {
    if (result.error) continue;

    totalEndpoints++;
    if (result.p95 <= result.target) meetingTargets++;

    const target = TARGETS.find(t => t.name === name);
    const category = target?.category || 'unknown';

    if (!categories[category]) {
      categories[category] = {
        endpoints: 0,
        avgP95: 0,
        avgSuccessRate: 0,
        meetingTargets: 0,
      };
    }

    const cat = categories[category];
    cat.endpoints++;
    cat.avgP95 += result.p95;
    cat.avgSuccessRate += result.successRate;
    if (result.p95 <= result.target) cat.meetingTargets++;
  }

  // Calculate averages
  for (const cat of Object.values(categories)) {
    cat.avgP95 = Math.round(cat.avgP95 / cat.endpoints);
    cat.avgSuccessRate = Math.round((cat.avgSuccessRate / cat.endpoints) * 100) / 100;
  }

  return {
    overall: {
      totalEndpoints,
      meetingTargets,
      targetCompliance: Math.round((meetingTargets / totalEndpoints) * 100),
    },
    categories,
    timestamp: new Date().toISOString(),
  };
}

function formatForWorkflowState(results, summary) {
  return `
### Performance Baseline (${new Date().toISOString().split('T')[0]})

**Overall Performance:**
- Total endpoints tested: ${summary.overall.totalEndpoints}
- Meeting targets: ${summary.overall.meetingTargets}/${summary.overall.totalEndpoints} (${summary.overall.targetCompliance}%)

**Category Performance:**
${Object.entries(summary.categories).map(([name, stats]) => 
  `- **${name}**: Avg p95=${stats.avgP95}ms, Success=${stats.avgSuccessRate}%, Targets=${stats.meetingTargets}/${stats.endpoints}`
).join('\n')}

**Key Metrics (p95 latency):**
${Object.entries(results)
  .filter(([_, result]) => !result.error)
  .map(([name, result]) => `- ${name}: ${result.p95}ms (target: ${result.target}ms) ${result.p95 <= result.target ? '✅' : '⚠️'}`)
  .join('\n')}

**Baseline file:** \`${BASELINE_FILE}\`
`;
}

(async () => {
  console.log('🚀 Starting API latency baseline measurement...');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`📦 Endpoints: ${TARGETS.length}`);
  console.log(`🔄 Requests per endpoint: ${REQUESTS_PER_ENDPOINT}`);

  // Ensure output directory exists
  try {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
  } catch (e) {
    // Directory already exists, continue
  }

  const results = {};
  const startTime = new Date();

  for (const target of TARGETS) {
    console.log(`📊 Testing ${target.name} (${REQUESTS_PER_ENDPOINT} requests)...`);
    
    const times = [];
    const errors = [];
    let okCount = 0;
    
    for (let i = 0; i < REQUESTS_PER_ENDPOINT; i++) {
      const r = await timeOnce(target);
      times.push(r.ms);
      if (r.ok) {
        okCount++;
      } else {
        errors.push(r.error || `${r.status}`);
      }
      await new Promise((rslv) => setTimeout(rslv, REQUEST_DELAY_MS));
    }
    
    const successRate = (okCount / REQUESTS_PER_ENDPOINT) * 100;
    
    results[target.name] = {
      p50: percentile(times, 50),
      p95: percentile(times, 95),
      min: Math.min(...times),
      max: Math.max(...times),
      mean: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
      target: target.target,
      successRate: Math.round(successRate * 100) / 100,
      errors: errors.length,
      category: target.category,
      timestamp: new Date().toISOString(),
    };

    console.log(`✅ ${target.name}: p95=${results[target.name].p95}ms (target: ${target.target}ms) success=${results[target.name].successRate}%`);
    
    if (results[target.name].p95 > target.target) {
      console.log(`⚠️  P95 latency (${results[target.name].p95}ms) exceeds target (${target.target}ms)`);
    }
  }

  // Generate summary
  const summary = generateSummary(results);
  
  // Save results
  const baselineData = {
    timestamp: startTime.toISOString(),
    baseUrl: BASE_URL,
    configuration: {
      requestsPerEndpoint: REQUESTS_PER_ENDPOINT,
      requestDelayMs: REQUEST_DELAY_MS,
    },
    results,
    summary,
  };

  await fs.writeFile(BASELINE_FILE, JSON.stringify(baselineData, null, 2));
  console.log(`💾 Results saved to: ${BASELINE_FILE}`);

  console.log('\n📊 BASELINE SUMMARY:');
  console.log(`Overall compliance: ${summary.overall.targetCompliance}% (${summary.overall.meetingTargets}/${summary.overall.totalEndpoints})`);
  
  console.log('\n📈 CATEGORY BREAKDOWN:');
  Object.entries(summary.categories).forEach(([name, stats]) => {
    console.log(`${name}: p95=${stats.avgP95}ms, targets=${stats.meetingTargets}/${stats.endpoints}`);
  });

  // Output for WORKFLOW_STATE.md
  console.log('\n📝 WORKFLOW_STATE.md section:');
  console.log(formatForWorkflowState(results, summary));

  console.log('\n✨ Baseline measurement complete!');
})().catch(err => {
  console.error('❌ Baseline measurement failed:', err);
  process.exit(1);
});