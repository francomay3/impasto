import { useCallback, useMemo } from 'react';
import { useMachine } from '@xstate/react';
import type { ToolId } from '../../tools';
import { interactionMachine } from './interactionMachine';
import type { SamplingLevels } from '../filters/FilterContext';

export interface InteractionAPI {
  activeTool: ToolId;
  isSampling: boolean;
  samplingColorId: string | null;
  samplingLevels: SamplingLevels | null;
  samplingRadius: number;
  selectTool: (tool: 'select' | 'marquee') => void;
  activateEyedropper: () => void;
  toggleMarquee: () => void;
  startSamplingColor: (colorId: string) => void;
  startSamplingLevels: (filterId: string, point: 'black' | 'white') => void;
  completeSample: () => void;
  cancel: () => void;
  setSamplingRadius: (radius: number) => void;
}

export function useInteraction(): InteractionAPI {
  const [snapshot, send] = useMachine(interactionMachine);
  const stateValue = snapshot.value as string;

  const activeTool = useMemo<ToolId>(
    () =>
      stateValue === 'adding_color' ? 'eyedropper'
      : stateValue === 'marquee' ? 'marquee'
      : 'select',
    [stateValue]
  );

  const isSampling = useMemo(
    () =>
      stateValue === 'adding_color' ||
      stateValue === 'sampling_color' ||
      stateValue === 'sampling_levels',
    [stateValue]
  );

  const selectTool = useCallback((tool: 'select' | 'marquee') => send({ type: 'SELECT_TOOL', tool }), [send]);
  const activateEyedropper = useCallback(() => send({ type: 'ACTIVATE_EYEDROPPER' }), [send]);
  const toggleMarquee = useCallback(
    () => send({ type: 'SELECT_TOOL', tool: stateValue === 'marquee' ? 'select' : 'marquee' }),
    [send, stateValue]
  );
  const startSamplingColor = useCallback(
    (colorId: string) => send({ type: 'START_SAMPLING_COLOR', colorId }),
    [send]
  );
  const startSamplingLevels = useCallback(
    (filterId: string, point: 'black' | 'white') => send({ type: 'START_SAMPLING_LEVELS', filterId, point }),
    [send]
  );
  const completeSample = useCallback(() => send({ type: 'SAMPLE_COMPLETE' }), [send]);
  const cancel = useCallback(() => send({ type: 'CANCEL' }), [send]);
  const setSamplingRadius = useCallback((radius: number) => send({ type: 'SET_SAMPLING_RADIUS', radius }), [send]);

  return {
    activeTool,
    isSampling,
    samplingColorId: snapshot.context.samplingColorId,
    samplingLevels: snapshot.context.samplingLevels,
    samplingRadius: snapshot.context.samplingRadius,
    selectTool,
    activateEyedropper,
    toggleMarquee,
    startSamplingColor,
    startSamplingLevels,
    completeSample,
    cancel,
    setSamplingRadius,
  };
}
