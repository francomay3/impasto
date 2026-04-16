/**
 * Pure chord matching for engine hotkeys. Browser-normalized: uses {@link KeyboardEvent.code}.
 * Tool letters: **Figma-style** Hand H + Esc, Move V; **C** is sample-color (app-specific, not Figma’s comment tool); delete: Backspace/Delete/X.
 */

import type { HotkeyBinding, HotkeyToolContext } from './hotkeyBinding';
import { HotkeyPriorityTier } from './hotkeyBinding';

;

/** True when hotkeys should not steal focus from typing or modal UI. */
export function shouldIgnoreHotkeysForEventTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false;
  }
  if (target.closest('input, textarea, select, [contenteditable="true"]')) {
    return true;
  }
  if (target.closest('[role="dialog"]')) {
    return true;
  }
  return false;
}

/** Figma Hand (H) or Escape — both activate pan without modifiers. */
export function matchPanTool(e: KeyboardEvent): boolean {
  if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) {
    return false;
  }
  return e.code === 'KeyH' || e.code === 'Escape';
}

/** Sample-color tool (C) — intentional exception to Figma’s I=eyedropper / C=comment mapping. */
export function matchSampleColorTool(e: KeyboardEvent): boolean {
  return (
    e.code === 'KeyC' &&
    !e.metaKey &&
    !e.ctrlKey &&
    !e.altKey &&
    !e.shiftKey
  );
}

/** Figma Move tool (V) — rectangular drag selection in this engine. */
export function matchMarqueeTool(e: KeyboardEvent): boolean {
  return (
    e.code === 'KeyV' &&
    !e.metaKey &&
    !e.ctrlKey &&
    !e.altKey &&
    !e.shiftKey
  );
}

/** Cmd (Mac) or Ctrl (other): arrow up/down adjusts sample-color brush when that tool is active. */
export function matchSampleBrushNudge(e: KeyboardEvent, ctx: HotkeyToolContext): boolean {
  if (ctx.activeToolId !== 'sample-color') {
    return false;
  }
  if (!(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) {
    return false;
  }
  return e.code === 'ArrowUp' || e.code === 'ArrowDown';
}

export function brushNudgeDeltaSteps(e: KeyboardEvent): 1 | -1 {
  return e.code === 'ArrowUp' ? 1 : -1;
}

/** Delete selected deletable entities: Backspace, Delete, or X (no modifiers). */
export function matchDeleteSelection(e: KeyboardEvent, ctx: HotkeyToolContext): boolean {
  if (!ctx.hasDeletableSelection) {
    return false;
  }
  if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) {
    return false;
  }
  return e.code === 'Backspace' || e.code === 'Delete' || e.code === 'KeyX';
}

/** Cmd/Ctrl+Z without Shift — undo (browser text fields are skipped upstream). */
export function matchHistoryUndo(e: KeyboardEvent): boolean {
  if (e.altKey) {
    return false;
  }
  if (!(e.metaKey || e.ctrlKey)) {
    return false;
  }
  if (e.shiftKey) {
    return false;
  }
  return e.code === 'KeyZ';
}

/** Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y — redo. */
export function matchHistoryRedo(e: KeyboardEvent): boolean {
  if (e.altKey) {
    return false;
  }
  if (!(e.metaKey || e.ctrlKey)) {
    return false;
  }
  if (e.code === 'KeyY' && !e.shiftKey) {
    return true;
  }
  return e.code === 'KeyZ' && e.shiftKey;
}

/**
 * Bindings that apply regardless of active tool (merged with the active tool’s {@link ImpastoTool.getHotkeyBindings}).
 * All use {@link HotkeyPriorityTier.global}; tool classes use {@link HotkeyPriorityTier.tool} so tool chords win if both tiers ever match the same key.
 */
export function createGlobalHotkeyBindings(): readonly HotkeyBinding[] {
  const p = HotkeyPriorityTier.global;
  return [
    {
      priority: p + 2,
      match: (e) => matchHistoryRedo(e),
      run: (_e, host) => {
        host.historyForward();
      },
    },
    {
      priority: p + 1,
      match: (e) => matchHistoryUndo(e),
      run: (_e, host) => {
        host.historyBack();
      },
    },
    {
      priority: p,
      match: (e, ctx) => matchDeleteSelection(e, ctx),
      run: (_e, host) => {
        host.deleteSelected();
      },
    },
    {
      priority: p,
      match: (e) => matchPanTool(e),
      run: (_e, host) => {
        host.setActiveTool('pan');
      },
    },
    {
      priority: p,
      match: (e) => matchSampleColorTool(e),
      run: (_e, host) => {
        host.setActiveTool('sample-color');
      },
    },
    {
      priority: p,
      match: (e) => matchMarqueeTool(e),
      run: (_e, host) => {
        host.setActiveTool('marquee-select');
      },
    },
  ];
}
