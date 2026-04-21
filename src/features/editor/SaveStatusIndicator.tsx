import { Group, Loader, Text } from '@mantine/core';
import { Check, AlertCircle } from 'lucide-react';
import type { PersistenceStatus } from '../../storage/PersistenceGlue';
import type { SaveStatus } from './useSaveStatus';

type Props = { status: SaveStatus | PersistenceStatus };

export function SaveStatusIndicator({ status }: Props) {
  if (status === 'saving') {
    return (
      <Group gap={5} data-testid="save-status">
        <Loader size={11} color="gray.5" type="dots" />
        <Text size="xs" c="gray.5">Saving...</Text>
      </Group>
    );
  }

  if (status === 'error') {
    return (
      <Group gap={5} data-testid="save-status">
        <AlertCircle size={12} color="var(--mantine-color-red-5)" />
        <Text size="xs" c="red.5">Save failed</Text>
      </Group>
    );
  }

  // `PersistenceStatus` uses `idle` / `saved` for the quiet state; legacy editor uses `saved` only.
  return (
    <Group gap={5} data-testid="save-status">
      <Check size={12} color="var(--mantine-color-gray-5)" />
      <Text size="xs" c="gray.5">Saved</Text>
    </Group>
  );
}
