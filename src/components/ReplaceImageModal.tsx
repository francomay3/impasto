import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Modal, Text, Button, Group, Stack } from '@mantine/core';
import { useNavigate } from 'react-router-dom';

interface Props {
  hasSamples: boolean;
  onFileSelected: (file: File) => void;
}

export interface ReplaceImageModalRef {
  open: () => void;
}

export const ReplaceImageModal = forwardRef<ReplaceImageModalRef, Props>(
  function ReplaceImageModal({ hasSamples, onFileSelected }, ref) {
    const navigate = useNavigate();
    const [opened, setOpened] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      open() {
        if (hasSamples) setOpened(true);
        else inputRef.current?.click();
      },
    }), [hasSamples]);

    const handleFile = (file: File) => {
      if (!file.type.startsWith('image/')) return;
      setOpened(false);
      onFileSelected(file);
    };

    return (
      <>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
        />
        <Modal opened={opened} onClose={() => setOpened(false)} title="Replace image?" size="sm" centered>
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              Replacing the image will clear your entire palette and all filters.
              Consider creating a new project to preserve your current work.
            </Text>
            <Group justify="flex-end" gap="sm">
              <Button variant="subtle" onClick={() => setOpened(false)}>Cancel</Button>
              <Button variant="light" onClick={() => navigate('/')}>New Project</Button>
              <Button color="red" variant="light" onClick={() => { setOpened(false); inputRef.current?.click(); }}>
                Replace Anyway
              </Button>
            </Group>
          </Stack>
        </Modal>
      </>
    );
  }
);
