import type { FilterInstance, Color, RawImage } from '../../../types';
import { createRawImage } from '../../../types';
import { applyFilters, sampleCircleAverage } from '../../../utils/imageProcessing';
import { rgbToHex } from '../../../utils/colorUtils';
import { quantizeImage } from '../../../utils/kMeansWrapper';
import { findMixRecipe } from '../../../services/ColorMixer';

export type PipelineStatus = 'idle' | 'loading' | 'filtering' | 'ready';

export interface PipelineState {
  status: PipelineStatus;
  error: string | null;
}

type StateChangeCallback = (state: PipelineState) => void;

export class CanvasPipeline {
  private _sourceCanvas: HTMLCanvasElement | null;
  private get sourceCanvas(): HTMLCanvasElement {
    return (this._sourceCanvas ??= document.createElement('canvas'));
  }
  private getFilteredCanvas: () => HTMLCanvasElement | null;
  private _state: PipelineState = { status: 'idle', error: null };
  private readonly onStateChange: StateChangeCallback | undefined;

  constructor(
    onStateChange?: StateChangeCallback,
    getFilteredCanvas: () => HTMLCanvasElement | null = () => null,
    sourceCanvas?: HTMLCanvasElement,
  ) {
    this.onStateChange = onStateChange;
    this.getFilteredCanvas = getFilteredCanvas;
    this._sourceCanvas = sourceCanvas ?? null;
  }

  private setState(s: PipelineState): void {
    this._state = s;
    this.onStateChange?.(s);
  }

  getState(): PipelineState { return this._state; }

  loadImage(image: RawImage): void {
    const canvas = this.sourceCanvas;
    canvas.width = image.width;
    canvas.height = image.height;
    canvas
      .getContext('2d', { willReadFrequently: true })!
      .putImageData(new ImageData(image.data, image.width, image.height), 0, 0);
    this.setState({ status: 'loading', error: null });
  }

  loadBitmap(bitmap: ImageBitmap): RawImage {
    const canvas = this.sourceCanvas;
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(bitmap, 0, 0);
    const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    this.setState({ status: 'loading', error: null });
    return createRawImage(data, width, height);
  }

  applyFilterPipeline(filters: FilterInstance[]): ImageData | null {
    const src = this.sourceCanvas;
    const filtered = this.getFilteredCanvas();
    if (!filtered) return null;
    filtered.width = src.width;
    filtered.height = src.height;
    const imageData = applyFilters(
      src
        .getContext('2d', { willReadFrequently: true })!
        .getImageData(0, 0, src.width, src.height),
      filters,
    );
    filtered.getContext('2d')!.putImageData(imageData, 0, 0);
    this.setState({ status: 'ready', error: null });
    return imageData;
  }

  getColorAt(x: number, y: number, radius: number): string {
    const filtered = this.getFilteredCanvas();
    const canvas = filtered ?? this._sourceCanvas;
    if (!canvas || canvas.width === 0) return '#000000';
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return '#000000';
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const [r, g, b] = sampleCircleAverage(imageData, x, y, radius);
    return rgbToHex(r, g, b);
  }

  runQuantization(imageData: ImageData, k: number, lockedColors: Color[]): Color[] {
    return quantizeImage(imageData, k, lockedColors).map((c) => ({
      ...c,
      mixRecipe: findMixRecipe(c.hex),
    }));
  }
}
