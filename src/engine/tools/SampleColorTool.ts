import { DEFAULT_SAMPLE_COLOR_BRUSH_SIZE } from '../infra/engineConstants';
import { brushNudgeDeltaSteps, matchSampleBrushNudge } from '../input/engineHotkeys';
import type { HotkeyBinding, HotkeyRunHost } from '../input/hotkeyBinding';
import { HotkeyPriorityTier } from '../input/hotkeyBinding';
import { clampNumber, materializeNumberParam } from './toolParamUtils';
import type { ImpastoToolsState, Tool } from './ToolState';
import type { ViewportCanvasPointerUi } from '../viewports/canvas/chrome/viewportCanvasPointerUi';
import { ImpastoTool, type ToolPointerChromeArgs, type ToolParamApplyResult } from './ImpastoTool';
import {
  allowsPrimaryClickColorSample,
  effectivePrimaryDragPan,
  type ToolInputCaps,
} from './toolInputCombine';

type SampleColorInternalState = { brushSize: number };

const BRUSH_SCHEMA = {
  key: 'brushSize',
  label: 'Brush size',
  min: 1,
  max: 120,
  step: 1,
  unit: 'px',
} as const;

/**
 * Brush radius in image pixels for sampling / reticle; only meaningful when the active tool is sample-color.
 */
export function sampleColorBrushRadiusFromToolsState(state: ImpastoToolsState): number {
  if (state.activeTool.id !== 'sample-color') {
    return 1;
  }
  for (const p of state.activeTool.config.params) {
    if (p.kind === 'number' && p.key === 'brushSize') {
      return p.value;
    }
  }
  return 1;
}

export class SampleColorTool extends ImpastoTool {
  readonly id = 'sample-color' as const;
  readonly label = 'Sample color';
  readonly inputCaps: ToolInputCaps = {
    primaryButtonDragPan: false,
    wheelZoom: true,
    primaryClickColorSample: true,
  };

  pointerChrome({
    surface,
    pointerInside,
    panDrag,
  }: ToolPointerChromeArgs): ViewportCanvasPointerUi {
    /** While panning (any button), Photoshop-style hand: grab cursor, no sampling ring. */
    if (panDrag !== null) {
      return { cursor: 'grabbing', sampleRingActive: false };
    }
    if (pointerInside && allowsPrimaryClickColorSample(surface, this.inputCaps)) {
      return { cursor: 'none', sampleRingActive: true };
    }
    if (effectivePrimaryDragPan(surface, this.inputCaps)) {
      return { cursor: 'grab', sampleRingActive: false };
    }
    return { cursor: 'default', sampleRingActive: false };
  }

  getDefaultInternalState(): unknown {
    const s: SampleColorInternalState = { brushSize: DEFAULT_SAMPLE_COLOR_BRUSH_SIZE };
    return s;
  }

  private parseInternal(raw: unknown): SampleColorInternalState {
    if (raw && typeof raw === 'object' && 'brushSize' in raw) {
      const v = (raw as { brushSize: unknown }).brushSize;
      if (typeof v === 'number' && Number.isFinite(v)) {
        return { brushSize: v };
      }
    }
    return { brushSize: DEFAULT_SAMPLE_COLOR_BRUSH_SIZE };
  }

  toToolSnapshot(internal: unknown): Tool {
    const { brushSize } = this.parseInternal(internal);
    const brush = clampNumber(brushSize, BRUSH_SCHEMA.min, BRUSH_SCHEMA.max, BRUSH_SCHEMA.step);
    return {
      id: 'sample-color',
      label: this.label,
      config: {
        params: [
          materializeNumberParam(
            {
              key: BRUSH_SCHEMA.key,
              label: BRUSH_SCHEMA.label,
              min: BRUSH_SCHEMA.min,
              max: BRUSH_SCHEMA.max,
              step: BRUSH_SCHEMA.step,
              unit: BRUSH_SCHEMA.unit,
            },
            brush
          ),
        ],
      },
    };
  }

  applyParam(internal: unknown, paramKey: string, value: unknown): ToolParamApplyResult | null {
    if (paramKey !== BRUSH_SCHEMA.key) {
      return null;
    }
    const s = this.parseInternal(internal);
    const next = clampNumber(value, BRUSH_SCHEMA.min, BRUSH_SCHEMA.max, BRUSH_SCHEMA.step);
    if (s.brushSize === next) {
      return { next: s, changed: false };
    }
    return { next: { brushSize: next } satisfies SampleColorInternalState, changed: true };
  }

  override getHotkeyBindings(_host: HotkeyRunHost): readonly HotkeyBinding[] {
    return [
      {
        priority: HotkeyPriorityTier.tool,
        allowRepeat: true,
        match: (e, ctx) => matchSampleBrushNudge(e, ctx),
        run: (e, h) => {
          h.nudgeSampleColorBrush(brushNudgeDeltaSteps(e));
        },
      },
    ];
  }
}
