import { useRef, useCallback } from 'react';

interface Options {
  threshold?: number;      // ms before firing, default 500
  moveThreshold?: number;  // px movement before cancel, default 5
}

type LongPressHandlers = {
  onPointerDown:   (e: React.PointerEvent) => void;
  onPointerUp:     (e: React.PointerEvent) => void;
  onPointerMove:   (e: React.PointerEvent) => void;
  onPointerCancel: (e: React.PointerEvent) => void;
};

/**
 * Fires callback on long press for touch/pen only (not mouse — use onContextMenu for that).
 * Returns pointer event handlers to spread onto the target element.
 */
export function useLongPress(
  callback: (e: React.PointerEvent) => void,
  { threshold = 500, moveThreshold = 5 }: Options = {}
): LongPressHandlers {
  const timerRef  = useRef<ReturnType<typeof setTimeout>>();
  const startPos  = useRef<{ x: number; y: number } | null>(null);

  const cancel = useCallback(() => {
    clearTimeout(timerRef.current);
    startPos.current = null;
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') return; // desktop right-click covers this
    startPos.current = { x: e.clientX, y: e.clientY };
    timerRef.current = setTimeout(() => {
      startPos.current = null;
      callback(e);
    }, threshold);
  }, [callback, threshold]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!startPos.current) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    if (Math.hypot(dx, dy) > moveThreshold) cancel();
  }, [cancel, moveThreshold]);

  return { onPointerDown, onPointerUp: cancel, onPointerMove, onPointerCancel: cancel };
}
