import { describe, expect, it } from 'vitest';
import type { ColorPin } from '../ColorPinState';
import type { ViewportTransform } from '../../viewport/models';
import { buildColorPinOverlayLayouts } from './ViewportColorPins';

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

function makePin(overrides: Partial<ColorPin> & Pick<ColorPin, 'radiusPx'>): ColorPin {
  return {
    id: 'pin-1',
    imageX: 4,
    imageY: 6,
    color: '#aabbcc',
    ...overrides,
  } as ColorPin;
}

describe('buildColorPinOverlayLayouts', () => {
  const dpr = 2;
  const cssW = 200;
  const cssH = 150;
  const canvas = stubCanvas(cssW, cssH, cssW * dpr, cssH * dpr);

  it('sets radiusCssPx = pin.radiusPx * transform.z at z=1', () => {
    const t: ViewportTransform = { x: 0, y: 0, z: 1 };
    const pin = makePin({ radiusPx: 7 });
    const [layout] = buildColorPinOverlayLayouts([pin], t, canvas);
    expect(layout.radiusCssPx).toBe(7);
  });

  it('scales radiusCssPx with z=2 and z=0.5', () => {
    const pin = makePin({ radiusPx: 10 });
    const hi = buildColorPinOverlayLayouts([pin], { x: 0, y: 0, z: 2 }, canvas)[0];
    const lo = buildColorPinOverlayLayouts([pin], { x: 0, y: 0, z: 0.5 }, canvas)[0];
    expect(hi.radiusCssPx).toBe(20);
    expect(lo.radiusCssPx).toBe(5);
  });

  it('returns empty array when canvas clientWidth is zero (no throw)', () => {
    const zeroW = stubCanvas(0, 150, 0, 300);
    expect(buildColorPinOverlayLayouts([makePin({ radiusPx: 1 })], { x: 0, y: 0, z: 1 }, zeroW)).toEqual([]);
  });

  it('preserves zero radiusPx as zero radiusCssPx', () => {
    const t: ViewportTransform = { x: 0, y: 0, z: 3 };
    const [layout] = buildColorPinOverlayLayouts([makePin({ radiusPx: 0 })], t, canvas);
    expect(layout.radiusCssPx).toBe(0);
  });

  it('multiplies negative radiusPx without special-casing', () => {
    const t: ViewportTransform = { x: 0, y: 0, z: 2 };
    const [layout] = buildColorPinOverlayLayouts([makePin({ radiusPx: -3 })], t, canvas);
    expect(layout.radiusCssPx).toBe(-6);
  });
});
