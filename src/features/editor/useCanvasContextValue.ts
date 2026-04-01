import { useCallback, useMemo, useState, type RefObject } from 'react';
import type { useProjectState } from './useProjectState';
import type { useViewportTransform } from '../canvas/useViewportTransform';
import type { InteractionAPI } from '../canvas/useInteraction';
import type { ToolId, SelectionMode } from '../../tools';

type Project = ReturnType<typeof useProjectState>;
type Viewport = ReturnType<typeof useViewportTransform>;

interface Options {
  project: Project;
  viewport: Viewport;
  filteredCanvasRef: RefObject<HTMLCanvasElement | null>;
  indexedCanvasRef: RefObject<HTMLCanvasElement | null>;
  interaction: InteractionAPI;
  showLabels: boolean;
  setShowLabels: (v: boolean | ((prev: boolean) => boolean)) => void;
}

export function useCanvasContextValue({
  project,
  viewport,
  filteredCanvasRef,
  indexedCanvasRef,
  interaction,
  showLabels,
  setShowLabels,
}: Options) {
  const { activateEyedropper, selectTool, isSampling, activeTool, samplingRadius, setSamplingRadius } = interaction;
  const { transform, isDragging, handleWheel, handleMouseDown, resetTransform, subscribeToTransform } = viewport;

  const [selectionMode, setSelectionMode] = useState<SelectionMode>('new');

  const setActiveTool = useCallback(
    (id: ToolId) => {
      if (id !== 'marquee') setSelectionMode('new');
      if (id === 'eyedropper') activateEyedropper();
      else selectTool(id);
    },
    [activateEyedropper, selectTool]
  );

  const onToggleLabels = useCallback(() => setShowLabels((v) => !v), [setShowLabels]);

  return useMemo(
    () => ({
      sourceImage: project.state.sourceImage,
      filteredCanvasRef,
      indexedCanvasRef,
      viewportTransform: transform,
      isDragging,
      isSampling,
      activeTool,
      setActiveTool,
      selectionMode,
      setSelectionMode,
      samplingRadius,
      setSamplingRadius,
      showLabels,
      onToggleLabels,
      onWheel: handleWheel,
      onMouseDown: handleMouseDown,
      onResetTransform: resetTransform,
      subscribeToTransform,
    }),
    [
      project.state.sourceImage,
      filteredCanvasRef,
      indexedCanvasRef,
      transform,
      isDragging,
      isSampling,
      activeTool,
      setActiveTool,
      selectionMode,
      setSelectionMode,
      samplingRadius,
      setSamplingRadius,
      showLabels,
      onToggleLabels,
      handleWheel,
      handleMouseDown,
      resetTransform,
      subscribeToTransform,
    ]
  );
}
