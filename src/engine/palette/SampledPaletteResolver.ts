import chroma from 'chroma-js';
import type { RawImage } from '../../types';
import type { ColorPin } from '../colorPins/colorPinTypes';
import { samplePinColorFromFilteredImage } from '../colorPins/indexedPaletteFromColorPins';
import type { IndexedPaletteLab } from '../pipeline/indexedPassTypes';
import type { PaletteResolver, ResolvedPaletteEntry } from './paletteResolver';

function hexToLab(hex: string): IndexedPaletteLab {
  const [l, a, b] = chroma(hex).lab();
  return { l, a, b };
}

/**
 * Derives one entry per pin from a circle average on the filtered bitmap. Pure, synchronous — the
 * async method is a trivial wrapper so callers can use the same shape as pigment-matched.
 */
export class SampledPaletteResolver implements PaletteResolver {
  readonly id = 'sampled';
  readonly version = 'sampled';

  tryResolvePinSync(pin: ColorPin, filteredImage: RawImage | null): ResolvedPaletteEntry | null {
    const hex = samplePinColorFromFilteredImage(filteredImage, pin);
    if (!hex) return null;
    const lab = hexToLab(hex);
    return { pinId: pin.id, lab, displayHex: hex, target: lab };
  }

  resolvePinAsync(
    pin: ColorPin,
    filteredImage: RawImage | null,
    signal: AbortSignal,
  ): Promise<ResolvedPaletteEntry> {
    if (signal.aborted) return Promise.reject(new DOMException('aborted', 'AbortError'));
    const entry = this.tryResolvePinSync(pin, filteredImage);
    return entry ? Promise.resolve(entry) : Promise.reject(new Error('SampledPaletteResolver: no filtered image'));
  }
}
