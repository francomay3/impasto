import type { ColorPin } from './ColorPinState';
import { isBelowDragEpsilon } from '../infra/imageRect';
import { MARQUEE_DRAG_EPSILON_IMAGE_PX } from '../infra/marqueeConstants';

type ColorPinDragCommit = {
  readonly beforePins: readonly ColorPin[];
  readonly afterPins: readonly ColorPin[];
};

/**
 * Tracks a single in-flight primary-pointer drag over color pins: baseline layout vs live {@link repositionMany}
 * updates. {@link tryCommitEnd} decides whether the gesture warrants one undo step (movement above epsilon).
 */
export class ColorPinPointerDragSession {
  private startSnapshot: readonly ColorPin[] | null = null;
  private trackedIds: ReadonlySet<string> | null = null;

  isActive(): boolean {
    return this.startSnapshot !== null;
  }

  /**
   * @param pinIds Pin ids participating in the drag (subset may be missing from `fullSnapshot`).
   * @param fullSnapshot Immutable copy of all pins at drag start (engine-owned).
   */
  begin(pinIds: readonly string[], fullSnapshot: readonly ColorPin[]): void {
    const valid = new Set<string>();
    const byId = new Map(fullSnapshot.map((p) => [p.id, p]));
    for (const id of pinIds) {
      if (byId.has(id)) {
        valid.add(id);
      }
    }
    if (valid.size === 0) {
      this.clear();
      return;
    }
    this.trackedIds = valid;
    this.startSnapshot = fullSnapshot;
  }

  /**
   * If any tracked pin’s center moved farther than {@link MARQUEE_DRAG_EPSILON_IMAGE_PX} from its start position,
   * returns full before/after pin lists for a single history entry; otherwise `null` (no history push).
   */
  tryCommitEnd(currentSnapshot: readonly ColorPin[]): ColorPinDragCommit | null {
    if (!this.startSnapshot || !this.trackedIds) {
      return null;
    }
    const startById = new Map(this.startSnapshot.map((p) => [p.id, p]));
    const endById = new Map(currentSnapshot.map((p) => [p.id, p]));
    for (const id of this.trackedIds) {
      const a = startById.get(id);
      const b = endById.get(id);
      if (!a || !b) {
        return { beforePins: this.startSnapshot, afterPins: currentSnapshot };
      }
      if (
        !isBelowDragEpsilon(
          { x: a.imageX, y: a.imageY },
          { x: b.imageX, y: b.imageY },
          MARQUEE_DRAG_EPSILON_IMAGE_PX,
        )
      ) {
        return { beforePins: this.startSnapshot, afterPins: currentSnapshot };
      }
    }
    return null;
  }

  /** Snapshot at drag start; `null` when inactive. */
  getStartSnapshot(): readonly ColorPin[] | null {
    return this.startSnapshot;
  }

  clear(): void {
    this.startSnapshot = null;
    this.trackedIds = null;
  }
}
