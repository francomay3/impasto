import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildEngineCanvasInputHost } from './buildEngineCanvasInputHost';
import type { ToolState, ImpastoToolsState, ImpastoToolId } from '../tools/ToolState';
import type { SelectionState } from '../selection/SelectionState';
import type { MarqueeGestureState } from '../selection/MarqueeGestureState';
import type { ColorPinState } from '../colorPins/ColorPinState';
import type { ImpastoEngineColorPinsApi } from './ImpastoEngineApi';

// --- minimal stub factories ---

function makeToolState(activeToolId: ImpastoToolId = 'pan'): ToolState {
  const state: ImpastoToolsState = {
    activeTool: { id: activeToolId, label: activeToolId, config: {} as never },
    allTools: [],
  };
  return {
    getState: () => state,
    subscribe: vi.fn(() => () => {}),
  } as unknown as ToolState;
}

function makeSelection(): SelectionState {
  let entries: readonly object[] = [];
  return {
    clear: vi.fn(() => { entries = []; }),
    getAll: vi.fn(() => entries),
    set: vi.fn((next: readonly object[]) => { entries = next; }),
    subscribe: vi.fn(() => () => {}),
  } as unknown as SelectionState;
}

function makeMarquee(): MarqueeGestureState {
  let draft: { surface: string; start: { x: number; y: number }; current: { x: number; y: number } } | null = null;
  return {
    start: vi.fn((surface, start) => { draft = { surface, start, current: start }; }),
    move: vi.fn((current) => { if (draft) draft.current = current; }),
    getDraft: vi.fn(() => draft),
    clear: vi.fn(() => { draft = null; }),
  } as unknown as MarqueeGestureState;
}

function makeColorPinState(hitIds: string[] = []): ColorPinState {
  return {
    queryColorPinIdsInImageRect: vi.fn(() => hitIds),
  } as unknown as ColorPinState;
}

function makeColorPinsApi(): Pick<ImpastoEngineColorPinsApi, 'add'> {
  return { add: vi.fn() };
}

// --- tests ---

describe('buildEngineCanvasInputHost', () => {
  let toolState: ToolState;
  let selection: SelectionState;
  let marqueeGesture: MarqueeGestureState;
  let colorPinsState: ColorPinState;
  let colorPins: Pick<ImpastoEngineColorPinsApi, 'add'>;
  let ensureLive: () => void;

  beforeEach(() => {
    toolState = makeToolState();
    selection = makeSelection();
    marqueeGesture = makeMarquee();
    colorPinsState = makeColorPinState();
    colorPins = makeColorPinsApi();
    ensureLive = vi.fn<() => void>();
  });

  function build() {
    return buildEngineCanvasInputHost({
      toolState,
      selection: selection as SelectionState,
      marqueeGesture,
      colorPinsState,
      colorPins,
      ensureLive,
    });
  }

  describe('getToolsState / subscribeTools', () => {
    it('delegates to toolState.getState', () => {
      const host = build();
      expect(host.getToolsState()).toBe((toolState as unknown as { getState: () => ImpastoToolsState }).getState());
    });

    it('delegates subscribe to toolState.subscribe', () => {
      const host = build();
      const listener = vi.fn();
      host.subscribeTools(listener);
      expect((toolState.subscribe as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(listener);
    });
  });

  describe('addColorPinFromSample', () => {
    it('adds a pin when surface is filtered', () => {
      const host = build();
      host.addColorPinFromSample({ surface: 'filtered', imageX: 10, imageY: 20, radiusPx: 4 });
      expect(colorPins.add).toHaveBeenCalledWith({ imageX: 10, imageY: 20, radiusPx: 4 });
    });

    it('adds a pin when surface is indexed', () => {
      const host = build();
      host.addColorPinFromSample({ surface: 'indexed', imageX: 5, imageY: 5, radiusPx: 2 });
      expect(colorPins.add).toHaveBeenCalledOnce();
    });

    it('does not add a pin when surface is source', () => {
      const host = build();
      host.addColorPinFromSample({ surface: 'source', imageX: 10, imageY: 20, radiusPx: 4 });
      expect(colorPins.add).not.toHaveBeenCalled();
    });
  });

  describe('onCanvasPointerDownBeforeTools', () => {
    it('clears selection on left-click with non-marquee tool', () => {
      const host = build();
      host.onCanvasPointerDownBeforeTools!({ surface: 'filtered', button: 0 });
      expect(selection.clear).toHaveBeenCalledOnce();
    });

    it('does not clear selection when active tool is marquee-select and button is 0', () => {
      toolState = makeToolState('marquee-select');
      const host = build();
      host.onCanvasPointerDownBeforeTools!({ surface: 'filtered', button: 0 });
      expect(selection.clear).not.toHaveBeenCalled();
    });

    it('clears selection on right-click even with marquee tool active', () => {
      toolState = makeToolState('marquee-select');
      const host = build();
      host.onCanvasPointerDownBeforeTools!({ surface: 'filtered', button: 1 });
      expect(selection.clear).toHaveBeenCalledOnce();
    });
  });

  describe('marqueeDragStart', () => {
    it('starts the marquee gesture and calls ensureLive', () => {
      const host = build();
      host.marqueeDragStart!({ surface: 'filtered', imageX: 0, imageY: 0 });
      expect(ensureLive).toHaveBeenCalledOnce();
      expect(marqueeGesture.start).toHaveBeenCalledWith('filtered', { x: 0, y: 0 });
    });
  });

  describe('marqueeDragMove', () => {
    it('forwards move to marquee gesture', () => {
      const host = build();
      host.marqueeDragMove!({ surface: 'filtered', imageX: 50, imageY: 60 });
      expect(ensureLive).toHaveBeenCalledOnce();
      expect(marqueeGesture.move).toHaveBeenCalledWith({ x: 50, y: 60 });
    });
  });

  describe('marqueeDragEnd', () => {
    it('returns early without touching selection when no draft exists', () => {
      const host = build();
      host.marqueeDragEnd!({ surface: 'filtered', imageX: 100, imageY: 100, shiftKey: false, altKey: false });
      expect(selection.clear).not.toHaveBeenCalled();
      expect(selection.set).not.toHaveBeenCalled();
    });

    it('clears selection when drag is below epsilon (tiny movement)', () => {
      const host = build();
      host.marqueeDragStart!({ surface: 'filtered', imageX: 0, imageY: 0 });
      host.marqueeDragEnd!({ surface: 'filtered', imageX: 1, imageY: 1, shiftKey: false, altKey: false });
      expect(selection.clear).toHaveBeenCalled();
    });

    it('sets selection from hit test after a real drag', () => {
      colorPinsState = makeColorPinState(['pin-1', 'pin-2']);
      const host = buildEngineCanvasInputHost({
        toolState,
        selection: selection as SelectionState,
        marqueeGesture,
        colorPinsState,
        colorPins,
        ensureLive,
      });
      host.marqueeDragStart!({ surface: 'filtered', imageX: 0, imageY: 0 });
      host.marqueeDragEnd!({ surface: 'filtered', imageX: 200, imageY: 200, shiftKey: false, altKey: false });
      expect(selection.set).toHaveBeenCalled();
    });

    it('does nothing when draft surface does not match end surface', () => {
      const host = build();
      host.marqueeDragStart!({ surface: 'source', imageX: 0, imageY: 0 });
      host.marqueeDragEnd!({ surface: 'filtered', imageX: 200, imageY: 200, shiftKey: false, altKey: false });
      // draft surface mismatch → selection.clear is still called (no draft on the right surface)
      expect(selection.set).not.toHaveBeenCalled();
    });
  });
});
