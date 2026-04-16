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
