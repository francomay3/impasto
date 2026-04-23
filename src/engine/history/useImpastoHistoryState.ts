import { useSyncExternalStore } from 'react';
import type { HistoryManager } from './HistoryManager';
import { readHistoryCapabilities, type HistoryCapabilities } from './historyCapabilitiesSnapshot';

/** Undo/redo availability for menus and chrome; mirrors `HistoryManager.subscribe` + `canUndo` / `canRedo`. */
export function useImpastoHistoryState(history: HistoryManager): HistoryCapabilities {
  return useSyncExternalStore(
    (onStoreChange) => history.subscribe(onStoreChange),
    () => readHistoryCapabilities(history),
    () => readHistoryCapabilities(history),
  );
}
