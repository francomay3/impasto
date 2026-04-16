#!/usr/bin/env bun
/**
 * Runs the full project check pipeline: every step executes even if a prior step failed,
 * so all issues are visible in one run. Exits 1 if any step failed.
 *
 * Child output is suppressed here (one PASS/FAIL line per step). Each step is the same
 * command as in package.json / your shell — run that command alone to see full logs.
 */

import { join } from 'path';

const ROOT = join(import.meta.dir, '..');

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
} as const;

type Step = { label: string; cmd: string[] };

const steps: Step[] = [
  { label: 'TypeScript', cmd: ['bun', 'tsc'] },
  { label: 'ESLint', cmd: ['bun', 'lint'] },
  { label: 'Knip', cmd: ['bun', 'knip'] },
  { label: 'File length', cmd: ['bun', 'file-length-limit'] },
  { label: 'Vitest (coverage)', cmd: ['bun', 'vitest', 'run', '--coverage'] },
  { label: 'Cargo tests', cmd: ['cargo', 'test', '--workspace'] },
];

function parseArgs(argv: string[]): { help: boolean } {
  for (const a of argv.slice(2)) {
    if (a === '-h' || a === '--help') return { help: true };
    if (a.startsWith('-')) {
      console.error(`${c.red}error:${c.reset} unknown option ${a}`);
      process.exit(2);
    }
  }
  return { help: false };
}

function printHelp(): void {
  console.log(
    `${c.bold}project-check${c.reset} — run all quality gates with quiet per-step lines.\n`
  );
  console.log(`  ${c.dim}bun scripts/project-check.ts${c.reset}`);
  console.log(
    `\nWhen a step fails, run the ${c.yellow}Same check alone${c.reset} line from the repo root to see that tool’s full output.`
  );
}

function runStep(step: Step): { ok: boolean } {
  const result = Bun.spawnSync({
    cmd: step.cmd,
    cwd: ROOT,
    stdout: 'pipe',
    stderr: 'pipe',
  });
  return { ok: result.exitCode === 0 };
}

function padLabel(label: string, width: number): string {
  return label.length >= width ? label : label + ' '.repeat(width - label.length);
}

if (parseArgs(process.argv).help) {
  printHelp();
  process.exit(0);
}

const labelWidth = Math.max(...steps.map((s) => s.label.length));

console.log(`${c.dim}Project check (all steps)${c.reset}\n`);

let anyFailed = false;
for (const step of steps) {
  const { ok } = runStep(step);
  const label = padLabel(step.label, labelWidth);
  const solo = step.cmd.join(' ');
  if (ok) {
    console.log(`${c.green}PASS${c.reset}  ${label}`);
  } else {
    anyFailed = true;
    console.log(`${c.red}FAIL${c.reset}  ${label}`);
    console.log(`       ${c.dim}check full output:${c.reset} ${c.yellow}${solo}${c.reset}`);
  }
}

process.exit(anyFailed ? 1 : 0);
