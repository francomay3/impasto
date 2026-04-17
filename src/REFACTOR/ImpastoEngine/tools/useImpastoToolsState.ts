import { useSyncExternalStore } from 'react';
import type { ImpastoToolsState } from './ToolState';
import { useImpastoEngine } from '../core/ImpastoEngineContext';

export function useImpastoToolsState(): ImpastoToolsState {
  const engine = useImpastoEngine();

  return useSyncExternalStore(
    (onStoreChange) => engine.tools.subscribe(onStoreChange),
    () => engine.tools.getState(),
  );
}
