import { applyZoomStep, panOnZoom, type ViewportState } from './viewport';
import { ToolController } from './toolController';
import { PanHandler } from './panHandler';
import {
  startPinDrag, attachPinDragListeners, startMarqueeSelectionDrag,
  applySelectionMode,
  type DragState,
} from './drag';
import { findPinAt as hitFindPin } from './hitTest';
import { CanvasPipeline, type PipelineState } from './pipeline';
import { useEditorStore } from '../../editor/editorStore';
import type { Color, ColorSample } from '../../../types';
import type { ToolId, SelectionMode } from '../../../tools';
import type { ToolState } from './interactionMachine';

type Listener = () => void;
type ViewportListener = (v: ViewportState) => void;

interface EngineState {
  viewport: ViewportState;
  drag: DragState;
  tool: ToolState;
  pipeline: PipelineState;
  selectionMode: SelectionMode;
}

export class CanvasEngine {
  private state: EngineState = {
    viewport: { panX: 0, panY: 0, scale: 1 },
    drag: { type: 'none' },
    tool: { activeTool: 'select', isSampling: false, samplingColorId: null, samplingLevels: null, samplingRadius: 30 },
    pipeline: { status: 'idle', error: null },
    selectionMode: 'new',
  };
  private listeners = new Set<Listener>();
  private viewportListeners = new Set<ViewportListener>();
  private panHandler = new PanHandler();
  private toolController = new ToolController((t) => { this.state = { ...this.state, tool: t }; this.notify(); });
  readonly pipeline: CanvasPipeline;
  private palette: Color[] = [];
  private sourceImage: { width: number; height: number } | null = null;
  private onPinMoveEnd: ((colorId: string, sample: ColorSample) => void) | null = null;

  private notifyViewport(): void { this.viewportListeners.forEach((l) => l(this.state.viewport)); }
  private commit(viewport: ViewportState): void {
    this.state = { ...this.state, viewport };
    this.notifyViewport();
    this.notify();
  }
  private notify(): void { this.listeners.forEach((l) => l()); }

  constructor(filteredCanvasRef: { readonly current: HTMLCanvasElement | null } = { current: null }) {
    this.pipeline = new CanvasPipeline(
      (pipelineState) => { this.state = { ...this.state, pipeline: pipelineState }; this.notify(); },
      () => filteredCanvasRef.current,
    );
  }

  subscribe(l: Listener): () => void { this.listeners.add(l); return () => this.listeners.delete(l); }
  subscribeToViewport(cb: ViewportListener): () => void {
    this.viewportListeners.add(cb); return () => this.viewportListeners.delete(cb);
  }

  setSourceData(palette: Color[], sourceImage: { width: number; height: number } | null): void {
    this.palette = palette;
    this.sourceImage = sourceImage;
  }

  handleWheel(e: WheelEvent, rect: DOMRect): void {
    const prev = this.state.viewport;
    const newScale = applyZoomStep(prev.scale, e.deltaY < 0);
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    this.commit({
      scale: newScale,
      panX: panOnZoom(mx, prev.panX, prev.scale, newScale),
      panY: panOnZoom(my, prev.panY, prev.scale, newScale),
    });
  }

  handleMouseDown(e: MouseEvent, canvasRect: DOMRect): void {
    if (e.button === 1) { this.handlePanStart(e); return; }
    if (this.state.tool.activeTool === 'marquee' && e.button === 0) {
      this._startMarqueeDrag(e, canvasRect); return;
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
    const { isSampling, activeTool } = this.state.tool;
    if (isSampling || activeTool === 'select' || activeTool === 'marquee') return;
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

  findPinAt(cx: number, cy: number, canvasRect: DOMRect): string | null {
    if (!this.sourceImage) return null;
    const { hiddenPinIds } = useEditorStore.getState();
    const visible = this.palette.filter((c) => !hiddenPinIds.has(c.id));
    return hitFindPin(cx, cy, visible, canvasRect, this.sourceImage.width, this.sourceImage.height);
  }

  getSnapshot(): EngineState { return this.state; }
  setOnPinMoveEnd(cb: (colorId: string, sample: ColorSample) => void): void { this.onPinMoveEnd = cb; }
  setSelectionMode(mode: SelectionMode): void { this.state = { ...this.state, selectionMode: mode }; this.notify(); }
  setActiveTool(id: ToolId): void {
    if (id !== 'marquee') this.setSelectionMode('new');
    if (id === 'eyedropper') this.activateEyedropper();
    else this.selectTool(id as 'select' | 'marquee');
  }
  resetTransform(): void { this.commit({ panX: 0, panY: 0, scale: 1 }); }
  selectTool(id: 'select' | 'marquee'): void { this.toolController.selectTool(id); }
  activateEyedropper(): void { this.toolController.activateEyedropper(); }
  toggleMarquee(): void { this.toolController.toggleMarquee(); }
  startSamplingColor(colorId: string): void { this.toolController.startSamplingColor(colorId); }
  startSamplingLevels(filterId: string, point: 'black' | 'white'): void { this.toolController.startSamplingLevels(filterId, point); }
  completeSample(): void { this.toolController.completeSample(); }
  cancel(): void { this.toolController.cancel(); }
  setSamplingRadius(radius: number): void { this.toolController.setSamplingRadius(radius); }

  private _startMarqueeDrag(e: MouseEvent, canvasRect: DOMRect): void {
    startMarqueeSelectionDrag(
      e, canvasRect, this.palette,
      this.sourceImage?.width ?? 0, this.sourceImage?.height ?? 0,
      (s) => {
        this.state = {
          ...this.state,
          drag: s ? { type: 'marquee', start: { x: s.startX, y: s.startY }, current: { x: s.endX, y: s.endY } } : { type: 'none' },
        };
        this.notify();
      },
      (ids, shiftKey, altKey) => {
        const mode: SelectionMode = shiftKey ? 'add' : altKey ? 'subtract' : this.state.selectionMode;
        const store = useEditorStore.getState();
        store.setSelectedColorIds(applySelectionMode(store.selectedColorIds, ids, mode));
      },
    );
  }
}
