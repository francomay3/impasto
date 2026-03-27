import { useCallback } from 'react';
import { useEditorContext } from '../context/EditorContext';
import { useSelectionPopover } from '../context/SelectionPopoverContext';

export function useSelectionContextMenu() {
  const { selectedColorIds } = useEditorContext();
  const { open } = useSelectionPopover();

  return useCallback((pos: { x: number; y: number }) => {
    if (selectedColorIds.size < 2) return;
    open(pos);
  }, [selectedColorIds.size, open]);
}
