import { forwardRef } from 'react';
import { Button, Text } from '@mantine/core';
import { Plus } from 'lucide-react';

interface Props {
  label: string;
  hint?: string;
  onClick?: () => void;
  style?: import('react').CSSProperties;
}

export const AddItemButton = forwardRef<HTMLButtonElement, Props>(
  ({ label, hint, onClick, ...rest }, ref) => (
    <Button
      ref={ref}
      variant="subtle"
      color="gray"
      size="xs"
      leftSection={<Plus size={14} />}
      rightSection={
        hint ? (
          <Text size="xs" c="dimmed">
            {hint}
          </Text>
        ) : undefined
      }
      fullWidth
      justify={hint ? 'space-between' : 'flex-start'}
      style={{ border: '1px dashed var(--mantine-color-dark-4)' }}
      onClick={onClick}
      {...rest}
    >
      {label}
    </Button>
  )
);

AddItemButton.displayName = 'AddItemButton';
