/**
 * Hover state, sample reticle backing-store position, and coalesced redraw scheduling for a viewport canvas.
 *
 * Separated from {@link ViewportCanvasPointerBridge} so the bridge file stays within the effective-line budget.
 * `getPanDrag` is passed per call so construction order stays independent of {@link ViewportCanvasPanWheelPointer}.
 *
 * **Invariants:** At most one `requestAnimationFrame` callback is scheduled via `_reticleRedrawRaf`; overlapping
 * invalidations coalesce into a single redraw per frame. Reticle canvas coordinates are stored in backing-store space.
 */

import { viewportCanvasPointerUi } from '../chrome/viewportCanvasPointerUi';
import { clientToBackingStorePixel } from '../space/viewportCanvasSpace';
import type { ViewportCanvasInputHost, ViewportSurfaceId } from './viewportInputPolicy';
import type { ViewportCanvasPanDragState } from '../render/viewportCanvasRenderer';

export class ViewportCanvasPointerReticleChrome {
  private _pointerInsideCanvas = false;
  private _reticleCanvasPos: { x: number; y: number } | null = null;
  private _reticleRedrawRaf = 0;

  private readonly canvas: HTMLCanvasElement;
  private readonly surface: ViewportSurfaceId;
  private readonly inputHost: ViewportCanvasInputHost;
  private readonly requestRedraw: () => void;
  private readonly onPointerStateChange: () => void;

  constructor(
    canvas: HTMLCanvasElement,
    surface: ViewportSurfaceId,
    inputHost: ViewportCanvasInputHost,
    requestRedraw: () => void,
    onPointerStateChange: () => void,
  ) {
    this.canvas = canvas;
    this.surface = surface;
    this.inputHost = inputHost;
    this.requestRedraw = requestRedraw;
    this.onPointerStateChange = onPointerStateChange;
  }

  getPointerInsideCanvas(): boolean {
    return this._pointerInsideCanvas;
  }

  getReticleCanvasPos(): { x: number; y: number } | null {
    return this._reticleCanvasPos;
  }

  onPointerEnter(): void {
    this._pointerInsideCanvas = true;
    this.onPointerStateChange();
  }

  onPointerLeave(): void {
    this._pointerInsideCanvas = false;
    this.onPointerStateChange();
  }

  pointerChrome(getPanDrag: () => ViewportCanvasPanDragState | null) {
    const tools = this.inputHost.getToolsState();
    return viewportCanvasPointerUi({
      surface: this.surface,
      toolId: tools.activeTool.id,
      pointerInside: this._pointerInsideCanvas,
      panDrag: getPanDrag(),
    });
  }

  /** Cursor + whether the sample ring is allowed; clears ring storage when inactive. */
  applyToolChrome(getPanDrag: () => ViewportCanvasPanDragState | null): void {
    const ui = this.pointerChrome(getPanDrag);
    this.canvas.style.cursor = ui.cursor;
    if (!ui.sampleRingActive) {
      this._reticleCanvasPos = null;
    }
    this.scheduleReticleRedrawCoalesced();
  }

  updateHoverReticleIfActive(getPanDrag: () => ViewportCanvasPanDragState | null, clientX: number, clientY: number): void {
    const ui = this.pointerChrome(getPanDrag);
    if (ui.sampleRingActive) {
      this._reticleCanvasPos = clientToBackingStorePixel(this.canvas, clientX, clientY);
      this.scheduleReticleRedrawCoalesced();
    }
  }

  updateReticleForPanMove(clientX: number, clientY: number): void {
    this._reticleCanvasPos = clientToBackingStorePixel(this.canvas, clientX, clientY);
    this.scheduleReticleRedrawCoalesced();
  }

  dispose(): void {
    if (this._reticleRedrawRaf !== 0) {
      cancelAnimationFrame(this._reticleRedrawRaf);
      this._reticleRedrawRaf = 0;
    }
  }

  private scheduleReticleRedrawCoalesced(): void {
    if (this._reticleRedrawRaf !== 0) return;
    this._reticleRedrawRaf = requestAnimationFrame(() => {
      this._reticleRedrawRaf = 0;
      this.requestRedraw();
    });
  }
}
