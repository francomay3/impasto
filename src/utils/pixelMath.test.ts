import { describe, it, expect } from 'vitest'
import { clamp255, brightnessContrastChannel, hueSaturationPixel, levelsChannel } from './pixelMath'

describe('clamp255', () => {
  it('returns the value when within range', () => {
    expect(clamp255(0)).toBe(0)
    expect(clamp255(128)).toBe(128)
    expect(clamp255(255)).toBe(255)
  })

  it('clamps values below 0 to 0', () => {
    expect(clamp255(-1)).toBe(0)
    expect(clamp255(-100)).toBe(0)
  })

  it('clamps values above 255 to 255', () => {
    expect(clamp255(256)).toBe(255)
    expect(clamp255(1000)).toBe(255)
  })
})

describe('brightnessContrastChannel', () => {
  it('returns original value with zero brightness and contrast', () => {
    const v = brightnessContrastChannel(128, 0, 0)
    expect(v).toBeCloseTo(128, 0)
  })

  it('increases brightness', () => {
    const low = brightnessContrastChannel(100, 0, 0)
    const high = brightnessContrastChannel(100, 50, 0)
    expect(high).toBeGreaterThan(low)
  })

  it('decreases brightness', () => {
    const high = brightnessContrastChannel(200, 0, 0)
    const low = brightnessContrastChannel(200, -50, 0)
    expect(low).toBeLessThan(high)
  })

  it('increases contrast (expands values away from mid-grey)', () => {
    const mid = brightnessContrastChannel(200, 0, 0)
    const contrasted = brightnessContrastChannel(200, 0, 50)
    expect(contrasted).toBeGreaterThan(mid)
  })

  it('always returns a value in [0, 255]', () => {
    for (const v of [0, 50, 128, 200, 255]) {
      for (const b of [-100, 0, 100]) {
        for (const c of [-100, 0, 100]) {
          const result = brightnessContrastChannel(v, b, c)
          expect(result).toBeGreaterThanOrEqual(0)
          expect(result).toBeLessThanOrEqual(255)
        }
      }
    }
  })
})

describe('hueSaturationPixel', () => {
  it('returns unchanged values with neutral settings', () => {
    const [r, g, b] = hueSaturationPixel(100, 150, 200, 0, 0, 0)
    expect(r).toBeCloseTo(100, 0)
    expect(g).toBeCloseTo(150, 0)
    expect(b).toBeCloseTo(200, 0)
  })

  it('desaturates toward grey with saturation = -100', () => {
    const [r, g, b] = hueSaturationPixel(255, 0, 0, -100, 0, 0)
    // Full desaturation: all channels approach grey (luminance of red)
    expect(r).toBeCloseTo(g, 0)
    expect(g).toBeCloseTo(b, 0)
  })

  it('positive temperature shifts red channel up and blue channel down', () => {
    const temp = 20
    const [r1] = hueSaturationPixel(128, 128, 128, 0, 0, 0)
    const [r2, , b2] = hueSaturationPixel(128, 128, 128, 0, temp, 0)
    expect(r2).toBeGreaterThan(r1)
    expect(b2).toBeLessThan(128)
  })

  it('returns values in [0, 255]', () => {
    for (const [r, g, b] of [[0, 0, 0], [255, 255, 255], [128, 64, 192]]) {
      const result = hueSaturationPixel(r, g, b, 50, 30, -20)
      for (const ch of result) {
        expect(ch).toBeGreaterThanOrEqual(0)
        expect(ch).toBeLessThanOrEqual(255)
      }
    }
  })
})

describe('levelsChannel', () => {
  it('passes through unchanged with default levels (0–255)', () => {
    expect(levelsChannel(0, 0, 255)).toBe(0)
    expect(levelsChannel(128, 0, 255)).toBeCloseTo(128, 0)
    expect(levelsChannel(255, 0, 255)).toBe(255)
  })

  it('maps blackPoint to 0', () => {
    expect(levelsChannel(50, 50, 255)).toBe(0)
  })

  it('maps whitePoint to 255', () => {
    expect(levelsChannel(200, 0, 200)).toBe(255)
  })

  it('expands range between blackPoint and whitePoint to 0–255', () => {
    // value 128 in range [0, 200] → (128/200)*255 ≈ 163
    expect(levelsChannel(128, 0, 200)).toBeCloseTo((128 / 200) * 255, 0)
  })

  it('clamps values below blackPoint to 0', () => {
    expect(levelsChannel(10, 50, 255)).toBe(0)
  })

  it('clamps values above whitePoint to 255', () => {
    expect(levelsChannel(250, 0, 200)).toBe(255)
  })

  it('returns values in [0, 255]', () => {
    for (const v of [0, 50, 128, 200, 255]) {
      const result = levelsChannel(v, 30, 200)
      expect(result).toBeGreaterThanOrEqual(0)
      expect(result).toBeLessThanOrEqual(255)
    }
  })
})
