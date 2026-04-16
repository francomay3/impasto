import { describe, expect, it } from 'vitest';
import type { ToolConfigParam } from '../tools/toolConfigParams';
import { ToolState } from '../tools/ToolState';
import { nudgeSampleColorBrushByHotkey } from './engineHotkeyActions';

function findBrushSizeParam(
  params: readonly ToolConfigParam[]
): Extract<ToolConfigParam, { kind: 'number' }> | undefined {
  const p = params.find((x) => x.kind === 'number' && x.key === 'brushSize');
  return p?.kind === 'number' ? p : undefined;
}

describe('nudgeSampleColorBrushByHotkey', () => {
  it('no-ops when sample-color is not active', () => {
    const toolState = new ToolState();
    nudgeSampleColorBrushByHotkey(toolState, 1);
    expect(toolState.getState().activeTool.id).toBe('pan');
  });

  it('adjusts brush size when sample-color is active', () => {
    const toolState = new ToolState();
    toolState.setActiveTool('sample-color');
    const before = findBrushSizeParam(toolState.getState().activeTool.config.params);
    expect(before).toBeDefined();
    const start = before!.value;
    nudgeSampleColorBrushByHotkey(toolState, 2);
    const after = findBrushSizeParam(toolState.getState().activeTool.config.params);
    expect(after).toBeDefined();
    expect(after!.value).toBe(start + 2 * before!.step);
  });
});
