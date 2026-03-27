import { useState, useCallback, useRef } from 'react';

export interface ViewportTransform {
  scale: number;
  panX: number;
  panY: number;
}

export function useViewportTransform() {
  const [transform, setTransform] = useState<ViewportTransform>({ scale: 1, panX: 0, panY: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const transformRef = useRef<ViewportTransform>({ scale: 1, panX: 0, panY: 0 });
  const dragRef = useRef<{ startX: number; startY: number; startPanX: number; startPanY: number } | null>(null);

  const applyTransform = useCallback((t: ViewportTransform) => {
    transformRef.current = t;
    setTransform(t);
  }, []);

  const handleWheel = useCallback((e: WheelEvent, rect: DOMRect) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    const prev = transformRef.current;
    const newScale = Math.max(0.25, Math.min(16, prev.scale * factor));
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const newPanX = mx - (mx - prev.panX) * (newScale / prev.scale);
    const newPanY = my - (my - prev.panY) * (newScale / prev.scale);
    applyTransform({ scale: newScale, panX: newPanX, panY: newPanY });
  }, [applyTransform]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0 && e.button !== 1) return;
    if ((e.target as HTMLElement).closest('[data-no-pan]')) return;
    (document.activeElement as HTMLElement)?.blur();
    e.preventDefault();
    const prev = transformRef.current;
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPanX: prev.panX, startPanY: prev.panY };
    setIsDragging(true);

    const handleGlobalMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      applyTransform({
        ...transformRef.current,
        panX: dragRef.current.startPanX + (ev.clientX - dragRef.current.startX),
        panY: dragRef.current.startPanY + (ev.clientY - dragRef.current.startY),
      });
    };

    const handleGlobalUp = () => {
      dragRef.current = null;
      setIsDragging(false);
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalUp);
    };

    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('mouseup', handleGlobalUp);
  }, [applyTransform]);

  const resetTransform = useCallback(() => {
    applyTransform({ scale: 1, panX: 0, panY: 0 });
  }, [applyTransform]);

  return { transform, isDragging, handleWheel, handleMouseDown, resetTransform };
}
