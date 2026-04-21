import type { ImpastoToolId } from './ToolState';

/**
 * Human-readable hotkey hints for toolbar / dev UI. Keep in sync with chord matching in
 * `../input/engineHotkeys.ts` (and tool-specific bindings on tool classes).
 */
function impastoToolTooltipLines(toolId: ImpastoToolId): readonly string[] {
  switch (toolId) {
    case 'pan':
      return ['H', 'Esc'];
    case 'sample-color':
      return ['C', 'Brush: Cmd/Ctrl + ↑ or ↓ (while this tool is active)'];
    case 'marquee-select':
      return ['V', 'Shift: invert inside marquee', 'Alt: subtract hits from selection'];
  }
}

/** Newline-separated text for simple tooltip labels. */
export function impastoToolTooltipText(toolId: ImpastoToolId): string {
  return impastoToolTooltipLines(toolId).join('\n');
}
