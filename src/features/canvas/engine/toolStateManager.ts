import { EyedropperController } from '../tools/EyedropperController';
import type { SamplingLevels } from '../../filters/FilterContext';
import type { ToolId, SelectionMode } from '../../../tools';

export interface ToolState {
  activeTool: ToolId;
  isSampling: boolean;
  samplingColorId: string | null;
  samplingLevels: SamplingLevels | null;
  samplingRadius: number;
}

export interface InteractionAPI {
  isSampling: boolean;
  samplingColorId: string | null;
  samplingLevels: SamplingLevels | null;
  samplingRadius: number;
  selectionMode: SelectionMode;
  selectTool: (tool: 'select' | 'marquee') => void;
  activateEyedropper: () => void;
  toggleMarquee: () => void;
  startSamplingColor: (colorId: string) => void;
  startSamplingLevels: (filterId: string, point: 'black' | 'white') => void;
  completeSample: () => void;
  cancel: () => void;
  setSamplingRadius: (radius: number) => void;
  setSelectionMode: (m: SelectionMode) => void;
  setActiveTool: (id: ToolId) => void;
}

export class ToolStateManager {
  private _tool: 'select' | 'marquee' = 'select';
  private onTransition: (tool: ToolState) => void;
  private eyedropper: EyedropperController;

  constructor(onTransition: (tool: ToolState) => void) {
    this.onTransition = onTransition;
    this.eyedropper = new EyedropperController({ getColorAt: () => '#000000' }, () => {});
  }

  private emit(): void { this.onTransition(this.derive()); }

  private derive(): ToolState {
    const s = this.eyedropper.getState();
    return {
      activeTool: s.type !== 'idle' ? 'eyedropper' : this._tool,
      isSampling: s.type !== 'idle',
      samplingColorId: s.type === 'sampling_color' ? s.colorId : null,
      samplingLevels: s.type === 'sampling_levels' ? { filterId: s.filterId, point: s.point } : null,
      samplingRadius: this.eyedropper.getRadius(),
    };
  }

  getCurrentTool(): ToolState { return this.derive(); }
  selectTool(id: 'select' | 'marquee'): void { this._tool = id; this.eyedropper.cancel(); this.emit(); }
  activateEyedropper(): void { this.eyedropper.activate(); this.emit(); }
  toggleMarquee(): void { this.selectTool(this._tool === 'marquee' ? 'select' : 'marquee'); }
  startSamplingColor(colorId: string): void { this.eyedropper.startSamplingColor(colorId); this.emit(); }
  startSamplingLevels(filterId: string, point: 'black' | 'white'): void { this.eyedropper.startSamplingLevels(filterId, point); this.emit(); }
  completeSample(): void { this.eyedropper.cancel(); this.emit(); }
  cancel(): void { this._tool = 'select'; this.eyedropper.cancel(); this.emit(); }
  setSamplingRadius(radius: number): void { this.eyedropper.setRadius(radius); this.emit(); }
}
