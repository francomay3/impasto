import { useCallback } from 'react';
import { useEditorStore } from '../editor/editorStore';
import { useSelectionPopoverStore } from './selectionPopoverStore';

export function useSelectionContextMenu() {
  const selectedSize = useEditorStore(s => s.selectedColorIds.size);
  const open = useSelectionPopoverStore(s => s.open);

  return useCallback(
    (pos: { x: number; y: number }) => {
      if (selectedSize < 2) return;
      open(pos);
    },
    [selectedSize, open]
  );
}
