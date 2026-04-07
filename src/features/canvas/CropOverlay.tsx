import { useRef, useCallback } from 'react';
import { Button, Group } from '@mantine/core';
import type { CropRect } from '../../types';
import type { CropController, CropHandle } from './tools/CropController';

const OVERLAY = 'rgba(0,0,0,0.55)';

const handleBase: React.CSSProperties = {
  position: 'absolute',
  width: 10,
  height: 10,
  background: 'white',
  border: '1px solid rgba(0,0,0,0.4)',
  transform: 'translate(-50%,-50%)',
  pointerEvents: 'auto',
};

const CORNERS: { handle: CropHandle; left: string; top: string; cursor: string }[] = [
  { handle: 'nw', left: '0%', top: '0%', cursor: 'nw-resize' },
  { handle: 'ne', left: '100%', top: '0%', cursor: 'ne-resize' },
  { handle: 'sw', left: '0%', top: '100%', cursor: 'sw-resize' },
  { handle: 'se', left: '100%', top: '100%', cursor: 'se-resize' },
];

interface Props {
  controller: CropController;
  rect: CropRect;
  onApply: () => void;
  onCancel: () => void;
}

export function CropOverlay({ controller, rect, onApply, onCancel }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const { x, y, width, height } = rect;

  const onHandleMouseDown = useCallback(
    (handle: CropHandle) => (e: React.MouseEvent) => {
      e.stopPropagation();
      if (overlayRef.current) controller.startDrag(handle, e.nativeEvent, overlayRef.current);
    },
    [controller],
  );

  return (
    <div ref={overlayRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: `${y * 100}%`, background: OVERLAY }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${(1 - y - height) * 100}%`, background: OVERLAY }} />
      <div style={{ position: 'absolute', top: `${y * 100}%`, left: 0, width: `${x * 100}%`, height: `${height * 100}%`, background: OVERLAY }} />
      <div style={{ position: 'absolute', top: `${y * 100}%`, right: 0, width: `${(1 - x - width) * 100}%`, height: `${height * 100}%`, background: OVERLAY }} />
      <div
        style={{ position: 'absolute', left: `${x * 100}%`, top: `${y * 100}%`, width: `${width * 100}%`, height: `${height * 100}%`, border: '1px solid rgba(255,255,255,0.8)', cursor: 'move', pointerEvents: 'auto', boxSizing: 'border-box' }}
        onMouseDown={onHandleMouseDown('move')}
      >
        {CORNERS.map(({ handle, left, top, cursor }) => (
          <div key={handle} style={{ ...handleBase, left, top, cursor }} onMouseDown={onHandleMouseDown(handle)} />
        ))}
      </div>
      <Group gap={4} style={{ position: 'absolute', bottom: 8, right: 8, pointerEvents: 'auto' }}>
        <Button size="xs" onClick={onApply}>Apply</Button>
        <Button size="xs" variant="subtle" color="gray" onClick={onCancel}>Cancel</Button>
      </Group>
    </div>
  );
}
