import { useSyncExternalStore } from 'react';
import type { ViewportPipelineState } from '../pipeline/ViewportPipeline';
import { useImpastoEngine } from '../core/ImpastoEngineContext';

export function useImpastoViewportPipelineState(): ViewportPipelineState {
  const engine = useImpastoEngine();

  return useSyncExternalStore(
    (onStoreChange) => engine.pipeline.subscribe(() => onStoreChange()),
    () => engine.pipeline.getState()
  );
}
