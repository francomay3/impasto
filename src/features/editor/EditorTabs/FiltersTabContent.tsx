import { useRef, useEffect, useState, useCallback, useSyncExternalStore } from 'react';
import { Box, Group, Text } from '@mantine/core';
import { useCanvasContext } from '../../canvas/CanvasContext';
import { useEngine } from '../../canvas/engine/EngineContext';
import { useViewportState } from '../../canvas/engine/useViewportState';
import { useFilterContext } from '../../filters/FilterContext';
import { useFilteredImage } from '../../filters/useFilteredImage';
import { CanvasViewport } from '../../canvas/CanvasViewport';
import { SamplerOverlay } from '../../canvas/SamplerOverlay';
import { CropOverlay } from '../../canvas/CropOverlay';
import { CropController } from '../../canvas/tools/CropController';
import { RotateOverlay } from '../../canvas/RotateOverlay';
import { RotateController } from '../../canvas/tools/RotateController';
import { useEditorContext } from '../EditorContext';
import { drawRawImage, drawImageDataToCanvas } from '../../../utils/canvasUtils';
import type { CropRect } from '../../../types';

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
  const { activeFilterTool, onSetActiveFilterTool } = useEditorContext();
  const engine = useEngine();
  const { samplingRadius } = useSyncExternalStore(engine.subscribe.bind(engine), engine.getToolState.bind(engine));
  const { transform } = useViewportState(engine);
  const { filters, samplingLevels, onSampleLevels, onCancelSamplingLevels } = useFilterContext();
  const originalRef = useRef<HTMLCanvasElement>(null);
  const filteredData = useFilteredImage(sourceImage, filters);
  const [cropRect, setCropRect] = useState<CropRect>({ x: 0, y: 0, width: 1, height: 1 });
  const [cropController] = useState(() => new CropController(undefined, setCropRect));
  const [rotateAngle, setRotateAngle] = useState(0);
  const [rotateController] = useState(() => new RotateController(undefined, setRotateAngle));

  useEffect(() => {
    if (originalRef.current && sourceImage) drawRawImage(originalRef.current, sourceImage);
  }, [sourceImage]);

  useEffect(() => {
    if (filteredCanvasRef.current && filteredData) drawImageDataToCanvas(filteredCanvasRef.current, filteredData);
  }, [filteredData, filteredCanvasRef]);

  useEffect(() => {
    if (activeFilterTool === 'crop') {
      const existing = engine.getTransforms().cropRect;
      cropController.reset(existing ?? undefined);
    }
    if (activeFilterTool === 'rotate') {
      rotateController.reset(engine.getTransforms().rotation);
    }
  }, [activeFilterTool, engine, cropController, rotateController]);

  const handleApplyCrop = useCallback(() => {
    engine.applyCrop(cropController.getRect());
    onSetActiveFilterTool('pan');
  }, [engine, onSetActiveFilterTool, cropController]);

  const handleCancelCrop = useCallback(() => {
    onSetActiveFilterTool('pan');
  }, [onSetActiveFilterTool]);

  const handleApplyRotate = useCallback(() => {
    engine.applyRotation(rotateController.getAngle());
    onSetActiveFilterTool('pan');
  }, [engine, onSetActiveFilterTool, rotateController]);

  const handleCancelRotate = useCallback(() => {
    onSetActiveFilterTool('pan');
  }, [onSetActiveFilterTool]);

  return (
    <Group gap={0} wrap="nowrap" style={{ height: '100%', overflow: 'hidden' }}>
      <Box style={{ flex: 1, minWidth: 0, position: 'relative', height: '100%', display: 'flex' }}>
        <CanvasViewport ref={originalRef} variant="indexed">
          {activeFilterTool === 'crop' && (
            <CropOverlay
              controller={cropController}
              rect={cropRect}
              onApply={handleApplyCrop}
              onCancel={handleCancelCrop}
            />
          )}
          {activeFilterTool === 'rotate' && (
            <RotateOverlay
              controller={rotateController}
              angle={rotateAngle}
              onApply={handleApplyRotate}
              onCancel={handleCancelRotate}
            />
          )}
        </CanvasViewport>
        <Text style={labelStyle} size="xs" c="dimmed">Original</Text>
      </Box>
      <Box style={{ width: 1, height: '100%', background: 'var(--mantine-color-dark-6)', flexShrink: 0 }} />
      <Box style={{ flex: 1, minWidth: 0, position: 'relative', height: '100%', display: 'flex' }}>
        <CanvasViewport
          ref={filteredCanvasRef}
          overlayChildren={
            samplingLevels && (
              <SamplerOverlay
                canvasRef={filteredCanvasRef}
                sampleAt={engine.getColorAt.bind(engine)}
                radius={samplingRadius}
                setRadius={engine.setSamplingRadius.bind(engine)}
                viewportScale={transform.scale}
                onSample={onSampleLevels}
                onCancel={onCancelSamplingLevels}
              />
            )
          }
        />
        <Text style={labelStyle} size="xs" c="dimmed">Filtered</Text>
      </Box>
    </Group>
  );
}
