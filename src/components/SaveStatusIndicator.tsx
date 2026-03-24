import { Group, Loader, Text } from '@mantine/core';
import { Check } from 'lucide-react';
import type { SaveStatus } from '../hooks/useSaveStatus';

interface Props {
  status: SaveStatus;
}

export function SaveStatusIndicator({ status }: Props) {
  const saving = status === 'saving';
  return (
    <Group gap={5}>
      {saving
        ? <Loader size={11} color="gray.5" type="dots" />
        : <Check size={12} color="var(--mantine-color-gray-5)" />
      }
      <Text size="xs" c="gray.5">{saving ? 'Saving...' : 'Saved'}</Text>
    </Group>
  );
}
