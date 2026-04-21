import { describe, it, expect } from 'vitest';
import { fitToContain } from './fitToContain';

describe('fitToContain', () => {
  it('is width-bound when the image is wider than the viewport aspect', () => {
    // scale = 200/1000 = 0.2; image fills width, letterboxed top/bottom
    const t = fitToContain(1000, 500, 200, 300);
    expect(t.z).toBeCloseTo(0.2);
    expect(t.x).toBeCloseTo(0);    // (200 - 1000*0.2) / 2 = 0
    expect(t.y).toBeCloseTo(100);  // (300 - 500*0.2)  / 2 = 100
  });

  it('is height-bound when the image is taller than the viewport aspect', () => {
    // scale = 200/1000 = 0.2; image fills height, pillarboxed left/right
    const t = fitToContain(500, 1000, 300, 200);
    expect(t.z).toBeCloseTo(0.2);
    expect(t.x).toBeCloseTo(100);  // (300 - 500*0.2)  / 2 = 100
    expect(t.y).toBeCloseTo(0);    // (200 - 1000*0.2) / 2 = 0
  });

  it('fills exactly when aspect ratios match', () => {
    // scale = 2, no gaps in either axis
    const t = fitToContain(200, 100, 400, 200);
    expect(t.z).toBeCloseTo(2);
    expect(t.x).toBeCloseTo(0);
    expect(t.y).toBeCloseTo(0);
  });

  it('upscales small images to fill the viewport', () => {
    const t = fitToContain(50, 50, 200, 200);
    expect(t.z).toBeCloseTo(4);
    expect(t.x).toBeCloseTo(0);
    expect(t.y).toBeCloseTo(0);
  });

  it('centers horizontally when the viewport is wider than the image aspect', () => {
    // scale = 1; x offset = (300 - 100) / 2 = 100
    const t = fitToContain(100, 100, 300, 100);
    expect(t.z).toBeCloseTo(1);
    expect(t.x).toBeCloseTo(100);
    expect(t.y).toBeCloseTo(0);
  });

  it('centers vertically when the viewport is taller than the image aspect', () => {
    // scale = 1; y offset = (300 - 100) / 2 = 100
    const t = fitToContain(100, 100, 100, 300);
    expect(t.z).toBeCloseTo(1);
    expect(t.x).toBeCloseTo(0);
    expect(t.y).toBeCloseTo(100);
  });
});
