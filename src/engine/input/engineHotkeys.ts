/**
 * Pure chord matching for engine hotkeys. Registry-driven via {@link matchesHotkey} + {@link HOTKEY_META}
 * (same physical keys/modifiers as before). Browser-normalized: uses {@link KeyboardEvent.code}.
 */

import { matchesHotkey } from '../../matchesHotkey';
import type { HotkeyBinding, HotkeyToolContext } from './hotkeyBinding';
import { HotkeyPriorityTier } from './hotkeyBinding';

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
  return matchesHotkey(e, 'PAN_TOOL');
}

/** Sample-color tool (C) — intentional exception to Figma’s I=eyedropper / C=comment mapping. */
export function matchSampleColorTool(e: KeyboardEvent): boolean {
  return matchesHotkey(e, 'ADD_COLOR');
}

/** Figma Move tool (V) — rectangular drag selection in this engine. */
export function matchMarqueeTool(e: KeyboardEvent): boolean {
  return matchesHotkey(e, 'TOOL_SELECT');
}

/** Cmd (Mac) or Ctrl (other): arrow up/down adjusts sample-color brush when that tool is active. */
export function matchSampleBrushNudge(e: KeyboardEvent, ctx: HotkeyToolContext): boolean {
  if (ctx.activeToolId !== 'sample-color') {
    return false;
  }
  return matchesHotkey(e, 'BRUSH_NUDGE_UP') || matchesHotkey(e, 'BRUSH_NUDGE_DOWN');
}

export function brushNudgeDeltaSteps(e: KeyboardEvent): 1 | -1 {
  return e.code === 'ArrowUp' ? 1 : -1;
}

/** Delete selected deletable entities: Backspace, Delete, or X (no modifiers). */
export function matchDeleteSelection(e: KeyboardEvent, ctx: HotkeyToolContext): boolean {
  if (!ctx.hasDeletableSelection) {
    return false;
  }
  return matchesHotkey(e, 'DELETE_COLOR');
}

/** Cmd/Ctrl+Z without Shift — undo (browser text fields are skipped upstream). */
export function matchHistoryUndo(e: KeyboardEvent): boolean {
  return matchesHotkey(e, 'UNDO');
}

/** Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y — redo. */
export function matchHistoryRedo(e: KeyboardEvent): boolean {
  return matchesHotkey(e, 'REDO') || matchesHotkey(e, 'REDO_ALT');
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
