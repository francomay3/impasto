#!/usr/bin/env bun
/**
 * Enforces the 200-line limit on production source under `src/**` (`.ts` / `.tsx`, excluding `*.test.ts`).
 * Counts only lines that contain at least one non-whitespace character outside TypeScript/TSX comment trivia
 * (empty lines and comment-only lines are ignored). Exits with code 1 if any file exceeds the limit.
 */

import { readdirSync, readFileSync } from 'fs';
import { dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';
import * as ts from 'typescript';

const MAX_LINES = 200;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');

// add any files here that should be exempt from the line limit
const SKIPPED = new Set<string>();

function collectCommentRanges(sourceFile: ts.SourceFile): Array<{ pos: number; end: number }> {
  const fullText = sourceFile.getFullText();
  const seen = new Set<string>();
  const out: Array<{ pos: number; end: number }> = [];

  const add = (pos: number, end: number) => {
    const key = `${pos},${end}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ pos, end });
  };

  function walk(node: ts.Node): void {
    ts.forEachLeadingCommentRange(fullText, node.getFullStart(), (pos, end) => {
      add(pos, end);
    });
    ts.forEachTrailingCommentRange(fullText, node.end, (pos, end) => {
      add(pos, end);
    });
    ts.forEachChild(node, walk);
  }

  walk(sourceFile);
  return out;
}

/** Exported for unit tests. */
export function mergeRanges(
  ranges: Array<{ pos: number; end: number }>
): Array<{ pos: number; end: number }> {
  if (ranges.length === 0) return [];
  const sorted = [...ranges].sort((a, b) => a.pos - b.pos);
  const merged: Array<{ pos: number; end: number }> = [];
  let cur = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    const n = sorted[i];
    if (n.pos <= cur.end) cur = { pos: cur.pos, end: Math.max(cur.end, n.end) };
    else {
      merged.push(cur);
      cur = n;
    }
  }
  merged.push(cur);
  return merged;
}

function isInMergedRange(pos: number, merged: Array<{ pos: number; end: number }>): boolean {
  let lo = 0;
  let hi = merged.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const r = merged[mid];
    if (pos < r.pos) hi = mid - 1;
    else if (pos >= r.end) lo = mid + 1;
    else return true;
  }
  return false;
}

function isLineWhitespaceOrNewline(ch: string): boolean {
  return ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n';
}

function countEffectiveLines(content: string, sourceFile: ts.SourceFile): number {
  const merged = mergeRanges(collectCommentRanges(sourceFile));
  const lineStarts: number[] = [0];
  for (let i = 0; i < content.length; i++) {
    if (content.charCodeAt(i) === 10) lineStarts.push(i + 1);
  }

  let count = 0;
  for (let li = 0; li < lineStarts.length; li++) {
    const start = lineStarts[li];
    const end = li + 1 < lineStarts.length ? lineStarts[li + 1] : content.length;
    let lineHasCode = false;
    for (let p = start; p < end; p++) {
      const ch = content[p];
      if (isLineWhitespaceOrNewline(ch)) continue;
      if (!isInMergedRange(p, merged)) {
        lineHasCode = true;
        break;
      }
    }
    if (lineHasCode) count++;
  }
  return count;
}

/** `fileName` is only used to pick TS vs TSX parsing (`.tsx` suffix). Exported for unit tests. */
export function countEffectiveLinesInText(content: string, fileName: string): number {
  const scriptKind = fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(
    fileName,
    content,
    ts.ScriptTarget.Latest,
    true,
    scriptKind
  );
  return countEffectiveLines(content, sourceFile);
}

function collectFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((e) => {
    const full = join(dir, e.name);
    if (e.isDirectory()) return collectFiles(full);
    if (e.isFile() && /\.(ts|tsx)$/.test(e.name) && !e.name.endsWith('.test.ts')) {
      return [full];
    }
    return [];
  });
}

function runCli(): void {
  const files = collectFiles(SRC);
  const violations: { file: string; lines: number }[] = [];

  for (const file of files) {
    const rel = relative(ROOT, file);
    if (SKIPPED.has(rel)) continue;
    const content = readFileSync(file, 'utf8');
    const lines = countEffectiveLinesInText(content, rel);
    if (lines > MAX_LINES) {
      violations.push({ file: rel, lines });
    }
  }

  if (violations.length > 0) {
    console.error('\n[check-file-length] Files exceeding the 200 effective-line limit:\n');
    for (const { file, lines } of violations) {
      console.error(`  ${lines.toString().padStart(4)} effective lines  ${file}`);
    }
    console.error(
      `\n${violations.length} file(s) must be split before merging.\n(Empty lines and full-line / block / JSDoc comment trivia are not counted. *.test.ts files are not checked.)\n`
    );
    process.exit(1);
  }

  console.log(
    `[check-file-length] All ${files.length} files are within the ${MAX_LINES} effective-line limit.`
  );
}

const importMeta = import.meta as ImportMeta & { main?: boolean };
if (importMeta.main === true) {
  runCli();
}
