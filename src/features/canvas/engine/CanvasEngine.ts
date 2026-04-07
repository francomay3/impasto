import { applyZoomStep, panOnZoom, type ViewportState } from './viewport';
import { ToolStateManager } from './toolStateManager';
import { PanHandler } from './panHandler';
import {
  startPinDrag, attachPinDragListeners, applySelectionMode,
  type DragState,
} from './drag';
import { findPinsInRect } from './hitTest';
import { MarqueeController } from '../tools/MarqueeController';
import { CanvasPipeline, type PipelineState } from './pipeline';
import { useEditorStore } from '../../editor/editorStore';
import type { Color, ColorSample, RawImage, CropRect } from '../../../types';
import type { ToolId, SelectionMode } from '../../../tools';
import type { ToolState } from './toolStateManager';

type Listener = () => void;
type ViewportListener = (v: ViewportState) => void;

interface EngineState {
  viewport: ViewportState;
  drag: DragState;
  pipeline: PipelineState;
}

export class CanvasEngine {
  private state: EngineState = {
    viewport: { panX: 0, panY: 0, scale: 1 },
    drag: { type: 'none' },
    pipeline: { status: 'idle', error: null },
  };
  private _toolSnapshot: ToolState & { selectionMode: SelectionMode } = { activeTool: 'select', isSampling: false, samplingLevels: null, samplingRadius: 30, selectionMode: 'new' };
  private listeners = new Set<Listener>();
  private viewportListeners = new Set<ViewportListener>();
  private panHandler = new PanHandler();
  private marqueeController = new MarqueeController(
    (rect, shiftKey, altKey) => {
      const mode: SelectionMode = shiftKey ? 'add' : altKey ? 'subtract' : this._toolSnapshot.selectionMode;
      const ids = findPinsInRect(rect, this.palette, rect.canvasRect, this.sourceImage?.width ?? 0, this.sourceImage?.height ?? 0);
      const store = useEditorStore.getState();
      store.setSelectedColorIds(applySelectionMode(store.selectedColorIds, ids, mode));
    }
  );
  private toolController = new ToolStateManager((t) => {
    this._toolSnapshot = { ...t, selectionMode: this._toolSnapshot.selectionMode };
    useEditorStore.getState().setActivePaletteTool(t.activeTool);
    this.notify();
  });
  readonly pipeline: CanvasPipeline;
  private palette: Color[] = [];
  private sourceImage: RawImage | null = null;
  private onPinMoveEnd: ((colorId: string, sample: ColorSample) => void) | null = null;
  private transforms: { cropRect: CropRect | null; rotation: number } = { cropRect: null, rotation: 0 };

  private notifyViewport(): void { this.viewportListeners.forEach((l) => l(this.state.viewport)); }
  private commit(v: ViewportState): void { this.state = { ...this.state, viewport: v }; this.notifyViewport(); this.notify(); }
  private notify(): void { this.listeners.forEach((l) => l()); }

  constructor(filteredCanvasRef: { readonly current: HTMLCanvasElement | null } = { current: null }) {
    this.pipeline = new CanvasPipeline(
      (pipelineState) => { this.state = { ...this.state, pipeline: pipelineState }; this.notify(); },
      () => filteredCanvasRef.current,
    );
    this.marqueeController.subscribe(() => {
      const s = this.marqueeController.getState();
      this.state = { ...this.state, drag: s.type === 'dragging' ? { type: 'marquee', start: s.start, current: s.current } : { type: 'none' } };
      this.notify();
    });
  }

  subscribe(l: Listener): () => void { this.listeners.add(l); return () => this.listeners.delete(l); }
  subscribeToViewport(cb: ViewportListener): () => void {
    this.viewportListeners.add(cb); return () => this.viewportListeners.delete(cb);
  }

  setSourceImage(image: RawImage | null): void { this.sourceImage = image; }
  getSourceImage(): RawImage | null { return this.sourceImage; }
  getColorAt(x: number, y: number, radius: number): string { return this.pipeline.getColorAt(x, y, radius); }
  setSourceData(palette: Color[], image: RawImage | null): void { this.palette = palette; this.setSourceImage(image); }

  private viewportSize: { w: number; h: number } | null = null;

  private zoomAtPoint(zoomIn: boolean, cx: number, cy: number): void {
    const prev = this.state.viewport;
    const s = applyZoomStep(prev.scale, zoomIn);
    this.commit({ scale: s, panX: panOnZoom(cx, prev.panX, prev.scale, s), panY: panOnZoom(cy, prev.panY, prev.scale, s) });
  }

