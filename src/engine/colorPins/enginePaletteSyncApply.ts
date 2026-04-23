import type { RawImage } from '../../types';
import type { ColorPin } from './colorPinTypes';
import { samplePinColorFromFilteredImage } from './indexedPaletteFromColorPins';
import type { ResolvedPalette } from '../palette/paletteResolver';

export function buildPaletteRecolorUpdates(
  img: RawImage | null,
  pins: readonly ColorPin[],
  result: ResolvedPalette,
  resolvingResolverId: string,
): readonly { readonly id: string; readonly imageX: number; readonly imageY: number; readonly color: string }[] {
  if (!img || pins.length === 0 || result.entries.length === 0) {
    return [];
  }
  const pinById = new Map(pins.map((p) => [p.id, p] as const));
  if (resolvingResolverId === 'sampled') {
    return result.entries.flatMap((e) => {
      const pin = pinById.get(e.pinId);
      if (!pin) return [];
      const color = samplePinColorFromFilteredImage(img, pin);
      return color ? [{ id: pin.id, imageX: pin.imageX, imageY: pin.imageY, color }] : [];
    });
  }
  return result.entries.flatMap((e) => {
    const pin = pinById.get(e.pinId);
    if (!pin || !e.displayHex) return [];
    return [{ id: pin.id, imageX: pin.imageX, imageY: pin.imageY, color: e.displayHex }];
  });
}
