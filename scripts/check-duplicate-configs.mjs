#!/usr/bin/env node
/**
 * Fails if duplicate / legacy config files that could shadow the canonical ones exist.
 * Canonical files kept:
 *  - babel.config.cjs
 *  - eslint.config.js (flat config)
 *  - styleMock.cjs (Jest CSS mock)
 */
import { existsSync } from 'node:fs';

const duplicates = [
  'babel.config.js',
  'babel.config.mjs',
  'eslint.config.cjs',
  '.eslintignore',
  'styleMock.js'
];

const present = duplicates.filter(existsSync);

if (present.length) {
  console.error(`Duplicate/legacy config files found that should be removed: \n  - ${present.join('\n  - ')}\nFix: delete these to avoid ambiguity.`);
  process.exit(1);
} else {
  console.log('Duplicate config check: OK');
}
