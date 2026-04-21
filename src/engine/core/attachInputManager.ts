/**
 * Thin wiring: registers {@link InputManager} global `keydown` capture using callbacks owned by the composition
 * root ({@link ImpastoEngine}). Keeps the engine constructor free of the full `attach({ ... })` literal while
 * preserving a single typed surface for hotkey host behaviour.
 *
 * **`InputManagerHandlers` / {@link InputManagerHost} fields:**
 * - **`getActiveToolId`**: Which tool’s bindings to merge with globals (engine tool state).
 * - **`setActiveTool`**: Hotkey-driven tool switches.
 * - **`nudgeSampleColorBrush`**: Brush-size nudge when sample-color is active (no-op otherwise).
 * - **`deleteSelected`**: Backspace/delete — removes deletable selection entries (e.g. color pins).
 * - **`hasDeletableSelection`**: Gates whether delete-style bindings should run.
 * - **`historyBack` / `historyForward`**: Undo/redo; callers should abort in-flight color-pin drags before stack
 *   navigation so history snapshots do not race pointer-drag session state.
 */

import { InputManager, type InputManagerHost } from '../input/InputManager';

/** Same shape as {@link InputManagerHost}; exported under this name for the wiring module API. */
export type InputManagerHandlers = InputManagerHost;

/**
 * Registers keyboard listeners on `manager`. Returns the same cleanup as {@link InputManager.attach}.
 */
export function attachInputManager(manager: InputManager, handlers: InputManagerHandlers): () => void {
  return manager.attach(handlers);
}
