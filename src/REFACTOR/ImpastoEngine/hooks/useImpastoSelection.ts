import { useSyncExternalStore } from 'react';
import { useImpastoEngine } from '../core/ImpastoEngineContext';
import type { SelectionEntry } from '../selection/SelectionState';

export function useImpastoSelection(): readonly SelectionEntry[] {
  const engine = useImpastoEngine();
  return useSyncExternalStore(
    (onStoreChange) => engine.selection.subscribe(onStoreChange),
    () => engine.selection.getAll(),
    () => engine.selection.getAll(),
  );
}
