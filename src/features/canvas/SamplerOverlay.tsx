import { useRef, useEffect, useLayoutEffect, useCallback, type RefObject } from 'react';
import { Box } from '@mantine/core';
import { useHotkeys } from '@mantine/hooks';
import { HOTKEYS } from '../../hotkeys';
import type { ColorSample } from '../../types';

interface Props {
  onSample: (sample: ColorSample, hex: string) => void;
  onCancel: () => void;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  sampleAt: (cx: number, cy: number, radius: number) => string;
  radius: number;
  setRadius: (r: number) => void;
  viewportScale: number;
}

export function SamplerOverlay({ onSample, onCancel, canvasRef, sampleAt, radius, setRadius, viewportScale }: Props) {
  const overlayRef = useRef<HTMLCanvasElement>(null);
  // Imperatively tracked — avoids React re-renders on every mousemove.
  const mouseClientRef = useRef({ x: -9999, y: -9999 });
  const radiusRef = useRef(radius);
  useLayoutEffect(() => { radiusRef.current = radius; });
  const rafRef = useRef<number | null>(null);

  useHotkeys([[HOTKEYS.CANCEL, onCancel]]);

  const scheduleDraw = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const overlay = overlayRef.current;
      if (!overlay) return;
      const rect = overlay.getBoundingClientRect();
      overlay.width = rect.width;
      overlay.height = rect.height;
      const { x, y } = mouseClientRef.current;
      const r = radiusRef.current;
      const localX = x - rect.left;
      const localY = y - rect.top;
      const ctx = overlay.getContext('2d')!;
      ctx.clearRect(0, 0, overlay.width, overlay.height);
      ctx.strokeStyle = 'rgba(0,0,0,0.7)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(localX, localY, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(localX, localY, r, 0, Math.PI * 2);
      ctx.stroke();
    });
  }, []);

  // Re-draw when radius or viewport scale changes — mouse pos unchanged but circle size/bounds may differ.
  useEffect(() => { scheduleDraw(); }, [radius, viewportScale, scheduleDraw]);

  // Attach wheel listener once; reads radiusRef so it doesn't need radius as dep.
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!e.altKey) return;
      e.preventDefault();
      const delta = e.deltaY !== 0 ? e.deltaY : e.deltaX;
      setRadius(Math.max(1, Math.min(200, radiusRef.current - Math.sign(delta) * 3)));
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [setRadius]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    mouseClientRef.current = { x: e.clientX, y: e.clientY };
    scheduleDraw();
  }, [scheduleDraw]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasRect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / canvasRect.width;
    const cx = (e.clientX - canvasRect.left) * scaleX;
    const cy = (e.clientY - canvasRect.top) * (canvas.height / canvasRect.height);
    const radiusInImagePixels = radius * scaleX;
    onSample({ x: cx, y: cy, radius: radiusInImagePixels }, sampleAt(cx, cy, radiusInImagePixels));
  };

  return (
    <Box style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
      <canvas
        ref={overlayRef}
        data-testid="sampler-overlay"
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onContextMenu={(e) => {
          e.preventDefault();
          onCancel();
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          cursor: 'crosshair',
          zIndex: 10,
        }}
      />
    </Box>
  );
}
