import type { HotkeyBinding, HotkeyRunHost } from '../input/hotkeyBinding';
import type { ImpastoToolId, Tool } from './ToolState';
import type { ViewportCanvasPointerUi } from '../viewports/canvas/chrome/viewportCanvasPointerUi';
import type { ToolInputCaps, ViewportSurfaceId } from './toolInputCombine';

export type ToolPointerChromeArgs = {
  surface: ViewportSurfaceId;
  pointerInside: boolean;
  panDrag: null | { pointerButton: 0 | 1 };
};

/**
 * Result of applying a param: `null` means this tool does not handle that key (or ignores updates).
 */
export type ToolParamApplyResult = { readonly next: unknown; readonly changed: boolean };

/**
 * Every Impasto tool: metadata, viewport chrome, input caps, optional hotkeys, and how UI params map to internal state.
 */
export abstract class ImpastoTool {
  abstract readonly id: ImpastoToolId;
  abstract readonly label: string;
  abstract readonly inputCaps: ToolInputCaps;

  abstract pointerChrome(args: ToolPointerChromeArgs): ViewportCanvasPointerUi;

  /** Opaque internal blob stored in {@link ToolState}; defaults only. */
  abstract getDefaultInternalState(): unknown;

  /** Builds the Mantine-facing {@link Tool} row from internal state. */
  abstract toToolSnapshot(internal: unknown): Tool;

  abstract applyParam(internal: unknown, paramKey: string, value: unknown): ToolParamApplyResult | null;

  /**
   * Hotkeys active only while this tool is the active tool (merged with global bindings by {@link InputManager}).
   */
  getHotkeyBindings(_host: HotkeyRunHost): readonly HotkeyBinding[] {
    return [];
  }
}
