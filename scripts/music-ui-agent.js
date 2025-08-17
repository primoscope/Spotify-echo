#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.resolve(__dirname, '..', 'docs', 'generated');
function ensureDir(dir){ if(!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true}); }

async function perplexity(query){
  const key = process.env.PERPLEXITY_API_KEY || process.env.PERPLEXITY_API;
  if(!key){ return { query, content: 'No PERPLEXITY_API_KEY; skipping', citations: [] }; }
  const fetch = (await import('node-fetch')).default;
  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST', headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'sonar-pro', return_citations: true, messages: [{ role: 'user', content: query }] })
  });
  const json = await res.json();
  return { query, content: json.choices?.[0]?.message?.content || '', citations: json.citations || [] };
}

async function runResearch(){
  const topics = [
    'Latest Spotify API changes 2025 rate limits and web playback',
    'Best algorithms for music recommendation 2025 hybrid CF+content',
    'Optimizing audio player UX in React with MUI',
  ];
  const results = [];
  for(const t of topics){ try{ results.push(await perplexity(t)); } catch(e){ results.push({ query:t, content:`Error: ${e.message}`, citations:[]}); } }
  ensureDir(OUTPUT_DIR);
  fs.writeFileSync(path.join(OUTPUT_DIR,'MUSIC_RESEARCH.json'), JSON.stringify(results,null,2));
  return results;
}

async function main(){
  const research = await runResearch();
  const report = [
    '# Music UI Agent Report',
    `Date: ${new Date().toISOString()}`,
    '',
    '## Research Summaries',
    ...research.map(r=>`- ${r.query}: ${String(r.content).slice(0,200)}...`),
    '',
    '## Next Steps',
    '- Enable Browser MCP tests for player controls (play/pause/seek).',
    '- Verify Redis cache hit rates for audio features.',
    '- Track Spotify API latency via performance monitor endpoints.',
  ].join('\n');
  ensureDir(OUTPUT_DIR);
  fs.writeFileSync(path.join(OUTPUT_DIR,'MUSIC_UI_AGENT_REPORT.md'), report, 'utf8');
  console.log('Music UI agent completed. See docs/generated/MUSIC_UI_AGENT_REPORT.md');
}

main().catch(e=>{ console.error(e); process.exit(1); });