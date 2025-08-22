#!/usr/bin/env node
/**
 * CI guard: ensure every <DialogContent> contains a <DialogTitle> sibling/child
 * within the same JSX block in source & test files. This is a heuristic static scan
 * (not a full parser) to catch accidental omissions leading to accessibility warnings.
 *
 * Limitations: won't parse dynamic composition across files; acceptable for CI guard.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const srcDir = join(root, 'src');

function walk(dir, acc=[]) {
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('.')) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc); else acc.push(full);
  }
  return acc;
}

const files = walk(srcDir).filter(f => /\.(t|j)sx?$/.test(f));
const offenders = [];

for (const file of files) {
  const txt = readFileSync(file, 'utf8');
  if (!txt.includes('<DialogContent')) continue; // fast skip
  // crude segmentation: each opening <DialogContent ...> until corresponding </DialogContent>
  const pattern = /<DialogContent[\s\S]*?>[\s\S]*?<\/DialogContent>/g;
  const matches = txt.match(pattern) || [];
  for (const block of matches) {
    // If block already contains <DialogTitle we accept; allow visually hidden (className etc.)
    if (block.includes('<DialogTitle')) continue;
    offenders.push({ file: file.replace(root + '/', ''), snippet: block.slice(0, 160).replace(/\s+/g,' ').trim() + (block.length>160?'…':'') });
  }
}

if (offenders.length) {
  console.error('[dialog-title-check] Missing <DialogTitle> in DialogContent blocks:');
  for (const o of offenders) {
    console.error(` - ${o.file}: ${o.snippet}`);
  }
  process.exit(1);
}

console.log('[dialog-title-check] OK');
