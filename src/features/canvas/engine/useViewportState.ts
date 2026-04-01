import { useSyncExternalStore } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import type { CanvasEngine } from './CanvasEngine'

/**
 * Thin React adapter for engine viewport state.
 * Returns the same API shape as the deleted useViewportTransform hook.
 */
export function useViewportState(engine: CanvasEngine) {
  const state = useSyncExternalStore(
    engine.subscribe.bind(engine),
    () => engine.getSnapshot()
  )

  return {
    transform: state.viewport,
    isDragging: state.drag.type === 'pan',
    handleWheel: engine.handleWheel.bind(engine),
    handleMouseDown: (e: ReactMouseEvent) => engine.handlePanStart(e.nativeEvent),
    resetTransform: engine.resetTransform.bind(engine),
    subscribeToTransform: engine.subscribeToViewport.bind(engine),
  }
}
