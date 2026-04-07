// @vitest-environment happy-dom
import { render, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { CanvasEngine } from '../engine/CanvasEngine';
import { EngineProvider } from '../engine/EngineContext';
import { PaletteContext } from '../../palette/PaletteContext';
import { FilterContext } from '../../filters/FilterContext';
import { ContextualToolbar } from '.';
import { useEditorStore } from '../../editor/editorStore';

const noop = () => {};

const mockPaletteContext = {
  palette: [],
  groups: [],
  isAddingColor: false,
  onAddNewColor: noop,
  onCancelAddingColor: noop,
  onRenameColor: noop,
  onAddColor: noop,
  onAddColorAtPosition: noop,
  onDeleteColor: noop,
  onPinMoveEnd: noop,
  onRemoveSamplePin: noop,
  onAddGroup: noop,
  onRemoveGroup: noop,
  onRenameGroup: noop,
  onSetColorGroup: noop,
  onReorderPalette: noop,
  onReorderGroups: noop,
};

const mockFilterContext = {
  filters: [],
  preIndexingBlur: 0,
  setPreIndexingBlur: noop,
  samplingLevels: null,
  onAddFilter: noop,
  onDuplicateFilter: noop,
  onRemoveFilter: noop,
  onToggleFilter: noop,
  onUpdateFilter: noop,
  onPreviewFilter: noop,
  onReorderFilters: noop,
  onStartSamplingLevels: noop,
  onSampleLevels: noop,
  onCancelSamplingLevels: noop,
};

function Wrapper({ engine, children }: { engine: CanvasEngine; children: React.ReactNode }) {
  return (
    <MantineProvider>
      <EngineProvider value={engine}>
        <PaletteContext.Provider value={mockPaletteContext}>
          <FilterContext.Provider value={mockFilterContext}>
            {children}
          </FilterContext.Provider>
        </PaletteContext.Provider>
      </EngineProvider>
    </MantineProvider>
  );
}

describe('ContextualToolbar — marquee mode buttons', () => {
  let engine: CanvasEngine;
  const selectColor = useEditorStore.getState().selectColor;

  beforeEach(() => {
    engine = new CanvasEngine();
    // Set marquee as active tool and pre-fill a selection
    useEditorStore.setState({
      activePaletteTool: 'marquee',
      selectedColorIds: new Set(['c1', 'c2']),
    });
  });

  afterEach(() => {
    cleanup();
    useEditorStore.setState({ selectedColorIds: new Set(), activePaletteTool: 'select' });
  });

  it('clicking "Add to Selection" does not clear the current selection', () => {
    const { getByRole } = render(
      // This div mimics AppShell.Main's onClick that clears selection on any click
      <div onClick={() => selectColor(null)}>
        <Wrapper engine={engine}>
          <ContextualToolbar tab="palette" />
        </Wrapper>
      </div>,
    );

    fireEvent.click(getByRole('button', { name: 'Add to Selection' }));

    expect(useEditorStore.getState().selectedColorIds).toEqual(new Set(['c1', 'c2']));
  });

  it('clicking "Subtract" does not clear the current selection', () => {
    const { getByRole } = render(
      <div onClick={() => selectColor(null)}>
        <Wrapper engine={engine}>
          <ContextualToolbar tab="palette" />
        </Wrapper>
      </div>,
    );

    fireEvent.click(getByRole('button', { name: 'Subtract' }));

    expect(useEditorStore.getState().selectedColorIds).toEqual(new Set(['c1', 'c2']));
  });

  it('clicking "Add to Selection" sets the selection mode to add', () => {
    const { getByRole } = render(
      <div onClick={() => selectColor(null)}>
        <Wrapper engine={engine}>
          <ContextualToolbar tab="palette" />
        </Wrapper>
      </div>,
    );

    fireEvent.click(getByRole('button', { name: 'Add to Selection' }));

    expect(engine.getToolState().selectionMode).toBe('add');
  });

  it('clicking "Subtract" sets the selection mode to subtract', () => {
    const { getByRole } = render(
      <div onClick={() => selectColor(null)}>
        <Wrapper engine={engine}>
          <ContextualToolbar tab="palette" />
        </Wrapper>
      </div>,
    );

    fireEvent.click(getByRole('button', { name: 'Subtract' }));

    expect(engine.getToolState().selectionMode).toBe('subtract');
  });
});
