import { describe, it, expect, vi, afterEach } from 'vitest';
import { clampToViewport } from './geometry';

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubViewport(width: number, height: number) {
  vi.stubGlobal('window', { innerWidth: width, innerHeight: height });
}

describe('clampToViewport', () => {
  it('returns the original position when it fits within the viewport', () => {
    stubViewport(1920, 1080);
    expect(clampToViewport(100, 100, 200, 100)).toEqual({ left: 100, top: 100 });
  });

  it('clamps left when the element would overflow the right edge', () => {
    stubViewport(400, 600);
    // x=350, width=100, margin=8 → max left = 400 - 100 - 8 = 292
    expect(clampToViewport(350, 50, 100, 50)).toEqual({ left: 292, top: 50 });
  });

  it('clamps top when the element would overflow the bottom edge', () => {
    stubViewport(1920, 300);
    // y=280, height=50, margin=8 → max top = 300 - 50 - 8 = 242
    expect(clampToViewport(50, 280, 100, 50)).toEqual({ left: 50, top: 242 });
  });

  it('respects a custom margin', () => {
    stubViewport(500, 500);
    // x=490, width=20, margin=20 → max left = 500 - 20 - 20 = 460
    expect(clampToViewport(490, 0, 20, 10, 20)).toEqual({ left: 460, top: 0 });
  });
});
