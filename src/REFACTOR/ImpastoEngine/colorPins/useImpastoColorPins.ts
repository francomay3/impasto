import { useSyncExternalStore } from 'react';
import { useImpastoEngine } from '../core/ImpastoEngineContext';
import type { ColorPin } from './ColorPinState';

export function useImpastoColorPins(): readonly ColorPin[] {
  const engine = useImpastoEngine();

  return useSyncExternalStore(
    (onStoreChange) => engine.colorPins.subscribe(onStoreChange),
    () => engine.colorPins.getAll(),
    () => engine.colorPins.getAll(),
  );
}
