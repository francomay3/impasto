import type { Tool } from './ToolState';
import type { ViewportCanvasPointerUi } from '../viewports/canvas/chrome/viewportCanvasPointerUi';
import { ImpastoTool, type ToolPointerChromeArgs, type ToolParamApplyResult } from './ImpastoTool';
import { allowsMarqueeSelect, type ToolInputCaps } from './toolInputCombine';
import type { MarqueeUiMode } from '../selection/effectiveMarqueeMode';
import type { ToolConfigChoiceParam } from './toolConfigParams';

const MODE_KEY = 'marqueeMode' as const;

const MODE_OPTIONS: readonly { value: MarqueeUiMode; label: string }[] = [
  { value: 'replace', label: 'Replace' },
  { value: 'add', label: 'Add' },
  { value: 'subtract', label: 'Subtract' },
];

type MarqueeInternalState = { mode: MarqueeUiMode };

export class MarqueeTool extends ImpastoTool {
  readonly id = 'marquee-select' as const;
  readonly label = 'Marquee';
  readonly inputCaps: ToolInputCaps = {
    primaryButtonDragPan: false,
    wheelZoom: true,
    primaryClickColorSample: false,
  };

  pointerChrome({ surface, pointerInside, panDrag }: ToolPointerChromeArgs): ViewportCanvasPointerUi {
    /** While panning, hand cursor — same as navigating with the Hand tool in Photoshop. */
    if (panDrag !== null) {
      return { cursor: 'grabbing', sampleRingActive: false };
    }
    if (pointerInside && allowsMarqueeSelect(surface, this.inputCaps)) {
      return { cursor: 'crosshair', sampleRingActive: false };
    }
    return { cursor: 'default', sampleRingActive: false };
  }

  getDefaultInternalState(): unknown {
    const s: MarqueeInternalState = { mode: 'replace' };
    return s;
  }

  private parseInternal(raw: unknown): MarqueeInternalState {
    if (raw && typeof raw === 'object' && 'mode' in raw) {
      const m = (raw as { mode: unknown }).mode;
      if (m === 'replace' || m === 'add' || m === 'subtract') {
        return { mode: m };
      }
    }
    return { mode: 'replace' };
  }

  toToolSnapshot(internal: unknown): Tool {
    const { mode } = this.parseInternal(internal);
    const choice: ToolConfigChoiceParam = {
      kind: 'choice',
      key: MODE_KEY,
      label: 'Selection mode',
      value: mode,
      options: MODE_OPTIONS.map((o) => ({ ...o })),
    };
    return {
      id: 'marquee-select',
      label: this.label,
      config: { params: [choice] },
    };
  }

  applyParam(internal: unknown, paramKey: string, value: unknown): ToolParamApplyResult | null {
    if (paramKey !== MODE_KEY) {
      return null;
    }
    if (value !== 'replace' && value !== 'add' && value !== 'subtract') {
      return null;
    }
    const cur = this.parseInternal(internal);
    if (cur.mode === value) {
      return { next: internal, changed: false };
    }
    return { next: { mode: value } satisfies MarqueeInternalState, changed: true };
  }

}

export function marqueeUiModeFromToolsState(activeTool: Tool): MarqueeUiMode {
  if (activeTool.id !== 'marquee-select') {
    return 'replace';
  }
  for (const p of activeTool.config.params) {
    if (p.kind === 'choice' && p.key === MODE_KEY) {
      const v = p.value;
      if (v === 'replace' || v === 'add' || v === 'subtract') {
        return v;
      }
    }
  }
  return 'replace';
}
