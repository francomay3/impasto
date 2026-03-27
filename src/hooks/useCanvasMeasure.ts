import { useState, useCallback, useEffect, type RefObject } from 'react';

export interface CanvasRect { left: number; top: number; width: number; height: number }

export function useCanvasMeasure(canvasRef: RefObject<HTMLCanvasElement | null>) {
  const [canvasRect, setCanvasRect] = useState<CanvasRect | null>(null);

  const measure = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const container = canvas.closest('[data-canvas-viewport]');
    if (!container) return;
    const cb = canvas.getBoundingClientRect();
    const vb = container.getBoundingClientRect();
    setCanvasRect({ left: cb.left - vb.left, top: cb.top - vb.top, width: cb.width, height: cb.height });
  }, [canvasRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const container = canvas.closest('[data-canvas-viewport]');
    if (!container) return;
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    return () => ro.disconnect();
  }, [canvasRef, measure]);

  return { canvasRect, measure };
}
