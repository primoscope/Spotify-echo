#!/usr/bin/env node
const fetch = require('node-fetch');

const TARGETS = [
  { name: 'chat/providers', url: 'http://localhost:3000/api/chat/providers', method: 'GET' },
  { name: 'analytics/dashboard', url: 'http://localhost:3000/api/analytics/dashboard?timeRange=7d&metrics=listening,engagement', method: 'GET' },
  { name: 'music/discover', url: 'http://localhost:3000/api/music/discover', method: 'POST', body: { mode: 'smart', query: 'chill lofi' } },
];

async function timeOnce(target) {
  const start = Date.now();
  let res;
  try {
    res = await fetch(target.url, {
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

(async () => {
  const iterations = parseInt(process.env.BENCH_ITER || '10', 10);
  const results = {};

  for (const t of TARGETS) {
    const times = [];
    let okCount = 0;
    for (let i = 0; i < iterations; i++) {
      const r = await timeOnce(t);
      times.push(r.ms);
      if (r.ok) okCount++;
      await new Promise((rslv) => setTimeout(rslv, 50));
    }
    results[t.name] = {
      p50: percentile(times, 50),
      p95: percentile(times, 95),
      min: Math.min(...times),
      max: Math.max(...times),
      okRate: (okCount / iterations * 100).toFixed(1) + '%',
      samples: iterations,
    };
  }

  console.log(JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2));
})();