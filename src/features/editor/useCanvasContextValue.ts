import type { RefObject } from 'react';
import type { useProjectState } from './useProjectState';
import type { useViewportTransform } from '../canvas/useViewportTransform';
import type { ToolId } from '../../tools';
import type { SamplingLevels } from '../filters/FilterContext';

type Project = ReturnType<typeof useProjectState>;
type Viewport = ReturnType<typeof useViewportTransform>;

interface Options {
  project: Project;
  viewport: Viewport;
  filteredCanvasRef: RefObject<HTMLCanvasElement | null>;
  indexedCanvasRef: RefObject<HTMLCanvasElement | null>;
  activeTool: ToolId;
  samplingColorId: string | null;
  samplingLevels: SamplingLevels | null;
  showLabels: boolean;
  setShowLabels: (v: boolean | ((prev: boolean) => boolean)) => void;
}

export function useCanvasContextValue({
  project,
  viewport,
  filteredCanvasRef,
  indexedCanvasRef,
  activeTool,
  samplingColorId,
  samplingLevels,
  showLabels,
  setShowLabels,
}: Options) {
  return {
    sourceImage: project.state.sourceImage,
    filteredCanvasRef,
    indexedCanvasRef,
    viewportTransform: viewport.transform,
    isDragging: viewport.isDragging,
    isSampling: activeTool === 'eyedropper' || !!samplingColorId || !!samplingLevels,
    showLabels,
    onToggleLabels: () => setShowLabels((v) => !v),
    onWheel: viewport.handleWheel,
    onMouseDown: viewport.handleMouseDown,
    onResetTransform: viewport.resetTransform,
  };
}
