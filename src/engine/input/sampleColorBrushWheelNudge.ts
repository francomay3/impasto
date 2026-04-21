import type { ImpastoToolId } from '../tools/ToolState';

/**
 * Browsers (especially macOS) often remap **Shift + vertical wheel** to **horizontal scroll**, so the
 * magnitude lands in `deltaX` and `deltaY` is ~0. Alt+wheel usually stays on `deltaY`.
 */
function linearWheelDeltaForBrushNudge(
  e: Pick<WheelEvent, 'deltaX' | 'deltaY' | 'shiftKey' | 'altKey'>,
): number {
  const { deltaX, deltaY, shiftKey, altKey } = e;
  if (shiftKey && !altKey && Math.abs(deltaX) >= Math.abs(deltaY)) {
    return deltaX;
  }
  if (deltaY !== 0) {
    return deltaY;
  }
  return deltaX;
}

/**
 * Alt+wheel or Shift+wheel adjusts the sample-color brush radius (image px) instead of zooming.
 *
 * **Same scale for Alt and Shift:** steps are `round(linearDelta / 100)` so a typical ~100px wheel line is
 * ~1 step. Shift does **not** multiply sensitivity (that used to stack with multi-line notches and felt ~3×
 * too strong). Shift exists so **horizontal wheel deltas** (macOS remaps Shift+vertical scroll) still nudge.
 *
 * - **Ctrl** (trackpad pinch / browser zoom chord): returns `null` so the viewport keeps zooming.
 */
export function sampleColorBrushWheelNudgeDeltaSteps(
  e: Pick<WheelEvent, 'altKey' | 'shiftKey' | 'ctrlKey' | 'deltaX' | 'deltaY'>,
  activeToolId: ImpastoToolId,
): number | null {
  if (activeToolId !== 'sample-color') {
    return null;
  }
  if (!e.altKey && !e.shiftKey) {
    return null;
  }
  if (e.ctrlKey) {
    return null;
  }
  const d = linearWheelDeltaForBrushNudge(e);
  if (d === 0) {
    return null;
  }
  const divisor = 100;
  let steps = -Math.round(d / divisor);
  if (steps === 0) {
    steps = -Math.sign(d);
  }
  return steps;
}
