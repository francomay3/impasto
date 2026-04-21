import type { RawImage } from '../../types';
import type { ColorPinState } from './ColorPinState';
import { labsForColorPinsFromFilteredImage, samplePinColorFromFilteredImage } from './indexedPaletteFromColorPins';
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
   * Also resamples each pin's display hex so swatches stay in sync when the filtered image changes
   * (e.g. after a filter parameter edit). The second field in repositionMany will be a no-op on the
   * next microtask cycle if colors haven't changed, breaking the notify loop.
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
    const pinIds = pins.map((p) => p.id);
    pipeline.setIndexedPaletteConfig({ palette, pinIds });

    // Resample display hex for every pin so swatches reflect the current filtered bitmap.
    if (img && pins.length > 0) {
      const recolorUpdates = pins.flatMap((pin) => {
        const color = samplePinColorFromFilteredImage(img, pin);
        return color ? [{ id: pin.id, imageX: pin.imageX, imageY: pin.imageY, color }] : [];
      });
      if (recolorUpdates.length > 0) {
        this.colorPins.repositionMany(recolorUpdates);
      }
    }
  }
}
