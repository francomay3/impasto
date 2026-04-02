import { Fragment } from 'react';
import { Modal, Table, Kbd, Text, Group } from '@mantine/core';
import { HOTKEYS, HOTKEY_META, hotkeyParts, type ShortcutContext } from '../../hotkeys';

const CONTEXT_ORDER: ShortcutContext[] = ['Global', 'Palette', 'Filters'];

function buildSections() {
  const sections = new Map<ShortcutContext, { action: string; keys: string[][] }[]>(
    CONTEXT_ORDER.map((ctx) => [ctx, []])
  );

  for (const [key, meta] of Object.entries(HOTKEY_META) as [keyof typeof HOTKEYS, typeof HOTKEY_META[keyof typeof HOTKEYS]][]) {
    if (meta.aliasOf) continue;
    const aliasKeys = (Object.entries(HOTKEY_META) as [keyof typeof HOTKEYS, typeof HOTKEY_META[keyof typeof HOTKEYS]][])
      .filter(([, m]) => m.aliasOf === key)
      .map(([k]) => hotkeyParts(HOTKEYS[k]));
    const allKeys = [hotkeyParts(HOTKEYS[key]), ...aliasKeys];
    sections.get(meta.context)!.push({ action: meta.action, keys: allKeys });
  }

  return [...sections.entries()].filter(([, rows]) => rows.length > 0);
}

const SECTIONS = buildSections();

function KeyCombo({ keys }: { keys: string[] }) {
  return (
    <Group gap={4} wrap="nowrap">
      {keys.map((k, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Kbd size="xs">{k}</Kbd>
          {i < keys.length - 1 && <Text size="xs" c="dimmed">+</Text>}
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
          {SECTIONS.map(([context, rows]) => (
            <Fragment key={context}>
              <Table.Tr>
                <Table.Th
                  colSpan={2}
                  style={{ paddingTop: 16, paddingBottom: 4, borderBottom: 'none' }}
                >
                  <Text size="xs" fw={600} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.06em' }}>
                    {context}
                  </Text>
                </Table.Th>
              </Table.Tr>
              {rows.map(({ action, keys }) => (
                <Table.Tr key={action}>
                  <Table.Td><Text size="sm">{action}</Text></Table.Td>
                  <Table.Td>
                    <Group gap="xs" justify="flex-end" wrap="nowrap">
                      {keys.map((combo, i) => (
                        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <KeyCombo keys={combo} />
                          {i < keys.length - 1 && <Text size="xs" c="dimmed">/</Text>}
                        </span>
                      ))}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Fragment>
          ))}
        </Table.Tbody>
      </Table>
    </Modal>
  );
}
