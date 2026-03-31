import { NumberInput } from '@mantine/core';
import type { NumberInputProps } from '@mantine/core';

type Props = Omit<NumberInputProps, 'size'>;

export function SlimNumberInput({ styles, ...props }: Props) {
  return (
    <NumberInput
      {...props}
      size="xs"
      styles={{
        input: {
          height: 22,
          minHeight: 22,
          fontSize: 'var(--mantine-font-size-xs)',
          paddingRight: 20,
          paddingLeft: 6,
        },
        controls: {
          width: 16,
          height: 20,
        },
        control: {
          height: 0,
          minHeight: 0,
        },
        ...(typeof styles === 'object' ? styles : {}),
      }}
    />
  );
}
