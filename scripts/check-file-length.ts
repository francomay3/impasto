#!/usr/bin/env bun
/**
 * Enforces the 160-line limit on all source files (src/**\/*.ts, src/**\/*.tsx).
 * Exits with code 1 if any file exceeds the limit so CI/typecheck fails.
 */

import { readdirSync, readFileSync } from 'fs';
import { join, relative } from 'path';

const MAX_LINES = 160;
const ROOT = join(import.meta.dir, '..');
const SRC = join(ROOT, 'src');

// add any files here that should be exempt from the line limit
const SKIPPED = new Set<string>();

function collectFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((e) => {
    const full = join(dir, e.name);
    if (e.isDirectory()) return collectFiles(full);
    if (e.isFile() && /\.(ts|tsx)$/.test(e.name)) return [full];
    return [];
  });
}

const files = collectFiles(SRC);
const violations: { file: string; lines: number }[] = [];

for (const file of files) {
  const rel = relative(ROOT, file);
  if (SKIPPED.has(rel)) continue;
  const content = readFileSync(file, 'utf8');
  const lines = content.split('\n').length;
  if (lines > MAX_LINES) {
    violations.push({ file: rel, lines });
  }
}

if (violations.length > 0) {
  console.error('\n[check-file-length] Files exceeding the 160-line limit:\n');
  for (const { file, lines } of violations) {
    console.error(`  ${lines.toString().padStart(4)} lines  ${file}`);
  }
  console.error(`\n${violations.length} file(s) must be split before merging.\n`);
  process.exit(1);
}

console.log(`[check-file-length] All ${files.length} files are within the 160-line limit.`);
