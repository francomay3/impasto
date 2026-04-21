import type { ImpastoToolId } from './ToolState';
import type { ImpastoTool } from './ImpastoTool';
import { PanTool } from './PanTool';
import { SampleColorTool } from './SampleColorTool';
import { MarqueeTool } from './MarqueeTool';

/** Single source of truth for registration order (toolbar / snapshots). */
const instances = [new PanTool(), new SampleColorTool(), new MarqueeTool()] as const;

export const impastoToolOrder: readonly ImpastoToolId[] = instances.map((t) => t.id);

const byId = new Map<ImpastoToolId, ImpastoTool>(instances.map((t) => [t.id, t]));

export function getImpastoTool(id: ImpastoToolId): ImpastoTool {
  const t = byId.get(id);
  if (!t) {
    throw new Error(`Impasto: unknown tool id ${String(id)}`);
  }
  return t;
}

// function allImpastoTools(): readonly ImpastoTool[] {
//   return instances;
// } we could add this to get all tools, for example to construct the toolbar
