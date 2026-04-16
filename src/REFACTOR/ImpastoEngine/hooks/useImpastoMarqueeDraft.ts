import { useSyncExternalStore } from 'react';
import { useImpastoEngine } from '../core/ImpastoEngineContext';
import type { MarqueeDraft } from '../selection/MarqueeGestureState';

export function useImpastoMarqueeDraft(): MarqueeDraft | null {
  const engine = useImpastoEngine();
  return useSyncExternalStore(
    (onStoreChange) => engine.marquee.subscribe(onStoreChange),
    () => engine.marquee.getDraft(),
    () => engine.marquee.getDraft(),
  );
}
