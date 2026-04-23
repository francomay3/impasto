import chroma from 'chroma-js';
import { mixedResultHex } from '../../services/ColorMixer';
import type { RawImage, Pigment } from '../../types';
import type { ColorPin } from '../colorPins/colorPinTypes';
import { samplePinColorFromFilteredImage } from '../colorPins/indexedPaletteFromColorPins';
import type { IndexedPaletteLab } from '../pipeline/indexedPassTypes';
import type { PigmentMixWorkerBridge, PigmentMixSettings } from './pigmentMixWorkerBridge';
import type { PaletteResolver, ResolvedPaletteEntry } from './paletteResolver';

function fnv1a(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}

function hexToLab(hex: string): IndexedPaletteLab {
  const [l, a, b] = chroma(hex).lab();
  return { l, a, b };
}

/**
 * Per-pin pigment-matched resolver. `tryResolvePinSync` returns a cached mix if the bridge has one
 * for this hex + settings; else null. `resolvePinAsync` dispatches one worker round-trip per pin
 * via {@link PigmentMixWorkerBridge.mixOne}.
 */
export class PigmentMatchedPaletteResolver implements PaletteResolver {
  readonly id = 'pigment-matched';
  readonly version: string;
  private readonly settings: PigmentMixSettings;
  private readonly bridge: PigmentMixWorkerBridge;

  constructor(opts: {
    pigments: Pigment[];
    minPaintPercent: number;
    deltaThreshold: number;
    bridge: PigmentMixWorkerBridge;
  }) {
    const names = [...opts.pigments.map((p) => p.name)].sort().join(',');
    this.version = fnv1a(`${names}|${opts.minPaintPercent}|${opts.deltaThreshold}`);
    this.settings = {
      pigments: opts.pigments,
      minPaintPercent: opts.minPaintPercent,
      deltaThreshold: opts.deltaThreshold,
      settingsVersion: this.version,
    };
    this.bridge = opts.bridge;
  }

  tryResolvePinSync(pin: ColorPin, filteredImage: RawImage | null): ResolvedPaletteEntry | null {
    const hex = samplePinColorFromFilteredImage(filteredImage, pin);
    if (!hex) return null;
    const cached = this.bridge.tryGetCached(hex, this.version);
    if (!cached) return null;
    return this.entryFrom(pin, hex, cached.lab, cached.recipe);
  }

  async resolvePinAsync(
    pin: ColorPin,
    filteredImage: RawImage | null,
    signal: AbortSignal,
  ): Promise<ResolvedPaletteEntry> {
    if (signal.aborted) throw new DOMException('aborted', 'AbortError');
    const hex = samplePinColorFromFilteredImage(filteredImage, pin);
    if (!hex) throw new Error('PigmentMatchedPaletteResolver: no filtered image');
    const { lab, recipe } = await this.bridge.mixOne(hex, this.settings, signal);
    if (signal.aborted) throw new DOMException('aborted', 'AbortError');
    return this.entryFrom(pin, hex, lab, recipe);
  }

  private entryFrom(
    pin: ColorPin,
    hex: string,
    lab: IndexedPaletteLab,
    recipe: ResolvedPaletteEntry['recipe'] & NonNullable<ResolvedPaletteEntry['recipe']>,
  ): ResolvedPaletteEntry {
    return {
      pinId: pin.id,
      lab,
      displayHex: mixedResultHex(recipe),
      target: hexToLab(hex),
      recipe,
    };
  }
}
