import { useMemo } from 'react';
import { useImpastoEngine } from '../core/ImpastoEngineContext';

/**
 * UI-facing mutations for palette pins. Menus and buttons call these; the engine owns state.
 */
export function useImpastoColorPinActions(): {
  removePin: (id: string) => void;
  removePins: (ids: readonly string[]) => void;
  clearPins: () => void;
  reorderPinsTo: (orderedIds: readonly string[]) => void;
} {
  const engine = useImpastoEngine();
  return useMemo(
    () => ({
      removePin: (id: string) => {
        engine.colorPins.remove(id);
      },
      removePins: (ids: readonly string[]) => {
        engine.colorPins.removeMany(ids);
      },
      clearPins: () => {
        engine.colorPins.clear();
      },
      reorderPinsTo: (orderedIds: readonly string[]) => {
        engine.colorPins.reorderTo(orderedIds);
      },
    }),
    [engine],
  );
}
