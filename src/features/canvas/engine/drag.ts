import type { Color, ColorSample } from '../../../types'
import type { SelectionMode } from '../../../tools'
import { findPinsInRect } from './hitTest'

export interface Vec2 { x: number; y: number }

export type DragState =
  | { type: 'none' }
  | { type: 'pan'; startPan: Vec2; startCursor: Vec2 }
  | { type: 'pin'; colorId: string; currentSample: ColorSample }
  | { type: 'marquee'; start: Vec2; current: Vec2 }

interface PinDragState {
  colorId: string
  originalSample: ColorSample
  currentSample: ColorSample
  startClientX: number
  startClientY: number
  canvasRect: DOMRect
  hasDragged: boolean
}

export interface MarqueeDragState {
  startX: number
  startY: number
  endX: number
  endY: number
  canvasRect: DOMRect
  hasDragged: boolean
}

export function startPinDrag(colorId: string, e: MouseEvent, canvasRect: DOMRect, palette: Color[]): PinDragState | null {
  const color = palette.find(c => c.id === colorId)
  if (!color?.sample) return null
  const original = { ...color.sample }
  return {
    colorId, originalSample: original, currentSample: original,
    startClientX: e.clientX, startClientY: e.clientY, canvasRect, hasDragged: false,
  }
}

export function updatePinDrag(drag: PinDragState, e: MouseEvent, imgW: number, imgH: number): PinDragState {
  const { canvasRect, originalSample, startClientX, startClientY } = drag
  const dx = (e.clientX - startClientX) * (imgW / canvasRect.width)
  const dy = (e.clientY - startClientY) * (imgH / canvasRect.height)
  const x = Math.round(Math.max(0, Math.min(imgW - 1, originalSample.x + dx)))
  const y = Math.round(Math.max(0, Math.min(imgH - 1, originalSample.y + dy)))
  return { ...drag, currentSample: { ...originalSample, x, y }, hasDragged: true }
}

/** Attach window listeners to track pin drag after initial mousedown. */
export function attachPinDragListeners(
  initial: PinDragState,
  getSourceImage: () => { width: number; height: number } | null,
  onUpdate: (state: PinDragState) => void,
  onEnd: (hasDragged: boolean, final: PinDragState) => void,
): void {
  let current = initial
  const onMove = (ev: MouseEvent) => {
    const img = getSourceImage()
    if (!img) return
    current = updatePinDrag(current, ev, img.width, img.height)
    onUpdate(current)
  }
  const onUp = () => {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
    onEnd(current.hasDragged, current)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

export function getPinsInMarqueeRect(marquee: MarqueeDragState, pins: Color[], imgW: number, imgH: number): Set<string> {
  return findPinsInRect(
    { startX: marquee.startX, startY: marquee.startY, endX: marquee.endX, endY: marquee.endY },
    pins, marquee.canvasRect, imgW, imgH,
  )
}

export function applySelectionMode(current: Set<string>, incoming: Set<string>, mode: SelectionMode): Set<string> {
  if (mode === 'add') return new Set([...current, ...incoming])
  if (mode === 'subtract') return new Set([...current].filter(id => !incoming.has(id)))
  if (mode === 'intersect') return new Set([...current].filter(id => incoming.has(id)))
  return incoming
}

