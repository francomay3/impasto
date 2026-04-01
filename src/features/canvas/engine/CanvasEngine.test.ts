import { describe, it, expect, vi } from 'vitest'
import { CanvasEngine } from './CanvasEngine'

describe('CanvasEngine subscription mechanism', () => {
  it('getSnapshot returns the current state', () => {
    const engine = new CanvasEngine()
    expect(engine.getSnapshot()).toEqual({
      viewport: { panX: 0, panY: 0, scale: 1 },
      drag: { type: 'none' },
      tool: { activeTool: 'select', isSampling: false, samplingColorId: null, samplingLevels: null, samplingRadius: 30 },
      pipeline: { status: 'idle', error: null },
      selectionMode: 'new',
    })
  })

  it('subscribe adds a listener that is called on state change', () => {
    const engine = new CanvasEngine()
    const listener = vi.fn()
    engine.subscribe(listener)
    engine.resetTransform()
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('unsubscribe removes the listener', () => {
    const engine = new CanvasEngine()
    const listener = vi.fn()
    const unsubscribe = engine.subscribe(listener)
    unsubscribe()
    engine.resetTransform()
    expect(listener).not.toHaveBeenCalled()
  })

  it('multiple listeners are all notified', () => {
    const engine = new CanvasEngine()
    const a = vi.fn()
    const b = vi.fn()
    engine.subscribe(a)
    engine.subscribe(b)
    engine.resetTransform()
    expect(a).toHaveBeenCalledTimes(1)
    expect(b).toHaveBeenCalledTimes(1)
  })

  it('unsubscribing one listener does not affect others', () => {
    const engine = new CanvasEngine()
    const a = vi.fn()
    const b = vi.fn()
    const unsubA = engine.subscribe(a)
    engine.subscribe(b)
    unsubA()
    engine.resetTransform()
    expect(a).not.toHaveBeenCalled()
    expect(b).toHaveBeenCalledTimes(1)
  })

  it('no listeners is a no-op', () => {
    const engine = new CanvasEngine()
    expect(() => engine.resetTransform()).not.toThrow()
  })

  it('getSnapshot returns the same reference when state has not changed', () => {
    const engine = new CanvasEngine()
    expect(engine.getSnapshot()).toBe(engine.getSnapshot())
  })
})
