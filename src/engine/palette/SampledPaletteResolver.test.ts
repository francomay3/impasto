import { describe, expect, it } from 'vitest';
import { createRawImage } from '../../types';
import {
  labsForColorPinsFromFilteredImage,
  samplePinColorFromFilteredImage,
} from '../colorPins/indexedPaletteFromColorPins';
import { SampledPaletteResolver } from './SampledPaletteResolver';

describe('SampledPaletteResolver', () => {
  const resolver = new SampledPaletteResolver();

  it('returns empty entries when there are no pins', async () => {
    const data = new Uint8ClampedArray([255, 0, 0, 255]);
    const img = createRawImage(data, 1, 1);
    const out = await resolver.resolve({ filteredImage: img, pins: [] }, new AbortController().signal);
    expect(out.entries).toEqual([]);
    expect(out.sourceId).toMatch(/^[0-9a-z]+$/i);
  });

  it('returns empty when filtered image is null', async () => {
    const out = await resolver.resolve(
      {
        filteredImage: null,
        pins: [{ id: 'a', imageX: 0, imageY: 0, radiusPx: 0, color: '#ff0000' }],
      },
      new AbortController().signal,
    );
    expect(out.entries).toEqual([]);
  });

  it('target equals lab and matches labsForColorPinsFromFilteredImage', async () => {
    const data = new Uint8ClampedArray([255, 0, 0, 255]);
    const img = createRawImage(data, 1, 1);
    const pins = [{ id: '1', imageX: 0, imageY: 0, radiusPx: 0, color: '#ff0000' }] as const;
    const [expectedLab] = labsForColorPinsFromFilteredImage(img, pins);
    const out = await resolver.resolve({ filteredImage: img, pins }, new AbortController().signal);
    expect(out.entries).toHaveLength(1);
    expect(out.entries[0]!.lab).toEqual(expectedLab);
    expect(out.entries[0]!.target).toEqual(expectedLab);
    expect(out.entries[0]!.displayHex).toBe(samplePinColorFromFilteredImage(img, pins[0]!));
  });

  it('rejects when signal is already aborted', async () => {
    const ac = new AbortController();
    ac.abort();
    await expect(resolver.resolve({ filteredImage: null, pins: [] }, ac.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
  });
});
