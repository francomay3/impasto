import { Stack, ActionIcon, Tooltip } from '@mantine/core';
import { Hand } from 'lucide-react';
import type React from 'react';
import { EyedropperAdd } from '../../shared/icons/EyedropperAdd';
import { RectangleSelect } from '../../shared/icons/RectangleSelect';
import { useImpastoEngine } from '../../engine/core/ImpastoEngineContext';
import { useImpastoToolsState } from '../../engine/tools/useImpastoToolsState';
import type { ImpastoToolId } from '../../engine/tools/ToolState';

// Icons are UI-only — labels and order come from the engine via allTools.
const TOOL_ICONS: Record<ImpastoToolId, React.ComponentType<{ size?: number }>> = {
  pan: Hand,
  'sample-color': EyedropperAdd,
  'marquee-select': RectangleSelect,
};

/**
 * Floating vertical tool rail over the viewport area.
 * Container is pointer-transparent so canvas gestures underneath are unaffected;
 * only the individual ActionIcon buttons capture pointer events.
 */
export function FloatingToolRail() {
  const engine = useImpastoEngine();
  const { activeTool, allTools } = useImpastoToolsState();

  return (
    <Stack
      gap={4}
      p={6}
      style={{
        position: 'absolute',
        left: 4,
        top: 4,
        zIndex: 10,
        background: 'var(--mantine-color-dark-7)',
        border: '1px solid var(--mantine-color-dark-5)',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.45)',
        // Transparent to pointer so canvas pan/zoom gestures work beneath the rail gap.
        pointerEvents: 'none',
      }}
    >
      {allTools.map((tool) => {
        const Icon = TOOL_ICONS[tool.id];
        const isActive = tool.id === activeTool.id;
        return (
          <Tooltip key={tool.id} label={tool.label} position="right" withArrow>
            <ActionIcon
              variant={isActive ? 'filled' : 'subtle'}
              color={isActive ? 'primary' : 'gray'}
              size="md"
              aria-label={tool.label}
              style={{ pointerEvents: 'auto' }}
              onClick={() => engine.tools.setActiveTool(tool.id)}
            >
              <Icon size={16} />
            </ActionIcon>
          </Tooltip>
        );
      })}
    </Stack>
  );
}
