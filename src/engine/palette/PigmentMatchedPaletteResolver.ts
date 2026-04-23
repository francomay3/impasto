import chroma from 'chroma-js';
import { mixedResultHex } from '../../services/ColorMixer';
import type { Pigment } from '../../types';
import type { ColorPin } from '../colorPins/colorPinTypes';
import { samplePinColorFromFilteredImage } from '../colorPins/indexedPaletteFromColorPins';
import type { IndexedPaletteLab } from '../pipeline/indexedPassTypes';
import type { PigmentMixWorkerBridge } from './pigmentMixWorkerBridge';
import type {
  PaletteResolver,
  PaletteResolverContext,
  ResolvedPalette,
  ResolvedPaletteEntry,
} from './paletteResolver';

function fnv1a(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}

function sourceKey(pins: readonly ColorPin[], w: number, h: number): string {
  return `${w}x${h}:${pins.map((p) => p.id).join('\x1f')}`;
}

function hexToLab(hex: string): IndexedPaletteLab {
  const [l, a, b] = chroma(hex).lab();
  return { l, a, b };
}

export class PigmentMatchedPaletteResolver implements PaletteResolver {
  readonly id = 'pigment-matched';
  readonly version: string;
  private readonly pigments: Pigment[];
  private readonly minPaintPercent: number;
  private readonly deltaThreshold: number;
  private readonly bridge: PigmentMixWorkerBridge;

  constructor(opts: {
    pigments: Pigment[];
    minPaintPercent: number;
    deltaThreshold: number;
    bridge: PigmentMixWorkerBridge;
  }) {
    this.pigments = opts.pigments;
    this.minPaintPercent = opts.minPaintPercent;
    this.deltaThreshold = opts.deltaThreshold;
    this.bridge = opts.bridge;
    const names = [...opts.pigments.map((p) => p.name)].sort().join(',');
    this.version = fnv1a(`${names}|${opts.minPaintPercent}|${opts.deltaThreshold}`);
  }

  async resolve(ctx: PaletteResolverContext, signal: AbortSignal): Promise<ResolvedPalette> {
    if (signal.aborted) throw new DOMException('aborted', 'AbortError');
    const { filteredImage, pins } = ctx;
    const w = filteredImage?.width ?? 0;
    const h = filteredImage?.height ?? 0;
    const sid = fnv1a(sourceKey(pins, w, h));
    const sourceId = `${this.version}:${sid}`;
    if (!filteredImage?.width || !pins.length) return { entries: [], sourceId };
    const hexes: string[] = [];
    const targets: IndexedPaletteLab[] = [];
    for (const pin of pins) {
      if (signal.aborted) throw new DOMException('aborted', 'AbortError');
      const hex = samplePinColorFromFilteredImage(filteredImage, pin);
      if (!hex) return { entries: [], sourceId };
      hexes.push(hex);
      targets.push(hexToLab(hex));
    }
    const { labs, recipes } = await this.bridge.mix({
      hexes,
      pigments: this.pigments,
      minPaintPercent: this.minPaintPercent,
      deltaThreshold: this.deltaThreshold,
      signal,
    });
    if (signal.aborted) throw new DOMException('aborted', 'AbortError');
    const entries: ResolvedPaletteEntry[] = pins.map((pin, i) => ({
      pinId: pin.id,
      lab: labs[i]!,
      displayHex: mixedResultHex(recipes[i]!),
      target: targets[i]!,
      recipe: recipes[i]!,
    }));
    return { entries, sourceId };
  }
}
