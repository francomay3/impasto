import imgIndexWasmUrl from '../wasm/img_index/img_index_bg.wasm?url';

type ApplyFn = (pixels: Uint8Array, width: number, height: number, sigma: number, paletteJson: string) => Uint8Array;
type Input = { pixels: Uint8Array; width: number; height: number; sigma: number; paletteJson: string };

let applyIndex: ApplyFn | null = null;

const ready = import('../wasm/img_index/img_index.js').then(async (mod) => {
  await mod.default({ module_or_path: imgIndexWasmUrl });
  applyIndex = mod.apply_index as ApplyFn;
});

(self as unknown as Worker).onmessage = async (e: MessageEvent<Input>) => {
  try {
    await ready;
    const { pixels, width, height, sigma, paletteJson } = e.data;
    const result = applyIndex!(pixels, width, height, sigma, paletteJson);
    const buffer = result.buffer.slice(result.byteOffset, result.byteOffset + result.byteLength);
    (self as unknown as Worker).postMessage({ buffer }, [buffer]);
  } catch (err) {
    console.error('[img_index worker]', err);
  }
};
