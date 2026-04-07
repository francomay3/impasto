import { createContext, useContext, type RefObject } from 'react';
import type { RawImage } from '../../types';

interface CanvasContextValue {
  sourceImage: RawImage | null;
  filteredCanvasRef: RefObject<HTMLCanvasElement | null>;
  indexedCanvasRef: RefObject<HTMLCanvasElement | null>;
}

const CanvasContext = createContext<CanvasContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useCanvasContext(): CanvasContextValue {
  const ctx = useContext(CanvasContext);
  if (!ctx) throw new Error('useCanvasContext must be used within CanvasContext.Provider');
  return ctx;
}

export { CanvasContext };
