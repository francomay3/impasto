import type React from 'react';
import { MousePointer2 } from 'lucide-react';
import { RectangleSelect } from './shared/icons/RectangleSelect';
import { EyedropperAdd } from './shared/icons/EyedropperAdd';

export type ToolId = 'select' | 'marquee' | 'eyedropper';

interface Tool {
  id: ToolId;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  shortcut: string;
  cursor: string;
}

export const TOOLS: Tool[] = [
  { id: 'select', icon: MousePointer2, label: 'Select Mode', shortcut: 'V', cursor: 'default' },
  {
    id: 'marquee',
    icon: RectangleSelect,
    label: 'Marquee Select',
    shortcut: 'S',
    cursor: 'crosshair',
  },
  {
    id: 'eyedropper',
    icon: EyedropperAdd,
    label: 'Sample New Color',
    shortcut: 'E',
    cursor: 'crosshair',
  },
];
