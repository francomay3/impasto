import { useSyncExternalStore } from 'react';
import { useImpastoEngine } from '../core/ImpastoEngineContext';
import type { ViewportTransform } from '../viewport/models';

function transformKey(t: ViewportTransform): string {
  return `${t.x},${t.y},${t.z}`;
}

/**
 * Subscribes to pan/zoom commits on the engine so React re-renders when {@link ViewportPhysics} changes.
 * (Canvas repaints via {@link Viewport.notifyTransformChange}; this hook mirrors that for UI.)
 */
export function useImpastoViewportTransform(): ViewportTransform {
  const engine = useImpastoEngine();
  useSyncExternalStore(
    (onStoreChange) => engine.viewport.subscribeTransform(onStoreChange),
    () => transformKey(engine.viewport.physics.transform),
    () => '0,0,1',
  );
  return engine.viewport.physics.transform;
}
