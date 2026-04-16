/**
 * Central place for color-pin mutations, drag finalization, and undo/redo entries that touch pins.
 *
 * **Invariants:** History pushes for pin edits happen only through this coordinator once migration is
 * complete. Placement clamping uses {@link getPlacementExtents} so pin geometry stays aligned with the
 * raster used for sampling (filtered pipeline output when present, otherwise source).
 *
 * **Cross-domain coupling:** The engine injects `pruneSelection` and `setSelection` instead of this class
 * importing {@link SelectionState}. That keeps the color-pin layer from depending on selection
 * implementation details and avoids import cycles if selection ever needs pin helpers.
 *
 * `ensureLive` is invoked before mutating pins from history or drag paths so undo after engine `dispose` fails the
 * same way as the pre-migration engine helpers did.
 */

import type { RawImage } from '../../../types';
import type { HistoryManager } from '../history/HistoryManager';
import type { ImpastoEngineColorPinPlacementExtents, ImpastoEngineColorPinsApi } from '../core/ImpastoEngineApi';
import type { SelectionEntry } from '../infra/selectionEntry';
import { cloneColorPinSnapshot, colorPinsEqual } from '../core/colorPinHistorySnapshot';
import { blendColorPinsFromIds } from './colorPinCoordinatorBlend';
import { buildColorPinPlacementApi } from './buildColorPinPlacementApi';
import type { ColorPin, ColorPinState } from './ColorPinState';
import type { ColorPinPointerDragSession } from './ColorPinPointerDragSession';

/**
 * Owns color-pin mutation logic and the history entries that correspond to user-driven pin edits.
 * Selection is updated only via callbacks supplied by the composition root ({@link ImpastoEngine}).
 */
export class ColorPinCoordinator {
  private readonly _colorPins: ColorPinState;
  private readonly _dragSession: ColorPinPointerDragSession;
  private readonly _history: HistoryManager;
  private readonly _pruneSelection: (validIds: Set<string>) => void;
  private readonly _setSelection: (entries: readonly SelectionEntry[]) => void;
  private readonly _getPlacementExtents: () => ImpastoEngineColorPinPlacementExtents | null;
  /** Latest filtered raster for pin color sampling (`add`, `repositionMany`); may be null before the pipeline warms up. */
  private readonly _getLastFilteredImage: () => RawImage | null;
  private readonly _ensureLive: () => void;

  /**
   * @param ensureLive Invoked before pin-list mutations from this coordinator that must not run after engine
   * `dispose` (mirrors `ImpastoEngine.ensureNotDisposed` for history closures and drag snap-back).
   */
  public constructor(
    colorPins: ColorPinState,
    dragSession: ColorPinPointerDragSession,
    history: HistoryManager,
    pruneSelection: (validIds: Set<string>) => void,
    setSelection: (entries: readonly SelectionEntry[]) => void,
    getPlacementExtents: () => ImpastoEngineColorPinPlacementExtents | null,
    getLastFilteredImage: () => RawImage | null,
    ensureLive: () => void,
  ) {
    this._colorPins = colorPins;
    this._dragSession = dragSession;
    this._history = history;
    this._pruneSelection = pruneSelection;
    this._setSelection = setSelection;
    this._getPlacementExtents = getPlacementExtents;
    this._getLastFilteredImage = getLastFilteredImage;
    this._ensureLive = ensureLive;
  }

  /**
   * Pointer-up path for an in-flight pin drag: one undo step when movement exceeded epsilon; otherwise snap back to
   * drag-start without history. Also used before pin-list mutations (e.g. delete) so history stays coherent.
   */
  public commitDrag(): void {
    if (!this._dragSession.isActive()) {
      return;
    }
    const endSnap = cloneColorPinSnapshot(this._colorPins.getAll());
    const commit = this._dragSession.tryCommitEnd(endSnap);
    const startSnap = this._dragSession.getStartSnapshot();
    this._dragSession.clear();
    if (commit) {
      this.pushColorPinHistoryIfChanged(commit.beforePins, commit.afterPins);
    } else if (startSnap) {
      this.applyColorPinSnapshot(cloneColorPinSnapshot(startSnap));
    }
  }

