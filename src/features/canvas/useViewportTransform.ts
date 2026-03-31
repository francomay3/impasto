import { useState, useCallback, useRef } from 'react';
import { applyZoomStep, panOnZoom, panOnDrag } from './viewportMath';

export interface ViewportTransform {
  scale: number;
  panX: number;
  panY: number;
}

type TransformListener = (t: ViewportTransform) => void;

export function useViewportTransform() {
  const [transform, setTransform] = useState<ViewportTransform>({ scale: 1, panX: 0, panY: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const transformRef = useRef<ViewportTransform>({ scale: 1, panX: 0, panY: 0 });
  const listenersRef = useRef<Set<TransformListener>>(new Set());
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startPanX: number;
    startPanY: number;
  } | null>(null);

  const subscribeToTransform = useCallback((cb: TransformListener) => {
    listenersRef.current.add(cb);
    return () => { listenersRef.current.delete(cb); };
  }, []);

  // commit=true also flushes a React state update to trigger dependent re-renders
  const applyTransform = useCallback((t: ViewportTransform, commit = false) => {
    transformRef.current = t;
    listenersRef.current.forEach(cb => cb(t));
    if (commit) setTransform(t);
  }, []);

  const handleWheel = useCallback(
    (e: WheelEvent, rect: DOMRect) => {
      e.preventDefault();
      const prev = transformRef.current;
      const newScale = applyZoomStep(prev.scale, e.deltaY < 0);
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      // commit=true: zoom must re-render (scale affects inv, SamplerOverlay circle, etc.)
      applyTransform({
        scale: newScale,
        panX: panOnZoom(mx, prev.panX, prev.scale, newScale),
        panY: panOnZoom(my, prev.panY, prev.scale, newScale),
      }, true);
    },
    [applyTransform]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0 && e.button !== 1) return;
      if ((e.target as HTMLElement).closest('[data-no-pan]')) return;
      if (dragRef.current) return;
      (document.activeElement as HTMLElement)?.blur();
      e.preventDefault();
      const prev = transformRef.current;
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startPanX: prev.panX,
        startPanY: prev.panY,
      };
      setIsDragging(true);

      let rafPending = false;
      let latestEv: MouseEvent | null = null;

      const handleGlobalMove = (ev: MouseEvent) => {
        latestEv = ev;
        if (rafPending) return;
        rafPending = true;
        requestAnimationFrame(() => {
          rafPending = false;
          if (!dragRef.current || !latestEv) return;
          // No commit during drag — pure imperative DOM write via listeners
          applyTransform({
            ...transformRef.current,
            panX: panOnDrag(dragRef.current.startPanX, dragRef.current.startX, latestEv.clientX),
            panY: panOnDrag(dragRef.current.startPanY, dragRef.current.startY, latestEv.clientY),
          });
          latestEv = null;
        });
      };

      const handleGlobalUp = () => {
        dragRef.current = null;
        latestEv = null;
        setIsDragging(false);
        setTransform(transformRef.current); // commit final position once
        window.removeEventListener('mousemove', handleGlobalMove);
        window.removeEventListener('mouseup', handleGlobalUp);
      };

      window.addEventListener('mousemove', handleGlobalMove);
      window.addEventListener('mouseup', handleGlobalUp);
    },
    [applyTransform]
  );

  const resetTransform = useCallback(() => {
    applyTransform({ scale: 1, panX: 0, panY: 0 }, true);
  }, [applyTransform]);

  return { transform, isDragging, handleWheel, handleMouseDown, resetTransform, subscribeToTransform };
}
