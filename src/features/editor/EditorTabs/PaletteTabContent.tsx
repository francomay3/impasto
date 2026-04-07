import { useRef, useEffect, useMemo } from 'react';
import { Box, Group, Loader, Text } from '@mantine/core';
import { useCanvasContext } from '../../canvas/CanvasContext';
import { useFilterContext } from '../../filters/FilterContext';
import { usePaletteContext } from '../../palette/PaletteContext';
import { useFilteredImage } from '../../filters/useFilteredImage';
import { useIndexedImage } from '../../../hooks/useIndexedImage';
import { useMixedPalette } from '../../../hooks/useMixedPalette';
import { useEditorStore } from '../editorStore';
import { useExportSettings } from '../useExportSettings';
import { getValidPaletteHexes, computeLabPalette } from '../../../utils/paletteComputation';
import { drawImageDataToCanvas } from '../../../utils/canvasUtils';
import { CanvasViewport } from '../../canvas/CanvasViewport';
import { SamplePinsOverlay } from '../../canvas/SamplePinsOverlay';
import { SamplerOverlay } from '../../canvas/SamplerOverlay';
import { MarqueeSelectOverlay } from '../../canvas/MarqueeSelectOverlay';
import { PinEditPopover } from '../../palette/PinEditPopover';
import { useEngine } from '../../canvas/engine/EngineContext';
import { useCanvasOverlayProps } from '../../canvas/engine/useCanvasOverlayProps';

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

  const engine = useEngine();
  const overlayProps = useCanvasOverlayProps(engine, filteredRef);

  const filteredData = useFilteredImage(sourceImage, filters);

  const paletteHexes = useMemo(() => getValidPaletteHexes(palette), [palette]);
  const labPalette = useMemo(() => computeLabPalette(paletteHexes), [paletteHexes]);

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
    if (filteredRef.current && filteredData) drawImageDataToCanvas(filteredRef.current, filteredData);
  }, [filteredData]);

  useEffect(() => {
    if (indexedCanvasRef.current && indexedData) drawImageDataToCanvas(indexedCanvasRef.current, indexedData);
  }, [indexedData, indexedCanvasRef]);

  return (
    <Group gap={0} wrap="nowrap" style={{ height: '100%', overflow: 'hidden' }}>
      <Box style={{ flex: 1, minWidth: 0, position: 'relative', height: '100%', display: 'flex' }}>
        <CanvasViewport
          ref={filteredRef}
          variant="filtered"
          overlayChildren={
            <>
              <MarqueeSelectOverlay {...overlayProps.marquee} />
              {isAddingColor ? (
                <SamplerOverlay
                  {...overlayProps.sampler}
                  canvasRef={filteredRef}
                  sampleAt={engine.getColorAt.bind(engine)}
                  onSample={onAddNewColor}
                  onCancel={onCancelAddingColor}
                />
              ) : samplingColorId ? (
                <SamplerOverlay
                  {...overlayProps.sampler}
                  canvasRef={filteredRef}
                  sampleAt={engine.getColorAt.bind(engine)}
                  onSample={onSampleColor}
                  onCancel={onCancelSampleColor}
                />
              ) : null}
            </>
          }
        >
          <SamplePinsOverlay {...overlayProps.pins} canvasRef={filteredRef} />
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
      {overlayProps.editPin && (
        <PinEditPopover
          colorId={overlayProps.editPin.colorId}
          position={overlayProps.editPin.position}
          onClose={overlayProps.clearEditPin}
        />
      )}
    </Group>
  );
}
