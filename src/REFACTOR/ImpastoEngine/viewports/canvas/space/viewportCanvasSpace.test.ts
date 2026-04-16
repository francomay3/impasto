import { describe, expect, it } from 'vitest';
import {
  backingStorePixelToImagePixel,
  clientPointToImagePixel,
  imagePixelToBackingStorePixel,
  imagePixelToCanvasCssPixel,
} from './viewportCanvasSpace';
import type { ViewportTransform } from '../../../viewport/models';

/** Minimal stub: {@link imagePixelToCanvasCssPixel} only reads layout + backing size fields. */
function stubCanvas(cssW: number, cssH: number, bw: number, bh: number): HTMLCanvasElement {
  const c = { clientWidth: cssW, clientHeight: cssH, width: bw, height: bh } as HTMLCanvasElement;
  c.getBoundingClientRect = () =>
    ({
      left: 100,
      top: 50,
      width: cssW,
      height: cssH,
      right: 100 + cssW,
      bottom: 50 + cssH,
      x: 100,
      y: 50,
      toJSON: () => '',
    }) as DOMRect;
  return c;
}

describe('viewportCanvasSpace pin overlay projection', () => {
  it('round-trips image → backing-store → image', () => {
    const t: ViewportTransform = { x: 12, y: -7, z: 1.25 };
    const dpr = 2;
    const image = { x: 40, y: 55.5 };
    const bs = imagePixelToBackingStorePixel(image, t, dpr);
    const back = backingStorePixelToImagePixel(bs, t, dpr);
    expect(back.x).toBeCloseTo(image.x, 6);
    expect(back.y).toBeCloseTo(image.y, 6);
  });

  it('clientPointToImagePixel inverts imagePixelToCanvasCssPixel for canvas center', () => {
    const t: ViewportTransform = { x: 4, y: 6, z: 2 };
    const cssW = 200;
    const cssH = 150;
    const dpr = 2;
    const c = stubCanvas(cssW, cssH, cssW * dpr, cssH * dpr);
    const image = { x: 10, y: 20 };
    const css = imagePixelToCanvasCssPixel(image, t, c);
    const clientX = 100 + css.x;
    const clientY = 50 + css.y;
    const back = clientPointToImagePixel(c, clientX, clientY, t);
    expect(back.x).toBeCloseTo(image.x, 5);
    expect(back.y).toBeCloseTo(image.y, 5);
  });

  it('maps image pixel to CSS center matching backing-store ratio', () => {
    const t: ViewportTransform = { x: 4, y: 6, z: 2 };
    const cssW = 200;
    const cssH = 150;
    const dpr = 2;
    const c = stubCanvas(cssW, cssH, cssW * dpr, cssH * dpr);
    const image = { x: 10, y: 20 };
    const bs = imagePixelToBackingStorePixel(image, t, dpr);
    const css = imagePixelToCanvasCssPixel(image, t, c);
    expect(css.x).toBeCloseTo((bs.x / c.width) * cssW, 6);
    expect(css.y).toBeCloseTo((bs.y / c.height) * cssH, 6);
  });
});
