import { useSyncExternalStore } from 'react'
import type { CanvasEngine } from './CanvasEngine'
import type { SamplingLevels } from '../../filters/FilterContext'
import type { SelectionMode, ToolId } from '../../../tools'

export interface InteractionAPI {
  activeTool: ToolId;
  isSampling: boolean;
  samplingColorId: string | null;
  samplingLevels: SamplingLevels | null;
  samplingRadius: number;
  selectionMode: SelectionMode;
  selectTool: (tool: 'select' | 'marquee') => void;
  activateEyedropper: () => void;
  toggleMarquee: () => void;
  startSamplingColor: (colorId: string) => void;
  startSamplingLevels: (filterId: string, point: 'black' | 'white') => void;
  completeSample: () => void;
  cancel: () => void;
  setSamplingRadius: (radius: number) => void;
  setSelectionMode: (m: SelectionMode) => void;
  setActiveTool: (id: ToolId) => void;
}

export function useToolState(engine: CanvasEngine): InteractionAPI {
  const snap = useSyncExternalStore(
    engine.subscribe.bind(engine),
    () => engine.getSnapshot()
  )

  return {
    ...snap.tool,
    selectionMode: snap.selectionMode,
    selectTool: engine.selectTool.bind(engine),
    activateEyedropper: engine.activateEyedropper.bind(engine),
    toggleMarquee: engine.toggleMarquee.bind(engine),
    startSamplingColor: engine.startSamplingColor.bind(engine),
    startSamplingLevels: engine.startSamplingLevels.bind(engine),
    completeSample: engine.completeSample.bind(engine),
    cancel: engine.cancel.bind(engine),
    setSamplingRadius: engine.setSamplingRadius.bind(engine),
    setSelectionMode: engine.setSelectionMode.bind(engine),
    setActiveTool: engine.setActiveTool.bind(engine),
  }
}
