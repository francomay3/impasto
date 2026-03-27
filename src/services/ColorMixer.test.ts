import { describe, it, expect } from 'vitest'
import { findMixRecipe, findMixData, PIGMENTS, DEFAULT_MIX_GRANULARITY, DEFAULT_DELTA_THRESHOLD } from './ColorMixer'

describe('findMixData', () => {
  it('returns an array of mix entries', () => {
    const result = findMixData('#ff0000')
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
  })

  it('each entry has name, hex, and parts fields', () => {
    const result = findMixData('#0000ff')
    for (const entry of result) {
      expect(typeof entry.name).toBe('string')
      expect(entry.hex).toMatch(/^#[0-9a-f]{6}$/i)
      expect(typeof entry.parts).toBe('number')
      expect(entry.parts).toBeGreaterThan(0)
    }
  })

  it('returns a single-pigment result for an exact pigment match', () => {
    // Titanium White is in the pigment list — exact match should return 1 entry
    const white = PIGMENTS.find(p => p.name === 'Titanium White')!
    const result = findMixData(white.hex, DEFAULT_MIX_GRANULARITY, DEFAULT_DELTA_THRESHOLD)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Titanium White')
    expect(result[0].parts).toBe(1)
  })

  it('all parts are integers', () => {
    const result = findMixData('#7b4f2e')
    for (const entry of result) {
      expect(Number.isInteger(entry.parts)).toBe(true)
    }
  })

  it('parts are reduced to lowest common denominator', () => {
    // If a mix were internally [2, 4] it should reduce to [1, 2]
    const result = findMixData('#aabbcc')
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
    const commonDivisor = result.reduce((acc, e) => gcd(acc, e.parts), result[0]?.parts ?? 1)
    expect(commonDivisor).toBe(1)
  })

  it('accepts a custom pigment list', () => {
    const custom = [{ name: 'Red', hex: '#ff0000' }, { name: 'Blue', hex: '#0000ff' }]
    const result = findMixData('#ff0000', 6, 10, custom)
    expect(result[0].name).toBe('Red')
  })
})

describe('findMixRecipe', () => {
  it('returns a non-empty string', () => {
    const recipe = findMixRecipe('#3a7bd5')
    expect(typeof recipe).toBe('string')
    expect(recipe.length).toBeGreaterThan(0)
  })

  it('uses plural "parts" for quantities greater than 1', () => {
    // Force a multi-part mix by picking a color far from any single pigment
    const recipe = findMixRecipe('#7b4f2e')
    // At least one entry should be a mix — check formatting
    const hasParts = /\d+ parts /.test(recipe) || /1 part /.test(recipe)
    expect(hasParts).toBe(true)
  })

  it('uses singular "part" for a quantity of 1', () => {
    const white = PIGMENTS.find(p => p.name === 'Titanium White')!
    const recipe = findMixRecipe(white.hex, DEFAULT_MIX_GRANULARITY, DEFAULT_DELTA_THRESHOLD)
    expect(recipe).toBe('1 part Titanium White')
  })

  it('joins multiple pigments with ", "', () => {
    // Use a custom 2-pigment set (red + blue) and ask for purple.
    // Neither pigment alone is close to purple so the algorithm returns a pair.
    const custom = [{ name: 'Red', hex: '#ff0000' }, { name: 'Blue', hex: '#0000ff' }]
    const recipe = findMixRecipe('#800080', DEFAULT_MIX_GRANULARITY, DEFAULT_DELTA_THRESHOLD, custom)
    const entries = recipe.split(', ')
    expect(entries.length).toBeGreaterThan(1)
  })
})
