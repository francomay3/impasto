import type React from 'react';
import { MousePointer2 } from 'lucide-react';
import { RectangleSelect } from './shared/icons/RectangleSelect';
import { EyedropperAdd } from './shared/icons/EyedropperAdd';
import { HOTKEYS } from './hotkeys';

export type ToolId = 'select' | 'marquee' | 'eyedropper';
export type SelectionMode = 'new' | 'add' | 'subtract' | 'intersect';

interface Tool {
  id: ToolId;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  shortcut: string;
  cursor: string;
}

export const TOOLS: Tool[] = [
  { id: 'select', icon: MousePointer2, label: 'Select Mode', shortcut: HOTKEYS.TOOL_SELECT, cursor: 'default' },
  {
    id: 'marquee',
    icon: RectangleSelect,
    label: 'Marquee Select',
    shortcut: HOTKEYS.TOOL_MARQUEE,
    cursor: 'crosshair',
  },
  {
    id: 'eyedropper',
    icon: EyedropperAdd,
    label: 'Sample New Color',
    shortcut: HOTKEYS.ADD_COLOR,
    cursor: 'crosshair',
  },
];
