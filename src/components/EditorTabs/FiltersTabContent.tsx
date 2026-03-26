import { useRef, useEffect } from 'react';
import { Box, Group, Text } from '@mantine/core';
import { useCanvasContext } from '../../context/CanvasContext';
import { useFilterContext } from '../../context/FilterContext';
import { useFilteredImage } from '../../hooks/useFilteredImage';
import { CanvasViewport } from '../CanvasViewport';
import { SamplerOverlay } from '../SamplerOverlay';
import type { RawImage } from '../../types';

function drawRawImage(canvas: HTMLCanvasElement, source: RawImage) {
  canvas.width = source.width;
  canvas.height = source.height;
  canvas.getContext('2d')!.putImageData(
    new ImageData(new Uint8ClampedArray(source.data), source.width, source.height), 0, 0,
  );
}

const labelStyle: React.CSSProperties = {
  position: 'absolute',
  top: 8,
  left: 8,
  pointerEvents: 'none',
  zIndex: 1,
  userSelect: 'none',
};

export function FiltersTabContent() {
  const { sourceImage, filteredCanvasRef } = useCanvasContext();
  const { filters, samplingLevels, onSampleLevels, onCancelSamplingLevels } = useFilterContext();
  const originalRef = useRef<HTMLCanvasElement>(null);
  const filteredData = useFilteredImage(sourceImage, filters);

  useEffect(() => {
    if (originalRef.current && sourceImage) drawRawImage(originalRef.current, sourceImage);
  }, [sourceImage]);

  useEffect(() => {
    const canvas = filteredCanvasRef.current;
    if (!canvas || !filteredData) return;
    canvas.width = filteredData.width;
    canvas.height = filteredData.height;
    canvas.getContext('2d')!.putImageData(filteredData, 0, 0);
  }, [filteredData, filteredCanvasRef]);

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
        <CanvasViewport ref={originalRef} variant="indexed" />
        <Text style={labelStyle} size="xs" c="dimmed">Original</Text>
      </Box>
      <Box style={{ width: 1, height: '100%', background: 'var(--mantine-color-dark-6)', flexShrink: 0 }} />
      <Box style={{ flex: 1, minWidth: 0, position: 'relative', height: '100%', display: 'flex' }}>
        <CanvasViewport ref={filteredCanvasRef}>
          {samplingLevels && (
            <SamplerOverlay onSample={onSampleLevels} onCancel={onCancelSamplingLevels} />
          )}
        </CanvasViewport>
        <Text style={labelStyle} size="xs" c="dimmed">Filtered</Text>
      </Box>
    </Group>
  );
}
