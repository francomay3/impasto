import { Portal } from '@mantine/core';
import { useSelectionPopoverStore } from './selectionPopoverStore';
import { SelectionGroupDialog } from './SelectionGroupDialog';

export function SelectionPopoverPortal() {
  const pos = useSelectionPopoverStore(s => s.pos);
  const close = useSelectionPopoverStore(s => s.close);

  if (!pos) return null;

  return (
    <Portal>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 299 }}
        onMouseDown={close}
        onContextMenu={(e) => { e.preventDefault(); close(); }}
      />
      <SelectionGroupDialog pos={pos} close={close} />
    </Portal>
  );
}
