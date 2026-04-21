import { useSyncExternalStore } from 'react';
import { useImpastoEngine } from '../core/ImpastoEngineContext';
import type { ViewportTransform } from '../viewport/models';

/**
 * Subscribes to pan/zoom commits on the engine so React re-renders when {@link ViewportPhysics} changes.
 * (Canvas repaints via {@link Viewport.notifyTransformChange}; this hook mirrors that for UI.)
 *
 * Works correctly because {@link ViewportPhysics.transform} returns a stable reference —
 * only replaced when {@link ViewportPhysics.setTransform} is called.
 */
export function useImpastoViewportTransform(): ViewportTransform {
  const engine = useImpastoEngine();
  return useSyncExternalStore(
    (onStoreChange) => engine.viewport.subscribeTransform(onStoreChange),
    () => engine.viewport.physics.transform,
  );
}
