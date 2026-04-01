import { describe, it, expect } from 'vitest'
import {
  startPinDrag,
  updatePinDrag,
  getPinsInMarqueeRect,
  applySelectionMode,
  type MarqueeDragState,
} from './drag'
import type { Color } from '../../../types'

const makeColor = (id: string, x: number, y: number): Color => ({
  id, hex: '#000000', locked: false, ratio: 1, mixRecipe: '', sample: { x, y, radius: 10 },
})

const makeRect = (): DOMRect =>
  ({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100, x: 0, y: 0, toJSON: () => {} } as DOMRect)

describe('startPinDrag', () => {
  it('returns null if color has no sample', () => {
    const color: Color = { id: 'c1', hex: '#fff', locked: false, ratio: 1, mixRecipe: '' }
    const e = { clientX: 10, clientY: 10 } as MouseEvent
    expect(startPinDrag('c1', e, makeRect(), [color])).toBeNull()
  })

  it('returns null if color not found', () => {
    const e = { clientX: 10, clientY: 10 } as MouseEvent
    expect(startPinDrag('missing', e, makeRect(), [])).toBeNull()
  })

  it('returns drag state with original sample', () => {
    const color = makeColor('c1', 50, 50)
    const e = { clientX: 30, clientY: 40 } as MouseEvent
    const drag = startPinDrag('c1', e, makeRect(), [color])
    expect(drag).not.toBeNull()
    expect(drag!.colorId).toBe('c1')
    expect(drag!.originalSample).toEqual({ x: 50, y: 50, radius: 10 })
    expect(drag!.currentSample).toEqual({ x: 50, y: 50, radius: 10 })
    expect(drag!.hasDragged).toBe(false)
  })
})

describe('updatePinDrag', () => {
  it('moves pin by client delta mapped to image space', () => {
    const color = makeColor('c1', 50, 50)
    const e = { clientX: 30, clientY: 40 } as MouseEvent
    const drag = startPinDrag('c1', e, makeRect(), [color])!
    // canvasRect is 100x100, image is 200x200: scale = 2
    const updated = updatePinDrag(drag, { clientX: 40, clientY: 60 } as MouseEvent, 200, 200)
    expect(updated.currentSample.x).toBe(70) // 50 + (10 * 2)
    expect(updated.currentSample.y).toBe(90) // 50 + (20 * 2)
    expect(updated.hasDragged).toBe(true)
  })

  it('clamps to image bounds', () => {
    const color = makeColor('c1', 0, 0)
    const e = { clientX: 50, clientY: 50 } as MouseEvent
    const drag = startPinDrag('c1', e, makeRect(), [color])!
    const updated = updatePinDrag(drag, { clientX: -100, clientY: -100 } as MouseEvent, 100, 100)
    expect(updated.currentSample.x).toBe(0)
    expect(updated.currentSample.y).toBe(0)
  })
})

describe('getPinsInMarqueeRect', () => {
  it('returns pins inside the rect', () => {
    const pins = [makeColor('in', 50, 50), makeColor('out', 10, 10)]
    const marquee: MarqueeDragState = {
      startX: 40, startY: 40, endX: 80, endY: 80,
      canvasRect: makeRect(), hasDragged: true,
    }
    const result = getPinsInMarqueeRect(marquee, pins, 100, 100)
    expect(result.has('in')).toBe(true)
    expect(result.has('out')).toBe(false)
  })

  it('handles reversed start/end coords', () => {
    const pins = [makeColor('c1', 50, 50)]
    const marquee: MarqueeDragState = {
      startX: 80, startY: 80, endX: 40, endY: 40,
      canvasRect: makeRect(), hasDragged: true,
    }
    expect(getPinsInMarqueeRect(marquee, pins, 100, 100).has('c1')).toBe(true)
  })
})

describe('applySelectionMode', () => {
  it('new mode replaces selection', () => {
    const result = applySelectionMode(new Set(['a']), new Set(['b']), 'new')
    expect([...result]).toEqual(['b'])
  })

  it('add mode unions', () => {
    const result = applySelectionMode(new Set(['a']), new Set(['b']), 'add')
    expect(result.has('a') && result.has('b')).toBe(true)
  })

  it('subtract mode removes', () => {
    const result = applySelectionMode(new Set(['a', 'b']), new Set(['b']), 'subtract')
    expect([...result]).toEqual(['a'])
  })

  it('intersect mode keeps overlap', () => {
    const result = applySelectionMode(new Set(['a', 'b']), new Set(['b', 'c']), 'intersect')
    expect([...result]).toEqual(['b'])
  })
})
