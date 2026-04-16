/**
 * Manages display canvas backing-store size from host layout and device pixel ratio.
 */
export class ViewportCanvasResizer {
  private _resizeObserver: ResizeObserver | null = null;
  private _resizeObservedParent: Element | null = null;

  private readonly displayCanvas: HTMLCanvasElement;
  private readonly sourceCanvas: HTMLCanvasElement;
  private readonly getDpr: () => number;
  private readonly onRedraw: () => void;

  constructor(
    displayCanvas: HTMLCanvasElement,
    sourceCanvas: HTMLCanvasElement,
    getDpr: () => number,
    onRedraw: () => void,
  ) {
    this.displayCanvas = displayCanvas;
    this.sourceCanvas = sourceCanvas;
    this.getDpr = getDpr;
    this.onRedraw = onRedraw;
  }

  syncAndRedraw(): void {
    const parent = this.displayCanvas.parentElement;
    if (!parent) return;

    this.ensureResizeObserver(parent);

    const cssW = parent.clientWidth;
    if (cssW <= 0) return;

    const srcW = this.sourceCanvas.width;
    const srcH = this.sourceCanvas.height;
    const parentH = parent.clientHeight;
    let cssH: number;
    if (parentH > 0) {
      cssH = parentH;
    } else if (srcW > 0 && srcH > 0) {
      cssH = (cssW / srcW) * srcH;
    } else {
      cssH = 200;
    }

    const dpr = this.getDpr();
    const bw = Math.max(1, Math.floor(cssW * dpr));
    const bh = Math.max(1, Math.floor(cssH * dpr));

    if (this.displayCanvas.width !== bw || this.displayCanvas.height !== bh) {
      this.displayCanvas.width = bw;
      this.displayCanvas.height = bh;
    }
    this.displayCanvas.style.width = `${cssW}px`;
    this.displayCanvas.style.height = `${cssH}px`;

    this.onRedraw();
  }

  dispose(): void {
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
    this._resizeObservedParent = null;
  }

  private ensureResizeObserver(parent: Element): void {
    if (this._resizeObservedParent === parent && this._resizeObserver) return;
    this._resizeObserver?.disconnect();
    this._resizeObserver = new ResizeObserver(() => {
      this.syncAndRedraw();
    });
    this._resizeObserver.observe(parent);
    this._resizeObservedParent = parent;
  }
}
