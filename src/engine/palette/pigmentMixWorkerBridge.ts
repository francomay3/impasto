import MixPaletteWorker from '../../workers/mix-palette.worker?worker';
import type { Pigment } from '../../types';
import type { MixEntry } from '../../services/ColorMixer';
import type { IndexedPaletteLab } from '../pipeline/indexedPassTypes';

/** One pin's mix result: the realized LAB plus the recipe that produced it. */
export type MixOneResult = { lab: IndexedPaletteLab; recipe: MixEntry[] };

export type PigmentMixSettings = {
  pigments: Pigment[];
  minPaintPercent: number;
  deltaThreshold: number;
  /**
   * Opaque cache-key suffix identifying the pigment set + thresholds. When this changes, cached
   * mixes from a previous setting are invalidated. Supplied by the resolver (its own `version`).
   */
  settingsVersion: string;
};

function abortDom(): DOMException {
  return new DOMException('aborted', 'AbortError');
}

type Pending = {
  hex: string;
  resolve: (v: MixOneResult) => void;
  reject: (e: Error) => void;
};

/**
 * Single mix-palette worker with per-hex caching + concurrent-request dedup. The old `mix({hexes})`
 * batch API terminated the worker on every new request; for per-pin drag that meant no mix ever
 * completed between throttled pointer moves. This bridge instead queues one hex at a time, caches
 * results by `${settingsVersion}:${hex}`, and coalesces concurrent duplicate requests.
 */
export class PigmentMixWorkerBridge {
  private worker: Worker;
  private readonly cache = new Map<string, MixOneResult>();
  private readonly inflight = new Map<string, Promise<MixOneResult>>();
  private readonly queue: Pending[] = [];
  private active: Pending | null = null;
  private disposed = false;

  constructor() {
    this.worker = new MixPaletteWorker();
    this.wireWorker();
  }

  private wireWorker(): void {
    this.worker.onmessage = (e: MessageEvent<{ labs: IndexedPaletteLab[]; recipes: MixEntry[][] }>) => {
      const active = this.active;
      this.active = null;
      if (!active) return;
      const lab = e.data.labs[0];
      const recipe = e.data.recipes[0];
      if (!lab || !recipe) {
        active.reject(new Error('mix-palette worker returned empty payload'));
      } else {
        active.resolve({ lab, recipe });
      }
      this.pumpQueue();
    };
    this.worker.onerror = () => {
      const active = this.active;
      this.active = null;
      if (active) active.reject(new DOMException('mix-palette worker error', 'DataError'));
      this.pumpQueue();
    };
  }

  private cacheKey(hex: string, settingsVersion: string): string {
    return `${settingsVersion}:${hex}`;
  }

  tryGetCached(hex: string, settingsVersion: string): MixOneResult | null {
    return this.cache.get(this.cacheKey(hex, settingsVersion)) ?? null;
  }

  mixOne(hex: string, settings: PigmentMixSettings, signal: AbortSignal): Promise<MixOneResult> {
    if (this.disposed) return Promise.reject(abortDom());
    if (signal.aborted) return Promise.reject(abortDom());
    const key = this.cacheKey(hex, settings.settingsVersion);
    const cached = this.cache.get(key);
    if (cached) return Promise.resolve(cached);
    // Dedup: multiple pins sampling the same hex at once share one worker call.
    const existing = this.inflight.get(key);
    if (existing) return this.withAbort(existing, signal);
    const run = new Promise<MixOneResult>((resolve, reject) => {
      this.queue.push({ hex, resolve, reject });
      this.pumpQueue(settings);
    }).then((result) => {
      this.cache.set(key, result);
      this.inflight.delete(key);
      return result;
    }, (err) => {
      this.inflight.delete(key);
      throw err;
    });
    this.inflight.set(key, run);
    return this.withAbort(run, signal);
  }

  private withAbort(p: Promise<MixOneResult>, signal: AbortSignal): Promise<MixOneResult> {
    if (!signal) return p;
    return new Promise<MixOneResult>((resolve, reject) => {
      if (signal.aborted) { reject(abortDom()); return; }
      const onAbort = () => reject(abortDom());
      signal.addEventListener('abort', onAbort, { once: true });
      p.then(
        (v) => { signal.removeEventListener('abort', onAbort); resolve(v); },
        (e) => { signal.removeEventListener('abort', onAbort); reject(e); },
      );
    });
  }

  /** Kept for the queued tail to know which settings to post. */
  private lastSettings: PigmentMixSettings | null = null;

  private pumpQueue(settings?: PigmentMixSettings): void {
    if (settings) this.lastSettings = settings;
    if (this.active !== null) return;
    const next = this.queue.shift();
    if (!next) return;
    if (!this.lastSettings) {
      next.reject(new Error('mix-palette worker: no settings available'));
      this.pumpQueue();
      return;
    }
    this.active = next;
    this.worker.postMessage({
      hexes: [next.hex],
      pigments: this.lastSettings.pigments,
      minPaintPercent: this.lastSettings.minPaintPercent,
      deltaThreshold: this.lastSettings.deltaThreshold,
    });
  }

  dispose(): void {
    this.disposed = true;
    this.cache.clear();
    this.inflight.clear();
    while (this.queue.length) {
      const q = this.queue.shift();
      q?.reject(abortDom());
    }
    if (this.active) {
      this.active.reject(abortDom());
      this.active = null;
    }
    this.worker.terminate();
  }
}
