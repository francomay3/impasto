import type { ImpastoToolId, ImpastoToolsState } from '../../../tools/ToolState';
import { getImpastoTool } from '../../../tools/impastoToolRegistry';
import { sampleColorBrushRadiusFromToolsState } from '../../../tools/SampleColorTool';
import {
  allowsMiddleButtonDragPan as allowsMiddleButtonDragPanSurface,
  allowsPrimaryClickColorSample as allowsPrimaryClickColorSampleFromCaps,
  allowsPrimaryDragPan as allowsPrimaryDragPanFromCaps,
  allowsWheelZoom as allowsWheelZoomFromCaps,
  effectivePrimaryDragPan as effectivePrimaryDragPanFromCaps,
  effectiveWheelZoom as effectiveWheelZoomFromCaps,
  allowsMarqueeSelect as marqueeSelectSurfaceAllowed,
  type ViewportSurfaceId,
} from '../../../tools/toolInputCombine';

export type { ViewportSurfaceId } from '../../../tools/toolInputCombine';

/**
 * Per-tool × per-surface resolution lives in this module (one place) so behavior stays consistent across
 * {@link SourceViewportCanvas}, {@link FilteredViewportCanvas}, and {@link IndexedViewportCanvas}.
 *
 * Tool-side caps come from {@link ImpastoTool}; surface caps from {@link SURFACE_INPUT_CAPS} in toolInputCombine.
 */
export function allowsPrimaryDragPan(surface: ViewportSurfaceId, toolId: ImpastoToolId): boolean {
  return allowsPrimaryDragPanFromCaps(surface, getImpastoTool(toolId).inputCaps);
}

export function allowsWheelZoom(surface: ViewportSurfaceId, toolId: ImpastoToolId): boolean {
  return allowsWheelZoomFromCaps(surface, getImpastoTool(toolId).inputCaps);
}

export function allowsMiddleButtonDragPan(surface: ViewportSurfaceId): boolean {
  return allowsMiddleButtonDragPanSurface(surface);
}

export function allowsPrimaryClickColorSample(
  surface: ViewportSurfaceId,
  toolId: ImpastoToolId
): boolean {
  return allowsPrimaryClickColorSampleFromCaps(surface, getImpastoTool(toolId).inputCaps);
}

export function effectivePrimaryDragPan(
  surface: ViewportSurfaceId,
  toolId: ImpastoToolId
): boolean {
  return effectivePrimaryDragPanFromCaps(surface, getImpastoTool(toolId).inputCaps);
}

export function effectiveWheelZoom(surface: ViewportSurfaceId, toolId: ImpastoToolId): boolean {
  return effectiveWheelZoomFromCaps(surface, getImpastoTool(toolId).inputCaps);
}

export function allowsMarqueeSelect(surface: ViewportSurfaceId, toolId: ImpastoToolId): boolean {
  if (toolId !== 'marquee-select') {
    return false;
  }
  return marqueeSelectSurfaceAllowed(surface, getImpastoTool(toolId).inputCaps);
}

/** Image-space brush radius for the sample-color reticle and pin placement; `1` when another tool is active. */
export function brushRadiusFromToolsState(state: ImpastoToolsState): number {
  return sampleColorBrushRadiusFromToolsState(state);
}

export type ViewportCanvasInputHost = {
  getToolsState(): ImpastoToolsState;
  subscribeTools(listener: () => void): () => void;
  addColorPinFromSample(payload: {
    surface: ViewportSurfaceId;
    imageX: number;
    imageY: number;
    radiusPx: number;
  }): void;
  /**
   * Primary or middle button down on this viewport’s **canvas** (before tool routing). Used to clear global
   * document selection (e.g. color pins) when the user addresses the bitmap; overlay pins do not receive this.
   */
  onCanvasPointerDownBeforeTools?(info: { surface: ViewportSurfaceId; button: 0 | 1 }): void;
  marqueeDragStart?(payload: { surface: ViewportSurfaceId; imageX: number; imageY: number }): void;
  marqueeDragMove?(payload: { surface: ViewportSurfaceId; imageX: number; imageY: number }): void;
  marqueeDragEnd?(payload: {
    surface: ViewportSurfaceId;
    imageX: number;
    imageY: number;
    shiftKey: boolean;
    altKey: boolean;
  }): void;
};
