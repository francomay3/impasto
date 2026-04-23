import type { MixEntry } from '../../services/ColorMixer';
import type { RawImage } from '../../types';
import type { ColorPin } from '../colorPins/colorPinTypes';
import type { IndexedPaletteLab } from '../pipeline/indexedPassTypes';

export type { IndexedPaletteLab } from '../pipeline/indexedPassTypes';
export type { MixEntry } from '../../services/ColorMixer';

export type PaletteResolverContext = {
  filteredImage: RawImage | null;
  pins: readonly ColorPin[];
};

export type ResolvedPaletteEntry = {
  pinId: string;
  lab: IndexedPaletteLab;
  displayHex: string;
  target?: IndexedPaletteLab;
  recipe?: MixEntry[];
};

export type ResolvedPalette = {
  entries: ResolvedPaletteEntry[];
  sourceId: string;
};

export type PaletteResolver = {
  readonly id: string;
  readonly version: string;
  resolve(ctx: PaletteResolverContext, signal: AbortSignal): Promise<ResolvedPalette>;
};
