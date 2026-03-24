import { Group, TextInput, Text, Box } from '@mantine/core';
import { Search } from 'lucide-react';
import { UserMenu } from '../UserMenu';

interface Props {
  search: string;
  onSearch: (value: string) => void;
}

export function DashboardHeader({ search, onSearch }: Props) {

  return (
    <Box
      component="header"
      style={{
        height: 60,
        borderBottom: '1px solid var(--mantine-color-dark-5)',
        background: 'var(--mantine-color-dark-8)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
      }}
    >
      <Group justify="space-between" w="100%">
        <Group gap="sm">
          <img src="/brush.svg" width={36} height={36} alt="Impasto" />
          <Text fw={600} size="lg" style={{ letterSpacing: '-0.3px' }}>Impasto</Text>
        </Group>

        <TextInput
          placeholder="Search projects..."
          value={search}
          onChange={e => onSearch(e.currentTarget.value)}
          leftSection={<Search size={16} />}
          style={{ width: 300 }}
          styles={{ input: { background: 'var(--mantine-color-dark-7)' } }}
        />

        <UserMenu />
      </Group>
    </Box>
  );
}
