import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { Menu, Portal } from '@mantine/core';

export interface ContextMenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  color?: string;
  disabled?: boolean;
}

export interface ContextMenuDivider { type: 'divider' }
export interface ContextMenuLabel   { type: 'label'; label: string }

export type ContextMenuEntry = ContextMenuItem | ContextMenuDivider | ContextMenuLabel;

interface OpenMenuOptions {
  x: number;
  y: number;
  items: ContextMenuEntry[];
  width?: number;
}

interface ContextMenuContextValue {
  open:  (opts: OpenMenuOptions) => void;
  close: () => void;
}

const ContextMenuContext = createContext<ContextMenuContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useContextMenu(): ContextMenuContextValue {
  const ctx = useContext(ContextMenuContext);
  if (!ctx) throw new Error('useContextMenu must be used within ContextMenuProvider');
  return ctx;
}

function ContextMenuEntry({ entry, close }: { entry: ContextMenuEntry; close: () => void }) {
  if ('type' in entry) {
    if (entry.type === 'divider') return <Menu.Divider />;
    return <Menu.Label>{entry.label}</Menu.Label>;
  }
  return (
    <Menu.Item
      leftSection={entry.icon}
      color={entry.color}
      disabled={entry.disabled}
      onClick={() => { entry.onClick(); close(); }}
    >
      {entry.label}
    </Menu.Item>
  );
}

export function ContextMenuProvider({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState<OpenMenuOptions | null>(null);

  const open  = useCallback((opts: OpenMenuOptions) => setMenu(opts), []);
  const close = useCallback(() => setMenu(null), []);

  return (
    <ContextMenuContext.Provider value={{ open, close }}>
      {children}
      {menu && (
        <Portal>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 299 }}
            onMouseDown={close}
            onContextMenu={e => { e.preventDefault(); close(); }}
          />
          <Menu
            opened
            onClose={close}
            withinPortal={false}
            closeOnClickOutside={false}
            zIndex={300}
            width={menu.width ?? 210}
            shadow="md"
            position="bottom-start"
          >
            <Menu.Target>
              <div style={{ position: 'fixed', left: menu.x, top: menu.y, width: 0, height: 0 }} />
            </Menu.Target>
            <Menu.Dropdown style={{ background: 'var(--mantine-color-dark-7)', border: '1px solid var(--mantine-color-dark-4)' }}>
              {menu.items.map((entry, i) => (
                <ContextMenuEntry key={i} entry={entry} close={close} />
              ))}
            </Menu.Dropdown>
          </Menu>
        </Portal>
      )}
    </ContextMenuContext.Provider>
  );
}
