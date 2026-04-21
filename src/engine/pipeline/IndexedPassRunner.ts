import { createRawImage, type RawImage } from '../../types';
import { DEFAULT_INDEX_BLUR_SIGMA } from '../infra/engineConstants';
import { useColorPinCoverageStore } from '../colorPins/colorPinCoverageStore';
import { IndexedPassWorkerBridge } from './indexedPassWorkerBridge';
import type { IndexedPaletteLab } from './indexedPassTypes';
import type { IndexedPassWorkerInput } from './indexedPassWorkerProtocol';

export type IndexedPassRunnerPaletteConfig = {
  palette: IndexedPaletteLab[];
  pinIds: string[];
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
  private readonly bridge: IndexedPassWorkerBridge;

  private _state: IndexedPassRunnerState = { indexedStatus: 'idle', indexedError: null };
  private workerBusy = false;
  private pendingRun = false;
  private _lastFiltered: RawImage | null = null;
  private _indexBlurSigma = DEFAULT_INDEX_BLUR_SIGMA;
  private _indexPalette: IndexedPaletteLab[] = [];
  private _pinIds: string[] = [];

  constructor(onIndexedOutput: (img: RawImage) => void, onStateChange?: IndexedPassStateListener) {
    this.onIndexedOutput = onIndexedOutput;
    this.onStateChange = onStateChange;
    this.bridge = new IndexedPassWorkerBridge({
      onOutput: (indexed, coverageCounts) => {
        this.onIndexedOutput(indexed);
        this.flushCoverageStore(coverageCounts);
        this.patchState({ indexedStatus: 'ready', indexedError: null });
      },
      onError: (msg) => {
        this.patchState({ indexedStatus: 'error', indexedError: msg });
      },
      onSettled: () => {
        this.workerBusy = false;
        this.pumpQueue();
      },
    });
  }

  getState(): IndexedPassRunnerState { return this._state; }

  /**
   * LAB palette + pin IDs for `img-index`. Empty palette clears indexed output to a 1×1 transparent pixel,
   * no worker runs (`indexedStatus` → `idle`).
   */
  setIndexedPaletteConfig(config: IndexedPassRunnerPaletteConfig): void {
    this._indexPalette = structuredClone(config.palette);
    this._pinIds = [...config.pinIds];
    this.scheduleIndexedPass();
  }

  getIndexBlurSigma(): number { return this._indexBlurSigma; }

  setIndexBlurSigma(sigma: number): void {
    const next = Number.isFinite(sigma) ? Math.max(0, sigma) : 0;
    if (next === this._indexBlurSigma) return;
    this._indexBlurSigma = next;
    this.onStateChange?.(this._state);
    this.scheduleIndexedPass();
  }

  setFilteredImage(img: RawImage): void {
    this._lastFiltered = img;
    this.scheduleIndexedPass();
  }

  /** Updates the filtered bitmap without scheduling the index pass (caller will push palette via {@link setIndexedPaletteConfig}). */
  setLastFilteredImageOnly(img: RawImage): void { this._lastFiltered = img; }

  getLastFilteredImage(): RawImage | null { return this._lastFiltered; }

  clearIndexedToIdle(): void { this.clearIndexedOutput(); }

  dispose(): void {
    this.bridge.dispose();
    this.workerBusy = false;
    this.pendingRun = false;
  }

  private patchState(patch: Partial<IndexedPassRunnerState>): void {
    this._state = { ...this._state, ...patch };
    this.onStateChange?.(this._state);
  }

  private scheduleIndexedPass(): void {
    this.pendingRun = true;
    if (this.workerBusy) return;
    this.pendingRun = false;
    this.runIndexedPass();
  }

  private pumpQueue(): void {
    if (this.pendingRun) {
      this.pendingRun = false;
      this.runIndexedPass();
    }
  }

  private clearIndexedOutput(): void {
    this.onIndexedOutput(blankImage());
    useColorPinCoverageStore.getState().clearCoverage();
    this.patchState({ indexedStatus: 'idle', indexedError: null });
  }

  private flushCoverageStore(coverageCounts: number[]): void {
    const record: Record<string, number> = {};
    for (let i = 0; i < this._pinIds.length && i < coverageCounts.length; i++) {
      record[this._pinIds[i]] = coverageCounts[i];
    }
    useColorPinCoverageStore.getState().setCoverage(record);
  }

  private runIndexedPass(): void {
    const img = this._lastFiltered;
    if (!img || this._indexPalette.length === 0) {
      this.clearIndexedOutput();
      return;
    }
    const pixelsCopy = new Uint8Array(img.data);
    this.workerBusy = true;
    this.patchState({ indexedStatus: 'indexing', indexedError: null });
    const input: IndexedPassWorkerInput = {
      pixels: pixelsCopy,
      width: img.width,
      height: img.height,
      sigma: this._indexBlurSigma,
      paletteJson: JSON.stringify(this._indexPalette),
    };
    this.bridge.dispatch(input, { width: img.width, height: img.height });
  }
}
