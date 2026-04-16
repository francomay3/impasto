import type { RawImage } from '../../../../../types';
import { drawRawImage } from '../../../../../utils/canvasUtils';
import type { ViewportPhysics } from '../../../viewport/ViewportPhysics';
import { Viewport, type ICanvasViewport } from '../../../viewport/Viewport';
import { type ViewportCanvasInputHost, type ViewportSurfaceId } from '../host/viewportInputPolicy';
import { drawViewportCanvas } from '../render/viewportCanvasRenderer';
import { ViewportCanvasResizer } from '../render/viewportCanvasResizer';
import { ViewportCanvasPointerBridge } from '../host/viewportCanvasPointerBridge';

/**
 * Shared bitmap viewport: one {@link ViewportSurfaceId} per concrete subclass
 * ({@link SourceViewportCanvas}, {@link FilteredViewportCanvas}, {@link IndexedViewportCanvas}).
 */
export abstract class ViewportCanvasBase extends Viewport implements ICanvasViewport {
  protected readonly surface: ViewportSurfaceId;
  private readonly _inputHost: ViewportCanvasInputHost;
  private readonly _unsubscribeTools: () => void;

  private readonly _canvas: HTMLCanvasElement;
  /** Holds the latest {@link RawImage} pixels; never inserted in the document. */
  private readonly _sourceCanvas: HTMLCanvasElement;
  private readonly _resizer: ViewportCanvasResizer;
  private readonly _pointerBridge: ViewportCanvasPointerBridge;
  private _displayDpr = 1;

  protected constructor(
    physics: ViewportPhysics,
    surface: ViewportSurfaceId,
    inputHost: ViewportCanvasInputHost,
  ) {
    super(physics);
    this.surface = surface;
    this._inputHost = inputHost;

    this._sourceCanvas = document.createElement('canvas');
    this._canvas = document.createElement('canvas');
    this._canvas.style.touchAction = 'none';
    this._canvas.style.display = 'block';
    this._canvas.style.boxSizing = 'border-box';

    this._pointerBridge = new ViewportCanvasPointerBridge(
      this._canvas,
      this.surface,
      this._inputHost,
      {
        proposeTransform: (t) => this.proposeViewportTransform(t),
        addColorPin: (p) => this._inputHost.addColorPinFromSample(p),
        scheduleReticleRedraw: () => this.redrawDisplay(),
        onPointerStateChange: () => this.syncPointerChrome(),
      },
      () => this.transform,
      () => this._displayDpr,
    );
    this._unsubscribeTools = inputHost.subscribeTools(() => this.syncPointerChrome());
    this.syncPointerChrome();

    const getDpr = (): number => window.devicePixelRatio || 1;
    this._resizer = new ViewportCanvasResizer(
      this._canvas,
      this._sourceCanvas,
      getDpr,
      () => {
        this._displayDpr = getDpr();
        this.redrawDisplay();
      },
    );
  }

  get canvas(): HTMLCanvasElement {
    return this._canvas;
  }

  dispose(): void {
    this._unsubscribeTools();
    this._pointerBridge.dispose();
    this._resizer.dispose();
  }

  setImage(next: RawImage): void {
    drawRawImage(this._sourceCanvas, next);
    queueMicrotask(() => this._resizer.syncAndRedraw());
  }

  /**
   * Run after the display canvas is inserted under a host (e.g. tab switch).
   * Shared {@link ViewportPhysics} may have changed while detached; resyncs size + paint.
   */
  syncDisplayToHost(): void {
    queueMicrotask(() => this._resizer.syncAndRedraw());
  }

  override notifyTransformChange(): void {
    this._resizer.syncAndRedraw();
  }

  private syncPointerChrome(): void {
    this._pointerBridge.applyToolChrome();
  }

  private redrawDisplay(): void {
    const ctx = this._canvas.getContext('2d');
    if (!ctx) return;
    drawViewportCanvas(ctx, {
      sourceCanvas: this._sourceCanvas,
      displayDpr: this._displayDpr,
      transform: this.transform,
      reticleCanvasPos: this._pointerBridge.getReticleCanvasPos(),
      inputHost: this._inputHost,
      surface: this.surface,
      pointerInsideCanvas: this._pointerBridge.getPointerInsideCanvas(),
      panDrag: this._pointerBridge.getPanDrag(),
    });
  }
}
