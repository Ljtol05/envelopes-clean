#!/usr/bin/env node
/**
 * CI guard: ensure globals.css is imported exactly once via src/index.css so
 * design tokens & hardened modal/popover surfaces can't be accidentally dropped.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const projectRoot = process.cwd();
const srcDir = join(projectRoot, 'src');

function fileExists(p){ try { statSync(p); return true;} catch { return false; } }

const indexCssPath = join(srcDir, 'index.css');
if (!fileExists(indexCssPath)) {
  console.error('[globals-check] Missing src/index.css; cannot verify globals import.');
  process.exit(1);
}
const indexCss = readFileSync(indexCssPath, 'utf8');
const hasImport = /@import\s+["']\.\/styles\/globals\.css["'];?/.test(indexCss);
if (!hasImport) {
  console.error('[globals-check] src/index.css must @import "./styles/globals.css" (required for modal/popover hardening).');
  process.exit(1);
}

// Ensure no other direct imports to prevent duplicate cascade conflicts
function walk(dir, acc=[]) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc); else acc.push(full);
  }
  return acc;
}

const cssFiles = walk(srcDir).filter(f=>f.endsWith('.css') && !f.endsWith('index.css'));
const offenders = [];
for (const f of cssFiles) {
  const txt = readFileSync(f, 'utf8');
  if (/globals\.css/.test(txt)) offenders.push(f.replace(projectRoot + '/', ''));
}
if (offenders.length) {
  console.error('[globals-check] globals.css should only be imported via src/index.css. Offending files:', offenders.join(', '));
  process.exit(1);
}

console.log('[globals-check] OK');
