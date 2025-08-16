#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function getFiles(dir, ext = '.js', arr = []) {
  const list = fs.readdirSync(dir);
  for (const f of list) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) getFiles(p, ext, arr);
    else if (p.endsWith(ext)) arr.push({ path: p, size: st.size });
  }
  return arr;
}

(function main() {
  const distDir = path.join(process.cwd(), 'dist', 'assets', 'js');
  if (!fs.existsSync(distDir)) {
    console.error('dist assets not found. Run build first.');
    process.exit(1);
  }
  const files = getFiles(distDir, '.js');
  const total = files.reduce((a, b) => a + b.size, 0);
  const top = files
    .sort((a, b) => b.size - a.size)
    .slice(0, 5)
    .map((f) => ({ file: path.basename(f.path), size: f.size }));
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), totalBytes: total, top }, null, 2));
})();