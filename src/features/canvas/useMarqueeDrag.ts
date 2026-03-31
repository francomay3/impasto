import { useState, useRef, useCallback } from 'react';
import type { MutableRefObject } from 'react';
import type { SelectionMode } from '../../tools';

interface DragRect {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface Options {
  getPinsInRect: (rect: DragRect) => Set<string>;
  onSetSelection: (ids: Set<string>) => void;
  selectedColorIdsRef: MutableRefObject<Set<string>>;
  panMouseDown: (e: React.MouseEvent) => void;
  isMarqueeMode: boolean;
  selectionMode: SelectionMode;
}

function applyMode(current: Set<string>, incoming: Set<string>, mode: SelectionMode): Set<string> {
  if (mode === 'add') return new Set([...current, ...incoming]);
  if (mode === 'subtract') return new Set([...current].filter(id => !incoming.has(id)));
  if (mode === 'intersect') return new Set([...current].filter(id => incoming.has(id)));
  return incoming;
}

export function useMarqueeDrag({
  getPinsInRect,
  onSetSelection,
  selectedColorIdsRef,
  panMouseDown,
  isMarqueeMode,
  selectionMode,
}: Options) {
  const [drag, setDrag] = useState<DragRect | null>(null);
  const hasDraggedRef = useRef(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      if (!isMarqueeMode) {
        panMouseDown(e);
        return;
      }
      const startX = e.clientX;
      const startY = e.clientY;
      hasDraggedRef.current = false;
      let rafPending = false;
      let latestEv: MouseEvent | null = null;

      const handleMove = (ev: MouseEvent) => {
        if (!hasDraggedRef.current && Math.hypot(ev.clientX - startX, ev.clientY - startY) > 4)
          hasDraggedRef.current = true;
        if (!hasDraggedRef.current) return;
        latestEv = ev;
        if (rafPending) return;
        rafPending = true;
        requestAnimationFrame(() => {
          rafPending = false;
          if (!latestEv) return;
          setDrag({ startX, startY, endX: latestEv.clientX, endY: latestEv.clientY });
          latestEv = null;
        });
      };

      const handleUp = (ev: MouseEvent) => {
        latestEv = null;
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
        setDrag(null);
        if (!hasDraggedRef.current) return;
        const rect = { startX, startY, endX: ev.clientX, endY: ev.clientY };
        const ids = getPinsInRect(rect);
        const effectiveMode: SelectionMode =
          ev.shiftKey ? 'add' : ev.altKey ? 'subtract' : selectionMode;
        onSetSelection(applyMode(selectedColorIdsRef.current, ids, effectiveMode));
      };

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    },
    [isMarqueeMode, panMouseDown, getPinsInRect, onSetSelection, selectedColorIdsRef, selectionMode]
  );

  return { drag, handleMouseDown, hasDraggedRef };
}
