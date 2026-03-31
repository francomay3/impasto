import { setup, assign } from 'xstate';
import type { SamplingLevels } from '../filters/FilterContext';

type InteractionContext = {
  samplingColorId: string | null;
  samplingLevels: SamplingLevels | null;
  samplingRadius: number;
};

type InteractionEvent =
  | { type: 'SELECT_TOOL'; tool: 'select' | 'marquee' }
  | { type: 'ACTIVATE_EYEDROPPER' }
  | { type: 'START_SAMPLING_COLOR'; colorId: string }
  | { type: 'START_SAMPLING_LEVELS'; filterId: string; point: 'black' | 'white' }
  | { type: 'SAMPLE_COMPLETE' }
  | { type: 'CANCEL' }
  | { type: 'SET_SAMPLING_RADIUS'; radius: number };

export const interactionMachine = setup({
  types: {
    context: {} as InteractionContext,
    events: {} as InteractionEvent,
  },
}).createMachine({
  id: 'interaction',
  initial: 'select',
  context: { samplingColorId: null, samplingLevels: null, samplingRadius: 30 },
  // SET_SAMPLING_RADIUS is valid in any state
  on: {
    SET_SAMPLING_RADIUS: {
      actions: assign({ samplingRadius: ({ event }) => event.radius }),
    },
  },
  states: {
    select: {
      on: {
        SELECT_TOOL: { target: 'marquee', guard: ({ event }) => event.tool === 'marquee' },
        ACTIVATE_EYEDROPPER: 'adding_color',
        START_SAMPLING_COLOR: {
          target: 'sampling_color',
          actions: assign({
            samplingColorId: ({ event }) => event.type === 'START_SAMPLING_COLOR' ? event.colorId : null,
            samplingLevels: () => null,
          }),
        },
        START_SAMPLING_LEVELS: {
          target: 'sampling_levels',
          actions: assign({
            samplingColorId: () => null,
            samplingLevels: ({ event }) =>
              event.type === 'START_SAMPLING_LEVELS'
                ? { filterId: event.filterId, point: event.point }
                : null,
          }),
        },
      },
    },
    marquee: {
      on: {
        SELECT_TOOL: { target: 'select', guard: ({ event }) => event.tool === 'select' },
        ACTIVATE_EYEDROPPER: 'adding_color',
        START_SAMPLING_COLOR: {
          target: 'sampling_color',
          actions: assign({
            samplingColorId: ({ event }) => event.type === 'START_SAMPLING_COLOR' ? event.colorId : null,
            samplingLevels: () => null,
          }),
        },
        START_SAMPLING_LEVELS: {
          target: 'sampling_levels',
          actions: assign({
            samplingColorId: () => null,
            samplingLevels: ({ event }) =>
              event.type === 'START_SAMPLING_LEVELS'
                ? { filterId: event.filterId, point: event.point }
                : null,
          }),
        },
        CANCEL: 'select',
      },
    },
    adding_color: {
      on: {
        SAMPLE_COMPLETE: 'select',
        CANCEL: 'select',
        SELECT_TOOL: [
          { target: 'marquee', guard: ({ event }) => event.tool === 'marquee' },
          { target: 'select' },
        ],
      },
    },
    sampling_color: {
      on: {
        SAMPLE_COMPLETE: { target: 'select', actions: assign({ samplingColorId: () => null }) },
        CANCEL: { target: 'select', actions: assign({ samplingColorId: () => null }) },
      },
    },
    sampling_levels: {
      on: {
        SAMPLE_COMPLETE: { target: 'select', actions: assign({ samplingLevels: () => null }) },
        CANCEL: { target: 'select', actions: assign({ samplingLevels: () => null }) },
      },
    },
  },
});
