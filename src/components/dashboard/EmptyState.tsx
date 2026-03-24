import { Center, Stack, Text, Button } from '@mantine/core';
import { Plus } from 'lucide-react';

interface Props {
  onCreate: () => void;
}

export function EmptyState({ onCreate }: Props) {
  return (
    <Center h="60vh">
      <Stack align="center" gap="md">
        <Text c="dimmed" size="xl">No projects yet</Text>
        <Text c="dimmed" size="sm">Create your first palette project to get started</Text>
        <Button onClick={onCreate} leftSection={<Plus size={16} />} color="teal" size="md">
          New project
        </Button>
      </Stack>
    </Center>
  );
}
