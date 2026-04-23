import { describe, expect, it } from 'vitest';
import { HistoryManager } from './HistoryManager';
import { readHistoryCapabilities } from './historyCapabilitiesSnapshot';

describe('readHistoryCapabilities', () => {
  it('reuses the same object reference when flags are unchanged', () => {
    const history = new HistoryManager();
    const a = readHistoryCapabilities(history);
    const b = readHistoryCapabilities(history);
    expect(a).toBe(b);
    expect(a).toEqual({ canUndo: false, canRedo: false });
  });

  it('returns a new object when undo availability changes', () => {
    const history = new HistoryManager();
    const empty = readHistoryCapabilities(history);
    history.push({ undo: () => {}, redo: () => {} });
    const afterPush = readHistoryCapabilities(history);
    expect(afterPush).not.toBe(empty);
    expect(afterPush).toEqual({ canUndo: true, canRedo: false });
    history.back();
    const afterBack = readHistoryCapabilities(history);
    expect(afterBack).not.toBe(afterPush);
    expect(afterBack).toEqual({ canUndo: false, canRedo: true });
  });
});
