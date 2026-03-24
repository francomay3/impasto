import { Button } from '@mantine/core';
import { Plus } from 'lucide-react';

interface Props {
  label: string;
  onClick?: () => void;
}

export function AddItemButton({ label, onClick }: Props) {
  return (
    <Button
      variant="subtle"
      color="gray"
      size="xs"
      leftSection={<Plus size={14} />}
      fullWidth
      justify="flex-start"
      style={{ border: '1px dashed #333' }}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}
