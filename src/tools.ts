import type React from 'react';
import { MousePointer2, Hand, Crop, RotateCw } from 'lucide-react';
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

export type FilterToolId = 'pan' | 'crop' | 'rotate';

interface FilterTool {
  id: FilterToolId;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
}

export const FILTER_TOOLS: FilterTool[] = [
  { id: 'pan', icon: Hand, label: 'Pan' },
  { id: 'crop', icon: Crop, label: 'Crop' },
  { id: 'rotate', icon: RotateCw, label: 'Rotate horizon' },
];

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
