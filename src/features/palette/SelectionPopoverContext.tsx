import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { Portal } from '@mantine/core';
import { SelectionGroupDialog } from './SelectionGroupDialog';

interface PopoverPos {
  x: number;
  y: number;
}

interface SelectionPopoverContextValue {
  open: (pos: PopoverPos) => void;
  close: () => void;
}

const Ctx = createContext<SelectionPopoverContextValue | null>(null);

export function useSelectionPopover() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSelectionPopover must be used within SelectionPopoverProvider');
  return ctx;
}

export function SelectionPopoverProvider({ children }: { children: ReactNode }) {
  const [pos, setPos] = useState<PopoverPos | null>(null);
  const open = useCallback((p: PopoverPos) => setPos(p), []);
  const close = useCallback(() => setPos(null), []);

  return (
    <Ctx.Provider value={{ open, close }}>
      {children}
      {pos && (
        <Portal>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 299 }}
            onMouseDown={close}
            onContextMenu={(e) => { e.preventDefault(); close(); }}
          />
          <SelectionGroupDialog pos={pos} close={close} />
        </Portal>
      )}
    </Ctx.Provider>
  );
}
