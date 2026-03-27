import { useRef, useEffect, useState, useCallback, type RefObject } from 'react';
import { Box, Slider, Text, Stack, Button } from '@mantine/core';
import { useHotkeys } from '@mantine/hooks';
import { sampleCircleAverage } from '../utils/imageProcessing';
import { rgbToHex } from '../utils/colorUtils';
import { useCanvasContext } from '../context/CanvasContext';
import { HOTKEYS } from '../hotkeys';
import type { ColorSample } from '../types';

interface Props {
  onSample: (sample: ColorSample, hex: string) => void;
  onCancel: () => void;
  /** Canvas to read pixels from. Defaults to filteredCanvasRef from CanvasContext. */
  canvasRef?: RefObject<HTMLCanvasElement | null>;
}

export function SamplerOverlay({ onSample, onCancel, canvasRef }: Props) {
  const { filteredCanvasRef, viewportTransform } = useCanvasContext();
  const sourceCanvasRef = canvasRef ?? filteredCanvasRef;
  const viewportScale = viewportTransform.scale;
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [radius, setRadius] = useState(30);
  // Store raw client coords so we can recompute overlay-relative position after zoom resizes the overlay.
  const [mouseClient, setMouseClient] = useState({ x: -9999, y: -9999 });

  useHotkeys([[HOTKEYS.CANCEL, onCancel]]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!e.altKey) return;
      e.preventDefault();
      const delta = e.deltaY !== 0 ? e.deltaY : e.deltaX;
      setRadius(r => Math.max(1, Math.min(100, r - Math.sign(delta) * 3)));
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const rect = overlay.getBoundingClientRect();
    overlay.width = rect.width;
    overlay.height = rect.height;
    const x = mouseClient.x - rect.left;
    const y = mouseClient.y - rect.top;
    const ctx = overlay.getContext('2d')!;
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }, [mouseClient, radius, viewportScale]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    setMouseClient({ x: e.clientX, y: e.clientY });
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = sourceCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    // Use the image canvas rect (not the overlay) so coordinates are relative to the actual image,
    // and scaleX/scaleY correctly account for zoom level.
    const canvasRect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / canvasRect.width;
    const scaleY = canvas.height / canvasRect.height;
    const cx = (e.clientX - canvasRect.left) * scaleX;
    const cy = (e.clientY - canvasRect.top) * scaleY;
    // Convert radius from screen pixels to image pixels so the sampled area matches the visual circle.
    const radiusInImagePixels = radius * scaleX;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const [r, g, b] = sampleCircleAverage(imageData, cx, cy, radiusInImagePixels);
    onSample({ x: cx, y: cy, radius: radiusInImagePixels }, rgbToHex(r, g, b));
  }, [sourceCanvasRef, radius, onSample]);

  return (
    <Box style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
      <canvas
        ref={overlayRef}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onContextMenu={(e) => { e.preventDefault(); onCancel(); }}
        style={{
          position: 'absolute', top: 0, left: 0,
          width: '100%', height: '100%',
          cursor: 'crosshair', zIndex: 10,
        }}
      />
      <Box style={{ position: 'absolute', bottom: 8, left: 8, zIndex: 20, background: 'rgba(0,0,0,0.7)', borderRadius: 6, padding: 8 }}>
        <Stack gap={4}>
          <Text size="xs" c="dimmed">Radius: {radius}px (Alt+Scroll)</Text>
          <Slider value={radius} min={1} max={100} onChange={setRadius} size="xs" style={{ width: 120 }} />
          <Button size="xs" variant="subtle" color="red" onClick={onCancel}>Cancel (Esc)</Button>
        </Stack>
      </Box>
    </Box>
  );
}
