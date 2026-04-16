/**
 * {@link Tool} describes both {@link ImpastoToolsState.activeTool} and each entry in {@link ImpastoToolsState.allTools}.
 * Labels, param schemas, and materialization live on each {@link ImpastoTool}; this class only stores active id + opaque internal state per tool.
 */

import { getImpastoTool, impastoToolOrder } from './impastoToolRegistry';
import type { ImpastoToolUiConfig } from './toolConfigParams';

export type ImpastoToolId = 'pan' | 'sample-color' | 'marquee-select';

export type Tool = {
  readonly id: ImpastoToolId;
  readonly label: string;
  readonly config: ImpastoToolUiConfig;
};

export type ImpastoToolsState = {
  activeTool: Tool;
  readonly allTools: readonly Tool[];
};

export class ToolState {
  private readonly listeners = new Set<() => void>();
  private _activeTool: ImpastoToolId = 'pan';
  private _internals: Record<ImpastoToolId, unknown> = this.buildInitialInternals();
  private _snapshot: ImpastoToolsState = this.rebuildSnapshot();

  getState(): ImpastoToolsState {
    return this._snapshot;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  setActiveTool(tool: ImpastoToolId): void {
    if (this._activeTool === tool) {
      return;
    }
    this._activeTool = tool;
    this.commitSnapshot();
  }

  /**
   * Update a single parameter by key. Validation and storage are delegated to the tool’s {@link ImpastoTool.applyParam}.
   */
  setToolParamValue(tool: ImpastoToolId, paramKey: string, value: unknown): void {
    const inst = getImpastoTool(tool);
    const current = this._internals[tool];
    const result = inst.applyParam(current, paramKey, value);
    if (!result || !result.changed) {
      return;
    }
    this._internals = { ...this._internals, [tool]: result.next };
    this.commitSnapshot();
  }

  private buildInitialInternals(): Record<ImpastoToolId, unknown> {
    const acc = {} as Record<ImpastoToolId, unknown>;
    for (const id of impastoToolOrder) {
      acc[id] = getImpastoTool(id).getDefaultInternalState();
    }
    return acc;
  }

  private rebuildSnapshot(): ImpastoToolsState {
    const allTools = impastoToolOrder.map((id) => getImpastoTool(id).toToolSnapshot(this._internals[id]));
    const active = allTools.find((t) => t.id === this._activeTool);
    if (!active) {
      throw new Error('Impasto tools: active id missing from allTools');
    }
    return {
      activeTool: active,
      allTools,
    };
  }

  private commitSnapshot(): void {
    this._snapshot = this.rebuildSnapshot();
    this.emit();
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
