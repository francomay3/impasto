import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CanvasPipeline } from './pipeline';
import type { Color } from '../../../types';

vi.mock('../../../utils/imageProcessing', () => ({
  applyFilters: vi.fn((data: unknown) => data),
  sampleCircleAverage: vi.fn(() => [255, 128, 0, 255]),
}));
vi.mock('../../../utils/kMeansWrapper', () => ({
  quantizeImage: vi.fn(() => [
    { id: 'c1', hex: '#ff0000', locked: false, ratio: 1, mixRecipe: '' },
  ]),
}));
vi.mock('../../../services/ColorMixer', () => ({
  findMixRecipe: vi.fn(() => 'mock-recipe'),
}));

// ImageData is a browser API not available in node — stub it for these tests
class MockImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  constructor(dataOrWidth: Uint8ClampedArray | number, width?: number, height?: number) {
    if (typeof dataOrWidth === 'number') {
      this.width = dataOrWidth;
      this.height = width ?? dataOrWidth;
      this.data = new Uint8ClampedArray(this.width * this.height * 4);
    } else {
      this.data = dataOrWidth;
      this.width = width!;
      this.height = height!;
    }
  }
}
vi.stubGlobal('ImageData', MockImageData);

function makeCtx() {
  return {
    putImageData: vi.fn(),
    drawImage: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(16), width: 2, height: 2 })),
  };
}

function makeCanvas() {
  const ctx = makeCtx();
  const el = { width: 0, height: 0, getContext: vi.fn().mockReturnValue(ctx) } as unknown as HTMLCanvasElement;
  return { el, ctx };
}

beforeEach(() => { vi.clearAllMocks(); });

describe('CanvasPipeline', () => {
  describe('initial state', () => {
    it('starts in idle state', () => {
      const { el } = makeCanvas();
      const pipeline = new CanvasPipeline(undefined, () => null, el);
      expect(pipeline.getState()).toEqual({ status: 'idle', error: null });
    });
  });

  describe('loadImage', () => {
    it('sets state to loading and calls putImageData', () => {
      const { el, ctx } = makeCanvas();
      const onChange = vi.fn();
      const pipeline = new CanvasPipeline(onChange, () => null, el);
      pipeline.loadImage({ data: new Uint8ClampedArray(16), width: 2, height: 2 });
      expect(onChange).toHaveBeenCalledWith({ status: 'loading', error: null });
      expect(pipeline.getState().status).toBe('loading');
      expect(ctx.putImageData).toHaveBeenCalledTimes(1);
    });
  });

  describe('loadBitmap', () => {
    it('draws the bitmap and returns a RawImage', () => {
      const { el, ctx } = makeCanvas();
      const pipeline = new CanvasPipeline(undefined, () => null, el);
      const bitmap = { width: 4, height: 4 } as ImageBitmap;
      const result = pipeline.loadBitmap(bitmap);
      expect(ctx.drawImage).toHaveBeenCalledWith(bitmap, 0, 0);
      expect(result.width).toBe(2);
      expect(result.height).toBe(2);
      expect(pipeline.getState().status).toBe('loading');
    });
  });

  describe('applyFilterPipeline', () => {
    it('returns null when no filtered canvas is attached', () => {
      const { el } = makeCanvas();
      const pipeline = new CanvasPipeline(undefined, () => null, el);
      expect(pipeline.applyFilterPipeline([])).toBeNull();
    });

    it('sets state to ready and returns imageData when canvas is attached', () => {
      const { el } = makeCanvas();
      const { el: filteredEl, ctx: filteredCtx } = makeCanvas();
      const onChange = vi.fn();
      const pipeline = new CanvasPipeline(onChange, () => filteredEl, el);
      const result = pipeline.applyFilterPipeline([]);
      expect(result).toBeDefined();
      expect(filteredCtx.putImageData).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith({ status: 'ready', error: null });
    });
  });

  describe('runQuantization', () => {
    it('maps quantization results with findMixRecipe', () => {
      const { el } = makeCanvas();
      const pipeline = new CanvasPipeline(undefined, () => null, el);
      const imageData = { data: new Uint8ClampedArray(16), width: 2, height: 2 } as unknown as ImageData;
      const locked: Color[] = [];
      const results = pipeline.runQuantization(imageData, 3, locked);
      expect(results).toHaveLength(1);
      expect(results[0].hex).toBe('#ff0000');
      expect(results[0].mixRecipe).toBe('mock-recipe');
    });
  });

  describe('onStateChange callback', () => {
    it('is not called when no operations are performed', () => {
      const { el } = makeCanvas();
      const onChange = vi.fn();
      new CanvasPipeline(onChange, () => null, el);
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('getColorAt', () => {
    it('returns #000000 when no image has been loaded (canvas width = 0)', () => {
      const { el } = makeCanvas();
      const pipeline = new CanvasPipeline(undefined, () => null, el);
      expect(pipeline.getColorAt(1, 1, 5)).toBe('#000000');
    });

    it('returns hex from sampled pixels on the source canvas', () => {
      const { el, ctx } = makeCanvas();
      el.width = 10;
      el.height = 10;
      const pipeline = new CanvasPipeline(undefined, () => null, el);
      const result = pipeline.getColorAt(5, 5, 2);
      expect(ctx.getImageData).toHaveBeenCalledWith(0, 0, 10, 10);
      expect(result).toBe('#ff8000');
    });

    it('prefers the filtered canvas over the source canvas when present', () => {
      const { el: sourceEl } = makeCanvas();
      sourceEl.width = 10;
      sourceEl.height = 10;
      const { el: filteredEl, ctx: filteredCtx } = makeCanvas();
      filteredEl.width = 10;
      filteredEl.height = 10;
      const pipeline = new CanvasPipeline(undefined, () => filteredEl, sourceEl);
      pipeline.getColorAt(5, 5, 2);
      expect(filteredCtx.getImageData).toHaveBeenCalled();
    });
  });
});
