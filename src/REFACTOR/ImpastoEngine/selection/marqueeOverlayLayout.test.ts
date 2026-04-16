import { describe, expect, it } from 'vitest';
import { imageRectToCanvasCssRect } from './marqueeOverlayLayout';
import type { ViewportTransform } from '../viewport/models';

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

describe('imageRectToCanvasCssRect', () => {
  it('returns null when canvas has no layout', () => {
    const c = stubCanvas(0, 100, 200, 200);
    const t: ViewportTransform = { x: 0, y: 0, z: 1 };
    expect(imageRectToCanvasCssRect({ minX: 0, minY: 0, maxX: 10, maxY: 10 }, t, c)).toBeNull();
  });

  it('maps image axis rect to non-negative CSS width/height', () => {
    const c = stubCanvas(200, 150, 400, 300);
    const t: ViewportTransform = { x: 0, y: 0, z: 1 };
    const r = imageRectToCanvasCssRect({ minX: 0, minY: 0, maxX: 20, maxY: 30 }, t, c);
    expect(r).not.toBeNull();
    expect(r!.width).toBeGreaterThanOrEqual(0);
    expect(r!.height).toBeGreaterThanOrEqual(0);
    expect(r!.left).toBeLessThanOrEqual(r!.left + r!.width);
    expect(r!.top).toBeLessThanOrEqual(r!.top + r!.height);
  });
});
