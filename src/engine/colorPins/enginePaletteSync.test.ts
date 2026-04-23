import { describe, expect, it, vi } from 'vitest';
import { createRawImage } from '../../types';
import type { PaletteResolver, PaletteResolverContext, ResolvedPalette } from '../palette/paletteResolver';
import { SampledPaletteResolver } from '../palette/SampledPaletteResolver';
import { ResolvedPaletteState } from '../palette/ResolvedPaletteState';
import { ColorPinState } from './ColorPinState';
import { EnginePaletteSync } from './enginePaletteSync';

function solidImage(w: number, h: number, r: number, g: number, b: number) {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = 255;
  }
  return createRawImage(data, w, h);
}

class MultiFlushResolver implements PaletteResolver {
  readonly id = 'multi';
  readonly version = '1';
  private readonly finishers: Array<(v: ResolvedPalette) => void> = [];

  resolve(_ctx: PaletteResolverContext): Promise<ResolvedPalette> {
    return new Promise((resolve) => {
      this.finishers.push(resolve);
    });
  }

  finishAt(index: number, value: ResolvedPalette): void {
    this.finishers[index]!(value);
  }
}

class AltSyncResolver implements PaletteResolver {
  readonly id = 'pigment-matched';
  readonly version = '1';
  private readonly pinId: string;

  constructor(pinId: string) {
    this.pinId = pinId;
  }

  resolve(): Promise<ResolvedPalette> {
    return Promise.resolve({
      sourceId: 'alt',
      entries: [
        {
          pinId: this.pinId,
          lab: { l: 80, a: 0, b: 0 },
          displayHex: '#abcdef',
        },
      ],
    });
  }
}

async function drainMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('EnginePaletteSync', () => {
  it('uses SampledPaletteResolver by default and pushes palette into the pipeline', async () => {
    const pins = new ColorPinState();
    pins.addFromSample({ imageX: 2, imageY: 2, radiusPx: 1 }, '#000000');
    const pinId = pins.getAll()[0]!.id;
    const img = solidImage(8, 8, 200, 10, 10);
    const setIndexedPaletteConfig = vi.fn();
    const pipeline = {
      setIndexedPaletteConfig,
      getLastFilteredImage: () => img,
    };
    const resolved = new ResolvedPaletteState();
    const sync = new EnginePaletteSync(
      pins,
      () => pipeline as never,
      () => false,
      resolved,
      new SampledPaletteResolver(),
    );
    sync.flushFromPins(img);
    await drainMicrotasks();
    expect(setIndexedPaletteConfig).toHaveBeenCalledTimes(1);
    const arg = setIndexedPaletteConfig.mock.calls[0]![0];
    expect(arg.pinIds).toEqual([pinId]);
    expect(arg.palette).toHaveLength(1);
    expect(resolved.getAll()).toHaveLength(1);
    expect(resolved.getByPinId(pinId)?.lab).toEqual(arg.palette[0]);
  });

  it('setResolver swaps strategy and the pipeline receives the new palette', async () => {
    const pins = new ColorPinState();
    pins.addFromSample({ imageX: 2, imageY: 2, radiusPx: 1 }, '#000000');
    const pinId = pins.getAll()[0]!.id;
    const img = solidImage(8, 8, 0, 200, 0);
    const setIndexedPaletteConfig = vi.fn();
    const pipeline = { setIndexedPaletteConfig, getLastFilteredImage: () => img };
    const resolved = new ResolvedPaletteState();
    const sync = new EnginePaletteSync(
      pins,
      () => pipeline as never,
      () => false,
      resolved,
      new SampledPaletteResolver(),
    );
    sync.flushFromPins(img);
    await drainMicrotasks();
    setIndexedPaletteConfig.mockClear();
    sync.setResolver(new AltSyncResolver(pinId));
    await drainMicrotasks();
    expect(setIndexedPaletteConfig).toHaveBeenCalledTimes(1);
    expect(setIndexedPaletteConfig.mock.calls[0]![0].palette[0]!.l).toBe(80);
    expect(resolved.getByPinId(pinId)?.displayHex).toBe('#abcdef');
  });

  it('drops stale async resolutions when a newer flush has started', async () => {
    const pins = new ColorPinState();
    pins.addFromSample({ imageX: 2, imageY: 2, radiusPx: 1 }, '#000000');
    const pinId = pins.getAll()[0]!.id;
    const img = solidImage(8, 8, 50, 50, 200);
    const setIndexedPaletteConfig = vi.fn();
    const pipeline = { setIndexedPaletteConfig, getLastFilteredImage: () => img };
    const resolver = new MultiFlushResolver();
    const sync = new EnginePaletteSync(
      pins,
      () => pipeline as never,
      () => false,
      new ResolvedPaletteState(),
      resolver,
    );
    sync.flushFromPins(img);
    sync.flushFromPins(img);
    resolver.finishAt(0, {
      sourceId: 'old',
      entries: [{ pinId, lab: { l: 1, a: 0, b: 0 }, displayHex: '#111111' }],
    });
    await drainMicrotasks();
    expect(setIndexedPaletteConfig).not.toHaveBeenCalled();
    resolver.finishAt(1, {
      sourceId: 'new',
      entries: [{ pinId, lab: { l: 2, a: 0, b: 0 }, displayHex: '#222222' }],
    });
    await drainMicrotasks();
    expect(setIndexedPaletteConfig).toHaveBeenCalledTimes(1);
    expect(setIndexedPaletteConfig.mock.calls[0]![0].palette[0]!.l).toBe(2);
  });

  it('does not write the pipeline after dispose while a resolve is still pending', async () => {
    const pins = new ColorPinState();
    pins.addFromSample({ imageX: 2, imageY: 2, radiusPx: 1 }, '#000000');
    const pinId = pins.getAll()[0]!.id;
    const img = solidImage(8, 8, 10, 10, 10);
    const setIndexedPaletteConfig = vi.fn();
    const pipeline = { setIndexedPaletteConfig, getLastFilteredImage: () => img };
    const resolver = new MultiFlushResolver();
    const sync = new EnginePaletteSync(
      pins,
      () => pipeline as never,
      () => false,
      new ResolvedPaletteState(),
      resolver,
    );
    sync.flushFromPins(img);
    sync.dispose();
    resolver.finishAt(0, {
      sourceId: 'late',
      entries: [{ pinId, lab: { l: 99, a: 0, b: 0 }, displayHex: '#999999' }],
    });
    await drainMicrotasks();
    expect(setIndexedPaletteConfig).not.toHaveBeenCalled();
  });
});
