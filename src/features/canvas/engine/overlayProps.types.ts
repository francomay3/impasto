import type { MouseEvent as ReactMouseEvent } from 'react';
import type { Color, ColorGroup, ColorSample } from '../../../types';
import type { ToolId } from '../../../tools';

export interface EditPin {
  colorId: string;
  position: { x: number; y: number };
}

export interface SamplePinsOverlayProps {
  pins: Color[];
  groups: ColorGroup[];
  selectedIds: Set<string>;
  hoveredId: string | null;
  pinDrag: { colorId: string; currentSample: ColorSample } | null;
  isSampling: boolean;
  viewportScale: number;
  imgWidth: number;
  imgHeight: number;
  onPinMouseDown: (e: ReactMouseEvent, colorId: string) => void;
  onPinClick: (e: ReactMouseEvent, colorId: string) => void;
  onPinMouseEnter: (id: string) => void;
  onPinMouseLeave: () => void;
  onContextMenu: (e: ReactMouseEvent, colorId: string) => void;
}

export interface MarqueeOverlayProps {
  activeTool: ToolId;
  marqueeDrag: { start: { x: number; y: number }; current: { x: number; y: number } } | null;
  onMouseDown: (e: ReactMouseEvent) => void;
  onClick: (e: ReactMouseEvent) => void;
  onMouseMove: (e: ReactMouseEvent) => void;
  onMouseLeave: () => void;
  onContextMenu: (e: ReactMouseEvent) => void;
}

export interface SamplerStateProps {
  radius: number;
  setRadius: (r: number) => void;
  viewportScale: number;
}
