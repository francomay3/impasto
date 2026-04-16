import { describe, expect, it, vi } from 'vitest';
import { SelectionState } from './SelectionState';
import {
  deleteSelectedEntries,
  selectionContainsDeletableEntries,
  selectionStateHasDeletableSelection,
} from './selectionDeletion';

describe('selectionContainsDeletableEntries', () => {
  it('is true when a color pin is selected', () => {
    expect(selectionContainsDeletableEntries([{ kind: 'colorPin', id: 'a' }])).toBe(true);
  });

  it('is false for empty selection', () => {
    expect(selectionContainsDeletableEntries([])).toBe(false);
  });
});

describe('selectionStateHasDeletableSelection', () => {
  it('reflects current selection', () => {
    const s = new SelectionState();
    expect(selectionStateHasDeletableSelection(s)).toBe(false);
    s.set([{ kind: 'colorPin', id: 'x' }]);
    expect(selectionStateHasDeletableSelection(s)).toBe(true);
  });
});

describe('deleteSelectedEntries', () => {
  it('calls removeColorPins with selected ids and relies on host to prune selection', () => {
    const selection = new SelectionState();
    selection.set([
      { kind: 'colorPin', id: 'a' },
      { kind: 'colorPin', id: 'b' },
    ]);
    const removeColorPins = vi.fn();
    deleteSelectedEntries(selection, { removeColorPins });
    expect(removeColorPins).toHaveBeenCalledWith(['a', 'b']);
  });

  it('does not call removeColorPins when no pins in selection', () => {
    const selection = new SelectionState();
    selection.set([]);
    const removeColorPins = vi.fn();
    deleteSelectedEntries(selection, { removeColorPins });
    expect(removeColorPins).not.toHaveBeenCalled();
  });
});
