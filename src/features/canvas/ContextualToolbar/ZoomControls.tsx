import { useSyncExternalStore } from 'react';
import { Group, Text } from '@mantine/core';
import { Minus, Plus } from 'lucide-react';
import { useEngine } from '../engine/EngineContext';
import { SlimButton } from '../../../shared/SlimButton';

export function ZoomControls() {
  const engine = useEngine();
  const snap = useSyncExternalStore(engine.subscribe.bind(engine), engine.getSnapshot.bind(engine));
  const pct = Math.round(snap.viewport.scale * 100);

  return (
    <Group gap={2} align="center">
      <SlimButton onClick={() => engine.zoomOut()} aria-label="Zoom out">
        <Minus size={10} />
      </SlimButton>
      <Text size="xs" c="dimmed" w={36} ta="center">{pct}%</Text>
      <SlimButton onClick={() => engine.zoomIn()} aria-label="Zoom in">
        <Plus size={10} />
      </SlimButton>
    </Group>
  );
}