  handleWheel(e: WheelEvent, rect: DOMRect): void {
    e.preventDefault();
    this.zoomAtPoint(e.deltaY < 0, e.clientX - rect.left, e.clientY - rect.top);
  }

  setViewportSize(w: number, h: number): void { this.viewportSize = { w, h }; }
  zoomIn(): void { const c = this.viewportSize; this.zoomAtPoint(true, c ? c.w / 2 : 0, c ? c.h / 2 : 0); }
  zoomOut(): void { const c = this.viewportSize; this.zoomAtPoint(false, c ? c.w / 2 : 0, c ? c.h / 2 : 0); }

  handleMouseDown(e: MouseEvent, canvasRect: DOMRect): void {
    if (e.button === 1) { this.handlePanStart(e); return; }
    if (this._toolSnapshot.activeTool === 'marquee' && e.button === 0) {
      this.marqueeController.startDrag(e, canvasRect); return;
    }
    this.handlePanStart(e);
  }

  handlePanStart(e: MouseEvent): void {
    this.panHandler.start(
      e, this.state.viewport,
      (startPan, startCursor) => { this.state = { ...this.state, drag: { type: 'pan', startPan, startCursor } }; this.notify(); },
      (vp) => { this.state = { ...this.state, viewport: vp }; this.notifyViewport(); },
      () => { this.state = { ...this.state, drag: { type: 'none' } }; this.notify(); },
    );
  }

  handlePinMouseDown(colorId: string, e: MouseEvent, canvasRect: DOMRect): void {
    const { isSampling } = this._toolSnapshot;
    if (isSampling) return;
    const pinDrag = startPinDrag(colorId, e, canvasRect, this.palette);
    if (!pinDrag) return;
    this.state = { ...this.state, drag: { type: 'pin', colorId: pinDrag.colorId, currentSample: pinDrag.currentSample } };
    this.notify();
    attachPinDragListeners(
      pinDrag, () => this.sourceImage,
      (u) => { this.state = { ...this.state, drag: { type: 'pin', colorId: u.colorId, currentSample: u.currentSample } }; this.notify(); },
      (hasDragged, final) => {
        if (hasDragged) this.onPinMoveEnd?.(final.colorId, final.currentSample);
        this.state = { ...this.state, drag: { type: 'none' } };
        this.notify();
      },
    );
  }

  getSnapshot(): EngineState { return this.state; }
  getToolState(): ToolState & { selectionMode: SelectionMode } { return this._toolSnapshot; }
  setOnPinMoveEnd(cb: (colorId: string, sample: ColorSample) => void): void { this.onPinMoveEnd = cb; }
  setSelectionMode(mode: SelectionMode): void { this._toolSnapshot = { ...this._toolSnapshot, selectionMode: mode }; this.notify(); }
  setActiveTool(id: ToolId): void {
    if (id !== 'marquee') this.setSelectionMode('new');
    if (id === 'eyedropper') this.activateEyedropper();
    else this.selectTool(id as 'select' | 'marquee');
  }
  resetTransform(): void { this.commit({ panX: 0, panY: 0, scale: 1 }); }
  getTransforms(): { cropRect: CropRect | null; rotation: number } { return this.transforms; }
  // TODO: applyCrop stores the rect but CanvasPipeline does not yet render it — the cropped region
  // is not visually applied to the canvas output. Wire crop rendering in CanvasPipeline.applyFilterPipeline.
  applyCrop(rect: CropRect): void { this.transforms = { ...this.transforms, cropRect: rect }; this.notify(); }
  // TODO: applyRotation stores the angle but CanvasPipeline does not yet render it — the image is
  // not visually rotated in the canvas output. Wire rotation rendering in CanvasPipeline.applyFilterPipeline.
  applyRotation(deg: number): void { this.transforms = { ...this.transforms, rotation: deg }; this.notify(); }
  resetTransforms(): void { this.transforms = { cropRect: null, rotation: 0 }; this.notify(); }
  selectTool(id: 'select' | 'marquee'): void { this.toolController.selectTool(id); }
  activateEyedropper(): void { this.toolController.activateEyedropper(); }
  toggleMarquee(): void { this.toolController.toggleMarquee(); }
  startSamplingLevels(filterId: string, point: 'black' | 'white'): void { this.toolController.startSamplingLevels(filterId, point); }
  completeSample(): void { this.toolController.completeSample(); }
  cancel(): void { this.toolController.cancel(); }
  setSamplingRadius(radius: number): void { this.toolController.setSamplingRadius(radius); }

}
