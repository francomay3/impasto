import { useCallback } from 'react';
import { useEditorContext } from '../editor/EditorContext';
import { useSelectionPopover } from './SelectionPopoverContext';

export function useSelectionContextMenu() {
  const { selectedColorIds } = useEditorContext();
  const { open } = useSelectionPopover();

  return useCallback(
    (pos: { x: number; y: number }) => {
      if (selectedColorIds.size < 2) return;
      open(pos);
    },
    [selectedColorIds.size, open]
  );
}
