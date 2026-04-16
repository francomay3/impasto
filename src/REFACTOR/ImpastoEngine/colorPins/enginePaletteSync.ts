import type { RawImage } from '../../../types';
import type { ColorPinState } from './ColorPinState';
import { labsForColorPinsFromFilteredImage } from './indexedPaletteFromColorPins';
import type { ViewportPipeline } from '../pipeline/ViewportPipeline';

/**
 * Coalesces color-pin changes into a single indexed-palette flush on the next microtask,
 * and applies palette updates when the filtered image changes.
 */
export class EnginePaletteSync {
  private paletteRebuildScheduled = false;
  private readonly colorPins: ColorPinState;
  private readonly getPipeline: () => ViewportPipeline | undefined;
  private readonly isDisposed: () => boolean;

  constructor(
    colorPins: ColorPinState,
    getPipeline: () => ViewportPipeline | undefined,
    isDisposed: () => boolean,
  ) {
    this.colorPins = colorPins;
    this.getPipeline = getPipeline;
    this.isDisposed = isDisposed;
  }

  scheduleRebuild(): void {
    if (this.paletteRebuildScheduled) {
      return;
    }
    this.paletteRebuildScheduled = true;
    queueMicrotask(() => {
      this.paletteRebuildScheduled = false;
      if (this.isDisposed()) {
        return;
      }
      this.flushFromPins();
    });
  }

  /**
   * Recomputes LAB from geometry-only pins + filtered bitmap and pushes config into the index runner.
   * LAB exists only inside the indexed pass worker; pin state never stores colors.
   */
  flushFromPins(filtered?: RawImage | null): void {
    if (this.isDisposed()) {
      return;
    }
    const pipeline = this.getPipeline();
    if (!pipeline) {
      return;
    }
    const img = filtered !== undefined ? filtered : pipeline.getLastFilteredImage();
    const pins = this.colorPins.getAll();
    const palette = labsForColorPinsFromFilteredImage(img, pins);
    pipeline.setIndexedPaletteConfig({ palette });
  }
}
