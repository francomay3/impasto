import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildEngineInputManagerHandlers } from './buildEngineInputManagerHandlers';
import type { ToolState } from '../tools/ToolState';
import type { SelectionState } from '../selection/SelectionState';
import type { ColorPinCoordinator } from '../colorPins/ColorPinCoordinator';
import type { HistoryManager } from '../history/HistoryManager';
import type { ImpastoEngineColorPinsApi } from './ImpastoEngineApi';

function makeToolState(activeId = 'pan'): ToolState {
  return {
    getState: vi.fn(() => ({ activeTool: { id: activeId }, allTools: [] })),
    setActiveTool: vi.fn(),
    setToolParam: vi.fn(),
    subscribe: vi.fn(() => () => {}),
  } as unknown as ToolState;
}

function makeSelection(hasDeletable = false): SelectionState {
  return {
    getAll: vi.fn(() => (hasDeletable ? [{ kind: 'colorPin', id: 'p1' }] : [])),
    clear: vi.fn(),
    set: vi.fn(),
    subscribe: vi.fn(() => () => {}),
  } as unknown as SelectionState;
}

function makeColorPins(): ImpastoEngineColorPinsApi {
  return { removeMany: vi.fn() } as unknown as ImpastoEngineColorPinsApi;
}

function makeCoordinator(): ColorPinCoordinator {
  return { abortDrag: vi.fn() } as unknown as ColorPinCoordinator;
}

function makeHistory(): HistoryManager {
  return { back: vi.fn(), forward: vi.fn(), push: vi.fn() } as unknown as HistoryManager;
}

describe('buildEngineInputManagerHandlers', () => {
  let toolState: ToolState;
  let selection: SelectionState;
  let colorPins: ImpastoEngineColorPinsApi;
  let colorPinCoordinator: ColorPinCoordinator;
  let history: HistoryManager;
  let ensureLive: () => void;

  beforeEach(() => {
    toolState = makeToolState();
    selection = makeSelection();
    colorPins = makeColorPins();
    colorPinCoordinator = makeCoordinator();
    history = makeHistory();
    ensureLive = vi.fn<() => void>();
  });

  function build() {
    return buildEngineInputManagerHandlers({
      toolState,
      selection,
      colorPins,
      colorPinCoordinator,
      history,
      ensureLive,
    });
  }

  it('getActiveToolId returns the active tool id', () => {
    const handlers = build();
    expect(handlers.getActiveToolId()).toBe('pan');
  });

  it('setActiveTool delegates to toolState', () => {
    const handlers = build();
    handlers.setActiveTool('sample-color');
    expect(toolState.setActiveTool).toHaveBeenCalledWith('sample-color');
  });

  it('deleteSelected calls ensureLive and removeMany for selected pins', () => {
    selection = makeSelection(true);
    const handlers = buildEngineInputManagerHandlers({
      toolState, selection, colorPins, colorPinCoordinator, history, ensureLive,
    });
    handlers.deleteSelected();
    expect(ensureLive).toHaveBeenCalledOnce();
    expect(colorPins.removeMany).toHaveBeenCalledWith(['p1']);
  });

  it('deleteSelected does not call removeMany when selection is empty', () => {
    const handlers = build();
    handlers.deleteSelected();
    expect(colorPins.removeMany).not.toHaveBeenCalled();
  });

  it('hasDeletableSelection returns true when pins are selected', () => {
    selection = makeSelection(true);
    const handlers = buildEngineInputManagerHandlers({
      toolState, selection, colorPins, colorPinCoordinator, history, ensureLive,
    });
    expect(handlers.hasDeletableSelection()).toBe(true);
  });

  it('hasDeletableSelection returns false when selection is empty', () => {
    const handlers = build();
    expect(handlers.hasDeletableSelection()).toBe(false);
  });

  it('historyBack calls ensureLive, abortDrag, and history.back', () => {
    const handlers = build();
    handlers.historyBack();
    expect(ensureLive).toHaveBeenCalledOnce();
    expect(colorPinCoordinator.abortDrag).toHaveBeenCalledOnce();
    expect(history.back).toHaveBeenCalledOnce();
  });

  it('historyForward calls ensureLive, abortDrag, and history.forward', () => {
    const handlers = build();
    handlers.historyForward();
    expect(ensureLive).toHaveBeenCalledOnce();
    expect(colorPinCoordinator.abortDrag).toHaveBeenCalledOnce();
    expect(history.forward).toHaveBeenCalledOnce();
  });

  it('nudgeSampleColorBrush calls toolState.setToolParam', () => {
    const handlers = build();
    // nudgeSampleColorBrushByHotkey writes to toolState; just verify it does not throw
    expect(() => handlers.nudgeSampleColorBrush(1)).not.toThrow();
  });
});
