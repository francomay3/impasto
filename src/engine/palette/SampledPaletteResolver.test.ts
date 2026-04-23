import { describe, expect, it } from 'vitest';
import { createRawImage } from '../../types';
import {
  labsForColorPinsFromFilteredImage,
  samplePinColorFromFilteredImage,
} from '../colorPins/indexedPaletteFromColorPins';
import { SampledPaletteResolver } from './SampledPaletteResolver';

const pinA = { id: 'a', imageX: 0, imageY: 0, radiusPx: 0, color: '#ff0000' } as const;

describe('SampledPaletteResolver', () => {
  const resolver = new SampledPaletteResolver();

  it('tryResolvePinSync returns null when filtered image is null', () => {
    expect(resolver.tryResolvePinSync(pinA, null)).toBeNull();
  });

  it('tryResolvePinSync produces target == lab and the sampled hex as displayHex', () => {
    const img = createRawImage(new Uint8ClampedArray([255, 0, 0, 255]), 1, 1);
    const [expectedLab] = labsForColorPinsFromFilteredImage(img, [pinA]);
    const entry = resolver.tryResolvePinSync(pinA, img);
    expect(entry).not.toBeNull();
    expect(entry!.lab).toEqual(expectedLab);
    expect(entry!.target).toEqual(expectedLab);
    expect(entry!.displayHex).toBe(samplePinColorFromFilteredImage(img, pinA));
  });

  it('resolvePinAsync mirrors the sync path', async () => {
    const img = createRawImage(new Uint8ClampedArray([255, 0, 0, 255]), 1, 1);
    const entry = await resolver.resolvePinAsync(pinA, img, new AbortController().signal);
    expect(entry).toEqual(resolver.tryResolvePinSync(pinA, img));
  });

  it('resolvePinAsync rejects when signal is already aborted', async () => {
    const ac = new AbortController();
    ac.abort();
    await expect(
      resolver.resolvePinAsync(pinA, null, ac.signal),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('resolvePinAsync rejects when the filtered image is missing', async () => {
    await expect(
      resolver.resolvePinAsync(pinA, null, new AbortController().signal),
    ).rejects.toBeInstanceOf(Error);
  });
});
