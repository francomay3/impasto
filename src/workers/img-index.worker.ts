import type { InitOutput } from '../wasm/img_index/img_index';
import imgIndexWasmUrl from '../wasm/img_index/img_index_bg.wasm?url';

type WasmMod = typeof import('../wasm/img_index/img_index.js');

type Input = {
  pixels: Uint8Array;
  width: number;
  height: number;
  sigma: number;
  paletteJson: string;
};

let mod: WasmMod | null = null;
let wasmExports: InitOutput | null = null;

const ready = import('../wasm/img_index/img_index.js').then(async (m) => {
  wasmExports = await m.default({ module_or_path: imgIndexWasmUrl });
  mod = m;
});

(self as unknown as Worker).onmessage = async (e: MessageEvent<Input>) => {
  try {
    await ready;
    const { pixels, width, height, sigma, paletteJson } = e.data;
    const size = width * height * 4;

    // Persistent WASM buffer: single JS→WASM copy, no `apply_index` heap return.
    const ptr = mod!.request_index_buffer(width, height);
    new Uint8Array(wasmExports!.memory.buffer, ptr, size).set(pixels);

    mod!.process_index_inplace(ptr, size, width, height, sigma, paletteJson);

    // Palette string marshalling may grow linear memory; re-read `memory.buffer` before slicing.
    const buffer = new Uint8Array(wasmExports!.memory.buffer, ptr, size).slice().buffer;
    (self as unknown as Worker).postMessage({ buffer }, [buffer]);
  } catch (err) {
    console.error('[img_index worker]', err);
  }
};
