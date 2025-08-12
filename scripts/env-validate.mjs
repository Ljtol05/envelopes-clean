#!/usr/bin/env node
// Simple .env validator against .env.example
// Usage: node scripts/env-validate.mjs [--strict] [--example .env.example] [--file .env] [--silent]
import fs from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();
const args = new Set(process.argv.slice(2));
const getArg = (name, def) => {
  const idx = process.argv.indexOf(name);
  return idx >= 0 && process.argv[idx + 1] ? process.argv[idx + 1] : def;
};

const EXAMPLE = getArg('--example', '.env.example');
const FILE = getArg('--file', '.env');
const STRICT = args.has('--strict') || process.env.CI === 'true';
const SILENT = args.has('--silent');

function readKeys(filePath) {
  if (!fs.existsSync(filePath)) return { keys: new Set(), map: new Map() };
  const txt = fs.readFileSync(filePath, 'utf8');
  const lines = txt.split(/\r?\n/);
  const keys = new Set();
  const map = new Map();
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    // Support KEY=value with optional quotes; ignore export keyword
    const match = line.replace(/^export\s+/, '').match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    const key = match[1];
    let val = match[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    keys.add(key);
    map.set(key, val);
  }
  return { keys, map };
}

const examplePath = path.resolve(cwd, EXAMPLE);
const filePath = path.resolve(cwd, FILE);

const { keys: exampleKeys } = readKeys(examplePath);
const { keys: fileKeys, map: fileMap } = readKeys(filePath);

const missing = [...exampleKeys].filter((k) => !fileKeys.has(k));
const extras = [...fileKeys].filter((k) => !exampleKeys.has(k));
const empty = [...fileKeys].filter((k) => exampleKeys.has(k) && (!fileMap.get(k) || String(fileMap.get(k)).trim() === ''));

const issues = [];
if (missing.length) issues.push(`Missing in ${path.basename(FILE)}: ${missing.join(', ')}`);
if (empty.length) issues.push(`Empty values in ${path.basename(FILE)}: ${empty.join(', ')}`);
if (extras.length) issues.push(`Unknown keys in ${path.basename(FILE)} (not in ${path.basename(EXAMPLE)}): ${extras.join(', ')}`);

if (!SILENT) {
  if (issues.length === 0) {
    console.log(`.env validation OK (${path.basename(FILE)} vs ${path.basename(EXAMPLE)})`);
  } else {
    const level = STRICT ? 'ERROR' : 'WARN';
    console.log(`[env-validate:${level}]`);
    for (const i of issues) console.log(`- ${i}`);
    if (!STRICT) console.log('Tip: Copy .env.example to .env and fill required variables.');
  }
}

if (STRICT && issues.length) process.exit(1);
