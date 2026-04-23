import { describe, expect, it, vi } from 'vitest';
import chroma from 'chroma-js';
import { findMixData, mixedResultHex, PIGMENTS, type MixEntry } from '../../services/ColorMixer';
import { createRawImage } from '../../types';
import { samplePinColorFromFilteredImage } from '../colorPins/indexedPaletteFromColorPins';
import type { PigmentMixWorkerBridge } from './pigmentMixWorkerBridge';
import { PigmentMatchedPaletteResolver } from './PigmentMatchedPaletteResolver';

type MixOut = {
  labs: { l: number; a: number; b: number }[];
  recipes: MixEntry[][];
};

function fakeBridge({ labs, recipes }: MixOut): PigmentMixWorkerBridge {
  return { mix: vi.fn().mockResolvedValue({ labs, recipes }), dispose: vi.fn() } as unknown as PigmentMixWorkerBridge;
}

describe('PigmentMatchedPaletteResolver', () => {
  const pigments = PIGMENTS.slice(0, 4);
  const minPaintPercent = 2;
  const deltaThreshold = 4;

  it('uses sampled LAB as target and worker LAB as lab', async () => {
    const data = new Uint8ClampedArray([255, 0, 0, 255]);
    const img = createRawImage(data, 1, 1);
    const pins = [{ id: 'p1', imageX: 0, imageY: 0, radiusPx: 0, color: '#ff0000' }] as const;
    const hex = samplePinColorFromFilteredImage(img, pins[0]!)!;
    const [tl, ta, tb] = chroma(hex).lab();
    const targetLab = { l: tl, a: ta, b: tb };
    const fakeLab = { l: 9, a: 8, b: 7 };
    const mix = vi.fn().mockResolvedValue({ labs: [fakeLab], recipes: [[]] });
    const bridge = { mix, dispose: vi.fn() } as unknown as PigmentMixWorkerBridge;
    const resolver = new PigmentMatchedPaletteResolver({ pigments, minPaintPercent, deltaThreshold, bridge });
    const out = await resolver.resolve({ filteredImage: img, pins }, new AbortController().signal);
    expect(out.entries[0]!.target).toEqual(targetLab);
    expect(out.entries[0]!.lab).toEqual(fakeLab);
    expect(mix).toHaveBeenCalledWith(
      expect.objectContaining({ hexes: [hex], pigments, minPaintPercent, deltaThreshold }),
    );
  });

  it('fills recipe and displayHex from mix', async () => {
    const data = new Uint8ClampedArray([0, 128, 255, 255]);
    const img = createRawImage(data, 1, 1);
    const pins = [{ id: 'p1', imageX: 0, imageY: 0, radiusPx: 0, color: '#0080ff' }] as const;
    const hex = samplePinColorFromFilteredImage(img, pins[0]!)!;
    const recipe = findMixData(hex, minPaintPercent, deltaThreshold, pigments);
    const bridge = fakeBridge({ labs: [{ l: 1, a: 0, b: 0 }], recipes: [recipe] });
    const resolver = new PigmentMatchedPaletteResolver({ pigments, minPaintPercent, deltaThreshold, bridge });
    const out = await resolver.resolve({ filteredImage: img, pins }, new AbortController().signal);
    expect(out.entries[0]!.recipe).toEqual(recipe);
    expect(out.entries[0]!.displayHex).toBe(mixedResultHex(recipe));
  });

  it('sourceId is stable for identical inputs', async () => {
    const data = new Uint8ClampedArray([10, 20, 30, 255]);
    const img = createRawImage(data, 1, 1);
    const pins = [{ id: 'x', imageX: 0, imageY: 0, radiusPx: 0, color: '#fff' }] as const;
    const bridge = fakeBridge({ labs: [{ l: 1, a: 0, b: 0 }], recipes: [[]] });
    const resolver = new PigmentMatchedPaletteResolver({ pigments, minPaintPercent, deltaThreshold, bridge });
    const a = await resolver.resolve({ filteredImage: img, pins }, new AbortController().signal);
    const b = await resolver.resolve({ filteredImage: img, pins }, new AbortController().signal);
    expect(a.sourceId).toBe(b.sourceId);
  });

  it('throws AbortError when signal aborts before bridge', async () => {
    const data = new Uint8ClampedArray([255, 0, 0, 255]);
    const img = createRawImage(data, 1, 1);
    const pins = [{ id: 'p1', imageX: 0, imageY: 0, radiusPx: 0, color: '#f00' }] as const;
    const bridge = fakeBridge({ labs: [{ l: 1, a: 0, b: 0 }], recipes: [[]] });
    const resolver = new PigmentMatchedPaletteResolver({ pigments, minPaintPercent, deltaThreshold, bridge });
    const ac = new AbortController();
    ac.abort();
    await expect(resolver.resolve({ filteredImage: img, pins }, ac.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
  });

  it('throws when signal aborts during mix', async () => {
    const data = new Uint8ClampedArray([255, 0, 0, 255]);
    const img = createRawImage(data, 1, 1);
    const pins = [{ id: 'p1', imageX: 0, imageY: 0, radiusPx: 0, color: '#f00' }] as const;
    const ac = new AbortController();
    const mix = vi.fn(async () => {
      ac.abort();
      return { labs: [{ l: 1, a: 0, b: 0 }], recipes: [[] as MixEntry[]] };
    });
    const bridge = { mix, dispose: vi.fn() } as unknown as PigmentMixWorkerBridge;
    const resolver = new PigmentMatchedPaletteResolver({ pigments, minPaintPercent, deltaThreshold, bridge });
    await expect(resolver.resolve({ filteredImage: img, pins }, ac.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
  });
});
