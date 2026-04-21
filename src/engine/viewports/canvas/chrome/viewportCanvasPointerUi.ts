import type { ImpastoToolId } from '../../../tools/ToolState';
import { getImpastoTool } from '../../../tools/impastoToolRegistry';
import type { ViewportSurfaceId } from '../host/viewportInputPolicy';

export type ViewportCanvasPointerUi = {
  cursor: 'none' | 'grab' | 'grabbing' | 'default' | 'crosshair';
  /** When false, the sample ring must not be painted or fed pointer positions. */
  sampleRingActive: boolean;
};

/**
 * Pointer chrome + overlay policy from the active {@link ImpastoTool}, surface, hover, and active pan gesture.
 */
export function viewportCanvasPointerUi(args: {
  surface: ViewportSurfaceId;
  toolId: ImpastoToolId;
  pointerInside: boolean;
  panDrag: null | { pointerButton: 0 | 1 };
}): ViewportCanvasPointerUi {
  const tool = getImpastoTool(args.toolId);
  return tool.pointerChrome({
    surface: args.surface,
    pointerInside: args.pointerInside,
    panDrag: args.panDrag,
  });
}
