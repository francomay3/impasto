import type { Tool } from './ToolState';
import type { ViewportCanvasPointerUi } from '../viewports/canvas/chrome/viewportCanvasPointerUi';
import { ImpastoTool, type ToolPointerChromeArgs, type ToolParamApplyResult } from './ImpastoTool';
import { effectivePrimaryDragPan, type ToolInputCaps } from './toolInputCombine';

export class PanTool extends ImpastoTool {
  readonly id = 'pan' as const;
  readonly label = 'Pan';
  readonly inputCaps: ToolInputCaps = {
    primaryButtonDragPan: true,
    wheelZoom: true,
    primaryClickColorSample: false,
  };

  pointerChrome({ surface, pointerInside, panDrag }: ToolPointerChromeArgs): ViewportCanvasPointerUi {
    if (panDrag !== null) {
      return { cursor: 'grabbing', sampleRingActive: false };
    }
    if (pointerInside && effectivePrimaryDragPan(surface, this.inputCaps)) {
      return { cursor: 'grab', sampleRingActive: false };
    }
    return { cursor: 'default', sampleRingActive: false };
  }

  getDefaultInternalState(): unknown {
    return {};
  }

  toToolSnapshot(_internal: unknown): Tool {
    return {
      id: 'pan',
      label: this.label,
      config: { params: [] },
    };
  }

  applyParam(_internal: unknown, _paramKey: string, _value: unknown): ToolParamApplyResult | null {
    return null;
  }
}
