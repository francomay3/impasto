import { useRef, useEffect, useMemo } from 'react';
import { Box, Group, Loader, Text } from '@mantine/core';
import chroma from 'chroma-js';
import { useCanvasContext } from '../../canvas/CanvasContext';
import { useFilterContext } from '../../filters/FilterContext';
import { usePaletteContext } from '../../palette/PaletteContext';
import { useFilteredImage } from '../../filters/useFilteredImage';
import { useIndexedImage } from '../../../hooks/useIndexedImage';
import { CanvasViewport } from '../../canvas/CanvasViewport';
import { SamplePinsOverlay } from '../../canvas/SamplePinsOverlay';
import { SamplerOverlay } from '../../canvas/SamplerOverlay';
import { MarqueeSelectOverlay } from '../../canvas/MarqueeSelectOverlay';

const labelStyle: React.CSSProperties = {
  position: 'absolute',
  top: 8,
  left: 8,
  pointerEvents: 'none',
  zIndex: 1,
  userSelect: 'none',
};

export function PaletteTabContent() {
  const { sourceImage, indexedCanvasRef } = useCanvasContext();
  const { filters, preIndexingBlur } = useFilterContext();
  const { palette, samplingColorId, isAddingColor, onSampleColor, onCancelSampleColor, onAddNewColor, onCancelAddingColor } = usePaletteContext();
  const filteredRef = useRef<HTMLCanvasElement>(null);

  const filteredData = useFilteredImage(sourceImage, filters);

  const labPalette = useMemo(
    () => palette.flatMap(c => {
      try { const [l, a, b] = chroma(c.hex).lab(); return [{ l, a, b }]; }
      catch { return []; }
    }),
    [palette],
  );

  const { data: indexedData, isLoading: isIndexedLoading } = useIndexedImage(filteredData, preIndexingBlur, labPalette);

  useEffect(() => {
    const canvas = filteredRef.current;
    if (!canvas || !filteredData) return;
    canvas.width = filteredData.width;
    canvas.height = filteredData.height;
    canvas.getContext('2d')!.putImageData(filteredData, 0, 0);
  }, [filteredData]);

  useEffect(() => {
    const canvas = indexedCanvasRef.current;
    if (!canvas || !indexedData) return;
    canvas.width = indexedData.width;
    canvas.height = indexedData.height;
    canvas.getContext('2d')!.putImageData(indexedData, 0, 0);
  }, [indexedData, indexedCanvasRef]);

  return (
    <Group gap={0} wrap="nowrap" style={{ height: '100%', overflow: 'hidden' }}>
      <Box style={{ flex: 1, minWidth: 0, position: 'relative', height: '100%', display: 'flex' }}>
        <CanvasViewport
          ref={filteredRef}
          variant="filtered"
          overlayChildren={
            <>
              {isAddingColor
                ? <SamplerOverlay canvasRef={filteredRef} onSample={onAddNewColor} onCancel={onCancelAddingColor} />
                : samplingColorId
                ? <SamplerOverlay canvasRef={filteredRef} onSample={onSampleColor} onCancel={onCancelSampleColor} />
                : null}
              <SamplePinsOverlay canvasRef={filteredRef} />
              <MarqueeSelectOverlay canvasRef={filteredRef} />
            </>
          }
        />
        <Text style={labelStyle} size="xs" c="dimmed">Filtered</Text>
      </Box>
      <Box style={{ width: 1, height: '100%', background: 'var(--mantine-color-dark-6)', flexShrink: 0 }} />
      <Box style={{ flex: 1, minWidth: 0, position: 'relative', height: '100%', display: 'flex' }}>
        <CanvasViewport ref={indexedCanvasRef} variant="indexed" />
        <Group style={{ ...labelStyle, gap: 6 }}>
          <Text size="xs" c="dimmed">Indexed colors</Text>
          {isIndexedLoading && <Loader size="xs" />}
        </Group>
      </Box>
    </Group>
  );
}
