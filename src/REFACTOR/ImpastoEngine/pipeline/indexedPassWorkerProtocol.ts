/** LAB palette entry JSON (`{ l, a, b }`); generated from Rust to match `img_index`. */
export type { IndexedPaletteLab } from '../../../wasm/generated/IndexedPaletteLab';

/** Message shape posted to `img-index.worker` from {@link IndexedPassRunner}. */
export interface IndexedPassWorkerInput {
  pixels: Uint8Array;
  width: number;
  height: number;
  sigma: number;
  paletteJson: string;
}

/** Message shape received from `img-index.worker` in {@link IndexedPassRunner}. */
export interface IndexedPassWorkerOutput {
  buffer: ArrayBuffer;
}
