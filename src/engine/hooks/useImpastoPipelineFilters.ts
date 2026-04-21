import { useSyncExternalStore } from 'react';
import type { FilterInstance } from '../../types';
import { useImpastoEngine } from '../core/ImpastoEngineContext';

/** Canonical filter chain from {@link ImpastoEngine.filters}. */
export function useImpastoPipelineFilters(): FilterInstance[] {
  const engine = useImpastoEngine();
  const { filters } = engine;

  return useSyncExternalStore(
    (onStoreChange) => filters.subscribe(onStoreChange),
    () => filters.getFilters()
  );
}
