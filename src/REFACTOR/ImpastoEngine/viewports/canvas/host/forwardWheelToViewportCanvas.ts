/**
 * Wheel on an HTML overlay above the viewport canvas never reaches the canvas (sibling stacking).
 * Re-dispatch on the canvas so existing zoom handlers run.
 *
 * If the canvas calls `preventDefault` on the synthetic event, mirrors that on `source` so the
 * document does not scroll when the viewport consumed the gesture.
 *
 * Callers must register this from a **non-passive** `wheel` listener (e.g. `addEventListener(..., { passive: false })`).
 * React `onWheel` / `onWheelCapture` are passive, so `source.preventDefault()` would be ignored and log a warning.
 */
export function forwardWheelEventToCanvas(canvas: HTMLCanvasElement, source: WheelEvent): void {
  const ev = new WheelEvent('wheel', {
    deltaX: source.deltaX,
    deltaY: source.deltaY,
    deltaZ: source.deltaZ,
    deltaMode: source.deltaMode,
    clientX: source.clientX,
    clientY: source.clientY,
    ctrlKey: source.ctrlKey,
    shiftKey: source.shiftKey,
    altKey: source.altKey,
    metaKey: source.metaKey,
    bubbles: false,
    cancelable: true,
  });

  const allowed = canvas.dispatchEvent(ev);
  if (!allowed) {
    source.preventDefault();
    source.stopPropagation();
  }
}
