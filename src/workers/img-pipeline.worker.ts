import type { FilterInstance } from '../types';
import imgOpsWasmUrl from '../wasm/img_ops/img_ops_bg.wasm?url';

type ApplyFn = (pixels: Uint8Array, width: number, height: number, json: string) => Uint8Array;
type Input = { pixels: Uint8Array; width: number; height: number; filters: FilterInstance[]; dirtyIndex: number };

let applyPipeline: ApplyFn | null = null;

const ready = import('../wasm/img_ops/img_ops.js').then(async (mod) => {
  await mod.default({ module_or_path: imgOpsWasmUrl });
  applyPipeline = mod.apply_pipeline as ApplyFn;
});

(self as unknown as Worker).onmessage = async (e: MessageEvent<Input>) => {
  await ready;
  const { pixels, width, height, filters, dirtyIndex } = e.data;

  // Apply each filter individually so we can return intermediate results for caching.
  const steps: ArrayBuffer[] = [];
  let current = pixels;

  for (const filter of filters) {
    const result = applyPipeline!(current, width, height, JSON.stringify([filter]));
    steps.push(result.buffer);
    current = result;
  }

  (self as unknown as Worker).postMessage({ steps, dirtyIndex }, steps);
};
