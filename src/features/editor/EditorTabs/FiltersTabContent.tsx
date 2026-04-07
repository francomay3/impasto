import { useRef, useEffect } from 'react';
import { Box, Group, Text } from '@mantine/core';
import { useCanvasContext } from '../../canvas/CanvasContext';
import { useEngine } from '../../canvas/engine/EngineContext';
import { useToolState } from '../../canvas/engine/useToolState';
import { useViewportState } from '../../canvas/engine/useViewportState';
import { useFilterContext } from '../../filters/FilterContext';
import { useFilteredImage } from '../../filters/useFilteredImage';
import { CanvasViewport } from '../../canvas/CanvasViewport';
import { SamplerOverlay } from '../../canvas/SamplerOverlay';
import { drawRawImage, drawImageDataToCanvas } from '../../../utils/canvasUtils';

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
  const engine = useEngine();
  const { samplingRadius, setSamplingRadius } = useToolState(engine);
  const { transform } = useViewportState(engine);
  const { filters, samplingLevels, onSampleLevels, onCancelSamplingLevels } = useFilterContext();
  const originalRef = useRef<HTMLCanvasElement>(null);
  const filteredData = useFilteredImage(sourceImage, filters);

  useEffect(() => {
    if (originalRef.current && sourceImage) drawRawImage(originalRef.current, sourceImage);
  }, [sourceImage]);

  useEffect(() => {
    if (filteredCanvasRef.current && filteredData) drawImageDataToCanvas(filteredCanvasRef.current, filteredData);
  }, [filteredData, filteredCanvasRef]);

  return (
    <Group gap={0} wrap="nowrap" style={{ height: '100%', overflow: 'hidden' }}>
      <Box style={{ flex: 1, minWidth: 0, position: 'relative', height: '100%', display: 'flex' }}>
        <CanvasViewport ref={originalRef} variant="indexed" />
        <Text style={labelStyle} size="xs" c="dimmed">
          Original
        </Text>
      </Box>
      <Box
        style={{
          width: 1,
          height: '100%',
          background: 'var(--mantine-color-dark-6)',
          flexShrink: 0,
        }}
      />
      <Box style={{ flex: 1, minWidth: 0, position: 'relative', height: '100%', display: 'flex' }}>
        <CanvasViewport
          ref={filteredCanvasRef}
          overlayChildren={
            samplingLevels && (
              <SamplerOverlay
                canvasRef={filteredCanvasRef}
                radius={samplingRadius}
                setRadius={setSamplingRadius}
                viewportScale={transform.scale}
                onSample={onSampleLevels}
                onCancel={onCancelSamplingLevels}
              />
            )
          }
        />
        <Text style={labelStyle} size="xs" c="dimmed">
          Filtered
        </Text>
      </Box>
    </Group>
  );
}
