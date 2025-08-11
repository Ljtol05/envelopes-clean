#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();
const reportsDir = path.join(cwd, '.lighthouseci');
const summaryOut = process.env.GITHUB_STEP_SUMMARY;

function latestReport() {
  const jsons = fs.readdirSync(reportsDir).filter(f=>f.endsWith('.json'));
  if (!jsons.length) throw new Error('No LHCI JSON reports found');
  const sorted = jsons.map(f=>({f,mtime:fs.statSync(path.join(reportsDir,f)).mtimeMs})).sort((a,b)=>b.mtime-a.mtime);
  return path.join(reportsDir, sorted[0].f);
}

function extractScores(reportPath) {
  const json = JSON.parse(fs.readFileSync(reportPath,'utf8'));
  const c = json.categories;
  const toPct = v => (v==null?null:Math.round(v*100));
  return {
    performance: toPct(c?.performance?.score),
    accessibility: toPct(c?.accessibility?.score),
    bestPractices: toPct(c?.['best-practices']?.score),
    seo: toPct(c?.seo?.score)
  };
}

const baselinePath = path.join('.lighthouse-baseline.json');
const latestPath = latestReport();
const latest = extractScores(latestPath);
let baseline = null;
if (fs.existsSync(baselinePath)) baseline = JSON.parse(fs.readFileSync(baselinePath,'utf8'));

const diff = {};
if (baseline) {
  for (const k of Object.keys(latest)) {
    const b = baseline[k];
    const l = latest[k];
    if (b == null || l == null) diff[k] = null; else diff[k] = l - b;
  }
}

fs.writeFileSync('.lighthouse-latest.json', JSON.stringify(latest,null,2));

if (summaryOut) {
  const lines = [];
  lines.push('### Lighthouse Category Scores');
  lines.push('Category | Latest | Baseline | Δ');
  lines.push('---|---|---|---');
  for (const k of ['performance','accessibility','bestPractices','seo']) {
    const label = k === 'bestPractices' ? 'Best Practices' : k[0].toUpperCase()+k.slice(1);
    const l = latest[k] ?? '—';
    const b = baseline? (baseline[k] ?? '—') : '—';
    const d = baseline && diff[k]!=null ? (diff[k]===0 ? '0' : (diff[k]>0?`+${diff[k]}`:`${diff[k]}`)) : '—';
    lines.push(`${label} | ${l} | ${b} | ${d}`);
  }
  fs.appendFileSync(summaryOut, lines.join('\n')+'\n');
}

if (process.env.GITHUB_REF === 'refs/heads/main') {
  fs.writeFileSync(baselinePath, JSON.stringify(latest,null,2));
  console.log('Updated baseline .lighthouse-baseline.json');
} else {
  console.log('Baseline not updated (non-main ref)');
}
