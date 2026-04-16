import type { FilterInstance, RawImage } from '../../../types';
import type { ImpastoDocumentSnapshot } from './impastoDocumentSnapshot';
import type { ColorPin, ColorPinAddPayload } from '../colorPins/ColorPinState';
import type { SelectionEntry } from '../selection/SelectionState';
import type { MarqueeDraft } from '../selection/MarqueeGestureState';
import type { PipelineIndexConfig } from '../pipeline/pipelineIndexConfig';
import type { ViewportTransform } from '../viewport/models';
import type { ICanvasViewport, Viewport } from '../viewport/Viewport';
import type { HistoryManager } from '../history/HistoryManager';
import type { InputManager } from '../input/InputManager';
import type { ImpastoToolId, ImpastoToolsState } from '../tools/ToolState';
import type { ViewportPipelineState } from '../pipeline/ViewportPipeline';
import type { ViewportPhysics } from '../viewport/ViewportPhysics';

/** Shared pan/zoom physics and viewport registration. */
export type ImpastoEngineViewportApi = {
  readonly physics: ViewportPhysics;
  subscribe(viewport: Viewport): () => void;
  /** Notify when pan/zoom is committed (for React `useSyncExternalStore` and similar). */
  subscribeTransform(listener: () => void): () => void;
  setTransform(next: ViewportTransform): void;
  /**
   * Same as {@link setTransform} today; kept for call sites that distinguish “proposal” vs “commit”.
   *
   * Intended future hook for input throttling, debouncing, and constraint application (for example zoom clamp and pan bounds) before the transform is committed to {@link ViewportPhysics}.
   */
  requestTransform(next: ViewportTransform): void;
};

/** Canonical source bitmap read/write. */
export type ImpastoEngineImageApi = {
  get(): RawImage | null;
  set(next: RawImage | null): void;
  subscribe(listener: () => void): () => void;
};

export type ImpastoEngineFiltersApi = {
  getFilters(): FilterInstance[];
  /**
   * Replaces the filter chain with an undo step. Call this for all user-driven filter edits so history (and
   * persistence built on it) stays aligned; bypass only for hydration paths that clear history separately.
   */
  setFilters(filters: FilterInstance[]): void;
  subscribe(listener: () => void): () => void;
};

/** Indexed preview + merged async status (filter worker + index worker). */
export type ImpastoEnginePipelineApi = {
  getState(): ViewportPipelineState;
  subscribe(listener: (state: ViewportPipelineState) => void): () => void;
  getIndexConfig(): Readonly<PipelineIndexConfig>;
  /** Partial merge; omitted fields stay unchanged. */
  setIndexConfig(config: Partial<PipelineIndexConfig>): void;
};

export type ImpastoEngineToolsApi = {
  getState(): ImpastoToolsState;
  subscribe(listener: () => void): () => void;
  setActiveTool(tool: ImpastoToolId): void;
  setToolParamValue(tool: ImpastoToolId, paramKey: string, value: unknown): void;
};

export type ImpastoEngineManagersApi = {
  readonly input: InputManager;
  readonly history: HistoryManager;
};

/** Durable document snapshot / hydration API for persistence (implemented by `ImpastoEngine`). */
export type ImpastoEngineDocumentApi = {
  getDocumentSnapshot(): ImpastoDocumentSnapshot;
  /**
   * Fires when the durable document changes in a way that should be persisted — today the same events as
   * `managers.history.subscribe` (stack pushes and undo/redo). Persistence glue should use this hook only; the
   * engine defines what counts as a document change.
   */
  subscribeDocumentChanged(listener: () => void): () => void;
  /**
   * Hydrates pins, filter chain, and index config from a snapshot. Uses internal apply paths (no history entries);
   * then clears undo/redo silently so load is not undoable and persistence subscribers are not notified for that clear.
   * When `sourceImage` is provided it is applied via the internal snapshot path (no defensive copy); omit it to leave
   * the current source image unchanged (UI state — tool, selection, viewport — is always unchanged).
   */
  loadDocument(snapshot: ImpastoDocumentSnapshot, sourceImage?: RawImage | null): void;
};

export type ImpastoEngineViewports = {
  readonly source: ICanvasViewport;
  readonly filtered: ICanvasViewport;
  readonly indexed: ICanvasViewport;
};

export type ImpastoEngineColorPinPlacementExtents = {
  readonly width: number;
  readonly height: number;
};

export type ImpastoEngineColorPinsApi = {
  getAll(): readonly ColorPin[];
  subscribe(listener: () => void): () => void;
  clear(): void;
  /**
   * Raster size for pin placement and dragging (filtered bitmap when available, otherwise source).
   * `null` when neither is usable yet.
   */
  getPlacementExtents(): ImpastoEngineColorPinPlacementExtents | null;
  /** Append a pin. Display color is sampled from the filtered image; it is updated again when the pin is moved. */
  add(payload: ColorPinAddPayload): void;
  /**
   * Batch-move pin centers (image space). Positions are clamped to {@link getPlacementExtents}; display colors are
   * re-sampled from the current filtered bitmap at each new footprint (same rule as {@link add}).
   */
  repositionMany(updates: readonly { readonly id: string; readonly imageX: number; readonly imageY: number }[]): void;
  /**
   * Arms a pin drag session (call from pointer down after selection is final). Live moves use {@link repositionMany};
   * call {@link endPointerDrag} on pointer up/cancel. Sub-threshold moves snap back with no history entry.
   */
  beginPointerDrag(pinIds: readonly string[]): void;
  endPointerDrag(): void;
  /** Restore drag-start pin layout without recording history (e.g. overlay unmount). */
  abortPointerDrag(): void;
  remove(id: string): void;
  /** Remove several pins in one pass; selection is pruned once. */
  removeMany(ids: readonly string[]): void;
  /**
   * Blend several pins: centroid of pin positions + **Lab-space mean** of pin display colors (each pin
   * `rgbToLab`, then average L*, a*, b*), then nearest filtered pixel to the centroid within ΔE.
   * Inserts one new pin sampled there, removes the listed pins, selects only the new pin. No-op if
   * placement cannot be computed or fewer than two ids resolve to pins.
   */
  mergePinsFromIds(ids: readonly string[]): void;
  /**
   * Same placement as {@link mergePinsFromIds} (centroid + Lab-mean target) but keeps existing pins;
   * selection becomes only the new pin.
   */
  addMiddlePinFromIds(ids: readonly string[]): void;
};

/** Subset returned by {@link buildColorPinPlacementApi}; {@link ColorPinCoordinator.buildApi} spreads this and adds drag + blend. */
export type ImpastoEngineColorPinsPlacementApi = Pick<
  ImpastoEngineColorPinsApi,
  | 'getAll'
  | 'subscribe'
  | 'clear'
  | 'getPlacementExtents'
  | 'add'
  | 'repositionMany'
  | 'remove'
  | 'removeMany'
>;

export type ImpastoEngineMarqueeApi = {
  getDraft(): MarqueeDraft | null;
  subscribe(listener: () => void): () => void;
};

export type ImpastoEngineSelectionApi = {
  getAll(): readonly SelectionEntry[];
  set(next: readonly SelectionEntry[]): void;
  clear(): void;
  subscribe(listener: () => void): () => void;
  /** Pointer pick on a color pin: plain click replaces; Shift or Cmd/Ctrl toggles membership (Figma-style, see `selection/colorPinPointerSelection.ts`). */
  pickColorPin(
    clickedPinId: string,
    modifiers: { readonly shiftKey: boolean; readonly metaKey: boolean; readonly ctrlKey: boolean },
  ): void;
};
