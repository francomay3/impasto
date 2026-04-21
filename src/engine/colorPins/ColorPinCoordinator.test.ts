/**
 * Behaviour tests for {@link ColorPinCoordinator}: history integration, drag commit vs abort, and placement clamping
 * delegated from {@link buildColorPinPlacementApi}.
 */

import { describe, expect, it, vi } from 'vitest';
import { clampImagePointInsideRaster } from '../infra/imageRect';
import { HistoryManager } from '../history/HistoryManager';
import type { ImpastoEngineColorPinPlacementExtents } from '../core/ImpastoEngineApi';
import { ColorPinCoordinator } from './ColorPinCoordinator';
import { ColorPinPointerDragSession } from './ColorPinPointerDragSession';
import { ColorPinState } from './ColorPinState';

const extent100: ImpastoEngineColorPinPlacementExtents = { width: 100, height: 100 };

function createCoordinator(opts?: {
  readonly getPlacementExtents?: () => ImpastoEngineColorPinPlacementExtents | null;
}) {
  const colorPins = new ColorPinState();
  const dragSession = new ColorPinPointerDragSession();
  const history = new HistoryManager();
  const getPlacementExtents = opts?.getPlacementExtents ?? (() => extent100);
  const coordinator = new ColorPinCoordinator(
    colorPins,
    dragSession,
    history,
    vi.fn(),
    vi.fn(),
    getPlacementExtents,
    () => null,
    () => {},
  );
  return { coordinator, colorPins, dragSession, history, api: coordinator.buildApi() };
}

describe('ColorPinCoordinator', () => {
  it('add creates a history entry and canUndo is true', () => {
    const { history, api } = createCoordinator();
    expect(history.canUndo()).toBe(false);
    api.add({ imageX: 5, imageY: 5, radiusPx: 2 });
    expect(history.canUndo()).toBe(true);
    expect(api.getAll()).toHaveLength(1);
  });

  it('undoing add restores the empty pin list', () => {
    const { history, api } = createCoordinator();
    api.add({ imageX: 5, imageY: 5, radiusPx: 2 });
    expect(api.getAll()).toHaveLength(1);
    history.back();
    expect(api.getAll()).toHaveLength(0);
    expect(history.canUndo()).toBe(false);
  });

  it('commitDrag after repositioning beyond epsilon pushes one history entry', () => {
    const { coordinator, colorPins, history, api } = createCoordinator();
    const id = colorPins.addFromSample({ imageX: 10, imageY: 10, radiusPx: 2 }, '#112233');
    expect(history.canUndo()).toBe(false);

    api.beginPointerDrag([id]);
    api.repositionMany([{ id, imageX: 20, imageY: 10 }]);

    coordinator.commitDrag();

    expect(history.canUndo()).toBe(true);
    history.back();
    const pins = api.getAll();
    expect(pins).toHaveLength(1);
    expect(pins[0]!.imageX).toBe(10);
    expect(pins[0]!.imageY).toBe(10);
  });

  it('abortDrag restores drag-start positions without a history entry', () => {
    const { coordinator, colorPins, history, api } = createCoordinator();
    const id = colorPins.addFromSample({ imageX: 10, imageY: 10, radiusPx: 2 }, '#112233');

    api.beginPointerDrag([id]);
    api.repositionMany([{ id, imageX: 50, imageY: 50 }]);

    expect(api.getAll()[0]!.imageX).toBe(50);
    expect(history.canUndo()).toBe(false);

    coordinator.abortDrag();

    expect(history.canUndo()).toBe(false);
    expect(api.getAll()[0]!.imageX).toBe(10);
    expect(api.getAll()[0]!.imageY).toBe(10);
  });

  it('repositionMany clamps out-of-bounds coordinates to raster extents from getPlacementExtents', () => {
    const extent50: ImpastoEngineColorPinPlacementExtents = { width: 50, height: 50 };
    const { colorPins, api } = createCoordinator({
      getPlacementExtents: () => extent50,
    });
    const id = colorPins.addFromSample({ imageX: 10, imageY: 10, radiusPx: 2 }, '#112233');

    api.repositionMany([{ id, imageX: 9999, imageY: 9999 }]);

    const p = api.getAll()[0]!;
    const expected = clampImagePointInsideRaster(9999, 9999, 50, 50);
    expect(p.imageX).toBe(expected.x);
    expect(p.imageY).toBe(expected.y);
  });
});
