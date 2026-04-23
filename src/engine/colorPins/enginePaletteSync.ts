import type { RawImage } from '../../types';
import type { PaletteResolver, ResolvedPaletteEntry } from '../palette/paletteResolver';
import type { ResolvedPaletteState } from '../palette/ResolvedPaletteState';
import type { ViewportPipeline } from '../pipeline/ViewportPipeline';
import type { ColorPinState } from './ColorPinState';
import type { ColorPin } from './colorPinTypes';

type PinDiffSig = { id: string; imageX: number; imageY: number; radiusPx: number };

function pinSig(p: ColorPin): PinDiffSig {
  return { id: p.id, imageX: p.imageX, imageY: p.imageY, radiusPx: p.radiusPx };
}

function pinMoved(a: PinDiffSig, b: PinDiffSig): boolean {
  return a.imageX !== b.imageX || a.imageY !== b.imageY || a.radiusPx !== b.radiusPx;
}

/**
 * Per-pin palette orchestrator. Each ColorPinState notify is diffed against the previous pin
 * snapshot: only added or moved pins re-resolve, removed pins are dropped, color-only changes
 * (the resolver's own display-hex write-back) are ignored. Every resolved entry writes a single
 * keyed slot in {@link ResolvedPaletteState}; a subscription on that state coalesces pipeline
 * pushes into one `setIndexedPaletteConfig` per microtask.
 *
 * Why this shape: the previous batch resolver (`resolve(all pins) → all entries`) forced whole-
 * palette recomputation on every pointer move and created unavoidable sampled-vs-mixed races.
 * Per-pin flow eliminates those — moving pin A only touches A's entry, and B/C/D/E keep their
 * cached mixes without paying another worker round-trip.
 */
export class EnginePaletteSync {
  private resolver: PaletteResolver;
  private readonly colorPins: ColorPinState;
  private readonly getPipeline: () => ViewportPipeline | undefined;
  private readonly isDisposed: () => boolean;
  private readonly resolved: ResolvedPaletteState;
  private syncDisposed = false;
  /** Per-pin AbortController for in-flight async resolves; aborted when pin moves again or is removed. */
  private readonly inflight = new Map<string, AbortController>();
  private prevSnapshot: readonly PinDiffSig[] = [];
  private pushScheduled = false;
  private unsubscribePins: (() => void) | null = null;
  private unsubscribeResolved: (() => void) | null = null;
  /**
   * Set while the resolver writes its own `displayHex` back into ColorPinState via repositionMany.
   * That notify fires our diff subscriber; without this guard the diff would run redundantly,
   * and any color-only change would produce an extra no-op pass.
   */
  private applyingResolverRecolor = false;

  constructor(
    colorPins: ColorPinState,
    getPipeline: () => ViewportPipeline | undefined,
    isDisposed: () => boolean,
    resolved: ResolvedPaletteState,
    initialResolver: PaletteResolver,
  ) {
    this.colorPins = colorPins;
    this.getPipeline = getPipeline;
    this.isDisposed = isDisposed;
    this.resolved = resolved;
    this.resolver = initialResolver;
    this.unsubscribePins = this.colorPins.subscribe(() => this.onPinsChanged());
    this.unsubscribeResolved = this.resolved.subscribe(() => this.schedulePush());
    this.onPinsChanged();
  }

  dispose(): void {
    this.syncDisposed = true;
    this.unsubscribePins?.();
    this.unsubscribeResolved?.();
    this.unsubscribePins = null;
    this.unsubscribeResolved = null;
    for (const ac of this.inflight.values()) ac.abort();
    this.inflight.clear();
    this.resolved.clear();
  }

  setResolver(next: PaletteResolver): void {
    for (const ac of this.inflight.values()) ac.abort();
    this.inflight.clear();
    this.resolved.clear();
    this.resolver = next;
    this.prevSnapshot = [];
    this.onPinsChanged();
  }

  /**
   * Called by the filter chain when new filtered pixels land. Every pin's sampled hex depends on
   * the filtered bitmap, so force a full re-resolve by clearing the diff baseline.
   */
  flushFromPins(_filtered?: RawImage | null): void {
    if (this.isDisposed() || this.syncDisposed) return;
    this.prevSnapshot = [];
    this.onPinsChanged();
  }

  /** Back-compat for callers that used the previous API; now equivalent to a notify-triggered pass. */
  scheduleRebuild(): void {
    this.onPinsChanged();
  }

  private onPinsChanged(): void {
    if (this.isDisposed() || this.syncDisposed) return;
    if (this.applyingResolverRecolor) return;
    const pipeline = this.getPipeline();
    if (!pipeline) return;
    const pins = this.colorPins.getAll();
    const currById = new Map(pins.map((p) => [p.id, pinSig(p)]));
    const prevById = new Map(this.prevSnapshot.map((s) => [s.id, s]));
    const toResolve: ColorPin[] = [];
    for (const pin of pins) {
      const prev = prevById.get(pin.id);
      if (!prev || pinMoved(prev, pinSig(pin))) toResolve.push(pin);
    }
    const removedIds: string[] = [];
    for (const id of prevById.keys()) if (!currById.has(id)) removedIds.push(id);
    this.prevSnapshot = pins.map(pinSig);
    for (const id of removedIds) {
      this.inflight.get(id)?.abort();
      this.inflight.delete(id);
    }
    this.resolved.retainPinIds(currById.keys());
    const img = pipeline.getLastFilteredImage();
    for (const pin of toResolve) this.resolvePin(pin, img);
  }

  private resolvePin(pin: ColorPin, img: RawImage | null): void {
    this.inflight.get(pin.id)?.abort();
    this.inflight.delete(pin.id);
    const sync = this.resolver.tryResolvePinSync(pin, img);
    if (sync) {
      this.applyEntry(sync);
      return;
    }
    const ac = new AbortController();
    this.inflight.set(pin.id, ac);
    void this.resolver.resolvePinAsync(pin, img, ac.signal)
      .then((entry) => {
        if (ac.signal.aborted || this.isDisposed() || this.syncDisposed) return;
        if (this.inflight.get(pin.id) !== ac) return;
        this.inflight.delete(pin.id);
        this.applyEntry(entry);
      })
      .catch((err: unknown) => {
        if (this.inflight.get(pin.id) === ac) this.inflight.delete(pin.id);
        if (err instanceof DOMException && err.name === 'AbortError') return;
        throw err;
      });
  }

  private applyEntry(entry: ResolvedPaletteEntry): void {
    this.resolved.setEntry(entry);
    this.writeBackPinColor(entry);
  }

  private writeBackPinColor(entry: ResolvedPaletteEntry): void {
    const pin = this.colorPins.getAll().find((p) => p.id === entry.pinId);
    if (!pin || pin.color === entry.displayHex) return;
    this.applyingResolverRecolor = true;
    try {
      this.colorPins.repositionMany([
        { id: pin.id, imageX: pin.imageX, imageY: pin.imageY, color: entry.displayHex },
      ]);
    } finally {
      this.applyingResolverRecolor = false;
    }
  }

  private schedulePush(): void {
    if (this.pushScheduled) return;
    this.pushScheduled = true;
    queueMicrotask(() => {
      this.pushScheduled = false;
      if (this.isDisposed() || this.syncDisposed) return;
      const pipeline = this.getPipeline();
      if (!pipeline) return;
      const entries = this.resolved.getAll();
      pipeline.setIndexedPaletteConfig({
        palette: entries.map((e) => e.lab),
        pinIds: entries.map((e) => e.pinId),
      });
    });
  }
}
