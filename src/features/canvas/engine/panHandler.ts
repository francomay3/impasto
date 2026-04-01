import { panOnDrag, type ViewportState } from './viewport'
import type { Vec2 } from './drag'

export class PanHandler {
  private drag: { startX: number; startY: number; startPanX: number; startPanY: number } | null = null

  get isActive(): boolean { return this.drag !== null }

  start(
    e: MouseEvent,
    viewport: ViewportState,
    onStart: (startPan: Vec2, startCursor: Vec2) => void,
    onMove: (viewport: ViewportState) => void,
    onEnd: () => void
  ): void {
    if (e.button !== 0 && e.button !== 1) return
    if ((e.target as HTMLElement | null)?.closest?.('[data-no-pan]')) return
    if (this.drag) return
    ;(document.activeElement as HTMLElement | null)?.blur()

    this.drag = { startX: e.clientX, startY: e.clientY, startPanX: viewport.panX, startPanY: viewport.panY }
    onStart({ x: viewport.panX, y: viewport.panY }, { x: e.clientX, y: e.clientY })

    let rafPending = false
    let latestEv: MouseEvent | null = null

    const onMove_ = (ev: MouseEvent) => {
      latestEv = ev
      if (rafPending) return
      rafPending = true
      requestAnimationFrame(() => {
        rafPending = false
        if (!this.drag || !latestEv) return
        const d = this.drag
        onMove({ scale: viewport.scale, panX: panOnDrag(d.startPanX, d.startX, latestEv.clientX), panY: panOnDrag(d.startPanY, d.startY, latestEv.clientY) })
        latestEv = null
      })
    }

    const onUp = () => {
      this.drag = null
      latestEv = null
      onEnd()
      window.removeEventListener('mousemove', onMove_)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove_)
    window.addEventListener('mouseup', onUp)
  }
}
