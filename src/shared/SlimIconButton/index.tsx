import { ActionIcon } from '@mantine/core';
import type { ActionIconProps } from '@mantine/core';

type Props = ActionIconProps & React.ComponentPropsWithoutRef<'button'>;

export function SlimIconButton(props: Props) {
  return <ActionIcon size={22} variant="subtle" color="gray" {...props} />;
}
