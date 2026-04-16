import { describe, expect, it } from 'vitest';
import type { ImpastoToolsState } from '../../../tools/ToolState';
import {
  allowsMarqueeSelect,
  allowsMiddleButtonDragPan,
  allowsPrimaryClickColorSample,
  allowsPrimaryDragPan,
  allowsWheelZoom,
  brushRadiusFromToolsState,
  effectivePrimaryDragPan,
  effectiveWheelZoom,
} from './viewportInputPolicy';

function mockTools(activeId: ImpastoToolsState['activeTool']['id']): ImpastoToolsState {
  const panTool = { id: 'pan' as const, label: 'Pan', config: { params: [] as const } };
  const sampleTool = {
    id: 'sample-color' as const,
    label: 'Sample',
    config: {
      params: [
        {
          kind: 'number' as const,
          key: 'brushSize',
          label: 'Brush',
          value: 7,
          min: 1,
          max: 30,
          step: 1,
          unit: 'px',
        },
      ],
    },
  };
  const marqueeTool = {
    id: 'marquee-select' as const,
    label: 'Marquee',
    config: {
      params: [
        {
          kind: 'choice' as const,
          key: 'marqueeMode',
          label: 'Mode',
          value: 'replace',
          options: [
            { value: 'replace', label: 'Replace' },
            { value: 'add', label: 'Add' },
            { value: 'subtract', label: 'Subtract' },
          ],
        },
      ],
    },
  };
  const allTools = [panTool, sampleTool, marqueeTool] as ImpastoToolsState['allTools'];
  const activeTool =
    activeId === 'pan' ? panTool : activeId === 'sample-color' ? sampleTool : marqueeTool;
  return { activeTool, allTools };
}

describe('viewportInputPolicy', () => {
  it('pan tool allows drag pan and wheel on filtered', () => {
    const t = mockTools('pan');
    expect(allowsPrimaryDragPan('filtered', t.activeTool.id)).toBe(true);
    expect(allowsWheelZoom('filtered', t.activeTool.id)).toBe(true);
    expect(allowsPrimaryClickColorSample('filtered', t.activeTool.id)).toBe(false);
  });

  it('sample-color allows click sample on filtered and indexed', () => {
    const t = mockTools('sample-color');
    expect(allowsPrimaryClickColorSample('filtered', t.activeTool.id)).toBe(true);
    expect(allowsPrimaryClickColorSample('indexed', t.activeTool.id)).toBe(true);
    expect(allowsPrimaryClickColorSample('source', t.activeTool.id)).toBe(false);
  });

  it('sample-color on filtered: wheel zoom on, drag-pan off (primary action is click sample)', () => {
    const t = mockTools('sample-color');
    expect(allowsPrimaryDragPan('filtered', t.activeTool.id)).toBe(false);
    expect(allowsWheelZoom('filtered', t.activeTool.id)).toBe(true);
    expect(effectivePrimaryDragPan('filtered', t.activeTool.id)).toBe(false);
    expect(effectiveWheelZoom('filtered', t.activeTool.id)).toBe(true);
  });

  it('sample-color on indexed: same navigation as filtered (click adds pin; primary drag is not pan)', () => {
    const t = mockTools('sample-color');
    expect(effectivePrimaryDragPan('indexed', t.activeTool.id)).toBe(false);
    expect(effectiveWheelZoom('indexed', t.activeTool.id)).toBe(true);
  });

  it('sample-color on source: pan/zoom when sampling is unavailable on that surface', () => {
    const t = mockTools('sample-color');
    expect(effectivePrimaryDragPan('source', t.activeTool.id)).toBe(true);
    expect(effectiveWheelZoom('source', t.activeTool.id)).toBe(true);
  });

  it('brushRadiusFromToolsState reads brushSize param', () => {
    expect(brushRadiusFromToolsState(mockTools('sample-color'))).toBe(7);
    expect(brushRadiusFromToolsState(mockTools('pan'))).toBe(1);
  });

  it('middle-button pan allowed on every pan/zoom surface', () => {
    for (const surface of ['source', 'filtered', 'indexed'] as const) {
      expect(allowsMiddleButtonDragPan(surface)).toBe(true);
    }
  });

  it('marquee-select only on filtered and indexed', () => {
    const t = mockTools('marquee-select');
    expect(allowsMarqueeSelect('filtered', t.activeTool.id)).toBe(true);
    expect(allowsMarqueeSelect('indexed', t.activeTool.id)).toBe(true);
    expect(allowsMarqueeSelect('source', t.activeTool.id)).toBe(false);
  });

  it('marquee-select disallows primary drag pan on filtered', () => {
    const t = mockTools('marquee-select');
    expect(allowsPrimaryDragPan('filtered', t.activeTool.id)).toBe(false);
    expect(effectivePrimaryDragPan('filtered', t.activeTool.id)).toBe(false);
  });

  it('allowsMarqueeSelect is false for non-marquee tools', () => {
    const t = mockTools('pan');
    expect(allowsMarqueeSelect('filtered', t.activeTool.id)).toBe(false);
  });
});
