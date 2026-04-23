import type { ColorPin } from '../colorPins/colorPinTypes';
import {
  labsForColorPinsFromFilteredImage,
  samplePinColorFromFilteredImage,
} from '../colorPins/indexedPaletteFromColorPins';
import type { PaletteResolver, PaletteResolverContext, ResolvedPalette } from './paletteResolver';

function sourceKey(pins: readonly ColorPin[], w: number, h: number): string {
  return `${w}x${h}:${pins.map((p) => p.id).join('\x1f')}`;
}

function fnv1a(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}

export class SampledPaletteResolver implements PaletteResolver {
  readonly id = 'sampled';
  readonly version = 'sampled';

  resolve(ctx: PaletteResolverContext, signal: AbortSignal): Promise<ResolvedPalette> {
    if (signal.aborted) return Promise.reject(new DOMException('aborted', 'AbortError'));
    const { filteredImage, pins } = ctx;
    const w = filteredImage?.width ?? 0;
    const h = filteredImage?.height ?? 0;
    const labs = labsForColorPinsFromFilteredImage(filteredImage, pins);
    if (labs.length !== pins.length) {
      return Promise.resolve({ entries: [], sourceId: fnv1a(sourceKey(pins, w, h)) });
    }
    const entries = pins.map((pin, i) => {
      const lab = labs[i]!;
      const displayHex = samplePinColorFromFilteredImage(filteredImage, pin)!;
      return { pinId: pin.id, lab, displayHex, target: lab };
    });
    return Promise.resolve({ entries, sourceId: fnv1a(sourceKey(pins, w, h)) });
  }
}
