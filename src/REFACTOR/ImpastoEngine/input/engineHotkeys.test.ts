// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import type { HotkeyToolContext } from './hotkeyBinding';
import {
  brushNudgeDeltaSteps,
  matchDeleteSelection,
  matchHistoryRedo,
  matchHistoryUndo,
  matchPanTool,
  matchSampleBrushNudge,
  matchMarqueeTool,
  matchSampleColorTool,
  shouldIgnoreHotkeysForEventTarget,
} from './engineHotkeys';

function key(partial: Pick<KeyboardEvent, 'code'> & Partial<KeyboardEvent>): KeyboardEvent {
  return {
    code: partial.code,
    metaKey: partial.metaKey ?? false,
    ctrlKey: partial.ctrlKey ?? false,
    altKey: partial.altKey ?? false,
    shiftKey: partial.shiftKey ?? false,
    repeat: partial.repeat ?? false,
  } as KeyboardEvent;
}

describe('engineHotkeys', () => {
  it('shouldIgnoreHotkeysForEventTarget skips inputs and dialogs', () => {
    const input = document.createElement('input');
    expect(shouldIgnoreHotkeysForEventTarget(input)).toBe(true);

    const wrap = document.createElement('div');
    const inner = document.createElement('textarea');
    wrap.appendChild(inner);
    expect(shouldIgnoreHotkeysForEventTarget(inner)).toBe(true);

    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    expect(shouldIgnoreHotkeysForEventTarget(dialog)).toBe(true);

    const canvasHost = document.createElement('div');
    expect(shouldIgnoreHotkeysForEventTarget(canvasHost)).toBe(false);
  });

  it('matchPanTool matches bare KeyH or Escape (no modifiers)', () => {
    expect(matchPanTool(key({ code: 'KeyH' }))).toBe(true);
    expect(matchPanTool(key({ code: 'Escape' }))).toBe(true);
    expect(matchPanTool(key({ code: 'KeyH', metaKey: true }))).toBe(false);
    expect(matchPanTool(key({ code: 'Escape', shiftKey: true }))).toBe(false);
  });

  it('matchMarqueeTool matches bare KeyV (Figma Move)', () => {
    expect(matchMarqueeTool(key({ code: 'KeyV' }))).toBe(true);
    expect(matchMarqueeTool(key({ code: 'KeyV', metaKey: true }))).toBe(false);
  });

  it('matchSampleColorTool matches bare KeyC (sample-color)', () => {
    expect(matchSampleColorTool(key({ code: 'KeyC' }))).toBe(true);
    expect(matchSampleColorTool(key({ code: 'KeyC', metaKey: true }))).toBe(false);
  });

  it('matchSampleBrushNudge requires sample-color and meta or ctrl + arrow', () => {
    const ctxSample: HotkeyToolContext = { activeToolId: 'sample-color', hasDeletableSelection: false };
    const ctxPan: HotkeyToolContext = { activeToolId: 'pan', hasDeletableSelection: false };

    expect(matchSampleBrushNudge(key({ code: 'ArrowUp', metaKey: true }), ctxSample)).toBe(true);
    expect(matchSampleBrushNudge(key({ code: 'ArrowDown', ctrlKey: true }), ctxSample)).toBe(true);
    expect(matchSampleBrushNudge(key({ code: 'ArrowUp', metaKey: true }), ctxPan)).toBe(false);
    expect(matchSampleBrushNudge(key({ code: 'ArrowUp' }), ctxSample)).toBe(false);
    expect(matchSampleBrushNudge(key({ code: 'ArrowUp', metaKey: true, shiftKey: true }), ctxSample)).toBe(
      false,
    );
  });

  it('brushNudgeDeltaSteps', () => {
    expect(brushNudgeDeltaSteps(key({ code: 'ArrowUp', metaKey: true }))).toBe(1);
    expect(brushNudgeDeltaSteps(key({ code: 'ArrowDown', metaKey: true }))).toBe(-1);
  });

  it('matchHistoryUndo and matchHistoryRedo', () => {
    expect(matchHistoryUndo(key({ code: 'KeyZ', metaKey: true }))).toBe(true);
    expect(matchHistoryUndo(key({ code: 'KeyZ', ctrlKey: true }))).toBe(true);
    expect(matchHistoryUndo(key({ code: 'KeyZ', metaKey: true, shiftKey: true }))).toBe(false);
    expect(matchHistoryRedo(key({ code: 'KeyZ', metaKey: true, shiftKey: true }))).toBe(true);
    expect(matchHistoryRedo(key({ code: 'KeyY', metaKey: true }))).toBe(true);
    expect(matchHistoryRedo(key({ code: 'KeyY', metaKey: true, shiftKey: true }))).toBe(false);
  });

  it('matchDeleteSelection requires selection and Backspace, Delete, or X', () => {
    const on: HotkeyToolContext = { activeToolId: 'pan', hasDeletableSelection: true };
    const off: HotkeyToolContext = { activeToolId: 'pan', hasDeletableSelection: false };
    expect(matchDeleteSelection(key({ code: 'Backspace' }), on)).toBe(true);
    expect(matchDeleteSelection(key({ code: 'Delete' }), on)).toBe(true);
    expect(matchDeleteSelection(key({ code: 'KeyX' }), on)).toBe(true);
    expect(matchDeleteSelection(key({ code: 'Backspace' }), off)).toBe(false);
    expect(matchDeleteSelection(key({ code: 'Backspace', metaKey: true }), on)).toBe(false);
  });
});
