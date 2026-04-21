import { describe, expect, it } from 'vitest';
import type { ImpastoToolsState, ImpastoToolId } from '../../../tools/ToolState';
import { viewportCanvasPointerUi } from './viewportCanvasPointerUi';

function mockTools(activeId: ImpastoToolId): ImpastoToolsState {
  const panTool = { id: 'pan' as const, label: 'Pan', config: { params: [] as const } };
  const sampleTool = {
    id: 'sample-color' as const,
    label: 'Sample',
    config: { params: [] as const },
  };
  const marqueeTool = {
    id: 'marquee-select' as const,
    label: 'Marquee',
    config: { params: [] as const },
  };
  const allTools = [panTool, sampleTool, marqueeTool] as ImpastoToolsState['allTools'];
  const activeTool =
    activeId === 'pan' ? panTool : activeId === 'sample-color' ? sampleTool : marqueeTool;
  return { activeTool, allTools };
}

describe('viewportCanvasPointerUi', () => {
  it('sample hover on filtered: none + ring', () => {
    const t = mockTools('sample-color');
    expect(
      viewportCanvasPointerUi({
        surface: 'filtered',
        toolId: t.activeTool.id,
        pointerInside: true,
        panDrag: null,
      })
    ).toEqual({ cursor: 'none', sampleRingActive: true });
  });

  it('sample while pan dragging on filtered: hand cursor, no ring (Photoshop-style)', () => {
    const t = mockTools('sample-color');
    expect(
      viewportCanvasPointerUi({
        surface: 'filtered',
        toolId: t.activeTool.id,
        pointerInside: true,
        panDrag: { pointerButton: 1 },
      })
    ).toEqual({ cursor: 'grabbing', sampleRingActive: false });
  });

  it('sample while pan dragging on indexed: hand cursor, no ring', () => {
    const t = mockTools('sample-color');
    expect(
      viewportCanvasPointerUi({
        surface: 'indexed',
        toolId: t.activeTool.id,
        pointerInside: true,
        panDrag: { pointerButton: 1 },
      })
    ).toEqual({ cursor: 'grabbing', sampleRingActive: false });
  });

  it('pan tool while drag: grabbing, no ring', () => {
    const t = mockTools('pan');
    expect(
      viewportCanvasPointerUi({
        surface: 'filtered',
        toolId: t.activeTool.id,
        pointerInside: true,
        panDrag: { pointerButton: 0 },
      })
    ).toEqual({ cursor: 'grabbing', sampleRingActive: false });
  });

  it('pan tool idle hover: grab', () => {
    const t = mockTools('pan');
    expect(
      viewportCanvasPointerUi({
        surface: 'filtered',
        toolId: t.activeTool.id,
        pointerInside: true,
        panDrag: null,
      })
    ).toEqual({ cursor: 'grab', sampleRingActive: false });
  });

  it('marquee hover on filtered: crosshair', () => {
    const t = mockTools('marquee-select');
    expect(
      viewportCanvasPointerUi({
        surface: 'filtered',
        toolId: t.activeTool.id,
        pointerInside: true,
        panDrag: null,
      })
    ).toEqual({ cursor: 'crosshair', sampleRingActive: false });
  });

  it('marquee on source: default cursor (no marquee surface)', () => {
    const t = mockTools('marquee-select');
    expect(
      viewportCanvasPointerUi({
        surface: 'source',
        toolId: t.activeTool.id,
        pointerInside: true,
        panDrag: null,
      })
    ).toEqual({ cursor: 'default', sampleRingActive: false });
  });

  it('marquee while pan dragging: grabbing hand, not crosshair', () => {
    const t = mockTools('marquee-select');
    expect(
      viewportCanvasPointerUi({
        surface: 'filtered',
        toolId: t.activeTool.id,
        pointerInside: true,
        panDrag: { pointerButton: 1 },
      })
    ).toEqual({ cursor: 'grabbing', sampleRingActive: false });
  });
});
