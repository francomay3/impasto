import type { ToolState } from '../tools/ToolState';

export function nudgeSampleColorBrushByHotkey(toolState: ToolState, deltaSteps: number): void {
  const snap = toolState.getState();
  if (snap.activeTool.id !== 'sample-color') {
    return;
  }
  const p = snap.activeTool.config.params.find(
    (x) => x.kind === 'number' && x.key === 'brushSize',
  );
  if (!p || p.kind !== 'number') {
    return;
  }
  toolState.setToolParamValue('sample-color', 'brushSize', p.value + deltaSteps * p.step);
}
