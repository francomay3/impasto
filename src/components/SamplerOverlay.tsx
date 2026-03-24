import { useRef, useEffect, useState, useCallback } from 'react';
import { Box, Slider, Text, Stack, Button } from '@mantine/core';
import { sampleCircleAverage } from '../utils/imageProcessing';

interface Props {
  filteredCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  onSample: (hex: string) => void;
  onCancel: () => void;
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
}

export function SamplerOverlay({ filteredCanvasRef, onSample, onCancel }: Props) {
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [radius, setRadius] = useState(30);
  const [mousePos, setMousePos] = useState({ x: -200, y: -200 });

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onCancel]);

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
    const ctx = overlay.getContext('2d')!;
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mousePos.x, mousePos.y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }, [mousePos, radius]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = filteredCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const [r, g, b] = sampleCircleAverage(imageData, cx, cy, radius);
    onSample(rgbToHex(r, g, b));
  }, [filteredCanvasRef, radius, onSample]);

  return (
    <Box style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
      <canvas
        ref={overlayRef}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
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
