import { describe, it, expect } from 'vitest'
import { movePaletteItemBefore, appendPaletteItemToGroup, reorderWithinGroup } from './paletteDndTransforms'
import type { Color } from '../../../types'

function color(id: string, groupId?: string): Color {
  return { id, hex: '#000000', locked: false, ratio: 0, mixRecipe: '', groupId }
}

// ─── movePaletteItemBefore ────────────────────────────────────────────────────

describe('movePaletteItemBefore', () => {
  it('returns the palette unchanged when active and over are in the same group', () => {
    const palette = [color('a', 'g1'), color('b', 'g1'), color('c', 'g2')]
    const result = movePaletteItemBefore(palette, 'a', 'b')
    expect(result).toBe(palette)
  })

  it('returns the palette unchanged when active id is not found', () => {
    const palette = [color('a', 'g1'), color('b', 'g2')]
    expect(movePaletteItemBefore(palette, 'x', 'b')).toBe(palette)
  })

  it('returns the palette unchanged when over id is not found', () => {
    const palette = [color('a', 'g1'), color('b', 'g2')]
    expect(movePaletteItemBefore(palette, 'a', 'x')).toBe(palette)
  })

  it('moves active before over and adopts over groupId', () => {
    // 'a' is moved to appear before 'b' in the palette, adopting 'g2'
    const palette = [color('a', 'g1'), color('b', 'g2'), color('c', 'g2')]
    const result = movePaletteItemBefore(palette, 'a', 'b')
    const ids = result.map(c => c.id)
    expect(ids).toEqual(['a', 'b', 'c'])
    expect(result.find(c => c.id === 'a')?.groupId).toBe('g2')
  })

  it('moves active from end to before a target in a different group', () => {
    // 'c' (g2) dropped before 'a' (g1) → c moves to position 0, adopts g1
    const palette = [color('a', 'g1'), color('b', 'g1'), color('c', 'g2')]
    const result = movePaletteItemBefore(palette, 'c', 'a')
    expect(result.map(x => x.id)).toEqual(['c', 'a', 'b'])
    expect(result.find(x => x.id === 'c')?.groupId).toBe('g1')
  })

  it('preserves total palette length', () => {
    const palette = [color('a', 'g1'), color('b', 'g2'), color('c', 'g2'), color('d')]
    const result = movePaletteItemBefore(palette, 'a', 'c')
    expect(result).toHaveLength(palette.length)
  })

  it('can move an ungrouped color before a grouped color', () => {
    const palette = [color('a'), color('b', 'g1')]
    const result = movePaletteItemBefore(palette, 'a', 'b')
    expect(result.map(c => c.id)).toEqual(['a', 'b'])
    expect(result.find(c => c.id === 'a')?.groupId).toBe('g1')
  })
})

// ─── appendPaletteItemToGroup ─────────────────────────────────────────────────

describe('appendPaletteItemToGroup', () => {
  it('returns the palette unchanged when the color already belongs to the target group', () => {
    const palette = [color('a', 'g1'), color('b', 'g2')]
    expect(appendPaletteItemToGroup(palette, 'a', 'g1')).toBe(palette)
  })

  it('returns the palette unchanged when active id is not found', () => {
    const palette = [color('a', 'g1')]
    expect(appendPaletteItemToGroup(palette, 'x', 'g1')).toBe(palette)
  })

  it('appends the color after the last member of the target group', () => {
    const palette = [color('a', 'g1'), color('b', 'g1'), color('c', 'g2'), color('d', 'g2')]
    const result = appendPaletteItemToGroup(palette, 'c', 'g1')
    const ids = result.map(x => x.id)
    // 'c' should appear after 'b' (last of g1) with groupId updated to 'g1'
    expect(ids).toEqual(['a', 'b', 'c', 'd'])
    expect(result.find(x => x.id === 'c')?.groupId).toBe('g1')
  })

  it('appends to ungrouped section when targetGroupId is undefined', () => {
    const palette = [color('a', 'g1'), color('b'), color('c')]
    const result = appendPaletteItemToGroup(palette, 'a', undefined)
    expect(result.find(x => x.id === 'a')?.groupId).toBeUndefined()
  })

  it('places at index 0 when no existing group member is found', () => {
    // Target group 'g2' has no existing members → append after index -1 → position 0
    const palette = [color('a', 'g1'), color('b', 'g1')]
    const result = appendPaletteItemToGroup(palette, 'a', 'g2')
    expect(result[0].id).toBe('a')
    expect(result[0].groupId).toBe('g2')
  })

  it('preserves total palette length', () => {
    const palette = [color('a', 'g1'), color('b', 'g2'), color('c', 'g2')]
    const result = appendPaletteItemToGroup(palette, 'a', 'g2')
    expect(result).toHaveLength(palette.length)
  })
})

// ─── reorderWithinGroup ───────────────────────────────────────────────────────

describe('reorderWithinGroup', () => {
  it('returns the palette unchanged when active and over are in different groups', () => {
    const palette = [color('a', 'g1'), color('b', 'g2')]
    expect(reorderWithinGroup(palette, 'a', 'b')).toBe(palette)
  })

  it('returns the palette unchanged when active id is not found', () => {
    const palette = [color('a', 'g1'), color('b', 'g1')]
    expect(reorderWithinGroup(palette, 'x', 'b')).toBe(palette)
  })

  it('returns the palette unchanged when over id is not found', () => {
    const palette = [color('a', 'g1'), color('b', 'g1')]
    expect(reorderWithinGroup(palette, 'a', 'x')).toBe(palette)
  })

  it('returns the palette unchanged when old and new index are equal', () => {
    const palette = [color('a', 'g1'), color('b', 'g1')]
    expect(reorderWithinGroup(palette, 'a', 'a')).toBe(palette)
  })

  it('swaps two adjacent colors within the same group', () => {
    const palette = [color('a', 'g1'), color('b', 'g1'), color('c', 'g2')]
    const result = reorderWithinGroup(palette, 'a', 'b')
    expect(result.map(x => x.id)).toEqual(['b', 'a', 'c'])
  })

  it('moves a color to a non-adjacent position within its group', () => {
    const palette = [color('a', 'g1'), color('b', 'g1'), color('c', 'g1'), color('d', 'g2')]
    const result = reorderWithinGroup(palette, 'a', 'c')
    expect(result.map(x => x.id)).toEqual(['b', 'c', 'a', 'd'])
  })

  it('does not affect colors outside the active group', () => {
    const palette = [color('x', 'g2'), color('a', 'g1'), color('b', 'g1'), color('y', 'g2')]
    const result = reorderWithinGroup(palette, 'a', 'b')
    expect(result.find(c => c.id === 'x')?.groupId).toBe('g2')
    expect(result.find(c => c.id === 'y')?.groupId).toBe('g2')
  })

  it('preserves total palette length', () => {
    const palette = [color('a', 'g1'), color('b', 'g1'), color('c', 'g1')]
    const result = reorderWithinGroup(palette, 'a', 'c')
    expect(result).toHaveLength(palette.length)
  })
})
