import type { RawImage } from '../../../types';
import { createRawImage } from '../../../types';
import ImgIndexWorker from '../../../workers/img-index.worker?worker';
import { DEFAULT_INDEX_BLUR_SIGMA } from '../infra/engineConstants';
import type { IndexedPaletteLab } from './indexedPassTypes';
import type { IndexedPassWorkerInput, IndexedPassWorkerOutput } from './indexedPassWorkerProtocol';

type IndexedPassRunnerPaletteConfig = {
  palette: IndexedPaletteLab[];
};

/** Index-worker slice of pipeline state (merged into {@link ViewportPipelineState} at the pipeline level). */
export type IndexedPassRunnerState = {
  indexedStatus: 'idle' | 'indexing' | 'ready' | 'error';
  indexedError: string | null;
};

type IndexedPassStateListener = (state: IndexedPassRunnerState) => void;

function blankImage(): RawImage {
  return createRawImage(new Uint8ClampedArray([0, 0, 0, 0]), 1, 1);
}

/** Runs the `img-index` worker for filtered RGBA + sigma + LAB palette. */
export class IndexedPassRunner {
  private readonly onIndexedOutput: (img: RawImage) => void;
  private readonly onStateChange: IndexedPassStateListener | undefined;

  private _state: IndexedPassRunnerState = {
    indexedStatus: 'idle',
    indexedError: null,
  };

  private indexWorker: Worker | null = null;
  private indexWorkerBusy = false;
  private pendingIndexRun = false;

  /** Latest filtered bitmap; drives the index worker. */
  private _lastFiltered: RawImage | null = null;
  private _indexBlurSigma = DEFAULT_INDEX_BLUR_SIGMA;
  private _indexPalette: IndexedPaletteLab[] = [];

  constructor(onIndexedOutput: (img: RawImage) => void, onStateChange?: IndexedPassStateListener) {
    this.onIndexedOutput = onIndexedOutput;
    this.onStateChange = onStateChange;
    this.initIndexWorker();
  }

  /** Index-worker slice; combined into {@link ViewportPipelineState} by {@link ViewportPipeline}. */
  getState(): IndexedPassRunnerState {
    return this._state;
  }

  /**
   * LAB palette for `img-index`. Blur strength is {@link setIndexBlurSigma} / {@link getIndexBlurSigma}.
   * Empty palette: clears indexed output to a 1×1 transparent pixel, no worker runs (`indexedStatus` → `idle`).
   */
  setIndexedPaletteConfig(config: IndexedPassRunnerPaletteConfig): void {
    this._indexPalette = structuredClone(config.palette);
    this.scheduleIndexedPass();
  }

  /** Gaussian σ for WASM pre-index blur (`apply_index`); does not affect the filtered viewport. */
  getIndexBlurSigma(): number {
    return this._indexBlurSigma;
  }

  setIndexBlurSigma(sigma: number): void {
    const next = Number.isFinite(sigma) ? Math.max(0, sigma) : 0;
    if (next === this._indexBlurSigma) {
      return;
    }
    this._indexBlurSigma = next;
    this.onStateChange?.(this._state);
    this.scheduleIndexedPass();
  }

  /**
   * Latest filtered bitmap (same pixels as the filtered viewport); drives the index worker.
   * Call from the filter pipeline when filtered output changes.
   */
  setFilteredImage(img: RawImage): void {
    this._lastFiltered = img;
    this.scheduleIndexedPass();
  }

  /** Updates the filtered bitmap without scheduling the index pass (caller will push palette via {@link setIndexedPaletteConfig}). */
  setLastFilteredImageOnly(img: RawImage): void {
    this._lastFiltered = img;
  }

  /** Latest filtered bitmap passed to {@link setFilteredImage} (same pixels as the filtered viewport). */
  getLastFilteredImage(): RawImage | null {
    return this._lastFiltered;
  }

  /** Clears indexed output to idle (1×1 transparent) and resets indexed status; use when the source image is cleared. */
  clearIndexedToIdle(): void {
    this.clearIndexedOutput();
  }

  dispose(): void {
    this.indexWorker?.terminate();
    this.indexWorker = null;
    this.indexWorkerBusy = false;
    this.pendingIndexRun = false;
  }

  private patchState(patch: Partial<IndexedPassRunnerState>): void {
    this._state = { ...this._state, ...patch };
    this.onStateChange?.(this._state);
  }

  private initIndexWorker(): void {
    const w = new ImgIndexWorker();
    this.indexWorker = w;
    w.onmessage = (e: MessageEvent<IndexedPassWorkerOutput>) => {
      const img = this._lastFiltered;
      const { buffer } = e.data;
      if (!img) {
        this.indexWorkerBusy = false;
        this.pumpIndexQueue();
        return;
      }
      const rgba = new Uint8ClampedArray(buffer);
      const indexed = createRawImage(rgba, img.width, img.height);
      this.onIndexedOutput(indexed);
      this.patchState({ indexedStatus: 'ready', indexedError: null });
      this.indexWorkerBusy = false;
      this.pumpIndexQueue();
    };
    w.onerror = (e) => {
      console.error('[IndexedPassRunner img_index worker]', e);
      this.patchState({ indexedStatus: 'error', indexedError: e.message || 'Index worker error' });
      this.indexWorkerBusy = false;
      this.pumpIndexQueue();
    };
  }

  private scheduleIndexedPass(): void {
    this.pendingIndexRun = true;
    if (this.indexWorkerBusy) return;
    this.pendingIndexRun = false;
    this.runIndexedPass();
  }

  private pumpIndexQueue(): void {
    if (this.pendingIndexRun) {
      this.pendingIndexRun = false;
      this.runIndexedPass();
    }
  }

  private clearIndexedOutput(): void {
    this.onIndexedOutput(blankImage());
    this.patchState({ indexedStatus: 'idle', indexedError: null });
  }

  private runIndexedPass(): void {
    const img = this._lastFiltered;
    if (!img || this._indexPalette.length === 0) {
      this.clearIndexedOutput();
      return;
    }

    const w = this.indexWorker;
    if (!w) {
      this.patchState({ indexedStatus: 'error', indexedError: 'Index worker not initialized' });
      return;
    }

    const pixelsCopy = new Uint8Array(img.data);
    this.indexWorkerBusy = true;
    this.patchState({ indexedStatus: 'indexing', indexedError: null });
    const input: IndexedPassWorkerInput = {
      pixels: pixelsCopy,
      width: img.width,
      height: img.height,
      sigma: this._indexBlurSigma,
      paletteJson: JSON.stringify(this._indexPalette),
    };
    w.postMessage(input, [pixelsCopy.buffer]);
  }
}
