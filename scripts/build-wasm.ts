#!/usr/bin/env bun
/**
 * Compiles the full Rust workspace for wasm32 (including `img_blur`, which is a path
 * dependency of `img_ops` / `img_index` but not a separate JS bundle), then runs
 * wasm-pack for each cdylib crate that exposes bindings to the frontend.
 */
import { spawnSync } from 'child_process';
import { join } from 'path';

const ROOT = join(import.meta.dir, '..');

type Cmd = { label: string; cmd: string; args: string[] };

const steps: Cmd[] = [
  {
    label: 'cargo (workspace, wasm32)',
    cmd: 'cargo',
    args: ['build', '--workspace', '--target', 'wasm32-unknown-unknown'],
  },
  {
    label: 'wasm-pack img_ops',
    cmd: 'wasm-pack',
    args: [
      'build',
      'crates/img_ops',
      '--target',
      'web',
      '--out-dir',
      join(ROOT, 'src/wasm/img_ops'),
    ],
  },
  {
    label: 'wasm-pack img_index',
    cmd: 'wasm-pack',
    args: [
      'build',
      'crates/img_index',
      '--target',
      'web',
      '--out-dir',
      join(ROOT, 'src/wasm/img_index'),
    ],
  },
];

let failed = false;
for (const { label, cmd, args } of steps) {
  const r = spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: 'inherit',
  });
  if (r.error) {
    console.error(r.error);
    process.exit(1);
  }
  if (r.status !== 0) {
    failed = true;
    console.error(`Failed: ${label} (exit ${r.status})`);
    break;
  }
}

if (failed) {
  process.exit(1);
}

console.log('build:wasm OK (workspace + both wasm-pack outputs).');
