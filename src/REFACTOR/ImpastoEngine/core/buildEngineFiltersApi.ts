/**
 * Engine `filters` public API plus silent filter snapshot application.
 *
 * Invariant: all user-driven chain replacements go through {@link ImpastoEngineFiltersApi.setFilters} so
 * `HistoryManager` observes durable filter edits. `applyEngineFilterSnapshot` skips history — used by
 * `loadDocument`, undo, and redo closures created here.
 */

import type { FilterInstance } from '../../../types';
import type { HistoryManager } from '../history/HistoryManager';
import type { ViewportPipeline } from '../pipeline/ViewportPipeline';
import { cloneFilterSnapshot, filterSnapshotsEqual } from './filterHistorySnapshot';
import type { ImpastoEngineFiltersApi } from './ImpastoEngineApi';

type BuildEngineFiltersApiDeps = {
  readonly ensureLive: () => void;
  readonly pipeline: ViewportPipeline;
  readonly history: HistoryManager;
};

export function buildEngineFiltersApi(deps: BuildEngineFiltersApiDeps): ImpastoEngineFiltersApi {
  const applySnapshot = (snap: readonly FilterInstance[]) => {
    deps.ensureLive();
    deps.pipeline.filters.setFilters(snap as FilterInstance[]);
  };

  const pushIfChanged = (before: readonly FilterInstance[], after: readonly FilterInstance[]) => {
    if (filterSnapshotsEqual(before, after)) {
      return;
    }
    const b = cloneFilterSnapshot(before);
    const a = cloneFilterSnapshot(after);
    deps.history.push({
      undo: () => applySnapshot(b),
      redo: () => applySnapshot(a),
    });
  };

  return {
    getFilters: () => deps.pipeline.filters.getFilters(),
    /**
     * Replaces the filter chain and records an undo step. Filter mutations must go through this API (not the
     * pipeline directly) so history — and later persistence — observes durable filter changes.
     */
    setFilters: (filters) => {
      deps.ensureLive();
      const before = cloneFilterSnapshot(deps.pipeline.filters.getFilters());
      deps.pipeline.filters.setFilters(filters);
      const after = cloneFilterSnapshot(deps.pipeline.filters.getFilters());
      pushIfChanged(before, after);
    },
    subscribe: (listener) => deps.pipeline.filters.subscribe(listener),
  };
}

/** Applies filters without a history entry (undo/redo and `loadDocument`). */
export function applyEngineFilterSnapshot(
  deps: Pick<BuildEngineFiltersApiDeps, 'ensureLive' | 'pipeline'>,
  snap: readonly FilterInstance[],
): void {
  deps.ensureLive();
  deps.pipeline.filters.setFilters(snap as FilterInstance[]);
}
