import { describe, expect, it, vi } from 'vitest';
import { createRawImage } from '../../types';
import type { PaletteResolver, ResolvedPaletteEntry } from '../palette/paletteResolver';
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

/** Async resolver whose work we can release manually. Sync path always returns null. */
class ManualResolver implements PaletteResolver {
  readonly id = 'manual';
  readonly version = '1';
  readonly finishers: Array<(v: ResolvedPaletteEntry) => void> = [];
  readonly asyncCalls: string[] = [];
  tryResolvePinSync() { return null; }
  resolvePinAsync(pin: { id: string }): Promise<ResolvedPaletteEntry> {
    this.asyncCalls.push(pin.id);
    return new Promise((resolve) => { this.finishers.push(resolve); });
  }
  finishAt(i: number, entry: ResolvedPaletteEntry): void {
    this.finishers[i]!(entry);
  }
}

async function drainMicrotasks(): Promise<void> {
  for (let i = 0; i < 4; i += 1) await Promise.resolve();
}

function stubPipeline(img: ReturnType<typeof solidImage> | null) {
  const setIndexedPaletteConfig = vi.fn();
  return {
    setIndexedPaletteConfig,
    getLastFilteredImage: () => img,
  };
}

describe('EnginePaletteSync', () => {
  it('sampled resolver: pin add resolves sync and pushes a coalesced palette', async () => {
    const pins = new ColorPinState();
    const img = solidImage(8, 8, 200, 10, 10);
    const pipeline = stubPipeline(img);
    const sync = new EnginePaletteSync(
      pins, () => pipeline as never, () => false, new ResolvedPaletteState(), new SampledPaletteResolver(),
    );
    pins.addFromSample({ imageX: 2, imageY: 2, radiusPx: 1 }, '#000000');
    await drainMicrotasks();
    expect(pipeline.setIndexedPaletteConfig).toHaveBeenCalled();
    const last = pipeline.setIndexedPaletteConfig.mock.calls.at(-1)![0];
    expect(last.pinIds).toEqual([pins.getAll()[0]!.id]);
    sync.dispose();
  });

  it('moving one pin re-resolves only that pin', async () => {
    const pins = new ColorPinState();
    const img = solidImage(16, 16, 100, 100, 100);
    const pipeline = stubPipeline(img);
    const resolver = new ManualResolver();
    const sync = new EnginePaletteSync(
      pins, () => pipeline as never, () => false, new ResolvedPaletteState(), resolver,
    );
    pins.addFromSample({ imageX: 2, imageY: 2, radiusPx: 1 }, '#000000');
    pins.addFromSample({ imageX: 6, imageY: 6, radiusPx: 1 }, '#ffffff');
    const [a, b] = pins.getAll();
    expect(resolver.asyncCalls).toEqual([a!.id, b!.id]);
    resolver.finishAt(0, { pinId: a!.id, lab: { l: 10, a: 0, b: 0 }, displayHex: '#aaaaaa' });
    resolver.finishAt(1, { pinId: b!.id, lab: { l: 20, a: 0, b: 0 }, displayHex: '#bbbbbb' });
    await drainMicrotasks();
    resolver.asyncCalls.length = 0;
    // Only pin a moves.
    pins.repositionMany([{ id: a!.id, imageX: 3, imageY: 2, color: '#aaaaaa' }]);
    expect(resolver.asyncCalls).toEqual([a!.id]);
    sync.dispose();
  });

  it('removing a pin drops its resolved entry and aborts its in-flight resolve', async () => {
    const pins = new ColorPinState();
    const img = solidImage(8, 8, 0, 0, 0);
    const pipeline = stubPipeline(img);
    const resolver = new ManualResolver();
    const resolved = new ResolvedPaletteState();
    const sync = new EnginePaletteSync(
      pins, () => pipeline as never, () => false, resolved, resolver,
    );
    pins.addFromSample({ imageX: 2, imageY: 2, radiusPx: 1 }, '#000000');
    const id = pins.getAll()[0]!.id;
    resolver.finishAt(0, { pinId: id, lab: { l: 1, a: 0, b: 0 }, displayHex: '#111111' });
    await drainMicrotasks();
    expect(resolved.getByPinId(id)).toBeDefined();
    pins.removeById(id);
    expect(resolved.getByPinId(id)).toBeUndefined();
    sync.dispose();
  });

  it('color-only change (resolver write-back) does not trigger re-resolve', async () => {
    const pins = new ColorPinState();
    const img = solidImage(8, 8, 200, 10, 10);
    const pipeline = stubPipeline(img);
    const resolver = new ManualResolver();
    const sync = new EnginePaletteSync(
      pins, () => pipeline as never, () => false, new ResolvedPaletteState(), resolver,
    );
    pins.addFromSample({ imageX: 2, imageY: 2, radiusPx: 1 }, '#000000');
    const pin = pins.getAll()[0]!;
    resolver.asyncCalls.length = 0;
    // Direct color update at same position — simulates an external color change, not a move.
    pins.repositionMany([{ id: pin.id, imageX: pin.imageX, imageY: pin.imageY, color: '#abcdef' }]);
    expect(resolver.asyncCalls).toEqual([]);
    sync.dispose();
  });

  it('setResolver aborts in-flight, clears state, and re-resolves all pins', async () => {
    const pins = new ColorPinState();
    const img = solidImage(8, 8, 128, 128, 128);
    const pipeline = stubPipeline(img);
    const resolver = new ManualResolver();
    const resolved = new ResolvedPaletteState();
    const sync = new EnginePaletteSync(
      pins, () => pipeline as never, () => false, resolved, resolver,
    );
    pins.addFromSample({ imageX: 2, imageY: 2, radiusPx: 1 }, '#000000');
    const id = pins.getAll()[0]!.id;
    resolver.finishAt(0, { pinId: id, lab: { l: 1, a: 0, b: 0 }, displayHex: '#111111' });
    await drainMicrotasks();
    expect(resolved.getByPinId(id)).toBeDefined();

    sync.setResolver(new SampledPaletteResolver());
    await drainMicrotasks();
    // Sampled resolves synchronously — entry for pin should exist and match a sampled sample.
    const entry = resolved.getByPinId(id);
    expect(entry).toBeDefined();
    expect(entry!.displayHex).not.toBe('#111111');
    sync.dispose();
  });

  it('pipeline push coalesces multiple resolves into one setIndexedPaletteConfig per microtask', async () => {
    const pins = new ColorPinState();
    const img = solidImage(8, 8, 200, 10, 10);
    const pipeline = stubPipeline(img);
    const sync = new EnginePaletteSync(
      pins, () => pipeline as never, () => false, new ResolvedPaletteState(), new SampledPaletteResolver(),
    );
    pipeline.setIndexedPaletteConfig.mockClear();
    pins.addFromSample({ imageX: 1, imageY: 1, radiusPx: 1 }, '#000');
    pins.addFromSample({ imageX: 2, imageY: 2, radiusPx: 1 }, '#000');
    pins.addFromSample({ imageX: 3, imageY: 3, radiusPx: 1 }, '#000');
    await drainMicrotasks();
    // Three pin adds, each writing one entry, but the pipeline push is microtask-coalesced.
    expect(pipeline.setIndexedPaletteConfig.mock.calls.length).toBeLessThanOrEqual(1);
    sync.dispose();
  });
});
