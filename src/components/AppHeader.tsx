import { AppShell, Group, Title, Button } from '@mantine/core';
import { FileImage, Download } from 'lucide-react';

interface Props {
  hasImage: boolean;
  onExportClick: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function AppHeader({ hasImage, onExportClick, onFileChange }: Props) {
  return (
    <AppShell.Header style={{ background: 'var(--mantine-color-dark-9)', borderBottom: '1px solid var(--mantine-color-dark-6)' }}>
      <Group h="100%" px="md" justify="space-between">
        <Group gap="xs" align="center">
          <img src="/brush.svg" width={26} height={26} />
          <Title order={5}>Impasto</Title>
        </Group>
        <Group gap="xs">
          {hasImage && (
            <Button size="xs" variant="light" leftSection={<Download size={14} />} onClick={onExportClick}>
              Export PDF
            </Button>
          )}
          <Button size="xs" variant="subtle" leftSection={<FileImage size={14} />}
            onClick={() => document.getElementById('file-upload-hidden')?.click()}>
            Load Image
          </Button>
          <input id="file-upload-hidden" type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileChange} />
        </Group>
      </Group>
    </AppShell.Header>
  );
}
