import type { ColorSample } from '../../../types';

type EyedropperState =
  | { type: 'idle' }
  | { type: 'adding_color' }
  | { type: 'sampling_levels'; filterId: string; point: 'black' | 'white' };

export type EyedropperResult =
  | { type: 'new_color'; sample: ColorSample; hex: string }
  | { type: 'sample_levels'; filterId: string; point: 'black' | 'white'; sample: ColorSample; hex: string };

export interface EyedropperEngineAdapter {
  getColorAt(x: number, y: number, radius: number): string;
}

type Listener = () => void;

export class EyedropperController {
  private state: EyedropperState = { type: 'idle' };
  private radius = 30;
  private listeners = new Set<Listener>();
  private engine: EyedropperEngineAdapter;
  private onSampleCallback: (result: EyedropperResult) => void;
  private onCancelCallback: (() => void) | undefined;

  constructor(
    engine: EyedropperEngineAdapter,
    onSample: (result: EyedropperResult) => void,
    onCancel?: () => void,
  ) {
    this.engine = engine;
    this.onSampleCallback = onSample;
    this.onCancelCallback = onCancel;
  }

  subscribe(l: Listener): () => void {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }

  activate(): void { this.setState({ type: 'adding_color' }); }

  startSamplingLevels(filterId: string, point: 'black' | 'white'): void {
    this.setState({ type: 'sampling_levels', filterId, point });
  }

  // TODO: sample() is not called end-to-end from the UI. SamplerOverlay handles click events and
  // calls onSample directly (routed via PaletteTabContent/FiltersTabContent), bypassing this method.
  // To fully wire this: centralise the onSample routing callback and call eyedropper.sample(x, y)
  // from SamplerOverlay's click handler instead of computing the result inline there.
  sample(x: number, y: number): void {
    const { state } = this;
    if (state.type === 'idle') return;
    const hex = this.engine.getColorAt(x, y, this.radius);
    const s: ColorSample = { x, y, radius: this.radius };
    let result: EyedropperResult;
    if (state.type === 'adding_color') {
      result = { type: 'new_color', sample: s, hex };
    } else {
      result = { type: 'sample_levels', filterId: state.filterId, point: state.point, sample: s, hex };
    }
    this.setState({ type: 'idle' });
    this.onSampleCallback(result);
  }

  cancel(): void {
    this.setState({ type: 'idle' });
    this.onCancelCallback?.();
  }

  setRadius(r: number): void { this.radius = Math.max(1, r); }
  getRadius(): number { return this.radius; }
  getState(): EyedropperState { return this.state; }
  isActive(): boolean { return this.state.type !== 'idle'; }

  private setState(s: EyedropperState): void {
    this.state = s;
    this.listeners.forEach((l) => l());
  }
}
