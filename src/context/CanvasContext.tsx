import { createContext, useContext, type RefObject } from 'react';
import type { ViewportTransform } from '../hooks/useViewportTransform';
import type { RawImage } from '../types';

export interface CanvasContextValue {
  sourceImage: RawImage | null;
  filteredCanvasRef: RefObject<HTMLCanvasElement | null>;
  indexedCanvasRef: RefObject<HTMLCanvasElement | null>;
  viewportTransform: ViewportTransform;
  isDragging: boolean;
  isSampling: boolean;
  showLabels: boolean;
  onToggleLabels: () => void;
  onWheel: (e: WheelEvent, rect: DOMRect) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onResetTransform: () => void;
}

const CanvasContext = createContext<CanvasContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useCanvasContext(): CanvasContextValue {
  const ctx = useContext(CanvasContext);
  if (!ctx) throw new Error('useCanvasContext must be used within CanvasContext.Provider');
  return ctx;
}

export { CanvasContext };
