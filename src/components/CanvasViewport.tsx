import { forwardRef, useRef, useEffect } from 'react';
import { Text, Box } from '@mantine/core';
import { useCanvasContext } from '../context/CanvasContext';

interface Props {
  label: string;
  children?: React.ReactNode;
}

export const CanvasViewport = forwardRef<HTMLCanvasElement, Props>(
  function CanvasViewport({ label, children }, ref) {
    const { viewportTransform: t, onWheel, onMouseDown, onResetTransform, isDragging, isSampling } = useCanvasContext();
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const handler = (e: WheelEvent) => {
        if (isSampling && e.altKey) return; // Alt+Scroll reserved for brush size during sampling
        onWheel(e, el.getBoundingClientRect());
      };
      el.addEventListener('wheel', handler, { passive: false });
      return () => el.removeEventListener('wheel', handler);
    }, [onWheel, isSampling]);

    const cursor = isSampling ? 'crosshair' : isDragging ? 'grabbing' : 'grab';
    const transformCss = `translate(${t.panX}px, ${t.panY}px) scale(${t.scale})`;

    return (
      <Box style={{ background: 'var(--mantine-color-dark-9)', flex: 1, minWidth: 0, position: 'relative', height: '100%' }}>
        <Box
          ref={containerRef}
          style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', cursor }}
          onMouseDown={isSampling ? (e) => { if (e.button === 1) onMouseDown(e); } : onMouseDown}
          onDoubleClick={isSampling ? undefined : onResetTransform}
        >
          <Box style={{ transformOrigin: '0 0', transform: transformCss, willChange: 'transform', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <canvas ref={ref} style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '100%', display: 'block' }} />
            {children}
          </Box>
        </Box>
        <Text size="xs" c="white" mb={4} pos="absolute" top="2px" left="2px" style={{ textShadow: '0 1px 2px #000, 0 0 8px #000', opacity: 0.7 }}>{label}</Text>
      </Box>
    );
  }
);
