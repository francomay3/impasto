import type { ImpastoToolId } from '../tools/ToolState';

export type HotkeyToolContext = {
  readonly activeToolId: ImpastoToolId;
  readonly hasDeletableSelection: boolean;
};

/**
 * Coarse priority bands so globals stay below tool-specific shortcuts; add new tiers here as needed
 * (e.g. focused panel between `global` and `tool`).
 *
 * Use `tier + smallOffset` when two bindings in the same tier must be ordered.
 */
export const HotkeyPriorityTier = {
  /** Engine-wide: activate tools, delete selection, undo, … */
  global: 1_000,
  /** Registered via `ImpastoTool.getHotkeyBindings` for the active tool. */
  tool: 2_000,
} as const;

export type HotkeyBinding = {
  /** Higher runs first when multiple bindings match. Prefer {@link HotkeyPriorityTier} (+ optional offset). */
  readonly priority: number;
  readonly match: (e: KeyboardEvent, ctx: HotkeyToolContext) => boolean;
  /** If false, repeat keydown events are ignored (default tool activation, delete). */
  readonly allowRepeat?: boolean;
  readonly run: (e: KeyboardEvent, host: HotkeyRunHost) => void;
};

export type HotkeyRunHost = {
  setActiveTool(tool: ImpastoToolId): void;
  nudgeSampleColorBrush(deltaSteps: number): void;
  deleteSelected(): void;
  historyBack(): void;
  historyForward(): void;
};

/**
 * Sorts by descending priority, then stable order.
 */
export function sortHotkeyBindings(bindings: readonly HotkeyBinding[]): HotkeyBinding[] {
  return bindings.slice().sort((a, b) => b.priority - a.priority);
}

export function dispatchHotkey(
  e: KeyboardEvent,
  ctx: HotkeyToolContext,
  bindings: readonly HotkeyBinding[],
  host: HotkeyRunHost,
): boolean {
  for (const b of bindings) {
    if (!b.match(e, ctx)) {
      continue;
    }
    if (e.repeat && !b.allowRepeat) {
      continue;
    }
    e.preventDefault();
    b.run(e, host);
    return true;
  }
  return false;
}
