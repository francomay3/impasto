import { forwardRef } from 'react';
import { Button } from '@mantine/core';
import { Plus } from 'lucide-react';

interface Props {
  label: string;
  onClick?: () => void;
}

export const AddItemButton = forwardRef<HTMLButtonElement, Props>(
  ({ label, onClick, ...rest }, ref) => (
    <Button
      ref={ref}
      variant="subtle"
      color="gray"
      size="xs"
      leftSection={<Plus size={14} />}
      fullWidth
      justify="flex-start"
      style={{ border: '1px dashed var(--mantine-color-dark-4)' }}
      onClick={onClick}
      {...rest}
    >
      {label}
    </Button>
  )
);

AddItemButton.displayName = 'AddItemButton';
