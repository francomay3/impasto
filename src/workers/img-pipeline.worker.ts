import type { FilterInstance } from '../types';
import type { WasmExports } from '../wasm/img_ops/img_ops';
import imgOpsWasmUrl from '../wasm/img_ops/img_ops_bg.wasm?url';

type WasmMod = typeof import('../wasm/img_ops/img_ops.js');
type Input = { pixels: Uint8Array; width: number; height: number; filters: FilterInstance[]; dirtyIndex: number };

let mod: WasmMod | null = null;
let wasmExports: WasmExports | null = null;

const ready = import('../wasm/img_ops/img_ops.js').then(async (m) => {
  wasmExports = await m.default({ module_or_path: imgOpsWasmUrl });
  mod = m;
});

(self as unknown as Worker).onmessage = async (e: MessageEvent<Input>) => {
  await ready;
  const { pixels, width, height, filters, dirtyIndex } = e.data;
  const size = width * height * 4;

  // Claim a persistent WASM buffer. Only re-allocates when dimensions grow.
  const ptr = mod!.request_buffer(width, height);

  // Single JS→WASM copy: write incoming pixels directly into WASM linear memory.
  new Uint8Array(wasmExports!.memory.buffer, ptr, size).set(pixels);

  const steps: ArrayBuffer[] = [];

  for (const filter of filters) {
    // Process in-place — no allocation on the WASM side for non-blur filters.
    // Blur allocates internally (fastblur constraint) but stays inside WASM.
    mod!.process_inplace(ptr, size, width, height, JSON.stringify([filter]));

    // Snapshot this step for the cache. Re-read memory.buffer on each iteration:
    // WASM may grow its address space during string marshalling in process_inplace,
    // which detaches any previously held ArrayBuffer reference.
    steps.push(new Uint8Array(wasmExports!.memory.buffer, ptr, size).slice().buffer);
  }

  (self as unknown as Worker).postMessage({ steps, dirtyIndex }, steps);
};
