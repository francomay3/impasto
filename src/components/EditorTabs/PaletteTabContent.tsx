import { useRef, useEffect, useMemo } from 'react';
import { Box, Group, Text } from '@mantine/core';
import chroma from 'chroma-js';
import { useCanvasContext } from '../../context/CanvasContext';
import { useFilterContext } from '../../context/FilterContext';
import { usePaletteContext } from '../../context/PaletteContext';
import { useFilteredImage } from '../../hooks/useFilteredImage';
import { useIndexedImage } from '../../hooks/useIndexedImage';
import { CanvasViewport } from '../CanvasViewport';
import { SamplePinsOverlay } from '../SamplePinsOverlay';

const labelStyle: React.CSSProperties = {
  position: 'absolute',
  top: 8,
  left: 8,
  pointerEvents: 'none',
  zIndex: 1,
  userSelect: 'none',
};

export function PaletteTabContent() {
  const { sourceImage } = useCanvasContext();
  const { filters, preIndexingBlur } = useFilterContext();
  const { palette } = usePaletteContext();
  const filteredRef = useRef<HTMLCanvasElement>(null);
  const indexedRef = useRef<HTMLCanvasElement>(null);

  const filteredData = useFilteredImage(sourceImage, filters);

  const labPalette = useMemo(
    () => palette.flatMap(c => {
      try { const [l, a, b] = chroma(c.hex).lab(); return [{ l, a, b }]; }
      catch { return []; }
    }),
    [palette],
  );

  const indexedData = useIndexedImage(filteredData, preIndexingBlur, labPalette);

  useEffect(() => {
    const canvas = filteredRef.current;
    if (!canvas || !filteredData) return;
    canvas.width = filteredData.width;
    canvas.height = filteredData.height;
    canvas.getContext('2d')!.putImageData(filteredData, 0, 0);
  }, [filteredData]);

  useEffect(() => {
    const canvas = indexedRef.current;
    if (!canvas || !indexedData) return;
    canvas.width = indexedData.width;
    canvas.height = indexedData.height;
    canvas.getContext('2d')!.putImageData(indexedData, 0, 0);
  }, [indexedData]);

  if (!sourceImage) {
    return (
      <Box style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Text c="dimmed" size="sm">No image loaded</Text>
      </Box>
    );
  }

  return (
    <Group gap={0} wrap="nowrap" style={{ height: '100%', overflow: 'hidden' }}>
      <Box style={{ flex: 1, minWidth: 0, position: 'relative', height: '100%', display: 'flex' }}>
        <CanvasViewport ref={filteredRef} variant="filtered">
          <SamplePinsOverlay />
        </CanvasViewport>
        <Text style={labelStyle} size="xs" c="dimmed">Filtered</Text>
      </Box>
      <Box style={{ width: 1, height: '100%', background: 'var(--mantine-color-dark-6)', flexShrink: 0 }} />
      <Box style={{ flex: 1, minWidth: 0, position: 'relative', height: '100%', display: 'flex' }}>
        <CanvasViewport ref={indexedRef} variant="indexed" />
        <Text style={labelStyle} size="xs" c="dimmed">Indexed</Text>
      </Box>
    </Group>
  );
}
