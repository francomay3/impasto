import { describe, it, expect } from 'vitest'
import {
  applyZoomStep,
  panOnZoom,
  panOnDrag,
  VIEWPORT_MIN_SCALE,
  VIEWPORT_MAX_SCALE,
  VIEWPORT_ZOOM_FACTOR,
} from './viewport'

// ─── Pure function tests ────────────────────────────────────────────────────

describe('applyZoomStep', () => {
  it('increases scale when zooming in', () => {
    const result = applyZoomStep(1, true)
    expect(result).toBeGreaterThan(1)
    expect(result).toBeCloseTo(VIEWPORT_ZOOM_FACTOR, 5)
  })

  it('decreases scale when zooming out', () => {
    const result = applyZoomStep(1, false)
    expect(result).toBeLessThan(1)
    expect(result).toBeCloseTo(1 / VIEWPORT_ZOOM_FACTOR, 5)
  })

  it('clamps at minimum scale', () => {
    expect(applyZoomStep(VIEWPORT_MIN_SCALE, false)).toBe(VIEWPORT_MIN_SCALE)
    expect(applyZoomStep(0.001, false)).toBe(VIEWPORT_MIN_SCALE)
  })

  it('clamps at maximum scale', () => {
    expect(applyZoomStep(VIEWPORT_MAX_SCALE, true)).toBe(VIEWPORT_MAX_SCALE)
    expect(applyZoomStep(1000, true)).toBe(VIEWPORT_MAX_SCALE)
  })

  it('zooming in then out returns approximately the original scale', () => {
    const original = 2
    const zoomedIn = applyZoomStep(original, true)
    const restored = applyZoomStep(zoomedIn, false)
    expect(restored).toBeCloseTo(original, 10)
  })

  it('respects custom min and max bounds', () => {
    expect(applyZoomStep(0.5, false, 0.5, 4)).toBe(0.5)
    expect(applyZoomStep(4, true, 0.5, 4)).toBe(4)
  })
})

describe('panOnZoom', () => {
  it('keeps pan unchanged when scale does not change', () => {
    expect(panOnZoom(400, 100, 1, 1)).toBeCloseTo(100)
  })

  it('keeps the cursor point fixed in canvas space when zooming in', () => {
    // Cursor at 200, pan 0, scale 1→2: newPan = 200 - (200-0)*(2/1) = -200
    expect(panOnZoom(200, 0, 1, 2)).toBeCloseTo(-200)
  })

  it('keeps the cursor point fixed in canvas space when zooming out', () => {
    // Cursor at 200, pan -200, scale 2→1: newPan = 200 - (200-(-200))*(1/2) = 0
    expect(panOnZoom(200, -200, 2, 1)).toBeCloseTo(0)
  })

  it('cursor at pan origin stays at origin regardless of zoom', () => {
    const pan = 150
    expect(panOnZoom(pan, pan, 1, 3)).toBeCloseTo(pan)
  })

  it('handles non-origin cursor with existing pan offset', () => {
    // pan=50, scale 1→1.5, cursor at 300: newPan = 300 - (300-50)*1.5 = -75
    expect(panOnZoom(300, 50, 1, 1.5)).toBeCloseTo(-75)
  })
})

describe('panOnDrag', () => {
  it('returns startPan when cursor has not moved', () => {
    expect(panOnDrag(100, 200, 200)).toBe(100)
  })

  it('increases pan when dragging right', () => {
    expect(panOnDrag(0, 100, 150)).toBe(50)
  })

  it('decreases pan when dragging left', () => {
    expect(panOnDrag(0, 100, 50)).toBe(-50)
  })

  it('applies the full delta from start position (not incremental)', () => {
    expect(panOnDrag(30, 100, 200)).toBe(130)
    expect(panOnDrag(30, 100, 50)).toBe(-20)
  })
})
