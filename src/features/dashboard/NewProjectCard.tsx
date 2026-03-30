import { Box, Card, Text } from '@mantine/core';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface Props {
  onCreate: () => void;
}

export function NewProjectCard({ onCreate }: Props) {
  const [hovered, setHovered] = useState(false);

  return (
    <Card
      radius="md"
      padding="sm"
      style={{
        background: 'var(--mantine-color-dark-7)',
        border: `1px solid ${hovered ? 'var(--mantine-color-primary-6)' : 'var(--mantine-color-dark-5)'}`,
        cursor: 'pointer',
        transition: 'border-color 150ms ease',
      }}
      onClick={onCreate}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Card.Section
        style={{
          height: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--mantine-color-dark-6)',
        }}
      >
        <Plus
          size={40}
          strokeWidth={1.5}
          style={{
            color: hovered ? 'var(--mantine-color-primary-4)' : 'var(--mantine-color-dark-3)',
            transition: 'color 150ms ease',
          }}
        />
      </Card.Section>

      <Box h={8} />

      <Text size="sm" fw={500} c="dimmed" mt="xs">
        New project
      </Text>
    </Card>
  );
}
