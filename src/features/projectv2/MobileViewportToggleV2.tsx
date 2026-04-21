import { Button } from '@mantine/core';
import { ArrowLeftRight } from 'lucide-react';

interface Props {
  view: 'filtered' | 'indexed';
  onToggle: () => void;
}

// position: absolute so it sits inside the viewport area, not over the sheet
export function MobileViewportToggleV2({ view, onToggle }: Props) {
  return (
    <Button
      size="sm"
      variant="default"
      radius="xl"
      leftSection={<ArrowLeftRight size={13} />}
      onClick={onToggle}
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
        opacity: 0.92,
      }}
    >
      {view === 'filtered' ? 'Filtered' : 'Indexed'}
    </Button>
  );
}
