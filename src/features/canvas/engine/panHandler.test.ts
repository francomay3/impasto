import { describe, it, expect, vi, afterEach } from 'vitest'
import { PanHandler } from './panHandler'

afterEach(() => {
  vi.unstubAllGlobals()
})

function stubWindow() {
  const listeners: Record<string, EventListener> = {}
  vi.stubGlobal('window', {
    addEventListener: (type: string, fn: EventListener) => { listeners[type] = fn },
    removeEventListener: () => {},
  })
  vi.stubGlobal('document', { activeElement: null })
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 0 })
  return listeners
}

describe('PanHandler.isActive', () => {
  it('is false before any drag starts', () => {
    const handler = new PanHandler()
    expect(handler.isActive).toBe(false)
  })

  it('becomes true after start is called with button 0', () => {
    const listeners = stubWindow()
    const handler = new PanHandler()
    const viewport = { panX: 0, panY: 0, scale: 1 }
    const e = { button: 0, clientX: 100, clientY: 100, target: null } as unknown as MouseEvent
    handler.start(e, viewport, vi.fn(), vi.fn(), vi.fn())
    expect(handler.isActive).toBe(true)
    // Clean up — trigger mouseup to remove listeners
    listeners['mouseup']?.({} as Event)
  })

  it('ignores button 2 (right-click)', () => {
    stubWindow()
    const handler = new PanHandler()
    const viewport = { panX: 0, panY: 0, scale: 1 }
    const e = { button: 2, clientX: 0, clientY: 0, target: null } as unknown as MouseEvent
    handler.start(e, viewport, vi.fn(), vi.fn(), vi.fn())
    expect(handler.isActive).toBe(false)
  })

  it('calls onMove via requestAnimationFrame when mousemove fires', () => {
    const listeners = stubWindow()
    const handler = new PanHandler()
    const viewport = { panX: 10, panY: 20, scale: 1 }
    const onMove = vi.fn()
    const e = { button: 0, clientX: 50, clientY: 60, target: null } as unknown as MouseEvent
    handler.start(e, viewport, vi.fn(), onMove, vi.fn())
    const moveEv = { clientX: 70, clientY: 80 } as MouseEvent
    listeners['mousemove']?.(moveEv as unknown as Event)
    expect(onMove).toHaveBeenCalledTimes(1)
  })
})
