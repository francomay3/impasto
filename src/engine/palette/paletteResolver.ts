import type { MixEntry } from '../../services/ColorMixer';
import type { RawImage } from '../../types';
import type { ColorPin } from '../colorPins/colorPinTypes';
import type { IndexedPaletteLab } from '../pipeline/indexedPassTypes';

export type { IndexedPaletteLab } from '../pipeline/indexedPassTypes';
export type { MixEntry } from '../../services/ColorMixer';

export type ResolvedPaletteEntry = {
  pinId: string;
  lab: IndexedPaletteLab;
  displayHex: string;
  target?: IndexedPaletteLab;
  recipe?: MixEntry[];
};

/**
 * Per-pin resolver. Replaces the earlier batch `resolve(ctx)` API so that moving one pin only
 * re-resolves that pin — other pins' entries stay cached in {@link ResolvedPaletteState}, no
 * per-notify worker round-trip for the whole palette, no sampled/mixed flicker (there is no
 * global "resolve" step to race against).
 *
 * Implementations expose two paths:
 *
 * - {@link tryResolvePinSync}: fast-path that may answer on the caller's stack (sampled sampling,
 *   or a pigment-mix cache hit). Returns `null` if this pin needs async work.
 * - {@link resolvePinAsync}: always-available path. Sampled implementations make this a wrapper
 *   around the sync path; pigment-matched runs the mix worker.
 */
export type PaletteResolver = {
  readonly id: string;
  readonly version: string;
  tryResolvePinSync(pin: ColorPin, filteredImage: RawImage | null): ResolvedPaletteEntry | null;
  resolvePinAsync(
    pin: ColorPin,
    filteredImage: RawImage | null,
    signal: AbortSignal,
  ): Promise<ResolvedPaletteEntry>;
};
