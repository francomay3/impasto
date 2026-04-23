import type { RawImage } from '../../types';
import type { PaletteResolver, PaletteResolverContext } from '../palette/paletteResolver';
import { ResolvedPaletteState } from '../palette/ResolvedPaletteState';
import type { ViewportPipeline } from '../pipeline/ViewportPipeline';
import type { ColorPinState } from './ColorPinState';
import { buildPaletteRecolorUpdates } from './enginePaletteSyncApply';

/**
 * Coalesces color-pin changes into a single indexed-palette flush on the next microtask, and applies palette
 * updates when the filtered image changes. Delegates LAB/display derivation to a {@link PaletteResolver}.
 */
export class EnginePaletteSync {
  private paletteRebuildScheduled = false;
  /** When true, another `scheduleRebuild` arrived while a microtask was already queued — run another flush pass. */
  private paletteRebuildAgain = false;
  private resolver: PaletteResolver;
  private abortInFlight: AbortController | null = null;
  private flushGeneration = 0;
  private syncDisposed = false;
  private readonly colorPins: ColorPinState;
  private readonly getPipeline: () => ViewportPipeline | undefined;
  private readonly isDisposed: () => boolean;
  private readonly resolved: ResolvedPaletteState;

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
  }

  dispose(): void {
    this.syncDisposed = true;
    this.abortInFlight?.abort();
    this.abortInFlight = null;
    this.resolved.clear();
  }

  setResolver(next: PaletteResolver): void {
    this.resolver = next;
    this.scheduleRebuild();
  }

  scheduleRebuild(): void {
    this.flushGeneration += 1;
    if (this.paletteRebuildScheduled) {
      this.paletteRebuildAgain = true;
      return;
    }
    this.paletteRebuildScheduled = true;
    queueMicrotask(() => {
      this.paletteRebuildScheduled = false;
      if (this.isDisposed()) return;
      do {
        this.paletteRebuildAgain = false;
        if (this.isDisposed()) return;
        this.flushFromPins();
      } while (this.paletteRebuildAgain);
    });
  }

  /**
   * Recomputes palette rows from pins + filtered bitmap via the active resolver, pushes into the index runner, and
   * mirrors resolver rows into {@link ResolvedPaletteState}. Pin display colors follow the sampled path for
   * `sampled` resolver id; otherwise {@link ResolvedPaletteEntry.displayHex} drives swatches.
   */
  flushFromPins(filtered?: RawImage | null): void {
    if (this.isDisposed() || this.syncDisposed) return;
    const pipeline = this.getPipeline();
    if (!pipeline) return;
    if (filtered !== undefined) {
      this.flushGeneration += 1;
    }
    const myGen = this.flushGeneration;
    const img = filtered !== undefined ? filtered : pipeline.getLastFilteredImage();
    const pins = this.colorPins.getAll();
    const ctx: PaletteResolverContext = { filteredImage: img, pins };

    this.abortInFlight?.abort();
    const ac = new AbortController();
    this.abortInFlight = ac;
    const signal = ac.signal;
    const resolvingResolverId = this.resolver.id;
    const run = this.resolver.resolve(ctx, signal);

    void run
      .then((result) => {
        if (signal.aborted || this.isDisposed() || this.syncDisposed || myGen !== this.flushGeneration) {
          return;
        }
        const palette = result.entries.map((e) => e.lab);
        const pinIds = result.entries.map((e) => e.pinId);
        pipeline.setIndexedPaletteConfig({ palette, pinIds });
        this.resolved.setEntries(result.entries);
        const imgNow = pipeline.getLastFilteredImage();
        const pinsNow = this.colorPins.getAll();
        const recolor = buildPaletteRecolorUpdates(imgNow, pinsNow, result, resolvingResolverId);
        if (recolor.length > 0) {
          this.colorPins.repositionMany(recolor);
        }
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        throw err;
      });
  }
}
