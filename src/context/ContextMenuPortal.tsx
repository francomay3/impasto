import { Menu, Portal } from '@mantine/core';
import { useContextMenuStore } from './contextMenuStore';
import type { ContextMenuEntry } from './contextMenuStore';

function ContextMenuEntryItem({ entry, close }: { entry: ContextMenuEntry; close: () => void }) {
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

export function ContextMenuPortal() {
  const menu = useContextMenuStore(s => s.menu);
  const close = useContextMenuStore(s => s.close);

  if (!menu) return null;

  return (
    <Portal>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 299 }}
        onMouseDown={close}
        onContextMenu={(e) => { e.preventDefault(); close(); }}
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
            <ContextMenuEntryItem key={i} entry={entry} close={close} />
          ))}
        </Menu.Dropdown>
      </Menu>
    </Portal>
  );
}
