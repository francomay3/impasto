import { Fragment } from 'react';
import { Group, Kbd, Modal, Stack, Text } from '@mantine/core';
import { hotkeyLabel } from '../../hotkeys';
import { buildShortcutRows } from './keyboardShortcutsRows';

export interface KeyboardShortcutsModalProps {
  opened: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ opened, onClose }: KeyboardShortcutsModalProps) {
  const groups = buildShortcutRows();
  return (
    <Modal opened={opened} onClose={onClose} title="Keyboard Shortcuts" size="md">
      <Stack gap="lg" mt="xs">
        {groups.map((g) => (
          <Stack key={g.context} gap="sm">
            <Text size="sm" fw={600}>
              {g.context}
            </Text>
            {g.rows.map((row, i) => (
              <Group key={`${g.context}-${i}-${row.action}`} justify="space-between" wrap="nowrap" gap="md">
                <Text size="sm">{row.action}</Text>
                <Group gap={4} wrap="nowrap" justify="flex-end">
                  {row.chords.map((chord, j) => (
                    <Fragment key={`${chord}-${j}`}>
                      {j > 0 && (
                        <Text component="span" size="xs" c="dimmed">
                          or
                        </Text>
                      )}
                      <Kbd>{hotkeyLabel(chord)}</Kbd>
                    </Fragment>
                  ))}
                </Group>
              </Group>
            ))}
          </Stack>
        ))}
      </Stack>
    </Modal>
  );
}
