import { describe, expect, it, vi } from 'vitest';
import chroma from 'chroma-js';
import { findMixData, mixedResultHex, PIGMENTS, type MixEntry } from '../../services/ColorMixer';
import { createRawImage } from '../../types';
import { samplePinColorFromFilteredImage } from '../colorPins/indexedPaletteFromColorPins';
import type { PigmentMixWorkerBridge, MixOneResult } from './pigmentMixWorkerBridge';
import { PigmentMatchedPaletteResolver } from './PigmentMatchedPaletteResolver';

function fakeBridge(result: MixOneResult, cached?: MixOneResult | null): PigmentMixWorkerBridge {
  return {
    mixOne: vi.fn().mockResolvedValue(result),
    tryGetCached: vi.fn().mockReturnValue(cached ?? null),
    dispose: vi.fn(),
  } as unknown as PigmentMixWorkerBridge;
}

describe('PigmentMatchedPaletteResolver', () => {
  const pigments = PIGMENTS.slice(0, 4);
  const minPaintPercent = 2;
  const deltaThreshold = 4;

  it('resolvePinAsync fills lab from the worker and target from the sampled hex', async () => {
    const img = createRawImage(new Uint8ClampedArray([255, 0, 0, 255]), 1, 1);
    const pin = { id: 'p1', imageX: 0, imageY: 0, radiusPx: 0, color: '#ff0000' } as const;
    const hex = samplePinColorFromFilteredImage(img, pin)!;
    const [tl, ta, tb] = chroma(hex).lab();
    const workerLab = { l: 9, a: 8, b: 7 };
    const bridge = fakeBridge({ lab: workerLab, recipe: [] });
    const resolver = new PigmentMatchedPaletteResolver({ pigments, minPaintPercent, deltaThreshold, bridge });
    const entry = await resolver.resolvePinAsync(pin, img, new AbortController().signal);
    expect(entry.lab).toEqual(workerLab);
    expect(entry.target).toEqual({ l: tl, a: ta, b: tb });
    expect(bridge.mixOne).toHaveBeenCalledWith(
      hex,
      expect.objectContaining({ pigments, minPaintPercent, deltaThreshold }),
      expect.any(AbortSignal),
    );
  });

  it('resolvePinAsync fills recipe and displayHex from the worker result', async () => {
    const img = createRawImage(new Uint8ClampedArray([0, 128, 255, 255]), 1, 1);
    const pin = { id: 'p1', imageX: 0, imageY: 0, radiusPx: 0, color: '#0080ff' } as const;
    const hex = samplePinColorFromFilteredImage(img, pin)!;
    const recipe = findMixData(hex, minPaintPercent, deltaThreshold, pigments);
    const bridge = fakeBridge({ lab: { l: 1, a: 0, b: 0 }, recipe });
    const resolver = new PigmentMatchedPaletteResolver({ pigments, minPaintPercent, deltaThreshold, bridge });
    const entry = await resolver.resolvePinAsync(pin, img, new AbortController().signal);
    expect(entry.recipe).toEqual(recipe);
    expect(entry.displayHex).toBe(mixedResultHex(recipe));
  });

  it('tryResolvePinSync returns null when the bridge has no cached mix for this hex', () => {
    const img = createRawImage(new Uint8ClampedArray([255, 0, 0, 255]), 1, 1);
    const pin = { id: 'p1', imageX: 0, imageY: 0, radiusPx: 0, color: '#ff0000' } as const;
    const bridge = fakeBridge({ lab: { l: 1, a: 0, b: 0 }, recipe: [] }, null);
    const resolver = new PigmentMatchedPaletteResolver({ pigments, minPaintPercent, deltaThreshold, bridge });
    expect(resolver.tryResolvePinSync(pin, img)).toBeNull();
  });

  it('tryResolvePinSync returns a cached entry without hitting the worker', () => {
    const img = createRawImage(new Uint8ClampedArray([255, 0, 0, 255]), 1, 1);
    const pin = { id: 'p1', imageX: 0, imageY: 0, radiusPx: 0, color: '#ff0000' } as const;
    const recipe: MixEntry[] = [];
    const cached = { lab: { l: 42, a: 0, b: 0 }, recipe };
    const bridge = fakeBridge({ lab: { l: 0, a: 0, b: 0 }, recipe: [] }, cached);
    const resolver = new PigmentMatchedPaletteResolver({ pigments, minPaintPercent, deltaThreshold, bridge });
    const entry = resolver.tryResolvePinSync(pin, img);
    expect(entry).not.toBeNull();
    expect(entry!.lab).toEqual(cached.lab);
    expect(bridge.mixOne).not.toHaveBeenCalled();
  });

  it('resolvePinAsync rejects when signal aborts before the bridge call', async () => {
    const img = createRawImage(new Uint8ClampedArray([255, 0, 0, 255]), 1, 1);
    const pin = { id: 'p1', imageX: 0, imageY: 0, radiusPx: 0, color: '#f00' } as const;
    const bridge = fakeBridge({ lab: { l: 1, a: 0, b: 0 }, recipe: [] });
    const resolver = new PigmentMatchedPaletteResolver({ pigments, minPaintPercent, deltaThreshold, bridge });
    const ac = new AbortController();
    ac.abort();
    await expect(
      resolver.resolvePinAsync(pin, img, ac.signal),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('resolvePinAsync rejects when filtered image is missing', async () => {
    const pin = { id: 'p1', imageX: 0, imageY: 0, radiusPx: 0, color: '#f00' } as const;
    const bridge = fakeBridge({ lab: { l: 1, a: 0, b: 0 }, recipe: [] });
    const resolver = new PigmentMatchedPaletteResolver({ pigments, minPaintPercent, deltaThreshold, bridge });
    await expect(
      resolver.resolvePinAsync(pin, null, new AbortController().signal),
    ).rejects.toBeInstanceOf(Error);
  });
});
