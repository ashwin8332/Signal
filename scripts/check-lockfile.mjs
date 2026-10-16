#!/usr/bin/env node
/**
 * Guards against an npm bug: installing on one OS can leave optional
 * platform packages (native bindings for other OSes) out of
 * package-lock.json. `npm ci` on CI/Vercel then fails with
 * "Missing: <pkg> from lock file". This checks that every optional
 * dependency of every locked package resolves to a lockfile entry, the
 * same way npm resolves node_modules (nearest ancestor wins).
 *
 * Fix when it fails: rm -rf node_modules package-lock.json && npm install
 */
import { readFileSync } from 'node:fs';

const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));
const packages = lock.packages ?? {};

function resolves(from, name) {
  let base = from;
  for (;;) {
    if (packages[`${base ? `${base}/` : ''}node_modules/${name}`]) return true;
    if (!base) return false;
    const cut = base.lastIndexOf('/node_modules/');
    base = cut < 0 ? '' : base.slice(0, cut);
  }
}

const missing = [];
for (const [path, meta] of Object.entries(packages)) {
  if (!path) continue;
  for (const dep of Object.keys(meta.optionalDependencies ?? {})) {
    if (!resolves(path, dep)) missing.push(`${path} -> ${dep}`);
  }
}

if (missing.length > 0) {
  console.error(`package-lock.json is missing ${missing.length} optional dependencies:\n  ${missing.join('\n  ')}`);
  console.error('\nFix: rm -rf node_modules package-lock.json && npm install');
  process.exit(1);
}
console.log('package-lock.json: all optional dependencies are locked.');
