/**
 * DOM listener shell for one viewport canvas: wires pointer + wheel events into marquee, pan/zoom, and reticle helpers.
 *
 * **Invariants:** Pointer-down handling keeps the historical precedence **color sample → marquee (when allowed) → pan**
 * so tool semantics match pre-split behaviour. Each helper owns its own mutable session (`ViewportCanvasMarqueePointerSession`,
 * `ViewportCanvasPanWheelPointer`, `ViewportCanvasPointerReticleChrome`); this file only forwards events and supplies
 * `imageFromClient` using backing-store scale.
 *
 * **Coupling:** Depends on {@link ViewportCanvasInputHost} policy helpers from `viewportInputPolicy` and on extracted
 * classes under the same `host/` folder — no imports of `ImpastoEngine`.
 */
import type { ViewportTransform } from '../../../viewport/models';
import { backingStorePixelToImagePixel, clientToBackingStorePixel } from '../space/viewportCanvasSpace';
import {
  allowsMarqueeSelect,
  allowsPrimaryClickColorSample,
  brushRadiusFromToolsState,
  type ViewportCanvasInputHost,
  type ViewportSurfaceId,
} from './viewportInputPolicy';
import { ViewportCanvasMarqueePointerSession } from './viewportCanvasMarqueePointerSession';
import { ViewportCanvasPanWheelPointer } from './viewportCanvasPanWheelPointer';
import { ViewportCanvasPointerReticleChrome } from './viewportCanvasPointerReticleChrome';

type ViewportCanvasPointerCallbacks = {
  proposeTransform(next: ViewportTransform): void;
  addColorPin(payload: {
    surface: ViewportSurfaceId;
    imageX: number;
    imageY: number;
    radiusPx: number;
  }): void;
  scheduleReticleRedraw(): void;
  onPointerStateChange(): void;
};

/**
 * Pointer + wheel listeners for a viewport display canvas; composes marquee, pan/wheel, and reticle helpers.
 */
export class ViewportCanvasPointerBridge {
  private readonly canvas: HTMLCanvasElement;
  private readonly surface: ViewportSurfaceId;
  private readonly inputHost: ViewportCanvasInputHost;
  private readonly callbacks: ViewportCanvasPointerCallbacks;
  private readonly getTransform: () => ViewportTransform;
  private readonly getDisplayDpr: () => number;

  private readonly _reticle: ViewportCanvasPointerReticleChrome;
  private readonly _marquee: ViewportCanvasMarqueePointerSession;
  private readonly _panWheel: ViewportCanvasPanWheelPointer;

  constructor(
    canvas: HTMLCanvasElement,
    surface: ViewportSurfaceId,
    inputHost: ViewportCanvasInputHost,
    callbacks: ViewportCanvasPointerCallbacks,
    getTransform: () => ViewportTransform,
    getDisplayDpr: () => number,
  ) {
    this.canvas = canvas;
    this.surface = surface;
    this.inputHost = inputHost;
    this.callbacks = callbacks;
    this.getTransform = getTransform;
    this.getDisplayDpr = getDisplayDpr;

    this._reticle = new ViewportCanvasPointerReticleChrome(
      this.canvas,
      this.surface,
      this.inputHost,
      () => this.callbacks.scheduleReticleRedraw(),
      () => this.callbacks.onPointerStateChange(),
    );
    this._panWheel = new ViewportCanvasPanWheelPointer({
      canvas: this.canvas,
      surface: this.surface,
      inputHost: this.inputHost,
      getTransform: this.getTransform,
      proposeTransform: (t) => this.callbacks.proposeTransform(t),
      onPointerStateChange: () => this.callbacks.onPointerStateChange(),
      isSampleRingActive: () =>
        this._reticle.pointerChrome(() => this._panWheel.getPanDrag()).sampleRingActive,
      updateReticleForPanMove: (e) => this._reticle.updateReticleForPanMove(e.clientX, e.clientY),
    });
    this._marquee = new ViewportCanvasMarqueePointerSession({
      canvas: this.canvas,
      surface: this.surface,
      inputHost: this.inputHost,
      imageFromClient: (cx, cy) => this.imageFromClient(cx, cy),
      onPointerStateChange: () => this.callbacks.onPointerStateChange(),
    });

    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerenter', this.onPointerEnter);
    this.canvas.addEventListener('pointerleave', this.onPointerLeave);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointercancel', this.onPointerUp);
    this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
  }

  getPanDrag() {
    return this._panWheel.getPanDrag();
  }

  getPointerInsideCanvas(): boolean {
    return this._reticle.getPointerInsideCanvas();
  }

  getReticleCanvasPos(): { x: number; y: number } | null {
    return this._reticle.getReticleCanvasPos();
  }

  applyToolChrome(): void {
    this._reticle.applyToolChrome(() => this._panWheel.getPanDrag());
  }

  dispose(): void {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerenter', this.onPointerEnter);
    this.canvas.removeEventListener('pointerleave', this.onPointerLeave);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointercancel', this.onPointerUp);
    this.canvas.removeEventListener('wheel', this.onWheel);
    this._panWheel.dispose();
    this._marquee.dispose();
    this._reticle.dispose();
  }

  private imageFromClient(clientX: number, clientY: number): { x: number; y: number } {
    const p = clientToBackingStorePixel(this.canvas, clientX, clientY);
    return backingStorePixelToImagePixel(p, this.getTransform(), this.getDisplayDpr());
  }

  private readonly onPointerEnter = (): void => this._reticle.onPointerEnter();

  private readonly onPointerLeave = (): void => this._reticle.onPointerLeave();

  private readonly onPointerDown = (e: PointerEvent): void => {
    if (e.button === 0 || e.button === 1) {
      this.inputHost.onCanvasPointerDownBeforeTools?.({
        surface: this.surface,
        button: e.button as 0 | 1,
      });
    }

    const tools = this.inputHost.getToolsState();
    const toolId = tools.activeTool.id;

    if (e.button === 0) {
      // Precedence is load-bearing: sample-color must win when enabled, then marquee, then primary-button pan.
      if (allowsPrimaryClickColorSample(this.surface, toolId)) {
        e.preventDefault();
        const { x: ix, y: iy } = this.imageFromClient(e.clientX, e.clientY);
        this.callbacks.addColorPin({
          surface: this.surface,
          imageX: ix,
          imageY: iy,
          radiusPx: brushRadiusFromToolsState(tools),
        });
        return;
      }
      if (allowsMarqueeSelect(this.surface, toolId)) {
        this._marquee.beginPrimaryMarquee(e);
        return;
      }
      this._panWheel.tryBeginPrimaryPan(e, toolId);
      return;
    }
    if (e.button === 1) {
      if (this._panWheel.tryBeginMiddlePan(e)) return;
    }
  };

  private readonly onPointerMove = (e: PointerEvent): void => {
    if (this._marquee.consumePointerMoveIfActive(e)) return;
    if (this._panWheel.consumePointerMoveIfActive(e)) return;
    this._reticle.updateHoverReticleIfActive(() => this._panWheel.getPanDrag(), e.clientX, e.clientY);
  };

  private readonly onPointerUp = (e: PointerEvent): void => {
    if (this._marquee.consumePointerUpIfActive(e)) return;
    this._panWheel.consumePointerUpIfActive(e);
  };

  private readonly onWheel = (e: WheelEvent): void => this._panWheel.handleWheel(e);
}
