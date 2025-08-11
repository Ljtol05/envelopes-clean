#!/usr/bin/env node
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

// Project root is one directory up from scripts folder
const root = path.resolve(new URL('.', import.meta.url).pathname, '..');
const srcDir = path.join(root, 'src');

let failures = [];

function walk(dir){
  for(const entry of readdirSync(dir, { withFileTypes: true })){
    if(entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if(entry.isDirectory()) walk(full);
    else if(/\.(tsx|jsx)$/.test(entry.name)) inspect(full);
  }
}

// Heuristic: if a className string includes bg-[color:var(--owl-accent)] (or full accent background)
// and in the same quoted class segment there is not also text-[color:var(--owl-accent-fg,var(--owl-bg))] or text-[color:var(--owl-accent-fg)]
// then flag it. We skip files under ui/ (primitive components may be styled differently) and any line with 'hover:' only usage.

// Match solid accent background only (ignore translucent /10 etc)
const ACCENT_BG_REGEX = /bg-\[color:var\(--owl-accent\)\](?![^"'`]*\/)(?![^"'`]*hover)/g;
const ACCENT_TEXT_FG_REGEX = /text-\[color:var\(--owl-accent-fg(?:,var\(--owl-bg\))?\)\]/;

function inspect(file){
  if(file.includes(path.sep + 'components' + path.sep + 'ui' + path.sep)) return; // skip ui primitives
  const content = readFileSync(file, 'utf8');
  const lines = content.split(/\n/);
  lines.forEach((line, idx) => {
    if(ACCENT_BG_REGEX.test(line)){
      // reset regex state by recreating it per line
      const hasFg = ACCENT_TEXT_FG_REGEX.test(line);
      if(!hasFg){
        failures.push({ file, line: idx+1, snippet: line.trim() });
      }
    }
  });
}

walk(srcDir);

if(failures.length){
  console.error('\nAccent usage validation FAILED:');
  for(const f of failures){
    console.error(`- ${path.relative(root, f.file)}:${f.line} => ${f.snippet}`);
  }
  console.error('\nEnsure accent backgrounds include text-[color:var(--owl-accent-fg,var(--owl-bg))] (or accent-fg).');
  process.exit(1);
} else {
  console.log('Accent usage validation passed (no missing accent-fg on accent backgrounds).');
}