  /**
   * Restore drag-start pin layout without a history entry (pointer cancel, starting a new drag, or undo/redo
   * navigation before the history stack moves).
   */
  public abortDrag(): void {
    const start = this._dragSession.getStartSnapshot();
    if (!start) {
      return;
    }
    this.applyColorPinSnapshot(cloneColorPinSnapshot(start));
    this._dragSession.clear();
  }

  /**
   * Full {@link ImpastoEngineColorPinsApi}: placement, pointer-drag session, and centroid blend entry points.
   */
  public buildApi(): ImpastoEngineColorPinsApi {
    return {
      ...buildColorPinPlacementApi({
        ensureLive: () => this._ensureLive(),
        commitDrag: () => this.commitDrag(),
        pushColorPinHistoryIfChanged: (before, after) => this.pushColorPinHistoryIfChanged(before, after),
        colorPins: this._colorPins,
        pruneSelection: this._pruneSelection,
        setSelection: this._setSelection,
        getPlacementExtents: this._getPlacementExtents,
        getLastFilteredImage: this._getLastFilteredImage,
      }),
      beginPointerDrag: (pinIds) => {
        this._ensureLive();
        if (this._dragSession.isActive()) {
          this.abortDrag();
        }
        const snap = cloneColorPinSnapshot(this._colorPins.getAll());
        this._dragSession.begin(pinIds, snap);
      },
      endPointerDrag: () => {
        this._ensureLive();
        this.commitDrag();
      },
      abortPointerDrag: () => {
        this._ensureLive();
        this.abortDrag();
      },
      mergePinsFromIds: (ids) => {
        this._ensureLive();
        this._blendColorPinsFromIds(ids, false);
      },
      addMiddlePinFromIds: (ids) => {
        this._ensureLive();
        this._blendColorPinsFromIds(ids, true);
      },
    };
  }

  /**
   * Blend two or more pins into one new pin at the geometric midpoint placement.
   * When `keepOriginals` is false (merge), source pins are removed; when true (add-middle), they remain.
   */
  private _blendColorPinsFromIds(ids: readonly string[], keepOriginals: boolean): void {
    blendColorPinsFromIds(
      {
        colorPins: this._colorPins,
        getLastFilteredImage: this._getLastFilteredImage,
        setSelection: this._setSelection,
        pruneSelection: this._pruneSelection,
        pushColorPinHistoryIfChanged: (before, after) => this.pushColorPinHistoryIfChanged(before, after),
      },
      ids,
      keepOriginals,
    );
  }

  /**
   * Document hydration path: defensive copy of `pins`, then {@link applyColorPinSnapshot}. Call after
   * {@link abortDrag} when replacing engine state from a snapshot so the pointer-drag session is cleared first.
   */
  public loadSnapshot(pins: readonly ColorPin[]): void {
    this.applyColorPinSnapshot(cloneColorPinSnapshot(pins));
  }

  /**
   * Sets the full pin list and prunes selection to ids that still exist. No history entry — used by undo/redo
   * closures, drag snap-back, and document hydration (`loadDocument` via the engine).
   */
  public applyColorPinSnapshot(snap: readonly ColorPin[]): void {
    this._ensureLive();
    this._colorPins.setAllPins(snap);
    this._pruneSelection(new Set(snap.map((p) => p.id)));
  }

  /**
   * Pushes one undo step when `before` and `after` pin lists differ. Undo/redo apply snapshots through
   * {@link applyColorPinSnapshot}.
   */
  public pushColorPinHistoryIfChanged(before: readonly ColorPin[], after: readonly ColorPin[]): void {
    if (colorPinsEqual(before, after)) {
      return;
    }
    const b = cloneColorPinSnapshot(before);
    const a = cloneColorPinSnapshot(after);
    this._history.push({
      undo: () => this.applyColorPinSnapshot(b),
      redo: () => this.applyColorPinSnapshot(a),
    });
  }
}
