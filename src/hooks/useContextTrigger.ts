import { useCallback } from 'react';
import { useLongPress } from './useLongPress';

type Pos = { x: number; y: number };

/**
 * Combines right-click (onContextMenu) and touch long-press into one handler.
 * Spread the returned props onto any element to make it context-menu-aware.
 */
export function useContextTrigger(handler: (pos: Pos) => void) {
  const onContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handler({ x: e.clientX, y: e.clientY });
    },
    [handler]
  );

  const longPressProps = useLongPress(
    useCallback(
      (e: React.PointerEvent) => {
        e.preventDefault();
        handler({ x: e.clientX, y: e.clientY });
      },
      [handler]
    )
  );

  return { onContextMenu, ...longPressProps };
}
