import { useRef, useEffect, useMemo } from 'react';
import { Box, Group, Loader, Text } from '@mantine/core';
import chroma from 'chroma-js';
import { useCanvasContext } from '../../canvas/CanvasContext';
import { useFilterContext } from '../../filters/FilterContext';
import { usePaletteContext } from '../../palette/PaletteContext';
import { useFilteredImage } from '../../filters/useFilteredImage';
import { useIndexedImage } from '../../../hooks/useIndexedImage';
import { useMixedPalette } from '../../../hooks/useMixedPalette';
import { useEditorStore } from '../editorStore';
import { useExportSettings } from '../useExportSettings';
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
  const {
    palette,
    samplingColorId,
    isAddingColor,
    onSampleColor,
    onCancelSampleColor,
    onAddNewColor,
    onCancelAddingColor,
  } = usePaletteContext();
  const showMixedColors = useEditorStore((s) => s.showMixedColors);
  const { pigments, minPaintPercent, delta } = useExportSettings();
  const filteredRef = useRef<HTMLCanvasElement>(null);

  const filteredData = useFilteredImage(sourceImage, filters);

  const paletteHexes = useMemo(
    () => palette.flatMap((c) => { try { chroma(c.hex); return [c.hex]; } catch { return []; } }),
    [palette]
  );

  const labPalette = useMemo(
    () => paletteHexes.map((hex) => { const [l, a, b] = chroma(hex).lab(); return { l, a, b }; }),
    [paletteHexes]
  );

  const { data: mixedLabPalette, isLoading: isMixLoading } = useMixedPalette(
    paletteHexes, pigments, minPaintPercent, delta, showMixedColors
  );

  const activePalette = showMixedColors && mixedLabPalette ? mixedLabPalette : labPalette;

  const { data: indexedData, isLoading: isIndexedLoading } = useIndexedImage(
    filteredData,
    preIndexingBlur,
    activePalette
  );

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
              <MarqueeSelectOverlay canvasRef={filteredRef} />
              {isAddingColor ? (
                <SamplerOverlay canvasRef={filteredRef} onSample={onAddNewColor} onCancel={onCancelAddingColor} />
              ) : samplingColorId ? (
                <SamplerOverlay canvasRef={filteredRef} onSample={onSampleColor} onCancel={onCancelSampleColor} />
              ) : null}
            </>
          }
        >
          <SamplePinsOverlay canvasRef={filteredRef} />
        </CanvasViewport>
        <Text style={labelStyle} size="xs" c="dimmed">
          Filtered
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
        <CanvasViewport ref={indexedCanvasRef} variant="indexed" />
        <Group style={{ ...labelStyle, gap: 6 }}>
          <Text size="xs" c="dimmed">
            {showMixedColors ? 'Mixed preview' : 'Indexed colors'}
          </Text>
          {(isIndexedLoading || (showMixedColors && isMixLoading)) && <Loader size="xs" />}
        </Group>
      </Box>
    </Group>
  );
}
