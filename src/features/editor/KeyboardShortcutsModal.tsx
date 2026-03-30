import { Modal, Table, Kbd, Text, Group } from '@mantine/core';

interface ShortcutRow {
  action: string;
  keys: string[][];
}

const SHORTCUTS: ShortcutRow[] = [
  { action: 'Save', keys: [['⌘', 'S']] },
  { action: 'Undo', keys: [['⌘', 'Z']] },
  {
    action: 'Redo',
    keys: [
      ['⌘', '⇧', 'Z'],
      ['⌘', 'Y'],
    ],
  },
  { action: 'Add Filter', keys: [['⌘', 'F']] },
  { action: 'Add Color to Palette', keys: [['C']] },
  { action: 'Keyboard Shortcuts', keys: [['?']] },
  { action: 'Cancel / Close', keys: [['Esc']] },
];

function KeyCombo({ keys }: { keys: string[] }) {
  return (
    <Group gap={4} wrap="nowrap">
      {keys.map((k, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Kbd size="xs">{k}</Kbd>
          {i < keys.length - 1 && (
            <Text size="xs" c="dimmed">
              +
            </Text>
          )}
        </span>
      ))}
    </Group>
  );
}

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ opened, onClose }: Props) {
  return (
    <Modal opened={opened} onClose={onClose} title="Keyboard Shortcuts" size="sm">
      <Table>
        <Table.Tbody>
          {SHORTCUTS.map(({ action, keys }) => (
            <Table.Tr key={action}>
              <Table.Td>
                <Text size="sm">{action}</Text>
              </Table.Td>
              <Table.Td>
                <Group gap="xs" justify="flex-end" wrap="nowrap">
                  {keys.map((combo, i) => (
                    <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <KeyCombo keys={combo} />
                      {i < keys.length - 1 && (
                        <Text size="xs" c="dimmed">
                          /
                        </Text>
                      )}
                    </span>
                  ))}
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Modal>
  );
}
