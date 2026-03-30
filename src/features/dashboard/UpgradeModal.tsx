import { Modal, Stack, Title, Text, Button, ThemeIcon } from '@mantine/core';
import { Zap } from 'lucide-react';

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function UpgradeModal({ opened, onClose }: Props) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={null}
      centered
      size="sm"
      styles={{ content: { background: 'var(--mantine-color-dark-7)' } }}
    >
      <Stack align="center" gap="md" py="md">
        <ThemeIcon size={56} radius="xl" color="primary" variant="light">
          <Zap size={28} />
        </ThemeIcon>

        <Stack align="center" gap={6}>
          <Title order={3} c="white">
            Unlock more projects
          </Title>
          <Text c="dimmed" size="sm" ta="center">
            Free accounts are limited to 1 project. Upgrade to create unlimited projects.
          </Text>
        </Stack>

        <Button fullWidth color="primary" size="md" disabled title="Coming soon">
          Upgrade — Coming Soon
        </Button>

        <Button variant="subtle" color="gray" size="xs" onClick={onClose}>
          Maybe later
        </Button>
      </Stack>
    </Modal>
  );
}
