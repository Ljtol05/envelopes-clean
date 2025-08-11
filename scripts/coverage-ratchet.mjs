#!/usr/bin/env node
/**
 * Increment global coverage thresholds by +1 (absolute percentage point) per run if current coverage exceeds them.
 * Intended to be run weekly via CI (e.g., scheduled workflow) to gently ratchet quality.
 */
import fs from 'fs';
import path from 'path';

const JEST_CONFIG = path.resolve(process.cwd(), 'jest.config.cjs');
const COV_SUMMARY = path.resolve(process.cwd(), 'coverage/coverage-summary.json');

if (!fs.existsSync(JEST_CONFIG)) {
  console.error('jest.config.cjs not found');
  process.exit(1);
}
if (!fs.existsSync(COV_SUMMARY)) {
  console.error('coverage-summary.json not found; run tests with coverage first');
  process.exit(1);
}

const summary = JSON.parse(fs.readFileSync(COV_SUMMARY, 'utf-8'));
const globalTotals = summary.total || {};

function pct(v) { return typeof v?.pct === 'number' ? v.pct : 0; }

let cfgRaw = fs.readFileSync(JEST_CONFIG, 'utf-8');
// Very small parser: locate coverageThreshold.global block and adjust numbers.
const match = cfgRaw.match(/coverageThreshold:\s*{[\s\S]*?global:\s*{([\s\S]*?)}/);
if (!match) {
  console.error('Could not find coverageThreshold.global in jest.config.cjs');
  process.exit(1);
}

const current = {
  lines: pct(globalTotals.lines),
  statements: pct(globalTotals.statements),
  branches: pct(globalTotals.branches),
  functions: pct(globalTotals.functions)
};

// Extract existing thresholds from config (fallback to 0 if not found)
function extract(name) {
  const r = new RegExp(name + '\\s*:\\s*(\\d+)', 'm');
  const m = match[1].match(r); return m ? parseInt(m[1], 10) : 0;
}
const existing = {
  lines: extract('lines'),
  statements: extract('statements'),
  branches: extract('branches'),
  functions: extract('functions')
};

// Decide new thresholds (+1 if current > existing, capped at current rounded down)
const updated = {};
for (const k of Object.keys(existing)) {
  const cur = existing[k];
  const actual = current[k];
  if (actual > cur) {
    updated[k] = Math.min(Math.floor(actual), cur + 1);
  } else {
    updated[k] = cur; // no change
  }
}

if (Object.values(updated).every((v,i) => v === Object.values(existing)[i])) {
  console.log('Coverage thresholds unchanged:', existing);
  process.exit(0);
}

let newBlock = match[1]
  .replace(/lines\s*:\s*\d+/, `lines: ${updated.lines}`)
  .replace(/statements\s*:\s*\d+/, `statements: ${updated.statements}`)
  .replace(/branches\s*:\s*\d+/, `branches: ${updated.branches}`)
  .replace(/functions\s*:\s*\d+/, `functions: ${updated.functions}`);

cfgRaw = cfgRaw.replace(match[1], newBlock);
fs.writeFileSync(JEST_CONFIG, cfgRaw);
console.log('Coverage thresholds updated ->', updated, '(was', existing, ')');
