import { Tooltip } from '@mantine/core';
import type { Color, ColorGroup, ColorSample } from '../../types';

const DOT_R = 6;
const HIT_R = DOT_R + 5;

interface Props {
  color: Color;
  group: ColorGroup | undefined;
  isSelected: boolean;
  isHovered: boolean;
  activeSample: ColorSample;
  isDragging: boolean;
  inv: number;
  onMouseDown: (e: React.MouseEvent, colorId: string) => void;
  onClick: (e: React.MouseEvent, colorId: string) => void;
  onMouseEnter: (colorId: string) => void;
  onMouseLeave: () => void;
  onContextMenu: (e: React.MouseEvent, colorId: string) => void;
}

export function SamplePin({
  color,
  group,
  isSelected,
  isHovered,
  activeSample,
  isDragging,
  inv,
  onMouseDown,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onContextMenu,
}: Props) {
  const { x, y, radius } = activeSample;
  const tooltipLabel =
    group ? `${color.name || color.hex}\n${group.name}` : color.name || color.hex;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {radius > DOT_R * inv && (
        <circle r={radius} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={1.5 * inv} />
      )}
      <Tooltip
        label={<span style={{ whiteSpace: 'pre-line' }}>{tooltipLabel}</span>}
        openDelay={300}
        withinPortal
      >
        <g
          transform={`scale(${inv})`}
          style={{ pointerEvents: 'auto', cursor: isDragging ? 'grabbing' : 'grab' }}
          onMouseDown={(e) => onMouseDown(e, color.id)}
          onClick={(e) => onClick(e, color.id)}
          onMouseEnter={() => onMouseEnter(color.id)}
          onMouseLeave={onMouseLeave}
          onContextMenu={(e) => onContextMenu(e, color.id)}
        >
          <circle r={HIT_R} fill="transparent" />
          <circle
            r={DOT_R}
            fill={color.hex}
            stroke={
              isSelected
                ? 'var(--mantine-color-primary-4)'
                : isHovered
                  ? 'var(--mantine-color-secondary-4)'
                  : 'white'
            }
            strokeWidth={isSelected || isHovered ? 3 : 2}
          />
        </g>
      </Tooltip>
    </g>
  );
}
