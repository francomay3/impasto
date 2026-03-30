import { Button } from '@mantine/core';
import type { ButtonProps } from '@mantine/core';

type Props = ButtonProps & React.ComponentPropsWithoutRef<'button'>;

export function SlimButton({ styles, ...props }: Props) {
  return (
    <Button
      size="xs"
      variant="subtle"
      c="dimmed"
      {...props}
      styles={{
        root: {
          height: 22,
          minHeight: 22,
          paddingInline: 8,
          fontSize: 'var(--mantine-font-size-xs)',
        },
        section: {
          marginInlineEnd: 4,
        },
        ...(typeof styles === 'object' ? styles : {}),
      }}
    />
  );
}
