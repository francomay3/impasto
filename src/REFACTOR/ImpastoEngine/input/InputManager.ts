/**
 * Centralizes pointer, keyboard, wheel, and related input: normalization, routing, and focus/coalescing policy.
 *
 * Keyboard: engine hotkeys attach at `window` capture phase. Bindings are merged from global rules and the
 * active {@link ImpastoTool}, then sorted by {@link HotkeyBinding.priority}.
 */

import { createGlobalHotkeyBindings, shouldIgnoreHotkeysForEventTarget } from './engineHotkeys';
import { dispatchHotkey, sortHotkeyBindings, type HotkeyRunHost } from './hotkeyBinding';
import { getImpastoTool } from '../tools/impastoToolRegistry';
import type { ImpastoToolId } from '../tools/ToolState';

/** Callbacks merged into {@link InputManager.attach} for global + per-tool hotkeys. */
export type InputManagerHost = {
  getActiveToolId(): ImpastoToolId;
  setActiveTool(tool: ImpastoToolId): void;
  /** No-op if the active tool is not `sample-color`. */
  nudgeSampleColorBrush(deltaSteps: number): void;
  /** Removes selected deletable entities (e.g. color pins) and clears selection. */
  deleteSelected(): void;
  hasDeletableSelection(): boolean;
  historyBack(): void;
  historyForward(): void;
};

export class InputManager {
  private unbindKeydown: (() => void) | null = null;

  /**
   * Registers global key listeners. Call once when the engine is ready; {@link detach} on shutdown.
   * @returns Same cleanup function as {@link detach}.
   */
  attach(host: InputManagerHost): () => void {
    this.detach();

    const globalBindings = createGlobalHotkeyBindings();
    const runHost: HotkeyRunHost = {
      setActiveTool: (tool) => host.setActiveTool(tool),
      nudgeSampleColorBrush: (delta) => host.nudgeSampleColorBrush(delta),
      deleteSelected: () => host.deleteSelected(),
      historyBack: () => host.historyBack(),
      historyForward: () => host.historyForward(),
    };

    const onKeyDown = (e: KeyboardEvent): void => {
      if (shouldIgnoreHotkeysForEventTarget(e.target)) {
        return;
      }

      const activeId = host.getActiveToolId();
      const ctx = {
        activeToolId: activeId,
        hasDeletableSelection: host.hasDeletableSelection(),
      };

      const toolBindings = getImpastoTool(activeId).getHotkeyBindings(runHost);
      const merged = sortHotkeyBindings([...globalBindings, ...toolBindings]);
      dispatchHotkey(e, ctx, merged, runHost);
    };

    window.addEventListener('keydown', onKeyDown, { capture: true });
    this.unbindKeydown = () => {
      window.removeEventListener('keydown', onKeyDown, { capture: true });
      this.unbindKeydown = null;
    };

    return this.unbindKeydown;
  }

  detach(): void {
    this.unbindKeydown?.();
  }
}
