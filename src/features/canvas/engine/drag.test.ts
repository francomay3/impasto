// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CanvasEngine } from './CanvasEngine'

vi.mock('../../editor/editorStore', () => ({
  useEditorStore: {
    getState: vi.fn(() => ({
      hiddenPinIds: new Set<string>(),
      selectedColorIds: new Set<string>(),
      setSelectedColorIds: vi.fn(),
    })),
  },
}))

const makeRect = (): DOMRect =>
  ({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100, x: 0, y: 0, toJSON: () => {} } as DOMRect)

describe('DragState transitions', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 0 })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('initial state', () => {
    it('starts with drag: none', () => {
      const engine = new CanvasEngine()
      expect(engine.getSnapshot().drag).toEqual({ type: 'none' })
    })
  })

  describe('pan drag', () => {
    it('idle → pan on handlePanStart', () => {
      const engine = new CanvasEngine()
      engine.handlePanStart(new MouseEvent('mousedown', { button: 0, clientX: 30, clientY: 40 }))
      expect(engine.getSnapshot().drag.type).toBe('pan')
    })

    it('pan state contains startPan and startCursor', () => {
      const engine = new CanvasEngine()
      engine.handlePanStart(new MouseEvent('mousedown', { button: 0, clientX: 30, clientY: 40 }))
      const { drag } = engine.getSnapshot()
      expect(drag.type).toBe('pan')
      if (drag.type === 'pan') {
        expect(drag.startCursor).toEqual({ x: 30, y: 40 })
        expect(drag.startPan).toEqual({ x: 0, y: 0 })
      }
    })

    it('pan → none on mouseup', () => {
      const engine = new CanvasEngine()
      engine.handlePanStart(new MouseEvent('mousedown', { button: 0, clientX: 50, clientY: 50 }))
      window.dispatchEvent(new MouseEvent('mouseup'))
      expect(engine.getSnapshot().drag).toEqual({ type: 'none' })
    })

    it('isDragging derived as true during pan', () => {
      const engine = new CanvasEngine()
      engine.handlePanStart(new MouseEvent('mousedown', { button: 0, clientX: 50, clientY: 50 }))
      expect(engine.getSnapshot().drag.type).toBe('pan')
    })

    it('notifies listeners on pan start and end', () => {
      const engine = new CanvasEngine()
      const listener = vi.fn()
      engine.subscribe(listener)
      engine.handlePanStart(new MouseEvent('mousedown', { button: 0, clientX: 50, clientY: 50 }))
      expect(listener).toHaveBeenCalled()
      const callsAfterStart = listener.mock.calls.length
      window.dispatchEvent(new MouseEvent('mouseup'))
      expect(listener.mock.calls.length).toBeGreaterThan(callsAfterStart)
    })
  })

  describe('marquee drag', () => {
    it('idle → marquee after mousedown + sufficient mousemove', () => {
      const engine = new CanvasEngine()
      engine.selectTool('marquee')
      engine.setSourceData([], { width: 100, height: 100 })
      engine.handleMouseDown(new MouseEvent('mousedown', { button: 0, clientX: 10, clientY: 10 }), makeRect())
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 20, clientY: 20 }))
      const { drag } = engine.getSnapshot()
      expect(drag.type).toBe('marquee')
    })

    it('marquee state contains start and current coords', () => {
      const engine = new CanvasEngine()
      engine.selectTool('marquee')
      engine.setSourceData([], { width: 100, height: 100 })
      engine.handleMouseDown(new MouseEvent('mousedown', { button: 0, clientX: 10, clientY: 10 }), makeRect())
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 30, clientY: 25 }))
      const { drag } = engine.getSnapshot()
      expect(drag.type).toBe('marquee')
      if (drag.type === 'marquee') {
        expect(drag.start).toEqual({ x: 10, y: 10 })
        expect(drag.current).toEqual({ x: 30, y: 25 })
      }
    })

    it('marquee → none on mouseup', () => {
      const engine = new CanvasEngine()
      engine.selectTool('marquee')
      engine.setSourceData([], { width: 100, height: 100 })
      engine.handleMouseDown(new MouseEvent('mousedown', { button: 0, clientX: 10, clientY: 10 }), makeRect())
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 20, clientY: 20 }))
      window.dispatchEvent(new MouseEvent('mouseup', { clientX: 20, clientY: 20 }))
      expect(engine.getSnapshot().drag).toEqual({ type: 'none' })
    })

    it('does not set marquee drag for tiny movements (< 4px)', () => {
      const engine = new CanvasEngine()
      engine.selectTool('marquee')
      engine.setSourceData([], { width: 100, height: 100 })
      engine.handleMouseDown(new MouseEvent('mousedown', { button: 0, clientX: 10, clientY: 10 }), makeRect())
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 11, clientY: 10 }))
      expect(engine.getSnapshot().drag).toEqual({ type: 'none' })
    })
  })
})
