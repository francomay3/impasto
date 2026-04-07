import { describe, it, expect, vi } from 'vitest';
import { CanvasEngine } from './CanvasEngine';
import type { CropRect } from '../../../types';

vi.mock('../../editor/editorStore', () => ({
  useEditorStore: {
    getState: vi.fn(() => ({ hiddenPinIds: new Set(), selectedColorIds: new Set(), setSelectedColorIds: vi.fn(), setActivePaletteTool: vi.fn() })),
  },
}));

const crop: CropRect = { x: 0.1, y: 0.2, width: 0.8, height: 0.6 };

describe('CanvasEngine transforms', () => {
  describe('initial state', () => {
    it('starts with null cropRect and 0 rotation', () => {
      const engine = new CanvasEngine();
      expect(engine.getTransforms()).toEqual({ cropRect: null, rotation: 0 });
    });
  });

  describe('applyCrop', () => {
    it('sets cropRect', () => {
      const engine = new CanvasEngine();
      engine.applyCrop(crop);
      expect(engine.getTransforms().cropRect).toEqual(crop);
    });

    it('does not clear rotation', () => {
      const engine = new CanvasEngine();
      engine.applyRotation(45);
      engine.applyCrop(crop);
      expect(engine.getTransforms().rotation).toBe(45);
    });

    it('notifies subscribers', () => {
      const engine = new CanvasEngine();
      const listener = vi.fn();
      engine.subscribe(listener);
      engine.applyCrop(crop);
      expect(listener).toHaveBeenCalledOnce();
    });
  });

  describe('applyRotation', () => {
    it('sets rotation angle', () => {
      const engine = new CanvasEngine();
      engine.applyRotation(90);
      expect(engine.getTransforms().rotation).toBe(90);
    });

    it('does not clear cropRect', () => {
      const engine = new CanvasEngine();
      engine.applyCrop(crop);
      engine.applyRotation(30);
      expect(engine.getTransforms().cropRect).toEqual(crop);
    });

    it('notifies subscribers', () => {
      const engine = new CanvasEngine();
      const listener = vi.fn();
      engine.subscribe(listener);
      engine.applyRotation(15);
      expect(listener).toHaveBeenCalledOnce();
    });

    it('accepts negative angles', () => {
      const engine = new CanvasEngine();
      engine.applyRotation(-45);
      expect(engine.getTransforms().rotation).toBe(-45);
    });
  });

  describe('resetTransforms', () => {
    it('clears cropRect and rotation', () => {
      const engine = new CanvasEngine();
      engine.applyCrop(crop);
      engine.applyRotation(90);
      engine.resetTransforms();
      expect(engine.getTransforms()).toEqual({ cropRect: null, rotation: 0 });
    });

    it('notifies subscribers', () => {
      const engine = new CanvasEngine();
      const listener = vi.fn();
      engine.subscribe(listener);
      engine.resetTransforms();
      expect(listener).toHaveBeenCalledOnce();
    });
  });
});
