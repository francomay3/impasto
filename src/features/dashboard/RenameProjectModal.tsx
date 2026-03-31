import { useState } from 'react';
import { Modal, TextInput, Button, Group } from '@mantine/core';

interface Props {
  opened: boolean;
  name: string;
  onClose: () => void;
  onConfirm: (name: string) => void;
}

export function RenameProjectModal({ opened, name, onClose, onConfirm }: Props) {
  const [nameInput, setNameInput] = useState(name);

  const handleConfirm = () => {
    const trimmed = nameInput.trim();
    if (trimmed && trimmed !== name) onConfirm(trimmed);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Rename project"
      size="sm"
      onClick={(e) => e.stopPropagation()}
    >
      <TextInput
        label="Project name"
        value={nameInput}
        onChange={(e) => setNameInput(e.currentTarget.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
        data-autofocus
        mb="lg"
      />
      <Group justify="flex-end" gap="sm">
        <Button variant="default" onClick={onClose}>Cancel</Button>
        <Button onClick={handleConfirm} disabled={!nameInput.trim()}>Save</Button>
      </Group>
    </Modal>
  );
}
