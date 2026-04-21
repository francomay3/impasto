import { useCallback } from 'react';
import type { ContextMenuEntry } from '../../shared/contextMenuStore';
import { useContextMenuStore } from '../../shared/contextMenuStore';
import { useImpastoEngine } from '../core/ImpastoEngineContext';
import { useImpastoSelection } from '../hooks/useImpastoSelection';

/**
 * Opens the app-wide context menu for engine-backed palette pins (viewport overlay + sidebar cards).
 * Multi-pin operations use the current engine selection when it includes the invoked pin; otherwise only that pin.
 */
export function useEngineColorPinContextMenu(): (pinId: string, clientX: number, clientY: number) => void {
  const engine = useImpastoEngine();
  const selection = useImpastoSelection();
  const openMenu = useContextMenuStore((s) => s.open);

  return useCallback(
    (pinId, clientX, clientY) => {
      const selPins = selection.filter((e) => e.kind === 'colorPin').map((e) => e.id);
      const targets = selPins.length > 1 && selPins.includes(pinId) ? selPins : [pinId];

      const items: ContextMenuEntry[] = [];

      if (targets.length === 1) {
        items.push({
          label: 'Delete pin',
          onClick: () => {
            engine.colorPins.remove(targets[0]!);
          },
        });
      } else {
        items.push({
          label: `Delete ${targets.length} pins`,
          onClick: () => {
            engine.colorPins.removeMany(targets);
          },
        });
        items.push({ type: 'divider' });
        items.push({
          label: 'Merge pins',
          onClick: () => {
            engine.colorPins.mergePinsFromIds(targets);
          },
        });
        items.push({
          label: 'Add middle (keep originals)',
          onClick: () => {
            engine.colorPins.addMiddlePinFromIds(targets);
          },
        });
      }

      openMenu({ x: clientX, y: clientY, items });
    },
    [engine, selection, openMenu],
  );
}
