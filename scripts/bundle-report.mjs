#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const dist = path.join(process.cwd(), 'dist');
if (!fs.existsSync(dist)) {
  console.error('dist folder not found. Run build first.');
  process.exit(1);
}
// Collect asset sizes (recursively) under dist (primarily dist/assets)
function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const rel = path.relative(dist, full);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) out.push(...walk(full));
    else if (/\.(js|css)$/i.test(entry)) out.push({ file: rel, size: stat.size });
  }
  return out;
}
const data = walk(dist).sort((a,b)=>b.size-a.size);

const total = data.reduce((s,f)=>s+f.size,0);
const budgetTotal = 300 * 1024; // 300 KB combined js+css
const perFileBudget = 180 * 1024; // 180 KB single file

let fail = false;
for (const {file,size} of data) {
  if (size > perFileBudget) {
    console.log(`BUNDLE_BUDGET_FAIL Single file over budget: ${file} ${(size/1024).toFixed(1)}KB > ${(perFileBudget/1024).toFixed(0)}KB`);
    fail = true;
  }
}
if (total > budgetTotal) {
  console.log(`BUNDLE_BUDGET_FAIL Total size ${(total/1024).toFixed(1)}KB > ${(budgetTotal/1024).toFixed(0)}KB`);
  fail = true;
}

const report = { totalBytes: total, files: data };
fs.writeFileSync('bundle-report.json', JSON.stringify(report,null,2));
console.log('Bundle size total:', (total/1024).toFixed(1),'KB');
if (fail) {
  process.exitCode = 1;
}
