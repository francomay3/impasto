import { useRef, useCallback } from 'react';
import { Button, Group, Text } from '@mantine/core';
import type { RotateController } from './tools/RotateController';

interface Props {
  controller: RotateController;
  angle: number;
  onApply: () => void;
  onCancel: () => void;
}

const angleBadge: React.CSSProperties = {
  position: 'absolute',
  top: 8,
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'rgba(0,0,0,0.6)',
  color: '#fff',
  padding: '2px 8px',
  borderRadius: 4,
  pointerEvents: 'none',
  whiteSpace: 'nowrap',
};

export function RotateOverlay({ controller, angle, onApply, onCancel }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (overlayRef.current) controller.startDrag(e.nativeEvent, overlayRef.current);
    },
    [controller],
  );

  const stopProp = useCallback((e: React.MouseEvent) => e.stopPropagation(), []);

  return (
    <div
      ref={overlayRef}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'auto', cursor: 'ew-resize' }}
      onMouseDown={onMouseDown}
    >
      <Text size="xs" style={angleBadge}>{angle.toFixed(1)}°</Text>
      <Group gap={4} style={{ position: 'absolute', bottom: 8, right: 8, pointerEvents: 'auto' }} onMouseDown={stopProp}>
        <Button size="xs" onClick={onApply}>Apply</Button>
        <Button size="xs" variant="subtle" color="gray" onClick={onCancel}>Cancel</Button>
      </Group>
    </div>
  );
}
