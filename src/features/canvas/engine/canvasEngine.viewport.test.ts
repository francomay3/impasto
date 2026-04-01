import { describe, it, expect } from 'vitest'
import {
  VIEWPORT_MAX_SCALE,
} from './viewport'
import { CanvasEngine } from './CanvasEngine'

const fakeRect = { left: 0, top: 0 } as DOMRect

describe('CanvasEngine.handleWheel', () => {
  it('zooms in when deltaY < 0', () => {
    const engine = new CanvasEngine()
    const e = { deltaY: -100, clientX: 0, clientY: 0 } as WheelEvent
    engine.handleWheel(e, fakeRect)
    expect(engine.getSnapshot().viewport.scale).toBeGreaterThan(1)
  })

  it('zooms out when deltaY > 0', () => {
    const engine = new CanvasEngine()
    const e = { deltaY: 100, clientX: 0, clientY: 0 } as WheelEvent
    engine.handleWheel(e, fakeRect)
    expect(engine.getSnapshot().viewport.scale).toBeLessThan(1)
  })

  it('keeps the cursor point fixed in canvas space', () => {
    const engine = new CanvasEngine()
    const e = { deltaY: -100, clientX: 200, clientY: 150 } as WheelEvent
    engine.handleWheel(e, fakeRect)
    const { panX, panY, scale } = engine.getSnapshot().viewport
    expect((200 - panX) / scale).toBeCloseTo(200, 5)
    expect((150 - panY) / scale).toBeCloseTo(150, 5)
  })

  it('notifies subscribers on zoom', () => {
    const engine = new CanvasEngine()
    const listener = { called: false }
    engine.subscribe(() => { listener.called = true })
    engine.handleWheel({ deltaY: -100, clientX: 0, clientY: 0 } as WheelEvent, fakeRect)
    expect(listener.called).toBe(true)
  })

  it('clamps scale at VIEWPORT_MAX_SCALE', () => {
    const engine = new CanvasEngine()
    const e = { deltaY: -100, clientX: 0, clientY: 0 } as WheelEvent
    for (let i = 0; i < 100; i++) engine.handleWheel(e, fakeRect)
    expect(engine.getSnapshot().viewport.scale).toBe(VIEWPORT_MAX_SCALE)
  })
})

describe('CanvasEngine.resetTransform', () => {
  it('resets viewport to identity', () => {
    const engine = new CanvasEngine()
    engine.handleWheel({ deltaY: -100, clientX: 100, clientY: 100 } as WheelEvent, { left: 0, top: 0 } as DOMRect)
    engine.resetTransform()
    expect(engine.getSnapshot().viewport).toEqual({ panX: 0, panY: 0, scale: 1 })
  })

  it('drag is none after resetTransform', () => {
    const engine = new CanvasEngine()
    engine.resetTransform()
    expect(engine.getSnapshot().drag).toEqual({ type: 'none' })
  })

  it('notifies subscribers', () => {
    const engine = new CanvasEngine()
    const listener = { called: false }
    engine.subscribe(() => { listener.called = true })
    engine.resetTransform()
    expect(listener.called).toBe(true)
  })
})
